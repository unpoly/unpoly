u = up.util
e = up.element
$ = jQuery

describe 'up.feedback', ->

  beforeEach ->
    up.history.config.enabled = true
    up.motion.config.enabled = false

  describe 'unobtrusive behavior', ->

    describe '[up-nav]', ->

      it 'marks a child link as .up-current if it links to the current URL', ->
        up.history.replace('/foo')
        $nav = $fixture('div[up-nav]')
        $currentLink = $nav.affix('a[href="/foo"]')
        $otherLink = $nav.affix('a[href="/bar"]')
        up.hello($nav)
        expect($currentLink).toHaveClass('up-current')
        expect($otherLink).not.toHaveClass('up-current')

      it 'marks the element as .up-current if it is also a link to the current URL', ->
        up.history.replace('/foo')
        $currentLink = $fixture('a[href="/foo"][up-nav]')
        $otherLink = $fixture('a[href="/bar"][up-nav]')
        up.hello($currentLink)
        up.hello($otherLink)
        expect($currentLink).toHaveClass('up-current')
        expect($otherLink).not.toHaveClass('up-current')

      it 'does not mark a link as .up-current if the link is outside an [up-nav]', ->
        up.history.replace('/foo')
        $nav = $fixture('div[up-nav]')
        $currentLinkInNav = $nav.affix('a[href="/foo"]')
        $currentLinkOutsideNav = $fixture('a[href="/foo"]')
        up.hello($nav)
        expect($currentLinkInNav).toHaveClass('up-current')
        expect($currentLinkOutsideNav).not.toHaveClass('up-current')

      it 'marks any link as .up-current if its up-href attribute matches the current URL', ->
        up.history.replace('/foo')
        $nav = $fixture('div[up-nav]')
        $currentLink = $nav.affix('span[up-href="/foo"]')
        $otherLink = $nav.affix('span[up-href="/bar"]')
        up.hello($nav)
        expect($currentLink).toHaveClass('up-current')
        expect($otherLink).not.toHaveClass('up-current')

      it 'matches the current and destination URLs if they only differ by a trailing slash', ->
        up.history.replace('/foo')
        $nav = $fixture('div[up-nav]')
        $currentLink = $nav.affix('span[up-href="/foo/"]')
        up.hello($nav)
        expect($currentLink).toHaveClass('up-current')

      it 'does not match the current and destination URLs if they differ in the search', ->
        up.history.replace('/foo?q=1')
        $nav = $fixture('div[up-nav]')
        $currentLink = $nav.affix('span[up-href="/foo?q=2"]')
        up.hello($nav)
        expect($currentLink).not.toHaveClass('up-current')

      it 'marks any link as .up-current if any of its space-separated up-alias values matches the current URL', ->
        up.history.replace('/foo')
        $nav = $fixture('div[up-nav]')
        $currentLink = $nav.affix('a[href="/x"][up-alias="/aaa /foo /bbb"]')
        $otherLink = $nav.affix('a[href="/y"][up-alias="/bar"]')
        up.hello($nav)
        expect($currentLink).toHaveClass('up-current')
        expect($otherLink).not.toHaveClass('up-current')

      it 'does not throw if the current location does not match an up-alias wildcard (bugfix)', ->
        inserter = -> up.hello(fixture('a[up-nav][up-alias="/qqqq*"]'))
        expect(inserter).not.toThrow()

      it 'does not highlight a link to "#" (commonly used for JS-only buttons)', ->
        $nav = $fixture('div[up-nav]')
        $link = $nav.affix('a[href="#"]')
        up.hello($nav)
        expect($link).not.toHaveClass('up-current')

      it 'does not highlight links with unsafe methods', ->
        up.history.replace('/foo')
        $nav = $fixture('div[up-nav]')
        $defaultLink = $nav.affix('a[href="/foo"]')
        $getLink = $nav.affix('a[href="/foo"][up-method="get"]')
        $putLink = $nav.affix('a[href="/foo"][up-method="put"]')
        $patchLink = $nav.affix('a[href="/foo"][up-method="patch"]')
        $postLink = $nav.affix('a[href="/foo"][up-method="post"]')
        $deleteLink = $nav.affix('a[href="/foo"][up-method="delete"]')
        up.hello($nav)

        expect($defaultLink).toHaveClass('up-current')
        expect($getLink).toHaveClass('up-current')
        expect($putLink).not.toHaveClass('up-current')
        expect($patchLink).not.toHaveClass('up-current')
        expect($postLink).not.toHaveClass('up-current')
        expect($deleteLink).not.toHaveClass('up-current')

      it 'marks URL prefixes as .up-current if an up-alias value ends in *', ->
        up.history.replace('/foo/123')

        $nav = $fixture('div[up-nav]')
        $currentLink = $nav.affix('a[href="/x"][up-alias="/aaa /foo/* /bbb"]')
        $otherLink = $nav.affix('a[href="/y"][up-alias="/bar"]')
        up.hello($nav)

        expect($currentLink).toHaveClass('up-current')
        expect($otherLink).not.toHaveClass('up-current')

      it 'marks URL prefixes as .up-current if an up-alias has multiple * placeholders', ->
        up.history.replace('/a-foo-b-bar-c')

        $nav = $fixture('div[up-nav]')
        $currentLink = $nav.affix('a[href="/x"][up-alias="*-foo-*-bar-*"]')
        $otherLink1 = $nav.affix('a[href="/y"][up-alias="/foo-bar"]')
        $otherLink2 = $nav.affix('a[href="/y"][up-alias="/foo-b-bar"]')
        $otherLink3 = $nav.affix('a[href="/y"][up-alias="/a-foo-b-bar"]')
        $otherLink4 = $nav.affix('a[href="/y"][up-alias="/foo-b-bar-c"]')
        $otherLink5 = $nav.affix('a[href="/y"][up-alias="/a-foo-b-bar-c-d"]')
        up.hello($nav)

        expect($currentLink).toHaveClass('up-current')
        expect($otherLink1).not.toHaveClass('up-current')
        expect($otherLink2).not.toHaveClass('up-current')
        expect($otherLink3).not.toHaveClass('up-current')
        expect($otherLink4).not.toHaveClass('up-current')
        expect($otherLink5).not.toHaveClass('up-current')


      it 'allows to configure a custom "current" class in addition to .up-current', ->
        up.feedback.config.currentClasses.push('highlight')
        up.history.replace('/foo')
        $nav = $fixture('div[up-nav]')
        $currentLink = $nav.affix('a[href="/foo"]')
        up.hello($nav)

        expect($currentLink).toHaveClass('highlight')
        expect($currentLink).toHaveClass('up-current')

      it 'allows to configure multiple additional "current" classes', ->
        up.feedback.config.currentClasses.push('highlight1')
        up.feedback.config.currentClasses.push('highlight2')
        up.history.replace('/foo')
        $nav = $fixture('div[up-nav]')
        $currentLink = $nav.affix('a[href="/foo"]')
        up.hello($nav)

        expect($currentLink).toHaveClass('highlight1')
        expect($currentLink).toHaveClass('highlight2')
        expect($currentLink).toHaveClass('up-current')

      it 'allows to configure additional nav selectors', ->
        up.history.replace('/foo')
        up.feedback.config.navSelectors.push('.navi')
        $nav = $fixture('div.navi')
        $currentLink = $nav.affix('a[href="/foo"]')
        $otherLink = $nav.affix('a[href="/bar"]')
        up.hello($nav)
        expect($currentLink).toHaveClass('up-current')
        expect($otherLink).not.toHaveClass('up-current')

      describeCapability 'canPushState', ->

        describe 'updating .up-current marks when the URL changes', ->

          it 'marks a link as .up-current if it links to the current URL, but is missing a trailing slash', asyncSpec (next) ->
            $nav = $fixture('div[up-nav]')
            $link = $nav.affix('a[href="/fork"][up-target=".main"][up-history]')
            fixture('.main')
            up.hello($nav)

            next =>
              Trigger.clickSequence($link)

            next =>
              @respondWith
                responseHeaders: { 'X-Up-Location': '/fork/' }
                responseText: '<div class="main">new-text</div>'

            next =>
              expect($link).toHaveClass('up-current')

          it 'marks a link as .up-current if it links to the current URL, but has an extra trailing slash', asyncSpec (next) ->
            $nav = $fixture('div[up-nav]')
            $link = $nav.affix('a[href="/foo/"][up-target=".main"][up-history]')
            up.hello($nav)

            fixture('.main')
            Trigger.clickSequence($link)

            next =>
              @respondWith
                responseHeaders: { 'X-Up-Location': '/foo' }
                responseText: '<div class="main">new-text</div>'

            next =>
              expect($link).toHaveClass('up-current')

          it "marks a link as .up-current if it links to its own layer's URL, but not when it links to another layer's URL", asyncSpec (next) ->
            up.history.replace('/background-url')

            nav = fixture('div[up-nav]')
            @backgroundLinkToBackgroundURL = e.affix(nav, 'a[href="/background-url"]')
            @backgroundLinkToLayerURL = e.affix(nav, 'a[href="/layer-url"]')
            @backgroundLinkToOtherURL = e.affix(nav, 'a[href="/other-url"]')
            up.hello(nav)

            next =>
              up.layer.open(url: '/layer-url', target: '.layer-content')

            next =>
              @respondWith """
                <div class="layer-content" up-nav>
                  <a href="/background-url">text</a>
                  <a href="/layer-url">text</a>
                  <a href="/other-url">text</a>
                </div>
              """

            next =>
              @layerLinkToBackgroundURL = e.get('.layer-content a[href="/background-url"]')
              @layerLinkToLayerURL = e.get('.layer-content a[href="/layer-url"]')
              @layerLinkToOtherURL = e.get('.layer-content a[href="/other-url"]')

              expect(@backgroundLinkToBackgroundURL).toHaveClass('up-current')
              expect(@backgroundLinkToLayerURL).not.toHaveClass('up-current')
              expect(@backgroundLinkToOtherURL).not.toHaveClass('up-current')

              expect(@layerLinkToBackgroundURL).not.toHaveClass('up-current')
              expect(@layerLinkToLayerURL).toHaveClass('up-current')
              expect(@layerLinkToOtherURL).not.toHaveClass('up-current')

              next.await up.layer.dismiss()

            next =>
              expect(@backgroundLinkToBackgroundURL).toHaveClass('up-current')
              expect(@backgroundLinkToLayerURL).not.toHaveClass('up-current')
              expect(@backgroundLinkToOtherURL).not.toHaveClass('up-current')

          it "marks a link as .up-current if it links to its current layer's URL, even if that layer does not render location zzz", asyncSpec (next) ->
            up.history.replace('/background-url')

            fragment = """
              <div class="layer-content" up-nav>
                <a href="/background-url">text</a>
                <a href="/layer-url">text</a>
                <a href="/other-url">text</a>
              </div>
            """

            findLinks = =>
              @layerLinkToBackgroundURL = e.get('.layer-content a[href="/background-url"]')
              @layerLinkToLayerURL = e.get('.layer-content a[href="/layer-url"]')
              @layerLinkToOtherURL = e.get('.layer-content a[href="/other-url"]')

            next =>
              up.layer.open(target: '.layer-content', url: '/layer-url', history: false)

            next =>
              @respondWith(fragment)

            next =>
              expect(up.layer.location).toMatchURL('/layer-url')
              expect(location.href).toMatchURL('/background-url')

              findLinks()
              expect(@layerLinkToBackgroundURL).not.toHaveClass('up-current')
              expect(@layerLinkToLayerURL).toHaveClass('up-current')
              expect(@layerLinkToOtherURL).not.toHaveClass('up-current')

              up.navigate(target: '.layer-content', url: '/other-url')

            next =>
              @respondWith(fragment)

            next =>
              findLinks()
              expect(@layerLinkToBackgroundURL).not.toHaveClass('up-current')
              expect(@layerLinkToLayerURL).not.toHaveClass('up-current')
              expect(@layerLinkToOtherURL).toHaveClass('up-current')

          it "respects links that are added to an existing [up-nav] by a fragment update", asyncSpec (next) ->
            $nav = $fixture('.nav[up-nav]')
            $link = $nav.affix('a[href="/foo"][up-target=".main"]')
            $more = $nav.affix('.more')
            up.hello($nav)

            up.render(fragment: '<div class="more"><a href="/bar"></div>', history: true, location: '/bar')

            next =>
              $moreLink = $('.more').find('a')
              expect($moreLink).toBeAttached()
              expect($moreLink).toHaveClass('up-current')


    describe '.up-active', ->

      describeCapability 'canPushState', ->

        it 'marks clicked links as .up-active until the request finishes', asyncSpec (next) ->
          $link = $fixture('a[href="/foo"][up-target=".main"]')
          fixture('.main')
          Trigger.clickSequence($link)

          next =>
            expect($link).toHaveClass('up-active')
            @respondWith('<div class="main">new-text</div>')

          next =>
            expect($link).not.toHaveClass('up-active')

        it 'does not mark a link as .up-active while it is preloading', asyncSpec (next) ->
          $link = $fixture('a[href="/foo"][up-target=".main"]')
          fixture('.main')

          up.link.preload($link)

          next =>
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect($link).not.toHaveClass('up-active')

        it 'marks links with [up-instant] on mousedown as .up-active until the request finishes', asyncSpec (next) ->
          $link = $fixture('a[href="/foo"][up-instant][up-target=".main"]')
          fixture('.main')
          Trigger.mousedown($link)

          next => expect($link).toHaveClass('up-active')
          next => @respondWith('<div class="main">new-text</div>')
          next => expect($link).not.toHaveClass('up-active')

        it 'prefers to mark an enclosing [up-expand] click area', asyncSpec (next) ->
          $area = $fixture('div[up-expand] a[href="/foo"][up-target=".main"]')
          up.hello($area)
          $link = $area.find('a')
          fixture('.main')
          Trigger.clickSequence($link)

          next =>
            expect($link).not.toHaveClass('up-active')
            expect($area).toHaveClass('up-active')
          next =>
            @respondWith('<div class="main">new-text</div>')
          next =>
            expect($area).not.toHaveClass('up-active')

        it 'removes .up-active when a link with [up-confirm] was not confirmed', asyncSpec (next) ->
          $link = $fixture('a[href="/foo"][up-target=".main"][up-confirm="Really follow?"]')
          spyOn(up.browser, 'whenConfirmed').and.returnValue(Promise.reject('User aborted'))

          Trigger.clickSequence($link)

          next =>
            expect($link).not.toHaveClass('up-active')

        it 'marks clicked modal openers as .up-active while the modal is loading', asyncSpec (next) ->
          $link = $fixture('a[href="/foo"][up-target=".main"]')
          fixture('.main')
          Trigger.clickSequence($link)

          next => expect($link).toHaveClass('up-active')
          next => @respondWith('<div class="main">new-text</div>')
          next => expect($link).not.toHaveClass('up-active')

        it 'removes .up-active from a clicked modal opener if the target is already preloaded (bugfix)', asyncSpec (next) ->
          $link = $fixture('a[href="/foo"][up-target=".main"][up-layer=modal]')
          up.hello($link)
          up.link.preload($link)

          next =>
            @respondWith('<div class="main">new-text</div>')
          next =>
            Trigger.clickSequence($link)
          next =>
            expect('up-modal .main').toHaveText('new-text')
            expect($link).not.toHaveClass('up-active')

        it 'removes .up-active from a clicked link if the target is already preloaded (bugfix)', asyncSpec (next) ->
          $link = $fixture('a[href="/foo"][up-target=".main"]')
          fixture('.main')
          up.link.preload($link)

          next => @respondWith('<div class="main">new-text</div>')
          next => Trigger.clickSequence($link)
          next =>
            expect('.main').toHaveText('new-text')
            expect($link).not.toHaveClass('up-active')

        it 'removes .up-active from a clicked link if the request fails (bugfix)', asyncSpec (next) ->
          $link = $fixture('a[href="/foo"][up-target=".main"]')
          fixture('.main')
          Trigger.clickSequence($link)

          next =>
            expect($link).toHaveClass('up-active')
#            @respondWith
#              responseText: '<div class="main">failed</div>'
#              status: 400
#
#          next =>
#            expect($link).not.toHaveClass('up-active')
