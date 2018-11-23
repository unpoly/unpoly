describe 'up.browser', ->

  u = up.util

  describe 'JavaScript functions', ->

    describe 'up.browser.navigate', ->

      afterEach ->
        # We're preventing the form to be submitted during tests,
        # so we need to remove it manually after each example.
        $('form.up-page-loader').remove()

      describe "for GET requests", ->

        it "creates a GET form, adds all { params } as hidden fields and submits the form", ->
          submitForm = spyOn(up.browser, 'submitForm')
          up.browser.navigate('/foo', method: 'GET', params: { param1: 'param1 value', param2: 'param2 value' })
          expect(submitForm).toHaveBeenCalled()

          $form = $('form.up-page-loader')

          expect($form).toExist()
          # GET forms cannot have an URL with a query section in their [action] attribute.
          # The query section would be overridden by the serialized input values on submission.
          expect($form.attr('action')).toMatchUrl('/foo')

          expect($form.find('input[name="param1"][value="param1 value"]')).toExist()
          expect($form.find('input[name="param2"][value="param2 value"]')).toExist()

        it 'merges params from the given URL and the { params } option', ->
          submitForm = spyOn(up.browser, 'submitForm')
          up.browser.navigate('/foo?param1=param1%20value', method: 'GET', params: { param2: 'param2 value' })
          expect(submitForm).toHaveBeenCalled()
          $form = $('form.up-page-loader')
          expect($form).toExist()
          # GET forms cannot have an URL with a query section in their [action] attribute.
          # The query section would be overridden by the serialized input values on submission.
          expect($form.attr('action')).toMatchUrl('/foo')
          expect($form.find('input[name="param1"][value="param1 value"]')).toExist()
          expect($form.find('input[name="param2"][value="param2 value"]')).toExist()

      describe "for POST requests", ->

        it "creates a POST form, adds all { params } params as hidden fields and submits the form", ->
          submitForm = spyOn(up.browser, 'submitForm')
          up.browser.navigate('/foo', method: 'POST', params: { param1: 'param1 value', param2: 'param2 value' })
          expect(submitForm).toHaveBeenCalled()
          $form = $('form.up-page-loader')
          expect($form).toExist()
          expect($form.attr('action')).toMatchUrl('/foo')
          expect($form.attr('method')).toEqual('POST')
          expect($form.find('input[name="param1"][value="param1 value"]')).toExist()
          expect($form.find('input[name="param2"][value="param2 value"]')).toExist()

        it 'merges params from the given URL and the { params } option', ->
          submitForm = spyOn(up.browser, 'submitForm')
          up.browser.navigate('/foo?param1=param1%20value', method: 'POST', params: { param2: 'param2 value' })
          expect(submitForm).toHaveBeenCalled()
          $form = $('form.up-page-loader')
          expect($form).toExist()
          expect($form.attr('action')).toMatchUrl('/foo')
          expect($form.attr('method')).toEqual('POST')
          expect($form.find('input[name="param1"][value="param1 value"]')).toExist()
          expect($form.find('input[name="param2"][value="param2 value"]')).toExist()

      u.each ['PUT', 'PATCH', 'DELETE'], (method) ->

        describe "for #{method} requests", ->

          it "uses a POST form and sends the actual method as a { _method } param", ->
            submitForm = spyOn(up.browser, 'submitForm')
            up.browser.navigate('/foo', method: method)
            expect(submitForm).toHaveBeenCalled()
            $form = $('form.up-page-loader')
            expect($form).toExist()
            expect($form.attr('method')).toEqual('POST')
            expect($form.find('input[name="_method"]').val()).toEqual(method)

      describe 'CSRF', ->

        beforeEach ->
          up.protocol.config.csrfToken = -> 'csrf-token'
          up.protocol.config.csrfParam = -> 'csrf-param'
          @submitForm = spyOn(up.browser, 'submitForm')

        it 'submits an CSRF token as another hidden field', ->
          up.browser.navigate('/foo', method: 'post')
          expect(@submitForm).toHaveBeenCalled()
          $form = $('form.up-page-loader')
          $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).toExist()
          expect($tokenInput.val()).toEqual('csrf-token')

        it 'does not add a CSRF token if there is none', ->
          up.protocol.config.csrfToken = -> ''
          up.browser.navigate('/foo', method: 'post')
          expect(@submitForm).toHaveBeenCalled()
          $form = $('form.up-page-loader')
          $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).not.toExist()

        it 'does not add a CSRF token for GET requests', ->
          up.browser.navigate('/foo', method: 'get')
          expect(@submitForm).toHaveBeenCalled()
          $form = $('form.up-page-loader')
          $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).not.toExist()

        it 'does not add a CSRF token when loading content from another domain', ->
          up.browser.navigate('http://other-domain.tld/foo', method: 'get')
          expect(@submitForm).toHaveBeenCalled()
          $form = $('form.up-page-loader')
          $tokenInput = $form.find('input[name="csrf-param"]')
          expect($tokenInput).not.toExist()

    describe 'up.browser.sprintf', ->

      describe '(string argument)', ->

        it 'serializes with surrounding quotes', ->
          formatted = up.browser.sprintf('before %o after', 'argument')
          expect(formatted).toEqual('before "argument" after')
  
      describe '(undefined argument)', ->
  
        it 'serializes to the word "undefined"', ->
          formatted = up.browser.sprintf('before %o after', undefined)
          expect(formatted).toEqual('before undefined after')
  
      describe '(null argument)', ->
  
        it 'serializes to the word "null"', ->
          formatted = up.browser.sprintf('before %o after', null)
          expect(formatted).toEqual('before null after')
  
      describe '(number argument)', ->
  
        it 'serializes the number as string', ->
          formatted = up.browser.sprintf('before %o after', 5)
          expect(formatted).toEqual('before 5 after')
  
      describe '(function argument)', ->
  
        it 'serializes the function code', ->
          formatted = up.browser.sprintf('before %o after', `function foo() {}`)
          expect(formatted).toEqual('before function foo() {} after')
  
      describe '(array argument)', ->
  
        it 'recursively serializes the elements', ->
          formatted = up.browser.sprintf('before %o after', [1, "foo"])
          expect(formatted).toEqual('before [1, "foo"] after')
  
      describe '(element argument)', ->
  
        it 'serializes the tag name with id, name and class attributes, but ignores other attributes', ->
          $element = $('<table id="id-value" name="name-value" class="class-value" title="title-value">')
          element = $element.get(0)
          formatted = up.browser.sprintf('before %o after', element)
          expect(formatted).toEqual('before <table id="id-value" name="name-value" class="class-value"> after')
  
      describe '(jQuery argument)', ->
  
        it 'serializes the tag name with id, name and class attributes, but ignores other attributes', ->
          $element1 = $('<table id="table-id">')
          $element2 = $('<ul id="ul-id">')
          formatted = up.browser.sprintf('before %o after', $element1.add($element2))
          expect(formatted).toEqual('before $(<table id="table-id">, <ul id="ul-id">) after')
  
      describe '(object argument)', ->
  
        it 'serializes to JSON', ->
          object = { foo: 'foo-value', bar: 'bar-value' }
          formatted = up.browser.sprintf('before %o after', object)
          expect(formatted).toEqual('before {"foo":"foo-value","bar":"bar-value"} after')
  
        it "skips a key if a getter crashes", ->
          object = {}
          Object.defineProperty(object, 'foo', get: (-> throw "error"))
          formatted = up.browser.sprintf('before %o after', object)
          expect(formatted).toEqual('before {} after')
  
          object.bar = 'bar'
          formatted = up.browser.sprintf('before %o after', object)
          expect(formatted).toEqual('before {"bar":"bar"} after')

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
