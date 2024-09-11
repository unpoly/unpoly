const u = up.util

beforeEach(function() {
  jasmine.addMatchers({
    toHaveKey: function(util, customEqualityTesters) {
      return {
        compare: function(object, key) {
          return {
            pass: (key in object)
          }
        }
      }
    }
  })
})
