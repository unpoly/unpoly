const u = up.util
const e = up.element
const $ = jQuery

describe('up.event', function() {

  describe('JavaScript functions', function() {

    describe('up.on()', function() {

      it('registers a delagating event listener to the document, which passes the element as a second argument to the listener', asyncSpec(function(next) {
        fixture('.container .child')
        const observeClass = jasmine.createSpy()
        up.on('click', '.child', (event, element) => observeClass(element.className))

        Trigger.click($('.container'))
        Trigger.click($('.child'))

        next(() => {
          expect(observeClass).not.toHaveBeenCalledWith('container')
          expect(observeClass).toHaveBeenCalledWith('child')
        })
      })
      )

      it('calls the event listener if the event was triggered on a child of the requested selector', asyncSpec(function(next) {
        const $container = $fixture('.container')
        const $child = $container.affix('.child')
        const listener = jasmine.createSpy()
        up.on('click', '.container', listener)

        Trigger.click($('.child'))

        next(() => {
          expect(listener).toHaveBeenCalledWith(
            jasmine.any(MouseEvent),
            $container[0],
            jasmine.any(Object)
          )
        })
      })
      )

      it('does not call the event listener if the event was triggered on a child and the selector has a [disabled] attribute', asyncSpec(function(next) {
        const listener = jasmine.createSpy()
        up.on('click', '.parent', listener)

        const $button = $fixture('button.parent[disabled]')
        const $child = $button.affix('span.child')

        Trigger.click($child)
        next(() => {
          expect(listener.calls.count()).toBe(0)
        })
      })
      )

      it('passes the event target as the second argument if no selector was passed to up.on()', asyncSpec(function(next) {
        const $element = $fixture('.element')
        const listener = jasmine.createSpy()
        up.on('click', listener)
        Trigger.click($element)

        next(() => {
          expect(listener).toHaveBeenCalledWith(
            jasmine.any(MouseEvent),
            $element[0],
            jasmine.any(Object)
          )
        })
      })
      )

      it('allows to bind the listener to a given element', asyncSpec(function(next) {
        const element1 = fixture('.element')
        const element2 = fixture('.element')
        const listener = jasmine.createSpy()
        up.on(element1, 'click', listener)
        Trigger.click(element1)

        next(function() {
          expect(listener).toHaveBeenCalledWith(
            jasmine.any(MouseEvent),
            element1,
            jasmine.any(Object)
          )
          expect(listener.calls.count()).toBe(1)
        })
      })
      )

      it('allows to pass a function that returns a selector', asyncSpec(function(next) {
        const foo = fixture('.foo')
        const bar = fixture('.bar')

        this.selector = '.foo'
        const selectorFn = () => this.selector

        const listener = jasmine.createSpy('dynamic listener')
        up.on('click', selectorFn, listener)

        Trigger.click(foo)

        next(() => {
          expect(listener.calls.count()).toBe(1)

          this.selector = '.bar'

          Trigger.click(foo)
        })

        next(() => {
          // Selector no longer matches event target, so the listener is not called
          expect(listener.calls.count()).toBe(1)

          Trigger.click(bar)
        })

        next(() => {
          // Selector again matches event target
          expect(listener.calls.count()).toBe(2)
        })
      })
      )

      it('allows to bind the listener to a given element while also passing a selector', asyncSpec(function(next) {
        const element1 = fixture('.element.one')
        const element2 = fixture('.element.two')
        const element2Child1 = e.affix(element2, '.child.one')
        const element2Child2 = e.affix(element2, '.child.two')
        const listener = jasmine.createSpy('event listener')
        up.on(element2, 'click', '.one', listener)

        Trigger.click(element2Child1)

        next(function() {
          expect(listener).toHaveBeenCalledWith(
            jasmine.any(MouseEvent),
            element2Child1,
            jasmine.any(Object)
          )
          expect(listener.calls.count()).toBe(1)
        })
      })
      )


      it('allows to bind the listener to an array of elements at once', asyncSpec(function(next) {
        const element1 = fixture('.element')
        const element2 = fixture('.element')
        const listener = jasmine.createSpy()

        const unbindAll = up.on([element1, element2], 'click', listener)

        Trigger.click(element1)

        next(() => {
          expect(listener.calls.count()).toBe(1)
          expect(listener.calls.argsFor(0)[1]).toBe(element1)

          Trigger.click(element2)
        })

        next(() => {
          expect(listener.calls.count()).toBe(2)
          expect(listener.calls.argsFor(1)[1]).toBe(element2)

          unbindAll()

          Trigger.click(element1)
          Trigger.click(element2)
        })

        next(() => {
          expect(listener.calls.count()).toBe(2)
        })
      })
      )

      it('allows to explicitly bind a listener to the document', asyncSpec(function(next) {
        const listener = jasmine.createSpy()
        up.on(document, 'foo', listener)
        up.emit(document, 'foo')

        next(function() {
          expect(listener).toHaveBeenCalledWith(
            jasmine.any(Event),
            document,
            {}
          )
          expect(listener.calls.count()).toBe(1)
        })
      })
      )

      it('allows to bind a listener to the window', asyncSpec(function(next) {
        const listener = jasmine.createSpy()
        up.on(window, 'foo', listener)
        up.emit(window, 'foo')

        next(function() {
          expect(listener).toHaveBeenCalledWith(
            jasmine.any(Event),
            window,
            {}
          )
          expect(listener.calls.count()).toBe(1)
        })
      })
      )

      it('registers the listener to multiple, space-separated events', function() {
        const listener = jasmine.createSpy()

        up.on('foo bar', listener)

        up.emit('foo')
        expect(listener.calls.count()).toEqual(1)

        up.emit('bar')
        expect(listener.calls.count()).toEqual(2)
      })

      it('registers the listener to an array of event names', function() {
        const listener = jasmine.createSpy()

        up.on(['foo', 'bar'], listener)

        up.emit('foo')
        expect(listener.calls.count()).toEqual(1)

        up.emit('bar')
        expect(listener.calls.count()).toEqual(2)
      })

      it('returns a method that unregisters the event listener when called', asyncSpec(function(next) {
        const $child = $fixture('.child')
        const clickSpy = jasmine.createSpy()
        const unsubscribe = up.on('click', '.child', clickSpy)

        Trigger.click($('.child'))

        next(() => {
          expect(clickSpy.calls.count()).toEqual(1)
          unsubscribe()
          return Trigger.click($('.child'))
        })

        next(() => {
          expect(clickSpy.calls.count()).toEqual(1)
        })
      })
      )

      it('throws an error when trying to register the same callback multiple times', function() {
        const callback = function() {}
        const register = () => up.on('foo', callback)
        register()
        expect(register).toThrowError(/cannot be registered more than once/i)
      })

      it('allows to register the same callback for different event names (bugfix)', function() {
        const callback = function() {}
        const register = function() {
          up.on('foo', callback)
          up.on('bar', callback)
        }
        expect(register).not.toThrowError()
      })

      it('allows to register the same callback for different elements (bugfix)', function() {
        const element1 = fixture('.element1')
        const element2 = fixture('.element2')
        const callback = function() {}
        const register = function() {
          up.on(element1, 'foo', callback)
          up.on(element2, 'foo', callback)
        }
        expect(register).not.toThrowError()
      })

      it('allows to register the same callback for different selectors (bugfix)', function() {
        const callback = function() {}
        const register = function() {
          up.on('foo', '.one', callback)
          up.on('foo', '.two', callback)
        }
        expect(register).not.toThrowError()
      })

      it('does not throw an error if a callback is registered, unregistered and registered a second time', function() {
        const callback = function() {}
        const register = () => up.on('foo', callback)
        const unregister = () => up.off('foo', callback)
        register()
        unregister()
        expect(register).not.toThrowError()
      })

      describe('when Unpoly cannot boot', function() {

        it('does not call the listener before Unpoly has booted', function() {
          let isBeforeBoot = true
          spyOnProperty(up.framework, 'beforeBoot', 'get').and.callFake(() => isBeforeBoot)

          const element = fixture('.element')
          const listener = jasmine.createSpy('listener')
          up.on(element, 'my:event', listener)

          up.emit(element, 'my:event')
          expect(listener).not.toHaveBeenCalled()

          isBeforeBoot = false

          up.emit(element, 'my:event')
          expect(listener).toHaveBeenCalled()
        })

        it('does call the listener before Unpoly has booted if it was registered with { beforeBoot: true }', function() {
          let isBeforeBoot = true
          spyOnProperty(up.framework, 'beforeBoot', 'get').and.callFake(() => isBeforeBoot)

          const element = fixture('.element')
          const listener = jasmine.createSpy('listener')
          up.on(element, 'my:event', { beforeBoot: true }, listener)

          up.emit(element, 'my:event')
          expect(listener.calls.count()).toBe(1)

          isBeforeBoot = false

          up.emit(element, 'my:event')
          expect(listener.calls.count()).toBe(2)
        })
      })

      describe('when a listener throws an error', function() {

        it('does not prevent other event listeners from being called', async function() {
          const nativeCallbackBefore = jasmine.createSpy('native callback before')
          const upCallbackBefore = jasmine.createSpy('Unpoly callback before')
          const crashingUpCallback = function() { throw new Error('error from crashing Unpoly callback') }
          const upCallbackAfter = jasmine.createSpy('Unpoly callback after')
          const nativeCallbackAfter = jasmine.createSpy('native callback after')

          document.addEventListener('foo', nativeCallbackBefore)
          up.on('foo', upCallbackBefore)
          up.on('foo', crashingUpCallback)
          up.on('foo', upCallbackAfter)
          document.addEventListener('foo', nativeCallbackAfter)

          const emit = () => up.emit('foo')

          // Errors in event handlers will be silenced (and not crash the dispatching emitter).
          // However, the global error handler will still be called (and crash the test).
          // https://makandracards.com/makandra/481395-error-handling-in-dom-event-listeners
          await jasmine.expectGlobalError(/error from crashing Unpoly callback/, () => expect(emit).not.toThrowError())

          expect(nativeCallbackBefore).toHaveBeenCalled()
          expect(upCallbackBefore).toHaveBeenCalled()
          expect(upCallbackAfter).toHaveBeenCalled()
          expect(nativeCallbackAfter).toHaveBeenCalled()

          // Since we're not using up.on we need to clean up manually
          document.removeEventListener('foo', nativeCallbackBefore)
          document.removeEventListener('foo', nativeCallbackAfter)
        })

      })

      describe('with { passive } option', function() {
        it('registers a passive event listener', function() {
          const element = fixture('.element')
          spyOn(element, 'addEventListener')
          const listener = function() {}

          up.on(element, 'my:event', { passive: true }, listener)

          expect(element.addEventListener).toHaveBeenCalledWith('my:event', jasmine.any(Function), { passive: true })
        })
      })

      describe('without { passive } option', function() {
        it('does not pass { passive: false } since this would override defaults some browser have for certain event types', function() {
          const element = fixture('.element')
          spyOn(element, 'addEventListener')
          const listener = function() {}

          up.on(element, 'my:event', listener)

          expect(element.addEventListener).toHaveBeenCalledWith('my:event', jasmine.any(Function), {})
        })
      })

      describe('with { once } option', function() {
        it('registers an event listener that will only be called once', function() {
          const element = fixture('.element')
          const listener = jasmine.createSpy()
          up.on(element, 'my:event', { once: true }, listener)

          up.emit(element, 'my:event')
          up.emit(element, 'my:event')

          expect(listener.calls.count()).toBe(1)
        })
      })

      describe('with { capture } option', function() {
        it('registers an event listener that will be called during the capture phase', function() {
          // See https://javascript.info/bubbling-and-capturing
          const element = fixture('.element')
          const emissions = []
          up.on(element, 'my:event', () => emissions.push('target phase'))
          up.on(document.body, 'my:event', () => emissions.push('bubbling phase'))
          up.on(document.body, 'my:event', { capture: true }, () => emissions.push('capture phase'))

          up.emit(element, 'my:event')

          expect(emissions).toEqual(['capture phase', 'target phase', 'bubbling phase'])
        })
      })

      describe('passing of [up-data]', function() {

        it('parses an [up-data] attribute as JSON and passes the parsed object as a third argument to the listener', asyncSpec(function(next) {
          const observeArgs = jasmine.createSpy()
          up.on('click', '.child', (event, element, data) => observeArgs(element.className, data))

          const $child = $fixture(".child")
          const data = { key1: 'value1', key2: 'value2' }
          $child.attr('up-data', JSON.stringify(data))

          Trigger.click($child)

          next(() => {
            expect(observeArgs).toHaveBeenCalledWith('child', jasmine.objectContaining(data))
          })
        })
        )

        it('passes an empty object as a second argument to the listener if there is no [up-data] attribute', asyncSpec(function(next) {
          const $child = $fixture('.child')
          const observeArgs = jasmine.createSpy()
          up.on('click', '.child', (event, element, data) => observeArgs(element.className, data))

          Trigger.click($('.child'))

          next(() => {
            expect(observeArgs).toHaveBeenCalledWith('child', jasmine.objectContaining({}))
          })
        })
        )

        it('does not parse an [up-data] attribute if the listener function only takes one argument', asyncSpec(function(next) {
          const parseDataSpy = spyOn(up.script, 'data').and.returnValue({})

          const $child = $fixture('.child')
          up.on('click', '.child', function(event) {}) // no-op

          Trigger.click($child)

          next(() => {
            expect(parseDataSpy).not.toHaveBeenCalled()
          })
        })
        )

        it('does not parse an [up-data] attribute if the listener function only takes two arguments', asyncSpec(function(next) {
          const parseDataSpy = spyOn(up.script, 'data').and.returnValue({})

          const $child = $fixture('.child')
          up.on('click', '.child', function(event, $element) {}) // no-op

          Trigger.click($child)

          next(() => {
            expect(parseDataSpy).not.toHaveBeenCalled()
          })
        })
        )
      })

      if (up.migrate.loaded) {
        it('allows to bind and unbind events by their old, deprecated name', function() {
          up.migrate.renamedEvent('up:spec:old', 'up:spec:new')

          const warnSpy = up.migrate.warn.mock()
          const listener = jasmine.createSpy('listener')

          // Reister listener for the old event name
          up.on('up:spec:old', listener)
          expect(warnSpy).toHaveBeenCalled()

          // Emit event with new name and see that it invokes the legacy listener
          up.emit('up:spec:new')
          expect(listener.calls.count()).toBe(1)

          // Check that up.off works with the old event name
          up.off('up:spec:old', listener)

          up.emit('up:spec:new')
          expect(listener.calls.count()).toBe(1)
        })
      }
    })


    if (up.migrate.loaded) {
      describe('up.$on()', function() {

        it('registers a delagating event listener to the document body, which passes a jQuery-wrapped element as a second argument to the listener', asyncSpec(function(next) {
          fixture('.container[data-mark=container] .child[data-mark=child]')
          const observeClass = jasmine.createSpy()
          up.$on('click', '.child', (event, $element) => observeClass($element.attr('data-mark')))

          Trigger.click($('.container'))
          Trigger.click($('.child'))

          next(() => {
            expect(observeClass).not.toHaveBeenCalledWith('container')
            expect(observeClass).toHaveBeenCalledWith('child')
          })
        })
        )

        it('returns a function that unbinds the listener when called', asyncSpec(function(next) {
          const $child = $fixture('.child')
          const clickSpy = jasmine.createSpy()
          const unbind = up.$on('click', '.child', clickSpy)
          Trigger.click($('.child'))
          unbind()
          Trigger.click($('.child'))

          next(() => {
            expect(clickSpy.calls.count()).toEqual(1)
          })
        })
        )
      })
    }

    describe('up.off()', function() {

      it('unregisters an event listener previously registered through up.on', asyncSpec(function(next) {
        const $child = $fixture('.child')
        const clickSpy = jasmine.createSpy()
        up.on('click', '.child', clickSpy)
        Trigger.click($('.child'))
        up.off('click', '.child', clickSpy)
        Trigger.click($('.child'))

        next(() => {
          expect(clickSpy.calls.count()).toEqual(1)
        })
      })
      )

      it('allows to unregister a single event from a group of events that were registered in a single up.on call', asyncSpec(function(next) {
        const listener = jasmine.createSpy()
        const element = fixture('.element')
        up.on(element, 'mouseover mouseout', listener)

        up.off(element, 'mouseover', listener)
        Trigger.mouseover(element)

        next(function() {
          expect(listener.calls.count()).toBe(0)

          Trigger.mouseout(element)
        })

        next(function() {
          expect(listener.calls.count()).toBe(1)

          up.off(element, 'mouseout', listener)

          Trigger.mouseout(element)
        })

        next(() => {
          expect(listener.calls.count()).toBe(1)
        })
      })
      )

      it('allows to unregister a single element from a group of elements that were registered in a single up.on call', asyncSpec(function(next) {
        const listener = jasmine.createSpy()
        const element1 = fixture('.element1')
        const element2 = fixture('.element2')

        up.on([element1, element2], 'mouseover', listener)

        up.off(element1, 'mouseover', listener)
        Trigger.mouseover(element1)

        next(function() {
          expect(listener.calls.count()).toBe(0)

          Trigger.mouseover(element2)
        })

        next(function() {
          expect(listener.calls.count()).toBe(1)

          up.off(element2, 'mouseover', listener)

          Trigger.mouseover(element2)
        })

        next(() => {
          expect(listener.calls.count()).toBe(1)
        })
      })
      )
    })

    if (up.migrate.loaded) {
      describe('up.$off()', () => it('unregisters an event listener previously registered through up.$on', asyncSpec(function(next) {
        const $child = $fixture('.child')
        const clickSpy = jasmine.createSpy()
        up.$on('click', '.child', clickSpy)
        Trigger.click($('.child'))
        up.$off('click', '.child', clickSpy)
        Trigger.click($('.child'))

        next(() => {
          expect(clickSpy.calls.count()).toEqual(1)
        })
      })
      ))
    }


    describe('up.emit()', function() {

      it('triggers an event on the document', function() {
        let emittedEvent = undefined
        let emittedTarget = undefined

        up.on('foo', function(event, target) {
          emittedEvent = event
          emittedTarget = target
        })

        expect(emittedEvent).toBeUndefined()
        expect(emittedTarget).toBeUndefined()

        up.emit('foo')

        expect(emittedEvent).toBeDefined()
        expect(emittedEvent.preventDefault).toBeDefined()
        expect(emittedTarget).toEqual(document)
      })

      it('triggers an event that bubbles', function() {
        const $parent = $fixture('.parent')
        const $element = $parent.affix('.element')
        const callback = jasmine.createSpy('event handler')
        $parent[0].addEventListener('custom:name', callback)
        up.emit($element[0], 'custom:name')
        expect(callback).toHaveBeenCalled()
      })

      it('triggers an event that can be stopped from propagating', function() {
        const $parent = $fixture('.parent')
        const $element = $parent.affix('.element')
        const callback = jasmine.createSpy('event handler')
        $parent[0].addEventListener('custom:name', callback)
        $element[0].addEventListener('custom:name', event => event.stopPropagation())
        up.emit($element[0], 'custom:name')
        expect(callback).not.toHaveBeenCalled()
      })

      it('triggers an event that can have its default prevented (IE11 bugfix)', function() {
        const element = fixture('.element')
        element.addEventListener('custom:name', event => event.preventDefault())
        const event = up.emit(element, 'custom:name')
        expect(event.defaultPrevented).toBe(true)
      })

      describe('custom event properties', function() {
        it('accepts custom event properties that can be accessed from an up.on() handler', function() {
          let emittedEvent = undefined
          up.on('foo', event => emittedEvent = event)

          up.emit('foo', { customField: 'custom-value' })

          expect(emittedEvent.customField).toEqual('custom-value')
        })
      })

      it('accepts custom event properties that can be accessed from an jQuery.on() handler', function() {
        let emittedEvent = undefined
        $(document).on('foo', event => emittedEvent = event.originalEvent)

        up.emit('foo', { customField: 'custom-value' })

        expect(emittedEvent.customField).toEqual('custom-value')
      })

      it('accepts custom event properties that can be accessed from an addEventListener() handler', function() {
        let emittedEvent = undefined
        document.addEventListener('foo', event => emittedEvent = event)

        up.emit('foo', { customField: 'custom-value' })

        expect(emittedEvent.customField).toEqual('custom-value')
      })

//      it 'triggers an event on an element passed as { target } option', ->
//        emittedEvent = undefined
//        emittedElement = undefined
//
//        element = fixture('.element')
//
//        up.on 'foo', (event, element) ->
//          emittedEvent = event
//          emittedElement = element
//
//        up.emit('foo', target: element)
//
//        expect(emittedEvent).toBeDefined()
//        expect(emittedElement).toEqual(element)
//
//        expect(emittedEvent.target).toEqual(element)

      it('triggers an event on an element passed as the first argument', function() {
        let emittedEvent = undefined
        let emittedElement = undefined

        const element = fixture('.element')

        up.on('foo', function(event, element) {
          emittedEvent = event
          emittedElement = element
        })

        up.emit(element, 'foo')

        expect(emittedEvent).toBeDefined()
        expect(emittedElement).toEqual(element)

        expect(emittedEvent.target).toEqual(element)
      })
    })

    describe('up.event.assertEmitted()', function() {

      it('emits the event', function() {
        const eventListener = jasmine.createSpy('event listener')
        up.on('my:event', eventListener)
        up.event.assertEmitted('my:event', {key: 'value'})
        expect(eventListener).toHaveBeenCalledWith(jasmine.objectContaining({key: 'value'}), jasmine.anything(), jasmine.anything())
      })

      it('throws an AbortError if any listener calls event.preventDefault()', function() {
        const eventListener = event => event.preventDefault()
        up.on('my:event', eventListener)
        const fn = () => up.event.assertEmitted('my:event', {key: 'value'})
        expect(fn).toAbort()
      })
    })

    describe('up.event.halt()', function() {

      it('stops propagation of the given event to other event listeners on the same element', function() {
        const otherListenerBefore = jasmine.createSpy()
        const otherListenerAfter = jasmine.createSpy()
        const element = fixture('div')

        element.addEventListener('foo', otherListenerBefore)
        element.addEventListener('foo', up.event.halt)
        element.addEventListener('foo', otherListenerAfter)

        up.emit(element, 'foo')

        expect(otherListenerBefore).toHaveBeenCalled()
        expect(otherListenerAfter).not.toHaveBeenCalled()
      })

      it('stops the event from bubbling up the document tree', function() {
        const parent = fixture('div')
        const element = e.affix(parent, 'div')
        const parentListener = jasmine.createSpy()
        parent.addEventListener('foo', parentListener)
        element.addEventListener('foo', up.event.halt)

        up.emit(element, 'foo')

        expect(parentListener).not.toHaveBeenCalled()
      })

      it('prevents default on the event', function() {
        const element = fixture('div')
        element.addEventListener('foo', up.event.halt)
        const event = up.emit(element, 'foo')
        expect(event.defaultPrevented).toBe(true)
      })
    })

    describe('up.event.onEscape()', function() {

      it('runs the given callback when the user presses the Escape key', asyncSpec(function(next) {
        const callback = jasmine.createSpy()
        up.event.onEscape(callback)
        const element = fixture('.element')
        Trigger.keySequence(element, 'Escape')

        next(() => expect(callback).toHaveBeenCalled())
      })
      )

      it('does not run the given callback when the user presses another key', asyncSpec(function(next) {
        const callback = jasmine.createSpy()
        up.event.onEscape(callback)
        const element = fixture('.element')
        Trigger.keySequence(element, 'A')

        next(() => expect(callback).not.toHaveBeenCalled())
      })
      )
    })

    describe('up.event.isUnmodified()', function() {

      it('returns true for a click event with the left mouse button', function() {
        const event = Trigger.createMouseEvent('mousedown', {button: 0})
        expect(up.event.isUnmodified(event)).toBe(true)
      })

      it('returns false if the right mouse button is used', function() {
        const event = Trigger.createMouseEvent('mousedown', {button: 2})
        expect(up.event.isUnmodified(event)).toBe(false)
      })

      it('returns false if shift is pressed during the click', function() {
        const event = Trigger.createMouseEvent('mousedown', {shiftKey: 2})
        expect(up.event.isUnmodified(event)).toBe(false)
      })

      it('returns false if ctrl is pressed during the click', function() {
        const event = Trigger.createMouseEvent('mousedown', {ctrlKey: 2})
        expect(up.event.isUnmodified(event)).toBe(false)
      })

      it('returns false if meta is pressed during the click', function() {
        const event = Trigger.createMouseEvent('mousedown', {metaKey: 2})
        expect(up.event.isUnmodified(event)).toBe(false)
      })
    })

    describe('up.event.inputDevice', function() {

      // Clear any lingering effect of a previous example
      beforeEach(async function() {
        await wait()
      })

      describe('if no input event was registered', function() {
        it('defaults to "unknown"', function() {
          expect(up.event.inputDevice).toBe('unknown')
        })
      })

      describe('after a keyboard event was registered', function() {

        it('is "key" while typing without explicit focus', function() {
          const inputDeviceSpy = jasmine.createSpy('inputDevice spy')
          document.body.addEventListener('keydown', () => inputDeviceSpy(up.event.inputDevice))

          Trigger.keySequence(document.body, 'Enter')

          expect(inputDeviceSpy).toHaveBeenCalledWith('key')
        })

        it('reverts to "unknown" one task afterwards', async function() {
          Trigger.keySequence(document.body, 'Enter')

          expect(up.event.inputDevice).toBe('key')

          await wait()

          expect(up.event.inputDevice).toBe('unknown')
        })

        it('is "key" while typing into an input field', function() {
          const field = fixture('input[type=text][name=foo]')
          const inputDeviceSpy = jasmine.createSpy('inputDevice spy')
          field.addEventListener('keydown', () => inputDeviceSpy(up.event.inputDevice))

          field.focus()
          Trigger.keySequence(field, 'X')

          expect(inputDeviceSpy).toHaveBeenCalledWith('key')
        })

        it('is "key" while a link is clicked with the keyboard', function() {
          const link = fixture('a[href="#"]', {text: 'label'})
          const inputDeviceSpy = jasmine.createSpy('inputDevice spy')
          link.addEventListener('click', function(event) {
            inputDeviceSpy(up.event.inputDevice)
            event.preventDefault()
          })

          Trigger.clickLinkWithKeyboard(link)

          expect(inputDeviceSpy).toHaveBeenCalledWith('key')
        })
      })

      describe('after a mouse event was registered', function() {

        it('is "pointer" while clicking an element', function() {
          const link = fixture('a[href="#"]', {text: 'label'})
          const inputDeviceSpy = jasmine.createSpy('inputDevice spy')
          link.addEventListener('click', function(event) {
            inputDeviceSpy(up.event.inputDevice)
            event.preventDefault()
          })

          Trigger.clickSequence(link)

          expect(inputDeviceSpy).toHaveBeenCalledWith('pointer')
        })

        it('reverts to "unknown" one task afterwards', async function() {
          const link = fixture('a[href="#"]', {text: 'label'})

          Trigger.clickSequence(link)

          expect(up.event.inputDevice).toBe('pointer')

          await wait()

          expect(up.event.inputDevice).toBe('unknown')
        })

        it('is "pointer" during a pointerdown sequence on an element', function() {
          const link = fixture('a[href="#"]', {text: 'label'})
          const inputDeviceSpy = jasmine.createSpy('inputDevice spy')
          link.addEventListener('mousedown', _event => inputDeviceSpy(up.event.inputDevice))

          Trigger.pointerdownSequence(link)

          expect(inputDeviceSpy).toHaveBeenCalledWith('pointer')
        })
      })
    })

  })


  describe('unobtrusive behavior', function() {

    describe('[up-emit]', function() {

      it('emits an event of the given type when its link is clicked', function() {
        const link = up.hello(fixture("a[up-emit='foo']", {text: 'label'}))
        const fooListener = jasmine.createSpy('fooListener')
        link.addEventListener('foo', fooListener)

        Trigger.clickSequence(link)

        expect(fooListener).toHaveBeenCalled()
      })

      it('emits an event of the given type when its button is clicked', function() {
        const button = up.hello(fixture("button[up-emit='foo']", {text: 'label'}))
        const fooListener = jasmine.createSpy('fooListener')
        button.addEventListener('foo', fooListener)

        Trigger.clickSequence(button)

        expect(fooListener).toHaveBeenCalled()
      })

      it('emits an event of the given type when its input[type=button] is clicked', function() {
        const input = up.hello(fixture("input[type=button][up-emit='foo']", {text: 'label'}))
        const fooListener = jasmine.createSpy('fooListener')
        input.addEventListener('foo', fooListener)

        Trigger.clickSequence(input)

        expect(fooListener).toHaveBeenCalled()
      })

      it('emits an event of the given type when its [up-clickable] is clicked', function() {
        const clickable = up.hello(fixture("span[up-clickable][up-emit='foo']", {text: 'label'}))
        const fooListener = jasmine.createSpy('fooListener')
        clickable.addEventListener('foo', fooListener)

        Trigger.clickSequence(clickable)

        expect(fooListener).toHaveBeenCalled()
      })

      it('allows to pass event props as [up-emit-props]', function() {
        const link = up.hello(fixture(`a[up-emit='foo'][up-emit-props='${JSON.stringify({key: 'value'})}']`, {text: 'label'}))
        const fooListener = jasmine.createSpy('fooListener')
        link.addEventListener('foo', fooListener)

        Trigger.clickSequence(link)

        expect(fooListener).toHaveBeenCalled()
        expect(fooListener.calls.mostRecent().args[0]).toBeEvent('foo', {key: 'value'})
      })

      it('does not emit the event if the right mouse button is used', asyncSpec(function(next) {
          const link = up.hello(fixture("a[up-emit='foo']", {text: 'label'}))
          const fooListener = jasmine.createSpy('fooListener')
          link.addEventListener('foo', fooListener)

          Trigger.clickSequence(link, {button: 2})

          next(() => expect(fooListener).not.toHaveBeenCalled())
        })
      )

      it('does not emit the event if ctrl is pressed during the click', asyncSpec(function(next) {
          const link = up.hello(fixture("a[up-emit='foo']", {text: 'label'}))
          const fooListener = jasmine.createSpy('fooListener')
          link.addEventListener('foo', fooListener)

          Trigger.clickSequence(link, {ctrlKey: true})

          next(() => expect(fooListener).not.toHaveBeenCalled())
        })
      )

      it('emits the event on mousedown when the link is [up-instant]', asyncSpec(function(next) {
          const link = up.hello(fixture("a[href='#'][up-emit='foo'][up-instant]", { text: 'label' }))
          const fooListener = jasmine.createSpy('fooListener')
          link.addEventListener('foo', fooListener)

          Trigger.mousedown(link)

          next(() => expect(fooListener.calls.count()).toBe(1))

          Trigger.click(link)

          next(() => expect(fooListener.calls.count()).toBe(1))
        })
      )

      it('emits the event on Enter for keyboard users', function() {
        const link = up.hello(fixture("a[up-emit='foo']", {text: 'label'}))
        const fooListener = jasmine.createSpy('fooListener')
        link.addEventListener('foo', fooListener)

        Trigger.keySequence(link, 'Enter')

        expect(fooListener).toHaveBeenCalled()
      })

      it('has a pointer cursor on an <a> element', function() {
        const link = up.hello(fixture("a[up-emit='foo']", {text: 'label'}))
        expect(link).toHaveCursorStyle('pointer')
      })

      describe('on a non-interactive element', function() {

        it('is focusable for keyboard users', function() {
          const fauxButton = up.hello(fixture("a[up-emit='foo']", {text: 'label'}))
          expect(fauxButton).toBeKeyboardFocusable()
        })

        it('gets a [role] attribute', function() {
          const fauxButton = up.hello(fixture("span[up-emit='foo']", {text: 'label'}))
          expect(fauxButton).toHaveAttribute('role', 'button')
        })

        it('emits an event on Enter for keyboard users', function() {
          const fauxButton = up.hello(fixture("span[up-emit='foo']", {text: 'label'}))
          const fooListener = jasmine.createSpy('fooListener')
          fauxButton.addEventListener('foo', fooListener)

          Trigger.keySequence(fauxButton, 'Enter')

          expect(fooListener).toHaveBeenCalled()
        })

        it('emits an event on Space for keyboard users', function() {
          const fauxButton = up.hello(fixture("span[up-emit='foo']", {text: 'label'}))
          const fooListener = jasmine.createSpy('fooListener')
          fauxButton.addEventListener('foo', fooListener)

          Trigger.keySequence(fauxButton, 'Space')

          expect(fooListener).toHaveBeenCalled()
        })

      })

      describe('when the emitted event is prevented', function() {

        it("prevents the click event's default", asyncSpec(function(next) {
          const link = up.hello(fixture("a[up-emit='foo']", {text: 'label'}))
          let clickEvent = null
          link.addEventListener('click', event => clickEvent = event)
          link.addEventListener('foo', event => event.preventDefault())

          Trigger.clickSequence(link)

          next(() => expect(clickEvent.defaultPrevented).toBe(true))
        })
        )

      })

      describe('when the emitted event is stopped from propagation', function() {
        it('prevents an Unpoly link from being followed', asyncSpec(function(next) {
          const link = up.hello(fixture("a[up-emit='foo'][href='/path'][up-follow]", {text: 'label'}))
          const followListener = jasmine.createSpy('follow listener')
          link.addEventListener('up:link:follow', followListener)
          link.addEventListener('foo', event => up.event.halt(event))

          Trigger.clickSequence(link)

          next(() => expect(followListener).not.toHaveBeenCalled())
        })
        )
      })
    })
  })
})
