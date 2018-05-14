u = up.util

class up.CssTransition

  constructor: ($element, lastFrame, options) ->
    @$element = $element
    @element = u.element($element)
    @lastFrameCamel = u.camelCaseKeys(lastFrame)
    @lastFrameKebab = u.kebabCaseKeys(lastFrame)
    @lastFrameKeysKebab = Object.keys(@lastFrameKebab)
    @finishEvent = options.finishEvent
    @duration = options.duration
    @delay = options.delay
    @totalDuration = @delay + @duration
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
      @$element.on(@finishEvent, @onFinishEvent)

  stopListenToFinishEvent: =>
    if @finishEvent
      @$element.off(@finishEvent, @onFinishEvent)

  onFinishEvent: (event) =>
    # don't waste time letting the event bubble up the DOM
    event.stopPropagation()
    @finish()

  startFallbackTimer: =>
    timingTolerance = 100
    @fallbackTimer = u.setTimer (@totalDuration + timingTolerance), =>
      @finish()

  stopFallbackTimer: =>
    clearTimeout(@fallbackTimer)

  listenToTransitionEnd: =>
    @$element.on 'transitionend', @onTransitionEnd

  stopListenToTransitionEnd: =>
    @$element.off 'transitionend', @onTransitionEnd

  onTransitionEnd: (event) =>
    # Check if the transitionend event was caused by our own transition,
    # and not by some other transition that happens to affect this element.
    return unless event.target == @element

    # Check if we are receiving a late transitionEnd event
    # from a previous CSS transition.
    elapsed = new Date() - @startTime
    return unless elapsed > 0.25 * @totalDuration

    completedPropertyKebab = event.originalEvent.propertyName
    return unless u.contains(@lastFrameKeysKebab, completedPropertyKebab)

    @finish()

  finish: =>
    # Make sure that any queued events won't finish multiple times.
    return if @finished
    @finished = true

    @stopFallbackTimer()
    @stopListenToFinishEvent()
    @stopListenToTransitionEnd()

    # Cleanly finish our own transition so the old transition
    # (or any other transition set right after that) will be able to take effect.
    u.concludeCssTransition(@element)

    @resumeOldTransition()

    @deferred.resolve()

  pauseOldTransition: =>
    oldTransition = u.readComputedStyle(@element, [
      'transitionProperty',
      'transitionDuration',
      'transitionDelay',
      'transitionTimingFunction'
    ])

    if u.hasCssTransition(oldTransition)
      # Freeze the previous transition at its current place, by setting the currently computed,
      # animated CSS properties as inline styles. Transitions on all properties will not be frozen,
      # since that would involve setting every single CSS property as an inline style.
      unless oldTransition.transitionProperty == 'all'
        oldTransitionProperties = oldTransition.transitionProperty.split(/\s*,\s*/)
        oldTransitionFrameKebab = u.readComputedStyle(@element, oldTransitionProperties)
        oldTransitionFrameCamel = u.camelCaseKeys(oldTransitionFrameKebab)
        @setOldTransitionTargetFrame = u.writeTemporaryStyle(@element, oldTransitionFrameCamel)

      # Stop the existing CSS transition so it does not emit transitionEnd events
      @setOldTransition = u.concludeCssTransition(@element)

  resumeOldTransition: =>
    @setOldTransitionTargetFrame?()
    @setOldTransition?()

  startMotion: =>
    u.writeInlineStyle @element,
      transitionProperty: Object.keys(@lastFrameKebab).join(', ')
      transitionDuration: "#{@duration}ms"
      transitionDelay: "#{@delay}ms"
      transitionTimingFunction: @easing
    u.writeInlineStyle(@element, @lastFrameCamel)

