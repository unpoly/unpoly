const u = up.util

extendDescribe('up.form', function() {

  extendDescribe('JavaScript functions', function() {

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
          ` })

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

  })

})
