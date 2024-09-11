const u = up.util

beforeEach(function() {
  jasmine.addMatchers({
    toBeDisabled: function(util, customEqualityTesters) {
      return {
        compare: function(element) {
          element = up.element.get(element)
          return {
            pass: element && element.disabled
          }
        }
      }
    }
  })
})
