describe('up.URLPattern', function() {

  describe('#test', function() {

    it('returns true if the given URL test an exact pattern completely', function() {
      const pattern = new up.URLPattern('/foo/bar')
      expect(pattern.test('/foo/bar')).toBe(true)
    })

    it('returns true for any URL if the pattern is a single asterisk (*)', function() {
      const pattern = new up.URLPattern('*')
      expect(pattern.test('/foo')).toBe(true)
      expect(pattern.test('/bar')).toBe(true)
    })

    it('returns true for any URL if the pattern is a single asterisk (*) and the browser location is multiple directories deep (bugfix)', function() {
      history.replaceState?.({}, 'title', '/dir1/dir2/dir3')
      const pattern = new up.URLPattern('*')
      expect(pattern.test('/foo')).toBe(true)
      expect(pattern.test('/bar')).toBe(true)
    })

    it('returns false if the given URL test the end of an exact pattern, but misses a prefix', function() {
      const pattern = new up.URLPattern('/foo/bar')
      expect(pattern.test('/bar')).toBe(false)
    })

    it('returns false if the given URL test the beginning of an exact pattern, but misses a suffix', function() {
      const pattern = new up.URLPattern('/foo/bar')
      expect(pattern.test('/foo')).toBe(false)
    })

    it('returns false if the given URL has the same path, but another hostname', function() {
      const pattern = new up.URLPattern('/foo')
      expect(pattern.test('https://other.com/foo')).toBe(false)
    })

    it('returns true if the given URL test a pattern with a wildcard (*)', function() {
      const pattern = new up.URLPattern('/foo/*/baz')
      expect(pattern.test('/foo/bar/baz')).toBe(true)
    })

    it('has a trailing wildcard match a query string', function() {
      const pattern = new up.URLPattern('/foo/*')
      expect(pattern.test('/foo/?whatever')).toBe(true)
    })

    it('returns true if the tested URL has an extra trailing slash', function() {
      const pattern = new up.URLPattern('/foo')
      expect(pattern.test('/foo/')).toBe(true)
    })

    it('returns true if the tested URL has an extra trailing slash, and a matching query string', function() {
      const pattern = new up.URLPattern('/foo?foo=1')
      expect(pattern.test('/foo/?foo=1')).toBe(true)
    })

    it('returns true if the pattern URL has an extra trailing slash', function() {
      const pattern = new up.URLPattern('/foo/')
      expect(pattern.test('/foo')).toBe(true)
    })

    it('returns true if the pattern URL has an extra trailing slash, and a matching query string', function() {
      const pattern = new up.URLPattern('/foo/?foo=1')
      expect(pattern.test('/foo?foo=1')).toBe(true)
    })

    it('returns false if a prefix pattern matches in the middle of the given URL', function() {
      const pattern = new up.URLPattern('/foo/*')
      expect(pattern.test('/namespace/foo/123')).toBe(false)
    })

    it('returns false if a prefix pattern matches in the middle of the given URL and is preceded by another prefix pattern (bugfix)', function() {
      const pattern = new up.URLPattern('/bar/* /foo/*')
      expect(pattern.test('/namespace/foo/123')).toBe(false)
    })

    it('returns true if the given URL test a pattern with a named string segment', function() {
      const pattern = new up.URLPattern('/foo/:middle/baz')
      expect(pattern.test('/foo/bar/baz')).toBe(true)
    })

    it('returns true if the given URL test a pattern with a named number segment', function() {
      const pattern = new up.URLPattern('/foo/$middle/baz')
      expect(pattern.test('/foo/123/baz')).toBe(true)
    })

    it('returns false if named number segment would match a string', function() {
      const pattern = new up.URLPattern('/users/$id')
      expect(pattern.test('/users/new')).toBe(false)
    })

    describe('multiple patterns', function() {

      it('returns true if the given URL test either of two space-separated URLs', function() {
        const pattern = new up.URLPattern('/foo /bar')
        expect(pattern.test('/foo')).toBe(true)
        expect(pattern.test('/bar')).toBe(true)
      })

      it('returns true if the given URL test either of two comma-separated URLs', function() {
        const pattern = new up.URLPattern('/foo, /bar')
        expect(pattern.test('/foo')).toBe(true)
        expect(pattern.test('/bar')).toBe(true)
      })

      it('returns false if the given URL matchers neither of two space-separated URLs', function() {
        const pattern = new up.URLPattern('/foo /bar')
        expect(pattern.test('/baz')).toBe(false)
      })

      it('returns false if the given URL matchers neither of two comma-separated URLs', function() {
        const pattern = new up.URLPattern('/foo, /bar')
        expect(pattern.test('/baz')).toBe(false)
      })
    })
  })

  describe('#recognize', function() {

    it('returns an object mapping named string segments to their value', function() {
      const pattern = new up.URLPattern('/foo/:one/:two/baz')
      expect(pattern.recognize('/foo/bar/bam/baz')).toEqual({ one: 'bar', two: 'bam' })
    })

    it('returns an object mapping named number segments to their value', function() {
      const pattern = new up.URLPattern('/foo/:one/$two/baz')
      expect(pattern.recognize('/foo/bar/123/baz')).toEqual({ one: 'bar', two: 123 })
    })

    it('does not match a slash character into a named group', function() {
      const pattern = new up.URLPattern('/foo/:one')
      expect(pattern.recognize('/foo/123/456')).toBeMissing()
    })

    it('returns an object if two space-separated URLs have the same named string segment', function() {
      const pattern = new up.URLPattern('/foo/:one /bar/:one')
      expect(pattern.recognize('/foo/bar')).toEqual({ one: 'bar' })
    })

    it('returns a missing value if the given URL does not match the pattern', function() {
      const pattern = new up.URLPattern('/foo')
      expect(pattern.recognize('/bar')).toBeMissing()
    })

    it('matches query params', function() {
      const pattern = new up.URLPattern('/search?query=:query&page=$page')
      expect(pattern.recognize('/search?query=hello&page=3')).toEqual({ query: 'hello', page: 3 })
    })

    it('allows to exclude patterns with a minus-prefixed pattern', function() {
      const pattern = new up.URLPattern('/foo/:one -/foo/bar')
      expect(pattern.recognize('/foo/bar')).toBeMissing()
    })

    it('still matches when a exclude pattern does not match', function() {
      const pattern = new up.URLPattern('/foo/:one -/foo/bar')
      expect(pattern.recognize('/foo/baz')).toEqual({ one: 'baz' })
    })

    it('allows to exclude multiple patterns', function() {
      const pattern = new up.URLPattern('/foo/:one -/foo/bar -/foo/baz')
      expect(pattern.recognize('/foo/baz')).toBeMissing()
    })

    it('does not override named segments when a blacklisted pattern has a segment with the same name', function() {
      const pattern = new up.URLPattern('/foo/:one -/bar/:one')
      expect(pattern.recognize('/foo/1234')).toEqual({ one: '1234' })
    })
  })
})

