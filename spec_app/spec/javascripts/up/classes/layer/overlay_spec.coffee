u = up.util

describe 'up.Layer.Overlay', ->

  beforeEach ->
    up.motion.config.enabled = false

  describe '#accept()', ->

    it 'closes this layer', asyncSpec (next) ->
      modes = -> u.map(up.layer.stack, 'mode')

      makeLayers(2)

      next ->
        expect(modes()).toEqual ['root', 'modal']

        up.layer.accept(null, animation: false)

      next ->
        expect(modes()).toEqual ['root']

    it 'dismiss descendants before closing this layer', asyncSpec (next) ->
      listener = jasmine.createSpy('layer close listener')
      up.on 'up:layer:accepted up:layer:dismissed', listener

      makeLayers(4)

      next =>
        @layers = u.copy(up.layer.stack)
        up.layer.get(1).accept()

      next =>
        expect(listener.calls.count()).toBe(3)
        expect(listener.calls.argsFor(0)[0]).toBeEvent('up:layer:dismissed', layer: @layers[3])
        expect(listener.calls.argsFor(1)[0]).toBeEvent('up:layer:dismissed', layer: @layers[2])
        expect(listener.calls.argsFor(2)[0]).toBeEvent('up:layer:accepted', layer: @layers[1])

    it 'aborts pending requests for this layer'

    it 'does not abort a pending request for another layer'

    it 'takes an acceptance value that is passed to onAccepted handlers', asyncSpec (next) ->
      callback = jasmine.createSpy('onAccepted handler')

      makeLayers [
        { }
        { onAccepted: callback }
      ]

      next ->
        expect(callback).not.toHaveBeenCalled()

        up.layer.current.accept('acceptance value')

      next ->
        expect(callback).toHaveBeenCalledWith(jasmine.objectContaining(value: 'acceptance value'))

    it 'focuses the link that originally opened the overlay'

    it 'pops this layer from the stack synchronously to prevent race conditions'

    it "restores the parent layer's location", asyncSpec (next) ->
      up.history.config.enabled = true

      up.layer.open(
        target: '.element',
        location: '/path/to/modal'
        content: 'element text'
      )

      next =>
        expect(up.layer.isOverlay()).toBe(true)
        expect(location.href).toMatchURL('/path/to/modal')

        up.layer.current.accept()

      next =>
        expect(up.layer.isRoot()).toBe(true)
        expect(location.href).toMatchURL(@locationBeforeExample)

    describe 'events', ->

      it 'should have examples'

  describe '#dismiss()', ->

    it 'closes this layer', asyncSpec (next) ->
      modes = -> u.map(up.layer.stack, 'mode')

      makeLayers(2)

      next ->
        expect(modes()).toEqual ['root', 'modal']

        up.layer.current.dismiss()

      next ->
        expect(modes()).toEqual ['root']

    it 'takes a dismissal value that is passed to onDismissed handlers', asyncSpec (next) ->
      callback = jasmine.createSpy('onDismissed handler')

      makeLayers [
        { }
        { onDismissed: callback }
      ]

      next ->
        expect(callback).not.toHaveBeenCalled()

        up.layer.current.dismiss('dismissal value')

      next ->
        expect(callback).toHaveBeenCalledWith(jasmine.objectContaining(value: 'dismissal value'))

    describe 'events', ->

      it 'should have examples'

  describe '#on()', ->

    it 'registers a listener for events on this layer'

    it 'allows to pass a selector for event delegation as second argument'

    it "does not call the listener for events on another layer"

    it "does not call the listener for events on another layer, even if the event target is a DOM child of the layer element"

  describe '#emit()', ->

    it "emits an event on this layer's element"

    it 'sets up.layer.current to this layer while listeners are running'

