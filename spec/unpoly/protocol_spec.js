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

  describe('up.protocol.headerize', function() {
    it('turns a camelized identifier into an X-Up-Foo-Bar style header name', function() {
      const header = up.protocol.headerize('fooBar')
      expect(header).toEqual('X-Up-Foo-Bar')
    })
  })

  describe('up.protocol.cspInfoFromHeader()', function() {

    it('returns the CSP nonces for script-src', function() {
      const info = up.protocol.cspInfoFromHeader("script-src 'nonce-secret2' 'self' 'nonce-secret3'")
      expect(info).toEqual({
        nonces: ['secret2', 'secret3'],
        declaration: "script-src 'nonce-secret2' 'self' 'nonce-secret3'",
      })
    })

    it('returns the CSP nonces for default-src if no script-src is set', function() {
      const info = up.protocol.cspInfoFromHeader("default-src 'nonce-secret2' 'self' 'nonce-secret3'")
      expect(info).toEqual({
        nonces: ['secret2', 'secret3'],
        declaration: "default-src 'nonce-secret2' 'self' 'nonce-secret3'",
      })
    })

    it('ignores CSP nonces for default-src if script-src is set', function() {
      const info = up.protocol.cspInfoFromHeader("default-src 'nonce-secret1'; script-src 'nonce-secret2' 'self' 'nonce-secret3'")
      expect(info).toEqual({
        nonces: ['secret2', 'secret3'],
        declaration: "script-src 'nonce-secret2' 'self' 'nonce-secret3'",
      })
    })

    it('returns an empty object if the header has neither default-src nor script-src directive', function() {
      const info = up.protocol.cspInfoFromHeader("image-src 'nonce-secret2'")
      expect(info).toEqual({})
    })

    it('does not parse a script-src-elem declaration, because we also validate attribute callbacks', function() {
      const info = up.protocol.cspInfoFromHeader("script-src-elem: 'nonce-secret2' 'self' 'nonce-secret3'")
      expect(info).toEqual({})
    })

    it('does not parse a style-src declaration', function() {
      const info = up.protocol.cspInfoFromHeader("style-src 'nonce-secret'")
      expect(info).toEqual({})
    })

    it('returns an empty object if the header is missing', function() {
      const info = up.protocol.cspInfoFromHeader(null)
      expect(info).toEqual({})
    })

  })
})
