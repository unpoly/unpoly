u = up.util
e = up.element
$ = jQuery

describe 'up.form', ->

  describe 'JavaScript functions', ->

    describe 'up.form.fields', ->

      it 'returns a list of form fields within the given element', ->
        form = fixture('form')
        textField = e.affix(form, 'input[name=email][type=text]')
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
        form1Field = e.affix(form1, 'input[name=email][type=text]')
        form2 = fixture('form')
        form2Field = e.affix(form2, 'input[name=email][type=text]')
        results = up.form.fields(form1)
        expect(results).toMatchList([form1Field])

      it "includes fields outside the form with a [form] attribute matching the given form's ID", ->
        form = fixture('form#form-id')
        insideField = e.affix(form, 'input[name=email][type=text]')
        outsideField = fixture('input[name=password][type=text][form=form-id]')
        results = up.form.fields(form)
        expect(results).toMatchList([insideField, outsideField])

      it "does not return duplicate fields if a field with a matching [form] attribute is also a child of the form", ->
        form = fixture('form#form-id')
        field = e.affix(form, 'input[name=email][type=text][form=form-id]')
        results = up.form.fields(form)
        expect(results).toMatchList([field])

    describe 'up.form.groupSolution()', ->

      it 'returns a solution for the form group closest to the given element, distinguishing the selector from other form groups by refering to the given element with :has()', ->
        form = fixture('form')
        group = e.affix(form, '[up-form-group]')
        input = e.affix(group, 'input[name=foo]')

        groupSolution = up.form.groupSolution(input)

        expect(groupSolution).toEqual(jasmine.objectContaining(
          element: group,
          target: '[up-form-group]:has(input[name="foo"])'
        ))

      it 'returns the form if no closer group exists', ->
        form = fixture('form#foo-form')
        container = e.affix(form, 'div')
        input = e.affix(container, 'input[name=foo]')

        groupSolution = up.form.groupSolution(input)

        expect(groupSolution).toEqual(jasmine.objectContaining(
          element: form,
          target: '#foo-form'
        ))

      it 'returns the form if a good selector can be derived from neither group nor input', ->
        form = fixture('form#foo-form')
        container = e.affix(form, '[up-form-group]')
        input = e.affix(container, 'input')

        groupSolution = up.form.groupSolution(input)

        expect(groupSolution).toEqual(jasmine.objectContaining(
          element: form,
          target: '#foo-form'
        ))

      it 'does not append a :has(...) if the given element is already a group', ->
        form = fixture('form')
        group = e.affix(form, '#group[up-form-group]')

        groupSolution = up.form.groupSolution(group)

        expect(groupSolution).toEqual(jasmine.objectContaining(
          element: group,
          target: '#group'
        ))

      it 'does not append a :has(...) for the input if the group already has a good selector itself', ->
        form = fixture('form')
        group = e.affix(form, '#group[up-form-group]')
        input = e.affix(group, 'input[name=foo]')

        groupSolution = up.form.groupSolution(input)

        expect(groupSolution).toEqual(jasmine.objectContaining(
          element: group,
          target: '#group'
        ))

    describe 'up.form.groupSelectors()', ->

      it 'returns the configured up.form.config.groupSelectors', ->
        up.form.config.groupSelectors = ['.form-group']

        expect(up.form.groupSelectors()).toEqual(['.form-group'])

      if up.migrate.loaded
        it 'removes a :has(&) suffix from custom user selectors', ->
          up.form.config.groupSelectors = ['.form-group:has(&)']

          expect(up.form.groupSelectors()).toEqual(['.form-group'])

        it 'removes a :has(:origin) suffix from custom user selectors', ->
          up.form.config.groupSelectors = ['.form-group:has(:origin)']

          expect(up.form.groupSelectors()).toEqual(['.form-group'])

    describe 'up.form.submitButtons()', ->

      it "returns the given form's submit buttons", ->
        form = fixture('form')
        submitButton = e.affix(form, 'button[type=submit]')
        submitInput = e.affix(form, 'input[type=submit]')
        otherButton = e.affix(form, 'button[type=reset]')
        otherInput = e.affix(form, 'input[name=text-field][type=text]')

        result = up.form.submitButtons(form)
        expect(result).toEqual(jasmine.arrayWithExactContents([submitButton, submitInput]))

    describe 'up.watch()', ->

      beforeEach ->
        up.form.config.watchInputDelay = 0

      # Actually we only need `input`, but we want to notice
      # if another script manually triggers `change` on the element.
      defaultInputEvents = ['input', 'change']

      describe 'with a field element', ->

        it "runs the callback with the field's default value when the form is reset", ->
          form = fixture('form')
          input = e.affix(form, 'input[name=foo][value=default]')
          reset = e.affix(form, 'input[type=reset]')

          callback = jasmine.createSpy('watch callback')

          up.watch(input, callback)

          input.value = 'changed'
          Trigger.change(input)
          await wait()

          expect(callback.calls.count()).toBe(1)
          expect(callback.calls.argsFor(0)[0]).toBe('changed')

          reset.click()
          await wait()
          await wait() # We need to wait 1 task for the reset button to affect field values, then another task for a 0ms debounce delay.

          expect(callback.calls.count()).toBe(2)
          expect(callback.calls.argsFor(1)[0]).toBe('default')


        u.each defaultInputEvents, (eventType) ->

          describe "when the input receives a #{eventType} event", ->

            it "runs the callback if the value changed", asyncSpec (next) ->
              form = fixture('form')
              input = e.affix(form, 'input[name="input-name"][value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.watch(input, callback)
              input.value = 'new-value'
              Trigger[eventType](input)
              Trigger[eventType](input)
              next =>
                expect(callback).toHaveBeenCalledWith('new-value', 'input-name', jasmine.anything())
                expect(callback.calls.count()).toEqual(1)

            it "does not run the callback if the value didn't change", asyncSpec (next) ->
              form = fixture('form')
              input = e.affix(form, 'input[name="input-name"][value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.watch(input, callback)
              Trigger[eventType](input)
              next =>
                expect(callback).not.toHaveBeenCalled()

            it 'forwards render options parsed from the DOM as a callback argument', asyncSpec (next) ->
              callback = jasmine.createSpy('up.watch() callback')

              form = fixture('form')
              input = e.affix(form, 'input[name=email][up-watch-feedback=false]')
              up.hello(form)

              up.watch(input, callback)

              input.value = "other"
              Trigger.change(input)

              next ->
                expect(callback).toHaveBeenCalledWith(
                  'other',
                  'email',
                  jasmine.objectContaining({ origin: input, feedback: false })
                )

            describe 'with { delay } option', ->

              it 'debounces the callback', asyncSpec (next) ->
                form = fixture('form')
                input = e.affix(form, 'input[name="input-name"][value="old-value"]')
                callback = jasmine.createSpy('change callback')
                up.watch(input, { delay: 200 }, callback)
                input.value = 'new-value-1'
                Trigger[eventType](input)

                next.after 100, ->
                  # 100 ms after change 1: We're still waiting for the 200ms delay to expire
                  expect(callback.calls.count()).toEqual(0)

                next.after 200, ->
                  # 300 ms after change 1: The 200ms delay has expired
                  expect(callback.calls.count()).toEqual(1)
                  expect(callback.calls.mostRecent().args[0]).toEqual('new-value-1')
                  input.value = 'new-value-2'
                  Trigger[eventType](input)

                next.after 80, ->
                  # 80 ms after change 2: We change again, resetting the delay
                  expect(callback.calls.count()).toEqual(1)
                  input.value = 'new-value-3'
                  Trigger[eventType](input)

                next.after 170, ->
                  # 250 ms after change 2, which was superseded by change 3
                  # 170 ms after change 3
                  expect(callback.calls.count()).toEqual(1)

                next.after 130, ->
                  # 190 ms after change 2, which was superseded by change 3
                  # 150 ms after change 3
                  expect(callback.calls.count()).toEqual(2)
                  expect(callback.calls.mostRecent().args[0]).toEqual('new-value-3')

              it 'does not run the callback if the form was detached during the delay', asyncSpec (next) ->
                form = fixture('form')
                input = e.affix(form, 'input[name="input-name"][value="old-value"]')
                callback = jasmine.createSpy('watcher callback')
                up.watch(input, { delay: 150 }, callback)
                input.value = 'new-value'
                Trigger[eventType](input)

                next.after 50, ->
                  up.destroy(form)

                next.after 150, ->
                  expect(callback).not.toHaveBeenCalled()

              it 'does not run the callback if the form was aborted during the delay', asyncSpec (next) ->
                form = fixture('form')
                input = e.affix(form, 'input[name="input-name"][value="old-value"]')
                callback = jasmine.createSpy('watcher callback')
                up.watch(input, { delay: 150 }, callback)
                input.value = 'new-value'
                Trigger[eventType](input)

                next.after 50, ->
                  up.fragment.abort(form)

                next.after 150, ->
                  expect(callback).not.toHaveBeenCalled()

            it 'delays a callback if a previous async callback is taking long to execute', ->
              form = fixture('form')
              input = e.affix(form, 'input[name="input-name"][value="old-value"]')
              callbackCount = 0
              callback = ->
                callbackCount += 1
                return up.specUtil.promiseTimer(100)
              up.watch(input, { delay: 1 }, callback)
              input.value = 'new-value-1'
              Trigger[eventType](input)

              await wait(30)

              # Callback has been called and takes 100 ms to complete
              expect(callbackCount).toEqual(1)
              input.value = 'new-value-2'
              Trigger[eventType](input)

              await wait(30)

              # Second callback is triggerd, but waits for first callback to complete
              expect(callbackCount).toEqual(1)

              await wait(90)

              # After 150 ms the first callback should be finished and the queued 2nd callback has executed
              expect(callbackCount).toEqual(2)

            it 'does not run a callback if the form was aborted while a previous callback was still running', asyncSpec (next) ->
              form = fixture('form')
              input = e.affix(form, 'input[name="input-name"][value="old-value"]')
              callbackCount = 0
              callback = ->
                callbackCount += 1
                return up.specUtil.promiseTimer(100)
              up.watch(input, { delay: 1 }, callback)
              input.value = 'new-value-1'
              Trigger[eventType](input)

              await wait(30)

              # Callback has been called and takes 100 ms to complete
              expect(callbackCount).toEqual(1)
              input.value = 'new-value-2'
              Trigger[eventType](input)

              await wait(30)

              # Second callback is triggerd, but waits for first callback to complete
              expect(callbackCount).toEqual(1)

              await wait(10)

              # Aborting the form will unqueue the second callback.
              up.fragment.abort(form)

              await wait(80)

              # After 150 ms the first callback should be finished. The 2nd callback has been unqueued because the form was aborted.
              expect(callbackCount).toEqual(1)

            it 'does not run a callback if the form was detached while a previous callback was still running', asyncSpec (next) ->
              form = fixture('form')
              input = e.affix(form, 'input[name="input-name"][value="old-value"]')
              callbackCount = 0
              callback = ->
                callbackCount += 1
                return up.specUtil.promiseTimer(100)
              up.watch(input, { delay: 1 }, callback)
              input.value = 'new-value-1'
              Trigger[eventType](input)

              await wait(30)

              # Callback has been called and takes 100 ms to complete
              expect(callbackCount).toEqual(1)
              input.value = 'new-value-2'
              Trigger[eventType](input)

              await wait(30)

              # Second callback is triggerd, but waits for first callback to complete
              expect(callbackCount).toEqual(1)

              await wait(10)

              form.remove()

              await wait(80)

              # After 150 ms the first callback should be finished.
              # The 2nd callback will not run because no field is attached.
              expect(callbackCount).toEqual(1)

            it 'only runs the last callback when a previous long-running callback has been delaying multiple callbacks', asyncSpec (next) ->
              form = fixture('form')
              input = e.affix(form, 'input[name="input-name"][value="old-value"]')

              callbackArgs = []
              callback = (value, field) ->
                callbackArgs.push(value)
                return up.specUtil.promiseTimer(100)

              up.watch(input, { delay: 1 }, callback)
              input.value = 'new-value-1'
              Trigger[eventType](input)

              next.after 10, ->
                # Callback has been called and takes 100 ms to complete
                expect(callbackArgs).toEqual ['new-value-1']
                input.value = 'new-value-2'
                Trigger[eventType](input)

              next.after 10, ->
                expect(callbackArgs).toEqual ['new-value-1']
                input.value = 'new-value-3'
                Trigger[eventType](input)

              next.after 100, ->
                expect(callbackArgs).toEqual ['new-value-1', 'new-value-3']

            it "executes the form's [up-watch-disable] option while an async callback is running", asyncSpec (next) ->
              form = fixture('form[up-watch-disable]')
              input = e.affix(form, 'input[name=email]')
              callbackDeferred = u.newDeferred()
              callback = jasmine.createSpy('callback').and.returnValue(callbackDeferred)

              up.watch(input, callback)

              input.value = "other"
              Trigger[eventType](input)

              next ->
                expect(callback).toHaveBeenCalled()
                expect(input).toBeDisabled()

                callbackDeferred.resolve()

              next ->
                expect(input).not.toBeDisabled()

            it "executes the fields's [up-watch-disable] option while an async callback is running", asyncSpec (next) ->
              form = fixture('form')
              input = e.affix(form, 'input[name=email][up-watch-disable]')
              callbackDeferred = u.newDeferred()
              callback = jasmine.createSpy('callback').and.returnValue(callbackDeferred)

              up.watch(input, callback)

              input.value = "other"
              Trigger[eventType](input)

              next ->
                expect(callback).toHaveBeenCalled()
                expect(input).toBeDisabled()

                callbackDeferred.resolve()

              next ->
                expect(input).not.toBeDisabled()

            it "overrides the [up-watch-disable] option from form and field if an { disable } option is also passed", asyncSpec (next) ->
              form = fixture('form[up-watch-disable]')
              input = e.affix(form, 'input[name=email][up-watch-disable]')
              callbackDeferred = u.newDeferred()
              callback = jasmine.createSpy('callback').and.returnValue(callbackDeferred)

              up.watch(input, { disable: false }, callback)

              input.value = "other"
              Trigger[eventType](input)

              next ->
                expect(callback).toHaveBeenCalled()
                expect(input).not.toBeDisabled()

            describe 'when the callback throws an error', ->

              it 'emits an error event', ->
                form = fixture('form')
                input = e.affix(form, 'input[name=email]')

                callbackError = new Error('error from watch callback')
                callback = jasmine.createSpy('watch callback').and.throwError(callbackError)

                up.watch(input, callback)

                input.value = 'value2'

                await jasmine.expectGlobalError callbackError, ->
                  Trigger[eventType](input)

                  # Watcher waits for at least 1 task to group multiple updates with the same end value
                  await wait()

              it 'keeps watching', ->
                form = fixture('form')
                input = e.affix(form, 'input[name=email]')

                callbackError = new Error('error from watch callback')
                callback = jasmine.createSpy('watch callback').and.throwError(callbackError)

                up.watch(input, callback)

                input.value = 'value2'
                await jasmine.expectGlobalError callbackError, ->
                  Trigger[eventType](input)

                  # Watcher waits for at least 1 task to group multiple updates with the same end value
                  await wait()

                input.value = 'value3'
                await jasmine.expectGlobalError callbackError, ->
                  Trigger[eventType](input)

                  # Watcher waits for at least 1 task to group multiple updates with the same end value
                  await wait()

        describe 'with a checkbox', ->

          it 'runs the callback when the checkbox changes its checked state', asyncSpec (next) ->
            $form = $fixture('form')
            $checkbox = $form.affix('input[name="input-name"][type="checkbox"][value="checkbox-value"]')
            callback = jasmine.createSpy('change callback')
            up.watch($checkbox, callback)
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
            up.watch($checkbox, callback)
            expect($checkbox.is(':checked')).toBe(false)
            Trigger.clickSequence($label)

            next =>
              expect($checkbox.is(':checked')).toBe(true)
              expect(callback.calls.count()).toEqual(1)
              Trigger.clickSequence($label)

            next =>
              expect($checkbox.is(':checked')).toBe(false)
              expect(callback.calls.count()).toEqual(2)

      describe 'with an element containing a radio button group', ->

        it 'runs the callback when the group changes its selection', asyncSpec (next) ->
          $form = $fixture('form')
          $group = $form.affix('div')
          $radio1 = $group.affix('input[type="radio"][name="group"][value="1"]')
          $radio2 = $group.affix('input[type="radio"][name="group"][value="2"]')
          callback = jasmine.createSpy('change callback')
          up.watch($group, callback)
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
          $group = $form.affix('div')
          $radio1 = $group.affix('input#radio1[type="radio"][name="group"][value="1"]')
          $radio1Label = $group.affix('label[for="radio1"]').text('label 1')
          $radio2 = $group.affix('input#radio2[type="radio"][name="group"][value="2"]')
          $radio2Label = $group.affix('label[for="radio2"]').text('label 2')
          callback = jasmine.createSpy('change callback')
          up.watch($group, callback)
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
          $group = $form.affix('div')
          $radio1 = $group.affix('input[type="radio"][name="group"][value="1"][checked="checked"]')
          $radio2 = $group.affix('input[type="radio"][name="group"][value="2"]')
          callback = jasmine.createSpy('change callback')
          up.watch($group, callback)
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

      describe 'with a form element', ->

        u.each defaultInputEvents, (eventType) ->

          describe "when any of the form's fields receives a #{eventType} event", ->

            it "runs the callback if the value changed", asyncSpec (next) ->
              form = fixture('form')
              input = e.affix(form, 'input[name="input-name"][value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.watch(form, callback)
              input.value = 'new-value'
              Trigger[eventType](input)
              Trigger[eventType](input)
              next =>
                expect(callback).toHaveBeenCalledWith('new-value', 'input-name', jasmine.anything())
                expect(callback.calls.count()).toEqual(1)

            it "does not run the callback if the value didn't change", asyncSpec (next) ->
              form = fixture('form')
              input = e.affix(form, 'input[name="input-name"][value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.watch(form, callback)
              Trigger[eventType](input)
              next =>
                expect(callback).not.toHaveBeenCalled()

            it 'detects a change in a field that was added dynamically later', ->
              callback = jasmine.createSpy('change callback')
              form = fixture('form')
              target = fixture('#target')
              field1 = e.affix(form, 'input[name="input1"][value="old-value"]')
              up.watch(form, callback)
              up.hello(form)

              field2 = e.affix(form, 'input[name="input2"][value="old-value"]')
              up.hello(field2)

              field2.value = 'new-value'
              Trigger.change(field2)

              await wait()

              expect(callback).toHaveBeenCalled()

            it 'detects a change in a field that was added dynamically later and that also has a custom [up-watch-event]', ->
              callback = jasmine.createSpy('change callback')
              form = fixture('form')
              target = fixture('#target')
              field1 = e.affix(form, 'input[name="input1"][value="old-value"]')
              up.watch(form, callback)
              up.hello(form)

              field2 = e.affix(form, 'input[name="input2"][value="old-value"][up-watch-event="custom:event"]')
              up.hello(field2)

              field2.value = 'new-value'
              up.emit(field2, 'custom:event')

              await wait()

              expect(callback).toHaveBeenCalled()

      describe 'with an element containing fields', ->

        u.each defaultInputEvents, (eventType) ->

          describe "when any of the contained fields receives a #{eventType} event", ->

            it "runs the callback if the value changed", asyncSpec (next) ->
              form = fixture('form')
              container = e.affix(form, 'div')
              input = e.affix(container, 'input[name="input-name"][value="old-value"]')
              callback = jasmine.createSpy('change callback')
              up.watch(container, callback)

              input.value = 'new-value'
              Trigger[eventType](input)

              next ->
                expect(callback).toHaveBeenCalledWith('new-value', 'input-name', jasmine.anything())
                expect(callback.calls.count()).toEqual(1)

            it 'does not run the callback if a field outside the container changes', asyncSpec (next) ->
              form = fixture('form')
              container = e.affix(form, 'div')
              input = e.affix(container, 'input[name="input-name"][value="old-value"]')
              otherInput = e.affix(form, 'input[name="other"]')
              callback = jasmine.createSpy('change callback')
              up.watch(container, callback)

              otherInput.value = 'new-value'
              Trigger[eventType](otherInput)

              next ->
                expect(callback).not.toHaveBeenCalled()

      describe 'with { batch: true } options', ->

        it 'calls the callback once with all collected changes in a diff object', asyncSpec (next) ->
          $form = $fixture('form')
          $input1 = $form.affix('input[name="input1"][value="input1-a"]')
          $input2 = $form.affix('input[name="input2"][value="input2-a"]')
          callback = jasmine.createSpy('change callback')
          up.watch($form, { batch: true }, callback)

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

    if up.migrate.loaded
      describe 'up.observe()', ->

        describe 'with an array of fields', ->

          it "runs the callback if the value of any field changes", asyncSpec (next) ->
            form = fixture('form')
            input1 = e.affix(form, 'input[name="foo"][value="old-foo"]')
            input2 = e.affix(form, 'input[name="bar"][value="old-bar"]')
            callback = jasmine.createSpy('change callback')
            up.observe([input1, input2], callback)

            input1.value = 'new-foo'
            Trigger.input(input1)

            next ->
              expect(callback.calls.count()).toEqual(1)
              expect(callback.calls.argsFor(0)).toEqual ['new-foo', 'foo', jasmine.anything()]

              input2.value = 'new-bar'
              Trigger.input(input2)

            next ->
              expect(callback.calls.count()).toEqual(2)
              expect(callback.calls.argsFor(1)).toEqual ['new-bar', 'bar', jasmine.anything()]

          it 'does not run the callback if another field inside the same form changes', asyncSpec (next) ->
            form = fixture('form')
            input1 = e.affix(form, 'input[name="foo"][value="old-foo"]')
            input2 = e.affix(form, 'input[name="bar"][value="old-bar"]')
            input3 = e.affix(form, 'input[name="baz"][value="old-baz"]')

            callback = jasmine.createSpy('change callback')
            up.observe([input1, input2], callback)

            input3.value = 'new-foo'
            Trigger.input(input3)

            next ->
              expect(callback).not.toHaveBeenCalled()

    describe 'up.form.watchOptions()', ->

      it 'parses the closest [up-watch-event] attribute into an { event } option', ->
        form = fixture('form')
        container = e.affix(form, 'div[up-watch-event="my:event"]')
        field = e.affix(container, 'input[type="text"][name="foo"]')

        options = up.form.watchOptions(field)

        expect(options.event).toBe('my:event')

      it 'expands [up-watch-event="change"] into up.form.config.watchChangeEvents', ->
        form = fixture('form')
        field = e.affix(form, 'input[type="text"][name="foo"][up-watch-event="change"]')
        up.form.config.watchChangeEvents = ['change', 'blur']

        options = up.form.watchOptions(field)

        expect(options.event).toEqual ['change', 'blur']

      it 'expands [up-watch-event="input"] into up.form.config.watchInputEvents', ->
        form = fixture('form')
        field = e.affix(form, 'input[type="text"][name="foo"][up-watch-event="input"]')
        up.form.config.watchInputEvents = ['custom:event']

        options = up.form.watchOptions(field)

        expect(options.event).toEqual ['custom:event']

      it 'accepts a parser option { defaults } with defaults that can be overridden with any attribute or option', ->
        form = fixture('form[up-watch-disable=false]')
        field = e.affix(form, 'input[type="text"][name="foo"]')

        options = up.form.watchOptions(field, {}, { defaults: { disable: true, feedback: true }})

        expect(options).toEqual(jasmine.objectContaining(disable: false, feedback: true))

      it 'prioritizes the closest [up-watch-] prefixed attribute', ->
        form = fixture('form[up-watch-delay=1000]')
        container = e.affix(form, 'div[up-watch-delay=500]')
        field = e.affix(container, 'input[type="text"][name="foo"]')

        options = up.form.watchOptions(field)

        expect(options).toEqual(jasmine.objectContaining(delay: 500))

      it 'overrides all attributes with the given options hash', ->
        form = fixture('form[up-watch-delay=1000]')
        field = e.affix(form, 'input[type="text"][name="foo"]')

        options = up.form.watchOptions(field, { delay: 300 })

        expect(options).toEqual(jasmine.objectContaining(delay: 300))

    describe 'up.submit()', ->

      it 'emits a preventable up:form:submit event', ->
        $form = $fixture('form[action="/form-target"][up-target=".response"]')

        listener = jasmine.createSpy('submit listener').and.callFake (event) ->
          event.preventDefault()

        $form.on('up:form:submit', listener)

        renderJob = up.submit($form)

        await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Aborted))

        expect(listener).toHaveBeenCalled()
        element = listener.calls.mostRecent().args[1]
        expect(element).toEqual(element)

        # No request should be made because we prevented the event
        expect(jasmine.Ajax.requests.count()).toEqual(0)

      it 'submits an form that has both an [id] attribute and a field with [name=id] (bugfix)', asyncSpec (next) ->
        form = fixture('form#form-id[action="/path"][up-submit][method=post]')
        e.affix(form, 'input[name="id"][value="value"]')

        up.submit(form)

        next =>
          params = @lastRequest().data()
          expect(params['id']).toEqual(['value'])

      it 'loads a form with a cross-origin [action] in a new page', asyncSpec (next) ->
        form = fixture('form#form-id[action="https://external-domain.com/path"][up-submit][method=post]')
        e.affix(form, 'input[name="field-name"][value="field-value"]')

        loadPage = spyOn(up.network, 'loadPage')

        up.submit(form)

        next =>
          expect(loadPage).toHaveBeenCalledWith(jasmine.objectContaining(
            method: 'POST',
            url: 'https://external-domain.com/path',
            params: new up.Params('field-name': 'field-value')
          ))

      it 'returns a promise with an up.RenderResult that contains information about the updated fragments and layer', asyncSpec (next) ->
        fixture('.one', text: 'old one')
        fixture('.two', text: 'old two')
        fixture('.three', text: 'old three')

        form = fixture('form[up-target=".one, .three"][action="/path"]')

        promise = up.submit(form)

        next =>
          @respondWith """
            <div class="one">new one</div>
            <div class="two">new two</div>
            <div class="three">new three</div>
          """

        next =>
          next.await promiseState(promise)

        next (result) =>
          expect(result.state).toBe('fulfilled')
          expect(result.value.fragments).toEqual([document.querySelector('.one'), document.querySelector('.three')])
          expect(result.value.layer).toBe(up.layer.root)

      describe 'with { disable } option', ->

        describe 'with { disable: "form" }', ->

          it 'disables all fields and buttons while submitting', asyncSpec (next) ->
            form = fixture('form')
            input = e.affix(form, 'input[name=email]')
            submitButton = e.affix(form, 'input[type=submit]')

            up.submit(form, { disable: 'form' })

            next =>
              expect(input).toBeDisabled()
              expect(submitButton).toBeDisabled()

        describe 'with { disable: true }', ->

          it 'disables all fields and buttons while submitting', asyncSpec (next) ->
            form = fixture('form')
            input = e.affix(form, 'input[name=email]')
            submitButton = e.affix(form, 'input[type=submit]')

            up.submit(form, { disable: true })

            next =>
              expect(input).toBeDisabled()
              expect(submitButton).toBeDisabled()

        describe 'with a CSS selector', ->

          it "disables fields within the given selector while submitting", asyncSpec (next) ->
            form = fixture('form')

            group = e.affix(form, '.one')
            input = e.affix(group, 'input[name=email]')
            otherGroup = e.affix(form, '.two')
            otherInput = e.affix(otherGroup, 'input[name=password]')

            up.submit(form, { disable: '.one' })

            next =>
              expect(input).toBeDisabled()
              expect(otherInput).not.toBeDisabled()

          it 'disables within all (not just the first) match of the given selector', asyncSpec (next) ->
            form = fixture('form')

            group = e.affix(form, '.group')
            input = e.affix(group, 'input[name=email]')
            alsoGroup = e.affix(form, '.group')
            alsoInput = e.affix(alsoGroup, 'input[name=email]')

            up.submit(form, { disable: '.group' })

            next =>
              expect(input).toBeDisabled()
              expect(alsoInput).toBeDisabled()

          it 'does not disable matches outside of the form', asyncSpec (next) ->
            form = fixture('form')
            groupInside = e.affix(form, '.group')
            inputInside = e.affix(groupInside, 'input[name=email]')

            otherForm = fixture('form')
            groupOutside = e.affix(otherForm, '.group')
            inputOutside = e.affix(groupOutside, 'input[name=email]')

            up.submit(form, { disable: '.group' })

            next =>
              expect(inputInside).toBeDisabled()
              expect(inputOutside).not.toBeDisabled()

        it 're-enables the form when the submission ends in a successful response', asyncSpec (next) ->
          fixture('.target')
          form = fixture('form[up-target=".target"]')
          input = e.affix(form, 'input[name=email]')

          up.submit(form, { disable: true })

          next ->
            expect(input).toBeDisabled()

            jasmine.respondWithSelector('.target')

          next ->
            expect(input).not.toBeDisabled()

        it 're-enables fields when the submission ends in a failed response', ->
          fixture('.success-target')
          fixture('.fail-target')
          form = fixture('form[up-target=".success-target"][up-fail-target=".fail-target"]')
          input = e.affix(form, 'input[name=email]')

          renderJob = up.submit(form, { disable: true })

          await wait()

          expect(input).toBeDisabled()

          jasmine.respondWithSelector('.fail-target', status: 500)

          await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

          expect(input).not.toBeDisabled()

        it 'keeps a form disabled when it is first disabled by a validation, then again by a submission that aborts the validation request', asyncSpec (next) ->
          requests = []
          up.on 'up:request:load', ({ request }) -> requests.push(request)

          container = fixture('.container')
          form = e.affix(container, 'form[method="post"][action="/endpoint"][up-target=".container"][up-disable][up-watch-disable]')
          input = e.affix(form, 'input[name=email]')
          up.validate(input)

          next ->
            expect(u.map(requests, 'state')).toEqual ['loading']
            expect(input).toBeDisabled()

            up.submit(form)

          next ->
            expect(u.map(requests, 'state')).toEqual ['aborted', 'loading']
            expect(input).toBeDisabled()

        describe 'loss of focus when disabling a focused input', ->

          it 'focuses the form', asyncSpec (next) ->
            form = fixture('form')
            input = e.affix(form, 'input[name=email]')
            input.focus()

            expect(input).toBeFocused()

            up.submit(form, { disable: true })

            next =>
              unless document.activeElement == input
                expect(form).toBeFocused()

          it 'focuses the closest form group', asyncSpec (next) ->
            form = fixture('form')
            group = e.affix(form, 'fieldset')
            input = e.affix(group, 'input[name=email]')
            input.focus()

            expect(input).toBeFocused()

            up.submit(form, { disable: true })

            next =>
              unless document.activeElement == input
                expect(group).toBeFocused()

      describe 'content type', ->

        it 'defaults to application/x-www-form-urlencoded in a form without file inputs', asyncSpec (next) ->
          form = fixture('form[action="/path"][method=post]')

          up.submit(form)

          next =>
            expect(@lastRequest().requestHeaders['Content-Type']).toEqual('application/x-www-form-urlencoded')

        it 'defaults to multipart/form-data in a form with file inputs', asyncSpec (next) ->
          form = fixture('form[action="/path"][method=post]')

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

      describe 'submission', ->

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
          submitPromise = up.submit(@$form)

          await wait()

          jasmine.respondWith
            status: 500
            contentType: 'text/html'
            responseText:
              """
              <div class='before'>
                new-before
              </div>

              <form action='/form-target'>
                error-messages
              </form>

              <div class='after'>
                new-after
              </div>
              """

          await expectAsync(submitPromise).toBeRejected()

          expect(up.history.location).toMatchURL(jasmine.locationBeforeExample)
          expect('.response').toHaveText('old-text')
          expect('form').toHaveText('error-messages')
          # See that containers outside the form have not changed
          expect('.before').not.toHaveText('old-before')
          expect('.after').not.toHaveText('old-after')


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
          form = fixture('form#form[up-source="/form-source"]')

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

          it 'keeps the current browser location if the request failed', ->
            renderJob = up.submit(@$form, location: '/given-path', failTarget: '.response')

            await wait()

            jasmine.respondWith('<div class="response">new-text</div>', status: 500)

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(up.history.location).toMatchURL(jasmine.locationBeforeExample)

        describe 'with { history: false } option', ->

          it 'keeps the current browser location', asyncSpec (next) ->
            up.submit(@$form, history: false)
            next => @respondWith('<div class="response">new-text</div>')
            next =>expect(up.history.location).toMatchURL(jasmine.locationBeforeExample)

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

          it 'allows to refer to the origin as ":origin" in the selector', asyncSpec (next) ->
            $form = $fixture('form#foo-form[action="/action"][up-target="#foo-form"]')

            revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())

            up.submit($form, scroll: ':origin .form-child')

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

          it 'reveals the given selector for a failed submission', ->
            $form = $fixture('form#foo-form[action="/action"][up-target=".target"]')
            $target = $fixture('.target')
            $other = $fixture('.other')

            revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())

            renderJob = up.submit($form, reveal: '.other', failScroll: '.error')

            await wait()

            jasmine.respondWith
              status: 500,
              responseText: """
                <form id="foo-form">
                  <div class="error">Errors here</div>
                </form>
                """

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(revealStub).toHaveBeenCalled()
            expect(revealStub.calls.mostRecent().args[0]).toMatchSelector('.error')

          it 'allows to refer to the origin as ":origin" in the selector', ->
            $form = $fixture('form#foo-form[action="/action"][up-target=".target"]')
            $target = $fixture('.target')

            revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())

            renderJob = up.submit($form, failScroll: ':origin .form-child')

            await wait()

            jasmine.respondWith
              status: 500
              responseText: """
                <div class="target">
                  new text
                </div>

                <form id="foo-form">
                  <div class="form-child">other</div>
                </form>
                """

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(revealStub).toHaveBeenCalled()
            expect(revealStub.calls.mostRecent().args[0]).toEqual(e.get('#foo-form .form-child'))

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

      it 'parses the form method from a [data-method] attribute so we can replace the Rails UJS adapter with Unpoly', ->
        form = fixture('form[action="/path"][data-method="patch"]')
        options = up.form.submitOptions(form)
        expect(options.method).toEqual('PATCH')

      it 'assumes the default method GET', ->
        form = fixture('form[action="/path"]')
        options = up.form.submitOptions(form)
        expect(options.method).toEqual('GET')

      it "parses the form's [up-disable] attribute", ->
        formWithDisable = fixture('form.with-disable[up-disable=true]')
        formWithoutDisable = fixture('form.without-disable[up-disable=false]')
        expect(up.form.submitOptions(formWithDisable).disable).toBe(true)
        expect(up.form.submitOptions(formWithoutDisable).disable).toBe(false)

    describe 'up.form.group()', ->

      it 'returns the closest form group around the given element', ->
        form = fixture('form')
        group = e.affix(form, '[up-form-group]')
        input = e.affix(group, 'input[name=email]')

        expect(up.form.group(input)).toBe(group)

    describe 'up.validate()', ->

      it 'emits an up:form:validate event with information about the validation pass', asyncSpec (next) ->
        form = fixture('form[action=/path]')
        input = e.affix(form, 'input[name=foo][value=foo-value]')
        submitListener = jasmine.createSpy('up:form:submit listener')
        validateListener = jasmine.createSpy('up:form:validate listener')
        up.on('up:form:submit', submitListener)
        up.on('up:form:validate', validateListener)

        up.validate(input)

        next ->
          expect(submitListener).not.toHaveBeenCalled()
          expect(validateListener).toHaveBeenCalled()
          validateEvent = validateListener.calls.argsFor(0)[0]
          expect(validateEvent).toBeEvent('up:form:validate')
          expect(validateEvent.fields).toEqual([input])
          expect(validateEvent.params).toMatchParams(foo: 'foo-value')

      it 'lets up:form:validate listeners mutate params before submission', asyncSpec (next) ->
        form = fixture('form[action="/form-target"][method="put"][up-target=".response"]')
        input = e.affix(form, 'input[name="foo"][value="one"]')

        listener = (event) ->
          expect(event.params.get('foo')).toBe("one")
          event.params.set('foo', 'two')

        up.on('up:form:validate', listener)

        up.validate(input)

        next ->
          expect(jasmine.lastRequest().data()['foo']).toEqual ['two']

      it 'allows to override the { data } for the new element', asyncSpec (next) ->
        form = fixture('form[action="/path"]')
        e.affix(form, '.element', 'up-data': JSON.stringify(key: 'one'), text: 'old text')

        expect(up.data('.element')).toEqual(key: 'one')

        up.validate('.element', data: { key: 'two' })

        next ->
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')

          jasmine.respondWithSelector('.element', text: 'new text')

        next ->
          expect('.element').toHaveText('new text')
          expect(up.data('.element')).toEqual({ key: 'two' })

      it 'allows to transfer data with { keepData }', asyncSpec (next) ->
        form = fixture('form[action="/path"]')
        e.affix(form, '.element', 'up-data': JSON.stringify(key: 'one'), text: 'old text')

        expect(up.data('.element')).toEqual(key: 'one')

        up.validate('.element', keepData: true)

        next ->
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')

          jasmine.respondWithSelector('.element', text: 'new text')

        next ->
          expect('.element').toHaveText('new text')
          expect(up.data('.element')).toEqual({ key: 'one' })

      describe 'with a CSS selector matching a non-field element', ->

        it 'validates the element', asyncSpec (next) ->
          form = fixture('form[action=/form]')
          element = e.affix(form, '.element')
          field = e.affix(form, 'input[name=email]')

          up.validate('.element')

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual(':unknown')

        it 'allows to provide an origin field for X-Up-Validate with { origin } option', asyncSpec (next) ->
          form = fixture('form[action=/form]')
          element = e.affix(form, '.element')
          field = e.affix(form, 'input[name=email]')

          up.validate('.element', origin: field)

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')

        it 'lists all contained fields in the X-Up-Validate header', asyncSpec (next) ->
          form = fixture('form[action=/form]')
          element = e.affix(form, '.credentials')
          e.affix(element, 'input[name=email]')
          e.affix(element, 'input[name=password]')
          e.affix(form, 'input[name=company]')

          up.validate('.credentials')

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.credentials')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email password')

      describe 'with a CSS selector matching a field', ->

        it 'validates the closest form group', asyncSpec (next) ->
          form = fixture('form[action=/form]')
          group = e.affix(form, '[up-form-group]')
          field = e.affix(group, 'input[name=email]')

          up.validate('input[name=email]')

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('[up-form-group]:has(input[name="email"])')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')

        it 'updates a different target with { target } option', asyncSpec (next) ->
          form = fixture('form[action=/form]')
          group = e.affix(form, '[up-form-group]')
          field = e.affix(group, 'input[name=email]')
          otherTarget = e.affix(form, '.other-target')

          up.validate('input[name=email]', { target: '.other-target' })

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.other-target')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')

        it 'does not seek a form group with { formGroup: false }', asyncSpec (next) ->
          form = fixture('form[action=/form]')
          group = e.affix(form, '[up-form-group]')
          field = e.affix(group, 'input[name="email"]')

          up.validate('input[name="email"]', { formGroup: false })

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('input[name="email"]')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')


      describe 'with a CSS selector matching no element', ->

        it 'does not crash a pending validation batch', asyncSpec (next) ->
          form = fixture('form[action=/form]')
          target = e.affix(form, '.match')

          up.validate('.match')
          validateNoMatch = -> up.validate('.no-match')

          expect(validateNoMatch).toThrowError()

          next ->
            # See that the validation of .match is still sent
            expect(jasmine.Ajax.requests.count()).toBe(1)

      describe 'with a non-field element', ->

        it 'validates a target derived from the element', asyncSpec (next) ->
          form = fixture('form[action=/form]')
          element = e.affix(form, '.element')
          field = e.affix(form, 'input[name=email]')

          up.validate(element)

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual(':unknown')

        it 'allows to provide an origin field for X-Up-Validate with { origin } option', asyncSpec (next) ->
          form = fixture('form[action=/form]')
          element = e.affix(form, '.element')
          field = e.affix(form, 'input[name=email]')

          up.validate(element, origin: field)

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')

        it 'names all contained field in X-Up-Validate header', ->
          form = fixture('form[action=/path]')
          container = e.affix(form, '.container')
          input1 = e.affix(container, 'input[name=foo]')
          input2 = e.affix(container, 'input[name=bar]')
          input3 = e.affix(form, 'input[name=baz]')

          up.validate(container)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('foo bar')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.container')

        it 'sends `X-Up-Validate: :unknown` if the names of all contained fields are too long for an HTTP header', ->
          form = fixture('form[action=/path]')
          container = e.affix(form, '.container')
          input1 = e.affix(container, "input[name=#{'a'.repeat(5000)}]")
          input2 = e.affix(container, "input[name=#{'b'.repeat(5000)}]")

          up.validate(container)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual(':unknown')

        it 'may be called with an entire form (bugfix)', asyncSpec (next) ->
          form = fixture('form[action=/path] input[name=foo]')
          validateListener = jasmine.createSpy('up:form:validate listener')
          up.on('up:form:validate', validateListener)

          up.validate(form)

          next ->
            expect(validateListener).toHaveBeenCalled()

        it 'does not seek a form group', asyncSpec (next) ->
          form = fixture('form[action=/form]')
          group = e.affix(form, '[up-form-group]')
          element = e.affix(group, '.element')

          up.validate(element)

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual(':unknown')

      describe 'with a field element', ->

        it 'validates the closest form group', asyncSpec (next) ->
          form = fixture('form[action=/form]')
          group = e.affix(form, '[up-form-group]')
          field = e.affix(group, 'input[name=email]')

          up.validate(field)

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('[up-form-group]:has(input[name="email"])')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')

        it 'does not seek a form group with { formGroup: false }', asyncSpec (next) ->
          form = fixture('form[action=/form]')
          group = e.affix(form, '[up-form-group]')
          field = e.affix(group, 'input[name=email]')

          up.validate(field, { formGroup: false })

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('input[name="email"]')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')

        it 'updates a different target with { target } option', asyncSpec (next) ->
          form = fixture('form[action=/form]')
          group = e.affix(form, '[up-form-group]')
          field = e.affix(group, 'input[name=email]')
          otherTarget = e.affix(form, '.other-target')

          up.validate(field, { target: '.other-target' })

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.other-target')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')

        it "updates a different target found in the element's [up-validate] attribute", asyncSpec (next) ->
          form = fixture('form[action=/form]')
          group = e.affix(form, '[up-form-group]')
          field = e.affix(group, 'input[name=email][up-validate=".other-target"]')
          otherTarget = e.affix(form, '.other-target')

          up.validate(field)

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.other-target')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')

        it 'update this form with [up-validate=form] (bugfix)', asyncSpec (next) ->
          form1 = fixture('form.form')
          form2 = fixture('form.form')
          form3 = fixture('form.form')

          form2Field = e.affix(form2, 'input[name=email][up-validate="form"]')

          up.validate(form2Field)

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('form')

            jasmine.respondWithSelector('form.form', text: 'new text')

          next ->
            [form1, form2, form3] = document.querySelectorAll('form.form')
            expect(form1).toHaveText('')
            expect(form2).toHaveText('new text')
            expect(form3).toHaveText('')

        it 'does not crash a pending validation batch if the [up-validate] attribute value matches no element', asyncSpec (next) ->
          form = fixture('form[action=/form]')
          e.affix(form, '.match')
          field = e.affix(form, 'input[name=email][up-validate=".no-match"]')

          up.validate('.match')
          validateNoMatch = -> up.validate(field)

          expect(validateNoMatch).toThrowError(/does not match an element/)

          next ->
            # See that the validation of .match is still sent
            expect(jasmine.Ajax.requests.count()).toBe(1)

      describe 'with an array of multiple elements', ->

        it 'throws an error as this signature is not supported', ->
          form = fixture('form[action=/form]')
          field1 = e.affix(form, 'input[name=email]')
          field2 = e.affix(form, 'input[name=password]')

          validate = -> up.validate([field1, field2])

          expect(validate).toThrowError()

      describe 'return value', ->

        it 'returns a Promise that fulfills when the server responds to validation with an 200 OK status code', asyncSpec (next) ->
          form = fixture('form[action=/form]')
          element = e.affix(form, '.element', text: 'old text')

          promise = up.validate(element)

          next ->
            expect('.element').toHaveText('old text')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')

            next.await promiseState(promise)

          next ({ state }) ->
            expect(state).toBe('pending')

          next ->
            jasmine.respondWithSelector('.element', text: 'new text')

          next ->
            expect('.element').toHaveText('new text')

            next.await promiseState(promise)

          next ({ state, value }) ->
            expect(state).toBe('fulfilled')
            expect(value).toEqual(jasmine.any(up.RenderResult))


        it 'returns a Promise that rejects with an up.RenderResult when the server responds to validation with an error code', ->
          form = fixture('form[action=/form]')
          element = e.affix(form, '.element', text: 'old text')

          promise = up.validate(element)

          await wait()

          expect('.element').toHaveText('old text')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')

          await expectAsync(promise).toBePending()

          jasmine.respondWithSelector('.element', text: 'new text', status: 400)

          await wait()

          expect('.element').toHaveText('new text')

          await expectAsync(promise).toBeRejectedWith(jasmine.any(up.RenderResult))

      describe 'request sequence', ->

        it 'only sends a single concurrent request and queues new validations while a validation request is in flight', asyncSpec (next) ->
          form = fixture('form[up-watch-disable]')
          group1 = e.affix(form, '[up-form-group]')
          input1 = e.affix(group1, 'input[name=email]')
          group2 = e.affix(form, '[up-form-group]')
          input2 = e.affix(group2, 'input[name=password]')

          up.validate(input1)

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="email"])')

            up.validate(input2)

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(1)

            jasmine.respondWithSelector('[up-form-group] input[name="email"]')

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(2)

            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="password"])')

      describe 'disabling', ->

        it "executes the form's [up-watch-disable] option while a validation request is in flight", asyncSpec (next) ->
          form = fixture('form[up-watch-disable]')
          group = e.affix(form, '[up-form-group]')
          input = e.affix(group, 'input[name=email]')

          up.validate(input)

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="email"])')
            expect(input).toBeDisabled()

            jasmine.respondWithSelector('[up-form-group] input[name="email"]')

          next ->
            expect(input).not.toBeDisabled()

        it "executes the fields's [up-watch-disable] option while a validation request is in flight", asyncSpec (next) ->
          form = fixture('form')
          group = e.affix(form, '[up-form-group]')
          input = e.affix(group, 'input[name=email][up-watch-disable]')

          up.validate(input)

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="email"])')
            expect(input).toBeDisabled()

            jasmine.respondWithSelector('[up-form-group] input[name="email"]')

          next ->
            expect(input).not.toBeDisabled()

        it "overrides the [up-watch-disable] option from form and field if an { disable } option is also passed", asyncSpec (next) ->
          form = fixture('form[up-watch-disable]')
          group = e.affix(form, '[up-form-group]')
          input = e.affix(group, 'input[name=email][up-watch-disable]')

          up.validate(input, { disable: false })

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="email"])')
            expect(input).not.toBeDisabled()


      describe 'feedback', ->

        it "executes the form's [up-watch-feedback] option while a validation request is in flight", asyncSpec (next) ->
          form = fixture('form[up-watch-feedback]')
          group = e.affix(form, '[up-form-group]')
          input = e.affix(group, 'input[name=email]')

          up.validate(input)

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="email"])')
            expect(group).toHaveClass('up-loading')

            jasmine.respondWithSelector('[up-form-group] input[name="email"]')

          next ->
            expect(group).not.toHaveClass('up-loading')

        it "executes the fields's [up-watch-feedback] option while a validation request is in flight", asyncSpec (next) ->
          form = fixture('form')
          group = e.affix(form, '[up-form-group]')
          input = e.affix(group, 'input[name=email][up-watch-feedback]')

          up.validate(input)

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="email"])')
            expect(group).toHaveClass('up-loading')

            jasmine.respondWithSelector('[up-form-group] input[name="email"]')

          next ->
            expect(group).not.toHaveClass('up-loading')

        it "overrides the [up-watch-feedback] option from form and field if an { disable } option is also passed", asyncSpec (next) ->
          form = fixture('form[up-watch-feedback]')
          group = e.affix(form, '[up-form-group]')
          input = e.affix(group, 'input[name=email][up-watch-feedback]')

          up.validate(input, { feedback: false })

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="email"])')
            expect(group).not.toHaveClass('up-loading')


      describe 'batching', ->

        it 'batches multiple up.validate() calls into a single request', asyncSpec (next) ->
          form = fixture('form[action=/path]')
          fooGroup = e.affix(form, '[up-form-group]')
          fooField = e.affix(fooGroup, 'input[name=foo]')
          barGroup = e.affix(form, '[up-form-group]')
          barField = e.affix(barGroup, 'input[name=bar]')
          bazGroup = e.affix(form, '[up-form-group]')
          bazField = e.affix(bazGroup, 'input[name=baz]')

          up.validate(fooField)
          up.validate(bazField)
          up.validate(fooField)

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('foo baz')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('[up-form-group]:has(input[name="foo"]), [up-form-group]:has(input[name="baz"])')

        it 'picks up changed field values between multiple up.validate() calls (bugfix)', asyncSpec (next) ->
          form = fixture('form[action=/path][method=post]')
          fooGroup = e.affix(form, '[up-form-group]')
          fooField = e.affix(fooGroup, 'input[name=foo]')
          barGroup = e.affix(form, '[up-form-group]')
          barField = e.affix(barGroup, 'input[name=bar]')

          fooField.value = 'one'
          up.validate(fooField)

          barField.value = 'two'
          up.validate(barField)

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('foo bar')
            expect(jasmine.lastRequest().data()).toMatchParams({ foo: 'one', bar: 'two' })

        it 'honors the { disable } option of each batched validation', asyncSpec (next) ->
          form = fixture('form[action=/path][up-watch-disable=":origin"]')
          fooField = e.affix(form, 'input[name=foo]')
          barField = e.affix(form, 'input[name=bar]')
          bazField = e.affix(form, 'input[name=baz]')

          up.validate(fooField)
          up.validate(bazField)

          next ->
            expect(fooField).toBeDisabled()
            expect(barField).not.toBeDisabled()
            expect(bazField).toBeDisabled()

            jasmine.respondWith """
              <form action="/path">
                <input name='foo'>
                <input name='bar'>
                <input name='baz'>
              </form>
            """

          next ->
            expect(fooField).not.toBeDisabled()
            expect(barField).not.toBeDisabled()
            expect(bazField).not.toBeDisabled()

        it 'honors the { focus } option of the last batched validation with a { focus } option', asyncSpec (next) ->
          form = fixture('form[action=/path]')
          fooField = e.affix(form, 'input[name=foo]')
          barField = e.affix(form, 'input[name=bar]')
          bazField = e.affix(form, 'input[name=baz]')
          validateTarget = e.affix(form, '.validate-target', text: 'old content')
          fooFocus = e.affix(form, '.foo-focus')
          barFocus = e.affix(form, '.bar-focus')

          up.hello(form)

          up.validate(fooField, { target: '.validate-target', focus: '.foo-focus' })
          up.validate(barField, { target: '.validate-target', focus: '.bar-focus' })
          up.validate(bazField, { target: '.validate-target' })

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.validate-target')

            jasmine.respondWithSelector('.validate-target', text: 'new content')

          next ->
            expect('.validate-target').toHaveText('new content')
            expect('.bar-focus').toBeFocused()

        it 'merges the { params } option of all batched validations', asyncSpec (next) ->
          form = fixture('form[action=/path][method=post]')
          fooField = e.affix(form, 'input[name=foo][value="foo-value"]')
          barField = e.affix(form, 'input[name=bar][value="bar-value"]')

          up.validate(fooField, params: { baz: 'baz-value' }, formGroup: false)
          up.validate(barField, params: { bam: 'bam-value' }, formGroup: false)

          next ->
            expect(jasmine.lastRequest().data()).toMatchParams(
              foo: 'foo-value',
              bar: 'bar-value',
              baz: 'baz-value',
              bam: 'bam-value',
            )

        it 'merges the { headers } option of all batched validations', asyncSpec (next) ->
          form = fixture('form[action=/path]')
          fooField = e.affix(form, 'input[name=foo]')
          barField = e.affix(form, 'input[name=bar]')

          up.validate(fooField, headers: { Baz: 'baz-value' }, formGroup: false)
          up.validate(barField, headers: { Bam: 'bam-value' }, formGroup: false)

          next ->
            expect(jasmine.lastRequest().requestHeaders['Baz']).toBe('baz-value')
            expect(jasmine.lastRequest().requestHeaders['Bam']).toBe('bam-value')

        it 'honors the { data } option of each batched validation', asyncSpec (next) ->
          form = fixture('form[action=/path]')
          fooField = e.affix(form, 'input[name=foo]')
          barField = e.affix(form, 'input[name=bar]')

          fooDataSpy = jasmine.createSpy("spy for foo's data")
          barDataSpy = jasmine.createSpy("spy for bar's data")

          up.compiler 'input[name=foo]', (element, data) =>
            fooDataSpy(data)

          up.compiler 'input[name=bar]', (element, data) =>
            barDataSpy(data)

          expect(fooDataSpy.calls.argsFor(0)[0]).toEqual({})
          expect(barDataSpy.calls.argsFor(0)[0]).toEqual({})

          up.validate(fooField, data: { key: 1 }, formGroup: false)
          up.validate(barField, data: { key: 2 }, formGroup: false)

          next ->
            jasmine.respondWith """
              <form action="/path">
                <input name='foo'>
                <input name='bar'>
                <input name='baz'>
              </form>
            """

          next ->
            expect(fooDataSpy.calls.count()).toBe(2)
            expect(fooDataSpy.calls.argsFor(1)[0]).toEqual(key: 1)

            expect(barDataSpy.calls.count()).toBe(2)
            expect(barDataSpy.calls.argsFor(1)[0]).toEqual(key: 2)

        it 'removes destroyed elements from a pending batch', asyncSpec (next) ->
          form = fixture('form[action=/path]')
          fooGroup = e.affix(form, '[up-form-group]')
          fooField = e.affix(fooGroup, 'input[name=foo]')
          barGroup = e.affix(form, '[up-form-group]')
          barField = e.affix(barGroup, 'input[name=bar]')
          bazGroup = e.affix(form, '[up-form-group]')
          bazField = e.affix(bazGroup, 'input[name=baz]')

          up.validate(fooField)
          up.validate(bazField)

          up.destroy(fooGroup)

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('baz')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('[up-form-group]:has(input[name="baz"])')

        it 'removes aborted fragments from a pending batch', asyncSpec (next) ->
          form = fixture('form[action=/path]')
          fooGroup = e.affix(form, '[up-form-group]')
          fooField = e.affix(fooGroup, 'input[name=foo]')
          barGroup = e.affix(form, '[up-form-group]')
          barField = e.affix(barGroup, 'input[name=bar]')
          bazGroup = e.affix(form, '[up-form-group]')
          bazField = e.affix(bazGroup, 'input[name=baz]')

          up.validate(fooField)
          up.validate(bazField)

          up.fragment.abort(fooGroup)

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('baz')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('[up-form-group]:has(input[name="baz"])')

    describe 'up.form.disable()', ->

      it "disables the form's fields", ->
        form = fixture('form')
        textField = e.affix(form, 'input[name=email][type=text]')
        selectField = e.affix(form, 'select')
        expect(textField).not.toBeDisabled()
        expect(selectField).not.toBeDisabled()

        up.form.disable(form)

        expect(textField).toBeDisabled()
        expect(selectField).toBeDisabled()

      it 'disables fields within the given container', ->
        form = fixture('form')
        container1 = e.affix(form, 'div')
        container2 = e.affix(form, 'div')
        fieldInContainer1 = e.affix(container1, 'input[name=email][type=text]')
        fieldInContainer2 = e.affix(container2, 'input[name=password][type=text]')

        up.form.disable(container2)

        expect(fieldInContainer1).not.toBeDisabled()
        expect(fieldInContainer2).toBeDisabled()

      it "disables the form's submit buttons", ->
        form = fixture('form')
        submitInput = e.affix(form, 'input[type=submit]')
        selectButton = e.affix(form, 'button[type=submit]')
        expect(submitInput).not.toBeDisabled()
        expect(selectButton).not.toBeDisabled()

        up.form.disable(form)

        expect(submitInput).toBeDisabled()
        expect(selectButton).toBeDisabled()

      it "sets focus on the form if focus was lost from the disabled element", ->
        form = fixture('form')
        field = e.affix(form, 'input[name=email][type=text]')
        field.focus()
        expect(field).toBeFocused()

        up.form.disable(form)

        unless document.activeElement == field
          expect(form).toBeFocused()

      it "sets focus on the closest form group if focus was lost from the disabled element", ->
        form = fixture('form')
        group = e.affix(form, '[up-form-group]')
        field = e.affix(group, 'input[name=email][type=text]')
        field.focus()
        expect(field).toBeFocused()

        up.form.disable(field)

        unless document.activeElement == field
          expect(group).toBeFocused()

      it "sets focus on the form group closest to the previously focused field when disabling the entire form", ->
        form = fixture('form')
        group = e.affix(form, '[up-form-group]')
        field = e.affix(group, 'input[name=email][type=text]')
        field.focus()
        expect(field).toBeFocused()

        up.form.disable(form)

        unless document.activeElement == field
          expect(group).toBeFocused()

      it "does not change focus if focus wasn't lost", ->
        form = fixture('form')
        fieldOutsideForm = fixture('input[name=email][type=text]')
        fieldOutsideForm.focus()
        expect(fieldOutsideForm).toBeFocused()

        up.form.disable(form)

        expect(fieldOutsideForm).toBeFocused()

      it 'returns a function that re-enables the fields that were disabled', ->
        form = fixture('form')
        field = e.affix(form, 'input[name=email][type=text]')
        expect(field).not.toBeDisabled()

        reenable = up.form.disable(form)

        expect(field).toBeDisabled()

        reenable()

        expect(field).not.toBeDisabled()

      it 'does not enable initially disabled functions when the re-enablement function is called', ->
        form = fixture('form')
        field = e.affix(form, 'input[name=email][type=text][disabled]')
        expect(field).toBeDisabled()

        reenable = up.form.disable(form)

        expect(field).toBeDisabled()

        reenable()

        expect(field).toBeDisabled()

      it 'can be called multiple times on the same field, and keeps the field disabled until all re-enablement functions have been called', ->
        form = fixture('form')
        field1 = e.affix(form, 'input[name=email][type=text]')
        field2 = e.affix(form, 'input[name=password][type=text][disabled]')
        expect(field1).not.toBeDisabled()
        expect(field2).toBeDisabled()

        reenable1 = up.form.disable(form)
        reenable2 = up.form.disable(form)

        expect(field1).toBeDisabled()
        expect(field2).toBeDisabled()

        reenable1()

        expect(field1).toBeDisabled()
        expect(field2).toBeDisabled()

        reenable2()

        expect(field1).not.toBeDisabled()
        expect(field2).toBeDisabled()

      it 'does not restore a disabled state if the field was enabled by other code while it was disabled by us', ->
        form = fixture('form')
        field = e.affix(form, 'input[type=text][disabled]')
        expect(field).toBeDisabled()

        reenable = up.form.disable(form)

        expect(field).toBeDisabled()

        # Other code
        field.disabled = false

        reenable()

        expect(field).not.toBeDisabled()

    describe 'up.form.isSubmittable()', ->

      it 'returns true for a form with [up-submit]', ->
        form = fixture('form[action="/path"][up-submit]')
        expect(up.form.isSubmittable(form)).toBe(true)

      it 'returns true for a form that matches up.form.config.submitSelectors', ->
        up.form.config.submitSelectors.push('form')
        form = fixture('form[action="/path"]')
        expect(up.form.isSubmittable(form)).toBe(true)

      it 'returns true for a form that will be handled by Unpoly', ->
        form = fixture('form[action="/path"][up-submit]')
        expect(up.form.isSubmittable(form)).toBe(true)

      it 'returns false for a form that will be handled by the browser', ->
        form = fixture('form[action="/path"]')
        expect(up.form.isSubmittable(form)).toBe(false)

      it 'returns false for a form that explicitly opted out of being handled by Unpoly with [up-submit=false]', ->
        up.form.config.submitSelectors.push('form')
        form = fixture('form[action="/path"][up-submit=false]')
        expect(up.form.isSubmittable(form)).toBe(false)

      it 'returns false for a form with [up-submit] that also matches up.form.config.noSubmitSelectors', ->
        up.form.config.noSubmitSelectors.push('.foo')
        form = fixture('form.foo[action="/path"][up-submit]')
        expect(up.form.isSubmittable(form)).toBe(false)

      it 'returns false for a form to another host', ->
        link = fixture('form[up-submit][action="https://other-host/path"]')
        expect(up.form.isSubmittable(link)).toBe(false)

      it 'returns true for a form to a fully qualified URL on this host', ->
        link = fixture("form[up-submit][action=//#{location.host}/path]")
        expect(up.form.isSubmittable(link)).toBe(true)

      it 'returns false for a form to this host, but another port', ->
        link = fixture("form[up-submit][action=//#{location.host}:97334/path]")
        expect(up.form.isSubmittable(link)).toBe(false)

  describe 'unobtrusive behavior', ->

    describe 'form[up-submit]', ->

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

      it 'emits an up:form:submit event with information about the form submission', ->
        form = fixture('form[action="/form-target"][method="put"][up-target=".response"]')
        e.affix(form, 'input[name="field1"][value="value1"]')
        e.affix(form, 'input[name="field2"][value="value2"]')
        submitButton = e.affix(form, 'input[type="submit"][name="submit-button"][value="submit-button-value"]')
        up.hello(form)

        submitEvent = null
        form.addEventListener('up:form:submit', (event) => submitEvent = event)

        Trigger.clickSequence(submitButton)

        expect(submitEvent).toBeEvent('up:form:submit')
        expect(submitEvent.params).toEqual(jasmine.any(up.Params))
        expect(submitEvent.params.get('field1')).toEqual('value1')
        expect(submitEvent.params.get('field2')).toEqual('value2')
        expect(submitEvent.submitButton).toBe(submitButton)

      it 'lets up:form:submit listeners mutate params before submission', asyncSpec (next) ->
        form = fixture('form[action="/form-target"][method="put"][up-target=".response"]')
        e.affix(form, 'input[name="foo"][value="one"]')
        submitButton = e.affix(form, 'input[type="submit"]')

        listener = (event) ->
          expect(event.params.get('foo')).toBe("one")
          event.params.set('foo', 'two')

        up.on('up:form:submit', listener)

        Trigger.clickSequence(submitButton)

        next ->
          expect(jasmine.lastRequest().data()['foo']).toEqual ['two']

      it 'allows to refer to the origin as ":origin" in the target selector', asyncSpec (next) ->
        $form = $fixture('form.my-form[action="/form-target"][up-target="form:has(:origin)"]').text('old form text')
        $submitButton = $form.affix('input.submit[type="submit"]')
        up.hello($form)

        Trigger.clickSequence($submitButton)

        next =>
          expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('form:has(.submit)')

          @respondWith """
            <form class="my-form">
              new form text
              <input class="submit" type="submit">
            </form>
          """

        next =>
          expect('.my-form').toHaveText('new form text')

      it 'does not submit the form if a listener has prevented the submit event', asyncSpec (next) ->
        fixture('.response', text: 'old text')
        form = fixture('form[action="/form-target"][method="put"][up-target=".response"]')
        submitButton = e.affix(form, 'input[type="submit"]')
        up.hello(form)

        form.addEventListener('submit', (event) -> event.preventDefault())

        Trigger.clickSequence(submitButton)

        next =>
          expect(jasmine.Ajax.requests.count()).toBe(0)

      it 'does not handle a form with a [target] attribute', asyncSpec (next) ->
        fixture('.response', text: 'old text')
        form = fixture('form[action="/form-target"][method="put"][up-submit][target="_blank"]')
        submitButton = e.affix(form, 'input[type="submit"]')
        up.hello(form)

        Trigger.clickSequence(submitButton)

        next =>
          expect(jasmine.Ajax.requests.count()).toBe(0)
          expect(form).toHaveBeenDefaultSubmitted()

      it 'does not submit the form while a HTML5 validation is violated', asyncSpec (next) ->
        submitSpy = up.submit.mock().and.returnValue(u.unresolvablePromise())

        form = fixture('form[action="/form-target"][up-submit]')
        input = e.affix(form, 'input[type=text][name=title][required]')
        submitButton = e.affix(form, 'input[type="submit"]')

        up.hello(form)

        Trigger.clickSequence(submitButton)

        next ->
          expect(submitSpy).not.toHaveBeenCalled()

          input.value = 'foo'
          Trigger.clickSequence(submitButton)

        next ->
          expect(submitSpy).toHaveBeenCalled()

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
                <form class="test-form" action='/form-target'>
                  validation errors
                </form>
              """

          next =>
            expect('.response').toHaveText('old text')
            expect('form.test-form').toHaveText('validation errors')

            # Since there isn't anyone who could handle the rejection inside
            # the event handler, our handler mutes the rejection.
            # Jasmine will fail if there are unhandled promise rejections

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

        it 'allows to refer to the origin as ":origin" in the [up-fail-target] selector', asyncSpec (next) ->
          $form = $fixture('form.my-form[action="/form-target"][up-target=".target"][up-fail-target="form:has(:origin)"]').text('old form text')
          $target = $fixture('.target').text('old target text')

          $submitButton = $form.affix('input.submit[type="submit"]')
          up.hello($form)

          Trigger.clickSequence($submitButton)

          next =>
            expect(@lastRequest().requestHeaders['X-Up-Fail-Target']).toEqual('form:has(.submit)')

            @respondWith
              status: 500,
              responseText: """
                <form class="my-form">
                  new form text
                  <input class="submit" type="submit">
                </form>
                """

          next =>
            expect('.target').toHaveText('old target text')
            expect('.my-form').toHaveText('new form text')

      describe 'submit buttons', ->

        it 'includes the clicked submit button in the params', asyncSpec (next) ->
          $form = $fixture('form[action="/action"][up-target=".target"][method=post]')
          $textField = $form.affix('input[type="text"][name="text-field"][value="text-field-value"]')
          $submitButton = $form.affix('input[type="submit"][name="submit-button"][value="submit-button-value"]')
          up.hello($form)
          Trigger.clickSequence($submitButton)

          next =>
            params = @lastRequest().data()
            expect(params['text-field']).toEqual(['text-field-value'])
            expect(params['submit-button']).toEqual(['submit-button-value'])

        it 'includes the clicked submit button in the params if the button is outside the form', asyncSpec (next) ->
          $form = $fixture('form#my-form[action="/action"][up-target=".target"][method=post]')
          $textField = $form.affix('input[type="text"][name="text-field"][value="text-field-value"]')
          $submitButton = $fixture('input[type="submit"][name="submit-button"][value="submit-button-value"][form="my-form"]')
          up.hello($form)
          Trigger.clickSequence($submitButton)

          next =>
            params = @lastRequest().data()
            expect(params['text-field']).toEqual(['text-field-value'])
            expect(params['submit-button']).toEqual(['submit-button-value'])

        it 'excludes an unused submit button in the params', asyncSpec (next) ->
          $form = $fixture('form[action="/action"][up-target=".target"][method=post]')
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
          $form = $fixture('form[action="/action"][up-target=".target"][method=post]')
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
          $form = $fixture('form[action="/action"][up-target=".target"][method=post]')
          $textField = $form.affix('input[type="text"][name="text-field"][value="text-field-value"]')
          up.hello($form)

          Trigger.submit($form) # sorry

          next =>
            params = @lastRequest().data()
            keys = Object.keys(params)
            expect(keys).toEqual(['text-field'])

        it "lets submit buttons override the form's action and method with button[formaction] and button[formmethod] attributes", asyncSpec (next) ->
          $form = $fixture('form[action="/form-path"][method="GET"][up-submit]')
          $submitButton1 = $form.affix('input[type="submit"]')
          $submitButton2 = $form.affix('input[type="submit"][formaction="/button-path"][formmethod="POST"]')
          up.hello($form)
          Trigger.clickSequence($submitButton2)

          next =>
            request = @lastRequest()
            expect(request.url).toMatchURL('/button-path')
            expect(request.method).toBe('POST')

      describe 'origin of submission', ->

        beforeEach ->
          spyOn(up, 'RenderJob').and.callThrough()

        lastOrigin = -> up.RenderJob.calls.mostRecent().args[0].origin

        it 'sets the origin to the clicked submit button', ->
          form = fixture('form[action="/path"][up-submit]')
          submitButton1 = e.affix(form, 'input[type="submit"]')
          submitButton2 = e.affix(form, 'input[type="submit"]')
          up.hello(form)

          Trigger.clickSequence(submitButton2)

          expect(lastOrigin()).toBe(submitButton2)

        describe 'when the form is submitted with the enter key or receives a synthetic submit event', ->

          it 'sets the origin to a focused field within the form', ->
            form = fixture('form[action="/path"][up-submit]')
            input = e.affix(form, 'input[type=text[name=foo]')
            submitButton = e.affix(form, 'input[type="submit"]')
            up.hello(form)

            input.focus()

            Trigger.submit(form)

            expect(lastOrigin()).toBe(input)

          it 'sets the origin to the first submit button if no field is focused', ->
            form = fixture('form[action="/path"][up-submit]')
            input = e.affix(form, 'input[type=text[name=foo]')
            submitButton = e.affix(form, 'input[type="submit"]')
            up.hello(form)

            Trigger.submit(form)

            expect(lastOrigin()).toBe(submitButton)

          it 'does not set the origin to a focused field outside the form', ->
            form = fixture('form[action="/path"][up-submit]')
            inputOutsideForm = fixture('input[type=text[name=foo]')
            submitButton = e.affix(form, 'input[type="submit"]')
            up.hello(form)

            inputOutsideForm.focus()

            Trigger.submit(form)

            expect(lastOrigin()).not.toBe(inputOutsideForm)

        it 'sets the origin to the form if the form has neither submit button nor focused field', ->
          form = fixture('form[action="/path"][up-submit]')
          up.hello(form)

          Trigger.submit(form)

          expect(lastOrigin()).toBe(form)

      describe 'handling of up.form.config.submitSelectors', ->

        it 'submits matching forms even without [up-submit] or [up-target]', asyncSpec (next) ->
          form = fixture('form.form[action="/form-action2"]')
          submitButton = e.affix(form, 'input[type=submit]')
          submitSpy = up.form.submit.mock().and.returnValue(Promise.resolve())

          up.form.config.submitSelectors.push('.form')

          Trigger.click(submitButton)

          next =>
            expect(submitSpy).toHaveBeenCalled()
            expect(form).not.toHaveBeenDefaultSubmitted()

        it 'allows to opt out with [up-submit=false]', asyncSpec (next) ->
          form = fixture('form.form[action="/form-action3"][up-submit="false"]')
          submitButton = e.affix(form, 'input[type=submit]')
          submitSpy = up.form.submit.mock().and.returnValue(Promise.resolve())

          up.form.config.submitSelectors.push('.form')

          Trigger.click(submitButton)

          next =>
            expect(submitSpy).not.toHaveBeenCalled()
            expect(form).toHaveBeenDefaultSubmitted()

    describe 'input[up-autosubmit]', ->

      beforeEach ->
        up.form.config.watchInputDelay = 0

      it 'submits the form when a change is observed in the given form field', asyncSpec (next) ->
        $form = $fixture('form')
        $field = $form.affix('input[up-autosubmit][name="input-name"][value="old-value"]')
        up.hello($field)
        submitSpy = up.form.submit.mock().and.returnValue(Promise.resolve(new up.RenderResult()))
        $field.val('new-value')
        Trigger.change($field)
        next => expect(submitSpy).toHaveBeenCalled()

      it 'submits the form when a change is observed on a container for a radio button group', asyncSpec (next) ->
        form = fixture('form')
        group = e.affix(form, '.group[up-autosubmit][up-delay=0]')
        radio1 = e.affix(group, 'input[type=radio][name=foo][value=1]')
        radio2 = e.affix(group, 'input[type=radio][name=foo][value=2]')
        up.hello(form)
        submitSpy = up.form.submit.mock().and.returnValue(Promise.resolve(new up.RenderResult()))
        Trigger.clickSequence(radio1)
        next =>
          expect(submitSpy.calls.count()).toBe(1)
          Trigger.clickSequence(radio2)
        next.after 100, =>
          expect(submitSpy.calls.count()).toBe(2)
          Trigger.clickSequence(radio1)
        next.after 100, =>
          expect(submitSpy.calls.count()).toBe(3)

      it 'calls up.submit() with render options parsed from the watched element', asyncSpec (next) ->
        submitSpy = up.submit.mock()

        form = fixture('form')
        input = e.affix(form, 'input[name=email][up-autosubmit][up-watch-feedback=false]')
        up.hello(form)

        input.value = "other"
        Trigger.change(input)

        next ->
          expect(submitSpy).toHaveBeenCalledWith(
            input,
            jasmine.objectContaining({ origin: input, feedback: false })
          )

    describe 'form[up-autosubmit]', ->

      it 'submits the form when a change is observed in any of its fields', ->
        up.form.config.watchInputDelay = 0
        form = fixture('form[up-autosubmit][up-target="#target"]')
        target = fixture('#target')
        field = e.affix(form, 'input[name="input-name"][value="old-value"]')
        submitSpy = up.form.submit.mock().and.returnValue(u.unresolvablePromise())
        up.hello(form)

        field.value = 'new-value'
        Trigger.change(field)

        await wait()

        expect(submitSpy).toHaveBeenCalled()

      it 'detects a change in a field that was added dynamically later', ->
        up.form.config.watchInputDelay = 0
        form = fixture('form[up-autosubmit][up-target="#target"]')
        target = fixture('#target')
        field1 = e.affix(form, 'input[name="input1"][value="old-value"]')
        submitSpy = up.form.submit.mock().and.returnValue(u.unresolvablePromise())
        up.hello(form)

        field2 = e.affix(form, 'input[name="input2"][value="old-value"]')
        up.hello(field2)

        field2.value = 'new-value'
        Trigger.change(field2)

        await wait()

        expect(submitSpy).toHaveBeenCalled()

      describe 'with [up-watch-delay] modifier', ->

        it 'debounces the form submission', ->
          target = fixture('#target')
          $form = $fixture('form[up-autosubmit][up-watch-delay="50"][up-target="#target"]')
          $field = $form.affix('input[name="input-name"][value="old-value"]')
          up.hello($form)
          submitSpy = up.form.submit.mock().and.returnValue(u.unresolvablePromise())

          $field.val('new-value-1')
          Trigger.change($field)

          await wait(10)

          $field.val('new-value-2')
          Trigger.change($field)

          await wait(10)

          expect(submitSpy.calls.count()).toBe(0)

          await wait(80)

          expect(submitSpy.calls.count()).toBe(1)

        it 'is does not abort a debounced submission by a dependent field with [up-validate] in the same form (bugfix)', ->
          abortedListener = jasmine.createSpy('up:request:aborted listener')
          up.on('up:request:aborted', abortedListener)

          form = fixture('form[up-autosubmit][up-watch-delay="50"][method="post"][action="/action"][up-target="#form-target"]')
          input1 = e.affix(form, 'input[name="input1"][value="initial-value"][up-validate="#dependent-field"]')
          dependentField = e.affix(form, 'input#dependent-field[name="dependent-field"]')
          fixture('#form-target')
          up.hello(form)

          input1.value = 'changed-value'
          Trigger.change(input1)

          await wait(100)

          expect(jasmine.Ajax.requests.count()).toBe(2)
          expect(abortedListener.calls.count()).toBe(0)

        it "aborts a debounced submission when the form element is aborted", ->
          form = fixture('form[up-autosubmit][up-watch-delay="50"][method="post"][action="/action"][up-target="#form-target"]')
          input1 = e.affix(form, 'input[name="input1"][value="initial-value"]')
          target = fixture('#form-target')
          up.hello(form)

          input1.value = 'changed-value'
          Trigger.change(input1)

          await wait(10)

          expect(jasmine.Ajax.requests.count()).toBe(0)

          up.fragment.abort(form)

          await wait(90)

          expect(jasmine.Ajax.requests.count()).toBe(0)

        it "aborts a debounced submission when the form's explicit target is aborted", ->
          form = fixture('form[up-autosubmit][up-watch-delay="50"][method="post"][action="/action"][up-target="#form-target"]')
          input1 = e.affix(form, 'input[name="input1"][value="initial-value"]')
          target = fixture('#form-target')
          up.hello(form)

          input1.value = 'changed-value'
          Trigger.change(input1)

          await wait(10)

          expect(jasmine.Ajax.requests.count()).toBe(0)

          up.fragment.abort(target)

          await wait(90)

          expect(jasmine.Ajax.requests.count()).toBe(0)

        it "aborts a debounced submission when the form's fallback (main) target is aborted", ->
          form = fixture('form[up-autosubmit][up-watch-delay="50"][method="post"][action="/action"][up-submit]')
          input1 = e.affix(form, 'input[name="input1"][value="initial-value"]')
          target = fixture('#main-target')
          up.fragment.config.mainTargets.unshift('#main-target')
          up.hello(form)

          input1.value = 'changed-value'
          Trigger.change(input1)

          await wait(10)

          expect(jasmine.Ajax.requests.count()).toBe(0)

          up.fragment.abort(target)

          await wait(90)

          expect(jasmine.Ajax.requests.count()).toBe(0)

    describe 'input[up-watch]', ->

      afterEach ->
        window.watchCallbackSpy = undefined

      it 'calls the JavaScript code in the attribute value when a change is observed in the field', asyncSpec (next) ->
        $form = $fixture('form')
        window.watchCallbackSpy = jasmine.createSpy('watch callback')
        $field = $form.affix('input[name="input-name"][value="old-value"][up-watch="window.watchCallbackSpy(this, value, name)"]')
        up.hello($form)
        $field.val('new-value')
        Trigger.change($field)

        next =>
          expect(window.watchCallbackSpy).toHaveBeenCalledWith($field.get(0), 'new-value', 'input-name')

      it 'runs the callback only once for multiple changes in the same task', asyncSpec (next) ->
        $form = $fixture('form')
        window.watchCallbackSpy = jasmine.createSpy('watch callback')
        $field = $form.affix('input[name="input-name"][value="old-value"][up-watch="window.watchCallbackSpy(value, name)"]')
        up.hello($form)
        $field.val('a')
        Trigger.input($field)
        $field.val('ab')
        Trigger.input($field)

        next =>
          expect(window.watchCallbackSpy.calls.count()).toBe(1)

      it 'does not run the callback when the form is submitted immediately after a change, e.g. in a test', asyncSpec (next) ->
        container = fixture('.container[up-main]')
        form = e.affix(container, 'form[action="/path"]')
        window.watchCallbackSpy = jasmine.createSpy('watch callback')
        field = e.affix(form, 'input[name="input-name"][value="old-value"][up-watch="window.watchCallbackSpy(value, name)"]')
        up.hello(form)
        field.value = 'new-value'
        Trigger.change(field)
        up.submit(form)

        next =>
          expect(window.watchCallbackSpy).not.toHaveBeenCalled()

      describe 'with [up-watch-delay] modifier', ->

        it 'debounces the callback', asyncSpec (next) ->
          $form = $fixture('form')
          window.watchCallbackSpy = jasmine.createSpy('watch callback')
          $field = $form.affix('input[name="input-name"][value="old-value"][up-watch="window.watchCallbackSpy()"][up-watch-delay="40"]')
          up.hello($form)
          $field.val('new-value')
          Trigger.change($field)

          next ->
            expect(window.watchCallbackSpy).not.toHaveBeenCalled()

          next.after 80, ->
            expect(window.watchCallbackSpy).toHaveBeenCalled()

        it 'aborts the callback if the form was submitted while waiting', asyncSpec (next) ->
          container = fixture('.container[up-main]')
          form = e.affix(container, 'form[action="/path"]')
          window.watchCallbackSpy = jasmine.createSpy('watch callback')
          field = e.affix(form, 'input[name="input-name"][value="old-value"][up-watch="window.watchCallbackSpy()"][up-watch-delay="40"]')
          up.hello(form)
          field.value = 'new-value'
          Trigger.change(field)

          next ->
            expect(window.watchCallbackSpy).not.toHaveBeenCalled()
            up.form.submit(form)

          next.after 80, ->
            expect(window.watchCallbackSpy).not.toHaveBeenCalled()

    describe 'form[up-watch]', ->

      afterEach ->
        window.watchCallbackSpy = undefined

      it 'runs the JavaScript code in the attribute value when a change is observed in any contained field', asyncSpec (next) ->
        window.watchCallbackSpy = jasmine.createSpy('watch callback')
        form = fixture('form[up-watch="window.watchCallbackSpy(this, value, name)"]')
        field1 = e.affix(form, 'input[name="field1"][value="field1-old-value"]')
        field2 = e.affix(form, 'input[name="field2"][value="field2-old-value"]')
        up.hello(form)
        field1.value = 'field1-new-value'
        Trigger.change(field1)

        next =>
          expect(window.watchCallbackSpy.calls.allArgs()).toEqual [
            [form, 'field1-new-value', 'field1']
          ]

          field2.value = 'field2-new-value'
          Trigger.change(field2)

        next =>
          expect(window.watchCallbackSpy.calls.allArgs()).toEqual [
            [form, 'field1-new-value', 'field1'],
            [form, 'field2-new-value', 'field2']
          ]

      describe 'with [up-watch-event] modifier', ->

        it 'allows to set a different event to watch', asyncSpec (next) ->
          window.watchCallbackSpy = jasmine.createSpy('watch callback')
          form = fixture('form[up-watch="window.watchCallbackSpy(value, name)"][up-watch-event="foo"]')
          field1 = e.affix(form, 'input[name="field1"][value="field1-old-value"]')
          up.hello(form)
          field1.value = 'field1-new-value'
          Trigger.change(field1)

          next ->
            expect(window.watchCallbackSpy).not.toHaveBeenCalled()

            up.emit(field1, 'foo')

          next ->
            expect(window.watchCallbackSpy.calls.allArgs()).toEqual [
              ['field1-new-value', 'field1'],
            ]

        it 'allows to override the custom event at individual inputs', asyncSpec (next) ->
          window.watchCallbackSpy = jasmine.createSpy('watch callback')
          form = fixture('form[up-watch="window.watchCallbackSpy(value, name)"][up-watch-event="foo"]')
          field1 = e.affix(form, 'input[name="field1"][value="field1-old-value"][up-watch-event="bar"]')
          up.hello(form)
          field1.value = 'field1-new-value'
          Trigger.change(field1)
          up.emit(field1, 'foo')

          next ->
            expect(window.watchCallbackSpy).not.toHaveBeenCalled()

            up.emit(field1, 'bar')

          next ->
            expect(window.watchCallbackSpy.calls.allArgs()).toEqual [
              ['field1-new-value', 'field1'],
            ]

    describe 'input[up-validate]', ->

      describe 'when a selector is given', ->

        it "submits the input's form when the input is changed, adding an 'X-Up-Validate' header, and then replaces the selector", asyncSpec (next) ->
          $form = $fixture('form[action="/path/to"][method=post]')
          $group = $("""
            <div class="field-group">
              <input name="user" value="judy" up-validate=".field-group">
            </div>
          """).appendTo($form)
          up.hello($form)

          $input = $group.find('input')
          $input.val('carl')
          Trigger.change($input)

          next =>
            request = @lastRequest()
            expect(request.requestHeaders['X-Up-Validate']).toEqual('user')
            expect(request.data()).toMatchParams({ user: 'carl' })
            expect(request.requestHeaders['X-Up-Target']).toEqual('.field-group')

            @respondWith
              status: 500
              responseText: """
                <div class="field-group has-error">
                  <div class='error'>Username has already been taken</div>
                  <input name="user" value="judy" up-validate=".field-group>
                </div>
              """

          next =>
            $group = $('.field-group')
            expect($group.length).toBe(1)
            expect($group).toHaveClass('has-error')
            expect($group).toHaveText('Username has already been taken')

            # Since there isn't anyone who could handle the rejection inside
            # the event handler, our handler mutes the rejection.
            # Jasmine will fail if there are unhandled promise rejections

        # https://github.com/unpoly/unpoly/issues/336
        # https://github.com/unpoly/unpoly/issues/488
        it "validates a input[type=date] on change instead of blur (although desktop date pickers often emit `change` when any date component changes, this doesn't happen on mobile) ", asyncSpec (next) ->
          $form = $fixture('form[action="/path/to"]')
          $group = $("""
            <div class="field-group">
              <input name="birthday" type="date" up-validate=".field-group">
            </div>
          """).appendTo($form)
          up.hello($form)

          $input = $group.find('input')
          $input.focus()
          $input.val('2017-01-02')
          up.emit($input, 'blur')

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(0)

            up.emit($input, 'change')

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('birthday')

        it 'does not validate a focused input[type=date] when it gets blurred by being destroyed (bugfix)', asyncSpec (next) ->
          form = fixture('form[action="/path"]')
          target = e.affix(form, '.target')
          input = e.affix(form, 'input[type=date][name=birthday][up-validate=".target"]')
          up.hello(form)

          input.focus()

          next ->
            input.value = '2017-12-31'

            # Destroying the input will detach it, which will cause it to lose focus and emit a `blur` event.
            up.destroy(form)

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(0)

            # Jasmine will fail if there are unhandled promise rejections

        it 'does not reveal the updated fragment (bugfix)', asyncSpec (next) ->
          revealSpy = spyOn(up, 'reveal').and.returnValue(Promise.resolve())

          $form = $fixture('form[action="/path/to"]')
          $group = $("""
            <div class="field-group">
              <input name="user" value="judy" up-validate=".field-group">
            </div>
          """).appendTo($form)
          up.hello($form)

          $input = $group.find('input')
          $input.val('carl')
          Trigger.change($input)

          next =>
            @respondWith """
              <div class="field-group has-error">
                <div class='error'>Username has already been taken</div>
                <input name="user" value="judy" up-validate=".field-group:has(:origin)">
              </div>
            """

          next =>
            expect(revealSpy).not.toHaveBeenCalled()

        it 'keeps focus in the updated fragment', asyncSpec (next) ->
          $form = $fixture('form[action="/path/to"]')
          $group = $("""
            <div class="field-group">
              <input name="user" value="judy" up-validate=".field-group:has(:origin)">
            </div>
          """).appendTo($form)
          up.hello($form)

          $input = $('input[name=user]')

          $input.focus()
          expect('input[name=user]').toBeFocused()

          $input.val('carl')
          Trigger.change($input)

          next =>
            @respondWith """
              <div class="field-group has-error">
                <div class='error'>Username has already been taken</div>
                <input name="user" value="judy" up-validate=".field-group:has(:origin)">
              </div>
            """

          next =>
            expect(document).toHaveSelector('.field-group.has-error')
            expect('input[name=user]').toBeFocused()

        it 'does not validate on input event, as the user may still be typing', asyncSpec (next) ->
          $form = $fixture('form[action="/path/to"]')
          $group = $("""
            <div class="field-group">
              <input name="user" value="judy" up-validate=".field-group:has(:origin)">
            </div>
          """).appendTo($form)
          up.hello($form)

          $input = $group.find('input')
          $input.val('carl')
          Trigger.input($input)

          next =>
            expect(jasmine.Ajax.requests.count()).toBe(0)

        it 'allows to update multiple fragments', asyncSpec (next) ->
          form = fixture('form')
          departmentGroup = e.affix(form, 'fieldset.department')
          departmentField = e.affix(departmentGroup, 'input[name=department][up-validate=".position, .employee"]')
          positionGroup = e.affix(form, 'fieldset.position')
          positionField = e.affix(positionGroup, 'input[name=position]')
          employeeGroup = e.affix(form, 'fieldset.employee')
          employeeField = e.affix(employeeGroup, 'input[name=employee]')

          up.hello(form)

          departmentField.value = "engineering"
          Trigger.change(departmentField)

          next ->
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.position, .employee')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('department')

      describe 'when no selector is given', ->

        it 'automatically finds a form group around the input field and only updates that', asyncSpec (next) ->
          container = fixture('.container')
          container.innerHTML = """
            <form action="/users" id="registration">

              <div up-form-group>
                <input type="text" name="email" up-validate />
              </div>

              <div up-form-group>
                <input type="password" name="password" up-validate />
              </div>

            </form>
          """
          up.hello(container)

          $passwordInput = $('#registration input[name=password]')
          $passwordInput.val('secret5555')
          Trigger.change($passwordInput)

          next =>
            request = @lastRequest()
            expect(request.requestHeaders['X-Up-Validate']).toEqual('password')
            expect(request.requestHeaders['X-Up-Target']).toEqual('[up-form-group]:has(input[name="password"])')

            @respondWith """
              <form action="/users" id="registration">

                <div up-form-group>
                  Validation message
                  <input type="text" name="email" up-validate />
                </div>

                <div up-form-group>
                  Validation message
                  <input type="password" name="password" up-validate />
                </div>

              </form>
            """

          next =>
            $labels = $('#registration [up-form-group]')
            expect($labels[0]).not.toHaveText('Validation message')
            expect($labels[1]).toHaveText('Validation message')

      it 'does not send a validation request if the input field is blurred by clicking the submit button (bugfix)', asyncSpec (next) ->
        container = fixture('.container')
        form = e.affix(container, 'form[action="/path"][up-target=".container"]')
        textField = e.affix(form, 'input[type=text][name=input][up-validate]')
        submitButton = e.affix(form, 'input[type=submit]')
        up.hello(form)

        textField.value = "foo"
        Trigger.change(textField)
        Trigger.clickSequence(submitButton)

        next ->
          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toBeMissing()

      it 'does not send a validation request if the input field is blurred by following an [up-instant] link (bugfix)', asyncSpec (next) ->
        container = fixture('.container')
        form = e.affix(container, 'form[up-submit][action="/form-path"]')
        textField = e.affix(form, 'input[type=text][name=input][up-validate]')
        instantLink = e.affix(container, 'a[up-target=".container"][up-instant][href="/link-path"]')
        up.hello(form)

        textField.value = "foo"
        Trigger.change(textField)
        Trigger.clickSequence(instantLink)

        next ->
          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.lastRequest().url).toMatchURL('/link-path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toBeMissing()

      it 'does not send a validation request when we render with { abort } while waiting for the validation delay', asyncSpec (next) ->
        target = fixture('.target')
        form = fixture('form[up-submit][action="/form-path"][up-validate-delay=20]')
        textField = e.affix(form, 'input[type=text][name=input][up-validate]')
        up.hello(form)

        textField.value = "foo"
        Trigger.change(textField)

        up.render('.target', { url: '/render-path', abort: true })

        next.after 80, ->
          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.lastRequest().url).toMatchURL('/render-path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toBeMissing()

      it "does not use form attributes intended for submission results, like [up-scroll] or [up-confirm] (bugfix)", asyncSpec (next) ->
        renderSpy = spyOn(up, 'render').and.returnValue(u.unresolvablePromise())
        form = fixture('form[up-submit][action="/path"]')
        form.setAttribute('up-scroll', 'main')
        form.setAttribute('up-confirm', 'really submit?')
        form.setAttribute('up-focus', 'layer')
        form.setAttribute('up-history', 'true')
        form.setAttribute('up-location', '/thanks')
        form.setAttribute('up-navigate', '/true')
        form.setAttribute('up-transition', 'cross-fade')
        textField = e.affix(form, 'input[type=text][name=input][up-validate]')
        up.hello(form)

        textField.value = 'changed'
        Trigger.change(textField)

        next ->
          expect(renderSpy.calls.count()).toBe(1)
          expect(renderSpy.calls.mostRecent().args[0].scroll).toBeUndefined()
          expect(renderSpy.calls.mostRecent().args[0].confirm).toBeUndefined()
          expect(renderSpy.calls.mostRecent().args[0].history).toBeUndefined()
          expect(renderSpy.calls.mostRecent().args[0].location).toBeUndefined()
          expect(renderSpy.calls.mostRecent().args[0].navigate).toBeUndefined()
          expect(renderSpy.calls.mostRecent().args[0].transition).toBeUndefined()
          expect(renderSpy.calls.mostRecent().args[0].focus).not.toEqual('layer') # forced setting

      describe 'with [up-watch-event]', ->

        it 'starts validation on another event', asyncSpec (next) ->
          form = fixture('form[up-submit][action="/path"]')
          textField = e.affix(form, 'input[type=text][name=email][up-validate][up-watch-event="custom:event"]')
          up.hello(form)

          textField.value = 'changed'
          Trigger.change(textField)

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(0)

            up.emit(textField, 'custom:event')

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(1)

      describe 'with [up-watch-delay]', ->

        it 'delays the validation by the given number of milliseconds', asyncSpec (next) ->
          form = fixture('form[up-submit][action="/path"]')
          textField = e.affix(form, 'input[type=text][name=email][up-validate][up-watch-delay="200"]')
          up.hello(form)

          textField.value = 'changed'
          Trigger.change(textField)

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(0)

          next.after 350, ->
            expect(jasmine.Ajax.requests.count()).toBe(1)

    describe 'form[up-validate]', ->

      # it 'prints an error saying that this form is not yet supported', ->

      it 'performs server-side validation for all fieldsets contained within the form', asyncSpec (next) ->
        container = fixture('.container')
        container.innerHTML = """
          <form action="/users" id="registration" up-validate>

            <div up-form-group>
              <input type="text" name="email">
            </div>

            <div up-form-group>
              <input type="password" name="password">
            </div>

          </form>
        """
        up.hello(container)

        $passwordInput = $('#registration input[name=password]')
        $passwordInput.val('secret5435')
        Trigger.change($passwordInput)

        next =>
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(@lastRequest().requestHeaders['X-Up-Validate']).toEqual('password')
          expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('[up-form-group]:has(input[name="password"])')


          @respondWith """
            <form action="/users" id="registration" up-validate>

              <div up-form-group>
                Validation message
                <input type="text" name="email">
              </div>

              <div up-form-group>
                Validation message
                <input type="password" name="password">
              </div>

            </form>
          """

        next =>
          $labels = $('#registration [up-form-group]')
          expect($labels[0]).not.toHaveText('Validation message')
          expect($labels[1]).toHaveText('Validation message')

      it 'only sends a single request when a radio button group changes', asyncSpec (next) ->
        container = fixture('.container')
        container.innerHTML = """
          <form action="/users" id="registration" up-validate>

            <div up-form-group>
              <input type="radio" name="foo" value="1" checked>
              <input type="radio" name="foo" value="2">
            </div>

          </form>
        """
        up.hello(container)

        $secondOption = $('#registration input[value="2"]')
        $secondOption.prop('checked', true)
        Trigger.change($secondOption)

        next =>
          expect(jasmine.Ajax.requests.count()).toEqual(1)

      it 'uses a target given as [up-validate] attribute value for all validations', asyncSpec (next) ->
        container = fixture('.container')
        container.innerHTML = """
          <form action="/users" id="registration" up-validate='.result'>

            <div up-form-group>
              <input name="email">
            </div>

            <div class="result">
              Validation result will appear here
            </div>

          </form>
        """
        up.hello(container)

        emailInput = container.querySelector('input[name=email]')
        emailInput.value = "foo@bar.com"
        Trigger.change(emailInput)

        next =>
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(@lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')
          expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.result')

      it 'picks up new inputs after the form was compiled', asyncSpec (next) ->
        container = fixture('.container')
        container.innerHTML = """
          <form action="/users" id="registration" up-validate='.result'>

            <fieldset>
              <input type="text" name="email">
            </fieldset>

            <fieldset class="next"></fieldset>

            <div class="result">
              Validation result will appear here
            </div>

          </form>
        """
        up.hello(container)

        next ->
          up.render fragment: """
            <fieldset class="next">
              <input type="password" name="password">
            </fieldset>
          """

        next ->
          passwordField = document.querySelector('[name=password]')
          passwordField.value = "foo"
          Trigger.change(passwordField)

        next ->
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('password')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.result')

    describe '[up-switch]', ->

      it 'only switches a target in the same form', ->
        form1 = fixture('form')
        form1Input = e.affix(form1, 'input[name="foo"][up-switch=".target"]')
        form1Target = e.affix(form1, '.target[up-show-for="active"]')
        up.hello(form1)

        form2 = fixture('form')
        form2Input = e.affix(form2, 'input[name="foo"][up-switch=".target"]')
        form2Target = e.affix(form2, '.target[up-show-for="active"]')
        up.hello(form2)

        expect(form1Target).toBeHidden()
        expect(form2Target).toBeHidden()

        form2Input.value = 'active'
        Trigger.change(form2Input)

        expect(form1Target).toBeHidden()
        expect(form2Target).toBeVisible()

      describe 'on a select', ->

        beforeEach ->
          @$select = $fixture('select[name="select-name"][up-switch=".target"]')
          @$blankOption = @$select.affix('option').text('<Please select something>').val('')
          @$fooOption = @$select.affix('option[value="foo"]').text('Foo')
          @$barOption = @$select.affix('option[value="bar"]').text('Bar')
          @$bazOption = @$select.affix('option[value="baz"]').text('Baz')
          @$phraseOption = @$select.affix('option[value="Some phrase"]').text('Some phrase')

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

        it "shows the target element iff its up-show-for attribute contains the select value encoded as a JSON array", asyncSpec (next) ->
          $target = $fixture('.target')
          $target.attr('up-show-for', '["Some phrase"]')
          up.hello(@$select)

          next =>
            expect($target).toBeHidden()
            @$select.val('Some phrase')
            Trigger.change(@$select)

          next =>
            expect($target).toBeVisible()

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

          switchTargetSpy = up.form.switchTarget.mock().and.callThrough()

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
