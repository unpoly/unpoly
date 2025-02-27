@partial attrs/follow/motion

@param [up-transition]
  The name of an [transition](/up.motion) to morph between the old and few fragment.

  If you are [prepending or appending content](/targeting-fragments#appending-or-prepending),
  use the `[up-animation]` attribute instead.

@param [up-animation]
  The name of an [animation](/up.motion) to reveal a new fragment when
  [prepending or appending content](/targeting-fragments#appending-or-prepending).

  If you are replacing content (the default), use the `[up-transition]` attribute instead.

@param [up-duration]
  The duration of the transition or animation (in millisconds).

@param [up-easing]
  The timing function that accelerates the transition or animation.

  See [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
  for a list of available timing functions.
