const u = up.util
const $ = jQuery

beforeEach(function () {
  jasmine.addMatchers({
    toMatchSelector(util, customEqualityTesters) {
      return {
        compare(actualElement, expectedSelector) {
          actualElement = up.element.get(actualElement) // unwrap jQuery
          return { pass: actualElement.matches(expectedSelector) }
        }
      }
    }
  })
})

jasmine.elementMatchingSelector = function elementMatchingSelector(expectedSelector) {
  return {
    asymmetricMatch(actualElement) {
      return actualElement.matches(expectedSelector)
    },

    jasmineToString() {
      return `<elementMatchingSelector: ${expectedSelector}>`
    }
  }
}
