describe 'up.popup', ->

  describe 'Javascript functions', ->

    describe 'up.popup.attach', ->

      it 'should have tests'

    describe 'up.popup.coveredUrl', ->

      it 'returns the URL behind the popup', (done) ->
        up.history.replace('/foo')
        expect(up.popup.coveredUrl()).toBeUndefined()

        $popupLink = affix('a[href="/bar"][up-popup=".container"]')
        $popupLink.click()
        @respondWith('<div class="container">text</div>')
        expect(up.popup.coveredUrl()).toEndWith('/foo')
        up.popup.close().then ->
          expect(up.popup.coveredUrl()).toBeUndefined()
          done()

    describe 'up.popup.close', ->

      it 'should have tests'

    describe 'up.popup.source', ->

      it 'should have tests'

  describe 'unobtrusive behavior', ->

    describe 'a[up-popup]', ->

      it "loads this link's destination in a popup when clicked", ->
        $link = affix('a[href="/path/to"][up-popup=".middle"]').text('link')
        $link.click()
        expect(@lastRequest().url).toMatch /\/path\/to$/
        @respondWith """
          <div class="before">new-before</div>
          <div class="middle">new-middle</div>
          <div class="after">new-after</div>
          """
        expect($('.up-popup')).toExist()
        expect($('.up-popup .middle')).toHaveText('new-middle')
        expect($('.up-popup .before')).not.toExist()
        expect($('.up-popup .after')).not.toExist()

    describe '[up-close]', ->

      describe 'when clicked inside a popup', ->

        it 'closes the open popup and prevents the default action', ->
          $popup = affix('.up-popup')
          $link = $popup.affix('a[up-close]') # link is within the popup
          up.hello($link)
          wasDefaultPrevented = false
          wasClosed = false
          up.on 'click', 'a[up-close]', (event) ->
            wasDefaultPrevented = event.isDefaultPrevented()
            true # the line above might return false and cancel propagation / prevent default
          up.on 'up:popup:close', ->
            wasClosed = true
          $link.click()
          expect(wasClosed).toBe(true)
          expect(wasDefaultPrevented).toBe(true)

      describe 'when no popup is open', ->

        it 'does neither close the popup nor prevent the default action', ->
          $link = affix('a[up-close]') # link is outside the popup
          up.hello($link)
          wasDefaultPrevented = false
          wasClosed = false
          up.on 'click', 'a[up-close]', (event) ->
            wasDefaultPrevented = event.isDefaultPrevented()
            true # the line above might return false and cancel propagation / prevent default
          up.on 'up:popup:close', ->
            wasClosed = true
          $link.click()
          expect(wasClosed).toBe(false)
          expect(wasDefaultPrevented).toBe(false)
      