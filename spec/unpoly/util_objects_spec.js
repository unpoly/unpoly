const u = up.util
const $ = jQuery

extendDescribe('up.util', function() {

  extendDescribe('JavaScript functions', function() {

    describe('up.util.mapObject()', function() {

      it('creates an object from the given array and pairer', function() {
        const array = ['foo', 'bar', 'baz']
        const object = up.util.mapObject(array, (str) => [`${str}Key`, `${str}Value`])
        expect(object).toEqual({
          fooKey: 'fooValue',
          barKey: 'barValue',
          bazKey: 'bazValue'
        })
      })

      it('returns an empty object if the given array is empty', function() {
        const object = up.util.mapObject([], (str) => [`${str}Key`, `${str}Value`])
        expect(object).toEqual({})
      })

    })

    describe('up.util.spanObject()', function() {

      it('creates an object with the given property names, assigning all properties the given value', function() {
        const array = ['foo', 'bar', 'baz']
        const object = up.util.spanObject(array, 123)
        expect(object).toEqual({
          foo: 123,
          bar: 123,
          baz: 123,
        })
      })

      it('sets all properties to undefined if no value is given', function() {
        const array = ['foo', 'bar', 'baz']
        const object = up.util.spanObject(array)
        expect(object).toEqual({
          foo: undefined,
          bar: undefined,
          baz: undefined,
        })
      })

    })

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
          { foo: 'foo-value' }
        const whitelisted = up.util.pick(original, ['foo', 'bar'])
        expect(whitelisted).toHaveOwnProperty('foo')
        expect(whitelisted).not.toHaveOwnProperty('bar')
      })

      it('copies properties that are computed by a getter', function() {
        const original = {
          foo: 'foo-value',
          bar: 'bar-value'
        }
        Object.defineProperty(original, 'baz', { get() { return 'baz-value' } })
        const whitelisted = up.util.pick(original, ['foo', 'baz'])
        expect(whitelisted).toEqual({
          foo: 'foo-value',
          baz: 'baz-value'
        })
      })

      it('copies inherited properties', function() {
        const parent =
          { foo: 'foo-value' }
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

    describe('up.util.renameKey', function() {

      it('renames a key in the given property', function() {
        const object = { a: 'a value', b: 'b value' }
        u.renameKey(object, 'a', 'c')
        expect(object.b).toBe('b value')
        expect(object.c).toBe('a value')
      })

      it('deletes a renamed key from the object', function() {
        const object = { a: 'a value' }
        u.renameKey(object, 'a', 'c')
        expect(object.c).toBe('a value')
        expect(object).not.toHaveKey('a')
      })

      it('does not create undefined keys when the original key was never on the object', function() {
        const object = {}
        u.renameKey(object, 'a', 'b')
        expect(object).not.toHaveKey('a')
        expect(object).not.toHaveKey('b')
      })

    })

    describe('up.util.isOptions()', function() {

      it('returns true for an Object instance', () => {
        expect(up.util.isOptions(new Object())).toBe(true)
      })

      it('returns true for an object literal', () => {
        expect(up.util.isOptions({ foo: 'bar' })).toBe(true)
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
        expect(up.util.isObject({ foo: 'bar' })).toBe(true)
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

    describe('up.util.merge()', function() {

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
        const other = { e: '4', b: { f: '5', g: '6' } }
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

    describe('up.util.pluckKey()', function() {
      it('deletes the property with the given key from the given object and returns its value', function() {
        let input = { a: 1, b: 2, c: 3 }
        let output = up.util.pluckKey(input, 'b')
        expect(input).toEqual({ a: 1, c: 3 })
        expect(output).toEqual(2)
      })

      it('returns undefined if the given key does not exist on the object', function() {
        let input = { a: 1, b: 2 }
        let output = up.util.pluckKey(input, 'c')
        expect(input).toEqual({ a: 1, b: 2 })
        expect(output).toBeUndefined()
      })
    })

    describe('up.util.copy()', function() {

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
        const original = { a: 'b', c: [1, 2], d: 'e' }

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

    describe('up.util.withRenamedKeys', function() {

      it('returns a copy of the given object, but with keys transformed by the given function', function() {
        const source = { foo: 1, bar: 2 }
        const upcase = (str) => str.toUpperCase()
        const copy = up.util.withRenamedKeys(source, upcase)
        expect(copy).toEqual({ FOO: 1, BAR: 2 })
      })

      it('does not change the given object', function() {
        const source = { foo: 1 }
        const upcase = (str) => str.toUpperCase()
        up.util.withRenamedKeys(source, upcase)
        expect(source).toEqual({ foo: 1  })
      })

      it('omits keys for which the function returns undefined', function() {
        const source = { foo: 1, bar: 2 }
        const transformKey = (str) => {
          if (str === 'bar') return str.toUpperCase()
        }
        expect(transformKey('foo')).toBe(undefined)
        expect(transformKey('bar')).toBe('BAR')

        const copy = up.util.withRenamedKeys(source, transformKey)

        expect(copy).toEqual({ BAR: 2 })
        expect(copy).not.toHaveKey('foo')
        expect(copy).not.toHaveKey('undefined')
      })

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

  })

})
