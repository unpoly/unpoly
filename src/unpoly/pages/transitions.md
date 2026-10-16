Transitions
===========

A transition animates the swap of a fragment: the old element morphs into its new version.
Unpoly ships with a few transitions that you can use by name.
You can also combine two animations into a transition, or define your own in JavaScript.


Using a transition {#transitions}
------------------

To animate the swap of a fragment, set an `[up-transition]` attribute on a link:

```html
<a href="/stories/2" up-target="#story" up-transition="move-left">Next story</a> <!-- mark: up-transition="move-left" -->
```

When the response arrives, the old `#story` moves out to the left while the new one moves in from the right.

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

When a [cached](/caching#revalidation) page is revalidated, the fresh content replaces it without a second transition.
Pages restored by the *Back* button are not animated.

To change a transition's duration or easing, or to run code after it has ended, see [[controlling-motion]].


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

### Combining two animations into a transition {#combining-animations}

A transition is two animations playing at once:
one on the old element, one on the new. To combine any two [animation names](/animations#available-animations) into a transition,
join them with a slash. The first animation plays on the old element, the second on the new:

```html
<a href="/stories/2" up-target="#story" up-transition="move-to-bottom/fade-in">Next story</a> <!-- mark: up-transition="move-to-bottom/fade-in" -->
```

The predefined transitions are such combinations. For example, `move-left`
is `move-to-left/move-from-right`.


### Transitions for failed responses {#fail-transition}

A failed response does not use `[up-transition]`. When the server responds with an error code, Unpoly renders
the response with [different options](/error-responses#fail-options), and the form with validation errors
appears instantly. To animate that case, set an `[up-fail-transition]` attribute:

```html
<form action="/tasks" up-target=".tasks" up-transition="cross-fade" up-fail-transition="move-down"> <!-- mark: up-fail-transition="move-down" -->
  ...
</form>
```

A default transition in `up.fragment.config.navigateOptions` applies to both cases.


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

While the transition plays, the old element is still in the DOM with an [`.up-destroying`](/up-destroying) class.
Unpoly functions like `up.fragment.get()` ignore it, but `document.querySelector()` may still find it.

A transition cannot replace the `<body>` element, which Unpoly never animates.
To transition the entire page, target a container inside `<body>`.


Custom transitions {#custom-transitions}
------------------

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
and lets `up.motion.finish()` skip the transition to its last frame.
Custom functions that animate another way learn about a finish request through the `up:motion:finish` event.
See `up.transition()` for the contract your function must honor.


@page transitions
