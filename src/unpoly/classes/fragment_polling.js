const e = up.element
const u = up.util

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

    if (up.radio.shouldPoll(this.fragment)) {
      this.reloadNow()
    } else {
      up.puts('[up-poll]', 'Polling is disabled')
      // Reconsider after 10 seconds at most
      let reconsiderDisabledDelay = Math.min(10 * 1000, this.getInterval())
      this.scheduleReload(reconsiderDisabledDelay)
    }
  }

  reloadNow() {
    let reloadOptions = {
      url: this.options.url,
      guardEvent: up.event.build('up:fragment:poll', { log: ['Polling fragment', this.fragment] })
    }

    // Prevent our own reloading from aborting ourselves.
    let oldAbortable = this.abortable
    this.abortable = false
    u.always(up.reload(this.fragment, reloadOptions), (result) => this.onReloaded(result))
    this.abortable = oldAbortable
  }

  onReloaded(result) {
    // Transfer this instance to the new fragment.
    // We can remove this in case we don't implement forced start/stop.
    let newFragment = result?.fragments?.[0]
    if (newFragment) {
      // No need to scheduleReload() in this branch:
      // (1) Either the new fragment also has an [up-poll] and we have already
      //     started in #onPollAttributeObserved().
      // (2) Or we are force-started and we will start in #onFragmentSwapped().
      this.onFragmentSwapped(newFragment)
    } else {
      this.scheduleReload()
    }
  }

  onFragmentSwapped(newFragment) {
    // Transfer this polling to the new instance
    newFragment.upPolling = this
    delete this.fragment.upPolling
    this.setFragment(newFragment)
    if (this.state === 'stopped' && this.forceStarted) {
      // When polling was started programmatically through up.fragment.startPolling()
      // we don't require the updated fragment to have an [up-poll] attribute to
      // continue polling.
      this.start()
    }
  }

  setFragment(newFragment) {
    this.fragment = newFragment
    up.destructor(newFragment, () => this.onFragmentDestroyed())
    up.fragment.onAborted(newFragment, () => this.onFragmentAborted())
  }


  getInterval() {
    let interval = this.options.interval ?? e.numberAttr(this.fragment, 'up-interval') ?? up.radio.config.pollInterval
    return up.radio.config.pollIntervalScale(interval)
  }

}
