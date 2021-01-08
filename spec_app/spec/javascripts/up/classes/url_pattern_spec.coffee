describe 'up.URLPattern', ->

  describe '#test', ->

    it 'returns true if the given URL test an exact pattern completely', ->
      pattern = new up.URLPattern('/foo/bar')
      expect(pattern.test('/foo/bar')).toBe(true)

    it 'returns false if the given URL test the end of an exact pattern, but misses a prefix', ->
      pattern = new up.URLPattern('/foo/bar')
      expect(pattern.test('/bar')).toBe(false)

    it 'returns false if the given URL test the beginning of an exact pattern, but misses a suffix', ->
      pattern = new up.URLPattern('/foo/bar')
      expect(pattern.test('/foo')).toBe(false)

    it 'returns true if the given URL test a pattern with a wildcard (*)', ->
      pattern = new up.URLPattern('/foo/*/baz')
      expect(pattern.test('/foo/bar/baz')).toBe(true)

    it 'returns true if the given URL test a pattern with a named string segment', ->
      pattern = new up.URLPattern('/foo/:middle/baz')
      expect(pattern.test('/foo/bar/baz')).toBe(true)

    it 'returns true if the given URL test a pattern with a named number segment', ->
      pattern = new up.URLPattern('/foo/$middle/baz')
      expect(pattern.test('/foo/123/baz')).toBe(true)

    it 'returns false if named number segment would match a string', ->
      pattern = new up.URLPattern('/users/$id')
      expect(pattern.test('/users/new')).toBe(false)

    it 'returns true if the given URL test either of two space-separated URLs', ->
      pattern = new up.URLPattern('/foo /bar')
      expect(pattern.test('/foo')).toBe(true)
      expect(pattern.test('/bar')).toBe(true)

    it 'returns false if the given URL matchers neither of two space-separated URLs', ->
      pattern = new up.URLPattern('/foo /bar')
      expect(pattern.test('/baz')).toBe(false)

  describe '#recognize', ->

    it 'returns an object mapping named string segments to their value', ->
      pattern = new up.URLPattern('/foo/:one/:two/baz')
      expect(pattern.recognize('/foo/bar/bam/baz')).toEqual { one: 'bar', two: 'bam' }

    it 'returns an object mapping named number segments to their value', ->
      pattern = new up.URLPattern('/foo/:one/$two/baz')
      expect(pattern.recognize('/foo/bar/123/baz')).toEqual { one: 'bar', two: 123 }

    it 'does not match a slash character into a named group', ->
      pattern = new up.URLPattern('/foo/:one')
      expect(pattern.recognize('/foo/123/456')).toBeMissing()

    it 'returns an object if two space-separated URLs have the same named string segment', ->
      pattern = new up.URLPattern('/foo/:one /bar/:one')
      expect(pattern.recognize('/foo/bar')).toEqual { one: 'bar' }

    it 'returns a missing value if the given URL does not match the pattern', ->
      pattern = new up.URLPattern('/foo')
      expect(pattern.recognize('/bar')).toBeMissing()

    it 'matches query params', ->
      pattern = new up.URLPattern('/search?query=:query&page=$page')
      expect(pattern.recognize('/search?query=hello&page=3')).toEqual { query: 'hello', page: 3 }

    it 'allows to exclude patterns with a minus-prefixed pattern', ->
      pattern = new up.URLPattern('/foo/:one -/foo/bar')
      expect(pattern.recognize('/foo/bar')).toBeMissing()

    it 'still matches when a exclude pattern does not match', ->
      pattern = new up.URLPattern('/foo/:one -/foo/bar')
      expect(pattern.recognize('/foo/baz')).toEqual { one: 'baz' }

    it 'allows to exclude multiple patterns', ->
      pattern = new up.URLPattern('/foo/:one -/foo/bar -/foo/baz')
      expect(pattern.recognize('/foo/baz')).toBeMissing()

    it 'does not override named segments when a blacklisted pattern has a segment with the same name', ->
      pattern = new up.URLPattern('/foo/:one -/bar/:one')
      expect(pattern.recognize('/foo/1234')).toEqual { one: '1234' }

