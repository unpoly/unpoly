describe 'up.util', ->

  u = up.util

  describe 'JavaScript functions', ->

    describe 'up.util.previewable', ->

      it 'wraps a function into a proxy function with an additional .promise attribute', ->
        fun = -> 'return value'
        proxy = up.util.previewable(fun)
        expect(u.isFunction(proxy)).toBe(true)
        expect(u.isPromise(proxy.promise)).toBe(true)
        expect(proxy()).toEqual('return value')

      it "resolves the proxy's .promise when the inner function returns", (done) ->
        fun = -> 'return value'
        proxy = up.util.previewable(fun)
        callback = jasmine.createSpy('promise callback')
        proxy.promise.then(callback)
        u.nextFrame ->
          expect(callback).not.toHaveBeenCalled()
          proxy()
          u.nextFrame ->
            expect(callback).toHaveBeenCalledWith('return value')
            done()

      it "delays resolution of the proxy's .promise if the inner function returns a promise", (done) ->
        funDeferred = u.newDeferred()
        fun = -> funDeferred
        proxy = up.util.previewable(fun)
        callback = jasmine.createSpy('promise callback')
        proxy.promise.then(callback)
        proxy()
        u.nextFrame ->
          expect(callback).not.toHaveBeenCalled()
          funDeferred.resolve('return value')
          u.nextFrame ->
            expect(callback).toHaveBeenCalledWith('return value')
            done()

    describe 'up.util.DivertibleChain', ->

      it "instantiates a task queue whose (2..n)th tasks can be changed by calling '.asap'", (done) ->
        chain = new up.util.DivertibleChain()

        timer1Spy = jasmine.createSpy('timer1 has been called')
        timer1 = ->
          timer1Spy()
          u.promiseTimer(50)

        timer2Spy = jasmine.createSpy('timer2 has been called')
        timer2 = ->
          timer2Spy()
          u.promiseTimer(50)

        timer3Spy = jasmine.createSpy('timer3 has been called')
        timer3 = ->
          timer3Spy()
          u.promiseTimer(50)

        timer4Spy = jasmine.createSpy('timer4 has been called')
        timer4 = ->
          timer4Spy()
          u.promiseTimer(50)

        chain.asap(timer1)
        u.nextFrame ->
          expect(timer1Spy).toHaveBeenCalled()
          chain.asap(timer2)
          u.nextFrame ->
            # timer2 is still waiting for timer1 to finish
            expect(timer2Spy).not.toHaveBeenCalled()
            # Override the (2..n)th tasks. This unschedules timer2.
            chain.asap(timer3, timer4)
            u.setTimer 80, ->
              expect(timer2Spy).not.toHaveBeenCalled()
              expect(timer3Spy).toHaveBeenCalled()
              u.setTimer 70, ->
                expect(timer4Spy).toHaveBeenCalled()
                done()

    describe 'up.util.sequence', ->

      it 'combines the given functions into a single function', ->
        values = []
        one = -> values.push('one')
        two = -> values.push('two')
        three = -> values.push('three')
        sequence = up.util.sequence(one, two, three)
        expect(values).toEqual([])
        sequence()
        expect(values).toEqual(['one', 'two', 'three'])

    describe 'up.util.createElementFromHtml', ->

      it 'parses a string that contains a serialized HTML document', ->
        string = """
          <html lang="foo">
            <head>
              <title>document title</title>
            </head>
            <body data-env='production'>
              <div>line 1</div>
              <div>line 2</div>
            </body>
          </html>
          """

        element = up.util.createElementFromHtml(string)

        expect(element.querySelector('head title').textContent).toEqual('document title')
        expect(element.querySelector('body').getAttribute('data-env')).toEqual('production')
        expect(element.querySelectorAll('body div').length).toBe(2)
        expect(element.querySelectorAll('body div')[0].textContent).toEqual('line 1')
        expect(element.querySelectorAll('body div')[1].textContent).toEqual('line 2')

      it 'parses a string that contains carriage returns (bugfix)', ->
        string = """
          <html>\r
            <body>\r
              <div>line</div>\r
            </body>\r
          </html>\r
          """

        $element = up.util.createElementFromHtml(string)
        expect($element.querySelector('body')).toBeGiven()
        expect($element.querySelector('body div').textContent).toEqual('line')

      it 'does not run forever if a page has a <head> without a <title> (bugfix)', ->
        html = """
          <!doctype html>
          <html>
            <head>
              <meta charset="utf-8" />
          <meta name="format-detection" content="telephone=no">
          <link href='/images/favicon.png' rel='shortcut icon' type='image/png'>
          <meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1'>

              <base href="/examples/update-fragment/" />
              <link href='http://fonts.googleapis.com/css?family=Orbitron:400|Ubuntu+Mono:400,700|Source+Sans+Pro:300,400,700,400italic,700italic' rel='stylesheet' type='text/css'>
          <link href="//netdna.bootstrapcdn.com/font-awesome/4.1.0/css/font-awesome.min.css" rel="stylesheet">
              <link href="/stylesheets/example/all.css" rel="stylesheet" />
              <script src="/javascripts/example.js"></script>
            </head>
            <body>
              <div class="page">
                <div class="story">

            <h1>Full story</h1>
            <p>Lorem ipsum dolor sit amet.</p>

            <a href="preview.html" up-target=".story">
              Read summary
            </a>
          </div>

              </div>
            </body>
          </html>
          """
        element = up.util.createElementFromHtml(html)
        expect(element.querySelector("title")).toBeMissing()
        expect(element.querySelector("h1").textContent).toEqual('Full story')

      it 'can parse HTML without a <head>', ->
        html = """
          <html>
            <body>
              <h1>Full story</h1>
            </body>
          </html>
          """
        element = up.util.createElementFromHtml(html)
        expect(element.querySelector("title")).toBeMissing()
        expect(element.querySelector("h1").textContent).toEqual('Full story')

      it 'can parse a HTML fragment without a <body>', ->
        html = """
          <h1>Full story</h1>
          """
        element = up.util.createElementFromHtml(html)
        expect(element.querySelector("title")).toBeMissing()
        expect(element.querySelector("h1").textContent).toEqual('Full story')

    describe 'up.util.isFixed', ->

      it 'returns true if the given element or one of its ancestors has a "fixed" CSS position', ->
        $grandGrandParent = affix('.grand-parent')
        $grandParent = $grandGrandParent.affix('.grand-parent')
        $parent = $grandParent.affix('.parent')
        $child = $parent.affix('.child')
        $grandParent.css(position: 'fixed')
        expect(up.util.isFixed($child)).toBe(true)
        expect(up.util.isFixed($parent)).toBe(true)
        expect(up.util.isFixed($grandParent)).toBe(true)
        expect(up.util.isFixed($grandGrandParent)).toBe(false)

      it 'returns false if the given element and its ancestors all have a non-"fixed" CSS position', ->
        $element = affix('.element')
        expect(up.util.isFixed($element)).toBe(false)

    describe 'up.util.setTimer', ->

      it 'calls the given function after waiting the given milliseconds', (done) ->
        callback = jasmine.createSpy()
        expectNotCalled = -> expect(callback).not.toHaveBeenCalled()
        expectCalled = -> expect(callback).toHaveBeenCalled()

        up.util.setTimer(100, callback)

        expectNotCalled()
        setTimeout(expectNotCalled, 50)
        setTimeout(expectCalled, 50 + 75)
        setTimeout(done, 50 + 75)

      describe 'if the delay is zero', ->

        it 'calls the given function in the next execution frame', ->
          callback = jasmine.createSpy()
          up.util.setTimer(0, callback)
          expect(callback).not.toHaveBeenCalled()

          setTimeout((-> expect(callback).toHaveBeenCalled()), 0)

