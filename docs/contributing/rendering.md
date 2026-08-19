# Rendering core deep-dive

Read this before you touch `up.render()` or anything in `src/unpoly/classes/change/`.
If you are working on any other part of Unpoly, you don't need it: the rendering core is
reached through a small public surface, and the rest of the library treats it as a black
box.

Almost every Unpoly feature ends up calling `up.render()`. Following a link, submitting a
form, polling, preloading, opening an overlay: all of it funnels through here. That makes
this the subsystem where a small change has the widest blast radius.


## Why it is intricate

A render pass has to survive a lot of uncertainty:

- The target may match **several elements**, in **several layers**, or none.
- The response may not contain the target we asked for, so we fall back.
- `[up-hungry]` elements join a pass they were never targeted by — possibly on another layer.
- One response may update a fragment, open a layer *and* close another.
- A cached response can render immediately and then **render a second time** after revalidation.
- The user keeps interacting while a request is in flight, so passes abort each other.
- The network fails, or answers with an error status that we must render into a *different* target.

Most of the complexity is not the DOM swap. It is deciding *what* to swap before and after
the response arrives.


## Start from the outside

Before reading the internals, know the lifecycle we promise to users. It is documented as a
guide page, [`render-lifecycle.md`](../../src/unpoly/pages/render-lifecycle.md), which opens
with a [diagram of the whole sequence](../../src/unpoly/pages/images/render-lifecycle.svg) —
every stage, edge case and error state on one page. That page is the contract; the classes
below are how we keep it. It also names the hooks that constrain the implementation
(`up:fragment:loaded`, `onRendered`, `{ onFinished }`, `up:fragment:aborted`), which is what
tells you whether a change of yours is observable.


## The path through the code

For a request-backed pass, control moves through *all* of these in turn:

```
up.render()
  └─ up.RenderJob#_executePromise()   guard event, preprocess options, confirm
      └─ up.Change.FromURL            preflight props → request → response
          └─ up.Change.FromResponse   fail options, server headers, revalidation hook
              └─ up.Change.FromContent          expands options into plans
                  └─ up.Change.UpdateLayer      plan → steps  (or OpenLayer)
                      └─ up.Change.UpdateSteps  the actual swaps
```

`up.render()` returns an [`up.RenderJob`](../../src/unpoly/classes/render_job.js) — the
promise-like object callers await. It resolves with an `up.RenderResult` describing what was
actually updated, and exposes a second promise, `.finished`, that waits for animations and
revalidation to settle too.

Which *change* the job starts with depends on where the content comes from
(`up.RenderJob#_getChange()`):

| option | change class |
|---|---|
| `{ url }` | `up.Change.FromURL` |
| `{ response }` | `up.Change.FromResponse` |
| local content (`{ fragment }`, `{ content }`, `{ document }`) | `up.Change.FromContent` |

These are entry points, not alternatives — a `{ url }` pass passes through every row below
it. The classes live in
[`src/unpoly/classes/change/`](../../src/unpoly/classes/change/) and extend `up.Change`.
Note that there are two different contracts among them: the top-level changes implement
`execute()` with no arguments, while a *plan* (`UpdateLayer`, `OpenLayer`) implements
`execute(responseDoc, onApplicable)` **and** `getPreflightProps()`. If you add a change
class, pick the right one.

`up.Change.FromURL` carries more than the table suggests. It derives the request from the
options (see preflight below), owns preloading, and turns a failed network into
`up:fragment:offline` with a `retry()` the user can call.


## Plans, and why a pass can change its mind

`up.Change.FromContent` does the negotiating. It expands the options into a list of
**plans** — one per layer per target — first for `{ target }`, then for `{ fallback }`:

```
{ target: '.content', fallback: 'main', layer: 'current' }
  → plan 1: update '.content' in the current layer
  → plan 2: update 'main' in the current layer
```

It then tries each plan in turn. A plan that cannot find its element throws
`up.CannotMatch`, which is the signal to try the next one; any other error aborts the pass.
When a fallback wins, Unpoly logs it — that log line is usually the fastest way to
understand a surprising update:

```
[up.render()] Could not match primary target ".content". Updating a fallback target "main".
```

