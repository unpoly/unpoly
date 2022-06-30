u = up.util
$ = jQuery

describe 'up.syntax', ->

  describe 'JavaScript functions', ->

    describe 'up.compiler', ->

      it 'applies an event initializer whenever a matching fragment is inserted', ->
        observeElement = jasmine.createSpy()
        up.compiler '.child', (element) -> observeElement(element)

        $container = $fixture('.container')
        $child = $container.affix('.child')
        $otherChild = $container.affix('.other-child')

        up.hello($container[0])

        expect(observeElement).not.toHaveBeenCalledWith($container[0])
        expect(observeElement).not.toHaveBeenCalledWith($otherChild[0])
        expect(observeElement).toHaveBeenCalledWith($child[0])

      it 'prints a message when a compiler is registered after booting, explaining that the compiler will only run for future fragments', ->
        spyOn(up, 'puts').and.callThrough()
        up.compiler('.foo', u.noop)
        expect(up.puts).toHaveBeenCalled()
        expect(up.puts.calls.argsFor(0)[1]).toMatch(/will run for future fragments/i)

    describe 'up.$compiler', ->

      it 'registers a compiler that receives the element as a jQuery collection', ->
        observeElement = jasmine.createSpy()
        up.$compiler '.element', ($element) -> observeElement($element)

        $element = $fixture('.element')
        up.hello($element)

        expect(observeElement).toHaveBeenCalled()
        arg = observeElement.calls.argsFor(0)[0]
        expect(arg).toBeJQuery()
        expect(arg).toEqual($element)

    describe 'up.macro', ->

      it 'registers compilers that are run before other compilers', ->
        traces = []
        up.compiler '.element', { priority: 10 }, -> traces.push('foo')
        up.compiler '.element', { priority: -1000 }, -> traces.push('bar')
        up.macro '.element', -> traces.push('baz')
        up.hello(fixture('.element'))
        expect(traces).toEqual ['baz', 'foo' , 'bar']

      it 'allows to macros to have priorities of their own (higher priority is run first)', ->
        traces = []
        up.macro '.element', { priority: 1 }, -> traces.push('foo')
        up.macro '.element', { priority: 2 }, -> traces.push('bar')
        up.macro '.element', { priority: 0 }, -> traces.push('baz')
        up.macro '.element', { priority: 3 }, -> traces.push('bam')
        up.macro '.element', { priority: -1 }, -> traces.push('qux')
        up.compiler '.element', { priority: 999 }, -> traces.push('ccc')
        up.hello(fixture('.element'))
        expect(traces).toEqual ['bam', 'bar', 'foo', 'baz', 'qux', 'ccc']

      it 'runs two macros with the same priority in the order in which they were registered', ->
        traces = []
        up.macro '.element', { priority: 1 }, -> traces.push('foo')
        up.macro '.element', { priority: 1 }, -> traces.push('bar')
        up.hello(fixture('.element'))
        expect(traces).toEqual ['foo', 'bar']

      it 'allows users to use the built-in [up-expand] from their own macros', ->
        up.macro '.element', (element) ->
          element.setAttribute('up-expand', '')
        $element = $fixture('.element a[href="/foo"][up-target=".target"]')
        up.hello($element)
        expect($element.attr('up-target')).toEqual('.target')
        expect($element.attr('up-href')).toEqual('/foo')

      if up.migrate.loaded
        it 'allows users to use the built-in [up-dash] from their own macros', ->
          up.macro '.element', (element) ->
            element.setAttribute('up-dash', '.target')
          $element = $fixture('a.element[href="/foo"]')
          up.hello($element)
          expect($element.attr('up-target')).toEqual('.target')
          expect($element.attr('up-preload')).toEqual('')
          expect($element.attr('up-instant')).toEqual('')

    describe 'up.$macro', ->

      it 'registers a macro that receives the element as a jQuery collection', ->
        observeElement = jasmine.createSpy()
        up.$macro '.element', ($element) -> observeElement('macro', $element)
        up.$compiler '.element', ($element) -> observeElement('compiler', $element)

        $element = $fixture('.element')
        up.hello($element)

        expect(observeElement).toHaveBeenCalled()
        args = observeElement.calls.argsFor(0)
        expect(args[0]).toEqual('macro')
        expect(args[1]).toBeJQuery()
        expect(args[1]).toEqual($element)

    describe 'up.syntax.data', ->

      describe 'when the element has an [up-data] attribute', ->

        it 'parses an object value serialized as JSON', ->
          element = fixture('.element', 'up-data': '{ "foo": 1, "bar": 2 }')
          data = up.syntax.data(element)

          expect(Object.keys(data)).toEqual(jasmine.arrayWithExactContents(['foo', 'bar']))
          expect(data.foo).toBe(1)
          expect(data.bar).toBe(2)

        it 'parses an array value serialized as JSON', ->
          element = fixture('.element', 'up-data': '["foo", "bar"]')
          data = up.syntax.data(element)

          expect(data).toEqual(['foo', 'bar'])

        it 'parses a string value serialized as JSON', ->
          element = fixture('.element', 'up-data': '"foo"')
          data = up.syntax.data(element)

          expect(data).toBe('foo')

      describe 'when the element has no [up-data] attribute', ->

        it 'returns a blank object', ->
          element = fixture('.element')
          data = up.syntax.data(element)

          expect(typeof data).toBe('object')
          expect(Object.keys(data)).toBeBlank()

        it "returns access to the element's vanilla [data-] attributes", ->
          element = fixture('.element', 'data-foo': 'foo value', 'data-bar': 'bar value')
          data = up.syntax.data(element)

          expect(data.foo).toBe('foo value')
          expect(data.bar).toBe('bar value')

        it 'allows to access [data-] attribute with camelCase keys', ->
          element = fixture('.element', 'data-foo-bar': 'value')
          data = up.syntax.data(element)

          expect(data.fooBar).toBe('value')

      describe 'when the element has both an [up-data] and vanilla [data-] attributes', ->

        it 'returns an object with properties from both', ->
          element = fixture('.element', 'data-foo': 'foo value', 'up-data': JSON.stringify(bar: 'bar value'))
          data = up.syntax.data(element)

          expect(data.foo).toBe('foo value')
          expect(data.bar).toBe('bar value')

        it 'allows to access [data-] attribute with camelCase keys', ->
          element = fixture('.element', 'data-foo-bar': 'value1', 'up-data': JSON.stringify(baz: 'value2'))
          data = up.syntax.data(element)

          expect(data.fooBar).toBe('value1')

        it 'supports the `in` operator', ->
          element = fixture('.element', 'data-foo': 'foo value', 'up-data': JSON.stringify(bar: 'bar value'))
          data = up.syntax.data(element)

          # The `in` operator is `of` in CoffeeScript
          # See https://makandracards.com/makandra/52454
          expect('foo' of data).toBe(true)
          expect('bar' of data).toBe(true)
          expect('baz' of data).toBe(false)

        it 'supports Object.keys()', ->
          element = fixture('.element', 'data-foo': 'foo value', 'up-data': JSON.stringify(bar: 'bar value'))
          data = up.syntax.data(element)

          expect(Object.keys(data)).toEqual(jasmine.arrayWithExactContents(['foo', 'bar']))

        it 'prefers properties from [up-data]', ->
          element = fixture('.element', 'data-foo': 'a', 'up-data': JSON.stringify(foo: 'b'))
          data = up.syntax.data(element)

          expect(data.foo).toBe('b')

        it 'allows to override a property from a [data-] attribute', ->
          element = fixture('.element', 'data-foo': 'a', 'up-data': JSON.stringify(foo: 'b'))
          data = up.syntax.data(element)

          data.foo = 'new a'

          expect(data.foo).toBe('new a')

        it 'allows to override a property from [up-data]', ->
          element = fixture('.element', 'data-foo': 'a', 'up-data': JSON.stringify(foo: 'b'))
          data = up.syntax.data(element)

          data.foo = 'overridden'

          expect(data.foo).toBe('overridden')

        it 'allows to delete a property from a [data-] attribute', ->
          element = fixture('.element', 'data-foo': 'a', 'up-data': JSON.stringify(bar: 'b'))
          data = up.syntax.data(element)

          data.foo = 'overridden'

          expect(data.foo).toBe('overridden')

        it 'allows to delete a property from [up-data]', ->
          element = fixture('.element', 'data-foo': 'a', 'up-data': JSON.stringify(foo: 'b'))
          data = up.syntax.data(element)

          delete data.foo

          expect(data.foo).toBeUndefined()
          expect('foo' of data).toBe(false)

        it 'allows to delete a property from a [data-] attribute', ->
          element = fixture('.element', 'data-foo': 'a', 'up-data': JSON.stringify(bar: 'b'))
          data = up.syntax.data(element)

          delete data.foo

          expect(data.foo).toBeUndefined()
          expect('foo' of data).toBe(false)

        it 'delays JSON parsing until the first access', ->
          parseSpy = spyOn(JSON, 'parse').and.callThrough()
          element = fixture('.element', 'data-foo': 'foo value', 'up-data': JSON.stringify(bar: 'bar value'))
          data = up.syntax.data(element)

          expect(JSON.parse).not.toHaveBeenCalled()

          expect(data.foo).toBe('foo value')

          expect(JSON.parse).toHaveBeenCalled()

    describe 'up.syntax.compile', ->

      it "sets the compiled fragment's layer as layer.current, even if the fragment is not in the front layer"

      describe 'when a compiler throws an error', ->

        allowGlobalErrors()

        it 'does not prevent other compilers from running', ->
          compilerBefore = jasmine.createSpy('compiler before')
          crashingCompiler = -> throw new Error("error from crashing compiler")
          compilerAfter = jasmine.createSpy('compiler after')

          up.compiler '.element', compilerBefore
          up.compiler '.element', crashingCompiler
          up.compiler '.element', compilerAfter

          element = fixture('.element')

          hello = -> up.hello(element)
          expect(hello).toThrowError(/errors while compiling/i)

          expect(compilerBefore).toHaveBeenCalled()
          expect(compilerAfter).toHaveBeenCalled()

        it 'throws an error', ->
          crashingCompiler = -> throw new Error("error from crashing compiler")

          up.compiler '.element', crashingCompiler

          element = fixture('.element')

          hello = -> up.hello(element)
          expect(hello).toThrowError(/errors while compiling/i)

        it 'reports caught exceptions to window.onerror to support exception notification tools', ->
          crashingCompiler = -> throw new Error("error from crashing compiler")
          up.compiler '.element', crashingCompiler

          element = fixture('.element')

          hello = -> up.hello(element)
          expect(hello).toThrowError(/errors while compiling/i)

          expect(@globalErrorHandler).toHaveBeenCalled()
          event = @globalErrorHandler.calls.mostRecent().args[0]
          expect(event).toBeEvent('error')
          expect(event.error).toBeError('error from crashing compiler')


      describe 'passing of [up-data]', ->

        it 'parses an [up-data] attribute as JSON and passes the parsed object as a second argument to the compiler', ->
          observeArgs = jasmine.createSpy()
          up.compiler '.child', (element, data) ->
            observeArgs(element.className, data)

          data = { key1: 'value1', key2: 'value2' }

          $tag = $fixture(".child").attr('up-data', JSON.stringify(data))
          up.hello($tag[0])

          expect(observeArgs).toHaveBeenCalledWith('child', jasmine.objectContaining(data))

        it 'passes an empty object as a second argument to the compiler if there is no [up-data] attribute', ->
          observeArgs = jasmine.createSpy()
          up.compiler '.child', (element, data) ->
            observeArgs(element.className, data)

          up.hello(fixture(".child"))

          expect(observeArgs).toHaveBeenCalledWith('child', jasmine.objectContaining({}))

        it 'does not parse an [up-data] attribute if the compiler function only takes a single argument', ->
          parseDataSpy = spyOn(up.syntax, 'data').and.returnValue({})

          $child = $fixture(".child")

          up.compiler '.child', (element) -> # no-op
          up.hello($child)

          expect(parseDataSpy).not.toHaveBeenCalled()

      it 'compiles multiple matching elements one-by-one', ->
        compiler = jasmine.createSpy('compiler')
        up.compiler '.foo', (element) -> compiler(element)
        $container = $fixture('.container')
        $first = $container.affix('.foo.first')
        $second = $container.affix('.foo.second')
        up.hello($container[0])
        expect(compiler.calls.count()).toEqual(2)
        expect(compiler).toHaveBeenCalledWith($first[0])
        expect(compiler).toHaveBeenCalledWith($second[0])

      describe 'with { batch } option', ->

        it 'compiles all matching elements at once', ->
          compiler = jasmine.createSpy('compiler')
          up.compiler '.foo', { batch: true }, (elements) -> compiler(elements)
          $container = $fixture('.container')
          first = $container.affix('.foo.first')[0]
          second = $container.affix('.foo.second')[0]
          up.hello($container)
          expect(compiler.calls.count()).toEqual(1)
          expect(compiler).toHaveBeenCalledWith([first, second])

        it 'throws an error if the batch compiler returns a destructor', ->
          destructor = ->
          up.compiler '.element', { batch: true }, (element) -> destructor
          $container = $fixture('.element')
          compile = -> up.hello($container)
          expect(compile).toThrowError(/cannot return destructor/i)

      if up.migrate.loaded
        describe 'with { keep } option', ->

          it 'adds an up-keep attribute to the fragment during compilation', ->

            up.compiler '.foo', { keep: true }, ->
            up.compiler '.bar', { }, ->
            up.compiler '.bar', { keep: false }, ->
            up.compiler '.bam', { keep: '.partner' }, ->

            $foo = $ up.hello(fixture('.foo'))
            $bar = $ up.hello(fixture('.bar'))
            $baz = $ up.hello(fixture('.baz'))
            $bam = $ up.hello(fixture('.bam'))

            expect($foo.attr('up-keep')).toEqual('')
            expect($bar.attr('up-keep')).toBeMissing()
            expect($baz.attr('up-keep')).toBeMissing()
            expect($bam.attr('up-keep')).toEqual('.partner')

      describe 'with { priority } option', ->

        it 'runs compilers with higher priority first', ->
          traces = []
          up.compiler '.element', { priority: 1 }, -> traces.push('foo')
          up.compiler '.element', { priority: 2 }, -> traces.push('bar')
          up.compiler '.element', { priority: 0 }, -> traces.push('baz')
          up.compiler '.element', { priority: 3 }, -> traces.push('bam')
          up.compiler '.element', { priority: -1 }, -> traces.push('qux')
          up.hello(fixture('.element'))
          expect(traces).toEqual ['bam', 'bar', 'foo', 'baz', 'qux']

        it 'considers priority-less compilers to be priority zero', ->
          traces = []
          up.compiler '.element', { priority: 1 }, -> traces.push('foo')
          up.compiler '.element', -> traces.push('bar')
          up.compiler '.element', { priority: -1 }, -> traces.push('baz')
          up.hello(fixture('.element'))
          expect(traces).toEqual ['foo', 'bar', 'baz']

        it 'runs two compilers with the same priority in the order in which they were registered', ->
          traces = []
          up.compiler '.element', { priority: 1 }, -> traces.push('foo')
          up.compiler '.element', { priority: 1 }, -> traces.push('bar')
          up.hello(fixture('.element'))
          expect(traces).toEqual ['foo', 'bar']

    describe 'up.syntax.clean', ->

      it 'allows compilers to return a function to call when the compiled element is cleaned', ->
        destructor = jasmine.createSpy('destructor')
        up.compiler '.child', (element) ->
          destructor

        container = fixture('.container .child')
        up.hello(container)
        expect(destructor).not.toHaveBeenCalled()

        up.syntax.clean(container)
        expect(destructor).toHaveBeenCalled()

      it 'allows compilers to return an array of functions to call when the compiled element is cleaned', ->
        destructor1 = jasmine.createSpy('destructor1')
        destructor2 = jasmine.createSpy('destructor2')
        up.compiler '.child', (element) ->
          [ destructor1, destructor2 ]

        container = fixture('.container .child')
        up.hello(container)

        up.syntax.clean(container)

        expect(destructor1).toHaveBeenCalled()
        expect(destructor2).toHaveBeenCalled()

      it "does not consider a returned array to be a destructor unless it's comprised entirely of functions", ->
        value1 = jasmine.createSpy('non-destructor')
        value2 = 'two'
        up.compiler '.child', (element) ->
          [ value1, value2 ]

        container = fixture('.container .child')
        up.hello(container)

        up.syntax.clean(container)

        expect(value1).not.toHaveBeenCalled()

      it 'runs all destructors if multiple compilers are applied to the same element', ->
        destructor1 = jasmine.createSpy('destructor1')
        up.compiler '.one', (element) -> destructor1
        destructor2 = jasmine.createSpy('destructor2')
        up.compiler '.two', (element) -> destructor2

        element = fixture('.one.two')
        up.hello(element)

        up.syntax.clean(element)

        expect(destructor1).toHaveBeenCalled()
        expect(destructor2).toHaveBeenCalled()

      it 'does not throw an error if both container and child have a destructor, and the container gets destroyed', ->
        up.compiler '.container', (element) ->
          return (->)

        up.compiler '.child', (element) ->
          return (->)

        container = fixture('.container .child')

        clean = -> up.syntax.clean(container)
        expect(clean).not.toThrowError()

      describe 'when a destructor throws an error', ->

        allowGlobalErrors()

        it 'does not prevent other destructors from running', ->
          destructorBefore = jasmine.createSpy('destructor before')
          crashingDestructor = -> throw new Error("error from crashing destructor")
          destructorAfter = jasmine.createSpy('destructor after')

          up.compiler '.element', -> return destructorBefore
          up.compiler '.element', -> return crashingDestructor
          up.compiler '.element', -> return destructorAfter

          element = fixture('.element')
          up.hello(element)

          clean = -> up.syntax.clean(element)

          expect(clean).toThrowError(/errors while destroying/i)

          expect(destructorBefore).toHaveBeenCalled()
          expect(destructorAfter).toHaveBeenCalled()

        it 'reports caught exceptions to window.onerror to support exception notification tools', ->
          crashingDestructor = -> throw new Error("error from crashing destructor")
          up.compiler '.element', -> return crashingDestructor

          element = fixture('.element')
          up.hello(element)

          clean = -> up.syntax.clean(element)
          expect(clean).toThrowError(/errors while destroying/i)

          expect(@globalErrorHandler).toHaveBeenCalled()
          event = @globalErrorHandler.calls.mostRecent().args[0]
          expect(event).toBeEvent('error')
          expect(event.error).toBeError('error from crashing destructor')
