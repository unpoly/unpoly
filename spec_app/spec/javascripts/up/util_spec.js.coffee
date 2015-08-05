describe 'up.util', ->
  
  describe 'Javascript functions', ->

    describe '.isBlank', ->
  
      it 'returns false for false', ->
        expect(up.util.isBlank(false)).toBe(false)
        
      it 'returns false for true', ->
        expect(up.util.isBlank(true)).toBe(false)
  
      it 'returns true for null', ->
        expect(up.util.isBlank(null)).toBe(true)
        
      it 'returns true for undefined', ->
        expect(up.util.isBlank(undefined)).toBe(true)
        
      it 'returns true for an empty String', ->
        expect(up.util.isBlank('')).toBe(true)
        
      it 'returns false for a String with at least one character', ->
        expect(up.util.isBlank('string')).toBe(false)
        
      it 'returns true for an empty array', ->
        expect(up.util.isBlank([])).toBe(true)
        
      it 'returns false for an array with at least one element', ->
        expect(up.util.isBlank(['element'])).toBe(false)

      it 'returns true for an empty object', ->
        expect(up.util.isBlank({})).toBe(true)

      it 'returns true for an object with at least one key', ->
        expect(up.util.isBlank({key: 'value'})).toBe(false)

    describe '.normalizeUrl', ->

      it 'normalizes a relative path', ->
        expect(up.util.normalizeUrl('foo')).toBe("http://#{location.hostname}:#{location.port}/foo")

      it 'normalizes an absolute path', ->
        expect(up.util.normalizeUrl('/foo')).toBe("http://#{location.hostname}:#{location.port}/foo")

      it 'normalizes a full URL', ->
        expect(up.util.normalizeUrl('http://example.com/foo/bar')).toBe('http://example.com/foo/bar')

    describe '.detect', ->

      it 'finds the first element in the given array that matches the given tester', ->
        array = ['foo', 'bar', 'baz']
        tester = (element) -> element[0] == 'b'
        expect(up.util.detect(array, tester)).toEqual('bar')

      it "returns null if the given array doesn't contain a matching element", ->
        array = ['foo', 'bar', 'baz']
        tester = (element) -> element[0] == 'z'
        expect(up.util.detect(array, tester)).toBeNull()
