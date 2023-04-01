u = up.util
$ = jQuery

describe 'up.Request', ->

  describe 'constructor', ->

    describe '{ layer } option', ->

      it 'sets the { context } from that layer'

      it 'uses the current layer if no { layer } is given'

      describe 'with { basic: true }', ->

        it 'builds a basic request that does not auto-set a { layer } or { context }', ->
          request = new up.Request({ method: 'get', url: '/path', basic: true })
          expect(request).toEqual(jasmine.any(up.Request))
          expect(request.method).toEqual('GET')
          expect(request.url).toEqual('/path')
          expect(request.layer).toBeMissing()
          expect(request.context).toBeMissing()

  describe '#xhr', ->

    it 'lazily initializes an XMLHttpRequest instance', ->
      request = new up.Request(url: '/foo', preload: true, cache: false)
      expect(request.xhr).toEqual(jasmine.any(XMLHttpRequest))

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

    it 'keeps query params in the URL for HTTP methods that allow a payload', ->
      request = new up.Request(url: 'http://host.com/foo?key=value', method: 'post')
      expect(request.url).toEqual('http://host.com/foo?key=value')
      expect(request.params).toBeBlank()

    it 'is not normalized as to not clutter logs', ->
      request = new up.Request(url: '/path')
      expect(request.url).not.toContain('://')
      expect(request.url).toEqual('/path')

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
      expect(request.params).toEqual(new up.Params(params))

    it "returns a blank up.Params object for HTTP methods that don't allow a payload", ->
      request = new up.Request(url: 'http://host.com/foo', params: { key: 'value' }, method: 'get')
      expect(request.params).toBeBlank()

  describe '#fragments', ->

    it 'returns the { fragments } passed to constructor', ->
      request = new up.Request(url: '/path', fragments: [document.body])
      expect(request.fragments).toEqual [document.body]

    describe 'when no { fragments } were passed to the constructor', ->

      it 'looks up the { target } selector', ->
        element = fixture('.element')
        otherElement = fixture('.other-element')
        request = new up.Request(url: '/path', target: '.element, .other-element')
        expect(request.fragments).toEqual [element, otherElement]

      it 'looks up the { target } selector in a different { layer }', ->
        element = fixture('.element')
        otherElement = fixture('.other-element')

        makeLayers(2)

        request = new up.Request(url: '/path', target: '.element, .other-element', layer: 'root')
        expect(request.fragments).toEqual [element, otherElement]

    it 'returns undefined if neither { target, fragments } were passed to the constructor', ->
      request = new up.Request(url: '/path')
      expect(request.fragments).toBeUndefined()

  describe '#abort', ->

    it 'aborts this request', asyncSpec (next) ->
      request = up.request('/url')

      next => request.abort()

      next.await => promiseState(request)

      next (result) =>
        expect(result.state).toEqual('rejected')
        expect(result.value.name).toEqual('AbortError')

  describe '#header()', ->

    it 'returns the value of a header set via { headers } option', asyncSpec (next) ->
      request = up.request('/url', headers: { 'X-Foo': 'foo-value' })

      next ->
        expect(request.header('X-Foo')).toBe('foo-value')

    it 'returns the value of a header that was automatically set by Unpoly', asyncSpec (next) ->
      request = up.request('/url', target: '.target', layer: 'root')

      next ->
        expect(request.header('X-Up-Target')).toBe('.target')
        expect(request.header('X-Up-Mode')).toBe('root')

    it 'returns a missing value if no such header was set', asyncSpec (next) ->
      request = up.request('/url')

      next ->
        expect(request.header('X-Foo')).toBeMissing()
