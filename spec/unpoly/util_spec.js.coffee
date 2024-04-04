u = up.util
e = up.element
$ = jQuery

describe 'up.util', ->

  describe 'JavaScript functions', ->

    describe 'up.util.isEqual', ->

      describe 'for an Element', ->

        it 'returns true for the same Element reference', ->
          div = document.createElement('div')
          expect(up.util.isEqual(div, div)).toBe(true)

        it 'returns false for a different Element reference', ->
          div1 = document.createElement('div')
          div2 = document.createElement('div')
          expect(up.util.isEqual(div1, div2)).toBe(false)

        it 'returns false for a value this is no Element', ->
          div = document.createElement('div')
          expect(up.util.isEqual(div, 'other')).toBe(false)

      describe 'for an Array', ->

        it 'returns true for a different Array reference with the same elements', ->
          array1 = ['foo', 'bar']
          array2 = ['foo', 'bar']
          expect(up.util.isEqual(array1, array2)).toBe(true)

        it 'returns false for an Array with different elements', ->
          array1 = ['foo', 'bar']
          array2 = ['foo', 'qux']
          expect(up.util.isEqual(array1, array2)).toBe(false)

        it 'returns false for an Array that is a suffix', ->
          array1 = ['foo', 'bar']
          array2 = [       'bar']
          expect(up.util.isEqual(array1, array2)).toBe(false)

        it 'returns false for an Array that is a prefix', ->
          array1 = ['foo', 'bar']
          array2 = ['foo'       ]
          expect(up.util.isEqual(array1, array2)).toBe(false)

        it 'returns true for a NodeList with the same elements', ->
          parent = e.affix(document.body, '.parent')
          child1 = e.affix(parent, '.child.one')
          child2 = e.affix(parent, '.child.two')

          array = [child1, child2]
          nodeList = parent.querySelectorAll('.child')

          expect(up.util.isEqual(array, nodeList)).toBe(true)

        it 'returns true for a HTMLCollection with the same elements', ->
          parent = e.affix(document.body, '.parent')
          child1 = e.affix(parent, '.child.one')
          child2 = e.affix(parent, '.child.two')

          array = [child1, child2]
          htmlCollection = parent.children

          expect(up.util.isEqual(array, htmlCollection)).toBe(true)

        it 'returns true for an arguments object with the same elements', ->
          toArguments = -> return arguments
          array = ['foo', 'bar']
          args = toArguments('foo', 'bar')

          expect(up.util.isEqual(array, args)).toBe(true)

        it 'returns false for a value that is no Array', ->
          array = ['foo', 'bar']
          expect(up.util.isEqual(array, 'foobar')).toBe(false)

      describe 'for a string', ->

        it 'returns true for a different string reference with the same characters', ->
          string1 = 'bar'
          string2 = 'bar'
          expect(up.util.isEqual(string1, string2)).toBe(true)

        it 'returns false for a string with different characters', ->
          string1 = 'foo'
          string2 = 'bar'
          expect(up.util.isEqual(string1, string2)).toBe(false)

        it 'returns true for a String() object with the same characters', ->
          stringLiteral = 'bar'
          stringObject = new String('bar')
          expect(up.util.isEqual(stringLiteral, stringObject)).toBe(true)

        it 'returns false for a String() object with different characters', ->
          stringLiteral = 'foo'
          stringObject = new String('bar')
          expect(up.util.isEqual(stringLiteral, stringObject)).toBe(false)

        it 'returns false for a value that is no string', ->
          expect(up.util.isEqual('foo', ['foo'])).toBe(false)

      describe 'for a number', ->

        it 'returns true for a different number reference with the same integer value', ->
          number1 = 123
          number2 = 123
          expect(up.util.isEqual(number1, number2)).toBe(true)

        it 'returns true for a different number reference with the same floating point value', ->
          number1 = 123.4
          number2 = 123.4
          expect(up.util.isEqual(number1, number2)).toBe(true)

        it 'returns false for a number with a different value', ->
          number1 = 123
          number2 = 124
          expect(up.util.isEqual(number1, number2)).toBe(false)

        it 'returns true for a Number() object with the same value', ->
          numberLiteral = 123
          numberObject = new Number(123)
          expect(up.util.isEqual(numberLiteral, numberObject)).toBe(true)

        it 'returns false for a Number() object with a different value', ->
          numberLiteral = 123
          numberObject = new Object(124)
          expect(up.util.isEqual(numberLiteral, numberObject)).toBe(false)

        it 'returns false for a value that is no number', ->
          expect(up.util.isEqual(123, '123')).toBe(false)

      describe 'for undefined', ->

        it 'returns true for undefined', ->
          expect(up.util.isEqual(undefined, undefined)).toBe(true)

        it 'returns false for null', ->
          expect(up.util.isEqual(undefined, null)).toBe(false)

        it 'returns false for NaN', ->
          expect(up.util.isEqual(undefined, NaN)).toBe(false)

        it 'returns false for an empty Object', ->
          expect(up.util.isEqual(undefined, {})).toBe(false)

        it 'returns false for an empty string', ->
          expect(up.util.isEqual(undefined, '')).toBe(false)

      describe 'for null', ->

        it 'returns true for null', ->
          expect(up.util.isEqual(null, null)).toBe(true)

        it 'returns false for undefined', ->
          expect(up.util.isEqual(null, undefined)).toBe(false)

        it 'returns false for NaN', ->
          expect(up.util.isEqual(null, NaN)).toBe(false)

        it 'returns false for an empty Object', ->
          expect(up.util.isEqual(null, {})).toBe(false)

        it 'returns false for an empty string', ->
          expect(up.util.isEqual(null, '')).toBe(false)

      describe 'for NaN', ->

        it "returns false for NaN because it represents multiple values", ->
          expect(up.util.isEqual(NaN, NaN)).toBe(false)

        it 'returns false for null', ->
          expect(up.util.isEqual(NaN, null)).toBe(false)

        it 'returns false for undefined', ->
          expect(up.util.isEqual(NaN, undefined)).toBe(false)

        it 'returns false for an empty Object', ->
          expect(up.util.isEqual(NaN, {})).toBe(false)

        it 'returns false for an empty string', ->
          expect(up.util.isEqual(NaN, '')).toBe(false)

      describe 'for a Date', ->

        it 'returns true for another Date object that points to the same millisecond', ->
          d1 = new Date('1995-12-17T03:24:00')
          d2 = new Date('1995-12-17T03:24:00')
          expect(up.util.isEqual(d1, d2)).toBe(true)

        it 'returns false for another Date object that points to another millisecond', ->
          d1 = new Date('1995-12-17T03:24:00')
          d2 = new Date('1995-12-17T03:24:01')
          expect(up.util.isEqual(d1, d2)).toBe(false)

        it 'returns true for another Date object that points to the same millisecond in another time zone', ->
          d1 = new Date('2019-01-20T17:35:00+01:00')
          d2 = new Date('2019-01-20T16:35:00+00:00')
          expect(up.util.isEqual(d1, d2)).toBe(true)

        it 'returns false for a value that is not a Date', ->
          d1 = new Date('1995-12-17T03:24:00')
          d2 = '1995-12-17T03:24:00'
          expect(up.util.isEqual(d1, d2)).toBe(false)

      describe 'for a plain Object', ->

        it 'returns true for the same reference', ->
          obj = {}
          reference = obj
          expect(up.util.isEqual(obj, reference)).toBe(true)

        it 'returns true for another plain object with the same keys and values', ->
          obj1 = { foo: 'bar', baz: 'bam' }
          obj2 = { foo: 'bar', baz: 'bam' }
          expect(up.util.isEqual(obj1, obj2)).toBe(true)

        it 'returns false for another plain object with the same keys, but different values', ->
          obj1 = { foo: 'bar', baz: 'bam' }
          obj2 = { foo: 'bar', baz: 'qux' }
          expect(up.util.isEqual(obj1, obj2)).toBe(false)

        it 'returns false for another plain object that is missing a key', ->
          obj1 = { foo: 'bar', baz: 'bam' }
          obj2 = { foo: 'bar'             }
          expect(up.util.isEqual(obj1, obj2)).toBe(false)

        it 'returns false for another plain object that has an additional key', ->
          obj1 = { foo: 'bar'             }
          obj2 = { foo: 'bar', baz: 'bam' }
          expect(up.util.isEqual(obj1, obj2)).toBe(false)

        it 'returns false for a non-plain Object, even if it has the same keys and values', ->
          class Account
            constructor: (@email) ->

          accountInstance = new Account('foo@example.com')
          accountPlain = {}
          for key, value of accountInstance
            accountPlain[key] = value
          expect(up.util.isEqual(accountPlain, accountInstance)).toBe(false)

        it 'returns false for a value that is no object', ->
          obj = { foo: 'bar' }
          expect(up.util.isEqual(obj, 'foobar')).toBe(false)

      describe 'for a non-Plain object', ->

        it 'returns true for the same reference', ->
          obj = new FormData()
          reference = obj
          expect(up.util.isEqual(obj, reference)).toBe(true)

        it 'returns false for different references', ->
          obj1 = new FormData()
          obj2 = new FormData()
          expect(up.util.isEqual(obj1, obj2)).toBe(false)

        it 'returns false for a different object with the same keys and values', ->
          class Account
            constructor: (@email) ->

          account1 = new Account('foo@example.com')
          account2 = new Account('bar@example.com')

          expect(up.util.isEqual(account1, account2)).toBe(false)

        it 'allows the object to hook into the comparison protocol by implementing a method called `up.util.isEqual.key`', ->
          class Account
            constructor: (@email) ->
            "#{up.util.isEqual.key}": (other) ->
              @email == other.email

          account1 = new Account('foo@example.com')
          account2 = new Account('bar@example.com')
          account3 = new Account('foo@example.com')

          expect(up.util.isEqual(account1, account2)).toBe(false)
          expect(up.util.isEqual(account1, account3)).toBe(true)

        it 'returns false for a value that is no object', ->
          class Account
            constructor: (@email) ->

          account = new Account('foo@example.com')

          expect(up.util.isEqual(account, 'foo@example.com')).toBe(false)

    describe 'up.util.isElementish', ->

      it 'returns true for an element', ->
        value = document.body
        expect(up.util.isElementish(value)).toBe(true)

      it 'returns true for a jQuery collection', ->
        value = $('body')
        expect(up.util.isElementish(value)).toBe(true)

      it 'returns true for a NodeList', ->
        value = document.querySelectorAll('body')
        expect(up.util.isElementish(value)).toBe(true)

      it 'returns true for an array of elements', ->
        value = [document.body]
        expect(up.util.isElementish(value)).toBe(true)

      it 'returns false for an array of non-element values', ->
        value = ['foo']
        expect(up.util.isElementish(value)).toBe(false)

      it 'returns false for undefined', ->
        value = undefined
        expect(up.util.isElementish(value)).toBe(false)

      it 'returns true for the document', ->
        value = document
        expect(up.util.isElementish(value)).toBe(true)

      it 'returns true for the window', ->
        value = window
        expect(up.util.isElementish(value)).toBe(true)

    describe 'up.util.flatMap', ->

      it 'collects the Array results of the given map function, then concatenates the result arrays into one flat array', ->
        fun = (x) -> [x, x]
        result = up.util.flatMap([1, 2, 3], fun)
        expect(result).toEqual([1, 1, 2, 2, 3, 3])

      it 'builds an array from mixed function return values of scalar values and lists', ->
        fun = (x) ->
          if x == 1
            1
          else
            [x, x]

        result = up.util.flatMap([0, 1, 2], fun)
        expect(result).toEqual [0, 0, 1, 2, 2]


      it 'flattens return values that are NodeLists', ->
        fun = (selector) -> document.querySelectorAll(selector)

        foo1 = fixture('.foo-element')
        foo2 = fixture('.foo-element')
        bar = fixture('.bar-element')

        result = up.util.flatMap(['.foo-element', '.bar-element'], fun)

        expect(result).toEqual [foo1, foo2, bar]


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
        input = [1, 2, 3, 4, 2, 1]
        result = up.util.uniq(input)
        expect(result).toEqual [1, 2, 3, 4]

