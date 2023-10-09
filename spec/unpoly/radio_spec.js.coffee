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

          jasmine.respondWithSelector('.element', text: 'newer text')

        next ->
          expect('.element').toHaveText('newer text')
          expect(jasmine.Ajax.requests.count()).toBe(2)

        next.after (timingTolerance + interval), ->
          expect(jasmine.Ajax.requests.count()).toBe(3)

      it 'does not cause duplicate requests when the server responds with an [up-poll] fragment (bugfix)', asyncSpec (next) ->
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
          jasmine.respondWithSelector('.element[up-poll]', text: 'new text')

        next ->
          expect('.element').toHaveText('new text')
          expect(jasmine.Ajax.requests.count()).toBe(1)

        next.after (timingTolerance + interval), ->
          expect(jasmine.Ajax.requests.count()).toBe(2)

          jasmine.respondWithSelector('.element[up-poll]', text: 'newer text')

        next ->
          expect('.element').toHaveText('newer text')
          expect(jasmine.Ajax.requests.count()).toBe(2)

        next.after (timingTolerance + interval), ->
          expect(jasmine.Ajax.requests.count()).toBe(3)

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

          jasmine.respondWithSelector('.element[up-poll][up-source="/one"]')

        next.after (interval + timingTolerance), ->
          expect(jasmine.Ajax.requests.count()).toBe(2)
          # Assert that the { url } option is passed to the new up.FragmentPolling instance.
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

      it 'does not emit up:network:late if the server is slow to respond', asyncSpec (next) ->
        element = up.hello(fixture('.element'))
        up.network.config.badResponseTime = 20
        lateListener = jasmine.createSpy('up:network:late listener')
        up.on('up:network:late', lateListener)

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

      it "replaces the element when it is found in a response, even when the element wasn't targeted", ->
        $fixture('.hungry[up-hungry]').text('old hungry')
        $fixture('.target').text('old target')

        up.render('.target', url: '/path')

        await wait()

        jasmine.respondWith """
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

        await wait()

        expect('.target').toHaveText('new target')
        expect('.hungry').toHaveText('new hungry')

      it "does not impede replacements when the element is not part of a response", ->
        $fixture('.hungry[up-hungry]').text('old hungry')
        $fixture('.target').text('old target')

        promise = up.render('.target', url: '/path')

        await wait()

        jasmine.respondWith """
          <div class="target">
            new target
          </div>
        """

        await wait()

        expect('.target').toHaveText('new target')
        expect('.hungry').toHaveText('old hungry')

        await expectAsync(promise).toBeResolvedTo(jasmine.any(up.RenderResult))

      it 'allows to use [up-keep] element within a hungry element', ->
        target = fixture('#target', text: 'old target')
        hungry = fixture('#hungry[up-hungry]')
        child = e.affix(hungry, '#child[up-keep]', text: 'old child')

        keepListener = jasmine.createSpy('up:fragment:keep listener')
        up.on('up:fragment:keep', keepListener)

        up.render '#target', document: """
          <div id="target">new target</div>

          <div id="hungry" up-hungry>
            <div id="child" up-keep>new child</div>
          </div>
        """

        expect('#target').toHaveText('new target')
        expect('#child').toHaveText('old child')

      it 'allows to use [up-keep] element on a hungry element', ->
        target = fixture('#target', text: 'old target')
        hungry = fixture('#hungry[up-hungry][up-keep]', text: 'old hungry')

        keepListener = jasmine.createSpy('up:fragment:keep listener')
        up.on('up:fragment:keep', keepListener)

        up.render '#target', document: """
          <div id="target">new target</div>

          <div id="hungry" up-hungry up-keep>
            new hungry
          </div>
        """

        expect('#target').toHaveText('new target')
        expect('#hungry').toHaveText('old hungry')

        expect(keepListener).toHaveBeenCalled()

      it "does not reload an hungry element if it has a weak selector", asyncSpec (next) ->
        $fixture('div[up-hungry]').text('old hungry')
        $fixture('.target').text('old target')
        warnSpy = spyOn(up, 'warn')

        up.render('.target', url: '/path')

        next =>
          @respondWith """
            <div class="target">
              new target
            </div>
            <div class="between">
              new between
            </div>
            <div up-hungry>
              new hungry
            </div>
          """

        next =>
          expect('.target').toHaveText('new target')
          expect('div[up-hungry]').toHaveText('old hungry')
          expect(warnSpy).toHaveBeenCalled()
          expect(warnSpy.calls.argsFor(0)[1]).toMatch(/ignoring untargetable fragment/i)

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

      it 'does replace the element when the server responds with an error (e.g. for error flashes)', ->
        $fixture('.hungry[up-hungry]').text('old hungry')
        $fixture('.target').text('old target')
        $fixture('.fail-target').text('old fail target')

        renderJob = up.render('.target', url: '/path', failTarget: '.fail-target')

        await wait()

        jasmine.respondWith
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

        await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.RenderResult))

        expect('.target').toHaveText('old target')
        expect('.fail-target').toHaveText('new fail target')
        expect('.hungry').toHaveText('new hungry')

      it 'does not update [up-hungry] elements with { useHungry: false } option', asyncSpec (next) ->
        $fixture('.hungry[up-hungry]').text('old hungry')
        $fixture('.target').text('old target')

        up.render('.target', url: '/path', useHungry: false)

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

      it 'does not update an [up-hungry] element that is contained by the explicit target', asyncSpec (next) ->
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

      it "replaces the element when the explicit target is :none", ->
        $fixture('.hungry[up-hungry]').text('old hungry')
        $fixture('.target').text('old target')

        up.render(':none', url: '/path')

        await wait()

        jasmine.respondWith """
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

        await wait()

        expect('.target').toHaveText('old target')
        expect('.hungry').toHaveText('new hungry')

      it 'updates the hungry element for a failed response', ->
        $fixture('.hungry[up-hungry]').text('old hungry')
        $fixture('.success-target').text('old success target')
        $fixture('.failure-target').text('old failure target')

        promise = up.render(target: '.success-target', failTarget: '.failure-target', url: '/path')

        await wait()

        jasmine.respondWith status: 500, responseText: """
          <div class="success-target">
            new success target
          </div>
          <div class="failure-target">
            new failure target
          </div>
          <div class="between">
            new between
          </div>
          <div class="hungry">
            new hungry
          </div>
        """

        await expectAsync(promise).toBeRejectedWith(jasmine.any(up.RenderResult))
        await expectAsync(promise).toBeRejectedWith(jasmine.objectContaining(
          target: '.failure-target',
          fragments: [e.get('.failure-target'), e.get('.hungry')],
        ))

        expect('.success-target').toHaveText('old success target')
        expect('.failure-target').toHaveText('new failure target')
        expect('.hungry').toHaveText('new hungry')

      describe 'transition', ->

        it "does not use the render pass' transition for the hungry element", ->
          fixture('.target.old', text: 'old target')
          fixture('.hungry.new', text: 'old hungry', 'up-hungry': '')

          up.render('.target', transition: 'cross-fade', duration: 300, document: """
            <div class="target new">new target</div>
            <div class="hungry new">new hungry</div>
          """)

          await wait(150)

          # Target is morphing
          expect(document.querySelectorAll('.target').length).toBe(2)
          expect('.target.old').toHaveOpacity(0.5, 0.35)
          expect('.target.new').toHaveOpacity(0.5, 0.35)

          # Hungry is not morphing
          expect(document.querySelectorAll('.hungry').length).toBe(1)
          expect('.hungry').toHaveOpacity(1.0)

        describe 'with [up-transition]', ->

          it 'lets the hungry element use a transition', ->
            fixture('#target.old', text: 'old target')
            fixture('#hungry.old', text: 'old hungry', 'up-hungry': '', 'up-transition': 'cross-fade', 'up-duration': '300')

            up.render('#target', document: """
              <div id="target" class="new">new target</div>
              <div id="hungry" class="new">new hungry</div>
            """)

            await wait(150)

            # Hungry is morphing
            expect(document.querySelectorAll('#hungry').length).toBe(2)
            expect('#hungry.old').toHaveOpacity(0.5, 0.35)
            expect('#hungry.new').toHaveOpacity(0.5, 0.35)

            # Target is not morphing
            expect(document.querySelectorAll('#target').length).toBe(1)
            expect('#target').toHaveOpacity(1.0)

          it 'delays the fulfillment of the up.render().finished promise', ->
            fixture('#target.old', text: 'old target')
            fixture('#hungry.new', text: 'old hungry', 'up-hungry': '', 'up-transition': 'cross-fade', 'up-duration': '200')

            job = up.render('#target', transition: 'cross-fade', document: """
              <div id="target" class="new">new target</div>
              <div id="hungry" class="new">new hungry</div>
            """)

            await wait(100)

            await expectAsync(job.finished).toBePending()

            await wait(200)

            await expectAsync(job.finished).toBeResolvedTo(jasmine.any(up.RenderResult))
            await expectAsync(job.finished).toBeResolvedTo(jasmine.objectContaining(
              target: '#target',
              fragments: [document.querySelector('#target.new'), document.querySelector('#hungry.new')],
              layer: up.layer.root,
            ))

          it 'delays the rejection of the up.render().finished promise when updating from a failed response', ->
            fixture('#target.old', text: 'old target')
            fixture('#hungry.new', text: 'old hungry', 'up-hungry': '', 'up-transition': 'cross-fade', 'up-duration': '200')

            job = up.render(
              target: '#target',
              failTarget: '#target',
              url: '/path2',
            )
            finished = job.finished

            await wait()

            jasmine.respondWith status: 500, responseText: """
              <div id="target" class="new">new target</div>
              <div id="hungry" class="new">new hungry</div>
            """

            await wait(100)

            await expectAsync(job).toBeRejectedWith(jasmine.any(up.RenderResult))
            await expectAsync(finished).toBePending()

            await wait(200)

            await expectAsync(finished).toBeRejectedWith(jasmine.any(up.RenderResult))
            await expectAsync(finished).toBeRejectedWith(jasmine.objectContaining(
              target: '#target',
              fragments: [document.querySelector('#target.new'), document.querySelector('#hungry.new')],
              layer: up.layer.root,
            ))

      describe 'restriction by layer', ->

        it 'only updates [up-hungry] elements in the targeted layer, even if the response would yield matching elements for multiple layers', ->
          up.layer.config.openDuration = 0
          up.layer.config.closeDuration = 0

          $fixture('.outside').text('old outside').attr('up-hungry', true)

          closeEventHandler = jasmine.createSpy('close event handler')
          up.on('up:layer:dismiss up:layer:accept', closeEventHandler)

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
          expect('.inside').toHaveText('new inside')
          expect('.outside').toHaveText('old outside')

        describe 'with [up-if-layer=any]', ->

          beforeEach ->
            up.layer.config.openDuration = 0
            up.layer.config.closeDuration = 0

          describe 'when updating an existing overlay', ->

            it 'does update an [up-hungry] element in an non-targeted layer', ->
              $fixture('.outside').text('old outside').attr('up-hungry', true).attr('up-if-layer', 'any')

              closeEventHandler = jasmine.createSpy('close event handler')
              up.on('up:layer:dismiss up:layer:accept', closeEventHandler)

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
              expect('.inside').toHaveText('new inside')
              expect('.outside').toHaveText('new outside')

            it 'sets up.layer.current and meta.layer to the non-targeted layer', ->
              currentLayerSpy = jasmine.createSpy('spy for up.layer.current')
              metaLayerSpy = jasmine.createSpy('spy for meta.layer')

              fixture('.outside', text: 'old outside', 'up-hungry': true, 'up-if-layer': 'any')

              up.compiler '.outside', (element, data, meta) ->
                currentLayerSpy(up.layer.current)
                metaLayerSpy(meta.layer)

              expect(currentLayerSpy.calls.count()).toBe(1)
              expect(currentLayerSpy.calls.argsFor(0)[0]).toBe(up.layer.root)
              expect(metaLayerSpy.calls.argsFor(0)[0]).toBe(up.layer.root)

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

              expect(up.layer.isOverlay()).toBe(true)

              expect(currentLayerSpy.calls.count()).toBe(2)
              expect(currentLayerSpy.calls.argsFor(1)[0]).toBe(up.layer.root)
              expect(metaLayerSpy.calls.argsFor(1)[0]).toBe(up.layer.root)

            it 'does not update the element if it is contained by the explicit target', ->
              fixture('.foo', text: 'old foo', 'up-hungry': true, 'up-if-layer': 'any')

              up.layer.open fragment: """
                <div class='overlay'>
                  <div class='foo'>old foo</div>
                  <div class='content'>old content</div>
                </div>
                """

              insertedSpy = jasmine.createSpy('up:fragment:inserted listener')
              up.on('up:fragment:inserted', insertedSpy)

              up.render fragment: """
                <div class='overlay'>
                  <div class='foo'>new foo</div>
                  <div class='content'>new content</div>
                </div>
              """

              expect(up.fragment.get('.content', layer: 'overlay')).toHaveText('new content')
              expect(up.fragment.get('.foo', layer: 'overlay')).toHaveText('new foo')
              expect(up.fragment.get('.foo', layer: 'root')).toHaveText('old foo')

              expect(insertedSpy.calls.count()).toBe(1)

            describe 'when a response closes the overlay via X-Up-Accept-layer', ->

              it 'updates the [up-hungry] element with the discarded overlay content', ->
                $fixture('.outside').text('old outside').attr('up-hungry', true).attr('up-if-layer', 'any')

                closeEventHandler = jasmine.createSpy('close event handler')
                up.on('up:layer:accept', closeEventHandler)

                up.layer.open fragment: """
                  <div class='inside'>
                    old inside
                  </div>
                  """

                expect(up.layer.count).toBe(2)

                updatePromise = up.render('.inside', url: '/page2')

                await wait()

                jasmine.respondWith(
                  responseText: """
                    <div class="outside">
                      new outside
                    </div>
                    <div class='inside'>
                      new inside
                    </div>
                    """,
                  responseHeaders: { 'X-Up-Accept-Layer': 'null' }
                )

                await expectAsync(updatePromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(closeEventHandler).toHaveBeenCalled()
                expect(up.layer.count).toBe(1)
                expect('.outside').toHaveText('new outside')

              it 'updates the [up-hungry] element with the discarded overlay content even if it would have been contained by the explicit target', ->
                fixture('.foo', text: 'old foo in root', 'up-hungry': '', 'up-if-layer': 'any')

                up.layer.open fragment: """
                  <div class='overlay'>
                    <div class='foo'>old foo in overlay</div>
                    <div class='content'>old content in overlay</div>
                  </div>
                  """

                await wait()

                updatePromise = up.render('.overlay', url: '/page2')

                await wait()

                jasmine.respondWith(
                  responseHeaders: { 'X-Up-Accept-Layer': 'null' }
                  responseText: """
                    <div class='overlay'>
                      <div class='foo'>new foo</div>
                      <div class='content'>new content</div>
                    </div>
                  """
                )

                await expectAsync(updatePromise).toBeRejectedWith(jasmine.any(up.Aborted))

                await wait()

                expect(up.layer.isRoot()).toBe(true)

                expect(up.fragment.get('.foo', layer: 'root')).toHaveText('new foo')

              it 'updates the [up-hungry] element before onAccepted callbacks', ->
                $fixture('.outside').text('old outside').attr('up-hungry', true).attr('up-if-layer', 'any')

                outsideSpy = jasmine.createSpy('outside spy')
                onAccepted = () -> outsideSpy(document.querySelector('.outside').innerText.trim())

                up.layer.open(onAccepted: onAccepted, fragment: """
                  <div class='inside'>
                    old inside
                  </div>
                  """
                )

                expect(up.layer.count).toBe(2)

                updatePromise = up.render('.inside', url: '/page2')

                await wait()

                jasmine.respondWith(
                  responseText: """
                    <div class="outside">
                      new outside
                    </div>
                    <div class='inside'>
                      new inside
                    </div>
                    """,
                  responseHeaders: { 'X-Up-Accept-Layer': 'null' }
                )

                await expectAsync(updatePromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(up.layer.count).toBe(1)
                expect(outsideSpy).toHaveBeenCalledWith('new outside')

            describe 'when a response closes the overlay via X-Up-Events', ->

              it 'updates the [up-hungry] element with the discarded overlay content', ->
                $fixture('.outside').text('old outside').attr('up-hungry', true).attr('up-if-layer', 'any')

                closeEventHandler = jasmine.createSpy('close event handler')
                up.on('up:layer:accept', closeEventHandler)

                up.layer.open(acceptEvent: 'goal:reached', fragment: """
                  <div class='inside'>
                    old inside
                  </div>
                  """
                )

                expect(up.layer.count).toBe(2)

                updatePromise = up.render('.inside', url: '/page2')

                await wait()

                jasmine.respondWith(
                  responseText: """
                    <div class="outside">
                      new outside
                    </div>
                    <div class='inside'>
                      new inside
                    </div>
                    """,
                  responseHeaders: { 'X-Up-Events': JSON.stringify([{ type: 'goal:reached', layer: 'current' }]) }
                )

                await expectAsync(updatePromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(closeEventHandler).toHaveBeenCalled()
                expect(up.layer.count).toBe(1)
                expect('.outside').toHaveText('new outside')

              it 'updates the [up-hungry] element before onAccepted callbacks', ->
                $fixture('.outside').text('old outside').attr('up-hungry', true).attr('up-if-layer', 'any')

                outsideSpy = jasmine.createSpy('outside spy')
                onAccepted = () -> outsideSpy(document.querySelector('.outside').innerText.trim())

                up.layer.open(acceptEvent: 'goal:reached', onAccepted: onAccepted, fragment: """
                  <div class='inside'>
                    old inside
                  </div>
                  """
                )

                expect(up.layer.count).toBe(2)

                updatePromise = up.render('.inside', url: '/page2')

                await wait()

                jasmine.respondWith(
                  responseText: """
                    <div class="outside">
                      new outside
                    </div>
                    <div class='inside'>
                      new inside
                    </div>
                    """,
                  responseHeaders: { 'X-Up-Events': JSON.stringify([{ type: 'goal:reached', layer: 'current' }]) }
                )

                await expectAsync(updatePromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(up.layer.count).toBe(1)
                expect(outsideSpy).toHaveBeenCalledWith('new outside')

          describe 'when opening a new overlay', ->

            it 'does update the [up-hungry] element in the parent layer', ->
              fixture('.outside', text: 'old outside', 'up-hungry': true,  'up-if-layer': 'any')

              up.layer.open target: '.inside', document: """
                <div class="outside">
                  new outside
                </div>
                <div class='inside'>
                  new inside
                </div>
                """

              expect(up.layer.isOverlay()).toBe(true)

              expect('.inside').toHaveText('new inside')
              expect('.outside').toHaveText('new outside')

            describe 'when the initial response immediately closes the new overlay via X-Up-Accept-Layer', ->

              it 'updates that [up-hungry] element with the discarded overlay content', ->
                fixture('.outside', text: 'old outside', 'up-hungry': true,  'up-if-layer': 'any')

                openPromise = up.layer.open(target: '.inside', url: '/other')

                await wait()

                jasmine.respondWith
                  responseText: """
                    <div class="outside">
                      new outside
                    </div>
                    <div class='inside'>
                      new inside
                    </div>
                  """
                  responseHeaders: { 'X-Up-Accept-Layer': 'null'}

                await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(up.layer.isOverlay()).toBe(false)

                expect('.outside').toHaveText('new outside')

              it 'updates that [up-hungry] element with the discarded overlay content even if the element would have been included in the explicit target', ->
                fixture('.foo', text: 'old foo in root', 'up-hungry': '', 'up-if-layer': 'any')

                openPromise = up.layer.open({ target: '.overlay', url: '/page2' })

                await wait()

                jasmine.respondWith(
                  responseHeaders: { 'X-Up-Accept-Layer': 'null' }
                  responseText: """
                    <div class='overlay'>
                      <div class='foo'>new foo</div>
                      <div class='content'>new content</div>
                    </div>
                  """
                )

                await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))

                await wait()

                expect(up.layer.isRoot()).toBe(true)

                expect(up.fragment.get('.foo', layer: 'root')).toHaveText('new foo')

              it 'updates that [up-hungry] element before onAccepted callbacks', ->
                fixture('.outside', text: 'old outside', 'up-hungry': true,  'up-if-layer': 'any')

                outsideSpy = jasmine.createSpy('outside spy')
                onAccepted = () -> outsideSpy(document.querySelector('.outside').innerText.trim())

                openPromise = up.layer.open(target: '.inside', url: '/other', onAccepted: onAccepted)

                await wait()

                jasmine.respondWith
                  responseText: """
                    <div class="outside">
                      new outside
                    </div>
                    <div class='inside'>
                      new inside
                    </div>
                  """
                  responseHeaders: { 'X-Up-Accept-Layer': 'null'}

                await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(up.layer.isOverlay()).toBe(false)
                expect(outsideSpy).toHaveBeenCalledWith('new outside')

            describe 'when the initial response immediately closes the new overlay via X-Up-Events', ->

              it 'updates that [up-hungry] element with the discarded overlay content', ->
                fixture('.outside', text: 'old outside', 'up-hungry': true,  'up-if-layer': 'any')

                openPromise = up.layer.open(target: '.inside', url: '/other', acceptEvent: 'goal:reached')

                await wait()

                jasmine.respondWith
                  responseText: """
                    <div class="outside">
                      new outside
                    </div>
                    <div class='inside'>
                      new inside
                    </div>
                  """
                  responseHeaders: { 'X-Up-Events': JSON.stringify([{ type: 'goal:reached', layer: 'current' }])}

                await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(up.layer.isOverlay()).toBe(false)

                expect('.outside').toHaveText('new outside')

              it 'updates that [up-hungry] element before onAccepted callbacks', ->
                fixture('.outside', text: 'old outside', 'up-hungry': true,  'up-if-layer': 'any')

                outsideSpy = jasmine.createSpy('outside spy')
                onAccepted = () -> outsideSpy(document.querySelector('.outside').innerText.trim())

                openPromise = up.layer.open(target: '.inside', url: '/other', acceptEvent: 'goal:reached', onAccepted: onAccepted)

                await wait()

                jasmine.respondWith
                  responseText: """
                    <div class="outside">
                      new outside
                    </div>
                    <div class='inside'>
                      new inside
                    </div>
                  """
                  responseHeaders: { 'X-Up-Events': JSON.stringify([{ type: 'goal:reached', layer: 'current' }])}

                await expectAsync(openPromise).toBeRejectedWith(jasmine.any(up.Aborted))

                expect(up.layer.isOverlay()).toBe(false)

                expect(outsideSpy).toHaveBeenCalledWith('new outside')

      describe 'with [up-if-history]', ->

        it 'only updates a hungry fragment when updating history', asyncSpec (next) ->
          $fixture('.hungry[up-hungry]').text('old hungry').attr('up-if-history', '')
          $fixture('.target').text('target version 1')

          up.render('.target', url: '/other')

          next ->
            jasmine.respondWith """
              <div class="target">
                target version 2
              </div>
              <div class="hungry">
                new hungry
              </div>
            """

          next ->
            expect('.target').toHaveText('target version 2')
            expect('.hungry').toHaveText('old hungry')

            up.render('.target', url: '/target', history: true)

          next ->
            jasmine.respondWith """
              <div class="target">
                target version 3
              </div>
              <div class="hungry">
                new hungry
              </div>
            """

          next ->
            expect('.target').toHaveText('target version 3')
            expect('.hungry').toHaveText('new hungry')

      describe 'up:fragment:hungry', ->

        it 'emits an up:fragment:hungry event with details about the render pass and the new element that would be matched', ->
          oldHungry = fixture('#hungry[up-hungry]', text: 'old hungry')
          fixture('#target', text: 'old target')

          hungryListener = jasmine.createSpy('up:fragment:hungry listener')
          up.on('up:fragment:hungry', hungryListener)

          up.render(
            target: '#target',
            scroll: '#target',
            abort: 'all',
            document: """
              <div id="hungry" up-hungry>new hungry</div>
              <div id="target">new target</div>
            """
          )

          await wait()

          expect('#target').toHaveText('new target')
          expect('#hungry').toHaveText('new hungry')

          expect(hungryListener.calls.count()).toBe(1)
          expect(hungryListener.calls.argsFor(0)[0]).toBeEvent('up:fragment:hungry')
          expect(hungryListener.calls.argsFor(0)[0].target).toEqual(jasmine.any(Element))
          expect(hungryListener.calls.argsFor(0)[0].target).toBe(oldHungry)
          expect(hungryListener.calls.argsFor(0)[0].newElement).toEqual(jasmine.any(Element))
          expect(hungryListener.calls.argsFor(0)[0].newElement.id).toBe('hungry')
          expect(hungryListener.calls.argsFor(0)[0].newElement).toHaveText('new hungry')
          expect(hungryListener.calls.argsFor(0)[0].renderOptions).toEqual(jasmine.objectContaining(
            target: '#target',
            scroll: '#target',
            abort: 'all',
          ))

        it 'does not update the element if up:fragment:hungry is prevented', ->
          fixture('#hungry[up-hungry]', text: 'old hungry')
          fixture('#target', text: 'old target')

          hungryListener = jasmine.createSpy('up:fragment:hungry listener').and.callFake (event) -> event.preventDefault()
          up.on('up:fragment:hungry', hungryListener)

          up.render(
            target: '#target',
            document: """
              <div id="hungry" up-hungry>new hungry</div>
              <div id="target">new target</div>
            """
          )

          await wait()

          expect(hungryListener).toHaveBeenCalled()

          expect('#target').toHaveText('new target')
          expect('#hungry').toHaveText('old hungry')

        it "parses an up:fragment:hungry listener from the hungry element's [up-on-hungry] attribute", ->
          window.attributeListener = jasmine.createSpy('attribute listener')
          oldHungry = fixture('#hungry[up-hungry]', text: 'old hungry', 'up-on-hungry': 'window.attributeListener(event, newElement)')
          fixture('#target', text: 'old target')


          up.render(
            target: '#target',
            document: """
              <div id="hungry" up-hungry>new hungry</div>
              <div id="target">new target</div>
            """
          )

          await wait()

          expect('#target').toHaveText('new target')
          expect('#hungry').toHaveText('new hungry')

          expect(window.attributeListener.calls.count()).toBe(1)
          expect(window.attributeListener.calls.argsFor(0)[0]).toBeEvent('up:fragment:hungry')
          expect(window.attributeListener.calls.argsFor(0)[1]).toEqual(jasmine.any(Element))
          expect(window.attributeListener.calls.argsFor(0)[1]).toHaveText('new hungry')
          delete window.attributeListener

        it 'does not update the element if an [up-on-hungry] attribute prevents the event', ->
          fixture('#hungry[up-hungry]', text: 'old hungry', 'up-on-hungry': 'event.preventDefault()')
          fixture('#target', text: 'old target')

          up.render(
            target: '#target',
            document: """
              <div id="hungry" up-hungry>new hungry</div>
              <div id="target">new target</div>
            """
          )

          await wait()

          expect('#target').toHaveText('new target')
          expect('#hungry').toHaveText('old hungry')

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

        next.after (interval + timingTolerance), ->
          expect(jasmine.Ajax.requests.count()).toBe(2)
          jasmine.respondWithSelector('.element[up-poll]', text: 'newer text')

        next ->
          expect('.element').toHaveText('newer text')

        next.after (interval + timingTolerance), ->
          expect(jasmine.Ajax.requests.count()).toBe(3)

      it 'does not make additional requests while a previous requests is still in flight', asyncSpec (next) ->
        deferred = u.newDeferred()

        up.radio.config.pollInterval = 50
        reloadSpy = spyOn(up, 'reload').and.returnValue(deferred)

        up.hello(fixture('.element[up-poll]'))

        next.after 100, ->
          expect(reloadSpy.calls.count()).toBe(1)

        next.after 100, ->
          expect(reloadSpy.calls.count()).toBe(1)
          deferred.resolve(new up.RenderResult())

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

      it 'keeps polling if the server responds with a 304 Not Modified status', asyncSpec (next) ->
        up.radio.config.pollInterval = 250

        up.hello(fixture('.element[up-poll][up-source="/source"]'))

        next.after 50, ->
          expect(jasmine.Ajax.requests.count()).toBe(0)

        next.after 250, ->
          expect(jasmine.Ajax.requests.count()).toBe(1)
          jasmine.respondWith(status: 304, responseText: '')

        next.after 50, ->
          expect(jasmine.Ajax.requests.count()).toBe(1)

        next.after 250, ->
          expect(jasmine.Ajax.requests.count()).toBe(2)

      it 'keeps polling if a request failed with a network issue', ->
        up.radio.config.pollInterval = 75
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.reject(new up.Error('network error'))

        up.hello(fixture('.element[up-poll]'))

        await jasmine.spyOnGlobalErrorsAsync (globalErrorSpy) ->
          await wait(125)

          expect(reloadSpy.calls.count()).toBe(1)
          expect(globalErrorSpy.calls.count()).toBe(1)

          await wait(75)

          expect(reloadSpy.calls.count()).toBe(2)
          expect(globalErrorSpy.calls.count()).toBe(2)

      it 'keeps polling if the server responds with a 404 Not Found error', ->
        up.radio.config.pollInterval = 250

        up.hello(fixture('.element[up-poll][up-source="/source"]'))

        await wait(50)
        expect(jasmine.Ajax.requests.count()).toBe(0)

        await wait(250)
        expect(jasmine.Ajax.requests.count()).toBe(1)

        await jasmine.spyOnGlobalErrorsAsync (globalErrorSpy) ->
          jasmine.respondWith(status: 404, responseText: 'Not found')

          await wait(50)
          expect(jasmine.Ajax.requests.count()).toBe(1)

          # up.FragmentPolling#onReloadFailure() will throw critical errors
          expect(globalErrorSpy).toHaveBeenCalledWith(jasmine.any(up.CannotMatch))

        await wait(250)
        expect(jasmine.Ajax.requests.count()).toBe(2)

      it 'does not reload if the tab is hidden', asyncSpec (next) ->
        up.radio.config.pollInterval = 50
        spyOnProperty(document, 'hidden', 'get').and.returnValue(true)
        spyOnProperty(document, 'visibilityState', 'get').and.returnValue('hidden')
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve(new up.RenderResult())

        up.hello(fixture('.element[up-poll]'))

        next.after 100, ->
          expect(reloadSpy).not.toHaveBeenCalled()

      it "pauses polling while the browser tab is hidden", ->
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve(new up.RenderResult())

        currentHidden = false
        currentVisibilityState = 'visible'
        spyOnProperty(document, 'hidden', 'get').and.callFake -> currentHidden
        spyOnProperty(document, 'visibilityState', 'get').and.callFake -> currentVisibilityState

        element = fixture('.unread[up-poll][up-interval=100]')
        up.hello(element) # start polling

        await wait(125)

        expect(reloadSpy.calls.count()).toBe(1)

        currentHidden = true
        currentVisibilityState = 'hidden'
        up.emit(document, 'visibilitychange')

        await wait(250)

        expect(reloadSpy.calls.count()).toBe(1)

        currentHidden = false
        currentVisibilityState = 'visible'
        up.emit(document, 'visibilitychange')

        # Since we spent the entire interval in the background layer, we now load immediately
        await wait(10)

        expect(reloadSpy.calls.count()).toBe(2)

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

      it 'stops polling when the element is destroyed while waiting for a previous request (bugfix)', ->
        up.radio.config.pollInterval = 75
        element = up.hello(fixture('.element[up-poll]'))

        await wait(125)

        expect(jasmine.Ajax.requests.count()).toBe(1)

        up.destroy(element)

        await wait()

        jasmine.respondWithSelector('.element[up-poll]')

        await wait(125)

        expect(jasmine.Ajax.requests.count()).toBe(1)

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

      it 'pauses polling when an up:fragment:poll event is prevented', asyncSpec (next) ->
        up.radio.config.pollInterval = interval = 150
        timingTolerance = interval / 3

        up.hello(fixture('.element[up-poll]'))
        eventCount = 0

        up.on 'up:fragment:poll', '.element', (event) ->
          eventCount++
          # Prevent the second event
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

      it "pauses polling while the element's layer is in the background", ->
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve(new up.RenderResult())

        element = fixture('.unread[up-poll][up-interval=100]')
        up.hello(element) # start polling

        await wait(125)

        expect(reloadSpy.calls.count()).toBe(1)

        up.layer.open()

        # Spend two intervals on a background layer
        await wait(250)

        expect(reloadSpy.calls.count()).toBe(1)

        up.layer.dismiss()

        # Since we spent the entire interval on the overlay, we now load immediately
        await wait(10)

        expect(reloadSpy.calls.count()).toBe(2)

      it "keeps polling on background layers with [up-if-layer='any']", ->
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve(new up.RenderResult())

        element = fixture('.unread[up-poll][up-interval=100][up-if-layer=any]')
        up.hello(element) # start polling

        await wait(125)

        expect(reloadSpy.calls.count()).toBe(1)

        up.layer.open()

        await wait(125)

        expect(reloadSpy.calls.count()).toBe(2)

      it 'does not poll when it was paused for a full interval on a background layer, but an { onAccepted } or { onDismissed } callback renders the polling layer', ->
        reloadSpy = spyOn(up, 'reload').and.callFake -> return Promise.resolve(new up.RenderResult())

        container = fixture('.container')
        element = e.affix(container, '.unread[up-poll][up-interval=100]')
        up.hello(container) # start polling

        await wait(125)

        expect(reloadSpy.calls.count()).toBe(1)

        up.layer.open({ onDismissed: () => up.render('.container', { url: '/page2' })})

        # Spend two intervals on a background layer
        await wait(250)

        expect(reloadSpy.calls.count()).toBe(1)

        up.layer.dismiss()

        await wait(10)

        # Polling was aborted by the onAccepted callback
        expect(reloadSpy.calls.count()).toBe(1)
        expect(jasmine.Ajax.requests.count()).toBe(1)
        expect(jasmine.lastRequest().url).toMatchURL('/page2')

      it 'does not poll a fragment with a weak selector', asyncSpec (next) ->
        warnSpy = spyOn(up, 'warn')

        up.hello(fixture('div[up-poll][up-interval=30]', text: 'old text'))

        next.after 80, ->
          expect(jasmine.Ajax.requests.count()).toBe(0)
          expect(warnSpy).toHaveBeenCalled()
          expect(warnSpy.calls.argsFor(0)[1]).toMatch(/untargetable fragment/i)

      describe 'with [up-keep-data] attribute', ->

        it "persists the polling element's data through reloading", asyncSpec (next) ->
          counterSpy = jasmine.createSpy(counterSpy)

          up.compiler '.element', (element, data) ->
            counterSpy(data.counter)
            data.counter++

          element = fixture('.element'
            'up-poll': '',
            'up-data': JSON.stringify(counter: 5),
            'up-keep-data': '',
            'up-interval': '30'
          )
          up.hello(element)

          expect(counterSpy.calls.count()).toBe(1)
          expect(counterSpy.calls.argsFor(0)[0]).toBe(5)

          next.after 80, ->
            expect(jasmine.Ajax.requests.count()).toBe(1)

            jasmine.respondWithSelector('.element', 'up-data': JSON.stringify(counter: 99))

          next ->
            expect(counterSpy.calls.count()).toBe(2)
            expect(counterSpy.calls.argsFor(1)[0]).toBe(6)
