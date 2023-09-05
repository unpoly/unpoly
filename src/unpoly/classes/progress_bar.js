const e = up.element

const TRANSITION_DELAY = 300

up.ProgressBar = class ProgressBar {

  constructor() {
    this._step = 0
    this._element = e.affix(document.body, 'up-progress-bar')
    this._element.style.transition = `width ${TRANSITION_DELAY}ms ease-out`

    this._moveTo(0)
    // The element must be painted at width: 0 before we apply the target width.
    // If the first paint sees the bar at the target width, we don't get an animated transition.
    up.element.paint(this._element)

    this._width = 31
    this._nextStep()
  }

  _nextStep() {
    let diff
    if (this._width < 80) {
      if (Math.random() < 0.15) {
        // Sometimes the bar grows quickly by (7..12) percent.
        diff = 7 + (5 * Math.random())
      } else {
        // Most of the time the bar progresses by (1.5..2) percent.
        diff = 1.5 + (0.5 * Math.random())
      }
    } else {
      // Above 80% completion we grow the bar more slowly,
      // using a formula that can never reach 100%.
      diff = 0.13 * (100 - this._width) * Math.random()
    }

    this._moveTo(this._width + diff)
    this._step++

    // Steps occur less frequent the longer we wait for the server.
    const nextStepDelay = TRANSITION_DELAY + (this._step * 40)
    this.timeout = setTimeout(this._nextStep.bind(this), nextStepDelay)
  }

  _moveTo(width) {
    this._width = width
    this._element.style.width = `${width}vw`
  }

  destroy() {
    clearTimeout(this.timeout)
    this._element.remove()
  }

  conclude() {
    clearTimeout(this.timeout)
    this._moveTo(100)
    setTimeout(this.destroy.bind(this), TRANSITION_DELAY)
  }
}
