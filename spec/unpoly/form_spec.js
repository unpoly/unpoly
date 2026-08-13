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

      it('runs the callback for an existing field that is a descendant of the form', async function() {
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

      it('does not run the callback for an existing field of another form', async function() {
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

      it('runs the callback for fields that are rendered into to the form later', async function() {
        let attachSpy = jasmine.createSpy('attach callback')
        let detachSpy = jasmine.createSpy('detach callback')

        const [form, field1, target] = htmlFixtureList(`
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

      it('runs the callback for fields that are manually inserted into the form later, when up.hello() is called', async function() {
        let attachSpy = jasmine.createSpy('attach callback')
        let detachSpy = jasmine.createSpy('detach callback')

        const [form, field1] = htmlFixtureList(`
          <form>
            <input type="text" name="field1">
          </form>
        `)

        up.form.trackFields(form, (field) => {
          attachSpy(field.name)
          return () => detachSpy(field.name)
        })

        expect(attachSpy.calls.allArgs()).toEqual([['field1']])

        const field2 = up.element.createFromHTML('<input type="text" name="field2">')
        form.append(field2)
        up.hello(field2)

        await wait()

        expect(attachSpy.calls.allArgs()).toEqual([['field1'], ['field2']])
      })

      it('does not run the callback for fields that are rendered into another form later', async function() {
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

      it('runs an undo callback when the field is destroyed with up.destroy()', async function() {
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

      describe('with a root that is a single field', function() {

        it('runs the callback once for the field', async function() {
          let changeSpy = jasmine.createSpy('change spy')

          const [form, field1] = htmlFixtureList(`
            <form id="form">
              <input type="text" name="field1">
            </form>
          `)

          up.form.trackFields(field1, (f) => {
            changeSpy('attach', f.name)
            return () => changeSpy('detach', f.name)
          })

          expect(changeSpy.calls.allArgs()).toEqual([['attach', 'field1']])
        })

        it('runs the callback for a field without an enclosing form', async function() {
          let changeSpy = jasmine.createSpy('change spy')

          const [field1] = htmlFixtureList(`
            <input type="text" name="field1">
          `)

          up.form.trackFields(field1, (f) => {
            changeSpy('attach', f.name)
            return () => changeSpy('detach', f.name)
          })

          expect(changeSpy.calls.allArgs()).toEqual([['attach', 'field1']])
        })

        it('does not run the callback for other fields in the form', async function() {
          let changeSpy = jasmine.createSpy('change spy')

          const [form, field1, field2] = htmlFixtureList(`
            <form id="form">
              <input type="text" name="field1">
              <input type="text" name="field2">
            </form>
          `)

          up.form.trackFields(field1, (f) => {
            changeSpy('attach', f.name)
            return () => changeSpy('detach', f.name)
          })

          expect(changeSpy.calls.allArgs()).toEqual([['attach', 'field1']])
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

      describe('performance', function() {

        it('syncs once after initialization', async function() {
          const syncSpy = spyOn(up.SelectorTracker.prototype, '_sync').and.callThrough()

          const [form, field1, field2] = htmlFixtureList(`
            <form>
              <input type="text" name="field1">
              <input type="text" name="field2">
            </form>
          `)

          up.form.trackFields(form, u.noop)
          await wait()

          expect(syncSpy.calls.count()).toBe(1)
        })

        it('syncs once when a field is swapped', async function() {
          const [form, field] = htmlFixtureList(`
            <form id="form">
              <input type="text" name="field1" id="field">
            </form>
          `)

          up.form.trackFields(form, u.noop)
          await wait()

          const syncSpy = spyOn(up.SelectorTracker.prototype, '_sync').and.callThrough()

          up.render({ fragment: `
            <input type="text" name="field2" id="field">
          `})

          await wait()

          expect(syncSpy.calls.count()).toBe(1)
        })

        it('syncs once when a new field is rendered into the form', async function() {
          const [form, field1, target] = htmlFixtureList(`
            <form id="form">
              <input type="text" name="field1">
              <div id="target"></div>
            </form>
          `)

          up.form.trackFields(form, u.noop)
          await wait()

          const syncSpy = spyOn(up.SelectorTracker.prototype, '_sync').and.callThrough()

          up.render({ fragment: `
            <div id="target">
              <input type="text" name="field2">
              <input type="text" name="field3">
            </div>
          ` })

          await wait()

          expect(document.querySelectorAll('#form input').length).toBe(3)
          expect(syncSpy.calls.count()).toBe(1)
        })

        it('syncs once when a new field is manually inserted into the form, and passed to up.hello()', async function() {
          const [form, field1] = htmlFixtureList(`
            <form id="form">
              <input type="text" name="field1">
            </form>
          `)

          up.form.trackFields(form, u.noop)
          await wait()

          const syncSpy = spyOn(up.SelectorTracker.prototype, '_sync').and.callThrough()

          let field2 = up.element.createFromHTML('<input type="text" name="field2">')
          form.append(field2)
          up.hello(field2)

          await wait()

          expect(document.querySelectorAll('#form input').length).toBe(2)
          expect(syncSpy.calls.count()).toBe(1)
        })

        it('syncs once after a multi-target render pass', async function() {
          let html = `
            <form>
              <input type="text" name="field1">
              <input type="text" name="field2">
            </form>
          `
          const [form, field1, field2] = htmlFixtureList(html)

          up.form.trackFields(form, u.noop)
          await wait()

          const syncSpy = spyOn(up.SelectorTracker.prototype, '_sync').and.callThrough()

          let result = await up.render({
            target: 'input[name=field1], input[name=field2]',
            document: html,
          })

          expect(result.fragments.length).toBe(2)

          expect(syncSpy.calls.count()).toBe(1)
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
        let [main, form, input, submitButton] = htmlFixtureList(`
          <main>old text</main>

          <form action="/form-target" method="put" up-submit="true">
            <input name="field" value="value">
            <input type="submit">
          </form>
        `)

        up.hello(form)

        Trigger.clickSequence(submitButton)
        await wait()

        expect(jasmine.lastRequest().data()['field']).toEqual(['value'])
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('main')
      })

      it('makes a full page load with [up-submit=false]', async function() {
        let [main, form, input, submitButton] = htmlFixtureList(`
          <main>old text</main>

          <form action="/form-target" method="put" up-submit="false">
            <input name="field" value="value">
            <input type="submit">
          </form>
        `)

        up.hello(form)

        Trigger.clickSequence(submitButton)
        await wait()

        expect(form).toHaveBeenDefaultSubmitted()
      })

      it('allows individual submit buttons to opt into a full page load with [up-submit=false]', async function() {
        let [main, form, input, unpolySubmitButton, vanillaSubmitButton] = htmlFixtureList(`
          <main>old text</main>

          <form action="/form-target" method="put" up-submit>
            <input name="field" value="value">
            <input type="submit">
            <input type="submit" up-submit="false">
          </form>
        `)

        up.hello(form)

        expect(jasmine.Ajax.requests.count()).toBe(0)

        Trigger.clickSequence(unpolySubmitButton)
        await wait()

        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(form).not.toHaveBeenDefaultSubmitted()

        Trigger.clickSequence(vanillaSubmitButton)
        await wait()

        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(form).toHaveBeenDefaultSubmitted()
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

        describe('when the form is submitted by pressing enter', function() {

          it('assumes the first submit button if the form was submitted with enter', async function() {
            const [form, textField, submitButton1, submitButton2, target] = htmlFixtureList(`
              <form method="post" action="/action" up-target="#target">
                <input type="text" name="text-field" value="text-field-value">
                <input type="submit" name="submit-button-1" value="submit-button-1-value">
                <input type="submit" name="submit-button-2" value="submit-button-2-value">
              </form>
              <div id="target"></div>
            `)
            up.hello(form)
            await wait()

            Trigger.submit(form)
            await wait()

            const params = jasmine.lastRequest().data()
            expect(params['text-field']).toEqual(['text-field-value'])
            expect(params['submit-button-1']).toEqual(['submit-button-1-value'])
            expect(params['submit-button-2']).toBeUndefined()
          })

          it('assumes a sole, form-external submit button (with [form] attribute)', async function() {
            const [form, textField, externalSubmitButton, target] = htmlFixtureList(`
              <form method="post" action="/action" up-target="#target" id="form-id">
                <input type="text" name="text-field" value="text-field-value">
              </form>
              <input type="submit" name="external-submit-button" value="external-submit-button-value" form="form-id">
              <div id="target"></div>
            `)
            up.hello(form)
            await wait()

            Trigger.submit(form)
            await wait()

            const params = jasmine.lastRequest().data()
            expect(params['text-field']).toEqual(['text-field-value'])
            expect(params['external-submit-button']).toEqual(['external-submit-button-value'])
          })

          it('submits a form without submit buttons', async function() {
            const [form, textField, target] = htmlFixtureList(`
              <form method="post" action="/action" up-target="#target" id="form-id">
                <input type="text" name="text-field" value="text-field-value">
              </form>
              <div id="target"></div>
            `)
            up.hello(form)
            await wait()

            Trigger.submit(form)
            await wait()

            const data = jasmine.lastRequest().data()
            expect(data).toMatchParams({
              'text-field': 'text-field-value'
            })
          })

        })

      })

      describe('choice of layer', function() {

        describe('without an [up-layer] attribute', function() {

          it('updates the current layer by default', async function() {
            let [form, submitButton, target] = htmlFixtureList(`
              <form up-submit up-target="#target" action="/action" method="/post">
                <input type="submit" value="Submit">
              </form>
              
              <div id="target">old target</div>
            `)

            up.hello(form)
            await wait()

            Trigger.clickSequence(submitButton)
            await wait()

            jasmine.respondWith(`<div id="target">new target</div>`)
            await wait()

            expect('#target').toHaveText('new target')
          })

          it('updates the current overlay by default', async function() {
            up.layer.open({ content: `
              <form up-submit up-target="#target" action="/action" method="/post">
                <input type="submit" value="Submit">
              </form>
              
              <div id="target">old target</div>
            `})
            await wait()

            expect('up-modal #target').toHaveText('old target')

            Trigger.clickSequence('input[type=submit]')
            await wait()

            jasmine.respondWith(`<div id="target">new target</div>`)
            await wait()

            expect(up.layer.current).toBeOverlay()
            expect('up-modal #target').toHaveText('new target')
          })

        })

        describe('with [up-layer="new"]', function() {

          it('renders a successful submission in a new overlay', async function() {
            let [form, submitButton, target] = htmlFixtureList(`
              <form up-submit up-target="#target" up-layer="new" action="/action" method="/post">
                <input type="submit" value="Submit">
              </form>
              
              <div id="target">old target</div>
            `)

            up.hello(form)
            await wait()

            Trigger.clickSequence(submitButton)
            await wait()

            jasmine.respondWith(`<div id="target">new target</div>`)
            await wait()

            expect(up.layer.current).toBeOverlay()
            expect(up.fragment.get('#target', { layer: 'root' })).toHaveText('old target')
            expect(up.fragment.get('#target', { layer: 'overlay' })).toHaveText('new target')
          })

          it('renders a failed submission to the current layer', async function() {
            let [form, submitButton, successTarget, failureTarget] = htmlFixtureList(`
              <form up-submit up-target="#success" up-fail-target="#failure" up-layer="new" action="/action" method="/post">
                <input type="submit" value="Submit">
              </form>
              
              <div id="success">old success</div>
              <div id="failure">old failure</div>
            `)

            up.hello(form)
            await wait()

            Trigger.clickSequence(submitButton)
            await wait()

            jasmine.respondWith(`<div id="failure">new failure</div>`, { status: 500 })
            await wait()

            expect(up.layer.current).toBeRootLayer()
            expect(up.fragment.get('#success', { layer: 'root' })).toHaveText('old success')
            expect(up.fragment.get('#failure', { layer: 'root' })).toHaveText('new failure')
          })

        })

        describe('with [up-fail-layer="new"]', function() {

          it('renders a successful submission in the current layer', async function() {
            let [form, submitButton, successTarget, failureTarget] = htmlFixtureList(`
              <form up-submit up-target="#success" up-fail-target="#failure" up-fail-layer="new" action="/action" method="/post">
                <input type="submit" value="Submit">
              </form>
              
              <div id="success">old success</div>
              <div id="failure">old failure</div>
            `)

            up.hello(form)
            await wait()

            Trigger.clickSequence(submitButton)
            await wait()

            jasmine.respondWith(`<div id="success">new success</div>`, { status: 200 })
            await wait()

            expect(up.layer.current).toBeRootLayer()
            expect(up.fragment.get('#success', { layer: 'root' })).toHaveText('new success')
            expect(up.fragment.get('#failure', { layer: 'root' })).toHaveText('old failure')
          })

          it('renders a failed submission in a new overlay', async function() {
            let [form, submitButton, successTarget, failureTarget] = htmlFixtureList(`
              <form up-submit up-target="#success" up-fail-target="#failure" up-fail-layer="new" action="/action" method="/post">
                <input type="submit" value="Submit">
              </form>
              
              <div id="success">old success</div>
              <div id="failure">old failure</div>
            `)

            up.hello(form)
            await wait()

            Trigger.clickSequence(submitButton)
            await wait()

            jasmine.respondWith(`<div id="failure">new failure</div>`, { status: 500 })
            await wait()

            expect(up.layer.current).toBeOverlay()
            expect(up.fragment.get('#failure', { layer: 'root' })).toHaveText('old failure')
            expect(up.fragment.get('#failure', { layer: 'overlay' })).toHaveText('new failure')

          })

        })

        describe('with [up-layer="root"]', function() {

          it('renders a successful submission in the root layer, closing a current overlay', async function() {
            htmlFixtureList('<div id="target">root target</div>')

            up.layer.open({ content: `
              <form up-submit up-target="#target" up-layer="root" action="/action" method="/post">
                <input type="submit" value="Submit">
              </form>
              
              <div id="target">overlay target</div>
            `})
            await wait()

            expect('up-modal #target').toHaveText('overlay target')

            Trigger.clickSequence('input[type=submit]')
            await wait()

            jasmine.respondWith(`<div id="target">new target</div>`)
            await wait()

            expect(up.layer.current).toBeRootLayer()
            expect(up.fragment.get('#target', { layer: 'root' })).toHaveText('new target')
          })

          it('renders a failed submission in the current overlay', async function() {
            htmlFixtureList(`
              <div id="success">root success</div>
              <div id="failure">root failure</div>
            `)

            up.layer.open({ content: `
              <form up-submit up-target="#success" up-fail-target="#failure" up-layer="root" action="/action" method="/post">
                <input type="submit" value="Submit">
              </form>
              
              <div id="success">overlay success</div>
              <div id="failure">overlay failure</div>
            `})
            await wait()

            Trigger.clickSequence('input[type=submit]')
            await wait()

            jasmine.respondWith(`<div id="failure">new failure</div>`, { status: 500 })
            await wait()

            expect(up.layer.current).toBeOverlay()
            expect(up.fragment.get('#success', { layer: 'root' })).toHaveText('root success')
            expect(up.fragment.get('#failure', { layer: 'root' })).toHaveText('root failure')
            expect(up.fragment.get('#success', { layer: 'overlay' })).toHaveText('overlay success')
            expect(up.fragment.get('#failure', { layer: 'overlay' })).toHaveText('new failure')
          })

        })

        it('lets submit buttons override the [up-layer] setting', async function() {
          let [form, submitButton, target] = htmlFixtureList(`
            <form up-submit up-target="#target" up-layer="new" action="/action" method="/post">
              <input type="submit" value="Submit" up-layer="current">
            </form>
            
            <div id="target">old target</div>
          `)

          up.hello(form)
          await wait()

          Trigger.clickSequence(submitButton)
          await wait()

          jasmine.respondWith(`<div id="target">new target</div>`)
          await wait()

          expect(up.layer.current).toBeRootLayer()
          expect(up.fragment.get('#target', { layer: 'root' })).toHaveText('new target')
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
