Controlling motion
==================

Every [transition](/transitions) and [animation](/animations) plays with a duration and easing
that you can change per element or for the whole app. Users who prefer reduced motion see no motion,
and you can turn them off yourself. When your code needs the final state, wait for running motion effects to end
or finish them right away.


Duration and easing {#duration-and-easing}
-------------------

### Changing the duration {#duration}

Motion effects take 175 milliseconds by default.
To change the duration for one element, set an `[up-duration]` attribute:

```html
<a href="/users" up-target=".list" up-transition="cross-fade" up-duration="400">Show users</a> <!-- mark: up-duration="400" -->
```

From JavaScript, pass a `{ duration }` option to `up.render()`, `up.animate()` or any other function that animates:

```js
up.animate('.warning', 'fade-in', { duration: 400 }) // mark: duration
```

To change the default for all motion effects, set `up.motion.config.duration`:

```js
up.motion.config.duration = 300
```

Overlays have their own defaults for opening and closing, which you can set per [mode](/overlays#layer-modes).
See `up.layer.config` for options like `up.layer.config.overlay.openDuration`.

### Changing the easing {#easing}

The *easing* is a [timing function](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
that controls how a motion effect accelerates. The default is `ease`.
To change it for one element, set an `[up-easing]` attribute:

```html
<a href="/users" up-target=".list" up-transition="cross-fade" up-easing="ease-in-out">Show users</a> <!-- mark: up-easing="ease-in-out" -->
```

From JavaScript, pass an `{ easing }` option:

```js
up.animate('.warning', 'fade-in', { easing: 'linear' }) // mark: easing
```

Any CSS timing function works, including `cubic-bezier()` curves.
To change the default for all motion effects, set `up.motion.config.easing`.


Reduced motion and disabling motion {#disabling-animation-globally}
-----------------------------------

Motion is enabled unless the user has asked their system to
[minimize non-essential motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion).
In that case `up.motion.config.enabled` is `false`. When [logging](/up.log.enable) is enabled,
Unpoly prints *Animations are disabled* to the console when it boots.

With motion disabled, a motion effect jumps to its last frame instantly.
The page ends up in the same state either way, so your code never needs to check the setting.

To disable motion for all users, set the option yourself:

```js
up.motion.config.enabled = false
```

This is useful in automated integration tests, where a test might otherwise assert on the page
while an element is still fading in. It also removes a source of
[flaky tests](https://makandracards.com/makandra/47336-fixing-flaky-integration-tests).

To force-enable motion even for users who prefer reduced motion, set `up.motion.config.enabled = true`.

To skip a single motion effect while others keep playing, pass `none` or `false` as the animation or transition.


Running code after a motion effect {#running-code-after-an-animation}
----------------------------------

The promise returned by `up.render()` fulfills when the new fragment is in the DOM,
while its transition may still be playing. To run code after all motion effects have ended,
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


Finishing running motion effects {#finishing-running-animations}
--------------------------------

To complete all motion effects on the screen, call `up.motion.finish()`.
Every running motion effect jumps to its last frame and its promise settles:

```js
up.motion.finish()
```

Pass an element to only finish motion effects on that element and its children:

```js
up.motion.finish('.list')
```

Unpoly also finishes motion effects by itself when they would collide. When you animate
an element that is already animating, the running one is completed before the new one starts.
The same happens when a fragment is updated again while its transition is still playing.


@page controlling-motion
