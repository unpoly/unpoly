u = up.util
e = up.element
$ = jQuery

describe 'up.event', ->
  
  describe 'JavaScript functions', ->

    describe 'up.on', ->

      it 'registers a delagating event listener to the document, which passes the element as a second argument to the listener', asyncSpec (next) ->
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

      it 'allows to bind the listener to a given element', asyncSpec (next) ->
        element1 = fixture('.element')
        element2 = fixture('.element')
        listener = jasmine.createSpy()
        up.on(element1, 'click', listener)
        Trigger.click(element1)

        next ->
          expect(listener).toHaveBeenCalledWith(
            jasmine.any(MouseEvent),
            element1,
            {}
          )
          expect(listener.calls.count()).toBe(1)

      it 'allows to pass a function that returns a selector', asyncSpec (next) ->
        foo = fixture('.foo')
        bar = fixture('.bar')

        @selector = '.foo'
        selectorFn = => @selector

        listener = jasmine.createSpy('dynamic listener')
        up.on('click', selectorFn, listener)

        Trigger.click(foo)

        next =>
          expect(listener.calls.count()).toBe(1)

          @selector = '.bar'

          Trigger.click(foo)

        next =>
          # Selector no longer matches event target, so the listener is not called
          expect(listener.calls.count()).toBe(1)

          Trigger.click(bar)

        next =>
          # Selector again matches event target
          expect(listener.calls.count()).toBe(2)

      it 'allows to bind the listener to a given element while also passing a selector', asyncSpec (next) ->
        element1 = fixture('.element.one')
        element2 = fixture('.element.two')
        element2Child1 = e.affix(element2, '.child.one')
        element2Child2 = e.affix(element2, '.child.two')
        listener = jasmine.createSpy('event listener')
        up.on(element2, 'click', '.one', listener)

        Trigger.click(element2Child1)

        next ->
          expect(listener).toHaveBeenCalledWith(
            jasmine.any(MouseEvent),
            element2Child1,
            {}
          )
          expect(listener.calls.count()).toBe(1)


      it 'allows to bind the listener to an array of elements at once', asyncSpec (next) ->
        element1 = fixture('.element')
        element2 = fixture('.element')
        listener = jasmine.createSpy()

        unbindAll = up.on([element1, element2], 'click', listener)

        Trigger.click(element1)

        next =>
          expect(listener.calls.count()).toBe(1)
          expect(listener.calls.argsFor(0)[1]).toBe(element1)

          Trigger.click(element2)

        next =>
          expect(listener.calls.count()).toBe(2)
          expect(listener.calls.argsFor(1)[1]).toBe(element2)

          unbindAll()

          Trigger.click(element1)
          Trigger.click(element2)

        next =>
          expect(listener.calls.count()).toBe(2)

      it 'allows to explicitly bind a listener to the document', asyncSpec (next) ->
        listener = jasmine.createSpy()
        up.on(document, 'foo', listener)
        up.emit(document, 'foo')

        next ->
          expect(listener).toHaveBeenCalledWith(
            jasmine.any(Event),
            document,
            {}
          )
          expect(listener.calls.count()).toBe(1)

      it 'allows to bind a listener to the window', asyncSpec (next) ->
        listener = jasmine.createSpy()
        up.on(window, 'foo', listener)
        up.emit(window, 'foo')

        next ->
          expect(listener).toHaveBeenCalledWith(
            jasmine.any(Event),
            window,
            {}
          )
          expect(listener.calls.count()).toBe(1)

      it 'registers the listener to multiple, space-separated events', ->
        listener = jasmine.createSpy()

        up.on 'foo bar', listener

        up.emit('foo')
        expect(listener.calls.count()).toEqual(1)

        up.emit('bar')
        expect(listener.calls.count()).toEqual(2)

