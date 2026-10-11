# Sitting packet: Scrolling & focus chapter

Prepared 2026-10-11. Pages in toc order. Pattern numbers refer to writer-brief.md, "Maintainer patterns".
Already decided and applied: A26, A30, A31, B8, B9 (fix round, 1ed027539).
No deferred duplication items (C/B) touch this chapter.

| Page | Pointers |
|------|----------|
| scrolling-and-focus | 0 |
| scrolling | 1 |
| scroll-tuning | 1 |
| focus | 0 |
| focus-visibility | 0 |


## Scrolling & focus (`/scrolling-and-focus`, 115 lines)

Chapter overview: what happens after following a link, scrolling to new content, moving focus, focus rings;
scroll tuning, Back button and infinite scrolling in "Also in this topic".

**Changed since writing**
- 1ed027539 (B8): first section retitled "What happens after following a link", anchor `{#navigation-defaults}` kept.
- 1ed027539 (A30): focus order fixed: "the counterpart of the element the user was in, or … the new fragment
  if there is none" (scrolling-and-focus.md:29-30).
- 1ed027539 (B9): `autoFocusVisible` / `[up-focus-visible]` sentence (scrolling-and-focus.md:98-99).

No pointers. (Checked: `autoScroll` is `['hash', 'layer-if-main']` and `autoFocus` is
`['hash', 'autofocus', 'main-if-main', 'keep', 'target-if-lost']`, fragment.js:279-280; focus returns to the
opener on close, close_layer.js:135-139; popups don't trap focus, layer.js:236. The focus-ring example repeats
focus-visibility.md:24-28, but the teaser has its own "why" sentence, same case as the teasers you left in earlier
sittings. One blurb sentence is under "Clear fixes".)


## Scrolling (`/scrolling`, 338 lines)

`[up-scroll]` strategies: auto, target, selector, hash, layer, main, top/bottom/pixels, false, keep, restore,
sequences, `-if-main`, scroll maps, functions, `up.reveal()`.

**Changed since writing**
- 1ed027539 (A26): positions are remembered per layer until the next full load; `[up-scroll="restore, top"]`
  as a fallback (scrolling.md:197-198).

### 1. Two pointers to scroll-tuning, with different halves of the family

> You can control how far to scroll, how to handle large elements, or apply a scroll margin.\
> See [[scroll-tuning]] for details.

(scrolling.md:58-59, under "Revealing the new fragment")

> ## Tuning the scroll motion {#options}
>
> You can animate the scroll motion, declare fixed navigation bars that obstruct the viewport,
> limit how far a large element is revealed, apply a scroll margin, or snap to the screen edge.\
> See [[scroll-tuning]] for details.

(scrolling.md:332-336)

The page says the same thing twice. The first list is incomplete (no animation, no fixed bars). The question
comes up at `[up-scroll="target"]`, where you reveal an element. `#options` has no inbound links (grepped src/,
docs/changes/, ../unpoly-site/source). (Pattern 2, 3, 5)

- **A.** One complete sentence at `#target`, drop the `#options` section.
- **B.** Keep the `#options` section, drop the sentence at `#target`.
- **C.** Leave both.

**Lean: A (medium).** Draft for scrolling.md:58-59, and delete :332-336:

```md
You can animate the scroll motion, declare fixed navigation bars that obstruct the viewport,
add padding, snap to the screen edge, or limit how far a large element is revealed.
See [[scroll-tuning]] for details.
```


## Tuning the scroll behavior (`/scroll-tuning`, 119 lines)

Fixed layout elements, smooth scrolling, padding, snapping, large elements, aligning to the top.

**Changed since writing**
- 1ed027539 (A31): the important box claiming swaps can't animate scrolling is gone.

### 1. `[up-reveal-padding]` has no effect when rendering (CODE)

> To leave space between a [revealed](/up.reveal) element and the closest viewport edge,
> pass a pixel value as `{ revealPadding }` option:
>
> ```html
> <a href="/comments" up-target="#comments" up-scroll="target" up-reveal-padding="20">Comments</a>
> ```

(scroll-tuning.md:56-61)

The link parses the attribute (link.js:396), and `up.RevealMotion` reads `options.revealPadding`
(classes/reveal_motion.js:16). But a render pass builds `up.FragmentScrolling`, an `up.Record` that keeps only the
keys it lists (classes/record.js:13-19), and `revealPadding` is not among them (classes/fragment_scrolling.js:5-14:
`revealTop`, `revealMax`, `revealSnap`, `scrollBehavior`). So `up.reveal()` falls back to `config.revealPadding`.
The other three reveal options get through. No spec covers `revealPadding` in a render pass. The reference promises
it too (pages/params/up-follow/scrolling.md:32, pages/params/up.render/scrolling.md:36). Only `up.reveal()` and the global config work today.

