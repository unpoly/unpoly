const e = up.element

extendDescribe('up.status', function() {

  extendDescribe('JavaScript functions', function() {

    describe('up.render()', function() {

      describe('with { preview } option', function() {

        describe('call variants', function() {

          it('runs a named preview with an empty data object', async function() {
            let previewFn = jasmine.createSpy('preview function')
            up.preview('my-preview', previewFn)

            up.render({ preview: 'my-preview', url: '/path', target: 'body' })

            await wait()

            expect(previewFn).toHaveBeenCalledWith(jasmine.any(up.Preview), {})
          })

          it('runs multiple named previews, separated by a comma', async function() {
            let preview1Fn = jasmine.createSpy('preview1')
            up.preview('preview1', preview1Fn)
            let preview2Fn = jasmine.createSpy('preview2')
            up.preview('preview2', preview2Fn)

            up.render({ preview: 'preview1, preview2', url: '/path', target: 'body' })

            await wait()

            expect(preview1Fn).toHaveBeenCalledWith(jasmine.any(up.Preview), {})
            expect(preview2Fn).toHaveBeenCalledWith(jasmine.any(up.Preview), {})
          })

          it('runs a named preview with a JSON data object', async function() {
            let previewFn = jasmine.createSpy('preview function')
            up.preview('my-preview', previewFn)

            up.render({ preview: 'my-preview { foo: 1, bar: 2 }', url: '/path', target: 'body' })

            await wait()

            expect(previewFn).toHaveBeenCalledWith(jasmine.any(up.Preview), { foo: 1, bar: 2 })
          })

          it('runs multiple comma-separated named previews with an JSON data object each', async function() {
            let preview1Fn = jasmine.createSpy('preview1')
            up.preview('preview1', preview1Fn)
            let preview2Fn = jasmine.createSpy('preview2')
            up.preview('preview2', preview2Fn)

            up.render({ preview: 'preview1 { foo: 1 }, preview2 { bar: 2 }', url: '/path', target: 'body' })

            await wait()

            expect(preview1Fn).toHaveBeenCalledWith(jasmine.any(up.Preview), { foo: 1 })
            expect(preview2Fn).toHaveBeenCalledWith(jasmine.any(up.Preview), { bar: 2 })
          })

          it('runs an array of named previews', async function() {
            let preview1Fn = jasmine.createSpy('preview1')
            up.preview('preview1', preview1Fn)
            let preview2Fn = jasmine.createSpy('preview2')
            up.preview('preview2', preview2Fn)

            up.render({ preview: ['preview1', 'preview2'], url: '/path', target: 'body' })

            await wait()

            expect(preview1Fn).toHaveBeenCalledWith(jasmine.any(up.Preview), {})
            expect(preview2Fn).toHaveBeenCalledWith(jasmine.any(up.Preview), {})
          })

          it('runs an anonymous preview function', async function() {
            let previewFn = jasmine.createSpy('preview function')

            up.render({ preview: previewFn, url: '/path', target: 'body' })

            await wait()

            expect(previewFn).toHaveBeenCalledWith(jasmine.any(up.Preview), {})
          })

          it('runs an array of anonymous preview functions', async function() {
            let preview1Fn = jasmine.createSpy('preview1')
            let preview2Fn = jasmine.createSpy('preview2')

            up.render({ preview: [preview1Fn, preview2Fn], url: '/path', target: 'body' })

            await wait()

            expect(preview1Fn).toHaveBeenCalledWith(jasmine.any(up.Preview), {})
            expect(preview2Fn).toHaveBeenCalledWith(jasmine.any(up.Preview), {})
          })

        })

        describe('setting up.layer.current', function() {

          it('sets up.layer.current when applying a preview to a non-current layer', async function() {
            makeLayers(2)
            expect(up.layer.current).toBeOverlay()

            let layerSpy = jasmine.createSpy('layer spy')
            let previewFn = jasmine.createSpy('preview function').and.callFake(() => layerSpy(up.layer.current))
            up.preview('my-preview', previewFn)

            up.render({ preview: 'my-preview', url: '/path', target: 'body', layer: 'root' })
            await wait()

            expect(previewFn).toHaveBeenCalled()
            expect(layerSpy).toHaveBeenCalledWith(up.layer.root)
          })

          it('sets up.layer.current when reverting a preview to a non-current layer', async function() {
            makeLayers(2)
            expect(up.layer.current).toBeOverlay()

            let layerSpy = jasmine.createSpy('layer spy')
            let undoFn = jasmine.createSpy('undo').and.callFake(() => layerSpy(up.layer.current))
            let previewFn = jasmine.createSpy('preview function').and.callFake(() => undoFn)
            up.preview('my-preview', previewFn)

            let renderPromise = up.render({ preview: 'my-preview', url: '/path', target: 'body', layer: 'root' })
            await wait()

            expect(previewFn).toHaveBeenCalled()

            up.network.abort()
            await expectAsync(renderPromise).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(undoFn).toHaveBeenCalled()
            expect(layerSpy).toHaveBeenCalledWith(up.layer.root)
          })

        })

        describe('reasons why previews are not shown', function() {

          it('does not show a preview when preloading a link with preview', async function() {
            let link = fixture('a[href="/path"]')
            let previewFn = jasmine.createSpy('preview function')

            up.link.preload(link, { preview: previewFn })

            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(previewFn).not.toHaveBeenCalled()
          })

          it('does not show a preview when the response is already cached', async function() {
            fixture('#target', { text: 'old target' })
            await jasmine.populateCache('/path', '<div id="target">cached target</div>')
            let previewFn = jasmine.createSpy('preview function')

            up.render({ preview: previewFn, url: '/path', target: '#target', cache: true })

            await wait()

            expect('#target').toHaveText('cached target')

            expect(previewFn).not.toHaveBeenCalled()
          })

          it('does apply a preview when we track a cached, but pending request', async function() {
            fixture('#target', { text: 'old target' })
            up.request({ url: '/path', cache: true })
            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(1)

            let previewFn = jasmine.createSpy('preview function')

            up.render({ preview: previewFn, url: '/path', target: '#target', cache: true })

            await wait()

            // We are tracking the existing request
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(previewFn).toHaveBeenCalled()

            jasmine.respondWithSelector('#target', { text: 'new target' })
            await wait()

            expect('#target').toHaveText('new target')
          })

          it('applies and reverts each preview when we track a cached, but pending request that also has previews', async function() {
            let undo1Fn = jasmine.createSpy('preview1 undo fn')
            let preview1Fn = jasmine.createSpy('preview1 apply fn').and.returnValue(undo1Fn)
            let undo2Fn = jasmine.createSpy('preview2 undo fn')
            let preview2Fn = jasmine.createSpy('preview2 apply fn').and.returnValue(undo2Fn)

            fixture('#target1', { text: 'old target1' })
            fixture('#target2', { text: 'old target2' })

            up.render({ preview: preview1Fn, url: '/path', target: '#target1', cache: true })
            await wait()

            // The initial request has been sent and its preview is showing
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(preview1Fn).toHaveBeenCalled()

            up.render({ preview: preview2Fn, url: '/path', target: '#target2', cache: true })
            await wait()

            // We are tracking the existing request
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(preview2Fn).toHaveBeenCalled()

            jasmine.respondWith(`
              <main>
                <div id="target1">new target1</div>
                <div id="target2">new target2</div>
              </main>
            `)
            await wait()

            expect(undo1Fn).toHaveBeenCalled()
            expect(undo2Fn).toHaveBeenCalled()

            expect('#target1').toHaveText('new target1')
            expect('#target2').toHaveText('new target2')
          })

          it('does not apply an [up-preview] function when the rendering function overrides with { preview: false }', async function() {
            fixture('#target')
            let previewFn = jasmine.createSpy('preview function')
            up.preview('my:preview', previewFn)
            let link = fixture('a[href="/path"][up-preview="my:preview"][up-target="#target"]')

            up.link.follow(link, { preview: false })
            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(previewFn).not.toHaveBeenCalled()
          })

          it('does not apply a preview if no element matches the target', async function() {
            let previewFn = jasmine.createSpy('preview function')
            up.preview('my:preview', previewFn)

            let renderPromise = up.render({ url: '/path', target: '#missing' })

            await expectAsync(renderPromise).toBeRejectedWith(jasmine.any(up.CannotMatch))
            expect(previewFn).not.toHaveBeenCalled()
          })

        })

        describe('when revalidating', function() {

          it('does not use a { preview } option', async function() {
            fixture('#target', { text: 'old target' })
            await jasmine.populateCache('/path', '<div id="target">cached target</div>')
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(up.network.isBusy()).toBe(false)

            up.cache.expire()

            expect({ url: '/path' }).toBeCached()
            expect({ url: '/path' }).toBeExpired()

            let previewFn = jasmine.createSpy('preview function')
            up.render({ target: '#target', url: '/path', cache: true, revalidate: true, preview: previewFn })
            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(2)
            expect(up.network.isBusy()).toBe(true)
            expect('#target').toHaveText('cached target')
            expect(previewFn).not.toHaveBeenCalled()

            jasmine.respondWithSelector('#target', { text: 'revalidated target' })
            await wait()

            expect('#target').toHaveText('revalidated target')
          })

          it('re-uses a { preview } option with { revalidatePreview: true }', async function() {
            fixture('#target', { text: 'old target' })
            await jasmine.populateCache('/path', '<div id="target">cached target</div>')
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(up.network.isBusy()).toBe(false)

            up.cache.expire()

            expect({ url: '/path' }).toBeCached()
            expect({ url: '/path' }).toBeExpired()

            let previewFn = jasmine.createSpy('preview function')
            up.render({
              target: '#target',
              url: '/path',
              cache: true,
              revalidate: true,
              preview: previewFn,
              revalidatePreview: true
            })
            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(2)
            expect(up.network.isBusy()).toBe(true)
            expect('#target').toHaveText('cached target')
            expect(previewFn).toHaveBeenCalledWith(jasmine.any(up.Preview), {})

            jasmine.respondWithSelector('#target', { text: 'revalidated target' })
            await wait()

            expect('#target').toHaveText('revalidated target')
          })

          it('uses a preview from a { revalidatePreview } option', async function() {
            fixture('#target', { text: 'old target' })
            await jasmine.populateCache('/path', '<div id="target">cached target</div>')
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(up.network.isBusy()).toBe(false)

            up.cache.expire()

            expect({ url: '/path' }).toBeCached()
            expect({ url: '/path' }).toBeExpired()

            let previewFn = jasmine.createSpy('preview function')
            let revalidatePreviewFn = jasmine.createSpy('revalidatePreview function')
            up.render({
              target: '#target',
              url: '/path',
              cache: true,
              revalidate: true,
              preview: previewFn,
              revalidatePreview: revalidatePreviewFn
            })
            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(2)
            expect(up.network.isBusy()).toBe(true)
            expect('#target').toHaveText('cached target')
            expect(previewFn).not.toHaveBeenCalled()
            expect(revalidatePreviewFn).toHaveBeenCalledWith(jasmine.any(up.Preview), {})

            jasmine.respondWithSelector('#target', { text: 'revalidated target' })
            await wait()

            expect('#target').toHaveText('revalidated target')
          })

        })

        describe('reverting preview effects', function() {

          it('considers the return value of a preview function to be a revertible effect')

          it('reverts an preview before rendering', async function() {
            fixture('#target', { text: 'old target' })
            let revertSpy = jasmine.createSpy('revert fn')

            up.render({ url: '/path', target: '#target', preview: ((preview) => revertSpy) })
            await wait()

            expect(revertSpy).not.toHaveBeenCalled()

            jasmine.respondWithSelector('#target', { text: 'new target' })
            await wait()

            expect(revertSpy).toHaveBeenCalled()
          })

          it('reverts a preview when the targeted fragment is aborted', async function() {
            let target = fixture('#target')
            let revertSpy = jasmine.createSpy('revert fn')

            let renderPromise = up.render({ url: '/path', target: '#target', preview: ((preview) => revertSpy) })
            await wait()

            expect(revertSpy).not.toHaveBeenCalled()

            up.fragment.abort(target)
            await expectAsync(renderPromise).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(revertSpy).toHaveBeenCalled()
          })

          it('reverts a preview when a fragment is aborted', async function() {
            fixture('#target', { text: 'old target' })
            let revertSpy = jasmine.createSpy('revert fn')

            let renderPromise = up.render({ url: '/path', target: '#target', preview: ((preview) => revertSpy) })
            await wait()

            expect(revertSpy).not.toHaveBeenCalled()

            up.fragment.abort('#target')
            await expectAsync(renderPromise).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(revertSpy).toHaveBeenCalled()
          })

          it('reverts the preview before a local update changes the same fragment', async function() {
            fixture('#target', { text: 'old target' })
            let observedActions = []

            let previewFn = function() {
              observedActions.push('preview:apply')
              return () => observedActions.push('preview:revert')
            }

            up.on('up:fragment:inserted', () => observedActions.push('fragment:inserted'))

            let renderPromise = up.render({ url: '/path', target: '#target', preview: previewFn })
            await wait()

            expect(observedActions).toEqual(['preview:apply'])

            up.render({ target: '#target', fragment: '<div id="target">new target</div>' })

            await expectAsync(renderPromise).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(observedActions).toEqual(['preview:apply', 'preview:revert', 'fragment:inserted'])
          })

          it('reverts a previous preview before a new preview is applied to the same fragment', async function() {
            fixture('#target', { text: 'old target' })

            let actions = []

            let preview1Fn = () => {
              actions.push('apply1')
              return () => actions.push('revert1')
            }

            let preview2Fn = () => {
              actions.push('apply2')
              return () => actions.push('revert2')
            }

            let render1Promise = up.render({ preview: [preview1Fn], url: '/path', target: '#target' })
            await wait()

            expect(actions).toEqual(['apply1'])

            let render2Promise = up.render({ preview: [preview2Fn], url: '/path', target: '#target' })
            await expectAsync(render1Promise).toBeRejectedWith(jasmine.any(up.Error))

            expect(actions).toEqual(['apply1', 'revert1', 'apply2'])

            jasmine.respondWithSelector('#target', { text: 'new target' })

            await wait()

            expect('#target').toHaveText('new target')
            expect(actions).toEqual(['apply1', 'revert1', 'apply2', 'revert2'])
          })

          it('reverts a previous preview before a preview-less render pass updates the same fragment', async function() {
            fixture('#target', { text: 'old target' })

            let actions = []

            let previewFn = () => {
              actions.push('preview:apply')
              return () => actions.push('preview:revert')
            }

            up.on('up:fragment:inserted', () => {
              actions.push('fragment:insert')
            })

            let render1Promise = up.render({ preview: previewFn, url: '/path1', target: '#target' })
            await wait()

            expect(actions).toEqual(['preview:apply'])

            let render2Promise = up.render({ url: '/path2', target: '#target' })
            await expectAsync(render1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
            await wait()

            expect(actions).toEqual(['preview:apply', 'preview:revert'])

            jasmine.respondWithSelector('#target', { text: 'text from render2' })

            await wait()

            expect('#target').toHaveText('text from render2')
            expect(actions).toEqual(['preview:apply', 'preview:revert', 'fragment:insert'])
          })

        })

        describe('error handling', function() {

          it('does not crash the render pass if a preview throws an error', async function() {
            let error = new Error("Error during preview")
            let previewFn = jasmine.createSpy('previewFn').and.throwError(error)

            await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
              let renderPromise = up.render({ preview: previewFn, url: '/path', target: 'body' })
              await wait()
              expect(previewFn).toHaveBeenCalled()
              expect(globalErrorSpy).toHaveBeenCalledWith(error)
              await expectAsync(renderPromise).toBePending()
            })
          })

          it('does not crash the render pass if reverting a preview throws an error', async function() {
            fixture('#target', { text: 'old target' })

            let error = new Error("Error during revert")
            let previewFn = () => {
              return () => { throw error }
            }

            let renderPromise = up.render({ preview: previewFn, url: '/path', target: 'body' })

            await wait()

            await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
              expect(globalErrorSpy).not.toHaveBeenCalled()
              jasmine.respondWithSelector('#target', { text: 'new target' })
              await wait()
              await expectAsync(renderPromise).toBePending()
              expect(globalErrorSpy).toHaveBeenCalledWith(error)
            })
          })

        })

        describe('focus preservation', function() {

          beforeEach(up.specUtil.assertTabFocused)

          it('honors { focus: "keep" } when the focused element is temporarily detached by the preview', async function() {
            let container = fixture('.container')
            let oldFocused = e.affix(container, '.focused[tabindex=0]', { text: 'Old content' })
            oldFocused.focus()
            expect(oldFocused).toBeFocused()

            let previewFn = function(preview) {
              preview.swapContent('Previewing content')
            }

            up.render({ target: '.container', focus: 'keep', url: '/path', preview: previewFn })
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect('.container').toHaveVisibleText('Previewing content')
            expect('.focused').not.toBeFocused()

            jasmine.respondWith(`
              <div class="container">
                <div class="focused" tabindex="0">
                   New content
                 </div>
              </div>
            `)

            await wait()

            expect('.container').toHaveText('New content')
            expect('.focused').toBeFocused()
          })

          it('honors { focus: "keep" } when the user focuses a new element while the preview is showing', async function() {
            let [target, insideFocusable] = htmlFixtureList(`
              <div id="target">
                <div id="inside-focusable" tabindex="0">
                  Old content
                </div>
              </div>
            `)

            insideFocusable.focus()
            let outsideFocusable = fixture('#outside-focusable[tabindex=0]', { text: 'Outside focusable' })
            expect(insideFocusable).toBeFocused()

            let previewFn = function(preview) {
              preview.swapContent('Previewing content')
            }

            up.render({ target: '#target', focus: 'keep', url: '/path', preview: previewFn })
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect('#target').toHaveVisibleText('Previewing content')

            expect(insideFocusable).not.toBeFocused()
            expect(outsideFocusable).not.toBeFocused()

            // User focuses a jnew element while the preview is showing
            Trigger.focusWithMouseSequence(outsideFocusable)
            expect(outsideFocusable).toBeFocused()

            jasmine.respondWith(`
              <div id="target">
                <div id="inside-focusable" tabindex="0">
                  New content
                </div>
              </div>
            `)

            await wait()

            expect('#target').toHaveText('New content')
            expect(outsideFocusable).toBeFocused()
          })

          it('does not reset cursor positions that were changed while the request is underway (bugfix)', async function() {
            let outsideTextField = fixture('input[type="text"][name="foo"]')
            let target = fixture('form#target')
            // Have some field to disable in order to provoke the issue
            let insideTextField = e.affix(target, 'input[type="text"][name="bar"]')

            outsideTextField.focus()
            outsideTextField.value = 'abcdefghijklmnopqurstuvwxyz'
            outsideTextField.selectionStart = 3
            outsideTextField.selectionEnd = 5

            let previewFn = function(preview) {
              preview.disable(preview.fragment)
            }

            up.render({ target: '#target', focus: 'keep', url: '/path', preview: previewFn })
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(insideTextField).toBeDisabled()
            expect(outsideTextField).toBeFocused()
            expect(outsideTextField.selectionStart).toBe(3)
            expect(outsideTextField.selectionEnd).toBe(5)

            outsideTextField.selectionStart = 8
            outsideTextField.selectionEnd = 10
            await wait()

            expect(outsideTextField).toBeFocused()
            expect(outsideTextField.selectionStart).toBe(8)
            expect(outsideTextField.selectionEnd).toBe(10)

            jasmine.respondWithSelector('#target', { text: 'New target' })
            await wait()

            expect('#target').toHaveText('New target')
            expect(outsideTextField).toBeFocused()
            expect(outsideTextField.selectionStart).toBe(8)
            expect(outsideTextField.selectionEnd).toBe(10)
          })

        })

      })

      describe('with { placeholder } option', function() {

        // Also see specs for up.Preview#showPlaceholder()
        it('renders a UI placeholder as the content of the first targeted fragment', async function() {
          htmlFixture(`
            <main>
              <div id="target1">
                <span class="content">old target1</span>
              </div>
              <div id="target2">
                <span class="content">old target2</span>
              </div>
              <div id="hungry" up-hungry>
                <span class="content">old hungry</span>
              </div>
              <template id="placeholder-template">
                <div class="placeholder">loading...</div>
              </template>
            </main>
          `)

          up.render({ url: '/path', target: '#target1, #target2', placeholder: '#placeholder-template' })

          await wait()

          expect('#target1').toHaveSelector('.placeholder')
          expect('#target2').not.toHaveSelector('.placeholder')
          expect('#hungry').not.toHaveSelector('.placeholder')

          jasmine.respondWith(`
            <main>
              <div id="target1">
                <span class="content">new target1</span>
              </div>
              <div id="target2">
                <span class="content">new target2</span>
              </div>
              <div id="hungry" up-hungry>
                <span class="content">new hungry</span>
              </div>
            </main>
          `)

          await wait()

          expect('#target1').toHaveText('new target1')
          expect('#target2').toHaveText('new target2')
          expect('#hungry').toHaveText('new hungry')
        })

      })

    })

  })

})
