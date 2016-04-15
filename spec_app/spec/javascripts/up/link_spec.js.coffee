describe 'up.link', ->

  u = up.util

  describe 'Javascript functions', ->
  
    describe 'up.follow', ->

      describeCapability 'canPushState', ->

        it 'loads the given link via AJAX and replaces the response in the given target', (done) ->
          affix('.before').text('old-before')
          affix('.middle').text('old-middle')
          affix('.after').text('old-after')
          $link = affix('a[href="/path"][up-target=".middle"]')
    
          promise = up.follow($link)
    
          @respondWith """
            <div class="before">new-before</div>
            <div class="middle">new-middle</div>
            <div class="after">new-after</div>
            """
          
          promise.then ->
            expect($('.before')).toHaveText('old-before')
            expect($('.middle')).toHaveText('new-middle')
            expect($('.after')).toHaveText('old-after')
            done()

        it 'uses the method from a data-method attribute', ->
          $link = affix('a[href="/path"][data-method="PUT"]')
          up.follow($link)
          request = @lastRequest()
          expect(request).toHaveRequestMethod('PUT')

        it 'allows to refer to the link itself as "&" in the CSS selector', ->
          $container = affix('div')
          $link1 = $('<a id="first" href="/path" up-target="&">first-link</a>').appendTo($container)
          $link2 = $('<a id="second" href="/path" up-target="&">second-link</a>').appendTo($container)
          up.follow($link2)
          @respondWith '<div id="second">second-div</div>'
          expect($container.text()).toBe('first-linksecond-div')

        it 'adds history entries and allows the user to use the back- and forward-buttons', (done) ->

          waitForBrowser = 70

          # By default, up.history will replace the <body> tag when
          # the user presses the back-button. We reconfigure this
          # so we don't lose the Jasmine runner interface.
          up.history.config.popTargets = ['.container']

          respondWith = (html, title) =>
            @lastRequest().respondWith
              status: 200
              contentType: 'text/html'
              responseText: "<div class='container'><div class='target'>#{html}</div></div>"
              responseHeaders: { 'X-Up-Title': title }

          followAndRespond = ($link, html, title) ->
            promise = up.follow($link)
            respondWith(html, title)
            promise

          $link1 = affix('a[href="/one"][up-target=".target"]')
          $link2 = affix('a[href="/two"][up-target=".target"]')
          $link3 = affix('a[href="/three"][up-target=".target"]')
          $container = affix('.container')
          $target = affix('.target').appendTo($container).text('original text')

          followAndRespond($link1, 'text from one', 'title from one').then =>
            expect($('.target')).toHaveText('text from one')
            expect(location.pathname).toEqual('/one')
            expect(document.title).toEqual('title from one')

            followAndRespond($link2, 'text from two', 'title from two').then =>
              expect($('.target')).toHaveText('text from two')
              expect(location.pathname).toEqual('/two')
              expect(document.title).toEqual('title from two')

              followAndRespond($link3, 'text from three', 'title from three').then =>
                expect($('.target')).toHaveText('text from three')
                expect(location.pathname).toEqual('/three')
                expect(document.title).toEqual('title from three')

                history.back()
                u.setTimer waitForBrowser, ->
                  respondWith('restored text from two', 'restored title from two')
                  expect($('.target')).toHaveText('restored text from two')
                  expect(location.pathname).toEqual('/two')
                  expect(document.title).toEqual('restored title from two')

                  history.back()
                  u.setTimer waitForBrowser, ->
                    respondWith('restored text from one', 'restored title from one')
                    expect($('.target')).toHaveText('restored text from one')
                    expect(location.pathname).toEqual('/one')
                    expect(document.title).toEqual('restored title from one')

                    history.forward()
                    u.setTimer waitForBrowser, ->
                      # Since the response is cached, we don't have to respond
                      expect($('.target')).toHaveText('restored text from two', 'restored title from two')
                      expect(location.pathname).toEqual('/two')
                      expect(document.title).toEqual('restored title from two')

                      done()

        it 'does not add additional history entries when linking to the current URL', (done) ->

          # By default, up.history will replace the <body> tag when
          # the user presses the back-button. We reconfigure this
          # so we don't lose the Jasmine runner interface.
          up.history.config.popTargets = ['.container']

          up.proxy.config.cacheExpiry = 0

          respondWith = (text) =>
            @respondWith """
              <div class="container">
                <div class='target'>#{text}</div>
              </div>
            """

          followAndRespond = ($link, text) =>
            promise = up.follow($link)
            respondWith(text)
            promise

          $link1 = affix('a[href="/one"][up-target=".target"]')
          $link2 = affix('a[href="/two"][up-target=".target"]')
          $container = affix('.container')
          $target = affix('.target').appendTo($container).text('original text')

          followAndRespond($link1, 'text from one').then =>
            expect($('.target')).toHaveText('text from one')
            expect(location.pathname).toEqual('/one')

            followAndRespond($link2, 'text from two').then =>
              expect($('.target')).toHaveText('text from two')
              expect(location.pathname).toEqual('/two')

              followAndRespond($link2, 'text from two').then =>
                expect($('.target')).toHaveText('text from two')
                expect(location.pathname).toEqual('/two')

                history.back()
                u.setTimer 50, ->
                  respondWith('restored text from one')
                  expect($('.target')).toHaveText('restored text from one')
                  expect(location.pathname).toEqual('/one')

                  history.forward()
                  u.setTimer 50, ->
                    respondWith('restored text from two')
                    expect($('.target')).toHaveText('restored text from two')
                    expect(location.pathname).toEqual('/two')

                    done()

        it 'does adds additional history entries when linking to the current URL, but with a different hash', (done) ->

          # By default, up.history will replace the <body> tag when
          # the user presses the back-button. We reconfigure this
          # so we don't lose the Jasmine runner interface.
          up.history.config.popTargets = ['.container']

          up.proxy.config.cacheExpiry = 0

          respondWith = (text) =>
            @respondWith """
              <div class="container">
                <div class='target'>#{text}</div>
              </div>
            """

          followAndRespond = ($link, text) =>
            promise = up.follow($link)
            respondWith(text)
            promise

          $link1 = affix('a[href="/one"][up-target=".target"]')
          $link2 = affix('a[href="/two"][up-target=".target"]')
          $link2WithHash = affix('a[href="/two#hash"][up-target=".target"]')
          $container = affix('.container')
          $target = affix('.target').appendTo($container).text('original text')

          followAndRespond($link1, 'text from one').then =>
            expect($('.target')).toHaveText('text from one')
            expect(location.pathname).toEqual('/one')
            expect(location.hash).toEqual('')

            followAndRespond($link2, 'text from two').then =>
              expect($('.target')).toHaveText('text from two')
              expect(location.pathname).toEqual('/two')
              expect(location.hash).toEqual('')

              followAndRespond($link2WithHash, 'text from two with hash').then =>
                expect($('.target')).toHaveText('text from two with hash')
                expect(location.pathname).toEqual('/two')
                expect(location.hash).toEqual('#hash')

                history.back()
                u.setTimer 50, ->
                  respondWith('restored text from two')
                  expect($('.target')).toHaveText('restored text from two')
                  expect(location.pathname).toEqual('/two')
                  expect(location.hash).toEqual('')

                  history.forward()
                  u.setTimer 50, ->
                    respondWith('restored text from two with hash')
                    expect($('.target')).toHaveText('restored text from two with hash')
                    expect(location.pathname).toEqual('/two')
                    expect(location.hash).toEqual('#hash')
                    done()

        describe 'with { restoreScroll: true } option', ->

          it 'does not reveal, but instead restores the scroll positions of all viewports around the target', ->

            $viewport = affix('div[up-viewport] .element').css
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

            up.replace('.element', '/foo')
            # Provide the content at /foo with a link to /bar in the HTML
            respond('/bar')

            $viewport.scrollTop(65)

            # Follow the link to /bar
            followLink()

            # Provide the content at /bar with a link back to /foo in the HTML
            respond('/foo')

            # Follow the link back to /foo, restoring the scroll position of 65px
            followLink(restoreScroll: true)
            # No need to respond because /foo has been cached before

            expect($viewport.scrollTop()).toEqual(65)

