u = up.util
$ = jQuery

describe 'up.link', ->

  u = up.util

  describe 'JavaScript functions', ->
  
    describe 'up.follow', ->

      it 'emits a preventable up:link:follow event', asyncSpec (next) ->
        $link = $fixture('a[href="/destination"][up-target=".response"]')

        listener = jasmine.createSpy('follow listener').and.callFake (event) ->
          event.preventDefault()

        $link.on('up:link:follow', listener)

        up.follow($link)

        next =>
          expect(listener).toHaveBeenCalled()
          event = listener.calls.mostRecent().args[0]
          expect(event.target).toEqual($link[0])

          # No request should be made because we prevented the event
          expect(jasmine.Ajax.requests.count()).toEqual(0)

      describeCapability 'canPushState', ->

        it 'loads the given link via AJAX and replaces the response in the given target', asyncSpec (next) ->
          $fixture('.before').text('old-before')
          $fixture('.middle').text('old-middle')
          $fixture('.after').text('old-after')
          $link = $fixture('a[href="/path"][up-target=".middle"]')

          up.follow($link)

          next =>
            @respondWith """
              <div class="before">new-before</div>
              <div class="middle">new-middle</div>
              <div class="after">new-after</div>
              """

          next =>
            expect($('.before')).toHaveText('old-before')
            expect($('.middle')).toHaveText('new-middle')
            expect($('.after')).toHaveText('old-after')

        it 'uses the method from a data-method attribute', asyncSpec (next) ->
          $link = $fixture('a[href="/path"][data-method="PUT"]')
          up.follow($link)

          next =>
            request = @lastRequest()
            expect(request).toHaveRequestMethod('PUT')

        it 'allows to refer to the link itself as "&" in the CSS selector', asyncSpec (next) ->
          $container = $fixture('div')
          $link1 = $('<a id="first" href="/path" up-target="&">first-link</a>').appendTo($container)
          $link2 = $('<a id="second" href="/path" up-target="&">second-link</a>').appendTo($container)
          up.follow($link2)

          next => @respondWith '<div id="second">second-div</div>'
          next => expect($container.text()).toBe('first-linksecond-div')

        it 'adds history entries and allows the user to use the back and forward buttons', asyncSpec (next) ->
          up.history.config.enabled = true

          waitForBrowser = 300

          # By default, up.history will replace the <body> tag when
          # the user presses the back-button. We reconfigure this
          # so we don't lose the Jasmine runner interface.
          up.history.config.restoreTargets = ['.container']

          respondWith = (html, title) =>
            @respondWith
              status: 200
              contentType: 'text/html'
              responseText: "<div class='container'><div class='target'>#{html}</div></div>"
              responseHeaders: { 'X-Up-Title': title }

