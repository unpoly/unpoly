describe 'up.Config', ->

  describe 'constructor', ->

    it 'creates an object with the given attributes', ->
      object = up.util.config(a: 1, b: 2)
      expect(object.a).toBe(1)
      expect(object.b).toBe(2)

  describe '#reset', ->

    it 'resets the object to its original state', ->
      object = up.util.config(a: 1)
      expect(object.b).toBeUndefined()
      object.a = 2
      expect(object.a).toBe(2)
      object.reset()
      expect(object.a).toBe(1)

    it 'does not remove the #reset or #update method from the object', ->
      object = up.util.config(a: 1)
      object.b = 2
      object.reset()
      expect(object.reset).toBeDefined()
