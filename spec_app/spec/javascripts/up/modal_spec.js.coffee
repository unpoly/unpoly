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
      
      it 'opens the clicked link in a modal', ->
        followSpy = up.modal.knife.mock('follow')
        $link = affix('a[href="/path"][up-modal=".foo"]')
        up.hello($link)
        $link.click()
        expect(followSpy).toHaveBeenCalledWith($link)

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
        up.modal.config.openAnimation = 'none'
        up.modal.config.closeAnimation = 'none'
        up.popup.config.openAnimation = 'none'
        up.popup.config.closeAnimation = 'none'

      it 'prefers to replace a selector within the modal', ->
        $outside = affix('.foo').text('old outside')
        up.modal.visit('/path', target: '.foo')
        @respondWith("<div class='foo'>old inside</div>")
        up.flow.implant('.foo', "<div class='foo'>new text</div>")
        expect($outside).toBeInDOM()
        expect($outside).toHaveText('old outside')
        expect($('.up-modal-content')).toHaveText('new text')

      it 'auto-closes the modal when a replacement from inside the modal affects a selector behind the modal', ->
        affix('.outside').text('old outside')
        up.modal.visit('/path', target: '.inside')
        @respondWith("<div class='inside'>old inside</div>")
        up.flow.implant('.outside', "<div class='outside'>new outside</div>", origin: $('.inside'))
        expect($('.outside')).toHaveText('new outside')
        expect($('.up-modal')).not.toExist()

      it 'does not auto-close the modal when a replacement from inside the modal affects a selector inside the modal', ->
        affix('.outside').text('old outside')
        up.modal.visit('/path', target: '.inside')
        @respondWith("<div class='inside'>old inside</div>")
        up.flow.implant('.inside', "<div class='inside'>new inside</div>", origin: $('.inside'))
        expect($('.inside')).toHaveText('new inside')
        expect($('.up-modal')).toExist()

      it 'does not auto-close the modal when a replacement from outside the modal affects a selector outside the modal', ->
        affix('.outside').text('old outside')
        up.modal.visit('/path', target: '.inside')
        @respondWith("<div class='inside'>old inside</div>")
        up.flow.implant('.outside', "<div class='outside'>new outside</div>", origin: $('.outside'))
        expect($('.outside')).toHaveText('new outside')
        expect($('.up-modal')).toExist()

      it 'does not auto-close the modal when a replacement from outside the modal affects a selector inside the modal', ->
        affix('.outside').text('old outside')
        up.modal.visit('/path', target: '.inside')
        @respondWith("<div class='inside'>old inside</div>")
        up.flow.implant('.inside', "<div class='inside'>new inside</div>", origin: $('.outside'))
        expect($('.inside')).toHaveText('new inside')
        expect($('.up-modal')).toExist()

      it 'does not auto-close the modal when the new fragment is within a popup', ->
        up.modal.visit('/modal', target: '.modal-content')
        @respondWith("<div class='modal-content'></div>")
        up.popup.attach('.modal-content', url: '/popup', target: '.popup-content')
        @respondWith("<div class='popup-content'></div>")
        expect($('.up-modal')).toExist()
        expect($('.up-popup')).toExist()

    describe 'when following links inside a modal', ->

      it 'prefers to replace a selector within the modal', ->

      it 'auto-closes the modal if a selector behind the modal gets replaced'

      it "doesn't auto-close the modal if a selector behind the modal if the modal is sticky"

      it "doesn't auto-close the modal if the new fragment is a popup"