#    describe 'up.util.argNames', ->
#
#      it 'returns an array of argument names for the given function', ->
#        fun = ($element, data) ->
#        expect(up.util.argNames(fun)).toEqual(['$element', 'data'])

    describe 'up.util.trim', ->

      it 'removes leading and trailing whitespace from the given string', ->
        string = "\t\n\r abc \r\n\t"
        expect(up.util.trim(string)).toEqual('abc')

    describe 'up.util.only', ->

      it 'returns a copy of the given object with only the given whitelisted properties', ->
        original =
          foo: 'foo-value'
          bar: 'bar-value'
          baz: 'baz-value'
          bam: 'bam-value'
        whitelisted = up.util.only(original, 'bar', 'bam')
        expect(whitelisted).toEqual
          bar: 'bar-value'
          bam: 'bam-value'
        # Show that original did not change
        expect(original).toEqual
          foo: 'foo-value'
          bar: 'bar-value'
          baz: 'baz-value'
          bam: 'bam-value'

    describe 'up.util.except', ->

      it 'returns a copy of the given object but omits the given blacklisted properties', ->
        original =
          foo: 'foo-value'
          bar: 'bar-value'
          baz: 'baz-value'
          bam: 'bam-value'
        whitelisted = up.util.except(original, 'foo', 'baz')
        expect(whitelisted).toEqual
          bar: 'bar-value'
          bam: 'bam-value'
        # Show that original did not change
        expect(original).toEqual
          foo: 'foo-value'
          bar: 'bar-value'
          baz: 'baz-value'
          bam: 'bam-value'

    describe 'up.util.selectorForElement', ->

      it "prefers using the element's 'up-id' attribute to using the element's ID", ->
        $element = affix('div[up-id=up-id-value]#id-value')
        expect(up.util.selectorForElement($element)).toBe("[up-id='up-id-value']")

      it "prefers using the element's ID to using the element's name", ->
        $element = affix('div#id-value[name=name-value]')
        expect(up.util.selectorForElement($element)).toBe("#id-value")

      it "prefers using the element's name to using the element's classes", ->
        $element = affix('div[name=name-value].class1.class2')
        expect(up.util.selectorForElement($element)).toBe("[name='name-value']")

      it "prefers using the element's classes to using the element's tag name", ->
        $element = affix('div.class1.class2')
        expect(up.util.selectorForElement($element)).toBe(".class1.class2")

      it "uses the element's tag name if no better description is available", ->
        $element = affix('div')
        expect(up.util.selectorForElement($element)).toBe("div")


    describe 'up.util.castedAttr', ->

      it 'returns true if the attribute value is the string "true"', ->
        $element = affix('div').attr('foo', 'true')
        expect(up.util.castedAttr($element, 'foo')).toBe(true)

      it 'returns false if the attribute value is the string "false"', ->
        $element = affix('div').attr('foo', 'false')
        expect(up.util.castedAttr($element, 'foo')).toBe(false)

      it 'returns undefined if the element has no such attribute', ->
        $element = affix('div')
        expect(up.util.castedAttr($element, 'foo')).toBe(undefined)

      it 'returns the attribute value unchanged if the value is some string', ->
        $element = affix('div').attr('foo', 'some text')
        expect(up.util.castedAttr($element, 'foo')).toBe('some text')

    describe 'up.util.any', ->

      it 'returns true if an element in the array returns true for the given function', ->
        result = up.util.any [null, undefined, 'foo', ''], up.util.isPresent
        expect(result).toBe(true)

      it 'returns false if no element in the array returns true for the given function', ->
        result = up.util.any [null, undefined, ''], up.util.isPresent
        expect(result).toBe(false)

      it 'short-circuits once an element returns true', ->
        count = 0
        up.util.any [null, undefined, 'foo', ''], (element) ->
          count += 1
          up.util.isPresent(element)
        expect(count).toBe(3)

    describe 'up.util.all', ->

      it 'returns true if all element in the array returns true for the given function', ->
        result = up.util.all ['foo', 'bar', 'baz'], up.util.isPresent
        expect(result).toBe(true)

      it 'returns false if an element in the array returns false for the given function', ->
        result = up.util.all ['foo', 'bar', null, 'baz'], up.util.isPresent
        expect(result).toBe(false)

      it 'short-circuits once an element returns false', ->
        count = 0
        up.util.all ['foo', 'bar', '', 'baz'], (element) ->
          count += 1
          up.util.isPresent(element)
        expect(count).toBe(3)

    describe 'up.util.isBlank', ->

      it 'returns false for false', ->
        expect(up.util.isBlank(false)).toBe(false)

      it 'returns false for true', ->
        expect(up.util.isBlank(true)).toBe(false)

      it 'returns true for null', ->
        expect(up.util.isBlank(null)).toBe(true)

      it 'returns true for undefined', ->
        expect(up.util.isBlank(undefined)).toBe(true)

      it 'returns true for an empty String', ->
        expect(up.util.isBlank('')).toBe(true)

      it 'returns false for a String with at least one character', ->
        expect(up.util.isBlank('string')).toBe(false)

      it 'returns true for an empty array', ->
        expect(up.util.isBlank([])).toBe(true)

      it 'returns false for an array with at least one element', ->
        expect(up.util.isBlank(['element'])).toBe(false)

      it 'returns true for an empty jQuery collection', ->
        expect(up.util.isBlank($([]))).toBe(true)

      it 'returns false for a jQuery collection with at least one element', ->
        expect(up.util.isBlank($('body'))).toBe(false)

      it 'returns true for an empty object', ->
        expect(up.util.isBlank({})).toBe(true)

      it 'returns true for an object with at least one key', ->
        expect(up.util.isBlank({key: 'value'})).toBe(false)

    describe 'up.util.normalizeUrl', ->

      it 'normalizes a relative path', ->
        expect(up.util.normalizeUrl('foo')).toBe("http://#{location.hostname}:#{location.port}/foo")

      it 'normalizes an absolute path', ->
        expect(up.util.normalizeUrl('/foo')).toBe("http://#{location.hostname}:#{location.port}/foo")

      it 'normalizes a full URL', ->
        expect(up.util.normalizeUrl('http://example.com/foo/bar')).toBe('http://example.com/foo/bar')

      it 'does not strip a trailing slash by default', ->
        expect(up.util.normalizeUrl('/foo/')).toEqual("http://#{location.hostname}:#{location.port}/foo/")

      it 'normalizes redundant segments', ->
        expect(up.util.normalizeUrl('/foo/../foo')).toBe("http://#{location.hostname}:#{location.port}/foo")

    describe 'up.util.detect', ->

      it 'finds the first element in the given array that matches the given tester', ->
        array = ['foo', 'bar', 'baz']
        tester = (element) -> element[0] == 'b'
        expect(up.util.detect(array, tester)).toEqual('bar')

      it "returns undefined if the given array doesn't contain a matching element", ->
        array = ['foo', 'bar', 'baz']
        tester = (element) -> element[0] == 'z'
        expect(up.util.detect(array, tester)).toBeUndefined()

    describe 'up.util.config', ->

      it 'creates an object with the given attributes', ->
        object = up.util.config(a: 1, b: 2)
        expect(object.a).toBe(1)
        expect(object.b).toBe(2)

      it 'does not allow to set a key that was not included in the factory settings', ->
        object = up.util.config(a: 1)
        object.b = 2
        expect(object.b).toBeUndefined()

      describe '#reset', ->

        it 'resets the object to its original state', ->
          object = up.util.config(a: 1)
          expect(object.b).toBeUndefined()
          object.a = 2
          expect(object.a).toBe(2)
          object.reset()
          expect(object.a).toBe(1)

        it 'does not remove the #reset or #update method from the object', ->
          object = up.util.config(a: 1)
          object.b = 2
          object.reset()
          expect(object.reset).toBeDefined()

    describe 'up.util.remove', ->

      it 'removes the given string from the given array', ->
        array = ['a', 'b', 'c']
        up.util.remove(array, 'b')
        expect(array).toEqual ['a', 'c']

      it 'removes the given object from the given array', ->
        obj1 = { 'key': 1 }
        obj2 = { 'key': 2 }
        obj3 = { 'key': 3 }
        array = [obj1, obj2, obj3]
        up.util.remove(array, obj2)
        expect(array).toEqual [obj1, obj3]


    describe 'up.util.requestDataAsQuery', ->

      encodedOpeningBracket = '%5B'
      encodedClosingBracket = '%5D'
      encodedSpace = '%20'

      it 'returns the query section for the given object', ->
        string = up.util.requestDataAsQuery('foo-key': 'foo value', 'bar-key': 'bar value')
        expect(string).toEqual("foo-key=foo#{encodedSpace}value&bar-key=bar#{encodedSpace}value")

      it 'returns the query section for the given nested object', ->
        string = up.util.requestDataAsQuery('foo-key': { 'bar-key': 'bar-value' }, 'bam-key': 'bam-value')
        expect(string).toEqual("foo-key#{encodedOpeningBracket}bar-key#{encodedClosingBracket}=bar-value&bam-key=bam-value")

      it 'returns the query section for the given array with { name } and { value } keys', ->
        string = up.util.requestDataAsQuery([
          { name: 'foo-key', value: 'foo value' },
          { name: 'bar-key', value: 'bar value' }
        ])
        expect(string).toEqual("foo-key=foo#{encodedSpace}value&bar-key=bar#{encodedSpace}value")

      it 'returns an empty string for an empty object', ->
        string = up.util.requestDataAsQuery({})
        expect(string).toEqual('')

      it 'returns an empty string for an empty string', ->
        string = up.util.requestDataAsQuery('')
        expect(string).toEqual('')

      it 'returns an empty string for undefined', ->
        string = up.util.requestDataAsQuery(undefined)
        expect(string).toEqual('')

      it 'URL-encodes characters in the key and value', ->
        string = up.util.requestDataAsQuery({ 'äpfel': 'bäume' })
        expect(string).toEqual('%C3%A4pfel=b%C3%A4ume')

      it 'URL-encodes plus characters', ->
        string = up.util.requestDataAsQuery({ 'my+key': 'my+value' })
        expect(string).toEqual('my%2Bkey=my%2Bvalue')

    describe 'up.util.unresolvablePromise', ->

      it 'return a pending promise', (done) ->
        promise = up.util.unresolvablePromise()
        promiseState2(promise).then (result) ->
          expect(result.state).toEqual('pending')
          done()

      it 'returns a different object every time (to prevent memory leaks)', ->
        one = up.util.unresolvablePromise()
        two = up.util.unresolvablePromise()
        expect(one).not.toBe(two)

    describe 'up.util.requestDataAsArray', ->

      it 'normalized null to an empty array', ->
        array = up.util.requestDataAsArray(null)
        expect(array).toEqual([])

      it 'normalized undefined to an empty array', ->
        array = up.util.requestDataAsArray(undefined)
        expect(array).toEqual([])

      it 'normalizes an object hash to an array of objects with { name } and { value } keys', ->
        array = up.util.requestDataAsArray(
          'foo-key': 'foo-value'
          'bar-key': 'bar-value'
        )
        expect(array).toEqual([
          { name: 'foo-key', value: 'foo-value' },
          { name: 'bar-key', value: 'bar-value' },
        ])

      it 'normalizes a nested object hash to a flat array using param naming conventions', ->
        array = up.util.requestDataAsArray(
          'foo-key': 'foo-value'
          'bar-key': {
            'bam-key': 'bam-value'
            'baz-key': {
              'qux-key': 'qux-value'
            }
          }
        )
        expect(array).toEqual([
          { name: 'foo-key', value: 'foo-value' },
          { name: 'bar-key[bam-key]', value: 'bam-value' },
          { name: 'bar-key[baz-key][qux-key]', value: 'qux-value' },
        ])

      it 'returns a given array without modification', ->
        array = up.util.requestDataAsArray([
          { name: 'foo-key', value: 'foo-value' },
          { name: 'bar-key', value: 'bar-value' },
        ])
        expect(array).toEqual([
          { name: 'foo-key', value: 'foo-value' },
          { name: 'bar-key', value: 'bar-value' },
        ])

      it 'does not URL-encode special characters keys or values', ->
        array = up.util.requestDataAsArray(
          'äpfel': { 'bäume': 'börse' }
        )
        expect(array).toEqual([
          { name: 'äpfel[bäume]', value: 'börse' },
        ])

      it 'does not URL-encode spaces in keys or values', ->
        array = up.util.requestDataAsArray(
          'my key': 'my value'
        )
        expect(array).toEqual([
          { name: 'my key', value: 'my value' },
        ])

      it 'does not URL-encode ampersands in keys or values', ->
        array = up.util.requestDataAsArray(
          'my&key': 'my&value'
        )
        expect(array).toEqual([
          { name: 'my&key', value: 'my&value' },
        ])

      it 'does not URL-encode equal signs in keys or values', ->
        array = up.util.requestDataAsArray(
          'my=key': 'my=value'
        )
        expect(array).toEqual([
          { name: 'my=key', value: 'my=value' },
        ])

    describe 'up.util.flatten', ->

      it 'flattens the given array', ->
        array = [1, [2, 3], 4]
        expect(u.flatten(array)).toEqual([1, 2, 3, 4])

      it 'only flattens one level deep for performance reasons', ->
        array = [1, [2, [3,4]], 5]
        expect(u.flatten(array)).toEqual([1, 2, [3, 4], 5])

    describe 'up.util.renameKey', ->

      it 'renames a key in the given property', ->
        object = { a: 'a value', b: 'b value'}
        u.renameKey(object, 'a', 'c')
        expect(object.a).toBeUndefined()
        expect(object.b).toBe('b value')
        expect(object.c).toBe('a value')

    describe 'up.util.selectInSubtree', ->

      it 'finds the selector in ancestors and descendants of the given element', ->
        $grandMother = affix('.grand-mother.match')
        $mother = $grandMother.affix('.mother')
        $element = $mother.affix('.element')
        $child = $element.affix('.child.match')
        $grandChild = $child.affix('.grand-child.match')

        $matches = up.util.selectInSubtree($element, '.match')
        $expected = $child.add($grandChild)
        expect($matches).toEqual $expected

      it 'finds the element itself if it matches the selector', ->
        $element = affix('.element.match')
        $matches = up.util.selectInSubtree($element, '.match')
        expect($matches).toEqual $element

      describe 'when given a jQuery collection with multiple elements', ->

        it 'searches in a all subtrees of the given elements', ->
          $a_grandMother = affix('.grand-mother.match')
          $a_mother = $a_grandMother.affix('.mother')
          $a_element = $a_mother.affix('.element')
          $a_child = $a_element.affix('.child.match')
          $a_grandChild = $a_child.affix('.grand-child.match')

          $b_grandMother = affix('.grand-mother.match')
          $b_mother = $b_grandMother.affix('.mother')
          $b_element = $b_mother.affix('.element')
          $b_child = $b_element.affix('.child.match')
          $b_grandChild = $b_child.affix('.grand-child.match')

          $matches = up.util.selectInSubtree($a_element.add($b_element), '.match')
          expect($matches).toEqual $a_child.add($a_grandChild).add($b_child).add($b_grandChild)


    describe 'up.util.selectInDynasty', ->

      it 'finds the selector in both ancestors and descendants of the given element', ->
        $grandMother = affix('.grand-mother.match')
        $mother = $grandMother.affix('.mother')
        $element = $mother.affix('.element')
        $child = $element.affix('.child.match')
        $grandChild = $child.affix('.grand-child.match')

        $matches = up.util.selectInDynasty($element, '.match')
        $expected = $grandMother.add($child).add($grandChild)
        expect($matches).toEqual $expected

      it 'finds the element itself if it matches the selector', ->
        $element = affix('.element.match')
        $matches = up.util.selectInDynasty($element, '.match')
        expect($matches).toEqual $element

    describe 'up.util.isCrossDomain', ->

      it 'returns false for an absolute path', ->
        expect(up.util.isCrossDomain('/foo')).toBe(false)

      it 'returns false for an relative path', ->
        expect(up.util.isCrossDomain('foo')).toBe(false)

      it 'returns false for a fully qualified URL with the same protocol and hostname as the current location', ->
        fullUrl = "#{location.protocol}//#{location.host}/foo"
        expect(up.util.isCrossDomain(fullUrl)).toBe(false)

      it 'returns true for a fully qualified URL with a different protocol than the current location', ->
        fullUrl = "otherprotocol://#{location.host}/foo"
        expect(up.util.isCrossDomain(fullUrl)).toBe(true)

      it 'returns false for a fully qualified URL with a different hostname than the current location', ->
        fullUrl = "#{location.protocol}//other-host.tld/foo"
        expect(up.util.isCrossDomain(fullUrl)).toBe(true)

    describe 'up.util.isOptions', ->

      it 'returns true for an Object instance', ->
        expect(up.util.isOptions(new Object())).toBe(true)

      it 'returns true for an object literal', ->
        expect(up.util.isOptions({ foo: 'bar'})).toBe(true)

      it 'returns false for undefined', ->
        expect(up.util.isOptions(undefined)).toBe(false)

      it 'returns false for null', ->
        expect(up.util.isOptions(null)).toBe(false)

      it 'returns false for a function (which is technically an object)', ->
        fn = -> 'foo'
        fn.key = 'value'
        expect(up.util.isOptions(fn)).toBe(false)

      it 'returns false for an array', ->
        expect(up.util.isOptions(['foo'])).toBe(false)

      it 'returns false for a jQuery collection', ->
        expect(up.util.isOptions($('body'))).toBe(false)

      it 'returns false for a promise', ->
        expect(up.util.isOptions(Promise.resolve())).toBe(false)

      it 'returns false for a FormData object', ->
        expect(up.util.isOptions(new FormData())).toBe(false)

    describe 'up.util.isObject', ->

      it 'returns true for an Object instance', ->
        expect(up.util.isObject(new Object())).toBe(true)

      it 'returns true for an object literal', ->
        expect(up.util.isObject({ foo: 'bar'})).toBe(true)

      it 'returns false for undefined', ->
        expect(up.util.isObject(undefined)).toBe(false)

      it 'returns false for null', ->
        expect(up.util.isObject(null)).toBe(false)

      it 'returns true for a function (which is technically an object)', ->
        fn = -> 'foo'
        fn.key = 'value'
        expect(up.util.isObject(fn)).toBe(true)

      it 'returns true for an array', ->
        expect(up.util.isObject(['foo'])).toBe(true)

      it 'returns true for a jQuery collection', ->
        expect(up.util.isObject($('body'))).toBe(true)

      it 'returns true for a promise', ->
        expect(up.util.isObject(Promise.resolve())).toBe(true)

      it 'returns true for a FormData object', ->
        expect(up.util.isObject(new FormData())).toBe(true)

    describe 'up.util.memoize', ->

      it 'returns a function that calls the memoized function', ->
        fun = (a, b) -> a + b
        memoized = u.memoize(fun)
        expect(memoized(2, 3)).toEqual(5)

      it 'returns the cached return value of the first call when called again', ->
        spy = jasmine.createSpy().and.returnValue(5)
        memoized = u.memoize(spy)
        expect(memoized(2, 3)).toEqual(5)
        expect(memoized(2, 3)).toEqual(5)
        expect(spy.calls.count()).toEqual(1)

    ['assign', 'assignPolyfill'].forEach (assignVariant) ->

      describe "up.util.#{assignVariant}", ->

        assign = up.util[assignVariant]

        it 'copies the second object into the first object', ->
          target = { a: 1 }
          source = { b: 2, c: 3 }

          assign(target, source)

          expect(target).toEqual { a: 1, b: 2, c: 3 }

          # Source is unchanged
          expect(source).toEqual { b: 2, c: 3 }

        it 'copies null property values', ->
          target = { a: 1, b: 2 }
          source = { b: null }

          assign(target, source)

          expect(target).toEqual { a: 1, b: null }

        it 'copies undefined property values', ->
          target = { a: 1, b: 2 }
          source = { b: undefined }

          assign(target, source)

          expect(target).toEqual { a: 1, b: undefined }

        it 'returns the first object', ->
          target = { a: 1 }
          source = { b: 2 }

          result = assign(target, source)

          expect(result).toBe(target)

        it 'takes multiple sources to copy from', ->
          target = { a: 1 }
          source1 = { b: 2, c: 3 }
          source2 = { d: 4, e: 5 }

          assign(target, source1, source2)

          expect(target).toEqual { a: 1, b: 2, c: 3, d: 4, e: 5 }


