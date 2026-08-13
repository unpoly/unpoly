const u = up.util
const e = up.element
const $ = jQuery

describe('up.status', function() {

  function replaceURL(url) {
    // Don't use up.history.replace() since that fires up:location:changed
    // which up.status listens to.
    history.replaceState({}, 'title', url)
  }

  beforeEach(function() {
    up.history.config.enabled = true
    up.motion.config.enabled = false
  })

  describe('JavaScript functions', () => {
    describe('up.hello() updating .up-current', function() {

      it('sets .up-current classes on nav links that refer to the current URL', function() {
        replaceURL('/bar')

        const [container, link1, link2, link3] = htmlFixtureList(`
          <nav>
            <a href='/foo'></a>
            <a href='/bar'></a>
            <a href='/baz'></a>
          </nav>
        `)

        expect(link1).not.toHaveClass('up-current')
        expect(link2).not.toHaveClass('up-current')
        expect(link3).not.toHaveClass('up-current')

        up.hello(container)

        expect(link1).not.toHaveClass('up-current')
        expect(link2).toHaveClass('up-current')
        expect(link3).not.toHaveClass('up-current')
      })

      it('sets .up-current classes when links have changed within an unchanged navigational container', function() {
        replaceURL('/bar')

        const [container, link] = htmlFixtureList(`
          <nav>
            <a href='/bar'></a>
          </nav>
        `)

        expect(link).not.toHaveClass('up-current')

        up.hello(link)

        expect(link).toHaveClass('up-current')
      })

      it("removes .up-current classes on nav links that don't refer to the current URL", function() {
        replaceURL('/bar')

        const [container, link] = htmlFixtureList(`
          <nav>
            <a href='/qux' class='up-current'></a>
          </nav>
        `)

        expect(link).toHaveClass('up-current')

        up.hello(container)

        expect(link).not.toHaveClass('up-current')
      })

      it("removes .up-current classes on unsafe nav links, even if they refer to the current URL", function() {
        replaceURL('/bar')

        const [container, link] = htmlFixtureList(`
          <nav>
            <a href='/bar' up-method="post" class='up-current'></a>
          </nav>\
        `)

        expect(link).toHaveClass('up-current')

        up.hello(container)

        expect(link).not.toHaveClass('up-current')
      })

      it('removes .up-current classes from all nav links in overlays without history', async function() {
        const overlay = await up.layer.open({ history: false, content: `
          <nav>
            <a id="overlay-link" href='/bar'></a>
          </nav>
        ` })

        const link = overlay.element.querySelector('#overlay-link')

        // Manually add the class as up.layer.open() would remove it from the given { content }.
        link.classList.add('up-current')
        expect(link).toHaveClass('up-current')

        up.hello(overlay.element)

        expect(link).not.toHaveClass('up-current')
      })
    })


    require('./status_render_spec')

    describe('up.preview()', function() {

      it('registers a named preview that can be referred to in a render pass', async function() {
        let undoFn = jasmine.createSpy('undo function')
        let previewFn = jasmine.createSpy('preview function').and.returnValue(undoFn)
        up.preview('my:preview', previewFn)
        fixture('#target', { text: 'old text' })
        await wait()

        expect(previewFn).not.toHaveBeenCalled()
        expect(undoFn).not.toHaveBeenCalled()

        up.render({ target: '#target', preview: 'my:preview', url: '/url' })

        await wait()

        expect(previewFn).toHaveBeenCalled()
        expect(undoFn).not.toHaveBeenCalled()

        jasmine.respondWithSelector('#target', { text: 'new text' })
        await wait()

        expect(undoFn).toHaveBeenCalled()

        expect('#target').toHaveText('new text')
      })

    })

  })

  describe('unobtrusive behavior', function() {

    require('./status_nav_spec')

    describe('.up-loading', function() {

      it('gives the loading element an .up-loading class', async function() {
        fixture('.target')

        up.render('.target', { url: '/path', feedback: true })

        await wait()

        expect('.target').toHaveClass('up-loading')
      })

      it('does not assign the .up-loading class when preloading', async function() {
        fixture('.target')

        let link = fixture('a[href="/path"][up-follow][up-feedback="true"]', { text: 'label' })
        up.link.preload(link)
        await wait()

        expect(up.network.isBusy()).toBe(true)
        expect('.target').not.toHaveClass('up-loading')
      })

      it('does not assign the .up-loading class with { feedback: false }', async function() {
        fixture('.target')

        up.render('.target', { url: '/path', feedback: false })

        await wait()

        expect('.target').not.toHaveClass('up-loading')
      })

      it('removes the .up-loading class when the fragment was updated', async function() {
        fixture('.target')

        up.render('.target', { url: '/path', feedback: true })

        await wait()

        expect('.target').toHaveClass('up-loading')

        jasmine.respondWithSelector('.target', { text: 'new text' })

        await wait()

        expect('.target').toHaveText('new text')
        expect('.target').not.toHaveClass('up-loading')
      })

      it('removes the .up-loading class when another fragment was updated due to a failed response', async function() {
        fixture('.target')
        fixture('.fail-target')

        const renderJob = up.render('.target', { url: '/path', failTarget: '.fail-target', feedback: true })

        await wait()

        expect('.target').toHaveClass('up-loading')
        jasmine.respondWithSelector('.fail-target', { text: 'new text', status: 422 })

        await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

        expect('.fail-target').toHaveText('new text')
        expect('.target').not.toHaveClass('up-loading')
        expect('.fail-target').not.toHaveClass('up-loading')
      })

      it('assigns .load-loading on the correct element if a guard event listeners changes target', async function() {
        fixture('#foo', { text: 'old foo' })
        fixture('#bar', { text: 'old bar' })

        const link = fixture('a[href="/path"][up-target="#foo"]')

        const listener = jasmine.createSpy('follow listener').and.callFake((event) => event.renderOptions.target = '#bar')

        link.addEventListener('up:link:follow', listener)

        up.follow(link)

        await wait()

        expect(listener).toHaveBeenCalled()
        expect(jasmine.Ajax.requests.count()).toEqual(1)

        expect('#foo').not.toHaveClass('up-loading')
        expect('#bar').toHaveClass('up-loading')
      })

      it('allows to set additional loading classes via up.status.config.loadingClasses', async function() {
        up.status.config.loadingClasses.push('custom-loading')
        fixture('.target')

        up.render('.target', { url: '/path', feedback: true })

        await wait()

        expect('.target').toHaveClass('up-loading')
        expect('.target').toHaveClass('custom-loading')
      })

    })

    describe('.up-revalidating', function() {

      it('gives a stale element an .up-revalidating class while it is revalidating with the server', async function() {
        await jasmine.populateCache('/foo', '<div id="target">expired target</div>')
        up.cache.expire()

        fixture('#target', { content: 'old target' })

        up.render('#target', { url: '/foo', feedback: true, cache: true, revalidate: true })
        await wait()

        expect('#target').toHaveVisibleText('expired target')
        expect(up.network.isBusy()).toBe(true)
        expect('#target').not.toHaveClass('up-loading')
        expect('#target').toHaveClass('up-revalidating')

        jasmine.respondWithSelector('#target', { text: 'revalidated target' })
        await wait()

        expect('#target').toHaveVisibleText('revalidated target')
        expect(up.network.isBusy()).toBe(false)
        expect('#target').not.toHaveClass('up-loading')
        expect('#target').not.toHaveClass('up-revalidating')
      })

      it('does not assign the .up-revalidating class with { feedback: false }', async function() {
        await jasmine.populateCache('/foo', '<div id="target">expired target</div>')
        up.cache.expire()

        fixture('#target', { content: 'old target' })

        up.render('#target', { url: '/foo', feedback: false, cache: true, revalidate: true })
        await wait()

        expect('#target').toHaveVisibleText('expired target')
        expect(up.network.isBusy()).toBe(true)
        expect('#target').not.toHaveClass('up-revalidating')

        jasmine.respondWithSelector('#target', { text: 'revalidated target' })
        await wait()

        expect('#target').toHaveVisibleText('revalidated target')
        expect(up.network.isBusy()).toBe(false)
        expect('#target').not.toHaveClass('up-revalidating')
      })

      it('removes the .up-revalidating class when the server has no newer content', async function() {
        await jasmine.populateCache('/foo', '<div id="target">expired target</div>')
        up.cache.expire()

        fixture('#target', { content: 'old target' })

        up.render('#target', { url: '/foo', feedback: false, cache: true, revalidate: true })
        await wait()

        expect('#target').toHaveVisibleText('expired target')
        expect(up.network.isBusy()).toBe(true)
        expect('#target').not.toHaveClass('up-revalidating')

        jasmine.respondWith({ status: 204 })
        await wait()

        expect('#target').toHaveVisibleText('expired target')
        expect(up.network.isBusy()).toBe(false)
        expect('#target').not.toHaveClass('up-revalidating')
      })

    })

    describe('.up-active', function() {

      describe('for a link', function() {

        it('marks clicked links as .up-active until the request finishes', async function() {
          const link = fixture('a[href="/foo"][up-target=".main"]')
          fixture('.main')

          Trigger.clickSequence(link)
          await wait()

          expect(link).toHaveClass('up-active')

          jasmine.respondWithSelector('.main')
          await wait()

          expect(link).not.toHaveClass('up-active')
        })

        it('does not mark a link as .up-active while it is preloading', async function() {
          const link = fixture('a[href="/foo"][up-target=".main"]')
          fixture('.main')

          up.link.preload(link)
          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(link).not.toHaveClass('up-active')
        })

        it('does not mark a link as .up-active while revalidating', async function() {
          await jasmine.populateCache('/foo', '<div id="target">cached target</div>')
          up.cache.expire()

          const target = fixture('#target')
          const link = fixture('a[href="/foo"][up-target="#target"]')

          Trigger.clickSequence(link)
          await wait()

          expect('#target').toHaveText('cached target')
          expect(up.network.isBusy()).toBe(true)
          expect(link).not.toHaveClass('up-active')
        })

        it('does not mark a link as .up-active with [up-feedback=false] attribute', async function() {
          const $link = $fixture('a[href="/foo"][up-target=".main"][up-feedback=false]')
          fixture('.main')

          Trigger.clickSequence($link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect($link).not.toHaveClass('up-active')
        })

        it('marks links with [up-instant] on mousedown as .up-active until the request finishes', async function() {
          const $link = $fixture('a[href="/foo"][up-instant][up-target=".main"]')
          fixture('.main')
          Trigger.mousedown($link)

          await wait()

          expect($link).toHaveClass('up-active')

          await wait()

          jasmine.respondWith('<div class="main">new-text</div>')

          await wait()

          expect($link).not.toHaveClass('up-active')
        })

        it('allows to set additional active classes via up.status.config.activeClasses', async function() {
          up.status.config.activeClasses.push('working')
          const link = fixture('a[href="/foo"][up-target=".main"]')
          fixture('.main')

          Trigger.clickSequence(link)

          await wait()

          expect(link).toHaveClass('up-active')
          expect(link).toHaveClass('working')

          jasmine.respondWithSelector('.main')

          await wait()

          expect(link).not.toHaveClass('up-active')
          expect(link).not.toHaveClass('working')
        })

        it('removes .up-active when a link with [up-confirm] was not confirmed', async function() {
          const $link = $fixture('a[href="/foo"][up-target=".main"][up-confirm="Really follow?"]')
          spyOn(up.browser, 'assertConfirmed').and.throwError(new up.Aborted('User aborted'))

          Trigger.clickSequence($link)

          await wait()

          expect($link).not.toHaveClass('up-active')
        })

        it('marks clicked modal openers as .up-active while the modal is loading', async function() {
          const $link = $fixture('a[href="/foo"][up-target=".main"]')
          fixture('.main')
          Trigger.clickSequence($link)

          await wait()

          expect($link).toHaveClass('up-active')

          await wait()

          jasmine.respondWith('<div class="main">new-text</div>')

          await wait()

          expect($link).not.toHaveClass('up-active')
        })

        it('removes .up-active from a clicked modal opener if the target is already preloaded (bugfix)', async function() {
          const $link = $fixture('a[href="/foo"][up-target=".main"][up-layer="new modal"]')
          up.hello($link)
          up.link.preload($link)

          await wait()

          jasmine.respondWith('<div class="main">new-text</div>')

          await wait()

          Trigger.clickSequence($link)

          await wait()

          expect('up-modal .main').toHaveText('new-text')
          expect($link).not.toHaveClass('up-active')
        })

        it('removes .up-active from a clicked link if the target is already preloaded (bugfix)', async function() {
          const $link = $fixture('a[href="/foo"][up-target=".main"]')
          fixture('.main')
          up.link.preload($link)

          await wait()

          jasmine.respondWith('<div class="main">new-text</div>')

          await wait()

          Trigger.clickSequence($link)

          await wait()

          expect('.main').toHaveText('new-text')
          expect($link).not.toHaveClass('up-active')
        })

        it('removes .up-active when the server responds with an error code', async function() {
          const link = fixture('a[href="/foo"][up-target="#main"][up-fail-target="#main"]')
          fixture('#main')
          Trigger.clickSequence(link)

          await wait()

          expect(link).toHaveClass('up-active')

          jasmine.respondWith({
            responseText: '<div id="main">failed</div>',
            status: 422
          })

          await wait()

          expect(link).not.toHaveClass('up-active')
        })

        it('removes .up-active when the request fails due to a fatal network issue', async function() {
          const link = fixture('a[href="/foo"][up-target="#main"]')
          fixture('#main')
          Trigger.clickSequence(link)

          await wait()

          expect(link).toHaveClass('up-active')

          await jasmine.expectGlobalError('up.Offline', async function() {
            jasmine.lastRequest().responseError()
            await wait(30)
          }) // waiting for a single task does not work for some reason

          expect(link).not.toHaveClass('up-active')
        })

      })

      describe('for a form', function() {

        it('marks the form as .up-active while it is submitting', async function() {
          fixture('#target', { text: 'old target' })

          const form = htmlFixture(`
            <form method="post" action="/action" up-submit up-target="#target">
              <input type="text" name="email">
              <button type="submit">Submit</button>
            </form>
          `)

          up.submit(form)
          await wait()

          expect(form).toHaveClass('up-active')

          jasmine.respondWithSelector('#target', { text: 'new target' })
          await wait()

          expect(form).not.toHaveClass('up-active')
          expect('#target').toHaveText('new target')
        })

        it('also marks the clicked submit button as .up-active', async function() {
          fixture('#target', { text: 'old target' })

          const [form, input, submitButton] = htmlFixtureList(`
            <form method="post" action="/action" up-submit up-target="#target">
              <input type="text" name="email">
              <button type="submit">Submit</button>
            </form>
          `)

          Trigger.clickSequence(submitButton)
          await wait()

          expect(form).toHaveClass('up-active')
          expect(input).not.toHaveClass('up-active')
          expect(submitButton).toHaveClass('up-active')

          jasmine.respondWithSelector('#target', { text: 'new target' })
          await wait()

          expect(form).not.toHaveClass('up-active')
          expect(submitButton).not.toHaveClass('up-active')
          expect('#target').toHaveText('new target')
        })

        it('also marks the focused input and the default submit button as .up-active when submitting the form with the Enter key', async function() {
          fixture('#target', { text: 'old target' })

          let activeElements = () => [...document.querySelectorAll('.up-active')]

          const [form, input1, input2, submitButton1, submitButton2] = htmlFixtureList(`
            <form method="post" action="/action" up-submit up-target="#target">
              <input type="text" name="foo">
              <input type="text" name="bar">
              <button type="submit">Submit1</button>
              <button type="submit">Submit2</button>
            </form>
          `)

          Trigger.submitFormWithEnter(input2)
          await wait()

          expect(activeElements()).toEqual([form, input2, submitButton1])

          jasmine.respondWithSelector('#target', { text: 'new target' })
          await wait()

          expect(activeElements()).toEqual([])
        })

      })

    })
  })
})
