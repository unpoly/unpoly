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