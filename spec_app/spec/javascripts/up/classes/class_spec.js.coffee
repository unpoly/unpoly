describe 'up.Class', ->

  describe '.getter()', ->

    it 'defines a getter on this class', ->
      class Klass extends up.Class
        @getter 'foo', ->
          @bar

      instance = new Klass()
      instance.bar = 'bar value'
      expect(instance.foo).toEqual('bar value')

  describe '.delegate()', ->

    it 'defines one or more getters that are forwarded to a target property', ->
      class Klass extends up.Class
        @delegate ['foo', 'bar'], 'target'

      instance = new Klass()
      instance.target = {
        foo: 'foo value',
        bar: 'bar value'
      }

      expect(instance.foo).toEqual('foo value')
      expect(instance.bar).toEqual('bar value')

    it 'allows to forward a method call to a target property, preserving the target as `this`', ->
      class Target extends up.Class
        foo: ->
          @bar()

        bar: ->
          'bar value'

      class Klass extends up.Class
        @delegate 'foo', 'target'

      instance = new Klass()
      target = new Target()
      instance.target = target
      expect(target.foo()).toEqual('bar value')
      expect(instance.foo()).toEqual('bar value')

