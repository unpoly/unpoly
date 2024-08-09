const u = up.util
const e = up.element
const $ = jQuery

describe('up.script', function() {

  describe('JavaScript functions', function() {

    describe('up.compiler()', function() {

      it('applies an event initializer whenever a matching fragment is inserted', function() {
        const observeElement = jasmine.createSpy()
        up.compiler('.child', element => observeElement(element))

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
        up.hello(fixture('.element'))
        expect(traces).toEqual(['bar', 'foo', 'baz'])
      })

      describe('with { batch } option', function() {

        it('compiles all matching elements at once', function() {
          const compiler = jasmine.createSpy('compiler')
          up.compiler('.foo', { batch: true }, elements => compiler(elements))
          const $container = $fixture('.container')
          const first = $container.affix('.foo.first')[0]
          const second = $container.affix('.foo.second')[0]
          up.hello($container)
          expect(compiler.calls.count()).toEqual(1)
          expect(compiler).toHaveBeenCalledWith([first, second])
        })

        it('throws an error if the batch compiler returns a destructor', function() {
          const destructor = function() {}
          up.compiler('.element', { batch: true }, element => destructor)
          const $container = $fixture('.element')
          const compile = () => up.hello($container)
          expect(compile).toThrowError(/cannot return destructor/i)
        })
      })

      if (up.migrate.loaded) {
        describe('with { keep } option', () => it('adds an up-keep attribute to the fragment during compilation', function() {

          up.compiler('.foo', { keep: true }, function() {})
          up.compiler('.bar', { }, function() {})
          up.compiler('.bar', { keep: false }, function() {})
          up.compiler('.bam', { keep: '.partner' }, function() {})

          const $foo = $(up.hello(fixture('.foo')))
          const $bar = $(up.hello(fixture('.bar')))
          const $baz = $(up.hello(fixture('.baz')))
          const $bam = $(up.hello(fixture('.bam')))

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
          up.hello(fixture('.element'))
          expect(traces).toEqual(['bam', 'bar', 'foo', 'baz', 'qux'])
        })

        it('considers priority-less compilers to be priority zero', function() {
          const traces = []
          up.compiler('.element', { priority: 1 }, () => traces.push('foo'))
          up.compiler('.element', () => traces.push('bar'))
          up.compiler('.element', { priority: -1 }, () => traces.push('baz'))
          up.hello(fixture('.element'))
          expect(traces).toEqual(['foo', 'bar', 'baz'])
        })

        it('runs two compilers with the same priority in the order in which they were registered', function() {
          const traces = []
          up.compiler('.element', { priority: 1 }, () => traces.push('foo'))
          up.compiler('.element', { priority: 1 }, () => traces.push('bar'))
          up.hello(fixture('.element'))
          expect(traces).toEqual(['foo', 'bar'])
        })
      })

      describe('when a compiler is registered after booting', function() {

        describe('with { priority }', function() {

          it('prints a message explaining that the compiler will only run for future fragments', function() {
            spyOn(up, 'puts').and.callThrough()
            up.compiler('.foo', { priority: 10 }, u.noop)
            expect(up.puts).toHaveBeenCalled()
            expect(up.puts.calls.argsFor(0)[1]).toMatch(/will run for future fragments/i)
          })

          it('runs the compiler for future fragments, but not for current fragments (even if they match)', function() {
            const spy = jasmine.createSpy('compiler')
            const element1 = up.hello(fixture('.element'))
            up.compiler('.element', { priority: 10 }, element => spy(element))

            expect(spy).not.toHaveBeenCalled()

            const element2 = up.hello(fixture('.element'))

            expect(spy).toHaveBeenCalledWith(element2)
          })
        })

        describe('without { priority }', function() {

          it('prints no message explaining when the compiler will run', function() {
            spyOn(up, 'puts').and.callThrough()
            up.compiler('.foo', u.noop)
            expect(up.puts).not.toHaveBeenCalled()
          })

          it('compiles current fragments', function() {
            const spy = jasmine.createSpy('compiler')
            const element1 = up.hello(fixture('.element'))
            up.compiler('.element', element => spy(element))

            expect(spy).toHaveBeenCalledWith(element1)
          })

          it('compiles current fragments on other layers', function() {
            const rootElement = fixture('.foo')
            makeLayers(2)
            const overlayElement = up.layer.affix('.foo')

            expect(document.querySelectorAll('.foo').length).toBe(2)

            const spy = jasmine.createSpy('compiler')
            up.compiler('.foo', element => spy(element))

            expect(spy.calls.count()).toBe(2)
            expect(spy.calls.argsFor(0)[0]).toBe(rootElement)
            expect(spy.calls.argsFor(1)[0]).toBe(overlayElement)
          })

          it('does not compile elements twice if the new fragment contains a <script> that defines a new compiler', function() {
            const container = fixture('.container')
            const element = e.affix(container, '.element', {text: 'old text'})

            window.compileSpy = jasmine.createSpy('compile spy')

            up.render({fragment: `
            <div class="container">
              <div class="element">new text</div>
              <script>
                up.compiler('.element', (element) => window.compileSpy(element))
              </script>
            </div>
          `})

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
          up.$compiler('.element', $element => observeElement($element))

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
        up.hello(fixture('.element'))
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
        up.hello(fixture('.element'))
        expect(traces).toEqual(['bam', 'bar', 'foo', 'baz', 'qux', 'ccc'])
      })

      it('runs two macros with the same priority in the order in which they were registered', function() {
        const traces = []
        up.macro('.element', { priority: 1 }, () => traces.push('foo'))
        up.macro('.element', { priority: 1 }, () => traces.push('bar'))
        up.hello(fixture('.element'))
        expect(traces).toEqual(['foo', 'bar'])
      })

      it('allows users to use the built-in [up-expand] from their own macros', function() {
        up.macro('.element', element => element.setAttribute('up-expand', ''))
        const $element = $fixture('.element a[href="/foo"][up-target=".target"]')
        up.hello($element)
        expect($element.attr('up-target')).toEqual('.target')
        expect($element.attr('up-href')).toEqual('/foo')
      })

      if (up.migrate.loaded) {
        it('allows users to use the built-in [up-dash] from their own macros', function() {
          up.macro('.element', element => element.setAttribute('up-dash', '.target'))
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
          up.$macro('.element', $element => observeElement('macro', $element))
          up.$compiler('.element', $element => observeElement('compiler', $element))

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

    })

    describe('up.data()', function() {

      describe('when the element has an [up-data] attribute', function() {

        it('parses an object value serialized as JSON', function() {
          const element = fixture('.element', {'up-data': '{ "foo": 1, "bar": 2 }'})
          const data = up.data(element)

          expect(Object.keys(data)).toEqual(jasmine.arrayWithExactContents(['foo', 'bar']))
          expect(data.foo).toBe(1)
          expect(data.bar).toBe(2)
        })

        it('parses an array value serialized as JSON', function() {
          const element = fixture('.element', {'up-data': '["foo", "bar"]'})
          const data = up.data(element)

          expect(data).toEqual(['foo', 'bar'])
        })

        it('parses a string value serialized as JSON', function() {
          const element = fixture('.element', {'up-data': '"foo"'})
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
          const element = fixture('.element', {'data-foo': 'foo value', 'data-bar': 'bar value'})
          const data = up.data(element)

          expect(data.foo).toBe('foo value')
          expect(data.bar).toBe('bar value')
        })

        it('allows to access [data-] attribute with camelCase keys', function() {
          const element = fixture('.element', {'data-foo-bar': 'value'})
          const data = up.data(element)

          expect(data.fooBar).toBe('value')
        })
      })

      describe('when the element has both an [up-data] and vanilla [data-] attributes', function() {

        it('returns an object with properties from both', function() {
          const element = fixture('.element', {'data-foo': 'foo value', 'up-data': JSON.stringify({bar: 'bar value'})})
          const data = up.data(element)

          expect(data.foo).toBe('foo value')
          expect(data.bar).toBe('bar value')
        })

        it('allows to access [data-] attribute with camelCase keys', function() {
          const element = fixture('.element', {'data-foo-bar': 'value1', 'up-data': JSON.stringify({baz: 'value2'})})
          const data = up.data(element)

          expect(data.fooBar).toBe('value1')
        })

        it('supports the `in` operator', function() {
          const element = fixture('.element', {'data-foo': 'foo value', 'up-data': JSON.stringify({bar: 'bar value'})})
          const data = up.data(element)

          // The `in` operator is `of` in CoffeeScript
          // See https://makandracards.com/makandra/52454
          expect('foo' in data).toBe(true)
          expect('bar' in data).toBe(true)
          expect('baz' in data).toBe(false)
        })

        it('supports Object.keys()', function() {
          const element = fixture('.element', {'data-foo': 'foo value', 'up-data': JSON.stringify({bar: 'bar value'})})
          const data = up.data(element)

          expect(Object.keys(data)).toEqual(jasmine.arrayWithExactContents(['foo', 'bar']))
        })

        it('prefers properties from [up-data]', function() {
          const element = fixture('.element', {'data-foo': 'a', 'up-data': JSON.stringify({foo: 'b'})})
          const data = up.data(element)

          expect(data.foo).toBe('b')
        })

        it('allows to override a property from a [data-] attribute', function() {
          const element = fixture('.element', {'data-foo': 'a', 'up-data': JSON.stringify({foo: 'b'})})
          const data = up.data(element)

          data.foo = 'new a'

          expect(data.foo).toBe('new a')
        })

        it('allows to override a property from [up-data]', function() {
          const element = fixture('.element', {'data-foo': 'a', 'up-data': JSON.stringify({foo: 'b'})})
          const data = up.data(element)

          data.foo = 'overridden'

          expect(data.foo).toBe('overridden')
        })

        it('allows to delete a property from a [data-] attribute', function() {
          const element = fixture('.element', {'data-foo': 'a', 'up-data': JSON.stringify({bar: 'b'})})
          const data = up.data(element)

          data.foo = 'overridden'

          expect(data.foo).toBe('overridden')
        })

        it('allows to delete a property from [up-data]', function() {
          const element = fixture('.element', {'data-foo': 'a', 'up-data': JSON.stringify({foo: 'b'})})
          const data = up.data(element)

          delete data.foo

          expect(data.foo).toBeUndefined()
          expect('foo' in data).toBe(false)
        })

        it('allows to delete a property from a [data-] attribute', function() {
          const element = fixture('.element', {'data-foo': 'a', 'up-data': JSON.stringify({bar: 'b'})})
          const data = up.data(element)

          delete data.foo

          expect(data.foo).toBeUndefined()
          expect('foo' in data).toBe(false)
        })
      })

      describe('when the element was compiled with a { data } option', function() {

        it('overrides properties from a [data-] attribute', function() {
          const element = fixture('.element', {'data-foo': 'a', 'data-bar': 'b'})
          up.hello(element, {data: { bar: 'c' }})

          const data = up.data(element)

          expect(data).toEqual({foo: 'a', bar: 'c'})
        })

        it('overrides properties from an [up-data] attribute', function() {
          const element = fixture('.element', {'up-data': JSON.stringify({foo: 'a', bar: 'b'})})
          up.hello(element, {data: { bar: 'c' }})

          const data = up.data(element)

          expect(data).toEqual({foo: 'a', bar: 'c'})
        })
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

      it('emits an up:fragment:inserted event', function() {
        const compiler = jasmine.createSpy('compiler')
        const target = fixture('.element')
        const listener = jasmine.createSpy('up:fragment:inserted listener')
        target.addEventListener('up:fragment:inserted', listener)

        up.hello(target, { origin })

        const expectedEvent = jasmine.objectContaining({ target })
        expect(listener).toHaveBeenCalledWith(expectedEvent)
      })

      it("sets up.layer.current to the given element's layer while compilers are running", asyncSpec(function(next) {
        const layerSpy = jasmine.createSpy('layer spy')
        up.compiler('.foo', () => layerSpy(up.layer.current))
        makeLayers(2)

        next(function() {
          const rootElement = fixture('.foo.in-root')
          const overlayElement = up.layer.get(1).affix('.foo.in-overlay')

          up.hello(rootElement)
          up.hello(overlayElement)

          expect(layerSpy.calls.count()).toBe(2)

          expect(layerSpy.calls.argsFor(0)[0]).toBe(up.layer.get(0))
          expect(layerSpy.calls.argsFor(1)[0]).toBe(up.layer.get(1))
        })
      }))

      it('keeps up.layer.current and does not crash when compiling a detached element (bugfix)', asyncSpec(function(next) {
        const layerSpy = jasmine.createSpy('layer spy')
        up.compiler('.foo', () => layerSpy(up.layer.current))
        makeLayers(2)

        next(function() {
          expect(up.layer.current.isOverlay()).toBe(true)

          const element = up.element.createFromSelector('.foo')
          const compileFn = () => up.hello(element)

          expect(compileFn).not.toThrowError()
          expect(layerSpy.calls.argsFor(0)[0]).toBe(up.layer.current)
        })
      }))

      it('does not re-compile elements when called multiple times', function() {
        const compiler = jasmine.createSpy('compiler')
        up.compiler('.element', compiler)
        const element = fixture('.element')

        up.hello(element)
        up.hello(element)
        expect(compiler.calls.count()).toBe(1)
      })

      it('does not re-compile elements when their compiler is compiled afterwards', function() {
        const compiler = jasmine.createSpy('compiler')
        up.compiler('.element', compiler)
        const container = fixture('.container')
        const element = e.affix(container, '.element')

        up.hello(element)
        up.hello(container)
        expect(compiler.calls.count()).toBe(1)
      })

      it("sets the compiled fragment's layer as layer.current, even if the fragment is not in the front layer")

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

          up.hello(fixture(".child"))

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

            up.hello($tag[0], {data: { key2: 'override-value2' }})

            expect(observeArgs).toHaveBeenCalledWith('child', { key1: 'value1', key2: 'override-value2' })
          })
        })

        describe('with { dataMap } option', function() {
          it('allows to override the [up-data] attribute of each matching element', function() {
            const observeArgs = jasmine.createSpy()
            up.compiler('.child', (element, data) => observeArgs(element.id, data))

            const fragment = fixture('.fragment')
            const child1 = e.affix(fragment, '.child#child1', {'up-data': JSON.stringify({foo: 'default foo'})})
            const child2 = e.affix(fragment, '.child#child2', {'up-data': JSON.stringify({foo: 'default foo'})})

            up.hello(fragment, { dataMap: {
                '#child1': { foo: 'foo for child1' },
                '#child2': { foo: 'foo for child2' },
              }
            })

            expect(observeArgs.calls.argsFor(0)).toEqual(['child1', {foo: 'foo for child1'}])
            expect(observeArgs.calls.argsFor(1)).toEqual(['child2', {foo: 'foo for child2'}])
          })
        })

      })

      it('compiles multiple matching elements one-by-one', function() {
        const compiler = jasmine.createSpy('compiler')
        up.compiler('.foo', element => compiler(element))
        const $container = $fixture('.container')
        const $first = $container.affix('.foo.first')
        const $second = $container.affix('.foo.second')
        up.hello($container[0])
        expect(compiler.calls.count()).toEqual(2)
        expect(compiler).toHaveBeenCalledWith($first[0])
        expect(compiler).toHaveBeenCalledWith($second[0])
      })
    })

    describe('up.script.clean()', function() {

      it('allows compilers to return a function to call when the compiled element is cleaned', function() {
        const destructor = jasmine.createSpy('destructor')
        up.compiler('.child', element => destructor)

        const container = fixture('.container .child')
        up.hello(container)
        expect(destructor).not.toHaveBeenCalled()

        up.script.clean(container)
        expect(destructor).toHaveBeenCalled()
      })

      it('ignores return values that are not functions')

      it('allows compilers to return an array of functions to call when the compiled element is cleaned', function() {
        const destructor1 = jasmine.createSpy('destructor1')
        const destructor2 = jasmine.createSpy('destructor2')
        up.compiler('.child', element => [ destructor1, destructor2 ])

        const container = fixture('.container .child')
        up.hello(container)

        up.script.clean(container)

        expect(destructor1).toHaveBeenCalled()
        expect(destructor2).toHaveBeenCalled()
      })

      // it("does not consider a returned array to be a destructor unless it's comprised entirely of functions", function() {
      //   const value1 = jasmine.createSpy('non-destructor')
      //   const value2 = 'two'
      //   up.compiler('.child', element => [ value1, value2 ])
      //
      //   const container = fixture('.container .child')
      //   up.hello(container)
      //
      //   up.script.clean(container)
      //
      //   expect(value1).not.toHaveBeenCalled()
      // })

      it('runs all destructors if multiple compilers are applied to the same element', function() {
        const destructor1 = jasmine.createSpy('destructor1')
        up.compiler('.one', element => destructor1)
        const destructor2 = jasmine.createSpy('destructor2')
        up.compiler('.two', element => destructor2)

        const element = fixture('.one.two')
        up.hello(element)

        up.script.clean(element)

        expect(destructor1).toHaveBeenCalled()
        expect(destructor2).toHaveBeenCalled()
      })

      it('does not throw an error if both container and child have a destructor, and the container gets destroyed', function() {
        up.compiler('.container', element => (function() {}))

        up.compiler('.child', element => (function() {}))

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
        const link = e.affix(document.head, 'link[rel="stylesheet"][href="/styles.css"]')
        registerFixture(link)
        expect(up.script.findAssets()).toContain(link)
      })

      it('does not find a link[rel=stylesheet] in the body', function() {
        const link = e.affix(document.body, 'link[rel="stylesheet"][href="/styles.css"]')
        registerFixture(link)
        expect(up.script.findAssets()).not.toContain(link)
      })

      it('does not find a link[rel=alternate]', function() {
        const link = e.affix(document.body, 'link[rel="alternate"][type="application/rss+xml"][title="RSS Feed"][href="/feed"]')
        registerFixture(link)
        expect(up.script.findAssets()).not.toContain(link)
      })

      it('finds a script[src] in the head', function() {
        const link = e.affix(document.head, 'script[src="/foo.js"]')
        registerFixture(link)
        expect(up.script.findAssets()).toContain(link)
      })

      it('does not find a script[src] in the body', function() {
        const link = e.affix(document.body, 'script[src="/foo.js"]')
        registerFixture(link)
        expect(up.script.findAssets()).not.toContain(link)
      })

      it('does not find an inline script in the head', function() {
        const link = e.affix(document.head, 'script', {text: 'console.log("hello from inline script")'})
        registerFixture(link)
        expect(up.script.findAssets()).not.toContain(link)
      })

      it('finds an arbitrary element in the head with [up-asset]', function() {
        const base = e.affix(document.head, 'base[href="/pages"]')
        registerFixture(base)
        expect(up.script.findAssets()).toEqual([])

        base.setAttribute('up-asset', '')
        expect(up.script.findAssets()).toEqual([base])
      })

      it('allows to opt out with [up-asset=false]', function() {
        const link = e.affix(document.head, 'link[rel="stylesheet"][href="/styles.css"][up-asset="false"]')
        registerFixture(link)
        expect(up.script.findAssets()).not.toContain(link)
      })

      it('allows to opt out by configuring up.script.config.noAssetSelectors', function() {
        const link = e.affix(document.head, 'link[rel="stylesheet"][href="/excluded.css"]')
        registerFixture(link)
        up.script.config.noAssetSelectors.push('link[href="/excluded.css"]')
        expect(up.script.findAssets()).not.toContain(link)
      })
    })
  })
})


