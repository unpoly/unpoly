describe 'up.link', ->
  
  describe 'up.follow', ->
    
    it 'loads the given link via AJAX and replaces the response in the given target', (done) ->
      jasmine.Ajax.install()

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
        