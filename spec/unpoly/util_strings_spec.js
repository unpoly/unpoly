const e = up.element
const $ = jQuery

extendDescribe('up.util', function() {

  extendDescribe('JavaScript functions', function() {

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

      describe('with number argument', function() {
        it('serializes the number as string', function() {
          const formatted = up.util.sprintf('before %o after', 5)
          expect(formatted).toEqual('before 5 after')
        })
      })

      describe('with function argument', function() {
        it('serializes the function code', function() {
          const formatted = up.util.sprintf('before %o after', function foo() {})
          expect(formatted).toEqual('before function foo() { } after')
        })
      })

      describe('with array argument', function() {
        it('recursively serializes the elements', function() {
          const formatted = up.util.sprintf('before %o after', [1, "foo"])
          expect(formatted).toEqual('before [1, foo] after')
        })
      })

      describe('with element argument', function() {
        it('serializes the tag name with id, up-iid, name and class attributes, but ignores other attributes', function() {
          const openTag = '<table id="id-value" up-id="up-id-value" name="name-value" class="class-value" title="title-value">'
          const content = '<tr><td>cell</td></tr>'
          const closeTag = '</table>'
          const element = e.createFromHTML(openTag + content + closeTag)
          const formatted = up.util.sprintf('before %o after', element)
          expect(formatted).toEqual('before ' + openTag + ' after')
        })
      })

      describe('with jQuery argument', function() {
        it('serializes the tag name with id, name and class attributes, but ignores other attributes', function() {
          const $element1 = $('<table id="table-id">')
          const $element2 = $('<ul id="ul-id">')
          const formatted = up.util.sprintf('before %o after', $element1.add($element2))
          expect(formatted).toEqual('before $(<table id="table-id">, <ul id="ul-id">) after')
        })
      })

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
          Object.defineProperty(object, 'foo', { get() { throw "error" } })
          let formatted = up.util.sprintf('before %o after', object)
          expect(formatted).toEqual('before {} after')

          object.bar = 'bar'
          formatted = up.util.sprintf('before %o after', object)
          expect(formatted).toEqual('before {"bar":"bar"} after')
        })
      })

      describe('with Error argument', function() {
        it("serializes the error's class and message", function() {
          const error = new up.CannotTarget("Error message")
          const formatted = up.util.sprintf('before %o after', error)
          expect(formatted).toBe('before up.CannotTarget: Error message after')
        })
      })

      describe('with color style (%c)', function() {
        it('discards the style directives', function() {
          const formatted = up.util.sprintf('foo %cbar', 'color: red')
          expect(formatted).toBe('foo bar')
        })
      })
    })

    describe('up.util.camelToKebabCase()', function() {

      it('converts camelCase to kebab-case', function() {
        expect(up.util.camelToKebabCase('fooBar')).toEqual('foo-bar')
      })

      it("doesn't change a string that is already in kebab-case", function() {
        expect(up.util.camelToKebabCase('foo-bar')).toEqual('foo-bar')
      })

      it("doesn't change CSS custom property name", function() {
        expect(up.util.camelToKebabCase('--foo-bar')).toEqual('--foo-bar')
      })

    })

    describe('up.util.kebabToCamelCase()', function() {

      it('converts camelCase to kebab-case', function() {
        expect(up.util.kebabToCamelCase('foo-bar')).toEqual('fooBar')
      })

      it("doesn't change a string that is already in camel-case", function() {
        expect(up.util.kebabToCamelCase('fooBar')).toEqual('fooBar')
      })

    })

    describe('up.util.escapeHTML()', function() {

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

      it('escapes ampersands', function() {
        const result = up.util.escapeHTML('before&after')
        expect(result).toEqual('before&amp;after')
      })

      it('escapes HTML entities', function() {
        const result = up.util.escapeHTML('before&quote;after')
        expect(result).toEqual('before&amp;quote;after')
      })

    })

    describe('up.util.getSimpleTokens()', function() {

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

    describe('up.util.getComplexTokens()', function() {

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
          // throw new Error("xxx")
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

    describe('up.util.maskPattern()', function() {

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

      it('replaces multiple patterns', function() {
        let { masked, restore } = up.util.maskPattern('foo <bar> baz [bam] qux', [/<[^>]+>/g, /\[[^]+]/g])
        expect(masked).toBe('foo §0 baz §1 qux')

        let restored = restore(masked)
        expect(restored).toBe('foo <bar> baz [bam] qux')
      })

      describe('with { keepDelimiters: true }', function() {

        it('does not mask the outer delimiters', function() {
          let { masked, restore } = up.util.maskPattern('foo <bar> baz <bam> qux', [/<[^>]+>/g], { keepDelimiters: true })
          expect(masked).toBe('foo <§0> baz <§1> qux')

          let restored = restore(masked)
          expect(restored).toBe('foo <bar> baz <bam> qux')
        })

      })

    })

    describe('up.util.expressionOutline()', function() {

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

        it('parses a string containing §0 (bugfix)', function() {
          let input = 'foo §0 bar'
          expect(up.util.parseRelaxedJSON(JSON.stringify(input))).toEqual(input)
        })

        it('parses a string containing §9 (bugfix)', function() {
          let input = 'foo §9 bar'
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
          expect(up.util.parseRelaxedJSON("{ 'foo': 1, 'bar': 2 }")).toEqual({ foo: 1, bar: 2 })
        })

        it('does not change single quotes inside a double-quoted string', function() {
          expect(up.util.parseRelaxedJSON(`"foo'bar'baz"`)).toEqual(`foo'bar'baz`)
        })

        it('respects escaped single quotes', function() {
          expect(up.util.parseRelaxedJSON("'foo\\'bar'")).toEqual("foo'bar")
        })

        it('allows unquoted property names', function() {
          expect(up.util.parseRelaxedJSON("{ foo: 1, bar: 2 }")).toEqual({ foo: 1, bar: 2 })
        })

        it('allows unquoted property names starting with "true" or "null"', function() {
          expect(up.util.parseRelaxedJSON("{ trueFoo: 1, nullBar: 2 }")).toEqual({ trueFoo: 1, nullBar: 2 })
        })

        it('does not change unquoted property names inside a string', function() {
          expect(up.util.parseRelaxedJSON(`"{ foo: 1, bar: 2 }"`)).toEqual('{ foo: 1, bar: 2 }')
        })

        it('allows trailing commas in object literals', function() {
          expect(up.util.parseRelaxedJSON("{ foo: 1, bar: 2, }")).toEqual({ foo: 1, bar: 2 })
        })

        it('allows trailing commas in array literals', function() {
          expect(up.util.parseRelaxedJSON("[1, 2, ]")).toEqual([1, 2])
        })

      })

    })

    describe('up.util.parseScalarJSONPairs()', function() {

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
          expect(result).toEqual([['foo bar', { baz: { qux: 3 } }]])
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

    describe('parseNumber()', function() {

      it("parses the given string as an integer", function() {
        expect(up.util.parseNumber('123')).toBe(123)
      })

      it("parses the given string as a float", function() {
        expect(up.util.parseNumber('123.45')).toBe(123.45)
      })

      it("parses the given string as a float with omitted integer part", function() {
        expect(up.util.parseNumber('.45')).toBe(0.45)
      })

      it("ignores underscores for digit groups", function() {
        expect(up.util.parseNumber('123_000')).toBe(123000)
      })

      it("parses a negative number", function() {
        expect(up.util.parseNumber('-123')).toBe(-123)
      })

      it("parses negative zero (-0)", function() {
        let parsed = up.util.parseNumber('-0')
        expect(Object.is(parsed, -0)).toBe(true)
      })

      it("returns undefined for a string cannot be parsed as a number", function() {
        expect(up.util.parseNumber('bar')).toBeUndefined()
      })

      it("returns undefined for undefined", function() {
        expect(up.util.parseNumber(undefined)).toBeUndefined()
      })

      it("returns undefined for null", function() {
        expect(up.util.parseNumber(undefined)).toBeUndefined()
      })

      it("returns undefined for a single underscore", function() {
        expect(up.util.parseNumber("_")).toBeUndefined()
      })

      it("returns undefined for a single dot", function() {
        expect(up.util.parseNumber(".")).toBeUndefined()
      })

      it("returns undefined for a single dash", function() {
        expect(up.util.parseNumber("-")).toBeUndefined()
      })

      it('returns a number value without parsing', function() {
        expect(up.util.parseNumber(123)).toBe(123)
      })

    })

  })

})
