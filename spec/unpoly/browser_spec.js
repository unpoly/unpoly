const u = up.util
const $ = jQuery

describe('up.browser', function() {
  
  describe('JavaScript functions', function() {

    describe('up.browser.loadPage', function() {

      afterEach(function() {
        // We're preventing the form to be submitted during tests,
        // so we need to remove it manually after each example.
        $('form.up-request-loader').remove()
      })

      describe("for GET requests", function() {

        it("creates a GET form, adds all { params } as hidden fields and submits the form", function() {
          const submitForm = spyOn(up.browser, 'submitForm')
          up.browser.loadPage({url: '/foo', method: 'GET', params: { param1: 'param1 value', param2: 'param2 value' }})
          expect(submitForm).toHaveBeenCalled()

          const $form = $('form.up-request-loader')

          expect($form).toBeAttached()
          // GET forms cannot have an URL with a query section in their [action] attribute.
          // The query section would be overridden by the serialized input values on submission.
          expect($form.attr('action')).toMatchURL('/foo')

          expect($form.find('input[name="param1"][value="param1 value"]')).toBeAttached()
          expect($form.find('input[name="param2"][value="param2 value"]')).toBeAttached()
        })

        it('merges params from the given URL and the { params } option', function() {
          const submitForm = spyOn(up.browser, 'submitForm')
          up.browser.loadPage({url: '/foo?param1=param1%20value', method: 'GET', params: { param2: 'param2 value' }})
          expect(submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          expect($form).toBeAttached()
          // GET forms cannot have an URL with a query section in their [action] attribute.
          // The query section would be overridden by the serialized input values on submission.
          expect($form.attr('action')).toMatchURL('/foo')
          expect($form.find('input[name="param1"][value="param1 value"]')).toBeAttached()
          expect($form.find('input[name="param2"][value="param2 value"]')).toBeAttached()
        })
      })

      describe("for POST requests", function() {

        it("creates a POST form, adds all { params } params as hidden fields and submits the form", function() {
          const submitForm = spyOn(up.browser, 'submitForm')
          up.browser.loadPage({url: '/foo', method: 'POST', params: { param1: 'param1 value', param2: 'param2 value' }})
          expect(submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          expect($form).toBeAttached()
          expect($form.attr('action')).toMatchURL('/foo')
          expect($form.attr('method')).toEqual('POST')
          expect($form.find('input[name="param1"][value="param1 value"]')).toBeAttached()
          expect($form.find('input[name="param2"][value="param2 value"]')).toBeAttached()
        })

        it('merges params from the given URL and the { params } option', function() {
          const submitForm = spyOn(up.browser, 'submitForm')
          up.browser.loadPage({url: '/foo?param1=param1%20value', method: 'POST', params: { param2: 'param2 value' }})
          expect(submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          expect($form).toBeAttached()
          expect($form.attr('action')).toMatchURL('/foo')
          expect($form.attr('method')).toEqual('POST')
          expect($form.find('input[name="param1"][value="param1 value"]')).toBeAttached()
          expect($form.find('input[name="param2"][value="param2 value"]')).toBeAttached()
        })

        it('uses the given { contentType }', function() {
          const submitForm = spyOn(up.browser, 'submitForm')
          up.browser.loadPage({url: '/foo', method: 'POST', params: { foo: 'bar' }, contentType: 'multipart/form-data'})
          expect(submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          expect($form).toBeAttached()
          expect($form.attr('enctype')).toEqual('multipart/form-data')
        })
      })

      u.each(['PUT', 'PATCH', 'DELETE'], method => describe(`for ${method} requests`, () => it("uses a POST form and sends the actual method as a { _method } param", function() {
        const submitForm = spyOn(up.browser, 'submitForm')
        up.browser.loadPage({url: '/foo', method})
        expect(submitForm).toHaveBeenCalled()
        const $form = $('form.up-request-loader')
        expect($form).toBeAttached()
        expect($form.attr('method')).toEqual('POST')
        expect($form.find('input[name="_method"]').val()).toEqual(method)
      })))

      describe('CSRF', function() {

        beforeEach(function() {
          up.protocol.config.csrfToken = () => 'csrf-token'
          up.protocol.config.csrfParam = () => 'csrf-param'
          this.submitForm = spyOn(up.browser, 'submitForm')
        })

        it('submits an CSRF token as another hidden field', function() {
          up.browser.loadPage({url: '/foo', method: 'post'})
          expect(this.submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          const $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).toBeAttached()
          expect($tokenInput.val()).toEqual('csrf-token')
        })

        it('does not add a CSRF token if there is none', function() {
          up.protocol.config.csrfToken = () => ''
          up.browser.loadPage({url: '/foo', method: 'post'})
          expect(this.submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          const $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).not.toBeAttached()
        })

        it('does not add a CSRF token for GET requests', function() {
          up.browser.loadPage({url: '/foo', method: 'get'})
          expect(this.submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          const $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).not.toBeAttached()
        })

        it('does not add a CSRF token when loading content from another domain', function() {
          up.browser.loadPage({url: 'http://other-domain.tld/foo', method: 'get'})
          expect(this.submitForm).toHaveBeenCalled()
          const $form = $('form.up-request-loader')
          const $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).not.toBeAttached()
        })
      })
    })

    describe('up.browser.assertConfirmed', function() {

      it('shows a confirmation dialog with the given message', function() {
        spyOn(window, 'confirm').and.returnValue(true)
        up.browser.assertConfirmed({confirm: 'Do action?'})
        expect(window.confirm).toHaveBeenCalledWith('Do action?')
      })

      it('throws an AbortError when any listener calls event.preventDefault()', function() {
        spyOn(window, 'confirm').and.returnValue(false)
        const call = () => up.browser.assertConfirmed({confirm: 'Do action?'})
        expect(call).toAbort()
      })

      it('does now show a conformation dialog and fulfills if no { confirm } option is given', function() {
        spyOn(window, 'confirm')
        up.browser.assertConfirmed({})
        expect(window.confirm).not.toHaveBeenCalled()
      })
    })

    describe('up.browser.popCookie', function() {

      it('returns the value of the given cookie', function() {
        document.cookie = 'key=value'
        expect(up.browser.popCookie('key')).toEqual('value')
      })

      it('deletes the given cookie', function() {
        document.cookie = 'key=value'
        up.browser.popCookie('key')
        expect(document.cookie).not.toContain('key=Value')
      })
    })
  })
})
