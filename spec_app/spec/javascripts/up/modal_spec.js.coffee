describe 'up.modal', ->

  u = up.util
  
  describe 'JavaScript functions', ->

    assumedScrollbarWidth = 15

    describe 'up.modal.follow', ->

      it "loads the given link's destination in a dialog window", (done) ->
        $link = affix('a[href="/path/to"][up-modal=".middle"]').text('link')
        promise = up.modal.follow($link)
        expect(@lastRequest().url).toMatch /\/path\/to$/
        @respondWith """
          <div class="before">new-before</div>
          <div class="middle">new-middle</div>
          <div class="after">new-after</div>
          """
        promise.then ->
          expect($('.up-modal')).toExist()
          expect($('.up-modal-dialog')).toExist()
          expect($('.up-modal-dialog .middle')).toExist()
          expect($('.up-modal-dialog .middle')).toHaveText('new-middle')
          expect($('.up-modal-dialog .before')).not.toExist()
          expect($('.up-modal-dialog .after')).not.toExist()
          done()

    describe 'up.modal.extract', ->

      it 'opens a modal by extracting the given selector from the given HTML string', ->
        oldHref = location.href
        up.modal.extract '.middle', """
          <div class="before">new-before</div>
          <div class="middle">new-middle</div>
          <div class="after">new-after</div>
        """
        expect($('.up-modal')).toExist()
        expect($('.up-modal-dialog')).toExist()
        expect($('.up-modal-dialog .middle')).toExist()
        expect($('.up-modal-dialog .middle')).toHaveText('new-middle')
        expect($('.up-modal-dialog .before')).not.toExist()
        expect($('.up-modal-dialog .after')).not.toExist()

        # Can't change URLs
        expect(location.href).toEqual(oldHref)

    describe 'up.modal.visit', ->

      it "requests the given URL and places the given selector into a modal", ->
        up.modal.visit '/foo', target: '.middle'

        @respondWith """
          <div class="before">new-before</div>
          <div class="middle">new-middle</div>
          <div class="after">new-after</div>
        """

        expect('.up-modal').toExist()
        expect('.up-modal-dialog').toExist()
        expect('.up-modal-dialog .middle').toExist()
        expect('.up-modal-dialog .middle').toHaveText('new-middle')
        expect('.up-modal-dialog .before').not.toExist()
        expect('.up-modal-dialog .after').not.toExist()

        expect(location.pathname).toEndWith('/foo')

      it "doesn't create an .up-modal frame and replaces { failTarget } if the server returns a non-200 response", ->
        affix('.error').text('old error')

        up.modal.visit '/foo', target: '.target', failTarget: '.error'

        @respondWith
          status: 500
          responseText: """
            <div class="target">new target</div>
            <div class="error">new error</div>
          """

        expect('.up-modal').not.toExist()
        expect('.error').toHaveText('new error')

      describe 'preventing elements from jumping as scrollbars change', ->

        it "brings its own scrollbar, padding the body on the right", (done) ->
          promise = up.modal.visit('/foo', target: '.container')

          @respondWith('<div class="container">text</div>')

          promise.then ->
            $modal = $('.up-modal')
            $viewport = $modal.find('.up-modal-viewport')
            $body = $('body')
            expect($modal).toExist()
            expect($viewport.css('overflow-y')).toEqual('scroll')
            expect($body.css('overflow-y')).toEqual('hidden')
            expect(parseInt($body.css('padding-right'))).toBeAround(assumedScrollbarWidth, 5)

            up.modal.close().then ->
              expect($body.css('overflow-y')).toEqual('scroll')
              expect(parseInt($body.css('padding-right'))).toBe(0)
              done()

        it "gives the scrollbar to .up-modal instead of .up-modal-viewport while animating, so we don't see scaled scrollbars in a zoom-in animation", (done) ->
          openPromise = up.modal.extract('.container', '<div class="container">text</div>', animation: 'fade-in', duration: 100)
          $modal = $('.up-modal')
          $viewport = $modal.find('.up-modal-viewport')
          expect($modal.css('overflow-y')).toEqual('scroll')
          expect($viewport.css('overflow-y')).toEqual('hidden')
          openPromise.then ->
            expect($modal.css('overflow-y')).not.toEqual('scroll')
            expect($viewport.css('overflow-y')).toEqual('scroll')
            closePromise = up.modal.close(animation: 'fade-out', duration: 200)
            u.nextFrame ->
              expect($modal.css('overflow-y')).toEqual('scroll')
              expect($viewport.css('overflow-y')).toEqual('hidden')
              done()

        it 'does not add right padding to the body if the body has overflow-y: hidden', (done) ->
          restoreBody = u.temporaryCss($('body'), 'overflow-y': 'hidden')

          up.modal.extract('.container', '<div class="container">text</div>').then ->
            $body = $('body')
            expect($('.up-modal')).toExist()
            expect(parseInt($body.css('padding-right'))).toBe(0)

            up.modal.close().then ->
              expect(parseInt($body.css('padding-right'))).toBe(0)
              restoreBody()
              done()

        it 'does not add right padding to the body if the body has overflow-y: auto, but does not currently have scrollbars', (done) ->
          restoreBody = u.temporaryCss($('body'), 'overflow-y': 'auto')
          restoreReporter = u.temporaryCss($('.jasmine_html-reporter'), 'height': '100px', 'overflow-y': 'hidden')

          up.modal.extract('.container', '<div class="container">text</div>').then ->
            $body = $('body')
            expect($('.up-modal')).toExist()
            expect(parseInt($body.css('padding-right'))).toBe(0)

            up.modal.close().then ->
              expect(parseInt($body.css('padding-right'))).toBe(0)
              restoreReporter()
              restoreBody()
              done()

        it 'pushes right-anchored elements away from the edge of the screen', (done) ->

          $anchoredElement = affix('div[up-anchored=right]').css
            position: 'absolute'
            top: '0'
            right: '30px'

          promise = up.modal.visit('/foo', target: '.container')

          @respondWith('<div class="container">text</div>')

          promise.then ->
            expect(parseInt($anchoredElement.css('right'))).toBeAround(30 + assumedScrollbarWidth, 10)

            up.modal.close().then ->
              expect(parseInt($anchoredElement.css('right'))).toBeAround(30 , 10)
              done()

      describe 'opening a modal while another modal is open', ->

        it 'does not open multiple modals or pad the body twice if the user starts loading a second modal before the first was done loading', (done) ->
          up.modal.config.closeDuration = 10
          promise1 = up.modal.visit('/path1', target: '.container', animation: 'fade-in', duration: 50)
          promise2 = up.modal.visit('/path2', target: '.container', animation: 'fade-in', duration: 50)
          @respondWith('<div class="container">response1</div>')

          u.setTimer 120, =>
            # up.modal.visit (visitAsap) will start the request only after the last modal
            # has finished opening and closing: 50 + 10 ms
            @respondWith('<div class="container">response2</div>')
            $.when(promise1, promise2).then ->
              expect($('.up-modal').length).toBe(1)
              expect($('.up-modal-dialog').length).toBe(1)
              expect($('.container')).toHaveText('response2')
              bodyPadding = parseInt($('body').css('padding-right'))
              expect(bodyPadding).toBeAround(assumedScrollbarWidth, 10)
              expect(bodyPadding).not.toBeAround(2 * assumedScrollbarWidth, 2 * 5)
              done()

        it 'closes the current modal and wait for its close animation to finish before starting the open animation of a second modal', (done) ->
          up.modal.config.openAnimation = 'fade-in'
          up.modal.config.openDuration = 5
          up.modal.config.closeAnimation = 'fade-out'
          up.modal.config.closeDuration = 60

          events = []
          u.each ['up:modal:open', 'up:modal:opened', 'up:modal:close', 'up:modal:closed'], (event) ->
            up.on event, ->
              events.push(event)

          up.modal.extract('.target', '<div class="target">response1</div>')

          # First modal is starting opening animation
          expect(events).toEqual ['up:modal:open']
          expect($('.target')).toHaveText('response1')

          u.setTimer 80, ->
            # First modal has completed opening animation
            expect(events).toEqual ['up:modal:open', 'up:modal:opened']
            expect($('.target')).toHaveText('response1')

            # We open another modal, which will cause the first modal to start closing
            up.modal.extract('.target', '<div class="target">response2</div>')

            expect($('.target')).toHaveText('response1')

            u.setTimer 20, ->

              # Second modal is still waiting for first modal's closing animaton to finish.
              expect(events).toEqual ['up:modal:open', 'up:modal:opened', 'up:modal:close']
              expect($('.target')).toHaveText('response1')

              u.setTimer 200, ->

                # First modal has finished closing, second modal has finished opening.
                expect(events).toEqual ['up:modal:open', 'up:modal:opened', 'up:modal:close', 'up:modal:closed', 'up:modal:open', 'up:modal:opened']
                expect($('.target')).toHaveText('response2')

                done()

          it 'closes an opening modal if a second modal starts opening before the first modal has finished its open animation', (done) ->
            up.modal.config.openAnimation = 'fade-in'
            up.modal.config.openDuration = 50
            up.modal.config.closeAnimation = 'fade-out'
            up.modal.config.closeDuration = 50

            # Open the first modal
            up.modal.extract('.target', '<div class="target">response1</div>')

            u.setTimer 10, ->
              # First modal is still in its opening animation
              expect($('.target')).toHaveText('response1')

              # Open a second modal
              up.modal.extract('.target', '<div class="target">response2</div>')

              # First modal is starting close animation. Second modal waits for that.
              expect($('.target')).toHaveText('response1')

              u.setTimer 10, ->
                # Second modal is still waiting for first modal's closing animaton to finish.
                expect($('.target')).toHaveText('response1')

                u.setTimer 150, ->
                  # First modal has finished closing, second modal has finished opening.
                  expect($('.target')).toHaveText('response2')

                  done()

        it 'uses the correct flavor config for the first and second modal', (done) ->
          up.modal.config.openAnimation = 'fade-in'
          up.modal.config.openDuration = 20
          up.modal.config.closeAnimation = 'fade-out'
          up.modal.config.closeDuration = 20
          up.modal.flavor 'custom-drawer',
            openAnimation: 'move-from-right'
            closeAnimation: 'move-to-right'

          animations = []
          spyOn(up, 'animate').and.callFake ($element, animation, options) ->
            if $element.is('.up-modal-viewport')
              animations.push
                text: u.trim($element.find('.target').text())
                animation: animation
            deferred = $.Deferred()
            u.setTimer options.duration, -> deferred.resolve()
            deferred.promise()

          up.modal.extract('.target', '<div class="target">response1</div>')
          expect(animations).toEqual [
            { animation: 'fade-in', text: 'response1' }
          ]

          u.setTimer 30, ->

            # first modal is now done animating
            expect(animations).toEqual [
              { animation: 'fade-in', text: 'response1' }
            ]


            up.modal.extract('.target', '<div class="target">response2</div>', flavor: 'custom-drawer')
            expect(animations).toEqual [
              { animation: 'fade-in', text: 'response1' },
              { animation: 'fade-out', text: 'response1' },
            ]

            u.setTimer 30, ->

              expect(animations).toEqual [
                { animation: 'fade-in', text: 'response1' },
                { animation: 'fade-out', text: 'response1' },
                { animation: 'move-from-right', text: 'response2' }
              ]

              expect($('.up-modal').attr('up-flavor')).toEqual('custom-drawer')

              done()


        it 'does not explode if up.modal.close() was called before the response was received', ->
          up.modal.visit('/foo', target: '.container')
          up.modal.close()
          respond = => @respondWith('<div class="container">text</div>')
          expect(respond).not.toThrowError()
          expect($('.up-error')).not.toExist()

    describe 'up.modal.coveredUrl', ->

      describeCapability 'canPushState', ->

        it 'returns the URL behind the modal overlay', (done) ->
          up.history.replace('/foo')
          expect(up.modal.coveredUrl()).toBeMissing()
          visitPromise = up.modal.visit('/bar', target: '.container')
          @respondWith('<div class="container">text</div>')
          visitPromise.then ->
            expect(up.modal.coveredUrl()).toEndWith('/foo')
            up.modal.close().then ->
              expect(up.modal.coveredUrl()).toBeMissing()
              done()

    describe 'up.modal.flavors', ->

      it 'allows to register new modal variants with its own default configuration', ->
        up.modal.flavors.variant = { maxWidth: 200 }
        $link = affix('a[href="/path"][up-modal=".target"][up-flavor="variant"]')
        Trigger.click($link)
        @respondWith('<div class="target">new text</div>')
        $modal = $('.up-modal')
        $dialog = $modal.find('.up-modal-dialog')
        expect($modal).toBeInDOM()
        expect($modal.attr('up-flavor')).toEqual('variant')
        expect($dialog.attr('style')).toContain('max-width: 200px')

      it 'does not change the configuration of non-flavored modals', ->
        up.modal.flavors.variant = { maxWidth: 200 }
        $link = affix('a[href="/path"][up-modal=".target"]')
        Trigger.click($link)
        @respondWith('<div class="target">new text</div>')
        $modal = $('.up-modal')
        $dialog = $modal.find('.up-modal-dialog')
        expect($modal).toBeInDOM()
        expect($dialog.attr('style')).toBeBlank()

    describe 'up.modal.close', ->

      it 'closes a currently open modal', (done) ->
        up.modal.extract('.modal', '<div class="modal">Modal content</div>')

        modalContent = $('.modal')
        expect(modalContent).toBeInDOM()

        up.modal.close().then ->
          expect(modalContent).not.toBeInDOM()
          done()

      it 'does nothing if no modal is open', (done) ->
        wasClosed = false
        up.on 'up:modal:close', ->
          wasClosed = true

        up.modal.close().then ->
          expect(wasClosed).toBe(false)
          done()

  describe 'unobtrusive behavior', ->
    
    describe 'a[up-modal]', ->

      beforeEach ->
        up.motion.config.enabled = false

        # Some examples only want to check if follow() has been called, without
        # actually making a request.
        @stubFollow = =>
          @$link = affix('a[href="/path"][up-modal=".target"]')
          @followSpy = up.modal.knife.mock('followAsap').and.returnValue(u.resolvedPromise())
          @defaultSpy = up.link.knife.mock('allowDefault').and.callFake((event) -> event.preventDefault())

      it 'opens the clicked link in a modal', (done) ->
        @$link = affix('a[href="/path"][up-modal=".target"]')
        Trigger.click(@$link)
        lastRequest = @lastRequest()
        expect(lastRequest.url).toEqualUrl('/path')
        @respondWith '<div class="target">new content</div>'
        u.nextFrame =>
          expect('.up-modal').toExist()
          expect('.up-modal-content').toHaveText('new content')
          done()

      describe 'when modifier keys are held', ->

        # IE does not call JavaScript and always performs the default action on right clicks
        unless navigator.userAgent.match(/Trident/)
          it 'does nothing if the right mouse button is used', ->
            @stubFollow()
            Trigger.click(@$link, button: 2)
            expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing if shift is pressed during the click', ->
          @stubFollow()
          Trigger.click(@$link, shiftKey: true)
          expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing if ctrl is pressed during the click', ->
          @stubFollow()
          Trigger.click(@$link, ctrlKey: true)
          expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing if meta is pressed during the click', ->
          @stubFollow()
          Trigger.click(@$link, metaKey: true)
          expect(@followSpy).not.toHaveBeenCalled()

      describe 'with [up-instant] modifier', ->

        beforeEach ->
          @stubFollow()
          @$link.attr('up-instant', '')

        it 'opens the modal on mousedown (instead of on click)', ->
          Trigger.mousedown(@$link)
          expect(@followSpy.calls.mostRecent().args[0]).toEqual(@$link)

        it 'does nothing on mouseup', ->
          Trigger.mouseup(@$link)
          expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing on click', ->
          Trigger.click(@$link)
          expect(@followSpy).not.toHaveBeenCalled()

        # IE does not call JavaScript and always performs the default action on right clicks
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

      describe 'with [up-method] modifier', ->

        it 'honours the given method', ->
          $link = affix('a[href="/path"][up-modal=".target"][up-method="post"]')
          Trigger.click($link)
          expect(@lastRequest().method).toEqual 'POST'

      it 'adds a history entry and allows the user to use the back button', (done) ->
        up.motion.config.enabled = false
        up.history.push('/original-path')

        up.history.config.popTargets = ['.container']
        $container = affix('.container').text('old container content')
        $link = $container.affix('a[href="/new-path"][up-modal=".target"]')

        expect(location.pathname).toEqual('/original-path')

        Trigger.clickSequence($link)

        u.nextFrame =>
          @respondWith('<div class="target">modal content</div>')
          expect(location.pathname).toEqual('/new-path')
          expect('.up-modal .target').toHaveText('modal content')

          history.back()
          u.setTimer (waitForBrowser = 70), =>
            @respondWith('<div class="container">restored container content</div>')
            u.nextFrame =>
              expect(location.pathname).toEqual('/original-path')
              expect('.container').toHaveText('restored container content')
              expect('.up-modal').not.toExist()
              done()


    describe '[up-drawer]', ->

      beforeEach ->
        up.motion.config.enabled = false

      it 'slides in a drawer that covers the full height of the screen', (done) ->
        $link = affix('a[href="/foo"][up-drawer=".target"]').text('label')
        up.hello($link)
        Trigger.clickSequence($link)
        u.nextFrame =>
          @respondWith '<div class="target">new text</div>'
          expect(up.modal.isOpen()).toBe(true)
          expect($('.up-modal').attr('up-flavor')).toEqual('drawer')
          windowHeight = u.clientSize().height
          modalHeight = $('.up-modal-content').outerHeight()
          expect(modalHeight).toEqual(windowHeight)
          expect($('.up-modal-content').offset()).toEqual(top: 0, left: 0)
          done()

      it 'puts the drawer on the right if the opening link sits in the right 50% of the screen', (done) ->
        $link = affix('a[href="/foo"][up-drawer=".target"]').text('label')
        $link.css
          position: 'absolute'
          right: '0'
        up.hello($link)
        Trigger.clickSequence($link)
        u.nextFrame =>
          @respondWith '<div class="target">new text</div>'
          expect(up.modal.isOpen()).toBe(true)
          windowWidth = u.clientSize().width
          modalWidth = $('.up-modal-content').outerWidth()
          scrollbarWidth = u.scrollbarWidth()
          expect($('.up-modal-content').offset().left).toBeAround(windowWidth - modalWidth - scrollbarWidth, 1.0)
          done()

    describe '[up-close]', ->

      backgroundClicked = undefined

      beforeEach ->
        up.motion.config.enabled = false
        backgroundClicked = jasmine.createSpy('background clicked')
        up.on 'click', backgroundClicked

      describe 'when clicked inside a modal', ->
      
        it 'closes the open modal and halts the event chain', (done) ->
          up.modal.extract('.target', '<div class="target"><a up-close>text</a></div>', animation: false)
          $link = $('.up-modal a[up-close]') # link is within the modal
          Trigger.clickSequence($link)
          u.nextFrame ->
            expect(up.modal.isOpen()).toBe(false)
            expect(backgroundClicked).not.toHaveBeenCalled()
            done()

      describe 'when no modal is open', ->

        it 'does nothing and allows the event chain to continue', (done) ->
          $link = affix('a[up-close]') # link is outside the modal
          up.hello($link)
          Trigger.clickSequence($link)
          u.nextFrame ->
            expect(backgroundClicked).toHaveBeenCalled()
            done()

    describe 'template behavior', ->

      it 'closes the modal on close icon click', (done) ->
        up.modal.extract('.modal', '<div class="modal">Modal content</div>', animation: false)

        $closeIcon = $('.up-modal-close')

        Trigger.clickSequence($closeIcon)
        u.nextFrame ->
          expect(up.modal.isOpen()).toBe(false)
          done()

      it 'closes the modal on backdrop click', (done) ->
        up.modal.extract('.modal', '<div class="modal">Modal content</div>', animation: false)

        $backdrop = $('.up-modal-backdrop')

        Trigger.clickSequence($backdrop)
        u.nextFrame ->
          expect(up.modal.isOpen()).toBe(false)
          done()

      it 'closes the modal when the user presses the escape key', (done) ->
        wasClosed = false
        up.modal.extract('.modal', '<div class="modal">Modal content</div>', animation: false)
        up.on 'up:modal:close', ->
          wasClosed = true

        escapeEvent = $.Event('keydown', keyCode: 27)
        $('body').trigger(escapeEvent)
        u.nextFrame ->
          expect(wasClosed).toBe(true)
          done()

      describe 'when opened with { closable: false }', ->

        it 'does not render a close icon', ->
          up.modal.extract('.modal', '<div class="modal">Modal content</div>', animation: false, closable: false)

          modal = $('.up-modal')
          expect(modal).not.toContainElement('.up-modal-close')

        it 'does not close the modal on backdrop click', (done) ->
          up.modal.extract('.modal', '<div class="modal">Modal content</div>', animation: false, closable: false)

          $backdrop = $('.up-modal-backdrop')

          Trigger.clickSequence($backdrop)
          u.nextFrame ->
            expect(up.modal.isOpen()).toBe(true)
            done()

        it 'does not close the modal when the user presses the escape key', (done) ->
          up.modal.extract('.modal', '<div class="modal">Modal content</div>', animation: false, closable: false)

          escapeEvent = $.Event('keydown', keyCode: 27)
          $('body').trigger(escapeEvent)
          u.nextFrame ->
            expect(up.modal.isOpen()).toBe(true)
            done()

    describe 'when replacing content', ->

      beforeEach ->
        up.motion.config.enabled = false

      it 'prefers to replace a selector within the modal', ->
        $outside = affix('.foo').text('old outside')
        up.modal.visit('/path', target: '.foo')
        @respondWith("<div class='foo'>old inside</div>")
        up.extract('.foo', "<div class='foo'>new text</div>")
        expect($outside).toBeInDOM()
        expect($outside).toHaveText('old outside')
        expect($('.up-modal-content')).toHaveText('new text')

      it 'auto-closes the modal when a replacement from inside the modal affects a selector behind the modal', ->
        affix('.outside').text('old outside')
        up.modal.visit('/path', target: '.inside')
        @respondWith("<div class='inside'>old inside</div>")
        up.extract('.outside', "<div class='outside'>new outside</div>", origin: $('.inside'))
        expect($('.outside')).toHaveText('new outside')
        expect($('.up-modal')).not.toExist()

      it 'does not restore the covered URL when auto-closing', (done) ->
        up.motion.config.enabled = true
        up.modal.config.openDuration = 0
        up.modal.config.closeDuration = 20

        affix('.outside').text('old outside')
        whenModalOpen = up.modal.visit('/path', target: '.inside')
        @respondWith("<div class='inside'>old inside</div>") # Populate modal

        whenModalOpen.then ->
          up.extract('.outside', "<div class='outside'>new outside</div>",
            origin: $('.inside'), history: '/new-location') # Provoke auto-close

          u.setTimer 50, ->
            expect(location.href).toEndWith '/new-location'
            done()

      it 'does not auto-close the modal when a replacement from inside the modal affects a selector inside the modal', ->
        affix('.outside').text('old outside')
        up.modal.visit('/path', target: '.inside')
        @respondWith("<div class='inside'>old inside</div>")
        up.extract('.inside', "<div class='inside'>new inside</div>", origin: $('.inside'))
        expect($('.inside')).toHaveText('new inside')
        expect($('.up-modal')).toExist()

      it 'does not auto-close the modal when a replacement from outside the modal affects a selector outside the modal', ->
        affix('.outside').text('old outside')
        up.modal.visit('/path', target: '.inside')
        @respondWith("<div class='inside'>old inside</div>")
        up.extract('.outside', "<div class='outside'>new outside</div>", origin: $('.outside'))
        expect($('.outside')).toHaveText('new outside')
        expect($('.up-modal')).toExist()

      it 'does not auto-close the modal when a replacement from outside the modal affects a selector inside the modal', ->
        affix('.outside').text('old outside')
        up.modal.visit('/path', target: '.inside')
        @respondWith("<div class='inside'>old inside</div>")
        up.extract('.inside', "<div class='inside'>new inside</div>", origin: $('.outside'))
        expect($('.inside')).toHaveText('new inside')
        expect($('.up-modal')).toExist()

      it 'does not auto-close the modal when the new fragment is within a popup', ->
        up.modal.visit('/modal', target: '.modal-content')
        @respondWith("<div class='modal-content'></div>")
        up.popup.attach('.modal-content', url: '/popup', target: '.popup-content')
        @respondWith("<div class='popup-content'></div>")
        expect($('.up-modal')).toExist()
        expect($('.up-popup')).toExist()

      it 'does not close the modal when a clicked [up-target] link within the modal links to cached content (bugfix)', (done) ->

        up.modal.extract '.content', """
          <div class="content">
            <a href="/foo" up-target=".content">link</a>
          </div>
          """
        $link = $('.up-modal .content a')
        expect($link).toExist()
        whenPreloaded = up.proxy.preload($link)

        @respondWith """
          <div class="content">
            new text
          </div>
        """

        whenPreloaded.then ->

          Trigger.clickSequence($link)

          u.nextFrame ->
            expect($('.up-modal')).toExist()
            expect($('.up-modal .content')).toHaveText('new text')

            done()
