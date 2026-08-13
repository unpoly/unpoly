const u = up.util
const e = up.element
const $ = jQuery

extendDescribe('up.fragment', function() {

  extendDescribe('JavaScript functions', function() {

    describe('up.render()', function() {

      beforeEach(function() {
        up.motion.config.enabled = false
      })

      it('preserves a verbatim "<script>" string in an element attribute (bugfix)', function() {
        fixture('#target')
        const attrValue = '<script>alert("I am valid unescaped HTML/JS")<script>'

        up.render({ fragment: `<div id='target' foo='${attrValue}'></div>` })

        expect(document.querySelector('#target').getAttribute('foo')).toBe(attrValue)
      })

      describe('return value', function() {

        it('returns an up.RenderJob that describes the render options', function() {
          fixture('.target')

          const job = up.render('.target', { content: 'new text' })
          expect(job.renderOptions.target).toBe('.target')
          expect(job.renderOptions.content).toBe('new text')
        })

        it('resolves to an up.RenderResult describing the updated fragments and layer', async function() {
          fixture('.one', { text: 'old one' })
          fixture('.two', { text: 'old two' })
          fixture('.three', { text: 'old three' })

          const documentHTML = `
            <div class="one">new one</div>
            <div class="two">new two</div>
            <div class="three">new three</div>
          `

          const renderOptions = {
            target: '.one, .three',
            document: documentHTML,
          }
          const promise = up.render(renderOptions)

          await expectAsync(promise).toBeResolvedTo(jasmine.any(up.RenderResult))

          await expectAsync(promise).toBeResolvedTo(jasmine.objectContaining({
            ok: true,
            target: '.one, .three',
            fragments: [document.querySelector('.one'), document.querySelector('.three')],
            layer: up.layer.root,
            renderOptions: jasmine.objectContaining({
              target: '.one, .three',
              document: documentHTML,
            }),
          }))
        })

        it('delays the promise until fragments were swapped and destructors have run', async function() {
          const compilerSpy = jasmine.createSpy('compiler spy')
          const destructorSpy = jasmine.createSpy('destructor spy')

          up.compiler('.target', function(target) {
            const text = target.textContent.trim()
            compilerSpy(text)
            return () => destructorSpy(text)
          })

          const html = (text) => `
            <div class="target">
              ${text}
            </div>
          `

          htmlFixture(html('version 1'))

          await up.render({ fragment: html('version 2') })

          expect('.target').toHaveText('version 2')
          expect(destructorSpy).not.toHaveBeenCalled() // version 1 was never compiled
          expect(compilerSpy).toHaveBeenCalledWith('version 2')

          await up.render({ fragment: html('version 3') })

          expect('.target').toHaveText('version 3')
          expect(destructorSpy).toHaveBeenCalledWith('version 2')
          expect(compilerSpy).toHaveBeenCalledWith('version 3')
        })

        it('resolves to an up.RenderResult describing the actual target and layer used, when multiple values could match', async function() {
          let mainHTML = (text) => `<div id="page" up-main>${text}</div>`
          htmlFixture(mainHTML('old main'))

          const job = up.render({ target: ':main', layer: 'any', document: mainHTML('new main') })

          await expectAsync(job).toBeResolvedTo(jasmine.objectContaining({
            target: "[up-main='']",
            layer: up.layer.root,
          }))
        })

      })

      require('./fragment_render_compilation_spec')

      require('./fragment_render_url_spec')

      describe('with { response } option', function() {
        it('renders the given up.Response', async function() {
          up.history.config.enabled = true
          const target = fixture('.target', { text: 'old text' })

          const request = up.request('/response-url')
          await wait()

          jasmine.respondWith('<div class="target">new text</div>')
          const response = await request

          expect('.target').toHaveText('old text')
          await up.render({ target: '.target', response, history: true })
          await wait()

          expect('.target').toHaveText('new text')
          expect(location.href).toMatchURL('/response-url')
        })

        it('does not crash if another request is in flight (bugfix)', async function() {
          const target = fixture('.target', { text: 'old text' })
          const request = up.request('/response-url')
          await wait()

          jasmine.respondWith('<div class="target">new text</div>')
          const response = await request

          const otherRequest = up.request('/other-url')
          await wait()

          expect('.target').toHaveText('old text')
          let changePromise = up.render({ target: '.target', response, history: true })

          await expectAsync(changePromise).toBeResolvedTo(jasmine.any(up.RenderResult))

          expect('.target').toHaveText('new text')
        })

        it('aborts a conflicting request (bugfix)', async function() {
          const target = fixture('.target', { text: 'old text' })
          const request = up.request('/response-url')
          await wait()

          jasmine.respondWith('<div class="target">new text</div>')
          const response = await request

          const conflictingChange = up.render({ target: '.target', url: '/other-url' })
          await wait()

          expect('.target').toHaveText('old text')
          let changePromise = up.render({ target: '.target', response, history: true })

          await expectAsync(changePromise).toBeResolvedTo(jasmine.any(up.RenderResult))
          await expectAsync(conflictingChange).toBeRejectedWith(jasmine.any(up.Aborted))

          expect('.target').toHaveText('new text')
        })

      })

      require('./fragment_render_local_spec')


      require('./fragment_render_target_spec')

      require('./fragment_render_layer_spec')

      require('./fragment_render_history_spec')

      describe('fragment source', function() {

        it('remembers the source the fragment was retrieved from', async function() {
          fixture('.target')
          up.render('.target', { url: '/path' })
          await wait()

          jasmine.respondWithSelector('.target')
          await wait()

          expect(up.fragment.source(e.get('.target'))).toMatchURL('/path')
        })

        it('returns the source location without a #hash', async function() {
          fixture('.target')
          up.render('.target', { url: '/path#hash' })
          await wait()

          jasmine.respondWithSelector('.target')
          await wait()

          expect(up.fragment.source(e.get('.target'))).toMatchURL('/path')
        })

        it('keeps the previous source for a non-GET request (since only that is reloadable)', async function() {
          const target = fixture('.target[up-source="/previous-source"]')
          up.render('.target', { url: '/path', method: 'post' })
          await wait()

          jasmine.respondWithSelector('.target')
          await wait()

          expect(up.fragment.source(e.get('.target'))).toMatchURL('/previous-source')
        })

        it('does not overwrite an [up-source] attribute from the element HTML', async function() {
          fixture('.target')
          up.render('.target', { url: '/path' })
          await wait()

          jasmine.respondWithSelector('.target[up-source="/other"]')
          await wait()

          expect(up.fragment.source(e.get('.target'))).toMatchURL('/other')
        })

        describe('with { source } option', function() {

          it('uses that URL as the source for a GET request', async function() {
            fixture('.target[up-source="/previous-source"]')
            up.render('.target', { url: '/path', source: '/given-path' })
            await wait()

            jasmine.respondWithSelector('.target')
            await wait()

            expect(up.fragment.source(e.get('.target'))).toMatchURL('/given-path')
          })

          it('uses that URL as the source for a failed GET request', async function() {
            fixture('.target[up-source="/previous-source"]')
            const renderJob = up.render('.target', { failTarget: '.target', url: '/path', source: '/given-path' })

            await wait()

            jasmine.respondWithSelector('.target', { status: 500 })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))
            expect(up.fragment.source(e.get('.target'))).toMatchURL('/given-path')
          })

          it('uses that URL as the source after a non-GET request', async function() {
            fixture('.target[up-source="/previous-source"]')
            up.render('.target', { url: '/path', method: 'post', source: '/given-path' })
            await wait()

            jasmine.respondWithSelector('.target')
            await wait()

            expect(up.fragment.source(e.get('.target'))).toMatchURL('/given-path')
          })

          it('uses that URL as the source after a failed non-GET request\'', async function() {
            const target = fixture('.target[up-source="/previous-source"]')
            const renderJob = up.navigate('.target', { failTarget: '.target', url: '/path', method: 'post', source: '/given-path' })

            await wait()

            jasmine.respondWithSelector('.target', { status: 500 })

            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(up.fragment.source(e.get('.target'))).toMatchURL('/given-path')
          })
        })
      })

      describe('context', function() {

        it("sends the layer's context along with requests pertaining to this layer as an X-Up-Context request header", async function() {
          makeLayers([
            { target: '.target', context: { rootKey: 'rootValue' } },
            { target: '.target', context: { overlayKey: 'overlayValue' } }
          ])

          expect(up.layer.get(0).context).toEqual({ rootKey: 'rootValue' })
          expect(up.layer.get(1).context).toEqual({ overlayKey: 'overlayValue' })

          await wait()

          up.render('.target', { layer: up.layer.get(0), url: '/path1' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Context']).toEqual(JSON.stringify({ rootKey: 'rootValue' }))

          up.render('.target', { layer: up.layer.get(1), url: '/path2' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)
          expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Context']).toEqual(JSON.stringify({ overlayKey: 'overlayValue' }))
        })

        it('escapes high ASCII characters in the X-Up-Context request header so Unicode values can be transported', async function() {
          up.layer.context = { foo: 'xäy' }
          fixture('.target')

          up.render('.target', { url: '/path3' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Context']).toBe('{"foo":"x\\u00e4y"}')
        })

        it("sends the fail layer's context as an X-Up-Fail-Context request header", async function() {
          makeLayers([
            { target: '.target', context: { rootKey: 'rootValue' } },
            { target: '.target', context: { overlayKey: 'overlayValue' } }
          ])

          up.render({ target: '.target', failTarget: '.target', layer: up.layer.get(0), failLayer: up.layer.get(1), url: '/path1' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Context']).toEqual(JSON.stringify({ rootKey: 'rootValue' }))
          expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Fail-Context']).toEqual(JSON.stringify({ overlayKey: 'overlayValue' }))
        })

        it('lets the server update the context by responding with an X-Up-Context response header', async function() {
          makeLayers([
            { target: '.target', context: { rootKey: 'rootValue' } },
            { target: '.target', context: { overlayKey: 'overlayValue' } }
          ])

          up.render('.target', { layer: up.layer.get(1), url: '/path1' })
          await wait()

          jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Context': JSON.stringify({ newKey: 'newValue' }) } })
          await wait()

          expect(up.layer.get(0).context).toEqual({ rootKey: 'rootValue' })
          expect(up.layer.get(1).context).toEqual({ overlayKey: 'overlayValue', newKey: 'newValue' })
        })

        it('allows unquoted property names in the X-Up-Context response header', async function() {
          makeLayers([
            { target: '.target', context: { rootKey: 'rootValue' } },
            { target: '.target', context: { overlayKey: 'overlayValue' } }
          ])

          up.render('.target', { layer: up.layer.get(1), url: '/path1' })
          await wait()

          jasmine.respondWithSelector('.target', { responseHeaders: { 'X-Up-Context': '{ newKey: "newValue" }' } })
          await wait()

          expect(up.layer.get(0).context).toEqual({ rootKey: 'rootValue' })
          expect(up.layer.get(1).context).toEqual({ overlayKey: 'overlayValue', newKey: 'newValue' })
        })

        it('uses updates from an X-Up-Context header for failed responses', async function() {
          fixture('.success-target', { text: 'success target' })
          fixture('.failure-target', { text: 'failure target' })

          const renderJob = up.render({ target: '.success-target', failTarget: '.failure-target', url: '/path1' })

          await wait()

          jasmine.respondWithSelector('.failure-target', {
            text: 'new text',
            status: 500,
            responseHeaders: { 'X-Up-Context': JSON.stringify({ newKey: 'newValue' }) }
          })

          await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

          expect('.failure-target').toHaveText('new text')
          expect(up.layer.get(0).context).toEqual({ newKey: 'newValue' })
        })
      })

      require('./fragment_render_transition_spec')


      require('./fragment_render_scrolling_spec')

      describe('style elements', function() {

        it('applies internal <style> elements that were inserted by a render pass', async function() {
          let [paragraph, target] = htmlFixtureList(`
            <p>paragraph text</p>
            <div id="target">old target text</div>
          `)

          up.render({
            fragment: `
              <div id="target">
                new target text
                <style nonce="specs-nonce">
                  p {
                    font-size: 60px;
                  }
                </style>
              </div>
            `
          })

          await wait(200)

          expect('#target').toHaveVisibleText('new target text')
          expect('#target').toHaveSelector('style')
          expect(paragraph).toHaveComputedStyle({ 'font-size': '60px' })

        })
      })

      require('./fragment_render_scripts_spec')

      describe('<noscript> tags', function() {

        it('parses <noscript> contents as text, not DOM nodes (since it will be placed in a scripting-capable browser)', async function() {
          fixture('.target')
          up.render('.target', { url: '/path' })

          await wait()

          jasmine.respondWith(`
            <div class="target">
              <noscript>
                <img src="foo.png">
              </noscript>
            </div>
          `)

          await wait()

          const noscript = document.querySelector('.target noscript')
          expect(noscript).toHaveText('<img src="foo.png">')
        })

        it('parses <noscript> contents as text, not DOM nodes when the <noscript> itself is the target', async function() {
          fixture('noscript#target')
          up.render('#target', { url: '/path' })

          await wait()

          jasmine.respondWith(`
            <div>
              <noscript id='target'>
                <img src="foo.png">
              </noscript>
            </div>
          `)

          await wait()

          const noscript = document.querySelector('#target')
          expect(noscript).toHaveText('<img src="foo.png">')
        })

        it('parses <noscript> contents with multiple lines as text, not DOM nodes', async function() {
          fixture('.target')
          up.render('.target', { url: '/path' })

          await wait()

          jasmine.respondWith(`
            <div class="target">
              <noscript>
                <img src="foo.png">
                <img src="bar.png">
              </noscript>
            </div>
          `)

          await wait()

          const $noscript = $('.target noscript')
          const text = $noscript.text().trim()
          expect(text).toMatch(/<img src="foo\.png">\s+<img src="bar\.png">/)
        })

        it('parses multiple <noscript> tags in the same fragment as text, not DOM nodes', async function() {
          fixture('.target')
          up.render('.target', { url: '/path' })

          await wait()

          jasmine.respondWith(`
            <div class="target">
              <noscript>
                <img src="foo.png">
              </noscript>
              <noscript>
                <img src="bar.png">
              </noscript>
            </div>
          `)

          await wait()

          const $noscripts = $('.target noscript')
          expect($noscripts.length).toBe(2)
          const text0 = $noscripts[0].textContent.trim()
          const text1 = $noscripts[1].textContent.trim()
          expect(text0).toEqual('<img src="foo.png">')
          expect(text1).toEqual('<img src="bar.png">')
        })
      })

      describe('media elements', function() {
        // https://github.com/unpoly/unpoly/issues/432
        it('inserts an auto-playing <video> element (bugfix for Safari)', function(done) {
          fixture('#target')

          // Must render from a { url } or { document } so DOMParser is involved.
          up.render('#target', { url: '/video' })

          return u.task(function() {
            jasmine.respondWith(`
                <div id='target'>
                  <video width="400" controls loop muted autoplay>
                    <source src="/spec/files/video.webm" type="video/webm">
                  </video>
                </div>
            `)

            return u.task(function() {
              const video = document.querySelector('#target video')
              expect(video).toBeGiven()
              const specDone = () => done()
              return video.addEventListener('timeupdate', specDone, { once: true })
            })
          })
        })
      })

      describe('destruction of old element', function() {

        it('emits an up:fragment:destroyed event on the former parent element after the element has been removed from the DOM', async function() {
          const $parent = $fixture('.parent')
          const $element = $parent.affix('.element.v1').text('v1')
          expect($element).toBeAttached()

          const spy = jasmine.createSpy('event listener')
          $parent[0].addEventListener('up:fragment:destroyed', (event) => spy(event.target, event.fragment, up.specUtil.isDetached($element)))

          await up.render('.element', { document: '<div class="element v2">v2</div>' })

          expect(spy).toHaveBeenCalledWith($parent[0], $element[0], true)
        })

        it('calls destructors on the old element', async function() {
          const destructor = jasmine.createSpy('destructor')
          up.compiler('.container', (element) => () => destructor(element.innerText))
          const $container = $fixture('.container').text('old text')
          up.hello($container)
          up.render('.container', { document: '<div class="container">new text</div>' })

          await wait()

          expect('.container').toHaveText('new text')
          expect(destructor).toHaveBeenCalledWith('old text')
        })

        it('calls destructors on the old element after a { transition }', function(done) {
          up.motion.config.enabled = true

          const destructor = jasmine.createSpy('destructor')
          up.compiler('.container', (element) => () => destructor(element.innerText))
          const $container = $fixture('.container').text('old text')
          up.hello($container)

          up.render({ fragment: '<div class="container">new text</div>', transition: 'cross-fade', duration: 100 })

          u.timer(50, () => {
            expect(destructor).not.toHaveBeenCalled()
          })

          u.timer(220, () => {
            expect('.container').toHaveText('new text')
            expect(destructor).toHaveBeenCalledWith('old text')
            done()
          })
        })

        it('calls destructors when swapping children', async function() {
          let destructorSpy = jasmine.createSpy('destructor spy')

          up.compiler('.old-child', function(element) {
            return () => destructorSpy(element.classList[0])
          })

          up.hello(htmlFixture(`
            <div class="fragment">
              <div class="old-child">old child</div>
            </div>
          `))

          await up.render({
            target: '.fragment:content',
            document: `
            <div class="fragment">
              <div class="new-child">new child</div>
            </div>
            `
          })

          expect('.fragment').toHaveSelector('.new-child')
          expect('.fragment').not.toHaveSelector('.old-child')

          expect(destructorSpy).toHaveBeenCalledWith('old-child')
        })

        it('does not call destructors when appending children', async function() {
          let destructorSpy = jasmine.createSpy('destructor spy')

          up.compiler('.old-child', function(element) {
            return destructorSpy
          })

          up.hello(htmlFixture(`
            <div class="fragment">
              <div class="old-child">old child</div>
            </div>
          `))

          await up.render({
            target: '.fragment:after',
            document: `
            <div class="fragment">
              <div class="new-child">new child</div>
            </div>
            `
          })

          expect('.fragment').toHaveSelector('.old-child')
          expect('.fragment').toHaveSelector('.new-child')

          expect(destructorSpy).not.toHaveBeenCalled()
        })

        it('calls destructors when the replaced element is a singleton element like <body> (bugfix)', async function() {
          // shouldSwapElementsDirectly() is true for body, but can't have the example replace the Jasmine test runner UI
          up.element.isSingleton.mock().and.callFake((element) => element.matches('.container'))
          const destructor = jasmine.createSpy('destructor')
          up.compiler('.container', () => destructor)
          const $container = $fixture('.container')
          up.hello($container)

          // Need to pass a { target } and not use { fragment }, since up.fragment.toTarget() ignores
          // classes and only returns the tag name for singleton elements.
          up.render('.container', { document: '<div class="container">new text</div>' })

          await wait()

          expect('.container').toHaveText('new text')
          expect(destructor).toHaveBeenCalled()
        })

        it('marks the old element as .up-destroying before destructors', function(done) {
          const testElementState = u.memoize(function(element) {
            expect(element).toHaveText('old text')
            expect(element).toMatchSelector('.up-destroying')
            done()
          })

          up.compiler('.container', (element) => () => testElementState(element))

          helloFixture('.container', { text: 'old text' })

          up.render({ fragment: '<div class="container">new text</div>' })

        })

        it('marks the old element as .up-destroying before destructors after a { transition }', async function() {
          const destructor = jasmine.createSpy('destructor')
          up.compiler('.container', (element) => () => destructor(element.innerText, element.matches('.up-destroying')))
          const $container = $fixture('.container').text('old text')
          up.hello($container)

          await up.render({
            fragment: '<div class="container">new text</div>',
            transition: 'cross-fade',
            duration: 100
          }).finished

          expect('.container').toHaveText('new text')
          expect(destructor).toHaveBeenCalledWith('old text', true)
        })

        it('calls destructors while the element is still attached to the DOM, so destructors see ancestry and events bubble up', async function() {
          const spy = jasmine.createSpy('parent spy')
          up.compiler('.element', (element) => () => spy(element.innerText, element.parentElement))

          const $parent = $fixture('.parent')
          const $element = $parent.affix('.element').text('old text')
          up.hello($element)

          up.render({ fragment: '<div class="element">new text</div>' })

          await wait()

          expect(spy).toHaveBeenCalledWith('old text', $parent.get(0))
        })

        it('calls destructors while the element is still attached to the DOM when also using a { transition }', async function() {
          const spy = jasmine.createSpy('parent spy')
          up.compiler('.element', (element) => () => // We must seek .parent in our ancestry, because our direct parent() is an .up-bounds container
          spy(element.innerText, element.closest('.parent')))

          const $parent = $fixture('.parent')
          const $element = $parent.affix('.element').text('old text')
          up.hello($element)

          await up.render({
            fragment: '<div class="element">new text</div>',
            transition: 'cross-fade',
            duration: 30
          }).finished

          expect(spy).toHaveBeenCalledWith('old text', $parent.get(0))
        })
      })

      require('./fragment_render_focus_spec')

      describe('with { guardEvent } option', function() {

        it('emits the given event before rendering', async function() {
          fixture('.target', { text: 'old content' })
          const guardEvent = up.event.build('my:guard')
          const listener = jasmine.createSpy('listener').and.callFake((event) => expect('.target').toHaveText('old content'))
          up.on('my:guard', listener)

          up.render({ target: '.target', content: 'new content', guardEvent })

          await wait()

          expect(listener).toHaveBeenCalledWith(guardEvent, jasmine.anything(), jasmine.anything())
          expect('.target').toHaveText('new content')
        })

        it('prefers to emit the given event on the given { origin } instead of the document', async function() {
          fixture('.target', { text: 'old content' })
          const origin = fixture('.origin')
          const guardEvent = up.event.build('my:guard')
          const listener = jasmine.createSpy('listener')
          origin.addEventListener('my:guard', listener)

          up.render({ target: '.target', content: 'new content', guardEvent, origin })

          await wait()

          expect(listener).toHaveBeenCalledWith(guardEvent)
        })

        it('lets listeners prevent the event, aborting the fragment update', async function() {
          fixture('.target', { text: 'old content' })
          const guardEvent = up.event.build('my:guard')
          up.on('my:guard', (event) => event.preventDefault())

          const promise = up.render({ target: '.target', content: 'new content', guardEvent })
          await expectAsync(promise).toBeRejectedWith(jasmine.anyError(/(Aborted|Prevented)/i))
        })

        it('sets { renderOptions } on the emitted event', async function() {
          fixture('.target', { text: 'old content' })
          const listener = jasmine.createSpy('listener').and.callFake((event) => event.preventDefault())
          const guardEvent = up.event.build('my:guard')
          up.on('my:guard', listener)

          const renderJob = up.render({ target: '.target', content: 'new content', guardEvent })

          await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Aborted))

          expect(listener).toHaveBeenCalledWith(guardEvent, jasmine.anything(), jasmine.anything())
          expect(listener.calls.argsFor(0)[0].renderOptions.target).toEqual('.target')
        })

        it('omits the { guardEvent } key from the { renderOptions }, so event handlers can pass this to render() without causing an infinite loop', async function() {
          fixture('.target', { text: 'old content' })
          const listener = jasmine.createSpy('listener').and.callFake((event) => event.preventDefault())
          const guardEvent = up.event.build('my:guard')
          up.on('my:guard', listener)

          const renderJob = up.render({ target: '.target', content: 'new content', guardEvent })

          await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Aborted))

          expect(listener).toHaveBeenCalledWith(guardEvent, jasmine.anything(), jasmine.anything())
          expect(listener.calls.argsFor(0)[0].renderOptions.target).toEqual('.target')
          expect(listener.calls.argsFor(0)[0].renderOptions.guardEvent).toBeMissing()
        })
      })

      require('./fragment_render_abort_spec')

      if (up.migrate.loaded) {
        describe('with { solo } option', function() {

          it('aborts the request of an existing change', async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined
            let change2Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', solo: true }).catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.render('.element', { url: '/path2', solo: true })

            await wait()

            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          it('aborts the request of an existing change if the new change is made from local content', async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined
            let change2Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', solo: true }).catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.render('.element', { content: 'local content', solo: true })

            await wait()

            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(0)
          })

          it('does not cancel its own pending preload request (bugfix)', async function() {
            fixture('.element')
            const changeLink = fixture('a[href="/path"][up-target=".element"]')

            let change1Error  = undefined
            let change2Error  = undefined
            let change1Promise = undefined
            let change2Promise = undefined

            change1Promise = up.link.preload(changeLink)
            change1Promise.catch((e) => change1Error = e)
            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.follow(changeLink, { solo: true })
            change2Promise.catch((e) => change2Error = e)
            await wait()

            expect(change1Error).toBeUndefined()
            expect(change2Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          it("aborts an existing change's request that was queued with { solo: false }", async function() {
            fixture('.element')

            let change1Error  = undefined
            let change1Promise = undefined
            let change2Promise = undefined

            change1Promise = up.render('.element', { url: '/path1', solo: false }).catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.render('.element', { url: '/path2', solo: true })

            await wait()

            expect(change1Error).toBeAbortError()
            expect(up.network.queue.allRequests.length).toEqual(1)
          })

          it("does not abort an existing change's request when called with { solo: false }", async function() {
            fixture('.element')

            let change1Error = undefined
            let change1Promise = undefined

            let change2Promise = undefined

            change1Promise = up.render('.element', { url: '/path1' }).catch((e) => change1Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.render('.element', { url: '/path2', solo: false })

            await wait()

            expect(change1Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(2)
          })

          it('may be passed as a function that decides which existing requests are aborted', async function() {
            fixture('.element1')
            fixture('.element2')
            fixture('.element3')

            let change1Promise = undefined
            let change1Error = undefined

            let change2Promise = undefined
            let change2Error = undefined

            let change3Promise = undefined
            let change3Error = undefined

            change1Promise = up.render('.element1', { url: '/path1', abort: false }).catch((e) => change1Error = e)
            change2Promise = up.render('.element2', { url: '/path2', abort: false }).catch((e) => change2Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(2)
            expect(change1Error).toBeUndefined()
            expect(change2Error).toBeUndefined()

            const soloFn = (request) => u.matchURLs(request.url, '/path1')

            change3Promise = up.render('.element3', { url: '/path3', solo: soloFn }).catch((e) => change3Error = e)

            await wait()

            expect(change1Error).toBeAbortError()
            expect(change2Error).toBeUndefined()
            expect(change3Error).toBeUndefined()

            expect(up.network.queue.allRequests.length).toEqual(2)
          })

          it('may be passed as a function that decides which existing requests are aborted when updating from local content', async function() {
            fixture('.element1')
            fixture('.element2')
            fixture('.element3')

            let change1Promise = undefined
            let change1Error = undefined

            let change2Promise = undefined
            let change2Error = undefined

            let change3Promise = undefined
            let change3Error = undefined

            change1Promise = up.render('.element1', { url: '/path1', abort: false }).catch((e) => change1Error = e)
            change2Promise = up.render('.element2', { url: '/path2', abort: false }).catch((e) => change2Error = e)

            await wait()

            expect(up.network.queue.allRequests.length).toEqual(2)
            expect(change1Error).toBeUndefined()
            expect(change2Error).toBeUndefined()

            const soloFn = (request) => u.matchURLs(request.url, '/path1')

            change3Promise = up.render('.element3', { content: 'new content', solo: soloFn }).catch((e) => change3Error = e)

            await wait()

            expect(change1Error).toBeAbortError()
            expect(change2Error).toBeUndefined()
            expect(change3Error).toBeUndefined()

            expect(up.network.queue.allRequests.length).toEqual(1)
          })
        })
      }


      require('./fragment_render_cache_spec')

      if (window.customElements) {
        describe('custom elements', function() {
          beforeAll(function() {
            var TestComponent = function() {
              const instance = Reflect.construct(HTMLElement, [], TestComponent)
              instance.innerHTML = 'component activated'
              up.emit('test-component:new')
              return instance
            }
            Object.setPrototypeOf(TestComponent.prototype, HTMLElement.prototype)
            Object.setPrototypeOf(TestComponent, HTMLElement)

            window.customElements.define('test-component-activation', TestComponent)
          })

          it('activates custom elements in inserted fragments', async function() {
            fixture('.target')

            up.render('.target', { content: `
              <test-component-activation></test-component-activation>
            ` })

            await wait()
            expect('.target test-component-activation').toHaveText('component activated')
          })

          it('does not activate custom elements outside of inserted fragments (for performance reasons)', async function() {
            fixture('.target')
            const constructorSpy = jasmine.createSpy('constructor called')
            up.on('test-component:new', constructorSpy)

            up.render('.target', { document: `
              <div class="target">
                <test-component-activation></test-component-activation>
              </div>
              <div class="other">
                <test-component-activation></test-component-activation>
              </div>
            ` })

            await wait()
            expect(constructorSpy.calls.count()).toBe(1)
          })
        })
      }
    })

  })

})
