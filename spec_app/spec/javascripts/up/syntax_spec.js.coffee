u = up.util
$ = jQuery

describe 'up.syntax', ->

  describe 'JavaScript functions', ->
  
    describe 'up.compiler', ->
      
      it 'applies an event initializer whenever a matching fragment is inserted', ->
        observeElement = jasmine.createSpy()
        up.compiler '.child', (element) -> observeElement(element)

        $container = affix('.container')
        $child = $container.affix('.child')
        $otherChild = $container.affix('.other-child')

        up.hello($container[0])
   
        expect(observeElement).not.toHaveBeenCalledWith($container[0])
        expect(observeElement).not.toHaveBeenCalledWith($otherChild[0])
        expect(observeElement).toHaveBeenCalledWith($child[0])

      describe 'destructors', ->

        it 'allows compilers to return a function to call when the compiled element is destroyed', asyncSpec (next) ->
          destructor = jasmine.createSpy('destructor')
          up.compiler '.child', (element) ->
            destructor

          up.hello(affix('.container .child')[0])

          next =>
            expect(destructor).not.toHaveBeenCalled()
            up.destroy('.container')

          next =>
            expect(destructor).toHaveBeenCalled()

        it 'allows compilers to return an array of functions to call when the compiled element is destroyed', asyncSpec (next) ->
          destructor1 = jasmine.createSpy('destructor1')
          destructor2 = jasmine.createSpy('destructor2')
          up.compiler '.child', (element) ->
            [ destructor1, destructor2 ]

          up.hello(affix('.container .child')[0])

          next =>
            expect(destructor1).not.toHaveBeenCalled()
            expect(destructor2).not.toHaveBeenCalled()

            up.destroy('.container')

          next =>
            expect(destructor1).toHaveBeenCalled()
            expect(destructor2).toHaveBeenCalled()

        it "does not consider a returned array to be a destructor unless it's comprised entirely of functions", asyncSpec (next) ->
          value1 = jasmine.createSpy('non-destructor')
          value2 = 'two'
          up.compiler '.child', (element) ->
            [ value1, value2 ]

          up.hello(affix('.container .child'))

          next =>
            expect(value1).not.toHaveBeenCalled()

            up.destroy('.container')

          next =>
            expect(value1).not.toHaveBeenCalled()

        it 'runs all destructors if multiple compilers are applied to the same element', asyncSpec (next) ->
          destructor1 = jasmine.createSpy('destructor1')
          up.compiler '.one', (element) -> destructor1
          destructor2 = jasmine.createSpy('destructor2')
          up.compiler '.two', (element) -> destructor2

          $element = affix('.one.two')
          up.hello($element)

          next =>
            expect(destructor1).not.toHaveBeenCalled()
            expect(destructor2).not.toHaveBeenCalled()

            up.destroy($element[0])

          next =>
            expect(destructor1).toHaveBeenCalled()
            expect(destructor2).toHaveBeenCalled()

        it 'does not throw an error if both container and child have a destructor, and the container gets destroyed', asyncSpec (next) ->
          up.compiler '.container', (element) ->
            return (->)

          up.compiler '.child', (element) ->
            return (->)

          promise = up.destroy('.container')

          promiseState(promise).then (result) ->
            expect(result.state).toEqual('fulfilled')

      describe 'passing of [up-data]', ->

        it 'parses an [up-data] attribute as JSON and passes the parsed object as a second argument to the compiler', ->
          observeArgs = jasmine.createSpy()
          up.compiler '.child', (element, data) ->
            observeArgs(element.className, data)

          data = { key1: 'value1', key2: 'value2' }

          $tag = affix(".child").attr('up-data', JSON.stringify(data))
          up.hello($tag[0])

          expect(observeArgs).toHaveBeenCalledWith('child', data)

        it 'passes an empty object as a second argument to the compiler if there is no [up-data] attribute', ->
          observeArgs = jasmine.createSpy()
          up.compiler '.child', (element, data) ->
            observeArgs(element.className, data)

          up.hello(affix(".child"))

          expect(observeArgs).toHaveBeenCalledWith('child', {})

        it 'does not parse an [up-data] attribute if the compiler function only takes a single argument', ->
          parseDataSpy = spyOn(up.syntax, 'data').and.returnValue({})

          $child = affix(".child")

          up.compiler '.child', (element) -> # no-op
          up.hello($child)

          expect(parseDataSpy).not.toHaveBeenCalled()

      it 'compiles multiple matching elements one-by-one', ->
        compiler = jasmine.createSpy('compiler')
        up.compiler '.foo', (element) -> compiler(element)
        $container = affix('.container')
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
          $container = affix('.container')
          first = $container.affix('.foo.first')[0]
          second = $container.affix('.foo.second')[0]
          up.hello($container)
          expect(compiler.calls.count()).toEqual(1)
          expect(compiler).toHaveBeenCalledWith([first, second])

        it 'throws an error if the batch compiler returns a destructor', ->
          destructor = ->
          up.compiler '.element', { batch: true }, (element) -> destructor
          $container = affix('.element')
          compile = -> up.hello($container)
          expect(compile).toThrowError(/cannot return destructor/i)

      describe 'with { keep } option', ->

        it 'adds an up-keep attribute to the fragment during compilation', ->

          up.compiler '.foo', { keep: true }, ->
          up.compiler '.bar', { }, ->
          up.compiler '.bar', { keep: false }, ->
          up.compiler '.bam', { keep: '.partner' }, ->

          $foo = $ up.hello(affix('.foo'))
          $bar = $ up.hello(affix('.bar'))
          $baz = $ up.hello(affix('.baz'))
          $bam = $ up.hello(affix('.bam'))

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
          up.hello(affix('.element'))
          expect(traces).toEqual ['bam', 'bar', 'foo', 'baz', 'qux']

        it 'considers priority-less compilers to be priority zero', ->
          traces = []
          up.compiler '.element', { priority: 1 }, -> traces.push('foo')
          up.compiler '.element', -> traces.push('bar')
          up.compiler '.element', { priority: -1 }, -> traces.push('baz')
          up.hello(affix('.element'))
          expect(traces).toEqual ['foo', 'bar', 'baz']

        it 'runs two compilers with the same priority in the order in which they were registered', ->
          traces = []
          up.compiler '.element', { priority: 1 }, -> traces.push('foo')
          up.compiler '.element', { priority: 1 }, -> traces.push('bar')
          up.hello(affix('.element'))
          expect(traces).toEqual ['foo', 'bar']

    describe 'up.macro', ->

      it 'registers compilers that are run before other compilers', ->
        traces = []
        up.compiler '.element', { priority: 10 }, -> traces.push('foo')
        up.compiler '.element', { priority: -1000 }, -> traces.push('bar')
        up.macro '.element', -> traces.push('baz')
        up.hello(affix('.element'))
        expect(traces).toEqual ['baz', 'foo' , 'bar']

      it 'allows to macros to have priorities of their own', ->
        traces = []
        up.macro '.element', { priority: 1 }, -> traces.push('foo')
        up.macro '.element', { priority: 2 }, -> traces.push('bar')
        up.macro '.element', { priority: 0 }, -> traces.push('baz')
        up.macro '.element', { priority: 3 }, -> traces.push('bam')
        up.macro '.element', { priority: -1 }, -> traces.push('qux')
        up.compiler '.element', { priority: 999 }, -> traces.push('ccc')
        up.hello(affix('.element'))
        expect(traces).toEqual ['bam', 'bar', 'foo', 'baz', 'qux', 'ccc']

      it 'runs two macros with the same priority in the order in which they were registered', ->
        traces = []
        up.macro '.element', { priority: 1 }, -> traces.push('foo')
        up.macro '.element', { priority: 1 }, -> traces.push('bar')
        up.hello(affix('.element'))
        expect(traces).toEqual ['foo', 'bar']

      it 'allows users to use the built-in [up-expand] from their own macros', ->
        up.macro '.element', (element) ->
          element.setAttribute('up-expand', '')
        $element = affix('.element a[href="/foo"][up-target=".target"]')
        up.hello($element)
        expect($element.attr('up-target')).toEqual('.target')
        expect($element.attr('up-href')).toEqual('/foo')

      it 'allows users to use the built-in [up-dash] from their own macros', ->
        up.macro '.element', (element) ->
          element.setAttribute('up-dash', '.target')
        $element = affix('a.element[href="/foo"]')
        up.hello($element)
        expect($element.attr('up-target')).toEqual('.target')
        expect($element.attr('up-preload')).toEqual('')
        expect($element.attr('up-instant')).toEqual('')

    describe 'up.hello', ->

      it 'should have tests'
      
    describe 'up.syntax.data', ->

      it 'returns the [up-data] attribute of the given element, parsed as JSON', ->
        $element = affix('.element').attr('up-data', '{ "foo": 1, "bar": 2 }')
        data = up.syntax.data($element)
        expect(data).toEqual(foo: 1, bar: 2)

      it 'returns en empty object if the given element has no [up-data] attribute', ->
        $element = affix('.element')
        data = up.syntax.data($element)
        expect(data).toEqual({})

      it 'returns undefined if undefined is passed instead of an element', ->
        data = up.syntax.data(undefined)
        expect(data).toBeUndefined()