#          followAndRespond = ($link, html, title) ->
#            promise = up.follow($link)
#            respondWith(html, title)
#            promise

          up.fragment.config.autoHistoryTargets.push('.target')

          $link1 = $fixture('a[href="/one"][up-target=".target"]')
          $link2 = $fixture('a[href="/two"][up-target=".target"]')
          $link3 = $fixture('a[href="/three"][up-target=".target"]')
          $container = $fixture('.container')
          $target = $fixture('.target').appendTo($container).text('original text')

          up.follow($link1)

          next =>
            respondWith('text from one', 'title from one')

          next =>
            expect($('.target')).toHaveText('text from one')
            expect(location.pathname).toEqual('/one')
            expect(document.title).toEqual('title from one')

            up.follow($link2)

          next =>
            respondWith('text from two', 'title from two')

          next =>
            expect($('.target')).toHaveText('text from two')
            expect(location.pathname).toEqual('/two')
            expect(document.title).toEqual('title from two')

            up.follow($link3)

          next =>
            respondWith('text from three', 'title from three')

          next =>
            expect($('.target')).toHaveText('text from three')
            expect(location.pathname).toEqual('/three')
            expect(document.title).toEqual('title from three')

            history.back()

          next.after waitForBrowser, =>
            respondWith('restored text from two', 'restored title from two')

          next =>
            expect($('.target')).toHaveText('restored text from two')
            expect(location.pathname).toEqual('/two')
            expect(document.title).toEqual('restored title from two')

            history.back()

          next.after waitForBrowser, =>
            respondWith('restored text from one', 'restored title from one')

          next =>
            expect($('.target')).toHaveText('restored text from one')
            expect(location.pathname).toEqual('/one')
            expect(document.title).toEqual('restored title from one')

            history.forward()

          next.after waitForBrowser, =>
            # Since the response is cached, we don't have to respond
            expect($('.target')).toHaveText('restored text from two')
            expect(location.pathname).toEqual('/two')
            expect(document.title).toEqual('restored title from two')

        it 'does not add additional history entries when linking to the current URL', asyncSpec (next) ->
          up.history.config.enabled = true

          # By default, up.history will replace the <body> tag when
          # the user presses the back-button. We reconfigure this
          # so we don't lose the Jasmine runner interface.
          up.history.config.restoreTargets = ['.container']

          up.fragment.config.autoHistoryTargets.push('.target')

          up.network.config.cacheExpiry = 0

          waitForBrowser = 150

          respondWith = (text) =>
            @respondWith """
              <div class="container">
                <div class='target'>#{text}</div>
              </div>
            """

          $link1 = $fixture('a[href="/one"][up-target=".target"]')
          $link2 = $fixture('a[href="/two"][up-target=".target"]')
          $container = $fixture('.container')
          $target = $fixture('.target').appendTo($container).text('original text')

          up.follow($link1)

          next =>
            respondWith('text from one')

          next =>
            expect($('.target')).toHaveText('text from one')
            expect(location.pathname).toEqual('/one')

            up.follow($link2)

          next =>
            respondWith('text from two')

          next =>
            expect($('.target')).toHaveText('text from two')
            expect(location.pathname).toEqual('/two')

            up.follow($link2)

          next =>
            respondWith('text from two')

          next =>
            expect($('.target')).toHaveText('text from two')
            expect(location.pathname).toEqual('/two')

            history.back()

          next.after waitForBrowser, =>
            respondWith('restored text from one')

          next =>
            expect($('.target')).toHaveText('restored text from one')
            expect(location.pathname).toEqual('/one')

            history.forward()

          next.after waitForBrowser, =>
            respondWith('restored text from two')

          next =>
            expect($('.target')).toHaveText('restored text from two')
            expect(location.pathname).toEqual('/two')

        it 'does add additional history entries when linking to the current URL, but with a different hash', asyncSpec (next) ->
          up.history.config.enabled = true

          # By default, up.history will replace the <body> tag when
          # the user presses the back-button. We reconfigure this
          # so we don't lose the Jasmine runner interface.
          up.history.config.restoreTargets = ['.container']

          up.fragment.config.autoHistoryTargets.push('.target')

          up.network.config.cacheExpiry = 0

          waitForBrowser = 150

          respondWith = (text) =>
            @respondWith """
              <div class="container">
                <div class='target'>#{text}</div>
              </div>
            """

          $link1 = $fixture('a[href="/one"][up-target=".target"]')
          $link2 = $fixture('a[href="/two"][up-target=".target"]')
          $link2WithHash = $fixture('a[href="/two#hash"][up-target=".target"]')
          $container = $fixture('.container')
          $target = $fixture('.target').appendTo($container).text('original text')

          up.follow($link1)

          next =>
            respondWith('text from one')

          next =>
            expect($('.target')).toHaveText('text from one')
            expect(location.pathname).toEqual('/one')
            expect(location.hash).toEqual('')

            up.follow($link2)

          next =>
            respondWith('text from two')

          next =>
            expect($('.target')).toHaveText('text from two')
            expect(location.pathname).toEqual('/two')
            expect(location.hash).toEqual('')

            up.follow($link2WithHash)

          next =>
            respondWith('text from two with hash')

          next =>
            expect($('.target')).toHaveText('text from two with hash')
            expect(location.pathname).toEqual('/two')
            expect(location.hash).toEqual('#hash')

            history.back()

          next.after waitForBrowser, =>
            respondWith('restored text from two')

          next =>
            expect($('.target')).toHaveText('restored text from two')
            expect(location.pathname).toEqual('/two')
            expect(location.hash).toEqual('')

            history.forward()

          next.after waitForBrowser, =>
            respondWith('restored text from two with hash')

          next =>
            expect($('.target')).toHaveText('restored text from two with hash')
            expect(location.pathname).toEqual('/two')
            expect(location.hash).toEqual('#hash')

        describe 'scrolling', ->

          describe 'with { scroll: "target" }', ->

            it 'reaveals the target fragment', asyncSpec (next) ->
              $link = $fixture('a[href="/action"][up-target=".target"]')
              $target = $fixture('.target')

              revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())

              up.follow($link, scroll: 'target')

              next =>
                @respondWith('<div class="target">new text</div>')

              next =>
                expect(revealStub).toHaveBeenCalled()
                expect(revealStub.calls.mostRecent().args[0]).toMatchSelector('.target')

          describe 'with { failScroll: "target" }', ->

            it 'reveals the { failTarget } if the server responds with an error', asyncSpec (next) ->
              $link = $fixture('a[href="/action"][up-target=".target"][up-fail-target=".fail-target"]')
              $target = $fixture('.target')
              $failTarget = $fixture('.fail-target')

              revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())

              up.follow($link, failScroll: "target")

              next =>
                @respondWith
                  status: 500,
                  responseText: """
                    <div class="fail-target">
                      Errors here
                    </div>
                    """

              next =>
                expect(revealStub).toHaveBeenCalled()
                expect(revealStub.calls.mostRecent().args[0]).toMatchSelector('.fail-target')

          describe 'with { scroll: string } option', ->

            it 'allows to reveal a different selector', asyncSpec (next) ->
              $link = $fixture('a[href="/action"][up-target=".target"]')
              $target = $fixture('.target')
              $other = $fixture('.other')

              revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())

              up.follow($link, scroll: '.other')

              next =>
                @respondWith """
                  <div class="target">
                    new text
                  </div>
                  <div class="other">
                    new other
                  </div>
                """

              next =>
                expect(revealStub).toHaveBeenCalled()
                expect(revealStub.calls.mostRecent().args[0]).toMatchSelector('.other')

            it 'ignores the { scroll } option for a failed response', asyncSpec (next) ->
              $link = $fixture('a[href="/action"][up-target=".target"][up-fail-target=".fail-target"]')
              $target = $fixture('.target')
              $failTarget = $fixture('.fail-target')
              $other = $fixture('.other')

              revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())

              up.follow($link, scroll: '.other', failTarget: '.fail-target')

              next =>
                @respondWith
                  status: 500,
                  responseText: """
                    <div class="fail-target">
                      Errors here
                    </div>
                    """

              next =>
                expect(revealStub).not.toHaveBeenCalled()

          describe 'with { failScroll } option', ->

            it 'reveals the given selector when the server responds with an error', asyncSpec (next) ->
              $link = $fixture('a[href="/action"][up-target=".target"][up-fail-target=".fail-target"]')
              $target = $fixture('.target')
              $failTarget = $fixture('.fail-target')
              $other = $fixture('.other')
              $failOther = $fixture('.fail-other')

              revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())

              up.follow($link, reveal: '.other', failScroll: '.fail-other')

              next =>
                @respondWith
                  status: 500,
                  responseText: """
                    <div class="fail-target">
                      Errors here
                    </div>
                    <div class="fail-other">
                      Fail other here
                    </div>
                    """

              next =>
                expect(revealStub).toHaveBeenCalled()
                expect(revealStub.calls.mostRecent().args[0]).toMatchSelector('.fail-other')

          describe 'with { scroll: "restore" } option', ->

            beforeEach ->
              up.history.config.enabled = true

            it "does not reveal, but instead restores the scroll positions of the target's viewport", asyncSpec (next) ->

              $viewport = $fixture('div[up-viewport] .element').css
                'height': '100px'
                'width': '100px'
                'overflow-y': 'scroll'

              followLink = (options = {}) ->
                $link = $viewport.find('.link')
                up.follow($link, options)

              respond = (linkDestination) =>
                @respondWith """
                  <div class="element" style="height: 300px">
                    <a class="link" href="#{linkDestination}" up-target=".element">Link</a>
                  </div>
                  """

              up.navigate('.element', url: '/foo')

              next =>
                # Provide the content at /foo with a link to /bar in the HTML
                respond('/bar')

              next =>
                $viewport.scrollTop(65)

                # Follow the link to /bar
                followLink()

              next =>
                # Provide the content at /bar with a link back to /foo in the HTML
                respond('/foo')

              next =>
                # Follow the link back to /foo, restoring the scroll position of 65px
                followLink(scroll: 'restore')
                # No need to respond because /foo has been cached before

              next =>
                expect($viewport.scrollTop()).toEqual(65)

          describe "when the browser is already on the link's destination", ->

            it "doesn't make a request and reveals the target container"

            it "doesn't make a request and reveals the target of a #hash in the URL"

        describe 'with { confirm } option', ->

          it 'follows the link after the user OKs a confirmation dialog', asyncSpec (next) ->
            spyOn(window, 'confirm').and.returnValue(true)
            $link = $fixture('a[href="/danger"][up-target=".middle"]')
            up.follow($link, confirm: 'Do you really want to go there?')

            next =>
              expect(window.confirm).toHaveBeenCalledWith('Do you really want to go there?')

          it 'does not follow the link if the user cancels the confirmation dialog', asyncSpec (next) ->
            spyOn(window, 'confirm').and.returnValue(false)
            $link = $fixture('a[href="/danger"][up-target=".middle"]')
            up.follow($link, confirm: 'Do you really want to go there?')

            next =>
              expect(window.confirm).toHaveBeenCalledWith('Do you really want to go there?')

          it 'does not show a confirmation dialog if the option is not a present string', asyncSpec (next) ->
            spyOn(up, 'render')
            spyOn(window, 'confirm')
            $link = $fixture('a[href="/danger"][up-target=".middle"]')
            up.follow($link, confirm: '')

            next =>
              expect(window.confirm).not.toHaveBeenCalled()
              expect(up.render).toHaveBeenCalled()

          it 'does not show a confirmation dialog when preloading', asyncSpec (next) ->
            spyOn(up, 'render')
            spyOn(window, 'confirm')
            $link = $fixture('a[href="/danger"][up-target=".middle"]')
            up.follow($link, confirm: 'Are you sure?', preload: true)

            next =>
              expect(window.confirm).not.toHaveBeenCalled()
              expect(up.render).toHaveBeenCalled()

