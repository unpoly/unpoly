const u = up.util

extendDescribe('up.network', function() {

  extendDescribe('JavaScript functions', function() {

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
              await wait(70)

              expect(request).not.toHaveRecursiveValue(u.isElement)
            })

            it('does not keep element references in the up.Response object', async function() {
              let request = up.request('/foo', { cache: true, layer: 'current', target: 'body', origin: document.body })

              await wait()

              jasmine.respondWith('response text')
              let response = await request

              // Eviction is delayed by 1 task so event listeners can still observe the properties we're about to evict
              await wait(70)

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

      require('./network_request_cache_spec')

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

          jasmine.respondWith('first response', { request: 0 })
          await wait()

          expect(responses).toEqual(['first response'])
          expect(jasmine.Ajax.requests.count()).toEqual(2)
          await wait()

          jasmine.respondWith('second response', { request: 1 })
          await wait()

          expect(responses).toEqual(['first response', 'second response'])
        })
      })

      describe('up:request:load event', function() {

        it('emits the event before the request touches the network', async function() {
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

        it('allows listeners to prevent the request from loading', async function() {
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

        it('does not block the queue when the event was prevented', async function() {
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

          await wait()

          expect(listener.calls.count()).toBe(2)
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().url).toMatchURL('/path2')
        })

        it('allows listeners to add a request header', async function() {
          const listener = (event) => event.request.headers['X-From-Listener'] = 'foo'

          up.on('up:request:load', listener)

          up.request('/path1')
          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-From-Listener']).toEqual('foo')
        })

        it('allows listeners to add request params for a POST request', async function() {
          const listener = (event) => event.request.params.set('key', 'value')

          up.on('up:request:load', listener)

          up.request('/path1', { method: 'post' })
          await wait()

          expect(jasmine.lastRequest().data()).toMatchParams({ key: 'value' })
        })

        it('allows listeners to add request params for a GET request, which are moved to the URL before connecting', async function() {
          const listener = (event) => event.request.params.set('key3', 'value3')

          up.on('up:request:load', listener)

          up.request('/path1?key1=value1', { params: { key2: 'value2' }, method: 'get' })
          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/path1?key1=value1&key2=value2&key3=value3')

          expect(jasmine.lastRequest().data()).toMatchParams({})
        })

        // Specs for up.network ensure that changing params will re-index a cached requests

        it('allows listeners to change the request URL', async function() {
          const listener = (event) => event.request.url = '/other'

          up.on('up:request:load', listener)

          up.request('/original')
          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/other')
        })

        // Specs for up.network ensure that changing the URL will re-index a cached requests

        it('allows listeners to access the xhr request object', async function() {
          const listener = jasmine.createSpy('listener').and.callFake(function(event) {
            expect(jasmine.Ajax.requests.count()).toEqual(0)
            expect(event.request.xhr).toBeDefined()
          })

          up.on('up:request:load', listener)

          up.request('/path1', { method: 'post' })
          await wait()

          expect(listener.calls.count()).toBe(1)
          expect(jasmine.Ajax.requests.count()).toEqual(1)
        })
      })
    })

  })

})