Each plan is either an `up.Change.UpdateLayer` or, for `{ layer: 'new' }`, an
`up.Change.OpenLayer`. (`up.Change.CloseLayer` is *not* a plan — it is reached through
`layer.accept()` / `layer.dismiss()`.)


## Steps, and matching twice

`up.Change.UpdateLayer` parses its target into **steps** — one per element to replace,
carrying the old element, the new element and a placement (`swap`, `content`, `before`, …).
Because a comma-separated target updates several fragments as one atomic pass, steps are the
unit that later code works with, not selectors.

Matching happens **twice**, and this is the distinction worth internalising:

- **Preflight** (`_matchPreflight()`), before there is a response: which old elements exist?
  This decides what to request, which requests to abort, and whether the plan is viable at
  all. An unmatched step is dropped if it is optional (`foo:maybe`, or a hungry step);
  otherwise it throws `up.CannotMatch` and the plan is discarded.
- **Postflight** (`_matchPostflight()`), against the response document: which new elements
  did the server actually send? Steps whose new element is missing are dropped or fail here.

"The response document" is an [`up.ResponseDoc`](../../src/unpoly/classes/response_doc.js),
and it does more than parse HTML. It matches steps against itself (`selectSteps()`), adopts
CSP nonces, and *detaches* each new element as it is committed, so a later hungry step
cannot steal an element that is already spoken for.

Preflight has a concrete mechanism worth knowing: `up.Change.FromURL` builds a **throwaway**
`FromContent({ preflight: true })` — twice, once for success options and once for
`deriveFailOptions()` — purely to derive `X-Up-Target` / `X-Up-Fail-Target`, the mode, the
context and the fragments to bind the request to. So the plan machinery runs once before the
request exists, with its results discarded.

`up.Change.UpdateSteps` then performs the swaps, **in reverse order**, and only the first
step handles focus and scrolling — worth remembering before you add per-step behavior.
`up.Change.Addition` is the base class for everything that inserts content, and carries the
concerns that outlive the swap: honouring a server's request to accept or dismiss a layer,
and stamping each new fragment with the `[up-source]`, `[up-time]` and `[up-etag]` attributes
that later reloads and revalidation depend on (`setReloadAttrs()`).


## One options object, refined in stages

