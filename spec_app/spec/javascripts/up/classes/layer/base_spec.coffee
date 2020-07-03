describe 'up.Layer', ->

  beforeEach ->
    # Provoke concurrency issues by enabling animations, but don't slow down tests too much
    up.motion.config.duration = 5

  describe '#context', ->

    it 'stores a per-layer context object', (done) ->
      up.layer.root.context.rootKey = 'rootValue'

      up.layer.open(context: { overlayKey: 'overlayValue' }).then (overlay) ->
        expect(overlay.context).toEqual(overlayKey: 'overlayValue')
        # Show that the root layer's context wasn't changed.
        expect(up.layer.root.context).toEqual(rootKey: 'rootValue')
        done()

    it 'may be mutated by the user', ->
      up.layer.context.key = 'value'
      expect(up.layer.context.key).toEqual('value')
