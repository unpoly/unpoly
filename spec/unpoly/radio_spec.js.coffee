u = up.util
e = up.element
$ = jQuery

describe 'up.radio', ->

  describe 'JavaScript functions', ->

    describe 'up.radio.startPolling()', ->

      it 'starts polling the given element', asyncSpec (next) ->
        up.radio.config.pollInterval = interval = 150
        timingTolerance = interval / 3

        element = fixture('.element', text: 'old text')
        up.radio.startPolling(element)

        next.after timingTolerance, ->
          expect('.element').toHaveText('old text')
          expect(jasmine.Ajax.requests.count()).toBe(0)

        next.after interval, ->
          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.lastRequest().requestHeaders['X-Up-Target']).toBe('.element')
          jasmine.respondWithSelector('.element', text: 'new text')

        next ->
          expect('.element').toHaveText('new text')
          expect(jasmine.Ajax.requests.count()).toBe(1)

        next.after (timingTolerance + interval), ->
          expect(jasmine.Ajax.requests.count()).toBe(2)

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

      it 'stops polling when the polling fragment is aborted', asyncSpec (next) ->
        up.radio.config.pollInterval = interval = 150
        timingTolerance = interval / 3

        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve(new up.RenderResult())

        container = fixture('.container')
        element = e.affix(container, '.element')
        up.radio.startPolling(element)

        next.after timingTolerance, ->
          expect(reloadSpy).not.toHaveBeenCalled()
          up.fragment.abort(container)

        next.after interval, ->
          expect(reloadSpy).not.toHaveBeenCalled()

      it 'keeps polling when the polling fragment is aborted through its own reloading', asyncSpec (next) ->
        up.radio.config.pollAbortable = false
        up.radio.config.pollInterval = interval = 150
        timingTolerance = interval / 3

        element = fixture('.element', text: 'old text')
        up.radio.startPolling(element)

        next.after timingTolerance + interval, ->
          expect('.element').toHaveText('old text')

          expect(jasmine.Ajax.requests.count()).toBe(1)

          jasmine.respondWithSelector('.element', text: 'new text')

        next ->
          expect('.element').toHaveText('new text')

        next.after timingTolerance + interval, ->
          expect(jasmine.Ajax.requests.count()).toBe(2)

      it 'does not cause duplicate requests when called on an [up-poll] element that is already polling', asyncSpec (next) ->
        up.radio.config.pollInterval = interval = 150
        timingTolerance = interval / 3

        element = up.hello(fixture('.element[up-poll]', text: 'old text'))

        next ->
          up.radio.startPolling(element)

        next.after timingTolerance, ->
          expect('.element').toHaveText('old text')
          expect(jasmine.Ajax.requests.count()).toBe(0)

        next.after interval, ->
          expect(jasmine.Ajax.requests.count()).toBe(1)

      it 'can override an [up-source] attribute from an [up-poll] element', asyncSpec (next) ->
        up.radio.config.pollInterval = interval = 150
        timingTolerance = interval / 3

        element = up.hello(fixture('.element[up-poll][up-source="/one"]'))

        next ->
          up.radio.startPolling(element, { url: '/two' })

        next.after timingTolerance, ->
          expect(jasmine.Ajax.requests.count()).toBe(0)

        next.after interval, ->
          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(jasmine.lastRequest().url).toMatchURL('/two')

      it 'polls with the given { interval }', asyncSpec (next) ->
        defaultInterval = 100
        up.radio.config.pollInterval = defaultInterval
        timingTolerance = defaultInterval / 3

        element = up.hello(fixture('.element'))

        next ->
          up.radio.startPolling(element, { interval: defaultInterval * 2 })

        next.after timingTolerance, ->
          expect(jasmine.Ajax.requests.count()).toBe(0)

        next.after defaultInterval, ->
          expect(jasmine.Ajax.requests.count()).toBe(0)

        next.after defaultInterval, ->
          expect(jasmine.Ajax.requests.count()).toBe(1)

      it 'does not emit up:request:late if the server is slow to respond', asyncSpec (next) ->
        element = up.hello(fixture('.element'))
        up.network.config.badResponseTime = 20
        lateListener = jasmine.createSpy('up:request:late listener')
        up.on('up:request:late', lateListener)

        up.radio.startPolling(element, { interval: 5 })

        next.after 60, ->
          expect(jasmine.Ajax.requests.count()).toBe(1)
          expect(lateListener).not.toHaveBeenCalled()

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
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve(new up.RenderResult())

        up.hello(fixture('.element[up-poll]'))

        next.after 100, ->
          expect(reloadSpy).not.toHaveBeenCalled()

      it 'stops polling when the element is destroyed', asyncSpec (next) ->
        up.radio.config.pollInterval = 75
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve(new up.RenderResult())

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

        up.hello(fixture('.element[up-poll][up-source="/one"]', text: 'old text'))

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
        up.radio.config.pollInterval = initialInterval = 150
        timingTolerance = initialInterval / 3

        up.hello(fixture(".element[up-poll][up-interval='#{initialInterval}']", text: 'old text'))

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
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve(new up.RenderResult())

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

      it 'polls less frequently while we reduce requests', asyncSpec (next) ->
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve(new up.RenderResult())

        spyOn(up.network, 'shouldReduceRequests').and.returnValue(true)

        up.hello(fixture('.element[up-poll][up-interval=100]'))

        next.after 150, ->
          expect(reloadSpy).not.toHaveBeenCalled()

        next.after 100, ->
          expect(reloadSpy).toHaveBeenCalled()

      it 'pauses polling while the element is detached', asyncSpec (next) ->
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve(new up.RenderResult())

        element = up.element.createFromSelector('.element[up-poll][up-interval=2]')
        registerFixture(element) # make sure this element is destroyed after the example
        up.hello(element)

        next.after 20, ->
          expect(reloadSpy).not.toHaveBeenCalled()

          document.body.appendChild(element)

        next.after 20, ->
          expect(reloadSpy).toHaveBeenCalled()

      it 'pauses polling when an up:fragment:poll event is prevented', asyncSpec (next) ->
        up.radio.config.pollInterval = interval = 150
        timingTolerance = interval / 3

        up.hello(fixture('.element[up-poll]'))
        eventCount = 0

        up.on 'up:fragment:poll', '.element', (event) ->
          eventCount++
          if eventCount == 1
            event.preventDefault()

        next.after timingTolerance, ->
          expect(eventCount).toBe(0)
          expect(jasmine.Ajax.requests.count()).toBe(0)

        next.after interval, ->
          expect(eventCount).toBe(1)
          expect(jasmine.Ajax.requests.count()).toBe(0)

        next.after (interval + timingTolerance), ->
          expect(eventCount).toBe(2)
          expect(jasmine.Ajax.requests.count()).toBe(1)

      it "pauses polling while the element's layer is in the background", asyncSpec (next) ->
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve(new up.RenderResult())

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
