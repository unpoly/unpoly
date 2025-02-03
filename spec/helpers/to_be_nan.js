const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBeNaN(util, customEqualityTesters) {
      return {
        compare(actual) {
          return { pass: Number.isNaN(actual) }
        }
      }
    }
  })
})
