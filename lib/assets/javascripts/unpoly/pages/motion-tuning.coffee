  ###**
  Motion tuning
  =============

  When updating page fragments, you may animate the change using an
  ´{ animation }` or `{ transition }` option. Respectively you may use an
  `[up-animation]` or `[up-transition]` HTML attribute.

  The page details some features to fine-tune the animation effect.


  \#\#\# Changing the duration

  You may change the duration of an animation or transition by passing a `{ duration }` option.
  Its value is the duration in milliseconds.

  The default is `{ duration: 175 }`. You may change this with `up.motion.config.duration`.


  \#\#\# Easing

  To control the acceleration of an animation, pass an `{ easing }` option.

  See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
  for a list of pre-defined timing functions.

  The default is `{ easing: 'ease' }`. You may change this with `up.motion.config.easing`.


  \#\#\# Disabling animation globally

  By default animations are enabled unless the user has chosen to minimize non-essential
  motion it in their system.

  To force-enable animations for all users, set `up.motion.config.enabled = true`.

  To disable animations for all users, set `up.motion.config.enabled = false`. This is useful to
  [minimize concurrency](https://makandracards.com/makandra/47336-fixing-flaky-integration-tests)
  automated integration tests.


  @page motion-tuning
  ###
