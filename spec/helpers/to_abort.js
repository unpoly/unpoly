const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toAbort(util, customEqualityTesters) {
      return {
        compare(fn) {
          let error = null

          try {
            fn()
          } catch (e) {
            error = e
          }

          return { pass: error && (error instanceof Error) && (error.name === 'AbortError') }
        }
      }
    }
  })
})
