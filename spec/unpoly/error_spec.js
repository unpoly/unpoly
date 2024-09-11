const u = up.util

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

  describe('up.error.guard()', function() {

    it('calls the given function and returns its return value', function() {
      let fn = () => 123
      expect(up.error.guard(fn)).toBe(123)
    })

    describe('when the function throws an error', function() {

      it('does not crash', async function() {
        await jasmine.spyOnGlobalErrorsAsync(async function() {
          let fn = () => { throw new Error('error message') }
          let runGuarded = () => up.error.guard(fn)
          expect(runGuarded).not.toThrowError()
        })
      })

      it('returns undefined', async function() {
        await jasmine.spyOnGlobalErrorsAsync(async function() {
          let fn = () => { throw new Error('error message') }
          expect(up.error.guard(fn)).toBe(undefined)
        })
      })

      it('emits an error event for the error', async function() {
        let error = new Error('error message')
        let fn = () => { throw error }

        await jasmine.expectGlobalError(error, async function() {
          up.error.guard(fn)
        })
      })

    })

  })

  describe('up.error.guardFn()', function() {

    it('returns a function that calls the given functions', function() {
      let fn = jasmine.createSpy('wrapped function').and.returnValue(123)
      let guarded = up.error.guardFn(fn)

      expect(guarded).toEqual(jasmine.any(Function))
      expect(fn).not.toHaveBeenCalled()

      expect(guarded('arg0', 'arg1')).toBe(123)
      expect(fn).toHaveBeenCalledWith('arg0', 'arg1')
    })

    it('calls the wrapped function with a guard', async function() {
      let error = new Error('error message')
      let fn = jasmine.createSpy('wrapped function').and.throwError(error)
      let guarded = up.error.guardFn(fn)

      await jasmine.expectGlobalError(error, async function() {
        expect(guarded).not.toThrowError()
      })
    })

  })

})
