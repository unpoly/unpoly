describe 'up.EventEmitter', ->

  describe '.fromEmitArgs', ->

    describe 'with ([String])', ->

      it 'builds an event with the given name, which emits on the document', ->
        emitter = up.EventEmitter.fromEmitArgs(['my:event'])
        expect(emitter.event).toBeEvent('my:event')
        expect(emitter.target).toBe(document)

    describe 'with ([String, Object])', ->

      it 'builds an event with the given name and props, which emits on the document', ->
        emitter = up.EventEmitter.fromEmitArgs(['my:event', { key1: 'value1', key2: 'value2' }])
        expect(emitter.event).toBeEvent('my:event', key1: 'value1', key2: 'value2')
        expect(emitter.target).toBe(document)

    describe 'with ([String, Object], Object)', ->

      it 'builds an event with the given name and props, defaulting to options from the second argument', ->
        emitter = up.EventEmitter.fromEmitArgs(['my:event', { key1: 'value1' }], { key2: 'value2' })
        expect(emitter.event).toBeEvent('my:event', key1: 'value1', key2: 'value2')
        expect(emitter.target).toBe(document)

    describe 'with ([Element, String])', ->

      it 'builds an event with the given name, which emits on the given element', ->
        element = fixture('.element')
        emitter = up.EventEmitter.fromEmitArgs([element, 'my:event'])
        expect(emitter.event).toBeEvent('my:event')
        expect(emitter.target).toBe(element)

    describe 'with ([up.Layer, String])', ->

      it "builds an event with the given name, which emits on the given layer's element, setting the current layer to that layer", (done) ->
        up.layer.open(content: 'content').then (layer) ->
          emitter = up.EventEmitter.fromEmitArgs([layer, 'my:event'])
          expect(emitter.event).toBeEvent('my:event', layer: layer) # has { layer } property for event listeners
          expect(emitter.target).toBe(layer.element)
          expect(emitter.currentLayer).toBe(layer) # this will set up.layer.current during event emission
          done()

    describe 'with ([Element, String, Object])', ->

      it 'builds an event with the given name and props, which emits on the given element', ->
        element = fixture('.element')
        emitter = up.EventEmitter.fromEmitArgs([element, 'my:event', { key1: 'value1', key2: 'value2' }])
        expect(emitter.event).toBeEvent('my:event', key1: 'value1', key2: 'value2')
        expect(emitter.target).toBe(element)

    describe 'with ([Element, String])', ->

      it 'builds an event with the given name, which emits on the given element', ->
        element = fixture('.element')
        emitter = up.EventEmitter.fromEmitArgs([element, 'my:event'])
        expect(emitter.event).toBeEvent('my:event')
        expect(emitter.target).toBe(element)

    describe 'with ([Event])', ->

      it "emits the given event on the document", ->
        event = up.event.build('my:event')
        emitter = up.EventEmitter.fromEmitArgs([event])
        expect(emitter.event).toBe(event)
        expect(emitter.target).toBe(document)

    describe 'with ([Element, Event])', ->

      it "emits the given event on the given element", ->
        element = fixture('.element')
        event = up.event.build('my:event')
        emitter = up.EventEmitter.fromEmitArgs([element, event])
        expect(emitter.event).toBe(event)
        expect(emitter.target).toBe(element)

    describe 'with ([Event, Object])', ->

      it "emits the given event on the document, using the given options for emission", ->
        event = up.event.build('my:event')
        callback = (_event) ->
        emitter = up.EventEmitter.fromEmitArgs([event, { callback }])
        expect(emitter.event).toBe(event)
        expect(emitter.target).toBe(document)
        expect(emitter.callback).toBe(callback)

    describe 'with ([Event, Object], Object)', ->

      it "emits the given event on the document, using the given options for emission, using the second argment as default options", ->
        event = up.event.build('my:event')
        callback = (_event) ->
        emitter = up.EventEmitter.fromEmitArgs([event, { callback }], { log: 'log message' })
        expect(emitter.event).toBe(event)
        expect(emitter.target).toBe(document)
        expect(emitter.callback).toBe(callback)
        expect(emitter.log).toEqual('log message')

    describe 'with ([Element, Event, Object])', ->

      it "emits the given event on the given element, using the given options for emission", ->
        element = fixture('.element')
        event = up.event.build('my:event')
        callback = (_event) ->
        emitter = up.EventEmitter.fromEmitArgs([element, event, { callback }])
        expect(emitter.event).toBe(event)
        expect(emitter.target).toBe(element)
        expect(emitter.callback).toBe(callback)

    describe 'with ([Object])', ->

      it "builds an event with the type from the given object's { type } property, which emits on the document", ->
        emitter = up.EventEmitter.fromEmitArgs([{type: 'my:event', key: 'value'}])
        expect(emitter.event).toBeEvent('my:event', key: 'value')
        expect(emitter.target).toBe(document)

      it 'throws an error if the given object does not have a { type } property, which emits on the document', ->
        build = -> up.EventEmitter.fromEmitArgs([{key: 'value'}])
        expect(build).toThrowError(/type/i)

    describe 'with ([Element, Object])', ->

      it "builds an event with the type from the given object's { type } property", ->
        element = fixture('.element')
        emitter = up.EventEmitter.fromEmitArgs([element, {type: 'my:event', key: 'value'}])
        expect(emitter.event).toBeEvent('my:event', key: 'value')
        expect(emitter.target).toBe(element)

      it 'throws an error if the given object does not have a { type } property', ->
        element = fixture('.element')
        build = -> up.EventEmitter.fromEmitArgs([element, {key: 'value'}])
        expect(build).toThrowError(/type/i)

    describe 'with ([Object], Object)', ->

      it "builds an event with the type from the given object's { type } property, using the second argument as default props", ->
        emitter = up.EventEmitter.fromEmitArgs([{type: 'my:event', key: 'value'}], defaultKey: 'defaultValue')
        expect(emitter.event).toBeEvent('my:event', key: 'value', defaultKey: 'defaultValue')
        expect(emitter.target).toBe(document)

