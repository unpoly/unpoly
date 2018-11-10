u = up.util

class up.ScrollMotion

  constructor: (@scrollable, @targetTop, @options = {}) ->

  start: =>
    # We set up a new promise so we can capture @resolve() for use in @finish()
    @promise = new Promise (@resolve, _reject) =>

    # The option for up.scroll() is { behavior }, but coming
    # from up.replace() it's { scrollBehavior }.
    behavior = @options.behavior ? @options.scrollBehavior

    if behavior == 'smooth' && up.motion.isEnabled()
      if up.browser.canSmoothScroll()
        @startNativeAnimation()
      else if up.browser.canAnimationFrame()
        @startEmulatedAnimation()
      else
        @finish()
    else
      @finish()

  startNativeAnimation: ->
    @scrollable.scrollTo({ left: 0, top: @targetTop, behavior: 'smooth'})

  startEmulatedAnimation: ->
    @startTime = Date.now()
    @startTop = @scrollable.scrollTop
    @topDiff = @targetTop - @startTop
    @duration = Math.abs(@topDiff) / up.layout.config.scrollSpeed
    requestAnimationFrame(@emulatedFrame)

  emulatedFrame: =>
    return if @finished

    currentTime = Date.now()
    timeElapsed = currentTime - @startTime
    timeFraction = Math.min(timeElapsed / @duration, 1)
    frameTop = @startTop + (u.ease(timeFraction) * @topDiff)

    if Math.abs(@targetTop - frameTop) < 0.25
      @finish()
    else
      scrollable.scrollTop = frameTop
      requestAnimationFrame(@emulatedFrame)

  finish: =>
    # In case we're animating with emulation, cancel the next scheduled frame
    @finished = true

    # Setting the { scrollTop } prop will also finish a native scrolling
    # animation in Firefox and Chrome.
    @scrollable.scrollTop = @targetTop
    @resolve()

  @run: (args...) ->
    animation = new @(args...)
    animation.promise
