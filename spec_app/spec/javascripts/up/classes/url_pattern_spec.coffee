describe 'up.URLPattern', ->

  describe '#matches', ->

    it 'returns true if the given URL matches an exact pattern completely', ->
      pattern = new up.URLPattern('/foo/bar')
      expect(pattern.matches('/foo/bar')).toBe(true)

    it 'returns false if the given URL matches the end of an exact pattern, but misses a prefix', ->
      pattern = new up.URLPattern('/foo/bar')
      expect(pattern.matches('/bar')).toBe(false)

    it 'returns false if the given URL matches the beginning of an exact pattern, but misses a suffix', ->
      pattern = new up.URLPattern('/foo/bar')
      expect(pattern.matches('/foo')).toBe(false)

    it 'returns true if the given URL matches a pattern with a wildcard (*)', ->
      pattern = new up.URLPattern('/foo/*/baz')
      expect(pattern.matches('/foo/bar/baz')).toBe(true)

    it 'returns true if the given URL matches a pattern with a named segment', ->
      pattern = new up.URLPattern('/foo/:middle/baz')
      expect(pattern.matches('/foo/bar/baz')).toBe(true)

    it 'returns true if the given URL matches either of two space-separated URLs', ->
      pattern = new up.URLPattern('/foo /bar')
      expect(pattern.matches('/foo')).toBe(true)
      expect(pattern.matches('/bar')).toBe(true)

    it 'returns false if the given URL matchers neither of two space-separated URLs', ->
      pattern = new up.URLPattern('/foo /bar')
      expect(pattern.matches('/baz')).toBe(false)

  describe '#recognize', ->

    it 'returns an object mapping named segments to their value', ->
      pattern = new up.URLPattern('/foo/:one/:two/baz')
      expect(pattern.recognize('/foo/bar/bam/baz')).toEqual { one: 'bar', two: 'bam' }

    it 'returns an object if two space-separated URLs have the same named segment', ->
      pattern = new up.URLPattern('/foo/:one /bar/:one')
      expect(pattern.recognize('/foo/bar')).toEqual { one: 'bar' }

    it 'returns a missing value if the given URL does not match the pattern', ->
      pattern = new up.URLPattern('/foo')
      expect(pattern.recognize('/bar')).toBeMissing()

    it 'matches query params', ->
      pattern = new up.URLPattern('/search?query=:query&page=:page')
      expect(pattern.recognize('/search?query=hello&page=3')).toEqual { query: 'hello', page: '3' }
