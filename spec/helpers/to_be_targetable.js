beforeEach(function() {
  jasmine.addMatchers({
    toBeTargetable(util, customEqualityTesters) {
      return {
        compare(actual) {
          return { pass: up.fragment.isTargetable(actual) }
        }
      }
    }
  })
})