- **A.** Fix the code: add `'revealPadding'` to the keys, plus a spec. Docs stay as written.
- **B.** Keep the code, rewrite the section and the reference to `up.reveal()` / `up.viewport.config.revealPadding` only.

**Lean: A (strong).** One line in classes/fragment_scrolling.js:9-12:

```js
      'revealTop',
      'revealMax',
      'revealSnap',
      'revealPadding',
      'scrollBehavior',
```

Spec next to the `scrollBehavior` specs in spec/unpoly/fragment_render_scrolling_spec.js (same `mockReveal` pattern as :880-893):

```js
it('passes a { revealPadding } option to the reveal', async function() {
  mockReveal.apply(this)

  fixture('.element', { text: 'version 1' })
  up.render('.element', { document: '<div class="element">version 2</div>', scroll: 'target', revealPadding: 20 })
  await wait()

  expect(this.revealOptions.revealPadding).toEqual(20)
})
```


## Controlling focus (`/focus`, 292 lines)

`[up-focus]` strategies: auto, target, selector, hash, main, layer, keep, restore, false, sequences, conditions,
functions, `up.focus()`, focus rings pointer, overlays.

**Changed since writing**
- 1ed027539 (A26): focus state is remembered per layer until the next full load; `[up-focus="restore, target"]`
  as a fallback (focus.md:137-138).

No pointers. (Checked: strategies render with `preventScroll`, so "Focusing an element does not scroll it into view"
holds, classes/fragment_focus.js:4, :75-84; `up.focus()` reveals unless `preventScroll`, viewport.js:265-269; a
non-focusable element gets `[tabindex=-1]`, viewport.js:246-248; an overlay opens with `['autofocus', 'layer']`,
open_layer.js:231; the overlay element has `[role=dialog]`, classes/overlay_focus.js:23; without an origin the parent
layer is focused, close_layer.js:137. One sentence about `[up-validate]` is under "Clear fixes".)


## Focus ring visibility (`/focus-visibility`, 96 lines)

`.up-focus-visible` / `.up-focus-hidden`, hiding and styling rings in CSS, `autoFocusVisible`, `[up-focus-visible]`.

**Changed since writing**
- Nothing on 2026-10-10/11.

No pointers. (Checked: the default `autoFocusVisible` is the code shown, viewport.js:104; the class is set on
every element Unpoly focuses, viewport.js:262-263; the default stylesheet hides the outline of
`.up-focus-hidden:focus-visible`, viewport.sass:4-12; `up.focus()` takes `{ focusVisible }`, viewport.js:239.)


## Clear fixes (APPLIED by the orchestrator in 84d45e640)

1. scrolling-and-focus.md:5, the blurb. Following a link to a main target scrolls the layer to the top
   (`layer-if-main`, fragment.js:280), as the page itself says at :19. Same correction as A1 on links.md.
   `Following a link scrolls the new content into view and focuses it, the way a full page load would.`
   → `Following a link scrolls to the top and focuses the new content, the way a full page load would.`
2. focus.md:38-39. Validation does not leave focus alone. It sets `{ focus: 'keep' }`
   (classes/form_validator.js:248), like `up.reload()` (fragment.js:274). Old:

   ```md
   When rendering without navigation, e.g. with `up.render()` or `[up-validate]`, focus is not changed by default.
   `up.reload()` [keeps the current focus](#keep).
   ```

   New:

   ```md
   When rendering without navigation, e.g. with `up.render()`, focus is not changed by default.
   `up.reload()` and `[up-validate]` [keep the current focus](#keep).
   ```
3. pages/params/up-follow/scrolling.md:21-22 and pages/params/up.render/scrolling.md:25-26 (reference). Swaps can animate the
   scroll motion since 1ec2f03af (A31, spec/unpoly/fragment_render_scrolling_spec.js:910). Old:

   ```md
     Whether to [animate the scroll motion](/scroll-tuning#animating-the-scroll-motion)
     when [prepending or appending](/targeting-fragments#appending-or-prepending) content.
   ```

   New:

   ```md
     Whether to [animate the scroll motion](/scroll-tuning#animating-the-scroll-motion).
   ```
4. pages/params/up-follow/scrolling.md:37 and pages/params/up.render/scrolling.md:41 (reference). `revealMax` links to the
   padding section:
   `How many pixel lines of a [high element to reveal](/scroll-tuning#revealing-with-padding) when scrolling to an element.`
   → `How many pixel lines of a [tall element to reveal](/scroll-tuning#revealing-large-elements) when scrolling to an element.`
5. pages/params/up.render/scrolling.md:32, :36, :40 (reference), wrong types (config defaults at viewport.js:101-103):
   `@param {number} [options.revealTop]` → `@param {boolean} [options.revealTop]`;
   `@param {string} [options.revealPadding]` → `@param {number} [options.revealPadding]`;
   `@param {string} [options.revealMax]` → `@param {number|Function} [options.revealMax]`.