#    describe 'up.util.uniqBy', ->
#
#      it 'returns the given array with duplicate elements removed, calling the given function to determine value for uniqueness', ->
#        input = ["foo", "bar", "apple", 'orange', 'banana']
#        result = up.util.uniqBy(input, (element) -> element.length)
#        expect(result).toEqual ['foo', 'apple', 'orange']
#
#      it 'accepts a property name instead of a function, which collects that property from each item to compute uniquness', ->
#        input = ["foo", "bar", "apple", 'orange', 'banana']
#        result = up.util.uniqBy(input, 'length')
#        expect(result).toEqual ['foo', 'apple', 'orange']

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

    describe 'up.util.parseURL', ->

      it 'parses a full URL', ->
        url = up.util.parseURL('https://subdomain.domain.tld:123/path?search#hash')
        expect(url.protocol).toEqual('https:')
        expect(url.hostname).toEqual('subdomain.domain.tld')
        expect(url.port).toEqual('123')
        expect(url.pathname).toEqual('/path')
        expect(url.search).toEqual('?search')
        expect(url.hash).toEqual('#hash')

      it 'parses an absolute path', ->
        url = up.util.parseURL('/qux/foo?search#bar')
        expect(url.protocol).toEqual(location.protocol)
        expect(url.hostname).toEqual(location.hostname)
        expect(url.port).toEqual(location.port)
        expect(url.pathname).toEqual('/qux/foo')
        expect(url.search).toEqual('?search')
        expect(url.hash).toEqual('#bar')

      it 'parses a relative path', ->
        up.history.config.enabled = true
        up.history.replace('/qux/')
        url = up.util.parseURL('foo?search#bar')
        expect(url.protocol).toEqual(location.protocol)
        expect(url.hostname).toEqual(location.hostname)
        expect(url.port).toEqual(location.port)
        expect(url.pathname).toEqual('/qux/foo')
        expect(url.search).toEqual('?search')
        expect(url.hash).toEqual('#bar')

      it 'allows to pass a link element', ->
        link = document.createElement('a')
        link.href = '/qux/foo?search#bar'
        url = up.util.parseURL(link)
        expect(url.protocol).toEqual(location.protocol)
        expect(url.hostname).toEqual(location.hostname)
        expect(url.port).toEqual(location.port)
        expect(url.pathname).toEqual('/qux/foo')
        expect(url.search).toEqual('?search')
        expect(url.hash).toEqual('#bar')

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

      it 'maps over a NodeList collection', ->
        one = fixture('.qwertz[data-value=one]')
        two = fixture('.qwertz[data-value=two]')
        collection = document.querySelectorAll('.qwertz')

        result = up.util.map(collection, (elem) -> elem.dataset.value)
        expect(result).toEqual ['one', 'two']

      it 'maps over a jQuery collection', ->
        one = fixture('.one')
        two = fixture('.two')
        collection = jQuery([one, two])

        result = up.util.map(collection, 'className')
        expect(result).toEqual ['one', 'two']

      it 'maps over a Set', ->
        set = new Set(["foo", "orange", "cucumber"])
        results = up.util.map(set, (item) -> item.length)
        expect(results).toEqual [3, 6, 8]

      it 'maps over an iterator', ->
        set = new Set(["foo", "orange", "cucumber"])
        iterator = set.values()
        results = up.util.map(iterator, (item) -> item.length)
        expect(results).toEqual [3, 6, 8]


    describe 'up.util.mapObject', ->

      it 'creates an object from the given array and pairer', ->
        array = ['foo', 'bar', 'baz']
        object = up.util.mapObject(array, (str) -> ["#{str}Key", "#{str}Value"])
        expect(object).toEqual
          fooKey: 'fooValue'
          barKey: 'barValue'
          bazKey: 'bazValue'

    describe 'up.util.each', ->

      it 'calls the given function once for each item of the given array', ->
        args = []
        array = ["apple", "orange", "cucumber"]
        up.util.each array, (item) -> args.push(item)
        expect(args).toEqual ["apple", "orange", "cucumber"]

      it 'passes the iteration index as second argument to the given function', ->
        args = []
        array = ["apple", "orange", "cucumber"]
        up.util.each array, (item, index) -> args.push(index)
        expect(args).toEqual [0, 1, 2]

      it 'iterates over a NodeList', ->
        one = fixture('.qwertz')
        two = fixture('.qwertz')
        nodeList = document.querySelectorAll('.qwertz')

        callback = jasmine.createSpy()

        up.util.each nodeList, callback
        expect(callback.calls.allArgs()).toEqual [[one, 0], [two, 1]]

      it 'iterates over a jQuery collection', ->
        one = fixture('.qwertz')
        two = fixture('.qwertz')
        nodeList = jQuery([one, two])
        callback = jasmine.createSpy()

        up.util.each nodeList, callback

        expect(callback.calls.allArgs()).toEqual [[one, 0], [two, 1]]

      it 'iterates over a Set', ->
        set = new Set(["foo", "orange", "cucumber"])
        callback = jasmine.createSpy()

        up.util.each(set, callback)

        expect(callback.calls.allArgs()).toEqual [['foo', 0], ['orange', 1], ['cucumber', 2]]

      it 'iterates over an iterator', ->
        set = new Set(["foo", "orange", "cucumber"])
        iterator = set.values()
        callback = jasmine.createSpy()

        up.util.each(iterator, callback)

        expect(callback.calls.allArgs()).toEqual [['foo', 0], ['orange', 1], ['cucumber', 2]]

    describe 'up.util.filter', ->

      it 'returns an array of those elements in the given array for which the given function returns true', ->
        array = ["foo", "orange", "cucumber"]
        results = up.util.filter array, (item) -> item.length > 3
        expect(results).toEqual ['orange', 'cucumber']

      it 'passes the iteration index as second argument to the given function', ->
        array = ["apple", "orange", "cucumber", "banana"]
        results = up.util.filter array, (item, index) -> index % 2 == 0
        expect(results).toEqual ['apple', 'cucumber']

      it 'accepts a property name instead of a function, which checks that property from each item', ->
        array = [ { name: 'a', prop: false }, { name: 'b', prop: true } ]
        results = up.util.filter array, 'prop'
        expect(results).toEqual [{ name: 'b', prop: true }]

      it 'iterates over an array-like value', ->
        one = fixture('.qwertz')
        two = fixture('.qwertz')
        nodeList = document.querySelectorAll('.qwertz')

        callback = jasmine.createSpy()

        up.util.filter nodeList, callback
        expect(callback.calls.allArgs()).toEqual [[one, 0], [two, 1]]

      it 'iterates over a Set', ->
        set = new Set(["foo", "orange", "cucumber"])
        results = up.util.filter(set, (item) -> item.length > 3)
        expect(results).toEqual ['orange', 'cucumber']

      it 'iterates over an iterator', ->
        set = new Set(["foo", "orange", "cucumber"])
        iterator = set.values()
        results = up.util.filter(iterator, (item) -> item.length > 3)
        expect(results).toEqual ['orange', 'cucumber']

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

      it 'iterates over an array-like value', ->
        one = fixture('.qwertz')
        two = fixture('.qwertz')
        nodeList = document.querySelectorAll('.qwertz')

        callback = jasmine.createSpy()

        up.util.reject nodeList, callback
        expect(callback.calls.allArgs()).toEqual [[one, 0], [two, 1]]

