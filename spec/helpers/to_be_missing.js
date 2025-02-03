const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBeMissing(util, customEqualityTesters) {
      return {
        compare(actual) {
          return { pass: up.util.isMissing(actual) }
        }
      }
    }
  })
})
