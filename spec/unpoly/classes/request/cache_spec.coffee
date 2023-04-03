describe 'up.Request.Cache', ->

  describe '#track', ->

    it 'resolves the given new request when the given cached request is resolved'

    it 'rejects the given new request when the given cached request is rejected'

    it 'aborts the given new request when the given cached request is aborted', asyncSpec (next) ->
      sourceRequest = new up.Request(url: '/foo')

      followingRequest = new up.Request(url: '/foo')
      up.cache.track(sourceRequest, followingRequest)

      expect(sourceRequest.state).toEqual('new')
      expect(followingRequest.state).toEqual('tracking')

      next ->
        sourceRequest.abort()

      next ->
        expect(sourceRequest.state).toEqual('aborted')
        expect(followingRequest.state).toEqual('aborted')
