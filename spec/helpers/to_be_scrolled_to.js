const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBeScrolledTo(util, customEqualityTesters) {
      return {
        compare(object, expectedTop) {
          const tolerance = 1.5
          const actualTop = $(object).scrollTop()
          return {
            pass: Math.abs(expectedTop - actualTop) <= tolerance
          }
        }
      }
    }
  })
})
