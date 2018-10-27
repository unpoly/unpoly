describe 'up.util', ->

  u = up.util

  describe 'JavaScript functions', ->

#    describe 'up.util.flatMap', ->
#
#      it 'collects the Array results of the given map function, then concatenates the result arrays into one flat array', ->
#        fun = (x) -> [x, x]
#        result = up.util.flatMap([1, 2, 3], fun)
#        expect(result).toEqual([1, 1, 2, 2, 3, 3])

    describe 'up.util.uniq', ->

      it 'returns the given array with duplicates elements removed', ->
        input = [1, 2, 1, 1, 3]
        result = up.util.uniq(input)
        expect(result).toEqual [1, 2, 3]

      it 'works on DOM elements', ->
        one = document.createElement("div")
        two = document.createElement("div")
        input = [one, one, two, two]
        result = up.util.uniq(input)
        expect(result).toEqual [one, two]

      it 'preserves insertion order', ->
        input = [1, 2, 1]
        result = up.util.uniq(input)
        expect(result).toEqual [1, 2]

    describe 'up.util.uniqBy', ->

      it 'returns the given array with duplicate elements removed, calling the given function to determine value for uniqueness', ->
        input = ["foo", "bar", "apple", 'orange', 'banana']
        result = up.util.uniqBy(input, (element) -> element.length)
        expect(result).toEqual ['foo', 'apple', 'orange']

      it 'accepts a property name instead of a function, which collects that property from each item to compute uniquness', ->
        input = ["foo", "bar", "apple", 'orange', 'banana']
        result = up.util.uniqBy(input, 'length')
        expect(result).toEqual ['foo', 'apple', 'orange']

