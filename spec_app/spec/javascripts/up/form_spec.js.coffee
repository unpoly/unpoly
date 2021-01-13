u = up.util
e = up.element
$ = jQuery

describe 'up.form', ->

  describe 'JavaScript functions', ->

    describe 'up.form.fields', ->

      it 'returns a list of form fields within the given element', ->
        form = fixture('form')
        textField = e.affix(form, 'input[type=text]')
        select = e.affix(form, 'select')
        results = up.form.fields(form)
        expect(results).toMatchList([textField, select])

      it 'returns an empty list if the given element contains no form fields', ->
        form = fixture('form')
        results = up.form.fields(form)
        expect(results).toMatchList([])

      it 'returns a list of the given element if the element is itself a form field', ->
        textArea = fixture('textarea')
        results = up.form.fields(textArea)
        expect(results).toMatchList([textArea])

      it 'ignores fields outside the given form', ->
        form1 = fixture('form')
        form1Field = e.affix(form1, 'input[type=text]')
        form2 = fixture('form')
        form2Field = e.affix(form2, 'input[type=text]')
        results = up.form.fields(form1)
        expect(results).toMatchList([form1Field])

      it "includes fields outside the form with a [form] attribute matching the given form's ID", ->
        form = fixture('form#form-id')
        insideField = e.affix(form, 'input[type=text]')
        outsideField = fixture('input[type=text][form=form-id]')
        results = up.form.fields(form)
        expect(results).toMatchList([insideField, outsideField])

      it "does not return duplicate fields if a field with a matching [form] attribute is also a child of the form", ->
        form = fixture('form#form-id')
        field = e.affix(form, 'input[type=text][form=form-id]')
        results = up.form.fields(form)
        expect(results).toMatchList([field])


    describe 'up.observe', ->

      beforeEach ->
        up.form.config.observeDelay = 0

      # Actually we only need `input`, but we want to notice
      # if another script manually triggers `change` on the element.
      changeEvents = ['input', 'change']

      describe 'when the first argument is a form field', ->

        u.each changeEvents, (eventType) ->

          describe "when the input receives a #{eventType} event", ->

            it "runs the callback if the value changed", asyncSpec (next) ->
              $input = $fixture('input[name="input-name"][value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.observe($input, callback)
              $input.val('new-value')
              u.times 2, -> Trigger[eventType]($input)
              next =>
                expect(callback).toHaveBeenCalledWith('new-value', 'input-name')
                expect(callback.calls.count()).toEqual(1)

            it "does not run the callback if the value didn't change", asyncSpec (next) ->
              $input = $fixture('input[name="input-name"][value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.observe($input, callback)
              Trigger[eventType]($input)
              next =>
                expect(callback).not.toHaveBeenCalled()

            it 'debounces the callback when the { delay } option is given', asyncSpec (next) ->
              $input = $fixture('input[name="input-name"][value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.observe($input, { delay: 200 }, callback)
              $input.val('new-value-1')
              Trigger[eventType]($input)

              next.after 100, ->
                # 100 ms after change 1: We're still waiting for the 200ms delay to expire
                expect(callback.calls.count()).toEqual(0)

              next.after 200, ->
                # 300 ms after change 1: The 200ms delay has expired
                expect(callback.calls.count()).toEqual(1)
                expect(callback.calls.mostRecent().args[0]).toEqual('new-value-1')
                $input.val('new-value-2')
                Trigger[eventType]($input)

              next.after 80, ->
                # 80 ms after change 2: We change again, resetting the delay
                expect(callback.calls.count()).toEqual(1)
                $input.val('new-value-3')
                Trigger[eventType]($input)

              next.after 170, ->
                # 250 ms after change 2, which was superseded by change 3
                # 170 ms after change 3
                expect(callback.calls.count()).toEqual(1)

              next.after 130, ->
                # 190 ms after change 2, which was superseded by change 3
                # 150 ms after change 3
                expect(callback.calls.count()).toEqual(2)
                expect(callback.calls.mostRecent().args[0]).toEqual('new-value-3')

            it 'delays a callback if a previous async callback is taking long to execute', asyncSpec (next) ->
              $input = $fixture('input[name="input-name"][value="old-value"]')
              callbackCount = 0
              callback = ->
                callbackCount += 1
                return up.specUtil.promiseTimer(100)
              up.observe($input, { delay: 1 }, callback)
              $input.val('new-value-1')
              Trigger[eventType]($input)

              next.after 30, ->
                # Callback has been called and takes 100 ms to complete
                expect(callbackCount).toEqual(1)
                $input.val('new-value-2')
                Trigger[eventType]($input)

              next.after 30, ->
                # Second callback is triggerd, but waits for first callback to complete
                expect(callbackCount).toEqual(1)

              next.after 90, ->
                # After 150 ms the first callback should be finished and the queued 2nd callback has executed
                expect(callbackCount).toEqual(2)

            it 'only runs the last callback when a previous long-running callback has been delaying multiple callbacks', asyncSpec (next) ->
              $input = $fixture('input[name="input-name"][value="old-value"]')

              callbackArgs = []
              callback = (value, field) ->
                callbackArgs.push(value)
                return up.specUtil.promiseTimer(100)

              up.observe($input, { delay: 1 }, callback)
              $input.val('new-value-1')
              Trigger[eventType]($input)

              next.after 10, ->
                # Callback has been called and takes 100 ms to complete
                expect(callbackArgs).toEqual ['new-value-1']
                $input.val('new-value-2')
                Trigger[eventType]($input)

              next.after 10, ->
                expect(callbackArgs).toEqual ['new-value-1']
                $input.val('new-value-3')
                Trigger[eventType]($input)

              next.after 100, ->
                expect(callbackArgs).toEqual ['new-value-1', 'new-value-3']

        describe 'when the first argument is a checkbox', ->

          it 'runs the callback when the checkbox changes its checked state', asyncSpec (next) ->
            $form = $fixture('form')
            $checkbox = $form.affix('input[name="input-name"][type="checkbox"][value="checkbox-value"]')
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
            $form = $fixture('form')
            $checkbox = $form.affix('input#tick[name="input-name"][type="checkbox"][value="checkbox-value"]')
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
            $form = $fixture('form')
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
              # Trigger.clickSequence($radio2)
              $radio1[0].checked = false
              $radio2[0].checked = true
              Trigger.change($radio2)

            next =>
              expect($radio1.is(':checked')).toBe(false)
              expect(callback.calls.count()).toEqual(2)

          it "runs the callbacks when a radio button is selected or deselected by clicking a label in the group", asyncSpec (next) ->
            $form = $fixture('form')
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
            $form = $fixture('form')
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

        u.each changeEvents, (eventType) ->

          describe "when any of the form's inputs receives a #{eventType} event", ->

            it "runs the callback if the value changed", asyncSpec (next) ->
              $form = $fixture('form')
              $input = $form.affix('input[name="input-name"][value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.observe($form, callback)
              $input.val('new-value')
              u.times 2, -> Trigger[eventType]($input)
              next =>
                expect(callback).toHaveBeenCalledWith('new-value', 'input-name')
                expect(callback.calls.count()).toEqual(1)

            it "does not run the callback if the value didn't change", asyncSpec (next) ->
              $form = $fixture('form')
              $input = $form.affix('input[name="input-name"][value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.observe($form, callback)
              Trigger[eventType]($input)
              next =>
                expect(callback).not.toHaveBeenCalled()

  #        it 'runs the callback only once when a radio button group changes its selection', ->
  #          $form = $fixture('form')
  #          $radio1 = $form.affix('input[type="radio"][name="group"][value="1"][checked="checked"]')
  #          $radio2 = $form.affix('input[type="radio"][name="group"][value="2"]')
  #          callback = jasmine.createSpy('change callback')
  #          up.observe($form, callback)
  #          $radio2.get(0).click()
  #          u.task ->
  #            expect(callback.calls.count()).toEqual(1)


      describe 'with { batch: true } options', ->

        it 'calls the callback once with all collected changes in a diff object', asyncSpec (next) ->
          $form = $fixture('form')
          $input1 = $form.affix('input[name="input1"][value="input1-a"]')
          $input2 = $form.affix('input[name="input2"][value="input2-a"]')
          callback = jasmine.createSpy('change callback')
          up.observe($form, { batch: true }, callback)

          next ->
            expect(callback.calls.count()).toEqual(0)

            $input1.val('input1-b')
            Trigger.change($input1)
            $input2.val('input2-b')
            Trigger.change($input2)

          next ->
            expect(callback.calls.count()).toEqual(1)
            expect(callback.calls.mostRecent().args[0]).toEqual {
              'input1': 'input1-b'
              'input2': 'input2-b'
            }

            $input2.val('input2-c')
            Trigger.change($input2)

          next ->
            expect(callback.calls.count()).toEqual(2)
            expect(callback.calls.mostRecent().args[0]).toEqual {
              'input2': 'input2-c'
            }


    describe 'up.submit', ->

      it 'emits a preventable up:form:submit event', asyncSpec (next) ->
        $form = $fixture('form[action="/form-target"][up-target=".response"]')

        listener = jasmine.createSpy('submit listener').and.callFake (event) ->
          event.preventDefault()

        $form.on('up:form:submit', listener)

        up.submit($form)

        next =>
          expect(listener).toHaveBeenCalled()
          element = listener.calls.mostRecent().args[1]
          expect(element).toEqual(element)

          # No request should be made because we prevented the event
          expect(jasmine.Ajax.requests.count()).toEqual(0)

      it 'submits an form that has both an [id] attribute and a field with [name=id] (bugfix)', asyncSpec (next) ->
        form = fixture('form#form-id[action="/path"][up-follow]')
        e.affix(form, 'input[name="id"][value="value"]')

        up.submit(form)

        next =>
          params = @lastRequest().data()
          expect(params['id']).toEqual(['value'])

      describe 'content type', ->

        it 'defaults to application/x-www-form-urlencoded in a form without file inputs', asyncSpec (next) ->
          form = fixture('form[action="/path"]')

          up.submit(form)

          next =>
            expect(@lastRequest().requestHeaders['Content-Type']).toEqual('application/x-www-form-urlencoded')

        it 'defaults to multipart/form-data in a form with file inputs', asyncSpec (next) ->
          form = fixture('form[action="/path"]')

          # Since this test cannot programmatically append an <input type="file"> with
          # a value, we pass a binary param with the { params } option.
          params = { 'file-input': new Blob(['data'])}
          up.submit(form, { params })

          next =>
            # Unpoly will set an empty content type so the browser will automatically append
            # a MIME boundary like multipart/form-data; boundary=----WebKitFormBoundaryHkiKAbOweEFUtny8
            expect(@lastRequest().requestHeaders['Content-Type']).toBeMissing()

            # Jasmine's fake request contains the original payload in { params }
            expect(@lastRequest().params).toEqual(jasmine.any(FormData))

        it "uses the form's [enctype] attribute", asyncSpec (next) ->
          form = fixture('form[action="/path"][enctype="my-type"]')

          up.submit(form)

          next =>
            expect(@lastRequest().requestHeaders['Content-Type']).toEqual('my-type')

      describeCapability 'canPushState', ->

        beforeEach ->
          up.history.config.enabled = true
          @$form = $fixture('form[action="/form-target"][method="put"][up-target=".response"]')
          @$form.append('<input name="field1" value="value1">')
          @$form.append('<input name="field2" value="value2">')
          $fixture('.response').text('old-text')

        it 'submits the given form and replaces the target with the response', asyncSpec (next) ->
          up.submit(@$form, history: true)

          next =>
            expect(@lastRequest().url).toMatchURL('/form-target')
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
            expect(up.history.location).toMatchURL('/redirect-target')
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
            expect(up.history.location).toMatchURL(@locationBeforeExample)
            expect('.response').toHaveText('old-text')
            expect('form').toHaveText('error-messages')
            # See that containers outside the form have not changed
            expect('.before').not.toHaveText('old-before')
            expect('.after').not.toHaveText('old-after')

            expect(window).toHaveUnhandledRejections() if REJECTION_EVENTS_SUPPORTED


        it 'respects X-Up-Method and X-Up-Location response headers so the server can show that it redirected to a GET URL', asyncSpec (next) ->
          up.submit(@$form, history: true)

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
            expect(up.history.location).toMatchURL('/other-path')

        it "submits the form's source URL if the form has no [action] attribute", asyncSpec (next) ->
          form = fixture('form[up-source="/form-source"]')

          up.submit(form)

          next =>
            expect(@lastRequest().url).toMatchURL('/form-source')

        describe 'handling of query params in the [action] URL', ->

          describe 'for forms with GET method', ->

            it 'discards query params from an [action] attribute (like browsers do)', asyncSpec (next) ->
              # See design/query-params-in-form-actions/cases.html for
              # a demo of vanilla browser behavior.

              form = fixture('form[method="GET"][action="/action?foo=value-from-action"]')
              input1 = e.affix(form, 'input[name="foo"][value="value-from-input"]')
              input2 = e.affix(form, 'input[name="foo"][value="other-value-from-input"]')

              up.submit(form)

              next =>
                expect(@lastRequest().url).toMatchURL('/action?foo=value-from-input&foo=other-value-from-input')

          describe 'for forms with POST method' ,->

            it 'keeps all query params in the URL', asyncSpec (next) ->

              form = fixture('form[method="POST"][action="/action?foo=value-from-action"]')
              input1 = e.affix(form, 'input[name="foo"][value="value-from-input"]')
              input2 = e.affix(form, 'input[name="foo"][value="other-value-from-input"]')

              up.submit(form)

              next =>
                expect(@lastRequest().url).toMatchURL('/action?foo=value-from-action')
                expect(@lastRequest().data()['foo']).toEqual ['value-from-input', 'other-value-from-input']

        describe 'with { location } option', ->

          it 'uses the given URL as the new browser location if the request succeeded', asyncSpec (next) ->
            up.submit(@$form, location: '/given-path')
            next => @respondWith('<div class="response">new-text</div>')
            next => expect(up.history.location).toMatchURL('/given-path')

          it 'keeps the current browser location if the request failed', asyncSpec (next) ->
            up.submit(@$form, location: '/given-path', failTarget: '.response')
            next => @respondWith('<div class="response">new-text</div>', status: 500)
            next => expect(up.history.location).toMatchURL(@locationBeforeExample)

        describe 'with { history: false } option', ->

          it 'keeps the current browser location', asyncSpec (next) ->
            up.submit(@$form, history: false)
            next => @respondWith('<div class="response">new-text</div>')
            next =>expect(up.history.location).toMatchURL(@locationBeforeExample)

        describe 'with { scroll } option', ->

          it 'reveals the given selector', asyncSpec (next) ->
            $form = $fixture('form[action="/action"][up-target=".target"]')
            $target = $fixture('.target')
            $other = $fixture('.other')

            revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())

            up.submit($form, scroll: '.other')

            next =>
              @respondWith """
                <div class="target">
                  new text
                </div>
                <div class="other">
                  new other
                </div>
              """

            next =>
              expect(revealStub).toHaveBeenCalled()
              expect(revealStub.calls.mostRecent().args[0]).toMatchSelector('.other')

          it 'allows to refer to this form as "&" in the selector', asyncSpec (next) ->
            $form = $fixture('form#foo-form[action="/action"][up-target="#foo-form"]')

            revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())

            up.submit($form, scroll: '& .form-child')

            next =>
              @respondWith """
                <div class="target">
                  new text
                </div>

                <form id="foo-form">
                  <div class="form-child">other</div>
                </form>
              """

            next =>
              expect(revealStub).toHaveBeenCalled()
              expect(revealStub.calls.mostRecent().args[0]).toEqual(e.get('#foo-form .form-child'))

        describe 'with { failScroll } option', ->

          it 'reveals the given selector for a failed submission', asyncSpec (next) ->
            $form = $fixture('form#foo-form[action="/action"][up-target=".target"]')
            $target = $fixture('.target')
            $other = $fixture('.other')

            revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())

            up.submit($form, reveal: '.other', failScroll: '.error')

            next =>
              @respondWith
                status: 500,
                responseText: """
                  <form id="foo-form">
                    <div class="error">Errors here</div>
                  </form>
                  """

            next =>
              expect(revealStub).toHaveBeenCalled()
              expect(revealStub.calls.mostRecent().args[0]).toMatchSelector('.error')

          it 'allows to refer to this form as "&" in the selector', asyncSpec (next) ->
            $form = $fixture('form#foo-form[action="/action"][up-target=".target"]')
            $target = $fixture('.target')

            revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())

            up.submit($form, failScroll: '& .form-child')

            next =>
              @respondWith
                status: 500
                responseText: """
                  <div class="target">
                    new text
                  </div>

                  <form id="foo-form">
                    <div class="form-child">other</div>
                  </form>
                  """

            next =>
              expect(revealStub).toHaveBeenCalled()
              expect(revealStub.calls.mostRecent().args[0]).toEqual(e.get('#foo-form .form-child'))

      describeFallback 'canPushState', ->

        it 'falls back to a vanilla form submission', asyncSpec (next) ->
          $form = $fixture('form[action="/qux"][method="put"][up-target=".response"]')
          form = $form.get(0)
          loadPageSpy = spyOn(up.browser, 'loadPage')

          up.submit($form)

          next => expect(loadPageSpy).toHaveBeenCalled()

    describe 'up.form.submitOptions()', ->

      it 'parses the render options that would be used to submit the given frm', ->
        form = fixture('form[action="/path"][up-method="PUT"][up-layer="new"]')
        options = up.form.submitOptions(form)
        expect(options.url).toEqual('/path')
        expect(options.method).toEqual('PUT')
        expect(options.layer).toEqual('new')

      it 'does not render', ->
        spyOn(up, 'render')
        form = fixture('form[action="/path"][up-method="PUT"][up-layer="new"]')
        options = up.form.submitOptions(form)
        expect(up.render).not.toHaveBeenCalled()

    describe 'up.validate()', ->

      it 'emits an up:form:validate event instead of an up:form:submit event', asyncSpec (next) ->
        form = fixture('form[action=/path]')
        input = e.affix(form, 'input[name=foo]')
        submitListener = jasmine.createSpy('up:form:submit listener')
        validateListener = jasmine.createSpy('up:form:validate listener')
        up.on('up:form:submit', submitListener)
        up.on('up:form:validate', validateListener)

        up.validate(input)

        next ->
          expect(submitListener).not.toHaveBeenCalled()
          expect(validateListener).toHaveBeenCalled()

      it 'may be called with an entire form (bugfix)', asyncSpec (next) ->
        form = fixture('form[action=/path] input[name=foo]')
        validateListener = jasmine.createSpy('up:form:validate listener')
        up.on('up:form:validate', validateListener)

        up.validate(form)

        next ->
          expect(validateListener).toHaveBeenCalled()

  describe 'unobtrusive behavior', ->

    describe 'form[up-target]', ->

      it 'submits the form with AJAX and replaces the [up-target] selector', asyncSpec (next) ->
        up.history.config.enabled = true

        $fixture('.response').text('old text')

        $form = $fixture('form[action="/form-target"][method="put"][up-target=".response"]')
        $form.append('<input name="field1" value="value1">')
        $form.append('<input name="field2" value="value2">')
        $submitButton = $form.affix('input[type="submit"][name="submit-button"][value="submit-button-value"]')
        up.hello($form)

        Trigger.clickSequence($submitButton)

        next =>
          params = @lastRequest().data()
          expect(params['field1']).toEqual(['value1'])
          expect(params['field2']).toEqual(['value2'])

        next =>
          @respondWith """
            <div class="response">
              new text
            </div>
          """

        next =>
          expect('.response').toHaveText('new text')

      it 'allows to refer to this form as "&" in the target selector', asyncSpec (next) ->
        $form = $fixture('form.my-form[action="/form-target"][up-target="&"]').text('old form text')
        $submitButton = $form.affix('input[type="submit"]')
        up.hello($form)

        Trigger.clickSequence($submitButton)

        next =>
          expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.my-form')

          @respondWith """
            <form class="my-form">
              new form text
            </form>
          """

        next =>
          expect('.my-form').toHaveText('new form text')

      describe 'when the server responds with an error code', ->

        it 'replaces the form instead of the [up-target] selector', asyncSpec (next) ->
          up.history.config.enabled = true

          $fixture('.response').text('old text')

          $form = $fixture('form.test-form[action="/form-target"][method="put"][up-target=".response"]')
          $form.append('<input name="field1" value="value1">')
          $form.append('<input name="field2" value="value2">')
          $submitButton = $form.affix('input[type="submit"][name="submit-button"][value="submit-button-value"]')
          up.hello($form)

          Trigger.clickSequence($submitButton)

          next =>
            params = @lastRequest().data()
            expect(params['field1']).toEqual(['value1'])
            expect(params['field2']).toEqual(['value2'])

          next =>
            @respondWith
              status: 500
              responseText: """
                <form class="test-form">
                  validation errors
                </form>
              """

          next =>
            expect('.response').toHaveText('old text')
            expect('form.test-form').toHaveText('validation errors')

            # Since there isn't anyone who could handle the rejection inside
            # the event handler, our handler mutes the rejection.
            expect(window).not.toHaveUnhandledRejections() if REJECTION_EVENTS_SUPPORTED

        it 'updates a given selector when an [up-fail-target] is given', asyncSpec (next) ->
          $form = $fixture('form.my-form[action="/path"][up-target=".target"][up-fail-target=".errors"]').text('old form text')
          $errors = $fixture('.target').text('old target text')
          $errors = $fixture('.errors').text('old errors text')

          $submitButton = $form.affix('input[type="submit"]')
          up.hello($form)

          Trigger.clickSequence($submitButton)

          next =>
            @respondWith
              status: 500
              responseText: """
                <form class="my-form">
                  new form text
                </form>

                <div class="errors">
                  new errors text
                </div>
                """

          next =>
            expect('.my-form').toHaveText('old form text')
            expect('.target').toHaveText('old target text')
            expect('.errors').toHaveText('new errors text')

        it 'allows to refer to this form as "&" in the [up-fail-target] selector', asyncSpec (next) ->
          $form = $fixture('form.my-form[action="/form-target"][up-target=".target"][up-fail-target="&"]').text('old form text')
          $target = $fixture('.target').text('old target text')

          $submitButton = $form.affix('input[type="submit"]')
          up.hello($form)

          Trigger.clickSequence($submitButton)

          next =>
            @respondWith
              status: 500,
              responseText: """
                <form class="my-form">
                  new form text
                </form>
                """

          next =>
            expect('.target').toHaveText('old target text')
            expect('.my-form').toHaveText('new form text')

      describe 'submit buttons', ->

        it 'includes the clicked submit button in the params', asyncSpec (next) ->
          $form = $fixture('form[action="/action"][up-target=".target"]')
          $textField = $form.affix('input[type="text"][name="text-field"][value="text-field-value"]')
          $submitButton = $form.affix('input[type="submit"][name="submit-button"][value="submit-button-value"]')
          up.hello($form)
          Trigger.clickSequence($submitButton)

          next =>
            params = @lastRequest().data()
            expect(params['text-field']).toEqual(['text-field-value'])
            expect(params['submit-button']).toEqual(['submit-button-value'])

        it 'excludes an unused submit button in the params', asyncSpec (next) ->
          $form = $fixture('form[action="/action"][up-target=".target"]')
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

        it 'assumes the first submit button if the form was submitted with enter', asyncSpec (next) ->
          $form = $fixture('form[action="/action"][up-target=".target"]')
          $textField = $form.affix('input[type="text"][name="text-field"][value="text-field-value"]')
          $submitButton1 = $form.affix('input[type="submit"][name="submit-button-1"][value="submit-button-1-value"]')
          $submitButton2 = $form.affix('input[type="submit"][name="submit-button-2"][value="submit-button-2-value"]')
          up.hello($form)

          Trigger.submit($form) # sorry

          next =>
            params = @lastRequest().data()
            expect(params['text-field']).toEqual(['text-field-value'])
            expect(params['submit-button-1']).toEqual(['submit-button-1-value'])
            expect(params['submit-button-2']).toBeUndefined()

        it 'does not explode if the form has no submit buttons', asyncSpec (next) ->
          $form = $fixture('form[action="/action"][up-target=".target"]')
          $textField = $form.affix('input[type="text"][name="text-field"][value="text-field-value"]')
          up.hello($form)

          Trigger.submit($form) # sorry

          next =>
            params = @lastRequest().data()
            keys = Object.keys(params)
            expect(keys).toEqual(['text-field'])

        it "lets submit buttons override the form's action and method with button[formaction] and button[formmethod] attributes", asyncSpec (next) ->
          $form = $fixture('form[action="/form-path"][method="GET"][up-follow]')
          $submitButton1 = $form.affix('input[type="submit"]')
          $submitButton2 = $form.affix('input[type="submit"][formaction="/button-path"][formmethod="POST"]')
          up.hello($form)
          Trigger.clickSequence($submitButton2)

          next =>
            request = @lastRequest()
            expect(request.url).toMatchURL('/button-path')
            expect(request.method).toBe('POST')

    describe 'input[up-autosubmit]', ->

      it 'submits the form when a change is observed in the given form field', asyncSpec (next) ->
        $form = $fixture('form')
        $field = $form.affix('input[up-autosubmit][name="input-name"][value="old-value"]')
        up.hello($field)
        submitSpy = up.form.knife.mock('submit').and.returnValue(u.unresolvablePromise())
        $field.val('new-value')
        Trigger.change($field)
        next => expect(submitSpy).toHaveBeenCalled()

      it 'submits the form when a change is observed on a container for a radio button group', asyncSpec (next) ->
        form = fixture('form')
        group = e.affix(form, '.group[up-autosubmit][up-delay=0]')
        radio1 = e.affix(group, 'input[type=radio][name=foo][value=1]')
        radio2 = e.affix(group, 'input[type=radio][name=foo][value=2]')
        up.hello(form)
        submitSpy = up.form.knife.mock('submit').and.returnValue(Promise.reject())
        Trigger.clickSequence(radio1)
        next =>
          expect(submitSpy.calls.count()).toBe(1)
          Trigger.clickSequence(radio2)
        next =>
          expect(submitSpy.calls.count()).toBe(2)
          Trigger.clickSequence(radio1)
        next =>
          expect(submitSpy.calls.count()).toBe(3)

    describe 'form[up-autosubmit]', ->

      it 'submits the form when a change is observed in any of its fields', asyncSpec (next) ->
        $form = $fixture('form[up-autosubmit]')
        $field = $form.affix('input[name="input-name"][value="old-value"]')
        up.hello($form)
        submitSpy = up.form.knife.mock('submit').and.returnValue(u.unresolvablePromise())
        $field.val('new-value')
        Trigger.change($field)
        next => expect(submitSpy).toHaveBeenCalled()

      describe 'with [up-delay] modifier', ->

        it 'debounces the form submission', asyncSpec (next) ->
          $form = $fixture('form[up-autosubmit][up-delay="50"]')
          $field = $form.affix('input[name="input-name"][value="old-value"]')
          up.hello($form)
          submitSpy = up.form.knife.mock('submit').and.returnValue(u.unresolvablePromise())
          $field.val('new-value-1')
          Trigger.change($field)
          $field.val('new-value-2')
          Trigger.change($field)

          next =>
            expect(submitSpy.calls.count()).toBe(0)

          next.after 80, =>
            expect(submitSpy.calls.count()).toBe(1)

    describe 'input[up-observe]', ->

      afterEach ->
        window.observeCallbackSpy = undefined

      it 'runs the JavaScript code in the attribute value when a change is observed in the field', asyncSpec (next) ->
        $form = $fixture('form')
        window.observeCallbackSpy = jasmine.createSpy('observe callback')
        $field = $form.affix('input[name="input-name"][value="old-value"][up-observe="window.observeCallbackSpy(value, name)"]')
        up.hello($form)
        $field.val('new-value')
        Trigger.change($field)

        next =>
          expect(window.observeCallbackSpy).toHaveBeenCalledWith('new-value', 'input-name')

      describe 'with [up-delay] modifier', ->

        it 'debounces the callback', asyncSpec (next) ->
          $form = $fixture('form')
          window.observeCallbackSpy = jasmine.createSpy('observe callback')
          $field = $form.affix('input[name="input-name"][value="old-value"][up-observe="window.observeCallbackSpy()"][up-delay="50"]')
          up.hello($form)
          $field.val('new-value')
          Trigger.change($field)

          next => expect(window.observeCallbackSpy).not.toHaveBeenCalled()
          next.after 80, => expect(window.observeCallbackSpy).toHaveBeenCalled()

    describe 'form[up-observe]', ->

      afterEach ->
        window.observeCallbackSpy = undefined

      it 'runs the JavaScript code in the attribute value when a change is observed in any contained field', asyncSpec (next) ->
        window.observeCallbackSpy = jasmine.createSpy('observe callback')
        $form = $fixture('form[up-observe="window.observeCallbackSpy(value, name)"]')
        $field1 = $form.affix('input[name="field1"][value="field1-old-value"]')
        $field2 = $form.affix('input[name="field2"][value="field2-old-value"]')
        up.hello($form)
        $field1.val('field1-new-value')
        Trigger.change($field1)

        next =>
          expect(window.observeCallbackSpy.calls.allArgs()).toEqual [
            ['field1-new-value', 'field1']
          ]

          $field2.val('field2-new-value')
          Trigger.change($field2)

        next =>
          expect(window.observeCallbackSpy.calls.allArgs()).toEqual [
            ['field1-new-value', 'field1'],
            ['field2-new-value', 'field2']
          ]

    describe 'input[up-validate]', ->

      describe 'when a selector is given', ->

        it "submits the input's form with an 'X-Up-Validate' header and replaces the selector with the response", asyncSpec (next) ->

          $form = $fixture('form[action="/path/to"]')
          $group = $("""
            <div class="field-group">
              <input name="user" value="judy" up-validate=".field-group:has(&)">
            </div>
          """).appendTo($form)

          Trigger.change($group.find('input'))

          next =>
            request = @lastRequest()
            expect(request.requestHeaders['X-Up-Validate']).toEqual('user')
            expect(request.requestHeaders['X-Up-Target']).toEqual('.field-group:has(input[name="user"])')

            @respondWith
              status: 500
              responseText: """
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

            # Since there isn't anyone who could handle the rejection inside
            # the event handler, our handler mutes the rejection.
            expect(window).not.toHaveUnhandledRejections() if REJECTION_EVENTS_SUPPORTED

        it 'does not reveal the updated fragment (bugfix)', asyncSpec (next) ->
          revealSpy = spyOn(up, 'reveal').and.returnValue(Promise.resolve())

          $form = $fixture('form[action="/path/to"]')
          $group = $("""
            <div class="field-group">
              <input name="user" value="judy" up-validate=".field-group:has(&)">
            </div>
          """).appendTo($form)
          Trigger.change($group.find('input'))

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
          container = fixture('.container')
          container.innerHTML = """
            <form action="/users" id="registration">

              <div up-fieldset>
                <input type="text" name="email" up-validate />
              </div>

              <div up-fieldset>
                <input type="password" name="password" up-validate />
              </div>

            </form>
          """
          up.hello(container)

          Trigger.change $('#registration input[name=password]')

          next =>
            @respondWith """
              <form action="/users" id="registration">

                <div up-fieldset>
                  Validation message
                  <input type="text" name="email" up-validate />
                </div>

                <div up-fieldset>
                  Validation message
                  <input type="password" name="password" up-validate />
                </div>

              </form>
            """

          next =>
            $labels = $('#registration [up-fieldset]')
            expect($labels[0]).not.toHaveText('Validation message')
            expect($labels[1]).toHaveText('Validation message')

      it 'does not send a validation request if the input field is blurred by clicking the submit button (bugfix)', asyncSpec (next) ->
        form = fixture('form[up-follow][action="/path"]')
        textField = e.affix(form, 'input[type=text][name=input][up-validate]')
        submitButton = e.affix(form, 'input[type=submit]')
        textField.value = "foo"

        form.addEventListener 'change', (event) -> console.log("CHANGE on %o", event.target)
        form.addEventListener 'submit', -> console.log("SUBMIT")

        Trigger.change(textField)
        Trigger.clickSequence(submitButton)

        next =>
          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(@lastRequest().requestHeaders['X-Up-Validate']).toBeMissing()


    describe 'form[up-validate]', ->

      # it 'prints an error saying that this form is not yet supported', ->

      it 'performs server-side validation for all fieldsets contained within the form', asyncSpec (next) ->
        container = fixture('.container')
        container.innerHTML = """
          <form action="/users" id="registration" up-validate>

            <div up-fieldset>
              <input type="text" name="email">
            </div>

            <div up-fieldset>
              <input type="password" name="password">
            </div>

          </form>
        """
        up.hello(container)

        Trigger.change $('#registration input[name=password]')

        next =>
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(@lastRequest().requestHeaders['X-Up-Validate']).toEqual('password')
          expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('[up-fieldset]:has(input[name="password"])')


          @respondWith """
            <form action="/users" id="registration" up-validate>

              <div up-fieldset>
                Validation message
                <input type="text" name="email">
              </div>

              <div up-fieldset>
                Validation message
                <input type="password" name="password">
              </div>

            </form>
          """

        next =>
          $labels = $('#registration [up-fieldset]')
          expect($labels[0]).not.toHaveText('Validation message')
          expect($labels[1]).toHaveText('Validation message')

      it 'only sends a single request when a radio button group changes', asyncSpec (next) ->
        container = fixture('.container')
        container.innerHTML = """
          <form action="/users" id="registration" up-validate>

            <div up-fieldset>
              <input type="radio" name="foo" value="1" checked>
              <input type="radio" name="foo" value="2">
            </div>

          </form>
        """
        up.hello(container)

        Trigger.change $('#registration input[value="2"]')

        next =>
          expect(jasmine.Ajax.requests.count()).toEqual(1)

      it 'uses a target given as [up-validate] attribute value for all validations', asyncSpec (next) ->
        container = fixture('.container')
        container.innerHTML = """
          <form action="/users" id="registration" up-validate='.result'>

            <div up-fieldset>
              <input name="email">
            </div>

            <div class="result">
              Validation resutls will appear here
            </div>

          </form>
        """
        up.hello(container)

        Trigger.change container.querySelector('input[name=email]')

        next =>
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(@lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')
          expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.result')

    describe '[up-switch]', ->

      describe 'on a select', ->

        beforeEach ->
          @$select = $fixture('select[name="select-name"][up-switch=".target"]')
          @$blankOption = @$select.affix('option').text('<Please select something>').val('')
          @$fooOption = @$select.affix('option[value="foo"]').text('Foo')
          @$barOption = @$select.affix('option[value="bar"]').text('Bar')
          @$bazOption = @$select.affix('option[value="baz"]').text('Baz')

        it "shows the target element iff its up-show-for attribute contains the select value", asyncSpec (next) ->
          $target = $fixture('.target[up-show-for="something bar other"]')
          up.hello(@$select)

          next =>
            expect($target).toBeHidden()
            @$select.val('bar')
            Trigger.change(@$select)

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-hide-for attribute doesn't contain the select value", asyncSpec (next) ->
          $target = $fixture('.target[up-hide-for="something bar other"]')
          up.hello(@$select)

          next =>
            expect($target).toBeVisible()
            @$select.val('bar')
            Trigger.change(@$select)

          next =>
            expect($target).toBeHidden()

        it "shows the target element iff it has neither up-show-for nor up-hide-for and the select value is present", asyncSpec (next) ->
          $target = $fixture('.target')
          up.hello(@$select)

          next =>
            expect($target).toBeHidden()
            @$select.val('bar')
            Trigger.change(@$select)

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':present' and the select value is present", asyncSpec (next) ->
          $target = $fixture('.target[up-show-for=":present"]')
          up.hello(@$select)

          next =>
            expect($target).toBeHidden()
            @$select.val('bar')
            Trigger.change(@$select)

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':blank' and the select value is blank", asyncSpec (next) ->
          $target = $fixture('.target[up-show-for=":blank"]')
          up.hello(@$select)

          next =>
            expect($target).toBeVisible()
            @$select.val('bar')
            Trigger.change(@$select)

          next =>
            expect($target).toBeHidden()

      describe 'on a checkbox', ->

        beforeEach ->
          @$checkbox = $fixture('input[name="input-name"][type="checkbox"][value="1"][up-switch=".target"]')

        it "shows the target element iff its up-show-for attribute is :checked and the checkbox is checked", asyncSpec (next) ->
          $target = $fixture('.target[up-show-for=":checked"]')
          up.hello(@$checkbox)

          next =>
            expect($target).toBeHidden()
            @$checkbox.prop('checked', true)
            Trigger.change(@$checkbox)

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute is :unchecked and the checkbox is unchecked", asyncSpec (next) ->
          $target = $fixture('.target[up-show-for=":unchecked"]')
          up.hello(@$checkbox)

          next =>
            expect($target).toBeVisible()
            @$checkbox.prop('checked', true)
            Trigger.change(@$checkbox)

          next =>
            expect($target).toBeHidden()

        it "shows the target element iff its up-hide-for attribute is :checked and the checkbox is unchecked", asyncSpec (next) ->
          $target = $fixture('.target[up-hide-for=":checked"]')
          up.hello(@$checkbox)

          next =>
            expect($target).toBeVisible()
            @$checkbox.prop('checked', true)
            Trigger.change(@$checkbox)

          next =>
            expect($target).toBeHidden()

        it "shows the target element iff its up-hide-for attribute is :unchecked and the checkbox is checked", asyncSpec (next) ->
          $target = $fixture('.target[up-hide-for=":unchecked"]')
          up.hello(@$checkbox)

          next =>
            expect($target).toBeHidden()
            @$checkbox.prop('checked', true)
            Trigger.change(@$checkbox)

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff it has neither up-show-for nor up-hide-for and the checkbox is checked", asyncSpec (next) ->
          $target = $fixture('.target')
          up.hello(@$checkbox)

          next =>
            expect($target).toBeHidden()
            @$checkbox.prop('checked', true)
            Trigger.change(@$checkbox)

          next =>
            expect($target).toBeVisible()

      describe 'on a group of radio buttons', ->

        beforeEach ->
          @$buttons     = $fixture('.radio-buttons')
          @$blankButton = @$buttons.affix('input[type="radio"][name="group"][up-switch=".target"]').val('')
          @$fooButton   = @$buttons.affix('input[type="radio"][name="group"][up-switch=".target"]').val('foo')
          @$barButton   = @$buttons.affix('input[type="radio"][name="group"][up-switch=".target"]').val('bar')
          @$bazkButton  = @$buttons.affix('input[type="radio"][name="group"][up-switch=".target"]').val('baz')

        it "shows the target element iff its up-show-for attribute contains the selected button value", asyncSpec (next) ->
          $target = $fixture('.target[up-show-for="something bar other"]')
          up.hello(@$buttons)

          next =>
            expect($target).toBeHidden()
            @$barButton.prop('checked', true)
            Trigger.change(@$barButton)

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-hide-for attribute doesn't contain the selected button value", asyncSpec (next) ->
          $target = $fixture('.target[up-hide-for="something bar other"]')
          up.hello(@$buttons)

          next =>
            expect($target).toBeVisible()
            @$barButton.prop('checked', true)
            Trigger.change(@$barButton)

          next =>
            expect($target).toBeHidden()

        it "shows the target element iff it has neither up-show-for nor up-hide-for and the selected button value is present", asyncSpec (next) ->
          $target = $fixture('.target')
          up.hello(@$buttons)

          next =>
            expect($target).toBeHidden()
            @$barButton.prop('checked', true)
            Trigger.change(@$barButton)

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':present' and the selected button value is present", asyncSpec (next) ->
          $target = $fixture('.target[up-show-for=":present"]')
          up.hello(@$buttons)

          next =>
            expect($target).toBeHidden()
            @$blankButton.prop('checked', true)
            Trigger.change(@$blankButton)

          next =>
            expect($target).toBeHidden()
            @$barButton.prop('checked', true)
            Trigger.change(@$barButton)

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':blank' and the selected button value is blank", asyncSpec (next) ->
          $target = $fixture('.target[up-show-for=":blank"]')
          up.hello(@$buttons)

          next =>
            expect($target).toBeVisible()
            @$blankButton.prop('checked', true)
            Trigger.change(@$blankButton)

          next =>
            expect($target).toBeVisible()
            @$barButton.prop('checked', true)
            Trigger.change(@$barButton)

          next =>
            expect($target).toBeHidden()

        it "shows the target element iff its up-show-for attribute contains a value ':checked' and any button is checked", asyncSpec (next) ->
          $target = $fixture('.target[up-show-for=":checked"]')
          up.hello(@$buttons)

          next =>
            expect($target).toBeHidden()
            @$blankButton.prop('checked', true)
            Trigger.change(@$blankButton)

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':unchecked' and no button is checked", asyncSpec (next) ->
          $target = $fixture('.target[up-show-for=":unchecked"]')
          up.hello(@$buttons)

          next =>
            expect($target).toBeVisible()
            @$blankButton.prop('checked', true)
            Trigger.change(@$blankButton)

          next =>
            expect($target).toBeHidden()

      describe 'on a text input', ->

        beforeEach ->
          @$textInput = $fixture('input[name="input-name"][type="text"][up-switch=".target"]')

        it "shows the target element iff its up-show-for attribute contains the input value", asyncSpec (next) ->
          $target = $fixture('.target[up-show-for="something bar other"]')
          up.hello(@$textInput)

          next =>
            expect($target).toBeHidden()
            @$textInput.val('bar')
            Trigger.change(@$textInput)

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-hide-for attribute doesn't contain the input value", asyncSpec (next) ->
          $target = $fixture('.target[up-hide-for="something bar other"]')
          up.hello(@$textInput)

          next =>
            expect($target).toBeVisible()
            @$textInput.val('bar')
            Trigger.change(@$textInput)

          next =>
            expect($target).toBeHidden()

        it "shows the target element iff it has neither up-show-for nor up-hide-for and the input value is present", asyncSpec (next) ->
          $target = $fixture('.target')
          up.hello(@$textInput)

          next =>
            expect($target).toBeHidden()
            @$textInput.val('bar')
            Trigger.change(@$textInput)

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':present' and the input value is present", asyncSpec (next) ->
          $target = $fixture('.target[up-show-for=":present"]')
          up.hello(@$textInput)

          next =>
            expect($target).toBeHidden()
            @$textInput.val('bar')
            Trigger.change(@$textInput)

          next =>
            expect($target).toBeVisible()

        it "shows the target element iff its up-show-for attribute contains a value ':blank' and the input value is blank", asyncSpec (next) ->
          $target = $fixture('.target[up-show-for=":blank"]')
          up.hello(@$textInput)

          next =>
            expect($target).toBeVisible()
            @$textInput.val('bar')
            Trigger.change(@$textInput)

          next =>
            expect($target).toBeHidden()

      describe 'when an [up-show-for] element is dynamically inserted later', ->

        it "shows the element iff it matches the [up-switch] control's value", asyncSpec (next) ->
          $select = $fixture('select[name="select-name"][up-switch=".target"]')
          $select.affix('option[value="foo"]').text('Foo')
          $select.affix('option[value="bar"]').text('Bar')
          $select.val('foo')
          up.hello($select)

          next =>
            # New target enters the DOM after [up-switch] has been compiled
            @$target = $fixture('.target[up-show-for="bar"]')
            up.hello(@$target)

          next =>
            expect(@$target).toBeHidden()

          next =>
            # Check that the new element will notify subsequent changes
            $select.val('bar')
            Trigger.change($select)
            expect(@$target).toBeVisible()

        it "doesn't re-switch targets that were part of the original compile run", asyncSpec (next) ->
          $container = $fixture('.container')

          $select = $container.affix('select[name="select-name"][up-switch=".target"]')
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
            expect(switchTargetSpy.calls.argsFor(0)[0]).toEqual($existingTarget[0])
            expect(switchTargetSpy.calls.argsFor(1)[0]).toEqual(@$lateTarget[0])

      it "works on inputs outside the form (associated with [form=form-id] attribute)", asyncSpec (next) ->
        form = fixture('form#form-id')
        select = e.affix(form, 'select[name="select-name"][up-switch=".target"][form="#form-id"]')
        fooOption = e.affix(select, 'option[value="foo"]', text: 'Foo')
        barOption = e.affix(select, 'option[value="bar"]', text: 'Bar')
        bazOption = e.affix(select, 'option[value="baz"]', text: 'Baz')
        target = e.affix(form, '.target[up-show-for="bar"]')
        up.hello(select)

        next =>
          expect(target).toBeHidden()
          select.value = 'bar'
          Trigger.change(select)

        next =>
          expect(target).toBeVisible()
