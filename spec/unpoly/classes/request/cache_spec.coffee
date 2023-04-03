describe 'up.Request.Cache', ->

  describe '#connect', ->

    it 'resolves the given new request when the given cached request is resolved'

    it 'rejects the given new request when the given cached request is rejected'

    it 'aborts the given new request when the given cached request is aborted', asyncSpec (next) ->
      sourceRequest = new up.Request(url: '/foo')

      console.debug("[spec] catching value on request #%o", sourceRequest.uid)
      sourceRequest.catch (v) -> console.debug("[spec] caught value %o", v)

      followingRequest = new up.Request(url: '/foo')
      up.cache.connect(sourceRequest, followingRequest)

      expect(sourceRequest.state).toEqual('new')
      expect(followingRequest.state).toEqual('new')

      next ->
        console.debug("[spec] aborting sourceRequest")
        sourceRequest.abort()

      next ->
        console.debug("[spec] expectations")

        expect(sourceRequest.state).toEqual('aborted')
        expect(followingRequest.state).toEqual('aborted')
