const e = up.element

extendDescribe('up.fragment', function() {

  extendDescribe('JavaScript functions', function() {

    extendDescribe('up.render()', function() {

      describe('with { cache } option', function() {

        it('reuses a cached request with { cache: true }', async function() {
          fixture('.element')

          up.render('.element', { url: '/path', cache: true })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect({ target: '.element', url: '/path' }).toBeCached()

          up.render('.element', { url: '/path', cache: true, abort: false })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
        })

        it('reuses a cached request when rendering the same location, but with a #hash', async function() {
          fixture('.element')

          up.render('.element', { url: '/path', cache: true })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect({ target: '.element', url: '/path' }).toBeCached()

          up.render('.element', { url: '/path#other', cache: true, abort: false })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
        })

        it('does not reuse a cached request with { cache: false }', async function() {
          fixture('.element')

          up.render('.element', { url: '/path', cache: false })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect({ target: '.element', url: '/path' }).not.toBeCached()

          up.render('.element', { url: '/path', cache: false, abort: false })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)
        })

        it('does not reuse a cached request when no { cache } option is given', async function() {
          fixture('.element')

          up.render('.element', { url: '/path' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect({ target: '.element', url: '/path' }).not.toBeCached()

          up.render('.element', { url: '/path', abort: false })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)
        })

        describe('cache revalidation with { revalidate }', function() {

          beforeEach(async function() {
            fixture('.target', { text: 'initial text' })
            up.request('/cached-path', { cache: true })
            await wait()

            jasmine.respondWithSelector('.target', {
              text: 'cached text',
              responseHeaders: {
                'Etag': 'W/"0123456789"',
                'Last-Modified': 'Wed, 21 Oct 2015 18:14:00 GMT'
              }
            })

            await wait()

            expect({ url: '/cached-path' }).toBeCached()
            expect('.target').toHaveText('initial text')
          })

          it('reloads a fragment that was rendered from an expired cached response', async function() {
            up.render('.target', { url: '/cached-path', cache: true, revalidate: true })

            await wait()

            expect('.target').toHaveText('cached text')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')

            jasmine.respondWithSelector('.target', { text: 'verified text' })

            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('verified text')
          })

          it('reloads expired content that was rendered into a new overlay', async function() {
            up.render('.target', { layer: 'new', url: '/cached-path', cache: true, revalidate: true })

            await wait()

            expect(up.layer.current).toBeOverlay()
            expect('up-modal .target').toHaveText('cached text')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')

            jasmine.respondWithSelector('.target', { text: 'verified text' })

            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect(up.layer.current).toBeOverlay()
            expect('up-modal .target').toHaveText('verified text')
          })

          it('reloads multiple targets', async function() {
            fixture('#foo', { text: 'initial foo' })
            fixture('#bar', { text: 'initial bar' })

            up.request('/multi-cached-path', { cache: true })

            await wait()

            jasmine.respondWith(`
              <div id="foo">cached foo</div>
              <div id="bar">cached bar</div>
            `)

            await wait()

            expect({ url: '/multi-cached-path' }).toBeCached()

            up.render('#foo, #bar', { url: '/multi-cached-path', cache: true, revalidate: true })

            await wait()

            expect('#foo').toHaveText('cached foo')
            expect('#bar').toHaveText('cached bar')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#foo, #bar')

            jasmine.respondWith(`
              <div id="foo">verified foo</div>
              <div id="bar">verified bar</div>
            `)

            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('#foo').toHaveText('verified foo')
            expect('#bar').toHaveText('verified bar')
          })

          it('reloads multiple targets when an { origin } is given (bugfix)', async function() {
            fixture('#foo', { text: 'initial foo' })
            fixture('#bar', { text: 'initial bar' })
            const origin = fixture('#origin', { text: 'origin' })

            up.request('/multi-cached-path', { cache: true })

            await wait()

            jasmine.respondWith(`
              <div id="foo">cached foo</div>
              <div id="bar">cached bar</div>
            `)

            await wait()

            expect({ url: '/multi-cached-path' }).toBeCached()

            up.render('#foo, #bar', { url: '/multi-cached-path', cache: true, revalidate: true, origin }).finished

            await wait()

            expect('#foo').toHaveText('cached foo')
            expect('#bar').toHaveText('cached bar')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#foo, #bar')

            jasmine.respondWith(`
              <div id="foo">verified foo</div>
              <div id="bar">verified bar</div>
            `)

            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('#foo').toHaveText('verified foo')
            expect('#bar').toHaveText('verified bar')
          })

          describe('scrolling', function() {

            it('keeps scroll positions of reloaded viewports', async function() {
              let html = (text) => `
                <div id="target">
                  <div id="viewport" up-viewport style="overflow-y: scroll; height: 100px;">
                    <div id="content" style="height: 10000px;">
                      ${text}
                    </div>
                  </div>
                </div>
              `

              await jasmine.populateCache({ url: '/cached' }, html('expired content'))
              await up.cache.expire()

              expect({ url: '/cached' }).toBeCached()
              expect({ url: '/cached' }).toBeExpired()

              htmlFixtureList(html('page content'))
              expect('#target').toHaveText('page content')

              up.navigate({ target: '#target', url: '/cached', cache: true, revalidate: true })
              await wait()

              expect('#target').toHaveText('expired content')
              expect(up.network.isBusy()).toBe(true)

              document.querySelector('#viewport').scrollTop = 433
              expect('#viewport').toBeScrolledTo(433)

              jasmine.respondWith(html('revalidated content'))
              await wait()

              expect('#target').toHaveText('revalidated content')
              expect('#viewport').toBeScrolledTo(433)
            })
          })

          describe('revalidation of hungry fragments', function() {

            it('reloads hungry fragments when an { origin } is given (bugfix)', async function() {
              let html = (labelPrefix) => `
                <div id="foo">${labelPrefix} foo</div>
                <div id="bar" up-hungry>${labelPrefix} bar</div>
              `

              htmlFixtureList(html('initial'))
              const origin = fixture('#origin', { text: 'origin' })

              up.request('/multi-cached-path', { cache: true })
              await wait()

              jasmine.respondWith(html('cached'))
              await wait()

              expect({ url: '/multi-cached-path' }).toBeCached()

              up.render('#foo', { url: '/multi-cached-path', cache: true, revalidate: true, origin })
              await wait()

              expect('#foo').toHaveText('cached foo')
              expect('#bar').toHaveText('cached bar')
              expect(up.network.isBusy()).toBe(true)
              expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toContain('#foo')

              jasmine.respondWith(html('verified'))
              await wait()

              expect('#foo').toHaveText('verified foo')
              expect('#bar').toHaveText('verified bar')
              expect(up.network.isBusy()).toBe(false)
            })

            it('reloads hungry fragments on another layer', async function() {
              let hungryHTML = (labelPrefix) => `
                <div id="hungry" up-hungry up-if-layer="any">${labelPrefix} hungry</div>
              `

              let overlayHTML = (labelPrefix) => `
                <div id="overlay">${labelPrefix} overlay</div>
              `

              // Root only has the hungry
              htmlFixture(hungryHTML('initial'))

              // Initial overlay is rendered without the cache being involved
              await up.layer.open({ fragment: overlayHTML('initial')  })

              await jasmine.populateCache('/overlay2', hungryHTML('cached') + overlayHTML('cached'))
              up.cache.expire()

              up.render('#overlay', { layer: 'new', url: '/overlay2', cache: true, revalidate: true })
              await wait()

              expect(up.fragment.get('#hungry', { layer: 'root' })).toHaveText('cached hungry')
              expect(up.fragment.get('#overlay', { layer: 'overlay' })).toHaveText('cached overlay')
              expect(up.network.isBusy()).toBe(true)
              expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toContain('#overlay')

              jasmine.respondWith(hungryHTML('verified') + overlayHTML('verified'))
              await wait()

              expect(up.fragment.get('#hungry', { layer: 'root' })).toHaveText('verified hungry')
              expect(up.fragment.get('#overlay', { layer: 'overlay' })).toHaveText('verified overlay')
              expect(up.network.isBusy()).toBe(false)
            })

            it('reloads hungry fragments on another layer when opening a new layer', async function() {
              let hungryHTML = (labelPrefix) => `
                <div id="hungry" up-hungry up-if-layer="any">${labelPrefix} hungry</div>
              `

              let overlayHTML = (labelPrefix) => `
                <div id="overlay">${labelPrefix} overlay</div>
              `

              // Root only has the hungry
              htmlFixture(hungryHTML('initial'))

              await jasmine.populateCache('/overlay', hungryHTML('cached') + overlayHTML('cached'))

              up.render('#overlay', { layer: 'new', url: '/overlay', cache: true, revalidate: true })
              await wait()

              expect(up.fragment.get('#hungry', { layer: 'root' })).toHaveText('cached hungry')
              expect(up.fragment.get('#overlay', { layer: 'overlay' })).toHaveText('cached overlay')
              expect(up.network.isBusy()).toBe(true)
              expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toContain('#overlay')

              jasmine.respondWith(hungryHTML('verified') + overlayHTML('verified'))
              await wait()

              expect(up.fragment.get('#hungry', { layer: 'root' })).toHaveText('verified hungry')
              expect(up.fragment.get('#overlay', { layer: 'overlay' })).toHaveText('verified overlay')
              expect(up.network.isBusy()).toBe(false)
            })

          })

          it('does not verify a fragment rendered from a recent cached response with { revalidate: "auto" }', async function() {
            up.fragment.config.autoRevalidate = (response) => response.age >= (10 * 1000)

            up.render('.target', { url: '/cached-path', cache: true, revalidate: 'auto' })
            await wait()

            expect('.target').toHaveText('cached text')
            expect(up.network.isBusy()).toBe(false)
          })

          it("does not verify a fragment that wasn't rendered from a cached response", async function() {
            up.render('.target', { url: '/uncached-path', cache: true, revalidate: true })
            await wait()

            expect(up.network.isBusy()).toBe(true)

            jasmine.respondWithSelector('.target', { text: 'server text' })
          })

          it('does not verify a fragment when prepending content with :before', async function() {
            up.render('.target:before', { url: '/cached-path', cache: true, revalidate: true })
            await wait()

            expect('.target').toHaveText("cached textinitial text")
            expect(up.network.isBusy()).toBe(false)
          })

          it('does not verify a fragment when appending content with :after', async function() {
            up.render('.target:after', { url: '/cached-path', cache: true, revalidate: true })
            await wait()

            expect('.target').toHaveText("initial textcached text")
            expect(up.network.isBusy()).toBe(false)
          })

          it('does not render a second time if the revalidation response is a 304 Not Modified', async function() {
            up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
            await wait()

            expect('.target').toHaveText('cached text')
            expect(up.network.isBusy()).toBe(true)

            jasmine.respondWith({ status: 304 })
            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('cached text')
          })

          it('does not render a second time if the revalidation response has the same text as the expired response', async function() {
            const insertedSpy = jasmine.createSpy('up:fragment:inserted listener')
            up.on('up:fragment:inserted', insertedSpy)
            up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
            await wait()

            expect(insertedSpy.calls.count()).toBe(1)
            const target = document.querySelector('.target')
            expect(target).toHaveText('cached text')
            target.innerText = 'text changed on client'

            expect(up.network.isBusy()).toBe(true)

            jasmine.respondWithSelector('.target', { text: 'cached text' })
            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect(insertedSpy.calls.count()).toBe(1)
            expect('.target').toHaveText('text changed on client')
          })

          it('allows to define which responses to verify in up.fragment.config.autoRevalidate')

          it('revalidates after the initial round of render callbacks', async function() {
            fixture('#target', { text: 'initial text' })
            await jasmine.populateCache('/foo', '<div id="target">expired text</div>')
            up.cache.expire()

            const sequence = []
            const renderedCallback = () => sequence.push('renderedCallback')

            const renderedPromise = () => sequence.push('renderedPromise')

            const revalidateOption = function() {
              sequence.push('revalidateOption')
              return true
            }

            up.on('up:request:load', () => sequence.push('requestLoad'))

            up.on('up:request:loaded', () => sequence.push('requestLoaded'))

            expect('#target').toHaveText('initial text')
            expect(sequence).toEqual([])

            const job = up.render({ target: '#target', url: '/foo', onRendered: renderedCallback, cache: true, revalidate: revalidateOption })
            job.then(renderedPromise)
            await wait()

            expect('#target').toHaveText('expired text')
            expect(sequence).toEqual(['renderedCallback', 'renderedPromise', 'revalidateOption', 'requestLoad'])

            jasmine.respondWithSelector('#target', { text: 'revalidated text' })
            await wait()

            expect('#target').toHaveText('revalidated text')
            expect(sequence).toEqual(['renderedCallback', 'renderedPromise', 'revalidateOption', 'requestLoad', 'requestLoaded', 'renderedCallback'])
          })

          it('does not use options like { confirm } or { feedback } when verifying', async function() {
            const confirmSpy = spyOn(window, 'confirm').and.returnValue(true)

            up.render('.target', { url: '/cached-path', cache: true, revalidate: true, confirm: true, feedback: true })
            expect(confirmSpy.calls.count()).toBe(1)
            await wait()

            expect('.target').toHaveText('cached text')
            expect('.target').not.toHaveClass('up-loading')
            expect(up.network.isBusy()).toBe(true)
            expect(confirmSpy.calls.count()).toBe(1)
          })

          it("delays revalidation until the original transition completed, so an element isn't changed in-flight", async function() {
            up.motion.config.enabled = true
            up.render('.target', { url: '/cached-path', cache: true, revalidate: true, transition: 'cross-fade', easing: 'linear', duration: 200 })
            await wait()

            expect('.target').toHaveText('cached text')
            expect('.target:not(.up-destroying)').toHaveOwnOpacity(0, 0.15)
            expect(up.network.isBusy()).toBe(false)

            await wait(300)

            expect('.target:not(.up-destroying)').toHaveOwnOpacity(1)
            expect(up.network.isBusy()).toBe(true)

            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect('.target').toHaveText('verified text')
          })

          it('delays up.render().finished promise until the fragment was verified', async function() {
            const finishedCallback = jasmine.createSpy('finished callback')

            const job = up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
            job.finished.then(finishedCallback)
            await wait()

            expect('.target').toHaveText('cached text')
            expect(finishedCallback).not.toHaveBeenCalled()

            expect(up.network.isBusy()).toBe(true)

            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('verified text')
            expect(finishedCallback).toHaveBeenCalledWith(jasmine.any(up.RenderResult))
          })

          it('delays an { onFinished } callback until the fragment was verified', async function() {
            const finishedCallback = jasmine.createSpy('finished callback')

            const job = up.render('.target', { url: '/cached-path', cache: true, revalidate: true, onFinished: finishedCallback })
            await wait()

            expect('.target').toHaveText('cached text')
            expect(finishedCallback).not.toHaveBeenCalled()

            expect(up.network.isBusy()).toBe(true)

            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('verified text')
            expect(finishedCallback).toHaveBeenCalledWith(jasmine.any(up.RenderResult))
          })

          it('runs the { onRendered } a second time for the second render pass', async function() {
            const onRendered = jasmine.createSpy('onRendered callback')

            up.render('.target', { url: '/cached-path', cache: true, revalidate: true, onRendered })
            await wait()

            expect('.target').toHaveText('cached text')
            expect(onRendered.calls.count()).toBe(1)

            expect(up.network.isBusy()).toBe(true)
            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect(onRendered.calls.count()).toBe(2)
            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('verified text')
          })

          it('does not re-emit a { guardEvent } for the second render pass', async function() {
            const guardEventListener = jasmine.createSpy('guard event listener')
            const guardEvent = up.event.build('my:guard')
            up.on('my:guard', guardEventListener)

            up.render('.target', { url: '/cached-path', cache: true, revalidate: true, guardEvent })
            await wait()

            expect('.target').toHaveText('cached text')
            expect(guardEventListener.calls.count()).toBe(1)

            expect(up.network.isBusy()).toBe(true)
            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect('.target').toHaveText('verified text')
            expect(guardEventListener.calls.count()).toBe(1)
          })

          it("preserves user's changes in scroll position between the first and second render pass", async function() {
            fixtureStyle(`
              .target { height: 50000px; background-color: red }
            `)

            up.viewport.root.scrollTop = 0

            up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
            await wait()

            expect('.target').toHaveText('cached text')
            expect(up.network.isBusy()).toBe(true)

            up.viewport.root.scrollTop = 500

            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect('.target').toHaveText('verified text')
            expect(up.viewport.root.scrollTop).toBe(500)
          })

          it("preserves user's changes in focus between the first and second render pass", async function() {
            up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
            await wait()

            expect('.target').toHaveText('cached text')
            expect(up.network.isBusy()).toBe(true)

            const input = e.affix(document.querySelector('.target'), 'input[name=foo]')
            input.focus()

            jasmine.respondWithSelector('.target input[name=foo]')
            await wait()

            expect('input[name=foo]').toBeFocused()
          })

          it('revalidates a fallback target', async function() {
            up.fragment.config.mainTargets = ['.target']
            up.render({ url: '/cached-path', cache: true, revalidate: true, fallback: true })
            await wait()

            expect('.target').toHaveText('cached text')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')

            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('verified text')
          })

          it('updates the original { failTarget } if the revalidation response has an error code', async function() {
            fixture('.fail-target', { text: 'old failure text' })

            up.render({ target: '.target', failTarget: '.fail-target', url: '/cached-path', cache: true, revalidate: true })
            await wait()

            expect('.target').toHaveText('cached text')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')

            jasmine.respondWithSelector('.fail-target', { text: 'new failure text', status: 500 })
            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('cached text')
            expect('.fail-target').toHaveText('new failure text')
          })

          it('revalidates when a link in an overlay is loading cached content into a parent layer (bugfix)', async function() {
            expect('.target').toHaveText('initial text')

            up.layer.open({ content: `
              <a href="/cached-path" up-target=".target" up-layer="root" up-revalidate="true" id="overlay-link">label</a>
            ` })
            await wait()

            const overlayLink = document.querySelector('#overlay-link')
            Trigger.clickSequence(overlayLink)
            await wait()

            expect('.target').toHaveText('cached text')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')

            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('verified text')
          })

          it('reloads the correct path when when rendering a relative URL, and does not use its own location as a new base', async function() {
            up.history.config.enabled = true

            await jasmine.populateCache({ url: '/sub1/sub2/index.html' }, { status: 200, responseText: '<div class="target">cached text</div>' })
            up.cache.expire()

            up.history.replace('/sub1/')

            up.render('.target', { url: 'sub2/index.html', cache: true, revalidate: true, history: true })
            await wait()

            expect('.target').toHaveText('cached text')
            expect(up.history.location).toMatchURL('/sub1/sub2/index.html')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')
            expect(jasmine.lastRequest().url).toMatchURL('/sub1/sub2/index.html')
            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('verified text')
            expect(jasmine.lastRequest().url).toMatchURL('/sub1/sub2/index.html')
            expect(up.history.location).toMatchURL('/sub1/sub2/index.html')
          })

          it('calls compilers with a third argument containing a { revalidating } property', async function() {
            const compiler = jasmine.createSpy('compiler')
            up.compiler('.target', compiler)

            expect(compiler.calls.count()).toBe(1)

            up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
            await wait()

            expect('.target').toHaveText('cached text')
            expect(compiler.calls.count()).toBe(2)

            expect(up.network.isBusy()).toBe(true)

            jasmine.respondWithSelector('.target', { text: 'validated content' })
            await wait()

            expect('.target').toHaveText('validated content')
            expect(compiler.calls.count()).toBe(3)
            expect(compiler.calls.mostRecent().args).toEqual([
              jasmine.any(Element),
              jasmine.any(Object),
              jasmine.objectContaining({
                revalidating: true
              })
            ])
          })

          it('resends ETag and Last-Modified since headers from the cached response', async function() {
            up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
            await wait()

            expect('.target').toHaveText('cached text')

            expect(up.network.isBusy()).toBe(true)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')
            expect(jasmine.lastRequest().requestHeaders['If-None-Match']).toBe('W/"0123456789"')
            expect(jasmine.lastRequest().requestHeaders['If-Modified-Since']).toBe('Wed, 21 Oct 2015 18:14:00 GMT')

            jasmine.respondWithSelector('.target', { text: 'verified text' })
            await wait()

            expect(up.network.isBusy()).toBe(false)
            expect('.target').toHaveText('verified text')
          })

          describe('if revalidation responded with 304 Not Modified', function() {

            it('does not call { onRendered } a second time', async function() {
              const onRendered = jasmine.createSpy('onRendered handler')
              up.render('.target', { url: '/cached-path', cache: true, revalidate: true, onRendered })
              await wait()

              expect(onRendered.calls.count()).toBe(1)
              expect('.target').toHaveText('cached text')

              expect(up.network.isBusy()).toBe(true)
              jasmine.respondWith({ status: 304 })
              await wait()

              expect(up.network.isBusy()).toBe(false)
              expect(onRendered.calls.count()).toBe(1)
              expect('.target').toHaveText('cached text')
            })

            it('fulfills up.render().finished promise with the up.RenderResult from the first render pass')

            it('calls { onFinished } with the cached up.RenderResult from the first render pass', async function() {
              const onFinished = jasmine.createSpy('onFinished handler')
              const onRendered = jasmine.createSpy('onRendered handler')
              const renderOptions = { url: '/cached-path', cache: true, revalidate: true }
              up.render('.target', { ...renderOptions, onRendered, onFinished })
              await wait()

              expect('.target').toHaveText('cached text')
              expect(onRendered).toHaveBeenCalled()

              const renderedResult = onRendered.calls.argsFor(0)[0]
              expect(renderedResult).toEqual(jasmine.any(up.RenderResult))
              expect(renderedResult.ok).toBe(true)
              expect(renderedResult.none).toBe(false)
              expect(renderedResult.fragment).toMatchSelector('.target')
              expect(renderedResult.renderOptions).toEqual(jasmine.objectContaining(renderOptions))


              expect(up.network.isBusy()).toBe(true)
              jasmine.respondWith({ status: 304 })
              await wait()

              expect('.target').toHaveText('cached text')
              expect(onFinished).toHaveBeenCalled()

              const finishedResult = onFinished.calls.argsFor(0)[0]
              expect(finishedResult).toEqual(jasmine.any(up.RenderResult))
              // expect(finishedResult.ok).toBe(true)
              expect(finishedResult.none).toBe(false)
              expect(finishedResult.fragment).toMatchSelector('.target')
              expect(finishedResult.renderOptions).toEqual(jasmine.objectContaining(renderOptions))
            })

            it('keeps the older cache entry that did have content', async function() {
              const job1 = up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
              await wait()

              expect('.target').toHaveText('cached text')

              await expectAsync(job1).toBeResolvedTo(jasmine.any(up.RenderResult))
              await expectAsync(job1.finished).toBePending()

              await wait()

              expect(up.network.isBusy()).toBe(true)

              jasmine.respondWith({ status: 304 })

              await expectAsync(job1.finished).toBeResolvedTo(jasmine.any(up.RenderResult))
              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')

              // Simulate navigating to another page
              up.render('.target', { content: 'other text' })
              expect('.target').toHaveText('other text')

              // Re-render the cached content that we could not revalidate earlier.
              const job2 = up.render('.target', { url: '/cached-path', cache: true, revalidate: true })

              // For some reason, with migrate loaded, the revalidation request is in the queue but has not yet been sent
              await wait()

              // See that we kept the last known response in the cache.
              expect('.target').toHaveText('cached text')

              // We now have a second revalidation request.
              await expectAsync(job2.finished).toBePending()

              expect(up.network.isBusy()).toBe(true)

              jasmine.respondWith({ status: 304 })

              await expectAsync(job1.finished).toBeResolvedTo(jasmine.any(up.RenderResult))
              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')
            })
          })

          describe('if revalidation failed due to a network error', function() {

            it('rejects up.render().finished promise', async function() {
              const job = up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
              await wait()

              expect('.target').toHaveText('cached text')

              await expectAsync(job).toBeResolvedTo(jasmine.any(up.RenderResult))
              await expectAsync(job.finished).toBePending()

              expect(up.network.isBusy()).toBe(true)

              jasmine.lastRequest().responseError()

              await expectAsync(job.finished).toBeRejectedWith(jasmine.any(up.Offline))
              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')
            })

            it('rejects up.render().finished promise if there also is an { onFinished } callback (bugfix)', async function() {
              const onFinished = jasmine.createSpy('onFinished callback')
              const job = up.render('.target', { url: '/cached-path', cache: true, revalidate: true, onFinished })
              await wait()

              expect('.target').toHaveText('cached text')

              await expectAsync(job).toBeResolvedTo(jasmine.any(up.RenderResult))
              await expectAsync(job.finished).toBePending()

              expect(up.network.isBusy()).toBe(true)

              jasmine.lastRequest().responseError()

              await expectAsync(job.finished).toBeRejectedWith(jasmine.any(up.Offline))
              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')

              expect(onFinished).not.toHaveBeenCalled()
            })

            it('logs to the error console and there also is an { onFinished } callback (bugfix)', async function() {
              const onFinished = jasmine.createSpy('onFinished callback')
              const job = up.render('.target', { url: '/cached-path', cache: true, revalidate: true, onFinished })
              const logErrorSpy = spyOn(up, 'puts').and.callThrough()
              await wait()

              expect('.target').toHaveText('cached text')

              await expectAsync(job).toBeResolvedTo(jasmine.any(up.RenderResult))
              await expectAsync(job.finished).toBePending()

              expect(up.network.isBusy()).toBe(true)

              jasmine.lastRequest().responseError()

              await expectAsync(job.finished).toBeRejectedWith(jasmine.any(up.Offline))
              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')

              expect(logErrorSpy.calls.mostRecent().args[1]).toMatch(/Cannot load request/i)
            })

            // Cannot get this spec to work in both Chrome and Safari. See comment in up.RenderJob.
            xit('reports an unhandled rejection if no catch() handler is attached to the up.render().finished promise', async function() {
              const job = up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
              await wait()

              expect('.target').toHaveText('cached text')

              await wait()

              // Still revalidating
              expect(up.network.isBusy()).toBe(true)

              await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {

                jasmine.lastRequest().responseError()

                await wait()

                expect(up.network.isBusy()).toBe(false)
                expect('.target').toHaveText('cached text')

                // Browsers wait a bit before emitting an unhandledrejection event.
                await wait(100)

                expect(globalErrorSpy).toHaveBeenCalledWith(jasmine.any(up.Offline))
              })
            })

            it('keeps the expired response in the cache so users can keep navigating within the last known content', async function() {
              const job1 = up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
              await wait()

              expect('.target').toHaveText('cached text')

              await expectAsync(job1).toBeResolvedTo(jasmine.any(up.RenderResult))
              await expectAsync(job1.finished).toBePending()

              expect(up.network.isBusy()).toBe(true)

              jasmine.lastRequest().responseError()

              await expectAsync(job1.finished).toBeRejectedWith(jasmine.any(up.Offline))
              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')

              // Simulate navigating to another page
              up.render('.target', { content: 'other text' })
              expect('.target').toHaveText('other text')

              // Re-render the cached content that we could not revalidate earlier.
              const job2 = up.render('.target', { url: '/cached-path', cache: true, revalidate: true })

              await job2
              // For some reason, with migrate loaded, the revalidation request is in the queue but has not yet been sent
              await wait()

              // See that we kept the last known response in the cache.
              expect('.target').toHaveText('cached text')

              // We now have a second revalidation request.
              await expectAsync(job2.finished).toBePending()

              expect(up.network.isBusy()).toBe(true)

              jasmine.lastRequest().responseError()

              await expectAsync(job2.finished).toBeRejectedWith(jasmine.any(up.Offline))
              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')
            })
          })


          describe('prevention', function() {

            it('emits a second up:fragment:loaded event with { revalidating: true }', async function() {
              const flags = []
              up.on('up:fragment:loaded', (event) => {
                flags.push(event.revalidating)
              })

              up.render('.target', { url: '/cached-path', cache: true, revalidate: true })
              await wait()

              expect('.target').toHaveText('cached text')
              expect(up.network.isBusy()).toBe(true)
              expect(flags).toEqual([false])

              jasmine.respondWithSelector('.target', { text: 'verified text' })
              await wait()

              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('verified text')
              expect(flags).toEqual([false, true])
            })

            it('lets listeners prevent insertion of revalidated content by *preventing* the second up:fragment:loaded event, aborting the { finished } promise yy', async function() {
              up.on('up:fragment:loaded', function(event) {
                if (event.revalidating) {
                  event.preventDefault()
                }
              })

              const job = up.render('.target', { url: '/cached-path', cache: true, revalidate: true })

              await job

              expect('.target').toHaveText('cached text')

              await wait()

              expect(up.network.isBusy()).toBe(true)

              jasmine.respondWithSelector('.target', { text: 'verified text' })

              await wait()

              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')

              await expectAsync(job.finished).toBeRejectedWith(jasmine.any(up.Aborted))
            })

            it('lets listeners prevent insertion of revalidated content by *skipping* the second up:fragment:loaded event, fulfilling the { finished } promise', async function() {
              up.on('up:fragment:loaded', function(event) {
                if (event.revalidating) {
                  event.skip()
                }
              })

              const job = up.render('.target', { url: '/cached-path', cache: true, revalidate: true })

              await job

              expect('.target').toHaveText('cached text')

              await wait()

              expect(up.network.isBusy()).toBe(true)

              jasmine.respondWithSelector('.target', { text: 'verified text' })

              await wait()

              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')

              await expectAsync(job.finished).toBeResolvedTo(jasmine.any(up.RenderResult))
            })
          })
        })
      })

    })

  })

})
