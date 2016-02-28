describe 'up.syntax', ->
  
  describe 'Javascript functions', ->
  
    describe 'up.compiler', ->
      
      it 'applies an event initializer whenever a matching fragment is inserted', ->
  
        observeClass = jasmine.createSpy()
        up.compiler '.child', ($element) ->
          observeClass($element.attr('class'))
  
        up.hello(affix('.container .child'))
   
        expect(observeClass).not.toHaveBeenCalledWith('container')
        expect(observeClass).toHaveBeenCalledWith('child')           
  

        destructor = jasmine.createSpy()
        up.compiler '.child', ($element) ->
          destructor
  
        up.hello(affix('.container .child'))
        expect(destructor).not.toHaveBeenCalled()
        
        up.destroy('.container')
        expect(destructor).toHaveBeenCalled()

      it 'parses an up-data attribute as JSON and passes the parsed object as a second argument to the initializer', ->

        observeArgs = jasmine.createSpy()
        up.compiler '.child', ($element, data) ->
          observeArgs($element.attr('class'), data)

        data = { key1: 'value1', key2: 'value2' }

        $tag = affix(".child").attr('up-data', JSON.stringify(data))
        up.hello($tag)

        expect(observeArgs).toHaveBeenCalledWith('child', data)

      it 'passes an empty object as a second argument to the initializer if there is no up-data attribute', ->

        observeArgs = jasmine.createSpy()
        up.compiler '.child', ($element, data) ->
          observeArgs($element.attr('class'), data)

        up.hello(affix(".child"))

        expect(observeArgs).toHaveBeenCalledWith('child', {})

      it 'compiles matching elements one-by-one', ->
        compiler = jasmine.createSpy('compiler')
        up.compiler '.foo', ($element) -> compiler($element)
        $container = affix('.container')
        $first = $container.affix('.foo.first')
        $second = $container.affix('.foo.second')
        up.hello($container)
        expect(compiler.calls.count()).toEqual(2)
        expect(compiler).toHaveBeenCalledWith($first)
        expect(compiler).toHaveBeenCalledWith($second)

      describe 'with { batch } option', ->

        it 'compiles all matching elements at once', ->
          compiler = jasmine.createSpy('compiler')
          up.compiler '.foo', { batch: true }, ($element) -> compiler($element)
          $container = affix('.container')
          $first = $container.affix('.foo.first')
          $second = $container.affix('.foo.second')
          $both = $first.add($second)
          up.hello($container)
          expect(compiler.calls.count()).toEqual(1)
          expect(compiler).toHaveBeenCalledWith($both)

      describe 'with { keep } option', ->

        it 'adds an up-keep attribute to the fragment during compilation', ->

          up.compiler '.foo', { keep: true }, ->
          up.compiler '.bar', { }, ->
          up.compiler '.bar', { keep: false }, ->
          up.compiler '.bam', { keep: '.partner' }, ->

          $foo = up.hello(affix('.foo'))
          $bar = up.hello(affix('.bar'))
          $baz = up.hello(affix('.baz'))
          $bam = up.hello(affix('.bam'))

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
          expect(traces).toEqual ['qux', 'baz', 'foo', 'bar', 'bam']

        it 'considers priority-less compilers to be priority zero', ->
          traces = []
          up.compiler '.element', { priority: 1 }, -> traces.push('foo')
          up.compiler '.element', -> traces.push('bar')
          up.compiler '.element', { priority: -1 }, -> traces.push('baz')
          up.hello(affix('.element'))
          expect(traces).toEqual ['baz', 'bar', 'foo']

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
        expect(traces).toEqual ['baz', 'bar' , 'foo']

      it 'allows to macros to have priorities of their own', ->
        traces = []
        up.macro '.element', { priority: 1 }, -> traces.push('foo')
        up.macro '.element', { priority: 2 }, -> traces.push('bar')
        up.macro '.element', { priority: 0 }, -> traces.push('baz')
        up.macro '.element', { priority: 3 }, -> traces.push('bam')
        up.macro '.element', { priority: -1 }, -> traces.push('qux')
        up.hello(affix('.element'))
        expect(traces).toEqual ['qux', 'baz', 'foo', 'bar', 'bam']

    describe 'up.hello', ->

      it 'should have tests'
      
     