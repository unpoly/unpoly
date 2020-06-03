describe 'up.layer', ->

  describe 'JavaScript functions', ->

    describe 'up.layer.open()', ->

      describe 'from a remote URL', ->

        it 'opens a new overlay loaded from a remote { url }'

        it 'aborts an previous pending request that would result in opening a new overlay, even if { solo: false } is also passed'

        it 'does not abort a previous request that would not result in opening a new overlay'

        it 'dismisses an overlay that has been opened while the request was in flight'

      describe 'from a string of HTML', ->

        it 'opens a new overlay from outer HTML given as { html }'

        it 'opens a new overlay from inner HTML given as { content }'

      describe 'focus', ->

        it "focuses the new overlay's element"

        it 'focuses a CSS selector passed as { focus } option'

      describe 'mode', ->

        it 'opens a new layer with the default mode from up.layer.config.mode'

        it 'opens a new layer with the given { mode }'

      describe 'styling', ->

        it 'sets a { position } option as a [position] attribute'

        it 'sets a { size } option as a [size] attribute'

        it 'sets an { align } option as an [align] attribute'

        it 'sets a { class } option as a [class] of the overlay element'

      describe 'choice of target', ->

        it 'uses a selector given as { target } option'

        it 'uses a target from up.layer.config.all.targets'

        it 'uses a target from up.layer.config.overlay.targets'

        it "uses a target from up.layer.config.$mode.targets, where $mode is the new overlay's mode"

        it 'allows to configure an object with change options in up.layer.config.$any.target'

      describe 'events'

      describe 'close conditions', ->

        describe '{ dismissable }'

        describe '{ buttonDismissable }'

        describe '{ escapeDismissable }'

        describe '{ outsideDismissable }'

        describe '{ onDismissed }'

        describe '{ onAccepted }'

        describe '{ acceptEvent }'

        describe '{ dismissEvent }'

        describe '{ acceptLocation }'

        describe '{ dismissLocation }'

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