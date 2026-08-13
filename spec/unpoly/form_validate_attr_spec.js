const u = up.util
const e = up.element
const $ = jQuery

extendDescribe('up.form', function() {

  extendDescribe('unobtrusive behavior', function() {

    describe('input[up-validate]', function() {

      describe('when a selector is given', function() {

        it("submits the input's form when the input is changed, adding an 'X-Up-Validate' header, and then replaces the selector", async function() {
          const $form = $fixture('form[action="/path/to"][method=post]')
          let $group = $(`
            <div class="field-group">
              <input name="user" value="judy" up-validate=".field-group">
            </div>
          `).appendTo($form)
          up.hello($form)

          const $input = $group.find('input')
          $input.val('carl')
          Trigger.change($input)

          await wait()

          const request = jasmine.lastRequest()
          expect(request.requestHeaders['X-Up-Validate']).toEqual('user')
          expect(request.data()).toMatchParams({ user: 'carl' })
          expect(request.requestHeaders['X-Up-Target']).toEqual('.field-group')

          jasmine.respondWith({
            status: 500,
            responseText: `
              <div class="field-group has-error">
                <div class='error'>Username has already been taken</div>
                <input name="user" value="judy" up-validate=".field-group">
              </div>
            `
          })

          await wait()

          $group = $('.field-group')
          expect($group.length).toBe(1)
          expect($group).toHaveClass('has-error')
          expect($group).toHaveText('Username has already been taken')
        })

        it("validates a input[type=date] on change instead of blur (although desktop date pickers often emit `change` when any date component changes, this doesn't happen on mobile) ", async function() {
          const $form = $fixture('form[action="/path/to"]')
          const $group = $(`
            <div class="field-group">
              <input name="birthday" type="date" up-validate=".field-group">
            </div>
          `).appendTo($form)
          up.hello($form)

          const $input = $group.find('input')
          $input.focus()
          $input.val('2017-01-02')
          up.emit($input, 'blur')

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)

          up.emit($input, 'change')

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('birthday')
        })

        it('does not validate a focused input[type=date] when it gets blurred by being destroyed (bugfix)', async function() {
          const form = fixture('form[action="/path"]')
          const target = e.affix(form, '.target')
          const input = e.affix(form, 'input[type=date][name=birthday][up-validate=".target"]')
          up.hello(form)

          input.focus()

          input.value = '2017-12-31'

          // Destroying the input will detach it, which will cause it to lose focus and emit a `blur` event.
          up.destroy(form)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)
        })

        it('does not reveal the updated fragment (bugfix)', async function() {
          const revealSpy = up.reveal.mock().and.returnValue(Promise.resolve())

          const $form = $fixture('form[action="/path/to"]')
          const $group = $(`
            <div class="field-group">
              <input name="user" value="judy" up-validate=".field-group">
            </div>
          `).appendTo($form)
          up.hello($form)

          const $input = $group.find('input')
          $input.val('carl')
          Trigger.change($input)

          await wait()

          jasmine.respondWith(`
            <div class="field-group has-error">
              <div class='error'>Username has already been taken</div>
              <input name="user" value="judy" up-validate=".field-group:has(:origin)">
            </div>
          `)

          await wait()

          expect(revealSpy).not.toHaveBeenCalled()
        })

        it('keeps focus in the updated fragment', async function() {
          const $form = $fixture('form[action="/path/to"]')
          const $group = $(`
            <div class="field-group">
              <input name="user" value="judy" up-validate=".field-group:has(:origin)">
            </div>
          `).appendTo($form)
          up.hello($form)

          const $input = $('input[name=user]')

          $input.focus()
          expect('input[name=user]').toBeFocused()

          $input.val('carl')
          Trigger.change($input)

          await wait()

          jasmine.respondWith(`
            <div class="field-group has-error">
              <div class='error'>Username has already been taken</div>
              <input name="user" value="judy" up-validate=".field-group:has(:origin)">
            </div>
          `)

          await wait()

          expect(document).toHaveSelector('.field-group.has-error')
          expect('input[name=user]').toBeFocused()
        })

        it('does not validate on input event, as the user may still be typing', async function() {
          const $form = $fixture('form[action="/path/to"]')
          const $group = $(`
            <div class="field-group">
              <input name="user" value="judy" up-validate=".field-group:has(:origin)">
            </div>
          `).appendTo($form)
          up.hello($form)

          const $input = $group.find('input')
          $input.val('carl')
          Trigger.input($input)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)
        })

        it('allows to update multiple fragments', async function() {
          const form = fixture('form')
          const departmentGroup = e.affix(form, 'fieldset.department')
          const departmentField = e.affix(departmentGroup, 'input[name=department][up-validate=".position, .employee"]')
          const positionGroup = e.affix(form, 'fieldset.position')
          const positionField = e.affix(positionGroup, 'input[name=position]')
          const employeeGroup = e.affix(form, 'fieldset.employee')
          const employeeField = e.affix(employeeGroup, 'input[name=employee]')

          up.hello(form)

          departmentField.value = "engineering"
          Trigger.change(departmentField)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.position, .employee')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('department')
        })

        describe('handling of :origin', function() {

          it('allows to refer to the changed field as :origin', async function() {
            const [form, fieldset1, field1, fieldset2, field2, fieldset3, field3, preview] = htmlFixtureList(`
              <form method="post" action="/process">
                <fieldset>
                  <input name="field1" up-validate="fieldset:has(:origin), #preview">
                </fieldset>
                <fieldset>
                  <input name="field2" up-validate="fieldset:has(:origin), #preview">
                </fieldset>
                <fieldset>
                  <input name="field3" up-validate="fieldset:has(:origin), #preview">
                </fieldset>
                <output id="preview">
                </output>
              </form>
            `)

            up.hello(form)

            field2.value = 'changed'
            Trigger.change(field2)
            await wait()

            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('fieldset:has(input[name="field2"]), #preview')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('field2')
          })

          it('allows to refer to the changed field as :origin when multiple validations are batched', async function() {
            const [form, fieldset1, field1, fieldset2, field2, fieldset3, field3, preview] = htmlFixtureList(`
              <form method="post" action="/process">
                <fieldset>
                  <input name="field1" up-validate="fieldset:has(:origin), #preview">
                </fieldset>
                <fieldset>
                  <input name="field2" up-validate="fieldset:has(:origin), #preview">
                </fieldset>
                <fieldset>
                  <input name="field3" up-validate="fieldset:has(:origin), #preview">
                </fieldset>
                <output id="preview">
                </output>
              </form>
            `)

            up.hello(form)

            field2.value = 'changed'
            Trigger.change(field2)

            field3.value = 'changed'
            Trigger.change(field3)
            await wait()

            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('fieldset:has(input[name="field2"]), #preview, fieldset:has(input[name="field3"])')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('field2 field3')

          })

        })

      })

      describe('when no selector is given', function() {
        it('automatically finds a form group enclosing the field and only updates that', async function() {
          const form = htmlFixture(`
            <form action="/users">

              <div up-form-group>
                <input type="text" name="email" up-validate />
              </div>

              <div up-form-group>
                <input type="password" name="password" up-validate />
              </div>

            </form>
          `)
          up.hello(form)

          const passwordInput = form.querySelector('input[name=password]')
          passwordInput.value = 'mumbling-shortcut-glorify'
          Trigger.change(passwordInput)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('password')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('[up-form-group]:has(input[name="password"])')

          jasmine.respondWith(`
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
          `)

          await wait()

          const groups = form.querySelectorAll('[up-form-group]')
          expect(groups[0]).not.toHaveText('Validation message')
          expect(groups[1]).toHaveText('Validation message')
        })

        // https://glitch.com/edit/#!/jet-slow-splash?path=src%2Fpages%2Findex.hbs%3A26%3A0
        it('updates a form with an [up-keep] input multiple times (bugfix)', async function() {
           const form = htmlFixture(`
            <form action="/users" method="post">
              <input type="text" name="email" up-keep up-validate />
            </form>
          `)
          up.hello(form)

          form.querySelector('input[name=email]').value = 'foo'
          Trigger.change('input[name=email]')
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)

          jasmine.respondWith(`
            <form action="/users" method="post">

              <div class="error">Error 1</div>
              <input type="text" name="email" up-keep up-validate />

            </form>
          `)
          await wait()

          expect('.error').toHaveText('Error 1')

          form.querySelector('input[name=email]').value = 'bar'
          Trigger.change('input[name=email]')
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)

          jasmine.respondWith(`
            <form action="/users" method="post">

              <div class="error">Error 2</div>
              <input type="text" name="email" up-keep up-validate />

            </form>
          `)
          await wait()

          expect('.error').toHaveText('Error 2')
        })

      })

      describe('with [up-validate=true]', function() {
        it('validates an enclosing form group', async function() {
          const form = htmlFixture(`
            <form action="/users">

              <div up-form-group>
                <input type="text" name="email" up-validate="true" />
              </div>

            </form>
          `)
          up.hello(form)

          const emailInput = form.querySelector('input[name=email]')
          emailInput.value = 'foo@bar.com'
          Trigger.change(emailInput)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('[up-form-group]:has(input[name="email"])')
        })
      })

      describe('with [up-validate=false]', function() {
        it('does not validate when the field is changed', async function() {
          const form = htmlFixture(`
            <form action="/users">

              <div up-form-group>
                <input type="text" name="email" up-validate="false" />
              </div>

            </form>
          `)
          up.hello(form)

          const emailInput = form.querySelector('input[name=email]')
          emailInput.value = 'foo@bar.com'
          Trigger.change(emailInput)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)
        })
      })

      it('does not send a validation request if the input field is blurred by clicking the submit button (bugfix)', async function() {
        const container = fixture('.container')
        const form = e.affix(container, 'form[method="post"][action="/action"][up-target=".container"]')
        const formGroup = e.affix(form, '[up-form-group]')
        const textField = e.affix(formGroup, 'input[type=text][name=input][up-validate]')
        const submitButton = e.affix(form, 'input[type=submit]')
        up.hello(form)

        textField.value = "foo"
        Trigger.change(textField)
        Trigger.clickSequence(submitButton)

        await wait(10)

        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.lastRequest().url).toMatchURL('/action')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toBeMissing()
      })

      it('does not send a validation request if the input field is blurred by clicking the submit button and the validation would update the entire form (bugfix)', async function() {
        const container = fixture('.container')
        const form = e.affix(container, 'form[method="post"][action="/action"][up-target=".container"]')
        const textField = e.affix(form, 'input[type=text][name=input][up-validate="form"]')
        const submitButton = e.affix(form, 'input[type=submit]')
        up.hello(form)

        textField.value = "foo"
        Trigger.change(textField)
        Trigger.clickSequence(submitButton)

        await wait(10)

        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.lastRequest().url).toMatchURL('/action')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toBeMissing()
      })

      it('does not send a validation request if the input field is blurred by following an [up-instant] link (bugfix)', async function() {
        const container = fixture('.container')
        const form = e.affix(container, 'form[up-submit][action="/form-path"]')
        const textField = e.affix(form, 'input[type=text][name=input][up-validate]')
        const instantLink = e.affix(container, 'a[up-target=".container"][up-instant][href="/link-path"]')
        up.hello(form)

        textField.value = "foo"
        Trigger.change(textField)
        Trigger.clickSequence(instantLink)

        await wait()

        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.lastRequest().url).toMatchURL('/link-path')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toBeMissing()
      })

      it('does not send a validation request when we render with { abort } while waiting for the validation delay', async function() {
        const target = fixture('.target')
        const form = fixture('form[up-submit][action="/form-path"][up-validate-delay=20]')
        const textField = e.affix(form, 'input[type=text][name=input][up-validate]')
        up.hello(form)

        textField.value = "foo"
        Trigger.change(textField)

        up.render('.target', { url: '/render-path', abort: true })

        await wait(80)

        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.lastRequest().url).toMatchURL('/render-path')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toBeMissing()
      })

      it('queues changes while a prior validation is still loading when two elements target the same element (bugfix)', async function() {
        const form = fixture('form[method="post"][action="/endpoint"]')
        const field1 = e.affix(form, 'input[up-validate][name="field1"][value="value1"][up-validate="#preview"]')
        const field2 = e.affix(form, 'input[up-validate][name="field2"][value="value1"][up-validate="#preview"]')
        const preview = e.affix(form, '#preview', { text: 'version 1' })
        up.hello(form)

        field1.value = 'value2'
        Trigger.change(field1)

        await wait(20)

        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#preview')
        expect(jasmine.lastRequest().data()['field1']).toEqual(['value2'])
        expect(jasmine.lastRequest().data()['field2']).toEqual(['value1'])

        // Make another change while the previous request is still loading
        field2.value = 'value2'
        Trigger.change(field2)

        await wait(20)

        // Still waiting for the previous request
        expect(jasmine.Ajax.requests.count()).toBe(1)

        jasmine.respondWithSelector('#preview', { text: 'version 2' })

        await wait()

        expect('#preview').toHaveText('version 2')

        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#preview')
        expect(jasmine.lastRequest().data()['field1']).toEqual(['value2'])
        expect(jasmine.lastRequest().data()['field2']).toEqual(['value2'])

        jasmine.respondWithSelector('#preview', { text: 'version 3' })

        await wait()

        expect('#preview').toHaveText('version 3')
      })

      it("does not use form attributes intended for submission results, like [up-scroll] or [up-confirm] (bugfix)", async function() {
        const renderSpy = spyOn(up, 'render').and.returnValue(u.unresolvablePromise())
        const form = fixture('form[up-submit][action="/path"]')
        form.setAttribute('up-scroll', 'main')
        form.setAttribute('up-confirm', 'really submit?')
        form.setAttribute('up-focus', 'layer')
        form.setAttribute('up-history', 'true')
        form.setAttribute('up-location', '/thanks')
        form.setAttribute('up-navigate', '/true')
        form.setAttribute('up-transition', 'cross-fade')
        const textField = e.affix(form, 'input[type=text][name=input][up-validate]')
        up.hello(form)

        textField.value = 'changed'
        Trigger.change(textField)

        await wait()

        expect(renderSpy.calls.count()).toBe(1)
        expect(renderSpy.calls.mostRecent().args[0].scroll).toBeUndefined()
        expect(renderSpy.calls.mostRecent().args[0].confirm).toBeUndefined()
        expect(renderSpy.calls.mostRecent().args[0].history).toBeUndefined()
        expect(renderSpy.calls.mostRecent().args[0].location).toBeUndefined()
        expect(renderSpy.calls.mostRecent().args[0].navigate).toBeUndefined()
        expect(renderSpy.calls.mostRecent().args[0].transition).toBeUndefined()
        expect(renderSpy.calls.mostRecent().args[0].focus).not.toEqual('layer')
      })

      it('keeps validating the input when it is also [up-keep] and is transported into a new form', async function() {
        const validateListener = jasmine.createSpy('up:form:validate listener')
        up.on('up:form:validate', validateListener)

        const [oldForm, input] = htmlFixtureList(`
          <form id="form">
            <input name="name" up-validate up-keep>
          </form>
        `)

        up.hello(oldForm)
        await wait()

        input.value = 'foo'
        Trigger.change(input)
        await wait()

        expect(validateListener.calls.count()).toBe(1)
        expect(validateListener.calls.argsFor(0)[0].form).toBe(oldForm)
        expect(jasmine.Ajax.requests.count()).toBe(1)

        const { fragment: newForm } = await up.render({ fragment: `
          <form id="form">
            <input name="name" up-validate>
          </form>
        ` })

        expect(input).toBeAttached()
        expect(input.parentElement).toBe(newForm)

        input.value = 'bar'
        Trigger.change(input)
        await wait()

        expect(validateListener.calls.count()).toBe(2)
        expect(validateListener.calls.argsFor(1)[0].form).toBe(newForm)
        expect(jasmine.Ajax.requests.count()).toBe(2)
      })

      it('validates an input that is manually attached to an existing form and is activated with up.hello()', async function() {
        const validateListener = jasmine.createSpy('up:form:validate listener')
        up.on('up:form:validate', validateListener)

        const [form] = htmlFixtureList(`
          <form id="form">
          </form>
        `)

        up.hello(form)
        await wait()

        const input = e.affix(form, 'input[name=name][up-validate]')
        up.hello(input)
        await wait()

        input.value = 'foo'
        Trigger.change(input)
        await wait()

        expect(validateListener.calls.count()).toBe(1)
        expect(validateListener.calls.argsFor(0)[0].form).toBe(form)
        expect(jasmine.Ajax.requests.count()).toBe(1)

      })

      describe('with [up-watch-event]', function() {
        it('starts validation on another event', async function() {
          const form = fixture('form[up-submit][action="/path"]')
          const textField = e.affix(form, 'input[type=text][name=email][up-validate][up-watch-event="custom:event"]')
          up.hello(form)

          textField.value = 'changed'
          Trigger.change(textField)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)

          up.emit(textField, 'custom:event')

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
        })

        it('does not reset cursor positions that were changed while the revalidation request is underway (bugfix)', async function() {
          fixture('#target', { text: 'old target' })
          const form = fixture('form[up-submit][action="/path"]')
          const textField = e.affix(form, 'input[type=text][name=email][up-validate="#target"][up-watch-event="input"]')
          up.hello(form)

          expect('#target').toHaveText('old target')

          textField.focus()
          textField.value = 'abcdefghijklmnopqurstuvwxyz'
          textField.selectionStart = 3
          textField.selectionEnd = 5

          Trigger.input(textField)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)

          expect(textField).toBeFocused()
          expect(textField.selectionStart).toBe(3)
          expect(textField.selectionEnd).toBe(5)

          textField.selectionStart = 8
          textField.selectionEnd = 10
          await wait()

          expect(textField).toBeFocused()
          expect(textField.selectionStart).toBe(8)
          expect(textField.selectionEnd).toBe(10)

          jasmine.respondWithSelector('#target', { text: 'validated target' })
          await wait()

          expect('#target').toHaveText('validated target')

          expect(textField).toBeFocused()
          expect(textField.selectionStart).toBe(8)
          expect(textField.selectionEnd).toBe(10)
        })
      })

      describe('with [up-watch-delay]', function() {

        it('delays the validation by the given number of milliseconds', async function() {
          const form = fixture('form[up-submit][action="/path"]')
          const textField = e.affix(form, 'input[type=text][name=email][up-validate][up-watch-delay="200"]')
          up.hello(form)

          textField.value = 'changed'
          Trigger.change(textField)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)

          await wait(350)

          expect(jasmine.Ajax.requests.count()).toBe(1)
        })

        it('aborts the debounce timer when the form is aborted', async function() {
          const form = fixture('form[up-submit][action="/path"]')
          const textField = e.affix(form, 'input[type=text][name=email][up-validate][up-watch-delay="200"]')
          up.hello(form)

          textField.value = 'changed'
          Trigger.change(textField)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)

          up.fragment.abort(form)

          await wait(350)

          expect(jasmine.Ajax.requests.count()).toBe(0)
        })
      })

      describe('with [up-watch-preview]', function() {

        it('shows a preview')

        it('shows multiple previews')
      })

      describe('validating while typing with [up-keep]', function() {

        it('preserves focus, cursor position and value', async function() {
          const keepSpy = jasmine.createSpy('up:fragment:keep listener')
          up.on('up:fragment:keep', keepSpy)

          const longText =
            "foooooooooooooooooooooooo\n" +
            "baaaaaaaaaaaaaaaaaaaaaaar\n" +
            "baaaaaaaaaaaaaaaaaaaaaaaz\n" +
            "baaaaaaaaaaaaaaaaaaaaaaam\n" +
            "quuuuuuuuuuuuuuuuuuuuuuux\n" +
            "foooooooooooooooooooooooo\n" +
            "baaaaaaaaaaaaaaaaaaaaaaar\n" +
            "baaaaaaaaaaaaaaaaaaaaaaaz\n" +
            "baaaaaaaaaaaaaaaaaaaaaaam\n" +
            "quuuuuuuuuuuuuuuuuuuuuuux\n"

          let html = `
            <form method="post" action="/action">
              <textarea
                name="prose"
                wrap="off"
                rows="3"
                cols="10"
                up-validate
                up-watch-event="input"
                up-watch-delay="10"
                up-keep
              >${longText}</textarea>
            </form>
          `
          let [form, field] = htmlFixtureList(html)
          up.hello(form)
          await wait()

          field.value += "change1"
          await wait() // Firefox mutates scroll positions async after changing the value
          field.selectionStart = 2
          field.selectionEnd = 3
          field.scrollLeft = 12
          field.focus()
          expect(field).toBeFocused()

          Trigger.input(field)

          await wait(70)

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(keepSpy).not.toHaveBeenCalled()
          expect(field).toBe(document.querySelector('textarea[name=prose]'))
          expect(field.value).toBe(longText + 'change1')
          expect(field).toBeFocused()
          expect(field.selectionStart).toBe(2)
          expect(field.selectionEnd).toBe(3)
          expect(field.scrollLeft).toBeAround(12, 2)

          field.value += "change2"
          await wait() // Firefox mutates scroll positions async after changing the value
          field.selectionStart = 4
          field.selectionEnd = 5
          field.scrollLeft = 23
          await wait()

          jasmine.respondWith(html)

          await wait()

          expect(keepSpy).toHaveBeenCalled()
          expect(field).toBe(document.querySelector('textarea[name=prose]'))
          expect(field).toBeFocused()
          expect(field.value).toBe(longText + 'change1' + 'change2')
          expect(field.selectionStart).toBe(4)
          expect(field.selectionEnd).toBe(5)
          expect(field.scrollLeft).toBeAround(23, 2)
        })

        it('does not send duplicate requests when the keeping element is temporarily blurred and thus emits another change event (bugfix)', async function() {
          const keepSpy = jasmine.createSpy('up:fragment:keep listener')
          up.on('up:fragment:keep', keepSpy)

          const validateSpy = jasmine.createSpy('up:form:validate listener')
          up.on('up:form:validate', validateSpy)

          let html = `
            <form method="post" id="note-form" action="/action">
              <input
                type="text"
                name="note-title"
                up-validate
                up-watch-event="input"
                up-watch-delay="0"
                up-keep
              >
            </form>
          `
          let [form, field] = htmlFixtureList(html)
          field.classList.add('old-field')

          // It is hard to reproduce Chrome's behavior here.
          // We temporarily stash the keepable at the end of the body, then
          // swap in a clone, then swap keepable and clone once the clone position is known.
          // Because this blurs a field internally, Chrome fires a change event.
          field.addEventListener('blur', function() {
            Trigger.change(field)
          })

          up.hello(form)
          await wait()

          field.focus()
          field.value += "change1"
          Trigger.input(field)

          // field.addEventListener('blur', () => console.log("[SPEC] FIELD GOT BLURRED"))

          await wait(50)

          expect(validateSpy.calls.count()).toBe(1)
          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(up.network.isBusy()).toBe(true)

          expect(keepSpy).not.toHaveBeenCalled()
          expect(field).toBeFocused()

          jasmine.respondWith(html)

          await wait(100)

          expect(keepSpy).toHaveBeenCalled()
          expect(field).toBe(document.querySelector('input[name="note-title"]'))
          expect(field).toBeFocused()

          expect(validateSpy.calls.count()).toBe(1)
          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(up.network.isBusy()).toBe(false)
        })

      })

    })


    describe('div[up-validate]', function() {

      it('performs server-side validation for all fieldsets within the container, but not for fieldset outside it', async function() {
        const [form, validateContainer, emailGroup, emailInput, passwordGroup, passwordInput, nameGroup, nameInput] = htmlFixtureList(`
          <form action="/users" id="registration">
            <div up-validate> 
              <div up-form-group>
                <input type="text" name="email">
              </div>
              <div up-form-group>
                <input type="password" name="password">
              </div>
            </div>  
            <div up-form-group>
              <input type="text" name="name">
            </div>
          </form>
        `)

        up.hello(form)

        emailInput.value = 'foo@bar.com'
        Trigger.change(emailInput)
        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')
        jasmine.respondWith({ status: 204, responseText: '' })
        await wait()

        passwordInput.value = 'mumbling-shortcut-glorify'
        Trigger.change(passwordInput)
        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(2)
        expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('password')
        jasmine.respondWith({ status: 204, responseText: '' })
        await wait()

        nameInput.value = 'Mr Foo'
        Trigger.change(nameInput)
        await wait()

        // No validation request for a field outside the [up-validate] container
        expect(jasmine.Ajax.requests.count()).toEqual(2)
      })
    })

    describe('form[up-validate]', function() {

      it('performs server-side validation for all fieldsets contained within the form', async function() {
        const container = fixture('.container')
        container.innerHTML = `
          <form action="/users" id="registration" up-validate>
            <div up-form-group>
              <input type="text" name="email">
            </div>
            <div up-form-group>
              <input type="password" name="password">
            </div>
          </form>
        `
        up.hello(container)

        const $passwordInput = $('#registration input[name=password]')
        $passwordInput.val('mumbling-shortcut-glorify')
        Trigger.change($passwordInput)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('password')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('[up-form-group]:has(input[name="password"])')

        jasmine.respondWith(`
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
        `)

        await wait()

        const $labels = $('#registration [up-form-group]')
        expect($labels[0]).not.toHaveText('Validation message')
        expect($labels[1]).toHaveText('Validation message')
      })

      it('allows to validate against a different endpoint using [up-validate-url] and [up-validate-method] attributes', async function() {
        up.network.config.wrapMethod = false

        const [form] = htmlFixtureList(`
          <form action="/users" method="post" id="registration" up-validate up-validate-url="/users/validate" up-validate-method="put" enctype="my-custom-type">
            <div up-form-group>
              <input type="text" name="email">
            </div>
            <div up-form-group>
              <input type="password" name="password">
            </div>
          </form>
        `)
        up.hello(form)

        const $passwordInput = $('#registration input[name=password]')
        $passwordInput.val('mumbling-shortcut-glorify')
        Trigger.change($passwordInput)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/users/validate')
        expect(jasmine.lastRequest().method).toBe('PUT')
        // Other options are inherited
        expect(jasmine.lastRequest().requestHeaders['Content-Type']).toEqual('my-custom-type')

      })

      it('only sends a single request when a radio button group changes', async function() {
        const container = fixture('.container')
        container.innerHTML = `
          <form action="/users" id="registration" up-validate>
            <div up-form-group>
              <input type="radio" name="foo" value="1" checked>
              <input type="radio" name="foo" value="2">
            </div>
          </form>
        `
        up.hello(container)

        const $secondOption = $('#registration input[value="2"]')
        $secondOption.prop('checked', true)
        Trigger.change($secondOption)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
      })

      it('uses a target given as [up-validate] attribute value for all validations', async function() {
        const container = fixture('.container')
        container.innerHTML = `
          <form action="/users" id="registration" up-validate='.result'>
            <div up-form-group>
              <input name="email">
            </div>
            <div class="result">
              Validation result will appear here
            </div>
          </form>
        `
        up.hello(container)

        const emailInput = container.querySelector('input[name=email]')
        emailInput.value = "foo@bar.com"
        Trigger.change(emailInput)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.result')
      })

      it('picks up new inputs after the form was compiled', async function() {
        const container = fixture('.container')
        container.innerHTML = `
          <form action="/users" id="registration" up-validate='.result'>
            <fieldset>
              <input type="text" name="email">
            </fieldset>
            <fieldset class="next"></fieldset>
            <div class="result">
              Validation result will appear here
            </div>
          </form>
        `
        up.hello(container)

        await wait()

        await up.render({
          fragment: `
            <fieldset class="next">
              <input type="password" name="password">
            </fieldset>
          `
        })

        await wait()

        const passwordField = document.querySelector('[name=password]')
        passwordField.value = "foo"
        Trigger.change(passwordField)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('password')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.result')
      })

      describe('order of switching vs. validation', function() {

        it('validates after switching', async function() {
          let html = (input1Value = "") => `
            <form id="validating-form" action="/foo" method="post">
              <input id="input1" name="input1" up-switch="#input2" value="${input1Value}" up-validate>
              <input id="input2" name="input2" value="input2-value" up-disable-for="disabling-value">
            </form>
          `
          let form = htmlFixture(html())
          up.hello(form)
          await wait()

          document.querySelector('#input1').value = 'disabling-value'
          Trigger.change('#input1')

          await wait()

          expect("#input2").toBeDisabled()
          expect(jasmine.Ajax.requests.count()).toEqual(1)

          expect(jasmine.lastRequest().data()).toMatchParams({ 'input1': 'disabling-value' })

          jasmine.respondWith(html("disabling-value"))
          await wait()

          let eventOrder = []
          up.on(document.querySelector('#validating-form'), 'up:form:switch up:form:validate', ({ type }) => eventOrder.push(type))

          document.querySelector('#input1').value = 'enabling-value'
          Trigger.change('#input1')

          await wait()

          expect(eventOrder).toEqual(['up:form:switch', 'up:form:validate'])
          expect("#input2").not.toBeDisabled()
          expect(jasmine.Ajax.requests.count()).toEqual(2)
          expect(jasmine.lastRequest().data()).toMatchParams({ 'input1': 'enabling-value', 'input2': 'input2-value' })
        })

        it('validates after switching when the switcher is inserted later', async function() {
          let form = htmlFixture(`
            <form action="/foo" method="post">
              <div id="input1"><!-- input1 will be inserted later --></div>
              <input id="input2" name="input2" value="input2-value" up-disable-for="disabling-value">
            </form>
          `)
          up.hello(form)
          await wait()

          expect('#input2').not.toBeDisabled()

          await up.render({ fragment: `
            <input id="input1" name="input1" up-switch="#input2" value="disabling-value" up-validate>
          ` })

          expect(form).toHaveSelector('input#input1')
          expect('#input2').toBeDisabled()

          let eventOrder = []
          up.on(form, 'up:form:switch up:form:validate', ({ type }) => eventOrder.push(type))

          document.querySelector('#input1').value = 'enabling-value'
          Trigger.change('#input1')
          await wait(50)

          expect(eventOrder).toEqual(['up:form:switch', 'up:form:validate'])
          expect('#input2').not.toBeDisabled()
          expect(jasmine.lastRequest().data()).toMatchParams({ 'input1': 'enabling-value', 'input2': 'input2-value' })
        })

        it('validates after switching when the switchee is inserted later', async function() {
          let form = htmlFixture(`
            <form action="/foo" method="post">
              <input id="input1" name="input1" up-switch="#input2" value="disabling-value" up-validate>
              <div id="input2"><!-- input2 will be inserted here --></div>
            </form>
          `)
          up.hello(form)
          await wait()

          await up.render({ fragment: `
            <input id="input2" name="input2" value="input2-value" up-disable-for="disabling-value">
          ` })

          expect(form).toHaveSelector('input#input2')
          expect('#input2').toBeDisabled()

          let eventOrder = []
          up.on(form, 'up:form:switch up:form:validate', ({ type }) => eventOrder.push(type))

          document.querySelector('#input1').value = 'enabling-value'
          Trigger.change('#input1')
          await wait(50)

          expect(eventOrder).toEqual(['up:form:switch', 'up:form:validate'])
          expect('#input2').not.toBeDisabled()
          expect(jasmine.lastRequest().data()).toMatchParams({ 'input1': 'enabling-value', 'input2': 'input2-value' })
        })

      })

    })

  })

})
