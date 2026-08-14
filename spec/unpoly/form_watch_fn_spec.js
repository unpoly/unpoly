const u = up.util
const e = up.element

extendDescribe('up.form', function() {

  extendDescribe('JavaScript functions', function() {

    describe('up.watch()', function() {

      beforeEach(function() { up.form.config.watchInputDelay = 0 })

      // Actually we only need `input`, but we want to notice
      // if another script manually triggers `change` on the element.
      const defaultInputEvents = ['input', 'change']

      describe('with a field element', function() {

        describe('when the form is reset', function() {

          it("runs the callback with the field's default value when the form is reset", async function() {
            const [form, input, reset] = htmlFixtureList(`
              <form id="form">
                <input name="foo" value="default" up-keep>
                <input type="reset">
              </form>
            `)

            const callback = jasmine.createSpy('watch callback')

            up.watch(input, callback)

            input.value = 'changed'
            Trigger.change(input)
            await wait()

            expect(callback.calls.count()).toBe(1)
            expect(callback.calls.argsFor(0)[0]).toBe('changed')

            reset.click()
            await wait()
            await wait(50) // We need to wait 1 task for the reset button to affect field values, then another task for a 0ms debounce delay.

            expect(callback.calls.count()).toBe(2)
            expect(callback.calls.argsFor(1)[0]).toBe('default')
          })

          it('keeps honoring the reset event after an [up-keep] field is transported to new form', async function() {
            const [form, input, reset] = htmlFixtureList(`
              <form id="form">
                <input name="foo" value="default" up-keep>
                <input type="reset">
              </form>
            `)

            const callback = jasmine.createSpy('watch callback')

            up.watch(input, callback)

            input.value = 'changed'
            Trigger.change(input)
            await wait()

            expect(callback.calls.count()).toBe(1)
            expect(callback.calls.argsFor(0)[0]).toBe('changed')

            up.render({ fragment: `
              <form id="form">
                <input name="foo" value="default" up-keep>
                <input type="reset">
              </form>
            ` })

            document.querySelector('input[type=reset]').click()
            await wait()
            await wait(50) // We need to wait 1 task for the reset button to affect field values, then another task for a 0ms debounce delay.

            expect(callback.calls.count()).toBe(2)
            expect(callback.calls.argsFor(1)[0]).toBe('default')
          })

        })

        it('does not unnecessarily track fields for performance reasons', async function() {
          const trackFieldsSpy = up.form.trackFields.mock().and.callThrough()
          const syncSpy = spyOn(up.SelectorTracker.prototype, 'sync').and.callThrough()

          const [form, root, field1, outside, field2] = htmlFixtureList(`
            <form id="form">
              <div id="root">
                <input type="text" name="field1">
              </div>
              <div id="outside">
              </div>
            </form>
          `)

          up.watch(field1, u.noop)

          await wait()

          expect(trackFieldsSpy).not.toHaveBeenCalled()
          expect(syncSpy).not.toHaveBeenCalled()
        })

        u.each(defaultInputEvents, function(eventType) {
          describe(`when the input receives a ${eventType} event`, function() {

            it("runs the callback if the value changed", async function() {
              const form = fixture('form')
              const input = e.affix(form, 'input[name="input-name"][value="old-value"]')
              const callback = jasmine.createSpy('change callback')
              up.watch(input, callback)
              input.value = 'new-value'
              Trigger[eventType](input)
              Trigger[eventType](input)
              await wait()

              expect(callback).toHaveBeenCalledWith('new-value', 'input-name', jasmine.anything())
              expect(callback.calls.count()).toEqual(1)
            })

            it('runs the callback if the field initially has no [value]', async function() {
              const form = fixture('form')
              const input = e.affix(form, 'input[name="input-name"]')
              const callback = jasmine.createSpy('change callback')
              up.watch(input, callback)
              input.value = 'new-value'
              Trigger[eventType](input)
              Trigger[eventType](input)
              await wait()

              expect(callback).toHaveBeenCalledWith('new-value', 'input-name', jasmine.anything())
              expect(callback.calls.count()).toEqual(1)
            })

            it('keeps running callbacks after a field with [up-keep] is transported to a new form', async function() {
              const [oldForm, input] = htmlFixtureList(`
                <form id="form">
                  <input name="name" up-keep>
                </form>
              `)

              up.hello(oldForm)
              await wait()

              const callback = jasmine.createSpy('change callback')
              up.watch(input, callback)

              input.value = 'foo'
              Trigger[eventType](input)
              await wait()

              expect(callback.calls.count()).toBe(1)

              const { fragment: newForm } = await up.render({ fragment: `
                <form id="form">
                  <input name="name" up-keep>
                </form>
              ` })

              expect(input).toBeAttached()
              expect(input.parentElement).toBe(newForm)

              input.value = 'bar'
              Trigger[eventType](input)
              await wait()

              expect(callback.calls.count()).toBe(2)
            })

            it("does not run the callback if the value didn't change", async function() {
              const form = fixture('form')
              const input = e.affix(form, 'input[name="input-name"][value="old-value"]')
              const callback = jasmine.createSpy('change callback')
              up.watch(input, callback)
              Trigger[eventType](input)
              await wait()

              expect(callback).not.toHaveBeenCalled()
            })

            it('forwards render options parsed from the DOM as a callback argument', async function() {
              const callback = jasmine.createSpy('up.watch() callback')

              const form = fixture('form')
              const input = e.affix(form, 'input[name=email][up-watch-disable="#disable"][up-watch-feedback="false"][up-watch-preview="my-preview"][up-watch-placeholder="#placeholder"]')
              up.hello(form)

              up.watch(input, callback)

              input.value = "other"
              Trigger.change(input)

              await wait()
              expect(callback).toHaveBeenCalledWith(
                'other',
                'email',
                jasmine.objectContaining({
                  origin: input,
                  disable: '#disable',
                  feedback: false,
                  preview: 'my-preview',
                  placeholder: '#placeholder',
                })
              )
            })

            describe('with { delay } option', function() {

              it('debounces the callback', async function() {
                const form = fixture('form')
                const input = e.affix(form, 'input[name="input-name"][value="old-value"]')
                const callback = jasmine.createSpy('change callback')
                up.watch(input, { delay: 200 }, callback)
                input.value = 'new-value-1'
                Trigger[eventType](input)

                await wait(100)
                // 100 ms after change 1: We're still waiting for the 200ms delay to expire
                expect(callback.calls.count()).toEqual(0)

                await wait(200)
                // 300 ms after change 1: The 200ms delay has expired
                expect(callback.calls.count()).toEqual(1)
                expect(callback.calls.mostRecent().args[0]).toEqual('new-value-1')
                input.value = 'new-value-2'
                Trigger[eventType](input)

                await wait(80)
                // 80 ms after change 2: We change again, resetting the delay
                expect(callback.calls.count()).toEqual(1)
                input.value = 'new-value-3'
                Trigger[eventType](input)

                await wait(170)
                // 250 ms after change 2, which was superseded by change 3
                // 170 ms after change 3
                expect(callback.calls.count()).toEqual(1)

                await wait(130)
                // 190 ms after change 2, which was superseded by change 3
                // 150 ms after change 3
                expect(callback.calls.count()).toEqual(2)
                expect(callback.calls.mostRecent().args[0]).toEqual('new-value-3')
              })

              it('does not run the callback if the form was destroyed during the delay', async function() {
                const form = fixture('form')
                const input = e.affix(form, 'input[name="input-name"][value="old-value"]')
                const callback = jasmine.createSpy('watcher callback')
                up.watch(input, { delay: 150 }, callback)
                input.value = 'new-value'
                Trigger[eventType](input)

                await wait(50)
                up.destroy(form)

                await wait(150)
                expect(callback).not.toHaveBeenCalled()
              })

              it('does not run the callback if the form was detached by foreign scripts during the delay', async function() {
                const form = fixture('form')
                const input = e.affix(form, 'input[name="input-name"][value="old-value"]')
                const callback = jasmine.createSpy('watcher callback')
                up.watch(input, { delay: 150 }, callback)
                input.value = 'new-value'
                Trigger[eventType](input)

                await wait(50)
                form.remove()

                await wait(150)
                expect(callback).not.toHaveBeenCalled()
              })

              it('does not run the callback if the form was aborted during the delay', async function() {
                const form = fixture('form')
                const input = e.affix(form, 'input[name="input-name"][value="old-value"]')
                const callback = jasmine.createSpy('watcher callback')
                up.watch(input, { delay: 150 }, callback)
                input.value = 'new-value'
                Trigger[eventType](input)

                await wait(50)
                up.fragment.abort(form)

                await wait(150)
                expect(callback).not.toHaveBeenCalled()
              })
            })

            it('delays a callback if a previous async callback is taking long to execute', async function() {
              const form = fixture('form')
              const input = e.affix(form, 'input[name="input-name"][value="old-value"]')
              let callbackCount = 0
              const callback = function() {
                callbackCount += 1
                return up.specUtil.promiseTimer(100)
              }
              up.watch(input, { delay: 1 }, callback)
              input.value = 'new-value-1'
              Trigger[eventType](input)

              await wait(30)

              // Callback has been called and takes 100 ms to complete
              expect(callbackCount).toEqual(1)
              input.value = 'new-value-2'
              Trigger[eventType](input)

              await wait(30)

              // Second callback is triggerd, but waits for first callback to complete
              expect(callbackCount).toEqual(1)

              await wait(90)

              // After 150 ms the first callback should be finished and the queued 2nd callback has executed
              expect(callbackCount).toEqual(2)
            })

            it('does not throw an error if a debounce delay finishes after an async callback finishes (bugfix)', async function() {
              const form = fixture('form')
              const input = e.affix(form, 'input[name="input-name"][value="old-value"]')
              let callbackCount = 0

              const callback = function() {
                callbackCount += 1
                return up.specUtil.promiseTimer(100)
              }

              up.watch(input, { delay: 200 }, callback)
              input.value = 'new-value-1'
              Trigger[eventType](input)

              await wait(250)

              // After 200 ms the callback has been called and takes 100 ms to complete
              expect(callbackCount).toEqual(1)

              // A new callback is scheduled in 200 ms
              input.value = 'new-value-2'
              Trigger[eventType](input)

              // First callback is still running
              await wait(30)
              expect(callbackCount).toEqual(1)

              // First callback has finished, second callback debounce delay is over
              await wait(250)
              expect(callbackCount).toEqual(2)
            })

            it('waits for the full debounce delay if a previous async callback finishes faster than the delay (bugfix)', async function() {
              const form = fixture('form')
              const input = e.affix(form, 'input[name="input-name"][value="old-value"]')
              let callbackCount = 0

              const callback = function() {
                callbackCount += 1
                return up.specUtil.promiseTimer(100)
              }

              up.watch(input, { delay: 100 }, callback)
              input.value = 'new-value-1'
              Trigger[eventType](input)

              await wait(170)

              expect(callbackCount).toEqual(1)

              input.value = 'new-value-2'
              Trigger[eventType](input)

              await wait(50)

              expect(callbackCount).toEqual(1)

              await wait(100)

              expect(callbackCount).toEqual(2)
            })

            it('does not run a callback if the form was aborted while a previous callback was still running', async function() {
              const form = fixture('form')
              const input = e.affix(form, 'input[name="input-name"][value="old-value"]')
              let callbackCount = 0
              const callback = function() {
                callbackCount += 1
                return up.specUtil.promiseTimer(100)
              }
              up.watch(input, { delay: 1 }, callback)
              input.value = 'new-value-1'
              Trigger[eventType](input)

              await wait(30)

              // Callback has been called and takes 100 ms to complete. 30ms have past, 70ms are left.
              expect(callbackCount).toEqual(1)
              input.value = 'new-value-2'
              Trigger[eventType](input)

              await wait(30)

              // Second callback is triggerd, but waits for first callback to complete
              expect(callbackCount).toEqual(1)

              await wait(10)

              // Aborting the form will unqueue the second callback.
              up.fragment.abort(form)

              await wait(80)

              // After 150 ms the first callback should be finished. The 2nd callback has been unqueued because the form was aborted.
              expect(callbackCount).toEqual(1)
            })

            it('does not run a callback if the form was destroyed while a previous callback was still running', async function() {
              const form = fixture('form')
              const input = e.affix(form, 'input[name="input-name"][value="old-value"]')
              let callbackCount = 0
              const callback = function() {
                callbackCount += 1
                return up.specUtil.promiseTimer(100)
              }
              up.watch(input, { delay: 1 }, callback)
              input.value = 'new-value-1'
              Trigger[eventType](input)

              await wait(30)

              // Callback has been called and takes 100 ms to complete
              expect(callbackCount).toEqual(1)
              input.value = 'new-value-2'
              Trigger[eventType](input)

              await wait(30)

              // Second callback is triggerd, but waits for first callback to complete
              expect(callbackCount).toEqual(1)

              await wait(10)

              up.destroy(form)

              await wait(80)

              // After 150 ms the first callback should be finished.
              // The 2nd callback will not run because no field is attached.
              expect(callbackCount).toEqual(1)
            })

            it('only runs the last callback when a previous long-running callback has been delaying multiple callbacks', async function() {
              const form = fixture('form')
              const input = e.affix(form, 'input[name="input-name"][value="old-value"]')

              const callbackArgs = []
              const callback = function(value) {
                callbackArgs.push(value)
                return jasmine.waitTime(100)
              }

              up.watch(input, { delay: 10 }, callback)

              input.value = 'new-value-1'
              Trigger[eventType](input)

              await wait(30)

              // Callback has been called and takes 100 ms to complete
              expect(callbackArgs).toEqual(['new-value-1'])

              input.value = 'new-value-2'
              Trigger[eventType](input)

              await wait(30)

              expect(callbackArgs).toEqual(['new-value-1'])

              input.value = 'new-value-3'
              Trigger[eventType](input)

              await wait(140)

              expect(callbackArgs).toEqual(['new-value-1', 'new-value-3'])
            })

            describe('passing of render options to the callback', function() {

              it("parses [up-watch-] prefixed status options from the form and passes them to the callback", async function() {
                const form = fixture('form[up-watch-disable="#disable"][up-watch-feedback="false"][up-watch-preview="my-preview"][up-watch-placeholder="#placeholder"]')
                const input = e.affix(form, 'input[name=email]')
                const callback = jasmine.createSpy('callback')

                up.watch(input, callback)

                input.value = "other"
                Trigger[eventType](input)

                await wait()

                expect(callback).toHaveBeenCalledWith(
                  'other',
                  'email',
                  jasmine.objectContaining({
                    disable: '#disable',
                    feedback: false,
                    preview: 'my-preview',
                    placeholder: '#placeholder',
                  })
                )
              })

              it("parses [up-watch-] prefixed status options from the field and passes them to the callback, overriding options from the form", async function() {
                const form = fixture('form[up-watch-disable="#disable-from-form"][up-watch-feedback="true"][up-watch-preview="preview-from-form"][up-watch-placeholder="#placeholder-from-form"]')
                const input = e.affix(form, 'input[name=email][up-watch-disable="#disable-from-field"][up-watch-feedback="false"][up-watch-preview="preview-from-field"][up-watch-placeholder="#placeholder-from-field"]')
                const callback = jasmine.createSpy('callback')

                up.watch(input, callback)

                input.value = "other"
                Trigger[eventType](input)

                await wait()

                expect(callback).toHaveBeenCalledWith(
                  'other',
                  'email',
                  jasmine.objectContaining({
                    disable: '#disable-from-field',
                    feedback: false,
                    preview: 'preview-from-field',
                    placeholder: '#placeholder-from-field',
                  })
                )
              })

              it("overrides the [up-watch-disable] option from form and field if an { disable } option is also passed", async function() {
                const form = fixture('form[up-watch-disable="#disable-from-form"]')
                const input = e.affix(form, 'input[name=email][up-watch-disable="#disable-from-field"]')
                const callback = jasmine.createSpy('callback')

                up.watch(input, { disable: '#disable-from-function-call' }, callback)

                input.value = "other"
                Trigger[eventType](input)

                await wait()

                expect(callback).toHaveBeenCalledWith('other', 'email', jasmine.objectContaining({ disable: '#disable-from-function-call' }))
              })
            })

            describe('when the callback throws an error', function() {

              it('emits an error event', async function() {
                const form = fixture('form')
                const input = e.affix(form, 'input[name=email]')

                const callbackError = new Error('error from watch callback')
                const callback = jasmine.createSpy('watch callback').and.throwError(callbackError)

                up.watch(input, callback)

                input.value = 'value2'

                await jasmine.expectGlobalError(callbackError, async function() {
                  Trigger[eventType](input)

                  // Watcher waits for at least 1 task to group multiple updates with the same end value
                  await wait()
                })
              })

              it('keeps watching', async function() {
                const form = fixture('form')
                const input = e.affix(form, 'input[name=email]')

                const callbackError = new Error('error from watch callback')
                const callback = jasmine.createSpy('watch callback').and.throwError(callbackError)

                up.watch(input, callback)

                input.value = 'value2'
                await jasmine.expectGlobalError(callbackError, async function() {
                  Trigger[eventType](input)

                  // Watcher waits for at least 1 task to group multiple updates with the same end value
                  await wait()
                })

                input.value = 'value3'
                await jasmine.expectGlobalError(callbackError, async function() {
                  Trigger[eventType](input)

                  // Watcher waits for at least 1 task to group multiple updates with the same end value
                  await wait()
                })
              })
            })
          })
        })

        describe('with a checkbox', function() {

          it('runs the callback when the checkbox changes its checked state', async function() {
            const $form = $fixture('form')
            const $checkbox = $form.affix('input[name="input-name"][type="checkbox"][value="checkbox-value"]')
            const callback = jasmine.createSpy('change callback')
            up.watch($checkbox, callback)
            expect($checkbox.is(':checked')).toBe(false)
            Trigger.clickSequence($checkbox)

            await wait()

            expect($checkbox.is(':checked')).toBe(true)
            expect(callback.calls.count()).toEqual(1)
            Trigger.clickSequence($checkbox)

            await wait()

            expect($checkbox.is(':checked')).toBe(false)
            expect(callback.calls.count()).toEqual(2)
          })

          it('runs the callback when the checkbox without a [value] changes its checked state', async function() {
            const $form = $fixture('form')
            const $checkbox = $form.affix('input[name="input-name"][type="checkbox"]')
            const callback = jasmine.createSpy('change callback')
            up.watch($checkbox, callback)
            expect($checkbox.is(':checked')).toBe(false)
            Trigger.clickSequence($checkbox)

            await wait()

            expect($checkbox.is(':checked')).toBe(true)
            expect(callback.calls.count()).toEqual(1)
            expect(callback.calls.mostRecent().args[0]).toBe('on')
            Trigger.clickSequence($checkbox)

            await wait()

            expect($checkbox.is(':checked')).toBe(false)
            expect(callback.calls.count()).toEqual(2)
            expect(callback.calls.mostRecent().args[0]).toBeMissing()
          })

          it('runs the callback when the checkbox is toggled by clicking its label', async function() {
            const $form = $fixture('form')
            const $checkbox = $form.affix('input#tick[name="input-name"][type="checkbox"][value="checkbox-value"]')
            const $label = $form.affix('label[for="tick"]').text('tick label')
            const callback = jasmine.createSpy('change callback')
            up.watch($checkbox, callback)
            expect($checkbox.is(':checked')).toBe(false)
            Trigger.clickSequence($label)

            await wait()

            expect($checkbox.is(':checked')).toBe(true)
            expect(callback.calls.count()).toEqual(1)
            Trigger.clickSequence($label)

            await wait()

            expect($checkbox.is(':checked')).toBe(false)
            expect(callback.calls.count()).toEqual(2)
          })

          it("runs the callback for fields with arrays as value", async function() {
            up.form.config.arrayParam = true

            const form = fixture('form')
            const container = e.affix(form, 'div')
            const input1 = e.affix(container, 'input', { type: "checkbox", name: "foo", value: "1" })
            const input2 = e.affix(container, 'input', { type: "checkbox", name: "foo", value: "2" })
            const input3 = e.affix(container, 'input', { name: "bar", value: "" })
            const callback = jasmine.createSpy('change callback')
            up.watch(container, callback)

            input1.checked = true
            Trigger.change(input1)
            await wait()

            expect(callback.calls.count()).toEqual(1)
            expect(callback.calls.mostRecent().args).toEqual([['1'], 'foo', jasmine.anything()])

            input2.checked = true
            Trigger.change(input2)
            await wait()

            expect(callback.calls.count()).toEqual(2)
            expect(callback.calls.mostRecent().args).toEqual([['1', '2'], 'foo', jasmine.anything()])

            input3.value = "test"
            Trigger.change(input3)
            await wait()

            expect(callback.calls.count()).toEqual(3)
            expect(callback.calls.mostRecent().args).toEqual([['test'], 'bar', jasmine.anything()])
          })

          it('runs callbacks for array fields, considering the entire array as the value to compare', async function() {
            const form = fixture('form')
            const container = e.affix(form, 'div')
            const input1 = e.affix(container, 'input', { type: "checkbox", name: "foo[]", value: "1" })
            const input2 = e.affix(container, 'input', { type: "checkbox", name: "foo[]", value: "2" })
            const callback = jasmine.createSpy('change callback')
            up.watch(container, callback)

            input1.checked = true
            Trigger.change(input1)
            await wait()

            expect(callback.calls.count()).toEqual(1)
            expect(callback.calls.mostRecent().args).toEqual([['1'], 'foo[]', jasmine.anything()])

            input2.checked = true
            Trigger.change(input2)
            await wait()

            expect(callback.calls.count()).toEqual(2)
            expect(callback.calls.mostRecent().args).toEqual([['1', '2'], 'foo[]', jasmine.anything()])

            input2.checked = false
            Trigger.change(input2)
            await wait()

            expect(callback.calls.count()).toEqual(3)
            expect(callback.calls.mostRecent().args).toEqual([['1'], 'foo[]', jasmine.anything()])
          })

          it('runs the callback for a checkbox without a form', async function() {
            const $checkbox = $fixture('input[name="input-name"][type="checkbox"][value="checkbox-value"]')
            const callback = jasmine.createSpy('change callback')
            up.watch($checkbox, callback)
            expect($checkbox.is(':checked')).toBe(false)
            Trigger.clickSequence($checkbox)

            await wait()

            expect($checkbox.is(':checked')).toBe(true)
            expect(callback.calls.count()).toEqual(1)
            Trigger.clickSequence($checkbox)

            await wait()

            expect($checkbox.is(':checked')).toBe(false)
            expect(callback.calls.count()).toEqual(2)
          })

        })
      })

      describe('with an element containing a radio button group', function() {

        it('runs the callback when the group changes its selection', async function() {
          const $form = $fixture('form')
          const $group = $form.affix('div')
          const $radio1 = $group.affix('input[type="radio"][name="group"][value="1"]')
          const $radio2 = $group.affix('input[type="radio"][name="group"][value="2"]')
          const callback = jasmine.createSpy('change callback')
          up.watch($group, callback)
          expect($radio1.is(':checked')).toBe(false)

          Trigger.clickSequence($radio1)

          await wait()

          expect($radio1.is(':checked')).toBe(true)
          expect(callback.calls.count()).toEqual(1)
          // Trigger.clickSequence($radio2)
          $radio1[0].checked = false
          $radio2[0].checked = true
          Trigger.change($radio2)

          await wait()

          expect($radio1.is(':checked')).toBe(false)
          expect(callback.calls.count()).toEqual(2)
        })

        it("runs the callbacks when a radio button is selected or deselected by clicking a label in the group", async function() {
          const $form = $fixture('form')
          const $group = $form.affix('div')
          const $radio1 = $group.affix('input#radio1[type="radio"][name="group"][value="1"]')
          const $radio1Label = $group.affix('label[for="radio1"]').text('label 1')
          const $radio2 = $group.affix('input#radio2[type="radio"][name="group"][value="2"]')
          const $radio2Label = $group.affix('label[for="radio2"]').text('label 2')
          const callback = jasmine.createSpy('change callback')
          up.watch($group, callback)
          expect($radio1.is(':checked')).toBe(false)
          Trigger.clickSequence($radio1Label)

          await wait()

          expect($radio1.is(':checked')).toBe(true)
          expect(callback.calls.count()).toEqual(1)
          Trigger.clickSequence($radio2Label)

          await wait()

          expect($radio1.is(':checked')).toBe(false)
          expect(callback.calls.count()).toEqual(2)
        })

        it("takes the group's initial selected value into account", async function() {
          const $form = $fixture('form')
          const $group = $form.affix('div')
          const $radio1 = $group.affix('input[type="radio"][name="group"][value="1"][checked="checked"]')
          const $radio2 = $group.affix('input[type="radio"][name="group"][value="2"]')
          const callback = jasmine.createSpy('change callback')
          up.watch($group, callback)
          expect($radio1.is(':checked')).toBe(true)
          expect($radio2.is(':checked')).toBe(false)
          Trigger.clickSequence($radio1)

          await wait()

          // Since the radio button was already checked, the click doesn't do anything
          expect($radio1.is(':checked')).toBe(true)
          expect($radio2.is(':checked')).toBe(false)
          // Since the radio button was already checked, clicking it again won't trigger the callback
          expect(callback.calls.count()).toEqual(0)
          Trigger.clickSequence($radio2)

          await wait()

          expect($radio1.is(':checked')).toBe(false)
          expect($radio2.is(':checked')).toBe(true)
          expect(callback.calls.count()).toEqual(1)
        })
      })

      describe('with an individual radio button', function() {

        it('throws an error', function() {
          let [form, radioButton] = htmlFixtureList(`
            <form>
              <input name="foo" type="radio">
            </form>  
          `)

          let doWatch = () => up.watch(radioButton, u.noop)
          expect(doWatch).toThrowError(/Use up\.watch\(\) with the container of a radio group/i)
        })

      })

      describe('with a field that has no [name]', function() {

        it('throws an error', function() {
          let [form, namelessInput] = htmlFixtureList(`
            <form>
              <input type="text">
            </form>  
          `)

          let doWatch = () => up.watch(namelessInput, u.noop)
          expect(doWatch).toThrowError(/up\.watch\(\) can only watch fields with a name/i)
        })

      })

      describe('with a form element', function() {
        u.each(defaultInputEvents, function(eventType) {
          describe(`when any of the form's fields receives a ${eventType} event`, function() {

            it("runs the callback if the value changed", async function() {
              const form = fixture('form')
              const input = e.affix(form, 'input[name="input-name"][value="old-value"]')
              const callback = jasmine.createSpy('change callback')
              up.watch(form, callback)
              input.value = 'new-value'
              Trigger[eventType](input)
              Trigger[eventType](input)
              await wait()

              expect(callback).toHaveBeenCalledWith('new-value', 'input-name', jasmine.anything())
              expect(callback.calls.count()).toEqual(1)
            })

            it("does not run the callback if the value didn't change", async function() {
              const form = fixture('form')
              const input = e.affix(form, 'input[name="input-name"][value="old-value"]')
              const callback = jasmine.createSpy('change callback')
              up.watch(form, callback)
              Trigger[eventType](input)
              await wait()

              expect(callback).not.toHaveBeenCalled()
            })

            it('detects a change in a field that was added dynamically later', async function() {
              const callback = jasmine.createSpy('change callback')
              const form = fixture('form')
              const target = fixture('#target')
              const field1 = e.affix(form, 'input[name="input1"][value="old-value"]')
              up.watch(form, callback)
              up.hello(form)

              const field2 = e.affix(form, 'input[name="input2"][value="old-value"]')
              up.hello(field2)

              field2.value = 'new-value'
              Trigger.change(field2)

              await wait()

              expect(callback).toHaveBeenCalled()
            })

            it('detects a change in a field that was added later and that also has a custom [up-watch-event]', async function() {
              const callback = jasmine.createSpy('change callback')
              const form = fixture('form')
              const target = fixture('#target')
              const field1 = e.affix(form, 'input[name="input1"][value="old-value"]')
              up.watch(form, callback)
              up.hello(form)

              const field2 = e.affix(form, 'input[name="input2"][value="old-value"][up-watch-event="custom:event"]')
              up.hello(field2)

              field2.value = 'new-value'
              up.emit(field2, 'custom:event')

              await wait()

              expect(callback).toHaveBeenCalled()
            })
          })

          describe('form-external fields with [form] attribute', function() {

            it('detects a change in a form-external field', async function() {
              const form = fixture('form[id="my-form"]')
              const input = fixture('input[name="input-name"][value="old-value"][form="my-form"]')
              const callback = jasmine.createSpy('change callback')
              up.watch(form, callback)
              input.value = 'new-value'
              Trigger[eventType](input)
              await wait()

              expect(callback).toHaveBeenCalledWith('new-value', 'input-name', jasmine.anything())
              expect(callback.calls.count()).toEqual(1)
            })

            it('detects a change in a form-external field that was added later', async function() {
              const form = fixture('form[id="my-form"]')
              const target = fixture('#target')
              const callback = jasmine.createSpy('change callback')
              up.watch(form, callback)
              await wait()

              up.render({ fragment: `
                <div id="target">
                  <input name="input-name" value="old-value" form="my-form">
                </div>
              ` })
              await wait()

              const input = document.querySelector('[name="input-name"]')
              input.value = 'new-value'
              Trigger[eventType](input)
              await wait()

              expect(callback).toHaveBeenCalledWith('new-value', 'input-name', jasmine.anything())
              expect(callback.calls.count()).toEqual(1)
            })

          })
        })
      })

      describe('with an element containing fields', function() {
        u.each(defaultInputEvents, function(eventType) {

          describe(`when any of the contained fields receives a ${eventType} event`, function() {

            it("runs the callback if the value changed", async function() {
              const form = fixture('form')
              const container = e.affix(form, 'div')
              const input = e.affix(container, 'input[name="input-name"][value="old-value"]')
              const callback = jasmine.createSpy('change callback')
              up.watch(container, callback)

              input.value = 'new-value'
              Trigger[eventType](input)

              await wait()

              expect(callback).toHaveBeenCalledWith('new-value', 'input-name', jasmine.anything())
              expect(callback.calls.count()).toEqual(1)
            })

            it('does not run the callback if a field outside the container changes', async function() {
              const form = fixture('form')
              const container = e.affix(form, 'div')
              const input = e.affix(container, 'input[name="input-name"][value="old-value"]')
              const otherInput = e.affix(form, 'input[name="other"]')
              const callback = jasmine.createSpy('change callback')
              up.watch(container, callback)

              otherInput.value = 'new-value'
              Trigger[eventType](otherInput)

              await wait()

              expect(callback).not.toHaveBeenCalled()
            })

            it('runs the callback when (1) in a render pass and (2) another compiler changes the initial selection', async function() {
              let changedSpy = jasmine.createSpy('changed spy')

              up.compiler('.container', { priority: 100 }, function(container) {
                up.watch(container, (value) => {
                  changedSpy(value)
                })
              })

              up.compiler('.field', { priority: 1 }, function(field) {
                field.value = 'value-from-compiler'
                Trigger[eventType](field)
              })

              fixture('#root')

              let { fragment: root } = await up.render({ fragment: `
                <div id="root">
                  <form>
                    <div class="container">
                      <input name="field" class="field" value="initial-value">
                    </div>
                  </form>
                </div>
              ` })

              const field = root.querySelector('.field')

              // Watch callbacks are debounced by at least 1 task
              await wait(0)

              expect(field.value).toBe('value-from-compiler')
              expect(changedSpy).toHaveBeenCalledWith('value-from-compiler')

              field.value = 'value-from-spec'
              Trigger[eventType](field)
              await wait()

              expect(changedSpy).toHaveBeenCalledWith('value-from-spec')
            })

          })
        })
      })

      describe('with { batch: true } options', function() {
        it('calls the callback once with all collected changes in a diff object', async function() {
          const $form = $fixture('form')
          const $input1 = $form.affix('input[name="input1"][value="input1-a"]')
          const $input2 = $form.affix('input[name="input2"][value="input2-a"]')
          const callback = jasmine.createSpy('change callback')
          up.watch($form, { batch: true }, callback)

          await wait()

          expect(callback.calls.count()).toEqual(0)

          $input1.val('input1-b')
          Trigger.change($input1)
          $input2.val('input2-b')
          Trigger.change($input2)

          await wait()

          expect(callback.calls.count()).toEqual(1)
          expect(callback.calls.mostRecent().args[0]).toEqual({
            'input1': 'input1-b',
            'input2': 'input2-b'
          })

          $input2.val('input2-c')
          Trigger.change($input2)

          await wait()

          expect(callback.calls.count()).toEqual(2)
          expect(callback.calls.mostRecent().args[0]).toEqual({
            'input2': 'input2-c'
          })
        })
      })

      describe('logging', function() {

        function spyOnLog() {
          // It's easier to make expectation on a single line of text, without formatting args
          up.log.config.format = false

          let unstubbedLog = console.log

          let logSpy = jasmine.createSpy('log spy')
          spyOn(console, 'log').and.callFake((...args) => {
            if (args.length && args[0].includes("Interaction on")) logSpy(...args)
            unstubbedLog.apply(console, args)
          })

          return logSpy
        }

        it('logs the event if a change was observed', async function() {
          let logSpy = spyOnLog()

          let [form, input] = htmlFixtureList(`
            <form>
              <input name="foo" value="initial">
            </form>
          `)
          up.hello(form)
          up.watch(input, () => true)
          await wait()

          expect(logSpy).not.toHaveBeenCalled()

          input.value = "changed"
          Trigger.change(input)
          await wait()

          expect(logSpy).toHaveBeenCalledWith(jasmine.stringContaining('[change] Interaction'))
        })

        it("does not log the event if the observed values didn't change", async function() {
          let logSpy = spyOnLog()

          let [form, input] = htmlFixtureList(`
            <form>
              <input name="foo" value="initial">
            </form>
          `)
          up.hello(form)
          up.watch(input, () => true)
          await wait()

          expect(logSpy).not.toHaveBeenCalled()

          input.value = "initial"
          Trigger.change(input)
          await wait()

          expect(logSpy).not.toHaveBeenCalled()
        })

        it('only logs the event once if multiple watchers observe the same event', async function() {
          let logSpy = spyOnLog()

          let [form, input] = htmlFixtureList(`
            <form>
              <input name="foo" value="initial">
            </form>
          `)
          up.hello(form)
          up.watch(input, () => true)
          up.watch(input, () => true)
          await wait()

          expect(logSpy).not.toHaveBeenCalled()

          input.value = "changed"
          Trigger.change(input)
          await wait()

          expect(logSpy.calls.count()).toBe(1)
          expect(logSpy).toHaveBeenCalledWith(jasmine.stringContaining('[change] Interaction'))
        })

      })

    })

  })

})
