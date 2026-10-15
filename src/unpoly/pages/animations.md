Animations
==========

Some updates have no old element to morph from: appending to a list, opening an overlay,
or removing an element. These play an *animation* on a single element.
An animation fades the element, or moves it to or from a screen edge.


Revealing a single element {#animations}
--------------------------

When [appending or prepending](/targeting-fragments#appending-or-prepending) content,
set an `[up-animation]` attribute to reveal the new children:

```html
<a href="/tasks?page=2" up-target=".tasks:after" up-animation="fade-in">Load more</a> <!-- mark: up-animation="fade-in" -->
```

The new items fade in below the existing ones.
When a fragment is *swapped*, use a [transition](/transitions) instead.
An `[up-animation]` attribute has no effect on a link that swaps a fragment.

When opening an overlay, `[up-animation]` sets the opening animation and `[up-close-animation]` the closing animation:

```html
<a href="/details" up-layer="new" up-animation="move-from-top" up-close-animation="move-to-top">Details</a> <!-- mark: up-animation="move-from-top" up-close-animation="move-to-top" -->
```

Each overlay mode also has its own default animations. To configure them, see [[customizing-overlays#animation]].

To animate the removal of an element from JavaScript, pass an `{ animation }` option to `up.destroy()`.
The element stays in the DOM until the animation has ended:

```js
up.destroy('.flash', { animation: 'fade-out' })
```

To animate any element, pass it to `up.animate()` with an animation name:

```js
up.animate('.warning', 'fade-in', { duration: 250 })
```

To change an animation's duration or easing, or to run code after it has ended, see [[controlling-motion]].


### Available animations {#available-animations}

Unpoly ships with the following animations, which you can use by name:

| Animation          | Visual effect  |
|--------------------|----------------|
| `fade-in`          | Changes the element's opacity from 0% to 100% |
| `fade-out`         | Changes the element's opacity from its current value to 0% |
| `move-to-top`      | Moves the element upwards until it exits the screen at the top edge |
| `move-from-top`    | Moves the element downwards from beyond the top edge of the screen until it reaches its current position |
| `move-to-bottom`   | Moves the element downwards until it exits the screen at the bottom edge |
| `move-from-bottom` | Moves the element upwards from beyond the bottom edge of the screen until it reaches its current position |
| `move-to-left`     | Moves the element leftwards until it exits the screen at the left edge |
| `move-from-left`   | Moves the element rightwards from beyond the left edge of the screen until it reaches its current position |
| `move-to-right`    | Moves the element rightwards until it exits the screen at the right edge |
| `move-from-right`  | Moves the element leftwards from beyond the right edge of the screen until it reaches its current position |
| `none`             | Shows or removes the element instantly, with no visible effect. |

The `none` animation is useful when a default animation is configured
and a single element should appear instantly. Setting `[up-animation=false]` has the same effect.


Animating CSS properties {#animating-css-properties}
------------------------

Instead of an animation name, `up.animate()` also takes an object of CSS properties.
The element is animated from its current styles to the given values:

```js
let warning = document.querySelector('.warning')
warning.style.opacity = 0
up.animate(warning, { opacity: 1 }) // mark: { opacity: 1 }
```

Property names are given in `kebab-case`, like `{ 'background-color': 'red' }`.


Custom animations {#custom-animations}
-----------------

To define a named animation, pass a function to `up.animation()`.
The function receives the element and the `{ duration, easing }` options,
and returns a promise for the end of the animation.
Here is the definition of the predefined `fade-in` animation:

```js
up.animation('fade-in', function(element, options) {
  element.style.opacity = 0
  return up.animate(element, { opacity: 1 }, options) // mark: up.animate
})
```

The name is now available in `[up-animation]` attributes, `{ animation }` options
and as one half of a [combined transition](/transitions#combining-animations).

### Honoring the caller's options {#custom-effect-contract}

Ending with `up.animate()` and passing along `options` keeps the caller's duration and easing,
and lets `up.motion.finish()` skip the animation to its last frame.
Custom functions that animate another way learn about a finish request through the `up:motion:finish` event.
See `up.animation()` for the contract your function must honor.


@page animations
