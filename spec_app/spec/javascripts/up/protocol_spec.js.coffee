u = up.util
$ = jQuery

describe 'up.protocol', ->

  describe 'up.protocol.csrfToken', ->

    afterEach ->
      @$meta?.remove()

    it 'returns the [content] of a <meta name="csrf-token"> by default', ->
      @$meta = $('<meta name="csrf-token" content="token-from-meta">').appendTo('head')
      expect(up.protocol.csrfToken()).toEqual('token-from-meta')

    it 'returns a configured token', ->
      up.protocol.config.csrfToken = 'configured-token'
      expect(up.protocol.csrfToken()).toEqual('configured-token')

    it 'allows to configure a function that returns the token', ->
      up.protocol.config.csrfToken = -> 'configured-token'
      expect(up.protocol.csrfToken()).toEqual('configured-token')

  describe 'up.protocol.csrfParam()', ->

    afterEach ->
      @$meta?.remove()
      
    it 'returns the [content] of a <meta name="csrf-param"> by default', ->
      @$meta = $('<meta name="csrf-param" content="param-from-meta">').appendTo('head')
      expect(up.protocol.csrfParam()).toEqual('param-from-meta')

    it 'returns a configured parameter name', ->
      up.protocol.config.csrfParam = 'configured-param'
      expect(up.protocol.csrfParam()).toEqual('configured-param')

    it 'allows to configure a function that returns the parameter name', ->
      up.protocol.config.csrfParam = -> 'configured-param'
      expect(up.protocol.csrfParam()).toEqual('configured-param')

