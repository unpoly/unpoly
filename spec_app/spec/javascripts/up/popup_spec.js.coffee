describe 'up.popup', ->

  u = up.util

  describe 'Javascript functions', ->

    describe 'up.popup.attach', ->

      beforeEach ->
        jasmine.addMatchers
          toSitBelow: (util, customEqualityTesters) ->
            compare: ($popup, $link) ->
              popupDims = $popup.get(0).getBoundingClientRect()
              linkDims = $link.get(0).getBoundingClientRect()
              pass:
                Math.abs(popupDims.right - linkDims.right) < 1.0 && Math.abs(popupDims.top - linkDims.bottom) < 1.0

      beforeEach ->
        @restoreBodyHeight = u.temporaryCss('body', 'min-height': '3000px')

      afterEach ->
        @restoreBodyHeight()

      it "loads this link's destination in a popup positioned under the given link", ->
        $container = affix('.container')
        $container.css
          position: 'absolute'
          left: '100px'
          top: '50px'

        $link = $container.affix('a[href="/path/to"][up-popup=".middle"]').text('link')

        up.popup.attach($link)

        expect(@lastRequest().url).toMatch /\/path\/to$/
        @respondWith """
          <div class="before">new-before</div>
          <div class="middle">new-middle</div>
          <div class="after">new-after</div>
          """

        $popup = $('.up-popup')

        expect($popup).toExist()
        expect($popup.find('.middle')).toHaveText('new-middle')
        expect($popup.find('.before')).not.toExist()
        expect($popup.find('.after')).not.toExist()

        expect($popup.css('position')).toEqual('absolute')

        expect($popup).toSitBelow($link)

      it 'gives the popup { position: "fixed" } if the given link is fixed', ->
        # Let's test the harder case where the document is scrolled
        up.layout.scroll(document, 50)
        $container = affix('.container')
        $container.css
          position: 'fixed'
          left: '100px'
          top: '50px'
        $link = $container.affix('a[href="/path/to"][up-popup=".content"]').text('link')

        up.popup.attach($link)
        @respondWith('<div class="content">popup-content</div>')
        $popup = $('.up-popup')
        expect($popup.css('position')).toEqual('fixed')

        expect($popup).toSitBelow($link)

      it 'does not explode if the popup was closed before the response was received', ->
        $span = affix('span')
        up.popup.attach($span, url: '/foo', target: '.container')
        up.popup.close()
        respond = => @respondWith('<div class="container">text</div>')
        expect(respond).not.toThrowError()
        expect($('.up-error')).not.toExist()

      describe 'with { html } option', ->

        it 'extracts the selector from the given HTML string', ->
          $span = affix('span')
          up.popup.attach($span, target: '.container', html: "<div class='container'>container contents</div>")
          expect($('.up-popup')).toHaveText('container contents')

      describe 'opening a popup while another modal is open', ->

        it 'does not open multiple popups or pad the body twice if the user starts loading a second popup before the first was done loading', (done) ->
          $span = affix('span')
          up.popup.config.closeDuration = 10
          promise1 = up.popup.attach($span, url: '/path1', target: '.container', animation: 'fade-in', duration: 100)
          promise2 = up.popup.attach($span, url: '/path2', target: '.container', animation: 'fade-in', duration: 100)
          expect(jasmine.Ajax.requests.count()).toBe(2)
          request1 = jasmine.Ajax.requests.at(0)
          request2 = jasmine.Ajax.requests.at(1)

          u.setTimer 10, =>
            @respondWith('<div class="container">response1</div>', request: request1)
            u.setTimer 10, =>
              @respondWith('<div class="container">response2</div>', request: request2)
              u.setTimer 30, =>
                expect($('.up-popup').length).toBe(1)
                expect($('.container')).toHaveText('response2')
                done()

        it 'closes the current popup and wait for its close animation to finish before starting the open animation of a second popup', (done) ->
          $span = affix('span')
          up.popup.config.openAnimation = 'fade-in'
          up.popup.config.openDuration = 5
          up.popup.config.closeAnimation = 'fade-out'
          up.popup.config.closeDuration = 50

          events = []
          u.each ['up:popup:open', 'up:popup:opened', 'up:popup:close', 'up:popup:closed'], (event) ->
            up.on event, ->
              events.push(event)

          up.popup.attach($span, { target: '.target', html: '<div class="target">response1</div>' })

          # First popup is starting opening animation
          expect(events).toEqual ['up:popup:open']
          expect($('.target')).toHaveText('response1')

          u.setTimer 30, ->
            # First popup has completed opening animation
            expect(events).toEqual ['up:popup:open', 'up:popup:opened']
            expect($('.target')).toHaveText('response1')

            up.popup.attach($span, { target: '.target', html: '<div class="target">response2</div>' })

            # First popup is starting close animation. Second popup waits for that.
            expect(events).toEqual ['up:popup:open', 'up:popup:opened', 'up:popup:open', 'up:popup:close']
            expect($('.target')).toHaveText('response1')

            u.setTimer 15, ->

              # Second popup is still waiting for first popup's closing animaton to finish.
              expect(events).toEqual ['up:popup:open', 'up:popup:opened', 'up:popup:open', 'up:popup:close']
              expect($('.target')).toHaveText('response1')

              u.setTimer 100, ->

                # First popup has finished closing, second popup has finished opening.
                expect(events).toEqual ['up:popup:open', 'up:popup:opened', 'up:popup:open', 'up:popup:close', 'up:popup:closed', 'up:popup:opened']
                expect($('.target')).toHaveText('response2')

                done()



    describe 'up.popup.coveredUrl', ->

      describeCapability 'canPushState', ->

        it 'returns the URL behind the popup', (done) ->
          up.history.replace('/foo')
          expect(up.popup.coveredUrl()).toBeUndefined()

          $popupLink = affix('a[href="/bar"][up-popup=".container"]')
          $popupLink.click()
          @respondWith('<div class="container">text</div>')
          expect(up.popup.coveredUrl()).toEndWith('/foo')
          up.popup.close().then ->
            expect(up.popup.coveredUrl()).toBeUndefined()
            done()

    describe 'up.popup.close', ->

      it 'should have tests'

    describe 'up.popup.source', ->

      it 'should have tests'

  describe 'unobtrusive behavior', ->

    describe 'a[up-popup]', ->

      beforeEach ->
        @stubAttach = =>
          @$link = affix('a[href="/path"][up-popup=".target"]')
          @attachSpy = up.popup.knife.mock('attach').and.returnValue(u.resolvedPromise())
          @defaultSpy = up.link.knife.mock('allowDefault').and.callFake((event) -> event.preventDefault())

      it 'opens the clicked link in a popup', ->
        @stubAttach()
        Trigger.click(@$link)
        expect(@attachSpy).toHaveBeenCalledWith(@$link)

      # IE does not call Javascript and always performs the default action on right clicks
      unless navigator.userAgent.match(/Trident/)
        it 'does nothing if the right mouse button is used', ->
          @stubAttach()
          Trigger.click(@$link, button: 2)
          expect(@attachSpy).not.toHaveBeenCalled()

      it 'does nothing if shift is pressed during the click', ->
        @stubAttach()
        Trigger.click(@$link, shiftKey: true)
        expect(@attachSpy).not.toHaveBeenCalled()

      it 'does nothing if ctrl is pressed during the click', ->
        @stubAttach()
        Trigger.click(@$link, ctrlKey: true)
        expect(@attachSpy).not.toHaveBeenCalled()

      it 'does nothing if meta is pressed during the click', ->
        @stubAttach()
        Trigger.click(@$link, metaKey: true)
        expect(@attachSpy).not.toHaveBeenCalled()

      describe 'with [up-instant] modifier', ->

        beforeEach ->
          @stubAttach()
          @$link.attr('up-instant', '')

        it 'opens the modal on mousedown (instead of on click)', ->
          Trigger.mousedown(@$link)
          expect(@attachSpy.calls.mostRecent().args[0]).toEqual(@$link)

        it 'does nothing on mouseup', ->
          Trigger.mouseup(@$link)
          expect(@attachSpy).not.toHaveBeenCalled()

        it 'does nothing on click', ->
          Trigger.click(@$link)
          expect(@attachSpy).not.toHaveBeenCalled()

        # IE does not call Javascript and always performs the default action on right clicks
        unless navigator.userAgent.match(/Trident/)
          it 'does nothing if the right mouse button is pressed down', ->
            Trigger.mousedown(@$link, button: 2)
            expect(@attachSpy).not.toHaveBeenCalled()

        it 'does nothing if shift is pressed during mousedown', ->
          Trigger.mousedown(@$link, shiftKey: true)
          expect(@attachSpy).not.toHaveBeenCalled()

        it 'does nothing if ctrl is pressed during mousedown', ->
          Trigger.mousedown(@$link, ctrlKey: true)
          expect(@attachSpy).not.toHaveBeenCalled()

        it 'does nothing if meta is pressed during mousedown', ->
          Trigger.mousedown(@$link, metaKey: true)
          expect(@attachSpy).not.toHaveBeenCalled()

      describe 'with [up-method] modifier', ->

        it 'honours the given method', ->
          $link = affix('a[href="/path"][up-popup=".target"][up-method="post"]')
          Trigger.click($link)
          expect(@lastRequest().method).toEqual 'POST'

    describe '[up-close]', ->

      describe 'when clicked inside a popup', ->

        it 'closes the open popup and prevents the default action', ->
          $popup = affix('.up-popup')
          $link = $popup.affix('a[up-close]') # link is within the popup
          up.hello($link)
          wasDefaultPrevented = false
          wasClosed = false
          up.on 'click', 'a[up-close]', (event) ->
            wasDefaultPrevented = event.isDefaultPrevented()
            true # the line above might return false and cancel propagation / prevent default
          up.on 'up:popup:close', ->
            wasClosed = true
          $link.click()
          expect(wasClosed).toBe(true)
          expect(wasDefaultPrevented).toBe(true)

      describe 'when no popup is open', ->

        it 'does neither close the popup nor prevent the default action', ->
          $link = affix('a[up-close]') # link is outside the popup
          up.hello($link)
          wasDefaultPrevented = false
          wasClosed = false
          up.on 'click', 'a[up-close]', (event) ->
            wasDefaultPrevented = event.isDefaultPrevented()
            true # the line above might return false and cancel propagation / prevent default
          up.on 'up:popup:close', ->
            wasClosed = true
          $link.click()
          expect(wasClosed).toBe(false)
          expect(wasDefaultPrevented).toBe(false)

    describe 'when replacing content', ->

      beforeEach ->
        up.motion.config.enabled = false

      it 'prefers to replace a selector within the popup', ->
        $outside = affix('.foo').text('old outside')
        $link = affix('.link')
        up.popup.attach($link, href: '/path', target: '.foo')
        @respondWith("<div class='foo'>old inside</div>")
        up.extract('.foo', "<div class='foo'>new text</div>")
        expect($outside).toBeInDOM()
        expect($outside).toHaveText('old outside')
        expect($('.up-popup')).toHaveText('new text')

      it 'auto-closes the popup when a replacement from inside the popup affects a selector behind the popup', ->
        affix('.outside').text('old outside')
        $link = affix('.link')
        up.popup.attach($link, href: '/path', target: '.inside')
        @respondWith("<div class='inside'>old inside</div>")
        up.extract('.outside', "<div class='outside'>new outside</div>", origin: $('.inside'))
        expect($('.outside')).toHaveText('new outside')
        expect($('.up-popup')).not.toExist()

      it 'does not auto-close the popup when a replacement from inside the popup affects a selector inside the popup', ->
        affix('.outside').text('old outside')
        $link = affix('.link')
        up.popup.attach($link, href: '/path', target: '.inside')
        @respondWith("<div class='inside'>old inside</div>")
        up.extract('.inside', "<div class='inside'>new inside</div>", origin: $('.inside'))
        expect($('.inside')).toHaveText('new inside')
        expect($('.up-popup')).toExist()

      it 'does not auto-close the popup when a replacement from outside the popup affects a selector outside the popup', ->
        affix('.outside').text('old outside')
        $link = affix('.link')
        up.popup.attach($link, href: '/path', target: '.inside')
        @respondWith("<div class='inside'>old inside</div>")
        up.extract('.outside', "<div class='outside'>new outside</div>", origin: $('.outside'))
        expect($('.outside')).toHaveText('new outside')
        expect($('.up-popup')).toExist()

      it 'does not auto-close the popup when a replacement from outside the popup affects a selector inside the popup', ->
        affix('.outside').text('old outside')
        $link = affix('.link')
        up.popup.attach($link, href: '/path', target: '.inside')
        @respondWith("<div class='inside'>old inside</div>")
        up.extract('.inside', "<div class='inside'>new inside</div>", origin: $('.outside'))
        expect($('.inside')).toHaveText('new inside')
        expect($('.up-popup')).toExist()