#    describe 'up.util.previewable', ->
#
#      it 'wraps a function into a proxy function with an additional .promise attribute', ->
#        fun = -> 'return value'
#        proxy = up.util.previewable(fun)
#        expect(u.isFunction(proxy)).toBe(true)
#        expect(u.isPromise(proxy.promise)).toBe(true)
#        expect(proxy()).toEqual('return value')
#
#      it "resolves the proxy's .promise when the inner function returns", (done) ->
#        fun = -> 'return value'
#        proxy = up.util.previewable(fun)
#        callback = jasmine.createSpy('promise callback')
#        proxy.promise.then(callback)
#        u.task ->
#          expect(callback).not.toHaveBeenCalled()
#          proxy()
#          u.task ->
#            expect(callback).toHaveBeenCalledWith('return value')
#            done()
#
#      it "delays resolution of the proxy's .promise if the inner function returns a promise", (done) ->
#        funDeferred = u.newDeferred()
#        fun = -> funDeferred
#        proxy = up.util.previewable(fun)
#        callback = jasmine.createSpy('promise callback')
#        proxy.promise.then(callback)
#        proxy()
#        u.task ->
#          expect(callback).not.toHaveBeenCalled()
#          funDeferred.resolve('return value')
#          u.task ->
#            expect(callback).toHaveBeenCalledWith('return value')
#            done()

    describe 'up.util.sequence', ->

      it 'combines the given functions into a single function', ->
        values = []
        one = -> values.push('one')
        two = -> values.push('two')
        three = -> values.push('three')
        sequence = up.util.sequence([one, two, three])
        expect(values).toEqual([])
        sequence()
        expect(values).toEqual(['one', 'two', 'three'])

    describe 'up.util.timer', ->

      it 'calls the given function after waiting the given milliseconds', (done) ->
        callback = jasmine.createSpy()
        expectNotCalled = -> expect(callback).not.toHaveBeenCalled()
        expectCalled = -> expect(callback).toHaveBeenCalled()

        up.util.timer(100, callback)

        expectNotCalled()
        setTimeout(expectNotCalled, 50)
        setTimeout(expectCalled, 50 + 75)
        setTimeout(done, 50 + 75)

      describe 'if the delay is zero', ->

        it 'calls the given function in the next execution frame', ->
          callback = jasmine.createSpy()
          up.util.timer(0, callback)
          expect(callback).not.toHaveBeenCalled()

          setTimeout((-> expect(callback).toHaveBeenCalled()), 0)

