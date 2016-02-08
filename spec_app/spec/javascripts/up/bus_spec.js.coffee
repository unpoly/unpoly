describe 'up.bus', ->
  
  describe 'Javascript functions', ->

    describe 'up.on', ->

      it 'registers a delagating event listener to the document body, which passes the $element as a second argument to the listener', ->

        affix('.container .child')
        observeClass = jasmine.createSpy()
        up.on 'click', '.child', (event, $element) ->
          observeClass($element.attr('class'))

        $('.container').click()
        $('.child').click()

        expect(observeClass).not.toHaveBeenCalledWith('container')
        expect(observeClass).toHaveBeenCalledWith('child')

      it 'returns a method that unregisters the event listener when called', ->
        $child = affix('.child')
        clickSpy = jasmine.createSpy()
        unsubscribe = up.on 'click', '.child', clickSpy
        $('.child').click()
        unsubscribe()
        $('.child').click()
        expect(clickSpy.calls.count()).toEqual(1)

      it 'parses an up-data attribute as JSON and passes the parsed object as a third argument to the initializer', ->
        $child = affix('.child')
        observeArgs = jasmine.createSpy()
        up.on 'click', '.child', (event, $element, data) ->
          observeArgs($element.attr('class'), data)

        data = { key1: 'value1', key2: 'value2' }
        $tag = affix(".child").attr('up-data', JSON.stringify(data))

        $('.child').click()
        expect(observeArgs).toHaveBeenCalledWith('child', data)

      it 'passes an empty object as a second argument to the listener if there is no up-data attribute', ->
        $child = affix('.child')
        observeArgs = jasmine.createSpy()
        up.on 'click', '.child', (event, $element, data) ->
          observeArgs($element.attr('class'), data)

        $('.child').click()
        expect(observeArgs).toHaveBeenCalledWith('child', {})

    describe 'up.off', ->

      it 'unregisters an event listener previously registered through up.on', ->
        $child = affix('.child')
        clickSpy = jasmine.createSpy()
        up.on 'click', '.child', clickSpy
        $('.child').click()
        up.off 'click', '.child', clickSpy
        $('.child').click()
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
