const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addCustomEqualityTester(function(first, second) {
    if (u.isObject(first) && u.isObject(second) && first[up.util.isEqual.key]) {
      return first[u.isEqual.key](second)
    }
  })
})
