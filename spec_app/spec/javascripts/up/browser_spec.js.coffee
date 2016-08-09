describe 'up.browser', ->

  u = up.util

  describe 'Javascript functions', ->

    describe 'up.browser.loadPage', ->

      afterEach ->
        # We're preventing the form to be submitted during tests,
        # so we need to remove it manually after each example.
        $('form.up-page-loader').remove()

      describe 'for GET requests', ->

        it 'sets location.href to the given URL', ->
          hrefSetter = up.browser.knife.mock('setLocationHref')
          up.browser.loadPage('/foo')
          expect(hrefSetter).toHaveBeenCalledWith('/foo')

        it 'encodes { data } params into the URL', ->
          hrefSetter = up.browser.knife.mock('setLocationHref')
          up.browser.loadPage('/foo', data: { param1: 'param1 value', param2: 'param2 value' })
          expect(hrefSetter).toHaveBeenCalledWith('/foo?param1=param1%20value&param2=param2%20value')

      describe 'for POST requests', ->

        it 'creates a form, adds all { data } params a hidden fields and submits the form', ->
          submitForm = up.browser.knife.mock('submitForm')
          up.browser.loadPage('/foo', method: 'post', data: { param1: 'param1 value', param2: 'param2 value' })
          expect(submitForm).toHaveBeenCalled()
          $form = $('form.up-page-loader')
          expect($form).toExist()
          expect($form.attr('action')).toEqual('/foo')
          expect($form.attr('method')).toEqual('post')
          expect($form.find('input[name="param1"][value="param1 value"]')).toExist()
          expect($form.find('input[name="param2"][value="param2 value"]')).toExist()

        it 'submits the Rails CSRF token as another hidden field', ->
          submitForm = up.browser.knife.mock('submitForm')
          spyOn(up.rails, 'csrfField').and.returnValue
            name: 'authenticity-param-name',
            value: 'authenticity-token'
          up.browser.loadPage('/foo', method: 'post')
          expect(submitForm).toHaveBeenCalled()
          $form = $('form.up-page-loader')
          $tokenInput = $form.find('input[name="authenticity-param-name"]')
          expect($tokenInput).toExist()
          expect($tokenInput.val()).toEqual('authenticity-token')

      u.each ['PUT', 'PATCH', 'DELETE'], (method) ->

        describe "for #{method} requests", ->

          it "uses a POST form and sends the actual method as a { _method } param", ->
            submitForm = up.browser.knife.mock('submitForm')
            up.browser.loadPage('/foo', method: method)
            expect(submitForm).toHaveBeenCalled()
            $form = $('form.up-page-loader')
            expect($form).toExist()
            expect($form.attr('method')).toEqual('post')
            expect($form.find('input[name="_method"]').val()).toEqual(method.toLowerCase())
