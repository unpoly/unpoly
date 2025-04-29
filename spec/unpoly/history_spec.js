const u = up.util
const e = up.element
const $ = jQuery

describe('up.history', function() {

  beforeEach(() => {
    up.history.config.enabled = true
  })

  describe('JavaScript functions', function() {

    describe('up.history.push()', () => {
      it('should have tests')
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
            expect(up.history.isLocation('/host/path/#hash', { hash: false })).toBe(true)
          })

          it('returns true if the given path is the current URL without a #hash', function() {
            history.replaceState?.({}, 'title', '/host/path/#hash')
            expect(up.history.isLocation('/host/path/', { hash: false })).toBe(true)
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
        const meta = e.affix(head, 'script[src="/foo.js"][nonce="specs-nonce"]')
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

    describe('navigating history with back and forward buttons', function() {

      it('loads locations when the navigation changes the path', async function() {
        const waitForBrowser = 100

        up.network.config.autoCache = false
        up.history.config.restoreTargets = ['main']

        let [nav, link1, link2, link3, target] = htmlFixtureList(`
          <nav>
            <a href="/path1" up-follow>path1</a>
            <a href="/path2" up-follow>path2</a>
            <a href="/path3" up-follow>path3</a>
          </nav>
          <main>
            initial text
          </main>
        `)

        expect('main').toHaveText('initial text')

        Trigger.clickSequence(link1)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path1')
        jasmine.respondWith('<main>path1 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path1')
        expect('main').toHaveText('path1 text')

        Trigger.clickSequence(link2)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith('<main>path2 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path2')
        expect('main').toHaveText('path2 text')

        Trigger.clickSequence(link3)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(3)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path3')
        jasmine.respondWith('<main>path3 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path3')
        expect('main').toHaveText('path3 text')

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(4)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith('<main>path2 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path2')
        expect('main').toHaveText('path2 text')

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(5)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path1')
        jasmine.respondWith('<main>path1 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path1')
        expect('main').toHaveText('path1 text')

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(6)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith('<main>path2 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path2')
        expect('main').toHaveText('path2 text')

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(7)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path3')
        jasmine.respondWith('<main>path3 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path3')
        expect('main').toHaveText('path3 text')

        expect(up.network.isBusy()).toBe(false)
      })

      it('loads locations when the navigation changes the query string', async function() {
        const waitForBrowser = 100

        up.network.config.autoCache = false
        up.history.config.restoreTargets = ['main']

        let [nav, link1, link2, link3, target] = htmlFixtureList(`
          <nav>
            <a href="/path?query=1" up-follow>path1</a>
            <a href="/path?query=2" up-follow>path2</a>
            <a href="/path?query=3" up-follow>path3</a>
          </nav>
          <main>
            initial text
          </main>
        `)

        expect('main').toHaveText('initial text')

        Trigger.clickSequence(link1)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=1')
        jasmine.respondWith('<main>path1 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path?query=1')
        expect('main').toHaveText('path1 text')

        Trigger.clickSequence(link2)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=2')
        jasmine.respondWith('<main>path2 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path?query=2')
        expect('main').toHaveText('path2 text')

        Trigger.clickSequence(link3)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(3)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=3')
        jasmine.respondWith('<main>path3 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path?query=3')
        expect('main').toHaveText('path3 text')
        expect(up.network.isBusy()).toBe(false)

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(4)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=2')
        jasmine.respondWith('<main>path2 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path?query=2')
        expect('main').toHaveText('path2 text')

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(5)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=1')
        jasmine.respondWith('<main>path1 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path?query=1')
        expect('main').toHaveText('path1 text')

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(6)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=2')
        jasmine.respondWith('<main>path2 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path?query=2')
        expect('main').toHaveText('path2 text')

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(7)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=3')
        jasmine.respondWith('<main>path3 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path?query=3')
        expect('main').toHaveText('path3 text')

        expect(up.network.isBusy()).toBe(false)
      })

      it('loads locations when the navigation changes both path and hash', async function() {
        const waitForBrowser = 100

        up.network.config.autoCache = false
        up.history.config.restoreTargets = ['main']
        up.viewport.config.revealSnap = 0

        let [nav, link1, link2a, link2b, link3, viewport, target] = htmlFixtureList(`
          <nav>
            <a href="/path1" up-follow>path1</a>
            <a href="/path2#a" up-follow>path2#a</a>
            <a href="/path2#b" up-follow>path2#b</a>
            <a href="/path3" up-follow>path3</a>
          </nav>
          <div id="viewport" up-viewport style="height: 200px; overflow-y: scroll; background-color: yellow;">
            <main>
              initial text
            </main>
          </div>
        `)

        let path1Text = `
          <main>
            path1 text
          </main>
        `

        let path2Text = `
          <main>
            <div style="height: 300px">before</div>
            <div id="a" style="height: 50px; background-color: green">
              path2#a text
            </div>
            <div style="height: 300px">between</div>
            <div id="b" style="height: 50px; background-color: blue">
              path2#b text
            </div>
            <div style="height: 300px">below</div>
          </main>
        `

        let path3Text = `
          <main>
            path3 text
          </main>
        `

        expect('main').toHaveText('initial text')

        Trigger.clickSequence(link1)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path1')
        jasmine.respondWith(path1Text)
        await wait()
        expect(location.href).toMatchURL('/path1')
        expect('main').toHaveText('path1 text')
        expect(viewport.scrollTop).toBe(0)

        Trigger.clickSequence(link2a)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith(path2Text)
        await wait()
        expect(location.href).toMatchURL('/path2#a')
        expect('main #a').toHaveText('path2#a text')

        expect(viewport.scrollTop).toBe(300) // revealing a hash always aligns with top

        Trigger.clickSequence(link2b)
        await wait()
        expect(up.network.isBusy()).toBe(false)
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(viewport.scrollTop).toBe(300 + 50 + 300)
        expect(location.href).toMatchURL('/path2#b')

        Trigger.clickSequence(link3)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(3)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path3')
        jasmine.respondWith(path3Text)
        await wait()
        expect(location.href).toMatchURL('/path3')
        expect('main').toHaveText('path3 text')
        expect(viewport.scrollTop).toBe(0)

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(4)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith(path2Text)
        await wait()
        expect(location.href).toMatchURL('/path2#b')
        expect('main #b').toHaveText('path2#b text')
        expect(viewport.scrollTop).toBe(300 + 50 + 300)

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(4)
        expect(up.network.isBusy()).toBe(false)
        expect(location.href).toMatchURL('/path2#a')
        expect(viewport.scrollTop).toBe(300)

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(5)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path1')
        jasmine.respondWith(path1Text)
        await wait()
        expect(location.href).toMatchURL('/path1')
        expect('main').toHaveText('path1 text')
        expect(viewport.scrollTop).toBe(0)

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(6)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith(path2Text)
        await wait()
        expect(location.href).toMatchURL('/path2#a')
        expect('main #a').toHaveText('path2#a text')
        expect(viewport.scrollTop).toBe(300)

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(6)
        expect(up.network.isBusy()).toBe(false)
        expect(location.href).toMatchURL('/path2#b')
        expect('main #b').toHaveText('path2#b text')
        expect(viewport.scrollTop).toBe(300 + 50 + 300)

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(7)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path3')
        jasmine.respondWith(path3Text)
        await wait()
        expect(location.href).toMatchURL('/path3')
        expect('main').toHaveText('path3 text')
        expect(viewport.scrollTop).toBe(0)

        expect(up.network.isBusy()).toBe(false)
      })

      it('loads locations when the navigation changes both query string and hash', async function() {
        const waitForBrowser = 100

        up.network.config.autoCache = false
        up.history.config.restoreTargets = ['main']
        up.viewport.config.revealSnap = 0

        let [nav, link1, link2a, link2b, link3, viewport, target] = htmlFixtureList(`
          <nav>
            <a href="/path" up-follow>path1</a>
            <a href="/path?query=2#a" up-follow>path2#a</a>
            <a href="/path?query=2#b" up-follow>path2#b</a>
            <a href="/path?query=3" up-follow>path3</a>
          </nav>
          <div id="viewport" up-viewport style="height: 200px; overflow-y: scroll; background-color: yellow;">
            <main>
              initial text
            </main>
          </div>
        `)

        let path1Text = `
          <main>
            path1 text
          </main>
        `

        let path2Text = `
          <main>
            <div style="height: 300px">before</div>
            <div id="a" style="height: 50px; background-color: green">
              path2#a text
            </div>
            <div style="height: 300px">between</div>
            <div id="b" style="height: 50px; background-color: blue">
              path2#b text
            </div>
            <div style="height: 300px">below</div>
          </main>
        `

        let path3Text = `
          <main>
            path3 text
          </main>
        `

        expect('main').toHaveText('initial text')

        Trigger.clickSequence(link1)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path')
        jasmine.respondWith(path1Text)
        await wait()
        expect(location.href).toMatchURL('/path')
        expect('main').toHaveText('path1 text')
        expect(viewport.scrollTop).toBe(0)

        Trigger.clickSequence(link2a)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=2')
        jasmine.respondWith(path2Text)
        await wait()
        expect(location.href).toMatchURL('/path?query=2#a')
        expect('main #a').toHaveText('path2#a text')

        expect(viewport.scrollTop).toBe(300) // revealing a hash always aligns with top

        Trigger.clickSequence(link2b)
        await wait()
        expect(up.network.isBusy()).toBe(false)
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(viewport.scrollTop).toBe(300 + 50 + 300)
        expect(location.href).toMatchURL('/path?query=2#b')

        Trigger.clickSequence(link3)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(3)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=3')
        jasmine.respondWith(path3Text)
        await wait()
        expect(location.href).toMatchURL('/path?query=3')
        expect('main').toHaveText('path3 text')
        expect(viewport.scrollTop).toBe(0)

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(4)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=2')
        jasmine.respondWith(path2Text)
        await wait()
        expect(location.href).toMatchURL('/path?query=2#b')
        expect('main #b').toHaveText('path2#b text')
        expect(viewport.scrollTop).toBe(300 + 50 + 300)

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(4)
        expect(up.network.isBusy()).toBe(false)
        expect(location.href).toMatchURL('/path?query=2#a')
        expect(viewport.scrollTop).toBe(300)

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(5)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path')
        jasmine.respondWith(path1Text)
        await wait()
        expect(location.href).toMatchURL('/path')
        expect('main').toHaveText('path1 text')
        expect(viewport.scrollTop).toBe(0)

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(6)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=2')
        jasmine.respondWith(path2Text)
        await wait()
        expect(location.href).toMatchURL('/path?query=2#a')
        expect('main #a').toHaveText('path2#a text')
        expect(viewport.scrollTop).toBe(300)

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(6)
        expect(up.network.isBusy()).toBe(false)
        expect(location.href).toMatchURL('/path?query=2#b')
        expect('main #b').toHaveText('path2#b text')
        expect(viewport.scrollTop).toBe(300 + 50 + 300)

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(7)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path?query=3')
        jasmine.respondWith(path3Text)
        await wait()
        expect(location.href).toMatchURL('/path?query=3')
        expect('main').toHaveText('path3 text')
        expect(viewport.scrollTop).toBe(0)

        expect(up.network.isBusy()).toBe(false)

      })

      it('does not load locations when navigating over entries pushed by foreign JS with custom state', async function() {
        const waitForBrowser = 150

        up.network.config.autoCache = false
        up.history.config.restoreTargets = ['main']

        let [nav, link1, link2, target] = htmlFixtureList(`
          <nav>
            <a href="/path1" up-follow>path1</a>
            <a href="/path2" up-follow>path2</a>
          </nav>
          <main>
            initial text
          </main>
        `)

        expect('main').toHaveText('initial text')

        Trigger.clickSequence(link1)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path1')
        jasmine.respondWith('<main>path1 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path1')
        expect('main').toHaveText('path1 text')

        history.pushState({}, '', '/foreign-path')
        await wait()
        expect(location.href).toMatchURL('/foreign-path')
        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(up.network.isBusy()).toBe(false)

        Trigger.clickSequence(link2)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith('<main>path2 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path2')
        expect('main').toHaveText('path2 text')

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(up.network.isBusy()).toBe(false)
        expect(location.href).toMatchURL('/foreign-path')
        expect('main').toHaveText('path2 text')

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(3)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path1')
        jasmine.respondWith('<main>path1 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path1')
        expect('main').toHaveText('path1 text')

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(3)
        expect(up.network.isBusy()).toBe(false)
        expect(location.href).toMatchURL('/foreign-path')
        expect('main').toHaveText('path1 text')

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(4)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith('<main>path2 text</main>')
        await wait()
        expect(location.href).toMatchURL('/path2')
        expect('main').toHaveText('path2 text')

        expect(up.network.isBusy()).toBe(false)
      })

      it('calls destructor functions when destroying compiled elements (bugfix)', async function() {
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
        await wait(waitForBrowser)

        expect(location.pathname).toEqual('/one')
        jasmine.respondWith("<div class='container'>restored container text</div>")

        await wait()

        expect(destructorSpy).toHaveBeenCalled()
      })

      describe('up:location:restore event', function() {

        it('emits an up:location:restore event that users can prevent and substitute their own restoration logic', async function() {
          const waitForBrowser = 100
          const main = fixture('main#main', { text: 'original content' })
          up.history.config.restoreTargets = [':main']
          const restoreListener = jasmine.createSpy('up:location:restore listener').and.callFake((event) => {
            event.preventDefault()
            main.innerText = 'manually restored content'
          })
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

          expect(main).toHaveText('manually restored content')
        })

        it('lets users mutate event.renderOptions to customize the restoration pass', async function() {
          const waitForBrowser = 100
          fixture('#main', { text: 'original main' })
          fixture('#other', { text: 'original other' })
          up.history.config.restoreTargets = ['#main']
          const restoreListener = jasmine.createSpy('up:location:restore listener').and.callFake((event) => event.renderOptions.target = '#other')

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
          fixture('main', { text: 'original content' })
          up.history.config.restoreTargets = [':main']

          up.navigate({ target: 'main', url: '/path1' })
          await wait()
          jasmine.respondWithSelector('main', { text: 'path1 content' })
          await wait()

          expect(up.history.location).toMatchURL('/path1')
          expect('main').toHaveText('path1 content')

          up.navigate({ target: 'main', url: '/path2' })
          await wait()
          jasmine.respondWithSelector('main', { text: 'path2 content' })
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
          fixture('main', { text: 'original content' })
          up.history.config.restoreTargets = [':main']

          up.navigate({ target: 'main', url: '/path1' })
          await wait()
          expect(jasmine.Ajax.requests.count()).toBe(1)

          jasmine.respondWithSelector('main', { text: 'path1 content' })
          await wait()

          expect(up.history.location).toMatchURL('/path1')
          expect('main').toHaveText('path1 content')

          up.navigate({ target: 'main', url: '/path2' })
          await wait()

          expect(jasmine.Ajax.requests.count()).toBe(2)

          jasmine.respondWithSelector('main', { text: 'path2 content' })
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

          jasmine.respondWithSelector('main', { text: 'revalidated path1 content' })
          await wait()

          expect(up.history.location).toMatchURL('/path1')
          expect('main').toHaveText('revalidated path1 content')
          // No additional request was made
          expect(jasmine.Ajax.requests.count()).toBe(3)
        })
      })

      describe('focus restoration', () => {
        it('restores element focus when the user hits the back button', async function() {
          const waitForBrowser = 100
          up.fragment.config.mainTargets = ['main']
          up.history.config.restoreTargets = [':main']
          const main = fixture('main')
          const link = e.affix(main, 'a[href="/focus-path2"][up-follow]', { text: 'link label' })

          up.history.replace('/focus-path1')
          await wait()

          Trigger.clickSequence(link)
          await wait()

          expect(link).toBeFocused()
          expect(jasmine.Ajax.requests.count()).toBe(1)

          jasmine.respondWithSelector('main', { text: 'new text' })
          await wait()

          expect('main').toHaveText('new text')
          expect('main').toBeFocused()

          history.back()
          await wait(waitForBrowser)

          expect(jasmine.Ajax.requests.count()).toBe(2)
          await wait()

          jasmine.respondWithSelector('main a[href="/focus-path2"]')
          await wait()

          expect(document).toHaveSelector('main a[href="/focus-path2"]')
          expect('a[href="/focus-path2"]').toBeFocused()
        })
      })

      describe('scroll restoration', function() {

        afterEach(() => {
          $('.viewport').remove()
        })

        it('restores the scroll position of viewports when the user hits the back button', async function() {
          const longContentHTML = `
            <div class="viewport" style="width: 100px; height: 100px; overflow-y: scroll">
              <div class="content" style="height: 1000px"></div>
            </div>
          `

          const respond = () => jasmine.respondWith(longContentHTML)

          const $viewport = $(longContentHTML).appendTo(document.body)

          const waitForBrowser = 100

          up.viewport.config.viewportSelectors = ['.viewport']
          up.history.config.restoreTargets = ['.viewport']

          up.history.replace('/scroll-restauration-spec')

          up.navigate('.content', { url: '/test-one', history: true })
          await wait(waitForBrowser)

          respond()
          await wait(waitForBrowser)

          expect(location.href).toMatchURL('/test-one')
          $viewport.scrollTop(50)
          up.navigate('.content', { url: '/test-two', history: true })
          await wait(waitForBrowser)

          respond()
          await wait(waitForBrowser)

          expect(location.href).toMatchURL('/test-two')
          $('.viewport').scrollTop(150)
          up.navigate('.content', { url: '/test-three', history: true })
          await wait(waitForBrowser)

          respond()
          await wait(waitForBrowser)

          expect(location.href).toMatchURL('/test-three')
          $('.viewport').scrollTop(250)
          history.back()
          await wait(waitForBrowser)

          expect(location.href).toMatchURL('/test-two')
          expect($('.viewport').scrollTop()).toBe(150)
          history.back()
          await wait(waitForBrowser)

          expect(location.href).toMatchURL('/test-one')
          expect($('.viewport').scrollTop()).toBe(50)
          history.forward()
          await wait(waitForBrowser)

          expect(location.href).toMatchURL('/test-two')
          expect($('.viewport').scrollTop()).toBe(150)
          history.forward()
          await wait(waitForBrowser)

          expect(location.href).toMatchURL('/test-three')
          expect($('.viewport').scrollTop()).toBe(250)
        })

        it('resets the scroll position of no earlier scroll position is known', async function() {
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

          up.navigate('.content', { url: '/restore-path2', history: true })
          await wait()

          respond()
          await wait()

          expect(location.href).toMatchURL('/restore-path2')
          $('.viewport').scrollTop(50)

          // Emulate a cache miss
          up.layer.root.lastScrollTops.clear()

          history.back()
          await wait(waitForBrowser)

          respond()
          await wait()

          expect(location.href).toMatchURL('/restore-path1')
          expect($('.viewport').scrollTop()).toBe(0)
        })

        it('restores the scroll position of two viewports marked with [up-viewport], but not configured in up.viewport.config (bugfix)', async function() {
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

          const respond = () => jasmine.respondWith(html)

          const $screen = $fixture('.screen')
          $screen.html(html)

          up.navigate('.content1, .content2', { url: '/one', reveal: false, history: true })
          await wait()

          respond()
          await wait()

          $('.viewport1').scrollTop(3000)
          $('.viewport2').scrollTop(3050)
          expect('.viewport1').toBeScrolledTo(3000)
          expect('.viewport2').toBeScrolledTo(3050)

          up.navigate('.content1, .content2', { url: '/two', reveal: false, history: true })
          await wait()

          respond()
          await wait()

          expect(location.href).toMatchURL('/two')
          history.back()
          await wait(50)

          expect('.viewport1').toBeScrolledTo(3000)
          expect('.viewport2').toBeScrolledTo(3050)
        })
      })
    }) // history navigation

    describe('changing the location #hash', function() {

      describe('when the #hash is changed manually', function() {

        it('reveals a matching fragment, honoring obstructions', async function() {
          // up.history.scrollRestoration = 'manual'

          // The browser will only fire a hashchange event if the hash actually did change.
          // In case someone re-runs this spec, reset the hash before we setup our test below.
          location.hash = ''
          await wait()

          const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
          const element = fixture('#element', { text: 'content', style: { position: 'absolute', top: '5000px' } })
          const obstruction = fixture('.obstruction[up-fixed=top]', { text: 'obstructions', style: { 'position': 'fixed', 'top': '0px', 'height': '30px', 'background-color': 'blue' } })

          location.hash = "#element"
          await wait()

          expect(up.viewport.root.scrollTop).toBe(5000 - 30)
        })

        it('does not reveal when the new #hash is empty', async function() {
          // The browser will only fire a hashchange event if the hash actually did change.
          // In case someone re-runs this spec, reset the hash before we setup our test below.
          location.hash = '#elsewhere'
          await wait()

          const revealSpy = up.reveal.mock()

          location.hash = ""
          await wait()

          expect(revealSpy).not.toHaveBeenCalled()
        })
      })

      describe('clicking link containing only a #hash in its [href]', function() {

        it("reveals a fragment matching the link's hash, honoring obstructions", async function() {
          location.hash = ''
          await wait()

          const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
          const element = fixture('#element', { text: 'content', style: { position: 'absolute', top: '5000px', 'background-color': 'yellow' } })
          const obstruction = fixture('.obstruction[up-fixed=top]', { text: 'obstructions', style: { 'position': 'fixed', 'top': '0px', 'height': '30px', 'background-color': 'blue' } })
          const link = fixture('a', { href: '#element' })

          // Firefox will only do native #anchor processing when we use link.click(),
          // but not when we emit a synthetic 'click' event.
          link.click()
          await wait(100)

          expect(up.viewport.root.scrollTop).toBe(5000 - 30)
          expect(location.hash).toBe('#element')

        })

        it("reveals a fragment when the location is already on the link's #hash", async function() {
          location.hash = '#element'
          await wait()

          const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
          const element = fixture('#element', { text: 'content', style: { position: 'absolute', top: '5000px' } })
          const obstruction = fixture('.obstruction[up-fixed=top]', { text: 'obstructions', style: { 'position': 'fixed', 'top': '0px', 'height': '30px', 'background-color': 'blue' } })
          const link = fixture('a', { href: '#element' })

          // Firefox will only do native #anchor processing when we use link.click(),
          // but not when we emit a synthetic 'click' event.
          link.click()
          await wait(100)

          expect(up.viewport.root.scrollTop).toBe(5000 - 30)
          expect(location.hash).toBe('#element')
        })

        it("reveals a fragment within a history-less layer", async function() {
          up.history.replace('/root-location')

          up.layer.open({ mode: 'cover', url: '/overlay-location', target: '#content', history: false })
          await wait()

          jasmine.respondWith(`
            <div id="content">
              <div style="height: 10000px"></div>
              <a id="link" href="#element" style="display: block; height: 50px">click me</a>
              <div style="height: 10000px"></div>
              <div id="element" style="height: 50px">element</div>
              <div style="height: 10000px"></div>
            </div>
          `)
          await wait()

          expect(up.layer.isOverlay()).toBe(true)
          expect(up.layer.current).toHaveSelector('#content')

          expect(location.href).toMatchURL('/root-location')
          expect(up.layer.location).toMatchURL('/overlay-location')

          expect(up.layer.current.viewportElement.scrollTop).toBe(0)

          document.querySelector('#link').click()
          await wait()

          expect(up.layer.current.viewportElement.scrollTop).toBe(10000 + 50 + 10000)
        })

        it("does not reveal when no fragment matches the link's #hash", async function() {
          location.hash = ''
          await wait()

          const link = fixture('a', { href: '#element' })
          const revealSpy = up.reveal.mock()

          // Firefox will only do native #anchor processing when we use link.click(),
          // but not when we emit a synthetic 'click' event.
          link.click()
          await wait(100)

          expect(revealSpy).not.toHaveBeenCalled()
          expect(location.hash).toBe('#element')
        })


        it("does not reveal when an event listener prevents the click event", async function() {
          location.hash = ''
          await wait()

          fixture('#element')

          const link = fixture('a', { href: '#element' })
          link.addEventListener('click', (event) => event.preventDefault())

          const revealSpy = up.reveal.mock()

          // Firefox will only do native #anchor processing when we use link.click(),
          // but not when we emit a synthetic 'click' event.
          link.click()
          await wait(100)

          expect(revealSpy).not.toHaveBeenCalled()
          expect(location.hash).toBe('')
        })

        it("scrolls to the top if the link's hash is just the '#' symbol", async function() {
          location.hash = ''
          await wait()

          const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
          up.viewport.root.scrollTop = 3000
          expect(up.viewport.root.scrollTop).toBe(3000)

          const link = fixture('a', { href: '#' })

          // Firefox will only do native #anchor processing when we use link.click(),
          // but not when we emit a synthetic 'click' event.
          link.click()
          await wait(100)

          expect(up.viewport.root.scrollTop).toBe(0)
          expect(location.hash).toBe('')
        })

        it("scrolls to the top if the link's hash '#top', even if there is no matching fragment", async function() {
          location.hash = ''
          await wait()

          const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
          up.viewport.root.scrollTop = 3000
          expect(up.viewport.root.scrollTop).toBe(3000)

          const link = fixture('a', { href: '#top' })

          // Firefox will only do native #anchor processing when we use link.click(),
          // but not when we emit a synthetic 'click' event.
          link.click()
          await wait(100)

          expect(up.viewport.root.scrollTop).toBe(0)
          expect(location.hash).toBe('#top')
        })

        it("only reveals a fragment in the link's layer", async function() {
          let html = `
            <div id="content">
              <div style="height: 10000px"></div>
              <a id="link" href="#element" style="display: block; height: 50px">click me</a>
              <div style="height: 10000px"></div>
              <div id="element" style="height: 50px; background-color: yellow">element</div>
              <div style="height: 10000px"></div>
            </div>
          `

          makeLayers([
            { fragment: html },
            { fragment: html },
          ])
          await wait()

          let rootViewport = up.viewport.root
          let overlayViewport = up.layer.get(1).viewportElement

          let overlayLink = up.fragment.get('#link', { layer: 'current' })

          overlayLink.click()
          await wait()

          let overlayTopMargin = 25
          let overlayTopPadding = 20

          expect(rootViewport.scrollTop).toBe(0)
          expect(overlayViewport.scrollTop).toBe(overlayTopMargin + overlayTopPadding + 10000 + 50 + 10000)
        })

        it('only scrolls the current layer to the #top', async function() {
          let html = `
              <div id="content">
                <div style="height: 10000px"></div>
                <a id="link" href="#top" style="display: block; height: 50px">click me</a>
              </div>
            `

          makeLayers([
            { fragment: html },
            { fragment: html },
          ])
          await wait()

          let rootViewport = up.viewport.root
          let overlayViewport = up.layer.get(1).viewportElement
          rootViewport.scrollTop = 500
          overlayViewport.scrollTop = 500

          expect(rootViewport.scrollTop).toBe(500)
          expect(overlayViewport.scrollTop).toBe(500)

          let overlayLink = up.fragment.get('#link', { layer: 'current' })

          overlayLink.click()
          await wait()

          expect(rootViewport.scrollTop).toBe(500)
          expect(overlayViewport.scrollTop).toBe(0)
        })

        it('uses smooth scrolling with [up-scroll-behavior=smooth] (issue #737)', async function() {
          throw "implement smooth scrolling"
        })

        it('uses smooth scrolling if the viewport has a `{ scroll-behavior: smooth }` style (issue #737)', async function() {
          throw "implement smooth scrolling"
        })

      })

      describe('clicking link containing with both a path and a #hash in its [href]', function() {

        describe("when the link's base matches the current location", function() {

          it('reveals a matching fragment, honoring obstructions', async function() {
            let base = location.pathname + location.search

            location.hash = ''
            await wait()

            const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
            const element = fixture('#element', { text: 'content', style: { position: 'absolute', top: '5000px', 'background-color': 'yellow' } })
            const obstruction = fixture('.obstruction[up-fixed=top]', { text: 'obstructions', style: { 'position': 'fixed', 'top': '0px', 'height': '30px', 'background-color': 'blue' } })
            const link = fixture('a', { href: base + '#element' })

            // Firefox will only do native #anchor processing when we use link.click(),
            // but not when we emit a synthetic 'click' event.
            link.click()
            await wait(100)

            expect(up.viewport.root.scrollTop).toBe(5000 - 30)
            expect(location.hash).toBe('#element')
          })

          it("reveals a matching fragment when we are already on the link's #hash", async function() {
            let base = location.pathname + location.search

            location.hash = '#element'
            await wait()

            const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
            const element = fixture('#element', { text: 'content', style: { position: 'absolute', top: '5000px' } })
            const obstruction = fixture('.obstruction[up-fixed=top]', { text: 'obstructions', style: { 'position': 'fixed', 'top': '0px', 'height': '30px', 'background-color': 'blue' } })
            const link = fixture('a', { href: base + '#element' })

            // Firefox will only do native #anchor processing when we use link.click(),
            // but not when we emit a synthetic 'click' event.
            link.click()
            await wait(100)

            expect(up.viewport.root.scrollTop).toBe(5000 - 30)
            expect(location.hash).toBe('#element')
          })

          it("scrolls to the top if the link's hash is '#top', even if there is no matching fragment", async function() {
            let base = location.pathname + location.search
            location.hash = '#top'
            await wait()

            const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
            up.viewport.root.scrollTop = 3000
            expect(up.viewport.root.scrollTop).toBe(3000)

            const link = fixture('a', { href: base + '#top' })

            // Firefox will only do native #anchor processing when we use link.click(),
            // but not when we emit a synthetic 'click' event.
            link.click()
            await wait(100)

            expect(up.viewport.root.scrollTop).toBe(0)
            expect(location.hash).toBe('#top')
          })

        })

        describe("when the link's base matches another location", function() {

          it('renders the new location and reveals a matching fragment in the new content', async function() {
            location.hash = ''
            await wait()

            const highElement = fixture('.high', { style: { height: '10000px' } }) // ensure we can scroll
            const oldElement = fixture('#element', { text: 'old content', style: { position: 'absolute', top: '3000px', 'background-color': 'rebeccapurple' } })
            const obstruction = fixture('.obstruction[up-fixed=top]', { text: 'obstructions', style: { 'position': 'fixed', 'top': '0px', 'height': '30px', 'background-color': 'blue' } })
            const link = fixture('a', { href: '/other-path#element', 'up-target': '#element', 'up-history': true })

            // Firefox will only do native #anchor processing when we use link.click(),
            // but not when we emit a synthetic 'click' event.
            link.click()
            await wait(100)

            expect(up.viewport.root.scrollTop).toBe(0)
            expect(jasmine.Ajax.requests.count()).toBe(1)

            jasmine.respondWithSelector('#element', { text: 'new content', style: { position: 'absolute', top: '5000px', 'background-color': 'yellow' } })
            await wait()

            expect('#element').toHaveText('new content')
            expect(up.viewport.root.scrollTop).toBe(5000 - 30)
            expect(location.hash).toBe('#element')

          })

          it("renders the new location if the link's base matches the browser location, but not the location of a history-less layer", async function() {
            up.history.replace('/root-location')

            up.layer.open({ mode: 'cover', url: '/overlay-location', target: '#content', history: false })
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            jasmine.respondWith(`
              <div id="content">
                <a id="link" href="/root-location#hash" up-target="#content">label</a>
                <div id="hash">fake hash</div> <!-- up.history.onHashLinkClicked should see a matching fragment, but not reveal it -->
              </div>
            `)
            await wait()

            expect(up.layer.isOverlay()).toBe(true)
            expect(up.layer.current).toHaveSelector('#content')

            expect(location.href).toMatchURL('/root-location')
            expect(up.layer.location).toMatchURL('/overlay-location')

            document.querySelector('#link').click()
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(2)
            jasmine.respondWith(`
              <div id="content">
                new content
              </div>
            `)

            await wait()

            expect(up.layer.isOverlay()).toBe(true)
            expect(up.layer.current).toHaveSelector('#content')
            expect('#content').toHaveText('new content')
          })

          it("renders the new location if the overlay was opened from a string of HTML", async function() {
            up.history.replace('/root-location')

            up.layer.open({ mode: 'cover', fragment: `
              <div id="content">
                <a id="link" href="/root-location#hash" up-target="#content">label</a>
                <div id="hash">fake hash</div> <!-- up.history.onHashLinkClicked should see a matching fragment, but not reveal it -->
              </div>
            ` })
            await wait()

            expect(up.layer.isOverlay()).toBe(true)
            expect(up.layer.current).toHaveSelector('#content')

            expect(location.href).toMatchURL('/root-location')
            expect(up.layer.location).toBeMissing()

            document.querySelector('#link').click()
            await wait()

            expect(jasmine.Ajax.requests.count()).toBe(1)
            jasmine.respondWith(`
              <div id="content">
                new content
              </div>
            `)

            await wait()

            expect(up.layer.isOverlay()).toBe(true)
            expect(up.layer.current).toHaveSelector('#content')
            expect('#content').toHaveText('new content')
          })

        })
      })

    }) // changing the location #hash

    describe('up:location:changed event', function() {

      it('emits up:location:changed when foreign JavaScript uses window.history.pushState()', async function() {
        history.replaceState({}, '', '/path1')

        let spy = jasmine.createSpy('up:location:changed listener')
        document.addEventListener('up:location:changed', spy)

        history.pushState({}, '', '/path2')
        await wait()

        expect(location.href).toMatchURL('/path2')
        expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
          type: 'up:location:changed',
          reason: 'push',
          location: '/path2',
          base: '/path2',
          hash: undefined,
          previousLocation: '/path1',
          previousBase: '/path1',
          previousHash: undefined,
          manual: false,
          adopted: false,
          willHandle: false,
        }))
      })

      it('emits up:location:changed when only the query string changes', async function() {
        history.replaceState({}, '', '/path?query=one')

        let spy = jasmine.createSpy('up:location:changed listener')
        document.addEventListener('up:location:changed', spy)

        history.pushState({}, '', '/path?query=two')
        await wait()

        expect(location.href).toMatchURL('/path?query=two')
        expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
          type: 'up:location:changed',
          reason: 'push',
          previousLocation: '/path?query=one',
          location: '/path?query=two',
          manual: false,
          adopted: false,
          willHandle: false,
        }))
      })

      it('emits up:location:changed when only the #hash changes', async function() {
        history.replaceState({}, '', '/path#hash1')

        let spy = jasmine.createSpy('up:location:changed listener')
        document.addEventListener('up:location:changed', spy)

        history.pushState({}, '', '/path#hash2')
        await wait()

        expect(location.href).toMatchURL('/path#hash2')
        expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
          type: 'up:location:changed',
          reason: 'push',
          location: '/path#hash2',
          base: '/path',
          hash: '#hash2',
          previousLocation: '/path#hash1',
          previousBase: '/path',
          previousHash: '#hash1',
          manual: false,
          adopted: false,
          willHandle: false,
        }))
      })

      it('emits up:location:changed when foreign JavaScript uses up.history.push()', async function() {
        history.replaceState({}, '', '/path1')

        let spy = jasmine.createSpy('up:location:changed listener')
        document.addEventListener('up:location:changed', spy)

        up.history.push('/path2')
        await wait()

        expect(location.href).toMatchURL('/path2')
        expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
          type: 'up:location:changed',
          reason: 'push',
          previousLocation: '/path1',
          location: '/path2',
          manual: false,
          adopted: true,
          willHandle: false,
        }))
      })

      it('does not emit up:location:changed when foreign JavaScript uses up.history.push() to re-push the current location', async function() {
        history.replaceState({}, '', '/path')

        let spy = jasmine.createSpy('up:location:changed listener')
        document.addEventListener('up:location:changed', spy)

        up.history.push('/path')
        await wait()

        expect(location.href).toMatchURL('/path')
        expect(spy).not.toHaveBeenCalled()
      })

      it('emits up:location:changed when foreign JavaScript uses window.history.replaceState()', async function() {
        history.replaceState({}, '', '/path1')

        let spy = jasmine.createSpy('up:location:changed listener')
        document.addEventListener('up:location:changed', spy)

        history.replaceState({}, '', '/path2')
        await wait()

        expect(location.href).toMatchURL('/path2')
        expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
          type: 'up:location:changed',
          reason: 'replace',
          previousLocation: '/path1',
          location: '/path2',
          manual: false,
          adopted: false,
          willHandle: false,
        }))
      })

      it('emits up:location:changed when foreign JavaScript uses up.history.replace()', async function() {
        history.replaceState({}, '', '/path1')

        let spy = jasmine.createSpy('up:location:changed listener')
        document.addEventListener('up:location:changed', spy)

        up.history.replace('/path2')
        await wait()

        expect(location.href).toMatchURL('/path2')
        expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
          type: 'up:location:changed',
          reason: 'replace',
          previousLocation: '/path1',
          location: '/path2',
          manual: false,
          adopted: true,
          willHandle: false,
        }))
      })

      it('does not emit up:location:changed when foreign JavaScript uses up.history.replace() to re-set (or adopt) the current location', async function() {
        history.replaceState({}, '', '/path')

        let spy = jasmine.createSpy('up:location:changed listener')
        document.addEventListener('up:location:changed', spy)

        up.history.replace('/path')
        await wait()

        expect(location.href).toMatchURL('/path')
        expect(spy).not.toHaveBeenCalled()
      })

      it('emits up:location:changed when foreign JavaScript sets location.hash, providing additional { base, previousBase, hash, previousHash } properties', async function() {
        history.replaceState({}, '', '/path?query=value')
        location.hash = '#hash1'

        let spy = jasmine.createSpy('up:location:changed listener')
        document.addEventListener('up:location:changed', spy)

        location.hash = '#hash2'
        await wait()

        expect(location.href).toMatchURL('/path?query=value#hash2')
        expect(up.history.location).toMatchURL('/path?query=value#hash2')

        expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
          type: 'up:location:changed',
          reason: 'hash',
          location: '/path?query=value#hash2',
          base: '/path?query=value',
          hash: '#hash2',
          previousLocation: '/path?query=value#hash1',
          previousBase: '/path?query=value',
          previousHash: '#hash1',
          manual: true,
          adopted: false,
          willHandle: false,
        }))
      })

      it('emits up:location:changed events as the user goes forwards and backwards through history', async function() {
        const waitForBrowser = 100

        up.network.config.autoCache = false
        up.history.config.restoreTargets = ['main']
        up.viewport.config.revealSnap = 0

        const events = []
        up.on('up:location:changed', (event) => events.push([event.reason, event.location]))

        let [nav, link1, link2a, link2b, link3, viewport, target] = htmlFixtureList(`
          <nav>
            <a href="/path1" up-follow>path1</a>
            <a href="/path2#a" up-follow>path2#a</a>
            <a href="/path2#b" up-follow>path2#b</a>
            <a href="/path3" up-follow>path3</a>
          </nav>
          <div id="viewport" up-viewport style="height: 200px; overflow-y: scroll; background-color: yellow;">
            <main>
              initial text
            </main>
          </div>
        `)

        let path1Text = `
          <main>
            path1 text
          </main>
        `

        let path2Text = `
          <main>
            <div style="height: 300px">before</div>
            <div id="a" style="height: 50px; background-color: green">
              path2#a text
            </div>
            <div style="height: 300px">between</div>
            <div id="b" style="height: 50px; background-color: blue">
              path2#b text
            </div>
            <div style="height: 300px">below</div>
          </main>
        `

        let path3Text = `
          <main>
            path3 text
          </main>
        `

        expect('main').toHaveText('initial text')

        Trigger.clickSequence(link1)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path1')
        jasmine.respondWith(path1Text)
        await wait()
        expect(location.href).toMatchURL('/path1')
        expect('main').toHaveText('path1 text')
        expect(viewport.scrollTop).toBe(0)
        expect(events).toEqual([
          ['push', '/path1'],
        ])

        Trigger.clickSequence(link2a)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith(path2Text)
        await wait()
        expect(location.href).toMatchURL('/path2#a')
        expect('main #a').toHaveText('path2#a text')
        expect(viewport.scrollTop).toBe(300) // revealing a hash always aligns with top
        expect(events).toEqual([
          ['push', '/path1'],
          ['push', '/path2#a'],
        ])

        Trigger.clickSequence(link2b)
        await wait()
        expect(up.network.isBusy()).toBe(false)
        expect(jasmine.Ajax.requests.count()).toBe(2)
        expect(viewport.scrollTop).toBe(300 + 50 + 300)
        expect(location.href).toMatchURL('/path2#b')
        expect(events).toEqual([
          ['push', '/path1'],
          ['push', '/path2#a'],
          ['hash', '/path2#b'],
        ])

        Trigger.clickSequence(link3)
        await wait()
        expect(jasmine.Ajax.requests.count()).toBe(3)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path3')
        jasmine.respondWith(path3Text)
        await wait()
        expect(location.href).toMatchURL('/path3')
        expect('main').toHaveText('path3 text')
        expect(viewport.scrollTop).toBe(0)
        expect(events).toEqual([
          ['push', '/path1'],
          ['push', '/path2#a'],
          ['hash', '/path2#b'],
          ['push', '/path3'],
        ])

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(4)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith(path2Text)
        await wait()
        expect(location.href).toMatchURL('/path2#b')
        expect('main #b').toHaveText('path2#b text')
        expect(viewport.scrollTop).toBe(300 + 50 + 300)
        expect(events).toEqual([
          ['push', '/path1'],
          ['push', '/path2#a'],
          ['hash', '/path2#b'],
          ['push', '/path3'],
          ['pop', '/path2#b'],
        ])

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(4)
        expect(up.network.isBusy()).toBe(false)
        expect(location.href).toMatchURL('/path2#a')
        expect(viewport.scrollTop).toBe(300)
        expect(events).toEqual([
          ['push', '/path1'],
          ['push', '/path2#a'],
          ['hash', '/path2#b'],
          ['push', '/path3'],
          ['pop', '/path2#b'],
          ['hash', '/path2#a'],
        ])

        history.back()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(5)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path1')
        jasmine.respondWith(path1Text)
        await wait()
        expect(location.href).toMatchURL('/path1')
        expect('main').toHaveText('path1 text')
        expect(viewport.scrollTop).toBe(0)
        expect(events).toEqual([
          ['push', '/path1'],
          ['push', '/path2#a'],
          ['hash', '/path2#b'],
          ['push', '/path3'],
          ['pop', '/path2#b'],
          ['hash', '/path2#a'],
          ['pop', '/path1'],
        ])

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(6)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path2')
        jasmine.respondWith(path2Text)
        await wait()
        expect(location.href).toMatchURL('/path2#a')
        expect('main #a').toHaveText('path2#a text')
        expect(viewport.scrollTop).toBe(300)
        expect(events).toEqual([
          ['push', '/path1'],
          ['push', '/path2#a'],
          ['hash', '/path2#b'],
          ['push', '/path3'],
          ['pop', '/path2#b'],
          ['hash', '/path2#a'],
          ['pop', '/path1'],
          ['pop', '/path2#a'],
        ])

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(6)
        expect(up.network.isBusy()).toBe(false)
        expect(location.href).toMatchURL('/path2#b')
        expect('main #b').toHaveText('path2#b text')
        expect(viewport.scrollTop).toBe(300 + 50 + 300)
        expect(events).toEqual([
          ['push', '/path1'],
          ['push', '/path2#a'],
          ['hash', '/path2#b'],
          ['push', '/path3'],
          ['pop', '/path2#b'],
          ['hash', '/path2#a'],
          ['pop', '/path1'],
          ['pop', '/path2#a'],
          ['hash', '/path2#b'],
        ])

        history.forward()
        await wait(waitForBrowser)
        expect(jasmine.Ajax.requests.count()).toBe(7)
        expect(jasmine.Ajax.requests.mostRecent().url).toMatchURL('/path3')
        jasmine.respondWith(path3Text)
        await wait()
        expect(location.href).toMatchURL('/path3')
        expect('main').toHaveText('path3 text')
        expect(viewport.scrollTop).toBe(0)
        expect(events).toEqual([
          ['push', '/path1'],
          ['push', '/path2#a'],
          ['hash', '/path2#b'],
          ['push', '/path3'],
          ['pop', '/path2#b'],
          ['hash', '/path2#a'],
          ['pop', '/path1'],
          ['pop', '/path2#a'],
          ['hash', '/path2#b'],
          ['pop', '/path3'],
        ])

        expect(up.network.isBusy()).toBe(false)
      })

    })

    describe('[up-back]', function() {

      it('sets an [up-href] attribute to the previous URL and sets the up-scroll attribute to "restore"', function() {
        up.history.push('/path1')
        up.history.push('/path2')
        const element = up.hello(fixture('a[href="/path3"][up-back]', { text: 'text' }))
        expect(element.getAttribute('href')).toMatchURL('/path3')
        expect(element.getAttribute('up-href')).toMatchURL('/path1')
        expect(element.getAttribute('up-scroll')).toBe('restore')
        expect(element).toBeFollowable()
      })

      it('restores the previous URL when clicked')

      it('does not overwrite an existing up-href or up-restore-scroll attribute')

      it('does not set an up-href attribute if there is no previous URL')
    })
  })
})

