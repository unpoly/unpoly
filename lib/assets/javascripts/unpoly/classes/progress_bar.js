/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e = up.element;

const TRANSITION_DELAY = 300;

up.ProgressBar = class ProgressBar {

  constructor() {
    this.step = 0;
    this.element = e.affix(document.body, 'up-progress-bar');
    this.element.style.transition = `width ${TRANSITION_DELAY}ms ease-out`;

    this.moveTo(0);
    // The element must be painted at width: 0 before we apply the target width.
    // If the first paint sees the bar at the target width, we don't get an animated transition.
    up.element.paint(this.element);

    this.width = 31;
    this.nextStep();
  }

  nextStep() {
    let diff;
    if (this.width < 80) {
      if (Math.random() < 0.15) {
        // Sometimes the bar grows quickly by (7..12) percent.
        diff = 7 + (5 * Math.random());
      } else {
        // Most of the time the bar progresses by (1.5..2) percent.
        diff = 1.5 + (0.5 * Math.random());
      }
    } else {
      // Above 80% completion we grow the bar more slowly,
      // using a formula that can never reach 100%.
      diff = 0.13 * (100 - width) * Math.random();
    }

    this.moveTo(this.width + diff);
    this.step++;

    // Steps occur less frequent the longer we wait for the server.
    const nextStepDelay = TRANSITION_DELAY + (this.step * 40);
    return this.timeout = setTimeout(this.nextStep.bind(this), nextStepDelay);
  }

  moveTo(width) {
    this.width = width;
    return this.element.style.width = `${width}vw`;
  }

  destroy() {
    clearTimeout(this.timeout);
    return e.remove(this.element);
  }

  conclude() {
    clearTimeout(this.timeout);
    this.moveTo(100);
    return setTimeout(this.destroy.bind(this), TRANSITION_DELAY);
  }
};
