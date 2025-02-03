const u = up.util
const $ = jQuery

beforeEach(function() {
  return jasmine.addMatchers({
    toHaveClass(util, customEqualityTesters) {
      return {
        compare(element, expectedClass) {
          element = up.element.get(element)
          return { pass: element && element.classList.contains(expectedClass) }
        }
      }
    }
  })
})

