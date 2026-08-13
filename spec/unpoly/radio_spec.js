const u = up.util
const e = up.element
const $ = jQuery

describe('up.radio', function() {

  describe('JavaScript functions', function() {

    describe('up.radio.startPolling()', function() {

      it("starts polling the given element", async function() {
        let interval
        up.radio.config.pollInterval = interval = 150
        const timingTolerance = interval / 3

        const element = fixture(".element", { text: "old text" })
        up.radio.startPolling(element)

        await wait(timingTolerance)

        expect(".element").toHaveText("old text")
        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(interval)

        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.lastRequest().requestHeaders["X-Up-Target"]).toBe(".element")
        jasmine.respondWithSelector(".element", { text: "new text" })

        await wait()

        expect(".element").toHaveText("new text")
        expect(jasmine.Ajax.requests.count()).toBe(1)

        await wait(timingTolerance + interval)

        expect(jasmine.Ajax.requests.count()).toBe(2)
        jasmine.respondWithSelector(".element", { text: "newer text" })

        await wait()

        expect(".element").toHaveText("newer text")
        expect(jasmine.Ajax.requests.count()).toBe(2)

        await wait(timingTolerance + interval)
        expect(jasmine.Ajax.requests.count()).toBe(3)
      })

      it("does not cause duplicate requests when the server responds with an [up-poll] fragment (bugfix)", async function() {
        let interval
        up.radio.config.pollInterval = interval = 150
        const timingTolerance = interval / 3

        const element = fixture(".element", { text: "old text" })
        up.radio.startPolling(element)

        await wait(timingTolerance)

        expect(".element").toHaveText("old text")
        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(interval)

        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.lastRequest().requestHeaders["X-Up-Target"]).toBe(".element")
        jasmine.respondWithSelector(".element[up-poll]", { text: "new text" })

        await wait()

        expect(".element").toHaveText("new text")
      })

      it("does not stop polling when the server responds without an [up-poll] attribute", async function() {
        let interval
        up.radio.config.pollInterval = interval = 150
        const timingTolerance = interval / 3

        const element = fixture(".element", { text: "old text" })
        up.radio.startPolling(element)

        await wait(timingTolerance)

        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(interval)

        expect(jasmine.Ajax.requests.count()).toBe(1)
        jasmine.respondWithSelector(".element", { text: "new text" })

        await wait()

        expect(".element").toHaveText("new text")

        await wait(timingTolerance + interval)
        expect(jasmine.Ajax.requests.count()).toBe(2)
      })

      it('stops polling when the element is destroyed', async function() {
        const interval = 150
        up.radio.config.pollInterval = interval
        const timingTolerance = interval / 3

        const reloadSpy = spyOn(up, 'reload').and.callFake(() => Promise.resolve(new up.RenderResult()))

        const element = fixture('.element')
        up.radio.startPolling(element)

        await wait(timingTolerance)
        expect(reloadSpy).not.toHaveBeenCalled()

        up.destroy(element)

        await wait(interval)
        expect(reloadSpy).not.toHaveBeenCalled()
      })

      it('stops polling when the element is detached by a foreign script', async function() {
        const interval = 150
        up.radio.config.pollInterval = interval
        const timingTolerance = interval / 3

        const reloadSpy = spyOn(up, 'reload').and.callFake(() => Promise.resolve(new up.RenderResult()))

        const element = fixture('.element')
        up.radio.startPolling(element)

        await wait(timingTolerance)
        expect(reloadSpy).not.toHaveBeenCalled()


        // Detach without going through up.destroy()
        element.remove()

        await wait(interval)
        expect(reloadSpy).not.toHaveBeenCalled()
      })

      it('stops polling when the polling fragment is aborted', async function() {
        const interval = 150
        up.radio.config.pollInterval = interval
        const timingTolerance = interval / 3

        const reloadSpy = spyOn(up, 'reload').and.callFake(() => Promise.resolve(new up.RenderResult()))

        const container = fixture('.container')
        const element = e.affix(container, '.element')
        up.radio.startPolling(element)

        await wait(timingTolerance)
        expect(reloadSpy).not.toHaveBeenCalled()

        up.fragment.abort(container)

        await wait(interval)
        expect(reloadSpy).not.toHaveBeenCalled()
      })

      it('keeps polling when the polling fragment is aborted through its own reloading', async function() {
        up.radio.config.pollAbortable = false
        const interval = 150
        up.radio.config.pollInterval = interval
        const timingTolerance = interval / 3

        const element = fixture('.element', { text: 'old text' })
        up.radio.startPolling(element)

        await wait(timingTolerance + interval)
        expect('.element').toHaveText('old text')
        expect(jasmine.Ajax.requests.count()).toBe(1)

        jasmine.respondWithSelector('.element', { text: 'new text' })

        await wait()
        expect('.element').toHaveText('new text')

        await wait(timingTolerance + interval)
        expect(jasmine.Ajax.requests.count()).toBe(2)
      })

      it('does not cause duplicate requests when called on an [up-poll] element that is already polling', async function() {
        const interval = 150
        up.radio.config.pollInterval = interval
        const timingTolerance = interval / 3

        const element = helloFixture('.element[up-poll]', { text: 'old text' })

        up.radio.startPolling(element)

        await wait(timingTolerance)
        expect('.element').toHaveText('old text')
        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(interval)
        expect(jasmine.Ajax.requests.count()).toBe(1)
      })

      it('can override an [up-source] attribute with a { url } option', async function() {
        let interval
        up.radio.config.pollInterval = (interval = 150)
        const timingTolerance = interval / 3

        const element = helloFixture('.element[up-poll][up-source="/one"]')

        await wait()

        up.radio.startPolling(element, { url: '/two' })

        await wait(timingTolerance)

        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(interval)

        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.lastRequest().url).toMatchURL('/two')

        jasmine.respondWithSelector('.element[up-poll][up-source="/one"]')

        await wait(interval + timingTolerance)

        expect(jasmine.Ajax.requests.count()).toBe(2)
        // Assert that the { url } option is passed to the new up.FragmentPolling instance.
        expect(jasmine.lastRequest().url).toMatchURL('/two')
      })

      it('can override an [up-href] attribute with a { url } option', async function() {
        let interval
        up.radio.config.pollInterval = (interval = 150)
        const timingTolerance = interval / 3

        const element = helloFixture('.element[up-poll][up-href="/one"]')

        await wait()

        up.radio.startPolling(element, { url: '/two' })

        await wait(timingTolerance)

        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(interval)

        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.lastRequest().url).toMatchURL('/two')

        jasmine.respondWithSelector('.element[up-poll][up-href="/one"]')

        await wait(interval + timingTolerance)

        expect(jasmine.Ajax.requests.count()).toBe(2)
        // Assert that the { url } option is passed to the new up.FragmentPolling instance.
        expect(jasmine.lastRequest().url).toMatchURL('/two')
      })

      it('polls with the given { interval }', async function() {
        const defaultInterval = 100
        up.radio.config.pollInterval = defaultInterval
        const timingTolerance = defaultInterval / 3

        const element = helloFixture('.element')

        up.radio.startPolling(element, { interval: defaultInterval * 2 })

        await wait(timingTolerance)
        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(defaultInterval)
        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(defaultInterval)
        expect(jasmine.Ajax.requests.count()).toBe(1)
      })

      it('does not emit up:network:late if the server is slow to respond', async function() {
        const element = helloFixture('.element')
        up.network.config.lateDelay = 20
        const lateListener = jasmine.createSpy('up:network:late listener')
        up.on('up:network:late', lateListener)

        up.radio.startPolling(element, { interval: 5 })

        await wait(60)

        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(lateListener).not.toHaveBeenCalled()
      })

    })

    describe('up.radio.stopPolling()', function() {

      it("stops polling the given, polling element", async function() {
        const interval = 150
        const timingTolerance = interval / 3

        const reloadSpy = spyOn(up, "reload").and.callFake(() => Promise.resolve(new up.RenderResult()))

        const element = fixture(".element")
        up.radio.startPolling(element, { interval })

        await wait(timingTolerance + interval)

        expect(reloadSpy.calls.count()).toBe(1)
        up.radio.stopPolling(element)

        await wait(timingTolerance + interval)

        expect(reloadSpy.calls.count()).toBe(1)
      })


    })
  })

  describe('unobtrusive behavior', function() {

    require('./radio_hungry_spec')

    describe('[up-flashes]', function() {

      it('updates flashes within an explicit target', function() {
        up.hello(htmlFixture(`
          <div id='container'>
            <div id='flashes' up-flashes></div>
            <div id='target'>old target</div>
          </div>\
        `))

        up.render({ fragment: `
          <div id='container'>
            <div id='flashes' up-flashes>new flashes</div>
            <div id='target'>new target</div>
          </div>
        ` })

        expect('#target').toHaveText('new target')
        expect('#flashes').toHaveText('new flashes')
      })

      it('updates flashes when not targeted explicitly', function() {
        up.hello(htmlFixture(`
          <div id='container'>
            <div id='flashes' up-flashes></div>
            <div id='target'>old target</div>
          </div>
        `))

        up.render('#target', { document: `
          <div id='container'>
            <div id='flashes' up-flashes>new flashes</div>
            <div id='target'>new target</div>
          </div>
        ` })

        expect('#target').toHaveText('new target')
        expect('#flashes').toHaveText('new flashes')
      })

      it('does not overwrite existing flashes with empty flashes', function() {
        up.hello(htmlFixture(`
          <div id='container'>
            <div id='flashes' up-flashes>existing flashes</div>
            <div id='target'>old target</div>
          </div>
        `))

        up.render('#target', { document: `
          <div id='container'>
            <div id='flashes' up-flashes></div>
            <div id='target'>new target</div>
          </div>
        ` })

        expect('#target').toHaveText('new target')
        expect('#flashes').toHaveText('existing flashes')
      })

      it('overwrites existing flashes with newer, non-empty flashes', function() {
        up.hello(htmlFixture(`
          <div id='container'>
            <div id='flashes' up-flashes>existing flashes</div>
            <div id='target'>old target</div>
          </div>
        `))

        up.render('#target', { document: `
          <div id='container'>
            <div id='flashes' up-flashes>new flashes</div>
            <div id='target'>new target</div>
          </div>
        ` })

        expect('#target').toHaveText('new target')
        expect('#flashes').toHaveText('new flashes')
      })

      describe('when flashes are rendered into an overlay', function() {

        it('updates flashes on root from an overlay if the flashes are not used for the overlay', function() {
          up.hello(htmlFixture(`
            <div id='container'>
              <div id='flashes' up-flashes>old flashes</div>
              <div id='target'>old target</div>
            </div>
          `))

          up.layer.open({ target: '#target' })

          up.render('#target', { layer: 'overlay', document: `
            <div id='container'>
              <div id='flashes' up-flashes>new flashes</div>
              <div id='target'>new target</div>
            </div>\
          ` })

          expect(up.fragment.get('#target', { layer: 'root' })).toHaveText('old target')
          expect(up.fragment.get('#flashes', { layer: 'root' })).toHaveText('new flashes')
          expect(up.fragment.get('#target', { layer: 'overlay' })).toHaveText('new target')
        })

        it('does not update flashes on root if the flashes were already rendered into the overlay', function() {
          up.hello(htmlFixture(`
            <div id='container'>
              <div id='flashes' up-flashes>old flashes</div>
              <div id='target'>old target</div>
            </div>\
          `))

          up.layer.open({ target: '#container' })

          up.render('#container', { layer: 'overlay', document: `
            <div id='container'>
              <div id='flashes' up-flashes>new flashes</div>
              <div id='target'>new target</div>
            </div>
          ` })

          expect(up.fragment.get('#target', { layer: 'root' })).toHaveText('old target')
          expect(up.fragment.get('#flashes', { layer: 'root' })).toHaveText('old flashes')
          expect(up.fragment.get('#target', { layer: 'overlay' })).toHaveText('new target')
          expect(up.fragment.get('#flashes', { layer: 'overlay' })).toHaveText('new flashes')
        })

        it('updates flashes on root from a grand-child overlay if the flashes are not used for the overlay', function() {
          up.hello(htmlFixture(`
            <div id='container'>
              <div id='flashes' up-flashes>old flashes</div>
              <div id='target'>old target</div>
            </div>\
          `))

          up.layer.open({ target: '#target', content: 'old target' })

          up.layer.open({ target: '#target', content: 'old target' })

          up.render('#target', { layer: 'overlay', document: `
            <div id='container'>
              <div id='flashes' up-flashes>new flashes</div>
              <div id='target'>new target</div>
            </div>
          ` })

          expect(up.fragment.get('#target', { layer: 0 })).toHaveText('old target')
          expect(up.fragment.get('#target', { layer: 1 })).toHaveText('old target')
          expect(up.fragment.get('#target', { layer: 2 })).toHaveText('new target')
          expect(up.fragment.get('#flashes', { layer: 0 })).toHaveText('new flashes')
        })
      })

      describe('when flashes in a closing overlay are discarded', function() {

        it('shows the discarded flashes in the parent layer', async function() {
          up.hello(htmlFixture(`
            <div id='container'>
              <div id='flashes' up-flashes>old flashes</div>
              <div id='target'>old target</div>
            </div>\
          `))

          up.layer.open({ target: '#container' })

          expect(up.layer.isOverlay()).toBe(true)

          const renderPromise = up.render('#container', { url: '/next-page' })

          await wait()

          jasmine.respondWith({
            responseHeaders: { 'X-Up-Accept-Layer': 'null' },
            responseText: `
              <div id='container'>
                <div id='flashes' up-flashes>new flashes</div>
                <div id='target'>new target</div>
              </div>\
          ` })

          await expectAsync(renderPromise).toBeRejectedWith(jasmine.any(up.Aborted))
          expect(up.layer.isOverlay()).toBe(false)

          expect('#target').toHaveText('old target')
          expect('#flashes').toHaveText('new flashes')
        })

        it('shows the discarded flashes in the parent overlay (not root) when multiple overlays are nested', async function() {
          const html = `
            <div id='container'>
              <div id='flashes' up-flashes>old flashes</div>
              <div id='target'>old target</div>
            </div>
          `

          up.hello(htmlFixture(html))    // 0
          up.layer.open({ fragment: html }) // 1
          up.layer.open({ fragment: html }) // 2
          up.layer.open({ fragment: html }) // 3

          expect(up.layer.count).toBe(4)

          const renderPromise = up.render('#container', { url: '/page3', layer: 2 })

          await wait()

          jasmine.respondWith({
            responseHeaders: { 'X-Up-Accept-Layer': 'null' },
            responseText: `\
              <div id='container'>
                <div id='flashes' up-flashes>new flashes</div>
                <div id='target'>new target</div>
              </div>\
          ` })

          await expectAsync(renderPromise).toBeRejectedWith(jasmine.any(up.Aborted))

          expect(up.layer.count).toBe(2)

          expect(up.fragment.get('#target', { layer: 0 })).toHaveText('old target')
          expect(up.fragment.get('#flashes', { layer: 0 })).toHaveText('old flashes')

          expect(up.fragment.get('#target', { layer: 1 })).toHaveText('old target')
          expect(up.fragment.get('#flashes', { layer: 1 })).toHaveText('new flashes')
        })
      })
    })

    require('./radio_poll_spec')
  })
})
