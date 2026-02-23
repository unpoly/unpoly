const u = up.util
const e = up.element
const $ = jQuery

describe('up.scriptxxx', function() {

  describe('JavaScript functions', function() {

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
        describe('with { keep } option', () => it('adds an up-keep attribute to the fragment during compilation', function() {

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
        }))
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

    if (up.migrate.loaded) {
      describe('up.$compiler()', function() {
        it('registers a compiler that receives the element as a jQuery collection', function() {
          const observeElement = jasmine.createSpy()
          up.$compiler('.element', ($element) => observeElement($element))

          const $element = $fixture('.element')
          up.hello($element)

          expect(observeElement).toHaveBeenCalled()
          const arg = observeElement.calls.argsFor(0)[0]
          expect(arg).toBeJQuery()
          expect(arg).toEqual($element)
        })
      })
    }

    describe('up.macro()', function() {

      it('registers compilers that are run before other compilers', function() {
        const traces = []
        up.compiler('.element', { priority: 10 }, () => traces.push('foo'))
        up.compiler('.element', { priority: -1000 }, () => traces.push('bar'))
        up.macro('.element', () => traces.push('baz'))
        helloFixture('.element')
        expect(traces).toEqual(['baz', 'foo' , 'bar'])
      })

      it('allows to macros to have priorities of their own (higher priority is run first)', function() {
        const traces = []
        up.macro('.element', { priority: 1 }, () => traces.push('foo'))
        up.macro('.element', { priority: 2 }, () => traces.push('bar'))
        up.macro('.element', { priority: 0 }, () => traces.push('baz'))
        up.macro('.element', { priority: 3 }, () => traces.push('bam'))
        up.macro('.element', { priority: -1 }, () => traces.push('qux'))
        up.compiler('.element', { priority: 999 }, () => traces.push('ccc'))
        helloFixture('.element')
        expect(traces).toEqual(['bam', 'bar', 'foo', 'baz', 'qux', 'ccc'])
      })

      it('runs two macros with the same priority in the order in which they were registered', function() {
        const traces = []
        up.macro('.element', { priority: 1 }, () => traces.push('foo'))
        up.macro('.element', { priority: 1 }, () => traces.push('bar'))
        helloFixture('.element')
        expect(traces).toEqual(['foo', 'bar'])
      })

      it('allows users to use the built-in [up-expand] from their own macros', function() {
        up.macro('.element', (element) => element.setAttribute('up-expand', ''))
        const $element = $fixture('.element a[href="/foo"][up-target=".target"]')
        up.hello($element)
        expect($element.attr('up-target')).toEqual('.target')
        expect($element.attr('up-href')).toEqual('/foo')
      })

      if (up.migrate.loaded) {
        it('allows users to use the built-in [up-dash] from their own macros', function() {
          up.macro('.element', (element) => element.setAttribute('up-dash', '.target'))
          const $element = $fixture('a.element[href="/foo"]')
          up.hello($element)
          expect($element.attr('up-target')).toEqual('.target')
          expect($element.attr('up-preload')).toEqual('')
          expect($element.attr('up-instant')).toEqual('')
        })
      }
    })

    if (up.migrate.loaded) {
      describe('up.$macro()', function() {
        it('registers a macro that receives the element as a jQuery collection', function() {
          const observeElement = jasmine.createSpy()
          up.$macro('.element', ($element) => observeElement('macro', $element))
          up.$compiler('.element', ($element) => observeElement('compiler', $element))

          const $element = $fixture('.element')
          up.hello($element)

          expect(observeElement).toHaveBeenCalled()
          const args = observeElement.calls.argsFor(0)
          expect(args[0]).toEqual('macro')
          expect(args[1]).toBeJQuery()
          expect(args[1]).toEqual($element)
        })
      })
    }

    describe('up.destructor()', function() {

      it('registers a function that runs when the element is cleaned', function() {
        let destructorSpy = jasmine.createSpy('destructor function')
        let element = fixture('.element')

        up.destructor(element, destructorSpy)

        expect(destructorSpy).not.toHaveBeenCalled()

        up.script.clean(element)

        expect(destructorSpy).toHaveBeenCalled()
      })

      it('appends to an existing list of destructor functions', function() {
        let destructorSpy1 = jasmine.createSpy('destructor 1')
        let destructorSpy2 = jasmine.createSpy('destructor 2')
        let element = fixture('.element')

        up.destructor(element, destructorSpy1)
        up.destructor(element, destructorSpy2)

        expect(destructorSpy1).not.toHaveBeenCalled()
        expect(destructorSpy2).not.toHaveBeenCalled()

        up.script.clean(element)

        expect(destructorSpy1).toHaveBeenCalled()
        expect(destructorSpy2).toHaveBeenCalled()
      })

      it('registers an array of destructor functions at functions', function() {
        let destructorSpy1 = jasmine.createSpy('destructor 1')
        let destructorSpy2 = jasmine.createSpy('destructor 2')
        let element = fixture('.element')

        up.destructor(element, [destructorSpy1, destructorSpy2])

        expect(destructorSpy1).not.toHaveBeenCalled()
        expect(destructorSpy2).not.toHaveBeenCalled()

        up.script.clean(element)

        expect(destructorSpy1).toHaveBeenCalled()
        expect(destructorSpy2).toHaveBeenCalled()
      })

      it('does not set an .up-can-clean class when no functions are passed', function() {
        let element = fixture('.element')

        // This may happen if a compiler returns no value.
        up.destructor(element, undefined)

        expect(element.className).toBe('element')
      })

      it('immediately calls a destructor function if an element has already been detached', async function() {
        let destructorSpy = jasmine.createSpy('destructor function')
        let element = fixture('.element')

        up.destroy(element)
        await wait()

        up.destructor(element, destructorSpy)
        expect(destructorSpy).toHaveBeenCalled()
      })

      it('calls a destructor that is registered while the element is playing its destroy animation', async function() {
        let destructorSpy = jasmine.createSpy('destructor function')
        let element = fixture('.element')

        up.destroy(element, { animation: 'fade-out', duration: 500 })
        await wait(250)

        expect(element).toBeAttached()

        up.destructor(element, destructorSpy)
        await wait(500)

        expect(element).toBeDetached()
        expect(destructorSpy).toHaveBeenCalled()
      })

      it('calls a destructor that is registered while the element is playing its swap transition', async function() {
        let destructorSpy = jasmine.createSpy('destructor function')
        let html = '<div class="element"></div>'
        let element = htmlFixture(html)

        up.render({ fragment: html, transition: 'cross-fade', duration: 500 })
        await wait(250)

        expect(element).toBeAttached()

        up.destructor(element, destructorSpy)
        await wait(500)

        expect(element).toBeDetached()
        expect(destructorSpy).toHaveBeenCalled()
      })

    })

    describe('up.data()', function() {

      describe('when the element has an [up-data] attribute', function() {

        it('parses an object value serialized as JSON', function() {
          const element = fixture('.element', { 'up-data': '{ "foo": 1, "bar": 2 }' })
          const data = up.data(element)

          expect(data).toEqual(jasmine.any(Object))
          expect(Object.keys(data)).toEqual(jasmine.arrayWithExactContents(['foo', 'bar']))
          expect(data.foo).toBe(1)
          expect(data.bar).toBe(2)
        })

        it('allows unquoted property names', function() {
          const element = fixture('.element', { 'up-data': '{ foo: 1, bar: 2 }' })
          const data = up.data(element)

          expect(data).toEqual(jasmine.any(Object))
          expect(Object.keys(data)).toEqual(jasmine.arrayWithExactContents(['foo', 'bar']))
          expect(data.foo).toBe(1)
          expect(data.bar).toBe(2)
        })

        it('parses an array value serialized as JSON', function() {
          const element = fixture('.element', { 'up-data': '["foo", "bar"]' })
          const data = up.data(element)

          expect(data).toEqual(['foo', 'bar'])
        })

        it('parses a string value serialized as JSON', function() {
          const element = fixture('.element', { 'up-data': '"foo"' })
          const data = up.data(element)

          expect(data).toBe('foo')
        })
      })

      describe('when the element has no [up-data] attribute', function() {

        it('returns a blank object', function() {
          const element = fixture('.element')
          const data = up.data(element)

          expect(typeof data).toBe('object')
          expect(Object.keys(data)).toBeBlank()
        })

        it("returns access to the element's vanilla [data-] attributes", function() {
          const element = fixture('.element', { 'data-foo': 'foo value', 'data-bar': 'bar value' })
          const data = up.data(element)

          expect(data.foo).toBe('foo value')
          expect(data.bar).toBe('bar value')
        })

        it('allows to access [data-] attribute with camelCase keys', function() {
          const element = fixture('.element', { 'data-foo-bar': 'value' })
          const data = up.data(element)

          expect(data.fooBar).toBe('value')
        })
      })

      describe('when the element has both an [up-data] and vanilla [data-] attributes', function() {

        it('returns an object with properties from both', function() {
          const element = fixture('.element', { 'data-foo': 'foo value', 'up-data': JSON.stringify({ bar: 'bar value' }) })
          const data = up.data(element)

          expect(data.foo).toBe('foo value')
          expect(data.bar).toBe('bar value')
        })

        it('allows to access [data-] attribute with camelCase keys', function() {
          const element = fixture('.element', { 'data-foo-bar': 'value1', 'up-data': JSON.stringify({ baz: 'value2' }) })
          const data = up.data(element)

          expect(data.fooBar).toBe('value1')
        })

        it('supports the `in` operator', function() {
          const element = fixture('.element', { 'data-foo': 'foo value', 'up-data': JSON.stringify({ bar: 'bar value' }) })
          const data = up.data(element)

          expect('foo' in data).toBe(true)
          expect('bar' in data).toBe(true)
          expect('baz' in data).toBe(false)
        })

        it('supports Object.keys()', function() {
          const element = fixture('.element', { 'data-foo': 'foo value', 'up-data': JSON.stringify({ bar: 'bar value' }) })
          const data = up.data(element)

          expect(Object.keys(data)).toEqual(jasmine.arrayWithExactContents(['foo', 'bar']))
        })

        it('prefers properties from [up-data]', function() {
          const element = fixture('.element', { 'data-foo': 'a', 'up-data': JSON.stringify({ foo: 'b' }) })
          const data = up.data(element)

          expect(data.foo).toBe('b')
        })

        it('allows to override a property from a [data-] attribute', function() {
          const element = fixture('.element', { 'data-foo': 'a', 'up-data': JSON.stringify({ foo: 'b' }) })
          const data = up.data(element)

          data.foo = 'new a'

          expect(data.foo).toBe('new a')
        })

        it('allows to override a property from [up-data]', function() {
          const element = fixture('.element', { 'data-foo': 'a', 'up-data': JSON.stringify({ foo: 'b' }) })
          const data = up.data(element)

          data.foo = 'overridden'

          expect(data.foo).toBe('overridden')
        })

        it('allows to delete a property from a [data-] attribute', function() {
          const element = fixture('.element', { 'data-foo': 'a', 'up-data': JSON.stringify({ bar: 'b' }) })
          const data = up.data(element)

          data.foo = 'overridden'

          expect(data.foo).toBe('overridden')
        })

        it('allows to delete a property from [up-data]', function() {
          const element = fixture('.element', { 'data-foo': 'a', 'up-data': JSON.stringify({ foo: 'b' }) })
          const data = up.data(element)

          delete data.foo

          expect(data.foo).toBeUndefined()
          expect('foo' in data).toBe(false)
        })

        it('allows to delete a property from a [data-] attribute', function() {
          const element = fixture('.element', { 'data-foo': 'a', 'up-data': JSON.stringify({ bar: 'b' }) })
          const data = up.data(element)

          delete data.foo

          expect(data.foo).toBeUndefined()
          expect('foo' in data).toBe(false)
        })
      })

      describe('when the element was compiled with a { data } option', function() {

        it('overrides properties from a [data-] attribute', function() {
          const element = fixture('.element', { 'data-foo': 'a', 'data-bar': 'b' })
          up.hello(element, { data: { bar: 'c' } })

          const data = up.data(element)

          expect(data).toEqual({ foo: 'a', bar: 'c' })
        })

        it('overrides properties from an [up-data] attribute', function() {
          const element = fixture('.element', { 'up-data': JSON.stringify({ foo: 'a', bar: 'b' }) })
          up.hello(element, { data: { bar: 'c' } })

          const data = up.data(element)

          expect(data).toEqual({ foo: 'a', bar: 'c' })
        })
      })

      it('returns an empty object when called with window', function() {
        expect(up.data(window)).toEqual({})
      })

      it('returns an empty object when called with document', function() {
        expect(up.data(document)).toEqual({})
      })

      it('returns the same object for repeated calls, so we can use it as a state store', function() {
        const element = fixture('.element')
        const data1 = up.data(element)
        const data2 = up.data(element)

        expect(data1).toBe(data2)
      })
    })

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

    describe('up.script.clean()', function() {

      it('allows compilers to return a function to call when the compiled element is cleaned', function() {
        const destructor = jasmine.createSpy('destructor')
        up.compiler('.child', (element) => destructor)

        const container = fixture('.container .child')
        up.hello(container)
        expect(destructor).not.toHaveBeenCalled()

        up.script.clean(container)
        expect(destructor).toHaveBeenCalled()
      })

      it('allows compilers to return an array of functions to call when the compiled element is cleaned', function() {
        const destructor1 = jasmine.createSpy('destructor1')
        const destructor2 = jasmine.createSpy('destructor2')
        up.compiler('.child', (element) => [ destructor1, destructor2 ])

        const container = fixture('.container .child')
        up.hello(container)

        up.script.clean(container)

        expect(destructor1).toHaveBeenCalled()
        expect(destructor2).toHaveBeenCalled()
      })

      it('ignores return values that are not functions', function() {
        const destructor1 = jasmine.createSpy('destructor1')
        const destructor2 = jasmine.createSpy('destructor2')
        up.compiler('.child', (element) => [ destructor1, 'nothing', destructor2 ])

        const container = fixture('.container .child')
        up.hello(container)

        up.script.clean(container)

        expect(destructor1).toHaveBeenCalled()
        expect(destructor2).toHaveBeenCalled()
      })

      it('runs all destructors if multiple compilers are applied to the same element', function() {
        const destructor1 = jasmine.createSpy('destructor1')
        up.compiler('.one', (element) => destructor1)
        const destructor2 = jasmine.createSpy('destructor2')
        up.compiler('.two', (element) => destructor2)

        const element = fixture('.one.two')
        up.hello(element)

        up.script.clean(element)

        expect(destructor1).toHaveBeenCalled()
        expect(destructor2).toHaveBeenCalled()
      })

      it('does not throw an error if both container and child have a destructor, and the container gets destroyed', function() {
        up.compiler('.container', (element) => (function() {}))

        up.compiler('.child', (element) => (function() {}))

        const container = fixture('.container .child')

        const clean = () => up.script.clean(container)
        expect(clean).not.toThrowError()
      })

      describe('when a destructor throws an error', function() {

        it('emits an error event but does not throw', async function() {
          const destroyError = new Error("error from crashing destructor")
          const crashingDestructor = function() { throw destroyError }

          const element = fixture('.element')
          up.destructor(element, crashingDestructor)

          await jasmine.expectGlobalError(destroyError, function() {
            const clean = () => up.script.clean(element)
            expect(clean).not.toThrowError()
          })
        })

        it('does not prevent other destructors from running', async function() {
          const destructorBefore = jasmine.createSpy('destructor before')
          const destroyError = new Error("error from crashing destructor")
          const crashingDestructor = function() { throw destroyError }
          const destructorAfter = jasmine.createSpy('destructor after')

          up.compiler('.element', () => destructorBefore)
          up.compiler('.element', () => crashingDestructor)
          up.compiler('.element', () => destructorAfter)

          const element = fixture('.element')
          up.hello(element)

          await jasmine.expectGlobalError(destroyError, () => up.script.clean(element))

          expect(destructorBefore).toHaveBeenCalled()
          expect(destructorAfter).toHaveBeenCalled()
        })
      })
    })

    describe('up.script.findAssets()', function() {

      it('finds a link[rel=stylesheet] in the head', function() {
        const link = fixture(document.head, 'link[rel="stylesheet"][href="/styles.css"]')
        expect(up.script.findAssets()).toContain(link)
      })

      it('does not find a link[rel=stylesheet] in the body', function() {
        const link = fixture(document.body, 'link[rel="stylesheet"][href="/styles.css"]')
        expect(up.script.findAssets()).not.toContain(link)
      })

      it('does not find a link[rel=alternate]', function() {
        const link = fixture(document.body, 'link[rel="alternate"][type="application/rss+xml"][title="RSS Feed"][href="/feed"]')
        expect(up.script.findAssets()).not.toContain(link)
      })

      it('finds a script[src] in the head', function() {
        const script = fixture(document.head, 'script[src="/foo.js"][nonce="specs-nonce"]')
        expect(up.script.findAssets()).toContain(script)
      })

      it('does not find a script[src] in the body', function() {
        const script = fixture(document.body, 'script[src="/foo.js"][nonce="specs-nonce"]')
        expect(up.script.findAssets()).not.toContain(script)
      })

      it('does not find an inline script in the head', function() {
        const script = fixture(document.head, 'script', { text: 'console.log("hello from inline script")', nonce: 'specs-nonce' })
        expect(up.script.findAssets()).not.toContain(script)
      })

      it('finds an arbitrary element in the head with [up-asset]', function() {
        const base = fixture(document.head, 'base[href="/pages"]')
        expect(up.script.findAssets()).toEqual([])

        base.setAttribute('up-asset', '')
        expect(up.script.findAssets()).toEqual([base])
      })

      it('allows to opt out with [up-asset=false]', function() {
        const link = fixture(document.head, 'link[rel="stylesheet"][href="/styles.css"][up-asset="false"]')
        expect(up.script.findAssets()).not.toContain(link)
      })

      it('allows to opt out by configuring up.script.config.noAssetSelectors', function() {
        const link = fixture(document.head, 'link[rel="stylesheet"][href="/excluded.css"]')
        up.script.config.noAssetSelectors.push('link[href="/excluded.css"]')
        expect(up.script.findAssets()).not.toContain(link)
      })
    })

    fdescribe('up.script.cspNonce()', function() {

      beforeEach(function() {
        // Remove the CSP meta to start with a clean slate.
        // This change will be undone by protect_jasmine_runner.js
        this.runnerCSPMeta = document.querySelector('meta[name=csp-nonce]')
        this.runnerCSPMeta.remove()
      })

      it('returns undefined if the <head> has no <meta name="csp-nonce>"', function() {
        expect(document.head).not.toHaveSelector('meta[name="csp-nonce"]')
        expect(up.script.cspNonce()).toBeUndefined()
      })

      it('returns the content from a <meta name="csp-nonce">', function() {
        up.element.affix(document.head, 'meta[name="csp-nonce"][content="custom-nonce"]')
        expect(up.script.cspNonce()).toBe('custom-nonce')
      })

      it('returns a string assigned to up.script.config.cspNonce', function() {
        up.element.affix(document.head, 'meta[name="csp-nonce"][content="ignored-nonce"]')
        up.script.config.cspNonce = 'config-nonce'
        expect(up.script.cspNonce()).toBe('config-nonce')
      })

      it('evals a function assigned to up.script.config.cspNonce', function() {
        up.element.affix(document.head, 'meta[name="csp-nonce"][content="ignored-nonce"]')
        up.script.config.cspNonce = () => 'function-nonce'
        expect(up.script.cspNonce()).toBe('function-nonce')
      })

    })

    fdescribe('up.script.warnOfUnsafeCSP()', function() {

      let warnSpy

      beforeEach(function() {
        warnSpy = spyOn(console, 'warn').and.callThrough()
      })

      const CSP_PRESETS = {
        'host-based': "script-src 'self' https://api.com",
        'nonce-only':  "script-src 'nonce-secret111'",
        'strict-dynamic': "script-src 'nonce-secret111' 'strict-dynamic'",
        'unsafe-inline': "script-src 'unsafe-inline'",
        'unsafe-eval': "script-src 'unsafe-eval'",
      }

      describe('unexpectedly liberal script execution', function() {

        const warnArgs = [jasmine.stringContaining("A 'strict-dynamic' CSP allows arbitrary <script> elements in new fragments"), jasmine.anything(), jasmine.anything()]

        function itWarnsFor(cspName) {
          const cspString = CSP_PRESETS[cspName] ?? up.fail('Unknown CSP preset' + cspName)

          it(`warns with a ${cspName} CSP`, function() {
            let cspInfo = up.CSPInfo.fromHeader(cspString)
            up.script.warnOfUnsafeCSP(cspInfo)
            expect(warnSpy).toHaveBeenCalledWith(...warnArgs)
          })
        }

        function itDoesNotWarnFor(cspName) {
          const cspString = CSP_PRESETS[cspName] ?? up.fail('Unknown CSP preset' + cspName)

          it(`does not warn with a ${cspName} CSP`, function() {
            let cspInfo = up.CSPInfo.fromHeader(cspString)
            up.script.warnOfUnsafeCSP(cspInfo)
            expect(warnSpy).not.toHaveBeenCalledWith(...warnArgs)
          })
        }

        describe('with up.script.config.scriptElementPolicy = "block"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "block"
          })

          itDoesNotWarnFor('host-based')
          itDoesNotWarnFor('nonce-only')
          itDoesNotWarnFor('strict-dynamic')
          itDoesNotWarnFor('unsafe-inline')

        })

        describe('with up.script.config.scriptElementPolicy = "nonce"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "nonce"
          })

          itDoesNotWarnFor('host-based')
          itDoesNotWarnFor('nonce-only')
          itDoesNotWarnFor('strict-dynamic')
          itDoesNotWarnFor('unsafe-inline')

        })

        describe('with up.script.config.scriptElementPolicy = "pass"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "pass"
          })

          itDoesNotWarnFor('host-based')
          itDoesNotWarnFor('nonce-only')
          itWarnsFor('strict-dynamic')
          itDoesNotWarnFor('unsafe-inline')

        })

        describe('with up.script.config.scriptElementPolicy = "auto"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "auto"
          })

          itDoesNotWarnFor('host-based')
          itDoesNotWarnFor('nonce-only')
          itDoesNotWarnFor('strict-dynamic') // detected and sitches to "nonce"
          itDoesNotWarnFor('unsafe-inline')

        })

      })

      describe('unexpectedly liberal callback execution', function() {

        const warnArgs = [jasmine.stringContaining("An 'unsafe-eval' CSP allows arbitrary [up-on...] callbacks"), jasmine.anything(), jasmine.anything()]

        function itWarnsFor(cspName) {
          const cspString = CSP_PRESETS[cspName] ?? up.fail('Unknown CSP preset' + cspName)

          it(`warns with a ${cspName} CSP`, function() {
            let cspInfo = up.CSPInfo.fromHeader(cspString)
            up.script.warnOfUnsafeCSP(cspInfo)
            expect(warnSpy).toHaveBeenCalledWith(...warnArgs)
          })
        }

        function itDoesNotWarnFor(cspName) {
          const cspString = CSP_PRESETS[cspName] ?? up.fail('Unknown CSP preset' + cspName)

          it(`does not warn with a ${cspName} CSP`, function() {
            let cspInfo = up.CSPInfo.fromHeader(cspString)
            up.script.warnOfUnsafeCSP(cspInfo)
            expect(warnSpy).not.toHaveBeenCalledWith(...warnArgs)
          })
        }

        describe('with up.script.config.evalCallbackPolicy = "block"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "block"
          })

          itDoesNotWarnFor('host-based')
          itDoesNotWarnFor('nonce-only')
          itDoesNotWarnFor('strict-dynamic')
          itDoesNotWarnFor('unsafe-eval')
          itDoesNotWarnFor('unsafe-inline')

        })

        describe('with up.script.config.evalCallbackPolicy = "nonce"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "nonce"
          })

          itDoesNotWarnFor('host-based')
          itDoesNotWarnFor('nonce-only')
          itDoesNotWarnFor('strict-dynamic')
          itDoesNotWarnFor('unsafe-eval')
          itDoesNotWarnFor('unsafe-inline')

        })

        describe('with up.script.config.evalCallbackPolicy = "pass"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "pass"
          })

          itDoesNotWarnFor('host-based')
          itDoesNotWarnFor('nonce-only')
          itDoesNotWarnFor('strict-dynamic')
          itWarnsFor('unsafe-eval')
          itDoesNotWarnFor('unsafe-inline')

        })

        describe('with up.script.config.evalCallbackPolicy = "auto"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "auto"
          })

          describe('when the page nonce is known', function() {
            beforeEach(function() {
              spyOn(up.script, 'cspNonce').and.returnValue('secret000')
            })

            itDoesNotWarnFor('host-based')
            itDoesNotWarnFor('nonce-only')
            itDoesNotWarnFor('strict-dynamic')
            itDoesNotWarnFor('unsafe-eval') // we auto-switch to "nonce"
            itDoesNotWarnFor('unsafe-inline')

          })

          describe('when the page nonce is not known', function() {
            beforeEach(function() {
              spyOn(up.script, 'cspNonce').and.returnValue(undefined)
            })

            itDoesNotWarnFor('host-based')
            itDoesNotWarnFor('nonce-only')
            itDoesNotWarnFor('strict-dynamic')
            itWarnsFor('unsafe-eval')
            itDoesNotWarnFor('unsafe-inline')

          })

        })
        
      })

    })

    fdescribe('up.script.adoptNewFragment()', function() {

      describe('CSP nonces in body scripts', function() {

        function itBehavesLikeBlock({ pageNonce } = {}) {

          describe(`when the page nonce is ${pageNonce ? 'known' : 'not known'}`, function() {

            beforeEach(function() {
              up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
            })

            it('blocks a script element without nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const script = up.element.createFromSelector('script')
              expect(script).toBeActiveScript()

              up.script.adoptNewFragment(script, cspInfo)

              expect(script).toBeInertScript()
            })

            it('blocks a script element with the correct page nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const script = up.element.createFromSelector('script[nonce="response123"]')
              expect(script).toBeActiveScript()

              up.script.adoptNewFragment(script, cspInfo)

              expect(script).toBeInertScript()
            })

            it('blocks a script element with an incorrect nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const script = up.element.createFromSelector('script[nonce="wrong456"]')
              expect(script).toBeActiveScript()

              up.script.adoptNewFragment(script, cspInfo)

              expect(script).toBeInertScript()
            })

            it('does not change a script element with a non-JavaScript type', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const script = up.element.createFromSelector('script[type="text/ramenscript"]', { text: 'console.log("hello")' })
              const scriptHTMLBefore = script.outerHTML

              up.script.adoptNewFragment(script, cspInfo)

              expect(script.outerHTML).toEqual(scriptHTMLBefore)
            })

          })

        }

        function itBehavesLikePass({ strictDynamic } = {}) {

          describe(`when the CSP is ${strictDynamic ? 'strict-dynamic' : 'not strict-dynamic'}`, function() {

            beforeEach(function() {
              let strictDynamicPart = up.util.assert(strictDynamic, up.util.isBoolean) ? "'strict-dynamic'" : ""
              this.cspInfo ??= up.CSPInfo.fromHeader(`script-src 'self' 'nonce-response111' ${strictDynamicPart}`)
            })

            it('does not change a script element without a [nonce]', function() {
              spyOn(up.script, 'cspNonce').and.returnValue('page000')

              const script = up.element.createFromSelector('script', { text: 'console.log("hello")' })
              const scriptHTMLBefore = script.outerHTML

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script).toBeActiveScript()
              expect(script.outerHTML).toEqual(scriptHTMLBefore)
            })

            it("does not change am inline script element when its [nonce] doesn't match the response nonce", function() {
              spyOn(up.script, 'cspNonce').and.returnValue('page000')

              const script = up.element.createFromSelector('script', { nonce: 'incorrect456', text: 'console.log("hello")' })
              const scriptHTMLBefore = script.outerHTML

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script).toBeActiveScript()
              expect(script.outerHTML).toEqual(scriptHTMLBefore)
            })

            it('does not add a [nonce] to linked, un-nonced script, as that might bypass a host-based CSP (bugfix)', async function() {
              spyOn(up.script, 'cspNonce').and.returnValue('page000')

              const script = up.element.createFromSelector('script', { src: up.specUtil.staticFile('linked_noop_script.js') })
              const scriptHTMLBefore = script.outerHTML

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script).toBeActiveScript()
              expect(script.outerHTML).toEqual(scriptHTMLBefore)
            })

            it("rewrites the [nonce] of a body script when it matches the response nonce", async function() {
              spyOn(up.script, 'cspNonce').and.returnValue('page000')

              const script = up.element.createFromSelector('script', { nonce: 'response111', text: 'console.log("hello")' })

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script).toBeActiveScript()
              expect(script).toHaveProperty('nonce', 'page000')
            })

            it('does not change a script element with an correct nonce, but the page nonce is unknown', function() {
              spyOn(up.script, 'cspNonce').and.returnValue(undefined)

              const script = up.element.createFromSelector('script', { nonce: 'response111', text: 'console.log("hello")' })
              const scriptHTMLBefore = script.outerHTML

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script).toBeActiveScript()
              expect(script.outerHTML).toEqual(scriptHTMLBefore)
            })

            it('does not change a script element with a non-JavaScript type', function() {
              const script = up.element.createFromSelector('script[type="text/ramenscript"]', { text: 'console.log("hello")' })
              const scriptHTMLBefore = script.outerHTML

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script.outerHTML).toEqual(scriptHTMLBefore)
            })
          })

        }

        function itBehavesLikeNonce({ strictDynamic } = {}) {

          describe(`when the CSP is ${strictDynamic ? 'strict-dynamic' : 'not strict-dynamic'}`, function() {

            beforeEach(function() {
              let strictDynamicPart = up.util.assert(strictDynamic, up.util.isGiven) ? "'strict-dynamic'" : ""
              this.cspInfo ??= up.CSPInfo.fromHeader(`script-src 'self' 'nonce-response111' ${strictDynamicPart}`)
            })

            it('blocks a script element without nonce', function() {
              spyOn(up.script, 'cspNonce').and.returnValue('page000')
              const script = up.element.createFromSelector('script')
              expect(script).toBeActiveScript()

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script).toBeInertScript()
            })

            it('rewrites a script element nonce that matches its response', function() {
              spyOn(up.script, 'cspNonce').and.returnValue('page000')
              const script = up.element.createFromSelector('script[nonce="response111"]')
              expect(script).toBeActiveScript()

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script).toBeActiveScript()
              expect(script).toHaveProperty('nonce', 'page000')
            })

            it('blocks a script element whose nonce that matches its response, but the page nonce is unknown', function() {
              spyOn(up.script, 'cspNonce').and.returnValue(undefined)
              const script = up.element.createFromSelector('script[nonce="response111"]')
              expect(script).toBeActiveScript()

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script).toBeInertScript()
            })

            it('blocks a script element with an incorrect nonce', function() {
              spyOn(up.script, 'cspNonce').and.returnValue('page000')
              const script = up.element.createFromSelector('script[nonce="wrong222"]')
              expect(script).toBeActiveScript()

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script).toBeInertScript()
            })

            it('does not change a script element with a non-JavaScript type', function() {
              spyOn(up.script, 'cspNonce').and.returnValue('page000')
              const script = up.element.createFromSelector('script[type="text/ramenscript"]', { text: 'console.log("hello")' })
              const scriptHTMLBefore = script.outerHTML

              up.script.adoptNewFragment(script, this.cspInfo)

              expect(script.outerHTML).toEqual(scriptHTMLBefore)
            })
          })

        }

        describe('with up.script.config.scriptElementPolicy = "block"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "block"
          })

          itBehavesLikeBlock({ pageNonce: 'page000' })
          itBehavesLikeBlock({ pageNonce: null })

        })

        describe('with up.script.config.scriptElementPolicy = "pass"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "pass"
          })

          itBehavesLikePass({ strictDynamic: false })

          itBehavesLikePass({ strictDynamic: true })
        })

        describe('with up.script.config.scriptElementPolicy = "nonce"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "nonce"
          })

          describe('when the page nonce is known', function() {
            itBehavesLikeNonce({ strictDynamic: false })
          })

          describe('when the page nonce is unknown', function() {
            itBehavesLikeBlock({ pageNonce: null })
          })

        })

        describe('with up.script.config.scriptElementPolicy = "auto"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "auto"
          })

          describe('without a strict-dynamic CSP', function() {
            itBehavesLikePass({ strictDynamic: false })
          })

          describe('with a strict-dynamic CSP', function() {
            itBehavesLikeNonce({ strictDynamic: true })
          })

          // it('rewrites the [nonce] of a body script with Content-Security-Policy-Report-Only response header', async function() {
          //   spyOn(up.script, 'cspNonce').and.returnValue('page-secret')
          //
          //   let [target] = htmlFixtureList(`
          //     <div id="target">
          //       old target text
          //     </div>
          //   `)
          //
          //   up.render('#target', { url: '/path' })
          //   await wait()
          //
          //   jasmine.respondWith({
          //     responseText: `
          //       <div id="target">
          //         new target text
          //         <script nonce="response-secret"></script>
          //       </div>
          //     `,
          //     responseHeaders: { 'Content-Security-Policy-Report-Only': "script-src 'nonce-response-secret'" }
          //   })
          //   await wait()
          //
          //   expect('#target').toHaveVisibleText('new target text')
          //   expect('#target script').toHaveProperty('nonce', 'page-secret')
          // })

        })

        if (up.migrate.loaded) {

          describe('with up.fragment.config.runScripts = true', function() {

            beforeEach(function() {
              up.fragment.config.runScripts = true
            })

            describe('without a strict-dynamic CSP', function() {
              itBehavesLikePass({ strictDynamic: false })
            })

            describe('with a strict-dynamic CSP', function() {
              itBehavesLikeNonce({ strictDynamic: true })
            })

          })

          describe('up.fragment.config.runScripts = false', function() {

            beforeEach(function() {
              up.fragment.config.runScripts = false
            })

            itBehavesLikeBlock({ pageNonce: 'page000' })
            itBehavesLikeBlock({ pageNonce: null })

          })


        }

      })

      describe('CSP nonces in callback attributes', function() {

        function itBehavesLikeBlock({ pageNonce } = {}) {
          describe(`when the page nonce is ${pageNonce ? 'known' : 'unknown'}`, function() {

            beforeEach(function() {
              up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
            })

            it('blocks a callback without nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const link = up.element.createFromHTML(`
                <a href="/foo" up-follow up-on-loaded="console.log('hi')"></a>              
              `)

              expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()

              up.script.adoptNewFragment(link, cspInfo)

              expect(link.getAttribute('up-on-loaded')).toBeInertCallbackString()
            })

            it('blocks a callback with the correct nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const link = up.element.createFromHTML(`
                <a href="/foo" up-follow up-on-loaded="nonce-response123 console.log('hi')"></a>              
              `)

              expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()

              up.script.adoptNewFragment(link, cspInfo)

              expect(link.getAttribute('up-on-loaded')).toBeInertCallbackString()
            })

            it('blocks a callback with an incorrect nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const link = up.element.createFromHTML(`
                <a href="/foo" up-follow up-on-loaded="nonce-wrong456 console.log('hi')"></a>              
              `)

              expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()

              up.script.adoptNewFragment(link, cspInfo)

              expect(link.getAttribute('up-on-loaded')).toBeInertCallbackString()
            })

          })
        }

        function itBehavesLikePass({ pageNonce } = {}) {

          describe(`when the page nonce is ${pageNonce ? 'known' : 'unknown'}`, function() {
            beforeEach(function() {
              up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
            })

            it('does not change a callback without a nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const link = up.element.createFromHTML(`
              <a href="/foo" up-follow up-on-loaded="console.log('hi')"></a>              
            `)

              up.script.adoptNewFragment(link, cspInfo)

              expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()
              expect(link.getAttribute('up-on-loaded')).toBe("console.log('hi')")
            })

            it('does not change a callback with an incorrect nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const link = up.element.createFromHTML(`
              <a href="/foo" up-follow up-on-loaded="nonce-wrong456 console.log('hi')"></a>              
            `)

              up.script.adoptNewFragment(link, cspInfo)

              expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()
              expect(link.getAttribute('up-on-loaded')).toBe("nonce-wrong456 console.log('hi')")
            })

            if (pageNonce) {

              it('rewrites a correct callback nonce', function() {
                const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
                const link = up.element.createFromHTML(`
                <a href="/foo" up-follow up-on-loaded="nonce-response123 console.log('hi')"></a>              
              `)

                up.script.adoptNewFragment(link, cspInfo)

                expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()
                expect(link.getAttribute('up-on-loaded')).toBe("nonce-page000 console.log('hi')")
              })

            } else {

              it('does not rewrite a correct callback nonce', function() {
                const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
                const link = up.element.createFromHTML(`
                <a href="/foo" up-follow up-on-loaded="nonce-response123 console.log('hi')"></a>              
              `)

                up.script.adoptNewFragment(link, cspInfo)

                expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()
                expect(link.getAttribute('up-on-loaded')).toBe("nonce-response123 console.log('hi')")
              })

            }
          })

        }

        function itBehavesLikeNonce({ pageNonce } = {}) {
          describe(`when the page nonce is ${pageNonce ? 'known' : 'unknown'}`, function() {

            beforeEach(function() {
              up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
            })

            it('blocks a callback without nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const link = up.element.createFromHTML(`
              <a href="/foo" up-follow up-on-loaded="console.log('hi')"></a>              
            `)

              expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()

              up.script.adoptNewFragment(link, cspInfo)

              expect(link.getAttribute('up-on-loaded')).toBeInertCallbackString()
            })

            it('blocks a callback with an incorrect nonce', function() {
              const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
              const link = up.element.createFromHTML(`
              <a href="/foo" up-follow up-on-loaded="nonce-wrong456 console.log('hi')"></a>              
            `)

              expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()

              up.script.adoptNewFragment(link, cspInfo)

              expect(link.getAttribute('up-on-loaded')).toBeInertCallbackString()
            })

            if (pageNonce) {
              it('rewrites a callback nonce that matches its response', function() {
                const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
                const link = up.element.createFromHTML(`
              <a href="/foo" up-follow up-on-loaded="nonce-response123 console.log('hi')"></a>              
            `)

                expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()

                up.script.adoptNewFragment(link, cspInfo)

                expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()
                expect(link.getAttribute('up-on-loaded')).toBe("nonce-page000 console.log('hi')")
              })
            } else {
              it('blocks a callback whose nonce matches its response', function() {
                spyOn(up.script, 'cspNonce').and.returnValue(undefined)
                const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response123'")
                const link = up.element.createFromHTML(`
              <a href="/foo" up-follow up-on-loaded="nonce-response123 console.log('hi')"></a>              
            `)

                expect(link.getAttribute('up-on-loaded')).toBeActiveCallbackString()

                up.script.adoptNewFragment(link, cspInfo)

                expect(link.getAttribute('up-on-loaded')).toBeInertCallbackString()
              })
            }

          })

        }

        describe('with up.script.config.evalCallbackPolicy = "block"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "block"
          })

          itBehavesLikeBlock({ pageNonce: 'page000' })
          itBehavesLikeBlock({ pageNonce: null })

        })

        describe('with up.script.config.evalCallbackPolicy = "pass"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "pass"
          })

          itBehavesLikePass({ pageNonce: 'page000' })
          itBehavesLikePass({ pageNonce: null })

        })

        describe('with up.script.config.evalCallbackPolicy = "nonce"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "nonce"
          })

          describe('when the page nonce is known', function() {
            itBehavesLikeNonce({ pageNonce: 'page000' })
          })

          describe('when the page nonce is not known', function() {
            itBehavesLikeBlock({ pageNonce: null })
          })

        })

        describe('with up.script.config.evalCallbackPolicy = "auto"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "auto"
            up.script.config.nonceableAttributes.push('callback')
          })

          describe('when the page nonce is known', function() {

            itBehavesLikeNonce({ pageNonce: 'page000' })

            // it("rewrites nonceable callbacks to use the current page's nonce with Content-Security-Policy-Report-Only response header", async function() {
            //   spyOn(up.script, 'cspNonce').and.returnValue('secret1')
            //   fixture('.target')
            //   up.render('.target', { url: '/path' })
            //
            //   await wait()
            //
            //   jasmine.respondWith({
            //     responseText: `
            //       <div class="target" callback="nonce-secret2 alert()">new text</div>
            //     `,
            //     responseHeaders: { 'Content-Security-Policy-Report-Only': "script-src 'nonce-secret2'" }
            //   })
            //
            //   await wait()
            //
            //   expect('.target').toHaveText('new text')
            //   expect('.target').toHaveAttribute('callback', "nonce-secret1 alert()")
            // })
  
            // it("rewrites nonceable callbacks to use the current page's nonce when opening a new overlay (bugfix)", async function() {
            //   spyOn(up.script, 'cspNonce').and.returnValue('secret1')
            //   up.render('.target', { url: '/path', layer: 'new' })
            //
            //   await wait()
            //
            //   jasmine.respondWith({
            //     responseText: `
            //       <div class="target" callback="nonce-secret2 alert()">new text</div>
            //     `,
            //     responseHeaders: { 'Content-Security-Policy': "script-src 'nonce-secret2'" }
            //   })
            //
            //   await wait()
            //
            //   expect(up.layer.isOverlay()).toBe(true)
            //
            //   expect('.target').toHaveText('new text')
            //   expect('.target').toHaveAttribute('callback', "nonce-secret1 alert()")
            // })

            // it("ensures nonced callbacks still match the current page's nonce after a render pass that updates history (meta tags are part of history state) (bugfix)", async function() {
            //   let suiteMeta = document.querySelector('meta[name="csp-nonce"]')
            //   suiteMeta.remove()
            //
            //   up.element.affix(document.head, 'meta#test-nonce[name="csp-nonce"][content="nonce-secret1"]')
            //   expect(up.script.cspNonce()).toBe('nonce-secret1')
            //
            //   const element = fixture('.element', { callback: 'nonce-secret1 alert()' })
            //   fixture('.target', { text: 'old text' })
            //
            //   up.render('.target', { url: '/path', history: true })
            //
            //   await wait()
            //
            //   jasmine.respondWith({
            //     responseHeaders: { 'Content-Security-Policy': "script-src 'nonce-secret2'" },
            //     responseText: `
            //       <html>
            //         <head>
            //           <meta id="test-nonce" name="csp-nonce" content="nonce-secret2">
            //         </head>
            //         <body>
            //           <div class="target">
            //             new text
            //           </div>
            //         </body>
            //       </html>
            //     `
            //   })
            //
            //   await wait()
            //
            //   const currentPageNonce = up.script.cspNonce()
            //   expect(element.getAttribute('callback')).toBe(`${currentPageNonce} alert()`)
            // })
  
          })

          describe('when the page nonce is not known', function() {

            itBehavesLikePass({ pageNonce: null })

          })

        })

      })

    })

    fdescribe('up.script.adoptDetachedHeadAsset()', function() {

      function itBehavesLikeExamples() {

        describe('scripts', function() {

          it('rewrites a matching [nonce]', function() {
            spyOn(up.script, 'cspNonce').and.returnValue('page000')

            const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response111'")
            const script = up.element.createFromSelector('script[nonce="response111"][src="external.js"]')
            up.script.adoptDetachedHeadAsset(script, cspInfo)

            expect(script).toHaveProperty('nonce', 'page000')
          })

          it('does not rewrite a non-matching [nonce]', function() {
            spyOn(up.script, 'cspNonce').and.returnValue('page000')

            const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response111'")
            const script = up.element.createFromSelector('script[nonce="wrong222"][src="external.js"]')
            up.script.adoptDetachedHeadAsset(script, cspInfo)

            expect(script).toHaveProperty('nonce', 'wrong222')
          })

          it('does not rewrite a matching [nonce] when the page nonce is not known', function() {
            spyOn(up.script, 'cspNonce').and.returnValue(undefined)

            const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response111'")
            const script = up.element.createFromSelector('script[nonce="response111"][src="external.js"]')
            up.script.adoptDetachedHeadAsset(script, cspInfo)

            expect(script).toHaveProperty('nonce', 'response111')
          })

          it('does not change an element without a [nonce] attribute', function() {
            spyOn(up.script, 'cspNonce').and.returnValue('page000')

            const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response111'")
            const script = up.element.createFromSelector('script[src="external.js"]')
            const scriptHTMLBefore = script.outerHTML
            up.script.adoptDetachedHeadAsset(script, cspInfo)

            expect(script.nonce).toBeBlank()
            expect(script.outerHTML).toEqual(scriptHTMLBefore)
          })

        })

        describe('inline styles (not supported)', function() {

          it('does not rewrite the [nonce] of inline <style> elements using the script-src nonce', function() {
            spyOn(up.script, 'cspNonce').and.returnValue('page000')

            const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response111'")
            const style = up.element.createFromSelector('style[nonce="response111"]')
            up.script.adoptDetachedHeadAsset(style, cspInfo)

            expect(style).toHaveProperty('nonce', 'response111')
          })

        })

        it('does not trigger up:assets:changed if a script elements is identical after the [nonce] was rewritten', async function() {
          spyOn(up.script, 'cspNonce').and.returnValue('page000')
          const listener = jasmine.createSpy('up:assets:changed listener')
          up.on('up:assets:changed', listener)

          // TODO: Remove "linked_" prefix from both files
          let scriptPath = up.specUtil.staticFile('linked_noop_script.js')

          let targetHTML = (version) => `
            <div id="target">
              target v${version}
            </div>
          `

          let respond = (nonce, targetVersion) => {
            jasmine.respondWith({
              responseText: `
                <html>
                  <head>
                    <script src='${scriptPath}' nonce="${nonce}"></script>
                  </head>
                  <body>
                    ${targetHTML(targetVersion)}
                  </body>
                </html>
              `,
              responseHeaders: {
                'Content-Security-Policy': `script-src 'nonce-${nonce}'`
              }
            })
          }

          let [target] = htmlFixtureList(targetHTML(0))
          expect('#target').toHaveVisibleText('target v0')

          up.render({ target: '#target', url: '/path1' })
          await wait()

          respond('response111', 1)

          await wait()

          expect('#target').toHaveVisibleText('target v1')
          expect(listener.calls.count()).toBe(1)
          const event = listener.calls.mostRecent().args[0]
          expect(event.newAssets.length).toBe(1)
          const newScript = event.newAssets[0]
          expect(newScript).toMatchSelector(`script[src="${scriptPath}"]`)
          expect(newScript).toHaveProperty('nonce', 'page000')

          // Insert the remote script
          document.head.append(newScript)

          up.render({ target: '#target', url: '/path2' })
          await wait()

          respond('response222', 2)
          await wait()

          expect('#target').toHaveVisibleText('target v2')

          // No additional up:assets:changed event
          expect(listener.calls.count()).toBe(1)

          // Head assets are cleaned up automatically, but let's be good citizens
          newScript.remove()
        })
      }

      fdescribe('CSP nonces in head assets', function() {

        itBehavesLikeExamples()

        describe("scriptElementPolicy only controlling body scripts (and we don't want blocking policies to cause up:assets:changed with every render pass)", function() {

          describe('with up.script.config.scriptElementPolicy = "block"', function() {

            beforeEach(function() {
              up.script.config.scriptElementPolicy = "block"
            })

            itBehavesLikeExamples()
          })

          describe('with up.script.config.scriptElementPolicy = "nonce"', function() {

            beforeEach(function() {
              up.script.config.scriptElementPolicy = "nonce"
            })

            itBehavesLikeExamples()
          })

        })

      })

    })

    fdescribe('adoptRenderOptionsFromHeader()', function() {

      describe('CSP nonces in a JSON of render options', function() {

        beforeEach(function() {
          window.callbackSpy = jasmine.createSpy('callback spy')
        })

        afterEach(function() {
          delete window.callbackSpy
        })

        function itBehavesLikeNonce({ pageNonce } = {}) {

          describe(`when the page nonce is ${pageNonce ? 'known' : 'unknown'}`, function() {

            beforeEach(function() {
              up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
              this.cspInfo ??= up.CSPInfo.fromHeader(`script-src 'self' 'nonce-response111'`)
            })

            it('returns a throwing function for a callback without nonce', function() {
              let code = 'window.callbackSpy()'
              let renderOptions = { onLoaded: code }
              up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
              let fn = renderOptions.onLoaded
              expect(fn).toThrowError(up.Blocked)
              expect(window.callbackSpy).not.toHaveBeenCalled()
            })

            it('returns an executable function for a callback with the correct nonce', function() {
              let code = 'nonce-specs-nonce window.callbackSpy()'
              let renderOptions = { onLoaded: code }
              up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
              let fn = renderOptions.onLoaded
              expect(fn).not.toThrowError(up.Blocked)
              expect(window.callbackSpy).toHaveBeenCalled()
            })

            it('returns a throwing function for a callback with an incorrect nonce', function() {
              let code = 'nonce-wrong222 window.callbackSpy()'
              let renderOptions = { onLoaded: code }
              up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
              let fn = renderOptions.onLoaded
              expect(fn).toThrowError(up.Blocked)
              expect(window.callbackSpy).not.toHaveBeenCalled()
            })

          })

        }

        function itBehavesLikeBlock({ pageNonce } = {}) {

          describe(`when the page nonce is ${pageNonce ? 'known' : 'unknown'}`, function() {

            beforeEach(function() {
              up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
            })

            it('returns a throwing function for a callback without nonce', function() {
              let code = 'window.callbackSpy()'
              let renderOptions = { onLoaded: code }
              up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
              let fn = renderOptions.onLoaded
              expect(fn).toThrowError(up.Blocked)
              expect(window.callbackSpy).not.toHaveBeenCalled()
            })

            it('returns a throwing function a callback with the correct nonce', function() {
              let code = 'nonce-specs-nonce window.callbackSpy()'
              let renderOptions = { onLoaded: code }
              up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
              let fn = renderOptions.onLoaded
              expect(fn).toThrowError(up.Blocked)
              expect(window.callbackSpy).not.toHaveBeenCalled()
            })

            it('returns a throwing function a callback with the correct nonce, but the page nonce is not known to Unpoly', function() {
              spyOn(up.script, 'cspNonce').and.returnValue(undefined)
              let code = 'nonce-specs-nonce window.callbackSpy()'
              let renderOptions = { onLoaded: code }
              up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
              let fn = renderOptions.onLoaded
              expect(fn).toThrowError(up.Blocked)
              expect(window.callbackSpy).not.toHaveBeenCalled()
            })

            it('returns a throwing function for a callback with an incorrect nonce', function() {
              spyOn(up.script, 'cspNonce').and.returnValue(undefined)
              let code = 'nonce-wrong222 window.callbackSpy()'
              let renderOptions = { onLoaded: code }
              up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
              let fn = renderOptions.onLoaded
              expect(fn).toThrowError(up.Blocked)
              expect(window.callbackSpy).not.toHaveBeenCalled()
            })

          })

        }

        function itBehavesLikePass({ pageNonce } = {}) {

          describe(`when the page nonce is ${pageNonce ? 'known' : 'unknown'}`, function() {

            beforeEach(function() {
              up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
            })

            it('returns an executable function for a callback with the correct nonce', function() {
              let code = 'nonce-specs-nonce window.callbackSpy()'
              let renderOptions = { onLoaded: code }
              up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
              let fn = renderOptions.onLoaded
              expect(fn).not.toThrowError(up.Blocked)
              expect(window.callbackSpy).toHaveBeenCalled()
            })

            if (specs.config.csp === 'none') {
              it('returns an executable function for a callback without a nonce', function() {
                let code = 'window.callbackSpy()'
                let renderOptions = { onLoaded: code }
                up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
                let fn = renderOptions.onLoaded
                expect(fn).not.toThrowError(up.Blocked)
                expect(window.callbackSpy).toHaveBeenCalled()
              })
            }

            if (specs.config.csp === 'nonce-only') {
              it('returns a throwing function for a callback without a nonce', function() {
                let code = 'window.callbackSpy()'
                let renderOptions = { onLoaded: code }
                up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
                let fn = renderOptions.onLoaded
                expect(fn).toThrowError(up.Blocked) // new Function() throws EvalError internally
                expect(window.callbackSpy).not.toHaveBeenCalled()
              })

              it('returns a noop function for a callback with an incorrect nonce', function() {
                let code = 'nonce-wrong222 window.callbackSpy()'
                let renderOptions = { onLoaded: code }
                up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
                let fn = renderOptions.onLoaded
                // We would prefer to detect the violation and throw up.Blocked here.
                // Unfortunately the securitypolicyviolation event is emitted async after our eval,
                // and we don't want to be async ourselves.
                fn()
                expect(window.callbackSpy).not.toHaveBeenCalled()
              })

              if (!pageNonce) {
                it('returns an executable function for a callback with a correct nonce, but the page nonce is not known to Unpoly', function() {
                  spyOn(up.script, 'cspNonce').and.returnValue(undefined)
                  let code = 'nonce-specs-nonce window.callbackSpy()'
                  let renderOptions = { onLoaded: code }
                  up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
                  let fn = renderOptions.onLoaded
                  expect(fn).not.toThrowError(up.Blocked)
                  expect(window.callbackSpy).toHaveBeenCalled()
                })
              }
            }

          })

        }

        describe('with up.script.config.evalCallbackPolicy = "block"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "block"
          })

          itBehavesLikeBlock({ pageNonce: 'specs-nonce' })
          itBehavesLikeBlock({ pageNonce: null })

        })

        describe('with up.script.config.evalCallbackPolicy = "pass"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "pass"
          })

          itBehavesLikePass({ pageNonce: 'specs-nonce' })
          itBehavesLikePass({ pageNonce: null })

        })

        describe('with up.script.config.evalCallbackPolicy = "nonce"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "nonce"
          })

          itBehavesLikeNonce({ pageNonce: 'specs-nonce' })
          itBehavesLikeBlock({ pageNonce: null })

        })

        describe('with up.script.config.evalCallbackPolicy = "auto"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "auto"
          })

          itBehavesLikeNonce({ pageNonce: 'specs-nonce' })
          itBehavesLikePass({ pageNonce: null })

        })



        // describe('with up.script.config.evalCallbackPolicy = "block"', function() {
        //
        //   beforeEach(function() {
        //     up.script.config.evalCallbackPolicy = "block"
        //   })
        //
        //   it('blocks a callback without nonce')
        //
        //   it('blocks a callback with the correct nonce')
        //
        //   it('blocks a callback with an incorrect nonce')
        //
        // })
        //
        // describe('with up.script.config.evalCallbackPolicy = "pass"', function() {
        //
        //   beforeEach(function() {
        //     up.script.config.evalCallbackPolicy = "pass"
        //   })
        //
        //   it('rewrites a correct callback nonce')
        //
        //   it('does not change a callback with an incorrect nonce')
        //
        // })
        //
        // describe('with up.script.config.evalCallbackPolicy = "nonce"', function() {
        //
        //   beforeEach(function() {
        //     up.script.config.evalCallbackPolicy = "nonce"
        //   })
        //
        //   it('must have tests', function() {
        //     throw "test me"
        //   })
        //
        // })
        //
        // describe('with up.script.config.evalCallbackPolicy = "auto"', function() {
        //
        //   beforeEach(function() {
        //     up.script.config.evalCallbackPolicy = "auto"
        //   })
        //
        //   it('must have tests', function() {
        //     throw "test me"
        //   })
        //
        // })



      })

    })

    fdescribe('parseCallback()', function() {

      beforeEach(function() {
        window.callbackSpy = jasmine.createSpy('callback spy')
      })

      afterEach(function() {
        delete window.callbackSpy
      })

      function itBehavesLikeNonce({ pageNonce } = {}) {

        describe(`when the page nonce is ${pageNonce ? 'known' : 'unknown'}`, function() {

          beforeEach(function() {
            up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
          })

          it('returns a throwing function for a callback without nonce', function() {
            let code = 'window.callbackSpy()'
            let fn = up.script.parseCallback(code)
            expect(fn).toThrowError(up.Blocked)
            expect(window.callbackSpy).not.toHaveBeenCalled()
          })

          it('returns an executable function for a callback with the correct nonce', function() {
            let code = 'nonce-specs-nonce window.callbackSpy()'
            let fn = up.script.parseCallback(code)
            expect(fn).not.toThrowError(up.Blocked)
            expect(window.callbackSpy).toHaveBeenCalled()
          })

          it('returns a throwing function for a callback with an incorrect nonce', function() {
            let code = 'nonce-wrong222 window.callbackSpy()'
            let fn = up.script.parseCallback(code)
            expect(fn).toThrowError(up.Blocked)
            expect(window.callbackSpy).not.toHaveBeenCalled()
          })

        })

      }

      function itBehavesLikeBlock({ pageNonce } = {}) {

        describe(`when the page nonce is ${pageNonce ? 'known' : 'unknown'}`, function() {

          beforeEach(function() {
            up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
          })

          it('returns a throwing function for a callback without nonce', function() {
            let code = 'window.callbackSpy()'
            let fn = up.script.parseCallback(code)
            expect(fn).toThrowError(up.Blocked)
            expect(window.callbackSpy).not.toHaveBeenCalled()
          })

          it('returns a throwing function a callback with the correct nonce', function() {
            let code = 'nonce-specs-nonce window.callbackSpy()'
            let fn = up.script.parseCallback(code)
            expect(fn).toThrowError(up.Blocked)
            expect(window.callbackSpy).not.toHaveBeenCalled()
          })

          it('returns a throwing function a callback with the correct nonce, but the page nonce is not known to Unpoly', function() {
            spyOn(up.script, 'cspNonce').and.returnValue(undefined)
            let code = 'nonce-specs-nonce window.callbackSpy()'
            let fn = up.script.parseCallback(code)
            expect(fn).toThrowError(up.Blocked)
            expect(window.callbackSpy).not.toHaveBeenCalled()
          })

          it('returns a throwing function for a callback with an incorrect nonce', function() {
            spyOn(up.script, 'cspNonce').and.returnValue(undefined)
            let code = 'nonce-wrong222 window.callbackSpy()'
            let fn = up.script.parseCallback(code)
            expect(fn).toThrowError(up.Blocked)
            expect(window.callbackSpy).not.toHaveBeenCalled()
          })

        })

      }

      function itBehavesLikePass({ pageNonce } = {}) {

        describe(`when the page nonce is ${pageNonce ? 'known' : 'unknown'}`, function() {

          beforeEach(function() {
            up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
          })

          it('returns an executable function for a callback with the correct nonce', function() {
            let code = 'nonce-specs-nonce window.callbackSpy()'
            let fn = up.script.parseCallback(code)
            expect(fn).not.toThrowError(up.Blocked)
            expect(window.callbackSpy).toHaveBeenCalled()
          })

          if (specs.config.csp === 'none') {
            it('returns an executable function for a callback without a nonce', function() {
              let code = 'window.callbackSpy()'
              let fn = up.script.parseCallback(code)
              expect(fn).not.toThrowError(up.Blocked)
              expect(window.callbackSpy).toHaveBeenCalled()
            })
          }

          if (specs.config.csp === 'nonce-only') {
            it('returns a throwing function for a callback without a nonce', function() {
              let code = 'window.callbackSpy()'
              let fn = up.script.parseCallback(code)
              expect(fn).toThrowError(up.Blocked) // new Function() throws EvalError internally
              expect(window.callbackSpy).not.toHaveBeenCalled()
            })

            it('returns a noop function for a callback with an incorrect nonce', function() {
              let code = 'nonce-wrong222 window.callbackSpy()'
              let fn = up.script.parseCallback(code)
              // We would prefer to detect the violation and throw up.Blocked here.
              // Unfortunately the securitypolicyviolation event is emitted async after our eval,
              // and we don't want to be async ourselves.
              fn()
              expect(window.callbackSpy).not.toHaveBeenCalled()
            })

            if (!pageNonce) {
              it('returns an executable function for a callback with a correct nonce, but the page nonce is not known to Unpoly', function() {
                spyOn(up.script, 'cspNonce').and.returnValue(undefined)
                let code = 'nonce-specs-nonce window.callbackSpy()'
                let fn = up.script.parseCallback(code)
                expect(fn).not.toThrowError(up.Blocked)
                expect(window.callbackSpy).toHaveBeenCalled()
              })
            }
          }

        })

      }

      describe('with up.script.config.evalCallbackPolicy = "block"', function() {

        beforeEach(function() {
          up.script.config.evalCallbackPolicy = "block"
        })

        itBehavesLikeBlock({ pageNonce: 'specs-nonce' })
        itBehavesLikeBlock({ pageNonce: null })

      })

      describe('with up.script.config.evalCallbackPolicy = "pass"', function() {

        beforeEach(function() {
          up.script.config.evalCallbackPolicy = "pass"
        })

        itBehavesLikePass({ pageNonce: 'specs-nonce' })
        itBehavesLikePass({ pageNonce: null })

      })

      describe('with up.script.config.evalCallbackPolicy = "nonce"', function() {

        beforeEach(function() {
          up.script.config.evalCallbackPolicy = "nonce"
        })

        itBehavesLikeNonce({ pageNonce: 'specs-nonce' })
        itBehavesLikeBlock({ pageNonce: null })

      })

      describe('with up.script.config.evalCallbackPolicy = "auto"', function() {

        beforeEach(function() {
          up.script.config.evalCallbackPolicy = "auto"
        })

        itBehavesLikeNonce({ pageNonce: 'specs-nonce' })
        itBehavesLikePass({ pageNonce: null })

      })

    })

  })

})
