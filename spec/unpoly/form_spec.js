const u = up.util
const e = up.element
const $ = jQuery

describe('up.form', function() {

  describe('JavaScript functions', function() {

    describe('up.form.fields', function() {

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

    describe('up.form.trackFields()', function() {

      it('runs the callback for an existing field that is a descendant of the form', function() {
        let detachCallback = jasmine.createSpy('detach callback')
        let attachCallback = jasmine.createSpy('attach callback').and.returnValue(detachCallback)

        const [form, field1, field2] = htmlFixtureList(`
          <form>
            <input type="text" name="field1">
            <input type="text" name="field2">
          </form>
        `)

        up.form.trackFields(form, attachCallback)

        expect(attachCallback.calls.allArgs()).toEqual([[field1], [field2]])
      })

      it('does not run the callback for an existing field of another form', function() {
        let detachCallback = jasmine.createSpy('detach callback')
        let attachCallback = jasmine.createSpy('attach callback').and.returnValue(detachCallback)

        const [_main, form1, field1, form2, field2] = htmlFixtureList(`
          <main>
            <form name="form1">
              <input type="text" name="field1">
            </form>
            <form name="form2">
              <input type="text" name="field2">
            </form>
          </main>
        `)

        up.form.trackFields(form1, attachCallback)

        expect(attachCallback.calls.allArgs()).toEqual([[field1]])
      })

      it('runs the callback for fields that are appended to the form later', async function() {
        let attachSpy = jasmine.createSpy('attach callback')
        let detachSpy = jasmine.createSpy('detach callback')

        const [form, field1, field2] = htmlFixtureList(`
          <form>
            <input type="text" name="field1">
            <div id="target"></div>
          </form>
        `)

        up.form.trackFields(form, (field) => {
          attachSpy(field.name)
          return () => detachSpy(field.name)
        })

        expect(attachSpy.calls.allArgs()).toEqual([['field1']])

        up.render({ fragment: `
          <div id="target">
            <input type="text" name="field2">
          </div>
        ` })
        await wait()

        expect(attachSpy.calls.allArgs()).toEqual([['field1'], ['field2']])
      })

      it('does not run the callback for fields that are appended to another form later', async function() {
        let attachSpy = jasmine.createSpy('attach callback')
        let detachSpy = jasmine.createSpy('detach callback')

        const [_main, form1, field1, form2, field2] = htmlFixtureList(`
          <main>
            <form name="form1">
              <input type="text" name="field1">
            </form>
            <form name="form2">
              <div id="target"></div>
            </form>
          </main>
        `)

        up.form.trackFields(form1, (field) => {
          attachSpy(field.name)
          return () => detachSpy(field.name)
        })

        expect(attachSpy.calls.allArgs()).toEqual([['field1']])

        up.render({ fragment: `
          <div id="target">
            <input type="text" name="field2">
          </div>
        ` })
        await wait()

        expect(attachSpy.calls.allArgs()).toEqual([['field1']])
      })

      it('runs an undo callback when the field is destroyed', async function() {
        let detachCallback = jasmine.createSpy('detach callback')
        let attachCallback = jasmine.createSpy('attach callback').and.returnValue(detachCallback)

        const [form, field1, destroyZone, field2, field3, field4] = htmlFixtureList(`
          <form>
            <input type="text" name="field1">
            <div id="destroy-zone">
              <input type="text" name="field2">
              <input type="text" name="field3">
            </div>
            <input type="text" name="field4">
          </form>
        `)

        up.form.trackFields(form, attachCallback)

        expect(attachCallback.calls.allArgs()).toEqual([[field1], [field2], [field3], [field4]])

        up.destroy(destroyZone)
        await wait()

        expect(detachCallback.calls.allArgs()).toEqual([[field2], [field3]])
      })

      it('runs undo callbacks for all fields when the form is destroyed', async function() {
        let detachCallback = jasmine.createSpy('detach callback')
        let attachCallback = jasmine.createSpy('attach callback').and.returnValue(detachCallback)

        const [form, field1, field2] = htmlFixtureList(`
          <form>
            <input type="text" name="field1">
            <input type="text" name="field2">
          </form>
        `)

        up.form.trackFields(form, attachCallback)

        expect(attachCallback.calls.allArgs()).toEqual([[field1], [field2]])

        up.destroy(form)
        await wait()

        expect(detachCallback.calls.allArgs()).toEqual([[field1], [field2]])
      })

      it("runs undo callbacks for all fields when the form's layer is destroyed", async function() {
        let detachSpy = jasmine.createSpy('detach callback')
        let attachSpy = jasmine.createSpy('attach callback').and.returnValue(detachSpy)

        up.layer.open({ fragment: `
          <form id="form">
            <input type="text" name="field1">
            <input type="text" name="field2">
          </form>
        ` })
        await wait()

        let form = up.fragment.get('#form')

        up.form.trackFields(form, (field) => {
          attachSpy(field.name)
          return () => detachSpy(field.name)
        })

        expect(attachSpy.calls.allArgs()).toEqual([['field1'], ['field2']])

        up.layer.dismiss()
        await wait()

        expect(detachSpy.calls.allArgs()).toEqual([['field1'], ['field2']])
      })

      it('returns a function that stops tracking', async function() {
        let attachSpy = jasmine.createSpy('attach callback')
        let detachSpy = jasmine.createSpy('detach callback')

        const [form, field1, field2] = htmlFixtureList(`
          <form>
            <input type="text" name="field1">
            <div id="target"></div>
          </form>
        `)

        let stopTracking = up.form.trackFields(form, (field) => {
          attachSpy(field.name)
          return () => detachSpy(field.name)
        })

        expect(attachSpy.calls.allArgs()).toEqual([['field1']])

        stopTracking()

        up.render({ fragment: `
          <div id="target">
            <input type="text" name="field2">
          </div>
        ` })
        await wait()

        expect(attachSpy.calls.allArgs()).toEqual([['field1']])
        up.destroy(form)
        await wait()

        expect(attachSpy.calls.allArgs()).toEqual([['field1']])
      })

      describe('with [up-keep] fields', function() {

        it('runs undo and re-attach callbacks when an [up-keep] field is transported into another form', async function() {
          let changeSpy = jasmine.createSpy('change spy')

          const [form, field] = htmlFixtureList(`
            <form id="form" name="form1">
              <input type="text" name="field" up-keep>
            </form>
          `)

          up.compiler('form', function(form) {
            up.form.trackFields(form, (field) => {
              changeSpy('attach', form.name, field.name)
              return () => changeSpy('detach', form.name, field.name)
            })
          })

          expect(changeSpy.calls.allArgs()).toEqual([['attach', 'form1', 'field']])

          up.render({ fragment: `
            <form id="form" name="form2">
              <input type="text" name="field" up-keep>
            </form>
          ` })
          await wait()

          expect(changeSpy.calls.allArgs()).toEqual([
            ['attach', 'form1', 'field'],
            ['attach', 'form2', 'field'],
            ['detach', 'form1', 'field'],
          ])
        })

        it('does not run additional callbacks when an [up-keep] field remains in the tracked form', async function() {
          let changeSpy = jasmine.createSpy('change spy')

          const [form, target, field] = htmlFixtureList(`
            <form id="form" name="form1">
              <div id="target">
                <input type="text" name="field" up-keep>
                <p>old text</p>
              </div>
            </form>
          `)

          up.compiler('form', function(form) {
            up.form.trackFields(form, (field) => {
              changeSpy('attach', form.name, field.name)
              return () => changeSpy('detach', form.name, field.name)
            })
          })

          expect(changeSpy.calls.allArgs()).toEqual([['attach', 'form1', 'field']])

          up.render({ fragment: `
            <div id="target">
              <input type="text" name="field" up-keep>
              <p>new text</p>
            </div>
          ` })
          await wait()

          expect(form).toHaveText('new text')

          // Because the field didn't change forms, no additional callbacks are run
          expect(changeSpy.calls.allArgs()).toEqual([['attach', 'form1', 'field']])
        })

        it('does not run callbacks when watching a single field that is transported to another form', async function() {
          let changeSpy = jasmine.createSpy('change spy')

          const [oldForm, keepField, otherField] = htmlFixtureList(`
            <form id="form" name="form1">
              <input type="text" name="field" up-keep data-version="old">
              <input type="text" name="other">
            </form>
          `)

          up.hello(oldForm)

          up.form.trackFields(keepField, (field) => {
            changeSpy('insert', oldForm.name, field.name)
            return () => changeSpy('destroy', oldForm.name, field.name)
          })

          expect(changeSpy.calls.count()).toBe(1)
          expect(changeSpy.calls.allArgs()).toEqual([['insert', 'form1', 'field']])

          const { fragment: newForm } = await up.render({ fragment: `
            <form id="form" name="form2">
              <input type="text" name="field" up-keep data-version="new">
            </form>
          ` })
          await wait()

          // Check that we kept the old field and attached it to the new form
          expect(keepField).toBeAttached()
          expect(keepField.dataset.version).toBe('old')
          expect(keepField.parentElement).toBe(newForm)

          expect(changeSpy.calls.count()).toBe(1)
          expect(changeSpy.calls.allArgs()).toEqual([['insert', 'form1', 'field']])
        })

      })

      describe('with a root that is not a form', function() {

        it('only runs the callback for subtree matches of that root', async function() {
          let changeSpy = jasmine.createSpy('change spy')

          const [form, root, field1, outside, field2] = htmlFixtureList(`
            <form id="form" name="form1">
              <div id="root">
                <input type="text" name="field1">
              </div>
              <div id="outside">
                <input type="text" name="field2">
              </div>
            </form>
          `)

          up.form.trackFields(root, (field) => {
            changeSpy('attach', form.name, field.name)
            return () => changeSpy('detach', form.name, field.name)
          })

          expect(changeSpy.calls.allArgs()).toEqual([['attach', 'form1', 'field1']])
        })

        it('does not run the callback for form-external fields with [form] attribute', async function() {
          let changeSpy = jasmine.createSpy('change spy')

          const [form, root, field1, field2] = htmlFixtureList(`
            <form id="form" name="form1">
              <div id="root">
                <input type="text" name="field1">
              </div>
            </form>
            
            <input type="text" name="field2" form="form1">
          `)

          up.form.trackFields(root, (field) => {
            changeSpy('attach', form.name, field.name)
            return () => changeSpy('detach', form.name, field.name)
          })

          expect(changeSpy.calls.allArgs()).toEqual([['attach', 'form1', 'field1']])
        })

        it('only runs the callback for subtree matches that are inserted later', async function() {
          let changeSpy = jasmine.createSpy('change spy')

          const [form, root, field1, rootExtension, outside, field2, outsideExtension] = htmlFixtureList(`
            <form id="form" name="form1">
              <div id="root">
                <input type="text" name="field1">
                <div id="root-extension"></div>
              </div>
              <div id="outside">
                <input type="text" name="field2">
                <div id="outside-extension"></div>
              </div>
            </form>
          `)

          up.form.trackFields(root, (field) => {
            changeSpy('attach', form.name, field.name)
            return () => changeSpy('detach', form.name, field.name)
          })

          expect(changeSpy.calls.allArgs()).toEqual([
            ['attach', 'form1', 'field1']
          ])

          up.render({
            target: '#root-extension, #outside-extension',
            document: `
              <div id="root-extension">
                <input type="text" name="field3">
              </div>
              <div id="outside-extension">
                <input type="text" name="field4">
              </div>
          ` })
          await wait()

          // Because the field didn't change forms, no additional callbacks are run
          expect(changeSpy.calls.allArgs()).toEqual([
            ['attach', 'form1', 'field1'],
            ['attach', 'form1', 'field3'],
          ])
        })

      })

      describe('form-external fields with [form] attribute', function() {

        it('runs the callback for an existing form-external field', async function() {
          let changeSpy = jasmine.createSpy('change spy')

          htmlFixtureList(`
            <form id="form1" name="form1">
              <input type="text" name="field1">
            </form>

            <form id="form2" name="form2">
            </form>
            
            <input type="text" name="field2" form="form1">
            <input type="text" name="field3" form="form2">
          `)

          up.compiler('form', function(form) {
            up.form.trackFields(form, (field) => {
              changeSpy('attach', form.name, field.name)
              return () => changeSpy('detach', form.name, field.name)
            })
          })

          expect(changeSpy.calls.allArgs()).toEqual([
            ['attach', 'form1', 'field1'],
            ['attach', 'form1', 'field2'],
            ['attach', 'form2', 'field3'],
          ])
        })

        it('runs the callback for a form-external field that is inserted later', async function() {
          let changeSpy = jasmine.createSpy('change spy')

          htmlFixtureList(`
            <form id="form1" name="form1">
              <input type="text" name="field1">
            </form>

            <form id="form2" name="form2">
            </form>
            
            <div id="target"></div>
          `)

          up.compiler('form', function(form) {
            up.form.trackFields(form, (field) => {
              changeSpy('attach', form.name, field.name)
              return () => changeSpy('detach', form.name, field.name)
            })
          })

          expect(changeSpy.calls.allArgs()).toEqual([
            ['attach', 'form1', 'field1'],
          ])

          up.render({ fragment: `
            <div id="target">
              <input type="text" name="field2" form="form1">
              <input type="text" name="field3" form="form2">
            </div>
          ` })

          expect(changeSpy.calls.allArgs()).toEqual([
            ['attach', 'form1', 'field1'],
            ['attach', 'form1', 'field2'],
            ['attach', 'form2', 'field3'],
          ])

        })

        it('runs undo callbacks for all form-external fields when the form is destroyed', async function() {
          let detachCallback = jasmine.createSpy('detach callback')
          let attachCallback = jasmine.createSpy('attach callback').and.returnValue(detachCallback)

          const [form, field1, field2] = htmlFixtureList(`
            <form id="form">
            </form>
            
            <input type="text" name="field1" form="form">
            <input type="text" name="field2" form="form">
          `)

          up.form.trackFields(form, attachCallback)

          expect(attachCallback.calls.allArgs()).toEqual([[field1], [field2]])

          up.destroy(form)
          await wait()

          expect(detachCallback.calls.allArgs()).toEqual([[field1], [field2]])
        })

        it("runs undo callbacks for all form-external fields when the form's layer is destroyed", async function() {
          let detachSpy = jasmine.createSpy('detach callback')
          let attachSpy = jasmine.createSpy('attach callback').and.returnValue(detachSpy)

          up.layer.open({ fragment: `
            <main>
              <form id="form">
              </form>

              <input type="text" name="field1" form="form">
              <input type="text" name="field2" form="form">
            </main>
          ` })
          await wait()

          let form = up.fragment.get('#form')

          up.form.trackFields(form, (field) => {
            attachSpy(field.name)
            return () => detachSpy(field.name)
          })

          expect(attachSpy.calls.allArgs()).toEqual([['field1'], ['field2']])

          up.layer.dismiss()
          await wait()

          expect(detachSpy.calls.allArgs()).toEqual([['field1'], ['field2']])
        })


      })

    })

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
    })

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
            await wait() // We need to wait 1 task for the reset button to affect field values, then another task for a 0ms debounce delay.

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
            await wait() // We need to wait 1 task for the reset button to affect field values, then another task for a 0ms debounce delay.

            expect(callback.calls.count()).toBe(2)
            expect(callback.calls.argsFor(1)[0]).toBe('default')
          })

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
          expect(doWatch).toThrowError(/up\.watch\(\) can only watch fields with a \[name\] attribute/i)
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
    })

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
          const passwordInput = e.affix(form, 'input[name="password"][value="secret"]')

          up.submit(form, { disable: true })
          await wait()

          expect(emailInput).toBeDisabled()
          expect(passwordInput).toBeDisabled()

          expect(jasmine.lastRequest().url).toMatchURL('/session')
          expect(jasmine.lastRequest().method).toBe('POST')
          expect(jasmine.lastRequest().data()).toMatchParams({ email: 'foo@bar.com', password: 'secret' })
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

        it('defaults to multipart/form-data in a form with file inputs', async function() {
          const form = fixture('form[action="/path"][method=post]')

          // Since this test cannot programmatically append an <input type="file"> with
          // a value, we pass a binary param with the { params } option.
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

    describe('up.form.submitOptions()', function() {

      it('parses the render options that would be used to submit the given frm', function() {
        const form = fixture('form[action="/path"][up-method="PUT"][up-layer="new"]')
        const options = up.form.submitOptions(form)
        expect(options.url).toEqual('/path')
        expect(options.method).toEqual('PUT')
        expect(options.layer).toEqual('new')
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
    })

    describe('up.form.group()', function() {
      it('returns the closest form group around the given element', function() {
        const form = fixture('form')
        const group = e.affix(form, '[up-form-group]')
        const input = e.affix(group, 'input[name=email]')

        expect(up.form.group(input)).toBe(group)
      })
    })

    describe('up.validate()', function() {

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

    describe('up.form.disableTemp()', function() {

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

    describe('[up-submit]', function() {

      it('submits the form with AJAX and replaces the [up-target] selector', async function() {
        $fixture('.response').text('old text')

        const $form = $fixture('form[action="/form-target"][method="put"][up-submit][up-target=".response"]')
        $form.append('<input name="field1" value="value1">')
        $form.append('<input name="field2" value="value2">')
        const $submitButton = $form.affix('input[type="submit"][name="submit-button"][value="submit-button-value"]')
        up.hello($form)

        Trigger.clickSequence($submitButton)

        await wait()

        const params = jasmine.lastRequest().data()
        expect(params['field1']).toEqual(['value1'])
        expect(params['field2']).toEqual(['value2'])

        await wait()

        jasmine.respondWith(`
          <div class="response">
            new text
          </div>
        `)

        await wait()

        expect('.response').toHaveText('new text')
      })

      it('submits a form with [up-submit=true]', async function() {
        fixture('main', { text: 'old text' })

        const $form = $fixture('form[action="/form-target"][method="put"][up-submit="true"]')
        $form.append('<input name="field" value="value">')
        const $submitButton = $form.affix('input[type="submit"]')
        up.hello($form)

        Trigger.clickSequence($submitButton)

        await wait()

        expect(jasmine.lastRequest().data()['field']).toEqual(['value'])
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('main')
      })

      it('does not focus the submit button when pressing Enter within an input (discussion #658)', async function() {
        const form = fixture('form[up-submit][action="/action"]')
        const input = e.affix(form, 'input[type=text][name="foo"]')
        const submitButton = e.affix(form, 'button[type=submit]', { text: 'Submit' })

        Trigger.submitFormWithEnter(input)

        await wait()

        expect(submitButton).not.toBeFocused()
        expect(input).toBeFocused()
      })

      it('does not submit a form when a HTML5 validation constraint is violated', async function() {
        fixture('main', { text: 'old text' })

        const [form, input, submitButton] = htmlFixtureList(`
          <form action="/form-target" method="post" up-submit>
            <input name="field" required>
            <input type="submit">
          </form>
        `)

        up.hello(form)

        Trigger.clickSequence(submitButton)
        await wait()

        expect(input.validity.valid).toBe(false)
        expect(jasmine.Ajax.requests.count()).toBe(0)

        input.value = "foo"

        Trigger.clickSequence(submitButton)
        await wait()

        expect(input.validity.valid).toBe(true)
        expect(jasmine.Ajax.requests.count()).toBe(1)
      })

      describe('up:form:submit event', function() {

        it('is emitted with information about the form submission', function() {
          const form = fixture('form[action="/form-target"][method="put"][up-target=".response"]')
          e.affix(form, 'input[name="field1"][value="value1"]')
          e.affix(form, 'input[name="field2"][value="value2"]')
          const submitButton = e.affix(form, 'input[type="submit"][name="submit-button"][value="submit-button-value"]')
          up.hello(form)

          let submitEvent = null
          form.addEventListener('up:form:submit', (event) => { submitEvent = event })

          Trigger.clickSequence(submitButton)

          expect(submitEvent).toBeEvent('up:form:submit')
          expect(submitEvent.params).toEqual(jasmine.any(up.Params))
          expect(submitEvent.params.get('field1')).toEqual('value1')
          expect(submitEvent.params.get('field2')).toEqual('value2')
          expect(submitEvent.submitButton).toBe(submitButton)
          expect(submitEvent.form).toBe(form)
        })

        it('lets listeners mutate params before submission', async function() {
          const form = fixture('form[action="/form-target"][method="put"][up-target=".response"]')
          e.affix(form, 'input[name="foo"][value="one"]')
          const submitButton = e.affix(form, 'input[type="submit"]')

          const listener = function(event) {
            expect(event.params.get('foo')).toBe("one")
            event.params.set('foo', 'two')
          }

          up.on('up:form:submit', listener)

          Trigger.clickSequence(submitButton)

          await wait()

          expect(jasmine.lastRequest().data()['foo']).toEqual(['two'])
        })

        it('emits on the element that triggered the submission', async function() {
          const form = fixture('form[action="/form-target"][up-submit]')
          const submitButton = e.affix(form, 'input[type="submit"]')
          up.hello(form)

          let submitEvent = null
          form.addEventListener('up:form:submit', (event) => { submitEvent = event })

          Trigger.clickSequence(submitButton)
          await wait()

          expect(submitEvent).toBeEvent('up:form:submit', { target: submitButton })
        })
      })

      it('allows to refer to the origin as ":origin" in the target selector', async function() {
        const $form = $fixture('form.my-form[action="/form-target"][up-target="form:has(:origin)"]').text('old form text')
        const $submitButton = $form.affix('input.submit[type="submit"]')
        up.hello($form)

        Trigger.clickSequence($submitButton)

        await wait()

        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('form:has(.submit)')

        jasmine.respondWith(`
          <form class="my-form">
            new form text
            <input class="submit" type="submit">
          </form>
        `)

        await wait()

        expect('.my-form').toHaveText('new form text')
      })

      it('does not submit the form if a listener has prevented the submit event', async function() {
        fixture('.response', { text: 'old text' })
        const form = fixture('form[action="/form-target"][method="put"][up-target=".response"]')
        const submitButton = e.affix(form, 'input[type="submit"]')
        up.hello(form)

        form.addEventListener('submit', (event) => event.preventDefault())

        Trigger.clickSequence(submitButton)

        await wait()

        expect(jasmine.Ajax.requests.count()).toBe(0)
      })

      it('does not handle a form with a [target] attribute', async function() {
        fixture('.response', { text: 'old text' })
        const form = fixture('form[action="/form-target"][method="put"][up-submit][target="_blank"]')
        const submitButton = e.affix(form, 'input[type="submit"]')
        up.hello(form)

        Trigger.clickSequence(submitButton)

        await wait()

        expect(jasmine.Ajax.requests.count()).toBe(0)
        expect(form).toHaveBeenDefaultSubmitted()
      })

      it('does not submit the form while a HTML5 validation is violated', async function() {
        const submitSpy = up.submit.mock().and.returnValue(u.unresolvablePromise())

        const form = fixture('form[action="/form-target"][up-submit]')
        const input = e.affix(form, 'input[type=text][name=title][required]')
        const submitButton = e.affix(form, 'input[type="submit"]')

        up.hello(form)

        Trigger.clickSequence(submitButton)

        await wait()

        expect(submitSpy).not.toHaveBeenCalled()

        input.value = 'foo'
        Trigger.clickSequence(submitButton)

        await wait()

        expect(submitSpy).toHaveBeenCalled()
      })

      describe('when the server responds with an error code', function() {

        it('replaces the form instead of the [up-target] selector', async function() {
          up.history.config.enabled = true

          $fixture('.response').text('old text')

          const $form = $fixture('form.test-form[action="/form-target"][method="put"][up-target=".response"]')
          $form.append('<input name="field1" value="value1">')
          $form.append('<input name="field2" value="value2">')
          const $submitButton = $form.affix('input[type="submit"][name="submit-button"][value="submit-button-value"]')
          up.hello($form)

          Trigger.clickSequence($submitButton)

          await wait()

          const params = jasmine.lastRequest().data()
          expect(params['field1']).toEqual(['value1'])
          expect(params['field2']).toEqual(['value2'])

          jasmine.respondWith({
            status: 500,
            responseText: `
              <form class="test-form" action='/form-target'>
                validation errors
              </form>
            `
          })

          await wait()

          expect('.response').toHaveText('old text')
          expect('form.test-form').toHaveText('validation errors')
        })

        it('updates a given selector when an [up-fail-target] is given', async function() {
          const $form = $fixture('form.my-form[action="/path"][up-target=".target"][up-fail-target=".errors"]').text('old form text')
          let $errors = $fixture('.target').text('old target text')
          $errors = $fixture('.errors').text('old errors text')

          const $submitButton = $form.affix('input[type="submit"]')
          up.hello($form)

          Trigger.clickSequence($submitButton)

          await wait()

          jasmine.respondWith({
            status: 500,
            responseText: `
              <form class="my-form">
                new form text
              </form>

              <div class="errors">
                new errors text
              </div>
            `
          })

          await wait()

          expect('.my-form').toHaveText('old form text')
          expect('.target').toHaveText('old target text')
          expect('.errors').toHaveText('new errors text')
        })

        it('allows to refer to the origin as ":origin" in the [up-fail-target] selector', async function() {
          const $form = $fixture('form.my-form[action="/form-target"][up-target=".target"][up-fail-target="form:has(:origin)"]').text('old form text')
          const $target = $fixture('.target').text('old target text')

          const $submitButton = $form.affix('input.submit[type="submit"]')
          up.hello($form)

          Trigger.clickSequence($submitButton)

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Fail-Target']).toEqual('form:has(.submit)')

          jasmine.respondWith({
            status: 500,
            responseText: `
              <form class="my-form">
                new form text
                <input class="submit" type="submit">
              </form>
            `
          })

          await wait()

          expect('.target').toHaveText('old target text')
          expect('.my-form').toHaveText('new form text')
        })

        it('replaces the form if it was submitted by a submit button that was immediately removed (as Shoelace does when pressing Enter within an <sl-input>) (discussion #643)', async function() {
          const formSelector = 'form#form[action="/form-action"][method="put"][up-submit]'
          const form = fixture(formSelector)
          up.hello(form)

          const button = e.affix(form, 'button[type=submit]')
          button.click()
          button.remove()

          await wait()

          jasmine.respondWithSelector(formSelector, { text: 'failure text', status: 422 })

          await wait()

          expect('#form').toHaveText('failure text')
        })
      })

      describe('submit buttons', function() {

        it('includes the clicked submit button in the params', async function() {
          const $form = $fixture('form[action="/action"][up-target=".target"][method=post]')
          const $textField = $form.affix('input[type="text"][name="text-field"][value="text-field-value"]')
          const $submitButton = $form.affix('input[type="submit"][name="submit-button"][value="submit-button-value"]')
          up.hello($form)
          Trigger.clickSequence($submitButton)

          await wait()

          const params = jasmine.lastRequest().data()
          expect(params['text-field']).toEqual(['text-field-value'])
          expect(params['submit-button']).toEqual(['submit-button-value'])
        })

        it('includes the clicked submit button in the params if the button is outside the form', async function() {
          const $form = $fixture('form#my-form[action="/action"][up-target=".target"][method=post]')
          const $textField = $form.affix('input[type="text"][name="text-field"][value="text-field-value"]')
          const $submitButton = $fixture('input[type="submit"][name="submit-button"][value="submit-button-value"][form="my-form"]')
          up.hello($form)
          Trigger.clickSequence($submitButton)

          await wait()

          const params = jasmine.lastRequest().data()
          expect(params['text-field']).toEqual(['text-field-value'])
          expect(params['submit-button']).toEqual(['submit-button-value'])
        })

        it('excludes an unused submit button in the params', async function() {
          const $form = $fixture('form[action="/action"][up-target=".target"][method=post]')
          const $textField = $form.affix('input[type="text"][name="text-field"][value="text-field-value"]')
          const $submitButton1 = $form.affix('input[type="submit"][name="submit-button-1"][value="submit-button-1-value"]')
          const $submitButton2 = $form.affix('input[type="submit"][name="submit-button-2"][value="submit-button-2-value"]')
          up.hello($form)
          Trigger.clickSequence($submitButton2)

          await wait()

          const params = jasmine.lastRequest().data()
          expect(params['text-field']).toEqual(['text-field-value'])
          expect(params['submit-button-1']).toBeUndefined()
          expect(params['submit-button-2']).toEqual(['submit-button-2-value'])
        })

        it('assumes the first submit button if the form was submitted with enter', async function() {
          const $form = $fixture('form[action="/action"][up-target=".target"][method=post]')
          const $textField = $form.affix('input[type="text"][name="text-field"][value="text-field-value"]')
          const $submitButton1 = $form.affix('input[type="submit"][name="submit-button-1"][value="submit-button-1-value"]')
          const $submitButton2 = $form.affix('input[type="submit"][name="submit-button-2"][value="submit-button-2-value"]')
          up.hello($form)

          Trigger.submit($form)

          await wait()

          const params = jasmine.lastRequest().data()
          expect(params['text-field']).toEqual(['text-field-value'])
          expect(params['submit-button-1']).toEqual(['submit-button-1-value'])
          expect(params['submit-button-2']).toBeUndefined()
        })

        it('does not explode if the form has no submit buttons', async function() {
          const $form = $fixture('form[action="/action"][up-target=".target"][method=post]')
          const $textField = $form.affix('input[type="text"][name="text-field"][value="text-field-value"]')
          up.hello($form)

          Trigger.submit($form)

          await wait()

          const params = jasmine.lastRequest().data()
          const keys = Object.keys(params)
          expect(keys).toEqual(['text-field'])
        })

        it("lets submit buttons override the form's action and method with button[formaction] and button[formmethod] attributes", async function() {
          const $form = $fixture('form[action="/form-path"][method="GET"][up-submit]')
          const $submitButton1 = $form.affix('input[type="submit"]')
          const $submitButton2 = $form.affix('input[type="submit"][formaction="/button-path"][formmethod="POST"]')
          up.hello($form)
          Trigger.clickSequence($submitButton2)

          await wait()

          const request = jasmine.lastRequest()
          expect(request.url).toMatchURL('/button-path')
          expect(request.method).toBe('POST')
        })
      })

      describe('origin of submission', function() {

        beforeEach(function() { spyOn(up, 'RenderJob').and.callThrough() })

        const lastOrigin = () => up.RenderJob.calls.mostRecent().args[0].origin

        it('sets the origin to the clicked submit button', function() {
          const form = fixture('form[action="/path"][up-submit]')
          const submitButton1 = e.affix(form, 'input[type="submit"]')
          const submitButton2 = e.affix(form, 'input[type="submit"]')
          up.hello(form)

          Trigger.clickSequence(submitButton2)

          expect(lastOrigin()).toBe(submitButton2)
        })

        describe('when the form is submitted with the enter key or receives a synthetic submit event', function() {

          it('sets the origin to a focused field within the form', function() {
            const form = fixture('form[action="/path"][up-submit]')
            const input = e.affix(form, 'input[type=text[name=foo]')
            const submitButton = e.affix(form, 'input[type="submit"]')
            up.hello(form)

            input.focus()

            Trigger.submit(form)

            expect(lastOrigin()).toBe(input)
          })

          it('sets the origin to the first submit button if no field is focused', function() {
            const form = fixture('form[action="/path"][up-submit]')
            const input = e.affix(form, 'input[type=text[name=foo]')
            const submitButton = e.affix(form, 'input[type="submit"]')
            up.hello(form)

            Trigger.submit(form)

            expect(lastOrigin()).toBe(submitButton)
          })

          it('does not set the origin to a focused field outside the form', function() {
            const form = fixture('form[action="/path"][up-submit]')
            const inputOutsideForm = fixture('input[type=text[name=foo]')
            const submitButton = e.affix(form, 'input[type="submit"]')
            up.hello(form)

            inputOutsideForm.focus()

            Trigger.submit(form)

            expect(lastOrigin()).not.toBe(inputOutsideForm)
          })
        })

        it('sets the origin to the form if the form has neither submit button nor focused field', function() {
          const form = fixture('form[action="/path"][up-submit]')
          up.hello(form)

          Trigger.submit(form)

          expect(lastOrigin()).toBe(form)
        })
      })

      describe('handling of up.form.config.submitSelectors', function() {

        it('submits matching forms even without [up-submit] or [up-target]', async function() {
          const form = fixture('form.form[action="/form-action2"]')
          const submitButton = e.affix(form, 'input[type=submit]')
          const submitSpy = up.form.submit.mock().and.returnValue(Promise.resolve())

          up.form.config.submitSelectors.push('.form')

          Trigger.click(submitButton)

          await wait()

          expect(submitSpy).toHaveBeenCalled()
          expect(form).not.toHaveBeenDefaultSubmitted()
        })

        it('allows to opt out with [up-submit=false]', async function() {
          const form = fixture('form.form[action="/form-action3"][up-submit="false"]')
          const submitButton = e.affix(form, 'input[type=submit]')
          const submitSpy = up.form.submit.mock().and.returnValue(Promise.resolve())

          up.form.config.submitSelectors.push('.form')

          Trigger.click(submitButton)

          await wait()

          expect(submitSpy).not.toHaveBeenCalled()
          expect(form).toHaveBeenDefaultSubmitted()
        })
      })

      describe('with [up-preview] modifier', function() {
        it('shows a preview effect while the form is loading', async function() {
          const target = fixture('#target', { text: 'old target' })
          const spinnerContainer = fixture('#other')

          up.preview('my:preview', (preview) => preview.insert(spinnerContainer, '<div id="spinner"></div>'))

          const form = fixture('form[action="/foo"][up-submit][up-target="#target"][up-preview="my:preview"]', { text: 'label' })
          const submitButton = e.affix(form, 'input[type=submit]', { text: 'label' })

          expect(spinnerContainer).not.toHaveSelector('#spinner')

          Trigger.clickSequence(submitButton)
          await wait()

          expect(spinnerContainer).toHaveSelector('#spinner')

          jasmine.respondWithSelector('#target', { text: 'new target' })
          await wait()

          expect(spinnerContainer).not.toHaveSelector('#spinner')
        })
      })

      describe('with [up-placeholder] modifier', function() {
        it('shows a UI placeholder while the form is loading', async function() {
          fixture('#target', { content: '<p>old target</p>' })
          const form = fixture('form[action="/foo"][up-submit][up-target="#target"][up-placeholder="<p>placeholder</p>"]', { text: 'label' })
          const submitButton = e.affix(form, 'input[type=submit]', { text: 'label' })

          expect('#target').toHaveVisibleText('old target')

          Trigger.clickSequence(submitButton)
          await wait()

          expect('#target').toHaveVisibleText('placeholder')

          jasmine.respondWithSelector('#target', { content: '<p>new target</p>' })
          await wait()

          expect('#target').toHaveVisibleText('new target')
        })
      })
    })


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

      beforeEach(function() { window.watchCallbackSpy = jasmine.createSpy('watch callback') })

      afterEach(function() { window.watchCallbackSpy = undefined })

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
          passwordInput.value = 'secret5555'
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
        $passwordInput.val('secret5435')
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
        $passwordInput.val('secret5435')
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
    })


    describe('[up-switch]', function() {

      describe('emitting up:form:switch on changes', function() {

        it('emits up:form:switch on switchees with { field, fieldTokens }', async function() {
          const listener = jasmine.createSpy('up:form:switch listener')
          up.on('up:form:switch', (event) => listener(event))

          let [form, field, target1, target2, nonTarget] = htmlFixtureList(`
            <form>
              <input name="foo" up-switch=".target" value="default">
              <div class="target" up-show-for="active">target1</div>
              <div class="target" up-show-for="active">target2</div>
              <div class="non-target" up-show-for="active">non-target</div>
            </form>
          `)
          up.hello(form)
          await wait()

          expect(listener.calls.count()).toBe(2)
          expect(listener.calls.argsFor(0)[0].target).toBe(target1)
          expect(listener.calls.argsFor(0)[0].field).toBe(field)
          expect(listener.calls.argsFor(0)[0].fieldTokens).toEqual(['default', ':present'])
          expect(listener.calls.argsFor(1)[0].target).toBe(target2)
          expect(listener.calls.argsFor(1)[0].field).toBe(field)
          expect(listener.calls.argsFor(1)[0].fieldTokens).toEqual(['default', ':present'])

          field.value = 'changed'
          Trigger.change(field)
          await wait()

          expect(listener.calls.count()).toBe(4)
          expect(listener.calls.argsFor(2)[0].target).toBe(target1)
          expect(listener.calls.argsFor(2)[0].field).toBe(field)
          expect(listener.calls.argsFor(2)[0].fieldTokens).toEqual(['changed', ':present'])
          expect(listener.calls.argsFor(3)[0].target).toBe(target2)
          expect(listener.calls.argsFor(3)[0].field).toBe(field)
          expect(listener.calls.argsFor(3)[0].fieldTokens).toEqual(['changed', ':present'])

          field.value = ''
          Trigger.change(field)
          await wait()

          expect(listener.calls.count()).toBe(6)
          expect(listener.calls.argsFor(4)[0].target).toBe(target1)
          expect(listener.calls.argsFor(4)[0].field).toBe(field)
          expect(listener.calls.argsFor(4)[0].fieldTokens).toEqual(['', ':blank'])
          expect(listener.calls.argsFor(5)[0].target).toBe(target2)
          expect(listener.calls.argsFor(5)[0].field).toBe(field)
          expect(listener.calls.argsFor(5)[0].fieldTokens).toEqual(['', ':blank'])
        })

        it('only emits up:form:switch once per distinct { fieldTokens }', async function() {
          const listener = jasmine.createSpy('up:form:switch listener')
          up.on('up:form:switch', (event) => listener(event))

          let [form, field, target] = htmlFixtureList(`
            <form>
              <input name="foo" up-switch=".target" value="default">
              <div class="target" up-show-for="active">target1</div>
            </form>
          `)
          up.hello(form)
          await wait()

          expect(listener.calls.count()).toBe(1)

          field.value = 'changed'
          Trigger.change(field)
          await wait()

          expect(listener.calls.count()).toBe(2)

          field.value = 'changed'
          Trigger.change(field)
          await wait()

          expect(listener.calls.count()).toBe(2)

          field.value = 'changed again'
          Trigger.change(field)
          await wait()

          expect(listener.calls.count()).toBe(3)
        })

        it('emits up:form:switch for matching elements that were inserted later', async function() {
          const listener = jasmine.createSpy('up:form:switch listener')
          up.on('up:form:switch', (event) => listener(event))

          let [form, field, target1] = htmlFixtureList(`
            <form>
              <input name="foo" up-switch=".target" value="default">
              <div class="target" up-show-for="active">target1</div>
              <div id="extension"></div>
            </form>
          `)
          up.hello(form)
          await wait()

          expect(listener.calls.count()).toBe(1)

          up.render({ fragment: `
            <div id="extension">
              <div class="target" up-show-for="active">target2</div>
            </div>
          `})
          await wait()

          expect(listener.calls.count()).toBe(2)
        })

      })

      describe('radio buttons', function() {

        it('allows to switch a container of radio buttons', async function() {
          const [form, container, radio1, radio2, switchee] = htmlFixtureList(`
            <form>
              <div up-switch="#switchee">
                <input type="radio" name="group" value="1">
                <input type="radio" name="group" value="2">
              </div>

              <div id="switchee" up-show-for="1">
                Switchee
              </div>
            </form>
          `)

          up.hello(form)
          await wait()

          expect(switchee).not.toBeVisible()
          radio1.checked = true
          Trigger.change(radio1)
          await wait()

          expect(switchee).toBeVisible()
          radio2.checked = true
          Trigger.change(radio2)
          await wait()

          expect(switchee).not.toBeVisible()
          radio1.checked = true
          Trigger.change(radio1)
          await wait()

          expect(switchee).toBeVisible()
        })

        describe('when [up-switch] is set on an input[type=radio] instead of a group container', function() {

          if (up.migrate.loaded) {
            it('logs a warning and keeps working', async function() {
              spyOn(console, 'warn')

              const [form, radio1, radio2, switchee] = htmlFixtureList(`
              <form>
                <input type="radio" name="group" value="1" up-switch="#switchee">
                <input type="radio" name="group" value="2" up-switch="#switchee">
  
                <div id="switchee" up-show-for="1">
                  Switchee
                </div>
              </form>
            `)

              up.hello(form)
              await wait()

              expect(console.warn).toHaveBeenCalled()
              expect(console.warn.calls.mostRecent().args[0]).toMatch(/Use \[up-switch\] on the container of a radio group/i)

              // This still works for backwards compatibility
              expect(switchee).not.toBeVisible()
              radio1.checked = true
              Trigger.change(radio1)
              await wait()

              expect(switchee).toBeVisible()
              radio2.checked = true
              Trigger.change(radio2)
              await wait()

              expect(switchee).not.toBeVisible()
              radio1.checked = true
              Trigger.change(radio1)
              await wait()

              expect(switchee).toBeVisible()
            })
          } else {

            it('throws an error', async function() {
              const [form, radio1, radio2, switchee] = htmlFixtureList(`
                <form>
                  <input type="radio" name="group" value="1" up-switch="#switchee">
                  <input type="radio" name="group" value="2" up-switch="#switchee">
    
                  <div id="switchee" up-show-for="1">
                    Switchee
                  </div>
                </form>
              `)

              await jasmine.expectGlobalError(/Use \[up-switch\] with the container of a radio group/i, async function() {
                up.hello(form)
                await wait()
              })

            })
          }


        })

      })

      describe('with [up-keep]', function() {

        it('supports moving an [up-switch][up-keep] element to a new form', async function() {
          const [oldForm, select] = htmlFixtureList(`
            <form id="form">
              <select name="name" up-keep up-switch="#target">
                <option value="foo" selected>foo</option>              
                <option value="bar">bar</option>              
              </select>
              <div id="target" up-show-for="bar">old target</div>
            </form>
          `)

          up.hello(oldForm)
          await wait()

          expect('#target').toHaveText('old target')
          expect('#target').toBeHidden()

          const { fragment: newForm } = await up.render({ fragment: `
            <form id="form">
              <select name="name" up-keep up-switch="#target">
                <option value="foo" selected>foo</option>              
                <option value="bar">bar</option>              
              </select>
              <div id="target" up-show-for="bar">new target</div>
            </form>
          ` })

          // The switcher was preserved, but attached to the new form
          expect(select).toBeAttached()
          expect(select.parentElement).toBe(newForm)
          expect(select.value).toBe('foo')

          // Other elements in the new form were updated from the server response
          expect('#target').toHaveText('new target')
          expect('#target').toBeHidden()

          // Show that the kept switcher is switching elements in its new form
          select.value = 'bar'
          Trigger.change(select)
          await wait()

          expect('#target').toBeVisible()


          // Show that the kept switcher is still watching for new fragments on the new form
          up.render({ fragment: `
            <div id="target" up-show-for="foo">newer target</div>
          `})
          await wait()

          expect('#target').toHaveText('newer target')
          expect('#target').toBeHidden()

          select.value = 'foo'
          Trigger.change(select)
          await wait()

          expect('#target').toBeVisible()
        })

      })

      describe('scope of switchee matching', function() {

        it('only switches a target in the same form', async function() {
          const form1 = fixture('form')
          const form1Input = e.affix(form1, 'input[name="foo"][up-switch=".target"]')
          const form1Target = e.affix(form1, '.target[up-show-for="active"]')
          up.hello(form1)

          const form2 = fixture('form')
          const form2Input = e.affix(form2, 'input[name="foo"][up-switch=".target"]')
          const form2Target = e.affix(form2, '.target[up-show-for="active"]')
          up.hello(form2)
          await wait()

          expect(form1Target).toBeHidden()
          expect(form2Target).toBeHidden()

          form2Input.value = 'active'
          Trigger.change(form2Input)
          await wait()

          expect(form1Target).toBeHidden()
          expect(form2Target).toBeVisible()
        })

        it('switches all matching targets', async function() {
          const form = fixture('form')
          const formInput = e.affix(form, 'input[name="foo"][up-switch=".target"]')
          const formTarget1 = e.affix(form, '.target[up-show-for="active"]')
          const formTarget2 = e.affix(form, '.target[up-show-for="active"]')
          up.hello(form)

          expect(formTarget1).toBeHidden()
          expect(formTarget2).toBeHidden()

          formInput.value = 'active'
          Trigger.change(formInput)
          await wait()

          expect(formTarget1).toBeVisible()
          expect(formTarget2).toBeVisible()

          formInput.value = 'inactive'
          Trigger.change(formInput)
          await wait()

          expect(formTarget1).toBeHidden()
          expect(formTarget2).toBeHidden()
        })

        it("can watch a form-external field", async function() {
          const container = fixture('#container')
          const form = e.affix(container, 'form#form-id')
          const externalSelect = e.affix(container, 'select[name="select-name"][up-switch=".target"][form="form-id"]')
          const fooOption = e.affix(externalSelect, 'option[value="foo"]', { text: 'Foo' })
          const barOption = e.affix(externalSelect, 'option[value="bar"]', { text: 'Bar' })
          const target = e.affix(form, '.target[up-show-for="bar"]')
          up.hello(container)
          await wait()

          expect(target).toBeHidden()

          externalSelect.value = 'bar'
          Trigger.change(externalSelect)
          await wait()

          expect(target).toBeVisible()
        })

        it('can watch a form-external field that is inserted after the form', async function() {
          const form = fixture('form#form-id')
          const target = e.affix(form, '.target[up-show-for="bar"]')
          up.hello(form)
          await wait()

          expect(target).toBeVisible()

          const externalSelect = fixture('select[name="select-name"][up-switch=".target"][form="form-id"]')
          const fooOption = e.affix(externalSelect, 'option[value="foo"]', { text: 'Foo' })
          const barOption = e.affix(externalSelect, 'option[value="bar"]', { text: 'Bar' })
          up.hello(externalSelect)
          await wait()

          expect(target).toBeHidden()

          externalSelect.value = 'bar'
          Trigger.change(externalSelect)
          await wait()

          expect(target).toBeVisible()
        })

        it('switches matching element outside the form with [up-switch-region=":layer"]', async function() {
          const form = fixture('form')
          const field = e.affix(form, 'input[name="foo"][up-switch=".target"][up-switch-region=":layer"]')
          const targetInsideForm = e.affix(form, '.target[up-show-for="active"]')
          up.hello(form)

          const targetOutsideForm = fixture('.target[up-show-for="active"]')
          up.hello(targetOutsideForm)
          await wait()

          expect(targetInsideForm).toBeHidden()
          expect(targetOutsideForm).toBeHidden()

          field.value = 'active'
          Trigger.change(field)
          await wait()

          expect(targetInsideForm).toBeVisible()
          expect(targetOutsideForm).toBeVisible()
        })

        it('switches matching element within a field ancestor with [up-switch-region="#selector"]', async function() {
          let [form, fieldContainer, field, target1, target2, otherContainer, target3] = htmlFixtureList(`
            <form>
              <div class="container">
                <input name="foo" up-switch=".target" up-switch-region=".container">
                <div class="target" up-show-for="active">target1</div>
                <div class="target" up-show-for="active">target2</div>
              </div>
              <div class="container">
                <div class="target" up-show-for="active">target3</div>
              </div>
            </form>
          `)
          up.hello(form)

          expect(target1).toBeHidden()
          expect(target2).toBeHidden()
          expect(target3).toBeVisible()

          field.value = 'active'
          Trigger.change(field)
          await wait()

          expect(target1).toBeVisible()
          expect(target2).toBeVisible()
          expect(target3).toBeVisible()

          field.value = 'inactive'
          Trigger.change(field)
          await wait()

          expect(target1).toBeHidden()
          expect(target2).toBeHidden()
          expect(target3).toBeVisible()
        })

        it('switches matching element within a non-ancestor container with [up-switch-region="#selector"]', async function() {
          let [form, field, container, target1, target2, target3] = htmlFixtureList(`
            <form>
              <input name="foo" up-switch=".target" up-switch-region=".container">
              <div class="container">
                <div class="target" up-show-for="active">target1</div>
                <div class="target" up-show-for="active">target2</div>
              </div>
              <div class="target" up-show-for="active">target3</div>
            </form>
          `)
          up.hello(form)

          expect(target1).toBeHidden()
          expect(target2).toBeHidden()
          expect(target3).toBeVisible()

          field.value = 'active'
          Trigger.change(field)
          await wait()

          expect(target1).toBeVisible()
          expect(target2).toBeVisible()
          expect(target3).toBeVisible()

          field.value = 'inactive'
          Trigger.change(field)
          await wait()

          expect(target1).toBeHidden()
          expect(target2).toBeHidden()
          expect(target3).toBeVisible()
        })
      })

      describe('switching visibility', function() {

        describe('on a select', function() {

          beforeEach(function() {
            this.$form = $fixture('form')
            this.$select = this.$form.affix('select[name="select-name"][up-switch=".target"]')
            this.$blankOption = this.$select.affix('option').text('<Please select something>').val('')
            this.$fooOption = this.$select.affix('option[value="foo"]').text('Foo')
            this.$barOption = this.$select.affix('option[value="bar"]').text('Bar')
            this.$bazOption = this.$select.affix('option[value="baz"]').text('Baz')
            this.$phraseOption = this.$select.affix('option[value="Some phrase"]').text('Some phrase')
          })

          it("shows the target element if a space-separated [up-show-for] token contains the select value", async function() {
            const $target = this.$form.affix('.target[up-show-for="something bar other"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeHidden()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeVisible()
          })

          it("shows the target element if a comma-separated [up-show-for] token contains the select value", async function() {
            const $target = this.$form.affix('.target[up-show-for="something, bar, other"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeHidden()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeVisible()
          })

          it('toggles multiple target elements', async function() {
            const $target1 = this.$form.affix('.target[up-show-for="something, bar, other"]')
            const $target2 = this.$form.affix('.target[up-show-for="something, bar, other"]')
            up.hello(this.$form)
            await wait()

            expect($target1).toBeHidden()
            expect($target2).toBeHidden()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target1).toBeVisible()
            expect($target2).toBeVisible()
          })

          it("shows the target element if a space-separated [up-hide-for] attribute doesn't contain the select value", async function() {
            const $target = this.$form.affix('.target[up-hide-for="something bar other"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeVisible()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeHidden()
          })

          it("shows the target element if a comma-separated [up-hide-for] attribute doesn't contain the select value", async function() {
            const $target = this.$form.affix('.target[up-hide-for="something, bar, other"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeVisible()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeHidden()
          })

          it("shows the target element if its up-show-for attribute contains a value ':present' and the select value is present", async function() {
            const $target = this.$form.affix('.target[up-show-for=":present"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeHidden()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeVisible()
          })

          it("shows the target element if its up-show-for attribute contains a value ':blank' and the select value is blank", async function() {
            const $target = this.$form.affix('.target[up-show-for=":blank"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeVisible()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeHidden()
          })

          it("shows the target element if its up-show-for attribute contains the select value encoded as a JSON array", async function() {
            const $target = this.$form.affix('.target')
            $target.attr('up-show-for', '["Some phrase"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeHidden()
            this.$select.val('Some phrase')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeVisible()
          })

          it('does not show a default-hidden target without [up-show-for] and [up-hide-for] attributes', async function() {
            const $target = this.$form.affix('.target[hidden]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeHidden()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeHidden()
          })

          it('does not hide a default-visible target without [up-show-for] and [up-hide-for] attributes', async function() {
            const $target = this.$form.affix('.target')
            up.hello(this.$form)
            await wait()

            expect($target).toBeVisible()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeVisible()
          })

        })

        describe('on a checkbox', function() {

          beforeEach(function() {
            this.$form = $fixture('form')
            this.$checkbox = this.$form.affix('input[name="input-name"][type="checkbox"][value="1"][up-switch=".target"]')
          })

          it("shows the target element if its up-show-for attribute is :checked and the checkbox is checked", async function() {
            const $target = this.$form.affix('.target[up-show-for=":checked"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeHidden()
            this.$checkbox.prop('checked', true)
            Trigger.change(this.$checkbox)
            await wait()

            expect($target).toBeVisible()
          })

          it("shows the target element if its up-show-for attribute is :unchecked and the checkbox is unchecked", async function() {
            const $target = this.$form.affix('.target[up-show-for=":unchecked"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeVisible()
            this.$checkbox.prop('checked', true)
            Trigger.change(this.$checkbox)
            await wait()

            expect($target).toBeHidden()
          })

          it("shows the target element if its up-hide-for attribute is :checked and the checkbox is unchecked", async function() {
            const $target = this.$form.affix('.target[up-hide-for=":checked"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeVisible()
            this.$checkbox.prop('checked', true)
            Trigger.change(this.$checkbox)
            await wait()

            expect($target).toBeHidden()
          })

          it("shows the target element if its up-hide-for attribute is :unchecked and the checkbox is checked", async function() {
            const $target = this.$form.affix('.target[up-hide-for=":unchecked"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeHidden()
            this.$checkbox.prop('checked', true)
            Trigger.change(this.$checkbox)
            await wait()

            expect($target).toBeVisible()
          })

        })

        describe('on a group of radio buttons', function() {

          beforeEach(function() {
            this.$form = $fixture('form')
            this.$buttons = this.$form.affix('.radio-buttons[up-switch=".target"]')
            this.$blankButton = this.$buttons.affix('input[type="radio"][name="group"]').val('')
            this.$fooButton = this.$buttons.affix('input[type="radio"][name="group"]').val('foo')
            this.$barButton = this.$buttons.affix('input[type="radio"][name="group"]').val('bar')
            this.$bazkButton = this.$buttons.affix('input[type="radio"][name="group"]').val('baz')
          })

          it("shows the target element if its up-show-for attribute contains the selected button value", async function() {
            const $target = this.$form.affix('.target[up-show-for="something bar other"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeHidden()
            this.$barButton.prop('checked', true)
            Trigger.change(this.$barButton)
            await wait()

            expect($target).toBeVisible()
          })

          it("shows the target element if its up-hide-for attribute doesn't contain the selected button value", async function() {
            const $target = this.$form.affix('.target[up-hide-for="something bar other"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeVisible()
            this.$barButton.prop('checked', true)
            Trigger.change(this.$barButton)
            await wait()

            expect($target).toBeHidden()
          })

          it("shows the target element if its up-show-for attribute contains a value ':present' and the selected button value is present", async function() {
            const $target = this.$form.affix('.target[up-show-for=":present"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeHidden()
            this.$blankButton.prop('checked', true)
            Trigger.change(this.$blankButton)
            await wait()

            expect($target).toBeHidden()
            this.$barButton.prop('checked', true)
            Trigger.change(this.$barButton)
            await wait()

            expect($target).toBeVisible()
          })

          it("shows the target element if its up-show-for attribute contains a value ':blank' and the selected button value is blank", async function() {
            const $target = this.$form.affix('.target[up-show-for=":blank"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeVisible()
            this.$blankButton.prop('checked', true)
            Trigger.change(this.$blankButton)
            await wait()

            expect($target).toBeVisible()
            this.$barButton.prop('checked', true)
            Trigger.change(this.$barButton)
            await wait()

            expect($target).toBeHidden()
          })

          it("shows the target element if its up-show-for attribute contains a value ':present' and any button with a value is checked", async function() {
            const $target = this.$form.affix('.target[up-show-for=":present"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeHidden()
            this.$fooButton.prop('checked', true)
            Trigger.change(this.$blankButton)
            await wait()

            expect($target).toBeVisible()
          })

          it("shows the target element if its up-show-for attribute contains a value ':blank' and no button with a value is checked", async function() {
            const $target = this.$form.affix('.target[up-show-for=":blank"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeVisible()
            this.$fooButton.prop('checked', true)
            Trigger.change(this.$blankButton)
            await wait()

            expect($target).toBeHidden()
          })
        })

        describe('on a text input', function() {

          beforeEach(function() {
            this.$form = $fixture('form')
            this.$textInput = this.$form.affix('input[name="input-name"][type="text"][up-switch=".target"]')
          })

          it("shows the target element if its up-show-for attribute contains the input value", async function() {
            const $target = this.$form.affix('.target[up-show-for="something bar other"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeHidden()
            this.$textInput.val('bar')
            Trigger.change(this.$textInput)
            await wait()

            expect($target).toBeVisible()
          })

          it("shows the target element if its up-hide-for attribute doesn't contain the input value", async function() {
            const $target = this.$form.affix('.target[up-hide-for="something bar other"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeVisible()
            this.$textInput.val('bar')
            Trigger.change(this.$textInput)
            await wait()

            expect($target).toBeHidden()
          })


          it("shows the target element if its up-show-for attribute contains a value ':present' and the input value is present", async function() {
            const $target = this.$form.affix('.target[up-show-for=":present"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeHidden()
            this.$textInput.val('bar')
            Trigger.change(this.$textInput)
            await wait()

            expect($target).toBeVisible()
          })

          it("shows the target element if its up-show-for attribute contains a value ':blank' and the input value is blank", async function() {
            const $target = this.$form.affix('.target[up-show-for=":blank"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeVisible()
            this.$textInput.val('bar')
            Trigger.change(this.$textInput)
            await wait()

            expect($target).toBeHidden()
          })
        })

        describe('when an [up-show-for] element is dynamically inserted later', function() {

          it("shows the element if it matches the [up-switch] control's value", async function() {
            const $form = $fixture('form')
            const $select = $form.affix('select[name="select-name"][up-switch=".target"]')
            $select.affix('option[value="foo"]').text('Foo')
            $select.affix('option[value="bar"]').text('Bar')
            $select.val('foo')
            up.hello($select)
            await wait()

            // New target enters the DOM after [up-switch] has been compiled
            this.$target = $form.affix('.target[up-show-for="bar"]')
            up.hello(this.$target)
            await wait()

            expect(this.$target).toBeHidden()

            // Check that the new element will notify subsequent changes
            $select.val('bar')
            Trigger.change($select)
            await wait()

            expect(this.$target).toBeVisible()
          })

          it("doesn't re-switch targets that were part of the original compile run", async function() {
            const $form = $fixture('form')

            const $select = $form.affix('select[name="select-name"][up-switch=".target"]')
            $select.affix('option[value="foo"]').text('Foo')
            $select.affix('option[value="bar"]').text('Bar')
            $select.val('foo')
            const $existingTarget = $form.affix('.target.existing[up-show-for="bar"]')

            const switchTargetSpy = spyOn(up.Switcher.prototype, '_switchSwitcheeNow').and.callThrough()

            up.hello($form)
            await wait()

            // New target enters the DOM after [up-switch] has been compiled
            this.$lateTarget = $form.affix('.target.late[up-show-for="bar"]')
            up.hello(this.$lateTarget)
            await wait()

            expect(switchTargetSpy.calls.count()).toBe(2)
            expect(switchTargetSpy.calls.argsFor(0)[0]).toEqual($existingTarget[0])
            expect(switchTargetSpy.calls.argsFor(1)[0]).toEqual(this.$lateTarget[0])
          })
        })

      })

      describe('switching disabled-ness', function() {

        describe('on a select', function() {

          beforeEach(function() {
            this.$form = $fixture('form')
            this.$select = this.$form.affix('select[name="select-name"][up-switch=".target"]')
            this.$blankOption = this.$select.affix('option').text('<Please select something>').val('')
            this.$fooOption = this.$select.affix('option[value="foo"]').text('Foo')
            this.$barOption = this.$select.affix('option[value="bar"]').text('Bar')
            this.$bazOption = this.$select.affix('option[value="baz"]').text('Baz')
            this.$phraseOption = this.$select.affix('option[value="Some phrase"]').text('Some phrase')
          })

          it("enables the target element if a space-separated [up-enable-for] token contains the select value", async function() {
            const $target = this.$form.affix('input.target[up-enable-for="something bar other"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeDisabled()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeEnabled()
          })

          it("enables the target element if a comma-separated [up-enable-for] token contains the select value", async function() {
            const $target = this.$form.affix('input.target[up-enable-for="something, bar, other"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeDisabled()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeEnabled()
          })

          it("enables the target element if a space-separated [up-disable-for] attribute doesn't contain the select value", async function() {
            const $target = this.$form.affix('input.target[up-disable-for="something bar other"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeEnabled()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeDisabled()
          })

          it("enables the target element if a comma-separated [up-disable-for] attribute doesn't contain the select value", async function() {
            const $target = this.$form.affix('input.target[up-disable-for="something, bar, other"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeEnabled()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeDisabled()
          })

          it('disables all fields within a targeted container', async function() {
            const form = fixture('form')
            const controllingField = e.affix(form, 'input[name="foo"][up-switch=".target"]')
            const targetContainer = e.affix(form, '.target[up-enable-for="active"]')
            const targetedField1 = e.affix(targetContainer, 'input[name=field1]')
            const targetedField2 = e.affix(targetContainer, 'input[name=field2]')
            const untargetedField = e.affix(form, 'input[name=field3][up-enable-for="active"]')
            up.hello(form)

            expect(targetedField1).toBeDisabled()
            expect(targetedField2).toBeDisabled()
            expect(untargetedField).toBeEnabled()

            controllingField.value = 'active'
            Trigger.change(controllingField)
            await wait()

            expect(targetedField1).toBeEnabled()
            expect(targetedField2).toBeEnabled()
            expect(untargetedField).toBeEnabled()

            controllingField.value = 'inactive'
            Trigger.change(controllingField)
            await wait()

            expect(targetedField1).toBeDisabled()
            expect(targetedField2).toBeDisabled()
            expect(untargetedField).toBeEnabled()
          })

          it("enables the target element if its [up-enable-for] attribute contains a value ':present' and the select value is present", async function() {
            const $target = this.$form.affix('input.target[up-enable-for=":present"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeDisabled()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeEnabled()
          })

          it("enables the target element if its [up-enable-for] attribute contains a value ':blank' and the select value is blank", async function() {
            const $target = this.$form.affix('input.target[up-enable-for=":blank"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeEnabled()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeDisabled()
          })

          it("enables the target element if its [up-enable-for] attribute contains the select value encoded as a JSON array", async function() {
            const $target = this.$form.affix('input.target')
            $target.attr('up-enable-for', '["Some phrase"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeDisabled()
            this.$select.val('Some phrase')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeEnabled()
          })

          it('does not enable a default-disabled target without [up-enable-for] and [up-disable-for] attributes', async function() {
            const $target = this.$form.affix('input.target[disabled]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeDisabled()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeDisabled()
          })

          it('does not disable a default-enabled target without [up-enable-for] and [up-disable-for] attributes', async function() {
            const $target = this.$form.affix('input.target')
            up.hello(this.$form)
            await wait()

            expect($target).toBeEnabled()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeEnabled()
          })

        })

        describe('on a checkbox', function() {

          beforeEach(function() {
            this.$form = $fixture('form')
            this.$checkbox = this.$form.affix('input[name="input-name"][type="checkbox"][value="1"][up-switch=".target"]')
          })

          it("enables the target element if its up-enable-for attribute is :checked and the checkbox is checked", async function() {
            const $target = this.$form.affix('input.target[up-enable-for=":checked"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeDisabled()
            this.$checkbox.prop('checked', true)
            Trigger.change(this.$checkbox)
            await wait()

            expect($target).toBeEnabled()
          })

          it("enables the target element if its up-enable-for attribute is :unchecked and the checkbox is unchecked", async function() {
            const $target = this.$form.affix('input.target[up-enable-for=":unchecked"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeEnabled()
            this.$checkbox.prop('checked', true)
            Trigger.change(this.$checkbox)
            await wait()

            expect($target).toBeDisabled()
          })

          it("enables the target element if its up-disable-for attribute is :checked and the checkbox is unchecked", async function() {
            const $target = this.$form.affix('input.target[up-disable-for=":checked"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeEnabled()
            this.$checkbox.prop('checked', true)
            Trigger.change(this.$checkbox)
            await wait()

            expect($target).toBeDisabled()
          })

          it("enables the target element if its up-disable-for attribute is :unchecked and the checkbox is checked", async function() {
            const $target = this.$form.affix('input.target[up-disable-for=":unchecked"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeDisabled()
            this.$checkbox.prop('checked', true)
            Trigger.change(this.$checkbox)
            await wait()

            expect($target).toBeEnabled()
          })

        })

        describe('on a group of radio buttons', function() {

          beforeEach(function() {
            this.$form = $fixture('form')
            this.$buttons = this.$form.affix('.radio-buttons[up-switch=".target"]')
            this.$blankButton = this.$buttons.affix('input[type="radio"][name="group"]').val('')
            this.$fooButton = this.$buttons.affix('input[type="radio"][name="group"]').val('foo')
            this.$barButton = this.$buttons.affix('input[type="radio"][name="group"]').val('bar')
            this.$bazkButton = this.$buttons.affix('input[type="radio"][name="group"]').val('baz')
          })

          it("enables the target element if its up-enable-for attribute contains the selected button value", async function() {
            const $target = this.$form.affix('input.target[up-enable-for="something bar other"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeDisabled()
            this.$barButton.prop('checked', true)
            Trigger.change(this.$barButton)
            await wait()

            expect($target).toBeEnabled()
          })

          it("enables the target element if its up-disable-for attribute doesn't contain the selected button value", async function() {
            const $target = this.$form.affix('input.target[up-disable-for="something bar other"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeEnabled()
            this.$barButton.prop('checked', true)
            Trigger.change(this.$barButton)
            await wait()

            expect($target).toBeDisabled()
          })

          it("enables the target element if its up-enable-for attribute contains a value ':present' and the selected button value is present", async function() {
            const $target = this.$form.affix('input.target[up-enable-for=":present"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeDisabled()
            this.$blankButton.prop('checked', true)
            Trigger.change(this.$blankButton)
            await wait()

            expect($target).toBeDisabled()
            this.$barButton.prop('checked', true)
            Trigger.change(this.$barButton)
            await wait()

            expect($target).toBeEnabled()
          })

          it("enables the target element if its up-enable-for attribute contains a value ':blank' and the selected button value is blank", async function() {
            const $target = this.$form.affix('input.target[up-enable-for=":blank"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeEnabled()
            this.$blankButton.prop('checked', true)
            Trigger.change(this.$blankButton)
            await wait()

            expect($target).toBeEnabled()
            this.$barButton.prop('checked', true)
            Trigger.change(this.$barButton)
            await wait()

            expect($target).toBeDisabled()
          })

          it("enables the target element if its up-enable-for attribute contains a value ':checked' and any button is checked", async function() {
            const $target = this.$form.affix('input.target[up-enable-for=":checked"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeDisabled()
            this.$blankButton.prop('checked', true)
            Trigger.change(this.$blankButton)
            await wait()

            expect($target).toBeEnabled()
          })

          it("enables the target element if its up-enable-for attribute contains a value ':unchecked' and no button is checked", async function() {
            const $target = this.$form.affix('input.target[up-enable-for=":unchecked"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeEnabled()
            this.$blankButton.prop('checked', true)
            Trigger.change(this.$blankButton)
            await wait()

            expect($target).toBeDisabled()
          })
        })

        describe('on a text input', function() {

          beforeEach(function() {
            this.$form = $fixture('form')
            this.$textInput = this.$form.affix('input[name="input-name"][type="text"][up-switch=".target"]')
          })

          it("enables the target element if its up-enable-for attribute contains the input value", async function() {
            const $target = this.$form.affix('input.target[up-enable-for="something bar other"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeDisabled()
            this.$textInput.val('bar')
            Trigger.change(this.$textInput)
            await wait()

            expect($target).toBeEnabled()
          })

          it("enables the target element if its up-disable-for attribute doesn't contain the input value", async function() {
            const $target = this.$form.affix('input.target[up-disable-for="something bar other"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeEnabled()
            this.$textInput.val('bar')
            Trigger.change(this.$textInput)
            await wait()

            expect($target).toBeDisabled()
          })


          it("enables the target element if its up-enable-for attribute contains a value ':present' and the input value is present", async function() {
            const $target = this.$form.affix('input.target[up-enable-for=":present"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeDisabled()
            this.$textInput.val('bar')
            Trigger.change(this.$textInput)
            await wait()

            expect($target).toBeEnabled()
          })

          it("enables the target element if its up-enable-for attribute contains a value ':blank' and the input value is blank", async function() {
            const $target = this.$form.affix('input.target[up-enable-for=":blank"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeEnabled()
            this.$textInput.val('bar')
            Trigger.change(this.$textInput)
            await wait()

            expect($target).toBeDisabled()
          })
        })

        describe('when an [up-enable-for] element is dynamically inserted later', function() {

          it("enables the element if it matches the [up-switch] control's value", async function() {
            const $form = $fixture('form')
            const $select = $form.affix('select[name="select-name"][up-switch=".target"]')
            $select.affix('option[value="foo"]').text('Foo')
            $select.affix('option[value="bar"]').text('Bar')
            $select.val('foo')
            up.hello($form)
            await wait()

            // New target enters the DOM after [up-switch] has been compiled
            this.$target = $form.affix('input.target[up-enable-for="bar"]')
            up.hello(this.$target)
            await wait()

            expect(this.$target).toBeDisabled()

            // Check that the new element will notify subsequent changes
            $select.val('bar')
            Trigger.change($select)
            await wait()

            expect(this.$target).toBeEnabled()
          })

          it("doesn't re-switch targets that were part of the original compile run", async function() {
            const $form = $fixture('form.container')

            const $select = $form.affix('select[name="select-name"][up-switch=".target"]')
            $select.affix('option[value="foo"]').text('Foo')
            $select.affix('option[value="bar"]').text('Bar')
            $select.val('foo')
            const $existingTarget = $form.affix('.target.existing[up-enable-for="bar"]')

            const switchTargetSpy = spyOn(up.Switcher.prototype, '_switchSwitcheeNow').and.callThrough()

            up.hello($form)
            await wait()

            // New target enters the DOM after [up-switch] has been compiled
            this.$lateTarget = $form.affix('input.target.late[up-enable-for="bar"]')
            up.hello(this.$lateTarget)
            await wait()

            expect(switchTargetSpy.calls.count()).toBe(2)
            expect(switchTargetSpy.calls.argsFor(0)[0]).toEqual($existingTarget[0])
            expect(switchTargetSpy.calls.argsFor(1)[0]).toEqual(this.$lateTarget[0])
          })
        })

      })


    })
  })
})
