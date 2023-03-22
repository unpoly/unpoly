describe 'up.FIFOCache', ->

  describe '#get()', ->

    it 'returns an item that was previously set', ->
      cache = new up.FIFOCache()
      cache.set('foo', 'value of foo')
      cache.set('bar', 'value of bar')

      expect(cache.get('foo')).toEqual('value of foo')
      expect(cache.get('bar')).toEqual('value of bar')

    it 'returns undefined if no item with that key was set', ->
      cache = new up.FIFOCache()
      cache.set('foo', 'value of foo')

      expect(cache.get('bar')).toBeUndefined()

    describe 'with { normalizeKey } option', ->

      it 'normalizes the cache key before setting and retrieval', ->
        cache = new up.FIFOCache({ normalizeKey: (key) -> key.length })
        cache.set('foo', 'value of foo')

        expect(cache.get('foo')).toBe('value of foo')
        expect(cache.get('bar')).toBe('value of foo')
        expect(cache.get('quix')).toBeUndefined()

  describe '#set()', ->

    it 'removes the oldest item if setting a new item would exceed the cache size', ->
      cache = new up.FIFOCache(capacity: 2)

      cache.set('foo', 'value of foo')
      cache.set('bar', 'value of bar')
      cache.set('baz', 'value of baz')

      expect(cache.get('foo')).toBeUndefined()
      expect(cache.get('bar')).toEqual('value of bar')
      expect(cache.get('baz')).toEqual('value of baz')
