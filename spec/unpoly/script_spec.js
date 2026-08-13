const u = up.util
const e = up.element
const $ = jQuery

describe('up.script', function() {

  describe('JavaScript functions', function() {

    require('./script_compiler_spec')

    if (up.migrate.loaded) {
      describe('up.$compiler()', function() {
        it('registers a compiler that receives the element as a jQuery collection', function() {
          const observeElement = jasmine.createSpy()
          up.$compiler('.element', ($element) => observeElement($element))

          const $element = $fixture('.element')
          up.hello($element)

          expect(observeElement).toHaveBeenCalled()
          const arg = observeElement.calls.argsFor(0)[0]
          expect(arg).toBeJQuery()
          expect(arg).toEqual($element)
        })
      })
    }

    describe('up.macro()', function() {

      it('registers compilers that are run before other compilers', function() {
        const traces = []
        up.compiler('.element', { priority: 10 }, () => traces.push('foo'))
        up.compiler('.element', { priority: -1000 }, () => traces.push('bar'))
        up.macro('.element', () => traces.push('baz'))
        helloFixture('.element')
        expect(traces).toEqual(['baz', 'foo' , 'bar'])
      })

      it('allows to macros to have priorities of their own (higher priority is run first)', function() {
        const traces = []
        up.macro('.element', { priority: 1 }, () => traces.push('foo'))
        up.macro('.element', { priority: 2 }, () => traces.push('bar'))
        up.macro('.element', { priority: 0 }, () => traces.push('baz'))
        up.macro('.element', { priority: 3 }, () => traces.push('bam'))
        up.macro('.element', { priority: -1 }, () => traces.push('qux'))
        up.compiler('.element', { priority: 999 }, () => traces.push('ccc'))
        helloFixture('.element')
        expect(traces).toEqual(['bam', 'bar', 'foo', 'baz', 'qux', 'ccc'])
      })

      it('runs two macros with the same priority in the order in which they were registered', function() {
        const traces = []
        up.macro('.element', { priority: 1 }, () => traces.push('foo'))
        up.macro('.element', { priority: 1 }, () => traces.push('bar'))
        helloFixture('.element')
        expect(traces).toEqual(['foo', 'bar'])
      })

      it('allows users to use the built-in [up-expand] from their own macros', function() {
        up.macro('.element', (element) => element.setAttribute('up-expand', ''))
        const $element = $fixture('.element a[href="/foo"][up-target=".target"]')
        up.hello($element)
        expect($element.attr('up-target')).toEqual('.target')
        expect($element.attr('up-href')).toEqual('/foo')
      })

      if (up.migrate.loaded) {
        it('allows users to use the built-in [up-dash] from their own macros', function() {
          up.macro('.element', (element) => element.setAttribute('up-dash', '.target'))
          const $element = $fixture('a.element[href="/foo"]')
          up.hello($element)
          expect($element.attr('up-target')).toEqual('.target')
          expect($element.attr('up-preload')).toEqual('')
          expect($element.attr('up-instant')).toEqual('')
        })
      }
    })

    if (up.migrate.loaded) {
      describe('up.$macro()', function() {
        it('registers a macro that receives the element as a jQuery collection', function() {
          const observeElement = jasmine.createSpy()
          up.$macro('.element', ($element) => observeElement('macro', $element))
          up.$compiler('.element', ($element) => observeElement('compiler', $element))

          const $element = $fixture('.element')
          up.hello($element)

          expect(observeElement).toHaveBeenCalled()
          const args = observeElement.calls.argsFor(0)
          expect(args[0]).toEqual('macro')
          expect(args[1]).toBeJQuery()
          expect(args[1]).toEqual($element)
        })
      })
    }

    describe('up.destructor()', function() {

      it('registers a function that runs when the element is cleaned', function() {
        let destructorSpy = jasmine.createSpy('destructor function')
        let element = fixture('.element')

        up.destructor(element, destructorSpy)

        expect(destructorSpy).not.toHaveBeenCalled()

        up.script.clean(element)

        expect(destructorSpy).toHaveBeenCalled()
      })

      it('appends to an existing list of destructor functions', function() {
        let destructorSpy1 = jasmine.createSpy('destructor 1')
        let destructorSpy2 = jasmine.createSpy('destructor 2')
        let element = fixture('.element')

        up.destructor(element, destructorSpy1)
        up.destructor(element, destructorSpy2)

        expect(destructorSpy1).not.toHaveBeenCalled()
        expect(destructorSpy2).not.toHaveBeenCalled()

        up.script.clean(element)

        expect(destructorSpy1).toHaveBeenCalled()
        expect(destructorSpy2).toHaveBeenCalled()
      })

      it('registers an array of destructor functions at functions', function() {
        let destructorSpy1 = jasmine.createSpy('destructor 1')
        let destructorSpy2 = jasmine.createSpy('destructor 2')
        let element = fixture('.element')

        up.destructor(element, [destructorSpy1, destructorSpy2])

        expect(destructorSpy1).not.toHaveBeenCalled()
        expect(destructorSpy2).not.toHaveBeenCalled()

        up.script.clean(element)

        expect(destructorSpy1).toHaveBeenCalled()
        expect(destructorSpy2).toHaveBeenCalled()
      })

      it('does not set an .up-can-clean class when no functions are passed', function() {
        let element = fixture('.element')

        // This may happen if a compiler returns no value.
        up.destructor(element, undefined)

        expect(element.className).toBe('element')
      })

      it('immediately calls a destructor function if an element has already been detached', async function() {
        let destructorSpy = jasmine.createSpy('destructor function')
        let element = fixture('.element')

        up.destroy(element)
        await wait()

        up.destructor(element, destructorSpy)
        expect(destructorSpy).toHaveBeenCalled()
      })

      it('calls a destructor that is registered while the element is playing its destroy animation', async function() {
        let destructorSpy = jasmine.createSpy('destructor function')
        let element = fixture('.element')

        up.destroy(element, { animation: 'fade-out', duration: 500 })
        await wait(250)

        expect(element).toBeAttached()

        up.destructor(element, destructorSpy)
        await wait(500)

        expect(element).toBeDetached()
        expect(destructorSpy).toHaveBeenCalled()
      })

      it('calls a destructor that is registered while the element is playing its swap transition', async function() {
        let destructorSpy = jasmine.createSpy('destructor function')
        let html = '<div class="element"></div>'
        let element = htmlFixture(html)

        up.render({ fragment: html, transition: 'cross-fade', duration: 500 })
        await wait(250)

        expect(element).toBeAttached()

        up.destructor(element, destructorSpy)
        await wait(500)

        expect(element).toBeDetached()
        expect(destructorSpy).toHaveBeenCalled()
      })

    })

    describe('up.data()', function() {

      describe('when the element has an [up-data] attribute', function() {

        it('parses an object value serialized as JSON', function() {
          const element = fixture('.element', { 'up-data': '{ "foo": 1, "bar": 2 }' })
          const data = up.data(element)

          expect(data).toEqual(jasmine.any(Object))
          expect(Object.keys(data)).toEqual(jasmine.arrayWithExactContents(['foo', 'bar']))
          expect(data.foo).toBe(1)
          expect(data.bar).toBe(2)
        })

        it('allows unquoted property names', function() {
          const element = fixture('.element', { 'up-data': '{ foo: 1, bar: 2 }' })
          const data = up.data(element)

          expect(data).toEqual(jasmine.any(Object))
          expect(Object.keys(data)).toEqual(jasmine.arrayWithExactContents(['foo', 'bar']))
          expect(data.foo).toBe(1)
          expect(data.bar).toBe(2)
        })

        it('parses an array value serialized as JSON', function() {
          const element = fixture('.element', { 'up-data': '["foo", "bar"]' })
          const data = up.data(element)

          expect(data).toEqual(['foo', 'bar'])
        })

        it('parses a string value serialized as JSON', function() {
          const element = fixture('.element', { 'up-data': '"foo"' })
          const data = up.data(element)

          expect(data).toBe('foo')
        })
      })

      describe('when the element has no [up-data] attribute', function() {

        it('returns a blank object', function() {
          const element = fixture('.element')
          const data = up.data(element)

          expect(typeof data).toBe('object')
          expect(Object.keys(data)).toBeBlank()
        })

        it("returns access to the element's vanilla [data-] attributes", function() {
          const element = fixture('.element', { 'data-foo': 'foo value', 'data-bar': 'bar value' })
          const data = up.data(element)

          expect(data.foo).toBe('foo value')
          expect(data.bar).toBe('bar value')
        })

        it('allows to access [data-] attribute with camelCase keys', function() {
          const element = fixture('.element', { 'data-foo-bar': 'value' })
          const data = up.data(element)

          expect(data.fooBar).toBe('value')
        })
      })

      describe('when the element has both an [up-data] and vanilla [data-] attributes', function() {

        it('returns an object with properties from both', function() {
          const element = fixture('.element', { 'data-foo': 'foo value', 'up-data': JSON.stringify({ bar: 'bar value' }) })
          const data = up.data(element)

          expect(data.foo).toBe('foo value')
          expect(data.bar).toBe('bar value')
        })

        it('allows to access [data-] attribute with camelCase keys', function() {
          const element = fixture('.element', { 'data-foo-bar': 'value1', 'up-data': JSON.stringify({ baz: 'value2' }) })
          const data = up.data(element)

          expect(data.fooBar).toBe('value1')
        })

        it('supports the `in` operator', function() {
          const element = fixture('.element', { 'data-foo': 'foo value', 'up-data': JSON.stringify({ bar: 'bar value' }) })
          const data = up.data(element)

          expect('foo' in data).toBe(true)
          expect('bar' in data).toBe(true)
          expect('baz' in data).toBe(false)
        })

        it('supports Object.keys()', function() {
          const element = fixture('.element', { 'data-foo': 'foo value', 'up-data': JSON.stringify({ bar: 'bar value' }) })
          const data = up.data(element)

          expect(Object.keys(data)).toEqual(jasmine.arrayWithExactContents(['foo', 'bar']))
        })

        it('prefers properties from [up-data]', function() {
          const element = fixture('.element', { 'data-foo': 'a', 'up-data': JSON.stringify({ foo: 'b' }) })
          const data = up.data(element)

          expect(data.foo).toBe('b')
        })

        it('allows to override a property from a [data-] attribute', function() {
          const element = fixture('.element', { 'data-foo': 'a', 'up-data': JSON.stringify({ foo: 'b' }) })
          const data = up.data(element)

          data.foo = 'new a'

          expect(data.foo).toBe('new a')
        })

        it('allows to override a property from [up-data]', function() {
          const element = fixture('.element', { 'data-foo': 'a', 'up-data': JSON.stringify({ foo: 'b' }) })
          const data = up.data(element)

          data.foo = 'overridden'

          expect(data.foo).toBe('overridden')
        })

        it('allows to delete a property from a [data-] attribute', function() {
          const element = fixture('.element', { 'data-foo': 'a', 'up-data': JSON.stringify({ bar: 'b' }) })
          const data = up.data(element)

          data.foo = 'overridden'

          expect(data.foo).toBe('overridden')
        })

        it('allows to delete a property from [up-data]', function() {
          const element = fixture('.element', { 'data-foo': 'a', 'up-data': JSON.stringify({ foo: 'b' }) })
          const data = up.data(element)

          delete data.foo

          expect(data.foo).toBeUndefined()
          expect('foo' in data).toBe(false)
        })

        it('allows to delete a property from a [data-] attribute', function() {
          const element = fixture('.element', { 'data-foo': 'a', 'up-data': JSON.stringify({ bar: 'b' }) })
          const data = up.data(element)

          delete data.foo

          expect(data.foo).toBeUndefined()
          expect('foo' in data).toBe(false)
        })
      })

      describe('when the element was compiled with a { data } option', function() {

        it('overrides properties from a [data-] attribute', function() {
          const element = fixture('.element', { 'data-foo': 'a', 'data-bar': 'b' })
          up.hello(element, { data: { bar: 'c' } })

          const data = up.data(element)

          expect(data).toEqual({ foo: 'a', bar: 'c' })
        })

        it('overrides properties from an [up-data] attribute', function() {
          const element = fixture('.element', { 'up-data': JSON.stringify({ foo: 'a', bar: 'b' }) })
          up.hello(element, { data: { bar: 'c' } })

          const data = up.data(element)

          expect(data).toEqual({ foo: 'a', bar: 'c' })
        })
      })

      it('returns an empty object when called with window', function() {
        expect(up.data(window)).toEqual({})
      })

      it('returns an empty object when called with document', function() {
        expect(up.data(document)).toEqual({})
      })

      it('returns the same object for repeated calls, so we can use it as a state store', function() {
        const element = fixture('.element')
        const data1 = up.data(element)
        const data2 = up.data(element)

        expect(data1).toBe(data2)
      })
    })

    require('./script_hello_spec')

    describe('up.script.clean()', function() {

      it('allows compilers to return a function to call when the compiled element is cleaned', function() {
        const destructor = jasmine.createSpy('destructor')
        up.compiler('.child', (element) => destructor)

        const container = fixture('.container .child')
        up.hello(container)
        expect(destructor).not.toHaveBeenCalled()

        up.script.clean(container)
        expect(destructor).toHaveBeenCalled()
      })

      it('allows compilers to return an array of functions to call when the compiled element is cleaned', function() {
        const destructor1 = jasmine.createSpy('destructor1')
        const destructor2 = jasmine.createSpy('destructor2')
        up.compiler('.child', (element) => [ destructor1, destructor2 ])

        const container = fixture('.container .child')
        up.hello(container)

        up.script.clean(container)

        expect(destructor1).toHaveBeenCalled()
        expect(destructor2).toHaveBeenCalled()
      })

      it('ignores return values that are not functions', function() {
        const destructor1 = jasmine.createSpy('destructor1')
        const destructor2 = jasmine.createSpy('destructor2')
        up.compiler('.child', (element) => [ destructor1, 'nothing', destructor2 ])

        const container = fixture('.container .child')
        up.hello(container)

        up.script.clean(container)

        expect(destructor1).toHaveBeenCalled()
        expect(destructor2).toHaveBeenCalled()
      })

      it('runs all destructors if multiple compilers are applied to the same element', function() {
        const destructor1 = jasmine.createSpy('destructor1')
        up.compiler('.one', (element) => destructor1)
        const destructor2 = jasmine.createSpy('destructor2')
        up.compiler('.two', (element) => destructor2)

        const element = fixture('.one.two')
        up.hello(element)

        up.script.clean(element)

        expect(destructor1).toHaveBeenCalled()
        expect(destructor2).toHaveBeenCalled()
      })

      it('does not throw an error if both container and child have a destructor, and the container gets destroyed', function() {
        up.compiler('.container', (element) => (function() {}))

        up.compiler('.child', (element) => (function() {}))

        const container = fixture('.container .child')

        const clean = () => up.script.clean(container)
        expect(clean).not.toThrowError()
      })

      describe('when a destructor throws an error', function() {

        it('emits an error event but does not throw', async function() {
          const destroyError = new Error("error from crashing destructor")
          const crashingDestructor = function() { throw destroyError }

          const element = fixture('.element')
          up.destructor(element, crashingDestructor)

          await jasmine.expectGlobalError(destroyError, function() {
            const clean = () => up.script.clean(element)
            expect(clean).not.toThrowError()
          })
        })

        it('does not prevent other destructors from running', async function() {
          const destructorBefore = jasmine.createSpy('destructor before')
          const destroyError = new Error("error from crashing destructor")
          const crashingDestructor = function() { throw destroyError }
          const destructorAfter = jasmine.createSpy('destructor after')

          up.compiler('.element', () => destructorBefore)
          up.compiler('.element', () => crashingDestructor)
          up.compiler('.element', () => destructorAfter)

          const element = fixture('.element')
          up.hello(element)

          await jasmine.expectGlobalError(destroyError, () => up.script.clean(element))

          expect(destructorBefore).toHaveBeenCalled()
          expect(destructorAfter).toHaveBeenCalled()
        })
      })
    })

    describe('up.script.findAssets()', function() {

      it('finds a link[rel=stylesheet] in the head', function() {
        const link = fixture(document.head, 'link[rel="stylesheet"][href="/styles.css"]')
        expect(up.script.findAssets()).toContain(link)
      })

      it('does not find a link[rel=stylesheet] in the body', function() {
        const link = fixture(document.body, 'link[rel="stylesheet"][href="/styles.css"]')
        expect(up.script.findAssets()).not.toContain(link)
      })

      it('does not find a link[rel=alternate]', function() {
        const link = fixture(document.body, 'link[rel="alternate"][type="application/rss+xml"][title="RSS Feed"][href="/feed"]')
        expect(up.script.findAssets()).not.toContain(link)
      })

      it('finds a script[src] in the head', function() {
        const script = fixture(document.head, 'script[src="/foo.js"][nonce="specs-nonce"]')
        expect(up.script.findAssets()).toContain(script)
      })

      it('does not find a script[src] in the body', function() {
        const script = fixture(document.body, 'script[src="/foo.js"][nonce="specs-nonce"]')
        expect(up.script.findAssets()).not.toContain(script)
      })

      it('does not find an inline script in the head', function() {
        const script = fixture(document.head, 'script', { text: 'console.log("hello from inline script")', nonce: 'specs-nonce' })
        expect(up.script.findAssets()).not.toContain(script)
      })

      it('finds an arbitrary element in the head with [up-asset]', function() {
        const base = fixture(document.head, 'base[href="/pages"]')
        expect(up.script.findAssets()).toEqual([])

        base.setAttribute('up-asset', '')
        expect(up.script.findAssets()).toEqual([base])
      })

      it('allows to opt out with [up-asset=false]', function() {
        const link = fixture(document.head, 'link[rel="stylesheet"][href="/styles.css"][up-asset="false"]')
        expect(up.script.findAssets()).not.toContain(link)
      })

      it('allows to opt out by configuring up.script.config.noAssetSelectors', function() {
        const link = fixture(document.head, 'link[rel="stylesheet"][href="/excluded.css"]')
        up.script.config.noAssetSelectors.push('link[href="/excluded.css"]')
        expect(up.script.findAssets()).not.toContain(link)
      })
    })

    describe('up.script.cspNonce()', function() {

      beforeEach(function() {
        // Remove the CSP meta to start with a clean slate.
        // This change will be undone by protect_jasmine_runner.js
        this.runnerCSPMeta = document.querySelector('meta[name=csp-nonce]')
        this.runnerCSPMeta.remove()
      })

      it('returns undefined if the <head> has no <meta name="csp-nonce>"', function() {
        expect(document.head).not.toHaveSelector('meta[name="csp-nonce"]')
        expect(up.script.cspNonce()).toBeUndefined()
      })

      it('returns the content from a <meta name="csp-nonce">', function() {
        up.element.affix(document.head, 'meta[name="csp-nonce"][content="custom-nonce"]')
        expect(up.script.cspNonce()).toBe('custom-nonce')
      })

      it('returns a string assigned to up.script.config.cspNonce', function() {
        up.element.affix(document.head, 'meta[name="csp-nonce"][content="ignored-nonce"]')
        up.script.config.cspNonce = 'config-nonce'
        expect(up.script.cspNonce()).toBe('config-nonce')
      })

      it('evals a function assigned to up.script.config.cspNonce', function() {
        up.element.affix(document.head, 'meta[name="csp-nonce"][content="ignored-nonce"]')
        up.script.config.cspNonce = () => 'function-nonce'
        expect(up.script.cspNonce()).toBe('function-nonce')
      })

    })

    describe('up.script.warnOfUnsafeCSP()', function() {

      let warnSpy

      beforeEach(function() {
        warnSpy = spyOn(console, 'warn').and.callThrough()
      })

      const CSP_PRESETS = {
        'host-based': "script-src 'self' https://api.com",
        'nonce-only':  "script-src 'nonce-secret111'",
        'strict-dynamic': "script-src 'nonce-secret111' 'strict-dynamic'",
        'unsafe-inline': "script-src 'unsafe-inline'",
        'unsafe-eval': "script-src 'unsafe-eval'",
      }

      describe('unexpectedly liberal script execution', function() {

        const warnArgs = [jasmine.stringContaining("A 'strict-dynamic' CSP allows arbitrary <script> elements in new fragments"), jasmine.anything(), jasmine.anything()]

        function itWarnsFor(cspName) {
          const cspString = CSP_PRESETS[cspName] ?? up.fail('Unknown CSP preset' + cspName)

          it(`warns with a ${cspName} CSP`, function() {
            let cspInfo = up.CSPInfo.fromHeader(cspString)
            up.script.warnOfUnsafeCSP(cspInfo)
            expect(warnSpy).toHaveBeenCalledWith(...warnArgs)
          })
        }

        function itDoesNotWarnFor(cspName) {
          const cspString = CSP_PRESETS[cspName] ?? up.fail('Unknown CSP preset' + cspName)

          it(`does not warn with a ${cspName} CSP`, function() {
            let cspInfo = up.CSPInfo.fromHeader(cspString)
            up.script.warnOfUnsafeCSP(cspInfo)
            expect(warnSpy).not.toHaveBeenCalledWith(...warnArgs)
          })
        }

        describe('with up.script.config.scriptElementPolicy = "block"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "block"
          })

          itDoesNotWarnFor('host-based')
          itDoesNotWarnFor('nonce-only')
          itDoesNotWarnFor('strict-dynamic')
          itDoesNotWarnFor('unsafe-inline')

        })

        describe('with up.script.config.scriptElementPolicy = "nonce"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "nonce"
          })

          itDoesNotWarnFor('host-based')
          itDoesNotWarnFor('nonce-only')
          itDoesNotWarnFor('strict-dynamic')
          itDoesNotWarnFor('unsafe-inline')

        })

        describe('with up.script.config.scriptElementPolicy = "pass"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "pass"
          })

          itDoesNotWarnFor('host-based')
          itDoesNotWarnFor('nonce-only')
          itWarnsFor('strict-dynamic')
          itDoesNotWarnFor('unsafe-inline')

        })

        describe('with up.script.config.scriptElementPolicy = "auto"', function() {

          beforeEach(function() {
            up.script.config.scriptElementPolicy = "auto"
          })

          itDoesNotWarnFor('host-based')
          itDoesNotWarnFor('nonce-only')
          itDoesNotWarnFor('strict-dynamic') // detected and sitches to "nonce"
          itDoesNotWarnFor('unsafe-inline')

        })

      })

      describe('unexpectedly liberal callback execution', function() {

        const warnArgs = [jasmine.stringContaining("An 'unsafe-eval' CSP allows arbitrary [up-on...] callbacks"), jasmine.anything(), jasmine.anything()]

        function itWarnsFor(cspName) {
          const cspString = CSP_PRESETS[cspName] ?? up.fail('Unknown CSP preset' + cspName)

          it(`warns with a ${cspName} CSP`, function() {
            let cspInfo = up.CSPInfo.fromHeader(cspString)
            up.script.warnOfUnsafeCSP(cspInfo)
            expect(warnSpy).toHaveBeenCalledWith(...warnArgs)
          })
        }

        function itDoesNotWarnFor(cspName) {
          const cspString = CSP_PRESETS[cspName] ?? up.fail('Unknown CSP preset' + cspName)

          it(`does not warn with a ${cspName} CSP`, function() {
            let cspInfo = up.CSPInfo.fromHeader(cspString)
            up.script.warnOfUnsafeCSP(cspInfo)
            expect(warnSpy).not.toHaveBeenCalledWith(...warnArgs)
          })
        }

        describe('with up.script.config.evalCallbackPolicy = "block"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "block"
          })

          itDoesNotWarnFor('host-based')
          itDoesNotWarnFor('nonce-only')
          itDoesNotWarnFor('strict-dynamic')
          itDoesNotWarnFor('unsafe-eval')
          itDoesNotWarnFor('unsafe-inline')

        })

        describe('with up.script.config.evalCallbackPolicy = "nonce"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "nonce"
          })

          itDoesNotWarnFor('host-based')
          itDoesNotWarnFor('nonce-only')
          itDoesNotWarnFor('strict-dynamic')
          itDoesNotWarnFor('unsafe-eval')
          itDoesNotWarnFor('unsafe-inline')

        })

        describe('with up.script.config.evalCallbackPolicy = "pass"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "pass"
          })

          itDoesNotWarnFor('host-based')
          itDoesNotWarnFor('nonce-only')
          itDoesNotWarnFor('strict-dynamic')
          itWarnsFor('unsafe-eval')
          itDoesNotWarnFor('unsafe-inline')

        })

        describe('with up.script.config.evalCallbackPolicy = "auto"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "auto"
          })

          describe('when the page nonce is known', function() {
            beforeEach(function() {
              spyOn(up.script, 'cspNonce').and.returnValue('secret000')
            })

            itDoesNotWarnFor('host-based')
            itDoesNotWarnFor('nonce-only')
            itDoesNotWarnFor('strict-dynamic')
            itDoesNotWarnFor('unsafe-eval') // we auto-switch to "nonce"
            itDoesNotWarnFor('unsafe-inline')

          })

          describe('when the page nonce is not known', function() {
            beforeEach(function() {
              spyOn(up.script, 'cspNonce').and.returnValue(undefined)
            })

            itDoesNotWarnFor('host-based')
            itDoesNotWarnFor('nonce-only')
            itDoesNotWarnFor('strict-dynamic')
            itWarnsFor('unsafe-eval')
            itDoesNotWarnFor('unsafe-inline')

          })

        })
        
      })

    })

    require('./script_adopt_new_fragment_spec')

    describe('up.script.adoptDetachedHeadAsset()', function() {

      function itBehavesLikeExamples() {

        describe('scripts', function() {

          it('rewrites a matching [nonce]', function() {
            spyOn(up.script, 'cspNonce').and.returnValue('page000')

            const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response111'")
            const script = up.element.createFromSelector('script[nonce="response111"][src="external.js"]')
            up.script.adoptDetachedHeadAsset(script, cspInfo)

            expect(script).toHaveProperty('nonce', 'page000')
          })

          it('does not rewrite a non-matching [nonce]', function() {
            spyOn(up.script, 'cspNonce').and.returnValue('page000')

            const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response111'")
            const script = up.element.createFromSelector('script[nonce="wrong222"][src="external.js"]')
            up.script.adoptDetachedHeadAsset(script, cspInfo)

            expect(script).toHaveProperty('nonce', 'wrong222')
          })

          it('does not rewrite a matching [nonce] when the page nonce is not known', function() {
            spyOn(up.script, 'cspNonce').and.returnValue(undefined)

            const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response111'")
            const script = up.element.createFromSelector('script[nonce="response111"][src="external.js"]')
            up.script.adoptDetachedHeadAsset(script, cspInfo)

            expect(script).toHaveProperty('nonce', 'response111')
          })

          it('does not change an element without a [nonce] attribute', function() {
            spyOn(up.script, 'cspNonce').and.returnValue('page000')

            const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response111'")
            const script = up.element.createFromSelector('script[src="external.js"]')
            const scriptHTMLBefore = script.outerHTML
            up.script.adoptDetachedHeadAsset(script, cspInfo)

            expect(script.nonce).toBeBlank()
            expect(script.outerHTML).toEqual(scriptHTMLBefore)
          })

        })

        describe('inline styles (not supported)', function() {

          it('does not rewrite the [nonce] of inline <style> elements using the script-src nonce', function() {
            spyOn(up.script, 'cspNonce').and.returnValue('page000')

            const cspInfo = up.CSPInfo.fromHeader("script-src 'self' 'nonce-response111'")
            const style = up.element.createFromSelector('style[nonce="response111"]')
            up.script.adoptDetachedHeadAsset(style, cspInfo)

            expect(style).toHaveProperty('nonce', 'response111')
          })

        })

        it('does not trigger up:assets:changed if a script elements is identical after the [nonce] was rewritten', async function() {
          spyOn(up.script, 'cspNonce').and.returnValue('specs-nonce')
          const listener = jasmine.createSpy('up:assets:changed listener')
          up.on('up:assets:changed', listener)

          // TODO: Remove "linked_" prefix from both files
          let scriptPath = up.specUtil.staticFile('linked_noop_script.js')

          let targetHTML = (version) => `
            <div id="target">
              target v${version}
            </div>
          `

          let respond = (nonce, targetVersion) => {
            jasmine.respondWith({
              responseText: `
                <html>
                  <head>
                    <script src='${scriptPath}' nonce="${nonce}"></script>
                  </head>
                  <body>
                    ${targetHTML(targetVersion)}
                  </body>
                </html>
              `,
              responseHeaders: {
                'Content-Security-Policy': `script-src 'nonce-${nonce}'`
              }
            })
          }

          let [target] = htmlFixtureList(targetHTML(0))
          expect('#target').toHaveVisibleText('target v0')

          up.render({ target: '#target', url: '/path1' })
          await wait()

          respond('response111', 1)

          await wait()

          expect('#target').toHaveVisibleText('target v1')
          expect(listener.calls.count()).toBe(1)
          const v1Event = listener.calls.mostRecent().args[0]
          expect(v1Event.newAssets.length).toBe(1)
          const v1Script = v1Event.newAssets[0]
          expect(v1Script).toMatchSelector(`script[src="${scriptPath}"]`)
          expect(v1Script).toHaveProperty('nonce', 'specs-nonce')

          // Insert the remote script
          document.head.append(v1Script)

          up.render({ target: '#target', url: '/path2' })
          await wait()

          respond('response222', 2)
          await wait()

          expect('#target').toHaveVisibleText('target v2')

          const v2Event = listener.calls.mostRecent().args[0]
          const v2Script = v2Event.newAssets[0]
          expect(v2Script).toMatchSelector(`script[src="${scriptPath}"]`)
          expect(v2Script).toHaveProperty('nonce', 'specs-nonce')

          // No additional up:assets:changed event
          expect(listener.calls.count()).toBe(1)

          // Head assets are cleaned up automatically, but let's be good citizens
          v1Script.remove()
        })
      }

      describe('CSP nonces in head assets', function() {

        itBehavesLikeExamples()

        describe("scriptElementPolicy only controlling body scripts (and we don't want blocking policies to cause up:assets:changed with every render pass)", function() {

          describe('with up.script.config.scriptElementPolicy = "block"', function() {

            beforeEach(function() {
              up.script.config.scriptElementPolicy = "block"
            })

            itBehavesLikeExamples()
          })

          describe('with up.script.config.scriptElementPolicy = "nonce"', function() {

            beforeEach(function() {
              up.script.config.scriptElementPolicy = "nonce"
            })

            itBehavesLikeExamples()
          })

        })

      })

    })

    describe('adoptRenderOptionsFromHeader()', function() {

      describe('CSP nonces in a JSON of render options', function() {

        beforeEach(function() {
          window.callbackSpy = jasmine.createSpy('callback spy')
        })

        afterEach(function() {
          delete window.callbackSpy
        })

        function itBehavesLikeNonce({ pageNonce } = {}) {

          describe(`when the page nonce is ${pageNonce ? 'known' : 'unknown'}`, function() {

            beforeEach(function() {
              up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
              this.cspInfo ??= up.CSPInfo.fromHeader(`script-src 'self' 'nonce-response111'`)
            })

            it('returns a throwing function for a callback without nonce', function() {
              let code = 'window.callbackSpy()'
              let renderOptions = { onLoaded: code }
              up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
              let fn = renderOptions.onLoaded
              expect(fn).toThrowError(up.Blocked)
              expect(window.callbackSpy).not.toHaveBeenCalled()
            })

            it('returns an executable function for a callback with the correct nonce', function() {
              let code = 'nonce-specs-nonce window.callbackSpy()'
              let renderOptions = { onLoaded: code }
              up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
              let fn = renderOptions.onLoaded
              expect(fn).not.toThrowError(up.Blocked)
              expect(window.callbackSpy).toHaveBeenCalled()
            })

            it('returns a throwing function for a callback with an incorrect nonce', function() {
              let code = 'nonce-wrong222 window.callbackSpy()'
              let renderOptions = { onLoaded: code }
              up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
              let fn = renderOptions.onLoaded
              expect(fn).toThrowError(up.Blocked)
              expect(window.callbackSpy).not.toHaveBeenCalled()
            })

          })

        }

        function itBehavesLikeBlock({ pageNonce } = {}) {

          describe(`when the page nonce is ${pageNonce ? 'known' : 'unknown'}`, function() {

            beforeEach(function() {
              up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
            })

            it('returns a throwing function for a callback without nonce', function() {
              let code = 'window.callbackSpy()'
              let renderOptions = { onLoaded: code }
              up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
              let fn = renderOptions.onLoaded
              expect(fn).toThrowError(up.Blocked)
              expect(window.callbackSpy).not.toHaveBeenCalled()
            })

            it('returns a throwing function a callback with the correct nonce', function() {
              let code = 'nonce-specs-nonce window.callbackSpy()'
              let renderOptions = { onLoaded: code }
              up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
              let fn = renderOptions.onLoaded
              expect(fn).toThrowError(up.Blocked)
              expect(window.callbackSpy).not.toHaveBeenCalled()
            })

            it('returns a throwing function a callback with the correct nonce, but the page nonce is not known to Unpoly', function() {
              spyOn(up.script, 'cspNonce').and.returnValue(undefined)
              let code = 'nonce-specs-nonce window.callbackSpy()'
              let renderOptions = { onLoaded: code }
              up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
              let fn = renderOptions.onLoaded
              expect(fn).toThrowError(up.Blocked)
              expect(window.callbackSpy).not.toHaveBeenCalled()
            })

            it('returns a throwing function for a callback with an incorrect nonce', function() {
              spyOn(up.script, 'cspNonce').and.returnValue(undefined)
              let code = 'nonce-wrong222 window.callbackSpy()'
              let renderOptions = { onLoaded: code }
              up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
              let fn = renderOptions.onLoaded
              expect(fn).toThrowError(up.Blocked)
              expect(window.callbackSpy).not.toHaveBeenCalled()
            })

          })

        }

        function itBehavesLikePass({ pageNonce } = {}) {

          describe(`when the page nonce is ${pageNonce ? 'known' : 'unknown'}`, function() {

            beforeEach(function() {
              up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
            })

            it('returns an executable function for a callback with the correct nonce', function() {
              let code = 'nonce-specs-nonce window.callbackSpy()'
              let renderOptions = { onLoaded: code }
              up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
              let fn = renderOptions.onLoaded
              expect(fn).not.toThrowError(up.Blocked)
              expect(window.callbackSpy).toHaveBeenCalled()
            })

            if (specs.config.csp === 'none') {
              it('returns an executable function for a callback without a nonce', function() {
                let code = 'window.callbackSpy()'
                let renderOptions = { onLoaded: code }
                up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
                let fn = renderOptions.onLoaded
                expect(fn).not.toThrowError(up.Blocked)
                expect(window.callbackSpy).toHaveBeenCalled()
              })
            }

            if (specs.config.csp === 'nonce-only') {
              it('returns a throwing function for a callback without a nonce', function() {
                let code = 'window.callbackSpy()'
                let renderOptions = { onLoaded: code }
                up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
                let fn = renderOptions.onLoaded
                expect(fn).toThrowError(up.Blocked) // new Function() throws EvalError internally
                expect(window.callbackSpy).not.toHaveBeenCalled()
              })

              it('returns a noop function for a callback with an incorrect nonce', function() {
                let code = 'nonce-wrong222 window.callbackSpy()'
                let renderOptions = { onLoaded: code }
                up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
                let fn = renderOptions.onLoaded
                // We would prefer to detect the violation and throw up.Blocked here.
                // Unfortunately the securitypolicyviolation event is emitted async after our eval,
                // and we don't want to be async ourselves.
                fn()
                expect(window.callbackSpy).not.toHaveBeenCalled()
              })

              if (!pageNonce) {
                it('returns an executable function for a callback with a correct nonce, but the page nonce is not known to Unpoly', function() {
                  spyOn(up.script, 'cspNonce').and.returnValue(undefined)
                  let code = 'nonce-specs-nonce window.callbackSpy()'
                  let renderOptions = { onLoaded: code }
                  up.script.adoptRenderOptionsFromHeader(renderOptions, this.cspInfo)
                  let fn = renderOptions.onLoaded
                  expect(fn).not.toThrowError(up.Blocked)
                  expect(window.callbackSpy).toHaveBeenCalled()
                })
              }
            }

          })

        }

        describe('with up.script.config.evalCallbackPolicy = "block"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "block"
          })

          itBehavesLikeBlock({ pageNonce: 'specs-nonce' })
          itBehavesLikeBlock({ pageNonce: null })

        })

        describe('with up.script.config.evalCallbackPolicy = "pass"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "pass"
          })

          itBehavesLikePass({ pageNonce: 'specs-nonce' })
          itBehavesLikePass({ pageNonce: null })

        })

        describe('with up.script.config.evalCallbackPolicy = "nonce"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "nonce"
          })

          itBehavesLikeNonce({ pageNonce: 'specs-nonce' })
          itBehavesLikeBlock({ pageNonce: null })

        })

        describe('with up.script.config.evalCallbackPolicy = "auto"', function() {

          beforeEach(function() {
            up.script.config.evalCallbackPolicy = "auto"
          })

          itBehavesLikeNonce({ pageNonce: 'specs-nonce' })
          itBehavesLikePass({ pageNonce: null })

        })



        // describe('with up.script.config.evalCallbackPolicy = "block"', function() {
        //
        //   beforeEach(function() {
        //     up.script.config.evalCallbackPolicy = "block"
        //   })
        //
        //   it('blocks a callback without nonce')
        //
        //   it('blocks a callback with the correct nonce')
        //
        //   it('blocks a callback with an incorrect nonce')
        //
        // })
        //
        // describe('with up.script.config.evalCallbackPolicy = "pass"', function() {
        //
        //   beforeEach(function() {
        //     up.script.config.evalCallbackPolicy = "pass"
        //   })
        //
        //   it('rewrites a correct callback nonce')
        //
        //   it('does not change a callback with an incorrect nonce')
        //
        // })
        //
        // describe('with up.script.config.evalCallbackPolicy = "nonce"', function() {
        //
        //   beforeEach(function() {
        //     up.script.config.evalCallbackPolicy = "nonce"
        //   })
        //
        //   it('must have tests', function() {
        //     pending("test me")
        //   })
        //
        // })
        //
        // describe('with up.script.config.evalCallbackPolicy = "auto"', function() {
        //
        //   beforeEach(function() {
        //     up.script.config.evalCallbackPolicy = "auto"
        //   })
        //
        //   it('must have tests', function() {
        //     pending("test me")
        //   })
        //
        // })



      })

    })

    describe('parseCallback()', function() {

      beforeEach(function() {
        window.callbackSpy = jasmine.createSpy('callback spy')
      })

      afterEach(function() {
        delete window.callbackSpy
      })

      function itBehavesLikeNonce({ pageNonce } = {}) {

        describe(`when the page nonce is ${pageNonce ? 'known' : 'unknown'}`, function() {

          beforeEach(function() {
            up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
          })

          it('returns a throwing function for a callback without nonce', function() {
            let code = 'window.callbackSpy()'
            let fn = up.script.parseCallback(code)
            expect(fn).toThrowError(up.Blocked)
            expect(window.callbackSpy).not.toHaveBeenCalled()
          })

          it('returns an executable function for a callback with the correct nonce', function() {
            let code = 'nonce-specs-nonce window.callbackSpy()'
            let fn = up.script.parseCallback(code)
            expect(fn).not.toThrowError(up.Blocked)
            expect(window.callbackSpy).toHaveBeenCalled()
          })

          it('returns a throwing function for a callback with an incorrect nonce', function() {
            let code = 'nonce-wrong222 window.callbackSpy()'
            let fn = up.script.parseCallback(code)
            expect(fn).toThrowError(up.Blocked)
            expect(window.callbackSpy).not.toHaveBeenCalled()
          })

        })

      }

      function itBehavesLikeBlock({ pageNonce } = {}) {

        describe(`when the page nonce is ${pageNonce ? 'known' : 'unknown'}`, function() {

          beforeEach(function() {
            up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
          })

          it('returns a throwing function for a callback without nonce', function() {
            let code = 'window.callbackSpy()'
            let fn = up.script.parseCallback(code)
            expect(fn).toThrowError(up.Blocked)
            expect(window.callbackSpy).not.toHaveBeenCalled()
          })

          it('returns a throwing function a callback with the correct nonce', function() {
            let code = 'nonce-specs-nonce window.callbackSpy()'
            let fn = up.script.parseCallback(code)
            expect(fn).toThrowError(up.Blocked)
            expect(window.callbackSpy).not.toHaveBeenCalled()
          })

          it('returns a throwing function a callback with the correct nonce, but the page nonce is not known to Unpoly', function() {
            spyOn(up.script, 'cspNonce').and.returnValue(undefined)
            let code = 'nonce-specs-nonce window.callbackSpy()'
            let fn = up.script.parseCallback(code)
            expect(fn).toThrowError(up.Blocked)
            expect(window.callbackSpy).not.toHaveBeenCalled()
          })

          it('returns a throwing function for a callback with an incorrect nonce', function() {
            spyOn(up.script, 'cspNonce').and.returnValue(undefined)
            let code = 'nonce-wrong222 window.callbackSpy()'
            let fn = up.script.parseCallback(code)
            expect(fn).toThrowError(up.Blocked)
            expect(window.callbackSpy).not.toHaveBeenCalled()
          })

        })

      }

      function itBehavesLikePass({ pageNonce } = {}) {

        describe(`when the page nonce is ${pageNonce ? 'known' : 'unknown'}`, function() {

          beforeEach(function() {
            up.script.config.cspNonce = up.util.assert(pageNonce, u.isDefined)
          })

          it('returns an executable function for a callback with the correct nonce', function() {
            let code = 'nonce-specs-nonce window.callbackSpy()'
            let fn = up.script.parseCallback(code)
            expect(fn).not.toThrowError(up.Blocked)
            expect(window.callbackSpy).toHaveBeenCalled()
          })

          if (specs.config.csp === 'none') {
            it('returns an executable function for a callback without a nonce', function() {
              let code = 'window.callbackSpy()'
              let fn = up.script.parseCallback(code)
              expect(fn).not.toThrowError(up.Blocked)
              expect(window.callbackSpy).toHaveBeenCalled()
            })
          }

          if (specs.config.csp === 'nonce-only') {
            it('returns a throwing function for a callback without a nonce', function() {
              let code = 'window.callbackSpy()'
              let fn = up.script.parseCallback(code)
              expect(fn).toThrowError(up.Blocked) // new Function() throws EvalError internally
              expect(window.callbackSpy).not.toHaveBeenCalled()
            })

            it('returns a noop function for a callback with an incorrect nonce', function() {
              let code = 'nonce-wrong222 window.callbackSpy()'
              let fn = up.script.parseCallback(code)
              // We would prefer to detect the violation and throw up.Blocked here.
              // Unfortunately the securitypolicyviolation event is emitted async after our eval,
              // and we don't want to be async ourselves.
              fn()
              expect(window.callbackSpy).not.toHaveBeenCalled()
            })

            if (!pageNonce) {
              it('returns an executable function for a callback with a correct nonce, but the page nonce is not known to Unpoly', function() {
                spyOn(up.script, 'cspNonce').and.returnValue(undefined)
                let code = 'nonce-specs-nonce window.callbackSpy()'
                let fn = up.script.parseCallback(code)
                expect(fn).not.toThrowError(up.Blocked)
                expect(window.callbackSpy).toHaveBeenCalled()
              })
            }

          }

        })

      }

      describe('with up.script.config.evalCallbackPolicy = "block"', function() {

        beforeEach(function() {
          up.script.config.evalCallbackPolicy = "block"
        })

        itBehavesLikeBlock({ pageNonce: 'specs-nonce' })
        itBehavesLikeBlock({ pageNonce: null })

      })

      describe('with up.script.config.evalCallbackPolicy = "pass"', function() {

        beforeEach(function() {
          up.script.config.evalCallbackPolicy = "pass"
        })

        itBehavesLikePass({ pageNonce: 'specs-nonce' })
        itBehavesLikePass({ pageNonce: null })

      })

      describe('with up.script.config.evalCallbackPolicy = "nonce"', function() {

        beforeEach(function() {
          up.script.config.evalCallbackPolicy = "nonce"
        })

        itBehavesLikeNonce({ pageNonce: 'specs-nonce' })
        itBehavesLikeBlock({ pageNonce: null })

      })

      describe('with up.script.config.evalCallbackPolicy = "auto"', function() {

        beforeEach(function() {
          up.script.config.evalCallbackPolicy = "auto"
        })

        itBehavesLikeNonce({ pageNonce: 'specs-nonce' })
        itBehavesLikePass({ pageNonce: null })

      })

      describe('callback context', function() {

        it('exposes the first arg as `event` by default', function() {
          let event = { type: 'test' }
          let code = 'nonce-specs-nonce window.callbackSpy(event)'
          let fn = up.script.parseCallback(code)
          expect(() => fn(event)).not.toThrowError(up.Blocked)
          expect(window.callbackSpy).toHaveBeenCalledWith(event)
        })

        it('exposes properties of the first arg with { expandObject } option', function() {
          let event = { type: 'test', prop1: 'value1', prop2: 'value2' }
          let code = 'nonce-specs-nonce window.callbackSpy(prop1, prop2)'
          let fn = up.script.parseCallback(code, { expandObject: ['prop1', 'prop2']})
          expect(() => fn(event)).not.toThrowError(up.Blocked)
          expect(window.callbackSpy).toHaveBeenCalledWith('value1', 'value2')
        })

        it('allows to configure arg names with { argNames } option', function() {
          let code = 'nonce-specs-nonce window.callbackSpy(arg1, arg2)'
          let fn = up.script.parseCallback(code, { argNames: ['arg1', 'arg2']})
          expect(() => fn('foo', 'bar')).not.toThrowError(up.Blocked)
          expect(window.callbackSpy).toHaveBeenCalledWith('foo', 'bar')
        })

      })

    })

  })

})
