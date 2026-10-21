const u = up.util
const $ = jQuery

describe('up.protocol', function() {

  describe('up.protocol.csrfToken', function() {

    afterEach(function() {
      this.$meta?.remove()
    })

    it('returns the [content] of a <meta name="csrf-token"> by default', function() {
      this.$meta = $('<meta name="csrf-token" content="token-from-meta">').appendTo('head')
      expect(up.protocol.csrfToken()).toEqual('token-from-meta')
    })

    it('returns a configured token', function() {
      up.protocol.config.csrfToken = 'configured-token'
      expect(up.protocol.csrfToken()).toEqual('configured-token')
    })

    it('allows to configure a function that returns the token', function() {
      up.protocol.config.csrfToken = () => 'configured-token'
      expect(up.protocol.csrfToken()).toEqual('configured-token')
    })
  })

  describe('up.protocol.csrfParam()', function() {

    afterEach(function() {
      this.$meta?.remove()
    })

    it('returns the [content] of a <meta name="csrf-param"> by default', function() {
      this.$meta = $('<meta name="csrf-param" content="param-from-meta">').appendTo('head')
      expect(up.protocol.csrfParam()).toEqual('param-from-meta')
    })

    it('returns a configured parameter name', function() {
      up.protocol.config.csrfParam = 'configured-param'
      expect(up.protocol.csrfParam()).toEqual('configured-param')
    })

    it('allows to configure a function that returns the parameter name', function() {
      up.protocol.config.csrfParam = () => 'configured-param'
      expect(up.protocol.csrfParam()).toEqual('configured-param')
    })
  })

  describe('up.protocol.headerize()', function() {
    it('turns a camelized identifier into an X-Up-Foo-Bar style header name', function() {
      const header = up.protocol.headerize('fooBar')
      expect(header).toEqual('X-Up-Foo-Bar')
    })
  })

  if (up.migrate.loaded) {
    describe('X-Up-Title response header', function() {
      it('accepts a string that is not JSON-encoded, with a warning that names the value (deprecated)', async function() {
        const warnSpy = up.migrate.warn.mock()
        const request = up.request('/path')
        await wait()

        jasmine.respondWith({ responseText: 'text', responseHeaders: { 'X-Up-Title': 'Bare title' } })
        const response = await request

        expect(response.title).toBe('Bare title')
        expect(u.sprintf(...warnSpy.calls.argsFor(0))).toBe('X-Up-Title must now be a JSON-encoded string (got "Bare title")')
      })
    })

    describe('X-Up-Clear-Cache response header', function() {
      it('is used as X-Up-Expire-Cache (deprecated)', async function() {
        const warnSpy = up.migrate.warn.mock()
        const request = up.request('/path')
        await wait()

        jasmine.respondWith({ responseText: 'text', responseHeaders: { 'X-Up-Clear-Cache': '/foo/*' } })
        const response = await request

        expect(response.expireCache).toBe('/foo/*')
        expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('X-Up-Clear-Cache has been deprecated'))
      })
    })

    describe('up.protocol.config.cspNonce', function() {
      it('delegates to up.script.config.cspNonce (deprecated)', function() {
        const warnSpy = up.migrate.warn.mock()
        up.protocol.config.cspNonce = 'nonce-123'
        expect(up.script.config.cspNonce).toBe('nonce-123')
        expect(up.protocol.config.cspNonce).toBe('nonce-123')
        expect(warnSpy).toHaveBeenCalled()
      })
    })
  }

})
