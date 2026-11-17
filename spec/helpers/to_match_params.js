const u = up.util

beforeEach(function() {
  jasmine.addMatchers({
    toMatchParams(util, customEqualityTesters) {
      return {
        compare(actual, expected) {
          actual = up.internal.wrapValue(up.Params, actual)
          expected = up.internal.wrapValue(up.Params, expected)

          return { pass: u.isEqual(actual, expected) }
        }
      }
    }
  })
})
