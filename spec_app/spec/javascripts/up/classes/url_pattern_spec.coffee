u = up.util

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

    it 'returns an { url } property with the matching URL in a space-separated list of URLs', ->
      pattern = new up.URLPattern('/foo /bar /baz')
      url = '/bar'
      expect(pattern.recognize(url)).toEqual {
        url: u.normalizeURL(url)
      }

    it 'returns an object mapping named segments to their value', ->
      pattern = new up.URLPattern('/foo/:one/:two/baz')
      url = '/foo/bar/bam/baz'
      expect(pattern.recognize(url)).toEqual {
        url: u.normalizeURL(url)
        one: 'bar',
        two: 'bam'
      }

    it 'returns an object if two space-separated URLs have the same named segment', ->
      pattern = new up.URLPattern('/foo/:one /bar/:one')
      url = '/foo/bar'
      expect(pattern.recognize(url)).toEqual {
        url: u.normalizeURL(url),
        one: 'bar'
      }

    it 'returns a missing value if the given URL does not match the pattern', ->
      pattern = new up.URLPattern('/foo')
      url = '/bar'
      expect(pattern.recognize(url)).toBeMissing()

    it 'matches query params', ->
      pattern = new up.URLPattern('/search?query=:query&page=:page')
      url = '/search?query=hello&page=3'
      expect(pattern.recognize(url)).toEqual {
        url: u.normalizeURL(url),
        query: 'hello',
        page: '3'
      }
