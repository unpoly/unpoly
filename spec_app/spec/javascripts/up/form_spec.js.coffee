describe 'up.form', ->

  u = up.util

  describe 'Javascript functions', ->
    
    describe 'up.observe', ->

      changeEvents = if up.browser.canInputEvent()
        # Actually we only need `input`, but we want to notice
        # if another script manually triggers `change` on the element.
        ['input', 'change']
      else
        # Actually we won't ever get `input` from the user in this browser,
        # but we want to notice if another script manually triggers `input`
        # on the element.
        ['input', 'change', 'keypress', 'paste', 'cut', 'click', 'propertychange']

      u.each changeEvents, (eventName) ->

        describe 'when the first argument is a form field', ->

          it "runs the callback when the input receives a '#{eventName}' event and the value changed", (done) ->
            $input = affix('input[value="old-value"]')
            callback = jasmine.createSpy('change callback')
            up.observe($input, callback)
            $input.val('new-value')
            u.times 2, -> $input.trigger(eventName)
            u.nextFrame ->
              expect(callback).toHaveBeenCalledWith('new-value', $input)
              expect(callback.calls.count()).toEqual(1)
              done()

          it "does not run the callback when the input receives a '#{eventName}' event, but the value didn't change", (done) ->
            $input = affix('input[value="old-value"]')
            callback = jasmine.createSpy('change callback')
            up.observe($input, callback)
            $input.trigger(eventName)
            u.nextFrame ->
              expect(callback).not.toHaveBeenCalled()
              done()

          it "runs a callback in the same frame if the delay is 0 and it receives a '#{eventName}' event", ->
            $input = affix('input[value="old-value"]')
            callback = jasmine.createSpy('change callback')
            up.observe($input, { delay: 0 }, callback)
            $input.val('new-value')
            $input.trigger(eventName)
            expect(callback.calls.count()).toEqual(1)

          it "runs multiple callbacks in the same frame if the delay is 0 and it receives a '#{eventName}' event", ->
            $input = affix('input[value="old-value"]')
            callback = jasmine.createSpy('change callback')
            up.observe($input, { delay: 0 }, callback)
            $input.val('new-value')
            $input.trigger(eventName)
            $input.val('yet-another-value')
            $input.trigger(eventName)
            expect(callback.calls.count()).toEqual(2)

        describe 'when the first argument is a form', ->

          it "runs the callback when any of the form's inputs receives a '#{eventName}' event and the value changed", (done) ->
            $form = affix('form')
            $input = $form.affix('input[value="old-value"]')
            callback = jasmine.createSpy('change callback')
            up.observe($form, callback)
            $input.val('new-value')
            u.times 2, -> $input.trigger(eventName)
            u.nextFrame ->
              expect(callback).toHaveBeenCalledWith('new-value', $input)
              expect(callback.calls.count()).toEqual(1)
              done()

          it "does not run the callback when any of the form's inputs receives a '#{eventName}' event, but the value didn't change", (done) ->
            $form = affix('form')
            $input = $form.affix('input[value="old-value"]')
            callback = jasmine.createSpy('change callback')
            up.observe($form, callback)
            $input.trigger(eventName)
            u.nextFrame ->
              expect(callback).not.toHaveBeenCalled()
              done()

    describe 'up.submit', ->
      
      if up.browser.canPushState()
      
        beforeEach ->
          @$form = affix('form[action="/path/to"][method="put"][up-target=".response"]')
          @$form.append('<input name="field1" value="value1">')
          @$form.append('<input name="field2" value="value2">')
          affix('.response').text('old-text')
          @promise = up.submit(@$form)
          @request = @lastRequest()

        it 'submits the given form and replaces the target with the response', ->
          expect(@request.url).toMatch /\/path\/to$/
          expect(@request).toHaveRequestMethod('PUT')
          expect(@request.data()['field1']).toEqual(['value1'])
          expect(@request.data()['field2']).toEqual(['value2'])
          expect(@request.requestHeaders['X-Up-Target']).toEqual('.response')

          @respondWith """
            text-before

            <div class="response">
              new-text
            </div>

            text-after
            """

        it "places the response into the form and doesn't update the browser URL if the submission returns a 5xx status code", ->
          up.submit(@$form)
          @respondWith
            status: 500
            contentType: 'text/html'
            responseText:
              """
              text-before
    
              <form>
                error-messages
              </form>
    
              text-after
              """
          expect(up.browser.url()).toEqual(@hrefBeforeExample)
          expect($('.response')).toHaveText('old-text')
          expect($('form')).toHaveText('error-messages')
          expect($('body')).not.toHaveText('text-before')
          expect($('body')).not.toHaveText('text-after')

        it 'respects X-Up-Method and X-Up-Location response headers so the server can show that it redirected to a GET URL', ->
          up.submit(@$form)
          @respondWith
            status: 200
            contentType: 'text/html'
            responseHeaders:
              'X-Up-Location': '/other-path'
              'X-Up-Method': 'GET'
            responseText:
              """
              <div class="response">
                new-text
              </div>
              """

          expect(up.browser.url()).toEndWith('/other-path')

        describe 'with { history } option', ->

          it 'uses the given URL as the new browser location if the request succeeded', ->
            up.submit(@$form, history: '/given-path')
            @respondWith('<div class="response">new-text</div>')
            expect(up.browser.url()).toEndWith('/given-path')

          it 'keeps the current browser location if the request failed', ->
            up.submit(@$form, history: '/given-path', failTarget: '.response')
            @respondWith('<div class="response">new-text</div>', status: 500)
            expect(up.browser.url()).toEqual(@hrefBeforeExample)

          it 'keeps the current browser location if the option is set to false', ->
            up.submit(@$form, history: false)
            @respondWith('<div class="response">new-text</div>')
            expect(up.browser.url()).toEqual(@hrefBeforeExample)

      else
        
        it 'submits the given form', ->
          $form = affix('form[action="/path/to"][method="put"][up-target=".response"]')
          form = $form.get(0)
          spyOn(form, 'submit')
          
          up.submit($form)
          expect(form.submit).toHaveBeenCalled()

  describe 'unobtrusive behavior', ->

    describe 'form[up-target]', ->

      it 'rigs the form to use up.submit instead of a standard submit'

    describe 'input[up-autosubmit]', ->

      it 'submits the form when a change is observed in the given form field', (done) ->
        $form = affix('form')
        $field = $form.affix('input[up-autosubmit][val="old-value"]')
        up.hello($field)
        submitSpy = up.form.knife.mock('submit').and.returnValue(u.unresolvablePromise())
        $field.val('new-value')
        $field.trigger('change')
        u.nextFrame ->
          expect(submitSpy).toHaveBeenCalled()
          done()

    describe 'form[up-autosubmit]', ->

      it 'submits the form when a change is observed in any of its fields', (done) ->
        $form = affix('form[up-autosubmit]')
        $field = $form.affix('input[val="old-value"]')
        up.hello($form)
        submitSpy = up.form.knife.mock('submit').and.returnValue(u.unresolvablePromise())
        $field.val('new-value')
        $field.trigger('change')
        u.nextFrame ->
          expect(submitSpy).toHaveBeenCalled()
          done()

    describe '[up-observe]', ->

      it 'should have tests'

    describe 'input[up-validate]', ->

      describe 'when a selector is given', ->

        it "submits the input's form with an 'X-Up-Validate' header and replaces the selector with the response", ->

          $form = affix('form[action="/path/to"]')
          $group = $("""
            <div class="field-group">
              <input name="user" value="judy" up-validate=".field-group:has(&)">
            </div>
          """).appendTo($form)
          $group.find('input').trigger('change')

          request = @lastRequest()
          expect(request.requestHeaders['X-Up-Validate']).toEqual('user')
          expect(request.requestHeaders['X-Up-Target']).toEqual(".field-group:has([name='user'])")

          @respondWith """
            <div class="field-group has-error">
              <div class='error'>Username has already been taken</div>
              <input name="user" value="judy" up-validate=".field-group:has(&)">
            </div>
          """

          $group = $('.field-group')
          expect($group.length).toBe(1)
          expect($group).toHaveClass('has-error')
          expect($group).toHaveText('Username has already been taken')

      describe 'when no selector is given', ->

        it 'automatically finds a form group around the input field and only updates that', ->

          @appendFixture """
            <form action="/users" id="registration">

              <label>
                <input type="text" name="email" up-validate />
              </label>

              <label>
                <input type="password" name="password" up-validate />
              </label>

            </form>
          """

          $('#registration input[name=password]').trigger('change')

          @respondWith """
            <form action="/users" id="registration">

              <label>
                Validation message
                <input type="text" name="email" up-validate />
              </label>

              <label>
                Validation message
                <input type="password" name="password" up-validate />
              </label>

            </form>
          """

          $labels = $('#registration label')
          expect($labels[0]).not.toHaveText('Validation message')
          expect($labels[1]).toHaveText('Validation message')
