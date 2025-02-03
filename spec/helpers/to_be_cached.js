const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBeCached(util, customEqualityTesters) {
      return {
        compare(optionsOrRequest) {
          const request = u.wrapValue(up.Request, optionsOrRequest)
          const cached = up.cache.get(request)

          return { pass: !!cached }
        }
      }
    },

    toBeCachedWithoutResponse(util, customEqualityTesters) {
      return {
        compare(optionsOrRequest) {
          const request = u.wrapValue(up.Request, optionsOrRequest)
          const cached = up.cache.get(request)

          const pass = cached && !cached.response

          return { pass }
        }
      }
    },

    toBeCachedWithResponse(util, customEqualityTesters) {
      return {
        compare(optionsOrRequest, expectedResponseProps = {}) {
          let message
          const request = u.wrapValue(up.Request, optionsOrRequest)
          const cached = up.cache.get(request)

          const pass = cached && cached.response && u.objectContains(cached.response, expectedResponseProps)

          if (pass) {
            message = u.sprintf("Expected %o not to be cached with response %o, but the cached response was %o", request, expectedResponseProps, cached?.response)
          } else {
            message = u.sprintf("Expected %o to be cached with response %o, but the cached response was %o", request, expectedResponseProps, cached?.response)
          }

          return { pass, message }
        }
      }
    }
  })
})
