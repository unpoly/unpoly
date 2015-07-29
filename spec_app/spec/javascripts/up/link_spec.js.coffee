describe 'up.link', ->
  
  describe 'Javascript functions', ->
  
    describe 'up.follow', ->
      
      if up.browser.canPushState()
      
        it 'loads the given link via AJAX and replaces the response in the given target', (done) ->
          affix('.before').text('old-before')
          affix('.middle').text('old-middle')
          affix('.after').text('old-after')
          $link = affix('a[href="/path"][up-target=".middle"]')
    
          promise = up.follow($link)
    
          jasmine.Ajax.requests.mostRecent().respondWith
            status: 200
            contentType: 'text/html'
            responseText:
              """
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
          request = jasmine.Ajax.requests.mostRecent()
          expect(request.method).toBe('PUT')

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

      it 'should have tests'

    describe '[up-follow]', ->

      it 'should have tests'
      
    describe '[up-instant]', ->

      beforeEach ->
        @$link = affix('a[href="/path"][up-follow][up-instant]')
        @followSpy = up.link.knife.mock('follow')

      afterEach ->
        Knife.reset()

      it 'follows an [up-follow] link on mousedown (instead of on click)', ->
        Trigger.mousedown(@$link)
        expect(@followSpy.calls.mostRecent().args[0]).toEqual(@$link)
      
      it 'follows an [up-target] link on mousedown (instead of on click)', ->
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
      