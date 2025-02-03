const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBeHidden(util, customEqualityTesters) {
      return {
        compare(object) {
          return { pass: object && up.specUtil.isHidden(object) }
        }
      }
    }
  })
})
