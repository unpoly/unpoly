const u = up.util
const e = up.element

extendDescribe('up.form', function() {

  extendDescribe('JavaScript functions', function() {

    describe('up.submit()', function() {

      it('emits a preventable up:form:submit event', async function() {
        const $form = $fixture('form[action="/form-target"][up-target=".response"]')

        const listener = jasmine.createSpy('submit listener').and.callFake((event) => event.preventDefault())

        $form.on('up:form:submit', listener)

        const renderJob = up.submit($form)

        await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Aborted))

        expect(listener).toHaveBeenCalled()
        const element = listener.calls.mostRecent().args[1]
        expect(element).toEqual(element)

        // No request should be made because we prevented the event
        expect(jasmine.Ajax.requests.count()).toEqual(0)
      })

      it('submits an form that has both an [id] attribute and a field with [name=id] (bugfix)', async function() {
        const form = fixture('form#form-id[action="/path"][up-submit][method=post]')
        e.affix(form, 'input[name="id"][value="value"]')

        up.submit(form)

        await wait()

        const params = jasmine.lastRequest().data()
        expect(params['id']).toEqual(['value'])
      })

      it('loads a form with a cross-origin [action] in a new page', async function() {
        const form = fixture('form#form-id[action="https://external-domain.com/path"][up-submit][method=post]')
        e.affix(form, 'input[name="field-name"][value="field-value"]')

        const loadPage = spyOn(up.network, 'loadPage')

        up.submit(form)

        await wait()

        expect(loadPage).toHaveBeenCalledWith(jasmine.objectContaining({
          method: 'POST',
          url: 'https://external-domain.com/path',
          params: new up.Params({ 'field-name': 'field-value' })
        }))
      })

      it('returns a promise with an up.RenderResult that contains information about the updated fragments and layer', async function() {
        fixture('.one', { text: 'old one' })
        fixture('.two', { text: 'old two' })
        fixture('.three', { text: 'old three' })

        const form = fixture('form[up-target=".one, .three"][action="/path"]')

        const promise = up.submit(form)

        await wait()

        jasmine.respondWith(`
          <div class="one">new one</div>
          <div class="two">new two</div>
          <div class="three">new three</div>
        `)

        await wait()

        const result = await promiseState(promise)
        expect(result.state).toBe('fulfilled')
        expect(result.value.fragments).toEqual([document.querySelector('.one'), document.querySelector('.three')])
        expect(result.value.layer).toBe(up.layer.root)
      })

      describe('params', function() {

        it('makes a request with params from the form fields', async function() {
          const form = fixture('form[action="/action"][method="post"]')
          const fooInput = e.affix(form, 'input[type="text"][name="foo"][value="foo-value"]')
          const barInput = e.affix(form, 'input[type="text"][name="bar"][value="bar-value"]')

          up.submit(form)
          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/action')
          expect(jasmine.lastRequest().data()).toMatchParams({ foo: 'foo-value', bar: 'bar-value' })
        })

        it('adds the [name] and [value] from the first submit button to the params', async function() {
          const form = fixture('form[action="/action"][method="post"]')
          const fooInput = e.affix(form, 'input[type="text"][name="foo"][value="foo-value"]')
          const submit1 = e.affix(form, 'button[type="submit"][name="submit1"][value="submit1-value"]', { text: 'Submit1' })
          const submit2 = e.affix(form, 'button[type="submit"][name="submit2"][value="submit1-value"]', { text: 'Submit2' })

          up.submit(form)
          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/action')
          expect(jasmine.lastRequest().data()).toMatchParams({ foo: 'foo-value', submit1: 'submit1-value' })
        })

        it('does not include the submit button in the params with { submitButton: false }', async function() {
          const form = fixture('form[action="/action"][method="post"]')
          const fooInput = e.affix(form, 'input[type="text"][name="foo"][value="foo-value"]')
          const submit = e.affix(form, 'button[type="submit"][name="submit"][value="submit-value"]', { text: 'Submit' })

          up.submit(form, { submitButton: false })
          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/action')
          expect(jasmine.lastRequest().data()).toMatchParams({ foo: 'foo-value' })
        })
      })

      describe('custom form fields', function() {

        it('submits a form-associated custom element without configuration', async function() {
          const [form] = htmlFixtureList(`
            <form action="/action" method="post">
              <test-form-associated-element name="email" value="foo@example.com"></test-form-associated-element>
            </form>
          `)

          up.submit(form)
          await wait()

          expect(jasmine.lastRequest().data()).toMatchParams({ email: 'foo@example.com' })
        })

        it('submits a custom element that is configured in up.form.config.fieldSelectors', async function() {
          up.form.config.fieldSelectors.push('test-form-field')

          const [form] = htmlFixtureList(`
            <form action="/action" method="post">
              <test-form-field name="email" value="foo@example.com"></test-form-field>
            </form>
          `)

          up.submit(form)
          await wait()

          expect(jasmine.lastRequest().data()).toMatchParams({ email: 'foo@example.com' })
        })

        it('submits the native field that a custom control keeps hidden and synced', async function() {
          const [form, select] = htmlFixtureList(`
            <form action="/action" method="post">
              <select name="size" hidden>
                <option value="S">S</option>
                <option value="M">M</option>
              </select>
            </form>
          `)

          // A custom control writes the value, as the compiler in the .fromForm specs does.
          select.value = 'M'

          up.submit(form)
          await wait()

          expect(jasmine.lastRequest().data()).toMatchParams({ size: 'M' })
        })

        it('submits values added by a formdata event listener', async function() {
          const [form] = htmlFixtureList(`
            <form action="/action" method="post">
              <input name="email" value="foo@example.com">
            </form>
          `)
          form.addEventListener('formdata', (event) => event.formData.append('csrf', 'token'))

          up.submit(form)
          await wait()

          expect(jasmine.lastRequest().data()).toMatchParams({ email: 'foo@example.com', csrf: 'token' })
        })

      })

      describe('when the server responds with an error', function() {

        it('replaces the form', async function() {
          const formSelector = 'form#form[action="/form-action"][method="put"][up-submit]'
          const form = fixture(formSelector)
          const input = e.affix(form, 'input[name=foo]')
          input.focus()

          up.hello(form)

          expect(document.activeElement).toBe(input)

          up.submit(form)

          await wait()

          jasmine.respondWithSelector(formSelector, { text: 'failure text', status: 422 })

          await wait()

          expect('#form').toHaveText('failure text')
        })

        it('replaces the form if the focused element is within a shadow root (bugfix)', async function() {
          const formSelector = 'form#form[action="/form-action"][method="put"][up-submit]'
          const form = fixture(formSelector)
          const host = e.affix(form, "#host")
          const shadow = host.attachShadow({ mode: "open" })
          const input = document.createElement('input')
          input.name = "foo"
          shadow.appendChild(input)
          input.focus()

          up.hello(form)

          expect(document.activeElement).toBe(host)
          expect(shadow.activeElement).toBe(input)

          up.submit(form)

          await wait()

          jasmine.respondWithSelector(formSelector, { text: 'failure text', status: 422 })

          await wait()

          expect('#form').toHaveText('failure text')
        })

        it('replaces the form if the focused element is within a shadow root (bugfix) and the form is in an overlay', async function() {
          const overlay = await up.layer.open()

          const formSelector = 'form#form[action="/form-action"][method="put"][up-submit]'
          const form = overlay.affix(formSelector)
          const host = e.affix(form, "#host")
          const shadow = host.attachShadow({ mode: "open" })
          const input = document.createElement('input')
          input.name = "foo"
          shadow.appendChild(input)
          input.focus()

          up.hello(form)

          expect(document.activeElement).toBe(host)
          expect(shadow.activeElement).toBe(input)

          up.submit(form)

          await wait()

          jasmine.respondWithSelector(formSelector, { text: 'failure text', status: 422 })

          await wait()

          expect('#form').toHaveText('failure text')
        })
      })

      describe('with { disable } option', function() {

        describe('with { disable: "form" }', function() {
          it('disables all fields and buttons while submitting', async function() {
            const form = fixture('form')
            const input = e.affix(form, 'input[name=email]')
            const submitButton = e.affix(form, 'input[type=submit]')

            up.submit(form, { disable: 'form' })
            await wait()

            expect(input).toBeDisabled()
            expect(submitButton).toBeDisabled()
          })
        })

        describe('with { disable: true }', function() {

          it('disables all fields and buttons while submitting', async function() {
            const form = fixture('form')
            const input = e.affix(form, 'input[name=email]')
            const submitButton = e.affix(form, 'input[type=submit]')
            const genericButton = e.affix(form, 'button[type=button]')

            up.submit(form, { disable: true })
            await wait()

            expect(input).toBeDisabled()
            expect(submitButton).toBeDisabled()
            expect(genericButton).toBeDisabled()
          })

          it('does not disable fields in another form', async function() {
            const form = fixture('form')
            const formInput = e.affix(form, 'input[name=foo]')

            const otherForm = fixture('form')
            const otherFormInput = e.affix(otherForm, 'input[name=bar]')

            up.submit(form, { disable: true })
            await wait()

            expect(formInput).toBeDisabled()
            expect(otherFormInput).not.toBeDisabled()
          })
        })

        describe('with an Element', function() {
          it("disables fields within the given container element while submitting", async function() {
            const form = fixture('form')

            const group = e.affix(form, '.one')
            const input = e.affix(group, 'input[name=email]')
            const otherGroup = e.affix(form, '.two')
            const otherInput = e.affix(otherGroup, 'input[name=password]')

            up.submit(form, { disable: group })
            await wait()

            expect(input).toBeDisabled()
            expect(otherInput).not.toBeDisabled()
          })
        })

        describe('with a CSS selector', function() {

          it("disables fields within the given selector while submitting", async function() {
            const form = fixture('form')

            const group = e.affix(form, '.one')
            const input = e.affix(group, 'input[name=email]')
            const otherGroup = e.affix(form, '.two')
            const otherInput = e.affix(otherGroup, 'input[name=password]')

            up.submit(form, { disable: '.one' })
            await wait()

            expect(input).toBeDisabled()
            expect(otherInput).not.toBeDisabled()
          })

          it('disables within all (not just the first) match of the given selector', async function() {
            const form = fixture('form')

            const group = e.affix(form, '.group')
            const input = e.affix(group, 'input[name=email]')
            const alsoGroup = e.affix(form, '.group')
            const alsoInput = e.affix(alsoGroup, 'input[name=email]')

            up.submit(form, { disable: '.group' })
            await wait()

            expect(input).toBeDisabled()
            expect(alsoInput).toBeDisabled()
          })

          it('does not disable matches outside of the form', async function() {
            const form = fixture('form')
            const groupInside = e.affix(form, '.group')
            const inputInside = e.affix(groupInside, 'input[name=email]')

            const otherForm = fixture('form')
            const groupOutside = e.affix(otherForm, '.group')
            const inputOutside = e.affix(groupOutside, 'input[name=email]')

            up.submit(form, { disable: '.group' })

            await wait()

            expect(inputInside).toBeDisabled()
            expect(inputOutside).not.toBeDisabled()
          })
        })

        it('includes the disabled field params in the submission request', async function() {
          fixture('.target')
          const form = fixture('form[up-target=".target"][action="/session"][method="post"]')
          const emailInput = e.affix(form, 'input[name="email"][value="foo@bar.com"]')
          const passwordInput = e.affix(form, 'input[name="password"][value="mumbling-shortcut-glorify"]')

          up.submit(form, { disable: true })
          await wait()

          expect(emailInput).toBeDisabled()
          expect(passwordInput).toBeDisabled()

          expect(jasmine.lastRequest().url).toMatchURL('/session')
          expect(jasmine.lastRequest().method).toBe('POST')
          expect(jasmine.lastRequest().data()).toMatchParams({ email: 'foo@bar.com', password: 'mumbling-shortcut-glorify' })
        })

        it('re-enables the form when the submission ends in a successful response', async function() {
          fixture('.target')
          const form = fixture('form[up-target=".target"]')
          const input = e.affix(form, 'input[name=email]')

          up.submit(form, { disable: true })
          await wait()

          expect(input).toBeDisabled()

          jasmine.respondWithSelector('.target')
          await wait()

          expect(input).not.toBeDisabled()
        })

        it('re-enables fields when the submission ends in a failed response', async function() {
          fixture('.success-target')
          fixture('.fail-target')
          const form = fixture('form[up-target=".success-target"][up-fail-target=".fail-target"]')
          const input = e.affix(form, 'input[name=email]')

          const renderJob = up.submit(form, { disable: true })

          await wait()

          expect(input).toBeDisabled()

          jasmine.respondWithSelector('.fail-target', { status: 500 })

          await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

          expect(input).not.toBeDisabled()
        })

        it('keeps a form disabled after multiple submissions that abort each other', async function() {
          const requests = []
          up.on('up:request:load', ({ request }) => requests.push(request))

          const container = fixture('.container')
          const form = e.affix(container, 'form[method="post"][action="/endpoint"][up-target=".container"][up-disable]')
          const input = e.affix(form, 'input[name=email]')

          const submit1Promise = up.submit(form)

          await wait()

          expect(u.map(requests, 'state')).toEqual(['loading'])
          expect(input).toBeDisabled()

          const submit2Promise = up.submit(form)

          await expectAsync(submit1Promise).toBeRejectedWith(jasmine.any(up.Aborted))

          await wait()

          expect(u.map(requests, 'state')).toEqual(['aborted', 'loading'])
          expect(input).toBeDisabled()
        })

        it('keeps a form disabled after multiple submissions in the same microtask', async function() {
          const requests = []
          up.on('up:request:load', ({ request }) => requests.push(request))

          const container = fixture('.container')
          const form = e.affix(container, 'form[method="post"][action="/endpoint"][up-target=".container"][up-disable]')
          const input = e.affix(form, 'input[name=email]')
          const submit1Promise = up.submit(form)

          // Don't wait here

          const submit2Promise = up.submit(form)

          await expectAsync(submit1Promise).toBeRejectedWith(jasmine.any(up.Aborted))

          await wait()

          // When two conflicting requests queued in the microtask, the first request will not touch the network.
          expect(u.map(requests, 'state')).toEqual(['loading'])
          expect(input).toBeDisabled()
        })

        it('keeps a form disabled when it is first disabled by a validation, then again by a submission that aborts the validation request', async function() {
          const requests = []
          up.on('up:request:load', ({ request }) => requests.push(request))

          const container = fixture('.container')
          const form = e.affix(container, 'form[method="post"][action="/endpoint"][up-target=".container"][up-disable][up-watch-disable]')
          const input = e.affix(form, 'input[name=email]')
          const validatePromise = up.validate(input)

          await wait()

          expect(u.map(requests, 'state')).toEqual(['loading'])
          expect(input).toBeDisabled()

          up.submit(form)

          await expectAsync(validatePromise).toBeRejectedWith(jasmine.any(up.Aborted))

          await wait()

          expect(u.map(requests, 'state')).toEqual(['aborted', 'loading'])
          expect(input).toBeDisabled()
        })

        describe('loss of focus when disabling a focused input', function() {

          it('focuses the form', async function() {
            const form = fixture('form')
            const input = e.affix(form, 'input[name=email]')
            input.focus()

            expect(input).toBeFocused()

            up.submit(form, { disable: true })
            await wait(10)

            expect(form).toBeFocused()
          })

          it('focuses the closest form group', async function() {
            const form = fixture('form')
            const group = e.affix(form, 'fieldset')
            const input = e.affix(group, 'input[name=email]')
            input.focus()

            expect(input).toBeFocused()

            up.submit(form, { disable: true })
            await wait(10)

            expect(group).toBeFocused()
          })

          it('restores an element that lost focus, and its scroll positions and selection range when reverting', async function() {
            const target = fixture('#target')
            const parent = fixture('form#parent')
            const longText =
              "foooooooooooo\n" +
              "baaaaaaaaaaar\n" +
              "baaaaaaaaaaaz\n" +
              "baaaaaaaaaaam\n" +
              "quuuuuuuuuuux\n" +
              "foooooooooooo\n" +
              "baaaaaaaaaaar\n" +
              "baaaaaaaaaaaz\n" +
              "baaaaaaaaaaam\n" +
              "quuuuuuuuuuux\n"

            const field = e.affix(parent, 'textarea[name=prose][wrap=off][rows=3][cols=6]', { text: longText })
            field.focus()

            field.selectionStart = 10
            field.selectionEnd = 11
            field.scrollTop = 12
            field.scrollLeft = 13
            expect(field).toBeFocused()

            up.render({ disable: '#parent', url: '/url', target: '#target' })
            await wait()

            expect(parent).toBeVisible()
            expect(field).toBeVisible()
            expect(field).toBeDisabled()

            jasmine.respondWithSelector('#target')

            expect(parent).toBeVisible()
            expect(field).toBeVisible()
            expect(field).not.toBeDisabled()
            expect(field).toBeFocused()
            expect(field.selectionStart).toBeAround(10, 2)
            expect(field.selectionEnd).toBeAround(11, 2)
            expect(field.scrollTop).toBeAround(12, 2)
            expect(field.scrollLeft).toBeAround(13, 2)
          })

          it('does not restore focus when the user focused another element during the render pass', async function() {
            const form = fixture('form')
            const target = fixture('#target')
            const group = e.affix(form, 'fieldset')
            const input = e.affix(group, 'input[name=email]')
            input.focus()
            const unrelatedInput = fixture('input[name=query]')
            await wait()

            expect(input).toBeFocused()

            up.submit(form, { disable: true, target: '#target' })
            await wait(10)

            expect(group).toBeFocused()

            unrelatedInput.focus()

            jasmine.respondWithSelector('#target', { text: 'new target' })
            await wait()

            expect(input).not.toBeFocused()
            expect(unrelatedInput).toBeFocused()
          })
        })
      })

      describe('content type', function() {

        it('defaults to application/x-www-form-urlencoded in a form without file inputs', async function() {
          const form = fixture('form[action="/path"][method=post]')

          up.submit(form)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['Content-Type']).toEqual('application/x-www-form-urlencoded')
        })

        it('defaults to multipart/form-data in a form with a file input', async function() {
          const [form, input] = htmlFixtureList(`
            <form action="/path" method="post">
              <input type="file" name="file-input">
            </form>
          `)
          input.files = fileList(new File(['data'], 'data.txt', { type: 'text/plain' }))

          up.submit(form)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['Content-Type']).toBeMissing()
          expect(jasmine.lastRequest().params).toEqual(jasmine.any(FormData))
        })

        it('defaults to multipart/form-data in a form with an empty file input', async function() {
          // The browser's form-data algorithm produces an entry even for a file input with
          // no selected file. Because that entry is binary, the form is sent as multipart.
          const [form] = htmlFixtureList(`
            <form action="/path" method="post">
              <input type="file" name="file-input">
            </form>
          `)

          up.submit(form)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['Content-Type']).toBeMissing()
          expect(jasmine.lastRequest().params).toEqual(jasmine.any(FormData))
        })

        it('defaults to multipart/form-data when a binary param is passed explicitly', async function() {
          const form = fixture('form[action="/path"][method=post]')

          const params = { 'file-input': new Blob(['data']) }
          up.submit(form, { params })

          await wait()

          // Unpoly will set an empty content type so the browser will automatically append
          // a MIME boundary like multipart/form-data; boundary=----WebKitFormBoundaryHkiKAbOweEFUtny8
          expect(jasmine.lastRequest().requestHeaders['Content-Type']).toBeMissing()

          // Jasmine's fake request contains the original payload in { params }
          expect(jasmine.lastRequest().params).toEqual(jasmine.any(FormData))
        })

        it("uses the form's [enctype] attribute", async function() {
          const form = fixture('form[action="/path"][enctype="my-type"]')

          up.submit(form)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['Content-Type']).toEqual('my-type')
        })
      })

      describe('submission', function() {

        beforeEach(function() {
          up.history.config.enabled = true
          this.$form = $fixture('form[action="/form-target"][method="put"][up-target=".response"]')
          this.$form.append('<input name="field1" value="value1">')
          this.$form.append('<input name="field2" value="value2">')
          $fixture('.response').text('old-text')
        })

        it('submits the given form and replaces the target with the response', async function() {
          up.submit(this.$form, { history: true })

          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/form-target')
          expect(jasmine.lastRequest()).toHaveRequestMethod('PUT')
          expect(jasmine.lastRequest().data()['field1']).toEqual(['value1'])
          expect(jasmine.lastRequest().data()['field2']).toEqual(['value2'])
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.response')

          jasmine.respondWith({
            responseHeaders: {
              'X-Up-Location': '/redirect-target',
              'X-Up-Method': 'GET'
            },
            responseText: `
              <div class='before'>
                new-before
              </div>

              <div class="response">
                new-text
              </div>

              <div class='after'>
                new-after
              </div>
            `
          })

          await wait()

          expect(up.history.location).toMatchURL('/redirect-target')
          expect('.response').toHaveText('new-text')
          // See that containers outside the form have not changed
          expect('.before').not.toHaveText('old-before')
          expect('.after').not.toHaveText('old-after')
        })

        it("places the response into the form and doesn't update the browser URL if the submission returns a 5xx status code", async function() {
          const submitPromise = up.submit(this.$form)

          await wait()

          jasmine.respondWith({
            status: 500,
            contentType: 'text/html',
            responseText: `
              <div class='before'>
                new-before
              </div>

              <form action='/form-target'>
                error-messages
              </form>

              <div class='after'>
                new-after
              </div>
            `
          })

          await expectAsync(submitPromise).toBeRejected()

          expect(up.history.location).toMatchURL(jasmine.locationBeforeExample)
          expect('.response').toHaveText('old-text')
          expect('form').toHaveText('error-messages')
          // See that containers outside the form have not changed
          expect('.before').not.toHaveText('old-before')
          expect('.after').not.toHaveText('old-after')
        })

        it('respects X-Up-Method and X-Up-Location response headers so the server can show that it redirected to a GET URL', async function() {
          up.submit(this.$form, { history: true })

          await wait()

          jasmine.respondWith({
            status: 200,
            contentType: 'text/html',
            responseHeaders: {
              'X-Up-Location': '/other-path',
              'X-Up-Method': 'GET'
            },
            responseText: `
              <div class="response">
                new-text
              </div>
            `
          })

          await wait()

          expect(up.history.location).toMatchURL('/other-path')
        })

        it("submits the form's source URL if the form has no [action] attribute", async function() {
          const form = fixture('form#form[up-source="/form-source"]')

          up.submit(form)

          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/form-source')
        })

        describe('handling of query params in the [action] URL', function() {

          describe('for forms with GET method', function() {
            it('discards query params from an [action] attribute (like browsers do)', async function() {
              // See design/query-params-in-form-actions/cases.html for
              // a demo of vanilla browser behavior.

              const form = fixture('form[method="GET"][action="/action?foo=value-from-action"]')
              const input1 = e.affix(form, 'input[name="foo"][value="value-from-input"]')
              const input2 = e.affix(form, 'input[name="foo"][value="other-value-from-input"]')

              up.submit(form)

              await wait()

              expect(jasmine.lastRequest().url).toMatchURL('/action?foo=value-from-input&foo=other-value-from-input')
            })
          })

          describe('for forms with POST method', function() {
            it('keeps all query params in the URL', async function() {
              const form = fixture('form[method="POST"][action="/action?foo=value-from-action"]')
              const input1 = e.affix(form, 'input[name="foo"][value="value-from-input"]')
              const input2 = e.affix(form, 'input[name="foo"][value="other-value-from-input"]')

              up.submit(form)

              await wait()

              expect(jasmine.lastRequest().url).toMatchURL('/action?foo=value-from-action')
              expect(jasmine.lastRequest().data()['foo']).toEqual(['value-from-input', 'other-value-from-input'])
            })
          })
        })

        describe('with { location } option', function() {

          it('uses the given URL as the new browser location if the request succeeded', async function() {
            up.submit(this.$form, { location: '/given-path' })
            await wait()
            jasmine.respondWith('<div class="response">new-text</div>')
            await wait()
            expect(up.history.location).toMatchURL('/given-path')
          })

          it('keeps the current browser location if the request failed', async function() {
            const renderJob = up.submit(this.$form, { location: '/given-path', failTarget: '.response' })

            await wait()

            jasmine.respondWith('<div class="response">new-text</div>', { status: 500 })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(up.history.location).toMatchURL(jasmine.locationBeforeExample)
          })
        })

        describe('with { history: false } option', function() {
          it('keeps the current browser location', async function() {
            up.submit(this.$form, { history: false })
            await wait()
            jasmine.respondWith('<div class="response">new-text</div>')
            await wait()
            expect(up.history.location).toMatchURL(jasmine.locationBeforeExample)
          })
        })

        describe('with { scroll } option', function() {

          it('reveals the given selector', async function() {
            const $form = $fixture('form[action="/action"][up-target=".target"]')
            const $target = $fixture('.target')
            const $other = $fixture('.other')

            const revealStub = up.reveal.mock().and.returnValue(Promise.resolve())

            up.submit($form, { scroll: '.other' })

            await wait()

            jasmine.respondWith(`
              <div class="target">
                new text
              </div>
              <div class="other">
                new other
              </div>
            `)

            await wait()

            expect(revealStub).toHaveBeenCalled()
            expect(revealStub.calls.mostRecent().args[0]).toMatchSelector('.other')
          })

          it('allows to refer to the origin as ":origin" in the selector', async function() {
            const $form = $fixture('form#foo-form[action="/action"][up-target="#foo-form"]')

            const revealStub = up.reveal.mock().and.returnValue(Promise.resolve())

            up.submit($form, { scroll: ':origin .form-child' })

            await wait()

            jasmine.respondWith(`
              <div class="target">
                new text
              </div>

              <form id="foo-form">
                <div class="form-child">other</div>
              </form>
            `)

            await wait()

            expect(revealStub).toHaveBeenCalled()
            expect(revealStub.calls.mostRecent().args[0]).toEqual(e.get('#foo-form .form-child'))
          })
        })

        describe('with { failScroll } option', function() {

          it('reveals the given selector for a failed submission', async function() {
            const $form = $fixture('form#foo-form[action="/action"][up-target=".target"]')
            const $target = $fixture('.target')
            const $other = $fixture('.other')

            const revealStub = up.reveal.mock().and.returnValue(Promise.resolve())

            const renderJob = up.submit($form, { reveal: '.other', failScroll: '.error' })

            await wait()

            jasmine.respondWith({
              status: 500,
              responseText: `
                <form id="foo-form">
                  <div class="error">Errors here</div>
                </form>
              `
            })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(revealStub).toHaveBeenCalled()
            expect(revealStub.calls.mostRecent().args[0]).toMatchSelector('.error')
          })

          it('allows to refer to the origin as ":origin" in the selector', async function() {
            const $form = $fixture('form#foo-form[action="/action"][up-target=".target"]')
            const $target = $fixture('.target')

            const revealStub = up.reveal.mock().and.returnValue(Promise.resolve())

            const renderJob = up.submit($form, { failScroll: ':origin .form-child' })

            await wait()

            jasmine.respondWith({
              status: 500,
              responseText: `
                <div class="target">
                  new text
                </div>

                <form id="foo-form">
                  <div class="form-child">other</div>
                </form>
              `
            })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(revealStub).toHaveBeenCalled()
            expect(revealStub.calls.mostRecent().args[0]).toEqual(e.get('#foo-form .form-child'))
          })
        })
      })
    })

  })

})
