const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toMatchText(util, customEqualityTesters) {
      return {
        compare(actualString, expectedString) {
          const normalize = function(str) {
            str = str.trim()
            str = str.replace(/[\n\r\t ]+/g, ' ')
            return str
          }

          return { pass: normalize(actualString) === normalize(expectedString) }
        }
      }
    }
  })
})
