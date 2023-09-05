const e = up.element

up.FragmentPolling = class FragmentPolling {

  constructor(fragment) {
    this.options = up.radio.pollOptions(fragment)

    this.fragment = fragment
    up.destructor(fragment, this.onFragmentDestroyed.bind(this))
    up.fragment.onAborted(fragment, this.onFragmentAborted.bind(this))

    this.state = 'initialized' // 'initialized' || 'started' || 'stopped'
    this.abortable = true
    this.loading = false
    this.satisfyInterval()
  }

  static forFragment(fragment) {
    return fragment.upPolling ||= new this(fragment)
  }

  onPollAttributeObserved() {
    this.start()
  }

  onFragmentDestroyed() {
    // The element may come back (when it is swapped) or or may not come back (when it is destroyed).
    // If it does come back, `onPollAttributeObserved()` will restart the polling.
    this.stop()
  }

  start(options) {
    Object.assign(this.options, options)

    if (this.state !== 'started') {
      if (!up.fragment.isTargetable(this.fragment)) {
        up.warn('[up-poll]', 'Cannot poll untargetable fragment %o', this.fragment)
        return
      }

      this.state = 'started'
      this.ensureEventsBound()
      this.scheduleRemainingTime()
    }
  }

  stop() {
    if (this.state === 'started') {
      this.clearReloadTimer()
      this.state = 'stopped'
      this.unbindEvents?.()
    }
  }

  forceStart(options) {
    Object.assign(this.options, options)
    this.forceStarted = true
    this.start()
  }

  forceStop() {
    this.stop()
    this.forceStarted = false
  }

  ensureEventsBound() {
    if (!this.unbindEvents) {
      this.unbindEvents = up.on('visibilitychange up:layer:opened up:layer:dismissed up:layer:accepted', this.onVisibilityChange.bind(this))
    }
  }

  onVisibilityChange() {
    if (this.isFragmentVisible()) {
      this.scheduleRemainingTime()
    } else {
      // Let the existing timer play out for two reasons:
      //
      // 1. The fragment may become visible again before the timer runs out
      // 2. Print the reason for not polling to the console once.
    }
  }

  isFragmentVisible() {
    return (this.options.ifTab   === 'any' || !document.hidden) &&
           (this.options.ifLayer === 'any' || this.isOnFrontLayer())
  }

  clearReloadTimer() {
    clearTimeout(this.reloadTimer)
    this.reloadTimer = null
  }

  scheduleRemainingTime() {
    if (!this.reloadTimer && !this.loading) {
      this.clearReloadTimer()
      this.reloadTimer = setTimeout(
        this.onTimerReached.bind(this),
        this.getRemainingDelay()
      )
    }
  }

  onTimerReached() {
    this.reloadTimer = null
    this.tryReload()
  }

  tryReload() {
    // The setTimeout(doReload) callback might already be scheduled
    // before the polling stopped.
    if (this.state !== 'started') {
      return
    }

    if (!this.isFragmentVisible()) {
      up.puts('[up-poll]', 'Will not poll hidden fragment')
      // (1) We don't need to re-schedule a timer here. onVisibilityChange() will do that for us.
      // (2) Also we prefer to not have pending timers in inactive tabs to save resources.
      return
    }

    if (up.emit(this.fragment, 'up:fragment:poll', { log: ['Polling fragment', this.fragment] }).defaultPrevented) {
      up.puts('[up-poll]', 'User prevented up:fragment:poll event')
      this.satisfyInterval() // Block polling for a full interval
      this.scheduleRemainingTime() // There is no event that would re-schedule for us
      return
    }

    this.reloadNow()
  }

  getFullDelay() {
    return this.options.interval ?? e.numberAttr(this.fragment, 'up-interval') ?? up.radio.config.pollInterval
  }

  getRemainingDelay() {
    return Math.max(this.getFullDelay() - this.getFragmentAge(), 0)
  }

  getFragmentAge() {
    return new Date() - this.lastAttempt
  }

  isOnFrontLayer() {
    this.layer ||= up.layer.get(this.fragment)
    return this.layer?.isFront?.()
  }

  reloadNow() {
    // If we were called manually (not by a timeout), clear a scheeduled timeout to prevent concurrency.
    // The timeout will be re-scheduled by this.onReloadSuccess() or this.onReloadFailure().
    this.clearReloadTimer()

    let reloadOptions = {
      url: this.options.url,
      fail: false,
      background: true,
    }

    let oldAbortable = this.abortable

    try {
      // Prevent our own reloading from aborting ourselves.
      this.abortable = false

      // Don't schedule timers while we're loading. onReloadSuccess() and onReloadFailure() will do that for us.
      this.loading = true

      up.reload(this.fragment, reloadOptions).then(
        this.onReloadSuccess.bind(this),
        this.onReloadFailure.bind(this)
      )
    } finally {
      // Now that our own render pass has process abort options (this happens sync),
      // we can resume listening to abort signals.
      this.abortable = oldAbortable
    }
  }

  onFragmentAborted({ newLayer }) {
    // We temporarily set this.abortable to false while we're reloading our fragment, which also aborts our fragment.
    if (this.abortable && !newLayer) {
      this.stop()
    }
  }

  onReloadSuccess({ fragment }) {
    this.loading = false
    this.satisfyInterval()

    if (fragment) {
      // No need to scheduleRemainingTime() in this branch:
      //
      // (1) Either the new fragment also has an [up-poll] and we have already started in #onPollAttributeObserved().
      // (2) Or we are force-started and we will start in #onFragmentSwapped().
      this.onFragmentSwapped(fragment)
    } else {
      // The server may have opted to not send an update, e.g. if there is no fresher content.
      // In that case we try again in the next interval.
      this.scheduleRemainingTime()
    }
  }

  onFragmentSwapped(newFragment) {
    this.stop()

    if (this.forceStarted && up.fragment.matches(this.fragment, newFragment)) {
      // Force start the new up.Polling instance for the new fragment.
      this.constructor.forFragment(newFragment).forceStart(this.options)
    }
  }

  onReloadFailure(reason) {
    this.loading = false
    this.satisfyInterval()
    this.scheduleRemainingTime()
    up.error.rethrowCritical(reason)
  }

  satisfyInterval() {
    // This will delay the next timer scheduling for a full interval.
    this.lastAttempt = new Date()
  }

}
