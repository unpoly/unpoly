Predefined animations
=====================

An animation reveals or removes a single element: it fades, or it moves to or from a screen edge.
Unpoly ships with a set of animations you can use by name, in an `[up-animation]` attribute
or an `{ animation }` option, wherever an element appears or disappears without a counterpart to morph from.


Where animations play
---------------------

When [appending or prepending](/targeting-fragments#appending-or-prepending) content,
set an `[up-animation]` attribute to reveal the new children:

```html
<a href="/tasks?page=2" up-target=".tasks:after" up-animation="move-from-bottom">Load more</a> <!-- mark: up-animation="move-from-bottom" -->
```

When a fragment is *swapped*, use a [transition](/predefined-transitions) instead.
An `[up-animation]` attribute has no effect on a link that swaps a fragment.

When opening an overlay, `[up-animation]` sets the opening animation and `[up-close-animation]` the closing animation:

```html
<a href="/details" up-layer="new" up-animation="move-from-top" up-close-animation="move-to-top">Details</a> <!-- mark: up-animation="move-from-top" up-close-animation="move-to-top" -->
```

To animate the removal of an element from JavaScript, pass an `{ animation }` option to `up.destroy()`.
The element stays in the DOM until the animation has ended:

```js
up.destroy('.flash', { animation: 'fade-out' })
```

To animate any element, pass it to `up.animate()` with an animation name:

```js
up.animate('.warning', 'fade-in', { duration: 250 })
```


Available animations
--------------------

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


Animating CSS properties directly
---------------------------------

Instead of an animation name, `up.animate()` also takes an object of CSS properties.
The element is animated from its current styles to the given values:

```js
let warning = document.querySelector('.warning')
warning.style.opacity = 0
up.animate(warning, { opacity: 1 }) // mark: { opacity: 1 }
```

Property names are given in `kebab-case`, like `{ 'background-color': 'red' }`.

Unpoly plays one animation per element at a time. When you animate an element that is
already animating, the running animation jumps to its last frame before the new one starts.


Custom animations {#custom-animations}
-----------------

To define a named animation, pass a function to `up.animation()`.
The function receives the element and the `{ duration, easing }` options,
and returns a promise for the end of the animation.
Here is the definition of the predefined `fade-in` animation:

```js
up.animation('fade-in', function(element, options) {
  element.style.opacity = 0
  return up.animate(element, { opacity: 1 }, options)
})
```

The name is now available in `[up-animation]` attributes, `{ animation }` options
and as one half of a [combined transition](/predefined-transitions#combining-animations).

Ending with `up.animate()` and passing along `options` keeps the caller's duration and easing,
and lets `up.motion.finish()` skip the animation to its last frame.
If you animate another way, see `up.animation()` for the contract your function must honor.


@page predefined-animations
