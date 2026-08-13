const u = up.util
const e = up.element
const $ = jQuery

extendDescribe('up.script', function() {

  extendDescribe('JavaScript functions', function() {

    describe('up.compiler()', function() {

      it('applies an event initializer whenever a matching fragment is inserted', function() {
        const observeElement = jasmine.createSpy()
        up.compiler('.child', (element) => observeElement(element))

        const $container = $fixture('.container')
        const $child = $container.affix('.child')
        const $otherChild = $container.affix('.other-child')

        up.hello($container[0])

        expect(observeElement).not.toHaveBeenCalledWith($container[0])
        expect(observeElement).not.toHaveBeenCalledWith($otherChild[0])
        expect(observeElement).toHaveBeenCalledWith($child[0])
      })

      it('allows to compilers to have priorities of their own (higher priority is run first)', function() {
        const traces = []
        up.compiler('.element', { priority: 1 }, () => traces.push('foo'))
        up.compiler('.element', { priority: 2 }, () => traces.push('bar'))
        up.compiler('.element', { priority: 0 }, () => traces.push('baz'))
        helloFixture('.element')
        expect(traces).toEqual(['bar', 'foo', 'baz'])
      })

      describe('destructors', function() {

        it('lets callbacks return a function that is called when the element is destroyed later', function() {
          const destructor = jasmine.createSpy('destructor')
          up.compiler('.element', (_element) => destructor)
          helloFixture('.element')
          up.destroy('.element')
          expect(destructor).toHaveBeenCalled()
        })

        it('lets callbacks return an array of functions that is called when the element is destroyed later', function() {
          const destructor1 = jasmine.createSpy('destructor1')
          const destructor2 = jasmine.createSpy('destructor2')
          up.compiler('.element', (_element) => [destructor1, destructor2])
          helloFixture('.element')
          up.destroy('.element')
          expect(destructor1).toHaveBeenCalled()
          expect(destructor2).toHaveBeenCalled()
        })

        it('allows callback register destructors using up.destructor()', function() {
          const destructor1 = jasmine.createSpy('destructor1')
          const destructor2 = jasmine.createSpy('destructor2')
          up.compiler('.element', (element) => {
            up.destructor(element, destructor1)
            up.destructor(element, destructor2)
          })
          helloFixture('.element')
          up.destroy('.element')
          expect(destructor1).toHaveBeenCalled()
          expect(destructor2).toHaveBeenCalled()
        })

        it('does not crash during compilation or destruction if a non-function value is returned (e.g. from CoffeeScript implicit returns)', function() {
          up.compiler('.element', (element) => 'foo')
          let element = fixture('.element')
          expect(() => up.hello(element)).not.toThrowError()
          expect(() => up.destroy(element)).not.toThrowError()
        })

        describe('with async callbacks', function() {

          it('lets async callbacks resolve to a destructor function', async function() {
            const destructor = jasmine.createSpy('destructor')
            up.compiler('.element', async function(_element) {
              return destructor
            })
            await up.hello(fixture('.element'))
            expect(destructor).not.toHaveBeenCalled()

            up.destroy('.element')

            expect(destructor).toHaveBeenCalled()
          })

          it('lets async callbacks resolve to an array of destructor functions', async function() {
            const destructor1 = jasmine.createSpy('destructor1')
            const destructor2 = jasmine.createSpy('destructor2')
            up.compiler('.element', async function(_element) {
              return [destructor1, destructor2]
            })
            await up.hello(fixture('.element'))
            expect(destructor1).not.toHaveBeenCalled()
            expect(destructor2).not.toHaveBeenCalled()
            await wait()

            up.destroy('.element')

            expect(destructor1).toHaveBeenCalled()
            expect(destructor2).toHaveBeenCalled()
          })

          it('avoids setting .up-can-clean while the async callback is running (nice-to-have, no public API commitment)', async function() {
            const blocker = u.newDeferred()
            up.compiler('.element', async function(_element) {
              await blocker
              return up.util.noop // destructor will be returned after the element is destroyed
            })

            // Start up.hello(), but don't wait for it to settle
            up.hello(fixture('.element'))
            await wait()

            expect('.element').not.toHaveClass('up-can-clean')

            // Don't leave the async callback running
            blocker.resolve()
          })

          it('runs a destructor if the element was destroyed before the async callback finished', async function() {
            const blocker = u.newDeferred()
            const destructor = jasmine.createSpy('destructor')
            up.compiler('.element', async function(_element) {
              await blocker
              return destructor
            })

            // Start up.hello(), but don't wait for it to settle
            up.hello(fixture('.element'))
            await wait()

            expect(destructor).not.toHaveBeenCalled()

            up.destroy('.element')
            await wait()

            expect(destructor).not.toHaveBeenCalled()

            blocker.resolve()
            await wait()

            expect(destructor).toHaveBeenCalled()
          })

        })

      })

      describe('with { batch } option', function() {

        it('compiles all matching elements at once', function() {
          const compiler = jasmine.createSpy('compiler')
          up.compiler('.foo', { batch: true }, (elements) => compiler(elements))
          const $container = $fixture('.container')
          const first = $container.affix('.foo.first')[0]
          const second = $container.affix('.foo.second')[0]
          up.hello($container)
          expect(compiler.calls.count()).toEqual(1)
          expect(compiler).toHaveBeenCalledWith([first, second])
        })

        it('reports an error if the batch compiler returns a destructor', async function() {
          const destructor = function() {}
          up.compiler('.element', { batch: true }, (_elements) => destructor)
          const $container = $fixture('.element')

          await jasmine.expectGlobalError(/cannot return a destructor/i, async function() {
            const compilePromise = up.hello($container)
            await expectAsync(compilePromise).toBeResolved()
          })
        })

        it('reports an error if an async batch compiler returns a destructor', async function() {
          const destructor = function() {}
          up.compiler('.element', { batch: true }, async function(_elements) {
            return destructor
          })
          const $container = $fixture('.element')

          await jasmine.expectGlobalError(/cannot return a destructor/i, async function() {
            const compilePromise = up.hello($container)
            await expectAsync(compilePromise).toBeResolved()
          })
        })

      })

      if (up.migrate.loaded) {
        describe('with { keep } option', function() {
          it('adds an up-keep attribute to the fragment during compilation', function() {

            up.compiler('.foo', { keep: true }, function() {})
            up.compiler('.bar', { }, function() {})
            up.compiler('.bar', { keep: false }, function() {})
            up.compiler('.bam', { keep: '.partner' }, function() {})

            const $foo = $(helloFixture('.foo'))
            const $bar = $(helloFixture('.bar'))
            const $baz = $(helloFixture('.baz'))
            const $bam = $(helloFixture('.bam'))

            expect($foo.attr('up-keep')).toEqual('')
            expect($bar.attr('up-keep')).toBeMissing()
            expect($baz.attr('up-keep')).toBeMissing()
            expect($bam.attr('up-keep')).toEqual('.partner')
          })
        })
      }

      describe('with { priority } option', function() {

        it('runs compilers with higher priority first', function() {
          const traces = []
          up.compiler('.element', { priority: 1 }, () => traces.push('foo'))
          up.compiler('.element', { priority: 2 }, () => traces.push('bar'))
          up.compiler('.element', { priority: 0 }, () => traces.push('baz'))
          up.compiler('.element', { priority: 3 }, () => traces.push('bam'))
          up.compiler('.element', { priority: -1 }, () => traces.push('qux'))
          helloFixture('.element')
          expect(traces).toEqual(['bam', 'bar', 'foo', 'baz', 'qux'])
        })

        it('considers priority-less compilers to be priority zero', function() {
          const traces = []
          up.compiler('.element', { priority: 1 }, () => traces.push('foo'))
          up.compiler('.element', () => traces.push('bar'))
          up.compiler('.element', { priority: -1 }, () => traces.push('baz'))
          helloFixture('.element')
          expect(traces).toEqual(['foo', 'bar', 'baz'])
        })

        it('runs two compilers with the same priority in the order in which they were registered', function() {
          const traces = []
          up.compiler('.element', { priority: 1 }, () => traces.push('foo'))
          up.compiler('.element', { priority: 1 }, () => traces.push('bar'))
          helloFixture('.element')
          expect(traces).toEqual(['foo', 'bar'])
        })
      })

      describe('when a compiler is registered after booting', function() {

        describe('with { priority }', function() {

          it('prints a message explaining that the compiler will only run for future fragments', function() {
            spyOn(up, 'puts').and.callThrough()
            up.compiler('.foo', { priority: 10 }, u.noop)
            expect(up.puts).toHaveBeenCalledWith(
              jasmine.anything(),
              jasmine.stringContaining('will run for future fragments'),
              jasmine.anything()
            )
          })

          it('runs the compiler for future fragments, but not for current fragments (even if they match)', function() {
            const spy = jasmine.createSpy('compiler')
            const element1 = helloFixture('.element')
            up.compiler('.element', { priority: 10 }, (element) => spy(element))

            expect(spy).not.toHaveBeenCalled()

            const element2 = helloFixture('.element')

            expect(spy).toHaveBeenCalledWith(element2)
          })
        })

        describe('without { priority }', function() {

          it('prints no message explaining when the compiler will run', function() {
            spyOn(up, 'puts').and.callThrough()
            up.compiler('.foo', u.noop)
            expect(up.puts).not.toHaveBeenCalledWith(jasmine.anything(), jasmine.stringContaining('will run'))
          })

          it('compiles current fragments', function() {
            const spy = jasmine.createSpy('compiler')
            const element1 = helloFixture('.element')
            up.compiler('.element', (element) => spy(element))

            expect(spy).toHaveBeenCalledWith(element1)
          })

          it('compiles current fragments on other layers', function() {
            const rootElement = fixture('.foo')
            makeLayers(2)
            const overlayElement = up.layer.affix('.foo')

            expect(document.querySelectorAll('.foo').length).toBe(2)

            const spy = jasmine.createSpy('compiler')
            up.compiler('.foo', (element) => spy(element))

            expect(spy.calls.count()).toBe(2)
            expect(spy.calls.argsFor(0)[0]).toBe(rootElement)
            expect(spy.calls.argsFor(1)[0]).toBe(overlayElement)
          })

          it('compile elements once (not twice) if the new fragment contains a <script> that defines a new compiler', function() {
            up.script.config.scriptElementPolicy = 'pass'

            const container = fixture('.container')
            const element = e.affix(container, '.element', { text: 'old text' })

            window.compileSpy = jasmine.createSpy('compile spy')

            up.render({ fragment: `
              <div class="container">
                <div class="element">new text</div>
                <script nonce="specs-nonce">
                  up.compiler('.element', (element) => window.compileSpy(element))
                </script>
              </div>
            ` })

            expect(window.compileSpy.calls.count()).toBe(1)

            delete window.compileSpy
          })
        })
      })
    })

  })

})
