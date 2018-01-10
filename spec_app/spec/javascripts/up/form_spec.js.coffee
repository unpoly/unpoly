describe 'up.form', ->

  u = up.util

  describe 'JavaScript functions', ->

    describe 'up.observe', ->

      beforeEach ->
        up.form.config.observeDelay = 0

      # Actually we only need `input`, but we want to notice
      # if another script manually triggers `change` on the element.
      changeEvents = ['input', 'change']

      describe 'when the first argument is a form field', ->

        u.each changeEvents, (eventName) ->

          describe "when the input receives a #{eventName} event", ->

            it "runs the callback if the value changed", asyncSpec (next) ->
              $input = affix('input[value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.observe($input, callback)
              $input.val('new-value')
              u.times 2, -> $input.trigger(eventName)
              next =>
                expect(callback).toHaveBeenCalledWith('new-value', $input)
                expect(callback.calls.count()).toEqual(1)

            it "does not run the callback if the value didn't change", asyncSpec (next) ->
              $input = affix('input[value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.observe($input, callback)
              $input.trigger(eventName)
              next =>
                expect(callback).not.toHaveBeenCalled()

            it 'debounces the callback when the { delay } option is given', asyncSpec (next) ->
              $input = affix('input[value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.observe($input, { delay: 100 }, callback)
              $input.val('new-value-1')
              $input.trigger(eventName)

              next.after 50, ->
                # 50 ms after change 1: We're still waiting for the 100ms delay to expire
                expect(callback.calls.count()).toEqual(0)

              next.after 100, ->
                # 150 ms after change 1: The 100ms delay has expired
                expect(callback.calls.count()).toEqual(1)
                expect(callback.calls.mostRecent().args[0]).toEqual('new-value-1')
                $input.val('new-value-2')
                $input.trigger(eventName)

              next.after 40, ->
                # 40 ms after change 2: We change again, resetting the delay
                expect(callback.calls.count()).toEqual(1)
                $input.val('new-value-3')
                $input.trigger(eventName)

              next.after 85, ->
                # 125 ms after change 2, which was superseded by change 3
                # 85 ms after change 3
                expect(callback.calls.count()).toEqual(1)

              next.after 65, ->
                # 190 ms after change 2, which was superseded by change 3
                # 150 ms after change 3
                expect(callback.calls.count()).toEqual(2)
                expect(callback.calls.mostRecent().args[0]).toEqual('new-value-3')

            it 'delays a callback if a previous async callback is taking long to execute', asyncSpec (next) ->
              $input = affix('input[value="old-value"]')
              callbackCount = 0
              callback = ->
                callbackCount += 1
                return u.promiseTimer(100)
              up.observe($input, { delay: 1 }, callback)
              $input.val('new-value-1')
              $input.trigger(eventName)

              next.after 30, ->
                # Callback has been called and takes 100 ms to complete
                expect(callbackCount).toEqual(1)
                $input.val('new-value-2')
                $input.trigger(eventName)

              next.after 30, ->
                # Second callback is triggerd, but waits for first callback to complete
                expect(callbackCount).toEqual(1)

              next.after 90, ->
                # After 150 ms the first callback should be finished and the queued 2nd callback has executed
                expect(callbackCount).toEqual(2)

            it 'only runs the last callback when a previous long-running callback has been delaying multiple callbacks', asyncSpec (next) ->
              $input = affix('input[value="old-value"]')

              callbackArgs = []
              callback = (value, field) ->
                callbackArgs.push(value)
                return u.promiseTimer(100)

              up.observe($input, { delay: 1 }, callback)
              $input.val('new-value-1')
              $input.trigger(eventName)

              next.after 10, ->
                # Callback has been called and takes 100 ms to complete
                expect(callbackArgs).toEqual ['new-value-1']
                $input.val('new-value-2')
                $input.trigger(eventName)

              next.after 10, ->
                expect(callbackArgs).toEqual ['new-value-1']
                $input.val('new-value-3')
                $input.trigger(eventName)

              next.after 100, ->
                expect(callbackArgs).toEqual ['new-value-1', 'new-value-3']

        describe 'when the first argument is a checkbox', ->

          it 'runs the callback when the checkbox changes its checked state', asyncSpec (next) ->
            $form = affix('form')
            $checkbox = $form.affix('input[type="checkbox"][value="checkbox-value"]')
            callback = jasmine.createSpy('change callback')
            up.observe($checkbox, callback)
            expect($checkbox.is(':checked')).toBe(false)
            Trigger.clickSequence($checkbox)

            next =>
              expect($checkbox.is(':checked')).toBe(true)
              expect(callback.calls.count()).toEqual(1)
              Trigger.clickSequence($checkbox)

            next =>
              expect($checkbox.is(':checked')).toBe(false)
              expect(callback.calls.count()).toEqual(2)

          it 'runs the callback when the checkbox is toggled by clicking its label', asyncSpec (next) ->
            $form = affix('form')
            $checkbox = $form.affix('input#tick[type="checkbox"][value="checkbox-value"]')
            $label = $form.affix('label[for="tick"]').text('tick label')
            callback = jasmine.createSpy('change callback')
            up.observe($checkbox, callback)
            expect($checkbox.is(':checked')).toBe(false)
            Trigger.clickSequence($label)

            next =>
              expect($checkbox.is(':checked')).toBe(true)
              expect(callback.calls.count()).toEqual(1)
              Trigger.clickSequence($label)

            next =>
              expect($checkbox.is(':checked')).toBe(false)
              expect(callback.calls.count()).toEqual(2)

        describe 'when the first argument is a radio button group', ->

          it 'runs the callback when the group changes its selection', asyncSpec (next) ->
            $form = affix('form')
            $radio1 = $form.affix('input[type="radio"][name="group"][value="1"]')
            $radio2 = $form.affix('input[type="radio"][name="group"][value="2"]')
            $group = $radio1.add($radio2)
            callback = jasmine.createSpy('change callback')
            up.observe($group, callback)
            expect($radio1.is(':checked')).toBe(false)
            Trigger.clickSequence($radio1)

            next =>
              expect($radio1.is(':checked')).toBe(true)
              expect(callback.calls.count()).toEqual(1)
              Trigger.clickSequence($radio2)

            next =>
              expect($radio1.is(':checked')).toBe(false)
              expect(callback.calls.count()).toEqual(2)

          it "runs the callbacks when a radio button is selected or deselected by clicking a label in the group", asyncSpec (next) ->
            $form = affix('form')
            $radio1 = $form.affix('input#radio1[type="radio"][name="group"][value="1"]')
            $radio1Label = $form.affix('label[for="radio1"]').text('label 1')
            $radio2 = $form.affix('input#radio2[type="radio"][name="group"][value="2"]')
            $radio2Label = $form.affix('label[for="radio2"]').text('label 2')
            $group = $radio1.add($radio2)
            callback = jasmine.createSpy('change callback')
            up.observe($group, callback)
            expect($radio1.is(':checked')).toBe(false)
            Trigger.clickSequence($radio1Label)

            next =>
              expect($radio1.is(':checked')).toBe(true)
              expect(callback.calls.count()).toEqual(1)
              Trigger.clickSequence($radio2Label)

            next =>
              expect($radio1.is(':checked')).toBe(false)
              expect(callback.calls.count()).toEqual(2)

          it "takes the group's initial selected value into account", asyncSpec (next) ->
            $form = affix('form')
            $radio1 = $form.affix('input[type="radio"][name="group"][value="1"][checked="checked"]')
            $radio2 = $form.affix('input[type="radio"][name="group"][value="2"]')
            $group = $radio1.add($radio2)
            callback = jasmine.createSpy('change callback')
            up.observe($group, callback)
            expect($radio1.is(':checked')).toBe(true)
            expect($radio2.is(':checked')).toBe(false)
            Trigger.clickSequence($radio1)

            next =>
              # Since the radio button was already checked, the click doesn't do anything
              expect($radio1.is(':checked')).toBe(true)
              expect($radio2.is(':checked')).toBe(false)
              # Since the radio button was already checked, clicking it again won't trigger the callback
              expect(callback.calls.count()).toEqual(0)
              Trigger.clickSequence($radio2)

            next =>
              expect($radio1.is(':checked')).toBe(false)
              expect($radio2.is(':checked')).toBe(true)
              expect(callback.calls.count()).toEqual(1)

      describe 'when the first argument is a form', ->

        u.each changeEvents, (eventName) ->

          describe "when any of the form's inputs receives a #{eventName} event", ->

            it "runs the callback if the value changed", asyncSpec (next) ->
              $form = affix('form')
              $input = $form.affix('input[value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.observe($form, callback)
              $input.val('new-value')
              u.times 2, -> $input.trigger(eventName)
              next =>
                expect(callback).toHaveBeenCalledWith('new-value', $input)
                expect(callback.calls.count()).toEqual(1)

            it "does not run the callback if the value didn't change", asyncSpec (next) ->
              $form = affix('form')
              $input = $form.affix('input[value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.observe($form, callback)
              $input.trigger(eventName)
              next =>
                expect(callback).not.toHaveBeenCalled()

  #        it 'runs the callback only once when a radio button group changes its selection', ->
  #          $form = affix('form')
  #          $radio1 = $form.affix('input[type="radio"][name="group"][value="1"][checked="checked"]')
  #          $radio2 = $form.affix('input[type="radio"][name="group"][value="2"]')
  #          callback = jasmine.createSpy('change callback')
  #          up.observe($form, callback)
  #          $radio2.get(0).click()
  #          u.nextFrame ->
  #            expect(callback.calls.count()).toEqual(1)

    describe 'up.submit', ->

      describeCapability 'canPushState', ->

        beforeEach ->
          up.history.config.enabled = true
          @$form = affix('form[action="/form-target"][method="put"][up-target=".response"]')
          @$form.append('<input name="field1" value="value1">')
          @$form.append('<input name="field2" value="value2">')
          affix('.response').text('old-text')

        it 'submits the given form and replaces the target with the response', asyncSpec (next) ->
          up.submit(@$form)

          next =>
            expect(@lastRequest().url).toMatchUrl('/form-target')
            expect(@lastRequest()).toHaveRequestMethod('PUT')
            expect(@lastRequest().data()['field1']).toEqual(['value1'])
            expect(@lastRequest().data()['field2']).toEqual(['value2'])
            expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.response')

            @respondWith
              responseHeaders:
                'X-Up-Location': '/redirect-target'
                'X-Up-Method': 'GET'
              responseText: """
                <div class='before'>
                  new-before
                </div>

                <div class="response">
                  new-text
                </div>

                <div class='after'>
                  new-after
                </div>
                """

          next =>
            expect(up.browser.url()).toMatchUrl('/redirect-target')
            expect('.response').toHaveText('new-text')
            # See that containers outside the form have not changed
            expect('.before').not.toHaveText('old-before')
            expect('.after').not.toHaveText('old-after')

        it "places the response into the form and doesn't update the browser URL if the submission returns a 5xx status code", asyncSpec (next) ->
          up.submit(@$form)

          next =>
            @respondWith
              status: 500
              contentType: 'text/html'
              responseText:
                """
                <div class='before'>
                  new-before
                </div>

                <form>
                  error-messages
                </form>

                <div class='after'>
                  new-after
                </div>
                """

          next =>
            expect(up.browser.url()).toEqual(@hrefBeforeExample)
            expect('.response').toHaveText('old-text')
            expect('form').toHaveText('error-messages')
            # See that containers outside the form have not changed
            expect('.before').not.toHaveText('old-before')
            expect('.after').not.toHaveText('old-after')

        it 'respects X-Up-Method and X-Up-Location response headers so the server can show that it redirected to a GET URL', asyncSpec (next) ->
          up.submit(@$form)

          next =>
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

          next =>
            expect(up.browser.url()).toMatchUrl('/other-path')

        describe 'with { history } option', ->

          it 'uses the given URL as the new browser location if the request succeeded', asyncSpec (next) ->
            up.submit(@$form, history: '/given-path')
            next => @respondWith('<div class="response">new-text</div>')
            next => expect(up.browser.url()).toMatchUrl('/given-path')

          it 'keeps the current browser location if the request failed', asyncSpec (next) ->
            up.submit(@$form, history: '/given-path', failTarget: '.response')
            next => @respondWith('<div class="response">new-text</div>', status: 500)
            next => expect(up.browser.url()).toEqual(@hrefBeforeExample)

          it 'keeps the current browser location if the option is set to false', asyncSpec (next) ->
            up.submit(@$form, history: false)
            next => @respondWith('<div class="response">new-text</div>')
            next =>expect(up.browser.url()).toEqual(@hrefBeforeExample)

        describe 'in a form with file inputs', ->

          beforeEach ->
            @$form.affix('input[name="text-field"][type="text"]').val("value")
            @$form.affix('input[name="file-field"][type="file"]')

          it 'transfers the form fields via FormData', asyncSpec (next) ->
            up.submit(@$form)
            next =>
              data = @lastRequest().data()
              expect(u.isFormData(data)).toBe(true)

      describeFallback 'canPushState', ->

        it 'falls back to a vanilla form submission', asyncSpec (next) ->
          $form = affix('form[action="/path/to"][method="put"][up-target=".response"]')
          form = $form.get(0)
          spyOn(form, 'submit')

          up.submit($form)

          next => expect(form.submit).toHaveBeenCalled()

  describe 'unobtrusive behavior', ->

    describe 'form[up-target]', ->

      it 'rigs the form to use up.submit instead of a standard submit'

      describe 'submit buttons', ->

        it 'includes the clicked submit button in the params', asyncSpec (next) ->
          $form = affix('form[action="/action"][up-target=".target"]')
          $textField = $form.affix('input[type="text"][name="text-field"][value="text-field-value"]')
          $submitButton = $form.affix('input[type="submit"][name="submit-button"][value="submit-button-value"]')
          up.hello($form)
          Trigger.clickSequence($submitButton)

          next =>
            params = @lastRequest().data()
            expect(params['text-field']).toEqual(['text-field-value'])
            expect(params['submit-button']).toEqual(['submit-button-value'])

        it 'excludes an unused submit button in the params', asyncSpec (next) ->
          $form = affix('form[action="/action"][up-target=".target"]')
          $textField = $form.affix('input[type="text"][name="text-field"][value="text-field-value"]')
          $submitButton1 = $form.affix('input[type="submit"][name="submit-button-1"][value="submit-button-1-value"]')
          $submitButton2 = $form.affix('input[type="submit"][name="submit-button-2"][value="submit-button-2-value"]')
          up.hello($form)
          Trigger.clickSequence($submitButton2)

          next =>
            params = @lastRequest().data()
            expect(params['text-field']).toEqual(['text-field-value'])
            expect(params['submit-button-1']).toBeUndefined()
            expect(params['submit-button-2']).toEqual(['submit-button-2-value'])

        it 'includes the first submit button if the form was submitted with enter', asyncSpec (next) ->
          $form = affix('form[action="/action"][up-target=".target"]')
          $textField = $form.affix('input[type="text"][name="text-field"][value="text-field-value"]')
          $submitButton1 = $form.affix('input[type="submit"][name="submit-button-1"][value="submit-button-1-value"]')
          $submitButton2 = $form.affix('input[type="submit"][name="submit-button-2"][value="submit-button-2-value"]')
          up.hello($form)
          $form.submit() # sorry

          next =>
            params = @lastRequest().data()
            expect(params['text-field']).toEqual(['text-field-value'])
            expect(params['submit-button-1']).toEqual(['submit-button-1-value'])
            expect(params['submit-button-2']).toBeUndefined()

        it 'does not explode if the form has no submit buttons', asyncSpec (next) ->
          $form = affix('form[action="/action"][up-target=".target"]')
          $textField = $form.affix('input[type="text"][name="text-field"][value="text-field-value"]')
          up.hello($form)
          $form.submit() # sorry

          next =>
            params = @lastRequest().data()
            keys = Object.keys(params)
            expect(keys).toEqual(['text-field'])

    describe 'input[up-autosubmit]', ->

      it 'submits the form when a change is observed in the given form field', asyncSpec (next) ->
        $form = affix('form')
        $field = $form.affix('input[up-autosubmit][val="old-value"]')
        up.hello($field)
        submitSpy = up.form.knife.mock('submit').and.returnValue(u.unresolvablePromise())
        $field.val('new-value')
        $field.trigger('change')
        next => expect(submitSpy).toHaveBeenCalled()

      it 'marks the field with an .up-active class while the form is submitting', asyncSpec (next) ->
        $form = affix('form')
        $field = $form.affix('input[up-autosubmit][val="old-value"]')
        up.hello($field)
        submission = u.newDeferred()
        submitSpy = up.form.knife.mock('submit').and.returnValue(submission)
        $field.val('new-value')
        $field.trigger('change')
        next =>
          expect(submitSpy).toHaveBeenCalled()
          expect($field).toHaveClass('up-active')
          submission.resolve()

        next =>
          expect($field).not.toHaveClass('up-active')

    describe 'form[up-autosubmit]', ->

      it 'submits the form when a change is observed in any of its fields', asyncSpec (next) ->
        $form = affix('form[up-autosubmit]')
        $field = $form.affix('input[val="old-value"]')
        up.hello($form)
        submitSpy = up.form.knife.mock('submit').and.returnValue(u.unresolvablePromise())
        $field.val('new-value')
        $field.trigger('change')
        next => expect(submitSpy).toHaveBeenCalled()

      describe 'with [up-delay] modifier', ->

        it 'debounces the form submission', asyncSpec (next) ->
          $form = affix('form[up-autosubmit][up-delay="50"]')
          $field = $form.affix('input[val="old-value"]')
          up.hello($form)
          submitSpy = up.form.knife.mock('submit').and.returnValue(u.unresolvablePromise())
          $field.val('new-value-1')
          $field.trigger('change')
          $field.val('new-value-2')
          $field.trigger('change')

          next =>
            expect(submitSpy.calls.count()).toBe(0)

          next.after 80, =>
            expect(submitSpy.calls.count()).toBe(1)

    describe 'input[up-observe]', ->

      afterEach ->
        window.observeCallbackSpy = undefined

      it 'runs the JavaScript code in the attribute value when a change is observed in the field', asyncSpec (next) ->
        $form = affix('form')
        window.observeCallbackSpy = jasmine.createSpy('observe callback')
        $field = $form.affix('input[val="old-value"][up-observe="window.observeCallbackSpy(value, $field.get(0))"]')
        up.hello($form)
        $field.val('new-value')
        $field.trigger('change')

        next =>
          expect(window.observeCallbackSpy).toHaveBeenCalledWith('new-value', $field.get(0))

      describe 'with [up-delay] modifier', ->

        it 'debounces the callback', asyncSpec (next) ->
          $form = affix('form')
          window.observeCallbackSpy = jasmine.createSpy('observe callback')
          $field = $form.affix('input[val="old-value"][up-observe="window.observeCallbackSpy()"][up-delay="50"]')
          up.hello($form)
          $field.val('new-value')
          $field.trigger('change')

          next => expect(window.observeCallbackSpy).not.toHaveBeenCalled()
          next.after 80, => expect(window.observeCallbackSpy).toHaveBeenCalled()

    describe 'form[up-observe]', ->

      afterEach ->
        window.observeCallbackSpy = undefined

      it 'runs the JavaScript code in the attribute value when a change is observed in any contained field', asyncSpec (next) ->
        window.observeCallbackSpy = jasmine.createSpy('observe callback')
        $form = affix('form[up-observe="window.observeCallbackSpy(value, $field.get(0))"]')
        $field1 = $form.affix('input[val="field1-old-value"]')
        $field2 = $form.affix('input[val="field2-old-value"]')
        up.hello($form)
        $field1.val('field1-new-value')
        $field1.trigger('change')

        next =>
          expect(window.observeCallbackSpy.calls.allArgs()).toEqual [['field1-new-value', $field1.get(0)]]

          $field2.val('field2-new-value')
          $field2.trigger('change')

        next =>
          expect(window.observeCallbackSpy.calls.allArgs()).toEqual [['field1-new-value', $field1.get(0)], ['field2-new-value', $field2.get(0)]]

    describe 'input[up-validate]', ->

      describe 'when a selector is given', ->

        it "submits the input's form with an 'X-Up-Validate' header and replaces the selector with the response", asyncSpec (next) ->

          $form = affix('form[action="/path/to"]')
          $group = $("""
            <div class="field-group">
              <input name="user" value="judy" up-validate=".field-group:has(&)">
            </div>
          """).appendTo($form)
          $group.find('input').trigger('change')

          next =>
            request = @lastRequest()
            expect(request.requestHeaders['X-Up-Validate']).toEqual('user')
            expect(request.requestHeaders['X-Up-Target']).toEqual(".field-group:has([name='user'])")

            @respondWith """
              <div class="field-group has-error">
                <div class='error'>Username has already been taken</div>
                <input name="user" value="judy" up-validate=".field-group:has(&)">
              </div>
            """

          next =>
            $group = $('.field-group')
            expect($group.length).toBe(1)
            expect($group).toHaveClass('has-error')
            expect($group).toHaveText('Username has already been taken')

        it 'does not reveal the updated fragment (bugfix)', asyncSpec (next) ->
          revealSpy = up.layout.knife.mock('reveal').and.returnValue(Promise.resolve())

          $form = affix('form[action="/path/to"]')
          $group = $("""
            <div class="field-group">
              <input name="user" value="judy" up-validate=".field-group:has(&)">
            </div>
          """).appendTo($form)
          $group.find('input').trigger('change')

          next =>
            @respondWith """
              <div class="field-group has-error">
                <div class='error'>Username has already been taken</div>
                <input name="user" value="judy" up-validate=".field-group:has(&)">
              </div>
            """

          next =>
            expect(revealSpy).not.toHaveBeenCalled()


      describe 'when no selector is given', ->

        it 'automatically finds a form group around the input field and only updates that', asyncSpec (next) ->

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

          next =>
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

          next =>
            $labels = $('#registration label')
            expect($labels[0]).not.toHaveText('Validation message')
            expect($labels[1]).toHaveText('Validation message')

    describe '[up-switch]', ->

      describe 'on a select', ->

        beforeEach ->
          @$select = affix('select[up-switch=".target"]')
          @$blankOption = @$select.affix('option').text('<Please select something>').val('')
          @$fooOption = @$select.affix('option[value="foo"]').text('Foo')
          @$barOption = @$select.affix('option[value="bar"]').text('Bar')
          @$bazOption = @$select.affix('option[value="baz"]').text('Baz')

        it "shows the target element iff its up-show-for attribute contains the select value", asyncSpec (next) ->
          $target = affix('.target[up-show-for="something bar other"]')
          up.hello(@$select)

          next =>
            expect($target).toBeHidden()
            @$select.val('bar').change()

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-hide-for attribute doesn't contain the select value", asyncSpec (next) ->
          $target = affix('.target[up-hide-for="something bar other"]')
          up.hello(@$select)

          next =>
            expect($target).toBeVisible()
            @$select.val('bar').change()

          next =>
            expect($target).toBeHidden()

        it "shows the target element iff it has neither up-show-for nor up-hide-for and the select value is present", asyncSpec (next) ->
          $target = affix('.target')
          up.hello(@$select)

          next =>
            expect($target).toBeHidden()
            @$select.val('bar').change()

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':present' and the select value is present", asyncSpec (next) ->
          $target = affix('.target[up-show-for=":present"]')
          up.hello(@$select)

          next =>
            expect($target).toBeHidden()
            @$select.val('bar').change()

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':blank' and the select value is blank", asyncSpec (next) ->
          $target = affix('.target[up-show-for=":blank"]')
          up.hello(@$select)

          next =>
            expect($target).toBeVisible()
            @$select.val('bar').change()

          next =>
            expect($target).toBeHidden()

      describe 'on a checkbox', ->

        beforeEach ->
          @$checkbox = affix('input[type="checkbox"][value="1"][up-switch=".target"]')

        it "shows the target element iff its up-show-for attribute is :checked and the checkbox is checked", asyncSpec (next) ->
          $target = affix('.target[up-show-for=":checked"]')
          up.hello(@$checkbox)

          next =>
            expect($target).toBeHidden()
            @$checkbox.prop('checked', true).change()

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute is :unchecked and the checkbox is unchecked", asyncSpec (next) ->
          $target = affix('.target[up-show-for=":unchecked"]')
          up.hello(@$checkbox)

          next =>
            expect($target).toBeVisible()
            @$checkbox.prop('checked', true).change()

          next =>
            expect($target).toBeHidden()

        it "shows the target element iff its up-hide-for attribute is :checked and the checkbox is unchecked", asyncSpec (next) ->
          $target = affix('.target[up-hide-for=":checked"]')
          up.hello(@$checkbox)

          next =>
            expect($target).toBeVisible()
            @$checkbox.prop('checked', true).change()

          next =>
            expect($target).toBeHidden()

        it "shows the target element iff its up-hide-for attribute is :unchecked and the checkbox is checked", asyncSpec (next) ->
          $target = affix('.target[up-hide-for=":unchecked"]')
          up.hello(@$checkbox)

          next =>
            expect($target).toBeHidden()
            @$checkbox.prop('checked', true).change()

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff it has neither up-show-for nor up-hide-for and the checkbox is checked", asyncSpec (next) ->
          $target = affix('.target')
          up.hello(@$checkbox)

          next =>
            expect($target).toBeHidden()
            @$checkbox.prop('checked', true).change()

          next =>
            expect($target).toBeVisible()

      describe 'on a group of radio buttons', ->

        beforeEach ->
          @$buttons     = affix('.radio-buttons')
          @$blankButton = @$buttons.affix('input[type="radio"][name="group"][up-switch=".target"]').val('')
          @$fooButton   = @$buttons.affix('input[type="radio"][name="group"][up-switch=".target"]').val('foo')
          @$barButton   = @$buttons.affix('input[type="radio"][name="group"][up-switch=".target"]').val('bar')
          @$bazkButton  = @$buttons.affix('input[type="radio"][name="group"][up-switch=".target"]').val('baz')

        it "shows the target element iff its up-show-for attribute contains the selected button value", asyncSpec (next) ->
          $target = affix('.target[up-show-for="something bar other"]')
          up.hello(@$buttons)

          next =>
            expect($target).toBeHidden()
            @$barButton.prop('checked', true).change()

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-hide-for attribute doesn't contain the selected button value", asyncSpec (next) ->
          $target = affix('.target[up-hide-for="something bar other"]')
          up.hello(@$buttons)

          next =>
            expect($target).toBeVisible()
            @$barButton.prop('checked', true).change()

          next =>
            expect($target).toBeHidden()

        it "shows the target element iff it has neither up-show-for nor up-hide-for and the selected button value is present", asyncSpec (next) ->
          $target = affix('.target')
          up.hello(@$buttons)

          next =>
            expect($target).toBeHidden()
            @$barButton.prop('checked', true).change()

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':present' and the selected button value is present", asyncSpec (next) ->
          $target = affix('.target[up-show-for=":present"]')
          up.hello(@$buttons)

          next =>
            expect($target).toBeHidden()
            @$blankButton.prop('checked', true).change()

          next =>
            expect($target).toBeHidden()
            @$barButton.prop('checked', true).change()

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':blank' and the selected button value is blank", asyncSpec (next) ->
          $target = affix('.target[up-show-for=":blank"]')
          up.hello(@$buttons)

          next =>
            expect($target).toBeVisible()
            @$blankButton.prop('checked', true).change()

          next =>
            expect($target).toBeVisible()
            @$barButton.prop('checked', true).change()

          next =>
            expect($target).toBeHidden()

        it "shows the target element iff its up-show-for attribute contains a value ':checked' and any button is checked", asyncSpec (next) ->
          $target = affix('.target[up-show-for=":checked"]')
          up.hello(@$buttons)

          next =>
            expect($target).toBeHidden()
            @$blankButton.prop('checked', true).change()

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':unchecked' and no button is checked", asyncSpec (next) ->
          $target = affix('.target[up-show-for=":unchecked"]')
          up.hello(@$buttons)

          next =>
            expect($target).toBeVisible()
            @$blankButton.prop('checked', true).change()

          next =>
            expect($target).toBeHidden()

      describe 'on a text input', ->

        beforeEach ->
          @$textInput = affix('input[type="text"][up-switch=".target"]')

        it "shows the target element iff its up-show-for attribute contains the input value", asyncSpec (next) ->
          $target = affix('.target[up-show-for="something bar other"]')
          up.hello(@$textInput)

          next =>
            expect($target).toBeHidden()
            @$textInput.val('bar').change()

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-hide-for attribute doesn't contain the input value", asyncSpec (next) ->
          $target = affix('.target[up-hide-for="something bar other"]')
          up.hello(@$textInput)

          next =>
            expect($target).toBeVisible()
            @$textInput.val('bar').change()

          next =>
            expect($target).toBeHidden()

        it "shows the target element iff it has neither up-show-for nor up-hide-for and the input value is present", asyncSpec (next) ->
          $target = affix('.target')
          up.hello(@$textInput)

          next =>
            expect($target).toBeHidden()
            @$textInput.val('bar').change()

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':present' and the input value is present", asyncSpec (next) ->
          $target = affix('.target[up-show-for=":present"]')
          up.hello(@$textInput)

          next =>
            expect($target).toBeHidden()
            @$textInput.val('bar').change()

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':blank' and the input value is blank", asyncSpec (next) ->
          $target = affix('.target[up-show-for=":blank"]')
          up.hello(@$textInput)

          next =>
            expect($target).toBeVisible()
            @$textInput.val('bar').change()

          next =>
            expect($target).toBeHidden()

      describe 'when an [up-show-for] element is dynamically inserted later', ->

        it "shows the element iff it matches the [up-switch] control's value", asyncSpec (next) ->
          $select = affix('select[up-switch=".target"]')
          $select.affix('option[value="foo"]').text('Foo')
          $select.affix('option[value="bar"]').text('Bar')
          $select.val('foo')
          up.hello($select)

          next =>
            # New target enters the DOM after [up-switch] has been compiled
            @$target = affix('.target[up-show-for="bar"]')
            up.hello(@$target)

          next =>
            expect(@$target).toBeHidden()

          next =>
            # Check that the new element will notify subsequent changes
            $select.val('bar').change()
            expect(@$target).toBeVisible()

        it "doesn't re-switch targets that were part of the original compile run", asyncSpec (next) ->
          $container = affix('.container')

          $select = $container.affix('select[up-switch=".target"]')
          $select.affix('option[value="foo"]').text('Foo')
          $select.affix('option[value="bar"]').text('Bar')
          $select.val('foo')
          $existingTarget = $container.affix('.target.existing[up-show-for="bar"]')

          switchTargetSpy = up.form.knife.mock('switchTarget').and.callThrough()

          up.hello($container)

          next =>
            # New target enters the DOM after [up-switch] has been compiled
            @$lateTarget = $container.affix('.target.late[up-show-for="bar"]')
            up.hello(@$lateTarget)

          next =>
            expect(switchTargetSpy.calls.count()).toBe(2)
            expect(switchTargetSpy.calls.argsFor(0)[0]).toEqual($existingTarget)
            expect(switchTargetSpy.calls.argsFor(1)[0]).toEqual(@$lateTarget)
