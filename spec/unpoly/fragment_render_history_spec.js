const u = up.util
const e = up.element

extendDescribe('up.fragment', function() {

  extendDescribe('JavaScript functions', function() {

    extendDescribe('up.render()', function() {

      describe('with { history } option', function() {

        beforeEach(function() {
          up.history.config.enabled = true
        })

        describe('browser location', function() {

          it('sets the browser location to the requested URL', async function() {
            fixture('.target')
            const promise = up.render('.target', { url: '/path', history: true })
            await wait()

            jasmine.respondWithSelector('.target')
            await promise

            expect(location.href).toMatchURL('/path')
          })

          it('does not add a history entry after non-GET requests', async function() {
            fixture('.target')
            up.render('.target', { url: '/path', method: 'post', history: true })
            await wait()

            jasmine.respondWithSelector('.target')
            await wait()

            expect(location.href).toMatchURL(jasmine.locationBeforeExample)
          })

          it("detects a redirect's new URL when the server sets an X-Up-Location header", async function() {
            fixture('.target')
            up.render('.target', { url: '/path', history: true })
            await wait()

            jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Location': '/other-path' } })
            await wait()

            expect(location.href).toMatchURL('/other-path')
          })

          it('assumes a redirect to GET when the response URL does not match the request URL', async function() {
            fixture('.target')
            up.render('.target', { url: '/endpoint', history: true, method: 'post' })
            await wait()

            jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Location': '/redirect-path' } })
            await wait()

            expect(location.href).toMatchURL('/redirect-path')
          })

          it('does not assume a redirect to GET when the response URL matches the request URL', async function() {
            fixture('.target')
            up.render('.target', { url: '/endpoint', history: true, method: 'post' })
            await wait()

            jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Location': '/endpoint' } })
            await wait()

            expect(location.href).toMatchURL(jasmine.locationBeforeExample)
          })

          it('does not assume a redirect to GET when the server sends an X-Up-Method header', async function() {
            fixture('.target')
            up.render('.target', { url: '/endpoint', history: true, method: 'post' })
            await wait()

            jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Location': '/redirect-path', 'X-Up-Method': 'post' } })
            await wait()

            expect(location.href).toMatchURL(jasmine.locationBeforeExample)
          })

          it("preserves the #hash when the server sets an X-Up-Location header (like a vanilla form submission would do in the browser)", async function() {
            fixture('.target')
            up.render('.target', { url: '/path#hash', history: true })
            await wait()

            jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Location': '/other-path' } })
            await wait()

            expect(location.href).toMatchURL('/other-path#hash')
          })

          it('adds a history entry after non-GET requests if the response includes a `X-Up-Method: GET` header (will happen after a redirect)', async function() {
            fixture('.target')
            up.render('.target', { url: '/requested-path', method: 'post', history: true })
            await wait()

            jasmine.respondWithSelector('.target', {
              responseHeaders: {
                'X-Up-Method': 'GET',
                'X-Up-Location': '/signaled-path'
              }
            })
            await wait()

            expect(location.href).toMatchURL('/signaled-path')
          })

          it('does add a history entry after a failed GET-request (since that is reloadable)', async function() {
            fixture('.target')
            const renderJob = up.render('.target', { url: '/path', method: 'post', failTarget: '.target', history: true })

            await wait()

            jasmine.respondWithSelector('.target', { status: 500 })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(location.href).toMatchURL(jasmine.locationBeforeExample)
          })

          it('does not add a history entry with { history: false } option', async function() {
            fixture('.target')
            up.render('.target', { url: '/path', history: false })
            await wait()

            jasmine.respondWithSelector('.target')
            await wait()

            expect(location.href).toMatchURL(jasmine.locationBeforeExample)
          })

          it('does not add a history entry without a { history } option', async function() {
            fixture('.target')
            up.render('.target', { url: '/path' })
            await wait()

            jasmine.respondWithSelector('.target')
            await wait()

            expect(location.href).toMatchURL(jasmine.locationBeforeExample)
          })

          it('adds params from a { params } option to the URL of a GET request', async function() {
            fixture('.target')
            up.render('.target', { url: '/path', params: { 'foo-key': 'foo value', 'bar-key': 'bar value' }, history: true })
            await wait()

            jasmine.respondWithSelector('.target')
            await wait()

            expect(location.href).toMatchURL('/path?foo-key=foo%20value&bar-key=bar%20value')
          })

          it('does not add a history entry with { history: false } option (which also prevents updating of window title)', async function() {
            fixture('.target')
            up.render('.target', { url: '/path', history: false })
            await wait()

            jasmine.respondWithSelector('.target')
            await wait()

            expect(location.href).toMatchURL(jasmine.locationBeforeExample)
          })

          it('does not add a history entry with { location: false } option', async function() {
            fixture('.target')
            up.render('.target', { url: '/path', location: false })
            await wait()

            jasmine.respondWithSelector('.target')
            await wait()

            expect(location.href).toMatchURL(jasmine.locationBeforeExample)
          })

          describe('with { history: "auto" }', function() {

            it('adds an history entry when updating a main target', async function() {
              up.fragment.config.mainTargets = ['.target']
              fixture('.target')
              const promise = up.render('.target', { url: '/path3', history: 'auto' })
              await wait()

              jasmine.respondWithSelector('.target')
              await promise

              expect(location.href).toMatchURL('/path3')
            })

            it('allows to configure auto-history targets that are not a main target', async function() {
              up.fragment.config.autoHistoryTargets = ['.target']
              expect(up.fragment.config.mainTargets).not.toContain('.target')

              fixture('.target')
              const promise = up.render('.target', { url: '/path3-2', history: 'auto' })
              await wait()

              jasmine.respondWithSelector('.target')
              await promise

              expect(location.href).toMatchURL('/path3-2')
            })

            it('adds an history entry when updating a fragment that contains a main target', async function() {
              up.fragment.config.mainTargets = ['.target']
              const container = fixture('.container')
              e.affix(container, '.target')
              const promise = up.render('.container', { url: '/path3-1', history: 'auto' })
              await wait()

              jasmine.respondWithSelector('.container .target')
              await promise

              expect(location.href).toMatchURL('/path3-1')
            })

            it('does not add an history entry when updating a non-main targets', async function() {
              up.fragment.config.mainTargets = ['.other']
              fixture('.target')
              const promise = up.render('.target', { url: '/path4', history: 'auto' })
              await wait()

              jasmine.respondWithSelector('.target')
              await promise

              expect(location.href).toMatchURL(jasmine.locationBeforeExample)
            })

            it('adds a history when at least fragment of a multi-fragment update is a main target', async function() {
              up.fragment.config.mainTargets = ['.bar']
              fixture('.foo')
              fixture('.bar')
              fixture('.baz')
              const promise = up.render('.foo, .bar, .baz', { url: '/path4', history: 'auto' })
              await wait()

              jasmine.respondWith(`
                <div class='foo'></div>
                <div class='bar'></div>
                <div class='baz'></div>
              `)
              await promise

              expect(location.href).toMatchURL('/path4')
            })
          })

          describe('when a string is passed as { location } option', function() {

            it('uses that URL as the new location after a GET request', async function() {
              fixture('.target')
              up.render('.target', { url: '/path', history: true, location: '/path2' })
              await wait()

              jasmine.respondWithSelector('.target')
              await wait()

              expect(location.href).toMatchURL('/path2')
            })

            it('adds a history entry after a non-GET request', async function() {
              fixture('.target')
              up.render('.target', { url: '/path', method: 'post', history: true, location: '/path3' })
              await wait()

              jasmine.respondWithSelector('.target')
              await wait()

              expect(location.href).toMatchURL('/path3')
            })

            it('does not override the response URL after a failed request', async function() {
              fixture('.success-target')
              fixture('.failure-target')
              const renderJob = up.render('.success-target', { url: '/path', history: true, location: '/path4', failLocation: true, failTarget: '.failure-target' })

              await wait()

              jasmine.respondWithSelector('.failure-target', { status: 500 })

              await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

              expect(location.href).toMatchURL('/path')
            })

            it('overrides the response URL after a failed request when passed as { failLocation }', async function() {
              fixture('.success-target')
              fixture('.failure-target')
              const renderJob = up.render('.success-target', { url: '/path', history: true, location: '/path5', failLocation: '/path6', failTarget: '.failure-target' })

              await wait()

              jasmine.respondWithSelector('.failure-target', { status: 500 })

              await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

              expect(location.href).toMatchURL('/path6')
            })
          })

          describe('up:layer:location:changed event', function() {

            it('is emitted when the location changed in the root layer', async function() {
              history.replaceState?.({}, 'original title', '/original-url')
              fixture('.target')

              const listener = jasmine.createSpy('event listener')
              up.on('up:layer:location:changed', listener)

              await up.render({ target: '.target', location: '/new-url', content: 'new content', history: true })

              expect(listener.calls.argsFor(0)[0]).toBeEvent('up:layer:location:changed', { location: '/new-url', layer: up.layer.current })
            })

            it("is emitted when the location changed in an overlay", async function() {
              const listener = jasmine.createSpy('event listener')
              up.on('up:layer:location:changed', listener)

              up.layer.open({ target: '.target', location: '/original-layer-url', history: false, content: 'old overlay text' })
              await wait()

              expect(up.layer.isOverlay()).toBe(true)
              // Browser location is unchanged, but the overlay still needs its internal location
              expect(location.href).toMatchURL(jasmine.locationBeforeExample)
              expect(up.layer.location).toMatchURL('/original-layer-url')

              expect(listener.calls.count()).toBe(0)

              await up.render({ target: '.target', location: '/next-layer-url', content: 'new overlay text', history: true })

              expect(up.layer.current).toHaveText('new overlay text')
              expect(listener.calls.count()).toBe(1)
            })

            it('is emitted after the browser location changed', async function() {
              let browserLocationSpy = jasmine.createSpy('browser location spy')
              history.replaceState?.({}, 'original title', '/original-url')
              fixture('.target')

              const listener = jasmine.createSpy('event listener')
              up.on('up:layer:location:changed', () => browserLocationSpy(up.history.location))

              await up.render({ target: '.target', location: '/new-url', content: 'new content', history: true })

              expect(browserLocationSpy).toHaveBeenCalledWith('/new-url')
            })

            it('is not emitted when a layer is initially opened', async function() {
              const listener = jasmine.createSpy('event listener')
              up.on('up:layer:location:changed', listener)

              up.layer.open({ target: '.target', location: '/original-layer-url', content: 'old overlay text' })
              await wait()

              expect(up.layer.isOverlay()).toBe(true)
              expect(up.layer.location).toMatchURL('/original-layer-url')
              expect(listener.calls.count()).toBe(0)
            })

            it('is not emitted when the location did not change', async function() {
              const listener = jasmine.createSpy('event listener')
              up.on('up:layer:location:changed', listener)

              up.layer.open({ target: '.target', location: '/original-layer-url', content: 'old overlay text' })
              await wait()

              expect(up.layer.isOverlay()).toBe(true)
              expect(up.layer.location).toMatchURL('/original-layer-url')
              expect(listener.calls.count()).toBe(0)

              await up.render({ target: '.target', location: '/original-layer-url', content: 'new overlay text', history: true })

              expect(up.layer.current).toHaveText('new overlay text')
              expect(listener.calls.count()).toBe(0)
            })

            it("is emitted in overlays that don't render history", async function() {
              const listener = jasmine.createSpy('event listener')
              up.on('up:layer:location:changed', listener)

              up.layer.open({ target: '.target', location: '/original-layer-url', history: false, content: 'old overlay text' })
              await wait()

              expect(up.layer.isOverlay()).toBe(true)
              // Browser location is unchanged, but the overlay still needs its internal location
              expect(location.href).toMatchURL(jasmine.locationBeforeExample)
              expect(up.layer.location).toMatchURL('/original-layer-url')

              expect(listener.calls.count()).toBe(0)

              await up.render({ target: '.target', location: '/next-layer-url', content: 'new overlay text', history: true })

              // Browser location is unchanged, but the overlay still needs its internal location
              expect(location.href).toMatchURL(jasmine.locationBeforeExample)
              expect(up.layer.location).toMatchURL('/next-layer-url')

              // Listener was called again, as we're tracking changes to the layer's { location } prop
              expect(listener.calls.count()).toBe(1)
            })
          })
        })

        describe('window title', function() {

          it("sets the document title to the response <title>", async function() {
            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <title>Title from HTML</title>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)

            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.title).toBe('Title from HTML')
          })

          it("sets the document title to a JSON-encoded X-Up-Title header in the response", async function() {
            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith({
              responseHeaders: {
                'X-Up-Title': '"Title from header"'
              },
              responseText: `
                <div class='container'>
                  new container text
                </div>
              `
            })
            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.title).toBe('Title from header')
          })

          it("prefers the X-Up-Title header to the response <title>", async function() {
            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith({
              responseHeaders: {
                'X-Up-Title': '"Title from header"'
              },
              responseText: `
                <html>
                  <head>
                    <title>Title from HTML</title>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })
            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.title).toBe('Title from header')
          })

          if (up.migrate.loaded) {
            it("sets the document title to an unquoted X-Up-Title header in the response", async function() {
              fixture('.container', { text: 'old container text' })
              up.render('.container', { url: '/path', history: true })

              await wait()

              jasmine.respondWith({
                responseHeaders: {
                  'X-Up-Title': '"Title from header"'
                },
                responseText: `
                  <div class='container'>
                    new container text
                  </div>
                `
              })
              await wait()

              expect('.container').toHaveText('new container text')
              expect(document.title).toBe('Title from header')
            })
          }

          it("sets the document title to the response <title> with { location: false, title: true } options (bugfix)", async function() {
            $fixture('.container').text('old container text')
            up.render('.container', { url: '/path', history: true, location: false, title: true })

            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <title>Title from HTML</title>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)
            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.title).toBe('Title from HTML')
          })

          it('does not update the document title if the response has a <title> tag inside an inline SVG image (bugfix)', async function() {
            $fixture('.container').text('old container text')
            const oldTitle = document.title
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith(`
              <svg width="500" height="300" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <title>SVG Title Demo example</title>
                  <rect x="10" y="10" width="200" height="50" style="fill:none; stroke:blue; stroke-width:1px"/>
                </g>
              </svg>

              <div class='container'>
                new container text
              </div>
            `)
            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.title).toBe(oldTitle)
          })

          it("does not extract the title from the response or HTTP header with { title: false }", async function() {
            fixture('.container', { text: 'old container text' })
            const oldTitle = document.title
            up.render('.container', { url: '/path', history: true, title: false })
            await wait()

            jasmine.respondWith({
              responseHeaders: {
                'X-Up-Title': '"Title from header"'
              },
              responseText: `
                <html>
                  <head>
                    <title>Title from HTML</title>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })
            await wait()

            expect(document.title).toEqual(oldTitle)
          })

          it("does not extract the title from the response or HTTP header with { history: false }", async function() {
            fixture('.container', { text: 'old container text' })
            const oldTitle = document.title
            up.render('.container', { url: '/path', history: false })
            await wait()

            jasmine.respondWith({
              responseHeaders: {
                'X-Up-Title': '"Title from header"'
              },
              responseText: `
                <html>
                  <head>
                    <title>Title from HTML</title>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })
            await wait()

            expect(document.title).toEqual(oldTitle)
          })

          it('allows to pass an explicit title as { title } option', async function() {
            $fixture('.container').text('old container text')
            up.render('.container', { url: '/path', history: true, title: 'Title from options' })
            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <title>Title from HTML</title>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)
            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.title).toBe('Title from options')
          })

          it("sets document.title after calling history.pushState() to prevent mutating the old history state", async function() {
            const calls = []
            spyOn(up.layer.root, '_updateLocation').and.callFake(() => calls.push('set location'))
            spyOn(up.layer.root, '_updateTitle').and.callFake(() => calls.push('set title'))

            // Instead of setting Layer#title or document#title, an alternative implementation is to insert
            // a new <title> element.
            const onHeadChanges = (mutations) => mutations.map((mutation) =>
              (() => {
                const result = []
                for (var node of mutation.addedNodes) {
                  if (node.matches('title')) {
                    result.push(calls.push('set title'))
                  } else {
                    result.push(undefined)
                  }
                }
                return result
              })())
            const observer = new MutationObserver(onHeadChanges)
            observer.observe(document.head, { childList: true, subtree: true })

            $fixture('.container').text('old container text')
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <title>Title from HTML</title>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)
            await wait()

            expect('.container').toHaveText('new container text')
            expect(calls).toEqual(['set location', 'set title'])

            observer.disconnect()
          })
        })

        describe('meta tags', function() {

          beforeEach(function() { up.history.config.enabled = true })

          it("updates meta tags from the response", async function() {
            fixture(document.head, 'link[rel="canonical"][href="/old-canonical"]')
            fixture(document.head, 'meta[name="description"][content="old description"]')

            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })
            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <link rel='canonical' href='/new-canonical'>
                  <meta name='description' content='new description'>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)
            await wait()

            expect(document.head).not.toHaveSelector('link[rel="canonical"][href="/old-canonical"]')
            expect(document.head).toHaveSelector('link[rel="canonical"][href="/new-canonical"]')
            expect(document.head).not.toHaveSelector('meta[name="description"][content="old description"]')
            expect(document.head).toHaveSelector('meta[name="description"][content="new description"]')
          })

          it("does not update meta tags with [up-meta=false]", async function() {
            fixture(document.head, 'link[rel="canonical"][href="/old-canonical"][up-meta="false"]')
            fixture(document.head, 'meta[name="description"][content="old description"]')

            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })
            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <link rel='canonical' href='/new-canonical' up-meta='false'>
                  <meta name='description' content='new description'>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)
            await wait()

            expect(document.head).toHaveSelector('link[rel="canonical"][href="/old-canonical"]')
            expect(document.head).not.toHaveSelector('link[rel="canonical"][href="/new-canonical"]')
            expect(document.head).not.toHaveSelector('meta[name="description"][content="old description"]')
            expect(document.head).toHaveSelector('meta[name="description"][content="new description"]')
          })

          it('does not update meta tags with { history: false }', async function() {
            fixture(document.head, 'link[rel="canonical"][href="/old-canonical"]')
            fixture(document.head, 'meta[name="description"][content="old description"]')

            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: false })
            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <link rel='canonical' href='/new-canonical'>
                  <meta name='description' content='old description'>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)
            await wait()

            expect(document.head).toHaveSelector('link[rel="canonical"][href="/old-canonical"]')
            expect(document.head).toHaveSelector('meta[name="description"][content="old description"]')
          })

          it('does not update meta tags with up.history.config.updateMetaTags = false', async function() {
            up.history.config.updateMetaTags = false

            fixture(document.head, 'link[rel="canonical"][href="/old-canonical"]')
            fixture(document.head, 'meta[name="description"][content="old description"]')

            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })
            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <link rel='canonical' href='/new-canonical'>
                  <meta name='description' content='old description'>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)
            await wait()

            expect(document.head).toHaveSelector('link[rel="canonical"][href="/old-canonical"]')
            expect(document.head).toHaveSelector('meta[name="description"][content="old description"]')
          })

          it('does not update meta tags with { metaTags: false } option', async function() {
            fixture(document.head, 'link[rel="canonical"][href="/old-canonical"]')
            fixture(document.head, 'meta[name="description"][content="old description"]')

            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true, metaTags: false })
            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <link rel='canonical' href='/new-canonical'>
                  <meta name='description' content='old description'>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)
            await wait()

            expect(document.head).toHaveSelector('link[rel="canonical"][href="/old-canonical"]')
            expect(document.head).toHaveSelector('meta[name="description"][content="old description"]')
          })

          it('does not render meta tags for a background layer, but saves them for later restoration', async function() {
            fixture(document.head, 'meta[name="description"][content="old root description"]')
            document.title = 'old root title'

            fixture('.container', { text: 'old root container text' })

            up.layer.open({
              target: '.container',
              history: true,
              location: "/overlay",
              document: `
                <html>
                  <head>
                    <title>overlay title</title>
                    <meta name='description' content='overlay description'>
                  </head>
                  <body>
                    <div class='container'>
                      container text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            expect(document.title).toBe('overlay title')
            expect(document.head).toHaveSelector('meta[name="description"][content="overlay description"]')
            expect(document.head).not.toHaveSelector('meta[name="description"][content="old root description"]')

            up.render({
              target: '.container',
              layer: 'root',
              history: true,
              location: '/root2',
              document: `
                <html>
                  <head>
                    <title>new root title</title>
                    <meta name='description' content='new root description'>
                  </head>
                  <body>
                    <div class='container'>
                      container text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            // Since we updated a background layer, the rendered meta tags are still those from the overlay.
            expect(document.title).toBe('overlay title')
            expect(document.head).toHaveSelector('meta[name="description"][content="overlay description"]')
            expect(document.head).not.toHaveSelector('meta[name="description"][content="old root description"]')

            up.layer.dismiss()

            await wait()

            // Now that the root layer is revealed again, we see the meta tags saved from the last render pass.
            expect(document.title).toBe('new root title')
            expect(document.head).not.toHaveSelector('meta[name="description"][content="overlay description"]')
            expect(document.head).not.toHaveSelector('meta[name="description"][content="old root description"]')
            expect(document.head).toHaveSelector('meta[name="description"][content="new root description"]')
          })

          it('does not remove current meta tags if the response has no <head>', async function() {
            fixture(document.head, 'link[rel="canonical"][href="/old-canonical"]')
            fixture(document.head, 'meta[name="description"][content="old description"]')

            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith(`
              <div class='container'>
                new container text
              </div>
            `)

            await wait()

            expect(document.head).toHaveSelector('link[rel="canonical"][href="/old-canonical"]')
            expect(document.head).toHaveSelector('meta[name="description"][content="old description"]')
          })

          it('updates a script[type="application/ld+json"] from the response with up.script.config.scriptElementPolicy = "block" (bugfix)', async function() {
            up.script.config.scriptElementPolicy = "block"

            const json = `
              {
                "@context": "https://schema.org/",
                "@type": "Recipe",
                "name": "Party Coffee Cake",
                "author": {
                  "@type": "Person",
                  "name": "Mary Stone"
                },
                "datePublished": "2018-03-10",
                "description": "This coffee cake is awesome and perfect for parties.",
                "prepTime": "PT20M"
              }
            `

            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith(`
              <html>
                <head>
                  <script type="application/ld+json">${json}</script>
                </head>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)

            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.head).toHaveSelector('script[type="application/ld+json"]')
            expect(document.head.querySelector('script[type="application/ld+json"]')).toHaveText(json)
          })

          if (up.migrate.loaded) {
            it("warns if an auto-update meta tags is also [up-hungry]", async function() {
              fixture(document.head, 'link[rel="canonical"][href="/old-canonical"][up-hungry]')
              const warnSpy = up.migrate.warn.mock()

              fixture('.container', { text: 'old container text' })
              up.render('.container', { url: '/path', history: true })

              await wait()

              jasmine.respondWith(`
                <html>
                  <head>
                    <link rel='canonical' href='/new-canonical' up-hungry>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `)

              await wait()

              expect(document.head).not.toHaveSelector('link[rel="canonical"][href="/old-canonical"]')
              expect(document.head).toHaveSelector('link[rel="canonical"][href="/new-canonical"]')
              expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('Remove the [up-hungry] attribute'), jasmine.anything())
            })
          }
        })

        describe('html[lang]', function() {

          it('updates the html[lang] attribute with the language from the response', async function() {
            document.documentElement.setAttribute('lang', 'it')
            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith(`
              <html lang='fr'>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)

            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.documentElement).toHaveAttribute('lang', 'fr')
          })

          it('removes the html[lang] attribute if the response has a <html> element without a [lang] attribute', async function() {
            document.documentElement.setAttribute('lang', 'it')
            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith(`
              <html>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)

            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.documentElement).not.toHaveAttribute('lang')
          })

          it('does not remove the html[lang] attribute if the response has no <html> element', async function() {
            document.documentElement.setAttribute('lang', 'it')
            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true })

            await wait()

            jasmine.respondWith(`
              <div class='container'>
                new container text
              </div>
            `)

            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.documentElement).toHaveAttribute('lang', 'it')
          })

          it('does not update the html[lang] attribute with { lang: false }', async function() {
            document.documentElement.setAttribute('lang', 'it')
            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: true, lang: false })

            await wait()

            jasmine.respondWith(`
              <html lang='fr'>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)

            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.documentElement).toHaveAttribute('lang', 'it')
          })

          it('does not update the html[lang] attribute when not updating history', async function() {
            document.documentElement.setAttribute('lang', 'it')
            fixture('.container', { text: 'old container text' })
            up.render('.container', { url: '/path', history: false })

            await wait()

            jasmine.respondWith(`
              <html lang='fr'>
                <body>
                  <div class='container'>
                    new container text
                  </div>
                </body>
              </html>
            `)

            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.documentElement).toHaveAttribute('lang', 'it')
          })
        })

        describe('assets in the head', function() {

          it('does not update linked stylesheets in the <head>', async function() {
            const style = e.createFromSelector('link[rel="stylesheet"][href="styles-1.css"]')
            registerFixture(style)
            document.head.append(style)

            fixture('.container', { text: 'old container text' })
            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <link rel='stylesheet' href='styles-2.css'>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.head).toHaveSelector('link[rel="stylesheet"][href="styles-1.css"]')
          })

          it('does not update linked scripts in the <head>', async function() {
            const style = e.createFromSelector('script[src="scripts-1.js"]')
            registerFixture(style)
            document.head.append(style)

            fixture('.container', { text: 'old container text' })
            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script src='scripts-2.js'></script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            expect('.container').toHaveText('new container text')
            expect(document.head).toHaveSelector('script[src="scripts-1.js"]')
          })

          it('does not execute new inline scripts in the <head>, even when they are marked as [up-asset]', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener')
            up.on('up:assets:changed', listener)
            window.scriptTagExecuted = jasmine.createSpy('scriptTagExecuted')
            fixture('.container', { text: 'old container text' })

            fixture('.container', { text: 'old container text' })
            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script id="new-script" up-asset nonce="specs-nonce">window.scriptTagExecuted()</script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })
            await wait()

            expect('.container').toHaveText('new container text')

            expect(listener).toHaveBeenCalled()
            expect(listener.calls.mostRecent().args[0].newAssets[0].id).toBe('new-script')
            expect(document.head).not.toHaveSelector('script#new-script')
            expect(window.scriptTagExecuted).not.toHaveBeenCalled()

            delete window.scriptTagExecuted
          })

          it('emits an up:assets:changed event if linked assets differ between <head> and <response>', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener')
            up.on('up:assets:changed', listener)

            const style = e.createFromSelector('script[src="scripts-1.js"]')
            registerFixture(style)
            document.head.append(style)

            fixture('.container', { text: 'old container text' })
            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script src='scripts-2.js'></script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })
            await wait()

            expect('.container').toHaveText('new container text')

            expect(listener).toHaveBeenCalled()
            const event = listener.calls.mostRecent().args[0]
            expect(event.type).toBe('up:assets:changed')
            expect(event.renderOptions).toEqual(jasmine.any(Object))
            expect(event.renderOptions.location).toBe('/path')
            expect(u.map(event.oldAssets, 'outerHTML')).toEqual(['<script src="scripts-1.js"></script>'])
            expect(u.map(event.newAssets, 'outerHTML')).toEqual(['<script src="scripts-2.js"></script>'])
          })

          it('exposes a { response } property on up:assets:changed so users can implement their own nonce rewriting for non-script assets', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener')
            up.on('up:assets:changed', listener)

            const style = e.createFromSelector('script[src="scripts-1.js"]')
            registerFixture(style)
            document.head.append(style)

            fixture('.container', { text: 'old container text' })
            up.render('.container', {
              url: '/path',
              history: true,
            })
            await wait()

            jasmine.respondWith({
              responseText: `
                <html>
                  <head>
                    <script src='scripts-2.js'></script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `,
              responseHeaders: {
                'Content-Security-Policy': "style-src: 'nonce-123"
              }
            })
            await wait()

            expect(listener).toHaveBeenCalled()
            const event = listener.calls.mostRecent().args[0]
            expect(event.type).toBe('up:assets:changed')
            expect(event.response).toEqual(jasmine.any(up.Response))
            expect(event.response.header('Content-Security-Policy')).toBe("style-src: 'nonce-123")
          })

          it('allows the user to insert an executable script from event.newAssets (bugfix)', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener').and.callFake((event) => {
              for (let newAsset of event.newAssets) {
                document.head.append(newAsset)
              }
            })
            up.on('up:assets:changed', listener)
            window.scriptTagExecuted = jasmine.createSpy('scriptTagExecuted')
            fixture('.container', { text: 'old container text' })

            fixture('.container', { text: 'old container text' })
            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script id="new-script" up-asset nonce="specs-nonce">window.scriptTagExecuted()</script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })
            await wait()

            expect('.container').toHaveText('new container text')

            expect(listener).toHaveBeenCalled()
            expect(document.head).toHaveSelector('script#new-script')
            expect(window.scriptTagExecuted).toHaveBeenCalled()
            // Check that we didn't re-execute the script when we repaired the inert element
            expect(window.scriptTagExecuted.calls.count()).toBe(1)

            delete window.scriptTagExecuted
            document.head.querySelector('script#new-script').remove()
          })

          it('does not emit up:assets:changed if the only changed asset has [up-asset=false]', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener')
            up.on('up:assets:changed', listener)

            const style = e.createFromSelector('script[src="scripts-1.js"][up-asset="false"]')
            registerFixture(style)
            document.head.append(style)

            fixture('.container', { text: 'old container text' })

            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script src='scripts-2.js' up-asset='false'></script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            expect('.container').toHaveText('new container text')
            expect(listener).not.toHaveBeenCalled()
          })

          it('does not emit up:assets:changed if the <link> and <meta> elements did not change', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener')
            up.on('up:assets:changed', listener)

            const style = e.createFromSelector('script[src="scripts.js"]')
            registerFixture(style)
            document.head.append(style)

            fixture('.container', { text: 'old container text' })

            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script src='scripts.js'></script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            expect('.container').toHaveText('new container text')
            expect(listener).not.toHaveBeenCalled()
          })

          it('does not emit up:assets:changed after a script in the <body> was disabled through up.script.config.scriptElementPolicy = "block" (bugfix)', async function() {
            up.script.config.scriptElementPolicy = "block"
            const listener = jasmine.createSpy('up:assets:changed listener')
            up.on('up:assets:changed', listener)

            const style = e.createFromSelector('script[src="scripts.js"]')
            registerFixture(style)
            document.head.append(style)

            fixture('.container', { text: 'old container text' })

            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script src='scripts.js'></script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            expect('.container').toHaveText('new container text')
            expect(listener).not.toHaveBeenCalled()
          })

          it('does not emit up:assets:changed if the updated <link> and <meta> elements are not asset-related', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener')
            up.on('up:assets:changed', listener)

            const style = e.createFromSelector('script[src="scripts.js"]')
            registerFixture(style)
            document.head.append(style)

            const description = e.createFromSelector('meta[name="description"][content="old description"]')
            registerFixture(description)
            document.head.append(description)

            const nextLink = e.createFromSelector('link[rel="next"][href="/old-next"]')
            registerFixture(nextLink)
            document.head.append(nextLink)

            fixture('.container', { text: 'old container text' })

            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script src='scripts.js'></script>
                    <meta name='description' content='new description'>
                    <link rel='next' href='/new-next'>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            expect('.container').toHaveText('new container text')
            expect(listener).not.toHaveBeenCalled()
          })

          it('does not emit up:assets:changed if the response has no <head>', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener')
            up.on('up:assets:changed', listener)

            const script = e.createFromSelector('script[src="scripts-1.js"]')
            registerFixture(script)
            document.head.append(script)

            fixture('.container', { text: 'old container text' })
            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <div class='container'>
                  new container text
                </div>
              `
            })

            await wait()

            expect('.container').toHaveText('new container text')
            expect(listener).not.toHaveBeenCalled()
          })

          it('does not emit up:assets:changed if inline scripts in the <head> changed', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener')
            up.on('up:assets:changed', listener)

            const script = e.createFromSelector('script', { text: 'console.log("hello from old inline scripts")' })
            registerFixture(script)
            document.head.append(script)

            fixture('.container', { text: 'old container text' })
            up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script nonce="specs-nonce">
                      console.log("hello from new inline script")
                    </script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })

            await wait()

            expect('.container').toHaveText('new container text')
            expect(listener).not.toHaveBeenCalled()
          })

          it('aborts the render pass if the up:assets:changed event is prevented', async function() {
            const listener = jasmine.createSpy('up:assets:changed listener').and.callFake((event) => event.preventDefault())
            up.on('up:assets:changed', listener)

            const style = e.createFromSelector('script[src="scripts-1.js"]')
            registerFixture(style)
            document.head.append(style)

            fixture('.container', { text: 'old container text' })
            const renderPromise = up.render('.container', {
              location: '/path',
              history: true,
              document: `
                <html>
                  <head>
                    <script src='scripts-2.js'></script>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              `
            })

            await expectAsync(renderPromise).toBeRejectedWith(jasmine.any(up.Aborted))

            expect(listener).toHaveBeenCalled()
            expect('.container').toHaveText('old container text')
          })
        })

      })

    })

  })

})