#    describe 'up.util.argNames', ->
#
#      it 'returns an array of argument names for the given function', ->
#        fun = ($element, data) ->
#        expect(up.util.argNames(fun)).toEqual(['$element', 'data'])

    describe 'up.util.pick', ->

      it 'returns a copy of the given object with only the given whitelisted properties', ->
        original =
          foo: 'foo-value'
          bar: 'bar-value'
          baz: 'baz-value'
          bam: 'bam-value'
        whitelisted = up.util.pick(original, ['bar', 'bam'])
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
        whitelisted = up.util.pick(original, ['foo', 'bar'])
        expect(whitelisted).toHaveOwnProperty('foo')
        expect(whitelisted).not.toHaveOwnProperty('bar')

      it 'copies properties that are computed by a getter', ->
        original =
          foo: 'foo-value'
          bar: 'bar-value'
        Object.defineProperty(original, 'baz', get: -> return 'baz-value')
        whitelisted = up.util.pick(original, ['foo', 'baz'])
        expect(whitelisted).toEqual
          foo: 'foo-value'
          baz: 'baz-value'

      it 'copies inherited properties', ->
        parent =
          foo: 'foo-value'
        child = Object.create(parent)
        child.bar = 'bar-value'
        child.baz = 'baz-value'
        whitelisted = up.util.pick(child, ['foo', 'baz'])
        expect(whitelisted).toEqual
          foo: 'foo-value'
          baz: 'baz-value'

    describe 'up.util.omit', ->

      it 'returns a copy of the given object but omits the given blacklisted properties', ->
        original =
          foo: 'foo-value'
          bar: 'bar-value'
          baz: 'baz-value'
          bam: 'bam-value'
        whitelisted = up.util.omit(original, ['foo', 'baz'])
        expect(whitelisted).toEqual
          bar: 'bar-value'
          bam: 'bam-value'
        # Show that original did not change
        expect(original).toEqual
          foo: 'foo-value'
          bar: 'bar-value'
          baz: 'baz-value'
          bam: 'bam-value'

      it 'copies inherited properties', ->
        parent =
          foo: 'foo-value'
          bar: 'bar-value'
        child = Object.create(parent)
        child.baz = 'baz-value'
        child.bam = 'bam-value'
        whitelisted = up.util.omit(child, ['foo', 'baz'])
        expect(whitelisted).toEqual
          bar: 'bar-value'
          bam: 'bam-value'

    describe 'up.util.every', ->

      it 'returns true if all element in the array returns true for the given function', ->
        result = up.util.every ['foo', 'bar', 'baz'], up.util.isPresent
        expect(result).toBe(true)

      it 'returns false if an element in the array returns false for the given function', ->
        result = up.util.every ['foo', 'bar', null, 'baz'], up.util.isPresent
        expect(result).toBe(false)

      it 'short-circuits once an element returns false', ->
        count = 0
        up.util.every ['foo', 'bar', '', 'baz'], (element) ->
          count += 1
          up.util.isPresent(element)
        expect(count).toBe(3)

      it 'passes the iteration index as second argument to the given function', ->
        array = ["apple", "orange", "cucumber"]
        args = []
        up.util.every array, (item, index) ->
          args.push(index)
          true
        expect(args).toEqual [0, 1, 2]

      it 'accepts a property name instead of a function, which collects that property from each item', ->
        allTrue = [ { prop: true }, { prop: true } ]
        someFalse = [ { prop: true }, { prop: false } ]
        expect(up.util.every(allTrue, 'prop')).toBe(true)
        expect(up.util.every(someFalse, 'prop')).toBe(false)

      it 'iterates over a Set', ->
        set = new Set(["foo", "orange", "cucumber"])
        result = up.util.every(set, up.util.isPresent)
        expect(result).toBe(true)

      it 'iterates over an iterator', ->
        set = new Set(["foo", "orange", "cucumber"])
        iterator = set.values()
        result = up.util.every(iterator, up.util.isPresent)
        expect(result).toBe(true)

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

    describe 'up.util.some', ->

      it 'returns true if at least one element in the array returns true for the given function', ->
        result = up.util.some ['', 'bar', null], up.util.isPresent
        expect(result).toBe(true)

      it 'returns false if no element in the array returns true for the given function', ->
        result = up.util.some ['', null, undefined], up.util.isPresent
        expect(result).toBe(false)

      it 'passes the iteration index as second argument to the given function', ->
        array = ["apple", "orange", "cucumber"]
        args = []
        up.util.some array, (item, index) ->
          args.push(index)
          false
        expect(args).toEqual [0, 1, 2]

      it 'accepts a property name instead of a function, which collects that property from each item', ->
        someTrue = [ { prop: true }, { prop: false } ]
        allFalse = [ { prop: false }, { prop: false } ]
        expect(up.util.some(someTrue, 'prop')).toBe(true)
        expect(up.util.some(allFalse, 'prop')).toBe(false)

      it 'short-circuits once an element returns true', ->
        count = 0
        up.util.some [null, undefined, 'foo', ''], (element) ->
          count += 1
          up.util.isPresent(element)
        expect(count).toBe(3)

      it 'iterates over an array-like value', ->
        one = fixture('.qwertz')
        two = fixture('.qwertz')
        nodeList = document.querySelectorAll('.qwertz')

        callback = jasmine.createSpy()

        up.util.some nodeList, callback
        expect(callback.calls.allArgs()).toEqual [[one, 0], [two, 1]]

    describe 'up.util.findResult', ->

      it 'consecutively applies the function to each array element and returns the first truthy return value', ->
        map = {
          a: '',
          b: null,
          c: undefined,
          d: 'DEH',
          e: 'EH'
        }
        fn = (el) -> map[el]

        result = up.util.findResult ['a', 'b', 'c', 'd', 'e'], fn
        expect(result).toEqual('DEH')

      it 'returns undefined if the function does not return a truthy value for any element in the array', ->
        map = {}
        fn = (el) -> map[el]

        result = up.util.findResult ['a', 'b', 'c'], fn
        expect(result).toBeUndefined()

      it 'iterates over a NodeList', ->
        one = fixture('.qwertz')
        two = fixture('.qwertz')
        nodeList = document.querySelectorAll('.qwertz')
        callback = jasmine.createSpy()

        up.util.findResult nodeList, callback
        expect(callback.calls.allArgs()).toEqual [[one, 0], [two, 1]]

      it 'iterates over a Set', ->
        set = new Set(["foo", "orange", "cucumber"])
        callback = jasmine.createSpy()

        up.util.findResult(set, callback)

        expect(callback.calls.allArgs()).toEqual [['foo', 0], ['orange', 1], ['cucumber', 2]]

      it 'iterates over an iterator', ->
        set = new Set(["foo", "orange", "cucumber"])
        iterator = set.values()
        callback = jasmine.createSpy()

        up.util.findResult(iterator, callback)

        expect(callback.calls.allArgs()).toEqual [['foo', 0], ['orange', 1], ['cucumber', 2]]

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

      it 'returns true for an object with an [up.util.isBlank.key] method that returns true', ->
        value = {}
        value[up.util.isBlank.key] = -> true
        expect(up.util.isBlank(value)).toBe(true)

      it 'returns false for an object with an [up.util.isBlank.key] method that returns false', ->
        value = {}
        value[up.util.isBlank.key] = -> false
        expect(up.util.isBlank(value)).toBe(false)

      it 'returns false for a DOM element', ->
        value = document.body
        expect(up.util.isBlank(value)).toBe(false)

    describe 'up.util.normalizeURL', ->

      it 'normalizes a relative path', ->
        up.history.config.enabled = true
        up.history.replace('/qux/')
        expect(up.util.normalizeURL('foo')).toBe("/qux/foo")

      it 'normalizes an absolute path', ->
        expect(up.util.normalizeURL('/foo')).toBe("/foo")

      it 'preserves a protocol and hostname for a URL from another domain', ->
        expect(up.util.normalizeURL('http://example.com/foo/bar')).toBe('http://example.com/foo/bar')

      it 'removes a standard port for http:// URLs', ->
        expect(up.util.normalizeURL('http://example.com:80/foo/bar')).toBe('http://example.com/foo/bar')

      it 'removes a standard port for https:// URLs', ->
        expect(up.util.normalizeURL('https://example.com:443/foo/bar')).toBe('https://example.com/foo/bar')

      it 'preserves a non-standard port', ->
        expect(up.util.normalizeURL('http://example.com:8080/foo/bar')).toBe('http://example.com:8080/foo/bar')

      it 'preserves a query string', ->
        expect(up.util.normalizeURL('/foo/bar?key=value')).toBe('/foo/bar?key=value')

      it 'strips a query string with { search: false } option', ->
        expect(up.util.normalizeURL('/foo/bar?key=value', search: false)).toBe('/foo/bar')

      it 'normalizes a result from up.util.parseURL()', ->
        url = up.util.parseURL('/foo')
        expect(up.util.normalizeURL(url)).toBe("/foo")

      it 'normalizes a URL', ->
        url = new URL('/foo', location.href)
        expect(up.util.normalizeURL(url)).toBe("/foo")

      describe 'trailing slashes', ->

        it 'does not strip a trailing slash by default', ->
          expect(up.util.normalizeURL('/foo/')).toEqual("/foo/")

        it 'strips a trailing slash with { trailingSlash: false }', ->
          expect(up.util.normalizeURL('/foo/', trailingSlash: false)).toEqual("/foo")

        it 'does not strip a trailing slash when passed the "/" URL', ->
          expect(up.util.normalizeURL('/', trailingSlash: false)).toEqual("/")

      it 'normalizes redundant segments', ->
        expect(up.util.normalizeURL('/foo/../foo')).toBe("/foo")

      describe 'hash fragments', ->

        it 'strips a #hash with { hash: false }', ->
          expect(up.util.normalizeURL('/foo/bar#fragment', hash: false)).toBe('/foo/bar')

        it 'preserves a #hash by default', ->
          expect(up.util.normalizeURL('/foo/bar#fragment')).toBe('/foo/bar#fragment')

        it 'puts a #hash behind the query string', ->
          expect(up.util.normalizeURL('/foo/bar?key=value#fragment')).toBe('/foo/bar?key=value#fragment')

    describe 'up.util.find', ->

      it 'finds the first element in the given array that matches the given tester', ->
        array = ['foo', 'bar', 'baz']
        tester = (element) -> element[0] == 'b'
        expect(up.util.find(array, tester)).toEqual('bar')

      it "returns undefined if the given array doesn't contain a matching element", ->
        array = ['foo', 'bar', 'baz']
        tester = (element) -> element[0] == 'z'
        expect(up.util.find(array, tester)).toBeUndefined()

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

      it 'returns the removed value if the array was changed', ->
        array = ['a', 'b', 'c']
        returned = up.util.remove(array, 'b')
        expect(returned).toBe('b')

      it "returns undefined if the given array didn't contain the given value", ->
        array = ['a', 'b', 'c']
        returned = up.util.remove(array, 'd')
        expect(returned).toBeUndefined()

    describe 'up.util.contains()', ->

      describe 'for a string', ->

        it 'returns true if the given string contains the given substring', ->
          expect(up.util.contains('foobar', 'oba')).toBe(true)

        it 'returns false if the given string does not contain the given substring', ->
          expect(up.util.contains('foobar', 'baz')).toBe(false)

      describe 'for an array', ->

        it 'returns true if the given array contains the given element', ->
          expect(up.util.contains(['foo', 'bar', 'baz'], 'bar')).toBe(true)

        it 'returns false if the given array does not contain the given element', ->
          expect(up.util.contains(['foo', 'bar', 'baz'], 'qux')).toBe(false)

      describe 'for a NodeList', ->

        it 'returns true if the given NodeList contains the given element', ->
          expect(up.util.contains(document.querySelectorAll('body'), document.body)).toBe(true)

        it 'returns false if the given NodeList does not contain the given element', ->
          expect(up.util.contains(document.querySelectorAll('div'), document.body)).toBe(false)

    describe 'up.util.unresolvablePromise', ->

      it 'return a pending promise', (done) ->
        promise = up.util.unresolvablePromise()
        promiseState(promise).then (result) ->
          expect(result.state).toEqual('pending')
          done()

        return

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

