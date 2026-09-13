# Selector lookup deep-dive

Read this before you write internal code that looks up an element, and before you change
[`up.Selector`](../../src/unpoly/classes/selector.js),
[`up.FragmentFinder`](../../src/unpoly/classes/fragment_finder.js) or the lookup functions in
[`src/unpoly/fragment.js`](../../src/unpoly/fragment.js).

The short version: **prefer `up.fragment.*` over native `querySelector()` when you are
looking for a fragment.** A native query silently ignores everything Unpoly adds — most
damagingly, it will happily return an element in a *different layer*, which is a bug that
only appears once a user opens an overlay.

This is a convention rather than a lint rule, and it is not absolute. Plenty of native
queries in `src/unpoly` are correct because what they want really is "this DOM subtree":
finding assets in `<head>`, `[up-keep]` elements inside a step's own old element, a `<video>`
inside an element you already hold. There is even a deliberate cross-layer lookup in
`up.viewport.closest()`, with a comment explaining that finding a viewport in a parent layer
is intended — a popup has no viewport of its own. The rule of thumb: if the answer should
depend on layers, liveness or Unpoly's custom selectors, go through `up.fragment`.

<!-- toc -->
- [Why we have our own lookup engine](#why-we-have-our-own-lookup-engine)
- [Which entry point does what](#which-entry-point-does-what)
- [What `up.Selector` does when you construct it](#what-upselector-does-when-you-construct-it)
  - [Failing to resolve a layer: two different errors](#failing-to-resolve-a-layer-two-different-errors)
  - [Order is a guarantee, not an accident](#order-is-a-guarantee-not-an-accident)
  - [Root handling is inconsistent — know it before you trust it](#root-handling-is-inconsistent--know-it-before-you-trust-it)
- [Layer scoping defaults to one layer](#layer-scoping-defaults-to-one-layer)
- [The custom selectors, and where each is resolved](#the-custom-selectors-and-where-each-is-resolved)
  - [Not every pseudo is a matcher](#not-every-pseudo-is-a-matcher)
- [Origin and region awareness](#origin-and-region-awareness)
- [Expansion during rendering](#expansion-during-rendering)
- [Working here](#working-here)
<!-- /toc -->


## Why we have our own lookup engine

`up.fragment`'s module documentation lists three differences from the DOM API, and the
`up.fragment.get()` documentation adds a fourth. Each is a bug waiting to happen if you
bypass it:

| | Native `querySelector()` | `up.fragment` lookups |
|---|---|---|
| Layers | Searches the whole document | Only the current layer, unless `{ layer }` says otherwise |
| Dying elements | Returns elements mid-destruction, still animating out | Skips them |
| Selectors | CSS only | Also `:main`, `:layer`, `:origin` |
| Ambiguity | Always document order | `up.fragment.get()` prefers a match near the `{ origin }` |

`up.element` is the low-level companion: no notion of layers or fragments, the right tool for
DOM mechanics inside a root you already hold.


## Which entry point does what

There is no single lookup function, and the differences are not cosmetic. Region awareness in
particular is **not** automatic — it depends on which entry point you call.

| Entry point | Engine | Region-aware? |
|---|---|---|
| `up.fragment.get(selector)` — no root | `up.FragmentFinder` | **Yes** |
| `up.fragment.get(root, selector)` — with a root | `up.Selector` | No, deliberately |
| `up.fragment.all()`, `.subtree()`, `.closest()`, `.matches()` | `up.Selector` | No |
| `up.fragment.getFirstDescendant()` | `up.Selector` | No — this is the explicit "just the first match" entry point |
| Render steps (`up.Change.UpdateLayer#_matchOldElements()`) | `up.FragmentFinder` | Yes |
| Response matching (`up.ResponseDoc#select()`) | `up.FragmentFinder` | Yes, against a *rediscovered* origin |

So the two classes are layered, not parallel: **`up.FragmentFinder` is a strategy on top of
`up.Selector`.** It decides *which* match to prefer, and delegates every actual match back
down (through `up.fragment.closest()` and `getFirstDescendant()`).

Two consequences that catch people out: `up.fragment.all('.card')` never prefers anything
near the origin, and `up.fragment.get(container, '.card', { origin })` ignores the origin
too — the source says why, *"We don't match around { origin } if we're given a root for the
search"*.


## What `up.Selector` does when you construct it

The constructor does the work up front; `matches()`, `closest()`, `descendants()`,
`firstDescendant()` and `subtree()` then reuse it.

1. **Install the liveness filter.** `up.fragment.isNotDestroying`, unless `{ destroying: true }`
   was passed or we are matching in an external/detached document — an `up.ResponseDoc` has no
   dying elements to speak of.
2. **Decide whether layers matter at all.** They are ignored in three cases: the root element
   is detached or from another document, `{ layer: 'any' }` was passed, or only one layer
   exists.
3. **Resolve the layers to search.** If a root *element* was given (as in
   `up.fragment.closest(element, …)`), its layer is the default. Otherwise
   `up.layer.getAll(options)` applies the cascade below. Note this resolves a layer **set** —
   `{ layer: 'overlays' }` or `{ layer: '1 3' }` legitimately yield several — and adds a
   containment filter for them.
4. **Expand custom selectors** via `up.fragment.expandTargets()`, producing a list of plain
   CSS selectors that is also joined into one union selector for the cheap operations. The
   layer used for expansion is the first resolved layer — or the **root layer** when layers
   are being ignored, since then there are no resolved layers to pick from.

If `up.fragment.config.mainTargets` is configured empty, `:main` expands to nothing and the
union selector becomes the literal `'match-none'`, so the lookup reliably finds nothing
instead of accidentally matching everything.

### Failing to resolve a layer: two different errors

This distinction decides whether a render pass falls through to the next plan or dies:

- A layer reference that resolves to **no layer** (`{ layer: 3 }` on a two-layer stack)
  throws `up.CannotMatch` — which `up.Change.FromContent` swallows to try the next plan.
- An **unknown layer keyword** fails earlier, in `up.LayerLookup`, via `up.fail()`. That is a
  plain `up.Error`, *not* caught by the plan loop, so it aborts the whole pass.

### Order is a guarantee, not an accident

`firstDescendant()` deliberately runs one query *per* expanded selector instead of one query
for the union, because two orderings have to be respected:

- **Earlier selectors win.** `:main` may expand to several candidates, and the earlier one
  must win even if a later one comes first in the document.
- **Earlier layers win.** With `{ layer: 'current root' }`, a match in `current` beats a match
  in `root`.

Both are pinned by specs in `spec/unpoly/fragment_lookup_spec.js` ("prioritizes earlier main
targets", and the `{ layer: '1 3' }` / `{ layer: '3 1' }` pair). Don't collapse the loop into
a single union query without changing those.

### Root handling is inconsistent — know it before you trust it

- `descendants()` uses `querySelectorAll`, so the root is **excluded**; `subtree()` uses
  `up.element.subtree()`, so the root is **included**.
- `firstDescendant()` **ignores its `root` argument entirely** whenever layers are considered:
  that branch searches `layer.element`'s subtree, not yours. On a single-layer page (where
  layers are ignored) the root *is* honoured, so `up.fragment.get(root, sel)` appears to be
  root-scoped until someone opens an overlay. The existing root-scoping specs run
  single-layer, and the two-layer ones nearby use a detached root, which also takes the
  ignore-layers branch — so this is under-covered, and looks like a live bug rather than a
  decision.


## Layer scoping defaults to one layer

Which layer(s) a lookup searches is decided by `up.layer.normalizeOptions()`, in this order:

1. An explicit `{ layer }` — including the `'new'`, `'swap'` and `'shatter'` shorthands that
   mean "open one".
2. Otherwise, if `{ target }` is an actual Element, **that element's layer**.
3. Otherwise, if an `{ origin }` element was given, `'origin'` — links and forms update their
   own layer by default.
4. Otherwise `'current'`.

Step 4 is the important default, and the source says why: *"If no options.layer is given we
still want to avoid updating 'any' layer."* Opting out is explicit and rare: `{ layer: 'any' }`.


## The custom selectors, and where each is resolved

Three pseudo selectors are Unpoly's own. All are resolved in `up.fragment.expandTargets()`,
by different mechanisms:

| Selector | Expands to | Resolved by |
|---|---|---|
| `:main` | every entry of `up.layer.mainTargets(mode)`, as *separate* candidates | `expandTargets()`, looping until no `:main` remains |
| `:layer` | a derived target for the layer's first swappable element | `expandTargets()`, via `layer.getFirstSwappableElement()` |
| `:origin` | a derived target for the `{ origin }` element | `resolveOrigin()`, called from `expandTargets()` |

Worth having:

- `:main` is a *one-to-many* expansion; the others are one-to-one. A target of `true` is
  shorthand for `:main`.
- **`:main` expands recursively.** The default `mainTargets` is
  `["[up-main='']", 'main', ':layer']`, so expanding `:main` yields a `:layer` entry that the
  same loop expands on a later pass — which is how `<body>` ends up as the last-resort main
  target on the root layer. `u.uniq()` dedupes the result.
- `:layer` is skipped both for `{ layer: 'new' }` and for a layer still in state `'opening'`.
- `:origin` **fails loudly** if no `{ origin }` was passed, rather than matching nothing — a
  silently dropped `:origin` would produce a baffling fallback later. `resolveOrigin()` is
  applied to every plain string target, not just ones containing `:origin`.
- `expandTargets()` also accepts an Element or jQuery collection and converts it with
  `toTarget()`.
- `:layer` and `:origin` both rely on *target derivation* — turning an element back into a
  selector that matches it — which has its own rules and failure modes; see
  [`target-derivation.md`](../../src/unpoly/pages/target-derivation.md).

Beyond the pseudos, much matching is **configured** rather than hard-coded.
`up.Config#selector()` builds one union selector from a config list plus its `no…`
counterpart, as used for `hungrySelectors`, `assetSelectors`, `fieldSelectors`,
`followSelectors` and others. When you need to match "the kind of element the user
configured", use that so configuration and negation keep working. Note `:main` is *not* one of
these: `up.layer.mainTargets()` deliberately returns an unmerged candidate list, because
precedence and per-candidate plans depend on the order.

### Not every pseudo is a matcher

Targets also carry pseudos that never reach the DOM: `:before`, `:after` and `:content` set a
step's placement, `:maybe` marks a step optional, and `:none` means "render nothing".
`up.fragment.parseTargetSteps()` strips these while building steps. If you add a pseudo,
decide which kind it is — a matcher belongs in `expandTargets()`, a step modifier in
`parseTargetSteps()`.


## Origin and region awareness

When a selector is ambiguous — three `.card` elements on the page — Unpoly prefers the one
near the element the user interacted with. The user-facing rules are
[resolving ambiguous selectors](../../src/unpoly/pages/targeting-fragments.md#ambiguous-selectors);
the implementation is `up.FragmentFinder#find()`, which tries three strategies in order:

1. **Preferred elements.** If `{ preferOldElements }` was passed, reuse one — but only if it
   is still in the document *and* still matches the selector. This is how cache revalidation
   updates the same fragments the first pass did, even when the origin has since been
   detached (see [Rendering](rendering.md#revalidation-or-the-second-render-pass)).
2. **The origin's region**, but only when `{ match: 'region' }` (the default, from
   `up.fragment.config.match`), the selector contains no `:main`, and the origin is still
   connected. Two sub-strategies:
   - the **origin itself or its closest ancestor** matching the selector, so a link inside the
     second `.card` updates that card;
   - failing that, a **descendant within the region**. Each comma-separated token is split at
     its first space — and only if the parent part contains no space, `>`, `+` or `(`, so
     `.card > .card-text` is *not* eligible. The closest `.card` to the origin is found, then
     `.card-text` inside it. Note this branch does not forward the lookup options, so
     `{ destroying }` and layer options are dropped in it.
3. **The first match**, via `getFirstDescendant()` — which means the two precedence rules
   above (expanded-selector order, then layer order) still apply. It is not raw document
   order.

`{ match: 'first' }` skips step 2 entirely.

Region matching is **not** limited to the current page. `up.ResponseDoc` runs the same finder
against the response document, using a *rediscovered* origin: it derives a selector for the
origin and looks that up inside the response. If the origin can't be derived or re-found, the
response lookup degrades to "first match" — which is why `up.FragmentFinder` takes a
`{ document }` option at all. `:main` stays excluded on purpose, since a main target is by
definition not resolved by proximity.


## Expansion during rendering

Rendering is where expansion becomes visible: `:main` becomes one candidate per configured
main target, and `up.Change.FromContent` turns **each candidate into its own plan**, tried in
order. That is why a page whose `[up-main]` element is missing still updates `main`, or
ultimately `<body>`, without anyone asking for a fallback. See
[Rendering](rendering.md#plans-and-why-a-pass-can-change-its-mind).


## Working here

- **A lookup bug is usually a scoping bug.** When an element is found that shouldn't be, check
  which layer the lookup resolved to before suspecting the selector.
- **`up.layer.count === 1` hides layer bugs**, and changes behavior beyond filtering — it
  switches `firstDescendant()` to the branch that honours the `root` argument. Anything
  layer-sensitive needs a spec with a real overlay; see `makeLayers()` in
  [Testing](testing.md).
- **Two more lookup modes exist** that this guide doesn't cover: `up.fragment.trackSelector()`
  / `up.SelectorTracker` for "match now and as elements appear", and the special cases where
  an Element is passed *as the selector* (`up.fragment.matches()` derives a target for it;
  `up.fragment.get(root, element)` returns it unfiltered, destroying or not).
- **Ordering is specified.** Before simplifying the multi-query loop in
  `up.Selector#firstDescendant()`, read the comment above it and the `:main` precedence specs.
