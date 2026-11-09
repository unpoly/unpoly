const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBeCached(util, customEqualityTesters) {
      return {
        compare(optionsOrRequest) {
          const request = up.internal.wrapValue(up.Request, optionsOrRequest)
          const cached = up.cache.get(request)

          return { pass: !!cached }
        }
      }
    },

    toBeCachedWithoutResponse(util, customEqualityTesters) {
      return {
        compare(optionsOrRequest) {
          const request = up.internal.wrapValue(up.Request, optionsOrRequest)
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
          const request = up.internal.wrapValue(up.Request, optionsOrRequest)
          const cached = up.cache.get(request)

          const pass = cached && cached.response && up.internal.objectContains(cached.response, expectedResponseProps)
          let actualResponseProps = cached.response ? u.pick(cached.response, Object.keys(expectedResponseProps)) : null

          if (pass) {
            message = up.internal.sprintf("Expected %o not to be cached with response %o, but the cached response was %o", request, expectedResponseProps, actualResponseProps)
          } else {
            message = up.internal.sprintf("Expected %o to be cached with response %o, but the cached response was %o", request, expectedResponseProps, actualResponseProps)
          }

          return { pass, message }
        }
      }
    }
  })
})
