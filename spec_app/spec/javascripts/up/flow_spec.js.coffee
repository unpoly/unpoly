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
    
    it 'should replace the given selector with the same selector from a freshly fetched page', (done) ->
      @promise.then ->
        expect($('.before')).toHaveText('old-before')
        expect($('.middle')).toHaveText('new-middle')
        expect($('.after')).toHaveText('old-after')
        done()      
      
    it 'should set the browser location to the given URL', (done) ->
      @promise.then ->
        expect(window.location.pathname).toBe('/path')
        done()