#    describe 'up.util.parsePath', ->
#
#      it 'parses a plain name', ->
#        path = up.util.parsePath("foo")
#        expect(path).toEqual ['foo']
#
#      it 'considers underscores to be part of a name', ->
#        path = up.util.parsePath("foo_bar")
#        expect(path).toEqual ['foo_bar']
#
#      it 'considers dashes to be part of a name', ->
#        path = up.util.parsePath("foo-bar")
#        expect(path).toEqual ['foo-bar']
#
#      it 'parses dot-separated names into multiple path segments', ->
#        path = up.util.parsePath('foo.bar.baz')
#        expect(path).toEqual ['foo', 'bar', 'baz']
#
#      it 'parses nested params notation with square brackets', ->
#        path = up.util.parsePath('user[account][email]')
#        expect(path).toEqual ['user', 'account', 'email']
#
#      it 'parses double quotes in square brackets', ->
#        path = up.util.parsePath('user["account"]["email"]')
#        expect(path).toEqual ['user', 'account', 'email']
#
#      it 'parses single quotes in square brackets', ->
#        path = up.util.parsePath("user['account']['email']")
#        expect(path).toEqual ['user', 'account', 'email']
#
#      it 'allows square brackets inside quotes', ->
#        path = up.util.parsePath("element['a[up-href]']")
#        expect(path).toEqual ['element', 'a[up-href]']
#
#      it 'allows single quotes inside double quotes', ->
#        path = up.util.parsePath("element[\"a[up-href='foo']\"]")
#        expect(path).toEqual ['element', "a[up-href='foo']"]
#
#      it 'allows double quotes inside single quotes', ->
#        path = up.util.parsePath("element['a[up-href=\"foo\"]']")
#        expect(path).toEqual ['element', 'a[up-href="foo"]']
#
#      it 'allows dots in square brackets when it is quoted', ->
#        path = up.util.parsePath('elements[".foo"]')
#        expect(path).toEqual ['elements', '.foo']
#
#      it 'allows different notation for each segment', ->
#        path = up.util.parsePath('foo.bar[baz]["bam"][\'qux\']')
#        expect(path).toEqual ['foo', 'bar', 'baz', 'bam', 'qux']

    describe 'up.util.map', ->

      it 'creates a new array of values by calling the given function on each item of the given array', ->
        array = ["apple", "orange", "cucumber"]
        mapped = up.util.map(array, (element) -> element.length)
        expect(mapped).toEqual [5, 6, 8]

      it 'accepts a property name instead of a function, which collects that property from each item', ->
        array = ["apple", "orange", "cucumber"]
        mapped = up.util.map(array, 'length')
        expect(mapped).toEqual [5, 6, 8]

      it 'passes the iteration index as second argument to the given function', ->
        array = ["apple", "orange", "cucumber"]
        mapped = up.util.map(array, (element, i) -> i)
        expect(mapped).toEqual [0, 1, 2]

    describe 'up.util.each', ->

      it 'calls the given function once for each itm of the given array', ->
        args = []
        array = ["apple", "orange", "cucumber"]
        up.util.each array, (item) -> args.push(item)
        expect(args).toEqual ["apple", "orange", "cucumber"]

      it 'passes the iteration index as second argument to the given function', ->
        args = []
        array = ["apple", "orange", "cucumber"]
        up.util.each array, (item, index) -> args.push(index)
        expect(args).toEqual [0, 1, 2]

    describe 'up.util.select', ->

      it 'returns an array of those elements in the given array for which the given function returns true', ->
        array = ["foo", "orange", "cucumber"]
        results = up.util.select array, (item) -> item.length > 3
        expect(results).toEqual ['orange', 'cucumber']

      it 'passes the iteration index as second argument to the given function', ->
        array = ["apple", "orange", "cucumber", "banana"]
        results = up.util.select array, (item, index) -> index % 2 == 0
        expect(results).toEqual ['apple', 'cucumber']

      it 'accepts a property name instead of a function, which checks that property from each item', ->
        array = [ { name: 'a', prop: false }, { name: 'b', prop: true } ]
        results = up.util.select array, 'prop'
        expect(results).toEqual [{ name: 'b', prop: true }]

    describe 'up.util.reject', ->

      it 'returns an array of those elements in the given array for which the given function returns false', ->
        array = ["foo", "orange", "cucumber"]
        results = up.util.reject array, (item) -> item.length < 4
        expect(results).toEqual ['orange', 'cucumber']

      it 'passes the iteration index as second argument to the given function', ->
        array = ["apple", "orange", "cucumber", "banana"]
        results = up.util.reject array, (item, index) -> index % 2 == 0
        expect(results).toEqual ['orange', 'banana']

      it 'accepts a property name instead of a function, which checks that property from each item', ->
        array = [ { name: 'a', prop: false }, { name: 'b', prop: true } ]
        results = up.util.reject array, 'prop'
        expect(results).toEqual [{ name: 'a', prop: false }]

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

    describe 'up.util.kebabCase', ->

      it 'converts a string of multiple words from camel-case to kebap-case', ->
        result = up.util.kebabCase('fooBarBaz')
        expect(result).toEqual('foo-bar-baz')

      it 'does not change a single word', ->
        result = up.util.kebabCase('foo')
        expect(result).toEqual('foo')

      it 'downcases the first word when it starts with a capital letter', ->
        result = up.util.kebabCase('FooBar')
        expect(result).toEqual('foo-bar')

      it 'does not change a string that is already in kebab-case', ->
        result = up.util.kebabCase('foo-bar-baz')
        expect(result).toEqual('foo-bar-baz')

    describe 'up.util.camelCase', ->

      it 'converts a string of multiple words from kebap-case to camel-case', ->
        result = up.util.camelCase('foo-bar-baz')
        expect(result).toEqual('fooBarBaz')

      it 'does not change a single word', ->
        result = up.util.camelCase('foo')
        expect(result).toEqual('foo')

      it 'downcases the first word when it starts with a capital letter', ->
        result = up.util.camelCase('Foo-Bar')
        expect(result).toEqual('fooBar')

      it 'does not change a string that is already in camel-case', ->
        result = up.util.camelCase('fooBarBaz')
        expect(result).toEqual('fooBarBaz')

    describe 'up.util.kebabCaseKeys', ->

      it "converts the given object's keys from camel-case to kebab-case", ->
        input =
          fooBar: 'one'
          barBaz: 'two'
        result = up.util.kebabCaseKeys(input)
        expect(result).toEqual
          'foo-bar': 'one'
          'bar-baz': 'two'

      it "does not change an object whose keys are already kebab-case", ->
        input =
          'foo-bar': 'one'
          'bar-baz': 'two'
        result = up.util.kebabCaseKeys(input)
        expect(result).toEqual
          'foo-bar': 'one'
          'bar-baz': 'two'

    describe 'up.util.camelCaseKeys', ->

      it "converts the given object's keys from kebab-case to camel-case", ->
        input =
          'foo-bar': 'one'
          'bar-baz': 'two'
        result = up.util.camelCaseKeys(input)
        expect(result).toEqual
          fooBar: 'one'
          barBaz: 'two'

      it "does not change an object whose keys are already camel-case", ->
        input =
          fooBar: 'one'
          barBaz: 'two'
        result = up.util.camelCaseKeys(input)
        expect(result).toEqual
          fooBar: 'one'
          barBaz: 'two'

