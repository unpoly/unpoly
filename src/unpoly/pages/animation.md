Animation
=========

Unpoly can animate a fragment update: the old content fades or slides out while
the new content comes in. You pick an effect by name in an HTML attribute,
or define your own with a few lines of JavaScript. Users who have asked their
system to reduce motion get instant updates instead.


Transitions: morphing between old and new {#transitions}
-----------------------------------------

To animate the swap of a fragment, set an `[up-transition]` attribute on a link:

```html
<a href="/stories/2" up-target="#story" up-transition="move-left">Next story</a> <!-- mark: up-transition="move-left" -->
```

When the response arrives, the old `#story` moves out to the left while the new one moves in from the right.
Both elements share the same space during the effect. Content after the fragment only shifts
when the new version has a different size.

An effect that morphs between an old and a new element is called a *transition*.
Transitions work on any fragment update. Forms take the same attribute:

```html
<form action="/tasks" up-target=".tasks" up-transition="cross-fade"> <!-- mark: up-transition="cross-fade" -->
  ...
</form>
```

From JavaScript, pass a `{ transition }` option to `up.render()` or any function that renders:

```js
up.render({ target: '#story', url: '/stories/2', transition: 'move-left' }) // mark: transition
```

To use a transition for every [navigation](/navigation-defaults), set a default in `up.fragment.config.navigateOptions`:

```js
up.fragment.config.navigateOptions.transition = 'cross-fade'
```


### Available transitions {#available-transitions}

Unpoly ships with the following transitions, which you can use by name:

| Transition   | Visual effect  |
|--------------|----------------|
| `cross-fade` | Fades out the old element. Simultaneously fades in the new element. |
| `move-up`    | Moves the old element upwards until it exits the screen at the top edge. Simultaneously moves the new element upwards from beyond the bottom edge of the screen until it reaches its current position. |
| `move-down`  | Moves the old element downwards until it exits the screen at the bottom edge. Simultaneously moves the new element downwards from beyond the top edge of the screen until it reaches its current position. |
| `move-left`  | Moves the old element leftwards until it exits the screen at the left edge. Simultaneously moves the new element leftwards from beyond the right edge of the screen until it reaches its current position. |
| `move-right` | Moves the old element rightwards until it exits the screen at the right edge. Simultaneously moves the new element rightwards from beyond the left edge of the screen until it reaches its current position. |
| `none`       | Swaps the elements instantly, with no visible effect. |

The `none` transition is useful when a default transition is configured
and a single link should update instantly. Setting `[up-transition=false]` has the same effect.

You can also [combine any two animations](#combining-animations) into a transition.


### Transitions for failed responses {#fail-transition}

When the server responds with an error code, Unpoly renders the response
with [different options](/failed-responses#fail-options). To animate that case differently,
set an `[up-fail-transition]` attribute:

```html
<form action="/tasks" up-target=".tasks" up-transition="cross-fade" up-fail-transition="move-down"> <!-- mark: up-fail-transition="move-down" -->
  ...
</form>
```


Animations: revealing a single element {#animations}
--------------------------------------

Some updates have no old element to morph from: appending to a list, opening an overlay,
or removing an element. These play an *animation* on a single element.
An animation fades the element, or moves it to or from a screen edge.

When [appending or prepending](/targeting-fragments#appending-or-prepending) content,
set an `[up-animation]` attribute to reveal the new children:

```html
<a href="/tasks?page=2" up-target=".tasks:after" up-animation="fade-in">Load more</a> <!-- mark: up-animation="fade-in" -->
```

The new items fade in below the existing ones.
When a fragment is *swapped*, use a [transition](#transitions) instead.
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


### Combining two animations into a transition {#combining-animations}

A transition is two animations playing at once:
one on the old element, one on the new. To combine any two animation names into a transition,
join them with a slash. The first animation plays on the old element, the second on the new:

```html
<a href="/stories/2" up-target="#story" up-transition="move-to-bottom/fade-in">Next story</a> <!-- mark: up-transition="move-to-bottom/fade-in" -->
```

The predefined transitions are such combinations. For example, `move-left`
is `move-to-left/move-from-right`.


Duration and easing {#duration-and-easing}
-------------------

Every animation and transition takes its duration and easing from a few settings,
which you can override per element, per call or for the whole app.

### Changing the duration {#duration}

Animations and transitions take 175 milliseconds by default.
To change the duration for one element, set an `[up-duration]` attribute:

```html
<a href="/users" up-target=".list" up-transition="cross-fade" up-duration="400">Show users</a> <!-- mark: up-duration="400" -->
```

From JavaScript, pass a `{ duration }` option to `up.render()`, `up.animate()` or any other function that animates:

```js
up.animate('.warning', 'fade-in', { duration: 400 }) // mark: duration
```

To change the default for all animations, set `up.motion.config.duration`:

```js
up.motion.config.duration = 300
```

Overlays have their own defaults for opening and closing, which you can set per [mode](/overlays#layer-modes).
See `up.layer.config` for options like `up.layer.config.overlay.openDuration`.

### Changing the easing {#easing}

The *easing* is a [timing function](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
that controls how an animation accelerates. The default is `ease`.
To change it for one element, set an `[up-easing]` attribute:

```html
<a href="/users" up-target=".list" up-transition="cross-fade" up-easing="ease-in-out">Show users</a> <!-- mark: up-easing="ease-in-out" -->
```

From JavaScript, pass an `{ easing }` option:

```js
up.animate('.warning', 'fade-in', { easing: 'linear' }) // mark: easing
```

Any CSS timing function works, including `cubic-bezier()` curves.
To change the default for all animations, set `up.motion.config.easing`.


Disabling animation globally {#disabling-animation-globally}
----------------------------

Animations are enabled unless the user has asked their system to
[minimize non-essential motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion).
In that case `up.motion.config.enabled` is `false`. When [logging](/up.log.enable) is enabled,
Unpoly prints *Animations are disabled* to the console when it boots.

A disabled animation jumps to its last frame instantly.
The page ends up in the same state either way, so your code never needs to check the setting.

To disable animations for all users, set the option yourself:

```js
up.motion.config.enabled = false
```

This is useful in automated integration tests, where a test might otherwise assert on the page
while an element is still fading in. It also removes a source of
[flaky tests](https://makandracards.com/makandra/47336-fixing-flaky-integration-tests).

To force-enable animations even for users who prefer reduced motion, set `up.motion.config.enabled = true`.

To skip a single effect while others keep playing, pass `none` or `false` as the animation or transition.


Running code after an animation {#running-code-after-an-animation}
-------------------------------

The promise returned by `up.render()` fulfills when the new fragment is in the DOM,
while its transition may still be playing. To run code after all effects have ended,
await the `up.RenderJob#finished` promise, or pass an `{ onFinished }` callback:

```js
let result = await up.render({ target: '.list', url: '/users', transition: 'cross-fade' }).finished // mark: .finished
```

An overlay's `{ onOpened }` callback runs while the opening animation may still be playing.
To be called after the animation, pass `{ onFinished }` to `up.layer.open()`.

`up.destroy()` keeps the element in the DOM while its exit animation plays.
To run code after the element was removed, pass `{ onFinished }`:

```js
up.destroy('.flash', {
  animation: 'fade-out',
  onFinished() { console.log('Flash removed') } // mark: onFinished
})
```

See [[render-lifecycle#postprocessing]] for everything that may still change a fragment after rendering.


Finishing running animations {#finishing-running-animations}
----------------------------

To complete all animations and transitions on the screen, call `up.motion.finish()`.
Every running effect jumps to its last frame and its promise settles:

```js
up.motion.finish()
```

Pass an element to only finish animations on that element and its children:

```js
up.motion.finish('.list')
```

Unpoly also finishes animations by itself when they would collide. When you animate
an element that is already animating, the running animation is completed before the new one starts.
The same happens when a fragment is updated again while its transition is still playing.


How a transition plays {#how-a-transition-plays}
----------------------

During a transition both elements occupy the same spot on the screen:

- The new element is inserted before the old element.
- The old element is taken out of the document flow and positioned over its former place.
- The new element is compiled and scrolled into view.
- Both elements animate in parallel.
- The old element is removed from the DOM.

The new element takes the old one's place in the document flow, so elements after the fragment
only shift when the new version has a different size.

A transition cannot replace the `<body>` element, which Unpoly never animates.
To transition the entire page, target a container inside `<body>`.


Defining your own effects {#custom-effects}
-------------------------

### Animating CSS properties {#animating-css-properties}

Instead of an animation name, `up.animate()` also takes an object of CSS properties.
The element is animated from its current styles to the given values:

```js
let warning = document.querySelector('.warning')
warning.style.opacity = 0
up.animate(warning, { opacity: 1 }) // mark: { opacity: 1 }
```

Property names are given in `kebab-case`, like `{ 'background-color': 'red' }`.

### Custom animations {#custom-animations}

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
and as one half of a [combined transition](#combining-animations).

### Custom transitions {#custom-transitions}

To define a named transition, pass a function to `up.transition()`.
The function receives the old element, the new element and the `{ duration, easing }` options,
and returns a promise for the end of the transition.
Here is the definition of the predefined `cross-fade` transition:

```js
up.transition('cross-fade', function(oldElement, newElement, options) {
  return Promise.all([
    up.animate(oldElement, 'fade-out', options),
    up.animate(newElement, 'fade-in', options)
  ])
})
```

The name is now available in `[up-transition]` attributes and `{ transition }` options.

### Honoring the caller's options {#custom-effect-contract}

Ending with `up.animate()` and passing along `options` keeps the caller's duration and easing,
and lets `up.motion.finish()` skip the effect to its last frame.
Custom functions that animate another way learn about a finish request through the `up:motion:finish` event.
See `up.animation()` and `up.transition()` for the contract your function must honor.


@page animation
@signature
