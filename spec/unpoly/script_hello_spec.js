const u = up.util
const e = up.element

extendDescribe('up.script', function() {

  extendDescribe('JavaScript functions', function() {

    describe('up.hello()', function() {

      it('calls compilers with the given element', function() {
        const compiler = jasmine.createSpy('compiler')
        up.compiler('.element', compiler)
        const element = fixture('.element')

        up.hello(element)
        expect(compiler).toHaveBeenCalledWith(element, jasmine.anything(), jasmine.anything())
      })

      describe('idempotent compilation', function() {

        it('does not re-compile elements when called multiple times', function() {
          const compiler = jasmine.createSpy('compiler')
          up.compiler('.element', compiler)
          const element = fixture('.element')

          up.hello(element)
          up.hello(element)
          expect(compiler.calls.count()).toBe(1)
        })

        it('does not re-compile elements when their container is compiled afterwards', function() {
          const compiler = jasmine.createSpy('compiler')
          up.compiler('.element', compiler)
          const container = fixture('.container')
          const element = e.affix(container, '.element')

          up.hello(element)
          up.hello(container)
          expect(compiler.calls.count()).toBe(1)
        })

      })

      describe('current layer', function() {

        it("sets up.layer.current to the given element's layer while compilers are running", async function() {
          const layerSpy = jasmine.createSpy('layer spy')
          up.compiler('.foo', () => layerSpy(up.layer.current))
          makeLayers(2)

          await wait()

          const rootElement = fixture('.foo.in-root')
          const overlayElement = up.layer.get(1).affix('.foo.in-overlay')

          up.hello(rootElement)
          up.hello(overlayElement)

          expect(layerSpy.calls.count()).toBe(2)

          expect(layerSpy.calls.argsFor(0)[0]).toBe(up.layer.get(0))
          expect(layerSpy.calls.argsFor(1)[0]).toBe(up.layer.get(1))
        })

        it('keeps up.layer.current and does not crash when compiling a detached element (bugfix)', async function() {
          const layerSpy = jasmine.createSpy('layer spy')
          up.compiler('.foo', () => layerSpy(up.layer.current))
          makeLayers(2)

          await wait()

          expect(up.layer.current.isOverlay()).toBe(true)

          const element = up.element.createFromSelector('.foo')
          const compileFn = () => up.hello(element)

          expect(compileFn).not.toThrowError()
          expect(layerSpy.calls.argsFor(0)[0]).toBe(up.layer.current)
        })

      })

      it("sets the compiled fragment's layer as layer.current, even if the fragment is not in the front layer")

      describe('up:fragment:inserted event', function() {

        it('emits an up:fragment:inserted event', function() {
          const target = fixture('.element')
          const listener = jasmine.createSpy('up:fragment:inserted listener')
          target.addEventListener('up:fragment:inserted', listener)

          up.hello(target)

          const expectedEvent = jasmine.objectContaining({ target })
          expect(listener).toHaveBeenCalledWith(expectedEvent)
        })

        it('exposes meta information about the compiler pass as event properties', function() {
          const target = fixture('.element')
          const listener = jasmine.createSpy('up:fragment:inserted listener')
          target.addEventListener('up:fragment:inserted', listener)

          up.hello(target)

          const expectedEvent = jasmine.objectContaining({
            ok: true,
            revalidating: false,
            layer: up.layer.root,
          })
          expect(listener).toHaveBeenCalledWith(expectedEvent)
        })

        it('emits up:fragment:inserted after compilation', function() {
          const callOrder = []
          up.compiler('.element', () => callOrder.push('compiler'))
          const target = fixture('.element')
          target.addEventListener('up:fragment:inserted', () => callOrder.push('event'))

          up.hello(target)

          expect(callOrder).toEqual(['compiler', 'event'])
        })

        it('does not delay up:fragment:inserted until an async compiler has run', async function() {
          const callOrder = []
          up.compiler('.element', async () => {
            callOrder.push('compiler:start')
            await wait(50)
            callOrder.push('compiler:end')
          })
          const target = fixture('.element')
          target.addEventListener('up:fragment:inserted', () => callOrder.push('event'))

          await up.hello(target)

          expect(callOrder).toEqual(['compiler:start', 'event', 'compiler:end'])
        })

        it('only emits up:fragment:inserted once when the same element is passed to up.hello() multiple times', async function() {
          const target = fixture('.element')
          const listener = jasmine.createSpy('up:fragment:inserted listener')
          target.addEventListener('up:fragment:inserted', listener)

          up.hello(target)
          up.hello(target)

          expect(listener.calls.count()).toBe(1)
        })

      })

      describe('when a compiler throws an error', function() {

        it('emits an error event but does not throw an exception', async function() {
          const compileError = new Error("error from crashing compiler")
          const crashingCompiler = function() { throw compileError }
          up.compiler('.element', crashingCompiler)
          const element = fixture('.element')

          await jasmine.expectGlobalError(compileError, function() {
            const hello = () => up.hello(element)
            expect(hello).not.toThrowError()
          })
        })

        it('does not prevent other compilers from running', async function() {
          const compilerBefore = jasmine.createSpy('compiler before')
          const compileError = new Error("error from crashing compiler")
          const crashingCompiler = function() { throw compileError }
          const compilerAfter = jasmine.createSpy('compiler after')

          up.compiler('.element', compilerBefore)
          up.compiler('.element', crashingCompiler)
          up.compiler('.element', compilerAfter)

          const element = fixture('.element')

          await jasmine.expectGlobalError(compileError, () => up.hello(element))

          expect(compilerBefore).toHaveBeenCalled()
          expect(compilerAfter).toHaveBeenCalled()
        })
      })

      describe('data', function() {

        it('parses an [up-data] attribute as JSON and passes the parsed object as a second argument to the compiler', function() {
          const observeArgs = jasmine.createSpy()
          up.compiler('.child', (element, data) => observeArgs(element.className, data))

          const data = { key1: 'value1', key2: 'value2' }

          const $tag = $fixture(".child").attr('up-data', JSON.stringify(data))
          up.hello($tag[0])

          expect(observeArgs).toHaveBeenCalledWith('child', jasmine.objectContaining(data))
        })

        it('passes an empty object as a second argument to the compiler if there is no [up-data] attribute', function() {
          const observeArgs = jasmine.createSpy()
          up.compiler('.child', (element, data) => observeArgs(element.className, data))

          helloFixture(".child")

          expect(observeArgs).toHaveBeenCalledWith('child', jasmine.objectContaining({}))
        })

        it('does not parse an [up-data] attribute if the compiler function only takes a single argument', function() {
          const parseDataSpy = spyOn(up.script, 'data').and.returnValue({})

          const $child = $fixture(".child")

          up.compiler('.child', function(element) {}) // no-op
          up.hello($child)

          expect(parseDataSpy).not.toHaveBeenCalled()
        })

        describe('with { data } option', function() {
          it('allows to override an object parsed from a [up-data] attribute', function() {
            const observeArgs = jasmine.createSpy()
            up.compiler('.child', (element, data) => observeArgs(element.className, data))

            const data = { key1: 'value1', key2: 'value2' }

            const $tag = $fixture(".child").attr('up-data', JSON.stringify(data))

            up.hello($tag[0], { data: { key2: 'override-value2' } })

            expect(observeArgs).toHaveBeenCalledWith('child', { key1: 'value1', key2: 'override-value2' })
          })
        })

        describe('with { dataMap } option', function() {
          it('allows to override the [up-data] attribute of each matching element', function() {
            const observeArgs = jasmine.createSpy()
            up.compiler('.child', (element, data) => observeArgs(element.id, data))

            const fragment = fixture('.fragment')
            const child1 = e.affix(fragment, '.child#child1', { 'up-data': JSON.stringify({ foo: 'default foo' }) })
            const child2 = e.affix(fragment, '.child#child2', { 'up-data': JSON.stringify({ foo: 'default foo' }) })

            up.hello(fragment, { dataMap: {
                '#child1': { foo: 'foo for child1' },
                '#child2': { foo: 'foo for child2' },
              }
            })

            expect(observeArgs.calls.argsFor(0)).toEqual(['child1', { foo: 'foo for child1' }])
            expect(observeArgs.calls.argsFor(1)).toEqual(['child2', { foo: 'foo for child2' }])
          })
        })

      })

      describe('meta information about the render pass', function() {

        describe('meta.layer', function() {

          it('points to the layer in which we render', async function() {
            const compiler = jasmine.createSpy('compiler')
            up.compiler('.target', compiler)

            let targetHTML = (text) => `<div class="target">${text}</div>`

            await makeLayers([
              { fragment: targetHTML('old root') },
              { fragment: targetHTML('old overlay') },
            ])

            await up.render({ fragment: targetHTML('new root'), layer: 'root' })
            expect(up.fragment.get('.target', { layer: 'root' })).toHaveText('new root')
            expect(compiler.calls.mostRecent().args[2].layer).toBe(up.layer.get(0))


            await up.render({ fragment: targetHTML('new overlay'), layer: 'overlay' })
            expect(up.fragment.get('.target', { layer: 'overlay' })).toHaveText('new overlay')
            expect(compiler.calls.mostRecent().args[2].layer).toBe(up.layer.get(1))
          })
        })

        describe('meta.ok', function() {

          it('returns true when rendering from a successful response', async function() {
            const compiler = jasmine.createSpy('compiler')
            up.compiler('.target', compiler)

            let targetHTML = (text) => `<div class="target">${text}</div>`
            htmlFixture(targetHTML('old'))

            up.render({ target: '.target', url: '/path' })
            await wait()
            jasmine.respondWith(targetHTML('new'))
            await wait()

            expect('.target').toHaveText('new')
            expect(compiler.calls.mostRecent().args[2].ok).toBe(true)
          })

          it('returns false when rendering from a failed response', async function() {
            const compiler = jasmine.createSpy('compiler')
            up.compiler('.target', compiler)

            let targetHTML = (text) => `<div class="target">${text}</div>`
            htmlFixture(targetHTML('old'))

            up.render({ target: '.target', failTarget: '.target', url: '/path' })
            await wait()
            jasmine.respondWith({ status: 500, responseText: targetHTML('new') })
            await wait()

            expect('.target').toHaveText('new')
            expect(compiler.calls.mostRecent().args[2].ok).toBe(false)
          })

          it('returns true when rendering local content', async function() {
            const compiler = jasmine.createSpy('compiler')
            up.compiler('.target', compiler)

            let targetHTML = (text) => `<div class="target">${text}</div>`
            htmlFixture(targetHTML('old'))

            up.render({ fragment: targetHTML('new') })
            await wait()

            expect('.target').toHaveText('new')
            expect(compiler.calls.mostRecent().args[2].ok).toBe(true)
          })

        })

        describe('meta.revalidating', function() {

          it("returns whether we're compiling content from a revalidation response", async function() {
            const compiler = jasmine.createSpy('compiler')
            up.compiler('.target', compiler)

            let targetHTML = (text) => `<div class="target">${text}</div>`
            htmlFixture(targetHTML('old'))

            await jasmine.populateCache('/path', targetHTML('<div class="target">expired</div>'))
            up.cache.expire()

            up.render({ target: '.target', url: '/path', cache: true, revalidate: 'auto' })
            await wait()

            expect('.target').toHaveText('expired')
            expect(compiler.calls.mostRecent().args[2].revalidating).toBe(false)

            expect(up.network.isBusy()).toBe(true)
            jasmine.respondWith(targetHTML('revalidated'))
            await wait()

            expect('.target').toHaveText('revalidated')
            expect(compiler.calls.mostRecent().args[2].revalidating).toBe(true)
          })

          it('returns false when rendering local content', async function() {
            const compiler = jasmine.createSpy('compiler')
            up.compiler('.target', compiler)

            let targetHTML = (text) => `<div class="target">${text}</div>`
            htmlFixture(targetHTML('old'))

            up.render({ fragment: targetHTML('new') })
            await wait()

            expect('.target').toHaveText('new')
            expect(compiler.calls.mostRecent().args[2].revalidating).toBe(false)
          })

        })

      })

      describe('async compilers', function() {

        it('returns a promise that instantly fulfills with the given element when only sync compilers are registers', async function() {
          const compiler = jasmine.createSpy('compiler')
          up.compiler('.element', compiler)
          const element = fixture('.element')

          let promise = up.hello(element)
          expect(promise).toBePromiseLike()

          await expectAsync(promise).toBeResolvedTo(element)
        })

        it('returns a promise that delays fulfillment until all async compilers have terminated', async function() {
          let compilerDeferred = u.newDeferred()
          up.compiler('.element', async function(_element) {
            await compilerDeferred
          })
          const element = fixture('.element')

          let promise = up.hello(element)
          expect(promise).toBePromiseLike()
          await wait(50)

          await expectAsync(promise).toBePending()
          compilerDeferred.resolve()

          await expectAsync(promise).toBeResolvedTo(element)
        })

        it('delays the promise until async batch compilers have terminated', async function() {
          let compilerDeferred = u.newDeferred()
          up.compiler('.element', { batch: true }, async function(_elements) {
            await compilerDeferred
          })
          const element = fixture('.element')

          let promise = up.hello(element)
          expect(promise).toBePromiseLike()
          await wait(50)

          await expectAsync(promise).toBePending()
          compilerDeferred.resolve()

          await expectAsync(promise).toBeResolvedTo(element)
        })

        it('fulfills the promise when an async compiler rejects (and emits an error event)', async function() {
          let asyncError = new Error('error from async compiler')
          let compilerDeferred = u.newDeferred()
          up.compiler('.element', async function(_element) {
            await compilerDeferred
          })
          const element = fixture('.element')

          let promise = up.hello(element)

          await wait(10)

          await jasmine.expectGlobalError(asyncError, async function() {
            compilerDeferred.reject(asyncError)
            await wait()
            await expectAsync(promise).toBeResolvedTo(element)
          })
        })

        it('fulfills the promise when an async batch compiler rejects (and emits an error event)', async function() {
          let asyncError = new Error('error from async compiler')
          let compilerDeferred = u.newDeferred()
          up.compiler('.element', { batch: true }, async function(_elements) {
            await compilerDeferred
          })
          const element = fixture('.element')

          let promise = up.hello(element)

          await wait(10)

          await jasmine.expectGlobalError(asyncError, async function() {
            compilerDeferred.reject(asyncError)
            await wait()
            await expectAsync(promise).toBeResolvedTo(element)
          })
        })

      })

      it('compiles multiple matching elements one-by-one', function() {
        const compiler = jasmine.createSpy('compiler')
        up.compiler('.foo', (element) => compiler(element))
        const $container = $fixture('.container')
        const $first = $container.affix('.foo.first')
        const $second = $container.affix('.foo.second')
        up.hello($container[0])
        expect(compiler.calls.count()).toEqual(2)
        expect(compiler).toHaveBeenCalledWith($first[0])
        expect(compiler).toHaveBeenCalledWith($second[0])
      })

      if (up.migrate.loaded) {

        it('throws if the return value is used like an Element (the former API)', async function() {
          let element = fixture('.element')
          up.compiler('.element', async function() { })

          let result = up.hello(element)

          let getInnerHTML = () => result.innerHTML
          expect(getInnerHTML).toThrowError(/now async/)

          let callQuerySelector = () => result.querySelector('span')
          expect(callQuerySelector).toThrowError(/now async/)

          let callGetAttribute = () => result.getAttribute('data-foo')
          expect(callGetAttribute).toThrowError(/now async/)
        })

        it('does not throw if the return value is used like a Promise (the current API)', async function() {
          const compiler = jasmine.createSpy('compiler')
          up.compiler('.element', compiler)
          const element = fixture('.element')

          let promise = up.hello(element)
          expect(promise).toBePromiseLike()

          await expectAsync(promise).toBeResolvedTo(element)
        })

      }

    })

  })

})
