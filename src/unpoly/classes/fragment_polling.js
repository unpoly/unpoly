const e = up.element

up.FragmentPolling = class FragmentPolling {

  constructor(fragment) {
    this.options = {}
    this.state = 'initialized'
    this.setFragment(fragment)
    this.abortable = true
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

  onFragmentAborted() {
    if (this.abortable) {
      this.stop()
    }
  }

  start() {
    if (this.state !== 'started') {
      this.state = 'started'
      this.scheduleReload()
    }
  }

  stop() {
    if (this.state === 'started') {
      clearTimeout(this.reloadTimer)
      this.state = 'stopped'
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

  scheduleReload(delay = this.getInterval()) {
    this.reloadTimer = setTimeout(() => this.reload(), delay)
  }

  reload() {
    // The setTimeout(doReload) callback might already be scheduled
    // before the polling stopped.
    if (this.state !== 'started') { return }

    let issue = up.radio.pollIssue(this.fragment)
    if (issue) {
      up.puts('[up-poll]', `Will not poll: ${issue}`)
      // Reconsider after 10 seconds at most
      let reconsiderDisabledDelay = Math.min(10 * 1000, this.getInterval())
      this.scheduleReload(reconsiderDisabledDelay)
    } else {
      this.reloadNow()
    }
  }

  reloadNow() {
    let reloadOptions = {
      url: this.options.url,
      fail: false,
      background: true,
    }

    // Prevent our own reloading from aborting ourselves.
    let oldAbortable = this.abortable
    this.abortable = false
    up.reload(this.fragment, reloadOptions).then(
      this.onReloadSuccess.bind(this),
      this.onReloadFailure.bind(this)
    )
    this.abortable = oldAbortable
  }

  onReloadSuccess({ fragment }) {
    // Transfer this instance to the new fragment.
    // We can remove this in case we don't implement forced start/stop.
    if (fragment) {
      // No need to scheduleReload() in this branch:
      // (1) Either the new fragment also has an [up-poll] and we have already
      //     started in #onPollAttributeObserved().
      // (2) Or we are force-started and we will start in #onFragmentSwapped().
      this.onFragmentSwapped(fragment)
    } else {
      // The server may have opted to not send an update, e.g. if there is no fresher content.
      // In that case we try again in the next interval.
      this.scheduleReload()
    }
  }

  onReloadFailure(reason) {
    this.scheduleReload()
    up.error.rethrowCritical(reason)
  }

  onFragmentSwapped(newFragment) {
    this.stop()

    if (this.forceStarted && up.fragment.matches(this.fragment, newFragment)) {
      this.constructor.forFragment(newFragment).forceStart(this.options)
    }
  }

  setFragment(newFragment) {
    this.fragment = newFragment
    up.destructor(newFragment, () => this.onFragmentDestroyed())
    up.fragment.onAborted(newFragment, () => this.onFragmentAborted())
  }


  getInterval() {
    let interval = this.options.interval ?? e.numberAttr(this.fragment, 'up-interval') ?? up.radio.config.pollInterval
    return up.radio.config.stretchPollInterval(interval)
  }

}
