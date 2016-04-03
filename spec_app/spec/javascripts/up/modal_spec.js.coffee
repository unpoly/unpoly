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

      it "brings its own scrollbar, padding the body on the right in order to prevent jumping", (done) ->
        promise = up.modal.visit('/foo', target: '.container')

        @respondWith('<div class="container">text</div>')

        promise.then ->

          $modal = $('.up-modal')
          $body = $('body')
          expect($modal).toExist()
          expect($modal.css('overflow-y')).toEqual('scroll')
          expect($body.css('overflow-y')).toEqual('hidden')
          expect(parseInt($body.css('padding-right'))).toBeAround(assumedScrollbarWidth, 10)

          up.modal.close().then ->
            expect($body.css('overflow-y')).toEqual('scroll')
            expect(parseInt($body.css('padding-right'))).toBe(0)

            done()

      it 'pushes right-anchored elements away from the edge of the screen in order to prevent jumping', (done) ->

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

      it 'does not explode if the modal was closed before the response was received', ->
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
          up.modal.visit('/bar', target: '.container')
          @respondWith('<div class="container">text</div>')
          expect(up.modal.coveredUrl()).toEndWith('/foo')
          up.modal.close().then ->
            expect(up.modal.coveredUrl()).toBeUndefined()
            done()


    describe 'up.modal.close', ->

      it 'closes a currently open modal'

      it 'does nothing if no modal is open'

    describe 'up.modal.source', ->

      it 'should have tests'

  describe 'unobtrusive behavior', ->
    
    describe 'a[up-modal]', ->
      
      beforeEach ->
        @$link = affix('a[href="/path"][up-modal=".target"]')
        @followSpy = up.modal.knife.mock('follow')
        @defaultSpy = up.link.knife.mock('allowDefault').and.callFake((event) -> event.preventDefault())

      it 'opens the clicked link in a modal', ->
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
