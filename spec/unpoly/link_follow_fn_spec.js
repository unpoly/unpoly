const e = up.element

extendDescribe('up.link', function() {

  extendDescribe('JavaScript functions', function() {

    describe('up.follow()', function() {

      it('loads the given link via AJAX and replaces the response in the given target', async function() {
        fixture('.before', { text: 'old-before' })
        fixture('.middle', { text: 'old-middle' })
        fixture('.after', { text: 'old-after' })
        const link = fixture('a[href="/path"][up-target=".middle"]')

        up.follow(link)
        await wait()

        jasmine.respondWith(`
          <div class="before">new-before</div>
          <div class="middle">new-middle</div>
          <div class="after">new-after</div>
        `)
        await wait()

        expect('.before').toHaveText('old-before')
        expect('.middle').toHaveText('new-middle')
        expect('.after').toHaveText('old-after')
      })

      it('uses the method from a data-method attribute', async function() {
        const link = fixture('a[href="/path"][data-method="PUT"]')
        up.follow(link)
        await wait()

        const request = jasmine.lastRequest()
        expect(request).toHaveRequestMethod('PUT')
      })

      it('allows to refer to the link itself as ":origin" in the CSS selector', async function() {
        const container = fixture('div')
        const link1 = e.createFromHTML('<a id="first" href="/path" up-target=":origin">first-link</a>')
        container.append(link1)

        const link2 = e.createFromHTML('<a id="second" href="/path" up-target=":origin">second-link</a>')
        container.append(link2)
        up.follow(link2)
        await wait()

        jasmine.respondWith('<div id="second">second-div</div>')
        await wait()

        expect(container).toHaveText('first-linksecond-div')
      })

      it('returns a promise with an up.RenderResult that contains information about the updated fragments and layer', async function() {
        fixture('.one', { text: 'old one' })
        fixture('.two', { text: 'old two' })
        fixture('.three', { text: 'old three' })

        const link = fixture('a[up-target=".one, .three"][href="/path"]')

        const promise = up.follow(link)
        await wait()

        jasmine.respondWith(`
          <div class="one">new one</div>
          <div class="two">new two</div>
          <div class="three">new three</div>
        `)
        await wait()

        let result = await promiseState(promise)
        expect(result.state).toBe('fulfilled')
        expect(result.value.fragments).toEqual([document.querySelector('.one'), document.querySelector('.three')])
        expect(result.value.layer).toBe(up.layer.root)
      })

      it('still renders if the link was removed while the request was in flight (e.g. when the user clicked a link in a custom overlay that closes on mouseout)', async function() {
        fixture('.target', { text: 'old text' })

        const link = fixture('a[up-target=".target"][href="/foo"]')

        const promise = up.follow(link)
        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        link.remove()
        await wait()

        jasmine.respondWithSelector('.target', { text: 'new text' })
        await wait()

        expect('.target').toHaveText('new text')
        let result = await promiseState(promise)
        expect(result.state).toBe('fulfilled')
      })

      describe('up:link:follow events', function() {

        it('emits a preventable up:link:follow event', async function() {
          const link = fixture('a[href="/destination"][up-target=".response"]')

          const listener = jasmine.createSpy('follow listener').and.callFake((event) => event.preventDefault())

          link.addEventListener('up:link:follow', listener)

          const followPromise = up.follow(link)

          await expectAsync(followPromise).toBeRejectedWith(jasmine.any(up.Aborted))

          expect(listener).toHaveBeenCalled()
          const event = listener.calls.mostRecent().args[0]
          expect(event.target).toEqual(link)

          // No request should be made because we prevented the event
          expect(jasmine.Ajax.requests.count()).toEqual(0)
        })

        it('allows listeners to inspect event.renderOptions', async function() {
          const link = fixture('a[href="/destination"][up-target=".response"][up-scroll=".scroll"][up-focus=".focus"]')
          const listener = jasmine.createSpy('follow listener')
          link.addEventListener('up:link:follow', listener)

          up.follow(link)
          await wait()

          expect(listener).toHaveBeenCalledWith(
            jasmine.objectContaining({
              renderOptions: jasmine.objectContaining({
                target: '.response',
                scroll: '.scroll',
                focus: '.focus',
              })
            })
          )
        })

        it('allows listeners to mutate event.renderOptions', async function() {
          fixture('#foo', { text: 'old foo' })
          fixture('#bar', { text: 'old bar' })

          const link = fixture('a[href="/path"][up-target="#foo"]')

          const listener = jasmine.createSpy('follow listener').and.callFake(function(event) {
            expect(event.renderOptions.target).toBe('#foo')
            event.renderOptions.target = '#bar'
          })

          link.addEventListener('up:link:follow', listener)

          up.follow(link)
          await wait()

          expect(listener).toHaveBeenCalled()
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#bar')

          jasmine.respondWithSelector('#bar', { text: 'new bar' })
          await wait()

          expect('#foo').toHaveText('old foo')
          expect('#bar').toHaveText('new bar')
        })

        it('allows listeners to update another layer by mutating event.renderOptions.layer', async function() {
          makeLayers([
            { target: '.target', content: 'old text' },
            { target: '.target', content: 'old text' },
          ])

          const link = fixture('a[href="/path"][up-target=".target"]')

          const listener = jasmine.createSpy('follow listener').and.callFake((event) => event.renderOptions.layer = 1)

          link.addEventListener('up:link:follow', listener)

          up.follow(link, { peel: false })
          await wait()

          jasmine.respondWithSelector('.target', { text: 'new text' })
          await wait()

          expect(up.fragment.get('.target', { layer: 0 })).toHaveText('old text')
          expect(up.fragment.get('.target', { layer: 1 })).toHaveText('new text')
        })

        it('allows listeners to open a new layer, using the shorthand { layer: "new" } with an implicit mode', async function() {
          fixture('#foo', { text: 'old foo in root' })
          const link = fixture('a[href="/path"][up-target="#foo"]')

          const listener = jasmine.createSpy('follow listener').and.callFake((event) => event.renderOptions.layer = 'new')

          link.addEventListener('up:link:follow', listener)

          up.follow(link)
          await wait()

          expect(listener).toHaveBeenCalled()
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().requestHeaders['X-Up-Mode']).toBe('modal')

          jasmine.respondWithSelector('#foo', { text: 'new foo in overlay' })
          await wait()

          expect(up.layer.count).toBe(2)
          expect(up.fragment.get('#foo', { layer: 0 })).toHaveText('old foo in root')
          expect(up.fragment.get('#foo', { layer: 1 })).toHaveText('new foo in overlay')
        })

        it('allows listeners to open a new layer for a failed response', async function() {
          fixture('#foo', { text: 'old foo in root' })
          const link = fixture('a[href="/path"][up-target="#foo"][up-fail-target="#foo"]')

          const listener = jasmine.createSpy('follow listener').and.callFake((event) => event.renderOptions.failLayer = 'new')

          link.addEventListener('up:link:follow', listener)

          up.follow(link)
          await wait()

          expect(listener).toHaveBeenCalled()
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(jasmine.lastRequest().requestHeaders['X-Up-Mode']).toBe('root')
          expect(jasmine.lastRequest().requestHeaders['X-Up-Fail-Mode']).toBe('modal')

          jasmine.respondWithSelector('#foo', { text: 'new foo in overlay', status: 422 })
          await wait()

          expect(up.layer.count).toBe(2)
          expect(up.fragment.get('#foo', { layer: 0 })).toHaveText('old foo in root')
          expect(up.fragment.get('#foo', { layer: 1 })).toHaveText('new foo in overlay')
        })
      })

      describe('history', function() {

        it('adds history entries and allows the user to use the back and forward buttons', async function() {
          up.history.config.enabled = true

          const waitForBrowser = 300

          // By default, up.history will replace the <body> tag when
          // the user presses the back-button. We reconfigure this
          // so we don't lose the Jasmine runner interface.
          up.history.config.restoreTargets = ['.container']

          const respondWith = (html, title) => {
            jasmine.respondWith({
              status: 200,
              contentType: 'text/html',
              responseText: `
                <div class='container'>
                  <div class='target'>${html}</div>
                </div>
              `,
              responseHeaders: { 'X-Up-Title': JSON.stringify(title) }
            })
          }

          up.fragment.config.navigateOptions.history = true

          const $link1 = $fixture('a[href="/one"][up-target=".target"]')
          const $link2 = $fixture('a[href="/two"][up-target=".target"]')
          const $link3 = $fixture('a[href="/three"][up-target=".target"]')
          const $container = $fixture('.container')
          const $target = $fixture('.target').appendTo($container).text('original text')

          up.follow($link1.get(0))
          await wait()

          respondWith('text from one', 'title from one')
          await wait()

          expect('.target').toHaveText('text from one')
          expect(location.pathname).toEqual('/one')
          expect(document.title).toEqual('title from one')

          up.follow($link2.get(0))
          await wait()

          respondWith('text from two', 'title from two')
          await wait()

          expect('.target').toHaveText('text from two')
          expect(location.pathname).toEqual('/two')
          expect(document.title).toEqual('title from two')

          up.follow($link3.get(0))
          await wait()

          respondWith('text from three', 'title from three')
          await wait()

          expect('.target').toHaveText('text from three')
          expect(location.pathname).toEqual('/three')
          expect(document.title).toEqual('title from three')

          history.back()
          await wait(waitForBrowser)

          expect('.target').toHaveText('text from two')
          expect(location.pathname).toEqual('/two')
          expect(document.title).toEqual('title from two')

          history.back()
          await wait(waitForBrowser)

          expect('.target').toHaveText('text from one')
          expect(location.pathname).toEqual('/one')
          expect(document.title).toEqual('title from one')

          history.forward()
          await wait(waitForBrowser)

          expect('.target').toHaveText('text from two')
          expect(location.pathname).toEqual('/two')
          expect(document.title).toEqual('title from two')
        })

        it('renders history when the user clicks on a link, goes back and then clicks on the same link (bugfix)', async function() {
          up.history.config.enabled = true
          up.history.config.restoreTargets = ['.target']
          const waitForBrowser = 300

          const linkHTML = `
            <a href="/next" up-target=".target" up-history="false">label</a>
          `
          const target = fixture('.target', { text: 'old text' })
          const link = fixture('a[href="/next"][up-target=".target"][up-history=true]')
          up.history.replace('/original')
          await wait()

          expect(up.history.location).toMatchURL('/original')
          expect('.target').toHaveText('old text')

          Trigger.clickSequence(link)
          await wait()

          jasmine.respondWithSelector('.target', { text: 'new text' })
          await wait()

          expect(up.history.location).toMatchURL('/next')
          expect('.target').toHaveText('new text')

          history.back()
          await wait(waitForBrowser)

          jasmine.respondWithSelector('.target', { text: 'old text' })
          await wait()

          expect(up.history.location).toMatchURL('/original')
          expect('.target').toHaveText('old text')

          Trigger.clickSequence(link)
          await wait()

          // Response was already cached
          expect(up.history.location).toMatchURL('/next')
          expect('.target').toHaveText('new text')
        })

        it('does not add additional history entries when linking to the current URL', async function() {
          up.history.config.enabled = true

          // By default, up.history will replace the <body> tag when
          // the user presses the back-button. We reconfigure this
          // so we don't lose the Jasmine runner interface.
          up.history.config.restoreTargets = ['.container']

          up.fragment.config.navigateOptions.history = true

          up.network.config.cacheEvictAge = 0

          const waitForBrowser = 150

          const respondWith = (text) => {
            jasmine.respondWith(`
              <div class="container">
                <div class='target'>${text}</div>
              </div>
            `)
          }

          const $link1 = $fixture('a[href="/one"][up-target=".target"]')
          const $link2 = $fixture('a[href="/two"][up-target=".target"]')
          const $container = $fixture('.container')
          const $target = $fixture('.target').appendTo($container).text('original text')

          up.follow($link1.get(0))
          await wait()

          respondWith('text from one')
          await wait()

          expect('.target').toHaveText('text from one')
          expect(location.pathname).toEqual('/one')

          up.follow($link2.get(0))
          await wait()

          respondWith('text from two')
          await wait()

          expect('.target').toHaveText('text from two')
          expect(location.pathname).toEqual('/two')

          up.follow($link2.get(0))
          await wait()

          respondWith('text from two')
          await wait()

          expect('.target').toHaveText('text from two')
          expect(location.pathname).toEqual('/two')

          history.back()
          await wait(waitForBrowser)

          respondWith('restored text from one')
          await wait()

          expect('.target').toHaveText('restored text from one')
          expect(location.pathname).toEqual('/one')

          history.forward()
          await wait(waitForBrowser)

          respondWith('restored text from two')
          await wait()

          expect('.target').toHaveText('restored text from two')
          expect(location.pathname).toEqual('/two')
        })

        it('does add additional history entries when the user clicks a link, changes the URL with history.replaceState(), then clicks the same link again (bugfix)', async function() {
          up.history.config.enabled = true
          up.fragment.config.navigateOptions.history = true

          fixture('.target', { text: 'old text' })
          const link = fixture('a[href="/link-path"][up-target=".target"]')

          up.follow(link)
          await wait()

          jasmine.respondWithSelector('.target', { text: 'new text' })
          await wait()

          expect('.target').toHaveText('new text')
          expect(location.pathname).toEqual('/link-path')

          history.replaceState({}, '', '/user-path')
          expect(location.pathname).toEqual('/user-path')

          up.follow(link)
          await wait()

          expect(location.pathname).toEqual('/link-path')
        })
      })

      describe('scrolling', function() {

        describe('with { scroll: "target" }', function() {
          it('reveals the target fragment', async function() {
            const $link = $fixture('a[href="/action"][up-target=".target"]')
            const $target = $fixture('.target')

            const revealStub = up.reveal.mock().and.returnValue(Promise.resolve())

            up.follow($link.get(0), { scroll: 'target' })
            await wait()

            jasmine.respondWith('<div class="target">new text</div>')
            await wait()

            expect(revealStub).toHaveBeenCalled()
            expect(revealStub.calls.mostRecent().args[0]).toMatchSelector('.target')
          })
        })

        describe('with { failScroll: "target" }', function() {
          it('reveals the { failTarget } if the server responds with an error', async function() {
            const link = fixture('a[href="/action"][up-target=".target"][up-fail-target=".fail-target"]')
            const target = fixture('.target')
            const failTarget = fixture('.fail-target')

            const revealStub = up.reveal.mock().and.returnValue(Promise.resolve())
            const renderJob = up.follow(link, { failScroll: "target" })
            await wait()

            jasmine.respondWith({
              status: 500,
              responseText: `
                <div class="fail-target">
                  Errors here
                </div>
              `
            })
            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(revealStub).toHaveBeenCalled()
            expect(revealStub.calls.mostRecent().args[0]).toMatchSelector('.fail-target')
          })
        })

        describe('with { scroll: string } option', function() {

          it('allows to reveal a different selector', async function() {
            const link = fixture('a[href="/action"][up-target=".target"]')
            const target = fixture('.target')
            const other = fixture('.other')

            const revealStub = up.reveal.mock().and.returnValue(Promise.resolve())

            up.follow(link, { scroll: '.other' })
            await wait()

            jasmine.respondWith(`
              <div class="target">
                new text
              </div>
              <div class="other">
                new other
              </div>
            `)
            await wait()

            expect(revealStub).toHaveBeenCalled()
            expect(revealStub.calls.mostRecent().args[0]).toMatchSelector('.other')
          })

          it('ignores the { scroll } option for a failed response', async function() {
            const link = fixture('a[href="/action"][up-target=".target"][up-fail-target=".fail-target"]')
            const target = fixture('.target')
            const failTarget = fixture('.fail-target')
            const other = fixture('.other')

            const revealStub = up.reveal.mock().and.returnValue(Promise.resolve())
            const renderJob = up.follow(link, { scroll: '.other', failTarget: '.fail-target' })
            await wait()

            jasmine.respondWith({
              status: 500,
              responseText: `
                <div class="fail-target">
                  Errors here
                </div>
              `
            })
            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))
            expect(revealStub).not.toHaveBeenCalled()
          })
        })

        describe('with { failScroll } option', function() {
          it('reveals the given selector when the server responds with an error', async function() {
            const link = fixture('a[href="/action"][up-target=".target"][up-fail-target=".fail-target"]')
            const target = fixture('.target')
            const failTarget = fixture('.fail-target')
            const other = fixture('.other')
            const failOther = fixture('.fail-other')

            const revealStub = up.reveal.mock().and.returnValue(Promise.resolve())
            const renderJob = up.follow(link, { reveal: '.other', failScroll: '.fail-other' })
            await wait()

            jasmine.respondWith({
              status: 500,
              responseText: `
                <div class="fail-target">
                  Errors here
                </div>
                <div class="fail-other">
                  Fail other here
                </div>
              `
            })
            await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

            expect(revealStub).toHaveBeenCalled()
            expect(revealStub.calls.mostRecent().args[0]).toMatchSelector('.fail-other')
          })
        })

        describe('with { scroll: "restore" } option', function() {

          beforeEach(function() {
            up.history.config.enabled = true
          })

          it("does not reveal, but instead restores the scroll positions of the target's viewport", async function() {

            const $viewport = $fixture('.viewport[up-viewport] .element').css({
              'height': '100px',
              'width': '100px',
              'overflow-y': 'scroll'
            })

            const followLink = function(options = {}) {
              const $link = $viewport.find('.link')
              return up.follow($link.get(0), options)
            }

            const respond = (linkDestination) => {
              jasmine.respondWith(`
                <div class="element" style="height: 300px">
                  <a class="link" href="${linkDestination}" up-target=".element">Link</a>
                </div>
              `)
            }

            up.navigate('.element', { url: '/foo' })
            await wait()

            // Provide the content at /foo with a link to /bar in the HTML
            respond('/bar')
            await wait()

            $viewport.scrollTop(65)

            // Follow the link to /bar
            followLink()
            await wait()

            // Provide the content at /bar with a link back to /foo in the HTML
            respond('/foo')
            await wait()

            // Follow the link back to /foo, restoring the scroll position of 65px
            followLink({ scroll: 'restore' })
            await wait()

            // No need to respond because /foo has been cached before
            await wait()

            expect($viewport.scrollTop()).toBeAround(65, 1)
          })
        })

        describe("when the browser is already on the link's destination", function() {

          it("doesn't make a request and reveals the target container")

          it("doesn't make a request and reveals the target of a #hash in the URL")
        })
      })

      describe('with { confirm } option', function() {

        it('follows the link after the user OKs a confirmation dialog', async function() {
          spyOn(window, 'confirm').and.returnValue(true)
          const link = fixture('a[href="/danger"][up-target=".middle"]')
          up.follow(link, { confirm: 'Do you really want to go there?' })

          await wait()

          expect(window.confirm).toHaveBeenCalledWith('Do you really want to go there?')
          expect(jasmine.Ajax.requests.count()).toBe(1)
        })

        it('does not follow the link if the user cancels the confirmation dialog', async function() {
          spyOn(window, 'confirm').and.returnValue(false)
          const link = fixture('a[href="/danger"][up-target=".middle"]')

          const renderJob = up.follow(link, { confirm: 'Do you really want to go there?' })

          await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Aborted))

          expect(jasmine.Ajax.requests.count()).toBe(0)
          expect(window.confirm).toHaveBeenCalledWith('Do you really want to go there?')
        })

        it('does not show a confirmation dialog if the option is not a present string', async function() {
          spyOn(up, 'render').and.returnValue(Promise.resolve())
          spyOn(window, 'confirm')
          const link = fixture('a[href="/danger"][up-target=".middle"]')
          up.follow(link, { confirm: '' })

          await wait()

          expect(window.confirm).not.toHaveBeenCalled()
          expect(up.render).toHaveBeenCalled()
        })
      })
    })

  })

})