#       it 'returns an up.AbortablePromise with an #abort() method to abort the request zzz', asyncSpec (next) ->
#        fixture('.target')
#        link = fixture('a[href="/foo"][up-target=".target"]')
#        returnValue = up.link.follow(link)
#
#        expect(returnValue).toEqual(jasmine.any(up.AbortablePromise))

      describeFallback 'canPushState', ->

        it 'navigates to the given link without JavaScript', asyncSpec (next) ->
          $link = $fixture('a[href="/path"]')
          spyOn(up.browser, 'loadPage')
          up.follow($link)

          next =>
            expect(up.browser.loadPage).toHaveBeenCalledWith(jasmine.objectContaining(url: '/path'))

        it 'uses the method from a data-method attribute', asyncSpec (next) ->
          $link = $fixture('a[href="/path"][data-method="PUT"]')
          spyOn(up.browser, 'loadPage')
          up.follow($link)

          next =>
            expect(up.browser.loadPage).toHaveBeenCalledWith(jasmine.objectContaining(url: '/path', method: 'PUT'))

    describe 'up.link.followOptions()', ->

      it 'parses the render options that would be used to follow the given link', ->
        link = fixture('a[href="/path"][up-method="PUT"][up-layer="new"]')
        options = up.link.followOptions(link)
        expect(options.url).toEqual('/path')
        expect(options.method).toEqual('PUT')
        expect(options.layer).toEqual('new')

      it 'does not render', ->
        spyOn(up, 'render')
        link = fixture('a[href="/path"][up-method="PUT"][up-layer="new"]')
        options = up.link.followOptions(link)
        expect(up.render).not.toHaveBeenCalled()

    describe 'up.link.shouldFollowEvent', ->

      buildEvent = (target, attrs) ->
        event = Trigger.createMouseEvent('mousedown', attrs)
        # Cannot change event.target on a native event property, but we can with Object.defineProperty()
        Object.defineProperty(event, 'target', get: -> target)
        event

      it "returns true when the given event's target is the given link itself", ->
        $link = $fixture('a[href="/foo"]')
        event = buildEvent($link[0])
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(true)

      it "returns true when the given event's target is a non-link child of the given link", ->
        $link = $fixture('a[href="/foo"]')
        $span = $link.affix('span')
        event = buildEvent($span[0])
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(true)

      it "returns false when the given event's target is a child link of the given link (think [up-expand])", ->
        $link = $fixture('div[up-href="/foo"]')
        $childLink = $link.affix('a[href="/bar"]')
        event = buildEvent($childLink[0])
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(false)

      it "returns false when the given event's target is a child input of the given link (think [up-expand])", ->
        $link = $fixture('div[up-href="/foo"]')
        $childInput = $link.affix('input[type="text"]')
        event = buildEvent($childInput[0])
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(false)

      it 'returns false if the right mouse button is used', ->
        $link = $fixture('a[href="/foo"]')
        event = buildEvent($link[0], button: 2)
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(false)

      it 'returns false if shift is pressed during the click', ->
        $link = $fixture('a[href="/foo"]')
        event = buildEvent($link[0], shiftKey: 2)
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(false)

      it 'returns false if ctrl is pressed during the click', ->
        $link = $fixture('a[href="/foo"]')
        event = buildEvent($link[0], ctrlKey: 2)
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(false)

      it 'returns false if meta is pressed during the click', ->
        $link = $fixture('a[href="/foo"]')
        event = buildEvent($link[0], metaKey: 2)
        expect(up.link.shouldFollowEvent(event, $link[0])).toBe(false)

    describe 'up.link.makeFollowable', ->

      it "adds [up-follow] to a link that wouldn't otherwise be handled by Unpoly", ->
        $link = $fixture('a[href="/path"]').text('label')
        up.link.makeFollowable($link[0])
        expect($link.attr('up-follow')).toEqual('')

      it "does not add [up-follow] to a link that is already [up-target]", ->
        $link = $fixture('a[href="/path"][up-target=".target"]').text('label')
        up.link.makeFollowable($link[0])
        expect($link.attr('up-follow')).toBeMissing()

    describe 'up.visit', ->

      it 'should have tests'

    describe 'up.link.isFollowable', ->

      it 'returns true for an [up-target] link', ->
        $link = $fixture('a[href="/foo"][up-target=".target"]')
        up.hello $link
        expect(up.link.isFollowable($link)).toBe(true)

      it 'returns true for an [up-follow] link', ->
        $link = $fixture('a[href="/foo"][up-follow]')
        up.hello $link
        expect(up.link.isFollowable($link)).toBe(true)

      it 'returns true for an [up-layer] link', ->
        $link = $fixture('a[href="/foo"][up-layer="modal"]')
        up.hello $link
        expect(up.link.isFollowable($link)).toBe(true)

      it 'returns true for an [up-mode] link', ->
        $link = $fixture('a[href="/foo"][up-mode="modal"]')
        up.hello $link
        expect(up.link.isFollowable($link)).toBe(true)

      it 'returns true for an [up-follow] link', ->
        $link = $fixture('a[href="/foo"][up-follow]')
        up.hello $link
        expect(up.link.isFollowable($link)).toBe(true)

      if up.migrate.loaded
        it 'returns true for an [up-modal] link', ->
          $link = $fixture('a[href="/foo"][up-modal=".target"]')
          up.hello $link
          expect(up.link.isFollowable($link)).toBe(true)

        it 'returns true for an [up-popup] link', ->
          $link = $fixture('a[href="/foo"][up-popup=".target"]')
          up.hello $link
          expect(up.link.isFollowable($link)).toBe(true)

        it 'returns true for an [up-drawer] link', ->
          $link = $fixture('a[href="/foo"][up-drawer=".target"]')
          up.hello $link
          expect(up.link.isFollowable($link)).toBe(true)

      it 'returns true for an [up-target] span with [up-href]', ->
        $link = $fixture('span[up-href="/foo"][up-target=".target"]')
        up.hello $link
        expect(up.link.isFollowable($link)).toBe(true)

      it 'returns false if the given link will be handled by the browser', ->
        $link = $fixture('a[href="/foo"]')
        up.hello $link
        expect(up.link.isFollowable($link)).toBe(false)

      it 'returns false if the given link will be handled by Rails UJS', ->
        $link = $fixture('a[href="/foo"][data-method="put"]')
        up.hello $link
        expect(up.link.isFollowable($link)).toBe(false)


    describe 'up.link.preload', ->

      describeCapability 'canPushState', ->

        beforeEach ->
          @requestTarget = => @lastRequest().requestHeaders['X-Up-Target']

        it "loads and caches the given link's destination", asyncSpec (next) ->
          $fixture('.target')
          $link = $fixture('a[href="/path"][up-target=".target"]')

          up.link.preload($link)

          next =>
            cachedPromise = up.cache.get
              url: '/path'
              target: '.target'
              failTarget: 'default-fallback'
            expect(u.isPromise(cachedPromise)).toBe(true)

        it "does not load a link whose method has side-effects", (done) ->
          $fixture('.target')
          $link = $fixture('a[href="/path"][up-target=".target"][data-method="post"]')
          preloadPromise = up.link.preload($link)

          promiseState(preloadPromise).then (result) ->
            expect(result.state).toEqual('rejected')
            expect(up.cache.get(url: '/path', target: '.target')).toBeUndefined()
            done()

        it 'accepts options that overrides those options that were parsed from the link', asyncSpec (next) ->
          $fixture('.target')
          $link = $fixture('a[href="/path"][up-target=".target"]')
          up.link.preload($link, url: '/options-path')

          next =>
            cachedPromise = up.cache.get
              url: '/options-path'
              target: '.target'
              failTarget: 'default-fallback'
            expect(u.isPromise(cachedPromise)).toBe(true)

        describe 'for an [up-target] link', ->

          it 'includes the [up-target] selector as an X-Up-Target header if the targeted element is currently on the page', asyncSpec (next) ->
            $fixture('.target')
            $link = $fixture('a[href="/path"][up-target=".target"]')
            up.link.preload($link)
            next => expect(@requestTarget()).toEqual('.target')

          it 'replaces the [up-target] selector as with a fallback and uses that as an X-Up-Target header if the targeted element is not currently on the page', asyncSpec (next) ->
            $link = $fixture('a[href="/path"][up-target=".target"]')
            up.link.preload($link)
            # The default fallback would usually be `body`, but in Jasmine specs we change
            # it to protect the test runner during failures.
            next => expect(@requestTarget()).toEqual('default-fallback')

        describe 'for a link opening a new layer', ->

          beforeEach ->
            up.motion.config.enabled = false

          it 'includes the selector as an X-Up-Target header and does not replace it with a fallback, since the layer frame always exists', asyncSpec (next) ->
            $link = $fixture('a[href="/path"][up-target=".target"][up-layer="new"]')
            up.hello($link)
            up.link.preload($link)
            next => expect(@requestTarget()).toEqual('.target')

          it 'does not create layer elements', asyncSpec (next) ->
            $link = $fixture('a[href="/path"][up-target=".target"][up-layer="modal"]')
            up.hello($link)
            up.link.preload($link)
            next =>
              expect('up-modal').not.toBeAttached()

          it 'does not emit an up:layer:open event', asyncSpec (next) ->
            $link = $fixture('a[href="/path"][up-target=".target"][up-layer="new"]')
            up.hello($link)
            openListener = jasmine.createSpy('listener')
            up.on('up:layer:open', openListener)
            up.link.preload($link)
            next =>
              expect(openListener).not.toHaveBeenCalled()

          it 'does not close a currently open overlay', asyncSpec (next) ->
            $link = $fixture('a[href="/path"][up-target=".target"][up-layer="modal"]')
            up.hello($link)
            closeListener = jasmine.createSpy('listener')
            up.on('up:layer:dismiss', closeListener)

            up.layer.open(mode: 'modal', fragment: '<div class="content">Modal content</div>')

            next =>
              expect('up-modal .content').toBeAttached()

            next =>
              up.link.preload($link)

            next =>
              expect('up-modal .content').toBeAttached()
              expect(closeListener).not.toHaveBeenCalled()

            next =>
              up.layer.dismiss()

            next =>
              expect('up-modal .content').not.toBeAttached()
              expect(closeListener).toHaveBeenCalled()

          it 'does not prevent the opening of other overlays while the request is still pending', asyncSpec (next) ->
            $link = $fixture('a[href="/path"][up-target=".target"][up-layer="modal"]')
            up.hello($link)
            up.link.preload($link)

            next =>
              up.layer.open(mode: 'modal', fragment: '<div class="content">Modal content</div>')

            next =>
              expect('up-modal .content').toBeAttached()

          it 'calls up.request() with a { preload: true } option', asyncSpec (next) ->
            requestSpy = spyOn(up, 'request')

            $link = $fixture('a[href="/path"][up-target=".target"][up-layer="modal"]')
            up.hello($link)
            up.link.preload($link)

            next =>
              expect(requestSpy).toHaveBeenCalledWith(jasmine.objectContaining(preload: true))

  describe 'unobtrusive behavior', ->

    describe 'a[up-target]', ->

      it 'does not follow a form with up-target attribute (bugfix)', asyncSpec (next) ->
        $form = $fixture('form[up-target]')
        up.hello($form)
        followSpy = up.link.knife.mock('follow').and.returnValue(Promise.resolve())
        Trigger.clickSequence($form)

        next =>
          expect(followSpy).not.toHaveBeenCalled()

      describeCapability 'canPushState', ->

        it 'requests the [href] with AJAX and replaces the [up-target] selector', asyncSpec (next) ->
          $fixture('.target')
          $link = $fixture('a[href="/path"][up-target=".target"]')
          Trigger.clickSequence($link)

          next =>
            @respondWith('<div class="target">new text</div>')

          next =>
            expect($('.target')).toHaveText('new text')


        it 'adds a history entry', asyncSpec (next) ->
          up.history.config.enabled = true
          up.fragment.config.autoHistoryTargets.push('.target')

          $fixture('.target')
          $link = $fixture('a[href="/new-path"][up-target=".target"]')
          Trigger.clickSequence($link)

          next =>
            @respondWith('<div class="target">new text</div>')

          next.after 1000, =>
            expect($('.target')).toHaveText('new text')
            expect(location.pathname).toEqual('/new-path')

        it 'respects a X-Up-Location header that the server sends in case of a redirect', asyncSpec (next) ->
          up.history.config.enabled = true

          $fixture('.target')
          $link = $fixture('a[href="/path"][up-target=".target"][up-history]')
          Trigger.clickSequence($link)

          next =>
            @respondWith
              responseText: '<div class="target">new text</div>'
              responseHeaders: { 'X-Up-Location': '/other/path' }

          next =>
            expect($('.target')).toHaveText('new text')
            expect(location.pathname).toEqual('/other/path')

        describe 'choice of target layer', ->

          beforeEach ->
            up.motion.config.enabled = false

          it 'updates a target in the same layer as the clicked link', asyncSpec (next) ->
            $fixture('.document').affix('.target').text('old document text')
            up.layer.open(fragment: "<div class='target'>old modal text</div>")

            next =>
              expect($('.document .target')).toHaveText('old document text')
              expect($('up-modal .target')).toHaveText('old modal text')

              $linkInModal = $('up-modal-content').affix('a[href="/bar"][up-target=".target"]').text('link label')
              Trigger.clickSequence($linkInModal)

            next =>
              @respondWith '<div class="target">new text from modal link</div>'

            next =>
              expect($('.document .target')).toHaveText('old document text')
              expect($('up-modal .target')).toHaveText('new text from modal link')

          describe 'with [up-layer] modifier', ->

            beforeEach ->
              up.motion.config.enabled = false

            it 'allows to name a layer for the update', asyncSpec (next) ->
              $fixture('.document').affix('.target').text('old document text')
              up.layer.open(fragment: "<div class='target'>old modal text</div>")

              next =>
                expect($('.document .target')).toHaveText('old document text')
                expect($('up-modal .target')).toHaveText('old modal text')

                $linkInModal = $('up-modal-content').affix('a[href="/bar"][up-target=".target"][up-layer="parent"][up-peel="false"]')
                Trigger.clickSequence($linkInModal)

              next =>
                @respondWith '<div class="target">new text from modal link</div>'

              next =>
                expect($('.document .target')).toHaveText('new text from modal link')
                expect($('up-modal .target')).toHaveText('old modal text')

            it 'ignores [up-layer] if the server responds with an error', asyncSpec (next) ->
              $fixture('.document').affix('.target').text('old document text')
              up.layer.open(fragment: "<div class='target'>old modal text</div>")

              next =>
                expect($('.document .target')).toHaveText('old document text')
                expect($('up-modal .target')).toHaveText('old modal text')

                $linkInModal = $('up-modal-content').affix('a[href="/bar"][up-target=".target"][up-fail-target=".target"][up-layer="parent"][up-peel="false"]')
                Trigger.clickSequence($linkInModal)

              next =>
                @respondWith
                  responseText: '<div class="target">new failure text from modal link</div>'
                  status: 500

              next =>
                expect($('.document .target')).toHaveText('old document text')
                expect($('up-modal .target')).toHaveText('new failure text from modal link')

            it 'allows to name a layer for a non-200 response using an [up-fail-layer] modifier', asyncSpec (next) ->
              $fixture('.document').affix('.target').text('old document text')
              up.layer.open(fragment: "<div class='target'>old modal text</div>")

              next =>
                expect($('.document .target')).toHaveText('old document text')
                expect($('up-modal .target')).toHaveText('old modal text')

                $linkInModal = $('up-modal-content').affix('a[href="/bar"][up-target=".target"][up-fail-target=".target"][up-fail-layer="parent"][up-fail-peel="false"]')
                Trigger.clickSequence($linkInModal)

              next =>
                @respondWith
                  responseText: '<div class="target">new failure text from modal link</div>'
                  status: 500

              next =>
                expect($('.document .target')).toHaveText('new failure text from modal link')
                expect($('up-modal .target')).toHaveText('old modal text')

        describe 'with [up-fail-target] modifier', ->

          beforeEach ->
            $fixture('.success-target').text('old success text')
            $fixture('.failure-target').text('old failure text')
            @$link = $fixture('a[href="/path"][up-target=".success-target"][up-fail-target=".failure-target"]')

          it 'uses the [up-fail-target] selector for a failed response', asyncSpec (next) ->
            Trigger.clickSequence(@$link)

            next =>
              @respondWith('<div class="failure-target">new failure text</div>', status: 500)

            next =>
              expect($('.success-target')).toHaveText('old success text')
              expect($('.failure-target')).toHaveText('new failure text')

              # Since there isn't anyone who could handle the rejection inside
              # the event handler, our handler mutes the rejection.
              expect(window).not.toHaveUnhandledRejections() if REJECTION_EVENTS_SUPPORTED


          it 'uses the [up-target] selector for a successful response', asyncSpec (next) ->
            Trigger.clickSequence(@$link)

            next =>
              @respondWith('<div class="success-target">new success text</div>', status: 200)

            next =>
              expect($('.success-target')).toHaveText('new success text')
              expect($('.failure-target')).toHaveText('old failure text')

        describe 'with [up-transition] modifier', ->

          it 'morphs between the old and new target element', asyncSpec (next) ->
            $fixture('.target.old')
            $link = $fixture('a[href="/path"][up-target=".target"][up-transition="cross-fade"][up-duration="600"][up-easing="linear"]')
            Trigger.clickSequence($link)

            next =>
              @respondWith '<div class="target new">new text</div>'

            next =>
              @$oldGhost = $('.target.old')
              @$newGhost = $('.target.new')
              expect(@$oldGhost).toBeAttached()
              expect(@$newGhost).toBeAttached()
              expect(@$oldGhost).toHaveOpacity(1, 0.15)
              expect(@$newGhost).toHaveOpacity(0, 0.15)

            next.after 300, =>
              expect(@$oldGhost).toHaveOpacity(0.5, 0.15)
              expect(@$newGhost).toHaveOpacity(0.5, 0.15)

        describe 'wih a CSS selector in the [up-fallback] attribute', ->

          it 'uses the fallback selector if the [up-target] CSS does not exist on the page', asyncSpec (next) ->
            $fixture('.fallback').text('old fallback')
            $link = $fixture('a[href="/path"][up-target=".target"][up-fallback=".fallback"]')
            Trigger.clickSequence($link)

            next =>
              @respondWith """
                <div class="target">new target</div>
                <div class="fallback">new fallback</div>
              """

            next =>
              expect('.fallback').toHaveText('new fallback')

          it 'ignores the fallback selector if the [up-target] CSS exists on the page', asyncSpec (next) ->
            $fixture('.target').text('old target')
            $fixture('.fallback').text('old fallback')
            $link = $fixture('a[href="/path"][up-target=".target"][up-fallback=".fallback"]')
            Trigger.clickSequence($link)

            next =>
              @respondWith """
                <div class="target">new target</div>
                <div class="fallback">new fallback</div>
              """

            next =>
              expect('.target').toHaveText('new target')
              expect('.fallback').toHaveText('old fallback')

        describe 'with [up-content] modifier', ->

          it 'updates a fragment with the given inner HTML string', asyncSpec (next) ->
            target = fixture('.target', text: 'old content')
            link = fixture('a[up-target=".target"][up-content="new content"]')

            Trigger.clickSequence(link)

            next ->
              expect('.target').toHaveText('new content')

          it 'updates a fragment with the given inner HTML string when the element also has an [href="#"] attribute (bugfix)', asyncSpec (next) ->
            target = fixture('.target', text: 'old content')
            link = fixture('a[href="#"][up-target=".target"][up-content="new content"]')

            Trigger.clickSequence(link)

            next ->
              expect('.target').toHaveText('new content')

          it "removes the target's inner HTML with [up-content='']", asyncSpec (next) ->
            target = fixture('.target', text: 'old content')
            link = fixture('a[up-target=".target"][up-content=""]')

            Trigger.clickSequence(link)

            next ->
              expect(document.querySelector('.target').innerHTML).toBe('')

      it 'does not add a history entry when an up-history attribute is set to "false"', asyncSpec (next) ->
        up.history.config.enabled = true

        oldPathname = location.pathname
        $fixture('.target')
        $link = $fixture('a[href="/path"][up-target=".target"][up-history="false"]')
        Trigger.clickSequence($link)

        next =>
          @respondWith
            responseText: '<div class="target">new text</div>'
            responseHeaders: { 'X-Up-Location': '/other/path' }

        next =>
          expect($('.target')).toHaveText('new text')
          expect(location.pathname).toEqual(oldPathname)

    describe 'a[up-follow]', ->

      beforeEach ->
        @$link = $fixture('a[href="/follow-path"][up-follow]')
        @followSpy = up.link.knife.mock('follow').and.returnValue(Promise.resolve())

      it "calls up.follow with the clicked link", asyncSpec (next) ->
        Trigger.click(@$link)
        next =>
          expect(@followSpy).toHaveBeenCalledWith(@$link[0])
          expect(@$link).not.toHaveBeenDefaultFollowed()

      # IE does not call JavaScript and always performs the default action on right clicks
      unless AgentDetector.isIE() || AgentDetector.isEdge()
        it 'does nothing if the right mouse button is used', asyncSpec (next) ->
          Trigger.click(@$link, button: 2)
          next =>
            expect(@followSpy).not.toHaveBeenCalled()
            expect(@$link).toHaveBeenDefaultFollowed()

      it 'does nothing if shift is pressed during the click', asyncSpec (next) ->
        Trigger.click(@$link, shiftKey: true)
        next =>
          expect(@followSpy).not.toHaveBeenCalled()
          expect(@$link).toHaveBeenDefaultFollowed()

      it 'does nothing if ctrl is pressed during the click', asyncSpec (next)->
        Trigger.click(@$link, ctrlKey: true)
        next =>
          expect(@followSpy).not.toHaveBeenCalled()
          expect(@$link).toHaveBeenDefaultFollowed()

      it 'does nothing if meta is pressed during the click', asyncSpec (next)->
        Trigger.click(@$link, metaKey: true)
        next =>
          expect(@followSpy).not.toHaveBeenCalled()
          expect(@$link).toHaveBeenDefaultFollowed()

      describe 'with [up-instant] modifier', ->

        beforeEach ->
          @$link.attr('up-instant', '')

        it 'follows a link on mousedown (instead of on click)', asyncSpec (next)->
          Trigger.mousedown(@$link)
          next => expect(@followSpy.calls.mostRecent().args[0]).toEqual(@$link[0])

        it 'does nothing on mouseup', asyncSpec (next)->
          Trigger.mouseup(@$link)
          next => expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing on click if there was an earlier mousedown event', asyncSpec (next)->
          Trigger.mousedown(@$link)
          Trigger.click(@$link)
          next => expect(@followSpy.calls.count()).toBe(1)

        it 'does follow a link on click if there was never a mousedown event (e.g. if the user pressed enter)', asyncSpec (next) ->
          Trigger.click(@$link)
          next => expect(@followSpy.calls.mostRecent().args[0]).toEqual(@$link[0])

        # IE does not call JavaScript and always performs the default action on right clicks
        unless AgentDetector.isIE() || AgentDetector.isEdge()
          it 'does nothing if the right mouse button is pressed down', asyncSpec (next)->
            Trigger.mousedown(@$link, button: 2)
            next => expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing if shift is pressed during mousedown', asyncSpec (next) ->
          Trigger.mousedown(@$link, shiftKey: true)
          next => expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing if ctrl is pressed during mousedown', asyncSpec (next) ->
          Trigger.mousedown(@$link, ctrlKey: true)
          next => expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing if meta is pressed during mousedown', asyncSpec (next) ->
          Trigger.mousedown(@$link, metaKey: true)
          next => expect(@followSpy).not.toHaveBeenCalled()

    describe '[up-dash]', ->

      it "is a shortcut for [up-preload], [up-instant] and [up-target], using [up-dash]'s value as [up-target]", ->
        $link = $fixture('a[href="/path"][up-dash=".target"]').text('label')
        up.hello($link)
        expect($link.attr('up-preload')).toEqual('')
        expect($link.attr('up-instant')).toEqual('')
        expect($link.attr('up-target')).toEqual('.target')

      it 'sets [up-follow] instead of [up-target] if no target is given (bugfix)', ->
        link = fixture('a[href="/path"][up-dash]', text: 'label')
        up.hello(link)

        expect(link).not.toHaveAttribute('up-target')
        expect(link).toHaveAttribute('up-follow')

