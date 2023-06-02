u = up.util

describe('up.error', function() {

  describe('up.error.muteUncriticalRejection()', function() {

    it('does not mute a fulfilled promise', async function() {
      const value = 'fulfillment value'
      const promise = Promise.resolve(value)
      const mutedPromise = up.error.muteUncriticalRejection(promise)

      await expectAsync(mutedPromise).toBeResolvedTo(value)
    })

    it('mutes a rejected promise if the rejection value is an up.Response', async function() {
      const response = new up.Response()
      const promise = Promise.reject(response)
      const mutedPromise = up.error.muteUncriticalRejection(promise)

      await expectAsync(mutedPromise).toBeResolved()
    })

    it('mutes a rejected promise if the rejection value is an up.RenderResult', async function() {
      const renderResult = new up.RenderResult()
      const promise = Promise.reject(renderResult)
      const mutedPromise = up.error.muteUncriticalRejection(promise)

      await expectAsync(mutedPromise).toBeResolved()
    })

    it('mutes a rejected promise if the rejection value is an AbortError', async function() {
      const abortError = new up.Aborted('User aborted')
      const promise = Promise.reject(abortError)
      const mutedPromise = up.error.muteUncriticalRejection(promise)

      await expectAsync(mutedPromise).toBeResolved()
    })

    return it('does not mute a rejected promise with another rejection value', async function() {
      const error = new Error('other error')
      const promise = Promise.reject(error)
      const mutedPromise = up.error.muteUncriticalRejection(promise)

      await expectAsync(mutedPromise).toBeRejectedWith(error)
    })
  })

})
