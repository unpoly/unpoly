describe('up.Response', function() {

  describe('#json', function() {

    it('returns the #text parsed as JSON', function() {
      const response = new up.Response({ text: '{ "foo": "bar" }' })
      expect(response.json).toEqual({ foo: 'bar' })
    })

    it('throws an error if #text is not a valid JSON string', function() {
      const response = new up.Response({ text: 'foo' })
      expect(() => response.json).toThrowError()
    })

    it('caches the parsed object', function() {
      const response = new up.Response({ text: '{ "foo": "bar" }' })
      expect(response.json).toEqual({ foo: 'bar' })
      response.json.bam = 'baz'
      expect(response.json).toEqual({ foo: 'bar', bam: 'baz' })
    })
  })

  describe('#ok', function() {

    it('returns true for a HTTP 200 (OK) response', function() {
      const response = new up.Response({ status: 200 })
      expect(response.ok).toBe(true)
    })

    it('returns true for a HTTP 201 (Created) response', function() {
      const response = new up.Response({ status: 201 })
      expect(response.ok).toBe(true)
    })

    it('returns true for a HTTP 304 (Not Modified) response', function() {
      const response = new up.Response({ status: 304 })
      expect(response.ok).toBe(true)
    })

    it('ignores the status code and always returns true if the response was constructed with { fail: false }', function() {
      const response = new up.Response({ status: 500, fail: false })
      expect(response.ok).toBe(true)
    })

    it('returns false for a HTTP 500 (Server Error) response', function() {
      const response = new up.Response({ status: 500 })
      expect(response.ok).toBe(false)
    })

    it('returns false for a HTTP 400 (Bad Request) response', function() {
      const response = new up.Response({ status: 400 })
      expect(response.ok).toBe(false)
    })

    it('returns false for a HTTP 422 (Unprocessable Entity) response', function() {
      const response = new up.Response({ status: 422 })
      expect(response.ok).toBe(false)
    })

    it('ignores the status code and always returns false if the response was constructed with { fail: true }', function() {
      const response = new up.Response({ status: 200, fail: true })
      expect(response.ok).toBe(false)
    })

    it("allows to configure what's considered a failed response with up.network.config.fail", function() {
      up.network.config.fail = (response) => response.url === '/foo'

      const fooResponse = new up.Response({ url: '/foo', status: 200 })
      const barResponse = new up.Response({ url: '/bar', status: 200 })

      expect(fooResponse.ok).toBe(false)
      expect(barResponse.ok).toBe(true)
    })
  })

  describe('#header()', function() {

    it('returns the header with the given name', async function() {
      const request = up.request('/foo')
      await wait()

      jasmine.respondWith({ status: 200, responseHeaders: { 'X-Course': 'ruby-basics' } })
      const response = await request

      expect(response.header('X-Course')).toBe('ruby-basics')
    })

    it('is case-insensitive', async function() {
      const request = up.request('/foo')

      await wait()

      jasmine.respondWith({ status: 200, responseHeaders: { 'X-Course': 'ruby-basics' } })
      const response = await request

      expect(response.header('x-cOuRsE')).toBe('ruby-basics')
    })
  })

  if (up.migrate.loaded) {
    describe('#getHeader()', function() {
      it('returns the header with the given name', async function() {
        const request = up.request('/foo')

        await wait()

        jasmine.respondWith({ status: 200, responseHeaders: { 'X-Course': 'ruby-basics' } })
        const response = await request

        expect(response.getHeader('X-Course')).toBe('ruby-basics')
      })
    })
  }

  describe('#varyHeaderNames', function() {

    it('returns an array of header names parsed from the `Vary` response header', async function() {
      const request = up.request('/foo')
      await wait()

      jasmine.respondWith({ status: 200, responseHeaders: { 'Vary': 'X-Up-Target, X-Up-Mode' } })
      const response = await request

      expect(response.varyHeaderNames).toEqual(['X-Up-Target', 'X-Up-Mode'])
    })

    it('returns an empty array if the response had no `Vary` response header', async function() {
      const request = up.request('/foo')
      await wait()

      jasmine.respondWith({ status: 200 })
      const response = await request

      expect(response.varyHeaderNames).toEqual([])
    })
  })
})

