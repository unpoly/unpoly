const u = up.util

extendDescribe('up.fragment', function() {

  extendDescribe('JavaScript functions', function() {

    extendDescribe('up.render()', function() {

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

    })

  })

})
