describe 'up.layer', ->

  describe 'JavaScript functions', ->

    describe 'up.layer.open()', ->

      it 'makes a change on a new layer', ->
        changeSpy = spyOn(up, 'change')
        up.layer.open(option: 'value')
        expect(changeSpy).toHaveBeenCalledWith(layer: 'new', option: 'value')

      it 'resolves to an up.Layer instance', (done) ->
        up.layer.open(target: '.foo', content: 'foo').then (value) ->
          expect(value).toEqual(jasmine.any(up.Layer))
          done()

      it 'aborts an previous pending request that would result in opening a new layer, even if { solo: false } is also passed'

    describe 'up.layer.close()', ->

      it 'closes the current layer'

      it 'closes the given layer'

      it 'closes all descendants of the given layer'

      it 'aborts all pending requests for the given layer'

      it 'does not abort a pending request for another layer'

    describe 'up.layer.list()', ->

      describe 'for "any"', ->

        it 'returns a reversed list of all layers'

        it 'returns the current layer first so that is preferred for element lookups'

      describe 'for an element', ->

        it "returns an array of the given element's layer"

      describe 'for an up.Layer', ->

        it 'returns an array of the given up.Layer'

      describe 'for "new"', ->

        it 'returns ["new"], which is useful for passing through the { layer } option when opening a new layer'

      describe 'for "closest"', ->

        it 'returns the current layer and its ancestors'

        it 'honors a temporary current layer'

      describe 'for "parent"', ->

        it "returns an array of the given layer's parent layer"

        it 'returns an empty array if the given layer is the root layer'

        it 'honors a temporary current layer'

      describe 'for "child"', ->

        it "returns an array of the given layer's child layer"

        it 'returns an empty array if the given layer is the front layer'

        it 'honors a temporary current layer'

      describe 'for "descendant"', ->

        it "returns the given layer's descendant layers"

        it 'honors a temporary current layer'

      describe 'for "ascendant"', ->

        it "returns the given layer's ascendant layers"

        it 'honors a temporary current layer'

      describe 'for "root"', ->

        it "returns an array of the root layer"

      describe 'for "page"', ->

        it "returns an array of the root layer, which used to be called 'page' in older Unpoly versions"

      describe 'for "front"', ->

        it "returns an array of the front layer"

        it "is not affected by a temporary current layer"

      describe 'for "origin"', ->

        it "returns an error of the layer of the { origin } element"

        it "throws an error if no { origin } was passed"

      describe 'for "current"', ->

        it "returns an array of the the front layer"

        it "returns an array of a { currentLayer } option"

        it 'honors a temporary current layer'

      describe 'for an options object', ->

        it 'allows to pass the layer value is a { layer } option instead of a first argument'
