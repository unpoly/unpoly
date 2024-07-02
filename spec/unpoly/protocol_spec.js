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

  describe('up.protocol.cspNoncesFromHeader', function() {

    it('returns the CSP nonces for script-src', function() {
      const nonces = up.protocol.cspNoncesFromHeader("script-src: 'nonce-secret2' 'self' 'nonce-secret3'")
      expect(nonces).toEqual(['secret2', 'secret3'])
    })

    it('returns the CSP nonces for script-src-elem', function() {
      const nonces = up.protocol.cspNoncesFromHeader("script-src-elem: 'nonce-secret2' 'self' 'nonce-secret3'")
      expect(nonces).toEqual(['secret2', 'secret3'])
    })

    it('does not return the CSP nonces for style-src', function() {
      const nonces = up.protocol.cspNoncesFromHeader("style-src 'nonce-secret'")
      expect(nonces).toEqual([])
    })

    it('returns an empty array if the header is missing', function() {
      const nonces = up.protocol.cspNoncesFromHeader(null)
      expect(nonces).toEqual([])
    })
  })
})
