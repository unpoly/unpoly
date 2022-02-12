const u = up.util
const e = up.element

up.CSSTransition = class CSSTransition {

  constructor(element, lastFrameKebab, options) {
    this.element = element
    this.lastFrameKebab = lastFrameKebab
    this.lastFrameKeysKebab = Object.keys(this.lastFrameKebab)
    if (u.some(this.lastFrameKeysKebab, key => key.match(/A-Z/))) {
      up.fail('Animation keys must be kebab-case')
    }
    this.finishEvent = options.finishEvent
    this.duration = options.duration
    this.easing = options.easing
    this.finished = false
  }

  start() {
    if (this.lastFrameKeysKebab.length === 0) {
      this.finished = true
      // If we have nothing to animate, we will never get a transitionEnd event
      // and the returned promise will never resolve.
      return Promise.resolve()
    }

    this.deferred = u.newDeferred()
    this.pauseOldTransition()
    this.startTime = new Date()
    this.startFallbackTimer()
    this.listenToFinishEvent()
    this.listenToTransitionEnd()

    this.startMotion()

    return this.deferred
  }

  listenToFinishEvent() {
    if (this.finishEvent) {
      this.stopListenToFinishEvent = up.on(this.element, this.finishEvent, this.onFinishEvent.bind(this))
    }
  }

  onFinishEvent(event) {
    // don't waste time letting the event bubble up the DOM
    event.stopPropagation()
    this.finish()
  }

  startFallbackTimer() {
    const timingTolerance = 100
    this.fallbackTimer = u.timer((this.duration + timingTolerance), () => {
      this.finish()
    })
  }

  stopFallbackTimer() {
    clearTimeout(this.fallbackTimer)
  }

  listenToTransitionEnd() {
    this.stopListenToTransitionEnd = up.on(this.element, 'transitionend', this.onTransitionEnd.bind(this))
  }

  onTransitionEnd(event) {
    // Check if the transitionend event was caused by our own transition,
    // and not by some other transition that happens to affect this element.
    if (event.target !== this.element) { return; }

    // Check if we are receiving a late transitionEnd event
    // from a previous CSS transition.
    const elapsed = new Date() - this.startTime
    if (elapsed <= (0.25 * this.duration)) { return; }

    const completedPropertyKebab = event.propertyName
    if (!u.contains(this.lastFrameKeysKebab, completedPropertyKebab)) { return; }

    this.finish()
  }

  finish() {
    // Make sure that any queued events won't finish multiple times.
    if (this.finished) { return; }
    this.finished = true

    this.stopFallbackTimer()
    this.stopListenToFinishEvent?.()
    this.stopListenToTransitionEnd?.()

    // Cleanly finish our own transition so the old transition
    // (or any other transition set right after that) will be able to take effect.
    e.concludeCSSTransition(this.element)

    this.resumeOldTransition()

    this.deferred.resolve()
  }

  pauseOldTransition() {
    const oldTransition = e.style(this.element, [
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
        const oldTransitionFrameKebab = e.style(this.element, oldTransitionProperties)
        this.setOldTransitionTargetFrame = e.setTemporaryStyle(this.element, oldTransitionFrameKebab)
      }

      // Stop the existing CSS transition so it does not emit transitionEnd events
      this.setOldTransition = e.concludeCSSTransition(this.element)
    }
  }

  resumeOldTransition() {
    this.setOldTransitionTargetFrame?.()
    this.setOldTransition?.()
  }

  startMotion() {
    e.setStyle(this.element, {
      transitionProperty: Object.keys(this.lastFrameKebab).join(', '),
      transitionDuration: `${this.duration}ms`,
      transitionTimingFunction: this.easing
    })
    e.setStyle(this.element, this.lastFrameKebab)
  }
}

