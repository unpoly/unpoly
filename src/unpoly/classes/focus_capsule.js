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

up.FocusCapsule = class FocusCapsule extends up.Record {
  keys() {
    return ['target', 'oldElement'].concat(PRESERVE_KEYS)
  }

  restore(scope, options) {
    if (this.supportsLost() && !this.wasLost()) {
      // If the old element was never detached (e.g. because it was kept),
      // and still has focus, we don't need to do anything.
      return
    }

    let rediscoveredElement = e.get(scope, this.target)
    if (rediscoveredElement) {
      // Firefox needs focus-related props to be set *before* we focus the element
      transferProps(this, rediscoveredElement)
      up.focus(rediscoveredElement, options)

      // Signals callers that we could restore.
      //
      // This matters to up.FragmentFocus to know that a { focus: ['restore', '.other'] }
      // option could restore focus, and should not focus the next option (".other".).
      return true
    }
  }

  static preserveWithin(oldElement, options) {
    let focusedElement = up.viewport.focusedElementWithin(oldElement)
    return this.preserveElement(focusedElement, options)
  }

  static preserveCurrent(options) {
    return this.preserveElement(document.activeElement, options)
  }

  static preserveElement(focusedElement, options = {}) {
    if (!focusedElement) return

    let target = up.fragment.tryToTarget(focusedElement)
    if (!target) return

    const plan = { target }

    // Only store the oldElement when requested, since doing this will prevent
    // garbage-collection of a detached oldElement.
    if (options.supportLost) {
      plan.oldElement = focusedElement
    }

    transferProps(focusedElement, plan)
    return new this(plan)
  }

  supportsLost() {
    return !!this.oldElement
  }

  wasLost() {
    if (!this.supportsLost()) {
      up.fail('FocusCapsule does not support #wasLost()')
    }

    return !up.viewport.focusedElementWithin(this.oldElement)
  }
}
