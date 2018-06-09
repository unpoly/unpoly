describe 'up.store.Memory', ->

  describe '#get', ->

    it 'returns an item that was previously set', ->
      store = new up.store.Memory()
      store.set('foo', 'value of foo')
      store.set('bar', 'value of bar')

      expect(store.get('foo')).toEqual('value of foo')
      expect(store.get('bar')).toEqual('value of bar')

    it 'returns undefined if no item with that key was set', ->
      store = new up.store.Memory()
      store.set('foo', 'value of foo')

      expect(store.get('bar')).toBeUndefined()

  describe '#keys', ->

    it 'returns an array of keys in the store', ->
      store = new up.store.Memory()
      store.set('foo', 'value of foo')
      store.set('bar', 'value of bar')

      expect(store.keys().sort()).toEqual ['bar', 'foo']

  describe '#values', ->

    it 'returns an array of values in the store', ->
      store = new up.store.Memory()
      store.set('foo', 'value of foo')
      store.set('bar', 'value of bar')

      expect(store.values().sort()).toEqual ['value of bar', 'value of foo']

  describe '#clear', ->

    it 'removes all keys from the store', ->
      store = new up.store.Memory()
      store.set('foo', 'value of foo')
      store.set('bar', 'value of bar')

      store.clear()

      expect(store.get('foo')).toBeUndefined()
      expect(store.get('bar')).toBeUndefined()

  describe '#remove', ->

    it 'removes the given key from the store', ->
      store = new up.store.Memory()
      store.set('foo', 'value of foo')
      store.set('bar', 'value of bar')

      store.remove('foo')

      expect(store.get('foo')).toBeUndefined()
      expect(store.get('bar')).toEqual('value of bar')
