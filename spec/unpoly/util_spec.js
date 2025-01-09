const u = up.util
const e = up.element
const $ = jQuery

describe('up.util', () => {

  describe('JavaScript functions', function() {

    describe('up.util.wrapList()', function() {

      describe('with null', function() {

        it('returns an empty array', function() {
          let result = up.util.wrapList(null)
          expect(result).toBeArray([])
          expect(result).toEqual([])
        })

      })

      describe('with undefined', function() {

        it('returns an empty array', function() {
          let result = up.util.wrapList(undefined)
          expect(result).toBeArray([])
          expect(result).toEqual([])
        })

      })

      describe('with a boolean value', function() {

        it('returns an array containing only that value', function() {
          expect(up.util.wrapList(true)).toEqual([true])
          expect(up.util.wrapList(false)).toEqual([false])
        })

      })

      describe('with a string', function() {

        it('returns an array containing only that string', function() {
          let result = up.util.wrapList('foo')
          expect(result).toBeArray([])
          expect(result).toEqual(['foo'])
        })

      })

      describe('for an array', function() {

        it('returns the array reference as it is', function() {
          let array = [1, 2, 3]
          expect(up.util.wrapList(array)).toBe(array)
        })

      })

      describe('for a NodeList', function() {

        it('returns the NodeList reference as it is', function() {
          let nodeList = document.querySelectorAll('div')
          expect(up.util.wrapList(nodeList)).toBe(nodeList)
        })

      })

    })

    describe('up.util.args()', function() {

      describe('val slots', function() {

        it('parses args', function() {
          let args = [0, 1, 2]
          let results = up.util.args(args, 'val', 'val', 'val')
          expect(results).toEqual([0, 1, 2])
        })

        it('parses args from the right if there are more args than specs', function() {
          let args = [0, 1, 2, 3]
          let results = up.util.args(args, 'val', 'val')
          expect(results).toEqual([2, 3])
        })

        it('returns undefined for positions that have a spec, but no arg', function() {
          let args = [0, 1]
          let results = up.util.args(args, 'val', 'val', 'val')
          expect(results).toEqual([undefined, 0, 1])
        })

      })

      describe('options slots', function() {

        it('parses a trailing options object', function() {
          let args = [0, 1, { foo: 'bar'} ]
          let results = up.util.args(args, 'val', 'val', 'options')
          expect(results).toEqual([0, 1, { foo: 'bar' }])
        })

        it('parses an empty object is no options object is trailing', function() {
          let args = [0, 1]
          let results = up.util.args(args, 'val', 'val', 'options')
          expect(results).toEqual([0, 1, { }])
        })

        it('parses options in the middle of a spec list', function() {
          expect(up.util.args([0, 1], 'val', 'options', 'val')).toEqual([0, {}, 1])
          expect(up.util.args([0, { foo: 'bar' }, 1], 'val', 'options', 'val')).toEqual([0, { foo: 'bar' }, 1])
        })

      })

      describe('callback slot', function() {

        it('parses a trailing function', function() {
          let fn = function() { console.log("fn!") }
          let args = [0, 1, fn]
          let results = up.util.args(args, 'val', 'val', 'callback')
          expect(results).toEqual([0, 1, fn])
        })

        it('parses undefined if no function is trailing', function() {
          let args = [0, 1]
          let results = up.util.args(args, 'val', 'val', 'callback')
          expect(results).toEqual([0, 1, undefined])
        })

      })

    })

    describe('up.util.cleaner()', function() {

      it('returns a function that collects clean-up action, which are executed when { clean } is called', function() {
        let cleaner = up.util.cleaner()
        let action1 = jasmine.createSpy('action 1')
        let action2 = jasmine.createSpy('action 2')
        cleaner(action1)
        cleaner(action2)

        expect(action1).not.toHaveBeenCalled()
        expect(action2).not.toHaveBeenCalled()

        cleaner.clean()

        expect(action1).toHaveBeenCalled()
        expect(action2).toHaveBeenCalled()
      })

      it('binds the returned { clean } function', function() {
        let cleaner = up.util.cleaner()
        let action = jasmine.createSpy('action')
        cleaner(action)

        let clean = cleaner.clean
        clean()

        expect(action).toHaveBeenCalled()
      })

      it("runs clean-up actions in the reverse order that they've been scheduled in", function() {
        let actions = []
        let cleaner = up.util.cleaner()
        cleaner(() => actions.push('one'))
        cleaner(() => actions.push('two'))

        cleaner.clean()

        expect(actions).toEqual(['two', 'one'])
      })

      it('accepts multiple clean-up actions as multiple arguments', function() {
        let cleaner = up.util.cleaner()
        let action1 = jasmine.createSpy('action 1')
        let action2 = jasmine.createSpy('action 2')
        cleaner(action1, action2)

        expect(action1).not.toHaveBeenCalled()
        expect(action2).not.toHaveBeenCalled()

        cleaner.clean()

        expect(action1).toHaveBeenCalled()
        expect(action2).toHaveBeenCalled()
      })

      it('accepts multiple clean-up actions as a single Array argument', function() {
        let cleaner = up.util.cleaner()
        let action1 = jasmine.createSpy('action 1')
        let action2 = jasmine.createSpy('action 2')
        cleaner([action1, action2])

        expect(action1).not.toHaveBeenCalled()
        expect(action2).not.toHaveBeenCalled()

        cleaner.clean()

        expect(action1).toHaveBeenCalled()
        expect(action2).toHaveBeenCalled()
      })

      it('ignores non-Function arguments', function() {
        let cleaner = up.util.cleaner()
        let action1 = jasmine.createSpy('action 1')
        let action2 = jasmine.createSpy('action 2')
        cleaner([action1, null, action2])

        expect(action1).not.toHaveBeenCalled()
        expect(action2).not.toHaveBeenCalled()

        let doClean = () => cleaner.clean()
        expect(doClean).not.toThrowError()

        expect(action1).toHaveBeenCalled()
        expect(action2).toHaveBeenCalled()
      })

      it('does not let clean-up actions schedule more clean-up actions', function() {
        let cleaner = up.util.cleaner()

        let recursiveAction = jasmine.createSpy('recursive action')
        let action = jasmine.createSpy('clean-up action').and.callFake(() => {
          cleaner(recursiveAction)
        })

        cleaner(action)

        expect(action).not.toHaveBeenCalled()
        expect(recursiveAction).not.toHaveBeenCalled()

        let doClean = () => cleaner.clean()
        expect(doClean).not.toThrowError()

        expect(action).toHaveBeenCalled()
        expect(recursiveAction).not.toHaveBeenCalled()
      })

      it('allows to re-use a cleaner function after cleaning, restarting with an empty list of clean-up actions', function() {
        let cleaner = up.util.cleaner()
        let action1 = jasmine.createSpy('action 1')
        let action2 = jasmine.createSpy('action 2')

        cleaner(action1)
        cleaner.clean()

        expect(action1.calls.count()).toBe(1)
        expect(action2.calls.count()).toBe(0)

        cleaner(action2)
        cleaner.clean()

        expect(action1.calls.count()).toBe(1)
        expect(action2.calls.count()).toBe(1)
      })

    })

    describe('up.util.isEqual', function() {

      describe('for an Element', function() {

        it('returns true for the same Element reference', function() {
          const div = document.createElement('div')
          expect(up.util.isEqual(div, div)).toBe(true)
        })

        it('returns false for a different Element reference', function() {
          const div1 = document.createElement('div')
          const div2 = document.createElement('div')
          expect(up.util.isEqual(div1, div2)).toBe(false)
        })

        it('returns false for a value this is no Element', function() {
          const div = document.createElement('div')
          expect(up.util.isEqual(div, 'other')).toBe(false)
        })
      })

      describe('for an Array', function() {

        it('returns true for a different Array reference with the same elements', function() {
          const array1 = ['foo', 'bar']
          const array2 = ['foo', 'bar']
          expect(up.util.isEqual(array1, array2)).toBe(true)
        })

        it('returns false for an Array with different elements', function() {
          const array1 = ['foo', 'bar']
          const array2 = ['foo', 'qux']
          expect(up.util.isEqual(array1, array2)).toBe(false)
        })

        it('returns false for an Array that is a suffix', function() {
          const array1 = ['foo', 'bar']
          const array2 = [       'bar']
          expect(up.util.isEqual(array1, array2)).toBe(false)
        })

        it('returns false for an Array that is a prefix', function() {
          const array1 = ['foo', 'bar']
          const array2 = ['foo'       ]
          expect(up.util.isEqual(array1, array2)).toBe(false)
        })

        it('returns true for a NodeList with the same elements', function() {
          const parent = e.affix(document.body, '.parent')
          const child1 = e.affix(parent, '.child.one')
          const child2 = e.affix(parent, '.child.two')

          const array = [child1, child2]
          const nodeList = parent.querySelectorAll('.child')

          expect(up.util.isEqual(array, nodeList)).toBe(true)
        })

        it('returns true for a HTMLCollection with the same elements', function() {
          const parent = e.affix(document.body, '.parent')
          const child1 = e.affix(parent, '.child.one')
          const child2 = e.affix(parent, '.child.two')

          const array = [child1, child2]
          const htmlCollection = parent.children

          expect(up.util.isEqual(array, htmlCollection)).toBe(true)
        })

        it('returns true for an arguments object with the same elements', function() {
          const toArguments = function() { return arguments }
          const array = ['foo', 'bar']
          const args = toArguments('foo', 'bar')

          expect(up.util.isEqual(array, args)).toBe(true)
        })

        it('returns false for a value that is no Array', function() {
          const array = ['foo', 'bar']
          expect(up.util.isEqual(array, 'foobar')).toBe(false)
        })
      })

      describe('for a string', function() {

        it('returns true for a different string reference with the same characters', function() {
          const string1 = 'bar'
          const string2 = 'bar'
          expect(up.util.isEqual(string1, string2)).toBe(true)
        })

        it('returns false for a string with different characters', function() {
          const string1 = 'foo'
          const string2 = 'bar'
          expect(up.util.isEqual(string1, string2)).toBe(false)
        })

        it('returns true for a String() object with the same characters', function() {
          const stringLiteral = 'bar'
          const stringObject = new String('bar')
          expect(up.util.isEqual(stringLiteral, stringObject)).toBe(true)
        })

        it('returns false for a String() object with different characters', function() {
          const stringLiteral = 'foo'
          const stringObject = new String('bar')
          expect(up.util.isEqual(stringLiteral, stringObject)).toBe(false)
        })

        it('returns false for a value that is no string', () => expect(up.util.isEqual('foo', ['foo'])).toBe(false))
      })

      describe('for a number', function() {

        it('returns true for a different number reference with the same integer value', function() {
          const number1 = 123
          const number2 = 123
          expect(up.util.isEqual(number1, number2)).toBe(true)
        })

        it('returns true for a different number reference with the same floating point value', function() {
          const number1 = 123.4
          const number2 = 123.4
          expect(up.util.isEqual(number1, number2)).toBe(true)
        })

        it('returns false for a number with a different value', function() {
          const number1 = 123
          const number2 = 124
          expect(up.util.isEqual(number1, number2)).toBe(false)
        })

        it('returns true for a Number() object with the same value', function() {
          const numberLiteral = 123
          const numberObject = new Number(123)
          expect(up.util.isEqual(numberLiteral, numberObject)).toBe(true)
        })

        it('returns false for a Number() object with a different value', function() {
          const numberLiteral = 123
          const numberObject = new Object(124)
          expect(up.util.isEqual(numberLiteral, numberObject)).toBe(false)
        })

        it('returns false for a value that is no number', () => {
          expect(up.util.isEqual(123, '123')).toBe(false)
        })
      })

      describe('for undefined', function() {

        it('returns true for undefined', () => {
          expect(up.util.isEqual(undefined, undefined)).toBe(true)
        })

        it('returns false for null', () => {
          expect(up.util.isEqual(undefined, null)).toBe(false)
        })

        it('returns false for NaN', () => {
          expect(up.util.isEqual(undefined, NaN)).toBe(false)
        })

        it('returns false for an empty Object', () => {
          expect(up.util.isEqual(undefined, {})).toBe(false)
        })

        it('returns false for an empty string', () => {
          expect(up.util.isEqual(undefined, '')).toBe(false)
        })
      })

      describe('for null', function() {

        it('returns true for null', () => {
          expect(up.util.isEqual(null, null)).toBe(true)
        })

        it('returns false for undefined', () => {
          expect(up.util.isEqual(null, undefined)).toBe(false)
        })

        it('returns false for NaN', () => {
          expect(up.util.isEqual(null, NaN)).toBe(false)
        })

        it('returns false for an empty Object', () => {
          expect(up.util.isEqual(null, {})).toBe(false)
        })

        it('returns false for an empty string', () => {
          expect(up.util.isEqual(null, '')).toBe(false)
        })
      })

      describe('for NaN', function() {

        it("returns false for NaN because it represents multiple values", () => {
          expect(up.util.isEqual(NaN, NaN)).toBe(false)
        })

        it('returns false for null', () => {
          expect(up.util.isEqual(NaN, null)).toBe(false)
        })

        it('returns false for undefined', () => {
          expect(up.util.isEqual(NaN, undefined)).toBe(false)
        })

        it('returns false for an empty Object', () => {
          expect(up.util.isEqual(NaN, {})).toBe(false)
        })

        it('returns false for an empty string', () => {
          expect(up.util.isEqual(NaN, '')).toBe(false)
        })
      })

      describe('for a Date', function() {

        it('returns true for another Date object that points to the same millisecond', function() {
          const d1 = new Date('1995-12-17T03:24:00')
          const d2 = new Date('1995-12-17T03:24:00')
          expect(up.util.isEqual(d1, d2)).toBe(true)
        })

        it('returns false for another Date object that points to another millisecond', function() {
          const d1 = new Date('1995-12-17T03:24:00')
          const d2 = new Date('1995-12-17T03:24:01')
          expect(up.util.isEqual(d1, d2)).toBe(false)
        })

        it('returns true for another Date object that points to the same millisecond in another time zone', function() {
          const d1 = new Date('2019-01-20T17:35:00+01:00')
          const d2 = new Date('2019-01-20T16:35:00+00:00')
          expect(up.util.isEqual(d1, d2)).toBe(true)
        })

        it('returns false for a value that is not a Date', function() {
          const d1 = new Date('1995-12-17T03:24:00')
          const d2 = '1995-12-17T03:24:00'
          expect(up.util.isEqual(d1, d2)).toBe(false)
        })
      })

      describe('for a plain Object', function() {

        it('returns true for the same reference', function() {
          const obj = {}
          const reference = obj
          expect(up.util.isEqual(obj, reference)).toBe(true)
        })

        it('returns true for another plain object with the same keys and values', function() {
          const obj1 = { foo: 'bar', baz: 'bam' }
          const obj2 = { foo: 'bar', baz: 'bam' }
          expect(up.util.isEqual(obj1, obj2)).toBe(true)
        })

        it('returns false for another plain object with the same keys, but different values', function() {
          const obj1 = { foo: 'bar', baz: 'bam' }
          const obj2 = { foo: 'bar', baz: 'qux' }
          expect(up.util.isEqual(obj1, obj2)).toBe(false)
        })

        it('returns false for another plain object that is missing a key', function() {
          const obj1 = { foo: 'bar', baz: 'bam' }
          const obj2 = { foo: 'bar'             }
          expect(up.util.isEqual(obj1, obj2)).toBe(false)
        })

        it('returns false for another plain object that has an additional key', function() {
          const obj1 = { foo: 'bar'             }
          const obj2 = { foo: 'bar', baz: 'bam' }
          expect(up.util.isEqual(obj1, obj2)).toBe(false)
        })

        it('returns false for a non-plain Object, even if it has the same keys and values', function() {
          class Account {
            constructor(email) {
              this.email = email
            }
          }

          const accountInstance = new Account('foo@example.com')
          const accountPlain = {}
          for (let key in accountInstance) {
            let value = accountInstance[key]
            accountPlain[key] = value
          }
          expect(up.util.isEqual(accountPlain, accountInstance)).toBe(false)
        })

        it('returns false for a value that is no object', function() {
          const obj = { foo: 'bar' }
          expect(up.util.isEqual(obj, 'foobar')).toBe(false)
        })
      })

      describe('for a non-Plain object', function() {

        it('returns true for the same reference', function() {
          const obj = new FormData()
          const reference = obj
          expect(up.util.isEqual(obj, reference)).toBe(true)
        })

        it('returns false for different references', function() {
          const obj1 = new FormData()
          const obj2 = new FormData()
          expect(up.util.isEqual(obj1, obj2)).toBe(false)
        })

        it('returns false for a different object with the same keys and values', function() {
          class Account {
            constructor(email) {
              this.email = email
            }
          }

          const account1 = new Account('foo@example.com')
          const account2 = new Account('bar@example.com')

          expect(up.util.isEqual(account1, account2)).toBe(false)
        })

        it('allows the object to hook into the comparison protocol by implementing a method called `up.util.isEqual.key`', function() {
          class Account {
            constructor(email) {
              this.email = email
            }
            [up.util.isEqual.key](other) {
              return this.email === other.email
            }
          }

          const account1 = new Account('foo@example.com')
          const account2 = new Account('bar@example.com')
          const account3 = new Account('foo@example.com')

          expect(up.util.isEqual(account1, account2)).toBe(false)
          expect(up.util.isEqual(account1, account3)).toBe(true)
        })

        it('returns false for a value that is no object', function() {
          class Account {
            constructor(email) {
              this.email = email
            }
          }

          const account = new Account('foo@example.com')

          expect(up.util.isEqual(account, 'foo@example.com')).toBe(false)
        })
      })
    })

    describe('up.util.isElementLike', function() {

      it('returns true for an element', function() {
        const value = document.body
        expect(up.util.isElementLike(value)).toBe(true)
      })

      it('returns true for a jQuery collection', function() {
        const value = $('body')
        expect(up.util.isElementLike(value)).toBe(true)
      })

      it('returns false for undefined', function() {
        const value = undefined
        expect(up.util.isElementLike(value)).toBe(false)
      })

      it('returns true for the document', function() {
        const value = document
        expect(up.util.isElementLike(value)).toBe(true)
      })

      it('returns true for the window', function() {
        const value = window
        expect(up.util.isElementLike(value)).toBe(true)
      })
    })

    describe('up.util.flatMap', function() {

      it('collects the Array results of the given map function, then concatenates the result arrays into one flat array', function() {
        const fun = x => [x, x]
        const result = up.util.flatMap([1, 2, 3], fun)
        expect(result).toEqual([1, 1, 2, 2, 3, 3])
      })

      it('builds an array from mixed function return values of scalar values and lists', function() {
        const fun = function(x) {
          if (x === 1) {
            return 1
          } else {
            return [x, x]
          }
        }

        const result = up.util.flatMap([0, 1, 2], fun)
        expect(result).toEqual([0, 0, 1, 2, 2])
      })


      it('flattens return values that are NodeLists', function() {
        const fun = selector => document.querySelectorAll(selector)

        const foo1 = fixture('.foo-element')
        const foo2 = fixture('.foo-element')
        const bar = fixture('.bar-element')

        const result = up.util.flatMap(['.foo-element', '.bar-element'], fun)

        expect(result).toEqual([foo1, foo2, bar])
      })
    })


    describe('up.util.uniq', function() {

      it('returns the given array with duplicates elements removed', function() {
        const input = [1, 2, 1, 1, 3]
        const result = up.util.uniq(input)
        expect(result).toEqual([1, 2, 3])
      })

      it('works on DOM elements', function() {
        const one = document.createElement("div")
        const two = document.createElement("div")
        const input = [one, one, two, two]
        const result = up.util.uniq(input)
        expect(result).toEqual([one, two])
      })

      it('preserves insertion order', function() {
        const input = [1, 2, 3, 4, 2, 1]
        const result = up.util.uniq(input)
        expect(result).toEqual([1, 2, 3, 4])
      })
    })

//    describe 'up.util.uniqBy', ->
//
//      it 'returns the given array with duplicate elements removed, calling the given function to determine value for uniqueness', ->
//        input = ["foo", "bar", "apple", 'orange', 'banana']
//        result = up.util.uniqBy(input, (element) -> element.length)
//        expect(result).toEqual ['foo', 'apple', 'orange']
//
//      it 'accepts a property name instead of a function, which collects that property from each item to compute uniquness', ->
//        input = ["foo", "bar", "apple", 'orange', 'banana']
//        result = up.util.uniqBy(input, 'length')
//        expect(result).toEqual ['foo', 'apple', 'orange']

//    describe 'up.util.parsePath', ->
//
//      it 'parses a plain name', ->
//        path = up.util.parsePath("foo")
//        expect(path).toEqual ['foo']
//
//      it 'considers underscores to be part of a name', ->
//        path = up.util.parsePath("foo_bar")
//        expect(path).toEqual ['foo_bar']
//
//      it 'considers dashes to be part of a name', ->
//        path = up.util.parsePath("foo-bar")
//        expect(path).toEqual ['foo-bar']
//
//      it 'parses dot-separated names into multiple path segments', ->
//        path = up.util.parsePath('foo.bar.baz')
//        expect(path).toEqual ['foo', 'bar', 'baz']
//
//      it 'parses nested params notation with square brackets', ->
//        path = up.util.parsePath('user[account][email]')
//        expect(path).toEqual ['user', 'account', 'email']
//
//      it 'parses double quotes in square brackets', ->
//        path = up.util.parsePath('user["account"]["email"]')
//        expect(path).toEqual ['user', 'account', 'email']
//
//      it 'parses single quotes in square brackets', ->
//        path = up.util.parsePath("user['account']['email']")
//        expect(path).toEqual ['user', 'account', 'email']
//
//      it 'allows square brackets inside quotes', ->
//        path = up.util.parsePath("element['a[up-href]']")
//        expect(path).toEqual ['element', 'a[up-href]']
//
//      it 'allows single quotes inside double quotes', ->
//        path = up.util.parsePath("element[\"a[up-href='foo']\"]")
//        expect(path).toEqual ['element', "a[up-href='foo']"]
//
//      it 'allows double quotes inside single quotes', ->
//        path = up.util.parsePath("element['a[up-href=\"foo\"]']")
//        expect(path).toEqual ['element', 'a[up-href="foo"]']
//
//      it 'allows dots in square brackets when it is quoted', ->
//        path = up.util.parsePath('elements[".foo"]')
//        expect(path).toEqual ['elements', '.foo']
//
//      it 'allows different notation for each segment', ->
//        path = up.util.parsePath('foo.bar[baz]["bam"][\'qux\']')
//        expect(path).toEqual ['foo', 'bar', 'baz', 'bam', 'qux']

    describe('up.util.parseURL', function() {

      it('parses a full URL', function() {
        const url = up.util.parseURL('https://subdomain.domain.tld:123/path?search#hash')
        expect(url.protocol).toEqual('https:')
        expect(url.hostname).toEqual('subdomain.domain.tld')
        expect(url.port).toEqual('123')
        expect(url.pathname).toEqual('/path')
        expect(url.search).toEqual('?search')
        expect(url.hash).toEqual('#hash')
      })

      it('parses an absolute path', function() {
        const url = up.util.parseURL('/qux/foo?search#bar')
        expect(url.protocol).toEqual(location.protocol)
        expect(url.hostname).toEqual(location.hostname)
        expect(url.port).toEqual(location.port)
        expect(url.pathname).toEqual('/qux/foo')
        expect(url.search).toEqual('?search')
        expect(url.hash).toEqual('#bar')
      })

      it('parses a relative path', function() {
        up.history.config.enabled = true
        up.history.replace('/qux/')
        const url = up.util.parseURL('foo?search#bar')
        expect(url.protocol).toEqual(location.protocol)
        expect(url.hostname).toEqual(location.hostname)
        expect(url.port).toEqual(location.port)
        expect(url.pathname).toEqual('/qux/foo')
        expect(url.search).toEqual('?search')
        expect(url.hash).toEqual('#bar')
      })

      it('allows to pass a link element', function() {
        const link = document.createElement('a')
        link.href = '/qux/foo?search#bar'
        const url = up.util.parseURL(link)
        expect(url.protocol).toEqual(location.protocol)
        expect(url.hostname).toEqual(location.hostname)
        expect(url.port).toEqual(location.port)
        expect(url.pathname).toEqual('/qux/foo')
        expect(url.search).toEqual('?search')
        expect(url.hash).toEqual('#bar')
      })
    })

    describe('up.util.map', function() {

      it('creates a new array of values by calling the given function on each item of the given array', function() {
        const array = ["apple", "orange", "cucumber"]
        const mapped = up.util.map(array, element => element.length)
        expect(mapped).toEqual([5, 6, 8])
      })

      it('accepts a property name instead of a function, which collects that property from each item', function() {
        const array = ["apple", "orange", "cucumber"]
        const mapped = up.util.map(array, 'length')
        expect(mapped).toEqual([5, 6, 8])
      })

      it('passes the iteration index as second argument to the given function', function() {
        const array = ["apple", "orange", "cucumber"]
        const mapped = up.util.map(array, (element, i) => i)
        expect(mapped).toEqual([0, 1, 2])
      })

      it('maps over a NodeList collection', function() {
        const one = fixture('.qwertz[data-value=one]')
        const two = fixture('.qwertz[data-value=two]')
        const collection = document.querySelectorAll('.qwertz')

        const result = up.util.map(collection, elem => elem.dataset.value)
        expect(result).toEqual(['one', 'two'])
      })

      it('maps over a jQuery collection', function() {
        const one = fixture('.one')
        const two = fixture('.two')
        const collection = jQuery([one, two])

        const result = up.util.map(collection, 'className')
        expect(result).toEqual(['one', 'two'])
      })

      it('maps over a Set', function() {
        const set = new Set(["foo", "orange", "cucumber"])
        const results = up.util.map(set, item => item.length)
        expect(results).toEqual([3, 6, 8])
      })

      it('maps over an iterator', function() {
        const set = new Set(["foo", "orange", "cucumber"])
        const iterator = set.values()
        const results = up.util.map(iterator, item => item.length)
        expect(results).toEqual([3, 6, 8])
      })
    })


    describe('up.util.mapObject', () => it('creates an object from the given array and pairer', function() {
      const array = ['foo', 'bar', 'baz']
      const object = up.util.mapObject(array, str => [`${str}Key`, `${str}Value`])
      expect(object).toEqual({
        fooKey: 'fooValue',
        barKey: 'barValue',
        bazKey: 'bazValue'
      })
    }))

    describe('up.util.each', function() {

      it('calls the given function once for each item of the given array', function() {
        const args = []
        const array = ["apple", "orange", "cucumber"]
        up.util.each(array, item => args.push(item))
        expect(args).toEqual(["apple", "orange", "cucumber"])
      })

      it('passes the iteration index as second argument to the given function', function() {
        const args = []
        const array = ["apple", "orange", "cucumber"]
        up.util.each(array, (item, index) => args.push(index))
        expect(args).toEqual([0, 1, 2])
      })

      it('iterates over a NodeList', function() {
        const one = fixture('.qwertz')
        const two = fixture('.qwertz')
        const nodeList = document.querySelectorAll('.qwertz')

        const callback = jasmine.createSpy()

        up.util.each(nodeList, callback)
        expect(callback.calls.allArgs()).toEqual([[one, 0], [two, 1]])
      })

      it('iterates over a jQuery collection', function() {
        const one = fixture('.qwertz')
        const two = fixture('.qwertz')
        const nodeList = jQuery([one, two])
        const callback = jasmine.createSpy()

        up.util.each(nodeList, callback)

        expect(callback.calls.allArgs()).toEqual([[one, 0], [two, 1]])
      })

      it('iterates over a Set', function() {
        const set = new Set(["foo", "orange", "cucumber"])
        const callback = jasmine.createSpy()

        up.util.each(set, callback)

        expect(callback.calls.allArgs()).toEqual([['foo', 0], ['orange', 1], ['cucumber', 2]])
      })

      it('iterates over an iterator', function() {
        const set = new Set(["foo", "orange", "cucumber"])
        const iterator = set.values()
        const callback = jasmine.createSpy()

        up.util.each(iterator, callback)

        expect(callback.calls.allArgs()).toEqual([['foo', 0], ['orange', 1], ['cucumber', 2]])
      })
    })

    describe('up.util.filter', function() {

      it('returns an array of those elements in the given array for which the given function returns true', function() {
        const array = ["foo", "orange", "cucumber"]
        const results = up.util.filter(array, item => item.length > 3)
        expect(results).toEqual(['orange', 'cucumber'])
      })

      it('passes the iteration index as second argument to the given function', function() {
        const array = ["apple", "orange", "cucumber", "banana"]
        const results = up.util.filter(array, (item, index) => (index % 2) === 0)
        expect(results).toEqual(['apple', 'cucumber'])
      })

      it('accepts a property name instead of a function, which checks that property from each item', function() {
        const array = [ { name: 'a', prop: false }, { name: 'b', prop: true } ]
        const results = up.util.filter(array, 'prop')
        expect(results).toEqual([{ name: 'b', prop: true }])
      })

      it('iterates over an array-like value', function() {
        const one = fixture('.qwertz')
        const two = fixture('.qwertz')
        const nodeList = document.querySelectorAll('.qwertz')

        const callback = jasmine.createSpy()

        up.util.filter(nodeList, callback)
        expect(callback.calls.allArgs()).toEqual([[one, 0], [two, 1]])
      })

      it('iterates over a Set', function() {
        const set = new Set(["foo", "orange", "cucumber"])
        const results = up.util.filter(set, item => item.length > 3)
        expect(results).toEqual(['orange', 'cucumber'])
      })

      it('iterates over an iterator', function() {
        const set = new Set(["foo", "orange", "cucumber"])
        const iterator = set.values()
        const results = up.util.filter(iterator, item => item.length > 3)
        expect(results).toEqual(['orange', 'cucumber'])
      })
    })

    describe('up.util.reject', function() {

      it('returns an array of those elements in the given array for which the given function returns false', function() {
        const array = ["foo", "orange", "cucumber"]
        const results = up.util.reject(array, item => item.length < 4)
        expect(results).toEqual(['orange', 'cucumber'])
      })

      it('passes the iteration index as second argument to the given function', function() {
        const array = ["apple", "orange", "cucumber", "banana"]
        const results = up.util.reject(array, (item, index) => (index % 2) === 0)
        expect(results).toEqual(['orange', 'banana'])
      })

      it('accepts a property name instead of a function, which checks that property from each item', function() {
        const array = [ { name: 'a', prop: false }, { name: 'b', prop: true } ]
        const results = up.util.reject(array, 'prop')
        expect(results).toEqual([{ name: 'a', prop: false }])
      })

      it('iterates over an array-like value', function() {
        const one = fixture('.qwertz')
        const two = fixture('.qwertz')
        const nodeList = document.querySelectorAll('.qwertz')

        const callback = jasmine.createSpy()

        up.util.reject(nodeList, callback)
        expect(callback.calls.allArgs()).toEqual([[one, 0], [two, 1]])
      })
    })

//    describe 'up.util.previewable', ->
//
//      it 'wraps a function into a proxy function with an additional .promise attribute', ->
//        fun = -> 'return value'
//        proxy = up.util.previewable(fun)
//        expect(u.isFunction(proxy)).toBe(true)
//        expect(u.isPromise(proxy.promise)).toBe(true)
//        expect(proxy()).toEqual('return value')
//
//      it "resolves the proxy's .promise when the inner function returns", (done) ->
//        fun = -> 'return value'
//        proxy = up.util.previewable(fun)
//        callback = jasmine.createSpy('promise callback')
//        proxy.promise.then(callback)
//        u.task ->
//          expect(callback).not.toHaveBeenCalled()
//          proxy()
//          u.task ->
//            expect(callback).toHaveBeenCalledWith('return value')
//            done()
//
//      it "delays resolution of the proxy's .promise if the inner function returns a promise", (done) ->
//        funDeferred = u.newDeferred()
//        fun = -> funDeferred
//        proxy = up.util.previewable(fun)
//        callback = jasmine.createSpy('promise callback')
//        proxy.promise.then(callback)
//        proxy()
//        u.task ->
//          expect(callback).not.toHaveBeenCalled()
//          funDeferred.resolve('return value')
//          u.task ->
//            expect(callback).toHaveBeenCalledWith('return value')
//            done()

    describe('up.util.sequence', () => it('combines the given functions into a single function', function() {
      const values = []
      const one = () => values.push('one')
      const two = () => values.push('two')
      const three = () => values.push('three')
      const sequence = up.util.sequence([one, two, three])
      expect(values).toEqual([])
      sequence()
      expect(values).toEqual(['one', 'two', 'three'])
    }))

    describe('up.util.timer', function() {

      it('calls the given function after waiting the given milliseconds', function(done) {
        const callback = jasmine.createSpy()
        const expectNotCalled = () => expect(callback).not.toHaveBeenCalled()
        const expectCalled = () => expect(callback).toHaveBeenCalled()

        up.util.timer(100, callback)

        expectNotCalled()
        setTimeout(expectNotCalled, 50)
        setTimeout(expectCalled, 50 + 75)
        return setTimeout(done, 50 + 75)
      })

      describe('if the delay is zero', () => it('calls the given function in the next execution frame', function() {
        const callback = jasmine.createSpy()
        up.util.timer(0, callback)
        expect(callback).not.toHaveBeenCalled()

        return setTimeout((() => expect(callback).toHaveBeenCalled()), 0)
      }))
    })

//    describe 'up.util.argNames', ->
//
//      it 'returns an array of argument names for the given function', ->
//        fun = ($element, data) ->
//        expect(up.util.argNames(fun)).toEqual(['$element', 'data'])

    describe('up.util.pick', function() {

      it('returns a copy of the given object with only the given whitelisted properties', function() {
        const original = {
          foo: 'foo-value',
          bar: 'bar-value',
          baz: 'baz-value',
          bam: 'bam-value'
        }
        const whitelisted = up.util.pick(original, ['bar', 'bam'])
        expect(whitelisted).toEqual({
          bar: 'bar-value',
          bam: 'bam-value'
        })
        // Show that original did not change
        expect(original).toEqual({
          foo: 'foo-value',
          bar: 'bar-value',
          baz: 'baz-value',
          bam: 'bam-value'
        })
      })

      it('does not add empty keys to the returned object if the given object does not have that key', function() {
        const original =
          {foo: 'foo-value'}
        const whitelisted = up.util.pick(original, ['foo', 'bar'])
        expect(whitelisted).toHaveOwnProperty('foo')
        expect(whitelisted).not.toHaveOwnProperty('bar')
      })

      it('copies properties that are computed by a getter', function() {
        const original = {
          foo: 'foo-value',
          bar: 'bar-value'
        }
        Object.defineProperty(original, 'baz', {get() { return 'baz-value' }})
        const whitelisted = up.util.pick(original, ['foo', 'baz'])
        expect(whitelisted).toEqual({
          foo: 'foo-value',
          baz: 'baz-value'
        })
      })

      it('copies inherited properties', function() {
        const parent =
          {foo: 'foo-value'}
        const child = Object.create(parent)
        child.bar = 'bar-value'
        child.baz = 'baz-value'
        const whitelisted = up.util.pick(child, ['foo', 'baz'])
        expect(whitelisted).toEqual({
          foo: 'foo-value',
          baz: 'baz-value'
        })
      })
    })

    describe('up.util.omit', function() {

      it('returns a copy of the given object but omits the given blacklisted properties', function() {
        const original = {
          foo: 'foo-value',
          bar: 'bar-value',
          baz: 'baz-value',
          bam: 'bam-value'
        }
        const whitelisted = up.util.omit(original, ['foo', 'baz'])
        expect(whitelisted).toEqual({
          bar: 'bar-value',
          bam: 'bam-value'
        })
        // Show that original did not change
        expect(original).toEqual({
          foo: 'foo-value',
          bar: 'bar-value',
          baz: 'baz-value',
          bam: 'bam-value'
        })
      })

      it('copies inherited properties', function() {
        const parent = {
          foo: 'foo-value',
          bar: 'bar-value'
        }
        const child = Object.create(parent)
        child.baz = 'baz-value'
        child.bam = 'bam-value'
        const whitelisted = up.util.omit(child, ['foo', 'baz'])
        expect(whitelisted).toEqual({
          bar: 'bar-value',
          bam: 'bam-value'
        })
      })
    })

    describe('up.util.every', function() {

      it('returns true if all element in the array returns true for the given function', function() {
        const result = up.util.every(['foo', 'bar', 'baz'], up.util.isPresent)
        expect(result).toBe(true)
      })

      it('returns false if an element in the array returns false for the given function', function() {
        const result = up.util.every(['foo', 'bar', null, 'baz'], up.util.isPresent)
        expect(result).toBe(false)
      })

      it('short-circuits once an element returns false', function() {
        let count = 0
        up.util.every(['foo', 'bar', '', 'baz'], function(element) {
          count += 1
          return up.util.isPresent(element)
        })
        expect(count).toBe(3)
      })

      it('passes the iteration index as second argument to the given function', function() {
        const array = ["apple", "orange", "cucumber"]
        const args = []
        up.util.every(array, function(item, index) {
          args.push(index)
          return true
        })
        expect(args).toEqual([0, 1, 2])
      })

      it('accepts a property name instead of a function, which collects that property from each item', function() {
        const allTrue = [ { prop: true }, { prop: true } ]
        const someFalse = [ { prop: true }, { prop: false } ]
        expect(up.util.every(allTrue, 'prop')).toBe(true)
        expect(up.util.every(someFalse, 'prop')).toBe(false)
      })

      it('iterates over a Set', function() {
        const set = new Set(["foo", "orange", "cucumber"])
        const result = up.util.every(set, up.util.isPresent)
        expect(result).toBe(true)
      })

      it('iterates over an iterator', function() {
        const set = new Set(["foo", "orange", "cucumber"])
        const iterator = set.values()
        const result = up.util.every(iterator, up.util.isPresent)
        expect(result).toBe(true)
      })
    })

//    describe 'up.util.none', ->
//
//      it 'returns true if no element in the array returns true for the given function', ->
//        result = up.util.none ['foo', 'bar', 'baz'], up.util.isBlank
//        expect(result).toBe(true)
//
//      it 'returns false if an element in the array returns false for the given function', ->
//        result = up.util.none ['foo', 'bar', null, 'baz'], up.util.isBlank
//        expect(result).toBe(false)
//
//      it 'short-circuits once an element returns true', ->
//        count = 0
//        up.util.none ['foo', 'bar', '', 'baz'], (element) ->
//          count += 1
//          up.util.isBlank(element)
//        expect(count).toBe(3)
//
//      it 'passes the iteration index as second argument to the given function', ->
//        array = ["apple", "orange", "cucumber"]
//        args = []
//        up.util.none array, (item, index) ->
//          args.push(index)
//          false
//        expect(args).toEqual [0, 1, 2]
//
//      it 'accepts a property name instead of a function, which collects that property from each item', ->
//        allFalse = [ { prop: false }, { prop: false } ]
//        someTrue = [ { prop: true }, { prop: false } ]
//        expect(up.util.none(allFalse, 'prop')).toBe(true)
//        expect(up.util.none(someTrue, 'prop')).toBe(false)

    describe('up.util.some', function() {

      it('returns true if at least one element in the array returns true for the given function', function() {
        const result = up.util.some(['', 'bar', null], up.util.isPresent)
        expect(result).toBe(true)
      })

      it('returns false if no element in the array returns true for the given function', function() {
        const result = up.util.some(['', null, undefined], up.util.isPresent)
        expect(result).toBe(false)
      })

      it('passes the iteration index as second argument to the given function', function() {
        const array = ["apple", "orange", "cucumber"]
        const args = []
        up.util.some(array, function(item, index) {
          args.push(index)
          return false
        })
        expect(args).toEqual([0, 1, 2])
      })

      it('accepts a property name instead of a function, which collects that property from each item', function() {
        const someTrue = [ { prop: true }, { prop: false } ]
        const allFalse = [ { prop: false }, { prop: false } ]
        expect(up.util.some(someTrue, 'prop')).toBe(true)
        expect(up.util.some(allFalse, 'prop')).toBe(false)
      })

      it('short-circuits once an element returns true', function() {
        let count = 0
        up.util.some([null, undefined, 'foo', ''], function(element) {
          count += 1
          return up.util.isPresent(element)
        })
        expect(count).toBe(3)
      })

      it('iterates over an array-like value', function() {
        const one = fixture('.qwertz')
        const two = fixture('.qwertz')
        const nodeList = document.querySelectorAll('.qwertz')

        const callback = jasmine.createSpy()

        up.util.some(nodeList, callback)
        expect(callback.calls.allArgs()).toEqual([[one, 0], [two, 1]])
      })
    })

    describe('up.util.findResult', function() {

      it('consecutively applies the function to each array element and returns the first truthy return value', function() {
        const map = {
          a: '',
          b: null,
          c: undefined,
          d: 'DEH',
          e: 'EH'
        }
        const fn = el => map[el]

        const result = up.util.findResult(['a', 'b', 'c', 'd', 'e'], fn)
        expect(result).toEqual('DEH')
      })

      it('returns undefined if the function does not return a truthy value for any element in the array', function() {
        const map = {}
        const fn = el => map[el]

        const result = up.util.findResult(['a', 'b', 'c'], fn)
        expect(result).toBeUndefined()
      })

      it('iterates over a NodeList', function() {
        const one = fixture('.qwertz')
        const two = fixture('.qwertz')
        const nodeList = document.querySelectorAll('.qwertz')
        const callback = jasmine.createSpy()

        up.util.findResult(nodeList, callback)
        expect(callback.calls.allArgs()).toEqual([[one, 0], [two, 1]])
      })

      it('iterates over a Set', function() {
        const set = new Set(["foo", "orange", "cucumber"])
        const callback = jasmine.createSpy()

        up.util.findResult(set, callback)

        expect(callback.calls.allArgs()).toEqual([['foo', 0], ['orange', 1], ['cucumber', 2]])
      })

      it('iterates over an iterator', function() {
        const set = new Set(["foo", "orange", "cucumber"])
        const iterator = set.values()
        const callback = jasmine.createSpy()

        up.util.findResult(iterator, callback)

        expect(callback.calls.allArgs()).toEqual([['foo', 0], ['orange', 1], ['cucumber', 2]])
      })
    })

    describe('up.util.isBlank', function() {

      it('returns false for false', () => {
        expect(up.util.isBlank(false)).toBe(false)
      })

      it('returns false for true', () => {
        expect(up.util.isBlank(true)).toBe(false)
      })

      it('returns true for null', () => {
        expect(up.util.isBlank(null)).toBe(true)
      })

      it('returns true for undefined', () => {
        expect(up.util.isBlank(undefined)).toBe(true)
      })

      it('returns true for an empty String', () => {
        expect(up.util.isBlank('')).toBe(true)
      })

      it('returns false for a String with at least one character', () => {
        expect(up.util.isBlank('string')).toBe(false)
      })

      it('returns true for an empty array', () => {
        expect(up.util.isBlank([])).toBe(true)
      })

      it('returns false for an array with at least one element', () => {
        expect(up.util.isBlank(['element'])).toBe(false)
      })

      it('returns true for an empty jQuery collection', () => {
        expect(up.util.isBlank($([]))).toBe(true)
      })

      it('returns false for a jQuery collection with at least one element', () => {
        expect(up.util.isBlank($('body'))).toBe(false)
      })

      it('returns true for an empty object', () => {
        expect(up.util.isBlank({})).toBe(true)
      })

      it('returns false for a function', () => {
        expect(up.util.isBlank((function() {}))).toBe(false)
      })

      it('returns true for an object with at least one key', () => {
        expect(up.util.isBlank({key: 'value'})).toBe(false)
      })

      it('returns true for an object with an [up.util.isBlank.key] method that returns true', function() {
        const value = {}
        value[up.util.isBlank.key] = () => true
        expect(up.util.isBlank(value)).toBe(true)
      })

      it('returns false for an object with an [up.util.isBlank.key] method that returns false', function() {
        const value = {}
        value[up.util.isBlank.key] = () => false
        expect(up.util.isBlank(value)).toBe(false)
      })

      it('returns false for a DOM element', function() {
        const value = document.body
        expect(up.util.isBlank(value)).toBe(false)
      })
    })

    describe('up.util.normalizeURL', function() {

      it('normalizes a relative path', function() {
        up.history.config.enabled = true
        up.history.replace('/qux/')
        expect(up.util.normalizeURL('foo')).toBe("/qux/foo")
      })

      it('normalizes an absolute path', () => {
        expect(up.util.normalizeURL('/foo')).toBe("/foo")
      })

      it('preserves a protocol and hostname for a URL from another domain', () => {
        expect(up.util.normalizeURL('http://example.com/foo/bar')).toBe('http://example.com/foo/bar')
      })

      it('removes a standard port for http:// URLs', () => {
        expect(up.util.normalizeURL('http://example.com:80/foo/bar')).toBe('http://example.com/foo/bar')
      })

      it('removes a standard port for https:// URLs', () => {
        expect(up.util.normalizeURL('https://example.com:443/foo/bar')).toBe('https://example.com/foo/bar')
      })

      it('preserves a non-standard port', () => {
        expect(up.util.normalizeURL('http://example.com:8080/foo/bar')).toBe('http://example.com:8080/foo/bar')
      })

      it('preserves a query string', () => {
        expect(up.util.normalizeURL('/foo/bar?key=value')).toBe('/foo/bar?key=value')
      })

      it('strips a query string with { search: false } option', () => {
        expect(up.util.normalizeURL('/foo/bar?key=value', {search: false})).toBe('/foo/bar')
      })

      it('normalizes a result from up.util.parseURL()', function() {
        const url = up.util.parseURL('/foo')
        expect(up.util.normalizeURL(url)).toBe("/foo")
      })

      it('normalizes a URL', function() {
        const url = new URL('/foo', location.href)
        expect(up.util.normalizeURL(url)).toBe("/foo")
      })

      describe('trailing slashes', function() {

        it('does not strip a trailing slash by default', () => {
          expect(up.util.normalizeURL('/foo/')).toEqual("/foo/")
        })

        it('strips a trailing slash with { trailingSlash: false }', () => {
          expect(up.util.normalizeURL('/foo/', {trailingSlash: false})).toEqual("/foo")
        })

        it('does not strip a trailing slash when passed the "/" URL', () => {
          expect(up.util.normalizeURL('/', {trailingSlash: false})).toEqual("/")
        })
      })

      it('normalizes redundant segments', () => {
        expect(up.util.normalizeURL('/foo/../foo')).toBe("/foo")
      })

      describe('hash fragments', function() {

        it('strips a #hash with { hash: false }', () => {
          expect(up.util.normalizeURL('/foo/bar#fragment', {hash: false})).toBe('/foo/bar')
        })

        it('preserves a #hash by default', () => {
          expect(up.util.normalizeURL('/foo/bar#fragment')).toBe('/foo/bar#fragment')
        })

        it('puts a #hash behind the query string', () => {
          expect(up.util.normalizeURL('/foo/bar?key=value#fragment')).toBe('/foo/bar?key=value#fragment')
        })
      })
    })

    describe('up.util.find', function() {

      it('finds the first element in the given array that matches the given tester', function() {
        const array = ['foo', 'bar', 'baz']
        const tester = element => element[0] === 'b'
        expect(up.util.find(array, tester)).toEqual('bar')
      })

      it("returns undefined if the given array doesn't contain a matching element", function() {
        const array = ['foo', 'bar', 'baz']
        const tester = element => element[0] === 'z'
        expect(up.util.find(array, tester)).toBeUndefined()
      })
    })

    describe('up.util.remove', function() {

      it('removes the given string from the given array', function() {
        const array = ['a', 'b', 'c']
        up.util.remove(array, 'b')
        expect(array).toEqual(['a', 'c'])
      })

      it('removes the given object from the given array', function() {
        const obj1 = { 'key': 1 }
        const obj2 = { 'key': 2 }
        const obj3 = { 'key': 3 }
        const array = [obj1, obj2, obj3]
        up.util.remove(array, obj2)
        expect(array).toEqual([obj1, obj3])
      })

      it('returns the removed value if the array was changed', function() {
        const array = ['a', 'b', 'c']
        const returned = up.util.remove(array, 'b')
        expect(returned).toBe('b')
      })

      it("returns undefined if the given array didn't contain the given value", function() {
        const array = ['a', 'b', 'c']
        const returned = up.util.remove(array, 'd')
        expect(returned).toBeUndefined()
      })
    })

    describe('up.util.contains()', function() {

      describe('for a string', function() {

        it('returns true if the given string contains the given substring', () => expect(up.util.contains('foobar', 'oba')).toBe(true))

        it('returns false if the given string does not contain the given substring', () => expect(up.util.contains('foobar', 'baz')).toBe(false))
      })

      describe('for an array', function() {

        it('returns true if the given array contains the given element', () => expect(up.util.contains(['foo', 'bar', 'baz'], 'bar')).toBe(true))

        it('returns false if the given array does not contain the given element', () => expect(up.util.contains(['foo', 'bar', 'baz'], 'qux')).toBe(false))
      })

      describe('for a NodeList', function() {

        it('returns true if the given NodeList contains the given element', () => expect(up.util.contains(document.querySelectorAll('body'), document.body)).toBe(true))

        it('returns false if the given NodeList does not contain the given element', () => expect(up.util.contains(document.querySelectorAll('div'), document.body)).toBe(false))
      })
    })

    describe('up.util.unresolvablePromise', function() {

      it('return a pending promise', function(done) {
        const promise = up.util.unresolvablePromise()
        promiseState(promise).then(function(result) {
          expect(result.state).toEqual('pending')
          done()
        })

      })

      it('returns a different object every time (to prevent memory leaks)', function() {
        const one = up.util.unresolvablePromise()
        const two = up.util.unresolvablePromise()
        expect(one).not.toBe(two)
      })
    })

    describe('up.util.flatten', function() {

      it('flattens the given array', function() {
        const array = [1, [2, 3], 4]
        expect(u.flatten(array)).toEqual([1, 2, 3, 4])
      })

      it('only flattens one level deep for performance reasons', function() {
        const array = [1, [2, [3,4]], 5]
        expect(u.flatten(array)).toEqual([1, 2, [3, 4], 5])
      })
    })

    describe('up.util.renameKey', () => it('renames a key in the given property', function() {
      const object = { a: 'a value', b: 'b value'}
      u.renameKey(object, 'a', 'c')
      expect(object.a).toBeUndefined()
      expect(object.b).toBe('b value')
      expect(object.c).toBe('a value')
    }))

    describe('up.util.isCrossOrigin', function() {

      it('returns false for an absolute path', () => {
        expect(up.util.isCrossOrigin('/foo')).toBe(false)
      })

      it('returns false for an relative path', () => {
        expect(up.util.isCrossOrigin('foo')).toBe(false)
      })

      it('returns false for a fully qualified URL with the same protocol and hostname as the current location', function() {
        const fullURL = `${location.protocol}//${location.host}/foo`
        expect(up.util.isCrossOrigin(fullURL)).toBe(false)
      })

      it('returns true for a fully qualified URL with a different protocol than the current location', function() {
        const fullURL = `otherprotocol://${location.host}/foo`
        expect(up.util.isCrossOrigin(fullURL)).toBe(true)
      })

      it('returns false for a fully qualified URL with a different hostname than the current location', function() {
        const fullURL = `${location.protocol}//other-host.tld/foo`
        expect(up.util.isCrossOrigin(fullURL)).toBe(true)
      })
    })

    describe('up.util.isOptions', function() {

      it('returns true for an Object instance', () => {
        expect(up.util.isOptions(new Object())).toBe(true)
      })

      it('returns true for an object literal', () => {
        expect(up.util.isOptions({ foo: 'bar'})).toBe(true)
      })

      it('returns true for a prototype-less object', () => {
        expect(up.util.isOptions(Object.create(null))).toBe(true)
      })

      it('returns false for undefined', () => {
        expect(up.util.isOptions(undefined)).toBe(false)
      })

      it('returns false for null', () => {
        expect(up.util.isOptions(null)).toBe(false)
      })

      it('returns false for a function (which is technically an object)', function() {
        const fn = () => 'foo'
        fn.key = 'value'
        expect(up.util.isOptions(fn)).toBe(false)
      })

      it('returns false for an Array', () => {
        expect(up.util.isOptions(['foo'])).toBe(false)
      })

      it('returns false for a jQuery collection', () => {
        expect(up.util.isOptions($('body'))).toBe(false)
      })

      it('returns false for a Promise', () => {
        expect(up.util.isOptions(Promise.resolve())).toBe(false)
      })

      it('returns false for a FormData object', () => {
        expect(up.util.isOptions(new FormData())).toBe(false)
      })

      it('returns false for a Date', () => {
        expect(up.util.isOptions(new Date())).toBe(false)
      })

      it('returns false for a RegExp', () => {
        expect(up.util.isOptions(/foo/)).toBe(false)
      })
    })

    describe('up.util.isObject', function() {

      it('returns true for an Object instance', () => {
        expect(up.util.isObject(new Object())).toBe(true)
      })

      it('returns true for an object literal', () => {
        expect(up.util.isObject({ foo: 'bar'})).toBe(true)
      })

      it('returns false for undefined', () => {
        expect(up.util.isObject(undefined)).toBe(false)
      })

      it('returns false for null', () => {
        expect(up.util.isObject(null)).toBe(false)
      })

      it('returns true for a function (which is technically an object)', function() {
        const fn = () => 'foo'
        fn.key = 'value'
        expect(up.util.isObject(fn)).toBe(true)
      })

      it('returns true for an array', () => {
        expect(up.util.isObject(['foo'])).toBe(true)
      })

      it('returns true for a jQuery collection', () => {
        expect(up.util.isObject($('body'))).toBe(true)
      })

      it('returns true for a promise', () => {
        expect(up.util.isObject(Promise.resolve())).toBe(true)
      })

      it('returns true for a FormData object', () => {
        expect(up.util.isObject(new FormData())).toBe(true)
      })
    })

    describe('up.util.merge', function() {

      it('merges the given objects', function() {
        const obj = { a: '1', b: '2' }
        const other = { b: '3', c: '4' }
        const result = up.util.merge(obj, other)
        expect(result).toEqual({ a: '1', b: '3', c: '4' })
      })

      it('merges more than two objects', function() {
        const a = { a: '1' }
        const b = { b: '2' }
        const c = { c: '3' }
        const result = up.util.merge(a, b, c)
        expect(result).toEqual({ a: '1', b: '2', c: '3' })
      })

      it('does not mutate the first argument', function() {
        const a = { a: '1' }
        const b = { b: '2' }
        const result = up.util.merge(a, b)
        expect(a).toEqual({ a: '1' })
      })

      it('returns an empty object if called without arguments', function() {
        const result = up.util.merge()
        expect(result).toEqual({})
      })

      it('overrides (not merges) keys with object value', function() {
        let obj = { a: '1', b: { c: '2', d: '3' } }
        const other = { e: '4', b: { f: '5', g: '6' }}
        obj = up.util.merge(obj, other)
        expect(obj).toEqual({ a: '1', e: '4', b: { f: '5', g: '6' } })
      })

      it('ignores undefined arguments', function() {
        const obj = { a: 1, b: 2 }

        const result = up.util.merge(obj, undefined)
        expect(result).toEqual({ a: 1, b: 2 })

        const reverseResult = up.util.merge(undefined, obj)
        expect(reverseResult).toEqual({ a: 1, b: 2 })
      })

      it('ignores null arguments', function() {
        const obj = { a: 1, b: 2 }

        const result = up.util.merge(obj, null)
        expect(result).toEqual({ a: 1, b: 2 })

        const reverseResult = up.util.merge(null, obj)
        expect(reverseResult).toEqual({ a: 1, b: 2 })
      })
    })

//      it 'copies inherited values', ->
//        parent = { a: 1 }
//        child = Object.create(parent)
//        child.b = 2
//
//        result = up.util.merge(child, { c: 3 })
//        expect(result).toEqual { a: 1, b: 2, c: 3 }

    describe('up.util.mergeDefined', function() {

      it('merges the given objects', function() {
        let obj = { a: '1', b: '2' }
        const other = { b: '3', c: '4' }
        obj = up.util.mergeDefined(obj, other)
        expect(obj).toEqual({ a: '1', b: '3', c: '4' })
      })

      it('does not override values with an undefined value (unlike up.util.merge)', function() {
        let obj = { a: '1', b: '2' }
        const other = { b: undefined, c: '4' }
        obj = up.util.mergeDefined(obj, other)
        expect(obj).toEqual({ a: '1', b: '2', c: '4' })
      })
    })

//    describe 'up.util.deepMerge', ->
//
//      it 'recursively merges the given objects', ->
//        obj = { a: '1', b: { c: '2', d: '3' } }
//        other = { e: '4', b: { f: '5', g: '6' }}
//        obj = up.util.deepMerge(obj, other)
//        expect(obj).toEqual { a: '1', e: '4', b: { c: '2', d: '3', f: '5', g: '6' } }
//
//      it 'ignores undefined arguments', ->
//        obj = { a: 1, b: 2 }
//
//        result = up.util.deepMerge(obj, undefined)
//        expect(result).toEqual { a: 1, b: 2 }
//
//        reverseResult = up.util.deepMerge(undefined, obj)
//        expect(reverseResult).toEqual { a: 1, b: 2 }
//
//      it 'ignores null arguments', ->
//        obj = { a: 1, b: 2 }
//
//        result = up.util.deepMerge(obj, null)
//        expect(result).toEqual { a: 1, b: 2 }
//
//        reverseResult = up.util.deepMerge(null, obj)
//        expect(reverseResult).toEqual { a: 1, b: 2 }
//
//      it 'overwrites (and does not concatenate) array values', ->
//        obj = { a: ['1', '2'] }
//        other = { a: ['3', '4'] }
//        obj = up.util.deepMerge(obj, other)
//        expect(obj).toEqual { a: ['3', '4'] }

    describe('up.util.memoize', function() {

      it('returns a function that calls the memoized function', function() {
        const fun = (a, b) => a + b
        const memoized = u.memoize(fun)
        expect(memoized(2, 3)).toEqual(5)
      })

      it('returns the cached return value of the first call when called again', function() {
        const spy = jasmine.createSpy().and.returnValue(5)
        const memoized = u.memoize(spy)
        expect(memoized(2, 3)).toEqual(5)
        expect(memoized(2, 3)).toEqual(5)
        expect(spy.calls.count()).toEqual(1)
      })
    })

    if (up.migrate.loaded) {
      describe("up.util.assign", function() {

        it('copies the second object into the first object', function() {
          const target = { a: 1 }
          const source = { b: 2, c: 3 }

          up.util.assign(target, source)

          expect(target).toEqual({ a: 1, b: 2, c: 3 })

          // Source is unchanged
          expect(source).toEqual({ b: 2, c: 3 })
        })

        it('copies null property values', function() {
          const target = { a: 1, b: 2 }
          const source = { b: null }

          up.util.assign(target, source)

          expect(target).toEqual({ a: 1, b: null })
        })

        it('copies undefined property values', function() {
          const target = { a: 1, b: 2 }
          const source = { b: undefined }

          up.util.assign(target, source)

          expect(target).toEqual({ a: 1, b: undefined })
        })

        it('returns the first object', function() {
          const target = { a: 1 }
          const source = { b: 2 }

          const result = up.util.assign(target, source)

          expect(result).toBe(target)
        })

        it('takes multiple sources to copy from', function() {
          const target = { a: 1 }
          const source1 = { b: 2, c: 3 }
          const source2 = { d: 4, e: 5 }

          up.util.assign(target, source1, source2)

          expect(target).toEqual({ a: 1, b: 2, c: 3, d: 4, e: 5 })
        })
      })
    }

    describe('up.util.copy', function() {

      it('returns a shallow copy of the given array', function() {
        const original = ['a', { b: 'c' }, 'd']

        const copy = up.util.copy(original)
        expect(copy).toEqual(original)

        // Test that changes to copy don't change original
        copy.pop()
        expect(copy.length).toBe(2)
        expect(original.length).toBe(3)

        // Test that the copy is shallow
        copy[1].x = 'y'
        expect(original[1].x).toEqual('y')
      })

      it('returns a shallow copy of the given plain object', function() {
        const original = {a: 'b', c: [1, 2], d: 'e'}

        const copy = up.util.copy(original)
        expect(copy).toEqual(original)

        // Test that changes to copy don't change original
        copy.f = 'g'
        expect(original.f).toBeMissing()

        // Test that the copy is shallow
        copy.c.push(3)
        expect(original.c).toEqual([1, 2, 3])
      })

      it('allows custom classes to hook into the copy protocol by implementing a method named `up.util.copy.key`', function() {
        class TestClass {
          [up.util.copy.key]() {
            return "custom copy"
          }
        }

        const instance = new TestClass()
        expect(up.util.copy(instance)).toEqual("custom copy")
      })

      it('copies the given jQuery collection into an array', function() {
        const $one = $fixture('.one')
        const $two = $fixture('.two')
        const $collection = $one.add($two)

        const copy = up.util.copy($collection)

        copy[0] = document.body
        expect($collection[0]).toBe($one[0])
      })

      it('copies the given arguments object into an array', function() {
        let args = undefined;
        (function() { return args = arguments })(1)

        const copy = up.util.copy(args)
        expect(copy).toBeArray()

        copy[0] = 2
        expect(args[0]).toBe(1)
      })

      it('returns the given string (which is immutable)', function() {
        const str = "foo"
        const copy = up.util.copy(str)
        expect(copy).toBe(str)
      })

      it('returns the given number (which is immutable)', function() {
        const number = 123
        const copy = up.util.copy(number)
        expect(copy).toBe(number)
      })

      it('copies the given Date object', function() {
        const date = new Date('1995-12-17T03:24:00')
        expect(date.getFullYear()).toBe(1995)

        const copy = up.util.copy(date)

        expect(copy.getFullYear()).toBe(date.getFullYear())
        expect(copy.getHours()).toBe(date.getHours())
        expect(copy.getMinutes()).toBe(date.getMinutes())

        // Check that it's actually a copied object
        expect(copy).not.toBe(date)
        date.setFullYear(2018)
        expect(copy.getFullYear()).toBe(1995)
      })
    })


//    describe 'up.util.deepCopy', ->
//
//      it 'returns a deep copy of the given array', ->
//        original = ['a', { b: 'c' }, 'd']
//
//        copy = up.util.deepCopy(original)
//        expect(copy).toEqual(original)
//
//        # Test that changes to copy don't change original
//        copy.pop()
//        expect(copy.length).toBe(2)
//        expect(original.length).toBe(3)
//
//        # Test that the copy is deep
//        copy[1].x = 'y'
//        expect(original[1].x).toBeUndefined()
//
//      it 'returns a deep copy of the given object', ->
//        original = {a: 'b', c: [1, 2], d: 'e'}
//
//        copy = up.util.deepCopy(original)
//        expect(copy).toEqual(original)
//
//        # Test that changes to copy don't change original
//        copy.f = 'g'
//        expect(original.f).toBeMissing()
//
//        # Test that the copy is deep
//        copy.c.push(3)
//        expect(original.c).toEqual [1, 2]

    describe('up.util.isList', function() {

      it('returns true for an array', function() {
        const value = [1, 2, 3]
        expect(up.util.isList(value)).toBe(true)
      })

      it('returns true for an HTMLCollection', function() {
        const value = document.getElementsByTagName('div')
        expect(up.util.isList(value)).toBe(true)
      })

      it('returns true for a NodeList', function() {
        const value = document.querySelectorAll('div')
        expect(up.util.isList(value)).toBe(true)
      })

      it('returns true for a jQuery collection', function() {
        const value = jQuery('body')
        expect(up.util.isList(value)).toBe(true)
      })

      it('returns true for an arguments object', function() {
        let value = undefined;
        (function() { return value = arguments })()
        expect(up.util.isList(value)).toBe(true)
      })

      it('returns false for an object', function() {
        const value = { foo: 'bar' }
        expect(up.util.isList(value)).toBe(false)
      })

      it('returns false for a string', function() {
        const value = 'foo'
        expect(up.util.isList(value)).toBe(false)
      })

      it('returns false for a number', function() {
        const value = 123
        expect(up.util.isList(value)).toBe(false)
      })

      it('returns false for undefined', function() {
        const value = undefined
        expect(up.util.isList(value)).toBe(false)
      })

      it('returns false for null', function() {
        const value = null
        expect(up.util.isList(value)).toBe(false)
      })

      it('returns false for NaN', function() {
        const value = NaN
        expect(up.util.isList(value)).toBe(false)
      })
    })

    describe('up.util.isJQuery', function() {

      it('returns true for a jQuery collection', function() {
        const value = $('body')
        expect(up.util.isJQuery(value)).toBe(true)
      })

      it('returns false for a native element', function() {
        const value = document.body
        expect(up.util.isJQuery(value)).toBe(false)
      })

      it('returns false (and does not crash) for undefined', function() {
        const value = undefined
        expect(up.util.isJQuery(value)).toBe(false)
      })

      it('returns false for the window object', function() {
        const value = window
        expect(up.util.isJQuery(value)).toBe(false)
      })

      it('returns false for the window object if window.jquery (lowercase) is defined (bugfix)', function() {
        window.jquery = '3.0.0'
        const value = window
        expect(up.util.isJQuery(value)).toBe(false)
        return delete window.jquery
      })

      it('returns false for the document object', function() {
        const value = document
        expect(up.util.isJQuery(value)).toBe(false)
      })
    })

    describe('up.util.isPromise', function() {

      it('returns true for a Promise', function() {
        const value = new Promise(up.util.noop)
        expect(up.util.isPromise(value)).toBe(true)
      })

      it('returns true for an object with a #then() method', function() {
        const value = { then() {} }
        expect(up.util.isPromise(value)).toBe(true)
      })

      it('returns true for an up.Request', function() {
        const value = new up.Request({url: '/path'})
        expect(up.util.isPromise(value)).toBe(true)
      })

      it('returns false for an object without a #then() method', function() {
        const value = { foo: '1' }
        expect(up.util.isPromise(value)).toBe(false)
      })

      it('returns false for null', function() {
        const value = null
        expect(up.util.isPromise(value)).toBe(false)
      })
    })

    describe('up.util.last', function() {

      it('returns the last element of an array', function() {
        const value = [1, 2, 3]
        expect(up.util.last(value)).toBe(3)
      })

      it('returns the last character of a string', function() {
        const value = 'foobar'
        expect(up.util.last(value)).toBe('r')
      })
    })

    describe('up.util.isRegExp', function() {

      it('returns true for a RegExp', function() {
        const value = /foo/
        expect(up.util.isRegExp(value)).toBe(true)
      })

      it('returns false for a string', function() {
        const value = 'foo'
        expect(up.util.isRegExp(value)).toBe(false)
      })

      it('returns false for a undefined', function() {
        const value = undefined
        expect(up.util.isRegExp(value)).toBe(false)
      })
    })

    describe('up.util.sprintf', function() {

      describe('with string argument', function() {

        it('serializes the string verbatim with %s', function() {
          const formatted = up.util.sprintf('before %s after', 'argument')
          expect(formatted).toEqual('before argument after')
        })

        it('includes quotes with %o', function() {
          const formatted = up.util.sprintf('before %o after', 'argument')
          expect(formatted).toEqual('before "argument" after')
        })
      })

      describe('with undefined argument', function() {

        it('serializes to the word "undefined"', function() {
          const formatted = up.util.sprintf('before %o after', undefined)
          expect(formatted).toEqual('before undefined after')
        })

        it('does not crash with %s', function() {
          const formatted = up.util.sprintf('before %s after', undefined)
          expect(formatted).toEqual('before undefined after')
        })
      })

      describe('with null argument', function() {

        it('serializes to the word "null"', function() {
          const formatted = up.util.sprintf('before %o after', null)
          expect(formatted).toEqual('before null after')
        })

        it('does not crash with %s', function() {
          const formatted = up.util.sprintf('before %s after', null)
          expect(formatted).toEqual('before null after')
        })
      })

      describe('with true argument', function() {

        it('serializes to the word "true"', function() {
          const formatted = up.util.sprintf('before %o after', true)
          expect(formatted).toEqual('before true after')
        })

        it('does not crash with %s', function() {
          const formatted = up.util.sprintf('before %s after', true)
          expect(formatted).toEqual('before true after')
        })
      })

      describe('with false argument', function() {

        it('serializes to the word "false"', function() {
          const formatted = up.util.sprintf('before %o after', false)
          expect(formatted).toEqual('before false after')
        })

        it('does not crash with %s', function() {
          const formatted = up.util.sprintf('before %s after', false)
          expect(formatted).toEqual('before false after')
        })
      })

      describe('with number argument', () => it('serializes the number as string', function() {
        const formatted = up.util.sprintf('before %o after', 5)
        expect(formatted).toEqual('before 5 after')
      }))

      describe('with function argument', () => it('serializes the function code', function() {
        const formatted = up.util.sprintf('before %o after', function foo() {})
        expect(formatted).toEqual('before function foo() { } after')
      }))

      describe('with array argument', () => it('recursively serializes the elements', function() {
        const formatted = up.util.sprintf('before %o after', [1, "foo"])
        expect(formatted).toEqual('before [1, foo] after')
      }))

      describe('with element argument', () => it('serializes the tag name with id, up-iid, name and class attributes, but ignores other attributes', function() {
        const element = e.createFromHTML('<table id="id-value" up-id="up-id-value" name="name-value" class="class-value" title="title-value"></table>')
        const formatted = up.util.sprintf('before %o after', element)
        expect(formatted).toEqual('before <table id="id-value" up-id="up-id-value" name="name-value" class="class-value"> after')
      }))

      describe('with jQuery argument', () => it('serializes the tag name with id, name and class attributes, but ignores other attributes', function() {
        const $element1 = $('<table id="table-id">')
        const $element2 = $('<ul id="ul-id">')
        const formatted = up.util.sprintf('before %o after', $element1.add($element2))
        expect(formatted).toEqual('before $(<table id="table-id">, <ul id="ul-id">) after')
      }))

      describe('with object argument', function() {

        it('serializes to JSON', function() {
          const object = { foo: 'foo-value', bar: 'bar-value' }
          const formatted = up.util.sprintf('before %o after', object)
          expect(formatted).toEqual('before {"foo":"foo-value","bar":"bar-value"} after')
        })

        it('serializes to a fallback string if the given structure has circular references', function() {
          const object = { foo: {} }
          object.foo.bar = object
          const formatted = up.util.sprintf('before %o after', object)
          expect(formatted).toEqual('before (circular structure) after')
        })

        it("skips a key if a getter crashes", function() {
          const object = {}
          Object.defineProperty(object, 'foo', {get() { throw "error" }})
          let formatted = up.util.sprintf('before %o after', object)
          expect(formatted).toEqual('before {} after')

          object.bar = 'bar'
          formatted = up.util.sprintf('before %o after', object)
          expect(formatted).toEqual('before {"bar":"bar"} after')
        })
      })

      describe('with Error argument', () => it("serializes the error's class and message", function() {
        const error = new up.CannotTarget("Error message")
        const formatted = up.util.sprintf('before %o after', error)
        expect(formatted).toBe('before up.CannotTarget: Error message after')
      }))

      describe('with color style (%c)', () => it('discards the style directives', function() {
        const formatted = up.util.sprintf('foo %cbar', 'color: red')
        expect(formatted).toBe('foo bar')
      }))
    })

    describe('up.util.renameKeys', function() {

      it('returns a copy of the given object, but with keys transformed by the given function', function() {
        const source = { foo: 1, bar: 2 }
        const upcase = str => str.toUpperCase()
        const copy = up.util.renameKeys(source, upcase)
        expect(copy).toEqual({ FOO: 1, BAR: 2 })
      })

      it('does not change the given object', function() {
        const source = { foo: 1 }
        const upcase = str => str.toUpperCase()
        up.util.renameKeys(source, upcase)
        expect(source).toEqual({ foo: 1  })
      })
    })

//    describe 'up.util.unprefixCamelCase', ->
//
//      it 'returns the given key without the given prefixed', ->
//        result = up.util.unprefixCamelCase('prefixFoo', 'prefix')
//        expect(result).toEqual('foo')
//
//      it 'returns undefined if the given key is not prefixed with the given prefix', ->
//        result = up.util.unprefixCamelCase('foo', 'prefix')
//        expect(result).toBeUndefined()
//
//      it 'returns undefined if the given prefix is the full given key', ->
//        result = up.util.unprefixCamelCase('prefix', 'prefix')
//        expect(result).toBeUndefined()

    describe('up.util.escapeHTML', function() {

      it('escapes double quotes', function() {
        const result = up.util.escapeHTML('before"after')
        expect(result).toEqual('before&quot;after')
      })

      it('escapes single quotes', function() {
        const result = up.util.escapeHTML("before'after")
        expect(result).toEqual('before&#x27;after')
      })

      it('escapes angle brackets', function() {
        const result = up.util.escapeHTML('before<script>after')
        expect(result).toEqual('before&lt;script&gt;after')
      })
    })

    describe('up.util.memoizeMethod()', function() {

      it("caches a function property's return value", function() {
        const spy = jasmine.createSpy('method').and.returnValue('return value')

        const obj = { foo: spy }
        up.util.memoizeMethod(obj, { foo: true })

        expect(obj.foo()).toBe('return value')
        expect(obj.foo()).toBe('return value')

        expect(spy.calls.count()).toBe(1)
      })

//      it "caches a getter's return value", ->
//        spy = jasmine.createSpy('method').and.returnValue('return value')
//
//        obj = `{ get foo() { return spy() } }`
//        up.util.memoizeMethod(obj, { foo: true })
//
//        expect(obj.foo).toBe('return value')
//        expect(obj.foo).toBe('return value')
//
//        expect(spy.calls.count()).toBe(1)
//
//      it "caches a getter's return value when there is no setter in strict mode", ->
//        'use strict'
//
//        spy = jasmine.createSpy('method').and.returnValue('return value')
//
//        obj = `{ get foo() { return spy() } }`
//        up.util.memoizeMethod(obj, { foo: true })
//
//        expect(obj.foo).toBe('return value')
//        expect(obj.foo).toBe('return value')
//
//        expect(spy.calls.count()).toBe(1)

      it('does not share its cache between multiple instances', function() {
        class Person {
          constructor(firstName, lastName) {
            this.firstName = firstName
            this.lastName = lastName
          }
          getFullName() {
            return this.firstName + ' ' + this.lastName
          }
        }

        up.util.memoizeMethod(Person.prototype, { getFullName: true })

        const alice = new Person('Alice', 'Anderson')
        const bob = new Person('Bob', 'Bertison')

        expect(alice.getFullName()).toBe('Alice Anderson')
        expect(bob.getFullName()).toBe('Bob Bertison')
      })

      it('forwards arguments and this context', function() {
        const spy = jasmine.createSpy('spy')

        const obj = { foo(arg) { spy(this, arg) } }
        up.util.memoizeMethod(obj, { foo: true })

        obj.foo('given arg')

        expect(spy.calls.count()).toBe(1)
        expect(spy.calls.argsFor(0)).toEqual([obj, 'given arg'])
      })

      it("caches a function property's thrown error", function() {
        const spy = jasmine.createSpy('method').and.throwError(new Error('error message'))

        const obj = { foo: spy }
        up.util.memoizeMethod(obj, { foo: true })

        expect(() => obj.foo()).toThrowError(/error message/)
        expect(() => obj.foo()).toThrowError(/error message/)

        expect(spy.calls.count()).toBe(1)
      })

      it('caches separately for separate arguments', function() {
        const spy = jasmine.createSpy('spy')

        const obj = {
          foo(arg) {
            spy(arg)
            return arg * 2
          }
        }

        up.util.memoizeMethod(obj, { foo: true })

        expect(obj.foo(3)).toBe(6)
        expect(obj.foo(3)).toBe(6)
        expect(spy.calls.count()).toBe(1)

        expect(obj.foo(5)).toBe(10)
        expect(spy.calls.count()).toBe(2)
      })

      it('caches multiple method names', function() {
        const fooSpy = jasmine.createSpy('foo method').and.returnValue('foo return value')
        const barSpy = jasmine.createSpy('bar method').and.returnValue('bar return value')

        const obj = {
          foo: fooSpy,
          bar: barSpy
        }
        up.util.memoizeMethod(obj, { foo: true, bar: true })

        expect(obj.foo()).toBe('foo return value')
        expect(obj.foo()).toBe('foo return value')
        expect(fooSpy.calls.count()).toBe(1)

        expect(obj.bar()).toBe('bar return value')
        expect(obj.bar()).toBe('bar return value')
        expect(barSpy.calls.count()).toBe(1)
      })
    })

    fdescribe('up.util.parseTokens()', function() {

      it('parses tokens separated by a space', function() {
        const str = 'foo bar baz'
        const tokens = up.util.parseTokens(str)
        expect(tokens).toEqual(['foo', 'bar', 'baz'])
      })

      it('parses tokens separated by " or "', function() {
        const str = "foo or bar or baz"
        const tokens = up.util.parseTokens(str)
        expect(tokens).toEqual(['foo', 'bar', 'baz'])
      })

      it('trims whitespace', function() {
        const str = " foo \t  bar   or   baz   \n"
        const tokens = up.util.parseTokens(str)
        expect(tokens).toEqual(['foo', 'bar', 'baz'])
      })

      it('does not parse a JSON array', function() {
        const str = '["foo", "bar"]'
        const tokens = up.util.parseTokens(str)
        expect(tokens).toEqual(['["foo",', '"bar"]'])
      })

      it('returns an array unchanged', function() {
        const array = ['foo', 'bar']
        const tokens = up.util.parseTokens(array)
        expect(tokens).toEqual(['foo', 'bar'])
      })

      it('returns an empty array for undefined', function() {
        const tokens = up.util.parseTokens(undefined)
        expect(tokens).toEqual([])
      })

      it('returns an empty array for null', function() {
        const tokens = up.util.parseTokens(null)
        expect(tokens).toEqual([])
      })

      describe('with { json: true }', function() {

        it('parses the string as JSON if it is enclosed in square brackets', function() {
          const str = '["foo", "bar"]'
          const tokens = up.util.parseTokens(str, {json: true})
          expect(tokens).toEqual(['foo', 'bar'])
        })

        it('parses the string as JSON if it is enclosed in square brackets after whitespace', function() {
          const str = '  \n["foo", "bar"] \t\n '
          const tokens = up.util.parseTokens(str, {json: true})
          expect(tokens).toEqual(['foo', 'bar'])
        })

        it("parses the string as space-separated tokens if it isn't enclosed in square brackets", function() {
          const str = '[foo bar baz'
          const tokens = up.util.parseTokens(str, {json: true})
          expect(tokens).toEqual(['[foo', 'bar', 'baz'])
        })
      })

      describe('with { separator: "or" }', function() {

        it('parses tokens separated by " or "', function() {
          const str = 'foo or bar or baz'
          const tokens = up.util.parseTokens(str)
          expect(tokens).toEqual(['foo', 'bar', 'baz'])
        })

        it('trims whitespace', function() {
          const str = '\n foo   or \t bar  or \n baz  '
          const tokens = up.util.parseTokens(str)
          expect(tokens).toEqual(['foo', 'bar', 'baz'])
        })

        it('does not consider plain whitespace to be a separator', function() {
          const str = 'foo bar baz'
          const tokens = up.util.parseTokens(str, {separator: 'or'})
          expect(tokens).toEqual(['foo bar baz'])
        })
      })

      describe('with { separator: "comma" }', function() {

        it('parses tokens separated by a comma', function() {
          const str = 'foo, bar, baz'
          const tokens = up.util.parseTokens(str, {separator: 'comma'})
          expect(tokens).toEqual(['foo', 'bar', 'baz'])
        })

        it('trims whitespace', function() {
          const str = '\n foo   , \t bar  , \n baz  '
          const tokens = up.util.parseTokens(str, {separator: 'comma'})
          expect(tokens).toEqual(['foo', 'bar', 'baz'])
        })

        it('does not parse tokens separated by " or "', function() {
          const str = 'foo or bar or baz'
          const tokens = up.util.parseTokens(str, {separator: 'comma'})
          expect(tokens).toEqual(['foo or bar or baz'])
        })
      })
    })

    fdescribe('up.util.getSimpleTokens()', function() {

      describe('tokens separated by whitespace', function() {

        it('parses tokens separated by a space', function() {
          const str = 'foo bar baz'
          const tokens = up.util.getSimpleTokens(str)
          expect(tokens).toEqual(['foo', 'bar', 'baz'])
        })

        it('trims whitespace', function() {
          const str = " foo \t  bar \r  baz   \n"
          const tokens = up.util.getSimpleTokens(str)
          expect(tokens).toEqual(['foo', 'bar', 'baz'])
        })

        it('does not parse a JSON array', function() {
          const str = '["foo", "bar"]'
          const tokens = up.util.getSimpleTokens(str)
          expect(tokens).toEqual(['["foo"', '"bar"]'])
        })

        it('returns an array unchanged', function() {
          const array = ['foo', 'bar']
          const tokens = up.util.getSimpleTokens(array)
          expect(tokens).toEqual(['foo', 'bar'])
        })

        it('returns an empty array for undefined', function() {
          const tokens = up.util.getSimpleTokens(undefined)
          expect(tokens).toEqual([])
        })

        it('returns an empty array for null', function() {
          const tokens = up.util.getSimpleTokens(null)
          expect(tokens).toEqual([])
        })

        it('returns an empty array for an empty string', function() {
          const tokens = up.util.getSimpleTokens('')
          expect(tokens).toEqual([])
        })

      })

      describe('tokens separated by a comma', function() {

        it('parses tokens separated by a comma', function() {
          const str = 'foo, bar, baz'
          const tokens = up.util.getSimpleTokens(str)
          expect(tokens).toEqual(['foo', 'bar', 'baz'])
        })

        it('trims whitespace', function() {
          const str = '\n foo   , \t bar  , \n baz  '
          const tokens = up.util.getSimpleTokens(str)
          expect(tokens).toEqual(['foo', 'bar', 'baz'])
        })

      })

      describe('with { json: true }', function() {

        it('parses the string as JSON if it is enclosed in square brackets', function() {
          const str = '["foo", "bar"]'
          const tokens = up.util.getSimpleTokens(str, { json: true })
          expect(tokens).toEqual(['foo', 'bar'])
        })

        it("parses the string as space-separated tokens if it isn't enclosed in square brackets on both sides", function() {
          const str = '[foo bar baz'
          const tokens = up.util.getSimpleTokens(str, { json: true })
          expect(tokens).toEqual(['[foo', 'bar', 'baz'])
        })
      })

      if (up.migrate.loaded) {
        describe('tokens separated by ` or `', function() {

          it('parses tokens separated by " or "', function() {
            const str = 'foo or bar or baz'
            const tokens = up.util.getSimpleTokens(str)
            expect(tokens).toEqual(['foo', 'bar', 'baz'])
          })

          it('trims whitespace', function() {
            const str = '\n foo   or \t bar  or \n baz  '
            const tokens = up.util.getSimpleTokens(str)
            expect(tokens).toEqual(['foo', 'bar', 'baz'])
          })

          it('does not consider plain whitespace to be a separator if `or` is used anywhere', function() {
            const str = 'foo bar or baz bam'
            const tokens = up.util.getSimpleTokens(str)
            expect(tokens).toEqual(['foo bar', 'baz bam'])
          })

          describe('deprecation warning', function() {

            it('prints a deprecation warning', function() {
              const warnSpy = up.migrate.warn.mock()
              const str = 'foo or bar or baz'
              const tokens = up.util.getSimpleTokens(str)
              expect(tokens).toEqual(['foo', 'bar', 'baz'])
              expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('Separating tokens by `or` has been deprecated'))
            })

            it('does not print a deprecation warning if the string did not contain an ` or `', function() {
              const warnSpy = up.migrate.warn.mock()
              const str = 'foo bar baz'
              const tokens = up.util.getSimpleTokens(str)
              expect(tokens).toEqual(['foo', 'bar', 'baz'])
              expect(warnSpy).not.toHaveBeenCalled()
            })

          })

        })
      } else {

        it('does not parse tokens separated by " or "', function() {
          const str = 'foo or bar or baz'
          const tokens = up.util.getSimpleTokens(str)
          expect(tokens).toEqual(['foo', 'or', 'bar', 'or', 'baz'])
        })

      }

    })

    fdescribe('up.util.getComplexTokens()', function() {

      describe('tokens separated by whitespace', function() {

        it('does not separate tokens at whitespace', function() {
          const str = 'foo bar baz'
          const tokens = up.util.getComplexTokens(str)
          expect(tokens).toEqual(['foo bar baz'])
        })

      })

      describe('tokens separated by a comma', function() {

        it('parses tokens separated by a comma', function() {
          const str = 'foo, bar, baz'
          const tokens = up.util.getComplexTokens(str)
          expect(tokens).toEqual(['foo', 'bar', 'baz'])
        })

        it('trims whitespace', function() {
          const str = '\n foo   , \t bar  , \n baz  '
          const tokens = up.util.getComplexTokens(str)
          expect(tokens).toEqual(['foo', 'bar', 'baz'])
        })

        it('ignores commas in single-quoted strings', function() {
          const str = `.foo, .bar[attr='baz, bam'], .qux`
          const tokens = up.util.getComplexTokens(str)
          expect(tokens).toEqual([`.foo`, `.bar[attr='baz, bam']`, `.qux`])
        })

        it('ignores commas in double-quoted strings', function() {
          const str = `.foo, .bar[attr="baz, bam"], .qux`
          const tokens = up.util.getComplexTokens(str)
          expect(tokens).toEqual([`.foo`, `.bar[attr="baz, bam"]`, `.qux`])
        })

        it('ignores commas in square brackets', function() {
          const str = `foo, [bar, baz], bam`
          const tokens = up.util.getComplexTokens(str)
          expect(tokens).toEqual([`foo`, `[bar, baz]`, `bam`])
        })

        it('ignores commas in round parentheses', function() {
          const str = `.foo, .bar:is(input, select), .qux`
          const tokens = up.util.getComplexTokens(str)
          expect(tokens).toEqual(['.foo', '.bar:is(input, select)', '.qux'])
        })

        it('ignores commas in curly braces', function() {
          const str = `foo, { bar: 'baz', bam: 'qux' }, fred`
          const tokens = up.util.getComplexTokens(str)
          expect(tokens).toEqual([`foo`, `{ bar: 'baz', bam: 'qux' }`, `fred`])
        })

      })

      if (up.migrate.loaded) {
        describe('tokens separated by ` or `', function() {

          it('parses tokens separated by " or "', function() {
            const str = 'foo or bar or baz'
            const tokens = up.util.getComplexTokens(str)
            expect(tokens).toEqual(['foo', 'bar', 'baz'])
          })

          it('trims whitespace', function() {
            const str = '\n foo   or \t bar  or \n baz  '
            const tokens = up.util.getComplexTokens(str)
            expect(tokens).toEqual(['foo', 'bar', 'baz'])
          })

          it('does not consider commas to be a separator if `or` is used anywhere', function() {
            const str = 'foo bar or baz, bam'
            const tokens = up.util.getComplexTokens(str)
            expect(tokens).toEqual(['foo bar', 'baz, bam'])
          })

          describe('deprecation warning', function() {

            it('prints a deprecation warning', function() {
              const warnSpy = up.migrate.warn.mock()
              const str = 'foo or bar or baz'
              const tokens = up.util.getComplexTokens(str)
              expect(tokens).toEqual(['foo', 'bar', 'baz'])
              expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('Separating tokens by `or` has been deprecated'))
            })

            it('does not print a deprecation warning if the string did not contain an ` or `', function() {
              const warnSpy = up.migrate.warn.mock()
              const str = 'foo, bar, baz'
              const tokens = up.util.getComplexTokens(str)
              expect(tokens).toEqual(['foo', 'bar', 'baz'])
              expect(warnSpy).not.toHaveBeenCalled()
            })

          })

        })
      } else {

        it('does not parse tokens separated by " or "', function() {
          const str = 'foo bar or baz, bam'
          const tokens = up.util.getComplexTokens(str)
          expect(tokens).toEqual(['foo bar or baz', 'bam'])
        })

      }

    })

    describe('up.util.objectContains()', function() {

      it('returns true if the first object has all properties of the second object, and then some more', () => {
        expect(up.util.objectContains({ a: 1, b: 2 }, { a: 1 })).toBe(true)
      })

      it('returns true if both objects have the same properties', () => {
        expect(up.util.objectContains({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
      })

      it('returns false if a property value differs', () => {
        expect(up.util.objectContains({ a: 1, b: 2 }, { a: 3 })).toBe(false)
      })

      it('returns false if the second object has additional keys', () => {
        expect(up.util.objectContains({ a: 1, b: 2 }, { a: 1, d: 3 })).toBe(false)
      })
    })

    describe('up.util.containsAll()', function() {

      it('returns true if the first array has all elements of the second array, and then some more', () => {
        expect(up.util.containsAll(['a', 'b'], ['b'])).toBe(true)
      })

      it('returns true if the second array is empty', () => {
        expect(up.util.containsAll(['a', 'b'], [])).toBe(true)
      })

      it('returns true if both arrays have the same elements', () => {
        expect(up.util.containsAll(['a', 'b'], ['a', 'b'])).toBe(true)
      })

      it('ignores element order', () => {
        expect(up.util.containsAll(['a', 'b'], ['b', 'a'])).toBe(true)
      })

      it('returns false if the second array has additional elements', () => {
        expect(up.util.containsAll(['a', 'b'], ['a', 'b', 'c'])).toBe(false)
      })
    })

    // describe('up.util.assignTemp()', function() {
    //
    //   it('assigns the given properties to the given object', function() {
    //     let obj = { a: 1, b: 2, c: 3, d: 4 }
    //     up.util.assignTemp(obj, { b: 20, c: 30 })
    //     expect(obj).toEqual({ a: 1, b: 20, c: 30, d: 4 })
    //   })
    //
    //   describe('returned undo function', function() {
    //     it("restores the object's original properties", function() {
    //       let obj = { a: 1, b: 2, c: 3, d: 4 }
    //       let undo = up.util.assignTemp(obj, { b: 20, c: 30 })
    //       expect(obj).toEqual({ a: 1, b: 20, c: 30, d: 4 })
    //
    //       undo()
    //
    //       expect(obj).toEqual({ a: 1, b: 2, c: 3, d: 4 })
    //     })
    //
    //     it("only restores properties that were re-assigned", function() {
    //       let obj = { a: 1, b: 2, c: 3 }
    //       let undo = up.util.assignTemp(obj, { b: 20 })
    //       expect(obj).toEqual({ a: 1, b: 20, c: 3 })
    //
    //       obj.c = 30
    //
    //       undo()
    //
    //       expect(obj).toEqual({ a: 1, b: 2, c: 30 })
    //     })
    //
    //     it('deletes properties that were not set before', function() {
    //       let obj = {}
    //       let undo = up.util.assignTemp(obj, { a: 1 })
    //       expect(obj).toHaveKey('a')
    //
    //       undo()
    //       expect(obj).not.toHaveKey('a')
    //     })
    //   })
    //
    // })

    describe('up.util.evalOption()', function() {

      it('returns the given primitive value', () => expect(up.util.evalOption('foo')).toBe('foo'))

      it('calls the given function and returns its return value', function() {
        const fn = () => 'foo'
        expect(up.util.evalOption(fn)).toBe('foo')
      })

      it('calls the given function with additional args', function() {
        const sum = (a, b) => a + b
        expect(up.util.evalOption(sum, 3, 2)).toBe(5)
      })
    })

    describe('up.util.evalAutoOption()', function() {

      describe('if the first argument is a primitive value', () => it('returns the first argument', function() {
        const autoDefault = 'auto default'
        expect(up.util.evalAutoOption('foo', autoDefault)).toBe('foo')
      }))

      describe('if the first agument is "auto"', function() {

        it('returns the second argument if it is a primitive value', function() {
          const autoDefault = 'auto default'
          expect(up.util.evalAutoOption('auto', autoDefault)).toBe('auto default')
        })

        it('calls the second argument if it is a function, passing the 3rd...nth argument as function arguments', function() {
          const sum = (a, b) => a + b
          expect(up.util.evalAutoOption('auto', sum, 2, 5)).toBe(7)
        })
      })

      describe('if the first argument is a function', function() {

        it('calls the first argument', function() {
          const sum = (a, b) => a + b
          const autoDefault = 'auto default'
          expect(up.util.evalAutoOption(sum, autoDefault, 3, 5)).toBe(8)
        })

        it('still applies the auto default if the function returns "auto"', function() {
          const fn = () => 'auto'
          const autoSum = (a, b) => a + b
          expect(up.util.evalAutoOption(fn, autoSum, 3, 5)).toBe(8)
        })
      })
    })

    fdescribe('up.util.maskPattern()', function() {

      it('replaces the given RegExp with a placeholder, then restores it with { restore } fn', function() {
        let { masked, restore } = up.util.maskPattern('foo <bar> baz <bam> qux', [/<[^>]+>/g])
        expect(masked).toBe('foo §0 baz §1 qux')

        let restored = restore(masked)
        expect(restored).toBe('foo <bar> baz <bam> qux')
      })

      it('allows to restore placeholders within a partial or transformed string', function() {
        let { masked, restore } = up.util.maskPattern('foo <bar> baz <bam> qux', [/<[^>]+>/g])

        let restored = restore('one §1 two')
        expect(restored).toBe('one <bam> two')
      })

      it('correctly processes a placeholder control character within a masked string', function() {
        let { masked, restore } = up.util.maskPattern('foo <bar§0baz> qux', [/<[^>]+>/g])
        expect(masked).toBe('foo §1 qux')

        let restored = restore(masked)
        expect(restored).toBe('foo <bar§0baz> qux')
      })

      it('replaces multiple patterns')

      describe('with { keepDelimiters: true }', function() {

        it('does not mask the outer delimiters')

      })

    })

    fdescribe('up.util.expressionOutline()', function() {

      it('simplifies a complex CSS selector', function() {
        let input = `input[foo="bar, ]baz"]:is(.control[qux]:not(.active)), .other:not(.mine)`
        let { masked, restore } = up.util.expressionOutline(input)
        expect(masked).toBe(`input[§1]:is(§2), .other:not(§3)`)

        let restored = restore(masked)
        expect(restored).toBe(input)
      })

      it('simplifies a string containing complex JavaScript object literals', function() {
        let input = `foo { key: [1, 'two', { three: 4 }] }, bar { "a}b": 5 }`
        let { masked, restore } = up.util.expressionOutline(input)
        expect(masked).toBe(`foo {§2}, bar {§3}`)

        let restored = restore(masked)
        expect(restored).toBe(input)
      })

      describe('masking of strings', function() {

        it('masks and restores content in quoted strings', function() {
          let input = `foo "bar" baz 'qux' fred`
          let { masked, restore } = up.util.expressionOutline(input)
          expect(masked).toBe(`foo "§0" baz '§1' fred`)

          let restored = restore(masked)
          expect(restored).toBe(input)
        })

        it('honors an escaped quote', function() {
          let input = `foo "bar\\"baz" qux`
          let { masked, restore } = up.util.expressionOutline(input)
          expect(masked).toBe(`foo "§0" qux`)

          let restored = restore(masked)
          expect(restored).toBe(input)
        })

        it('ignores a single quote within a double-quoted strings')

      })

      describe('masking of round parentheses', function() {

        it('masks and restores content in parentheses', function() {
          let input = `foo (bar) baz (qux) fred`
          let { masked, restore } = up.util.expressionOutline(input)
          expect(masked).toBe('foo (§0) baz (§1) fred')

          let restored = restore(masked)
          expect(restored).toBe(input)
        })

        it('masks and restores nested parentheses', function() {
          let input = `foo (bar (baz) (qux)) fred`
          let { masked, restore } = up.util.expressionOutline(input)
          expect(masked).toBe('foo (§0) fred')

          let restored = restore(masked)
          expect(restored).toBe(input)
        })

        it('ignores a closing parentheses in a string', function() {
          let input = `foo (bar "baz)qux") fred`
          let { masked, restore } = up.util.expressionOutline(input)
          expect(masked).toBe('foo (§1) fred')

          let restored = restore(masked)
          expect(restored).toBe(input)
        })

      })

      describe('masking of square brackets', function() {

        it('masks and restores content in brackets', function() {
          let input = `foo [bar] baz [qux] fred`
          let { masked, restore } = up.util.expressionOutline(input)
          expect(masked).toBe('foo [§0] baz [§1] fred')

          let restored = restore(masked)
          expect(restored).toBe(input)
        })

        it('masks and restores nested brackets', function() {
          let input = `foo [bar [baz] [qux]] fred`
          let { masked, restore } = up.util.expressionOutline(input)
          expect(masked).toBe('foo [§0] fred')

          let restored = restore(masked)
          expect(restored).toBe(input)
        })

        it('ignores a closing bracket in a string', function() {
          let input = `foo [bar "baz]qux"] fred`
          let { masked, restore } = up.util.expressionOutline(input)
          expect(masked).toBe('foo [§1] fred')

          let restored = restore(masked)
          expect(restored).toBe(input)
        })

      })

      describe('masking of curly braces', function() {

        it('masks and restores content in braces', function() {
          let input = `foo {bar} baz {qux} fred`
          let { masked, restore } = up.util.expressionOutline(input)
          expect(masked).toBe('foo {§0} baz {§1} fred')

          let restored = restore(masked)
          expect(restored).toBe(input)
        })

        it('masks and restores nested braces', function() {
          let input = `foo {bar {baz} {qux}} fred`
          let { masked, restore } = up.util.expressionOutline(input)
          expect(masked).toBe('foo {§0} fred')

          let restored = restore(masked)
          expect(restored).toBe(input)
        })

        it('ignores a closing brace in a string', function() {
          let input = `foo {bar "baz}qux"} fred`
          let { masked, restore } = up.util.expressionOutline(input)
          expect(masked).toBe('foo {§1} fred')

          let restored = restore(masked)
          expect(restored).toBe(input)
        })

      })

    })

    describe('up.util.parseString()', function() {

      it('parses a double-quoted string', function() {
        expect(up.util.parseString(`"foo"`)).toBe(`foo`)
      })

      it('parses a double-quoted string with escape sequences', function() {
        expect(up.util.parseString(`"foo\\\\bar\\"baz"`)).toBe(`foo\\bar"baz`)
      })

      it('parses a single-quoted string', function() {
        expect(up.util.parseString(`'foo'`)).toBe(`foo`)
      })

      it('parses a single-quoted string with escape sequences', function() {
        expect(up.util.parseString(`'foo\\\\bar\\'baz'`)).toBe(`foo\\bar'baz`)
      })

    })

    describe('up.util.parseRelaxedJSON()', function() {

      describe('standard JSON notation', function() {

        it('parses an integer', function() {
          let input = 5
          expect(up.util.parseRelaxedJSON(JSON.stringify(input))).toEqual(input)
        })

        it('parses a float', function() {
          let input = 1.23
          expect(up.util.parseRelaxedJSON(JSON.stringify(input))).toEqual(input)
        })

        it('parses true', function() {
          let input = true
          expect(up.util.parseRelaxedJSON(JSON.stringify(input))).toEqual(input)
        })

        it('parses false', function() {
          let input = false
          expect(up.util.parseRelaxedJSON(JSON.stringify(input))).toEqual(input)
        })

        it('parses null', function() {
          let input = null
          expect(up.util.parseRelaxedJSON(JSON.stringify(input))).toEqual(input)
        })

        it('parses a string', function() {
          let input = "foo"
          expect(up.util.parseRelaxedJSON(JSON.stringify(input))).toEqual(input)
        })

        it('parses an array', function() {
          let input = [1, "foo", 3, "baz"]
          expect(up.util.parseRelaxedJSON(JSON.stringify(input))).toEqual(input)
        })

        it('parses an object', function() {
          let input = { foo: 1, bar: "two" }
          expect(up.util.parseRelaxedJSON(JSON.stringify(input))).toEqual(input)
        })

        it('parses a nested object', function() {
          let input = { foo: [1, true, { three: "three" }, null], bar: ['bar'] }
          expect(up.util.parseRelaxedJSON(JSON.stringify(input))).toEqual(input)
        })

      })

      describe('relaxed JSON notation', function() {

        it('parses a string with single quotes', function() {
          expect(up.util.parseRelaxedJSON("'foo'")).toEqual("foo")
        })

        it('parses a string with single quotes that contains a double quote', function() {
          expect(up.util.parseRelaxedJSON(`'foo"bar'`)).toEqual(`foo"bar`)
        })

        it('parses a property value with single quotes', function() {
          expect(up.util.parseRelaxedJSON("{ 'foo': 1, 'bar': 2 }")).toEqual({ foo: 1, bar: 2})
        })

        it('does not change single quotes inside a double-quoted string', function() {
          expect(up.util.parseRelaxedJSON(`"foo'bar'baz"`)).toEqual(`foo'bar'baz`)
        })

        it('respects escaped single quotes', function() {
          expect(up.util.parseRelaxedJSON("'foo\\'bar'")).toEqual("foo'bar")
        })

        it('allows unquoted property names', function() {
          expect(up.util.parseRelaxedJSON("{ foo: 1, bar: 2 }")).toEqual({ foo: 1, bar: 2})
        })

        it('allows unquoted property names starting with "true" or "null"', function() {
          expect(up.util.parseRelaxedJSON("{ trueFoo: 1, nullBar: 2 }")).toEqual({ trueFoo: 1, nullBar: 2})
        })

        it('does not change unquoted property names inside a string', function() {
          expect(up.util.parseRelaxedJSON(`"{ foo: 1, bar: 2 }"`)).toEqual('{ foo: 1, bar: 2 }')
        })

      })

    })

    fdescribe('up.util.parseScalarJSONPairs()', function() {

      describe('if the string ends in a JSON object', function() {

        it('returns a tuple of the initial string and the parsed JSON object', function() {
          let str = 'foo bar { "baz": 3 }'
          let result = up.util.parseScalarJSONPairs(str)
          expect(result).toEqual([['foo bar', { baz: 3 }]])
        })

        it('accepts unquoted property names and single quote strings', function() {
          let str = 'foo bar { baz: 3 }'
          let result = up.util.parseScalarJSONPairs(str)
          expect(result).toEqual([['foo bar', { baz: 3 }]])
        })

        it('ignores braces in strings', function() {
          let str = `foo "{ bar }" baz { "key": 'foo { bar } baz' }`
          let result = up.util.parseScalarJSONPairs(str)
          expect(result).toEqual([[`foo "{ bar }" baz`, { key: 'foo { bar } baz' }]])
        })

        it('parses nested objects', function() {
          let str = 'foo bar { baz: { qux: 3 } }'
          let result = up.util.parseScalarJSONPairs(str)
          expect(result).toEqual([['foo bar', { baz: {qux: 3 } }]])
        })

        it('parses multiple pairs separated by comma', function() {
          let str = 'foo { bar: 1 }, baz { qux: 2 }'
          let result = up.util.parseScalarJSONPairs(str)
          expect(result).toEqual([
            ['foo', { bar: 1 }],
            ['baz', { qux: 2 }]
          ])
        })

        it('does not consider a comma within an object to be a pair separator', function() {
          let str = 'foo { bar: 1, baz: 2 }, qux { fred: 3 }'
          let result = up.util.parseScalarJSONPairs(str)
          expect(result).toEqual([
            ['foo', { bar: 1, baz: 2 }],
            ['qux', { fred: 3 }]
          ])
        })

      })

      describe('if the string does not end in a JSON object', function() {

        it('returns an array of the given string and undefined', function() {
          let str = 'foo bar baz'
          let result = up.util.parseScalarJSONPairs(str)
          expect(result).toEqual([['foo bar baz', undefined]])
        })

        it('returns an array of multiple comma-separated tokens', function() {
          let str = 'foo bar, baz qux'
          let result = up.util.parseScalarJSONPairs(str)
          expect(result).toEqual([['foo bar', undefined], ['baz qux', undefined]])
        })

      })

    })

  })
})
