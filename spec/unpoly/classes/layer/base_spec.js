describe('up.Layer', function() {

  beforeEach(function() {
    up.motion.config.enabled = false
  })

  describe('#context', function() {

    it('stores a per-layer context object', async function() {
      up.layer.root.context.rootKey = 'rootValue'

      const overlay = await up.layer.open({ context: { overlayKey: 'overlayValue' } })

      expect(overlay.context).toEqual({ overlayKey: 'overlayValue' })
      // Show that the root layer's context wasn't changed.
      expect(up.layer.root.context).toEqual({ rootKey: 'rootValue' })
    })

    it('may be mutated by the user', function() {
      up.layer.context.key = 'value'
      expect(up.layer.context.key).toEqual('value')
    })
  })

  describe('#on()', function() {

    it('registers a listener for events on this layer', function() {
      const listener = jasmine.createSpy('event listener')

      makeLayers(2)

      up.layer.on('foo', listener)
      up.emit(up.layer.element, 'foo')

      expect(listener).toHaveBeenCalled()
    })

    it("does not call the listener for events on another layer", function() {
      const listener = jasmine.createSpy('event listener')

      makeLayers(3)

      up.layer.stack[1].on('foo', listener)
      up.emit(up.layer.stack[2].element, 'foo')

      expect(listener).not.toHaveBeenCalled()
    })

    it("does not call the listener for events on another layer, even if the event target is a DOM child of the layer element", function() {
      const listener = jasmine.createSpy('event listener')
      up.layer.root.on('foo', listener)

      makeLayers(2)

      // Note that we're using Element#contains(), not up.Layer#contains()
      expect(up.layer.root.element.contains(up.layer.current.element)).toBe(true)

      up.emit(up.layer.element, 'foo')

      expect(listener).not.toHaveBeenCalled()
    })

    it('allows to pass a selector for event delegation as second argument', async function() {
      const listener = jasmine.createSpy('event listener')

      makeLayers(2)
      await wait()

      up.layer.on('foo', '.two', listener)
      const one = up.layer.affix('.one')
      const two = up.layer.affix('.two')

      up.emit(one, 'foo')
      expect(listener).not.toHaveBeenCalled()

      up.emit(two, 'foo')
      expect(listener).toHaveBeenCalled()
    })

    it('sets up.layer.current to this layer while the listener is running', function() {
      const currentSpy = jasmine.createSpy()

      makeLayers(3)

      expect(up.layer.current).toEqual(up.layer.get(2))

      up.layer.get(1).on('foo', function() {
        currentSpy(up.layer.current)
      })

      up.emit(up.layer.get(1).element, 'foo')

      expect(currentSpy).toHaveBeenCalledWith(up.layer.get(1))
      expect(up.layer.current).toEqual(up.layer.get(2))
    })
  })

  describe('#emit()', function() {

    it("emits an event on this layer's element", function() {
      const targets = []
      up.on('foo', function(event) {
        targets.push(event.target)
      })

      makeLayers(2)

      expect(up.layer.count).toBe(2)

      up.layer.front.emit('foo')
      expect(targets).toEqual([up.layer.front.element])

      up.layer.root.emit('foo')
      expect(targets).toEqual([up.layer.front.element, up.layer.root.element])
    })

    it('sets up.layer.current to this layer while listeners are running', function() {
      let eventLayer = null
      up.on('foo', function(event) {
        eventLayer = up.layer.current
      })

      makeLayers(2)

      expect(up.layer.current).not.toBe(up.layer.root)
      expect(up.layer.current).toBe(up.layer.front)

      up.layer.root.emit('foo')

      expect(eventLayer).not.toBe(up.layer.front)
      expect(eventLayer).toBe(up.layer.root)
    })
  })

  describe('#affix()', function() {

    it("appends an element with the given selector to an overlay's first swappable element", async function() {
      const overlay = await up.layer.open({ fragment: '<main>overlay content</main>' })

      const element = overlay.affix('.klass')

      expect(element).toMatchSelector('.klass')
      expect(element.parentElement).toMatchSelector('main')
      expect(element.parentElement.parentElement).toBe(overlay.getContentElement())
    })

    it('appends an element to the <body> for the root layer', function() {
      const element = up.layer.root.affix('.klass')
      registerFixture(element)

      expect(element.parentElement).toBe(document.body)
    })
  })

  describe('#contains()', function() {

    it('returns whether the given element is in this layer', async function() {
      const [rootElement] = htmlFixtureList('<div id="root-element"></div>')
      const overlay = await up.layer.open({ fragment: '<div id="overlay-element"></div>' })
      const overlayElement = overlay.element.querySelector('#overlay-element')

      expect(up.layer.root.contains(rootElement)).toBe(true)
      expect(up.layer.root.contains(overlayElement)).toBe(false)
      expect(overlay.contains(overlayElement)).toBe(true)
      expect(overlay.contains(rootElement)).toBe(false)
    })

    it("returns false for an element in a descendant overlay that is nested into this layer's element", async function() {
      const [container, opener] = htmlFixtureList(`
        <div up-viewport style="height: 100px; overflow-y: scroll">
          <a href="#" id="opener">open popup</a>
        </div>
      `)
      const popup = await up.layer.open({ mode: 'popup', origin: opener, fragment: '<div id="popup-element"></div>' })
      const popupElement = popup.element.querySelector('#popup-element')

      expect(container).toContain(popup.element)
      expect(up.layer.root.contains(popupElement)).toBe(false)
      expect(popup.contains(popupElement)).toBe(true)
    })

  })

  describe('#peel()', function() {

    // Additional specs can be found for up.render({ peel })

    it('dismisses all descendants', function() {
      let dismissedSpy = jasmine.createSpy('dismiss listener')
      let acceptedSpy = jasmine.createSpy('accept listener')

      up.on('up:layer:dismissed', dismissedSpy)
      up.on('up:layer:accepted', acceptedSpy)

      makeLayers(4)
      expect(up.layer.count).toBe(4)
      const secondLayer = up.layer.get(1)

      secondLayer.peel()

      expect(dismissedSpy.calls.count()).toBe(2)
      expect(acceptedSpy.calls.count()).toBe(0)
      expect(up.layer.count).toBe(2)
    })

    it('closes descendants with a given { animation }', async function() {
      up.motion.config.enabled = true
      await up.layer.open({ openAnimation: false, closeAnimation: 'fade-out', closeDuration: 5 })
      await up.layer.open({ openAnimation: false, closeAnimation: 'fade-out', closeDuration: 5 })
      spyOn(up, 'animate').and.callThrough()

      up.layer.root.peel({ animation: 'move-to-top' })

      expect(up.layer.count).toBe(1)
      // Each overlay box animates with the given animation. Backdrops always fade out.
      expect(up.animate.calls.allArgs().filter((args) => args[1] === 'move-to-top').length).toBe(2)
    })

    describe('close intent', function() {

      it('dismisses descendants with { intent: "dismiss" }', function() {
        let dismissedSpy = jasmine.createSpy('dismiss listener')
        let acceptedSpy = jasmine.createSpy('accept listener')

        up.on('up:layer:dismissed', dismissedSpy)
        up.on('up:layer:accepted', acceptedSpy)

        makeLayers(4)
        expect(up.layer.count).toBe(4)
        const secondLayer = up.layer.get(1)

        secondLayer.peel({ intent: 'dismiss' })

        expect(dismissedSpy.calls.count()).toBe(2)
        expect(acceptedSpy.calls.count()).toBe(0)
        expect(up.layer.count).toBe(2)
      })

      it('accepts descendants with { intent: "accept" }', function() {
        let dismissedSpy = jasmine.createSpy('dismiss listener')
        let acceptedSpy = jasmine.createSpy('accept listener')

        up.on('up:layer:dismissed', dismissedSpy)
        up.on('up:layer:accepted', acceptedSpy)

        makeLayers(4)
        expect(up.layer.count).toBe(4)
        const secondLayer = up.layer.get(1)

        secondLayer.peel({ intent: 'accept' })

        expect(dismissedSpy.calls.count()).toBe(0)
        expect(acceptedSpy.calls.count()).toBe(2)
        expect(up.layer.count).toBe(2)
      })


    })

    describe('close value', function() {

      it('uses a dismissal value :peel', function() {
        const listener = jasmine.createSpy('dismiss listener')
        up.on('up:layer:dismiss', listener)

        makeLayers(2)

        up.layer.root.peel()

        expect(listener.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ value: ':peel' }))
      })

      it('allows to pass a custom { value }', async function() {
        const listener = jasmine.createSpy('dismiss listener')
        up.on('up:layer:dismiss', listener)

        makeLayers(2)

        up.layer.root.peel({ value: 'custom' })

        expect(listener.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ value: 'custom' }))
      })

    })

    describe('when a listener prevents a descendant from closing', function() {

      beforeEach(function() {
        // unpoly-migrate.js defaults to true, which ignores prevented close events when peeling.
        up.layer.config.forcePeel = false
      })

      it('throws an up.Aborted error and keeps the descendant open', function() {
        up.on('up:layer:dismiss', (event) => event.preventDefault())
        const [root, overlay] = makeLayers(2)

        expect(() => root.peel()).toThrowError(up.Aborted, /prevented/i)

        expect(overlay).toBeAlive()
        expect(up.layer.count).toBe(2)
      })

      it('passes a value of ":peel" so listeners can tell a peel apart from other dismissals', function() {
        up.on('up:layer:dismiss', (event) => {
          if (event.value === ':peel') event.preventDefault()
        })
        const [root, overlay] = makeLayers(2)

        expect(() => root.peel()).toThrowError(up.Aborted)
        expect(overlay).toBeAlive()

        overlay.dismiss(':button')
        expect(overlay).not.toBeAlive()
      })

      it('keeps descendants closed that were closed before the blocking descendant', function() {
        const [root, overlay1, overlay2, overlay3] = makeLayers(4)
        overlay1.on('up:layer:dismiss', (event) => event.preventDefault())

        expect(() => root.peel()).toThrowError(up.Aborted)

        expect(overlay3).not.toBeAlive()
        expect(overlay2).not.toBeAlive()
        expect(overlay1).toBeAlive()
        expect(up.layer.count).toBe(2)
      })

      it('closes the descendant with { force: true }', function() {
        const dismissListener = jasmine.createSpy('up:layer:dismiss listener').and.callFake((event) => event.preventDefault())
        up.on('up:layer:dismiss', dismissListener)
        const [root, overlay] = makeLayers(2)

        root.peel({ force: true })

        expect(dismissListener).toHaveBeenCalled()
        expect(dismissListener.calls.argsFor(0)[0].force).toBe(true)
        expect(overlay).not.toBeAlive()
        expect(up.layer.count).toBe(1)
      })

      it('accepts the descendant with { intent: "accept", force: true }', function() {
        up.on('up:layer:accept', (event) => event.preventDefault())
        const acceptedListener = jasmine.createSpy('up:layer:accepted listener')
        up.on('up:layer:accepted', acceptedListener)
        const [root, overlay] = makeLayers(2)

        root.peel({ intent: 'accept', force: true })

        expect(acceptedListener).toHaveBeenCalled()
        expect(overlay).not.toBeAlive()
      })

    })

    describe('when a destructor throws an error', function() {
      it('still dismisses all descendants', async function() {
        const destroyError = new Error('error from destructor')

        up.compiler('.overlay-element', function() {
          return () => { throw destroyError }
        })

        up.layer.open({ fragment: '<div class="overlay-element"></div>' })
        up.layer.open({ fragment: '<div class="overlay-element"></div>' })

        expect(up.layer.count).toBe(3)

        await jasmine.expectGlobalError(destroyError, function() {
          up.layer.root.peel()
        })

        expect(up.layer.count).toBe(1)
      })
    })

    describe('with up.layer.config.forcePeel', function() {

      if (up.migrate.loaded) {
        it('defaults to true with unpoly-migrate.js', function() {
          expect(up.layer.config.forcePeel).toBe(true)
        })
      } else {
        it('defaults to false', function() {
          expect(up.layer.config.forcePeel).toBe(false)
        })
      }

      it('lets an up:layer:dismiss listener keep an overlay open when peeling with false', function() {
        up.layer.config.forcePeel = false
        up.on('up:layer:dismiss', (event) => event.preventDefault())
        const [root, overlay] = makeLayers(2)

        expect(() => root.peel()).toThrowError(up.Aborted)

        expect(overlay).toBeAlive()
      })

      it('closes an overlay when peeling with true, even if an up:layer:dismiss listener prevents it', function() {
        up.layer.config.forcePeel = true
        const dismissListener = jasmine.createSpy('up:layer:dismiss listener').and.callFake((event) => event.preventDefault())
        up.on('up:layer:dismiss', dismissListener)
        const [root, overlay] = makeLayers(2)

        root.peel()

        expect(dismissListener).toHaveBeenCalled()
        expect(dismissListener.calls.argsFor(0)[0].force).toBe(true)
        expect(overlay).not.toBeAlive()
        expect(up.layer.count).toBe(1)
      })

      it('closes an overlay with true when a link without force sets [up-peel], even if an up:layer:dismiss listener prevents it', async function() {
        up.layer.config.forcePeel = true
        up.on('up:layer:dismiss', (event) => event.preventDefault())
        makeLayers([
          { target: '.element', content: 'old text in root' },
          { target: '.element', content: 'old text in overlay' },
        ])

        const [link] = htmlFixtureList('<a href="/path" up-target=".element" up-layer="root" up-peel="dismiss">link</a>')
        up.layer.current.getContentElement().append(link)

        Trigger.clickSequence(link)
        await wait()

        jasmine.respondWithSelector('.element', { text: 'new text' })
        await wait()

        expect(up.layer.count).toBe(1)
        expect(up.layer.root).toHaveText(/new text/)
      })

      if (up.migrate.loaded) {
        describe('unpoly-migrate.js', function() {

          it('warns when a listener prevents peeling while the setting has not been configured', function() {
            const warnSpy = up.migrate.warn.mock()
            up.on('up:layer:dismiss', (event) => event.preventDefault())
            const [root, overlay] = makeLayers(2)

            root.peel()

            expect(overlay).not.toBeAlive()
            expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('up.layer.config.forcePeel'))
          })

          it('does not warn when a listener prevents another kind of dismissal', function() {
            const warnSpy = up.migrate.warn.mock()
            up.on('up:layer:dismiss', (event) => event.preventDefault())
            const [_root, overlay] = makeLayers(2)

            expect(() => overlay.dismiss()).toThrowError(up.Aborted)

            expect(warnSpy).not.toHaveBeenCalled()
          })

          it('does not warn after the setting was configured to true', function() {
            up.layer.config.forcePeel = true
            const warnSpy = up.migrate.warn.mock()
            up.on('up:layer:dismiss', (event) => event.preventDefault())
            const [root, overlay] = makeLayers(2)

            root.peel()

            expect(overlay).not.toBeAlive()
            expect(warnSpy).not.toHaveBeenCalled()
          })

          it('does not warn after the setting was configured to false', function() {
            up.layer.config.forcePeel = false
            const warnSpy = up.migrate.warn.mock()
            up.on('up:layer:dismiss', (event) => event.preventDefault())
            const [root, overlay] = makeLayers(2)

            expect(() => root.peel()).toThrowError(up.Aborted)

            expect(overlay).toBeAlive()
            expect(warnSpy).not.toHaveBeenCalled()
          })

        })
      }

    })

  })
})
