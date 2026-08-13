const u = up.util
const e = up.element
const $ = jQuery

extendDescribe('up.fragment', function() {

  extendDescribe('unobtrusive behavior', function() {

    describe('[up-keep]', function() {

      function squish(string) {
        if (u.isString(string)) {
          string = string.replace(/^\s+/g, '')
          string = string.replace(/\s+$/g, '')
          string = string.replace(/\s+/g, ' ')
        }
        return string
      }

      beforeEach(function() {
        // TODO: Refactor this spec file so examples don't all share one example
        $('.before, .middle, .after').remove()
      })

      it('keeps an [up-keep] element, but does replace other elements around it', async function() {
        const $container = $fixture('.container')
        $container.affix('.before').text('old-before')
        $container.affix('.middle[up-keep]').text('old-middle')
        $container.affix('.after').text('old-after')

        up.render('.container', { document: `
          <div class='container'>
            <div class='before'>new-before</div>
            <div class='middle' up-keep>new-middle</div>
            <div class='after'>new-after</div>
          </div>
        `
        })

        await wait()

        expect('.before').toHaveText('new-before')
        expect('.middle').toHaveText('old-middle')
        expect('.after').toHaveText('new-after')
      })

      it('does not run destructors within kept elements', async function() {
        const destructor = jasmine.createSpy('destructor spy')

        up.compiler('.keepable', (element) => destructor)

        const container = fixture('.container')
        const keepable = e.affix(container, '.keepable[up-keep]', { text: 'old text' })

        up.hello(keepable)

        up.render('.container', { document: `
          <div class='container'>
            <div class='keepable' up-keep>new text</div>
          </div>
        `
        })

        await wait()
        expect(destructor).not.toHaveBeenCalled()

        up.destroy('.container')
        await wait()

        expect(destructor).toHaveBeenCalled()
      })

      it('does not run destructors within kept elements when the <body> is targeted (bugfix)', async function() {
        const destructor = jasmine.createSpy('destructor spy')

        up.compiler('.keepable', (element) => destructor)

        const keepable = fixture('.keepable[up-keep]', { text: 'old content' })

        up.hello(keepable)

        up.render('body', { document: `
          <body>
            <div class='keepable' up-keep>new content</div>
          </body>
        `
        })

        await wait()

        expect(destructor).not.toHaveBeenCalled()
      })

      it('keeps an [up-keep] element when updating a singleton element like <body>', async function() {
        up.fragment.config.targetDerivers.unshift('middle-element')

        // shouldSwapElementsDirectly() is true for body, but can't have the example replace the Jasmine test runner UI
        up.element.isSingleton.mock().and.callFake((element) => element.matches('middle-element'))

        const $container = $fixture('.container')
        $container.affix('before-element').text('old-before')
        // Must use a custom element since up.fragment.toTarget() only returns the element name for singleton elements.
        // Using a <div class="middle"> would return "div" and match the before-element.
        $container.affix('middle-element[up-keep]').text('old-middle')
        $container.affix('after-element').text('old-after')

        up.render('.container', { document: `
          <div class='container'>
            <before-element>new-before</before-element>
            <middle-element class='middle' up-keep>new-middle</middle-element>
            <after-element class='after'>new-after</after-element>
          </div>
        ` })

        await wait()

        expect('before-element').toHaveText('new-before')
        expect('middle-element').toHaveText('old-middle')
        expect('after-element').toHaveText('new-after')
      })

      it('keeps an [up-keep] element, but does replace text nodes around it', async function() {
        const $container = $fixture('.container')
        $container.html(`
          old-before
          <div class='element' up-keep>old-inside</div>
          old-after
        `)

        up.render('.container', { document: `
          <div class='container'>
            new-before
            <div class='element' up-keep>new-inside</div>
            new-after
          </div>
        ` })

        await wait()

        expect(squish($('.container').text())).toEqual('new-before old-inside new-after')
      })

      it('omits a kept element from the returned up.RenderResult', async function() {
        const $container = $fixture('.container')
        $container.affix('.before').text('old-before')
        $container.affix('.middle[up-keep]').text('old-middle')
        $container.affix('.after').text('old-after')

        const result = await up.render('.before, .middle', { document: `
          <div class='container'>
            <div class='before'>new-before</div>
            <div class='middle' up-keep>new-middle</div>
            <div class='after'>new-after</div>
          </div>
        ` })

        expect('.before').toHaveText('new-before')
        expect('.middle').toHaveText('old-middle') // was kept
        expect('.after').toHaveText('old-after')

        expect(result.fragments.length).toBe(1)
        expect(result.fragments[0]).toMatchSelector('.before')
      })

      it('updates an [up-keep] element with { keep: false } option', async function() {
        const $container = $fixture('.container')
        $container.html(`
          old-before
          <div class='element' up-keep>old-inside</div>
          old-after
        `)

        up.render('.container', {
          keep: false,
          document: `
            <div class='container'>
              new-before
              <div class='element' up-keep>new-inside</div>
              new-after
            </div>
          `
        })

        await wait()

        expect(squish($('.container').text())).toEqual('new-before new-inside new-after')
      })

      it('keeps the scroll position of an [up-viewport] within a kept element', function() {
        const container = fixture('.container')
        const keepable = e.affix(container, '.keepable[up-keep]')
        const viewport = e.affix(keepable, '.viewport[up-viewport]', { style: { 'height': '100px', 'overflow-y': 'scroll' } })
        const viewportContent = e.affix(viewport, '.viewport-content', { style: { 'height': '500px' } })
        const unkeeptSibling = e.affix(container, '.other', { text: 'old other text' })

        viewport.scrollTop = 100

        expect(viewport).toBeAttached()
        expect(viewport.scrollTop).toBe(100)

        up.render({ fragment: `
          <div class="container">
            <div class="keepable" up-keep>
              <div class="viewport" up-viewport></div>
            </div>
            <div class="other">new other text</div>
          </div>
        ` })

        expect('.other').toHaveText('new other text')
        expect(viewport).toBeAttached()
        expect(viewport.scrollTop).toBe(100)
      })

      describe('media elements', function() {

        it('keeps a <video> element when rendering with DOMparser (bugfix)', async function() {
          const html = `
            <div id="container">
              <video id="video" up-keep></video>
            </div>
          `

          htmlFixture(html)
          const videoBeforeRender = document.querySelector('#video')

          // Must render from { url } or { document } so DOMParser and fixParserDamage() is involed.
          up.render('#container', { document: html })

          await wait()

          expect(document.querySelector('#video')).toBe(videoBeforeRender)
        })

        it('keeps the position of a <video> element within the DOM hierarchy when rendering with DOMparser (bugfix)', async function() {
          const html = `
            <div id="container">
              <video id="video" up-keep></video>
            </div>
          `

          const container = htmlFixture(html)
          document.querySelector('#video')

          // Must render from { url } or { document } so DOMParser and fixParserDamage() is involed.
          up.render('#container', { document: html })

          await wait()

          const video = document.querySelector('#video')
          expect(video).toMatchSelector('#fixtures > #container > #video')
        })

        it('keeps a <audio> element when rendering with DOMparser (bugfix)', async function() {
          const html = `
            <div id="container">
              <audio id="audio" up-keep></audio>
            </div>
          `

          htmlFixture(html)
          const audioBeforeRender = document.querySelector('#audio')

          // Must render from { url } or { document } so DOMParser and fixParserDamage() is involed.
          up.render('#container', { document: html })

          await wait()

          expect(document.querySelector('#audio')).toBe(audioBeforeRender)
        })

        it('preserves the playback state of a kept media element', function(done) {
          const container = fixture('.container')
          const playerHTML = `
            <div id="player">
              <video width="400" controls loop muted up-keep id="video">
                <source src="/spec/files/video.webm" type="video/webm">
              </video>
            </div>
          `

          const onPlaying = async function() {
            expect(video.paused).toBe(false)

            // Playback state is only lost when the update is from a URL, but not when updating
            // from a local string (which is sync).
            //
            // This may have two reasons:
            //
            // 1. Rendering from a URL is async, rendering a local string is sync
            // 2. Rendering from a URL uses DOMParser and fixParserDamage(), rendering from a local string
            //    creates elements within the current browsing context.
            const promise = up.render({ target: '#player', url: '/video2' })

            await wait()

            jasmine.respondWith(playerHTML)

            await expectAsync(promise).toBeResolvedTo(jasmine.any(up.RenderResult))

            expect(video).toBeAttached()
            expect(video.paused).toBe(false)
            expect(document.querySelectorAll('video').length).toBe(1)

            // We cannot pass `done` to addEventListener() directly. I think the event argument
            // causes Jasmine to fail the test
            const onUpdate = () => done()

            // Check that we video is still playing
            video.addEventListener('timeupdate', onUpdate, { once: true })
          }

          container.innerHTML = playerHTML
          var video = container.querySelector('video')
          expect(video.paused).toBe(true)

          // We're waiting for a timeupdate event in addition to checking !video.paused
          // since an unpaused video may not actually be playing.
          video.addEventListener('timeupdate', onPlaying, { once: true })
          video.play()
        })
      })

      describe('scripts', function() {

        beforeEach(function() {
          up.script.config.scriptElementPolicy = 'pass'
        })

        it('keeps a <script> element (bugfix)', async function() {
          const html = `
            <div id="container">
              <script id="script" up-keep nonce="specs-nonce"></script>
            </div>
          `

          htmlFixture(html)
          const scriptBeforeRender = document.querySelector('#script')

          // Must render from { url } or { document } so DOMParser and fixParserDamage() is involved.
          up.render('#container', { document: html })

          await wait()

          expect(document.querySelector('#script')).toBe(scriptBeforeRender)
        })

        it('keeps a <script> element, but allows to replace it in a non-keeping render pass later (bugfix)', async function() {
          window.keepSpy = jasmine.createSpy('spy called from keepable script')

          const html = `
            <div id="container">
              <script id="script" up-keep nonce="specs-nonce">window.keepSpy()</script>
            </div>
          `

          htmlFixture(html)
          const scriptBeforeRender = document.querySelector('#script')

          expect(window.keepSpy.calls.count()).toBe(1)

          // Must render from { url } or { document } so DOMParser and fixParserDamage() is involed.
          up.render('#container', { document: html })

          await wait()

          expect(document.querySelector('#script')).toBe(scriptBeforeRender)
          expect(window.keepSpy.calls.count()).toBe(1)

          // Must render from { url } or { document } so DOMParser and fixParserDamage() is involed.
          up.render('#container', { document: html, keep: false })

          await wait()

          expect(document.querySelector('#script')).not.toBe(scriptBeforeRender)
          expect(window.keepSpy.calls.count()).toBe(2)

          delete window.keepSpy
        })

        it('does not re-run a kept <script> element when rendering with DOMParser (bugfix)', async function() {
          window.specSpy = jasmine.createSpy('specSpy() function')
          expect(window.specSpy.calls.count()).toBe(0)

          const html = `
            <div id="container">
              <script id="script" up-keep nonce="specs-nonce">window.specSpy()</script>
            </div>
          `

          htmlFixture(html)
          expect(window.specSpy.calls.count()).toBe(1)

          // Must render from { url } or { document } so DOMParser and fixParserDamage() is involed.
          up.render('#container', { document: html })

          await wait()

          expect(window.specSpy.calls.count()).toBe(1)

          delete window.specSpy
        })

        it('does not re-run a kept <script> element when rendering without DOMParser (bugfix)', async function() {
          window.specSpy = jasmine.createSpy('specSpy() function')
          expect(window.specSpy.calls.count()).toBe(0)

          const html = `
            <div id="container">
              <script id="script" up-keep nonce="specs-nonce">window.specSpy()</script>
            </div>
          `

          htmlFixture(html)
          expect(window.specSpy.calls.count()).toBe(1)

          document.querySelector('#container #script').classList.add('the-original-one')

          // Rendering from { fragment } does *not* use DOMParser to parse HTML
          up.render({ fragment: html })

          await wait()

          expect(window.specSpy.calls.count()).toBe(1)

          delete window.specSpy
        })

        it('keeps a <noscript> element (bugfix)', async function() {
          const html = `
            <div id="container">
              <noscript id="noscript" up-keep></noscript>
            </div>
          `

          htmlFixture(html)
          const noscriptBeforeRender = document.querySelector('#noscript')

          // Must render from { url } or { document } so DOMParser and fixParserDamage() is involed.
          up.render('#container', { document: html })

          await wait()

          expect(document.querySelector('#noscript')).toBe(noscriptBeforeRender)
        })
      })

      describe('if an [up-keep] element is itself a direct replacement target', function() {

        it("keeps that element", async function() {
          $fixture('.keeper[up-keep]').text('old-inside')
          up.render({ fragment: `
            <div class='keeper' up-keep>new-inside</div>
          ` })

          await wait()
          expect('.keeper').toHaveText('old-inside')
        })

        it("does not run the element's destructors", async function() {
          const destructor = jasmine.createSpy('destructor spy')

          up.compiler('.keepable', (element) => destructor)

          const keepable = fixture('.keepable[up-keep]', { text: 'old text' })

          up.hello(keepable)

          up.render('.keepable', { document: `
            <div class='keepable' up-keep>
              new text
            </div>
          ` })

          await wait()
          expect(destructor).not.toHaveBeenCalled()

          up.destroy('.keepable')
          await wait()
          expect(destructor).toHaveBeenCalled()
        })

        it("only emits an event up:fragment:keep, but not an event up:fragment:inserted", async function() {
          const insertedListener = jasmine.createSpy('subscriber to up:fragment:inserted')
          const keepListener = jasmine.createSpy('subscriber to up:fragment:keep')
          up.on('up:fragment:keep', keepListener)
          up.on('up:fragment:inserted', insertedListener)
          const $keeper = $fixture('.keeper[up-keep]').text('old-inside')
          up.render('.keeper', { document: `
            <div class='keeper new' up-keep>new-inside</div>
          ` })

          await wait()
          expect(insertedListener).not.toHaveBeenCalled()
          expect(keepListener).toHaveBeenCalledWith(
            jasmine.objectContaining({ newFragment: jasmine.objectContaining({ className: 'keeper new' }) }),
            $keeper[0],
            jasmine.anything()
          )
        })

        it('emits an up:fragment:kept event if up:fragment:keep is not prevented', async function() {
          let html = `<div id="keeper" up-keep></div>`
          let [keeper] = htmlFixtureList(html)
          let keptSpy = jasmine.createSpy('up:fragment:kept listener')
          document.addEventListener('up:fragment:kept', keptSpy)

          up.render({ fragment: html })
          await wait()

          expect(keptSpy).toHaveBeenCalledWith(jasmine.anyEvent('up:fragment:kept'))
        })

        it('does not emit an up:fragment:kept event if up:fragment:keep is prevented', async function() {
          let html = `<div id="keeper" up-keep></div>`
          let [keeper] = htmlFixtureList(html)
          keeper.addEventListener('up:fragment:keep', (event) => event.preventDefault())
          let keptSpy = jasmine.createSpy('up:fragment:kept listener')
          document.addEventListener('up:fragment:kept', keptSpy)

          up.render({ fragment: html })
          await wait()

          expect(keptSpy).not.toHaveBeenCalled()
        })

      })

      it("removes an [up-keep] element if no matching element is found in the response", async function() {
        const barCompiler = jasmine.createSpy()
        const barDestructor = jasmine.createSpy()
        up.compiler('.bar', function(bar) {
          const text = bar.innerText
          barCompiler(text)
          return () => barDestructor(text)
        })

        const $container = $fixture('.container')
        $container.html(`
          <div class='foo'>old-foo</div>
          <div class='bar' up-keep>old-bar</div>
        `)
        up.hello($container)

        expect(barCompiler.calls.allArgs()).toEqual([['old-bar']])
        expect(barDestructor.calls.allArgs()).toEqual([])

        up.render({ fragment: `
          <div class='container'>
            <div class='foo'>new-ffrooo</div>
          </div>
        ` })

        await wait()
        expect('.container .foo').toBeAttached()
        expect('.container .bar').not.toBeAttached()

        expect(barCompiler.calls.allArgs()).toEqual([['old-bar']])
        expect(barDestructor.calls.allArgs()).toEqual([['old-bar']])
      })

      it("keeps an element even if the new element is no longer [up-keep]", function() {
        const container = htmlFixture(`
          <div class='container'>
            <div class='foo'>old-foo</div>
            <div class='bar' up-keep>old-bar</div>
          </div>
        `)
        up.hello(container)

        up.render({ fragment: `
          <div class='container'>
            <div class='foo'>new-foo</div>
            <div class='bar'>new-bar</div>
          </div>
        ` })

        expect('.container .foo').toHaveText('new-foo')
        expect('.container .bar').toHaveText('old-bar')
      })

      it("updates an element if a matching element is found in the response, but that other element has [up-keep=false]", async function() {
        const barCompiler = jasmine.createSpy()
        const barDestructor = jasmine.createSpy()
        up.compiler('.bar', function(bar) {
          const text = bar.innerText
          barCompiler(text)
          return () => barDestructor(text)
        })

        const $container = $fixture('.container')
        $container.html(`
          <div class='foo'>old-foo</div>
          <div class='bar' up-keep>old-bar</div>
        `)
        up.hello($container)

        expect(barCompiler.calls.allArgs()).toEqual([['old-bar']])
        expect(barDestructor.calls.allArgs()).toEqual([])

        up.render({ fragment: `
          <div class='container'>
            <div class='foo'>new-foo</div>
            <div class='bar' up-keep='false'>new-bar</div>
          </div>
        ` })

        await wait()
        expect('.container .foo').toHaveText('new-foo')
        expect('.container .bar').toHaveText('new-bar')

        expect(barCompiler.calls.allArgs()).toEqual([['old-bar'], ['new-bar']])
        expect(barDestructor.calls.allArgs()).toEqual([['old-bar']])
      })

      it('keeps an element with [up-keep=true]', function() {
        const container = htmlFixture(`
          <div class='container'>
            <div class='foo'>old-foo</div>
            <div class='bar' up-keep='true'>old-bar</div>
          </div>
        `)
        up.hello(container)

        up.render({ fragment: `
          <div class='container'>
            <div class='foo'>new-foo</div>
            <div class='bar' up-keep='true'>new-bar</div>
          </div>
        ` })

        expect('.container .foo').toHaveText('new-foo')
        expect('.container .bar').toHaveText('old-bar')
      })

      it('updates an element with [up-keep=false], even if a matching element in the response has [up-keep]', function() {
        const container = htmlFixture(`
          <div class='container'>
            <div class='foo'>old-foo</div>
            <div class='bar' up-keep='false'>old-bar</div>
          </div>
        `)
        up.hello(container)

        up.render({ fragment: `
          <div class='container'>
            <div class='foo'>new-foo</div>
            <div class='bar' up-keep>new-bar</div>
          </div>
        ` })

        expect('.container .foo').toHaveText('new-foo')
        expect('.container .bar').toHaveText('new-bar')
      })

      it('moves a kept element to the ancestry position of the matching element in the response', async function() {
        const $container = $fixture('.container')
        $container.html(`
          <div class="parent1">
            <div class="keeper" up-keep>old-inside</div>
          </div>
          <div class="parent2">
          </div>
        `)
        up.render({ fragment: `
          <div class='container'>
            <div class="parent1">
            </div>
            <div class="parent2">
              <div class="keeper" up-keep>old-inside</div>
            </div>
          </div>
        ` })

        await wait()
        expect('.keeper').toHaveText('old-inside')
        expect($('.keeper').parent()).toEqual($('.parent2'))
      })

      if (up.migrate.loaded) {
        it('lets developers choose a selector to match against as the value of the [up-keep] attribute', function() {
          const container = fixture('.container')

          container.innerHTML = `
            <audio id='player' src='foo.mp3' up-keep='[src="foo.mp3"]' data-tag='1'></audio>
          `

          up.hello(container)

          expect(document.querySelector('#player').src).toMatchURL('foo.mp3')
          expect(document.querySelector('#player').dataset.tag).toBe('1')

          up.render({ fragment: `
            <div class='container'>
              <audio id='player' src='bar.mp3' up-keep='[src="bar.mp3"]' data-tag='2'></audio>
            </div>
          ` })

          expect(document.querySelector('#player').src).toMatchURL('bar.mp3')
          expect(document.querySelector('#player').dataset.tag).toBe('2')

          up.render({ fragment: `
            <div class='container'>
              <audio id='player' src='bar.mp3' up-keep='[src="bar.mp3"]' data-tag='3'></audio>
            </div>
          ` })

          expect(document.querySelector('#player').src).toMatchURL('bar.mp3')
          expect(document.querySelector('#player').dataset.tag).toBe('2')
        })

        it('does not print a deprecation warning for [up-keep=true]', function() {
          const warnSpy = up.migrate.warn.mock()

          const container = htmlFixture(`
            <div class='container'>
              <div class='foo'>old-foo</div>
              <div class='bar' up-keep='true'>old-bar</div>
            </div>
          `)
          up.hello(container)

          expect(warnSpy).not.toHaveBeenCalled()
        })
      }

      it('does not compile a kept element a second time', async function() {
        const compiler = jasmine.createSpy('compiler')
        up.compiler('.keeper', compiler)

        const $container = $fixture('.container')
        $container.html(`
          <div class="keeper" up-keep>old-text</div>
        `)

        up.hello($container)
        expect(compiler.calls.count()).toEqual(1)

        up.render({ fragment: `
          <div class='container'>
            <div class="keeper" up-keep>new-text</div>
          </div>
        ` })

        await wait()

        expect(compiler.calls.count()).toEqual(1)
        expect('.keeper').toBeAttached()
        expect('.keeper').toHaveText('old-text')
      })

      it('does not lose jQuery event handlers on a kept element (bugfix)', async function() {
        const handler = jasmine.createSpy('event handler')
        up.compiler('.keeper', (keeper) => keeper.addEventListener('click', handler))

        const $container = $fixture('.container')
        $container.html(`
          <div class="keeper" up-keep>old-text</div>
        `)
        up.hello($container)

        up.render({ fragment: `
          <div class='container'>
            <div class="keeper" up-keep>new-text</div>
          </div>
        ` })

        await wait()

        expect('.keeper').toHaveText('old-text')
        await wait()

        Trigger.click('.keeper')
        await wait()

        expect(handler).toHaveBeenCalled()
      })

      it('does not call destructors on a kept alement', async function() {
        const destructor = jasmine.createSpy('destructor')
        up.compiler('.keeper', (keeper) => destructor)

        const $container = $fixture('.container')
        $container.html(`
          <div class="keeper" up-keep>old-text</div>
        `)
        up.hello($container)

        up.render({ fragment: `
          <div class='container'>
            <div class="keeper" up-keep>new-text</div>
          </div>
        ` })

        await wait()

        const $keeper = $('.keeper')
        expect($keeper).toHaveText('old-text')
        expect(destructor).not.toHaveBeenCalled()
      })

      it('calls destructors when a kept element is eventually removed from the DOM', async function() {
        const handler = jasmine.createSpy('event handler')
        const destructor = jasmine.createSpy('destructor')
        up.compiler('.keeper', (keeper) => destructor)

        const $container = $fixture('.container')
        $container.html(`
          <div class="keeper" up-keep>old-text</div>
        `)
        up.hello($container)

        up.render({ fragment: `
          <div class='container'>
            <div class="keeper" up-keep="false">new-text</div>
          </div>
        ` })

        await wait()

        const $keeper = $('.keeper')
        expect($keeper).toHaveText('new-text')
        expect(destructor).toHaveBeenCalled()
      })

      it('emits an up:fragment:keep event that lets listeners inspect the new element and its data', async function() {
        const $keeper = $fixture('.keeper[up-keep]').text('old-inside')
        const listener = jasmine.createSpy('event listener')
        $keeper[0].addEventListener('up:fragment:keep', listener)
        up.render('.keeper', { document: `
          <div class='keeper new' up-keep up-data='{ "key": "new-value" }'>new-inside</div>
        ` })

        await wait()

        expect(listener).toHaveBeenCalledWith(
          jasmine.objectContaining({
            newFragment: jasmine.objectContaining({ className: 'keeper new' }),
            newData: jasmine.objectContaining({ key: 'new-value' }),
            target: $keeper[0]
          })
        )
      })

      it('emits an up:fragment:keep event with information about the render pass', async function() {
        const keeper = fixture('.keeper[up-keep]', { text: 'old inside' })
        const listener = jasmine.createSpy('event listener')
        keeper.addEventListener('up:fragment:keep', listener)
        up.render('.keeper', { document: `
          <div class='keeper new' up-keep>new-inside</div>
        `, abort: 'all', scroll: 'top' })

        await wait()

        expect(listener).toHaveBeenCalledWith(
          jasmine.objectContaining({
            renderOptions: jasmine.objectContaining({ abort: 'all', scroll: 'top' })
          })
        )
      })

      it('emits an up:fragment:keep with { newData: {} } if the new element had no up-data value', async function() {
        const keepListener = jasmine.createSpy()
        up.on('up:fragment:keep', keepListener)
        const $container = $fixture('.container')
        const $keeper = $container.affix('.keeper[up-keep]').text('old-inside')
        up.render('.keeper', { document: `
          <div class='container'>
            <div class='keeper' up-keep>new-inside</div>
          </div>
        ` })

        await wait()

        expect('.keeper').toHaveText('old-inside')
        expect(keepListener).toEqual(jasmine.anything(), $('.keeper'), {})
      })

      it('allows to define a listener in an [up-on-keep] attribute', async function() {
        const keeper = fixture('.keeper[up-keep][up-on-keep="nonce-specs-nonce this.onKeepSpy(this, event, newFragment, newData)"]', { text: 'old-inside' })

        keeper.onKeepSpy = jasmine.createSpy('onKeep spy')

        up.render('.keeper', { document: `
          <div class='keeper new' up-keep up-data='{ "key": "new-value" }'>new-inside</div>
        ` })

        await wait()

        expect(keeper.onKeepSpy).toHaveBeenCalledWith(
          keeper,
          jasmine.anyEvent('up:fragment:keep'),
          jasmine.objectContaining({ className: 'keeper new' }),
          jasmine.objectContaining({ key: 'new-value' })
        )
      })

      it('lets listeners cancel the keeping by preventing default on an up:fragment:keep event', async function() {
        const $keeper = $fixture('.keeper[up-keep]').text('old-inside')
        $keeper.on('up:fragment:keep', (event) => event.preventDefault())
        up.render({ fragment: `
          <div class='keeper' up-keep>new-inside</div>
        ` })

        await wait()

        expect('.keeper').toHaveText('new-inside')
      })

      it('emits an up:fragment:kept event if up:fragment:keep is not prevented', async function() {
        let html = `
          <div id="container">
            <div id="keeper" up-keep></div>
          </div>
        `
        let [container, keeper] = htmlFixtureList(html)
        let keptSpy = jasmine.createSpy('up:fragment:kept listener')
        document.addEventListener('up:fragment:kept', keptSpy)

        up.render({ fragment: html })
        await wait()

        expect(keptSpy).toHaveBeenCalledWith(jasmine.objectContaining({
          type: 'up:fragment:kept',
          target: keeper,
        }))
      })

      it('does not emit an up:fragment:kept event if up:fragment:keep is prevented', async function() {
        let html = `
          <div id="container">
            <div id="keeper" up-keep></div>
          </div>
        `
        let [container, keeper] = htmlFixtureList(html)
        keeper.addEventListener('up:fragment:keep', (event) => event.preventDefault())
        let keptSpy = jasmine.createSpy('up:fragment:kept listener')
        document.addEventListener('up:fragment:kept', keptSpy)

        up.render({ fragment: html })
        await wait()

        expect(keptSpy).not.toHaveBeenCalled()
      })

      it('lets listeners prevent up:fragment:keep event if the element was kept before (bugfix)', async function() {
        const $keeper = $fixture('.keeper[up-keep]').text('version 1')
        $keeper[0].addEventListener('up:fragment:keep', function(event) {
          if (event.newFragment.textContent.trim() === 'version 3') { event.preventDefault() }
        })

        up.render({ fragment: `
          <div class='keeper' up-keep>version 2</div>
        ` })
        await wait()

        expect('.keeper').toHaveText('version 1')

        up.render({ fragment: `
          <div class='keeper' up-keep>version 3</div>
        ` })
        await wait()

        expect('.keeper').toHaveText('version 3')
      })

      it('emits an up:fragment:keep event on a keepable element and up:fragment:inserted on the targeted parent', async function() {
        const insertedListener = jasmine.createSpy()
        up.on('up:fragment:inserted', insertedListener)
        const keepListener = jasmine.createSpy()
        up.on('up:fragment:keep', keepListener)

        const $container = $fixture('.container')
        $container.html(`
          <div class="keeper" up-keep></div>
        `)

        up.render({ fragment: `
          <div class='container'>
            <div class="keeper" up-keep></div>
          </div>
        ` })

        await wait()

        expect(insertedListener).toHaveBeenCalledWith(jasmine.anything(), $('.container')[0], jasmine.anything())
        expect(keepListener).toHaveBeenCalledWith(jasmine.anything(), $('.container .keeper')[0], jasmine.anything())
      })

      it('reuses the same element and emits up:fragment:keep during multiple extractions', async function() {
        const keepListener = jasmine.createSpy()
        up.on('up:fragment:keep', (event) => keepListener(event.target, event.newData))
        const $container = $fixture('.container')
        let $keeper = $container.affix('.keeper[up-keep]').text('old-inside')

        up.render('.keeper', { document: `
          <div class='container'>
            <div class='keeper' up-keep up-data='{ "key": "value1" }'>new-inside</div>
          </div>
        ` })
        await wait()

        up.render('.keeper', { document: `
          <div class='container'>
            <div class='keeper' up-keep up-data='{ "key": "value2" }'>new-inside</div>
          </div>
        ` })
        await wait()

        $keeper = $('.keeper')
        expect($keeper).toHaveText('old-inside')
        expect(keepListener).toHaveBeenCalledWith($keeper[0], jasmine.objectContaining({ key: 'value1' }))
        expect(keepListener).toHaveBeenCalledWith($keeper[0], jasmine.objectContaining({ key: 'value2' }))
      })

      it("doesn't let the discarded element appear in a transition", async function() {
        up.motion.config.enabled = true

        let oldTextDuringTransition = undefined
        let newTextDuringTransition = undefined
        const transition = function(oldElement, newElement) {
          oldTextDuringTransition = squish(oldElement.innerText)
          newTextDuringTransition = squish(newElement.innerText)
          return Promise.resolve()
        }

        const $container = $fixture('.container')
        $container.html(`
          <div class='foo'>old-foo</div>
          <div class='bar' up-keep>old-bar</div>
        `)

        const newHTML = `
          <div class='container'>
            <div class='foo'>new-foo</div>
            <div class='bar' up-keep>new-bar</div>
          </div>
        `

        await up.render('.container', {
          fragment: newHTML,
          transition,
        }).finished

        expect(oldTextDuringTransition).toEqual('old-foo old-bar')
        expect(newTextDuringTransition).toEqual('new-foo old-bar')
      })

      it('prints a warning when the [up-keep] element is not targetable, but does not crash the render pass', async function() {
        spyOn(up, 'warn').and.callThrough()

        let html = (prefix) => `
          <div id="target">
            <span up-keep>${prefix} keepable</span>
            <span id="content">${prefix} content</span>
          </div>
        `

        htmlFixture(html('old'))

        let renderPromise = up.render({ fragment: html('new') })

        await expectAsync(renderPromise).toBeResolvedTo(jasmine.any(up.RenderResult))

        expect('#target [up-keep]').toHaveText('new keepable')
        expect('#target #content').toHaveText('new content')

        expect(up.warn).toHaveBeenCalledWith('[up-keep]', jasmine.stringMatching(/Cannot keep untargetable/i), jasmine.anything())
      })

      function keepableFixture(html, renderOptions = {}) {
        // Make sure we insert the element through rendering, so we can test
        // our own HTML pollution with [up-etag], [up-time], [up-source].
        fixture('#keepable')
        up.render({ target: '#keepable', document: html, ...renderOptions })

        return document.querySelector('#keepable')
      }

      describe('with [up-keep="same-html"]', function() {

        it('keeps the element if its outer HTML is stable', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-html">text</div>')
          await wait()

          up.render({ fragment: `<div id="keepable" up-keep="same-html">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('keeps an [up-keep] descendant if its outer HTML is stable', async function() {
          let [container, keepable] = htmlFixtureList(`
            <div id="container">
              <div id="keepable" up-keep="same-html">text</div>
            </div>
          `)
          up.hello(container)

          up.render({ fragment: `<div id="keepable" up-keep="same-html">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('ignores indentation', async function() {
          let [container, keepable] = htmlFixtureList(`
            <div id="container">
              <div id="keepable" up-keep="same-html">
                text
              </div>
            </div>
          `)
          up.hello(container)

          up.render({ fragment: `
                  <div id="keepable" up-keep="same-html">
                          text
                  </div>
          ` })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('ignores HTML changes made by a user compiler', async function() {
          up.compiler('#keepable', (el) => el.innerText = 'text changed by compiler')

          let keepable = keepableFixture('<div id="keepable" up-keep="same-html">text</div>')
          expect(keepable).toHaveText('text changed by compiler')

          up.render({ fragment: `<div id="keepable" up-keep="same-html">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
          expect(document.querySelector('#keepable')).toHaveText('text changed by compiler')
        })

        it('ignores HTML changes made by a user macro', async function() {
          up.macro('#keepable', (el) => el.innerText = 'text changed by macro')

          let keepable = keepableFixture('<div id="keepable" up-keep="same-html">text</div>')
          expect(keepable).toHaveText('text changed by macro')

          up.render({ fragment: `<div id="keepable" up-keep="same-html">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
          expect(document.querySelector('#keepable')).toHaveText('text changed by macro')
        })

        it('ignores HTML changes made by a system macro', async function() {
          let html = `
            <div id="keepable" up-expand up-keep="same-html">
              <a href="/path">text</a>
            </div>
          `
          let keepable = keepableFixture(html)
          expect(keepable).toBeFollowable()
          expect(keepable).toHaveAttribute('up-href', '/path')

          up.render({ fragment: html })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('keeps an identical element that was introduced by a transition (which adds tracking classes)', async function() {
          fixture('#keepable')
          let html = '<div id="keepable" up-keep="same-html">text</div>'
          let keepable = (await up.render({ target: '#keepable', document: html, transition: 'cross-fade', duration: 70 }).finished).fragment
          expect(keepable).toMatchSelector('#keepable')

          up.render({ fragment: html })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('keeps an element when a new identical element was introduced by a transition (which adds tracking classes)', async function() {
          let html = '<div id="keepable" up-keep="same-html">text</div>'
          let keepable = keepableFixture(html)

          await up.render({ fragment: html, transition: 'cross-fade', duration: 70 }).finished

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('keeps an identical element that was originally appended with an animation (which adds tracking classes)', async function() {
          htmlFixture(`
            <div id="container">
            </div>
          `)

          const containerWithKeepableHTML = `
            <div id="container">
              <div id="keepable" up-keep="same-html">text</div>
            </div>
          `

          let keepable = (await up.render({
            target: '#container:after',
            animation: 'fade-in',
            duration: 70,
            document: containerWithKeepableHTML,
          }).finished).fragment

          expect(keepable).toMatchSelector('#keepable')

          await up.render({
            target: '#container',
            document: containerWithKeepableHTML,
            transition: 'cross-fade',
            duration: 70
          }).finished

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('keeps an identical element that was originally appended without animation', async function() {
          htmlFixture(`
            <div id="container">
            </div>
          `)

          const containerWithKeepableHTML = `
            <div id="container">
              <div id="keepable" up-keep="same-html">text</div>
            </div>
          `

          let keepable = (await up.render({
            target: '#container:after',
            document: containerWithKeepableHTML,
          }).finished).fragment

          expect(keepable).toMatchSelector('#keepable')

          await up.render({
            target: '#container',
            document: containerWithKeepableHTML,
            transition: 'cross-fade',
            duration: 70
          }).finished

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('keeps an identical element that was introduced by swapping children with :content', async function() {
          htmlFixture(`
            <div id="container">
            </div>
          `)

          const containerWithKeepableHTML = `
            <div id="container">
              <div id="keepable" up-keep="same-html">text</div>
            </div>
          `

          let keepable = (await up.render({
            target: '#container:content',
            document: containerWithKeepableHTML,
          }).finished).fragment

          expect(keepable).toMatchSelector('#keepable')

          await up.render({
            target: '#container:content',
            document: containerWithKeepableHTML,
            transition: 'cross-fade',
            duration: 70
          }).finished

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('ignores HTML changes that happened after rendering', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-html">text</div>')

          keepable.innerText = 'text changed after rendering'
          expect(keepable).toHaveText('text changed after rendering')

          up.render({ fragment: `<div id="keepable" up-keep="same-html">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
          expect(document.querySelector('#keepable')).toHaveText('text changed after rendering')
        })

        it('replaces the element if its text changed', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-html">old text</div>')

          up.render({ fragment: `<div id="keepable" up-keep="same-html">new text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).not.toBe(keepable)
        })

        it('replaces the element if an attribute changed', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-html" attr="old">text</div>')

          up.render({ fragment: `<div id="keepable" up-keep="same-html" attr="new">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).not.toBe(keepable)
        })

        it('replaces the element if child element changed', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-html" attr="old"></div>')

          up.render({ fragment: `
            <div id="keepable" up-keep="same-html" attr="new">
              <span></span>
            </div>
          ` })
          await wait()

          expect(document.querySelector('#keepable')).not.toBe(keepable)
        })

        it('ignores a <script nonce> for the comparison', async function() {
          up.script.config.scriptElementPolicy = 'pass'

          spyOn(up.script, 'cspNonce').and.returnValue('page-secret')

          let keepable = keepableFixture(`<div id="keepable" up-keep="same-html"><script nonce="page-secret"></script></div>`)

          up.render({ target: '#keepable', url: '/path' })
          await wait()

          jasmine.respondWith({
            responseText: `<div id="keepable" up-keep="same-html"><script nonce="response-secret"></script></div>`,
            responseHeaders: { 'Content-Security-Policy': "script-src 'nonce-response-secret'" }
          })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('ignores a callback nonce for the comparison', async function() {
          up.script.config.scriptElementPolicy = 'pass'

          spyOn(up.script, 'cspNonce').and.returnValue('page-secret')

          let keepable = keepableFixture(`<input id="keepable" name="foo" up-keep="same-html" up-watch="nonce-page-secret foo()"></input>`)

          up.render({ target: '#keepable', url: '/path' })
          await wait()

          jasmine.respondWith({
            responseText: `<input id="keepable" name="foo" up-keep="same-html" up-watch="nonce-response-secret foo()"></input>`,
            responseHeaders: { 'Content-Security-Policy': "script-src 'nonce-response-secret'" }
          })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('ignores multiple callback nonces within the same tag', async function() {
          up.script.config.scriptElementPolicy = 'pass'

          spyOn(up.script, 'cspNonce').and.returnValue('page-secret')

          let keepable = keepableFixture(`<a id="keepable" href="/path" up-keep="same-html" up-on-rendered="nonce-page-secret foo()" data-x="x" up-on-finished="nonce-page-secret bar()" data-y="y">text</a>`)

          up.render({ target: '#keepable', url: '/path' })
          await wait()

          jasmine.respondWith({
            responseText: `<a id="keepable" href="/path" up-keep="same-html" up-on-rendered="nonce-response-secret foo()" data-x="x" up-on-finished="nonce-response-secret bar()" data-y="y">text</a>`,
            responseHeaders: { 'Content-Security-Policy': "script-src 'nonce-response-secret'" }
          })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

      })

      describe('with [up-keep="same-data"]', function() {

        it('keeps the element if its data is stable, even though the innerHTML changed', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-data" up-data="{ foo: 1 }">text</div>')

          up.render({ fragment: `<div id="keepable" up-keep="same-data" up-data="{ foo: 1 }">changed text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('keeps an [up-keep] descendant if its data is stable, even though the innerHTML changed', async function() {
          let [container, keepable] = htmlFixtureList(`
            <div id="container">
              <div id="keepable" up-keep="same-data" up-data="{ foo: 1 }">text</div>
            </div>
          `)
          up.hello(container)

          up.render({ fragment: `<div id="keepable" up-keep="same-data" up-data="{ foo: 1 }">changed text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('keeps an element with an empty [up-data] object when the new element has no [up-data] attribute at all')

        it('merges [up-data] and [data-*] attribute in both elements before comparison')

        it('ignores data mutated after rendering', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-data" up-data="{ foo: 1 }">text</div>')

          up.data(keepable).bar = 2
          expect(up.data(keepable)).toEqual({ foo: 1, bar: 2 })

          up.render({ fragment: `<div id="keepable" up-keep="same-data" up-data="{ foo: 1 }">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).toBe(keepable)
        })

        it('replaces the element if a data value changed', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-data" up-data="{ foo: 1 }">text</div>')

          up.render({ fragment: `<div id="keepable" up-keep="same-data" up-data="{ foo: 2 }">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).not.toBe(keepable)
        })

        it('replaces the element if the new element has an additional data key', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-data" up-data="{ foo: 1 }">text</div>')

          up.render({ fragment: `<div id="keepable" up-keep="same-data" up-data="{ foo: 1, bar: 2 }">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).not.toBe(keepable)
        })

        it('replaces the element if has data, but the new element does not', async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-data" up-data="{ foo: 1 }">text</div>')

          up.render({ fragment: `<div id="keepable" up-keep="same-data">text</div>` })
          await wait()

          expect(document.querySelector('#keepable')).not.toBe(keepable)
        })

        it("replaces the element if it doesn't have data, but the new element has data", async function() {
          let keepable = keepableFixture('<div id="keepable" up-keep="same-data"></div>')

          up.render({ fragment: `
            <div id="keepable" up-keep="same-data" up-data="{ foo: 1 }"></div>
          ` })
          await wait()

          expect(document.querySelector('#keepable')).not.toBe(keepable)
        })

      })

    })

  })

})
