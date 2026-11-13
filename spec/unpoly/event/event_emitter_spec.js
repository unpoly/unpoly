describe('up.internal.parseEmitArgs()', function() {

  describe('with ([String])', function() {
    it('builds an event with the given name, which emits on the document', function() {
      const emission = up.internal.parseEmitArgs(['my:event'])
      expect(emission.event).toBeEvent('my:event')
      expect(emission.target).toBe(document)
    })
  })

  describe('with ([String, Object])', function() {
    it('builds an event with the given name and props, which emits on the document', function() {
      const emission = up.internal.parseEmitArgs(['my:event', { key1: 'value1', key2: 'value2' }])
      expect(emission.event).toBeEvent('my:event', { key1: 'value1', key2: 'value2' })
      expect(emission.target).toBe(document)
    })
  })

  describe('with ([String, Object], Object)', function() {
    it('builds an event with the given name and props, defaulting to options from the second argument', function() {
      const emission = up.internal.parseEmitArgs(['my:event', { key1: 'value1' }], { key2: 'value2' })
      expect(emission.event).toBeEvent('my:event', { key1: 'value1', key2: 'value2' })
      expect(emission.target).toBe(document)
    })
  })

  describe('with ([Element, String])', function() {
    it('builds an event with the given name, which emits on the given element', function() {
      const element = fixture('.element')
      const emission = up.internal.parseEmitArgs([element, 'my:event'])
      expect(emission.event).toBeEvent('my:event')
      expect(emission.target).toBe(element)
    })
  })

  describe('with ([up.Layer, String])', function() {
    it("builds an event with the given name, which emits on the given layer's element, setting the current layer to that layer", async function() {
      const layer = await up.layer.open({ content: 'content' })
      const emission = up.internal.parseEmitArgs([layer, 'my:event'])
      expect(emission.event).toBeEvent('my:event', { layer }) // has { layer } property for event listeners
      expect(emission.target).toBe(layer.element)
      expect(emission.baseLayer).toBe(layer)
    })
  }) // this will set up.layer.current during event emission

  describe('with ([Element, String, Object])', function() {
    it('builds an event with the given name and props, which emits on the given element', function() {
      const element = fixture('.element')
      const emission = up.internal.parseEmitArgs([element, 'my:event', { key1: 'value1', key2: 'value2' }])
      expect(emission.event).toBeEvent('my:event', { key1: 'value1', key2: 'value2' })
      expect(emission.target).toBe(element)
    })
  })

  describe('with ([Element, String])', function() {
    it('builds an event with the given name, which emits on the given element', function() {
      const element = fixture('.element')
      const emission = up.internal.parseEmitArgs([element, 'my:event'])
      expect(emission.event).toBeEvent('my:event')
      expect(emission.target).toBe(element)
    })
  })

  describe('with ([Event])', function() {
    it("emits the given event on the document", function() {
      const event = up.event.build('my:event')
      const emission = up.internal.parseEmitArgs([event])
      expect(emission.event).toBe(event)
      expect(emission.target).toBe(document)
    })
  })

  describe('with ([Element, Event])', function() {
    it("emits the given event on the given element", function() {
      const element = fixture('.element')
      const event = up.event.build('my:event')
      const emission = up.internal.parseEmitArgs([element, event])
      expect(emission.event).toBe(event)
      expect(emission.target).toBe(element)
    })
  })

  describe('with ([Event, Object])', function() {
    it("emits the given event on the document, using the given options for emission", function() {
      const event = up.event.build('my:event')
      const callback = function(_event) {
      }
      const emission = up.internal.parseEmitArgs([event, { callback }])
      expect(emission.event).toBe(event)
      expect(emission.target).toBe(document)
      expect(emission.callback).toBe(callback)
    })
  })

  describe('with ([Event, Object], Object)', function() {
    it("emits the given event on the document, using the given options for emission, using the second argment as default options", function() {
      const event = up.event.build('my:event')
      const callback = function(_event) {
      }
      const emission = up.internal.parseEmitArgs([event, { callback }], { log: 'log message' })
      expect(emission.event).toBe(event)
      expect(emission.target).toBe(document)
      expect(emission.callback).toBe(callback)
      expect(emission.log).toEqual('log message')
    })
  })

  describe('with ([Element, Event, Object])', function() {
    it("emits the given event on the given element, using the given options for emission", function() {
      const element = fixture('.element')
      const event = up.event.build('my:event')
      const callback = function(_event) {
      }
      const emission = up.internal.parseEmitArgs([element, event, { callback }])
      expect(emission.event).toBe(event)
      expect(emission.target).toBe(element)
      expect(emission.callback).toBe(callback)
    })
  })

  describe('with ([Object])', function() {

    it("builds an event with the type from the given object's { type } property, which emits on the document", function() {
      const emission = up.internal.parseEmitArgs([{ type: 'my:event', key: 'value' }])
      expect(emission.event).toBeEvent('my:event', { key: 'value' })
      expect(emission.target).toBe(document)
    })

    it('throws an error if the given object does not have a { type } property, which emits on the document', function() {
      const build = () => up.internal.parseEmitArgs([{ key: 'value' }])
      expect(build).toThrowError(/type/i)
    })

    it('accepts an event target as { target } property', function() {
      const element = fixture('.element')
      const emission = up.internal.parseEmitArgs([{ type: 'my:event', target: element }])
      expect(emission.event).toBeEvent('my:event')
      expect(emission.target).toBe(element)
    })

    it('accepts a CSS selector string in the { target } property', function() {
      const element = fixture('.element')
      const emission = up.internal.parseEmitArgs([{ type: 'my:event', target: '.element' }])
      expect(emission.event).toBeEvent('my:event')
      expect(emission.target).toBe(element)
    })
  })

  describe('with ([Element, Object])', function() {

    it("builds an event with the type from the given object's { type } property", function() {
      const element = fixture('.element')
      const emission = up.internal.parseEmitArgs([element, { type: 'my:event', key: 'value' }])
      expect(emission.event).toBeEvent('my:event', { key: 'value' })
      expect(emission.target).toBe(element)
    })

    it('throws an error if the given object does not have a { type } property', function() {
      const element = fixture('.element')
      const build = () => up.internal.parseEmitArgs([element, { key: 'value' }])
      expect(build).toThrowError(/type/i)
    })
  })

  describe('with ([Object], Object)', function() {
    it("builds an event with the type from the given object's { type } property, using the second argument as default props", function() {
      const emission = up.internal.parseEmitArgs([{
        type: 'my:event',
        key: 'value'
      }], { defaultKey: 'defaultValue' })
      expect(emission.event).toBeEvent('my:event', { key: 'value', defaultKey: 'defaultValue' })
      expect(emission.target).toBe(document)
    })
  })
})

