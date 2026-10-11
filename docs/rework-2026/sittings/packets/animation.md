# Sitting packet: Animation chapter

Prepared 2026-10-11. Pattern numbers refer to writer-brief.md, "Maintainer patterns".
Already decided and applied: A40-A42, B17 (410a93574), A43 (motion.js default duration, same commit).
Deferred items carried here: C13 (other side on /customizing-overlays, also in the Overlays packet) and B18.

| Page | Pointers |
|------|----------|
| animation | 2 |


## Animation (`/animation`, 363 lines)

Transitions and animations, the built-in effects, failed responses, duration and easing, reduced motion,
running code after an effect, finishing effects, how a transition plays, defining your own effects.

**Changed since writing**
- 410a93574 (A41): revalidation re-renders without a second transition, and Back restores aren't animated
  (animation.md:44-45).
- 410a93574 (A40): a failed response does not use `[up-transition]`; a `navigateOptions` default applies to both
  (animation.md:69-71, :79).
- 410a93574 (B17): "Disabling animation globally" retitled "Reduced motion and disabling animation", anchor kept (animation.md:208).
- 410a93574 (A42): the old element stays in the DOM with `.up-destroying` during a transition (animation.md:296-297).

### 1. The overlay example copies /customizing-overlays (C13, deferred duplication)

This is the same item as Overlays packet → customizing-overlays pointer 1. Decide it once, in whichever sitting comes first.

> When opening an overlay, `[up-animation]` sets the opening animation and `[up-close-animation]` the closing animation:
>
> ```html
> <a href="/details" up-layer="new" up-animation="move-from-top" up-close-animation="move-to-top">Details</a>
> ```
>
> Each overlay mode also has its own default animations. To configure them, see [[customizing-overlays#animation]].

(animation.md:100-106)

> To use different [animations](/animation) for one overlay, set `[up-animation]` and `[up-close-animation]`
> attributes on the link that opens it:
>
> ```html
> <a href="/details" up-layer="new" up-animation="move-from-top" up-close-animation="move-to-bottom">
>   Open details
> </a>
> ```

(customizing-overlays.md:137-144)

Near-literal copy, only the close direction differs. /customizing-overlays owns overlay animations.
This page's angle is "which kind of effect plays when": a transition for a swap, an animation when there is
only one element. The sentence answers "which attribute for overlays?" without the code block. (Pattern 5)

- **A.** Keep the sentence, drop the code block.
- **B.** Drop the example on /customizing-overlays and point here.
- **C.** Leave both.

**Lean: A (medium).** Draft for animation.md:100-106:

```md
When opening an overlay, `[up-animation]` sets the opening animation and `[up-close-animation]`
the closing animation. Each overlay mode has its own defaults. See [[customizing-overlays#animation]].
```

### 2. The size-shift sentence appears twice (B18, deferred)

> When the response arrives, the old `#story` moves out to the left while the new one moves in from the right.
> Both elements share the same space during the effect. Content after the fragment only shifts
> when the new version has a different size.

(animation.md:19-21, the page's first example)

> During a transition both elements occupy the same spot on the screen:
>
> (five steps)
>
> The new element takes the old one's place in the document flow, so elements after the fragment
> only shift when the new version has a different size.

(animation.md:285-294, "How a transition plays")

Same two facts on one page, the second time with the reason. The first example only needs to say what the
user sees. "How a transition plays" owns the layout mechanics. (Pattern 5)

- **A.** Cut the two layout sentences from the first example.
- **B.** Leave both.

**Lean: A (medium).** Draft for animation.md:19-21:

```md
When the response arrives, the old `#story` moves out to the left while the new one moves in from the right.
```

(Checked, no further pointers: `transition` is not a shared fail key, so A40 holds, render_options.js:30-52, :76-82,
:241-253; `none` and `false` both skip an effect, motion.js:540-543; default duration 175 and easing `ease`,
motion.js:41-42; the "Animations are disabled" log line, motion.js:525-531; `{ onOpened }` may run during the
opening animation, layer.js:606-613; `up.layer.config.overlay.openDuration` exists, layer.js:104.)


## Clear fixes (apply without asking)

None.
