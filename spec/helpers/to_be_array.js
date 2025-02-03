beforeEach(function() {
  jasmine.addMatchers({
    toBeArray(util, customEqualityTesters) {
      return {
        compare(actual) {
          return { pass: up.util.isArray(actual) }
        }
      }
    }
  })
})
