describe 'up.bus', ->
  
  describe 'JavaScript functions', ->

    describe 'up.on', ->

      it 'registers a delagating event listener to the document body, which passes the $element as a second argument to the listener', asyncSpec (next) ->
        affix('.container .child')
        observeClass = jasmine.createSpy()
        up.on 'click', '.child', (event, $element) ->
          observeClass($element.attr('class'))

        Trigger.click($('.container'))
        Trigger.click($('.child'))

        next =>
          expect(observeClass).not.toHaveBeenCalledWith('container')
          expect(observeClass).toHaveBeenCalledWith('child')

      it 'returns a method that unregisters the event listener when called', asyncSpec (next) ->
        $child = affix('.child')
        clickSpy = jasmine.createSpy()
        unsubscribe = up.on 'click', '.child', clickSpy
        Trigger.click($('.child'))

        next =>
          expect(clickSpy.calls.count()).toEqual(1)
          unsubscribe()
          Trigger.click($('.child'))

        next =>
          expect(clickSpy.calls.count()).toEqual(1)

      it 'parses an up-data attribute as JSON and passes the parsed object as a third argument to the initializer', asyncSpec (next) ->
        $child = affix('.child')
        observeArgs = jasmine.createSpy()
        up.on 'click', '.child', (event, $element, data) ->
          observeArgs($element.attr('class'), data)

        data = { key1: 'value1', key2: 'value2' }
        $tag = affix(".child").attr('up-data', JSON.stringify(data))

        Trigger.click($('.child'))

        next =>
          expect(observeArgs).toHaveBeenCalledWith('child', data)

      it 'passes an empty object as a second argument to the listener if there is no up-data attribute', asyncSpec (next) ->
        $child = affix('.child')
        observeArgs = jasmine.createSpy()
        up.on 'click', '.child', (event, $element, data) ->
          observeArgs($element.attr('class'), data)

        Trigger.click($('.child'))

        next =>
          expect(observeArgs).toHaveBeenCalledWith('child', {})

    describe 'up.off', ->

      it 'unregisters an event listener previously registered through up.on', asyncSpec (next) ->
        $child = affix('.child')
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
        emitted$Target = undefined

        up.on 'foo', (event, $target) ->
          emittedEvent = event
          emitted$Target = $target

        expect(emittedEvent).toBeUndefined()
        expect(emitted$Target).toBeUndefined()

        up.emit('foo')

        expect(emittedEvent).toBeDefined()
        expect(emittedEvent.preventDefault).toBeDefined()
        expect(emitted$Target).toEqual($(document))

      it 'accepts custom event properties', ->
        emittedEvent = undefined

        up.on 'foo', (event) ->
          emittedEvent = event

        up.emit('foo', { customField: 'custom-value' })

        expect(emittedEvent.customField).toEqual('custom-value')

      describe 'with .$element option', ->

        it 'triggers an event on the given element', ->
          emittedEvent = undefined
          $emittedTarget = undefined

          $element = affix('.element').text('foo')

          up.on 'foo', (event, $target) ->
            emittedEvent = event
            $emittedTarget = $target

          up.emit('foo', $element: $element)

          expect(emittedEvent).toBeDefined()
          expect($emittedTarget).toEqual($element)

          expect(emittedEvent.$element).toEqual($element)

    describe 'up.bus.deprecateRenamedEvent', ->

      it 'prints a warning and registers the event listener for the new event name', ->
        warnSpy = spyOn(up.log, 'warn')
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
