const u = up.util

beforeEach(function() {
  jasmine.addMatchers({
    toMatchJSON(util, customEqualityTesters) {
      return {
        compare(actualJSON, expected) {
          if (!u.isString(expected)) {
            expected = JSON.stringify(expected)
          }
          const expectedParsed = JSON.parse(expected)
          const actualParsed = JSON.parse(actualJSON)

          return {
            pass: util.equals(expectedParsed, actualParsed, customEqualityTesters)
          }
        }
      }
    }
  })
})
