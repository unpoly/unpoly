u = up.util
e = up.element

describe 'up.layer', ->

  describe 'JavaScript functions', ->

    beforeEach ->
      # Provoke concurrency issues by enabling animations, but don't slow down tests too much
      up.motion.config.duration = 5

    describe 'up.layer.open()', ->

      it 'resolves to an up.Layer instance', (done) ->
        up.layer.open().then (value) ->
          expect(value).toEqual(jasmine.any(up.Layer))
          done()

      it 'opens a layer with empty content when neither { url, document, fragment, content } option is given', (done) ->
          up.layer.open().then (layer) ->
            expect(layer).toHaveText('')
            done()

      it 'closes existing overlays over the { baseLayer }', ->
        makeLayers(2)
        [root, oldOverlay] = up.layer.stack

        up.layer.open(baseLayer: 'root')

        [root, newOverlay] = up.layer.stack

        expect(newOverlay).not.toBe(oldOverlay)
        expect(oldOverlay.isOpen()).toBe(false)

      describe 'from a remote URL', ->

        it 'opens a new overlay loaded from a remote { url }', asyncSpec (next) ->
          up.layer.open(target: '.element', url: '/path')

          next =>
            expect(up.layer.count).toBe(1)
            expect(@lastRequest().url).toMatchURL('/path')

            @respondWith('<div class="element other-class">element text</div>')

          next =>
            element = document.querySelector('up-modal .element')
            expect(element).toBeGiven()
            expect(element).toHaveClass('other-class')
            expect(element).toHaveText('element text')

        it 'aborts a pending request targeting the main element in the current layer', asyncSpec (next) ->
          up.fragment.config.mainTargets.unshift('.root-element')
          fixture('.root-element')

          up.navigate('.root-element', url: '/path1')
          abortedURLs = []
          up.on 'up:request:aborted', (event) -> abortedURLs.push(event.request.url)

          next ->
            expect(abortedURLs).toBeBlank()

            up.layer.open(url: '/path2')

          next ->
            expect(abortedURLs.length).toBe(1)
            expect(abortedURLs[0]).toMatchURL('/path1')

        it 'does not abort a pending request targeting a non-main element in the current layer', asyncSpec (next) ->
          fixture('.root-element')

          up.navigate('.root-element', url: '/path1')
          abortedURLs = []
          up.on 'up:request:aborted', (event) -> abortedURLs.push(event.request.url)

          next ->
            expect(abortedURLs).toBeBlank()

            up.layer.open(url: '/path2')

          next ->
            expect(abortedURLs).toBeBlank()

        it 'aborts a previous pending request that would result in opening a new overlay', asyncSpec (next) ->
          up.layer.open(url: '/path1')
          abortedURLs = []
          up.on 'up:request:aborted', (event) -> abortedURLs.push(event.request.url)

          next ->
            expect(abortedURLs).toBeBlank()

            up.layer.open(url: '/path2')

          next ->
            expect(abortedURLs.length).toBe(1)
            expect(abortedURLs[0]).toMatchURL('/path1')

        describe 'when the server sends an X-Up-Events header', ->

          it 'emits these events', asyncSpec (next) ->
            up.layer.open(target: '.element', url: '/path')

            event1 = { type: 'foo', prop: 'bar '}
            event2 = { type: 'baz', prop: 'bam '}

            spyOn(up, 'emit').and.callThrough()

            next =>
              @respondWith
                responseHeaders: { 'X-Up-Events': JSON.stringify([event1, event2]) }
                responseText: '<div class="element"></div>'

            next ->
              expect(up.emit).toHaveBeenCalledWith(event1)
              expect(up.emit).toHaveBeenCalledWith(event2)

      describe 'from a string of HTML', ->

        it 'opens a new overlay with matching HTML extracted from the given as { document }', (done) ->
          layerPromise = up.layer.open(
            target: '.element',
            document: '<div class="element other-class">element text</div>'
          )

          layerPromise.then ->
            expect(up.layer.count).toBe(2)

            element = document.querySelector('up-modal .element')
            expect(element).toBeGiven()
            expect(element).toHaveClass('other-class')
            expect(element).toHaveText('element text')

            done()

        it 'derives a new overlay with a selector and outer HTML derived from the given { fragment } option', (done) ->
          layerPromise = up.layer.open(
            fragment: '<div class="element">element text</div>'
          )

          layerPromise.then ->
            expect(up.layer.count).toBe(2)

            element = document.querySelector('up-modal .element')
            expect(element).toBeGiven()
            expect(element).toHaveText('element text')

            done()

        it 'opens a new overlay from inner HTML given as { content }, constructing a container matching the { target }', (done) ->
          layerPromise = up.layer.open(
            target: '.element',
            content: 'element text'
          )

          layerPromise.then ->
            expect(up.layer.count).toBe(2)

            element = document.querySelector('up-modal .element')
            expect(element).toBeGiven()
            expect(element).toHaveText('element text')

            done()

        it 'opens an empty overlay if neither { document } nor { fragment } nor { content } is given', (done) ->
          layerPromise = up.layer.open(
            target: '.element'
          )

          layerPromise.then ->
            expect(up.layer.count).toBe(2)

            element = document.querySelector('up-modal .element')
            expect(element).toBeGiven()
            expect(element.innerText).toBeBlank()

            done()

        it 'has a sync effect', ->
          expect(up.layer.count).toBe(1)

          up.layer.open(target: '.element', content: '')

          expect(up.layer.count).toBe(2)

      describe 'animation', ->

        it 'uses the configured open animation', asyncSpec (next) ->
          up.motion.config.enabled = true
          up.layer.config.modal.openAnimation = 'fade-in'
          up.layer.config.modal.openDuration = 600

          up.layer.open({ mode: 'modal' })

          next.after 300, ->
            expect(document).toHaveSelector('up-modal')
            expect('up-modal-box').toHaveOpacity(0.5, 0.4)

          next.after 600, ->
            expect('up-modal-box').toHaveOpacity(1.0)

      describe 'events', ->

        it 'emits an up:layer:open event on the document before the new overlay opens', (done) ->
          expect(up.layer.count).toBe(1)

          up.on 'up:layer:open', (event) ->
            expect(up.layer.count).toBe(1)
            expect(event.target).toBe(document)
            expect(up.layer.current).toBe(up.layer.root)
            done()

          up.layer.open()
          expect(up.layer.count).toBe(2)

        it 'allows up:layer:open listeners to observe and manipulate layer options', ->
          up.on 'up:layer:open', (event) ->
            expect(event.layerOptions.mode).toBe('modal')
            event.layerOptions.mode = 'drawer'

          up.layer.open()
          expect(up.layer.count).toBe(2)
          expect(up.layer.mode).toBe('drawer')

        it 'emits an up:layer:opened event when the layer has opened', (done) ->
          expect(up.layer.count).toBe(1)

          up.on 'up:layer:opened', (event) ->
            expect(up.layer.count).toBe(2)
            expect(event.layer).toBe(up.layer.front)
            expect(event.target).toBe(up.layer.front.element)
            expect(up.layer.current).toBe(up.layer.front)
            done()

          up.layer.open()

      describe 'focus', ->

        it "focuses the new overlay's element", (done) ->
          assertFocus = ->
            expect(up.layer.current).toBeFocused()
            done()

          up.layer.open(target: '.element', onFinished: assertFocus)

        it 'focuses a CSS selector passed as { focus } option', (done) ->
          assertFocus =  ->
            child = document.querySelector('up-modal .element .child')
            expect(child).toBeGiven()
            expect(child).toBeFocused()
            done()

          up.layer.open(
            target: '.element',
            content: '<div class="child">child text</div>',
            focus: '.child',
            onFinished: assertFocus
          )

      describe 'history', ->

        beforeEach ->
          up.history.config.enabled = true

        it "prioritizes the mode's { history } config over up.fragment.config.navigateOptions.history (bugfix)", ->
          up.fragment.config.navigateOptions.history = false
          up.layer.config.modal.history = true

          up.layer.open(
            location: '/modal-location'
            fragment: '<div class="element">element text</div>'
            navigate: true # up.layer.open() is navigation by default, but let's be explicit here
          )

          expect(up.layer.isOverlay()).toBe(true)
          expect(up.layer.history).toBe(true)
          expect(location.href).toMatchURL('/modal-location')

        describe 'with { history: true }', ->

          it 'updates the browser location when the overlay opens', asyncSpec (next) ->
            up.layer.open(
              location: '/modal-location'
              fragment: '<div class="element">element text</div>'
              history: true
            )

            next ->
              expect(up.layer.isOverlay()).toBe(true)
              expect(up.layer.history).toBe(true)
              expect(location.href).toMatchURL('/modal-location')

          it 'does not update the brower location if the layer is not the front layer', asyncSpec (next) ->
            makeLayers [
              { target: '.root-element' },
              { target: '.overlay-element', location: '/modal-location', history: true }
            ]

            expect(up.layer.isOverlay()).toBe(true)
            expect(location.href).toMatchURL('/modal-location')

            up.navigate(layer: 'root', target: '.root-element', content: 'new text', location: '/new-root-location', peel: false, history: true)

            expect(location.href).toMatchURL('/modal-location')

            up.layer.dismiss()

            expect(up.layer.isRoot()).toBe(true)
            expect(location.href).toMatchURL('/new-root-location')

        describe 'with { history: false }', ->

          it 'does not update the browser location ', asyncSpec (next) ->
            originalLocation = location.href

            up.layer.open(
              target: '.element',
              history: false,
              location: '/modal-url'
            )

            next ->
              expect(up.layer.isOverlay()).toBe(true)
              expect(location.href).toMatchURL(originalLocation)

              # We can still ask the layer what location it displays
              expect(up.layer.location).toMatchURL('/modal-url')

          it 'does not let child layers update the browser location', asyncSpec (next) ->
            originalLocation = location.href

            up.layer.open(
              target: '.element',
              history: false,
              location: '/overlay1',
            )

            next ->
              expect(up.layer.isOverlay()).toBe(true)
              expect(location.href).toMatchURL(originalLocation)

              up.layer.open(
                target: '.element',
                history: true,
                location: '/overlay2',
              )

            next ->
              expect(location.href).toMatchURL(originalLocation)

        describe 'with { history: "auto" }', ->

          it 'gives the layer history if the initial overlay content is a main selector', asyncSpec (next) ->
            up.layer.config.modal.history = 'auto'
            up.fragment.config.mainTargets = ['.main']

            up.layer.open(mode: 'modal', history: 'auto', target: '.main')

            next ->
              expect(up.layer.mode).toEqual('modal')
              expect(up.layer.history).toBe(true)

          it 'does not give the layer history if initial overlay content is not a main selector', asyncSpec (next) ->
            up.layer.config.modal.history = 'auto'
            up.fragment.config.mainTargets = ['.main']

            up.layer.open(mode: 'modal', history: 'auto', target: '.other')

            next ->
              expect(up.layer.mode).toEqual('modal')
              expect(up.layer.history).toBe(false)

      describe 'context', ->

        it "sets the layer's initial context object from the { context } option", (done) ->
          up.layer.open(context: { key: 'value' }).then (overlay) ->
            expect(overlay.context).toEqual({ key: 'value' })
            done()

        it 'sets an empty object by default', (done) ->
          expect(up.layer.root.context).toEqual({})

          up.layer.open().then (overlay) ->
            expect(overlay.context).toEqual({})
            done()

        it 'sends the context object as an X-Up-Context header along with the request providing the initial overlay content', asyncSpec (next) ->
          up.layer.open(url: '/modal', context: { key: 'value' })

          next =>
            expect(@lastRequest().requestHeaders['X-Up-Context']).toMatchJSON({ key: 'value'})

        it 'allows the server to update the initial context object', asyncSpec (next) ->
          up.layer.open(url: '/modal', target: '.target', context: { linkKey: 'linkValue' })

          next =>
            @respondWithSelector('.target', responseHeaders: { 'X-Up-Context': JSON.stringify({ serverKey: 'serverValue'})})

          next ->
            expect(up.layer.get(1).context).toEqual({ linkKey: 'linkValue', serverKey: 'serverValue' })

      describe 'mode', ->

        it 'opens a new layer with the default mode from up.layer.config.mode', asyncSpec (next) ->
          up.layer.config.mode = 'cover'
          up.layer.open()

          next ->
            expect(up.layer.isOverlay()).toBe(true)
            expect(up.layer.mode).toEqual('cover')

        it 'opens a new layer with the given { mode }', asyncSpec (next) ->
          up.layer.open(mode: 'cover')

          next ->
            expect(up.layer.isOverlay()).toBe(true)
            expect(up.layer.mode).toEqual('cover')

        it "sends the layer's mode as an X-Up-Mode request header"

      describe 'styling', ->

        # maybe move this to the flavor specs

        it 'sets a { position } option as a [position] attribute', asyncSpec (next) ->
          up.layer.open(position: 'right')

          next ->
            expect(up.layer.element).toHaveAttribute('position', 'right')

        it 'sets a { size } option as a [size] attribute', asyncSpec (next) ->
          up.layer.open(size: 'small')

          next ->
            expect(up.layer.element).toHaveAttribute('size', 'small')

        it 'sets an { align } option as an [align] attribute', asyncSpec (next) ->
          up.layer.open(align: 'right')

          next ->
            expect(up.layer.element).toHaveAttribute('align', 'right')

        it 'sets a { class } option as a [class] of the overlay element', asyncSpec (next) ->
          up.layer.open(class: 'foo')

          next ->
            expect(up.layer.element).toHaveClass('foo')


      describe 'choice of target', ->

        beforeEach ->
          up.layer.config.any.mainTargets = []
          up.layer.config.overlay.mainTargets = []
          up.layer.config.modal.mainTargets = []

        it 'uses a selector given as { target } option', asyncSpec (next) ->
          up.layer.open(content: 'overlay text', target: '.target-from-option')

          next ->
            expect(up.layer.isOverlay()).toBe(true)
            expect(document).toHaveSelector('up-modal .target-from-option')

        it 'uses a target from up.layer.config.any.mainTargets', asyncSpec (next) ->
          up.layer.config.any.mainTargets.push('.target-from-config-dot-all')

          up.layer.open(content: 'overlay text')

          next ->
            expect(up.layer.isOverlay()).toBe(true)
            expect(document).toHaveSelector('up-modal .target-from-config-dot-all')

        it 'uses a target from up.layer.config.overlay.mainTargets', asyncSpec (next) ->
          up.layer.config.overlay.mainTargets.push('.target-from-config-dot-overlay')
          up.layer.config.any.mainTargets.push('.target-from-config-dot-all')

          up.layer.open(content: 'overlay text')

          next ->
            expect(up.layer.isOverlay()).toBe(true)
            expect(document).toHaveSelector('up-modal .target-from-config-dot-overlay')

        it "uses a target from up.layer.config.$mode.mainTargets, where $mode is the new overlay's mode", asyncSpec (next) ->
          up.layer.config.modal.mainTargets.push('.target-from-config-dot-modal')
          up.layer.config.overlay.mainTargets.push('.target-from-config-dot-overlay')
          up.layer.config.any.mainTargets.push('.target-from-config-dot-all')

          up.layer.open(content: 'overlay text')

          next ->
            expect(up.layer.isOverlay()).toBe(true)
            expect(document).toHaveSelector('up-modal .target-from-config-dot-modal')

      describe 'close conditions', ->

        beforeEach ->
          up.motion.config.enabled = false

        describe '{ dismissable }', ->

          describe 'with { dismissable: true }', ->

            it 'sets all other dismissable options to true', (done) ->
              up.layer.open(dismissable: true).then (layer) ->
                expect(layer.dismissable).toMatchList ['button', 'key', 'outside']
                done()

           describe 'with { dismissable: false }', ->

            it 'sets all other dismissable options to false if passed { dismissable: false }', (done) ->
              up.layer.open(dismissable: false).then (layer) ->
                expect(layer.dismissable).toEqual []
                done()

          describe 'with { dismissable: "button" }', ->

            it 'adds a button that dimisses the layer', (done) ->
              up.layer.open(dismissable: 'button').then (layer) ->
                expect(layer.element).toHaveSelector('up-modal-dismiss[up-dismiss]')
                done()

          describe 'without { dismissable: "button" }', ->

            it 'does not add a button that dimisses the layer', (done) ->
              up.layer.open(dismissable: false).then (layer) ->
                expect(layer.element).not.toHaveSelector('up-modal-dismiss[up-dismiss]')
                done()

          describe 'with { dismissable: "key" }', ->

            it 'lets the user close the layer by pressing escape', asyncSpec (next) ->
              up.layer.open(dismissable: "key")

              next ->
                expect(up.layer.isOverlay()).toBe(true)

                Trigger.escapeSequence(document.body)

              next ->
                expect(up.layer.isOverlay()).toBe(false)

          describe 'without { dismissable: "key" }', ->

            it 'does not let the user close the layer by pressing escape', asyncSpec (next) ->
              up.layer.open(dismissable: false)

              next ->
                expect(up.layer.isOverlay()).toBe(true)

                Trigger.escapeSequence(document.body)

              next ->
                expect(up.layer.isOverlay()).toBe(true)

          describe 'with { dismissable: "outside" }', ->

            it 'lets the user close a layer with viewport by clicking on its viewport (which sits over the backdrop and will receive all clicks outside the frame)', asyncSpec (next) ->
              up.layer.open(dismissable: 'outside', mode: 'modal')

              next ->
                expect(up.layer.isOverlay()).toBe(true)

                Trigger.clickSequence(up.layer.current.viewportElement, { clientX: 0, clientY: 0 })

              next ->
                expect(up.layer.isOverlay()).toBe(false)

            it 'lets the user close a layer with tether by clicking on its opener', asyncSpec (next) ->
              opener = fixture('a', text: 'label')
              up.layer.open(dismissable: 'outside', mode: 'popup', origin: opener)

              next ->
                expect(up.layer.isOverlay()).toBe(true)

                Trigger.clickSequence(opener)

              next ->
                expect(up.layer.isOverlay()).toBe(false)

          describe 'without { dismissable: "outside" }', ->

            it 'does not let the user close a layer with viewport by clicking on its viewport (which sits over the backdrop and will receive all clicks outside the frame)', asyncSpec (next) ->
              up.layer.open(dismissable: false, mode: 'modal')

              next ->
                expect(up.layer.isOverlay()).toBe(true)

                Trigger.clickSequence(up.layer.current.viewportElement, { clientX: 0, clientY: 0 })

              next ->
                expect(up.layer.isOverlay()).toBe(true)

        describe '{ onAccepted }', ->

          it 'runs the given callback when they layer is accepted', asyncSpec (next) ->
            callback = jasmine.createSpy('onAccepted callback')

            up.layer.open({ onAccepted: callback })

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.layer.accept('acceptance value')

            next ->
              expect(callback).toHaveBeenCalled()
              expect(callback.calls.mostRecent().args[0]).toBeEvent('up:layer:accepted', value: 'acceptance value')

          it 'does not run the given callback when the layer is dismissed', asyncSpec (next) ->
            callback = jasmine.createSpy('onAccepted callback')

            up.layer.open({ onAccepted: callback })

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.layer.dismiss('dismissal value')

            next ->
              expect(callback).not.toHaveBeenCalled()

          it 'sets up.layer.current to the layer that opened the overlay', asyncSpec (next) ->
            rootLayer = up.layer.root
            baseLayerSpy = jasmine.createSpy('current layer spy')

            up.layer.open({ onAccepted: -> baseLayerSpy(up.layer.current) })

            next ->
              expect(up.layer.current.mode).toEqual('modal')
              up.layer.accept()

            next ->
              expect(baseLayerSpy).toHaveBeenCalledWith(rootLayer)

        describe '{ onDismissed }', ->

          it 'runs the given callback when they layer is dimissed', asyncSpec (next) ->
            callback = jasmine.createSpy('onDismissed callback')

            up.layer.open({ onDismissed: callback })

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.layer.dismiss('dismissal value')

            next ->
              expect(callback).toHaveBeenCalled()
              expect(callback.calls.mostRecent().args[0]).toBeEvent('up:layer:dismissed', value: 'dismissal value')

          it 'does not run the given callback when the layer is accepted', asyncSpec (next) ->
            callback = jasmine.createSpy('onDismissed callback')

            up.layer.open({ onDismissed: callback })

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.layer.accept('acceptance value')

            next ->
              expect(callback).not.toHaveBeenCalled()

          it 'sets up.layer.current to the layer that opened the overlay', asyncSpec (next) ->
            rootLayer = up.layer.root
            baseLayerSpy = jasmine.createSpy('current layer spy')

            up.layer.open({ onDismissed: -> baseLayerSpy(up.layer.current) })

            next ->
              expect(up.layer.current.mode).toEqual('modal')
              up.layer.dismiss()

            next ->
              expect(baseLayerSpy).toHaveBeenCalledWith(rootLayer)

        describe '{ acceptEvent }', ->

          it 'accepts the layer when an event of the given type was emitted on the layer', asyncSpec (next) ->
            callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({ onAccepted: callback, acceptEvent: 'foo' })

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.layer.emit('foo')

            next ->
              expect(callback).toHaveBeenCalled()

          it 'uses the event object as the acceptance value', asyncSpec (next) ->
            fooEvent = up.event.build('foo')
            callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({ onAccepted: callback, acceptEvent: 'foo' })

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.layer.emit(fooEvent)

            next ->
              expect(callback).toHaveBeenCalled()
              expect(callback.calls.mostRecent().args[0]).toBeEvent('up:layer:accepted')
              expect(callback.calls.mostRecent().args[0].value).toBe(fooEvent)

          it 'does not accept the layer when the given event was emitted on another layer', asyncSpec (next) ->
            callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({ onAccepted: callback, acceptEvent: 'foo' })

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.layer.root.emit('foo')

            next ->
              expect(callback).not.toHaveBeenCalled()

          it 'accepts the layer when one of multiple space-separated event types was emitted on the layer', asyncSpec (next) ->
            callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({ onAccepted: callback, acceptEvent: 'foo bar baz' })

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.layer.emit('bar')

            next ->
              expect(callback).toHaveBeenCalled()

        describe '{ dismissEvent }', ->

          it 'dismisses the layer when an event of the given type was emitted on the layer', asyncSpec (next) ->
            callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({ onDismissed: callback, dismissEvent: 'foo' })

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.layer.emit('foo')

            next ->
              expect(callback).toHaveBeenCalled()

          it 'uses the event object as the dismissal value', asyncSpec (next) ->
            fooEvent = up.event.build('foo')
            callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({ onDismissed: callback, dismissEvent: 'foo' })

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.layer.emit(fooEvent)

            next ->
              expect(callback).toHaveBeenCalled()
              expect(callback.calls.mostRecent().args[0]).toBeEvent('up:layer:dismissed')
              expect(callback.calls.mostRecent().args[0].value).toBe(fooEvent)

          it 'does not dismiss the layer when the given event was emitted on another layer', asyncSpec (next) ->
            callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({ onDismissed: callback, dismissEvent: 'foo' })

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.layer.root.emit('foo')

            next ->
              expect(callback).not.toHaveBeenCalled()

          it 'dismisses the layer when one of multiple space-separated event types was emitted on the layer', asyncSpec (next) ->
            callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({ onDismissed: callback, dismissEvent: 'foo bar baz' })

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.layer.emit('bar')

            next ->
              expect(callback).toHaveBeenCalled()

        describe '{ acceptLocation }', ->

          it 'accepts the layer when the layer has reached the given location', asyncSpec (next) ->
            callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content'
              location: '/start-location',
              onAccepted: callback,
              acceptLocation: '/acceptable-location'
            })

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.navigate('.overlay-content', content: 'other content', location: '/other-location')

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.navigate('.overlay-content', content: 'acceptable content', location: '/acceptable-location')

            next ->
              value = { location: u.normalizeURL('/acceptable-location') }
              expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value }))

          it 'accepts the layer when the layer has reached the given location pattern', asyncSpec (next) ->
            callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content'
              location: '/start-location',
              onAccepted: callback,
              acceptLocation: '/users /records/* /articles'
            })

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.navigate('.overlay-content', content: 'acceptable content', location: '/records/new')

            next ->
              value = { location: u.normalizeURL('/records/new') }
              expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value }))

          it 'parses a location pattern of named placeholders to produce an acceptance value', asyncSpec (next) ->
            callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content'
              location: '/start-location',
              onAccepted: callback,
              acceptLocation: '/records/:action/:id'
            })

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.navigate('.overlay-content', content: 'acceptable content', location: '/records/edit/123')

            next ->
              value = {
                location: u.normalizeURL('/records/edit/123')
                action: 'edit'
                id: '123'
              }

              expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value }))

          it 'accepts the layer when the layer has reached the given location but renders no history', asyncSpec (next) ->
            callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content'
              history: false,
              location: '/start-location',
              onAccepted: callback,
              acceptLocation: '/acceptable-location'
            })

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.navigate('.overlay-content', content: 'acceptable content', location: '/acceptable-location')

            next ->
              value = { location: u.normalizeURL('/acceptable-location') }
              expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value }))

          it 'does not accept the layer when another layer has reached the given location', ->
            callback = jasmine.createSpy('onAccepted callback')

            makeLayers [
              { target: '.root-content' },
              { target: '.overlay-content', onAccepted: callback, acceptLocation: '/acceptable-location' }
            ]

            up.navigate('.root-content', layer: '.root-content', content: 'new content', location: '/acceptable-location')

            expect(callback).not.toHaveBeenCalled()

          it 'immediately accepts a layer that was opened at the given location'

        describe '{ dismissLocation }', ->

          it 'dismisses the layer when the layer has reached the given location', asyncSpec (next) ->
            callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content'
              location: '/start-location',
              onDismissed: callback,
              dismissLocation: '/dismissable-location'
            })

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.navigate('.overlay-content', content: 'other content', location: '/other-location')

            next ->
              expect(callback).not.toHaveBeenCalled()

              up.navigate('.overlay-content', content: 'dismissable content', location: '/dismissable-location')

            next ->
              value = { location: u.normalizeURL('/dismissable-location') }
              expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value }))

    describe 'up.layer.build()', ->

      it 'merges all applicable layer configs'

      it 'prioritizes the config for a particular mode over the config for all overlays or any modes'

      if up.migrate.loaded
        it 'prints a deprecation warning if the user configured { historyVisible } (which is now { history })', ->
          up.layer.config.overlay.historyVisible = false
          warnSpy = spyOn(up.log, 'warn')
          up.layer.build(mode: 'drawer')
          expect(warnSpy).toHaveBeenCalled()

    describe 'up.layer.accept()', ->

      it 'closes the current layer', ->
        acceptSpy = spyOn(up.layer.current, 'accept')
        up.layer.accept(option: 'value')
        expect(acceptSpy).toHaveBeenCalledWith(option: 'value')

      # There are more specs for up.Layer.Overlay#accept()

    describe 'up.layer.dismiss()', ->

      it 'closes the current layer', ->
        dismissSpy = spyOn(up.layer.current, 'dismiss')
        up.layer.dismiss(option: 'value')
        expect(dismissSpy).toHaveBeenCalledWith(option: 'value')

    # There are more specs for up.Layer.Overlay#dismiss()

    describe 'up.layer.dismissOverlays()', ->

      it 'dismisses all overlays', ->
        makeLayers(3)

        expect(up.layer.count).toBe(3)

        up.layer.dismissOverlays()

        expect(up.layer.count).toBe(1)
        expect(up.layer.isRoot()).toBe(true)

      it 'manipulates the layer stack synchronously', ->
        makeLayers(2)

        expect(up.layer.count).toBe(2)

        up.layer.dismissOverlays()

        expect(up.layer.count).toBe(1)

      it 'does nothing when no overlay is open', ->
        dismissOverlays = -> up.layer.dismissOverlays()
        expect(dismissOverlays).not.toThrowError()

      it 'stops dismissing overlays when any overlay prevents its dismissal', ->
        makeLayers(5)
        # The third layer will prevent its dismissal
        up.layer.get(2).on('up:layer:dismiss', (event) -> event.preventDefault())

        dismissOverlays = -> up.layer.dismissOverlays()
        expect(dismissOverlays).toAbort()

        expect(up.layer.count).toBe(3)

    describe 'up.layer.get()', ->

      describe 'for an element', ->

        it "returns the element's layer", ->
          makeLayers(3)
          expect(up.layer.get(up.layer.get(1).element)).toBe up.layer.get(1)

        it 'returns a missing value if the element is detached', ->
          element = e.createFromSelector('.element')
          expect(element).toBeDetached()

      describe 'for an up.Layer', ->

        it 'returns the given layer', ->
          makeLayers(3)
          layer = up.layer.get(1)
          expect(layer).toEqual jasmine.any(up.Layer)
          expect(up.layer.get(layer)).toBe(layer)

      describe 'for a layer name like "parent"', ->

        it 'returns the layer matching that name', ->
          makeLayers(2)
          expect(up.layer.get('parent')).toBe(up.layer.root)

      describe 'for a number', ->

        it 'returns the layer with the given index', ->
          makeLayers(2)

          [root, overlay] = up.layer.stack

          expect(up.layer.get(0)).toBe(root)
          expect(up.layer.get(1)).toBe(overlay)

        it 'returns a missing value if no layer with the given index exists', ->
          makeLayers(2)

          expect(up.layer.get(2)).toBeMissing()

      describe 'for undefined', ->

        it 'returns the current layer', ->
          makeLayers(2)

          expect(up.layer.get(undefined)).toBe(up.layer.front)

    describe 'up.layer.stack', ->

      it 'returns an array-like object of all layers, starting with the root layer, for easy access to the entire stack', ->
        makeLayers(2)
        expect(up.layer.count).toBe(2)
        expect(up.layer.stack[0]).toBe(up.layer.root)
        expect(up.layer.stack[1]).toBe(up.layer.front)

    describe 'up.layer.count', ->

      it 'returns 1 if no overlay is open', ->
        expect(up.layer.count).toBe(1)

      it 'returns 2 if one overlay is open', ->
        makeLayers(2)

        expect(up.layer.count).toBe(2)

    describe 'up.layer.getAll()', ->

      describe 'for "any"', ->

        it 'returns a reversed list of all layers', ->
          makeLayers(3)
          expect(up.layer.getAll('any')).toEqual [up.layer.get(2), up.layer.get(1), up.layer.get(0)]

        it 'returns the current layer first so that is preferred for element lookups', ->
          makeLayers(3)
          up.layer.get(1).asCurrent ->
            expect(up.layer.getAll('any')).toEqual [up.layer.get(1), up.layer.get(2), up.layer.get(0)]

      describe 'for an element', ->

        it "returns an array of the given element's layer", ->
          makeLayers(3)
          expect(up.layer.getAll(up.layer.get(1).element)).toEqual [up.layer.get(1)]

      describe 'for an up.Layer', ->

        it 'returns an array of the given up.Layer', ->
          makeLayers(3)
          layer = up.layer.get(1)
          expect(layer).toEqual jasmine.any(up.Layer)
          expect(up.layer.getAll(layer)).toEqual [layer]

      describe 'for an array of up.Layer objects', ->

        it 'returns an array with the same objects', ->
          makeLayers(3)
          array = [up.layer.get(1), up.layer.get(2)]
          expect(up.layer.getAll(array)).toEqual [up.layer.get(1), up.layer.get(2)]

      describe 'for "new"', ->

        it 'returns ["new"], which is useful for passing through the { layer } option when opening a new layer', ->
          expect(up.layer.getAll('new')).toEqual ['new']

      describe 'for "closest"', ->

        it 'returns the current layer and its ancestors', ->
          makeLayers(3)
          expect(up.layer.getAll('closest')).toEqual [up.layer.get(2), up.layer.get(1), up.layer.get(0)]

        it 'honors a temporary current layer', ->
          makeLayers(3)
          up.layer.get(1).asCurrent ->
            expect(up.layer.getAll('closest')).toEqual [up.layer.get(1), up.layer.get(0)]

      describe 'for "parent"', ->

        it "returns an array of the current layer's parent layer", ->
          makeLayers(3)
          expect(up.layer.getAll('parent')).toEqual [up.layer.get(1)]

        it 'returns an empty array if the current layer is the root layer', ->
          expect(up.layer.getAll('parent')).toEqual []

        it 'honors a temporary current layer', ->
          makeLayers(3)
          up.layer.get(1).asCurrent ->
            expect(up.layer.getAll('parent')).toEqual [up.layer.get(0)]

      describe 'for "child"', ->

        it "returns an array of the current layer's child layer", ->
          makeLayers(3)
          up.layer.root.asCurrent ->
            expect(up.layer.getAll('child')).toEqual [up.layer.get(1)]

        it 'returns an empty array if the current layer is the front layer', ->
          expect(up.layer.getAll('child')).toEqual []

      describe 'for "descendant"', ->

        it "returns the current layer's descendant layers", ->
          makeLayers(3)
          up.layer.root.asCurrent ->
            expect(up.layer.getAll('descendant')).toEqual [up.layer.get(1), up.layer.get(2)]

      describe 'for "ancestor"', ->

        it "returns the current layer's ancestor layers", ->
          makeLayers(3)
          expect(up.layer.getAll('ancestor')).toEqual [up.layer.get(1), up.layer.get(0)]

        it 'honors a temporary current layer', ->
          makeLayers(3)
          up.layer.get(1).asCurrent ->
            expect(up.layer.getAll('ancestor')).toEqual [up.layer.get(0)]

      describe 'for "root"', ->

        it "returns an array of the root layer", ->
          makeLayers(2)
          expect(up.layer.getAll('root')).toEqual [up.layer.root]

      if up.migrate.loaded
        describe 'for "page"', ->

          it "returns an array of the root layer, which used to be called 'page' in older Unpoly versions", ->
            makeLayers(2)
            expect(up.layer.getAll('page')).toEqual [up.layer.root]

      describe 'for "front"', ->

        it "returns an array of the front layer", ->
          makeLayers(2)
          expect(up.layer.getAll('front')).toEqual [up.layer.get(1)]

        it "is not affected by a temporary current layer", ->
          makeLayers(2)
          up.layer.root.asCurrent ->
            expect(up.layer.getAll('front')).toEqual [up.layer.get(1)]

      describe 'for "origin"', ->

        it "returns an array of the layer of the { origin } element", ->
          makeLayers(3)
          expect(up.layer.getAll('origin', origin: up.layer.get(1).element)).toEqual [up.layer.get(1)]

        it "returns an empty list if if no { origin } was passed", ->
          expect(up.layer.getAll('origin')).toEqual []

      describe 'for "current"', ->

        it "returns an array of the front layer", ->
          makeLayers(2)
          expect(up.layer.getAll('current')).toEqual [up.layer.get(1)]

        it "returns an array of a { baseLayer } option", ->
          makeLayers(2)
          expect(up.layer.getAll('current', baseLayer: up.layer.root)).toEqual [up.layer.root]

        it 'honors a temporary current layer', ->
          makeLayers(2)
          up.layer.root.asCurrent ->
            expect(up.layer.getAll('current')).toEqual [up.layer.root]

      describe 'for an options object with { layer } property', ->

        it 'allows to pass the layer value as a { layer } option instead of a first argument', ->
          makeLayers(3)
          expect(up.layer.getAll(layer: up.layer.get(1))).toEqual [up.layer.get(1)]

      describe 'for multiple space-separated layer named', ->

        it "returns an array of the matching layers", ->
          makeLayers(3)
          expect(up.layer.getAll('parent root')).toEqual [up.layer.get(1), up.layer.root]

        it 'omits layers that do not exist', ->
          expect(up.layer.getAll('parent root')).toEqual [up.layer.root]

      describe 'for an options object without { layer } property', ->

        it 'behaves like "any" and returns a reversed list of all layers', ->
          makeLayers(3)
          expect(up.layer.getAll('any')).toEqual [up.layer.get(2), up.layer.get(1), up.layer.get(0)]

        it 'behaves like "any" and returns the current layer first so that is preferred for element lookups', ->
          makeLayers(3)
          up.layer.get(1).asCurrent ->
            expect(up.layer.getAll('any')).toEqual [up.layer.get(1), up.layer.get(2), up.layer.get(0)]

      describe '{ baseLayer } option', ->

        it 'allows to change the current layer for the purpose of the lookup', ->
          makeLayers(3)
          expect(up.layer.getAll('parent', baseLayer: up.layer.get(1))).toEqual [up.layer.get(0)]

        it 'looks up the { baseLayer } option if it is a string, using the actual current layer as the base for that second lookup', ->
          makeLayers(3)
          expect(up.layer.getAll('parent', baseLayer: 'front')).toEqual [up.layer.get(1)]

    describe 'up.layer.ask()', ->

      it 'opens a new overlay and returns a promise that fulfills when that overlay is accepted', (done) ->
        up.motion.config.enabled = false

        promise = up.layer.ask(content: 'Would you like to accept?')

        u.task ->
          expect(up.layer.isOverlay()).toBe(true)
          expect(up.layer.current).toHaveText ('Would you like to accept?')

          promiseState(promise).then (result) ->
            expect(result.state).toEqual('pending')

            up.layer.accept('acceptance value')

            u.task ->
              promiseState(promise).then (result) ->
                expect(result.state).toEqual('fulfilled')
                expect(result.value).toEqual('acceptance value')

                done()

      it 'opens a new overlay and returns a promise that rejects when that overlay is dismissed', (done) ->
        up.motion.config.enabled = false

        promise = up.layer.ask(content: 'Would you like to accept?')

        u.task ->
          expect(up.layer.isOverlay()).toBe(true)
          expect(up.layer.current).toHaveText ('Would you like to accept?')

          promiseState(promise).then (result) ->
            expect(result.state).toEqual('pending')

            up.layer.dismiss('dismissal value')

            u.task ->

              promiseState(promise).then (result) ->
                expect(result.state).toEqual('rejected')
                expect(result.value).toEqual('dismissal value')

                done()

    describe 'up.layer.current', ->

      it 'returns the front layer', (done) ->
        expect(up.layer.current).toBe(up.layer.root)

        up.layer.open().then ->
          expect(up.layer.count).toBe(2)
          expect(up.layer.current).toBe(up.layer.get(1))
          done()

      it 'may be temporarily changed for the duration of a callback using up.Layer.asCurrent(fn)', ->
        makeLayers(2)
        expect(up.layer.current).toBe(up.layer.get(1))

        up.layer.root.asCurrent ->
          expect(up.layer.current).toBe(up.layer.get(0))

        expect(up.layer.current).toBe(up.layer.get(1))

    describe 'up.layer.normalizeOptions()', ->

      describe 'snapshotting the current layer', ->

        it 'saves the current layer instance to { baseLayer }', ->
          options = {}
          up.layer.normalizeOptions(options)
          expect(options).toEqual jasmine.objectContaining(baseLayer: up.layer.current)

        it 'does not override an existing { baseLayer } option', ->
          makeLayers(3)

          options = { baseLayer: up.layer.get(1) }
          up.layer.normalizeOptions(options)
          expect(options).toEqual jasmine.objectContaining(baseLayer: up.layer.get(1))

        it 'resolves a given { baseLayer } string to an up.Layer object', ->
          options = { baseLayer: 'root' }
          up.layer.normalizeOptions(options)
          expect(options).toEqual jasmine.objectContaining(baseLayer: up.layer.root)

      describe 'for a { layer } string', ->

        it 'does not resolve the { layer } string, since that might resolve to multiple laters layer', ->
          options = { layer: 'any' }
          up.layer.normalizeOptions(options)
          expect(options).toEqual jasmine.objectContaining(layer: 'any')

      describe 'for an mode passed as the { layer: "new $MODE" } shorthand option', ->

        it 'transfers the mode to the { mode } option and sets { layer: "new" }', ->
          options = { layer: 'new cover' }
          up.layer.normalizeOptions(options)
          expect(options).toEqual jasmine.objectContaining(layer: 'new', mode: 'cover')

        it 'does not change { layer: "root" }', ->
          options = { layer: 'root' }
          up.layer.normalizeOptions(options)
          expect(options).toEqual jasmine.objectContaining(layer: 'root')

      if up.migrate.loaded
        describe 'for an mode passed as the legacy { flavor } option', ->

          it 'transfers the mode to the { mode } option', ->
            options = { flavor: 'cover' }
            up.layer.normalizeOptions(options)
            expect(options).toEqual jasmine.objectContaining(layer: 'new', mode: 'cover')

        describe 'for the legacy { layer: "page" } option', ->

          it 'sets { layer: "root" }', ->
            options = { layer: 'page' }
            up.layer.normalizeOptions(options)
            expect(options).toEqual jasmine.objectContaining(layer: 'root')

      describe 'for { layer: "new" }', ->

        it 'sets a default mode from up.layer.config.mode', ->
          up.layer.config.mode = 'popup'
          options = { layer: 'new' }
          up.layer.normalizeOptions(options)
          expect(options).toEqual jasmine.objectContaining(layer: 'new', mode: 'popup')

        it 'does not change an existing { mode } option', ->
          up.layer.config.mode = 'popup'
          options = { layer: 'new', mode: 'cover' }
          up.layer.normalizeOptions(options)
          expect(options).toEqual jasmine.objectContaining(layer: 'new', mode: 'cover')

      describe 'for { layer: "swap" }', ->

        it 'sets { baseLayer } to the current parent layer and set { layer: "new" }', ->
          makeLayers(3)

          options = { layer: 'swap' }
          up.layer.normalizeOptions(options)
          expect(options).toEqual jasmine.objectContaining(baseLayer: up.layer.get(1), layer: 'new')

      describe 'for an element passed as { target }', ->

        it "sets { layer } to that element's layer object", ->
          makeLayers(3)

          options = { target: up.layer.get(1).element }
          up.layer.normalizeOptions(options)
          expect(options).toEqual jasmine.objectContaining(layer: up.layer.get(1))

      describe 'for an element passed as { origin }', ->

        it "sets { layer: 'origin' }", ->
          makeLayers(3)

          options = { origin: up.layer.get(1).element }
          up.layer.normalizeOptions(options)
          expect(options).toEqual jasmine.objectContaining(origin: up.layer.get(1).element, layer: 'origin')

        it 'does not change an existing { layer } option', ->
          makeLayers(2)

          options = { layer: 'root', origin: up.layer.get(1).element }
          up.layer.normalizeOptions(options)
          expect(options).toEqual jasmine.objectContaining(origin: up.layer.get(1).element, layer: 'root')

      describe 'if no layer-related option is given', ->

        it 'sets { layer: "current" }', ->
          options = {}
          up.layer.normalizeOptions(options)
          expect(options).toEqual jasmine.objectContaining(layer: 'current')

  describe 'unobtrusive behavior', ->

    describe 'link with [up-layer=new]', ->

      it 'opens a new overlay loaded from the given [href]', asyncSpec (next) ->
        link = fixture('a[href="/overlay-path"][up-target=".target"][up-layer="new"]')

        Trigger.clickSequence(link)

        next ->
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          jasmine.respondWithSelector('.target', text: 'overlay text')

        next ->
          expect(up.layer.count).toBe(2)
          expect(up.layer.isOverlay()).toBe(true)
          expect(up.layer.current).toHaveText('overlay text')

      it 'opens a new overlay with content from the given [up-content]', asyncSpec (next) ->
        link = fixture('a[up-target=".target"][up-layer="new"][up-content="overlay text"]')

        Trigger.clickSequence(link)

        next ->
          expect(up.layer.count).toBe(2)
          expect(up.layer.isOverlay()).toBe(true)
          expect(up.layer.current).toHaveText('overlay text')

      describe 'history', ->

        beforeEach ->
          up.history.config.enabled = true

        it 'opens a layer with visible history when the mode config has { history: true }', asyncSpec (next) ->
          fixture('.target')
          up.layer.config.drawer.history = true
          link = fixture('a[up-target=".target"][up-layer="new drawer"][href="/path5"]')

          Trigger.clickSequence(link)

          next ->
            jasmine.respondWithSelector('.target')

          next ->
            expect(up.layer.count).toBe(2)
            expect(up.layer.history).toBe(true)
            expect(up.history.location).toMatchURL('/path5')

        it 'opens a layer without visible history when the mode config has { history: false }', asyncSpec (next) ->
          fixture('.target')
          up.layer.config.drawer.history = false
          link = fixture('a[up-target=".target"][up-layer="new drawer"][href="/path6"]')

          Trigger.clickSequence(link)

          next ->
            jasmine.respondWithSelector('.target')

          next =>
            expect(up.layer.count).toBe(2)
            expect(up.layer.history).toBe(false)
            expect(up.history.location).toMatchURL(@locationBeforeExample)

        it 'lets the link override the mode config with an [up-history] attribute', asyncSpec (next) ->
          fixture('.target')
          up.layer.config.drawer.history = true
          link = fixture('a[up-target=".target"][up-layer="new drawer"][href="/path7"][up-history="false"]')

          Trigger.clickSequence(link)

          next ->
            jasmine.respondWithSelector('.target')

          next =>
            expect(up.layer.count).toBe(2)
            expect(up.layer.history).toBe(false)
            expect(up.history.location).toMatchURL(@locationBeforeExample)

    describe '[up-accept]', ->

      beforeEach ->
        up.motion.config.enabled = false

      it 'accepts an overlay', ->
        acceptListener = jasmine.createSpy('accept listener')
        up.on('up:layer:accept', acceptListener)

        makeLayers(2)

        expect(up.layer.isOverlay()).toBe(true)
        link = up.layer.affix('a[href="#"]')
        link.setAttribute('up-accept', '')
        Trigger.clickSequence(link)

        expect(up.layer.isRoot()).toBe(true)
        expect(acceptListener).toHaveBeenCalled()

      it 'accepts an overlay with the attribute value as JSON', ->
        acceptListener = jasmine.createSpy('accept listener')
        up.on('up:layer:accept', acceptListener)

        makeLayers(2)

        expect(up.layer.isOverlay()).toBe(true)
        link = up.layer.affix('a[href="#"]')
        link.setAttribute('up-accept', JSON.stringify(foo: 'bar'))
        Trigger.clickSequence(link)

        expect(up.layer.isRoot()).toBe(true)
        expect(acceptListener.calls.mostRecent().args[0]).toBeEvent('up:layer:accept', value: { foo: 'bar' })

      it 'parses the acceptance value if the user clicks on a descendant of the [up-accept] element (bugfix)', ->
        acceptListener = jasmine.createSpy('accept listener')
        up.on('up:layer:accept', acceptListener)

        makeLayers(2)

        expect(up.layer.isOverlay()).toBe(true)
        link = up.layer.affix('a[href="#"]')
        link.setAttribute('up-accept', JSON.stringify(foo: 'bar'))
        child = e.affix(link, 'span.child', text: 'label')
        Trigger.clickSequence(child)

        expect(up.layer.isRoot()).toBe(true)
        expect(acceptListener.calls.mostRecent().args[0]).toBeEvent('up:layer:accept', value: { foo: 'bar' })

      it 'prevents a link from being followed on an overlay', ->
        followListener = jasmine.createSpy('follow listener')
        up.on('up:link:follow', followListener)

        makeLayers(2)

        expect(up.layer.isOverlay()).toBe(true)
        link = up.layer.affix('a[href="/foo"][up-follow]')
        link.setAttribute('up-accept', '')
        Trigger.clickSequence(link)

        expect(followListener).not.toHaveBeenCalled()

      it 'follows a link on the root layer', ->
        followListener = jasmine.createSpy('follow listener')
        up.on('up:link:follow', followListener)

        link = up.layer.affix('a[href="/foo"][up-follow]')
        link.setAttribute('up-accept', '')
        Trigger.clickSequence(link)

        expect(followListener).toHaveBeenCalled()

      it 'may be used on elements that are no links', ->
        acceptListener = jasmine.createSpy('accept listener')
        up.on('up:layer:accept', acceptListener)

        makeLayers(2)

        expect(up.layer.isOverlay()).toBe(true)
        link = up.layer.affix('span')
        link.setAttribute('up-accept', JSON.stringify(foo: 'bar'))
        Trigger.clickSequence(link)

        expect(up.layer.isRoot()).toBe(true)
        expect(acceptListener.calls.mostRecent().args[0]).toBeEvent('up:layer:accept', value: { foo: 'bar' })

      it 'allows to set attributes that control the closing animation', ->
        makeLayers(2)
        overlay = up.layer.current

        expect(up.layer.isOverlay()).toBe(true)
        spyOn(overlay, 'accept')
        link = up.layer.affix('a[href="#"]')
        link.setAttribute('up-accept', '')
        link.setAttribute('up-animation', 'move-to-right')
        link.setAttribute('up-duration', '654')
        Trigger.clickSequence(link)

        expect(overlay.accept).toHaveBeenCalledWith(undefined, jasmine.objectContaining(animation: 'move-to-right', duration: 654))

      describe 'with [up-confirm]', ->

        allowGlobalErrors()

        it 'shows a confirm message before accepting the overlay', ->
          [root, overlay] = makeLayers(2)
          link = overlay.affix('a[up-accept][up-confirm="Are you sure?"]')
          confirmSpy = spyOn(up.browser, 'assertConfirmed')

          Trigger.clickSequence(link)

          expect(confirmSpy).toHaveBeenCalledWith(jasmine.objectContaining(confirm: 'Are you sure?'))
          expect(overlay).toBeClosed()

        it 'does not accept the overlay if the message is not confirmed', ->
          [root, overlay] = makeLayers(2)
          confirmSpy = spyOn(up.browser, 'assertConfirmed').and.callFake (options) ->
            if options.confirm
              throw up.error.aborted('User aborted')
          link = overlay.affix('a[up-accept][up-confirm="Are you sure?"]')

          Trigger.clickSequence(link)

          expect(confirmSpy).toHaveBeenCalled()
          expect(overlay).not.toBeClosed()

    describe '[up-dismiss]', ->

      beforeEach ->
        up.motion.config.enabled = false

      it 'dismisses an overlay with the attribute value as JSON', ->
        dismissListener = jasmine.createSpy('dismiss listener')
        up.on('up:layer:dismiss', dismissListener)

        makeLayers(2)

        expect(up.layer.isOverlay()).toBe(true)
        link = up.layer.affix('a[href="#"]')
        link.setAttribute('up-dismiss', JSON.stringify(foo: 'bar'))
        Trigger.clickSequence(link)

        expect(up.layer.isRoot()).toBe(true)
        expect(dismissListener.calls.mostRecent().args[0]).toBeEvent('up:layer:dismiss', value: { foo: 'bar' })

      # More specs in example group for "[up-accept]"
