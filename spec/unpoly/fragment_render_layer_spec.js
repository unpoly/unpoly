const u = up.util

extendDescribe('up.fragment', function() {

  extendDescribe('JavaScript functions', function() {

    extendDescribe('up.render()', function() {

      describe('choice of layer', function() {

        describe('targeting a background layer', function() {

          it('updates the layer given as { layer } option', function() {
            makeLayers([
              { target: '.element', content: 'old text in root' },
              { target: '.element', content: 'old text in modal' }
            ])

            up.render('.element', { content: 'new text', layer: 'root', peel: false })

            expect(up.fragment.get('.element', { layer: 0 })).toHaveText(/new text/)
            expect(up.fragment.get('.element', { layer: 1 })).toHaveText(/old text in modal/)
          })

          it('updates the layer of the given { origin }', function() {
            makeLayers([
              { target: '.element', content: 'old text in root' },
              { target: '.element', content: 'old text in modal' }
            ])

            const origin = fixture('.origin')

            up.render('.element', { content: 'new text', origin, peel: false })

            expect(up.fragment.get('.element', { layer: 0 })).toHaveText(/new text/)
            expect(up.fragment.get('.element', { layer: 1 })).toHaveText(/old text in modal/)
          })

          it('rejects when a detached { origin } is given, but no { layer } option', async function() {
            makeLayers([
              { target: '.element', content: 'old text in root' },
              { target: '.element', content: 'old text in modal' }
            ])

            const origin = fixture('.origin')
            origin.remove()

            const promise = up.render('.element', { content: 'new text', origin, peel: false })

            await expectAsync(promise).toBeRejectedWith(jasmine.anyError(/Could not find.*layer.*detached/i))

            expect(up.fragment.get('.element', { layer: 0 })).toHaveText(/old text in root/)
            expect(up.fragment.get('.element', { layer: 1 })).toHaveText(/old text in modal/)
          })

          it('ignores a detached { origin } for layer selection when there is also a { layer } option given', function() {
            makeLayers([
              { target: '.element', content: 'old text in root' },
              { target: '.element', content: 'old text in modal' }
            ])

            const origin = fixture('.origin')
            origin.remove()

            up.render('.element', { content: 'new text', origin, layer: 1, peel: false })

            expect(up.fragment.get('.element', { layer: 0 })).toHaveText(/old text in root/)
            expect(up.fragment.get('.element', { layer: 1 })).toHaveText(/new text/)
          })

          it('updates the given { layer } even if the given { origin } is in another layer', function() {
            makeLayers([
              { target: '.element', content: 'old text in root' },
              { target: '.element', content: 'old text in modal' }
            ])

            const origin = up.fragment.get('.element', { layer: 1 })

            up.render('.element', { content: 'new text', origin, layer: 'root', peel: false })

            expect(up.fragment.get('.element', { layer: 0 })).toHaveText(/new text/)
            expect(up.fragment.get('.element', { layer: 1 })).toHaveText(/old text in modal/)
          })

          it('updates the layer of the given { origin } if the origin was detached after the request was sent', async function() {
            makeLayers([
              { target: '.element', content: 'old text in root' },
              { target: '.element', content: 'old text in modal' }
            ])

            const origin = fixture('.origin')

            up.render('.element', { url: '/path', origin, peel: false })
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)

            // Detach the origin
            origin.remove()

            jasmine.respondWithSelector('.element', { text: 'new text' })
            await wait()

            expect(up.fragment.get('.element', { layer: 0 })).toHaveText(/new text/)
            expect(up.fragment.get('.element', { layer: 1 })).toHaveText(/old text in modal/)
          })

          it('updates the layer of the given target, if the target is given as an element (and not a selector)', function() {
            makeLayers([
              { target: '.element', content: 'old text in root' },
              { target: '.element', content: 'old text in overlay 1' },
              { target: '.element', content: 'old text in overlay 2' }
            ])

            up.render(up.layer.get(1).getFirstSwappableElement(), { content: 'new text in overlay 1', peel: false })

            expect(up.layer.get(0)).toHaveText(/old text in root/)
            expect(up.layer.get(1)).toHaveText('new text in overlay 1')
            expect(up.layer.get(2)).toHaveText('old text in overlay 2')
          })

          describe('peeling', function() {

            describe('with { peel: true }', function() {

              it('dismisses all overlays over the target', async function() {
                let dismissListener = jasmine.createSpy('up:layer:dismiss listener')
                up.on('up:layer:dismiss', dismissListener)

                makeLayers([
                  { target: '.element', content: 'old text in root' },
                  { target: '.element', content: 'old text in overlay 1' },
                  { target: '.element', content: 'old text in overlay 2' }
                ])
                await wait()

                expect(dismissListener).not.toHaveBeenCalled()

                up.render('.element', { content: 'new text', layer: 'root', peel: true })
                await wait()

                expect(dismissListener).toHaveBeenCalled()
                expect(up.layer.count).toBe(1)
                expect(up.layer.current.mode).toBe('root')
                expect(up.layer.current).toHaveText(/new text/)
              })

              it('dismisses multiple overlays in the order of topmost layer to root', async function() {
                let dismissedModes = []
                up.on('up:layer:dismiss', ({ layer }) => dismissedModes.push(layer.mode))

                makeLayers([
                  { target: '.element', content: 'old text in root' },
                  { target: '.element', content: 'old text in modal', mode: 'modal' },
                  { target: '.element', content: 'old text in drawer', mode: 'drawer' }
                ])
                await wait()

                up.render('.element', { content: 'new text', layer: 'root', peel: true })
                await wait()

                expect(up.layer.current.mode).toBe('root')
                expect(dismissedModes).toEqual(['drawer', 'modal'])
              })

              it('not not allow up:layer:dismiss handlers to prevent the peeling', async function() {
                let dismissListener = jasmine.createSpy('up:layer:dismiss listener').and.callFake((event) => event.preventDefault())
                up.on('up:layer:dismiss', dismissListener)
                let dismissedListener = jasmine.createSpy('up:layer:dismissed listener')
                up.on('up:layer:dismissed', dismissedListener)

                makeLayers([
                  { target: '.element', content: 'old text in root' },
                  { target: '.element', content: 'old text in overlay 1' },
                  { target: '.element', content: 'old text in overlay 2' }
                ])
                await wait()

                expect(dismissListener).not.toHaveBeenCalled()

                let renderPromise = up.render('.element', { content: 'new text', layer: 'root', peel: true })
                await expectAsync(renderPromise).toBeResolved()

                expect(dismissListener).toHaveBeenCalled()
                expect(dismissedListener).toHaveBeenCalled()
                expect(up.layer.count).toBe(1)
                expect(up.layer.current.mode).toBe('root')
                expect(up.layer.current).toHaveText(/new text/)
              })

              it('does not create a history entry for the peeled layer', async function() {
                up.history.config.enabled = true
                up.history.replace('/root1')
                const locations = []
                up.on('up:location:changed', ({ location }) => locations.push(up.util.normalizeURL(location)))

                fixture('.content', { text: 'root 1' })

                up.layer.open({ location: '/overlay1', history: true })
                await wait()

                expect(up.layer.count).toBe(2)
                expect(locations).toEqual(['/overlay1'])

                up.render({ content: 'root 2', target: '.content', history: true, location: '/root2', layer: 'root', peel: true })
                await wait()

                expect('.content').toHaveText('root 2')
                expect(up.layer.count).toBe(1)
                expect(locations).toEqual(['/overlay1', '/root2'])
              })

              it('creates a history entry if the response redirects to the same URL as the URL before the overlay was opened (bugfix)', async function() {
                up.history.config.enabled = true
                up.history.replace('/users')
                await wait()

                let [main, link] = htmlFixtureList(`
                  <main>
                    <a up-layer="new" href="/users/2/edit">Alice</a>
                  </main>
                `)
                up.hello(link)

                Trigger.clickSequence(link)
                await wait()

                expect(jasmine.lastRequest().url).toMatchURL('/users/2/edit')
                expect(jasmine.lastRequest()).toHaveRequestMethod('get')

                jasmine.respondWith(`
                  <main>
                    <form autocomplete="off" up-layer="root" action="/users/2" accept-charset="UTF-8" method="post">
                      <button class="btn btn-primary" data-disable="true" type="submit">Save</button>
                    </form>
                  </main>
                `)
                await wait()

                expect(up.layer.count).toBe(2)
                expect(up.history.location).toMatchURL('/users/2/edit')
                expect(up.layer.current).toHaveSelector('form[action="/users/2"]')

                Trigger.clickSequence('form button')
                await wait()

                expect(jasmine.lastRequest().url).toMatchURL('/users/2')
                expect(jasmine.lastRequest()).toHaveRequestMethod('post')

                jasmine.respondWith({
                  responseURL: '/users',
                  responseText: `
                    <main>
                      List of users
                    </main>
                  `
                })
                await wait()

                expect('main').toHaveText('List of users')
                expect(up.history.location).toMatchURL('/users')
              })

              it('does create a history entry for the peeled layer if the fragment update does not update history', async function() {
                up.history.config.enabled = true
                up.history.replace('/root1')
                const locations = []
                up.on('up:location:changed', ({ location }) => locations.push(up.util.normalizeURL(location)))

                fixture('.content', { text: 'root 1' })

                up.layer.open({ location: '/overlay1', history: true })
                await wait()

                expect(up.layer.count).toBe(2)
                expect(locations).toEqual(['/overlay1'])

                up.render({ content: 'root 2', target: '.content', history: false, layer: 'root', peel: true })
                await wait()

                expect('.content').toHaveText('root 2')
                expect(up.layer.count).toBe(1)
                expect(locations).toEqual(['/overlay1', '/root1'])
              })

              it('still renders content if a destructor for the peeled layer crashes', async function() {
                const destroyError = new Error('error from crashing destructor')

                up.compiler('.overlay-element', () => (function() { throw destroyError }))

                htmlFixture('<div class="root-element">new root</div>')
                up.layer.open({ fragment: '<div class="overlay-element"></div>' })

                expect(up.layer.isOverlay()).toBe(true)

                await jasmine.expectGlobalError(destroyError, () => up.render({
                  fragment: '<div class="root-element">new root</div>',
                  peel: true,
                  layer: 'root'
                }))

                expect('.root-element').toHaveText('new root')
                expect(up.layer.isOverlay()).toBe(false)
              })
            })

            describe('with { peel: "dismiss" }', function() {

              it('dismisses all overlays over the target', async function() {
                let dismissListener = jasmine.createSpy('up:layer:dismiss listener')
                up.on('up:layer:dismiss', dismissListener)

                makeLayers([
                  { target: '.element', content: 'old text in root' },
                  { target: '.element', content: 'old text in overlay 1' },
                  { target: '.element', content: 'old text in overlay 2' }
                ])
                await wait()

                expect(dismissListener).not.toHaveBeenCalled()

                up.render('.element', { content: 'new text', layer: 'root', peel: 'dismiss' })
                await wait()

                expect(dismissListener).toHaveBeenCalled()
                expect(up.layer.count).toBe(1)
                expect(up.layer.current.mode).toBe('root')
                expect(up.layer.current).toHaveText(/new text/)
              })

            })

            describe('with { peel: "accept" }', function() {

              it('accepts (not dismisses) all overlays over the target', async function() {
                let dismissListener = jasmine.createSpy('up:layer:dismiss listener')
                up.on('up:layer:dismiss', dismissListener)
                let acceptListener = jasmine.createSpy('up:layer:accept listener')
                up.on('up:layer:accept', acceptListener)

                makeLayers([
                  { target: '.element', content: 'old text in root' },
                  { target: '.element', content: 'old text in overlay 1' },
                  { target: '.element', content: 'old text in overlay 2' }
                ])
                await wait()

                expect(dismissListener).not.toHaveBeenCalled()
                expect(acceptListener).not.toHaveBeenCalled()

                up.render('.element', { content: 'new text', layer: 'root', peel: 'accept' })
                await wait()

                expect(dismissListener).not.toHaveBeenCalled()
                expect(acceptListener).toHaveBeenCalled()
                expect(up.layer.count).toBe(1)
                expect(up.layer.current.mode).toBe('root')
                expect(up.layer.current).toHaveText(/new text/)
              })

            })

            describe('with { peel: false }', function() {

              it('renders in a background layer, leaving any overlays open', async function() {
                let dismissListener = jasmine.createSpy('up:layer:dismiss listener')
                up.on('up:layer:dismiss', dismissListener)

                makeLayers([
                  { target: '.element', content: 'old text in root' },
                  { target: '.element', content: 'old text in overlay 1' },
                  { target: '.element', content: 'old text in overlay 2' }
                ])
                await wait()

                expect(dismissListener).not.toHaveBeenCalled()

                up.render('.element', { content: 'new text', layer: 'root', peel: false })
                await wait()

                expect(dismissListener).not.toHaveBeenCalled()
                expect(up.layer.count).toBe(3)
                expect(up.layer.current.mode).toBe('modal')
                expect(up.layer.current).not.toHaveText(/new text/)
                expect(up.layer.root).toHaveText(/new text/)
              })

            })

          })

        })

        describe('stacking a new overlay', function() {

          it('opens a new layer when given { layer: "new" }', function() {
            up.render('.element', { content: 'new text', layer: 'new' })

            expect(up.layer.count).toBe(2)
            expect(up.layer.current).toHaveText('new text')
          })

          it('returns a promise with an up.RenderResult that contains information about the updated fragments and layer', function(done) {
            const promise = up.render('.overlay-element', { content: 'new text', layer: 'new' })

            promise.then(function(result) {
              expect(up.layer.count).toBe(2)
              expect(result.ok).toBe(true)
              expect(result.fragments).toEqual([up.fragment.get('.overlay-element')])
              expect(result.layer).toBe(up.layer.current)
              done()
            })
          })

          it('allows to pass the mode for the new layer as { layer: "new $MODE" } (as a shortcut)', function() {
            up.render('.element', { content: 'new text', layer: 'new drawer' })

            expect(up.layer.current.mode).toEqual('drawer')
          })
        })

        describe('with { layer: "swap" }', function() {

          it('replaces the current overlay with the new overlay', function() {
            makeLayers(2)

            expect(up.layer.count).toBe(2)
            expect(up.layer.current.mode).toEqual('modal')

            up.render('.element', { content: 'new text', layer: 'swap', mode: 'drawer' })

            expect(up.layer.count).toBe(2)
            expect(up.layer.current.mode).toEqual('drawer')
            expect(up.layer.current).toHaveText('new text')
          })

          it('opens a new overlay if no overlay is open', function() {
            expect(up.layer.count).toBe(1)

            up.render('.element', { content: 'new text', layer: 'swap', mode: 'drawer' })

            expect(up.layer.count).toBe(2)
            expect(up.layer.current.mode).toEqual('drawer')
            expect(up.layer.current).toHaveText('new text')
          })

          it('does not push a history entry between that of the old and new overlays', async function() {
            up.history.config.enabled = true
            const locations = []
            up.on('up:location:changed', ({ location }) => locations.push(up.util.normalizeURL(location)))

            up.layer.open({ location: '/overlay1', history: true })
            await wait()

            expect(up.layer.count).toBe(2)
            expect(locations).toEqual(['/overlay1'])

            up.render({ content: 'overlay 2', target: '.content', history: true, location: '/overlay2', layer: 'swap' })
            await wait()

            expect(up.layer.count).toBe(2)
            expect(locations).toEqual(['/overlay1', '/overlay2'])
          })

          it("does restore the base layer's history entry if the new overlay has no history", async function() {
            up.history.config.enabled = true
            up.history.replace('/base-layer')
            const locations = []
            up.on('up:location:changed', ({ location }) => locations.push(up.util.normalizeURL(location)))

            up.layer.open({ location: '/overlay1', history: true })
            await wait()

            expect(up.layer.count).toBe(2)
            expect(locations).toEqual(['/overlay1'])

            up.render({ content: 'overlay 2', target: '.content', history: false, layer: 'swap' })
            await wait()

            expect(up.layer.count).toBe(2)
            expect(locations).toEqual(['/overlay1', '/base-layer'])
          })
        })

        describe('with { layer: "shatter" }', function() {

          it('replaces all existing overlays with the new overlay', function() {
            makeLayers(3)

            expect(up.layer.count).toBe(3)
            expect(up.layer.current.mode).toEqual('modal')

            up.render('.element', { content: 'new text', layer: 'shatter', mode: 'drawer' })

            expect(up.layer.count).toBe(2)
            expect(up.layer.current.mode).toEqual('drawer')
            expect(up.layer.current).toHaveText('new text')
          })

          it('opens a new overlay if no overlay is open', function() {
            expect(up.layer.count).toBe(1)

            up.render('.element', { content: 'new text', layer: 'shatter', mode: 'drawer' })

            expect(up.layer.count).toBe(2)
            expect(up.layer.current.mode).toEqual('drawer')
            expect(up.layer.current).toHaveText('new text')
          })
        })

        describe('if nothing else is specified', function() {

          it('updates the current layer', function() {
            makeLayers([
              { target: '.element', content: 'old text in root' },
              { target: '.element', content: 'old text in modal' }
            ])

            up.render('.element', { content: 'new text', peel: false })

            expect(up.layer.get(0)).toHaveText(/old text in root/)
            expect(up.layer.get(1)).toHaveText(/new text/)
          })

          it('rejects if the current layer does not match', async function() {
            makeLayers([
              { target: '.element', content: 'old text in root' },
              { target: '.other', content: 'old text in modal1' }
            ])

            const promise = up.render('.element', { content: 'new text' })

            await expectAsync(promise).toBeRejected()
          })
        })

        describe('if the given layer does not exist', function() {

          it('rejects the change', async function() {
            fixture('.element', { text: 'old text' })
            const promise = up.render('.element', { layer: 'parent', content: 'new text' })

            await expectAsync(promise).toBeRejectedWith(jasmine.anyError('up.CannotMatch', /could not find (a )?layer/i))
            expect('.element').toHaveText(/old text/)
          })

          it('allows the request and does not reject if the { layer } can be resolved, but { failLayer } cannot', async function() {
            fixture('.success')
            fixture('.failure')

            const promise = up.render('.success', { url: '/path', failTarget: '.failure', layer: 'current', failLayer: 'parent' })

            await wait()

            // Allow the request. In the common case that the request is successful, we would have aborted for no reason.
            // We can still throw if the server does end up responding with a failure.
            await expectAsync(promise).toBePending()
            expect(jasmine.Ajax.requests.count()).toBe(1)

            // When the server does end up responding with a failure, we cannot process it and must throw up.CannotMatch.
            jasmine.respondWithSelector('.failure', { status: 500 })
            await expectAsync(promise).toBeRejectedWith(jasmine.anyError('up.CannotMatch', /could not find (a )?layer/i))
          })

          it('updates the next layer in a space-separated list of alternative layer names', function(done) {
            fixture('.element', { text: 'old text' })
            const promise = up.render('.element', { layer: 'parent root', content: 'new text' })

            u.task(() => promiseState(promise).then(function(result) {
              expect(result.state).toEqual('fulfilled')
              expect('.element').toHaveText(/new text/)
              done()
            }))
          })

          it('updates the next layer in a comma-separated list of alternative layer names', function(done) {
            fixture('.element', { text: 'old text' })
            const promise = up.render('.element', { layer: 'parent, root', content: 'new text' })

            u.task(() => promiseState(promise).then(function(result) {
              expect(result.state).toEqual('fulfilled')
              expect('.element').toHaveText(/new text/)
              done()
            }))
          })

          if (up.migrate.loaded) {
            it('updates the next layer in an "or"-separated list of alternative layer names', function(done) {
              fixture('.element', { text: 'old text' })
              const promise = up.render('.element', { layer: 'parent or root', content: 'new text' })

              u.task(() => promiseState(promise).then(function(result) {
                expect(result.state).toEqual('fulfilled')
                expect('.element').toHaveText(/new text/)
                done()
              }))
            })
          }
        })
      })

    })

  })

})
