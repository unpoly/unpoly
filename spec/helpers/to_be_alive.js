const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBeAlive(util, customEqualityTesters) {
      return {
        compare(layer) {
          return { pass: layer.isAlive() }
        }
      }
    }
  })
})
