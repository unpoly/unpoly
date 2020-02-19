describe 'up.UrlPattern', ->

  describe '#matches', ->

    it 'returns true if the given URL matches an exact pattern completely', ->
      pattern = new up.UrlPattern('/foo/bar')
      expect(pattern.matches('/foo/bar')).toBe(true)

    it 'returns false if the given URL matches the end of an exact pattern, but misses a prefix', ->
      pattern = new up.UrlPattern('/foo/bar')
      expect(pattern.matches('/bar')).toBe(false)

    it 'returns false if the given URL matches the beginning of an exact pattern, but misses a suffix', ->
      pattern = new up.UrlPattern('/foo/bar')
      expect(pattern.matches('/foo')).toBe(false)

    it 'returns true if the given URL matches a pattern with a wildcard (*)', ->
      pattern = new up.UrlPattern('/foo/*/baz')
      expect(pattern.matches('/foo/bar/baz')).toBe(true)

    it 'returns true if the given URL matches a pattern with a named segment', ->
      pattern = new up.UrlPattern('/foo/:middle/baz')
      expect(pattern.matches('/foo/bar/baz')).toBe(true)

    it 'returns true if the given URL matches either of two space-separated URLs', ->
      pattern = new up.UrlPattern('/foo /bar')
      expect(pattern.matches('/foo')).toBe(true)
      expect(pattern.matches('/bar')).toBe(true)

    it 'returns false if the given URL matchers neither of two space-separated URLs', ->
      pattern = new up.UrlPattern('/foo /bar')
      expect(pattern.matches('/baz')).toBe(false)

