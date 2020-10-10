u = up.util
$ = jQuery

describe 'up.radio', ->

  describe 'JavaScript functions', ->

  describe 'unobtrusive behavior', ->

    describe '[up-hungry]', ->

      it "replaces the element when it is found in a response, even when the element wasn't targeted", asyncSpec (next) ->
        $fixture('.hungry[up-hungry]').text('old hungry')
        $fixture('.target').text('old target')

        up.navigate('.target', url: '/path')

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
        $fixture('.hungry[up-hungry]').text('old hungry')
        $fixture('.target').text('old target')

        promise = up.navigate('.target', url: '/path')

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
        $fixture('.hungry[up-hungry]').text('old hungry')
        $fixture('.target').text('old target')

        revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())

        up.navigate('.target', url: '/path', scroll: 'target')

        next =>
          @respondWith """
            <div class="target">
              new target
            </div>
          """

        next =>
          expect(revealStub).toHaveBeenCalled()
          revealArg = revealStub.calls.mostRecent().args[0]
          expect(revealArg).not.toMatchSelector('.hungry')
          expect(revealArg).toMatchSelector('.target')


      it 'does not change the X-Up-Target header for the request', asyncSpec (next) ->
        $fixture('.hungry[up-hungry]').text('old hungry')
        $fixture('.target').text('old target')
        $fixture('.fail-target').text('old fail target')

        up.navigate('.target', url: '/path', failTarget: '.fail-target')

        next =>
          expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.target')
          expect(@lastRequest().requestHeaders['X-Up-Fail-Target']).toEqual('.fail-target')

      it 'does replace the element when the server responds with an error (e.g. for error flashes)', asyncSpec (next) ->
        $fixture('.hungry[up-hungry]').text('old hungry')
        $fixture('.target').text('old target')
        $fixture('.fail-target').text('old fail target')

        up.navigate('.target', url: '/path', failTarget: '.fail-target')

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

        next =>
          expect('.target').toHaveText('old target')
          expect('.fail-target').toHaveText('new fail target')
          expect('.hungry').toHaveText('new hungry')


      it 'does not update [up-hungry] elements with { hungry: false } option', asyncSpec (next) ->
        $fixture('.hungry[up-hungry]').text('old hungry')
        $fixture('.target').text('old target')

        up.navigate('.target', url: '/path', hungry: false)

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

      it 'only updates [up-hungry] elements in the targeted layer, even if the response would yield matching elements for multiple layers', asyncSpec (next) ->
        up.modal.config.openDuration = 0
        up.modal.config.closeDuration = 0

        $fixture('.outside').text('old outside').attr('up-hungry', true)

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
          expect($('.outside')).toHaveText('old outside')

    describe '[up-poll]', ->

      it 'reloads the element periodically', asyncSpec (next) ->
        up.radio.config.pollInterval = 150
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve()

        element = up.hello(fixture('.element[up-poll]'))

        next.after 75, ->
          expect(reloadSpy).not.toHaveBeenCalled()

        next.after 150, ->
          expect(reloadSpy).toHaveBeenCalledWith(element)
          expect(reloadSpy.calls.count()).toBe(1)

        next.after 150, ->
          expect(reloadSpy.calls.count()).toBe(2)

      it 'does not make additional requests while a previous requests is still in flight', asyncSpec (next) ->
        deferred = u.newDeferred()

        up.radio.config.pollInterval = 50
        reloadSpy = spyOn(up, 'reload').and.returnValue(deferred)

        up.hello(fixture('.element[up-poll]'))

        next.after 100, ->
          expect(reloadSpy.calls.count()).toBe(1)

        next.after 100, ->
          expect(reloadSpy.calls.count()).toBe(1)
          deferred.resolve()

        next.after 100, ->
          expect(reloadSpy.calls.count()).toBe(2)

      it 'keeps polling if a request failed', asyncSpec (next) ->
        up.radio.config.pollInterval = 75
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.reject()

        up.hello(fixture('.element[up-poll]'))

        next.after 125, ->
          expect(reloadSpy.calls.count()).toBe(1)

        next.after 75, ->
          expect(reloadSpy.calls.count()).toBe(2)

      it 'does not reload if the tab is hidden', asyncSpec (next) ->
        up.radio.config.pollInterval = 50
        spyOnProperty(document, 'hidden', 'get').and.returnValue(true)
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve()

        up.hello(fixture('.element[up-poll]'))

        next.after 100, ->
          expect(reloadSpy).not.toHaveBeenCalled()

      it 'stops polling when the element is destroyed', asyncSpec (next) ->
        up.radio.config.pollInterval = 75
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve()

        element = up.hello(fixture('.element[up-poll]'))

        next.after 125, ->
          expect(reloadSpy.calls.count()).toBe(1)
          up.destroy(element)

        next.after 75, ->
          expect(reloadSpy.calls.count()).toBe(1)

      it 'allows to pass a polling interval per [up-interval] attribute'

