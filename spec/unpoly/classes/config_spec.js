describe('up.Config', function() {

  describe('constructor', function() {
    it('creates an object from a function that productes the initial attributes', function() {
      const object = new up.Config(() => ({
        a: 1,
        b: 2
      }))
      expect(object.a).toBe(1)
      expect(object.b).toBe(2)
    })
  })

  describe('#reset', function() {

    it('resets the object to its original state', function() {
      const object = new up.Config(() => ({
        a: 1
      }))
      expect(object.b).toBeUndefined()
      object.a = 2
      expect(object.a).toBe(2)
      object.reset()
      expect(object.a).toBe(1)
    })

    it('does not remove the #reset method from the object', function() {
      const object = new up.Config(() => ({
        a: 1
      }))
      object.b = 2
      object.reset()
      expect(object.reset).toBeDefined()
    })
  })
})
