const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addCustomEqualityTester(function(a, b) {
    if (a instanceof HTMLCollection) {
      return (a.length === b.length) && u.every(a, (elem, index) => a[index] === b[index])
    }
  })
})
