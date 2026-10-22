const u = up.util

extendDescribe('up.fragment', function() {

  extendDescribe('JavaScript', function() {

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

        it('emits up:fragment:inserted on a wrapper around the new children when swapping children, and unwraps them afterwards', async function() {
          const insertedSpy = jasmine.createSpy('up:fragment:inserted listener')
          up.on('up:fragment:inserted', (event) => insertedSpy(event.target.tagName, event.target.textContent.trim()))

          up.hello(fixture('.fragment', { text: 'old text' }))
          await up.render({ target: '.fragment:content', document: '<div class="fragment"><span class="child">new text</span></div>' })

          expect(insertedSpy).toHaveBeenCalledWith('UP-WRAPPER', 'new text')
          expect(document).not.toHaveSelector('up-wrapper')
          expect('.fragment > .child').toHaveText('new text')
        })

        it('runs compilers when appending children', async function() {
          const childCompiler = jasmine.createSpy('compiler')
          up.compiler('.child', (element) => childCompiler(element.tagName, element.className))

          fixture('.fragment')
          await up.render({ target: '.fragment:after', document: '<div class="fragment"><span class="child"></span></div>' })

          expect(childCompiler).toHaveBeenCalledWith('SPAN', 'child')
        })

        describe('when updating multiple fragments', function() {

          let html = (prefix) => `
            <div id="fragment1">
              ${prefix} fragment1
            </div>
            <div id="fragment2">
              ${prefix} fragment2
            </div>
          `

          let texts = () => [
            up.fragment.get('#fragment1').textContent.trim(),
            up.fragment.get('#fragment2').textContent.trim(),
          ]

          it('lets a compiler in the first fragment see the new second fragment', async function() {
            let compileSpy = jasmine.createSpy('compile spy')
            up.compiler('#fragment1', () => compileSpy(...texts()))
            htmlFixtureList(html('old'))

            await up.render({ target: '#fragment1, #fragment2', document: html('new') })

            expect(compileSpy).toHaveBeenCalledWith('new fragment1', 'new fragment2')
          })

          it('lets a compiler in the second fragment see the new first fragment', async function() {
            let compileSpy = jasmine.createSpy('compile spy')
            up.compiler('#fragment2', () => compileSpy(...texts()))
            htmlFixtureList(html('old'))

            await up.render({ target: '#fragment1, #fragment2', document: html('new') })

            expect(compileSpy).toHaveBeenCalledWith('new fragment1', 'new fragment2')
          })

          it('lets a compiler in the second fragment see the new first fragment when both fragments are transitioning', async function() {
            up.motion.config.enabled = true
            let compileSpy = jasmine.createSpy('compile spy')
            up.compiler('#fragment2', () => compileSpy(...texts()))
            htmlFixtureList(html('old'))

            up.render({ target: '#fragment1, #fragment2', document: html('new'), transition: 'cross-fade', duration: 200 })
            await wait()

            expect(compileSpy).toHaveBeenCalledWith('new fragment1', 'new fragment2')
            // Old elements are still transitioning out
            expect(document).toHaveSelector('#fragment1.up-destroying')
            expect(document).toHaveSelector('#fragment2.up-destroying')
          })

          it('lets a compiler in the targeted fragment see a new hungry fragment', async function() {
            let compileSpy = jasmine.createSpy('compile spy')
            up.compiler('#fragment1', () => compileSpy(...texts()))
            htmlFixtureList(html('old'))
            up.element.get('#fragment2').setAttribute('up-hungry', '')

            await up.render({ target: '#fragment1', document: html('new') })

            expect(compileSpy).toHaveBeenCalledWith('new fragment1', 'new fragment2')
          })

          it('lets a compiler in a hungry fragment see the new targeted fragment', async function() {
            let compileSpy = jasmine.createSpy('compile spy')
            up.compiler('#fragment2', () => compileSpy(...texts()))
            htmlFixtureList(html('old'))
            up.element.get('#fragment2').setAttribute('up-hungry', '')

            await up.render({ target: '#fragment1', document: html('new') })

            expect(compileSpy).toHaveBeenCalledWith('new fragment1', 'new fragment2')
          })

          it('runs compilers in target order, then for hungry fragments', async function() {
            let html = (prefix) => `
              <div id="hungry" up-hungry>${prefix} hungry</div>
              <div id="fragment1">${prefix} fragment1</div>
              <div id="fragment2">${prefix} fragment2</div>
            `
            let compiledIDs = []
            up.compiler('#hungry, #fragment1, #fragment2', (element) => { compiledIDs.push(element.id) })
            htmlFixtureList(html('old'))

            await up.render({ target: '#fragment2, #fragment1', document: html('new') })

            expect(compiledIDs).toEqual(['fragment2', 'fragment1', 'hungry'])
          })

          it('runs all destructors before the first compiler, and emits up:fragment:destroyed after the last compiler', async function() {
            let log = []
            up.compiler('#fragment1, #fragment2', (element) => {
              log.push(`compile ${element.textContent.trim()}`)
              return () => log.push(`destroy ${element.textContent.trim()}`)
            })
            up.on('up:fragment:destroyed', ({ fragment }) => log.push(`destroyed ${fragment.textContent.trim()}`))
            htmlFixtureList(html('old')).forEach((element) => up.hello(element))
            log = []

            await up.render({ target: '#fragment1, #fragment2', document: html('new') })

            expect(log).toEqual([
              'destroy old fragment1',
              'destroy old fragment2',
              'compile new fragment1',
              'compile new fragment2',
              'destroyed old fragment1',
              'destroyed old fragment2',
            ])
          })

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

        it('compiles matching elements in each target of a multi-target update with their mapped { dataMap }', async function() {
          const compiler = jasmine.createSpy('compiler')
          up.compiler('.child', (element, data) => compiler(element.id, data))

          let html = (prefix) => `
            <div id="fragment1">
              <div class="child" id="child1">${prefix} child1</div>
            </div>
            <div id="fragment2">
              <div class="child" id="child2">${prefix} child2</div>
            </div>
          `
          htmlFixtureList(html('old'))

          await up.render({
            target: '#fragment1, #fragment2',
            document: html('new'),
            dataMap: {
              '#child1': { foo: 'data for child1' },
              '#child2': { foo: 'data for child2' },
            }
          })

          expect(compiler).toHaveBeenCalledWith('child1', { foo: 'data for child1' })
          expect(compiler).toHaveBeenCalledWith('child2', { foo: 'data for child2' })
        })

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
