const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBeAround(util, customEqualityTesters) {
      return {
        compare(actual, expected, tolerance) {
          return { pass: Math.abs(expected - actual) <= tolerance }
        }
      }
    }
  })
})
