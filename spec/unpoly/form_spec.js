const u = up.util
const e = up.element
const $ = jQuery

describe('up.form', function() {

  describe('JavaScript functions', function() {

    describe('up.form.get()', function() {

      describe('for a form element', function() {

        it('returns the form element', function() {
          const form = fixture('form')
          expect(up.form.get(form)).toBe(form)
        })

      })

      describe('for a field element', function() {

        it('returns an ancestor form', function() {
          const [form, group, input] = htmlFixtureList(`
            <form>
              <div id="group">
                <input type="text" name="email">
              </div>
            </form>
          `)

          expect(up.form.get(input)).toBe(form)
        })

        it('returns the associated form for a form-external field', function() {
          const [form, externalInput] = htmlFixtureList(`
            <form id="my-form">
            </form>
            <input form="my-form">
          `)

          expect(up.form.get(externalInput)).toBe(form)
        })

        it('returns the associated form for a form-external field when multiple layers have the same form[id]', function() {
          const html = `
            <div id="container">
              <form id="my-form">
              </form>
              <input id="my-field" form="my-form">
            </div>
          `

          makeLayers([
            { fragment: html },
            { fragment: html },
          ])

          expect(up.layer.count).toBe(2)

          let rootForm = up.fragment.get('#my-form', { layer: 'root' })
          let rootInput = up.fragment.get('#my-field', { layer: 'root' })
          expect(rootForm).toBeAttached()
          expect(rootInput).toBeAttached()

          let overlayForm = up.fragment.get('#my-form', { layer: 'overlay' })
          let overlayInput = up.fragment.get('#my-field', { layer: 'overlay' })
          expect(overlayForm).toBeAttached()
          expect(overlayInput).toBeAttached()

          expect(up.form.get(rootInput)).toBe(rootForm)
          expect(up.form.get(overlayInput)).toBe(overlayForm)
        })

      })


      describe('for a div', function() {

        it('returns the closest form', function() {
          const [form, group, input] = htmlFixtureList(`
            <form>
              <div id="group">
                <input type="text" name="email">
              </div>
            </form>
          `)

          expect(up.form.get(group)).toBe(form)
        })

        it('returns a missing value if the div is not in a form', function() {
          const [div] = htmlFixtureList('<div></div>')

          expect(up.form.get(div)).toBeMissing()
        })

      })



    })

    describe('up.form.fields()', function() {

      describe('custom form fields', function() {

        it('does not include buttons, fieldsets or outputs, which the :enabled selector also matches', function() {
          const [form, textField] = htmlFixtureList(`
            <form>
              <input name="email" type="text">
              <input type="submit">
              <input type="image" name="image">
              <input type="button">
              <button type="submit">Submit</button>
              <button type="button">Push</button>
              <fieldset></fieldset>
              <output name="output"></output>
            </form>
          `)

          expect(up.form.fields(form)).toMatchList([textField])
        })

        it('includes a form-associated custom element without configuration', function() {
          const [form, field] = htmlFixtureList(`
            <form>
              <test-form-associated-element name="email" value="foo@example.com"></test-form-associated-element>
            </form>
          `)

          expect(up.form.fields(form)).toMatchList([field])
        })

        it('includes a form-associated custom element that is [disabled]', function() {
          const [form, field] = htmlFixtureList(`
            <form>
              <test-form-associated-element name="email" value="foo@example.com" disabled></test-form-associated-element>
            </form>
          `)

          expect(up.form.fields(form)).toMatchList([field])
        })

        it('includes a custom element that is configured in up.form.config.fieldSelectors', function() {
          up.form.config.fieldSelectors.push('test-form-field')

          const [form, field] = htmlFixtureList(`
            <form>
              <test-form-field name="email" value="foo@example.com"></test-form-field>
            </form>
          `)

          expect(up.form.fields(form)).toMatchList([field])
        })

        it('does not include a custom element that is not configured', function() {
          const [form] = htmlFixtureList(`
            <form>
              <test-form-field name="email" value="foo@example.com"></test-form-field>
            </form>
          `)

          expect(up.form.fields(form)).toMatchList([])
        })

        it("includes a configured custom element outside the form with a [form] attribute matching the form's ID", function() {
          up.form.config.fieldSelectors.push('test-form-field')

          const [form] = htmlFixtureList('<form id="form-id"></form>')
          const [outside] = htmlFixtureList('<test-form-field name="email" value="foo@example.com" form="form-id"></test-form-field>')

          expect(up.form.fields(form)).toMatchList([outside])
        })

      })


      it('returns a list of form fields within the given element', function() {
        const form = fixture('form')
        const textField = e.affix(form, 'input[name=email][type=text]')
        const select = e.affix(form, 'select')
        const results = up.form.fields(form)
        expect(results).toMatchList([textField, select])
      })

      it('returns an empty list if the given element contains no form fields', function() {
        const form = fixture('form')
        const results = up.form.fields(form)
        expect(results).toMatchList([])
      })

      it('returns a list of the given element if the element is itself a form field', function() {
        const textArea = fixture('textarea')
        const results = up.form.fields(textArea)
        expect(results).toMatchList([textArea])
      })

      it('ignores fields outside the given form', function() {
        const form1 = fixture('form')
        const form1Field = e.affix(form1, 'input[name=email][type=text]')
        const form2 = fixture('form')
        const form2Field = e.affix(form2, 'input[name=email][type=text]')
        const results = up.form.fields(form1)
        expect(results).toMatchList([form1Field])
      })

      it("includes fields outside the form with a [form] attribute matching the given form's ID", function() {
        const form = fixture('form#form-id')
        const insideField = e.affix(form, 'input[name=email][type=text]')
        const outsideField = fixture('input[name=password][type=text][form=form-id]')
        const results = up.form.fields(form)
        expect(results).toMatchList([insideField, outsideField])
      })

      it("does not return duplicate fields if a field with a matching [form] attribute is also a child of the form", function() {
        const form = fixture('form#form-id')
        const field = e.affix(form, 'input[name=email][type=text][form=form-id]')
        const results = up.form.fields(form)
        expect(results).toMatchList([field])
      })
    })

    require('./form_track_fields_spec')

    describe('up.autosubmit()', function() {

      beforeEach(function() { up.form.config.watchInputDelay = 0 })

      it('submits the form when a change is observed in the given form field', async function() {
        const form = fixture('form')
        const field = e.affix(form, 'input[name="input-name"][value="old-value"]')
        up.autosubmit(field)
        const submitSpy = up.form.submit.mock().and.returnValue(Promise.resolve(new up.RenderResult()))
        await wait()

        expect(submitSpy).not.toHaveBeenCalled()

        field.value = 'new-value'
        Trigger.change(field)

        await wait()

        expect(submitSpy).toHaveBeenCalledWith(field, jasmine.any(Object))
      })

      it('parses [up-watch...] prefixed attributes from the given field', async function() {
        const form = fixture('form')
        const field = e.affix(form, 'input[name="input-name"][value="old-value"][up-watch-delay="40"]')
        up.autosubmit(field)
        const submitSpy = up.form.submit.mock().and.returnValue(Promise.resolve(new up.RenderResult()))
        await wait()

        expect(submitSpy).not.toHaveBeenCalled()

        field.value = 'new-value'
        Trigger.change(field)
        await wait()

        expect(submitSpy).not.toHaveBeenCalled()
        await wait(60)

        expect(submitSpy).toHaveBeenCalled()
      })

      it('accepts options to override [up-watch...] prefixed attributes parsed from the given field', async function() {
        const form = fixture('form')
        const field = e.affix(form, 'input[name="input-name"][value="old-value"][up-watch-delay="40"]')
        up.autosubmit(field, { delay: 0 })
        const submitSpy = up.form.submit.mock().and.returnValue(Promise.resolve(new up.RenderResult()))
        await wait()

        expect(submitSpy).not.toHaveBeenCalled()

        field.value = 'new-value'
        Trigger.change(field)
        await wait()

        expect(submitSpy).toHaveBeenCalled()
      })

      it('accepts additional options for the render pass', async function() {
        const form = fixture('form')
        const field = e.affix(form, 'input[name="input-name"][value="old-value"]')
        up.autosubmit(field, { headers: { 'Custom-Header': 'Custom-Value' }, params: { 'custom-param': 'custom-value' } })
        const submitSpy = up.form.submit.mock().and.returnValue(Promise.resolve(new up.RenderResult()))
        await wait()

        expect(submitSpy).not.toHaveBeenCalled()

        field.value = 'new-value'
        Trigger.change(field)
        await wait()

        expect(submitSpy).toHaveBeenCalledWith(
          field,
          jasmine.objectContaining({ headers: { 'Custom-Header': 'Custom-Value' }, params: { 'custom-param': 'custom-value' } })
        )
      })
    })

    describe('up.form.groupSolution()', function() {

      it('returns a solution for the form group closest to the given element, distinguishing the selector from other form groups by refering to the given element with :has()', function() {
        const form = fixture('form')
        const group = e.affix(form, '[up-form-group]')
        const input = e.affix(group, 'input[name=foo]')

        const groupSolution = up.form.groupSolution(input)

        expect(groupSolution).toEqual(jasmine.objectContaining({
          element: group,
          target: '[up-form-group]:has(input[name="foo"])'
        }))
      })

      it('returns the form if no closer group exists', function() {
        const form = fixture('form#foo-form')
        const container = e.affix(form, 'div')
        const input = e.affix(container, 'input[name=foo]')

        const groupSolution = up.form.groupSolution(input)

        expect(groupSolution).toEqual(jasmine.objectContaining({
          element: form,
          target: '#foo-form'
        }))
      })

      it('returns the form if a strong selector can be derived from neither group nor input', function() {
        const form = fixture('form#foo-form')
        const container = e.affix(form, '[up-form-group]')
        const input = e.affix(container, 'input')

        const groupSolution = up.form.groupSolution(input)

        expect(groupSolution).toEqual(jasmine.objectContaining({
          element: form,
          target: '#foo-form'
        }))
      })

      it("does not consider a form group's [class] to be a strong selector and prefers to :has()", function() {
        const form = fixture('form#foo-form')
        const container = e.affix(form, '[up-form-group].form-group')
        const input = e.affix(container, 'input[name=foo]')

        const groupSolution = up.form.groupSolution(input)

        expect(groupSolution).toEqual(jasmine.objectContaining({
          element: container,
          target: '[up-form-group]:has(input[name="foo"])'
        }))
      })

      it('does not append a :has(...) if the given element is already a group', function() {
        const form = fixture('form')
        const group = e.affix(form, '#group[up-form-group]')

        const groupSolution = up.form.groupSolution(group)

        expect(groupSolution).toEqual(jasmine.objectContaining({
          element: group,
          target: '#group'
        }))
      })

      it('does not append a :has(...) for the input if the group already has a good selector itself', function() {
        const form = fixture('form')
        const group = e.affix(form, '#group[up-form-group]')
        const input = e.affix(group, 'input[name=foo]')

        const groupSolution = up.form.groupSolution(input)

        expect(groupSolution).toEqual(jasmine.objectContaining({
          element: group,
          target: '#group'
        }))
      })
    })

    describe('up.form.groupSelectors()', function() {

      it('returns the configured up.form.config.groupSelectors', function() {
        up.form.config.groupSelectors = ['.form-group']

        expect(up.form.groupSelectors()).toEqual(['.form-group'])
      })

      if (up.migrate.loaded) {
        it('removes a :has(&) suffix from custom user selectors', function() {
          up.form.config.groupSelectors = ['.form-group:has(&)']

          expect(up.form.groupSelectors()).toEqual(['.form-group'])
        })

        it('removes a :has(:origin) suffix from custom user selectors', function() {
          up.form.config.groupSelectors = ['.form-group:has(:origin)']

          expect(up.form.groupSelectors()).toEqual(['.form-group'])
        })
      }
    })

    describe('up.form.submitButtons()', function() {
      it("returns the given form's submit buttons", function() {
        const form = fixture('form')
        const submitButton = e.affix(form, 'button[type=submit]')
        const submitInput = e.affix(form, 'input[type=submit]')
        const otherButton = e.affix(form, 'button[type=reset]')
        const otherInput = e.affix(form, 'input[name=text-field][type=text]')

        const result = up.form.submitButtons(form)
        expect(result).toEqual(jasmine.arrayWithExactContents([submitButton, submitInput]))
      })

      it("includes fields outside the form with a [form] attribute matching the given form's ID", function() {
        const form = fixture('form#form-id')
        const insideButton = e.affix(form, 'input[type=submit][value="Submit inside"]')
        const outsideButton = fixture('input[type=submit][form=form-id][value="Submit outside"]')
        const results = up.form.submitButtons(form)
        expect(results).toMatchList([insideButton, outsideButton])
      })
    })

    require('./form_watch_fn_spec')

    if (up.migrate.loaded) {
      describe('up.observe()', function() {
        describe('with an array of fields', function() {

          it("runs the callback if the value of any field changes", async function() {
            const form = fixture('form')
            const input1 = e.affix(form, 'input[name="foo"][value="old-foo"]')
            const input2 = e.affix(form, 'input[name="bar"][value="old-bar"]')
            const callback = jasmine.createSpy('change callback')
            up.observe([input1, input2], callback)

            input1.value = 'new-foo'
            Trigger.input(input1)

            await wait()

            expect(callback.calls.count()).toEqual(1)
            expect(callback.calls.argsFor(0)).toEqual(['new-foo', 'foo', jasmine.anything()])

            input2.value = 'new-bar'
            Trigger.input(input2)

            await wait()

            expect(callback.calls.count()).toEqual(2)
            expect(callback.calls.argsFor(1)).toEqual(['new-bar', 'bar', jasmine.anything()])
          })

          it('does not run the callback if another field inside the same form changes', async function() {
            const form = fixture('form')
            const input1 = e.affix(form, 'input[name="foo"][value="old-foo"]')
            const input2 = e.affix(form, 'input[name="bar"][value="old-bar"]')
            const input3 = e.affix(form, 'input[name="baz"][value="old-baz"]')

            const callback = jasmine.createSpy('change callback')
            up.observe([input1, input2], callback)

            input3.value = 'new-foo'
            Trigger.input(input3)

            await wait()

            expect(callback).not.toHaveBeenCalled()
          })
        })
      })
    }

    describe('up.form.watchOptions()', function() {

      it('parses the closest [up-watch-event] attribute into an { event } option', function() {
        const form = fixture('form')
        const container = e.affix(form, 'div[up-watch-event="my:event"]')
        const field = e.affix(container, 'input[type="text"][name="foo"]')

        const options = up.form.watchOptions(field)

        expect(options.event).toBe('my:event')
      })

      it('expands [up-watch-event="change"] into up.form.config.watchChangeEvents', function() {
        const form = fixture('form')
        const field = e.affix(form, 'input[type="text"][name="foo"][up-watch-event="change"]')
        up.form.config.watchChangeEvents = ['change', 'blur']

        const options = up.form.watchOptions(field)

        expect(options.event).toEqual(['change', 'blur'])
      })

      it('expands [up-watch-event="input"] into up.form.config.watchInputEvents', function() {
        const form = fixture('form')
        const field = e.affix(form, 'input[type="text"][name="foo"][up-watch-event="input"]')
        up.form.config.watchInputEvents = ['custom:event']

        const options = up.form.watchOptions(field)

        expect(options.event).toEqual(['custom:event'])
      })

      it('accepts a parser option { defaults } with defaults that can be overridden with any attribute or option', function() {
        const form = fixture('form[up-watch-disable=false]')
        const field = e.affix(form, 'input[type="text"][name="foo"]')

        const options = up.form.watchOptions(field, {}, { defaults: { disable: true, feedback: true } })

        expect(options).toEqual(jasmine.objectContaining({ disable: false, feedback: true }))
      })

      it('parses status effect options with an [up-watch-] prefix', function() {
        const form = fixture('form')
        const container = e.affix(form, 'div[up-watch-disable="#disable"][up-watch-feedback="false"][up-watch-preview="my-preview"][up-watch-placeholder="#placeholder"]')
        const field = e.affix(container, 'input[type="text"][name="foo"]')

        const options = up.form.watchOptions(field)

        expect(options).toEqual(
          jasmine.objectContaining({
            disable: '#disable',
            feedback: false,
            preview: 'my-preview',
            placeholder: '#placeholder'
          })
        )
      })

      it('prioritizes the closest [up-watch-] prefixed attribute', function() {
        const form = fixture('form[up-watch-delay=1000]')
        const container = e.affix(form, 'div[up-watch-delay=500]')
        const field = e.affix(container, 'input[type="text"][name="foo"]')

        const options = up.form.watchOptions(field)

        expect(options).toEqual(jasmine.objectContaining({ delay: 500 }))
      })

      it('overrides all attributes with the given options hash', function() {
        const form = fixture('form[up-watch-delay=1000]')
        const field = e.affix(form, 'input[type="text"][name="foo"]')

        const options = up.form.watchOptions(field, { delay: 300 })

        expect(options).toEqual(jasmine.objectContaining({ delay: 300 }))
      })
    })

    describe('up.form.validateOptions()', function() {

      it('parses the closest [up-validate-url] attribute into a { url } option', function() {
        const form = fixture('form[action="/path1"]')
        const container = e.affix(form, 'div[up-validate-url="/path2"]')
        const field = e.affix(container, 'input[type="text"][name="foo"]')

        const options = up.form.validateOptions(field)

        expect(options.url).toBe('/path2')
      })

      it('parses the closest [up-validate-batch] attribute into a { batch } option', function() {
        const form = fixture('form[action="/path1"]')
        const container = e.affix(form, 'div[up-validate-batch="false"]')
        const field = e.affix(container, 'input[type="text"][name="foo"]')
        const fieldOutsideContainer = e.affix(form, 'input[type="text"][name="foo"]')

        expect(up.form.validateOptions(field).batch).toBe(false)
        expect(up.form.validateOptions(fieldOutsideContainer).batch).toBe(true)
      })

      it('parses the closest [up-validate-params] attribute into a { params } option', function() {
        const form = fixture('form[action="/path1"]')
        const container = e.affix(form, 'div[up-validate-params="{ foo: 1, bar: 2 }"]')
        const field = e.affix(container, 'input[type="text"][name="foo"]')

        const options = up.form.validateOptions(field)

        expect(options.params).toEqual({ foo: 1, bar: 2 })
      })

      it('parses the closest [up-validate-headers] attribute into a { headers } option', function() {
        const form = fixture('form[action="/path1"]')
        const container = e.affix(form, 'div[up-validate-headers="{ foo: 1, bar: 2 }"]')
        const field = e.affix(container, 'input[type="text"][name="foo"]')

        const options = up.form.validateOptions(field)

        expect(options.headers).toEqual({ foo: 1, bar: 2 })
      })

      it('parses the closest [up-watch-event] attribute into an { event } option', function() {
        const form = fixture('form')
        const container = e.affix(form, 'div[up-watch-event="my:event"]')
        const field = e.affix(container, 'input[type="text"][name="foo"]')

        const options = up.form.validateOptions(field)

        expect(options.event).toBe('my:event')
      })

      it('parses status effect options with an [up-watch-] prefix', function() {
        const form = fixture('form')
        const container = e.affix(form, 'div[up-watch-disable="#disable"][up-watch-feedback="false"][up-watch-preview="my-preview"][up-watch-placeholder="#placeholder"]')
        const field = e.affix(container, 'input[type="text"][name="foo"]')

        const options = up.form.validateOptions(field)

        expect(options).toEqual(
          jasmine.objectContaining({
            disable: '#disable',
            feedback: false,
            preview: 'my-preview',
            placeholder: '#placeholder'
          })
        )
      })

    })

    require('./form_submit_fn_spec')

    describe('up.form.submitOptions()', function() {

      it('parses the render options that would be used to submit the given form', function() {
        const form = fixture('form[action="/path"][up-method="PUT"][up-layer="new"]')
        const input = e.affix(form, 'input[name=name][value=value]')
        const options = up.form.submitOptions(form)
        expect(options.url).toEqual('/path')
        expect(options.method).toEqual('PUT')
        expect(options.layer).toEqual('new')
        expect(options.params.toQuery()).toBe('name=value')
      })

      it('does not render', function() {
        spyOn(up, 'render')
        const form = fixture('form[action="/path"][up-method="PUT"][up-layer="new"]')
        const options = up.form.submitOptions(form)
        expect(up.render).not.toHaveBeenCalled()
      })

      it('parses the form method from a [data-method] attribute so we can replace the Rails UJS adapter with Unpoly', function() {
        const form = fixture('form[action="/path"][data-method="patch"]')
        const options = up.form.submitOptions(form)
        expect(options.method).toEqual('PATCH')
      })

      it('assumes the default method GET', function() {
        const form = fixture('form[action="/path"]')
        const options = up.form.submitOptions(form)
        expect(options.method).toEqual('GET')
      })

      it("parses the form's [up-disable] attribute", function() {
        const formWithDisable = fixture('form.with-disable[up-disable=true]')
        const formWithoutDisable = fixture('form.without-disable[up-disable=false]')
        expect(up.form.submitOptions(formWithDisable).disable).toBe(true)
        expect(up.form.submitOptions(formWithoutDisable).disable).toBe(false)
      })

      describe('with { params } option', function() {

        it('adds the given to the params parsed from form fields', function() {
          const form = fixture('form[action="/path"][up-method="post"][up-layer="new"]')
          const input = e.affix(form, 'input[name=foo][value=1]')
          const options = up.form.submitOptions(form, { params: { bar: 2 } })
          expect(options.params.toQuery()).toBe('foo=1&bar=2')
        })

        it('removes an existing param with the same name', function() {
          const form = fixture('form[action="/path"][up-method="post"][up-layer="new"]')
          const input = e.affix(form, 'input[name=foo][value=1]')
          const options = up.form.submitOptions(form, { params: { foo: 2 } })
          expect(options.params.toQuery()).toBe('foo=2')
        })

        it('removes an existing array param with the same name', function() {
          const form = fixture('form[action="/path"][up-method="post"][up-layer="new"]')
          e.affix(form, 'input', { name: 'foo[]', value: '1' })
          fixture('input', { name: 'foo[]', value: '2' })
          const options = up.form.submitOptions(form, { params: { 'foo[]': [3, 4] } })
          expect(options.params.toQuery()).toBe('foo%5B%5D=3&foo%5B%5D=4')
        })

      })

      describe('submit button overrides', function() {

        describe('method and URL', function() {

          it('uses action and method from the form if no submit button exists', function() {
            let [form] = htmlFixtureList(`
              <form method="form-method" action="/form-action">
              </form>
            `)

            expect(up.form.submitOptions(form)).toEqual(jasmine.objectContaining({
              method: 'FORM-METHOD',
              url: '/form-action',
            }))
          })

          it('lets the given submit button override destination with standard [formaction], [formmethod] attributes', function() {
            let [form, submitButton1, submitButton2] = htmlFixtureList(`
              <form method="form-method" action="/form-action">
                <button type="submit" formmethod="button1-method" formaction="/button1-action">Submit 1</button>
                <button type="submit" formmethod="button2-method" formaction="/button2-action">Submit 2</button>
              </form>
            `)

            let options = up.form.submitOptions(form, { submitButton: submitButton2 })

            expect(options).toEqual(jasmine.objectContaining({
              method: 'BUTTON2-METHOD',
              url: '/button2-action',
            }))
          })

          it('uses destination from the form if the given submit button has no overriding attributes', function() {
            let [form, submitButton1, submitButton2] = htmlFixtureList(`
              <form method="form-method" action="/form-action">
                <button type="submit" formmethod="button1-method" formaction="/button1-action">Submit 1</button>
                <button type="submit">Submit 2</button>
              </form>
            `)

            let options = up.form.submitOptions(form, { submitButton: submitButton2 })

            expect(options).toEqual(jasmine.objectContaining({
              method: 'FORM-METHOD',
              url: '/form-action',
            }))
          })

          it('uses overrides from the first submit button if no explicit { submitButton } is passed', function() {
            let [form, submitButton] = htmlFixtureList(`
              <form method="form-method" action="/form-action">
                <button type="submit" formmethod="button1-method" formaction="/button1-action">Submit 1</button>
                <button type="submit" formmethod="button2-method" formaction="/button2-action">Submit 2</button>
              </form>
            `)

            let options = up.form.submitOptions(form)

            expect(options).toEqual(jasmine.objectContaining({
              method: 'BUTTON1-METHOD',
              url: '/button1-action',
            }))
          })

          it('uses destination from the form if the form has submit buttons, but { submitButton: false } is passed', function() {
            let [form, submitButton] = htmlFixtureList(`
              <form method="form-method" action="/form-action">
                <button type="submit" formmethod="button1-method" formaction="/button1-action">Submit 1</button>
                <button type="submit" formmethod="button2-method" formaction="/button2-action">Submit 2</button>
              </form>
            `)

            let options = up.form.submitOptions(form, { submitButton: false })

            expect(options).toEqual(jasmine.objectContaining({
              method: 'FORM-METHOD',
              url: '/form-action',
            }))
          })

        })

        describe('params', function() {

          it('uses only field params if neither form nor submit button has [up-params]', function() {
            let [form] = htmlFixtureList(`
              <form action="/action">
                <input type="text" name="field-name" value="field-value">
                <button type="submit"></button>
              </form>
            `)

            let options = up.form.submitOptions(form)

            expect(options.params).toEqual(new up.Params([
              { name: 'field-name', value: 'field-value' }
            ]))
          })

          it('includes the [name] and [value] of the default submit button', function() {
            let [form] = htmlFixtureList(`
              <form action="/action" up-params="{ 'form-name': 'form-value' }">
                <input type="text" name="field-name" value="field-value">
                <button type="submit" name="button-name" value="button-value-1"></button>
                <button type="submit" name="button-name" value="button-value-2"></button>
              </form>
            `)

            let options = up.form.submitOptions(form)

            expect(options.params).toEqual(new up.Params([
              { name: 'field-name', value: 'field-value' },
              { name: 'form-name', value: 'form-value' },
              { name: 'button-name', value: 'button-value-1' },
            ]))
          })

          it('includes the [name] and [value] of a default submit button that is form-external (with [form] attr)', function() {
            let [form, externalSubmitButton] = htmlFixtureList(`
              <form action="/action" up-params="{ 'form-name': 'form-value' }" id="form-id">
                <input type="text" name="field-name" value="field-value">
              </form>

              <button type="submit" name="button-name" value="button-value-1" form="form-id"></button>
            `)

            let options = up.form.submitOptions(form)

            expect(options.params).toEqual(new up.Params([
              { name: 'field-name', value: 'field-value' },
              { name: 'form-name', value: 'form-value' },
              { name: 'button-name', value: 'button-value-1' },
            ]))
          })

          it('includes the [name] and [value] of the given submit button', function() {
            let [form, submitButton1, submitButton2] = htmlFixtureList(`
              <form action="/action" up-params="{ 'form-name': 'form-value' }">
                <input type="text" name="field-name" value="field-value">
                <button type="submit" name="button-name" value="button-value-1"></button>
                <button type="submit" name="button-name" value="button-value-2"></button>
              </form>
            `)

            let options = up.form.submitOptions(form, { submitButton: submitButton2 })

            expect(options.params).toEqual(new up.Params([
              { name: 'field-name', value: 'field-value' },
              { name: 'form-name', value: 'form-value' },
              { name: 'button-name', value: 'button-value-1' },
            ]))
          })

          it('allows the form to define additional [up-params]', function() {
            let [form] = htmlFixtureList(`
              <form action="/action" up-params="{ 'form-name': 'form-value' }">
                <input type="text" name="field-name" value="field-value">
                <button type="submit"></button>
              </form>
            `)

            let options = up.form.submitOptions(form)

            expect(options.params).toEqual(new up.Params([
              { name: 'field-name', value: 'field-value' },
              { name: 'form-name', value: 'form-value' },
            ]))
          })

          it('allows the form and the default submit button to define additional [up-params]', function() {
            let [form] = htmlFixtureList(`
              <form action="/action" up-params="{ 'form-name': 'form-value' }">
                <input type="text" name="field-name" value="field-value">
                <button type="submit" up-params="{ 'button-name': 'button-value-1' }"></button>
                <button type="submit" up-params="{ 'button-name': 'button-value-2' }"></button>
              </form>
            `)

            let options = up.form.submitOptions(form)

            expect(options.params).toEqual(new up.Params([
              { name: 'field-name', value: 'field-value' },
              { name: 'form-name', value: 'form-value' },
              { name: 'button-name', value: 'button-value-1' },
            ]))
          })

          it('allows the form and the given submit button to define additional [up-params]', function() {
            let [form, submitButton1, submitButton2] = htmlFixtureList(`
              <form action="/action" up-params="{ 'form-name': 'form-value' }">
                <input type="text" name="field-name" value="field-value">
                <button type="submit" up-params="{ 'button-name': 'button-value-1' }"></button>
                <button type="submit" up-params="{ 'button-name': 'button-value-2' }"></button>
              </form>
            `)

            let options = up.form.submitOptions(form, { submitButton: submitButton2 })

            expect(options.params).toEqual(new up.Params([
              { name: 'field-name', value: 'field-value' },
              { name: 'form-name', value: 'form-value' },
              { name: 'button-name', value: 'button-value-1' },
            ]))
          })

          it('merges a { params } option into params from fields, form and submit button', function() {
            let [form, submitButton1, submitButton2] = htmlFixtureList(`
              <form action="/action" up-params="{ 'form-name': 'form-value' }">
                <input type="text" name="field-name" value="field-value">
                <button type="submit" up-params="{ 'button-name': 'button-value-1' }"></button>
                <button type="submit" up-params="{ 'button-name': 'button-value-2' }"></button>
              </form>
            `)

            let options = up.form.submitOptions(form, { submitButton: submitButton2, params: { 'options-name': 'options-value' } })

            expect(options.params).toEqual(new up.Params([
              { name: 'field-name', value: 'field-value' },
              { name: 'form-name', value: 'form-value' },
              { name: 'button-name', value: 'button-value-1' },
              { name: 'options-name', value: 'options-value' },
            ]))
          })

          it('ignores [name], [value] and [up-params] from the submit button if { submitButton: false } is passed', function() {
            let [form] = htmlFixtureList(`
              <form action="/action" up-params="{ 'form-name': 'form-value' }">
                <input type="text" name="field-name" value="field-value">
                <button type="submit" name="button-input-name" value="button-value-1" up-params="{ 'button-attr-name': 'button-attr-value-1' }"></button>
                <button type="submit" name="button-input-name" value="button-value-2" up-params="{ 'button-attr-name': 'button-attr-value-2' }"></button>
              </form>
            `)

            let options = up.form.submitOptions(form, { submitButton: false })

            expect(options.params).toEqual(new up.Params([
              { name: 'field-name', value: 'field-value' },
              { name: 'form-name', value: 'form-value' },
            ]))

          })

        })

        describe('headers', function() {

          it('parses no extra headers if neither form nor submit button has [up-headers]', function() {
            let [form] = htmlFixtureList(`
              <form action="/action">
                <button type="submit"></button>
              </form>
            `)

            let options = up.form.submitOptions(form)

            expect(options.headers).toBeBlank()
          })

          it('allows the form to set additional [up-headers]', function() {
            let [form] = htmlFixtureList(`
              <form action="/action" up-headers="{ 'form-name': 'form-value' }">
                <button type="submit"></button>
              </form>
            `)

            let options = up.form.submitOptions(form)

            expect(options.headers).toEqual({ 'form-name': 'form-value' })
          })

          it('allows the form and default submit button to set additional [up-headers]', function() {
            let [form] = htmlFixtureList(`
              <form action="/action" up-headers="{ 'form-name': 'form-value' }">
                <button type="submit" up-headers="{ 'button-name': 'button-value-1' }"</button>
                <button type="submit" up-headers="{ 'button-name': 'button-value-2' }"></button>
              </form>
            `)

            let options = up.form.submitOptions(form)

            expect(options.headers).toEqual({
              'form-name': 'form-value',
              'button-name': 'button-value-1',
            })
          })

          it('allows the form and given submit button to set additional [up-headers]', function() {
            let [form, submitButton1, submitButton2] = htmlFixtureList(`
              <form action="/action" up-headers="{ 'form-name': 'form-value' }">
                <button type="submit" up-headers="{ 'button-name': 'button-value-1' }"</button>
                <button type="submit" up-headers="{ 'button-name': 'button-value-2' }"></button>
              </form>
            `)

            let options = up.form.submitOptions(form, { submitButton: submitButton2 })

            expect(options.headers).toEqual({
              'form-name': 'form-value',
              'button-name': 'button-value-2',
            })
          })

          it('ignores [up-headers] from the submit button if { submitButton: false } is passed', function() {
            let [form, submitButton1, submitButton2] = htmlFixtureList(`
              <form action="/action" up-headers="{ 'form-name': 'form-value' }">
                <button type="submit" up-headers="{ 'button-name': 'button-value-1' }"</button>
                <button type="submit" up-headers="{ 'button-name': 'button-value-2' }"></button>
              </form>
            `)

            let options = up.form.submitOptions(form, { submitButton: false })

            expect(options.headers).toEqual({
              'form-name': 'form-value',
            })
          })

          it('merges a { headers } option into heades parsed from the form and submit button', function() {
            let [form, submitButton1, submitButton2] = htmlFixtureList(`
              <form action="/action" up-headers="{ 'form-name': 'form-value' }">
                <button type="submit" up-headers="{ 'button-name': 'button-value-1' }"</button>
                <button type="submit" up-headers="{ 'button-name': 'button-value-2' }"></button>
              </form>
            `)

            let options = up.form.submitOptions(form, { submitButton: submitButton2, headers: { 'options-name': 'options-value' } })

            expect(options.headers).toEqual({
              'form-name': 'form-value',
              'button-name': 'button-value-2',
              'options-name': 'options-value',
            })
          })

        })

        describe('targets', function() {

          it('uses targets from the form if no submit button exists', function() {
            let [form] = htmlFixtureList(`
              <form method="post" action="/action" up-target="#form-target" up-fail-target="#form-fail-target">
              </form>
            `)

            expect(up.form.submitOptions(form)).toEqual(jasmine.objectContaining({
              target: '#form-target',
              failTarget: '#form-fail-target',
            }))
          })

          it('lets the given submit button overrides form targets', function() {
            let [form, submitButton1, submitButton2] = htmlFixtureList(`
              <form method="post" action="/action" up-target="#form-target" up-fail-target="#form-fail-target">
                <button type="submit" up-target="#button1-target" up-fail-target="#button1-fail-target">Submit 1</button>
                <button type="submit" up-target="#button2-target" up-fail-target="#button2-fail-target">Submit 2</button>
              </form>
            `)

            let options = up.form.submitOptions(form, { submitButton: submitButton2 })

            expect(options).toEqual(jasmine.objectContaining({
              target: '#button2-target',
              failTarget: '#button2-fail-target',
            }))
          })

          it('uses targets from the form if the given submit button has no overriding attributes', function() {
            let [form, submitButton1, submitButton2] = htmlFixtureList(`
              <form method="post" action="/action" up-target="#form-target" up-fail-target="#form-fail-target">
                <button type="submit" up-target="#button1-target" up-fail-target="#button1-fail-target">Submit 1</button>
                <button type="submit">Submit 2</button>
              </form>
            `)

            let options = up.form.submitOptions(form, { submitButton: submitButton2 })

            expect(options).toEqual(jasmine.objectContaining({
              target: '#form-target',
              failTarget: '#form-fail-target',
            }))
          })

          it('uses overrides from the first submit button if no explicit { submitButton } is passed', function() {
            let [form, submitButton] = htmlFixtureList(`
              <form method="post" action="/action" up-target="#form-target" up-fail-target="#form-fail-target">
                <button type="submit" up-target="#button-target" up-fail-target="#button-fail-target">Submit me</button>
              </form>
            `)

            let options = up.form.submitOptions(form)

            expect(options).toEqual(jasmine.objectContaining({
              target: '#button-target',
              failTarget: '#button-fail-target',
            }))
          })

          it('uses overrides from the the form if the form has submit buttons, but { submitButton: false } is passed', function() {
            let [form, submitButton] = htmlFixtureList(`
              <form method="post" action="/action" up-target="#form-target" up-fail-target="#form-fail-target">
                <button type="submit" up-target="#button-target" up-fail-target="#button-fail-target">Submit me</button>
              </form>
            `)

            let options = up.form.submitOptions(form, { submitButton: false })

            expect(options).toEqual(jasmine.objectContaining({
              target: '#form-target',
              failTarget: '#form-fail-target',
            }))
          })

        })

      })

    })

    describe('up.form.submitButtonOverrides()', function() {

      it('returns an empty object for a plain button (as to not accidentally override options parses from the form)', function() {
        let [form, submitButton] = htmlFixtureList(`
          <form method="post" action="/action">
            <button type="submit">Submit me</button>
          </form>
        `)

        expect(up.form.submitButtonOverrides(submitButton)).toEqual({})
      })

      it('allows to override targets', function() {
        let [form, submitButton] = htmlFixtureList(`
          <form method="post" action="/action" up-target="#form-target" up-fail-target="#form-fail-target">
            <button type="submit" up-target="#button-target" up-fail-target="#button-fail-target">Submit me</button>
          </form>
        `)

        expect(up.form.submitButtonOverrides(submitButton)).toEqual({
          target: '#button-target',
          failTarget: '#button-fail-target',
        })
      })

      it('allows to override confirmation', function() {
        let [form, submitButton] = htmlFixtureList(`
          <form method="post" action="/action" up-confirm="form confirmation">
            <button type="submit" up-confirm="button confirmation">Submit me</button>
          </form>
        `)

        expect(up.form.submitButtonOverrides(submitButton)).toEqual({
          confirm: 'button confirmation',
        })
      })

      it('allows to override layer-related options', function() {
        let [form, submitButton] = htmlFixtureList(`
          <form method="post" action="/action" up-layer="root">
            <button type="submit" up-layer="new" up-mode="drawer" up-size="small">Submit me</button>
          </form>
        `)

        expect(up.form.submitButtonOverrides(submitButton)).toEqual({
          layer: 'new',
          mode: 'drawer',
          size: 'small',
        })
      })

    })

    describe('up.form.group()', function() {
      it('returns the closest form group around the given element', function() {
        const form = fixture('form')
        const group = e.affix(form, '[up-form-group]')
        const input = e.affix(group, 'input[name=email]')

        expect(up.form.group(input)).toBe(group)
      })
    })

    require('./form_validate_fn_spec')

    describe('up.form.disableTemp()', function() {

      describe('custom form fields', function() {

        it('disables a form-associated custom element without configuration', function() {
          const [form, field] = htmlFixtureList(`
            <form>
              <test-form-associated-element name="email" value="foo@example.com"></test-form-associated-element>
            </form>
          `)
          expect(field).not.toBeDisabled()

          const reenable = up.form.disableTemp(form)
          expect(field).toBeDisabled()

          reenable()
          expect(field).not.toBeDisabled()
        })

        it('disables a configured custom element through its { disabled } property', function() {
          up.form.config.fieldSelectors.push('test-form-field')

          const [form, field] = htmlFixtureList(`
            <form>
              <test-form-field name="email" value="foo@example.com"></test-form-field>
            </form>
          `)
          expect(field).not.toBeDisabled()

          up.form.disableTemp(form)

          expect(field).toBeDisabled()
        })

        it('re-enables a configured custom element when the returned function is called', function() {
          up.form.config.fieldSelectors.push('test-form-field')

          const [form, field] = htmlFixtureList(`
            <form>
              <test-form-field name="email" value="foo@example.com"></test-form-field>
            </form>
          `)

          const reenable = up.form.disableTemp(form)
          expect(field).toBeDisabled()

          reenable()

          expect(field).not.toBeDisabled()
        })

        it('does not disable a custom element that is not configured', function() {
          const [form, field] = htmlFixtureList(`
            <form>
              <test-form-field name="email" value="foo@example.com"></test-form-field>
            </form>
          `)

          up.form.disableTemp(form)

          expect(field).not.toBeDisabled()
        })

      })


      it("disables the form's fields", function() {
        const form = fixture('form')
        const textField = e.affix(form, 'input[name=email][type=text]')
        const selectField = e.affix(form, 'select')
        expect(textField).not.toBeDisabled()
        expect(selectField).not.toBeDisabled()

        up.form.disableTemp(form)

        expect(textField).toBeDisabled()
        expect(selectField).toBeDisabled()
      })

      it('disables fields within the given container', function() {
        const form = fixture('form')
        const container1 = e.affix(form, 'div')
        const container2 = e.affix(form, 'div')
        const fieldInContainer1 = e.affix(container1, 'input[name=email][type=text]')
        const fieldInContainer2 = e.affix(container2, 'input[name=password][type=text]')

        up.form.disableTemp(container2)

        expect(fieldInContainer1).not.toBeDisabled()
        expect(fieldInContainer2).toBeDisabled()
      })

      it("disables the form's submit buttons", function() {
        const form = fixture('form')
        const submitInput = e.affix(form, 'input[type=submit]')
        const selectButton = e.affix(form, 'button[type=submit]')
        expect(submitInput).not.toBeDisabled()
        expect(selectButton).not.toBeDisabled()

        up.form.disableTemp(form)

        expect(submitInput).toBeDisabled()
        expect(selectButton).toBeDisabled()
      })

      it('returns a function that re-enables the fields that were disabled', function() {
        const form = fixture('form')
        const field = e.affix(form, 'input[name=email][type=text]')
        expect(field).not.toBeDisabled()

        const reenable = up.form.disableTemp(form)

        expect(field).toBeDisabled()

        reenable()

        expect(field).not.toBeDisabled()
      })

      it('does not enable initially disabled functions when the re-enablement function is called', function() {
        const form = fixture('form')
        const field = e.affix(form, 'input[name=email][type=text][disabled]')
        expect(field).toBeDisabled()

        const reenable = up.form.disableTemp(form)

        expect(field).toBeDisabled()

        reenable()

        expect(field).toBeDisabled()
      })

      describe('focus', function() {

        it("sets focus on the form if focus was lost from the disabled element", async function() {
          const form = fixture('form')
          const field = e.affix(form, 'input[name=email][type=text]')
          field.focus()
          expect(field).toBeFocused()

          up.form.disableTemp(form)
          await wait(10)

          expect(form).toBeFocused()
        })

        it("sets focus on the closest form group if focus was lost from the disabled element", async function() {
          const form = fixture('form')
          const group = e.affix(form, '[up-form-group]')
          const field = e.affix(group, 'input[name=email][type=text]')
          field.focus()
          expect(field).toBeFocused()

          up.form.disableTemp(field)
          await wait(10)

          expect(group).toBeFocused()
        })

        it("sets focus on the form group closest to the previously focused field when disabling the entire form", async function() {
          const form = fixture('form')
          const group = e.affix(form, '[up-form-group]')
          const field = e.affix(group, 'input[name=email][type=text]')
          field.focus()
          expect(field).toBeFocused()

          up.form.disableTemp(form)
          await wait(10)

          expect(group).toBeFocused()
        })

        it("does not change focus if focus wasn't lost", async function() {
          const form = fixture('form')
          const fieldOutsideForm = fixture('input[name=email][type=text]')
          fieldOutsideForm.focus()
          expect(fieldOutsideForm).toBeFocused()

          up.form.disableTemp(form)
          await wait(10)

          expect(fieldOutsideForm).toBeFocused()
        })
      })

      describe('disabling of non-submit buttons', function() {

        it('disables a button[type=button]', function() {
          const form = fixture('form')
          const button = e.affix(form, 'button[type=button]', { text: 'label' })
          expect(button).not.toBeDisabled()

          up.form.disableTemp(form)

          expect(button).toBeDisabled()
        })

        it('disables an input[type=button]', function() {
          const form = fixture('form')
          const button = e.affix(form, 'input[type=button]', { value: 'label' })
          expect(button).not.toBeDisabled()

          up.form.disableTemp(form)

          expect(button).toBeDisabled()
        })
      })
    })

    describe('up.form.isSubmittable()', function() {

      it('returns true for a form with [up-submit]', function() {
        const form = fixture('form[action="/path"][up-submit]')
        expect(up.form.isSubmittable(form)).toBe(true)
      })

      it('returns true for a form that matches up.form.config.submitSelectors', function() {
        up.form.config.submitSelectors.push('form')
        const form = fixture('form[action="/path"]')
        expect(up.form.isSubmittable(form)).toBe(true)
      })

      it('returns true for a form that will be handled by Unpoly', function() {
        const form = fixture('form[action="/path"][up-submit]')
        expect(up.form.isSubmittable(form)).toBe(true)
      })

      it('returns false for a form that will be handled by the browser', function() {
        const form = fixture('form[action="/path"]')
        expect(up.form.isSubmittable(form)).toBe(false)
      })

      it('returns false for a form that explicitly opted out of being handled by Unpoly with [up-submit=false]', function() {
        up.form.config.submitSelectors.push('form')
        const form = fixture('form[action="/path"][up-submit=false]')
        expect(up.form.isSubmittable(form)).toBe(false)
      })

      it('returns false for a form with [up-submit] that also matches up.form.config.noSubmitSelectors', function() {
        up.form.config.noSubmitSelectors.push('.foo')
        const form = fixture('form.foo[action="/path"][up-submit]')
        expect(up.form.isSubmittable(form)).toBe(false)
      })

      it('returns false for a form to another host', function() {
        const link = fixture('form[up-submit][action="https://other-host/path"]')
        expect(up.form.isSubmittable(link)).toBe(false)
      })

      it('returns true for a form to a fully qualified URL on this host', function() {
        const link = fixture(`form[up-submit][action=//${location.host}/path]`)
        expect(up.form.isSubmittable(link)).toBe(true)
      })

      it('returns false for a form to this host, but another port', function() {
        const link = fixture(`form[up-submit][action=//${location.host}:97334/path]`)
        expect(up.form.isSubmittable(link)).toBe(false)
      })
    })
  })

  describe('unobtrusive behavior', function() {

    require('./form_submit_attr_spec')


    describe('input[up-autosubmit]', function() {

      beforeEach(function() { up.form.config.watchInputDelay = 0 })

      it('submits the form when a change is observed in the given form field', async function() {
        const form = fixture('form')
        const field = e.affix(form, 'input[up-autosubmit][name="input-name"][value="old-value"]')
        up.hello(field)
        const submitSpy = up.form.submit.mock().and.returnValue(Promise.resolve(new up.RenderResult()))
        field.value = 'new-value'
        Trigger.change(field)

        await wait()

        expect(submitSpy).toHaveBeenCalled()
      })

      it('auto-submits with [up-autosubmit=true]', async function() {
        const form = fixture('form')
        const field = e.affix(form, 'input[up-autosubmit=true][name="input-name"][value="old-value"]')
        up.hello(field)
        const submitSpy = up.form.submit.mock().and.returnValue(Promise.resolve(new up.RenderResult()))
        field.value = 'new-value'
        Trigger.change(field)

        await wait()

        expect(submitSpy).toHaveBeenCalled()
      })

      it('does not auto-submit with [up-autosubmit=false]', async function() {
        const form = fixture('form')
        const field = e.affix(form, 'input[up-autosubmit=false][name="input-name"][value="old-value"]')
        up.hello(field)
        const submitSpy = up.form.submit.mock().and.returnValue(Promise.resolve(new up.RenderResult()))
        field.value = 'new-value'
        Trigger.change(field)

        await wait()

        expect(submitSpy).not.toHaveBeenCalled()
      })

      it('queues changes while a prior form autosubmission is still loading (bugfix)', async function() {
        const form = fixture('form[method="post"][action="/endpoint"][up-target="#target"]')
        const field = e.affix(form, 'input[up-autosubmit][name="input-name"][value="value1"]')
        const target = fixture('#target', { text: 'initial text' })
        up.hello(form)

        field.value = 'value2'
        Trigger.change(field)

        await wait()

        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#target')
        expect(jasmine.lastRequest().data()['input-name']).toEqual(['value2'])

        // Make another change while the previous request is still loading
        field.value = 'value3'
        Trigger.change(field)

        await wait()

        // Still waiting for the previous request
        expect(jasmine.Ajax.requests.count()).toBe(1)

        jasmine.respondWithSelector('#target', { text: 'response for value2' })

        await wait()

        expect('#target').toHaveText('response for value2')

        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#target')
        expect(jasmine.lastRequest().data()['input-name']).toEqual(['value3'])

        jasmine.respondWithSelector('#target', { text: 'response for value3' })

        await wait()

        expect('#target').toHaveText('response for value3')
      })

      it('submits the form when a change is observed on a container for a radio button group', async function() {
        const form = fixture('form')
        const group = e.affix(form, '.group[up-autosubmit][up-delay=0]')
        const radio1 = e.affix(group, 'input[type=radio][name=foo][value=1]')
        const radio2 = e.affix(group, 'input[type=radio][name=foo][value=2]')
        up.hello(form)
        const submitSpy = up.form.submit.mock().and.returnValue(Promise.resolve(new up.RenderResult()))
        Trigger.clickSequence(radio1)

        await wait()

        expect(submitSpy.calls.count()).toBe(1)
        Trigger.clickSequence(radio2)

        await wait(100)

        expect(submitSpy.calls.count()).toBe(2)
        Trigger.clickSequence(radio1)

        await wait(100)

        expect(submitSpy.calls.count()).toBe(3)
      })

      it('throws an error when used with an individual radio button', async function() {
        let [form, radioButton] = htmlFixtureList(`
          <form>
            <input type="radio" up-autosubmit name="foo">
          </form>
        `)

        await jasmine.expectGlobalError(/Use \[up-autosubmit\] with the container of a radio group/i, async function() {
          up.hello(form)
          await wait()
        })
      })

      it('calls up.submit() with render options parsed from the watched element', async function() {
        const submitSpy = up.submit.mock()

        const form = fixture('form')
        const input = e.affix(form, 'input[name=email][up-autosubmit][up-watch-feedback=false]')
        up.hello(form)

        input.value = "other"
        Trigger.change(input)

        await wait()

        expect(submitSpy).toHaveBeenCalledWith(
          input,
          jasmine.objectContaining({ origin: input, feedback: false })
        )
      })
    })

    describe('form[up-autosubmit]', function() {

      it('submits the form when a change is observed in any of its fields', async function() {
        up.form.config.watchInputDelay = 0
        const form = fixture('form[up-autosubmit][up-target="#target"]')
        const target = fixture('#target')
        const field = e.affix(form, 'input[name="input-name"][value="old-value"]')
        const submitSpy = up.form.submit.mock().and.returnValue(u.unresolvablePromise())
        up.hello(form)

        field.value = 'new-value'
        Trigger.change(field)

        await wait()

        expect(submitSpy).toHaveBeenCalled()
      })

      it('detects a change in a field that was added dynamically later', async function() {
        up.form.config.watchInputDelay = 0
        const form = fixture('form[up-autosubmit][up-target="#target"]')
        const target = fixture('#target')
        const field1 = e.affix(form, 'input[name="input1"][value="old-value"]')
        const submitSpy = up.form.submit.mock().and.returnValue(u.unresolvablePromise())
        up.hello(form)

        const field2 = e.affix(form, 'input[name="input2"][value="old-value"]')
        up.hello(field2)

        field2.value = 'new-value'
        Trigger.change(field2)

        await wait()

        expect(submitSpy).toHaveBeenCalled()
      })

      describe('with [up-watch-delay] modifier', function() {

        it('debounces the form submission', async function() {
          const target = fixture('#target')
          const $form = $fixture('form[up-autosubmit][up-watch-delay="50"][up-target="#target"]')
          const $field = $form.affix('input[name="input-name"][value="old-value"]')
          up.hello($form)
          const submitSpy = up.form.submit.mock().and.returnValue(u.unresolvablePromise())

          $field.val('new-value-1')
          Trigger.change($field)

          await wait(10)

          $field.val('new-value-2')
          Trigger.change($field)

          await wait(10)

          expect(submitSpy.calls.count()).toBe(0)

          await wait(80)

          expect(submitSpy.calls.count()).toBe(1)
        })

        it('is does not abort a debounced submission by a dependent field with [up-validate] in the same form (bugfix)', async function() {
          const abortedListener = jasmine.createSpy('up:request:aborted listener')
          up.on('up:request:aborted', abortedListener)

          const form = fixture('form[up-autosubmit][up-watch-delay="50"][method="post"][action="/action"][up-target="#form-target"]')
          const input1 = e.affix(form, 'input[name="input1"][value="initial-value"][up-validate="#dependent-field"]')
          const dependentField = e.affix(form, 'input#dependent-field[name="dependent-field"]')
          fixture('#form-target')
          up.hello(form)

          input1.value = 'changed-value'
          Trigger.change(input1)

          await wait(100)

          expect(jasmine.Ajax.requests.count()).toBe(2)
          expect(abortedListener.calls.count()).toBe(0)
        })

        it("aborts a debounced submission when the form element is aborted", async function() {
          const form = fixture('form[up-autosubmit][up-watch-delay="50"][method="post"][action="/action"][up-target="#form-target"]')
          const input1 = e.affix(form, 'input[name="input1"][value="initial-value"]')
          const target = fixture('#form-target')
          up.hello(form)

          input1.value = 'changed-value'
          Trigger.change(input1)

          await wait(10)

          expect(jasmine.Ajax.requests.count()).toBe(0)

          up.fragment.abort(form)

          await wait(90)

          expect(jasmine.Ajax.requests.count()).toBe(0)
        })
      })

      describe('with [up-watch-preview] modifier', function() {
        it('runs the preview with the element targeted by the form', async function() {
          const undoFn = jasmine.createSpy('undo preview')
          const previewFn = jasmine.createSpy('apply preview').and.returnValue(undoFn)
          up.preview('my:preview', previewFn)

          const [form, input] = htmlFixtureList(`
            <form up-autosubmit up-watch-delay="5" up-watch-preview="my:preview" method="post" action="/action" up-target="#target">
              <input name="input1" value="initial-value">
            </form>
          `)
          up.hello(form)
          const target = fixture('#target', { text: 'old target' })

          input.value = 'changed-value'
          Trigger.change(input)

          await wait(40)

          expect(previewFn).toHaveBeenCalledWith(jasmine.objectContaining({ fragment: target }), {})
          expect(undoFn).not.toHaveBeenCalled()

          jasmine.respondWithSelector('#target', { text: 'new target' })

          await wait()

          expect('#target').toHaveText('new target')
          expect(undoFn).toHaveBeenCalled()
        })
      })

      describe('with [up-watch-placeholder] modifier', function() {
        it('replaces the targeted element with the given placeholder', async function() {
          const [form, input, placeholderTemplate] = htmlFixtureList(`
            <form up-autosubmit up-watch-delay="5" up-watch-placeholder="#placeholder-template" method="post" action="/action" up-target="#target">
              <input name="input1" value="initial-value">
              <template id='placeholder-template'>
                <div class='placeholder'>loading...</div>
              </template>
            </form>
          `)
          up.hello(form)
          fixture('#target', { text: 'old target' })

          input.value = 'changed-value'
          Trigger.change(input)

          await wait(40)

          expect('#target').toHaveSelector('.placeholder')
        })
      })
    })

    describe('input[up-watch]', function() {

      beforeEach(function() {
        window.watchCallbackSpy = jasmine.createSpy('watch callback')
      })

      afterEach(function() {
        window.watchCallbackSpy = undefined
      })

      it('calls the JavaScript code in the attribute value when a change is observed in the field', async function() {
        const form = fixture('form')
        const field = e.affix(form, 'input[name="input-name"][value="old-value"][up-watch="nonce-specs-nonce window.watchCallbackSpy(this, value, name)"]')
        up.hello(form)
        field.value = 'new-value'
        Trigger.change(field)

        await wait()
        expect(window.watchCallbackSpy).toHaveBeenCalledWith(field, 'new-value', 'input-name')
      })

      it('does not watch a field with [up-watch=false]', async function() {
        await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
          const form = fixture('form')
          const field = e.affix(form, 'input[name="input-name"][value="old-value"][up-watch="false"]')
          up.hello(form)
          field.value = 'new-value'
          Trigger.change(field)

          await wait()
          expect(globalErrorSpy).not.toHaveBeenCalled()
        })
      })

      it('runs the callback only once for multiple changes in the same task', async function() {
        const $form = $fixture('form')
        const $field = $form.affix('input[name="input-name"][value="old-value"][up-watch="nonce-specs-nonce window.watchCallbackSpy(value, name)"]')
        up.hello($form)
        $field.val('a')
        Trigger.input($field)
        $field.val('ab')
        Trigger.input($field)

        await wait()
        expect(window.watchCallbackSpy.calls.count()).toBe(1)
      })

      it('does not run the callback when the form is submitted immediately after a change, e.g. in a test', async function() {
        const container = fixture('.container[up-main]')
        const form = e.affix(container, 'form[action="/path"]')
        const field = e.affix(form, 'input[name="input-name"][value="old-value"][up-watch="nonce-specs-nonce window.watchCallbackSpy(value, name)"]')
        up.hello(form)
        field.value = 'new-value'
        Trigger.change(field)
        up.submit(form)

        await wait()
        expect(window.watchCallbackSpy).not.toHaveBeenCalled()
      })

      it('passes any options parsed from [up-watch] attributes as `options`', async function() {
        const form = fixture('form')
        const field = e.affix(form, 'input[name=email][up-watch="nonce-specs-nonce window.watchCallbackSpy(options)"][up-watch-disable="#disable"][up-watch-feedback="false"][up-watch-preview="my-preview"][up-watch-placeholder="#placeholder"]')
        up.hello(form)
        field.value = 'new-value'
        Trigger.change(field)

        await wait()
        expect(window.watchCallbackSpy).toHaveBeenCalledWith({
          disable: '#disable',
          feedback: false,
          preview: 'my-preview',
          placeholder: '#placeholder',
          origin: field,
        })
      })

      describe('with [up-watch-delay] modifier', function() {

        it('debounces the callback', async function() {
          const $form = $fixture('form')
          window.watchCallbackSpy = jasmine.createSpy('watch callback')
          const $field = $form.affix('input[name="input-name"][value="old-value"][up-watch="nonce-specs-nonce window.watchCallbackSpy()"][up-watch-delay="40"]')
          up.hello($form)
          $field.val('new-value')
          Trigger.change($field)

          await wait()
          expect(window.watchCallbackSpy).not.toHaveBeenCalled()

          await wait(80)
          expect(window.watchCallbackSpy).toHaveBeenCalled()
        })

        it('aborts the callback if the form was submitted while waiting', async function() {
          const container = fixture('.container[up-main]')
          const form = e.affix(container, 'form[action="/path"]')
          window.watchCallbackSpy = jasmine.createSpy('watch callback')
          const field = e.affix(form, 'input[name="input-name"][value="old-value"][up-watch="nonce-specs-nonce window.watchCallbackSpy()"][up-watch-delay="40"]')
          up.hello(form)
          field.value = 'new-value'
          Trigger.change(field)

          await wait()
          expect(window.watchCallbackSpy).not.toHaveBeenCalled()
          up.form.submit(form)

          await wait(80)
          expect(window.watchCallbackSpy).not.toHaveBeenCalled()
        })
      })
    })

    describe('form[up-watch]', function() {

      afterEach(function() { window.watchCallbackSpy = undefined })

      it('runs the JavaScript code in the attribute value when a change is observed in any contained field', async function() {
        window.watchCallbackSpy = jasmine.createSpy('watch callback')
        const form = fixture('form[up-watch="nonce-specs-nonce window.watchCallbackSpy(this, value, name)"]')
        const field1 = e.affix(form, 'input[name="field1"][value="field1-old-value"]')
        const field2 = e.affix(form, 'input[name="field2"][value="field2-old-value"]')
        up.hello(form)
        field1.value = 'field1-new-value'
        Trigger.change(field1)

        await wait()

        expect(window.watchCallbackSpy.calls.allArgs()).toEqual([
          [form, 'field1-new-value', 'field1']
        ])

        field2.value = 'field2-new-value'
        Trigger.change(field2)

        await wait()

        expect(window.watchCallbackSpy.calls.allArgs()).toEqual([
          [form, 'field1-new-value', 'field1'],
          [form, 'field2-new-value', 'field2']
        ])
      })

      describe('with [up-watch-event] modifier', function() {

        it('allows to set a different event to watch', async function() {
          window.watchCallbackSpy = jasmine.createSpy('watch callback')
          const form = fixture('form[up-watch="nonce-specs-nonce window.watchCallbackSpy(value, name)"][up-watch-event="foo"]')
          const field1 = e.affix(form, 'input[name="field1"][value="field1-old-value"]')
          up.hello(form)
          field1.value = 'field1-new-value'
          Trigger.change(field1)

          await wait()

          expect(window.watchCallbackSpy).not.toHaveBeenCalled()

          up.emit(field1, 'foo')

          await wait()

          expect(window.watchCallbackSpy.calls.allArgs()).toEqual([
            ['field1-new-value', 'field1'],
          ])
        })

        it('allows to override the custom event at individual inputs', async function() {
          window.watchCallbackSpy = jasmine.createSpy('watch callback')
          const form = fixture('form[up-watch="nonce-specs-nonce window.watchCallbackSpy(value, name)"][up-watch-event="foo"]')
          const field1 = e.affix(form, 'input[name="field1"][value="field1-old-value"][up-watch-event="bar"]')
          up.hello(form)
          field1.value = 'field1-new-value'
          Trigger.change(field1)
          up.emit(field1, 'foo')

          await wait()

          expect(window.watchCallbackSpy).not.toHaveBeenCalled()

          up.emit(field1, 'bar')

          await wait()

          expect(window.watchCallbackSpy.calls.allArgs()).toEqual([
            ['field1-new-value', 'field1'],
          ])
        })
      })
    })

    describe('[up-watch] on a container that is neither form nor field', function() {

      beforeEach(function() {
        window.watchCallbackSpy = jasmine.createSpy('watch callback')
      })

      afterEach(function() {
        window.watchCallbackSpy = undefined
      })

      it('runs the callback when any contained field changes')

      it("runs the callback when (1) in a render pass and (2) another compiler changes the watched field's initial value (bugfix)", async function() {
        up.compiler('.field', { priority: -100 }, function(field) {
          field.value = 'value-from-compiler'
          Trigger.change(field)
        })

        fixture('#root')

        let { fragment: root } = await up.render({ fragment: `
          <div id="root">
            <form>
              <div class="container" up-watch="nonce-specs-nonce watchCallbackSpy(value)">
                <input name="field" class="field" value="initial-value">
              </div>
            </form>
          </div>
        ` })

        const field = root.querySelector('.field')

        // Watching is debounced by at least 1 task.
        await wait()

        expect(field.value).toBe('value-from-compiler')
        expect(window.watchCallbackSpy).toHaveBeenCalledWith('value-from-compiler')

        field.value = 'value-from-spec'
        Trigger.change(field)
        await wait()

        expect(field.value).toBe('value-from-spec')
        expect(window.watchCallbackSpy).toHaveBeenCalledWith('value-from-spec')
      })

    })

    require('./form_validate_attr_spec')

    require('./form_switch_spec')
  })
})
