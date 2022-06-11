const e = up.element

const PRESERVE_KEYS = ['selectionStart', 'selectionEnd', 'scrollLeft', 'scrollTop']

function transferProps(from, to) {
  for (let key of PRESERVE_KEYS) {
    try {
      to[key] = from[key]
    } catch (error) {
      // Safari throws a TypeError when accessing { selectionStart }
      // from a focused <input type="submit">. We ignore it.
    }
  }
}

function focusedElementWithin(scopeElement) {
  const focusedElement = document.activeElement
  if (e.isInSubtree(scopeElement, focusedElement)) {
    return focusedElement
  }
}

up.FocusCapsule = class FocusCapsule extends up.Record {
  keys() {
    return ['target', 'oldElement'].concat(PRESERVE_KEYS)
  }

  restore(scope, options) {
    if (!this.wasLost()) {
      // If the old element was never detached (e.g. because it was kept),
      // and still has focus, we don't need to do anything.
      return
    }

    let rediscoveredElement = e.get(scope, this.target)
    if (rediscoveredElement) {
      // Firefox needs focus-related props to be set *before* we focus the element
      transferProps(this, rediscoveredElement)
      up.focus(rediscoveredElement, options)
      // Signals callers that we could restore
      return true
    }
  }

  static preserveWithin(oldElement) {
    let focusedElement = focusedElementWithin(oldElement)
    if (!focusedElement) return

    let target = up.fragment.tryToTarget(focusedElement)
    if (!target) return

    const plan = { oldElement, target }
    transferProps(focusedElement, plan)
    return new this(plan)
  }

  wasLost() {
    return !focusedElementWithin(this.oldElement)
  }
}
