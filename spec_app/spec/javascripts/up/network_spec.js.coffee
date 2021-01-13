u = up.util
$ = jQuery

describe 'up.network', ->

  beforeEach ->
    # Disable response time measuring for these tests
    up.network.config.preloadEnabled = true

  describe 'JavaScript functions', ->

    describe 'up.request()', ->

      it 'makes a request with the given URL and params', ->
        up.request('/foo', params: { key: 'value' }, method: 'post')
        request = @lastRequest()
        expect(request.url).toMatchURL('/foo')
        expect(request.data()).toEqual(key: ['value'])
        expect(request.method).toEqual('POST')

      it 'also allows to pass the URL as a { url } option instead', ->
        up.request(url: '/foo', params: { key: 'value' }, method: 'post')
        request = @lastRequest()
        expect(request.url).toMatchURL('/foo')
        expect(request.data()).toEqual(key: ['value'])
        expect(request.method).toEqual('POST')

#      it 'allows to pass in an up.Request instance instead of an options object', ->
#        requestArg = new up.Request(url: '/foo', params: { key: 'value' }, method: 'post')
#        up.request(requestArg)
#
#        jasmineRequest = @lastRequest()
#        expect(jasmineRequest.url).toMatchURL('/foo')
#        expect(jasmineRequest.data()).toEqual(key: ['value'])
#        expect(jasmineRequest.method).toEqual('POST')

      it 'resolves to a Response object that contains information about the response and request', (done) ->
        promise = up.request(
          url: '/url'
          params: { key: 'value' }
          method: 'post'
          target: '.target'
        )

        u.task =>
          @respondWith(
            status: 201,
            responseText: 'response-text'
          )

          promise.then (response) ->
            expect(response.request.url).toMatchURL('/url')
            expect(response.request.params).toEqual(new up.Params(key: 'value'))
            expect(response.request.method).toEqual('POST')
            expect(response.request.target).toEqual('.target')
            expect(response.request.hash).toBeBlank()

            expect(response.url).toMatchURL('/url') # If the server signaled a redirect with X-Up-Location, this would be reflected here
            expect(response.method).toEqual('POST') # If the server sent a X-Up-Method header, this would be reflected here
            expect(response.text).toEqual('response-text')
            expect(response.status).toEqual(201)
            expect(response.xhr).toBePresent()

            done()

      it 'resolves to a Response that contains the response headers', (done) ->
        promise = up.request(url: '/url')

        u.task =>
          @respondWith
            responseHeaders: { 'foo': 'bar', 'baz': 'bam' }
            responseText: 'hello'

        promise.then (response) ->
          expect(response.getHeader('foo')).toEqual('bar')

          # Lookup is case-insensitive
          expect(response.getHeader('BAZ')).toEqual('bam')

          done()

      it "preserves the URL hash in a separate { hash } property, since although it isn't sent to server, code might need it to process the response", (done) ->
        promise = up.request('/url#hash')

        u.task =>
          request = @lastRequest()
          expect(request.url).toMatchURL('/url')

          @respondWith('response-text')

          promise.then (response) ->
            expect(response.request.url).toMatchURL('/url')
            expect(response.request.hash).toEqual('#hash')
            expect(response.url).toMatchURL('/url')
            done()

      it 'does not send a X-Requested-With header that a server-side framework might use to detect AJAX requests and be "smart" about its response', (done) ->
        up.request('/url')

        u.task =>
          headers = @lastRequest().requestHeaders
          expect(headers['X-Requested-With']).toBeMissing()
          done()

      describe 'transfer of meta attributes', ->

        it 'submits information about the fragment update as HTTP headers, so the server may choose to optimize its responses', asyncSpec (next) ->
          makeLayers(2)

          next =>
            up.request(
              url: '/foo',
              target: '.target',
              layer: 'overlay',
              failTarget: '.fail-target',
              failLayer: 'root'
            )

          next =>
            request = @lastRequest()
            expect(request.requestHeaders['X-Up-Target']).toEqual('.target')
            expect(request.requestHeaders['X-Up-Fail-Target']).toEqual('.fail-target')
            expect(request.requestHeaders['X-Up-Mode']).toEqual('modal')
            expect(request.requestHeaders['X-Up-Fail-Mode']).toEqual('root')

        it 'lets the user configure a smaller set of meta keys for better cacheability', asyncSpec (next) ->
          makeLayers(2)

          up.network.config.requestMetaKeys = ['target']

          next =>
            up.request(
              url: '/foo',
              target: '.target',
              layer: 'overlay',
              failTarget: '.fail-target',
              failLayer: 'root'
            )

          next =>
            request = @lastRequest()
            expect(request.requestHeaders['X-Up-Target']).toEqual('.target')
            expect(request.requestHeaders['X-Up-Fail-Target']).toBeMissing()
            expect(request.requestHeaders['X-Up-Mode']).toBeMissing()
            expect(request.requestHeaders['X-Up-Fail-Mode']).toBeMissing()


      describe 'setting meta attributes', ->

        it 'allows to quickly construct a cachable up.Request by passing { layer, failLayer } options', asyncSpec (next) ->
          makeLayers [
            { mode: 'root', context: { rootKey: 'rootValue' }}
            { mode: 'popup', context: { popupKey: 'popupValue' }}
          ]

          next =>
            request = up.request({ url: '/foo', layer: 'root', failLayer: 'front' })
            expect(request.mode).toEqual('root')
            expect(request.failMode).toEqual('popup')
            expect(request.context).toEqual({ rootKey: 'rootValue' })
            expect(request.failContext).toEqual({ popupKey: 'popupValue' })

        it 'allows to quickly construct a cachable up.Request by passing an { origin } option', asyncSpec (next) ->
          makeLayers [
            { mode: 'root', context: { rootKey: 'rootValue' }}
            { mode: 'popup', context: { popupKey: 'popupValue' }}
          ]

          next =>
            request = up.request({ url: '/foo', origin: up.layer.front.element })
            expect(request.mode).toEqual('popup')
            expect(request.failMode).toEqual('popup')
            expect(request.context).toEqual({ popupKey: 'popupValue' })
            expect(request.failContext).toEqual({ popupKey: 'popupValue' })

        it 'assumes the current layer if neither { layer, failLayer, origin} are given', asyncSpec (next) ->
          makeLayers [
            { mode: 'root', context: { rootKey: 'rootValue' }}
            { mode: 'popup', context: { popupKey: 'popupValue' }}
          ]

          next =>
            request = up.request({ url: '/foo' })
            expect(request.mode).toEqual('popup')
            expect(request.failMode).toEqual('popup')
            expect(request.context).toEqual({ popupKey: 'popupValue' })
            expect(request.failContext).toEqual({ popupKey: 'popupValue' })

      describe 'error handling', ->

        it 'rejects with up.Failed when there was a network error', (done) ->
          request = up.request('/url')

          u.task =>
            @lastRequest().responseError()

            promiseState(request).then (result) ->
              expect(result.state).toEqual('rejected')
              expect(result.value.name).toEqual('up.Failed')
              expect(result.value.name).toEqual('up.Failed')
              done()

        it 'rejects with a non-ok up.Response when the server sends a 404 status code', (done) ->
          request = up.request('/url')

          u.task =>
            @respondWith('text', status: 404)

            promiseState(request).then (result) ->
              expect(result.state).toEqual('rejected')
              expect(result.value).toEqual(jasmine.any(up.Response))
              expect(result.value.status).toEqual(404)
              expect(result.value.ok).toEqual(false)
              done()

        it 'rejects with a non-ok up.Response when the server sends a 500 status code', (done) ->
          request = up.request('/url')

          u.task =>
            @respondWith('text', status: 500)

            promiseState(request).then (result) ->
              expect(result.state).toEqual('rejected')
              expect(result.value).toEqual(jasmine.any(up.Response))
              expect(result.value.status).toEqual(500)
              expect(result.value.ok).toEqual(false)
              done()

        it 'rejects with AbortError when the request times out', (done) ->
          request = up.request('/url')

          u.task =>
            jasmine.clock().install() # required by responseTimeout()
            @lastRequest().responseTimeout()

            promiseState(request).then (result) ->
              expect(result.state).toEqual('rejected')
              expect(result.value.name).toEqual('AbortError')
              done()

      describe 'when the server responds with an X-Up-Method header', ->

        it 'updates the { method } property in the response object', (done) ->
          promise = up.request(
            url: '/url'
            params: { key: 'value' }
            method: 'post'
            target: '.target'
          )

          u.task =>
            @respondWith(
              responseHeaders:
                'X-Up-Location': '/redirect'
                'X-Up-Method': 'GET'
            )

            promise.then (response) ->
              expect(response.request.url).toMatchURL('/url')
              expect(response.request.method).toEqual('POST')
              expect(response.url).toMatchURL('/redirect')
              expect(response.method).toEqual('GET')
              done()

      describe 'aborting', ->

        it 'may be aborted with up.network.abort()', asyncSpec (next) ->
          request = up.request('/url')

          next ->
            up.network.abort(request)

          next.await ->
            promiseState(request)

          next (result) ->
            expect(result.state).toEqual('rejected')
            expect(result.value.name).toEqual('AbortError')

        it 'may be aborted with up.Request#abort()', asyncSpec (next) ->
          request = up.request('/url')

          next ->
            request.abort()

          next.await ->
            promiseState(request)

          next (result) ->
            expect(result.state).toEqual('rejected')
            expect(result.value.name).toEqual('AbortError')

