describe 'up.Request.Cache', ->

  describe '#connect', ->

    it 'resolves the given new request when the given cached request is resolved'

    it 'rejects the given new request when the given cached request is rejected'

    it 'aborts the given new request when the given cached request is aborted', ->
      sourceRequest = new up.Request(url: '/foo')
      followingRequest = new up.Request(url: '/foo')
      up.cache.connect(sourceRequest, followingRequest)

      expect(sourceRequest.state).toEqual('new')
      expect(followingRequest.state).toEqual('new')

      sourceRequest.abort()

      expect(sourceRequest.state).toEqual('aborted')
      expect(followingRequest.state).toEqual('aborted')
