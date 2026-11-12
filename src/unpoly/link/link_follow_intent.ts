import * as u from '../util.js'
import * as e from '../element.js'
import { on } from '../event.js'
import { isAlive, onAborted } from '../fragment.js'
import { linkConfig, shouldHandleClick } from '../link.js'
import { printUserEvent } from '../log.js'
import { type UpRequest } from '../network.js'

/**
Called when the user shows an intent to follow a link, e.g. by hovering over it.
It reports the request it makes, so the intent can abort it when the user moves away.
@internal
*/
export type FollowIntentCallback = (options: { onRequestKnown: (request: UpRequest) => void }) => void

export class LinkFollowIntent {
  declare _link: Element
  declare _callback: FollowIntentCallback
  declare _lastRequest: UpRequest | null
  declare _timer: number | undefined

  constructor(link: Element, callback: FollowIntentCallback) {
    this._link = link
    this._callback = callback
    this._lastRequest = null
    this._on('mouseenter mousedown touchstart', (event) => this._scheduleCallback(event))
    this._on('mouseleave', () => this._unscheduleCallback())
    // Don't preload if the link was removed from the DOM while we were waiting for the timer.
    // This also happens in specs, when the timer terminates after a spec has ended.
    onAborted(this._link, () => this._unscheduleCallback())
  }

  _on(eventType: string, fn: (event: Event) => void): void {
    on(this._link, eventType, { passive: true }, fn)
  }

  _scheduleCallback(event: Event): void {
    // Don't preload when the user is holding down CTRL or SHIFT.
    if (!shouldHandleClick(event, this._link)) return

    // A preload request is already known, e.g. from hovering before a mousedown.
    // We must not abort and repeat it, but let the click reuse it.
    if (this._lastRequest) return

    this._unscheduleCallback()

    // On pointerdown we preload immediately.
    // On mouseenter we wait for a short while (90ms) whether the cursor stays on the link.
    const applyDelay = (event.type === 'mouseenter')
    if (applyDelay) {
      let delay = this._parseDelay()
      this._timer = u.scheduleTimer(delay, () => this._runCallback(event))
    } else {
      this._runCallback(event)
    }
  }

  _unscheduleCallback(): void {
    clearTimeout(this._timer)

    // Only abort if the request is still preloading.
    // If the user has clicked on the link while the request was in flight,
    // and then unhovered the link, we do not abort the navigation.
    if (this._lastRequest?.background) this._lastRequest.abort()
    this._lastRequest = null
  }

  _parseDelay(): number {
    return e.numberAttr(this._link, 'up-preload-delay') ?? linkConfig.preloadDelay
  }

  _runCallback(event: Event): void {
    printUserEvent(event)

    // We unschedule the delayed callback then the link is aborted.
    // However, there are edge cases when the link can still be detached while
    // waiting for the delay:
    //
    // - The link (or its container) is [up-hungry] so it won't be eagerly
    //   aborted when it is targeted.
    // - We render an [up-preload] link from an expired cache entry
    // - We schedule another callback
    // - The expired content is revalidated (which does not abort eagerly).
    // - The link is replaced with the revalidated content.
    // - The callback delay finishes and tries to follow a detached link.
    if (!isAlive(this._link)) return

    // (1) Remember the request when sent
    // (2) All callbacks from up.link already mute uncritical rejections.
    //     We cannot do it here, as the callbacks are also passed to other places,
    //     like to onFirstIntersect().
    this._callback({ onRequestKnown: (request) => this._lastRequest = request })
  }
}