#    describe 'up.util.lowerCaseKeys', ->
#
#      it "returns a copy of the given object will all keys in lower case", ->
#        input =
#          'A-B': 'C-D'
#          'E-F': 'G-H'
#        result = up.util.lowerCaseKeys(input)
#        expect(result).toEqual
#          'a-b': 'C-D'
#          'e-f': 'G-H'

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

      it 'does not add empty keys to the returned object if the given object does not have that key', ->
        original =
          foo: 'foo-value'
        whitelisted = up.util.only(original, 'foo', 'bar')
        expect(whitelisted).toHaveOwnProperty('foo')
        expect(whitelisted).not.toHaveOwnProperty('bar')

    describe 'up.util.readInlineStyle', ->
      
      describe 'with a string as second argument', ->

        it 'returns a CSS value string from an inline [style] attribute', ->
          $div = affix('div').attr('style', 'background-color: #ff0000')
          style = up.util.readInlineStyle($div, 'backgroundColor')
          # Browsers convert colors to rgb() values, even IE11
          expect(style).toEqual('rgb(255, 0, 0)')

        it 'returns a blank value if the element does not have the given property in the [style] attribute', ->
          $div = affix('div').attr('style', 'background-color: red')
          style = up.util.readInlineStyle($div, 'color')
          expect(style).toBeBlank()

        it 'returns a blank value the given property is a computed property, but not in the [style] attribute', ->
          $div = affix('div[class="red-background"]')
          inlineStyle = up.util.readInlineStyle($div, 'backgroundColor')
          computedStyle = up.util.readComputedStyle($div, 'backgroundColor')
          expect(computedStyle).toEqual('rgb(255, 0, 0)')
          expect(inlineStyle).toBeBlank()

      describe 'with an array as second argument', ->

        it 'returns an object with the given inline [style] properties', ->
          $div = affix('div').attr('style', 'background-color: #ff0000; color: #0000ff')
          style = up.util.readInlineStyle($div, ['backgroundColor', 'color'])
          expect(style).toEqual
            backgroundColor: 'rgb(255, 0, 0)'
            color: 'rgb(0, 0, 255)'

        it 'returns blank keys if the element does not have the given property in the [style] attribute', ->
          $div = affix('div').attr('style', 'background-color: #ff0000')
          style = up.util.readInlineStyle($div, ['backgroundColor', 'color'])
          expect(style).toHaveOwnProperty('color')
          expect(style.color).toBeBlank()

        it 'returns a blank value the given property is a computed property, but not in the [style] attribute', ->
          $div = affix('div[class="red-background"]')
          inlineStyleHash = up.util.readInlineStyle($div, ['backgroundColor'])
          computedBackground = up.util.readComputedStyle($div, 'backgroundColor')
          expect(computedBackground).toEqual('rgb(255, 0, 0)')
          expect(inlineStyleHash).toHaveOwnProperty('backgroundColor')
          expect(inlineStyleHash.backgroundColor).toBeBlank()

    describe 'up.util.writeInlineStyle', ->

      it "sets the given style properties as the given element's [style] attribute", ->
        $div = affix('div')
        up.util.writeInlineStyle($div, { color: 'red', backgroundColor: 'blue' })
        style = $div.attr('style')
        expect(style).toContain('color: red')
        expect(style).toContain('background-color: blue')

      it "merges the given style properties into the given element's existing [style] value", ->
        $div = affix('div[style="color: red"]')
        up.util.writeInlineStyle($div, { backgroundColor: 'blue' })
        style = $div.attr('style')
        expect(style).toContain('color: red')
        expect(style).toContain('background-color: blue')

      it "converts the values of known length properties to px values automatically", ->
        $div = affix('div')
        up.util.writeInlineStyle($div, { paddingTop: 100 })
        style = $div.attr('style')
        expect(style).toContain('padding-top: 100px')

    describe 'up.util.writeTemporaryStyle', ->

      it "sets the given inline styles and returns a function that will restore the previous inline styles", ->
        $div = affix('div[style="color: red"]')
        restore = up.util.writeTemporaryStyle($div, { color: 'blue' })
        expect($div.attr('style')).toContain('color: blue')
        expect($div.attr('style')).not.toContain('color: red')
        restore()
        expect($div.attr('style')).not.toContain('color: blue')
        expect($div.attr('style')).toContain('color: red')

      it "does not restore inherited styles", ->
        $div = affix('div[class="red-background"]')
        restore = up.util.writeTemporaryStyle($div, { backgroundColor: 'blue' })
        expect($div.attr('style')).toContain('background-color: blue')
        restore()
        expect($div.attr('style')).not.toContain('background-color')

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
        expect(up.util.selectorForElement($element)).toBe('[up-id="up-id-value"]')

      it "prefers using the element's ID to using the element's name", ->
        $element = affix('div#id-value[name=name-value]')
        expect(up.util.selectorForElement($element)).toBe("#id-value")

      it "selects the ID with an attribute selector if the ID contains a slash", ->
        $element = affix('div').attr(id: 'foo/bar')
        expect(up.util.selectorForElement($element)).toBe('[id="foo/bar"]')

      it "selects the ID with an attribute selector if the ID contains a space", ->
        $element = affix('div').attr(id: 'foo bar')
        expect(up.util.selectorForElement($element)).toBe('[id="foo bar"]')

      it "selects the ID with an attribute selector if the ID contains a dot", ->
        $element = affix('div').attr(id: 'foo.bar')
        expect(up.util.selectorForElement($element)).toBe('[id="foo.bar"]')

      it "selects the ID with an attribute selector if the ID contains a quote", ->
        $element = affix('div').attr(id: 'foo"bar')
        expect(up.util.selectorForElement($element)).toBe('[id="foo\\"bar"]')

      it "prefers using the element's tagName + [name] to using the element's classes", ->
        $element = affix('input[name=name-value].class1.class2')
        expect(up.util.selectorForElement($element)).toBe('input[name="name-value"]')

      it "prefers using the element's classes to using the element's ARIA label", ->
        $element = affix('div.class1.class2[aria-label="ARIA label value"]')
        expect(up.util.selectorForElement($element)).toBe(".class1.class2")

      it 'does not use Unpoly classes to compose a class selector', ->
        $element = affix('div.class1.up-current.class2')
        expect(up.util.selectorForElement($element)).toBe(".class1.class2")

      it "prefers using the element's ARIA label to using the element's tag name", ->
        $element = affix('div[aria-label="ARIA label value"]')
        expect(up.util.selectorForElement($element)).toBe('[aria-label="ARIA label value"]')

      it "uses the element's tag name if no better description is available", ->
        $element = affix('div')
        expect(up.util.selectorForElement($element)).toBe("div")

      it 'escapes quotes in attribute selector values', ->
        $element = affix('div')
        $element.attr('aria-label', 'foo"bar')
        expect(up.util.selectorForElement($element)).toBe('[aria-label="foo\\"bar"]')


    describe 'up.util.addTemporaryClass', ->

      it 'adds the given class to the given element', ->
        $element = affix('.foo.bar')
        element = $element.get(0)

        expect(element.className).toEqual('foo bar')

        up.util.addTemporaryClass(element, 'baz')

        expect(element.className).toEqual('foo bar baz')

      it 'returns a function that restores the original class', ->
        $element = affix('.foo.bar')
        element = $element.get(0)

        restoreClass = up.util.addTemporaryClass(element, 'baz')
        expect(element.className).toEqual('foo bar baz')

        restoreClass()
        expect(element.className).toEqual('foo bar')


    describe 'up.util.castedAttr', ->

      it 'returns true if the attribute value is the string "true"', ->
        $element = affix('div').attr('foo', 'true')
        expect(up.util.castedAttr($element, 'foo')).toBe(true)

      it 'returns true if the attribute value is the name of the attribute', ->
        $element = affix('div').attr('foo', 'foo')
        expect(up.util.castedAttr($element, 'foo')).toBe(true)

      it 'returns false if the attribute value is the string "false"', ->
        $element = affix('div').attr('foo', 'false')
        expect(up.util.castedAttr($element, 'foo')).toBe(false)

      it 'returns a missing value if the element has no such attribute', ->
        $element = affix('div')
        expect(up.util.castedAttr($element, 'foo')).toBeMissing()

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

      it 'passes the iteration index as second argument to the given function', ->
        array = ["apple", "orange", "cucumber"]
        args = []
        up.util.all array, (item, index) ->
          args.push(index)
          true
        expect(args).toEqual [0, 1, 2]

      it 'accepts a property name instead of a function, which collects that property from each item', ->
        allTrue = [ { prop: true }, { prop: true } ]
        someFalse = [ { prop: true }, { prop: false } ]
        expect(up.util.all(allTrue, 'prop')).toBe(true)
        expect(up.util.all(someFalse, 'prop')).toBe(false)

