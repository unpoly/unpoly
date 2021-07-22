/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;
const e = up.element;

up.FragmentScrolling = class FragmentScrolling extends up.FragmentProcessor {

  keys() {
    return super.keys().concat([
      'hash',
      'mode',
      'revealTop',
      'revealMax',
      'revealSnap',
      'scrollBehavior',
      'scrollSpeed'
    ]);
  }

  constructor(options) {
    if (typeof up.migrate.handleScrollOptions === 'function') {
      up.migrate.handleScrollOptions(options);
    }
    super(options);
  }

  process(opt) {
    // If no option can be applied, return a fulfilled promise to
    // satisfy our signature as an async function.
    return super.process(opt) || Promise.resolve();
  }

  processPrimitive(opt) {
    switch (opt) {
      case 'reset':
        // If the user has passed { scroll: 'top' } we scroll to the top all
        // viewports that are either containing or are contained by element.
        return this.reset();
      case 'layer':
        return this.revealLayer();
      case 'main':
        return this.revealSelector(':main');
      case 'restore':
        return this.restore();
      case 'hash':
        return this.hash && up.viewport.revealHash(this.hash, this.attributes());
      case 'target': case 'reveal': case true:
        return this.revealElement(this.fragment);
      default:
        if (u.isString(opt)) {
          return this.revealSelector(opt);
        }
    }
  }

  processElement(element) {
    return this.revealElement(element);
  }

  revealElement(element) {
    return up.reveal(element, this.attributes());
  }

  revealSelector(selector) {
    let match;
    if (match = this.findSelector(selector)) {
      return this.revealElement(match);
    }
  }

  revealLayer() {
    // Reveal the layer's box instead of the layer's element.
    // If the layer has its own viewport, like a modal, revealing the box will
    // scroll the layer viewport. Revealing the layer element would scroll
    // the main document viewport.
    return this.revealElement(this.layer.getBoxElement());
  }

  reset() {
    return up.viewport.resetScroll(u.merge(this.attributes(), {around: this.fragment}));
  }

  restore() {
    return up.viewport.restoreScroll(u.merge(this.attributes(), {around: this.fragment}));
  }
};
