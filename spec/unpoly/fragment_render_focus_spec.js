const u = up.util
const e = up.element

extendDescribe('up.fragment', function() {

  extendDescribe('JavaScript functions', function() {

    extendDescribe('up.render()', function() {

      describe('focus', function() {

        describe('with { focus: "autofocus" }', function() {
          it('focuses an [autofocus] element in the new fragment', async function() {
            fixture('form.foo-bar')
            up.render({
              focus: 'autofocus',
              fragment: `
                <form class='foo-bar'>
                  <input class="autofocused-input" autofocus>
                </form>
              `
            })

            await wait()

            expect('.autofocused-input').toBeFocused()
          })
        })

        describe('with { focus: "target" }', function() {

          it('focuses the new fragment', async function() {
            fixture('form.foo-bar')
            up.render({
              focus: 'target',
              fragment: `
                <form class='foo-bar'>
                  <input>
                </form>
              `
            })

            await wait()

            expect('.foo-bar').toBeFocused()
          })

          it('focuses the fragment even if its element type is not focusable by default', async function() {
            fixture('.foo-bar')
            up.render({
              focus: 'target',
              fragment: `
                <span class='foo-bar'></span>
              `
            })

            await wait()

            expect('.foo-bar').toBeFocused()
          })

          describe('when appending children', function() {

            it('focuses the first appended child element', async function() {
              htmlFixture(`
                <form id="form">
                </form>
              `)

              up.render({
                focus: 'target',
                target: '#form:after',
                fragment: `
                <form id="form">
                  <input id="input">
                </form>
              `
              })

              await wait()

              expect('#input').toBeFocused()
            })

            it('focuses the container when the first appended node is a non-whitespace text node', async function() {
              htmlFixture(`
                <form id="form">
                </form>
              `)

              up.render({
                focus: 'target',
                target: '#form:after',
                fragment: `
                <form id="form">
                  Text
                  <input id="input">
                </form>
              `
              })

              await wait()

              expect('#form').toBeFocused()
            })

          })

          describe('when swapping children', function() {

            it('focuses the container', async function() {
              htmlFixture(`
                <form id="form">
                </form>
              `)

              up.render({
                focus: 'target',
                target: '#form:content',
                fragment: `
                <form id="form">
                  Text
                  <input id="input">
                </form>
              `
              })

              await wait()

              expect('#form').toBeFocused()
            })

          })

        })

        describe('with { focus: "main" }', function() {
          it('focuses the main element', async function() {
            const main = fixture('main')
            e.affix(main, 'form.foo-bar')
            up.render({
              focus: 'main',
              fragment: `
                <form class='foo-bar'>
                  <input>
                </form>
              `
            })

            await wait()

            expect('main').toBeFocused()
          })
        })

        describe('with { focus: "hash" }', function() {
          it('focuses the target of a URL #hash', async function() {
            fixture('.target')
            up.render('.target', { url: '/path#hash', focus: 'hash' })

            await wait()

            jasmine.respondWith(`
              <div class="target">
                <div id="hash"></div>
              </div>
            `)

            await wait()

            expect('#hash').toBeFocused()
          })
        })

        describe('with a CSS selector as { focus } option', function() {

          it('focuses a matching element within the new fragment', async function() {
            fixture('form.foo-bar')
            up.render({
              focus: '.input',
              fragment: `
                <form class='foo-bar'>
                  <input class='input'>
                </form>
              `
            })

            await wait()

            expect('.input').toBeFocused()
          })

          it('focuses a matching element in the same layer', async function() {
            fixture('form.foo-bar')

            fixture('.element')

            up.render({
              focus: '.element',
              fragment: `
                <form class='foo-bar'>
                </form>
              `
            })

            await wait()

            expect('.element').toBeFocused()
          })

          it('does not focus a matching element in another layer', async function() {
            makeLayers([
              { target: '.root-element' },
              { target: '.overlay-element' }
            ])

            await wait()

            up.render('.overlay-element', { focus: '.root-element', content: 'new content' })

            await wait()

            expect('.root-element').not.toBeFocused()
          })
        })

        describe('with { focus: "keep" }', function() {

          it('preserves focus of an element within the changed fragment', async function() {
            const container = fixture('.container')
            const oldFocused = e.affix(container, '.focused[tabindex=0]', { text: 'old focused' })
            oldFocused.focus()
            expect(oldFocused).toBeFocused()

            up.render('.container', {
              focus: 'keep',
              document: `
                <div class="container">
                  <div class="focused" tabindex="0">new focused</div>
                </div>
              `
            })
            await wait()

            expect('.focused').toHaveText('new focused')
            expect('.focused').toBeFocused()
          })

          it('preserves focus when only updating children (using :content)', async function() {
            const container = fixture('.container')
            const oldFocused = e.affix(container, '.focused[tabindex=0]', { text: 'old focused' })
            oldFocused.focus()
            expect(oldFocused).toBeFocused()

            up.render('.container:content', {
              focus: 'keep',
              document: `
                <div class="container">
                  <div class="focused" tabindex="0">new focused</div>
                </div>
              `
            })
            await wait()

            expect('.focused').toHaveText('new focused')
            expect('.focused').toBeFocused()
          })

          it('preserves focus when only updating children (using :content) with a transition', async function() {
            up.motion.config.enabled = true

            const container = fixture('.container')
            const oldFocused = e.affix(container, '.focused[tabindex=0]', { text: 'old focused' })
            oldFocused.focus()
            expect(oldFocused).toBeFocused()

            up.render('.container:content', {
              focus: 'keep',
              transition: 'cross-fade',
              duration: 50,
              document: `
                <div class="container">
                  <div class="focused" tabindex="0">new focused</div>
                </div>
              `
            })
            await wait(120)

            expect('.focused').toHaveText('new focused')
            expect('.focused').toBeFocused()
          })

          it('preserves focus when morphing with a { transition }', async function() {
            up.motion.config.enabled = true

            const oldFocused = fixture('.focused[tabindex=0][data-version="old"]', { text: 'old focused' })
            oldFocused.focus()
            expect(oldFocused).toBeFocused()

            up.render('.focused', {
              focus: 'keep',
              document: `
                <div class="focused" data-version="new" tabindex="0">new focused</div>
              `,
              transition: 'cross-fade',
              duration: 1200,
            })

            await wait(600)

            const newFocused = document.querySelector('.focused[data-version="new"]')

            expect(oldFocused).toBeAttached()
            expect(oldFocused).toHaveOwnOpacity(0.5, 0.4)
            expect(newFocused).toBeAttached()
            expect(newFocused).toHaveOwnOpacity(0.5, 0.4)
            expect(newFocused).toBeFocused()

            await wait(800)

            expect(oldFocused).toBeDetached()
            expect(newFocused).toBeAttached()
            expect(newFocused).toHaveOwnOpacity(1.0, 0.2)
            expect(newFocused).toBeFocused()
          })

          it('does not re-focus an unrelated element that never lost focus during the render pass', async function() {
            fixture('.target', { text: 'old target' })
            const outside = fixture('.focused[tabindex=0]', { text: 'old focused' })
            outside.focus()
            expect(outside).toBeFocused()

            const focusSpy = spyOn(up, 'focus').and.callThrough()

            up.render({
              focus: 'keep',
              fragment: `
                <div class="target">
                  new target
                </div>
              `
            })
            await wait()

            expect('.target').toHaveText('new target')
            expect(focusSpy).not.toHaveBeenCalled()
            expect('.focused').toBeFocused()
          })

          it('does not crash if the focused element is not targetable (bugfix)', async function() {
            const container = fixture('.container')
            const oldFocused = e.affix(container, 'div[tabindex=0]', { text: 'old focused' })
            oldFocused.focus()
            expect(oldFocused).toBeFocused()

            up.render('.container', {
              focus: 'keep',
              document: `
                <div class="container">
                  <div tabindex="0">new focused</div>
                </div>
              `
            })

            await wait()

            expect('div[tabindex]').toHaveText('new focused')
            expect('div[tabindex]').not.toBeFocused()
          })

          it('preserves focus of an element within the changed fragment when updating inner HTML with { content } (bugfix)', async function() {
            const container = fixture('.container')
            const oldFocused = e.affix(container, '.focused[tabindex=0]', { text: 'old focused' })
            oldFocused.focus()
            expect(oldFocused).toBeFocused()

            up.render('.container', { focus: 'keep', content: '<div class="focused" tabindex="0">new focused</div>' })

            await wait()

            expect('.focused').toBeFocused()
          })

          it('preserves scroll position and selection range of an element within the changed fragment', async function() {
            const container = fixture('.container')
            const longText = `
              foooooooooooo
              baaaaaaaaaaar
              baaaaaaaaaaaz
              baaaaaaaaaaam
              quuuuuuuuuuux
              foooooooooooo
              baaaaaaaaaaar
              baaaaaaaaaaaz
              baaaaaaaaaaam
              quuuuuuuuuuux
            `
            const oldFocused = e.affix(container, 'textarea[name=prose][wrap=off][rows=3][cols=6]', { text: longText })

            oldFocused.selectionStart = 10
            oldFocused.selectionEnd = 11
            oldFocused.scrollTop = 12
            oldFocused.scrollLeft = 13
            oldFocused.focus()

            expect(oldFocused).toBeFocused()
            expect(oldFocused.selectionStart).toBeAround(10, 2)
            expect(oldFocused.selectionEnd).toBeAround(11, 2)
            expect(oldFocused.scrollTop).toBeAround(12, 2)
            expect(oldFocused.scrollLeft).toBeAround(13, 2)

            up.render('.container', { focus: 'keep', content: `<textarea name='prose' wrap='off' rows='3' cols='6'>${longText}</textarea>` })

            await wait()

            const textarea = document.querySelector('.container textarea')
            expect(textarea.selectionStart).toBeAround(10, 2)
            expect(textarea.selectionEnd).toBeAround(11, 2)
            expect(textarea.scrollTop).toBeAround(12, 2)
            expect(textarea.scrollLeft).toBeAround(13, 2)
            expect(textarea).toBeFocused()
          })

          it('does not lose focus of an element outside the changed fragment', async function() {
            const oldFocused = fixture('textarea')
            oldFocused.focus()

            const container = fixture('.container')
            e.affix(container, 'textarea')

            up.render('.container', { focus: 'keep', content: "<textarea></textarea>" })

            await wait()

            expect(oldFocused).toBeFocused()
          })

          it('does not override a focus change made after the request was sent', async function() {
            let outsideTextField = fixture('input[type="text"][name="foo"]')
            let target = fixture('form#target')
            let insideTextField = e.affix(target, 'input[type="text"][name="bar"]')
            insideTextField.focus()
            expect(insideTextField).toBeFocused()

            up.render({ target: '#target', focus: 'keep', url: '/path' })
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(insideTextField).toBeFocused()

            outsideTextField.focus()
            await wait()

            expect(outsideTextField).toBeFocused()

            jasmine.respondWithSelector('#target', { text: 'New target' })
            await wait()

            expect('#target').toHaveText('New target')
            expect(outsideTextField).toBeFocused()
          })

          it('does not override selection changes made after the request was sent', async function() {
            let outsideTextField = fixture('input[type="text"][name="foo"]')
            let target = fixture('form#target')
            let insideTextField = e.affix(target, 'input[type="text"][name="bar"]')

            outsideTextField.focus()
            outsideTextField.value = 'abcdefghijklmnopqurstuvwxyz'
            outsideTextField.selectionStart = 3
            outsideTextField.selectionEnd = 5

            up.render({ target: '#target', focus: 'keep', url: '/path' })
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(outsideTextField).toBeFocused()
            expect(outsideTextField.selectionStart).toBe(3)
            expect(outsideTextField.selectionEnd).toBe(5)

            outsideTextField.selectionStart = 8
            outsideTextField.selectionEnd = 10
            await wait()

            expect(outsideTextField).toBeFocused()
            expect(outsideTextField.selectionStart).toBe(8)
            expect(outsideTextField.selectionEnd).toBe(10)

            jasmine.respondWithSelector('#target', { text: 'New target' })
            await wait()

            expect('#target').toHaveText('New target')
            expect(outsideTextField).toBeFocused()
            expect(outsideTextField.selectionStart).toBe(8)
            expect(outsideTextField.selectionEnd).toBe(10)
          })

          it('does not rediscover an element with the same selector outside the changed fragment (bugfix)', async function() {
            const outside = fixture('textarea')

            const container = fixture('.container')
            e.affix(container, 'textarea')

            up.render('.container', { focus: 'keep', content: "<textarea></textarea>" })

            await wait()

            expect(outside).not.toBeFocused()
          })
        })

        describe('with { focus: "layer" }', function() {
          it("focuses the fragment's layer", async function() {
            // Focus another element since the front layer will automatically
            // get focus after opening.
            const textarea = fixture('textarea')
            textarea.focus()

            makeLayers([
              { target: '.root' },
              { target: '.overlay' }
            ])

            await wait()

            up.render('.overlay', { focus: 'layer', content: 'new overlay text' })

            await wait()

            expect(up.layer.front).toBeFocused()
          })
        })

        describe('with { focus: "target-if-main" }', function() {

          it('focuses a main target', async function() {
            fixture('form.foo-bar')

            up.fragment.config.mainTargets.push('.foo-bar')

            up.render({
              focus: 'target-if-main',
              fragment: `
                <form class='foo-bar'>
                  <input>
                </form>
              `
            })

            await wait()

            expect('.foo-bar').toBeFocused()
          })

          it('does not focus a non-main target', async function() {
            fixture('form.foo-bar')

            up.render({
              focus: 'target-if-main',
              fragment: `
                <form class='foo-bar'>
                  <input>
                </form>
              `
            })

            await wait()

            expect('.foo-bar').not.toBeFocused()
          })
        })

        describe('with { focus: "target-if-lost" }', function() {

          it('focuses the target if the focus was lost with the old fragment', async function() {
            const container = fixture('.container')
            const child = e.affix(container, '.child[tabindex=0]')
            child.focus()

            expect(child).toBeFocused()

            up.render({
              focus: 'target-if-lost',
              fragment: `
                <div class='container'>
                  <div class='child' tabindex='0'></div>
                </div>
              `
            })

            await wait()

            expect('.container').toBeFocused()
          })

          it('focuses the target if the focus was lost within a secondary fragment in a multi-fragment update', async function() {
            const element1 = fixture('#element1[tabindex=0]')
            const element2 = fixture('#element2[tabindex=0]')
            element2.focus()

            expect(element2).toBeFocused()

            up.render('#element1, #element2', {
              focus: 'target-if-lost',
              document: `
                <div>
                  <div id="element1" tabindex='0'>new element1</div>
                  <div id="element2" tabindex='0'>new element2</div>
                </div>
              `
            })

            await wait()

            expect('#element1').toBeFocused()
          })

          it('does not focus the target if an element outside the updating fragment was focused', async function() {
            const container = fixture('.container')
            const child = e.affix(container, '.child')

            const outside = fixture('.outside[tabindex=0]')
            outside.focus()

            up.render({
              focus: 'target-if-lost',
              fragment: `
                <div class='container'>
                  <div class='child' tabindex='0'></div>
                </div>
              `
            })

            await wait()

            expect('.outside').toBeFocused()
          })
        })

        describe('with an array of { focus } options', function() {
          it('tries each option until one succeeds', async function() {
            fixture('.container')
            up.render('.container', { focus: ['autofocus', '.element', '.container'], content: "<div class='element'>element</div>" })

            await wait()

            expect('.container .element').toBeFocused()
          })
        })

        describe('with a string with comma-separated { focus } options', function() {
          it('tries each option until one succeeds', async function() {
            fixture('.container')
            up.render('.container', { focus: 'autofocus, .element, .container', content: "<div class='element'>element</div>" })
            await wait()

            expect('.container .element').toBeFocused()
          })
        })

        if (up.migrate.loaded) {
          describe('with a string with "or"-separated { focus } options', function() {
            it('tries each option until one succeeds', async function() {
              fixture('.container')
              up.render('.container', { focus: 'autofocus or .element or .container', content: "<div class='element'>element</div>" })
              await wait()

              expect('.container .element').toBeFocused()
            })
          })
        }

        describe('with { focus: "restore" }', function() {
          it('restores earlier focus-related state at this location')
        })

        describe('with { focus: "auto" }', function() {

          it('focuses a main target', async function() {
            fixture('form.foo-bar')

            up.fragment.config.mainTargets.unshift('.foo-bar')

            up.render({
              focus: 'auto',
              fragment: `
                <form class='foo-bar'>
                  <input>
                </form>
              `
            })

            await wait()

            expect('.foo-bar').toBeFocused()
          })

          it('focuses a main target within the updated container', async function() {
            const container = fixture('.container')
            e.affix(container, 'form.foo-bar')

            up.fragment.config.mainTargets.push('.foo-bar')

            up.render({
              focus: 'auto',
              fragment: `
                <div class='container'>
                  <form class='foo-bar'>
                    <input>
                  </form>
                </div>
              `
            })

            await wait()

            expect('.foo-bar').toBeFocused()
          })

          it('does not focus a non-main target', async function() {
            fixture('.foo-bar')

            up.render({
              focus: 'auto',
              fragment: `
                <form class='foo-bar'>
                  <input>
                </form>
              `
            })

            await wait()

            expect('.foo-bar').not.toBeFocused()
          })

          it('focuses an child element with [autofocus] attribute (even when not replacing a main target)', async function() {
            fixture('form.foo-bar')
            up.render({
              focus: 'auto',
              fragment: `
                <form class='foo-bar'>
                  <input class="autofocused-input" autofocus>
                </form>
              `
            })

            await wait()

            expect('.autofocused-input').toBeFocused()
          })

          it('focuses the target of a URL #hash', async function() {
            fixture('.target')
            up.render('.target', { url: '/path#hash', focus: 'auto' })

            await wait()

            jasmine.respondWith(`
              <div class="target">
                <div id="hash"></div>
              </div>
            `)

            await wait()

            expect('#hash').toBeFocused()
          })

          it('preserves focus within a non-main fragment', async function() {
            const container = fixture('.container')
            const oldFocused = e.affix(container, '.focused[tabindex=0]', { text: 'old focused' })
            oldFocused.focus()
            expect(oldFocused).toBeFocused()

            up.render('.container', {
              focus: 'auto',
              document: `
                <div class="container">
                  <div class="focused" tabindex="0">new focused</div>
                </div>
              `
            })

            await wait()

            expect('.focused').toHaveText('new focused')
            expect('.focused').toBeFocused()
          })
        })

        describe('with a function passed as { focus } option', function() {

          it('calls the function', async function() {
            const focusHandler = jasmine.createSpy('focus handler')
            fixture('.element', { content: 'old text' })

            await up.render('.element', { content: 'new text', focus: focusHandler })

            expect('.element').toHaveText('new text')
            expect(focusHandler).toHaveBeenCalled()
          })

          it('does not crash the render pass and emits an error event if the function throws', async function() {
            const focusError = new Error('error in focus handler')
            const focusHandler = jasmine.createSpy('focus handler').and.throwError(focusError)
            fixture('.element', { content: 'old text' })

            await jasmine.expectGlobalError(focusError, async function() {
              const job = up.render('.element', { content: 'new text', focus: focusHandler })

              await expectAsync(job).toBeResolvedTo(jasmine.any(up.RenderResult))
              expect('.element').toHaveText('new text')
              expect(focusHandler).toHaveBeenCalled()
            })
          })

          it('calls the function after all fragments have been swapped', async function() {
            let focusSpy = jasmine.createSpy('focus spy')

            let html = (prefix) => `
              <div id="fragment1">
                ${prefix} fragment1
              </div>
              <div id="fragment2">
                ${prefix} fragment2
              </div>
            `

            let focusFn = () => {
              let fragment1 = document.querySelector('#fragment1')
              let fragment2 = document.querySelector('#fragment2')

              focusSpy(
                fragment1.textContent.trim(),
                fragment2.textContent.trim(),
              )

              up.focus(fragment2, { force: true })
            }

            htmlFixtureList(html('old'))

            await up.render({ target: '#fragment1, #fragment2', document: html('new'), focus: focusFn })

            expect(focusSpy).toHaveBeenCalledWith(
              'new fragment1',
              'new fragment2',
            )

            expect('#fragment2').toBeFocused()
          })

        })

        describe('when rendering nothing', function() {

          it('still processes a { focus } option', function() {
            fixture('main')
            expect('main').not.toBeFocused()

            up.render(':none', { focus: 'main', document: '<div></div>' })

            expect('main').toBeFocused()
          })

          it('does not crash with { focus: "target" }', function(done) {
            const promise = up.render(':none', { focus: 'target', document: '<div></div>' })

            u.task(() => promiseState(promise).then(function(result) {
              expect(result.state).toBe('fulfilled')
              done()
            }))
          })
        })
      })

    })

  })

})
