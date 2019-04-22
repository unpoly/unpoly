u = up.util
$ = jQuery

describe 'up.browser', ->

  describe 'JavaScript functions', ->

    describe 'up.browser.loadPage', ->

      afterEach ->
        # We're preventing the form to be submitted during tests,
        # so we need to remove it manually after each example.
        $('form.up-page-loader').remove()

      describe "for GET requests", ->

        it "creates a GET form, adds all { params } as hidden fields and submits the form", ->
          submitForm = spyOn(up.browser, 'submitForm')
          up.browser.loadPage('/foo', method: 'GET', params: { param1: 'param1 value', param2: 'param2 value' })
          expect(submitForm).toHaveBeenCalled()

          $form = $('form.up-page-loader')

          expect($form).toBeAttached()
          # GET forms cannot have an URL with a query section in their [action] attribute.
          # The query section would be overridden by the serialized input values on submission.
          expect($form.attr('action')).toMatchUrl('/foo')

          expect($form.find('input[name="param1"][value="param1 value"]')).toBeAttached()
          expect($form.find('input[name="param2"][value="param2 value"]')).toBeAttached()

        it 'merges params from the given URL and the { params } option', ->
          submitForm = spyOn(up.browser, 'submitForm')
          up.browser.loadPage('/foo?param1=param1%20value', method: 'GET', params: { param2: 'param2 value' })
          expect(submitForm).toHaveBeenCalled()
          $form = $('form.up-page-loader')
          expect($form).toBeAttached()
          # GET forms cannot have an URL with a query section in their [action] attribute.
          # The query section would be overridden by the serialized input values on submission.
          expect($form.attr('action')).toMatchUrl('/foo')
          expect($form.find('input[name="param1"][value="param1 value"]')).toBeAttached()
          expect($form.find('input[name="param2"][value="param2 value"]')).toBeAttached()

      describe "for POST requests", ->

        it "creates a POST form, adds all { params } params as hidden fields and submits the form", ->
          submitForm = spyOn(up.browser, 'submitForm')
          up.browser.loadPage('/foo', method: 'POST', params: { param1: 'param1 value', param2: 'param2 value' })
          expect(submitForm).toHaveBeenCalled()
          $form = $('form.up-page-loader')
          expect($form).toBeAttached()
          expect($form.attr('action')).toMatchUrl('/foo')
          expect($form.attr('method')).toEqual('POST')
          expect($form.find('input[name="param1"][value="param1 value"]')).toBeAttached()
          expect($form.find('input[name="param2"][value="param2 value"]')).toBeAttached()

        it 'merges params from the given URL and the { params } option', ->
          submitForm = spyOn(up.browser, 'submitForm')
          up.browser.loadPage('/foo?param1=param1%20value', method: 'POST', params: { param2: 'param2 value' })
          expect(submitForm).toHaveBeenCalled()
          $form = $('form.up-page-loader')
          expect($form).toBeAttached()
          expect($form.attr('action')).toMatchUrl('/foo')
          expect($form.attr('method')).toEqual('POST')
          expect($form.find('input[name="param1"][value="param1 value"]')).toBeAttached()
          expect($form.find('input[name="param2"][value="param2 value"]')).toBeAttached()

      u.each ['PUT', 'PATCH', 'DELETE'], (method) ->

        describe "for #{method} requests", ->

          it "uses a POST form and sends the actual method as a { _method } param", ->
            submitForm = spyOn(up.browser, 'submitForm')
            up.browser.loadPage('/foo', method: method)
            expect(submitForm).toHaveBeenCalled()
            $form = $('form.up-page-loader')
            expect($form).toBeAttached()
            expect($form.attr('method')).toEqual('POST')
            expect($form.find('input[name="_method"]').val()).toEqual(method)

      describe 'CSRF', ->

        beforeEach ->
          up.protocol.config.csrfToken = -> 'csrf-token'
          up.protocol.config.csrfParam = -> 'csrf-param'
          @submitForm = spyOn(up.browser, 'submitForm')

        it 'submits an CSRF token as another hidden field', ->
          up.browser.loadPage('/foo', method: 'post')
          expect(@submitForm).toHaveBeenCalled()
          $form = $('form.up-page-loader')
          $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).toBeAttached()
          expect($tokenInput.val()).toEqual('csrf-token')

        it 'does not add a CSRF token if there is none', ->
          up.protocol.config.csrfToken = -> ''
          up.browser.loadPage('/foo', method: 'post')
          expect(@submitForm).toHaveBeenCalled()
          $form = $('form.up-page-loader')
          $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).not.toBeAttached()

        it 'does not add a CSRF token for GET requests', ->
          up.browser.loadPage('/foo', method: 'get')
          expect(@submitForm).toHaveBeenCalled()
          $form = $('form.up-page-loader')
          $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).not.toBeAttached()

        it 'does not add a CSRF token when loading content from another domain', ->
          up.browser.loadPage('http://other-domain.tld/foo', method: 'get')
          expect(@submitForm).toHaveBeenCalled()
          $form = $('form.up-page-loader')
          $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).not.toBeAttached()

    describe 'up.browser.whenConfirmed', ->

      it 'shows a confirmation dialog with the given message and fulfills when the user presses OK', (done) ->
        spyOn(window, 'confirm').and.returnValue(true)
        promise = up.browser.whenConfirmed(confirm: 'Do action?')
        promiseState(promise).then (result) ->
          expect(window.confirm).toHaveBeenCalledWith('Do action?')
          expect(result.state).toEqual('fulfilled')
          done()

      it 'emits the event and rejects the returned promise when any listener calls event.preventDefault()', (done) ->
        spyOn(window, 'confirm').and.returnValue(false)
        promise = up.browser.whenConfirmed(confirm: 'Do action?')
        promiseState(promise).then (result) ->
          expect(window.confirm).toHaveBeenCalledWith('Do action?')
          expect(result.state).toEqual('rejected')
          done()

      it 'does now show a conformation dialog and fulfills if no { confirm } option is given', (done) ->
        spyOn(window, 'confirm')
        promise = up.browser.whenConfirmed({})
        promiseState(promise).then (result) ->
          expect(window.confirm).not.toHaveBeenCalled()
          expect(result.state).toEqual('fulfilled')
          done()

      it "does now show a conformation dialog and fulfills if a { confirm } option is given but we're also preloading", (done) ->
        spyOn(window, 'confirm')
        promise = up.browser.whenConfirmed(confirm: 'Do action?', preload: true)
        promiseState(promise).then (result) ->
          expect(window.confirm).not.toHaveBeenCalled()
          expect(result.state).toEqual('fulfilled')
          done()
