const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toHaveOwnProperty(util, customEqualityTesters) {
      return {
        compare(object, expectedProperty) {
          return { pass: object.hasOwnProperty(expectedProperty) } // oxlint-disable-line no-prototype-builtins
        }
      }
    }
  })
})
