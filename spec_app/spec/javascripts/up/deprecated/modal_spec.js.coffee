u = up.util
e = up.element
$ = jQuery

describe 'up.modal (deprecated)', ->
  return

  beforeEach ->
    up.modal.config.openDuration = 5
    up.modal.config.closeDuration = 5

  describe 'JavaScript functions', ->

    describe 'up.modal.follow', ->

      it "loads the given link's destination in a dialog window", (done) ->
        $link = $fixture('a[href="/path/to"][up-modal=".middle"]').text('link')
        up.hello($link)
        promise = up.modal.follow($link)

        u.task =>
          expect(@lastRequest().url).toMatch /\/path\/to$/
          @respondWith """
            <div class="before">new-before</div>
            <div class="middle">new-middle</div>
            <div class="after">new-after</div>
            """

          promise.then =>
            expect($('up-overlay[up-mode=modal]')).toBeAttached()
            expect($('up-overlay-content')).toBeAttached()
            expect($('up-overlay-content .middle')).toBeAttached()
            expect($('up-overlay-content .middle')).toHaveText('new-middle')
            expect($('up-overlay-content .before')).not.toBeAttached()
            expect($('up-overlay-content .after')).not.toBeAttached()
            done()

    describe 'up.modal.extract', ->

      it 'opens a modal by extracting the given selector from the given HTML string', (done) ->
        up.history.config.enabled = true

        oldHref = location.href
        promise = up.modal.extract '.middle', """
          <div class="before">new-before</div>
          <div class="middle">new-middle</div>
          <div class="after">new-after</div>
          """

        promise.then =>
          expect($('up-overlay[up-mode=modal]')).toBeAttached()
          expect($('up-overlay-content')).toBeAttached()
          expect($('up-overlay-content .middle')).toBeAttached()
          expect($('up-overlay-content .middle')).toHaveText('new-middle')
          expect($('up-overlay-content .before')).not.toBeAttached()
          expect($('up-overlay-content .after')).not.toBeAttached()

          # Can't change URLs
          expect(location.href).toEqual(oldHref)
          done()

    describe 'up.modal.visit', ->

      it "requests the given URL and places the given selector into a modal", (done) ->
        up.history.config.enabled = true

        promise = up.modal.visit('/foo', target: '.middle')

        u.task =>
          @respondWith """
            <div class="before">new-before</div>
            <div class="middle">new-middle</div>
            <div class="after">new-after</div>
          """

        promise.then =>
          expect('up-overlay').toBeAttached()
          expect('up-overlay-content').toBeAttached()
          expect('up-overlay-content .middle').toBeAttached()
          expect('up-overlay-content .middle').toHaveText('new-middle')
          expect('up-overlay-content .before').not.toBeAttached()
          expect('up-overlay-content .after').not.toBeAttached()
          expect(location.pathname).toMatchURL('/foo')
          done()

      it "doesn't create a modal frame and replaces { failTarget } if the server returns a non-200 response", (done) ->
        $fixture('.error').text('old error')

        promise = up.modal.visit('/foo', target: '.target', failTarget: '.error')

        u.task =>
          @respondWith
            status: 500
            responseText: """
              <div class="target">new target</div>
              <div class="error">new error</div>
              """

        promise.catch =>
          expect('up-overlay').not.toBeAttached()
          expect('.error').toHaveText('new error')
          done()

      it 'always makes a request for the given selector, and does not "improve" the selector with a fallback', asyncSpec (next) ->
        up.modal.visit('/foo', target: '.target', failTarget: '.error')
        next =>
          expect(jasmine.Ajax.requests.count()).toEqual(1)
          headers = @lastRequest().requestHeaders
          expect(headers['X-Up-Target']).toEqual('.target')

      describe 'preventing elements from jumping as scrollbars change', ->

        it "brings its own scrollbar, padding the body on the right", (done) ->
          $body = $(document.body)

          $fixture('.spacer').css(height: '9000px')
          # Safari 11 has no vertical scrollbar that takes away space from the document,
          # so the entire shifting logic is skipped.
          if up.viewport.rootHasReducedWidthFromScrollbar()

            $rootOverflowElement = $(up.viewport.rootOverflowElement())

            promise = up.modal.visit('/foo', target: '.container')

            u.task =>
              @respondWith('<div class="container">text</div>')

            promise.then ->
              $modal = $('up-overlay')
              $viewport = $modal.find('up-overlay-viewport')
              scrollbarWidth = up.viewport.scrollbarWidth()

              expect($modal).toBeAttached()
              expect($viewport.css('overflow-y')).toEqual('scroll')
              expect($rootOverflowElement.css('overflow-y')).toEqual('hidden')
              expect(parseInt($body.css('padding-right'))).toBeAround(scrollbarWidth, 5)

              up.modal.close().then ->
                expect($rootOverflowElement.css('overflow-y')).toEqual('scroll')
                expect(parseInt($body.css('padding-right'))).toBe(0)
                done()
          else
            expect(true).toBe(true)
            done()

