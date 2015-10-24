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
        @lastRequest().respondWith
          status: 200
          contentType: 'text/html'
          responseText:
            """
            <div class="container">text</div>
            """
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

      it 'should have tests'

    describe '[up-close]', ->

      it 'should have tests'
      