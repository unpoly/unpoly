const u = up.util

extendDescribe('up.util', function() {

  extendDescribe('JavaScript functions', function() {

    describe('up.util.compact()', function() {

      it('returns a copy of the given list with null elements removed', function() {
        let input = [1, null, 2]
        let output = up.util.compact(input)
        expect(output).toEqual([1, 2])
        expect(output).not.toBe(input)
      })

      it('returns a copy of the given list with undefined elements removed', function() {
        let input = [1, undefined, 2]
        let output = up.util.compact(input)
        expect(output).toEqual([1, 2])
        expect(output).not.toBe(input)
      })

    })

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

    describe('up.util.flatMap()', function() {

      it('collects the Array results of the given map function, then concatenates the result arrays into one flat array', function() {
        const fun = (x) => [x, x]
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
        const fun = (selector) => document.querySelectorAll(selector)

        const foo1 = fixture('.foo-element')
        const foo2 = fixture('.foo-element')
        const bar = fixture('.bar-element')

        const result = up.util.flatMap(['.foo-element', '.bar-element'], fun)

        expect(result).toEqual([foo1, foo2, bar])
      })
    })

    describe('up.util.uniq()', function() {

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

    describe('up.util.uniqBy', function() {

      it('returns the given array with duplicate elements removed, calling the given function to determine value for uniqueness', function() {
        let input = ["foo", "bar", "apple", 'orange', 'banana']
        let result = up.util.uniqBy(input, (element) => element.length)
        expect(result).toEqual(['foo', 'apple', 'orange'])
      })

      it('accepts a property name instead of a function, which collects that property from each item to compute uniqueness', function() {
        let input = ["foo", "bar", "apple", 'orange', 'banana']
        let result = up.util.uniqBy(input, 'length')
        expect(result).toEqual(['foo', 'apple', 'orange'])
      })
    })

    describe('up.util.map()', function() {

      it('creates a new array of values by calling the given function on each item of the given array', function() {
        const array = ["apple", "orange", "cucumber"]
        const mapped = up.util.map(array, (element) => element.length)
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

        const result = up.util.map(collection, (elem) => elem.dataset.value)
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
        const results = up.util.map(set, (item) => item.length)
        expect(results).toEqual([3, 6, 8])
      })

      it('maps over an iterator', function() {
        const set = new Set(["foo", "orange", "cucumber"])
        const iterator = set.values()
        const results = up.util.map(iterator, (item) => item.length)
        expect(results).toEqual([3, 6, 8])
      })
    })

    describe('up.util.each()', function() {

      it('calls the given function once for each item of the given array', function() {
        const args = []
        const array = ["apple", "orange", "cucumber"]
        up.util.each(array, (item) => args.push(item))
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

    describe('up.util.filter()', function() {

      it('returns an array of those elements in the given array for which the given function returns true', function() {
        const array = ["foo", "orange", "cucumber"]
        const results = up.util.filter(array, (item) => item.length > 3)
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
        const results = up.util.filter(set, (item) => item.length > 3)
        expect(results).toEqual(['orange', 'cucumber'])
      })

      it('iterates over an iterator', function() {
        const set = new Set(["foo", "orange", "cucumber"])
        const iterator = set.values()
        const results = up.util.filter(iterator, (item) => item.length > 3)
        expect(results).toEqual(['orange', 'cucumber'])
      })
    })

    describe('up.util.reject()', function() {

      it('returns an array of those elements in the given array for which the given function returns false', function() {
        const array = ["foo", "orange", "cucumber"]
        const results = up.util.reject(array, (item) => item.length < 4)
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

    describe('up.util.every()', function() {

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

    describe('up.util.some()', function() {

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

    describe('up.util.findResult()', function() {

      it('consecutively applies the function to each array element and returns the first truthy return value', function() {
        const map = {
          a: '',
          b: null,
          c: undefined,
          d: 'DEH',
          e: 'EH'
        }
        const fn = (el) => map[el]

        const result = up.util.findResult(['a', 'b', 'c', 'd', 'e'], fn)
        expect(result).toEqual('DEH')
      })

      it('returns undefined if the function does not return a truthy value for any element in the array', function() {
        const map = {}
        const fn = (el) => map[el]

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

    describe('up.util.find()', function() {

      it('finds the first element in the given array that matches the given tester', function() {
        const array = ['foo', 'bar', 'baz']
        const tester = (element) => element[0] === 'b'
        expect(up.util.find(array, tester)).toEqual('bar')
      })

      it("returns undefined if the given array doesn't contain a matching element", function() {
        const array = ['foo', 'bar', 'baz']
        const tester = (element) => element[0] === 'z'
        expect(up.util.find(array, tester)).toBeUndefined()
      })
    })

    describe('up.util.remove()', function() {

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

        it('returns true if the given string contains the given substring', () => {
          expect(up.util.contains('foobar', 'oba')).toBe(true)
        })

        it('returns false if the given string does not contain the given substring', () => {
          expect(up.util.contains('foobar', 'baz')).toBe(false)
        })
      })

      describe('for an array', function() {

        it('returns true if the given array contains the given element', () => {
          expect(up.util.contains(['foo', 'bar', 'baz'], 'bar')).toBe(true)
        })

        it('returns false if the given array does not contain the given element', () => {
          expect(up.util.contains(['foo', 'bar', 'baz'], 'qux')).toBe(false)
        })
      })

      describe('for a NodeList', function() {

        it('returns true if the given NodeList contains the given element', () => {
          expect(up.util.contains(document.querySelectorAll('body'), document.body)).toBe(true)
        })

        it('returns false if the given NodeList does not contain the given element', () => {
          expect(up.util.contains(document.querySelectorAll('div'), document.body)).toBe(false)
        })
      })
    })

    describe('up.util.flatten()', function() {

      it('flattens the given array', function() {
        const array = [1, [2, 3], 4]
        expect(u.flatten(array)).toEqual([1, 2, 3, 4])
      })

      it('only flattens one level deep for performance reasons', function() {
        const array = [1, [2, [3,4]], 5]
        expect(u.flatten(array)).toEqual([1, 2, [3, 4], 5])
      })
    })

    describe('up.util.isArray()', function() {

      it('returns true for an Array', function() {
        expect(up.util.isArray([1, 2, 3])).toBe(true)
      })

      it('returns false for a string', function() {
        expect(up.util.isArray('foo')).toBe(false)
      })

      it('returns false for a null', function() {
        expect(up.util.isArray(null)).toBe(false)
      })

      it('returns false for a NodeList', function() {
        let nodeList = document.querySelectorAll('div')
        expect(up.util.isArray(nodeList)).toBe(false)
      })

    })

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

  })

})