#        it "gives the scrollbar to .up-modal instead of .up-modal-viewport while animating, so we don't see scaled scrollbars in a zoom-in animation", (done) ->
#          openPromise = up.modal.extract('.container', '<div class="container">text</div>', animation: 'fade-in', duration: 100)
#
#          u.timer 50, ->
#            $modal = $('.up-modal')
#            $viewport = $modal.find('.up-modal-viewport')
#            expect($modal).toHaveClass('up-modal-animating')
#            expect($modal.css('overflow-y')).toEqual('scroll')
#            expect($viewport.css('overflow-y')).toEqual('hidden')
#
#            openPromise.then ->
#              expect($modal).not.toHaveClass('up-modal-animating')
#              expect($modal.css('overflow-y')).not.toEqual('scroll')
#              expect($viewport.css('overflow-y')).toEqual('scroll')
#              closePromise = up.modal.close(animation: 'fade-out', duration: 400)
#
#              u.timer 50, ->
#                expect($modal).toHaveClass('up-modal-animating')
#                expect($modal.css('overflow-y')).toEqual('scroll')
#                expect($viewport.css('overflow-y')).toEqual('hidden')
#                done()

        it "does not add right padding to the body if the document's overflow element has overflow-y: hidden", (done) ->
          restoreBody = e.setTemporaryStyle(up.viewport.rootOverflowElement(), overflowY: 'hidden')
          $fixture('.spacer').css(height: '9000px')

          up.modal.extract('.container', '<div class="container">text</div>').then ->
            $body = $('body')
            expect($('up-overlay[up-mode=modal]')).toBeAttached()
            expect(parseInt($body.css('padding-right'))).toBe(0)

            up.modal.close().then ->
              expect(parseInt($body.css('padding-right'))).toBe(0)
              restoreBody()
              done()

        it "does not add right padding to the body if the document's overflow element has overflow-y: auto, but does not currently have scrollbars", (done) ->
          restoreBody = e.setTemporaryStyle(up.viewport.rootOverflowElement(), overflowY: 'auto')
          restoreReporter = e.setTemporaryStyle($('.jasmine_html-reporter')[0], height: '100px', overflowY: 'hidden')

          up.modal.extract('.container', '<div class="container">text</div>').then ->
            $body = $('body')
            expect($('up-overlay[up-mode=modal]')).toBeAttached()
            expect(parseInt($body.css('padding-right'))).toBe(0)

            up.modal.close().then ->
              expect(parseInt($body.css('padding-right'))).toBe(0)
              restoreReporter()
              restoreBody()
              done()

        it 'pushes right-anchored elements away from the edge of the screen', (done) ->
          $fixture('.spacer').css(height: '9000px')
          # Safari 11 has no vertical scrollbar that takes away space from the document,
          # so the entire shifting logic is skipped.
          if up.viewport.rootHasReducedWidthFromScrollbar()
            scrollbarWidth = up.viewport.scrollbarWidth()
            $anchoredElement = $fixture('div[up-anchored=right]').css
              position: 'absolute'
              top: '0'
              right: '30px'

            promise = up.modal.visit('/foo', target: '.container')

            u.task =>
              @respondWith('<div class="container">text</div>')

            promise.then ->
              expect(parseInt($anchoredElement.css('right'))).toBeAround(30 + scrollbarWidth, 10)

              up.modal.close().then ->
                expect(parseInt($anchoredElement.css('right'))).toBeAround(30 , 10)
                done()
          else
            expect(true).toBe(true)
            done()

      describe 'opening a modal while another modal is open', ->

        it 'does not open multiple modals or pad the body twice if the user starts loading a second modal before the first was done loading', (done) ->
          up.modal.config.closeDuration = 10
          scrollbarWidth = up.viewport.scrollbarWidth()
          
          # Load a first modal
          up.modal.visit('/path1', target: '.container', animation: 'fade-in', duration: 50)

          # Immediately load a second modal in the same frame.
          # This will discard the first request immediately.
          up.modal.visit('/path2', target: '.container', animation: 'fade-in', duration: 50)

          u.task =>
            # The second modal has survived
            expect(jasmine.Ajax.requests.count()).toEqual(1)
            expect(@lastRequest().url).toMatchURL('/path2')

            # We send the response for 2
            @respondWith('<div class="container">response2</div>')

            u.timer 10, =>
              # The second modal is now opening
              up.modal.visit('/path3', target: '.container', animation: 'fade-in', duration: 50)

              # Load a third modal before the second was done opening
              u.task =>
                # Since we're still opening the second modal, no request has been made.
                expect(jasmine.Ajax.requests.count()).toEqual(1)

                u.timer 180, =>
                  # Now that the second modal has opened, we make the request to /path3
                  expect(jasmine.Ajax.requests.count()).toEqual(2)
                  expect(@lastRequest().url).toMatchURL('/path3')

                  @respondWith('<div class="container">response3</div>')

                  u.timer 180, =>
                    expect(jasmine.Ajax.requests.count()).toEqual(2)
                    expect($('up-overlay[up-mode=modal]').length).toBe(1)
                    expect($('up-overlay-box').length).toBe(1)
                    expect($('.container')).toHaveText('response3')
                    bodyPadding = parseInt($('body').css('padding-right'))
                    expect(bodyPadding).toBeAround(scrollbarWidth, 10)
                    if scrollbarWidth > 0 # this test does not make sense on old Safaris
                      expect(bodyPadding).not.toBeAround(2 * scrollbarWidth, 2 * 5)
                    done()

        it 'closes the current modal and wait for its close animation to finish before starting the open animation of a second modal', asyncSpec (next) ->
          up.modal.config.openAnimation = 'fade-in'
          up.modal.config.openDuration = 100
          up.modal.config.closeAnimation = 'fade-out'
          up.modal.config.closeDuration = 100

          events = []
          u.each ['up:modal:open', 'up:modal:opened', 'up:modal:close', 'up:modal:closed'], (event) ->
            up.on event, ->
              events.push(event)

          up.modal.extract('.target', '<div class="target">response1</div>')

          next =>
            # First modal is starting opening animation (will take 100 ms)
            expect(events).toEqual ['up:modal:open']
            expect($('.target')).toHaveText('response1')

          next.after (100 + (timingTolerance = 100)), =>
            # First modal has completed opening animation after 100 ms
            expect(events).toEqual ['up:modal:open', 'up:modal:opened']
            expect($('.target')).toHaveText('response1')

            # We open another modal, which will cause the first modal to start closing (will take 100 ms)
            up.modal.extract('.target', '<div class="target">response2</div>')

          next.after 50, =>
            # Second modal is still waiting for first modal's closing animaton to finish.
            expect(events).toEqual ['up:modal:open', 'up:modal:opened', 'up:modal:close']
            expect($('.target')).toHaveText('response1')

          next.after (50 + 100 + (timingTolerance = 200)), =>
            # First modal has finished closing, second modal has finished opening.
            expect(events).toEqual ['up:modal:open', 'up:modal:opened', 'up:modal:close', 'up:modal:closed', 'up:modal:open', 'up:modal:opened']
            expect($('.target')).toHaveText('response2')

        it 'closes an opening modal if a second modal starts opening before the first modal has finished its open animation', asyncSpec (next) ->
          up.modal.config.openAnimation = 'fade-in'
          up.modal.config.openDuration = 100
          up.modal.config.closeAnimation = 'fade-out'
          up.modal.config.closeDuration = 100

          # Open the first modal
          up.modal.extract('.target', '<div class="target">response1</div>')

          next.after 50, =>
            # First modal is still in its opening animation
            expect($('.target')).toHaveText('response1')

            # Open a second modal
            up.modal.extract('.target', '<div class="target">response2</div>')

          next =>
            # First modal is starting close animation. Second modal waits for that.
            expect($('.target')).toHaveText('response1')

          next.after 10, =>
            # Second modal is still waiting for first modal's closing animaton to finish.
            expect($('.target')).toHaveText('response1')

          next.after (140 + (timingTolerance = 220)), =>
            # First modal has finished closing, second modal has finished opening.
            expect($('.target')).toHaveText('response2')

