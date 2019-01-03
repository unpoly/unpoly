u = up.util
e = up.element
$ = jQuery

describe 'up.util', ->

  describe 'JavaScript functions', ->

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

        foo1 = $fixture('.foo-element')[0]
        foo2 = $fixture('.foo-element')[0]
        bar = $fixture('.bar-element')[0]

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

    describe 'up.util.parseUrl', ->

      it 'parses a full URL', ->
        url = up.util.parseUrl('https://subdomain.domain.tld:123/path?search#hash')
        expect(url.protocol).toEqual('https:')
        expect(url.hostname).toEqual('subdomain.domain.tld')
        expect(url.port).toEqual('123')
        expect(url.pathname).toEqual('/path')
        expect(url.search).toEqual('?search')
        expect(url.hash).toEqual('#hash')

      it 'parses an absolute path', ->
        url = up.util.parseUrl('/qux/foo?search#bar')
        expect(url.protocol).toEqual(location.protocol)
        expect(url.hostname).toEqual(location.hostname)
        expect(url.port).toEqual(location.port)
        expect(url.pathname).toEqual('/qux/foo')
        expect(url.search).toEqual('?search')
        expect(url.hash).toEqual('#bar')

      it 'parses a relative path', ->
        up.history.config.enabled = true
        up.history.replace('/qux/')
        url = up.util.parseUrl('foo?search#bar')
        expect(url.protocol).toEqual(location.protocol)
        expect(url.hostname).toEqual(location.hostname)
        expect(url.port).toEqual(location.port)
        expect(url.pathname).toEqual('/qux/foo')
        expect(url.search).toEqual('?search')
        expect(url.hash).toEqual('#bar')

      it 'allows to pass a link element', ->
        link = document.createElement('a')
        link.href = '/qux/foo?search#bar'
        url = up.util.parseUrl(link)
        expect(url.protocol).toEqual(location.protocol)
        expect(url.hostname).toEqual(location.hostname)
        expect(url.port).toEqual(location.port)
        expect(url.pathname).toEqual('/qux/foo')
        expect(url.search).toEqual('?search')
        expect(url.hash).toEqual('#bar')

      it 'allows to pass a link element as a jQuery collection', ->
        $link = $('<a></a>').attr(href: '/qux/foo?search#bar')
        url = up.util.parseUrl($link)
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

    describe 'up.util.mapObject', ->

      it 'creates an object from the given array and pairer', ->
        array = ['foo', 'bar', 'baz']
        object = up.util.mapObject(array, (str) -> ["#{str}Key", "#{str}Value"])
        expect(object).toEqual
          fooKey: 'fooValue'
          barKey: 'barValue'
          bazKey: 'bazValue'

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

    describe 'up.util.muteRejection', ->

      it 'returns a promise that fulfills when the given promise fulfills', (done) ->
        fulfilledPromise = Promise.resolve()
        mutedPromise = up.util.muteRejection(fulfilledPromise)

        u.nextFrame ->
          promiseState(mutedPromise).then (result) ->
            expect(result.state).toEqual('fulfilled')
            done()

      it 'returns a promise that fulfills when the given promise rejects', (done) ->
        rejectedPromise = Promise.reject()
        mutedPromise = up.util.muteRejection(rejectedPromise)

        u.nextFrame ->
          promiseState(mutedPromise).then (result) ->
            expect(result.state).toEqual('fulfilled')
            done()

    describe 'up.util.simpleEase', ->

      it 'returns 0 for 0', ->
        expect(up.util.simpleEase(0)).toBe(0)

      it 'returns 1 for 1', ->
        expect(up.util.simpleEase(1)).toBe(1)

      it 'returns steadily increasing values between 0 and 1', ->
        expect(up.util.simpleEase(0.25)).toBeAround(0.25, 0.2)
        expect(up.util.simpleEase(0.50)).toBeAround(0.50, 0.2)
        expect(up.util.simpleEase(0.75)).toBeAround(0.75, 0.2)

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
        up.history.config.enabled = true
        up.history.replace('/qux/')
        expect(up.util.normalizeUrl('foo')).toBe("http://#{location.hostname}:#{location.port}/qux/foo")

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

      it 'returns a shallow copy of the given object', ->
        original = {a: 'b', c: [1, 2], d: 'e'}

        copy = up.util.copy(original)
        expect(copy).toEqual(original)

        # Test that changes to copy don't change original
        copy.f = 'g'
        expect(original.f).toBeMissing()

        # Test that the copy is shallow
        copy.c.push(3)
        expect(original.c).toEqual [1, 2, 3]

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

    describe 'up.util.deepCopy', ->

      it 'returns a deep copy of the given array', ->
        original = ['a', { b: 'c' }, 'd']

        copy = up.util.deepCopy(original)
        expect(copy).toEqual(original)

        # Test that changes to copy don't change original
        copy.pop()
        expect(copy.length).toBe(2)
        expect(original.length).toBe(3)

        # Test that the copy is deep
        copy[1].x = 'y'
        expect(original[1].x).toBeUndefined()

      it 'returns a deep copy of the given object', ->
        original = {a: 'b', c: [1, 2], d: 'e'}

        copy = up.util.deepCopy(original)
        expect(copy).toEqual(original)

        # Test that changes to copy don't change original
        copy.f = 'g'
        expect(original.f).toBeMissing()

        # Test that the copy is deep
        copy.c.push(3)
        expect(original.c).toEqual [1, 2]

    describe 'up.util.isList', ->

      it 'returns true for an array', ->
        value = [1, 2, 3]
        expect(up.util.isList(value)).toBe(true)

#      it 'returns true for an HTMLCollection', ->
#        value = document.getElementsByTagName('div')
#        expect(up.util.isList(value)).toBe(true)

      it 'returns true for a NodeList', ->
        value = document.querySelectorAll('div')
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
