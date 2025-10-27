const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBeScrolledTo(util, customEqualityTesters) {
      return {
        compare(object, expectedTop, tolerance = 1.0) {
          const actualTop = $(object).scrollTop()
          const result = {}

          // There are rounding errors if the test runner is zoomed in/out
          result.pass = Math.abs(expectedTop - actualTop) <= tolerance

          if (result.pass) {
            result.message = `Expected ${object} to not be scrolled to ${expectedTop} (tolerance: ${tolerance})`
          } else {
            result.message = `Expected ${object} to be scrolled to ${expectedTop}, but it was scrolled to ${actualTop} (tolerance: ${tolerance})`
          }

          return result
        }
      }
    }
  })
})