#        it 'uses the correct mode config for the first and second modal', asyncSpec (next) ->
#          up.modal.config.openAnimation = 'fade-in'
#          up.modal.config.openDuration = 20
#          up.modal.config.closeAnimation = 'fade-out'
#          up.modal.config.closeDuration = 20
#          up.modal.mode 'custom-drawer',
#            openAnimation: 'move-from-right'
#            closeAnimation: 'move-to-right'
#
#          animations = []
#          spyOn(up, 'animate').and.callFake (element, animation, options) ->
#            if e.matches(element, 'up-overlay-viewport')
#              animations.push
#                text: element.querySelector('.target').innerText.trim()
#                animation: animation
#            deferred = u.newDeferred()
#            u.timer options.duration, -> deferred.resolve()
#            deferred.promise()
#
#          up.modal.extract('.target', '<div class="target">response1</div>')
#
#          next =>
#            expect(animations).toEqual [
#              { animation: 'fade-in', text: 'response1' }
#            ]
#
#          next.after 30, =>
#            # first modal is now done animating
#            expect(animations).toEqual [
#              { animation: 'fade-in', text: 'response1' }
#            ]
#
#            up.modal.extract('.target', '<div class="target">response2</div>', mode: 'custom-drawer')
#
#          next =>
#            expect(animations).toEqual [
#              { animation: 'fade-in', text: 'response1' },
#              { animation: 'fade-out', text: 'response1' },
#            ]
#
#          next.after 30, =>
#            expect(animations).toEqual [
#              { animation: 'fade-in', text: 'response1' },
#              { animation: 'fade-out', text: 'response1' },
#              { animation: 'move-from-right', text: 'response2' }
#            ]
#
#            expect($('up-overlay').attr('up-mode')).toEqual('custom-drawer')


        it 'never resolves the open() promise and shows no error if close() was called before the response was received', asyncSpec (next) ->
          openPromise = up.modal.visit('/foo', target: '.container')

          next =>
            up.modal.close()

          next =>
            respond = => @respondWith('<div class="container">text</div>')
            expect(respond).not.toThrowError()

          next.await =>
            expect($('up-toast')).not.toBeAttached()
            promise = promiseState(openPromise)
            promise.then (result) => expect(result.state).toEqual('pending')

    describe 'up.modal.coveredUrl', ->

      describeCapability 'canPushState', ->

        it 'returns the URL behind the modal overlay', (done) ->
          up.history.config.enabled = true
          up.history.replace('/foo')

          expect(up.modal.coveredUrl()).toBeMissing()
          visitPromise = up.modal.visit('/bar', target: '.container')
          u.task =>
            @respondWith('<div class="container">text</div>')
            visitPromise.then ->
              expect(up.modal.coveredUrl()).toMatchURL('/foo')
              up.modal.close().then ->
                expect(up.modal.coveredUrl()).toBeMissing()
                done()

