const e = up.element

extendDescribe('up.form', function() {

  extendDescribe('JavaScript functions', function() {

    describe('up.validate()', function() {

      describe('custom form fields', function() {

        it('validates a custom element that is configured in up.form.config.fieldSelectors', async function() {
          up.form.config.fieldSelectors.push('test-form-field')

          const [, group, field] = htmlFixtureList(`
            <form action="/form" method="post">
              <div up-form-group>
                <test-form-field name="email" value="foo@example.com"></test-form-field>
              </div>
            </form>
          `)

          up.validate(field)
          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')
          expect(jasmine.lastRequest().data()).toMatchParams({ email: 'foo@example.com' })
        })

        it('sends the value of a form-associated custom element with the validation request', async function() {
          const [, group, field] = htmlFixtureList(`
            <form action="/form" method="post">
              <div up-form-group>
                <input name="city" value="Berlin">
              </div>
              <test-form-associated-element name="email" value="foo@example.com"></test-form-associated-element>
            </form>
          `)

          up.validate(field)
          await wait()

          expect(jasmine.lastRequest().data()).toMatchParams({ city: 'Berlin', email: 'foo@example.com' })
        })

        it('sends values added by a formdata event listener with the validation request', async function() {
          const [form, group, field] = htmlFixtureList(`
            <form action="/form" method="post">
              <div up-form-group>
                <input name="email" value="foo@example.com">
              </div>
            </form>
          `)
          form.addEventListener('formdata', (event) => event.formData.append('csrf', 'token'))

          up.validate(field)
          await wait()

          expect(jasmine.lastRequest().data()).toMatchParams({ email: 'foo@example.com', csrf: 'token' })
        })

      })


      describe('up:form:validate event', function() {

        it('is emitted with information about the validation pass', async function() {
          const form = fixture('form[action=/path]')
          const input = e.affix(form, 'input[name=foo][value=foo-value]')
          const submitListener = jasmine.createSpy('up:form:submit listener')
          const validateListener = jasmine.createSpy('up:form:validate listener')
          up.on('up:form:submit', submitListener)
          up.on('up:form:validate', validateListener)

          up.validate(input)

          await wait()

          expect(submitListener).not.toHaveBeenCalled()
          expect(validateListener).toHaveBeenCalled()
          const validateEvent = validateListener.calls.argsFor(0)[0]
          expect(validateEvent).toBeEvent('up:form:validate')
          expect(validateEvent.fields).toEqual([input])
          expect(validateEvent.form).toBe(form)
          // Cannot emit on the origin because we're batching validations from multiple origins
          expect(validateEvent.target).toBe(form)
          expect(validateEvent.params).toMatchParams({ foo: 'foo-value' })
        })

        it('lets listeners mutate params before submission', async function() {
          const form = fixture('form[action="/form-target"][method="put"][up-target=".response"]')
          const input = e.affix(form, 'input[name="foo"][value="one"]')

          const listener = function(event) {
            expect(event.params.get('foo')).toBe("one")
            event.params.set('foo', 'two')
          }

          up.on('up:form:validate', listener)

          up.validate(input)

          await wait()

          expect(jasmine.lastRequest().data()['foo']).toEqual(['two'])
        })
      })

      it('allows to override the { data } for the new element', async function() {
        const form = fixture('form[action="/path"]')
        e.affix(form, '.element', { 'up-data': JSON.stringify({ key: 'one' }), text: 'old text' })

        expect(up.data('.element')).toEqual({ key: 'one' })

        up.validate('.element', { data: { key: 'two' } })

        await wait()

        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')

        jasmine.respondWithSelector('.element', { text: 'new text' })

        await wait()

        expect('.element').toHaveText('new text')
        expect(up.data('.element')).toEqual({ key: 'two' })
      })

      it('allows to transfer data with { keepData }', async function() {
        const form = fixture('form[action="/path"]')
        e.affix(form, '.element', { 'up-data': JSON.stringify({ key: 'one' }), text: 'old text' })

        expect(up.data('.element')).toEqual({ key: 'one' })

        up.validate('.element', { keepData: true })

        await wait()

        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')

        jasmine.respondWithSelector('.element', { text: 'new text' })

        await wait()

        expect('.element').toHaveText('new text')
        expect(up.data('.element')).toEqual({ key: 'one' })
      })

      describe('with a CSS selector matching a non-field element', function() {

        it('validates the element', async function() {
          const form = fixture('form[action=/form]')
          const element = e.affix(form, '.element')
          const field = e.affix(form, 'input[name=email]')

          up.validate('.element')

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual(':unknown')
        })

        it('allows to provide an origin field for X-Up-Validate with { origin } option', async function() {
          const form = fixture('form[action=/form]')
          const element = e.affix(form, '.element')
          const field = e.affix(form, 'input[name=email]')

          up.validate('.element', { origin: field })

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')
        })

        it('lists all contained fields in the X-Up-Validate header', async function() {
          const form = fixture('form[action=/form]')
          const element = e.affix(form, '.credentials')
          e.affix(element, 'input[name=email]')
          e.affix(element, 'input[name=password]')
          e.affix(form, 'input[name=company]')

          up.validate('.credentials')

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.credentials')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email password')
        })
      })

      describe('with a CSS selector matching a field', function() {

        it('validates the closest form group', async function() {
          const form = fixture('form[action=/form]')
          const group = e.affix(form, '[up-form-group]')
          const field = e.affix(group, 'input[name=email]')

          up.validate('input[name=email]')

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('[up-form-group]:has(input[name="email"])')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')
        })

        it('updates a different target with { target } option', async function() {
          const form = fixture('form[action=/form]')
          const group = e.affix(form, '[up-form-group]')
          const field = e.affix(group, 'input[name=email]')
          const otherTarget = e.affix(form, '.other-target')

          up.validate('input[name=email]', { target: '.other-target' })

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.other-target')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')
        })

        it('does not seek a form group with { formGroup: false }', async function() {
          const form = fixture('form[action=/form]')
          const group = e.affix(form, '[up-form-group]')
          const field = e.affix(group, 'input[name="email"]')

          up.validate('input[name="email"]', { formGroup: false })

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('input[name="email"]')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')
        })
      })

      describe('with a CSS selector matching no element', function() {
        it('does not crash a pending validation batch', async function() {
          const form = fixture('form[action=/form]')
          const target = e.affix(form, '.match')

          up.validate('.match')
          const validateNoMatch = () => up.validate('.no-match')

          expect(validateNoMatch).toThrowError()

          await wait()

          // See that the validation of .match is still sent
          expect(jasmine.Ajax.requests.count()).toBe(1)
        })
      })

      describe('with a non-field element', function() {

        it('validates a target derived from the element', async function() {
          const form = fixture('form[action=/form]')
          const element = e.affix(form, '.element')
          const field = e.affix(form, 'input[name=email]')

          up.validate(element)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual(':unknown')
        })

        it('allows to provide an origin field for X-Up-Validate with { origin } option', async function() {
          const form = fixture('form[action=/form]')
          const element = e.affix(form, '.element')
          const field = e.affix(form, 'input[name=email]')

          up.validate(element, { origin: field })

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')
        })

        it('names all contained field in X-Up-Validate header', async function() {
          const form = fixture('form[action=/path]')
          const container = e.affix(form, '.container')
          const input1 = e.affix(container, 'input[name=foo]')
          const input2 = e.affix(container, 'input[name=bar]')
          const input3 = e.affix(form, 'input[name=baz]')

          up.validate(container)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('foo bar')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.container')
        })

        it('sends `X-Up-Validate: :unknown` if the names of all contained fields are too long for an HTTP header', async function() {
          const form = fixture('form[action=/path]')
          const container = e.affix(form, '.container')
          const input1 = e.affix(container, `input[name=${'a'.repeat(5000)}]`)
          const input2 = e.affix(container, `input[name=${'b'.repeat(5000)}]`)

          up.validate(container)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual(':unknown')
        })

        it('may be called with an entire form (bugfix)', async function() {
          const form = fixture('form[action=/path] input[name=foo]')
          const validateListener = jasmine.createSpy('up:form:validate listener')
          up.on('up:form:validate', validateListener)

          up.validate(form)

          await wait()

          expect(validateListener).toHaveBeenCalled()
        })

        it('does not seek a form group', async function() {
          const form = fixture('form[action=/form]')
          const group = e.affix(form, '[up-form-group]')
          const element = e.affix(group, '.element')

          up.validate(element)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual(':unknown')
        })
      })

      describe('with a field element', function() {

        it('validates the closest form group', async function() {
          const form = fixture('form[action=/form]')
          const group = e.affix(form, '[up-form-group]')
          const field = e.affix(group, 'input[name=email]')

          up.validate(field)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('[up-form-group]:has(input[name="email"])')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')
        })

        it('does not seek a form group with { formGroup: false }', async function() {
          const form = fixture('form[action=/form]')
          const group = e.affix(form, '[up-form-group]')
          const field = e.affix(group, 'input[name=email]')

          up.validate(field, { formGroup: false })

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('input[name="email"]')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')
        })

        it('updates a different target with { target } option', async function() {
          const form = fixture('form[action=/form]')
          const group = e.affix(form, '[up-form-group]')
          const field = e.affix(group, 'input[name=email]')
          const otherTarget = e.affix(form, '.other-target')

          up.validate(field, { target: '.other-target' })

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.other-target')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')
        })

        it("updates a different target found in the element's [up-validate] attribute", async function() {
          const form = fixture('form[action=/form]')
          const group = e.affix(form, '[up-form-group]')
          const field = e.affix(group, 'input[name=email][up-validate=".other-target"]')
          const otherTarget = e.affix(form, '.other-target')

          up.validate(field)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.other-target')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('email')
        })

        it('update this form with [up-validate=form] (bugfix)', async function() {
          let form1 = fixture('form.form')
          let form2 = fixture('form.form')
          let form3 = fixture('form.form')

          const form2Field = e.affix(form2, 'input[name=email][up-validate="form"]')

          up.validate(form2Field)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('form')

          jasmine.respondWithSelector('form.form', { text: 'new text' })

          await wait()

          let [newForm1, newForm2, newForm3] = document.querySelectorAll('form.form')
          expect(newForm1).toHaveText('')
          expect(newForm2).toHaveText('new text')
          expect(newForm3).toHaveText('')
        })

        it('does not crash a pending validation batch if the [up-validate] attribute value matches no element', async function() {
          const form = fixture('form[action=/form]')
          e.affix(form, '.match')
          const field = e.affix(form, 'input[name=email][up-validate=".no-match"]')

          up.validate('.match')
          const validateNoMatch = () => up.validate(field)

          expect(validateNoMatch).toThrowError(/does not match an element/)

          await wait()

          // See that the validation of .match is still sent
          expect(jasmine.Ajax.requests.count()).toBe(1)
        })
      })

      describe('return value', function() {

        it('returns a Promise that fulfills when the server responds to validation with an 200 OK status code', async function() {
          const form = fixture('form[action=/form]')
          const element = e.affix(form, '.element', { text: 'old text' })

          const promise = up.validate(element)

          await wait()

          expect('.element').toHaveText('old text')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')

          await wait()

          jasmine.respondWithSelector('.element', { text: 'new text' })

          await wait()

          expect('.element').toHaveText('new text')

          const { state, value } = await promiseState(promise)
          expect(state).toBe('fulfilled')
          expect(value).toEqual(jasmine.any(up.RenderResult))
        })

        it('delays the Promise when a new validation was queued due to a prior request still loading', async function() {
          const form = fixture('form[action=/form]')
          const element = e.affix(form, '.element', { text: 'version 1' })

          const promise1 = up.validate(element)

          await wait()

          expect('.element').toHaveText('version 1')
          expect(jasmine.Ajax.requests.count()).toBe(1)

          const promise2 = up.validate(element)

          await wait()

          expect((await promiseState(promise1)).state).toBe('pending')
          expect((await promiseState(promise2)).state).toBe('pending')

          jasmine.respondWithSelector('.element', { text: 'version 2' })

          await wait()

          expect('.element').toHaveText('version 2')
          expect(jasmine.Ajax.requests.count()).toBe(2)

          expect((await promiseState(promise1)).state).toBe('fulfilled')
          expect((await promiseState(promise2)).state).toBe('pending')

          jasmine.respondWithSelector('.element', { text: 'version 3' })
          await wait()

          expect((await promiseState(promise1)).state).toBe('fulfilled')
          expect((await promiseState(promise2)).state).toBe('fulfilled')
        })

        it('returns a Promise that rejects with an up.RenderResult when the server responds to validation with an error code', async function() {
          const form = fixture('form[action=/form]')
          const element = e.affix(form, '.element', { text: 'old text' })

          const promise = up.validate(element)

          await wait()

          expect('.element').toHaveText('old text')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')

          await expectAsync(promise).toBePending()

          jasmine.respondWithSelector('.element', { text: 'new text', status: 422 })

          await wait()

          expect('.element').toHaveText('new text')

          await expectAsync(promise).toBeRejectedWith(jasmine.any(up.RenderResult))
        })

        it('returns a Promise that rejects with up.Aborted when the validation request is aborted', async function() {
          const form = fixture('form[action=/form]')
          const element = e.affix(form, '.element', { text: 'old text' })

          const promise = up.validate(element)

          await wait()

          expect('.element').toHaveText('old text')
          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')

          await expectAsync(promise).toBePending()

          up.network.abort()

          await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Aborted))
        })

        it('returns a Promise that rejects with up.Aborted when the form is aborted before a debounce { delay } has elapsed', async function() {
          const form = fixture('form[action=/form]')
          const element = e.affix(form, '.element', { text: 'old text' })

          const promise = up.validate(element, { delay: 1000 })

          await wait()

          expect('.element').toHaveText('old text')
          expect(jasmine.Ajax.requests.count()).toBe(0)

          await expectAsync(promise).toBePending()

          up.fragment.abort(form)

          await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Aborted))
        })
      })

      describe('request sequence', function() {

        it('only sends a single concurrent request and queues new validations while a validation request is in flight', async function() {
          const form = fixture('form[method="post"][action="/endpoint"]')
          const group1 = e.affix(form, '[up-form-group]')
          const input1 = e.affix(group1, 'input[name=email]')
          const group2 = e.affix(form, '[up-form-group]')
          const input2 = e.affix(group2, 'input[name=password]')

          up.validate(input1)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.lastRequest().url).toMatchURL('/endpoint')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="email"])')

          up.validate(input2)

          await wait()

          // See that validations of input2 are queued. No second request is sent yet.
          expect(jasmine.Ajax.requests.count()).toBe(1)

          jasmine.respondWithSelector('[up-form-group] input[name="email"]')

          await wait()

          // Now that the first validation request has concluded, a second request is sent.
          expect(jasmine.Ajax.requests.count()).toBe(2)
          expect(jasmine.lastRequest().url).toMatchURL('/endpoint')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="password"])')
        })

        it('does not shorten the { delay } of a queued validations when the prior request finishes (bugfix)', async function() {
          const form = fixture('form[method="post"][action="/endpoint"]')
          const group1 = e.affix(form, '[up-form-group]')
          const input1 = e.affix(group1, 'input[name=email]')
          const group2 = e.affix(form, '[up-form-group]')
          const input2 = e.affix(group2, 'input[name=password]')

          up.validate(input1, { delay: 0 })

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.lastRequest().url).toMatchURL('/endpoint')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="email"])')

          up.validate(input2, { delay: 130 })

          await wait()

          // See that validations of input2 are queued. No second request is sent yet.
          expect(jasmine.Ajax.requests.count()).toBe(1)

          jasmine.respondWithSelector('[up-form-group] input[name="email"]')

          await wait()

          // The delay is still running
          expect(jasmine.Ajax.requests.count()).toBe(1)

          await wait(200)

          // Now that the delay is over, a second request is sent.
          expect(jasmine.Ajax.requests.count()).toBe(2)
          expect(jasmine.lastRequest().url).toMatchURL('/endpoint')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="password"])')
        })

        it('aborts queued validations when the form element is aborted', async function() {
          const form = fixture('form[method="post"][action="/endpoint"]')
          const group1 = e.affix(form, '[up-form-group]')
          const input1 = e.affix(group1, 'input[name=email]')
          const group2 = e.affix(form, '[up-form-group]')
          const input2 = e.affix(group2, 'input[name=password]')

          const validateInput1Promise = up.validate(input1)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.lastRequest().url).toMatchURL('/endpoint')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="email"])')

          const validateInput2Promise = up.validate(input2)

          await wait()

          // See that validations of input2 are queued. No second request is sent yet.
          expect(jasmine.Ajax.requests.count()).toBe(1)

          up.fragment.abort(form)

          await expectAsync(validateInput1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
          await expectAsync(validateInput2Promise).toBeRejectedWith(jasmine.any(up.Aborted))

          await wait()

          // No second request was made
          expect(jasmine.Ajax.requests.count()).toBe(1)
        })
      })

      describe('disabling', function() {

        it("executes the form's [up-watch-disable] option while a validation request is in flight", async function() {
          const form = fixture('form[up-watch-disable]')
          const group = e.affix(form, '[up-form-group]')
          const input = e.affix(group, 'input[name=email]')

          up.validate(input)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="email"])')
          expect(input).toBeDisabled()

          jasmine.respondWithSelector('[up-form-group] input[name="email"]')

          await wait()

          expect(input).not.toBeDisabled()
        })

        it("executes the fields's [up-watch-disable] option while a validation request is in flight", async function() {
          const form = fixture('form')
          const group = e.affix(form, '[up-form-group]')
          const input = e.affix(group, 'input[name=email][up-watch-disable]')

          up.validate(input)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="email"])')
          expect(input).toBeDisabled()

          jasmine.respondWithSelector('[up-form-group] input[name="email"]')

          await wait()

          expect(input).not.toBeDisabled()
        })

        it("overrides the [up-watch-disable] option from form and field if an { disable } option is also passed", async function() {
          const form = fixture('form[up-watch-disable]')
          const group = e.affix(form, '[up-form-group]')
          const input = e.affix(group, 'input[name=email][up-watch-disable]')

          up.validate(input, { disable: false })

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="email"])')
          expect(input).not.toBeDisabled()
        })
      })

      describe('feedback classes', function() {

        it("executes the form's [up-watch-feedback] option while a validation request is in flight", async function() {
          const form = fixture('form[up-watch-feedback]')
          const group = e.affix(form, '[up-form-group]')
          const input = e.affix(group, 'input[name=email]')

          up.validate(input)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="email"])')
          expect(group).toHaveClass('up-loading')

          jasmine.respondWithSelector('[up-form-group] input[name="email"]')

          await wait()

          expect(group).not.toHaveClass('up-loading')
        })

        it("executes the fields's [up-watch-feedback] option while a validation request is in flight", async function() {
          const form = fixture('form')
          const group = e.affix(form, '[up-form-group]')
          const input = e.affix(group, 'input[name=email][up-watch-feedback]')

          up.validate(input)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="email"])')
          expect(group).toHaveClass('up-loading')

          jasmine.respondWithSelector('[up-form-group] input[name="email"]')

          await wait()

          expect(group).not.toHaveClass('up-loading')
        })

        it("overrides the [up-watch-feedback] option from form and field if an { disable } option is also passed", async function() {
          const form = fixture('form[up-watch-feedback]')
          const group = e.affix(form, '[up-form-group]')
          const input = e.affix(group, 'input[name=email][up-watch-feedback]')

          up.validate(input, { feedback: false })

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('[up-form-group]:has(input[name="email"])')
          expect(group).not.toHaveClass('up-loading')
        })
      })

      describe('batching', function() {

        it('batches multiple up.validate() calls into a single request', async function() {
          const form = fixture('form[action=/path]')
          const fooGroup = e.affix(form, '[up-form-group]')
          const fooField = e.affix(fooGroup, 'input[name=foo]')
          const barGroup = e.affix(form, '[up-form-group]')
          const barField = e.affix(barGroup, 'input[name=bar]')
          const bazGroup = e.affix(form, '[up-form-group]')
          const bazField = e.affix(bazGroup, 'input[name=baz]')

          up.validate(fooField)
          up.validate(bazField)
          up.validate(fooField)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('foo baz')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('[up-form-group]:has(input[name="foo"]), [up-form-group]:has(input[name="baz"])')
        })

        it('does not batch requests with a different { url }', async function() {
          const formHTML = `
            <form action="/path1" method="post">
              <fieldset><input name="foo"></fieldset>
              <fieldset><input name="bar" up-validate-url="/path2"></fieldset>
              <fieldset><input name="baz"></fieldset>
              <fieldset><input name="qux" up-validate-url="/path2"></fieldset>
            </form>
          `

          const [form, fooGroup, fooField, barGroup, barField, bazGroup, bazField, quxGroup, quxField] = htmlFixtureList(formHTML)

          let promise1 = up.validate(fooField)
          let promise2 = up.validate(barField)
          let promise3 = up.validate(bazField)
          let promise4 = up.validate(quxField)

          await wait()

          expect((await promiseState(promise1)).state).toBe('pending')
          expect((await promiseState(promise2)).state).toBe('pending')
          expect((await promiseState(promise3)).state).toBe('pending')
          expect((await promiseState(promise4)).state).toBe('pending')

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.lastRequest().url).toMatchURL('/path1')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('foo baz')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('fieldset:has(input[name="foo"]), fieldset:has(input[name="baz"])')

          jasmine.respondWith(formHTML)
          await wait()

          expect((await promiseState(promise1)).state).toBe('fulfilled')
          expect((await promiseState(promise2)).state).toBe('pending')
          expect((await promiseState(promise3)).state).toBe('fulfilled')
          expect((await promiseState(promise4)).state).toBe('pending')

          expect(jasmine.Ajax.requests.count()).toBe(2)
          expect(jasmine.lastRequest().url).toMatchURL('/path2')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('bar qux')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('fieldset:has(input[name="bar"]), fieldset:has(input[name="qux"])')

          jasmine.respondWith(formHTML)
          await wait()

          expect((await promiseState(promise1)).state).toBe('fulfilled')
          expect((await promiseState(promise2)).state).toBe('fulfilled')
          expect((await promiseState(promise3)).state).toBe('fulfilled')
          expect((await promiseState(promise4)).state).toBe('fulfilled')
        })

        it('does not batch requests with a different { method }')

        it('honors the { disable } option of each batched validation, resolving the :origin for each field', async function() {
          const form = fixture('form[action=/path][up-watch-disable=":origin"]')
          const fooField = e.affix(form, 'input[name=foo]')
          const barField = e.affix(form, 'input[name=bar]')
          const bazField = e.affix(form, 'input[name=baz]')

          up.validate(fooField)
          up.validate(bazField)

          await wait()

          expect(fooField).toBeDisabled()
          expect(barField).not.toBeDisabled()
          expect(bazField).toBeDisabled()

          jasmine.respondWith(`
            <form action="/path">
              <input name='foo'>
              <input name='bar'>
              <input name='baz'>
            </form>
          `)

          await wait()

          expect(fooField).not.toBeDisabled()
          expect(barField).not.toBeDisabled()
          expect(bazField).not.toBeDisabled()
        })

        it('applies the { preview } of each batched validation to only its respective targeted fragment', async function() {
          const undo1Fn = jasmine.createSpy('preview1 undo fn')
          const preview1Fn = jasmine.createSpy('preview1 apply fn').and.returnValue(undo1Fn)
          const undo2Fn = jasmine.createSpy('preview2 undo fn')
          const preview2Fn = jasmine.createSpy('preview2 apply fn').and.returnValue(undo2Fn)

          up.preview('preview1', preview1Fn)
          up.preview('preview2', preview2Fn)

          const [form, fooGroup, fooField, barGroup, barField, bazGroup, bazField] = htmlFixtureList(`
            <form action="/path">
              <fieldset>
                <input name='foo' up-watch-preview='preview1'>
              </fieldset>
              <fieldset>
                <input name='bar'>
              </fieldset>
              <fieldset>
                <input name='baz' up-watch-preview='preview2'>
              </fieldset>
            </form>
          `)

          up.validate(fooField)
          up.validate(barField)
          up.validate(bazField)

          await wait()

          expect(preview1Fn.calls.count()).toBe(1)
          expect(preview1Fn).toHaveBeenCalledWith(jasmine.objectContaining({ fragment: fooGroup }), {})
          expect(undo1Fn.calls.count()).toBe(0)

          expect(preview2Fn.calls.count()).toBe(1)
          expect(preview2Fn).toHaveBeenCalledWith(jasmine.objectContaining({ fragment: bazGroup }), {})
          expect(undo2Fn.calls.count()).toBe(0)

          jasmine.respondWith(`
            <form action="/path">
              <fieldset>
                <input name='foo'>
              </fieldset>
              <fieldset>
                <input name='bar'>
              </fieldset>
              <fieldset>
                <input name='baz'>
              </fieldset>
            </form>
          `)

          await wait()

          expect(preview1Fn.calls.count()).toBe(1)
          expect(undo1Fn.calls.count()).toBe(1)
          expect(preview2Fn.calls.count()).toBe(1)
          expect(undo2Fn.calls.count()).toBe(1)
        })

        it('applies the { placeholder } of each batched validation to only its respective targeted fragment', async function() {
          const [form, fooGroup, fooField, barGroup, barField, bazGroup, bazField, placeholderTemplate] = htmlFixtureList(`
            <form action="/path">
              <fieldset>
                <input name='foo' up-watch-placeholder='#placeholder-template'>
              </fieldset>
              <fieldset>
                <input name='bar'>
              </fieldset>
              <fieldset>
                <input name='baz' up-watch-placeholder='#placeholder-template'>
              </fieldset>

              <template id='placeholder-template'>
                <div class='placeholder'>loading...</div>
              </template>
            </form>
          `)

          up.validate(fooField)
          up.validate(barField)
          up.validate(bazField)

          await wait()

          expect('fieldset:has(input[name=foo])').toHaveSelector('.placeholder')
          expect('input[name=foo]').toBeHidden()

          expect('fieldset:has(input[name=bar])').not.toHaveSelector('.placeholder')
          expect('input[name=bar]').not.toBeHidden()

          expect('fieldset:has(input[name=baz])').toHaveSelector('.placeholder')
          expect('input[name=baz]').toBeHidden()

          jasmine.respondWith(`
            <form action="/path">
              <fieldset>
                <input name='foo'>
              </fieldset>
              <fieldset>
                <input name='bar'>
              </fieldset>
              <fieldset>
                <input name='baz'>
              </fieldset>
            </form>
          `)

          await wait()

          expect('fieldset:has(input[name=foo])').not.toHaveSelector('.placeholder')
          expect('input[name=foo]').not.toBeHidden()

          expect('fieldset:has(input[name=bar])').not.toHaveSelector('.placeholder')
          expect('input[name=bar]').not.toBeHidden()

          expect('fieldset:has(input[name=baz])').not.toHaveSelector('.placeholder')
          expect('input[name=baz]').not.toBeHidden()
        })

        it('uses the { focus } option of the last batched validation with a { focus } option', async function() {
          const form = fixture('form[action=/path]')
          const fooField = e.affix(form, 'input[name=foo]')
          const barField = e.affix(form, 'input[name=bar]')
          const bazField = e.affix(form, 'input[name=baz]')
          const validateTarget = e.affix(form, '.validate-target', { text: 'old content' })
          const fooFocus = e.affix(form, '.foo-focus')
          const barFocus = e.affix(form, '.bar-focus')

          up.hello(form)

          up.validate(fooField, { target: '.validate-target', focus: '.foo-focus' })
          up.validate(barField, { target: '.validate-target', focus: '.bar-focus' })
          up.validate(bazField, { target: '.validate-target' })

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.validate-target')

          jasmine.respondWithSelector('.validate-target', { text: 'new content' })

          await wait()

          expect('.validate-target').toHaveText('new content')
          expect('.bar-focus').toBeFocused()
        })

        describe('{ params }', function() {

          it('merges the { params } option of all batched validations', async function() {
            const form = fixture('form[action=/path][method=post]')
            const fooField = e.affix(form, 'input[name=foo][value="foo-value"]')
            const barField = e.affix(form, 'input[name=bar][value="bar-value"]')

            up.validate(fooField, { params: { baz: 'baz-value' }, formGroup: false })
            up.validate(barField, { params: { bam: 'bam-value' }, formGroup: false })

            await wait()

            expect(jasmine.lastRequest().data()).toMatchParams({
              foo: 'foo-value', // from form
              bar: 'bar-value', // from form
              baz: 'baz-value', // from validate() arg
              bam: 'bam-value', // from validate() arg
            })
          })

          it('overrides (not adds) form-parsed params with the same name', async function() {
            const form = fixture('form[action=/path][method=post]')
            const fooField = e.affix(form, 'input[name=foo][value="1"]')
            const barField = e.affix(form, 'input[name=bar][value="2"]')
            const bazField = e.affix(form, 'input[name=baz][value="3"]')

            up.validate(fooField, { params: { foo: '4' }, formGroup: false })
            up.validate(barField, { params: { baz: '5' }, formGroup: false })

            await wait()

            expect(jasmine.lastRequest().data()).toMatchParams([
              { name: 'bar', value: '2' },
              { name: 'foo', value: '4' },
              { name: 'baz', value: '5' },
            ])

          })
        })

        it('merges the { headers } option of all batched validations', async function() {
          const form = fixture('form[action=/path]')
          const fooField = e.affix(form, 'input[name=foo]')
          const barField = e.affix(form, 'input[name=bar]')

          up.validate(fooField, { headers: { Baz: 'baz-value' }, formGroup: false })
          up.validate(barField, { headers: { Bam: 'bam-value' }, formGroup: false })
          await wait()

          expect(jasmine.lastRequest().requestHeaders['Baz']).toBe('baz-value')
          expect(jasmine.lastRequest().requestHeaders['Bam']).toBe('bam-value')
        })

        it('honors the { data } option of each batched validation, mapping each data to its respective targeted fragment', async function() {
          const form = fixture('form[action=/path]')
          const fooField = e.affix(form, 'input[name=foo]')
          const barField = e.affix(form, 'input[name=bar]')

          const fooDataSpy = jasmine.createSpy("spy for foo's data")
          const barDataSpy = jasmine.createSpy("spy for bar's data")

          up.compiler('input[name=foo]', (element, data) => {
            return fooDataSpy(data)
          })

          up.compiler('input[name=bar]', (element, data) => {
            return barDataSpy(data)
          })

          expect(fooDataSpy.calls.argsFor(0)[0]).toEqual({})
          expect(barDataSpy.calls.argsFor(0)[0]).toEqual({})

          up.validate(fooField, { data: { key: 1 }, formGroup: false })
          up.validate(barField, { data: { key: 2 }, formGroup: false })

          await wait()

          jasmine.respondWith(`
            <form action="/path">
              <input name='foo'>
              <input name='bar'>
              <input name='baz'>
            </form>
          `)

          await wait()

          expect(fooDataSpy.calls.count()).toBe(2)
          expect(fooDataSpy.calls.argsFor(1)[0]).toEqual({ key: 1 })

          expect(barDataSpy.calls.count()).toBe(2)
          expect(barDataSpy.calls.argsFor(1)[0]).toEqual({ key: 2 })
        })

        describe('concurrency', function() {

          it('picks up changed field values between multiple up.validate() calls (bugfix)', async function() {
            const form = fixture('form[action=/path][method=post]')
            const fooGroup = e.affix(form, '[up-form-group]')
            const fooField = e.affix(fooGroup, 'input[name=foo]')
            const barGroup = e.affix(form, '[up-form-group]')
            const barField = e.affix(barGroup, 'input[name=bar]')

            fooField.value = 'one'
            up.validate(fooField)

            barField.value = 'two'
            up.validate(barField)

            await wait()

            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('foo bar')
            expect(jasmine.lastRequest().data()).toMatchParams({ foo: 'one', bar: 'two' })
          })

          it('does not crash if an origin for a pending batch is destroyed', async function() {
            const form = fixture('form[action=/path]')
            const fooField = e.affix(form, 'input[name=foo][up-validate="#foo-target"]')
            const fooTarget = e.affix(form, '#foo-target')
            const barField = e.affix(form, 'input[name=bar][up-validate="#bar-target"]')
            const barTarget = e.affix(form, '#bar-target')

            up.validate(fooField)
            up.validate(barField)

            up.destroy(fooField)

            await wait()

            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('foo bar')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('#foo-target, #bar-target')
          })

          it('does not crash if an target for a pending batch is destroyed before the validation request is sent', async function() {
            const form = fixture('form[action=/path]')
            const fooField = e.affix(form, 'input[name=foo][up-validate="#foo-target"]')
            const fooTarget = e.affix(form, '#foo-target')
            const barField = e.affix(form, 'input[name=bar][up-validate="#bar-target"]')
            const barTarget = e.affix(form, '#bar-target')

            up.validate(fooField)
            up.validate(barField)

            up.destroy(fooTarget)

            await wait()

            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('foo bar')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('#bar-target')
          })

          it('does not crash if an target for a pending batch is detached while the validation request is loading', async function() {
            const form = fixture('form[action=/path][method=post]')
            const fooField = e.affix(form, 'input[name=foo][up-validate="#foo-target"]')
            const fooTarget = e.affix(form, '#foo-target', { text: 'old foo target' })
            const barField = e.affix(form, 'input[name=bar][up-validate="#bar-target"]')
            const barTarget = e.affix(form, '#bar-target', { text: 'new bar target' })

            const validateFooPromise = up.validate(fooField)
            const validateBarPromise = up.validate(barField)

            await wait()

            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('foo bar')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('#foo-target, #bar-target')

            fooTarget.remove()

            jasmine.respondWith(`
              <div id="foo-target">new foo target</div>
              <div id="bar-target">new bar target</div>
            `)

            await wait()

            expect(document).not.toHaveSelector('#foo-target')
            expect('#bar-target').toHaveText('new bar target')
          })

          it('keeps validation targets from aborted fragments for a pending batch (as the fragment may have been updated with a new version)', async function() {
            const form = fixture('form[action=/path]')
            const fooGroup = e.affix(form, '[up-form-group]')
            const fooField = e.affix(fooGroup, 'input[name=foo]')
            const barGroup = e.affix(form, '[up-form-group]')
            const barField = e.affix(barGroup, 'input[name=bar]')
            const bazGroup = e.affix(form, '[up-form-group]')
            const bazField = e.affix(bazGroup, 'input[name=baz]')

            up.validate(fooField)
            up.validate(bazField)

            up.fragment.abort(fooGroup)

            await wait()

            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('foo baz')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('[up-form-group]:has(input[name="foo"]), [up-form-group]:has(input[name="baz"])')
          })

          it('removes a pending batch when the entire form element is destroyed', async function() {
            const form = fixture('form[action=/path]')
            const fooGroup = e.affix(form, '[up-form-group]')
            const fooField = e.affix(fooGroup, 'input[name=foo]')
            const barGroup = e.affix(form, '[up-form-group]')
            const barField = e.affix(barGroup, 'input[name=bar]')
            const bazGroup = e.affix(form, '[up-form-group]')
            const bazField = e.affix(bazGroup, 'input[name=baz]')

            const validateFooPromise = up.validate(fooField)
            const validateBarPromise = up.validate(bazField)

            up.destroy(form)

            await expectAsync(validateFooPromise).toBeRejectedWith(jasmine.any(up.Aborted))
            await expectAsync(validateBarPromise).toBeRejectedWith(jasmine.any(up.Aborted))

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(0)
          })
        })

        describe('disabling', function() {

          it('does not batch with up.form.config.validateBatch = false', async function() {
            up.form.config.validateBatch = false

            const form = fixture('form[action=/path]')
            const fooField = e.affix(form, 'input[name=foo][up-validate="#foo-target"]')
            const fooTarget = e.affix(form, '#foo-target', { text: 'old foo target' })
            const barField = e.affix(form, 'input[name=bar][up-validate="#bar-target"]')
            const barTarget = e.affix(form, '#bar-target', { text: 'old bar target' })

            up.validate(fooField)
            up.validate(barField)
            await wait()

            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('foo')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('#foo-target')

            jasmine.respondWithSelector('#foo-target', { text: 'new foo target' })
            await wait()

            expect('#foo-target').toHaveText('new foo target')
            expect('#bar-target').toHaveText('old bar target')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('bar')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('#bar-target')

            jasmine.respondWithSelector('#bar-target', { text: 'new bar target' })
            await wait()

            expect('#foo-target').toHaveText('new foo target')
            expect('#bar-target').toHaveText('new bar target')
          })

          it('does not batch with form[up-validate-batch=false]', async function() {
            const form = fixture('form[action=/path][up-validate-batch=false]')
            const fooField = e.affix(form, 'input[name=foo][up-validate="#foo-target"]')
            const fooTarget = e.affix(form, '#foo-target', { text: 'old foo target' })
            const barField = e.affix(form, 'input[name=bar][up-validate="#bar-target"]')
            const barTarget = e.affix(form, '#bar-target', { text: 'old bar target' })

            up.validate(fooField)
            up.validate(barField)
            await wait()

            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('foo')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('#foo-target')

            jasmine.respondWithSelector('#foo-target', { text: 'new foo target' })
            await wait()

            expect('#foo-target').toHaveText('new foo target')
            expect('#bar-target').toHaveText('old bar target')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('bar')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('#bar-target')

            jasmine.respondWithSelector('#bar-target', { text: 'new bar target' })
            await wait()

            expect('#foo-target').toHaveText('new foo target')
            expect('#bar-target').toHaveText('new bar target')
          })

          it('allows individual elements to opt out of batching with [up-validate-batch=false]', async function() {
            const form = fixture('form[action=/path]')
            const fooField = e.affix(form, 'input[name=foo][up-validate="#foo-target"]')
            const fooTarget = e.affix(form, '#foo-target', { text: 'old foo target' })
            const barField = e.affix(form, 'input[name=bar][up-validate="#bar-target"][up-validate-batch="false"]')
            const barTarget = e.affix(form, '#bar-target', { text: 'old bar target' })
            const bazField = e.affix(form, 'input[name=baz][up-validate="#baz-target"][up-validate-batch="false"]')
            const bazTarget = e.affix(form, '#baz-target', { text: 'old baz target' })
            const quxField = e.affix(form, 'input[name=qux][up-validate="#qux-target"]')
            const quxTarget = e.affix(form, '#qux-target', { text: 'old qux target' })

            up.validate(fooField)
            up.validate(barField)
            up.validate(bazField)
            up.validate(quxField)
            await wait()

            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('foo qux')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('#foo-target, #qux-target')

            jasmine.respondWith(`
              <div id="foo-target">new foo target</div> 
              <div id="qux-target">new qux target</div> 
            `)
            await wait()

            expect('#foo-target').toHaveText('new foo target')
            expect('#bar-target').toHaveText('old bar target')
            expect('#baz-target').toHaveText('old baz target')
            expect('#qux-target').toHaveText('new qux target')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('bar')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('#bar-target')

            jasmine.respondWithSelector('#bar-target', { text: 'new bar target' })
            await wait()

            expect('#foo-target').toHaveText('new foo target')
            expect('#bar-target').toHaveText('new bar target')
            expect('#baz-target').toHaveText('old baz target')
            expect('#qux-target').toHaveText('new qux target')

            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('baz')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('#baz-target')

            jasmine.respondWithSelector('#baz-target', { text: 'new baz target' })
            await wait()

            expect('#foo-target').toHaveText('new foo target')
            expect('#bar-target').toHaveText('new bar target')
            expect('#baz-target').toHaveText('new baz target')
            expect('#qux-target').toHaveText('new qux target')
          })

          it('allows individual elements to opt out of batching with up.validate({ batch: false })', async function() {
            const form = fixture('form[action=/path]')
            const fooField = e.affix(form, 'input[name=foo][up-validate="#foo-target"]')
            const fooTarget = e.affix(form, '#foo-target', { text: 'old foo target' })
            const barField = e.affix(form, 'input[name=bar][up-validate="#bar-target"]')
            const barTarget = e.affix(form, '#bar-target', { text: 'old bar target' })
            const bazField = e.affix(form, 'input[name=baz][up-validate="#baz-target"]')
            const bazTarget = e.affix(form, '#baz-target', { text: 'old baz target' })
            const quxField = e.affix(form, 'input[name=qux][up-validate="#qux-target"]')
            const quxTarget = e.affix(form, '#qux-target', { text: 'old qux target' })

            up.validate(fooField)
            up.validate(barField, { batch: false })
            up.validate(bazField, { batch: false })
            up.validate(quxField)
            await wait()

            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('foo qux')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('#foo-target, #qux-target')

            jasmine.respondWith(`
              <div id="foo-target">new foo target</div> 
              <div id="qux-target">new qux target</div> 
            `)
            await wait()

            expect('#foo-target').toHaveText('new foo target')
            expect('#bar-target').toHaveText('old bar target')
            expect('#baz-target').toHaveText('old baz target')
            expect('#qux-target').toHaveText('new qux target')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('bar')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('#bar-target')

            jasmine.respondWithSelector('#bar-target', { text: 'new bar target' })
            await wait()

            expect('#foo-target').toHaveText('new foo target')
            expect('#bar-target').toHaveText('new bar target')
            expect('#baz-target').toHaveText('old baz target')
            expect('#qux-target').toHaveText('new qux target')

            expect(jasmine.lastRequest().requestHeaders['X-Up-Validate']).toEqual('baz')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('#baz-target')

            jasmine.respondWithSelector('#baz-target', { text: 'new baz target' })
            await wait()

            expect('#foo-target').toHaveText('new foo target')
            expect('#bar-target').toHaveText('new bar target')
            expect('#baz-target').toHaveText('new baz target')
            expect('#qux-target').toHaveText('new qux target')

          })

        })

      })
    })

  })

})