#        describe "when the browser is already on the link's destination", ->
#
#          it "doesn't make a request and reveals the target container"
#
#          it "doesn't make a request and reveals the target of a #hash in the URL"

        describe 'with { confirm } option', ->

          it 'follows the link after the user OKs a confirmation dialog', ->
            spyOn(up, 'replace')
            spyOn(window, 'confirm').and.returnValue(true)
            $link = affix('a[href="/danger"][up-target=".middle"]')
            up.follow($link, confirm: 'Do you really want to go there?')
            expect(window.confirm).toHaveBeenCalledWith('Do you really want to go there?')
            expect(up.replace).toHaveBeenCalled()

          it 'does not follow the link if the user cancels the confirmation dialog', ->
            spyOn(up, 'replace')
            spyOn(window, 'confirm').and.returnValue(false)
            $link = affix('a[href="/danger"][up-target=".middle"]')
            up.follow($link, confirm: 'Do you really want to go there?')
            expect(window.confirm).toHaveBeenCalledWith('Do you really want to go there?')
            expect(up.replace).not.toHaveBeenCalled()

          it 'does not show a confirmation dialog if the option is not a present string', ->
            spyOn(up, 'replace')
            spyOn(window, 'confirm')
            $link = affix('a[href="/danger"][up-target=".middle"]')
            up.follow($link, confirm: '')
            expect(window.confirm).not.toHaveBeenCalled()
            expect(up.replace).toHaveBeenCalled()

          it 'does not show a confirmation dialog when preloading', ->
            spyOn(up, 'replace')
            spyOn(window, 'confirm')
            $link = affix('a[href="/danger"][up-target=".middle"]')
            up.follow($link, confirm: 'Are you sure?', preload: true)
            expect(window.confirm).not.toHaveBeenCalled()
            expect(up.replace).toHaveBeenCalled()

      describeFallback 'canPushState', ->
        
        it 'follows the given link', ->
          $link = affix('a[href="/path"]')
          spyOn(up.browser, 'loadPage')
          up.follow($link)
          expect(up.browser.loadPage).toHaveBeenCalledWith('/path', jasmine.anything())

        it 'uses the method from a data-method attribute', ->
          $link = affix('a[href="/path"][data-method="PUT"]')
          spyOn(up.browser, 'loadPage')
          up.follow($link)
          expect(up.browser.loadPage).toHaveBeenCalledWith('/path', { method: 'PUT' })

    describe 'up.link.makeFollowable', ->

      it "adds [up-follow] to a link that wouldn't otherwise be handled by Unpoly", ->
        $link = affix('a[href="/path"]').text('label')
        up.link.makeFollowable($link)
        expect($link.attr('up-follow')).toEqual('')

      it "does not add [up-follow] to a link that is already [up-target]", ->
        $link = affix('a[href="/path"][up-target=".target"]').text('label')
        up.link.makeFollowable($link)
        expect($link.attr('up-follow')).toBeMissing()

      it "does not add [up-follow] to a link that is already [up-modal]", ->
        $link = affix('a[href="/path"][up-modal=".target"]').text('label')
        up.link.makeFollowable($link)
        expect($link.attr('up-follow')).toBeMissing()

      it "does not add [up-follow] to a link that is already [up-popup]", ->
        $link = affix('a[href="/path"][up-popup=".target"]').text('label')
        up.link.makeFollowable($link)
        expect($link.attr('up-follow')).toBeMissing()

    describe 'up.visit', ->
      
      it 'should have tests'

  describe 'unobtrusive behavior', ->

    describe 'a[up-target]', ->

      it 'does not follow a form with up-target attribute (bugfix)', ->
        $form = affix('form[up-target]')
        up.hello($form)
        followSpy = up.link.knife.mock('follow').and.returnValue(u.resolvedPromise())
        $form.click()
        expect(followSpy).not.toHaveBeenCalled()

      describeCapability 'canPushState', ->

        it 'adds a history entry', ->
          affix('.target')
          $link = affix('a[href="/path"][up-target=".target"]')
          $link.click()
          @respondWith('<div class="target">new text</div>')
          expect($('.target')).toHaveText('new text')
          expect(location.pathname).toEqual('/path')

        it 'respects a X-Up-Location header that the server sends in case of a redirect', ->
          affix('.target')
          $link = affix('a[href="/path"][up-target=".target"]')
          $link.click()
          @respondWith
            responseText: '<div class="target">new text</div>'
            responseHeaders: { 'X-Up-Location': '/other/path' }
          expect($('.target')).toHaveText('new text')
          expect(location.pathname).toEqual('/other/path')

        describe 'with [up-transition] modifier', ->

          it 'morphs between the old and new target element', (done) ->
            affix('.target.old')
            $link = affix('a[href="/path"][up-target=".target"][up-transition="cross-fade"][up-duration="200"][up-easing="linear"]')
            $link.click()
            @respondWith '<div class="target new">new text</div>'

            $oldGhost = $('.target.old.up-ghost')
            $newGhost = $('.target.new.up-ghost')
            expect($oldGhost).toExist()
            expect($newGhost).toExist()
            expect(u.opacity($oldGhost)).toBeAround(1, 0.15)
            expect(u.opacity($newGhost)).toBeAround(0, 0.15)
            u.setTimer 100, ->
              expect(u.opacity($oldGhost)).toBeAround(0.5, 0.15)
              expect(u.opacity($newGhost)).toBeAround(0.5, 0.15)
              done()

      it 'does not add a history entry when an up-history attribute is set to "false"', ->
        oldPathname = location.pathname
        affix('.target')
        $link = affix('a[href="/path"][up-target=".target"][up-history="false"]')
        $link.click()
        @respondWith
          responseText: '<div class="target">new text</div>'
          responseHeaders: { 'X-Up-Location': '/other/path' }
        expect($('.target')).toHaveText('new text')
        expect(location.pathname).toEqual(oldPathname)

    describe 'a[up-follow]', ->

      beforeEach ->
        @$link = affix('a[href="/path"][up-follow]')
        @followSpy = up.link.knife.mock('follow').and.returnValue(u.resolvedPromise())
        @defaultSpy = up.link.knife.mock('allowDefault').and.callFake((event) -> event.preventDefault())

      it "calls up.follow with the clicked link", ->
        Trigger.click(@$link)
        expect(@followSpy).toHaveBeenCalledWith(@$link)

      # IE does not call Javascript and always performs the default action on right clicks
      unless navigator.userAgent.match(/Trident/)
        it 'does nothing if the right mouse button is used', ->
          Trigger.click(@$link, button: 2)
          expect(@followSpy).not.toHaveBeenCalled()

      it 'does nothing if shift is pressed during the click', ->
        Trigger.click(@$link, shiftKey: true)
        expect(@followSpy).not.toHaveBeenCalled()

      it 'does nothing if ctrl is pressed during the click', ->
        Trigger.click(@$link, ctrlKey: true)
        expect(@followSpy).not.toHaveBeenCalled()

      it 'does nothing if meta is pressed during the click', ->
        Trigger.click(@$link, metaKey: true)
        expect(@followSpy).not.toHaveBeenCalled()

      describe 'with [up-instant] modifier', ->

        beforeEach ->
          @$link.attr('up-instant', '')

        it 'follows a link on mousedown (instead of on click)', ->
          Trigger.mousedown(@$link)
          expect(@followSpy.calls.mostRecent().args[0]).toEqual(@$link)

        it 'does nothing on mouseup', ->
          Trigger.mouseup(@$link)
          expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing on click', ->
          Trigger.click(@$link)
          expect(@followSpy).not.toHaveBeenCalled()

        # IE does not call Javascript and always performs the default action on right clicks
        unless navigator.userAgent.match(/Trident/)
          it 'does nothing if the right mouse button is pressed down', ->
            Trigger.mousedown(@$link, button: 2)
            expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing if shift is pressed during mousedown', ->
          Trigger.mousedown(@$link, shiftKey: true)
          expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing if ctrl is pressed during mousedown', ->
          Trigger.mousedown(@$link, ctrlKey: true)
          expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing if meta is pressed during mousedown', ->
          Trigger.mousedown(@$link, metaKey: true)
          expect(@followSpy).not.toHaveBeenCalled()

    describe '[up-dash]', ->

      it "is a shortcut for [up-preload], [up-instant] and [up-target], using [up-dash]'s value as [up-target]", ->
        $link = affix('a[href="/path"][up-dash=".target"]').text('label')
        up.hello($link)
        expect($link.attr('up-preload')).toEqual('')
        expect($link.attr('up-instant')).toEqual('')
        expect($link.attr('up-target')).toEqual('.target')

      it "adds [up-follow] attribute if [up-dash]'s value is 'true'", ->
        $link = affix('a[href="/path"][up-dash="true"]').text('label')
        up.hello($link)
        expect($link.attr('up-follow')).toEqual('')

      it "adds [up-follow] attribute if [up-dash] is present, but has no value", ->
        $link = affix('a[href="/path"][up-dash]').text('label')
        up.hello($link)
        expect($link.attr('up-follow')).toEqual('')

      it "does not add an [up-follow] attribute if [up-dash] is 'true', but [up-target] is present", ->
        $link = affix('a[href="/path"][up-dash="true"][up-target=".target"]').text('label')
        up.hello($link)
        expect($link.attr('up-follow')).toBeMissing()
        expect($link.attr('up-target')).toEqual('.target')

      it "does not add an [up-follow] attribute if [up-dash] is 'true', but [up-modal] is present", ->
        $link = affix('a[href="/path"][up-dash="true"][up-modal=".target"]').text('label')
        up.hello($link)
        expect($link.attr('up-follow')).toBeMissing()
        expect($link.attr('up-modal')).toEqual('.target')

      it "does not add an [up-follow] attribute if [up-dash] is 'true', but [up-popup] is present", ->
        $link = affix('a[href="/path"][up-dash="true"][up-popup=".target"]').text('label')
        up.hello($link)
        expect($link.attr('up-follow')).toBeMissing()
        expect($link.attr('up-popup')).toEqual('.target')

      it "removes the [up-dash] attribute when it's done", ->
        $link = affix('a[href="/path"]').text('label')
        up.hello($link)
        expect($link.attr('up-dash')).toBeMissing()

    describe '[up-expand]', ->

      it 'copies up-related attributes of a contained link', ->
        $area = affix('div[up-expand] a[href="/path"][up-target="selector"][up-instant][up-preload]')
        up.hello($area)
        expect($area.attr('up-target')).toEqual('selector')
        expect($area.attr('up-instant')).toEqual('')
        expect($area.attr('up-preload')).toEqual('')

      it "renames a contained link's href attribute to up-href so the container is considered a link", ->
        $area = affix('div[up-expand] a[up-follow][href="/path"]')
        up.hello($area)
        expect($area.attr('up-href')).toEqual('/path')

      it 'copies attributes from the first link if there are multiple links', ->
        $area = affix('div[up-expand]')
        $link1 = $area.affix('a[href="/path1"]')
        $link2 = $area.affix('a[href="/path2"]')
        up.hello($area)
        expect($area.attr('up-href')).toEqual('/path1')

      it "copies an contained non-link element with up-href attribute", ->
        $area = affix('div[up-expand] span[up-follow][up-href="/path"]')
        up.hello($area)
        expect($area.attr('up-href')).toEqual('/path')

      it 'adds an up-follow attribute if the contained link has neither up-follow nor up-target attributes', ->
        $area = affix('div[up-expand] a[href="/path"]')
        up.hello($area)
        expect($area.attr('up-follow')).toEqual('')

      it 'can be used to enlarge the click area of a link', ->
        $area = affix('div[up-expand] a[href="/path"]')
        up.hello($area)
        spyOn(up, 'replace')
        $area.get(0).click()
        expect(up.replace).toHaveBeenCalled()

      it 'does not trigger multiple replaces when the user clicks on the expanded area of an up-instant link (bugfix)', ->
        $area = affix('div[up-expand] a[href="/path"][up-instant]')
        up.hello($area)
        spyOn(up, 'replace')
        Trigger.mousedown($area)
        Trigger.click($area)
        expect(up.replace.calls.count()).toEqual(1)

      it 'does not add an up-follow attribute if the expanded link is [up-dash] with a selector (bugfix)', ->
        $area = affix('div[up-expand] a[href="/path"][up-dash=".element"]')
        up.hello($area)
        expect($area.attr('up-follow')).toBeMissing()

      it 'does not an up-follow attribute if the expanded link is [up-dash] without a selector (bugfix)', ->
        $area = affix('div[up-expand] a[href="/path"][up-dash]')
        up.hello($area)
        expect($area.attr('up-follow')).toEqual('')

      describe 'with a CSS selector in the property value', ->

        it "expands the contained link that matches the selector", ->
          $area = affix('div[up-expand=".second"]')
          $link1 = $area.affix('a.first[href="/path1"]')
          $link2 = $area.affix('a.second[href="/path2"]')
          up.hello($area)
          expect($area.attr('up-href')).toEqual('/path2')

        it 'does nothing if no contained link matches the selector', ->
          $area = affix('div[up-expand=".foo"]')
          $link = $area.affix('a[href="/path1"]')
          up.hello($area)
          expect($area.attr('up-href')).toBeUndefined()

        it 'does not match an element that is not a descendant', ->
          $area = affix('div[up-expand=".second"]')
          $link1 = $area.affix('a.first[href="/path1"]')
          $link2 = affix('a.second[href="/path2"]') # not a child of $area
          up.hello($area)
          expect($area.attr('up-href')).toBeUndefined()
