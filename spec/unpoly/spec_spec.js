const u = up.util
const $ = jQuery

describe('specs', function() {

  describe('toEqual() matcher', function() {
    it('does not consider a jQuery collection to be equal to its contained element (which is what jasmine-jquery does and which makes out expectations too soft)', function() {
      const element = document.createElement('div')
      const $element = $(element)
      expect($element).not.toEqual(element)
    })
  })

  describe('wait()', function() {

    describe('without arguments', function() {

      it('waits until a long promise chain has fired callbacks', async function() {
        let callback = jasmine.createSpy('callback')

        let promise = Promise.resolve()
        for (let i = 0; i < 100; i++) {
          promise = promise.then(Promise.resolve())
        }
        promise.then(callback)
        expect(callback).not.toHaveBeenCalled()

        await wait()
        expect(callback).toHaveBeenCalled()
      })

    })
  })

})
