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

        const element = up.hello(fixture('.element[up-poll]', { text: 'old text' }))

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

        const element = up.hello(fixture('.element[up-poll][up-source="/one"]'))

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

        const element = up.hello(fixture('.element[up-poll][up-href="/one"]'))

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

        const element = up.hello(fixture('.element'))

        up.radio.startPolling(element, { interval: defaultInterval * 2 })

        await wait(timingTolerance)
        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(defaultInterval)
        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(defaultInterval)
        expect(jasmine.Ajax.requests.count()).toBe(1)
      })

      it('does not emit up:network:late if the server is slow to respond', async function() {
        const element = up.hello(fixture('.element'))
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

    describe('[up-hungry]', function() {

      it("replaces the element when it is found in a response, even when the element wasn't targeted", async function() {
        fixture('.hungry[up-hungry]', { text: 'old hungry' })
        fixture('.target', { text: 'old target' })

        up.render('.target', { url: '/path' })

        await wait()

        jasmine.respondWith(`\
          <div class="target">
            new target
          </div>
          <div class="between">
            new between
          </div>
          <div class="hungry">
            new hungry
          </div>\
        `)

        await wait()

        expect('.target').toHaveText('new target')
        expect('.hungry').toHaveText('new hungry')
      })

      it("updates elements with [up-hungry=true]", async function() {
        fixture('.hungry[up-hungry=true]', { text: 'old hungry' })
        fixture('.target', { text: 'old target' })

        up.render('.target', { url: '/path' })

        await wait()

        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')

        jasmine.respondWith(`
          <div class="target">
            new target
          </div>
          <div class="hungry">
            new hungry
          </div>
        `)

        await wait()

        expect('.target').toHaveText('new target')
        expect('.hungry').toHaveText('new hungry')
      })

      it("does not updates elements with [up-hungry=false]", async function() {
        fixture('.hungry[up-hungry=false]', { text: 'old hungry' })
        fixture('.target', { text: 'old target' })

        up.render('.target', { url: '/path' })

        await wait()

        jasmine.respondWith(`
          <div class="target">
            new target
          </div>
          <div class="hungry">
            new hungry
          </div>
        `)

        await wait()

        expect('.target').toHaveText('new target')
        expect('.hungry').toHaveText('old hungry')
      })

      it("does not impede replacements when the element is not part of a response", async function() {
        $fixture('.hungry[up-hungry]').text('old hungry')
        $fixture('.target').text('old target')

        const promise = up.render('.target', { url: '/path' })

        await wait()

        jasmine.respondWith(`
          <div class="target">
            new target
          </div>
        `)

        await wait()

        expect('.target').toHaveText('new target')
        expect('.hungry').toHaveText('old hungry')

        await expectAsync(promise).toBeResolvedTo(jasmine.any(up.RenderResult))
      })

      it('allows to use [up-keep] element within a hungry element', function() {
        const target = fixture('#target', { text: 'old target' })
        const hungry = fixture('#hungry[up-hungry]')
        const child = e.affix(hungry, '#child[up-keep]', { text: 'old child' })

        const keepListener = jasmine.createSpy('up:fragment:keep listener')
        up.on('up:fragment:keep', keepListener)

        up.render('#target', { document: `
          <div id="target">new target</div>
          
          <div id="hungry" up-hungry>
            <div id="child" up-keep>new child</div>
          </div>
        ` })

        expect('#target').toHaveText('new target')
        expect('#child').toHaveText('old child')
      })

      it('allows to use [up-keep] element on a hungry element', function() {
        const target = fixture('#target', { text: 'old target' })
        const hungry = fixture('#hungry[up-hungry][up-keep]', { text: 'old hungry' })

        const keepListener = jasmine.createSpy('up:fragment:keep listener')
        up.on('up:fragment:keep', keepListener)

        up.render('#target', { document: `
          <div id="target">new target</div>
          
          <div id="hungry" up-hungry up-keep>
            new hungry
          </div>\
          `
        })

        expect('#target').toHaveText('new target')
        expect('#hungry').toHaveText('old hungry')

        expect(keepListener).toHaveBeenCalled()
      })


      it("does not reload a hungry element if it has a weak selector", async function() {
        $fixture("div[up-hungry]").text("old hungry")
        $fixture(".target").text("old target")
        const warnSpy = spyOn(up, "warn")

        const renderJob = up.render(".target", { url: "/path" })

        await wait()
        jasmine.respondWith(`
          <div class="target">new target</div>
          <div class="between">new between</div>
          <div up-hungry>new hungry</div>
        `)

        await renderJob

        expect(".target").toHaveText("new target")
        expect("div[up-hungry]").toHaveText("old hungry")
        expect(warnSpy).toHaveBeenCalled()
        expect(warnSpy.calls.argsFor(0)[1]).toMatch(/ignoring untargetable fragment/i)
      })

      it("still reveals the element that was originally targeted", async function() {
        $fixture(".hungry[up-hungry]").text("old hungry")
        $fixture(".target").text("old target")

        const revealStub = up.reveal.mock().and.returnValue(Promise.resolve())

        const navigateJob = up.navigate(".target", { url: "/path", scroll: "target" })

        await wait()
        jasmine.respondWith(`<div class="target">new target</div>`)

        await navigateJob

        expect(revealStub).toHaveBeenCalled()
        const revealArg = revealStub.calls.mostRecent().args[0]
        expect(revealArg).not.toMatchSelector(".hungry")
        expect(revealArg).toMatchSelector(".target")
      })

      it("does not change the X-Up-Target header for the request", async function() {
        $fixture(".hungry[up-hungry]").text("old hungry")
        $fixture(".target").text("old target")
        $fixture(".fail-target").text("old fail target")

        const navigateJob = up.navigate(".target", { url: "/path", failTarget: ".fail-target" })

        await wait()

        expect(jasmine.lastRequest().requestHeaders["X-Up-Target"]).toEqual(".target")
        expect(jasmine.lastRequest().requestHeaders["X-Up-Fail-Target"]).toEqual(".fail-target")
      })

      it('does replace the element when the server responds with an error (e.g. for error flashes)', async function() {
        $fixture('.hungry[up-hungry]').text('old hungry')
        $fixture('.target').text('old target')
        $fixture('.fail-target').text('old fail target')

        const renderJob = up.render('.target', { url: '/path', failTarget: '.fail-target' })

        await wait()

        jasmine.respondWith({
          status: 500,
          responseText: `
            <div class="target">
              new target
            </div>
            <div class="fail-target">
              new fail target
            </div>
            <div class="between">
              new between
            </div>
            <div class="hungry">
              new hungry
            </div>
          `
        })

        await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

        expect('.target').toHaveText('old target')
        expect('.fail-target').toHaveText('new fail target')
        expect('.hungry').toHaveText('new hungry')
      })

      it("does not update [up-hungry] elements with { hungry: false } option", async function() {
        $fixture(".hungry[up-hungry]").text("old hungry")
        $fixture(".target").text("old target")

        const renderJob = up.render(".target", { url: "/path", hungry: false })

        await wait()
        jasmine.respondWith({
          responseText: `
            <div class="target">new target</div>
            <div class="hungry">new hungry</div>
          `
        })

        await renderJob

        expect(".target").toHaveText("new target")
        expect(".hungry").toHaveText("old hungry")
      })

      it("does not update an [up-hungry] element that is contained by the explicit target", async function() {
        const container = fixture(".container")
        e.affix(container, ".child[up-hungry]")

        const insertedSpy = jasmine.createSpy("up:fragment:inserted listener")
        up.on("up:fragment:inserted", insertedSpy)

        await up.render({
          target: ".container",
          document: `
            <div class="container">
              <div class="child" up-hungry>
              </div>
            </div>
        ` })

        expect(insertedSpy.calls.count()).toBe(1)
        expect(insertedSpy.calls.argsFor(0)[0].target).toBe(
          document.querySelector(".container")
        )
      })

      it("replaces the element when the explicit target is :none", async function() {
        $fixture('.hungry[up-hungry]').text('old hungry')
        $fixture('.target').text('old target')

        up.render(':none', { url: '/path' })

        await wait()

        jasmine.respondWith(`\
          <div class="target">
            new target
          </div>
          <div class="between">
            new between
          </div>
          <div class="hungry">
            new hungry
          </div>\
        `)

        await wait()

        expect('.target').toHaveText('old target')
        expect('.hungry').toHaveText('new hungry')
      })

      it('updates the hungry element for a failed response', async function() {
        $fixture('.hungry[up-hungry]').text('old hungry')
        $fixture('.success-target').text('old success target')
        $fixture('.failure-target').text('old failure target')

        const promise = up.render({ target: '.success-target', failTarget: '.failure-target', url: '/path' })

        await wait()

        jasmine.respondWith({ status: 500, responseText: `
          <div class="success-target">
            new success target
          </div>
          <div class="failure-target">
            new failure target
          </div>
          <div class="between">
            new between
          </div>
          <div class="hungry">
            new hungry
          </div>
        ` })

        await expectAsync(promise).toBeRejectedWith(jasmine.any(up.RenderResult))
        await expectAsync(promise).toBeRejectedWith(jasmine.objectContaining({
          target: '.failure-target, .hungry',
          fragments: [e.get('.failure-target'), e.get('.hungry')],
        }))

        expect('.success-target').toHaveText('old success target')
        expect('.failure-target').toHaveText('new failure target')
        expect('.hungry').toHaveText('new hungry')
      })

      it('only updates a single element if two hungry elements are nested', function() {
        const insertedSpy = jasmine.createSpy('up:fragment:inserted listener for hungry elements')
        up.on('up:fragment:inserted', '[up-hungry]', insertedSpy)

        htmlFixture(`
          <div id='root'>
            <div id="container" class='old' up-hungry>
              <div id='child' class='old' up-hungry></div>
            </div>
            <div id="target" class='old'></div>
          </div>
          `
        )

        up.render('#target', { document: `
          <div id='root'>
            <div id="container" class='new' up-hungry>
              <div id='child' class='new' up-hungry></div>
            </div>
            <div id="target" class='new'></div>
          </div>\
          `
        })

        expect('#container').toHaveClass('new')
        expect('#child').toHaveClass('new')
        expect('#target').toHaveClass('new')

        expect(insertedSpy.calls.count()).toBe(1)
        expect(insertedSpy.calls.mostRecent().args[0]).toBeEvent('up:fragment:inserted', { target: document.querySelector('#container') })
      })

      it("aborts pending requests for a hungry element when it is updated", async function() {
        fixture('.hungry[up-hungry]', { text: 'old hungry' })
        fixture('.target', { text: 'old target' })

        let renderHungryPromise = up.render('.hungry', { url: '/hungry' })
        let renderTargetPromise = up.render('.target', { url: '/target' })

        await wait()

        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')

        await expectAsync(renderHungryPromise).toBePending()
        await expectAsync(renderTargetPromise).toBePending()

        jasmine.respondWith(`
          <div class="target">
            new target
          </div>
          <div class="between">
            new between
          </div>
          <div class="hungry">
            new hungry
          </div>
        `)

        await expectAsync(renderHungryPromise).toBeRejectedWith(jasmine.any(up.Aborted))
        await expectAsync(renderTargetPromise).toBeResolvedTo(jasmine.any(up.RenderResult))

        expect('.target').toHaveText('new target')
        expect('.hungry').toHaveText('new hungry')
      })

      describe('transition', function() {

        it("does not use the render pass' transition for the hungry element", async function() {
          fixture('.target.old', { text: 'old target' })
          fixture('.hungry.new', { text: 'old hungry', 'up-hungry': '' })

          up.render('.target', { transition: 'cross-fade', duration: 300, document: `
            <div class="target new">new target</div>
            <div class="hungry new">new hungry</div>
            ` })

          await wait(150)

          // Target is morphing
          expect(document.querySelectorAll('.target').length).toBe(2)
          expect('.target.old').toHaveOpacity(0.5, 0.35)
          expect('.target.new').toHaveOpacity(0.5, 0.35)

          // Hungry is not morphing
          expect(document.querySelectorAll('.hungry').length).toBe(1)
          expect('.hungry').toHaveOpacity(1.0)
        })

        describe('with [up-transition]', function() {

          it('lets the hungry element use a transition', async function() {
            fixture('#target.old', { text: 'old target' })
            fixture('#hungry.old', { text: 'old hungry', 'up-hungry': '', 'up-transition': 'cross-fade', 'up-duration': '300' })

            up.render('#target', { document: `
              <div id="target" class="new">new target</div>
              <div id="hungry" class="new">new hungry</div>
            ` })

            await wait(150)

            // Hungry is morphing
            expect(document.querySelectorAll('#hungry').length).toBe(2)
            expect('#hungry.old').toHaveOpacity(0.5, 0.35)
            expect('#hungry.new').toHaveOpacity(0.5, 0.35)

            // Target is not morphing
            expect(document.querySelectorAll('#target').length).toBe(1)
            expect('#target').toHaveOpacity(1.0)
          })

          it('delays the fulfillment of the up.render().finished promise', async function() {
            fixture('#target.old', { text: 'old target' })
            fixture('#hungry.new', { text: 'old hungry', 'up-hungry': '', 'up-transition': 'cross-fade', 'up-duration': '200' })

            const job = up.render('#target', { transition: 'cross-fade', document: `
              <div id="target" class="new">new target</div>
              <div id="hungry" class="new">new hungry</div>
            ` })

            await wait(100)

            await expectAsync(job.finished).toBePending()

            await wait(200)

            await expectAsync(job.finished).toBeResolvedTo(jasmine.any(up.RenderResult))
            await expectAsync(job.finished).toBeResolvedTo(jasmine.objectContaining({
              target: '#target, #hungry',
              fragments: [document.querySelector('#target.new'), document.querySelector('#hungry.new')],
              layer: up.layer.root,
            }))
          })

          it('delays the rejection of the up.render().finished promise when updating from a failed response', async function() {
            fixture('#target.old', { text: 'old target' })
            fixture('#hungry.new', { text: 'old hungry', 'up-hungry': '', 'up-transition': 'cross-fade', 'up-duration': '200' })

            const job = up.render({
              target: '#target',
              failTarget: '#target',
              url: '/path2',
            })
            const {
              finished
            } = job

            await wait()

            jasmine.respondWith({ status: 500, responseText: `
              <div id="target" class="new">new target</div>
              <div id="hungry" class="new">new hungry</div>
            ` })

            await wait(100)

            await expectAsync(job).toBeRejectedWith(jasmine.any(up.RenderResult))
            await expectAsync(finished).toBePending()

            await wait(200)

            await expectAsync(finished).toBeRejectedWith(jasmine.any(up.RenderResult))
            await expectAsync(finished).toBeRejectedWith(jasmine.objectContaining({
              target: '#target, #hungry',
              fragments: [document.querySelector('#target.new'), document.querySelector('#hungry.new')],
              layer: up.layer.root,
            }))
          })
        })
      })

      describe('restriction by layer', function() {

        it('only updates [up-hungry] elements in the targeted layer, even if the response would yield matching elements for multiple layers', function() {
          up.layer.config.openDuration = 0
          up.layer.config.closeDuration = 0

          $fixture('.outside').text('old outside').attr('up-hungry', true)

          const closeEventHandler = jasmine.createSpy('close event handler')
          up.on('up:layer:dismiss up:layer:accept', closeEventHandler)

          up.layer.open({ fragment: `
            <div class='inside'>
              old inside
            </div>\
          ` })

          expect(up.layer.isOverlay()).toBe(true)

          up.render({
            target: '.inside',
            document: `
              <div class="outside">
                new outside
              </div>
              <div class='inside'>
                new inside
              </div>
            `,
            layer: 'front'
          })

          expect(closeEventHandler).not.toHaveBeenCalled()
          expect('.inside').toHaveText('new inside')
          expect('.outside').toHaveText('old outside')
        })

        describe('with [up-if-layer=any]', function() {

          beforeEach(function() {
            up.layer.config.openDuration = 0
            up.layer.config.closeDuration = 0
          })

          describe('when updating an existing overlay', function() {

            it('does update an [up-hungry] element in an non-targeted layer', function() {
              $fixture('.outside').text('old outside').attr('up-hungry', true).attr('up-if-layer', 'any')

              const closeEventHandler = jasmine.createSpy('close event handler')
              up.on('up:layer:dismiss up:layer:accept', closeEventHandler)

              up.layer.open({ fragment: `
                <div class='inside'>
                  old inside
                </div>
              ` })

              expect(up.layer.isOverlay()).toBe(true)

              up.render({
                target: '.inside',
                document: `
                  <div class="outside">
                    new outside
                  </div>
                  <div class='inside'>
                    new inside
                  </div>\
                `,
                layer: 'front'
              })

              expect(closeEventHandler).not.toHaveBeenCalled()
              expect('.inside').toHaveText('new inside')
              expect('.outside').toHaveText('new outside')
            })

            it('sets up.layer.current and meta.layer to the non-targeted layer', function() {
              const currentLayerSpy = jasmine.createSpy('spy for up.layer.current')
              const metaLayerSpy = jasmine.createSpy('spy for meta.layer')

              fixture('.outside', { text: 'old outside', 'up-hungry': true, 'up-if-layer': 'any' })

              up.compiler('.outside', function(element, data, meta) {
                currentLayerSpy(up.layer.current)
                metaLayerSpy(meta.layer)
              })

              expect(currentLayerSpy.calls.count()).toBe(1)
              expect(currentLayerSpy.calls.argsFor(0)[0]).toBe(up.layer.root)
              expect(metaLayerSpy.calls.argsFor(0)[0]).toBe(up.layer.root)

              up.layer.open({ fragment: `
                <div class='inside'>
                  old inside
                </div>
              ` })

              expect(up.layer.isOverlay()).toBe(true)

              up.render({
                target: '.inside',
                document: `
                  <div class="outside">
                    new outside
                  </div>
                  <div class='inside'>
                    new inside
                  </div>
                `,
                layer: 'front'
              })

              expect(up.layer.isOverlay()).toBe(true)

              expect(currentLayerSpy.calls.count()).toBe(2)
              expect(currentLayerSpy.calls.argsFor(1)[0]).toBe(up.layer.root)
              expect(metaLayerSpy.calls.argsFor(1)[0]).toBe(up.layer.root)
            })

            it('does not update the element if it is contained by the explicit target', function() {
              fixture('.foo', { text: 'old foo', 'up-hungry': true, 'up-if-layer': 'any' })

              up.layer.open({ fragment: `
                <div class='overlay'>
                  <div class='foo'>old foo</div>
                  <div class='content'>old content</div>
                </div>
              ` })

              const insertedSpy = jasmine.createSpy('up:fragment:inserted listener')
              up.on('up:fragment:inserted', insertedSpy)

              up.render({ fragment: `
                <div class='overlay'>
                  <div class='foo'>new foo</div>
                  <div class='content'>new content</div>
                </div>
              ` })

              expect(up.fragment.get('.content', { layer: 'overlay' })).toHaveText('new content')
              expect(up.fragment.get('.foo', { layer: 'overlay' })).toHaveText('new foo')
              expect(up.fragment.get('.foo', { layer: 'root' })).toHaveText('old foo')

              expect(insertedSpy.calls.count()).toBe(1)
            })

            it('only updates a single element if two hungry elements on another layer are nested', function() {
              htmlFixture(`
                <div id='root'>
                  <div id="container" class='old' up-hungry up-if-layer='any'>
                    <div id='child' class='old' up-hungry up-if-layer='any'></div>
                  </div>
                </div>
              `)

              up.layer.open({ fragment: "<div id='target' class='old'</div>" })

              const insertedSpy = jasmine.createSpy('up:fragment:inserted listener for hungry elements')
              up.on('up:fragment:inserted', '[up-hungry]', insertedSpy)

              up.render('#target', { document: `
                <div id='root'>
                  <div id="container" class='new' up-hungry up-if-layer='any'>
                    <div id='child' class='new' up-hungry up-if-layer='any'></div>
                  </div>
                  <div id='target' class='new'></div>
                </div>\
              ` })

              expect('#container').toHaveClass('new')
              expect('#child').toHaveClass('new')
              expect('#target').toHaveClass('new')

              expect(insertedSpy.calls.count()).toBe(1)
              expect(insertedSpy.calls.mostRecent().args[0]).toBeEvent('up:fragment:inserted', { target: document.querySelector('#container') })
            })

            it('updates a hungry element on a descendant layer', function() {
              htmlFixture(`
                <div id="target">old target</div>
              `)

              up.layer.open({ fragment: `
                <div id="hungry" up-hungry up-if-layer='any'>old hungry</div>
              ` })

              up.render({ target: '#target', layer: 'root', document: `
                <div id="hungry" up-hungry up-if-layer='any'>new hungry</div>
                <div id="target">new target</div>\
              ` })

              expect(up.fragment.get('#target', { layer: 'root' })).toHaveText('new target')
              expect(up.fragment.get('#hungry', { layer: 'overlay' })).toHaveText('new hungry')
            })

            it('prefers to update the closest descendant layer', function() {
              makeLayers([
                { fragment: '<main><div id="target">old target</div></main>' },
                { fragment: '<main><div id="hungry" up-hungry up-if-layer="any">old hungry</div></main>' },
                { fragment: '<main><div id="hungry" up-hungry up-if-layer="any">old hungry</div></main>' },
              ])

              up.render({ target: '#target', layer: 'root', document: `
                <div id="hungry" up-hungry up-if-layer='any'>new hungry</div>
                <div id="target">new target</div>
              ` })

              expect(up.fragment.get('#target', { layer: 0 })).toHaveText('new target')
              expect(up.fragment.get('#hungry', { layer: 1 })).toHaveText('new hungry')
              expect(up.fragment.get('#hungry', { layer: 2 })).toHaveText('old hungry')
            })

            it('prefers to update the closest ancestor layer', function() {
              makeLayers([
                { fragment: '<main><div id="hungry" up-hungry up-if-layer="any">old hungry</div></main>' },
                { fragment: '<main><div id="hungry" up-hungry up-if-layer="any">old hungry</div></main>' },
                { fragment: '<main><div id="target">old target</div></main>' },
              ])

              up.render({ target: '#target', layer: 2, document: `
                <div id="hungry" up-hungry up-if-layer='any'>new hungry</div>
                <div id="target">new target</div>
              ` })

              expect(up.fragment.get('#hungry', { layer: 0 })).toHaveText('old hungry')
              expect(up.fragment.get('#hungry', { layer: 1 })).toHaveText('new hungry')
              expect(up.fragment.get('#target', { layer: 2 })).toHaveText('new target')
            })

            it('prefers to update the closest ancestor layer over updating a descendant layer', function() {
              makeLayers([
                { fragment: '<main><div id="hungry" up-hungry up-if-layer="any">old hungry</div></main>' },
                { fragment: '<main><div id="hungry" up-hungry up-if-layer="any">old hungry</div></main>' },
                { fragment: '<main><div id="target">old target</div></main>' },
                { fragment: '<main><div id="target">old target</div></main>' },
                { fragment: '<main><div id="hungry" up-hungry up-if-layer="any">old hungry</div></main>' },
              ])

              up.render({ target: '#target', layer: 3, document: `
                <div id="hungry" up-hungry up-if-layer='any'>new hungry</div>
                <div id="target">new target</div>\
              ` })

              expect(up.fragment.get('#hungry', { layer: 0 })).toHaveText('old hungry')
              expect(up.fragment.get('#hungry', { layer: 1 })).toHaveText('new hungry')
              expect(up.fragment.get('#target', { layer: 2 })).toHaveText('old target')
              expect(up.fragment.get('#target', { layer: 3 })).toHaveText('new target')
              expect(up.fragment.get('#hungry', { layer: 4 })).toHaveText('old hungry')
            })

            describe('when a response closes the overlay via X-Up-Accept-layer', function() {

              it('updates the [up-hungry] element with the discarded overlay content', async function() {
                $fixture('.outside').text('old outside').attr('up-hungry', true).attr('up-if-layer', 'any')

                const closeEventHandler = jasmine.createSpy('close event handler')
                up.on('up:layer:accept', closeEventHandler)

                up.layer.open({ fragment: `
                  <div class='inside'>
                    old inside
                  </div>
                ` })

                expect(up.layer.count).toBe(2)

                const updatePromise = up.render('.inside', { url: '/page2' })

                await wait()

                jasmine.respondWith({
                  responseText: `
                    <div class="outside">
                      new outside
                    </div>
                    <div class='inside'>
                      new inside
                    </div>
                  `,
                  responseHeaders: { 'X-Up-Accept-Layer': 'null' }
                })

                await expectAsync(updatePromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(closeEventHandler).toHaveBeenCalled()
                expect(up.layer.count).toBe(1)
                expect('.outside').toHaveText('new outside')
              })

              it('updates the [up-hungry] element with the discarded overlay content even if it would have been contained by the explicit target', async function() {
                fixture('.foo', { text: 'old foo in root', 'up-hungry': '', 'up-if-layer': 'any' })

                up.layer.open({ fragment: `
                  <div class='overlay'>
                    <div class='foo'>old foo in overlay</div>
                    <div class='content'>old content in overlay</div>
                  </div>
                ` })

                await wait()

                const updatePromise = up.render('.overlay', { url: '/page2' })

                await wait()

                jasmine.respondWith({
                  responseHeaders: { 'X-Up-Accept-Layer': 'null' },
                  responseText: `
                    <div class='overlay'>
                      <div class='foo'>new foo</div>
                      <div class='content'>new content</div>
                    </div>
                  `
                })

                await expectAsync(updatePromise).toBeRejectedWith(jasmine.any(up.Aborted))

                await wait()

                expect(up.layer.isRoot()).toBe(true)

                expect(up.fragment.get('.foo', { layer: 'root' })).toHaveText('new foo')
              })

              it('updates the [up-hungry] element before onAccepted callbacks', async function() {
                $fixture('.outside').text('old outside').attr('up-hungry', true).attr('up-if-layer', 'any')

                const outsideSpy = jasmine.createSpy('outside spy')
                const onAccepted = () => outsideSpy(document.querySelector('.outside').innerText.trim())

                up.layer.open({ onAccepted, fragment: `
                  <div class='inside'>
                    old inside
                  </div>
                ` })

                expect(up.layer.count).toBe(2)

                const updatePromise = up.render('.inside', { url: '/page2' })

                await wait()

                jasmine.respondWith({
                  responseText: `
                    <div class="outside">
                      new outside
                    </div>
                    <div class='inside'>
                      new inside
                    </div>
                  `,
                  responseHeaders: { 'X-Up-Accept-Layer': 'null' }
                })

                await expectAsync(updatePromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(up.layer.count).toBe(1)
                expect(outsideSpy).toHaveBeenCalledWith('new outside')
              })
            })

            describe('when a response closes the overlay via X-Up-Events', function() {

              it('updates the [up-hungry] element with the discarded overlay content', async function() {
                $fixture('.outside').text('old outside').attr('up-hungry', true).attr('up-if-layer', 'any')

                const closeEventHandler = jasmine.createSpy('close event handler')
                up.on('up:layer:accept', closeEventHandler)

                up.layer.open({
                  acceptEvent: 'goal:reached',
                  fragment: `
                    <div class='inside'>
                      old inside
                    </div>\
                  `
                })

                expect(up.layer.count).toBe(2)

                const updatePromise = up.render('.inside', { url: '/page2' })

                await wait()

                jasmine.respondWith({
                  responseText: `
                    <div class="outside">
                      new outside
                    </div>
                    <div class='inside'>
                      new inside
                    </div>\
                  `,
                  responseHeaders: { 'X-Up-Events': JSON.stringify([{ type: 'goal:reached', layer: 'current' }]) }
                })

                await expectAsync(updatePromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(closeEventHandler).toHaveBeenCalled()
                expect(up.layer.count).toBe(1)
                expect('.outside').toHaveText('new outside')
              })

              it('updates the [up-hungry] element before onAccepted callbacks', async function() {
                $fixture('.outside').text('old outside').attr('up-hungry', true).attr('up-if-layer', 'any')

                const outsideSpy = jasmine.createSpy('outside spy')
                const onAccepted = () => outsideSpy(document.querySelector('.outside').innerText.trim())

                up.layer.open({ acceptEvent: 'goal:reached', onAccepted, fragment: `
                  <div class='inside'>
                    old inside
                  </div>\
                ` })

                expect(up.layer.count).toBe(2)

                const updatePromise = up.render('.inside', { url: '/page2' })

                await wait()

                jasmine.respondWith({
                  responseText: `
                    <div class="outside">
                      new outside
                    </div>
                    <div class='inside'>
                      new inside
                    </div>
                  `,
                  responseHeaders: { 'X-Up-Events': JSON.stringify([{ type: 'goal:reached', layer: 'current' }]) }
                })

                await expectAsync(updatePromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(up.layer.count).toBe(1)
                expect(outsideSpy).toHaveBeenCalledWith('new outside')
              })
            })
          })

          describe('when opening a new overlay', function() {

            it('does update the [up-hungry] element in the parent layer', function() {
              fixture('.outside', { text: 'old outside', 'up-hungry': true,  'up-if-layer': 'any' })

              up.layer.open({ target: '.inside', document: `
                <div class="outside">
                  new outside
                </div>
                <div class='inside'>
                  new inside
                </div>
              ` })

              expect(up.layer.isOverlay()).toBe(true)

              expect('.inside').toHaveText('new inside')
              expect('.outside').toHaveText('new outside')
            })

            it('only updates a single element if two hungry elements on another layer are nested', function() {
              htmlFixture(`
                <div id='root'>
                  <div id="container" class='old' up-hungry up-if-layer='any'>
                    <div id='child' class='old' up-hungry up-if-layer='any'></div>
                  </div>
                </div>\
              `)

              const insertedSpy = jasmine.createSpy('up:fragment:inserted listener for hungry elements')
              up.on('up:fragment:inserted', '[up-hungry]', insertedSpy)

              up.layer.open({ target: '#target', document: `
                <div id='root'>
                  <div id="container" class='new' up-hungry up-if-layer='any'>
                    <div id='child' class='new' up-hungry up-if-layer='any'></div>
                  </div>
                  <div id='target' class='new'></div>
                </div>\
              ` })

              expect('#container').toHaveClass('new')
              expect('#child').toHaveClass('new')
              expect('#target').toHaveClass('new')

              expect(insertedSpy.calls.count()).toBe(1)
              expect(insertedSpy.calls.mostRecent().args[0]).toBeEvent('up:fragment:inserted', { target: document.querySelector('#container') })
            })

            describe('when the initial response immediately closes the new overlay via X-Up-Accept-Layer', function() {

              it('updates that [up-hungry] element with the discarded overlay content', async function() {
                fixture('.outside', { text: 'old outside', 'up-hungry': true,  'up-if-layer': 'any' })

                const openPromise = up.layer.open({ target: '.inside', url: '/other' })

                await wait()

                jasmine.respondWith({
                  responseText: `
                    <div class="outside">
                      new outside
                    </div>
                    <div class='inside'>
                      new inside
                    </div>\
                  `,
                  responseHeaders: { 'X-Up-Accept-Layer': 'null' }
                })

                await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(up.layer.isOverlay()).toBe(false)

                expect('.outside').toHaveText('new outside')
              })

              it('updates that [up-hungry] element with the discarded overlay content even if the element would have been included in the explicit target', async function() {
                fixture('.foo', { text: 'old foo in root', 'up-hungry': '', 'up-if-layer': 'any' })

                const openPromise = up.layer.open({ target: '.overlay', url: '/page2' })

                await wait()

                jasmine.respondWith({
                  responseHeaders: { 'X-Up-Accept-Layer': 'null' },
                  responseText: `
                    <div class='overlay'>
                      <div class='foo'>new foo</div>
                      <div class='content'>new content</div>
                    </div>\
                  `
                })

                await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))

                await wait()

                expect(up.layer.isRoot()).toBe(true)

                expect(up.fragment.get('.foo', { layer: 'root' })).toHaveText('new foo')
              })

              it('updates that [up-hungry] element before onAccepted callbacks', async function() {
                fixture('.outside', { text: 'old outside', 'up-hungry': true,  'up-if-layer': 'any' })

                const outsideSpy = jasmine.createSpy('outside spy')
                const onAccepted = () => outsideSpy(document.querySelector('.outside').innerText.trim())

                const openPromise = up.layer.open({ target: '.inside', url: '/other', onAccepted })

                await wait()

                jasmine.respondWith({
                  responseText: `
                    <div class="outside">
                      new outside
                    </div>
                    <div class='inside'>
                      new inside
                    </div>\
                    `,
                  responseHeaders: { 'X-Up-Accept-Layer': 'null' }
                })

                await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(up.layer.isOverlay()).toBe(false)
                expect(outsideSpy).toHaveBeenCalledWith('new outside')
              })
            })

            describe('when the initial response immediately closes the new overlay via X-Up-Events', function() {

              it('updates that [up-hungry] element with the discarded overlay content', async function() {
                fixture('.outside', { text: 'old outside', 'up-hungry': true,  'up-if-layer': 'any' })

                const openPromise = up.layer.open({ target: '.inside', url: '/other', acceptEvent: 'goal:reached' })

                await wait()

                jasmine.respondWith({
                  responseText: `
                    <div class="outside">
                      new outside
                    </div>
                    <div class='inside'>
                      new inside
                    </div>\
                  `,
                  responseHeaders: { 'X-Up-Events': JSON.stringify([{ type: 'goal:reached', layer: 'current' }]) }
                })

                await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(up.layer.isOverlay()).toBe(false)

                expect('.outside').toHaveText('new outside')
              })

              it('updates that [up-hungry] element before onAccepted callbacks', async function() {
                fixture('.outside', { text: 'old outside', 'up-hungry': true,  'up-if-layer': 'any' })

                const outsideSpy = jasmine.createSpy('outside spy')
                const onAccepted = () => outsideSpy(document.querySelector('.outside').innerText.trim())

                const openPromise = up.layer.open({ target: '.inside', url: '/other', acceptEvent: 'goal:reached', onAccepted })

                await wait()

                jasmine.respondWith({
                  responseText: `
                    <div class="outside">
                      new outside
                    </div>
                    <div class='inside'>
                      new inside
                    </div>
                  `,
                  responseHeaders: { 'X-Up-Events': JSON.stringify([{ type: 'goal:reached', layer: 'current' }]) }
                })

                await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(up.layer.isOverlay()).toBe(false)

                expect(outsideSpy).toHaveBeenCalledWith('new outside')
              })
            })
          })
        })

        describe('with [up-if-layer] set to a layer option matching multiple layers', () => {
          it('only grabs updates from matching layers', async function() {
            makeLayers([
              { content: '<div id="target">target1</div><div id="hungry" up-hungry up-if-layer="0, 1">hungry1</div>' },
              { content: '<div id="target">target1</div>' },
              { content: '<div id="target">target1</div>' },
            ])

            await wait()

            up.render({
              target: '#target',
              layer: 0,
              document: '<div id="target">target2</div><div id="hungry" up-hungry up-if-layer="0, 1">hungry2</div>'
            })

            await wait()

            expect(document.querySelector('#hungry')).toHaveText('hungry2')

            up.render({
              target: '#target',
              layer: 2,
              document: '<div id="target">target3</div><div id="hungry" up-hungry up-if-layer="0, 1">hungry3</div>'
            })

            await wait()

            expect(document.querySelector('#hungry')).toHaveText('hungry2')

            up.render({
              target: '#target',
              layer: 1,
              document: '<div id="target">target4</div><div id="hungry" up-hungry up-if-layer="0, 1">hungry4</div>'
            })

            await wait()

            expect(document.querySelector('#hungry')).toHaveText('hungry4')

          })
        })

        describe('with [up-if-layer] set to a relative layer option', () => {
          it('resolves the option from the perspective of the hungry layer, not of the updating layer', async function() {
            makeLayers([
              { content: '<div id="target">target1</div><div id="hungry" up-hungry up-if-layer="child">hungry1</div>' },
              { content: '<div id="target">target1</div><div id="hungry" up-hungry up-if-layer="child">hungry1</div>' },
              { content: '<div id="target">target1</div><div id="hungry" up-hungry up-if-layer="child">hungry1</div>' },
            ])

            await wait()

            up.render({
              target: '#target',
              layer: 0,
              document: '<div id="target">target2</div><div id="hungry" up-hungry up-if-layer="child">hungry2</div>'
            })

            await wait()

            expect(up.fragment.get('#hungry', { layer: 0 })).toHaveText('hungry1')
            expect(up.fragment.get('#hungry', { layer: 1 })).toHaveText('hungry1')
            expect(up.fragment.get('#hungry', { layer: 2 })).toHaveText('hungry1')

            up.render({
              target: '#target',
              layer: 1,
              document: '<div id="target">target3</div><div id="hungry" up-hungry up-if-layer="child">hungry3</div>'
            })

            await wait()

            expect(up.fragment.get('#hungry', { layer: 0 })).toHaveText('hungry3')
            expect(up.fragment.get('#hungry', { layer: 1 })).toHaveText('hungry1')
            expect(up.fragment.get('#hungry', { layer: 2 })).toHaveText('hungry1')

            up.render({
              target: '#target',
              layer: 2,
              document: '<div id="target">target4</div><div id="hungry" up-hungry up-if-layer="child">hungry4</div>'
            })

            await wait()

            expect(up.fragment.get('#hungry', { layer: 0 })).toHaveText('hungry3')
            expect(up.fragment.get('#hungry', { layer: 1 })).toHaveText('hungry4')
            expect(up.fragment.get('#hungry', { layer: 2 })).toHaveText('hungry1')

          })
        })
      })

      if (up.migrate.loaded) {

        describe('with [up-if-history]', function() {
          it("only updates a hungry fragment when updating history", async function() {
            up.hello(
              $fixture(".hungry[up-hungry]")
                .text("old hungry")
                .attr("up-if-history", "")
            )
            $fixture(".target").text("target version 1")

            const firstRenderJob = up.render(".target", { url: "/other", history: false })

            await wait()

            jasmine.respondWith(`
              <div class="target">target version 2</div>
              <div class="hungry">new hungry</div>
            `)

            await firstRenderJob

            expect(".target").toHaveText("target version 2")
            expect(".hungry").toHaveText("old hungry")

            const secondRenderJob = up.render(".target", { url: "/target", history: true })

            await wait()

            jasmine.respondWith(`
              <div class="target">target version 3</div>
              <div class="hungry">new hungry</div>
            `)

            await secondRenderJob

            expect(".target").toHaveText("target version 3")
            expect(".hungry").toHaveText("new hungry")
          })


        })
      }

      describe('up:fragment:hungry', function() {

        it('emits an up:fragment:hungry event with details about the render pass and the new element that would be matched', async function() {
          const oldHungry = fixture('#hungry[up-hungry]', { text: 'old hungry' })
          fixture('#target', { text: 'old target' })

          const hungryListener = jasmine.createSpy('up:fragment:hungry listener')
          up.on('up:fragment:hungry', hungryListener)

          up.render({
            target: '#target',
            scroll: '#target',
            abort: 'all',
            document: `
              <div id="hungry" up-hungry>new hungry</div>
              <div id="target">new target</div>\
            `
          })

          await wait()

          expect('#target').toHaveText('new target')
          expect('#hungry').toHaveText('new hungry')

          expect(hungryListener.calls.count()).toBe(1)
          expect(hungryListener.calls.argsFor(0)[0]).toBeEvent('up:fragment:hungry')
          expect(hungryListener.calls.argsFor(0)[0].target).toEqual(jasmine.any(Element))
          expect(hungryListener.calls.argsFor(0)[0].target).toBe(oldHungry)
          expect(hungryListener.calls.argsFor(0)[0].newFragment).toEqual(jasmine.any(Element))
          expect(hungryListener.calls.argsFor(0)[0].newFragment.id).toBe('hungry')
          expect(hungryListener.calls.argsFor(0)[0].newFragment).toHaveText('new hungry')
          expect(hungryListener.calls.argsFor(0)[0].renderOptions).toEqual(jasmine.objectContaining({
            target: '#target',
            scroll: '#target',
            abort: 'all',
          }))
        })

        it('does not update the element if up:fragment:hungry is prevented', async function() {
          fixture('#hungry[up-hungry]', { text: 'old hungry' })
          fixture('#target', { text: 'old target' })

          const hungryListener = jasmine.createSpy('up:fragment:hungry listener').and.callFake((event) => event.preventDefault())
          up.on('up:fragment:hungry', hungryListener)

          up.render({
            target: '#target',
            document: `
              <div id="hungry" up-hungry>new hungry</div>
              <div id="target">new target</div>
          ` })

          await wait()

          expect(hungryListener).toHaveBeenCalled()

          expect('#target').toHaveText('new target')
          expect('#hungry').toHaveText('old hungry')
        })

        it("parses an up:fragment:hungry listener from the hungry element's [up-on-hungry] attribute", async function() {
          window.attributeListener = jasmine.createSpy('attribute listener')
          const oldHungry = fixture('#hungry[up-hungry]', { text: 'old hungry', 'up-on-hungry': 'nonce-specs-nonce window.attributeListener(event, newFragment)' })
          fixture('#target', { text: 'old target' })


          up.render({
            target: '#target',
            document: `
              <div id="hungry" up-hungry>new hungry</div>
              <div id="target">new target</div>\
            `
          })

          await wait()

          expect('#target').toHaveText('new target')
          expect('#hungry').toHaveText('new hungry')

          expect(window.attributeListener.calls.count()).toBe(1)
          expect(window.attributeListener.calls.argsFor(0)[0]).toBeEvent('up:fragment:hungry')
          expect(window.attributeListener.calls.argsFor(0)[1]).toEqual(jasmine.any(Element))
          expect(window.attributeListener.calls.argsFor(0)[1]).toHaveText('new hungry')
          delete window.attributeListener
        })

        it('does not update the element if an [up-on-hungry] attribute prevents the event', async function() {
          fixture('#hungry[up-hungry]', { text: 'old hungry', 'up-on-hungry': 'nonce-specs-nonce event.preventDefault()' })
          fixture('#target', { text: 'old target' })

          up.render({
            target: '#target',
            document: `
              <div id="hungry" up-hungry>new hungry</div>
              <div id="target">new target</div>\
            `
          })

          await wait()

          expect('#target').toHaveText('new target')
          expect('#hungry').toHaveText('old hungry')
        })
      })
    })

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

    describe('[up-poll]', function() {

      it('reloads the element periodically', async function() {
        const interval = 150
        const timingTolerance = interval / 3
        up.radio.config.pollInterval = interval

        const element = up.hello(fixture('.element[up-poll]', { text: 'old text' }))

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

        up.hello(fixture('.element[up-poll=true]', { text: 'old text' }))

        await wait(timingTolerance)

        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(interval)

        expect(jasmine.Ajax.requests.count()).toBe(1)
      })

      it('does not reload an element with [up-poll=false]', async function() {
        up.hello(fixture('.element[up-poll=false][up-interval=50][up-source="/source-path"]', { text: 'old text' }))

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

        up.hello(fixture('.element[up-poll]'))

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
        up.hello(fixture('.element[up-poll][up-source="/source"]'))

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
        up.hello(fixture('.element[up-poll][up-source="/source"]'))

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
        up.radio.config.pollInterval = 100
        const reloadSpy = spyOn(up, 'reload').and.callFake(() => Promise.reject(new up.Error('mocked network error')))

        up.hello(fixture('.element[up-poll]'))

        await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
          await wait(125)

          expect(reloadSpy.calls.count()).toBe(1)
          expect(globalErrorSpy.calls.count()).toBe(1)

          await wait(100)

          expect(reloadSpy.calls.count()).toBe(2)
          expect(globalErrorSpy.calls.count()).toBe(2)
        })
      })

      describe('when the server responds with an error status', function() {

        it('tries again after the next interval', async function() {
          up.radio.config.pollInterval = 250

          up.hello(fixture('.element[up-poll][up-source="/source"]'))

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

          up.hello(fixture('.element[up-poll][up-source="/source"]', { text: 'original text' }))

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

          up.hello(fixture('.element[up-poll][up-source="/source"][up-fail="false"]', { text: 'original text' }))

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

        up.hello(fixture('.element[up-poll]'))

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

        const element = up.hello(fixture('.element[up-poll]'))

        await wait(125)
        expect(reloadSpy.calls.count()).toBe(1)
        up.destroy(element)

        await wait(75)
        expect(reloadSpy.calls.count()).toBe(1)
      })

      it('stops polling when the element is detached by an external script', async function() {
        up.radio.config.pollInterval = 75
        const reloadSpy = spyOn(up, 'reload').and.callFake(() => Promise.resolve(new up.RenderResult()))

        const element = up.hello(fixture('.element[up-poll]'))

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

        const element = up.hello(fixture('.element[up-poll]', { text: 'old text' }))

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

        const element = up.hello(fixture('.element[up-poll]', { text: 'old text' }))

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
        const element = up.hello(fixture('.element[up-poll]'))

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

        up.hello(fixture('.element[up-poll][up-interval=80]'))

        await wait(30)
        expect(reloadSpy).not.toHaveBeenCalled()

        await wait(90)
        expect(reloadSpy).toHaveBeenCalled()
      })

      it('pauses polling when an up:fragment:poll event is prevented', async function() {
        let interval
        up.radio.config.pollInterval = (interval = 70)
        const timingTolerance = 20

        up.hello(fixture('.element[up-poll]'))
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

        up.hello(fixture('.element[up-poll][up-href="/path"]'))

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

        up.hello(fixture('div[up-poll][up-interval=30]', { text: 'old text' }))

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
          up.hello(fixture('.element[up-poll][up-source="/optimized-path"][up-interval=2]'))

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
          up.hello(fixture('.element[up-poll][up-source="/up-source-path"][up-href="/up-href-path"][up-interval=2]'))

          await wait(29)

          expect(jasmine.lastRequest().url).toMatchURL('/up-href-path')
        })

        it('lets the server change the [up-source] between reloads (bugfix)', async function() {
          let interval
          up.radio.config.pollInterval = (interval = 150)
          const timingTolerance = interval / 3

          up.hello(fixture('.element[up-poll][up-source="/one"]', { text: 'old text' }))

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


      describe('with [up-preview]', function() {
        it('shows a preview while the fragment is reloading', async function() {
          const interval = 60
          const timingTolerance = 60
          up.radio.config.pollInterval = interval

          const previewUndo = jasmine.createSpy('preview undo')
          const previewApply = jasmine.createSpy('preview apply').and.returnValue(previewUndo)
          up.preview('my:polling:preview', previewApply)

          const element = up.hello(fixture('.element[up-poll][up-preview="my:polling:preview"]', { text: 'old text' }))

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

          const element = up.hello(fixture('.element[up-poll][up-placeholder="<span>placeholder text</span>"]', { text: 'old text' }))
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
