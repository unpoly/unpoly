u = up.util
$ = jQuery

describe 'up.log', ->

  describe 'JavaScript functions', ->

    describe 'up.log.puts', ->

      it 'sends a log message to the developer console iff the log is enabled', ->
        spyOn(console, 'log')

        up.log.disable()
        up.log.puts('message')
        expect(console.log).not.toHaveBeenCalled()

        up.log.enable()
        up.log.puts('message')
        expect(console.log).toHaveBeenCalledWith('[UP] message')

    describe 'up.log.debug', ->

      it 'sends a debug message to the developer console iff the log is enabled', ->
        spyOn(console, 'debug')

        up.log.disable()
        up.log.debug('message')
        expect(console.debug).not.toHaveBeenCalled()

        up.log.enable()
        up.log.debug('message')
        expect(console.debug).toHaveBeenCalledWith('[UP] message')

    describe 'up.log.error', ->

      it 'sends an error message to the developer console regardless whether the log is enabled or not', ->
        spyOn(console, 'error')

        up.log.disable()
        up.log.error('message1')
        expect(console.error).toHaveBeenCalledWith('[UP] message1')

        up.log.enable()
        up.log.error('message2')
        expect(console.error.calls.allArgs()).toEqual [
          ['[UP] message1'],
          ['[UP] message2']
        ]

    describe 'up.log.sprintf', ->

      describe 'with string argument', ->

        it 'serializes with surrounding quotes', ->
          formatted = up.log.sprintf('before %o after', 'argument')
          expect(formatted).toEqual('before "argument" after')

      describe 'with undefined argument', ->

        it 'serializes to the word "undefined"', ->
          formatted = up.log.sprintf('before %o after', undefined)
          expect(formatted).toEqual('before undefined after')

      describe 'with null argument', ->

        it 'serializes to the word "null"', ->
          formatted = up.log.sprintf('before %o after', null)
          expect(formatted).toEqual('before null after')

      describe 'with number argument', ->

        it 'serializes the number as string', ->
          formatted = up.log.sprintf('before %o after', 5)
          expect(formatted).toEqual('before 5 after')

      describe 'with function argument', ->

        it 'serializes the function code', ->
          formatted = up.log.sprintf('before %o after', `function foo() {}`)
          expect(formatted).toEqual('before function foo() {} after')

      describe 'with array argument', ->

        it 'recursively serializes the elements', ->
          formatted = up.log.sprintf('before %o after', [1, "foo"])
          expect(formatted).toEqual('before [1, "foo"] after')

      describe 'with element argument', ->

        it 'serializes the tag name with id, name and class attributes, but ignores other attributes', ->
          $element = $('<table id="id-value" name="name-value" class="class-value" title="title-value">')
          element = $element.get(0)
          formatted = up.log.sprintf('before %o after', element)
          expect(formatted).toEqual('before <table id="id-value" name="name-value" class="class-value"> after')

      describe 'with jQuery argument', ->

        it 'serializes the tag name with id, name and class attributes, but ignores other attributes', ->
          $element1 = $('<table id="table-id">')
          $element2 = $('<ul id="ul-id">')
          formatted = up.log.sprintf('before %o after', $element1.add($element2))
          expect(formatted).toEqual('before $(<table id="table-id">, <ul id="ul-id">) after')

      describe 'with object argument', ->

        it 'serializes to JSON', ->
          object = { foo: 'foo-value', bar: 'bar-value' }
          formatted = up.log.sprintf('before %o after', object)
          expect(formatted).toEqual('before {"foo":"foo-value","bar":"bar-value"} after')

        it "skips a key if a getter crashes", ->
          object = {}
          Object.defineProperty(object, 'foo', get: (-> throw "error"))
          formatted = up.log.sprintf('before %o after', object)
          expect(formatted).toEqual('before {} after')

          object.bar = 'bar'
          formatted = up.log.sprintf('before %o after', object)
          expect(formatted).toEqual('before {"bar":"bar"} after')
