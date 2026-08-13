const u = up.util
const e = up.element
const $ = jQuery

extendDescribe('up.fragment', function() {

  extendDescribe('JavaScript functions', function() {

    describe('up.render()', function() {

      beforeEach(function() {
        up.motion.config.enabled = false
      })

      it('preserves a verbatim "<script>" string in an element attribute (bugfix)', function() {
        fixture('#target')
        const attrValue = '<script>alert("I am valid unescaped HTML/JS")<script>'

        up.render({ fragment: `<div id='target' foo='${attrValue}'></div>` })

        expect(document.querySelector('#target').getAttribute('foo')).toBe(attrValue)
      })

      describe('return value', function() {

        it('returns an up.RenderJob that describes the render options', function() {
          fixture('.target')

          const job = up.render('.target', { content: 'new text' })
          expect(job.renderOptions.target).toBe('.target')
          expect(job.renderOptions.content).toBe('new text')
        })

        it('resolves to an up.RenderResult describing the updated fragments and layer', async function() {
          fixture('.one', { text: 'old one' })
          fixture('.two', { text: 'old two' })
          fixture('.three', { text: 'old three' })

          const documentHTML = `
            <div class="one">new one</div>
            <div class="two">new two</div>
            <div class="three">new three</div>
          `

          const renderOptions = {
            target: '.one, .three',
            document: documentHTML,
          }
          const promise = up.render(renderOptions)

          await expectAsync(promise).toBeResolvedTo(jasmine.any(up.RenderResult))

          await expectAsync(promise).toBeResolvedTo(jasmine.objectContaining({
            ok: true,
            target: '.one, .three',
            fragments: [document.querySelector('.one'), document.querySelector('.three')],
            layer: up.layer.root,
            renderOptions: jasmine.objectContaining({
              target: '.one, .three',
              document: documentHTML,
            }),
          }))
        })

        it('delays the promise until fragments were swapped and destructors have run', async function() {
          const compilerSpy = jasmine.createSpy('compiler spy')
          const destructorSpy = jasmine.createSpy('destructor spy')

          up.compiler('.target', function(target) {
            const text = target.textContent.trim()
            compilerSpy(text)
            return () => destructorSpy(text)
          })

          const html = (text) => `
            <div class="target">
              ${text}
            </div>
          `

          htmlFixture(html('version 1'))

          await up.render({ fragment: html('version 2') })

          expect('.target').toHaveText('version 2')
          expect(destructorSpy).not.toHaveBeenCalled() // version 1 was never compiled
          expect(compilerSpy).toHaveBeenCalledWith('version 2')

          await up.render({ fragment: html('version 3') })

          expect('.target').toHaveText('version 3')
          expect(destructorSpy).toHaveBeenCalledWith('version 2')
          expect(compilerSpy).toHaveBeenCalledWith('version 3')
        })

        it('resolves to an up.RenderResult describing the actual target and layer used, when multiple values could match', async function() {
          let mainHTML = (text) => `<div id="page" up-main>${text}</div>`
          htmlFixture(mainHTML('old main'))

          const job = up.render({ target: ':main', layer: 'any', document: mainHTML('new main') })

          await expectAsync(job).toBeResolvedTo(jasmine.objectContaining({
            target: "[up-main='']",
            layer: up.layer.root,
          }))
        })

      })

      describe('compilation', function() {

        it('runs compilers for matching elements in the new content', async function() {
          const childCompiler = jasmine.createSpy('compiler')
          up.compiler('.child', (element) => childCompiler(element.tagName, element.className))

          up.hello(fixture('.fragment'))
          await up.render({ fragment: '<div class="fragment"><span class="child"></span></div>' })

          expect(childCompiler).toHaveBeenCalledWith('SPAN', 'child')
        })

        it('runs compilers when swapping children', async function() {
          const childCompiler = jasmine.createSpy('compiler')
          up.compiler('.child', (element) => childCompiler(element.tagName, element.className))

          up.hello(fixture('.fragment'))
          await up.render({ target: '.fragment:content', document: '<div class="fragment"><span class="child"></span></div>' })

          expect(childCompiler).toHaveBeenCalledWith('SPAN', 'child')
        })

        it('runs compilers when appending children', async function() {
          const childCompiler = jasmine.createSpy('compiler')
          up.compiler('.child', (element) => childCompiler(element.tagName, element.className))

          fixture('.fragment')
          await up.render({ target: '.fragment:after', document: '<div class="fragment"><span class="child"></span></div>' })

          expect(childCompiler).toHaveBeenCalledWith('SPAN', 'child')
        })

        it('runs compilers after all fragments have been swapped', async function() {
          let compileSpy = jasmine.createSpy('compile spy')

          let html = (prefix) => `
            <div id="fragment1">
              ${prefix} fragment1
            </div>
            <div id="fragment2">
              ${prefix} fragment2
            </div>
          `

          up.compiler('#fragment1', (element) => {
            compileSpy(
              document.querySelector('#fragment1').textContent.trim(),
              document.querySelector('#fragment2').textContent.trim(),
            )
          })

          htmlFixtureList(html('old'))

          await up.render({ target: '#fragment1, #fragment2', document: html('new') })

          expect(compileSpy).toHaveBeenCalledWith(
            'new fragment1',
            'new fragment2',
          )
        })

        it('runs compilers after hungry fragments have been swapped', async function() {
          let compileSpy = jasmine.createSpy('compile spy')

          let html = (prefix) => `
            <div id="fragment1">
              ${prefix} fragment1
            </div>
            <div id="fragment2" up-hungry>
              ${prefix} fragment2
            </div>
          `

          up.compiler('#fragment1', (element) => {
            compileSpy(
              document.querySelector('#fragment1').textContent.trim(),
              document.querySelector('#fragment2').textContent.trim(),
            )
          })

          htmlFixtureList(html('old'))

          await up.render({ target: '#fragment1', document: html('new') })

          expect(compileSpy).toHaveBeenCalledWith(
            'new fragment1',
            'new fragment2',
          )
        })

        it('calls compilers with a third "meta" argument containing information about the render pass', async function() {
          const compiler = jasmine.createSpy('compiler')
          up.compiler('.element', compiler)
          fixture('.element', { text: 'old content' })

          up.render('.element', { url: '/path' })
          await wait()

          jasmine.respondWithSelector('.element', { text: 'new content' })
          await wait()

          expect('.element').toHaveText('new content')
          expect(compiler).toHaveBeenCalledWith(
            jasmine.any(Element),
            jasmine.any(Object),
            jasmine.objectContaining({
              layer: up.layer.root
            })
          )
        })

        if (up.migrate.loaded) {
          it('calls compilers with a third argument containing the { response } for the current render pass', async function() {
            const compiler = jasmine.createSpy('compiler')
            up.compiler('.element', compiler)

            fixture('.element', { text: 'old content' })
            up.render('.element', { url: '/path' })

            await wait()

            jasmine.respondWithSelector('.element', { text: 'new content' })
            await wait()

            expect('.element').toHaveText('new content')
            expect(compiler).toHaveBeenCalledWith(
              jasmine.any(Element),
              jasmine.any(Object),
              jasmine.objectContaining({
                response: jasmine.any(up.Response)
              })
            )
          })
        }

        describe('when a compiler throws an error', function() {

          it('emits an error event, but does not reject the up.render() promise', async function() {
            const compileError = new Error("error from crashing compiler")
            const crashingCompiler = jasmine.createSpy('crashing compiler').and.throwError(compileError)
            up.compiler('.element', crashingCompiler)
            fixture('.element', { text: 'old text' })

            await jasmine.expectGlobalError(compileError, async function() {
              const promise = up.render({ fragment: '<div class="element">new text</div>' })

              await expectAsync(promise).toBeResolvedTo(jasmine.any(up.RenderResult))
            })

            expect('.element').toHaveText('new text')
            expect(crashingCompiler).toHaveBeenCalled()
          })

          it('emits an error event, but does not reject the up.render().finished promise', async function() {
            const compileError = new Error('error from crashing compiler')
            const crashingCompiler = jasmine.createSpy('crashing compiler').and.throwError(compileError)
            up.compiler('.element', crashingCompiler)
            const element = fixture('.element', { text: 'old text' })

            await jasmine.expectGlobalError(compileError, async function() {
              const promise = up.render({ fragment: '<div class="element">new text</div>' })

              await expectAsync(promise.finished).toBeResolvedTo(jasmine.any(up.RenderResult))
            })

            expect('.element').toHaveText('new text')
            expect(crashingCompiler).toHaveBeenCalled()
          })

          it('does not call an { onError } callback', async function() {
            const compileError = new Error("error from crashing compiler")
            const crashingCompiler = jasmine.createSpy('crashing compiler').and.throwError(compileError)
            const errorCallback = jasmine.createSpy('onError callback')
            up.compiler('.element', crashingCompiler)
            const element = fixture('.element', { text: 'old text' })

            await jasmine.expectGlobalError(compileError, () => up.render({ fragment: '<div class="element">new text</div>', onError: errorCallback }))

            expect('.element').toHaveText('new text')
            expect(crashingCompiler).toHaveBeenCalled()
            expect(errorCallback).not.toHaveBeenCalled()
          })

          it('does not prevent other compilers on the same element', async function() {
            const compileError = new Error("error from crashing compiler")
            const compilerBefore = jasmine.createSpy('compiler before')
            const crashingCompiler = jasmine.createSpy('crashing compiler').and.throwError(compileError)
            const compilerAfter = jasmine.createSpy('compiler after')
            up.compiler('.element', compilerBefore)
            up.compiler('.element', crashingCompiler)
            up.compiler('.element', compilerAfter)
            fixture('.element', { text: 'old text' })

            await jasmine.expectGlobalError(compileError, () => up.render({ fragment: '<div class="element">new text</div>' }))

            expect('.element').toHaveText('new text')

            expect(compilerBefore).toHaveBeenCalled()
            expect(crashingCompiler).toHaveBeenCalled()
            expect(compilerAfter).toHaveBeenCalled()
          })

          it('still updates subsequent elements for a multi-step target', async function() {
            const compileError = new Error("error from crashing compiler")
            const crashingCompiler = jasmine.createSpy('crashing compiler').and.throwError(compileError)
            up.compiler('.secondary', crashingCompiler)
            fixture('.primary', { text: 'old primary' })
            fixture('.secondary', { text: 'old secondary' })
            fixture('.tertiary', { text: 'old tertiary' })

            await jasmine.expectGlobalError(compileError, () => up.render('.primary, .secondary, .tertiary', { document: `
              <div class="primary">new primary</div>
              <div class="secondary">new secondary</div>
              <div class="tertiary">new tertiary</div>
            `
            }))

            expect('.primary').toHaveText('new primary')
            expect('.secondary').toHaveText('new secondary')
            expect('.tertiary').toHaveText('new tertiary')

            expect(crashingCompiler).toHaveBeenCalled()
          })

          it('still updates the target when failing to compile a hungry element on another layer', async function() {
            const compileError = new Error("error from crashing compiler")
            const crashingCompiler = jasmine.createSpy('crashing compiler').and.throwError(compileError)
            up.compiler('.root', crashingCompiler)
            fixture('.root', { text: 'root', 'up-hungry': '', 'up-if-layer': 'any' })

            up.layer.open({ fragment: '<div class="overlay">old secondary</div>' })

            await jasmine.expectGlobalError(compileError, () => up.render('.overlay', { document: `
              <div class="root">new root</div>
              <div class="overlay">new overlay</div>
            `
            }))

            expect('.root').toHaveText('new root')
            expect('.overlay').toHaveText('new overlay')

            expect(crashingCompiler).toHaveBeenCalled()
          })

          it('still opens an overlay when failing to compile a hungry element on another layer', async function() {
            const compileError = new Error("error from crashing compiler")
            const crashingCompiler = jasmine.createSpy('crashing compiler').and.throwError(compileError)
            up.compiler('.root', crashingCompiler)
            fixture('.root', { text: 'root', 'up-hungry': '', 'up-if-layer': 'any' })

            await jasmine.expectGlobalError(compileError, () => up.layer.open({ target: '.overlay', document: `
              <div class="root">new root</div>
              <div class="overlay">new overlay</div>
            ` }))

            expect(up.layer.isOverlay()).toBe(true)
            expect('.root').toHaveText('new root')
            expect('.overlay').toHaveText('new overlay')
            expect(crashingCompiler).toHaveBeenCalled()
          })

          it('does not prevent destructors', async function() {
            const compileError = new Error("error from crashing compiler")
            const destructor = jasmine.createSpy('destructor')
            const crashingCompiler = jasmine.createSpy('crashing compiler').and.throwError(compileError)
            up.compiler('.element', crashingCompiler)
            const element = fixture('.element', { text: 'old text' })
            up.destructor(element, destructor)

            await jasmine.expectGlobalError(compileError, () => up.render({ fragment: '<div class="element">new text</div>' }))

            expect('.element').toHaveText('new text')

            expect(crashingCompiler).toHaveBeenCalled()
          })

          it('still processes a { scroll } option', async function() {
            const compileError = new Error("error from crashing compiler")
            const crashingCompiler = jasmine.createSpy('crashing compiler').and.throwError(compileError)
            up.compiler('.element', crashingCompiler)
            fixture('.element', { text: 'old text' })

            const revealSpy = up.reveal.mock()

            await jasmine.expectGlobalError(compileError, () => up.render({ fragment: '<div class="element">new text</div>', scroll: 'target' }))

            expect('.element').toHaveText('new text')
            expect(revealSpy).toHaveBeenCalled()
            expect(crashingCompiler).toHaveBeenCalled()
          })
        })

        describe('when a destructor throws an error', function() {

          it('still updates subsequent elements for a multi-step target', async function() {
            const destroyError = new Error("error from crashing destructor")
            const crashingDestructor = jasmine.createSpy('crashing destructor').and.throwError(destroyError)
            const primary = fixture('.primary', { text: 'old primary' })
            const secondary = fixture('.secondary', { text: 'old secondary' })
            const tertiary = fixture('.tertiary', { text: 'old tertiary' })

            up.destructor(secondary, crashingDestructor)

            await jasmine.expectGlobalError(destroyError, () => up.render('.primary, .secondary, .tertiary', { document: `
              <div class="primary">new primary</div>
              <div class="secondary">new secondary</div>
              <div class="tertiary">new tertiary</div>
            `
            }))

            expect('.primary').toHaveText('new primary')
            expect('.secondary').toHaveText('new secondary')
            expect('.tertiary').toHaveText('new tertiary')
            expect(crashingDestructor).toHaveBeenCalled()
          })

          it('removes the old element', async function() {
            const destroyError = new Error("error from crashing destructor")
            const crashingDestructor = jasmine.createSpy('crashing destructor').and.throwError(destroyError)
            const oldElement = fixture('#element.old')

            up.destructor(oldElement, crashingDestructor)

            await jasmine.expectGlobalError(destroyError, () => up.render('#element', { document: `
              <div id="element" class="new"></div>
            ` }))

            expect(oldElement).toBeDetached()
            expect('#element').toHaveClass('new')
            expect(crashingDestructor).toHaveBeenCalled()
          })
        })

        describe('async compilers', function() {

          it('does not delay the up.render() promise', async function() {
            let compilerDeferred = u.newDeferred()
            up.compiler('.element', async function() {
              await compilerDeferred
            })

            const html = '<div class="element"></div>'
            const element = htmlFixture(html)

            const renderPromise = up.render(element, { fragment: html })
            await wait()

            await expectAsync(compilerDeferred).toBePending()
            await expectAsync(renderPromise).toBeResolved()
          })

          it('delays the up.render().finished promise', async function() {
            let compilerDeferred = u.newDeferred()
            up.compiler('.element', async function() {
              await compilerDeferred
            })

            const html = '<div class="element"></div>'
            const element = htmlFixture(html)

            const finishedPromise = up.render({ fragment: html }).finished
            await wait()

            await expectAsync(compilerDeferred).toBePending()
            await expectAsync(finishedPromise).toBePending()

            compilerDeferred.resolve()
            await wait()

            await expectAsync(compilerDeferred).toBeResolved()
            await expectAsync(finishedPromise).toBeResolved()
          })

          it('delays the up.render().finished promise when opening a new overlay', async function() {
            let compilerDeferred = u.newDeferred()
            up.compiler('.element', async function() {
              await compilerDeferred
            })

            const finishedPromise = up.render({ fragment: '<div class="element">text</div>', layer: 'new modal' }).finished
            await wait()

            expect(up.layer.current).toBeOverlay()
            await expectAsync(compilerDeferred).toBePending()
            await expectAsync(finishedPromise).toBePending()

            compilerDeferred.resolve()
            await wait()

            await expectAsync(compilerDeferred).toBeResolved()
            await expectAsync(finishedPromise).toBeResolved()
          })

          it('starts a transition before async compilers have terminated', async function() {
            up.motion.config.enabled = true
            const events = []

            up.compiler('.element', async function() {
              events.push('compiler:start')
              await wait(100)
              events.push('compiler:end')
            })

            up.transition('logging', async function() {
              events.push('transition:start')
              await wait(50)
              events.push('transition:end')
            })

            const html = '<div class="element"></div>'
            const element = htmlFixture(html)

            const finishedPromise = up.render({ fragment: html, transition: 'logging' }).finished
            expect(events).toEqual(['compiler:start', 'transition:start'])

            await expectAsync(finishedPromise).toBeResolved()

            expect(events).toEqual(['compiler:start', 'transition:start', 'transition:end', 'compiler:end'])
          })

        })

      })

      require('./fragment_render_url_spec')

      describe('with { response } option', function() {
        it('renders the given up.Response', async function() {
          up.history.config.enabled = true
          const target = fixture('.target', { text: 'old text' })

          const request = up.request('/response-url')
          await wait()

          jasmine.respondWith('<div class="target">new text</div>')
          const response = await request

          expect('.target').toHaveText('old text')
          await up.render({ target: '.target', response, history: true })
          await wait()

          expect('.target').toHaveText('new text')
          expect(location.href).toMatchURL('/response-url')
        })

        it('does not crash if another request is in flight (bugfix)', async function() {
          const target = fixture('.target', { text: 'old text' })
          const request = up.request('/response-url')
          await wait()

          jasmine.respondWith('<div class="target">new text</div>')
          const response = await request

          const otherRequest = up.request('/other-url')
          await wait()

          expect('.target').toHaveText('old text')
          let changePromise = up.render({ target: '.target', response, history: true })

          await expectAsync(changePromise).toBeResolvedTo(jasmine.any(up.RenderResult))

          expect('.target').toHaveText('new text')
        })

        it('aborts a conflicting request (bugfix)', async function() {
          const target = fixture('.target', { text: 'old text' })
          const request = up.request('/response-url')
          await wait()

          jasmine.respondWith('<div class="target">new text</div>')
          const response = await request

          const conflictingChange = up.render({ target: '.target', url: '/other-url' })
          await wait()

          expect('.target').toHaveText('old text')
          let changePromise = up.render({ target: '.target', response, history: true })

          await expectAsync(changePromise).toBeResolvedTo(jasmine.any(up.RenderResult))
          await expectAsync(conflictingChange).toBeRejectedWith(jasmine.any(up.Aborted))

          expect('.target').toHaveText('new text')
        })

      })

      describe('with { content } option', function() {

        it('replaces the given selector with a matching element that has the inner HTML from the given { content } string', async function() {
          fixture('.target', { text: 'old text' })

          up.render('.target', { content: 'new text' })
          await wait()

          expect('.target').toHaveText('new text')
        })

        it('returns an up.RenderResult with the new children', async function() {
          fixture('.target', { text: 'old text' })

          const result = await up.render('.target', { content: `
            <div class="child1">child1</div>
            <div class="child2">child2</div>
          ` })

          expect(result.ok).toBe(true)
          expect(result.fragments.length).toBe(2)
          expect(result.fragments[0]).toMatchSelector('.child1')
          expect(result.fragments[1]).toMatchSelector('.child2')
        })

        it('replaces the given selector with a matching element that has the inner HTML from the given { content } element', async function() {
          fixture('.target', { text: 'old text' })
          const content = e.createFromSelector('div', { text: 'new text' })

          up.render('.target', { content })
          await wait()

          expect('.target').toHaveText('new text')
        })

        it('allows to target :main', async function() {
          up.layer.config.root.mainTargets.unshift('.main-element')
          fixture('.main-element', { text: 'old text' })

          up.render({ target: ':main', content: 'new text' })
          await wait()

          expect('.main-element').toHaveText('new text')
        })

        it("removes the target's inner HTML with { content: '' }", async function() {
          fixture('.target', { text: 'old text' })

          up.render('.target', { content: '' })
          await wait()

          expect(document.querySelector('.target').innerHTML).toBe('')
        })

        it('keeps the target element and only updates its children', async function() {
          const originalTarget = fixture('.target.klass', { text: 'old text' })

          up.render('.target', { content: 'new text' })
          await wait()

          const rediscoveredTarget = document.querySelector('.target')
          expect(rediscoveredTarget).toBe(originalTarget)
          expect(rediscoveredTarget).toHaveClass('klass')
        })

        it('does not leave <up-wrapper> elements in the DOM', async function() {
          fixture('.target', { text: 'old text' })

          up.render('.target', { content: 'new text' })
          await wait()

          expect('.target').toHaveText('new text')
          expect(document.querySelectorAll('up-wrapper').length).toBe(0)
        })

        it('has a sync effect', function() {
          fixture('.target', { text: 'old text' })
          up.render('.target', { content: 'new text' })
          expect('.target').toHaveText('new text')
        })

        it('can append content with an :after selector', async function() {
          const container = fixture('.target')
          e.affix(container, '.old-child')

          up.render('.target:after', { content: '<div class="new-child"></div>' })
          await wait()

          expect(container.innerHTML).toEqual('<div class="old-child"></div><div class="new-child"></div>')
        })

        it('can prepend content with an :before selector', async function() {
          const container = fixture('.target')
          e.affix(container, '.old-child')

          up.render('.target:before', { content: '<div class="new-child"></div>' })
          await wait()

          expect(container.innerHTML).toEqual('<div class="new-child"></div><div class="old-child"></div>')
        })

        it('animates the appending with { animation }', async function() {
          up.motion.config.enabled = true

          fixtureStyle(`
            .new-child {
              background: red;
            }
          `)

          const container = fixture('.target')
          e.affix(container, '.old-child', { text: 'OLD' })

          up.render('.target:after', {
            content: '<div class="new-child">NEW</div>',
            animation: 'fade-in',
            duration: 500,
            easing: 'linear',
          })
          await wait()

          expect('.target').toHaveSelector('.old-child')
          expect('.target').toHaveSelector('.new-child')
          expect('.old-child').toHaveEffectiveOpacity(1.0, 0.0)
          expect('.new-child').toHaveEffectiveOpacity(0.0, 0.3)

          await wait(250)

          expect('.old-child').toHaveEffectiveOpacity(1.0, 0.0)
          expect('.new-child').toHaveEffectiveOpacity(0.5, 0.3)

          await wait(250)

          expect('.new-child').toHaveEffectiveOpacity(1.0, 0.3)
        })

        it('accepts a CSS selector for a <template> to clone', async function() {
          const template = htmlFixture(`
            <template id="target-template">
              <div id="child">
                child from template
              </div>
            </template>
          `)

          const target = htmlFixture(`
            <div id="target">
              <div id="child">
                old child
              </div>
            </div>
          `)

          up.render({ target: '#target', content: '#target-template' })
          await wait()

          expect('#target').toHaveSelector('#child')
          expect('#target').toHaveText('child from template')
          // Make sure the element was cloned, not moved
          expect(document.querySelector('#target').children[0]).not.toBe(template.content.children[0])
        })

        it('can clone a template with multiple child nodes without a root element', async function() {
          const template = htmlFixture(`
            <template id="target-template">
              one
              <div>two</div>
              three
            </template>
          `)

          const target = htmlFixture(`
            <div id="target">
              old text
            </div>
          `)

          up.render({ target: '#target', content: '#target-template' })
          await wait()

          expect('#target').toHaveVisibleText('one two three')
        })

        it('can render a string containing a text node without an enclosing element', async function() {
          const target = htmlFixture(`
            <div id="target">
              old text
            </div>
          `)

          up.render({ target: '#target', content: 'new text' })
          await wait()

          expect('#target').toHaveVisibleText('new text')
        })

        it('can render a string containing multiple child nodes without an root element', async function() {
          const target = htmlFixture(`
            <div id="target">
              old text
            </div>
          `)

          up.render({ target: '#target', content: `
            one
            <div>two</div>
            three
          ` })
          await wait()

          expect('#target').toHaveVisibleText('one two three')
        })

        it('can render an Element value', async function() {
          const givenElement = up.element.createFromHTML('<div>foo bar baz</div>')

          const target = htmlFixture(`
            <div id="target">
              old text
            </div>
          `)

          up.render({ target: '#target', content: givenElement })
          await wait()

          expect(document.querySelector('#target')).toHaveVisibleText('foo bar baz')
          expect(document.querySelector('#target').children[0]).toBe(givenElement)
        })

        it('can render an Text node value', async function() {
          const givenTextNode = new Text('foo bar baz')

          const target = htmlFixture(`
            <div id="target">
              old text
            </div>
          `)

          up.render({ target: '#target', content: givenTextNode })
          await wait()

          expect(document.querySelector('#target')).toHaveVisibleText('foo bar baz')
          expect(document.querySelector('#target').childNodes[0]).toBe(givenTextNode)
        })

        it('can render an NodeList with mixed Element and Text nodes', async function() {
          // Make a copy as it is a live list that we're going to mutate, then compare
          const givenNodes = [...up.element.createNodesFromHTML('foo <b>bar</b> baz')]
          expect(givenNodes).toHaveLength(3)

          const target = htmlFixture(`
            <div id="target">
              old text
            </div>
          `)

          up.render({ target: '#target', content: givenNodes })
          await wait()

          expect(document.querySelector('#target')).toHaveText('foo bar baz')
          expect(document.querySelector('#target').childNodes).toEqual(givenNodes)
        })
      })

      describe('with { document } option', function() {

        it('replaces the given selector with a matching element that has the outer HTML from the given { document } string', async function() {
          $fixture('.before').text('old-before')
          $fixture('.middle').text('old-middle')
          $fixture('.after').text('old-after')

          const document = `
            <div class="before">new-before</div>
            <div class="middle">new-middle</div>
            <div class="after">new-after</div>
          `

          up.render('.middle', { document })
          await wait()

          expect('.before').toHaveText('old-before')
          expect('.middle').toHaveText('new-middle')
          expect('.after').toHaveText('old-after')
        })

        it('derives a selector from an element given as { target } option', async function() {
          const target = fixture('.target', { text: 'old-text' })
          const document = '<div class="target">new-text</div>'
          up.render({ target, document })
          await wait()

          expect('.target').toHaveText('new-text')
        })

        it('replaces the given selector with a matching element that has the outer HTML from the given { document } element', async function() {
          fixture('.target', { text: 'old text' })
          const element = e.createFromHTML('<div class="target">new text</div>')
          up.render('.target', { document: element })
          await wait()

          expect('.target').toHaveText('new text')
        })

        it("rejects if the selector can't be found in the given { document } string", async function() {
          $fixture('.foo-bar')
          const promise = up.render('.foo-bar', { document: 'html without match' })

          await expectAsync(promise).toBeRejectedWith(jasmine.anyError(/Could not find common target/i))
        })

        it('has a sync effect', function() {
          fixture('.target', { text: 'old text' })
          up.render('.target', { document: '<div class="target">new text</div>' })
          expect('.target').toHaveText('new text')
        })

        it('does not set an [up-source] attribute', function() {
          fixture('.target', { text: 'old text' })
          up.render('.target', { document: '<div class="target">new text</div>' })

          expect('.target').toHaveText('new text')
          expect('.target').not.toHaveAttribute('up-source')
        })

        it('sets an [up-time=false] attribute to prevent an If-None-Match request header when reloading this fragment.', function() {
          fixture('.target', { text: 'old text' })
          up.render('.target', { document: '<div class="target">new text</div>' })

          expect('.target').toHaveText('new text')
          expect('.target').toHaveAttribute('up-time', 'false')
        })

        it('sets an [up-etag=false] attribute to prevent an If-Modified-Since request header when reloading this fragment.', function() {
          fixture('.target', { text: 'old text' })
          up.render('.target', { document: '<div class="target">new text</div>' })

          expect('.target').toHaveText('new text')
          expect('.target').toHaveAttribute('up-etag', 'false')
        })

        it('compiles a document cloned from a <template>', async function() {
          const template = htmlFixture(`
            <template id="document-template">
              <div id="foo">new foo</div>
              <div id="bar">new bar</div>
              <div id="baz">new baz</div>
            </template>
          `)

          htmlFixture('<div id="foo">old foo</div>')
          htmlFixture('<div id="bar">old bar</div>')
          htmlFixture('<div id="baz">old baz</div>')

          up.render({ target: '#foo, #baz', document: '#document-template' })
          await wait()

          expect('#foo').toHaveText('new foo')
          expect('#bar').toHaveText('old bar')
          expect('#baz').toHaveText('new baz')
        })

        it('can update a single <tr> from a document that only contains that <tr>', async function() {
          const table = htmlFixture(`
            <table>
              <tbody>
                <tr id="row1"><td>cell1 old</td></tr>
                <tr id="row2"><td>cell2 old</td></tr>
                <tr id="row3"><td>cell3 old</td></tr>
              </tbody>
            </table>
          `)

          up.render({ target: '#row2', document: `
            <tr id="row2"><td>cell2 new</td></tr>
          `})
          await wait()

          expect('#row1 td').toHaveText('cell1 old')
          expect('#row2 td').toHaveText('cell2 new')
          expect('#row3 td').toHaveText('cell3 old')
        })

      })


      describe('with { fragment } option', function() {

        it('derives target and outer HTML from the given { fragment } string', async function() {
          $fixture('.before').text('old-before')
          $fixture('.middle').text('old-middle')
          $fixture('.after').text('old-after')

          const fragment = '<div class="middle">new-middle</div>'

          up.render({ fragment })
          await wait()

          expect('.before').toHaveText('old-before')
          expect('.middle').toHaveText('new-middle')
          expect('.after').toHaveText('old-after')
        })

        it('derives target and outer HTML from the given { fragment } element', async function() {
          fixture('.target', { text: 'old text' })
          const fragment = e.createFromHTML('<div class="target">new text</div>')
          up.render('.target', { fragment })
          await wait()

          expect('.target').toHaveText('new text')
        })

        it("rejects if the given { fragment } does not match an element on the current page", async function() {
          $fixture('.foo-bar')
          const fragment = e.createFromHTML('<div class="target">new text</div>')
          const promise = up.render({ fragment })

          await expectAsync(promise).toBeRejectedWith(jasmine.anyError(/Could not find common target/i))
        })

        it('has a sync effect', function() {
          fixture('.target', { text: 'old text' })
          up.render('.target', { fragment: '<div class="target">new text</div>' })
          expect('.target').toHaveText('new text')
        })

        describe('appending and prepending', function() {

          it('can append content with an :after selector', async function() {
            const container = fixture('.target')
            e.affix(container, '.old-child')

            up.render('.target:after', { fragment: '<div class="target"><div class="new-child"></div></div>' })
            await wait()

            const newTarget = document.querySelector('.target')
            expect(newTarget.innerHTML).toEqual('<div class="old-child"></div><div class="new-child"></div>')
          })

          it('can prepend content with an :before selector', async function() {
            const container = fixture('.target')
            e.affix(container, '.old-child')

            up.render('.target:before', { fragment: '<div class="target"><div class="new-child"></div></div>' })
            await wait()

            const newTarget = document.querySelector('.target')
            expect(newTarget.innerHTML).toEqual('<div class="new-child"></div><div class="old-child"></div>')
          })

          it('allows the combination :has(.selector):before', async function() {
            const container = fixture('.target')
            e.affix(container, '.old-child')

            up.render('.target:has(div):before', { fragment: '<div class="target"><div class="new-child"></div></div>' })
            await wait()

            const newTarget = document.querySelector('.target')
            expect(newTarget.innerHTML).toEqual('<div class="new-child"></div><div class="old-child"></div>')
          })

          it('allows the combination :before:maybe', async function() {
            const container = fixture('.target')
            e.affix(container, '.old-child')

            up.render('.target:before:maybe', { fragment: '<div class="target"><div class="new-child"></div></div>' })
            await wait()

            const newTarget = document.querySelector('.target')
            expect(newTarget.innerHTML).toEqual('<div class="new-child"></div><div class="old-child"></div>')
          })

          it('does not leave <up-wrapper> elements in the DOM', async function() {
            const container = fixture('.target')
            e.affix(container, '.old-child')

            up.render('.target:after', { fragment: '<div class="target"><div class="new-child"></div></div>' })
            await wait()

            const newTarget = document.querySelector('.target')
            expect(newTarget.innerHTML).toEqual('<div class="old-child"></div><div class="new-child"></div>')

            expect(document.querySelectorAll('up-wrapper').length).toBe(0)
          })

        })

        describe('cloning a <template>', function() {

          it('it accepts a CSS selector for a <template> to clone', async function() {
            const template = htmlFixture(`
              <template id="target-template">
                <div id="target">
                  target from template
                </div>
              </template>
            `)

            const target = htmlFixture(`
              <div id="target">
                old target
              </div>
            `)

            up.render({ fragment: '#target-template' })
            await wait()

            expect('#target').toHaveText('target from template')
            // Make sure the element was cloned, not moved
            expect(document.querySelector('#target').children[0]).not.toBe(template.content.children[0])
          })

          it('it accepts the <template> as an Element option', async function() {
            const template = htmlFixture(`
              <template id="target-template">
                <div id="target">
                  target from template
                </div>
              </template>
            `)

            const target = htmlFixture(`
              <div id="target">
                old target
              </div>
            `)

            up.render({ fragment: template })
            await wait()

            expect('#target').toHaveText('target from template')
            // Make sure the element was cloned, not moved
            expect(document.querySelector('#target').children[0]).not.toBe(template.content.children[0])
          })

          it('compiles an element cloned from a <template>', async function() {
            const compilerFn = jasmine.createSpy('compiler fn')
            up.compiler('#target', compilerFn)

            const template = htmlFixture(`
              <template id="target-template">
                <div id="target">
                  target from template
                </div>
              </template>
            `)

            const target = htmlFixture(`
              <div id="target">
                old target
              </div>
            `)

            expect(compilerFn).not.toHaveBeenCalled()

            up.render({ fragment: '#target-template' })
            await wait()

            expect('#target').toHaveText('target from template')
            expect(compilerFn).toHaveBeenCalled()
            expect(compilerFn.calls.mostRecent().args[0]).toMatchSelector('#target')
          })

          it('compiles an element cloned from a <template> with a custom data object embedded into the { fragment } option', async function() {
            const compilerFn = jasmine.createSpy('compiler fn')
            up.compiler('#target', compilerFn)

            const template = htmlFixture(`
              <template id="target-template">
                <div id="target">
                  target from template
                </div>
              </template>
            `)

            const target = htmlFixture(`
              <div id="target">
                old target
              </div>
            `)

            expect(compilerFn).not.toHaveBeenCalled()

            up.render({ fragment: '#target-template { foo: 1, bar: 2 }' })
            await wait()

            expect('#target').toHaveText('target from template')
            expect(compilerFn).toHaveBeenCalled()
            expect(compilerFn.calls.mostRecent().args[0]).toMatchSelector('#target')
            expect(compilerFn.calls.mostRecent().args[1]).toEqual({ foo: 1, bar: 2 })
          })

          it('compiles an element cloned from a <template> with a custom data object in the { data } option', async function() {
            const compilerFn = jasmine.createSpy('compiler fn')
            up.compiler('#target', compilerFn)

            const template = htmlFixture(`
              <template id="target-template">
                <div id="target">
                  target from template
                </div>
              </template>
            `)

            const target = htmlFixture(`
              <div id="target">
                old target
              </div>
            `)

            expect(compilerFn).not.toHaveBeenCalled()

            up.render({ fragment: '#target-template', data: { foo: 1, bar: 2 } })
            await wait()

            expect('#target').toHaveText('target from template')
            expect(compilerFn).toHaveBeenCalled()
            expect(compilerFn.calls.mostRecent().args[0]).toMatchSelector('#target')
            expect(compilerFn.calls.mostRecent().args[1]).toEqual({ foo: 1, bar: 2 })
          })

          it('passes a { data } option to a custom up:template:clone handler', async function() {
            const template = htmlFixture(`
              <template id="target-template" type='text/minimustache'>
                <div id="target">
                  Hello, <b>{{name}}</b>!
                </div>
              </template>
            `)

            const target = htmlFixture(`
              <div id="target">
                old target
              </div>
            `)

            const templateHandler = jasmine.createSpy('up:template:clone').and.callFake(function(event) {
              let html = event.target.innerHTML
              html = html.replace(/{{(\w+)}}/g, (_match, variable) => event.data[variable])
              event.nodes = up.element.createNodesFromHTML(html)
            })

            up.on('up:template:clone', 'template[type="text/minimustache"]', templateHandler)

            up.render({ fragment: '#target-template', data: { name: "Alice" } })
            await wait()

            expect(templateHandler).toHaveBeenCalledWith(jasmine.objectContaining({ target: template, data: { name: "Alice" } }), template, jasmine.anything())
            expect('#target').toHaveText('Hello, Alice!')
          })

          it('compiles an element cloned from a <template> that can be manipulated with { onRendered }', async function() {
            const template = htmlFixture(`
              <template id="target-template">
                <div id="target">
                  target from template
                </div>
              </template>
            `)

            const target = htmlFixture(`
              <div id="target">
                old target
              </div>
            `)

            up.render({ fragment: '#target-template', onRendered({ fragment }) { fragment.classList.add('class-from-callback') } })
            await wait()

            expect('#target').toHaveText('target from template')
            expect('#target').toHaveClass('class-from-callback')
          })
        })
      })

      require('./fragment_render_target_spec')

      require('./fragment_render_layer_spec')

      require('./fragment_render_history_spec')

      describe('fragment source', function() {

        it('remembers the source the fragment was retrieved from', async function() {
          fixture('.target')
          up.render('.target', { url: '/path' })
          await wait()

          jasmine.respondWithSelector('.target')
          await wait()

          expect(up.fragment.source(e.get('.target'))).toMatchURL('/path')
        })

        it('returns the source location without a #hash', async function() {
          fixture('.target')
          up.render('.target', { url: '/path#hash' })
          await wait()

          jasmine.respondWithSelector('.target')
          await wait()

          expect(up.fragment.source(e.get('.target'))).toMatchURL('/path')
        })

        it('keeps the previous source for a non-GET request (since only that is reloadable)', async function() {
          const target = fixture('.target[up-source="/previous-source"]')
          up.render('.target', { url: '/path', method: 'post' })
          await wait()

          jasmine.respondWithSelector('.target')
          await wait()

          expect(up.fragment.source(e.get('.target'))).toMatchURL('/previous-source')
        })

        it('does not overwrite an [up-source] attribute from the element HTML', async function() {
          fixture('.target')
          up.render('.target', { url: '/path' })
          await wait()

          jasmine.respondWithSelector('.target[up-source="/other"]')
          await wait()

          expect(up.fragment.source(e.get('.target'))).toMatchURL('/other')
        })

        describe('with { source } option', function() {

          it('uses that URL as the source for a GET request', async function() {
            fixture('.target[up-source="/previous-source"]')
            up.render('.target', { url: '/path', source: '/given-path' })
            await wait()

            jasmine.respondWithSelector('.target')
            await wait()

            expect(up.fragment.source(e.get('.target'))).toMatchURL('/given-path')
          })

          it('uses that URL as the source for a failed GET request', async function() {
            fixture('.target[up-source="/previous-source"]')
            const renderJob = up.render('.target', { failTarget: '.target', url: '/path', source: '/given-path' })

            await wait()

            jasmine.respondWithSelector('.target', { status: 500 })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))
            expect(up.fragment.source(e.get('.target'))).toMatchURL('/given-path')
          })

          it('uses that URL as the source after a non-GET request', async function() {
            fixture('.target[up-source="/previous-source"]')
            up.render('.target', { url: '/path', method: 'post', source: '/given-path' })
            await wait()

            jasmine.respondWithSelector('.target')
            await wait()

            expect(up.fragment.source(e.get('.target'))).toMatchURL('/given-path')
          })

          it('uses that URL as the source after a failed non-GET request\'', async function() {
            const target = fixture('.target[up-source="/previous-source"]')
            const renderJob = up.navigate('.target', { failTarget: '.target', url: '/path', method: 'post', source: '/given-path' })

            await wait()

            jasmine.respondWithSelector('.target', { status: 500 })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(up.fragment.source(e.get('.target'))).toMatchURL('/given-path')
          })
        })
      })

      describe('context', function() {

        it("sends the layer's context along with requests pertaining to this layer as an X-Up-Context request header", async function() {
          makeLayers([
            { target: '.target', context: { rootKey: 'rootValue' } },
            { target: '.target', context: { overlayKey: 'overlayValue' } }
          ])

          expect(up.layer.get(0).context).toEqual({ rootKey: 'rootValue' })
          expect(up.layer.get(1).context).toEqual({ overlayKey: 'overlayValue' })

          await wait()

          up.render('.target', { layer: up.layer.get(0), url: '/path1' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Context']).toEqual(JSON.stringify({ rootKey: 'rootValue' }))

          up.render('.target', { layer: up.layer.get(1), url: '/path2' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)
          expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Context']).toEqual(JSON.stringify({ overlayKey: 'overlayValue' }))
        })

        it('escapes high ASCII characters in the X-Up-Context request header so Unicode values can be transported', async function() {
          up.layer.context = { foo: 'xäy' }
          fixture('.target')

          up.render('.target', { url: '/path3' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Context']).toBe('{"foo":"x\\u00e4y"}')
        })

        it("sends the fail layer's context as an X-Up-Fail-Context request header", async function() {
          makeLayers([
            { target: '.target', context: { rootKey: 'rootValue' } },
            { target: '.target', context: { overlayKey: 'overlayValue' } }
          ])

          up.render({ target: '.target', failTarget: '.target', layer: up.layer.get(0), failLayer: up.layer.get(1), url: '/path1' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Context']).toEqual(JSON.stringify({ rootKey: 'rootValue' }))
          expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Fail-Context']).toEqual(JSON.stringify({ overlayKey: 'overlayValue' }))
        })

        it('lets the server update the context by responding with an X-Up-Context response header', async function() {
          makeLayers([
            { target: '.target', context: { rootKey: 'rootValue' } },
            { target: '.target', context: { overlayKey: 'overlayValue' } }
          ])

          up.render('.target', { layer: up.layer.get(1), url: '/path1' })
          await wait()

          jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Context': JSON.stringify({ newKey: 'newValue' }) } })
          await wait()

          expect(up.layer.get(0).context).toEqual({ rootKey: 'rootValue' })
          expect(up.layer.get(1).context).toEqual({ overlayKey: 'overlayValue', newKey: 'newValue' })
        })

        it('allows unquoted property names in the X-Up-Context response header', async function() {
          makeLayers([
            { target: '.target', context: { rootKey: 'rootValue' } },
            { target: '.target', context: { overlayKey: 'overlayValue' } }
          ])

          up.render('.target', { layer: up.layer.get(1), url: '/path1' })
          await wait()

          jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Context': '{ newKey: "newValue" }' } })
          await wait()

          expect(up.layer.get(0).context).toEqual({ rootKey: 'rootValue' })
          expect(up.layer.get(1).context).toEqual({ overlayKey: 'overlayValue', newKey: 'newValue' })
        })

        it('uses updates from an X-Up-Context header for failed responses', async function() {
          fixture('.success-target', { text: 'success target' })
          fixture('.failure-target', { text: 'failure target' })

          const renderJob = up.render({ target: '.success-target', failTarget: '.failure-target', url: '/path1' })

          await wait()

          jasmine.respondWithSelector('.failure-target', {
            text: 'new text',
            status: 500,
            responseHeaders: { 'X-Up-Context': JSON.stringify({ newKey: 'newValue' }) }
          })

          await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

          expect('.failure-target').toHaveText('new text')
          expect(up.layer.get(0).context).toEqual({ newKey: 'newValue' })
        })
      })

      require('./fragment_render_transition_spec')


      require('./fragment_render_scrolling_spec')

      describe('style elements', function() {

        it('applies internal <style> elements that were inserted by a render pass', async function() {
          let [paragraph, target] = htmlFixtureList(`
            <p>paragraph text</p>
            <div id="target">old target text</div>
          `)

          up.render({
            fragment: `
              <div id="target">
                new target text
                <style nonce="specs-nonce">
                  p {
                    font-size: 60px;
                  }
                </style>
              </div>
            `
          })

          await wait(200)

          expect('#target').toHaveVisibleText('new target text')
          expect('#target').toHaveSelector('style')
          expect(paragraph).toHaveComputedStyle({ 'font-size': '60px' })

        })
      })

      require('./fragment_render_scripts_spec')

      describe('<noscript> tags', function() {

        it('parses <noscript> contents as text, not DOM nodes (since it will be placed in a scripting-capable browser)', async function() {
          fixture('.target')
          up.render('.target', { url: '/path' })

          await wait()

          jasmine.respondWith(`
            <div class="target">
              <noscript>
                <img src="foo.png">
              </noscript>
            </div>
          `)

          await wait()

          const noscript = document.querySelector('.target noscript')
          expect(noscript).toHaveText('<img src="foo.png">')
        })

        it('parses <noscript> contents as text, not DOM nodes when the <noscript> itself is the target', async function() {
          fixture('noscript#target')
          up.render('#target', { url: '/path' })

          await wait()

          jasmine.respondWith(`
            <div>
              <noscript id='target'>
                <img src="foo.png">
              </noscript>
            </div>
          `)

          await wait()

          const noscript = document.querySelector('#target')
          expect(noscript).toHaveText('<img src="foo.png">')
        })

        it('parses <noscript> contents with multiple lines as text, not DOM nodes', async function() {
          fixture('.target')
          up.render('.target', { url: '/path' })

          await wait()

          jasmine.respondWith(`
            <div class="target">
              <noscript>
                <img src="foo.png">
                <img src="bar.png">
              </noscript>
            </div>
          `)

          await wait()

          const $noscript = $('.target noscript')
          const text = $noscript.text().trim()
          expect(text).toMatch(/<img src="foo\.png">\s+<img src="bar\.png">/)
        })

        it('parses multiple <noscript> tags in the same fragment as text, not DOM nodes', async function() {
          fixture('.target')
          up.render('.target', { url: '/path' })

          await wait()

          jasmine.respondWith(`
            <div class="target">
              <noscript>
                <img src="foo.png">
              </noscript>
              <noscript>
                <img src="bar.png">
              </noscript>
            </div>
          `)

          await wait()

          const $noscripts = $('.target noscript')
          expect($noscripts.length).toBe(2)
          const text0 = $noscripts[0].textContent.trim()
          const text1 = $noscripts[1].textContent.trim()
          expect(text0).toEqual('<img src="foo.png">')
          expect(text1).toEqual('<img src="bar.png">')
        })
      })

      describe('media elements', function() {
        // https://github.com/unpoly/unpoly/issues/432
        it('inserts an auto-playing <video> element (bugfix for Safari)', function(done) {
          fixture('#target')

          // Must render from a { url } or { document } so DOMParser is involved.
          up.render('#target', { url: '/video' })

          return u.task(function() {
            jasmine.respondWith(`
                <div id='target'>
                  <video width="400" controls loop muted autoplay>
                    <source src="/spec/files/video.webm" type="video/webm">
                  </video>
                </div>
            `)

            return u.task(function() {
              const video = document.querySelector('#target video')
              expect(video).toBeGiven()
              const specDone = () => done()
              return video.addEventListener('timeupdate', specDone, { once: true })
            })
          })
        })
      })

      describe('destruction of old element', function() {

        it('emits an up:fragment:destroyed event on the former parent element after the element has been removed from the DOM', async function() {
          const $parent = $fixture('.parent')
          const $element = $parent.affix('.element.v1').text('v1')
          expect($element).toBeAttached()

          const spy = jasmine.createSpy('event listener')
          $parent[0].addEventListener('up:fragment:destroyed', (event) => spy(event.target, event.fragment, up.specUtil.isDetached($element)))

          await up.render('.element', { document: '<div class="element v2">v2</div>' })

          expect(spy).toHaveBeenCalledWith($parent[0], $element[0], true)
        })

        it('calls destructors on the old element', async function() {
          const destructor = jasmine.createSpy('destructor')
          up.compiler('.container', (element) => () => destructor(element.innerText))
          const $container = $fixture('.container').text('old text')
          up.hello($container)
          up.render('.container', { document: '<div class="container">new text</div>' })

          await wait()

          expect('.container').toHaveText('new text')
          expect(destructor).toHaveBeenCalledWith('old text')
        })

        it('calls destructors on the old element after a { transition }', function(done) {
          up.motion.config.enabled = true

          const destructor = jasmine.createSpy('destructor')
          up.compiler('.container', (element) => () => destructor(element.innerText))
          const $container = $fixture('.container').text('old text')
          up.hello($container)

          up.render({ fragment: '<div class="container">new text</div>', transition: 'cross-fade', duration: 100 })

          u.timer(50, () => {
            expect(destructor).not.toHaveBeenCalled()
          })

          u.timer(220, () => {
            expect('.container').toHaveText('new text')
            expect(destructor).toHaveBeenCalledWith('old text')
            done()
          })
        })

        it('calls destructors when swapping children', async function() {
          let destructorSpy = jasmine.createSpy('destructor spy')

          up.compiler('.old-child', function(element) {
            return () => destructorSpy(element.classList[0])
          })

          up.hello(htmlFixture(`
            <div class="fragment">
              <div class="old-child">old child</div>
            </div>
          `))

          await up.render({
            target: '.fragment:content',
            document: `
            <div class="fragment">
              <div class="new-child">new child</div>
            </div>
            `
          })

          expect('.fragment').toHaveSelector('.new-child')
          expect('.fragment').not.toHaveSelector('.old-child')

          expect(destructorSpy).toHaveBeenCalledWith('old-child')
        })

        it('does not call destructors when appending children', async function() {
          let destructorSpy = jasmine.createSpy('destructor spy')

          up.compiler('.old-child', function(element) {
            return destructorSpy
          })

          up.hello(htmlFixture(`
            <div class="fragment">
              <div class="old-child">old child</div>
            </div>
          `))

          await up.render({
            target: '.fragment:after',
            document: `
            <div class="fragment">
              <div class="new-child">new child</div>
            </div>
            `
          })

          expect('.fragment').toHaveSelector('.old-child')
          expect('.fragment').toHaveSelector('.new-child')

          expect(destructorSpy).not.toHaveBeenCalled()
        })

        it('calls destructors when the replaced element is a singleton element like <body> (bugfix)', async function() {
          // shouldSwapElementsDirectly() is true for body, but can't have the example replace the Jasmine test runner UI
          up.element.isSingleton.mock().and.callFake((element) => element.matches('.container'))
          const destructor = jasmine.createSpy('destructor')
          up.compiler('.container', () => destructor)
          const $container = $fixture('.container')
          up.hello($container)

          // Need to pass a { target } and not use { fragment }, since up.fragment.toTarget() ignores
          // classes and only returns the tag name for singleton elements.
          up.render('.container', { document: '<div class="container">new text</div>' })

          await wait()

          expect('.container').toHaveText('new text')
          expect(destructor).toHaveBeenCalled()
        })

        it('marks the old element as .up-destroying before destructors', function(done) {
          const testElementState = u.memoize(function(element) {
            expect(element).toHaveText('old text')
            expect(element).toMatchSelector('.up-destroying')
            done()
          })

          up.compiler('.container', (element) => () => testElementState(element))

          helloFixture('.container', { text: 'old text' })

          up.render({ fragment: '<div class="container">new text</div>' })

        })

        it('marks the old element as .up-destroying before destructors after a { transition }', async function() {
          const destructor = jasmine.createSpy('destructor')
          up.compiler('.container', (element) => () => destructor(element.innerText, element.matches('.up-destroying')))
          const $container = $fixture('.container').text('old text')
          up.hello($container)

          await up.render({
            fragment: '<div class="container">new text</div>',
            transition: 'cross-fade',
            duration: 100
          }).finished

          expect('.container').toHaveText('new text')
          expect(destructor).toHaveBeenCalledWith('old text', true)
        })

        it('calls destructors while the element is still attached to the DOM, so destructors see ancestry and events bubble up', async function() {
          const spy = jasmine.createSpy('parent spy')
          up.compiler('.element', (element) => () => spy(element.innerText, element.parentElement))

          const $parent = $fixture('.parent')
          const $element = $parent.affix('.element').text('old text')
          up.hello($element)

          up.render({ fragment: '<div class="element">new text</div>' })

          await wait()

          expect(spy).toHaveBeenCalledWith('old text', $parent.get(0))
        })

        it('calls destructors while the element is still attached to the DOM when also using a { transition }', async function() {
          const spy = jasmine.createSpy('parent spy')
          up.compiler('.element', (element) => () => // We must seek .parent in our ancestry, because our direct parent() is an .up-bounds container
          spy(element.innerText, element.closest('.parent')))

          const $parent = $fixture('.parent')
          const $element = $parent.affix('.element').text('old text')
          up.hello($element)

          await up.render({
            fragment: '<div class="element">new text</div>',
            transition: 'cross-fade',
            duration: 30
          }).finished

          expect(spy).toHaveBeenCalledWith('old text', $parent.get(0))
        })
      })

      require('./fragment_render_focus_spec')

      describe('with { guardEvent } option', function() {

        it('emits the given event before rendering', async function() {
          fixture('.target', { text: 'old content' })
          const guardEvent = up.event.build('my:guard')
          const listener = jasmine.createSpy('listener').and.callFake((event) => expect('.target').toHaveText('old content'))
          up.on('my:guard', listener)

          up.render({ target: '.target', content: 'new content', guardEvent })

          await wait()

          expect(listener).toHaveBeenCalledWith(guardEvent, jasmine.anything(), jasmine.anything())
          expect('.target').toHaveText('new content')
        })

        it('prefers to emit the given event on the given { origin } instead of the document', async function() {
          fixture('.target', { text: 'old content' })
          const origin = fixture('.origin')
          const guardEvent = up.event.build('my:guard')
          const listener = jasmine.createSpy('listener')
          origin.addEventListener('my:guard', listener)

          up.render({ target: '.target', content: 'new content', guardEvent, origin })

          await wait()

          expect(listener).toHaveBeenCalledWith(guardEvent)
        })

        it('lets listeners prevent the event, aborting the fragment update', async function() {
          fixture('.target', { text: 'old content' })
          const guardEvent = up.event.build('my:guard')
          up.on('my:guard', (event) => event.preventDefault())

          const promise = up.render({ target: '.target', content: 'new content', guardEvent })
          await expectAsync(promise).toBeRejectedWith(jasmine.anyError(/(Aborted|Prevented)/i))
        })

        it('sets { renderOptions } on the emitted event', async function() {
          fixture('.target', { text: 'old content' })
          const listener = jasmine.createSpy('listener').and.callFake((event) => event.preventDefault())
          const guardEvent = up.event.build('my:guard')
          up.on('my:guard', listener)

          const renderJob = up.render({ target: '.target', content: 'new content', guardEvent })

          await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Aborted))

          expect(listener).toHaveBeenCalledWith(guardEvent, jasmine.anything(), jasmine.anything())
          expect(listener.calls.argsFor(0)[0].renderOptions.target).toEqual('.target')
        })

        it('omits the { guardEvent } key from the { renderOptions }, so event handlers can pass this to render() without causing an infinite loop', async function() {
          fixture('.target', { text: 'old content' })
          const listener = jasmine.createSpy('listener').and.callFake((event) => event.preventDefault())
          const guardEvent = up.event.build('my:guard')
          up.on('my:guard', listener)

          const renderJob = up.render({ target: '.target', content: 'new content', guardEvent })

          await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Aborted))

          expect(listener).toHaveBeenCalledWith(guardEvent, jasmine.anything(), jasmine.anything())
          expect(listener.calls.argsFor(0)[0].renderOptions.target).toEqual('.target')
          expect(listener.calls.argsFor(0)[0].renderOptions.guardEvent).toBeMissing()
        })
      })

      describe('with { abort } option', function() {

        describe('with { abort: true }', function() {

          it('aborts the request of an existing change', async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', abort: true })
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            up.render('.element', { url: '/path2', abort: true })

            await wait()

            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          it('does not abort an earlier request that was made with { abortable: false }', async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', abortable: false })
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            up.render('.element', { url: '/path2', abort: true })

            await wait()

            expect(change1Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(2)
          })

          it('aborts the request of an existing change if the new change is made from local content', async function() {
            fixture('.element1')
            fixture('.element2')

            let change1Error  = undefined
            let change1Promise = undefined

            change1Promise = up.render('.element1', { url: '/path1', abort: true })
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            up.render('.element2', { content: 'local content', abort: true })

            await wait()

            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(0)
          })

          it('aborts an existing request when a preload request gets promoted to the foreground', async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', abort: true })
            change1Promise.catch((e) => change1Error = e)

            const change2Link = fixture('a[href="/path2"][up-target=".element"][up-abort="true"]')

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            up.link.preload(change2Link)
            await wait()
            expect(change1Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(2)

            up.link.follow(change2Link)
            await wait()
            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          it('does not cancel its own pending preload request (bugfix)', async function() {
            fixture('.element')

            let change1Error  = undefined
            let change2Error  = undefined
            let change1Promise = undefined
            let change2Promise = undefined

            const changeLink = fixture('a[href="/path"][up-target=".element"]')

            change1Promise = up.link.preload(changeLink)
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.follow(changeLink)
            change2Promise.catch((e) => change2Error = e)
            await wait()

            expect(change1Error).toBeUndefined()
            expect(change2Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          it("aborts an existing change's request that was queued with { abort: false }", async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', abort: false })
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            up.render('.element', { url: '/path2', abort: true })

            await wait()

            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })
        })

        describe('with { abort: "all" }', function() {
          it('is an alias for { abort: true }', async function() {
            fixture('.element')
            const previousRequest = up.request('/baz')

            const abortSpy = spyOn(up.fragment, 'abort')

            up.render('.element', { url: '/path1', abort: 'all' })

            await wait()

            expect(abortSpy).toHaveBeenCalledWith(jasmine.objectContaining({ layer: 'any' }))
          })
        })

        describe('with { abort: "layer" }', function() {
          it("aborts all requests on the targeted fragment's layer", async function() {
            const layers = makeLayers(3)

            layers[1].affix('.element')

            const previousRequest = up.request('/baz')

            const abortSpy = spyOn(up.fragment, 'abort')

            up.render('.element', { url: '/path1', abort: 'layer', layer: 1 })

            await wait()

            expect(abortSpy).toHaveBeenCalledWith(jasmine.objectContaining({ layer: up.layer.get(1) }))
          })
        })

        describe('with { abort } option set to a CSS selector', function() {
          it("aborts all requests in the subtree of a matching element in the targeted layer", async function() {
            const layers = makeLayers(3)

            layers[1].affix('.element')

            const previousRequest = up.request('/baz')

            const abortSpy = spyOn(up.fragment, 'abort')

            up.render('.element', { url: '/path1', abort: '.element', layer: 1 })

            await wait()

            expect(abortSpy).toHaveBeenCalledWith('.element', jasmine.objectContaining({ layer: up.layer.get(1) }))
          })
        })

        describe('with { abort } option set to an Element', function() {
          it("aborts all requests in the subtree of that Element", async function() {
            const element = fixture('.element')

            const previousRequest = up.request('/baz')

            const abortSpy = spyOn(up.fragment, 'abort')

            up.render('.element', { url: '/path1', abort: element })

            await wait()

            expect(abortSpy).toHaveBeenCalledWith(element, jasmine.anything())
          })
        })

        describe('with { abort: "target" }', function() {

          it('aborts existing requests targeting the same element', async function() {
            fixture('.element')
            const change1Promise = up.render('.element', { url: '/path1' })

            expect(up.network.queue.allRequests.length).toBe(1)

            up.render('.element', { url: '/path2', abort: 'target' })

            await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
          })

          it('aborts an existing requests targeting the same URL and element IFF not caching (bugfix)', async function() {
            fixture('.element')
            const change1Promise = up.render('.element', { url: '/path1' })

            expect(up.network.queue.allRequests.length).toBe(1)

            up.render('.element', { url: '/path1', abort: 'target' })

            await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
          })

          it('aborts a conflicting request made while the render pass is waiting for the network', async function() {
            fixture('.element', { text: 'v1' })

            const change1Promise = up.render('.element', { url: '/path2', abort: 'target' })
            await wait()

            expect(up.network.queue.allRequests.length).toBe(1)
            const change2Promise = up.render('.element', { url: '/path1', abort: false })
            await wait()

            expect(up.network.queue.allRequests.length).toBe(2)

            jasmine.respondWith({ request: 0, responseText: '<div class="element">v2</div>' })

            await expectAsync(change2Promise).toBeRejectedWith(jasmine.any(up.Aborted))
            await expectAsync(change1Promise).toBeResolvedTo(jasmine.any(up.RenderResult))
            expect('.element').toHaveText('v2')
          })

          it('aborts a conflicting request made while the render pass is waiting for a failed response', async function() {
            fixture('.element', { text: 'v1' })
            fixture('.fail-element', { text: 'v1' })

            const change1Promise = up.render({ target: '.element', failTarget: '.fail-element', url: '/path2', abort: 'target' })
            await wait()

            expect(up.network.queue.allRequests.length).toBe(1)
            const change2Promise = up.render('.fail-element', { url: '/path1', abort: false })
            await wait()

            expect(up.network.queue.allRequests.length).toBe(2)

            jasmine.respondWith({ request: 0, responseText: '<div class="fail-element">v2</div>', status: 500 })

            await expectAsync(change2Promise).toBeRejectedWith(jasmine.any(up.Aborted))
            await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.RenderResult))
            expect('.element').toHaveText('v1')
            expect('.fail-element').toHaveText('v2')
          })

          it('aborts existing requests targeting the same element when updating from local content', async function() {
            fixture('.element')
            const change1Promise = up.render('.element', { url: '/path1' })

            fixture('.sibling')
            const change2Promise = up.render('.sibling', { url: '/path2' })

            expect(up.network.queue.allRequests.length).toBe(2)

            up.render('.element', { content: 'new content', abort: 'target' })

            await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
            await expectAsync(change2Promise).toBePending()
            expect('.element').toHaveText('new content')
          })

          it('aborts existing requests targeting a descendant of the targeted element', async function() {
            fixture('.parent .child')
            const change1Promise = up.render('.child', { url: '/path1' })

            expect(up.network.queue.allRequests.length).toBe(1)

            up.render('.parent', { url: '/path2', abort: 'target' })

            await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
          })

          it('does not abort existing requests targeting an ascendant of the targeted element', async function() {
            fixture('.parent .child')
            const parentChangePromise = up.render('.parent', { url: '/path1' })

            expect(up.network.queue.allRequests.length).toBe(1)

            up.render('.child', { url: '/path2', abort: 'target' })

            await expectAsync(parentChangePromise).toBePending()
          })

          it('does not abort its own preloading request', async function() {
            fixture('.element')
            const link = fixture('a[href="/path"][up-target=".element"]')

            const preloadPromise = up.link.preload(link)
            await wait()

            expect(up.network.queue.allRequests.length).toBe(1)

            const followPromise = up.link.follow(link)
            await wait()

            await expectAsync(preloadPromise).toBePending()
            await expectAsync(followPromise).toBePending()
            expect(up.network.queue.allRequests.length).toBe(1)
          })

          describe('up:fragment:aborted event', function() {

            it('emits with a { jid } property so listeners can exclude their own update', async function() {
              let element = fixture('.element')
              const change1Promise = up.render('.element', { url: '/path1' })
              await wait()

              expect(up.network.queue.allRequests.length).toBe(1)

              let abortedListener = jasmine.createSpy('up:fragment:aborted listener')
              up.on('up:fragment:aborted', abortedListener)

              up.render('.element', { url: '/path2', abort: 'target', jid: 'my-jid-123' })

              await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
              expect(abortedListener.calls.count()).toBe(1)
              expect(abortedListener.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
                type: 'up:fragment:aborted',
                target: element,
                jid: 'my-jid-123',
              }))
            })

            it('is emitted before a request is made when other requests are in flight', async function() {
              let element = fixture('.element')
              const change1Promise = up.render('.element', { url: '/path1' })
              await wait()

              expect(up.network.queue.allRequests.length).toBe(1)

              let abortedListener = jasmine.createSpy('up:fragment:aborted listener')
              up.on('up:fragment:aborted', abortedListener)

              up.render('.element', { url: '/path2', abort: 'target' })

              await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
              expect(abortedListener.calls.count()).toBe(1)
              expect(abortedListener.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
                type: 'up:fragment:aborted',
                target: element,
              }))
            })

            it('is emitted before a request is made when no other requests are in flight', async function() {
              let element = fixture('.element')

              let abortedListener = jasmine.createSpy('up:fragment:aborted listener')
              up.on('up:fragment:aborted', abortedListener)

              up.render('.element', { url: '/path2', abort: 'target' })
              await wait()

              expect(abortedListener.calls.count()).toBe(1)
              expect(abortedListener.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
                type: 'up:fragment:aborted',
                target: element,
              }))
            })

            it('is emitted before an element is swapped from local HTML', async function() {
              let originalElement = htmlFixture('<div class="element">v1</div>')
              const change1Promise = up.render('.element', { url: '/path1' })
              await wait()

              expect(up.network.queue.allRequests.length).toBe(1)

              let abortedListener = jasmine.createSpy('up:fragment:aborted listener')
              up.on('up:fragment:aborted', abortedListener)

              up.render({ fragment: '<div class="element">v2</div>', abort: 'target' })

              await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
              expect(abortedListener.calls.count()).toBeGreaterThanOrEqual(1)
              expect(abortedListener.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
                type: 'up:fragment:aborted',
                target: originalElement,
              }))
              expect('.element').toHaveText('v2')
            })

            it('is emitted before an element is swapped from local HTML and no requests are in flight', async function() {
              let originalElement = htmlFixture('<div class="element">v1</div>')

              let abortedListener = jasmine.createSpy('up:fragment:aborted listener')
              up.on('up:fragment:aborted', abortedListener)

              up.render({ fragment: '<div class="element">v2</div>', abort: 'target' })
              await wait()

              expect('.element').toHaveText('v2')
              expect(abortedListener.calls.count()).toBeGreaterThanOrEqual(1)
              expect(abortedListener.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
                type: 'up:fragment:aborted',
                target: originalElement,
              }))
            })

          })

        })

        describe('with { abort: false }', function() {

          it("does not abort an existing change's request", async function() {
            fixture('.element')

            let change1Error = undefined
            let change1Promise = undefined

            change1Promise = up.render('.element', { url: '/path1' })
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            up.render('.element', { url: '/path2', abort: false })

            await wait()

            expect(change1Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(2)
          })

          it('does not abort requests targeting the same subtree once our response is received and swapped in', async function() {
            fixture('.element', { text: 'old text' })

            const change1Promise = up.render('.element', { url: '/path1', abort: false })
            let change1Error = undefined
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)

            up.render('.element', { url: '/path2', abort: false })

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(2)
            expect(change1Error).toBeUndefined()

            jasmine.respondWithSelector('.element', { text: 'text from /path2' })

            await wait()

            expect('.element').toHaveText('text from /path2')
            expect(change1Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          describe('up:fragment:aborted event', function() {
            it('is not emitted at any point during the render process', async function() {
              fixture('.element')

              up.render('.element', { url: '/path1' })
              await wait()

              expect(up.network.queue.allRequests.length).toEqual(1)

              let abortedListener = jasmine.createSpy('up:fragment:aborted listener')
              up.on('up:fragment:aborted', abortedListener)
              await wait()

              up.render('.element', { url: '/path2', abort: false })
              await wait()

              expect(up.network.queue.allRequests.length).toEqual(2)
              expect(abortedListener).not.toHaveBeenCalled()
            })

          })

        })
      })

      if (up.migrate.loaded) {
        describe('with { solo } option', function() {

          it('aborts the request of an existing change', async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined
            let change2Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', solo: true }).catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.render('.element', { url: '/path2', solo: true })

            await wait()

            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          it('aborts the request of an existing change if the new change is made from local content', async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined
            let change2Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', solo: true }).catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.render('.element', { content: 'local content', solo: true })

            await wait()

            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(0)
          })

          it('does not cancel its own pending preload request (bugfix)', async function() {
            fixture('.element')
            const changeLink = fixture('a[href="/path"][up-target=".element"]')

            let change1Error  = undefined
            let change2Error  = undefined
            let change1Promise = undefined
            let change2Promise = undefined

            change1Promise = up.link.preload(changeLink)
            change1Promise.catch((e) => change1Error = e)
            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.follow(changeLink, { solo: true })
            change2Promise.catch((e) => change2Error = e)
            await wait()

            expect(change1Error).toBeUndefined()
            expect(change2Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          it("aborts an existing change's request that was queued with { solo: false }", async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined
            let change2Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', solo: false }).catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.render('.element', { url: '/path2', solo: true })

            await wait()

            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          it("does not abort an existing change's request when called with { solo: false }", async function() {
            fixture('.element')

            let change1Error = undefined
            let change1Promise = undefined

            let change2Promise = undefined

            change1Promise = up.render('.element', { url: '/path1' }).catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.render('.element', { url: '/path2', solo: false })

            await wait()

            expect(change1Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(2)
          })

          it('may be passed as a function that decides which existing requests are aborted', async function() {
            fixture('.element1')
            fixture('.element2')
            fixture('.element3')

            let change1Promise = undefined
            let change1Error = undefined

            let change2Promise = undefined
            let change2Error = undefined

            let change3Promise = undefined
            let change3Error = undefined

            change1Promise = up.render('.element1', { url: '/path1', abort: false }).catch((e) => change1Error = e)
            change2Promise = up.render('.element2', { url: '/path2', abort: false }).catch((e) => change2Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(2)
            expect(change1Error).toBeUndefined()
            expect(change2Error).toBeUndefined()

            const soloFn = (request) => u.matchURLs(request.url, '/path1')

            change3Promise = up.render('.element3', { url: '/path3', solo: soloFn }).catch((e) => change3Error = e)

            await wait()

            expect(change1Error).toBeAbortError()
            expect(change2Error).toBeUndefined()
            expect(change3Error).toBeUndefined()

            expect(up.network.queue.allRequests.length).toEqual(2)
          })

          it('may be passed as a function that decides which existing requests are aborted when updating from local content', async function() {
            fixture('.element1')
            fixture('.element2')
            fixture('.element3')

            let change1Promise = undefined
            let change1Error = undefined

            let change2Promise = undefined
            let change2Error = undefined

            let change3Promise = undefined
            let change3Error = undefined

            change1Promise = up.render('.element1', { url: '/path1', abort: false }).catch((e) => change1Error = e)
            change2Promise = up.render('.element2', { url: '/path2', abort: false }).catch((e) => change2Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(2)
            expect(change1Error).toBeUndefined()
            expect(change2Error).toBeUndefined()

            const soloFn = (request) => u.matchURLs(request.url, '/path1')

            change3Promise = up.render('.element3', { content: 'new content', solo: soloFn }).catch((e) => change3Error = e)

            await wait()

            expect(change1Error).toBeAbortError()
            expect(change2Error).toBeUndefined()
            expect(change3Error).toBeUndefined()

            expect(up.network.queue.allRequests.length).toEqual(1)
          })
        })
      }


      require('./fragment_render_cache_spec')

      if (window.customElements) {
        describe('custom elements', function() {
          beforeAll(function() {
            var TestComponent = function() {
              const instance = Reflect.construct(HTMLElement, [], TestComponent)
              instance.innerHTML = 'component activated'
              up.emit('test-component:new')
              return instance
            }
            Object.setPrototypeOf(TestComponent.prototype, HTMLElement.prototype)
            Object.setPrototypeOf(TestComponent, HTMLElement)

            window.customElements.define('test-component-activation', TestComponent)
          })

          it('activates custom elements in inserted fragments', async function() {
            fixture('.target')

            up.render('.target', { content: `
              <test-component-activation></test-component-activation>
            ` })

            await wait()
            expect('.target test-component-activation').toHaveText('component activated')
          })

          it('does not activate custom elements outside of inserted fragments (for performance reasons)', async function() {
            fixture('.target')
            const constructorSpy = jasmine.createSpy('constructor called')
            up.on('test-component:new', constructorSpy)

            up.render('.target', { document: `
              <div class="target">
                <test-component-activation></test-component-activation>
              </div>
              <div class="other">
                <test-component-activation></test-component-activation>
              </div>
            ` })

            await wait()
            expect(constructorSpy.calls.count()).toBe(1)
          })
        })
      }
    })

  })

})
