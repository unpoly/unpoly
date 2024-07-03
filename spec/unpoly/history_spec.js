const u = up.util
const e = up.element
const $ = jQuery

describe('up.history', function() {

  beforeEach(() => {
    up.history.config.enabled = true
  })

  describe('JavaScript functions', function() {

    describe('up.history.push()', () => {
      it('emits an up:location:changed event with a string { location } property (issue #490)', function() {
        const listener = jasmine.createSpy('event listener')
        up.on('up:location:changed', listener)

        up.history.push('/new-location')

        expect(listener).toHaveBeenCalled()
        expect(listener.calls.mostRecent().args[0].location).toEqual(jasmine.any(String))
        expect(listener.calls.mostRecent().args[0].location).toMatchURL('/new-location')
      })
    })

    describe('up.history.replace', () => {
      it('should have tests')
    })

    describe('up.history.location', function() {

      it('returns the current browser location', () => expect(up.history.location).toMatchURL(location.href))

      it('does not strip a trailing slash from the current URL', function() {
        history.replaceState?.({}, 'title', '/host/path/')
        expect(up.history.location).toMatchURL('/host/path/')
      })
    })

    describe('up.history.isLocation()', function() {

      it('returns true if the given path is the current URL', function() {
        history.replaceState?.({}, 'title', '/host/path/')
        expect(up.history.isLocation('/host/path/')).toBe(true)
      })

      it('returns false if the given path is not the current URL', function() {
        history.replaceState?.({}, 'title', '/host/path/')
        expect(up.history.isLocation('/host/other-path/')).toBe(false)
      })

      it('returns true if the given full URL is the current URL', function() {
        history.replaceState?.({}, 'title', '/host/path/')
        expect(up.history.isLocation(`http://${location.host}/host/path/`)).toBe(true)
      })

      it('returns true if the given path is the current URL, but without a trailing slash', function() {
        history.replaceState?.({}, 'title', '/host/path/')
        expect(up.history.isLocation('/host/path')).toBe(true)
      })

      it('returns true if the given path is the current URL, but with a trailing slash', function() {
        history.replaceState?.({}, 'title', '/host/path')
        expect(up.history.isLocation('/host/path/')).toBe(true)
      })

      describe('when either URL contains a #hash', function() {

        it('returns false if the given path is the current URL with a #hash', function() {
          history.replaceState?.({}, 'title', '/host/path/')
          expect(up.history.isLocation('/host/path/#hash')).toBe(false)
        })

        it('returns false if the given path is the current URL without a #hash', function() {
          history.replaceState?.({}, 'title', '/host/path/#hash')
          expect(up.history.isLocation('/host/path/')).toBe(false)
        })

        describe('with { hash: false }', function() {

          it('returns true if the given path is the current URL with a #hash', function() {
            history.replaceState?.({}, 'title', '/host/path/')
            expect(up.history.isLocation('/host/path/#hash', {hash: false})).toBe(true)
          })

          it('returns true if the given path is the current URL without a #hash', function() {
            history.replaceState?.({}, 'title', '/host/path/#hash')
            expect(up.history.isLocation('/host/path/', {hash: false})).toBe(true)
          })
        })
      })
    })

    describe('up.history.previousLocation', function() {

      it('returns the previous location', function() {
        const initialLocation = location.href
        expect(up.history.previousLocation).toBeMissing()

        up.history.replace('/location2')
        expect(up.history.previousLocation).toMatchURL(initialLocation)

        up.history.replace('/location3')
        expect(up.history.previousLocation).toMatchURL('/location2')
      })

      it('returns the previous location with a #hash', function() {
        const initialLocation = location.href
        expect(up.history.previousLocation).toBeMissing()

        up.history.replace('/location2#hash')
        expect(up.history.previousLocation).toMatchURL(initialLocation)

        up.history.replace('/location3')
        expect(up.history.previousLocation).toMatchURL('/location2#hash')

        console.log(1)
      })

      it('returns the last previous location that is different from the current URL', function() {
        const initialLocation = location.href
        up.history.replace('/double-replaced-location')
        up.history.replace('/double-replaced-location')
        expect(up.history.previousLocation).toMatchURL(initialLocation)
      })
    })

    describe('up.history.findMetaTags()', function() {

      it('finds a meta[name=description]', function() {
        const head = document.createElement('head')
        const meta = e.affix(head, 'meta[name="description"][content="content"]')
        expect(up.history.findMetaTags(head)).toEqual([meta])
      })

      it('finds a link[rel=alternate]', function() {
        const head = document.createElement('head')
        const link = e.affix(head, 'link[rel="alternate"][type="application/rss+xml"][title="RSS Feed"][href="/feed"]')
        expect(up.history.findMetaTags(head)).toEqual([link])
      })

      it('finds a link[rel=canonical]', function() {
        const head = document.createElement('head')
        const link = e.affix(head, 'link[rel="canonical"][href="/home"]')
        expect(up.history.findMetaTags(head)).toEqual([link])
      })

      it('finds a link[rel=icon]', function() {
        const head = document.createElement('head')
        const link = e.affix(head, 'link[rel="icon"][href="/favicon.png"]')
        expect(up.history.findMetaTags(head)).toEqual([link])
      })

      it('does not find a link[rel=stylesheet]', function() {
        const head = document.createElement('head')
        const link = e.affix(head, 'link[rel="stylesheet"][href="/styles.css"]')
        expect(up.history.findMetaTags(head)).toEqual([])
      })

      it('finds an arbitrary element with [up-meta]', function() {
        const head = document.createElement('head')
        const base = e.affix(head, 'base[href="/pages"]')
        expect(up.history.findMetaTags(head)).toEqual([])

        base.setAttribute('up-meta', '')
        expect(up.history.findMetaTags(head)).toEqual([base])
      })

      it('does not find a meta[http-equiv]', function() {
        const head = document.createElement('head')
        const meta = e.affix(head, 'meta[http-equiv="content-type"][content="text/html; charset=UTF-8"]')
        expect(up.history.findMetaTags(head)).toEqual([])
      })

      it('allows to opt out with [up-meta=false]', function() {
        const head = document.createElement('head')
        const meta = e.affix(head, 'meta[name="description"][content="content"][up-meta="false"]')
        expect(up.history.findMetaTags(head)).toEqual([])
      })

      it('allows to opt out by configuring up.history.config.noMetaTagSelectors', function() {
        const head = document.createElement('head')
        up.history.config.noMetaTagSelectors.push('meta[name="excluded"]')
        const meta = e.affix(head, 'meta[name="excluded"][content="content"]')
        expect(up.history.findMetaTags(head)).toEqual([])
      })

      it('does not match a meta[name=csp-nonce] so we do not invalidate existing nonced callbacks', function() {
        const head = document.createElement('head')
        const meta = e.affix(head, 'meta[name="csp-nonce"][conce="nonce-123"]')
        expect(up.history.findMetaTags(head)).toEqual([])
      })

      it('does not find a script[src]', function() {
        const head = document.createElement('head')
        const meta = e.affix(head, 'script[src="/foo.js"]')
        expect(up.history.findMetaTags(head)).toEqual([])
      })

      it('finds a script[type="application/ld+json"]', function() {
        const head = document.createElement('head')
        const script = e.affix(head, 'script[type="application/ld+json"]', { text: `
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
        ` })
        expect(up.history.findMetaTags(head)).toEqual([script])
      })
    })
  })

  describe('unobtrusive behavior', function() {

    describe('back button', function() {

      it('emits up:location:changed events as the user goes forwards and backwards through history', asyncSpec(function(next) {
        up.history.config.restoreTargets = ['.viewport']

        fixture('.viewport .content')
        const respond = () => {
          this.respondWith(`
            <div class="viewport">
              <div class="content">content</div>
            </div>
          `)
        }

        const normalize = up.util.normalizeURL

        const events = []
        up.on('up:location:changed', event => events.push([event.reason, normalize(event.location)]))

        up.navigate('.content', {url: '/foo', history: true})

        const tolerance = 150

        next(() => {
          respond()
        })

        next(() => {
          expect(events).toEqual([
            ['push', normalize('/foo')]
          ])

          up.navigate('.content', {url: '/bar', history: true})
        })

        next(() => {
          respond()
        })

        next(() => {
          expect(events).toEqual([
            ['push', normalize('/foo')],
            ['push', normalize('/bar')]
          ])

          up.navigate('.content', {url: '/baz', history: true})
        })

        next(() => {
          respond()
        })

        next(() => {
          expect(events).toEqual([
            ['push', normalize('/foo')],
            ['push', normalize('/bar')],
            ['push', normalize('/baz')]
          ])

          history.back()
        })

        next.after(tolerance, () => {
          expect(events).toEqual([
            ['push', normalize('/foo')],
            ['push', normalize('/bar')],
            ['push', normalize('/baz')],
            ['pop', normalize('/bar')]
          ])

          history.back()
        })

        next.after(150, () => {
          expect(events).toEqual([
            ['push', normalize('/foo')],
            ['push', normalize('/bar')],
            ['push', normalize('/baz')],
            ['pop', normalize('/bar')],
            ['pop', normalize('/foo')]
          ])

          history.forward()
        })

        next.after(150, () => {
          expect(events).toEqual([
            ['push', normalize('/foo')],
            ['push', normalize('/bar')],
            ['push', normalize('/baz')],
            ['pop', normalize('/bar')],
            ['pop', normalize('/foo')],
            ['pop', normalize('/bar')]
          ])

          history.forward()
        })

        next.after(150, () => {
          expect(events).toEqual([
            ['push', normalize('/foo')],
            ['push', normalize('/bar')],
            ['push', normalize('/baz')],
            ['pop', normalize('/bar')],
            ['pop', normalize('/foo')],
            ['pop', normalize('/bar')],
            ['pop', normalize('/baz')]
          ])
        })
      })
      )

      it('emits an up:location:changed event with a string { location } property (issue #490)', async function() {
        const waitForBrowser = 100
        // fixture('.content')
        // up.history.config.restoreTargets = ['.content']
        up.history.push('/page1')
        await wait(waitForBrowser)
        up.history.push('/page2')
        await wait(waitForBrowser)

        const listener = jasmine.createSpy('event listener')
        up.on('up:location:changed', listener)

        history.back()
        await wait(waitForBrowser)

        expect(listener).toHaveBeenCalled()
        expect(listener.calls.mostRecent().args[0].location).toEqual(jasmine.any(String))
        expect(listener.calls.mostRecent().args[0].location).toMatchURL('/page1')
      })

      it('calls destructor functions when destroying compiled elements (bugfix)', asyncSpec(function(next) {
        const waitForBrowser = 100

        // By default, up.history will replace the <body> tag when
        // the user presses the back-button. We reconfigure this
        // so we don't lose the Jasmine runner interface.
        up.history.config.restoreTargets = ['.container']

        const constructorSpy = jasmine.createSpy('constructor')
        const destructorSpy = jasmine.createSpy('destructor')

        up.compiler('.example', function(example) {
          constructorSpy()
          return destructorSpy
        })

        up.history.push('/one')
        up.history.push('/two')

        const $container = $fixture('.container')
        const $example = $container.affix('.example')
        up.hello($example)

        expect(constructorSpy).toHaveBeenCalled()

        history.back()

        next.after(waitForBrowser, () => {
          expect(location.pathname).toEqual('/one')
          this.respondWith("<div class='container'>restored container text</div>")
        })

        next(() => {
          expect(destructorSpy).toHaveBeenCalled()
        })
      })
      )

      describe('up:location:restore event', function() {

        it('emits an up:location:restore event that users can prevent and substitute their own restoration logic', asyncSpec(function(next) {
          const waitForBrowser = 100
          const main = fixture('main#main', {text: 'original content'})
          up.history.config.restoreTargets = [':main']
          const restoreListener = jasmine.createSpy('up:location:restore listener').and.callFake(() => main.innerText = 'manually restored content')
          up.on('up:location:restore', restoreListener)

          up.history.push("/page1")

          next(() => up.history.push("/page2"))

          next(function() {
            expect(up.history.location).toMatchURL('/page2')
            expect(restoreListener).not.toHaveBeenCalled()

            history.back()
          })

          next.after(waitForBrowser, function() {
            expect(up.history.location).toMatchURL('/page1')
            expect(restoreListener).toHaveBeenCalled()

            expect(main).toHaveText('manually restored content')
          })
        })
        )

        it('lets users mutate event.renderOptions to customize the restoration pass', async function() {
          const waitForBrowser = 100
          fixture('#main', {text: 'original main'})
          fixture('#other', {text: 'original other'})
          up.history.config.restoreTargets = ['#main']
          const restoreListener = jasmine.createSpy('up:location:restore listener').and.callFake(event => event.renderOptions.target = '#other')

          up.on('up:location:restore', restoreListener)

          up.history.push("/page1")

          await wait()

          up.history.push("/page2")

          await wait()

          expect(up.history.location).toMatchURL('/page2')
          expect(restoreListener).not.toHaveBeenCalled()

          history.back()

          await wait(waitForBrowser)

          expect(up.history.location).toMatchURL('/page1')
          expect(restoreListener).toHaveBeenCalled()

          await wait()

          jasmine.respondWith(`
            <div id='container'>
              <div id='main'>restored main</div>
              <div id='other'>restored other</div>
            </div>
          `)
          await wait()

          expect('#main').toHaveText('original main')
          expect('#other').toHaveText('restored other')
        })
      })


      describe('caching', function() {

        it('restores a page from cache', async function() {
          const waitForBrowser = 100
          fixture('main', {text: 'original content'})
          up.history.config.restoreTargets = [':main']

          up.navigate({ target: 'main', url: '/path1' })
          await wait()
          jasmine.respondWithSelector('main', {text: 'path1 content'})
          await wait()

          expect(up.history.location).toMatchURL('/path1')
          expect('main').toHaveText('path1 content')

          up.navigate({ target: 'main', url: '/path2' })
          await wait()
          jasmine.respondWithSelector('main', {text: 'path2 content'})
          await wait()

          expect(up.history.location).toMatchURL('/path2')
          expect('main').toHaveText('path2 content')

          history.back()
          await wait(waitForBrowser)

          // History was restored
          expect(up.history.location).toMatchURL('/path1')
          expect('main').toHaveText('path1 content')
          // No additional request was made
          expect(jasmine.Ajax.requests.count()).toBe(2)
        })

        it('revalidates expired cache entries after restoration', async function() {
          const waitForBrowser = 100
          up.network.config.cacheExpireAge = 1
          fixture('main', {text: 'original content'})
          up.history.config.restoreTargets = [':main']

          up.navigate({ target: 'main', url: '/path1' })
          await wait()
          expect(jasmine.Ajax.requests.count()).toBe(1)

          jasmine.respondWithSelector('main', {text: 'path1 content'})
          await wait()

          expect(up.history.location).toMatchURL('/path1')
          expect('main').toHaveText('path1 content')

          up.navigate({ target: 'main', url: '/path2' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)

          jasmine.respondWithSelector('main', {text: 'path2 content'})
          await wait()

          expect(up.history.location).toMatchURL('/path2')
          expect('main').toHaveText('path2 content')

          history.back()
          await wait(waitForBrowser)

          // History was restored
          expect(up.history.location).toMatchURL('/path1')
          expect('main').toHaveText('path1 content')
          // No additional request was made
          expect(jasmine.Ajax.requests.count()).toBe(3)

          jasmine.respondWithSelector('main', {text: 'revalidated path1 content'})
          await wait()

          expect(up.history.location).toMatchURL('/path1')
          expect('main').toHaveText('revalidated path1 content')
          // No additional request was made
          expect(jasmine.Ajax.requests.count()).toBe(3)
        })
      })


      describe('focus restoration', () => {
        it('restores element focus when the user hits the back button', asyncSpec(function(next) {
            const waitForBrowser = 100
            up.fragment.config.mainTargets = ['main']
            up.history.config.restoreTargets = [':main']
            const main = fixture('main')
            const link = e.affix(main, 'a[href="/focus-path2"][up-follow]', {text: 'link label'})

            up.history.replace('/focus-path1')

            next(() => Trigger.clickSequence(link))

            next(function() {
              expect(link).toBeFocused()
              expect(jasmine.Ajax.requests.count()).toBe(1)

              jasmine.respondWithSelector('main', {text: 'new text'})
            })

            next(function() {
              expect('main').toHaveText('new text')
              expect('main').toBeFocused()

              history.back()
            })

            next.after(waitForBrowser, () => expect(jasmine.Ajax.requests.count()).toBe(2))

            next(() => jasmine.respondWithSelector('main a[href="/focus-path2"]'))

            next(function() {
              expect(document).toHaveSelector('main a[href="/focus-path2"]')
              expect('a[href="/focus-path2"]').toBeFocused()
            })
          })
        )
      })

      describe('scroll restoration', function() {

        afterEach(() => {
          $('.viewport').remove()
        })

        it('restores the scroll position of viewports when the user hits the back button', asyncSpec(function(next) {
          const longContentHTML = `
            <div class="viewport" style="width: 100px; height: 100px; overflow-y: scroll">
              <div class="content" style="height: 1000px"></div>
            </div>\
          `

          const respond = () => this.respondWith(longContentHTML)

          const $viewport = $(longContentHTML).appendTo(document.body)

          const waitForBrowser = 100

          up.viewport.config.viewportSelectors = ['.viewport']
          up.history.config.restoreTargets = ['.viewport']

          up.history.replace('/scroll-restauration-spec')

          up.navigate('.content', {url: '/test-one', history: true})

          next.after(waitForBrowser, () => {
            respond()
          })

          next.after(waitForBrowser, () => {
            expect(location.href).toMatchURL('/test-one')
            $viewport.scrollTop(50)
            up.navigate('.content', {url: '/test-two', history: true})
          })

          next.after(waitForBrowser, () => {
            respond()
          })

          next.after(waitForBrowser, () => {
            expect(location.href).toMatchURL('/test-two')
            $('.viewport').scrollTop(150)
            up.navigate('.content', {url: '/test-three', history: true})
          })

          next.after(waitForBrowser, () => {
            respond()
          })

          next.after(waitForBrowser, () => {
            expect(location.href).toMatchURL('/test-three')
            $('.viewport').scrollTop(250)
            history.back()
          })

          next.after(waitForBrowser, () => {
            expect(location.href).toMatchURL('/test-two')
            expect($('.viewport').scrollTop()).toBe(150)
            history.back()
          })

          next.after(waitForBrowser, () => {
            expect(location.href).toMatchURL('/test-one') // cannot delay the browser from restoring the URL on pop
            expect($('.viewport').scrollTop()).toBe(50)
            history.forward()
          })

          next.after(waitForBrowser, () => {
            expect(location.href).toMatchURL('/test-two')
            expect($('.viewport').scrollTop()).toBe(150)
            history.forward()
          })

          next.after(waitForBrowser, () => {
            expect(location.href).toMatchURL('/test-three') // cannot delay the browser from restoring the URL on pop
            expect($('.viewport').scrollTop()).toBe(250)
          })
        })
        )

        it('resets the scroll position of no earlier scroll position is known', asyncSpec(function(next) {
          const longContentHTML = `
            <div class="viewport" style="width: 100px; height: 100px; overflow-y: scroll">
              <div class="content" style="height: 1000px">text</div>
            </div>
          `

          const respond = () => jasmine.respondWith(longContentHTML)

          const $viewport = $(longContentHTML).appendTo(document.body)

          const waitForBrowser = 100

          up.viewport.config.viewportSelectors = ['.viewport']
          up.history.config.restoreTargets = ['.viewport']

          up.history.replace('/restore-path1')

          up.navigate('.content', {url: '/restore-path2', history: true})

          next(() => {
            respond()
          })

          next(function() {
            expect(location.href).toMatchURL('/restore-path2')
            $('.viewport').scrollTop(50)

            // Emulate a cache miss
            up.layer.root.lastScrollTops.clear()

            history.back()
          })

          next.after(waitForBrowser, () => respond())

          next(function() {
            expect(location.href).toMatchURL('/restore-path1')
            expect($('.viewport').scrollTop()).toBe(0)
          })
        })
        )

        it('restores the scroll position of two viewports marked with [up-viewport], but not configured in up.viewport.config (bugfix)', asyncSpec(function(next) {
          up.history.config.restoreTargets = ['.container']

          const html = `
            <div class="container">
              <div class="viewport1" up-viewport style="width: 100px; height: 100px; overflow-y: scroll">
                <div class="content1" style="height: 5000px">content1</div>
              </div>
              <div class="viewport2" up-viewport style="width: 100px; height: 100px; overflow-y: scroll">
                <div class="content2" style="height: 5000px">content2</div>
              </div>
            </div>
          `

          const respond = () => this.respondWith(html)

          const $screen = $fixture('.screen')
          $screen.html(html)

          up.navigate('.content1, .content2', {url: '/one', reveal: false, history: true})

          next(() => {
            respond()
          })

          next(() => {
            $('.viewport1').scrollTop(3000)
            $('.viewport2').scrollTop(3050)
            expect('.viewport1').toBeScrolledTo(3000)
            expect('.viewport2').toBeScrolledTo(3050)

            up.navigate('.content1, .content2', {url: '/two', reveal: false, history: true})
          })

          next(() => {
            respond()
          })

          next.after(50, () => {
            expect(location.href).toMatchURL('/two')
            history.back()
          })

          next.after(50, () => {
            expect('.viewport1').toBeScrolledTo(3000)
            expect('.viewport2').toBeScrolledTo(3050)
          })
        })
        )
      })
    })


    describe('[up-back]', function() {

      it('sets an [up-href] attribute to the previous URL and sets the up-scroll attribute to "restore"', function() {
        up.history.push('/path1')
        up.history.push('/path2')
        const element = up.hello(fixture('a[href="/path3"][up-back]', {text: 'text'}))
        expect(element.getAttribute('href')).toMatchURL('/path3')
        expect(element.getAttribute('up-href')).toMatchURL('/path1')
        expect(element.getAttribute('up-scroll')).toBe('restore')
        expect(element).toBeFollowable()
      })

      it('does not overwrite an existing up-href or up-restore-scroll attribute')

      it('does not set an up-href attribute if there is no previous URL')
    })
  })
})

