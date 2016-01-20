describe 'up.link', ->

  u = up.util

  describe 'Javascript functions', ->
  
    describe 'up.follow', ->
      
      if up.browser.canPushState()

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
          expect(request.method).toBe('PUT')

        it 'allows to refer to the link itself as "&" in the CSS selector', ->
          $container = affix('div')
          $link1 = $('<a id="first" href="/path" up-target="&">first-link</a>').appendTo($container)
          $link2 = $('<a id="second" href="/path" up-target="&">second-link</a>').appendTo($container)
          up.follow($link2)
          @respondWith '<div id="second">second-div</div>'
          expect($container.text()).toBe('first-linksecond-div')

        it 'adds history entries and allows the user to use the back- and forward-buttons', (done) ->

          # By default, up.history will replace the <body> tag when
          # the user presses the back-button. We reconfigure this
          # so we don't lose the Jasmine runner interface.
          up.history.config.popTargets = ['.container']

          respondWith = (html) =>
            @lastRequest().respondWith
              status: 200
              contentType: 'text/html'
              responseText: "<div class='container'><div class='target'>#{html}</div></div>"

          followAndRespond = ($link, html) ->
            promise = up.follow($link)
            respondWith(html)
            promise

          $link1 = affix('a[href="/one"][up-target=".target"]')
          $link2 = affix('a[href="/two"][up-target=".target"]')
          $link3 = affix('a[href="/three"][up-target=".target"]')
          $container = affix('.container')
          $target = affix('.target').appendTo($container).text('original text')

          followAndRespond($link1, 'text from one').then =>
            expect($('.target')).toHaveText('text from one')
            expect(location.pathname).toEqual('/one')

            followAndRespond($link2, 'text from two').then =>
              expect($('.target')).toHaveText('text from two')
              expect(location.pathname).toEqual('/two')

              followAndRespond($link3, 'text from three').then =>
                expect($('.target')).toHaveText('text from three')
                expect(location.pathname).toEqual('/three')

                history.back()
                @setTimer 50, =>
                  respondWith('restored text from two')
                  expect($('.target')).toHaveText('restored text from two')
                  expect(location.pathname).toEqual('/two')

                  history.back()
                  @setTimer 50, =>
                    respondWith('restored text from one')
                    expect($('.target')).toHaveText('restored text from one')
                    expect(location.pathname).toEqual('/one')

                    history.forward()
                    @setTimer 50, =>
                      # Since the response is cached, we don't have to respond
                      expect($('.target')).toHaveText('restored text from two')
                      expect(location.pathname).toEqual('/two')

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

      else
        
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


    describe 'up.visit', ->
      
      it 'should have tests'

  describe 'unobtrusive behavior', ->

    describe 'a[up-target]', ->

      it 'does not follow a form with up-target attribute (bugfix)', ->
        $form = affix('form[up-target]')
        up.hello($form)
        followSpy = up.link.knife.mock('follow')
        $form.click()
        expect(followSpy).not.toHaveBeenCalled()

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

      it "calls up.follow with the clicked link", ->
        followSpy = up.link.knife.mock('follow')
        $link = affix('a[href="/path"][up-follow]')
        up.hello($link)
        $link.click()
        expect(followSpy).toHaveBeenCalledWith($link)

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

      it "copies an contained non-link element with up-href attribute", ->
        $area = affix('div[up-expand] span[up-follow][up-href="/path"]')
        up.hello($area)
        expect($area.attr('up-href')).toEqual('/path')

      it 'adds an up-follow attribute if the contained link has neither up-follow nor up-target attributes', ->
        $area = affix('div[up-expand] a[href="/path"]')
        up.hello($area)
        expect($area.attr('up-follow')).toEqual('')

    describe '[up-instant]', ->

      beforeEach ->
        @$link = affix('a[href="/path"][up-follow][up-instant]')
        @followSpy = up.link.knife.mock('follow')

      afterEach ->
        Knife.reset()

      it 'follows a link on mousedown (instead of on click)', ->
        Trigger.mousedown(@$link)
        expect(@followSpy.calls.mostRecent().args[0]).toEqual(@$link)

      it 'does nothing on mouseup', ->
        Trigger.mouseup(@$link)
        expect(@followSpy).not.toHaveBeenCalled()
      
      it 'does nothing on click', ->
        Trigger.click(@$link)
        expect(@followSpy).not.toHaveBeenCalled()
              
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
      