#    describe 'up.util.offsetParent', ->
#
#      it 'returns the first ascendant that has a "position" style', ->
#        $a = $fixture('.a')
#        $b = $a.affix('.b').css(position: 'relative')
#        $c = $b.affix('.c')
#        $d = $c.affix('.d')
#
#        expect(up.util.offsetParent($d[0])).toBe($b[0])
#
#      it 'does not return the given element, even when it has position', ->
#        $a = $fixture('.a').css(position: 'absolute')
#        $b = $a.affix('.b').css(position: 'relative')
#
#        expect(up.util.offsetParent($b[0])).toBe($a[0])
#
#      it 'returns the <body> element if there is no closer offset parent', ->
#        $a = $fixture('.a')
#        $b = $a.affix('.b')
#
#        expect(up.util.offsetParent($b[0])).toBe(document.body)
#
#      it 'returns the offset parent for a detached element', ->
#        $a = $fixture('.a').detach()
#        $b = $a.affix('.b').css(position: 'relative')
#        $c = $b.affix('.c')
#        $d = $c.affix('.d')
#
#        expect(up.util.offsetParent($d[0])).toBe($b[0])
#
#      it 'returns a missing value (and not <body>) if the given detached element has no ancestor with position', ->
#        $a = $fixture('.a').detach()
#        $b = $a.affix('.b')
#
#        expect(up.util.offsetParent($b[0])).toBeMissing()

    describe 'up.util.isCrossOrigin', ->

      it 'returns false for an absolute path', ->
        expect(up.util.isCrossOrigin('/foo')).toBe(false)

      it 'returns false for an relative path', ->
        expect(up.util.isCrossOrigin('foo')).toBe(false)

      it 'returns false for a fully qualified URL with the same protocol and hostname as the current location', ->
        fullURL = "#{location.protocol}//#{location.host}/foo"
        expect(up.util.isCrossOrigin(fullURL)).toBe(false)

      it 'returns true for a fully qualified URL with a different protocol than the current location', ->
        fullURL = "otherprotocol://#{location.host}/foo"
        expect(up.util.isCrossOrigin(fullURL)).toBe(true)

      it 'returns false for a fully qualified URL with a different hostname than the current location', ->
        fullURL = "#{location.protocol}//other-host.tld/foo"
        expect(up.util.isCrossOrigin(fullURL)).toBe(true)

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
        expect(up.util.isOptions(/foo/)).toBe(false)

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
        result = up.util.merge(obj, other)
        expect(result).toEqual { a: '1', b: '3', c: '4' }

      it 'merges more than two objects', ->
        a = { a: '1' }
        b = { b: '2' }
        c = { c: '3' }
        result = up.util.merge(a, b, c)
        expect(result).toEqual { a: '1', b: '2', c: '3' }

      it 'does not mutate the first argument', ->
        a = { a: '1' }
        b = { b: '2' }
        result = up.util.merge(a, b)
        expect(a).toEqual { a: '1' }

      it 'returns an empty object if called without arguments', ->
        result = up.util.merge()
        expect(result).toEqual({})

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

