u = up.util
$ = jQuery

describe 'up.proxy', ->

  beforeEach ->
    # Disable response time measuring for these tests
    up.proxy.config.preloadEnabled = true

  describe 'JavaScript functions', ->

    describe 'up.request', ->

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

      it 'allows to pass in an up.Request instance instead of an options object', ->
        requestArg = new up.Request(url: '/foo', params: { key: 'value' }, method: 'post')
        up.request(requestArg)

        jasmineRequest = @lastRequest()
        expect(jasmineRequest.url).toMatchURL('/foo')
        expect(jasmineRequest.data()).toEqual(key: ['value'])
        expect(jasmineRequest.method).toEqual('POST')

      it 'submits the replacement targets as HTTP headers, so the server may choose to only frender the requested fragments', asyncSpec (next) ->
        up.request(url: '/foo', target: '.target', failTarget: '.fail-target')

        next =>
          request = @lastRequest()
          expect(request.requestHeaders['X-Up-Target']).toEqual('.target')
          expect(request.requestHeaders['X-Up-Fail-Target']).toEqual('.fail-target')

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


        it 'rejects with AbortError when the request was aborted', (done) ->
          request = up.request('/url')

          u.task =>
            up.proxy.abort(request)

            promiseState(request).then (result) ->
              expect(result.state).toEqual('rejected')
              expect(result.value.name).toEqual('AbortError')
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

        it 'considers a redirection URL an alias for the requested URL', asyncSpec (next) ->
          up.request('/foo')

          next =>
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            @respondWith
              responseHeaders:
                'X-Up-Location': '/bar'
                'X-Up-Method': 'GET'

          next =>
            up.request('/bar')

          next =>
            # See that the cached alias is used and no additional requests are made
            expect(jasmine.Ajax.requests.count()).toEqual(1)

        it 'does not considers a redirection URL an alias for the requested URL if the original request was never cached', asyncSpec (next) ->
          up.request('/foo', method: 'post') # POST requests are not cached

          next =>
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            @respondWith
              responseHeaders:
                'X-Up-Location': '/bar'
                'X-Up-Method': 'GET'

          next =>
            up.request('/bar')

          next =>
            # See that an additional request was made
            expect(jasmine.Ajax.requests.count()).toEqual(2)

        it 'does not considers a redirection URL an alias for the requested URL if the response returned a non-200 status code', asyncSpec (next) ->
          up.request('/foo')

          next =>
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            @respondWith
              responseHeaders:
                'X-Up-Location': '/bar'
                'X-Up-Method': 'GET'
              status: 500

          next =>
            up.request('/bar')

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

        it 'considers a redirection URL an alias for the requested URL', asyncSpec (next) ->
          up.request('/foo')

          next =>
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            @respondWith
              responseURL: '/bar'

          next =>
            up.request('/bar')

          next =>
            # See that the cached alias is used and no additional requests are made
            expect(jasmine.Ajax.requests.count()).toEqual(1)

        it 'does not considers a redirection URL an alias for the requested URL if the original request was never cached', asyncSpec (next) ->
          up.request('/foo', method: 'post') # POST requests are not cached

          next =>
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            @respondWith
              responseURL: '/bar'

          next =>
            up.request('/bar')

          next =>
            # See that an additional request was made
            expect(jasmine.Ajax.requests.count()).toEqual(2)

        it 'does not considers a redirection URL an alias for the requested URL if the response returned a non-200 status code', asyncSpec (next) ->
          up.request('/foo')

          next =>
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            @respondWith
              responseURL: '/bar'
              status: 500

          next =>
            up.request('/bar')

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

      describe 'caching of responses', ->

        it 'caches server responses for the configured duration', asyncSpec (next) ->
          up.proxy.config.cacheExpiry = 200 # 1 second for test

          responses = []
          trackResponse = (response) -> responses.push(response.text)

          next =>
            up.request(url: '/foo').then(trackResponse)
            expect(jasmine.Ajax.requests.count()).toEqual(1)

          next.after (10), =>
            # Send the same request for the same path
            up.request(url: '/foo').then(trackResponse)

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
            up.request(url: '/foo').then(trackResponse)

            # See that we have triggered a second request
            expect(jasmine.Ajax.requests.count()).toEqual(2)

          next =>
            @respondWith('bar')

          next =>
            expect(responses).toEqual(['foo', 'foo', 'bar'])

        it "does not cache responses if config.cacheExpiry is 0", asyncSpec (next) ->
          up.proxy.config.cacheExpiry = 0
          next => up.request(url: '/foo')
          next => up.request(url: '/foo')
          next => expect(jasmine.Ajax.requests.count()).toEqual(2)

        it "does not cache responses if config.cacheSize is 0", asyncSpec (next) ->
          up.proxy.config.cacheSize = 0
          next => up.request(url: '/foo')
          next => up.request(url: '/foo')
          next => expect(jasmine.Ajax.requests.count()).toEqual(2)

        it 'does not limit the number of cache entries if config.cacheSize is undefined'

        it 'never discards old cache entries if config.cacheExpiry is undefined'

        it 'respects a config.cacheSize setting', asyncSpec (next) ->
          up.proxy.config.cacheSize = 2
          next => up.request(url: '/foo')
          next => up.request(url: '/bar')
          next => up.request(url: '/baz')
          next => up.request(url: '/foo')
          next => expect(jasmine.Ajax.requests.count()).toEqual(4)

        it "doesn't reuse responses when asked for the same path, but different selectors", asyncSpec (next) ->
          next => up.request(url: '/path', target: '.a')
          next => up.request(url: '/path', target: '.b')
          next => expect(jasmine.Ajax.requests.count()).toEqual(2)

        it "doesn't reuse responses when asked for the same path, but different params", asyncSpec (next) ->
          next => up.request(url: '/path', params: { query: 'foo' })
          next => up.request(url: '/path', params: { query: 'bar' })
          next => expect(jasmine.Ajax.requests.count()).toEqual(2)

        it "reuses a response for an 'html' selector when asked for the same path and any other selector", asyncSpec (next) ->
          next => up.request(url: '/path', target: 'html')
          next => up.request(url: '/path', target: 'body')
          next => up.request(url: '/path', target: 'p')
          next => up.request(url: '/path', target: '.klass')
          next => expect(jasmine.Ajax.requests.count()).toEqual(1)

        it "reuses a response for a 'body' selector when asked for the same path and any other selector other than 'html'", asyncSpec (next) ->
          next => up.request(url: '/path', target: 'body')
          next => up.request(url: '/path', target: 'p')
          next => up.request(url: '/path', target: '.klass')
          next => expect(jasmine.Ajax.requests.count()).toEqual(1)

        it "doesn't reuse a response for a 'body' selector when asked for the same path but an 'html' selector", asyncSpec (next) ->
          next => up.request(url: '/path', target: 'body')
          next => up.request(url: '/path', target: 'html')
          next => expect(jasmine.Ajax.requests.count()).toEqual(2)

        it "doesn't reuse responses for different paths", asyncSpec (next) ->
          next => up.request(url: '/foo')
          next => up.request(url: '/bar')
          next => expect(jasmine.Ajax.requests.count()).toEqual(2)

        u.each ['GET', 'HEAD', 'OPTIONS'], (method) ->

          it "caches #{method} requests", asyncSpec (next) ->
            next => up.request(url: '/foo', method: method)
            next => up.request(url: '/foo', method: method)
            next => expect(jasmine.Ajax.requests.count()).toEqual(1)

          it "does not cache #{method} requests with { cache: false }", asyncSpec (next) ->
            next => up.request(url: '/foo', method: method, cache: false)
            next => up.request(url: '/foo', method: method, cache: false)
            next => expect(jasmine.Ajax.requests.count()).toEqual(2)

        u.each ['POST', 'PUT', 'DELETE'], (method) ->

          it "does not cache #{method} requests", asyncSpec (next) ->
            next => up.request(url: '/foo', method: method)
            next => up.request(url: '/foo', method: method)
            next => expect(jasmine.Ajax.requests.count()).toEqual(2)

        it 'does not cache responses with a non-200 status code', asyncSpec (next) ->
          next => up.request(url: '/foo')
          next => @respondWith(status: 500, contentType: 'text/html', responseText: 'foo')
          next => up.request(url: '/foo')
          next => expect(jasmine.Ajax.requests.count()).toEqual(2)

      describe 'with config.wrapMethods set', ->

        it 'should be set by default', ->
          expect(up.proxy.config.wrapMethods).toBePresent()

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
#              expect(request.data()['foo']).toEqual('bar')

      describe 'with config.concurrency set', ->

        beforeEach ->
          up.proxy.config.concurrency = 1

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

        it 'ignores preloading for the request limit', asyncSpec (next) ->
          next => up.request(url: '/foo', preload: true)
          next => up.request(url: '/bar')
          next => expect(jasmine.Ajax.requests.count()).toEqual(2)
          next => up.request(url: '/bar')
          next => expect(jasmine.Ajax.requests.count()).toEqual(2)

      describe 'up:proxy:load event', ->

        it 'emits an up:proxy:load event before the request touches the network', asyncSpec (next) ->
          listener = jasmine.createSpy('listener')
          up.on 'up:proxy:load', listener
          up.request('/bar')

          next =>
            expect(jasmine.Ajax.requests.count()).toEqual(1)

            partialRequest = jasmine.objectContaining(
              method: 'GET',
              url: jasmine.stringMatching('/bar')
            )
            partialEvent = jasmine.objectContaining(request: partialRequest)

            expect(listener).toHaveBeenCalledWith(partialEvent, jasmine.anything(), jasmine.anything())

        it 'allows up:proxy:load listeners to prevent the request (useful to cancel all requests when stopping a test scenario)', (done) ->
          listener = jasmine.createSpy('listener').and.callFake (event) ->
            expect(jasmine.Ajax.requests.count()).toEqual(0)
            event.preventDefault()

          up.on 'up:proxy:load', listener

          promise = up.request('/bar')

          u.task ->
            expect(listener).toHaveBeenCalled()
            expect(jasmine.Ajax.requests.count()).toEqual(0)

            promiseState(promise).then (result) ->
              expect(result.state).toEqual('rejected')
              expect(result.value).toBeError(/prevented|aborted/i)
              done()

        it 'does not block the queue when an up:proxy:load event was prevented', (done) ->
          up.proxy.config.concurrency = 1

          listener = jasmine.createSpy('listener').and.callFake (event) ->
            # only prevent the first request
            if event.request.url.indexOf('/path1') >= 0
              event.preventDefault()

          up.on 'up:proxy:load', listener

          promise1 = up.request('/path1')
          promise2 = up.request('/path2')

          u.task =>
            expect(listener.calls.count()).toBe(2)
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(@lastRequest().url).toMatchURL('/path2')
            done()

        it 'allows up:proxy:load listeners to manipulate the request headers', (done) ->
          listener = (event) ->
            event.request.headers['X-From-Listener'] = 'foo'

          up.on 'up:proxy:load', listener

          up.request('/path1')

          u.task =>
            expect(@lastRequest().requestHeaders['X-From-Listener']).toEqual('foo')
            done()

        it 'allows up:proxy:load listeners to add request params for a POST request', (done) ->
          listener = (event) ->
            event.request.params.set('key', 'value')

          up.on('up:proxy:load', listener)

          up.request('/path1', method: 'post')

          u.task =>
            expect(@lastRequest().params).toMatchParams(key: 'value')
            done()

        it 'allows up:proxy:load listeners to add request params for a GET request, which are moved to the URL before connecting', (done) ->
          listener = (event) ->
            event.request.params.set('key3', 'value3')

          up.on('up:proxy:load', listener)

          up.request('/path1?key1=value1', params: { key2: 'value2' }, method: 'get')

          u.task =>

            expect(@lastRequest().url).toMatchURL('/path1?key1=value1&key2=value2&key3=value3')
            expect(@lastRequest().params).toMatchParams({})
            done()

      describe 'up:proxy:slow and up:proxy:recover events', ->

        beforeEach ->
          up.proxy.config.slowDelay = 0
          @events = []
          u.each ['up:proxy:load', 'up:proxy:loaded', 'up:proxy:slow', 'up:proxy:recover', 'up:proxy:fatal', 'up:proxy:aborted'], (eventType) =>
            up.on eventType, =>
              @events.push eventType

        it 'emits an up:proxy:slow event if the server takes too long to respond'

        it 'does not emit an up:proxy:slow event if preloading', asyncSpec (next) ->
          next =>
            # A request for preloading preloading purposes
            # doesn't make us busy.
            up.request(url: '/foo', preload: true)

          next =>
            expect(@events).toEqual([
              'up:proxy:load'
            ])
            expect(up.proxy.isBusy()).toBe(false)

          next =>
            # The same request with preloading does trigger up:proxy:slow.
            up.request(url: '/foo')

          next.after 10, =>
            expect(@events).toEqual([
              'up:proxy:load',
              'up:proxy:slow'
            ])
            expect(up.proxy.isBusy()).toBe(true)

          next =>
            # The response resolves both promises and makes
            # the proxy idle again.
            jasmine.Ajax.requests.at(0).respondWith
              status: 200
              contentType: 'text/html'
              responseText: 'foo'

          next =>
            expect(@events).toEqual([
              'up:proxy:load',
              'up:proxy:slow',
              'up:proxy:loaded',
              'up:proxy:recover'
            ])
            expect(up.proxy.isBusy()).toBe(false)

        it 'can delay the up:proxy:slow event to prevent flickering of spinners', asyncSpec (next) ->
          next =>
            up.proxy.config.slowDelay = 50
            up.request(url: '/foo')

          next =>
            expect(@events).toEqual([
              'up:proxy:load'
            ])

          next.after 25, =>
            expect(@events).toEqual([
              'up:proxy:load'
            ])

          next.after 200, =>
            expect(@events).toEqual([
              'up:proxy:load',
              'up:proxy:slow'
            ])

          next =>
            @respondWith('foo')

          next =>
            expect(@events).toEqual([
              'up:proxy:load',
              'up:proxy:slow',
              'up:proxy:loaded',
              'up:proxy:recover'
            ])

        it 'does not emit up:proxy:recover if a delayed up:proxy:slow was never emitted due to a fast response', asyncSpec (next) ->
          next =>
            up.proxy.config.slowDelay = 200
            up.request(url: '/foo')

          next =>
            expect(@events).toEqual([
              'up:proxy:load'
            ])

          next.after 100, =>
            jasmine.Ajax.requests.at(0).respondWith
              status: 200
              contentType: 'text/html'
              responseText: 'foo'

          next.after 250, =>
            expect(@events).toEqual([
              'up:proxy:load',
              'up:proxy:loaded'
            ])

        it 'emits up:proxy:recover if a request returned but failed with an error code', asyncSpec (next) ->
          next =>
            up.request(url: '/foo')

          next =>
            expect(@events).toEqual([
              'up:proxy:load',
              'up:proxy:slow'
            ])

          next =>
            jasmine.Ajax.requests.at(0).respondWith
              status: 500
              contentType: 'text/html'
              responseText: 'something went wrong'

          next =>
            expect(@events).toEqual([
              'up:proxy:load',
              'up:proxy:slow',
              'up:proxy:loaded',
              'up:proxy:recover'
            ])


        it 'emits up:proxy:recover if a request timed out', asyncSpec (next) ->
          up.proxy.config.slowDelay = 10

          next =>
            up.request(url: '/foo')

          next.after 50, =>
            expect(@events).toEqual([
              'up:proxy:load',
              'up:proxy:slow'
            ])

          next =>
            jasmine.clock().install() # required by responseTimeout()
            @lastRequest().responseTimeout()

          next =>
            expect(@events).toEqual([
              'up:proxy:load',
              'up:proxy:slow',
              'up:proxy:aborted',
              'up:proxy:recover'
            ])

        it 'emits up:proxy:recover if a request was aborted', asyncSpec (next) ->
          up.proxy.config.slowDelay = 10

          next =>
            @request = up.request(url: '/foo')

          next.after 100, =>
            expect(@events).toEqual([
              'up:proxy:load',
              'up:proxy:slow'
            ])

          next =>
            up.proxy.abort(@request)

          next =>
            expect(@events).toEqual([
              'up:proxy:load',
              'up:proxy:slow',
              'up:proxy:aborted',
              'up:proxy:recover'
            ])

        it 'emits up:proxy:recover if a request failed fatally', asyncSpec (next) ->
          up.proxy.config.slowDelay = 10

          next =>
            @request = up.request(url: '/foo')

          next.after 100, =>
            expect(@events).toEqual([
              'up:proxy:load',
              'up:proxy:slow'
            ])

          next =>
            @lastRequest().responseError()

          next =>
            expect(@events).toEqual([
              'up:proxy:load',
              'up:proxy:slow',
              'up:proxy:fatal',
              'up:proxy:recover'
            ])

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

      describeFallback 'canPushState', ->

        it "does nothing", asyncSpec (next) ->
          $fixture('.target')
          $link = $fixture('a[href="/path"][up-target=".target"]')
          up.proxy.preload($link)
          next =>
            expect(jasmine.Ajax.requests.count()).toBe(0)

    describe 'up.proxy.cache.get()', ->

      it 'returns an existing cache entry for the given request', ->
        promise1 = up.request(url: '/foo', params: { key: 'value' })
        promise2 = up.proxy.cache.get(url: '/foo', params: { key: 'value' })
        expect(promise1).toBe(promise2)

      it 'returns undefined if the given request is not cached', ->
        promise = up.proxy.cache.get(url: '/foo', params: { key: 'value' })
        expect(promise).toBeUndefined()

      describeCapability 'canInspectFormData', ->

        it "returns undefined if the given request's { params } is a FormData object", ->
          promise = up.proxy.cache.get(url: '/foo', params: new FormData())
          expect(promise).toBeUndefined()

    describe 'up.proxy.cache.set()', ->

      it 'should have tests'

    describe 'up.proxy.cache.alias()', ->

      it 'uses an existing cache entry for another request (used in case of redirects)'

    describe 'up.proxy.cache.remove()', ->

      it 'removes the cache entry for the given request'

      it 'does nothing if the given request is not cached'

      describeCapability 'canInspectFormData', ->

        it 'does not crash when passed a request with FormData (bugfix)', ->
          removal = -> up.proxy.cache.remove(url: '/path', params: new FormData())
          expect(removal).not.toThrowError()

    describe 'up.proxy.clear', ->

      it 'removes all cache entries'