#      it "adds [up-follow] attribute if [up-dash]'s value is 'true'", ->
#        $link = $fixture('a[href="/path"][up-dash="true"]').text('label')
#        up.hello($link)
#        expect($link.attr('up-follow')).toEqual('')
#
#      it "adds [up-follow] attribute if [up-dash] is present, but has no value", ->
#        $link = $fixture('a[href="/path"][up-dash]').text('label')
#        up.hello($link)
#        expect($link.attr('up-follow')).toEqual('')
#
#      it "does not add an [up-follow] attribute if [up-dash] is 'true', but [up-target] is present", ->
#        $link = $fixture('a[href="/path"][up-dash="true"][up-target=".target"]').text('label')
#        up.hello($link)
#        expect($link.attr('up-follow')).toBeMissing()
#        expect($link.attr('up-target')).toEqual('.target')
#
#      it "does not add an [up-follow] attribute if [up-dash] is 'true', but [up-modal] is present", ->
#        $link = $fixture('a[href="/path"][up-dash="true"][up-modal=".target"]').text('label')
#        up.hello($link)
#        expect($link.attr('up-follow')).toBeMissing()
#        expect($link.attr('up-modal')).toEqual('.target')
#
#      it "does not add an [up-follow] attribute if [up-dash] is 'true', but [up-popup] is present", ->
#        $link = $fixture('a[href="/path"][up-dash="true"][up-popup=".target"]').text('label')
#        up.hello($link)
#        expect($link.attr('up-follow')).toBeMissing()
#        expect($link.attr('up-popup')).toEqual('.target')

      it "removes the [up-dash] attribute when it's done", ->
        $link = $fixture('a[href="/path"]').text('label')
        up.hello($link)
        expect($link.attr('up-dash')).toBeMissing()

    describe '[up-expand]', ->

      it 'copies up-related attributes of a contained link', ->
        $area = $fixture('div[up-expand] a[href="/path"][up-target="selector"][up-instant][up-preload]')
        up.hello($area)
        expect($area.attr('up-target')).toEqual('selector')
        expect($area.attr('up-instant')).toEqual('')
        expect($area.attr('up-preload')).toEqual('')

      it "renames a contained link's href attribute to up-href so the container is considered a link", ->
        $area = $fixture('div[up-expand] a[up-follow][href="/path"]')
        up.hello($area)
        expect($area.attr('up-href')).toEqual('/path')

      it 'copies attributes from the first link if there are multiple links', ->
        $area = $fixture('div[up-expand]')
        $link1 = $area.affix('a[href="/path1"]')
        $link2 = $area.affix('a[href="/path2"]')
        up.hello($area)
        expect($area.attr('up-href')).toEqual('/path1')

      it "copies an contained non-link element with up-href attribute", ->
        $area = $fixture('div[up-expand] span[up-follow][up-href="/path"]')
        up.hello($area)
        expect($area.attr('up-href')).toEqual('/path')

      it 'adds an up-follow attribute if the contained link has neither up-follow nor up-target attributes', ->
        $area = $fixture('div[up-expand] a[href="/path"]')
        up.hello($area)
        expect($area.attr('up-follow')).toEqual('')

      it 'can be used to enlarge the click area of a link', asyncSpec (next) ->
        $area = $fixture('div[up-expand] a[href="/path"]')
        up.hello($area)
        spyOn(up, 'render')
        Trigger.clickSequence($area)
        next =>
          expect(up.render).toHaveBeenCalled()

      it 'does nothing when the user clicks another link in the expanded area', asyncSpec (next) ->
        $area = $fixture('div[up-expand]')
        $expandedLink = $area.affix('a[href="/expanded-path"][up-follow]')
        $otherLink = $area.affix('a[href="/other-path"][up-follow]')
        up.hello($area)
        followSpy = up.link.knife.mock('follow').and.returnValue(Promise.resolve())
        Trigger.clickSequence($otherLink)
        next =>
          expect(followSpy.calls.count()).toEqual(1)
          expect(followSpy.calls.mostRecent().args[0]).toEqual($otherLink[0])

      it 'does nothing when the user clicks on an input in the expanded area', asyncSpec (next) ->
        $area = $fixture('div[up-expand]')
        $expandedLink = $area.affix('a[href="/expanded-path"][up-follow]')
        $input = $area.affix('input[type=text]')
        up.hello($area)
        followSpy = up.link.knife.mock('follow').and.returnValue(Promise.resolve())
        Trigger.clickSequence($input)
        next =>
          expect(followSpy).not.toHaveBeenCalled()

      it 'does not trigger multiple replaces when the user clicks on the expanded area of an [up-instant] link (bugfix)', asyncSpec (next) ->
        $area = $fixture('div[up-expand] a[href="/path"][up-follow][up-instant]')
        up.hello($area)
        spyOn(up, 'render')
        Trigger.clickSequence($area)
        next =>
          expect(up.render.calls.count()).toEqual(1)

      it 'makes the expanded area followable if the expanded link is [up-dash] with a selector (bugfix)', ->
        $area = $fixture('div[up-expand] a[href="/path"][up-dash=".element"]')
        up.hello($area)
        expect($area).toBeFollowable()
        expect($area.attr('up-target')).toEqual('.element')

      it 'makes the expanded area followable if the expanded link is [up-dash] without a selector (bugfix)', ->
        $area = $fixture('div[up-expand] a[href="/path"][up-dash]')
        up.hello($area)
        expect($area).toBeFollowable()

      describe 'with a CSS selector in the property value', ->

        it "expands the contained link that matches the selector", ->
          $area = $fixture('div[up-expand=".second"]')
          $link1 = $area.affix('a.first[href="/path1"]')
          $link2 = $area.affix('a.second[href="/path2"]')
          up.hello($area)
          expect($area.attr('up-href')).toEqual('/path2')

        it 'does nothing if no contained link matches the selector', ->
          $area = $fixture('div[up-expand=".foo"]')
          $link = $area.affix('a[href="/path1"]')
          up.hello($area)
          expect($area.attr('up-href')).toBeUndefined()

        it 'does not match an element that is not a descendant', ->
          $area = $fixture('div[up-expand=".second"]')
          $link1 = $area.affix('a.first[href="/path1"]')
          $link2 = $fixture('a.second[href="/path2"]') # not a child of $area
          up.hello($area)
          expect($area.attr('up-href')).toBeUndefined()

    describe '[up-preload]', ->

      beforeEach ->
        # Disable response time measuring for these tests
        up.network.config.preloadEnabled = true

      it 'preloads the link destination when hovering, after a delay', asyncSpec (next) ->
        up.link.config.preloadDelay = 100

        $fixture('.target').text('old text')

        $link = $fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello($link)

        Trigger.hoverSequence($link)

        next.after 50, =>
          # It's still too early
          expect(jasmine.Ajax.requests.count()).toEqual(0)

        next.after 75, =>
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(@lastRequest().url).toMatchURL('/foo')
          expect(@lastRequest()).toHaveRequestMethod('GET')
          expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.target')

          @respondWith """
            <div class="target">
              new text
            </div>
            """

        next =>
          # We only preloaded, so the target isn't replaced yet.
          expect('.target').toHaveText('old text')

          Trigger.clickSequence($link)

        next =>
          # No additional request has been sent since we already preloaded
          expect(jasmine.Ajax.requests.count()).toEqual(1)

          # The target is replaced instantly
          expect('.target').toHaveText('new text')

      it 'does not send a request if the user stops hovering before the delay is over', asyncSpec (next) ->
        up.link.config.preloadDelay = 100

        $fixture('.target').text('old text')

        $link = $fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello($link)

        Trigger.hoverSequence($link)

        next.after 40, =>
          # It's still too early
          expect(jasmine.Ajax.requests.count()).toEqual(0)

          Trigger.unhoverSequence($link)

        next.after 90, =>
          expect(jasmine.Ajax.requests.count()).toEqual(0)

      it 'aborts a preload request if the user stops hovering before the response was received', asyncSpec (next) ->
        up.link.config.preloadDelay = 10
        $fixture('.target').text('old text')
        $link = $fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello($link)
        abortListener = jasmine.createSpy('up:request:abort listener')
        up.on('up:request:aborted', abortListener)

        Trigger.hoverSequence($link)

        next.after 50, ->
          expect(abortListener).not.toHaveBeenCalled()
          expect(jasmine.Ajax.requests.count()).toEqual(1)

          Trigger.unhoverSequence($link)

        next.after 50, ->
          expect(abortListener).toHaveBeenCalled()

      it 'does not abort a request if the user followed the link while it was preloading, and then stopped hovering', asyncSpec (next) ->
        up.link.config.preloadDelay = 10
        $fixture('.target').text('old text')
        $link = $fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello($link)
        abortListener = jasmine.createSpy('up:request:abort listener')
        up.on('up:request:aborted', abortListener)

        Trigger.hoverSequence($link)

        next.after 50, ->
          expect(abortListener).not.toHaveBeenCalled()
          expect(jasmine.Ajax.requests.count()).toEqual(1)

          Trigger.click($link)

        next ->
          expect(abortListener).not.toHaveBeenCalled()

          Trigger.unhoverSequence($link)

        next ->
          expect(abortListener).not.toHaveBeenCalled()

      it 'preloads the link destination on touchstart (without delay)', asyncSpec (next) ->
        up.link.config.preloadDelay = 100

        $fixture('.target').text('old text')

        $link = $fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello($link)

        Trigger.touchstart($link)

        next =>
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(@lastRequest().url).toMatchURL('/foo')
          expect(@lastRequest()).toHaveRequestMethod('GET')
          expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.target')

          @respondWith """
            <div class="target">
              new text
            </div>
            """

        next =>
          # We only preloaded, so the target isn't replaced yet.
          expect('.target').toHaveText('old text')

          Trigger.click($link)

        next =>
          # No additional request has been sent since we already preloaded
          expect(jasmine.Ajax.requests.count()).toEqual(1)

          # The target is replaced instantly
          expect('.target').toHaveText('new text')

      describeCapability 'canPassiveEventListener', ->

        it 'registers the touchstart callback as a passive event listener', ->
          fixture('.target')
          link = fixture('a[href="/foo"][up-target=".target"][up-preload]')

          spyOn(link, 'addEventListener')

          up.hello(link)

          expect(link.addEventListener).toHaveBeenCalledWith('touchstart', jasmine.any(Function), { passive: true })

      it 'preloads the link destination on mousedown (without delay)', asyncSpec (next) ->
        up.link.config.preloadDelay = 100

        $fixture('.target').text('old text')

        $link = $fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello($link)

        Trigger.mousedown($link)

        next =>
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          expect(@lastRequest().url).toMatchURL('/foo')
          expect(@lastRequest()).toHaveRequestMethod('GET')
          expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.target')

          @respondWith """
            <div class="target">
              new text
            </div>
            """

        next =>
          # We only preloaded, so the target isn't replaced yet.
          expect('.target').toHaveText('old text')

          Trigger.click($link)

        next =>
          # No additional request has been sent since we already preloaded
          expect(jasmine.Ajax.requests.count()).toEqual(1)

          # The target is replaced instantly
          expect('.target').toHaveText('new text')

      it 'does not cache a failed response', asyncSpec (next) ->
        up.link.config.preloadDelay = 0

        $fixture('.target').text('old text')

        $link = $fixture('a[href="/foo"][up-target=".target"][up-preload]')
        up.hello($link)

        Trigger.hoverSequence($link)

        next.after 50, =>
          expect(jasmine.Ajax.requests.count()).toEqual(1)

          @respondWith
            status: 500
            responseText: """
              <div class="target">
                new text
              </div>
              """

        next =>
          # We only preloaded, so the target isn't replaced yet.
          expect('.target').toHaveText('old text')

          Trigger.click($link)

        next =>
          # Since the preloading failed, we send another request
          expect(jasmine.Ajax.requests.count()).toEqual(2)

          # Since there isn't anyone who could handle the rejection inside
          # the event handler, our handler mutes the rejection.
          expect(window).not.toHaveUnhandledRejections() if REJECTION_EVENTS_SUPPORTED

  describe 'up:click', ->

    describe 'on a link that is [up-instant]', ->

      it 'emits on up:click event on mousedown', ->
        link = fixture('a[href="#"][up-instant]')
        listener = jasmine.createSpy('up:click listener')
        link.addEventListener('up:click', listener)
        Trigger.mousedown(link)
        expect(listener).toHaveBeenCalled()

      it 'does not emit an up:click event on click IFF there was an earlier mousedown event', ->
        link = fixture('a[href="#"][up-instant]')
        listener = jasmine.createSpy('up:click listener')
        Trigger.mousedown(link)
        link.addEventListener('up:click', listener)
        Trigger.click(link)
        expect(listener).not.toHaveBeenCalled()

      it 'does emit an up:click event if there was a click without mousedown (happens when a link is activated with the Enter key)', ->
        link = fixture('a[href="#"][up-instant]')
        listener = jasmine.createSpy('up:click listener')
        link.addEventListener('up:click', listener)
        Trigger.click(link)
        expect(listener).toHaveBeenCalled()

      it 'prevents the mousedown event when the up:click event is prevented', ->
        mousedownEvent = null
        link = fixture('a[href="#"][up-instant]')
        link.addEventListener('mousedown', (event) -> mousedownEvent = event)
        link.addEventListener('up:click', (event) -> event.preventDefault())
        Trigger.mousedown(link)
        expect(mousedownEvent.defaultPrevented).toBe(true)

    describe 'on a link that is not [up-instant]', ->

      it 'emits an up:click event on click', ->
        link = fixture('a[href="#"]')
        listener = jasmine.createSpy('up:click listener')
        link.addEventListener('up:click', listener)
        Trigger.click(link)
        expect(listener).toHaveBeenCalled()

      it 'prevents the click event when the up:click event is prevented', ->
        clickEvent = null
        link = fixture('a[href="#"]')
        link.addEventListener('click', (event) -> clickEvent = event)
        link.addEventListener('up:click', (event) -> event.preventDefault())
        Trigger.click(link)
        expect(clickEvent.defaultPrevented).toBe(true)

      it 'does not emit an up:click event if an element has covered the click coordinates on mousedown, which would cause browsers to create a click event on body', asyncSpec (next) ->
        link = fixture('a[href="#"]')
        listener = jasmine.createSpy('up:click listener')
        link.addEventListener('up:click', listener)
        link.addEventListener('mousedown', ->
          up.layer.open(mode: 'cover', content: 'cover text')
        )
        Trigger.mousedown(link)

        next ->
          expect(up.layer.mode).toBe('cover')
          Trigger.click(link)

        next ->
          expect(listener).not.toHaveBeenCalled()

    describe 'on an non-link element that is [up-instant]', ->

      it 'emits on up:click event on mousedown', ->
        div = fixture('div[up-instant]')
        listener = jasmine.createSpy('up:click listener')
        div.addEventListener('up:click', listener)
        Trigger.mousedown(div)
        expect(listener).toHaveBeenCalled()

    describe 'on an non-link element that is not [up-instant]', ->

      it 'emits an up:click event on click', ->
        div = fixture('div')
        listener = jasmine.createSpy('up:click listener')
        div.addEventListener('up:click', listener)
        Trigger.click(div)
        expect(listener).toHaveBeenCalled()

      it 'does not emit an up:click event on ANY element if the user has dragged away between mousedown and mouseup', ->
        div = fixture('div')
        other = fixture('div')
        listener = jasmine.createSpy('up:click listener')
        up.on('up:click', listener) # use up.on() instead of addEventListener(), since up.on() cleans up after each test
        Trigger.mousedown(other)
        Trigger.mouseup(div)
        Trigger.click(document.body) # this is the behavior of Chrome and Firefox
        expect(listener).not.toHaveBeenCalled()

      it 'prevents the click event when the up:click event is prevented', ->
        clickEvent = null
        div = fixture('div')
        div.addEventListener('click', (event) -> clickEvent = event)
        div.addEventListener('up:click', (event) -> event.preventDefault())
        Trigger.click(div)
        expect(clickEvent.defaultPrevented).toBe(true)

  describe '[up-clickable]', ->

    it 'makes the element emit up:click events on Enter', ->
      fauxLink = up.hello(fixture('.hyperlink[up-clickable]'))
      clickListener = jasmine.createSpy('up:click listener')
      fauxLink.addEventListener('up:click', clickListener)

      Trigger.keySequence(fauxLink, 'Enter')

      expect(clickListener).toHaveBeenCalled()

    it 'makes the element focusable for keyboard users', ->
      fauxLink = up.hello(fixture('.hyperlink[up-clickable]'))

      expect(fauxLink).toBeKeyboardFocusable()