#      it 'copies inherited values', ->
#        parent = { a: 1 }
#        child = Object.create(parent)
#        child.b = 2
#
#        result = up.util.merge(child, { c: 3 })
#        expect(result).toEqual { a: 1, b: 2, c: 3 }

    describe 'up.util.mergeDefined', ->

      it 'merges the given objects', ->
        obj = { a: '1', b: '2' }
        other = { b: '3', c: '4' }
        obj = up.util.mergeDefined(obj, other)
        expect(obj).toEqual { a: '1', b: '3', c: '4' }

      it 'does not override values with an undefined value (unlike up.util.merge)', ->
        obj = { a: '1', b: '2' }
        other = { b: undefined, c: '4' }
        obj = up.util.mergeDefined(obj, other)
        expect(obj).toEqual { a: '1', b: '2', c: '4' }

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

    if up.migrate.loaded
      describe "up.util.assign", ->

        it 'copies the second object into the first object', ->
          target = { a: 1 }
          source = { b: 2, c: 3 }

          up.util.assign(target, source)

          expect(target).toEqual { a: 1, b: 2, c: 3 }

          # Source is unchanged
          expect(source).toEqual { b: 2, c: 3 }

        it 'copies null property values', ->
          target = { a: 1, b: 2 }
          source = { b: null }

          up.util.assign(target, source)

          expect(target).toEqual { a: 1, b: null }

        it 'copies undefined property values', ->
          target = { a: 1, b: 2 }
          source = { b: undefined }

          up.util.assign(target, source)

          expect(target).toEqual { a: 1, b: undefined }

        it 'returns the first object', ->
          target = { a: 1 }
          source = { b: 2 }

          result = up.util.assign(target, source)

          expect(result).toBe(target)

        it 'takes multiple sources to copy from', ->
          target = { a: 1 }
          source1 = { b: 2, c: 3 }
          source2 = { d: 4, e: 5 }

          up.util.assign(target, source1, source2)

          expect(target).toEqual { a: 1, b: 2, c: 3, d: 4, e: 5 }

    describe 'up.util.copy', ->

      it 'returns a shallow copy of the given array', ->
        original = ['a', { b: 'c' }, 'd']

        copy = up.util.copy(original)
        expect(copy).toEqual(original)

        # Test that changes to copy don't change original
        copy.pop()
        expect(copy.length).toBe(2)
        expect(original.length).toBe(3)

        # Test that the copy is shallow
        copy[1].x = 'y'
        expect(original[1].x).toEqual('y')

      it 'returns a shallow copy of the given plain object', ->
        original = {a: 'b', c: [1, 2], d: 'e'}

        copy = up.util.copy(original)
        expect(copy).toEqual(original)

        # Test that changes to copy don't change original
        copy.f = 'g'
        expect(original.f).toBeMissing()

        # Test that the copy is shallow
        copy.c.push(3)
        expect(original.c).toEqual [1, 2, 3]

      it 'allows custom classes to hook into the copy protocol by implementing a method named `up.util.copy.key`', ->
        class TestClass
          "#{up.util.copy.key}": ->
            return "custom copy"

        instance = new TestClass()
        expect(up.util.copy(instance)).toEqual("custom copy")

      it 'copies the given jQuery collection into an array', ->
        $one = $fixture('.one')
        $two = $fixture('.two')
        $collection = $one.add($two)

        copy = up.util.copy($collection)

        copy[0] = document.body
        expect($collection[0]).toBe($one[0])

      it 'copies the given arguments object into an array', ->
        args = undefined
        (-> args = arguments)(1)

        copy = up.util.copy(args)
        expect(copy).toBeArray()

        copy[0] = 2
        expect(args[0]).toBe(1)

      it 'returns the given string (which is immutable)', ->
        str = "foo"
        copy = up.util.copy(str)
        expect(copy).toBe(str)

      it 'returns the given number (which is immutable)', ->
        number = 123
        copy = up.util.copy(number)
        expect(copy).toBe(number)

      it 'copies the given Date object', ->
        date = new Date('1995-12-17T03:24:00')
        expect(date.getFullYear()).toBe(1995)

        copy = up.util.copy(date)

        expect(copy.getFullYear()).toBe(date.getFullYear())
        expect(copy.getHours()).toBe(date.getHours())
        expect(copy.getMinutes()).toBe(date.getMinutes())

        # Check that it's actually a copied object
        expect(copy).not.toBe(date)
        date.setFullYear(2018)
        expect(copy.getFullYear()).toBe(1995)


#    describe 'up.util.deepCopy', ->
#
#      it 'returns a deep copy of the given array', ->
#        original = ['a', { b: 'c' }, 'd']
#
#        copy = up.util.deepCopy(original)
#        expect(copy).toEqual(original)
#
#        # Test that changes to copy don't change original
#        copy.pop()
#        expect(copy.length).toBe(2)
#        expect(original.length).toBe(3)
#
#        # Test that the copy is deep
#        copy[1].x = 'y'
#        expect(original[1].x).toBeUndefined()
#
#      it 'returns a deep copy of the given object', ->
#        original = {a: 'b', c: [1, 2], d: 'e'}
#
#        copy = up.util.deepCopy(original)
#        expect(copy).toEqual(original)
#
#        # Test that changes to copy don't change original
#        copy.f = 'g'
#        expect(original.f).toBeMissing()
#
#        # Test that the copy is deep
#        copy.c.push(3)
#        expect(original.c).toEqual [1, 2]

    describe 'up.util.isList', ->

      it 'returns true for an array', ->
        value = [1, 2, 3]
        expect(up.util.isList(value)).toBe(true)

      it 'returns true for an HTMLCollection', ->
        value = document.getElementsByTagName('div')
        expect(up.util.isList(value)).toBe(true)

      it 'returns true for a NodeList', ->
        value = document.querySelectorAll('div')
        expect(up.util.isList(value)).toBe(true)

      it 'returns true for a jQuery collection', ->
        value = jQuery('body')
        expect(up.util.isList(value)).toBe(true)

      it 'returns true for an arguments object', ->
        value = undefined
        (-> value = arguments)()
        expect(up.util.isList(value)).toBe(true)

      it 'returns false for an object', ->
        value = { foo: 'bar' }
        expect(up.util.isList(value)).toBe(false)

      it 'returns false for a string', ->
        value = 'foo'
        expect(up.util.isList(value)).toBe(false)

      it 'returns false for a number', ->
        value = 123
        expect(up.util.isList(value)).toBe(false)

      it 'returns false for undefined', ->
        value = undefined
        expect(up.util.isList(value)).toBe(false)

      it 'returns false for null', ->
        value = null
        expect(up.util.isList(value)).toBe(false)

      it 'returns false for NaN', ->
        value = NaN
        expect(up.util.isList(value)).toBe(false)

    describe 'up.util.isJQuery', ->

      it 'returns true for a jQuery collection', ->
        value = $('body')
        expect(up.util.isJQuery(value)).toBe(true)

      it 'returns false for a native element', ->
        value = document.body
        expect(up.util.isJQuery(value)).toBe(false)

      it 'returns false (and does not crash) for undefined', ->
        value = undefined
        expect(up.util.isJQuery(value)).toBe(false)

      it 'returns false for the window object', ->
        value = window
        expect(up.util.isJQuery(value)).toBe(false)

      it 'returns false for the window object if window.jquery (lowercase) is defined (bugfix)', ->
        window.jquery = '3.0.0'
        value = window
        expect(up.util.isJQuery(value)).toBe(false)
        delete window.jquery

      it 'returns false for the document object', ->
        value = document
        expect(up.util.isJQuery(value)).toBe(false)

    describe 'up.util.isPromise', ->

      it 'returns true for a Promise', ->
        value = new Promise(up.util.noop)
        expect(up.util.isPromise(value)).toBe(true)

      it 'returns true for an object with a #then() method', ->
        value = { then: -> }
        expect(up.util.isPromise(value)).toBe(true)

      it 'returns true for an up.Request', ->
        value = new up.Request(url: '/path')
        expect(up.util.isPromise(value)).toBe(true)

      it 'returns false for an object without a #then() method', ->
        value = { foo: '1' }
        expect(up.util.isPromise(value)).toBe(false)

      it 'returns false for null', ->
        value = null
        expect(up.util.isPromise(value)).toBe(false)

    describe 'up.util.last', ->

      it 'returns the last element of an array', ->
        value = [1, 2, 3]
        expect(up.util.last(value)).toBe(3)

      it 'returns the last character of a string', ->
        value = 'foobar'
        expect(up.util.last(value)).toBe('r')

    describe 'up.util.isRegExp', ->

      it 'returns true for a RegExp', ->
        value = /foo/
        expect(up.util.isRegExp(value)).toBe(true)

      it 'returns false for a string', ->
        value = 'foo'
        expect(up.util.isRegExp(value)).toBe(false)

      it 'returns false for a undefined', ->
        value = undefined
        expect(up.util.isRegExp(value)).toBe(false)

    describe 'up.util.sprintf', ->

      describe 'with string argument', ->

        it 'serializes the string verbatim with %s', ->
          formatted = up.util.sprintf('before %s after', 'argument')
          expect(formatted).toEqual('before argument after')

        it 'includes quotes with %o', ->
          formatted = up.util.sprintf('before %o after', 'argument')
          expect(formatted).toEqual('before "argument" after')

      describe 'with undefined argument', ->

        it 'serializes to the word "undefined"', ->
          formatted = up.util.sprintf('before %o after', undefined)
          expect(formatted).toEqual('before undefined after')

        it 'does not crash with %s', ->
          formatted = up.util.sprintf('before %s after', undefined)
          expect(formatted).toEqual('before undefined after')

      describe 'with null argument', ->

        it 'serializes to the word "null"', ->
          formatted = up.util.sprintf('before %o after', null)
          expect(formatted).toEqual('before null after')

        it 'does not crash with %s', ->
          formatted = up.util.sprintf('before %s after', null)
          expect(formatted).toEqual('before null after')

      describe 'with true argument', ->

        it 'serializes to the word "true"', ->
          formatted = up.util.sprintf('before %o after', true)
          expect(formatted).toEqual('before true after')

        it 'does not crash with %s', ->
          formatted = up.util.sprintf('before %s after', true)
          expect(formatted).toEqual('before true after')

      describe 'with false argument', ->

        it 'serializes to the word "false"', ->
          formatted = up.util.sprintf('before %o after', false)
          expect(formatted).toEqual('before false after')

        it 'does not crash with %s', ->
          formatted = up.util.sprintf('before %s after', false)
          expect(formatted).toEqual('before false after')

      describe 'with number argument', ->

        it 'serializes the number as string', ->
          formatted = up.util.sprintf('before %o after', 5)
          expect(formatted).toEqual('before 5 after')

      describe 'with function argument', ->

        it 'serializes the function code', ->
          formatted = up.util.sprintf('before %o after', `function foo() {}`)
          expect(formatted).toEqual('before function foo() { } after')

      describe 'with array argument', ->

        it 'recursively serializes the elements', ->
          formatted = up.util.sprintf('before %o after', [1, "foo"])
          expect(formatted).toEqual('before [1, foo] after')

      describe 'with element argument', ->

        it 'serializes the tag name with id, up-iid, name and class attributes, but ignores other attributes', ->
          element = e.createFromHTML('<table id="id-value" up-id="up-id-value" name="name-value" class="class-value" title="title-value"></table>')
          formatted = up.util.sprintf('before %o after', element)
          expect(formatted).toEqual('before <table id="id-value" up-id="up-id-value" name="name-value" class="class-value"> after')

      describe 'with jQuery argument', ->

        it 'serializes the tag name with id, name and class attributes, but ignores other attributes', ->
          $element1 = $('<table id="table-id">')
          $element2 = $('<ul id="ul-id">')
          formatted = up.util.sprintf('before %o after', $element1.add($element2))
          expect(formatted).toEqual('before $(<table id="table-id">, <ul id="ul-id">) after')

      describe 'with object argument', ->

        it 'serializes to JSON', ->
          object = { foo: 'foo-value', bar: 'bar-value' }
          formatted = up.util.sprintf('before %o after', object)
          expect(formatted).toEqual('before {"foo":"foo-value","bar":"bar-value"} after')

        it 'serializes to a fallback string if the given structure has circular references', ->
          object = { foo: {} }
          object.foo.bar = object
          formatted = up.util.sprintf('before %o after', object)
          expect(formatted).toEqual('before (circular structure) after')

        it "skips a key if a getter crashes", ->
          object = {}
          Object.defineProperty(object, 'foo', get: (-> throw "error"))
          formatted = up.util.sprintf('before %o after', object)
          expect(formatted).toEqual('before {} after')

          object.bar = 'bar'
          formatted = up.util.sprintf('before %o after', object)
          expect(formatted).toEqual('before {"bar":"bar"} after')

      describe 'with Error argument', ->

        it "serializes the error's class and message", ->
          error = new up.CannotTarget("Error message")
          formatted = up.util.sprintf('before %o after', error)
          expect(formatted).toBe('before up.CannotTarget: Error message after')

      describe 'with color style (%c)', ->

        it 'discards the style directives', ->
          formatted = up.util.sprintf('foo %cbar', 'color: red')
          expect(formatted).toBe('foo bar')

    describe 'up.util.renameKeys', ->

      it 'returns a copy of the given object, but with keys transformed by the given function', ->
        source = { foo: 1, bar: 2 }
        upcase = (str) -> str.toUpperCase()
        copy = up.util.renameKeys(source, upcase)
        expect(copy).toEqual { FOO: 1, BAR: 2 }

      it 'does not change the given object', ->
        source = { foo: 1 }
        upcase = (str) -> str.toUpperCase()
        up.util.renameKeys(source, upcase)
        expect(source).toEqual { foo: 1  }

