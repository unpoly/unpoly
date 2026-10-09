Predefined transitions
======================

A transition morphs between the old and the new version of a fragment, like a cross-fade or a slide.
Unpoly ships with a set of transitions you can use by name, in an `[up-transition]` attribute
or a `{ transition }` option.


Animating a fragment update
---------------------------

Set an `[up-transition]` attribute on a link. When the response arrives,
the old fragment plays its exit while the new one enters:

```html
<a href="/stories/2" up-target="#story" up-transition="move-left">Next story</a> <!-- mark: up-transition="move-left" -->
```

The old `#story` moves out to the left while the new one moves in from the right.

Forms take the same attribute:

```html
<form action="/tasks" up-target=".tasks" up-transition="cross-fade"> <!-- mark: up-transition="cross-fade" -->
  ...
</form>
```

From JavaScript, pass a `{ transition }` option to `up.render()` or any function that renders:

```js
up.render({ target: '#story', url: '/stories/2', transition: 'move-left' }) // mark: transition
```

To use a transition for every [navigation](/navigation), set a default in `up.fragment.config.navigateOptions`:

```js
up.fragment.config.navigateOptions.transition = 'cross-fade'
```


Available transitions
---------------------

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


Combining two animations {#combining-animations}
------------------------

A transition is two [animations](/predefined-animations) playing at once:
one on the old element, one on the new. To combine any two animation names into a transition,
join them with a slash. The first animation plays on the old element, the second on the new:

```html
<a href="/stories/2" up-target="#story" up-transition="move-to-bottom/fade-in">Next story</a> <!-- mark: up-transition="move-to-bottom/fade-in" -->
```

The predefined transitions are such combinations. For example, `move-left`
is `move-to-left/move-from-right`.


Transitions for failed responses
--------------------------------

When the server responds with an error code, Unpoly renders the response
with [different options](/failed-responses#fail-options). To animate that case differently,
set an `[up-fail-transition]` attribute:

```html
<form action="/tasks" up-target=".tasks" up-transition="cross-fade" up-fail-transition="move-down"> <!-- mark: up-fail-transition="move-down" -->
  ...
</form>
```


How a transition plays
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

Ending with `up.animate()` and passing along `options` keeps the caller's duration and easing,
and lets `up.motion.finish()` skip the transition to its last frame.
If you animate another way, see `up.transition()` for the contract your function must honor.


@page predefined-transitions
