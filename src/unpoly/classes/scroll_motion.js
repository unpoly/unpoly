const u = up.util

// We want to make the default speed mimic Chrome's smooth scrolling behavior.
// We also want to keep the default value in up.viewport.config.scrollSpeed to be 1.
// For our calculation in #animationFrame() we need to multiply it with this factor.
const SPEED_CALIBRATION = 0.065

up.ScrollMotion = class ScrollMotion {

  constructor(scrollable, targetTop, options = {}) {
    this.scrollable = scrollable
    this.targetTop = targetTop

    // The option for up.scroll() is { behavior }, but coming
    // from up.replace() it's { scrollBehavior }.
    this.behavior = options.behavior ?? options.scrollBehavior ?? 'auto'

    // The option for up.scroll() is { behavior }, but coming
    // from up.replace() it's { scrollSpeed }.
    this.speed = (options.speed ?? options.scrollSpeed ?? up.viewport.config.scrollSpeed) * SPEED_CALIBRATION
  }

  start() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
      if ((this.behavior === 'smooth') && up.motion.isEnabled()) {
        this.startAnimation()
      } else {
        this.finish()
      }
    })
  }

  startAnimation() {
    this.startTime = Date.now()
    this.startTop = this.scrollable.scrollTop
    this.topDiff = this.targetTop - this.startTop
    // We're applying a square root to become slower for small distances
    // and faster for large distances.
    this.duration = Math.sqrt(Math.abs(this.topDiff)) / this.speed
    requestAnimationFrame(() => this.animationFrame())
  }

  animationFrame() {
    if (this.settled) { return }

    // When the scroll position is not the one we previously set, we assume
    // that the user has tried scrolling on her own. We then cancel the scrolling animation.
    if (this.frameTop && (Math.abs(this.frameTop - this.scrollable.scrollTop) > 1.5)) {
      this.abort('Animation aborted due to user intervention')
    }

    const currentTime = Date.now()
    const timeElapsed = currentTime - this.startTime
    const timeFraction = Math.min(timeElapsed / this.duration, 1)

    this.frameTop = this.startTop + (u.simpleEase(timeFraction) * this.topDiff)

    // When we're very close to the target top, finish the animation
    // directly to deal with rounding errors.
    if (Math.abs(this.targetTop - this.frameTop) < 0.3) {
      this.finish()
    } else {
      this.scrollable.scrollTop = this.frameTop
      requestAnimationFrame(() => this.animationFrame())
    }
  }

  abort(reason) {
    this.settled = true
    this.reject(up.error.aborted(reason))
  }

  finish() {
    // In case we're animating with emulation, cancel the next scheduled frame
    this.settled = true
    // Setting the { scrollTop } prop will also finish a native scrolling
    // animation in Firefox and Chrome.
    this.scrollable.scrollTop = this.targetTop
    this.resolve()
  }
}