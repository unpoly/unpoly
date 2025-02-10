const u = up.util
const e = up.element
const $ = jQuery

function describeElement(element) {
  return up.fragment.tryToTarget(element) || e.tagName(element)
}

function matcher(util, customEqualityTesters) {
  return {
    compare(element) {
      if (element instanceof up.Layer) {
        element = element.getFocusElement()
      } else {
        element = up.element.get(element)
      }

      if (!element) throw new Error('Cannot check focus on a null element')

      const focusedElement = document.activeElement

      const result = { pass: (element === focusedElement) }

      if (result.pass) {
        result.message = 'Expected ' + describeElement(element) + ' not to be focused, but it was'
      } else {
        result.message = 'Expected ' + describeElement(element) + ' to be focused, but ' + describeElement(focusedElement) + ' was focused'
      }
      return result
    }
  }
}

beforeEach(function() {
  jasmine.addMatchers({
    toBeFocused: matcher,
    toHaveFocus: matcher
  })
})

