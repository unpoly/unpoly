const u = up.util
const e = up.element

if (up.migrate.loaded) {

  describe('up.migrate', function() {

    describe('up.migrate.transformAttribute()', function() {

      it('runs a callback with each new element that has the given attribute', function() {
        let callback = jasmine.createSpy('callback')
        up.migrate.transformAttribute('my-attr', callback)

        let container = fixture('.container')
        let elementWithAttr = e.affix(container, 'div[my-attr]')
        let elementWithoutAttr = e.affix(container, 'div[other-attr]')

        up.hello(container)

        expect(callback).toHaveBeenCalledWith(elementWithAttr, jasmine.anything())
        expect(callback).not.toHaveBeenCalledWith(elementWithoutAttr, jasmine.anything())
      })

      it('passes the current attribute value as a second callback attribute', function() {
        let callback = jasmine.createSpy('callback')
        up.migrate.transformAttribute('my-attr', callback)

        let element = fixture('div[my-attr="value"]')

        up.hello(element)

        expect(callback).toHaveBeenCalledWith(element, 'value')
      })

      describe('with { scope } option', function() {

        it('only sees an element when it has both the given attribute and it also matches the given scope selector', function() {
          let callback = jasmine.createSpy('callback')
          up.migrate.transformAttribute('my-attr', { scope: '.scope' }, callback)

          let container = fixture('.container')
          let elementInScope = e.affix(container, '.scope[my-attr]')
          let elementOutsideScope = e.affix(container, '.other[my-attr]')

          up.hello(container)

          expect(callback).toHaveBeenCalledWith(elementInScope, jasmine.anything())
          expect(callback).not.toHaveBeenCalledWith(elementOutsideScope, jasmine.anything())
        })

      })

    })

    describe('up.migrate.renamedAttribute()', function() {

      it('renames the given old attribute to the given new attribute', function() {
        up.migrate.renamedAttribute('old-attr', 'new-attr')
        let element = fixture('.element[old-attr="attr-value"]')

        up.hello(element)

        expect(element).toHaveAttribute('new-attr', 'attr-value')
      })

      describe('with { mapValue } option', function() {

        it('transforms the attribute value through the given function', function() {
          up.migrate.renamedAttribute('old-attr', 'new-attr', { mapValue: (value) => value.toUpperCase() })
          let element = fixture('.element[old-attr="attr-value"]')

          up.hello(element)

          expect(element).toHaveAttribute('new-attr', 'ATTR-VALUE')
        })

      })

    })

    describe('up.migrate.fixKey()', function() {

      it('renames a key in the given object', function() {
        let obj = { foo: 123 }
        up.migrate.fixKey(obj, 'foo', 'bar')

        expect(obj).not.toHaveKey('foo')
        expect(obj.bar).toBe(123)
      })

      it('does not set the new key if the object never had the old key', function() {
        let obj = { }
        up.migrate.fixKey(obj, 'foo', 'bar')

        expect(obj).not.toHaveKey('foo')
        expect(obj).not.toHaveKey('bar')

      })

      it('prints the object in the warning', function() {
        const warnSpy = up.migrate.warn.mock()
        let obj = { foo: 123 }
        up.migrate.fixKey(obj, 'foo', 'bar')

        expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('(found in %o)'), 'foo', 'bar', obj)
      })

      it('names the object by the given { label }', function() {
        const warnSpy = up.migrate.warn.mock()
        up.migrate.fixKey({ foo: 123 }, 'foo', 'bar', { label: 'render options' })

        expect(u.sprintf(...warnSpy.calls.argsFor(0))).toBe('Property { foo } has been renamed to { bar } (found in render options)')
      })

      it('names the call site by the given { detail }, printing the warning once per call site', function() {
        const errorSpy = spyOn(up.log, 'error')
        up.migrate.fixKey({ foo: 1 }, 'foo', 'bar', { label: 'request options', detail: '/path1' })
        up.migrate.fixKey({ foo: 2 }, 'foo', 'bar', { label: 'request options', detail: '/path2' })
        up.migrate.fixKey({ foo: 3 }, 'foo', 'bar', { label: 'request options', detail: '/path1' })

        expect(errorSpy.calls.allArgs().map((args) => u.sprintf(...args.slice(1)))).toEqual([
          'Property { foo } has been renamed to { bar } (found in request options for "/path1")',
          'Property { foo } has been renamed to { bar } (found in request options for "/path2")',
        ])
      })

      it('prints a labeled warning only once for multiple objects', function() {
        const errorSpy = spyOn(up.log, 'error')
        up.migrate.fixKey({ foo: 1 }, 'foo', 'bar', { label: 'render options' })
        up.migrate.fixKey({ foo: 2 }, 'foo', 'bar', { label: 'render options' })

        expect(errorSpy.calls.count()).toBe(1)
      })

    })

    describe('up.migrate.renamedProperty()', function() {

      it('warns when the old property is accessed', function() {
        const warnSpy = up.migrate.warn.mock()
        const object = { newKey: 'value' }
        up.migrate.renamedProperty(object, 'oldKey', 'newKey')

        expect(object.oldKey).toBe('value')
        expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('(found in %o)'), 'oldKey', 'newKey', object)
      })

      it('names the object by the given { label }', function() {
        const warnSpy = up.migrate.warn.mock()
        const object = { newKey: 'value' }
        up.migrate.renamedProperty(object, 'oldKey', 'newKey', { label: 'up.foo.config' })

        expect(object.oldKey).toBe('value')
        expect(u.sprintf(...warnSpy.calls.argsFor(0))).toBe('Property up.foo.config.oldKey has been renamed to up.foo.config.newKey')
      })

      it('logs the given { warning } instead of the default warning', function() {
        const warnSpy = up.migrate.warn.mock()
        const object = { newKey: 'value' }
        up.migrate.renamedProperty(object, 'oldKey', 'newKey', { warning: 'Custom warning' })

        expect(object.oldKey).toBe('value')
        expect(warnSpy).toHaveBeenCalledWith('Custom warning')
      })

    })

    describe('up.migrate.removedProperty()', function() {

      it('warns when the property is accessed', function() {
        const warnSpy = up.migrate.warn.mock()
        const object = { removedKey: 'value' }
        up.migrate.removedProperty(object, 'removedKey')

        expect(object.removedKey).toBe('value')
        expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('(found in %o)'), 'removedKey', object)
      })

      it('names the object by the given { label }', function() {
        const warnSpy = up.migrate.warn.mock()
        const object = { removedKey: 'value' }
        up.migrate.removedProperty(object, 'removedKey', { label: 'up.foo.config' })

        expect(object.removedKey).toBe('value')
        expect(u.sprintf(...warnSpy.calls.argsFor(0))).toBe('Property up.foo.config.removedKey has been removed without replacement')
      })

      it('does not warn when the object is enumerated, e.g. when another warning prints it', function() {
        const warnSpy = up.migrate.warn.mock()
        const object = { keptKey: 'kept', removedKey: 'value' }
        up.migrate.removedProperty(object, 'removedKey')

        expect(Object.keys(object)).toEqual(['keptKey'])
        JSON.stringify(object)
        expect(warnSpy).not.toHaveBeenCalled()
      })

      it('starts with the given { value } without a warning when defined again, like when up.framework.reset() runs a config patch', function() {
        const warnSpy = up.migrate.warn.mock()
        const object = {}
        up.migrate.removedProperty(object, 'removedKey', { value: 'default' })
        object.removedKey = 'changed'
        warnSpy.calls.reset()

        const valueRef = up.migrate.removedProperty(object, 'removedKey', { value: 'default' })

        expect(valueRef[0]).toBe('default')
        expect(warnSpy).not.toHaveBeenCalled()
      })

    })

    describe('up.modal and up.popup', function() {

      it('do not warn about their deprecated config when enumerated', function() {
        expect(Object.keys(up.modal)).not.toContain('config')
        expect(Object.keys(up.popup)).not.toContain('config')
      })

    })

    describe('up.migrate.renamedPackage()', function() {

      it('prints a warning and forwards the call to the new module', function() {
        const warnSpy = up.migrate.warn.mock()
        const value = up.dom
        expect(warnSpy).toHaveBeenCalled()
        expect(value).toBe(up.fragment)
      })

    })

    // These specs loop over the declared renames to catch typos in old or new names.
    describe('declared polyfills', function() {

      // Returns the object at a path like 'up.form.config'.
      function lookup(path) {
        return path.split('.').reduce((object, key) => object[key], window)
      }

      describe('renamed config properties', function() {
        const cases = [
          ['up.form.config', 'fields', 'fieldSelectors'],
          ['up.form.config', 'submitButtons', 'submitButtonSelectors'],
          ['up.form.config', 'validateTargets', 'groupSelectors'],
          ['up.form.config', 'observeDelay', 'watchInputDelay'],
          ['up.form.config', 'genericButtonSelectors', 'anyButtonSelectors'],
          ['up.fragment.config', 'fallbacks', 'mainTargets'],
          ['up.history.config', 'popTargets', 'restoreTargets'],
          ['up.network.config', 'maxRequests', 'concurrency'],
          ['up.network.config', 'slowDelay', 'lateDelay'],
          ['up.network.config', 'badResponseTime', 'lateDelay'],
          ['up.network.config', 'cacheExpiry', 'cacheExpireAge'],
          ['up.network.config', 'clearCache', 'expireCache'],
          ['up.radio.config', 'hungry', 'hungrySelectors'],
          ['up.status.config', 'navs', 'navSelectors'],
          ['up.viewport.config', 'viewports', 'viewportSelectors'],
          ['up.viewport.config', 'fixedTop', 'fixedTopSelectors'],
          ['up.viewport.config', 'fixedBottom', 'fixedBottomSelectors'],
          ['up.viewport.config', 'anchoredRight', 'anchoredRightSelectors'],
          ['up.viewport.config', 'snap', 'revealSnap'],
        ]

        for (let [label, oldKey, newKey] of cases) {
          it(`forwards ${label}.${oldKey} to ${label}.${newKey}`, function() {
            const config = lookup(label)
            expect(newKey in config).toBe(true)
            const warnSpy = up.migrate.warn.mock()
            const value = config[newKey]

            expect(config[oldKey]).toBe(value)
            config[oldKey] = 'new value'
            expect(config[newKey]).toBe('new value')
            expect(warnSpy).toHaveBeenCalled()
          })
        }

        it('forwards up.network.config.preloadDelay to up.link.config.preloadDelay', function() {
          const warnSpy = up.migrate.warn.mock()
          up.network.config.preloadDelay = 12
          expect(up.link.config.preloadDelay).toBe(12)
          expect(up.network.config.preloadDelay).toBe(12)
          expect(warnSpy).toHaveBeenCalled()
        })
      })

      describe('removed config properties', function() {
        const cases = [
          ['up.network.config', 'badRTT'],
          ['up.network.config', 'badDownlink'],
          ['up.viewport.config', 'scrollSpeed'],
        ]

        for (let [label, key] of cases) {
          it(`warns when ${label}.${key} is set`, function() {
            const config = lookup(label)
            const warnSpy = up.migrate.warn.mock()
            config[key] = 123
            expect(u.sprintf(...warnSpy.calls.argsFor(0))).toBe(`Property ${label}.${key} has been removed without replacement`)
          })
        }
      })

      describe('renamed packages', function() {
        const cases = [
          ['bus', 'event'],
          ['dom', 'fragment'],
          ['feedback', 'status'],
          ['flow', 'fragment'],
          ['layout', 'viewport'],
          ['navigation', 'status'],
          ['proxy', 'network'],
          ['syntax', 'script'],
        ]

        for (let [oldName, newName] of cases) {
          it(`forwards up.${oldName} to up.${newName}`, function() {
            const warnSpy = up.migrate.warn.mock()
            expect(up[newName]).toEqual(jasmine.any(Object))
            expect(up[oldName]).toBe(up[newName])
            expect(warnSpy).toHaveBeenCalledWith(`up.${oldName} has been renamed to up.${newName}`)
          })
        }
      })

      describe('renamed events', function() {
        const cases = [
          ['up:app:booted', 'up:framework:booted'],
          ['up:history:push', 'up:location:changed'],
          ['up:history:pushed', 'up:location:changed'],
          ['up:history:restore', 'up:location:changed'],
          ['up:history:restored', 'up:location:changed'],
          ['up:history:replaced', 'up:location:changed'],
          ['up:modal:open', 'up:layer:open'],
          ['up:modal:opened', 'up:layer:opened'],
          ['up:modal:close', 'up:layer:dismiss'],
          ['up:modal:closed', 'up:layer:dismissed'],
          ['up:popup:open', 'up:layer:open'],
          ['up:popup:opened', 'up:layer:opened'],
          ['up:popup:close', 'up:layer:dismiss'],
          ['up:popup:closed', 'up:layer:dismissed'],
          ['up:proxy:load', 'up:request:load'],
          ['up:proxy:received', 'up:request:loaded'],
          ['up:proxy:loaded', 'up:request:loaded'],
          ['up:proxy:fatal', 'up:request:offline'],
          ['up:request:fatal', 'up:request:offline'],
          ['up:proxy:aborted', 'up:request:aborted'],
          ['up:proxy:slow', 'up:network:late'],
          ['up:proxy:recover', 'up:network:recover'],
          ['up:request:late', 'up:network:late'],
          ['up:request:recover', 'up:network:recover'],
        ]

        for (let [oldType, newType] of cases) {
          it(`calls an ${oldType} listener when ${newType} is emitted`, function() {
            const warnSpy = up.migrate.warn.mock()
            const element = fixture('.element')
            const listener = jasmine.createSpy('listener')
            up.on(element, oldType, listener)

            // Don't bubble to listeners on the document, which expect event properties.
            element.dispatchEvent(new Event(newType))

            expect(listener).toHaveBeenCalled()
            expect(warnSpy).toHaveBeenCalledWith(`Event ${oldType} has been renamed to ${newType}`)
          })
        }
      })

      describe('renamed attributes', function() {
        const cases = [
          // [old attribute, new attribute, element that matches the polyfill's scope]
          ['up-flavor', 'up-mode', 'a[href="/path"][up-follow]'],
          ['up-closable', 'up-dismissible', 'a[href="/path"][up-follow]'],
          ['up-dismissable', 'up-dismissible', 'a[href="/path"][up-follow]'],
          ['up-history-visible', 'up-history', 'a[href="/path"][up-follow]'],
          ['up-clear-cache', 'up-expire-cache', 'a[href="/path"][up-follow]'],
          ['up-bad-response-time', 'up-late-delay', 'a[href="/path"][up-follow]'],
          ['up-delay', 'up-preload-delay', 'a[href="/path"][up-preload]'],
          ['up-delay', 'up-watch-delay', 'form[up-autosubmit]'],
          ['up-delay', 'up-watch-delay', 'input[name="foo"][up-watch="nop()"]'],
          ['up-observe', 'up-watch', 'input[name="foo"]'],
          ['up-fieldset', 'up-form-group', 'fieldset'],
        ]

        for (let [oldAttr, newAttr, selector] of cases) {
          it(`renames [${oldAttr}] to [${newAttr}] on ${selector}`, function() {
            const warnSpy = up.migrate.warn.mock()
            const element = fixture(selector, { [oldAttr]: 'value' })
            up.hello(element)

            expect(element).toHaveAttribute(newAttr, 'value')
            expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('has been renamed'), oldAttr, newAttr, element)
          })
        }

        for (let oldAttr of ['up-width', 'up-height']) {
          it(`warns about the removed [${oldAttr}] on a link`, function() {
            const warnSpy = up.migrate.warn.mock()
            const link = fixture('a[href="/path"][up-follow]', { [oldAttr]: '300' })
            up.hello(link)

            expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('has been removed'), oldAttr, link, '[up-size] or [up-class]')
          })
        }
      })

      describe('deprecated functions', function() {
        // [old call, expected result]. We call the real function, not a spy, so we notice when it breaks in real use.
        const cases = [
          ['up.util.only()', () => up.util.only({ a: 1, b: 2 }, 'a'), { a: 1 }],
          ['up.util.except()', () => up.util.except({ a: 1, b: 2 }, 'a'), { b: 2 }],
          ['up.util.parseUrl()', () => up.util.parseUrl('/foo?bar').pathname, '/foo'],
          ['up.util.any()', () => up.util.any([1, 2], (x) => x > 1), true],
          ['up.util.all()', () => up.util.all([1, 2], (x) => x > 1), false],
          ['up.util.detect()', () => up.util.detect([1, 2, 3], (x) => x > 1), 2],
          ['up.util.select()', () => up.util.select([1, 2, 3], (x) => x > 1), [2, 3]],
          ['up.util.escapeHtml()', () => up.util.escapeHtml('<b>'), '&lt;b&gt;'],
          ['up.util.selectorForElement()', () => up.util.selectorForElement(fixture('#foo')), '#foo'],
          ['up.util.times()', () => { let count = 0; up.util.times(3, () => count++); return count }, 3],
          ['up.util.assign()', () => up.util.assign({ a: 1 }, { b: 2 }), { a: 1, b: 2 }],
          ['up.util.values()', () => up.util.values({ a: 1, b: 2 }), [1, 2]],
          ['up.element.first()', () => up.element.first('#foo')?.id, 'foo', () => fixture('#foo')],
          ['up.element.createFromHtml()', () => up.element.createFromHtml('<p id="foo"></p>').id, 'foo'],
          ['up.element.toSelector()', () => up.element.toSelector(fixture('#foo')), '#foo'],
          ['up.element.isDetached()', () => up.element.isDetached(document.createElement('div')), true],
          ['up.element.replace()', () => { let old = fixture('#old'); up.element.replace(old, e.createFromSelector('#new')); return document.querySelector('#fixtures').innerHTML }, '<div id="new"></div>'],
          ['up.fragment.first()', () => up.fragment.first('#foo')?.id, 'foo', () => fixture('#foo')],
          // up.first() is an alias for up.fragment.first() and prints the same warning.
          ['up.first()', () => up.first('#foo')?.id, 'foo', () => fixture('#foo'), 'up.fragment.first()'],
          ['up.viewport.closest()', () => up.viewport.closest(fixture('#foo')) === up.viewport.root, true],
          ['up.browser.isSupported()', () => up.browser.isSupported(), true],
          ['up.event.nobodyPrevents()', () => up.event.nobodyPrevents('custom:event'), true],
          ['up.motion.isEnabled()', () => up.motion.isEnabled() === up.motion.config.enabled, true],
          ['up.network.isIdle()', () => up.network.isIdle(), true],
          ['up.history.url()', () => up.history.url() === up.history.location, true],
          ['up.Response#isSuccess()', () => new up.Response({ status: 200 }).isSuccess(), true],
          ['up.Response#isError()', () => new up.Response({ status: 500 }).isError(), true],
          ['up.Response#getHeader()', () => new up.Response({ headers: { 'X-Foo': 'bar' } }).getHeader('X-Foo'), 'bar'],
          ['up.Layer#isOpen()', () => up.layer.root.isOpen(), true],
          ['up.Layer#isClosed()', () => up.layer.root.isClosed(), false],
          ['up.Layer#historyVisible', () => up.layer.root.historyVisible === up.layer.root.history, true],
        ]

        for (let [name, call, expected, setup, warningName = name] of cases) {
          it(`${name} still works`, function() {
            setup?.()
            const warnSpy = up.migrate.warn.mock()
            expect(call()).toEqual(expected)
            expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining(warningName.replace(/\(\)$/, '')))
          })
        }

        it('up.util.setTimer() still works', async function() {
          const warnSpy = up.migrate.warn.mock()
          const callback = jasmine.createSpy('callback')
          up.util.setTimer(0, callback)
          await wait(10)
          expect(callback).toHaveBeenCalled()
          expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('up.util.setTimer()'))
        })

        it('up.util.nextFrame() still works', async function() {
          const warnSpy = up.migrate.warn.mock()
          const callback = jasmine.createSpy('callback')
          up.util.nextFrame(callback)
          await wait(10)
          expect(callback).toHaveBeenCalled()
          expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('up.util.nextFrame()'))
        })

        for (let [name, clear] of [['up.cache.clear()', () => up.cache.clear()], ['up.proxy.clear()', () => up.network.clear()]]) {
          it(`${name} still expires the cache`, async function() {
            up.request({ url: '/path', cache: true })
            await wait()
            jasmine.respondWith('text')
            await wait()
            const warnSpy = up.migrate.warn.mock()

            clear()

            expect({ url: '/path' }).toBeExpired()
            expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining(name))
          })
        }
      })
    })

    describe('up.migrate.warn()', function() {

      it('prepends a deprecation prefix to the given message and prints it to the error log', function() {
        const spy = spyOn(up.log, 'error')
        up.migrate.warn("a legacy warning")
        expect(spy).toHaveBeenCalledWith('unpoly-migrate', 'a legacy warning')
      })

      it('only prints a given message once', function() {
        const spy = spyOn(up.log, 'error')
        up.migrate.warn("a very unique legacy warning")
        up.migrate.warn("a very unique legacy warning")
        expect(spy.calls.count()).toBe(1)
      })

      it('allows substitution', function() {
        const spy = spyOn(up.log, 'error')
        up.migrate.warn('%s is a substituted warning', 'foo')
        up.migrate.warn('%s is a substituted warning', 'bar')

        // Messages with different substitutions are not deduplicated
        expect(spy.calls.allArgs()).toEqual([
          ['unpoly-migrate', '%s is a substituted warning', 'foo'],
          ['unpoly-migrate', '%s is a substituted warning', 'bar'],
        ])
      })

      describe('log level', function() {
        it('logs errors by default, so test suites that fail on console errors find deprecations', function() {
          const warnSpy = spyOn(up.log, 'warn')
          const errorSpy = spyOn(up.log, 'error')
          up.migrate.warn("a legacy warning")
          expect(errorSpy).toHaveBeenCalledWith('unpoly-migrate', 'a legacy warning')
          expect(warnSpy).not.toHaveBeenCalled()
        })

        it('logs warnings with up.migrate.config.logLevel = "warn"', function() {
          up.migrate.config.logLevel = 'warn'
          const warnSpy = spyOn(up.log, 'warn')
          const errorSpy = spyOn(up.log, 'error')
          up.migrate.warn("a legacy warning")
          expect(warnSpy).toHaveBeenCalledWith('unpoly-migrate', 'a legacy warning')
          expect(errorSpy).not.toHaveBeenCalled()
        })

        it('does not log anything with up.migrate.config.logLevel = "none"', function() {
          up.migrate.config.logLevel = 'none'
          const warnSpy = spyOn(up.log, 'warn')
          const errorSpy = spyOn(up.log, 'error')
          up.migrate.warn("a legacy warning")
          expect(errorSpy).not.toHaveBeenCalled()
          expect(warnSpy).not.toHaveBeenCalled()
        })

      })
    })


  })
}
