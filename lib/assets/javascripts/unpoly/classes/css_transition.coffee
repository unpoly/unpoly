u = up.util
e = up.element

class up.CSSTransition

  constructor: (@element, @lastFrameKebab, options) ->
    @lastFrameKeysKebab = Object.keys(@lastFrameKebab)
    if u.some(@lastFrameKeysKebab, (key) -> key.match(/A-Z/))
      up.fail('Animation keys must be kebab-case')
    @finishEvent = options.finishEvent
    @duration = options.duration
    @easing = options.easing
    @finished = false

  start: =>
    if @lastFrameKeysKebab.length == 0
      @finished = true
      # If we have nothing to animate, we will never get a transitionEnd event
      # and the returned promise will never resolve.
      return Promise.resolve()

    @deferred = u.newDeferred()
    @pauseOldTransition()
    @startTime = new Date()
    @startFallbackTimer()
    @listenToFinishEvent()
    @listenToTransitionEnd()

    @startMotion()

    return @deferred.promise()

  listenToFinishEvent: =>
    if @finishEvent
      @stopListenToFinishEvent = @element.addEventListener(@finishEvent, @onFinishEvent)

  onFinishEvent: (event) =>
    # don't waste time letting the event bubble up the DOM
    event.stopPropagation()
    @finish()

  startFallbackTimer: =>
    timingTolerance = 100
    @fallbackTimer = u.timer (@duration + timingTolerance), =>
      @finish()

  stopFallbackTimer: =>
    clearTimeout(@fallbackTimer)

  listenToTransitionEnd: =>
    @stopListenToTransitionEnd = up.on(@element, 'transitionend', @onTransitionEnd)

  onTransitionEnd: (event) =>
    # Check if the transitionend event was caused by our own transition,
    # and not by some other transition that happens to affect this element.
    return unless event.target == @element

    # Check if we are receiving a late transitionEnd event
    # from a previous CSS transition.
    elapsed = new Date() - @startTime
    return unless elapsed > 0.25 * @duration

    completedPropertyKebab = event.propertyName
    return unless u.contains(@lastFrameKeysKebab, completedPropertyKebab)

    @finish()

  finish: =>
    # Make sure that any queued events won't finish multiple times.
    return if @finished
    @finished = true

    @stopFallbackTimer()
    @stopListenToFinishEvent?()
    @stopListenToTransitionEnd?()

    # Cleanly finish our own transition so the old transition
    # (or any other transition set right after that) will be able to take effect.
    e.concludeCSSTransition(@element)

    @resumeOldTransition()

    @deferred.resolve()

  pauseOldTransition: =>
    oldTransition = e.style(@element, [
      'transitionProperty',
      'transitionDuration',
      'transitionDelay',
      'transitionTimingFunction'
    ])

    if e.hasCSSTransition(oldTransition)
      # Freeze the previous transition at its current place, by setting the currently computed,
      # animated CSS properties as inline styles. Transitions on all properties will not be frozen,
      # since that would involve setting every single CSS property as an inline style.
      unless oldTransition.transitionProperty == 'all'
        oldTransitionProperties = oldTransition.transitionProperty.split(/\s*,\s*/)
        oldTransitionFrameKebab = e.style(@element, oldTransitionProperties)
        @setOldTransitionTargetFrame = e.setTemporaryStyle(@element, oldTransitionFrameKebab)

      # Stop the existing CSS transition so it does not emit transitionEnd events
      @setOldTransition = e.concludeCSSTransition(@element)

  resumeOldTransition: =>
    @setOldTransitionTargetFrame?()
    @setOldTransition?()

  startMotion: =>
    e.setStyle @element,
      transitionProperty: Object.keys(@lastFrameKebab).join(', ')
      transitionDuration: "#{@duration}ms"
      transitionTimingFunction: @easing
    e.setStyle(@element, @lastFrameKebab)