#    describe 'up.util.unprefixCamelCase', ->
#
#      it 'returns the given key without the given prefixed', ->
#        result = up.util.unprefixCamelCase('prefixFoo', 'prefix')
#        expect(result).toEqual('foo')
#
#      it 'returns undefined if the given key is not prefixed with the given prefix', ->
#        result = up.util.unprefixCamelCase('foo', 'prefix')
#        expect(result).toBeUndefined()
#
#      it 'returns undefined if the given prefix is the full given key', ->
#        result = up.util.unprefixCamelCase('prefix', 'prefix')
#        expect(result).toBeUndefined()

    describe 'up.util.escapeHTML', ->

      it 'escapes double quotes', ->
        result = up.util.escapeHTML('before"after')
        expect(result).toEqual('before&quot;after')

      it 'escapes single quotes', ->
        result = up.util.escapeHTML("before'after")
        expect(result).toEqual('before&#x27;after')

      it 'escapes angle brackets', ->
        result = up.util.escapeHTML('before<script>after')
        expect(result).toEqual('before&lt;script&gt;after')

    describe 'up.util.memoizeMethod()', ->

      it "caches a function property's return value", ->
        spy = jasmine.createSpy('method').and.returnValue('return value')

        obj = { foo: spy }
        up.util.memoizeMethod(obj, { foo: true })

        expect(obj.foo()).toBe('return value')
        expect(obj.foo()).toBe('return value')

        expect(spy.calls.count()).toBe(1)

