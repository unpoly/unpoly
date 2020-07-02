describe 'up.Layer.Root', ->

  describe '#dismiss()', ->

    it 'returns a rejected promise', (done) ->
      promise = up.layer.root.dismiss('value')
      promiseState(promise).then (result) ->
        expect(result.state).toEqual('rejected')
        expect(result.value).toMatch(/cannot close/i)
        done()

  describe '#accept()', ->

    it 'returns a rejected promise', (done) ->
      promise = up.layer.root.accept('value')
      promiseState(promise).then (result) ->
        expect(result.state).toEqual('rejected')
        expect(result.value).toMatch(/cannot close/i)
        done()
