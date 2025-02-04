describe('up.Layer', function() {

  beforeEach(function() {
    up.motion.config.enabled = false
  })

  describe('#context', function() {

    it('stores a per-layer context object', async function() {
      up.layer.root.context.rootKey = 'rootValue'

      const overlay = await up.layer.open({context: { overlayKey: 'overlayValue' }})

      expect(overlay.context).toEqual({overlayKey: 'overlayValue'})
      // Show that the root layer's context wasn't changed.
      expect(up.layer.root.context).toEqual({rootKey: 'rootValue'})
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

  describe('#peel()', function() {

    it('dismisses all descendants', function() {
      makeLayers(4)
      expect(up.layer.count).toBe(4)
      const secondLayer = up.layer.get(1)

      secondLayer.peel()

      expect(up.layer.count).toBe(2)
    })

    it('uses a dismissal value :peel', function() {
      const listener = jasmine.createSpy('dismiss listener')
      up.on('up:layer:dismiss', listener)

      makeLayers(2)

      up.layer.root.peel()

      expect(listener.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({value: ':peel'}))
    })

    describe('when a destructor throws an error', function() {
      it('still dismisses all descendants', async function() {
        const destroyError = new Error('error from destructor')

        up.compiler('.overlay-element', function() {
          return () => { throw destroyError }
        })

        up.layer.open({fragment: '<div class="overlay-element"></div>'})
        up.layer.open({fragment: '<div class="overlay-element"></div>'})

        expect(up.layer.count).toBe(3)

        await jasmine.expectGlobalError(destroyError, function() {
          up.layer.root.peel()
        })

        expect(up.layer.count).toBe(1)
      })
    })
  })
})
