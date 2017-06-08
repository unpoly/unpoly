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

            it "runs the callback if the value changed", (done) ->
              $input = affix('input[value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.observe($input, callback)
              $input.val('new-value')
              u.times 2, -> $input.trigger(eventName)
              u.nextFrame ->
                expect(callback).toHaveBeenCalledWith('new-value', $input)
                expect(callback.calls.count()).toEqual(1)
                done()

            it "does not run the callback if the value didn't change", (done) ->
              $input = affix('input[value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.observe($input, callback)
              $input.trigger(eventName)
              u.nextFrame ->
                expect(callback).not.toHaveBeenCalled()
                done()

            it 'debounces the callback when the { delay } option is given', (done) ->
              $input = affix('input[value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.observe($input, { delay: 100 }, callback)
              $input.val('new-value-1')
              $input.trigger(eventName)
              u.setTimer 50, ->
                # 50 ms after change 1: We're still waiting for the 100ms delay to expire
                expect(callback.calls.count()).toEqual(0)
                u.setTimer 100, ->
                  # 150 ms after change 1: The 100ms delay has expired
                  expect(callback.calls.count()).toEqual(1)
                  expect(callback.calls.mostRecent().args[0]).toEqual('new-value-1')
                  $input.val('new-value-2')
                  $input.trigger(eventName)
                  u.setTimer 40, ->
                    # 40 ms after change 2: We change again, resetting the delay
                    expect(callback.calls.count()).toEqual(1)
                    $input.val('new-value-3')
                    $input.trigger(eventName)
                    u.setTimer 85, ->
                      # 125 ms after change 2, which was superseded by change 3
                      # 85 ms after change 3
                      expect(callback.calls.count()).toEqual(1)
                      u.setTimer 65, ->
                        # 190 ms after change 2, which was superseded by change 3
                        # 150 ms after change 3
                        expect(callback.calls.count()).toEqual(2)
                        expect(callback.calls.mostRecent().args[0]).toEqual('new-value-3')
                        done()

            it 'delays a callback if a previous async callback is taking long to execute', (done) ->
              $input = affix('input[value="old-value"]')
              callbackCount = 0
              callback = ->
                callbackCount += 1
                u.promiseTimer(100)
              up.observe($input, { delay: 1 }, callback)
              $input.val('new-value-1')
              $input.trigger(eventName)
              u.setTimer 30, ->
                # Callback has been called and takes 100 ms to complete
                expect(callbackCount).toEqual(1)
                $input.val('new-value-2')
                $input.trigger(eventName)
                u.setTimer 30, ->
                  # Second callback is triggerd, but waits for first callback to complete
                  expect(callbackCount).toEqual(1)
                  u.setTimer 100, ->
                    expect(callbackCount).toEqual(2)
                    done()

            it 'does not run multiple callbacks if a long-running callback has been blocking multiple subsequent callbacks'

            it "runs a callback in the same frame if the delay is 0", ->
              $input = affix('input[value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.observe($input, { delay: 0 }, callback)
              $input.val('new-value')
              $input.trigger(eventName)
              expect(callback.calls.count()).toEqual(1)

            it "runs multiple callbacks in the same frame if the delay is 0", ->
              $input = affix('input[value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.observe($input, { delay: 0 }, callback)
              $input.val('new-value')
              $input.trigger(eventName)
              $input.val('yet-another-value')
              $input.trigger(eventName)
              expect(callback.calls.count()).toEqual(2)

        describe 'when the first argument is a checkbox', ->

          it 'runs the callback when the checkbox changes its checked state', (done) ->
            $form = affix('form')
            $checkbox = $form.affix('input[type="checkbox"]')
            callback = jasmine.createSpy('change callback')
            up.observe($checkbox, callback)
            expect($checkbox.is(':checked')).toBe(false)
            Trigger.clickSequence($checkbox)
            u.nextFrame ->
              expect($checkbox.is(':checked')).toBe(true)
              expect(callback.calls.count()).toEqual(1)
              Trigger.clickSequence($checkbox)
              u.nextFrame ->
                expect($checkbox.is(':checked')).toBe(false)
                expect(callback.calls.count()).toEqual(2)
                done()

          it 'runs the callback when the checkbox is toggled by clicking its label', (done) ->
            $form = affix('form')
            $checkbox = $form.affix('input#tick[type="checkbox"]')
            $label = $form.affix('label[for="tick"]').text('tick label')
            callback = jasmine.createSpy('change callback')
            up.observe($checkbox, callback)
            expect($checkbox.is(':checked')).toBe(false)
            Trigger.clickSequence($label)
            u.nextFrame ->
              expect($checkbox.is(':checked')).toBe(true)
              expect(callback.calls.count()).toEqual(1)
              Trigger.clickSequence($label)
              u.nextFrame ->
                expect($checkbox.is(':checked')).toBe(false)
                expect(callback.calls.count()).toEqual(2)
                done()

        describe 'when the first argument is a radio button group', ->

          it 'runs the callback when the group changes its selection', (done) ->
            $form = affix('form')
            $radio1 = $form.affix('input[type="radio"][name="group"][value="1"]')
            $radio2 = $form.affix('input[type="radio"][name="group"][value="2"]')
            $group = $radio1.add($radio2)
            callback = jasmine.createSpy('change callback')
            up.observe($group, callback)
            expect($radio1.is(':checked')).toBe(false)
            Trigger.clickSequence($radio1)
            u.nextFrame ->
              expect($radio1.is(':checked')).toBe(true)
              expect(callback.calls.count()).toEqual(1)
              Trigger.clickSequence($radio2)
              u.nextFrame ->
                expect($radio1.is(':checked')).toBe(false)
                expect(callback.calls.count()).toEqual(2)
                done()

          it "runs the callbacks when a radio button is selected or deselected by clicking a label in the group", (done) ->
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
            u.nextFrame ->
              expect($radio1.is(':checked')).toBe(true)
              expect(callback.calls.count()).toEqual(1)
              Trigger.clickSequence($radio2Label)
              u.nextFrame ->
                expect($radio1.is(':checked')).toBe(false)
                expect(callback.calls.count()).toEqual(2)
                done()

          it "takes the group's initial selected value into account", (done) ->
            $form = affix('form')
            $radio1 = $form.affix('input[type="radio"][name="group"][value="1"][checked="checked"]')
            $radio2 = $form.affix('input[type="radio"][name="group"][value="2"]')
            $group = $radio1.add($radio2)
            callback = jasmine.createSpy('change callback')
            up.observe($group, callback)
            expect($radio1.is(':checked')).toBe(true)
            expect($radio2.is(':checked')).toBe(false)
            Trigger.clickSequence($radio1)
            u.nextFrame ->
              # Since the radio button was already checked, the click doesn't do anything
              expect($radio1.is(':checked')).toBe(true)
              expect($radio2.is(':checked')).toBe(false)
              # Since the radio button was already checked, clicking it again won't trigger the callback
              expect(callback.calls.count()).toEqual(0)
              Trigger.clickSequence($radio2)
              u.nextFrame ->
                expect($radio1.is(':checked')).toBe(false)
                expect($radio2.is(':checked')).toBe(true)
                expect(callback.calls.count()).toEqual(1)
                done()

      describe 'when the first argument is a form', ->

        u.each changeEvents, (eventName) ->

          describe "when any of the form's inputs receives a #{eventName} event", ->

            it "runs the callback if the value changed", (done) ->
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

            it "does not run the callback if the value didn't change", (done) ->
              $form = affix('form')
              $input = $form.affix('input[value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.observe($form, callback)
              $input.trigger(eventName)
              u.nextFrame ->
                expect(callback).not.toHaveBeenCalled()
                done()

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

        describe 'in a form with file inputs', ->

          beforeEach ->
            @$form.affix('input[name="file-field"][type="file"]')

          it 'transfers the form fields via FormData', ->
            up.submit(@$form)
            data = @lastRequest().data()
            expect(u.isFormData(data)).toBe(true)

      describeFallback 'canPushState', ->

        it 'falls back to a vanilla form submission', ->
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

      it 'marks the field with an .up-active class while the form is submitting', (done) ->
        $form = affix('form')
        $field = $form.affix('input[up-autosubmit][val="old-value"]')
        up.hello($field)
        submission = $.Deferred()
        submitSpy = up.form.knife.mock('submit').and.returnValue(submission)
        $field.val('new-value')
        $field.trigger('change')
        u.nextFrame ->
          expect(submitSpy).toHaveBeenCalled()
          expect($field).toHaveClass('up-active')
          submission.resolve()
          expect($field).not.toHaveClass('up-active')
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

      describe 'with [up-delay] modifier', ->

        it 'debounces the form submission', (done) ->
          $form = affix('form[up-autosubmit][up-delay="50"]')
          $field = $form.affix('input[val="old-value"]')
          up.hello($form)
          submitSpy = up.form.knife.mock('submit').and.returnValue(u.unresolvablePromise())
          $field.val('new-value-1')
          $field.trigger('change')
          $field.val('new-value-2')
          $field.trigger('change')

          u.nextFrame ->
            expect(submitSpy.calls.count()).toBe(0)
            u.setTimer 80, ->
              expect(submitSpy.calls.count()).toBe(1)
              done()

    describe 'input[up-observe]', ->

      afterEach ->
        window.observeCallbackSpy = undefined

      it 'runs the JavaScript code in the attribute value when a change is observed in the field', (done) ->
        $form = affix('form')
        window.observeCallbackSpy = jasmine.createSpy('observe callback')
        $field = $form.affix('input[val="old-value"][up-observe="window.observeCallbackSpy(value, $field.get(0))"]')
        up.hello($form)
        $field.val('new-value')
        $field.trigger('change')
        u.nextFrame ->
          expect(window.observeCallbackSpy).toHaveBeenCalledWith('new-value', $field.get(0))
          done()

      describe 'with [up-delay] modifier', ->

        it 'debounces the callback', (done) ->
          $form = affix('form')
          window.observeCallbackSpy = jasmine.createSpy('observe callback')
          $field = $form.affix('input[val="old-value"][up-observe="window.observeCallbackSpy()"][up-delay="50"]')
          up.hello($form)
          $field.val('new-value')
          $field.trigger('change')
          u.nextFrame ->
            expect(window.observeCallbackSpy).not.toHaveBeenCalled()
            u.setTimer 80, ->
              expect(window.observeCallbackSpy).toHaveBeenCalled()
              done()

    describe 'form[up-observe]', ->

      afterEach ->
        window.observeCallbackSpy = undefined

      it 'runs the JavaScript code in the attribute value when a change is observed in any contained field', (done) ->
        window.observeCallbackSpy = jasmine.createSpy('observe callback')
        $form = affix('form[up-observe="window.observeCallbackSpy(value, $field.get(0))"]')
        $field1 = $form.affix('input[val="field1-old-value"]')
        $field2 = $form.affix('input[val="field2-old-value"]')
        up.hello($form)
        $field1.val('field1-new-value')
        $field1.trigger('change')
        u.nextFrame ->
          expect(window.observeCallbackSpy.calls.allArgs()).toEqual [['field1-new-value', $field1.get(0)]]

          $field2.val('field2-new-value')
          $field2.trigger('change')

          u.nextFrame ->
            expect(window.observeCallbackSpy.calls.allArgs()).toEqual [['field1-new-value', $field1.get(0)], ['field2-new-value', $field2.get(0)]]
            done()

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

    describe '[up-switch]', ->

      describe 'on a select', ->

        beforeEach ->
          @$select = affix('select[up-switch=".target"]')
          @$blankOption = @$select.affix('option').text('<Please select something>').val('')
          @$fooOption = @$select.affix('option[value="foo"]').text('Foo')
          @$barOption = @$select.affix('option[value="bar"]').text('Bar')
          @$bazOption = @$select.affix('option[value="baz"]').text('Baz')

        it "shows the target element iff its up-show-for attribute contains the select value", ->
          $target = affix('.target[up-show-for="something bar other"]')
          up.hello(@$select)
          expect($target).toBeHidden()
          @$select.val('bar').change()
          expect($target).toBeVisible()

        it "shows the target element iff its up-hide-for attribute doesn't contain the select value", ->
          $target = affix('.target[up-hide-for="something bar other"]')
          up.hello(@$select)
          expect($target).toBeVisible()
          @$select.val('bar').change()
          expect($target).toBeHidden()

        it "shows the target element iff it has neither up-show-for nor up-hide-for and the select value is present", ->
          $target = affix('.target')
          up.hello(@$select)
          expect($target).toBeHidden()
          @$select.val('bar').change()
          expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':present' and the select value is present", ->
          $target = affix('.target[up-show-for=":present"]')
          up.hello(@$select)
          expect($target).toBeHidden()
          @$select.val('bar').change()
          expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':blank' and the select value is blank", ->
          $target = affix('.target[up-show-for=":blank"]')
          up.hello(@$select)
          expect($target).toBeVisible()
          @$select.val('bar').change()
          expect($target).toBeHidden()

      describe 'on a checkbox', ->

        beforeEach ->
          @$checkbox = affix('input[type="checkbox"][value="1"][up-switch=".target"]')

        it "shows the target element iff its up-show-for attribute is :checked and the checkbox is checked", ->
          $target = affix('.target[up-show-for=":checked"]')
          up.hello(@$checkbox)
          expect($target).toBeHidden()
          @$checkbox.prop('checked', true).change()
          expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute is :unchecked and the checkbox is unchecked", ->
          $target = affix('.target[up-show-for=":unchecked"]')
          up.hello(@$checkbox)
          expect($target).toBeVisible()
          @$checkbox.prop('checked', true).change()
          expect($target).toBeHidden()

        it "shows the target element iff its up-hide-for attribute is :checked and the checkbox is unchecked", ->
          $target = affix('.target[up-hide-for=":checked"]')
          up.hello(@$checkbox)
          expect($target).toBeVisible()
          @$checkbox.prop('checked', true).change()
          expect($target).toBeHidden()

        it "shows the target element iff its up-hide-for attribute is :unchecked and the checkbox is checked", ->
          $target = affix('.target[up-hide-for=":unchecked"]')
          up.hello(@$checkbox)
          expect($target).toBeHidden()
          @$checkbox.prop('checked', true).change()
          expect($target).toBeVisible()

        it "shows the target element iff it has neither up-show-for nor up-hide-for and the checkbox is checked", ->
          $target = affix('.target')
          up.hello(@$checkbox)
          expect($target).toBeHidden()
          @$checkbox.prop('checked', true).change()
          expect($target).toBeVisible()

      describe 'on a group of radio buttons', ->

        beforeEach ->
          @$buttons     = affix('.radio-buttons')
          @$blankButton = @$buttons.affix('input[type="radio"][name="group"][up-switch=".target"]').val('')
          @$fooButton   = @$buttons.affix('input[type="radio"][name="group"][up-switch=".target"]').val('foo')
          @$barButton   = @$buttons.affix('input[type="radio"][name="group"][up-switch=".target"]').val('bar')
          @$bazkButton  = @$buttons.affix('input[type="radio"][name="group"][up-switch=".target"]').val('baz')

        it "shows the target element iff its up-show-for attribute contains the selected button value", ->
          $target = affix('.target[up-show-for="something bar other"]')
          up.hello(@$buttons)
          expect($target).toBeHidden()
          @$barButton.prop('checked', true).change()
          expect($target).toBeVisible()

        it "shows the target element iff its up-hide-for attribute doesn't contain the selected button value", ->
          $target = affix('.target[up-hide-for="something bar other"]')
          up.hello(@$buttons)
          expect($target).toBeVisible()
          @$barButton.prop('checked', true).change()
          expect($target).toBeHidden()

        it "shows the target element iff it has neither up-show-for nor up-hide-for and the selected button value is present", ->
          $target = affix('.target')
          up.hello(@$buttons)
          expect($target).toBeHidden()
          @$barButton.prop('checked', true).change()
          expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':present' and the selected button value is present", ->
          $target = affix('.target[up-show-for=":present"]')
          up.hello(@$buttons)
          expect($target).toBeHidden()
          @$blankButton.prop('checked', true).change()
          expect($target).toBeHidden()
          @$barButton.prop('checked', true).change()
          expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':blank' and the selected button value is blank", ->
          $target = affix('.target[up-show-for=":blank"]')
          up.hello(@$buttons)
          expect($target).toBeVisible()
          @$blankButton.prop('checked', true).change()
          expect($target).toBeVisible()
          @$barButton.prop('checked', true).change()
          expect($target).toBeHidden()

        it "shows the target element iff its up-show-for attribute contains a value ':checked' and any button is checked", ->
          $target = affix('.target[up-show-for=":checked"]')
          up.hello(@$buttons)
          expect($target).toBeHidden()
          @$blankButton.prop('checked', true).change()
          expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':unchecked' and no button is checked", ->
          $target = affix('.target[up-show-for=":unchecked"]')
          up.hello(@$buttons)
          expect($target).toBeVisible()
          @$blankButton.prop('checked', true).change()
          expect($target).toBeHidden()

      describe 'on a text input', ->

        beforeEach ->
          @$textInput = affix('input[type="text"][up-switch=".target"]')

        it "shows the target element iff its up-show-for attribute contains the input value", ->
          $target = affix('.target[up-show-for="something bar other"]')
          up.hello(@$textInput)
          expect($target).toBeHidden()
          @$textInput.val('bar').change()
          expect($target).toBeVisible()

        it "shows the target element iff its up-hide-for attribute doesn't contain the input value", ->
          $target = affix('.target[up-hide-for="something bar other"]')
          up.hello(@$textInput)
          expect($target).toBeVisible()
          @$textInput.val('bar').change()
          expect($target).toBeHidden()

        it "shows the target element iff it has neither up-show-for nor up-hide-for and the input value is present", ->
          $target = affix('.target')
          up.hello(@$textInput)
          expect($target).toBeHidden()
          @$textInput.val('bar').change()
          expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':present' and the input value is present", ->
          $target = affix('.target[up-show-for=":present"]')
          up.hello(@$textInput)
          expect($target).toBeHidden()
          @$textInput.val('bar').change()
          expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':blank' and the input value is blank", ->
          $target = affix('.target[up-show-for=":blank"]')
          up.hello(@$textInput)
          expect($target).toBeVisible()
          @$textInput.val('bar').change()
          expect($target).toBeHidden()

      describe 'when an [up-show-for] element is dynamically inserted later', ->

        it "shows the element iff it matches the [up-switch] control's value", ->
          $select = affix('select[up-switch=".target"]')
          $select.affix('option[value="foo"]').text('Foo')
          $select.affix('option[value="bar"]').text('Bar')
          $select.val('foo')
          up.hello($select)

          # New target enters the DOM after [up-switch] has been compiled
          $target = affix('.target[up-show-for="bar"]')
          up.hello($target)

          expect($target).toBeHidden()

          # Check that the new element will notify subsequent changes
          $select.val('bar').change()
          expect($target).toBeVisible()

        it "doesn't re-switch targets that were part of the original compile run", ->
          $container = affix('.container')

          $select = $container.affix('select[up-switch=".target"]')
          $select.affix('option[value="foo"]').text('Foo')
          $select.affix('option[value="bar"]').text('Bar')
          $select.val('foo')
          $existingTarget = $container.affix('.target.existing[up-show-for="bar"]')

          switchTargetSpy = up.form.knife.mock('switchTarget').and.callThrough()

          up.hello($container)

          # New target enters the DOM after [up-switch] has been compiled
          $lateTarget = $container.affix('.target.late[up-show-for="bar"]')
          up.hello($lateTarget)

          expect(switchTargetSpy.calls.count()).toBe(2)
          expect(switchTargetSpy.calls.argsFor(0)[0]).toEqual($existingTarget)
          expect(switchTargetSpy.calls.argsFor(1)[0]).toEqual($lateTarget)
