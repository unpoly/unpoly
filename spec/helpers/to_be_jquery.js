beforeEach(function() {
  jasmine.addMatchers({
    toBeJQuery(util, customEqualityTesters) {
      return {
        compare(actual) {
          return { pass: up.util.isJQuery(actual) }
        }
      }
    }
  })
})
