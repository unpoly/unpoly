const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBeNodeList(util, customEqualityTesters) {
      return {
        compare(actual) {
          return { pass: actual instanceof NodeList }
        }
      }
    }
  })
})
