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

})
