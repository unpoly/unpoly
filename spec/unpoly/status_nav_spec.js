const e = up.element
const $ = jQuery

extendDescribe('up.status', function() {

  // Copied from status_spec.js. Not up.history.replace(), since that fires
  // up:location:changed which up.status listens to.
  function replaceURL(url) {
    history.replaceState({}, 'title', url)
  }

  extendDescribe('unobtrusive behavior', function() {

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

        up.render('#container', { content: '<a href="/bar">label</a>', history: true, location: '/bar' })
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
        const inserter = () => helloFixture('a[up-nav][up-alias="/qqqq*"]')
        expect(inserter).not.toThrow()
      })

      describe('setting [up-alias] from a macro', function() {

        it('works with up.hello()', async function() {
          replaceURL('/bar')

          up.macro('#link', (link) => link.setAttribute('up-alias', '/bar'))

          const nav = htmlFixture(`
            <div up-nav>
              <a id="link" href="/foo">label</a>
            </div>
          `)

          await up.hello(nav)

          expect('#link').toHaveAttribute('up-alias', '/bar')
          expect('#link').toHaveClass('up-current')
        })

        it('works when rendering the nav', async function() {
          replaceURL('/bar')

          up.macro('#link', (link) => link.setAttribute('up-alias', '/bar'))

          await up.hello(htmlFixture(`
            <div up-nav id="nav">
              navigation will render here
            </div>
          `))

          await up.render({
            fragment: `
              <div up-nav id="nav">
                <a id="link" href="/foo">label</a>
              </div>
            `
          })

          expect('#link').toHaveAttribute('up-alias', '/bar')
          expect('#link').toHaveClass('up-current')
        })

        it('works when navigating to another page', async function() {
          replaceURL('/qux')

          up.macro('#link', (link) => link.setAttribute('up-alias', '/bar'))

          const [app, nav, content] = htmlFixtureList(`
            <div id="app">
              <div up-nav>
                <a id="link" href="/foo">label</a>
              </div>

              <div id="content">
                old content
              </div>
            </div>
          `)

          await up.hello(app)

          expect(up.history.location).toMatchURL('/qux')
          expect('#link').toHaveAttribute('up-alias', '/bar')
          expect('#link').not.toHaveClass('up-current')

          await up.render({
            history: true,
            location: '/bar',
            fragment: `
              <div id="content">
                new content
              </div>
            `
          })

          expect(up.history.location).toMatchURL('/bar')
          expect('#link').toHaveClass('up-current')
        })

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
        up.status.config.currentClasses.push('highlight')
        replaceURL('/foo')
        const $nav = $fixture('div[up-nav]')
        const $currentLink = $nav.affix('a[href="/foo"]')
        up.hello($nav)

        expect($currentLink).toHaveClass('highlight')
        expect($currentLink).toHaveClass('up-current')
      })

      it('allows to configure multiple additional "current" classes', function() {
        up.status.config.currentClasses.push('highlight1')
        up.status.config.currentClasses.push('highlight2')
        replaceURL('/foo')
        const $nav = $fixture('div[up-nav]')
        const $currentLink = $nav.affix('a[href="/foo"]')
        up.hello($nav)

        expect($currentLink).toHaveClass('highlight1')
        expect($currentLink).toHaveClass('highlight2')
        expect($currentLink).toHaveClass('up-current')
      })

      it('allows to configure additional nav selectors in up.status.config.navSelectors', function() {
        replaceURL('/foo')
        up.status.config.navSelectors.push('.navi')
        const $nav = $fixture('div.navi')
        const $currentLink = $nav.affix('a[href="/foo"]')
        const $otherLink = $nav.affix('a[href="/bar"]')
        up.hello($nav)
        expect($currentLink).toHaveClass('up-current')
        expect($otherLink).not.toHaveClass('up-current')
      })

      it('does not process containers with [up-nav=false], even if they match up.status.config.navSelectors', function() {
        replaceURL('/foo')
        up.status.config.navSelectors.push('.navi')
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

      it("respects links that are added to an existing [up-nav] by a fragment update", async function() {
        const $nav = $fixture('.nav[up-nav]')
        const $link = $nav.affix('a[href="/foo"][up-target=".main"]')
        const $more = $nav.affix('.more')
        up.hello($nav)

        up.render({ fragment: '<div class="more"><a href="/bar"></div>', history: true, location: '/bar' })

        await wait()

        const $moreLink = $('.more').find('a')
        expect($moreLink).toBeAttached()
        expect($moreLink).toHaveClass('up-current')
      })

      describe('updating .up-current marks when the URL changes', function() {

        it('marks an existing link as .up-current as it becomes current', async function() {
          replaceURL('/page1')
          fixture('#content', { text: 'content1' })
          const nav = fixture('[up-nav]')
          const link1 = e.affix(nav, 'a[href="/page1"]')
          const link2 = e.affix(nav, 'a[href="/page2"]')
          up.hello(nav)

          expect(link1).toHaveClass('up-current')
          expect(link2).not.toHaveClass('up-current')

          up.render('#content', { content: 'content2', history: true, location: '/page2' })

          await wait()

          expect('#content').toHaveText('content2')
          expect(link1).not.toHaveClass('up-current')
          expect(link2).toHaveClass('up-current')
        })

        it('marks an existing expanded link as .up-current as it becomes current', async function() {
          replaceURL('/page1')
          fixture('#content', { text: 'content1' })
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

          up.render('#content', { content: 'content2', history: true, location: '/page2' })

          await wait()

          expect('#content').toHaveText('content2')
          expect(wrapper1).not.toHaveClass('up-current')
          expect(link1).not.toHaveClass('up-current')
          expect(wrapper2).toHaveClass('up-current')
          expect(link2).toHaveClass('up-current')
        })

        it('marks a link as .up-current if it links to the current URL, but is missing a trailing slash', async function() {
          const $nav = $fixture('div[up-nav]')
          const $link = $nav.affix('a[href="/fork"][up-target=".main"][up-history]')
          fixture('.main')
          up.hello($nav)

          await wait()

          Trigger.clickSequence($link)

          await wait()

          jasmine.respondWith({
            responseHeaders: { 'X-Up-Location': '/fork/' },
            responseText: '<div class="main">new-text</div>'
          })

          await wait()

          expect($link).toHaveClass('up-current')
        })

        it('marks a link as .up-current if it links to the current URL, but is missing a trailing slash', async function() {
          const $nav = $fixture('div[up-nav]')
          const $link = $nav.affix('a[href="/fork"][up-target=".main"][up-history]')
          fixture('.main')
          up.hello($nav)

          await wait()

          Trigger.clickSequence($link)

          await wait()

          jasmine.respondWith({
            responseHeaders: { 'X-Up-Location': '/fork/' },
            responseText: '<div class="main">new-text</div>'
          })

          await wait()

          expect($link).toHaveClass('up-current')
        })

        it('marks a link as .up-current if it links to the current URL, but has an extra trailing slash', async function() {
          const $nav = $fixture('div[up-nav]')
          const $link = $nav.affix('a[href="/foo/"][up-target=".main"][up-history]')
          up.hello($nav)

          fixture('.main')

          await wait()

          Trigger.clickSequence($link)

          await wait()

          jasmine.respondWith({
            responseHeaders: { 'X-Up-Location': '/foo' },
            responseText: '<div class="main">new-text</div>'
          })

          await wait()

          expect($link).toHaveClass('up-current')
        })

        it('marks a link as .up-current if it links to the current URL, but has an extra trailing slash, and has a matching query string', async function() {
          const $nav = $fixture('div[up-nav]')
          const $link = $nav.affix('a[href="/foo/?foo=1"][up-target=".main"][up-history]')
          up.hello($nav)

          fixture('.main')

          await wait()

          Trigger.clickSequence($link)

          await wait()

          jasmine.respondWith({
            responseHeaders: { 'X-Up-Location': '/foo?foo=1' },
            responseText: '<div class="main">new-text</div>'
          })

          await wait()

          expect($link).toHaveClass('up-current')
        })

      })

      describe('with layers', function() {

        it("marks a link as .up-current if it links to its own layer's URL, but not when it links to another layer's URL", async function() {
          replaceURL('/background-url')

          const nav = fixture('div[up-nav]')
          this.backgroundLinkToBackgroundURL = e.affix(nav, 'a[href="/background-url"]')
          this.backgroundLinkToLayerURL = e.affix(nav, 'a[href="/layer-url"]')
          this.backgroundLinkToOtherURL = e.affix(nav, 'a[href="/other-url"]')
          up.hello(nav)

          await wait()

          up.layer.open({ url: '/layer-url', target: '.layer-content' })

          await wait()

          jasmine.respondWith(`
            <div class="layer-content" up-nav>
              <a href="/background-url">text</a>
              <a href="/layer-url">text</a>
              <a href="/other-url">text</a>
            </div>
          `)

          await wait()

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

        it("allows links to observe an ancestor layer with an [up-layer] attribute", async function() {
          replaceURL('/background-url')

          fixture('.background-content')

          up.layer.open({ url: '/layer-url', target: '.layer-content', history: true })

          await wait()

          jasmine.respondWith(`
            <div class="layer-content" up-nav up-layer="root">
              <a class="layer-link" href="/background-url">text</a>
              <a class="layer-link" href="/layer-url">text</a>
              <a class="layer-link" href="/other-url">text</a>
            </div>
          `)

          await wait()

          expect(up.layer.current).toBeOverlay()
          expect(up.layer.current.location).toMatchURL('/layer-url')

          const layerLinkToBackgroundURL = e.get('.layer-content a[href="/background-url"]')
          const layerLinkToLayerURL = e.get('.layer-content a[href="/layer-url"]')
          const layerLinkToOtherURL = e.get('.layer-content a[href="/other-url"]')

          expect(layerLinkToBackgroundURL).toHaveClass('up-current')
          expect(layerLinkToLayerURL).not.toHaveClass('up-current')
          expect(layerLinkToOtherURL).not.toHaveClass('up-current')

          up.render({ layer: 'root', target: '.background-content', content: 'new content', history: true, location: '/other-url' })
          await wait()


          expect(layerLinkToBackgroundURL).not.toHaveClass('up-current')
          expect(layerLinkToLayerURL).not.toHaveClass('up-current')
          expect(layerLinkToOtherURL).toHaveClass('up-current')
        })

        it("allows links to observe a descendant layer with an [up-layer] attribute", async function() {
          replaceURL('/background-url')

          fixture('.background-content')

          const nav = fixture('div[up-nav][up-layer="overlay"]')
          const backgroundLinkToBackgroundURL = e.affix(nav, 'a[href="/background-url"]')
          const backgroundLinkToLayerURL = e.affix(nav, 'a[href="/layer-url"]')
          const backgroundLinkToOtherURL = e.affix(nav, 'a[href="/other-url"]')
          up.hello(nav)

          await wait()

          // Because no matching layer is open, no link is current.
          expect(backgroundLinkToBackgroundURL).not.toHaveClass('up-current')
          expect(backgroundLinkToLayerURL).not.toHaveClass('up-current')
          expect(backgroundLinkToOtherURL).not.toHaveClass('up-current')

          up.layer.open({ url: '/layer-url', target: '.layer-content', history: true })

          await wait()

          jasmine.respondWith(`
            <div class="layer-content">
              overlay text
            </div>
          `)

          await wait()

          expect(up.layer.current).toBeOverlay()
          expect(up.layer.current.location).toMatchURL('/layer-url')
          expect(backgroundLinkToBackgroundURL).not.toHaveClass('up-current')
          expect(backgroundLinkToLayerURL).toHaveClass('up-current')
          expect(backgroundLinkToOtherURL).not.toHaveClass('up-current')

          up.render({ layer: 'overlay', target: '.layer-content', content: 'new overlay content', history: true, location: '/other-url' })
          await wait()

          expect(up.layer.current).toBeOverlay()
          expect(up.layer.current.location).toMatchURL('/other-url')
          expect(backgroundLinkToBackgroundURL).not.toHaveClass('up-current')
          expect(backgroundLinkToLayerURL).not.toHaveClass('up-current')
          expect(backgroundLinkToOtherURL).toHaveClass('up-current')

          up.layer.dismiss()
          await wait()

          expect(up.layer.current).toBeRootLayer()
          expect(up.layer.current.location).toMatchURL('/background-url')

          // Because no matching layer is open, no link is current.
          expect(backgroundLinkToBackgroundURL).not.toHaveClass('up-current')
          expect(backgroundLinkToLayerURL).not.toHaveClass('up-current')
          expect(backgroundLinkToOtherURL).not.toHaveClass('up-current')
        })

        it('allows links to observe multiple layers with an [up-layer] attribute, setting up-current if at least one layer matches', async function() {
          replaceURL('/background-url')

          fixture('.background-content')

          up.layer.open({ url: '/layer-url', target: '.layer-content', history: true })

          await wait()

          jasmine.respondWith(`
            <div class="layer-content" up-nav up-layer="any">
              <a class="layer-link" href="/background-url">text</a>
              <a class="layer-link" href="/layer-url">text</a>
              <a class="layer-link" href="/other-url">text</a>
            </div>
          `)

          await wait()

          expect(up.layer.current).toBeOverlay()
          expect(up.layer.current.location).toMatchURL('/layer-url')

          const layerLinkToBackgroundURL = e.get('.layer-content a[href="/background-url"]')
          const layerLinkToLayerURL = e.get('.layer-content a[href="/layer-url"]')
          const layerLinkToOtherURL = e.get('.layer-content a[href="/other-url"]')

          expect(layerLinkToBackgroundURL).toHaveClass('up-current')
          expect(layerLinkToLayerURL).toHaveClass('up-current')
          expect(layerLinkToOtherURL).not.toHaveClass('up-current')

          up.render({ layer: 'root', target: '.background-content', content: 'new content', history: true, location: '/other-url' })
          await wait()

          expect(layerLinkToBackgroundURL).not.toHaveClass('up-current')
          expect(layerLinkToLayerURL).toHaveClass('up-current')
          expect(layerLinkToOtherURL).toHaveClass('up-current')
        })

        it("marks a link as .up-current if it links to its current layer's URL, even if that layer does not render location", async function() {
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

          await wait()

          up.layer.open({ target: '.layer-content', url: '/layer-url', history: false })

          await wait()

          jasmine.respondWith(fragment)

          await wait()

          expect(up.layer.location).toMatchURL('/layer-url')
          expect(location.href).toMatchURL('/background-url')

          findLinks()
          expect(this.layerLinkToBackgroundURL).not.toHaveClass('up-current')
          expect(this.layerLinkToLayerURL).toHaveClass('up-current')
          expect(this.layerLinkToOtherURL).not.toHaveClass('up-current')

          up.navigate({ target: '.layer-content', url: '/other-url' })

          await wait()

          jasmine.respondWith(fragment)

          await wait()

          findLinks()
          expect(this.layerLinkToBackgroundURL).not.toHaveClass('up-current')
          expect(this.layerLinkToLayerURL).not.toHaveClass('up-current')
          expect(this.layerLinkToOtherURL).toHaveClass('up-current')
        })

      })
    })

  })

})
