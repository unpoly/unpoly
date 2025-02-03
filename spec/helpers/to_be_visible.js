const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBeVisible(util, customEqualityTesters) {
      return {
        compare(object) {
          return { pass: object && up.specUtil.isVisible(object) }
        }
      }
    }
  })
})

