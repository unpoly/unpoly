const u = up.util
const e = up.element

up.LinkFollowIntent = class LinkFollowIntent {

  constructor(link, callback) {
    this._link = link
    this._callback = callback
    this._lastRequest = null
    this._on('mouseenter mousedown touchstart', (event) => this._scheduleCallback(event))
    this._on('mouseleave', () => this._unscheduleCallback())
    // Don't preload if the link was removed from the DOM while we were waiting for the timer.
    // This also happens in specs, when the timer terminates after a spec has ended.
    up.fragment.onAborted(this._link, () => this._unscheduleCallback())
  }

  _on(eventType, fn) {
    up.on(this._link, eventType, { passive: true }, fn)
  }

  _scheduleCallback(event) {
    // Don't preload when the user is holding down CTRL or SHIFT.
    if (!up.link.shouldFollowEvent(event, this._link)) return

    this._unscheduleCallback()

    // On pointerdown we preload immediately.
    // On mouseenter we wait for a short while (90ms) whether the cursor stays on the link.
    const applyDelay = (event.type === 'mouseenter')
    if (applyDelay) {
      let delay = this._parseDelay()
      this._timer = u.timer(delay, () => this._runCallback(event))
    } else {
      this._runCallback(event)
    }
  }

  _unscheduleCallback() {
    clearTimeout(this._timer)

    // Only abort if the request is still preloading.
    // If the user has clicked on the link while the request was in flight,
    // and then unhovered the link, we do not abort the navigation.
    if (this._lastRequest?.background) this._lastRequest.abort()
    this._lastRequest = null
  }

  _parseDelay() {
    return e.numberAttr(this._link, 'up-preload-delay') ?? up.link.config.preloadDelay
  }

  _runCallback(event) {
    up.log.putsEvent(event)

    // (1) Remember the request when sent
    // (2) All callbacks from up.link already mute uncritical rejections.
    //     We cannot do it here, as the callbacks are also passed to other places,
    //     like to onFirstIntersect().
    this._callback({ onRequestKnown: (request) => this._lastRequest = request })
  }
}
