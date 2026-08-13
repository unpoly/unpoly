const u = up.util

extendDescribe('up.network', function() {

  extendDescribe('JavaScript functions', function() {

    extendDescribe('up.request()', function() {

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

              it(`does not cache an ${unsafeMethod} request, but does cache a redirect to a GET route`, async function() {
                up.request({ url: '/post-path', method: unsafeMethod, cache: 'auto' })
                await wait()

                expect({ url: '/post-path', method: unsafeMethod }).not.toBeCached()

                jasmine.respondWith('redirect body', { responseURL: '/redirect-path' })
                await wait()

                expect({ url: '/post-path', method: unsafeMethod }).not.toBeCached()
                expect({ url: '/redirect-path', method: 'GET' }).toBeCached()
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

        describe('with { cache: false }', function() {

          it(`does not cache a redirect to a GET route`, async function() {
            up.request({ url: '/path1', method: 'GET', cache: false })
            await wait()

            expect({ url: '/path1', method: 'GET' }).not.toBeCached()

            jasmine.respondWith('redirect body', { responseURL: '/path2' })
            await wait()

            expect({ url: '/path1', method: 'GET' }).not.toBeCached()
            expect({ url: '/path2', method: 'GET' }).not.toBeCached()
          })

          it(`updates an already-cached redirect to a GET route`, async function() {
            await jasmine.populateCache('/path2', 'old path2 text')

            up.request({ url: '/path1', method: 'GET', cache: false })
            await wait()

            expect({ url: '/path1', method: 'GET' }).not.toBeCached()
            expect({ url: '/path2', method: 'GET' }).toBeCached()

            jasmine.respondWith('new path2 text', { responseURL: '/path2' })
            await wait()

            expect({ url: '/path1', method: 'GET' }).not.toBeCached()
            expect({ url: '/path2', method: 'GET' }).toBeCached()
            expect({ url: '/path2', method: 'GET' }).toBeCachedWithResponse({ text: 'new path2 text' })
          })

          describe('when there is an existing cache entry', function() {

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

            it('evicts an existing cache entry after a network error')

            it('evicts an existing cache entry after an error response')

          })
        })
      })

    })

  })

})
