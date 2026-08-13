const u = up.util
const e = up.element

extendDescribe('up.form', function() {

  extendDescribe('unobtrusive behavior', function() {

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
            ` })
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
            ` })
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
            ` })
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

  })

})
