const u = up.util
const e = up.element
const $ = jQuery

describe('up.history', function() {

  beforeEach(() => {
    up.history.config.enabled = true
  })

  afterEach(async function() {
    // This suite makes heavy use of pushState API, which sometimes causes the browser to stop
    // accepting new history entries.
    //
    // Wait a little after each spec, in addition to the throttling in protect_jasmine_runner.js.
    await wait(50)
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

    require('./history_navigation_spec')

    require('./history_hash_spec')

    describe('up:location:changed event', function() {

      describe('when scripts call window.history.pushState()', function() {

        it('emits the event, considering it already handled by the foreign script', async function() {
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
            previousLocation: '/path1',
            alreadyHandled: true,
            willHandle: false,
          }))
        })

        it('emits the event when only the query string changes', async function() {
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
            alreadyHandled: true,
            willHandle: false,
          }))
        })

        it('emits the event when only the #hash changes', async function() {
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
            previousLocation: '/path#hash1',
            alreadyHandled: true,
            willHandle: false,
          }))
        })

        it("does not emit the event if the location didn't change", async function() {
          history.replaceState({}, '', '/path1')

          let spy = jasmine.createSpy('up:location:changed listener')
          document.addEventListener('up:location:changed', spy)

          history.pushState({}, '', '/path1')
          await wait()

          expect(location.href).toMatchURL('/path1')
          expect(spy).not.toHaveBeenCalled()
        })

      })

      describe('when scripts call up.history.push()', function() {

        it('emits the event, considering it already handled', async function() {
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
            alreadyHandled: true,
            willHandle: false,
          }))
        })

        it('does not emit the event when the location did not change', async function() {
          history.replaceState({}, '', '/path')

          let spy = jasmine.createSpy('up:location:changed listener')
          document.addEventListener('up:location:changed', spy)

          up.history.push('/path')
          await wait()

          expect(location.href).toMatchURL('/path')
          expect(spy).not.toHaveBeenCalled()
        })

      })

      describe('when scripts call window.history.replaceState()', function() {

        it('emits the event, considering it already handled', async function() {
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
            alreadyHandled: true,
            willHandle: false,
          }))
        })

      })

      describe('when scripts call up.history.replace()', function() {

        it('emits the event, considering it already handled', async function() {
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
            alreadyHandled: true,
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

      })

      describe('when scripts set location.hash', function() {

        it("emits the event, suggesting to handle if we're on an adopted base", async function() {
          // Be on an adopted base
          up.history.replace('/path?query=value')
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
            previousLocation: '/path?query=value#hash1',
            alreadyHandled: false,
            willHandle: true,
          }))
        })

        it("emits the event, suggesting to not handle if we're not on an adopted base", async function() {
          // Be on a non-adopted base
          window.history.replaceState({}, '', '/path?query=value')
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
            previousLocation: '/path?query=value#hash1',
            alreadyHandled: false,
            willHandle: false,
          }))
        })

      })

      describe('history navigation', function() {

        it('emits an event for every navigation step', async function() {
          const waitForBrowser = 100

          up.network.config.autoCache = false
          up.history.config.restoreTargets = ['main']
          up.viewport.config.revealSnap = 0

          const events = []
          up.on('up:location:changed', (event) => events.push(event))

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
            jasmine.objectContaining({ reason: 'push', location: '/path1', alreadyHandled: true, willHandle: false }),
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
            jasmine.objectContaining({ reason: 'push', location: '/path1', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'push', location: '/path2#a', alreadyHandled: true, willHandle: false }),
          ])

          Trigger.clickSequence(link2b)
          await wait()
          expect(up.network.isBusy()).toBe(false)
          expect(jasmine.Ajax.requests.count()).toBe(2)
          expect(viewport.scrollTop).toBe(300 + 50 + 300)
          expect(location.href).toMatchURL('/path2#b')
          expect(events).toEqual([
            jasmine.objectContaining({ reason: 'push', location: '/path1', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'push', location: '/path2#a', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'hash', location: '/path2#b', alreadyHandled: true, willHandle: false }),
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
            jasmine.objectContaining({ reason: 'push', location: '/path1', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'push', location: '/path2#a', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'hash', location: '/path2#b', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'push', location: '/path3', alreadyHandled: true, willHandle: false }),
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
            jasmine.objectContaining({ reason: 'push', location: '/path1', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'push', location: '/path2#a', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'hash', location: '/path2#b', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'push', location: '/path3', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'pop', location: '/path2#b', alreadyHandled: false, willHandle: true }),
          ])

          history.back()
          await wait(waitForBrowser)
          expect(jasmine.Ajax.requests.count()).toBe(4)
          expect(up.network.isBusy()).toBe(false)
          expect(location.href).toMatchURL('/path2#a')
          expect(viewport.scrollTop).toBe(300)
          expect(events).toEqual([
            jasmine.objectContaining({ reason: 'push', location: '/path1', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'push', location: '/path2#a', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'hash', location: '/path2#b', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'push', location: '/path3', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'pop', location: '/path2#b', alreadyHandled: false, willHandle: true }),
            jasmine.objectContaining({ reason: 'hash', location: '/path2#a', alreadyHandled: false, willHandle: true }),
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
            jasmine.objectContaining({ reason: 'push', location: '/path1', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'push', location: '/path2#a', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'hash', location: '/path2#b', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'push', location: '/path3', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'pop', location: '/path2#b', alreadyHandled: false, willHandle: true }),
            jasmine.objectContaining({ reason: 'hash', location: '/path2#a', alreadyHandled: false, willHandle: true }),
            jasmine.objectContaining({ reason: 'pop', location: '/path1', alreadyHandled: false, willHandle: true }),
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
            jasmine.objectContaining({ reason: 'push', location: '/path1', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'push', location: '/path2#a', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'hash', location: '/path2#b', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'push', location: '/path3', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'pop', location: '/path2#b', alreadyHandled: false, willHandle: true }),
            jasmine.objectContaining({ reason: 'hash', location: '/path2#a', alreadyHandled: false, willHandle: true }),
            jasmine.objectContaining({ reason: 'pop', location: '/path1', alreadyHandled: false, willHandle: true }),
            jasmine.objectContaining({ reason: 'pop', location: '/path2#a', alreadyHandled: false, willHandle: true }),
          ])

          history.forward()
          await wait(waitForBrowser)
          expect(jasmine.Ajax.requests.count()).toBe(6)
          expect(up.network.isBusy()).toBe(false)
          expect(location.href).toMatchURL('/path2#b')
          expect('main #b').toHaveText('path2#b text')
          expect(viewport.scrollTop).toBe(300 + 50 + 300)
          expect(events).toEqual([
            jasmine.objectContaining({ reason: 'push', location: '/path1', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'push', location: '/path2#a', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'hash', location: '/path2#b', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'push', location: '/path3', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'pop', location: '/path2#b', alreadyHandled: false, willHandle: true }),
            jasmine.objectContaining({ reason: 'hash', location: '/path2#a', alreadyHandled: false, willHandle: true }),
            jasmine.objectContaining({ reason: 'pop', location: '/path1', alreadyHandled: false, willHandle: true }),
            jasmine.objectContaining({ reason: 'pop', location: '/path2#a', alreadyHandled: false, willHandle: true }),
            jasmine.objectContaining({ reason: 'hash', location: '/path2#b', alreadyHandled: false, willHandle: true }),
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
            jasmine.objectContaining({ reason: 'push', location: '/path1', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'push', location: '/path2#a', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'hash', location: '/path2#b', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'push', location: '/path3', alreadyHandled: true, willHandle: false }),
            jasmine.objectContaining({ reason: 'pop', location: '/path2#b', alreadyHandled: false, willHandle: true }),
            jasmine.objectContaining({ reason: 'hash', location: '/path2#a', alreadyHandled: false, willHandle: true }),
            jasmine.objectContaining({ reason: 'pop', location: '/path1', alreadyHandled: false, willHandle: true }),
            jasmine.objectContaining({ reason: 'pop', location: '/path2#a', alreadyHandled: false, willHandle: true }),
            jasmine.objectContaining({ reason: 'hash', location: '/path2#b', alreadyHandled: false, willHandle: true }),
            jasmine.objectContaining({ reason: 'pop', location: '/path3', alreadyHandled: false, willHandle: true }),
          ])

          expect(up.network.isBusy()).toBe(false)
        })

      })

    })

    describe('[up-back]', function() {

      it('sets an [up-href] attribute to the previous URL and sets the up-scroll attribute to "restore"', function() {
        up.history.push('/path1')
        up.history.push('/path2')
        const element = helloFixture('a[href="/path3"][up-back]', { text: 'text' })
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

