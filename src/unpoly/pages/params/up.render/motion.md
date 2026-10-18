@partial up.render/motion

@param {string} [options.transition]
  The name of a [transition](/api/up.motion) to morph between the old and new fragment.

  If you are [prepending or appending content](/learn/targeting-fragments#appending-or-prepending),
  use the `{ animation }` option instead.

@param {string} [options.animation]
  The name of an [animation](/learn/animations) to play on the new content when
  [prepending or appending content](/learn/targeting-fragments#appending-or-prepending).

  If you are [swapping a fragment](/learn/targeting-fragments#swapping) (the default), use the `{ transition }` option instead.

@param {number} [options.duration]
  The duration of the transition or animation (in milliseconds).

@param {string} [options.easing]
  The timing function that accelerates the transition or animation.

  See [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
  for a list of available timing functions.
