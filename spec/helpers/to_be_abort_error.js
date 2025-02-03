const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBeAbortError(util, customEqualityTesters) {
      return {
        compare(actual, message) {
          return { pass: (actual instanceof Error) && (actual.name === 'AbortError') && (!message || (message instanceof RegExp && message.test(actual.message)) || (actual.message === message)) }
        }
      }
    }
  })
})
