const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBePresent(util, customEqualityTesters) {
      return {
        compare(actual) {
          return { pass: up.util.isPresent(actual) }
        }
      }
    }
  })
})
