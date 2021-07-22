/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;
const e = up.element;

const PRESERVE_KEYS = ['selectionStart', 'selectionEnd', 'scrollLeft', 'scrollTop'];

const transferProps = (from, to) => PRESERVE_KEYS.map((key) =>
  (() => { try {
    return to[key] = from[key];
  } catch (error) {} })());
      // Safari throws a TypeError when accessing { selectionStart }
      // from a focused <input type="submit">. We ignore it.

const focusedElementWithin = function(scopeElement) {
  const focusedElement = document.activeElement;
  if (e.isInSubtree(scopeElement, focusedElement)) {
    return focusedElement;
  }
};

up.FocusCapsule = class FocusCapsule extends up.Record {
  keys() {
    return ['selector', 'oldElement'].concat(PRESERVE_KEYS);
  }

  restore(scope, options) {
    let rediscoveredElement;
    if (!this.wasLost()) {
      // If the old element was never detached (e.g. because it was kept),
      // and still has focus, we don't need to do anything.
      return;
    }

    if (rediscoveredElement = e.get(scope, this.selector)) {
      // Firefox needs focus-related props to be set *before* we focus the element
      transferProps(this, rediscoveredElement);
      up.focus(rediscoveredElement, options);
      // Signals callers that we could restore
      return true;
    }
  }

  static preserveWithin(oldElement) {
    let focusedElement;
    if (focusedElement = focusedElementWithin(oldElement)) {
      const plan = { oldElement, selector: up.fragment.toTarget(focusedElement) };
      transferProps(focusedElement, plan);
      return new (this)(plan);
    }
  }

  wasLost() {
    return !focusedElementWithin(this.oldElement);
  }
};
