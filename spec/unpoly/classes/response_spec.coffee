describe 'up.Response', ->

  describe '#json', ->

    it 'returns the #text parsed as JSON', ->
      response = new up.Response(text: '{ "foo": "bar" }')
      expect(response.json).toEqual(foo: 'bar')

    it 'throws an error if #text is not a valid JSON string', ->
      response = new up.Response(text: 'foo')
      expect(-> response.json).toThrowError()

    it 'caches the parsed object', ->
      response = new up.Response(text: '{ "foo": "bar" }')
      expect(response.json).toEqual(foo: 'bar')
      response.json.bam = 'baz'
      expect(response.json).toEqual(foo: 'bar', bam: 'baz')

  describe '#ok', ->

    it 'returns true for a HTTP 200 (OK) response', ->
      response = new up.Response(status: 200)
      expect(response.ok).toBe(true)

    it 'returns true for a HTTP 201 (Created) response', ->
      response = new up.Response(status: 201)
      expect(response.ok).toBe(true)

    it 'returns true for a HTTP 304 (Not Modified) response', ->
      response = new up.Response(status: 304)
      expect(response.ok).toBe(true)

    it 'ignores the status code and always returns true if the response was constructed with { fail: false }', ->
      response = new up.Response(status: 500, fail: false)
      expect(response.ok).toBe(true)

    it 'returns false for a HTTP 500 (Server Error) response', ->
      response = new up.Response(status: 500)
      expect(response.ok).toBe(false)

    it 'returns false for a HTTP 400 (Bad Request) response', ->
      response = new up.Response(status: 400)
      expect(response.ok).toBe(false)

    it 'returns false for a HTTP 422 (Unprocessable Entity) response', ->
      response = new up.Response(status: 422)
      expect(response.ok).toBe(false)

    it 'ignores the status code and always returns false if the response was constructed with { fail: true }', ->
      response = new up.Response(status: 200, fail: true)
      expect(response.ok).toBe(false)

    it "allows to configure what's considered a failed response with up.network.config.fail", ->
      up.network.config.fail = (response) -> response.url == '/foo'

      fooResponse = new up.Response(url: '/foo', status: 200)
      barResponse = new up.Response(url: '/bar', status: 200)

      expect(fooResponse.ok).toBe(false)
      expect(barResponse.ok).toBe(true)

  describe '#rtt', ->

    it 'returns the number of milliseconds between queuing the request and the time the response was received', ->
      request = up.request('/foo')

      await wait(50)
      jasmine.respondWith('foo')

      await wait(50)

      response = await request
      expect(response.rtt).toBeAround(50, 20)

    it 'returns the partial RTT when tracking a pending, cached request', ->
      request1 = up.request('/foo', cache: true)
      await wait(50)

      request2 = up.request('/foo', cache: true)
      await wait(50)

      jasmine.respondWith('foo')

      response1 = await request1
      response2 = await request2
      expect(response1.rtt).toBeAround(100, 20)
      expect(response2.rtt).toBeAround(50, 20)

    it 'is zero for a fulfilled, cached request', ->
      request1 = up.request('/foo', cache: true)
      await wait(100)
      jasmine.respondWith('foo')

      await wait(100)

      request2 = up.request('/foo', cache: true)
      response2 = await request2
      expect(response2.rtt).toBe(0)

  describe '#header()', ->

    it 'returns the header with the given name', asyncSpec (next) ->
      request = up.request('/foo')

      next ->
        jasmine.respondWith(status: 200, responseHeaders: { 'X-Course': 'ruby-basics' })
        next.await(request)

      next (response) ->
        expect(response.header('X-Course')).toBe('ruby-basics')

    it 'is case-insensitive', asyncSpec (next) ->
      request = up.request('/foo')

      next ->
        jasmine.respondWith(status: 200, responseHeaders: { 'X-Course': 'ruby-basics' })
        next.await(request)

      next (response) ->
        expect(response.header('x-cOuRsE')).toBe('ruby-basics')

  if up.migrate.loaded
    describe '#getHeader()', ->

      it 'returns the header with the given name', asyncSpec (next) ->
        request = up.request('/foo')

        next ->
          jasmine.respondWith(status: 200, responseHeaders: { 'X-Course': 'ruby-basics' })
          next.await(request)

        next (response) ->
          expect(response.getHeader('X-Course')).toBe('ruby-basics')