#        it "may be aborted through an AbortController's { signal }", asyncSpec (next) ->
#          abortController = new up.AbortController()
#          request = up.request('/url', signal: abortController.signal)
#
#          next ->
#            abortController.abort()
#
#          next.await ->
#            promiseState(request)
#
#          next (result) ->
#            expect(result.state).toEqual('rejected')
#            expect(result.value.name).toEqual('AbortError')

        it 'emits an up:request:aborted event', asyncSpec (next) ->
          listener = jasmine.createSpy('event listener')
          up.on('up:request:aborted', listener)

          request = up.request('/url')

          next ->
            request.abort()

          next ->
            expect(listener).toHaveBeenCalled()
            expect(listener.calls.argsFor(0)[0]).toBeEvent('up:request:aborted')

        it 'does not send multiple up:request:aborted events if the request is aborted multiple times', asyncSpec (next) ->
          listener = jasmine.createSpy('event listener')
          up.on('up:request:aborted', listener)

          request = up.request('/url')

          next ->
            up.network.abort(request)
            up.network.abort(request)

          next ->
            expect(listener.calls.count()).toBe(1)

        it 'does not reset the XHR object by calling xhr.abort() on a loaded XHR object (bugfix)', asyncSpec (next) ->
          request = up.request('/url')
          response = null
          request.then (r) -> response = r

          next =>
            expect(request.xhr).toBeGiven()

            # Just to make sure that the fake XHR object we have in specs has different
            # side effects than the real one: Check that xhr.abort() is never called.
            spyOn(request.xhr, 'abort').and.callThrough()

            @respondWith('response text')

          next =>
            expect(response.xhr.readyState).toBe(XMLHttpRequest.DONE)
            expect(response.contentType).toEqual('text/html')

            request.abort()

          next =>
            # Calling xhr.abort() on a loaded XHR will reset the readyState to 0
            expect(response.xhr.readyState).toBe(XMLHttpRequest.DONE)

            # Calling xhr.abort() on a loaded XHR will lose all response headers
            expect(response.contentType).toEqual('text/html')

            expect(request.xhr.abort).not.toHaveBeenCalled()

        it 'does not abort a request that was already fulfilled with a response', asyncSpec (next) ->
          listener = jasmine.createSpy('event listener')
          up.on('up:request:aborted', listener)

          request = up.request('/url')

          next =>
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            @respondWith('response from server')

          next.await ->
            promiseState(request)

          next (result) ->
            expect(result.state).toBe('fulfilled')
            expect(result.value).toEqual(jasmine.any(up.Response))
            expect(listener).not.toHaveBeenCalled()

          next ->
            request.abort()

          next.await ->
            promiseState(request)

          next (result) ->
            expect(result.state).toBe('fulfilled')
            expect(result.value).toEqual(jasmine.any(up.Response))
            expect(listener).not.toHaveBeenCalled()

      describe 'when the server responds with an X-Up-Location header', ->

        it 'sets the { url } property on the response object', (done) ->
          promise = up.request('/request-url#request-hash')

          u.task =>
            @respondWith
              responseHeaders:
                'X-Up-Location': '/response-url'

            promise.then (response) ->
              expect(response.request.url).toMatchURL('/request-url')
              expect(response.request.hash).toEqual('#request-hash')
              expect(response.url).toMatchURL('/response-url')
              done()

        describe 'when caching', ->

          it 'considers a redirection URL an alias for the requested URL', asyncSpec (next) ->
            up.request('/foo', cache: true)

            next =>
              expect(jasmine.Ajax.requests.count()).toEqual(1)
              @respondWith
                responseHeaders:
                  'X-Up-Location': '/bar'
                  'X-Up-Method': 'GET'

            next =>
              up.request('/bar', cache: true)

            next =>
              # See that the cached alias is used and no additional requests are made
              expect(jasmine.Ajax.requests.count()).toEqual(1)

          it 'does not considers a redirection URL an alias for the requested URL if the original request was never cached', asyncSpec (next) ->
            up.request('/foo', method: 'post', cache: true) # POST requests are not cached

            next =>
              expect(jasmine.Ajax.requests.count()).toEqual(1)
              @respondWith
                responseHeaders:
                  'X-Up-Location': '/bar'
                  'X-Up-Method': 'GET'

            next =>
              up.request('/bar', cache: true)

            next =>
              # See that an additional request was made
              expect(jasmine.Ajax.requests.count()).toEqual(2)

          it 'does not considers a redirection URL an alias for the requested URL if the response returned a non-200 status code', asyncSpec (next) ->
            up.request('/foo', cache: true)

            next =>
              expect(jasmine.Ajax.requests.count()).toEqual(1)
              @respondWith
                responseHeaders:
                  'X-Up-Location': '/bar'
                  'X-Up-Method': 'GET'
                status: 500

            next =>
              up.request('/bar', cache: true)

            next =>
              # See that an additional request was made
              expect(jasmine.Ajax.requests.count()).toEqual(2)

        describeCapability 'canInspectFormData', ->

          it "does not explode if the original request's { params } is a FormData object", asyncSpec (next) ->
            up.request('/foo', method: 'post', params: new FormData()) # POST requests are not cached

            next =>
              expect(jasmine.Ajax.requests.count()).toEqual(1)
              @respondWith
                responseHeaders:
                  'X-Up-Location': '/bar'
                  'X-Up-Method': 'GET'

            next =>
              @secondAjaxPromise = up.request('/bar')

            next.await =>
              promiseState(@secondAjaxPromise).then (result) ->
                # See that the promise was not rejected due to an internal error.
                expect(result.state).toEqual('pending')

      # All browsers except IE11 make the response URL available through `xhr.responseURL`.
      describe 'when the XHR object has a { responseURL } property', ->

        it 'sets the { url } property on the response object', (done) ->
          promise = up.request('/request-url#request-hash')

          u.task =>
            @respondWith
              responseURL: '/response-url'

            promise.then (response) ->
              expect(response.request.url).toMatchURL('/request-url')
              expect(response.request.hash).toEqual('#request-hash')
              expect(response.url).toMatchURL('/response-url')
              done()

        it "assumes a response method of GET if the { reponseURL } is not the request URL", (done) ->
          promise = up.request('/request-url', method: 'post')

          u.task =>
            @respondWith
              responseURL: '/response-url'

            promise.then (response) ->
              expect(response.url).toMatchURL('/response-url')
              expect(response.method).toEqual('GET')
              done()

        it "assumes the method did not change if if the { reponseURL } equals the request's URL", (done) ->
          promise = up.request('/request-url', method: 'post')

          u.task =>
            @respondWith
              responseURL: '/request-url'

            promise.then (response) ->
              expect(response.url).toMatchURL('/request-url')
              expect(response.method).toEqual('POST')
              done()

        it "sets the { method } to an X-Up-Method header, even if if the { reponseURL } equals the request's URL", (done) ->
          promise = up.request('/request-url', method: 'post')

          u.task =>
            @respondWith
              responseURL: '/request-url'
              responseHeaders: { 'X-Up-Method': 'GET' }

            promise.then (response) ->
              expect(response.url).toMatchURL('/request-url')
              expect(response.method).toEqual('GET')
              done()

        describe 'when caching', ->

          it 'considers a redirection URL an alias for the requested URL', asyncSpec (next) ->
            up.request('/foo', cache: true)

            next =>
              expect(jasmine.Ajax.requests.count()).toEqual(1)
              @respondWith
                responseURL: '/bar'

            next =>
              up.request('/bar', cache: true)

            next =>
              # See that the cached alias is used and no additional requests are made
              expect(jasmine.Ajax.requests.count()).toEqual(1)

          it 'does not considers a redirection URL an alias for the requested URL if the original request was never cached', asyncSpec (next) ->
            up.request('/foo', method: 'post', cache: true) # POST requests are not cached

            next =>
              expect(jasmine.Ajax.requests.count()).toEqual(1)
              @respondWith
                responseURL: '/bar'

            next =>
              up.request('/bar', cache: true)

            next =>
              # See that an additional request was made
              expect(jasmine.Ajax.requests.count()).toEqual(2)

          it 'does not considers a redirection URL an alias for the requested URL if the response returned a non-200 status code', asyncSpec (next) ->
            up.request('/foo', cache: true)

            next =>
              expect(jasmine.Ajax.requests.count()).toEqual(1)
              @respondWith
                responseURL: '/bar'
                status: 500

            next =>
              up.request('/bar', cache: true)

      describe 'CSRF', ->

        beforeEach ->
          up.protocol.config.csrfHeader = 'csrf-header'
          up.protocol.config.csrfToken = 'csrf-token'

        it 'sets a CSRF token in the header', asyncSpec (next) ->
          up.request('/path', method: 'post')
          next =>
            headers = @lastRequest().requestHeaders
            expect(headers['csrf-header']).toEqual('csrf-token')

        it 'does not add a CSRF token if there is none', asyncSpec (next) ->
          up.protocol.config.csrfToken = ''
          up.request('/path', method: 'post')
          next =>
            headers = @lastRequest().requestHeaders
            expect(headers['csrf-header']).toBeMissing()

        it 'does not add a CSRF token for GET requests', asyncSpec (next) ->
          up.request('/path', method: 'get')
          next =>
            headers = @lastRequest().requestHeaders
            expect(headers['csrf-header']).toBeMissing()

        it 'does not add a CSRF token when loading content from another domain', asyncSpec (next) ->
          up.request('http://other-domain.tld/path', method: 'post')
          next =>
            headers = @lastRequest().requestHeaders
            expect(headers['csrf-header']).toBeMissing()

      describe 'with { params } option', ->

        it "uses the given params as a non-GET request's payload", asyncSpec (next) ->
          givenParams = { 'foo-key': 'foo-value', 'bar-key': 'bar-value' }
          up.request(url: '/path', method: 'put', params: givenParams)

          next =>
            expect(@lastRequest().data()['foo-key']).toEqual(['foo-value'])
            expect(@lastRequest().data()['bar-key']).toEqual(['bar-value'])

        it "encodes the given params into the URL of a GET request", (done) ->
          givenParams = { 'foo-key': 'foo-value', 'bar-key': 'bar-value' }
          promise = up.request(url: '/path', method: 'get', params: givenParams)

          u.task =>
            expect(@lastRequest().url).toMatchURL('/path?foo-key=foo-value&bar-key=bar-value')
            expect(@lastRequest().data()).toBeBlank()

            @respondWith('response-text')

            promise.then (response) ->
              # See that the response object has been updated by moving the data options
              # to the URL. This is important for up.fragment code that works on response.request.
              expect(response.request.url).toMatchURL('/path?foo-key=foo-value&bar-key=bar-value')
              expect(response.request.params).toBeBlank()
              done()

      describe 'with { cache } option', ->

        it 'caches server responses for the configured duration', asyncSpec (next) ->
          up.network.config.cacheExpiry = 200 # 1 second for test

          responses = []
          trackResponse = (response) -> responses.push(response.text)

          next =>
            up.request(url: '/foo', cache: true).then(trackResponse)
            expect(jasmine.Ajax.requests.count()).toEqual(1)

          next.after (10), =>
            # Send the same request for the same path
            up.request(url: '/foo', cache: true).then(trackResponse)

          next =>
            # See that only a single network request was triggered
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(responses).toEqual([])

          next =>
            # Server responds once.
            @respondWith('foo')

          next =>
            # See that both requests have been fulfilled
            expect(responses).toEqual(['foo', 'foo'])

          next.after (200), =>
            # Send another request after another 3 minutes
            # The clock is now a total of 6 minutes after the first request,
            # exceeding the cache's retention time of 5 minutes.
            up.request(url: '/foo', cache: true).then(trackResponse)

            # See that we have triggered a second request
            expect(jasmine.Ajax.requests.count()).toEqual(2)

          next =>
            @respondWith('bar')

          next =>
            expect(responses).toEqual(['foo', 'foo', 'bar'])

        it "does not cache responses if config.cacheExpiry is 0", asyncSpec (next) ->
          up.network.config.cacheExpiry = 0
          next => up.request(url: '/foo', cache: true)
          next => up.request(url: '/foo', cache: true)
          next => expect(jasmine.Ajax.requests.count()).toEqual(2)

        it "does not cache responses if config.cacheSize is 0", asyncSpec (next) ->
          up.network.config.cacheSize = 0
          next => up.request(url: '/foo', cache: true)
          next => up.request(url: '/foo', cache: true)
          next => expect(jasmine.Ajax.requests.count()).toEqual(2)

        it 'does not limit the number of cache entries if config.cacheSize is undefined'

        it 'never discards old cache entries if config.cacheExpiry is undefined'

        it 'respects a config.cacheSize setting', asyncSpec (next) ->
          up.network.config.cacheSize = 2
          next => up.request(url: '/foo', cache: true)
          next => up.request(url: '/bar', cache: true)
          next => up.request(url: '/baz', cache: true)
          next => up.request(url: '/foo', cache: true)
          next => expect(jasmine.Ajax.requests.count()).toEqual(4)

        it "doesn't reuse responses when asked for the same path, but different selectors", asyncSpec (next) ->
          next => up.request(url: '/path', target: '.a', cache: true)
          next => up.request(url: '/path', target: '.b', cache: true)
          next => expect(jasmine.Ajax.requests.count()).toEqual(2)

        it "doesn't reuse responses when asked for the same path, but different params", asyncSpec (next) ->
          next => up.request(url: '/path', params: { query: 'foo' }, cache: true)
          next => up.request(url: '/path', params: { query: 'bar' }, cache: true)
          next => expect(jasmine.Ajax.requests.count()).toEqual(2)

