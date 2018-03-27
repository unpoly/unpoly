describe 'up.radio', ->

  u = up.util

  describe 'JavaScript functions', ->

  describe 'unobtrusive behavior', ->

    describe '[up-hungry]', ->

      it "replaces the element when it is found in a response, even when the element wasn't targeted", asyncSpec (next) ->
        affix('.hungry[up-hungry]').text('old hungry')
        affix('.target').text('old target')

        up.replace('.target', '/path')

        next =>
          @respondWith """
            <div class="target">
              new target
            </div>
            <div class="between">
              new between
            </div>
            <div class="hungry">
              new hungry
            </div>
          """

        next =>
          expect('.target').toHaveText('new target')
          expect('.hungry').toHaveText('new hungry')

      it "does not impede replacements when the element is not part of a response", asyncSpec (next) ->
        affix('.hungry[up-hungry]').text('old hungry')
        affix('.target').text('old target')

        promise = up.replace('.target', '/path')

        next =>
          @respondWith """
            <div class="target">
              new target
            </div>
          """

        next =>
          expect('.target').toHaveText('new target')
          expect('.hungry').toHaveText('old hungry')

          promiseState(promise).then (result) ->
            expect(result.state).toEqual('fulfilled')

      it 'still reveals the element that was originally targeted', asyncSpec (next) ->
        affix('.hungry[up-hungry]').text('old hungry')
        affix('.target').text('old target')

        revealStub = up.layout.knife.mock('reveal')

        up.replace('.target', '/path', reveal: true)

        next =>
          @respondWith """
            <div class="target">
              new target
            </div>
          """

        next =>
          expect(revealStub).toHaveBeenCalled()
          revealArg = revealStub.calls.mostRecent().args[0]
          expect(revealArg).not.toBeMatchedBy('.hungry')
          expect(revealArg).toBeMatchedBy('.target')


      it 'does not change the X-Up-Target header for the request', asyncSpec (next) ->
        affix('.hungry[up-hungry]').text('old hungry')
        affix('.target').text('old target')
        affix('.fail-target').text('old fail target')

        up.replace('.target', '/path', failTarget: '.fail-target')

        next =>
          expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.target')
          expect(@lastRequest().requestHeaders['X-Up-Fail-Target']).toEqual('.fail-target')

      it 'does replace the element when the server responds with an error (e.g. for error flashes)', asyncSpec (next) ->
        affix('.hungry[up-hungry]').text('old hungry')
        affix('.target').text('old target')
        affix('.fail-target').text('old fail target')

        up.replace('.target', '/path', failTarget: '.fail-target')

        next =>
          @respondWith
            status: 500
            responseText: """
              <div class="target">
                new target
              </div>
              <div class="fail-target">
                new fail target
              </div>
              <div class="between">
                new between
              </div>
              <div class="hungry">
                new hungry
              </div>
              """

      it 'does not update [up-hungry] elements with { hungry: false } option', asyncSpec (next) ->
        affix('.hungry[up-hungry]').text('old hungry')
        affix('.target').text('old target')

        up.replace('.target', '/path', hungry: false)

        next =>
          @respondWith
            responseText: """
              <div class="target">
                new target
              </div>
              <div class="hungry">
                new hungry
              </div>
              """

        next =>
          expect('.target').toHaveText('new target')
          expect('.hungry').toHaveText('old hungry')

      it 'does not auto-close a non-sticky modal if a link within the modal changes both modal content and an [up-hungry] below', asyncSpec (next) ->
        up.modal.config.openDuration = 0
        up.modal.config.closeDuration = 0

        affix('.outside').text('old outside').attr('up-hungry', true)

        closeEventHandler = jasmine.createSpy('close event handler')
        up.on('up:modal:close', closeEventHandler)

        up.modal.extract '.inside', """
          <div class='inside'>
            <div class="inside-text">old inside</div>
            <div class="inside-link">update</div>
          </div>
          """

        next =>
          expect(up.modal.isOpen()).toBe(true)

          up.extract '.inside-text', """
            <div class="outside">
              new outside
            </div>
            <div class='inside'>
              <div class="inside-text">new inside</div>
              <div class="inside-link">update</div>
            </div>
            """,
            origin: $('.inside-link')

        next =>
          expect(closeEventHandler).not.toHaveBeenCalled()
          expect($('.inside-text')).toHaveText('new inside')
          expect($('.outside')).toHaveText('new outside')

      it 'does not auto-close a non-sticky popup if a link within the modal replaces an [up-hungry] below', asyncSpec (next) ->
        up.popup.config.openDuration = 0
        up.popup.config.closeDuration = 0

        affix('.outside').text('old outside').attr('up-hungry', true)
        $popupAnchor = affix('span.link').text('link')

        closeEventHandler = jasmine.createSpy('close event handler')
        up.on('up:popup:close', closeEventHandler)

        up.popup.attach $popupAnchor,
          target: '.inside'
          html: """
            <div class='inside'>
              <div class="inside-text">old inside</div>
              <div class="inside-link">update</div>
            </div>
            """

        next =>
          expect(up.popup.isOpen()).toBe(true)

          up.extract '.inside-text', """
            <div class="outside">
              new outside
            </div>
            <div class='inside'>
              <div class="inside-text">new inside</div>
              <div class="inside-link">update</div>
            </div>
            """,
            origin: $('.inside-link')

        next =>
          expect(closeEventHandler).not.toHaveBeenCalled()
          expect($('.inside-text')).toHaveText('new inside')
          expect($('.outside')).toHaveText('new outside')

