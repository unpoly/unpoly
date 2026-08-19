const e = up.element

extendDescribe('up.form', function() {

  extendDescribe('unobtrusive behavior', function() {

    describe('[up-switch]', function() {

      describe('custom form fields', function() {

        it('switches on a form-associated custom element without configuration', async function() {
          const [form, field, target] = htmlFixtureList(`
            <form>
              <test-form-associated-element name="mode" value="inactive" up-switch=".target"></test-form-associated-element>
              <div class="target" up-show-for="active">target</div>
            </form>
          `)
          up.hello(form)
          await wait()

          expect(target).toBeHidden()

          field.value = 'active'
          Trigger.change(field)
          await wait()

          expect(target).toBeVisible()
        })

        it('switches on a custom element that is configured in up.form.config.fieldSelectors', async function() {
          up.form.config.fieldSelectors.push('test-form-field')

          const [form, field, target] = htmlFixtureList(`
            <form>
              <test-form-field name="mode" value="inactive" up-switch=".target"></test-form-field>
              <div class="target" up-show-for="active">target</div>
            </form>
          `)
          up.hello(form)
          await wait()

          expect(target).toBeHidden()

          field.value = 'active'
          Trigger.change(field)
          await wait()

          expect(target).toBeVisible()
        })

        it('switches on the native field that a custom control keeps hidden and synced', async function() {
          const [form, select, , , target] = htmlFixtureList(`
            <form>
              <select name="mode" hidden up-switch=".target">
                <option value="inactive" selected>inactive</option>
                <option value="active">active</option>
              </select>
              <div class="target" up-show-for="active">target</div>
            </form>
          `)
          up.hello(form)
          await wait()

          expect(target).toBeHidden()

          select.value = 'active'
          Trigger.change(select)
          await wait()

          expect(target).toBeVisible()
        })

      })


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
          ` })
          await wait()

          expect(listener.calls.count()).toBe(2)
        })

      })

      describe('radio buttons', function() {

        it('switches a container of radio buttons', async function() {
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

        it('switches a container of radio buttons when (1) in a render pass and (2) a compiler changes the initial selection zzz', async function() {
          up.compiler('.container', function(container) {
            let radio2 = container.querySelector('input[value="2"]')
            radio2.checked = true
            Trigger.change(radio2)
          })

          fixture('#root')

          let { fragment: root } = await up.render({ fragment: `
            <div id="root">
              <form>
                <div up-switch=".switchee" class="container">
                  <input type="radio" name="group" value="1" checked>
                  <input type="radio" name="group" value="2">
                </div>
  
                <div class="switchee" up-show-for="1">
                  Switchee1
                </div>
  
                <div class="switchee" up-show-for="2">
                  Switchee2
                </div>
              </form>
            </div>
          ` })

          // Watch callbacks are debounced by at least 1 task.
          await wait(0)

          const [radio1, radio2] = root.querySelectorAll('input[type=radio]')
          const [switchee1, switchee2] = root.querySelectorAll('.switchee')

          expect(radio1).not.toBeChecked()
          expect(radio2).toBeChecked()
          expect(switchee1).not.toBeVisible()
          expect(switchee2).toBeVisible()

          radio1.checked = true
          Trigger.change(radio1)
          await wait()

          expect(radio1).toBeChecked()
          expect(radio2).not.toBeChecked()
          expect(switchee1).toBeVisible()
          expect(switchee2).not.toBeVisible()

          radio2.checked = true
          Trigger.change(radio2)
          await wait()

          expect(radio1).not.toBeChecked()
          expect(radio2).toBeChecked()
          expect(switchee1).not.toBeVisible()
          expect(switchee2).toBeVisible()
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

      }) // radio buttons

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
          ` })
          await wait()

          expect('#target').toHaveText('newer target')
          expect('#target').toBeHidden()

          select.value = 'foo'
          Trigger.change(select)
          await wait()

          expect('#target').toBeVisible()
        })

      })

      describe('event source', function() {

        it('switches on another event with [up-watch-event]', async function() {
          let [form, textField, target] = htmlFixtureList(`
            <form>
              <input name="field" up-switch=".target" up-watch-event="custom:event">
              <div class="target" up-show-for="foo">target text</div>
            </form>
          `)
          up.hello(form)
          await wait()

          expect(target).toBeHidden()

          textField.value = 'foo'
          Trigger.change(textField)
          await wait()

          expect(target).toBeHidden()

          up.emit(textField, 'custom:event')
          await wait()

          expect(target).toBeVisible()

          textField.value = 'bar'
          Trigger.change(textField)
          await wait()

          expect(target).toBeVisible()

          up.emit(textField, 'custom:event')
          await wait()

          expect(target).toBeHidden()
        })

        it('delays the switching with [up-watch-delay]', async function() {
          let [form, textField, target] = htmlFixtureList(`
            <form>
              <input name="field" up-switch=".target" up-watch-delay="50">
              <div class="target" up-show-for="foo">target text</div>
            </form>
          `)
          up.hello(form)
          await wait()

          expect(target).toBeHidden()

          textField.value = 'foo'
          Trigger.change(textField)
          await wait()

          expect(target).toBeHidden()
          await wait(100)

          expect(target).toBeVisible()
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

        it ('it allows a region to not exist now, but be inserted later', async function() {
          const form = fixture('form')
          const field = e.affix(form, 'input[name="foo"][up-switch=".target"][up-switch-region="#later"]')
          up.hello(form)

          const laterContainer = fixture('#later')
          const target = e.affix(laterContainer, '.target[up-show-for="active"]')
          up.hello(laterContainer)
          await wait()

          expect(target).toBeHidden()

          field.value = 'active'
          Trigger.change(field)
          await wait()

          expect(target).toBeVisible()
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

        describe('fields outside a <form>', function() {

          it('switches elements in the layer if the watched field has no enclosing <form>', async function() {
            const field = fixture('input[name="foo"][up-switch=".target"]')
            up.hello(field)

            const target = fixture('.target[up-show-for="active"]')
            up.hello(target)
            await wait()

            expect(target).toBeHidden()

            field.value = 'active'
            Trigger.change(field)
            await wait()

            expect(target).toBeVisible()
          })

          it('allows to narrow the region with an [up-switch-region] selector', async function() {
            const region = fixture('.region')
            const targetInsideRegion = e.affix(region, '.target[up-show-for="active"]')
            up.hello(region)
            const targetOutsideRegion = fixture('.target[up-show-for="active"]')
            up.hello(targetOutsideRegion)

            const field = fixture('input[name="foo"][up-switch=".target"][up-switch-region=".region"]')
            up.hello(field)

            await wait()

            expect(targetInsideRegion).toBeHidden()
            expect(targetOutsideRegion).toBeVisible()

            field.value = 'active'
            Trigger.change(field)
            await wait()

            expect(targetInsideRegion).toBeVisible()
            expect(targetOutsideRegion).toBeVisible()

            field.value = 'inactive'
            Trigger.change(field)
            await wait()

            expect(targetInsideRegion).toBeHidden()
            expect(targetOutsideRegion).toBeVisible()
          })

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

          it("switch a disabled select", async function() {
            this.$select.attr('disabled', '')
            const $target = this.$form.affix('.target[up-show-for="something bar other"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeHidden()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeVisible()
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

          it('toggles visibility when all fields are configured to be array fields', async function() {
            up.form.config.arrayParam = true

            const $target = this.$form.affix('.target[up-show-for="something bar other"]')
            up.hello(this.$form)
            await wait()

            expect($target).toBeHidden()
            this.$select.val('bar')
            Trigger.change(this.$select)
            await wait()

            expect($target).toBeVisible()
          })

        })

        describe('on a checkbox', function() {

          it("shows the target element if its up-show-for attribute is :checked and the checkbox is checked", async function() {
           const $form = $fixture('form')
           const $checkbox = $form.affix('input[name="input-name"][type="checkbox"][value="1"][up-switch=".target"]')

            const $target = $form.affix('.target[up-show-for=":checked"]')
            up.hello($form)
            await wait()

            expect($target).toBeHidden()
            $checkbox.prop('checked', true)
            Trigger.change($checkbox)
            await wait()

            expect($target).toBeVisible()
          })

          it("shows the target element if its up-show-for attribute is :checked and the checkbox is checked and the checkbox has no value", async function() {
           const $form = $fixture('form')
           const $checkbox = $form.affix('input[name="input-name"][type="checkbox"][up-switch=".target"]')

            const $target = $form.affix('.target[up-show-for=":checked"]')
            up.hello($form)
            await wait()

            expect($target).toBeHidden()
            $checkbox.prop('checked', true)
            Trigger.change($checkbox)
            await wait()

            expect($target).toBeVisible()
          })

          it("shows the target element if its up-show-for attribute is :unchecked and the checkbox is unchecked", async function() {
            const $form = $fixture('form')
            const $checkbox = $form.affix('input[name="input-name"][type="checkbox"][value="1"][up-switch=".target"]')

            const $target = $form.affix('.target[up-show-for=":unchecked"]')
            up.hello($form)
            await wait()

            expect($target).toBeVisible()
            $checkbox.prop('checked', true)
            Trigger.change($checkbox)
            await wait()

            expect($target).toBeHidden()
          })

          it('shows the target element is an array checkbox contains an [up-show-for] token', async function() {
            let [form, tags, tag1, tag2, tag3, target] = htmlFixtureList(`
              <form>
                <div up-switch="#target">
                  <input type="checkbox" name="tag[]" value="1">
                  <input type="checkbox" name="tag[]" value="2">
                  <input type="checkbox" name="tag[]" value="3">
                </div>
                
                <div id="target" up-show-for="1 3"></div>
              </form>
            `)
            up.hello(form)

            let selectedTags = () => up.Params.fromForm(form).get('tag[]')

            expect(selectedTags()).toEqual([])
            expect(target).toBeHidden()

            Trigger.toggleCheckSequence(tag1)
            await wait()

            expect(selectedTags()).toEqual(['1'])
            expect(target).toBeVisible()

            Trigger.toggleCheckSequence(tag2)
            await wait()

            expect(selectedTags()).toEqual(['1', '2'])
            expect(target).toBeVisible()

            Trigger.toggleCheckSequence(tag1)
            await wait()

            expect(selectedTags()).toEqual(['2'])
            expect(target).toBeHidden()

            Trigger.toggleCheckSequence(tag3)
            await wait()

            expect(selectedTags()).toEqual(['2', '3'])
            expect(target).toBeVisible()

            Trigger.toggleCheckSequence(tag2)
            await wait()

            expect(selectedTags()).toEqual(['3'])
            expect(target).toBeVisible()

            Trigger.toggleCheckSequence(tag3)
            await wait()

            expect(selectedTags()).toEqual([])
            expect(target).toBeHidden()
          })

          it("shows the target element if its up-hide-for attribute is :checked and the checkbox is unchecked", async function() {
            const $form = $fixture('form')
            const $checkbox = $form.affix('input[name="input-name"][type="checkbox"][value="1"][up-switch=".target"]')
            const $target = $form.affix('.target[up-hide-for=":checked"]')
            up.hello($form)
            await wait()

            expect($target).toBeVisible()
            $checkbox.prop('checked', true)
            Trigger.change($checkbox)
            await wait()

            expect($target).toBeHidden()
          })

          it("shows the target element if its up-hide-for attribute is :unchecked and the checkbox is checked", async function() {
            const $form = $fixture('form')
            const $checkbox = $form.affix('input[name="input-name"][type="checkbox"][value="1"][up-switch=".target"]')
            const $target = $form.affix('.target[up-hide-for=":unchecked"]')
            up.hello($form)
            await wait()

            expect($target).toBeHidden()
            $checkbox.prop('checked', true)
            Trigger.change($checkbox)
            await wait()

            expect($target).toBeVisible()
          })

          it("switches checkboxes without a form, switching elements anywhere in the current layer", async function() {
            const $checkbox = $fixture('input[name="input-name"][type="checkbox"][value="1"][up-switch=".target"]')

            const $target = $fixture('.target[up-show-for=":checked"]')
            up.hello($checkbox)
            await wait()

            expect($target).toBeHidden()
            $checkbox.prop('checked', true)
            Trigger.change($checkbox)
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

            const switchTargetSpy = spyOn(up.Switcher.prototype, 'switchSwitcheeNow').and.callThrough()

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

            const switchTargetSpy = spyOn(up.Switcher.prototype, 'switchSwitcheeNow').and.callThrough()

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

      it('does not crash when a form-less input with [up-switch] is in an overlay, and that overlay closes (bugfix)', async function() {
        await up.layer.open({ fragment: `
          <div id="container">
            <input type="text" name="foo" up-switch="#target"></input>
            <div id="target" up-show-for="foo"></div>
          </div>
        ` })

        expect(up.layer.current).toBeOverlay()
        expect(up.layer.current).toHaveSelector('[up-switch]')

        let doDismiss = () => up.layer.dismiss()
        expect(doDismiss).not.toThrowError()
      })


    })

  })

})
