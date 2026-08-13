let u = up.util
const e = up.element
const $ = jQuery

describe('up.link', function() {

  u = up.util

  describe('JavaScript functions', function() {

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

    describe("when the link's [href] is '#'", function() {

      it('does not follow the link', async function() {
        fixture('.target', { text: 'old text' })

        const link = fixture('a[href="#"][up-target=".target"]')
        const renderJob = up.follow(link)

        await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Error))
        expect('.target').toHaveText('old text')
      })

      it('does follow the link if it has a local content attribute', async function() {
        fixture('.target', { text: 'old text' })

        const link = fixture('a[href="#"][up-target=".target"][up-content="new text"]')
        const promise = up.follow(link)

        await expectAsync(promise).toBeResolvedTo(jasmine.any(up.RenderResult))
        expect('.target').toHaveText('new text')
      })
    })

    describe('up.link.followOptions()', function() {

      it('parses the render options that would be used to follow the given link', function() {
        const link = fixture('a[href="/path"][up-method="PUT"][up-layer="new"]')
        const options = up.link.followOptions(link)
        expect(options.url).toEqual('/path')
        expect(options.method).toEqual('PUT')
        expect(options.layer).toEqual('new')
      })

      it('does not render', function() {
        spyOn(up, 'render').and.returnValue(Promise.resolve())
        const link = fixture('a[href="/path"][up-method="PUT"][up-layer="new"]')
        const options = up.link.followOptions(link)
        expect(up.render).not.toHaveBeenCalled()
      })

      it('parses the link method from a [data-method] attribute so we can replace the Rails UJS adapter with Unpoly', function() {
        const link = fixture('a[href="/path"][data-method="patch"]')
        const options = up.link.followOptions(link)
        expect(options.method).toEqual('PATCH')
      })

      it("prefers a link's [up-href] attribute to its [href] attribute", function() {
        const link = fixture('a[href="/foo"][up-href="/bar"]')
        const options = up.link.followOptions(link)
        expect(options.url).toEqual('/bar')
      })

      it('parses an [up-on-finished] attribute', function() {
        window.onFinishedCallback = jasmine.createSpy('onFinished callback')
        const link = fixture('a[href="/path"][up-on-finished="nonce-specs-nonce window.onFinishedCallback(this)"]')
        const options = up.link.followOptions(link)

        expect(u.isFunction(options.onFinished)).toBe(true)
        options.onFinished()

        expect(window.onFinishedCallback).toHaveBeenCalledWith(link)

        delete window.onFinishedCallback
      })

      it('parses an [up-background] attribute', function() {
        const link = fixture('a[href="/foo"][up-background="true"]')
        const options = up.link.followOptions(link)
        expect(options.background).toBe(true)
      })

      it('parses an [up-use-keep] attribute as { keep }', function() {
        const link = fixture('a[href="/foo"][up-use-keep="false"]')
        const options = up.link.followOptions(link)
        expect(options.keep).toBe(false)
      })

      it('parses an [up-use-hungry] attribute as { hungry }', function() {
        const link = fixture('a[href="/foo"][up-use-hungry="false"]')
        const options = up.link.followOptions(link)
        expect(options.hungry).toBe(false)
      })

      it('parses an [up-use-data] attribute as a { data } object', function() {
        const link = fixture('a[href="/foo"][up-use-data="{ foo: 123 }"]')
        const options = up.link.followOptions(link)
        expect(options.data).toEqual({ foo: 123 })
      })

      it('does not default to an empty { data } object if no [up-use-data] is set', function() {
        const link = fixture('a[href="/foo"]')
        const options = up.link.followOptions(link)
        expect(options.data).toBeUndefined()
      })

      it('parses an [up-timeout] attribute', function() {
        const link = fixture('a[href="/foo"][up-timeout="20_000"]')
        const options = up.link.followOptions(link)
        expect(options.timeout).toBe(20000)
      })

      it('parses an [up-animation] attribute', function() {
        const link = fixture('a[href="/foo"][up-animation="move-from-top"]')
        const options = up.link.followOptions(link)
        expect(options.animation).toBe('move-from-top')
      })

      describe('[up-scroll]', function() {

        it('parses a scrolling option keyword', function() {
          const link = fixture('a[href="/foo"][up-scroll="top"]')
          const options = up.link.followOptions(link)
          expect(options.scroll).toBe('top')
        })

        it('parses a pixel value as a number (not as a string)', function() {
          const link = fixture('a[href="/foo"][up-scroll="367"]')
          const options = up.link.followOptions(link)
          expect(options.scroll).toBe(367)
        })

        it('parses a boolean value', function() {
          const link = fixture('a[href="/foo"][up-scroll="false"]')
          const options = up.link.followOptions(link)
          expect(options.scroll).toBe(false)
        })

      })

      it('parses an [up-scroll-behavior] attribute', function() {
        const link = fixture('a[href="/foo"][up-scroll-behavior="instant"]')
        const options = up.link.followOptions(link)
        expect(options.scrollBehavior).toBe('instant')
      })

      it('parses an [up-content] attribute', function() {
        const link = fixture('a[href="/foo"][up-content="new text"]')
        const options = up.link.followOptions(link)
        expect(options.content).toBe('new text')
      })

      it('parses an [up-history] attribute', function() {
        const link = fixture('a[href="/foo"][up-history="false"]')
        const options = up.link.followOptions(link)
        expect(options.history).toBe(false)
      })

      it('parses an [up-title] attribute', function() {
        const link = fixture('a[href="/foo"][up-title="false"]')
        const options = up.link.followOptions(link)
        expect(options.title).toBe(false)
      })

      it('parses an [up-location] attribute', function() {
        const link = fixture('a[href="/foo"][up-location="false"]')
        const options = up.link.followOptions(link)
        expect(options.location).toBe(false)
      })

      it('parses an [up-meta-tags] attribute', function() {
        const link = fixture('a[href="/foo"][up-meta-tags="false"]')
        const options = up.link.followOptions(link)
        expect(options.metaTags).toBe(false)
      })

      it('parses an [up-lang=false] attribute as boolean', function() {
        const link = fixture('a[href="/foo"][up-lang="false"]')
        const options = up.link.followOptions(link)
        expect(options.lang).toBe(false)
      })

      it('parses an [up-lang="string"] attribute as string', function() {
        const link = fixture('a[href="/foo"][up-lang="fr"]')
        const options = up.link.followOptions(link)
        expect(options.lang).toBe('fr')
      })

      it('parses an [up-focus-visible=false] attribute as boolean', function() {
        const link = fixture('a[href="/foo"][up-focus-visible="false"]')
        const options = up.link.followOptions(link)
        expect(options.focusVisible).toBe(false)
      })

      it('parses an [up-focus-visible="auto"] attribute as string', function() {
        const link = fixture('a[href="/foo"][up-focus-visible="auto"]')
        const options = up.link.followOptions(link)
        expect(options.focusVisible).toBe('auto')
      })

      it('parses an [up-match] attribute', function() {
        const link = fixture('a[href="/foo"][up-match="first"]')
        const options = up.link.followOptions(link)
        expect(options.match).toBe('first')
      })

      it('parses an [up-preview] attribute as a string', function() {
        const link = fixture('a[href="/foo"][up-preview="foo bar"]')
        const options = up.link.followOptions(link)
        expect(options.preview).toBe('foo bar')
      })

      it('parses an [up-revalidate-preview] attribute as a string', function() {
        const link = fixture('a[href="/foo"][up-revalidate-preview="foo bar"]')
        const options = up.link.followOptions(link)
        expect(options.revalidatePreview).toBe('foo bar')
      })

      it('parses an [up-revalidate-preview] attribute as a boolean', function() {
        const link = fixture('a[href="/foo"][up-revalidate-preview="true"]')
        const options = up.link.followOptions(link)
        expect(options.revalidatePreview).toBe(true)
      })

      it('parses an [up-placeholder] attribute as a string', function() {
        const link = fixture('a[href="/foo"][up-placeholder="loading..."]')
        const options = up.link.followOptions(link)
        expect(options.placeholder).toBe('loading...')
      })

      it('parses an [up-late-delay=Number] attribute as a number', function() {
        const link = fixture('a[href="/foo"][up-late-delay=123]')
        up.hello(link)

        const options = up.link.followOptions(link)
        expect(options.lateDelay).toBe(123)
      })

      it('parses an [up-late-delay=false] attribute as a boolean', function() {
        const link = fixture('a[href="/foo"][up-late-delay=false]')
        up.hello(link)

        const options = up.link.followOptions(link)
        expect(options.lateDelay).toBe(false)
      })

      it('parses an [up-disable] attribute as a selector string', function() {
        const link = fixture('a[href="/foo"][up-disable=".field"]')
        up.hello(link)

        const options = up.link.followOptions(link)
        expect(options.disable).toBe('.field')
      })

      it('parses a value-less [up-disable] attribute as a true boolean', function() {
        const link = fixture('a[href="/foo"][up-disable]')
        up.hello(link)

        const options = up.link.followOptions(link)
        expect(options.disable).toBe(true)
      })

      it('parses an [up-fail] attribute as a boolean', function() {
        const link = fixture('a[href="/foo"][up-fail="false"]')
        up.hello(link)

        const options = up.link.followOptions(link)
        expect(options.fail).toBe(false)
      })

      it('parses an [up-animation] attribute as a string', function() {
        const link = fixture('a[href="/foo"][up-animation="fade-in"]')
        up.hello(link)

        const options = up.link.followOptions(link)
        expect(options.animation).toBe('fade-in')
      })

      it('parses an [up-animation=false] attribute as a boolean', function() {
        const link = fixture('a[href="/foo"][up-animation="false"]')
        up.hello(link)

        const options = up.link.followOptions(link)
        expect(options.animation).toBe(false)
      })

      it('parses an [up-transition] attribute as a string', function() {
        const link = fixture('a[href="/foo"][up-transition="fade-in"]')
        up.hello(link)

        const options = up.link.followOptions(link)
        expect(options.transition).toBe('fade-in')
      })

      it('parses an [up-transition=false] attribute as a boolean', function() {
        const link = fixture('a[href="/foo"][up-transition="false"]')
        up.hello(link)

        const options = up.link.followOptions(link)
        expect(options.transition).toBe(false)
      })

      describe('[up-use-data-map]', function() {

        it('parses a relaxed JSON value into a { dataMap } option (not { useDataMap })', function() {
          const link = htmlFixture(`
            <a
              href="/dashboard"
              up-target="#left, #right"
              up-use-data-map="{ '#left': { leftKey: 'leftValue' }, '#right': { rightKey: 'rightValue' } }"
            >
              Link label
            </a>
          `)
          up.hello(link)

          const options = up.link.followOptions(link)
          expect(options.dataMap).toEqual({ '#left': { leftKey: 'leftValue' }, '#right': { rightKey: 'rightValue' } })
        })

        it('returns a missing value if the the attribute is missing', function() {
          const link = fixture('a[href="/foo"][up-follow]')
          up.hello(link)

          const options = up.link.followOptions(link)
          expect(options.dataMap).toBeMissing()
        })

      })

      describe('[up-scroll-map]', function() {

        it('parses a relaxed JSON value', function() {
          const link = htmlFixture(`
            <a
              href="/dashboard"
              up-target="#left, #right"
              up-scroll-map="{ '#left': 'bottom', '#right': 'bottom' }"
            >
              Link label
            </a>
          `)
          up.hello(link)

          const options = up.link.followOptions(link)
          expect(options.scrollMap).toEqual({ '#left': 'bottom', '#right': 'bottom' })
        })

        it('returns a missing value if the the attribute is missing', function() {
          const link = fixture('a[href="/foo"][up-follow]')
          up.hello(link)

          const options = up.link.followOptions(link)
          expect(options.scrollMap).toBeMissing()
        })

      })

      describe('[up-peel]', function() {

        it('parses [up-peel] as true', function() {
          const link = fixture('a[href="/foo"][up-peel]')
          const options = up.link.followOptions(link)
          expect(options.peel).toBe(true)
        })

        it('parses [up-peel=true] as true', function() {
          const link = fixture('a[href="/foo"][up-peel="true"]')
          const options = up.link.followOptions(link)
          expect(options.peel).toBe(true)
        })

        it('parses [up-peel=false] as false', function() {
          const link = fixture('a[href="/foo"][up-peel="false"]')
          const options = up.link.followOptions(link)
          expect(options.peel).toBe(false)
        })

        it('parses [up-peel="accept"] as "accept"', function() {
          const link = fixture('a[href="/foo"][up-peel="accept"]')
          const options = up.link.followOptions(link)
          expect(options.peel).toBe("accept")
        })

        it('parses [up-peel="dismiss"] as "dismiss"', function() {
          const link = fixture('a[href="/foo"][up-peel="dismiss"]')
          const options = up.link.followOptions(link)
          expect(options.peel).toBe("dismiss")
        })

      })

      describe('[up-accept-fragment]', function() {

        it('parses as a string', function() {
          const link = fixture('a[href="/foo"][up-accept-fragment="#foo"]')
          const options = up.link.followOptions(link)
          expect(options.acceptFragment).toBe('#foo')
        })

      })

      describe('[up-dismiss-fragment]', function() {

        it('parses as a string', function() {
          const link = fixture('a[href="/foo"][up-dismiss-fragment="#foo"]')
          const options = up.link.followOptions(link)
          expect(options.dismissFragment).toBe('#foo')
        })

      })

      if (up.migrate.loaded) {
        it('parses an [up-reset-scroll] attribute as { scroll: "top" }', function() {
          const link = fixture('a[href="/foo"][up-reset-scroll]')
          up.hello(link)

          const options = up.link.followOptions(link)
          expect(options.scroll).toBe('top')
        })

        it('parses an [up-restore-scroll] attribute as { scroll: "restore" }', function() {
          const link = fixture('a[href="/foo"][up-restore-scroll]')
          up.hello(link)

          const options = up.link.followOptions(link)
          expect(options.scroll).toBe('restore')
        })

        it('parses an [up-reveal=false] attribute as { scroll: false }', function() {
          const link = fixture('a[href="/foo"][up-reveal=false]')
          up.hello(link)

          const options = up.link.followOptions(link)
          expect(options.scroll).toBe(false)
        })

        it('parses an [up-bad-response-time=Number] attribute as { lateDelay: Number }', function() {
          const link = fixture('a[href="/foo"][up-bad-response-time=123]')
          up.hello(link)

          const options = up.link.followOptions(link)
          expect(options.lateDelay).toBe(123)
        })

        describe('[up-dismissable]', function() {

          it('parses into { dismissible }', function() {
            const link = fixture('a[href="/foo"][up-layer="new"][up-dismissable="key"]')
            up.hello(link)

            const options = up.link.followOptions(link)
            expect(options.dismissible).toBe('key')
          })

        })

      }
    })

    describe('up.link.shouldFollowEvent', function() {

      const buildEvent = function(target, attrs) {
        const event = Trigger.createMouseEvent('mousedown', attrs)
        // Cannot change event.target on a native event property, but we can with Object.defineProperty()
        Object.defineProperty(event, 'target', { get() { return target } })
        return event
      }

      it("returns true when the given event's target is the given link itself", function() {
        const $link = $fixture('a[href="/foo"]')
        const event = buildEvent($link[0])
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(true)
      })

      it("returns true when the given event's target is a non-link child of the given link", function() {
        const $link = $fixture('a[href="/foo"]')
        const $span = $link.affix('span')
        const event = buildEvent($span[0])
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(true)
      })

      it("returns false when the given event's target is a child link of the given link (think [up-expand])", function() {
        const $link = $fixture('div[up-href="/foo"]')
        const $childLink = $link.affix('a[href="/bar"]')
        const event = buildEvent($childLink[0])
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(false)
      })

      it("returns false when the given event's target is a child input of the given link (think [up-expand])", function() {
        const $link = $fixture('div[up-href="/foo"]')
        const $childInput = $link.affix('input[type="text"]')
        const event = buildEvent($childInput[0])
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(false)
      })
    })

    describe('up.link.makeFollowable', function() {

      it("adds [up-follow] to a link that wouldn't otherwise be handled by Unpoly", function() {
        const $link = $fixture('a[href="/path"]').text('label')
        up.link.makeFollowable($link[0])
        expect($link.attr('up-follow')).toEqual('')
      })

      it("does not add [up-follow] to a link that is already [up-target]", function() {
        const $link = $fixture('a[href="/path"][up-target=".target"]').text('label')
        up.link.makeFollowable($link[0])
        expect($link.attr('up-follow')).toBeMissing()
      })
    })

    describe('up.visit', function() {
      it('should have tests')
    })

    describe('up.link.isFollowable', function() {

      it('returns true for an [up-target] link', function() {
        const link = fixture('a[href="/foo"][up-target=".target"]')
        up.hello(link)
        expect(up.link.isFollowable(link)).toBe(true)
      })

      it('returns true for an [up-follow] link', function() {
        const link = fixture('a[href="/foo"][up-follow]')
        up.hello(link)
        expect(up.link.isFollowable(link)).toBe(true)
      })

      it('returns true for an [up-layer] link', function() {
        const $link = $fixture('a[href="/foo"][up-layer="modal"]')
        up.hello($link)
        expect(up.link.isFollowable($link)).toBe(true)
      })

      it('returns true for an [up-follow] link', function() {
        const $link = $fixture('a[href="/foo"][up-follow]')
        up.hello($link)
        expect(up.link.isFollowable($link)).toBe(true)
      })

      it('returns true for an [up-preload] link', function() {
        const $link = $fixture('a[href="/foo"][up-preload]')
        up.hello($link)
        expect(up.link.isFollowable($link)).toBe(true)
      })

      if (up.migrate.loaded) {
        it('returns true for an [up-instant][href] link', function() {
          const $link = $fixture('a[href="/foo"][up-instant]')
          up.hello($link)
          expect(up.link.isFollowable($link)).toBe(true)
        })

        it('returns true for a faux [up-instant][up-href] link', function() {
          const $link = $fixture('span[up-href="/foo"][up-instant]')
          up.hello($link)
          expect(up.link.isFollowable($link)).toBe(true)
        })
      } else {
        it('returns false for an [up-instant] link (because we also have a[up-emit][up-instant])', function() {
          const $link = $fixture('a[href="/foo"][up-instant]')
          up.hello($link)
          expect(up.link.isFollowable($link)).toBe(false)
        })
      }

      if (up.migrate.loaded) {
        it('returns true for an [up-modal] link', function() {
          const $link = $fixture('a[href="/foo"][up-modal=".target"]')
          up.hello($link)
          expect(up.link.isFollowable($link)).toBe(true)
        })

        it('returns true for an [up-popup] link', function() {
          const $link = $fixture('a[href="/foo"][up-popup=".target"]')
          up.hello($link)
          expect(up.link.isFollowable($link)).toBe(true)
        })

        it('returns true for an [up-drawer] link', function() {
          const $link = $fixture('a[href="/foo"][up-drawer=".target"]')
          up.hello($link)
          expect(up.link.isFollowable($link)).toBe(true)
        })
      }

      if (up.migrate.loaded) {
        it('returns true for an [up-target] span with [up-href]', function() {
          const $link = $fixture('span[up-href="/foo"][up-target=".target"]')
          up.hello($link)
          expect(up.link.isFollowable($link)).toBe(true)
        })
      }

      it('returns false if the given link will be handled by the browser', function() {
        const $link = $fixture('a[href="/foo"]')
        up.hello($link)
        expect(up.link.isFollowable($link)).toBe(false)
      })

      it('returns false if the given link will be handled by Rails UJS', function() {
        const $link = $fixture('a[href="/foo"][data-method="put"]')
        up.hello($link)
        expect(up.link.isFollowable($link)).toBe(false)
      })

      it('returns true if the given link matches a custom up.link.config.followSelectors', function() {
        const link = fixture('a.hyperlink[href="/foo"]')
        up.link.config.followSelectors.push('.hyperlink')
        expect(up.link.isFollowable(link)).toBe(true)
      })

      it('returns false if the given link matches a custom up.link.config.followSelectors, but also has [up-follow=false]', function() {
        const link = fixture('a.hyperlink[href="/foo"][up-follow="false"]')
        up.link.config.followSelectors.push('.hyperlink')
        expect(up.link.isFollowable(link)).toBe(false)
      })

      it('returns false for a link with a [href] to another host ("cross origin")', function() {
        const link = fixture('a[up-follow][href="https://other-host/path"]')
        expect(up.link.isFollowable(link)).toBe(false)
      })

      it('returns true for a link with a [href] to this host when it also includes this port explicitly', function() {
        const link = fixture(`a[up-follow][href=//${location.hostname}:${location.port}/path]`)
        expect(up.link.isFollowable(link)).toBe(true)
      })

      it('returns false for a link with a [href] to this host, but another port', function() {
        const link = fixture(`a[up-follow][href=//${location.hostname}:97334/path]`)
        expect(up.link.isFollowable(link)).toBe(false)
      })

      it('returns false for a link with a [up-href] to another host', function() {
        const link = fixture('a[up-follow][href="/path"][up-href="https://other-host/path"]')
        expect(up.link.isFollowable(link)).toBe(false)
      })

      it('returns true for a link with a [up-href] to a fully qualified URL on this host', function() {
        const link = fixture(`a[up-follow][href='/path'][up-href=//${location.host}/path]`)
        expect(up.link.isFollowable(link)).toBe(true)
      })

      it('returns false for a link with a [up-href] to this host, but another port', function() {
        const link = fixture(`a[up-follow][href='/path'][up-href=//${location.host}:97334/path]`)
        expect(up.link.isFollowable(link)).toBe(false)
      })

      it('returns false for an #anchor link without a path, even if the link has [up-follow]', function() {
        const link = fixture('a[up-follow][href="#details"]')
        expect(up.link.isFollowable(link)).toBe(false)
      })

      it('returns false for an #anchor link with a path, even if the link has [up-follow]', function() {
        const link = fixture('a[up-follow][href="/other/page#details"]')
        expect(up.link.isFollowable(link)).toBe(true)
      })

      it('returns false for a link with a "javascript:..." [href] attribute, even if the link has [up-follow]', function() {
        const link = fixture('a[up-follow][href="javascript:foo()"]')
        expect(up.link.isFollowable(link)).toBe(false)
      })

      it('returns false for a link with [up-follow] that also matches up.link.config.noFollowSelectors', function() {
        up.link.config.noFollowSelectors.push('.foo')
        const link = fixture('a.foo[up-follow][href="/foo"]')
        expect(up.link.isFollowable(link)).toBe(false)
      })

      it('returns false for an [href="#"] link', function() {
        const link = fixture('a[href="#"]')
        expect(up.link.isFollowable(link)).toBe(false)
      })

      it('returns true for an [href="#"] link that updates local content', function() {
        const link = fixture('a[href="#"][up-content="foo"]')
        expect(up.link.isFollowable(link)).toBe(true)
      })
    })

    describe('up.link.preload()', function() {

      beforeEach(function() {
        this.requestTarget = () => jasmine.lastRequest().requestHeaders['X-Up-Target']
      })

      it("loads and caches the given link's destination", async function() {
        fixture('.target')
        const link = fixture('a[href="/path"][up-target=".target"]')

        up.link.preload(link)

        await wait()

        expect({
          url: '/path',
          target: '.target',
          failTarget: 'default-fallback',
          origin: link
        }).toBeCached()
      })

      it('accepts options that overrides those options that were parsed from the link', async function() {
        fixture('.target')
        const link = fixture('a[href="/path"][up-target=".target"]')
        up.link.preload(link, { url: '/options-path' })

        await wait()

        expect({
          url: '/options-path',
          target: '.target',
          failTarget: 'default-fallback',
          origin: link
        }).toBeCached()
      })

      it('does not dispatch another request for a link that is currently loading', async function() {
        const link = fixture('a[href="/path"][up-target=".target"]')
        up.follow(link)

        await wait()

        expect(jasmine.Ajax.requests.count()).toBe(1)

        up.link.preload(link)

        await wait()

        expect(jasmine.Ajax.requests.count()).toBe(1)
      })

      it('does not update fragments for a link with local content (bugfix)', async function() {
        const target = fixture('.target', { text: 'old text' })
        const link = fixture('a[up-content="new text"][up-target=".target"]')

        up.link.preload(link)

        await wait()

        expect('.target').toHaveText('old text')
      })

      it('does not call an { onRendered } callback', async function() {
        const onRendered = jasmine.createSpy('{ onRendered } callback')
        fixture('.target')
        const link = fixture('a[up-href="/path"][up-target=".target"]')

        const promise = up.link.preload(link, { onRendered })

        await wait()

        jasmine.respondWithSelector('.target')

        await expectAsync(promise).toBeResolved()

        expect(onRendered).not.toHaveBeenCalled()
      })

      describe('for an [up-target] link', function() {

        it('includes the [up-target] selector as an X-Up-Target header if the targeted element is currently on the page', async function() {
          fixture('.target')
          const link = fixture('a[href="/path"][up-target=".target"]')
          up.link.preload(link)

          await wait()

          expect(this.requestTarget()).toEqual('.target')
        })

        it('replaces the [up-target] selector as with a fallback and uses that as an X-Up-Target header if the targeted element is not currently on the page', async function() {
          const link = fixture('a[href="/path"][up-target=".target"]')
          up.link.preload(link)

          await wait()

          // The default fallback would usually be `body`, but in Jasmine specs we change
          // it to protect the test runner during failures.
          expect(this.requestTarget()).toEqual('default-fallback')
        })
      })

      describe('for a link opening a new layer', function() {

        beforeEach(function() {
          up.motion.config.enabled = false
        })

        it('includes the selector as an X-Up-Target header and does not replace it with a fallback, since the layer frame always exists', async function() {
          const link = fixture('a[href="/path"][up-target=".target"][up-layer="new"]')
          up.hello(link)

          up.link.preload(link)

          await wait()

          expect(this.requestTarget()).toEqual('.target')
        })

        it('does not create layer elements', async function() {
          const link = fixture('a[href="/path"][up-target=".target"][up-layer="new modal"]')
          up.hello(link)

          up.link.preload(link)

          await wait()

          expect('up-modal').not.toBeAttached()
        })

        it('does not emit an up:layer:open event', async function() {
          const link = fixture('a[href="/path"][up-target=".target"][up-layer="new modal"]')
          up.hello(link)
          const openListener = jasmine.createSpy('listener')
          up.on('up:layer:open', openListener)

          up.link.preload(link)

          await wait()

          expect(openListener).not.toHaveBeenCalled()
        })

        it('does not close a currently open overlay', async function() {
          const link = fixture('a[href="/path"][up-target=".target"][up-layer="new modal"]')
          up.hello(link)
          const closeListener = jasmine.createSpy('listener')
          up.on('up:layer:dismiss', closeListener)

          up.layer.open({ mode: 'modal', fragment: '<div class="content">Modal content</div>' })

          await wait()

          expect('up-modal .content').toBeAttached()

          up.link.preload(link)

          await wait()

          expect('up-modal .content').toBeAttached()
          expect(closeListener).not.toHaveBeenCalled()

          up.layer.dismiss()

          await wait()

          expect('up-modal .content').not.toBeAttached()
          expect(closeListener).toHaveBeenCalled()
        })

        it('does not prevent the opening of other overlays while the request is still pending', async function() {
          const link = fixture('a[href="/path"][up-target=".target"][up-layer="new modal"]')
          up.hello(link)
          up.link.preload(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)

          up.layer.open({ mode: 'modal', fragment: '<div class="content">Modal content</div>' })

          await wait()

          expect('up-modal .content').toBeAttached()
        })

        it('calls up.request() with a { background: true } option', async function() {
          const requestSpy = spyOn(up, 'request').and.callThrough()

          const $link = $fixture('a[href="/path"][up-target=".target"][up-layer="new modal"]')
          up.hello($link)
          up.link.preload($link)

          await wait()

          expect(requestSpy).toHaveBeenCalledWith(jasmine.objectContaining({ background: true }))
        })
      })

      describe('aborting', function() {

        it('is not abortable by default', async function() {
          const link = fixture('a[href="/path"][up-target=".target"]')
          up.link.preload(link)

          await wait()

          expect(up.network.isBusy()).toBe(true)

          up.fragment.abort()

          await wait()

          expect(up.network.isBusy()).toBe(true)
        })

        it('is abortable with { abortable: true }', async function() {
          const link = fixture('a[href="/path"][up-target=".target"]')
          const preloadJob = up.link.preload(link, { abortable: true })

          await wait()

          expect(up.network.isBusy()).toBe(true)

          up.fragment.abort()

          await expectAsync(preloadJob).toBeRejectedWith(jasmine.any(up.Aborted))

          expect(up.network.isBusy()).toBe(false)
        })

        it('does not abort other follow requests for the same target', async function() {
          const link1 = fixture('a[href="/path1"][up-target=".target"]')
          const link2 = fixture('a[href="/path2"][up-target=".target"]')

          up.link.follow(link1)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)

          const preloadJob = up.link.preload(link2)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)
        })

        it('does not abort other preload requests for the same target', async function() {
          const link1 = fixture('a[href="/path1"][up-target=".target"]')
          const link2 = fixture('a[href="/path2"][up-target=".target"]')

          up.link.preload(link1)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)

          const preloadJob = up.link.preload(link2)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)
        })
      })
    })

    describe('up.deferred.load()', function() {

      it('loads a partial that deferred loading to the user with [up-defer="manual"]', async function() {
        const partial = fixture('a#slow[href="/slow-path"][up-defer="manual"]')
        up.hello(partial)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(0)

        up.deferred.load(partial)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        expect(jasmine.lastRequest().url).toMatchURL('/slow-path')
        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('#slow')

        jasmine.respondWithSelector('#slow', { text: 'partial content' })

        await wait()

        expect('#slow').toHaveText('partial content')
      })

      it('returns an up.RenderJob that resolves with the render pass')
    })
  })

  describe('unobtrusive behavior', function() {

    require('./link_target_spec')

    describe('[up-follow]', function() {

      it("calls up.follow() with the clicked link", async function() {
        const link = fixture('a[href="/follow-path"][up-follow]')
        const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

        Trigger.clickSequence(link)

        await wait()

        expect(followSpy).toHaveBeenCalledWith(link)
        expect(link).not.toHaveBeenDefaultFollowed()
      })

      it("calls up.follow() with the closest link if a link child was clicked", async function() {
        const link = fixture('a[href="/follow-path"][up-follow]')
        const linkChild = e.affix(link, '#child', { text: 'label' })
        const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

        Trigger.clickSequence(linkChild)

        await wait()

        expect(followSpy).toHaveBeenCalledWith(link)
        expect(link).not.toHaveBeenDefaultFollowed()
      })

      it('follows a link with [up-follow=true]', async function() {
        const link = fixture('a[href="/follow-path"][up-follow=true]')
        const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

        Trigger.clickSequence(link)

        await wait()

        expect(followSpy).toHaveBeenCalledWith(link)
        expect(link).not.toHaveBeenDefaultFollowed()
      })

      it('follows a link that is immediately removed after clicking', async function() {
        fixture('#main')
        const link = fixture('a[href="/follow-path"][up-follow=true][up-target="#main"]')

        Trigger.clickSequence(link)
        link.remove()

        await wait()

        expect(jasmine.Ajax.requests.count()).toBe(1)
        jasmine.respondWithSelector('#main', { text: 'link content' })

        await wait()

        expect('#main').toHaveText('link content')
      })

      describe('when the server responds with an error', function() {

        it('updates the [up-fail-target] instead')

        it('updates a main target if no [up-fail-target] is given')

        it('updates the [up-fail-target] if the link is immediately removed after clicking', async function() {
          fixture('#success', { text: 'initial content' })
          fixture('#failure', { text: 'initial content' })
          const link = fixture('a[href="/follow-path"][up-follow=true][up-target="#success"][up-fail-target="#failure"]')

          Trigger.clickSequence(link)
          link.remove()

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          jasmine.respondWithSelector('#failure', { text: 'link content', status: 422 })

          await wait()

          expect('#success').toHaveText('initial content')
          expect('#failure').toHaveText('link content')
        })
      })

      describe('exemptions from following', function() {

        it('never follows a link with [download] (which opens a save-as-dialog)', async function() {
          const link = helloFixture('a[href="/path"][up-target=".target"][download]')

          Trigger.click(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('never preloads a link with a [target] attribute (which updates a frame or opens a tab)', async function() {
          const link = helloFixture('a[href="/path"][up-target=".target"][target="_blank"]')

          Trigger.click(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('never follows an a[href="#"]', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          const link = helloFixture('a[href="#"][up-target=".target"]')
          const clickListener = jasmine.createSpy('click listener')
          up.on('click', clickListener)

          Trigger.click(link)

          await wait()

          expect(followSpy).not.toHaveBeenCalled()
          expect(clickListener.calls.argsFor(0)[0].defaultPrevented).toBe(false)
        })

        it('never follows a link with a "mailto:..." [href] attribute', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.link.config.followSelectors.push('a[href]')
          const link = helloFixture('a[href="mailto:foo@bar.com"]')

          Trigger.click(link)

          await wait()

          expect(followSpy).not.toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('never follows a link with a "tel:..." [href] attribute', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.link.config.followSelectors.push('a[href]')
          const link = helloFixture('a[href="tel:+49123456"]')

          Trigger.click(link)

          await wait()

          expect(followSpy).not.toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('never follows a link with a "whatsapp://..." attribute', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.link.config.followSelectors.push('a[href]')
          const link = helloFixture('a[href="whatsapp://send?text=Hello"]')

          Trigger.click(link)

          await wait()

          expect(followSpy).not.toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('does follow an a[href="#"] if the link also has local content via an [up-content], [up-fragment] or [up-document] attribute', async function() {
          const target = fixture('.target', { text: 'old text' })
          const link = helloFixture('a[href="#"][up-target=".target"][up-content="new text"]')

          Trigger.clickSequence(link)

          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(0)
          expect(link).not.toHaveBeenDefaultFollowed()
          expect('.target').toHaveText('new text')
        })

        it('does nothing if the right mouse button is used', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.click(this.$link, { button: 2 })

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
          expect(this.$link).toHaveBeenDefaultFollowed()
        })

        it('does nothing if shift is pressed during the click', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.click(this.$link, { shiftKey: true })

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
          expect(this.$link).toHaveBeenDefaultFollowed()
        })

        it('does nothing if ctrl is pressed during the click', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.click(this.$link, { ctrlKey: true })

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
          expect(this.$link).toHaveBeenDefaultFollowed()
        })

        it('does nothing if meta is pressed during the click', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.click(this.$link, { metaKey: true })

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
          expect(this.$link).toHaveBeenDefaultFollowed()
        })

        it('does nothing if a listener prevents the up:click event on the link', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.on(this.$link, 'up:click', (event) => event.preventDefault())

          Trigger.click(this.$link)

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
          expect(this.$link).not.toHaveBeenDefaultFollowed()
        })

        it('does nothing if a listener prevents the click event on the link', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.on(this.$link, 'click', (event) => event.preventDefault())

          Trigger.click(this.$link)

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
          expect(this.$link).not.toHaveBeenDefaultFollowed()
        })
      })

      describe('handling of up.link.config.followSelectors', function() {

        it('follows matching links even without [up-follow] or [up-target]', async function() {
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          const link = fixture('a[href="/foo"].link')
          up.link.config.followSelectors.push('.link')

          Trigger.click(link)

          await wait()

          expect(this.followSpy).toHaveBeenCalled()
          expect(link).not.toHaveBeenDefaultFollowed()
        })

        it('allows to opt out with [up-follow=false]', async function() {
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          const link = fixture('a[href="/foo"][up-follow="false"].link')
          up.link.config.followSelectors.push('.link')

          Trigger.click(link)

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })
      })

      describe('with [up-instant] modifier', function() {

        it('follows a link on mousedown (instead of on click)', function() {
          const link = fixture('a[href="/follow-path"][up-follow][up-instant]')
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(link)

          expect(followSpy.calls.mostRecent().args[0]).toEqual(link)
        })

        it('follows a link on mousedown with [up-instant=true]', function() {
          const link = fixture('a[href="/follow-path"][up-follow][up-instant]')
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(link)

          expect(followSpy.calls.mostRecent().args[0]).toEqual(link)
        })

        it('does nothing on mouseup', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mouseup(this.$link)

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
        })

        it('does nothing on click if there was an earlier mousedown event', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(this.$link)
          Trigger.click(this.$link)

          await wait()

          expect(this.followSpy.calls.count()).toBe(1)
        })

        it('does follow a link on click if there was never a mousedown event (e.g. if the user pressed enter)', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.click(this.$link)

          await wait()

          expect(this.followSpy.calls.mostRecent().args[0]).toEqual(this.$link[0])
        })

        it('does nothing if the right mouse button is pressed down', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(this.$link, { button: 2 })

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
        })

        it('does nothing if shift is pressed during mousedown', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(this.$link, { shiftKey: true })

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
        })

        it('does nothing if ctrl is pressed during mousedown', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(this.$link, { ctrlKey: true })

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
        })

        it('does nothing if meta is pressed during mousedown', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())

          Trigger.mousedown(this.$link, { metaKey: true })

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
        })

        it('does nothing if a listener prevents the up:click event on the link', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.on(this.$link, 'up:click', (event) => event.preventDefault())

          Trigger.mousedown(this.$link)

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
          expect(this.$link).not.toHaveBeenDefaultFollowed()
        })

        it('does nothing if a listener prevents the mousedown event on the link', async function() {
          this.$link = $fixture('a[href="/follow-path"][up-follow][up-instant]')
          this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          up.on(this.$link, 'mousedown', (event) => event.preventDefault())

          Trigger.mousedown(this.$link)

          await wait()

          expect(this.followSpy).not.toHaveBeenCalled()
          expect(this.$link).not.toHaveBeenDefaultFollowed()
        })

        it('fires a click event on an a[href="#"] link that will be handled by the browser', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          const link = helloFixture('a[href="#"][up-instant][up-target=".target"]')

          const clickListener = jasmine.createSpy('click listener')
          up.on('click', clickListener)

          Trigger.clickSequence(link)

          await wait()

          expect(followSpy).not.toHaveBeenCalled()

          expect(clickListener).toHaveBeenCalled()
          expect(clickListener.calls.argsFor(0)[0].defaultPrevented).toBe(false)
        })

        it('follows a[onclick] links on click instead of mousedown', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          const link = helloFixture('a[href="/foo"][onclick="console.log(\'clicked\')"][up-instant][up-target=".target"]')

          Trigger.mousedown(link)
          await wait()

          expect(followSpy).not.toHaveBeenCalled()

          Trigger.click(link)
          await wait()

          expect(followSpy).toHaveBeenCalled()
        })

        it('does not fire a click event on an a[href="#"] link that also has local HTML in [up-content], [up-fragment] or [up-document]', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          // In reality the user will have configured an overly greedy selector like
          // up.fragment.config.instantSelectors.push('a[href]') and we want to help them
          // not break all their "javascript:" links.
          const link = helloFixture('a[href="#"][up-instant][up-target=".target"][up-content="new content"]')
          fixture('.target')

          const clickListener = jasmine.createSpy('click listener')
          up.on('click', clickListener)

          Trigger.clickSequence(link)
          await wait()

          expect(followSpy).toHaveBeenCalled()

          expect(clickListener).not.toHaveBeenCalled()
          expect(link).not.toHaveBeenDefaultFollowed()
        })

        it('fires a click event on an a[href="#hash"] link that will be handled by the browser', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          // In reality the user will have configured an overly greedy selector like
          // up.fragment.config.instantSelectors.push('a[href]') and we want to help them
          // not break all their #anchor link.s
          const link = helloFixture('a[href="#details"][up-instant]')

          const clickListener = jasmine.createSpy('click listener')
          up.on('click', clickListener)

          Trigger.clickSequence(link)
          await wait()

          expect(followSpy).not.toHaveBeenCalled()

          expect(clickListener).toHaveBeenCalled()
          expect(clickListener.calls.argsFor(0)[0].defaultPrevented).toBe(false)
        })

        it('fires a click event on an a[href="javascript:..."] link that will be handled by the browser', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          // In reality the user will have configured an overly greedy selector like
          // up.fragment.config.instantSelectors.push('a[href]') and we want to help them
          // not break all their "javascript:" links.
          const link = helloFixture('a[href="javascript:console.log(\'hi world\')"][up-instant]')

          const clickListener = jasmine.createSpy('click listener')
          up.on('click', clickListener)

          Trigger.clickSequence(link)
          await wait()

          expect(followSpy).not.toHaveBeenCalled()

          expect(clickListener).toHaveBeenCalled()
          expect(clickListener.calls.argsFor(0)[0].defaultPrevented).toBe(false)
        })

        it('fires a click event on a cross-origin link that will be handled by the browser', async function() {
          const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
          // In reality the user will have configured an overly greedy selector like
          // up.fragment.config.instantSelectors.push('a[href]') and we want to help them
          // not break all their "javascript:" links.
          const link = helloFixture('a[href="http://other-site.tld/path"][up-instant]')

          const clickListener = jasmine.createSpy('click listener')
          up.on('click', clickListener)

          Trigger.clickSequence(link)
          await wait()

          expect(followSpy).not.toHaveBeenCalled()

          expect(clickListener).toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        describe('focus', function() {

          beforeEach(function() {
            up.specUtil.assertTabFocused()
          })

          it('focused the link after the click sequence (like a vanilla link)', function() {
            const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
            const link = helloFixture('a[href="/path"][up-follow][up-instant]')

            Trigger.clickSequence(link, { focus: false })

            expect(followSpy).toHaveBeenCalled()
            expect(link).toBeFocused()
          })

          it('hides a focus ring when activated with the mouse', function() {
            const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
            const link = helloFixture('a[href="/path"][up-follow][up-instant]')
            Trigger.clickSequence(link, { focus: false })

            expect(followSpy).toHaveBeenCalled()
            expect(link).toBeFocused()

            expect(link).not.toHaveOutline()
          })

          it('shows a focus ring when activated with a non-pointing device (keyboard or unknown)', function() {
            const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
            const link = helloFixture('a[href="/path"][up-follow][up-instant]')
            Trigger.clickLinkWithKeyboard(link)

            expect(followSpy).toHaveBeenCalled()
            expect(link).toBeFocused()

            expect(link).toHaveOutline()
          })

          it('hides the focus ring when activated with the mouse, then shows the focus ring when activated with the keyboard', function() {
            const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
            const link = helloFixture('a[href="/path"][up-follow][up-instant]')

            Trigger.clickSequence(link, { focus: false })
            expect(followSpy.calls.count()).toBe(1)
            expect(link).not.toHaveOutline()

            Trigger.clickLinkWithKeyboard(link)
            expect(followSpy.calls.count()).toBe(2)
            expect(link).toHaveOutline()
          })

          describe('handling of up.link.config.instantSelectors', function() {

            it('follows matching links without an [up-instant] attribute', async function() {
              this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
              const link = fixture('a[up-follow][href="/foo"].link')
              up.link.config.instantSelectors.push('.link')

              Trigger.mousedown(link)

              await wait()

              expect(this.followSpy).toHaveBeenCalled()
            })

            it('allows individual links to opt out with [up-instant=false]', async function() {
              const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
              const link = fixture('a[up-follow][href="/foo"][up-instant=false].link')
              up.link.config.instantSelectors.push('.link')

              Trigger.mousedown(link)

              await wait()

              expect(followSpy).not.toHaveBeenCalled()
            })

            it('allows to configure exceptions in up.link.config.noInstantSelectors', async function() {
              up.link.config.instantSelectors.push('.include')
              up.link.config.noInstantSelectors.push('.exclude')
              const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
              const link = fixture('a.include.exclude[up-follow][href="/foo"]')

              Trigger.mousedown(link)

              await wait()

              expect(followSpy).not.toHaveBeenCalled()
            })

            it('allows individual links to opt out of all Unpoly link handling with [up-follow=false]', async function() {
              this.followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
              const link = fixture('a[up-follow][href="/foo"][up-follow=false].link')
              up.link.config.instantSelectors.push('.link')

              Trigger.mousedown(link)

              await wait()

              expect(this.followSpy).not.toHaveBeenCalled()
            })
          })
        })
      })


      describe('with [up-preview] modifier', function() {
        it('shows a preview effect while the link is loading', async function() {
          const target = fixture('#target', { text: 'old target' })
          const spinnerContainer = fixture('#other')

          up.preview('my:preview', (preview) => preview.insert(spinnerContainer, '<div id="spinner"></div>'))

          const link = fixture('a[href="/foo"][up-follow][up-target="#target"][up-preview="my:preview"]', { text: 'label' })

          expect(spinnerContainer).not.toHaveSelector('#spinner')

          Trigger.clickSequence(link)
          await wait()

          expect(spinnerContainer).toHaveSelector('#spinner')

          jasmine.respondWithSelector('#target', { text: 'new target' })
          await wait()

          expect(spinnerContainer).not.toHaveSelector('#spinner')
        })
      })

      describe('with [up-placeholder] modifier', function() {

        it('shows a UI placeholder while the link is loading', async function() {
          fixture('#target', { content: '<p>old target</p>' })
          const link = fixture('a[href="/foo"][up-follow][up-target="#target"][up-placeholder="<p>placeholder</p>"]', { text: 'label' })
          expect('#target').toHaveVisibleText('old target')

          Trigger.clickSequence(link)
          await wait()

          expect('#target').toHaveVisibleText('placeholder')

          jasmine.respondWithSelector('#target', { content: '<p>new target</p>' })
          await wait()

          expect('#target').toHaveVisibleText('new target')
        })

        it('does not show a UI placeholder while preloading', async function() {
          const placeholderCompilerFn = jasmine.createSpy('placeholder compiler fn')
          up.compiler('#placeholder', placeholderCompilerFn)

          fixture('#target', { content: '<p>old target</p>' })
          const link = fixture('a[href="/foo"][up-follow][up-target="#target"][up-placeholder="<p id=\'placeholder\'>placeholder</p>"]', { text: 'label' })
          expect('#target').toHaveVisibleText('old target')

          up.link.preload(link)
          await wait()

          expect('#target').toHaveVisibleText('old target')
          expect(placeholderCompilerFn).not.toHaveBeenCalled()
        })

        it('does not show a UI placeholder while revalidating', async function() {
          await jasmine.populateCache('/foo', '<div id="target">expired target</div>')
          up.cache.expire()

          const placeholderCompilerFn = jasmine.createSpy('placeholder compiler fn')
          up.compiler('#placeholder', placeholderCompilerFn)

          fixture('#target', { content: '<p>old target</p>' })
          const link = fixture('a[href="/foo"][up-follow][up-target="#target"][up-placeholder="<p id=\'placeholder\'>placeholder</p>"]', { text: 'label' })
          expect('#target').toHaveVisibleText('old target')

          Trigger.clickSequence(link)
          await wait()

          expect('#target').toHaveVisibleText('expired target')
          expect(placeholderCompilerFn).not.toHaveBeenCalled()
          expect(up.network.isBusy()).toBe(true)

          jasmine.respondWithSelector('#target', { text: 'revalidated target' })
          await wait()

          expect('#target').toHaveVisibleText('revalidated target')
          expect(placeholderCompilerFn).not.toHaveBeenCalled()
          expect(up.network.isBusy()).toBe(false)
        })
      })

      describe('following non-interactive elements with [up-href]', function() {

        it('makes any element behave like an [up-follow] link', async function() {
          const link = fixture('span[up-follow][up-href="/follow-path"][up-target=".target"]')
          up.hello(link)
          fixture('.target', { text: 'old text' })

          Trigger.click(link)
          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')

          jasmine.respondWithSelector('.target', { text: 'new text' })
          await wait()

          expect('.target').toHaveText('new text')
        })

        it('gives the element a pointer cursor', function() {
          const link = fixture('span[up-follow][up-href="/follow-path"][up-target=".target"]')
          up.hello(link)

          expect(link).toHaveCursorStyle('pointer')
        })

        it('gives the element a [role=link] so screen readers announce it as interactive', function() {
          const link = fixture('span[up-follow][up-href="/follow-path"][up-target=".target"]')
          up.hello(link)

          expect(link.role).toBe('link')
        })

        it('enables keyboard interaction for the element', async function() {
          const link = fixture('span[up-follow][up-href="/follow-path"][up-target=".target"]')
          up.hello(link)
          fixture('.target', { text: 'old text' })

          expect(link).toBeKeyboardFocusable()

          Trigger.clickLinkWithKeyboard(link)
          await wait()

          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.target')

          jasmine.respondWithSelector('.target', { text: 'new text' })
          await wait()

          expect('.target').toHaveText('new text')
        })
      })

      describe('[up-href] without [up-follow]', function() {
        if (up.migrate.loaded) {

          it('is made followable', function() {
            const fauxLink = helloFixture('span[up-href="/path"]')
            expect(fauxLink).toBeFollowable()
          })

          it('is keyboard focusable', function() {
            const fauxLink = helloFixture('span[up-href="/path"]')
            expect(fauxLink).toBeKeyboardFocusable()
          })

        } else {

          it('is not followable', function() {
            const fauxLink = helloFixture('span[up-href="/path"]')
            expect(fauxLink).not.toBeFollowable()
          })

          it('gets no pointer cursor', function() {
            const fauxLink = helloFixture('span[up-href="/path"]')
            expect(fauxLink).toHaveCursorStyle('auto')
          })

          it('is not keyboard focusable', function() {
            const fauxLink = helloFixture('span[up-href="/path"]')
            expect(fauxLink).not.toBeKeyboardFocusable()
          })
        }
      })

    })

    if (up.migrate.loaded) {

      describe('[up-dash]', function() {

        it("is a shortcut for [up-preload], [up-instant] and [up-target], using [up-dash]'s value as [up-target]", function() {
          const $link = $fixture('a[href="/path"][up-dash=".target"]').text('label')
          up.hello($link)
          expect($link.attr('up-preload')).toEqual('')
          expect($link.attr('up-instant')).toEqual('')
          expect($link.attr('up-target')).toEqual('.target')
        })

        it('sets [up-follow] instead of [up-target] if no target is given (bugfix)', function() {
          const link = fixture('a[href="/path"][up-dash]', { text: 'label' })
          up.hello(link)

          expect(link).not.toHaveAttribute('up-target')
          expect(link).toHaveAttribute('up-follow')
        })

        it("removes the [up-dash] attribute when it's done", function() {
          const $link = $fixture('a[href="/path"]').text('label')
          up.hello($link)
          expect($link.attr('up-dash')).toBeMissing()
        })
      })
    }

    describe('[up-expand]', function() {

      it('makes the element followable to the same destination as the first contained link', async function() {
        up.fragment.config.mainTargets = ['main']
        fixture('main', { text: 'old text' })
        const area = fixture('div[up-expand] a[href="/path"]')
        up.hello(area)

        expect(area).toBeFollowable()

        Trigger.clickSequence(area)

        await wait()

        expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('main')

        jasmine.respondWithSelector('main', { text: 'new text' })

        await wait()

        expect('main').toHaveText('new text')
      })

      describe('feedback classes', function() {

        it('marks both [up-expand] container and first link as .up-active when the first link is clicked', async function() {
          let [container, link1, link2, target] = htmlFixtureList(`
            <div up-expand>
              <a href="/path1" up-target="#target">link1</a>
              <a href="/path2" up-target="#target">link2</a>
             </div>
             <div id="target">target</div>
          `)
          up.hello(container)

          Trigger.clickSequence(link1)

          expect(link1).toHaveClass('up-active')
          expect(link2).not.toHaveClass('up-active')
          expect(container).toHaveClass('up-active')
          expect(target).toHaveClass('up-loading')
        })

        it('marks both [up-expand] container and first link as .up-active when the container is clicked', async function() {
          let [container, link1, link2, target] = htmlFixtureList(`
            <div up-expand>
              <a href="/path1" up-target="#target">link1</a>
              <a href="/path2" up-target="#target">link2</a>
             </div>
             <div id="target">target</div>
          `)
          up.hello(container)

          Trigger.clickSequence(container)

          expect(link1).toHaveClass('up-active')
          expect(link2).not.toHaveClass('up-active')
          expect(container).toHaveClass('up-active')
          expect(target).toHaveClass('up-loading')
        })

        it('marks the [up-expand] container as active if a child of the link was clicked', async function() {
          let [container, link1, link1Child, link2, target] = htmlFixtureList(`
            <div up-expand>
              <a href="/path1" up-target="#target"><span>link1</span></a>
              <a href="/path2" up-target="#target">link2</a>
             </div>
             <div id="target">target</div>
          `)
          up.hello(container)

          Trigger.clickSequence(link1Child)

          expect(link1).toHaveClass('up-active')
          expect(link2).not.toHaveClass('up-active')
          expect(container).toHaveClass('up-active')
          expect(target).toHaveClass('up-loading')
        })

        it('does not mark an [up-expand] as active if the clicked link is not the first link', async function() {
          let [container, link1, link2, target] = htmlFixtureList(`
            <div up-expand>
              <a href="/path1" up-target="#target">link1</a>
              <a href="/path2" up-target="#target">link2</a>
             </div>
             <div id="target">target</div>
          `)
          up.hello(container)

          Trigger.clickSequence(link2)

          expect(link1).not.toHaveClass('up-active')
          expect(link2).toHaveClass('up-active')
          expect(container).not.toHaveClass('up-active')
          expect(target).toHaveClass('up-loading')
        })

        it('does not mark an [up-expand] as active if the first link is clicked, but is not the expanding link', async function() {
          let [container, link1, link2, target] = htmlFixtureList(`
            <div up-expand="link2">
              <a id="link1" href="/path1" up-target="#target">link1</a>
              <a id="link2" href="/path2" up-target="#target">link2</a>
             </div>
             <div id="target">target</div>
          `)
          up.hello(container)

          Trigger.clickSequence(link1)

          expect(link1).toHaveClass('up-active')
          expect(link2).not.toHaveClass('up-active')
          expect(container).not.toHaveClass('up-active')
          expect(target).toHaveClass('up-loading')
        })

      })

      it('is not keyboard-accessible, as screen readers will already announce the contained link', function() {
        const area = fixture('div[up-expand]')
        const link = e.affix(area, 'a[href="/path1"]')
        up.hello(area)

        expect(area).not.toBeKeyboardFocusable()
        expect(area.role).toBeBlank()
      })

      it('has a pointer cursor for visually abled mouse users', function() {
        const area = fixture('div[up-expand]')
        const link = e.affix(area, 'a[href="/path1"]')
        up.hello(area)

        expect(area).toHaveCursorStyle('pointer')
      })

      it('does not enlarge an area with [up-expand=false]', function() {
        const area = fixture('div[up-expand=false] a[href="/path"]')
        up.hello(area)

        expect(area).not.toBeFollowable()
      })

      it('copies up-related attributes of a contained link', function() {
        const $area = $fixture('div[up-expand] a[href="/path"][up-target="selector"][up-instant][up-preload]')
        up.hello($area)
        expect($area.attr('up-target')).toEqual('selector')
        expect($area.attr('up-instant')).toEqual('')
        expect($area.attr('up-preload')).toEqual('')
      })

//      it 'copies up-related classes of a contained link', ->
//        area = fixture('div[up-expand] a[href="/path"].up-current')
//        up.hello(area)
//        expect(area.attr('up-target')).toEqual('selector')

      it("renames a contained link's [href] attribute to [up-href] so the container is considered a link", function() {
        const $area = $fixture('div[up-expand] a[up-follow][href="/path"]')
        up.hello($area)
        expect($area.attr('up-href')).toEqual('/path')
      })

      it('copies attributes from the first link if there are multiple links', function() {
        const $area = $fixture('div[up-expand]')
        const $link1 = $area.affix('a[href="/path1"]')
        const $link2 = $area.affix('a[href="/path2"]')
        up.hello($area)
        expect($area.attr('up-href')).toEqual('/path1')
      })

      it("copies an contained non-link element with [up-href] attribute", function() {
        const $area = $fixture('div[up-expand] span[up-follow][up-href="/path"]')
        up.hello($area)
        expect($area.attr('up-href')).toEqual('/path')
      })

      it('can be used to enlarge the click area of a link', async function() {
        const $area = $fixture('div[up-expand] a[href="/path"]')
        up.hello($area)
        spyOn(up, 'render').and.returnValue(Promise.resolve())
        Trigger.clickSequence($area)
        await wait()

        expect(up.render).toHaveBeenCalled()
      })

      it('does nothing when the user clicks another link in the expanded area', async function() {
        const $area = $fixture('div[up-expand]')
        const $expandedLink = $area.affix('a[href="/expanded-path"][up-follow]')
        const $otherLink = $area.affix('a[href="/other-path"][up-follow]')
        up.hello($area)
        const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
        Trigger.clickSequence($otherLink)
        await wait()

        expect(followSpy.calls.count()).toEqual(1)
        expect(followSpy.calls.mostRecent().args[0]).toEqual($otherLink[0])
      })

      it('does nothing when the user clicks on an input in the expanded area', async function() {
        const $area = $fixture('div[up-expand]')
        const $expandedLink = $area.affix('a[href="/expanded-path"][up-follow]')
        const $input = $area.affix('input[name=email][type=text]')
        up.hello($area)
        const followSpy = up.link.follow.mock().and.returnValue(Promise.resolve())
        Trigger.clickSequence($input)
        await wait()

        expect(followSpy).not.toHaveBeenCalled()
      })

      it('does not trigger multiple replaces when the user clicks on the expanded area of an [up-instant] link (bugfix)', async function() {
        const $area = $fixture('div[up-expand] a[href="/path"][up-follow][up-instant]')
        up.hello($area)
        spyOn(up, 'render').and.returnValue(Promise.resolve())
        Trigger.clickSequence($area)
        await wait()

        expect(up.render.calls.count()).toEqual(1)
      })

      if (up.migrate.loaded) {
        it('makes the expanded area followable if the expanded link is [up-dash] with a selector (bugfix)', function() {
          const $area = $fixture('div[up-expand] a[href="/path"][up-dash=".element"]')
          up.hello($area)
          expect($area).toBeFollowable()
          expect($area.attr('up-target')).toEqual('.element')
        })

        it('makes the expanded area followable if the expanded link is [up-dash] without a selector (bugfix)', function() {
          const $area = $fixture('div[up-expand] a[href="/path"][up-dash]')
          up.hello($area)
          expect($area).toBeFollowable()
        })
      }

      describe('with a CSS selector in the property value', function() {

        it("expands the contained link that matches the selector", function() {
          const $area = $fixture('div[up-expand=".second"]')
          const $link1 = $area.affix('a.first[href="/path1"]')
          const $link2 = $area.affix('a.second[href="/path2"]')
          up.hello($area)
          expect($area.attr('up-href')).toEqual('/path2')
        })

        it('does nothing if no contained link matches the selector', function() {
          const $area = $fixture('div[up-expand=".foo"]')
          const $link = $area.affix('a[href="/path1"]')
          up.hello($area)
          expect($area.attr('up-href')).toBeUndefined()
        })

        it('does not match an element that is not a descendant', function() {
          const $area = $fixture('div[up-expand=".second"]')
          const $link1 = $area.affix('a.first[href="/path1"]')
          const $link2 = $fixture('a.second[href="/path2"]') // not a child of $area
          up.hello($area)
          expect($area.attr('up-href')).toBeUndefined()
        })

        describe('feedback classes', function() {

          it('marks both [up-expand] container and matched link as .up-active when the container is clicked', async function() {
            let [container, link1, link2, target] = htmlFixtureList(`
              <div up-expand="#link2">
                <a id="link1" href="/path1" up-target="#target">link1</a>
                <a id="link2" href="/path2" up-target="#target">link2</a>
               </div>
               <div id="target">target</div>
            `)
            up.hello(container)

            Trigger.clickSequence(container)

            expect(link1).not.toHaveClass('up-active')
            expect(link2).toHaveClass('up-active')
            expect(container).toHaveClass('up-active')
            expect(target).toHaveClass('up-loading')
          })

          it('marks both [up-expand] container and matched link as .up-active when the link is clicked', async function() {
            let [container, link1, link2, target] = htmlFixtureList(`
              <div up-expand="#link2">
                <a id="link1" href="/path1" up-target="#target">link1</a>
                <a id="link2" href="/path2" up-target="#target">link2</a>
               </div>
               <div id="target">target</div>
            `)
            up.hello(container)

            Trigger.clickSequence(link2)

            expect(link1).not.toHaveClass('up-active')
            expect(link2).toHaveClass('up-active')
            expect(container).toHaveClass('up-active')
            expect(target).toHaveClass('up-loading')
          })

        })
      })
    })

    require('./link_preload_attr_spec')

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

    describe('up:click', function() {

      describe('on a link that is not [up-instant]', function() {

        it('emits an up:click event on click', function() {
          const link = fixture('a[href="/path"]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.click(link)
          expect(listener).toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('does not crash with a synthetic click event that may not have all properties defined (bugfix)', function() {
          const link = fixture('a[href="/path"]', { text: 'label' })
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          const event = new Event('click', { bubbles: true, cancelable: true })
          link.dispatchEvent(event)

          expect(listener).toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('prevents the click event when the up:click event is prevented', function() {
          let clickEvent = null
          const link = fixture('a[href="/path"]')
          link.addEventListener('click', (event) => clickEvent = event)
          link.addEventListener('up:click', (event) => event.preventDefault())
          Trigger.click(link)
          expect(clickEvent.defaultPrevented).toBe(true)
        })

        it('does not emit an up:click event if an element has covered the click coordinates on mousedown, which would cause browsers to create a click event on body', async function() {
          const link = fixture('a[href="/path"]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          link.addEventListener('mousedown', () => up.layer.open({ mode: 'cover', content: 'cover text' }))
          Trigger.mousedown(link)

          await wait()

          expect(up.layer.mode).toBe('cover')
          Trigger.click(link)

          await wait()

          expect(listener).not.toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('emits an up:click event when an element within a popup overlay is clicked with the keyboard', async function() {
          const anchor = fixture('span', { text: 'label' })
          const layer = await up.layer.open({ mode: 'popup', text: 'initial text', origin: anchor })
          const link = layer.affix('a[href="/path"]', { text: 'label' })
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)

          Trigger.clickLinkWithKeyboard(link)

          await wait()

          expect(link).toHaveBeenDefaultFollowed()
          expect(listener).toHaveBeenCalled()
        })

        it('does not emit an up:click event if the right mouse button is used', async function() {
          const link = fixture('a[href="/path"]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.click(link, { button: 2 })

          await wait()

          expect(listener).not.toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('does not emit an up:click event if shift is pressed during the click', async function() {
          const link = fixture('a[href="/path"]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.click(link, { shiftKey: true })

          await wait()

          expect(listener).not.toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('does not emit an up:click event if ctrl is pressed during the click', async function() {
          const link = fixture('a[href="/path"]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.click(link, { ctrlKey: true })

          await wait()

          expect(listener).not.toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('does not emit an up:click event if meta is pressed during the click', async function() {
          const link = fixture('a[href="/path"]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.click(link, { metaKey: true })

          await wait()

          expect(listener).not.toHaveBeenCalled()
          expect(link).toHaveBeenDefaultFollowed()
        })

        it('emits a prevented up:click event if the click was already prevented', function() {
          const link = fixture('a[href="/path"]')
          link.addEventListener('click', (event) => event.preventDefault())
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.click(link)
          expect(listener).toHaveBeenCalled()
          expect(listener.calls.argsFor(0)[0].defaultPrevented).toBe(true)
        })
      })

      describe('on a link that is [up-instant]', function() {

        it('emits an up:click event on mousedown', function() {
          const link = fixture('a[href="/path"][up-instant]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.mousedown(link)
          expect(listener).toHaveBeenCalled()
        })

        it('does not emit an up:click event on click if there was an earlier mousedown event that was default-prevented', function() {
          const link = fixture('a[href="/path"][up-instant]')
          const listener = jasmine.createSpy('up:click listener')
          Trigger.mousedown(link)
          link.addEventListener('up:click', listener)
          Trigger.click(link)
          expect(listener).not.toHaveBeenCalled()
        })

        it('prevents a click event if there was an earlier mousedown event that was converted to an up:click', function() {
          const link = fixture('a[href="/path"][up-instant]')
          const clickListener = jasmine.createSpy('click listener')
          link.addEventListener('click', clickListener)
          Trigger.mousedown(link)
          Trigger.click(link)
          expect(clickListener.calls.argsFor(0)[0].defaultPrevented).toBe(true)
        })

        it('does not emit multiple up:click events in a single click sequence', function() {
          const link = fixture('a[href="/path"][up-instant]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)

          Trigger.clickSequence(link)
          expect(listener.calls.count()).toBe(1)
        })

        it('emits multiple up:click events on multiple click sequences on the same link', function() {
          const link = fixture('a[href="/path"][up-instant]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)

          Trigger.clickSequence(link)
          expect(listener.calls.count()).toBe(1)

          Trigger.clickSequence(link)
          expect(listener.calls.count()).toBe(2)
        })

        it('does emit an up:click event on click if there was an earlier mousedown event that was not default-prevented (happens when the user CTRL+clicks and Unpoly won\'t follow)', function() {
          const link = fixture('a[href="/path"][up-instant]')
          const listener = jasmine.createSpy('up:click listener')
          link.addEventListener('up:click', listener)
          Trigger.mousedown(link)
          Trigger.click(link)
          expect(listener).toHaveBeenCalled()
        })

        it('does emit an up:click event if there was a click without mousedown (happens when a link is activated with the Enter key)', function() {
          const link = fixture('a[href="/path"][up-instant]')
          const listener = jasmine.createSpy('up:click listener').and.callFake((event) => event.preventDefault())
          link.addEventListener('up:click', listener)
          Trigger.click(link)
          expect(listener).toHaveBeenCalled()
        })

        it('prevents the mousedown event when the up:click event is prevented', function() {
          let mousedownEvent = null
          const link = fixture('a[href="/path"][up-instant]')
          link.addEventListener('mousedown', (event) => mousedownEvent = event)
          link.addEventListener('up:click', (event) => event.preventDefault())
          Trigger.mousedown(link)
          expect(mousedownEvent.defaultPrevented).toBe(true)
        })

        describe('on a touch device', function() {

          it('emits up:click on click (not mousedown) as the user may be long-pressing to open the context menu', async function() {
            const link = fixture('a[href="/path"][up-instant]')
            const listener = jasmine.createSpy('up:click listener').and.callFake((event) => event.preventDefault())
            link.addEventListener('up:click', listener)

            Trigger.pointerdown(link)
            Trigger.touchstart(link)

            await wait(100)

            expect(listener.calls.count()).toBe(0)

            Trigger.mousedown(link)
            await wait()
            expect(listener.calls.count()).toBe(0)

            Trigger.click(link)
            await wait()
            expect(listener.calls.count()).toBe(1)
          })

        })

      })

      describe('on a non-interactive element that is not [up-instant]', function() {

        it('emits an up:click event on click', function() {
          const div = fixture('div')
          const listener = jasmine.createSpy('up:click listener')
          div.addEventListener('up:click', listener)
          Trigger.click(div)
          expect(listener).toHaveBeenCalled()
        })

        it('does not emit an up:click event on ANY element if the user has dragged away between mousedown and mouseup', function() {
          const div = fixture('div')
          const other = fixture('div')
          const listener = jasmine.createSpy('up:click listener')
          up.on('up:click', listener)
          Trigger.mousedown(other)
          Trigger.mouseup(div)
          Trigger.click(document.body)
          expect(listener).not.toHaveBeenCalled()
        })

        it('prevents the click event when the up:click event is prevented', function() {
          let clickEvent = null
          const div = fixture('div')
          div.addEventListener('click', (event) => clickEvent = event)
          div.addEventListener('up:click', (event) => event.preventDefault())
          Trigger.click(div)
          expect(clickEvent.defaultPrevented).toBe(true)
        })
      })

      describe('on a non-interactive element that is [up-instant]', function() {

        it('emits an up:click event on mousedown', function() {
          const div = fixture('div[up-instant]')
          const listener = jasmine.createSpy('up:click listener')
          div.addEventListener('up:click', listener)
          Trigger.mousedown(div)
          expect(listener).toHaveBeenCalled()
        })

        describe('on a touch device', function() {

          it("emits up:click on mousedown (not click) as the user can't long-press to open a context menu", async function() {
            const link = fixture('div[up-instant]')
            const listener = jasmine.createSpy('up:click listener')
            link.addEventListener('up:click', listener)

            Trigger.pointerdown(link)
            Trigger.touchstart(link)

            await wait(100)

            expect(listener.calls.count()).toBe(0)

            Trigger.mousedown(link)
            await wait()
            expect(listener.calls.count()).toBe(1)

            Trigger.click(link)
            await wait()
            expect(listener.calls.count()).toBe(1)
          })

        })

      })

      describe('on a button[type=submit]', function() {

        it('emits an up:click event on click', function() {
          const [form, button] = htmlFixtureList(`
            <form>
              <button type="submit">label</button>
            </form>
          `)
          form.addEventListener('submit', (event) => event.preventDefault())
          const buttonListener = jasmine.createSpy('up:click listener')
          button.addEventListener('up:click', buttonListener)

          Trigger.clickSequence(button)

          expect(buttonListener.calls.count()).toBe(1)
        })

        it('does not emit up:click if the button is [disabled]', function() {
          const [form, button] = htmlFixtureList(`
            <form>
              <button type="submit" disabled>label</button>
            </form>
          `)
          form.addEventListener('submit', (event) => event.preventDefault())
          const listener = jasmine.createSpy('up:click listener')
          button.addEventListener('up:click', listener)

          Trigger.clickSequence(button)

          expect(listener.calls.count()).toBe(0)
        })
      })

      describe('on a button[type=button]', function() {

        it('emits an up:click event on click', function() {
          const [form, button] = htmlFixtureList(`
            <form>
              <button type="button">label</button>
            </form>
          `)
          const buttonListener = jasmine.createSpy('up:click listener')
          button.addEventListener('up:click', buttonListener)

          Trigger.clickSequence(button)

          expect(buttonListener.calls.count()).toBe(1)
        })

        it('does not emit up:click if the button is [disabled]', function() {
          const [form, button] = htmlFixtureList(`
            <form>
              <button type="button" disabled>label</button>
            </form>
          `)
          const listener = jasmine.createSpy('up:click listener')
          button.addEventListener('up:click', listener)

          Trigger.clickSequence(button)

          expect(listener.calls.count()).toBe(0)
        })
      })

      describe('on a input[type=submit]', function() {

        it('emits an up:click event on click', function() {
          const [form, button] = htmlFixtureList(`
            <form>
              <input type="submit">label</input>
            </form>
          `)
          form.addEventListener('submit', (event) => event.preventDefault())
          const buttonListener = jasmine.createSpy('up:click listener')
          button.addEventListener('up:click', buttonListener)

          Trigger.clickSequence(button)

          expect(buttonListener.calls.count()).toBe(1)
        })

        it('does not emit up:click if the button is [disabled]', function() {
          const [form, button] = htmlFixtureList(`
            <form>
              <input type="submit" disabled>label</input>
            </form>
          `)
          form.addEventListener('submit', (event) => event.preventDefault())
          const listener = jasmine.createSpy('up:click listener')
          button.addEventListener('up:click', listener)

          Trigger.clickSequence(button)

          expect(listener.calls.count()).toBe(0)
        })
      })
    })

    describe('[up-clickable]', function() {

      it('makes the element emit up:click events on click', async function() {
        const fauxButton = helloFixture('.hyperlink[up-clickable]')
        const clickListener = jasmine.createSpy('up:click listener')
        fauxButton.addEventListener('up:click', clickListener)

        Trigger.clickSequence(fauxButton)

        expect(clickListener.calls.count()).toBe(1)
      })

      it('makes the element emit up:click events on Enter', async function() {
        const fauxButton = helloFixture('.hyperlink[up-clickable]')
        const clickListener = jasmine.createSpy('up:click listener')
        fauxButton.addEventListener('up:click', clickListener)

        Trigger.keySequence(fauxButton, 'Enter')

        expect(clickListener).toHaveBeenCalled()
      })

      it('makes the element focusable for keyboard users', function() {
        const fauxButton = helloFixture('.hyperlink[up-clickable]')

        expect(fauxButton).toBeKeyboardFocusable()
      })

      it('gives the element a pointer cursor if it has [up-follow] and hence looks like a link', function() {
        const fauxButton = helloFixture('.hyperlink[up-clickable][up-follow]')

        expect(getComputedStyle(fauxButton).cursor).toEqual('pointer')
      })

      it('gives the element a pointer cursor if it has [role=link] and hence looks like a link', function() {
        const fauxButton = helloFixture('.hyperlink[up-clickable][role=link]')

        expect(getComputedStyle(fauxButton).cursor).toEqual('pointer')
      })

      it('gives the element a default cursor if it does not look like a link', function() {
        const fauxButton = helloFixture('.hyperlink[up-clickable]')

        expect(getComputedStyle(fauxButton).cursor).toEqual('auto')
      })

      it('makes other selectors clickable via up.link.config.clickableSelectors', function() {
        up.link.config.clickableSelectors.push('.foo')
        const fauxButton = helloFixture('.foo')

        expect(fauxButton).toBeKeyboardFocusable()
        expect(fauxButton).toHaveAttribute('up-clickable')
        expect(fauxButton.role).toBe('button')
      })

      it('does not set clickable-related attributes on a form with an [up-target] attribute (bugfix)', function() {
        const form = fixture('form[method=post][action="/action"][up-target="#target"]')
        up.hello(form)
        expect(form).not.toHaveAttribute('role')
        expect(form).not.toHaveAttribute('up-clickable')
      })

      describe('when applied on a link (which is already interactive)', function() {

        it('does not set a [role] attribute', function() {
          const link = helloFixture('a[href="/path"][up-clickable]', { text: 'label' })
          expect(link).not.toHaveAttribute('role')
        })

        it('does not cause duplicate up:click events when activated with the keyboard', async function() {
          const link = helloFixture('a[href="/path"][up-clickable]', { text: 'label' })
          const listener = jasmine.createSpy('up:click listener').and.callFake((event) => event.preventDefault())
          link.addEventListener('up:click', listener)

          Trigger.clickLinkWithKeyboard(link)

          expect(listener.calls.count()).toBe(1)
        })
      })

      describe('[role] attribute', function() {

        it('sets [role=button] on a non-interactive element', function() {
          const fauxButton = helloFixture('.hyperlink[up-clickable]')
          expect(fauxButton).toHaveAttribute('role', 'button')
        })

        it('does not override an existing [role] attribute', function() {
          const fauxButton = helloFixture('.hyperlink[up-clickable][role="existing-role"]')
          expect(fauxButton).toHaveAttribute('role', 'existing-role')
        })

        it('sets [role=link] for an a:not([href]) element, like a[up-content]', function() {
          const fauxLink = helloFixture('a[up-content="inner"][up-target="#target"]')
          expect(fauxLink).toHaveAttribute('role', 'link')
        })

        it('sets [role=link] for an [up-follow][up-href] element', function() {
          const fauxLink = helloFixture('a[up-follow][up-href="/path"]')
          expect(fauxLink).toHaveAttribute('role', 'link')
        })
      })

      describe('with [up-instant]', function() {
        it('emits up:click on mousedown instead of click', async function() {
          const fauxButton = helloFixture('.hyperlink[up-clickable][up-instant]')
          const clickListener = jasmine.createSpy('up:click listener')
          fauxButton.addEventListener('up:click', clickListener)

          Trigger.mousedown(fauxButton)
          expect(clickListener.calls.count()).toBe(1)

          // No additional up:click is emitted
          Trigger.click(fauxButton)
          expect(clickListener.calls.count()).toBe(1)
        })
      })

      describe('on an element that is already interactive', function() {

        it('does not set attributes on an a[href] element', function() {
          const realLink = helloFixture('a[href="/path"][up-clickable]')
          expect(realLink).not.toHaveAttribute('role')
          expect(realLink).not.toHaveAttribute('tabindex')
        })

        it('does not set attributes on a button element', function() {
          const realButton = helloFixture('button[up-clickable]')
          expect(realButton).not.toHaveAttribute('role')
          expect(realButton).not.toHaveAttribute('tabindex')
        })

        it('does not cause duplicate up:click events when activated with the keyboard', async function() {
          const link = helloFixture('a[href="/path"][up-clickable]', { text: 'label' })
          const listener = jasmine.createSpy('up:click listener').and.callFake((event) => event.preventDefault())
          link.addEventListener('up:click', listener)

          Trigger.clickLinkWithKeyboard(link)

          expect(listener.calls.count()).toBe(1)
        })
      })
    })

    describe('a[up-disable]', function() {

      describe('without an attribute value', function() {
        it('disables fields of an enclosing form', async function() {
          fixture('#target', { text: 'old text' })
          const form = fixture('form#form')
          const input = e.affix(form, 'input[type=next][name=foo]')
          const link = e.affix(form, 'a[href="/path"][up-target="#target"][up-disable]', { text: 'label' })

          Trigger.clickSequence(link)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(input).toBeDisabled()
        })
      })

      describe('with a selector value', function() {

        it('disables fields and buttons within the given selector', async function() {
          fixture('#target', { text: 'old text' })
          const form = fixture('form#form')
          const input = e.affix(form, 'input[type=next][name=foo]')
          const button = e.affix(form, 'button[type=submit]', { text: 'button label' })
          const link = fixture('a[href="/path"][up-target="#target"][up-disable="#form"]', { text: 'label' })

          Trigger.clickSequence(link)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(input).toBeDisabled()
          expect(button).toBeDisabled()

          jasmine.respondWithSelector('#target', { text: 'new text' })
          await wait()

          expect('#target').toHaveText('new text')
          expect(input).not.toBeDisabled()
          expect(button).not.toBeDisabled()
        })

        it('does not disable controls when preloading', async function() {
          fixture('#target', { text: 'old text' })
          const form = fixture('form#form')
          const input = e.affix(form, 'input[type=next][name=foo]')
          const button = e.affix(form, 'button[type=submit]', { text: 'button label' })
          const link = fixture('a[href="/path"][up-target="#target"][up-disable="#form"]', { text: 'label' })

          up.link.preload(link)
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(input).not.toBeDisabled()
          expect(button).not.toBeDisabled()
        })

        it('does not disable controls when revalidating', async function() {
          await jasmine.populateCache('/path', `
            <div id="target">expired target</div>
          `)
          up.cache.expire()

          fixture('#target', { text: 'old target' })
          const form = fixture('form#form')
          const input = e.affix(form, 'input[type=next][name=foo]')
          const button = e.affix(form, 'button[type=submit]', { text: 'button label' })
          const link = fixture('a[href="/path"][up-target="#target"][up-disable="#form"]', { text: 'label' })

          Trigger.clickSequence(link)
          await wait()

          expect('#target').toHaveText('expired target')
          expect(up.network.isBusy()).toBe(true)
          expect(input).not.toBeDisabled()
          expect(button).not.toBeDisabled()

          jasmine.respondWithSelector('#target', { text: 'revalidated target' })
          await wait()
          expect('#target').toHaveText('revalidated target')
        })
      })
    })
  })
})

