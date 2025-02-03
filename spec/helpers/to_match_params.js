const u = up.util

beforeEach(function() {
  jasmine.addMatchers({
    toMatchParams(util, customEqualityTesters) {
      return {
        compare(actual, expected) {
          actual = u.wrapValue(up.Params, actual)
          expected = u.wrapValue(up.Params, expected)

          return { pass: u.isEqual(actual, expected) }
        }
      }
    }
  })
})
