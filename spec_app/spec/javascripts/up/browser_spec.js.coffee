describe 'up.browser', ->

  u = up.util

  describe 'JavaScript functions', ->

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
