const u = up.util
const $ = jQuery

describe('up.browser', function() {

  describe('JavaScript', function() {

    describe('up.browser.assertConfirmed', function() {

      it('shows a confirmation dialog with the given message', function() {
        spyOn(window, 'confirm').and.returnValue(true)
        up.internal.assertConfirmed({ confirm: 'Do action?' })
        expect(window.confirm).toHaveBeenCalledWith('Do action?')
      })

      it('throws an AbortError when any listener calls event.preventDefault()', function() {
        spyOn(window, 'confirm').and.returnValue(false)
        const call = () => up.internal.assertConfirmed({ confirm: 'Do action?' })
        expect(call).toAbort()
      })

      it('does now show a confirmation dialog and fulfills if no { confirm } option is given', function() {
        spyOn(window, 'confirm')
        up.internal.assertConfirmed({})
        expect(window.confirm).not.toHaveBeenCalled()
      })

      it('does not show a confirmation dialog for { confirm: true }, as there is no message to show', function() {
        spyOn(window, 'confirm')
        up.internal.assertConfirmed({ confirm: true })
        expect(window.confirm).not.toHaveBeenCalled()
      })

      it('does not show a confirmation dialog for { confirm: false }', function() {
        spyOn(window, 'confirm')
        up.internal.assertConfirmed({ confirm: false })
        expect(window.confirm).not.toHaveBeenCalled()
      })
    })

    describe('up.browser.popCookie', function() {

      it('returns the value of the given cookie', function() {
        document.cookie = 'key=value'
        expect(up.internal.popCookie('key')).toEqual('value')
      })

      it('deletes the given cookie', function() {
        document.cookie = 'key=value'
        up.internal.popCookie('key')
        expect(document.cookie).not.toContain('key=Value')
      })
    })
  })
})