#    describe 'up.modal.modes', ->
#
#      it 'allows to register new modal variants with its own default configuration', asyncSpec (next) ->
#        up.modal.modes.variant = { maxWidth: 200 }
#        $link = $fixture('a[href="/path"][up-modal=".target"][up-mode="variant"]')
#        $up.hello($link)
#        Trigger.click($link)
#
#        next =>
#          @respondWith('<div class="target">new text</div>')
#
#        next =>
#          $modal = $('.up-modal')
#          $dialog = $modal.find('.up-modal-dialog')
#          expect($modal).toBeAttached()
#          expect($modal.attr('up-mode')).toEqual('variant')
#          expect($dialog.attr('style')).toContain('max-width: 200px')
#
#      it 'does not change the configuration of non-modeed modals', asyncSpec (next) ->
#        up.modal.modes.variant = { maxWidth: 200 }
#        $link = $fixture('a[href="/path"][up-modal=".target"]')
#        $up.hello($link)
#        Trigger.click($link)
#
#        next =>
#          @respondWith('<div class="target">new text</div>')
#
#        next =>
#          $modal = $('.up-modal')
#          $dialog = $modal.find('.up-modal-dialog')
#          expect($modal).toBeAttached()
#          expect($dialog.attr('style')).toBeBlank()

    describe 'up.modal.close', ->

      it 'closes a currently open modal', (done) ->
        up.modal.extract('.content', '<div class="content">Modal content</div>')

        u.task =>
          expect('up-overlay[up-mode=modal] .content').toBeAttached()

          up.modal.close().then ->
            expect('up-overlay[up-mode=modal] .content').not.toBeAttached()
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
          @$link = $fixture('a[href="/path"][up-modal=".target"]')
          up.hello(@$link)
          @followSpy = up.link.knife.mock('follow').and.returnValue(Promise.resolve())

      it 'opens the clicked link in a modal', asyncSpec (next) ->
        @$link = $fixture('a[href="/path"][up-modal=".target"]')
        up.hello(@$link)
        Trigger.click(@$link)

        next =>
          lastRequest = @lastRequest()
          expect(lastRequest.url).toMatchURL('/path')
          @respondWith '<div class="target">new content</div>'

        next =>
          expect('up-overlay[up-mode=modal]').toBeAttached()
          expect('up-overlay-content').toHaveText('new content')

      describe 'when modifier keys are held', ->

        # IE does not call JavaScript and always performs the default action on right clicks
        unless AgentDetector.isIE() || AgentDetector.isEdge()
          it 'does nothing if the right mouse button is used', asyncSpec (next) ->
            @stubFollow()
            Trigger.click(@$link, button: 2)
            next => expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing if shift is pressed during the click', asyncSpec (next) ->
          @stubFollow()
          Trigger.click(@$link, shiftKey: true)
          next => expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing if ctrl is pressed during the click', asyncSpec (next) ->
          @stubFollow()
          Trigger.click(@$link, ctrlKey: true)
          next => expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing if meta is pressed during the click', asyncSpec (next) ->
          @stubFollow()
          Trigger.click(@$link, metaKey: true)
          next => expect(@followSpy).not.toHaveBeenCalled()

      describe 'with [up-instant] modifier', ->

        beforeEach ->
          @stubFollow()
          @$link.attr('up-instant', '')

        it 'opens the modal on mousedown (instead of on click)', asyncSpec (next) ->
          Trigger.mousedown(@$link)
          next =>
            expect(@followSpy).toHaveBeenCalledWith(@$link[0])

        it 'does nothing on mouseup', asyncSpec (next) ->
          Trigger.mouseup(@$link)
          next => expect(@followSpy).not.toHaveBeenCalled()

        it 'does nothing on click', asyncSpec (next) ->
          Trigger.mousedown(@$link)
          Trigger.click(@$link)
          next => expect(@followSpy.calls.count()).toBe(1)

        # IE does not call JavaScript and always performs the default action on right clicks
        unless AgentDetector.isIE() || AgentDetector.isEdge()
          it 'does nothing if the right mouse button is pressed down', asyncSpec (next) ->
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

      describe 'with [up-method] modifier', ->

        it 'honours the given method', asyncSpec (next) ->
          $link = $fixture('a[href="/path"][up-modal=".target"][up-method="post"]')
          up.hello($link)
          Trigger.click($link)

          next =>
            expect(@lastRequest().method).toEqual 'POST'

      describe 'with [up-cache] modifier', ->
        it 'honours the given setting', asyncSpec (next) ->
          $link = $fixture('a[href="/path"][up-modal=".target"][up-cache="false"]')
          Trigger.clickSequence($link)

          next =>
            @respondWith('<div class="target">modal content 1</div>')

          next =>
            expect('.up-modal .target').toHaveText('modal content 1')
            history.back()

          next =>
            Trigger.clickSequence($link)

          next =>
            @respondWith('<div class="target">modal content 2</div>')

          next =>
            expect('.up-modal .target').toHaveText('modal content 2')

      it 'adds a history entry and allows the user to use the back button', asyncSpec (next) ->
        up.motion.config.enabled = false
        up.history.config.enabled = true
        up.history.config.restoreTargets = ['.container']

        up.history.push('/original-path')

        $container = $fixture('.container').text('old container content')
        $link = $container.affix('a[href="/new-path"][up-modal=".target"]')
        up.hello($link)

        expect(location.pathname).toEqual('/original-path')

        Trigger.clickSequence($link)

        next =>
          @respondWith('<div class="target">modal content</div>')

        next =>
          expect(location.pathname).toEqual('/new-path')
          expect('up-overlay[up-mode=modal] .target').toHaveText('modal content')

          history.back()

        next.after (waitForBrowser = 70), =>
          @respondWith('<div class="container">restored container content</div>')

        next =>
          expect(location.pathname).toEqual('/original-path')
          expect('.container').toHaveText('restored container content')
          expect('up-overlay').not.toBeAttached()

      it 'allows to open a modal after closing a previous modal with the escape key (bugfix)', asyncSpec (next) ->
        up.motion.config.enabled = false

        $link1 = $fixture('a[href="/path1"][up-modal=".target"]')
        up.hello($link1)
        $link2 = $fixture('a[href="/path2"][up-modal=".target"]')
        up.hello($link2)
        Trigger.clickSequence($link1)

        next =>
          @respondWith('<div class="target">content 1</div>')

        next =>
          expect(up.modal.isOpen()).toBe(true)

          Trigger.escapeSequence(document.body)

        next =>
          expect(up.modal.isOpen()).toBe(false)

          Trigger.clickSequence($link2)

        next =>
          @respondWith('<div class="target">content 1</div>')

        next =>
          expect(up.modal.isOpen()).toBe(true)


    describe '[up-drawer]', ->

      beforeEach ->
        up.motion.config.enabled = false

      it 'slides in a drawer that covers the full height of the screen', asyncSpec (next) ->
        $link = $fixture('a[href="/qux"][up-drawer=".target"]').text('label')
        up.hello($link)
        Trigger.clickSequence($link)

        next =>
          @respondWith '<div class="target">new text</div>'

        next =>
          expect(up.modal.isOpen()).toBe(true)
          expect($('up-overlay').attr('up-mode')).toEqual('drawer')
          windowHeight = up.viewport.rootHeight()
          modalHeight = $('up-overlay-box').outerHeight()
          expect(modalHeight).toEqual(windowHeight)
          expect($('up-overlay-box').offset()).toEqual(top: 0, left: 0)

      it 'puts the drawer on the right with [up-position=right]', asyncSpec (next) ->
        $link = $fixture('a[href="/foo"][up-drawer=".target"][up-position="right"]').text('label')
        up.hello($link)
        Trigger.clickSequence($link)

        next =>
          @respondWith '<div class="target">new text</div>'

        next =>
          expect(up.modal.isOpen()).toBe(true)
          windowWidth = up.viewport.rootWidth()
          modalWidth = $('up-overlay-box').outerWidth()
          scrollbarWidth = up.viewport.scrollbarWidth()
          expect($('up-overlay-box').offset().left).toBeAround(windowWidth - modalWidth - scrollbarWidth, 1.0)

    describe '[up-dismiss]', ->

      backgroundClicked = undefined

      beforeEach ->
        up.motion.config.enabled = false
        backgroundClicked = jasmine.createSpy('background clicked')
        up.on 'click', backgroundClicked

      describe 'when clicked inside a modal', ->

        it 'closes the open modal and halts the event chain', asyncSpec (next) ->
          up.modal.extract('.target', '<div class="target"><a up-close>text</a></div>', animation: false)

          next =>
            $link = $('up-overlay up-overlay-dismiss') # link is within the modal
            Trigger.clickSequence($link)

          next =>
            expect(up.modal.isOpen()).toBe(false)
            expect(backgroundClicked).not.toHaveBeenCalled()


      describe 'when no modal is open', ->

        it 'does nothing and allows the event chain to continue', asyncSpec (next) ->
          $link = $fixture('a[up-dismiss]') # link is outside the modal
          up.hello($link)
          Trigger.clickSequence($link)

          next =>
            expect(backgroundClicked).toHaveBeenCalled()

    describe 'closing', ->

      it 'closes the modal on close icon click', asyncSpec (next) ->
        up.modal.extract('.modal', '<div class="modal">Modal content</div>', animation: false)

        next =>
          $closeIcon = $('up-overlay-dismiss')
          Trigger.clickSequence($closeIcon)

        next =>
          expect(up.modal.isOpen()).toBe(false)

      it 'closes the modal on backdrop click', asyncSpec (next) ->
        up.modal.extract('.modal', '<div class="modal">Modal content</div>', animation: false)

        next =>
          backdrop = document.elementFromPoint(5, 5)
          Trigger.clickSequence(backdrop)

        next =>
          expect(up.modal.isOpen()).toBe(false)

      it "does not close the modal when clicking on an element outside the modal's DOM hierarchy", asyncSpec (next) ->
        $container = $fixture('.container')
        up.modal.extract('.modal', '<div class="modal">Modal content</div>', animation: false)

        next =>
          Trigger.clickSequence($container)

        next =>
          expect(up.modal.isOpen()).toBe(true)

      it 'closes the modal when the user presses the escape key', asyncSpec (next) ->
        wasClosed = false
        up.on 'up:modal:close', ->
          wasClosed = true

        up.modal.extract('.modal', '<div class="modal">Modal content</div>', animation: false)

        next =>
          Trigger.escapeSequence(document.body)

        next =>
          expect(wasClosed).toBe(true)

      it 'stays open if #preventDefault() is called on up:modal:close event', asyncSpec (next) ->
        up.modal.extract('.target', '<div class="target"><a up-close>text</a></div>', animation: false)
        up.on 'up:modal:close', (e) ->
          e.preventDefault()

        next =>
          backdrop = document.elementFromPoint(5, 5)
          Trigger.clickSequence(backdrop)

        next =>
          expect(up.modal.isOpen()).toBe(true)

          # Since there isn't anyone who could handle the rejection inside
          # the event handler, our handler mutes the rejection.
          expect(window).not.toHaveUnhandledRejections()

      describe 'when opened with { dismissable: false }', ->

        it 'does not render a close icon', asyncSpec (next) ->
          up.modal.extract('.modal', '<div class="modal">Modal content</div>', animation: false, dismissable: false)

          next =>
            expect('up-overlay').not.toHaveDescendant('up-overlay-dismiss')

        it 'does not close the modal on backdrop click', asyncSpec (next) ->
          up.modal.extract('.modal', '<div class="modal">Modal content</div>', animation: false, dismissable: false)

          next =>
            backdrop = document.elementFromPoint(5, 5)
            Trigger.clickSequence(backdrop)

          next =>
            expect(up.modal.isOpen()).toBe(true)

        it 'does not close the modal when the user presses the escape key', asyncSpec (next) ->
          up.modal.extract('.modal', '<div class="modal">Modal content</div>', animation: false, dismissable: false)

          next =>
            Trigger.escapeSequence(document.body)

          next =>
            expect(up.modal.isOpen()).toBe(true)

    describe 'when replacing content', ->

      beforeEach ->
        up.motion.config.enabled = false

      it 'prefers to replace a selector within the modal', asyncSpec (next) ->
        $outside = $fixture('.foo').text('old outside')
        up.modal.visit('/path', target: '.foo')

        next =>
          @respondWith("<div class='foo'>old inside</div>")

        next =>
          up.extract('.foo', "<div class='foo'>new text</div>")

        next =>
          expect($outside).toBeAttached()
          expect($outside).toHaveText('old outside')
          expect($('up-overlay-content')).toHaveText('new text')

      it 'auto-closes the modal when a replacement from inside the modal affects a selector behind the modal', asyncSpec (next) ->
        $fixture('.outside').text('old outside')
        up.modal.visit('/path', target: '.inside')

        next =>
          @respondWith("<div class='inside'>old inside</div>")

        next =>
          up.extract('.outside', "<div class='outside'>new outside</div>", layer: 'root', origin: $('.inside'))

        next =>
          expect($('.outside')).toHaveText('new outside')
          expect($('up-overlay')).not.toBeAttached()

      it 'does not restore the covered URL when auto-closing (since it would override the URL from the triggering update)', asyncSpec (next) ->
        up.history.config.enabled = true
        up.motion.config.enabled = true
        up.modal.config.openDuration = 0
        up.modal.config.closeDuration = 20

        $fixture('.outside').text('old outside')
        up.modal.visit('/path', target: '.inside')

        next =>
          @respondWith("<div class='inside'>old inside</div>") # Populate modal

        next =>
          up.extract('.outside', "<div class='outside'>new outside</div>",
            layer: 'root', origin: $('.inside'), history: '/new-location') # Provoke auto-close

        next =>
          expect(location.href).toMatchURL '/new-location'

      it 'does not auto-close the modal when a replacement from inside the modal affects a selector inside the modal', asyncSpec (next) ->
        $fixture('.outside').text('old outside')
        up.modal.visit('/path', target: '.inside')

        next =>
          @respondWith("<div class='inside'>old inside</div>")

        next =>
          up.extract('.inside', "<div class='inside'>new inside</div>", origin: $('.inside'))

        next =>
          expect($('.inside')).toHaveText('new inside')
          expect($('up-overlay')).toBeAttached()

      it 'does not auto-close the modal when a replacement from outside the modal affects a selector outside the modal', asyncSpec (next) ->
        $fixture('.outside').text('old outside')
        up.modal.visit('/path', target: '.inside')

        # throw "apparently peeling seemed to have more conditions"

        next =>
          @respondWith("<div class='inside'>old inside</div>")

        next =>
          up.extract('.outside', "<div class='outside'>new outside</div>", origin: $('.outside'), layer: 'root')

        next =>
          expect($('.outside')).toHaveText('new outside')
          expect($('up-overlay')).toBeAttached()

      it 'does not auto-close the modal when a replacement from outside the modal affects a selector inside the modal', asyncSpec (next) ->
        $fixture('.outside').text('old outside')
        up.modal.visit('/path', target: '.inside')

        next =>
          @respondWith("<div class='inside'>old inside</div>")

        next =>
          up.extract('.inside', "<div class='inside'>new inside</div>", origin: $('.outside'))

        next =>
          expect($('.inside')).toHaveText('new inside')
          expect($('up-overlay')).toBeAttached()

      it 'does not auto-close the modal when the new fragment is within a popup', asyncSpec (next) ->
        up.modal.visit('/modal', target: '.modal-content')

        next =>
          @respondWith("<div class='modal-content'></div>")

        next =>
          up.popup.attach('.modal-content', url: '/popup', target: '.popup-content')

        next =>
          @respondWith("<div class='popup-content'></div>")

        next =>
          expect($('up-overlay[up-mode=modal]')).toBeAttached()
          expect($('up-overlay[up-mode=popup]')).toBeAttached()

      it 'does not close the modal when a clicked [up-target] link within the modal links to cached content (bugfix)', asyncSpec (next) ->
        up.modal.extract '.content', """
          <div class="content">
            <a href="/foo" up-target=".content">link</a>
          </div>
          """

        next =>
          $link = $('up-overlay .content a')
          expect($link).toBeAttached()
          up.network.preload($link)

        next =>
          @respondWith """
            <div class="content">
              new text
            </div>
          """

        next =>
          Trigger.clickSequence('up-overlay .content a')

        next =>
          expect($('up-overlay')).toBeAttached()
          expect($('up-overlay .content')).toHaveText('new text')