#      it 'registers the listener to an array of event names', ->
#        listener = jasmine.createSpy()
#
#        up.on ['foo', 'bar'], listener
#
#        up.emit('foo')
#        expect(listener.calls.count()).toEqual(1)
#
#        up.emit('bar')
#        expect(listener.calls.count()).toEqual(2)

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

      it 'allows to register the same callback for different event names (bugfix)', ->
        callback = ->
        register = ->
          up.on('foo', callback)
          up.on('bar', callback)
        expect(register).not.toThrowError()

      it 'allows to register the same callback for different elements (bugfix)', ->
        element1 = fixture('.element1')
        element2 = fixture('.element2')
        callback = ->
        register = ->
          up.on(element1, 'foo', callback)
          up.on(element2, 'foo', callback)
        expect(register).not.toThrowError()

      it 'allows to register the same callback for different selectors (bugfix)', ->
        callback = ->
        register = ->
          up.on('foo', '.one', callback)
          up.on('foo', '.two', callback)
        expect(register).not.toThrowError()

      it 'does not throw an error if a callback is registered, unregistered and registered a second time', ->
        callback = ->
        register = -> up.on 'foo', callback
        unregister = -> up.off 'foo', callback
        register()
        unregister()
        expect(register).not.toThrowError()

      describe 'when a listener throws an error', ->
        allowGlobalErrors()

        it 'does not prevent other event listeners from being called', ->
          nativeCallbackBefore = jasmine.createSpy('native callback before')
          upCallbackBefore = jasmine.createSpy('Unpoly callback before')
          crashingUpCallback = -> throw new Error('error from crashing Unpoly callback')
          upCallbackAfter = jasmine.createSpy('Unpoly callback after')
          nativeCallbackAfter = jasmine.createSpy('native callback after')

          document.addEventListener('foo', nativeCallbackBefore)
          up.on('foo', upCallbackBefore)
          up.on('foo', crashingUpCallback)
          up.on('foo', upCallbackAfter)
          document.addEventListener('foo', nativeCallbackAfter)

          emit = -> up.emit('foo')

          expect(emit).not.toThrowError()

          expect(nativeCallbackBefore).toHaveBeenCalled()
          expect(upCallbackBefore).toHaveBeenCalled()
          expect(upCallbackAfter).toHaveBeenCalled()
          expect(nativeCallbackAfter).toHaveBeenCalled()

          # Since we're not using up.on we need to clean up manually
          document.removeEventListener('foo', nativeCallbackBefore)
          document.removeEventListener('foo', nativeCallbackAfter)

      describe 'with { passive } option', ->

        describeCapability 'canPassiveEventListener', ->

          it 'registers a passive event listener', ->
            element = fixture('.element')
            spyOn(element, 'addEventListener')
            listener = ->

            up.on(element, 'my:event', { passive: true }, listener)

            expect(element.addEventListener).toHaveBeenCalledWith('my:event', jasmine.any(Function), { passive: true })

        describeFallback 'canPassiveEventListener', ->

          it 'registers a non-passive event listener', ->
            element = fixture('.element')
            spyOn(element, 'addEventListener')
            listener = ->

            up.on(element, 'my:event', { passive: true }, listener)

            expect(element.addEventListener).toHaveBeenCalledWith('my:event', jasmine.any(Function))

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

      if up.migrate.loaded
        it 'allows to bind and unbind events by their old, deprecated name', ->
          up.migrate.renamedEvent('up:spec:old', 'up:spec:new')

          warnSpy = spyOn(up, 'warn')
          listener = jasmine.createSpy('listener')

          # Reister listener for the old event name
          up.on('up:spec:old', listener)
          expect(warnSpy).toHaveBeenCalled()

          # Emit event with new name and see that it invokes the legacy listener
          up.emit('up:spec:new')
          expect(listener.calls.count()).toBe(1)

          # Check that up.off works with the old event name
          up.off('up:spec:old', listener)

          up.emit('up:spec:new')
          expect(listener.calls.count()).toBe(1)


    describe 'up.$on', ->

      it 'registers a delagating event listener to the document body, which passes a jQuery-wrapped element as a second argument to the listener', asyncSpec (next) ->
        fixture('.container[data-mark=container] .child[data-mark=child]')
        observeClass = jasmine.createSpy()
        up.$on 'click', '.child', (event, $element) ->
          observeClass($element.attr('data-mark'))

        Trigger.click($('.container'))
        Trigger.click($('.child'))

        next =>
          expect(observeClass).not.toHaveBeenCalledWith('container')
          expect(observeClass).toHaveBeenCalledWith('child')


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

      it 'allows to unregister a single event from a group of events that were registered in a single up.on call', asyncSpec (next) ->
        listener = jasmine.createSpy()
        element = fixture('.element')
        up.on(element, 'mouseover mouseout', listener)

        up.off(element, 'mouseover', listener)
        Trigger.mouseover(element)

        next ->
          expect(listener.calls.count()).toBe(0)

          Trigger.mouseout(element)

        next ->
          expect(listener.calls.count()).toBe(1)

          up.off(element, 'mouseout', listener)

          Trigger.mouseout(element)

        next =>
          expect(listener.calls.count()).toBe(1)

      it 'allows to unregister a single element from a group of elements that were registered in a single up.on call', asyncSpec (next) ->
        listener = jasmine.createSpy()
        element1 = fixture('.element1')
        element2 = fixture('.element2')

        up.on([element1, element2], 'mouseover', listener)

        up.off(element1, 'mouseover', listener)
        Trigger.mouseover(element1)

        next ->
          expect(listener.calls.count()).toBe(0)

          Trigger.mouseover(element2)

        next ->
          expect(listener.calls.count()).toBe(1)

          up.off(element2, 'mouseover', listener)

          Trigger.mouseover(element2)

        next =>
          expect(listener.calls.count()).toBe(1)

