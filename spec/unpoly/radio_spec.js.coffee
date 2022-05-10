u = up.util
e = up.element
$ = jQuery

describe 'up.radio', ->

  describe 'JavaScript functions', ->

    describe 'up.radio.startPolling()', ->

      it 'starts polling the given element', asyncSpec (next) ->
        up.radio.config.pollInterval = interval = 150
        timingTolerance = interval / 3

        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve(new up.RenderResult())

        element = fixture('.element')
        up.radio.startPolling(element)

        next.after timingTolerance, ->
          expect(reloadSpy).not.toHaveBeenCalled()

        next.after interval, ->
          expect(reloadSpy).toHaveBeenCalledWith(element, jasmine.anything())
          expect(reloadSpy.calls.count()).toBe(1)

        next.after (timingTolerance + interval), ->
          expect(reloadSpy.calls.count()).toBe(2)

          # TODO: Why is this needed? The fragment should stop polling when it is removed from the DOM.
          up.radio.stopPolling('.element')

      it 'does not stop polling when the server responds without an [up-poll] attribute', asyncSpec (next) ->
        up.radio.config.pollInterval = interval = 150
        timingTolerance = interval / 3

        element = fixture('.element', text: 'old text')
        up.radio.startPolling(element)

        next.after timingTolerance, ->
          expect(jasmine.Ajax.requests.count()).toBe(0)

        next.after interval, ->
          expect(jasmine.Ajax.requests.count()).toBe(1)
          jasmine.respondWithSelector('.element', text: 'new text')

        next ->
          expect('.element').toHaveText('new text')

        next.after (timingTolerance + interval), ->
          expect(jasmine.Ajax.requests.count()).toBe(2)

      it 'stops polling when the element is removed from the DOM', asyncSpec (next) ->
        up.radio.config.pollInterval = interval = 150
        timingTolerance = interval / 3

        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve(new up.RenderResult())

        element = fixture('.element')
        up.radio.startPolling(element)

        next.after timingTolerance, ->
          expect(reloadSpy).not.toHaveBeenCalled()
          up.destroy(element)

        next.after interval, ->
          expect(reloadSpy).not.toHaveBeenCalled()

    describe 'up.radio.stopPolling()', ->

      it 'stops polling the given, polling element', asyncSpec (next) ->
        interval = 150
        timingTolerance = interval / 3

        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve(new up.RenderResult())

        element = fixture('.element')
        up.radio.startPolling(element, interval: interval)

        next.after (timingTolerance + interval), ->
          expect(reloadSpy.calls.count()).toBe(1)
          up.radio.stopPolling(element)

        next.after (timingTolerance + interval), ->
          expect(reloadSpy.calls.count()).toBe(1)

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

      it 'only updates [up-hungry] elements in the targeted layer, even if the response would yield matching elements for multiple layers', ->
        up.layer.config.openDuration = 0
        up.layer.config.closeDuration = 0

        $fixture('.outside').text('old outside').attr('up-hungry', true)

        closeEventHandler = jasmine.createSpy('close event handler')
        up.on('up:layer:dismiss', closeEventHandler)

        up.layer.open fragment: """
          <div class='inside'>
            old inside
          </div>
          """

        expect(up.layer.isOverlay()).toBe(true)

        up.render
          target: '.inside',
          document: """
            <div class="outside">
              new outside
            </div>
            <div class='inside'>
              new inside
            </div>
            """,
          layer: 'front'

        expect(closeEventHandler).not.toHaveBeenCalled()
        expect($('.inside')).toHaveText('new inside')
        expect($('.outside')).toHaveText('old outside')

      it 'does update an [up-hungry] element in an non-targeted layer if that hungry element also has [up-layer=any]', ->
        up.layer.config.openDuration = 0
        up.layer.config.closeDuration = 0

        $fixture('.outside').text('old outside').attr('up-hungry', true).attr('up-layer', 'any')

        closeEventHandler = jasmine.createSpy('close event handler')
        up.on('up:layer:dismiss', closeEventHandler)

        up.layer.open fragment: """
          <div class='inside'>
            old inside
          </div>
          """

        expect(up.layer.isOverlay()).toBe(true)

        up.render
          target: '.inside',
          document: """
            <div class="outside">
              new outside
            </div>
            <div class='inside'>
              new inside
            </div>
            """,
          layer: 'front'

        expect(closeEventHandler).not.toHaveBeenCalled()
        expect($('.inside')).toHaveText('new inside')
        expect($('.outside')).toHaveText('new outside')

      it 'does not update an [up-hungry] element if it was contained by the original fragment', asyncSpec (next) ->
        container = fixture('.container')
        e.affix(container, '.child[up-hungry]')

        insertedSpy = jasmine.createSpy('up:fragment:inserted listener')
        up.on('up:fragment:inserted', insertedSpy)

        up.render
          target: '.container'
          document: """
            <div class="container">
              <div class="child" up-hungry>
              </div>
            </div>
            """

        next ->
          expect(insertedSpy.calls.count()).toBe(1)
          expect(insertedSpy.calls.argsFor(0)[0].target).toBe(document.querySelector('.container'))

    describe '[up-poll]', ->

      it 'reloads the element periodically', asyncSpec (next) ->
        interval = 150
        timingTolerance = interval / 3

        up.radio.config.pollInterval = interval

        element = up.hello(fixture('.element[up-poll]', text: 'old text'))

        next.after timingTolerance, ->
          expect(element).toHaveText('old text')
          expect(jasmine.Ajax.requests.count()).toBe(0)

        next.after interval, ->
          expect(jasmine.Ajax.requests.count()).toBe(1)
          jasmine.respondWithSelector('.element[up-poll]', text: 'new text')

        next ->
          expect('.element').toHaveText('new text')

        next.after (timingTolerance + interval), ->
          expect(jasmine.Ajax.requests.count()).toBe(2)

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

      it 'keeps the polling rhythm when the server responds with `X-Up-Target: :none` (bugfix)', asyncSpec (next) ->
        up.radio.config.pollInterval = 250

        up.hello(fixture('.element[up-poll][up-source="/source"]'))

        next.after 50, ->
          expect(jasmine.Ajax.requests.count()).toBe(0)

        next.after 250, ->
          expect(jasmine.Ajax.requests.count()).toBe(1)
          jasmine.respondWith(status: 200, responseHeaders: { 'X-Up-Target': ':none' })

        next.after 50, ->
          expect(jasmine.Ajax.requests.count()).toBe(1)

        next.after 250, ->
          expect(jasmine.Ajax.requests.count()).toBe(2)

      it 'keeps polling if a request failed', asyncSpec (next) ->
        up.radio.config.pollInterval = 75
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.reject(up.error.failed('network error'))

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

      it 'stops polling when the server responds without an [up-poll] attribute', asyncSpec (next) ->
        up.radio.config.pollInterval = interval = 150
        timingTolerance = interval / 3

        element = up.hello(fixture('.element[up-poll]', text: 'old text'))
        up.radio.startPolling(element)

        next.after timingTolerance, ->
          expect('.element').toHaveText('old text')
          expect(jasmine.Ajax.requests.count()).toBe(0)

        next.after interval, ->
          expect(jasmine.Ajax.requests.count()).toBe(1)
          jasmine.respondWithSelector('.element', text: 'new text')

        next ->
          expect('.element').toHaveText('new text')

        next.after (timingTolerance + interval), ->
          expect(jasmine.Ajax.requests.count()).toBe(1)

      it 'lets the server change the [up-source] (bugfix)', asyncSpec (next) ->
        up.radio.config.pollInterval = interval = 150
        timingTolerance = interval / 3

        element = up.hello(fixture('.element[up-poll][up-source="/one"]', text: 'old text'))
        up.radio.startPolling(element)

        next.after timingTolerance, ->
          expect('.element').toHaveText('old text')
          expect(jasmine.Ajax.requests.count()).toBe(0)

        next.after interval, ->
          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.lastRequest().url).toMatchURL('/one')
          jasmine.respondWithSelector('.element[up-poll][up-source="/two"]', text: 'new text')

        next ->
          expect('.element').toHaveText('new text')

        next.after (timingTolerance + interval), ->
          expect(jasmine.Ajax.requests.count()).toBe(2)
          expect(jasmine.lastRequest().url).toMatchURL('/two')

      it 'lets the server change the [up-interval] (bugfix)', asyncSpec (next) ->
        up.radio.config.pollInterval = initialInterval = 100
        timingTolerance = initialInterval / 3

        element = up.hello(fixture(".element[up-poll][up-interval='#{initialInterval}']", text: 'old text'))
        up.radio.startPolling(element)

        next.after timingTolerance, ->
          expect('.element').toHaveText('old text')
          expect(jasmine.Ajax.requests.count()).toBe(0)

        next.after initialInterval, ->
          expect(jasmine.Ajax.requests.count()).toBe(1)
          jasmine.respondWithSelector(".element[up-poll][up-interval='#{initialInterval * 2}']", text: 'new text')

        next ->
          expect('.element').toHaveText('new text')

        next.after (timingTolerance + initialInterval), ->
          expect(jasmine.Ajax.requests.count()).toBe(1)

        next.after initialInterval, ->
          expect(jasmine.Ajax.requests.count()).toBe(2)

      it 'stops polling when the element is destroyed while waiting for a previous request (bugfix)', asyncSpec (next) ->
        up.radio.config.pollInterval = 75
        respond = null
        reloadSpy = spyOn(up, 'reload').and.callFake -> return new Promise((resolve) -> respond = resolve)

        element = up.hello(fixture('.element[up-poll]'))

        next.after 125, ->
          expect(reloadSpy.calls.count()).toBe(1)
          up.destroy(element)

        next ->
          respond()

        next.after 125, ->
          expect(reloadSpy.calls.count()).toBe(1)

      it 'allows to pass a polling interval per [up-interval] attribute', asyncSpec (next) ->
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve()

        up.radio.config.pollInterval = 5

        up.hello(fixture('.element[up-poll][up-interval=80]'))

        next.after 30, ->
          expect(reloadSpy).not.toHaveBeenCalled()

        next.after 90, ->
          expect(reloadSpy).toHaveBeenCalled()

      it 'allows to change the URL with an [up-source] attribute', asyncSpec (next) ->
        up.hello(fixture('.element[up-poll][up-source="/optimized-path"][up-interval=2]'))

        next.after 20, =>
          expect(@lastRequest().url).toMatchURL('/optimized-path')

      it 'pauses polling while we avoid optional requests', asyncSpec (next) ->
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve()

        shouldReduceRequests = true
        spyOn(up.network, 'shouldReduceRequests').and.callFake -> shouldReduceRequests

        up.hello(fixture('.element[up-poll][up-interval=1]'))

        next.after 20, ->
          expect(reloadSpy).not.toHaveBeenCalled()
          shouldReduceRequests = false

        next.after 20, ->
          expect(reloadSpy).toHaveBeenCalled()

      it 'pauses polling while the element is detached', asyncSpec (next) ->
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve()

        element = up.element.createFromSelector('.element[up-poll][up-interval=2]')
        registerFixture(element) # make sure this element is destroyed after the example
        up.hello(element)

        next.after 20, ->
          expect(reloadSpy).not.toHaveBeenCalled()

          document.body.appendChild(element)

        next.after 20, ->
          expect(reloadSpy).toHaveBeenCalled()

      it "pauses polling while the element's layer is in the background", asyncSpec (next) ->
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve()

        makeLayers(2)
        expect(up.layer.isOverlay()).toBe(true)
        element = up.layer.root.affix('.element[up-poll][up-interval=2]')
        registerFixture(element) # make sure this element is destroyed after the example
        up.hello(element) # start polling

        next.after 20, ->
          expect(reloadSpy).not.toHaveBeenCalled()

          up.layer.dismiss()

        next.after 20, ->
          expect(up.layer.isRoot()).toBe(true)
          expect(reloadSpy).toHaveBeenCalled()
