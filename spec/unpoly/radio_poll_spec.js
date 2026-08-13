const u = up.util
const e = up.element

extendDescribe('up.radio', function() {

  extendDescribe('unobtrusive behavior', function() {

    describe('[up-poll]', function() {

      it('reloads the element periodically', async function() {
        const interval = 150
        const timingTolerance = interval / 3
        up.radio.config.pollInterval = interval

        const element = helloFixture('.element[up-poll]', { text: 'old text' })

        await wait(timingTolerance)

        expect(element).toHaveText('old text')
        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(interval)

        expect(jasmine.Ajax.requests.count()).toBe(1)
        jasmine.respondWithSelector('.element[up-poll]', { text: 'new text' })

        await wait()

        expect('.element').toHaveText('new text')

        await wait(interval + timingTolerance)

        expect(jasmine.Ajax.requests.count()).toBe(2)
        jasmine.respondWithSelector('.element[up-poll]', { text: 'newer text' })

        await wait()

        expect('.element').toHaveText('newer text')

        await wait(interval + timingTolerance)
        expect(jasmine.Ajax.requests.count()).toBe(3)
      })

      it('polls an element with [up-poll=true]', async function() {
        const interval = 150
        const timingTolerance = interval / 3
        up.radio.config.pollInterval = interval

        helloFixture('.element[up-poll=true]', { text: 'old text' })

        await wait(timingTolerance)

        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(interval)

        expect(jasmine.Ajax.requests.count()).toBe(1)
      })

      it('does not reload an element with [up-poll=false]', async function() {
        helloFixture('.element[up-poll=false][up-interval=50][up-source="/source-path"]', { text: 'old text' })

        await wait(120)

        expect(jasmine.Ajax.requests.count()).toBe(0)
      })

      it('does not make additional requests while a previous request is still in flight', async function() {
        const deferreds = []
        up.radio.config.pollInterval = 100

        const reloadSpy = spyOn(up, 'reload').and.callFake(() => {
          const deferred = u.newDeferred()
          deferreds.push(deferred)
          return deferred
        })

        helloFixture('.element[up-poll]')

        await wait(200)
        expect(reloadSpy.calls.count()).toBe(1)

        await wait(200)
        expect(reloadSpy.calls.count()).toBe(1)
        u.last(deferreds).resolve(new up.RenderResult())

        await wait(150)
        expect(reloadSpy.calls.count()).toBe(2)
      })

      it('keeps the polling rhythm when the server responds with `X-Up-Target: :none` (bugfix)', async function() {
        up.radio.config.pollInterval = 250
        helloFixture('.element[up-poll][up-source="/source"]')

        await wait(50)
        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(250)
        expect(jasmine.Ajax.requests.count()).toBe(1)
        jasmine.respondWith({ status: 200, responseHeaders: { 'X-Up-Target': ':none' } })

        await wait(50)
        expect(jasmine.Ajax.requests.count()).toBe(1)

        await wait(250)
        expect(jasmine.Ajax.requests.count()).toBe(2)
      })

      it('keeps polling if the server responds with a 304 Not Modified status', async function() {
        up.radio.config.pollInterval = 250
        helloFixture('.element[up-poll][up-source="/source"]')

        await wait(50)
        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(250)
        expect(jasmine.Ajax.requests.count()).toBe(1)
        jasmine.respondWith({ status: 304, responseText: '' })

        await wait(50)
        expect(jasmine.Ajax.requests.count()).toBe(1)

        await wait(250)
        expect(jasmine.Ajax.requests.count()).toBe(2)
      })

      it('keeps polling if a request failed with a network issue', async function() {
        await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
          up.radio.config.pollInterval = 100
          const reloadSpy = spyOn(up, 'reload').and.callFake(() => Promise.reject(new up.Error('mocked network error')))

          helloFixture('.element[up-poll]')

          await wait(140)

          expect(reloadSpy.calls.count()).toBe(1)
          expect(globalErrorSpy.calls.count()).toBe(1)

          await wait(100)

          expect(reloadSpy.calls.count()).toBe(2)
          expect(globalErrorSpy.calls.count()).toBe(2)

          await wait(10)
        })
      })

      describe('when the server responds with an error status', function() {

        it('tries again after the next interval', async function() {
          up.radio.config.pollInterval = 250

          helloFixture('.element[up-poll][up-source="/source"]')

          await wait(50)
          expect(jasmine.Ajax.requests.count()).toBe(0)

          await wait(250)
          expect(jasmine.Ajax.requests.count()).toBe(1)

          await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
            jasmine.respondWith({ status: 404, responseText: 'Not found' })

            await wait(50)
            expect(jasmine.Ajax.requests.count()).toBe(1)

            // up.FragmentPolling#onReloadFailure() will throw critical errors
            expect(globalErrorSpy).toHaveBeenCalledWith(jasmine.any(up.CannotMatch))
          })

          await wait(250)
          expect(jasmine.Ajax.requests.count()).toBe(2)
        })

        it('does not update a matching fragment from the response', async function() {
          up.radio.config.pollInterval = 250

          helloFixture('.element[up-poll][up-source="/source"]', { text: 'original text' })

          await wait(50)
          expect(jasmine.Ajax.requests.count()).toBe(0)

          await wait(250)
          expect(jasmine.Ajax.requests.count()).toBe(1)

          await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
            jasmine.respondWithSelector('.element', { status: 404, text: 'response text' })

            await wait(50)
            expect(jasmine.Ajax.requests.count()).toBe(1)

            // up.FragmentPolling#onReloadFailure() will throw critical errors
            expect(globalErrorSpy).toHaveBeenCalledWith(jasmine.any(up.CannotMatch))

            expect('.element').not.toHaveText('response text')
          })
        })

        it('updates a matching fragment from the response with [up-fail="false"]', async function() {
          up.radio.config.pollInterval = 250

          helloFixture('.element[up-poll][up-source="/source"][up-fail="false"]', { text: 'original text' })

          await wait(50)

          expect(jasmine.Ajax.requests.count()).toBe(0)

          await wait(250)

          expect(jasmine.Ajax.requests.count()).toBe(1)

          jasmine.respondWithSelector('.element[up-poll]', { status: 404, text: 'response text' })
          await wait(50)

          expect('.element').toHaveText('response text')

          await wait(250 + 50)

          expect(jasmine.Ajax.requests.count()).toBe(2)
        })

      })

      it('does not reload if the tab is hidden', async function() {
        up.radio.config.pollInterval = 50
        spyOnProperty(document, 'hidden', 'get').and.returnValue(true)
        spyOnProperty(document, 'visibilityState', 'get').and.returnValue('hidden')
        const reloadSpy = spyOn(up, 'reload').and.callFake(() => Promise.resolve(new up.RenderResult()))

        helloFixture('.element[up-poll]')

        await wait(100)
        expect(reloadSpy).not.toHaveBeenCalled()
      })

      it("pauses polling while the browser tab is hidden", async function() {
        const reloadSpy = spyOn(up, 'reload').and.callFake(() => Promise.resolve(new up.RenderResult()))

        let currentHidden = false
        let currentVisibilityState = 'visible'
        spyOnProperty(document, 'hidden', 'get').and.callFake(() => currentHidden)
        spyOnProperty(document, 'visibilityState', 'get').and.callFake(() => currentVisibilityState)

        const element = fixture('.unread[up-poll][up-interval=100]')
        up.hello(element) // start polling

        await wait(125)

        expect(reloadSpy.calls.count()).toBe(1)

        currentHidden = true
        currentVisibilityState = 'hidden'
        up.emit(document, 'visibilitychange')

        await wait(250)

        expect(reloadSpy.calls.count()).toBe(1)

        currentHidden = false
        currentVisibilityState = 'visible'
        up.emit(document, 'visibilitychange')

        // Since we spent the entire interval in the background layer, we now load immediately
        await wait(10)

        expect(reloadSpy.calls.count()).toBe(2)
      })

      it('stops polling when the element is destroyed', async function() {
        up.radio.config.pollInterval = 75
        const reloadSpy = spyOn(up, 'reload').and.callFake(() => Promise.resolve(new up.RenderResult()))

        const element = helloFixture('.element[up-poll]')

        await wait(125)
        expect(reloadSpy.calls.count()).toBe(1)
        up.destroy(element)

        await wait(75)
        expect(reloadSpy.calls.count()).toBe(1)
      })

      it('stops polling when the element is detached by an external script', async function() {
        up.radio.config.pollInterval = 75
        const reloadSpy = spyOn(up, 'reload').and.callFake(() => Promise.resolve(new up.RenderResult()))

        const element = helloFixture('.element[up-poll]')

        await wait(125)
        expect(reloadSpy.calls.count()).toBe(1)

        // Detach without going through up.destroy()
        element.remove()

        await wait(75)
        expect(reloadSpy.calls.count()).toBe(1)
      })

      it('stops polling when the server responds without an [up-poll] attribute', async function() {
        let interval
        up.radio.config.pollInterval = (interval = 150)
        const timingTolerance = interval / 3

        const element = helloFixture('.element[up-poll]', { text: 'old text' })

        await wait(timingTolerance)

        expect('.element').toHaveText('old text')
        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(interval)

        expect(jasmine.Ajax.requests.count()).toBe(1)
        jasmine.respondWithSelector('.element', { text: 'new text' })

        await wait()

        expect('.element').toHaveText('new text')

        await wait(timingTolerance + interval)

        expect(jasmine.Ajax.requests.count()).toBe(1)
      })

      it('stops polling when the server responds without an [up-poll=false] attribute', async function() {
        let interval
        up.radio.config.pollInterval = (interval = 150)
        const timingTolerance = interval / 3

        const element = helloFixture('.element[up-poll]', { text: 'old text' })

        await wait(timingTolerance)

        expect('.element').toHaveText('old text')
        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(interval)

        expect(jasmine.Ajax.requests.count()).toBe(1)
        jasmine.respondWithSelector('.element[up-poll=false]', { text: 'new text' })

        await wait()

        expect('.element').toHaveText('new text')

        await wait(timingTolerance + interval)

        expect(jasmine.Ajax.requests.count()).toBe(1)
      })

      it("lets the server change the [up-interval] (bugfix)", async function() {
        let initialInterval
        up.radio.config.pollInterval = initialInterval = 150
        const timingTolerance = initialInterval / 3

        up.hello(
          fixture(`.element[up-poll][up-interval='${initialInterval}']`, {
            text: "old text",
          })
        )

        await wait(timingTolerance)

        expect(".element").toHaveText("old text")
        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(initialInterval)

        expect(jasmine.Ajax.requests.count()).toBe(1)
        jasmine.respondWithSelector(
          `.element[up-poll][up-interval='${initialInterval * 2}']`,
          { text: "new text" }
        )

        await wait()

        expect(".element").toHaveText("new text")

        await wait(timingTolerance + initialInterval)
        expect(jasmine.Ajax.requests.count()).toBe(1)

        await wait(initialInterval)
        expect(jasmine.Ajax.requests.count()).toBe(2)
      })

      it('stops polling when the element is destroyed while waiting for a previous request (bugfix)', async function() {
        up.radio.config.pollInterval = 75
        const element = helloFixture('.element[up-poll]')

        await wait(125)

        expect(jasmine.Ajax.requests.count()).toBe(1)

        up.destroy(element)

        await wait()

        jasmine.respondWithSelector('.element[up-poll]')

        await wait(125)

        expect(jasmine.Ajax.requests.count()).toBe(1)
      })

      it('allows to pass a polling interval per [up-interval] attribute', async function() {
        const reloadSpy = spyOn(up, 'reload').and.callFake(() => Promise.resolve(new up.RenderResult()))

        up.radio.config.pollInterval = 30

        helloFixture('.element[up-poll][up-interval=80]')

        await wait(30)
        expect(reloadSpy).not.toHaveBeenCalled()

        await wait(90)
        expect(reloadSpy).toHaveBeenCalled()
      })

      it('pauses polling when an up:fragment:poll event is prevented', async function() {
        let interval
        up.radio.config.pollInterval = (interval = 70)
        const timingTolerance = 20

        helloFixture('.element[up-poll]')
        let eventCount = 0

        up.on('up:fragment:poll', '.element', function(event) {
          eventCount++
          // Prevent the second event
          if (eventCount === 1) {
            event.preventDefault()
          }
        })

        await wait(timingTolerance)
        expect(eventCount).toBe(0)
        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(interval)
        expect(eventCount).toBe(1)
        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(interval + timingTolerance)
        expect(eventCount).toBe(2)
        expect(jasmine.Ajax.requests.count()).toBe(1)
      })

      it('lets up:fragment:poll listeners mutate render options for the reload pass', async function() {
        let interval
        up.radio.config.pollInterval = (interval = 50)
        const timingTolerance = 20

        helloFixture('.element[up-poll][up-href="/path"]')

        up.on('up:fragment:poll', (event) => event.renderOptions.url = '/mutated-path')

        await wait(interval + timingTolerance)

        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.lastRequest().url).toMatchURL('/mutated-path')
      })

      it("pauses polling while the element's layer is in the background", async function() {
        const reloadSpy = spyOn(up, 'reload').and.callFake(() => Promise.resolve(new up.RenderResult()))

        const element = fixture('.unread[up-poll][up-interval=100]')
        up.hello(element) // start polling

        await wait(125)

        expect(reloadSpy.calls.count()).toBe(1)

        up.layer.open()

        // Spend two intervals on a background layer
        await wait(250)

        expect(reloadSpy.calls.count()).toBe(1)

        up.layer.dismiss()

        // Since we spent the entire interval on the overlay, we now load immediately
        await wait(10)

        expect(reloadSpy.calls.count()).toBe(2)
      })

      it("keeps polling on background layers with [up-if-layer='any']", async function() {
        const reloadSpy = spyOn(up, 'reload').and.callFake(() => Promise.resolve(new up.RenderResult()))

        const element = fixture('.unread[up-poll][up-interval=100][up-if-layer=any]')
        up.hello(element) // start polling

        await wait(150)

        expect(reloadSpy.calls.count()).toBe(1)

        up.layer.open()

        await wait(100)

        expect(reloadSpy.calls.count()).toBe(2)
      })

      it('does not poll when it was paused for a full interval on a background layer, but an { onAccepted } or { onDismissed } callback renders the polling layer', async function() {
        const reloadSpy = spyOn(up, 'reload').and.callFake(() => Promise.resolve(new up.RenderResult()))

        const container = fixture('.container')
        const element = e.affix(container, '.unread[up-poll][up-interval=100]')
        up.hello(container) // start polling

        await wait(125)

        expect(reloadSpy.calls.count()).toBe(1)

        up.layer.open({ onDismissed: () => up.render('.container', { url: '/page2' }) })

        // Spend two intervals on a background layer
        await wait(250)

        expect(reloadSpy.calls.count()).toBe(1)

        up.layer.dismiss()

        await wait(10)

        // Polling was aborted by the onAccepted callback
        expect(reloadSpy.calls.count()).toBe(1)
        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.lastRequest().url).toMatchURL('/page2')
      })

      it('does not poll a fragment with a weak selector', async function() {
        const warnSpy = spyOn(up, 'warn')

        helloFixture('div[up-poll][up-interval=30]', { text: 'old text' })

        await wait(80)

        expect(jasmine.Ajax.requests.count()).toBe(0)
        expect(warnSpy).toHaveBeenCalled()
        expect(warnSpy.calls.argsFor(0)[1]).toMatch(/untargetable fragment/i)
      })

      it('adds params from an [up-params] attribute', async function() {
        const interval = 50
        const timingTolerance = 20
        up.radio.config.pollInterval = interval

        const element = htmlFixture(`
          <div id='element' up-poll up-source='/path' up-params='{ "foo": "bar" }'>
          </div>
        `)
        up.hello(element)

        await wait(interval + timingTolerance)

        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.lastRequest().url).toMatchURL('/path?foo=bar')
      })

      it('adds headers from an [up-headers] attribute', async function() {
        const interval = 50
        const timingTolerance = 20
        up.radio.config.pollInterval = interval

        const element = htmlFixture(`
          <div id='element' up-poll up-source='/path' up-headers='{ "App-Header": "header-value" }'>
          </div>
        `)
        up.hello(element)

        await wait(interval + timingTolerance)

        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.lastRequest().requestHeaders['App-Header']).toBe('header-value')
      })

      describe('controlling the reload URL', function() {

        it('uses a URL from an [up-source] attribute on the [up-poll] element', async function() {
          helloFixture('.element[up-poll][up-source="/optimized-path"][up-interval=2]')

          await wait(29)

          expect(jasmine.lastRequest().url).toMatchURL('/optimized-path')
        })

        it('uses a URL from an [up-source] attribute an an ancestor element', async function() {
          const [grandMother, mother, element] = htmlFixtureList(`
            <div id="grand-mother" up-source='/grand-mother-path'>
              <div id="mother">
                <div id="element" up-poll up-interval='2'>
                  Content
                </div>
              </div>
            </div>
          `)

          up.hello(grandMother)

          await wait(29)

          expect(jasmine.lastRequest().url).toMatchURL('/grand-mother-path')
        })

        it('prefers an explicit [up-href] attribute over the (automatically set) [up-source] attribute', async function() {
          helloFixture('.element[up-poll][up-source="/up-source-path"][up-href="/up-href-path"][up-interval=2]')

          await wait(29)

          expect(jasmine.lastRequest().url).toMatchURL('/up-href-path')
        })

        it('lets the server change the [up-source] between reloads (bugfix)', async function() {
          let interval
          up.radio.config.pollInterval = (interval = 150)
          const timingTolerance = interval / 3

          helloFixture('.element[up-poll][up-source="/one"]', { text: 'old text' })

          await wait(timingTolerance)

          expect('.element').toHaveText('old text')
          expect(jasmine.Ajax.requests.count()).toBe(0)

          await wait(interval)

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.lastRequest().url).toMatchURL('/one')
          jasmine.respondWithSelector('.element[up-poll][up-source="/two"]', { text: 'new text' })

          await wait()

          expect('.element').toHaveText('new text')

          await wait(timingTolerance + interval)

          expect(jasmine.Ajax.requests.count()).toBe(2)
          expect(jasmine.lastRequest().url).toMatchURL('/two')
        })
      })

      describe('with [up-keep-data]', function() {
        it("persists the polling element's data through reloading", async function() {
          const counterSpy = jasmine.createSpy('counterSpy')

          up.compiler('.element', function(element, data) {
            counterSpy(data.counter)
            data.counter++
          })

          const element = fixture('.element', {
            'up-poll': '',
            'up-data': '{ counter: 5 }',
            'up-keep-data': '',
            'up-interval': '30'
          })

          up.hello(element)

          expect(counterSpy.calls.count()).toBe(1)
          expect(counterSpy.calls.argsFor(0)[0]).toBe(5)

          await wait(80)
          expect(jasmine.Ajax.requests.count()).toBe(1)

          jasmine.respondWithSelector('.element', { 'up-data': '{ counter: 99 }' })
          await wait()

          expect(counterSpy.calls.count()).toBe(2)
          expect(counterSpy.calls.argsFor(1)[0]).toBe(6)
        })
      })

      describe('handling of [up-keep] elements', function() {

        it('preserves [up-keep] elements contained within the polling fragment', async function() {
          const interval = 150
          const timingTolerance = interval / 3
          up.radio.config.pollInterval = interval

          const html = (version) => `
            <div id="poller" up-poll data-version="${version}">
              <div id="swapper" data-version="${version}"></div>
              <div id="keeper" up-keep data-version="${version}"></div>                          
            </div>
          `
          const [poller, swapper, keeper] = htmlFixtureList(html(1))
          up.hello(poller)

          await wait(timingTolerance)

          expect('#poller').toHaveAttribute('data-version', '1')
          expect('#swapper').toHaveAttribute('data-version', '1')
          expect('#keeper').toHaveAttribute('data-version', '1')
          expect(jasmine.Ajax.requests.count()).toBe(0)

          await wait(interval)

          expect(jasmine.Ajax.requests.count()).toBe(1)

          jasmine.respondWith(html(2))
          await wait()

          expect('#poller').toHaveAttribute('data-version', '2')
          expect('#swapper').toHaveAttribute('data-version', '2')
          expect('#keeper').toHaveAttribute('data-version', '1')
          expect(jasmine.Ajax.requests.count()).toBe(1)

          await wait(timingTolerance + interval)

          expect(jasmine.Ajax.requests.count()).toBe(2)

          jasmine.respondWith(html(3))
          await wait()

          expect('#poller').toHaveAttribute('data-version', '3')
          expect('#swapper').toHaveAttribute('data-version', '3')
          expect('#keeper').toHaveAttribute('data-version', '1')
          expect(jasmine.Ajax.requests.count()).toBe(2)
        })

        it('keeps polling if the polling fragment is also [up-keep]', async function() {
          const interval = 150
          const timingTolerance = interval / 3
          up.radio.config.pollInterval = interval
          const keepSpy = jasmine.createSpy('up:fragment:keep listener')
          up.on('up:fragment:keep', keepSpy)

          const html = (version) => `
            <div id="poller" up-poll up-keep data-version="${version}">
            </div>
          `
          const [poller] = htmlFixtureList(html(1))
          up.hello(poller)

          await wait(timingTolerance)

          expect('#poller').toHaveAttribute('data-version', '1')
          expect(jasmine.Ajax.requests.count()).toBe(0)
          expect(keepSpy.calls.count()).toBe(0)

          await wait(interval)

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(keepSpy.calls.count()).toBe(0)

          jasmine.respondWith(html(2))
          await wait()

          expect('#poller').toHaveAttribute('data-version', '1')
          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(keepSpy.calls.count()).toBe(1)

          await wait(timingTolerance + interval)

          expect(jasmine.Ajax.requests.count()).toBe(2)
          expect(keepSpy.calls.count()).toBe(1)

          jasmine.respondWith(html(3))
          await wait()

          expect('#poller').toHaveAttribute('data-version', '1')
          expect(jasmine.Ajax.requests.count()).toBe(2)
          expect(keepSpy.calls.count()).toBe(2)
        })

        it('keeps polling if an [up-keep] ancestor is kept', async function() {
          const interval = 150
          const timingTolerance = interval / 3
          up.radio.config.pollInterval = interval
          const keepSpy = jasmine.createSpy('up:fragment:keep listener')
          up.on('up:fragment:keep', keepSpy)

          const html = (ancestorVersion, pollerVersion) => `
            <div id="ancestor" up-keep data-version="${ancestorVersion}">
              <div id="poller" up-poll data-version="${pollerVersion}">
              </div>
            </div>
          `
          const [ancestor, poller] = htmlFixtureList(html(0, 0))
          up.hello(ancestor)

          // Before interval 1. No changes yet. No requests yet.
          await wait(timingTolerance)
          expect(keepSpy.calls.count()).toBe(0)
          expect('#ancestor').toHaveAttribute('data-version', '0')
          expect('#poller').toHaveAttribute('data-version', '0')
          expect(jasmine.Ajax.requests.count()).toBe(0)

          // After interval 1. Request 1 is in flight.
          await wait(interval)
          expect(keepSpy.calls.count()).toBe(0)
          expect(jasmine.Ajax.requests.count()).toBe(1)

          // After response 1. Poller is swapped.
          jasmine.respondWith(html(1, 1))
          await wait()
          expect(keepSpy.calls.count()).toBe(0)
          expect('#ancestor').toHaveAttribute('data-version', '0')
          expect('#poller').toHaveAttribute('data-version', '1')
          expect(jasmine.Ajax.requests.count()).toBe(1)

          // Ancestor is re-rendered, but ends up being kept.
          up.reload('#ancestor')
          await wait()
          expect(jasmine.Ajax.requests.count()).toBe(2)
          jasmine.respondWith(html(2, 2))
          await wait()

          expect(keepSpy.calls.count()).toBe(1)
          expect('#ancestor').toHaveAttribute('data-version', '0')
          expect('#poller').toHaveAttribute('data-version', '1')
          expect(jasmine.Ajax.requests.count()).toBe(2)

          // After interval 2. Poller reloads.
          await wait(interval + timingTolerance)
          expect(jasmine.Ajax.requests.count()).toBe(3)

          // Polling response
          jasmine.respondWith(html(3, 3))
          await wait()

          expect(keepSpy.calls.count()).toBe(1)
          expect('#ancestor').toHaveAttribute('data-version', '0')
          expect('#poller').toHaveAttribute('data-version', '3')
          expect(jasmine.Ajax.requests.count()).toBe(3)

          // After interval 3. Poller reloads.
          await wait(interval + timingTolerance)
          expect(jasmine.Ajax.requests.count()).toBe(4)
          })

        it('keeps polling if the polling fragment is [up-keep] and has a keep condition', async function() {
          const interval = 150
          const timingTolerance = interval / 3
          up.radio.config.pollInterval = interval
          const keepSpy = jasmine.createSpy('up:fragment:keep listener').and.callFake(function(event) {
            let version = parseInt(event.newFragment.dataset.version)
            // Only swap even versions
            if (version % 2 === 0) event.preventDefault()
          })
          up.on('up:fragment:keep', keepSpy)

          const html = (version) => `
            <div id="poller" up-poll up-keep data-version="${version}">
            </div>
          `
          const [poller] = htmlFixtureList(html(0))
          up.hello(poller)

          // Before interval 1. Nothing changed yet, no requests yet.
          await wait(timingTolerance)
          expect(keepSpy.calls.count()).toBe(0)
          expect('#poller').toHaveAttribute('data-version', '0')
          expect(jasmine.Ajax.requests.count()).toBe(0)

          // After interval 1. Request 1 is in flight.
          await wait(interval)
          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(keepSpy.calls.count()).toBe(0)

          // After response 1. Discarding odd version 1 from server.
          jasmine.respondWith(html(1))
          await wait()
          expect(keepSpy.calls.count()).toBe(1)
          expect('#poller').toHaveAttribute('data-version', '0')
          expect(jasmine.Ajax.requests.count()).toBe(1)

          // After interval 2. Request 2 is in flight.
          await wait(timingTolerance + interval)
          expect(jasmine.Ajax.requests.count()).toBe(2)

          // After response 2. Swapping with even version 2 from server.
          jasmine.respondWith(html(2))
          await wait()
          expect(keepSpy.calls.count()).toBe(2)
          expect('#poller').toHaveAttribute('data-version', '2')
          expect(jasmine.Ajax.requests.count()).toBe(2)

          // After interval 3. Request 3 is in flight.
          await wait(timingTolerance + interval)
          expect(jasmine.Ajax.requests.count()).toBe(3)

          // After response 3. Discarding odd version 3 from server.
          jasmine.respondWith(html(3))
          await wait()
          expect(keepSpy.calls.count()).toBe(3)
          expect('#poller').toHaveAttribute('data-version', '2')
          expect(jasmine.Ajax.requests.count()).toBe(3)

          // After interval 4. Request 4 is in flight.
          await wait(timingTolerance + interval)
          expect(jasmine.Ajax.requests.count()).toBe(4)

          // After response 4. Swapping with even version 4 from server.
          jasmine.respondWith(html(4))
          await wait()
          expect(keepSpy.calls.count()).toBe(4)
          expect('#poller').toHaveAttribute('data-version', '4')
          expect(jasmine.Ajax.requests.count()).toBe(4)
        })

      })

      describe('with [up-preview]', function() {
        it('shows a preview while the fragment is reloading', async function() {
          const interval = 60
          const timingTolerance = 60
          up.radio.config.pollInterval = interval

          const previewUndo = jasmine.createSpy('preview undo')
          const previewApply = jasmine.createSpy('preview apply').and.returnValue(previewUndo)
          up.preview('my:polling:preview', previewApply)

          const element = helloFixture('.element[up-poll][up-preview="my:polling:preview"]', { text: 'old text' })

          await wait(interval + timingTolerance)

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(previewApply.calls.count()).toBe(1)
          expect(previewApply).toHaveBeenCalledWith(jasmine.objectContaining({ fragment: element }), {})
          expect(previewUndo.calls.count()).toBe(0)

          jasmine.respondWithSelector('.element[up-poll][up-preview="my:polling:preview"]', { text: 'new text' })
          await wait()

          expect('.element').toHaveText('new text')

          await wait(interval + timingTolerance)

          expect(jasmine.Ajax.requests.count()).toBe(2)
          expect(previewApply.calls.count()).toBe(2)
          expect(previewUndo.calls.count()).toBe(1)

          jasmine.respondWithSelector('.element[up-poll][up-preview="my:polling:preview"]', { text: 'newer text' })

          await wait()

          expect('.element').toHaveText('newer text')

          expect(previewApply.calls.count()).toBe(2)
          expect(previewUndo.calls.count()).toBe(2)
        })
      })

      describe('with [up-placeholder]', function() {
        it('shows a UI placeholder while the fragment is loading', async function() {
          const interval = 80
          const timingTolerance = 50
          up.radio.config.pollInterval = interval

          const element = helloFixture('.element[up-poll][up-placeholder="<span>placeholder text</span>"]', { text: 'old text' })
          expect('.element').toHaveVisibleText('old text')

          await wait(interval + timingTolerance)

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect('.element').toHaveVisibleText('placeholder text')

          jasmine.respondWithSelector('.element[up-poll][up-placeholder="<span>placeholder text</span>"]', { text: 'new text' })
          await wait()

          expect('.element').toHaveText('new text')

          await wait(interval + timingTolerance)

          expect(jasmine.Ajax.requests.count()).toBe(2)
          expect('.element').toHaveVisibleText('placeholder text')

          jasmine.respondWithSelector('.element[up-poll][up-placeholder="<span>placeholder text</span>"]', { text: 'newer text' })

          await wait()

          expect('.element').toHaveText('newer text')
        })

      })
    })

  })

})