#      it "caches a getter's return value", ->
#        spy = jasmine.createSpy('method').and.returnValue('return value')
#
#        obj = `{ get foo() { return spy() } }`
#        up.util.memoizeMethod(obj, { foo: true })
#
#        expect(obj.foo).toBe('return value')
#        expect(obj.foo).toBe('return value')
#
#        expect(spy.calls.count()).toBe(1)
#
#      it "caches a getter's return value when there is no setter in strict mode", ->
#        'use strict'
#
#        spy = jasmine.createSpy('method').and.returnValue('return value')
#
#        obj = `{ get foo() { return spy() } }`
#        up.util.memoizeMethod(obj, { foo: true })
#
#        expect(obj.foo).toBe('return value')
#        expect(obj.foo).toBe('return value')
#
#        expect(spy.calls.count()).toBe(1)

      it 'does not share its cache between multiple instances', ->
        class Person
          constructor: (@firstName, @lastName) ->
          getFullName: ->
            return @firstName + ' ' + @lastName

        up.util.memoizeMethod(Person.prototype, { getFullName: true })

        alice = new Person('Alice', 'Anderson')
        bob = new Person('Bob', 'Bertison')

        expect(alice.getFullName()).toBe('Alice Anderson')
        expect(bob.getFullName()).toBe('Bob Bertison')

      it 'forwards arguments and this context', ->
        spy = jasmine.createSpy('spy')

        obj = { foo: (arg) -> spy(this, arg) }
        up.util.memoizeMethod(obj, { foo: true })

        obj.foo('given arg')

        expect(spy.calls.count()).toBe(1)
        expect(spy.calls.argsFor(0)).toEqual [obj, 'given arg']

      it "caches a function property's thrown error", ->
        spy = jasmine.createSpy('method').and.throwError(new Error('error message'))

        obj = { foo: spy }
        up.util.memoizeMethod(obj, { foo: true })

        expect(-> obj.foo()).toThrowError(/error message/)
        expect(-> obj.foo()).toThrowError(/error message/)

        expect(spy.calls.count()).toBe(1)

      it 'caches separately for separate arguments', ->
        spy = jasmine.createSpy('spy')

        obj =
          foo: (arg) ->
            spy(arg)
            return arg * 2

        up.util.memoizeMethod(obj, { foo: true })

        expect(obj.foo(3)).toBe(6)
        expect(obj.foo(3)).toBe(6)
        expect(spy.calls.count()).toBe(1)

        expect(obj.foo(5)).toBe(10)
        expect(spy.calls.count()).toBe(2)

      it 'caches multiple method names', ->
        fooSpy = jasmine.createSpy('foo method').and.returnValue('foo return value')
        barSpy = jasmine.createSpy('bar method').and.returnValue('bar return value')

        obj =
          foo: fooSpy
          bar: barSpy
        up.util.memoizeMethod(obj, { foo: true, bar: true })

        expect(obj.foo()).toBe('foo return value')
        expect(obj.foo()).toBe('foo return value')
        expect(fooSpy.calls.count()).toBe(1)

        expect(obj.bar()).toBe('bar return value')
        expect(obj.bar()).toBe('bar return value')
        expect(barSpy.calls.count()).toBe(1)

    describe 'up.util.parseTokens()', ->

      it 'parses tokens separated by a space', ->
        str = 'foo bar baz'
        tokens = up.util.parseTokens(str)
        expect(tokens).toEqual ['foo', 'bar', 'baz']

      it 'parses tokens separated by " or "', ->
        str = "foo or bar or baz"
        tokens = up.util.parseTokens(str)
        expect(tokens).toEqual ['foo', 'bar', 'baz']

      it 'trims whitespace', ->
        str = " foo \t  bar   or   baz   \n"
        tokens = up.util.parseTokens(str)
        expect(tokens).toEqual ['foo', 'bar', 'baz']

      it 'does not parse a JSON array', ->
        str = '["foo", "bar"]'
        tokens = up.util.parseTokens(str)
        expect(tokens).toEqual ['["foo",', '"bar"]']

      it 'returns an array unchanged', ->
        array = ['foo', 'bar']
        tokens = up.util.parseTokens(array)
        expect(tokens).toEqual ['foo', 'bar']

      it 'returns an empty array for undefined', ->
        tokens = up.util.parseTokens(undefined)
        expect(tokens).toEqual []

      it 'returns an empty array for null', ->
        tokens = up.util.parseTokens(null)
        expect(tokens).toEqual []

      describe 'with { json: true }', ->

        it 'parses the string as JSON if it is enclosed in square brackets', ->
          str = '["foo", "bar"]'
          tokens = up.util.parseTokens(str, json: true)
          expect(tokens).toEqual ['foo', 'bar']

        it 'parses the string as JSON if it is enclosed in square brackets after whitespace', ->
          str = '  \n["foo", "bar"] \t\n '
          tokens = up.util.parseTokens(str, json: true)
          expect(tokens).toEqual ['foo', 'bar']

        it "parses the string as space-separated tokens if it isn't enclosed in square brackets", ->
          str = '[foo bar baz'
          tokens = up.util.parseTokens(str, json: true)
          expect(tokens).toEqual ['[foo', 'bar', 'baz']

      describe 'with { separator: "or" }', ->

        it 'parses tokens separated by " or "', ->
          str = 'foo or bar or baz'
          tokens = up.util.parseTokens(str)
          expect(tokens).toEqual ['foo', 'bar', 'baz']

        it 'trims whitespace', ->
          str = '\n foo   or \t bar  or \n baz  '
          tokens = up.util.parseTokens(str)
          expect(tokens).toEqual ['foo', 'bar', 'baz']

        it 'does not consider plain whitespace to be a separator', ->
          str = 'foo bar baz'
          tokens = up.util.parseTokens(str, separator: 'or')
          expect(tokens).toEqual ['foo bar baz']

      describe 'with { separator: "comma" }', ->

        it 'parses tokens separated by a comma', ->
          str = 'foo, bar, baz'
          tokens = up.util.parseTokens(str, separator: 'comma')
          expect(tokens).toEqual ['foo', 'bar', 'baz']

        it 'trims whitespace', ->
          str = '\n foo   , \t bar  , \n baz  '
          tokens = up.util.parseTokens(str, separator: 'comma')
          expect(tokens).toEqual ['foo', 'bar', 'baz']

        it 'does not parse tokens separated by " or "', ->
          str = 'foo or bar or baz'
          tokens = up.util.parseTokens(str, separator: 'comma')
          expect(tokens).toEqual ['foo or bar or baz']

    describe 'up.util.objectContains()', ->

      it 'returns true if the first object has all properties of the second object, and then some more', ->
        expect(up.util.objectContains({ a: 1, b: 2 }, { a: 1 })).toBe(true)

      it 'returns true if both objects have the same properties', ->
        expect(up.util.objectContains({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)

      it 'returns false if a property value differs', ->
        expect(up.util.objectContains({ a: 1, b: 2 }, { a: 3 })).toBe(false)

      it 'returns false if the second object has additional keys', ->
        expect(up.util.objectContains({ a: 1, b: 2 }, { a: 1, d: 3 })).toBe(false)

    describe 'up.util.containsAll()', ->

      it 'returns true if the first array has all elements of the second array, and then some more', ->
        expect(up.util.containsAll(['a', 'b'], ['b'])).toBe(true)

      it 'returns true if the second array is empty', ->
        expect(up.util.containsAll(['a', 'b'], [])).toBe(true)

      it 'returns true if both arrays have the same elements', ->
        expect(up.util.containsAll(['a', 'b'], ['a', 'b'])).toBe(true)

      it 'ignores element order', ->
        expect(up.util.containsAll(['a', 'b'], ['b', 'a'])).toBe(true)

      it 'returns false if the second array has additional elements', ->
        expect(up.util.containsAll(['a', 'b'], ['a', 'b', 'c'])).toBe(false)

    describe 'up.util.evalOption()', ->

      it 'returns the given primitive value', ->
        expect(up.util.evalOption('foo')).toBe('foo')

      it 'calls the given function and returns its return value', ->
        fn = -> 'foo'
        expect(up.util.evalOption(fn)).toBe('foo')

      it 'calls the given function with additional args', ->
        sum = (a, b) -> a + b
        expect(up.util.evalOption(sum, 3, 2)).toBe(5)

    describe 'up.util.evalAutoOption()', ->

      describe 'if the first argument is a primitive value', ->

        it 'returns the first argument', ->
          autoDefault = 'auto default'
          expect(up.util.evalAutoOption('foo', autoDefault)).toBe('foo')

      describe 'if the first agument is "auto"', ->

        it 'returns the second argument if it is a primitive value', ->
          autoDefault = 'auto default'
          expect(up.util.evalAutoOption('auto', autoDefault)).toBe('auto default')

        it 'calls the second argument if it is a function, passing the 3rd...nth argument as function arguments', ->
          sum = (a, b) -> a + b
          expect(up.util.evalAutoOption('auto', sum, 2, 5)).toBe(7)

      describe 'if the first argument is a function', ->

        it 'calls the first argument', ->
          sum = (a, b) -> a + b
          autoDefault = 'auto default'
          expect(up.util.evalAutoOption(sum, autoDefault, 3, 5)).toBe(8)

        it 'still applies the auto default if the function returns "auto"', ->
          fn = -> 'auto'
          autoSum = (a, b) -> a + b
          expect(up.util.evalAutoOption(fn, autoSum, 3, 5)).toBe(8)
