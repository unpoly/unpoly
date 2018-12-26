u = up.util
$ = jQuery

describe 'up.bus', ->
  
  describe 'JavaScript functions', ->

    describe 'up.on', ->

      it 'registers a delagating event listener to the document body, which passes the $element as a second argument to the listener', asyncSpec (next) ->
        fixture('.container .child')
        observeClass = jasmine.createSpy()
        up.on 'click', '.child', (event, element) ->
          observeClass(element.className)

        Trigger.click($('.container'))
        Trigger.click($('.child'))

        next =>
          expect(observeClass).not.toHaveBeenCalledWith('container')
          expect(observeClass).toHaveBeenCalledWith('child')

      it 'calls the event listener if the event was triggered on a child of the requested selector', asyncSpec (next) ->
        $container = $fixture('.container')
        $child = $container.affix('.child')
        listener = jasmine.createSpy()
        up.on 'click', '.container', listener

        Trigger.click($('.child'))

        next =>
          expect(listener).toHaveBeenCalledWith(
            jasmine.any(MouseEvent),
            $container[0],
            {}
          )

      it 'passes the event target as the second argument if no selector was passed to up.on()', asyncSpec (next) ->
        $element = $fixture('.element')
        listener = jasmine.createSpy()
        up.on 'click', listener
        Trigger.click($element)

        next =>
          expect(listener).toHaveBeenCalledWith(
            jasmine.any(MouseEvent),
            $element[0],
            {}
          )

      it 'registers the listener to multiple, space-separated events', ->
        listener = jasmine.createSpy()

        up.on 'foo bar', listener

        up.emit('foo')
        expect(listener.calls.count()).toEqual(1)

        up.emit('bar')
        expect(listener.calls.count()).toEqual(2)

      it 'returns a method that unregisters the event listener when called', asyncSpec (next) ->
        $child = $fixture('.child')
        clickSpy = jasmine.createSpy()
        unsubscribe = up.on 'click', '.child', clickSpy
        Trigger.click($('.child'))

        next =>
          expect(clickSpy.calls.count()).toEqual(1)
          unsubscribe()
          Trigger.click($('.child'))

        next =>
          expect(clickSpy.calls.count()).toEqual(1)

      it 'throws an error when trying to register the same callback multiple times', ->
        callback = ->
        register = -> up.on 'foo', callback
        register()
        expect(register).toThrowError(/cannot be registered more than once/i)

      it 'does not throw an error if a callback is registered, unregistered and registered a second time', ->
        callback = ->
        register = -> up.on 'foo', callback
        unregister = -> up.off 'foo', callback
        register()
        unregister()
        expect(register).not.toThrowError()

      describe 'passing of [up-data]', ->

        it 'parses an [up-data] attribute as JSON and passes the parsed object as a third argument to the listener', asyncSpec (next) ->
          observeArgs = jasmine.createSpy()
          up.on 'click', '.child', (event, element, data) ->
            observeArgs(element.className, data)

          $child = $fixture(".child")
          data = { key1: 'value1', key2: 'value2' }
          $child.attr('up-data', JSON.stringify(data))

          Trigger.click($child)

          next =>
            expect(observeArgs).toHaveBeenCalledWith('child', data)

        it 'passes an empty object as a second argument to the listener if there is no [up-data] attribute', asyncSpec (next) ->
          $child = $fixture('.child')
          observeArgs = jasmine.createSpy()
          up.on 'click', '.child', (event, element, data) ->
            observeArgs(element.className, data)

          Trigger.click($('.child'))

          next =>
            expect(observeArgs).toHaveBeenCalledWith('child', {})

        it 'does not parse an [up-data] attribute if the listener function only takes one argument', asyncSpec (next) ->
          parseDataSpy = spyOn(up.syntax, 'data').and.returnValue({})

          $child = $fixture('.child')
          up.on 'click', '.child', (event) -> # no-op

          Trigger.click($child)

          next =>
            expect(parseDataSpy).not.toHaveBeenCalled()

        it 'does not parse an [up-data] attribute if the listener function only takes two arguments', asyncSpec (next) ->
          parseDataSpy = spyOn(up.syntax, 'data').and.returnValue({})

          $child = $fixture('.child')
          up.on 'click', '.child', (event, $element) -> # no-op

          Trigger.click($child)

          next =>
            expect(parseDataSpy).not.toHaveBeenCalled()

      it 'allows to bind and unbind events by their old, deprecated name', ->
        warnSpy = spyOn(up, 'warn')
        listener = jasmine.createSpy('listener')

        # Reister listener for the old event name
        up.on('up:proxy:received', listener)
        expect(warnSpy).toHaveBeenCalled()

        # Emit event with new name and see that it invokes the legacy listener
        up.emit('up:proxy:loaded')
        expect(listener.calls.count()).toBe(1)

        # Check that up.off works with the old event name
        up.off('up:proxy:received', listener)

        up.emit('up:proxy:loaded')
        expect(listener.calls.count()).toBe(1)


    describe 'up.off', ->

      it 'unregisters an event listener previously registered through up.on', asyncSpec (next) ->
        $child = $fixture('.child')
        clickSpy = jasmine.createSpy()
        up.on 'click', '.child', clickSpy
        Trigger.click($('.child'))
        up.off 'click', '.child', clickSpy
        Trigger.click($('.child'))

        next =>
          expect(clickSpy.calls.count()).toEqual(1)

      it 'throws an error if the given event listener was not registered through up.on', ->
        someFunction = ->
        offing = -> up.off 'click', '.child', someFunction
        expect(offing).toThrowError(/(not|never) registered/i)

      it 'reduces the internally tracked list of event listeners (bugfix for memory leak)', ->
        getCount = -> up.bus.knife.get('Object.keys(liveUpDescriptions).length')
        oldCount = getCount()
        expect(oldCount).toBeGreaterThan(0)
        clickSpy = jasmine.createSpy()
        up.on 'click', '.child', clickSpy
        expect(getCount()).toBe(oldCount + 1)
        up.off 'click', '.child', clickSpy
        expect(getCount()).toBe(oldCount)

    describe 'up.emit', ->

      it 'triggers an event on the document', ->
        emittedEvent = undefined
        emittedTarget = undefined

        up.on 'foo', (event, target) ->
          emittedEvent = event
          emittedTarget = target

        expect(emittedEvent).toBeUndefined()
        expect(emittedTarget).toBeUndefined()

        up.emit('foo')

        expect(emittedEvent).toBeDefined()
        expect(emittedEvent.preventDefault).toBeDefined()
        expect(emittedTarget).toEqual(document)

      describe 'custom event properties', ->

        it 'accepts custom event properties that can be accessed from an up.on() handler', ->
          emittedEvent = undefined
          up.on 'foo', (event) -> emittedEvent = event

          up.emit('foo', { customField: 'custom-value' })

          expect(emittedEvent.customField).toEqual('custom-value')

      it 'accepts custom event properties that can be accessed from an jQuery.on() handler', ->
        emittedEvent = undefined
        $(document).on 'foo', (event) -> emittedEvent = event.originalEvent

        up.emit('foo', { customField: 'custom-value' })

        expect(emittedEvent.customField).toEqual('custom-value')

      it 'accepts custom event properties that can be accessed from an addEventListener() handler', ->
        emittedEvent = undefined
        document.addEventListener 'foo', (event) -> emittedEvent = event

        up.emit('foo', { customField: 'custom-value' })

        expect(emittedEvent.customField).toEqual('custom-value')

      describe 'with { element } option', ->

        it 'triggers an event on the given element', ->
          emittedEvent = undefined
          emittedElement = undefined

          $element = $fixture('.element').text('foo')

          up.on 'foo', (event, element) ->
            emittedEvent = event
            emittedElement = element

          up.emit('foo', target: $element[0])

          expect(emittedEvent).toBeDefined()
          expect(emittedElement).toEqual($element[0])

          expect(emittedEvent.target).toEqual($element[0])

    describe 'up.bus.whenEmitted', ->

      it 'emits the event and fulfills the returned promise when no listener calls event.preventDefault()', (done) ->
        eventListener = jasmine.createSpy('event listener')
        up.on('my:event', eventListener)
        promise = up.bus.whenEmitted('my:event', key: 'value')
        promiseState(promise).then (result) ->
          expect(eventListener).toHaveBeenCalledWith(jasmine.objectContaining(key: 'value'), jasmine.anything(), jasmine.anything())
          expect(result.state).toEqual('fulfilled')
          done()

      it 'emits the event and rejects the returned promise when any listener calls event.preventDefault()', (done) ->
        eventListener = (event) -> event.preventDefault()
        up.on('my:event', eventListener)
        promise = up.bus.whenEmitted('my:event', key: 'value')
        promiseState(promise).then (result) ->
          expect(result.state).toEqual('rejected')
          done()
