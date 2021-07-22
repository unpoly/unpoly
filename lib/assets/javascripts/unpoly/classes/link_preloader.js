/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;
const e = up.element;

up.LinkPreloader = class LinkPreloader {

  constructor() {
    this.considerPreload = this.considerPreload.bind(this);
  }

  observeLink(link) {
    // If the link has an unsafe method (like POST) and is hence not preloadable,
    // prevent up.link.preload() from blowing up by not observing the link (even if
    // the user uses [up-preload] everywhere).
    if (up.link.isSafe(link)) {
      this.on(link, 'mouseenter',           event => this.considerPreload(event, true));
      this.on(link, 'mousedown touchstart', event => this.considerPreload(event));
      return this.on(link, 'mouseleave',           event => this.stopPreload(event));
    }
  }

  on(link, eventTypes, callback) {
    return up.on(link, eventTypes, { passive: true }, callback);
  }

  considerPreload(event, applyDelay) {
    const link = event.target;
    if (link !== this.currentLink) {
      this.reset();

      this.currentLink = link;

      // Don't preload when the user is holding down CTRL or SHIFT.
      if (up.link.shouldFollowEvent(event, link)) {
        if (applyDelay) {
          return this.preloadAfterDelay(link);
        } else {
          return this.preloadNow(link);
        }
      }
    }
  }

  stopPreload(event) {
    if (event.target === this.currentLink) {
      return this.reset();
    }
  }

  reset() {
    if (!this.currentLink) { return; }

    clearTimeout(this.timer);

    // Only abort if the request is still preloading.
    // If the user has clicked on the link while the request was in flight,
    // and then unhovered the link, we do not abort the navigation.
    if (this.currentRequest != null ? this.currentRequest.preload : undefined) {
      this.currentRequest.abort();
    }

    this.currentLink = undefined;
    return this.currentRequest = undefined;
  }

  preloadAfterDelay(link) {
    let left;
    const delay = (left = e.numberAttr(link, 'up-delay')) != null ? left : up.link.config.preloadDelay;
    return this.timer = u.timer(delay, () => this.preloadNow(link));
  }

  preloadNow(link) {
    // Don't preload if the link was removed from the DOM while we were waiting for the timer.
    if (e.isDetached(link)) {
      this.reset();
      return;
    }

    const onQueued = request => { return this.currentRequest = request; };
    up.log.muteUncriticalRejection(up.link.preload(link, { onQueued }));
    return this.queued = true;
  }
};
