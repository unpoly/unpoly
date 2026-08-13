extendDescribe('up.fragment', function() {

  extendDescribe('JavaScript functions', function() {

    extendDescribe('up.render()', function() {

      describe('with { abort } option', function() {

        describe('with { abort: true }', function() {

          it('aborts the request of an existing change', async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', abort: true })
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            up.render('.element', { url: '/path2', abort: true })

            await wait()

            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          it('does not abort an earlier request that was made with { abortable: false }', async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', abortable: false })
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            up.render('.element', { url: '/path2', abort: true })

            await wait()

            expect(change1Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(2)
          })

          it('aborts the request of an existing change if the new change is made from local content', async function() {
            fixture('.element1')
            fixture('.element2')

            let change1Error  = undefined
            let change1Promise = undefined

            change1Promise = up.render('.element1', { url: '/path1', abort: true })
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            up.render('.element2', { content: 'local content', abort: true })

            await wait()

            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(0)
          })

          it('aborts an existing request when a preload request gets promoted to the foreground', async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', abort: true })
            change1Promise.catch((e) => change1Error = e)

            const change2Link = fixture('a[href="/path2"][up-target=".element"][up-abort="true"]')

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            up.link.preload(change2Link)
            await wait()
            expect(change1Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(2)

            up.link.follow(change2Link)
            await wait()
            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          it('does not cancel its own pending preload request (bugfix)', async function() {
            fixture('.element')

            let change1Error  = undefined
            let change2Error  = undefined
            let change1Promise = undefined
            let change2Promise = undefined

            const changeLink = fixture('a[href="/path"][up-target=".element"]')

            change1Promise = up.link.preload(changeLink)
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.follow(changeLink)
            change2Promise.catch((e) => change2Error = e)
            await wait()

            expect(change1Error).toBeUndefined()
            expect(change2Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          it("aborts an existing change's request that was queued with { abort: false }", async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', abort: false })
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            up.render('.element', { url: '/path2', abort: true })

            await wait()

            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })
        })

        describe('with { abort: "all" }', function() {
          it('is an alias for { abort: true }', async function() {
            fixture('.element')
            const previousRequest = up.request('/baz')

            const abortSpy = spyOn(up.fragment, 'abort')

            up.render('.element', { url: '/path1', abort: 'all' })

            await wait()

            expect(abortSpy).toHaveBeenCalledWith(jasmine.objectContaining({ layer: 'any' }))
          })
        })

        describe('with { abort: "layer" }', function() {
          it("aborts all requests on the targeted fragment's layer", async function() {
            const layers = makeLayers(3)

            layers[1].affix('.element')

            const previousRequest = up.request('/baz')

            const abortSpy = spyOn(up.fragment, 'abort')

            up.render('.element', { url: '/path1', abort: 'layer', layer: 1 })

            await wait()

            expect(abortSpy).toHaveBeenCalledWith(jasmine.objectContaining({ layer: up.layer.get(1) }))
          })
        })

        describe('with { abort } option set to a CSS selector', function() {
          it("aborts all requests in the subtree of a matching element in the targeted layer", async function() {
            const layers = makeLayers(3)

            layers[1].affix('.element')

            const previousRequest = up.request('/baz')

            const abortSpy = spyOn(up.fragment, 'abort')

            up.render('.element', { url: '/path1', abort: '.element', layer: 1 })

            await wait()

            expect(abortSpy).toHaveBeenCalledWith('.element', jasmine.objectContaining({ layer: up.layer.get(1) }))
          })
        })

        describe('with { abort } option set to an Element', function() {
          it("aborts all requests in the subtree of that Element", async function() {
            const element = fixture('.element')

            const previousRequest = up.request('/baz')

            const abortSpy = spyOn(up.fragment, 'abort')

            up.render('.element', { url: '/path1', abort: element })

            await wait()

            expect(abortSpy).toHaveBeenCalledWith(element, jasmine.anything())
          })
        })

        describe('with { abort: "target" }', function() {

          it('aborts existing requests targeting the same element', async function() {
            fixture('.element')
            const change1Promise = up.render('.element', { url: '/path1' })

            expect(up.network.queue.allRequests.length).toBe(1)

            up.render('.element', { url: '/path2', abort: 'target' })

            await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
          })

          it('aborts an existing requests targeting the same URL and element IFF not caching (bugfix)', async function() {
            fixture('.element')
            const change1Promise = up.render('.element', { url: '/path1' })

            expect(up.network.queue.allRequests.length).toBe(1)

            up.render('.element', { url: '/path1', abort: 'target' })

            await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
          })

          it('aborts a conflicting request made while the render pass is waiting for the network', async function() {
            fixture('.element', { text: 'v1' })

            const change1Promise = up.render('.element', { url: '/path2', abort: 'target' })
            await wait()

            expect(up.network.queue.allRequests.length).toBe(1)
            const change2Promise = up.render('.element', { url: '/path1', abort: false })
            await wait()

            expect(up.network.queue.allRequests.length).toBe(2)

            jasmine.respondWith({ request: 0, responseText: '<div class="element">v2</div>' })

            await expectAsync(change2Promise).toBeRejectedWith(jasmine.any(up.Aborted))
            await expectAsync(change1Promise).toBeResolvedTo(jasmine.any(up.RenderResult))
            expect('.element').toHaveText('v2')
          })

          it('aborts a conflicting request made while the render pass is waiting for a failed response', async function() {
            fixture('.element', { text: 'v1' })
            fixture('.fail-element', { text: 'v1' })

            const change1Promise = up.render({ target: '.element', failTarget: '.fail-element', url: '/path2', abort: 'target' })
            await wait()

            expect(up.network.queue.allRequests.length).toBe(1)
            const change2Promise = up.render('.fail-element', { url: '/path1', abort: false })
            await wait()

            expect(up.network.queue.allRequests.length).toBe(2)

            jasmine.respondWith({ request: 0, responseText: '<div class="fail-element">v2</div>', status: 500 })

            await expectAsync(change2Promise).toBeRejectedWith(jasmine.any(up.Aborted))
            await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.RenderResult))
            expect('.element').toHaveText('v1')
            expect('.fail-element').toHaveText('v2')
          })

          it('aborts existing requests targeting the same element when updating from local content', async function() {
            fixture('.element')
            const change1Promise = up.render('.element', { url: '/path1' })

            fixture('.sibling')
            const change2Promise = up.render('.sibling', { url: '/path2' })

            expect(up.network.queue.allRequests.length).toBe(2)

            up.render('.element', { content: 'new content', abort: 'target' })

            await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
            await expectAsync(change2Promise).toBePending()
            expect('.element').toHaveText('new content')
          })

          it('aborts existing requests targeting a descendant of the targeted element', async function() {
            fixture('.parent .child')
            const change1Promise = up.render('.child', { url: '/path1' })

            expect(up.network.queue.allRequests.length).toBe(1)

            up.render('.parent', { url: '/path2', abort: 'target' })

            await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
          })

          it('does not abort existing requests targeting an ascendant of the targeted element', async function() {
            fixture('.parent .child')
            const parentChangePromise = up.render('.parent', { url: '/path1' })

            expect(up.network.queue.allRequests.length).toBe(1)

            up.render('.child', { url: '/path2', abort: 'target' })

            await expectAsync(parentChangePromise).toBePending()
          })

          it('does not abort its own preloading request', async function() {
            fixture('.element')
            const link = fixture('a[href="/path"][up-target=".element"]')

            const preloadPromise = up.link.preload(link)
            await wait()

            expect(up.network.queue.allRequests.length).toBe(1)

            const followPromise = up.link.follow(link)
            await wait()

            await expectAsync(preloadPromise).toBePending()
            await expectAsync(followPromise).toBePending()
            expect(up.network.queue.allRequests.length).toBe(1)
          })

          describe('up:fragment:aborted event', function() {

            it('emits with a { jid } property so listeners can exclude their own update', async function() {
              let element = fixture('.element')
              const change1Promise = up.render('.element', { url: '/path1' })
              await wait()

              expect(up.network.queue.allRequests.length).toBe(1)

              let abortedListener = jasmine.createSpy('up:fragment:aborted listener')
              up.on('up:fragment:aborted', abortedListener)

              up.render('.element', { url: '/path2', abort: 'target', jid: 'my-jid-123' })

              await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
              expect(abortedListener.calls.count()).toBe(1)
              expect(abortedListener.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
                type: 'up:fragment:aborted',
                target: element,
                jid: 'my-jid-123',
              }))
            })

            it('is emitted before a request is made when other requests are in flight', async function() {
              let element = fixture('.element')
              const change1Promise = up.render('.element', { url: '/path1' })
              await wait()

              expect(up.network.queue.allRequests.length).toBe(1)

              let abortedListener = jasmine.createSpy('up:fragment:aborted listener')
              up.on('up:fragment:aborted', abortedListener)

              up.render('.element', { url: '/path2', abort: 'target' })

              await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
              expect(abortedListener.calls.count()).toBe(1)
              expect(abortedListener.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
                type: 'up:fragment:aborted',
                target: element,
              }))
            })

            it('is emitted before a request is made when no other requests are in flight', async function() {
              let element = fixture('.element')

              let abortedListener = jasmine.createSpy('up:fragment:aborted listener')
              up.on('up:fragment:aborted', abortedListener)

              up.render('.element', { url: '/path2', abort: 'target' })
              await wait()

              expect(abortedListener.calls.count()).toBe(1)
              expect(abortedListener.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
                type: 'up:fragment:aborted',
                target: element,
              }))
            })

            it('is emitted before an element is swapped from local HTML', async function() {
              let originalElement = htmlFixture('<div class="element">v1</div>')
              const change1Promise = up.render('.element', { url: '/path1' })
              await wait()

              expect(up.network.queue.allRequests.length).toBe(1)

              let abortedListener = jasmine.createSpy('up:fragment:aborted listener')
              up.on('up:fragment:aborted', abortedListener)

              up.render({ fragment: '<div class="element">v2</div>', abort: 'target' })

              await expectAsync(change1Promise).toBeRejectedWith(jasmine.any(up.Aborted))
              expect(abortedListener.calls.count()).toBeGreaterThanOrEqual(1)
              expect(abortedListener.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
                type: 'up:fragment:aborted',
                target: originalElement,
              }))
              expect('.element').toHaveText('v2')
            })

            it('is emitted before an element is swapped from local HTML and no requests are in flight', async function() {
              let originalElement = htmlFixture('<div class="element">v1</div>')

              let abortedListener = jasmine.createSpy('up:fragment:aborted listener')
              up.on('up:fragment:aborted', abortedListener)

              up.render({ fragment: '<div class="element">v2</div>', abort: 'target' })
              await wait()

              expect('.element').toHaveText('v2')
              expect(abortedListener.calls.count()).toBeGreaterThanOrEqual(1)
              expect(abortedListener.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
                type: 'up:fragment:aborted',
                target: originalElement,
              }))
            })

          })

        })

        describe('with { abort: false }', function() {

          it("does not abort an existing change's request", async function() {
            fixture('.element')

            let change1Error = undefined
            let change1Promise = undefined

            change1Promise = up.render('.element', { url: '/path1' })
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            up.render('.element', { url: '/path2', abort: false })

            await wait()

            expect(change1Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(2)
          })

          it('does not abort requests targeting the same subtree once our response is received and swapped in', async function() {
            fixture('.element', { text: 'old text' })

            const change1Promise = up.render('.element', { url: '/path1', abort: false })
            let change1Error = undefined
            change1Promise.catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)

            up.render('.element', { url: '/path2', abort: false })

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(2)
            expect(change1Error).toBeUndefined()

            jasmine.respondWithSelector('.element', { text: 'text from /path2' })

            await wait()

            expect('.element').toHaveText('text from /path2')
            expect(change1Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          describe('up:fragment:aborted event', function() {
            it('is not emitted at any point during the render process', async function() {
              fixture('.element')

              up.render('.element', { url: '/path1' })
              await wait()

              expect(up.network.queue.allRequests.length).toEqual(1)

              let abortedListener = jasmine.createSpy('up:fragment:aborted listener')
              up.on('up:fragment:aborted', abortedListener)
              await wait()

              up.render('.element', { url: '/path2', abort: false })
              await wait()

              expect(up.network.queue.allRequests.length).toEqual(2)
              expect(abortedListener).not.toHaveBeenCalled()
            })

          })

        })
      })

    })

  })

})
