const e = up.element

extendDescribe('up.link', function() {

  extendDescribe('unobtrusive behavior', function() {

    describe('[up-defer]', function() {

      it('loads a partial in a new request and replaces itself', async function() {
        const partial = fixture('a#slow[up-defer][href="/slow-path"]')
        up.hello(partial)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#slow')

        jasmine.respondWithSelector('#slow', { text: 'partial content' })

        await wait()

        expect('#slow').toHaveText('partial content')
      })

      it('loads a partial in a new request and replaces a selector from [up-target] attribute', async function() {
        const target = fixture('#target', { text: 'old target' })
        const partial = fixture('a#slow[up-defer][href="/slow-path"][up-target="#target"]')
        up.hello(partial)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#target')

        jasmine.respondWithSelector('#target', { text: 'new target' })

        await wait()

        expect('#target').toHaveText('new target')
      })

      describe('progress bar', function() {

        it('makes a foreground request by default', async function() {
          const partial = fixture('a#slow[up-defer][href="/slow-path"]')
          up.hello(partial)

          const event = await jasmine.nextEvent('up:request:load')

          expect(event.request.background).not.toBe(true)
        })

        it('makes a background request with [up-background=true]', async function() {
          const partial = fixture('a#slow[up-defer][href="/slow-path"][up-background=true]')
          up.hello(partial)

          const event = await jasmine.nextEvent('up:request:load')

          expect(event.request.background).toBe(true)
        })
      })

      it('does not update history, even when targeting an auto-history-target', async function() {
        up.history.config.enabled = true
        up.fragment.config.autoHistoryTargets.unshift('#slow')
        up.history.replace('/original-path')

        expect(up.history.location).toMatchURL('/original-path')

        const partial = fixture('a#slow[up-defer][href="/slow-path"]')
        up.hello(partial)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        jasmine.respondWithSelector('#slow', { text: 'partial content' })

        await wait()

        expect('#slow').toHaveText('partial content')
        expect(up.history.location).toMatchURL('/original-path')
      })

      it('aborts loading the deferred when another render pass targets the link container', async function() {
        const container = fixture('#container')
        const partial = e.affix(container, 'a#slow[up-defer][href="/slow-path"]', { text: 'initial content' })
        up.hello(partial)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#slow')

        up.fragment.abort(container)

        await wait()

        expect(up.network.isBusy()).toBe(false)
        expect('#slow').toHaveText('initial content')
      })

      it('does not update the main element if the response has no matching elements', async function() {
        up.fragment.config.mainTargets = ['#main']
        fixture('#main', { text: 'old main content' })

        const partial = fixture('a#partial[up-defer][href="/partial-path"]', { text: 'old partial content' })
        up.hello(partial)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/partial-path')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#partial')

        await jasmine.expectGlobalError('up.CannotMatch', async function() {
          // Server unexpectedly responds with #main instead of #partial
          jasmine.respondWithSelector('#main', { text: 'new main content' })

          // For some reason we need to wait a second task to be able to observe the global error.
          await jasmine.waitTasks(2)
        })

        expect('#partial').toHaveText('old partial content')
        expect('#main').toHaveText('old main content')
      })

      describe('on a non-interactive element', function() {

        it('works on a div[up-href][up-defer]', async function() {
          const partial = fixture('div#slow[up-defer][up-href="/slow-path"]')
          up.hello(partial)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#slow')

          jasmine.respondWithSelector('#slow', { text: 'partial content' })

          await wait()

          expect('#slow').toHaveText('partial content')
        })

        it('does not have a pointer cursor from an [up-href] attribute', function() {
          const partial = fixture('span#slow[up-defer=manual][up-href="/slow-path"]')
          up.hello(partial)

          expect(partial).not.toHaveCursorStyle('pointer')
        })
      })

      describe('when the URL is already cached', function() {

        it('does not show a flash of unloaded partial and immediately renders the cached content', async function() {
          await jasmine.populateCache('/slow-path', '<div id="partial">partial content</div>')

          const partial = fixture('a#partial[up-defer][href="/slow-path"]')
          up.hello(partial)

          // Rendering from cached content happens after a chain of microtasks.
          // We do not know the length of that chain. We only care that happens before the next paint.
          await jasmine.waitMicrotasks(5)

          expect('div#partial').toHaveText('partial content')

          await wait()

          // No additional request was made
          expect(up.network.isBusy()).toBe(false)
        })

        it('revalidates the cached content', async function() {
          up.network.config.cacheExpireAge = 5
          await jasmine.populateCache('/slow-path', '<div id="partial">cached partial</div>')

          // Let the cache entry expire
          await wait(30)
          expect(up.cache.get({ url: '/slow-path' }).response.expired).toBe(true)

          const partial = fixture('a#partial[up-defer][href="/slow-path"]')
          up.hello(partial)

          // Rendering from cached content happens after a chain of microtasks.
          // We do not know the length of that chain. We only care that happens before the next paint.
          await jasmine.waitMicrotasks(5)

          expect('div#partial').toHaveText('cached partial')

          await wait()

          expect(up.network.isBusy()).toBe(true)
          jasmine.respondWith('<div id="partial">revalidated partial</div>')

          await wait()

          expect('div#partial').toHaveText('revalidated partial')
        })

        it('does not use the cache with [up-cache=false]', async function() {
          await jasmine.populateCache('/slow-path', '<div id="partial">partial content</div>')

          const partial = fixture('a#partial[up-defer][href="/slow-path"][up-cache="false"]', { text: 'initial content' })
          up.hello(partial)

          await wait()

          expect('#partial').toHaveText('initial content')
          expect(up.network.isBusy()).toBe(true)

          jasmine.respondWithSelector('#partial', { text: 'fresh content' })

          await wait()

          expect('div#partial').toHaveText('fresh content')
          expect(up.network.isBusy()).toBe(false)
        })
      })

      describe('multiple partials in a single render pass', function() {

        it('makes a single request with merged targets to the same URL', async function() {
          const container = fixture('#container')
          e.affix(container, 'a#partial1[up-defer][href="/slow-path"]')
          e.affix(container, 'a#partial2[up-defer][href="/slow-path"]')
          up.hello(container)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#partial1, #partial2')

          jasmine.respondWith(`
            <div id="partial1">partial1 content</div>
            <div id="partial2">partial2 content</div>
          `)

          await wait()

          expect('#partial1').toHaveText('partial1 content')
          expect('#partial2').toHaveText('partial2 content')
        })

        it('makes separate requests to different URLs', async function() {
          const container = fixture('#container')
          e.affix(container, 'a#partial1[up-defer][href="/partial1-path"]')
          e.affix(container, 'a#partial2[up-defer][href="/partial2-path"]')
          up.hello(container)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(2)
          expect(jasmine.Ajax.requests.at(0).url).toMatchURL('/partial1-path')
          expect(jasmine.Ajax.requests.at(0).requestHeaders['X-Up-Target']).toBe('#partial1')
          expect(jasmine.Ajax.requests.at(1).url).toMatchURL('/partial2-path')
          expect(jasmine.Ajax.requests.at(1).requestHeaders['X-Up-Target']).toBe('#partial2')

          jasmine.respondWith({ request: 0, responseText: '<div id="partial1">partial1 content</div>' })
          jasmine.respondWith({ request: 1, responseText: '<div id="partial2">partial2 content</div>' })

          await wait()

          expect('#partial1').toHaveText('partial1 content')
          expect('#partial2').toHaveText('partial2 content')
        })
      })

      describe('feedback classes', function() {

        it('receives an .up-active class while loading', async function() {
          const partial = fixture('a#slow[up-defer][href="/slow-path"]')
          up.hello(partial)

          await wait()

          expect('#slow').toHaveClass('up-active')

          jasmine.respondWithSelector('#slow', { text: 'partial content' })

          await wait()

          expect('#slow').toHaveText('partial content')
          expect('#slow').not.toHaveClass('up-active')
        })

        it('receives no .up-active class with [up-feedback=false]', async function() {
          const partial = fixture('a#slow[up-defer][href="/slow-path"][up-feedback="false"]')
          up.hello(partial)

          await wait()

          expect('#slow').not.toHaveClass('up-active')
        })
      })

      describe("with [up-defer=insert]", function() {
        it('loads the partial as soon as it is inserted into the DOM (default)', async function() {
          const partial = fixture('a#slow[up-defer="insert"][href="/slow-path"]')
          up.hello(partial)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#slow')

          jasmine.respondWithSelector('#slow', { text: 'partial content' })

          await wait()

          expect('#slow').toHaveText('partial content')
        })
      })

      describe("with [up-defer=true]", function() {
        it('loads the partial as soon as it is inserted into the DOM (default)', async function() {
          const partial = fixture('a#slow[up-defer="true"][href="/slow-path"]')
          up.hello(partial)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#slow')

          jasmine.respondWithSelector('#slow', { text: 'partial content' })

          await wait()

          expect('#slow').toHaveText('partial content')
        })
      })

      describe("with [up-defer=reveal]", function() {

        // MutationObserver does not fire within a task
        const MUTATION_OBSERVER_LAG = 30

        it('loads the partial when it is scrolled into the document viewport', async function() {
          const before = fixture('#before', { text: 'before', style: 'height: 50000px' })
          const partial = fixture('a#slow[up-defer="reveal"][href="/slow-path"]')
          up.hello(partial)

          await wait(MUTATION_OBSERVER_LAG)

          expect(jasmine.Ajax.requests.count()).toEqual(0)

          partial.scrollIntoView()

          await wait(MUTATION_OBSERVER_LAG)

          expect(jasmine.Ajax.requests.count()).toEqual(1)

          jasmine.respondWithSelector('#slow', { text: 'partial content' })

          await wait()

          expect('#slow').toHaveText('partial content')
        })

        it('loads the partial when it is scrolled into the document viewport when an overlay is opened in between (bugfix)', async function() {
          const main = fixture('#main[up-main]')
          const before = e.affix(main, '#before', { text: 'before', style: 'height: 50000px' })
          const partial = e.affix(main, 'a#slow[up-defer="reveal"][href="/slow-path"]')
          up.hello(partial)

          await wait(MUTATION_OBSERVER_LAG)

          expect(jasmine.Ajax.requests.count()).toEqual(0)

          up.layer.open({ target: '#overlay', url: '/overlay', openAnimation: false, closeAnimation: false })
          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)

          jasmine.respondWithSelector('#overlay', { text: 'overlay content' })
          await wait()

          expect(up.layer.current).toBeOverlay()

          up.layer.dismiss({ animation: false })
          await wait()

          expect(up.layer.current).toBeRootLayer()

          partial.scrollIntoView()

          await wait(MUTATION_OBSERVER_LAG)

          expect(jasmine.Ajax.requests.count()).toEqual(2)

          jasmine.respondWithSelector('#slow', { text: 'partial content' })

          await wait()

          expect('#slow').toHaveText('partial content')
        })

        it('immediately loads a partial that is already visible within the document viewport', async function() {
          const partial = fixture('a#slow[up-defer="reveal"][href="/slow-path"]', { text: 'deferred', style: { 'background-color': 'yellow' } })
          up.hello(partial)

          // MutationObserver has a delay even for the initial intersection check.
          // We have additional code in place to call it synchronously during compilation,
          // so we don't get a "flash of empty partial" when the content is already cached.
          await wait(0)

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#slow')

          jasmine.respondWithSelector('#slow', { text: 'partial content' })

          await wait()

          expect('#slow').toHaveText('partial content')
        })

        describe('with [up-intersect-margin]', function() {

          it('allows to load the partial earlier with a positive [up-intersect-margin]', async function() {
            const beforeHeight = 50000
            const clientHeight = up.viewport.rootHeight()
            const partial = fixture('a#slow[up-defer="reveal"][href="/slow-path"]', {
              text: 'label',
              style: `position: absolute; top: ${beforeHeight}px; height: 100px; background-color: green;`,
              'up-intersect-margin': '20'
            })
            up.hello(partial)

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(0)

            up.viewport.root.scrollTop = beforeHeight - clientHeight - 10

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(1)
          })

          it('immediately honors the [up-intersect-margin] if the element is already in the viewport', async function() {
            const clientHeight = up.viewport.rootHeight()
            const partial = fixture('a#slow[up-defer="reveal"][href="/slow-path"]', {
              text: 'label',
              style: `position: absolute; top: ${clientHeight + 10}px; height: 100px; background-color: green;`,
              'up-intersect-margin': '20'
            })
            up.hello(partial)

            await wait()

            expect(jasmine.Ajax.requests.count()).toEqual(1)
          })

          it('allows to load the partial later with a negative [up-intersect-margin]', async function() {
            const beforeHeight = 50000
            const clientHeight = up.viewport.rootHeight()
            const partial = fixture('a#slow[up-defer="reveal"][href="/slow-path"]', {
              text: 'label',
              style: `position: absolute; top: ${beforeHeight}px; height: 100px; background-color: green;`,
              'up-intersect-margin': '-20'
            })
            up.hello(partial)

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(0)

            up.viewport.root.scrollTop = (beforeHeight - clientHeight) + 10

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(0)

            up.viewport.root.scrollTop = (beforeHeight - clientHeight) + 30

            await wait(MUTATION_OBSERVER_LAG)

            expect(jasmine.Ajax.requests.count()).toEqual(1)
          })
        })

        it('only sends a single request as the partial enters and leaves the viewport repeatedly', async function() {
          const before = fixture('#before', { text: 'before', style: 'height: 50000px' })

          const partial = fixture('a#slow[up-defer="reveal"][href="/slow-path"]')
          up.hello(partial)

          await wait(MUTATION_OBSERVER_LAG)

          expect(jasmine.Ajax.requests.count()).toEqual(0)

          partial.scrollIntoView()

          await wait(MUTATION_OBSERVER_LAG)

          expect(jasmine.Ajax.requests.count()).toEqual(1)

          // Abort the request so we can observe whether another request will be sent.
          up.network.abort()
          await wait(MUTATION_OBSERVER_LAG)

          document.scrollingElement.scrollTop = 0
          await wait(MUTATION_OBSERVER_LAG)
          partial.scrollIntoView()
          await wait(MUTATION_OBSERVER_LAG)

          // No additional request was sent
          expect(jasmine.Ajax.requests.count()).toEqual(1)
        })

        it('detects visibility for a partial in an element with scroll overflow', async function() {
          const viewport = fixture('#viewport', { style: 'height: 500px; width: 300px; overflow-y: scroll' })
          const before = e.affix(viewport, '#before', { text: 'before', style: 'height: 50000px' })

          const partial = e.affix(viewport, 'a#slow[up-defer="reveal"][href="/slow-path"]', { text: 'label' })
          up.hello(partial)

          await wait(MUTATION_OBSERVER_LAG)

          expect(jasmine.Ajax.requests.count()).toEqual(0)

          partial.scrollIntoView()

          await wait(MUTATION_OBSERVER_LAG)

          expect(jasmine.Ajax.requests.count()).toEqual(1)
        })
      })

      describe("with [up-defer=manual]", function() {
        it('does not load the partial by default', async function() {
          const partial = fixture('a#slow[up-defer="manual"][href="/slow-path"]')
          up.hello(partial)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(0)
        })
      })

      describe("with [up-defer=false]", function() {
        it('does not load the partial by default', async function() {
          const partial = fixture('a#slow[up-defer="false"][href="/slow-path"]')
          up.hello(partial)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(0)
        })
      })

      describe('with [up-preview]', function() {

        it('shows previews while the deferred is loading', async function() {
          const undoFn = jasmine.createSpy('apply preview')
          const previewFn = jasmine.createSpy('apply preview').and.returnValue(undoFn)
          up.preview('my:preview', previewFn)

          const partial = fixture('a#partial[up-defer="manual"][href="/slow-path"][up-preview="my:preview"]', { text: 'old text' })
          up.hello(partial)

          await wait()

          expect('#partial').toHaveText('old text')
          expect(jasmine.Ajax.requests.count()).toEqual(0)
          expect(previewFn).not.toHaveBeenCalled()

          up.deferred.load(partial)
          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(previewFn).toHaveBeenCalledWith(jasmine.objectContaining({ fragment: partial }), {})
          expect(undoFn).not.toHaveBeenCalled()

          jasmine.respondWithSelector('#partial', { text: 'new text' })
          await wait()

          expect(undoFn).toHaveBeenCalled()
          expect('#partial').toHaveText('new text')
        })

        it('shows previews when merging selectors into a single request', async function() {
          const undo1Fn = jasmine.createSpy('preview1 undo fn')
          const preview1Fn = jasmine.createSpy('preview1 apply fn').and.returnValue(undo1Fn)
          up.preview('preview1', preview1Fn)
          const undo2Fn = jasmine.createSpy('preview2 undo fn')
          const preview2Fn = jasmine.createSpy('preview2 apply fn').and.returnValue(undo2Fn)
          up.preview('preview2', preview2Fn)

          const container = fixture('#container')
          const partial1 = e.affix(container, 'a#partial1[up-defer="manual"][href="/slow-path"][up-preview="preview1"]')
          const partial2 = e.affix(container, 'a#partial2[up-defer="manual"][href="/slow-path"][up-preview="preview2"]')
          up.hello(container)

          await wait()

          expect(preview1Fn).not.toHaveBeenCalled()
          expect(preview2Fn).not.toHaveBeenCalled()

          up.deferred.load(partial1)
          up.deferred.load(partial2)
          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#partial1, #partial2')
          expect(preview1Fn).toHaveBeenCalledWith(jasmine.objectContaining({ fragment: partial1 }), {})
          expect(preview2Fn).toHaveBeenCalledWith(jasmine.objectContaining({ fragment: partial2 }), {})
          expect(undo1Fn).not.toHaveBeenCalled()
          expect(undo2Fn).not.toHaveBeenCalled()

          jasmine.respondWith(`
            <div id="partial1">partial1 content</div>
            <div id="partial2">partial2 content</div>\
          `)

          await wait()

          expect('#partial1').toHaveText('partial1 content')
          expect('#partial2').toHaveText('partial2 content')
          expect(undo1Fn).toHaveBeenCalled()
          expect(undo2Fn).toHaveBeenCalled()
        })
      })

      describe('with [up-placeholder]', function() {
        it('shows a placeholder while the deferred is loading', async function() {
          const partial = fixture('a#partial[up-defer="manual"][href="/slow-path"][up-placeholder="<span>placeholder text</span>"]', { text: 'initial text' })
          up.hello(partial)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(0)
          expect('#partial').toHaveVisibleText('initial text')

          up.deferred.load(partial)
          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect('#partial').toHaveVisibleText('placeholder text')

          jasmine.respondWithSelector('#partial', { text: 'new text' })
          await wait()

          expect('#partial').toHaveVisibleText('new text')
        })
      })

      describe('up:deferred:load event', function() {

        it('emits an up:deferred:load event before hitting the network', async function() {
          const listener = jasmine.createSpy('up:deferred:load listener').and.callFake(() => expect(jasmine.Ajax.requests.count()).toEqual(0))
          up.on('up:deferred:load', listener)

          const partial = fixture('a#slow[up-defer][href="/slow-path"]')
          up.hello(partial)

          await wait()

          expect(listener).toHaveBeenCalled()
        })

        it('does not load the partial when up:deferred:load is prevented', async function() {
          const listener = jasmine.createSpy('up:deferred:load listener').and.callFake((event) => event.preventDefault())
          up.on('up:deferred:load', listener)

          const partial = fixture('a#slow[up-defer][href="/slow-path"]')
          up.hello(partial)

          await wait()

          expect(listener).toHaveBeenCalled()
          expect(jasmine.Ajax.requests.count()).toEqual(0)
        })

        it('allows listener to change render options', async function() {
          const listener = jasmine.createSpy('up:deferred:load listener').and.callFake(function(event) {
            event.renderOptions.url = '/other-path'
            return event.renderOptions.target = '#other'
          })

          up.on('up:deferred:load', listener)

          fixture('#other')
          const partial = fixture('a#slow[up-defer][href="/slow-path"]', { text: 'initial content' })
          up.hello(partial)

          await wait()

          expect(listener).toHaveBeenCalled()
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().url).toMatchURL('/other-path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#other')

          jasmine.respondWithSelector('#other', { text: 'partial content' })

          await wait()

          expect('#slow').toHaveText('initial content')
          expect('#other').toHaveText('partial content')
        })
      })
    })

  })

})
