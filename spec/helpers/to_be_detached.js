const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBeDetached(util, customEqualityTesters) {
      return {
        compare(element) {
          element = up.element.get(element)
          return { pass: element && up.specUtil.isDetached(element) }
        }
      }
    }
  })
})
