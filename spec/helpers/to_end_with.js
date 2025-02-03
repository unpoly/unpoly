const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toEndWith(util, customEqualityTesters) {
      return {
        compare(string, substring) {
          return { pass: string.endsWith(substring) }
        }
      }
    }
  })
})
