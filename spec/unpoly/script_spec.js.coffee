u = up.util
e = up.element
$ = jQuery

describe 'up.script', ->

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

      it 'allows to compilers to have priorities of their own (higher priority is run first)', ->
        traces = []
        up.compiler '.element', { priority: 1 }, -> traces.push('foo')
        up.compiler '.element', { priority: 2 }, -> traces.push('bar')
        up.compiler '.element', { priority: 0 }, -> traces.push('baz')
        up.hello(fixture('.element'))
        expect(traces).toEqual ['bar', 'foo', 'baz']

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

      describe 'when a compiler is registered after booting', ->

        describe 'with { priority }', ->

          it 'prints a message explaining that the compiler will only run for future fragments', ->
            spyOn(up, 'puts').and.callThrough()
            up.compiler('.foo', { priority: 10 }, u.noop)
            expect(up.puts).toHaveBeenCalled()
            expect(up.puts.calls.argsFor(0)[1]).toMatch(/will run for future fragments/i)

          it 'runs the compiler for future fragments, but not for current fragments (even if they match)', ->
            spy = jasmine.createSpy('compiler')
            element1 = up.hello fixture('.element')
            up.compiler('.element', { priority: 10 }, (element) -> spy(element))

            expect(spy).not.toHaveBeenCalled()

            element2 = up.hello fixture('.element')

            expect(spy).toHaveBeenCalledWith(element2)

        describe 'without { priority }', ->

          it 'prints no message explaining when the compiler will run', ->
            spyOn(up, 'puts').and.callThrough()
            up.compiler('.foo', u.noop)
            expect(up.puts).not.toHaveBeenCalled()

          it 'compiles current fragments', ->
            spy = jasmine.createSpy('compiler')
            element1 = up.hello fixture('.element')
            up.compiler('.element', (element) -> spy(element))

            expect(spy).toHaveBeenCalledWith(element1)

          it 'compiles current fragments on other layers', ->
            rootElement = fixture('.foo')
            makeLayers(2)
            overlayElement = up.layer.affix('.foo')

            expect(document.querySelectorAll('.foo').length).toBe(2)

            spy = jasmine.createSpy('compiler')
            up.compiler('.foo', (element) -> spy(element))

            expect(spy.calls.count()).toBe(2)
            expect(spy.calls.argsFor(0)[0]).toBe(rootElement)
            expect(spy.calls.argsFor(1)[0]).toBe(overlayElement)

          it 'does not compile elements twice if the new fragment contains a <script> that defines a new compiler', ->
            container = fixture('.container')
            element = e.affix(container, '.element', text: 'old text')

            window.compileSpy = jasmine.createSpy('compile spy')

            up.render fragment: """
              <div class="container">
                <div class="element">new text</div>
                <script>
                  up.compiler('.element', (element) => window.compileSpy(element))
                </script>
              </div>
            """

            expect(window.compileSpy.calls.count()).toBe(1)

            delete window.compileSpy

    if up.migrate.loaded
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

    if up.migrate.loaded
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

    describe 'up.data', ->

      describe 'when the element has an [up-data] attribute', ->

        it 'parses an object value serialized as JSON', ->
          element = fixture('.element', 'up-data': '{ "foo": 1, "bar": 2 }')
          data = up.data(element)

          expect(Object.keys(data)).toEqual(jasmine.arrayWithExactContents(['foo', 'bar']))
          expect(data.foo).toBe(1)
          expect(data.bar).toBe(2)

        it 'parses an array value serialized as JSON', ->
          element = fixture('.element', 'up-data': '["foo", "bar"]')
          data = up.data(element)

          expect(data).toEqual(['foo', 'bar'])

        it 'parses a string value serialized as JSON', ->
          element = fixture('.element', 'up-data': '"foo"')
          data = up.data(element)

          expect(data).toBe('foo')

      describe 'when the element has no [up-data] attribute', ->

        it 'returns a blank object', ->
          element = fixture('.element')
          data = up.data(element)

          expect(typeof data).toBe('object')
          expect(Object.keys(data)).toBeBlank()

        it "returns access to the element's vanilla [data-] attributes", ->
          element = fixture('.element', 'data-foo': 'foo value', 'data-bar': 'bar value')
          data = up.data(element)

          expect(data.foo).toBe('foo value')
          expect(data.bar).toBe('bar value')

        it 'allows to access [data-] attribute with camelCase keys', ->
          element = fixture('.element', 'data-foo-bar': 'value')
          data = up.data(element)

          expect(data.fooBar).toBe('value')

      describe 'when the element has both an [up-data] and vanilla [data-] attributes', ->

        it 'returns an object with properties from both', ->
          element = fixture('.element', 'data-foo': 'foo value', 'up-data': JSON.stringify(bar: 'bar value'))
          data = up.data(element)

          expect(data.foo).toBe('foo value')
          expect(data.bar).toBe('bar value')

        it 'allows to access [data-] attribute with camelCase keys', ->
          element = fixture('.element', 'data-foo-bar': 'value1', 'up-data': JSON.stringify(baz: 'value2'))
          data = up.data(element)

          expect(data.fooBar).toBe('value1')

        it 'supports the `in` operator', ->
          element = fixture('.element', 'data-foo': 'foo value', 'up-data': JSON.stringify(bar: 'bar value'))
          data = up.data(element)

          # The `in` operator is `of` in CoffeeScript
          # See https://makandracards.com/makandra/52454
          expect('foo' of data).toBe(true)
          expect('bar' of data).toBe(true)
          expect('baz' of data).toBe(false)

        it 'supports Object.keys()', ->
          element = fixture('.element', 'data-foo': 'foo value', 'up-data': JSON.stringify(bar: 'bar value'))
          data = up.data(element)

          expect(Object.keys(data)).toEqual(jasmine.arrayWithExactContents(['foo', 'bar']))

        it 'prefers properties from [up-data]', ->
          element = fixture('.element', 'data-foo': 'a', 'up-data': JSON.stringify(foo: 'b'))
          data = up.data(element)

          expect(data.foo).toBe('b')

        it 'allows to override a property from a [data-] attribute', ->
          element = fixture('.element', 'data-foo': 'a', 'up-data': JSON.stringify(foo: 'b'))
          data = up.data(element)

          data.foo = 'new a'

          expect(data.foo).toBe('new a')

        it 'allows to override a property from [up-data]', ->
          element = fixture('.element', 'data-foo': 'a', 'up-data': JSON.stringify(foo: 'b'))
          data = up.data(element)

          data.foo = 'overridden'

          expect(data.foo).toBe('overridden')

        it 'allows to delete a property from a [data-] attribute', ->
          element = fixture('.element', 'data-foo': 'a', 'up-data': JSON.stringify(bar: 'b'))
          data = up.data(element)

          data.foo = 'overridden'

          expect(data.foo).toBe('overridden')

        it 'allows to delete a property from [up-data]', ->
          element = fixture('.element', 'data-foo': 'a', 'up-data': JSON.stringify(foo: 'b'))
          data = up.data(element)

          delete data.foo

          expect(data.foo).toBeUndefined()
          expect('foo' of data).toBe(false)

        it 'allows to delete a property from a [data-] attribute', ->
          element = fixture('.element', 'data-foo': 'a', 'up-data': JSON.stringify(bar: 'b'))
          data = up.data(element)

          delete data.foo

          expect(data.foo).toBeUndefined()
          expect('foo' of data).toBe(false)

      describe 'when the element was compiled with a { data } option', ->

        it 'overrides properties from a [data-] attribute', ->
          element = fixture('.element', 'data-foo': 'a', 'data-bar': 'b')
          up.hello(element, data: { bar: 'c' })

          data = up.data(element)

          expect(data).toEqual(foo: 'a', bar: 'c')

        it 'overrides properties from an [up-data] attribute', ->
          element = fixture('.element', 'up-data': JSON.stringify(foo: 'a', bar: 'b'))
          up.hello(element, data: { bar: 'c' })

          data = up.data(element)

          expect(data).toEqual(foo: 'a', bar: 'c')

      it 'returns the same object for repeated calls, so we can use it as a state store', ->
        element = fixture('.element')
        data1 = up.data(element)
        data2 = up.data(element)

        expect(data1).toBe(data2)

    describe 'up.hello()', ->

      it 'calls compilers with the given element', ->
        compiler = jasmine.createSpy('compiler')
        up.compiler('.element', compiler)
        element = fixture('.element')

        up.hello(element)
        expect(compiler).toHaveBeenCalledWith(element, jasmine.anything(), jasmine.anything())

      it 'emits an up:fragment:inserted event', ->
        compiler = jasmine.createSpy('compiler')
        target = fixture('.element')
        listener = jasmine.createSpy('up:fragment:inserted listener')
        target.addEventListener('up:fragment:inserted', listener)

        up.hello(target, { origin })

        expectedEvent = jasmine.objectContaining({ target })
        expect(listener).toHaveBeenCalledWith(expectedEvent)

      it "sets up.layer.current to the given element's layer while compilers are running", asyncSpec (next) ->
        layerSpy = jasmine.createSpy('layer spy')
        up.compiler('.foo', -> layerSpy(up.layer.current))
        makeLayers(2)

        next ->
          rootElement = fixture('.foo.in-root')
          overlayElement = up.layer.get(1).affix('.foo.in-overlay')

          up.hello(rootElement)
          up.hello(overlayElement)

          expect(layerSpy.calls.count()).toBe(2)

          expect(layerSpy.calls.argsFor(0)[0]).toBe up.layer.get(0)
          expect(layerSpy.calls.argsFor(1)[0]).toBe up.layer.get(1)

      it 'keeps up.layer.current and does not crash when compiling a detached element (bugfix)', asyncSpec (next) ->
        layerSpy = jasmine.createSpy('layer spy')
        up.compiler('.foo', -> layerSpy(up.layer.current))
        makeLayers(2)

        next ->
          expect(up.layer.current.isOverlay()).toBe(true)

          element = up.element.createFromSelector('.foo')
          compileFn = -> up.hello(element)

          expect(compileFn).not.toThrowError()
          expect(layerSpy.calls.argsFor(0)[0]).toBe up.layer.current

      it 'does not re-compile elements when called multiple times', ->
        compiler = jasmine.createSpy('compiler')
        up.compiler('.element', compiler)
        element = fixture('.element')

        up.hello(element)
        up.hello(element)
        expect(compiler.calls.count()).toBe(1)

      it 'does not re-compile elements when their compiler is compiled afterwards', ->
        compiler = jasmine.createSpy('compiler')
        up.compiler('.element', compiler)
        container = fixture('.container')
        element = e.affix(container, '.element')

        up.hello(element)
        up.hello(container)
        expect(compiler.calls.count()).toBe(1)

      it "sets the compiled fragment's layer as layer.current, even if the fragment is not in the front layer"

      describe 'when a compiler throws an error', ->

        it 'emits an error event but does not throw an exception', ->
          compileError = new Error("error from crashing compiler")
          crashingCompiler = -> throw compileError
          up.compiler '.element', crashingCompiler
          element = fixture('.element')

          await jasmine.expectGlobalError compileError, ->
            hello = -> up.hello(element)
            expect(hello).not.toThrowError()

        it 'does not prevent other compilers from running', ->
          compilerBefore = jasmine.createSpy('compiler before')
          compileError = new Error("error from crashing compiler")
          crashingCompiler = -> throw compileError
          compilerAfter = jasmine.createSpy('compiler after')

          up.compiler '.element', compilerBefore
          up.compiler '.element', crashingCompiler
          up.compiler '.element', compilerAfter

          element = fixture('.element')

          await jasmine.expectGlobalError compileError, ->
            up.hello(element)

          expect(compilerBefore).toHaveBeenCalled()
          expect(compilerAfter).toHaveBeenCalled()

      describe 'data', ->

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
          parseDataSpy = spyOn(up.script, 'data').and.returnValue({})

          $child = $fixture(".child")

          up.compiler '.child', (element) -> # no-op
          up.hello($child)

          expect(parseDataSpy).not.toHaveBeenCalled()

        describe 'with { data } option', ->

          it 'allows to override an object parsed from a [up-data] attribute', ->
            observeArgs = jasmine.createSpy()
            up.compiler '.child', (element, data) ->
              observeArgs(element.className, data)

            data = { key1: 'value1', key2: 'value2' }

            $tag = $fixture(".child").attr('up-data', JSON.stringify(data))

            up.hello($tag[0], data: { key2: 'override-value2' })

            expect(observeArgs).toHaveBeenCalledWith('child', { key1: 'value1', key2: 'override-value2' })

        describe 'with { dataMap } option', ->

          it 'allows to override the [up-data] attribute of each matching element', ->
            observeArgs = jasmine.createSpy()
            up.compiler '.child', (element, data) -> observeArgs(element.id, data)

            fragment = fixture('.fragment')
            child1 = e.affix(fragment, '.child#child1', 'up-data': JSON.stringify(foo: 'default foo'))
            child2 = e.affix(fragment, '.child#child2', 'up-data': JSON.stringify(foo: 'default foo'))

            up.hello(fragment, dataMap: {
              '#child1': { foo: 'foo for child1' },
              '#child2': { foo: 'foo for child2' },
            })

            expect(observeArgs.calls.argsFor(0)).toEqual ['child1', foo: 'foo for child1']
            expect(observeArgs.calls.argsFor(1)).toEqual ['child2', foo: 'foo for child2']

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

    describe 'up.script.clean()', ->

      it 'allows compilers to return a function to call when the compiled element is cleaned', ->
        destructor = jasmine.createSpy('destructor')
        up.compiler '.child', (element) ->
          destructor

        container = fixture('.container .child')
        up.hello(container)
        expect(destructor).not.toHaveBeenCalled()

        up.script.clean(container)
        expect(destructor).toHaveBeenCalled()

      it 'allows compilers to return an array of functions to call when the compiled element is cleaned', ->
        destructor1 = jasmine.createSpy('destructor1')
        destructor2 = jasmine.createSpy('destructor2')
        up.compiler '.child', (element) ->
          [ destructor1, destructor2 ]

        container = fixture('.container .child')
        up.hello(container)

        up.script.clean(container)

        expect(destructor1).toHaveBeenCalled()
        expect(destructor2).toHaveBeenCalled()

      it "does not consider a returned array to be a destructor unless it's comprised entirely of functions", ->
        value1 = jasmine.createSpy('non-destructor')
        value2 = 'two'
        up.compiler '.child', (element) ->
          [ value1, value2 ]

        container = fixture('.container .child')
        up.hello(container)

        up.script.clean(container)

        expect(value1).not.toHaveBeenCalled()

      it 'runs all destructors if multiple compilers are applied to the same element', ->
        destructor1 = jasmine.createSpy('destructor1')
        up.compiler '.one', (element) -> destructor1
        destructor2 = jasmine.createSpy('destructor2')
        up.compiler '.two', (element) -> destructor2

        element = fixture('.one.two')
        up.hello(element)

        up.script.clean(element)

        expect(destructor1).toHaveBeenCalled()
        expect(destructor2).toHaveBeenCalled()

      it 'does not throw an error if both container and child have a destructor, and the container gets destroyed', ->
        up.compiler '.container', (element) ->
          return (->)

        up.compiler '.child', (element) ->
          return (->)

        container = fixture('.container .child')

        clean = -> up.script.clean(container)
        expect(clean).not.toThrowError()

      describe 'when a destructor throws an error', ->

        it 'emits an error event but does not throw', ->
          destroyError = new Error("error from crashing destructor")
          crashingDestructor = -> throw destroyError

          element = fixture('.element')
          up.destructor(element, crashingDestructor)

          await jasmine.expectGlobalError destroyError, ->
            clean = -> up.script.clean(element)
            expect(clean).not.toThrowError()

        it 'does not prevent other destructors from running', ->
          destructorBefore = jasmine.createSpy('destructor before')
          destroyError = new Error("error from crashing destructor")
          crashingDestructor = -> throw destroyError
          destructorAfter = jasmine.createSpy('destructor after')

          up.compiler '.element', -> return destructorBefore
          up.compiler '.element', -> return crashingDestructor
          up.compiler '.element', -> return destructorAfter

          element = fixture('.element')
          up.hello(element)

          await jasmine.expectGlobalError destroyError, ->
            up.script.clean(element)

          expect(destructorBefore).toHaveBeenCalled()
          expect(destructorAfter).toHaveBeenCalled()

    describe 'up.script.findAssets()', ->

      it 'finds a link[rel=stylesheet] in the head', ->
        link = e.affix(document.head, 'link[rel="stylesheet"][href="/styles.css"]')
        registerFixture(link)
        expect(up.script.findAssets()).toContain(link)

      it 'does not find a link[rel=stylesheet] in the body', ->
        link = e.affix(document.body, 'link[rel="stylesheet"][href="/styles.css"]')
        registerFixture(link)
        expect(up.script.findAssets()).not.toContain(link)

      it 'does not find a link[rel=alternate]', ->
        link = e.affix(document.body, 'link[rel="alternate"][type="application/rss+xml"][title="RSS Feed"][href="/feed"]')
        registerFixture(link)
        expect(up.script.findAssets()).not.toContain(link)

      it 'finds a script[src] in the head', ->
        link = e.affix(document.head, 'script[src="/foo.js"]')
        registerFixture(link)
        expect(up.script.findAssets()).toContain(link)

      it 'does not find a script[src] in the body', ->
        link = e.affix(document.body, 'script[src="/foo.js"]')
        registerFixture(link)
        expect(up.script.findAssets()).not.toContain(link)

      it 'does not find an inline script in the head', ->
        link = e.affix(document.head, 'script', text: 'console.log("hello from inline script")')
        registerFixture(link)
        expect(up.script.findAssets()).not.toContain(link)

      it 'finds an arbitrary element in the head with [up-asset]', ->
        base = e.affix(document.head, 'base[href="/pages"]')
        registerFixture(base)
        expect(up.script.findAssets()).toEqual []

        base.setAttribute('up-asset', '')
        expect(up.script.findAssets()).toEqual [base]

      it 'allows to opt out with [up-asset=false]', ->
        link = e.affix(document.head, 'link[rel="stylesheet"][href="/styles.css"][up-asset="false"]')
        registerFixture(link)
        expect(up.script.findAssets()).not.toContain(link)

      it 'allows to opt out by configuring up.script.config.noAssetSelectors', ->
        link = e.affix(document.head, 'link[rel="stylesheet"][href="/excluded.css"]')
        registerFixture(link)
        up.script.config.noAssetSelectors.push('link[href="/excluded.css"]')
        expect(up.script.findAssets()).not.toContain(link)

