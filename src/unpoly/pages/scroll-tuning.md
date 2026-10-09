Tuning the scroll behavior
==========================

When Unpoly [scrolls an element into view](/scrolling#target), you can tune the motion:
declare fixed layout elements that obstruct the viewport, animate the scroll, add padding,
snap to the screen edge or limit how far a large element is revealed.

Most options are available as a JavaScript option (like `{ revealSnap }`),
as an HTML attribute (like `[up-reveal-snap]`) and as a global default in `up.viewport.config`.


## Fixed layout elements obstructing the viewport {#fixed-layout-elements-obstructing-the-viewport}

Fixed layout elements (like navigation bars) may obstruct the view on
an element that is being [revealed](/up.reveal). Unpoly would scroll until the element
is at the top of the viewport, where it ends up hidden behind the bar.

To make Unpoly aware of a fixed element, give it an `[up-fixed="top"]`
or `[up-fixed="bottom"]` attribute:

```html
<nav class="top-nav" up-fixed="top"> <!-- mark: up-fixed="top" -->
  ...
</nav>
```

Unpoly then adjusts scroll positions so a revealed element is fully visible below the bar.
This also applies to elements with `position: sticky`.

Instead of setting an `[up-fixed]` attribute, you can also add the selector
of an obstructing layout element to the `up.viewport.config.fixedTopSelectors` or
`up.viewport.config.fixedBottomSelectors` array:

```js
up.viewport.config.fixedTopSelectors.push('.top-nav')
```


## Animating the scroll motion {#animating-the-scroll-motion}

By default Unpoly jumps to the new scroll position instantly.
To animate the scroll motion, set an `[up-scroll-behavior="smooth"]` attribute:

```html
<a href="/comments" up-target="#comments" up-scroll="target" up-scroll-behavior="smooth">Comments</a> <!-- mark: up-scroll-behavior="smooth" -->
```

From JavaScript, pass `{ scrollBehavior: 'smooth' }`.

When `{ scrollBehavior: 'auto' }` is passed, the behavior is determined by the CSS property
[`scroll-behavior`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior) of the viewport element.

> [important]
> When [swapping a fragment](/targeting-fragments#swapping), the scroll motion cannot be animated.
> You *can* animate the scroll motion when [prepending, appending](/targeting-fragments#appending-or-prepending)
> or [destroying](/up.destroy) a fragment.


## Revealing with padding {#revealing-with-padding}

To leave space between a [revealed](/up.reveal) element and the closest viewport edge,
pass a pixel value as `{ revealPadding }` option:

```html
<a href="/comments" up-target="#comments" up-scroll="target" up-reveal-padding="20">Comments</a> <!-- mark: up-reveal-padding="20" -->
```

The default is `{ revealPadding: 0 }`.
You can change this default in `up.viewport.config.revealPadding`.


## Snapping to the screen edge {#snapping-to-the-screen-edge}

When [revealing](/up.reveal) an element near the top of a viewport's scroll buffer,
you often want to scroll to the very top for aesthetic reasons. For example, if you reveal a navigation
bar that sits 50px below the top logo, you probably want to scroll to zero (instead of 50) pixels.

To snap to the top edge in such cases, pass a `{ revealSnap }` option.
When the target scroll position is closer to the top than this value, Unpoly scrolls the viewport to the top instead.

The default is `{ revealSnap: 200 }`.
You can change this default in `up.viewport.config.revealSnap`.

To disable snapping, use `{ revealSnap: 0 }`.


## Revealing large elements {#revealing-large-elements}

When [revealing](/up.reveal) an element, the viewport scrolls
as far as necessary to make the element visible.

For an element taller than the viewport, this would move the top edge of the element
to the top of the viewport. This large change of scroll positions may disorient the user.

To limit the scroll motion when revealing an element, pass a pixel value
as `{ revealMax }`. Unpoly then pretends that the element is no taller than the
given value. You can also pass a function that accepts the element and returns
a pixel value.

The default is `{ revealMax: () => 0.5 * innerHeight }`, meaning that Unpoly
reveals tall elements until half the screen height is filled.
You can change this default in `up.viewport.config.revealMax`.

To always reveal as much of the element as the viewport allows, pass `{ revealMax: false }`.


## Moving revealed elements to the top {#moving-revealed-elements-to-the-top}

When [revealing](/up.reveal) an element, the viewport only scrolls
*as little as possible* to make the element visible. For instance, if the element is
already fully visible, the scroll position does not change.

To always align the top edges of the revealed element and viewport,
pass `{ revealTop: true }`:

```html
<a href="/chapters/2" up-target="#chapter" up-scroll="target" up-reveal-top="true">Next chapter</a> <!-- mark: up-reveal-top="true" -->
```

The default is `{ revealTop: false }`.
You can change this default in `up.viewport.config.revealTop`.


@page scroll-tuning