There is no separate config object per stage. Conceptually one render-options object travels
the whole pass, each stage adding to it or overriding it. (Literally, stages copy or
re-derive it — `finalize()` returns a new object, and `FromContent` copies it per plan — so
don't expect a mutation in one stage to be visible in another.) Knowing *where* an option
acquires its value is most of debugging "why did it render that?".

| Stage | What happens to the options |
|---|---|
| `up.RenderJob#_executePromise()` | The guard event is emitted **first**, on raw options — so `up:link:follow` and `up:form:submit` listeners see shorthands like `{ layer: 'new modal' }` unexpanded. Only then `up.RenderOptions.preprocess()` normalizes layer references, renames `use`-prefixed keys (`useKeep` → `keep`), and merges `config.renderOptions` plus, with `{ navigate: true }`, `config.navigateOptions`. It keeps the merged defaults in a `{ defaults }` prop, and resolves `{ origin }` to an `originLayer` *before* the request, since the origin may be gone by the time the response arrives. |
| `up:fragment:loaded` listeners | User code may mutate the options here, or force `{ fail }` either way. This is the documented escape hatch for responses that can't be rendered as a fragment. |
| `up.Change.FromResponse` | *Then* success or fail options are picked. With `{ failOptions }` (a `config.renderOptions` default), `deriveFailOptions()` re-derives the object from the defaults plus the `fail`-prefixed keys; without it — as in `up.validate()` — the success options are kept and only the `fail`-prefixed keys override individually. |
| `_augmentOptionsFromResponse()` | The server's turn — see the layers section below. |
| `up.Change.FromContent` | Expands the object into one *plan* per layer per target. |
| `up.Change.UpdateLayer` / `OpenLayer` | `up.RenderOptions.finalize()` applies the defaults deliberately withheld until now (`LATE_KEYS`: `history`, `focus`, `scroll`), because an overlay's own config may have a better one. `OpenLayer` merges the layer config first, then finalizes. |


## Hungry elements join late, and may live on another layer

`[up-hungry]` elements are not part of the target. They are collected by
`up.radio.hungrySteps()` and pushed onto the step list **in postflight, not preflight** — so
they never influence what we request, nor whether a plan is viable. A pass that fails to
match its target fails whether or not a hungry element could have been updated. They *do*
end up inside the `{ abort: 'target' }` set, though, because that is computed from the step
list after postflight.

Their steps are built to be unobtrusive: `maybe: true` so a missing new element is silently
skipped rather than failing the pass, `placement: 'swap'` always, `keep: true` so `[up-keep]`
is honoured even though they inherit no default render options, and their own motion options
read off the element.

`hungrySteps()` returns them split in two, `{ current, other }`, and that split is where the
"one pass, one layer" assumption breaks. A render pass normally updates a single layer. But
`[up-hungry][up-if-layer]` lets an element opt into passes on *other* layers — a flash
message container on the root layer can absorb content from a response rendered into an
overlay. Elements are scanned in the order `[renderLayer, ...ancestors, ...descendants]`, so
when two hungry elements on different layers want the same new element, the render layer wins
first, then ancestors (closest first), then descendants (closest first).

The other-layer steps normally run **after** the current layer's
(`_renderOtherLayers()`, on both `UpdateLayer` and `OpenLayer`). The interesting case is when
the pass closes the very layer it renders into: a listener on
`up:layer:accepting up:layer:dismissing` pulls that work forward, so the other layers are
updated *before* the teardown. That is what lets a server response accept an overlay and
still deliver a flash message to the layer underneath, and lets `onAccepted` / `onDismissed`
handlers observe it. The call is memoized so it happens exactly once either way.

> Note: the comment above `_renderOtherLayers()` in the source claims we execute other
> layers first. That is misleading — read the array literal in `execute()` instead.


## Rendering can open and close layers

A render pass is not confined to swapping fragments in the layer stack it found. It can
change the stack in three ways.

**Peeling** closes overlays *above* the layer being updated. `up.Change.UpdateLayer` calls
`this.layer.peel()`, which dismisses all descendants of that layer, front-most first. The
rationale is that the stack must stay a meaningful sequence: updating a fragment underneath
three overlays would otherwise leave the user staring at overlays built on content that no
longer exists. `peel: 'dismiss'` is a **navigate** default, so following a link peels while a
bare `up.render({ target, content })` does not. `OpenLayer` is different: it peels its base
layer *unconditionally* — `{ peel: false }` cannot prevent it, because the stack must remain
a sequence; the option only chooses the intent.

**The server can close a layer.** `up.Change.Addition#handleLayerChangeRequests()` tries the
close reasons in a fixed order — `X-Up-Accept-Layer`, then the `{ acceptLocation }` close
condition, then accept-triggering elements in the new content, then the same three for
dismissal — calling `layer.assertAlive()` after each, so the first reason that closes the
layer stops the rest. Two things about it are easy to get wrong:

- It runs **before** the content is inserted, against the *matched* new elements. `OpenLayer`
  says so explicitly: only if this does not abort do we put content in the overlay. So a
  response that closes its own overlay never renders into it.
- Closing this way throws `up.Aborted`, so the render promise **rejects**. It does not
  resolve with an empty result.

Only those six close checks are gated on the layer being an overlay. The `X-Up-Events` loop
in the same method runs for any layer — and a listener there can close a layer too.

**The server can open one.** An `X-Up-Open-Layer` response header makes
`_augmentOptionsFromResponse()` rewrite the pass into an overlay: it clears the original
`{ target }` (which may no longer be appropriate), applies `config.navigateOptions` so
history, focus and a fallback target work, merges whatever the header specified, and then
forces `{ layer: 'new' }`. A request that expected to update a fragment in place therefore
becomes an `up.Change.OpenLayer`.

The same method folds the rest of the response into the options: `X-Up-Target` overrides the
target, `X-Up-Context` merges into the context, `X-Up-Title` and the response URL feed
history, and `ETag` / `Last-Modified` are recorded (only with `??=`, so an explicit option
wins) for `Addition#setReloadAttrs()` to stamp later. For a non-GET response it sets
`{ source: 'keep' }` — the fragment keeps the *previous* source, so it stays reloadable from
the old GET URL rather than from the URL that was POSTed to — and allows history only if an
explicit `{ location }` was given.


## Revalidation, or the second render pass

When a pass renders content that came from the cache, Unpoly can render *again* with a fresh
copy. This is the one place where a single `up.render()` call produces two passes, two
`up:fragment:inserted` events and two sets of compiler runs, so it surprises people.

The mechanism is a hook rather than a loop. `up.Change.FromResponse` puts a `verifyFinished`
callback on the render options; `up.RenderResult#_finish()` awaits every `finished` promise
(animations, transitions) and *then* calls it. So revalidation is sequenced after the visible
pass has settled, which is why it is observable through `.finished` but not through the
promise `up.render()` itself resolves with.

`up.fragment.shouldRevalidate()` gates it: the response must have come from the cache
(`request.fromCache`) and `{ revalidate }` must say yes. `revalidate: 'auto'` is a navigate
default and `config.autoRevalidate` is `(response) => response.expired`, so in practice
navigation revalidates expired cache hits and nothing else.

The second pass is a deliberately constrained `up.reload()`:

- It reuses the target we *actually* rendered, not the one that was requested, and passes
  `preferOldElements: renderResult.fragments` so it updates the same elements even if the
  original pass matched around an `{ origin }` that is now detached.
- It targets `renderResult.layer`, so a pass that opened an overlay revalidates into that
  overlay.
- Motion and input interference are switched off; previews are too, unless
  `{ revalidatePreview }` asked for them back. `{ abort: false }` keeps it from aborting
  anything and `{ background: true }` keeps it out of progress feedback, while `{ feedback }`
  is deliberately kept for the `.up-revalidating` class.
- `{ cache: false }` stops it revalidating recursively, while still updating the stale entry.

If the second pass renders nothing, the original `up.RenderResult` is kept as the final
result. That happens on a `304 Not Modified`, but more often through
`config.skipResponse`, whose default compares the fresh text against the expired response and
skips an identical one. Finally, a target containing `:before` or `:after` cannot be
revalidated — appending twice would duplicate content — and Unpoly warns instead. Note the
check looks at the *requested* target, not the one that was rendered.


## Aborting

`{ abort: 'target' }` is a plain `config.renderOptions` default, so aborting is not a
navigation-only concern. Two mechanisms overlap:

- **The `{ abort }` option**, applied by a memoized `handleAbort` so it fires exactly once —
  but at a different moment per path. For `{ url }` it runs before the response arrives,
  excluding the new request itself; for local content it runs only once a plan is applicable,
  which is why hungry fragments are included there.
- **Independently**, `UpdateLayer` aborts requests targeting the fragments it is about to
  replace, with the reason `'Fragment is being replaced'`. This one is not driven by
  `{ abort }` at all.

Closing a layer also aborts requests targeting it.


## Errors and results

The taxonomy matters here, because throwing the wrong error changes control flow:

| Thrown | Meaning |
|---|---|
| `up.CannotMatch` | This plan doesn't apply — try the next one. Swallowed by `FromContent`. |
| `up.Aborted` | The pass is over (a layer closed, or something aborted it). Propagates. |
| `up.Offline` | The network failed; becomes `up:fragment:offline` with `event.retry()`. |
| `up.CannotParse` | The response's content type is not renderable. |

Note also the convention that surprises everyone once: a **failed response rejects with an
`up.RenderResult`, not an `Error`**. Rendering a 422 into `failTarget` is a success as far as
the DOM is concerned, and a rejection as far as the caller is concerned.


## Working here

- **Read the log.** `up.log.enable()` in the console exposes the plan and fallback decisions
  described above. In the terminal runner, `--verbose` prints the browser log for *failing*
  specs — it is a post-mortem, not a live trace.
- **Specs are split by option.** `up.render()`'s specs span more than a dozen files —
  `fragment_render_url_spec.js`, `fragment_render_history_spec.js`, and so on. Use
  `bin/find-spec "up.render()"` to list them, and see
  [Testing](testing.md#finding-the-spec-for-a-feature).
- **Expect to touch two layers of abstraction.** A bug in "what gets updated" usually lives
  in `FromContent` (plans) or `UpdateLayer` (steps); a bug in "how it gets updated" lives in
  `UpdateSteps` or `Addition`.
- **Check the lifecycle page when you change observable behavior.** If your change alters
  when a hook fires or what it receives,
  [`render-lifecycle.md`](../../src/unpoly/pages/render-lifecycle.md) and its diagram have to
  change with it.
