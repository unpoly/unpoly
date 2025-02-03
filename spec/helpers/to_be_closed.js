const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBeClosed(util, customEqualityTesters) {
      return {
        compare(layer) {
          return { pass: layer.isClosed() }
        }
      }
    }
  })
})
