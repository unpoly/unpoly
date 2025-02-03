const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toHaveLength(util, customEqualityTesters) {
      return {
        compare(actualObject, expectedLength) {
          return { pass: actualObject && (actualObject.length === expectedLength) }
        }
      }
    }
  })
})