#    describe 'up.util.none', ->
#
#      it 'returns true if no element in the array returns true for the given function', ->
#        result = up.util.none ['foo', 'bar', 'baz'], up.util.isBlank
#        expect(result).toBe(true)
#
#      it 'returns false if an element in the array returns false for the given function', ->
#        result = up.util.none ['foo', 'bar', null, 'baz'], up.util.isBlank
#        expect(result).toBe(false)
#
#      it 'short-circuits once an element returns true', ->
#        count = 0
#        up.util.none ['foo', 'bar', '', 'baz'], (element) ->
#          count += 1
#          up.util.isBlank(element)
#        expect(count).toBe(3)
#
#      it 'passes the iteration index as second argument to the given function', ->
#        array = ["apple", "orange", "cucumber"]
#        args = []
#        up.util.none array, (item, index) ->
#          args.push(index)
#          false
#        expect(args).toEqual [0, 1, 2]
#
#      it 'accepts a property name instead of a function, which collects that property from each item', ->
#        allFalse = [ { prop: false }, { prop: false } ]
#        someTrue = [ { prop: true }, { prop: false } ]
#        expect(up.util.none(allFalse, 'prop')).toBe(true)
#        expect(up.util.none(someTrue, 'prop')).toBe(false)

    describe 'up.util.any', ->

      it 'returns true if at least one element in the array returns true for the given function', ->
        result = up.util.any ['', 'bar', null], up.util.isPresent
        expect(result).toBe(true)

      it 'returns false if no element in the array returns true for the given function', ->
        result = up.util.any ['', null, undefined], up.util.isPresent
        expect(result).toBe(false)

      it 'passes the iteration index as second argument to the given function', ->
        array = ["apple", "orange", "cucumber"]
        args = []
        up.util.any array, (item, index) ->
          args.push(index)
          false
        expect(args).toEqual [0, 1, 2]

      it 'accepts a property name instead of a function, which collects that property from each item', ->
        someTrue = [ { prop: true }, { prop: false } ]
        allFalse = [ { prop: false }, { prop: false } ]
        expect(up.util.any(someTrue, 'prop')).toBe(true)
        expect(up.util.any(allFalse, 'prop')).toBe(false)

    describe 'up.util.detectResult', ->

      it 'consecutively applies the function to each array element and returns the first truthy return value', ->
        map = {
          a: '',
          b: null,
          c: undefined,
          d: 'DEH',
          e: 'EH'
        }
        fn = (el) -> map[el]

        result = up.util.detectResult ['a', 'b', 'c', 'd', 'e'], fn
        expect(result).toEqual('DEH')

      it 'returns undefined if the function does not return a truthy value for any element in the array', ->
        map = {}
        fn = (el) -> map[el]

        result = up.util.detectResult ['a', 'b', 'c'], fn
        expect(result).toBeUndefined()

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

      it 'returns false for a function', ->
        expect(up.util.isBlank((->))).toBe(false)

      it 'returns true for an object with at least one key', ->
        expect(up.util.isBlank({key: 'value'})).toBe(false)

      it 'returns true for an object with an #isBlank method that returns true', ->
        value = { isBlank: (-> true) }
        expect(up.util.isBlank(value)).toBe(true)

      it 'returns false for an object with an #isBlank method that returns false', ->
        value = { isBlank: (-> false) }
        expect(up.util.isBlank(value)).toBe(false)

      it 'returns false for a DOM element', ->
        value = document.body
        expect(up.util.isBlank(value)).toBe(false)

    describe 'up.util.normalizeUrl', ->

      it 'normalizes a relative path', ->
        expect(up.util.normalizeUrl('foo')).toBe("http://#{location.hostname}:#{location.port}/foo")

      it 'normalizes an absolute path', ->
        expect(up.util.normalizeUrl('/foo')).toBe("http://#{location.hostname}:#{location.port}/foo")

      it 'normalizes a full URL', ->
        expect(up.util.normalizeUrl('http://example.com/foo/bar')).toBe('http://example.com/foo/bar')

      it 'preserves a query string', ->
        expect(up.util.normalizeUrl('http://example.com/foo/bar?key=value')).toBe('http://example.com/foo/bar?key=value')

      it 'strips a query string with { search: false } option', ->
        expect(up.util.normalizeUrl('http://example.com/foo/bar?key=value', search: false)).toBe('http://example.com/foo/bar')

      it 'does not strip a trailing slash by default', ->
        expect(up.util.normalizeUrl('/foo/')).toEqual("http://#{location.hostname}:#{location.port}/foo/")

      it 'normalizes redundant segments', ->
        expect(up.util.normalizeUrl('/foo/../foo')).toBe("http://#{location.hostname}:#{location.port}/foo")

      it 'strips a #hash by default', ->
        expect(up.util.normalizeUrl('http://example.com/foo/bar#fragment')).toBe('http://example.com/foo/bar')

      it 'preserves a #hash with { hash: true } option', ->
        expect(up.util.normalizeUrl('http://example.com/foo/bar#fragment', hash: true)).toBe('http://example.com/foo/bar#fragment')

      it 'puts a #hash behind the query string', ->
        expect(up.util.normalizeUrl('http://example.com/foo/bar?key=value#fragment', hash: true)).toBe('http://example.com/foo/bar?key=value#fragment')

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

    describe 'up.util.unresolvablePromise', ->

      it 'return a pending promise', (done) ->
        promise = up.util.unresolvablePromise()
        promiseState(promise).then (result) ->
          expect(result.state).toEqual('pending')
          done()

      it 'returns a different object every time (to prevent memory leaks)', ->
        one = up.util.unresolvablePromise()
        two = up.util.unresolvablePromise()
        expect(one).not.toBe(two)

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

      it 'finds the selector in descendants of the given element', ->
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

      it 'returns true for a prototype-less object', ->
        expect(up.util.isOptions(Object.create(null))).toBe(true)

      it 'returns false for undefined', ->
        expect(up.util.isOptions(undefined)).toBe(false)

      it 'returns false for null', ->
        expect(up.util.isOptions(null)).toBe(false)

      it 'returns false for a function (which is technically an object)', ->
        fn = -> 'foo'
        fn.key = 'value'
        expect(up.util.isOptions(fn)).toBe(false)

      it 'returns false for an Array', ->
        expect(up.util.isOptions(['foo'])).toBe(false)

      it 'returns false for a jQuery collection', ->
        expect(up.util.isOptions($('body'))).toBe(false)

      it 'returns false for a Promise', ->
        expect(up.util.isOptions(Promise.resolve())).toBe(false)

      it 'returns false for a FormData object', ->
        expect(up.util.isOptions(new FormData())).toBe(false)

      it 'returns false for a Date', ->
        expect(up.util.isOptions(new Date())).toBe(false)

      it 'returns false for a RegExp', ->
        expect(up.util.isOptions(new RegExp('foo'))).toBe(false)

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

    describe 'up.util.merge', ->

      it 'merges the given objects', ->
        obj = { a: '1', b: '2' }
        other = { b: '3', c: '4' }
        obj = up.util.merge(obj, other)
        expect(obj).toEqual { a: '1', b: '3', c: '4' }

      it 'overrides (not merges) keys with object value', ->
        obj = { a: '1', b: { c: '2', d: '3' } }
        other = { e: '4', b: { f: '5', g: '6' }}
        obj = up.util.merge(obj, other)
        expect(obj).toEqual { a: '1', e: '4', b: { f: '5', g: '6' } }

      it 'ignores undefined arguments', ->
        obj = { a: 1, b: 2 }

        result = up.util.merge(obj, undefined)
        expect(result).toEqual { a: 1, b: 2 }

        reverseResult = up.util.merge(undefined, obj)
        expect(reverseResult).toEqual { a: 1, b: 2 }

      it 'ignores null arguments', ->
        obj = { a: 1, b: 2 }

        result = up.util.merge(obj, null)
        expect(result).toEqual { a: 1, b: 2 }

        reverseResult = up.util.merge(null, obj)
        expect(reverseResult).toEqual { a: 1, b: 2 }

