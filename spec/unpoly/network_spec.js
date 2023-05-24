/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util
const $ = jQuery

describe('up.network', function() {

  beforeEach(function() {
    // Disable response time measuring for these tests
    up.network.config.preloadEnabled = true
  })

  describe('JavaScript functions', function() {

    describe('up.request()', function() {

      it('makes a request with the given URL and params', function(done) {
        up.request('/foo', {params: {key: 'value'}, method: 'post'})
        u.microtask(function() {
          const request = jasmine.lastRequest()
          expect(request.url).toMatchURL('/foo')
          expect(request.data()).toEqual({key: ['value']})
          expect(request.method).toEqual('POST')
          done()
        })
      })

      it('also allows to pass the URL as a { url } option instead', function(done) {
        up.request({url: '/foo', params: {key: 'value'}, method: 'post'})
        u.microtask(function() {
          const request = jasmine.lastRequest()
          expect(request.url).toMatchURL('/foo')
          expect(request.data()).toEqual({key: ['value']})
          expect(request.method).toEqual('POST')
          done()
        })
      })

//      it 'allows to pass in an up.Request instance instead of an options object', ->
//        requestArg = new up.Request(url: '/foo', params: { key: 'value' }, method: 'post')
//        up.request(requestArg)
//
//        jasmineRequest = @lastRequest()
//        expect(jasmineRequest.url).toMatchURL('/foo')
//        expect(jasmineRequest.data()).toEqual(key: ['value'])
//        expect(jasmineRequest.method).toEqual('POST')

      it('resolves to a Response object that contains information about the response and request', function(done) {
        const promise = up.request({
          url: '/url',
          params: {key: 'value'},
          method: 'post',
          target: '.target'
        })

        u.task(() => {
          this.respondWith({
            status: 201,
            responseText: 'response-text'
          })

          promise.then(function (response) {
            expect(response.request.url).toMatchURL('/url')
            expect(response.request.params).toEqual(new up.Params({key: 'value'}))
            expect(response.request.method).toEqual('POST')
            expect(response.request.target).toEqual('.target')
            expect(response.request.hash).toBeBlank()

            expect(response.url).toMatchURL('/url'); // If the server signaled a redirect with X-Up-Location, this would be reflected here
            expect(response.method).toEqual('POST'); // If the server sent a X-Up-Method header, this would be reflected here
            expect(response.text).toEqual('response-text')
            expect(response.status).toEqual(201)
            expect(response.xhr).toBePresent()

            done()
          })
        })
      })

      it('resolves to a Response that contains the response headers', function(done) {
        const promise = up.request({url: '/url'})

        u.task(() => {
          this.respondWith({
            responseHeaders: {'foo': 'bar', 'baz': 'bam'},
            responseText: 'hello'
          })
        })

        promise.then(function (response) {
          expect(response.header('foo')).toEqual('bar')

          // Lookup is case-insensitive
          expect(response.header('BAZ')).toEqual('bam')

          done()
        })
      })

      it("preserves the URL hash in a separate { hash } property, since although it isn't sent to server, code might need it to process the response", function(done) {
        const promise = up.request('/url#hash')

        u.task(() => {
          const request = this.lastRequest()
          expect(request.url).toMatchURL('/url')

          this.respondWith('response-text')

          promise.then(function (response) {
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
          const headers = this.lastRequest().requestHeaders
          expect(headers['X-Requested-With']).toBeMissing()
          done()
        })
      })

      it('does not touch the network if a request is scheduled and aborted within the same microtask', function(done) {
        let request = up.request('/url')
        up.network.abort()

        promiseState(request).then(function (result) {
          expect(result.state).toBe('rejected')
          expect(result.value).toBeAbortError()
          expect(jasmine.Ajax.requests.count()).toBe(0)
          done()
        })
      })

      describe('transfer of meta attributes', function() {

        it("sends Unpoly's version as an X-Up-Version request header", asyncSpec(function(next) {
          up.request({url: '/foo'})

          next(() => {
            const versionHeader = this.lastRequest().requestHeaders['X-Up-Version']
            expect(versionHeader).toBePresent()
            expect(versionHeader).toEqual(up.version)
          })
        }))

        it('submits information about the fragment update as HTTP headers, so the server may choose to optimize its responses', asyncSpec(function(next) {
          makeLayers(2)

          up.request({
            url: '/foo',
            target: '.target',
            layer: 'overlay',
            failTarget: '.fail-target',
            failLayer: 'root'
          })

          next(() => {
            const request = this.lastRequest()
            expect(request.requestHeaders['X-Up-Target']).toEqual('.target')
            expect(request.requestHeaders['X-Up-Fail-Target']).toEqual('.fail-target')
            expect(request.requestHeaders['X-Up-Mode']).toEqual('modal')
            expect(request.requestHeaders['X-Up-Fail-Mode']).toEqual('root')
          })
        }))

        it ('does not transmit missing meta attributes as X-Up-prefixed headers', function(done) {
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
            {mode: 'root', context: {rootKey: 'rootValue'}},
            {mode: 'drawer', context: {drawerKey: 'drawerValue'}}
          ])

          const request = up.request({url: '/foo', layer: 'root', failLayer: 'front'})
          expect(request.mode).toEqual('root')
          expect(request.failMode).toEqual('drawer')
          expect(request.context).toEqual({rootKey: 'rootValue'})
          expect(request.failContext).toEqual({drawerKey: 'drawerValue'})
        })

        it('does not associate the request with the current layer if no { target, origin, layer } options are given', function() {
          const request = up.request({url: '/foo'})
          expect(request.layer).toBeUndefined()
          expect(request.mode).toBeUndefined()
          expect(request.context).toBeUndefined()
        })

        it('allows to quickly construct a cacheable up.Request by passing an { origin } option', function() {
          makeLayers([
            {mode: 'root', context: {rootKey: 'rootValue'}},
            {mode: 'drawer', context: {drawerKey: 'drawerValue'}}
          ])

          const request = up.request({url: '/foo', origin: up.layer.front.element})
          expect(request.mode).toEqual('drawer')
          expect(request.failMode).toEqual('drawer')
          expect(request.context).toEqual({drawerKey: 'drawerValue'})
          expect(request.failContext).toEqual({drawerKey: 'drawerValue'})
        })

        it('assumes no layer if neither { layer, failLayer, origin } are given', function() {
          makeLayers([
            {mode: 'root', context: {rootKey: 'rootValue'}},
            {mode: 'drawer', context: {drawerKey: 'drawerValue'}}
          ])

          const request = up.request({url: '/foo'})
          expect(request.mode).toBeUndefined()
          expect(request.failMode).toBeUndefined()
          expect(request.context).toBeUndefined()
          expect(request.failContext).toBeUndefined()
        })

      })

      describe('error handling', function() {

        it('rejects with up.Offline when there was a network error', function(done) {
          const request = up.request('/url')

          u.task(() => {
            this.lastRequest().responseError()

            promiseState(request).then(function (result) {
              expect(result.state).toEqual('rejected')
              expect(result.value.name).toEqual('up.Offline')
              expect(result.value.message).toMatch(/Network error/i)
              done()
            })
          })
        })

        it('rejects with a non-ok up.Response when the server sends a 404 status code', function(done) {
          const request = up.request('/url')

          u.task(() => {
            this.respondWith('text', {status: 404})

            promiseState(request).then(function (result) {
              expect(result.state).toEqual('rejected')
              expect(result.value).toEqual(jasmine.any(up.Response))
              expect(result.value.status).toEqual(404)
              expect(result.value.ok).toEqual(false)
              done()
            })
          })
        })

        it('rejects with a non-ok up.Response when the server sends a 500 status code', function(done) {
          const request = up.request('/url')

          u.task(() => {
            this.respondWith('text', {status: 500})

            promiseState(request).then(function (result) {
              expect(result.state).toEqual('rejected')
              expect(result.value).toEqual(jasmine.any(up.Response))
              expect(result.value.status).toEqual(500)
              expect(result.value.ok).toEqual(false)
              done()
            })
          })
        })

        describe('with { timeout } option', function() {

          it('rejects with up.Offline when the request times out', function(done) {
            const request = up.request('/url')

            u.task(() => {
              jasmine.clock().install(); // required by responseTimeout()
              this.lastRequest().responseTimeout()

              promiseState(request).then(function (result) {
                expect(result.state).toEqual('rejected')
                expect(result.value.name).toEqual('up.Offline')
                expect(result.value.message).toMatch(/time ?out/i)
                done()
              })
            })
          })

          it('uses a default timeout from up.network.config.timeout', function() {
            up.network.config.timeout = 456789
            const request = up.request('/url')
            expect(request.timeout).toBe(456789)
          })

        })

      })

      describe('when the server responds with an X-Up-Method header', function() {

        it('updates the { method } property in the response object', function (done) {
          const promise = up.request({
            url: '/url',
            params: { key: 'value' },
            method: 'post',
            target: '.target'
          })

          u.task(() => {
            this.respondWith({
              responseHeaders: {
                'X-Up-Location': '/redirect',
                'X-Up-Method': 'GET'
              }
            })

            promise.then(function (response) {
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
            this.respondWith({
              responseHeaders: {
                'X-Up-Location': '/response-url'
              }
            })

            promise.then(function (response) {
              expect(response.request.url).toMatchURL('/request-url')
              expect(response.request.hash).toEqual('#request-hash')
              expect(response.url).toMatchURL('/response-url')
              done()
            })
          })
        })

        describe('when caching', function() {

          it('considers a redirection URL an alias for the requested URL', asyncSpec(function(next) {
            up.request('/foo', {cache: true})

            next(() => {
              expect(jasmine.Ajax.requests.count()).toEqual(1)
              this.respondWith({
                responseHeaders: {
                  'X-Up-Location': '/bar',
                  'X-Up-Method': 'GET'
                }
              })
            })

            next(() => {
              up.request('/bar', {cache: true})
            })

            next(() => {
              // See that the cached alias is used and no additional requests are made
              expect(jasmine.Ajax.requests.count()).toEqual(1)
            })
          }))

          it('does not considers a redirection URL an alias for the requested URL if the original request was never cached', asyncSpec(function(next) {
            up.request('/foo', {cache: false}); // POST requests are not cached

            next(() => {
              expect(jasmine.Ajax.requests.count()).toEqual(1)
              this.respondWith({
                responseHeaders: {
                  'X-Up-Location': '/bar',
                  'X-Up-Method': 'GET'
                }
              })
            })

            next(() => {
              up.request('/bar', {cache: true})
            })

            next(() => {
              // See that an additional request was made
              expect(jasmine.Ajax.requests.count()).toEqual(2)
            })
          }))

          it('does not considers a redirection URL an alias for the requested URL if the response returned a non-200 status code', asyncSpec(function(next) {
            up.request('/foo', {cache: true})

            next(() => {
              expect(jasmine.Ajax.requests.count()).toEqual(1)
              this.respondWith({
                responseHeaders: {
                  'X-Up-Location': '/bar',
                  'X-Up-Method': 'GET'
                },
                status: 500
              })
            })

            next(() => {
              up.request('/bar', {cache: true})
            })

            next(() => {
              // See that an additional request was made
              expect(jasmine.Ajax.requests.count()).toEqual(2)
            })
          }))
        })

        if (FormData.prototype.entries) {

          it("does not explode if the original request's { params } is a FormData object", asyncSpec(function(next) {
            up.request('/foo', {method: 'post', params: new FormData()}); // POST requests are not cached

            next(() => {
              expect(jasmine.Ajax.requests.count()).toEqual(1)
              this.respondWith({
                responseHeaders: {
                  'X-Up-Location': '/bar',
                  'X-Up-Method': 'GET'
                }
              })
            })

            next(() => {
              this.secondAjaxPromise = up.request('/bar')
            })

            next.await(() => {
              return promiseState(this.secondAjaxPromise).then(result => // See that the promise was not rejected due to an internal error.
                expect(result.state).toEqual('pending'))
            })
          }))
        }

      })

      // All browsers except IE11 make the response URL available through `xhr.responseURL`.
      describe('when the XHR object has a { responseURL } property', function() {

        it('sets the { url } property on the response object', function(done) {
          const promise = up.request('/request-url#request-hash')

          u.task(() => {
            this.respondWith({
              responseURL: '/response-url'
            })

            promise.then(function (response) {
              expect(response.request.url).toMatchURL('/request-url')
              expect(response.request.hash).toEqual('#request-hash')
              expect(response.url).toMatchURL('/response-url')
              done()
            })
          })
        })

        it("assumes a response method of GET if the { reponseURL } is not the request URL", function(done) {
          const promise = up.request('/request-url', {method: 'post'})

          u.task(() => {
            this.respondWith({
              responseURL: '/response-url'
            })

            promise.then(function (response) {
              expect(response.url).toMatchURL('/response-url')
              expect(response.method).toEqual('GET')
              done()
            })
          })
        })

        it("assumes the method did not change if if the { reponseURL } equals the request's URL", function(done) {
          const promise = up.request('/request-url', {method: 'post'})

          u.task(() => {
            this.respondWith({
              responseURL: '/request-url'
            })

            promise.then(function (response) {
              expect(response.url).toMatchURL('/request-url')
              expect(response.method).toEqual('POST')
              done()
            })
          })
        })

        it("sets the { method } to an X-Up-Method header, even if if the { reponseURL } equals the request's URL", function(done) {
          const promise = up.request('/request-url', {method: 'post'})

          u.task(() => {
            this.respondWith({
              responseURL: '/request-url',
              responseHeaders: {'X-Up-Method': 'GET'}
            })

            promise.then(function (response) {
              expect(response.url).toMatchURL('/request-url')
              expect(response.method).toEqual('GET')
              done()
            })
          })
        })

        describe('when caching', function() {

          it('considers a redirection URL an alias for the requested URL', asyncSpec(function(next) {
            up.request('/foo', {cache: true})

            next(() => {
              expect(jasmine.Ajax.requests.count()).toEqual(1)
              this.respondWith({responseURL: '/bar'})
            })

            next(() => {
              up.request('/bar', {cache: true})
            })

            next(() => {
              // See that the cached alias is used and no additional requests are made
              expect(jasmine.Ajax.requests.count()).toEqual(1)
            })
          }))

          it('does not consider a redirection URL an alias for the requested URL if the original request was never cached', asyncSpec(function(next) {
            up.request('/foo', {cache: false})

            next(() => {
              expect(jasmine.Ajax.requests.count()).toEqual(1)
              this.respondWith({
                responseURL: '/bar'
              })
            })

            next(() => {
              up.request('/bar', {cache: true})
            })

            next(() => {
              // See that an additional request was made
              expect(jasmine.Ajax.requests.count()).toEqual(2)
            })
          }))

          it('does not consider a redirection URL an alias for the requested URL if the response returned a non-200 status code', asyncSpec(function(next) {
            up.request('/foo', {cache: true})

            next(() => {
              expect(jasmine.Ajax.requests.count()).toEqual(1)
              this.respondWith({
                responseURL: '/bar',
                status: 500
              })
            })

            next(() => {
              up.request('/bar', {cache: true})
            })
          }))

        })

      })

      describe('CSRF', function() {

        beforeEach(function() {
          up.protocol.config.csrfHeader = 'csrf-header'
          up.protocol.config.csrfToken = 'csrf-token'
        })

        it('sets a CSRF token in the header', asyncSpec(function(next) {
          up.request('/path', {method: 'post'})
          next(() => {
            const headers = this.lastRequest().requestHeaders
            expect(headers['csrf-header']).toEqual('csrf-token')
          })
        }))

        it('does not add a CSRF token if there is none', asyncSpec(function(next) {
          up.protocol.config.csrfToken = ''
          up.request('/path', {method: 'post'})
          next(() => {
            const headers = this.lastRequest().requestHeaders
            expect(headers['csrf-header']).toBeMissing()
          })
        }))

        it('does not add a CSRF token for GET requests', asyncSpec(function(next) {
          up.request('/path', {method: 'get'})
          next(() => {
            const headers = this.lastRequest().requestHeaders
            expect(headers['csrf-header']).toBeMissing()
          })
        }))

        it('does not add a CSRF token when loading content from another domain', asyncSpec(function(next) {
          up.request('http://other-domain.tld/path', {method: 'post'})
          next(() => {
            const headers = this.lastRequest().requestHeaders
            expect(headers['csrf-header']).toBeMissing()
          })
        }))

      })

      describe('with { params } option', function() {

        it("uses the given params as a non-GET request's payload", asyncSpec(function(next) {
          const givenParams = {'foo-key': 'foo-value', 'bar-key': 'bar-value'}
          up.request({url: '/path', method: 'put', params: givenParams})

          next(() => {
            expect(this.lastRequest().data()['foo-key']).toEqual(['foo-value'])
            expect(this.lastRequest().data()['bar-key']).toEqual(['bar-value'])
          })
        }))

        it("encodes the given params into the URL of a GET request", function(done) {
          const givenParams = {'foo-key': 'foo-value', 'bar-key': 'bar-value'}
          const promise = up.request({url: '/path', method: 'get', params: givenParams})

          u.task(() => {
            expect(this.lastRequest().url).toMatchURL('/path?foo-key=foo-value&bar-key=bar-value')
            expect(this.lastRequest().data()).toBeBlank()

            this.respondWith('response-text')

            promise.then(function (response) {
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

        it('caches server responses for the configured duration', asyncSpec(function(next) {
          up.network.config.cacheEvictAge = 200 // 1 second for test

          const responses = []
          const trackResponse = function(response) {
            responses.push(response.text)
          }

          next(() => {
            up.request({url: '/foo', cache: true}).then(trackResponse)
          })

          next(() => {
            expect(jasmine.Ajax.requests.count()).toEqual(1)
          })

          next.after((10), () => {
            // Send the same request for the same path
            up.request({url: '/foo', cache: true}).then(trackResponse)
          })

          next(() => {
            // See that only a single network request was triggered
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(responses).toEqual([])
          })

          next(() => {
            // Server responds once.
            this.respondWith('foo')
          })

          next(() => {
            // See that both requests have been fulfilled
            expect(responses).toEqual(['foo', 'foo'])
          })

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
          //   this.respondWith('bar')
          // })
          //
          // next(() => {
          //   expect(responses).toEqual(['foo', 'foo', 'bar'])
          // })
        }))

        it('does not cache responses with an error status', asyncSpec(function(next) {
          next(() => up.request({url: '/foo', cache: true}))
          next(() => jasmine.respondWith({status: 500, contentType: 'text/html', responseText: 'foo'}))
          next(() => expect({url: '/foo', cache: true}).not.toBeCached())
        }))

        it('does not cache responses with a status of 304 (Not Modified)', asyncSpec(function(next) {
          next(() => up.request({url: '/foo', cache: true}))
          next(() => jasmine.respondWith({ status: 304 }))
          next(() => expect({ url: '/foo' }).not.toBeCached())
        }))

        it('does not cache responses with a status of 204 (No Content)', asyncSpec(function(next) {
          next(() => up.request({url: '/foo', cache: true}))
          next(() => jasmine.respondWith({ status: 204 }))
          next(() => expect({ url: '/foo' }).not.toBeCached())
        }))

        it('does not cache responses with an empty body', asyncSpec(function(next) {
          next(() => up.request({url: '/foo', cache: true}))
          next(() => jasmine.respondWith({ status: 200, responseText: '', responseHeaders: { 'X-Up-Accept-Layer': "123" } }))
          next(() => expect({ url: '/foo' }).not.toBeCached())
        }))

        it("does not lose a request's #hash when re-using a cached request without a #hash (bugfix)", function() {
          const request1 = up.request({url: '/url#foo', cache: true})
          expect(request1.hash).toEqual('#foo')
          expect({url: '/url#foo'}).toBeCached()

          const request2 = up.request({url: '/url#bar', cache: true})
          expect(request2.hash).toEqual('#bar')
          expect(request1.hash).toEqual('#foo'); // also make sure that the first request was not mutated
          expect({url: '/url#bar'}).toBeCached()
        })

        it('caches requests that change their URL in up:request:load', asyncSpec(function(next) {
          up.on('up:request:load', ({ request }) => request.url = '/changed-path')
          up.request({url: '/original-path', cache: true})

          next(() => {
            expect({url: '/changed-path'}).toBeCached()
          })
        }))

        it('caches GET requests that change their query params in up:request:load', asyncSpec(function(next) {
          up.on('up:request:load', ({ request }) => request.params.add('bar', 'two'))
          up.request({url: '/path?foo=one', cache: true})

          next(() => {
            expect({url: '/path?foo=one&bar=two'}).toBeCached()
          })
        }))

        it('respects a config.cacheSize setting', asyncSpec(function(next) {
            up.network.config.cacheSize = 2
            next(() => up.request({url: '/foo', cache: true}))
            next.after(2, () => up.request({url: '/bar', cache: true}))
            next.after(2, () => up.request({url: '/baz', cache: true}))
            next.after(2, () => up.request({url: '/foo', cache: true}))
            next(() => expect(jasmine.Ajax.requests.count()).toEqual(4))
          })
        )

        describe('matching requests', function() {

          it('reuses a request with the same URL but a different #hash', function () {
            const request1 = up.request({ url: '/url#foo', cache: true })
            expect(request1.hash).toEqual('#foo')
            expect({ url: '/url#foo' }).toBeCached()
            expect({ url: '/url#bar' }).toBeCached()
          })

          it("reuses responses when asked for the same path, but different selectors", asyncSpec(function (next) {
            next(() => up.request({ url: '/path', target: '.a', cache: true }))
            next(() => up.request({ url: '/path', target: '.b', cache: true }))
            next(() => expect(jasmine.Ajax.requests.count()).toEqual(1))
          }))

          describe('Vary response header', function() {
            it("doesn't reuse responses when asked for the same path, but different selectors if the server responded with `Vary: X-Up-Target`", asyncSpec(function (next) {
              next(() => up.request({ url: '/path', target: '.a', cache: true }))
              next(() => jasmine.respondWithSelector('.a', {
                text: 'content',
                responseHeaders: { 'Vary': 'X-Up-Target' }
              }))
              next(() => up.request({ url: '/path', target: '.b', cache: true }))
              next(() => expect(jasmine.Ajax.requests.count()).toEqual(2))
            }))

            it('does reuse responses for the same path and selector if the server responds with `Vary: X-Up-Target` (bugfix)', asyncSpec(function(next) {
              next(() => up.request({ url: '/path', target: '.a', cache: true }))
              next(() => up.request({ url: '/path', target: '.a', cache: true }))
              next(() => {
                expect(jasmine.Ajax.requests.count()).toEqual(1)

                jasmine.respondWithSelector('.a', {
                  text: 'content',
                  responseHeaders: { 'Vary': 'X-Up-Target' }
                })
              })
              next(() => {
                expect(jasmine.Ajax.requests.count()).toEqual(1)
                expect(up.network.isBusy()).toBe(false)
              })
            }))

            it('loads a request that is tracking another request with the same path, but then retroactively becomes a cache miss due to a Vary header', asyncSpec(function(next) {
              next(() => up.request({ url: '/path', target: '.a', cache: true }))
              next(() => up.request({ url: '/path', target: '.b', cache: true }))

              next(() => {
                expect(jasmine.Ajax.requests.count()).toEqual(1)
                expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.a')

                jasmine.respondWithSelector('.a', {
                  text: 'content',
                  responseHeaders: { 'Vary': 'X-Up-Target' }
                })
              })

              next(() => {
                expect(jasmine.Ajax.requests.count()).toEqual(2)
                expect(up.network.isBusy()).toBe(true)
                expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.b')

                jasmine.respondWithSelector('.b', {
                  text: 'content',
                  responseHeaders: { 'Vary': 'X-Up-Target' }
                })
              })

              next(() => {
                expect(jasmine.Ajax.requests.count()).toEqual(2)
                expect(up.network.isBusy()).toBe(false)
              })

            }))

            it('ignores Vary for headers that were set outside Unpoly (e.g. by network infrastructure)', asyncSpec(function(next) {
              next(() => up.request({ url: '/path', target: '.a', cache: true }))

              next(() => up.request({ url: '/path', target: '.b', cache: true }))

              next(() => {
                expect(jasmine.Ajax.requests.count()).toEqual(1)
                expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.a')

                jasmine.respondWithSelector('.a', {
                  text: 'content',
                  responseHeaders: { 'Vary': 'Proxy-Header' }
                })
              })

              next(() => {
                expect(jasmine.Ajax.requests.count()).toEqual(1)
                expect(up.network.isBusy()).toBe(false)
              })
            }))

            it('starts partitioning a method/URL pair once it receives a Vary header', asyncSpec(function(next) {
              next(() => {
                up.request({ url: '/path', target: '.a', cache: true })
              })
              next(() => {
                expect({ url: '/path', target: '.a' }).toBeCached()
                expect({ url: '/path', target: '.b' }).toBeCached()

                jasmine.respondWith("content", { responseHeaders: { Vary: 'X-Up-Target' }})
              })
              next(() => {
                expect({ url: '/path', target: '.a' }).toBeCached()
                expect({ url: '/path', target: '.b' }).not.toBeCached()
                expect({ url: '/path' }).not.toBeCached()

                up.request({ url: '/path', target: '.a', headers: { Custom: 'custom-value' }, cache: true })
              })
            }))
          })

          it("doesn't reuse responses when asked for the same path, but different query params", asyncSpec(function (next) {
            next(() => up.request({ url: '/path', params: { query: 'foo' }, cache: true }))
            next(() => up.request({ url: '/path', params: { query: 'bar' }, cache: true }))
            next(() => expect(jasmine.Ajax.requests.count()).toEqual(2))
          }))

          it("never reuses responses for different paths, even if all other headers match", asyncSpec(function (next) {
            next(() => up.request({ url: '/foo', cache: true, target: '.target' }))
            next(() => up.request({ url: '/bar', cache: true, target: '.target' }))
            next(() => expect(jasmine.Ajax.requests.count()).toEqual(2))
          }))

        })

        describe('with { cache: "auto" }', function() {

          describe('default autoCache behavior', function() {

            u.each(['GET', 'HEAD', 'OPTIONS'], function (safeMethod) {

              it(`caches ${safeMethod} requests`, asyncSpec(function(next) {
                next(() => up.request({url: '/foo', method: safeMethod, cache: 'auto'}))
                next(() => up.request({url: '/foo', method: safeMethod, cache: 'auto'}))
                next(() => expect(jasmine.Ajax.requests.count()).toEqual(1))
              }))

              it(`does not cache ${safeMethod} requests with { cache: false }`, asyncSpec(function(next) {
                next(() => up.request({url: '/foo', method: safeMethod, cache: false}))
                next(() => up.request({url: '/foo', method: safeMethod, cache: false}))
                next(() => expect(jasmine.Ajax.requests.count()).toEqual(2))
              }))
            })

            u.each(['POST', 'PUT', 'DELETE'], function(unsafeMethod) {
              it(`does not cache ${unsafeMethod} requests`, asyncSpec(function(next) {
                next(() => up.request({url: '/foo', method: unsafeMethod, cache: 'auto'}))
                next(() => up.request({url: '/foo', method: unsafeMethod, cache: 'auto'}))
                next(() => expect(jasmine.Ajax.requests.count()).toEqual(2))
              }))
            })
          })

          it('caches the request if up.network.config.autoCache(request) returns true', function() {
            up.network.config.autoCache = request => request.url === '/yes'

            up.request({url: '/yes', cache: 'auto'})

            expect({url: '/yes'}).toBeCached()
          })

          it('does not cache the request if up.network.config.autoCache(request) returns false', function() {
            up.network.config.autoCache = request => request.url === '/yes'

            up.request({url: '/no', cache: 'auto'})

            expect({url: '/no'}).not.toBeCached()
          })
        })
      })

      describe('when there is an existing cache entry and a new request has { cache: false }', function() {

        it('keeps the existing response in the cache while the new request is loading', asyncSpec(function(next) {
          let response = null

          next(() => up.request({url: '/cache-me', cache: true}))

          next(function() {
            expect(up.network.queue.allRequests.length).toBe(1)
            jasmine.respondWith('response text')
          })

          next(function() {
            expect(up.network.queue.allRequests.length).toBe(0)
            up.request({url: '/cache-me', cache: false})
          })

          next(function() {
            expect(up.network.queue.allRequests.length).toBe(1)
            up.request({url: '/cache-me', cache: true}).then(cachedResponse => response = cachedResponse)
          })

          next(function() {
            expect(response).toBeGiven()
            expect(response.text).toEqual('response text')
          })
        }))

        it("updates an existing cache entry with the newer response", asyncSpec(function(next) {
          let response = null

          next(() => up.request({url: '/cache-me', cache: true}))

          next(function() {
            expect(up.network.queue.allRequests.length).toBe(1)
            jasmine.respondWith('old response text')
          })

          next(function() {
            expect(up.network.queue.allRequests.length).toBe(0)
            up.request({url: '/cache-me', cache: false})
          })

          next(function() {
            expect(up.network.queue.allRequests.length).toBe(1)
            jasmine.respondWith('new response text')
          })

          next(() => up.request({url: '/cache-me', cache: true}).then(cachedResponse => response = cachedResponse))

          next(function() {
            expect(response).toBeGiven()
            expect(response.text).toEqual('new response text')
          })
        }))
      })

      describe('cache eviction', function() {

        it('evicts all cache entries with { evictCache: true }', asyncSpec(function (next) {
          up.request({ url: '/foo', cache: true })
          expect({ url: '/foo' }).toBeCached()

          up.request({ url: '/bar', evictCache: true })

          next(() => {
            this.respondWith('foo')
          })

          next(() => {
            expect({ url: '/foo' }).not.toBeCached()
            expect({ url: '/bar' }).not.toBeCached()
          })
        }))

        it('keeps this new request in the cache with { cache: true, evictCache: true }', asyncSpec(function (next) {
          up.request({ url: '/foo', cache: true })
          expect({ url: '/foo' }).toBeCached()

          up.request({ url: '/bar', cache: true, evictCache: true })

          next(() => {
            this.respondWith('foo')
          })

          next(() => {
            expect({ url: '/foo' }).not.toBeCached()
            expect({ url: '/bar' }).toBeCached()
          })
        }))

        it('accepts an URL pattern as { evictCache } option', asyncSpec(function (next) {
          up.request({ url: '/foo/1', cache: true })
          up.request({ url: '/foo/2', cache: true })
          up.request({ url: '/bar/1', cache: true })

          expect({ url: '/foo/1' }).toBeCached()
          expect({ url: '/foo/2' }).toBeCached()
          expect({ url: '/bar/1' }).toBeCached()

          up.request({ url: '/other', evictCache: '/foo/*' })

          next(() => {
            expect(jasmine.Ajax.requests.count()).toEqual(4)

            this.respondWith({
              status: 200,
              contentType: 'text/html',
              responseText: 'foo'
            })
          })

          next(function () {
            expect({ url: '/foo/1' }).not.toBeCached()
            expect({ url: '/foo/2' }).not.toBeCached()
            expect({ url: '/bar/1' }).toBeCached()
          })
        }))

        it('accepts an function as { evictCache } option', asyncSpec(function(next) {
          up.request({ url: '/foo/1', cache: true })
          up.request({ url: '/foo/2', cache: true })
          up.request({ url: '/bar/1', cache: true })

          expect({ url: '/foo/1' }).toBeCached()
          expect({ url: '/foo/2' }).toBeCached()
          expect({ url: '/bar/1' }).toBeCached()

          let evictCache = (request) => request.url.indexOf('/foo/') === 0
          up.request({ url: '/other', evictCache })

          next(() => {
            expect(jasmine.Ajax.requests.count()).toEqual(4)

            this.respondWith({
              status: 200,
              contentType: 'text/html',
              responseText: 'foo'
            })
          })

          next(function () {
            expect({ url: '/foo/1' }).not.toBeCached()
            expect({ url: '/foo/2' }).not.toBeCached()
            expect({ url: '/bar/1' }).toBeCached()
          })
        }))

        it('lets the server send an URL pattern as X-Up-Evict-Cache response header', asyncSpec(function(next) {
          up.request({ url: '/foo/1', cache: true })
          up.request({ url: '/foo/2', cache: true })
          up.request({ url: '/bar/1', cache: true })

          expect({ url: '/foo/1' }).toBeCached()
          expect({ url: '/foo/2' }).toBeCached()
          expect({ url: '/bar/1' }).toBeCached()

          up.request({ url: '/other' })

          next(() => {
            expect(jasmine.Ajax.requests.count()).toEqual(4)

            this.respondWith({
              status: 200,
              contentType: 'text/html',
              responseText: 'foo',
              responseHeaders: { 'X-Up-Evict-Cache': '/foo/*' }
            })
          })

          next(function () {
            expect({ url: '/foo/1' }).not.toBeCached()
            expect({ url: '/foo/2' }).not.toBeCached()
            expect({ url: '/bar/1' }).toBeCached()
          })
        }))

        it('evicts the entire cache if the server responds with an X-Up-Evict-Cache: * header', asyncSpec(function(next) {
          up.request({url: '/foo', cache: true})
          up.request({url: '/bar', cache: true})
          expect({url: '/foo'}).toBeCached()
          expect({url: '/bar'}).toBeCached()

          up.request({url: '/baz'})

          next(() => {
            expect(jasmine.Ajax.requests.count()).toEqual(3)

            this.respondWith({
              status: 200,
              contentType: 'text/html',
              responseText: 'foo',
              responseHeaders: {'X-Up-Evict-Cache': '*'}
            })
          })

          next(function() {
            expect({url: '/foo'}).not.toBeCached()
            expect({url: '/bar'}).not.toBeCached()
          })
        }))


        it('defaults to a rule in up.network.config.evictCache() if neither request nor server set a { evictCache } option', asyncSpec(function (next) {
          up.network.config.evictCache = function (request, response) {
            expect(request).toEqual(jasmine.any(up.Request))
            expect(response).toEqual(jasmine.any(up.Response))

            if (request.url === '/baz') {
              return '/foo'
            }
          }

          up.request({ url: '/foo', cache: true })
          up.request({ url: '/bar', cache: true })
          up.request({ url: '/baz', cache: true })

          expect({ url: '/foo' }).toBeCached()
          expect({ url: '/bar' }).toBeCached()
          expect({ url: '/baz' }).toBeCached()

          next(() => jasmine.Ajax.requests.at(0).respondWith({ status: 200, responseText: 'foo response' }))

          next(function () {
            expect({ url: '/foo' }).toBeCached()
            expect({ url: '/bar' }).toBeCached()
            expect({ url: '/baz' }).toBeCached()

            jasmine.Ajax.requests.at(1).respondWith({ status: 200, responseText: 'bar response' })
          })

          next(function () {
            expect({ url: '/foo' }).toBeCached()
            expect({ url: '/bar' }).toBeCached()
            expect({ url: '/baz' }).toBeCached()

            jasmine.Ajax.requests.at(2).respondWith({ status: 200, responseText: 'baz response' })
          })

          next(function () {
            // Only the URL pattern returned by config.evictCache() is evicted
            expect({ url: '/foo' }).not.toBeCached()
            expect({ url: '/bar' }).toBeCached()
            expect({ url: '/baz' }).toBeCached()
          })
        }))

      })

      describe('cache expiration', function() {

        it('expires all cache entries with { expireCache: true }', asyncSpec(function (next) {
          up.request({ url: '/foo', cache: true })
          expect({ url: '/foo' }).toBeCached()

          up.request({ url: '/bar', expireCache: true })

          next(() => {
            this.respondWith('foo')
          })

          next(() => {
            expect({ url: '/foo' }).toBeExpired()
          })
        }))

        it('keeps a fresh cache entry for this new request with { cache: true, expireCache: true }', asyncSpec(function (next) {
          up.request({ url: '/foo', cache: true })
          expect({ url: '/foo' }).toBeCached()

          up.request({ url: '/bar', cache: true, expireCache: true })

          next(() => {
            this.respondWith('bar')
          })

          next(() => {
            expect({ url: '/foo' }).toBeExpired()
            expect({ url: '/bar' }).toBeCached()
            expect({ url: '/bar' }).not.toBeExpired()
          })
        }))

        it('accepts an URL pattern as { expireCache } option', asyncSpec(function (next) {
          up.request({ url: '/foo/1', cache: true })
          up.request({ url: '/foo/2', cache: true })
          up.request({ url: '/bar/1', cache: true })

          expect({ url: '/foo/1' }).toBeCached()
          expect({ url: '/foo/2' }).toBeCached()
          expect({ url: '/bar/1' }).toBeCached()

          up.request({ url: '/other', expireCache: '/foo/*' })

          next(() => {
            expect(jasmine.Ajax.requests.count()).toEqual(4)

            this.respondWith({
              status: 200,
              contentType: 'text/html',
              responseText: 'foo'
            })
          })

          next(function () {
            expect({ url: '/foo/1' }).toBeExpired()
            expect({ url: '/foo/2' }).toBeExpired()
            expect({ url: '/bar/1' }).not.toBeExpired()
          })
        }))

        it('accepts an function as { expireCache } option', asyncSpec(function(next) {
          up.request({ url: '/foo/1', cache: true })
          up.request({ url: '/foo/2', cache: true })
          up.request({ url: '/bar/1', cache: true })

          expect({ url: '/foo/1' }).toBeCached()
          expect({ url: '/foo/2' }).toBeCached()
          expect({ url: '/bar/1' }).toBeCached()

          let expireCache = (request) => request.url.indexOf('/foo/') === 0
          up.request({ url: '/other', expireCache })

          next(() => {
            expect(jasmine.Ajax.requests.count()).toEqual(4)

            this.respondWith({
              status: 200,
              contentType: 'text/html',
              responseText: 'foo'
            })
          })

          next(function () {
            expect({ url: '/foo/1' }).toBeExpired()
            expect({ url: '/foo/2' }).toBeExpired()
            expect({ url: '/bar/1' }).not.toBeExpired()
          })
        }))

        it('lets the server send an URL pattern as X-Up-Expire-Cache response header', asyncSpec(function(next) {
          up.request({ url: '/foo/1', cache: true })
          up.request({ url: '/foo/2', cache: true })
          up.request({ url: '/bar/1', cache: true })

          expect({ url: '/foo/1' }).toBeCached()
          expect({ url: '/foo/2' }).toBeCached()
          expect({ url: '/bar/1' }).toBeCached()

          up.request({ url: '/other' })

          next(() => {
            expect(jasmine.Ajax.requests.count()).toEqual(4)

            this.respondWith({
              status: 200,
              contentType: 'text/html',
              responseText: 'foo',
              responseHeaders: { 'X-Up-Expire-Cache': '/foo/*' }
            })
          })

          next(function () {
            expect({ url: '/foo/1' }).toBeExpired()
            expect({ url: '/foo/2' }).toBeExpired()
            expect({ url: '/bar/1' }).not.toBeExpired()
          })
        }))

        it('expires the entire cache if the server responds with an X-Up-Expire-Cache: * header', asyncSpec(function(next) {
          up.request({url: '/foo', cache: true})
          up.request({url: '/bar', cache: true})
          expect({url: '/foo'}).toBeCached()
          expect({url: '/bar'}).toBeCached()

          up.request({url: '/baz'})

          next(() => {
            expect(jasmine.Ajax.requests.count()).toEqual(3)

            this.respondWith({
              status: 200,
              contentType: 'text/html',
              responseText: 'foo',
              responseHeaders: {'X-Up-Expire-Cache': '*'}
            })
          })

          next(function() {
            expect({url: '/foo'}).toBeExpired()
            expect({url: '/bar'}).toBeExpired()
          })
        }))


        it('defaults to a rule in up.network.config.expireCache() if neither request nor server set a { expireCache } option', asyncSpec(function (next) {
          up.network.config.expireCache = function (request, response) {
            expect(request).toEqual(jasmine.any(up.Request))
            expect(response).toEqual(jasmine.any(up.Response))

            if (request.url === '/baz') {
              return '/foo'
            }
          }

          up.request({ url: '/foo', cache: true })
          up.request({ url: '/bar', cache: true })
          up.request({ url: '/baz', cache: true })

          expect({ url: '/foo' }).toBeCached()
          expect({ url: '/bar' }).toBeCached()
          expect({ url: '/baz' }).toBeCached()

          next(() => jasmine.Ajax.requests.at(0).respondWith({ status: 200, responseText: 'foo response' }))

          next(function () {
            expect({ url: '/foo' }).not.toBeExpired()
            expect({ url: '/bar' }).not.toBeExpired()
            expect({ url: '/baz' }).not.toBeExpired()

            jasmine.Ajax.requests.at(1).respondWith({ status: 200, responseText: 'bar response' })
          })

          next(function () {
            expect({ url: '/foo' }).not.toBeExpired()
            expect({ url: '/bar' }).not.toBeExpired()
            expect({ url: '/baz' }).not.toBeExpired()

            jasmine.Ajax.requests.at(2).respondWith({ status: 200, responseText: 'baz response' })
          })

          next(function () {
            // Only the URL pattern returned by config.expireCache() is exppired
            expect({ url: '/foo' }).toBeExpired()
            expect({ url: '/bar' }).not.toBeExpired()
            expect({ url: '/baz' }).not.toBeExpired()
          })
        }))

        u.each(['POST', 'PUT', 'DELETE'], function (unsafeMethod) {

          it(`expires the entire cache if a ${unsafeMethod} request is made`, asyncSpec(function(next) {
            const safeRequestAttrs = { method: 'GET', url: '/foo', cache: true }
            const unsafeRequestAttrs = { method: unsafeMethod, url: '/foo' }

            up.request(safeRequestAttrs)

            next(() => {
              this.respondWith('foo')
            })

            next(() => {
              expect(safeRequestAttrs).toBeCached()

              up.request(unsafeRequestAttrs)
            })

            next(() => {
              this.respondWith('foo')
            })

            next(() => {
              expect(safeRequestAttrs).toBeExpired()
            })
          }))

          it(`does notexpireclear the cache if a ${unsafeMethod} request is made with { expireCache: false }`, asyncSpec(function(next) {
            const safeRequestAttrs = {method: 'GET', url: '/foo', cache: true}
            const unsafeRequestAttrs = {method: unsafeMethod, url: '/foo', expireCache: false}

            up.request(safeRequestAttrs)

            next(() => {
              this.respondWith('false')
            })

            next(() => {
              expect(safeRequestAttrs).toBeCached()

              up.request(unsafeRequestAttrs)
            })

            next(() => {
              this.respondWith('foo')
            })

            next(() => {
              expect(safeRequestAttrs).not.toBeExpired()
            })
          }))

          it(`does not expire the cache the server responds to an ${unsafeMethod} request with X-Up-Expire-Cache: false`, asyncSpec(function(next) {
            const safeRequestAttrs = {method: 'GET', url: '/foo', cache: true}
            const unsafeRequestAttrs = {method: unsafeMethod, url: '/foo', cache: true}

            up.request(safeRequestAttrs)

            next(() => {
              this.respondWith('foo')
            })

            next(() => {
              expect(safeRequestAttrs).toBeCached()

              up.request(unsafeRequestAttrs)
            })

            next(() => {
              this.respondWith('foo', {responseHeaders: {'X-Up-Expire-Cache': 'false'}})
            })

            next(() => {
              expect(safeRequestAttrs).not.toBeExpired()
            })
          }))
        })

      })



      describe('method wrapping', function() {

        u.each(['GET', 'POST', 'HEAD', 'OPTIONS'], function(method) {
          it(`does not change the method of a ${method} request`, asyncSpec(function(next) {
            up.request({url: '/foo', method})

            next(() => {
              const request = this.lastRequest()
              expect(request.method).toEqual(method)
              expect(request.data()['_method']).toBeUndefined()
            })
          }))
        })

        u.each(['PUT', 'PATCH', 'DELETE'], function(method) {
          it(`turns a ${method} request into a POST request and sends the actual method as a { _method } param to prevent unexpected redirect behavior (https://makandracards.com/makandra/38347)`, asyncSpec(function(next) {
            up.request({url: '/foo', method})

            next(() => {
              const request = this.lastRequest()
              expect(request.method).toEqual('POST')
              expect(request.data()['_method']).toEqual([method])
            })
          }))
        })

        describe('with { wrapMethod: false }', function() {
          u.each(['GET', 'POST', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'], function(method) {
            it(`does not wrap the method of a ${method} request`, asyncSpec(function(next) {
              up.request({url: '/foo', method, wrapMethod: false})

              next(() => {
                const request = this.lastRequest()
                expect(request.method).toEqual(method)
                expect(request.data()['_method']).toBeUndefined()
              })
            }))
          })
        })
      })

      describe('with config.concurrency set', function() {

        beforeEach(function() {
          up.network.config.concurrency = 1
        })

        it('limits the number of concurrent requests', asyncSpec(function(next) {
          const responses = []
          const trackResponse = response => responses.push(response.text)

          up.request({url: '/foo'}).then(trackResponse)
          up.request({url: '/bar'}).then(trackResponse)

          next(() => {
            expect(jasmine.Ajax.requests.count()).toEqual(1)
          }); // only one request was made

          next(() => {
            this.respondWith('first response', {request: jasmine.Ajax.requests.at(0)})
          })

          next(() => {
            expect(responses).toEqual(['first response'])
            expect(jasmine.Ajax.requests.count()).toEqual(2)
          }); // a second request was made

          next(() => {
            this.respondWith('second response', {request: jasmine.Ajax.requests.at(1)})
          })

          next(() => {
            expect(responses).toEqual(['first response', 'second response'])
          });
        }))
      })

      describe('up:request:load event', function() {

        it('emits an up:request:load event before the request touches the network', asyncSpec(function(next) {
          let origin = fixture('.origin')
          const listener = jasmine.createSpy('listener')
          up.on('up:request:load', listener)
          up.request('/bar', { origin })

          next(() => {
            expect(jasmine.Ajax.requests.count()).toEqual(1)

            const partialRequest = jasmine.objectContaining({
              method: 'GET',
              url: jasmine.stringMatching('/bar'),
              origin: origin
            })
            const partialEvent = jasmine.objectContaining({ request: partialRequest })

            expect(listener).toHaveBeenCalledWith(partialEvent, jasmine.anything(), jasmine.anything())
          })
        }))

        it('allows up:request:load listeners to prevent the request (useful to cancel all requests when stopping a test scenario)', function(done) {
          const listener = jasmine.createSpy('listener').and.callFake(function (event) {
            expect(jasmine.Ajax.requests.count()).toEqual(0)
            event.preventDefault()
          })

          up.on('up:request:load', listener)

          const promise = up.request('/bar')

          u.task(function() {
            expect(listener).toHaveBeenCalled()
            expect(jasmine.Ajax.requests.count()).toEqual(0)

            promiseState(promise).then(function (result) {
              expect(result.state).toEqual('rejected')
              expect(result.value).toBeError(/prevented|aborted/i)
              done()
            })
          })
        })

        it('does not block the queue when an up:request:load event was prevented', function(done) {
          up.network.config.concurrency = 1

          const listener = jasmine.createSpy('listener').and.callFake(function (event) {
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
            expect(this.lastRequest().url).toMatchURL('/path2')
            done()
          })
        })

        it('allows up:request:load listeners to manipulate the request headers', function(done) {
          const listener = event => event.request.headers['X-From-Listener'] = 'foo'

          up.on('up:request:load', listener)

          up.request('/path1')

          u.task(() => {
            expect(this.lastRequest().requestHeaders['X-From-Listener']).toEqual('foo')
            done()
          })
        })

        it('allows up:request:load listeners to add request params for a POST request', function(done) {
          const listener = event => event.request.params.set('key', 'value')

          up.on('up:request:load', listener)

          up.request('/path1', {method: 'post'})

          u.task(() => {
            expect(this.lastRequest().params).toMatchParams({key: 'value'})
            done()
          })
        })

        it('allows up:request:load listeners to add request params for a GET request, which are moved to the URL before connecting', function(done) {
          const listener = event => event.request.params.set('key3', 'value3')

          up.on('up:request:load', listener)

          up.request('/path1?key1=value1', {params: {key2: 'value2'}, method: 'get'})

          u.task(() => {

            expect(this.lastRequest().url).toMatchURL('/path1?key1=value1&key2=value2&key3=value3')
            expect(this.lastRequest().params).toMatchParams({})
            done()
          })
        })

        it('allows up:request:load listeners to access the xhr request object', function (done) {
          const listener = jasmine.createSpy('listener').and.callFake(function (event) {
            expect(jasmine.Ajax.requests.count()).toEqual(0)
            expect(event.request.xhr).toBeDefined()
          })

          up.on('up:request:load', listener)

          up.request('/path1', {method: 'post'})

          u.task(() => {
            expect(listener.calls.count()).toBe(1)
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            done()
          })
        })

        describe('event target', function() {
          it('is emitted on the layer that triggered the event', asyncSpec(function(next) {
            makeLayers(3)

            const listener = jasmine.createSpy('event listener')
            up.on('up:request:load', listener)

            next(() => up.request('/path', {layer: 1}))

            next(function() {
              expect(listener.calls.count()).toBe(1)
              expect(listener.calls.argsFor(0)[0].target).toBe(up.layer.get(1).element)
            })
          }))
        })
      })

      describe('up:network:late and up:network:recover events', function() {

        beforeEach(function() {
          up.network.config.badResponseTime = 0
          this.events = []
          u.each(['up:request:load', 'up:request:loaded', 'up:network:late', 'up:network:recover', 'up:request:offline', 'up:request:aborted'], (eventType) => {
            up.on(eventType, () => {
              this.events.push(eventType)
            })
          })
        })

        it('emits an up:network:late event if the server takes too long to respond', asyncSpec(function(next) {
          let lateListener = jasmine.createSpy('up:network:late listener')
          up.on('up:network:late', lateListener)

          up.network.config.badResponseTime = 70

          up.request({ url: '/foo' })

          next.after(40, function() {
            expect(lateListener).not.toHaveBeenCalled()
          })

          next.after(60, function() {
            expect(lateListener).toHaveBeenCalled()
          })
        }))

        it('allows to configure request-specific response times as a function in up.network.config.badResponseTime', asyncSpec(function(next) {
          let lateListener = jasmine.createSpy('up:network:late listener')
          up.on('up:network:late', lateListener)

          let badResponseTimeFn = jasmine.createSpy('badResponseTime').and.callFake((request) => request.url === '/foo' ? 70 : 0)
          up.network.config.badResponseTime = badResponseTimeFn

          up.request({ url: '/foo' })

          next.after(40, function() {
            expect(badResponseTimeFn).toHaveBeenCalled()
            expect(lateListener).not.toHaveBeenCalled()
          })

          next.after(60, function() {
            expect(lateListener).toHaveBeenCalled()
          })
        }))

        it('honors an up.request({ badResponseTime }) option', asyncSpec(function(next) {
          let lateListener = jasmine.createSpy('up:network:late listener')
          up.on('up:network:late', lateListener)

          up.request({ url: '/foo', badResponseTime: 70 })

          next.after(40, function() {
            expect(lateListener).not.toHaveBeenCalled()
          })

          next.after(60, function() {
            expect(lateListener).toHaveBeenCalled()
          })
        }))

        it('does not emit an up:network:late event for background requests', asyncSpec(function(next) {
          next(() => {
            // A background request doesn't make us busy.
            up.request({url: '/foo', cache: true, background: true})
          })

          next(() => {
            expect(this.events).toEqual([
              'up:request:load'
            ])
          })

          next(() => {
            // The same request in the foreground does trigger up:network:late.
            up.request({url: '/foo', cache: true})
          })

          next.after(10, () => {
            expect(this.events).toEqual([
              'up:request:load',
              'up:network:late'
            ])
          })

          next(() => {
            // The response resolves both promises and emits up:network:recover.
            jasmine.Ajax.requests.at(0).respondWith({
              status: 200,
              contentType: 'text/html',
              responseText: 'foo'
            })
          })

          next(() => {
            expect(this.events).toEqual([
              'up:request:load',
              'up:network:late',
              'up:request:loaded',
              'up:network:recover'
            ])
          })
        }))

        it('can delay the up:network:late event to prevent flickering of spinners', asyncSpec(function(next) {
          next(() => {
            up.network.config.badResponseTime = 50
            up.request({url: '/foo'})
          })

          next(() => {
            expect(this.events).toEqual([
              'up:request:load'
            ])
          })

          next.after(25, () => {
            expect(this.events).toEqual([
              'up:request:load'
            ])
          })

          next.after(200, () => {
            expect(this.events).toEqual([
              'up:request:load',
              'up:network:late'
            ])
          })

          next(() => {
            this.respondWith('foo')
          })

          next(() => {
            expect(this.events).toEqual([
              'up:request:load',
              'up:network:late',
              'up:request:loaded',
              'up:network:recover'
            ])
          })
        }))

        it('does not emit up:network:recover if a delayed up:network:late was never emitted due to a fast response', asyncSpec(function(next) {
          next(() => {
            up.network.config.badResponseTime = 200
            up.request({url: '/foo'})
          })

          next(() => {
            expect(this.events).toEqual([
              'up:request:load'
            ])
          })

          next.after(100, () => {
            jasmine.Ajax.requests.at(0).respondWith({
              status: 200,
              contentType: 'text/html',
              responseText: 'foo'
            })
          })

          next.after(250, () => {
            expect(this.events).toEqual([
              'up:request:load',
              'up:request:loaded'
            ])
          })
        }))

        it('emits up:network:recover if a request returned but failed with an error code', asyncSpec(function(next) {
          next(() => {
            up.request({url: '/foo'})
          })

          next(() => {
            expect(this.events).toEqual([
              'up:request:load',
              'up:network:late'
            ])
          })

          next(() => {
            jasmine.Ajax.requests.at(0).respondWith({
              status: 500,
              contentType: 'text/html',
              responseText: 'something went wrong'
            })
          })

          next(() => {
            expect(this.events).toEqual([
              'up:request:load',
              'up:network:late',
              'up:request:loaded',
              'up:network:recover'
            ])
          })
        }))

        it('emits up:network:recover if a request timed out', asyncSpec(function(next) {
          up.network.config.badResponseTime = 10

          next(() => {
            up.request({url: '/foo'})
          })

          next.after(50, () => {
            expect(this.events).toEqual([
              'up:request:load',
              'up:network:late'
            ])
          })

          next(() => {
            jasmine.clock().install(); // required by responseTimeout()
            this.lastRequest().responseTimeout()
          })

          next(() => {
            expect(this.events).toEqual([
              'up:request:load',
              'up:network:late',
              'up:request:offline',
              'up:network:recover'
            ])
          })
        }))

        it('emits up:network:recover if a request was aborted', asyncSpec(function(next) {
          up.network.config.badResponseTime = 10

          next(() => {
            this.request = up.request({url: '/foo'})
          })

          next.after(100, () => {
            expect(this.events).toEqual([
              'up:request:load',
              'up:network:late'
            ])
          })

          next(() => {
            up.network.abort(this.request)
          })

          next(() => {
            expect(this.events).toEqual([
              'up:request:load',
              'up:network:late',
              'up:request:aborted',
              'up:network:recover'
            ])
          })
        }))

        it('emits up:network:recover if a request failed fatally', asyncSpec(function(next) {
          up.network.config.badResponseTime = 10

          next(() => {
            this.request = up.request({url: '/foo'})
          })

          next.after(100, () => {
            expect(this.events).toEqual([
              'up:request:load',
              'up:network:late'
            ])
          })

          next(() => {
            this.lastRequest().responseError()
          })

          next(() => {
            expect(this.events).toEqual([
              'up:request:load',
              'up:network:late',
              'up:request:offline',
              'up:network:recover'
            ])
          })
        }))

      })

    })

    if (up.migrate.loaded) {
      describe('up.ajax', function() {
        it('fulfills to the response text in order to match the $.ajax() API as good as possible', function(done) {
          const promise = up.ajax('/url')

          u.task(() => {
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            this.respondWith('response-text')

            promise.then(function (text) {
              expect(text).toEqual('response-text')

              done()
            })

            promise.catch(reason => done.fail(reason))
          })
        })
      })
    }

    describe('up.network.abort()', function() {

      it('aborts the given up.Request', asyncSpec(function(next) {
        const request1 = up.request('/url')
        const request2 = up.request('/url')

        next(() => up.network.abort(request1))

        next.await(() => promiseState(request1))

        next((result) => {
          expect(result.state).toEqual('rejected')
          expect(result.value?.name).toEqual('AbortError')
        })

        next.await(() => promiseState(request2))

        next((result) => {
          expect(result.state).toEqual('pending')
        })

      }))

      it('aborts all requests when called without an argument', asyncSpec(function(next) {
        const request = up.request('/url')

        next(() => up.network.abort())

        next.await(() => promiseState(request))

        next(function(result) {
          expect(result.state).toEqual('rejected')
          expect(result.value?.name).toEqual('AbortError')
        })
      }))

      it('aborts all requests for which the given function returns true', asyncSpec(function(next) {
        const request1 = up.request('/foo')
        const request2 = up.request('/bar')

        next(() => {
          let matcher = (request) => request.url === '/foo'
          up.network.abort(matcher)
        })

        next.await(() => promiseState(request1))

        next((result) => {
          expect(result.state).toEqual('rejected')
          expect(result.value?.name).toEqual('AbortError')
        })

        next.await(() => promiseState(request2))

        next((result) => {
          expect(result.state).toEqual('pending')
        })

      }))

      it('aborts all requests matching the given URL pattern', asyncSpec(function(next) {
        const request1 = up.request('/foo/123')
        const request2 = up.request('/bar/456')

        next(() => {
          up.network.abort('/foo/*')
        })

        next.await(() => promiseState(request1))

        next((result) => {
          expect(result.state).toEqual('rejected')
          expect(result.value?.name).toEqual('AbortError')
        })

        next.await(() => promiseState(request2))

        next((result) => {
          expect(result.state).toEqual('pending')
        })

      }))

      it('emits an up:request:aborted event', asyncSpec(function(next) {
        const listener = jasmine.createSpy('event listener')
        up.on('up:request:aborted', listener)

        const request = up.request('/url')

        next(() => request.abort())

        next(function() {
          expect(listener).toHaveBeenCalled()
          expect(listener.calls.argsFor(0)[0]).toBeEvent('up:request:aborted')
        })
      }))

      it('does not send multiple up:request:aborted events if the request is aborted multiple times', asyncSpec(function(next) {
        const listener = jasmine.createSpy('event listener')
        up.on('up:request:aborted', listener)

        const request = up.request('/url')

        next(function() {
          up.network.abort(request)
          up.network.abort(request)
        })

        next(() => expect(listener.calls.count()).toBe(1))
      }))

      it('does not reset the XHR object by calling xhr.abort() on a loaded XHR object (bugfix)', asyncSpec(function(next) {
        const request = up.request('/url')
        let response = null
        request.then(r => response = r)

        next(() => {
          expect(request.xhr).toBeGiven()

          // Just to make sure that the fake XHR object we have in specs has different
          // side effects than the real one: Check that xhr.abort() is never called.
          spyOn(request.xhr, 'abort').and.callThrough()

          this.respondWith('response text')
        })

        next(() => {
          expect(response.xhr.readyState).toBe(XMLHttpRequest.DONE)
          expect(response.contentType).toEqual('text/html')

          request.abort()
        })

        next(() => {
          // Calling xhr.abort() on a loaded XHR will reset the readyState to 0
          expect(response.xhr.readyState).toBe(XMLHttpRequest.DONE)

          // Calling xhr.abort() on a loaded XHR will lose all response headers
          expect(response.contentType).toEqual('text/html')

          expect(request.xhr.abort).not.toHaveBeenCalled()
        })
      }))

      it('does not abort a request that was already fulfilled with a response', asyncSpec(function(next) {
        const listener = jasmine.createSpy('event listener')
        up.on('up:request:aborted', listener)

        const request = up.request('/url')

        next(() => {
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          this.respondWith('response from server')
        })

        next.await(() => promiseState(request))

        next(function (result) {
          expect(result.state).toBe('fulfilled')
          expect(result.value).toEqual(jasmine.any(up.Response))
          expect(listener).not.toHaveBeenCalled()
        })

        next(() => request.abort())

        next.await(() => promiseState(request))

        next(function (result) {
          expect(result.state).toBe('fulfilled')
          expect(result.value).toEqual(jasmine.any(up.Response))
          expect(listener).not.toHaveBeenCalled()
        })
      }))

      describe('with { reason } option', function() {

        it("sets the given reason as the AbortError's message", function(done) {
          let request = up.request('/url')

          up.network.abort(request, { reason: 'Given reason'})

          promiseState(request).then(function({ state, value }) {
            expect(state).toBe('rejected')
            expect(value).toBeAbortError(/Given reason/)
            done()
          })
        })

      })

    })

    describe('up.cache.get()', function() {

      it('returns an existing cache entry for the given request', function() {
        const requestAttrs = {url: '/foo', params: {key: 'value'}, cache: true}
        up.request(requestAttrs)
        expect(requestAttrs).toBeCached()
      })

      it('returns undefined if the given request is not cached', () => expect({url: '/foo'}).not.toBeCached())
    })

    describe('up.cache.set()', () => it('should have tests'))

    describe('up.cache.alias()', () =>
      it('uses an existing cache entry for another request (used in case of redirects)', asyncSpec(function(next) {
        let originalRequest = up.request({url: '/foo', cache: true})
        let aliasRequest

        next(() => {
          expect({url: '/foo'}).toBeCached()
          expect({url: '/bar'}).not.toBeCached()

          aliasRequest = up.cache.alias({url: '/foo'}, {url: '/bar'})
        })

        next(() => {
          expect({url: '/foo'}).toBeCached()
          expect({url: '/bar'}).toBeCached()
          expect(jasmine.Ajax.requests.count()).toEqual(1)

          jasmine.respondWith("original request response")
        })

        next(() => {
          expect(originalRequest.response.text).toBe('original request response')
          expect(aliasRequest.response.text).toBe('original request response')
        })

      }))
    )

    describe('up.cache.remove()', function() {

      it('removes the cache entry for the given request')

      it('does nothing if the given request is not cached')
    })

    describe('up.cache.evict()', function() {

      it('removes all cache entries', function() {
        up.request({url: '/foo', cache: true})
        expect({url: '/foo'}).toBeCached()
        up.cache.evict()
        expect({url: '/foo'}).not.toBeCached()
      })

      it('accepts an URL pattern that determines which entries are purged', function() {
        up.request({url: '/foo/1', cache: true})
        up.request({url: '/foo/2', cache: true})
        up.request({url: '/bar/1', cache: true})
        expect({url: '/foo/1'}).toBeCached()
        expect({url: '/foo/2'}).toBeCached()
        expect({url: '/bar/1'}).toBeCached()

        up.cache.evict('/foo/*')

        expect({url: '/foo/1'}).not.toBeCached()
        expect({url: '/foo/2'}).not.toBeCached()
        expect({url: '/bar/1'}).toBeCached()
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
          up.network.loadPage({url: '/foo', method: 'GET', params: { param1: 'param1 value', param2: 'param2 value' }})
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
          up.network.loadPage({url: '/foo?param1=param1%20value', method: 'GET', params: { param2: 'param2 value' }})
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
          up.network.loadPage({url: '/foo', method: 'POST', params: { param1: 'param1 value', param2: 'param2 value' }})
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
          up.network.loadPage({url: '/foo?param1=param1%20value', method: 'POST', params: { param2: 'param2 value' }})
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
          up.network.loadPage({url: '/foo', method: 'POST', params: { foo: 'bar' }, contentType: 'multipart/form-data'})
          expect(submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          expect($form).toBeAttached()
          expect($form.attr('enctype')).toEqual('multipart/form-data')
        })
      })

      u.each(['PUT', 'PATCH', 'DELETE'], method => describe(`for ${method} requests`, () => it("uses a POST form and sends the actual method as a { _method } param", function() {
        const submitForm = spyOn(up.browser, 'submitForm')
        up.network.loadPage({url: '/foo', method})
        expect(submitForm).toHaveBeenCalled()
        const $form = $('form.up-request-loader')
        expect($form).toBeAttached()
        expect($form.attr('method')).toEqual('POST')
        expect($form.find('input[name="_method"]').val()).toEqual(method)
      })))

      describe('CSRF', function() {

        beforeEach(function() {
          up.protocol.config.csrfToken = () => 'csrf-token'
          up.protocol.config.csrfParam = () => 'csrf-param'
          this.submitForm = spyOn(up.browser, 'submitForm')
        })

        it('submits an CSRF token as another hidden field', function() {
          up.network.loadPage({url: '/foo', method: 'post'})
          expect(this.submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          const $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).toBeAttached()
          expect($tokenInput.val()).toEqual('csrf-token')
        })

        it('does not add a CSRF token if there is none', function() {
          up.protocol.config.csrfToken = () => ''
          up.network.loadPage({url: '/foo', method: 'post'})
          expect(this.submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          const $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).not.toBeAttached()
        })

        it('does not add a CSRF token for GET requests', function() {
          up.network.loadPage({url: '/foo', method: 'get'})
          expect(this.submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          const $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).not.toBeAttached()
        })

        it('does not add a CSRF token when loading content from another domain', function() {
          up.network.loadPage({url: 'http://other-domain.tld/foo', method: 'get'})
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

      it('shows an animated progress when requests are late', asyncSpec(function(next) {
        up.network.config.badResponseTime = 200
        let lastWidth = null

        up.request('/slow')

        next.after(100, () => expect(document).not.toHaveSelector('up-progress-bar'))

        next.after(200, function() {
          expect(document).toHaveSelector('up-progress-bar')
          const bar = document.querySelector('up-progress-bar')
          lastWidth = parseFloat(getComputedStyle(bar).width)
        })

        next.after(500, function() {
          expect(document).toHaveSelector('up-progress-bar')
          const bar = document.querySelector('up-progress-bar')
          const newWidth = parseFloat(getComputedStyle(bar).width)
          expect(newWidth).toBeGreaterThan(lastWidth)

          jasmine.respondWith('response')
        })

        next.after(500, () => expect(document).not.toHaveSelector('up-progress-bar'))
      }))

      it('shows no progress bar when requests finish fast enough', asyncSpec(function(next) {
        up.network.config.badResponseTime = 300

        up.request('/slow')

        next.after(100, function() {
          expect(document).not.toHaveSelector('up-progress-bar')
          jasmine.respondWith('response')
        })

        next.after(300, () => expect(document).not.toHaveSelector('up-progress-bar'))
      }))

      it('delays removal of the progress bar as more pending requests become late')

      it('does not show a progress bar with up.network.config.progressBar = false', asyncSpec(function(next) {
        up.network.config.badResponseTime = 10
        up.network.config.progressBar = false
        up.request('/slow')

        next.after(100, () => expect(document).not.toHaveSelector('up-progress-bar'))
      }))

      if (up.migrate.loaded) {

        it('does not show a progress bar when an up:network:late listener is registered', asyncSpec(function(next) {
          up.network.config.badResponseTime = 30
          up.on('up:network:late', () => console.log("custom loading indicator"))
          up.request('/slow')

          next.after(100, () => expect(document).not.toHaveSelector('up-progress-bar'))
        }))

        it('shows a progress bar when no up:network:late listener is registered', asyncSpec(function(next) {
          up.network.config.badResponseTime = 10
          up.request('/slow')

          next.after(100, () => expect(document).toHaveSelector('up-progress-bar'))
        }))

      } else {

        it('shows a progress bar even when an up:network:late listener is registered', asyncSpec(function(next) {
          up.network.config.badResponseTime = 10
          up.request('/slow')

          up.on('up:network:late', () => console.log("custom loading indicator"))

          next.after(100, () => expect(document).toHaveSelector('up-progress-bar'))
        }))
      }

    })

  })

})


