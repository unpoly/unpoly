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

  describe '#ended', ->

    it 'is false while the request is queued', ->
      up.network.config.concurrency = 1
      request1 = up.request('/foo')
      request2 = up.request('/bar') # queued but not sent
      await wait()

      expect(up.network.isBusy()).toBe(true)
      expect(request2.ended).toBe(false)

    it 'is false while the request is loading', ->
      request = up.request('/foo')
      await wait()

      expect(up.network.isBusy()).toBe(true)
      expect(request.ended).toBe(false)

    it 'turns true synchronously after the request has received a successful response', ->
      request = up.request('/foo')
      await wait()

      expect(request.ended).toBe(false)
      jasmine.respondWith('foo')
      # don't wait()

      expect(request.ended).toBe(true)

    it 'turns true synchronously after the request has received a failed response', ->
      request = up.request('/foo')
      await wait()

      expect(request.ended).toBe(false)

      jasmine.respondWith(responseText: 'error', status: 500)
      # don't wait()

      expect(request.ended).toBe(true)

    it 'turns true synchronously after the request failed due to a network issue', ->
      request = up.request('/foo')
      await wait()

      expect(request.ended).toBe(false)

      jasmine.lastRequest().responseError()
      # don't wait()

      expect(request.ended).toBe(true)

    it 'turns true synchronously after the request has been aborted', ->
      request = up.request('/foo')
      await wait()

      expect(request.ended).toBe(false)
      request.abort()
      # don't wait()

      expect(request.ended).toBe(true)

  describe '#xhr', ->

    it 'returns an XMLHttpRequest instance', ->
      request = new up.Request(url: '/foo')
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

    it 'returns an empty array if neither { target, fragments } were passed to the constructor', ->
      request = new up.Request(url: '/path')
      expect(request.fragments).toEqual []

  describe '#abort', ->

    it 'aborts this request', ->
      request = up.request('/url')

      await wait()

      request.abort()

      await expectAsync(request).toBeRejectedWith(jasmine.any(up.Aborted))

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
