const u = up.util
const e = up.element

up.CSSTransition = class CSSTransition {

  constructor(element, lastFrameKebab, options) {
    this._element = element
    this._lastFrameKebab = lastFrameKebab
    this._lastFrameKeysKebab = Object.keys(this._lastFrameKebab)
    if (u.some(this._lastFrameKeysKebab, key => key.match(/A-Z/))) {
      up.fail('Animation keys must be kebab-case')
    }
    this._finishEvent = options.finishEvent
    this._duration = options.duration
    this._easing = options.easing
    this._finished = false
  }

  start() {
    if (this._lastFrameKeysKebab.length === 0) {
      this._finished = true
      // If we have nothing to animate, we will never get a transitionEnd event
      // and the returned promise will never resolve.
      return Promise.resolve()
    }

    this._deferred = u.newDeferred()
    this._pauseOldTransition()
    this._startTime = new Date()
    this._startFallbackTimer()
    this._listenToFinishEvent()
    this._listenToTransitionEnd()

    this._startMotion()

    return this._deferred
  }

  _listenToFinishEvent() {
    if (this._finishEvent) {
      this._stopListenToFinishEvent = up.on(this._element, this._finishEvent, this._onFinishEvent.bind(this))
    }
  }

  _onFinishEvent(event) {
    // don't waste time letting the event bubble up the DOM
    event.stopPropagation()
    this._finish()
  }

  _startFallbackTimer() {
    const timingTolerance = 100
    this._fallbackTimer = u.timer((this._duration + timingTolerance), () => {
      this._finish()
    })
  }

  _stopFallbackTimer() {
    clearTimeout(this._fallbackTimer)
  }

  _listenToTransitionEnd() {
    this._stopListenToTransitionEnd = up.on(this._element, 'transitionend', this._onTransitionEnd.bind(this))
  }

  _onTransitionEnd(event) {
    // Check if the transitionend event was caused by our own transition,
    // and not by some other transition that happens to affect this element.
    if (event.target !== this._element) { return }

    // Check if we are receiving a late transitionEnd event
    // from a previous CSS transition.
    const elapsed = new Date() - this._startTime
    if (elapsed <= (0.25 * this._duration)) { return }

    const completedPropertyKebab = event.propertyName
    if (!u.contains(this._lastFrameKeysKebab, completedPropertyKebab)) { return }

    this._finish()
  }

  _finish() {
    // Make sure that any queued events won't finish multiple times.
    if (this._finished) { return }
    this._finished = true

    this._stopFallbackTimer()
    this._stopListenToFinishEvent?.()
    this._stopListenToTransitionEnd?.()

    // Cleanly finish our own transition so the old transition
    // (or any other transition set right after that) will be able to take effect.
    e.concludeCSSTransition(this._element)

    this._resumeOldTransition()

    this._deferred.resolve()
  }

  _pauseOldTransition() {
    const oldTransition = e.style(this._element, [
      'transitionProperty',
      'transitionDuration',
      'transitionDelay',
      'transitionTimingFunction'
    ])

    if (e.hasCSSTransition(oldTransition)) {
      // Freeze the previous transition at its current place, by setting the currently computed,
      // animated CSS properties as inline styles. Transitions on all properties will not be frozen,
      // since that would involve setting every single CSS property as an inline style.
      if (oldTransition.transitionProperty !== 'all') {
        const oldTransitionProperties = oldTransition.transitionProperty.split(/\s*,\s*/)
        const oldTransitionFrameKebab = e.style(this._element, oldTransitionProperties)
        this._setOldTransitionTargetFrame = e.setTemporaryStyle(this._element, oldTransitionFrameKebab)
      }

      // Stop the existing CSS transition so it does not emit transitionEnd events
      this._setOldTransition = e.concludeCSSTransition(this._element)
    }
  }

  _resumeOldTransition() {
    this._setOldTransitionTargetFrame?.()
    this._setOldTransition?.()
  }

  _startMotion() {
    e.setStyle(this._element, {
      transitionProperty: Object.keys(this._lastFrameKebab).join(', '),
      transitionDuration: `${this._duration}ms`,
      transitionTimingFunction: this._easing
    })
    e.setStyle(this._element, this._lastFrameKebab)
  }
}

