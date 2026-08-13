const u = up.util
const e = up.element
const $ = jQuery

describe('up.util', () => {

  describe('JavaScript functions', function() {

    describe('up.util.task()', function() {

      it('schedules the given function to be executed in the next macrotask', async function() {
        let callback = jasmine.createSpy('callback')
        up.util.task(callback)

        // Not yet called in this microtask
        expect(callback).not.toHaveBeenCalled()

        // Not yet called in the next microtask
        await Promise.resolve()
        expect(callback).not.toHaveBeenCalled()

        await jasmine.waitTime(0)

        expect(callback).toHaveBeenCalled()
      })

    })

    require('./util_lists_spec')

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
          let args = [0, 1, { foo: 'bar' } ]
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

      describe('with "fifo" order', function() {

        it("runs clean-up actions in the same order that they've been scheduled in", function() {
          let actions = []
          let cleaner = up.util.cleaner('fifo')
          cleaner(() => actions.push('one'))
          cleaner(() => actions.push('two'))

          cleaner.clean()

          expect(actions).toEqual(['one', 'two'])
        })

        it('does not let clean-up actions schedule more clean-up actions', function() {
          let cleaner = up.util.cleaner('fifo')

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
          const parent = fixture('.parent')
          const child1 = e.affix(parent, '.child.one')
          const child2 = e.affix(parent, '.child.two')

          const array = [child1, child2]
          const nodeList = parent.querySelectorAll('.child')

          expect(up.util.isEqual(array, nodeList)).toBe(true)
        })

        it('returns true for a HTMLCollection with the same elements', function() {
          const parent = fixture('.parent')
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

    require('./util_objects_spec')

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

    describe('up.util.sequence', function() {

      it('combines an array of function into a single function', function() {
        const values = []
        const one = () => values.push('one')
        const two = () => values.push('two')
        const three = () => values.push('three')
        const sequence = up.util.sequence([one, two, three])
        expect(values).toEqual([])
        sequence()
        expect(values).toEqual(['one', 'two', 'three'])
      })

      it('combines multiple function varargs into a single function', function() {
        const values = []
        const one = () => values.push('one')
        const two = () => values.push('two')
        const three = () => values.push('three')
        const sequence = up.util.sequence(one, two, three)
        expect(values).toEqual([])
        sequence()
        expect(values).toEqual(['one', 'two', 'three'])
      })

      it('ignores non-function values', function() {
        const values = []
        const one = () => values.push('one')
        const two = () => values.push('two')
        const three = () => values.push('three')
        const sequence = up.util.sequence(one, false, two, undefined, three)
        expect(values).toEqual([])
        sequence()
        expect(values).toEqual(['one', 'two', 'three'])
      })

      it('returns an array of all return values', function() {
        const one = () => 1
        const two = () => 2
        const sequence = up.util.sequence(one, two)
        expect(sequence()).toEqual([1, 2])
      })

    })

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

      describe('if the delay is zero', function() {
        it('calls the given function in the next execution frame', function() {
          const callback = jasmine.createSpy()
          up.util.timer(0, callback)
          expect(callback).not.toHaveBeenCalled()

          return setTimeout((() => expect(callback).toHaveBeenCalled()), 0)
        })
      })
    })

//    describe 'up.util.argNames', ->
//
//      it 'returns an array of argument names for the given function', ->
//        fun = ($data) ->
//        expect(up.util.argNames(fun)).toEqual(['$element', 'data'])

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
        expect(up.util.isBlank({ key: 'value' })).toBe(false)
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

      it('removes protocol, hostname and port for a URL from this host', () => {
        expect(up.util.normalizeURL(`http://${location.host}/foo/bar`)).toBe('/foo/bar')
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
        expect(up.util.normalizeURL('/foo/bar?key=value', { search: false })).toBe('/foo/bar')
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
          expect(up.util.normalizeURL('/foo/', { trailingSlash: false })).toEqual("/foo")
        })

        it('does not strip a trailing slash when passed the "/" URL', () => {
          expect(up.util.normalizeURL('/', { trailingSlash: false })).toEqual("/")
        })
      })

      it('normalizes redundant segments', () => {
        expect(up.util.normalizeURL('/foo/../foo')).toBe("/foo")
      })

      describe('hash fragments', function() {

        it('strips a #hash with { hash: false }', () => {
          expect(up.util.normalizeURL('/foo/bar#fragment', { hash: false })).toBe('/foo/bar')
        })

        it('preserves a #hash by default', () => {
          expect(up.util.normalizeURL('/foo/bar#fragment')).toBe('/foo/bar#fragment')
        })

        it('puts a #hash behind the query string', () => {
          expect(up.util.normalizeURL('/foo/bar?key=value#fragment')).toBe('/foo/bar?key=value#fragment')
        })
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

//      it 'copies inherited values', ->
//        parent = { a: 1 }
//        child = Object.create(parent)
//        child.b = 2
//
//        result = up.util.merge(child, { c: 3 })
//        expect(result).toEqual { a: 1, b: 2, c: 3 }

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

    describe('up.util.memoize()', function() {

      it('returns a function that calls the memoized function', function() {
        const fun = () => 'foo'
        const memoized = u.memoize(fun)
        expect(memoized()).toEqual('foo')
      })

      it('returns the cached return value of the first call when called again', function() {
        const spy = jasmine.createSpy().and.returnValue(5)
        const memoized = u.memoize(spy)
        expect(memoized(2, 3)).toEqual(5)
        expect(memoized(2, 3)).toEqual(5)
        expect(spy.calls.count()).toEqual(1)
      })

      it('caches undefined', function() {
        const spy = jasmine.createSpy().and.returnValue(undefined)
        const memoized = u.memoize(spy)
        expect(memoized()).toBeUndefined()
        expect(memoized()).toBeUndefined()
        expect(spy.calls.count()).toEqual(1)
      })

      it('caches false', function() {
        const spy = jasmine.createSpy().and.returnValue(false)
        const memoized = u.memoize(spy)
        expect(memoized()).toBe(false)
        expect(memoized()).toBe(false)
        expect(spy.calls.count()).toEqual(1)
      })

      it('throws a cached error from the first caller', function() {
        let error = new Error('foo')
        const spy = jasmine.createSpy().and.throwError(error)
        const memoized = u.memoize(spy)
        expect(memoized).toThrow(error)
        expect(memoized).toThrow(error)
        expect(spy.calls.count()).toEqual(1)
      })

      it('allows callers to control `this`', function() {
        const thisSpy = jasmine.createSpy('this spy')
        const fun = function() { thisSpy(this) }
        const memoized = u.memoize(fun)
        const givenThis = {}

        memoized.apply(givenThis)
        memoized.apply(givenThis)

        expect(thisSpy).toHaveBeenCalledWith(givenThis)
        expect(thisSpy.calls.count()).toBe(1)
      })

      it('allows callers to control arguments', function() {
        const fun = (a, b) => a + b
        const memoized = u.memoize(fun)
        expect(memoized(2, 3)).toEqual(5)
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
        const value = new up.Request({ url: '/path' })
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

    require('./util_strings_spec')

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

      // it('caches separately for separate arguments', function() {
      //   const spy = jasmine.createSpy('spy')
      //
      //   const obj = {
      //     foo(arg) {
      //       spy(arg)
      //       return arg * 2
      //     }
      //   }
      //
      //   up.util.memoizeMethod(obj, { foo: true })
      //
      //   expect(obj.foo(3)).toBe(6)
      //   expect(obj.foo(3)).toBe(6)
      //   expect(spy.calls.count()).toBe(1)
      //
      //   expect(obj.foo(5)).toBe(10)
      //   expect(spy.calls.count()).toBe(2)
      // })

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

      describe('if the first argument is a primitive value', function() {
        it('returns the first argument', function() {
          const autoDefault = 'auto default'
          expect(up.util.evalAutoOption('foo', autoDefault)).toBe('foo')
        })
      })

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

  })
})
