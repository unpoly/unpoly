describe 'up.layer', ->

  describe 'JavaScript functions', ->

    beforeEach ->
      # Provoke concurrency issues by enabling animations, but don't slow down tests too much
      up.motion.config.duration = 10

    describe 'up.layer.open()', ->

      it 'resolves to an up.Layer instance', (done) ->
        up.layer.open().then (value) ->
          expect(value).toEqual(jasmine.any(up.Layer))
          done()

      it 'closes existing overlays over the { currentLayer }', (done) ->
        fixtureLayers(2).then ->
          [root, oldOverlay] = up.layer.all

          up.layer.open(currentLayer: 'root').then ->
            [root, newOverlay] = up.layer.all

            expect(newOverlay).not.toBe(oldOverlay)
            expect(oldOverlay.isOpen()).toBe(false)

            done()

      describe 'from a remote URL', ->

        it 'opens a new overlay loaded from a remote { url }', asyncSpec (next) ->
          up.layer.open(
            target: '.element',
            url: '/path'
          )

          next =>
            expect(up.layer.all.length).toBe(1)
            expect(@lastRequest().url).toMatchURL('/path')

            @respondWith('<div class="element other-class">element text</div>')

          next =>
            element = document.querySelector('up-modal .element')
            expect(element).toBeGiven()
            expect(element).toHaveClass('other-class')
            expect(element).toHaveText('element text')

        it 'aborts an previous pending request that would result in opening a new overlay, even if { solo: false } is also passed'

        it 'does not abort a previous request that would not result in opening a new overlay'

        it 'dismisses an overlay that has been opened while the request was in flight'

      describe 'from a string of HTML', ->

        it 'opens a new overlay from outer HTML given as { html }', (done) ->
          layerPromise = up.layer.open(
            target: '.element',
            html: '<div class="element other-class">element text</div>'
          )

          layerPromise.then ->
            expect(up.layer.all.length).toBe(2)

            element = document.querySelector('up-modal .element')
            expect(element).toBeGiven()
            expect(element).toHaveClass('other-class')
            expect(element).toHaveText('element text')

            done()

        it 'opens a new overlay from inner HTML given as { content }, constructing a container matching the { target }', (done) ->
          layerPromise = up.layer.open(
            target: '.element',
            content: 'element text'
          )

          layerPromise.then ->
            expect(up.layer.all.length).toBe(2)

            element = document.querySelector('up-modal .element')
            expect(element).toBeGiven()
            expect(element).toHaveText('element text')

            done()

        it 'opens an empty overlay if neither { html } nor { content } is given', (done) ->
          layerPromise = up.layer.open(
            target: '.element'
          )

          layerPromise.then ->
            expect(up.layer.all.length).toBe(2)

            element = document.querySelector('up-modal .element')
            expect(element).toBeGiven()
            expect(element.innerText).toBeBlank()

            done()


      describe 'animation', ->

        it 'should have examples'

      describe 'focus', ->

        it "focuses the new overlay's element", (done) ->
          layerPromise = up.layer.open(
            target: '.element',
          )

          layerPromise.then ->
            expect(up.layer.element).toBeFocused()

            done()

        it 'focuses a CSS selector passed as { focus } option', (done) ->
          layerPromise = up.layer.open(
            target: '.element',
            content: '<div class="child">child text</div>',
            focus: '.child'
          )

          layerPromise.then ->
            child = document.querySelector('up-modal .element .child')
            expect(child).toBeGiven()
            expect(child).toBeFocused()

            done()

      describe 'history', ->

        beforeEach ->
          up.history.config.enabled = true

        it 'updates the browser location when the overlay opens', asyncSpec (next) ->
          up.layer.open(
            target: '.element',
            location: '/modal-location'
            html: '<div class="element">element text</div>'
          )

          next ->
            expect(up.layer.isOverlay()).toBe(true)
            expect(location.href).toMatchURL('/modal-location')

        it "restores the parent layer's location when the overlay closes", asyncSpec (next) ->
          originalLocation = location.href

          up.layer.open(
            target: '.element',
            location: '/path/to/modal'
            html: '<div class="element">element text</div>'
          )

          next ->
            expect(up.layer.isOverlay()).toBe(true)
            expect(location.href).not.toMatchURL(originalLocation)

            up.layer.dismiss()

          next ->
            expect(up.layer.isRoot()).toBe(true)
            expect(location.href).toMatchURL(originalLocation)

        it 'does not update the brower location if the layer is not the front layer', asyncSpec (next) ->
          fixtureLayers [
            { target: '.root-element' },
            { target: '.overlay-element', location: '/modal-location' }
          ]

          next ->
            expect(up.layer.isOverlay()).toBe(true)
            expect(location.href).toMatchURL('/modal-location')

            up.change(layer: 'root', target: '.root-element', content: 'new text', location: '/new-root-location', peel: false)

          next ->
            expect(location.href).toMatchURL('/modal-location')

            up.layer.dismiss()

          next ->
            expect(up.layer.isRoot()).toBe(true)
            expect(location.href).toMatchURL('/new-root-location')

        it 'does not update the browser location when the overlay is opened with { history: false }', asyncSpec (next) ->
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

        it 'does not let child layers update the browser location if an ancestor has { history: false }', asyncSpec (next) ->
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

      describe 'styling', ->

        # maybe move this to the flavor specs

        it 'sets a { position } option as a [position] attribute', asyncSpec (next) ->
          up.layer.open(position: 'right')

          next ->
            expect(up.layer.element).toHaveAttribute('position', 'right')

        it 'sets a { size } option as a [size] attribute'

        it 'sets an { align } option as an [align] attribute'

        it 'sets a { class } option as a [class] of the overlay element'

      describe 'choice of target', ->

        beforeEach ->
          up.layer.config.all.targets = []
          up.layer.config.overlay.targets = []
          up.layer.config.modal.targets = []

        it 'uses a selector given as { target } option', asyncSpec (next) ->
          up.layer.open(content: 'overlay text', target: '.target-from-option')

          next ->
            expect(up.layer.isOverlay()).toBe(true)
            expect(document).toHaveSelector('up-modal .target-from-option')

        it 'uses a target from up.layer.config.all.targets', asyncSpec (next) ->
          up.layer.config.all.targets.push('.target-from-config-dot-all')

          up.layer.open(content: 'overlay text')

          next ->
            expect(up.layer.isOverlay()).toBe(true)
            expect(document).toHaveSelector('up-modal .target-from-config-dot-all')

        it 'uses a target from up.layer.config.overlay.targets', asyncSpec (next) ->
          up.layer.config.overlay.targets.push('.target-from-config-dot-overlay')
          up.layer.config.all.targets.push('.target-from-config-dot-all')

          up.layer.open(content: 'overlay text')

          next ->
            expect(up.layer.isOverlay()).toBe(true)
            expect(document).toHaveSelector('up-modal .target-from-config-dot-overlay')

        it "uses a target from up.layer.config.$mode.targets, where $mode is the new overlay's mode", asyncSpec (next) ->
          up.layer.config.modal.targets.push('.target-from-config-dot-modal')
          up.layer.config.overlay.targets.push('.target-from-config-dot-overlay')
          up.layer.config.all.targets.push('.target-from-config-dot-all')

          up.layer.open(content: 'overlay text')

          next ->
            expect(up.layer.isOverlay()).toBe(true)
            expect(document).toHaveSelector('up-modal .target-from-config-dot-modal')

        it 'allows to configure an entire object with change options in up.layer.config.$something.target', asyncSpec (next) ->
          up.layer.config.all.targets.push({ target: '.target-from-config', size: 'small' })

          up.layer.open(content: 'overlay text')

          next ->
            expect(up.layer.isOverlay()).toBe(true)
            expect(document).toHaveSelector('up-modal .target-from-config')
            expect(up.layer.size).toEqual('small')

      describe 'events', ->

        it 'should have tests'

      describe 'close conditions', ->

        describe '{ dismissable }', ->

          it 'should have examples'

        describe '{ buttonDismissable }', ->

          it 'should have examples'

        describe '{ escapeDismissable }', ->

          it 'should have examples'

        describe '{ outsideDismissable }', ->

          it 'should have examples'

        describe '{ onDismissed }', ->

          it 'should have examples'

        describe '{ onAccepted }', ->

          it 'should have examples'

        describe '{ acceptEvent }', ->

          it 'should have examples'

        describe '{ dismissEvent }', ->

          it 'should have examples'

        describe '{ acceptLocation }', ->

          it 'should have examples'

        describe '{ dismissLocation }', ->

          it 'should have examples'

    describe 'up.layer.dismiss()', ->

      it 'closes the current layer', ->
        dismissSpy = spyOn(up.layer.current, 'dismiss')
        up.layer.dismiss(option: 'value')
        expect(dismissSpy).toHaveBeenCalledWith(option: 'value')

    describe 'up.layer.accept()', ->

      it 'closes the current layer', ->
        acceptSpy = spyOn(up.layer.current, 'accept')
        up.layer.accept(option: 'value')
        expect(acceptSpy).toHaveBeenCalledWith(option: 'value')

    describe 'up.layer.get()', ->

      describe 'for an element', ->

        it "returns the element's layer"

      describe 'for an up.Layer', ->

        it 'returns the given layer'

      describe 'for a layer name like "parent"', ->

        it 'returns the layer matching that name'

    describe 'up.layer.list()', ->

      describe 'for "any"', ->

        it 'returns a reversed list of all layers', (done) ->
          fixtureLayers(3).then ->
            expect(up.layer.list('any')).toEqual [up.layer.all[2], up.layer.all[1], up.layer.all[0]]
            done()

        it 'returns the current layer first so that is preferred for element lookups', (done) ->
          fixtureLayers(3).then ->
            up.layer.all[1].asCurrent ->
              expect(up.layer.list('any')).toEqual [up.layer.all[1], up.layer.all[2], up.layer.all[0]]
              done()

      describe 'for an element', ->

        it "returns an array of the given element's layer", (done) ->
          fixtureLayers(3).then ->
            expect(up.layer.list(up.layer.all[1].element)).toEqual [up.layer.all[1]]
            done()

      describe 'for an up.Layer', ->

        it 'returns an array of the given up.Layer', (done) ->
          fixtureLayers(3).then ->
            expect(up.layer.list(up.layer.all[1])).toEqual [up.layer.all[1]]
            done()

      describe 'for "new"', ->

        it 'returns ["new"], which is useful for passing through the { layer } option when opening a new layer', ->
          expect(up.layer.list('new')).toEqual ['new']

      describe 'for "closest"', ->

        it 'returns the current layer and its ancestors', (done) ->
          fixtureLayers(3).then ->
            expect(up.layer.list('closest')).toEqual [up.layer.all[2], up.layer.all[1], up.layer.all[0]]
            done()

        it 'honors a temporary current layer', (done) ->
          fixtureLayers(3).then ->
            up.layer.all[1].asCurrent ->
              expect(up.layer.list('closest')).toEqual [up.layer.all[1], up.layer.all[0]]
              done()

      describe 'for "parent"', ->

        it "returns an array of the current layer's parent layer", (done) ->
          fixtureLayers(3).then ->
            expect(up.layer.list('parent')).toEqual [up.layer.all[1]]
            done()

        it 'returns an empty array if the current layer is the root layer', ->
          expect(up.layer.list('parent')).toEqual []

        it 'honors a temporary current layer', (done) ->
          fixtureLayers(3).then ->
            up.layer.all[1].asCurrent ->
              expect(up.layer.list('parent')).toEqual [up.layer.all[0]]
              done()

      describe 'for "child"', ->

        it "returns an array of the current layer's child layer", (done) ->
          fixtureLayers(3).then ->
            up.layer.root.asCurrent ->
              expect(up.layer.list('child')).toEqual [up.layer.all[1]]
              done()

        it 'returns an empty array if the current layer is the front layer', ->
          expect(up.layer.list('child')).toEqual []

      describe 'for "descendant"', ->

        it "returns the current layer's descendant layers", (done) ->
          fixtureLayers(3).then ->
            up.layer.root.asCurrent ->
              expect(up.layer.list('descendant')).toEqual [up.layer.all[1], up.layer.all[2]]
              done()

      describe 'for "ancestor"', ->

        it "returns the current layer's ancestor layers", (done) ->
          fixtureLayers(3).then ->
            expect(up.layer.list('ancestor')).toEqual [up.layer.all[1], up.layer.all[0]]
            done()

        it 'honors a temporary current layer', (done) ->
          fixtureLayers(3).then ->
            up.layer.all[1].asCurrent ->
              expect(up.layer.list('ancestor')).toEqual [up.layer.all[0]]
              done()

      describe 'for "root"', ->

        it "returns an array of the root layer", (done) ->
          fixtureLayers(2).then ->
            expect(up.layer.list('root')).toEqual [up.layer.root]
            done()

      describe 'for "page"', ->

        it "returns an array of the root layer, which used to be called 'page' in older Unpoly versions", (done) ->
          fixtureLayers(2).then ->
            expect(up.layer.list('page')).toEqual [up.layer.root]
            done()

      describe 'for "front"', ->

        it "returns an array of the front layer", (done) ->
          fixtureLayers(2).then ->
            expect(up.layer.list('front')).toEqual [up.layer.all[1]]
            done()

        it "is not affected by a temporary current layer", (done) ->
          fixtureLayers(2).then ->
            up.layer.root.asCurrent ->
              expect(up.layer.list('front')).toEqual [up.layer.all[1]]
              done()

      describe 'for "origin"', ->

        it "returns an array of the layer of the { origin } element", (done) ->
          fixtureLayers(3).then ->
            expect(up.layer.list('origin', origin: up.layer.all[1].element)).toEqual [up.layer.all[1]]
            done()

        it "throws an error if no { origin } was passed", (done) ->
          expect(-> up.layer.list('origin')).toThrowError(/(need|missing) \{ origin \} option/i)
          done()

      describe 'for "current"', ->

        it "returns an array of the front layer", (done) ->
          fixtureLayers(2).then ->
            expect(up.layer.list('current')).toEqual [up.layer.all[1]]
            done()

        it "returns an array of a { currentLayer } option", (done) ->
          fixtureLayers(2).then ->
            expect(up.layer.list('current', currentLayer: up.layer.root)).toEqual [up.layer.root]
            done()

        it 'honors a temporary current layer', (done) ->
          fixtureLayers(2).then ->
            up.layer.root.asCurrent ->
              expect(up.layer.list('current')).toEqual [up.layer.root]
              done()

      describe 'for an options object', ->

        it 'allows to pass the layer value as a { layer } option instead of a first argument', (done) ->
          fixtureLayers(3).then ->
            expect(up.layer.list(layer: up.layer.all[1])).toEqual [up.layer.all[1]]
            done()

      describe '{ currentLayer } option', ->

        it 'allows to change the current layer for the purpose of the lookup', (done) ->
          fixtureLayers(3).then ->
            expect(up.layer.list('parent', currentLayer: up.layer.all[1])).toEqual [up.layer.all[0]]
            done()

        it 'looks up the { currentLayer } option if it is a string, using the actual current layer as the base for that second lookup', (done) ->
          fixtureLayers(3).then ->
            expect(up.layer.list('parent', currentLayer: 'front')).toEqual [up.layer.all[1]]
            done()

    describe 'up.layer.ask()', ->

      it 'opens a new overlay and returns a promise that fulfills when that overlay is accepted'

      it 'opens a new overlay and returns a promise that rejects when that overlay is dismissed'

    describe 'up.layer.current', ->

      it 'returns the front layer'

      it 'can be manipulated for the duration of a callback using up.Layer.asCurrent(fn)'

  describe 'unobtrusive behavior', ->

    it 'does not lose an overlay if the <body> is replaced'