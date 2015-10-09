describe 'up.modal', ->
  
  describe 'Javascript functions', ->
    
    describe 'up.modal.defaults', ->
      
      it 'should have tests'
        
    describe 'up.modal.open', ->

      assumedScrollbarWidth = 15

      it "loads the given link's destination in a dialog window", (done) ->
        $link = affix('a[href="/path/to"][up-modal=".middle"]').text('link')
        promise = up.modal.open($link)
        request = @lastRequest()
        expect(request.url).toMatch /\/path\/to$/
        request.respondWith
          status: 200
          contentType: 'text/html'
          responseText:
            """
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

      it "brings its own scrollbar, padding the body on the right in order to prevent jumping", (done) ->
        promise = up.modal.open(url: '/foo', target: '.container')

        @lastRequest().respondWith
          status: 200
          contentType: 'text/html'
          responseText:
            """
            <div class="container">text</div>
            """

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

        promise = up.modal.open(url: '/foo', target: '.container')

        @lastRequest().respondWith
          status: 200
          contentType: 'text/html'
          responseText:
            """
            <div class="container">text</div>
            """

        promise.then ->
          expect(parseInt($anchoredElement.css('right'))).toBeAround(30 + assumedScrollbarWidth, 10)

          up.modal.close().then ->
            expect(parseInt($anchoredElement.css('right'))).toBeAround(30 , 10)
            done()

    describe 'up.modal.close', ->

      it 'should have tests'

    describe 'up.modal.source', ->

      it 'should have tests'

  describe 'unobtrusive behavior', ->
    
    describe 'a[up-modal]', ->
      
      it 'should have tests'
      
    describe '[up-close]', ->
      
      it 'should have tests'

    describe 'when following links inside a modal', ->

      it 'prefers to replace a selector within the modal'

      it 'auto-closes the modal if a selector behind the modal gets replaced'

      it "doesn't auto-close the modal if a selector behind the modal if the modal is sticky"

      it "doesn't auto-close the modal if the new fragment is a popup"
