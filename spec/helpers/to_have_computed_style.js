const u = up.util
const e = up.element

beforeEach(function() {
  jasmine.addMatchers({
    toHaveComputedStyle: function(util, customEqualityTesters) {
      return {
        compare: function(element, expectedStyles) {
          element = up.element.get(element)
          return {
            pass: element && util.equals(expectedStyles, e.style(element, Object.keys(expectedStyles)))
          }
        }
      }
    }
  })
})