#    describe 'up.util.deepMerge', ->
#
#      it 'recursively merges the given objects', ->
#        obj = { a: '1', b: { c: '2', d: '3' } }
#        other = { e: '4', b: { f: '5', g: '6' }}
#        obj = up.util.deepMerge(obj, other)
#        expect(obj).toEqual { a: '1', e: '4', b: { c: '2', d: '3', f: '5', g: '6' } }
#
#      it 'ignores undefined arguments', ->
#        obj = { a: 1, b: 2 }
#
#        result = up.util.deepMerge(obj, undefined)
#        expect(result).toEqual { a: 1, b: 2 }
#
#        reverseResult = up.util.deepMerge(undefined, obj)
#        expect(reverseResult).toEqual { a: 1, b: 2 }
#
#      it 'ignores null arguments', ->
#        obj = { a: 1, b: 2 }
#
#        result = up.util.deepMerge(obj, null)
#        expect(result).toEqual { a: 1, b: 2 }
#
#        reverseResult = up.util.deepMerge(null, obj)
#        expect(reverseResult).toEqual { a: 1, b: 2 }
#
#      it 'overwrites (and does not concatenate) array values', ->
#        obj = { a: ['1', '2'] }
#        other = { a: ['3', '4'] }
#        obj = up.util.deepMerge(obj, other)
#        expect(obj).toEqual { a: ['3', '4'] }

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


