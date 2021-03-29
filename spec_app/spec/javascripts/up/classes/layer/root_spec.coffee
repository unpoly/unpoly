describe 'up.Layer.Root', ->

  describe '#dismiss()', ->

    it 'throws an error', ->
      dismiss = -> up.layer.root.dismiss('value')
      expect(dismiss).toThrowError(/cannot close the root layer/i)

  describe '#accept()', ->

    it 'returns a rejected promise', ->
      accept = -> up.layer.root.accept('value')
      expect(accept).toThrowError(/cannot close the root layer/i)
