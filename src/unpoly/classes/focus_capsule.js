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
    return PRESERVE_KEYS.concat(['target'])
  }

  restore(layer, options) {
    let rediscoveredElement = up.fragment.get(this.target, { layer })
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

  static preserve(layer) {
    let focusedElement = up.viewport.focusedElementWithin(layer.element)
    if (!focusedElement) return

    let target = up.fragment.tryToTarget(focusedElement)
    if (!target) return

    const plan = { target }
    transferProps(focusedElement, plan)

    return new this(plan)
  }

}
