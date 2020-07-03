describe 'up.Layer', ->

  beforeEach ->
    up.motion.config.enabled = false

  describe '#context', ->

    it 'stores a per-layer context object', (done) ->
      up.layer.root.context.rootKey = 'rootValue'

      up.layer.open(context: { overlayKey: 'overlayValue' }).then (overlay) ->
        expect(overlay.context).toEqual(overlayKey: 'overlayValue')
        # Show that the root layer's context wasn't changed.
        expect(up.layer.root.context).toEqual(rootKey: 'rootValue')
        done()

    it 'may be mutated by the user', ->
      up.layer.context.key = 'value'
      expect(up.layer.context.key).toEqual('value')


  describe '#on()', ->

    it 'registers a listener for events on this layer', asyncSpec (next) ->
      listener = jasmine.createSpy('event listener')

      makeLayers(2)

      next ->
        up.layer.on('foo', listener)
        up.emit(up.layer.element, 'foo')

        expect(listener).toHaveBeenCalled()

    it "does not call the listener for events on another layer", asyncSpec (next) ->
      listener = jasmine.createSpy('event listener')

      makeLayers(3)

      next ->
        up.layer.stack[1].on('foo', listener)
        up.emit(up.layer.stack[2].element, 'foo')

        expect(listener).not.toHaveBeenCalled()

    it "does not call the listener for events on another layer, even if the event target is a DOM child of the layer element", asyncSpec (next) ->
      listener = jasmine.createSpy('event listener')
      up.layer.root.on('foo', listener)

      makeLayers(2)

      next ->
        # Note that we're using Element#contains(), not up.Layer#contains()
        expect(up.layer.root.element.contains(up.layer.current.element)).toBe(true)

        up.emit(up.layer.element, 'foo')

        expect(listener).not.toHaveBeenCalled()

    it 'allows to pass a selector for event delegation as second argument', asyncSpec (next) ->
      listener = jasmine.createSpy('event listener')

      makeLayers(2)

      next ->
        up.layer.on('foo', '.two', listener)
        one = up.layer.affix('.one')
        two = up.layer.affix('.two')

        up.emit(one, 'foo')
        expect(listener).not.toHaveBeenCalled()

        up.emit(two, 'foo')
        expect(listener).toHaveBeenCalled()

  describe '#emit()', ->

    it "emits an event on this layer's element", asyncSpec (next) ->
      targets = []
      up.on 'foo', (event) -> targets.push(event.target)

      makeLayers(2)

      next ->
        expect(up.layer.stack.length).toBe(2)

        up.layer.front.emit('foo')
        expect(targets).toEqual [up.layer.front.element]

        up.layer.root.emit('foo')
        expect(targets).toEqual [up.layer.front.element, up.layer.root.element]

    it 'sets up.layer.current to this layer while listeners are running', asyncSpec (next) ->
      eventLayer = null
      up.on 'foo', (event) -> eventLayer = up.layer.current

      makeLayers(2)

      next ->
        expect(up.layer.current).not.toBe(up.layer.root)
        expect(up.layer.current).toBe(up.layer.front)

        up.layer.root.emit('foo')

        expect(eventLayer).not.toBe(up.layer.front)
        expect(eventLayer).toBe(up.layer.root)
