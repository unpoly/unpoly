u = up.util

beforeEach(function() {
  jasmine.addMatchers({
    toBeChecked: function(util, customEqualityTesters) {
      return {
        compare: function(element) {
          element = up.element.get(element)
          return {
            pass: element && element.checked
          }
        }
      }
    }
  })
})
