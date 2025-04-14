const u = up.util
const $ = jQuery

describe('up.network', function() {

  describe('JavaScript functions', function() {

    describe('up.request()', function() {

      it('makes a request with the given URL and params', function(done) {
        up.request('/foo', { params: { key: 'value' }, method: 'post' })
        queueMicrotask(function() {
          const request = jasmine.lastRequest()
          expect(request.url).toMatchURL('/foo')
          expect(request.data()).toEqual({ key: ['value'] })
          expect(request.method).toEqual('POST')
          done()
        })
      })

      it('also allows to pass the URL as a { url } option instead', function(done) {
        up.request({ url: '/foo', params: { key: 'value' }, method: 'post' })
        queueMicrotask(function() {
          const request = jasmine.lastRequest()
          expect(request.url).toMatchURL('/foo')
          expect(request.data()).toEqual({ key: ['value'] })
          expect(request.method).toEqual('POST')
          done()
        })
      })

      it('resolves to a Response object that contains information about the response and request', function(done) {
        const promise = up.request({
          url: '/url',
          params: { key: 'value' },
          method: 'post',
          target: '.target'
        })

        u.task(() => {
          jasmine.respondWith({
            status: 201,
            responseText: 'response-text'
          })

          promise.then(function(response) {
            expect(response.request.url).toMatchURL('/url')
            expect(response.request.params).toEqual(new up.Params({ key: 'value' }))
            expect(response.request.method).toEqual('POST')
            expect(response.request.target).toEqual('.target')
            expect(response.request.hash).toBeBlank()

            expect(response.url).toMatchURL('/url') // If the server signaled a redirect with X-Up-Location, this would be reflected here
            expect(response.method).toEqual('POST') // If the server sent a X-Up-Method header, this would be reflected here
            expect(response.text).toEqual('response-text')
            expect(response.status).toEqual(201)
            expect(response.xhr).toBePresent()

            done()
          })
        })
      })

      it('resolves to a Response that contains the response headers', function(done) {
        const promise = up.request({ url: '/url' })

        u.task(() => {
          jasmine.respondWith({
            responseHeaders: { 'foo': 'bar', 'baz': 'bam' },
            responseText: 'hello'
          })
        })

        promise.then(function(response) {
          expect(response.header('foo')).toEqual('bar')

          // Lookup is case-insensitive
          expect(response.header('BAZ')).toEqual('bam')

          done()
        })
      })

      it("preserves the URL hash in a separate { hash } property, since although it isn't sent to server, code might need it to process the response", function(done) {
        const promise = up.request('/url#hash')

        u.task(() => {
          const request = jasmine.lastRequest()
          expect(request.url).toMatchURL('/url')

          jasmine.respondWith('response-text')

          promise.then(function(response) {
            expect(response.request.url).toMatchURL('/url')
            expect(response.request.hash).toEqual('#hash')
            expect(response.url).toMatchURL('/url')
            done()
          })
        })
      })

      it('does not send a X-Requested-With header that a server-side framework might use to detect AJAX requests and be "smart" about its response', function(done) {
        up.request('/url')

        u.task(() => {
          const headers = jasmine.lastRequest().requestHeaders
          expect(headers['X-Requested-With']).toBeMissing()
          done()
        })
      })

      it('does not touch the network if a request is scheduled and aborted within the same microtask', async function() {
        let request = up.request('/url')
        up.network.abort()

        await expectAsync(request).toBeRejectedWith(jasmine.any(up.Aborted))
        expect(jasmine.Ajax.requests.count()).toBe(0)
      })

      describe('transfer of meta attributes', function() {

        it("sends Unpoly's version as an X-Up-Version request header", async function() {
          up.request({ url: '/foo' })

          await wait()

          const versionHeader = jasmine.lastRequest().requestHeaders['X-Up-Version']
          expect(versionHeader).toBePresent()
          expect(versionHeader).toEqual(up.version)
        })

        it('submits information about the fragment update as HTTP headers, so the server may choose to optimize its responses', async function() {
          makeLayers([
            { mode: 'root', context: { rootKey: 'rootValue' } },
            { mode: 'modal', context: { modalKey: 'modalValue' } },
            { mode: 'drawer', context: { drawerKey: 'drawerValue' } }
          ])

          up.request({
            url: '/foo',
            target: '.target',
            layer: 0,
            failTarget: '.fail-target',
            failLayer: 1,
            origin: up.layer.front.element,
          })

          await wait()

          const request = jasmine.lastRequest()
          expect(request.requestHeaders['X-Up-Target']).toEqual('.target')
          expect(request.requestHeaders['X-Up-Mode']).toEqual('root')
          expect(request.requestHeaders['X-Up-Fail-Target']).toEqual('.fail-target')
          expect(request.requestHeaders['X-Up-Fail-Mode']).toEqual('modal')
          expect(request.requestHeaders['X-Up-Origin-Mode']).toEqual('drawer')
        })

        it('does not transmit missing meta attributes as X-Up-prefixed headers', function(done) {
          const request = up.request('/foo')
          u.task(() => {
            expect('X-Up-Target' in jasmine.lastRequest().requestHeaders).toBe(false)
            expect('X-Up-Mode' in jasmine.lastRequest().requestHeaders).toBe(false)
            done()
          })
        })

      })

      describe('setting meta attributes', function() {

        it('allows to quickly construct a cacheable up.Request by passing { layer, failLayer } options', function() {
          makeLayers([
            { mode: 'root', context: { rootKey: 'rootValue' } },
            { mode: 'drawer', context: { drawerKey: 'drawerValue' } }
          ])

          const request = up.request({ url: '/foo', layer: 'root', failLayer: 'front' })
          expect(request.mode).toEqual('root')
          expect(request.failMode).toEqual('drawer')
          expect(request.context).toEqual({ rootKey: 'rootValue' })
          expect(request.failContext).toEqual({ drawerKey: 'drawerValue' })
        })

        it('does not associate the request with the current layer if no { target, origin, layer } options are given', function() {
          const request = up.request({ url: '/foo' })
          expect(request.layer).toBeUndefined()
          expect(request.mode).toBeUndefined()
          expect(request.failLayer).toBeUndefined()
          expect(request.context).toBeUndefined()
          expect(request.failContext).toBeUndefined()
        })

        it('allows to quickly construct a cacheable up.Request by passing an { origin } option', function() {
          makeLayers([
            { mode: 'root', context: { rootKey: 'rootValue' } },
            { mode: 'drawer', context: { drawerKey: 'drawerValue' } }
          ])

          const request = up.request({ url: '/foo', origin: up.layer.front.element, failLayer: 'root' })
          expect(request.layer).toEqual(up.layer.current)
          expect(request.mode).toEqual('drawer')
          expect(request.context).toEqual({ drawerKey: 'drawerValue' })
          expect(request.failLayer).toEqual(up.layer.root)
          expect(request.failMode).toEqual('root')
          expect(request.failContext).toEqual({ rootKey: 'rootValue' })
        })

        it('remembers the { originLayer } when targeting another layer', function() {
          makeLayers([
            { mode: 'root', context: { rootKey: 'rootValue' } },
            { mode: 'modal', context: { modalKey: 'modalValue' } },
            { mode: 'drawer', context: { drawerKey: 'drawerValue' } }
          ])

          const request = up.request({ url: '/foo', origin: up.layer.front.element, layer: 0, failLayer: 1 })

          expect(request.layer).toEqual(up.layer.root)
          expect(request.mode).toEqual('root')
          expect(request.context).toEqual({ rootKey: 'rootValue' })

          expect(request.failLayer).toEqual(up.layer.get(1))
          expect(request.failMode).toEqual('modal')
          expect(request.failContext).toEqual({ modalKey: 'modalValue' })

          expect(request.originLayer).toEqual(up.layer.current)
          expect(request.originMode).toEqual('drawer')
        })

        it('assumes no layer if neither { layer, failLayer, origin } are given', function() {
          makeLayers([
            { mode: 'root', context: { rootKey: 'rootValue' } },
            { mode: 'drawer', context: { drawerKey: 'drawerValue' } }
          ])

          const request = up.request({ url: '/foo' })
          expect(request.layer).toBeUndefined()
          expect(request.mode).toBeUndefined()
          expect(request.context).toBeUndefined()
          expect(request.failLayer).toBeUndefined()
          expect(request.failMode).toBeUndefined()
          expect(request.failContext).toBeUndefined()
        })

      })

      describe('error handling', function() {

        it('rejects with up.Offline when there was a network error', async function() {
          const request = up.request('/url')

          await wait()

          jasmine.lastRequest().responseError()

          await expectAsync(request).toBeRejectedWith(jasmine.anyError('up.Offline', /Network error/i))
        })

        it('rejects with a non-ok up.Response when the server sends a 404 status code', async function() {
          const request = up.request('/url')

          await wait()

          jasmine.respondWith('text', { status: 404 })

          await expectAsync(request).toBeRejectedWith(jasmine.any(up.Response))
          await expectAsync(request).toBeRejectedWith(jasmine.objectContaining({ status: 404, ok: false }))
        })

        it('rejects with a non-ok up.Response when the server sends a 500 status code', async function() {
          const request = up.request('/url')

          await wait()

          jasmine.respondWith('text', { status: 500 })

          await expectAsync(request).toBeRejectedWith(jasmine.any(up.Response))
          await expectAsync(request).toBeRejectedWith(jasmine.objectContaining({ status: 500, ok: false }))
        })

        describe('with { timeout } option', function() {

          it('rejects with up.Offline when the request times out', async function() {
            const request = up.request('/url')

            await wait()

            jasmine.clock().install() // required by responseTimeout()
            jasmine.lastRequest().responseTimeout()

            await expectAsync(request).toBeRejectedWith(jasmine.anyError('up.Offline', /time ?out/i))
          })

          it('uses a default timeout from up.network.config.timeout', function() {
            up.network.config.timeout = 456789
            const request = up.request('/url')
            expect(request.timeout).toBe(456789)
          })

        })

      })

      describe('when the server responds with an X-Up-Method header', function() {

        it('updates the { method } property in the response object', function(done) {
          const promise = up.request({
            url: '/url',
            params: { key: 'value' },
            method: 'post',
            target: '.target'
          })

          u.task(() => {
            jasmine.respondWith({
              responseHeaders: {
                'X-Up-Location': '/redirect',
                'X-Up-Method': 'GET'
              }
            })

            promise.then(function(response) {
              expect(response.request.url).toMatchURL('/url')
              expect(response.request.method).toEqual('POST')
              expect(response.url).toMatchURL('/redirect')
              expect(response.method).toEqual('GET')
              done()
            })
          })
        })

      })

      describe('when the server responds with an X-Up-Location header', function() {

        it('sets the { url } property on the response object', function(done) {
          const promise = up.request('/request-url#request-hash')

          u.task(() => {
            jasmine.respondWith({
              responseHeaders: {
                'X-Up-Location': '/response-url'
              }
            })

            promise.then(function(response) {
              expect(response.request.url).toMatchURL('/request-url')
              expect(response.request.hash).toEqual('#request-hash')
              expect(response.url).toMatchURL('/response-url')
              done()
            })
          })
        })

        describe('when caching', function() {

          it('considers a redirection URL an alias for the requested URL', async function() {
            up.request('/foo', { cache: true })

            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            jasmine.respondWith({
              responseHeaders: {
                'X-Up-Location': '/bar',
                'X-Up-Method': 'GET'
              }
            })

            await wait()

            up.request('/bar', { cache: true })

            await wait()

            // See that the cached alias is used and no additional requests are made
            expect(jasmine.Ajax.requests.count()).toEqual(1)

            up.request('/foo', { cache: true })

            await wait()

            // See that the original URL is also cached
            expect(jasmine.Ajax.requests.count()).toEqual(1)
          })

          it('does not duplicate cache entries when the server redirects to a cached path, but uses a fully qualified URL', async function() {
            up.request('/foo', { cache: true })

            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            jasmine.respondWith({
              responseHeaders: {
                'X-Up-Location': `http://${location.host}/foo`,
                'X-Up-Method': 'GET'
              }
            })

            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect(up.cache.currentSize).toBe(1)
          })

          it('does not considers a redirection URL an alias for the requested URL if the original request was never cached', async function() {
            up.request('/foo', { cache: false }) // POST requests are not cached

            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            jasmine.respondWith({
              responseHeaders: {
                'X-Up-Location': '/bar',
                'X-Up-Method': 'GET'
              }
            })

            await wait()

            up.request('/bar', { cache: true })

            await wait()

            // See that an additional request was made
            expect(jasmine.Ajax.requests.count()).toEqual(2)
          })

          it('does not considers a redirection URL an alias for the requested URL if the response returned a non-200 status code', async function() {
            up.request('/foo', { cache: true })

            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            jasmine.respondWith({
              responseHeaders: {
                'X-Up-Location': '/bar',
                'X-Up-Method': 'GET'
              },
              status: 500
            })

            await wait()

            up.request('/bar', { cache: true })

            await wait()

            // See that an additional request was made
            expect(jasmine.Ajax.requests.count()).toEqual(2)
          })

          if (FormData.prototype.entries) {

            it("does not explode if the original request's { params } is a FormData object", async function() {
              up.request('/foo', { method: 'post', params: new FormData() }) // POST requests are not cached

              await wait()

              expect(jasmine.Ajax.requests.count()).toEqual(1)
              jasmine.respondWith({
                responseHeaders: {
                  'X-Up-Location': '/bar',
                  'X-Up-Method': 'GET'
                }
              })

              await wait()

              this.secondAjaxPromise = up.request('/bar')

              let result = await promiseState(this.secondAjaxPromise)
              // See that the promise was not rejected due to an internal error.
              expect(result.state).toEqual('pending')
            })
          }

        })

      })

      // All browsers except IE11 make the response URL available through `xhr.responseURL`.
      describe('when the XHR object has a { responseURL } property', function() {

        it('sets the { url } property on the response object', function(done) {
          const promise = up.request('/request-url#request-hash')

          u.task(() => {
            jasmine.respondWith({
              responseURL: '/response-url'
            })

            promise.then(function(response) {
              expect(response.request.url).toMatchURL('/request-url')
              expect(response.request.hash).toEqual('#request-hash')
              expect(response.url).toMatchURL('/response-url')
              done()
            })
          })
        })

        it("assumes a response method of GET if the { reponseURL } is not the request URL", function(done) {
          const promise = up.request('/request-url', { method: 'post' })

          u.task(() => {
            jasmine.respondWith({
              responseURL: '/response-url'
            })

            promise.then(function(response) {
              expect(response.url).toMatchURL('/response-url')
              expect(response.method).toEqual('GET')
              done()
            })
          })
        })

        it("assumes the method did not change if if the { reponseURL } equals the request's URL", function(done) {
          const promise = up.request('/request-url', { method: 'post' })

          u.task(() => {
            jasmine.respondWith({
              responseURL: '/request-url'
            })

            promise.then(function(response) {
              expect(response.url).toMatchURL('/request-url')
              expect(response.method).toEqual('POST')
              done()
            })
          })
        })

        it("sets the { method } to an X-Up-Method header, even if if the { reponseURL } equals the request's URL", function(done) {
          const promise = up.request('/request-url', { method: 'post' })

          u.task(() => {
            jasmine.respondWith({
              responseURL: '/request-url',
              responseHeaders: { 'X-Up-Method': 'GET' }
            })

            promise.then(function(response) {
              expect(response.url).toMatchURL('/request-url')
              expect(response.method).toEqual('GET')
              done()
            })
          })
        })

        describe('when caching', function() {

          it('considers a redirection URL an alias for the requested URL', async function() {
            up.request('/foo', { cache: true })

            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            jasmine.respondWith({ responseURL: '/bar' })

            await wait()

            up.request('/bar', { cache: true })

            await wait()

            // See that the cached alias is used and no additional requests are made
            expect(jasmine.Ajax.requests.count()).toEqual(1)
          })

          it('does not consider a redirection URL an alias for the requested URL if the original request was never cached', async function() {
            up.request('/foo', { cache: false })

            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            jasmine.respondWith({
              responseURL: '/bar'
            })

            await wait()

            up.request('/bar', { cache: true })

            await wait()

            // See that an additional request was made
            expect(jasmine.Ajax.requests.count()).toEqual(2)
          })

          it('does not consider a redirection URL an alias for the requested URL if the response returned a non-200 status code', async function() {
            up.request('/foo', { cache: true })

            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            jasmine.respondWith({
              responseURL: '/bar',
              status: 500
            })

            await wait()

            up.request('/bar', { cache: true })

            await wait()

            // See that an additional request was made
            expect(jasmine.Ajax.requests.count()).toEqual(2)
          })

          describe('eviction of expensive properties to prevent memory leaks when caching', function() {

            it('does not keep element references in the up.Request object', async function() {
              let request = up.request('/foo', { cache: true, layer: 'current', target: 'body', origin: document.body })

              await wait()

              jasmine.respondWith('response text')

              await wait()

              // Eviction is delayed by 1 task so event listeners can still observe the properties we're about to evict

              await wait()

              expect(request).not.toHaveRecursiveValue(u.isElement)
            })

            it('does not keep element references in the up.Response object', async function() {
              let request = up.request('/foo', { cache: true, layer: 'current', target: 'body', origin: document.body })

              await wait()

              jasmine.respondWith('response text')
              let response = await request

              await wait()

              // Eviction is delayed by 1 task so event listeners can still observe the properties we're about to evict

              expect(request).not.toHaveRecursiveValue(u.isElement)
            })

          })

        })

      })

      describe('CSRF', function() {

        beforeEach(function() {
          up.protocol.config.csrfHeader = 'csrf-header'
          up.protocol.config.csrfToken = 'csrf-token'
        })

        it('sets a CSRF token in the header', async function() {
          up.request('/path', { method: 'post' })

          await wait()

          const headers = jasmine.lastRequest().requestHeaders
          expect(headers['csrf-header']).toEqual('csrf-token')
        })

        it('does not add a CSRF token if there is none', async function() {
          up.protocol.config.csrfToken = ''
          up.request('/path', { method: 'post' })

          await wait()

          const headers = jasmine.lastRequest().requestHeaders
          expect(headers['csrf-header']).toBeMissing()
        })

        it('does not add a CSRF token for GET requests', async function() {
          up.request('/path', { method: 'get' })

          await wait()

          const headers = jasmine.lastRequest().requestHeaders
          expect(headers['csrf-header']).toBeMissing()
        })

        it('does not add a CSRF token when loading content from another domain', async function() {
          up.request('http://other-domain.tld/path', { method: 'post' })

          await wait()

          const headers = jasmine.lastRequest().requestHeaders
          expect(headers['csrf-header']).toBeMissing()
        })

      })

      describe('with { params } option', function() {

        it("uses the given params as a non-GET request's payload", async function() {
          const givenParams = { 'foo-key': 'foo-value', 'bar-key': 'bar-value' }
          up.request({ url: '/path', method: 'put', params: givenParams })

          await wait()

          expect(jasmine.lastRequest().data()['foo-key']).toEqual(['foo-value'])
          expect(jasmine.lastRequest().data()['bar-key']).toEqual(['bar-value'])
        })

        it("encodes the given params into the URL of a GET request", function(done) {
          const givenParams = { 'foo-key': 'foo-value', 'bar-key': 'bar-value' }
          const promise = up.request({ url: '/path', method: 'get', params: givenParams })

          u.task(() => {
            expect(jasmine.lastRequest().url).toMatchURL('/path?foo-key=foo-value&bar-key=bar-value')
            expect(jasmine.lastRequest().data()).toBeBlank()

            jasmine.respondWith('response-text')

            promise.then(function(response) {
              // See that the response object has been updated by moving the data options
              // to the URL. This is important for up.fragment code that works on response.request.
              expect(response.request.url).toMatchURL('/path?foo-key=foo-value&bar-key=bar-value')
              expect(response.request.params).toBeBlank()
              done()
            })
          })
        })
      })

      describe('with { cache } option', function() {

        it('caches server responses for the configured duration', async function() {
          up.network.config.cacheEvictAge = 200 // 1 second for test

          const responses = []
          const trackResponse = function(response) {
            responses.push(response.text)
          }

          up.request({ url: '/foo', cache: true }).then(trackResponse)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)

          await wait(10)

          // Send the same request for the same path
          up.request({ url: '/foo', cache: true }).then(trackResponse)

          await wait()

          // See that only a single network request was triggered
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(responses).toEqual([])

          jasmine.respondWith('foo')

          await wait()

          // See that both requests have been fulfilled
          expect(responses).toEqual(['foo', 'foo'])

          // next.after((200), () => {
          //   // Send another request after another 3 minutes
          //   // The clock is now a total of 6 minutes after the first request,
          //   // exceeding the cache's retention time of 5 minutes.
          //   up.request({url: '/foo', cache: true}).then(trackResponse)
          // })
          //
          // next(() => {
          //   // See that we have triggered a second request
          //   expect(jasmine.Ajax.requests.count()).toEqual(2)
          // })
          //
          // next(() => {
          //   jasmine.respondWith('bar')
          // })
          //
          // next(() => {
          //   expect(responses).toEqual(['foo', 'foo', 'bar'])
          // })
        })

        it('tracks an existing request that is still pending', async function() {
          let request0 = up.request({ url: '/path', cache: true })
          await wait()

          let request1 = up.request({ url: '/path', cache: true })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          jasmine.respondWith({ status: 200, responseText: 'ok' })

          await expectAsync(request0).toBeResolvedTo(jasmine.any(up.Response))
          await expectAsync(request1).toBeResolvedTo(jasmine.any(up.Response))
        })

        describe('when the server responds with an error status code', function() {

          it('does not cache the response', async function() {
            up.request({ url: '/foo', cache: true })

            await wait()

            jasmine.respondWith({ status: 500, responseText: 'foo' })

            await wait()

            expect({ url: '/foo' }).not.toBeCached()
          })

          it('evicts an earlier cache entry with a successful response (as we now know a better state, even if that state is an error page, and the next request should retry)', async function() {
            // populateCache() uses up.request({ cache: true }) internally
            await jasmine.populateCache({ url: '/path' }, { status: 200, responseText: 'success text' })

            // Make a second request that does not cache, like revalidation would do.
            // However that still manipulates the cache if it sees that the request has a cache entry.
            up.request({ url: '/path', cache: false })

            await wait()

            jasmine.respondWith({ status: 500, responseText: 'error text' })

            await wait()

            expect({ url: '/path' }).not.toBeCached()
          })

          it('causes another tracking request to be rejected with the failed response (although the tracked request got evicted)', async function() {
            let request0 = up.request({ url: '/path', cache: true })
            await wait()

            let request1 = up.request({ url: '/path', cache: true })
            await wait()

            jasmine.Ajax.requests.at(0).respondWith({ status: 403, responseText: 'error' })

            await expectAsync(request0).toBeRejectedWith(jasmine.any(up.Response))
            await expectAsync(request1).toBeRejectedWith(jasmine.any(up.Response))
          })

        })

        describe('when the request failed due to a fatal network error', function() {

          it('does not cache the response (so the next request will retry) ', async function() {
            up.request({ url: '/foo', cache: true })

            await wait()

            jasmine.lastRequest().responseError()

            await wait()

            expect({ url: '/foo' }).not.toBeCached()
          })

          it('keeps an earlier cache entry with a successful response (which may be expired but still useful when offline)', async function() {
            // populateCache() uses up.request({ cache: true }) internally
            await jasmine.populateCache({ url: '/path' }, { status: 200, responseText: 'success text' })

            // Make a second request that does not cache, like revalidation would do.
            // However that still manipulates the cache if it sees that the request has a cache entry.
            up.request({ url: '/path', cache: false })

            await wait()

            jasmine.lastRequest().responseError()

            await wait()

            expect({ url: '/path' }).toBeCachedWithResponse({ text: 'success text' })
          })

        })

        describe('when the server responds without content', function() {

          it('does not cache responses with a status of 304 (Not Modified)', async function() {
            up.request({ url: '/foo', cache: true })

            await wait()

            jasmine.respondWith({ status: 304 })

            await wait()

            expect({ url: '/foo' }).not.toBeCached()
          })

          it('does not cache responses with a status of 204 (No Content)', async function() {
            up.request({ url: '/foo', cache: true })

            await wait()

            jasmine.respondWith({ status: 204 })

            await wait()

            expect({ url: '/foo' }).not.toBeCached()
          })

          it('does not cache responses with an empty body', async function() {
            up.request({ url: '/foo', cache: true })

            await wait()

            jasmine.respondWith({ status: 200, responseText: '', responseHeaders: { 'X-Up-Accept-Layer': "123" } })

            await wait()

            expect({ url: '/foo' }).not.toBeCached()
          })

          it('keeps an earlier cache entry with a contentful response (which we need when rendering that response later)', async function() {
            // populateCache() uses up.request({ cache: true }) internally
            await jasmine.populateCache({ url: '/path' }, { status: 200, responseText: 'success text' })

            // Make a second request that does not cache, like revalidation would do.
            // However that still manipulates the cache if it sees that the request has a cache entry.
            up.request({ url: '/path', cache: false })

            await wait()

            jasmine.respondWith({ status: 304 })

            await wait()

            expect({ url: '/path' }).toBeCachedWithResponse({ text: 'success text' })
          })

        })

        it("does not lose a request's #hash when re-using a cached request without a #hash (bugfix)", function() {
          const request1 = up.request({ url: '/url#foo', cache: true })
          expect(request1.hash).toEqual('#foo')
          expect({ url: '/url#foo' }).toBeCached()

          const request2 = up.request({ url: '/url#bar', cache: true })
          expect(request2.hash).toEqual('#bar')
          expect(request1.hash).toEqual('#foo') // also make sure that the first request was not mutated
          expect({ url: '/url#bar' }).toBeCached()
        })

        it('caches requests that change their URL in up:request:load', async function() {
          up.on('up:request:load', ({ request }) => request.url = '/changed-path')
          up.request({ url: '/original-path', cache: true })

          await wait()

          expect({ url: '/changed-path' }).toBeCached()
        })

        it('caches GET requests that change their query params in up:request:load', async function() {
          up.on('up:request:load', ({ request }) => request.params.add('bar', 'two'))
          up.request({ url: '/path?foo=one', cache: true })

          await wait()

          expect({ url: '/path?foo=one&bar=two' }).toBeCached()
        })

        it('respects a config.cacheSize setting', async function() {
          up.network.config.cacheSize = 2

          up.request({ url: '/foo', cache: true })

          await wait(2)

          up.request({ url: '/bar', cache: true })

          await wait(2)

          up.request({ url: '/baz', cache: true })

          await wait(2)

          up.request({ url: '/foo', cache: true })

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(4)
        })

        describe('matching requests', function() {

          it('reuses a request with the same URL but a different #hash', async function() {
            const request1 = up.request({ url: '/url#foo', cache: true })
            expect(request1.hash).toEqual('#foo')

            await wait()

            expect({ url: '/url#foo' }).toBeCached()
            expect({ url: '/url#bar' }).toBeCached()
          })

          it("reuses responses when asked for the same path, but different selectors", async function() {
            up.request({ url: '/path', target: '.a', cache: true })
            up.request({ url: '/path', target: '.b', cache: true })

            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(1)
          })

          it("doesn't reuse responses when asked for the same path, but different query params", async function() {
            up.request({ url: '/path', params: { query: 'foo' }, cache: true })

            await wait()

            up.request({ url: '/path', params: { query: 'bar' }, cache: true })

            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(2)
          })

          it("never reuses responses for different paths, even if all other headers match", async function() {
            up.request({ url: '/foo', cache: true, target: '.target' })

            await wait()

            up.request({ url: '/bar', cache: true, target: '.target' })

            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(2)
          })

          describe('Vary response header', function() {

            it("doesn't reuse responses when asked for the same path, but different selectors if the server responded with `Vary: X-Up-Target`", async function() {
              up.request({ url: '/path', target: '.a', cache: true })

              await wait()

              jasmine.respondWithSelector('.a', {
                text: 'content',
                responseHeaders: { 'Vary': 'X-Up-Target' }
              })

              await wait()

              expect({ url: '/path', target: '.a' }).toBeCached()
              expect({ url: '/path', target: '.b' }).not.toBeCached()

              up.request({ url: '/path', target: '.b', cache: true })

              await wait()

              expect(jasmine.Ajax.requests.count()).toEqual(2)
            })

            it('does reuse responses for the same path and selector if the server responds with `Vary: X-Up-Target` (bugfix)', async function() {
              up.request({ url: '/path', target: '.a', cache: true })
              up.request({ url: '/path', target: '.a', cache: true })

              await wait()

              expect(jasmine.Ajax.requests.count()).toEqual(1)

              jasmine.respondWithSelector('.a', {
                text: 'content',
                responseHeaders: { 'Vary': 'X-Up-Target' }
              })

              await wait()
              expect(jasmine.Ajax.requests.count()).toEqual(1)
              expect(up.network.isBusy()).toBe(false)
            })

            it('loads a request that is tracking another request with the same path, but then retroactively becomes a cache miss due to a Vary header', async function() {
              up.request({ url: '/path', target: '.a', cache: true })

              await wait()

              up.request({ url: '/path', target: '.b', cache: true })

              await wait()

              expect(jasmine.Ajax.requests.count()).toEqual(1)
              expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.a')

              jasmine.respondWithSelector('.a', {
                text: 'content',
                responseHeaders: { 'Vary': 'X-Up-Target' }
              })

              await wait()

              // Now that the first request turned out not to be a match, we're sending a separate request.
              expect(jasmine.Ajax.requests.count()).toEqual(2)
              expect(up.network.isBusy()).toBe(true)
              expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.b')

              jasmine.respondWithSelector('.b', {
                text: 'content',
                responseHeaders: { 'Vary': 'X-Up-Target' }
              })

              await wait()

              // No 3rd request is sent
              expect(jasmine.Ajax.requests.count()).toEqual(2)
              expect(up.network.isBusy()).toBe(false)
            })

            it('ignores Vary for headers that were set outside Unpoly (e.g. by network infrastructure)', async function() {
              up.request({ url: '/path', target: '.a', cache: true })

              await wait()

              up.request({ url: '/path', target: '.b', cache: true })

              await wait()

              expect(jasmine.Ajax.requests.count()).toEqual(1)
              expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.a')

              jasmine.respondWithSelector('.a', {
                text: 'content',
                responseHeaders: { 'Vary': 'Proxy-Header' },
              })

              await wait()

              expect(jasmine.Ajax.requests.count()).toEqual(1)
              expect(up.network.isBusy()).toBe(false)
            })

            it('starts partitioning a method/URL pair once it receives a Vary header', async function() {
              up.request({ url: '/path', target: '.a', cache: true })

              await wait()

              expect({ url: '/path', target: '.a' }).toBeCached()
              expect({ url: '/path', target: '.b' }).toBeCached()

              jasmine.respondWith("<div class='a'>content</div>", { responseHeaders: { Vary: 'X-Up-Target' } })

              await wait()

              expect({ url: '/path', target: '.a' }).toBeCached()
              expect({ url: '/path', target: '.b' }).not.toBeCached()
              expect({ url: '/path' }).not.toBeCached()
            })

            it('partitions the cache separately for varying X-Up-Target and X-Up-Fail-Target headers', async function() {
              await jasmine.populateCache(
                { url: '/path', target: '.a, .b', failTarget: '.c, .d' },
                { responseHeaders: { Vary: 'X-Up-Target, X-Up-Fail-Target' } }
              )

              expect({ url: '/path', target: '.a', failTarget: '.c' }).toBeCached()
              expect({ url: '/path', target: '.a', failTarget: '.e' }).not.toBeCached()
            })

            it('reuses a multi-target response for a new request targeting only some of the cached selectors', async function() {
              await jasmine.populateCache(
                { url: '/path', target: '.a, .b, .c' },
                { responseHeaders: { Vary: 'X-Up-Target' } }
              )

              expect({ url: '/path', target: '.a, .b, .c' }).toBeCached()
              expect({ url: '/path', target: '.a, .c, .b' }).toBeCached()
              expect({ url: '/path', target: '.b, .a, .c' }).toBeCached()
              expect({ url: '/path', target: '.b, .c, .a' }).toBeCached()
              expect({ url: '/path', target: '.c, .a, .b' }).toBeCached()
              expect({ url: '/path', target: '.c, .b, .a' }).toBeCached()
              expect({ url: '/path', target: '.a, .a' }).toBeCached()
              expect({ url: '/path', target: '.a, .b' }).toBeCached()
              expect({ url: '/path', target: '.a, .c' }).toBeCached()
              expect({ url: '/path', target: '.b, .a' }).toBeCached()
              expect({ url: '/path', target: '.b, .b' }).toBeCached()
              expect({ url: '/path', target: '.b, .c' }).toBeCached()
              expect({ url: '/path', target: '.c, .a' }).toBeCached()
              expect({ url: '/path', target: '.c, .b' }).toBeCached()
              expect({ url: '/path', target: '.c, .c' }).toBeCached()
              expect({ url: '/path', target: '.a' }).toBeCached()
              expect({ url: '/path', target: '.b' }).toBeCached()
              expect({ url: '/path', target: '.c' }).toBeCached()
            })

            it('does not reuse a multi-target response for a new request targeting additional selectors', async function() {
              await jasmine.populateCache(
                { url: '/path', target: '.a, .b, .c' },
                { responseHeaders: { Vary: 'X-Up-Target' } }
              )

              expect({ url: '/path', target: '.a, .b, .c' }).toBeCached()
              expect({ url: '/path', target: '.a, .b, .c, .d' }).not.toBeCached()
              expect({ url: '/path', target: '.a, .d' }).not.toBeCached()
              expect({ url: '/path', target: '.d' }).not.toBeCached()
            })

            it('reuses a response without a target for a new request with a target', async function() {
              await jasmine.populateCache(
                { url: '/path' },
                { responseHeaders: { Vary: 'X-Up-Target' } }
              )

              expect({ url: '/path', target: '.a' }).toBeCached()
              expect({ url: '/path', target: '.b' }).toBeCached()
            })

            it('does not reuse a response tailored to a target for a new request without a target', async function() {
              await jasmine.populateCache(
                { url: '/path', target: '.a' },
                { responseHeaders: { Vary: 'X-Up-Target' } }
              )

              expect({ url: '/path', target: '.a' }).toBeCached()
              expect({ url: '/path' }).not.toBeCached()
            })

          }) // Vary response header

        }) // matching requests

        describe('merging unsent requests', function() {

          it('merges the #target of a new request into an unsent request', function() {
            let request1 = up.request({ url: '/path', cache: true, target: '.foo' })

            expect(request1.target).toBe('.foo')
            expect(request1.header('X-Up-Target')).toBe('.foo')

            let request2 = up.request({ url: '/path', cache: true, target: '.bar' })

            expect(request1.target).toBe('.foo, .bar')
            expect(request1.header('X-Up-Target')).toBe('.foo, .bar')
          })

          it('merges the #fragments of a new request into an unsent request', function() {
            let foo = fixture('.foo')
            let bar = fixture('.bar')

            let request1 = up.request({ url: '/path', cache: true, target: '.foo' })

            expect(request1.fragments).toEqual([foo])

            let request2 = up.request({ url: '/path', cache: true, target: '.bar' })

            expect(request1.fragments).toMatchList([foo, bar])
          })

          it('does not merge the #target into a request that was already sent', async function() {
            let request1 = up.request({ url: '/path', cache: true, target: '.foo' })

            expect(request1.target).toBe('.foo')
            expect(request1.header('X-Up-Target')).toBe('.foo')

            await jasmine.nextEvent('up:request:load')

            let request2 = up.request({ url: '/path', cache: true, target: '.bar' })

            expect(request1.target).toBe('.foo')
            expect(request1.header('X-Up-Target')).toBe('.foo')
          })

          it('does not merge the #target into a request without a #target (which might narrow a full page response into a fragment response)', function() {
            let request1 = up.request({ url: '/path', cache: true })

            expect(request1.target).toBeUndefined()
            expect(request1.headers).not.toHaveKey('X-Up-Target')

            let request2 = up.request({ url: '/path', cache: true, target: '.bar' })

            expect(request1.target).toBeUndefined()
            expect(request1.headers).not.toHaveKey('X-Up-Target')
          })

          it('merges two requests targeting multiple selectors each', function() {
            let foo1 = fixture('.foo1')
            let foo2 = fixture('.foo2')
            let bar1 = fixture('.bar1')
            let bar2 = fixture('.bar2')

            let request1 = up.request({ url: '/path', cache: true, target: '.foo1, .foo2' })

            expect(request1.fragments).toEqual([foo1, foo2])

            let request2 = up.request({ url: '/path', cache: true, target: '.bar1, .bar2' })

            expect(request1.target).toBe('.foo1, .foo2, .bar1, .bar2')
            expect(request1.header('X-Up-Target')).toBe('.foo1, .foo2, .bar1, .bar2')
            expect(request1.fragments).toMatchList([foo1, foo2, bar1, bar2])
          })

          it('merges two requests targeting the same selectors, but in a different order', function() {
            let foo = fixture('.foo')
            let bar = fixture('.bar')

            let request1 = up.request({ url: '/path', cache: true, target: '.foo, .bar' })

            expect(request1.fragments).toEqual([foo, bar])

            let request2 = up.request({ url: '/path', cache: true, target: '.bar, .foo' })

            expect(request1.target).toBe('.foo, .bar')
            expect(request1.header('X-Up-Target')).toBe('.foo, .bar')
            expect(request1.fragments).toMatchList([foo, bar])
          })

          it("aborts both requests if the earlier request's fragment is aborted", async function() {
            let foo = fixture('.foo')
            let bar = fixture('.bar')

            let request1 = up.request({ url: '/path', cache: true, target: '.foo' })
            let request2 = up.request({ url: '/path', cache: true, target: '.bar' })

            expect(request1.fragments).toEqual([foo, bar])

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)

            up.fragment.abort(foo)

            await expectAsync(request1).toBeRejectedWith(jasmine.any(up.Aborted))
            await expectAsync(request2).toBeRejectedWith(jasmine.any(up.Aborted))
          })

          it("aborts both requests if a later request's fragment is aborted", async function() {
            let foo = fixture('.foo')
            let bar = fixture('.bar')

            let request1 = up.request({ url: '/path', cache: true, target: '.foo' })
            let request2 = up.request({ url: '/path', cache: true, target: '.bar' })

            expect(request1.fragments).toEqual([foo, bar])

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)

            up.fragment.abort(bar)

            await expectAsync(request1).toBeRejectedWith(jasmine.any(up.Aborted))
            await expectAsync(request2).toBeRejectedWith(jasmine.any(up.Aborted))
          })

        })

        describe('with { cache: "auto" }', function() {

          describe('default autoCache behavior', function() {

            u.each(['GET', 'HEAD', 'OPTIONS'], function(safeMethod) {

              it(`caches ${safeMethod} requests`, async function() {
                up.request({ url: '/foo', method: safeMethod, cache: 'auto' })
                await wait()

                up.request({ url: '/foo', method: safeMethod, cache: 'auto' })
                await wait()

                expect(jasmine.Ajax.requests.count()).toEqual(1)
              })

              it(`does not cache ${safeMethod} requests with { cache: false }`, async function() {
                up.request({ url: '/foo', method: safeMethod, cache: false })
                await wait()

                up.request({ url: '/foo', method: safeMethod, cache: false })
                await wait()

                expect(jasmine.Ajax.requests.count()).toEqual(2)
              })
            })

            u.each(['POST', 'PUT', 'DELETE'], function(unsafeMethod) {
              it(`does not cache ${unsafeMethod} requests`, async function() {
                up.request({ url: '/foo', method: unsafeMethod, cache: 'auto' })
                await wait()

                up.request({ url: '/foo', method: unsafeMethod, cache: 'auto' })
                await wait()

                expect(jasmine.Ajax.requests.count()).toEqual(2)
              })
            })
          })

          it('caches the request if up.network.config.autoCache(request) returns true', function() {
            up.network.config.autoCache = (request) => request.url === '/yes'

            up.request({ url: '/yes', cache: 'auto' })

            expect({ url: '/yes' }).toBeCached()
          })

          it('does not cache the request if up.network.config.autoCache(request) returns false', function() {
            up.network.config.autoCache = (request) => request.url === '/yes'

            up.request({ url: '/no', cache: 'auto' })

            expect({ url: '/no' }).not.toBeCached()
          })
        })
      })

      describe('when there is an existing cache entry and a new request has { cache: false }', function() {

        it('keeps the existing response in the cache while the new request is loading', async function() {
          let response = null

          up.request({ url: '/cache-me', cache: true })
          await wait()

          expect(up.network.queue.allRequests.length).toBe(1)
          jasmine.respondWith('response text')
          await wait()

          expect(up.network.queue.allRequests.length).toBe(0)
          up.request({ url: '/cache-me', cache: false })
          await wait()

          expect(up.network.queue.allRequests.length).toBe(1)
          up.request({ url: '/cache-me', cache: true }).then((cachedResponse) => response = cachedResponse)
          await wait()

          expect(response).toBeGiven()
          expect(response.text).toEqual('response text')
        })

        it("updates an existing cache entry with the newer response", async function() {
          let response = null

          up.request({ url: '/cache-me', cache: true })
          await wait()

          expect(up.network.queue.allRequests.length).toBe(1)
          jasmine.respondWith('old response text')
          await wait()

          expect(up.network.queue.allRequests.length).toBe(0)
          up.request({ url: '/cache-me', cache: false })
          await wait()

          expect(up.network.queue.allRequests.length).toBe(1)
          jasmine.respondWith('new response text')
          await wait()

          up.request({ url: '/cache-me', cache: true }).then((cachedResponse) => response = cachedResponse)
          await wait()

          expect(response).toBeGiven()
          expect(response.text).toEqual('new response text')
        })
      })

      describe('cache eviction', function() {

        it('evicts all cache entries with { evictCache: true }', async function() {
          up.request({ url: '/foo', cache: true })
          await wait()
          expect({ url: '/foo' }).toBeCached()

          up.request({ url: '/bar', evictCache: true })
          await wait()

          expect({ url: '/foo' }).not.toBeCached()
          expect({ url: '/bar' }).not.toBeCached()

          jasmine.respondWith('foo')
          await wait()

          expect({ url: '/foo' }).not.toBeCached()
          expect({ url: '/bar' }).not.toBeCached()
        })

        it('keeps this new request in the cache after a cache miss with { cache: true, evictCache: true }', async function() {
          up.request({ url: '/foo', cache: true })
          await wait()
          expect({ url: '/foo' }).toBeCached()

          up.request({ url: '/bar', cache: true, evictCache: true })
          await wait()

          expect({ url: '/foo' }).not.toBeCached()
          expect({ url: '/bar' }).toBeCached()

          jasmine.respondWith('foo')
          await wait()

          expect({ url: '/foo' }).not.toBeCached()
          expect({ url: '/bar' }).toBeCached()
        })

        it('evicts the cache before making a new request after a cache hit with { cache: true, evictCache: true }', async function() {
          await jasmine.populateCache('/path', 'old content')
          expect({ url: '/path' }).toBeCached()
          await expectAsync(up.cache.get({ url: '/path' })).toBeResolvedTo(jasmine.any(up.Response))

          expect(jasmine.Ajax.requests.count()).toBe(1)

          up.request({ url: '/path', cache: true, evictCache: true })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)
          expect({ url: '/path' }).toBeCached() // Cache has been expired and immediately replaced with the new request
          await expectAsync(up.cache.get({ url: '/path' })).toBePending()

          jasmine.respondWith('fresh content')
          await wait()

          expect({ url: '/path' }).toBeCached()
          await expectAsync(up.cache.get({ url: '/path' })).toBeResolvedTo(jasmine.any(up.Response))
        })

        it('accepts an URL pattern as { evictCache } option', async function() {
          up.request({ url: '/foo/1', cache: true })
          up.request({ url: '/foo/2', cache: true })
          up.request({ url: '/bar/1', cache: true })
          await wait()

          expect({ url: '/foo/1' }).toBeCached()
          expect({ url: '/foo/2' }).toBeCached()
          expect({ url: '/bar/1' }).toBeCached()

          up.request({ url: '/other', evictCache: '/foo/*' })
          await wait()

          expect({ url: '/foo/1' }).not.toBeCached()
          expect({ url: '/foo/2' }).not.toBeCached()
          expect({ url: '/bar/1' }).toBeCached()

          expect(jasmine.Ajax.requests.count()).toEqual(4)

          jasmine.respondWith({
            status: 200,
            contentType: 'text/html',
            responseText: 'foo'
          })
          await wait()

          expect({ url: '/foo/1' }).not.toBeCached()
          expect({ url: '/foo/2' }).not.toBeCached()
          expect({ url: '/bar/1' }).toBeCached()
        })

        it('accepts an function as { evictCache } option', async function() {
          up.request({ url: '/foo/1', cache: true })
          up.request({ url: '/foo/2', cache: true })
          up.request({ url: '/bar/1', cache: true })
          await wait()

          expect({ url: '/foo/1' }).toBeCached()
          expect({ url: '/foo/2' }).toBeCached()
          expect({ url: '/bar/1' }).toBeCached()

          let evictCache = (request) => request.url.indexOf('/foo/') === 0
          up.request({ url: '/other', evictCache })
          await wait()

          expect({ url: '/foo/1' }).not.toBeCached()
          expect({ url: '/foo/2' }).not.toBeCached()
          expect({ url: '/bar/1' }).toBeCached()

          expect(jasmine.Ajax.requests.count()).toEqual(4)

          jasmine.respondWith({
            status: 200,
            contentType: 'text/html',
            responseText: 'foo'
          })
          await wait()

          expect({ url: '/foo/1' }).not.toBeCached()
          expect({ url: '/foo/2' }).not.toBeCached()
          expect({ url: '/bar/1' }).toBeCached()
        })

        it('lets the server send an URL pattern as X-Up-Evict-Cache response header', async function() {
          up.request({ url: '/foo/1', cache: true })
          up.request({ url: '/foo/2', cache: true })
          up.request({ url: '/bar/1', cache: true })
          await wait()

          expect({ url: '/foo/1' }).toBeCached()
          expect({ url: '/foo/2' }).toBeCached()
          expect({ url: '/bar/1' }).toBeCached()

          up.request({ url: '/other' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(4)

          jasmine.respondWith({
            status: 200,
            contentType: 'text/html',
            responseText: 'foo',
            responseHeaders: { 'X-Up-Evict-Cache': '/foo/*' }
          })
          await wait()

          expect({ url: '/foo/1' }).not.toBeCached()
          expect({ url: '/foo/2' }).not.toBeCached()
          expect({ url: '/bar/1' }).toBeCached()
        })

        it('evicts the entire cache if the server responds with an X-Up-Evict-Cache: * header', async function() {
          up.request({ url: '/foo', cache: true })
          up.request({ url: '/bar', cache: true })
          await wait()

          expect({ url: '/foo' }).toBeCached()
          expect({ url: '/bar' }).toBeCached()

          up.request({ url: '/baz' })
          await wait()

          expect({ url: '/foo' }).toBeCached()
          expect({ url: '/bar' }).toBeCached()
          expect(jasmine.Ajax.requests.count()).toEqual(3)

          jasmine.respondWith({
            status: 200,
            contentType: 'text/html',
            responseText: 'foo',
            responseHeaders: { 'X-Up-Evict-Cache': '*' }
          })
          await wait()

          expect({ url: '/foo' }).not.toBeCached()
          expect({ url: '/bar' }).not.toBeCached()
        })

        it('defaults to a rule in up.network.config.evictCache() if neither request nor server set a { evictCache } option', async function() {
          up.network.config.evictCache = function(request) {
            expect(request).toEqual(jasmine.any(up.Request))

            if (request.url === '/baz') {
              return '/foo'
            }
          }

          up.request({ url: '/foo', cache: true })
          up.request({ url: '/bar', cache: true })
          await wait()

          expect({ url: '/foo' }).toBeCached()
          expect({ url: '/bar' }).toBeCached()

          up.request({ url: '/baz', cache: true })
          await wait()

          // Only the URL pattern returned by config.evictCache() is evicted
          expect({ url: '/foo' }).not.toBeCached()
          expect({ url: '/bar' }).toBeCached()
          expect({ url: '/baz' }).toBeCached()
        })

      })

      describe('cache expiration', function() {

        it('expires all cache entries with { expireCache: true }', async function() {
          up.request({ url: '/foo', cache: true })
          await wait()

          expect({ url: '/foo' }).toBeCached()

          up.request({ url: '/bar', expireCache: true })
          await wait()

          expect({ url: '/foo' }).toBeExpired()

          jasmine.respondWith('foo')
          await wait()

          expect({ url: '/foo' }).toBeExpired()
        })

        it('keeps a fresh cache entry for this new request after a cache miss with { cache: true, expireCache: true }', async function() {
          up.request({ url: '/foo', cache: true })
          await wait()
          expect({ url: '/foo' }).toBeCached()

          up.request({ url: '/bar', cache: true, expireCache: true })
          await wait()

          expect({ url: '/foo' }).toBeCached()
          expect({ url: '/foo' }).toBeExpired()
          expect({ url: '/bar' }).toBeCached()

          jasmine.respondWith('bar')
          await wait()

          expect({ url: '/foo' }).toBeCached()
          expect({ url: '/foo' }).toBeExpired()
          expect({ url: '/bar' }).toBeCached()
          expect({ url: '/bar' }).not.toBeExpired()
        })

        it('processes an { expireCache } option after a cache hit with', async function() {
          await jasmine.populateCache('/foo', 'cached foo')
          await jasmine.populateCache('/bar', 'cached bar')
          expect({ url: '/foo' }).toBeCached()
          expect({ url: '/foo' }).not.toBeExpired()
          expect({ url: '/bar' }).toBeCached()
          expect({ url: '/bar' }).not.toBeExpired()
          expect(jasmine.Ajax.requests.count()).toBe(2)

          up.request({ url: '/foo', cache: true, expireCache: '/bar' })
          await wait()

          expect({ url: '/foo' }).not.toBeExpired()
          expect({ url: '/bar' }).toBeExpired()
          expect(jasmine.Ajax.requests.count()).toBe(2)
        })

        it('accepts an URL pattern as { expireCache } option', async function() {
          up.request({ url: '/foo/1', cache: true })
          up.request({ url: '/foo/2', cache: true })
          up.request({ url: '/bar/1', cache: true })
          await wait()

          expect({ url: '/foo/1' }).toBeCached()
          expect({ url: '/foo/2' }).toBeCached()
          expect({ url: '/bar/1' }).toBeCached()

          up.request({ url: '/other', expireCache: '/foo/*' })
          await wait()

          expect({ url: '/foo/1' }).toBeExpired()
          expect({ url: '/foo/2' }).toBeExpired()
          expect({ url: '/bar/1' }).not.toBeExpired()

          expect(jasmine.Ajax.requests.count()).toEqual(4)

          jasmine.respondWith({
            status: 200,
            contentType: 'text/html',
            responseText: 'foo'
          })
          await wait()

          expect({ url: '/foo/1' }).toBeExpired()
          expect({ url: '/foo/2' }).toBeExpired()
          expect({ url: '/bar/1' }).not.toBeExpired()
        })

        it('accepts an function as { expireCache } option', async function() {
          up.request({ url: '/foo/1', cache: true })
          up.request({ url: '/foo/2', cache: true })
          up.request({ url: '/bar/1', cache: true })
          await wait()

          expect({ url: '/foo/1' }).toBeCached()
          expect({ url: '/foo/2' }).toBeCached()
          expect({ url: '/bar/1' }).toBeCached()

          let expireCache = (request) => request.url.startsWith('/foo/')
          up.request({ url: '/other', expireCache })
          await wait()

          expect({ url: '/foo/1' }).toBeExpired()
          expect({ url: '/foo/2' }).toBeExpired()
          expect({ url: '/bar/1' }).not.toBeExpired()

          expect(jasmine.Ajax.requests.count()).toEqual(4)

          jasmine.respondWith({
            status: 200,
            contentType: 'text/html',
            responseText: 'foo'
          })
          await wait()

          expect({ url: '/foo/1' }).toBeExpired()
          expect({ url: '/foo/2' }).toBeExpired()
          expect({ url: '/bar/1' }).not.toBeExpired()
        })

        it('lets the server send an URL pattern as X-Up-Expire-Cache response header', async function() {
          up.request({ url: '/foo/1', cache: true })
          up.request({ url: '/foo/2', cache: true })
          up.request({ url: '/bar/1', cache: true })

          expect({ url: '/foo/1' }).toBeCached()
          expect({ url: '/foo/1' }).not.toBeExpired()
          expect({ url: '/foo/2' }).toBeCached()
          expect({ url: '/foo/2' }).not.toBeExpired()
          expect({ url: '/bar/1' }).toBeCached()
          expect({ url: '/bar/1' }).not.toBeExpired()

          up.request({ url: '/other' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(4)

          jasmine.respondWith({
            status: 200,
            contentType: 'text/html',
            responseText: 'foo',
            responseHeaders: { 'X-Up-Expire-Cache': '/foo/*' }
          })
          await wait()

          expect({ url: '/foo/1' }).toBeExpired()
          expect({ url: '/foo/2' }).toBeExpired()
          expect({ url: '/bar/1' }).not.toBeExpired()
        })

        it('expires the entire cache if the server responds with an X-Up-Expire-Cache: * header', async function() {
          up.request({ url: '/foo', cache: true })
          up.request({ url: '/bar', cache: true })
          await wait()

          expect({ url: '/foo' }).toBeCached()
          expect({ url: '/foo' }).not.toBeExpired()
          expect({ url: '/bar' }).toBeCached()
          expect({ url: '/bar' }).not.toBeExpired()

          up.request({ url: '/baz' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(3)

          jasmine.respondWith({
            status: 200,
            contentType: 'text/html',
            responseText: 'foo',
            responseHeaders: { 'X-Up-Expire-Cache': '*' }
          })
          await wait()

          expect({ url: '/foo' }).toBeExpired()
          expect({ url: '/bar' }).toBeExpired()
        })

        it('defaults to a rule in up.network.config.expireCache() if neither request nor server set a { expireCache } option', async function() {
          up.network.config.expireCache = function(request) {
            expect(request).toEqual(jasmine.any(up.Request))

            if (request.url === '/baz') {
              return '/foo'
            }
          }

          up.request({ url: '/foo', cache: true })
          await wait()

          up.request({ url: '/bar', cache: true })
          await wait()

          expect({ url: '/foo' }).toBeCached()
          expect({ url: '/foo' }).not.toBeExpired()
          expect({ url: '/bar' }).toBeCached()
          expect({ url: '/bar' }).not.toBeExpired()
          expect({ url: '/baz' }).not.toBeCached()
          await wait()

          up.request({ url: '/baz', cache: true })
          await wait()

          expect({ url: '/foo' }).toBeCached()
          expect({ url: '/foo' }).toBeExpired()
          expect({ url: '/bar' }).toBeCached()
          expect({ url: '/bar' }).not.toBeExpired()
          expect({ url: '/baz' }).toBeCached()
          expect({ url: '/baz' }).not.toBeExpired()
        })

        u.each(['POST', 'PUT', 'DELETE'], function(unsafeMethod) {

          it(`expires the entire cache if a ${unsafeMethod} request is made`, async function() {
            const safeRequestAttrs = { method: 'GET', url: '/foo', cache: true }
            const unsafeRequestAttrs = { method: unsafeMethod, url: '/foo' }

            up.request(safeRequestAttrs)
            await wait()

            jasmine.respondWith('foo')
            await wait()

            expect(safeRequestAttrs).toBeCached()

            up.request(unsafeRequestAttrs)
            await wait()

            jasmine.respondWith('foo')
            await wait()

            expect(safeRequestAttrs).toBeExpired()
          })

          it(`does not expire the cache if a ${unsafeMethod} request is made with { expireCache: false }`, async function() {
            const safeRequestAttrs = { method: 'GET', url: '/foo', cache: true }
            const unsafeRequestAttrs = { method: unsafeMethod, url: '/foo', expireCache: false }

            up.request(safeRequestAttrs)
            await wait()

            jasmine.respondWith('false')
            await wait()

            expect(safeRequestAttrs).toBeCached()

            up.request(unsafeRequestAttrs)
            await wait()

            jasmine.respondWith('foo')
            await wait()

            expect(safeRequestAttrs).not.toBeExpired()
          })

        })

      })


      describe('method wrapping', function() {

        u.each(['GET', 'POST', 'HEAD', 'OPTIONS'], function(method) {
          it(`does not change the method of a ${method} request`, async function() {
            up.request({ url: '/foo', method })
            await wait()

            const request = jasmine.lastRequest()
            expect(request.method).toEqual(method)
            expect(request.data()['_method']).toBeUndefined()
          })
        })

        u.each(['PUT', 'PATCH', 'DELETE'], function(method) {
          it(`turns a ${method} request into a POST request and sends the actual method as a { _method } param to prevent unexpected redirect behavior (https://makandracards.com/makandra/38347)`, async function() {
            up.request({ url: '/foo', method })
            await wait()

            const request = jasmine.lastRequest()
            expect(request.method).toEqual('POST')
            expect(request.data()['_method']).toEqual([method])
          })
        })

        describe('with { wrapMethod: false }', function() {
          u.each(['GET', 'POST', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'], function(method) {
            it(`does not wrap the method of a ${method} request`, async function() {
              up.request({ url: '/foo', method, wrapMethod: false })
              await wait()

              const request = jasmine.lastRequest()
              expect(request.method).toEqual(method)
              expect(request.data()['_method']).toBeUndefined()
            })
          })
        })
      })

      describe('with config.concurrency set', function() {

        beforeEach(function() {
          up.network.config.concurrency = 1
        })

        it('limits the number of concurrent requests', async function() {
          const responses = []
          const trackResponse = (response) => responses.push(response.text)

          up.request({ url: '/foo' }).then(trackResponse)
          up.request({ url: '/bar' }).then(trackResponse)
          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          await wait()

          jasmine.respondWith('first response', { request: jasmine.Ajax.requests.at(0) })
          await wait()

          expect(responses).toEqual(['first response'])
          expect(jasmine.Ajax.requests.count()).toEqual(2)
          await wait()

          jasmine.respondWith('second response', { request: jasmine.Ajax.requests.at(1) })
          await wait()

          expect(responses).toEqual(['first response', 'second response'])
        })
      })

      describe('up:request:load event', function() {

        it('emits an up:request:load event before the request touches the network', async function() {
          let origin = fixture('.origin')
          const listener = jasmine.createSpy('listener')
          up.on('up:request:load', listener)
          up.request('/bar', { origin })
          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)

          const partialRequest = jasmine.objectContaining({
            method: 'GET',
            url: jasmine.stringMatching('/bar'),
            origin: origin
          })
          const partialEvent = jasmine.objectContaining({ request: partialRequest })

          expect(listener).toHaveBeenCalledWith(partialEvent, jasmine.anything(), jasmine.anything())
        })
      })

      it('allows up:request:load listeners to prevent the request (useful to cancel all requests when stopping a test scenario)', async function() {
        const listener = jasmine.createSpy('listener').and.callFake(function(event) {
          expect(jasmine.Ajax.requests.count()).toEqual(0)
          event.preventDefault()
        })

        up.on('up:request:load', listener)

        const promise = up.request('/bar')

        await expectAsync(promise).toBeRejectedWith(jasmine.anyError(/prevented|aborted/i))
        expect(listener).toHaveBeenCalled()
        expect(jasmine.Ajax.requests.count()).toEqual(0)
      })

      it('does not block the queue when an up:request:load event was prevented', function(done) {
        up.network.config.concurrency = 1

        const listener = jasmine.createSpy('listener').and.callFake(function(event) {
          // only prevent the first request
          if (event.request.url.indexOf('/path1') >= 0) {
            event.preventDefault()
          }
        })

        up.on('up:request:load', listener)

        const promise1 = up.request('/path1')
        const promise2 = up.request('/path2')

        u.task(() => {
          expect(listener.calls.count()).toBe(2)
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().url).toMatchURL('/path2')
          done()
        })
      })

      it('allows up:request:load listeners to manipulate the request headers', function(done) {
        const listener = (event) => event.request.headers['X-From-Listener'] = 'foo'

        up.on('up:request:load', listener)

        up.request('/path1')

        u.task(() => {
          expect(jasmine.lastRequest().requestHeaders['X-From-Listener']).toEqual('foo')
          done()
        })
      })

      it('allows up:request:load listeners to add request params for a POST request', function(done) {
        const listener = (event) => event.request.params.set('key', 'value')

        up.on('up:request:load', listener)

        up.request('/path1', { method: 'post' })

        u.task(() => {
          expect(jasmine.lastRequest().params).toMatchParams({ key: 'value' })
          done()
        })
      })

      it('allows up:request:load listeners to add request params for a GET request, which are moved to the URL before connecting', function(done) {
        const listener = (event) => event.request.params.set('key3', 'value3')

        up.on('up:request:load', listener)

        up.request('/path1?key1=value1', { params: { key2: 'value2' }, method: 'get' })

        u.task(() => {

          expect(jasmine.lastRequest().url).toMatchURL('/path1?key1=value1&key2=value2&key3=value3')
          expect(jasmine.lastRequest().params).toMatchParams({})
          done()
        })
      })

      it('allows up:request:load listeners to access the xhr request object', function(done) {
        const listener = jasmine.createSpy('listener').and.callFake(function(event) {
          expect(jasmine.Ajax.requests.count()).toEqual(0)
          expect(event.request.xhr).toBeDefined()
        })

        up.on('up:request:load', listener)

        up.request('/path1', { method: 'post' })

        u.task(() => {
          expect(listener.calls.count()).toBe(1)
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          done()
        })
      })

      describe('event target', function() {
        it('is emitted on the layer that triggered the event', async function() {
          makeLayers(3)

          const listener = jasmine.createSpy('event listener')
          up.on('up:request:load', listener)
          await wait()

          up.request('/path', { layer: 1 })
          await wait()

          expect(listener.calls.count()).toBe(1)
          expect(listener.calls.argsFor(0)[0].target).toBe(up.layer.get(1).element)
        })
      })
    })

    describe('up:network:late and up:network:recover events', function() {

      beforeEach(function() {
        up.network.config.lateDelay = 0
        this.events = []
        u.each(['up:request:load', 'up:request:loaded', 'up:network:late', 'up:network:recover', 'up:request:offline', 'up:request:aborted'], (eventType) => {
          up.on(eventType, () => {
            this.events.push(eventType)
          })
        })
      })

      it('emits an up:network:late event if the server takes too long to respond', async function() {
        let lateListener = jasmine.createSpy('up:network:late listener')
        up.on('up:network:late', lateListener)

        up.network.config.lateDelay = 70

        up.request({ url: '/foo' })
        await wait(40)

        expect(lateListener).not.toHaveBeenCalled()

        await wait(60)
        expect(lateListener).toHaveBeenCalled()
      })

      it('allows to configure request-specific response times as a function in up.network.config.lateDelay', async function() {
        let lateListener = jasmine.createSpy('up:network:late listener')
        up.on('up:network:late', lateListener)

        let badResponseTimeFn = jasmine.createSpy('lateDelay').and.callFake((request) => request.url === '/foo' ? 70 : 0)
        up.network.config.lateDelay = badResponseTimeFn

        up.request({ url: '/foo' })
        await wait(40)

        expect(badResponseTimeFn).toHaveBeenCalled()
        expect(lateListener).not.toHaveBeenCalled()

        await wait(60)
        expect(lateListener).toHaveBeenCalled()
      })

      it('honors an up.request({ lateDelay }) option', async function() {
        up.network.config.lateDelay = 5
        let lateListener = jasmine.createSpy('up:network:late listener')
        up.on('up:network:late', lateListener)

        up.request({ url: '/foo', lateDelay: 70 })
        await wait(40)

        expect(lateListener).not.toHaveBeenCalled()
        await wait(60)

        expect(lateListener).toHaveBeenCalled()
      })

      it('never emits an up:network:late event for requests with { lateDelay: false }', async function() {
        up.network.config.lateDelay = 5
        let lateListener = jasmine.createSpy('up:network:late listener')
        up.on('up:network:late', lateListener)

        up.request({ url: '/foo', lateDelay: false })
        await wait(70)

        expect(lateListener).not.toHaveBeenCalled()
      })

      it('never emits an up:network:late event for background requests', async function() {
        // A background request doesn't make us busy.
        up.request({ url: '/foo', cache: true, background: true })
        await wait()

        expect(this.events).toEqual([
          'up:request:load'
        ])

        // The same request in the foreground does trigger up:network:late.
        up.request({ url: '/foo', cache: true })

        await wait(20)

        expect(this.events).toEqual([
          'up:request:load',
          'up:network:late'
        ])

        // The response resolves both promises and emits up:network:recover.
        jasmine.Ajax.requests.at(0).respondWith({
          status: 200,
          contentType: 'text/html',
          responseText: 'foo'
        })

        await wait(10)

        expect(this.events).toEqual([
          'up:request:load',
          'up:network:late',
          'up:request:loaded',
          'up:network:recover'
        ])
      })

      it('can delay the up:network:late event to prevent flickering of spinners', async function() {
        up.network.config.lateDelay = 50
        up.request({ url: '/foo' })
        await wait()

        expect(this.events).toEqual([
          'up:request:load'
        ])
        await wait(25)

        expect(this.events).toEqual([
          'up:request:load'
        ])
        await wait(200)

        expect(this.events).toEqual([
          'up:request:load',
          'up:network:late'
        ])

        jasmine.respondWith('foo')
        await wait(10)

        expect(this.events).toEqual([
          'up:request:load',
          'up:network:late',
          'up:request:loaded',
          'up:network:recover'
        ])
      })

      it('does not emit up:network:recover if a delayed up:network:late was never emitted due to a fast response', async function() {
        up.network.config.lateDelay = 200
        up.request({ url: '/foo' })
        await wait()

        expect(this.events).toEqual([
          'up:request:load'
        ])
        await wait(100)

        jasmine.Ajax.requests.at(0).respondWith({
          status: 200,
          contentType: 'text/html',
          responseText: 'foo'
        })
        await wait(250)

        expect(this.events).toEqual([
          'up:request:load',
          'up:request:loaded'
        ])
      })

      it('emits up:network:recover if a request returned but failed with an error code', async function() {
        up.request({ url: '/foo' })
        await wait()

        expect(this.events).toEqual([
          'up:request:load',
          'up:network:late'
        ])

        jasmine.Ajax.requests.at(0).respondWith({
          status: 500,
          contentType: 'text/html',
          responseText: 'something went wrong'
        })
        await wait(10)

        expect(this.events).toEqual([
          'up:request:load',
          'up:network:late',
          'up:request:loaded',
          'up:network:recover'
        ])
      })

      it('emits up:network:recover if a request timed out', async function() {
        up.network.config.lateDelay = 10

        up.request({ url: '/foo' })
        await wait(50)

        expect(this.events).toEqual([
          'up:request:load',
          'up:network:late'
        ])

        jasmine.clock().install() // required by responseTimeout()
        jasmine.lastRequest().responseTimeout()
        await wait(10)

        jasmine.clock().tick(10)
        expect(this.events).toEqual([
          'up:request:load',
          'up:network:late',
          'up:request:offline',
          'up:network:recover'
        ])
      })

      it('emits up:network:recover if a request was aborted', async function() {
        up.network.config.lateDelay = 10

        this.request = up.request({ url: '/foo' })
        await wait(100)

        expect(this.events).toEqual([
          'up:request:load',
          'up:network:late'
        ])

        up.network.abort(this.request)
        await wait(10)

        expect(this.events).toEqual([
          'up:request:load',
          'up:network:late',
          'up:request:aborted',
          'up:network:recover'
        ])
      })

      it('emits up:network:recover if a request failed fatally', async function() {
        up.network.config.lateDelay = 10

        this.request = up.request({ url: '/foo' })
        await wait(100)

        expect(this.events).toEqual([
          'up:request:load',
          'up:network:late'
        ])

        jasmine.lastRequest().responseError()
        await wait(10)

        expect(this.events).toEqual([
          'up:request:load',
          'up:network:late',
          'up:request:offline',
          'up:network:recover'
        ])
      })

      it('delays up:network:recover until the foreground queue is completely empty', async function() {
        up.network.config.lateDelay = 50

        // Make a chain of requests, like a queued watcher diff.
        let request1, request2
        request1 = up.request('/path1')
        request1.then(() => request2 = up.request('/path2'))

        await wait()

        expect(this.events).toEqual([
          'up:request:load'
        ])

        await wait(100)
        expect(this.events).toEqual([
          'up:request:load',
          'up:network:late',
        ])

        jasmine.respondWith('response 1')
        await wait()

        expect(this.events).toEqual([
          'up:request:load',
          'up:network:late',
          'up:request:loaded',
          'up:request:load',
        ])

        jasmine.respondWith('response 2')
        await wait()

        expect(this.events).toEqual([
          'up:request:load',
          'up:network:late',
          'up:request:loaded',
          'up:request:load',
          'up:request:loaded',
          'up:network:recover',
        ])

      })

    })

    if (up.migrate.loaded) {
      describe('up.ajax', function() {
        it('fulfills to the response text in order to match the $.ajax() API as good as possible', function(done) {
          const promise = up.ajax('/url')

          u.task(() => {
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            jasmine.respondWith('response-text')

            promise.then(function(text) {
              expect(text).toEqual('response-text')

              done()
            })

            promise.catch((reason) => done.fail(reason))
          })
        })
      })
    }

    describe('up.network.abort()', function() {

      it('aborts the given up.Request', async function() {
        const request1 = up.request('/url')
        const request2 = up.request('/url')

        await wait()

        up.network.abort(request1)

        await expectAsync(request1).toBeRejectedWith(jasmine.any(up.Aborted))

        await expectAsync(request2).toBePending()

      })

      it('aborts all requests when called without an argument', async function() {
        const request = up.request('/url')

        up.network.abort()

        await expectAsync(request).toBeRejectedWith(jasmine.any(up.Aborted))
      })

      it('aborts all requests for which the given function returns true', async function() {
        const request1 = up.request('/foo')
        const request2 = up.request('/bar')

        let matcher = (request) => request.url === '/foo'
        up.network.abort(matcher)

        await expectAsync(request1).toBeRejectedWith(jasmine.any(up.Aborted))
        await expectAsync(request2).toBePending()
      })

      it('aborts all requests matching the given URL pattern', async function() {
        const request1 = up.request('/foo/123')
        const request2 = up.request('/bar/456')

        await wait()

        up.network.abort('/foo/*')

        await expectAsync(request1).toBeRejectedWith(jasmine.any(up.Aborted))
        await expectAsync(request1).toBePending()
      })

      it('emits an up:request:aborted event', async function() {
        const listener = jasmine.createSpy('event listener')
        up.on('up:request:aborted', listener)

        const request = up.request('/url')
        await wait()

        request.abort()
        await wait()

        expect(listener).toHaveBeenCalled()
        expect(listener.calls.argsFor(0)[0]).toBeEvent('up:request:aborted')
      })

      it('does not send multiple up:request:aborted events if the request is aborted multiple times', async function() {
        const listener = jasmine.createSpy('event listener')
        up.on('up:request:aborted', listener)

        const request = up.request('/url')

        up.network.abort(request)
        up.network.abort(request)
        await wait()

        expect(listener.calls.count()).toBe(1)
      })

      it('does not reset the XHR object by calling xhr.abort() on a loaded XHR object (bugfix)', async function() {
        const request = up.request('/url')
        let response = null
        request.then((r) => response = r)

        await wait()

        expect(request.xhr).toBeGiven()

        // Just to make sure that the fake XHR object we have in specs has different
        // side effects than the real one: Check that xhr.abort() is never called.
        spyOn(request.xhr, 'abort').and.callThrough()

        jasmine.respondWith('response text')
        await wait()

        expect(response.xhr.readyState).toBe(XMLHttpRequest.DONE)
        expect(response.contentType).toEqual('text/html')

        request.abort()
        await wait()

        // Calling xhr.abort() on a loaded XHR will reset the readyState to 0
        expect(response.xhr.readyState).toBe(XMLHttpRequest.DONE)

        // Calling xhr.abort() on a loaded XHR will lose all response headers
        expect(response.contentType).toEqual('text/html')

        expect(request.xhr.abort).not.toHaveBeenCalled()
      })

      it('does not abort a request that was already fulfilled with a response', async function() {
        const listener = jasmine.createSpy('event listener')
        up.on('up:request:aborted', listener)

        const request = up.request('/url')

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        jasmine.respondWith('response from server')
        await wait()

        let result = await promiseState(request)

        expect(result.state).toBe('fulfilled')
        expect(result.value).toEqual(jasmine.any(up.Response))
        expect(listener).not.toHaveBeenCalled()

        request.abort()
        await wait()

        result = await promiseState(request)

        expect(result.state).toBe('fulfilled')
        expect(result.value).toEqual(jasmine.any(up.Response))
        expect(listener).not.toHaveBeenCalled()
      })

      describe('with { reason } option', function() {

        it("sets the given reason as the AbortError's message", async function() {
          let request = up.request('/url')

          up.network.abort(request, { reason: 'Given reason' })

          await expectAsync(request).toBeRejectedWith(jasmine.anyError('AbortError', /Given reason/i))
        })

      })

    })

    describe('up.cache.get()', function() {

      it('returns an existing cache entry for the given request', function() {
        const requestAttrs = { url: '/foo', params: { key: 'value' }, cache: true }
        up.request(requestAttrs)
        expect(requestAttrs).toBeCached()
      })

      it('returns undefined if the given request is not cached', function() {
        expect({ url: '/foo' }).not.toBeCached()
      })
    })

    describe('up.cache.set()', function() {
      it('should have tests')
    })

    describe('up.cache.alias()', function() {
      it('uses an existing cache entry for another request (used in case of redirects)', async function() {
        let originalRequest = up.request({ url: '/foo', cache: true })
        let aliasRequest

        await wait()

        expect({ url: '/foo' }).toBeCached()
        expect({ url: '/bar' }).not.toBeCached()

        aliasRequest = up.cache.alias({ url: '/foo' }, { url: '/bar' })
        await wait()

        expect({ url: '/foo' }).toBeCached()
        expect({ url: '/bar' }).toBeCached()
        expect(jasmine.Ajax.requests.count()).toEqual(1)

        jasmine.respondWith('original request response')
        await wait()

        expect(originalRequest.response.text).toBe('original request response')
        expect(aliasRequest.response.text).toBe('original request response')
      })
    })

    describe('up.cache.remove()', function() {

      it('removes the cache entry for the given request')

      it('does nothing if the given request is not cached')
    })

    describe('up.cache.evict()', function() {

      it('removes all cache entries', async function() {
        up.request({ url: '/foo', cache: true })
        expect({ url: '/foo' }).toBeCached()
        up.cache.evict()
        expect({ url: '/foo' }).not.toBeCached()
      })

      it('it does not crash if the cache is evicted before a caching request starts loading (bugfix)', async function() {
        up.request({ url: '/foo', cache: true })
        up.cache.evict()

        await wait()

        jasmine.respondWith('content')

        await wait()

        expect({ url: '/foo' }).toBeCached()
      })

      it('accepts an URL pattern that determines which entries are purged', function() {
        up.request({ url: '/foo/1', cache: true })
        up.request({ url: '/foo/2', cache: true })
        up.request({ url: '/bar/1', cache: true })
        expect({ url: '/foo/1' }).toBeCached()
        expect({ url: '/foo/2' }).toBeCached()
        expect({ url: '/bar/1' }).toBeCached()

        up.cache.evict('/foo/*')

        expect({ url: '/foo/1' }).not.toBeCached()
        expect({ url: '/foo/2' }).not.toBeCached()
        expect({ url: '/bar/1' }).toBeCached()
      })
    })

    describe('up.network.loadPage', function() {

      afterEach(function() {
        // We're preventing the form to be submitted during tests,
        // so we need to remove it manually after each example.
        $('form.up-request-loader').remove()
      })

      describe("for GET requests", function() {

        it("creates a GET form, adds all { params } as hidden fields and submits the form", function() {
          const submitForm = spyOn(up.browser, 'submitForm')
          up.network.loadPage({
            url: '/foo',
            method: 'GET',
            params: { param1: 'param1 value', param2: 'param2 value' }
          })
          expect(submitForm).toHaveBeenCalled()

          const $form = $('form.up-request-loader')

          expect($form).toBeAttached()
          // GET forms cannot have an URL with a query section in their [action] attribute.
          // The query section would be overridden by the serialized input values on submission.
          expect($form.attr('action')).toMatchURL('/foo')

          expect($form.find('input[name="param1"][value="param1 value"]')).toBeAttached()
          expect($form.find('input[name="param2"][value="param2 value"]')).toBeAttached()
        })

        it('merges params from the given URL and the { params } option', function() {
          const submitForm = spyOn(up.browser, 'submitForm')
          up.network.loadPage({ url: '/foo?param1=param1%20value', method: 'GET', params: { param2: 'param2 value' } })
          expect(submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          expect($form).toBeAttached()
          // GET forms cannot have an URL with a query section in their [action] attribute.
          // The query section would be overridden by the serialized input values on submission.
          expect($form.attr('action')).toMatchURL('/foo')
          expect($form.find('input[name="param1"][value="param1 value"]')).toBeAttached()
          expect($form.find('input[name="param2"][value="param2 value"]')).toBeAttached()
        })
      })

      describe("for POST requests", function() {

        it("creates a POST form, adds all { params } params as hidden fields and submits the form", function() {
          const submitForm = spyOn(up.browser, 'submitForm')
          up.network.loadPage({
            url: '/foo',
            method: 'POST',
            params: { param1: 'param1 value', param2: 'param2 value' }
          })
          expect(submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          expect($form).toBeAttached()
          expect($form.attr('action')).toMatchURL('/foo')
          expect($form.attr('method')).toEqual('POST')
          expect($form.find('input[name="param1"][value="param1 value"]')).toBeAttached()
          expect($form.find('input[name="param2"][value="param2 value"]')).toBeAttached()
        })

        it('merges params from the given URL and the { params } option', function() {
          const submitForm = spyOn(up.browser, 'submitForm')
          up.network.loadPage({ url: '/foo?param1=param1%20value', method: 'POST', params: { param2: 'param2 value' } })
          expect(submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          expect($form).toBeAttached()
          expect($form.attr('action')).toMatchURL('/foo')
          expect($form.attr('method')).toEqual('POST')
          expect($form.find('input[name="param1"][value="param1 value"]')).toBeAttached()
          expect($form.find('input[name="param2"][value="param2 value"]')).toBeAttached()
        })

        it('uses the given { contentType }', function() {
          const submitForm = spyOn(up.browser, 'submitForm')
          up.network.loadPage({
            url: '/foo',
            method: 'POST',
            params: { foo: 'bar' },
            contentType: 'multipart/form-data'
          })
          expect(submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          expect($form).toBeAttached()
          expect($form.attr('enctype')).toEqual('multipart/form-data')
        })
      })

      u.each(['PUT', 'PATCH', 'DELETE'], function(method) {
        describe(`for ${method} requests`, function() {
          it("uses a POST form and sends the actual method as a { _method } param", function() {
            const submitForm = spyOn(up.browser, 'submitForm')
            up.network.loadPage({ url: '/foo', method })
            expect(submitForm).toHaveBeenCalled()
            const $form = $('form.up-request-loader')
            expect($form).toBeAttached()
            expect($form.attr('method')).toEqual('POST')
            expect($form.find('input[name="_method"]').val()).toEqual(method)
          })
        })
      })

      describe('CSRF', function() {

        beforeEach(function() {
          up.protocol.config.csrfToken = () => 'csrf-token'
          up.protocol.config.csrfParam = () => 'csrf-param'
          this.submitForm = spyOn(up.browser, 'submitForm')
        })

        it('submits an CSRF token as another hidden field', function() {
          up.network.loadPage({ url: '/foo', method: 'post' })
          expect(this.submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          const $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).toBeAttached()
          expect($tokenInput.val()).toEqual('csrf-token')
        })

        it('does not add a CSRF token if there is none', function() {
          up.protocol.config.csrfToken = () => ''
          up.network.loadPage({ url: '/foo', method: 'post' })
          expect(this.submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          const $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).not.toBeAttached()
        })

        it('does not add a CSRF token for GET requests', function() {
          up.network.loadPage({ url: '/foo', method: 'get' })
          expect(this.submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          const $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).not.toBeAttached()
        })

        it('does not add a CSRF token when loading content from another domain', function() {
          up.network.loadPage({ url: 'http://other-domain.tld/foo', method: 'get' })
          expect(this.submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          const $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).not.toBeAttached()
        })
      })
    })

    describe('up.network.isBusy()', function() {

      it('returns true while a request is loading')

      it('returns true in the same microtask that scheduled a request')

      it('returns false before any requests have been schedule')

      it('returns false after all requests succeeded')

      it('returns false after all requests failed')

    })

  })

  describe('unobtrusive behavior', function() {

    describe('progress bar', function() {

      it('shows an animated progress when requests are late', async function() {
        up.network.config.lateDelay = 200
        let lastWidth = null

        up.request('/slow')
        await wait(100)

        expect(document).not.toHaveSelector('up-progress-bar')

        await wait(200)
        expect(document).toHaveSelector('up-progress-bar')
        const bar = document.querySelector('up-progress-bar')
        lastWidth = parseFloat(getComputedStyle(bar).width)

        await wait(500)
        expect(document).toHaveSelector('up-progress-bar')
        const newBar = document.querySelector('up-progress-bar')
        const newWidth = parseFloat(getComputedStyle(newBar).width)
        expect(newWidth).toBeGreaterThan(lastWidth)

        jasmine.respondWith('response')

        await wait(500)
        expect(document).not.toHaveSelector('up-progress-bar')
      })

      it('shows no progress bar when requests finish fast enough', async function() {
        up.network.config.lateDelay = 300

        up.request('/slow')
        await wait(100)

        expect(document).not.toHaveSelector('up-progress-bar')
        jasmine.respondWith('response')

        await wait(300)
        expect(document).not.toHaveSelector('up-progress-bar')
      })

      it('delays removal of the progress bar as more pending requests become late')

      it('does not show a progress bar with up.network.config.progressBar = false', async function() {
        up.network.config.lateDelay = 10
        up.network.config.progressBar = false
        up.request('/slow')
        await wait(100)

        expect(document).not.toHaveSelector('up-progress-bar')
      })

      if (up.migrate.loaded) {

        it('does not show a progress bar when an up:network:late listener is registered', async function() {
          up.network.config.lateDelay = 30
          up.on('up:network:late', () => console.log("custom loading indicator"))
          up.request('/slow')
          await wait(100)

          expect(document).not.toHaveSelector('up-progress-bar')
        })

        it('shows a progress bar when no up:network:late listener is registered', async function() {
          up.network.config.lateDelay = 10
          up.request('/slow')
          await wait(100)

          expect(document).toHaveSelector('up-progress-bar')
        })

      } else {

        it('shows a progress bar even when an up:network:late listener is registered', async function() {
          up.network.config.lateDelay = 10
          up.request('/slow')

          up.on('up:network:late', () => console.log("custom loading indicator"))
          await wait(100)

          expect(document).toHaveSelector('up-progress-bar')
        })
      }

    })

  })

})

