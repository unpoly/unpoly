const u = up.util

beforeEach(() => {
  jasmine.addMatchers({
    toMatchURL(util, customEqualityTesters) {
      return {
        compare(actual, expected, normalizeOptions = {}) {
          let pass = true
          pass &&= u.isString(actual)
          pass &&= u.isString(expected)
          pass &&= u.normalizeURL(actual, normalizeOptions) === u.normalizeURL(expected, normalizeOptions)
          return { pass }
        }
      }
    }
  })
})


