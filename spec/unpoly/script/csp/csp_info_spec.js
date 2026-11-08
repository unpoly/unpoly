const u = up.util

describe('up.CSPInfo', function() {

  beforeEach(function() {
    jasmine.addMatchers({
      toBeEmptyCSPInfo(util, customEqualityTesters) {
        return {
          compare(cspInfo) {
            return { pass: u.isBlank(cspInfo.nonces) && u.isBlank(cspInfo.declaration) }
          }
        }
      },
    })
  })

  describe('.fromHeader()', function() {

    it('returns the CSP nonces for script-src', function() {
      const info = up.CSPInfo.fromHeader("script-src 'nonce-secret2' 'self' 'nonce-secret3'")
      expect(info.nonces).toEqual(['secret2', 'secret3'])
      expect(info.declaration).toEqual("script-src 'nonce-secret2' 'self' 'nonce-secret3'")
    })

    it('returns the CSP nonces for default-src if no script-src is set', function() {
      const info = up.CSPInfo.fromHeader("default-src 'nonce-secret2' 'self' 'nonce-secret3'")
      expect(info.nonces).toEqual(['secret2', 'secret3'])
      expect(info.declaration).toEqual("default-src 'nonce-secret2' 'self' 'nonce-secret3'")
    })

    it('ignores CSP nonces for default-src if script-src is set', function() {
      const info = up.CSPInfo.fromHeader("default-src 'nonce-secret1'; script-src 'nonce-secret2' 'self' 'nonce-secret3'")
      expect(info.nonces).toEqual(['secret2', 'secret3'])
      expect(info.declaration).toEqual("script-src 'nonce-secret2' 'self' 'nonce-secret3'")
    })

    it('returns an empty object if the header has neither default-src nor script-src directive', function() {
      const info = up.CSPInfo.fromHeader("image-src 'nonce-secret2'")
      expect(info).toBeEmptyCSPInfo()
    })

    it('does not parse a script-src-elem declaration, because we also validate attribute callbacks', function() {
      const info = up.CSPInfo.fromHeader("script-src-elem: 'nonce-secret2' 'self' 'nonce-secret3'")
      expect(info).toBeEmptyCSPInfo()
    })

    it('does not parse a style-src declaration', function() {
      const info = up.CSPInfo.fromHeader("style-src 'nonce-secret'")
      expect(info).toBeEmptyCSPInfo()
    })

    it('returns an empty object if the header is missing', function() {
      const info = up.CSPInfo.fromHeader(null)
      expect(info).toBeEmptyCSPInfo()
    })

  })

  describe('.none()', function() {

    it('returns an empty up.CSPInfo instance', function() {
      expect(up.CSPInfo.none()).toBeEmptyCSPInfo()
    })

  })
  
})
