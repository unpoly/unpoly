const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addCustomEqualityTester(function(first, second) {
    if (u.isJQuery(first) && u.isJQuery(second)) {
      return first.is(second)
    }
  })
})