#        it "reuses a response for an 'html' selector when asked for the same path and any other selector", asyncSpec (next) ->
#          next => up.request(url: '/path', target: 'html', cache: true)
#          next => up.request(url: '/path', target: 'body', cache: true)
#          next => up.request(url: '/path', target: 'p', cache: true)
#          next => up.request(url: '/path', target: '.klass', cache: true)
#          next => expect(jasmine.Ajax.requests.count()).toEqual(1)
#
#        it "reuses a response for a 'body' selector when asked for the same path and any other selector other than 'html'", asyncSpec (next) ->
#          next => up.request(url: '/path', target: 'body', cache: true)
#          next => up.request(url: '/path', target: 'p', cache: true)
#          next => up.request(url: '/path', target: '.klass', cache: true)
#          next => expect(jasmine.Ajax.requests.count()).toEqual(1)
#
#        it "doesn't reuse a response for a 'body' selector when asked for the same path but an 'html' selector", asyncSpec (next) ->
#          next => up.request(url: '/path', target: 'body', cache: true)
#          next => up.request(url: '/path', target: 'html', cache: true)
#          next => expect(jasmine.Ajax.requests.count()).toEqual(2)

        it "doesn't reuse responses for different paths", asyncSpec (next) ->
          next => up.request(url: '/foo', cache: true)
          next => up.request(url: '/bar', cache: true)
          next => expect(jasmine.Ajax.requests.count()).toEqual(2)

        u.each ['GET', 'HEAD', 'OPTIONS'], (safeMethod) ->

          it "caches #{safeMethod} requests", asyncSpec (next) ->
            next => up.request(url: '/foo', method: safeMethod, cache: true)
            next => up.request(url: '/foo', method: safeMethod, cache: true)
            next => expect(jasmine.Ajax.requests.count()).toEqual(1)

          it "does not cache #{safeMethod} requests with { cache: false }", asyncSpec (next) ->
            next => up.request(url: '/foo', method: safeMethod, cache: false)
            next => up.request(url: '/foo', method: safeMethod, cache: false)
            next => expect(jasmine.Ajax.requests.count()).toEqual(2)

        u.each ['POST', 'PUT', 'DELETE'], (unsafeMethod) ->

          it "does not cache #{unsafeMethod} requests, even with { cache: true }", asyncSpec (next) ->
            next => up.request(url: '/foo', method: unsafeMethod, cache: true)
            next => up.request(url: '/foo', method: unsafeMethod, cache: true)
            next => expect(jasmine.Ajax.requests.count()).toEqual(2)

      describe 'cache clearing', ->

        it 'clears the cache when passed { clearCache: true }', asyncSpec (next) ->
          up.request(url: '/foo', cache: true)
          expect(url: '/foo').toBeCached()

          up.request(url: '/bar', clearCache: true)

          next =>
            @respondWith('foo')

          next =>
            expect(url: '/foo').not.toBeCached()
            expect(url: '/bar').not.toBeCached()

        it 'keeps this new request in the cache with { cache: true, clearCache: true }', asyncSpec (next) ->
          up.request(url: '/foo', cache: true)
          expect(url: '/foo').toBeCached()

          up.request(url: '/bar', cache: true, clearCache: true)

          next =>
            @respondWith('foo')

          next =>
            expect(url: '/foo').not.toBeCached()
            expect(url: '/bar').toBeCached()

        it 'accepts an URL pattern as { clearCache } option', asyncSpec (next) ->
          up.request(url: '/foo/1', cache: true)
          up.request(url: '/foo/2', cache: true)
          up.request(url: '/bar/1', cache: true)

          expect(url: '/foo/1').toBeCached()
          expect(url: '/foo/2').toBeCached()
          expect(url: '/bar/1').toBeCached()

          up.request(url: '/other', clearCache: '/foo/*')

          next =>
            expect(jasmine.Ajax.requests.count()).toEqual(4)

            @respondWith
              status: 200
              contentType: 'text/html'
              responseText: 'foo'
              # responseHeaders: { 'X-Up-Clear-Cache': '/foo/*' }

          next ->
            expect(url: '/foo/1').not.toBeCached()
            expect(url: '/foo/2').not.toBeCached()
            expect(url: '/bar/1').toBeCached()

        u.each ['POST', 'PUT', 'DELETE'], (unsafeMethod) ->

          it "clears the entire cache if a #{unsafeMethod} request is made", asyncSpec (next) ->
            safeRequestAttrs = { method: 'GET', url: '/foo', cache: true }
            unsafeRequestAttrs = { method: unsafeMethod, url: '/foo' }

            up.request(safeRequestAttrs)

            next =>
              @respondWith('foo')

            next =>
              expect(safeRequestAttrs).toBeCached()

              up.request(unsafeRequestAttrs)

            next =>
              @respondWith('foo')

            next =>
              expect(safeRequestAttrs).not.toBeCached()

          it "does not clear the cache if a #{unsafeMethod} request is made with { clearCache: false }", asyncSpec (next) ->
            safeRequestAttrs = { method: 'GET', url: '/foo', cache: true }
            unsafeRequestAttrs = { method: unsafeMethod, url: '/foo', clearCache: false }

            up.request(safeRequestAttrs)

            next =>
              @respondWith('false')

            next =>
              expect(safeRequestAttrs).toBeCached()

              up.request(unsafeRequestAttrs)

            next =>
              @respondWith('foo')

            next =>
              expect(safeRequestAttrs).toBeCached()

          it "does not clear the cache the server responds to an #{unsafeMethod} request with X-Up-Clear-Cache: false", asyncSpec (next) ->
            safeRequestAttrs = { method: 'GET', url: '/foo', cache: true }
            unsafeRequestAttrs = { method: unsafeMethod, url: '/foo', cache: true }

            up.request(safeRequestAttrs)

            next =>
              @respondWith('foo')

            next =>
              expect(safeRequestAttrs).toBeCached()

              up.request(unsafeRequestAttrs)

            next =>
              @respondWith('foo', responseHeaders: { 'X-Up-Clear-Cache': 'false' })

            next =>
              expect(safeRequestAttrs).toBeCached()

        it 'does not cache responses with a non-200 status code (even with { cache: true })', asyncSpec (next) ->
          next => up.request(url: '/foo', cache: true)
          next => @respondWith(status: 500, contentType: 'text/html', responseText: 'foo')
          next => up.request(url: '/foo', cache: true)
          next => expect(jasmine.Ajax.requests.count()).toEqual(2)

        it 'clears the cache if the server responds with an X-Up-Clear-Cache: * header', asyncSpec (next) ->
          up.request(url: '/foo', cache: true)
          up.request(url: '/bar', cache: true)
          expect(url: '/foo').toBeCached()
          expect(url: '/bar').toBeCached()

          up.request(url: '/baz')

          next =>
            expect(jasmine.Ajax.requests.count()).toEqual(3)

            @respondWith
              status: 200
              contentType: 'text/html'
              responseText: 'foo'
              responseHeaders: { 'X-Up-Clear-Cache': '*' }

          next ->
            expect(url: '/foo').not.toBeCached()
            expect(url: '/bar').not.toBeCached()

        it 'lets the server send an URL pattern as X-Up-Clear-Cache response header', asyncSpec (next) ->
          up.request(url: '/foo/1', cache: true)
          up.request(url: '/foo/2', cache: true)
          up.request(url: '/bar/1', cache: true)

          expect(url: '/foo/1').toBeCached()
          expect(url: '/foo/2').toBeCached()
          expect(url: '/bar/1').toBeCached()

          up.request(url: '/other')

          next =>
            expect(jasmine.Ajax.requests.count()).toEqual(4)

            @respondWith
              status: 200
              contentType: 'text/html'
              responseText: 'foo'
              responseHeaders: { 'X-Up-Clear-Cache': '/foo/*' }

          next ->
            expect(url: '/foo/1').not.toBeCached()
            expect(url: '/foo/2').not.toBeCached()
            expect(url: '/bar/1').toBeCached()

      describe 'method wrapping', ->

        u.each ['GET', 'POST', 'HEAD', 'OPTIONS'], (method) ->

          it "does not change the method of a #{method} request", asyncSpec (next) ->
            up.request(url: '/foo', method: method)

            next =>
              request = @lastRequest()
              expect(request.method).toEqual(method)
              expect(request.data()['_method']).toBeUndefined()

        u.each ['PUT', 'PATCH', 'DELETE'], (method) ->

          it "turns a #{method} request into a POST request and sends the actual method as a { _method } param to prevent unexpected redirect behavior (https://makandracards.com/makandra/38347)", asyncSpec (next) ->
            up.request(url: '/foo', method: method)

            next =>
              request = @lastRequest()
              expect(request.method).toEqual('POST')
              expect(request.data()['_method']).toEqual([method])

        describe 'with { wrapMethod: false }', ->

          u.each ['GET', 'POST', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'], (method) ->

            it "does not wrap the method of a #{method} request", asyncSpec (next) ->
              up.request(url: '/foo', method: method, wrapMethod: false)

              next =>
                request = @lastRequest()
                expect(request.method).toEqual(method)
                expect(request.data()['_method']).toBeUndefined()

      describe 'with config.concurrency set', ->

        beforeEach ->
          up.network.config.concurrency = 1

        it 'limits the number of concurrent requests', asyncSpec (next) ->
          responses = []
          trackResponse = (response) -> responses.push(response.text)

          up.request(url: '/foo').then(trackResponse)
          up.request(url: '/bar').then(trackResponse)

          next =>
            expect(jasmine.Ajax.requests.count()).toEqual(1) # only one request was made

          next =>
            @respondWith('first response', request: jasmine.Ajax.requests.at(0))

          next =>
            expect(responses).toEqual ['first response']
            expect(jasmine.Ajax.requests.count()).toEqual(2) # a second request was made

          next =>
            @respondWith('second response', request: jasmine.Ajax.requests.at(1))

          next =>
            expect(responses).toEqual ['first response', 'second response']

      describe 'up:request:load event', ->

        it 'emits an up:request:load event before the request touches the network', asyncSpec (next) ->
          listener = jasmine.createSpy('listener')
          up.on 'up:request:load', listener
          up.request('/bar')

          next =>
            expect(jasmine.Ajax.requests.count()).toEqual(1)

            partialRequest = jasmine.objectContaining(
              method: 'GET',
              url: jasmine.stringMatching('/bar')
            )
            partialEvent = jasmine.objectContaining(request: partialRequest)

            expect(listener).toHaveBeenCalledWith(partialEvent, jasmine.anything(), jasmine.anything())

        it 'allows up:request:load listeners to prevent the request (useful to cancel all requests when stopping a test scenario)', (done) ->
          listener = jasmine.createSpy('listener').and.callFake (event) ->
            expect(jasmine.Ajax.requests.count()).toEqual(0)
            event.preventDefault()

          up.on 'up:request:load', listener

          promise = up.request('/bar')

          u.task ->
            expect(listener).toHaveBeenCalled()
            expect(jasmine.Ajax.requests.count()).toEqual(0)

            promiseState(promise).then (result) ->
              expect(result.state).toEqual('rejected')
              expect(result.value).toBeError(/prevented|aborted/i)
              done()

        it 'does not block the queue when an up:request:load event was prevented', (done) ->
          up.network.config.concurrency = 1

          listener = jasmine.createSpy('listener').and.callFake (event) ->
            # only prevent the first request
            if event.request.url.indexOf('/path1') >= 0
              event.preventDefault()

          up.on 'up:request:load', listener

          promise1 = up.request('/path1')
          promise2 = up.request('/path2')

          u.task =>
            expect(listener.calls.count()).toBe(2)
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(@lastRequest().url).toMatchURL('/path2')
            done()

        it 'allows up:request:load listeners to manipulate the request headers', (done) ->
          listener = (event) ->
            event.request.headers['X-From-Listener'] = 'foo'

          up.on 'up:request:load', listener

          up.request('/path1')

          u.task =>
            expect(@lastRequest().requestHeaders['X-From-Listener']).toEqual('foo')
            done()

        it 'allows up:request:load listeners to add request params for a POST request', (done) ->
          listener = (event) ->
            event.request.params.set('key', 'value')

          up.on('up:request:load', listener)

          up.request('/path1', method: 'post')

          u.task =>
            expect(@lastRequest().params).toMatchParams(key: 'value')
            done()

        it 'allows up:request:load listeners to add request params for a GET request, which are moved to the URL before connecting', (done) ->
          listener = (event) ->
            event.request.params.set('key3', 'value3')

          up.on('up:request:load', listener)

          up.request('/path1?key1=value1', params: { key2: 'value2' }, method: 'get')

          u.task =>

            expect(@lastRequest().url).toMatchURL('/path1?key1=value1&key2=value2&key3=value3')
            expect(@lastRequest().params).toMatchParams({})
            done()

      describe 'up:request:late and up:network:recover events', ->

        beforeEach ->
          up.network.config.badResponseTime = 0
          @events = []
          u.each ['up:request:load', 'up:request:loaded', 'up:request:late', 'up:network:recover', 'up:request:fatal', 'up:request:aborted'], (eventType) =>
            up.on eventType, =>
              @events.push eventType

        it 'emits an up:request:late event if the server takes too long to respond'

        it 'does not emit an up:request:late event if preloading', asyncSpec (next) ->
          next =>
            # A request for preloading preloading purposes
            # doesn't make us busy.
            up.request(url: '/foo', preload: true)

          next =>
            expect(@events).toEqual([
              'up:request:load'
            ])

          next =>
            # The same request with preloading does trigger up:request:late.
            up.request(url: '/foo', cache: true)

          next.after 10, =>
            expect(@events).toEqual([
              'up:request:load',
              'up:request:late'
            ])

          next =>
            # The response resolves both promises and makes
            # the proxy idle again.
            jasmine.Ajax.requests.at(0).respondWith
              status: 200
              contentType: 'text/html'
              responseText: 'foo'

          next =>
            expect(@events).toEqual([
              'up:request:load',
              'up:request:late',
              'up:request:loaded',
              'up:network:recover'
            ])

        it 'can delay the up:request:late event to prevent flickering of spinners', asyncSpec (next) ->
          next =>
            up.network.config.badResponseTime = 50
            up.request(url: '/foo')

          next =>
            expect(@events).toEqual([
              'up:request:load'
            ])

          next.after 25, =>
            expect(@events).toEqual([
              'up:request:load'
            ])

          next.after 200, =>
            expect(@events).toEqual([
              'up:request:load',
              'up:request:late'
            ])

          next =>
            @respondWith('foo')

          next =>
            expect(@events).toEqual([
              'up:request:load',
              'up:request:late',
              'up:request:loaded',
              'up:network:recover'
            ])

        it 'does not emit up:network:recover if a delayed up:request:late was never emitted due to a fast response', asyncSpec (next) ->
          next =>
            up.network.config.badResponseTime = 200
            up.request(url: '/foo')

          next =>
            expect(@events).toEqual([
              'up:request:load'
            ])

          next.after 100, =>
            jasmine.Ajax.requests.at(0).respondWith
              status: 200
              contentType: 'text/html'
              responseText: 'foo'

          next.after 250, =>
            expect(@events).toEqual([
              'up:request:load',
              'up:request:loaded'
            ])

        it 'emits up:network:recover if a request returned but failed with an error code', asyncSpec (next) ->
          next =>
            up.request(url: '/foo')

          next =>
            expect(@events).toEqual([
              'up:request:load',
              'up:request:late'
            ])

          next =>
            jasmine.Ajax.requests.at(0).respondWith
              status: 500
              contentType: 'text/html'
              responseText: 'something went wrong'

          next =>
            expect(@events).toEqual([
              'up:request:load',
              'up:request:late',
              'up:request:loaded',
              'up:network:recover'
            ])


        it 'emits up:network:recover if a request timed out', asyncSpec (next) ->
          up.network.config.badResponseTime = 10

          next =>
            up.request(url: '/foo')

          next.after 50, =>
            expect(@events).toEqual([
              'up:request:load',
              'up:request:late'
            ])

          next =>
            jasmine.clock().install() # required by responseTimeout()
            @lastRequest().responseTimeout()

          next =>
            expect(@events).toEqual([
              'up:request:load',
              'up:request:late',
              'up:request:aborted',
              'up:network:recover'
            ])

        it 'emits up:network:recover if a request was aborted', asyncSpec (next) ->
          up.network.config.badResponseTime = 10

          next =>
            @request = up.request(url: '/foo')

          next.after 100, =>
            expect(@events).toEqual([
              'up:request:load',
              'up:request:late'
            ])

          next =>
            up.network.abort(@request)

          next =>
            expect(@events).toEqual([
              'up:request:load',
              'up:request:late',
              'up:request:aborted',
              'up:network:recover'
            ])

        it 'emits up:network:recover if a request failed fatally', asyncSpec (next) ->
          up.network.config.badResponseTime = 10

          next =>
            @request = up.request(url: '/foo')

          next.after 100, =>
            expect(@events).toEqual([
              'up:request:load',
              'up:request:late'
            ])

          next =>
            @lastRequest().responseError()

          next =>
            expect(@events).toEqual([
              'up:request:load',
              'up:request:late',
              'up:request:fatal',
              'up:network:recover'
            ])

    describe 'up.network.preload', ->

      it 'queues a request with attributes suitable for preloading', ->
        request = up.network.preload({ url: '/foo' })
        expect(request.preload).toBe(true)
        expect(request.cache).toBe(true)

      it 'throws an error when trying to preload an unsafe request', ->
        preload = -> up.network.preload({ url: '/foo', method: 'put' })
        expect(preload).toThrowError(/will not preload a PUT request/i)

    if up.migrate.loaded
      describe 'up.ajax', ->

        it 'fulfills to the response text in order to match the $.ajax() API as good as possible', (done) ->
          promise = up.ajax('/url')

          u.task =>
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            @respondWith('response-text')

            promise.then (text) ->
              expect(text).toEqual('response-text')

              done()

            promise.catch (reason) ->
              done.fail(reason)

    describe 'up.cache.get()', ->

      it 'returns an existing cache entry for the given request', ->
        requestAttrs = { url: '/foo', params: { key: 'value' }, cache: true }
        up.request(requestAttrs)
        expect(requestAttrs).toBeCached()

      it 'returns undefined if the given request is not cached', ->
        expect(url: '/foo').not.toBeCached()

    describe 'up.cache.set()', ->

      it 'should have tests'

    describe 'up.cache.alias()', ->

      it 'uses an existing cache entry for another request (used in case of redirects)', ->
        up.request({ url: '/foo', cache: true })
        expect({ url: '/foo' }).toBeCached()
        expect({ url: '/bar' }).not.toBeCached()

        up.cache.alias({ url: '/foo' }, { url: '/bar' })

        expect({ url: '/bar' }).toBeCached()
        expect(up.cache.get({ url: '/bar' })).toBe(up.cache.get({ url: '/foo' }))

    describe 'up.cache.remove()', ->

      it 'removes the cache entry for the given request'

      it 'does nothing if the given request is not cached'

    describe 'up.cache.clear()', ->

      it 'removes all cache entries', ->
        up.request(url: '/foo', cache: true)
        expect(url: '/foo').toBeCached()
        up.cache.clear()
        expect(url: '/foo').not.toBeCached()

      it 'accepts an URL pattern that determines which entries are purged', ->
        up.request(url: '/foo/1', cache: true)
        up.request(url: '/foo/2', cache: true)
        up.request(url: '/bar/1', cache: true)
        expect(url: '/foo/1').toBeCached()
        expect(url: '/foo/2').toBeCached()
        expect(url: '/bar/1').toBeCached()

        up.cache.clear('/foo/*')

        expect(url: '/foo/1').not.toBeCached()
        expect(url: '/foo/2').not.toBeCached()
        expect(url: '/bar/1').toBeCached()
