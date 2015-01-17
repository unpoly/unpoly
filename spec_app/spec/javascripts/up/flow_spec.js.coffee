describe 'up.flow', ->
  
  describe '.replace', ->
    
    beforeEach ->
      jasmine.Ajax.install()

      before = affix('.before').text('old-before')
      middle = affix('.middle').text('old-middle')
      after = affix('.after').text('old-after')

      @promise = up.replace('.middle', '/path')

      jasmine.Ajax.requests.mostRecent().respondWith
        status: 200
        contentType: '/text/html'
        responseText:
          """
          <div class="before">new-before</div>
          <div class="middle">new-middle</div>
          <div class="after">new-after</div>
          """      
    
    it 'replaces the given selector with the same selector from a freshly fetched page', (done) ->
      @promise.then ->
        expect($('.before')).toHaveText('old-before')
        expect($('.middle')).toHaveText('new-middle')
        expect($('.after')).toHaveText('old-after')
        done()      
      
    it 'should set the browser location to the given URL', (done) ->
      @promise.then ->
        expect(window.location.pathname).toBe('/path')
        done()
        
    it 'marks the element with the URL from which it was retrieved', (done) ->
      @promise.then ->
        expect($('.middle').attr('up-source')).toMatch(/\/path$/)
        done()

  describe '.destroy', ->
    
    it 'removes the element with the given selector', ->
      affix('.element')
      up.destroy('.element')
      expect($('.element')).not.toExist()
      
    it 'calls destructors for custom elements', ->
      up.awaken('.element', ($element) -> destructor)
      destructor = jasmine.createSpy('destructor')
      up.ready(affix('.element'))
      up.destroy('.element')
      expect(destructor).toHaveBeenCalled()

  
      
#    it 'sends a notification that the element is being destroyed', ->
#      $element = affix('.element')
#      spyOn(up.bus, 'emit').and.callFake ($element) ->
#        expect($element).toExist()
#      expect(up.bus.emit).toHaveBeenCalledWith('fragment:destroy', $element)
#      up.destroy($element)
    