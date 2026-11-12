import * as u from '../util.js'
import * as e from '../element.js'
import { throwCritical } from '../error.js'
import { build, on } from '../event.js'
import {
  isAlive, isTargetable, matches, onAborted, onKept, reload, type RenderResult,
} from '../fragment.js'
import { layerStack, type Layer } from '../layer.js'
import { printToStandard, printToWarn } from '../log.js'
import { pollOptions, radioConfig } from '../radio.js'
import { registerDestructor } from '../script.js'

/**
An element with an `[up-poll]` attribute. It remembers its `up.FragmentPolling`.
@internal
*/
export type PollingElement = Element & { upPolling?: FragmentPolling }

export class FragmentPolling {

  declare _options: u.PlainObject
  declare _fragment: Element
  declare _state: 'stopped' | 'started'
  declare _forceIntent: 'stop' | 'start' | null
  declare _reloadJID: number
  declare _loading: boolean
  declare _eventsBound: boolean | undefined
  declare _reloadTimer: ReturnType<typeof setTimeout> | null | undefined
  declare _lastAttempt: Date
  declare layer: Layer | undefined

  static forFragment(fragment: PollingElement): FragmentPolling {
    return fragment.upPolling ||= new this(fragment)
  }

  constructor(fragment: Element) {
    this._options = pollOptions(fragment)

    this._fragment = fragment
    registerDestructor(fragment, this._onFragmentDestroyed.bind(this))

    this._state = 'stopped' // stopped | started
    this._forceIntent = null // stop | start

    this._reloadJID = u.uid()

    // this._abortable = true
    this._loading = false
    this._satisfyInterval()
  }

  onPollAttributeObserved(): void {
    this._start()
  }

  _onFragmentAborted({ newLayer, jid }: Event & { newLayer?: boolean, jid?: number }): void {
    const isOurAbort = (jid === this._reloadJID)
    if (isOurAbort || newLayer) return
    this._stop()
  }

  _onFragmentKept(): void {
    if (this._forceIntent !== 'stop') {
      this._start()
    }
  }

  _onFragmentDestroyed(): void {
    // The element may come back (when it is swapped) or or may not come back (when it is destroyed).
    // If it does come back, `onPollAttributeObserved()` will restart the polling.
    this._stop()
  }

  _start(options?: u.PlainObject): void {
    Object.assign(this._options, options)

    if (this._state === 'stopped') {
      if (!isTargetable(this._fragment)) {
        printToWarn('[up-poll]', 'Cannot poll untargetable fragment %o', this._fragment)
        return
      }

      this._state = 'started'
      this._bindEvents()
      this._scheduleRemainingTime()
    }
  }

  _stop(): void {
    if (this._state === 'started') {
      this._clearReloadTimer()  // don't keep inactive tabs awake
      this._state = 'stopped'
    }
  }

  forceStart(options?: u.PlainObject): void {
    Object.assign(this._options, options)
    this._forceIntent = 'start'
    this._start()
  }

  forceStop(): void {
    this._forceIntent = 'stop'
    this._stop()
  }

  _bindEvents(): void {
    if (this._eventsBound) return
    this._eventsBound = true

    registerDestructor(this._fragment, on('visibilitychange up:layer:opened up:layer:dismissed up:layer:accepted', this._onVisibilityChange.bind(this)))
    onAborted(this._fragment, this._onFragmentAborted.bind(this))
    onKept(this._fragment, this._onFragmentKept.bind(this))
  }

  _onVisibilityChange(): void {
    if (this._isFragmentVisible()) {
      this._scheduleRemainingTime() // will check started
    } else {
      this._clearReloadTimer()
    }
  }

  _isFragmentVisible(): boolean | undefined {
    return (!document.hidden) &&
      (this._options.ifLayer === 'any' || this._isOnFrontLayer())
  }

  _clearReloadTimer(): void {
    clearTimeout(this._reloadTimer)
    this._reloadTimer = null
  }

  _scheduleRemainingTime(): void {
    if (this._reloadTimer || this._loading || this._state === 'stopped') return

    this._clearReloadTimer()
    this._reloadTimer = setTimeout(
      this._onTimerReached.bind(this),
      this._getRemainingDelay()
    )
  }

  _onTimerReached(): void {
    this._reloadTimer = null
    this._tryReload()
  }

  _tryReload(): void {
    // The setTimeout(doReload) callback might already be scheduled
    // before the polling stopped.
    if (this._state === 'stopped') {
      return
    }

    if (!isAlive(this._fragment)) {
      this._stop()
      printToStandard('[up-poll]', 'Stopped polling a detached fragment')
      return
    }

    if (!this._isFragmentVisible()) {
      printToStandard('[up-poll]', 'Will not poll hidden fragment')
      // (1) We don't need to re-schedule a timer here. _onVisibilityChange() will do that for us.
      // (2) Also we prefer to not have pending timers in inactive tabs to save resources.
      return
    }

    this._reloadNow()
  }

  _getFullDelay(): number {
    return this._options.interval ?? e.numberAttr(this._fragment, 'up-interval') ?? radioConfig.pollInterval
  }

  _getRemainingDelay(): number {
    return Math.max(this._getFullDelay() - this._getFragmentAge(), 0)
  }

  _getFragmentAge(): number {
    // Subtracting dates gives milliseconds. TypeScript only allows it with getTime(), which would add bytes.
    return (new Date() as any) - (this._lastAttempt as any)
  }

  _isOnFrontLayer(): boolean | undefined {
    this.layer ||= layerStack.get(this._fragment)
    return this.layer?.isFront?.()
  }

  _reloadNow(): void {
    // If we were called manually (not by a timeout), clear a scheduled timeout to prevent concurrency.
    // The timeout will be re-scheduled by this._onReloadSuccess() or this._onReloadFailure().
    this._clearReloadTimer()

    // Don't schedule timers while we're loading. _onReloadSuccess() and _onReloadFailure() will do that for us.
    this._loading = true

    let guardEvent = build('up:fragment:poll', { log: ['Polling fragment', this._fragment] })
    let reloadOptions = { ...this._options, guardEvent, jid: this._reloadJID }

    reload(this._fragment, reloadOptions).then(
      this._onReloadSuccess.bind(this),
      this._onReloadFailure.bind(this)
    )
  }

  _onReloadSuccess({ fragment }: RenderResult): void {
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

  _onFragmentSwapped(newFragment: Element): void {
    if (this._forceIntent === 'start' && matches(this._fragment, newFragment)) {
      // Force start the new up.Polling instance for the new fragment.
      (this.constructor as typeof FragmentPolling).forFragment(newFragment).forceStart(this._options)
    }
  }

  _onReloadFailure(reason: any): void {
    // An error response rejects with an up.RenderResult (rendered into { failTarget: ':none' }),
    // which is not critical. Only a fatal render error will be thrown below.
    this._loading = false
    this._satisfyInterval()
    this._scheduleRemainingTime()
    throwCritical(reason)
  }

  _satisfyInterval(): void {
    // This will delay the next timer scheduling for a full interval.
    this._lastAttempt = new Date()
  }

}
