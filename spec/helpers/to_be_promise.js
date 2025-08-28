const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBePromise(util, customEqualityTesters) {
      return {
        compare(actual) {
          return { pass: u.isPromise(actual) }
        }
      }
    },
    toBePromiseLike(util, customEqualityTesters) {
      return {
        compare(actual) {
          return { pass: u.isFunction(actual.then) && u.isFunction(actual.catch) && u.isFunction(actual.finally) }
        }
      }
    }
  })
})
