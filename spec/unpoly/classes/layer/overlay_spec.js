const u = up.util
const e = up.element

describe('up.Layer.Overlay', function() {

  beforeEach(function() {
    up.motion.config.enabled = false
  })

  describe('#accept()', function() {

    it('closes this layer', function() {
      const modes = () => u.map(up.layer.stack, 'mode')

      makeLayers(2)
      expect(modes()).toEqual(['root', 'modal'])

      up.layer.accept(null, { animation: false })

      expect(modes()).toEqual(['root'])
    })

    it('removes the layer elements', async function() {
      await up.layer.open({ fragment: '<div id="content"></div>' })

      let overallContainer = document.querySelector('up-modal')
      let contentContainer = overallContainer.querySelector('up-modal-content')
      let contentElement = contentContainer.querySelector('#content')

      expect(overallContainer).toBeAttached()
      expect(contentContainer).toBeAttached()
      expect(contentElement).toBeAttached()

      await up.layer.accept()

      expect(overallContainer).toBeDetached()
      expect(contentContainer).toBeDetached()
      expect(contentElement).toBeDetached()
    })

    it('dismiss descendants before closing this layer', function() {
      const listener = jasmine.createSpy('layer close listener')
      up.on('up:layer:accepted up:layer:dismissed', listener)

      makeLayers(4)

      this.layers = u.copy(up.layer.stack)
      up.layer.get(1).accept()

      expect(listener.calls.count()).toBe(3)
      expect(listener.calls.argsFor(0)[0]).toBeEvent('up:layer:dismissed', { layer: this.layers[3] })
      expect(listener.calls.argsFor(1)[0]).toBeEvent('up:layer:dismissed', { layer: this.layers[2] })
      expect(listener.calls.argsFor(2)[0]).toBeEvent('up:layer:accepted', { layer: this.layers[1] })
    })

    it('throws an AbortError is the layer is already closing, but is still playing its closing animation', async function() {
      up.motion.config.enabled = true
      let overlay = await up.layer.open()
      let doAccept = () => overlay.accept(null, { animation: 'fade-out', duration: 1000})
      expect(doAccept).not.toThrowError()

      expect(document).toHaveSelector('up-modal.up-destroying')

      expect(doAccept).toThrowError(up.Aborted)
      await wait()
      expect(doAccept).toThrowError(up.Aborted)
    })

    it('throws an AbortError is the layer has already been closed and removed from the DOM', async function() {
      let overlay = await up.layer.open()
      let doAccept = () => overlay.accept(null, { animation: false })
      expect(doAccept).not.toThrowError()
      await wait()

      expect(document).not.toHaveSelector('up-modal')

      expect(doAccept).toThrowError(up.Aborted)
    })

    it('aborts pending requests for this layer', async function() {
      const abortedURLs = []
      up.on('up:request:aborted', (event) => abortedURLs.push(event.request.url))

      makeLayers(2)

      const promise = up.render('.element', { url: '/layer-url', layer: 'current' })

      await wait()

      up.layer.accept()

      await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Aborted))

      expect(abortedURLs.length).toBe(1)
      expect(abortedURLs[0]).toMatchURL('/layer-url')
    })

    it('does not abort a pending request for another layer', async function() {
      const abortedURLs = []
      up.on('up:request:aborted', (event) => abortedURLs.push(event.request.url))

      makeLayers(2)

      up.render('.element', { url: '/root-url', layer: 'root', peel: false })

      await wait()

      up.layer.current.accept()

      expect(abortedURLs).toBeBlank()
    })

    it('takes an acceptance value that is passed to onAccept handlers', function() {
      const onAccept = jasmine.createSpy('onAccept handler')

      makeLayers([
        { },
        { onAccept }
      ])
      expect(onAccept).not.toHaveBeenCalled()

      up.layer.current.accept('acceptance value')

      expect(onAccept).toHaveBeenCalledWith(jasmine.objectContaining({ value: 'acceptance value' }))
    })

    it('does not close the overlay if an onAccept handler prevents the event', function() {
      const onAccept = jasmine.createSpy('onAccept handler').and.callFake((event) => event.preventDefault())
      const onAccepted = jasmine.createSpy('onAccepted handler')

      makeLayers([
        { },
        { onAccept, onAccepted }
      ])
      expect(onAccept).not.toHaveBeenCalled()

      const doAccept = () => up.layer.current.accept('acceptance value')
      expect(doAccept).toThrowError(/prevented/i)

      expect(onAccept).toHaveBeenCalledWith(jasmine.objectContaining({ value: 'acceptance value' }))
      expect(onAccepted).not.toHaveBeenCalled()
      expect(up.layer.isOverlay()).toBe(true)
    })

    it('still closes the overlay if an onAccept handler crashes', async function() {
      const acceptError = new Error('errror in onAccept handler')
      const onAccept = jasmine.createSpy('onAccept handler').and.throwError(acceptError)
      const onAccepted = jasmine.createSpy('onAccepted handler')

      makeLayers([
        { },
        { onAccept, onAccepted }
      ])
      expect(onAccept).not.toHaveBeenCalled()
      expect(onAccepted).not.toHaveBeenCalled()

      await jasmine.expectGlobalError(acceptError, () => up.layer.current.accept('acceptance value'))

      expect(onAccept).toHaveBeenCalled()
      expect(onAccepted).toHaveBeenCalled()
      expect(up.layer.isRoot()).toBe(true)
      expect(document).not.toHaveSelector('up-modal')
    })

    it('takes an acceptance value that is passed to onAccepted handlers', function() {
      const onAccepted = jasmine.createSpy('onAccepted handler')

      makeLayers([
        { },
        { onAccepted }
      ])
      expect(onAccepted).not.toHaveBeenCalled()

      up.layer.current.accept('acceptance value')

      expect(onAccepted).toHaveBeenCalledWith(jasmine.objectContaining({ value: 'acceptance value' }))
    })

    it('focuses the link that originally opened the overlay', async function() {
      const opener = fixture('a[up-target=".element"][up-layer="new"][href="/overlay-path"]')

      Trigger.clickSequence(opener)

      await wait()

      jasmine.respondWithSelector('.element', { text: 'text' })

      await wait()

      expect(up.layer.count).toBe(2)
      expect(opener).not.toBeFocused()

      up.layer.current.accept()

      await wait()

      expect(opener).toBeFocused()
    })

    it('pops this layer from the stack synchronously to prevent race conditions', function() {
      makeLayers(2)

      expect(up.layer.count).toBe(2)
      up.layer.current.accept()
      expect(up.layer.count).toBe(1)
    })

    it("restores the parent layer's location", function() {
      up.history.config.enabled = true

      up.layer.open({
        target: '.element',
        location: '/path/to/modal',
        content: 'element text',
        history: true
      })

      expect(up.layer.isOverlay()).toBe(true)
      expect(location.href).toMatchURL('/path/to/modal')
      expect(up.layer.current.location).toMatchURL('/path/to/modal')

      up.layer.current.accept()

      expect(up.layer.isRoot()).toBe(true)
      expect(location.href).toMatchURL(jasmine.locationBeforeExample)
    })

    it("restores the parent layer's title", async function() {
      up.history.config.enabled = true

      document.title = "Root title"

      up.layer.open({
        target: '.element',
        location: '/path/to/modal',
        history: true,
        document: `
          <html>
            <head>
              <title>Overlay title</title>
            </head>
            <body>
              <div class='element'>
                overlay text
              </div>
            </body>
          </html>
        `
      })

      await wait()

      expect(up.layer.isOverlay()).toBe(true)
      expect(document.title).toBe('Overlay title')

      up.layer.current.accept()

      await wait()

      expect(up.layer.isRoot()).toBe(true)
      expect(document.title).toBe('Root title')
    })

    it("restores the parent layer's title if document.title was changed while the overlay was open (bugfix)", async function() {
      up.history.config.enabled = true

      document.title = "Root title"

      up.layer.open({
        target: '.element',
        location: '/path/to/modal',
        history: true,
        document: `
          <html>
            <head>
              <title>Overlay title</title>
            </head>
            <body>
              <div class='element'>
                overlay text
              </div>
            </body>
          </html>
        `
      })

      await wait()

      expect(up.layer.isOverlay()).toBe(true)
      expect(document.title).toBe('Overlay title')

      document.title = "Manually changed title"

      up.layer.current.accept()

      await wait()

      expect(up.layer.isRoot()).toBe(true)
      expect(document.title).toBe('Root title')
    })

    it("restores the parent layer's title if the overlay was opened with { title } option and document.title was changed while the overlay was open (bugfix)", async function() {
      up.history.config.enabled = true

      document.title = "Root title"

      up.layer.open({
        location: '/path/to/modal',
        history: true,
        title: 'Overlay title',
        fragment: `
          <div class='element'>
            overlay text
          </div>
        `
      })

      await wait()

      expect(up.layer.isOverlay()).toBe(true)
      expect(document.title).toBe('Overlay title')

      document.title = "Manually changed title"

      up.layer.current.accept()

      await wait()

      expect(up.layer.isRoot()).toBe(true)
      expect(document.title).toBe('Root title')
    })

    it("restores the parent layer's meta tags", async function() {
      up.history.config.enabled = true

      fixture(document.head, 'meta[name="description"][content="old description"]')

      up.layer.open({
        location: '/modal-location',
        history: true,
        target: '.element',
        document: `
          <html>
            <head>
              <link rel='canonical' href='/new-canonical'>
              <meta name='description' content='new description'>
            </head>
            <body>
              <div class='element'>
                overlay text
              </div>
            </body>
          </html>
        `
      })

      await wait()

      expect(up.layer.isOverlay()).toBe(true)
      expect(up.layer.history).toBe(true)
      expect(document.head).not.toHaveSelector('meta[name="description"][content="old description"]')
      expect(document.head).toHaveSelector('meta[name="description"][content="new description"]')

      up.layer.current.accept()

      await wait()

      expect(document.head).not.toHaveSelector('meta[name="description"][content="new description"]')
      expect(document.head).toHaveSelector('meta[name="description"][content="old description"]')
    })

    it("restores the parent layer's html[lang] attribute", async function() {
      up.history.config.enabled = true
      document.documentElement.setAttribute('lang', 'it')

      up.layer.open({
        location: '/modal-location',
        history: true,
        target: '.element',
        document: `
          <html lang='fr'>
            <body>
              <div class='element'>
                overlay text
              </div>
            </body>
          </html>
        `
      })

      await wait()

      expect(up.layer.isOverlay()).toBe(true)
      expect(up.layer.history).toBe(true)
      expect(document.documentElement).toHaveAttribute('lang', 'fr')

      up.layer.current.accept()

      await wait()

      expect(document.documentElement).toHaveAttribute('lang', 'it')
    })

    it("does not restore the parent layer's location if the parent layer does not render history", function() {
      up.history.config.enabled = true

      makeLayers([
        { },
        { history: false, location: '/overlay1' },
        { history: true, location: '/overlay2' }
      ])

      expect(up.layer.current.index).toBe(2)
      expect(location.href).toMatchURL(jasmine.locationBeforeExample)

      up.layer.current.accept()

      expect(up.layer.current.index).toBe(1)
      expect(location.href).toMatchURL(jasmine.locationBeforeExample)

      up.layer.current.accept()

      expect(up.layer.current.index).toBe(0)
      expect(location.href).toMatchURL(jasmine.locationBeforeExample)
    })

    it('manipulates the layer stack synchronously, to avoid concurrency issues when we need to close layers within another change', function() {
      makeLayers(2)
      expect(up.layer.count).toBe(2)

      up.layer.current.accept()

      expect(up.layer.count).toBe(1)
    })

    it('uses the configured close animation', async function() {
      up.motion.config.enabled = true
      up.layer.config.modal.openAnimation = 'none'
      up.layer.config.modal.closeAnimation = 'fade-out'
      up.layer.config.modal.closeDuration = 600

      up.layer.open({ mode: 'modal' })
      await wait()

      up.layer.current.accept()

      await wait(300)

      expect(document).toHaveSelector('up-modal')
      expect('up-modal-box').toHaveOpacity(0.5, 0.4)

      await wait(600)
      expect(document).not.toHaveSelector('up-modal')
    })

    it("uses the overlay instance's close duration when the global animation duration has been set to zero (bugfix)", async function() {
      up.motion.config.enabled = true
      up.motion.config.duration = 0

      up.layer.open({ mode: 'modal', openAnimation: 'none', closeAnimation: 'fade-out', closeDuration: 600 })
      await wait()

      up.layer.current.accept()

      await wait(300)

      expect(document).toHaveSelector('up-modal')
      expect('up-modal-box').toHaveOpacity(0.5, 0.4)

      await wait(600)
      expect(document).not.toHaveSelector('up-modal')
    })

    describe('with { onFinished } option', function() {

      it('runs the callback when the close animation has concluded', async function() {
        const onFinished = jasmine.createSpy('onFinished callback')

        up.motion.config.enabled = true
        up.layer.config.modal.openAnimation = 'none'
        up.layer.config.modal.closeAnimation = 'fade-out'
        up.layer.config.modal.closeDuration = 600

        await up.layer.open({ mode: 'modal' })

        up.layer.current.accept(null, { onFinished })

        await wait(300)

        expect(document).toHaveSelector('up-modal')
        expect(onFinished).not.toHaveBeenCalled()

        await wait(600)
        expect(document).not.toHaveSelector('up-modal')
        expect(onFinished).toHaveBeenCalled()
      })

      it('runs the callback when not animating', async function() {
        await up.layer.open({ mode: 'modal', animation: false })

        const onFinished = jasmine.createSpy('onFinished callback')
        up.layer.current.accept(null, { onFinished, animation: false })
        await wait()

        expect(document).not.toHaveSelector('up-modal')
        expect(onFinished).toHaveBeenCalled()
      })
      
    })

    describe('destructors', function() {

      it('runs destructors for the old overlay content', async function() {
        const destructor = jasmine.createSpy('destructor')
        const compiler = jasmine.createSpy('compiler').and.returnValue(destructor)
        up.compiler('.overlay-element', compiler)

        await up.layer.open({ fragment: '<div class="overlay-element"></div>', mode: 'modal' })

        const overlayElement = up.fragment.get('.overlay-element', { layer: 'overlay' })
        expect(overlayElement).toBeAttached()

        expect(compiler).toHaveBeenCalledWith(overlayElement, jasmine.anything(), jasmine.anything())

        await up.layer.accept()
        expect(overlayElement).toBeDetached()

        expect(destructor).toHaveBeenCalledWith(overlayElement)
      })

      it('runs destructors for the overlay container, so users can e.g. set a compiler on an <up-modal>', async function() {
        const destructor = jasmine.createSpy('destructor')
        const compiler = jasmine.createSpy('compiler').and.returnValue(destructor)
        up.compiler('up-modal', compiler)

        await up.layer.open({ fragment: '<div class="overlay-element"></div>', mode: 'modal' })

        const modalContainer = up.fragment.get('up-modal', { layer: 'overlay' })
        expect(modalContainer).toBeAttached()

        expect(compiler).toHaveBeenCalledWith(modalContainer, jasmine.anything(), jasmine.anything())

        await up.layer.accept()
        expect(modalContainer).toBeDetached()

        expect(destructor).toHaveBeenCalledWith(modalContainer)
      })

      it('runs destructors while the layer stack still contains the overlay', async function() {
        const stackSpy = jasmine.createSpy('layer spy')
        up.compiler('.overlay-element', function() {
          return () => {
            // Spy on a copy of the current state, not the stack reference which is always live
            stackSpy([...up.layer.stack])
          }
        })

        await up.layer.open({ fragment: '<div class="overlay-element"></div>', mode: 'modal' })

        expect(up.layer.current).toBeOverlay()
        let modalLayer = up.layer.current

        expect(stackSpy).not.toHaveBeenCalled()

        await up.layer.accept()

        expect(stackSpy).toHaveBeenCalledWith([up.layer.root, modalLayer])
      })

      it('runs destructors while up.layer.current still points to the destroying overlay', async function() {
        const currentLayerSpy = jasmine.createSpy('current layer spy')
        up.compiler('.overlay-element', function() {
          return () => {
            // Spy on a copy of the current state, not the stack reference which is always live
            currentLayerSpy(up.layer.current)
          }
        })

        await up.layer.open({ fragment: '<div class="overlay-element"></div>', mode: 'modal' })

        expect(up.layer.current).toBeOverlay()
        let modalLayer = up.layer.current

        expect(currentLayerSpy).not.toHaveBeenCalled()

        await up.layer.accept()

        expect(currentLayerSpy).toHaveBeenCalledWith(modalLayer)
      })

      it('allows destructors to query fragments within the destroying overlay (bugfix)', async function() {
        const lookupSpy = jasmine.createSpy('layer spy')
        up.compiler('.overlay-element', function() {
          return () => {
            lookupSpy(up.fragment.get('.overlay-element', { destroying: true }))
          }
        })

        await up.layer.open({ fragment: '<div class="overlay-element"></div>', mode: 'modal' })

        expect(up.layer.current).toBeOverlay()
        expect(lookupSpy).not.toHaveBeenCalled()

        await up.layer.accept()

        expect(lookupSpy).toHaveBeenCalledWith(jasmine.any(Element))
      })

      it('allows destructors to look up the layer of the destroying overlay (bugfix)', async function() {
        const lookupSpy = jasmine.createSpy('layer spy')
        up.compiler('.overlay-element', function(element) {
          return () => {
            lookupSpy(up.layer.get(element))
          }
        })

        let modalOverlay = await up.layer.open({ fragment: '<div class="overlay-element"></div>', mode: 'modal' })

        expect(up.layer.current).toBeOverlay()
        expect(lookupSpy).not.toHaveBeenCalled()

        await up.layer.accept()

        expect(lookupSpy).toHaveBeenCalledWith(modalOverlay)
      })

      it('runs destructors while the browser location is still on the overlay location', async function() {
        up.history.config.enabled = true

        up.history.replace('/root-location')

        const locationSpy = jasmine.createSpy('layer spy')
        up.compiler('.overlay-element', function() {
          return () => { locationSpy(location.href) }
        })

        await up.layer.open({ fragment: '<div class="overlay-element"></div>', mode: 'modal', history: true, location: '/modal-location' })

        expect(location.href).toMatchURL('/modal-location')
        expect(locationSpy).not.toHaveBeenCalled()

        await up.layer.accept()

        expect(locationSpy).toHaveBeenCalled()
        expect(locationSpy.calls.argsFor(0)[0]).toMatchURL('/modal-location')
      })

      describe('when a destructor crashes', function() {

        it('still closes the overlay', async function() {
          const destroyError = new Error('error from destructor')
          up.compiler('.overlay-element', () => (function() { throw destroyError }))

          up.layer.open({ fragment: '<div class="overlay-element"></div>', mode: 'modal' })

          expect(up.layer.isOverlay()).toBe(true)

          await jasmine.expectGlobalError(destroyError, () => up.layer.accept())

          expect(up.layer.isOverlay()).toBe(false)
          // Check that an half-completed change does not leave elements in the DOM.
          expect(document).not.toHaveSelector('up-modal')
        })

        it('still emits an up:layer:accepted event', async function() {
          const acceptedListener = jasmine.createSpy('listener to up:layer:accepted')
          up.on('up:layer:accepted', acceptedListener)

          const destroyError = new Error('error from destructor')
          up.compiler('.overlay-element', () => (function() { throw destroyError }))

          up.layer.open({ fragment: '<div class="overlay-element"></div>', mode: 'modal' })

          await jasmine.expectGlobalError(destroyError, () => up.layer.accept())

          expect(acceptedListener).toHaveBeenCalled()
        })

        if (up.specUtil.rootHasReducedWidthFromScrollbar()) {
          it('still restores document scroll bars', async function() {
            const overflowElement = up.specUtil.documentOverflowElement()
            const getOverflowY = () => getComputedStyle(overflowElement).overflowY

            const destroyError = new Error('error from destructor')
            up.compiler('.overlay-element', () => (function() { throw destroyError }))

            await up.layer.open({ fragment: '<div class="overlay-element"></div>', mode: 'modal' })

            await wait()

            expect(['clip', 'hidden'].includes(getOverflowY())).toBe(true)

            await jasmine.expectGlobalError(destroyError, () => up.layer.accept())

            expect(['clip', 'hidden'].includes(getOverflowY())).toBe(false)
          })
        }
      })

    })

    describe('with { response } option', function() {

      it('makes the response available to { onAccept } listeners', async function() {
        const onAccept = jasmine.createSpy('listener')
        const response = new up.Response()

        up.layer.open({ mode: 'modal', onAccept })

        expect(up.layer.mode).toBe('modal')

        up.layer.current.accept('value', { response })

        await wait()

        expect(onAccept).toHaveBeenCalledWith(jasmine.objectContaining({ value: 'value', response }))
      })

      it('makes the response available to { onAccepted } listeners', async function() {
        const onAccepted = jasmine.createSpy('listener')
        const response = new up.Response()

        up.layer.open({ mode: 'modal', onAccepted })

        expect(up.layer.mode).toBe('modal')

        up.layer.current.accept('value', { response })

        await wait()

        expect(onAccepted).toHaveBeenCalledWith(jasmine.objectContaining({ value: 'value', response }))
      })
    })

    describe('events', function() {

      it('emits an up:layer:accept event with the acceptance value')

      it('emits an up:layer:accepted event with the acceptance value', function(done) {
        makeLayers(2)
        expect(up.layer.count).toBe(2)

        up.on('up:layer:accepted', function(event) {
          expect(up.layer.count).toBe(1)
          expect(event.value).toBe('value')
          expect(up.layer.current).toBe(up.layer.root)
          done()
        })

        up.layer.current.accept('value')
      })

      it('lets an up:layer:accept event handler mutate the acceptance value')

      it('lets an up:layer:accept event handler replace the acceptance value', function() {
        makeLayers(2)
        expect(up.layer.count).toBe(2)

        const acceptListener = (event) => event.value = 'replaced'
        const acceptedListener = jasmine.createSpy('up:layer:accepted listener')

        up.layer.current.on('up:layer:accept', acceptListener)
        up.layer.current.on('up:layer:accepted', acceptedListener)

        up.layer.current.accept('original')

        expect(acceptedListener).toHaveBeenCalled()
        expect(acceptedListener.calls.argsFor(0)[0].value).toBe('replaced')
      })

      it('lets an up:layer:accept event handler cancel the acceptance and throws an AbortError', function() {
        makeLayers(2)
        expect(up.layer.count).toBe(2)

        up.layer.current.on('up:layer:accept', (event) => event.preventDefault())

        const accept = () => up.layer.current.accept()

        expect(accept).toAbort()

        expect(up.layer.count).toBe(2)
      })
    })
  })

  describe('#dismiss()', function() {

    it('closes this layer', function() {
      const modes = () => u.map(up.layer.stack, 'mode')

      makeLayers(2)
      expect(modes()).toEqual(['root', 'modal'])

      up.layer.current.dismiss()

      expect(modes()).toEqual(['root'])
    })

    it('takes a dismissal value that is passed to onDismissed handlers', function() {
      const callback = jasmine.createSpy('onDismissed handler')

      makeLayers([
        { },
        { onDismissed: callback }
      ])
      expect(callback).not.toHaveBeenCalled()

      up.layer.current.dismiss('dismissal value')

      expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value: 'dismissal value' }))
    })
  })

  describe('#isAlive()', function() {

    beforeEach(function() {
      up.motion.config.enabled = true
    })

    it('returns true for an layer in its opening animation', async function() {
      up.layer.open({ content: 'layer content', animation: 'fade-in', duration: 1000 })
      await wait()

      expect(up.layer.current).toBeOverlay()
      expect(up.layer.element.isConnected).toBe(true)
      expect(up.layer.current.isAlive()).toBe(true)
    })

    it('returns true for an opened layer', async function() {
      let overlay = await up.layer.open({ content: 'layer content', animation: false })
      await wait()

      expect(up.layer.current).toBeOverlay()
      expect(overlay.element.isConnected).toBe(true)
      expect(overlay.isAlive()).toBe(true)
    })

    it('returns false for a layer in its closing animation', async function() {
      let overlay = await up.layer.open({ content: 'layer content', animation: false })

      expect(up.layer.current).toBeOverlay()

      up.layer.dismiss(null, { animation: 'fade-out', duration: 1000 })
      await wait()

      expect(up.layer.current).toBeRootLayer()
      expect(overlay.element.isConnected).toBe(true)
      expect(overlay.isAlive()).toBe(false)
    })

    it('returns false for a layer that has been closed and removed from the DOM', async function() {
      let overlay = await up.layer.open({ content: 'layer content', animation: false })

      expect(up.layer.current).toBeOverlay()

      up.layer.dismiss(null, { animation: false })
      await wait()

      expect(up.layer.current).toBeRootLayer()
      expect(overlay.element.isConnected).toBe(false)
      expect(overlay.isAlive()).toBe(false)
    })

  })

  if (up.migrate.loaded) {

    describe('#isOpen()', function() {

      beforeEach(function() {
        up.motion.config.enabled = true
      })

      it('returns true for an layer in its opening animation', async function() {
        up.layer.open({ content: 'layer content', animation: 'fade-in', duration: 1000 })
        await wait()

        expect(up.layer.current).toBeOverlay()
        expect(up.layer.current.isOpen()).toBe(true)
      })

      it('returns true for an opened layer', async function() {
        up.layer.open({ content: 'layer content', animation: false })
        await wait()

        expect(up.layer.current).toBeOverlay()
        expect(up.layer.current.isOpen()).toBe(true)
      })

      it('returns false for a layer in its closing animation', async function() {
        let overlay = await up.layer.open({ content: 'layer content', animation: false })

        expect(up.layer.current).toBeOverlay()

        up.layer.dismiss(null, { animation: 'fade-out', duration: 1000 })
        await wait()

        expect(up.layer.current).toBeRootLayer()
        expect(overlay.isDetached()).toBe(false)
        expect(overlay.isOpen()).toBe(false)
      })

      it('returns false for a layer that has been closed and removed from the DOM', async function() {
        let overlay = await up.layer.open({ content: 'layer content', animation: false })

        expect(up.layer.current).toBeOverlay()

        up.layer.dismiss(null, { animation: false })
        await wait()

        expect(up.layer.current).toBeRootLayer()
        expect(overlay.isDetached()).toBe(true)
        expect(overlay.isOpen()).toBe(false)
      })

    })

    describe('#isClosed()', function() {

      beforeEach(function() {
        up.motion.config.enabled = true
      })

      it('returns false for an layer in its opening animation', async function() {
        up.layer.open({ content: 'layer content', animation: 'fade-in', duration: 1000 })
        await wait()

        expect(up.layer.current).toBeOverlay()
        expect(up.layer.current.isClosed()).toBe(false)
      })

      it('returns false for an opened layer', async function() {
        up.layer.open({ content: 'layer content', animation: false })
        await wait()

        expect(up.layer.current).toBeOverlay()
        expect(up.layer.current.isClosed()).toBe(false)
      })

      it('returns true for a layer in its closing animation', async function() {
        let overlay = await up.layer.open({ content: 'layer content', animation: false })

        expect(up.layer.current).toBeOverlay()

        up.layer.dismiss(null, { animation: 'fade-out', duration: 1000 })
        await wait()

        expect(up.layer.current).toBeRootLayer()
        expect(overlay.isDetached()).toBe(false)
        expect(overlay.isClosed()).toBe(true)
      })

      it('returns true for a layer that has been closed and removed from the DOM', async function() {
        let overlay = await up.layer.open({ content: 'layer content', animation: false })

        expect(up.layer.current).toBeOverlay()

        up.layer.dismiss(null, { animation: false })
        await wait()

        expect(up.layer.current).toBeRootLayer()
        expect(overlay.isDetached()).toBe(true)
        expect(overlay.isClosed()).toBe(true)
      })

    })

  }

  describe('#location', function() {

    beforeEach(function() { up.history.config.enabled = true })

    describe('if the layer is the frontmost layer', function() {

      it('returns the current browser location', function() {
        up.layer.open({ location: '/foo/bar', history: true })
        expect(up.layer.isOverlay()).toBe(true)
        expect(up.layer.location).toEqual('/foo/bar')

        history.replaceState({}, 'title', '/qux')
        expect(up.layer.location).toEqual('/qux')
      })

      it('returns the current browser location with a #hash', function() {
        up.layer.open({ location: '/foo/bar', history: true })
        expect(up.layer.isOverlay()).toBe(true)
        expect(up.layer.location).toEqual('/foo/bar')

        history.replaceState({}, 'title', '/qux#hash')
        expect(up.layer.location).toEqual('/qux#hash')
      })
    })

    describe('for an overlay that does not render history', function() {
      it('returns the location of the last fragment update that rendered history', function() {
        up.layer.open({ content: 'step1', history: false })
        expect(up.layer.isOverlay()).toBe(true)

        up.render({ content: 'step2', history: true, location: '/step2', target: ':layer' })

        expect(up.layer.location).toEqual('/step2')
      })
    })

    describe('for an overlay in the background', function() {

      it("returns the overlay's location", function() {
        const [overlay1, overlay2] = makeLayers([
          { history: true, location: '/overlay1' },
          { history: true, location: '/overlay2' }
        ])

        expect(overlay1.location).toEqual('/overlay1')
        expect(overlay2.location).toEqual('/overlay2')
      })

      it("returns the overlay's location with a #hash", async function() {
        up.layer.open({ url: '/ol1#hash', target: '.target' })

        await wait()

        jasmine.respondWithSelector('.target', { text: 'overlay 1' })

        await wait()

        up.layer.open({ url: '/ol2#hash', target: '.target' })

        await wait()

        jasmine.respondWithSelector('.target', { text: 'overlay 2' })

        await wait()

        expect(up.layer.stack.length).toBe(3)

        expect(up.layer.stack[1].location).toEqual('/ol1#hash')
        expect(up.layer.stack[2].location).toEqual('/ol2#hash')
      })
    })
  })

  describe('focus', function() {

    beforeEach(up.specUtil.assertTabFocused)

    it('cycles focus within the overlay', async function() {
      makeLayers(2)

      this.link1 = up.layer.affix('a[href="/one"]', { text: 'link1' })
      this.link2 = up.layer.affix('a[href="/one"]', { text: 'link2' })

      this.dismisser = up.fragment.get('up-modal-dismiss')

      await wait()

      expect(up.layer.current).toBeFocused()

      Trigger.tabSequence()

      await wait()

      expect(this.link1).toBeFocused()

      Trigger.tabSequence()

      await wait()

      expect(this.link2).toBeFocused()

      Trigger.tabSequence()

      await wait()

      expect(this.dismisser).toBeFocused()

      Trigger.tabSequence()

      await wait()

      expect(up.layer.current).toBeFocused()

      // Focus cycle works reverse, too
      Trigger.tabSequence({ shiftKey: true })

      await wait()

      expect(this.dismisser).toBeFocused()
    })

    it('sets [aria-modal="true"] to declare background elements inert', async function() {
      await up.layer.open()

      expect(up.layer.current).toBeOverlay()
      expect(up.layer.current.getFocusElement()).toHaveAttribute('aria-modal', 'true')
    })

    it('recaptures focus outside the overlay', async function() {
      const rootInput = fixture('input[name=email][type=text]')
      rootInput.focus()
      expect(rootInput).toBeFocused()

      up.layer.open()

      await wait()

      expect(up.layer.isOverlay()).toBe(true)
      expect(up.layer.current).toBeFocused()

      rootInput.focus()

      await wait()

      expect(up.layer.current).toBeFocused()
    })

    describe('within a foreign overlay', function() {
      it('does not trap focus within a foreign overlay', async function() {
        up.layer.config.foreignOverlaySelectors = ['.foreign-overlay']

        const rootInput = fixture('input[name=email][type=text]')
        const foreignOverlay = fixture('.foreign-overlay')
        const foreignInput = e.affix(foreignOverlay, 'input[name=email][type=text]')
        foreignInput.focus()
        expect(foreignInput).toBeFocused()

        up.layer.open()

        await wait()

        expect(up.layer.isOverlay()).toBe(true)

        // Do steal the focus from the foreign overlay, as opening an Unpoly overlay
        // was the most recent user action.
        expect(up.layer.current).toBeFocused()

        foreignInput.focus()

        await wait()

        // See that the focus trap did not capture focus
        expect(foreignInput).toBeFocused()

        rootInput.focus()

        await wait()

        // See that moving from the foreign overlay to another input
        // outside our Unpoly overlay does recapture focus.
        expect(up.layer.current).toBeFocused()
      })
    })

    describe('with { trapFocus: false }', function() {

      it('does not cycle focus within the overlay')

      it('does not recapture focus outside the overlay', async function() {
        const rootInput = fixture('input[name=email][type=text]')
        rootInput.focus()
        expect(rootInput).toBeFocused()

        up.layer.open({ trapFocus: false })
        await wait()

        expect(up.layer.isOverlay()).toBe(true)
        expect(up.layer.current).toBeFocused()

        rootInput.focus()
        await wait()

        expect(rootInput).toBeFocused()
      })

      it('still focuses the overlay when opened', async function() {
        const rootInput = fixture('input[name=email][type=text]')
        rootInput.focus()
        expect(rootInput).toBeFocused()

        up.layer.open({ trapFocus: false })
        await wait()

        expect(up.layer.isOverlay()).toBe(true)
        expect(up.layer.current).toBeFocused()
      })
    })

    it('still sets [role=dialog], but [aria-modal="false"] (as background elements are non-inert)', async function() {
      await up.layer.open({ trapFocus: false })

      expect(up.layer.current).toBeOverlay()
      expect(up.layer.current.getFocusElement()).toHaveAttribute('role', 'dialog')
      expect(up.layer.current.getFocusElement()).toHaveAttribute('aria-modal', 'false')
    })
  })

  describe('label[for] when an input with that ID exists in both overlay and parent layer', function() {

    describe('for an input[type=text]', function() {
      it('focuses the input in the same layer as the label', async function() {
        const form = `
          <form>
            <label for="foo">label</label>
            <input type="text" id="foo">
          </form>
        `

        makeLayers([
          { content: form },
          { content: form }
        ])

        const rootLabel = up.fragment.get('label', { layer: 'root' })
        const rootInput = up.fragment.get('#foo', { layer: 'root' })
        const overlayLabel = up.fragment.get('label', { layer: 'overlay' })
        const overlayInput = up.fragment.get('#foo', { layer: 'overlay' })

        await wait()

        expect(up.layer.isOverlay()).toBe(true)

        Trigger.clickSequence(overlayLabel)
        await wait()

        expect(overlayInput).toBeFocused()

        up.layer.dismiss()
        await wait()

        expect(up.layer.isRoot()).toBe(true)

        Trigger.clickSequence(rootLabel)
        await wait()

        expect(rootInput).toBeFocused()
      })
    })

    describe('for an input[type=checkbox]', function() {
      it('toggles the input in the same layer as the label', async function() {
        const form = `
          <form>
            <label for="foo">label</label>
            <input type="checkbox" id="foo">
          </form>
        `

        makeLayers([
          { content: form },
          { content: form }
        ])

        const rootLabel = up.fragment.get('label', { layer: 'root' })
        const rootInput = up.fragment.get('#foo', { layer: 'root' })
        const overlayLabel = up.fragment.get('label', { layer: 'overlay' })
        const overlayInput = up.fragment.get('#foo', { layer: 'overlay' })

        expect(up.layer.isOverlay()).toBe(true)

        Trigger.clickSequence(overlayLabel)
        expect(overlayInput).toBeFocused()
        expect(overlayInput).toBeChecked()
        expect(rootInput).not.toBeChecked()

        Trigger.clickSequence(overlayLabel)
        expect(overlayInput).toBeFocused()
        expect(overlayInput).not.toBeChecked()

        up.layer.dismiss()

        await wait()

        expect(up.layer.isRoot()).toBe(true)

        Trigger.clickSequence(rootLabel)
        expect(rootInput).toBeFocused()
        expect(rootInput).toBeChecked()

        // Overlay input was not changed
        expect(overlayInput).not.toBeChecked()
      })
    })

    describe('for an input[type=radio]', function() {
      it('selects the input in the same layer as the label', async function() {
        const form = `
          <form>
            <label for="format_pdf">PDF</label>
            <input type="radio" id="format_pdf" name='format' value='pdf'>
            <label for="format_xls">XLS</label>
            <input type="radio" id="format_xls" name='format' value='xls'>
          </form>
        `

        makeLayers([
          { content: form },
          { content: form }
        ])

        const rootLabelPDF = up.fragment.get('label[for=format_pdf]', { layer: 'root' })
        const rootLabelXLS = up.fragment.get('label[for=format_xls]', { layer: 'root' })
        const rootInputPDF = up.fragment.get('#format_pdf', { layer: 'root' })
        const rootInputXLS = up.fragment.get('#format_xls', { layer: 'root' })
        const overlayLabelPDF = up.fragment.get('label[for=format_pdf]', { layer: 'overlay' })
        const overlayLabelXLS = up.fragment.get('label[for=format_xls]', { layer: 'overlay' })
        const overlayInputPDF = up.fragment.get('#format_pdf', { layer: 'overlay' })
        const overlayInputXLS = up.fragment.get('#format_xls', { layer: 'overlay' })

        expect(up.layer.isOverlay()).toBe(true)

        Trigger.clickSequence(overlayLabelPDF)
        expect(overlayInputPDF).toBeFocused()
        expect(overlayInputPDF).toBeChecked()
        expect(overlayInputXLS).not.toBeChecked()
        expect(rootInputPDF).not.toBeChecked()
        expect(rootInputXLS).not.toBeChecked()

        Trigger.clickSequence(overlayLabelXLS)
        expect(overlayInputXLS).toBeFocused()
        expect(overlayInputXLS).toBeChecked()
        expect(overlayInputPDF).not.toBeChecked()
        expect(rootInputPDF).not.toBeChecked()
        expect(rootInputXLS).not.toBeChecked()

        up.layer.dismiss()

        await wait()

        expect(up.layer.isRoot()).toBe(true)

        Trigger.clickSequence(rootLabelPDF)
        expect(rootInputPDF).toBeFocused()
        expect(rootInputPDF).toBeChecked()
        expect(rootInputXLS).not.toBeChecked()

        // Overlay inputs were not changed
        expect(overlayInputPDF).not.toBeChecked()
        expect(overlayInputXLS).toBeChecked()
      })
    })
  })
})
