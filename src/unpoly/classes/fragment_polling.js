const e = up.element
const u = up.util

up.FragmentPolling = class FragmentPolling {

  static forFragment(fragment) {
    return fragment.upPolling ||= new this(fragment)
  }

  constructor(fragment) {
    this._options = up.radio.pollOptions(fragment)

    this._fragment = fragment
    up.destructor(fragment, this._onFragmentDestroyed.bind(this))

    this._state = 'stopped' // stopped | started
    this._forceIntent = null // stop | start

    this._reloadJID = u.uid()

    // this._abortable = true
    this._loading = false
    this._satisfyInterval()
  }

  onPollAttributeObserved() {
    this._start()
  }

  _onFragmentAborted({ newLayer, jid }) {
    const isOurAbort = (jid === this._reloadJID)
    if (isOurAbort || newLayer) return
    this._stop()
  }

  _onFragmentKept() {
    if (this._forceIntent !== 'stop') {
      this._start()
    }
  }

  _onFragmentDestroyed() {
    // The element may come back (when it is swapped) or or may not come back (when it is destroyed).
    // If it does come back, `onPollAttributeObserved()` will restart the polling.
    this._stop()
  }

  _start(options) {
    Object.assign(this._options, options)

    if (this._state === 'stopped') {
      if (!up.fragment.isTargetable(this._fragment)) {
        up.warn('[up-poll]', 'Cannot poll untargetable fragment %o', this._fragment)
        return
      }

      this._state = 'started'
      this._bindEvents()
      this._scheduleRemainingTime()
    }
  }

  _stop() {
    if (this._state === 'started') {
      this._clearReloadTimer()  // don't keep inactive tabs awake
      this._state = 'stopped'
    }
  }

  forceStart(options) {
    Object.assign(this._options, options)
    this._forceIntent = 'start'
    this._start()
  }

  forceStop() {
    this._forceIntent = 'stop'
    this._stop()
  }

  _bindEvents() {
    if (this._eventsBound) return
    this._eventsBound = true

    up.destructor(this._fragment, up.on('visibilitychange up:layer:opened up:layer:dismissed up:layer:accepted', this._onVisibilityChange.bind(this)))
    up.fragment.onAborted(this._fragment, this._onFragmentAborted.bind(this))
    up.fragment.onKept(this._fragment, this._onFragmentKept.bind(this))
  }

  _onVisibilityChange() {
    if (this._isFragmentVisible()) {
      this._scheduleRemainingTime() // will check started
    } else {
      this._clearReloadTimer()
    }
  }

  _isFragmentVisible() {
    return (!document.hidden) &&
      (this._options.ifLayer === 'any' || this._isOnFrontLayer())
  }

  _clearReloadTimer() {
    clearTimeout(this._reloadTimer)
    this._reloadTimer = null
  }

  _scheduleRemainingTime() {
    if (this._reloadTimer || this._loading || this._state === 'stopped') return

    this._clearReloadTimer()
    this._reloadTimer = setTimeout(
      this._onTimerReached.bind(this),
      this._getRemainingDelay()
    )
  }

  _onTimerReached() {
    this._reloadTimer = null
    this._tryReload()
  }

  _tryReload() {
    // The setTimeout(doReload) callback might already be scheduled
    // before the polling stopped.
    if (this._state === 'stopped') {
      return
    }

    if (!up.fragment.isAlive(this._fragment)) {
      this._stop()
      up.puts('[up-poll]', 'Stopped polling a detached fragment')
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

    // Don't schedule timers while we're loading. _onReloadSuccess() and _onReloadFailure() will do that for us.
    this._loading = true

    let guardEvent = up.event.build('up:fragment:poll', { log: ['Polling fragment', this._fragment] })
    let reloadOptions = { ...this._options, guardEvent, jid: this._reloadJID }

    up.reload(this._fragment, reloadOptions).then(
      this._onReloadSuccess.bind(this),
      this._onReloadFailure.bind(this)
    )
  }

  _onReloadSuccess({ fragment }) {
    this._loading = false
    this._satisfyInterval()

    if (fragment) {
      // No need to _scheduleRemainingTime() in this branch:
      //
      // (1) Either the new fragment also has an [up-poll] and we have already started in _onPollAttributeObserved().
      // (2) Or we are force-started and we will start in _onFragmentSwapped().
      this._onFragmentSwapped(fragment)
    } else {
      // The server may have opted to not send an update (e.g. if there is no fresher content) or if the fragment was kept.
      // In that case we try again in the next interval.
      this._scheduleRemainingTime()
    }
  }

  _onFragmentSwapped(newFragment) {
    if (this._forceIntent === 'start' && up.fragment.matches(this._fragment, newFragment)) {
      // Force start the new up.Polling instance for the new fragment.
      this.constructor.forFragment(newFragment).forceStart(this._options)
    }
  }

  _onReloadFailure(reason) {
    // Because we didn't supply a { failTarget } or { fallback } option, we can only reach
    // this branch for a fatal render error.
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
