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

      describe('closing', function() {

        beforeEach(function() {
          up.motion.config.enabled = false
        })

        describe('{ dismissible }', function() {

          describe('with { dismissible: true }', function() {
            it('sets all other dismissible options to true', async function() {
              const layer = await up.layer.open({ dismissible: true })
              expect(layer.dismissible).toMatchList(['button', 'key', 'outside'])
            })
          })

          describe('with { dismissible: false }', function() {
            it('sets all other dismissible options to false if passed { dismissible: false }', async function() {
              const layer = await up.layer.open({ dismissible: false })
              expect(layer.dismissible).toEqual([])
            })
          })

          describe('with { dismissible } set to a space-separated string', function() {
            it('sets only the given dismiss methods', async function() {
              const layer = await up.layer.open({ dismissible: 'button outside' })
              expect(layer.dismissible).toMatchList(['button', 'outside'])
            })
          })

          describe('with { dismissible } set to a comma-separated string', function() {
            it('sets only the given dismiss methods', async function() {
              const layer = await up.layer.open({ dismissible: 'button, outside' })
              expect(layer.dismissible).toMatchList(['button', 'outside'])
            })
          })

          describe('with { dismissible: "button" }', function() {

            it('adds a button that dimisses the layer', async function() {
              const layer = await up.layer.open({ dismissible: 'button' })
              expect(layer.element).toHaveSelector('up-modal-dismiss[up-dismiss]')
            })

            it('allows to customize the button using { dismissLabel, dismissARIALabel }', async function() {
              const layer = await up.layer.open({
                dismissible: 'button',
                dismissLabel: 'CLOSE ME',
                dismissARIALabel: 'Close this overlay'
              })
              const button = layer.element.querySelector('up-modal-dismiss[up-dismiss]')
              expect(button).toHaveText('CLOSE ME')
              expect(button).toHaveAttribute('aria-label', 'Close this overlay')
            })

            if (up.migrate.loaded) {
              it('allows to customize the button using { dismissLabel, dismissAriaLabel }', async function() {
                const layer = await up.layer.open({
                  dismissible: 'button',
                  dismissLabel: 'CLOSE ME',
                  dismissAriaLabel: 'Close this overlay'
                })
                const button = layer.element.querySelector('up-modal-dismiss[up-dismiss]')
                expect(button).toHaveText('CLOSE ME')
                expect(button).toHaveAttribute('aria-label', 'Close this overlay')
              })
            }

            it('emits an up:layer:dismissed event with { value: ":button" } and other details', async function() {
              up.layer.open({ dismissible: 'button', mode: 'modal' })
              let buttonElement = null
              const listener = jasmine.createSpy('up:layer:dismissed listener')
              up.on('up:layer:dismissed', listener)

              await wait()

              expect(up.layer.isOverlay()).toBe(true)

              buttonElement = up.fragment.get('up-modal-dismiss')
              Trigger.clickSequence(buttonElement, { clientX: 0, clientY: 0 })

              await wait()

              expect(up.layer.isOverlay()).toBe(false)

              expect(listener).toHaveBeenCalledWith(
                jasmine.objectContaining({ value: ':button', origin: buttonElement }),
                jasmine.anything(),
                jasmine.anything()
              )
            })

            it('does not emit a global error if the button is clicked and up:layer:dismiss is prevented', async function() {
              up.layer.open({ dismissible: 'button', mode: 'modal' })
              up.on('up:layer:dismiss', (event) => event.preventDefault())

              await wait()

              await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
                const buttonElement = up.fragment.get('up-modal-dismiss')
                Trigger.clickSequence(buttonElement, { clientX: 0, clientY: 0 })

                await wait()
                expect(globalErrorSpy).not.toHaveBeenCalled()
              })
            })

            it('returns focus to the link that opened the overlay, hiding a focus ring as it is a mouse interaction', async function() {
              const opener = fixture('a[href="/overlay"][up-layer="new"][up-target="#content"][up-dismissible="button"]')
              Trigger.clickSequence(opener)

              await wait()

              jasmine.respondWithSelector('#content', { text: 'overlay content' })

              await wait()

              expect(up.layer.current).toBeOverlay()

              Trigger.clickSequence('up-modal-dismiss')

              await wait()

              expect(up.layer.current).not.toBeOverlay()
              expect(opener).toHaveFocus()
              expect(opener).not.toHaveOutline()
            })

            it('returns focus to the link that opened the overlay, showing a focus ring when the button was activated with a keyboard', async function() {
              const opener = fixture('a[href="/overlay"][up-layer="new"][up-target="#content"][up-dismissible="button"]')
              Trigger.clickSequence(opener)

              await wait()

              jasmine.respondWithSelector('#content', { text: 'overlay content' })

              await wait()

              expect(up.layer.current).toBeOverlay()

              Trigger.clickLinkWithKeyboard('up-modal-dismiss')

              await wait()

              expect(up.layer.current).not.toBeOverlay()
              expect(opener).toHaveFocus()
              expect(opener).toHaveOutline()
            })
          })

          describe('without { dismissible: "button" }', function() {
            it('does not add a button that dimisses the layer', async function() {
              const layer = await up.layer.open({ dismissible: false })
              expect(layer.element).not.toHaveSelector('up-modal-dismiss[up-dismiss]')
            })
          })

          describe('with { dismissible: "key" }', function() {

            it('lets the user close the layer by pressing Escape', async function() {
              up.layer.open({ dismissible: "key" })

              await wait()

              expect(up.layer.isOverlay()).toBe(true)

              Trigger.escapeSequence(document.body)

              await wait()

              expect(up.layer.isOverlay()).toBe(false)
            })

            it('does not emit a global error when Escape is pressed and up:layer:dismiss is prevented', async function() {
              up.layer.open({ dismissible: "key" })
              up.on('up:layer:dismiss', (event) => event.preventDefault())

              await wait()

              await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
                Trigger.escapeSequence(document.body)

                await wait()
                expect(globalErrorSpy).not.toHaveBeenCalled()
              })
            })

            it('returns focus to the link that opened the overlay, showing a focus ring as it is a keyboard interaction', async function() {
              const opener = fixture('a[href="/overlay"][up-target="#content"][up-layer="new"][up-dismissible="key"]')
              Trigger.clickSequence(opener)

              await wait()

              jasmine.respondWithSelector('#content', { text: 'overlay content' })

              await wait()

              expect(up.layer.current).toBeOverlay()

              Trigger.escapeSequence(document.body)

              await wait()

              expect(up.layer.current).not.toBeOverlay()
              expect(opener).toHaveFocus()
              expect(opener).toHaveOutline()
            })

            it('emits an up:layer:dismissed event with { value: ":key" } and other details', async function() {
              up.layer.open({ dismissible: 'key', mode: 'modal' })
              const listener = jasmine.createSpy('up:layer:dismissed listener')
              up.on('up:layer:dismissed', listener)

              await wait()

              expect(up.layer.isOverlay()).toBe(true)

              Trigger.escapeSequence(document.body)

              await wait()

              expect(up.layer.isOverlay()).toBe(false)

              expect(listener).toHaveBeenCalledWith(
                jasmine.objectContaining({ value: ':key' }),
                jasmine.anything(),
                jasmine.anything()
              )
            })
          })

          describe('without { dismissible: "key" }', function() {
            it('does not let the user close the layer by pressing escape', async function() {
              up.layer.open({ dismissible: false })

              await wait()

              expect(up.layer.isOverlay()).toBe(true)

              Trigger.escapeSequence(document.body)

              await wait()

              expect(up.layer.isOverlay()).toBe(true)
            })
          })

          describe('with { dismissible: "outside" }', function() {

            describe('for an overlay with viewport', function() {

              it('dismisses the overlay when the user clicks on the viewport (which sits over the backdrop and will receive all clicks outside the frame)', async function() {
                up.layer.open({ dismissible: 'outside', mode: 'modal' })

                await wait()

                expect(up.layer.isOverlay()).toBe(true)

                Trigger.clickSequence(up.layer.current.viewportElement, { clientX: 0, clientY: 0 })

                await wait()

                expect(up.layer.isOverlay()).toBe(false)
              })

              it('emits an up:layer:dismissed event with { value: ":outside" } and other details', async function() {
                up.layer.open({ dismissible: 'outside', mode: 'modal' })
                let viewportElement = null
                const listener = jasmine.createSpy('up:layer:dismissed listener')
                up.on('up:layer:dismissed', listener)

                await wait()

                expect(up.layer.isOverlay()).toBe(true);

                ({
                  viewportElement
                } = up.layer.current)
                Trigger.clickSequence(viewportElement, { clientX: 0, clientY: 0 })

                await wait()

                expect(up.layer.isOverlay()).toBe(false)

                expect(listener).toHaveBeenCalledWith(
                  jasmine.objectContaining({ value: ':outside', origin: viewportElement }),
                  jasmine.anything(),
                  jasmine.anything()
                )
              })

              it('does not emit a global error when the viewport is clicked and up:layer:dismiss is prevented', async function() {
                up.layer.open({ dismissible: "outside", mode: 'modal' })
                up.on('up:layer:dismiss', (event) => event.preventDefault())

                await wait()

                await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
                  const {
                    viewportElement
                  } = up.layer.current
                  Trigger.clickSequence(viewportElement, { clientX: 0, clientY: 0 })

                  await wait()
                  expect(globalErrorSpy).not.toHaveBeenCalled()
                })
              })

              it('does not dismiss the overlay when the user clicks on the parent layer, but within a foreign overlay', async function() {
                up.layer.config.foreignOverlaySelectors = ['.foreign-overlay']
                const foreignOverlay = fixture('.foreign-overlay', { text: 'foreign overlay content' })

                up.layer.open({ dismissible: 'outside', mode: 'modal' })

                await wait()

                expect(up.layer.isOverlay()).toBe(true)

                Trigger.clickSequence(foreignOverlay, { clientX: 0, clientY: 0 })

                await wait()

                expect(up.layer.isOverlay()).toBe(true)
              })
            })

            describe('for an overlay with tether', function() {

              it('dismisses the overlay when the user clicks anywhere on the parent layer', async function() {
                const opener = fixture('a', { text: 'label' })
                up.layer.open({ dismissible: 'outside', mode: 'popup', origin: opener })
                await wait()

                expect(up.layer.isOverlay()).toBe(true)

                Trigger.clickSequence(document.body)
                await wait()

                expect(up.layer.isOverlay()).toBe(false)
              })

              it('does not dismiss the overlay when the user clicks on the parent layer, but within a foreign overlay', async function() {
                up.layer.config.foreignOverlaySelectors = ['.foreign-overlay']
                const foreignOverlay = fixture('.foreign-overlay', { text: 'foreign overlay content' })

                const opener = fixture('a', { text: 'label' })
                up.layer.open({ dismissible: 'outside', mode: 'popup', origin: opener })

                await wait()

                expect(up.layer.isOverlay()).toBe(true)

                Trigger.clickSequence(foreignOverlay)

                await wait()

                expect(up.layer.isOverlay()).toBe(true)
              })

              it('lets the user close an overlay with tether by clicking on its opener', async function() {
                const opener = fixture('a', { text: 'label' })
                up.layer.open({ dismissible: 'outside', mode: 'popup', origin: opener })

                await wait()

                expect(up.layer.isOverlay()).toBe(true)

                Trigger.clickSequence(opener)

                await wait()

                expect(up.layer.isOverlay()).toBe(false)
              })

              describe('focus', function() {

                it('focuses the link that opened the overlay', async function() {
                  const opener = fixture('a[href="#"][up-content="overlay content"][up-dismissible="outside"][up-layer="new popup"]', { text: 'label' })
                  Trigger.clickSequence(opener)
                  await wait()

                  expect(up.layer.isOverlay()).toBe(true)

                  Trigger.clickSequence(document.body)
                  await wait(50)

                  expect(up.layer.isOverlay()).toBe(false)
                  expect(opener).toBeFocused()
                })

                it('focuses the link that opened the overlay when nested overlays are dismissed', async function() {
                  const rootOpener = fixture('a[href="#"][up-content="overlay content"][up-dismissible="outside"][up-layer="new popup"]', { text: 'label' })
                  Trigger.clickSequence(rootOpener)
                  await wait()

                  expect(up.layer.current.index).toBe(1)

                  const overlay1Opener = up.layer.affix('a[href="#"][up-content="overlay content"][up-dismissible="outside"][up-layer="new popup"]', { text: 'label' })
                  Trigger.clickSequence(overlay1Opener)
                  await wait()

                  expect(up.layer.current.index).toBe(2)

                  Trigger.clickSequence(document.body)
                  await wait(50)

                  expect(up.layer.isOverlay()).toBe(false)
                  expect(rootOpener).toBeFocused()
                })

                it('preserves focus when the overlay was dismissed by clicking a focusable element on the parent layer', async function() {
                  const opener = fixture('a[href="#"][up-content="overlay content"][up-dismissible="outside"][up-layer="new popup"]', { text: 'label' })
                  const input = fixture('input[type=text]')

                  Trigger.clickSequence(opener)
                  await wait()

                  expect(up.layer.isOverlay()).toBe(true)

                  Trigger.clickSequence(input)
                  await wait(50)

                  expect(up.layer.isOverlay()).toBe(false)
                  expect(input).toBeFocused()
                })
              })
            })
          })

          describe('without { dismissible: "outside" }', function() {
            it('does not let the user close a layer with viewport by clicking on its viewport (which sits over the backdrop and will receive all clicks outside the frame)', async function() {
              up.layer.open({ dismissible: false, mode: 'modal' })

              await wait()

              expect(up.layer.isOverlay()).toBe(true)

              Trigger.clickSequence(up.layer.current.viewportElement, { clientX: 0, clientY: 0 })

              await wait()

              expect(up.layer.isOverlay()).toBe(true)
            })
          })
        })

        if (up.migrate.loaded) {

          describe('{ dismissable } (deprecated)', function() {

            it('forwards its value to { dismissible }', async function() {
              const layer = await up.layer.open({ dismissable: 'button outside' })
              expect(layer.dismissible).toMatchList(['button', 'outside'])
            })

          })

        }

        describe('{ onAccepted }', function() {

          it('runs the given callback when they layer is accepted', async function() {
            const callback = jasmine.createSpy('onAccepted callback')

            up.layer.open({ onAccepted: callback })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.accept('acceptance value')

            await wait()

            expect(callback).toHaveBeenCalled()
            expect(callback.calls.mostRecent().args[0]).toBeEvent('up:layer:accepted', { value: 'acceptance value' })
          })

          it('does not run the given callback when the layer is dismissed', async function() {
            const callback = jasmine.createSpy('onAccepted callback')

            up.layer.open({ onAccepted: callback })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.dismiss('dismissal value')

            await wait()

            expect(callback).not.toHaveBeenCalled()
          })

          it('sets up.layer.current to the layer that opened the overlay', async function() {
            const rootLayer = up.layer.root
            const baseLayerSpy = jasmine.createSpy('current layer spy')

            up.layer.open({
              onAccepted() {
                return baseLayerSpy(up.layer.current)
              }
            })

            await wait()

            expect(up.layer.current.mode).toEqual('modal')
            up.layer.accept()

            await wait()

            expect(baseLayerSpy).toHaveBeenCalledWith(rootLayer)
          })

          it('does not crash when there is focus in the overlay, animations are enabled and we reload in the background (bugfix)', async function() {
            up.motion.config.enabled = true
            up.layer.config.modal.closeAnimation = 'fade-out'
            up.layer.config.modal.closeDuration = 200

            fixture('.target', { text: 'old target text', 'up-source': '/target-source' })

            const overlay = await up.layer.open({
              onAccepted() {
                return up.reload('.target')
              }
            })

            const button = overlay.affix('button', { class: 'button', text: 'button label' })
            button.focus()
            expect(button).toBeFocused()

            overlay.accept()
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(jasmine.lastRequest().url).toMatchURL('/target-source')

            await wait()

            jasmine.respondWithSelector('.target', { text: 'new target text' })
            await wait()

            expect('.target').toHaveText('new target text')
          })
        })

        describe('{ onDismissed }', function() {

          it('runs the given callback when they layer is dimissed', async function() {
            const callback = jasmine.createSpy('onDismissed callback')

            up.layer.open({ onDismissed: callback })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.dismiss('dismissal value')

            await wait()

            expect(callback).toHaveBeenCalled()
            expect(callback.calls.mostRecent().args[0]).toBeEvent('up:layer:dismissed', { value: 'dismissal value' })
          })

          it('does not run the given callback when the layer is accepted', async function() {
            const callback = jasmine.createSpy('onDismissed callback')

            up.layer.open({ onDismissed: callback })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.accept('acceptance value')

            await wait()

            expect(callback).not.toHaveBeenCalled()
          })

          it('sets up.layer.current to the layer that opened the overlay', async function() {
            const rootLayer = up.layer.root
            const baseLayerSpy = jasmine.createSpy('current layer spy')

            up.layer.open({
              onDismissed() {
                return baseLayerSpy(up.layer.current)
              }
            })

            await wait()

            expect(up.layer.current.mode).toEqual('modal')
            up.layer.dismiss()

            await wait()

            expect(baseLayerSpy).toHaveBeenCalledWith(rootLayer)
          })
        })

        describe('{ acceptEvent }', function() {

          it('accepts the layer when an event of the given type was emitted on the layer', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({ onAccepted: callback, acceptEvent: 'foo' })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.emit('foo')

            await wait()

            expect(callback).toHaveBeenCalled()
          })

          it('uses the event object as the acceptance value', async function() {
            const fooEvent = up.event.build('foo')
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({ onAccepted: callback, acceptEvent: 'foo' })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.emit(fooEvent)

            await wait()

            expect(callback).toHaveBeenCalled()
            expect(callback.calls.mostRecent().args[0]).toBeEvent('up:layer:accepted')
            expect(callback.calls.mostRecent().args[0].value).toBe(fooEvent)
          })

          describe('when the server sends a matching event via X-Up-Events', function() {

            it('accepts the overlay', async function() {
              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({ onAccepted: callback, acceptEvent: 'my:event', target: '.modal-content' })

              await wait()

              expect(up.layer.mode).toBe('modal')
              expect(callback).not.toHaveBeenCalled()

              const closingJob = up.navigate({ url: '/path', target: '.modal-content' })

              await wait()

              expect(up.layer.mode).toBe('modal')
              expect(callback).not.toHaveBeenCalled()

              jasmine.respondWithSelector('.modal-content', {
                responseHeaders: {
                  'X-Up-Events': JSON.stringify([{ type: 'my:event', foo: 'foo-value', layer: 'current' }])
                }
              })

              await expectAsync(closingJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(up.layer.mode).toBe('root')

              expect(callback).toHaveBeenCalledWith(
                jasmine.objectContaining({
                  value: jasmine.objectContaining({
                    type: 'my:event',
                    foo: 'foo-value'
                  })
                })
              )
            })

            it('makes the response available to up:layer:accepted listeners as a { response } property', async function() {
              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({ onAccepted: callback, acceptEvent: 'my:event', target: '.modal-content' })

              expect(up.layer.mode).toBe('modal')
              expect(callback).not.toHaveBeenCalled()

              const closingJob = up.navigate({ url: '/path', target: '.modal-content' })

              await wait()

              expect(up.layer.mode).toBe('modal')
              expect(callback).not.toHaveBeenCalled()

              jasmine.respondWith({
                responseText: '<div class="modal-content">closing text</div>',
                responseHeaders: {
                  'X-Up-Events': JSON.stringify([{ type: 'my:event', layer: 'current' }])
                }
              })

              await expectAsync(closingJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(up.layer.mode).toBe('root')

              expect(callback.calls.mostRecent().args[0].response).toEqual(jasmine.any(up.Response))
              expect(callback.calls.mostRecent().args[0].response.text).toBe('<div class="modal-content">closing text</div>')
            })
          })

          it('does not accept the layer when the given event was emitted on another layer', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({ onAccepted: callback, acceptEvent: 'foo' })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.root.emit('foo')

            await wait()

            expect(callback).not.toHaveBeenCalled()
          })

          it('accepts the layer when one of multiple space-separated event types was emitted on the layer', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({ onAccepted: callback, acceptEvent: 'foo bar baz' })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.emit('bar')

            await wait()

            expect(callback).toHaveBeenCalled()
          })

          it('allows the accepted response body to be consumed by a hungry element on another layer', async function() {
            pending("test me")
          })

          it('does not push a history entry if an X-Up-Events response header accepts the overlay', async function() {
            up.history.config.enabled = true
            up.history.replace('/root')
            up.history.config.restoreTargets = ['main']
            expect(up.history.location).toMatchURL('/root')

            htmlFixture(`<main>root text</main>`)

            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: 'main',
              acceptEvent: 'my:event',
              onAccepted: callback,
              history: true,
              url: '/overlay1',
            })
            await wait()

            jasmine.respondWith(`<main>overlay1 text</main>`)
            await wait()

            expect(up.layer.current.mode).toBe('modal')
            expect(up.layer.current).toHaveText('overlay1 text')
            expect(up.history.location).toMatchURL('/overlay1')
            expect(callback).not.toHaveBeenCalled()

            let matchingUpdateJob = up.render({ target: 'main', url: '/overlay2', history: true })
            await wait()

            jasmine.respondWith({
              responseHeaders: {
                'X-Up-Events': JSON.stringify([{ type: 'my:event', layer: 'current' }]),
              },
              responseText: `<main>overlay2 text</main>`
            })

            await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(callback).toHaveBeenCalled()
            expect(up.layer.current.mode).toBe('root')
            expect(up.history.location).toMatchURL('/root')

            history.back()
            await wait(400)

            expect(up.layer.current.mode).toBe('root')
            expect(up.history.location).toMatchURL('/overlay1')
            expect('main').toHaveText('overlay1 text')
          })

        })

        describe('{ dismissEvent }', function() {

          it('dismisses the layer when an event of the given type was emitted on the layer', async function() {
            const callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({ onDismissed: callback, dismissEvent: 'foo' })
            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.emit('foo')
            await wait()

            expect(callback).toHaveBeenCalled()
          })

          it('uses the event object as the dismissal value', async function() {
            const fooEvent = up.event.build('foo')
            const callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({ onDismissed: callback, dismissEvent: 'foo' })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.emit(fooEvent)

            await wait()

            expect(callback).toHaveBeenCalled()
            expect(callback.calls.mostRecent().args[0]).toBeEvent('up:layer:dismissed')
            expect(callback.calls.mostRecent().args[0].value).toBe(fooEvent)
          })

          it('does not dismiss the layer when the given event was emitted on another layer', async function() {
            const callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({ onDismissed: callback, dismissEvent: 'foo' })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.root.emit('foo')

            await wait()

            expect(callback).not.toHaveBeenCalled()
          })

          it('dismisses the layer when one of multiple space-separated event types was emitted on the layer', async function() {
            const callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({ onDismissed: callback, dismissEvent: 'foo bar baz' })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.layer.emit('bar')

            await wait()

            expect(callback).toHaveBeenCalled()
          })

          it('does emit a global error when an event of the given type was emitted on the layer and up:layer:dismiss is prevented', async function() {
            up.on('up:layer:dismiss', (event) => event.preventDefault())

            up.layer.open({ dismissEvent: 'foo' })
            await wait()

            await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
              up.layer.emit('foo')
              await wait()

              expect(up.layer.isOverlay()).toBe(true)
              expect(globalErrorSpy).not.toHaveBeenCalled()
            })
          })
        })

        describe('{ acceptFragment }', function() {

          describe('when updating a layer', function() {

            it('accepts the layer when an fragment with the given selector is rendered into the layer', async function() {
              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({
                onAccepted: callback,
                acceptFragment: '#match',
                fragment: `
                  <div id="fragment">
                    <span>initial text</span>
                  </div>
                `
              })
              await wait()

              expect(up.layer.current.mode).toBe('modal')
              expect(up.layer.current).toHaveText('initial text')
              expect(callback).not.toHaveBeenCalled()

              let ignoredUpdateJob = up.render({ fragment: `
                <div id="fragment">
                  <span id="no-match">ignored update</span>
                </div>
              `})
              await expectAsync(ignoredUpdateJob).toBeResolvedTo(jasmine.any(up.RenderResult))

              expect(up.layer.current.mode).toBe('modal')
              expect(up.layer.current).toHaveText('ignored update')
              expect(callback).not.toHaveBeenCalled()

              let matchingUpdateJob = up.render({ fragment: `
                <div id="fragment">
                  <span id="match">matching text</span>
                </div>
              `})
              await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(up.layer.current.mode).toBe('root')
              expect(document).not.toHaveSelector('#match')
              expect(callback).toHaveBeenCalled()
            })

            it('accepts a fragment matching a comma-separated selector union', async function() {
              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({
                onAccepted: callback,
                acceptFragment: '#leading, #match, #trailing',
                fragment: `
                  <div id="fragment">
                    <span>initial text</span>
                  </div>
                `
              })
              await wait()

              expect(up.layer.current.mode).toBe('modal')
              expect(up.layer.current).toHaveText('initial text')
              expect(callback).not.toHaveBeenCalled()

              let matchingUpdateJob = up.render({ fragment: `
                <div id="fragment">
                  <span id="match">matching text</span>
                </div>
              `})
              await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(up.layer.current.mode).toBe('root')
              expect(document).not.toHaveSelector('#match')
              expect(callback).toHaveBeenCalled()
            })

            it('does not accept the layer when a matching fragment is rendered into a different layer', async function() {
              htmlFixtureList(`
                <div id="fragment">initial root text</div>
              `)

              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({
                onAccepted: callback,
                acceptFragment: '#match',
                fragment: `
                  <div id="fragment">
                    initial overlay text
                  </div>
                `
              })
              await wait()

              expect(up.layer.current.mode).toBe('modal')
              expect(up.layer.current).toHaveText('initial overlay text')
              expect(callback).not.toHaveBeenCalled()

              up.render({ layer: 'root', fragment: `
                <div id="fragment">
                  <div id="match">updated root text</div>
                </div>
              ` })
              await wait()

              expect(up.layer.current.mode).toBe('modal')
              expect(callback).not.toHaveBeenCalled()

              expect(up.fragment.get('#fragment', { layer: 'root' })).toHaveText('updated root text')
              expect(up.fragment.get('#fragment', { layer: 'overlay' })).toHaveText('initial overlay text')
            })

            it('does not compile the matching element', async function() {
              const compilerFn = jasmine.createSpy('compiler function')
              up.compiler('#match', compilerFn)

              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({
                onAccepted: callback,
                acceptFragment: '#match',
                fragment: `
                  <div id="fragment">
                    <span>initial text</span>
                  </div>
                `
              })
              await wait()

              expect(callback).not.toHaveBeenCalled()

              let matchingUpdateJob = up.render({ fragment: `
                <div id="fragment">
                  <span id="match">matching text</span>
                </div>
              `})
              await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(callback).toHaveBeenCalled()
              expect(up.layer.mode).toBe('root')
              expect(compilerFn).not.toHaveBeenCalled()
            })

            it('does not show the accepting fragment in a closing animation', async function() {
              up.motion.config.enabled = true

              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({
                onAccepted: callback,
                acceptFragment: '#match',
                fragment: `
                  <div id="fragment">
                    <span>initial text</span>
                  </div>
                `,
                closeAnimation: 'fade-out',
                closeDuration: 300,
                closeEasing: 'linear',
              })
              await wait()

              expect(callback).not.toHaveBeenCalled()

              let matchingUpdateJob = up.render({ fragment: `
                <div id="fragment">
                  <span id="match">matching text</span>
                </div>
              `})
              await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(callback).toHaveBeenCalled()
              expect(up.layer.mode).toBe('root')
              expect(document).toHaveSelector('up-modal')
              expect('up-modal-content').toHaveText('initial text')
              expect('up-modal-content').not.toHaveText('matching text')
              await wait(400)

              expect(document).not.toHaveSelector('up-modal')
            })

            it('allows the matching element to be consumed by a hungry fragment on a parent layer', async function() {
              htmlFixture(`
                <div id="fragment" up-hungry up-if-layer="any">
                  initial root text
                </div>
              `)

              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({
                onAccepted: callback,
                acceptFragment: '#match',
                fragment: `
                  <div id="fragment">
                    <span>initial overlay text</span>
                  </div>
                `
              })
              await wait()

              let matchingUpdateJob = up.render({ fragment: `
                <div id="fragment">
                  <span id="match">matching text</span>
                </div>
              `})
              await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(up.layer.current.mode).toBe('root')
              expect(callback).toHaveBeenCalled()
              expect(up.fragment.get('#fragment', { layer: 'root' })).toHaveSelector('#match')
              expect(up.fragment.get('#fragment', { layer: 'root' })).toHaveText('matching text')
            })

            it("uses the fragment's data as the acceptance value", async function() {
              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({
                onAccepted: callback,
                acceptFragment: '#match',
                fragment: `
                  <div id="fragment">
                    <span>initial text</span>
                  </div>
                `
              })
              await wait()

              expect(up.layer.current.mode).toBe('modal')
              expect(up.layer.current).toHaveText('initial text')
              expect(callback).not.toHaveBeenCalled()

              let matchingUpdateJob = up.render({ fragment: `
                <div id="fragment">
                  <span id="match" up-data="{ name: 'Bob' }">matching text</span>
                </div>
              `})
              await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(up.layer.current.mode).toBe('root')
              expect(document).not.toHaveSelector('#match')
              expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
                type: 'up:layer:accepted',
                value: { name: 'Bob' },
              }))
            })

            it('does not push a history entry if the response accepts the overlay', async function() {
              up.history.config.enabled = true
              up.history.replace('/root')
              up.history.config.restoreTargets = ['main']
              expect(up.history.location).toMatchURL('/root')

              htmlFixture(`
                <main>
                  <span>root text</span>
                </main>
              `)

              const callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({
                target: 'main',
                acceptFragment: '#match',
                onAccepted: callback,
                history: true,
                url: '/overlay1',
              })
              await wait()

              jasmine.respondWith(`
                <main>
                  <span>overlay1 text</span>
                </main>
              `)
              await wait()

              expect(up.layer.current.mode).toBe('modal')
              expect(up.layer.current).toHaveText('overlay1 text')
              expect(up.history.location).toMatchURL('/overlay1')
              expect(callback).not.toHaveBeenCalled()

              let matchingUpdateJob = up.render({ target: 'main', url: '/overlay2', history: true })
              await wait()

              jasmine.respondWith(`
                <main>
                  <span id="match">overlay2 text</span>
                </main>
              `)

              await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(callback).toHaveBeenCalled()
              expect(up.layer.current.mode).toBe('root')
              expect(up.history.location).toMatchURL('/root')

              history.back()
              await wait(400)

              expect(up.layer.current.mode).toBe('root')
              expect(up.history.location).toMatchURL('/overlay1')
              expect('main').toHaveText('overlay1 text')
            })

          })

          describe('when opening an overlay', function() {

            describe('when its initial content matches the given selector', function() {

              it('immediately accepts a layer when its initial content contains the given selector', async function() {
                const callback = jasmine.createSpy('onAccepted callback')

                const openPromise = up.layer.open({
                  onAccepted: callback,
                  acceptFragment: '#match',
                  fragment: `
                  <div id="container">
                    <div id="match" up-data="{ name: 'Bob' }">matching text</div>
                  </div>
                `
                })

                await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
                  type: 'up:layer:accepted',
                  value: { name: 'Bob' },
                }))

                expect(up.layer.mode).toBe('root')
                expect(document).not.toHaveSelector('#match')
              })

              it('immediately accepts a layer when its initial content matches the given selector', async function() {
                const callback = jasmine.createSpy('onAccepted callback')

                const openPromise = up.layer.open({
                  onAccepted: callback,
                  acceptFragment: '#match',
                  fragment: `
                    <div id="match" up-data="{ name: 'Bob' }">matching text</div>
                  `
                })
                await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({
                  type: 'up:layer:accepted',
                  value: { name: 'Bob' },
                }))

                expect(up.layer.mode).toBe('root')
                expect(document).not.toHaveSelector('#match')
              })

              it('does not compile the matching element', async function() {
                const compilerFn = jasmine.createSpy('compiler function')
                up.compiler('#match', compilerFn)

                const callback = jasmine.createSpy('onAccepted callback')
                const openPromise = up.layer.open({
                  onAccepted: callback,
                  acceptFragment: '#match',
                  fragment: `
                    <div id="match"></div>
                  `
                })
                await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(callback).toHaveBeenCalled()
                expect(up.layer.mode).toBe('root')
                expect(compilerFn).not.toHaveBeenCalled()
              })

              it('allows the matching element to be consumed by a hungry fragment on a parent layer', async function() {
                htmlFixture(`
                  <div id="fragment" up-hungry up-if-layer="any">
                    initial root text
                  </div>
                `)

                const callback = jasmine.createSpy('onAccepted callback')
                const openPromise = up.layer.open({
                  onAccepted: callback,
                  acceptFragment: '#fragment',
                  fragment: `
                    <div id="fragment">
                      matching text
                    </div>
                  `
                })
                await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(up.layer.current.mode).toBe('root')
                expect(callback).toHaveBeenCalled()
                expect(up.fragment.get('#fragment', { layer: 'root' })).toHaveText('matching text')
              })

              it('does not push a history entry', async function() {
                up.history.config.enabled = true
                up.history.config.restoreTargets = ['main']
                up.history.replace('/root1')
                expect(up.history.location).toMatchURL('/root1')
                htmlFixture(`<main>root1 text</main>`)

                up.render({ target: 'main', url: '/root2', history: true })
                await wait()

                jasmine.respondWith('<main>root2 text</main>')
                await wait()

                expect('main').toHaveText('root2 text')

                const callback = jasmine.createSpy('onAccepted callback')
                let matchingUpdateJob = up.layer.open({
                  target: 'main',
                  acceptFragment: '#match',
                  onAccepted: callback,
                  history: true,
                  url: '/overlay1',
                })
                await wait()

                // We wait if the response ends up being rendered, and with what URL.
                expect(callback).not.toHaveBeenCalled()

                jasmine.respondWith(`<main><span id="match">overlay1 text</span></main>`)
                await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(callback).toHaveBeenCalled()
                expect(up.layer.current.mode).toBe('root')
                expect(up.history.location).toMatchURL('/root2')
                expect('main').toHaveText('root2 text')

                history.back()
                await wait(400)

                expect(up.layer.current.mode).toBe('root')
                expect(up.history.location).toMatchURL('/root1')

                expect(up.network.isBusy()).toBe(true)
                expect(jasmine.lastRequest().url).toMatchURL('/root1')
              })

            })

          })
        })

        describe('{ dismissFragment }', function() {

          it('dismisses the layer when an fragment with the given selector is rendered into the layer', async function() {
            const callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({
              onDismissed: callback,
              dismissFragment: '#match',
              fragment: `
                  <div id="fragment">
                    <span>initial text</span>
                  </div>
                `
            })
            await wait()

            expect(up.layer.current.mode).toBe('modal')
            expect(up.layer.current).toHaveText('initial text')
            expect(callback).not.toHaveBeenCalled()

            let ignoredUpdateJob = up.render({ fragment: `
                <div id="fragment">
                  <span id="no-match">ignored update</span>
                </div>
              `})
            await expectAsync(ignoredUpdateJob).toBeResolvedTo(jasmine.any(up.RenderResult))

            expect(up.layer.current.mode).toBe('modal')
            expect(up.layer.current).toHaveText('ignored update')
            expect(callback).not.toHaveBeenCalled()

            let matchingUpdateJob = up.render({ fragment: `
              <div id="fragment">
                <span id="match">matching text</span>
              </div>
            `})
            await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(up.layer.current.mode).toBe('root')
            expect(document).not.toHaveSelector('#match')
            expect(callback).toHaveBeenCalled()
          })


        })

        describe('{ acceptLocation }', function() {

          beforeEach(function() {
            up.history.config.enabled = true
          })

          it('accepts the layer when the layer has reached the given location', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content',
              location: '/start-location',
              onAccepted: callback,
              acceptLocation: '/acceptable-location'
            })

            await wait()

            expect(up.layer.mode).toBe('modal')
            expect(callback).not.toHaveBeenCalled()

            up.navigate('.overlay-content', { content: 'other content', location: '/other-location' })
            await wait()

            expect(up.layer.mode).toBe('modal')
            expect(callback).not.toHaveBeenCalled()

            const closingJob = up.navigate('.overlay-content', {
              content: 'acceptable content',
              location: '/acceptable-location'
            })

            await expectAsync(closingJob).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(up.layer.mode).toBe('root')
            const value = { location: u.normalizeURL('/acceptable-location') }
            expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value }))
          })

          it('accepts the layer when the layer has reached the given location pattern', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content',
              location: '/start-location',
              onAccepted: callback,
              acceptLocation: '/users /records/* /articles'
            })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            const closingJob = up.navigate('.overlay-content', {
              content: 'acceptable content',
              location: '/records/new'
            })

            await expectAsync(closingJob).toBeRejectedWith(jasmine.any(up.Aborted))

            const value = { location: u.normalizeURL('/records/new') }
            expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value }))
          })

          it('parses a location pattern of named placeholders to produce an acceptance value', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content',
              location: '/start-location',
              onAccepted: callback,
              acceptLocation: '/records/:action/:id'
            })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            const closingJob = up.navigate('.overlay-content', {
              content: 'acceptable content',
              location: '/records/edit/123'
            })

            await expectAsync(closingJob).toBeRejectedWith(jasmine.any(up.Aborted))

            const value = {
              location: u.normalizeURL('/records/edit/123'),
              action: 'edit',
              id: '123'
            }

            expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value }))
          })

          it('accepts the layer when the layer has reached the given location but renders no history', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content',
              history: false,
              location: '/start-location',
              onAccepted: callback,
              acceptLocation: '/acceptable-location'
            })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            const closingJob = up.navigate('.overlay-content', {
              content: 'acceptable content',
              location: '/acceptable-location'
            })

            await expectAsync(closingJob).toBeRejectedWith(jasmine.any(up.Aborted))

            const value = { location: u.normalizeURL('/acceptable-location') }
            expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value }))
          })

          it('does not accept the layer when another layer has reached the given location', function() {
            const callback = jasmine.createSpy('onAccepted callback')

            makeLayers([
              { target: '.root-content' },
              { target: '.overlay-content', onAccepted: callback, acceptLocation: '/acceptable-location' }
            ])

            up.navigate('.root-content', { layer: 'root', content: 'new content', location: '/acceptable-location' })

            expect(callback).not.toHaveBeenCalled()
          })

          it('accepts the layer when the response redirects to the observed location', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content',
              location: '/start-location',
              onAccepted: callback,
              acceptLocation: '/acceptable-location'
            })

            await wait()

            expect(up.layer.mode).toBe('modal')
            expect(callback).not.toHaveBeenCalled()

            const closingJob = up.navigate({
              target: '.overlay-content',
              url: '/requested-location'
            })
            await wait()

            jasmine.respondWith({
              responseText: '<span class="overlay-content">You are being redirected</span>',
              responseURL: '/acceptable-location',
            })

            await expectAsync(closingJob).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(up.layer.mode).toBe('root')
            const value = { location: u.normalizeURL('/acceptable-location') }
            expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value }))
          })

          it('does not accept the layer when the observed location is requested, but ends up redirecting elsewhere', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content',
              location: '/start-location',
              onAccepted: callback,
              acceptLocation: '/acceptable-location'
            })

            await wait()

            expect(up.layer.mode).toBe('modal')
            expect(callback).not.toHaveBeenCalled()

            const closingJob = up.navigate({
              target: '.overlay-content',
              url: '/acceptable-location'
            })
            await wait()

            // We wait if the location ends up being rendered
            expect(callback).not.toHaveBeenCalled()

            jasmine.respondWith({
              responseText: '<span class="overlay-content">updated overlay content</span>',
              responseURL: '/redirect-location',
            })

            await expectAsync(closingJob).toBeResolvedTo(jasmine.any(up.RenderResult))

            expect(up.layer.mode).toBe('modal')
            expect(up.layer.location).toMatchURL('/redirect-location')
            expect(callback).not.toHaveBeenCalled()
          })

          it('allows the accepted response body to be consumed by a hungry element on another layer', async function() {
            pending("test me")
          })

          it('does not push a history entry if the response accepts the overlay', async function() {
            up.history.config.enabled = true
            up.history.replace('/root')
            up.history.config.restoreTargets = ['main']
            expect(up.history.location).toMatchURL('/root')

            htmlFixture(`<main>root text</main>`)

            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: 'main',
              acceptLocation: '/overlay2',
              onAccepted: callback,
              history: true,
              url: '/overlay1',
            })
            await wait()

            jasmine.respondWith(`<main>overlay1 text</main>`)
            await wait()

            expect(up.layer.current.mode).toBe('modal')
            expect(up.layer.current).toHaveText('overlay1 text')
            expect(up.history.location).toMatchURL('/overlay1')
            expect(callback).not.toHaveBeenCalled()

            let matchingUpdateJob = up.render({ target: 'main', url: '/overlay2', history: true })
            await wait()

            // We wait if the response ends up being rendered, and with what URL.
            expect(callback).not.toHaveBeenCalled()

            jasmine.respondWith(`<main>overlay2 text</main>`)

            await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(callback).toHaveBeenCalled()
            expect(up.layer.current.mode).toBe('root')
            expect(up.history.location).toMatchURL('/root')

            history.back()
            await wait(400)

            expect(up.layer.current.mode).toBe('root')
            expect(up.history.location).toMatchURL('/overlay1')
            expect('main').toHaveText('overlay1 text')
          })

          describe('when opening an overlay', function() {

            it('immediately accepts a new overlay when its initial location matches the given location', async function() {
              up.history.replace('/root-path')
              expect(up.history.location).toMatchURL('/root-path')

              const callback = jasmine.createSpy('onAccepted callback')

              const compiler = jasmine.createSpy('compiler')
              up.compiler('.overlay-content', compiler)

              const openPromise = up.layer.open({
                target: '.overlay-content',
                history: true,
                onAccepted: callback,
                url: '/overlay-path',
                acceptLocation: '/overlay-path',
              })

              await wait()

              expect(up.layer.mode).toBe('root')
              expect(callback).not.toHaveBeenCalled()

              jasmine.respondWithSelector('.overlay-content', { text: 'initial content' })

              // await wait()

              await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))
              expect(callback).toHaveBeenCalled()
              expect(up.layer.mode).toBe('root')
              expect(up.history.location).toMatchURL('/root-path')

              expect(document).not.toHaveSelector('.overlay-content')
              expect(compiler).not.toHaveBeenCalled()
            })

            it('does not immediately accept a layer if its parent layer is already on the given location (bugfix)', async function() {
              up.history.replace('/root-path')
              expect(up.history.location).toMatchURL('/root-path')

              const callback = jasmine.createSpy('onAccepted callback')

              up.layer.open({
                target: '.overlay-content',
                history: true,
                onAccepted: callback,
                url: '/overlay-path',
                acceptLocation: '/root-path',
              })

              await wait()

              expect(up.layer.mode).toBe('root')
              expect(callback).not.toHaveBeenCalled()

              jasmine.respondWithSelector('.overlay-content', { text: 'initial content' })

              await wait()

              expect(callback).not.toHaveBeenCalled()
              expect(up.layer.mode).toBe('modal')
              expect(up.history.location).toMatchURL('/overlay-path')

              const navigatePromise = up.navigate({ url: '/root-path' })

              await wait()

              jasmine.respondWithSelector('.overlay-content', { text: 'next content' })

              await expectAsync(navigatePromise).toBeRejectedWith(jasmine.any(up.Aborted))
              expect(callback).toHaveBeenCalled()
              expect(up.layer.mode).toBe('root')
              expect(up.history.location).toMatchURL('/root-path')
            })

            it('does not push a history if the initial response closes the overlay', async function() {
              up.history.config.enabled = true
              up.history.config.restoreTargets = ['main']
              up.history.replace('/root1')
              expect(up.history.location).toMatchURL('/root1')
              htmlFixture(`<main>root1 text</main>`)

              up.render({ target: 'main', url: '/root2', history: true })
              await wait()

              jasmine.respondWith('<main>root2 text</main>')
              await wait()

              expect('main').toHaveText('root2 text')

              const callback = jasmine.createSpy('onAccepted callback')
              let matchingUpdateJob = up.layer.open({
                target: 'main',
                acceptLocation: '/overlay1',
                onAccepted: callback,
                history: true,
                url: '/overlay1',
              })
              await wait()

              // We wait if the response ends up being rendered, and with what URL.
              expect(callback).not.toHaveBeenCalled()

              jasmine.respondWith(`<main>overlay1 text</main>`)
              await expectAsync(matchingUpdateJob).toBeRejectedWith(jasmine.any(up.Aborted))

              expect(callback).toHaveBeenCalled()
              expect(up.layer.current.mode).toBe('root')
              expect(up.history.location).toMatchURL('/root2')
              expect('main').toHaveText('root2 text')

              history.back()
              await wait(400)

              expect(up.layer.current.mode).toBe('root')
              expect(up.history.location).toMatchURL('/root1')

              expect(up.network.isBusy()).toBe(true)
              expect(jasmine.lastRequest().url).toMatchURL('/root1')

            })

          })

          it('makes the discarded response available to up:layer:accepted listeners as a { response } property', async function() {
            const callback = jasmine.createSpy('onAccepted callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content',
              location: '/start-location',
              onAccepted: callback,
              acceptLocation: '/acceptable-location'
            })

            await wait()

            expect(up.layer.mode).toBe('modal')
            expect(callback).not.toHaveBeenCalled()

            const closingJob = up.navigate('.overlay-content', { url: '/acceptable-location', history: true })

            await wait()

            expect(up.layer.mode).toBe('modal')
            expect(callback).not.toHaveBeenCalled()

            jasmine.respondWith('<div class="overlay-content">closing content</div>')

            await expectAsync(closingJob).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(up.layer.mode).toBe('root')
            expect(callback.calls.mostRecent().args[0].response).toEqual(jasmine.any(up.Response))
            expect(callback.calls.mostRecent().args[0].response.text).toBe('<div class="overlay-content">closing content</div>')
          })
        })

        describe('{ dismissLocation }', function() {

          beforeEach(function() {
            up.history.config.enabled = true
          })

          it('dismisses the layer when the layer has reached the given location', async function() {
            const callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({
              target: '.overlay-content',
              content: 'start content',
              location: '/start-location',
              onDismissed: callback,
              dismissLocation: '/dismissible-location'
            })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            up.navigate('.overlay-content', { content: 'other content', location: '/other-location' })

            await wait()

            expect(callback).not.toHaveBeenCalled()

            const closingJob = up.navigate('.overlay-content', {
              content: 'dismissible content',
              location: '/dismissible-location'
            })

            await expectAsync(closingJob).toBeRejectedWith(jasmine.any(up.Aborted))

            const value = { location: u.normalizeURL('/dismissible-location') }
            expect(callback).toHaveBeenCalledWith(jasmine.objectContaining({ value }))
          })
        })
      })
    })

  })

})
