const e = up.element
const u = up.util

up.FragmentPolling = class FragmentPolling {

  constructor(fragment) {
    this.options = {}
    this.state = 'initialized'
    this.setFragment(fragment)
  }

  static forFragment(fragment) {
    return fragment.upPolling ||= new this(fragment)
  }

  onPollAttributeObserved() {
    this.start()
  }

  onFragmentDestroyed() {
    console.log("!!! onFragmentDestroyed for element %o", this.fragment)
    // The element may come back (when it is swapped) or or may not come back (when it is destroyed).
    // If it does come back, `onPollAttributeObserved()` will restart the polling.
    this.stop()
  }

  start() {
    if (this.state !== 'started') {
      console.log("!!! started")
      this.state = 'started'
      this.scheduleReload()
    }
  }

  stop() {
    if (this.state === 'started') {
      console.log("!!! stopped")
      clearTimeout(this.reloadTimer)
      this.state = 'stopped'
    }
  }

  forceStart(options) {
    Object.assign(this.options, options)
    console.log("### forceStarted set to true")
    console.log("### new options are %o", u.copy(options))
    this.forceStarted = true
    this.start()
  }

  forceStop() {
    this.stop()
    this.forceStarted = false
  }

  scheduleReload(delay = this.getInterval()) {
    console.log("!!! Scheduling reload after delay %o", delay)
    this.reloadTimer = setTimeout(() => this.reload(), delay)
  }

  reload() {
    console.log("!!! Reload called for element %o and state %o", this.fragment, this.state)

    // The setTimeout(doReload) callback might already be scheduled
    // before the polling stopped.
    if (this.state !== 'started') { return }

    if (up.radio.shouldPoll(this.fragment)) {
      u.always(up.reload(this.fragment, this.options), (result) => this.onReloaded(result))
    } else {
      up.puts('[up-poll]', 'Polling is disabled')
      // Reconsider after 10 seconds at most
      let reconsiderDisabledDelay = Math.min(10 * 1000, this.getInterval())
      this.scheduleReload(reconsiderDisabledDelay)
    }
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
      console.log("!!! force-starting")
      this.start()
    }
  }

  setFragment(newFragment) {
    this.fragment = newFragment
    up.destructor(newFragment, () => this.onFragmentDestroyed())
  }


  getInterval() {
    return this.options.interval ?? e.numberAttr(this.fragment, 'up-interval') ?? up.radio.config.pollInterval
  }

}