#      it 'throws an error if the given event listener was not registered through up.on', ->
#        someFunction = ->
#        offing = -> up.off 'click', '.child', someFunction
#        expect(offing).toThrowError(/(not|never) registered/i)


    describe 'up.$off', ->

      it 'unregisters an event listener previously registered through up.$on', asyncSpec (next) ->
        $child = $fixture('.child')
        clickSpy = jasmine.createSpy()
        up.$on 'click', '.child', clickSpy
        Trigger.click($('.child'))
        up.$off 'click', '.child', clickSpy
        Trigger.click($('.child'))

        next =>
          expect(clickSpy.calls.count()).toEqual(1)


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

      it 'triggers an event that bubbles', ->
        $parent = $fixture('.parent')
        $element = $parent.affix('.element')
        callback = jasmine.createSpy('event handler')
        $parent[0].addEventListener('custom:name', callback)
        up.emit($element[0], 'custom:name')
        expect(callback).toHaveBeenCalled()

      it 'triggers an event that can be stopped from propagating', ->
        $parent = $fixture('.parent')
        $element = $parent.affix('.element')
        callback = jasmine.createSpy('event handler')
        $parent[0].addEventListener('custom:name', callback)
        $element[0].addEventListener('custom:name', (event) -> event.stopPropagation())
        up.emit($element[0], 'custom:name')
        expect(callback).not.toHaveBeenCalled()

      it 'triggers an event that can have its default prevented (IE11 bugfix)', ->
        element = fixture('.element')
        element.addEventListener('custom:name', (event) -> event.preventDefault())
        event = up.emit(element, 'custom:name')
        expect(event.defaultPrevented).toBe(true)

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

#      it 'triggers an event on an element passed as { target } option', ->
#        emittedEvent = undefined
#        emittedElement = undefined
#
#        element = fixture('.element')
#
#        up.on 'foo', (event, element) ->
#          emittedEvent = event
#          emittedElement = element
#
#        up.emit('foo', target: element)
#
#        expect(emittedEvent).toBeDefined()
#        expect(emittedElement).toEqual(element)
#
#        expect(emittedEvent.target).toEqual(element)

      it 'triggers an event on an element passed as the first argument', ->
        emittedEvent = undefined
        emittedElement = undefined

        element = fixture('.element')

        up.on 'foo', (event, element) ->
          emittedEvent = event
          emittedElement = element

        up.emit(element, 'foo')

        expect(emittedEvent).toBeDefined()
        expect(emittedElement).toEqual(element)

        expect(emittedEvent.target).toEqual(element)

    describe 'up.event.whenEmitted', ->

      it 'emits the event and fulfills the returned promise when no listener calls event.preventDefault()', (done) ->
        eventListener = jasmine.createSpy('event listener')
        up.on('my:event', eventListener)
        promise = up.event.whenEmitted('my:event', key: 'value')
        promiseState(promise).then (result) ->
          expect(eventListener).toHaveBeenCalledWith(jasmine.objectContaining(key: 'value'), jasmine.anything(), jasmine.anything())
          expect(result.state).toEqual('fulfilled')
          done()

      it 'emits the event and rejects the returned promise when any listener calls event.preventDefault()', (done) ->
        eventListener = (event) -> event.preventDefault()
        up.on('my:event', eventListener)
        promise = up.event.whenEmitted('my:event', key: 'value')
        promiseState(promise).then (result) ->
          expect(result.state).toEqual('rejected')
          done()

