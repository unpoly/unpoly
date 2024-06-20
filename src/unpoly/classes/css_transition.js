const u = up.util
const e = up.element

up.CSSTransition = class CSSTransition {

  constructor(element, lastFrame, options) {
    this._element = element
    this._lastFrame = lastFrame
    this._lastFrameKeys = Object.keys(this._lastFrame)
    this._finishEvent = options.finishEvent
    this._duration = options.duration
    this._easing = options.easing
    this._finished = false
  }

  start() {
    if (this._lastFrameKeys.length === 0) {
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
    this._fallbackTimer = u.timer((this._duration + timingTolerance), () => this._finish())
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

    const completedProperty = event.propertyName
    if (u.contains(this._lastFrameKeys, completedProperty)) {
      this._finish()
    }
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
      'transition-property',
      'transition-duration',
      'transition-delay',
      'transition-timing-function'
    ])

    if (e.hasCSSTransition(oldTransition)) {
      // Freeze the previous transition at its current place, by setting the currently computed,
      // animated CSS properties as inline styles. Transitions on all properties will not be frozen,
      // since that would involve setting every single CSS property as an inline style.
      if (oldTransition['transition-property'] !== 'all') {
        const oldTransitionProperties = oldTransition['transition-property'].split(/\s*,\s*/)
        const oldTransitionFrame = e.style(this._element, oldTransitionProperties)
        this._setOldTransitionTargetFrame = e.setTemporaryStyle(this._element, oldTransitionFrame)
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
      'transition-property': this._lastFrameKeys.join(),
      'transition-duration': `${this._duration}ms`,
      'transition-timing-function': this._easing
    })
    // TODO: Can this be the same setStyle()?
    e.setStyle(this._element, this._lastFrame)
  }
}

