const u = up.util
const e = up.element
const $ = jQuery

function describeElement(element) {
  return up.fragment.tryToTarget(element) || e.tagName(element)
}

function matcher(util, customEqualityTesters) {
  return {
    compare(element) {
      let message, pass
      if (element instanceof up.Layer) {
        element = element.getFocusElement()
      } else {
        element = up.element.get(element)
      }

      const focusedElement = document.activeElement

      if (!element) {
        pass = false
        message = 'cannot check focus on a null element'
      } else if (focusedElement === element) {
        pass = true
        message = 'Expected ' + describeElement(element) + ' not to be focused'
      } else {
        pass = false
        message = 'Expected ' + describeElement(element) + ' to be focused'
        if (focusedElement) {
          message += ', but ' + describeElement(focusedElement) + ' was focused'
        } else {
          message += ', but nothing was focused'
        }
      }

      return { pass, message }
    }
  }
}

beforeEach(function() {
  jasmine.addMatchers({
    toBeFocused: matcher,
    toHaveFocus: matcher
  })
})

