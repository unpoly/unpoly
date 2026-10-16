describe('up.Record', function() {
  describe('defaults', function() {

    class TestRecord extends up.Record {
      keys() { return ['foo', 'bar'] }
      defaults() { return { foo: 'default foo', bar: 'default bar' } }
    }

    it('is used for missing constructor props', function() {
      const record = new TestRecord({ foo: 'given foo' })

      expect(record.bar).toBe('default bar')
    })

    it('can be overridden by constructor props', function() {
      const record = new TestRecord({ foo: 'given foo' })

      expect(record.foo).toBe('given foo')
    })

    it('always copies in case #defaults() always returns the same object')
  })
})

