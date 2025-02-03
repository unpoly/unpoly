const u = up.util
const $ = jQuery

beforeEach(() => jasmine.addMatchers({
  toBeElement(util, customEqualityTesters) {
    return {
      compare(actual) {
        return { pass: actual instanceof Element }
      }
    }
  }
}))