#      describe '(onEmitted callback)', ->
#
#        it 'allows to pass a function that is called sync after the event was emitted'
#
#        it 'allows the function to return a promise that will delay the promise returned by whenEmitted'
#
#        it 'does not call the function if the event was prevented'

    describe 'up.event.halt', ->

      it 'stops propagation of the given event to other event listeners on the same element', ->
        otherListenerBefore = jasmine.createSpy()
        otherListenerAfter = jasmine.createSpy()
        element = fixture('div')

        element.addEventListener('foo', otherListenerBefore)
        element.addEventListener('foo', up.event.halt)
        element.addEventListener('foo', otherListenerAfter)

        up.emit(element, 'foo')

        expect(otherListenerBefore).toHaveBeenCalled()
        expect(otherListenerAfter).not.toHaveBeenCalled()

      it 'stops the event from bubbling up the document tree', ->
        parent = fixture('div')
        element = e.affix(parent, 'div')
        parentListener = jasmine.createSpy()
        parent.addEventListener('foo', parentListener)
        element.addEventListener('foo', up.event.halt)

        up.emit(element, 'foo')

        expect(parentListener).not.toHaveBeenCalled()

      it 'prevents default on the event', ->
        element = fixture('div')
        element.addEventListener('foo', up.event.halt)
        event = up.emit(element, 'foo')
        expect(event.defaultPrevented).toBe(true)

    describe 'up.event.onEscape', ->

      it 'runs the given callback when the user presses the Escape key', asyncSpec (next) ->
        callback = jasmine.createSpy()
        up.event.onEscape(callback)
        element = fixture('.element')
        Trigger.keySequence(element, 'Escape')

        next ->
          expect(callback).toHaveBeenCalled()

      it 'runs the given callback when IE/Edge emits a KeyboardEvent with { key: "Esc" } instead of { key: "Escape" }', asyncSpec (next) ->
          callback = jasmine.createSpy()
          up.event.onEscape(callback)
          element = fixture('.element')
          Trigger.keySequence(element, 'Esc')

          next ->
            expect(callback).toHaveBeenCalled()

      it 'does not run the given callback when the user presses another key', asyncSpec (next) ->
        callback = jasmine.createSpy()
        up.event.onEscape(callback)
        element = fixture('.element')
        Trigger.keySequence(element, 'A')

        next ->
          expect(callback).not.toHaveBeenCalled()

  describe 'unobtrusive behavior', ->

    describe 'a[up-emit]', ->

      it 'emits an event of the given type when the link is clicked', ->
        link = up.hello(fixture("a[up-emit='foo']", text: 'label'))
        fooListener = jasmine.createSpy('fooListener')
        link.addEventListener('foo', fooListener)

        Trigger.clickSequence(link)

        expect(fooListener).toHaveBeenCalled()

      it 'allows to pass event props as [up-emit-props]', ->
        link = up.hello(fixture("a[up-emit='foo'][up-emit-props='#{JSON.stringify(key: 'value')}']", text: 'label'))
        fooListener = jasmine.createSpy('fooListener')
        link.addEventListener('foo', fooListener)

        Trigger.clickSequence(link)

        expect(fooListener).toHaveBeenCalled()
        expect(fooListener.calls.mostRecent().args[0]).toBeEvent('foo', key: 'value')

      # IE does not call JavaScript and always performs the default action on right clicks
      unless AgentDetector.isIE() || AgentDetector.isEdge()
        it 'does not emit the event if the right mouse button is used', asyncSpec (next) ->
          link = up.hello(fixture("a[up-emit='foo']", text: 'label'))
          fooListener = jasmine.createSpy('fooListener')
          link.addEventListener('foo', fooListener)

          Trigger.clickSequence(link, button: 2)

          next ->
            expect(fooListener).not.toHaveBeenCalled()

      it 'does not emit the event if ctrl is pressed during the click', asyncSpec (next) ->
        link = up.hello(fixture("a[up-emit='foo']", text: 'label'))
        fooListener = jasmine.createSpy('fooListener')
        link.addEventListener('foo', fooListener)

        Trigger.clickSequence(link, ctrlKey: true)

        next ->
          expect(fooListener).not.toHaveBeenCalled()

      it 'emits the event on mousedown when the link is [up-instant]', asyncSpec (next) ->
        link = up.hello(fixture("a[up-emit='foo'][up-instant]", text: 'label'))
        fooListener = jasmine.createSpy('fooListener')
        link.addEventListener('foo', fooListener)

        Trigger.mousedown(link)

        next ->
          expect(fooListener.calls.count()).toBe(1)

          # Trigger.click(link)

        next ->
          expect(fooListener.calls.count()).toBe(1)

      it 'emits the event on Enter for keyboard users', ->
        link = up.hello(fixture("a[up-emit='foo']", text: 'label'))
        fooListener = jasmine.createSpy('fooListener')
        link.addEventListener('foo', fooListener)

        Trigger.keySequence(link, 'Enter')

        expect(fooListener).toHaveBeenCalled()

      it 'is focusable for keyboard users', ->
        link = up.hello(fixture("a[up-emit='foo']", text: 'label'))
        expect(link).toBeKeyboardFocusable()

      describe 'when the emitted event is prevented', ->

        it "prevents the click event's default", asyncSpec (next) ->
          link = up.hello(fixture("a[up-emit='foo']", text: 'label'))
          clickEvent = null
          link.addEventListener('click', (event) -> clickEvent = event)
          link.addEventListener('foo', (event) -> event.preventDefault())

          Trigger.clickSequence(link)

          next ->
            expect(clickEvent.defaultPrevented).toBe(true)

      describe 'when the emitted event is stopped from propagation', ->

        it 'prevents an Unpoly link from being followed', asyncSpec (next) ->
          link = up.hello(fixture("a[up-emit='foo'][href='/path'][up-follow]", text: 'label'))
          followListener = jasmine.createSpy('follow listener')
          link.addEventListener('up:link:follow', followListener)
          link.addEventListener('foo', (event) -> up.event.halt(event))

          Trigger.clickSequence(link)

          next ->
            expect(followListener).not.toHaveBeenCalled()
