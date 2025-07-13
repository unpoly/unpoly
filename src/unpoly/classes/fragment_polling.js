// const e = up.element
// const u = up.util
//
// up.FragmentPolling = class FragmentPolling {
//
//   static forFragment(fragment) {
//     return fragment.upPolling ||= new this(fragment)
//   }
//
//   constructor(fragment) {
//     this._options = up.radio.pollOptions(fragment)
//
//     this._fragment = fragment
//     up.destructor(fragment, this._onFragmentDestroyed.bind(this))
//
//     this._reloadJID = u.uid()
//
//     this._state = 'paused' // paused | waiting | loading | stopped
//     // this._forcedState = null
//     this._forced = false
//
//     // this._abortable = true
//     this._loading = false
//     this._satisfyInterval()
//   }
//
//   onPollAttributeObserved() {
//     switch(this._state) {
//       case 'paused':
//         this._start()
//     }
//   }
//
//   _onFragmentAborted({ newLayer, jid }) {
//     console.debug("[_onFragmentAborted] with jid == %o //_reloadJID == %o", jid, this._reloadJID)
//
//     // Don't abort by our own rendering
//     if (jid === this._reloadJID) return
//
//     // Opening a new layer aborts the base layer's main element
//     if (newLayer) return
//
//     switch(this._state) {
//       case 'waiting':
//       case 'loading':
//         this._pause()
//         break
//       case 'paused':
//       case 'stopped':
//         // we are already paused / stopped
//     }
//   }
//
//   _onFragmentKept() {
//     console.debug("[_onFragmentKept] first line")
//     switch (this._state) {
//       case 'paused':
//         this._start()
//     }
//   }
//
//   _onFragmentDestroyed() {
//     console.debug("[_onFragmentDestroyed] Stopping")
//     // The element may come back (when it is swapped) or may not come back (when it is destroyed).
//     // If it does come back, `onPollAttributeObserved()` will restart the polling.
//     switch(this._state) {
//       case 'waiting':
//       case 'loading':
//         this._pause()
//     }
//   }
//
//   _start(options) {
//     Object.assign(this._options, options)
//
//     if (this._state !== 'started') {
//       if (!up.fragment.isTargetable(this._fragment)) {
//         up.warn('[up-poll]', 'Cannot poll untargetable fragment %o', this._fragment)
//         return
//       }
//
//       this._state = 'started'
//       this._bindEvents()
//       this._scheduleRemainingTime()
//     }
//   }
//
//   _stop() {
//     console.debug("[_stop] state == %o", this._state)
//     if (this._state === 'started') {
//       this._clearReloadTimer()  // don't keep inactive tabs awake
//       this._state = 'stopped'
//     }
//   }
//
//   forceStart(options) {
//     Object.assign(this._options, options)
//     this._forcedState = 'started'
//     this._start()
//   }
//
//   forceStop() {
//     this._forcedState = 'stopped'
//     this._stop()
//   }
//
//   _bindEvents() {
//     if (this._eventsBound) return
//     this._eventsBound = true
//
//     up.destructor(this._fragment, up.on('visibilitychange up:layer:opened up:layer:dismissed up:layer:accepted', this._onVisibilityChange.bind(this)))
//     up.fragment.onAborted(this._fragment, this._onFragmentAborted.bind(this))
//     up.fragment.onKept(this._fragment, this._onFragmentKept.bind(this))
//   }
//
//   _onVisibilityChange() {
//     // This callback can only run while we're started.
//     if (this._isFragmentVisible()) {
//       this._scheduleRemainingTime()
//     } else {
//       // TODO: I think we should unschedule here, regardless of the comment
//       // Let the existing timer play out for two reasons:
//       //
//       // 1. The fragment may become visible again before the timer runs out
//       // 2. Print the reason for not polling to the console once.
//     }
//   }
//
//   _isFragmentVisible() {
//     return (!document.hidden) &&
//       (this._options.ifLayer === 'any' || this._isOnFrontLayer())
//   }
//
//   _clearReloadTimer() {
//     clearTimeout(this._reloadTimer)
//     this._reloadTimer = null
//   }
//
//   _scheduleRemainingTime() {
//     if (this._reloadTimer || this._loading || this._state !== 'started') return
//
//     console.debug("[_scheduleRemainingTime] reloadTimer %o, loading %o", this._reloadTimer, this._loading)
//     this._clearReloadTimer()
//     console.debug("[_scheduleRemainingTime] scheduling in %o ms", this._getRemainingDelay())
//     this._reloadTimer = setTimeout(
//       this._onTimerReached.bind(this),
//       this._getRemainingDelay()
//     )
//   }
//
//   _onTimerReached() {
//     this._reloadTimer = null
//     this._tryReload()
//   }
//
//   _tryReload() {
//     console.debug("[_tryReload] state == %o", this._state)
//
//     // The setTimeout(doReload) callback might already be scheduled
//     // before the polling stopped.
//     if (this._state !== 'started') {
//       return
//     }
//
//     if (!up.fragment.isAlive(this._fragment)) {
//       this._stop()
//       up.puts('[up-poll]', 'Stopped polling a detached fragment')
//       return
//     }
//
//     if (!this._isFragmentVisible()) {
//       up.puts('[up-poll]', 'Will not poll hidden fragment')
//       // (1) We don't need to re-schedule a timer here. _onVisibilityChange() will do that for us.
//       // (2) Also we prefer to not have pending timers in inactive tabs to save resources.
//       return
//     }
//
//     this._reloadNow()
//   }
//
//   _getFullDelay() {
//     return this._options.interval ?? e.numberAttr(this._fragment, 'up-interval') ?? up.radio.config.pollInterval
//   }
//
//   _getRemainingDelay() {
//     return Math.max(this._getFullDelay() - this._getFragmentAge(), 0)
//   }
//
//   _getFragmentAge() {
//     return new Date() - this._lastAttempt
//   }
//
//   _isOnFrontLayer() {
//     this.layer ||= up.layer.get(this._fragment)
//     return this.layer?.isFront?.()
//   }
//
//   _reloadNow() {
//     console.debug("[_reloadNow]")
//
//     // If we were called manually (not by a timeout), clear a scheduled timeout to prevent concurrency.
//     // The timeout will be re-scheduled by this._onReloadSuccess() or this._onReloadFailure().
//     this._clearReloadTimer()
//
//     // let oldAbortable = this._abortable
//
//     try {
//       // Prevent our own reloading from aborting ourselves.
//       console.debug("[_reloadNow] setting abortable = false")
//
//       // TODO: Replace _abortable with a { renderJob } property for up:fragment:aborted
//       // this._abortable = false
//
//       // Don't schedule timers while we're loading. _onReloadSuccess() and _onReloadFailure() will do that for us.
//       this._loading = true
//
//       let guardEvent = up.event.build('up:fragment:poll', { log: ['Polling fragment', this._fragment] })
//       let reloadOptions = { ...this._options, guardEvent, jid: this._reloadJID }
//
//       up.reload(this._fragment, reloadOptions).then(
//         this._onReloadSuccess.bind(this),
//         this._onReloadFailure.bind(this)
//       )
//     } finally {
//       // Now that our own render pass has process abort options (this happens sync),
//       // we can resume listening to abort signals.
//       // console.debug("[_reloadNow] reverting abortable = %o", oldAbortable)
//       // this._abortable = oldAbortable
//     }
//   }
//
//   // _reloadOptions() {
//   //   let guardEvent = up.event.build('up:fragment:poll', { log: ['Polling fragment', this._fragment] })
//   //   return { ...this._options, guardEvent }
//   // }
//
//   _onReloadSuccess({ fragment }) {
//     console.debug("[_onReloadSuccess] fragment", fragment)
//
//     this._loading = false
//     this._satisfyInterval()
//
//     if (fragment) {
//       // No need to _scheduleRemainingTime() in this branch:
//       //
//       // (1) Either the new fragment also has an [up-poll] and we have already started in _onPollAttributeObserved().
//       // (2) Or we are force-started and we will start in _onFragmentSwapped().
//       this._onFragmentSwapped(fragment)
//     } else {
//       // The server may have opted to not send an update, e.g. if there is no fresher content.
//       // In that case we try again in the next interval.
//
//       // TODO: But we aborted ourselves and stopped?
//       // TODO: Can we just restart here?
//       this._scheduleRemainingTime()
//     }
//   }
//
//   _onFragmentSwapped(newFragment) {
//     if (this._forcedState === 'started' && up.fragment.matches(this._fragment, newFragment)) {
//       // Force start the new up.Polling instance for the new fragment.
//       this.constructor.forFragment(newFragment).forceStart(this._options)
//     }
//   }
//
//   _onReloadFailure(reason) {
//     console.debug("[_onReloadFailure] reason", reason)
//
//     // Because we didn't supply a { failTarget } or { fallback } option, we can only reach
//     // this branch for a fatal render error.
//
//     this._loading = false
//     this._satisfyInterval()
//     this._scheduleRemainingTime()
//     up.error.throwCritical(reason)
//   }
//
//   _satisfyInterval() {
//     // This will delay the next timer scheduling for a full interval.
//     this._lastAttempt = new Date()
//   }
//
// }



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
    // if (this._state !== 'started') return

    console.debug("[_onFragmentAborted] with jid == %o //_reloadJID == %o", jid, this._reloadJID)

    const isOurAbort = (jid === this._reloadJID)
    if (isOurAbort || newLayer) return

    console.debug("[_onFragmentAborted] stopping")

    this._stop()
  }

  _onFragmentKept() {
    console.debug("[_onFragmentKept] first line")
    if (this._forceIntent !== 'stop') {
      console.debug("[_onFragmentKept] starting")
      this._start()
    }
  }

  _onFragmentDestroyed() {
    console.debug("[_onFragmentDestroyed] Stopping")
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
      this._bindEvents()
      this._scheduleRemainingTime()
    }
  }

  _stop() {
    console.debug("[_stop] state == %o", this._state)
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
    // This callback can only run while we're started.
    if (this._isFragmentVisible()) {
      this._scheduleRemainingTime()
    } else {
      // TODO: I think we should unschedule here, regardless of the comment
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
    clearTimeout(this._reloadTimer)
    this._reloadTimer = null
  }

  _scheduleRemainingTime() {
    if (this._reloadTimer || this._loading || this._state !== 'started') return

    console.debug("[_scheduleRemainingTime] reloadTimer %o, loading %o", this._reloadTimer, this._loading)
    this._clearReloadTimer()
    console.debug("[_scheduleRemainingTime] scheduling in %o ms", this._getRemainingDelay())
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
    console.debug("[_tryReload] state == %o", this._state)

    // The setTimeout(doReload) callback might already be scheduled
    // before the polling stopped.
    if (this._state !== 'started') {
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
    console.debug("[_reloadNow]")

    // If we were called manually (not by a timeout), clear a scheduled timeout to prevent concurrency.
    // The timeout will be re-scheduled by this._onReloadSuccess() or this._onReloadFailure().
    this._clearReloadTimer()

    // let oldAbortable = this._abortable

    try {
      // Prevent our own reloading from aborting ourselves.
      console.debug("[_reloadNow] setting abortable = false")

      // TODO: Replace _abortable with a { renderJob } property for up:fragment:aborted
      // this._abortable = false

      // Don't schedule timers while we're loading. _onReloadSuccess() and _onReloadFailure() will do that for us.
      this._loading = true

      let guardEvent = up.event.build('up:fragment:poll', { log: ['Polling fragment', this._fragment] })
      let reloadOptions = { ...this._options, guardEvent, jid: this._reloadJID }

      up.reload(this._fragment, reloadOptions).then(
        this._onReloadSuccess.bind(this),
        this._onReloadFailure.bind(this)
      )
    } finally {
      // Now that our own render pass has process abort options (this happens sync),
      // we can resume listening to abort signals.
      // console.debug("[_reloadNow] reverting abortable = %o", oldAbortable)
      // this._abortable = oldAbortable
    }
  }

  // _reloadOptions() {
  //   let guardEvent = up.event.build('up:fragment:poll', { log: ['Polling fragment', this._fragment] })
  //   return { ...this._options, guardEvent }
  // }

  _onReloadSuccess({ fragment }) {
    console.debug("[_onReloadSuccess] fragment", fragment)

    this._loading = false
    this._satisfyInterval()

    if (fragment) {
      // No need to _scheduleRemainingTime() in this branch:
      //
      // (1) Either the new fragment also has an [up-poll] and we have already started in _onPollAttributeObserved().
      // (2) Or we are force-started and we will start in _onFragmentSwapped().
      this._onFragmentSwapped(fragment)
    } else {
      // The server may have opted to not send an update, e.g. if there is no fresher content.
      // In that case we try again in the next interval.

      // TODO: But we aborted ourselves and stopped?
      // TODO: Can we just restart here?
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
    console.debug("[_onReloadFailure] reason", reason)

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
