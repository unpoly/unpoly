const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toHaveDescendant(util, customEqualityTesters) {
      return {
        compare(element, expectedDescendant) {
          return { pass: $(element).find(expectedDescendant).length }
        }
      }
    }
  })
})
