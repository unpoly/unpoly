const u = up.util
const e = up.element

up.LinkPreloader = class LinkPreloader {

  watchLink(link) {
    // If the link has an unsafe method (like POST) and is hence not preloadable,
    // prevent up.link.preload() from blowing up by not observing the link (even if
    // the user uses [up-preload] everywhere).
    if (!up.link.preloadIssue(link)) {
      this._on(link, 'mouseenter',           (event) => this._considerPreload(event, true))
      this._on(link, 'mousedown touchstart', (event) => this._considerPreload(event))
      this._on(link, 'mouseleave',           (event) => this._stopPreload(event))
    }
  }

  _on(link, eventTypes, callback) {
    up.on(link, eventTypes, { passive: true }, callback)
  }

  _considerPreload(event, applyDelay) {
    const link = event.target
    if (link !== this._currentLink) {
      this.reset()

      this._currentLink = link

      // Don't preload when the user is holding down CTRL or SHIFT.
      if (up.link.shouldFollowEvent(event, link)) {
        if (applyDelay) {
          this._preloadAfterDelay(event, link)
        } else {
          this._preloadNow(event, link)
        }
      }
    }
  }

  _stopPreload(event) {
    if (event.target === this._currentLink) {
      return this.reset()
    }
  }

  reset() {
    if (!this._currentLink) { return }

    clearTimeout(this._timer)

    // Only abort if the request is still preloading.
    // If the user has clicked on the link while the request was in flight,
    // and then unhovered the link, we do not abort the navigation.
    if (this._currentRequest?.background) {
      this._currentRequest.abort()
    }

    this._currentLink = undefined
    this._currentRequest = undefined
  }

  _preloadAfterDelay(event, link) {
    const delay = e.numberAttr(link, 'up-preload-delay') ?? up.link.config.preloadDelay
    this._timer = u.timer(delay, () => this._preloadNow(event, link))
  }

  _preloadNow(event, link) {
    // Don't preload if the link was removed from the DOM while we were waiting for the timer.
    if (!link.isConnected) {
      this.reset()
      return
    }

    const onQueued = request => { return this._currentRequest = request }
    up.log.putsEvent(event)

    // Here we really need { onQueued }, not something like { onProcessed }
    up.error.muteUncriticalRejection(up.link.preload(link, { onQueued }))
  }
}
