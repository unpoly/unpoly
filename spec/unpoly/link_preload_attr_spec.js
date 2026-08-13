const e = up.element

extendDescribe('up.link', function() {

  extendDescribe('unobtrusive behavior', function() {

    describe('[up-preload]', function() {

      it('preloads the link destination when hovering, after a delay', async function() {
        up.link.config.preloadDelay = 100

        fixture('.target', { text: 'old text' })

        const link = fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello(link)

        Trigger.hoverSequence(link)
        await wait(50)

        // It's still too early
        expect(jasmine.Ajax.requests.count()).toEqual(0)
        await wait(75)

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/foo')
        expect(jasmine.lastRequest()).toHaveRequestMethod('GET')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.target')

        jasmine.respondWith(`
          <div class="target">
            new text
          </div>
        `)
        await wait()

        // We only preloaded, so the target isn't replaced yet.
        expect('.target').toHaveText('old text')
        expect({ url: '/foo' }).toBeCachedWithResponse()

        Trigger.clickSequence(link)
        await wait()

        // No additional request has been sent since we already preloaded
        expect(jasmine.Ajax.requests.count()).toEqual(1)

        // The target is replaced instantly
        expect('.target').toHaveText('new text')
      })

      it('does not send a request if the user stops hovering before the delay is over', async function() {
        up.link.config.preloadDelay = 100

        $fixture('.target').text('old text')

        const $link = $fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello($link)

        Trigger.hoverSequence($link)

        await wait(40)

        // It's still too early
        expect(jasmine.Ajax.requests.count()).toEqual(0)

        Trigger.unhoverSequence($link)

        await wait(90)

        expect(jasmine.Ajax.requests.count()).toEqual(0)
      })

      it('does not send a request if the link was destroyed before the delay is over', async function() {
        up.link.config.preloadDelay = 100

        fixture('.target', { text: 'old text' })

        const link = fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello(link)

        Trigger.hoverSequence(link)

        await wait(40)

        // It's still too early
        expect(jasmine.Ajax.requests.count()).toEqual(0)

        up.destroy(link)

        await wait(90)

        expect(jasmine.Ajax.requests.count()).toEqual(0)
      })

      it('does not send a request if the link was targeted by another request before the delay is over', async function() {
        up.link.config.preloadDelay = 100

        fixture('.target', { text: 'old text' })

        const link = fixture('a.link[href="/foo"][up-target=".target"][up-preload]')
        up.hello(link)

        Trigger.hoverSequence(link)

        await wait(40)

        // It's still too early
        expect(jasmine.Ajax.requests.count()).toEqual(0)

        up.render({ target: '.link', url: '/bar' })

        await wait(90)

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/bar')
      })

      it('does not crash or send a request if the preloading link is [up-hungry] and gets replaced before the delay is over', async function() {
        up.link.config.preloadDelay = 100

        let [hungryNav, link, target] = htmlFixtureList(`
          <div class="nav" up-hungry>
            <a class="link" href="/foo" up-target=".target" up-preload>link label</a>
          </div>

          <div class="target">
            old target
          </div>
        `)

        fixture('.target', { text: 'old target' })

        up.hello(hungryNav)

        Trigger.hoverSequence(link)
        await wait(40)

        // It's still too early
        expect(jasmine.Ajax.requests.count()).toEqual(0)

        up.render({ target: '.target', url: '/bar' })
        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/bar')

        jasmine.respondWith(`
          <div class="nav" up-hungry>
            new nav
          </div>

          <div class="target">
            new target
          </div>
        `)
        await wait(100)

        expect('.nav').toHaveText('new nav')
        expect('.target').toHaveText('new target')
      })

      it('does not crash if the preloading link is [up-hungry] and the preloaded request is revalidated (bugfix)', async function() {
        up.link.config.preloadDelay = 100

        let [hungryNav, link, target] = htmlFixtureList(`
          <div class="nav" up-hungry>
            <a class="link" href="/foo" up-target=".target" up-preload>old label</a>
          </div>

          <div class="target">
            old target
          </div>
        `)
        up.hello(hungryNav)

        Trigger.hoverSequence(link)
        await wait(50)

        // It's still too early
        expect(jasmine.Ajax.requests.count()).toEqual(0)
        await wait(75)

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/foo')
        expect(jasmine.lastRequest()).toHaveRequestMethod('GET')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.target')

        jasmine.respondWith(`
          <div class="nav" up-hungry>
            <a class="link" href="/foo" up-target=".target" up-preload>new label</a>
          </div>

          <div class="target">
            new target
          </div>
        `)
        await wait()

        // We only preloaded, so the target isn't replaced yet.
        expect('.link').toHaveText('old label')
        expect('.target').toHaveText('old target')
        expect({ url: '/foo' }).toBeCachedWithResponse()

        up.cache.expire()
        await wait()

        Trigger.hoverSequence(link)
        await wait()

        Trigger.clickSequence(link)
        await wait()

        // The target is replaced instantly
        expect('.target').toHaveText('new target')
        expect('.link').toHaveText('new label')

        // Because the cursor sits at the same position, we immediately cause another mouseenter event.
        Trigger.hoverSequence(link)

        expect(jasmine.Ajax.requests.count()).toEqual(2)

        jasmine.respondWith(`
          <div class="nav" up-hungry>
            <a class="link" href="/foo" up-target=".target" up-preload>revalidated label</a>
          </div>

          <div class="target">
            revalidated target
          </div>
        `)
        await wait()

        expect('.target').toHaveText('revalidated target')
        expect('.link').toHaveText('revalidated label')
      })

      it('aborts a preload request if the user stops hovering before the response was received', async function() {
        up.link.config.preloadDelay = 10
        $fixture('.target').text('old text')
        const $link = $fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello($link)
        const abortListener = jasmine.createSpy('up:request:aborted listener')
        up.on('up:request:aborted', abortListener)

        Trigger.hoverSequence($link)

        await wait(50)

        expect(abortListener).not.toHaveBeenCalled()
        expect(jasmine.Ajax.requests.count()).toEqual(1)

        Trigger.unhoverSequence($link)

        await wait(50)

        expect(abortListener).toHaveBeenCalled()
      })

      it('does not abort a request if the user followed the link while it was preloading, and then stopped hovering', async function() {
        up.link.config.preloadDelay = 10
        fixture('.target', { text: 'old text' })
        const link = fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello(link)
        const abortListener = jasmine.createSpy('up:request:aborted listener')
        up.on('up:request:aborted', abortListener)

        Trigger.hoverSequence(link)
        await wait(50)

        expect(abortListener).not.toHaveBeenCalled()
        expect(jasmine.Ajax.requests.count()).toEqual(1)

        Trigger.click(link)
        await wait()

        expect(abortListener).not.toHaveBeenCalled()

        Trigger.unhoverSequence(link)
        await wait()

        expect(abortListener).not.toHaveBeenCalled()
      })

      it('does not abort a revalidation request when an [up-preload] link renders expired content instantly, then stops hovering (bugfix)', async function() {
        fixture('#target', { text: 'initial target' })

        await jasmine.populateCache('/foo', '<div id="target">expired target</div>')
        expect({ url: '/foo' }).toBeCached()
        up.cache.expire('/foo')
        expect({ url: '/foo' }).toBeExpired()
        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(up.network.isBusy()).toBe(false)

        const abortListener = jasmine.createSpy('up:request:aborted listener')
        up.on('up:request:aborted', abortListener)

        const link = fixture('a[href="/foo"][up-target="#target"][up-preload][up-preload-delay=0]')
        up.hello(link)

        Trigger.hoverSequence(link)
        await wait(10)

        // Because the destination is already cached (albeit expired), we don't send another request.
        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(up.network.isBusy()).toBe(false)

        Trigger.clickSequence(link)
        await wait(10)

        expect('#target').toHaveText('expired target')

        // Revalidation request for expired content
        expect(jasmine.Ajax.requests.count()).toEqual(2)
        expect(up.network.isBusy()).toBe(true)

        Trigger.unhoverSequence(link)
        await wait(10)

        // Revalidation request for expired content
        expect(jasmine.Ajax.requests.count()).toEqual(2)
        expect(up.network.isBusy()).toBe(true)
        expect(abortListener).not.toHaveBeenCalled()

        jasmine.respondWithSelector('#target', { text: 'revalidated target' })
        await wait()

        expect('#target').toHaveText('revalidated target')
        expect(up.network.isBusy()).toBe(false)
        expect(abortListener).not.toHaveBeenCalled()
      })

      it('preloads the link destination on touchstart (without delay)', async function() {
        up.link.config.preloadDelay = 100

        $fixture('.target').text('old text')

        const $link = $fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello($link)

        Trigger.touchstart($link)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/foo')
        expect(jasmine.lastRequest()).toHaveRequestMethod('GET')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.target')

        jasmine.respondWith(`
          <div class="target">
            new text
          </div>
        `)

        await wait()

        // We only preloaded, so the target isn't replaced yet.
        expect('.target').toHaveText('old text')

        Trigger.click($link)

        await wait()

        // No additional request has been sent since we already preloaded
        expect(jasmine.Ajax.requests.count()).toEqual(1)

        // The target is replaced instantly
        expect('.target').toHaveText('new text')
      })

      it('registers the touchstart callback as a passive event listener', function() {
        fixture('.target')
        const link = fixture('a[href="/foo"][up-target=".target"][up-preload]')

        spyOn(link, 'addEventListener')

        up.hello(link)

        expect(link.addEventListener).toHaveBeenCalledWith('touchstart', jasmine.any(Function), { passive: true })
      })

      it('preloads the link destination on mousedown (without delay)', async function() {
        up.link.config.preloadDelay = 100

        $fixture('.target').text('old text')

        const $link = $fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello($link)

        Trigger.mousedown($link)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/foo')
        expect(jasmine.lastRequest()).toHaveRequestMethod('GET')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.target')

        jasmine.respondWith(`
          <div class="target">
            new text
          </div>
        `)

        await wait()

        // We only preloaded, so the target isn't replaced yet.
        expect('.target').toHaveText('old text')

        Trigger.click($link)

        await wait()

        // No additional request has been sent since we already preloaded
        expect(jasmine.Ajax.requests.count()).toEqual(1)

        // The target is replaced instantly
        expect('.target').toHaveText('new text')
      })

      describe('caching', function() {

        it('caches the preloaded content', async function() {
          up.link.config.preloadDelay = 0

          fixture('.target', { text: 'old text' })

          const link = fixture('a[href="/foo"][up-target=".target"][up-preload]')
          up.hello(link)
          const cacheEntry = { url: '/foo' }

          await wait()

          expect(cacheEntry).not.toBeCached()

          Trigger.hoverSequence(link)

          await wait(30)

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(cacheEntry).toBeCachedWithoutResponse()

          jasmine.respondWith('<div class="target">new text</div>')

          await wait()

          expect(cacheEntry).toBeCachedWithResponse({ text: '<div class="target">new text</div>' })
        })

        it('does not cache a failed response', async function() {
          up.link.config.preloadDelay = 0

          fixture('.success', { text: 'old text' })
          fixture('.failure', { text: 'old error' })

          const link = fixture('a[href="/foo"][up-target=".success"][up-fail-target=".failure"][up-preload]')
          up.hello(link)

          Trigger.hoverSequence(link)
          await wait(30)

          expect(jasmine.Ajax.requests.count()).toEqual(1)

          jasmine.respondWith({
            status: 500,
            responseText: `
              <div class="failure">
                new error
              </div>
            `
          })
          await wait()

          // We only preloaded, so the target isn't replaced yet.
          expect('.success').toHaveText('old text')
          expect('.failure').toHaveText('old error')

          expect({ url: '/foo' }).not.toBeCached()

          Trigger.clickSequence(link)
          await wait()

          // Since the preloading failed, we send another request
          expect(jasmine.Ajax.requests.count()).toEqual(2)

          jasmine.respondWith({
            status: 500,
            responseText: `
              <div class="failure">
                new error
              </div>
            `
          })
          await wait()

          expect('.success').toHaveText('old text')
          expect('.failure').toHaveText('new error')

        })

        describe('when the link destination is already cached', function() {

          it('does not send a request if the link destination is already cached', async function() {
            up.link.config.preloadDelay = 0

            await jasmine.populateCache('/destination', '<div class="target">new text</div>')

            expect(jasmine.Ajax.requests.count()).toEqual(1)

            fixture('.target', { text: 'old text' })

            const link = fixture('a[href="/destination"][up-target=".target"][up-preload]')
            up.hello(link)

            await wait()

            Trigger.hoverSequence(link)

            await wait(30)

            // No additional request was sent
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(up.network.isBusy()).toBe(false)
          })

          it('waits for revalidation of stale content until the link is clicked', async function() {
            up.link.config.preloadDelay = 0

            // Create an expired cache entry
            const cacheEntry = { url: '/destination' }
            await jasmine.populateCache(cacheEntry, '<div class="target">new text</div>')
            up.cache.expire(cacheEntry)
            expect(cacheEntry).toBeCached()
            expect(cacheEntry).toBeExpired()
            expect(jasmine.Ajax.requests.count()).toEqual(1)

            fixture('.target', { text: 'old text' })

            const link = fixture('a[href="/destination"][up-target=".target"][up-preload]')
            up.hello(link)

            await wait()

            Trigger.hoverSequence(link)

            await wait(30)

            // No revalidation request was sent
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(up.network.isBusy()).toBe(false)

            Trigger.clickSequence(link)
            await wait()

            // The stale content is rendered immediately
            expect('.target').toHaveText('new text')

            // Now that the link is clicked we're revalidating
            expect(jasmine.Ajax.requests.count()).toEqual(2)
            expect(up.network.isBusy()).toBe(true)

            jasmine.respondWith('<div class="target">revalidated text</div>')

            await wait()

            expect('.target').toHaveText('revalidated text')

            expect(cacheEntry).toBeCached()
            expect(cacheEntry).not.toBeExpired()
          })
        })
      })

      describe('exemptions from preloading', function() {

        beforeEach(function() {
          up.link.config.preloadDelay = 0
          $fixture('.target')
        })

        it('never preloads a link with an unsafe method', async function() {
          const link = helloFixture('a[href="/path"][up-target=".target"][up-preload][data-method="post"]')

          Trigger.hoverSequence(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)
        })

        it('never preloads a link that has been marked with [up-cache=false]', async function() {
          const link = helloFixture('a[href="/no-auto-caching-path"][up-cache=false]')

          Trigger.hoverSequence(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)
        })

        it('never preloads a link that does not auto-cache', async function() {
          up.network.config.autoCache = function(request) {
            expect(request).toEqual(jasmine.any(up.Request))
            return request.url !== '/no-auto-caching-path'
          }

          const link = helloFixture('a[href="/no-auto-caching-path"][up-preload][up-target=".target"]')

          Trigger.hoverSequence(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)
        })

        it('never preloads a link with cross-origin [href]', async function() {
          const link = helloFixture('a[href="https://other-domain.com/path"][up-preload][up-target=".target"]')

          Trigger.hoverSequence(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)
        })

        it('never preloads a link with [download] (which opens a save-as-dialog)', async function() {
          const link = helloFixture('a[href="/path"][up-target=".target"][up-preload][download]')

          Trigger.hoverSequence(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)
        })

        it('never preloads a link with a [target] attribute (which updates a frame or opens a tab)', async function() {
          const link = helloFixture('a[href="/path"][up-target=".target"][up-preload][target="_blank"]')

          Trigger.hoverSequence(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)
        })

        it('never preloads a link with [href="#"]', async function() {
          const link = helloFixture('a[href="#"][up-preload]')

          Trigger.hoverSequence(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)
        })

        it('never preloads a link with local content via [up-content]', async function() {
          fixture('.target', { text: 'old text' })
          const link = helloFixture('a[up-preload][up-content="new text"][up-target=".target"]')

          Trigger.hoverSequence(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)

          Trigger.clickSequence(link)

          await wait()

          expect('.target').toHaveText('new text')
        })

        describeFallback('canPushState', function() {
          it('does not preload a link', async function() {
            fixture('.target')
            const link = helloFixture('a[href="/path"][up-target=".target"][up-preload]')

            Trigger.hoverSequence(link)

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(0)
          })
        })
      })

      describe('handling of up.link.config.preloadSelectors', function() {

        beforeEach(function() {
          up.link.config.preloadDelay = 0
        })

        it('preload matching links without an [up-preload] attribute', async function() {
          up.link.config.preloadSelectors.push('.link')
          const link = fixture('a[up-follow][href="/foo"].link')
          up.hello(link)

          Trigger.hoverSequence(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)
        })

        it('allows individual links to opt out with [up-preload=false]', async function() {
          up.link.config.preloadSelectors.push('.link')
          const link = fixture('a[up-follow][href="/foo"][up-preload=false].link')
          up.hello(link)

          Trigger.hoverSequence(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(0)
        })

        it('allows to configure exceptions in up.link.config.noPreloadSelectors', async function() {
          up.link.config.preloadSelectors.push('.include')
          up.link.config.noPreloadSelectors.push('.exclude')
          const link = fixture('a.include.exclude[up-follow][href="/foo"]')
          up.hello(link)

          Trigger.hoverSequence(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(0)
        })

        it('allows individual links to opt out of all Unpoly link handling with [up-follow=false]', async function() {
          up.link.config.preloadSelectors.push('.link')
          const link = fixture('a[up-follow][href="/foo"][up-follow=false].link')
          up.hello(link)

          Trigger.hoverSequence(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(0)
        })
      })

      describe('defining when to preload', function() {

        describe('with [up-preload=insert]', function() {
          it('preloads the link as soon as it is inserted into the DOM', async function() {
            const link = fixture('a[href="/foo"][up-follow][up-preload="insert"]', { text: 'label' })
            up.hello(link)

            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(jasmine.lastRequest().url).toMatchURL('/foo')
          })
        })

        describe('with [up-preload=reveal]', function() {

          // MutationObserver does not fire within a task
          const MUTATION_OBSERVER_LAG = 30

          it('preloads the link when it is scrolled into the document viewport', async function() {
            const before = fixture('#before', { text: 'before', style: 'height: 50000px' })

            const link = fixture('a[href="/foo"][up-follow][up-preload="reveal"]', { text: 'label' })
            up.hello(link)

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(0)

            link.scrollIntoView()

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(jasmine.lastRequest().url).toMatchURL('/foo')
          })

          it('immediately preloads that link that is already visible within the document viewport', async function() {
            const link = fixture('a[href="/foo"][up-follow][up-preload="reveal"]', { text: 'label' })
            up.hello(link)

            // MutationObserver has a delay even for the initial intersection check.
            // We have additional code in place to call it synchronously during compilation,
            // so we don't get a "flash of empty partial" when the content is already cached.
            await wait(0)

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(jasmine.lastRequest().url).toMatchURL('/foo')
          })

          it('only sends a single request as the link enters and leaves the viewport repeatedly', async function() {
            const before = fixture('#before', { text: 'before', style: 'height: 50000px' })

            const link = fixture('a[href="/foo"][up-follow][up-preload="reveal"]', { text: 'label' })
            up.hello(link)

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(0)

            link.scrollIntoView()

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(1)

            // Abort the request so we can observe whether another request will be sent.
            up.network.abort()
            await wait(MUTATION_OBSERVER_LAG)

            document.scrollingElement.scrollTop = 0
            await wait(MUTATION_OBSERVER_LAG)
            link.scrollIntoView()
            await wait(MUTATION_OBSERVER_LAG)

            // No additional request was sent
            expect(jasmine.Ajax.requests.count()).toEqual(1)
          })

          it('detects visibility for a link in an element with scroll overflow', async function() {
            const viewport = fixture('#viewport', { style: 'height: 500px; width: 300px; overflow-y: scroll' })
            const before = e.affix(viewport, '#before', { text: 'before', style: 'height: 50000px' })

            const link = e.affix(viewport, 'a[href="/foo"][up-follow][up-preload="reveal"]', { text: 'label' })
            up.hello(link)

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(0)

            link.scrollIntoView()

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(1)
          })
        })

        describe('with [up-preload=hover]', function() {
          it('preloads the link when the user hovers over it for a while (default)', async function() {
            up.link.config.preloadDelay = 20

            fixture('.target', { text: 'old text' })

            const link = fixture('a[href="/foo"][up-target=".target"][up-preload="hover"]')
            up.hello(link)

            Trigger.hoverSequence(link)

            await wait(60)

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(jasmine.lastRequest().url).toMatchURL('/foo')
            expect(jasmine.lastRequest()).toHaveRequestMethod('GET')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.target')
          })
        })

        describe('with [up-preload=true]', function() {
          it('preloads the link when the user hovers over it for a while (default)', async function() {
            up.link.config.preloadDelay = 20

            fixture('.target', { text: 'old text' })

            const link = fixture('a[href="/foo"][up-target=".target"][up-preload="true"]')
            up.hello(link)

            Trigger.hoverSequence(link)

            await wait(60)

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(jasmine.lastRequest().url).toMatchURL('/foo')
            expect(jasmine.lastRequest()).toHaveRequestMethod('GET')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.target')
          })
        })
      })

      describe('overriding default render options', function() {

        it('does not show a confirmation dialog when preloading', async function() {
          up.link.config.preloadDelay = 0

          spyOn(window, 'confirm').and.returnValue(true)
          fixture('#target')
          const link = helloFixture('a[href="/danger"][up-target="#target"][up-preload][up-confirm="Really?"]')

          Trigger.hoverSequence(link)

          await wait(10)

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(window.confirm).not.toHaveBeenCalled()
        })

        it('does not show a preview when preloading', async function() {
          up.link.config.preloadDelay = 0

          const previewFn = jasmine.createSpy('preview fn')
          up.preview('my:preview', previewFn)

          spyOn(window, 'confirm')
          fixture('#target')
          const link = helloFixture('a[href="/slow"][up-target="#target"][up-preload][up-preview="my:preview"]')

          Trigger.hoverSequence(link)

          await wait(10)

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(previewFn).not.toHaveBeenCalled()
        })

        it('does not show a preview when preloading', async function() {
          up.link.config.preloadDelay = 0

          spyOn(window, 'confirm')
          fixture('#target', { text: 'old text' })
          const link = helloFixture('a[href="/slow"][up-target="#target"][up-preload][up-placeholder="<span>placeholder text</span>"]')

          Trigger.hoverSequence(link)

          await wait(5)

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect('#target').toHaveVisibleText('old text')
        })
      })
    })

  })

})
