const e = up.element

up.FragmentPolling = class FragmentPolling {

  constructor(fragment) {
    this._options = up.radio.pollOptions(fragment)

    this._fragment = fragment
    up.destructor(fragment, this._onFragmentDestroyed.bind(this))
    up.fragment.onAborted(fragment, this._onFragmentAborted.bind(this))

    this._state = 'initialized' // 'initialized' || 'started' || 'stopped'
    this._abortable = true
    this._loading = false
    this._satisfyInterval()
  }

  static forFragment(fragment) {
    return fragment.upPolling ||= new this(fragment)
  }

  onPollAttributeObserved() {
    this._start()
  }

  _onFragmentDestroyed() {
    // The element may come back (when it is swapped) or or may not come back (when it is destroyed).
    // If it does come back, `onPollAttributeObserved()` will restart the polling.
    this._stop()
  }

  _start(options) {
    Object.assign(this._options, options)

    if (this._state !== 'started') {
      if (!up.fragment.isTargetable(this._fragment)) {
        up.warn('[up-poll]', 'Cannot poll untargetable fragment %o', this._fragment)
        return
      }

      this._state = 'started'
      this._ensureEventsBound()
      this._scheduleRemainingTime()
    }
  }

  _stop() {
    if (this._state === 'started') {
      this._clearReloadTimer()
      this._state = 'stopped'
      this.unbindEvents?.()
    }
  }

  forceStart(options) {
    Object.assign(this._options, options)
    this.forceStarted = true
    this._start()
  }

  forceStop() {
    this._stop()
    this.forceStarted = false
  }

  _ensureEventsBound() {
    if (!this.unbindEvents) {
      this.unbindEvents = up.on('visibilitychange up:layer:opened up:layer:dismissed up:layer:accepted', this._onVisibilityChange.bind(this))
    }
  }

  _onVisibilityChange() {
    if (this._isFragmentVisible()) {
      this._scheduleRemainingTime()
    } else {
      // Let the existing timer play out for two reasons:
      //
      // 1. The fragment may become visible again before the timer runs out
      // 2. Print the reason for not polling to the console once.
    }
  }

  _isFragmentVisible() {
    return (!document.hidden) &&
           (this._options.ifLayer === 'any' || this._isOnFrontLayer())
  }

  _clearReloadTimer() {
    clearTimeout(this.reloadTimer)
    this.reloadTimer = null
  }

  _scheduleRemainingTime() {
    if (!this.reloadTimer && !this._loading) {
      this._clearReloadTimer()
      this.reloadTimer = setTimeout(
        this._onTimerReached.bind(this),
        this._getRemainingDelay()
      )
    }
  }

  _onTimerReached() {
    this.reloadTimer = null
    this._tryReload()
  }

  _tryReload() {
    // The setTimeout(doReload) callback might already be scheduled
    // before the polling stopped.
    if (this._state !== 'started') {
      return
    }

    if (!this._isFragmentVisible()) {
      up.puts('[up-poll]', 'Will not poll hidden fragment')
      // (1) We don't need to re-schedule a timer here. _onVisibilityChange() will do that for us.
      // (2) Also we prefer to not have pending timers in inactive tabs to save resources.
      return
    }

    this._reloadNow()
  }

  _getFullDelay() {
    return this._options.interval ?? e.numberAttr(this._fragment, 'up-interval') ?? up.radio.config.pollInterval
  }

  _getRemainingDelay() {
    return Math.max(this._getFullDelay() - this._getFragmentAge(), 0)
  }

  _getFragmentAge() {
    return new Date() - this._lastAttempt
  }

  _isOnFrontLayer() {
    this.layer ||= up.layer.get(this._fragment)
    return this.layer?.isFront?.()
  }

  _reloadNow() {
    // If we were called manually (not by a timeout), clear a scheduled timeout to prevent concurrency.
    // The timeout will be re-scheduled by this._onReloadSuccess() or this._onReloadFailure().
    this._clearReloadTimer()

    let oldAbortable = this._abortable

    try {
      // Prevent our own reloading from aborting ourselves.
      this._abortable = false

      // Don't schedule timers while we're loading. _onReloadSuccess() and _onReloadFailure() will do that for us.
      this._loading = true

      up.reload(this._fragment, this._reloadOptions()).then(
        this._onReloadSuccess.bind(this),
        this._onReloadFailure.bind(this)
      )
    } finally {
      // Now that our own render pass has process abort options (this happens sync),
      // we can resume listening to abort signals.
      this._abortable = oldAbortable
    }
  }

  _reloadOptions() {
    let guardEvent = up.event.build('up:fragment:poll', { log: ['Polling fragment', this._fragment] })
    return { ...this._options, guardEvent }
  }

  _onFragmentAborted({ newLayer }) {
    // We temporarily set this._abortable to false while we're reloading our fragment, which also aborts our fragment.
    if (this._abortable && !newLayer) {
      this._stop()
    }
  }

  _onReloadSuccess({ fragment }) {
    this._loading = false
    this._satisfyInterval()

    if (fragment) {
      // No need to _scheduleRemainingTime() in this branch:
      //
      // (1) Either the new fragment also has an [up-poll] and we have already started in _onPollAttributeObserved().
      // (2) Or we are force-started and we will start in __onFragmentSwapped().
      this._onFragmentSwapped(fragment)
    } else {
      // The server may have opted to not send an update, e.g. if there is no fresher content.
      // In that case we try again in the next interval.
      this._scheduleRemainingTime()
    }
  }

  _onFragmentSwapped(newFragment) {
    this._stop()

    if (this.forceStarted && up.fragment.matches(this._fragment, newFragment)) {
      // Force start the new up.Polling instance for the new fragment.
      this.constructor.forFragment(newFragment).forceStart(this._options)
    }
  }

  _onReloadFailure(reason) {
    this._loading = false
    this._satisfyInterval()
    this._scheduleRemainingTime()
    up.error.throwCritical(reason)
  }

  _satisfyInterval() {
    // This will delay the next timer scheduling for a full interval.
    this._lastAttempt = new Date()
  }

}
