describe 'up.bus', ->
  
  describe 'Javascript functions', ->
    
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

      it 'triggers an event on an element given as .$element event property', ->
        emittedEvent = undefined
        emitted$Target = undefined

        $element = affix('.element').text('foo')

        up.on 'foo', (event, $target) ->
          emittedEvent = event
          emitted$Target = $target

        up.emit('foo', $element: $element)

        expect(emittedEvent).toBeDefined()
        expect(emitted$Target).toEqual($element)

        expect(emittedEvent.$element).toEqual($element)
