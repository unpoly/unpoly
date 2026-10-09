Animation
=========

Unpoly can animate a fragment update: the old content fades or slides out while
the new content comes in. You pick an effect by name in an HTML attribute,
or define your own with a few lines of JavaScript. Users who have asked their
system to reduce motion get instant updates instead.


Transitions: morphing between old and new
-----------------------------------------

To animate the swap of a fragment, set an `[up-transition]` attribute on a link or form:

```html
<a href="/users" up-target=".list" up-transition="cross-fade">Show users</a> <!-- mark: up-transition="cross-fade" -->
```

When the response arrives, the old `.list` fades out while its replacement fades in.
Both elements occupy the same space during the effect, so the layout around them does not jump.

An effect that morphs between an old and a new element is called a *transition*.
Unpoly ships with transitions that cross-fade or move the content in any direction,
like `move-left` or `move-up`.

Transitions work on any fragment update, whether from a link, a form submission or `up.render()`:

```js
up.render({ target: '.list', url: '/users', transition: 'move-left' }) // mark: transition
```

<p class="read-more"><a href="/predefined-transitions">Read more: Predefined transitions</a></p>


Animations: revealing a single element
--------------------------------------

Some updates have no old element to morph from: appending to a list, opening an overlay,
or removing an element. These play an *animation* on a single element.

When [appending to a fragment](/targeting-fragments#appending-or-prepending),
set an `[up-animation]` attribute:

```html
<a href="/tasks?page=2" up-target=".tasks:after" up-animation="fade-in">Load more</a> <!-- mark: up-animation="fade-in" -->
```

The new items fade in below the existing ones.

An overlay plays an animation when it opens and another when it closes:

```html
<a href="/details" up-layer="new" up-animation="move-from-top" up-close-animation="move-to-top">Details</a> <!-- mark: up-animation="move-from-top" -->
```

To animate the removal of an element from JavaScript, pass an `{ animation }` option to `up.destroy()`:

```js
up.destroy('.flash', { animation: 'fade-out' })
```

<p class="read-more"><a href="/predefined-animations">Read more: Predefined animations</a></p>


Duration and easing
-------------------

Every effect takes 175 milliseconds by default and uses the `ease` timing function.
Override either on the element:

```html
<a href="/users" up-target=".list" up-transition="cross-fade" up-duration="400" up-easing="ease-out">Show users</a> <!-- mark: up-duration="400" up-easing="ease-out" -->
```

To change the defaults for all animations, set `up.motion.config.duration` and `up.motion.config.easing`.

<p class="read-more"><a href="/motion-tuning">Read more: Motion tuning</a></p>


Defining your own effects
-------------------------

A custom animation is a function that moves an element to its last frame.
Register it with `up.animation()`, and its name becomes available in `[up-animation]` attributes:

```js
up.animation('zoom-in', function(element, options) {
  element.style.transform = 'scale(0)'
  return up.animate(element, { transform: 'scale(1)' }, options) // mark: up.animate
})
```

Calling `up.animate()` with an object of CSS properties animates the element to those values.
Passing along `options` keeps the duration and easing the caller asked for.

A transition takes both elements and usually plays two animations at once:

```js
up.transition('zoom', function(oldElement, newElement, options) {
  return Promise.all([
    up.animate(oldElement, 'fade-out', options),
    up.animate(newElement, 'zoom-in', options)
  ])
})
```

Two animation names joined by a slash also make a transition, without any JavaScript:

```html
<a href="/users" up-target=".list" up-transition="fade-out/zoom-in">Show users</a> <!-- mark: up-transition="fade-out/zoom-in" -->
```


Also in this topic
------------------

Animations are off for users who prefer reduced motion. To switch them off for everyone,
e.g. in integration tests, see [[motion-tuning#disabling-animation-globally]].

A render pass is not finished until its transition has ended.
To run code after that, see [[motion-tuning#running-code-after-an-animation]].

Each overlay mode has its own default open and close animations.
To configure them, see [[customizing-overlays#animation]].

@page animation
@menu-title Overview
@signature
