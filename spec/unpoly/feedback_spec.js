const u = up.util
const e = up.element
const $ = jQuery

describe('up.feedback', function() {

  function replaceURL(url) {
    // Don't use up.history.replace() since that fires up:location:changed
    // which up.feedback listens to.
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
        const overlay = await up.layer.open({history: false, content: `
          <nav>
            <a id="overlay-link" href='/bar'></a>
          </nav>
        `})

        const link = overlay.element.querySelector('#overlay-link')

        // Manually add the class as up.layer.open() would remove it from the given { content }.
        link.classList.add('up-current')
        expect(link).toHaveClass('up-current')

        up.hello(overlay.element)

        expect(link).not.toHaveClass('up-current')
      })
    })
  })

  describe('unobtrusive behavior', function() {

    describe('[up-nav]', function() {

      it('marks a child link as .up-current if it links to the current URL', function() {
        replaceURL('/foo')
        const $nav = $fixture('div[up-nav]')
        const $currentLink = $nav.affix('a[href="/foo"]')
        const $otherLink = $nav.affix('a[href="/bar"]')
        up.hello($nav)
        expect($currentLink).toHaveClass('up-current')
        expect($otherLink).not.toHaveClass('up-current')
      })

      it('sets the .up-current class before compilers run', function(done) {
        replaceURL('/foo')
        const $nav = $fixture('#container[up-nav]')
        up.hello($nav)

        up.compiler('#container a', function(link) {
          expect(link).toHaveClass('up-current')
          done()
        })

        up.render('#container', {content: '<a href="/bar">label</a>', history: true, location: '/bar'})
      })

      it('marks the element as .up-current if itself is a link to the current URL', function() {
        replaceURL('/foo')
        const $currentLink = $fixture('a[href="/foo"][up-nav]')
        const $otherLink = $fixture('a[href="/bar"][up-nav]')
        up.hello($currentLink)
        up.hello($otherLink)
        expect($currentLink).toHaveClass('up-current')
        expect($otherLink).not.toHaveClass('up-current')
      })

      it('does not mark a link as .up-current if the link is outside an [up-nav]', function() {
        replaceURL('/foo')
        const $nav = $fixture('div[up-nav]')
        const $currentLinkInNav = $nav.affix('a[href="/foo"]')
        const $currentLinkOutsideNav = $fixture('a[href="/foo"]')
        up.hello($nav)
        expect($currentLinkInNav).toHaveClass('up-current')
        expect($currentLinkOutsideNav).not.toHaveClass('up-current')
      })

      it('marks any link as .up-current if its up-href attribute matches the current URL', function() {
        replaceURL('/foo')
        const $nav = $fixture('div[up-nav]')
        const $currentLink = $nav.affix('span[up-href="/foo"]')
        const $otherLink = $nav.affix('span[up-href="/bar"]')
        up.hello($nav)
        expect($currentLink).toHaveClass('up-current')
        expect($otherLink).not.toHaveClass('up-current')
      })

      it('matches the current and link URLs if they only the link URL has a trailing slash', function() {
        replaceURL('/foo')
        const $nav = $fixture('div[up-nav]')
        const $currentLink = $nav.affix('span[up-href="/foo/"]')
        up.hello($nav)
        expect($currentLink).toHaveClass('up-current')
      })

      it('matches the current and link URLs if they only the current URL has a trailing slash', function() {
        replaceURL('/bar/')
        const $nav = $fixture('div[up-nav]')
        const $currentLink = $nav.affix('span[up-href="/bar"]')
        up.hello($nav)
        expect($currentLink).toHaveClass('up-current')
      })

      it('does not match the current and destination URLs if they differ in the search', function() {
        replaceURL('/foo?q=1')
        const $nav = $fixture('div[up-nav]')
        const $currentLink = $nav.affix('span[up-href="/foo?q=2"]')
        up.hello($nav)
        expect($currentLink).not.toHaveClass('up-current')
      })

      it('marks any link as .up-current if any of its space-separated [up-alias] values matches the current URL', function() {
        replaceURL('/foo')
        const $nav = $fixture('div[up-nav]')
        const $currentLink = $nav.affix('a[href="/x"][up-alias="/aaa /foo /bbb"]')
        const $otherLink = $nav.affix('a[href="/y"][up-alias="/bar"]')
        up.hello($nav)
        expect($currentLink).toHaveClass('up-current')
        expect($otherLink).not.toHaveClass('up-current')
      })

      it('does not throw if the current location does not match an [up-alias] wildcard (bugfix)', function() {
        const inserter = () => up.hello(fixture('a[up-nav][up-alias="/qqqq*"]'))
        expect(inserter).not.toThrow()
      })

      it('has an [up-alias] ending in "/*" match a query string (#542)', function() {
        replaceURL('/test/?whatever')
        const nav = fixture('div[up-nav]')
        const currentLink = e.affix(nav, 'a[href="/foo"][up-alias="/test/*"]')
        up.hello(nav)
        expect(currentLink).toHaveClass('up-current')
      })

      it('does not highlight a link to "#" (commonly used for JS-only buttons)', function() {
        const $nav = $fixture('div[up-nav]')
        const $link = $nav.affix('a[href="#"]')
        up.hello($nav)
        expect($link).not.toHaveClass('up-current')
      })

      it('does not highlight links with unsafe methods', function() {
        replaceURL('/foo')
        const $nav = $fixture('div[up-nav]')
        const $defaultLink = $nav.affix('a[href="/foo"]')
        const $getLink = $nav.affix('a[href="/foo"][up-method="get"]')
        const $putLink = $nav.affix('a[href="/foo"][up-method="put"]')
        const $patchLink = $nav.affix('a[href="/foo"][up-method="patch"]')
        const $postLink = $nav.affix('a[href="/foo"][up-method="post"]')
        const $deleteLink = $nav.affix('a[href="/foo"][up-method="delete"]')
        up.hello($nav)

        expect($defaultLink).toHaveClass('up-current')
        expect($getLink).toHaveClass('up-current')
        expect($putLink).not.toHaveClass('up-current')
        expect($patchLink).not.toHaveClass('up-current')
        expect($postLink).not.toHaveClass('up-current')
        expect($deleteLink).not.toHaveClass('up-current')
      })

      it('marks URL prefixes as .up-current if an up-alias value ends in *', function() {
        replaceURL('/foo/123')

        const $nav = $fixture('div[up-nav]')
        const $currentLink = $nav.affix('a[href="/x"][up-alias="/aaa /foo/* /bbb"]')
        const $otherLink = $nav.affix('a[href="/y"][up-alias="/bar"]')
        up.hello($nav)

        expect($currentLink).toHaveClass('up-current')
        expect($otherLink).not.toHaveClass('up-current')
      })

      it('marks URL prefixes as .up-current if an up-alias has multiple * placeholders', function() {
        replaceURL('/a-foo-b-bar-c')

        const $nav = $fixture('div[up-nav]')
        const $currentLink = $nav.affix('a[href="/x"][up-alias="*-foo-*-bar-*"]')
        const $otherLink1 = $nav.affix('a[href="/y"][up-alias="/foo-bar"]')
        const $otherLink2 = $nav.affix('a[href="/y"][up-alias="/foo-b-bar"]')
        const $otherLink3 = $nav.affix('a[href="/y"][up-alias="/a-foo-b-bar"]')
        const $otherLink4 = $nav.affix('a[href="/y"][up-alias="/foo-b-bar-c"]')
        const $otherLink5 = $nav.affix('a[href="/y"][up-alias="/a-foo-b-bar-c-d"]')
        up.hello($nav)

        expect($currentLink).toHaveClass('up-current')
        expect($otherLink1).not.toHaveClass('up-current')
        expect($otherLink2).not.toHaveClass('up-current')
        expect($otherLink3).not.toHaveClass('up-current')
        expect($otherLink4).not.toHaveClass('up-current')
        expect($otherLink5).not.toHaveClass('up-current')
      })


      it('allows to configure a custom "current" class in addition to .up-current', function() {
        up.feedback.config.currentClasses.push('highlight')
        replaceURL('/foo')
        const $nav = $fixture('div[up-nav]')
        const $currentLink = $nav.affix('a[href="/foo"]')
        up.hello($nav)

        expect($currentLink).toHaveClass('highlight')
        expect($currentLink).toHaveClass('up-current')
      })

      it('allows to configure multiple additional "current" classes', function() {
        up.feedback.config.currentClasses.push('highlight1')
        up.feedback.config.currentClasses.push('highlight2')
        replaceURL('/foo')
        const $nav = $fixture('div[up-nav]')
        const $currentLink = $nav.affix('a[href="/foo"]')
        up.hello($nav)

        expect($currentLink).toHaveClass('highlight1')
        expect($currentLink).toHaveClass('highlight2')
        expect($currentLink).toHaveClass('up-current')
      })

      it('allows to configure additional nav selectors in up.feedback.config.navSelectors', function() {
        replaceURL('/foo')
        up.feedback.config.navSelectors.push('.navi')
        const $nav = $fixture('div.navi')
        const $currentLink = $nav.affix('a[href="/foo"]')
        const $otherLink = $nav.affix('a[href="/bar"]')
        up.hello($nav)
        expect($currentLink).toHaveClass('up-current')
        expect($otherLink).not.toHaveClass('up-current')
      })

      it('does not process containers with [up-nav=false], even if they match up.feedback.config.navSelectors', function() {
        replaceURL('/foo')
        up.feedback.config.navSelectors.push('.navi')
        const noNav = fixture('div.navi[up-nav=false]')
        const currentLink = e.affix(noNav, 'a[href="/foo"]')
        up.hello(noNav)

        expect(currentLink).not.toHaveClass('up-current')
      })

      it('marks a link as .up-current if the current URL is "/" (bugfix)', function() {
        replaceURL('/')
        const nav = fixture('div[up-nav]')
        const link = e.affix(nav, 'a[href="/"]')
        up.hello(link)
        expect(link).toHaveClass('up-current')
      })

      it('marks a link as .up-current if it links to the current URL if the current URL also has a #hash (bugfix)', function() {
        replaceURL('/foo#hash')
        const container = fixture('.container')
        const nav = e.affix(container, 'div[up-nav]')
        const link = e.affix(nav, 'a[href="/foo"]')
        up.hello(container)
        expect(link).toHaveClass('up-current')
      })

      it('marks a link as .up-current if it links to a #hash and the current URL only has a matching path without a #hash (bugfix)', function() {
        replaceURL('/bar')
        const container = fixture('.container')
        const nav = e.affix(container, 'div[up-nav]')
        const link = e.affix(nav, 'a[href="/bar#hash"]')
        up.hello(container)
        expect(link).toHaveClass('up-current')
      })

      it('marks an expanded link as .up-current', function() {
        replaceURL('/page')
        const nav = fixture('[up-nav]')
        const wrapper = e.affix(nav, '[up-expand]')
        const link = e.affix(wrapper, 'a[href="/page"]')
        up.hello(wrapper)

        expect(link).toHaveClass('up-current')
        expect(wrapper).toHaveClass('up-current')
      })

      it('works with [up-nav=true]', function() {
        replaceURL('/foo')
        const $nav = $fixture('div[up-nav=true]')
        const $currentLink = $nav.affix('a[href="/foo"]')
        const $otherLink = $nav.affix('a[href="/bar"]')
        up.hello($nav)
        expect($currentLink).toHaveClass('up-current')
        expect($otherLink).not.toHaveClass('up-current')
      })

      describe('updating .up-current marks when the URL changes', function() {

        it('marks an existing link as .up-current as it becomes current', async function() {
          replaceURL('/page1')
          fixture('#content', {text: 'content1'})
          const nav = fixture('[up-nav]')
          const link1 = e.affix(nav, 'a[href="/page1"]')
          const link2 = e.affix(nav, 'a[href="/page2"]')
          up.hello(nav)

          expect(link1).toHaveClass('up-current')
          expect(link2).not.toHaveClass('up-current')

          up.render('#content', {content: 'content2', history: true, location: '/page2'})

          await wait()

          expect('#content').toHaveText('content2')
          expect(link1).not.toHaveClass('up-current')
          expect(link2).toHaveClass('up-current')
        })

        it('marks an existing expanded link as .up-current as it becomes current', async function() {
          replaceURL('/page1')
          fixture('#content', {text: 'content1'})
          const nav = fixture('[up-nav]')
          const wrapper1 = e.affix(nav, 'span[up-expand]')
          const link1 = e.affix(wrapper1, 'a[href="/page1"]')
          const wrapper2 = e.affix(nav, 'span[up-expand]')
          const link2 = e.affix(wrapper2, 'a[href="/page2"]')
          up.hello(nav)

          expect(wrapper1).toHaveClass('up-current')
          expect(link1).toHaveClass('up-current')
          expect(wrapper2).not.toHaveClass('up-current')
          expect(link2).not.toHaveClass('up-current')

          up.render('#content', {content: 'content2', history: true, location: '/page2'})

          await wait()

          expect('#content').toHaveText('content2')
          expect(wrapper1).not.toHaveClass('up-current')
          expect(link1).not.toHaveClass('up-current')
          expect(wrapper2).toHaveClass('up-current')
          expect(link2).toHaveClass('up-current')
        })

        it('marks a link as .up-current if it links to the current URL, but is missing a trailing slash', asyncSpec(function(next) {
          const $nav = $fixture('div[up-nav]')
          const $link = $nav.affix('a[href="/fork"][up-target=".main"][up-history]')
          fixture('.main')
          up.hello($nav)

          next(() => {
            Trigger.clickSequence($link)
          })

          next(() => {
            this.respondWith({
              responseHeaders: { 'X-Up-Location': '/fork/' },
              responseText: '<div class="main">new-text</div>'
            })
          })

          next(() => {
            expect($link).toHaveClass('up-current')
          })
        })
        )

        it('marks a link as .up-current if it links to the current URL, but is missing a trailing slash, and has a matching query string', asyncSpec(function(next) {
          const $nav = $fixture('div[up-nav]')
          const $link = $nav.affix('a[href="/fork?foo=1"][up-target=".main"][up-history]')
          fixture('.main')
          up.hello($nav)

          next(() => {
            Trigger.clickSequence($link)
          })

          next(() => {
            this.respondWith({
              responseHeaders: { 'X-Up-Location': '/fork/?foo=1' },
              responseText: '<div class="main">new-text</div>'
            })
          })

          next(() => {
            expect($link).toHaveClass('up-current')
          })
        })
        )

        it('marks a link as .up-current if it links to the current URL, but has an extra trailing slash', asyncSpec(function(next) {
          const $nav = $fixture('div[up-nav]')
          const $link = $nav.affix('a[href="/foo/"][up-target=".main"][up-history]')
          up.hello($nav)

          fixture('.main')
          Trigger.clickSequence($link)

          next(() => {
            this.respondWith({
              responseHeaders: { 'X-Up-Location': '/foo' },
              responseText: '<div class="main">new-text</div>'
            })
          })

          next(() => {
            expect($link).toHaveClass('up-current')
          })
        })
        )

        it('marks a link as .up-current if it links to the current URL, but has an extra trailing slash, and has a matching query string', asyncSpec(function(next) {
          const $nav = $fixture('div[up-nav]')
          const $link = $nav.affix('a[href="/foo/?foo=1"][up-target=".main"][up-history]')
          up.hello($nav)

          fixture('.main')
          Trigger.clickSequence($link)

          next(() => {
            this.respondWith({
              responseHeaders: { 'X-Up-Location': '/foo?foo=1' },
              responseText: '<div class="main">new-text</div>'
            })
          })

          next(() => {
            expect($link).toHaveClass('up-current')
          })
        })
        )

        it("marks a link as .up-current if it links to its own layer's URL, but not when it links to another layer's URL", asyncSpec(function(next) {
          replaceURL('/background-url')

          const nav = fixture('div[up-nav]')
          this.backgroundLinkToBackgroundURL = e.affix(nav, 'a[href="/background-url"]')
          this.backgroundLinkToLayerURL = e.affix(nav, 'a[href="/layer-url"]')
          this.backgroundLinkToOtherURL = e.affix(nav, 'a[href="/other-url"]')
          up.hello(nav)

          next(() => {
            up.layer.open({url: '/layer-url', target: '.layer-content'})
          })

          next(() => {
            this.respondWith(`
              <div class="layer-content" up-nav>
                <a href="/background-url">text</a>
                <a href="/layer-url">text</a>
                <a href="/other-url">text</a>
              </div>
            `)
          })

          next(() => {
            this.layerLinkToBackgroundURL = e.get('.layer-content a[href="/background-url"]')
            this.layerLinkToLayerURL = e.get('.layer-content a[href="/layer-url"]')
            this.layerLinkToOtherURL = e.get('.layer-content a[href="/other-url"]')

            expect(this.backgroundLinkToBackgroundURL).toHaveClass('up-current')
            expect(this.backgroundLinkToLayerURL).not.toHaveClass('up-current')
            expect(this.backgroundLinkToOtherURL).not.toHaveClass('up-current')

            expect(this.layerLinkToBackgroundURL).not.toHaveClass('up-current')
            expect(this.layerLinkToLayerURL).toHaveClass('up-current')
            expect(this.layerLinkToOtherURL).not.toHaveClass('up-current')

            up.layer.dismiss()

            expect(this.backgroundLinkToBackgroundURL).toHaveClass('up-current')
            expect(this.backgroundLinkToLayerURL).not.toHaveClass('up-current')
            expect(this.backgroundLinkToOtherURL).not.toHaveClass('up-current')
          })
        })
        )

        it("marks a link as .up-current if it links to its current layer's URL, even if that layer does not render location", asyncSpec(function(next) {
          replaceURL('/background-url')

          const fragment = `
            <div class="layer-content" up-nav>
              <a href="/background-url">text</a>
              <a href="/layer-url">text</a>
              <a href="/other-url">text</a>
            </div>
          `

          const findLinks = () => {
            this.layerLinkToBackgroundURL = e.get('.layer-content a[href="/background-url"]')
            this.layerLinkToLayerURL = e.get('.layer-content a[href="/layer-url"]')
            this.layerLinkToOtherURL = e.get('.layer-content a[href="/other-url"]')
          }

          next(() => {
            up.layer.open({target: '.layer-content', url: '/layer-url', history: false})
          })

          next(() => {
            this.respondWith(fragment)
          })

          next(() => {
            expect(up.layer.location).toMatchURL('/layer-url')
            expect(location.href).toMatchURL('/background-url')

            findLinks()
            expect(this.layerLinkToBackgroundURL).not.toHaveClass('up-current')
            expect(this.layerLinkToLayerURL).toHaveClass('up-current')
            expect(this.layerLinkToOtherURL).not.toHaveClass('up-current')

            up.navigate({target: '.layer-content', url: '/other-url'})
          })

          next(() => {
            this.respondWith(fragment)
          })

          next(() => {
            findLinks()
            expect(this.layerLinkToBackgroundURL).not.toHaveClass('up-current')
            expect(this.layerLinkToLayerURL).not.toHaveClass('up-current')
            expect(this.layerLinkToOtherURL).toHaveClass('up-current')
          })
        })
        )

        it("respects links that are added to an existing [up-nav] by a fragment update", asyncSpec(function(next) {
          const $nav = $fixture('.nav[up-nav]')
          const $link = $nav.affix('a[href="/foo"][up-target=".main"]')
          const $more = $nav.affix('.more')
          up.hello($nav)

          up.render({fragment: '<div class="more"><a href="/bar"></div>', history: true, location: '/bar'})

          next(() => {
            const $moreLink = $('.more').find('a')
            expect($moreLink).toBeAttached()
            expect($moreLink).toHaveClass('up-current')
          })
        })
        )
      })
    })

    describe('.up-loading', function() {

      it('gives the loading element an .up-loading class', async function() {
        fixture('.target')

        up.render('.target', {url: '/path', feedback: true})

        await wait()

        console.debug("spec: expectation on .up-loading")

        expect('.target').toHaveClass('up-loading')
      })

      it('does not assign the .up-loading class when preloading', async function() {
        fixture('.target')

        up.render('.target', {url: '/path', feedback: true, preload: true})
        await wait()

        expect('.target').not.toHaveClass('up-loading')
      })

      it('does not assign the .up-loading class without a { feedback } option', async function() {
        fixture('.target')

        up.render('.target', {url: '/path'})

        await wait()

        expect('.target').not.toHaveClass('up-loading')
      })

      it('removes the .up-loading class when the fragment was updated', async function() {
        fixture('.target')

        up.render('.target', {url: '/path', feedback: true})

        await wait()

        expect('.target').toHaveClass('up-loading')

        jasmine.respondWithSelector('.target', {text: 'new text'})

        await wait()

        expect('.target').toHaveText('new text')
        expect('.target').not.toHaveClass('up-loading')
      })

      it('removes the .up-loading class when another fragment was updated due to a failed response', async function() {
        fixture('.target')
        fixture('.fail-target')

        const renderJob = up.render('.target', {url: '/path', failTarget: '.fail-target', feedback: true})

        await wait()

        expect('.target').toHaveClass('up-loading')
        jasmine.respondWithSelector('.fail-target', {text: 'new text', status: 422})

        await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

        expect('.fail-target').toHaveText('new text')
        expect('.target').not.toHaveClass('up-loading')
        expect('.fail-target').not.toHaveClass('up-loading')
      })

      it('assigns .load-loading on the correct element if a guard event listeners changes target', async function() {
        fixture('#foo', {text: 'old foo'})
        fixture('#bar', {text: 'old bar'})

        const link = fixture('a[href="/path"][up-target="#foo"]')

        const listener = jasmine.createSpy('follow listener').and.callFake(event => event.renderOptions.target = '#bar')

        link.addEventListener('up:link:follow', listener)

        up.follow(link)

        await wait()

        expect(listener).toHaveBeenCalled()
        expect(jasmine.Ajax.requests.count()).toEqual(1)

        expect('#foo').not.toHaveClass('up-loading')
        expect('#bar').toHaveClass('up-loading')
      })
    })


    describe('.up-active', function() {

      it('marks clicked links as .up-active until the request finishes', asyncSpec(function(next) {
        const $link = $fixture('a[href="/foo"][up-target=".main"]')
        fixture('.main')
        Trigger.clickSequence($link)

        next(() => {
          expect($link).toHaveClass('up-active')

          this.respondWith('<div class="main">new-text</div>')
        })

        next(() => {
          expect($link).not.toHaveClass('up-active')
        })
      })
      )

      it('does not mark a link as .up-active while it is preloading', asyncSpec(function(next) {
        const $link = $fixture('a[href="/foo"][up-target=".main"]')
        fixture('.main')

        up.link.preload($link)

        next(() => {
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect($link).not.toHaveClass('up-active')
        })
      })
      )

      it('does not mark a link as .up-active with [up-feedback=false] attribute', asyncSpec(function(next) {
        const $link = $fixture('a[href="/foo"][up-target=".main"][up-feedback=false]')
        fixture('.main')

        Trigger.clickSequence($link)

        next(() => {
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect($link).not.toHaveClass('up-active')
        })
      })
      )

      it('marks links with [up-instant] on mousedown as .up-active until the request finishes', asyncSpec(function(next) {
        const $link = $fixture('a[href="/foo"][up-instant][up-target=".main"]')
        fixture('.main')
        Trigger.mousedown($link)

        next(() => expect($link).toHaveClass('up-active'))
        next(() => this.respondWith('<div class="main">new-text</div>'))
        next(() => expect($link).not.toHaveClass('up-active'))
      })
      )

      it('prefers to mark an enclosing [up-expand] click area', asyncSpec(function(next) {
        const $area = $fixture('div[up-expand] a[href="/foo"][up-target=".main"]')
        up.hello($area)
        const $link = $area.find('a')
        fixture('.main')
        Trigger.clickSequence($link)

        next(() => {
          expect($link).not.toHaveClass('up-active')
          expect($area).toHaveClass('up-active')
        })
        next(() => {
          this.respondWith('<div class="main">new-text</div>')
        })
        next(() => {
          expect($area).not.toHaveClass('up-active')
        })
      })
      )

      it('removes .up-active when a link with [up-confirm] was not confirmed', asyncSpec(function(next) {
        const $link = $fixture('a[href="/foo"][up-target=".main"][up-confirm="Really follow?"]')
        spyOn(up.browser, 'assertConfirmed').and.throwError(new up.Aborted('User aborted'))

        Trigger.clickSequence($link)

        next(() => {
          expect($link).not.toHaveClass('up-active')
        })
      })
      )

      it('marks clicked modal openers as .up-active while the modal is loading', asyncSpec(function(next) {
        const $link = $fixture('a[href="/foo"][up-target=".main"]')
        fixture('.main')
        Trigger.clickSequence($link)

        next(() => expect($link).toHaveClass('up-active'))
        next(() => this.respondWith('<div class="main">new-text</div>'))
        next(() => expect($link).not.toHaveClass('up-active'))
      })
      )

      it('removes .up-active from a clicked modal opener if the target is already preloaded (bugfix)', asyncSpec(function(next) {
        const $link = $fixture('a[href="/foo"][up-target=".main"][up-layer="new modal"]')
        up.hello($link)
        up.link.preload($link)

        next(() => {
          this.respondWith('<div class="main">new-text</div>')
        })
        next(() => {
          Trigger.clickSequence($link)
        })
        next(() => {
          expect('up-modal .main').toHaveText('new-text')
          expect($link).not.toHaveClass('up-active')
        })
      })
      )

      it('removes .up-active from a clicked link if the target is already preloaded (bugfix)', asyncSpec(function(next) {
        const $link = $fixture('a[href="/foo"][up-target=".main"]')
        fixture('.main')
        up.link.preload($link)

        next(() => this.respondWith('<div class="main">new-text</div>'))
        next(() => Trigger.clickSequence($link))
        next(() => {
          expect('.main').toHaveText('new-text')
          expect($link).not.toHaveClass('up-active')
        })
      })
      )

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
          await wait(10)
        }) // waiting for a single task does not work for some reason

        expect(link).not.toHaveClass('up-active')
      })
    })
  })
})
