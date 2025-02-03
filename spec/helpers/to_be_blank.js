const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBeBlank(util, customEqualityTesters) {
      return {
        compare(actual) {
          return { pass: up.util.isBlank(actual) }
        }
      }
    }
  })
})
