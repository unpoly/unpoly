u = up.util

describe('up.error', function() {

  describe('up.error.muteUncriticalRejection()', function() {

    it('does not mute a fulfilled promise', function(done) {
      const value = 'fulfillment value'
      const promise = Promise.resolve(value)
      const mutedPromise = up.error.muteUncriticalRejection(promise)

      u.task(() => promiseState(mutedPromise).then(function(result) {
        expect(result.state).toBe('fulfilled')
        expect(result.value).toBe(value)
        done()
      }))
    })

    it('mutes a rejected promise if the rejection value is an up.Response', function(done) {
      const response = new up.Response()
      const promise = Promise.reject(response)
      const mutedPromise = up.error.muteUncriticalRejection(promise)

      u.task(() => promiseState(mutedPromise).then(function(result) {
        expect(result.state).toBe('fulfilled')
        expect(window).not.toHaveUnhandledRejections()
        done()
      }))
    })

    it('mutes a rejected promise if the rejection value is an up.RenderResult', function(done) {
      const renderResult = new up.RenderResult()
      const promise = Promise.reject(renderResult)
      const mutedPromise = up.error.muteUncriticalRejection(promise)

      u.task(() => promiseState(mutedPromise).then(function(result) {
        expect(result.state).toBe('fulfilled')
        expect(window).not.toHaveUnhandledRejections()
        done()
      }))
    })

    it('mutes a rejected promise if the rejection value is an AbortError', function(done) {
      const abortError = up.error.aborted('User aborted')
      const promise = Promise.reject(abortError)
      const mutedPromise = up.error.muteUncriticalRejection(promise)

      u.task(() => promiseState(mutedPromise).then(function(result) {
        expect(result.state).toBe('fulfilled')
        expect(window).not.toHaveUnhandledRejections()
        done()
      }))
    })

    return it('does not mute a rejected promise with another rejection value', function(done) {
      const error = new Error('other error')
      const promise = Promise.reject(error)
      const mutedPromise = up.error.muteUncriticalRejection(promise)

      u.task(() => promiseState(mutedPromise).then(function(result) {
        expect(result.state).toBe('rejected')
        expect(result.value).toBe(error)
        done()
      }))
    })
  })

})
