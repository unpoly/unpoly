describe 'up.modal', ->

  u = up.util
  
  describe 'Javascript functions', ->

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
            expect($modal.css('overflow-y')).toEqual('auto')
            expect($viewport.css('overflow-y')).toEqual('scroll')
            closePromise = up.modal.close(animation: 'fade-out', duration: 100)
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
          promise1 = up.modal.visit('/path1', target: '.container', animation: 'fade-in', duration: 100)
          promise2 = up.modal.visit('/path2', target: '.container', animation: 'fade-in', duration: 100)
          expect(jasmine.Ajax.requests.count()).toBe(2)
          request1 = jasmine.Ajax.requests.at(0)
          request2 = jasmine.Ajax.requests.at(1)

          u.setTimer 10, =>
            @respondWith('<div class="container">response1</div>', request: request1)
            u.setTimer 10, =>
              @respondWith('<div class="container">response2</div>', request: request2)
              u.setTimer 110, =>
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
          up.modal.config.closeDuration = 50

          events = []
          u.each ['up:modal:open', 'up:modal:opened', 'up:modal:close', 'up:modal:closed'], (event) ->
            up.on event, ->
              events.push(event)

          up.modal.extract('.target', '<div class="target">response1</div>')

          # First modal is starting opening animation
          expect(events).toEqual ['up:modal:open']
          expect($('.target')).toHaveText('response1')

          u.setTimer 40, ->
            # First modal has completed opening animation
            expect(events).toEqual ['up:modal:open', 'up:modal:opened']
            expect($('.target')).toHaveText('response1')

            up.modal.extract('.target', '<div class="target">response2</div>')

            # First modal is starting close animation. Second modal waits for that.
            expect(events).toEqual ['up:modal:open', 'up:modal:opened', 'up:modal:open', 'up:modal:close']
            expect($('.target')).toHaveText('response1')

            u.setTimer 40, ->

              # Second modal is still waiting for first modal's closing animaton to finish.
              expect(events).toEqual ['up:modal:open', 'up:modal:opened', 'up:modal:open', 'up:modal:close']
              expect($('.target')).toHaveText('response1')

              u.setTimer 100, ->

                # First modal has finished closing, second modal has finished opening.
                expect(events).toEqual ['up:modal:open', 'up:modal:opened', 'up:modal:open', 'up:modal:close', 'up:modal:closed', 'up:modal:opened']
                expect($('.target')).toHaveText('response2')

                done()

        it 'closes an opening modal if a second modal starts opening before the first modal has finished its open animation', (done) ->
          up.modal.config.openAnimation = 'fade-in'
          up.modal.config.openDuration = 50
          up.modal.config.closeAnimation = 'fade-out'
          up.modal.config.closeDuration = 50

          up.modal.extract('.target', '<div class="target">response1</div>')

          u.setTimer 10, ->
            # First modal is still in its opening animation
            expect($('.target')).toHaveText('response1')

            up.modal.extract('.target', '<div class="target">response2</div>')

            # First modal is starting close animation. Second modal waits for that.
            expect($('.target')).toHaveText('response1')

            u.setTimer 10, ->
              # Second modal is still waiting for first modal's closing animaton to finish.
              expect($('.target')).toHaveText('response1')

              u.setTimer 90, ->
                # First modal has finished closing, second modal has finished opening.
                expect($('.target')).toHaveText('response2')

                done()

        it 'uses the correct flavor config for the first and second modal', (done) ->
          up.modal.config.openAnimation = 'fade-in'
          up.modal.config.openDuration = 10
          up.modal.config.closeAnimation = 'fade-out'
          up.modal.config.closeDuration = 10
          up.modal.flavor 'drawer',
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

          up.modal.extract('.target', '<div class="target">response2</div>', flavor: 'drawer')

          expect(animations).toEqual [
            { animation: 'fade-in', text: 'response1' },
            { animation: 'fade-out', text: 'response1' }
          ]

          u.setTimer 20, ->

            expect(animations).toEqual [
              { animation: 'fade-in', text: 'response1' },
              { animation: 'fade-out', text: 'response1' },
              { animation: 'move-from-right', text: 'response2' }
            ]

            expect($('.up-modal').attr('up-flavor')).toEqual('drawer')

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
          expect(up.modal.coveredUrl()).toBeUndefined()
          visitPromise = up.modal.visit('/bar', target: '.container')
          @respondWith('<div class="container">text</div>')
          visitPromise.then ->
            expect(up.modal.coveredUrl()).toEndWith('/foo')
            up.modal.close().then ->
              expect(up.modal.coveredUrl()).toBeUndefined()
              done()

    describe 'up.modal.flavor', ->

      it 'registers a new modal variant with its own default configuration', ->
        up.modal.flavor('variant', { maxWidth: 200 })
        $link = affix('a[href="/path"][up-modal=".target"][up-flavor="variant"]')
        Trigger.click($link)
        @respondWith('<div class="target">new text</div>')
        $modal = $('.up-modal')
        $dialog = $modal.find('.up-modal-dialog')
        expect($modal).toBeInDOM()
        expect($modal.attr('up-flavor')).toEqual('variant')
        expect($dialog.attr('style')).toContain('max-width: 200px')

      it 'does not change the configuration of non-flavored modals', ->
        up.modal.flavor('variant', { maxWidth: 200 })
        $link = affix('a[href="/path"][up-modal=".target"]')
        Trigger.click($link)
        @respondWith('<div class="target">new text</div>')
        $modal = $('.up-modal')
        $dialog = $modal.find('.up-modal-dialog')
        expect($modal).toBeInDOM()
        expect($dialog.attr('style')).toBeBlank()

    describe 'up.modal.close', ->

      it 'closes a currently open modal'

      it 'does nothing if no modal is open'

    describe 'up.modal.source', ->

      it 'should have tests'

  describe 'unobtrusive behavior', ->
    
    describe 'a[up-modal]', ->

      beforeEach ->
        @stubFollow = =>
          @$link = affix('a[href="/path"][up-modal=".target"]')
          @followSpy = up.modal.knife.mock('follow').and.returnValue(u.resolvedPromise())
          @defaultSpy = up.link.knife.mock('allowDefault').and.callFake((event) -> event.preventDefault())

      it 'opens the clicked link in a modal', ->
        @stubFollow()
        Trigger.click(@$link)
        expect(@followSpy).toHaveBeenCalledWith(@$link)

      # IE does not call Javascript and always performs the default action on right clicks
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

      describe 'with [up-method] modifier', ->

        it 'honours the given method', ->
          $link = affix('a[href="/path"][up-modal=".target"][up-method="post"]')
          Trigger.click($link)
          expect(@lastRequest().method).toEqual 'POST'


    describe '[up-close]', ->

      describe 'when clicked inside a modal', ->
      
        it 'closes the open modal and prevents the default action', ->
          $modal = affix('.up-modal')
          $link = $modal.affix('a[up-close]') # link is within the modal
          up.hello($link)
          wasDefaultPrevented = false
          wasClosed = false
          up.on 'click', 'a[up-close]', (event) ->
            wasDefaultPrevented = event.isDefaultPrevented()
            true # the line above might return false and cancel propagation / prevent default
          up.on 'up:modal:close', ->
            wasClosed = true
          $link.click()
          expect(wasClosed).toBe(true)
          expect(wasDefaultPrevented).toBe(true)

      describe 'when no modal is open', ->

        it 'does neither close the modal nor prevent the default action', ->
          $link = affix('a[up-close]') # link is outside the modal
          up.hello($link)
          wasDefaultPrevented = false
          wasClosed = false
          up.on 'click', 'a[up-close]', (event) ->
            wasDefaultPrevented = event.isDefaultPrevented()
            true # the line above might return false and cancel propagation / prevent default
          up.on 'up:modal:close', ->
            wasClosed = true
          $link.click()
          expect(wasClosed).toBe(false)
          expect(wasDefaultPrevented).toBe(false)

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
