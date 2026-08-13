extendDescribe('up.fragment', function() {

  extendDescribe('JavaScript functions', function() {

    extendDescribe('up.render()', function() {

      describe('with { url } option', function() {

        it('replaces the given selector with the same selector from a freshly fetched page', async function() {
          fixture('.before', { text: 'old-before' })
          fixture('.middle', { text: 'old-middle' })
          fixture('.after', { text: 'old-after' })

          up.render('.middle', { url: '/path' })

          await wait()

          jasmine.respondWith(`
            <div class="before">new-before</div>
            <div class="middle">new-middle</div>
            <div class="after">new-after</div>
          `)

          await wait()

          expect('.before').toHaveText('old-before')
          expect('.middle').toHaveText('new-middle')
          expect('.after').toHaveText('old-after')
        })

        it('parses a full HTML page', async function() {
          fixture('.before', { text: 'old-before' })
          fixture('.middle', { text: 'old-middle' })
          fixture('.after', { text: 'old-after' })

          up.render('.middle', { url: '/path' })

          await wait()

          jasmine.respondWith(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Document title</title>
              </head>
              <body>
                <div class="before">new-before</div>
                <div class="middle">new-middle</div>
                <div class="after">new-after</div>
              </body>
            </html>
          `)

          await wait()

          expect('.before').toHaveText('old-before')
          expect('.middle').toHaveText('new-middle')
          expect('.after').toHaveText('old-after')
        })

        it('parses a full HTML page with uppercase tag names', async function() {
          fixture('.before', { text: 'old-before' })
          fixture('.middle', { text: 'old-middle' })
          fixture('.after', { text: 'old-after' })

          up.render('.middle', { url: '/path' })

          await wait()

          jasmine.respondWith(`
            <!DOCTYPE html>
            <HTML>
              <HEAD>
                <TITLE>Document title</TITLE>
              </HEAD>
              <BODY>
                <DIV class="before">new-before</DIV>
                <DIV class="middle">new-middle</DIV>
                <DIV class="after">new-after</DIV>
              </BODY>
            </HTML>
          `)

          await wait()

          expect('.before').toHaveText('old-before')
          expect('.middle').toHaveText('new-middle')
          expect('.after').toHaveText('old-after')
        })

        it('returns a promise that fulfills the server response was received and the fragments were swapped', async function() {
          fixture('.target')

          const resolution = jasmine.createSpy()
          const promise = up.render('.target', { url: '/path' })

          promise.then(resolution)

          await wait()

          expect(resolution).not.toHaveBeenCalled()
          jasmine.respondWithSelector('.target', { text: 'new-text' })

          await wait()

          expect(resolution).toHaveBeenCalled()
          expect('.target').toHaveText('new-text')
        })

        it('runs an { onRendered } callback when the server response was received and the fragments were swapped', async function() {
          fixture('.target')

          const callback = jasmine.createSpy('onRendered callback')
          up.render('.target', { url: '/path', onRendered: callback })

          await wait()

          expect(callback).not.toHaveBeenCalled()
          jasmine.respondWithSelector('.target', { text: 'new-text' })

          await wait()

          expect(callback).toHaveBeenCalledWith(jasmine.any(up.RenderResult))
          expect('.target').toHaveText('new-text')
        })

        // it('emits an up:fragment:rendered event when the server response was received and the fragments were swapped', async function() {
        //   fixture('.target')
        //
        //   const callback = jasmine.createSpy('up:fragment:rendered listener')
        //   document.addEventListener('up:fragment:rendered', callback)
        //   up.render('.target', { url: '/path' })
        //
        //   await wait()
        //
        //   expect(callback).not.toHaveBeenCalled()
        //   jasmine.respondWithSelector('.target', { text: 'new-text' })
        //
        //   await wait()
        //
        //   expect('.target').toHaveText('new-text')
        //   expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
        //     ok: true,
        //     target: up.layer.root.element, // we cannot set { target } on an event
        //     layer: up.layer.root,
        //     fragments: [document.querySelector('.target')]
        //   }))
        //
        // })

        it('uses a HTTP method given as { method } option', async function() {
          fixture('.target')
          up.render('.target', { url: '/path', method: 'put' })
          await wait()
          expect(jasmine.lastRequest()).toHaveRequestMethod('PUT')
        })

        it('rejects with an AbortError if the request is aborted', async function() {
          fixture('.target')
          const promise = up.render('.target', { url: '/path' })

          expect(up.network.isBusy()).toBe(true)

          up.network.abort()

          await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Aborted))
        })

        describe('source URL', function() {

          it('sets an [up-source] attribute to remember to URL from which the fragment was loaded', async function() {
            fixture('.target', { text: 'old text' })
            up.render('.target', { url: '/source-path' })
            await wait()
            jasmine.respondWithSelector('.target', { text: 'new text' })
            await wait()

            expect('.target').toHaveText('new text')
            expect('.target').toHaveAttribute('up-source', '/source-path')
            expect(up.fragment.source('.target')).toMatchURL('/source-path')
          })

          it('sets an [up-source] attribute for failed responses', async function() {
            fixture('.target', { text: 'old text' })
            up.render({ target: '.target', failTarget: '.target', url: '/source-path' })
            await wait()
            jasmine.respondWithSelector('.target', { text: 'new text', status: 500 })
            await wait()

            expect('.target').toHaveText('new text')
            expect('.target').toHaveAttribute('up-source', '/source-path')
            expect(up.fragment.source('.target')).toMatchURL('/source-path')
          })

          it('keeps an existing [up-source] attribute for responses to non-GET requests', async function() {
            fixture('.target', { text: 'old text', 'up-source': '/previous-source' })
            up.render('.target', { url: '/source-path', method: 'post' })
            await wait()
            jasmine.respondWithSelector('.target', { text: 'new text' })
            await wait()

            expect('.target').toHaveText('new text')
            expect('.target').toHaveAttribute('up-source', '/previous-source')
            expect(up.fragment.source('.target')).toMatchURL('/previous-source')
          })

        })

        describe('last modification time', function() {

          it('sets an Last-Modified response header as an [up-time] attribute', async function() {
            fixture('.target', { text: 'old content' })
            up.render('.target', { url: '/path' })

            await wait()

            jasmine.respondWithSelector('.target', {
              text: 'new content',
              responseHeaders: { 'Last-Modified': 'Wed, 21 Oct 2015 07:28:00 GMT' }
            })

            await wait()

            expect('.target').toHaveText('new content')
            expect('.target').toHaveAttribute('up-time', 'Wed, 21 Oct 2015 07:28:00 GMT')
          })

          it('does not change an existing [up-time] attribute on the new fragment with information from the Last-Modified header', async function() {
            fixture('.target', { text: 'old content' })
            up.render('.target', { url: '/path' })

            await wait()

            jasmine.respondWithSelector('.target[up-time=123]', {
              text: 'new content',
              responseHeaders: { 'Last-Modified': 'Wed, 21 Oct 2015 07:28:00 GMT' }
            })

            await wait()

            expect('.target').toHaveText('new content')
            expect('.target').toHaveAttribute('up-time', '123')
          })

          it("sets an [up-time=false] attribute if the server did not send an Last-Modified header, so we won't fall back to a parent's Last-Modified header later", async function() {
            fixture('.target', { text: 'old content' })
            up.render('.target', { url: '/path' })

            await wait()

            jasmine.respondWithSelector('.target', { text: 'new content' })

            await wait()

            expect('.target').toHaveText('new content')
            expect('.target').toHaveAttribute('up-time', 'false')
          })
        })

        describe('ETags', function() {

          it('sets a weak ETag header as an [up-etag] attribute', async function() {
            fixture('.target', { text: 'old content' })
            up.render('.target', { url: '/path' })

            await wait()

            jasmine.respondWithSelector('.target', {
              text: 'new content',
              responseHeaders: { 'Etag': 'W/"0815"' }
            })

            await wait()

            expect('.target').toHaveText('new content')
            expect('.target').toHaveAttribute('up-etag', 'W/"0815"')
          })

          it('sets a strong ETag header as an [up-etag] attribute', async function() {
            fixture('.target', { text: 'old content' })
            up.render('.target', { url: '/path' })

            await wait()

            jasmine.respondWithSelector('.target', {
              text: 'new content',
              responseHeaders: { 'Etag': '"33a64df551425fcc55e4d42a148795d9f25f89d4"' }
            })

            await wait()

            expect('.target').toHaveText('new content')
            expect('.target').toHaveAttribute('up-etag', '"33a64df551425fcc55e4d42a148795d9f25f89d4"')
          })

          it('does not change an existing [up-etag] attribute on the new fragment with information from the ETag header', async function() {
            fixture('.target', { text: 'old content' })
            up.render('.target', { url: '/path' })

            await wait()

            jasmine.respondWithSelector('.target[up-etag=123]', {
              text: 'new content',
              responseHeaders: { 'ETag': '"33a64df551425fcc55e4d42a148795d9f25f89d4"' }
            })

            await wait()

            expect('.target').toHaveText('new content')
            expect('.target').toHaveAttribute('up-etag', '123')
          })

          it("sets an [up-etag=false] attribute if the server did not send an ETag header, so we won't fall back to a parent's ETag header later", async function() {
            fixture('.target', { text: 'old content' })
            up.render('.target', { url: '/path' })

            await wait()

            jasmine.respondWithSelector('.target', { text: 'new content' })

            await wait()

            expect('.target').toHaveText('new content')
            expect('.target').toHaveAttribute('up-etag', 'false')
          })
        })

        describe('with { params } option', function() {

          it("uses the given params as a non-GET request's payload", async function() {
            const givenParams = { 'foo-key': 'foo-value', 'bar-key': 'bar-value' }
            fixture('.target')
            up.render('.target', { url: '/path', method: 'put', params: givenParams })

            await wait()

            expect(jasmine.lastRequest().data()['foo-key']).toEqual(['foo-value'])
            expect(jasmine.lastRequest().data()['bar-key']).toEqual(['bar-value'])
          })

          it("encodes the given params into the URL of a GET request", async function() {
            fixture('.target')
            const givenParams = { 'foo-key': 'foo-value', 'bar-key': 'bar-value' }
            up.render('.target', { url: '/path', method: 'get', params: givenParams })

            await wait()

            expect(jasmine.lastRequest().url).toMatchURL('/path?foo-key=foo-value&bar-key=bar-value')
          })
        })

        describe('checking of response type', function() {

          it('updates a fragment if the server sends an HTML content-type', async function() {
            fixture('.target', { text: 'old text' })

            up.render('.target', { url: '/path', failTarget: '.failure' })

            await wait()

            jasmine.respondWith({
              contentType: 'text/html',
              responseText: '<div class="target">new text</div>'
            })

            await wait()

            expect('.target').toHaveText('new text')
          })

          it('updates a fragment if the server sends an XHTML content-type', async function() {
            fixture('.target', { text: 'old text' })

            up.render('.target', { url: '/path', failTarget: '.failure' })

            await wait()

            jasmine.respondWith({
              contentType: 'application/xhtml+xml',
              responseText: '<div class="target">new text</div>'
            })

            await wait()

            expect('.target').toHaveText('new text')
          })

          it('throws an error if the server sends plain text', async function() {
            fixture('.target', { text: 'old text' })

            let renderPromise = up.render('.target', { url: '/path', failTarget: '.failure' })

            await wait()

            jasmine.respondWith({
              contentType: 'text/plain',
              responseText: '<div class="target">new text</div>'
            })

            await expectAsync(renderPromise).toBeRejectedWith(jasmine.anyError(/Cannot render response with content-type "text\/plain"/i))
          })

          it('throws an error if the server sends an SVG', async function() {
            fixture('.target', { text: 'old text' })

            let renderPromise = up.render('.target', { url: '/path', failTarget: '.failure' })

            await wait()

            jasmine.respondWith({
              contentType: 'image/svg+xml',
              responseText: '<div class="target">new text</div>'
            })

            await expectAsync(renderPromise).toBeRejectedWith(jasmine.anyError(/Cannot render response with content-type "image\/svg\+xml"/i))
          })

        })

        describe('when the server responds with an error or unexpected HTML', function() {

          it('uses a target selector given as { failTarget } option', async function() {
            fixture('.success-target', { text: 'old success text' })
            fixture('.failure-target', { text: 'old failure text' })

            const renderJob = up.render('.success-target', { url: '/path', failTarget: '.failure-target' })

            await wait()

            jasmine.respondWith({
              status: 500,
              responseText: `
                <div class="failure-target">new failure text</div>
                <div class="success-target">new success text</div>
              `
            })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect('.success-target').toHaveText('old success text')
            expect('.failure-target').toHaveText('new failure text')
          })

          it('updates a fallback target if the { failTarget } cannot be matched', async function() {
            fixture('.fallback', { text: 'old fallback text' })
            fixture('.success-target', { text: 'old success text' })
            fixture('.failure-target', { text: 'old failure text' })

            const renderJob = up.render('.success-target', { url: '/path', failTarget: '.failure-target', fallback: '.fallback' })

            await wait()

            jasmine.respondWith({
              status: 500,
              responseText: `
                <div class="fallback">new fallback text</div>
                <div class="success-target">new success text</div>
              `
            })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect('.success-target').toHaveText('old success text')
            expect('.fallback').toHaveText('new fallback text')
          })

          it('rejects the returned promise with an up.RenderResult describing the updated fragments and layer', async function() {
            fixture('.success-target')
            fixture('.failure-target')
            const renderOptions = { url: '/path', target: '.success-target', failTarget: '.failure-target' }
            const renderJob = up.render(renderOptions)

            await wait()

            jasmine.respondWithSelector('.failure-target', { status: 500 })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))
            await expectAsync(renderJob).toBeRejectedWith(jasmine.objectContaining({
              ok: false,
              target: '.failure-target',
              fragments: [document.querySelector('.failure-target')],
              layer: up.layer.root,
              renderOptions: jasmine.objectContaining({
                target: '.failure-target',
                url: '/path',
              }),
            }))
          })

          it('rejects the up.render().finished promise', async function() {
            fixture('.success-target')
            fixture('.failure-target')
            const renderJob = up.render('.success-target', { url: '/path', failTarget: '.failure-target' })
            const {
              finished
            } = renderJob

            await wait()
            await expectAsync(finished).toBePending()

            jasmine.respondWithSelector('.failure-target', { status: 500 })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))
            await expectAsync(finished).toBeRejectedWith(jasmine.any(up.RenderResult))
          })

          it('rejects with an error that explains why success targets were not used', async function() {
            fixture('.target')
            const promise = up.render('.target', { url: '/qux' })

            await wait()

            jasmine.respondWithSelector('.unexpected', { status: 500 })

            await expectAsync(promise).toBeRejectedWith(jasmine.anyError(/No target selector given for failed responses/i))
          })

          it('runs an onFailRendered callback', async function() {
            fixture('.success-target', { text: 'old text' })
            fixture('.failure-target', { text: 'old text' })
            const onRendered = jasmine.createSpy('onRendered callback')
            const onFailRendered = jasmine.createSpy('onFailRendered callback')

            const renderJob = up.render('.success-target', { url: '/path', failTarget: '.failure-target', onRendered, onFailRendered })

            await wait()

            expect(onRendered).not.toHaveBeenCalled()
            expect(onFailRendered).not.toHaveBeenCalled()

            jasmine.respondWithSelector('.failure-target', { status: 500, text: 'new text' })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect('.success-target').toHaveText('old text')
            expect('.failure-target').toHaveText('new text')

            expect(onRendered).not.toHaveBeenCalled()
            expect(onFailRendered).toHaveBeenCalledWith(jasmine.any(up.RenderResult))
          })

          describe('with { fail } option', function() {

            it('always uses success options with { fail: false }', async function() {
              fixture('.success-target', { text: 'old success text' })
              fixture('.failure-target', { text: 'old failure text' })

              const renderJob = up.render({
                target: '.success-target',
                failTarget: '.failure-target',
                url: '/path',
                status: 200,
                fail: true
              })

              await wait()

              jasmine.respondWith(`
                <div class="success-target">new success text</div>
                <div class="failure-target">new failure text</div>
              `)

              await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

              expect('.success-target').toHaveText('old success text')
              expect('.failure-target').toHaveText('new failure text')
            })

            it('always uses failure options with { fail: true }', async function() {
              fixture('.success-target', { text: 'old success text' })
              fixture('.failure-target', { text: 'old failure text' })

              const renderJob = up.render({
                target: '.success-target',
                failTarget: '.failure-target',
                url: '/path',
                status: 200,
                fail: true
              })

              await wait()

              jasmine.respondWith(`
                <div class="success-target">new success text</div>
                <div class="failure-target">new failure text</div>
              `)

              await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

              expect('.success-target').toHaveText('old success text')
              expect('.failure-target').toHaveText('new failure text')
            })

            it('accepts a function as { fail } option', async function() {
              const failFn = jasmine.createSpy('fail function').and.returnValue(false)

              fixture('.success-target', { text: 'old success text' })
              fixture('.failure-target', { text: 'old failure text' })

              up.render({
                target: '.success-target',
                failTarget: '.failure-target',
                url: '/path',
                status: 500,
                fail: failFn
              })

              await wait()

              jasmine.respondWith(`
                <div class="success-target">new success text</div>
                <div class="failure-target">old failure text</div>
              `)

              await wait()

              expect(failFn).toHaveBeenCalled

              expect('.success-target').toHaveText('new success text')
              expect('.failure-target').toHaveText('old failure text')
            })

            it('lets up:fragment:loaded listeners force a failure response by setting event.renderOptions.fail = true', async function() {
              fixture('.success-target', { text: 'old success text' })
              fixture('.failure-target', { text: 'old failure text' })

              up.on('up:fragment:loaded', (e) => e.renderOptions.fail = true)

              const renderJob = up.render({ target: '.success-target', failTarget: '.failure-target', url: '/path' })

              await wait()

              jasmine.respondWith(`
                <div class="success-target">new success text</div>
                <div class="failure-target">new failure text</div>
              `)

              await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

              expect('.success-target').toHaveText('old success text')
              expect('.failure-target').toHaveText('new failure text')
            })
          })
        })

        describe('when the request times out', function() {
          it("doesn't crash and rejects the returned promise with an up.Offline error xx", async function() {
            jasmine.clock().install() // required by responseTimeout()
            fixture('.target')
            const renderJob = up.render('.target', { url: '/path', timeout: 500 })

            await wait()

            // See that the correct timeout value has been set on the XHR instance
            expect(jasmine.lastRequest().timeout).toEqual(500)

            await expectAsync(renderJob).toBePending()

            jasmine.lastRequest().responseTimeout()

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Offline))
          })
        })

        describe('when there is a network issue', function() {

          it("doesn't crash and rejects the returned promise with an up.Offline error", async function() {
            fixture('.target')
            const renderJob = up.render('.target', { url: '/path', timeout: 50 })

            await wait()

            // See that the correct timeout value has been set on the XHR instance
            expect(jasmine.lastRequest().timeout).toEqual(50)

            await expectAsync(renderJob).toBePending()

            jasmine.lastRequest().responseError()

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Offline))
          })

          it('emits an up:fragment:offline event with access to { request } and { renderOptions }', async function() {
            const listener = jasmine.createSpy('up:fragment:offline listener')
            up.on('up:fragment:offline', listener)

            fixture('.target')
            const renderJob = up.render('.target', { url: '/other-path' })

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(listener).not.toHaveBeenCalled()

            jasmine.lastRequest().responseError()

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Offline))

            expect(listener).toHaveBeenCalled()
            const event = listener.calls.argsFor(0)[0]
            expect(event.type).toBe('up:fragment:offline')
            expect(event.request).toEqual(jasmine.any(up.Request))
            expect(event.renderOptions.target).toMatchURL('.target')
            expect(event.renderOptions.url).toMatchURL('/other-path')
          })

          it('calls an { onOffline } listener with an up:fragment:offline event', async function() {
            const listener = jasmine.createSpy('onOffline callback')

            fixture('.target')
            const renderJob = up.render('.target', { url: '/other-path', onOffline: listener })

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(listener).not.toHaveBeenCalled()

            jasmine.lastRequest().responseError()

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Offline))

            expect(listener).toHaveBeenCalled()
            const event = listener.calls.argsFor(0)[0]
            expect(event.type).toBe('up:fragment:offline')
          })

          it('allows up:fragment:offline listeners to retry the rendering by calling event.retry()', async function() {
            const listener = jasmine.createSpy('onOffline callback')

            fixture('.target', { text: 'old text' })
            const promise = up.render('.target', { url: '/other-path', onOffline: listener })

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(listener).not.toHaveBeenCalled()

            jasmine.lastRequest().responseError()

            await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Offline))

            expect('.target').toHaveText('old text')
            expect(listener.calls.count()).toBe(1)
            const event = listener.calls.argsFor(0)[0]
            event.retry()

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(2)

            jasmine.respondWithSelector('.target', { text: 'new text' })

            await wait()

            // The listener was not called again
            expect(listener.calls.count()).toBe(1)
            expect('.target').toHaveText('new text')
          })

          it('allows up:fragment:offline listeners to retry the rendering by calling event.retry() when relative URLs are used and the based has changed since rendering', async function() {
            up.history.config.enabled = true
            up.history.replace('/base1/')
            const listener = jasmine.createSpy('onOffline callback')

            fixture('.target', { text: 'old text' })
            const promise = up.render('.target', { url: 'relative', onOffline: listener })

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(jasmine.lastRequest().url).toMatchURL('/base1/relative')
            expect(listener).not.toHaveBeenCalled()

            jasmine.lastRequest().responseError()

            await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Offline))

            up.history.replace('/base2/')

            expect('.target').toHaveText('old text')
            expect(listener.calls.count()).toBe(1)
            const event = listener.calls.argsFor(0)[0]
            event.retry()

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(2)
            expect(jasmine.lastRequest().url).toMatchURL('/base1/relative')

            jasmine.respondWithSelector('.target', { text: 'new text' })

            await wait()

            // The listener was not called again
            expect(listener.calls.count()).toBe(1)
            expect('.target').toHaveText('new text')
          })

          it('allows up:fragment:offline listeners to override render options when retrying', async function() {
            const listener = jasmine.createSpy('onOffline callback')

            fixture('.target', { text: 'old text' })
            fixture('.override-target', { text: 'old text' })

            const promise = up.render('.target', { url: '/other-path', onOffline: listener })

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(listener).not.toHaveBeenCalled()

            jasmine.lastRequest().responseError()
            await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Offline))

            expect('.target').toHaveText('old text')
            expect(listener.calls.count()).toBe(1)

            const event = listener.calls.argsFor(0)[0]
            event.retry({ target: '.override-target' })

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(2)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.override-target')
          })

          it('does not call an { onFinished } handler', async function() {
            const listener = jasmine.createSpy('onFinished callback')

            fixture('.target')
            const renderJob = up.render('.target', { url: '/other-path', onFinished: listener })

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(listener).not.toHaveBeenCalled()

            jasmine.lastRequest().responseError()

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Offline))

            expect(listener).not.toHaveBeenCalled()
          })

          describe('when there is an expired cache entry', function() {

            beforeEach(async function() {
              fixture('.target', { text: 'old text' })

              const request = up.request('/path', { target: '.target', cache: true })
              await wait()

              expect(request).toBeCached()

              jasmine.respondWithSelector('.target', { text: 'expired text' })
              await wait()

              expect(request).toBeCachedWithResponse()
              expect(request).not.toBeExpired()
              up.cache.expire(request)
              expect(request).toBeExpired()
            })

            it('renders the expired content', async function() {
              up.render('.target', { url: '/path', cache: true })

              await wait(25)

              expect('.target').toHaveText('expired text')
            })

            it('calls an { onOffline } instead of { onFinished } after revalidation fails', async function() {
              const onOffline = jasmine.createSpy('onOffline handler')
              const onFinished = jasmine.createSpy('onFinished handler')

              const renderJob = up.render('.target', { url: '/path', cache: true, revalidate: true, onOffline, onFinished })

              await expectAsync(renderJob).toBeResolvedTo(jasmine.any(up.RenderResult))
              await expectAsync(renderJob.finished).toBePending()

              // For some reason, with migrate loaded, the revalidation request is in the queue but has not yet been sent
              await wait()

              expect(up.network.isBusy()).toBe(true)
              expect(onFinished).not.toHaveBeenCalled()
              expect(onOffline).not.toHaveBeenCalled()
              expect('.target').toHaveText('expired text')


              jasmine.lastRequest().responseError()

              await expectAsync(renderJob.finished).toBeRejectedWith(jasmine.any(up.Offline))

              expect(onFinished).not.toHaveBeenCalled()
              expect(onOffline).toHaveBeenCalled()
            })
          })

          describe('when preloading', function() {

            it('does not emit up:fragment:offline', async function() {
              const listener = jasmine.createSpy('up:fragment:offline listener')
              up.on('up:fragment:offline', listener)

              let target = fixture('.target')
              let link = fixture('a[href="/foo"][up-follow]', { text: 'label' })

              const preloadJob = up.link.preload(link)
              await wait()

              expect(jasmine.Ajax.requests.count()).toBe(1)
              expect(listener).not.toHaveBeenCalled()

              jasmine.lastRequest().responseError()

              await expectAsync(preloadJob).toBeRejectedWith(jasmine.any(up.Offline))

              expect(listener).not.toHaveBeenCalled()
              expect(jasmine.Ajax.requests.count()).toBe(1)
              expect(up.network.isBusy()).toBe(false)
            })

            it('emits up:fragment:offline when later clicking the link that could not be preloaded', async function() {
              const listener = jasmine.createSpy('up:fragment:offline listener')
              up.on('up:fragment:offline', listener)

              let target = fixture('.target')
              let link = fixture('a[href="/foo"][up-follow]', { text: 'label' })

              const preloadJob = up.link.preload(link)
              await wait()

              expect(jasmine.Ajax.requests.count()).toBe(1)
              expect(listener).not.toHaveBeenCalled()

              jasmine.lastRequest().responseError()

              await expectAsync(preloadJob).toBeRejectedWith(jasmine.any(up.Offline))

              expect(listener).not.toHaveBeenCalled()
              expect(jasmine.Ajax.requests.count()).toBe(1)
              expect(up.network.isBusy()).toBe(false)

              Trigger.clickSequence(link)
              await wait()

              expect(jasmine.Ajax.requests.count()).toBe(2)
              expect(up.network.isBusy()).toBe(true)

              await jasmine.expectGlobalError('up.Offline', async function() {
                jasmine.lastRequest().responseError()
                await wait()

                expect(listener).toHaveBeenCalled()
                await wait()
              })
            })

          })

        })

        describe('up:fragment:loaded event', function() {

          it('emits an up:fragment:loaded event that contains information about the request, response and render options', async function() {
            const origin = fixture('.origin')
            fixture('.target')
            let event = undefined
            up.on('up:fragment:loaded', (e) => event = e)

            up.render({ target: '.target', url: '/url', location: '/location-from-option', peel: false, origin })

            await wait()

            jasmine.respondWithSelector('.target', { text: 'text from server' })

            await wait()

            expect(event).toBeGiven()
            expect(event.request).toEqual(jasmine.any(up.Request))
            expect(event.request.url).toMatchURL('/url')
            expect(event.response.text).toContain('text from server')
            expect(event.renderOptions.peel).toBe(false)
            expect(event.renderOptions.location).toMatchURL('/location-from-option')
            expect(event.origin).toBe(origin)
            expect(event.layer).toBe(up.layer.root)
          })

          it('allows listeners to prevent an up:fragment:loaded event to prevent changes to the DOM and browser history', async function() {
            up.history.config.enabled = true
            up.on('up:fragment:loaded', (e) => e.preventDefault())
            fixture('.target', { text: 'old text' })

            const renderJob = up.render({ target: '.target', url: '/url' })

            await wait()

            jasmine.respondWith('new text')

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Aborted))

            expect('.target').toHaveText('old text')
            expect(location.href).toMatchURL(jasmine.locationBeforeExample)
          })

          it('rejects programmatic callers with an up.AbortError when the event is prevented', async function() {
            up.on('up:fragment:loaded', (e) => e.preventDefault())
            fixture('.target', { text: 'old text' })

            const changePromise = up.render({ target: '.target', url: '/url' })

            await wait()

            jasmine.respondWith('new text')

            // Now up:fragment:loaded is emitted and is prevented
            await expectAsync(changePromise).toBeRejectedWith(jasmine.any(up.Aborted))

            expect('.target').toHaveText('old text')
          })

          it('fulfills programmatic callers with an empty up.RenderResult when the event is skipped (instead of prevented)', async function() {
            up.on('up:fragment:loaded', (e) => e.skip())
            fixture('.target', { text: 'old text' })

            const renderOptions = { target: '.target', url: '/url' }
            const changePromise = up.render(renderOptions)
            await wait()

            jasmine.respondWith('new text')

            await wait()

            expect('.target').toHaveText('old text')

            let result = await changePromise

            await expectAsync(changePromise).toBeResolvedTo(jasmine.any(up.RenderResult))
            await expectAsync(changePromise).toBeResolvedTo(jasmine.objectContaining({
              ok: true,
              none: true,
              renderOptions: jasmine.objectContaining({ target: ':none', url: '/url' }),
            }))
          })

          it('allows listeners to mutate up.render() options to target another fragment', async function() {
            fixture('.one', { text: 'old one' })
            fixture('.two', { text: 'old two' })

            up.on('up:fragment:loaded', (e) => e.renderOptions.target = '.two')

            up.render({ target: '.one', url: '/url' })
            await wait()

            jasmine.respondWith(`
              <div class="one">new one</div>
              <div class="two">new two</div>
            `)
            await wait()

            expect('.one').toHaveText('old one')
            expect('.two').toHaveText('new two')
          })

          it('allows listeners to mutate up.render() options to target another fragment with a failed response', async function() {
            fixture('.one', { text: 'old one' })
            fixture('.two', { text: 'old two' })

            up.on('up:fragment:loaded', (e) => e.renderOptions.failTarget = '.two')

            up.render({ target: '.one', url: '/url' })
            await wait()

            jasmine.respondWith({ status: 500, responseText: `
              <div class="one">new one</div>
              <div class="two">new two</div>
            ` })
            await wait()

            expect('.one').toHaveText('old one')
            expect('.two').toHaveText('new two')
          })

          it('allows listeners to mutate up.render() options and render into a new layer', async function() {
            fixture('.one', { text: 'old one' })

            up.on('up:fragment:loaded', (event) => event.renderOptions.layer = 'new')

            up.render({ target: '.one', url: '/url' })
            await wait()

            jasmine.respondWith(`
              <div class="one">new one</div>
            `)
            await wait()

            expect(up.layer.isOverlay()).toBe(true)
            expect(up.fragment.get('.one', { layer: 'overlay' })).toHaveText('new one')
          })

          it('allows listeners to mutate up.render() options and render into a new layer with a failed response', async function() {
            fixture('.one', { text: 'old one' })

            up.on('up:fragment:loaded', (event) => event.renderOptions.failLayer = 'new')

            up.render({ target: '.one', failTarget: '.one', url: '/url' })
            await wait()

            jasmine.respondWith({ status: 500, responseText: `
              <div class="one">new one</div>
            ` })
            await wait()

            expect(up.layer.isOverlay()).toBe(true)
            expect(up.fragment.get('.one', { layer: 'overlay' })).toHaveText('new one')
          })

          it('allows listeners to mutate up.render() options before the fragment is updated when the server responds with an error code (bugfix)', async function() {
            fixture('.one', { text: 'old one' })
            fixture('.two', { text: 'old two' })
            fixture('.three', { text: 'old three' })

            up.on('up:fragment:loaded', (e) => e.renderOptions.failTarget = '.three')

            const renderJob = up.render({ target: '.one', failTarget: '.two', url: '/url' })

            await wait()

            jasmine.respondWith({
              status: 500,
              responseText: `
                <div class="one">new one</div>
                <div class="two">new two</div>
                <div class="three">new three</div>
              `
            })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect('.one').toHaveText('old one')
            expect('.two').toHaveText('old two')
            expect('.three').toHaveText('new three')
          })

          it('allows to pass a listener for just one render pass using { onLoaded } option', async function() {
            const origin = fixture('.origin')
            fixture('.target')
            let event = undefined
            const onLoaded = (e) => event = e

            up.render({ target: '.target', url: '/url', location: '/location-from-option', peel: false, origin, onLoaded })
            await wait()

            jasmine.respondWithSelector('.target', { text: 'text from server' })
            await wait()

            expect(event).toBeGiven()
            expect(event.request).toEqual(jasmine.any(up.Request))
            expect(event.request.url).toMatchURL('/url')
          })

          it('runs an { onLoaded } listener for failed responses (there is no { onFailLoaded })', async function() {
            const origin = fixture('.origin')
            fixture('.target')
            fixture('.fail-target')
            let event = undefined
            const onLoaded = (e) => event = e

            const renderJob = up.render({ target: '.target', failTarget: '.fail-target', url: '/url', location: '/location-from-option', peel: false, origin, onLoaded })

            await wait()

            jasmine.respondWithSelector('.fail-target', { text: 'error from server', status: 500 })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(event).toBeGiven()
            expect(event.request).toEqual(jasmine.any(up.Request))
            expect(event.request.url).toMatchURL('/url')
          })

          it('is emitted when rendering from cache (so the user can apply same transformation)', async function() {
            const listener = jasmine.createSpy('up:fragment:loaded listener')
            up.on('up:fragment:loaded', listener)

            let html = (text) => `<div class="target">${text}</div>`

            await jasmine.populateCache('/cached-url', html('cached content'))

            htmlFixture(html('initial content'))

            let renderJob = up.render('.target', { url: '/cached-url', cache: true })
            await expectAsync(renderJob).toBeResolvedTo(jasmine.any(up.RenderResult))

            expect(listener).toHaveBeenCalled()
            expect(up.network.isBusy()).toBe(false)
          })

          it('is not emitted when preloading', async function() {
            const listener = jasmine.createSpy('up:fragment:loaded listener')
            up.on('up:fragment:loaded', listener)

            let target = fixture('.target')
            let link = fixture('a[href="/foo"][up-follow]', { text: 'label' })

            const preloadJob = up.link.preload(link)
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(listener).not.toHaveBeenCalled()

            jasmine.respondWith(`
              <div class="target">
                server content
              </div>
            `)

            await expectAsync(preloadJob).toBeResolved()

            expect(listener).not.toHaveBeenCalled()
            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(up.network.isBusy()).toBe(false)
          })

          it('is not emitted after a fatal network issue', async function() {
            const listener = jasmine.createSpy('up:fragment:loaded listener')
            up.on('up:fragment:loaded', listener)

            let target = fixture('.target')

            const renderJob = up.render({ target: '.target', url: '/some-url' })
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(listener).not.toHaveBeenCalled()

            jasmine.lastRequest().responseError()

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Offline))

            expect(listener).not.toHaveBeenCalled()
            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(up.network.isBusy()).toBe(false)
          })

          it('is not emitted when the server responds without content (e.g. 304 Not Modified)', async function() {
            const listener = jasmine.createSpy('up:fragment:loaded listener')
            up.on('up:fragment:loaded', listener)

            let target = fixture('.target')

            const renderJob = up.render({ target: '.target', url: '/some-url' })
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(listener).not.toHaveBeenCalled()

            jasmine.respondWith({ status: 304, responseText: '' })

            await expectAsync(renderJob).toBeResolvedTo(jasmine.any(up.RenderResult))

            expect(listener).not.toHaveBeenCalled()
            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(up.network.isBusy()).toBe(false)
          })

          it('is not emitted when rendering a local string of HTML', async function() {
            const listener = jasmine.createSpy('up:fragment:loaded listener')
            up.on('up:fragment:loaded', listener)

            let target = fixture('.target')

            const renderJob = up.render({ target: '.target', content: 'new text' })
            await wait()

            expect(listener).not.toHaveBeenCalled()
            expect('.target').toHaveText('new text')
          })

          describe('emission target', function() {

            it('is emitted on the element of the updating layer', async function() {
              makeLayers(2)
              expect(up.layer.current.isOverlay()).toBe(true)

              const one = up.layer.current.affix('#one')

              const spy = jasmine.createSpy('event.target spy')
              up.on('up:fragment:loaded', (event) => spy(event.target))

              up.render({ target: '#one', url: '/url' })
              await wait()

              jasmine.respondWithSelector('#one')
              await wait()

              expect(spy).toHaveBeenCalledWith(up.layer.current.element)
            })

            it('is emitted on the element of the base layer when opening a new overlay', async function() {
              makeLayers(2)
              const baseLayer = up.layer.current
              expect(baseLayer.isOverlay()).toBe(true)

              const spy = jasmine.createSpy('event.target spy')
              up.on('up:fragment:loaded', (event) => spy(event.target))

              up.render({ target: '#one', url: '/url', layer: 'new modal' })
              await wait()

              jasmine.respondWithSelector('#one')
              await wait()

              expect(spy).toHaveBeenCalledWith(baseLayer.element)
            })
          })
        }) // up:fragment:loaded event

        describe('when the server sends an X-Up-Events header', function() {

          it('emits these events', async function() {
            fixture('.element')

            up.render({ target: '.element', url: '/path' })

            const event1Plan = { type: 'foo', prop: 'bar ' }
            const event2Plan = { type: 'baz', prop: 'bam ' }

            spyOn(up, 'emit').and.callThrough()

            await wait()

            jasmine.respondWith({
              responseHeaders: { 'X-Up-Events': JSON.stringify([event1Plan, event2Plan]) },
              responseText: '<div class="element"></div>'
            })

            await wait()

            expect(up.emit).toHaveBeenCalledWith(jasmine.objectContaining(event1Plan))
            expect(up.emit).toHaveBeenCalledWith(jasmine.objectContaining(event2Plan))
          })

          it('accepts unquoted property names in the header value', async function() {
            fixture('.element')

            up.render({ target: '.element', url: '/path' })

            spyOn(up, 'emit').and.callThrough()

            await wait()

            jasmine.respondWith({
              responseHeaders: { 'X-Up-Events': '[{ type: "foo", prop: "bar" }]' },
              responseText: '<div class="element"></div>'
            })

            await wait()

            expect(up.emit).toHaveBeenCalledWith(jasmine.objectContaining({ type: "foo", prop: "bar" }))
          })

          it('emits these events for a failure response', async function() {
            fixture('.element')

            const renderPromise = up.render({ target: '.element', failTarget: '.element', url: '/path' })

            const eventPlan = { type: 'foo', prop: 'bar ' }

            spyOn(up, 'emit').and.callThrough()

            await wait()

            jasmine.respondWith({
              status: 422,
              responseHeaders: { 'X-Up-Events': JSON.stringify([eventPlan]) },
              responseText: '<div class="element"></div>'
            })

            await expectAsync(renderPromise).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(up.emit).toHaveBeenCalledWith(jasmine.objectContaining(eventPlan))
          })
        })

        describe('when the server sends an X-Up-Accept-Layer header', function() {

          describe('when updating an overlay', function() {

            it('accepts the layer with the header value', async function() {
              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({ onAccepted: callback, content: 'Initial content', target: '.target' })

              await wait()

              expect(up.layer.mode).toBe('modal')
              const promise = up.render({ url: '/path2', target: '.target' })

              await wait()

              expect(callback).not.toHaveBeenCalled()
              jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Accept-Layer': "123" } })

              await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(up.layer.mode).toBe('root')
              expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value: 123 }))
            })

            it('does not require the server to render content when the overlay will close anyway (when updating a layer)', async function() {
              const callback = jasmine.createSpy('onAccepted callback')

              up.layer.open({ onAccepted: callback, content: 'Original content', target: '.target' })

              await wait()

              expect(up.layer.mode).toBe('modal')
              const promise = up.render({ url: '/path2', target: '.target' })
              expect(callback).not.toHaveBeenCalled()

              await wait()

              jasmine.respondWith('', { responseHeaders: { 'X-Up-Accept-Layer': "null" } })

              await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(callback).toHaveBeenCalled()
            })

            it('makes the discarded response available to up:layer:accepted listeners as a { response } property 1', async function() {
              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({ onAccepted: callback, content: 'initial content', target: '.target' })

              await wait()

              expect(up.layer.mode).toBe('modal')
              const promise = up.render({ url: '/path2', target: '.target' })

              await wait()

              expect(callback).not.toHaveBeenCalled()

              jasmine.respondWith('<div class="target">new content</div>', { responseHeaders: { 'X-Up-Accept-Layer': "123" } })

              await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(callback.calls.mostRecent().args[0].response).toEqual(jasmine.any(up.Response))
              expect(callback.calls.mostRecent().args[0].response.text).toBe('<div class="target">new content</div>')
            })
          })

          describe('when updating the root layer', function() {
            it('ignores the header and updates the root layer with the response body', async function() {
              const element = fixture('.element', { text: 'old content' })
              const acceptedListener = jasmine.createSpy('up:layer:accepted listener')
              up.on('up:layer:accepted', acceptedListener)

              up.render({ url: '/path', target: '.element' })

              await wait()

              jasmine.respondWithSelector('.element', { text: 'new content', responseHeaders: { 'X-Up-Accept-Layer': "null" } })

              await wait()

              expect('.element').toHaveText('new content')
              expect(acceptedListener).not.toHaveBeenCalled()
            })
          })

          describe('when opening a layer', function() {

            it('accepts the layer that is about to open', async function() {
              const callback = jasmine.createSpy('onAccepted callback')

              const layerPromise = up.layer.open({ onAccepted: callback, url: '/path', target: '.target' })

              await wait()

              expect(callback).not.toHaveBeenCalled()

              jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Accept-Layer': "null" } })

              await expectAsync(layerPromise).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(callback).toHaveBeenCalled()
            })

            it('does not require the server to render content when the overlay will close anyway', async function() {
              const callback = jasmine.createSpy('onAccepted callback')
              const layerPromise = up.layer.open({ onAccepted: callback, url: '/path', target: '.target' })

              await wait()

              expect(callback).not.toHaveBeenCalled()

              jasmine.respondWith('', { responseHeaders: { 'X-Up-Accept-Layer': "null" } })

              await expectAsync(layerPromise).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(callback).toHaveBeenCalled()
            })
          })
        })


        describe('when the server sends an X-Up-Dismiss-Layer header', function() {

          it('dismisses the targeted overlay with the header value', async function() {
            const callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({ onDismissed: callback, url: '/path', target: '.target' })

            await wait()

            expect(up.layer.mode).toBe('root')
            jasmine.respondWithSelector('.target')

            await wait()

            expect(up.layer.mode).toBe('modal')
            const renderPromise = up.render({ url: '/path2', target: '.target' })

            await wait()

            expect(callback).not.toHaveBeenCalled()
            jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Dismiss-Layer': "123" } })

            await expectAsync(renderPromise).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(up.layer.mode).toBe('root')
            expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value: 123 }))
          })

          it('makes the discarded response available to up:layer:accepted listeners as a { response } property', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({ onDismissed: callback, target: '.target', content: 'Initial content' })

            await wait()

            expect(up.layer.mode).toBe('modal')
            const promise = up.render({ url: '/path2', target: '.target' })

            await wait()

            expect(callback).not.toHaveBeenCalled()
            jasmine.respondWith('<div class="target">new content</div>', { responseHeaders: { 'X-Up-Dismiss-Layer': "123" } })

            await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(callback.calls.mostRecent().args[0].response).toEqual(jasmine.any(up.Response))
            expect(callback.calls.mostRecent().args[0].response.text).toBe('<div class="target">new content</div>')
          })
        })

        describe('when the server sends an X-Up-Open-Layer header', function() {

          describe('when updating an overlay', function() {

            it('opens a new layer, ignoring the original { layer } option', async function() {
              fixture('#target', { text: 'old target' })
              up.render('#target', { url: '/path', layer: 'current' })
              await wait()

              jasmine.respondWith({ responseText: '<div id="overlay">overlay</div>', responseHeaders: { 'X-Up-Open-Layer': '{}', 'X-Up-Target': '#overlay' } })
              await wait()

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current).toHaveSelector('#overlay')
              expect('#overlay').toHaveText('overlay')
              expect('#target').toHaveText('old target')
            })

            it('opens a new layer with render options parsed from the header value', async function() {
              fixture('#target', { text: 'old target' })
              up.render('#target', { url: '/path' })
              await wait()

              jasmine.respondWith({ responseText: '<div id="overlay">overlay</div>', responseHeaders: { 'X-Up-Open-Layer': JSON.stringify({ target: '#overlay', mode: 'drawer', size: 'small' }) } })
              await wait()

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current).toHaveSelector('#overlay')
              expect(up.layer.current.mode).toBe('drawer')
              expect(up.layer.current.size).toBe('small')
              expect('#overlay').toHaveText('overlay')
            })

            it("resolves a :main target using the new overlay mode", async function() {
              up.layer.config.root.mainTargets = ['#root-target']
              up.layer.config.modal.mainTargets = ['#overlay-target']

              fixture('#root-target', { text: 'old root target' })
              up.render(':main', { url: '/path' })
              await wait()

              jasmine.respondWith({ responseText: '<div id="overlay-target">overlay</div>', responseHeaders: { 'X-Up-Open-Layer': '{}' } })
              await wait()

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current).toHaveSelector('#overlay-target')
              expect('#overlay-target').toHaveText('overlay')
              expect('#root-target').toHaveText('old root target')
            })

            describe('if no explicit target is given in either X-Up-Open-Layer or X-Up-Target header', function() {

              it('replaces the initial target with ":main"', async function() {
                up.layer.config.root.mainTargets = ['#root-target']
                up.layer.config.modal.mainTargets = ['#overlay-target']

                fixture('#root-target', { text: 'old root target' })
                up.render('#root-target', { url: '/path' })
                await wait()

                jasmine.respondWith({ responseText: '<div id="overlay-target">overlay</div>', responseHeaders: { 'X-Up-Open-Layer': '{}' } })
                await wait()

                expect(up.layer.current).toBeOverlay()
                expect(up.layer.current).toHaveSelector('#overlay-target')
                expect('#overlay-target').toHaveText('overlay')
                expect('#root-target').toHaveText('old root target')
              })

              it('ignores the initial target, even it exists in the response', async function() {
                up.layer.config.root.mainTargets = ['#root-target']
                up.layer.config.modal.mainTargets = ['#overlay-target']

                fixture('#root-target', { text: 'old root target' })
                up.render('#root-target', { url: '/path' })
                await wait()

                jasmine.respondWith({
                  responseText: `
                    <div id="root-target">new root target</div>
                    <div id="overlay-target">new overlay target</div>
                  `,
                  responseHeaders: { 'X-Up-Open-Layer': '{}' }
                })
                await wait()

                expect(up.layer.current).toBeOverlay()
                expect(up.layer.current).not.toHaveSelector('#root-target')
                expect(up.layer.current).toHaveSelector('#overlay-target')
                expect('#root-target').toHaveText('old root target')
              })

            })

            describe('callbacks', function() {

              beforeEach(function() {
                window.callbackSpy = jasmine.createSpy('callback spy')
              })

              afterEach(function() {
                delete window.callbackSpy
              })

              it('allows to pass a callback string as { onOpened }', async function() {
                fixture('#target', { text: 'old target' })
                up.render('#target', { url: '/path' })
                await wait()

                let openLayerOptions = {
                  target: '#overlay',
                  onOpened: 'nonce-specs-nonce window.callbackSpy(event)'
                }

                jasmine.respondWith({
                  responseText: '<div id="overlay">overlay</div>',
                  responseHeaders: { 'X-Up-Open-Layer': JSON.stringify(openLayerOptions) }
                })
                await wait()

                expect(up.layer.current).toBeOverlay()
                expect(up.layer.current).toHaveSelector('#overlay')
                expect(window.callbackSpy).toHaveBeenCalledWith(jasmine.anyEvent('up:layer:opened'))
              })

              it('allows to pass a callback string as { onDismissed }', async function() {
                fixture('#target', { text: 'old target' })
                up.render('#target', { url: '/path' })
                await wait()

                let openLayerOptions = {
                  target: '#overlay',
                  onDismissed: 'nonce-specs-nonce window.callbackSpy(event)'
                }

                jasmine.respondWith({
                  responseText: '<div id="overlay">overlay</div>',
                  responseHeaders: { 'X-Up-Open-Layer': JSON.stringify(openLayerOptions) }
                })
                await wait()

                expect(up.layer.current).toBeOverlay()
                expect(up.layer.current).toHaveSelector('#overlay')
                expect(window.callbackSpy).not.toHaveBeenCalled()

                await up.layer.dismiss()

                expect(up.layer.current).toBeRootLayer()
                expect(window.callbackSpy).toHaveBeenCalledWith(jasmine.anyEvent('up:layer:dismissed'))
              })

            })

          })

          describe('when already opening an overlay', function() {

            it('still opens an overlay', async function() {
              up.render({ target: '#overlay', url: '/path', layer: 'new' })
              await wait()

              jasmine.respondWith({ responseText: '<div id="overlay">overlay</div>', responseHeaders: { 'X-Up-Open-Layer': '{}', 'X-Up-Target': '#overlay' } })
              await wait()

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current).toHaveSelector('#overlay')
              expect('#overlay').toHaveText('overlay')
            })

            it('opens a new layer with render options parsed from the header value', async function() {
              up.render({ target: '#initial-target', url: '/path', layer: 'new' })
              await wait()

              jasmine.respondWith({ responseText: '<div id="overlay">overlay</div>', responseHeaders: { 'X-Up-Open-Layer': JSON.stringify({ target: '#overlay', mode: 'drawer', size: 'small' }) } })
              await wait()

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current).toHaveSelector('#overlay')
              expect(up.layer.current.mode).toBe('drawer')
              expect(up.layer.current.size).toBe('small')
              expect('#overlay').toHaveText('overlay')
            })

            it('uses default overlay options when no explicit options are given in the header value', async function() {
              up.render({ target: '#initial-target', url: '/path', layer: 'new', mode: 'drawer', size: 'small' })
              await wait()

              jasmine.respondWith({ responseText: '<div id="overlay">overlay</div>', responseHeaders: { 'X-Up-Open-Layer': JSON.stringify({ target: '#overlay' }) } })
              await wait()

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current).toHaveSelector('#overlay')
              expect(up.layer.current.mode).toBe('modal')
              expect(up.layer.current.size).toBe('medium')
              expect('#overlay').toHaveText('overlay')

            })

          })

        })

        describe('when the server sends no content', function() {

          it('succeeds when the server sends an empty body with HTTP status 304 (not modified)', async function() {
            fixture('.one', { text: 'old one' })
            fixture('.two', { text: 'old two' })

            const promise = up.render({ target: '.one', url: '/path' })

            await wait()

            jasmine.respondWith({ status: 304, responseText: '' })

            await wait()

            expect('.one').toHaveText('old one')
            expect('.two').toHaveText('old two')

            let result = await promiseState(promise)
            expect(result.state).toBe('fulfilled')
          })

          it('succeeds when the server sends an empty body with HTTP status 204 (no content)', async function() {
            fixture('.one', { text: 'old one' })
            fixture('.two', { text: 'old two' })

            const promise = up.render({ target: '.one', url: '/path' })

            await wait()

            jasmine.respondWith({ status: 204, responseText: '' })

            await wait()

            expect('.one').toHaveText('old one')
            expect('.two').toHaveText('old two')

            let result = await promiseState(promise)
            expect(result.state).toBe('fulfilled')
          })

          it('does not call on { onRendered } callback', async function() {
            fixture('.one', { text: 'old one' })
            fixture('.two', { text: 'old two' })

            const onRendered = jasmine.createSpy('onRendered callback')
            up.render({ target: '.one', url: '/path', onRendered })

            await wait()

            jasmine.respondWith({ status: 304, responseText: '' })

            await wait()

            expect('.one').toHaveText('old one')
            expect(onRendered).not.toHaveBeenCalled()
          })
        })

        describe('when the server sends an X-Up-Target header', function() {

          it('renders the server-provided target', async function() {
            fixture('.one', { text: 'old content' })
            fixture('.two', { text: 'old content' })

            up.render({ target: '.one', url: '/path' })
            await wait()

            jasmine.respondWithSelector('.two', { text: 'new content', responseHeaders: { 'X-Up-Target': '.two' } })
            await wait()

            expect('.one').toHaveText('old content')
            expect('.two').toHaveText('new content')
          })

          it('renders the server-provided target for a failed update', async function() {
            fixture('.one', { text: 'old content' })
            fixture('.two', { text: 'old content' })
            fixture('.three', { text: 'old content' })

            const renderJob = up.render({ target: '.one', failTarget: '.two', url: '/path' })

            await wait()

            jasmine.respondWithSelector('.three', { text: 'new content', responseHeaders: { 'X-Up-Target': '.three' }, status: 500 })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect('.one').toHaveText('old content')
            expect('.two').toHaveText('old content')
            expect('.three').toHaveText('new content')
          })

          describe('when the server sends X-Up-Target: :none', function() {

            it('does not require a response body and succeeds', async function() {
              fixture('.one', { text: 'old one' })
              fixture('.two', { text: 'old two' })

              const renderOptions = { target: '.one', url: '/path' }
              const promise = up.render(renderOptions)
              await wait()

              jasmine.respondWith({ responseHeaders: { 'X-Up-Target': ':none' }, responseText: '', contentType: 'text/plain' })
              await wait()

              expect('.one').toHaveText('old one')
              expect('.two').toHaveText('old two')

              await expectAsync(promise).toBeResolvedTo(jasmine.any(up.RenderResult))
              await expectAsync(promise).toBeResolvedTo(jasmine.objectContaining({
                ok: true,
                none: true,
                target: ':none',
                fragments: [],
                renderOptions: jasmine.objectContaining({ target: ':none', url: '/path' }),
              }))
            })

            it('does not call an { onRendered } callback', async function() {
              fixture('.one', { text: 'old one' })

              const onRendered = jasmine.createSpy('onRendered callback')
              up.render({ target: '.one', url: '/path', onRendered })
              await wait()

              jasmine.respondWith({ responseHeaders: { 'X-Up-Target': ':none' }, responseText: '', contentType: 'text/plain' })
              await wait()

              expect('.one').toHaveText('old one')
              expect(onRendered).not.toHaveBeenCalled()
            })
          })

          it('lets the server sends an abstract target like :main', async function() {
            fixture('.one', { text: 'old content' })
            fixture('.two', { text: 'old content' })
            up.fragment.config.mainTargets = ['.two']

            up.render({ target: '.one', url: '/path' })
            await wait()

            jasmine.respondWithSelector('.two', { text: 'new content', responseHeaders: { 'X-Up-Target': ':main' } })
            await wait()

            expect('.one').toHaveText('old content')
            expect('.two').toHaveText('new content')
          })
        })

        describe('for a cross-origin URL', function() {

          it('loads the content in a new page', async function() {
            const loadPage = spyOn(up.network, 'loadPage')

            fixture('.one')
            up.render({ target: '.one', url: 'http://other-domain.com/path/to' })

            await wait()

            expect(loadPage).toHaveBeenCalledWith(jasmine.objectContaining({ url: 'http://other-domain.com/path/to' }))
            expect(jasmine.Ajax.requests.count()).toBe(0)
          })

          it("returns an pending promise (since we do not want any callbacks to run as we're tearing down this page context)", function(done) {
            const loadPage = spyOn(up.network, 'loadPage')

            fixture('.one')
            const promise = up.render({ target: '.one', url: 'http://other-domain.com/path/to' })

            promiseState(promise).then(function(result) {
              expect(result.state).toBe('pending')
              done()
            })
          })
        })

        describeFallback('canPushState', function() {

          describe('when options.history is truthy', function() {

            it('loads the content in a new page', async function() {
              const loadPage = spyOn(up.network, 'loadPage')

              fixture('.one')
              up.render({ target: '.one', url: '/path', history: true })

              await wait()

              expect(loadPage).toHaveBeenCalledWith(jasmine.objectContaining({ url: '/path' }))
              expect(jasmine.Ajax.requests.count()).toBe(0)
            })

            it("returns an pending promise (since we do not want any callbacks to run as we're tearing down this page context)", async function() {
              const loadPage = spyOn(up.network, 'loadPage')

              fixture('.one')
              const promise = up.render({ target: '.one', url: '/path', history: true })

              const result = await promiseState(promise)
              expect(result.state).toBe('pending')
            })
          })

          describe('when options.history is falsy', function() {
            it("does not load the content in a new page", async function() {
              const loadPage = spyOn(up.network, 'loadPage')

              fixture('.one')
              up.render({ target: '.one', url: '/path' })

              await wait()

              expect(loadPage).not.toHaveBeenCalled()
              expect(jasmine.Ajax.requests.count()).toBe(1)
            })
          })
        })
      })

    })

  })

})
