  /***
  Tuning the scroll behavior
  ==========================

  This page details various options to tune Unpoly's scrolling behavior.

  All features are available both as JavaScript options (like `{ revealSnap }`) and
  HTML attributes (like `[up-reveal-snap]`).


  \#\#\# Animating the scroll motion

  To animate the scroll motion, pass `{ scrollBehavior: 'smooth' }.`
  To *not* animate the scrolling, pass `{ scrollBehavior: 'auto' }` (the default).

  The acceleration of the scroll motion may be controlled using the `{ scrollSpeed }` option.
  If defaults to `{ scrollSpeed: 1 }`.
  This roughly corresponds to the speed of Chrome's
  [native smooth scrolling](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions/behavior).
  You may change this default in `up.viewport.config.scrollSpeed`.

  When swapping a fragment with a new version of itself, the scroll motion cannot be animated.
  You *can* animate the scroll motion when [prepending, appending](/fragment-placement]
  or [destroying](/up.destroy) a fragment.


  \#\#\# Fixed layout elements obstructing the viewport

  Fixed layout elements (like navigation bars) may obstruct the view on
  an element that is being [revealed](/up.reveal).

  You can make Unpoly aware of fixed layout elements by assigning an `[up-fixed=top]`
  or `[up-fixed=bottom]` attribute. Unpoly will then adjust scroll positions so a
  revealed element is fully visible.

  Instead of assigning an `[up-fixed]` attribute you may also add the selector
  of an obstructing layout element to the `up.viewport.config.fixedTop` or
  `up.viewport.config.fixedBottom` array.


  \#\#\# Snapping to the screen edge

  When [revealing](/up.reveal) an element near the top edge of the viewport,
  you often want to scroll to the very top for aesthetic reasons. For example, if you reveal a navigation
  bar that sits 50px below the top logo, you probably want to scroll to zero (instead of 50) pixels.

  In order to snap to the top edge in such cases, pass a `{ revealSnap }` option.
  When the the revealed element would be closer to the viewport's top edge
  than this value, Unpoly will scroll the viewport to the top.

  The default is `{ revealSnap: 200 }`.
  You may change this default in `up.viewport.config.revealSnap`.

  To disable snapping, use `{ revealSnap: 0 }`.


  \#\#\# Revealing large elements

  When [revealing](/up.reveal) an element, the viewport will scroll
  as far as necessary to make the element visible.

  For an element higher than the viewport, this would mean that the top edge of the element
  would be moved to the top of the viewport. This large change of scroll positions may
  disorient the user.

  To limit the scroll motion when revealing an element, pass a pixel value
  as `{ revealMax }`. Unpoly will then pretend that the element is no higher than the
  given value. You may also pass a function that accepts the element and returns
  a pixel value.

  The default is `{ revealMax: () => 0.5 * innerHeight }`, meaning that Unpoly will
  reveal high elements until half the screen height is filled.
  You may change this default in `up.viewport.config.revealMax`.


  \#\#\# Revealing with padding

  To add space between a [revealed](/up.reveal) element and the closest viewport edge,
  pass a pixel value as `{ revealPadding }` option.

  The default is `{ revealPadding: 0 }`.
  You may change this default in `up.viewport.config.revealPadding`.


  \#\#\# Moving revealed elements to the top

  When [revealing](/up.reveal) an element, the viewport will only scroll
  *as little as possible* to make the element visible. For instance, if the viewport is
  already fully visible, the scroll position will not change.

  To always align the top edges of the revealed element and viewport,
  pass `{ revealTop: true }`.

  The default is `{ revealTop: false }`.
  You may change this default in `up.viewport.config.revealTop`.


  @page scroll-tuning
  */
