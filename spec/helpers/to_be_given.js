const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBeGiven(util, customEqualityTesters) {
      return {
        compare(actual) {
          return { pass: up.util.isGiven(actual) }
        }
      }
    }
  })
})
