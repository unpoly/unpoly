describe 'up.Request', ->

  describe '#url', ->

    it 'returns the given URL', ->
      request = new up.Request(url: 'http://host.com/foo')
      expect(request.url).toEqual('http://host.com/foo')

    it 'does not include a hash anchor of the constructed URL', ->
      request = new up.Request(url: 'http://host.com/foo#hash')
      expect(request.url).toEqual('http://host.com/foo')

    it "merges { params } for HTTP methods that don't allow a payload", ->
      request = new up.Request(url: 'http://host.com/foo?urlKey=urlValue', params: { paramsKey: 'paramsValue' }, method: 'get')
      expect(request.url).toEqual('http://host.com/foo?urlKey=urlValue&paramsKey=paramsValue')

    it 'excludes { params } for HTTP methods that allow a payload', ->
      request = new up.Request(url: 'http://host.com/foo?key=value', method: 'post')
      expect(request.url).toEqual('http://host.com/foo')

  describe '#method', ->

    it 'defaults to "GET"', ->
      request = new up.Request(url: 'http://host.com/foo')
      expect(request.method).toEqual('GET')

  describe '#hash', ->

    it 'returns the hash anchor from the constructed URL', ->
      request = new up.Request(url: 'http://host.com/foo#hash')
      expect(request.hash).toEqual('#hash')

    it 'returns undefined if the constructed URL had no hash anchor', ->
      request = new up.Request(url: 'http://host.com/foo')
      expect(request.hash).toBeUndefined()

  describe '#params', ->

    it 'returns the constructed params for HTTP methods that allow a payload', ->
      params = { key: 'value' }
      request = new up.Request(url: 'http://host.com/foo', params: params, method: 'post')
      expect(request.params).toEqual(params)

    it "returns undefined for HTTP methods that don't allow a payload", ->
      request = new up.Request(url: 'http://host.com/foo', params: { key: 'value' }, method: 'get')
      expect(request.params).toBeUndefined()

    it 'returns the merged { params } and params from the URL for HTTP methods that allow a payload', ->
      request = new up.Request(url: 'http://host.com/foo?urlKey=urlValue', params: { paramsKey: 'paramsValue' }, method: 'post')
      expect(request.params).toEqual(paramsKey: 'paramsValue', urlKey: 'urlValue')
