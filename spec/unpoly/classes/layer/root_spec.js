describe('up.Layer.Root', function() {

  describe('#dismiss()', () => it('throws an error', function() {
    const dismiss = () => up.layer.root.dismiss('value')
    expect(dismiss).toThrowError(/cannot close the root layer/i)
  }))

  describe('#accept()', () => it('returns a rejected promise', function() {
    const accept = () => up.layer.root.accept('value')
    expect(accept).toThrowError(/cannot close the root layer/i)
  }))
})
