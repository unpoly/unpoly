const e = up.element
const $ = jQuery

extendDescribe('up.link', function() {

  extendDescribe('unobtrusive behavior', function() {

    describe('a[up-target]', function() {

      it('does not follow a form with up-target attribute (bugfix)', async function() {
        const $form = $fixture('form[up-target]')
        up.hello($form)
        const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
        Trigger.clickSequence($form)

        await wait()

        expect(followSpy).not.toHaveBeenCalled()
      })

      it('requests the [href] with AJAX and replaces the [up-target] selector', async function() {
        $fixture('.target')
        const $link = $fixture('a[href="/path"][up-target=".target"]')
        Trigger.clickSequence($link)

        await wait()

        jasmine.respondWith(`
          <div class="target">new text</div>
        `)

        await wait()

        expect('.target').toHaveText('new text')
      })

      it('adds a history entry', async function() {
        up.history.config.enabled = true
        up.fragment.config.navigateOptions.history = true

        $fixture('.target')
        const $link = $fixture('a[href="/new-path"][up-target=".target"]')
        Trigger.clickSequence($link)

        await wait()

        jasmine.respondWith(`
          <div class="target">new text</div>
        `)

        await wait(1000)

        expect('.target').toHaveText('new text')
        expect(location.pathname).toEqual('/new-path')
      })

      it('respects a X-Up-Location header that the server sends in case of a redirect', async function() {
        up.history.config.enabled = true

        $fixture('.target')
        const $link = $fixture('a[href="/path"][up-target=".target"][up-history]')
        Trigger.clickSequence($link)

        await wait()

        jasmine.respondWith({
          responseText: `
            <div class="target">new text</div>
          `,
          responseHeaders: { 'X-Up-Location': '/other/path' }
        })

        await wait()

        expect('.target').toHaveText('new text')
        expect(location.pathname).toEqual('/other/path')
      })

      describe('caching', function() {

        it('instantly shows cached content', async function() {
          fixture('#target', { text: 'initial target' })
          up.request('/path', { target: '#target', cache: true })

          await wait()

          jasmine.respondWithSelector('#target', { text: 'cached target' })

          await wait()

          expect({ url: '/path', target: '#target' }).toBeCached()

          const link = fixture('a[href="/path"][up-target="#target"][up-revalidate="false"]')

          Trigger.clickSequence(link)

          await wait()

          expect('#target').toHaveText('cached target')
          expect(up.network.isBusy()).toBe(false)
        })

        it('revalidates cached content', async function() {
          fixture('#target', { text: 'initial target' })
          up.request('/path', { target: '#target', cache: true })

          await wait()

          jasmine.respondWithSelector('#target', { text: 'cached target' })

          await wait()

          expect({ url: '/path', target: '#target' }).toBeCached()

          const link = fixture('a[href="/path"][up-target="#target"][up-revalidate="true"]')

          Trigger.clickSequence(link)

          await wait()

          expect('#target').toHaveText('cached target')
          expect(up.network.isBusy()).toBe(true)
          expect(jasmine.lastRequest().url).toMatchURL('/path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#target')

          jasmine.respondWithSelector('#target', { text: 'revalidated target' })

          await wait()

          expect('#target').toHaveText('revalidated target')
          expect(up.network.isBusy()).toBe(false)
        })

        it('revalidates cached content including hungry fragments (E2E)', async function() {
          fixture('#target', { text: 'initial target' })
          fixture('#hungry[up-hungry]', { text: 'initial hungry' })

          up.request('/path', { target: '#target', cache: true })

          await wait()

          jasmine.respondWith(`
            <div id="target">cached target</div>
            <div id="hungry" up-hungry>cached hungry</div>
          `)

          await wait()

          expect({ url: '/path', target: '#target' }).toBeCached()

          const link = fixture('a[href="/path"][up-target="#target"][up-revalidate="true"]')

          Trigger.clickSequence(link)

          await wait()

          expect('#target').toHaveText('cached target')
          expect('#hungry').toHaveText('cached hungry')
          expect(up.network.isBusy()).toBe(true)
          expect(jasmine.lastRequest().url).toMatchURL('/path')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toContain('#target')

          jasmine.respondWith(`
            <div id="target">revalidated target</div>
            <div id="hungry">revalidated hungry</div>
          `)

          await wait()

          expect('#target').toHaveText('revalidated target')
          expect('#hungry').toHaveText('revalidated hungry')
          expect(up.network.isBusy()).toBe(false)
        })
      })

      describe('choice of target', function() {

        it('prefers to match an element closest to the link', async function() {
          htmlFixtureList(`
            <div class="element" id="root">
              <div class="element">old one</div>
              <div class="element">
                old two
                <a class="origin" href="/path" up-target=".element">link label</a>
              </div>
              <div class="element">old three</div>
            </div>
          `)

          const origin = document.querySelector('.origin')
          Trigger.clickSequence(origin)
          await wait()

          jasmine.respondWith(`
            <div class="element">
              new text
            </div>
          `)
          await wait()

          const elements = document.querySelectorAll('.element')
          expect(elements.length).toBe(4)

          // While #root is an ancestor, two was closer
          expect(elements[0]).toMatchSelector('#root')
          expect(elements[0]).not.toHaveText('new text')

          // One is a sibling of two
          expect(elements[1]).toHaveText('old one')

          // Two is the closest match around the origin
          expect(elements[2]).toHaveText('new text')

          // Three is a sibling of three
          expect(elements[3]).toHaveText('old three')
        })


        it('processes a target ".attendee-8993501089:maybe" (bugfix)', async function() {
          htmlFixtureList(`
            <div class="element attendee-1">
              old one
            </div>

            <div class="element attendee-8993501089">
              old two
              <a class="origin" href="/path" up-target=".element">link label</a>
            </div>

            <div class="element attendee-3">
              old three
            </div>
          `)

          const origin = document.querySelector('.origin')
          Trigger.clickSequence(origin)
          await wait()

          jasmine.respondWith(`
            <div class="element">
              new text
            </div>
          `)
          await wait()

          const elements = document.querySelectorAll('.element')
          expect(elements.length).toBe(3)

          expect(elements[0]).toHaveText('old one')
          expect(elements[1]).toHaveText('new text')
          expect(elements[2]).toHaveText('old three')
        })

        it('processes a target ".container:has(:origin):maybe" (bugfix)', async function() {
          htmlFixtureList(`
            <div class="container">
              old one
            </div>

            <div class="container">
              old two
              <a href="/path" up-target=".container:has(:origin):maybe">link label</a>
            </div>

            <div class="container">
              old three
            </div>
          `)

          const origin = document.querySelector('.container a[href]')
          Trigger.clickSequence(origin)
          await wait()

          jasmine.respondWith(`
            <div class="container">
              new text
              <a href="/path">link label</a>
            </div>
          `)
          await wait()

          const containers = document.querySelectorAll('.container')
          expect(containers.length).toBe(3)

          expect(containers[0]).toHaveText('old one')
          expect(containers[1]).toHaveText('new text link label')
          expect(containers[2]).toHaveText('old three')
        })


      })

      describe('choice of layer', function() {

        beforeEach(function() {
          up.motion.config.enabled = false
        })

        it('updates a target in the same layer as the clicked link', async function() {
          $fixture('.document').affix('.target').text('old document text')
          up.layer.open({ fragment: "<div class='target'>old modal text</div>" })

          await wait()

          expect('.document .target').toHaveText('old document text')
          expect('up-modal .target').toHaveText('old modal text')

          const $linkInModal = $('up-modal-content').affix('a[href="/bar"][up-target=".target"]').text('link label')
          Trigger.clickSequence($linkInModal)

          await wait()

          jasmine.respondWith(`
            <div class="target">new text from modal link</div>
          `)

          await wait()

          expect('.document .target').toHaveText('old document text')
          expect('up-modal .target').toHaveText('new text from modal link')
        })

        describe('with [up-layer] modifier', function() {

          beforeEach(function() {
            up.motion.config.enabled = false
          })

          it('allows to name a layer for the update', async function() {
            $fixture('.document').affix('.target').text('old document text')
            up.layer.open({ fragment: "<div class='target'>old modal text</div>" })

            await wait()

            expect('.document .target').toHaveText('old document text')
            expect('up-modal .target').toHaveText('old modal text')

            const $linkInModal = $('up-modal-content').affix('a[href="/bar"][up-target=".target"][up-layer="parent"][up-peel="false"]')
            Trigger.clickSequence($linkInModal)

            await wait()

            jasmine.respondWith(`
              <div class="target">new text from modal link</div>
            `)

            await wait()

            expect('.document .target').toHaveText('new text from modal link')
            expect('up-modal .target').toHaveText('old modal text')
          })

          it('ignores [up-layer] if the server responds with an error', async function() {
            $fixture('.document').affix('.target').text('old document text')
            up.layer.open({ fragment: "<div class='target'>old modal text</div>" })

            await wait()

            expect('.document .target').toHaveText('old document text')
            expect('up-modal .target').toHaveText('old modal text')

            const $linkInModal = $('up-modal-content').affix('a[href="/bar"][up-target=".target"][up-fail-target=".target"][up-layer="parent"][up-peel="false"]')
            Trigger.clickSequence($linkInModal)

            await wait()

            jasmine.respondWith({
              responseText: `
                <div class="target">new failure text from modal link</div>
              `,
              status: 500
            })

            await wait()

            expect('.document .target').toHaveText('old document text')
            expect('up-modal .target').toHaveText('new failure text from modal link')
          })

          it('allows to name a layer for a non-200 response using an [up-fail-layer] modifier', async function() {
            $fixture('.document').affix('.target').text('old document text')
            up.layer.open({ fragment: "<div class='target'>old modal text</div>" })

            await wait()

            expect('.document .target').toHaveText('old document text')
            expect('up-modal .target').toHaveText('old modal text')

            const $linkInModal = $('up-modal-content').affix('a[href="/bar"][up-target=".target"][up-fail-target=".target"][up-fail-layer="parent"][up-fail-peel="false"]')
            Trigger.clickSequence($linkInModal)

            await wait()

            jasmine.respondWith({
              responseText: `
                <div class="target">new failure text from modal link</div>
              `,
              status: 500
            })

            await wait()

            expect('.document .target').toHaveText('new failure text from modal link')
            expect('up-modal .target').toHaveText('old modal text')
          })

          it('does not crash when targeting and revalidating cached content in the parent layer (bugfix)', async function() {
            up.motion.config.enabled = true
            up.layer.config.modal.closeAnimation = 'fade-out'

            fixture('main', { text: 'old main' })
            up.navigate('main', { url: '/page' })

            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            jasmine.respondWithSelector('main', { text: 'new main' })

            await wait()

            expect('main').toHaveText('new main')
            expect({ target: 'main', url: '/page' }).toBeCached()

            up.layer.open({ target: '#overlay', content: '<a id="overlay-link" up-layer="parent" href="/page">link label</a>' })

            expect(up.layer.isOverlay()).toBe(true)

            up.cache.expire()
            Trigger.clickSequence('#overlay-link')

            await wait()

            expect(up.layer.isOverlay()).toBe(false)

            expect(jasmine.Ajax.requests.count()).toBe(2)
            jasmine.respondWithSelector('main', { text: 'revalidated main' })

            await wait()

            expect('main').toHaveText('revalidated main')
          })

          describe('with [up-layer=new]', function() {

            it('opens the target in a new overlay', async function() {
              const link = fixture('a[href="/overlay"][up-layer=new][up-target="#content"]')
              Trigger.clickSequence(link)

              await wait()

              jasmine.respondWithSelector('#content', { text: ' overlay content' })

              await wait()

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current).toHaveText('overlay content')
            })

            it('focus the new overlay, but hides the focus ring when the link is activated with the mouse', async function() {
              up.specUtil.assertTabFocused()

              const link = fixture('a[href="/overlay"][up-layer=new][up-target="#content"]')
              Trigger.clickSequence(link)

              await wait()

              jasmine.respondWithSelector('#content', { text:' overlay content' })

              await wait()

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current.getFocusElement()).toHaveFocus()
              expect(up.layer.current.getFocusElement()).not.toHaveOutline()
            })

            it('shows the focus ring for the new overlay when the link is activated with the keyboard', async function() {
              up.specUtil.assertTabFocused()

              const link = fixture('a[href="/overlay"][up-layer=new][up-target="#content"]', { text: 'link' })

              await wait()

              Trigger.clickLinkWithKeyboard(link)

              await wait()

              jasmine.respondWithSelector('#content', { text:' overlay content' })

              await wait(0)

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current.getFocusElement()).toHaveFocus()
              expect(up.layer.current.getFocusElement()).toHaveOutline()
            })

            it('opens a failed response in a new overlay with [up-fail-layer="new"]', async function() {
              const link = fixture('a[href="/overlay"][up-target="#content"][up-fail-target="#content"][up-fail-layer="new"]')
              Trigger.clickSequence(link)

              await wait()

              jasmine.respondWithSelector('#content', { text: ' overlay content', status: 422 })

              await wait()

              expect(up.layer.current).toBeOverlay()
              expect(up.layer.current).toHaveText('overlay content')
            })
          })
        })
      })

      describe('with [up-focus] modifier', function() {

        beforeEach(function() {
          up.specUtil.assertTabFocused()
        })

        it('focuses the given selector', async function() {
          fixture('div#focus')
          fixture('#target', { text: 'old content' })
          const link = fixture('a[href="/path"][up-target="#target"][up-focus="#focus"]')
          Trigger.clickSequence(link)

          await wait()

          jasmine.respondWithSelector('#target', { text:' new content' })

          await wait()

          expect('#target').toHaveText('new content')
          expect('#focus').toHaveFocus()
        })

        describe('focus ring visibility', function() {

          it('hides the focus ring when the link is activated with the mouse', async function() {
            fixture('div#focus')
            fixture('#target', { text: 'old content' })
            const link = fixture('a[href="/path"][up-target="#target"][up-focus="#focus"]')
            Trigger.clickSequence(link)

            await wait()

            jasmine.respondWithSelector('#target', { text:' new content' })

            await wait()

            expect('#focus').toHaveFocus()
            expect('#focus').not.toHaveOutline()
          })

          it('shows the focus ring when the link is activated with the mouse but the link has [up-focus-visible=true]', async function() {
            fixture('div#focus')
            fixture('#target', { text: 'old content' })
            const link = fixture('a[href="/path"][up-target="#target"][up-focus="#focus"][up-focus-visible=true]')
            Trigger.clickSequence(link)

            await wait()

            jasmine.respondWithSelector('#target', { text:' new content' })

            await wait()

            expect('#focus').toHaveFocus()
            expect('#focus').toHaveOutline()
          })

          it('shows the focus ring when the link is activated with the keyboard', async function() {
            fixture('div#focus', { text: 'focus' })
            fixture('#target', { text: 'old content' })
            const link = fixture('a[href="/path"][up-target="#target"][up-focus="#focus"]')
            Trigger.clickLinkWithKeyboard(link)

            await wait()

            jasmine.respondWithSelector('#target', { text:' new content' })

            await wait(1000)

            expect('#focus').toHaveFocus()
            expect('#focus').toHaveOutline()
          })

          it('hides the focus ring when the link is activated with the keyboard but the link has [up-focus-visible=false]', async function() {
            fixture('div#focus', { text: 'focus' })
            fixture('#target', { text: 'old content' })
            const link = fixture('a[href="/path"][up-target="#target"][up-focus="#focus"][up-focus-visible=false]')
            Trigger.clickLinkWithKeyboard(link)

            await wait()

            jasmine.respondWithSelector('#target', { text:' new content' })

            await wait(1000)

            expect('#focus').toHaveFocus()
            expect('#focus').not.toHaveOutline()
          })

          it('shows the focus ring when the link is activated with the mouse and the focused element is an input', async function() {
            const form = fixture('form')
            e.affix(form, 'input#focus[name="email"]')
            fixture('#target', { text: 'old content' })
            const link = fixture('a[href="/path"][up-target="#target"][up-focus="#focus"]')
            Trigger.clickSequence(link)

            await wait()

            jasmine.respondWithSelector('#target', { text:' new content' })

            await wait()

            expect('#focus').toHaveFocus()
            expect('#focus').toHaveOutline()
          })

        })

      })

      describe('with [up-fail-target] modifier', function() {

        beforeEach(function() {
          $fixture('.success-target').text('old success text')
          $fixture('.failure-target').text('old failure text')
          this.$link = $fixture('a[href="/path"][up-target=".success-target"][up-fail-target=".failure-target"]')
        })

        it('uses the [up-fail-target] selector for a failed response', async function() {
          Trigger.clickSequence(this.$link)
          await wait()

          jasmine.respondWith(`
            <div class="failure-target">new failure text</div>
          `, { status: 500 })
          await wait()

          expect('.success-target').toHaveText('old success text')
          expect('.failure-target').toHaveText('new failure text')
        })

        // Since there isn't anyone who could handle the rejection inside
        // the event handler, our handler mutes the rejection.
        // Jasmine will fail if there are unhandled promise rejections

        it('uses the [up-target] selector for a successful response', async function() {
          Trigger.clickSequence(this.$link)
          await wait()

          jasmine.respondWith(`
            <div class="success-target">new success text</div>
          `, { status: 200 })
          await wait()

          expect('.success-target').toHaveText('new success text')
          expect('.failure-target').toHaveText('old failure text')
        })
      })

      describe('with [up-transition] modifier', function() {

        it('morphs between the old and new target element', async function() {
          fixture('.target.old')
          const link = fixture('a[href="/path"][up-target=".target"][up-transition="cross-fade"][up-duration="600"][up-easing="linear"]')
          Trigger.clickSequence(link)

          await wait()

          jasmine.respondWith('<div class="target new">new text</div>')
          await wait()

          this.oldGhost = document.querySelector('.target.old')
          this.newGhost = document.querySelector('.target.new')
          expect(this.oldGhost).toBeAttached()
          expect(this.newGhost).toBeAttached()
          expect(this.oldGhost).toHaveOwnOpacity(1, 0.15)
          expect(this.newGhost).toHaveOwnOpacity(0, 0.15)

          await wait(300)

          expect(this.oldGhost).toHaveOwnOpacity(0.5, 0.15)
          expect(this.newGhost).toHaveOwnOpacity(0.5, 0.15)
        })

        it('does not crash when updating a main element (fix for issue #187)', async function() {
          fixture('main.target.old')
          const link = fixture('a[href="/path"][up-target="main"][up-transition="cross-fade"][up-duration="600"]')
          Trigger.clickSequence(link)

          await wait()

          jasmine.respondWith('<main class="target new">new text</main>')
          await wait(300)

          const oldGhost = document.querySelector('main.target.old')
          const newGhost = document.querySelector('main.target.new')
          expect(oldGhost).toBeAttached()
          expect(newGhost).toBeAttached()
          expect(oldGhost).toHaveOwnOpacity(0.5, 0.45)
          expect(newGhost).toHaveOwnOpacity(0.5, 0.45)

          await wait(600)

          expect(document).toHaveSelector('main.target.new')
          expect(document).not.toHaveSelector('main.target.old')
        })

        it('does not crash when updating an element that is being transitioned', async function() {
          $fixture('.target.old', { text: 'text 1' })
          const $link = $fixture('a[href="/path"][up-target=".target"][up-transition="cross-fade"][up-duration="600"][up-easing="linear"]')
          Trigger.clickSequence($link)

          await wait()

          jasmine.respondWith('<div class="target">text 2</div>')
          await wait()

          expect('.target.old').toBeAttached()
          expect('.target.old').toHaveOwnOpacity(1, 0.15)
          expect('.target.old').toHaveText('text 1')

          expect('.target:not(.old)').toBeAttached()
          expect('.target:not(.old)').toHaveOwnOpacity(0, 0.15)
          expect('.target:not(.old)').toHaveText('text 2')

          up.render('.target', { content: 'text 3' })
          await wait(300)

          expect('.target.old').toHaveOwnOpacity(0.5, 0.15)
          expect('.target.old').toHaveText('text 1')

          expect('.target:not(.old)').toHaveOwnOpacity(0.5, 0.15)
          expect('.target:not(.old)').toHaveText('text 3')
        })

        // https://github.com/unpoly/unpoly/issues/439
        it('does not leave a `transform` CSS property once the transition finishes, as to not affect the positioning of child elements', async function() {
          const element = fixture('.target.old', { text: 'v1' })
          const link = fixture('a[href="/path"][up-target=".target"][up-transition="move-left"][up-duration="10"]')

          Trigger.clickSequence(link)

          await wait()

          jasmine.respondWithSelector('.target.new', { text: 'v2' })

          await wait(80)

          const newElement = document.querySelector('.target')
          expect(newElement).toHaveText('v2')
          expect(newElement.style.transform).toBeBlank()
        })
      })


      describe('wih a CSS selector in the [up-fallback] attribute', function() {

        it('uses the fallback selector if the [up-target] CSS does not exist on the page', async function() {
          $fixture('.fallback').text('old fallback')
          const $link = $fixture('a[href="/path"][up-target=".target"][up-fallback=".fallback"]')
          Trigger.clickSequence($link)

          await wait()

          jasmine.respondWith(`
            <div class="target">new target</div>
            <div class="fallback">new fallback</div>
          `)

          await wait()

          expect('.fallback').toHaveText('new fallback')
        })

        it('ignores the fallback selector if the [up-target] CSS exists on the page', async function() {
          $fixture('.target').text('old target')
          $fixture('.fallback').text('old fallback')
          const $link = $fixture('a[href="/path"][up-target=".target"][up-fallback=".fallback"]')
          Trigger.clickSequence($link)

          await wait()

          jasmine.respondWith(`
            <div class="target">new target</div>
            <div class="fallback">new fallback</div>
          `)

          await wait()

          expect('.target').toHaveText('new target')
          expect('.fallback').toHaveText('old fallback')
        })
      })

      describe('with [up-content] modifier', function() {

        it('updates a fragment with the given inner HTML string', async function() {
          const target = fixture('.target', { text: 'old content' })
          const link = helloFixture('a[up-target=".target"][up-content="new content"]')

          Trigger.clickSequence(link)
          await wait()

          expect('.target').toHaveText('new content')
        })

        it('gives the link a pointer cursor', function() {
          const target = fixture('.target', { text: 'old content' })
          const link = helloFixture('a[up-target=".target"][up-content="new content"]')

          expect(link).toHaveCursorStyle('pointer')
        })

        it('enables keyboard interaction for the link', async function() {
          const target = fixture('.target', { text: 'old content' })
          const link = helloFixture('a[up-target=".target"][up-content="new content"]')

          expect(link).toBeKeyboardFocusable()

          Trigger.clickLinkWithKeyboard(link)
          await wait()

          expect('.target').toHaveText('new content')
        })

        it('updates a fragment with the given inner HTML string when the element also has an [href="#"] attribute (bugfix)', async function() {
          const target = fixture('.target', { text: 'old content' })
          const link = fixture('a[href="#"][up-target=".target"][up-content="new content"]')

          Trigger.clickSequence(link)
          await wait()

          expect('.target').toHaveText('new content')
        })

        it("removes the target's inner HTML with [up-content='']", async function() {
          const target = fixture('.target', { text: 'old content' })
          const link = fixture('a[up-target=".target"][up-content=""]')

          Trigger.clickSequence(link)
          await wait()

          expect(document.querySelector('.target').innerHTML).toBe('')
        })
      })

      it('does not add a history entry when replacing a main target but the up-history attribute is set to "false"', async function() {
        up.history.config.enabled = true
        up.layer.config.any.mainTargets = ['.target']

        const oldPathname = location.pathname
        $fixture('.target')
        const $link = $fixture('a[href="/path"][up-target=".target"][up-history="false"]')
        Trigger.clickSequence($link)

        await wait()

        jasmine.respondWith({
          responseText: '<div class="target">new text</div>',
          responseHeaders: { 'X-Up-Location': '/other/path' }
        })

        await wait()

        expect('.target').toHaveText('new text')
        expect(location.pathname).toEqual(oldPathname)
      })
    })

  })

})
