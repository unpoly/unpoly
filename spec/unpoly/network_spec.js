const u = up.util
const $ = jQuery

describe('up.network', function() {

  describe('JavaScript functions', function() {

    require('./network_request_spec')

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

        await wait(80)
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

        await wait(80)
        expect(lateListener).toHaveBeenCalled()
      })

      it('honors an up.request({ lateDelay }) option', async function() {
        up.network.config.lateDelay = 5
        let lateListener = jasmine.createSpy('up:network:late listener')
        up.on('up:network:late', lateListener)

        up.request({ url: '/foo', lateDelay: 70 })
        await wait(40)

        expect(lateListener).not.toHaveBeenCalled()
        await wait(80)

        expect(lateListener).toHaveBeenCalled()
      })

      it('never emits an up:network:late event for requests with { lateDelay: false }', async function() {
        up.network.config.lateDelay = 5
        let lateListener = jasmine.createSpy('up:network:late listener')
        up.on('up:network:late', lateListener)

        up.request({ url: '/foo', lateDelay: false })
        await wait(80)

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

        await wait(50)

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

        await wait(50)

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
        await wait(25)

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
        await wait(20)

        jasmine.clock().tick(30)
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
        await wait(25)

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
        await wait(25)

        expect(this.events).toEqual([
          'up:request:load',
          'up:network:late',
          'up:request:offline',
          'up:network:recover'
        ])
      })

      it('delays up:network:recover until the foreground queue is completely empty', async function() {
        up.network.config.lateDelay = 60

        // Make a chain of requests, like a queued watcher diff.
        let request1, request2
        request1 = up.request('/path1')
        request1.then(() => request2 = up.request('/path2'))

        await wait()

        expect(this.events).toEqual([
          'up:request:load'
        ])

        await wait(110)
        expect(this.events).toEqual([
          'up:request:load',
          'up:network:late',
        ])

        jasmine.respondWith('response 1')
        await wait(25)

        expect(this.events).toEqual([
          'up:request:load',
          'up:network:late',
          'up:request:loaded',
          'up:request:load',
        ])

        jasmine.respondWith('response 2')
        await wait(25)

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

      it('returns an existing cache entry for a known location, but with an added #hash', function() {
        up.request({ url: '/foo', cache: true })
        expect({ url: '/foo#hash', cache: true }).toBeCached()
      })

      it('returns undefined if the given request is not cached', function() {
        expect({ url: '/foo' }).not.toBeCached()
      })
    })

    describe('up.cache.put()', function() {
      it('should have tests')
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

      it('does not crash if the cache is evicted before a caching request starts loading (bugfix)', async function() {
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

        it('ignores binary entries, as we cannot encode them in form inputs', function() {
          const submitForm = spyOn(up.browser, 'submitForm')
          const params = [
            { name: 'scalar', value: 'scalar-value' },
            { name: 'blob', value: new Blob(['blob-value'], { type: "text/plain" }) },
          ]

          up.network.loadPage({ url: '/endpoint', method: 'POST', params })

          const form = document.querySelector('form.up-request-loader')
          expect(form).toHaveSelector('input[name="scalar"]')
          expect(form).not.toHaveSelector('input[name="blob"]')
          expect(submitForm).toHaveBeenCalled()
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

