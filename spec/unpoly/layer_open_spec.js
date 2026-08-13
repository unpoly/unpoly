const u = up.util

extendDescribe('up.layer', function() {

  extendDescribe('JavaScript functions', function() {

    describe('up.layer.open()', function() {

      it('resolves to an up.Layer instance', async function() {
        const value = await up.layer.open()
        expect(value).toEqual(jasmine.any(up.Layer))
      })

      it('opens an empty overlay if neither { target, url, document, fragment, content } is given', async function() {
        await up.layer.open()

        expect(up.layer.count).toBe(2)

        const element = document.querySelector('up-modal up-modal-content')
        expect(element).toBeGiven()
        expect(element.innerText).toBeBlank()
      })

      it('manipulates the stack synchronously', function() {
        expect(up.layer.count).toBe(1)

        up.layer.open({ target: '.element', content: '' })

        expect(up.layer.count).toBe(2)
        expect(up.layer.current.isOverlay()).toBe(true)
      })

      describe('if there are existing overlays over the { baseLayer }', function() {

        it('dismisses existing overlays over the { baseLayer }', async function() {
          const [root, overlay1, overlay2] = makeLayers(3)
          await wait()

          up.layer.open({ baseLayer: overlay1 })
          await wait()

          expect(up.layer.count).toBe(3)

          expect(up.layer.get(0)).toBe(root)
          expect(up.layer.get(1)).toBe(overlay1)
          expect(up.layer.get(2)).not.toBe(overlay2)
          expect(overlay2).not.toBeAlive()
        })

        it('accepts (not dismisses) overlaying layers with { peel: "accept" }', async function() {
          const [root, overlay1, overlay2] = makeLayers(3)
          await wait()

          const acceptListener = jasmine.createSpy('up:layer:accept listener')
          up.on('up:layer:accept', acceptListener)
          const dismissListener = jasmine.createSpy('up:layer:dismiss listener')
          up.on('up:layer:dismiss', dismissListener)

          up.layer.open({ baseLayer: overlay1, peel: 'accept' })
          await wait()

          expect(up.layer.count).toBe(3)

          expect(up.layer.get(0)).toBe(root)
          expect(up.layer.get(1)).toBe(overlay1)
          expect(up.layer.get(2)).not.toBe(overlay2)
          expect(overlay2).not.toBeAlive()

          expect(dismissListener).not.toHaveBeenCalled()
          expect(acceptListener).toHaveBeenCalled()
        })

        it('dismisses existing overlays over the { baseLayer }, ignoring a { peel: false } option', async function() {
          const [root, overlay1, overlay2] = makeLayers(3)
          await wait()

          up.layer.open({ baseLayer: overlay1, peel: false })
          await wait()

          expect(up.layer.count).toBe(3)

          expect(up.layer.get(0)).toBe(root)
          expect(up.layer.get(1)).toBe(overlay1)
          expect(up.layer.get(2)).not.toBe(overlay2)
          expect(overlay2).not.toBeAlive()
        })

        it('does not allow up:layer:dismiss listeners to prevent the peeling', async function() {
          const [root, overlay1, overlay2] = makeLayers(3)
          await wait()

          const dismissListener = jasmine.createSpy('up:layer:dismiss listener').and.callFake((event) => event.preventDefault())
          up.on('up:layer:dismiss', dismissListener)

          up.layer.open({ baseLayer: overlay1 })
          await wait()

          expect(up.layer.count).toBe(3)

          expect(up.layer.get(0)).toBe(root)
          expect(up.layer.get(1)).toBe(overlay1)
          expect(up.layer.get(2)).not.toBe(overlay2)
          expect(overlay2).not.toBeAlive()
        })

        it('still opens the layer if a destructor for an existing overlay crashes', async function() {
          const destroyError = new Error('error from destructor')
          const destructor = jasmine.createSpy('crashing destructor').and.callFake(function() {
            throw destroyError
          })
          up.compiler('.existing-overlay-element', () => destructor)

          htmlFixture('<div class="root-element">new root</div>')
          up.layer.open({ fragment: '<div class="existing-overlay-element"></div>' })

          expect(up.layer.count).toBe(2)

          await jasmine.expectGlobalError(destroyError, async function() {
            up.layer.open({ fragment: '<div class="new-overlay-element"></div>', baseLayer: 'root' })

            // Peel destructors run in the next microtask because of implementation details in
            // up.Layer.Overlay#destroyElements().
            await wait(300)

            expect(destructor).toHaveBeenCalled()
          })

          expect(up.layer.count).toBe(2)
          expect(up.layer.current.element).toHaveSelector('.new-overlay-element')
        })
      })

      describe('with { url } option', function() {

        it('loads HTML from the server and opens an overlay', async function() {
          up.layer.open({ target: '.element', url: '/path' })

          await wait()

          expect(up.layer.count).toBe(1)
          expect(jasmine.lastRequest().url).toMatchURL('/path')

          jasmine.respondWith('<div class="element other-class">element text</div>')

          await wait()

          const element = document.querySelector('up-modal .element')
          expect(element).toBeGiven()
          expect(element).toHaveClass('other-class')
          expect(element).toHaveText('element text')
        })

        it('aborts a pending request targeting the main element in the current layer', async function() {
          up.fragment.config.mainTargets.unshift('.root-element')
          fixture('.root-element')

          const rootRenderJob = up.navigate('.root-element', { url: '/path1' })
          const abortedURLs = []
          up.on('up:request:aborted', (event) => abortedURLs.push(event.request.url))

          await wait()

          expect(abortedURLs).toBeBlank()

          up.layer.open({ url: '/path2' })

          await expectAsync(rootRenderJob).toBeRejectedWith(jasmine.any(up.Aborted))
          expect(abortedURLs.length).toBe(1)
          expect(abortedURLs[0]).toMatchURL('/path1')
        })

        it('does not abort a pending request targeting a non-main element in the current layer', async function() {
          fixture('.root-element')

          up.navigate('.root-element', { url: '/path1' })
          const abortedURLs = []
          up.on('up:request:aborted', (event) => abortedURLs.push(event.request.url))

          await wait()

          expect(abortedURLs).toBeBlank()

          up.layer.open({ url: '/path2' })

          await wait()

          expect(abortedURLs).toBeBlank()
        })

        it('aborts a previous pending request that would result in opening a new overlay', async function() {
          const openJob1 = up.layer.open({ url: '/path1' })
          const abortedURLs = []
          up.on('up:request:aborted', (event) => abortedURLs.push(event.request.url))

          await wait()

          expect(abortedURLs).toBeBlank()

          const openJob2 = up.layer.open({ url: '/path2' })

          await expectAsync(openJob1).toBeRejectedWith(jasmine.any(up.Aborted))
          expect(abortedURLs.length).toBe(1)
          expect(abortedURLs[0]).toMatchURL('/path1')
        })

        it('runs a { preview } function while the server request is loading', async function() {
          const undoFn = jasmine.createSpy('undo fn')
          const previewFn = jasmine.createSpy('preview function').and.returnValue(undoFn)

          fixture('#target')
          up.render({ preview: previewFn, url: '/path', target: '#target' })

          await wait()

          expect(previewFn).toHaveBeenCalledWith(jasmine.any(up.Preview), {})
          expect(undoFn).not.toHaveBeenCalled()

          jasmine.respondWithSelector('#target')
          await wait()

          expect(undoFn).toHaveBeenCalled()
        })

        describe('when the server sends an X-Up-Events header', function() {
          it('emits these events', async function() {
            up.layer.open({ target: '.element', url: '/path' })

            const event1Plan = { type: 'foo', prop: 'bar ' }
            const event2Plan = { type: 'baz', prop: 'bam ' }

            spyOn(up, 'emit').and.callThrough()

            await wait()

            jasmine.respondWith({
              responseHeaders: { 'X-Up-Events': JSON.stringify([event1Plan, event2Plan]) },
              responseText: '<div class="element"></div>'
            })

            await wait()

            expect(up.emit).toHaveBeenCalledWith(jasmine.objectContaining(event1Plan))
            expect(up.emit).toHaveBeenCalledWith(jasmine.objectContaining(event2Plan))
          })
        })
      })

      describe('with { document } option', function() {
        it('opens a new overlay with matching HTML extracted from the given as { document }', async function() {
          await up.layer.open({
            target: '.element',
            document: `
              <div class="element other-class">element text</div>
            `
          })

          expect(up.layer.count).toBe(2)

          const element = document.querySelector('up-modal .element')
          expect(element).toBeGiven()
          expect(element).toHaveClass('other-class')
          expect(element).toHaveText('element text')
        })
      })

      describe('with { fragment } option', function() {

        it('derives a new overlay with a selector and outer HTML derived from the given { fragment } option', async function() {
          await up.layer.open({
            fragment: '<div class="element">element text</div>'
          })

          expect(up.layer.count).toBe(2)

          const element = document.querySelector('up-modal .element')
          expect(element).toBeGiven()
          expect(element).toHaveText('element text')
        })

        it('clones the initial overlay fragment from a <template>', async function() {
          const template = htmlFixture(`
            <template id="my-template">
              <div id="my-element">
                content from template
              </div>
            </template>
          `)

          await up.layer.open({
            fragment: '#my-template'
          })

          expect(up.layer.count).toBe(2)

          const element = document.querySelector('up-modal #my-element')
          expect(element).toBeGiven()
          expect(element).toHaveText('content from template')
        })
      })

      describe('with { content } option', function() {

        it('opens a new overlay from the given inner HTML string, constructing a container matching the { target }', async function() {
          await up.layer.open({
            target: '.element',
            content: '<p>element text</p>'
          })

          expect(up.layer.count).toBe(2)

          const element = document.querySelector('up-modal .element')
          expect(element).toBeGiven()
          expect(element).toHaveText('element text')
        })

        it('opens a new overlay from a mixed element/text HTML string without a single root', async function() {
          await up.layer.open({
            target: '.element',
            content: 'foo <b>bar</b> baz'
          })

          expect(up.layer.count).toBe(2)

          const element = document.querySelector('up-modal .element')
          expect(element).toBeGiven()
          expect(element).toHaveText('foo bar baz')
        })

        it('clones the overlay content from a <template>', async function() {
          const template = htmlFixture(`
            <template id="my-template">
              foo
              <b>bar</b>
              baz
            </template>
          `)

          await up.layer.open({
            target: '.element',
            content: '#my-template'
          })

          expect(up.layer.count).toBe(2)

          const element = document.querySelector('up-modal .element')
          expect(element).toBeGiven()
          expect(element).toHaveText('foo bar baz')
        })

        it('opens a new overlay from a given Element', async function() {
          const givenElement = up.element.createFromHTML('<p>element text</p>')

          await up.layer.open({
            target: '.element',
            content: givenElement
          })

          expect(up.layer.count).toBe(2)

          const renderedElement = document.querySelector('up-modal .element')
          expect(renderedElement).toBeGiven()
          expect(renderedElement).toHaveText('element text')
          expect(renderedElement.children).toEqual([givenElement])
        })

        it('opens a new overlay from a given Text node', async function() {
          const givenNode = new Text('foo')

          await up.layer.open({
            target: '.element',
            content: givenNode
          })

          expect(up.layer.count).toBe(2)

          const renderedElement = document.querySelector('up-modal .element')
          expect(renderedElement).toBeGiven()
          expect(renderedElement).toHaveText('foo')
          expect(renderedElement.childNodes).toEqual([givenNode])
        })

        it('opens a new overlay from a given NodeList with mixed Text and Element nodes', async function() {
          const givenNodes = [...up.element.createNodesFromHTML('foo <b>bar</b> baz')]
          expect(givenNodes).toHaveLength(3)
          expect(givenNodes[0]).toBeTextNode()
          expect(givenNodes[1]).toBeElement()
          expect(givenNodes[2]).toBeTextNode()

          await up.layer.open({
            target: '.element',
            content: givenNodes
          })

          expect(up.layer.count).toBe(2)

          const renderedElement = document.querySelector('up-modal .element')
          expect(renderedElement).toBeGiven()
          expect(renderedElement).toHaveText('foo bar baz')
          expect(renderedElement.childNodes).toEqual(givenNodes)
        })
      })

      describe('compilation', function() {

        it('compiles the overlay content', async function() {
          const fooCompiler = jasmine.createSpy('.foo compiler')
          up.compiler('.foo', fooCompiler)
          const barCompiler = jasmine.createSpy('.bar compiler')
          up.compiler('.bar', barCompiler)

          const [container, foo, bar] = htmlFixtureList(`
            <div class="container">
              <div class='foo'>foo</div>
              <div class='bar'>foo</div>
            </div>
          `)

          expect(fooCompiler).not.toHaveBeenCalled()
          expect(barCompiler).not.toHaveBeenCalled()

          await up.layer.open({ fragment: container })

          expect(fooCompiler).toHaveBeenCalledWith(foo, jasmine.anything(), jasmine.anything())
          expect(barCompiler).toHaveBeenCalledWith(bar, jasmine.anything(), jasmine.anything())
        })

        it("compiles the overlay's container element so a compiler can customize", async function() {
          const drawerCompiler = jasmine.createSpy('up-drawer compiler')
          up.compiler('up-drawer', drawerCompiler)

          expect(drawerCompiler).not.toHaveBeenCalled()

          await up.layer.open({ content: 'foo', mode: 'drawer' })

          expect(drawerCompiler).toHaveBeenCalledWith(jasmine.elementMatchingSelector('up-drawer'), jasmine.anything(), jasmine.anything())
        })

        it('applies a { data } option to the topmost swappable element, not to the container element', async function() {
          const drawerCompiler = jasmine.createSpy('up-drawer compiler')
          up.compiler('up-drawer', drawerCompiler)
          expect(drawerCompiler).not.toHaveBeenCalled()

          const contentCompiler = jasmine.createSpy('.content compiler')
          up.compiler('.content', contentCompiler)
          expect(contentCompiler).not.toHaveBeenCalled()

          await up.layer.open({ fragment: '<div class="content">content</div>', mode: 'drawer', data: { foo: 123 } })

          expect(drawerCompiler).toHaveBeenCalledWith(jasmine.elementMatchingSelector('up-drawer'), {}, jasmine.anything())
          expect(contentCompiler).toHaveBeenCalledWith(jasmine.elementMatchingSelector('.content'), { foo: 123 }, jasmine.anything())
        })
      })

      describe('animation', function() {

        it('uses the configured open animation', async function() {
          up.motion.config.enabled = true
          up.layer.config.modal.openAnimation = 'fade-in'
          up.layer.config.modal.openDuration = 600

          up.layer.open({ mode: 'modal' })

          await wait(300)

          expect(document).toHaveSelector('up-modal')
          expect('up-modal-box').toHaveOwnOpacity(0.5, 0.4)

          await wait(500)
          expect('up-modal-box').toHaveOwnOpacity(1.0)
        })

        it('uses a different animation with { animation } option', async function() {
          up.motion.config.enabled = true
          spyOn(up, 'animate').and.callThrough()

          await up.layer.open({ animation: 'move-from-top' })

          expect(up.animate).toHaveBeenCalledWith(jasmine.any(Element), 'move-from-top', jasmine.anything())
        })

        it('uses a different animation with { openAnimation } option', async function() {
          up.motion.config.enabled = true
          spyOn(up, 'animate').and.callThrough()

          await up.layer.open({ openAnimation: 'move-from-top' })

          expect(up.animate).toHaveBeenCalledWith(jasmine.any(Element), 'move-from-top', jasmine.anything())
        })

        it('accepts a { closeAnimation } option for closing', async function() {
          up.motion.config.enabled = true
          spyOn(up, 'animate').and.callThrough()

          await up.layer.open({ openAnimation: false, closeAnimation: 'move-to-bottom' })

          expect(up.animate).toHaveBeenCalledWith(jasmine.any(Element), false, jasmine.anything())

          await up.layer.dismiss()

          expect(up.animate).toHaveBeenCalledWith(jasmine.any(Element), 'move-to-bottom', jasmine.anything())

        })
      })

      describe('events', function() {

        it('emits an up:layer:open event on the document before the new overlay opens', function(done) {
          expect(up.layer.count).toBe(1)

          up.on('up:layer:open', function(event) {
            expect(up.layer.count).toBe(1)
            expect(event.target).toBe(document)
            expect(up.layer.current).toBe(up.layer.root)
            done()
          })

          up.layer.open()
          expect(up.layer.count).toBe(2)
        })

        it('allows up:layer:open listeners to observe and manipulate layer options', function() {
          up.on('up:layer:open', function(event) {
            expect(event.layerOptions.mode).toBe('modal')
            event.layerOptions.mode = 'drawer'
          })

          up.layer.open()
          expect(up.layer.count).toBe(2)
          expect(up.layer.mode).toBe('drawer')
        })

        it('emits an up:layer:opened event when the layer has opened', function(done) {
          expect(up.layer.count).toBe(1)

          up.on('up:layer:opened', function(event) {
            expect(up.layer.count).toBe(2)
            expect(event.layer).toBe(up.layer.front)
            expect(event.target).toBe(up.layer.front.element)
            expect(up.layer.current).toBe(up.layer.front)
            done()
          })

          up.layer.open({ history: true, location: '/overlay-path' })

        })
      })

      describe('focus', function() {

        beforeEach(function() {
          up.specUtil.assertTabFocused()
        })

        it("focuses the new overlay's box", function(done) {
          const assertFocus = function() {
            expect(up.layer.current.getBoxElement()).toBeFocused()
            done()
          }

          up.layer.open({ target: '.element', onFinished: assertFocus })

        })

        it("hides a focus ring on the new overlay's box", function(done) {
          const assertFocus = function() {
            expect(up.layer.current.getBoxElement()).toBeFocused()
            expect(up.layer.current.getBoxElement()).not.toHaveOutline()
            done()
          }

          up.layer.open({ target: '.element', onFinished: assertFocus })

        })

        it('focuses a CSS selector passed as { focus } option', function(done) {
          up.layer.open({
            target: '.element',
            content: '<div class="child">child text</div>',
            focus: '.child',
            onFinished() {
              const child = document.querySelector('up-modal .element .child')
              expect(child).toBeGiven()
              expect(child).toBeFocused()
              done()
            }
          })

        })
      })

      describe('history', function() {

        beforeEach(function() {
          up.history.config.enabled = true
        })

        it("prioritizes the mode's { history } config over up.fragment.config.navigateOptions.history (bugfix)", function() {
          up.fragment.config.navigateOptions.history = false
          up.layer.config.modal.history = true

          up.layer.open({
            location: '/modal-location',
            fragment: '<div class="element">element text</div>',
            navigate: true // up.layer.open() is navigation by default, but let's be explicit here
          })

          expect(up.layer.isOverlay()).toBe(true)
          expect(up.layer.history).toBe(true)
          expect(location.href).toMatchURL('/modal-location')
        })

        describe('with { history: true }', function() {

          it('updates the browser location when the overlay opens', async function() {
            up.layer.open({
              location: '/modal-location',
              fragment: '<div class="element">element text</div>',
              history: true
            })

            await wait()

            expect(up.layer.isOverlay()).toBe(true)
            expect(up.layer.history).toBe(true)
            expect(location.href).toMatchURL('/modal-location')
          })

          it("updates meta tags from the response", async function() {
            fixture(document.head, 'meta[name="description"][content="old description"]')

            up.layer.open({
              location: '/modal-location',
              history: true,
              target: '.element',
              document: `
                <html>
                  <head>
                    <link rel='canonical' href='/new-canonical'>
                    <meta name='description' content='new description'>
                  </head>
                  <body>
                    <div class='element'>
                      overlay text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            expect(up.layer.isOverlay()).toBe(true)
            expect(up.layer.history).toBe(true)
            expect(document.head).not.toHaveSelector('meta[name="description"][content="old description"]')
            expect(document.head).toHaveSelector('meta[name="description"][content="new description"]')
          })

          it('updates the html[lang] attribute from the response', async function() {
            document.documentElement.setAttribute('lang', 'it')

            up.layer.open({
              location: '/modal-location',
              history: true,
              target: '.element',
              document: `
                <html lang='fr'>
                  <body>
                    <div class='element'>
                      overlay text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            expect(document.documentElement).toHaveAttribute('lang', 'fr')
          })

          it('does not emit up:layer:location:changed when the overlay opens', async function() {
            const changedListener = jasmine.createSpy('up:layer:location:changed listener')
            up.on('up:layer:location:changed', changedListener)

            up.layer.open({
              location: '/modal-location',
              fragment: '<div class="element">element text</div>',
              history: true
            })

            await wait()

            expect(location.href).toMatchURL('/modal-location')
            expect(changedListener).not.toHaveBeenCalled()
          })

          it('does not update the browser location if the layer is not the front layer', async function() {
            makeLayers([
              { target: '.root-element' },
              { target: '.overlay-element', location: '/modal-location', history: true }
            ])

            expect(up.layer.isOverlay()).toBe(true)
            expect(location.href).toMatchURL('/modal-location')

            up.navigate({
              layer: 'root',
              target: '.root-element',
              content: 'new text',
              location: '/new-root-location',
              peel: false,
              history: true
            })

            expect(location.href).toMatchURL('/modal-location')

            up.layer.dismiss()

            expect(up.layer.isRoot()).toBe(true)
            expect(location.href).toMatchURL('/new-root-location')
          })
        })

        describe('with { history: false }', function() {

          it('does not update the browser location ', async function() {
            const originalLocation = location.href

            up.layer.open({
              target: '.element',
              history: false,
              location: '/modal-url'
            })

            await wait()

            expect(up.layer.isOverlay()).toBe(true)
            expect(location.href).toMatchURL(originalLocation)

            // We can still ask the layer what location it displays
            expect(up.layer.location).toMatchURL('/modal-url')
          })

          it('does not let child layers update the browser location', async function() {
            const originalLocation = location.href

            up.layer.open({
              target: '.element',
              history: false,
              location: '/overlay1',
            })

            await wait()

            expect(up.layer.isOverlay()).toBe(true)
            expect(location.href).toMatchURL(originalLocation)

            up.layer.open({
              target: '.element',
              history: true,
              location: '/overlay2',
            })

            await wait()

            expect(location.href).toMatchURL(originalLocation)
          })

          it('does not insert an identical history entry after the overlay is closed', async function() {
            up.history.replace('/path1')
            await wait()

            up.history.push('/path2')
            await wait()

            up.layer.open({
              target: '.element',
              history: false,
              location: '/modal-url'
            })

            await wait()

            expect(up.layer.isOverlay()).toBe(true)
            expect(location.href).toMatchURL('/path2')

            up.layer.dismiss()
            await wait()

            expect(up.layer.isOverlay()).toBe(false)
            expect(location.href).toMatchURL('/path2')

            history.back()
            await wait(100)

            expect(location.href).toMatchURL('/path1')
          })

        })

        describe('with { history: "auto" }', function() {

          it('gives the layer history if the initial overlay content is a main selector', async function() {
            up.layer.config.modal.history = 'auto'
            up.fragment.config.mainTargets = ['.main']

            up.layer.open({ mode: 'modal', history: 'auto', target: '.main' })

            await wait()

            expect(up.layer.mode).toEqual('modal')
            expect(up.layer.history).toBe(true)
          })

          it('does not give the layer history if initial overlay content is not a main selector', async function() {
            up.layer.config.modal.history = 'auto'
            up.fragment.config.mainTargets = ['.main']

            up.layer.open({ mode: 'modal', history: 'auto', target: '.other' })

            await wait()

            expect(up.layer.mode).toEqual('modal')
            expect(up.layer.history).toBe(false)
          })

          it('gives the layer history if the initial overlay content is a main selector configured for the new layer mode', async function() {
            up.layer.config.modal.history = 'auto'
            up.fragment.config.mainTargets = ['.main']
            up.layer.config.drawer.mainTargets = ['.main-for-drawer']

            up.layer.open({ mode: 'drawer', history: 'auto', target: '.main-for-drawer' })

            await wait()

            expect(up.layer.mode).toEqual('drawer')
            expect(up.layer.history).toBe(true)
          })

          it('does not give the layer history if the initial overlay content is a main selector configured for another layer mode', async function() {
            up.layer.config.modal.history = 'auto'
            up.fragment.config.mainTargets = ['.main']
            up.layer.config.drawer.mainTargets = ['.main-for-drawer']

            up.layer.open({ mode: 'modal', history: 'auto', target: '.main-for-drawer' })

            await wait()

            expect(up.layer.mode).toEqual('modal')
            expect(up.layer.history).toBe(false)
          })
        })
      })

      describe('context', function() {

        it("sets the layer's initial context object from the { context } option", async function() {
          const overlay = await up.layer.open({ context: { key: 'value' } })
          expect(overlay.context).toEqual({ key: 'value' })
        })

        it('sets an empty object by default', async function() {
          expect(up.layer.root.context).toEqual({})

          const overlay = await up.layer.open()
          expect(overlay.context).toEqual({})
        })

        it('sends the context object as an X-Up-Context header along with the request providing the initial overlay content', async function() {
          up.layer.open({ url: '/modal', context: { key: 'value' } })

          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Context']).toMatchJSON({ key: 'value' })
        })

        it('allows the server to update the initial context object', async function() {
          up.layer.open({ url: '/modal', target: '.target', context: { linkKey: 'linkValue' } })

          await wait()

          jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Context': JSON.stringify({ serverKey: 'serverValue' }) } })

          await wait()

          expect(up.layer.get(1).context).toEqual({ linkKey: 'linkValue', serverKey: 'serverValue' })
        })
      })

      describe('mode', function() {

        it('opens a new layer with the default mode from up.layer.config.mode', async function() {
          up.layer.config.mode = 'cover'
          await up.layer.open()

          expect(up.layer.isOverlay()).toBe(true)
          expect(up.layer.mode).toEqual('cover')
        })

        it('opens a new layer with the given { mode }', async function() {
          await up.layer.open({ mode: 'cover' })

          expect(up.layer.isOverlay()).toBe(true)
          expect(up.layer.mode).toEqual('cover')
        })

        it("sends the layer's mode as an X-Up-Mode request header")
      })

      describe('styling', function() {

        // maybe move this to the flavor specs

        it('sets a { position } option as a [position] attribute', async function() {
          await up.layer.open({ position: 'right' })

          expect(up.layer.element).toHaveAttribute('position', 'right')
        })

        it('sets a { size } option as a [size] attribute', async function() {
          await up.layer.open({ size: 'small' })

          expect(up.layer.element).toHaveAttribute('size', 'small')
        })

        it('sets an { align } option as an [align] attribute', async function() {
          await up.layer.open({ align: 'right' })

          expect(up.layer.element).toHaveAttribute('align', 'right')
        })

        it('sets a { class } option as a [class] of the overlay element', async function() {
          await up.layer.open({ class: 'foo' })

          expect(up.layer.element).toHaveClass('foo')
        })
      })

      describe('choice of target', function() {

        beforeEach(function() {
          up.layer.config.any.mainTargets = []
          up.layer.config.overlay.mainTargets = []
          up.layer.config.modal.mainTargets = []
        })

        it('uses a selector given as { target } option', async function() {
          up.layer.config.any.mainTargets = ['main'] // at least one main target must be configured
          await up.layer.open({ content: 'overlay text', target: '.target-from-option' })

          expect(up.layer.isOverlay()).toBe(true)
          expect(document).toHaveSelector('up-modal .target-from-option')
        })

        it('uses a target from up.layer.config.any.mainTargets', async function() {
          up.layer.config.any.mainTargets.push('.target-from-config-dot-all')

          await up.layer.open({ content: 'overlay text' })

          expect(up.layer.isOverlay()).toBe(true)
          expect(document).toHaveSelector('up-modal .target-from-config-dot-all')
        })

        it('uses a target from up.layer.config.overlay.mainTargets', async function() {
          up.layer.config.overlay.mainTargets.push('.target-from-config-dot-overlay')
          up.layer.config.any.mainTargets.push('.target-from-config-dot-all')

          await up.layer.open({ content: 'overlay text' })

          expect(up.layer.isOverlay()).toBe(true)
          expect(document).toHaveSelector('up-modal .target-from-config-dot-overlay')
        })

        it("uses a target from up.layer.config.$mode.mainTargets, where $mode is the new overlay's mode", async function() {
          up.layer.config.modal.mainTargets.push('.target-from-config-dot-modal')
          up.layer.config.overlay.mainTargets.push('.target-from-config-dot-overlay')
          up.layer.config.any.mainTargets.push('.target-from-config-dot-all')

          await up.layer.open({ content: 'overlay text' })

          expect(up.layer.isOverlay()).toBe(true)
          expect(document).toHaveSelector('up-modal .target-from-config-dot-modal')
        })
      })

      require('./layer_open_closing_spec')
    })

  })

})
