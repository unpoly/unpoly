Motion
======

Unpoly can animate a fragment update: the old content fades or slides out while
the new content comes in. You pick an effect by name in an HTML attribute,
or define your own with a few lines of JavaScript. Users who have asked their
system to reduce motion get instant updates instead.

Unpoly knows two kinds of effects. A *transition* morphs an old element into its new version.
An *animation* plays on a single element that has no counterpart, like a new list item or an opening overlay.


Morphing between old and new {#transitions}
----------------------------

<a id="available-transitions"></a>
<a id="fail-transition"></a>
<a id="combining-animations"></a>
<a id="how-a-transition-plays"></a>
<a id="custom-transitions"></a>

When a fragment is swapped, a transition animates the change.
Set an `[up-transition]` attribute on a link or form:

```html
<a href="/stories/2" up-target="#story" up-transition="move-left">Next story</a> <!-- mark: up-transition="move-left" -->
```

When the response arrives, the old `#story` moves out to the left while the new one moves in from the right.
Unpoly ships with transitions like `cross-fade` and `move-left`, and you can combine
any two animations into a new transition.

[[more: transitions]]


Revealing a single element {#animations}
--------------------------

<a id="available-animations"></a>
<a id="custom-effects"></a>
<a id="animating-css-properties"></a>
<a id="custom-animations"></a>
<a id="custom-effect-contract"></a>

Some updates have no old element to morph from: appending to a list, opening an overlay,
or removing an element. These play an animation on the new or departing element:

```html
<a href="/tasks?page=2" up-target=".tasks:after" up-animation="fade-in">Load more</a> <!-- mark: up-animation="fade-in" -->
```

The new items fade in below the existing ones.
To animate any element from JavaScript, call `up.animate()`.

[[more: animations]]


Controlling motion {#controlling-motion}
------------------

<a id="duration-and-easing"></a>
<a id="duration"></a>
<a id="easing"></a>
<a id="disabling-animation-globally"></a>
<a id="running-code-after-an-animation"></a>
<a id="finishing-running-animations"></a>

You can change the duration and easing of every effect, per element or for the whole app,
and users who prefer reduced motion see no animations at all.

[[more: controlling-motion]]


See also
--------

To change the default animations of overlays, see [[customizing-overlays#animation]].


@page motion
@menu-title Overview
@signature
