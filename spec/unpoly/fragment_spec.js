const u = up.util
const e = up.element
const $ = jQuery

describe('up.fragment', function() {

  describe('JavaScript functions', function() {

    require('./fragment_lookup_spec')


    require('./fragment_render_spec')

    if (up.migrate.loaded) {
      describe('up.replace()', function() {
        it('delegates to up.navigate({ target, url }) (deprecated)', function() {
          const navigateSpy = up.fragment.navigate.mock()
          const deprecatedSpy = spyOn(up.migrate, 'deprecated')
          up.replace('target', 'url')
          expect(navigateSpy).toHaveBeenCalledWith({ target: 'target', url: 'url' })
          expect(deprecatedSpy).toHaveBeenCalled()
        })
      })
    }

    if (up.migrate.loaded) {
      describe('up.extract()', function() {
        it('delegates to up.navigate({ target, document }) (deprecated)', function() {
          const navigateSpy = up.fragment.navigate.mock()
          const deprecatedSpy = spyOn(up.migrate, 'deprecated')
          up.extract('target', 'document')
          expect(navigateSpy).toHaveBeenCalledWith({ target: 'target', document: 'document' })
          expect(deprecatedSpy).toHaveBeenCalled()
        })
      })
    }

    describe('up.navigate()', function() {
      it('delegates to up.render({ ...options, navigate: true })', function() {
        const renderSpy = up.fragment.render.mock()
        up.navigate({ url: 'url' })
        expect(renderSpy).toHaveBeenCalledWith({ url: 'url', navigate: true })
      })

      it("updates the layer's main target by default (since navigation sets { fallback: true })", async function() {
        up.fragment.config.mainTargets.unshift('.main-target')
        fixture('.main-target')

        up.navigate({ url: '/path2' })

        await wait()
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.main-target')
      })
    })

    describe('up.destroy()', function() {
      it('removes the element with the given selector', async function() {
        $fixture('.element')
        up.destroy('.element')
        await wait()

        expect('.element').not.toBeAttached()
      })

      it('has a sync effect', function() {
        fixture('.element')
        up.destroy('.element')
        expect('.element').not.toBeAttached()
      })

      it('runs an animation before removal with { animate } option', async function() {
        const $element = $fixture('.element')
        up.destroy($element, { animation: 'fade-out', duration: 200, easing: 'linear' })
        await wait()

        expect($element).toHaveOwnOpacity(1.0, 0.15)
        await wait(100)

        expect($element).toHaveOwnOpacity(0.5, 0.3)
        await wait(175)

        expect($element).toBeDetached()
      })

      it('calls destructors for custom elements', function() {
        const destructor = jasmine.createSpy('destructor')
        up.compiler('.element', (element) => destructor)
        helloFixture('.element')
        up.destroy('.element')
        expect(destructor).toHaveBeenCalled()
      })

      it('does not call destructors twice if up.destroy() is called twice on the same fragment', async function() {
        const destructor = jasmine.createSpy('destructor')
        up.compiler('.element', (element) => destructor)

        const element = fixture('.element')
        up.hello(element)

        up.destroy(element, { animation: 'fade-out', duration: 10 })
        up.destroy(element, { animation: 'fade-out', duration: 10 })
        await wait(150)

        expect(destructor.calls.count()).toBe(1)
      })

      it('calls destructors while the element is still attached', function() {
        const attachmentSpy = jasmine.createSpy('attachment spy')
        const compiler = (element) => () => attachmentSpy(element.isConnected)
        up.compiler('.element', compiler)

        const element = fixture('.element')
        up.hello(element)
        up.destroy(element)

        expect(attachmentSpy).toHaveBeenCalledWith(true)
      })

      it('calls destructors of descendants that will be detached with the element', function() {
        const destructor = jasmine.createSpy('destructor')
        const compiler = (element) => () => destructor()
        up.compiler('.element', compiler)

        const element = htmlFixture(`
          <div class="container">
            <div class="element">element</div>
          </div>
        `)
        up.hello(element)
        up.destroy(element)

        expect(destructor).toHaveBeenCalled()
      })

      it('marks the old element as [inert] before destructors', function(done) {
        const testElement = function(element) {
          expect(element).toHaveText('old text')
          expect(element).toMatchSelector('[inert]')
          done()
        }

        up.compiler('.container', (element) => () => testElement(element))

        helloFixture('.container', { text: 'old text' })

        up.destroy('.container')
      })

      it('immediately marks the old element as .up-destroying', function() {
        const container = fixture('.container')

        up.destroy('.container', { animation: 'fade-out', duration: 100 })

        expect(container).toMatchSelector('.up-destroying')
      })

      it('waits until an { animation } is done before calling destructors', async function() {
        const destructor = jasmine.createSpy('destructor')
        up.compiler('.container', (element) => () => destructor(element.innerText))
        const $container = $fixture('.container').text('old text')
        up.hello($container)

        up.destroy('.container', { animation: 'fade-out', duration: 100 })
        await wait(50)

        expect(destructor).not.toHaveBeenCalled()
        await wait(200)

        expect(destructor).toHaveBeenCalledWith('old text')
      })

      it('marks the element as .up-destroying while it is animating', async function() {
        const $element = $fixture('.element')
        up.destroy($element, { animation: 'fade-out', duration: 80, easing: 'linear' })
        await wait()

        expect($element).toHaveClass('up-destroying')
      })

      it('runs an { onFinished } callback after the element has been removed from the DOM', async function() {
        const $parent = $fixture('.parent')
        const $element = $parent.affix('.element')
        expect($element).toBeAttached()

        const onFinished = jasmine.createSpy('onFinished callback')

        up.destroy($element, { animation: 'fade-out', duration: 30, onFinished })
        await wait()

        expect($element).toBeAttached()
        expect(onFinished).not.toHaveBeenCalled()
        await wait(200)

        expect($element).toBeDetached()
        expect(onFinished).toHaveBeenCalled()
      })

      it('calls #sync() on all layers in the stack', async function() {
        makeLayers(2)
        await wait()

        spyOn(up.layer.stack[0], 'sync')
        spyOn(up.layer.stack[1], 'sync')

        const element = up.layer.stack[1].affix('.element')

        up.destroy(element)
        await wait()

        expect(up.layer.stack[0].sync).toHaveBeenCalled()
        expect(up.layer.stack[1].sync).toHaveBeenCalled()
      })

      it('does not crash and runs destructors when destroying a detached element (bugfix)', function() {
        const destructor = jasmine.createSpy('destructor')
        up.compiler('.element', (element) => destructor)
        const detachedElement = up.element.createFromSelector('.element')
        up.hello(detachedElement)
        up.destroy(detachedElement)
        expect(destructor).toHaveBeenCalled()
      })

      describe('emission of up:fragment:destroyed', function() {

        it('awaits an exit animation before emitting up:fragment:destroyed', async function() {
          const parent = fixture('.parent')
          const element = e.affix(parent, '.element')
          expect(element).toBeAttached()

          const listener = jasmine.createSpy('event listener')
          parent.addEventListener('up:fragment:destroyed', listener)

          up.destroy(element, { animation: 'fade-out', duration: 60 })
          await wait()

          expect(element).toMatchSelector('.up-destroying')
          expect(element).toBeAttached()
          expect(listener).not.toHaveBeenCalled()

          await wait(100)

          expect(element).toBeDetached()
          expect(listener).toHaveBeenCalled()
        })

        it('awaits an exit animation before emitting up:fragment:destroyed', async function() {
          const parent = fixture('.parent')
          const element = e.affix(parent, '.element')
          expect(element).toBeAttached()

          const listener = jasmine.createSpy('event listener')
          parent.addEventListener('up:fragment:destroyed', listener)

          up.destroy(element, { animation: 'fade-out', duration: 60 })
          await wait()

          expect(element).toMatchSelector('.up-destroying')
          expect(element).toBeAttached()
          expect(listener).not.toHaveBeenCalled()

          await wait(100)

          expect(element).toBeDetached()
          expect(listener).toHaveBeenCalled()
        })

      })

      describe('when a destructor crashes', function() {
        it('emits an error event but does not throw an exception', async function() {
          const destroyError = new Error('destructor error')
          const element = fixture('.element')
          up.destructor(element, function() { throw destroyError })

          await jasmine.expectGlobalError(destroyError, function() {
            const doDestroy = () => up.destroy(element)
            expect(doDestroy).not.toThrowError()
          })
        })

        it('removes the element', async function() {
          const destroyError = new Error('destructor error')
          const element = fixture('.element')
          up.destructor(element, function() { throw destroyError })

          await jasmine.expectGlobalError(destroyError, () => up.destroy(element))

          expect(element).toBeDetached()
        })

        it('removes the element after animation', async function() {
          const destroyError = new Error('destructor error')
          const element = fixture('.element')
          up.destructor(element, function() { throw destroyError })

          up.destroy(element, { animation: 'fade-out', duration: 50 })

          expect(element).not.toBeDetached()

          await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
            expect(globalErrorSpy).not.toHaveBeenCalled()
            await wait(150)

            expect(element).toBeDetached()
            expect(globalErrorSpy).toHaveBeenCalledWith(destroyError)
          })
        })
      })

      describe('pending requests', function() {
        it('aborts pending requests targeting the given element', async function() {
          const target = fixture('.target')
          const promise = up.render(target, { url: '/path' })

          expect(up.network.isBusy()).toBe(true)

          up.destroy(target)

          await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Aborted))
        })

        it('aborts pending requests targeting a descendant of the given element', async function() {
          const parent = fixture('.parent')
          const child = e.affix(parent, '.child')
          const promise = up.render(child, { url: '/path' })

          expect(up.network.isBusy()).toBe(true)

          up.destroy(parent)

          await expectAsync(promise).toBeRejectedWith(jasmine.any(up.Aborted))
        })

        it('does not abort pending requests targeting an ascendant of the given element', async function() {
          const parent = fixture('.parent')
          const child = e.affix(parent, '.child')
          const promise = up.render(parent, { url: '/path' })

          expect(up.network.isBusy()).toBe(true)

          up.destroy(child)

          await expectAsync(promise).toBePending()
        })
      })
    })

    describe('up.reload()', function() {

      it('reloads the given selector from the closest known source URL', async function() {
        const container = fixture('.container[up-source="/source"]')
        const element = e.affix(container, '.element', { text: 'old text' })

        up.reload('.element')
        await wait()

        expect(jasmine.lastRequest().url).toMatchURL('/source')
        jasmine.respondWith(`
          <div class="container">
            <div class="element">new text</div>
          </div>
        `)
        await wait()

        expect('.element').toHaveText('new text')
      })

      it('reloads the given element', async function() {
        const element = fixture('.element', { 'up-source': '/source', text: 'old text' })

        up.reload(element)
        await wait()

        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.element')
        expect(jasmine.lastRequest().url).toMatchURL('/source')
        jasmine.respondWithSelector('.element', { text: 'new text' })
        await wait()

        expect('.element').toHaveText('new text')
      })

      it('reloads a fragment from the URL from which it was received', async function() {
        fixture('.container')

        up.render('.container', { url: '/container-source' })
        await wait()

        jasmine.respondWith(`
          <div class='container'>
            <div class='target'>target text</div>
          </div>
        `)
        await wait()

        expect('.container').toHaveSelector('.target')
        expect('.target').toHaveText('target text')

        up.reload('.target')
        await wait()

        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')
        expect(jasmine.lastRequest().url).toMatchURL('/container-source')

        jasmine.respondWithSelector('.target', { text: 'reloaded target text' })
        await wait()

        expect('.target').toHaveText('reloaded target text')
      })

      it('throws a readable error when attempting to reloading a detached element', async function() {
        const element = fixture('.element', { 'up-source': '/source', text: 'old text' })
        element.remove() // detach from document

        await expectAsync(up.reload(element)).toBeRejectedWith(jasmine.anyError(/detached/))
      })

      if (up.migrate.loaded) {
        it('reloads the given jQuery collection', async function() {
          const element = fixture('.element', { 'up-source': '/source', text: 'old text' })

          up.reload($(element))
          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.element')
          expect(jasmine.lastRequest().url).toMatchURL('/source')
          jasmine.respondWithSelector('.element', { text: 'new text' })
          await wait()

          expect('.element').toHaveText('new text')
        })
      }

      describe('caching', function() {
        it('does not use a cached response', async function() {
          await jasmine.populateCache('/source', '<div class="element">cached text</div>')
          expect(jasmine.Ajax.requests.count()).toBe(1)
          const element = htmlFixture('<div class="element" up-source="/source">inserted text</div>')

          up.reload(element)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)
          jasmine.respondWith('<div class="element">fresh text</div>')
          await wait()

          expect('.element').toHaveText('fresh text')
        })

        it('restores an element from cache with { cache: true }', async function() {
          await jasmine.populateCache('/source', '<div class="element">cached text</div>')
          expect(jasmine.Ajax.requests.count()).toBe(1)
          const element = htmlFixture('<div class="element" up-source="/source">inserted text</div>')

          up.reload(element, { cache: true })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect('.element').toHaveText('cached text')
        })

        it('revalidates an element restored from an expired cache entry with { revalidate: "auto" }', async function() {
          await jasmine.populateCache('/source', '<div class="element">cached text</div>')
          expect(jasmine.Ajax.requests.count()).toBe(1)
          up.cache.expire()
          await wait()

          const element = htmlFixture('<div class="element" up-source="/source">inserted text</div>')

          up.reload(element, { cache: true, revalidate: 'auto' })
          await wait()

          expect('.element').toHaveText('cached text')
          expect(jasmine.Ajax.requests.count()).toBe(2)

          jasmine.respondWith('<div class="element">revalidated text</div>')
          await wait()

          expect('.element').toHaveText('revalidated text')
        })

      })

      it('does not reveal by default', async function() {
        const element = fixture('.element[up-source="/source"]', { text: 'old text' })

        const revealSpy = up.reveal.mock().and.returnValue(Promise.resolve())

        up.reload('.element')
        await wait()

        jasmine.respondWithSelector('.element', { text: 'new text' })
        await wait()

        expect('.element').toHaveText('new text')
        expect(revealSpy).not.toHaveBeenCalled()
      })

      it('keeps scroll positions of reloaded viewports', async function() {
        let html = (text) => `
          <div id="target" up-source="/source">
            <div id="viewport" up-viewport style="overflow-y: scroll; height: 100px;">
              <div id="content" style="height: 10000px;">
                ${text}
              </div>
            </div>
          </div>
        `

        htmlFixtureList(html('old content'))

        document.querySelector('#viewport').scrollTop = 433
        expect('#viewport').toBeScrolledTo(433)

        up.reload('#target')
        await wait()
        jasmine.respondWith(html('new content'))
        await wait()

        expect('#viewport').toHaveText('new content')
        expect('#viewport').toBeScrolledTo(433)
      })

      it('keeps focus if the focused element can be rediscovered', async function() {
        let html = (text) => `
          <div id="target" up-source="/source">
            <form>
              <input id="input" type="text">
            </form>
            <div id="content">
              ${text}
            </div>
          </div>
        `

        htmlFixtureList(html('old content'))

        document.querySelector('#input').focus()
        expect('#input').toBeFocused()

        up.reload('#target')
        await wait()
        jasmine.respondWith(html('new content'))
        await wait()

        expect('#content').toHaveText('new content')
        expect('#input').toBeFocused()
      })

      describe('last modification time', function() {

        it("sends an If-Modified-Since header with the fragment's timestamp so the server can render nothing if no fresher content exists", async function() {
          const element = fixture('.element[up-source="/source"][up-time="1445412480"]')

          up.reload(element)
          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/source')
          expect(jasmine.lastRequest().requestHeaders['If-Modified-Since']).toEqual('Wed, 21 Oct 2015 07:28:00 GMT')
        })

        it("sends no If-Modified-Since header if no timestamp is known for the fragment", async function() {
          const element = fixture('.element[up-source="/source"]')

          up.reload(element)
          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/source')
          expect(jasmine.lastRequest().requestHeaders['If-Modified-Since']).toBeUndefined()
        })

        if (up.migrate.loaded) {
          it("sends an X-Up-Reload-From-Time header with the fragment's timestamp so the server can render nothing if no fresher content exists", async function() {
            const element = fixture('.element[up-source="/source"][up-time="1608712106"]')

            up.reload(element)
            await wait()

            expect(jasmine.lastRequest().url).toMatchURL('/source')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Reload-From-Time']).toEqual('1608712106')
          })

          it("sends an X-Up-Reload-From-Time: 0 header if no timestamp is known for the fragment", async function() {
            const element = fixture('.element[up-source="/source"]')

            up.reload(element)
            await wait()

            expect(jasmine.lastRequest().url).toMatchURL('/source')
            expect(jasmine.lastRequest().requestHeaders['X-Up-Reload-From-Time']).toEqual('0')
          })
        }
      })

      describe('ETags', function() {

        it("sends an If-None-Match header with the fragment's timestamp so the server can render nothing if no fresher content exists", async function() {
          const element = fixture(".element[up-source='/source'][up-etag='\"abc\"']")

          up.reload(element)
          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/source')
          expect(jasmine.lastRequest().requestHeaders['If-None-Match']).toEqual('"abc"')
        })

        it("sends no If-None-Match header if no timestamp is known for the fragment", async function() {
          const element = fixture('.element[up-source="/source"]')

          up.reload(element)
          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/source')
          expect(jasmine.lastRequest().requestHeaders['If-None-Match']).toBeUndefined()
        })
      })

      describe('with { data } option', function() {
        it('lets the user forward data to compilers of the new element', async function() {
          const dataSpy = jasmine.createSpy('data spy')

          up.compiler('.element', function(element, data) {
            dataSpy(data)
            return element.addEventListener('click', () => up.reload(element, { data }))
          })

          const element = fixture('.element', { 'data-foo': 'a', 'up-source': '/source' })
          up.hello(element)

          expect(dataSpy.calls.count()).toBe(1)
          expect(dataSpy.calls.argsFor(0)[0].foo).toBe('a')

          Trigger.click(element)
          await wait()

          jasmine.respondWithSelector('.element', { 'data-foo': 'b', 'data-bar': 'c' })
          await wait()

          expect(dataSpy.calls.count()).toBe(2)
          expect(dataSpy.calls.argsFor(1)[0].foo).toBe('a')

          // Non-overridden props are still visible
          expect(dataSpy.calls.argsFor(1)[0].bar).toBe('c')
        })

        it('does not override data for secondary targets', async function() {
          const html = (prefix) => `
            <div id="foo">
              ${prefix} foo
            </div>  

            <div id="bar">
              ${prefix} bar
            </div>  
          `

          htmlFixtureList(html('old'))

          await up.render({ target: '#foo, #bar', document: html('new'), data: { fooKey: 'fooValue' } })

          expect('#foo').toHaveText('new foo')
          expect('#bar').toHaveText('new bar')

          expect(up.data('#foo')).toEqual({ fooKey: 'fooValue' })
          expect(up.data('#bar')).toEqual({ })
        })

        it('does not override data for hungry targets', async function() {
          const html = (prefix) => `
            <div id="foo">
              ${prefix} foo
            </div>  

            <div id="bar" up-hungry>
              ${prefix} bar
            </div>  
          `

          htmlFixtureList(html('old'))

          await up.render({ target: '#foo', document: html('new'), data: { fooKey: 'fooValue' } })

          expect('#foo').toHaveText('new foo')
          expect('#bar').toHaveText('new bar')

          expect(up.data('#foo')).toEqual({ fooKey: 'fooValue' })
          expect(up.data('#bar')).toEqual({ })
        })
      })

      describe('with { keepData: true } option', function() {
        it("compiles the new element with the old element's data", async function() {
          const dataSpy = jasmine.createSpy('data spy')

          up.compiler('.element', function(element, data) {
            dataSpy(data)
            return element.addEventListener('click', () => up.reload(element, { keepData: true }))
          })

          const element = fixture('.element', { 'data-foo': 'a', 'up-source': '/source' })
          up.hello(element)

          expect(dataSpy.calls.count()).toBe(1)
          expect(dataSpy.calls.argsFor(0)[0].foo).toBe('a')

          Trigger.click(element)
          await wait()

          jasmine.respondWithSelector('.element', { 'data-foo': 'b' })
          await wait()

          expect(dataSpy.calls.count()).toBe(2)
          expect(dataSpy.calls.argsFor(1)[0].foo).toBe('a')
        })
      })

      it("reloads the layer's main element if no selector is given", async function() {
        up.fragment.config.mainTargets = ['.element']

        fixture('.element[up-source="/source"]', { text: 'old text' })

        up.reload()
        await wait()

        expect(jasmine.lastRequest().url).toMatch(/\/source$/)
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')
        jasmine.respondWithSelector('.element', { content: 'new text' })
        await wait()

        expect('.element').toHaveText('new text')
      })

      describe('reloading multiple fragments', function() {

        it('reloads multiple fragments', async function() {
          const foo = fixture('#foo[up-source="/path"]', { text: 'old foo' })
          const bar = fixture('#bar[up-source="/path"]', { text: 'old bar' })

          up.reload('#foo, #bar')
          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/path')

          jasmine.respondWith(`
            <div id="foo">new foo</div>
            <div id="bar">new bar</div>
          `)
          await wait()

          expect('#foo').toHaveText('new foo')
          expect('#bar').toHaveText('new bar')
        })

        it('uses source URL, ETag and last modifiction time from the first matching fragment', async function() {
          const foo = fixture('#foo[up-source="/foo-source"][up-etag="foo-etag"][up-time="1704067200"]', { text: 'old foo' })
          const bar = fixture('#bar[up-source="/bar-source"][up-etag="bar-etag"][up-time="1735689600"]', { text: 'old bar' })

          up.reload('#foo, #bar')
          await wait()

          expect(jasmine.lastRequest().url).toMatchURL('/foo-source')
          expect(jasmine.lastRequest().requestHeaders['If-None-Match']).toMatchURL('foo-etag')
          expect(jasmine.lastRequest().requestHeaders['If-Modified-Since']).toMatchURL(new Date(1704067200 * 1000).toUTCString())
        })
      })
    })

    describe('up.fragment.source()', function() {

      it('returns the source the fragment was retrieved from', async function() {
        fixture('.target')
        up.render('.target', { url: '/path' })
        await wait()

        jasmine.respondWithSelector('.target')
        await wait()

        expect(up.fragment.source(e.get('.target'))).toMatchURL('/path')
      })

      it('returns the source of a parent fragment if the given fragment has no reloadable source', async function() {
        fixture('.target')
        up.render('.target', { url: '/outer' })
        await wait()

        jasmine.respondWith(`
          <div class="target">
            <div class="inner">
              inner
            </div>
          </div>
        `)
        await wait()

        up.render('.inner', { url: '/inner', method: 'post' })
        await wait()

        jasmine.respondWithSelector('.inner')
        await wait()

        expect(up.fragment.source(e.get('.inner'))).toMatchURL('/outer')
      })

      it('allows users to provide an alternate reloading URL with an [up-source] attribute', async function() {
        fixture('.outer')
        up.render('.outer', { url: '/outer' })
        await wait()

        jasmine.respondWithSelector('.outer .between[up-source="/between"] .inner')
        await wait()

        expect(up.fragment.source(e.get('.outer'))).toMatchURL('/outer')
        expect(up.fragment.source(e.get('.between'))).toMatchURL('/between')
        expect(up.fragment.source(e.get('.inner'))).toMatchURL('/between')
      })

      it('also accepts a CSS selector instead of an element (used e.g. by unpoly-site)', function() {
        fixture('.target[up-source="/my-source"]')
        expect(up.fragment.source('.target')).toMatchURL('/my-source')
      })

      it('already reflects the latest source when called from a compiler function', async function() {
        let sourceSpy = jasmine.createSpy('source spy')

        up.compiler('#two', function(element) {
          sourceSpy(up.fragment.source(element))
        })

        fixture('.element#one')

        up.render({ target: '.element', history: true, url: '/url-after-render' })
        await wait()

        jasmine.respondWithSelector('.element#two')
        await wait()

        expect(sourceSpy).toHaveBeenCalledWith('/url-after-render')
      })

    })

    describe('up.fragment.failKey', function() {

      it('returns a failVariant for the given object key', function() {
        const result = up.fragment.failKey('foo')
        expect(result).toEqual('failFoo')
      })

      it('returns undefined if the given key is already prefixed with "fail"', function() {
        const result = up.fragment.failKey('failFoo')
        expect(result).toBeUndefined()
      })
    })

    describe('up.fragment.successKey', function() {

      it('returns the unprefixed key for the given failVariant', function() {
        const result = up.fragment.successKey('failFoo')
        expect(result).toEqual('foo')
      })

      it('returns undefined if the given key is not prefixed with "fail"', function() {
        const result = up.fragment.successKey('foo')
        expect(result).toBeUndefined()
      })

      it('returns undefined for the key "fail"', function() {
        const result = up.fragment.successKey('fail')
        expect(result).toBeUndefined()
      })

      it('prioritizes the prefix "on", converting onFailFoo to onFoo', function() {
        const result = up.fragment.successKey('onFailFoo')
        expect(result).toEqual('onFoo')
      })
    })

    require('./fragment_targets_spec')

    describe('up.fragment.config.mainTargets', function() {

      it('gets up.layer.config.any.mainTargets', function() {
        up.layer.config.any.mainTargets = ['.my-special-main-target']
        expect(up.fragment.config.mainTargets).toEqual(['.my-special-main-target'])
      })

      it('sets up.layer.config.any.mainTargets', function() {
        up.fragment.config.mainTargets = ['.new-target']
        expect(up.layer.config.any.mainTargets).toEqual(['.new-target'])
      })
    })

    describe('up.context', function() {

      it('gets up.layer.current.context', function() {
        up.layer.current.context = { key: 'value' }
        expect(up.context).toEqual({ key: 'value' })
      })

      it('sets up.layer.current.context', function() {
        up.context = { key: 'newValue' }
        expect(up.layer.current.context).toEqual({ key: 'newValue' })
      })
    })

    describe('up.fragment.time', function() {

      it('returns an [up-time] timestamp of the given element', function() {
        const element = fixture('.element[up-time="1445412480"]')
        expect(up.fragment.time(element)).toEqual(new Date('Wed, 21 Oct 2015 07:28:00 GMT'))
      })

      it('returns an [up-time] timestamp of an ancestor', function() {
        const parent = fixture('.parent[up-time="1445412480"]')
        const element = e.affix(parent, '.element')
        expect(up.fragment.time(element)).toEqual(new Date('Wed, 21 Oct 2015 07:28:00 GMT'))
      })

      it("returns undefined and ignores ancestor's [up-time] if the element itself has [up-time=false], indicating that the response had no Last-Modified header", function() {
        const parent = fixture('.parent[up-time="1445412480"]')
        const element = e.affix(parent, '.element[up-time=false]')
        expect(up.fragment.time(element)).toBeUndefined()
      })

      it("returns undefined if there is no [up-time] value in the element's ancestry", function() {
        const parent = fixture('.parent')
        const element = e.affix(parent, '.element')
        expect(up.fragment.time(element)).toBeUndefined()
      })

      it('returns an [up-time] value seriaized in RFC 1123 format', function() {
        const element = fixture('.element[up-source="/source"][up-time="Wed, 21 Oct 2015 07:28:00 GMT"]')
        expect(up.fragment.time(element)).toEqual(new Date('Wed, 21 Oct 2015 07:28:00 GMT'))
      })
    })

    describe('up.fragment.etag', function() {

      it('returns the [up-etag] value of the given element', function() {
        const element = fixture(".element[up-etag='\"abc\"']")
        expect(up.fragment.etag(element)).toEqual('"abc"')
      })

      it('returns the [up-etag] value of an ancestor', function() {
        const parent = fixture(".parent[up-etag='\"abc\"']")
        const element = e.affix(parent, '.element')
        expect(up.fragment.etag(element)).toEqual('"abc"')
      })

      it("returns undefined if there is no [up-etag] value in the element's ancestry", function() {
        const parent = fixture(".parent")
        const element = e.affix(parent, '.element')
        expect(up.fragment.etag(element)).toBeUndefined()
      })

      it("returns undefined and ignores ancestor's [up-etag] if the element itself has [up-time=etag], indicating that the response had no ETag header", function() {
        const parent = fixture(".parent[up-etag='\"abc\"']")
        const element = e.affix(parent, '.element[up-etag=false]')
        expect(up.fragment.etag(element)).toBeUndefined()
      })
    })

    describe('up.fragment.insertTemp()', function() {

      it('inserts a new element relative to the given reference element', function() {
        const reference = fixture('#reference')
        const newElement = document.createElement('div')
        up.fragment.insertTemp(reference, newElement)

        expect(reference.children[0]).toBe(newElement)
      })

      it('allows to choose a different position relative to the reference element', function() {
        const reference = fixture('#reference')
        const newElement = document.createElement('div')
        up.fragment.insertTemp(reference, 'beforebegin', newElement)

        expect(reference.previousElementSibling).toBe(newElement)
      })

      it('compiles the given element', function() {
        const reference = fixture('#reference')
        const compilerFunction = jasmine.createSpy('compiler function')
        up.compiler('my-element', compilerFunction)
        const newElement = document.createElement('my-element')

        up.fragment.insertTemp(reference, newElement)

        expect(compilerFunction).toHaveBeenCalledWith(newElement, jasmine.anything(), jasmine.anything())
      })

      it('parses a string of HTML', function() {
        const reference = fixture('#reference')
        const newElementHTML = '<my-element></my-element>'
        up.fragment.insertTemp(reference, newElementHTML)

        expect(reference.children[0]).toBeElement()
        expect(reference.children[0]).toMatchSelector('my-element')
      })

      it('looks up a CSS selector matching a <template> to clone', function() {
        const template = htmlFixture(`
          <template id="my-template">
            <div id="my-element">
              element content
            </div>
          </template>
        `)

        const compilerFunction = jasmine.createSpy('compiler function')
        up.compiler('#my-element', compilerFunction)

        const reference = fixture('#reference')

        up.fragment.insertTemp(reference, '#my-template')
        expect(reference.children.length).toBe(1)
        expect(reference.children[0]).toMatchSelector('#my-element')
        expect(reference.children[0]).toHaveText('element content')

        // Test that the template content was cloned, not moved
        expect(reference.children[0]).not.toBe(template.content.children[0])

        // Test that the cloned element was compiled
        expect(compilerFunction).toHaveBeenCalled()
        expect(compilerFunction.calls.mostRecent().args[0]).toBe(reference.children[0])
      })

      it('inserts a NodeList from mixed Element and Text nodes', function() {
        let givenNodes = up.element.createNodesFromHTML('foo <b>bar</b> baz')
        expect(givenNodes.length).toBe(3)
        // Make a copy because it's a live list and we're going to compare it below
        givenNodes = u.copy(givenNodes)

        const reference = fixture('#reference')

        up.fragment.insertTemp(reference, givenNodes)

        expect(reference).toHaveText('foo bar baz')

        // The given nodes are now contained in reference, albeit in an <up-wrapper>
        expect(reference).toContain(givenNodes[0])
        expect(reference).toContain(givenNodes[1])
        expect(reference).toContain(givenNodes[2])
      })

      describe('returned undo function', function() {

        it('detaches the element', function() {
          const reference = fixture('#reference')
          const newElement = document.createElement('div')
          const undo = up.fragment.insertTemp(reference, newElement)

          expect(newElement).toBeAttached()

          undo()

          expect(newElement).toBeDetached()
        })

        it('calls destructors on the element', function() {
          const reference = fixture('#reference')
          const destructorFunction = jasmine.createSpy('destructor function')
          up.compiler('my-element', (element) => destructorFunction)
          const newElement = document.createElement('my-element')
          const undo = up.fragment.insertTemp(reference, newElement)

          expect(destructorFunction).not.toHaveBeenCalled()

          undo()

          expect(destructorFunction).toHaveBeenCalledWith(newElement)
        })
      })

      describe('with a previously attached element', function() {

        it('moves the element to the temporary position', function() {
          const reference = fixture('#reference')
          const newElement = fixture('my-element')

          up.fragment.insertTemp(reference, newElement)

          expect(newElement.parentElement).toBe(reference)
        })

        it('does not run compilers', function() {
          const reference = fixture('#reference')
          const compilerFunction = jasmine.createSpy('compiler function')
          up.compiler('my-element', compilerFunction)
          const newElement = fixture('my-element')

          up.fragment.insertTemp(reference, newElement)

          expect(compilerFunction).not.toHaveBeenCalled()
        })

        describe('returned undo function', function() {

          it('does not run destructors', function() {
            const reference = fixture('#reference')
            const destructorFunction = jasmine.createSpy('destructor function')
            const compilerFunction = jasmine.createSpy('compiler function').and.returnValue(destructorFunction)
            up.compiler('my-element', compilerFunction)
            const newElement = fixture('my-element')

            const undo = up.fragment.insertTemp(reference, newElement)
            expect(compilerFunction).not.toHaveBeenCalled()
            expect(destructorFunction).not.toHaveBeenCalled()

            undo()
            expect(compilerFunction).not.toHaveBeenCalled()
            expect(destructorFunction).not.toHaveBeenCalled()
          })

          it('moves it back to its original precision as an only child', function() {
            const reference = fixture('#reference')
            const oldContainer = fixture('#container')
            const tempElement = e.affix(oldContainer, '#movee')

            const undo = up.fragment.insertTemp(reference, tempElement)
            expect(tempElement.parentElement).toBe(reference)

            undo()

            expect(tempElement.parentElement).toBe(oldContainer)
          })

          it('moves it back to its original precision when it has a next sibling', function() {
            const reference = fixture('#reference')
            const oldContainer = fixture('#container')
            const tempElement = e.affix(oldContainer, '#movee')
            const oldNextSibling = e.affix(oldContainer, '#sibling')

            const undo = up.fragment.insertTemp(reference, tempElement)

            expect(tempElement.parentElement).toBe(reference)

            undo()

            expect(tempElement.parentElement).toBe(oldContainer)
            expect(tempElement.nextElementSibling).toBe(oldNextSibling)
          })

          it('moves it back to its original precision when it has a previous sibling', function() {
            const reference = fixture('#reference')
            const oldContainer = fixture('#container')
            const oldPreviousSibling = e.affix(oldContainer, '#sibling')
            const tempElement = e.affix(oldContainer, '#movee')

            const undo = up.fragment.insertTemp(reference, tempElement)

            expect(tempElement.parentElement).toBe(reference)

            undo()

            expect(tempElement.parentElement).toBe(oldContainer)
            expect(tempElement.previousElementSibling).toBe(oldPreviousSibling)
          })
        })
      })
    })

    describe('up.fragment.abort()', function() {

      beforeEach(function(done) {
        const layerHTML = `
          <div class='parent' id='parent0'>
            <div class='child' id='parent0-child'></div>
          </div>
          <div class='parent' id='parent1'>
            <div class='child' id='parent1-child'></div>
          </div>
        `

        this.layers = makeLayers([
          { content: layerHTML },
          { content: layerHTML },
        ])

        this.layer0Parent0ChildRequest = up.request('/path/a', { layer: this.layers[0], target: '#parent0-child' })
        this.layer0Parent1ChildRequest = up.request('/path/b', { layer: this.layers[0], target: '#parent1-child' })
        this.layer1Parent0ChildRequest = up.request('/path/c', { layer: this.layers[1], target: '#parent0-child' })
        this.layer1Parent1ChildRequest = up.request('/path/d', { layer: this.layers[1], target: '#parent1-child' })

        u.task(done)
      })

      describe('without an argument', function() {

        it('aborts requests for the current layer', function() {
          up.fragment.abort()

          expect(this.layer0Parent0ChildRequest.state).toBe('loading')
          expect(this.layer0Parent1ChildRequest.state).toBe('loading')
          expect(this.layer1Parent0ChildRequest.state).toBe('aborted')
          expect(this.layer1Parent1ChildRequest.state).toBe('aborted')
        })

        it("also aborts requests outside the layer's main element", async function() {
          e.affix(up.layer.element, '#outside-main')
          const outsideRequest = up.request('/path/e', { layer: up.layer.element, target: '#outside-main' })

          await wait()

          up.fragment.abort()

          expect(outsideRequest.state).toBe('aborted')
        })

        describe('with { layer } option', function() {
          it('aborts requests on the given layer', function() {
            up.fragment.abort({ layer: 'root' })

            expect(this.layer0Parent0ChildRequest.state).toBe('aborted')
            expect(this.layer0Parent1ChildRequest.state).toBe('aborted')
            expect(this.layer1Parent0ChildRequest.state).toBe('loading')
            expect(this.layer1Parent1ChildRequest.state).toBe('loading')
          })
        })

        describe('with { layer: "any" }', function() {
          it('aborts requests on all layers', function() {
            up.fragment.abort({ layer: 'any' })

            expect(this.layer0Parent0ChildRequest.state).toBe('aborted')
            expect(this.layer0Parent1ChildRequest.state).toBe('aborted')
            expect(this.layer1Parent0ChildRequest.state).toBe('aborted')
            expect(this.layer1Parent1ChildRequest.state).toBe('aborted')
          })
        })
      })

      describe('with an element', function() {
        it("aborts requests targeting given element's subtree", function() {
          const layer0Parent0 = up.fragment.get('#parent0', { layer: 0 })

          up.fragment.abort(layer0Parent0)

          expect(this.layer0Parent0ChildRequest.state).toBe('aborted')
          expect(this.layer0Parent1ChildRequest.state).toBe('loading')
          expect(this.layer1Parent0ChildRequest.state).toBe('loading')
          expect(this.layer1Parent1ChildRequest.state).toBe('loading')
        })
      })

      describe('with a list of elements', function() {
        it("aborts requests targeting any of the given elements' subtrees", function() {
          const layer0Parent0 = up.fragment.get('#parent0', { layer: 0 })
          const layer0Parent1 = up.fragment.get('#parent1', { layer: 0 })

          up.fragment.abort([layer0Parent0, layer0Parent1])

          expect(this.layer0Parent0ChildRequest.state).toBe('aborted')
          expect(this.layer0Parent1ChildRequest.state).toBe('aborted')
          expect(this.layer1Parent0ChildRequest.state).toBe('loading')
          expect(this.layer1Parent1ChildRequest.state).toBe('loading')
        })
      })

      describe('with a selector', function() {

        it("matches the selector in the current layer and aborts requests within that subtree", function() {
          up.fragment.abort('.parent')

          expect(this.layer0Parent0ChildRequest.state).toBe('loading')
          expect(this.layer0Parent1ChildRequest.state).toBe('loading')
          expect(this.layer1Parent0ChildRequest.state).toBe('aborted')
          expect(this.layer1Parent1ChildRequest.state).toBe('aborted')
        })

        describe('with { layer } option', function() {
          it('resolves the selector on another layer', function() {
            up.fragment.abort('.parent', { layer: 'root' })

            expect(this.layer0Parent0ChildRequest.state).toBe('aborted')
            expect(this.layer0Parent1ChildRequest.state).toBe('aborted')
            expect(this.layer1Parent0ChildRequest.state).toBe('loading')
            expect(this.layer1Parent1ChildRequest.state).toBe('loading')
          })
        })
      })

      describe('with { reason } option', function() {
        it('aborts the request with the given reason', async function() {
          up.fragment.abort('#parent0', { reason: 'Given reason' })

          await expectAsync(this.layer1Parent0ChildRequest).toBeRejectedWith(jasmine.anyError(/Given reason/))
        })
      })
    })

    describe('up.fragment.onAborted()', function() {

      it("runs the callback when the fragment is aborted", function() {
        const fragment = fixture('.fragment')
        const callback = jasmine.createSpy('aborted callback')
        up.fragment.onAborted(fragment, callback)
        expect(callback).not.toHaveBeenCalled()

        up.fragment.abort(fragment)

        expect(callback).toHaveBeenCalled()
      })

      it("runs the callback when the fragment's ancestor is aborted", function() {
        const ancestor = fixture('.ancestor')
        const fragment = e.affix(ancestor, '.fragment')
        const callback = jasmine.createSpy('aborted callback')
        up.fragment.onAborted(fragment, callback)
        expect(callback).not.toHaveBeenCalled()

        up.fragment.abort(ancestor)

        expect(callback).toHaveBeenCalled()
      })

      it("does not run the callback when the fragment's sibling is aborted", function() {
        const fragment = fixture('.fragment')
        const sibling = fixture('.sibling')
        const callback = jasmine.createSpy('aborted callback')
        up.fragment.onAborted(fragment, callback)
        expect(callback).not.toHaveBeenCalled()

        up.fragment.abort(sibling)

        expect(callback).not.toHaveBeenCalled()
      })

      it('returns a callback that stops the event listener', function() {
        const fragment = fixture('.fragment')
        const callback = jasmine.createSpy('aborted callback')
        const unsubscribe = up.fragment.onAborted(fragment, callback)

        unsubscribe()
        up.fragment.abort(fragment)

        expect(callback).not.toHaveBeenCalled()
      })

      it("does not run the callback when the fragment's descendant is aborted", function() {
        const fragment = fixture('.fragment')
        const descendant = e.affix(fragment, '.descendant')
        const callback = jasmine.createSpy('aborted callback')
        up.fragment.onAborted(fragment, callback)
        expect(callback).not.toHaveBeenCalled()

        up.fragment.abort(descendant)

        expect(callback).not.toHaveBeenCalled()
      })
    })

    describe('up.fragment.provideNodes()', function() {

      describe('with a string of HTML', function() {

        it('parses a HTML fragment and returns a list containing its root Element', function() {
          const nodes = up.fragment.provideNodes('<div>root</div>')

          expect(nodes).toHaveLength(1)
          expect(nodes[0]).toBeElement()
          expect(nodes[0].outerHTML).toBe('<div>root</div>')
        })

        it('parses a Text node without a containing Element', function() {
          const nodes = up.fragment.provideNodes('foo')

          expect(nodes).toHaveLength(1)
          expect(nodes[0]).toBeTextNode('foo')
        })

        it('parses multiple HTML elements without a containing root element', function() {
          const nodes = up.fragment.provideNodes("<div>sibling1</div><div>sibling2</div>")

          expect(nodes).toHaveLength(2)
          expect(nodes[0].outerHTML).toBe('<div>sibling1</div>')
          expect(nodes[1].outerHTML).toBe('<div>sibling2</div>')
        })

        it('parses a mix of Element nodes and Text nodes without a containing root element', function() {
          const nodes = up.fragment.provideNodes("foo<b>bar</b>baz")
          expect(nodes).toHaveLength(3)

          expect(nodes[0]).toBeTextNode('foo')
          expect(nodes[1].outerHTML).toBe('<b>bar</b>')
          expect(nodes[2]).toBeTextNode('baz')
        })
      })

      describe('with a non-template element', function() {
        it('returns an list of the given element without making a copy, so users can temporarily move an element into an overlay', function() {
          const element = document.createElement('div')
          const nodes = up.fragment.provideNodes(element)

          expect(nodes).toHaveLength(1)
          expect(nodes[0]).toBe(element)
        })
      })

      describe('with a template element', function() {

        it('returns a copy of the template content', function() {
          const template = up.element.createFromHTML(`
            <template id="my-template">
              foo<b>bar</b>baz
            </template>
          `)
          const nodes = up.fragment.provideNodes(template)

          expect(nodes[0]).toBeTextNode('foo')
          expect(nodes[1].outerHTML).toBe('<b>bar</b>')
          expect(nodes[2]).toBeTextNode('baz')

          // Make sure we made a copy and did not re-attach existing nodes
          expect(nodes[0]).not.toBe(template.content.childNodes[0])
          expect(nodes[1]).not.toBe(template.content.childNodes[1])
          expect(nodes[2]).not.toBe(template.content.childNodes[2])
        })

        it('allows to register a template engine with up:template:clone', function() {
          const template = htmlFixture(`
            <template id="my-template" type='text/minimustache'>
              Hello, <b>{{name}}</b>!
            </template>
          `)

          const templateHandler = jasmine.createSpy('up:template:clone').and.callFake(function(event) {
            let html = event.target.innerHTML
            html = html.replace(/{{(\w+)}}/g, (_match, variable) => event.data[variable])
            event.nodes = up.element.createNodesFromHTML(html)
          })

          up.on('up:template:clone', 'template[type="text/minimustache"]', templateHandler)

          const nodes = up.template.clone('#my-template', { name: "Alice" })
          expect(templateHandler).toHaveBeenCalledWith(jasmine.objectContaining({ target: template, data: { name: "Alice" } }), template, jasmine.anything())

          expect(nodes[0]).toBeTextNode('Hello, ')
          expect(nodes[1].outerHTML).toBe('<b>Alice</b>')
          expect(nodes[2]).toBeTextNode('!')
        })
      })

      describe('with a script element', function() {

        it('returns an list of the given element without making a copy', function() {
          const element = up.element.createFromSelector('script[type="text/javascript"]')
          const nodes = up.fragment.provideNodes(element)

          expect(nodes).toHaveLength(1)
          expect(nodes[0]).toBe(element)
        })

        it('clones a script that does not contain JavaScript, considerung it a custom template', function() {
          const template = htmlFixture(`
            <script id="my-template" type='text/minimustache'>
              Hello, <b>{{name}}</b>!
            </script>
          `)

          const templateHandler = jasmine.createSpy('up:template:clone').and.callFake(function(event) {
            let html = event.target.innerHTML
            html = html.replace(/{{(\w+)}}/g, (_match, variable) => event.data[variable])
            event.nodes = up.element.createNodesFromHTML(html)
          })

          up.on('up:template:clone', 'script[type="text/minimustache"]', templateHandler)

          const nodes = up.fragment.provideNodes('#my-template { name: "Alice" }')

          expect(templateHandler).toHaveBeenCalledWith(jasmine.objectContaining({ target: template, data: { name: "Alice" } }), jasmine.anything(), jasmine.anything())
          expect(nodes[0]).toBeTextNode('Hello, ')
          expect(nodes[1].outerHTML).toBe('<b>Alice</b>')
          expect(nodes[2]).toBeTextNode('!')
        })
      })

      describe('with a selector string', function() {

        it('returns a list containing the first matching element', function() {
          const element1 = fixture('.my-element')
          const element2 = fixture('.my-element')
          const nodes = up.fragment.provideNodes('.my-element')

          expect(nodes).toEqual([element1])
        })

        it('looks up a selector in the given { origin } before looking at other layers', function() {
          const [layer0, layer1, layer2] = makeLayers(3)
          // Elements in an overlay are removed when the overlay closes, but layer0 is
          // the root layer. Register its element so it does not survive into later specs.
          const layer0Match = registerFixture(layer0.affix('.match#layer0-element'))
          const layer1Match = layer1.affix('.match#layer1-element')

          expect(up.fragment.provideNodes('.match', { origin: layer0.element })).toEqual([layer0Match])
          expect(up.fragment.provideNodes('.match', { origin: layer1.element })).toEqual([layer1Match])
          expect(up.fragment.provideNodes('.match', { origin: layer2.element })).toEqual([layer1Match])
        })

        it('throws an error if the selector cannot be matched', function() {
          const provide = () => up.fragment.provideNodes('#my-element')
          expect(provide).toThrowError('Cannot find template "#my-element"')
        })

        it('clones a matching <template>', function() {
          const template = htmlFixture(`
            <template id="my-template">
              foo<b>bar</b>baz
            </template>
          `)
          const nodes = up.fragment.provideNodes('#my-template')

          expect(nodes[0]).toBeTextNode('foo')
          expect(nodes[1].outerHTML).toBe('<b>bar</b>')
        })
      })

      describe('with a list of elements', function() {
        it('returns that list', function() {
          const list = [document.head, document.body]
          const nodes = up.fragment.provideNodes(list)
          expect(nodes).toEqual([document.head, document.body])
        })
      })

      describe('with a Document', function() {
        it('returns that Document', function() {
          const nodes = up.fragment.provideNodes(document)
          expect(nodes).toEqual([document])
        })
      })
    })

    describe('up.template.clone()', function() {

      it('clones the given <template> Element', function() {
        const template = htmlFixture(`
          <template id="my-template">
            foo<b>bar</b>baz
          </template>
        `)
        const nodes = up.template.clone(template)

        expect(nodes[0]).toBeTextNode('foo')
        expect(nodes[1].outerHTML).toBe('<b>bar</b>')
        expect(nodes[2]).toBeTextNode('baz')

        // Make sure we made a copy and did not re-attach existing nodes
        expect(nodes[0]).not.toBe(template.content.childNodes[0])
        expect(nodes[1]).not.toBe(template.content.childNodes[1])
        expect(nodes[2]).not.toBe(template.content.childNodes[2])
      })

      it('looks up a template by selector', function() {
        const template = htmlFixture(`
          <template id="my-template">
            foo<b>bar</b>baz
          </template>
        `)
        const nodes = up.template.clone('#my-template')

        expect(nodes[0]).toBeTextNode('foo')
        expect(nodes[1].outerHTML).toBe('<b>bar</b>')
        expect(nodes[2]).toBeTextNode('baz')
      })

      it('throws an error if the a template selector cannot be matched', function() {
        const doUse = () => up.template.clone('#my-template')
        expect(doUse).toThrowError(/Template not found/i)
      })

      it('allows to register a template engine with up:template:clone', function() {
        const template = htmlFixture(`
          <template id="my-template" type='text/minimustache'>
            Hello, <b>{{name}}</b>!
          </template>
        `)

        const templateHandler = jasmine.createSpy('up:template:clone').and.callFake(function(event) {
          let html = event.target.innerHTML
          html = html.replace(/{{(\w+)}}/g, (_match, variable) => event.data[variable])
          event.nodes = up.element.createNodesFromHTML(html)
        })

        up.on('up:template:clone', 'template[type="text/minimustache"]', templateHandler)

        const nodes = up.template.clone('#my-template', { name: "Alice" })
        expect(templateHandler).toHaveBeenCalledWith(jasmine.objectContaining({ target: template, data: { name: "Alice" } }), template, jasmine.anything())

        expect(nodes[0]).toBeTextNode('Hello, ')
        expect(nodes[1].outerHTML).toBe('<b>Alice</b>')
        expect(nodes[2]).toBeTextNode('!')
      })

      it('compiles an element cloned from a <template> with the second data argument', async function() {
        const compilerFn = jasmine.createSpy('compiler fn')
        up.compiler('#target', compilerFn)

        const template = htmlFixture(`
          <template id="target-template">
            <div id="target">
              target from template
            </div>
          </template>
        `)

        const target = htmlFixture(`
          <div id="target">
            old target
          </div>
        `)

        expect(compilerFn).not.toHaveBeenCalled()

        const nodes = up.template.clone('#target-template', { foo: 1, bar: 2 })
        up.render({ fragment: nodes })

        await wait()

        expect('#target').toHaveText('target from template')
        expect(compilerFn).toHaveBeenCalled()
        expect(compilerFn.calls.mostRecent().args[0]).toMatchSelector('#target')
        expect(compilerFn.calls.mostRecent().args[1]).toEqual({ foo: 1, bar: 2 })
      })
    })

    describe('up.fragment.defaultNormalizeKeepHTML()', function() {

      for (let attr of ['nonce', 'up-etag', 'up-time', 'up-source', 'up-on-rendered', 'up-watch', 'up-on-accepted']) {

        it(`removes a [${attr}] attribute from the root element`, function() {
          let input = `<div ${attr}="value"></div>`
          let output = up.fragment.defaultNormalizeKeepHTML(input)
          expect(output).toBe('<div></div>')
        })

        it(`removes a [${attr}] attribute but leaves other attributes`, function() {
          let input = `<div data-x="x" ${attr}="value" data-y="y"></div>`
          let output = up.fragment.defaultNormalizeKeepHTML(input)
          expect(output).toBe('<div data-x="x" data-y="y"></div>')
        })

        it(`removes multiple [${attr}] attributes in descendants`, function() {
          let input = `<div><span ${attr}="value"></span><span ${attr}="value"></span></div>`
          let output = up.fragment.defaultNormalizeKeepHTML(input)
          expect(output).toBe('<div><span></span><span></span></div>')
        })

      }

      it('removes multiple attributes from the same tag', function() {
        let input = `<a id="keepable" href="/path" up-keep="same-html" up-on-rendered="nonce-page-secret foo()" data-x="x" up-on-finished="nonce-page-secret bar()" data-y="y">text</a>`
        let output = up.fragment.defaultNormalizeKeepHTML(input)
        expect(output).toBe(`<a id="keepable" href="/path" up-keep="same-html" data-x="x" data-y="y">text</a>`)
      })

    })

  })

  describe('unobtrusive behavior', function() {

    require('./fragment_keep_spec')

  })

})
