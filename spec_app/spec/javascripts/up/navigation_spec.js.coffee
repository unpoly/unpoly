describe 'up.navigation', ->
  
  describe 'unobtrusive behavior', ->

    it 'marks a link as .up-current iff it links to the current URL', ->
      spyOn(up.browser, 'url').and.returnValue('/foo')
      $currentLink = up.ready(affix('a[href="/foo"]'))
      $otherLink = up.ready(affix('a[href="/bar"]'))
      expect($currentLink).toHaveClass('up-current')
      expect($otherLink).not.toHaveClass('up-current')
      
    if up.browser.canPushState()
      
      it 'marks a link as .up-current if it links to the current URL, but is missing a trailing slash', ->
        $link = affix('a[href="/foo"][up-target=".main"]')
        affix('.main')
        jasmine.Ajax.install()
        $link.click()
        jasmine.Ajax.requests.mostRecent().respondWith
          status: 200
          contentType: 'text/html'
          responseHeaders: { 'X-Up-Location': '/foo/' }
          responseText: '<div class="main">new-text</div>'
        expect($link).toHaveClass('up-current')
      
      it 'marks a link as .up-current if it links to the current URL, but has an extra trailing slash', ->
        $link = affix('a[href="/foo/"][up-target=".main"]')
        affix('.main')
        jasmine.Ajax.install()
        $link.click()
        jasmine.Ajax.requests.mostRecent().respondWith
          status: 200
          contentType: 'text/html'
          responseHeaders: { 'X-Up-Location': '/foo' }
          responseText: '<div class="main">new-text</div>'
        expect($link).toHaveClass('up-current')
        
      it 'changes .up-current marks as the URL changes'
        
      it 'marks clicked linked as .up-active until the request finishes', ->
        $link = affix('a[href="/foo"][up-target=".main"]')
        affix('.main')
        jasmine.Ajax.install()
        $link.click()
        expect($link).toHaveClass('up-active')
        jasmine.Ajax.requests.mostRecent().respondWith
          status: 200
          contentType: 'text/html'
          responseText: '<div class="main">new-text</div>'
        expect($link).not.toHaveClass('up-active')
        expect($link).toHaveClass('up-current')
    
      it 'prefers to mark an enclosing [up-follow] click area', ->
        $area = affix('div[up-follow] a[href="/foo"][up-target=".main"]')
        $link = $area.find('a')
        affix('.main')
        jasmine.Ajax.install()
        $link.click()
        expect($area).toHaveClass('up-active')
        jasmine.Ajax.requests.mostRecent().respondWith
          status: 200
          contentType: 'text/html'
          responseText: '<div class="main">new-text</div>'
        expect($area).toHaveClass('up-current')
        