u = up.util
$ = jQuery

describe 'up.Cache', ->

  describe '#get', ->

    it 'returns an item that was previously set', ->
      store = new up.Cache()
      store.set('foo', 'value of foo')
      store.set('bar', 'value of bar')

      expect(store.get('foo')).toEqual('value of foo')
      expect(store.get('bar')).toEqual('value of bar')

    it 'returns undefined if no item with that key was set', ->
      store = new up.Cache()
      store.set('foo', 'value of foo')

      expect(store.get('bar')).toBeUndefined()

    it 'returns undefined if the item has expired', ->
      jasmine.clock().install()
      jasmine.clock().mockDate(new Date())

      store = new up.Cache(evictAge: 100)
      store.set('foo', 'value of foo')

      jasmine.clock().tick(80)
      expect(store.get('foo')).toEqual('value of foo')

      jasmine.clock().tick(40)
      expect(store.get('foo')).toBeUndefined()

  describe '#set', ->

    it 'removes the oldest item if setting a new item would exceed the cache size', ->
      # There must be at least 1 ms between adding cache entries, or first-in-first-out won't work
      jasmine.clock().install()
      jasmine.clock().mockDate(new Date())
      store = new up.Cache(size: 2)

      store.set('foo', 'value of foo')
      jasmine.clock().tick(10)
      store.set('bar', 'value of bar')
      jasmine.clock().tick(10)
      store.set('baz', 'value of baz')

      expect(store.get('foo')).toBeUndefined()
      expect(store.get('bar')).toEqual('value of bar')
      expect(store.get('baz')).toEqual('value of baz')

  describe '#evict', ->

    it 'removes all entries from the store', ->
      cache = new up.Cache()
      cache.set('foo', 'value of foo')
      cache.set('bar', 'value of bar')

      cache.evict()

      expect(cache.get('foo')).toBeUndefined()
      expect(cache.get('bar')).toBeUndefined()

  describe '#remove', ->

    it 'removes the given key from the store', ->
      store = new up.Cache()
      store.set('foo', 'value of foo')
      store.set('bar', 'value of bar')

      store.remove('foo')

      expect(store.get('foo')).toBeUndefined()
      expect(store.get('bar')).toEqual('value of bar')
