u = up.util

class up.ScrollMotion

  # We want to make the default speed mimic Chrome's smooth scrolling behavior.
  # We also want to keep the default  valuein up.layout.config.scrollSpeed to be 1.
  # For our calculation in #animationFrame() we need to multiply it with this factor.
  SPEED_CALIBRATION = 0.065

  constructor: (@scrollable, @targetTop, options = {}) ->
    # The option for up.scroll() is { behavior }, but coming
    # from up.replace() it's { scrollBehavior }.
    @behavior = options.behavior ? options.scrollBehavior ? 'instant'

    # The option for up.scroll() is { behavior }, but coming
    # from up.replace() it's { scrollSpeed }.
    @speed = (options.speed ? options.scrollSpeed ? up.layout.config.scrollSpeed) * SPEED_CALIBRATION

  start: =>
    return new Promise (@resolve, @reject) =>
      if @behavior == 'smooth' && up.motion.isEnabled()
        @startAnimation()
      else
        @finish()

  startAnimation: ->
    @startTime = Date.now()
    @startTop = @scrollable.scrollTop
    @topDiff = @targetTop - @startTop
    @duration = Math.sqrt(Math.abs(@topDiff)) / @speed
    requestAnimationFrame(@animationFrame)

  animationFrame: =>
    return if @settled

    # When the scroll position is not the one we previously set, we assume
    # that the user has tried scrolling on her own. We then cancel the scrolling animation.
    if @frameTop && Math.abs(@frameTop - @scrollable.scrollTop) > 1.5
      @cancel('Animation aborted due to user intervention')

    currentTime = Date.now()
    timeElapsed = currentTime - @startTime
    timeFraction = Math.min(timeElapsed / @duration, 1)

    @frameTop = @startTop + (u.ease(timeFraction) * @topDiff)

    # When we're very close to the target top, finish the animation
    # directly to deal with rounding errors.
    if Math.abs(@targetTop - @frameTop) < 0.3
      @finish()
    else
      @scrollable.scrollTop = @frameTop
      requestAnimationFrame(@animationFrame)

  cancel: (reason) =>
    @settled = true
    @reject(new Error(reason))

  finish: =>
    # In case we're animating with emulation, cancel the next scheduled frame
    @settled = true
    # Setting the { scrollTop } prop will also finish a native scrolling
    # animation in Firefox and Chrome.
    @scrollable.scrollTop = @targetTop
    @resolve()
