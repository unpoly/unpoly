u = up.util
e = up.element
$ = jQuery

describe 'up.fragment', ->

  describe 'JavaScript functions', ->

    describe 'up.fragment.get()', ->

      it 'returns the first element matching the given selector', ->
        noMatch = fixture('.no-match')
        match = fixture('.match')
        otherMatch = fixture('.match.other')

        result = up.fragment.get('.match')

        expect(result).toEqual(match)

      it 'returns an Element argument unchanged', ->
        element = fixture('.element')
        result = up.fragment.get(element)
        expect(result).toBe(element)

      describe 'when a root element is given as the optional first argument', ->

        it 'returns the first matching descendant of the given root element', ->
          elementBeforeContainer = fixture('.element')
          container = fixture('.container')
          elementWithinContainer = e.affix(container, '.element')
          elementAfterContainer = fixture('.element')

          result = up.fragment.get(container, '.element')

          expect(result).toEqual(elementWithinContainer)

        it 'returns a second Element argument unchanged, even if its not a descendant of the given root', ->
          root = fixture('.root')
          element = fixture('.element')

          result = up.fragment.get(root, element)

          expect(result).toBe(element)

        it 'finds an element in a detached tree', ->
          detachedTree = e.createFromSelector('.detached-tree')
          element = e.affix(detachedTree, '.element')

          result = up.fragment.get(detachedTree, '.element')

          expect(result).toEqual(element)

        it 'finds an element in a detached tree if the current layer is an overlay (bugfix)', ->
          makeLayers(2)
          detachedTree = e.createFromSelector('.detached-tree')
          element = e.affix(detachedTree, '.element')

          result = up.fragment.get(detachedTree, '.element')

          expect(result).toEqual(element)

      describe 'layers', ->

        it 'matches elements in the given { layer }', ->
          makeLayers [{ target: '.element' }, { target: '.element' }]

          expect(up.layer.count).toBe(2)
          result = up.fragment.get('.element', layer: 'root')

          expect(up.layer.get(result)).toBe(up.layer.get(0))

        it 'matches elements in the current layer if no { layer } option is given', ->
          makeLayers [{ target: '.element' }, { target: '.element' }]

          expect(up.layer.count).toBe(2)
          result = up.fragment.get('.element')

          expect(up.layer.get(result)).toBe(up.layer.get(1))

        it 'matches elements on the root layer with { layer: 0 } (bugfix)', ->
          makeLayers [{ target: '.element' }, { target: '.element' }]

          result = up.fragment.get('.element', layer: 0)

          expect(up.layer.get(result)).toBe(up.layer.root)

      describe 'matching around the { origin }', ->

        it 'prefers to match an element closest to origin', ->
          root = fixture('.element#root')
          one = e.affix(root, '.element', text: 'old one')
          two = e.affix(root, '.element', text: 'old two')
          childOfTwo = e.affix(two, '.origin')
          three = e.affix(root, '.element', text: 'old three')

          result = up.fragment.get('.element', origin: childOfTwo)

          expect(result).toBe(two)

        it 'prefers to match a descendant selector in the vicinity of the origin', ->
          element1 = fixture('.element')
          element1Child1 = e.affix(element1, '.child',         text: 'old element1Child1')
          element1Child2 = e.affix(element1, '.child.sibling', text: 'old element1Child2')

          element2 = fixture('.element')
          element2Child1 = e.affix(element2, '.child',         text: 'old element2Child1')
          element2Child2 = e.affix(element2, '.child.sibling', text: 'old element2Child2')

          result = up.fragment.get('.element .sibling', origin: element2Child1)

          expect(result).toBe(element2Child2)

    describe 'up.fragment.all()', ->

      it 'returns elements matching the given selector', ->
        match = fixture('.match')
        otherMatch = fixture('.match.other')
        noMatch = fixture('.no-match')
        results = up.fragment.all('.match')
        expect(results).toEqual [match, otherMatch]

      it 'returns an array of the first argument if the first argument is already an element', ->
        match = fixture('.match')
        results = up.fragment.all(match)
        expect(results).toEqual [match]

      it 'returns a given Array unchanged', ->
        match = fixture('.match')
        results = up.fragment.all([match])
        expect(results).toEqual [match]

      it 'returns a given NodeList unchanged', ->
        match = fixture('.match')
        nodeList = document.querySelectorAll('.match')
        results = up.fragment.all(nodeList)
        expect(results).toEqual nodeList

      it 'returns an empty array if there are no matches', ->
        results = up.fragment.all('.match')
        expect(results).toEqual []

      it 'does not return an element that is currently destroying', ->
        match = fixture('.match.up-destroying')
        results = up.fragment.all('.match')
        expect(results).toEqual []

      it 'finds the <body> element (bugfix)', ->
        results = up.fragment.all('body')
        expect(results).toEqual [document.body]

      it 'finds the <html> element (bugfix)', ->
        results = up.fragment.all('html')
        expect(results).toEqual [document.documentElement]

      it 'supports the custom :has() selector', ->
        match = fixture('.match')
        otherMatch = fixture('.match')
        otherMatchChild = up.element.affix(otherMatch, '.child')

        results = up.fragment.all('.match:has(.child)')
        expect(results).toEqual [otherMatch]

      describe 'expansion of :main', ->

        it 'expands :main to the configured main target selectors', ->
          one = fixture('.one')
          two = fixture('.two')
          three = fixture('.three')

          up.fragment.config.mainTargets = ['.two']

          results = up.fragment.all(':main')
          expect(results).toEqual [two]

        it 'matches nothing if the user has configured no main targets', ->
          up.fragment.config.mainTargets = []

          results = up.fragment.all(':main')
          expect(results).toEqual []

        it 'matches earlier main targets first', ->
          one = fixture('.one')
          two = fixture('.two')
          three = fixture('.three')
          four = fixture('.four')

          up.fragment.config.mainTargets = ['.three', '.one', '.four']

          results = up.fragment.all(':main')
          expect(results).toEqual [three, one, four]

      describe 'when given a root element for the search', ->

        it 'only matches descendants of that root', ->
          parent1 = fixture('.parent1')
          parent1Match = e.affix(parent1, '.match')

          parent2 = fixture('.parent1')
          parent2Match = e.affix(parent2, '.match')

          expect(up.fragment.all(parent1, '.match')).toEqual [parent1Match]
          expect(up.fragment.all(parent2, '.match')).toEqual [parent2Match]

        it 'does not match the root element itself', ->
          parent = fixture('.element')
          child = e.affix(parent, '.element')

          expect(up.fragment.all(parent, '.element')).toEqual [child]


        it "only matches descendants in that root's layer", ->
          makeLayers [
            { '.element', content: 'element in root layer' }
            { '.element', content: 'element in modal layer' }
          ]

          results = up.fragment.all(document.body, '.element')
          expect(results.length).toBe(1)
          expect(up.layer.get(results[0])).toBe(up.layer.root)

        it 'supports the custom :has() selector', ->
          container = fixture('.container')

          match = e.affix(container, '.match')
          otherMatch = e.affix(container, '.match')
          otherMatchChild = e.affix(otherMatch, '.child')

          results = up.fragment.all(container, '.match:has(.child)')
          expect(results).toEqual [otherMatch]

      it 'resolves an & in the selector string with an selector for the { origin }'

      describe 'layer matching', ->

        beforeEach (done) ->
          @rootElement = fixture('.element.in-root')
          fixtureInOverlay('.element.in-overlay').then (element) =>
            @overlayElement = element
            done()

        it 'matches elements in the current layer only', ->
          results = up.fragment.all('.element')
          expect(results).toEqual [@overlayElement]

        it "only matches elements in the layer of the given { origin }", ->
          otherRootElement = fixture('.element.other.in-root')
          results = up.fragment.all('.element', origin: otherRootElement)
          expect(results).toEqual [@rootElement, otherRootElement]

        it 'only matches elements in the given { layer }', ->
          results = up.fragment.all('.element', layer: 'root')
          expect(results).toEqual [@rootElement]

        it 'returns an empty array if no element matches', ->
          results = up.fragment.all('.other')
          expect(results).toEqual []

        it 'returns the first argument if that is already an element, even if { layer } is given', ->
          match = fixture('.match')
          result = up.fragment.get(match, layer: 'root')
          expect(result).toBe(match)

    describe 'up.fragment.closest()', ->

      it 'returns the closest ancestor of the given root that matches the given selector', ->
        $grandGrandMother = $fixture('.match')
        $grandMother = $grandGrandMother.affix('.match')
        $mother = $grandMother.affix('.no-match')
        $element = $mother.affix('.element')

        result = up.fragment.closest($element[0], '.match')
        expect(result).toBe($grandMother[0])

      it 'returns the given root if it matches', ->
        $mother = $fixture('.match')
        $element = $mother.affix('.match')

        result = up.fragment.closest($element[0], '.match')
        expect(result).toBe($element[0])

      it 'does not return descendants of the root, even if they match', ->
        $element = $fixture('.element')
        $child = $element.affix('.match')

        result = up.fragment.closest($element[0], '.match')
        expect(result).toBeMissing()

      it 'returns missing if neither root nor ancestor matches', ->
        $mother = $fixture('.no-match')
        $element = $mother.affix('.no-match')

        result = up.fragment.closest($element[0], '.match')
        expect(result).toBeMissing()

      it 'returns missing if an ancestor matches, but is in another layer', ->
        makeLayers(2)

        start = up.layer.element
        result = up.fragment.closest(start, 'body')
        expect(result).toBeMissing()

      it 'returns the closest ancestor in a detached tree', ->
        $grandGrandMother = $fixture('.match')
        $grandMother = $grandGrandMother.affix('.match')
        $mother = $grandMother.affix('.no-match')
        $element = $mother.affix('.element')

        $grandGrandMother.detach()

        result = up.fragment.closest($element[0], '.match')
        expect(result).toBe($grandMother[0])

    describe 'up.fragment.subtree()', ->

      it 'returns all descendants of the given root matching the given selector', ->
        $element = $fixture('.element')
        $matchingChild = $element.affix('.child.match')
        $matchingGrandChild = $matchingChild.affix('.grand-child.match')
        $otherChild = $element.affix('.child')
        $otherGrandChild = $otherChild.affix('.grand-child')
        results = up.fragment.subtree($element[0], '.match')
        expect(results).toEqual [$matchingChild[0], $matchingGrandChild[0]]

      it 'includes the given root if it matches the selector', ->
        $element = $fixture('.element.match')
        $matchingChild = $element.affix('.child.match')
        $matchingGrandChild = $matchingChild.affix('.grand-child.match')
        $otherChild = $element.affix('.child')
        $otherGrandChild = $otherChild.affix('.grand-child')
        results = up.fragment.subtree($element[0], '.match')
        expect(results).toEqual [$element[0], $matchingChild[0], $matchingGrandChild[0]]

      it 'does not return ancestors of the root, even if they match', ->
        $parent = $fixture('.parent.match')
        $element = $parent.affix('.element')
        results = up.fragment.subtree($element[0], '.match')
        expect(results).toEqual []

      it 'returns an empty list if neither root nor any descendant matches', ->
        $element = $fixture('.element')
        $child = $element.affix('.child')
        results = up.fragment.subtree($element[0], '.match')
        expect(results).toEqual []

      it 'ignores descendants that are being destroyed', ->
        element = fixture('.element')
        activeChild = e.affix(element, '.child')
        destroyingChild = e.affix(element, '.child.up-destroying')

        results = up.fragment.subtree(element, '.child')

        expect(results).toEqual [activeChild]

      it 'supports non-standard selector extensions like :has()', ->
        element = fixture('.element')
        matchingChild = e.affix(element, '.child')
        requiredGrandChild = e.affix(matchingChild, '.grand-child')
        otherChild = e.affix(element, '.child.up-destroying')

        results = up.fragment.subtree(element, '.child:has(.grand-child)')

        expect(results).toEqual [matchingChild]

      it 'matches descendants in a detached tree', ->
        detachedTree = fixture('.element')
        matchingChild = e.affix(detachedTree, '.child')
        otherChild = e.affix(detachedTree, '.other-child')

        results = up.fragment.subtree(detachedTree, '.child')

        expect(results).toEqual [matchingChild]

      it 'matches descendants in a detached tree when the current layer is an overlay (bugfix)', ->
        makeLayers(2)

        detachedTree = fixture('.element')
        matchingChild = e.affix(detachedTree, '.child')
        otherChild = e.affix(detachedTree, '.other-child')

        results = up.fragment.subtree(detachedTree, '.child')

        expect(results).toEqual [matchingChild]

    describe 'up.render()', ->

      beforeEach ->
        up.motion.config.enabled = false

      it 'returns a promise with an up.RenderResult that contains information about the updated fragments and layer', (done) ->
        fixture('.one', text: 'old one')
        fixture('.two', text: 'old two')
        fixture('.three', text: 'old three')

        promise = up.render('.one, .three', document: """
          <div class="one">new one</div>
          <div class="two">new two</div>
          <div class="three">new three</div>
        """)

        promise.then (result) ->
          expect(result.fragments).toEqual([document.querySelector('.one'), document.querySelector('.three')])
          expect(result.layer).toBe(up.layer.root)
          done()

      describe 'with { url } option', ->

        it 'replaces the given selector with the same selector from a freshly fetched page', asyncSpec (next) ->
          fixture('.before', text: 'old-before')
          fixture('.middle', text: 'old-middle')
          fixture('.after', text: 'old-after')

          up.render('.middle', url: '/path')

          next =>
            @respondWith """
              <div class="before">new-before</div>
              <div class="middle">new-middle</div>
              <div class="after">new-after</div>
              """

          next =>
            expect('.before').toHaveText('old-before')
            expect('.middle').toHaveText('new-middle')
            expect('.after').toHaveText('old-after')

        it 'returns a promise that will be fulfilled once the server response was received and the fragments were swapped', asyncSpec (next) ->
          fixture('.target')

          resolution = jasmine.createSpy()
          promise = up.render('.target', url: '/path')

          promise.then(resolution)

          next =>
            expect(resolution).not.toHaveBeenCalled()
            @respondWithSelector('.target', text: 'new-text')

          next =>
            expect(resolution).toHaveBeenCalled()
            expect($('.target')).toHaveText('new-text')

        it 'uses a HTTP method given as { method } option', asyncSpec (next) ->
          fixture('.target')
          up.render('.target', url: '/path', method: 'put')
          next => expect(@lastRequest()).toHaveRequestMethod('PUT')

        it 'rejects with an AbortError if the request is aborted', (done) ->
          fixture('.target')
          promise = up.render('.target', url: '/path')

          expect(up.network.isBusy()).toBe(true)

          up.network.abort()

          u.task ->
            promiseState(promise).then (result) ->
              expect(result.state).toBe('rejected')
              expect(result.value).toBeAbortError()
              done()

        describe 'last modification time' , ->

          it 'sets an Last-Modified response header as an [up-time] attribute', asyncSpec (next) ->
            fixture('.target', text: 'old content')
            up.render('.target', url: '/path')

            next ->
              jasmine.respondWithSelector('.target',
                text: 'new content',
                responseHeaders: { 'Last-Modified': 'Wed, 21 Oct 2015 07:28:00 GMT' }
              )

            next ->
              expect('.target').toHaveText('new content')
              expect('.target').toHaveAttribute('up-time', 'Wed, 21 Oct 2015 07:28:00 GMT')

          it 'does not change an existing [up-time] attribute on the new fragment with information from the Last-Modified header', asyncSpec (next) ->
            fixture('.target', text: 'old content')
            up.render('.target', url: '/path')

            next ->
              jasmine.respondWithSelector('.target[up-time=123]',
                text: 'new content',
                responseHeaders: { 'Last-Modified': 'Wed, 21 Oct 2015 07:28:00 GMT' }
              )

            next ->
              expect('.target').toHaveText('new content')
              expect('.target').toHaveAttribute('up-time', '123')

          it "sets an [up-time=false] attribute if the server did not send an Last-Modified header, so we won't fall back to a parent's Last-Modified header later", asyncSpec (next) ->
            fixture('.target', text: 'old content')
            up.render('.target', url: '/path')

            next ->
              jasmine.respondWithSelector('.target', text: 'new content')

            next ->
              expect('.target').toHaveText('new content')
              expect('.target').toHaveAttribute('up-time', 'false')

        describe 'ETags' , ->

          it 'sets a weak ETag header as an [up-etag] attribute', asyncSpec (next) ->
            fixture('.target', text: 'old content')
            up.render('.target', url: '/path')

            next ->
              jasmine.respondWithSelector('.target',
                text: 'new content',
                responseHeaders: { 'Etag': 'W/"0815"' }
              )

            next ->
              expect('.target').toHaveText('new content')
              expect('.target').toHaveAttribute('up-etag', 'W/"0815"')

          it 'sets a strong ETag header as an [up-etag] attribute', asyncSpec (next) ->
            fixture('.target', text: 'old content')
            up.render('.target', url: '/path')

            next ->
              jasmine.respondWithSelector('.target',
                text: 'new content',
                responseHeaders: { 'Etag': '"33a64df551425fcc55e4d42a148795d9f25f89d4"' } # it does have extra quotes
              )

            next ->
              expect('.target').toHaveText('new content')
              expect('.target').toHaveAttribute('up-etag', '"33a64df551425fcc55e4d42a148795d9f25f89d4"')

          it 'does not change an existing [up-etag] attribute on the new fragment with information from the ETag header', asyncSpec (next) ->
            fixture('.target', text: 'old content')
            up.render('.target', url: '/path')

            next ->
              jasmine.respondWithSelector('.target[up-etag=123]',
                text: 'new content',
                responseHeaders: { 'ETag': '"33a64df551425fcc55e4d42a148795d9f25f89d4"' }
              )

            next ->
              expect('.target').toHaveText('new content')
              expect('.target').toHaveAttribute('up-etag', '123')

          it "sets an [up-etag=false] attribute if the server did not send an ETag header, so we won't fall back to a parent's ETag header later", asyncSpec (next) ->
            fixture('.target', text: 'old content')
            up.render('.target', url: '/path')

            next ->
              jasmine.respondWithSelector('.target', text: 'new content')

            next ->
              expect('.target').toHaveText('new content')
              expect('.target').toHaveAttribute('up-etag', 'false')

        describe 'with { params } option', ->

          it "uses the given params as a non-GET request's payload", asyncSpec (next) ->
            givenParams = { 'foo-key': 'foo-value', 'bar-key': 'bar-value' }
            fixture('.target')
            up.render('.target', url: '/path', method: 'put', params: givenParams)

            next =>
              expect(@lastRequest().data()['foo-key']).toEqual(['foo-value'])
              expect(@lastRequest().data()['bar-key']).toEqual(['bar-value'])

          it "encodes the given params into the URL of a GET request", asyncSpec (next) ->
            fixture('.target')
            givenParams = { 'foo-key': 'foo-value', 'bar-key': 'bar-value' }
            up.render('.target', url: '/path', method: 'get', params: givenParams)
            next => expect(@lastRequest().url).toMatchURL('/path?foo-key=foo-value&bar-key=bar-value')

        describe 'when the server responds with an error or unexpected content', ->

          it 'uses a target selector given as { failTarget } option', asyncSpec (next) ->
            fixture('.success-target', text: 'old success text')
            fixture('.failure-target', text: 'old failure text')

            up.render('.success-target', url: '/path', failTarget: '.failure-target')

            next =>
              @respondWith
                status: 500
                responseText: """
                  <div class="failure-target">new failure text</div>
                  <div class="success-target">new success text</div>
                """

            next =>
              expect('.success-target').toHaveText('old success text')
              expect('.failure-target').toHaveText('new failure text')

          it 'does update a fragment if the server sends an XHTML content-type instead of text/html', asyncSpec (next) ->
            fixture('.target', text: 'old text')

            up.render('.target', url: '/path', failTarget: '.failure')

            next =>
              @respondWith
                contentType: 'application/xhtml+xml'
                responseText: '<div class="target">new text</div>'

            next =>
              expect('.target').toHaveText('new text')

          it 'rejects the returned promise', (done) ->
            fixture('.success-target')
            fixture('.failure-target')
            promise = up.render('.success-target', url: '/path', failTarget: '.failure-target')

            u.task =>
              promiseState(promise).then (result) =>
                expect(result.state).toEqual('pending')

                @respondWithSelector('.failure-target', status: 500)

                u.task =>
                  promiseState(promise).then (result) =>
                    expect(result.state).toEqual('rejected')
                    done()

          it 'rejects with an error that explains why success targets were not used', (done) ->
            fixture('.target')
            promise = up.render('.target', url: '/qux')

            u.task ->
              jasmine.respondWithSelector('.unexpected', status: 500)

              u.task ->
                promiseState(promise).then ({ state, value }) ->
                  expect(state).toBe('rejected')
                  expect(value).toMatch(/No target selector given for failed responses/i)
                  done()

          describe 'with { fail } option', ->

            it 'always uses success options with { fail: false }', asyncSpec (next) ->
              fixture('.success-target', text: 'old success text')
              fixture('.failure-target', text: 'old failure text')

              up.render(
                target: '.success-target',
                failTarget: '.failure-target',
                url: '/path',
                status: 200,
                fail: true
              )

              next ->
                jasmine.respondWith """
                  <div class="success-target">new success text</div>
                  <div class="failure-target">new failure text</div>
                  """

              next ->
                expect('.success-target').toHaveText('old success text')
                expect('.failure-target').toHaveText('new failure text')
            it 'always uses failure options with { fail: true }', asyncSpec (next) ->
              fixture('.success-target', text: 'old success text')
              fixture('.failure-target', text: 'old failure text')

              up.render(
                target: '.success-target',
                failTarget: '.failure-target',
                url: '/path',
                status: 200,
                fail: true
              )

              next ->
                jasmine.respondWith """
                  <div class="success-target">new success text</div>
                  <div class="failure-target">new failure text</div>
                  """

              next ->
                expect('.success-target').toHaveText('old success text')
                expect('.failure-target').toHaveText('new failure text')

            it 'accepts a function as { fail } option', asyncSpec (next) ->
              failFn = jasmine.createSpy('fail function').and.returnValue(false)

              fixture('.success-target', text: 'old success text')
              fixture('.failure-target', text: 'old failure text')

              up.render(
                target: '.success-target',
                failTarget: '.failure-target',
                url: '/path',
                status: 500,
                fail: failFn
              )

              next ->
                jasmine.respondWith """
                  <div class="success-target">new success text</div>
                  <div class="failure-target">old failure text</div>
                  """

              next ->
                expect(failFn).toHaveBeenCalled

                expect('.success-target').toHaveText('new success text')
                expect('.failure-target').toHaveText('old failure text')

            it 'lets up:fragment:loaded listeners force a failure response by setting event.renderOptions.fail = true', asyncSpec (next) ->
              fixture('.success-target', text: 'old success text')
              fixture('.failure-target', text: 'old failure text')

              up.on('up:fragment:loaded', (e) -> e.renderOptions.fail = true)

              up.render(target: '.success-target', failTarget: '.failure-target', url: '/path')

              next ->
                jasmine.respondWith """
                  <div class="success-target">new success text</div>
                  <div class="failure-target">new failure text</div>
                  """

              next ->
                expect('.success-target').toHaveText('old success text')
                expect('.failure-target').toHaveText('new failure text')

        describe 'when the request times out', ->

          it "doesn't crash and rejects the returned promise", asyncSpec (next) ->
            jasmine.clock().install() # required by responseTimeout()
            fixture('.target')
            promise = up.render('.target', url: '/path', timeout: 50)

            next =>
              # See that the correct timeout value has been set on the XHR instance
              expect(@lastRequest().timeout).toEqual(50)

            next.await =>
              # See that the promise is still pending before the timeout
              promiseState(promise).then (result) -> expect(result.state).toEqual('pending')

            next =>
              @lastRequest().responseTimeout()

            next.await =>
              promiseState(promise).then (result) -> expect(result.state).toEqual('rejected')

        describe 'when there is a network issue', ->

          it "doesn't crash and rejects the returned promise with up.Offline", (done) ->
            fixture('.target')
            promise = up.render('.target', url: '/path')

            u.task =>
              promiseState(promise).then (result) =>
                expect(result.state).toEqual('pending')
                @lastRequest().responseError()
                u.task =>
                  promiseState(promise).then (result) =>
                    expect(result.state).toBe('rejected')
                    expect(result.value.name).toBe('up.Offline')
                    done()

          it 'emits an up:fragment:offline event with access to { request } and { renderOptions }', asyncSpec (next) ->
            listener = jasmine.createSpy('up:fragment:offline listener')
            up.on('up:fragment:offline', listener)

            fixture('.target')
            up.render('.target', url: '/other-path')

            next ->
              expect(jasmine.Ajax.requests.count()).toBe(1)

              expect(listener).not.toHaveBeenCalled()

              jasmine.lastRequest().responseError()

            next ->
              expect(listener).toHaveBeenCalled()
              event = listener.calls.argsFor(0)[0]
              expect(event.type).toBe('up:fragment:offline')
              expect(event.request).toEqual(jasmine.any(up.Request))
              expect(event.renderOptions.target).toMatchURL('.target')
              expect(event.renderOptions.url).toMatchURL('/other-path')

          it 'calls an { onOffline } listener with an up:fragment:offline event', asyncSpec (next) ->
            listener = jasmine.createSpy('onOffline callback')

            fixture('.target')
            up.render('.target', url: '/other-path', onOffline: listener)

            next ->
              expect(jasmine.Ajax.requests.count()).toBe(1)

              expect(listener).not.toHaveBeenCalled()

              jasmine.lastRequest().responseError()

            next ->
              expect(listener).toHaveBeenCalled()
              event = listener.calls.argsFor(0)[0]
              expect(event.type).toBe('up:fragment:offline')

          it 'allows up:fragment:offline listeners to retry the rendering by calling event.retry()', asyncSpec (next) ->
            listener = jasmine.createSpy('onOffline callback')

            fixture('.target', text: 'old text')
            up.render('.target', url: '/other-path', onOffline: listener)

            next ->
              expect(jasmine.Ajax.requests.count()).toBe(1)

              expect(listener).not.toHaveBeenCalled()

              jasmine.lastRequest().responseError()

            next ->
              expect('.target').toHaveText('old text')
              expect(listener.calls.count()).toBe(1)
              event = listener.calls.argsFor(0)[0]
              event.retry()

            next ->
              expect(jasmine.Ajax.requests.count()).toBe(2)

              jasmine.respondWithSelector('.target', text: 'new text')

            next ->
              # The listener was not called again
              expect(listener.calls.count()).toBe(1)

              expect('.target').toHaveText('new text')

        describe 'up:fragment:loaded event', ->

          it 'emits an up:fragment:loaded event that contains information about the request, response and render options', asyncSpec (next) ->
            origin = fixture('.origin')
            fixture('.target')
            event = undefined
            up.on 'up:fragment:loaded', (e) -> event = e

            up.render(target: '.target', url: '/url', location: '/location-from-option', peel: false, origin: origin)

            next =>
              @respondWith('<div class="target">text from server</div>')

            next ->
              expect(event).toBeGiven()
              expect(event.request).toEqual(jasmine.any(up.Request))
              expect(event.request.url).toMatchURL('/url')
              expect(event.response.text).toContain('text from server')
              expect(event.renderOptions.peel).toBe(false)
              expect(event.renderOptions.location).toMatchURL('/location-from-option')
              expect(event.origin).toBe(origin)
              expect(event.layer).toBe(up.layer.root)

          it 'allows listeners to prevent an up:fragment:loaded event to prevent changes to the DOM and browser history', (done) ->
            up.history.config.enabled = true
            up.on('up:fragment:loaded', (e) -> e.preventDefault())
            fixture('.target', text: 'old text')

            changePromise = up.render(target: '.target', url: '/url')

            u.task =>
              @respondWith('new text')

              u.task =>
                expect('.target').toHaveText('old text')
                expect(location.href).toMatchURL(@locationBeforeExample)

                promiseState(changePromise).then (result) ->
                  expect(result.state).toEqual('rejected')
                  expect(up.error.aborted.is(result.value)).toBe(true)

                  done()

          it 'allows listeners to mutate up.render() options before the fragment is updated', asyncSpec (next) ->
            fixture('.one', text: 'old one')
            fixture('.two', text: 'old two')

            up.on('up:fragment:loaded', (e) -> e.renderOptions.target = '.two')

            changePromise = up.render(target: '.one', url: '/url')

            next =>
              @respondWith """
                <div class="one">new one</div>
                <div class="two">new two</div>
                """

            next ->
              expect('.one').toHaveText('old one')
              expect('.two').toHaveText('new two')

          it 'allows listeners to mutate up.render() options before the fragment is updated when the server responds with an error code (bugfix)', asyncSpec (next) ->
            fixture('.one', text: 'old one')
            fixture('.two', text: 'old two')
            fixture('.three', text: 'old three')

            up.on('up:fragment:loaded', (e) -> e.renderOptions.failTarget = '.three')

            up.render(target: '.one', failTarget: '.two', url: '/url')

            next ->
              jasmine.respondWith
                status: 500
                responseText: """
                  <div class="one">new one</div>
                  <div class="two">new two</div>
                  <div class="three">new three</div>
                  """

            next ->
              expect('.one').toHaveText('old one')
              expect('.two').toHaveText('old two')
              expect('.three').toHaveText('new three')


        describe 'when the server sends an X-Up-Events header', ->

          it 'emits these events', asyncSpec (next) ->
            fixture('.element')

            up.render(target: '.element', url: '/path')

            event1 = { type: 'foo', prop: 'bar '}
            event2 = { type: 'baz', prop: 'bam '}

            spyOn(up, 'emit').and.callThrough()

            next =>
              @respondWith
                responseHeaders: { 'X-Up-Events': JSON.stringify([event1, event2]) }
                responseText: '<div class="element"></div>'

            next ->
              expect(up.emit).toHaveBeenCalledWith(event1)
              expect(up.emit).toHaveBeenCalledWith(event2)

        describe 'when the server sends an X-Up-Accept-Layer header', ->

          describe 'when updating an overlay', ->

            it 'accepts the layer with the header value', asyncSpec (next) ->
              callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({ onAccepted: callback, url: '/path', target: '.target' })

              next =>
                @respondWithSelector('.target')

              next =>
                up.render({ url: '/path2', target: '.target'})

              next =>
                expect(callback).not.toHaveBeenCalled()

                @respondWithSelector('.target', responseHeaders: { 'X-Up-Accept-Layer': "123" })

              next ->
                expect(callback).toHaveBeenCalledWith(jasmine.objectContaining(value: 123))

            it 'does not require the server to render content when the overlay will close anyway (when updating a layer)', asyncSpec (next) ->
              callback = jasmine.createSpy('onAccepted callback')

              up.layer.open({ onAccepted: callback, url: '/path', target: '.target' })

              next =>
                @respondWithSelector('.target')

              next =>
                up.render({ url: '/path2', target: '.target' })

              next =>
                expect(callback).not.toHaveBeenCalled()

                @respondWith('', responseHeaders: { 'X-Up-Accept-Layer': "null" })

              next ->
                expect(callback).toHaveBeenCalled()

          describe 'when updating the root layer', ->

            it 'ignores the header and updates the root layer with the response body', asyncSpec (next) ->
              element = fixture('.element', text: 'old content')
              acceptedListener = jasmine.createSpy('up:layer:accepted listener')
              up.on('up:layer:accepted', acceptedListener)

              up.render({ url: '/path', target: '.element'})

              next =>
                @respondWithSelector('.element', text: 'new content', responseHeaders: { 'X-Up-Accept-Layer': "null" })

              next =>
                expect('.element').toHaveText('new content')
                expect(acceptedListener).not.toHaveBeenCalled()

          describe 'when opening a layer', ->

            it 'accepts the layer that is about to open', asyncSpec (next) ->
              callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({ onAccepted: callback, url: '/path', target: '.target' })

              next =>
                expect(callback).not.toHaveBeenCalled()

                @respondWithSelector('.target', responseHeaders: { 'X-Up-Accept-Layer': "null" })

              next ->
                expect(callback).toHaveBeenCalled()

            it 'does not require the server to render content when the overlay will close anyway', asyncSpec (next) ->
              callback = jasmine.createSpy('onAccepted callback')
              up.layer.open({ onAccepted: callback, url: '/path', target: '.target' })

              next =>
                expect(callback).not.toHaveBeenCalled()

                @respondWith('', responseHeaders: { 'X-Up-Accept-Layer': "null" })

              next ->
                expect(callback).toHaveBeenCalled()


        describe 'when the server sends an X-Up-Dismiss-Layer header', ->

          it 'dismisses the targeted overlay with the header value', asyncSpec (next) ->
            callback = jasmine.createSpy('onDismissed callback')
            up.layer.open({ onDismissed: callback, url: '/path', target: '.target' })

            next =>
              @respondWithSelector('.target')

            next =>
              up.render({ url: '/path2', target: '.target'})

            next =>
              expect(callback).not.toHaveBeenCalled()

              @respondWithSelector('.target', responseHeaders: { 'X-Up-Dismiss-Layer': "123" })

            next ->
              expect(callback).toHaveBeenCalledWith(jasmine.objectContaining(value: 123))

        describe 'when the server sends no content', ->

          it 'succeeds when the server sends an empty body with HTTP status 304 (not modified)', asyncSpec (next) ->
            fixture('.one', text: 'old one')
            fixture('.two', text: 'old two')

            promise = up.render(target: '.one', url: '/path')

            next =>
              @respondWith(status: 304, responseText: '')

            next ->
              expect('.one').toHaveText('old one')
              expect('.two').toHaveText('old two')

              next.await promiseState(promise)

            next (result) ->
              expect(result.state).toBe('fulfilled')

          it 'succeeds when the server sends an empty body with HTTP status 204 (no content)', asyncSpec (next) ->
            fixture('.one', text: 'old one')
            fixture('.two', text: 'old two')

            promise = up.render(target: '.one', url: '/path')

            next =>
              @respondWith(status: 204, responseText: '')

            next ->
              expect('.one').toHaveText('old one')
              expect('.two').toHaveText('old two')

              next.await promiseState(promise)

            next (result) ->
              expect(result.state).toBe('fulfilled')

        describe 'when the server sends an X-Up-Target header', ->

          it 'renders the server-provided target', asyncSpec (next) ->
            fixture('.one', text: 'old content')
            fixture('.two', text: 'old content')

            up.render(target: '.one', url: '/path')

            next =>
              @respondWithSelector('.two', text: 'new content', responseHeaders: { 'X-Up-Target': '.two' })

            next ->
              expect('.one').toHaveText('old content')
              expect('.two').toHaveText('new content')

          it 'renders the server-provided target for a failed update', asyncSpec (next) ->
            fixture('.one', text: 'old content')
            fixture('.two', text: 'old content')
            fixture('.three', text: 'old content')

            up.render(target: '.one', failTarget: '.two', url: '/path')

            next =>
              @respondWithSelector('.three', text: 'new content', responseHeaders: { 'X-Up-Target': '.three' }, status: 500)

            next ->
              expect('.one').toHaveText('old content')
              expect('.two').toHaveText('old content')
              expect('.three').toHaveText('new content')

          it 'does not require a response body and succeeds when the server sends X-Up-Target: :none', asyncSpec (next) ->
            fixture('.one', text: 'old one')
            fixture('.two', text: 'old two')

            promise = up.render(target: '.one', url: '/path')

            next =>
              @respondWith(responseHeaders: { 'X-Up-Target': ':none' }, responseText: '', contentType: 'text/plain')

            next ->
              expect('.one').toHaveText('old one')
              expect('.two').toHaveText('old two')

              next.await promiseState(promise)

            next (result) ->
              expect(result.state).toBe('fulfilled')
              expect(result.value).toEqual(jasmine.any(up.RenderResult))
              expect(result.value.fragments).toEqual []

          it 'lets the server sends an abstract target like :main', asyncSpec (next) ->
            fixture('.one', text: 'old content')
            fixture('.two', text: 'old content')
            up.fragment.config.mainTargets = ['.two']

            up.render(target: '.one', url: '/path')

            next =>
              @respondWithSelector('.two', text: 'new content', responseHeaders: { 'X-Up-Target': ':main' })

            next ->
              expect('.one').toHaveText('old content')
              expect('.two').toHaveText('new content')

        describe 'for a cross-origin URL', ->

          it 'loads the content in a new page', asyncSpec (next) ->
            loadPage = spyOn(up.network, 'loadPage')

            fixture('.one')
            up.render(target: '.one', url: 'http://other-domain.com/path/to')

            next ->
              expect(loadPage).toHaveBeenCalledWith(jasmine.objectContaining(url: 'http://other-domain.com/path/to'))
              expect(jasmine.Ajax.requests.count()).toBe(0)

          it "returns an pending promise (since we do not want any callbacks to run as we're tearing down this page context)", (done) ->
            loadPage = spyOn(up.network, 'loadPage')

            fixture('.one')
            promise = up.render(target: '.one', url: 'http://other-domain.com/path/to')

            promiseState(promise).then (result) ->
              expect(result.state).toBe('pending')
              done()

      describeFallback 'canPushState', ->

        it 'loads the content in a new page', asyncSpec (next) ->
          loadPage = spyOn(up.network, 'loadPage')

          fixture('.one')
          up.render(target: '.one', url: '/path')

          next ->
            expect(loadPage).toHaveBeenCalledWith(jasmine.objectContaining(url: '/path'))
            expect(jasmine.Ajax.requests.count()).toBe(0)

        it "returns an pending promise (since we do not want any callbacks to run as we're tearing down this page context)", (done) ->
          loadPage = spyOn(up.network, 'loadPage')

          fixture('.one')
          promise = up.render(target: '.one', url: '/path')

          promiseState(promise).then (result) ->
            expect(result.state).toBe('pending')
            done()

      describe 'with { content } option', ->

        it 'replaces the given selector with a matching element that has the inner HTML from the given { content } string', asyncSpec (next) ->
          fixture('.target', text: 'old text')

          up.render('.target', content: 'new text')

          next =>
            expect('.target').toHaveText('new text')

        it 'replaces the given selector with a matching element that has the inner HTML from the given { content } element', asyncSpec (next) ->
          fixture('.target', text: 'old text')
          content = e.createFromSelector('div', text: 'new text')

          up.render('.target', { content })

          next =>
            expect('.target').toHaveText('new text')

        it 'allows to target :main', asyncSpec (next) ->
          up.layer.config.root.mainTargets.unshift('.main-element')
          fixture('.main-element', text: 'old text')

          up.render(target: ':main', content: 'new text')

          next =>
            expect('.main-element').toHaveText('new text')

        it "removes the target's inner HTML with { content: '' }", asyncSpec (next) ->
          fixture('.target', text: 'old text')

          up.render('.target', content: '')

          next =>
            expect(document.querySelector('.target').innerHTML).toBe('')

        it 'keeps the target element and only updates its children', asyncSpec (next) ->
          originalTarget = fixture('.target.klass', text: 'old text')

          up.render('.target', content: 'new text')

          next =>
            rediscoveredTarget = document.querySelector('.target')
            expect(rediscoveredTarget).toBe(originalTarget)
            expect(rediscoveredTarget).toHaveClass('klass')

        it 'does not leave <up-wrapper> elements in the DOM', asyncSpec (next) ->
          fixture('.target', text: 'old text')

          up.render('.target', content: 'new text')

          next =>
            expect('.target').toHaveText('new text')
            expect(document.querySelectorAll('up-wrapper').length).toBe(0)

        it 'has a sync effect', ->
          fixture('.target', text: 'old text')
          up.render('.target', content: 'new text')
          expect('.target').toHaveText('new text')

        it 'can append content with an :after selector', asyncSpec (next) ->
          container = fixture('.target')
          e.affix(container, '.old-child')

          up.render('.target:after', content: '<div class="new-child"></div>')

          next ->
            expect(container.innerHTML).toEqual('<div class="old-child"></div><div class="new-child"></div>')

        it 'can prepend content with an :before selector', asyncSpec (next) ->
          container = fixture('.target')
          e.affix(container, '.old-child')

          up.render('.target:before', content: '<div class="new-child"></div>')

          next ->
            expect(container.innerHTML).toEqual('<div class="new-child"></div><div class="old-child"></div>')

      describe 'with { document } option', ->

        it 'replaces the given selector with a matching element that has the outer HTML from the given { document } string', asyncSpec (next) ->
          $fixture('.before').text('old-before')
          $fixture('.middle').text('old-middle')
          $fixture('.after').text('old-after')

          document =
            """
            <div class="before">new-before</div>
            <div class="middle">new-middle</div>
            <div class="after">new-after</div>
            """

          up.render('.middle', { document })

          next ->
            expect($('.before')).toHaveText('old-before')
            expect($('.middle')).toHaveText('new-middle')
            expect($('.after')).toHaveText('old-after')

        it 'derives a selector from an element given as { target } option', asyncSpec (next) ->
          target = fixture('.target', text: 'old-text')
          document = '<div class="target">new-text</div>'
          up.render({ target, document })

          next =>
            expect('.target').toHaveText('new-text')

        it 'replaces the given selector with a matching element that has the outer HTML from the given { document } element', asyncSpec (next) ->
          fixture('.target', text: 'old text')
          element = e.createFromHTML('<div class="target">new text</div>')
          up.render('.target', { document: element })

          next =>
            expect('.target').toHaveText('new text')

        it "rejects if the selector can't be found in the given { document } string", (done) ->
          $fixture('.foo-bar')
          promise = up.render('.foo-bar', document: 'html without match')

          u.task ->
            promiseState(promise).then (result) =>
              expect(result.state).toEqual('rejected')
              expect(result.value).toMatch(/Could not find common target/i)
              done()

        it 'has a sync effect', ->
          fixture('.target', text: 'old text')
          up.render('.target', document: '<div class="target">new text</div>')
          expect('.target').toHaveText('new text')

      describe 'with { fragment } option', ->

        it 'derives target and outer HTML from the given { fragment } string', asyncSpec (next) ->
          $fixture('.before').text('old-before')
          $fixture('.middle').text('old-middle')
          $fixture('.after').text('old-after')

          fragment = '<div class="middle">new-middle</div>'

          up.render({ fragment })

          next ->
            expect($('.before')).toHaveText('old-before')
            expect($('.middle')).toHaveText('new-middle')
            expect($('.after')).toHaveText('old-after')

        it 'derives target and outer HTML from the given { fragment } element', asyncSpec (next) ->
          fixture('.target', text: 'old text')
          fragment = e.createFromHTML('<div class="target">new text</div>')
          up.render('.target', { fragment: fragment })

          next =>
            expect('.target').toHaveText('new text')

        it "rejects if the given { fragment } does not match an element on the current page", (done) ->
          $fixture('.foo-bar')
          fragment = e.createFromHTML('<div class="target">new text</div>')
          promise = up.render({ fragment })

          u.task ->
            promiseState(promise).then (result) =>
              expect(result.state).toEqual('rejected')
              expect(result.value).toMatch(/Could not find common target/i)
              done()

        it 'has a sync effect', ->
          fixture('.target', text: 'old text')
          up.render('.target', fragment: '<div class="target">new text</div>')
          expect('.target').toHaveText('new text')

        it 'can append content with an :after selector', asyncSpec (next) ->
          container = fixture('.target')
          e.affix(container, '.old-child')

          up.render('.target:after', fragment: '<div class="target"><div class="new-child"></div></div>')

          next ->
            newTarget = document.querySelector('.target')
            expect(newTarget.innerHTML).toEqual('<div class="old-child"></div><div class="new-child"></div>')

        it 'can prepend content with an :before selector', asyncSpec (next) ->
          container = fixture('.target')
          e.affix(container, '.old-child')

          up.render('.target:before', fragment: '<div class="target"><div class="new-child"></div></div>')

          next ->
            newTarget = document.querySelector('.target')
            expect(newTarget.innerHTML).toEqual('<div class="new-child"></div><div class="old-child"></div>')

      describe 'choice of target', ->

        it 'uses a selector given as { target } option', ->
          one = fixture('.one', text: 'old one')
          two = fixture('.two', text: 'old two')

          up.render({ target: '.two', content: 'new two' })

          expect('.one').toHaveText('old one')
          expect('.two').toHaveText('new two')

        it 'accepts an array of selector alternatives as { target } option', ->
          one = fixture('.one', text: 'old one')
          two = fixture('.two', text: 'old two')

          up.render({ target: ['.four', '.three', '.two', '.one'], document: '<div class="two">new two</div>' })

          expect('.one').toHaveText('old one')
          expect('.two').toHaveText('new two')

        it 'uses a selector given as first argument'

        it 'derives a selector from an element given as first argument'

        it 'uses a default target for the layer that is being updated if no other option suggests a target'

        it "ignores an element that matches the selector but also matches .up-destroying", (done) ->
          document = '<div class="foo-bar">text</div>'
          $fixture('.foo-bar.up-destroying')
          promise = up.render('.foo-bar', { document })

          u.task ->
            promiseState(promise).then (result) =>
              expect(result.state).toEqual('rejected')
              expect(result.value).toMatch(/Could not find common target/i)
              done()

        it "ignores an element that matches the selector but also has a parent matching .up-destroying", (done) ->
          document = '<div class="foo-bar">text</div>'
          $parent = $fixture('.up-destroying')
          $child = $fixture('.foo-bar').appendTo($parent)
          promise = up.render('.foo-bar', { document })

          u.task ->
            promiseState(promise).then (result) =>
              expect(result.state).toEqual('rejected')
              expect(result.value).toMatch(/Could not find common target/i)
              done()

        it 'only replaces the first element matching the selector', asyncSpec (next) ->
          document = '<div class="foo-bar">text</div>'
          $fixture('.foo-bar')
          $fixture('.foo-bar')
          up.render('.foo-bar', { document })

          next =>
            $elements = $('.foo-bar')
            expect($($elements.get(0)).text()).toEqual('text')
            expect($($elements.get(1)).text()).toEqual('')

        it 'replaces the body if asked to replace the "html" selector'

        describe 'appending and prepending', ->

          it 'prepends instead of replacing when the target has a :before pseudo-selector', asyncSpec (next) ->
            target = fixture('.target')
            e.affix(target, '.child', text: 'old')
            up.render('.target:before', document: """
              <div class='target'>
                <div class='child'>new</div>
              </div>"
              """
            )

            next ->
              children = target.querySelectorAll('.child')
              expect(children.length).toBe(2)
              expect(children[0]).toHaveText('new')
              expect(children[1]).toHaveText('old')

          it 'appends instead of replacing when the target has a :after pseudo-selector', asyncSpec (next) ->
            target = fixture('.target')
            e.affix(target, '.child', text: 'old')
            up.render('.target:after', document: """
              <div class='target'>
                <div class='child'>new</div>
              </div>
              """
            )

            next ->
              children = target.querySelectorAll('.child')
              expect(children.length).toBe(2)
              expect(children[0]).toHaveText('old')
              expect(children[1]).toHaveText('new')

          it "lets the developer choose between replacing/prepending/appending for each selector", asyncSpec (next) ->
            fixture('.before', text: 'old-before')
            fixture('.middle', text: 'old-middle')
            fixture('.after', text: 'old-after')
            up.render '.before:before, .middle, .after:after', document: """
              <div class="before">new-before</div>
              <div class="middle">new-middle</div>
              <div class="after">new-after</div>
              """
            next ->
              expect($('.before')).toHaveText('new-beforeold-before')
              expect($('.middle')).toHaveText('new-middle')
              expect($('.after')).toHaveText('old-afternew-after')

          it 'replaces multiple selectors separated with a comma', asyncSpec (next) ->
            fixture('.before', text: 'old-before')
            fixture('.middle', text: 'old-middle')
            fixture('.after', text: 'old-after')

            up.render '.middle, .after', document: """
              <div class="before">new-before</div>
              <div class="middle">new-middle</div>
              <div class="after">new-after</div>
              """

            next ->
              expect($('.before')).toHaveText('old-before')
              expect($('.middle')).toHaveText('new-middle')
              expect($('.after')).toHaveText('new-after')

        describe 'optional targets', ->

          it 'uses a target with a :maybe pseudo-selector if it is found in the response', asyncSpec (next) ->
            fixture('.foo', text: 'old foo')
            fixture('.bar', text: 'old bar')

            up.render '.foo:maybe, .bar', document: """
              <div class="foo">new foo</div>
              <div class="bar">new bar</div>
            """

            next ->
              expect('.foo').toHaveText('new foo')
              expect('.bar').toHaveText('new bar')

          it 'does not impede the render pass if the :maybe target is missing from the response', (done) ->
            fixture('.foo', text: 'old foo')
            fixture('.bar', text: 'old bar')

            promise = up.render '.foo:maybe, .bar', document: """
              <div class="bar">new bar</div>
            """

            promiseState(promise).then ({ state }) ->
              expect(state).toBe('fulfilled')
              expect('.foo').toHaveText('old foo')
              expect('.bar').toHaveText('new bar')
              done()

          it 'does not impede the render pass if the :maybe target is missing from the current page', (done) ->
            fixture('.bar', text: 'old bar')

            promise = up.render '.foo:maybe, .bar', document: """
              <div class="foo">new foo</div>
              <div class="bar">new bar</div>
            """

            promiseState(promise).then ({ state }) ->
              expect(state).toBe('fulfilled')
              expect(document).not.toHaveSelector('.foo')
              expect('.bar').toHaveText('new bar')
              done()

          it 'allows to combine :maybe and :after pseudo-selectors'

        describe 'matching old fragments around the origin', ->

          it 'prefers to match an element closest to origin', asyncSpec (next) ->
            root = fixture('.element#root')
            one = e.affix(root, '.element', text: 'old one')
            two = e.affix(root, '.element', text: 'old two')
            childOfTwo = e.affix(two, '.origin')
            three = e.affix(root, '.element', text: 'old three')

            up.render('.element', origin: childOfTwo, content: 'new text')

            next =>
              elements = document.querySelectorAll('.element')
              expect(elements.length).toBe(4)

              # While #root is an ancestor, two was closer
              expect(elements[0]).toMatchSelector('#root')

              # One is a sibling of two
              expect(elements[1]).toHaveText('old one')

              # Two is the closest match around the origin (childOfTwo)
              expect(elements[2]).toHaveText('new text')

              # Three is a sibling of three
              expect(elements[3]).toHaveText('old three')

          it 'prefers to match a descendant selector in the vicinity of the origin', asyncSpec (next) ->
            element1 = fixture('.element')
            element1Child1 = e.affix(element1, '.child',         text: 'old element1Child1')
            element1Child2 = e.affix(element1, '.child.sibling', text: 'old element1Child2')

            element2 = fixture('.element')
            element2Child1 = e.affix(element2, '.child',         text: 'old element2Child1')
            element2Child2 = e.affix(element2, '.child.sibling', text: 'old element2Child2')

            up.render('.element .sibling', origin: element2Child1, document: """
              <div class="element">
                <div class="child sibling">new text</div>
              </div>
            """)

            next =>
              children = document.querySelectorAll('.child')

              expect(children.length).toBe(4)

              expect(children[0]).toHaveText('old element1Child1')
              expect(children[1]).toHaveText('old element1Child2')

              expect(children[2]).toHaveText('old element2Child1')
              expect(children[3]).toHaveText('new text')

          it 'allows ambiguous target derivation if it becomes clear given an origin', asyncSpec (next) ->
            root = fixture('.element#root')
            one = e.affix(root, '.element', text: 'old one')
            two = e.affix(root, '.element', text: 'old two')
            childOfTwo = e.affix(two, '.origin')
            three = e.affix(root, '.element', text: 'old three')

            up.render(two, origin: childOfTwo, content: 'new text')

            next =>
              elements = document.querySelectorAll('.element')
              expect(elements.length).toBe(4)

              # While #root is an ancestor, two was closer
              expect(elements[0]).toMatchSelector('#root')

              # One is a sibling of two
              expect(elements[1]).toHaveText('old one')

              # Two is the closest match around the origin (childOfTwo)
              expect(elements[2]).toHaveText('new text')

              # Three is a sibling of three
              expect(elements[3]).toHaveText('old three')

          it 'rediscovers the { origin } in the new content and prefers matching an element closest to the rediscovered origin', ->
            root = fixture('.element#root')
            one = e.affix(root, '.element', text: 'old one')
            two = e.affix(root, '.element', text: 'old two')
            childOfTwo = e.affix(two, '.origin')
            three = e.affix(root, '.element', text: 'old three')

            newHTML = root.outerHTML.replace(/old/g, 'new')

            up.render('.element', origin: childOfTwo, document: newHTML)

            elements = document.querySelectorAll('.element')
            expect(elements.length).toBe(4)

            # While #root is an ancestor, two was closer
            expect(elements[0]).toMatchSelector('#root')

            # One is a sibling of two
            expect(elements[1]).toHaveText('old one')

            # Two is the closest match around the origin (childOfTwo)
            expect(elements[2]).toHaveText('new two')

            # Three is a sibling of three
            expect(elements[3]).toHaveText('old three')

          it 'uses the first match in the new content if the { origin } cannot be rediscovered in the new content', ->
            root = fixture('#root')
            one = e.affix(root, '.element', text: 'old one')
            two = e.affix(root, '.element', text: 'old two')
            childOfTwo = e.affix(two, '.origin')
            three = e.affix(root, '.element', text: 'old three')

            newHTML = root.outerHTML.replace(/old/g, 'new').replace('origin', 'not-origin')

            up.render('.element', origin: childOfTwo, document: newHTML)

            elements = document.querySelectorAll('.element')

            expect(elements.length).toBe(3)

            # In the old content we could find a match oround the origin, so we're changing "two".
            # We could not rediscover the origin in the new content, so the first match ("one") is used.
            expect(elements[0]).toHaveText('old one')
            expect(elements[1]).toHaveText('new one')
            expect(elements[2]).toHaveText('old three')

#          it 'considers an Element argument to be the origin if no { origin } is given', asyncSpec (next) ->
#            root = fixture('.element#root')
#            one = e.affix(root, '.element', text: 'old one')
#            two = e.affix(root, '.element', text: 'old two')
#            three = e.affix(root, '.element', text: 'old three')
#
#            up.render(two, content: 'new text')
#
#            next =>
#              elements = document.querySelectorAll('.element')
#              expect(elements.length).toBe(4)
#
#              # While #root is an ancestor, two was closer
#              expect(elements[0]).toMatchSelector('#root')
#
#              # One is a sibling of two
#              expect(elements[1]).toHaveText('old one')
#
#              # Two is the closest match around the origin (childOfTwo)
#              expect(elements[2]).toHaveText('new text')
#
#              # Three is a sibling of three
#              expect(elements[3]).toHaveText('old three')


        describe 'non-standard selector extensions', ->

          describe ':has()', ->

            it 'matches elements with a given descendant', asyncSpec (next) ->
              $first = $fixture('.boxx#first')
              $firstChild = $('<span class="first-child">old first</span>').appendTo($first)
              $second = $fixture('.boxx#second')
              $secondChild = $('<span class="second-child">old second</span>').appendTo($second)

              promise = up.navigate('.boxx:has(.second-child)', url: '/path')

              next =>
                @respondWith """
                  <div class="boxx" id="first">
                    <span class="first-child">new first</span>
                  </div>
                  <div class="boxx" id="second">
                    <span class="second-child">new second</span>
                  </div>
                  """
                next.await(promise)

              next =>
                expect($('#first span')).toHaveText('old first')
                expect($('#second span')).toHaveText('new second')

          describe ':layer', ->

            it 'matches the first swappable element in a layer', asyncSpec (next) ->
              up.render(':layer', url: '/path')

              next =>
                expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('body')

          describe ':main', ->

            it 'matches a main selector in a layer', asyncSpec (next) ->
              main = fixture('.main-element')
              up.layer.config.root.mainTargets = ['.main-element']
              up.render(':main', url: '/path')

              next =>
                expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.main-element')

          describe ':none', ->

            it 'contacts the server but does not update any fragment', asyncSpec (next) ->
              fixture('.one', text: 'old one')
              fixture('.two', text: 'old two')

              promise = up.render(target: ':none', url: '/path')

              next =>
                expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual(':none')
                @respondWith(responseText: '', contentType: 'text/plain')

              next ->
                expect('.one').toHaveText('old one')
                expect('.two').toHaveText('old two')

                next.await promiseState(promise)

              next (result) ->
                expect(result.state).toBe('fulfilled')

        describe 'merging of nested selectors', ->

          it 'replaces a single fragment if a selector contains a subsequent selector in the current page', asyncSpec (next) ->
            $outer = $fixture('.outer').text('old outer text')
            $inner = $outer.affix('.inner').text('old inner text')

            replacePromise = up.render('.outer, .inner', url: '/path')

            next =>
              expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.outer')

              @respondWith """
                <div class="outer">
                  new outer text
                  <div class="inner">
                    new inner text
                  </div>
                </div>
                """

            next =>
              expect($('.outer')).toBeAttached()
              expect($('.outer').text()).toContain('new outer text')
              expect($('.inner')).toBeAttached()
              expect($('.inner').text()).toContain('new inner text')

            next.await =>
              promise = promiseState(replacePromise)
              promise.then (result) => expect(result.state).toEqual('fulfilled')

          it 'replaces a single fragment if a selector is contained by a subsequent selector in the current page', asyncSpec (next) ->
            $outer = $fixture('.outer').text('old outer text')
            $inner = $outer.affix('.inner').text('old inner text')

            replacePromise = up.render('.inner, .outer', url: '/path')

            next =>
              expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.outer')

              @respondWith """
                <div class="outer">
                  new outer text
                  <div class="inner">
                    new inner text
                  </div>
                </div>
                """

            next =>
              expect($('.outer')).toBeAttached()
              expect($('.outer').text()).toContain('new outer text')
              expect($('.inner')).toBeAttached()
              expect($('.inner').text()).toContain('new inner text')

            next.await =>
              promise = promiseState(replacePromise)
              promise.then (result) => expect(result.state).toEqual('fulfilled')

          it 'does not merge selectors if a selector contains a subsequent selector, but prepends instead of replacing', asyncSpec (next) ->
            $outer = $fixture('.outer').text('old outer text')
            $inner = $outer.affix('.inner').text('old inner text')

            replacePromise = up.render('.outer:before, .inner', url: '/path')

            next =>
              # Placement pseudo-selectors are removed from X-Up-Target
              expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.outer, .inner')

              @respondWith """
                <div class="outer">
                  new outer text
                  <div class="inner">
                    new inner text
                  </div>
                </div>
                """

            next =>
              expect($('.outer')).toBeAttached()
              expect($('.outer').text()).toContain('new outer text')
              expect($('.outer').text()).toContain('old outer text')
              expect($('.inner')).toBeAttached()
              expect($('.inner').text()).toContain('new inner text')

            next.await =>
              promise = promiseState(replacePromise)
              promise.then (result) => expect(result.state).toEqual('fulfilled')

          it 'does not merge selectors if a selector contains a subsequent selector, but appends instead of replacing', asyncSpec (next) ->
            $outer = $fixture('.outer').text('old outer text')
            $inner = $outer.affix('.inner').text('old inner text')

            replacePromise = up.render('.outer:after, .inner', url: '/path')

            next =>
              expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.outer, .inner')

              @respondWith """
                <div class="outer">
                  new outer text
                  <div class="inner">
                    new inner text
                  </div>
                </div>
                """

            next =>
              expect($('.outer')).toBeAttached()
              expect($('.outer').text()).toContain('old outer text')
              expect($('.outer').text()).toContain('new outer text')
              expect($('.inner')).toBeAttached()
              expect($('.inner').text()).toContain('new inner text')

            next.await =>
              promise = promiseState(replacePromise)
              promise.then (result) => expect(result.state).toEqual('fulfilled')

  #          it 'does not lose selector pseudo-classes when merging selectors (bugfix)', asyncSpec (next) ->
  #            $outer = $fixture('.outer').text('old outer text')
  #            $inner = $outer.affix('.inner').text('old inner text')
  #
  #            replacePromise = up.render('.outer:after, .inner', url: '/path')
  #
  #            next =>
  #              expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.outer:after, .inner')

          it 'replaces a single fragment if a selector contains a previous selector in the current page', asyncSpec (next) ->
            $outer = $fixture('.outer').text('old outer text')
            $inner = $outer.affix('.inner').text('old inner text')

            replacePromise = up.render('.outer, .inner', url: '/path')

            next =>
              expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.outer')

              @respondWith """
                <div class="outer">
                  new outer text
                  <div class="inner">
                    new inner text
                  </div>
                </div>
                """

            next =>
              expect($('.outer')).toBeAttached()
              expect($('.outer').text()).toContain('new outer text')
              expect($('.inner')).toBeAttached()
              expect($('.inner').text()).toContain('new inner text')

            next.await =>
              promise = promiseState(replacePromise)
              promise.then (result) => expect(result.state).toEqual('fulfilled')

          it 'does not lose a { scroll } option if the first selector was merged into a subsequent selector', asyncSpec (next) ->
            revealStub = spyOn(up, 'reveal').and.returnValue(Promise.resolve())

            $outer = $fixture('.outer').text('old outer text')
            $inner = $outer.affix('.inner').text('old inner text')

            up.render('.inner, .outer', url: '/path', scroll: '.revealee')

            next =>
              expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.outer')

              @respondWith """
                <div class="outer">
                  new outer text
                  <div class="inner">
                    new inner text
                    <div class="revealee">
                      revealee text
                    </div>
                  </div>
                </div>
                """

            next =>
              expect($('.outer')).toBeAttached()
              expect($('.outer').text()).toContain('new outer text')
              expect($('.inner')).toBeAttached()
              expect($('.inner').text()).toContain('new inner text')

              expect(revealStub).toHaveBeenCalled()
              revealArg = revealStub.calls.mostRecent().args[0]
              expect(revealArg).toMatchSelector('.revealee')

          it 'replaces a single fragment if the nesting differs in current page and response', asyncSpec (next) ->
            $outer = $fixture('.outer').text('old outer text')
            $inner = $outer.affix('.inner').text('old inner text')

            replacePromise = up.render('.outer, .inner', url: '/path')

            next =>
              @respondWith """
                <div class="inner">
                  new inner text
                  <div class="outer">
                    new outer text
                  </div>
                </div>
                """

            next =>
              expect($('.outer')).toBeAttached()
              expect($('.outer').text()).toContain('new outer text')
              expect($('.inner')).not.toBeAttached()

            next.await =>
              promise = promiseState(replacePromise)
              promise.then (result) => expect(result.state).toEqual('fulfilled')

          it 'does not crash if two selectors that are siblings in the current page are nested in the response', asyncSpec (next) ->
            $outer = $fixture('.one').text('old one text')
            $inner = $fixture('.two').text('old two text')

            replacePromise = up.render('.one, .two', url: '/path')

            next =>
              @respondWith """
                <div class="one">
                  new one text
                  <div class="two">
                    new two text
                  </div>
                </div>
                """

            next =>
              expect($('.one')).toBeAttached()
              expect($('.one').text()).toContain('new one text')
              expect($('.two')).toBeAttached()
              expect($('.two').text()).toContain('new two text')

            next.await =>
              promise = promiseState(replacePromise)
              promise.then (result) => expect(result.state).toEqual('fulfilled')

          it 'does not crash if selectors that siblings in the current page are inversely nested in the response', asyncSpec (next) ->
            $outer = $fixture('.one').text('old one text')
            $inner = $fixture('.two').text('old two text')

            replacePromise = up.render('.one, .two', url: '/path')

            next =>
              @respondWith """
                <div class="two">
                  new two text
                  <div class="one">
                    new one text
                  </div>
                </div>
                """

            next =>
              expect($('.one')).toBeAttached()
              expect($('.one').text()).toContain('new one text')
              expect($('.two')).toBeAttached()
              expect($('.two').text()).toContain('new two text')

            next.await =>
              promise = promiseState(replacePromise)
              promise.then (result) => expect(result.state).toEqual('fulfilled')

          it 'updates the first selector if the same element is targeted twice in a single replacement', asyncSpec (next) ->
            $one = $fixture('.one.alias').text('old one text')

            replacePromise = up.render('.one, .alias', url: '/path')

            next =>
              expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.one')

              @respondWith """
                <div class="one">
                  new one text
                </div>
                """

            next =>
              expect($('.one')).toBeAttached()
              expect($('.one').text()).toContain('new one text')

            next.await =>
              promise = promiseState(replacePromise)
              promise.then (result) => expect(result.state).toEqual('fulfilled')

          it 'updates the first selector if the same element is prepended or appended twice in a single replacement', asyncSpec (next) ->
            $one = $fixture('.one').text('old one text')

            replacePromise = up.render('.one:before, .one:after', url: '/path')

            next =>
              # Placement pseudo-selectors are removed from X-Up-Target
              expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.one')

              @respondWith """
                <div class="one">
                  new one text
                </div>
                """

            next =>
              expect($('.one')).toBeAttached()
              expect($('.one').text()).toMatchText('new one text old one text')

            next.await =>
              promise = promiseState(replacePromise)
              promise.then (result) => expect(result.state).toEqual('fulfilled')

          it "updates the first selector if the same element is prepended, replaced and appended in a single replacement", asyncSpec (next) ->
            $elem = $fixture('.elem.alias1.alias2').text("old text")

            replacePromise = up.render('.elem:before, .alias1, .alias2:after', url: '/path')

            next =>
              # Placement pseudo-selectors are removed from X-Up-Target
              expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.elem')

              @respondWith """
                <div class="elem alias1 alias2">
                  new text
                </div>
                """

            next =>
              expect('.elem').toBeAttached()
              expect($('.elem').text()).toMatchText('new text old text')

            next.await =>
              promise = promiseState(replacePromise)
              promise.then (result) => expect(result.state).toEqual('fulfilled')

          describe 'when selectors are missing on the page before the request was made', ->

            beforeEach ->
              # In helpers/protect_jasmine_runner wie have configured <default-fallback>
              # as a default target for all layers.
              up.layer.config.any.mainTargets = []

            it 'tries selectors from options.fallback before making a request', asyncSpec (next) ->
              $fixture('.box').text('old box')
              up.render('.unknown', url: '/path', fallback: '.box')

              next => @respondWith '<div class="box">new box</div>'
              next => expect('.box').toHaveText('new box')

            it 'rejects the promise if all alternatives are exhausted', (done) ->
              promise = up.render('.unknown', url: '/path', fallback: '.more-unknown')

              u.task ->
                promiseState(promise).then (result) ->
                  expect(result.state).toEqual('rejected')
                  expect(result.value).toBeError(/Could not find target in current page/i)
                  done()

            it 'considers a union selector to be missing if one of its selector-atoms are missing', asyncSpec (next) ->
              $fixture('.target').text('old target')
              $fixture('.fallback').text('old fallback')
              up.render('.target, .unknown', url: '/path', fallback: '.fallback')

              next =>
                @respondWith """
                  <div class="target">new target</div>
                  <div class="fallback">new fallback</div>
                """

              next =>
                expect('.target').toHaveText('old target')
                expect('.fallback').toHaveText('new fallback')

            it "tries the layer's main target with { fallback: true }", asyncSpec (next) ->
              up.layer.config.any.mainTargets = ['.existing']
              $fixture('.existing').text('old existing')
              up.render('.unknown', url: '/path', fallback: true)
              next => @respondWith '<div class="existing">new existing</div>'
              next => expect('.existing').toHaveText('new existing')

            it "does not try the layer's default targets and rejects the promise with { fallback: false }", (done) ->
              up.layer.config.any.mainTargets = ['.existing']
              $fixture('.existing').text('old existing')
              up.render('.unknown', url: '/path', fallback: false).catch (e) ->
                expect(e).toBeError(/Could not find target in current page/i)
                done()

        describe 'when selectors are missing on the page after the request was made', ->

          beforeEach ->
            up.layer.config.any.mainTargets = []

          it 'tries the selector in options.fallback before swapping elements', asyncSpec (next) ->
            $target = $fixture('.target').text('old target')
            $fallback = $fixture('.fallback').text('old fallback')
            up.render('.target', url: '/path', fallback: '.fallback')
            $target.remove()

            next =>
              @respondWith """
                <div class="target">new target</div>
                <div class="fallback">new fallback</div>
              """

            next =>
              expect('.fallback').toHaveText('new fallback')

          it 'rejects the promise if all alternatives are exhausted', (done) ->
            $target = $fixture('.target').text('old target')
            $fallback = $fixture('.fallback').text('old fallback')
            promise = up.render('.target', url: '/path', fallback: '.fallback')

            u.task =>
              $target.remove()
              $fallback.remove()

              @respondWith """
                <div class="target">new target</div>
                <div class="fallback">new fallback</div>
              """

              u.task =>
                promiseState(promise).then (result) ->
                  expect(result.state).toEqual('rejected')
                  expect(result.value).toBeError(/Could not find common target/i)
                  done()

          it 'considers a union selector to be missing if one of its selector-atoms are missing', asyncSpec (next) ->
            $target = $fixture('.target').text('old target')
            $target2 = $fixture('.target2').text('old target2')
            $fallback = $fixture('.fallback').text('old fallback')
            up.render('.target, .target2', url: '/path', fallback: '.fallback')
            $target2.remove()

            next =>
              @respondWith """
                <div class="target">new target</div>
                <div class="target2">new target2</div>
                <div class="fallback">new fallback</div>
              """
            next =>
              expect('.target').toHaveText('old target')
              expect('.fallback').toHaveText('new fallback')

          it "tries the layer's default targets with { fallback: true }", asyncSpec (next) ->
            up.layer.config.any.mainTargets = ['.fallback']
            $target = $fixture('.target').text('old target')
            $fallback = $fixture('.fallback').text('old fallback')
            up.render('.target', url: '/path', fallback: true)
            $target.remove()

            next =>
              @respondWith """
                <div class="target">new target</div>
                <div class="fallback">new fallback</div>
              """

            next =>
              expect('.fallback').toHaveText('new fallback')

          it "does not try the layer's default targets and rejects the promise if options.fallback is false", (done) ->
            up.layer.config.any.fallbacks = ['.fallback']
            $target = $fixture('.target').text('old target')
            $fallback = $fixture('.fallback').text('old fallback')
            promise = up.render('.target', url: '/path', fallback: false)

            u.task =>
              $target.remove()

              @respondWith """
                <div class="target">new target</div>
                <div class="fallback">new fallback</div>
              """

              promise.catch (e) ->
                expect(e).toBeError(/Could not find common target/i)
                done()

        describe 'when selectors are missing in the response', ->

          beforeEach ->
            up.layer.config.any.mainTargets = []

          it "tries the selector in options.fallback before swapping elements", asyncSpec (next) ->
            $target = $fixture('.target').text('old target')
            $fallback = $fixture('.fallback').text('old fallback')
            up.render('.target', url: '/path', fallback: '.fallback')

            next =>
              @respondWith """
                <div class="fallback">new fallback</div>
              """

            next =>
              expect('.target').toHaveText('old target')
              expect('.fallback').toHaveText('new fallback')

          it "replaces the layer's main target with { fallback: true }", asyncSpec (next) ->
            up.layer.config.root.mainTargets = ['.default']
            fixture('.target', text: 'old target text')
            fixture('.default', text: 'old fallback text')

            next =>
              up.render('.target', url: '/path', fallback: true)
            next =>
              @respondWithSelector('.default', text: 'new fallback text', status: 500)
            next =>
              expect('.target').toHaveText('old target text')
              expect('.default').toHaveText('new fallback text')

          describe 'if all alternatives are exhausted', ->

            it 'rejects the promise', (done) ->
              $target = $fixture('.target').text('old target')
              $fallback = $fixture('.fallback').text('old fallback')
              promise = up.render('.target', url: '/path', fallback: '.fallback')

              u.task =>
                @respondWith '<div class="unexpected">new unexpected</div>'

              promise.catch (e) ->
                expect(e).toBeError(/Could not find common target/i)
                done()

          it 'considers a union selector to be missing if one of its selector-atoms are missing', asyncSpec (next) ->
            $target = $fixture('.target').text('old target')
            $target2 = $fixture('.target2').text('old target2')
            $fallback = $fixture('.fallback').text('old fallback')
            up.render('.target, .target2', url: '/path', fallback: '.fallback')

            next =>
              @respondWith """
                <div class="target">new target</div>
                <div class="fallback">new fallback</div>
              """

            next =>
              expect('.target').toHaveText('old target')
              expect('.target2').toHaveText('old target2')
              expect('.fallback').toHaveText('new fallback')

          it "tries the layer's default targets with { fallback: true }", asyncSpec (next) ->
            up.layer.config.any.mainTargets = ['.fallback']
            $target = $fixture('.target').text('old target')
            $fallback = $fixture('.fallback').text('old fallback')
            up.render('.target', url: '/path', fallback: true)

            next =>
              @respondWith '<div class="fallback">new fallback</div>'

            next =>
              expect('.target').toHaveText('old target')
              expect('.fallback').toHaveText('new fallback')

          it "does not try the layer's default targets and rejects the promise with { fallback: false }", (done) ->
            up.layer.config.any.mainTargets = ['.fallback']
            $target = $fixture('.target').text('old target')
            $fallback = $fixture('.fallback').text('old fallback')
            promise = up.render('.target', url: '/path', fallback: false)

            u.task =>
              @respondWith '<div class="fallback">new fallback</div>'

            promise.catch (e) ->
              expect(e).toBeError(/Could not find common target/i)
              done()

      describe 'choice of layer', ->

        it 'updates the layer given as { layer } option', ->
          makeLayers [
            { target: '.element', content: 'old text in root' }
            { target: '.element', content: 'old text in modal' }
          ]

          up.render('.element', content: 'new text', layer: 'root', peel: false)

          expect(up.layer.get(0)).toHaveText(/new text/)
          expect(up.layer.get(1)).toHaveText(/old text in modal/)

        it 'updates the layer of the given target, if the target is given as an element (and not a selector)', ->
          makeLayers [
            { target: '.element', content: 'old text in root' }
            { target: '.element', content: 'old text in overlay 1' }
            { target: '.element', content: 'old text in overlay 2' }
          ]

          up.render(up.layer.get(1), content: 'new text in overlay 1')

          expect(up.layer.get(0)).toHaveText(/old text in root/)
          expect(up.layer.get(1)).toHaveText('old text in overlay 1')
          expect(up.layer.get(2)).toHaveText('old text in overlay 2')

        describe 'stacking a new overlay', ->

          it 'opens a new layer when given { layer: "new" }', ->
            up.render('.element', content: 'new text', layer: 'new')

            expect(up.layer.count).toBe(2)
            expect(up.layer.current).toHaveText('new text')

          it 'returns a promise with an up.RenderResult that contains information about the updated fragments and layer', (done) ->
            promise = up.render('.overlay-element', content: 'new text', layer: 'new')

            promise.then (result) ->
              expect(up.layer.count).toBe(2)
              expect(result.fragments).toEqual([up.fragment.get('.overlay-element')])
              expect(result.layer).toBe(up.layer.current)
              done()

          it 'allows to pass the mode for the new layer as { layer: "new $MODE" } (as a shortcut)', ->
            up.render('.element', content: 'new text', layer: 'new drawer')

            expect(up.layer.current.mode).toEqual('drawer')

          it 'opens a new layer if given a { mode } but no { layer }', ->
            up.render('.element', content: 'new text', mode: 'drawer')

            expect(up.layer.count).toBe(2)
            expect(up.layer.current.mode).toEqual('drawer')
            expect(up.layer.current).toHaveText('new text')

        describe 'with { layer: "swap" }', ->

          it 'replaces the current overlay with the new overlay', ->
            makeLayers(2)

            expect(up.layer.count).toBe(2)
            expect(up.layer.current.mode).toEqual('modal')

            up.render('.element', content: 'new text', layer: 'swap', mode: 'drawer')

            expect(up.layer.count).toBe(2)
            expect(up.layer.current.mode).toEqual('drawer')
            expect(up.layer.current).toHaveText('new text')

          it 'opens a new overlay if no overlay is open', ->
            expect(up.layer.count).toBe(1)

            up.render('.element', content: 'new text', layer: 'swap', mode: 'drawer')

            expect(up.layer.count).toBe(2)
            expect(up.layer.current.mode).toEqual('drawer')
            expect(up.layer.current).toHaveText('new text')

        describe 'with { layer: "shatter" }', ->

          it 'replaces all existing overlays with the new overlay', ->
            makeLayers(3)

            expect(up.layer.count).toBe(3)
            expect(up.layer.current.mode).toEqual('modal')

            up.render('.element', content: 'new text', layer: 'shatter', mode: 'drawer')

            expect(up.layer.count).toBe(2)
            expect(up.layer.current.mode).toEqual('drawer')
            expect(up.layer.current).toHaveText('new text')

          it 'opens a new overlay if no overlay is open', ->
            expect(up.layer.count).toBe(1)

            up.render('.element', content: 'new text', layer: 'shatter', mode: 'drawer')

            expect(up.layer.count).toBe(2)
            expect(up.layer.current.mode).toEqual('drawer')
            expect(up.layer.current).toHaveText('new text')

        describe 'if nothing else is specified', ->

          it 'updates the current layer', ->
            makeLayers [
              { target: '.element', content: 'old text in root' }
              { target: '.element', content: 'old text in modal' }
            ]

            up.render('.element', content: 'new text', peel: false)

            expect(up.layer.get(0)).toHaveText(/old text in root/)
            expect(up.layer.get(1)).toHaveText(/new text/)

          it 'rejects if the current layer does not match', asyncSpec (next) ->
            makeLayers [
              { target: '.element', content: 'old text in root' }
              { target: '.other', content: 'old text in modal1' }
            ]

            promise = up.render('.element', content: 'new text')

            next ->
              next.await promiseState(promise)

            next (result) ->
              expect(result.state).toBe('rejected')

        describe 'if the given layer does not exist', ->

          it 'rejects the change', (done) ->
            fixture('.element', text: 'old text')
            promise = up.render('.element', layer: 'parent', content: 'new text')

            u.task ->
              promiseState(promise).then (result) ->
                expect(result.state).toEqual('rejected')
                expect(result.value).toMatch(/layer parent does not exist/i)
                expect('.element').toHaveText(/old text/)
                done()

          it 'updates the next layer in a space-separated list of alternative layer names', (done) ->
            fixture('.element', text: 'old text')
            promise = up.render('.element', layer: 'parent root', content: 'new text')

            u.task ->
              promiseState(promise).then (result) ->
                expect(result.state).toEqual('fulfilled')
                expect('.element').toHaveText(/new text/)
                done()

          it 'updates the next layer in an "or"-separated list of alternative layer names', (done) ->
            fixture('.element', text: 'old text')
            promise = up.render('.element', layer: 'parent or root', content: 'new text')

            u.task ->
              promiseState(promise).then (result) ->
                expect(result.state).toEqual('fulfilled')
                expect('.element').toHaveText(/new text/)
                done()

      describe 'with { history } option', ->

        beforeEach ->
          up.history.config.enabled = true

        describe 'browser location', ->

          it 'sets the browser location to the requested URL', asyncSpec (next) ->
            fixture('.target')
            promise = up.render('.target', url: '/path', history: true)
            next =>
              @respondWithSelector('.target')
              next.await(promise)
            next =>
              expect(location.href).toMatchURL('/path')

          it 'does not add a history entry after non-GET requests', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path', method: 'post', history: true)
            next => @respondWithSelector('.target')
            next => expect(location.href).toMatchURL(@locationBeforeExample)

          it "detects a redirect's new URL when the server sets an X-Up-Location header", asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path', history: true)
            next => @respondWithSelector('.target', responseHeaders: { 'X-Up-Location': '/other-path' })
            next => expect(location.href).toMatchURL('/other-path')

          it "preserves the #hash when the server sets an X-Up-Location header (like a vanilla form submission would do in the browser)", asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path#hash', history: true)
            next => @respondWithSelector('.target', responseHeaders: { 'X-Up-Location': '/other-path' })
            next => expect(location.href).toMatchURL('/other-path#hash')

          it 'adds a history entry after non-GET requests if the response includes a { X-Up-Method: "get" } header (will happen after a redirect)', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/requested-path', method: 'post', history: true)
            next =>
              @respondWithSelector('.target', {
                responseHeaders: {
                  'X-Up-Method': 'GET'
                  'X-Up-Location': '/signaled-path'
                }})
            next =>
              expect(location.href).toMatchURL('/signaled-path')

          it 'does add a history entry after a failed GET-request (since that is reloadable)', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path', method: 'post', failTarget: '.target', history: true)
            next => @respondWithSelector('.target', status: 500)
            next => expect(location.href).toMatchURL(@locationBeforeExample)

          it 'does not add a history entry with { history: false } option', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path', history: false)
            next => @respondWithSelector('.target')
            next => expect(location.href).toMatchURL(@locationBeforeExample)

          it 'does not add a history entry without a { history } option', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path')
            next => @respondWithSelector('.target')
            next => expect(location.href).toMatchURL(@locationBeforeExample)

          it 'adds params from a { params } option to the URL of a GET request', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path', params: { 'foo-key': 'foo value', 'bar-key': 'bar value' }, history: true)
            next => @respondWithSelector('.target')
            next => expect(location.href).toMatchURL('/path?foo-key=foo%20value&bar-key=bar%20value')

          it 'does not add a history entry with { history: false } option (which also prevents updating of window title)', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path', history: false)
            next => @respondWithSelector('.target')
            next => expect(location.href).toMatchURL(@locationBeforeExample)

          it 'does not add a history entry with { location: false } option', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path', location: false)
            next => @respondWithSelector('.target')
            next => expect(location.href).toMatchURL(@locationBeforeExample)

          describe 'with { history: "auto" }', ->

            it 'adds an history entry when updating a main target', asyncSpec (next) ->
              up.fragment.config.mainTargets = ['.target']
              fixture('.target')
              promise = up.render('.target', url: '/path3', history: 'auto')

              next =>
                @respondWithSelector('.target')
                next.await(promise)
              next =>
                expect(location.href).toMatchURL('/path3')

            it 'allows to configure auto-history targets that are not a main target', asyncSpec (next) ->
              up.fragment.config.autoHistoryTargets = ['.target']
              expect(up.fragment.config.mainTargets).not.toContain('.target')

              fixture('.target')
              promise = up.render('.target', url: '/path3-2', history: 'auto')

              next =>
                @respondWithSelector('.target')
                next.await(promise)
              next =>
                expect(location.href).toMatchURL('/path3-2')

            it 'adds an history entry when updating a fragment that contains a main target', asyncSpec (next) ->
              up.fragment.config.mainTargets = ['.target']
              container = fixture('.container')
              e.affix(container, '.target')
              promise = up.render('.container', url: '/path3-1', history: 'auto')

              next =>
                @respondWithSelector('.container .target')
                next.await(promise)
              next =>
                expect(location.href).toMatchURL('/path3-1')

            it 'does not add an history entry when updating a non-main targets', asyncSpec (next) ->
              up.fragment.config.mainTargets = ['.other']
              fixture('.target')
              promise = up.render('.target', url: '/path4', history: 'auto')

              next =>
                @respondWithSelector('.target')
                next.await(promise)
              next =>
                expect(location.href).toMatchURL(@locationBeforeExample)

            it 'adds a history when at least fragment of a multi-fragment update is a main target', asyncSpec (next) ->
              up.fragment.config.mainTargets = ['.bar']
              fixture('.foo')
              fixture('.bar')
              fixture('.baz')
              promise = up.render('.foo, .bar, .baz', url: '/path4', history: 'auto')

              next =>
                @respondWith """
                  <div class='foo'></div>
                  <div class='bar'></div>
                  <div class='baz'></div>
                """
                next.await(promise)
              next =>
                expect(location.href).toMatchURL('/path4')

          describe 'when a string is passed as { location } option', ->

            it 'uses that URL as the new location after a GET request', asyncSpec (next) ->
              fixture('.target')
              up.render('.target', url: '/path', history: true, location: '/path2')
              next => @respondWithSelector('.target')
              next =>
                expect(location.href).toMatchURL('/path2')

            it 'adds a history entry after a non-GET request', asyncSpec (next) ->
              fixture('.target')
              up.render('.target', url: '/path', method: 'post', history: true, location: '/path3')
              next => @respondWithSelector('.target')
              next => expect(location.href).toMatchURL('/path3')

            it 'does not override the response URL after a failed request', asyncSpec (next) ->
              fixture('.success-target')
              fixture('.failure-target')
              up.render('.success-target', url: '/path', history: true, location: '/path4', failLocation: true, failTarget: '.failure-target')
              next => @respondWithSelector('.failure-target', status: 500)
              next => expect(location.href).toMatchURL('/path')

            it 'overrides the response URL after a failed request when passed as { failLocation }', asyncSpec (next) ->
              fixture('.success-target')
              fixture('.failure-target')
              up.render('.success-target', url: '/path', history: true, location: '/path5', failLocation: '/path6', failTarget: '.failure-target')
              next => @respondWithSelector('.failure-target', status: 500)
              next => expect(location.href).toMatchURL('/path6')

          describe 'up:layer:location:changed event', ->

            it 'is emitted when the location changed', asyncSpec (next) ->
              history.replaceState?({}, 'original title', '/original-url')
              fixture('.target')

              listener = jasmine.createSpy('event listener')
              up.on('up:layer:location:changed', listener)

              next ->
                up.render(target: '.target', location: '/new-url', content: 'new content', history: true)

              next ->
                expect(listener.calls.argsFor(0)[0]).toBeEvent('up:layer:location:changed', { location: '/new-url' })

            it 'is not emitted when the location did not change', asyncSpec (next) ->
              listener = jasmine.createSpy('event listener')
              up.on('up:layer:location:changed', listener)

              up.layer.open(target: '.target', location: '/original-layer-url', content: 'old overlay text')

              next =>
                expect(up.layer.isOverlay()).toBe(true)
                expect(up.layer.location).toMatchURL('/original-layer-url')
                expect(listener.calls.count()).toBe(1)

              next ->
                up.render(target: '.target', location: '/original-layer-url', content: 'new overlay text', history: true)

              next ->
                expect(up.layer.current).toHaveText('new overlay text')
                expect(listener.calls.count()).toBe(1)

            it "is emitted in layers that doesn't render history", asyncSpec (next) ->
              listener = jasmine.createSpy('event listener')
              up.on('up:layer:location:changed', listener)

              up.layer.open(target: '.target', location: '/original-layer-url', history: false, content: 'old overlay text')

              next =>
                expect(up.layer.isOverlay()).toBe(true)
                # Browser location is unchanged, but the overlay still needs its internal location
                expect(location.href).toMatchURL(@locationBeforeExample)
                expect(up.layer.location).toMatchURL('/original-layer-url')

                expect(listener.calls.count()).toBe(1)

                up.render(target: '.target', location: '/next-layer-url', content: 'new overlay text', history: true)

              next =>
                # Browser location is unchanged, but the overlay still needs its internal location
                expect(location.href).toMatchURL(@locationBeforeExample)
                expect(up.layer.location).toMatchURL('/next-layer-url')

                # Listener was called again, as we're tracking changes to the layer's { location } prop
                expect(listener.calls.count()).toBe(2)

        describe 'window title', ->

          it "sets the document title to the response <title>", asyncSpec (next) ->
            $fixture('.container').text('old container text')
            up.render('.container', url: '/path', history: true)

            next =>
              @respondWith """
                <html>
                  <head>
                    <title>Title from HTML</title>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              """

            next =>
              expect($('.container')).toHaveText('new container text')
              expect(document.title).toBe('Title from HTML')

          it "sets the document title to an 'X-Up-Title' header in the response", asyncSpec (next) ->
            $fixture('.container').text('old container text')
            up.render('.container', url: '/path', history: true)

            next =>
              @respondWith
                responseHeaders:
                  'X-Up-Title': 'Title from header'
                responseText: """
                  <div class='container'>
                    new container text
                  </div>
                  """

            next =>
              expect($('.container')).toHaveText('new container text')
              expect(document.title).toBe('Title from header')

          it "prefers the X-Up-Title header to the response <title>", asyncSpec (next) ->
            $fixture('.container').text('old container text')
            up.render('.container', url: '/path', history: true)

            next =>
              @respondWith
                responseHeaders:
                  'X-Up-Title': 'Title from header'
                responseText: """
                  <html>
                    <head>
                      <title>Title from HTML</title>
                    </head>
                    <body>
                      <div class='container'>
                        new container text
                      </div>
                    </body>
                  </html>
                """

            next =>
              expect($('.container')).toHaveText('new container text')
              expect(document.title).toBe('Title from header')

          it "sets the document title to the response <title> with { location: false, title: true } options (bugfix)", asyncSpec (next) ->
            $fixture('.container').text('old container text')
            up.render('.container', url: '/path', history: true, location: false, title: true)

            next =>
              @respondWith """
                <html>
                  <head>
                    <title>Title from HTML</title>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              """

            next =>
              expect($('.container')).toHaveText('new container text')
              expect(document.title).toBe('Title from HTML')

          it 'does not update the document title if the response has a <title> tag inside an inline SVG image (bugfix)', asyncSpec (next) ->
            $fixture('.container').text('old container text')
            oldTitle = document.title
            up.render('.container', url: '/path', history: true)

            next =>
              @respondWith """
                <svg width="500" height="300" xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <title>SVG Title Demo example</title>
                    <rect x="10" y="10" width="200" height="50" style="fill:none; stroke:blue; stroke-width:1px"/>
                  </g>
                </svg>

                <div class='container'>
                  new container text
                </div>
              """

            next =>
              expect($('.container')).toHaveText('new container text')
              expect(document.title).toBe(oldTitle)

          it "does not extract the title from the response or HTTP header with { title: false }", asyncSpec (next) ->
            $fixture('.container').text('old container text')
            oldTitle = document.title
            up.render('.container', url: '/path', history: true, title: false)

            next =>
              @respondWith
                responseHeaders:
                  'X-Up-Title': 'Title from header'
                responseText: """
                <html>
                  <head>
                    <title>Title from HTML</title>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              """

            next =>
              expect(document.title).toEqual(oldTitle)

          it 'allows to pass an explicit title as { title } option', asyncSpec (next) ->
            $fixture('.container').text('old container text')
            up.render('.container', url: '/path', history: true, title: 'Title from options')

            next =>
              @respondWith """
                <html>
                  <head>
                    <title>Title from HTML</title>
                  </head>
                  <body>
                    <div class='container'>
                      new container text
                    </div>
                  </body>
                </html>
              """

            next =>
              expect($('.container')).toHaveText('new container text')
              expect(document.title).toBe('Title from options')

      describe 'fragment source', ->

        it 'remembers the source the fragment was retrieved from', asyncSpec (next) ->
          fixture('.target')
          up.render('.target', url: '/path')
          next =>
            @respondWithSelector('.target')
          next =>
            expect(up.fragment.source(e.get '.target')).toMatchURL('/path')

        it 'returns the source location without a #hash', asyncSpec (next) ->
          fixture('.target')
          up.render('.target', url: '/path#hash')
          next =>
            @respondWithSelector('.target')
          next =>
            expect(up.fragment.source(e.get '.target')).toMatchURL('/path')

        it 'keeps the previous source for a non-GET request (since that is reloadable)', asyncSpec (next) ->
          target = fixture('.target[up-source="/previous-source"]')
          up.render('.target', url: '/path', method: 'post')
          next =>
            @respondWithSelector('.target')
          next =>
            expect(up.fragment.source(e.get '.target')).toMatchURL('/previous-source')

        it 'does not overwrite an [up-source] attribute from the element HTML', asyncSpec (next) ->
          fixture('.target')
          up.render('.target', url: '/path')
          next =>
            @respondWithSelector('.target[up-source="/other"]')
          next =>
            expect(up.fragment.source(e.get '.target')).toMatchURL('/other')

        describe 'with { source } option', ->

          it 'uses that URL as the source for a GET request', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path', source: '/given-path')
            next =>
              @respondWithSelector('.target')
            next =>
              expect(up.fragment.source(e.get '.target')).toMatchURL('/given-path')

          it 'uses that URL as the source after a non-GET request', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path', method: 'post', source: '/given-path')
            next =>
              @respondWithSelector('.target')
            next =>
              expect(up.fragment.source(e.get '.target')).toMatchURL('/given-path')

          it 'ignores the option and reuses the previous source after a failed non-GET request', asyncSpec (next) ->
            target = fixture('.target[up-source="/previous-source"]')
            up.navigate('.target', url: '/path', method: 'post', source: '/given-path', failTarget: '.target')
            next =>
              @respondWithSelector('target', status: 500)
            next =>
              expect(up.fragment.source(e.get '.target')).toMatchURL('/previous-source')

      describe 'context', ->

        it "sends the layer's context along with requests pertaining to this layer as an X-Up-Context request header", asyncSpec (next) ->
          makeLayers [
            { target: '.target', context: { rootKey: 'rootValue' }},
            { target: '.target', context: { overlayKey: 'overlayValue' }}
          ]

          expect(up.layer.get(0).context).toEqual({ rootKey: 'rootValue' })
          expect(up.layer.get(1).context).toEqual({ overlayKey: 'overlayValue' })

          next ->
            up.render('.target', layer: up.layer.get(0), url: '/path1')

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Context']).toEqual(JSON.stringify({ rootKey: 'rootValue'}))

            up.render('.target', layer: up.layer.get(1), url: '/path2')

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(2)
            expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Context']).toEqual(JSON.stringify({ overlayKey: 'overlayValue'}))

        it "sends the fail layer's context as an X-Up-Fail-Context request header", asyncSpec (next) ->
          makeLayers [
            { target: '.target', context: { rootKey: 'rootValue' }},
            { target: '.target', context: { overlayKey: 'overlayValue' }}
          ]

          up.render(target: '.target', failTarget: '.target', layer: up.layer.get(0), failLayer: up.layer.get(1), url: '/path1')

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Context']).toEqual(JSON.stringify({ rootKey: 'rootValue'}))
            expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Fail-Context']).toEqual(JSON.stringify({ overlayKey: 'overlayValue'}))

        it 'lets the server update the context by responding with an X-Up-Context response header', asyncSpec (next) ->
          makeLayers [
            { target: '.target', context: { rootKey: 'rootValue' }},
            { target: '.target', context: { overlayKey: 'overlayValue' }}
          ]

          next ->
            up.render('.target', layer: up.layer.get(1), url: '/path1')

          next =>
            @respondWithSelector('.target', responseHeaders: { 'X-Up-Context': JSON.stringify({ newKey: 'newValue'})})

          next ->
            expect(up.layer.get(0).context).toEqual({ rootKey: 'rootValue' })
            expect(up.layer.get(1).context).toEqual({ overlayKey: 'overlayValue', newKey: 'newValue' })

        it 'uses updates from an X-Up-Context header for failed responses', asyncSpec (next) ->
          fixture('.success-target', text: 'success target')
          fixture('.failure-target', text: 'failure target')

          next ->
            up.render(target: '.success-target', failTarget: '.failure-target', url: '/path1')

          next =>
            @respondWithSelector('.failure-target',
              text: 'new text',
              status: 500,
              responseHeaders: { 'X-Up-Context': JSON.stringify({ newKey: 'newValue'})}
            )

          next ->
            expect('.failure-target').toHaveText('new text')
            expect(up.layer.get(0).context).toEqual({ newKey: 'newValue' })

      describe 'with { transition } option', ->

        beforeEach ->
          up.motion.config.enabled = true

        it 'morphs between the old and new element', asyncSpec (next) ->
          $fixture('.element.v1').text('version 1')
          up.render('.element',
            document: '<div class="element v2">version 2</div>',
            transition: 'cross-fade',
            duration: 200,
            easing: 'linear'
          )

          $old = undefined
          $new = undefined

          next =>
            $old = $('.element.v1')
            $new = $('.element.v2')

            expect($old).toHaveLength(1)
            expect($old).toHaveOpacity(1.0, 0.15)

            expect($new).toHaveLength(1)
            expect($new).toHaveOpacity(0.0, 0.15)

          next.after 100, =>
            expect($old).toHaveOpacity(0.5, 0.3)
            expect($new).toHaveOpacity(0.5, 0.3)

          next.after (100 + 70), =>
            expect($new).toHaveOpacity(1.0, 0.1)
            expect($old).toBeDetached()


        it 'ignores a { transition } option when replacing a singleton element like <body>', asyncSpec (next) ->
          # shouldSwapElementsDirectly() is true for body, but can't have the example replace the Jasmine test runner UI
          spyOn(up.element, 'isSingleton').and.callFake (element) -> element.matches('fake-body')

          up.fragment.config.targetDerivers.unshift('fake-body')
          $fixture('fake-body').text('old text')

          renderDone = jasmine.createSpy('render() done')
          promise = up.render(
            fragment: '<fake-body>new text</fake-bofy>',
            transition: 'cross-fade',
            duration: 200
          )
          promise.then(renderDone)

          next =>
            # See that we've already immediately swapped the element and ignored the duration of 200ms
            expect(renderDone).toHaveBeenCalled()
            expect($('fake-body').length).toEqual(1)
            expect($('fake-body')).toHaveOpacity(1.0)

        it 'marks the old fragment as .up-destroying during the transition', asyncSpec (next) ->
          $fixture('.element').text('version 1')
          up.render(
            fragment: '<div class="element">version 2</div>',
            transition: 'cross-fade',
            duration: 200
          )

          next =>
            $version1 = $('.element:contains("version 1")')
            expect($version1).toHaveLength(1)
            expect($version1).toHaveClass('up-destroying')

            $version2 = $('.element:contains("version 2")')
            expect($version2).toHaveLength(1)
            expect($version2).not.toHaveClass('up-destroying')

        # render with { transition } option
        it 'runs an { onFinished } callback after the element has been removed from the DOM', (done) ->
          $parent = $fixture('.parent')
          $element = $parent.affix('.element.v1').text('v1')

          testElementAttachment = ->
            expect($element).toBeDetached()
            done()

          up.render('.element',
            document: '<div class="element v2">v2</div>',
            transition: 'cross-fade',
            duration: 50,
            onFinished: testElementAttachment
          )

          expect($element).toBeAttached()

        it 'runs an { onFinished } callback once when updating multiple elements', asyncSpec (next) ->
          fixture('.foo')
          fixture('.bar')

          onFinishedSpy = jasmine.createSpy('onFinished spy')

          up.render('.foo, .bar',
            document: '<div class="foo"></div> <div class="bar"></div>',
            transition: 'cross-fade',
            duration: 10,
            onFinished: onFinishedSpy
          )

          next.after 200, ->
            expect(onFinishedSpy.calls.count()).toBe(1)

        it 'cancels an existing transition by instantly jumping to the last frame', asyncSpec (next) ->
          $fixture('.element.v1').text('version 1')

          up.render('.element',
            document: '<div class="element v2">version 2</div>',
            transition: 'cross-fade',
            duration: 200
          )

          next =>
            $ghost1 = $('.element:contains("version 1")')
            expect($ghost1).toHaveLength(1)
            expect($ghost1.css('opacity')).toBeAround(1.0, 0.1)

            $ghost2 = $('.element:contains("version 2")')
            expect($ghost2).toHaveLength(1)
            expect($ghost2.css('opacity')).toBeAround(0.0, 0.1)

          next =>
            up.render('.element',
              document: '<div class="element v3">version 3</div>',
              transition: 'cross-fade',
              duration: 200
            )

          next =>
            $ghost1 = $('.element:contains("version 1")')
            expect($ghost1).toHaveLength(0)

            $ghost2 = $('.element:contains("version 2")')
            expect($ghost2).toHaveLength(1)
            expect($ghost2.css('opacity')).toBeAround(1.0, 0.1)

            $ghost3 = $('.element:contains("version 3")')
            expect($ghost3).toHaveLength(1)
            expect($ghost3.css('opacity')).toBeAround(0.0, 0.1)

        it 'resolves the returned promise as soon as both elements are in the DOM and the transition has started', (done) ->
          fixture('.swapping-element', text: 'version 1')

          renderDone = up.render(
            fragment: '<div class="swapping-element">version 2</div>'
            transition: 'cross-fade'
            duration: 60
          )

          renderDone.then ->
            elements = document.querySelectorAll('.swapping-element')
            expect(elements.length).toBe(2)

            expect(elements[0]).toHaveText('version 2')
            expect(elements[0]).not.toMatchSelector('.up-destroying')

            expect(elements[1]).toHaveText('version 1')
            expect(elements[1]).toMatchSelector('.up-destroying')

            done()

        it 'runs an { onFinished } callback when the transition has finished', asyncSpec (next) ->
          fixture('.element', text: 'version 1')
          onFinished = jasmine.createSpy('onFinished callback')

          up.render(
            fragment: '<div class="element">version 2</div>'
            transition: 'cross-fade'
            duration: 60
            onFinished: onFinished
          )

          expect(onFinished).not.toHaveBeenCalled()

          next.after 20, ->
            expect(onFinished).not.toHaveBeenCalled()

          next.after 200, ->
            expect(onFinished).toHaveBeenCalled()

        it 'runs an { onFinished } callback once when appending an element', asyncSpec (next) ->
          fixture('.foo')

          onFinishedSpy = jasmine.createSpy('onFinished spy')

          up.render('.foo:after',
            document: '<div class="foo"></div>',
            transition: 'fade-in',
            duration: 10,
            onFinished: onFinishedSpy
          )

          next.after 200, ->
            expect(onFinishedSpy.calls.count()).toBe(1)

        it 'marks the old element as .up-destroying before compilers are called', asyncSpec (next) ->
          element = fixture('.element', id: 'old', text: 'old text')
          isMarkedSpy = jasmine.createSpy()
          up.compiler('.element', (element) -> isMarkedSpy(document.querySelector('.element#old').matches('.up-destroying')))
          up.render(target: '.element', document: '<div class="element" id="new">new text</div>', transition: 'cross-fade', duration: 70)
          next.after 35, ->
            expect('.element').toHaveText('new text')
            expect(isMarkedSpy).toHaveBeenCalledWith(true)

        it 'attaches the new element to the DOM before compilers are called, so they can see their parents and trigger bubbling events', asyncSpec (next) ->
          $parent = $fixture('.parent')
          $element = $parent.affix('.element').text('old text')
          spy = jasmine.createSpy('parent spy')
          up.$compiler '.element', ($element) -> spy($element.text(), $element.parent())
          up.render
            fragment: '<div class="element">new text</div>',
            transition: 'cross-fade',
            duration: 50

          next =>
            expect(spy).toHaveBeenCalledWith('new text', $parent)

        it 'reveals the new element while making the old element within the same viewport appear as if it would keep its scroll position', asyncSpec (next) ->
          $container = $fixture('.container[up-viewport]').css
            'width': '200px'
            'height': '200px'
            'overflow-y': 'scroll'
            'position': 'fixed'
            'left': 0,
            'top': 0
          $element = $fixture('.element').appendTo($container).css(height: '600px')

          $container.scrollTop(300)
          expect($container.scrollTop()).toEqual(300)

          up.render($element.get(0), transition: 'cross-fade', duration: 60000, scroll: 'target', document: """
            <div class="element" style="height: 600px"></div>
            """
          )

          next =>
            $old = $('.element.up-destroying')
            $new = $('.element:not(.up-destroying)')

            # Container is scrolled up due to { scroll: 'target' } option.
            # Since $old and $new are sitting in the same viewport with a
            # single shared scrollbar, this will make the ghost for $old jump.
            expect($container.scrollTop()).toBeAround(0, 5)

            # See that the ghost for $new is aligned with the top edge
            # of the viewport.
            expect($new.offset().top).toBeAround(0, 5)

            # The absolutized $old is shifted upwards to make it looks like it
            # was at the scroll position before we revealed $new.
            expect($old.offset().top).toBeAround(-300, 5)

        describe 'when up.morph() is called from a transition function', ->

          it "does not emit multiple replacement events (bugfix)", (done) ->
            $element = $fixture('.element').text('old content')

            transition = (oldElement, newElement, options) ->
              up.morph(oldElement, newElement, 'cross-fade', options)

            destroyedListener = jasmine.createSpy('listener to up:fragment:destroyed')
            up.on 'up:fragment:destroyed', destroyedListener
            insertedListener = jasmine.createSpy('listener to up:fragment:inserted')
            up.on 'up:fragment:inserted', insertedListener

            testListenerCalls = ->
              expect(destroyedListener.calls.count()).toBe(1)
              expect(insertedListener.calls.count()).toBe(1)
              done()

            up.render(
              fragment: '<div class="element">new content</div>',
              transition: transition,
              duration: 50,
              easing: 'linear'
              onFinished: testListenerCalls
            )

          it "does not compile the element multiple times (bugfix)", (done) ->
            $element = $fixture('.element').text('old content')

            transition = (oldElement, newElement, options) ->
              up.morph(oldElement, newElement, 'cross-fade', options)

            compiler = jasmine.createSpy('compiler')
            up.$compiler '.element', compiler

            extractDone = up.render(
              fragment: '<div class="element">new content</div>',
              transition: transition,
              duration: 50,
              easing: 'linear'
            )

            extractDone.then ->
              expect(compiler.calls.count()).toBe(1)
              done()

          it "does not call destructors multiple times (bugfix)", (done) ->
            $element = $fixture('.element').text('old content')

            transition = (oldElement, newElement, options) ->
              up.morph(oldElement, newElement, 'cross-fade', options)

            destructor = jasmine.createSpy('destructor')
            up.$compiler '.element', (element) ->
              return destructor

            up.hello($element)

            testDestructorCalls = ->
              expect(destructor.calls.count()).toBe(1)
              done()

            up.render(
              fragment: '<div class="element">new content</div>',
              transition: transition,
              duration: 50,
              easing: 'linear',
              onFinished: testDestructorCalls
            )

        describe 'when animation is disabled', ->

          beforeEach ->
            up.motion.config.enabled = false

          it 'immediately swaps the old and new elements without creating unnecessary ghosts', asyncSpec (next) ->
            $fixture('.element').text('version 1')
            up.render(
              fragment: '<div class="element">version 2</div>',
              transition: 'cross-fade',
              duration: 200
            )
            next =>
              expect($('.element')).toHaveText('version 2')
              expect($('.up-ghost')).toHaveLength(0)

          it "replaces the elements directly, since first inserting and then removing would shift scroll positions", asyncSpec (next) ->
            swapDirectlySpy = up.motion.swapElementsDirectly.mock()
            $fixture('.element').text('version 1')
            up.render(
              fragment: '<div class="element">version 2</div>',
              transition: false
            )

            next =>
              expect(swapDirectlySpy).toHaveBeenCalled()

      describe 'scrolling', ->

        mockRevealBeforeEach = ->
          beforeEach ->
            @revealedHTML = []
            @revealedText = []
            @revealOptions = {}

            @revealMock = spyOn(up, 'reveal').and.callFake (element, options) =>
              console.log("!!! mocked reveal called with %o", element)
              @revealedHTML.push element.outerHTML
              @revealedText.push element.textContent.trim()
              @revealOptions = options
              Promise.resolve()

        describe 'with { scroll: false }', ->

          mockRevealBeforeEach()

          it 'does not scroll', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path#hash', scroll: false)

            next =>
              @respondWith """
                <div class="target">
                  <div id="hash"></div>
                </div>
                """

            next =>
              expect(@revealMock).not.toHaveBeenCalled()

        describe 'with { scroll: "target" }', ->

          mockRevealBeforeEach()

          it 'scrolls to the new element that is inserted into the DOM', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path', scroll: 'target')

            next =>
              @respondWithSelector('.target', text: 'new text')

            next =>
              expect(@revealedText).toEqual ['new text']

          it 'allows to pass another selector to reveal', asyncSpec (next)->
            fixture('.target', text: 'target text')
            fixture('.other', text: 'other text')

            up.render('.target', url: '/path', scroll: '.other')

            next =>
              @respondWithSelector('.target')

            next =>
              expect(@revealedText).toEqual ['other text']

          it 'allows to refer to the replacement { origin } as "&" in the { reveal } selector', asyncSpec (next) ->
            target = fixture('.target', text: 'target text')
            origin = fixture('.origin', text: 'origin text')

            up.render('.target', url: '/path', scroll: '&', origin: origin)

            next =>
              @respondWithSelector('.target')

            next =>
              expect(@revealedText).toEqual ['origin text']

          describe 'when more than one fragment is replaced', ->

            it 'only reveals the first fragment', asyncSpec (next) ->
              fixture('.one', text: 'old one text')
              fixture('.two', text: 'old two text')
              up.render('.one, .two', url: '/path', scroll: 'target')

              next =>
                @respondWith """
                  <div class="one">new one text</div>
                  <div class="two">new two text</div>
                  """

              next =>
                expect(@revealedText).toEqual ['new one text']

          it 'reveals a new element that is being appended', asyncSpec (next) ->
            fixture('.target')
            up.render('.target:after', url: '/path', scroll: 'target')

            next =>
              @respondWithSelector('.target', text: 'new target text')

            next =>
              # Text nodes are wrapped in a up-wrapper container so we can
              # animate them and measure their position/size for scrolling.
              # This is not possible for container-less text nodes.
              expect(@revealedHTML).toEqual ['<up-wrapper>new target text</up-wrapper>']
              # Show that the wrapper is done after the insertion.
              expect($('up-wrapper')).not.toBeAttached()

          it 'reveals a new element that is being prepended', asyncSpec (next) ->
            fixture('.target')
            up.render('.target:before', url: '/path', scroll: 'target')

            next =>
              @respondWithSelector('.target', text: 'new target text')

            next =>
              # Text nodes are wrapped in a up-wrapper container so we can
              # animate them and measure their position/size for scrolling.
              # This is not possible for container-less text nodes.
              expect(@revealedHTML).toEqual ['<up-wrapper>new target text</up-wrapper>']
              # Show that the wrapper is done after the insertion.
              expect($('up-wrapper')).not.toBeAttached()

        describe 'with { scroll: "hash" }', ->

          mockRevealBeforeEach()

          it "scrolls to the top of an element with the ID the location's #hash", asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path#hash', scroll: 'hash')

            next =>
              @respondWith """
                <div class="target">
                  <div id="hash"></div>
                </div>
                """

            next =>
              expect(@revealedHTML).toEqual ['<div id="hash"></div>']
              expect(@revealOptions).toEqual jasmine.objectContaining(top: true)

          it "scrolls to the top of an <a> element with the name of that hash", asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path#three', scroll: 'hash')

            next =>
              @respondWith """
                <div class="target">
                  <a name="three"></a>
                </div>
                """

            next =>
              expect(@revealedHTML).toEqual ['<a name="three"></a>']
              expect(@revealOptions).toEqual jasmine.objectContaining(top: true)

          it "scrolls to a hash that includes a dot character ('.') (bugfix)", asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path#foo.bar', scroll: 'hash')

            next =>
              @respondWith """
                <div class="target">
                  <a name="foo.bar"></a>
                </div>
                """

            next =>
              expect(@revealedHTML).toEqual ['<a name="foo.bar"></a>']
              expect(@revealOptions).toEqual jasmine.objectContaining(top: true)

          it 'reveals multiple consecutive #hash targets with the same URL (bugfix)', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path#two', scroll: 'hash', cache: true)

            html = """
              <div class="target">
                <div id="one">one</div>
                <div id="two">two</div>
                <div id="three">three</div>
              </div>
              """

            next =>
              @respondWith(html)

            next =>
              expect(@revealedText).toEqual ['two']

              up.render('.target', url: '/path#three', scroll: 'hash', cache: true)

            next =>
              expect(@revealedText).toEqual ['two', 'three']

          it "does not scroll if there is no element with the ID of that #hash", asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path#hash', scroll: 'hash')

            next =>
              @respondWithSelector('.target')

            next =>
              expect(@revealMock).not.toHaveBeenCalled()

        describe 'with an array of { scroll } options', ->

          mockRevealBeforeEach()

          it 'tries each option until one succeeds', asyncSpec (next) ->
            fixture('.container')
            up.render('.container', scroll: ['hash', '.element', '.container'], content: "<div class='element'>element text</div>")

            next =>
              expect(@revealedText).toEqual ['element text']

        describe 'with a string of "or"-separated { scroll } options', ->

          mockRevealBeforeEach()

          it 'tries each option until one succeeds', asyncSpec (next) ->
            fixture('.container')
            up.render('.container', scroll: 'hash or .element or .container', content: "<div class='element'>element text</div>")

            next =>
              expect(@revealedText).toEqual ['element text']

        describe 'when the server responds with an error code', ->

          mockRevealBeforeEach()

          it 'ignores the { scroll } option', asyncSpec (next) ->
            fixture('.target', text: 'target text')
            fixture('.other', text: 'other text')
            fixture('.fail-target', text: 'fail-target text')
            up.render('.target', url: '/path', failTarget: '.fail-target', scroll: '.other')

            next =>
              @respondWithSelector('.fail-target', status: 500, text: 'new fail-target text')

            next =>
              expect(@revealMock).not.toHaveBeenCalled()

          it 'accepts a { failScroll } option for error responses', asyncSpec (next) ->
            fixture('.target', text: 'old target text')
            fixture('.other', text: 'other text')
            fixture('.fail-target', text: 'old fail-target text')
            up.render('.target', url: '/path', failTarget: '.fail-target', scroll: false, failScroll: '.other')

            next =>
              @respondWith
                status: 500
                responseText: """
                  <div class="fail-target">
                    new fail-target text
                  </div>
                  """

            next =>
              expect(@revealedText).toEqual ['other text']

          it 'allows to refer to the replacement { origin } as "&" in the { failScroll } selector', asyncSpec (next) ->
            $origin = $fixture('.origin').text('origin text')
            $fixture('.target').text('old target text')
            $fixture('.fail-target').text('old fail-target text')
            up.render('.target', url: '/path', failTarget: '.fail-target', scroll: false, failScroll: '&', origin: $origin[0])

            next =>
              @respondWith
                status: 500
                responseText: """
                  <div class="fail-target">
                    new fail-target text
                  </div>
                  """

            next =>
              expect(@revealedText).toEqual ['origin text']


        describe 'with { scrollBehavior } option', ->

          mockRevealBeforeEach()

          it 'animates the revealing when prepending an element', asyncSpec (next) ->
            fixture('.element', text: 'version 1')
            up.render('.element:before',
              document: '<div class="element">version 2</div>',
              scroll: 'target',
              scrollBehavior: 'smooth'
            )
            next =>
              expect(@revealOptions.scrollBehavior).toEqual('smooth')

          it 'animates the revealing when appending an element', asyncSpec (next) ->
            fixture('.element', text: 'version 1')
            up.render('.element:after',
              document: '<div class="element">version 2</div>',
              scroll: 'target',
              scrollBehavior: 'smooth'
            )
            next =>
              expect(@revealOptions.scrollBehavior).toEqual('smooth')

          it 'does not animate the revealing when swapping out an element', asyncSpec (next) ->
            fixture('.element', text: 'version 1')
            up.render('.element',
              document: '<div class="element">version 2</div>',
              scroll: 'target',
              scrollBehavior: 'smooth'
            )
            next =>
              expect(@revealOptions.scrollBehavior).toEqual('auto')

        describe 'with { scroll: "restore" } option', ->

          beforeEach ->
            up.history.config.enabled = true

          it "restores the scroll positions of the target's viewport", asyncSpec (next) ->

            $viewport = $fixture('.viewport[up-viewport] .element').css
              'height': '100px'
              'width': '100px'
              'overflow-y': 'scroll'

            respond = =>
              @respondWith
                status: 200
                contentType: 'text/html'
                responseText: '<div class="element" style="height: 300px"></div>'

            up.render('.element', url: '/foo', history: true)

            next => respond()
            next => $viewport.scrollTop(65)
            next => up.render('.element', url: '/bar', history: true)
            next => respond()
            next => $viewport.scrollTop(10)
            next => up.render('.element', url: '/foo', scroll: 'restore', history: true)
            next => respond()
            next => expect($viewport.scrollTop()).toEqual(65)

      describe 'execution of scripts', ->

        beforeEach ->
          window.scriptTagExecuted = jasmine.createSpy('scriptTagExecuted')

        describe 'inline scripts', ->

          it 'does not execute inline script tags', asyncSpec (next) ->
            fixture('.target', text: 'old text')

            up.render fragment: """
              <div class="target">
                new text
                <script type="text/javascript">
                  window.scriptTagExecuted()
                </script>
              </div>
              """

            next.after 100, =>
              expect(window.scriptTagExecuted).not.toHaveBeenCalled()
              expect(document).toHaveSelector('.target')
              expect(document).not.toHaveSelector('.target script')
              expect('.target').toHaveVisibleText('new text')

          it 'does not crash when the new fragment contains inline script tag that is followed by another sibling (bugfix)', asyncSpec (next) ->
            fixture('.target')
            up.render fragment: """
              <div class="target">
                <div>before</div>
                <script type="text/javascript">
                  window.scriptTagExecuted()
                </script>
                <div>after</div>
              </div>
              """

            next.after 100, =>
              expect(window.scriptTagExecuted).not.toHaveBeenCalled()
              expect(document).toHaveSelector('.target')
              expect(document).not.toHaveSelector('.target script')
              expect('.target').toHaveVisibleText('before after')

          describe 'with up.fragment.config.runScripts = true', ->

            it 'executes inline script tags inside the updated fragment', asyncSpec (next) ->
              up.fragment.config.runScripts = true

              fixture('.target', text: 'old text')

              up.render fragment: """
                <div class="target">
                  new text
                  <script type="text/javascript">
                    window.scriptTagExecuted()
                  </script>
                </div>
                """

              next.after 100, =>
                expect(window.scriptTagExecuted).toHaveBeenCalled()
                expect(document).toHaveSelector('.target')
                expect(document).toHaveSelector('.target script')
                expect('.target').toHaveVisibleText(/new text/)

            it 'does not execute inline script tags outside the updated fragment', asyncSpec (next) ->
              up.fragment.config.runScripts = true

              fixture('.target', text: 'old text')

              up.render target: '.target', document: """
                <div class="before">
                  <script type="text/javascript">
                    window.scriptTagExecuted()
                  </script>
                </div>
                <div class="target">
                  new text
                </div>
                """

              next.after 100, =>
                expect(window.scriptTagExecuted).not.toHaveBeenCalled()
                expect(document).toHaveSelector('.target')
                expect(document).not.toHaveSelector('.target script')
                expect('.target').toHaveVisibleText('new text')


        describe 'linked scripts', ->

          beforeEach ->
            # Add a cache-buster to each path so the browser cache is guaranteed to be irrelevant
            @linkedScriptPath = "/spec/files/linked_script.js?cache-buster=#{Math.random().toString()}"

          it 'does not execute linked scripts to prevent re-inclusion of javascript inserted before the closing body tag', asyncSpec (next) ->
            fixture('.target')
            up.render fragment: """
              <div class="target">
                <script type="text/javascript" src="#{@linkedScriptPath}"></script>
              </div>
              """

            next.after 100, =>
              expect(window.scriptTagExecuted).not.toHaveBeenCalled()
              expect(document).toHaveSelector('.target')
              expect(document).not.toHaveSelector('.target script')

          it 'executes linked scripts with up.fragment.config.runScripts = true', asyncSpec (next) ->
            up.fragment.config.runScripts = true

            fixture('.target')
            up.render fragment: """
              <div class="target">
                <script type="text/javascript" src="#{@linkedScriptPath}"></script>
              </div>
              """

            next.after 100, =>
              expect(window.scriptTagExecuted).toHaveBeenCalled()
              expect(document).toHaveSelector('.target')
              expect(document).toHaveSelector('.target script')

        describe '<noscript> tags', ->

          it 'parses <noscript> contents as text, not DOM nodes (since it will be placed in a scripting-capable browser)', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path')

            next =>
              @respondWith """
                <div class="target">
                  <noscript>
                    <img src="foo.png">
                  </noscript>
                </div>
                """

            next =>
              $noscript = $('.target noscript')
              text = $noscript.text().trim()
              expect(text).toEqual('<img src="foo.png">')

          it 'parses <noscript> contents with multiple lines as text, not DOM nodes', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path')

            next =>
              @respondWith """
                <div class="target">
                  <noscript>
                    <img src="foo.png">
                    <img src="bar.png">
                  </noscript>
                </div>
                """

            next =>
              $noscript = $('.target noscript')
              text = $noscript.text().trim()
              expect(text).toMatch(/<img src="foo\.png">\s+<img src="bar\.png">/)

          it 'parses multiple <noscript> tags in the same fragment as text, not DOM nodes', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path')

            next =>
              @respondWith """
                <div class="target">
                  <noscript>
                    <img src="foo.png">
                  </noscript>
                  <noscript>
                    <img src="bar.png">
                  </noscript>
                </div>
                """

            next =>
              $noscripts = $('.target noscript')
              expect($noscripts.length).toBe(2)
              text0 = $noscripts[0].textContent.trim()
              text1 = $noscripts[1].textContent.trim()
              expect(text0).toEqual('<img src="foo.png">')
              expect(text1).toEqual('<img src="bar.png">')

      describe 'CSP nonces', ->

        beforeEach ->
          up.protocol.config.nonceableAttributes.push('callback')

        it "rewrites nonceable callbacks to use the current page's nonce", asyncSpec (next) ->
          spyOn(up.protocol, 'cspNonce').and.returnValue('secret1')
          fixture('.target')
          up.render('.target', url: '/path')

          next ->
            jasmine.respondWith(
              responseText: '<div class="target" callback="nonce-secret2 alert()">new text</div>'
              responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-secret2'"}
            )

          next ->
            expect('.target').toHaveText('new text')
            expect('.target').toHaveAttribute('callback', "nonce-secret1 alert()")

        it "rewrites a callback's nonce it the nonce matches one of multiple script-src nonces in its own response", asyncSpec (next) ->
          spyOn(up.protocol, 'cspNonce').and.returnValue('secret1')
          fixture('.target')
          up.render('.target', url: '/path')

          next ->
            jasmine.respondWith(
              responseText: '<div class="target" callback="nonce-secret3 alert()">new text</div>'
              responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-secret2' 'self' 'nonce-secret3'"}
            )

          next ->
            expect('.target').toHaveText('new text')
            expect('.target').toHaveAttribute('callback', "nonce-secret1 alert()")

        it "does not rewrite a callback's nonce it the nonce does not match a script-src nonce in its own response", asyncSpec (next) ->
          spyOn(up.protocol, 'cspNonce').and.returnValue('secret1')
          fixture('.target')
          up.render('.target', url: '/path')

          next ->
            jasmine.respondWith(
              responseText: '<div class="target" callback="nonce-wrong alert()">new text</div>'
              responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-secret2'"}
            )

          next ->
            expect('.target').toHaveText('new text')
            expect('.target').toHaveAttribute('callback', "nonce-wrong alert()")

        it "does not rewrite a callback's nonce it the nonce only matches a style-src nonce in its own response", asyncSpec (next) ->
          spyOn(up.protocol, 'cspNonce').and.returnValue('secret1')
          fixture('.target')
          up.render('.target', url: '/path')

          next ->
            jasmine.respondWith(
              responseText: '<div class="target" callback="nonce-secret2 alert()">new text</div>'
              responseHeaders: { 'Content-Security-Policy': "style-src: 'nonce-secret2'"}
            )

          next ->
            expect('.target').toHaveText('new text')
            expect('.target').toHaveAttribute('callback', "nonce-secret2 alert()")

        it "does not rewrite a callback's nonce it the curent page's nonce is unknown", asyncSpec (next) ->
          spyOn(up.protocol, 'cspNonce').and.returnValue(null)
          fixture('.target')
          up.render('.target', url: '/path')

          next ->
            jasmine.respondWith(
              responseText: '<div class="target" callback="nonce-secret2 alert()">new text</div>'
              responseHeaders: { 'Content-Security-Policy': "script-src: 'nonce-secret2'"}
            )

          next ->
            expect('.target').toHaveText('new text')
            expect('.target').toHaveAttribute('callback', "nonce-secret2 alert()")

      describe 'destruction of old element', ->

        it 'emits an up:fragment:destroyed event on the former parent element after the element has been removed from the DOM', (done) ->
          $parent = $fixture('.parent')
          $element = $parent.affix('.element.v1').text('v1')
          expect($element).toBeAttached()

          spy = jasmine.createSpy('event listener')
          $parent[0].addEventListener 'up:fragment:destroyed', (event) ->
            spy(event.target, event.fragment, up.specUtil.isDetached($element))

          extractDone = up.render('.element', document: '<div class="element v2">v2</div>')

          extractDone.then ->
            expect(spy).toHaveBeenCalledWith($parent[0], $element[0], true)
            done()

        it 'calls destructors on the old element', asyncSpec (next) ->
          destructor = jasmine.createSpy('destructor')
          up.$compiler '.container', ($element) ->
            -> destructor($element.text())
          $container = $fixture('.container').text('old text')
          up.hello($container)
          up.render('.container', document: '<div class="container">new text</div>')

          next =>
            expect('.container').toHaveText('new text')
            expect(destructor).toHaveBeenCalledWith('old text')

        it 'calls destructors on the old element after a { transition }', (done) ->
          up.motion.config.enabled = true

          destructor = jasmine.createSpy('destructor')
          up.$compiler '.container', ($element) ->
            -> destructor($element.text())
          $container = $fixture('.container').text('old text')
          up.hello($container)

          up.render(fragment: '<div class="container">new text</div>', transition: 'cross-fade', duration: 100)

          u.timer 50, =>
            expect(destructor).not.toHaveBeenCalled()

          u.timer 220, =>
            expect('.container').toHaveText('new text')
            expect(destructor).toHaveBeenCalledWith('old text')
            done()

        it 'calls destructors when the replaced element is a singleton element like <body> (bugfix)', asyncSpec (next) ->
          # shouldSwapElementsDirectly() is true for body, but can't have the example replace the Jasmine test runner UI
          up.element.isSingleton.mock().and.callFake (element) -> element.matches('.container')
          destructor = jasmine.createSpy('destructor')
          up.$compiler '.container', -> destructor
          $container = $fixture('.container')
          up.hello($container)

          # Need to pass a { target } and not use { fragment }, since up.fragment.toTarget() ignores
          # classes and only returns the tag name for singleton elements.
          up.render('.container', document: '<div class="container">new text</div>')

          next =>
            expect('.container').toHaveText('new text')
            expect(destructor).toHaveBeenCalled()

        it 'marks the old element as .up-destroying before destructors', (done) ->
          testElementState = u.memoize (element) ->
            expect(element).toHaveText('old text')
            expect(element).toMatchSelector('.up-destroying')
            done()

          up.compiler '.container', (element) ->
            return -> testElementState(element)

          up.hello fixture('.container', text: 'old text')

          up.render(fragment: '<div class="container">new text</div>')

        it 'marks the old element as .up-destroying before destructors after a { transition }', (done) ->
          destructor = jasmine.createSpy('destructor')
          up.$compiler '.container', ($element) ->
            -> destructor($element.text(), $element.is('.up-destroying'))
          $container = $fixture('.container').text('old text')
          up.hello($container)

          extractDone = up.render(
            fragment: '<div class="container">new text</div>',
            transition: 'cross-fade',
            duration: 100
          )

          extractDone.then ->
            expect('.container').toHaveText('new text')
            expect(destructor).toHaveBeenCalledWith('old text', true)
            done()

        it 'calls destructors while the element is still attached to the DOM, so destructors see ancestry and events bubble up', asyncSpec (next) ->
          spy = jasmine.createSpy('parent spy')
          up.$compiler '.element', ($element) ->
            return -> spy($element.text(), $element.parent())

          $parent = $fixture('.parent')
          $element = $parent.affix('.element').text('old text')
          up.hello($element)

          up.render(fragment: '<div class="element">new text</div>')

          next =>
            expect(spy).toHaveBeenCalledWith('old text', $parent)

        it 'calls destructors while the element is still attached to the DOM when also using a { transition }', (done) ->
          spy = jasmine.createSpy('parent spy')
          up.$compiler '.element', ($element) ->
            return ->
              # We must seek .parent in our ancestry, because our direct parent() is an .up-bounds container
              spy($element.text(), $element.closest('.parent'))

          $parent = $fixture('.parent')
          $element = $parent.affix('.element').text('old text')
          up.hello($element)

          extractDone = up.render(
            fragment: '<div class="element">new text</div>',
            transition: 'cross-fade',
            duration: 30
          )

          extractDone.then ->
            expect(spy).toHaveBeenCalledWith('old text', $parent)
            done()

      describe 'focus', ->

        describe 'with { focus: "autofocus" }', ->

          it 'focuses an [autofocus] element in the new fragment', asyncSpec (next) ->
            fixture('form.foo-bar')
            up.render focus: 'autofocus', fragment: """
              <form class='foo-bar'>
                <input class="autofocused-input" autofocus>
              </form>
            """

            next =>
              expect('.autofocused-input').toBeFocused()

        describe 'with { focus: "target" }', ->

          it 'focuses the new fragment', asyncSpec (next) ->
            fixture('form.foo-bar')
            up.render focus: 'target', fragment: """
              <form class='foo-bar'>
                <input>
              </form>
            """

            next =>
              expect('.foo-bar').toBeFocused()

          it 'focuses the fragment even if its element type is not focusable by default', asyncSpec (next) ->
            fixture('.foo-bar')
            up.render focus: 'target', fragment: """
              <span class='foo-bar'></span>
            """

            next =>
              expect('.foo-bar').toBeFocused()

        describe 'with { focus: "hash" }', ->

          it 'focuses the target of a URL #hash', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path#hash', focus: 'hash')

            next =>
              @respondWith """
                <div class="target">
                  <div id="hash"></div>
                </div>
                """

            next =>
              expect('#hash').toBeFocused()

        describe 'with a CSS selector as { focus } option', ->

          it 'focuses a matching element within the new fragment', asyncSpec (next) ->
            fixture('form.foo-bar')
            up.render focus: '.input', fragment: """
              <form class='foo-bar'>
                <input class='input'>
              </form>
            """

            next =>
              expect('.input').toBeFocused()

          it 'focuses a matching element in the same layer', asyncSpec (next) ->
            fixture('form.foo-bar')

            fixture('.element')

            up.render focus: '.element', fragment: """
              <form class='foo-bar'>
              </form>
            """

            next =>
              expect('.element').toBeFocused()

          it 'does not focus a matching element in another layer', asyncSpec (next) ->
            makeLayers [
              { target: '.root-element' }
              { target: '.overlay-element' }
            ]

            next ->
              up.render('.overlay-element', focus: '.root-element', content: 'new content')

            next ->
              expect('.rootElement').not.toBeFocused()

        describe 'with { focus: "keep" }', ->

          it 'preserves focus of an element within the changed fragment', asyncSpec (next) ->
            container = fixture('.container')
            oldFocused = e.affix(container, '.focused[tabindex=0]', text: 'old focused')
            oldFocused.focus()
            expect(oldFocused).toBeFocused()

            up.render('.container', focus: 'keep', document: """
              <div class="container">
                <div class="focused" tabindex="0">new focused</div>
              </div>
            """)

            next ->
              expect('.focused').toHaveText('new focused')
              expect('.focused').toBeFocused()

          it 'does not crash if the focused element is not targetable (bugfix)', asyncSpec (next) ->
            container = fixture('.container')
            oldFocused = e.affix(container, 'div[tabindex=0]', text: 'old focused')
            oldFocused.focus()
            expect(oldFocused).toBeFocused()

            up.render('.container', focus: 'keep', document: """
              <div class="container">
                <div tabindex="0">new focused</div>
              </div>
            """)

            next ->
              expect('div[tabindex]').toHaveText('new focused')
              expect('div[tabindex]').not.toBeFocused()
              expect(window).not.toHaveUnhandledRejections()

          it 'preserves focus of an element within the changed fragment when updating inner HTML with { content } (bugfix)', asyncSpec (next) ->
            container = fixture('.container')
            oldFocused = e.affix(container, '.focused[tabindex=0]', text: 'old focused')
            oldFocused.focus()
            expect(oldFocused).toBeFocused()

            up.render('.container', focus: 'keep', content: '<div class="focused" tabindex="0">new focused</div>')

            next ->
              expect('.focused').toBeFocused()

          it 'preserves scroll position and selection range of an element within the changed fragment', asyncSpec (next) ->
            container = fixture('.container')
            longText = """
              foooooooooooo
              baaaaaaaaaaar
              baaaaaaaaaaaz
              baaaaaaaaaaam
              quuuuuuuuuuux
            """
            oldFocused = e.affix(container, 'textarea[name=prose][wrap=off][rows=3][cols=6]', text: longText)

            oldFocused.selectionStart = 10
            oldFocused.selectionEnd = 11
            oldFocused.scrollTop = 12
            oldFocused.scrollLeft = 13
            oldFocused.focus()

            expect(oldFocused).toBeFocused()
            expect(oldFocused.selectionStart).toBeAround(10, 2)
            expect(oldFocused.selectionEnd).toBeAround(11, 2)
            expect(oldFocused.scrollTop).toBeAround(12, 2)
            expect(oldFocused.scrollLeft).toBeAround(13, 2)

            up.render('.container', focus: 'keep', content: "<textarea name='prose' wrap='off' rows='3' cols='6'>#{longText}</textarea>")

            next ->
              textarea = document.querySelector('.container textarea')
              expect(textarea.selectionStart).toBeAround(10, 2)
              expect(textarea.selectionEnd).toBeAround(11, 2)
              expect(textarea.scrollTop).toBeAround(12, 2)
              expect(textarea.scrollLeft).toBeAround(13, 2)
              expect(textarea).toBeFocused()

          it 'does not lose focus of an element outside the changed fragment', asyncSpec (next) ->
            oldFocused = fixture('textarea')
            oldFocused.focus()

            container = fixture('.container')
            e.affix(container, 'textarea')

            up.render('.container', focus: 'keep', content: "<textarea></textarea>")

            next ->
              expect(oldFocused).toBeFocused()

          it 'does not rediscover an element with the same selector outside the changed fragment (bugfix)', asyncSpec (next) ->
            outside = fixture('textarea')

            container = fixture('.container')
            e.affix(container, 'textarea')

            up.render('.container', focus: 'keep', content: "<textarea></textarea>")

            next ->
              expect(outside).not.toBeFocused()

        describe 'with { focus: "layer" }', ->

          it "focuses the fragment's layer", asyncSpec (next) ->
            # Focus another element since the front layer will automatically
            # get focus after opening.
            textarea = fixture('textarea')
            textarea.focus()

            makeLayers [
              { target: '.root' }
              { target: '.overlay' }
            ]

            next ->
              up.render('.overlay', focus: 'layer', content: 'new overlay text')

            next ->
              expect(up.layer.front).toBeFocused()


        describe 'with { focus: "target-if-main" }', ->

          it 'focuses a main target', asyncSpec (next) ->
            fixture('form.foo-bar')

            up.fragment.config.mainTargets.push('.foo-bar')

            up.render focus: 'target-if-main', fragment: """
              <form class='foo-bar'>
                <input>
              </form>
            """

            next =>
              expect('.foo-bar').toBeFocused()

          it 'does not focus a non-main target', asyncSpec (next) ->
            fixture('form.foo-bar')

            up.render focus: 'target-if-main', fragment: """
              <form class='foo-bar'>
                <input>
              </form>
            """

            next =>
              expect('.foo-bar').not.toBeFocused()

        describe 'with { focus: "target-if-lost" }', ->

          it 'focuses the target if the focus was lost with the old fragment', asyncSpec (next) ->
            container = fixture('.container')
            child = e.affix(container, '.child[tabindex=0]')
            child.focus()

            expect(child).toBeFocused()

            up.render focus: 'target-if-lost', fragment: """
              <div class='container'>
                <div class='child' tabindex='0'></div>
              </div>
            """

            next ->
              expect('.container').toBeFocused()

          it 'does not focus the target if an element outside the updating fragment was focused', asyncSpec (next) ->
            container = fixture('.container')
            child = e.affix(container, '.child')

            outside = fixture('.outside[tabindex=0]')
            outside.focus()

            up.render focus: 'target-if-lost', fragment: """
              <div class='container'>
                <div class='child' tabindex='0'></div>
              </div>
            """

            next ->
              expect('.outside').toBeFocused()

        describe 'with an array of { focus } options', ->

          it 'tries each option until one succeeds', asyncSpec (next) ->
            fixture('.container')
            up.render('.container', focus: ['autofocus', '.element', '.container'], content: "<div class='element'>element</div>")

            next ->
              expect('.container .element').toBeFocused()

        describe 'with a string with "or"-separated { focus } options', ->

          it 'tries each option until one succeeds', asyncSpec (next) ->
            fixture('.container')
            up.render('.container', focus: 'autofocus or .element or .container', content: "<div class='element'>element</div>")

            next ->
              expect('.container .element').toBeFocused()

        describe 'with { focus: "restore" }', ->

          it 'restores earlier focus-related state at this location'

        describe 'with { focus: "auto" }', ->

          it 'focuses a main target', asyncSpec (next) ->
            fixture('form.foo-bar')

            up.fragment.config.mainTargets.unshift('.foo-bar')

            up.render focus: 'auto', fragment: """
              <form class='foo-bar'>
                <input>
              </form>
            """

            next =>
              expect('.foo-bar').toBeFocused()

          it 'focuses a main target within the updated container', asyncSpec (next) ->
            container = fixture('.container')
            e.affix(container, 'form.foo-bar')

            up.fragment.config.mainTargets.push('.foo-bar')

            up.render focus: 'auto', fragment: """
              <div class='container'>
                <form class='foo-bar'>
                  <input>
                </form>
              </div>
            """

            next =>
              expect('.foo-bar').toBeFocused()

          it 'does not focus a non-main target', asyncSpec (next) ->
            fixture('.foo-bar')

            up.render focus: 'auto', fragment: """
              <form class='foo-bar'>
                <input>
              </form>
            """

            next =>
              expect('.foo-bar').not.toBeFocused()

          it 'focuses an child element with [autofocus] attribute (even when not replacing a main target)', asyncSpec (next) ->
            fixture('form.foo-bar')
            up.render focus: 'auto', fragment: """
              <form class='foo-bar'>
                <input class="autofocused-input" autofocus>
              </form>
            """

            next =>
              expect('.autofocused-input').toBeFocused()

          it 'focuses the target of a URL #hash', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path#hash', focus: 'auto')

            next =>
              @respondWith """
                <div class="target">
                  <div id="hash"></div>
                </div>
                """

            next =>
              expect('#hash').toBeFocused()

      describe 'with { guardEvent } option', ->

        it 'emits the given event before rendering', asyncSpec (next) ->
          fixture('.target', text: 'old content')
          guardEvent = up.event.build('my:guard')
          listener = jasmine.createSpy('listener').and.callFake (event) ->
            expect('.target').toHaveText('old content')
          up.on 'my:guard', listener

          up.render(target: '.target', content: 'new content', guardEvent: guardEvent)

          next ->
            expect(listener).toHaveBeenCalledWith(guardEvent, jasmine.anything(), jasmine.anything())
            expect('.target').toHaveText('new content')

        it 'prefers to emit the given event on the given { origin } instead of the document', asyncSpec (next) ->
          fixture('.target', text: 'old content')
          origin = fixture('.origin')
          guardEvent = up.event.build('my:guard')
          listener = jasmine.createSpy('listener')
          origin.addEventListener('my:guard', listener)

          up.render(target: '.target', content: 'new content', guardEvent: guardEvent, origin: origin)

          next ->
            expect(listener).toHaveBeenCalledWith(guardEvent)

        it 'lets listeners prevent the event, aborting the fragment update', asyncSpec (next) ->
          fixture('.target', text: 'old content')
          guardEvent = up.event.build('my:guard')
          up.on('my:guard', (event) -> event.preventDefault())

          promise = up.render(target: '.target', content: 'new content', guardEvent: guardEvent)

          next ->
            next.await promiseState(promise)

          next (result) ->
            expect(result.state).toEqual('rejected')
            expect(result.value).toBeError(/(Aborted|Prevented)/i)

        it 'sets { renderOptions } on the emitted event', asyncSpec (next) ->
          fixture('.target', text: 'old content')
          listener = jasmine.createSpy('listener').and.callFake((event) -> event.preventDefault())
          guardEvent = up.event.build('my:guard')
          up.on('my:guard', listener)

          up.render(target: '.target', content: 'new content', guardEvent: guardEvent)

          next ->
            expect(listener).toHaveBeenCalledWith(guardEvent, jasmine.anything(), jasmine.anything())
            expect(listener.calls.argsFor(0)[0].renderOptions.target).toEqual('.target')

        it 'omits the { guardEvent } key from the { renderOptions }, so event handlers can pass this to render() without causing an infinite loop', asyncSpec (next) ->
          fixture('.target', text: 'old content')
          listener = jasmine.createSpy('listener').and.callFake((event) -> event.preventDefault())
          guardEvent = up.event.build('my:guard')
          up.on('my:guard', listener)

          up.render(target: '.target', content: 'new content', guardEvent: guardEvent)

          next ->
            expect(listener).toHaveBeenCalledWith(guardEvent, jasmine.anything(), jasmine.anything())
            expect(listener.calls.argsFor(0)[0].renderOptions.target).toEqual('.target')
            expect(listener.calls.argsFor(0)[0].renderOptions.guardEvent).toBeMissing()

      - if up.migrate.loaded
        describe 'with legacy { solo } option', ->

          it 'does not pass the option to up.request(), where it would be handled a second time (bugfix)', asyncSpec (next) ->
            fixture('.target')
            requestSpy = spyOn(up, 'request').and.callThrough()

            up.render(target: '.target', url: '/path', solo: false)

            next ->
              expect(requestSpy.calls.argsFor(0)[0].solo).not.toBe(false)

      describe 'with { abort } option', ->

        describe 'with { abort: true }', ->

          it 'aborts the request of an existing change', asyncSpec (next) ->
            fixture('.element')

            change1Error  = undefined
            change1Promise = undefined

            change1Promise = up.render('.element', url: '/path1', abort: true)
            change1Promise.catch (e) -> change1Error = e

            next ->
              expect(up.network.queue.allRequests.length).toEqual(1)
              expect(change1Error).toBeUndefined()

              up.render('.element', url: '/path2', abort: true)

            next ->
              expect(change1Error).toBeAbortError()
              expect(up.network.queue.allRequests.length).toEqual(1)

          it 'does not abort an earlier request that was made with { abortable: false }', asyncSpec (next) ->
            fixture('.element')

            change1Error  = undefined
            change1Promise = undefined

            change1Promise = up.render('.element', url: '/path1', abortable: false)
            change1Promise.catch (e) -> change1Error = e

            next ->
              expect(up.network.queue.allRequests.length).toEqual(1)
              expect(change1Error).toBeUndefined()

              up.render('.element', url: '/path2', abort: true)

            next ->
              expect(change1Error).toBeUndefined()
              expect(up.network.queue.allRequests.length).toEqual(2)

          it 'aborts the request of an existing change if the new change is made from local content', asyncSpec (next) ->
            fixture('.element')

            change1Error  = undefined
            change1Promise = undefined

            change1Promise = up.render('.element', url: '/path1', abort: true)
            change1Promise.catch (e) -> change1Error = e

            next ->
              expect(up.network.queue.allRequests.length).toEqual(1)
              expect(change1Error).toBeUndefined()

              up.render('.element', content: 'local content', abort: true)

            next ->
              expect(change1Error).toBeAbortError()
              expect(up.network.queue.allRequests.length).toEqual(0)

          it "does not abort an existing change's request when preloading", asyncSpec (next) ->
            fixture('.element')

            change1Error  = undefined
            change1Promise = undefined

            change1Promise = up.render('.element', url: '/path1', abort: true)
            change1Promise.catch (e) -> change1Error = e

            next ->
              expect(up.network.queue.allRequests.length).toEqual(1)
              expect(change1Error).toBeUndefined()

              up.render('.element', url: '/path2', preload: true, abort: true)

            next ->
              expect(change1Error).toBeUndefined()
              expect(up.network.queue.allRequests.length).toEqual(2)

          it 'aborts an existing request when a preload request gets promoted to the foreground', asyncSpec (next) ->
            fixture('.element')

            change1Error  = undefined
            change1Promise = undefined

            change1Promise = up.render('.element', url: '/path1', abort: true)
            change1Promise.catch (e) -> change1Error = e

            next ->
              expect(up.network.queue.allRequests.length).toEqual(1)
              expect(change1Error).toBeUndefined()

              up.render('.element', url: '/path2', cache: true, preload: true, abort: true)

            next ->
              expect(change1Error).toBeUndefined()
              expect(up.network.queue.allRequests.length).toEqual(2)

              up.render('.element', url: '/path2', cache: true, preload: false, abort: true)

            next ->
              expect(change1Error).toBeAbortError()
              expect(up.network.queue.allRequests.length).toEqual(1)

          it 'does not cancel its own pending preload request (bugfix)', asyncSpec (next) ->
            fixture('.element')

            change1Error  = undefined
            change2Error  = undefined
            change1Promise = undefined
            change2Promise = undefined

            change1Promise = up.render('.element', url: '/path', preload: true)
            change1Promise.catch (e) -> change1Error = e

            next =>
              expect(up.network.queue.allRequests.length).toEqual(1)
              expect(change1Error).toBeUndefined()

              change2Promise = up.render('.element', url: '/path', abort: true, cache: true)
              change2Promise.catch (e) -> change2Error = e

            next =>
              expect(change1Error).toBeUndefined()
              expect(change2Error).toBeUndefined()
              expect(up.network.queue.allRequests.length).toEqual(1)

          it "aborts an existing change's request that was queued with { abort: false }", asyncSpec (next) ->
            fixture('.element')

            change1Error  = undefined
            change1Promise = undefined

            change1Promise = up.render('.element', url: '/path1', abort: false)
            change1Promise.catch (e) -> change1Error = e

            next =>
              expect(up.network.queue.allRequests.length).toEqual(1)
              expect(change1Error).toBeUndefined()

              up.render('.element', url: '/path2', abort: true)

            next =>
              expect(change1Error).toBeAbortError()
              expect(up.network.queue.allRequests.length).toEqual(1)

        describe 'with { abort: "all" }', ->

          it 'is an alias for { abort: true }', asyncSpec (next) ->
            fixture('.element')
            # We must have some earlier requests or up.fragment.abort() will not be called.
            previousRequest = up.request('/baz')

            abortSpy = spyOn(up.fragment, 'abort')

            up.render('.element', url: '/path1', abort: 'all')

            next ->
              expect(abortSpy).toHaveBeenCalledWith(jasmine.objectContaining(layer: 'any'))

        describe 'with { abort: "layer" }', ->

          it "aborts all requests on the targeted fragment's layer ", asyncSpec (next) ->
            layers = makeLayers(3)

            layers[1].affix('.element')

            # We must have some earlier requests or up.fragment.abort() will not be called.
            previousRequest = up.request('/baz')

            abortSpy = spyOn(up.fragment, 'abort')

            up.render('.element', url: '/path1', abort: 'layer', layer: 1)

            next ->
              expect(abortSpy).toHaveBeenCalledWith(jasmine.objectContaining(layer: up.layer.get(1)))

        describe 'with { abort } option set to a CSS selector', ->

          it "aborts all requests in the subtree of a matching element in the targeted layer", asyncSpec (next) ->
            layers = makeLayers(3)

            layers[1].affix('.element')

            # We must have some earlier requests or up.fragment.abort() will not be called.
            previousRequest = up.request('/baz')

            abortSpy = spyOn(up.fragment, 'abort')

            up.render('.element', url: '/path1', abort: '.element', layer: 1)

            next ->
              expect(abortSpy).toHaveBeenCalledWith('.element', jasmine.objectContaining(layer: up.layer.get(1)))

        describe 'with { abort } option set to an Element', ->

          it "aborts all requests in the subtree of that Element", asyncSpec (next) ->
            element = fixture('.element')

            # We must have some earlier requests or up.fragment.abort() will not be called.
            previousRequest = up.request('/baz')

            abortSpy = spyOn(up.fragment, 'abort')

            up.render('.element', url: '/path1', abort: element)

            next ->
              expect(abortSpy).toHaveBeenCalledWith(element, jasmine.anything())

        describe 'with { abort: "target" }', ->

          it 'aborts existing requests targeting the same element', (done) ->
            fixture('.element')
            change1Promise = up.render('.element', url: '/path1')

            expect(up.network.queue.allRequests.length).toBe(1)

            up.render('.element', url: '/path2', abort: 'target')

            u.task ->
              promiseState(change1Promise).then (result) ->
                expect(result.state).toBe('rejected')
                expect(result.value).toBeAbortError()
                done()

          it 'aborts existing requests targeting the same element when updating from local content', (done) ->
            fixture('.element')
            change1Promise = up.render('.element', url: '/path1')

            fixture('.sibling')
            change2Promise = up.render('.sibling', url: '/path2')

            expect(up.network.queue.allRequests.length).toBe(2)

            up.render('.element', content: 'new content', abort: 'target')

            u.task ->
              expect('.element').toHaveText('new content')

              promiseState(change1Promise).then ({ state, value }) ->
                expect(state).toBe('rejected')
                expect(value).toBeAbortError()

                # Show that the untargeted element still has a pending request
                promiseState(change2Promise).then ({ state, value }) ->
                  expect(state).toBe('pending')
                  done()

          it 'aborts existing requests targeting a descendant of the targeted element', (done) ->
            fixture('.parent .child')
            change1Promise = up.render('.child', url: '/path1')

            expect(up.network.queue.allRequests.length).toBe(1)

            up.render('.parent', url: '/path2', abort: 'target')

            u.task ->
              promiseState(change1Promise).then (result) ->
                expect(result.state).toBe('rejected')
                expect(result.value).toBeAbortError()
                done()

          it 'does not abort existing requests targeting an ascendant of the targeted element', (done) ->
            fixture('.parent .child')
            parentChangePromise = up.render('.parent', url: '/path1')

            expect(up.network.queue.allRequests.length).toBe(1)

            up.render('.child', url: '/path2', abort: 'target')

            u.task ->
              promiseState(parentChangePromise).then (result) ->
                expect(result.state).toBe('pending')
                done()

          it 'does not abort its own preloading request', (done) ->
            fixture('.element')
            preloadPromise = up.render('.element', url: '/path', preload: true)

            expect(up.network.queue.allRequests.length).toBe(1)

            up.render('.element', url: '/path', abort: 'target', cache: true)

            u.task ->
              promiseState(preloadPromise).then (result) ->
                expect(result.state).toBe('pending')
                expect(up.network.queue.allRequests.length).toBe(1)
                done()

          it 'does not let multiple preload requests for the same target abort each other', (done) ->
            fixture('.element')
            preloadPromise1 = up.render('.element', url: '/path1', abort: 'target', preload: true)
            preloadPromise2 = up.render('.element', url: '/path2', abort: 'target', preload: true)

            u.task ->
              Promise.all([promiseState(preloadPromise1), promiseState(preloadPromise2)]).then ([result1, result2]) ->
                expect(result1.state).toBe('pending')
                expect(result2.state).toBe('pending')
                expect(up.network.queue.allRequests.length).toBe(2)
                done()

        describe 'with { abort: false }', ->

          it "does not abort an existing change's request", asyncSpec (next) ->
            fixture('.element')

            change1Error = undefined
            change1Promise = undefined

            change1Promise = up.render('.element', url: '/path1')
            change1Promise.catch (e) -> change1Error = e

            next =>
              expect(up.network.queue.allRequests.length).toEqual(1)
              expect(change1Error).toBeUndefined()

              up.render('.element', url: '/path2', abort: false)

            next =>
              expect(change1Error).toBeUndefined()
              expect(up.network.queue.allRequests.length).toEqual(2)

          it 'does not abort requests targeting the same subtree once our response is received and swapped in', asyncSpec (next) ->
            fixture('.element', text: 'old text')

            change1Promise = up.render('.element', url: '/path1', abort: false)
            change1Error = undefined
            change1Promise.catch (e) -> change1Error = e

            next =>
              expect(up.network.queue.allRequests.length).toEqual(1)

              up.render('.element', url: '/path2', abort: false)

            next =>
              expect(up.network.queue.allRequests.length).toEqual(2)
              expect(change1Error).toBeUndefined()

              jasmine.respondWithSelector('.element', text: 'text from /path2')

            next =>
              expect('.element').toHaveText('text from /path2')
              expect(change1Error).toBeUndefined()
              expect(up.network.queue.allRequests.length).toEqual(1)

      describe 'with { cache } option', ->

        it 'reuses a cached request with { cache: true }', asyncSpec (next) ->
          fixture('.element')

          up.render('.element', url: '/path', cache: true)

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(target: '.element', url: '/path').toBeCached()

            up.render('.element', url: '/path', cache: true)

          next ->
            # See that the cached request is used.
            expect(jasmine.Ajax.requests.count()).toBe(1)

        it 'does not reuse a cached request with { cache: false }', asyncSpec (next) ->
          fixture('.element')

          up.render('.element', url: '/path', cache: false)

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(target: '.element', url: '/path').not.toBeCached()

            up.render('.element', url: '/path', cache: false)

          next ->
            # See that the cached request is used.
            expect(jasmine.Ajax.requests.count()).toBe(2)

        it 'does not reuse a cached request when no { cache } option is given', asyncSpec (next) ->
          fixture('.element')

          up.render('.element', url: '/path')

          next ->
            expect(jasmine.Ajax.requests.count()).toBe(1)
            expect(target: '.element', url: '/path').not.toBeCached()

            up.render('.element', url: '/path')

          next ->
            # See that the cached request is used.
            expect(jasmine.Ajax.requests.count()).toBe(2)


        describe 'cache revalidation', ->

          beforeEach (done) ->
            up.network.config.requestMetaKeys = []
            up.fragment.config.autoRevalidate = (response) => response.age >= 0
            fixture('.target', text: 'initial text')

            up.request('/cached-path', { cache: true })

            u.microtask ->
              jasmine.respondWithSelector('.target', text: 'cached text')
              u.microtask ->
                request = up.request('/cached-path', { cache: true })
                expect(request.fromCache).toBe(true)
                done()

          it 'reloads a fragment that was rendered from an older cached response', asyncSpec (next) ->
            up.render('.target', { url: '/cached-path', cache: true })

            next ->
              expect('.target').toHaveText('cached text')
              expect(up.network.isBusy()).toBe(true)

              jasmine.respondWithSelector('.target', text: 'verified text')

            next ->
              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('verified text')

          it 'does not verify a fragment rendered from a recent cached response', asyncSpec (next) ->
            up.fragment.config.autoRevalidate = (response) => response.age >= 10 * 1000

            up.render('.target', { url: '/cached-path', cache: true })

            next ->
              expect('.target').toHaveText('cached text')
              expect(up.network.isBusy()).toBe(false)

          it "does not verify a fragment that wasn't rendered from a cached response", asyncSpec (next) ->
            up.render('.target', { url: '/uncached-path', cache: true })

            next ->
              expect(up.network.isBusy()).toBe(true)

              jasmine.respondWithSelector('.target', text: 'server text')

          it 'does not verify a fragment when prepending content with :before', asyncSpec (next) ->
            up.render('.target:before', { url: '/cached-path', cache: true })

            next ->
              expect('.target').toHaveText('cached text' + 'initial text')
              expect(up.network.isBusy()).toBe(false)

          it 'does not verify a fragment when appending content with :after', asyncSpec (next) ->
            up.render('.target:after', { url: '/cached-path', cache: true })

            next ->
              expect('.target').toHaveText('initial text' + 'cached text')
              expect(up.network.isBusy()).toBe(false)

          it 'does not render a second time if the revalidation response is a 304 Not Modified', asyncSpec (next) ->
            up.render('.target', { url: '/cached-path', cache: true })

            next ->
              expect('.target').toHaveText('cached text')
              expect(up.network.isBusy()).toBe(true)

              jasmine.respondWith(status: 304)

            next ->
              expect(up.network.isBusy()).toBe(false)
              expect('.target').toHaveText('cached text')

          it 'allows to define which responses to verify in up.fragment.config.autoRevalidate'

          it 'does not use options like { confirm } or { feedback } when verifying', asyncSpec (next) ->
            confirmSpy = spyOn(window, 'confirm').and.returnValue(true)

            up.render('.target', { url: '/cached-path', cache: true, confirm: true })
            expect(confirmSpy.calls.count()).toBe(1)

            next ->
              expect('.target').toHaveText('cached text')
              expect(up.network.isBusy()).toBe(true)

              expect(confirmSpy.calls.count()).toBe(1)

          it "delays revalidation until the original transition completed, so an element isn't changed in-flight", asyncSpec (next) ->
            up.motion.config.enabled = true
            up.render('.target', { url: '/cached-path', cache: true, transition: 'cross-fade', easing: 'linear', duration: 200 })

            next ->
              expect('.target').toHaveText('cached text')
              expect('.target:not(.up-destroying)').toHaveOpacity(0, 0.15)
              expect(up.network.isBusy()).toBe(false)

            next.after 300, ->
              expect('.target:not(.up-destroying)').toHaveOpacity(1)
              expect(up.network.isBusy()).toBe(true)

              jasmine.respondWithSelector('.target', text: 'verified text')

            next ->
              expect('.target').toHaveText('verified text')

          it 'delays { onFinished } until the fragment was verified'

          it 'calls { onFinished } with the verified up.RenderResult'

          it 'calls { onFinished } with the cached zo.RenderResult if revalidation responded with 304 Not Modified'


    describe 'handling of [up-keep] elements', ->

        squish = (string) ->
          if u.isString(string)
            string = string.replace(/^\s+/g, '')
            string = string.replace(/\s+$/g, '')
            string = string.replace(/\s+/g, ' ')
          string

        beforeEach ->
          # Need to refactor this spec file so examples don't all share one example
          $('.before, .middle, .after').remove()

        it 'keeps an [up-keep] element, but does replace other elements around it', asyncSpec (next) ->
          $container = $fixture('.container')
          $container.affix('.before').text('old-before')
          $container.affix('.middle[up-keep]').text('old-middle')
          $container.affix('.after').text('old-after')

          up.render '.container', document: """
            <div class='container'>
              <div class='before'>new-before</div>
              <div class='middle' up-keep>new-middle</div>
              <div class='after'>new-after</div>
            </div>
            """

          next =>
            expect($('.before')).toHaveText('new-before')
            expect($('.middle')).toHaveText('old-middle')
            expect($('.after')).toHaveText('new-after')

        it 'keeps an [up-keep] element when updating a singleton element like <body>', asyncSpec (next) ->
          up.fragment.config.targetDerivers.unshift('middle-element')

          # shouldSwapElementsDirectly() is true for body, but can't have the example replace the Jasmine test runner UI
          up.element.isSingleton.mock().and.callFake (element) -> element.matches('middle-element')

          $container = $fixture('.container')
          $container.affix('before-element').text('old-before')
          # Must use a custom element since up.fragment.toTarget() only returns the element name for singleton elements.
          # Using a <div class="middle"> would return "div" and match the before-element.
          $container.affix('middle-element[up-keep]').text('old-middle')
          $container.affix('after-element').text('old-after')

          up.render '.container', document: """
            <div class='container'>
              <before-element>new-before</before-element>
              <middle-element class='middle' up-keep>new-middle</middle-element>
              <after-element class='after'>new-after</after-element>
            </div>
            """

          next =>
            expect($('before-element')).toHaveText('new-before')
            expect($('middle-element')).toHaveText('old-middle')
            expect($('after-element')).toHaveText('new-after')

        it 'keeps an [up-keep] element, but does replace text nodes around it', asyncSpec (next) ->
          $container = $fixture('.container')
          $container.html """
            old-before
            <div class='element' up-keep>old-inside</div>
            old-after
            """

          up.render '.container', document: """
            <div class='container'>
              new-before
              <div class='element' up-keep>new-inside</div>
              new-after
            </div>
            """

          next =>
            expect(squish($('.container').text())).toEqual('new-before old-inside new-after')

        it 'updates an [up-keep] element with { useKeep: false } option', asyncSpec (next) ->
          $container = $fixture('.container')
          $container.html """
            old-before
            <div class='element' up-keep>old-inside</div>
            old-after
            """

          up.render '.container',
            useKeep: false
            document: """
              <div class='container'>
                new-before
                <div class='element' up-keep>new-inside</div>
                new-after
              </div>
              """

          next =>
            expect(squish($('.container').text())).toEqual('new-before new-inside new-after')

        it 'keeps the scroll position of an [up-viewport] within a kept element', ->
          container = fixture('.container')
          keepable = e.affix(container, '.keepable[up-keep]')
          viewport = e.affix(keepable, '.viewport[up-viewport]', style: { height: '100px', overflowY: 'scroll' })
          viewportContent = e.affix(viewport, '.viewport-content', style: { height: '500px' })
          unkeeptSibling = e.affix(container, '.other', text: 'old other text')

          viewport.scrollTop = 100

          expect(viewport).toBeAttached()
          expect(viewport.scrollTop).toBe(100)

          up.render fragment: """

            <div class="container">
              <div class="keepable" up-keep>
                <div class="viewport" up-viewport></div>
              </div>
              <div class="other">new other text</div>
            </div>
          """

          expect('.other').toHaveText('new other text')
          expect(viewport).toBeAttached()
          expect(viewport.scrollTop).toBe(100)

        describe 'if an [up-keep] element is itself a direct replacement target', ->

          it "keeps that element", asyncSpec (next) ->
            $fixture('.keeper[up-keep]').text('old-inside')
            up.render fragment: "<div class='keeper' up-keep>new-inside</div>"

            next =>
              expect($('.keeper')).toHaveText('old-inside')

          it "only emits an event up:fragment:kept, but not an event up:fragment:inserted", asyncSpec (next) ->
            insertedListener = jasmine.createSpy('subscriber to up:fragment:inserted')
            keptListener = jasmine.createSpy('subscriber to up:fragment:kept')
            up.on('up:fragment:kept', keptListener)
            up.on('up:fragment:inserted', insertedListener)
            $keeper = $fixture('.keeper[up-keep]').text('old-inside')
            up.render '.keeper', document: "<div class='keeper new' up-keep>new-inside</div>"

            next =>
              expect(insertedListener).not.toHaveBeenCalled()
              expect(keptListener).toHaveBeenCalledWith(
                jasmine.objectContaining(newFragment: jasmine.objectContaining(className: 'keeper new')),
                $keeper[0],
                jasmine.anything()
              )

        it "removes an [up-keep] element if no matching element is found in the response", asyncSpec (next) ->
          barCompiler = jasmine.createSpy()
          barDestructor = jasmine.createSpy()
          up.$compiler '.bar', ($bar) ->
            text = $bar.text()
            barCompiler(text)
            return -> barDestructor(text)

          $container = $fixture('.container')
          $container.html """
            <div class='foo'>old-foo</div>
            <div class='bar' up-keep>old-bar</div>
            """
          up.hello($container)

          expect(barCompiler.calls.allArgs()).toEqual [['old-bar']]
          expect(barDestructor.calls.allArgs()).toEqual []

          up.render fragment: """
            <div class='container'>
              <div class='foo'>new-ffrooo</div>
            </div>
            """

          next =>
            expect($('.container .foo')).toBeAttached()
            expect($('.container .bar')).not.toBeAttached()

            expect(barCompiler.calls.allArgs()).toEqual [['old-bar']]
            expect(barDestructor.calls.allArgs()).toEqual [['old-bar']]

        it "updates an element if a matching element is found in the response, but that other element is no longer [up-keep]", asyncSpec (next) ->
          barCompiler = jasmine.createSpy()
          barDestructor = jasmine.createSpy()
          up.$compiler '.bar', ($bar) ->
            text = $bar.text()
            barCompiler(text)
            return -> barDestructor(text)

          $container = $fixture('.container')
          $container.html """
            <div class='foo'>old-foo</div>
            <div class='bar' up-keep>old-bar</div>
            """
          up.hello($container)

          expect(barCompiler.calls.allArgs()).toEqual [['old-bar']]
          expect(barDestructor.calls.allArgs()).toEqual []

          up.render fragment: """
            <div class='container'>
              <div class='foo'>new-foo</div>
              <div class='bar'>new-bar</div>
            </div>
            """

          next =>
            expect($('.container .foo')).toHaveText('new-foo')
            expect($('.container .bar')).toHaveText('new-bar')

            expect(barCompiler.calls.allArgs()).toEqual [['old-bar'], ['new-bar']]
            expect(barDestructor.calls.allArgs()).toEqual [['old-bar']]

        it 'moves a kept element to the ancestry position of the matching element in the response', asyncSpec (next) ->
          $container = $fixture('.container')
          $container.html """
            <div class="parent1">
              <div class="keeper" up-keep>old-inside</div>
            </div>
            <div class="parent2">
            </div>
            """
          up.render fragment: """
            <div class='container'>
              <div class="parent1">
              </div>
              <div class="parent2">
                <div class="keeper" up-keep>old-inside</div>
              </div>
            </div>
            """

          next =>
            expect($('.keeper')).toHaveText('old-inside')
            expect($('.keeper').parent()).toEqual($('.parent2'))

        it 'lets developers choose a selector to match against as the value of the up-keep attribute', asyncSpec (next) ->
          $container = $fixture('.container')
          $container.html """
            <div class="keeper" up-keep=".stayer"></div>
            """
          up.render fragment: """
            <div class='container'>
              <div up-keep class="stayer"></div>
            </div>
            """

          next =>
            expect('.keeper').toBeAttached()

        it 'does not compile a kept element a second time', asyncSpec (next) ->
          compiler = jasmine.createSpy('compiler')
          up.$compiler('.keeper', compiler)

          $container = $fixture('.container')
          $container.html """
            <div class="keeper" up-keep>old-text</div>
            """

          up.hello($container)
          expect(compiler.calls.count()).toEqual(1)

          up.render fragment: """
            <div class='container'>
              <div class="keeper" up-keep>new-text</div>
            </div>
            """

          next =>
            expect(compiler.calls.count()).toEqual(1)
            expect('.keeper').toBeAttached()
            expect('.keeper').toHaveText('old-text')

        it 'does not lose jQuery event handlers on a kept element (bugfix)', asyncSpec (next) ->
          handler = jasmine.createSpy('event handler')
          up.$compiler '.keeper', ($keeper) ->
            $keeper.on 'click', handler

          $container = $fixture('.container')
          $container.html """
            <div class="keeper" up-keep>old-text</div>
            """
          up.hello($container)

          up.render fragment: """
            <div class='container'>
              <div class="keeper" up-keep>new-text</div>
            </div>
            """

          next =>
            expect('.keeper').toHaveText('old-text')

          next =>
            Trigger.click('.keeper')

          next =>
            expect(handler).toHaveBeenCalled()

        it 'does not call destructors on a kept alement', asyncSpec (next) ->
          destructor = jasmine.createSpy('destructor')
          up.$compiler '.keeper', ($keeper) ->
            return destructor

          $container = $fixture('.container')
          $container.html """
            <div class="keeper" up-keep>old-text</div>
            """
          up.hello($container)

          up.render fragment: """
            <div class='container'>
              <div class="keeper" up-keep>new-text</div>
            </div>
            """

          next =>
            $keeper = $('.keeper')
            expect($keeper).toHaveText('old-text')
            expect(destructor).not.toHaveBeenCalled()

        it 'calls destructors when a kept element is eventually removed from the DOM', asyncSpec (next) ->
          handler = jasmine.createSpy('event handler')
          destructor = jasmine.createSpy('destructor')
          up.$compiler '.keeper', ($keeper) ->
            return destructor

          $container = $fixture('.container')
          $container.html """
            <div class="keeper" up-keep>old-text</div>
            """
          up.hello($container)

          up.render fragment: """
            <div class='container'>
              <div class="keeper">new-text</div>
            </div>
            """

          next =>
            $keeper = $('.keeper')
            expect($keeper).toHaveText('new-text')
            expect(destructor).toHaveBeenCalled()

        it 'lets listeners inspect a new element before discarding through properties on an up:fragment:keep event', asyncSpec (next) ->
          $keeper = $fixture('.keeper[up-keep]').text('old-inside')
          listener = jasmine.createSpy('event listener')
          $keeper[0].addEventListener('up:fragment:keep', listener)
          up.render '.keeper', document: "<div class='keeper new' up-keep up-data='{ \"key\": \"new-value\" }'>new-inside</div>"
          next =>
            expect(listener).toHaveBeenCalledWith(
              jasmine.objectContaining(
                newFragment: jasmine.objectContaining(className: 'keeper new')
                newData: jasmine.objectContaining({ key: 'new-value' }),
                target: $keeper[0]
              )
            )

        it 'allows to define a listener in an [up-on-keep] attribute', asyncSpec (next) ->
          keeper = fixture('.keeper[up-keep][up-on-keep="this.onKeepSpy(this, newFragment, newData)"]', text: 'old-inside')

          keeper.onKeepSpy = jasmine.createSpy('onKeep spy')

          up.render '.keeper', document: "<div class='keeper new' up-keep up-data='{ \"key\": \"new-value\" }'>new-inside</div>"
          next =>
            expect(keeper.onKeepSpy).toHaveBeenCalledWith(
              keeper,
              jasmine.objectContaining(className: 'keeper new'),
              jasmine.objectContaining({ key: 'new-value' })
            )

        it 'lets listeners cancel the keeping by preventing default on an up:fragment:keep event', asyncSpec (next) ->
          $keeper = $fixture('.keeper[up-keep]').text('old-inside')
          $keeper.on 'up:fragment:keep', (event) -> event.preventDefault()
          up.render fragment: "<div class='keeper' up-keep>new-inside</div>"
          next => expect($('.keeper')).toHaveText('new-inside')

        it 'lets listeners prevent up:fragment:keep event if the element was kept before (bugfix)', asyncSpec (next) ->
          $keeper = $fixture('.keeper[up-keep]').text('version 1')
          $keeper[0].addEventListener 'up:fragment:keep', (event) ->
            event.preventDefault() if event.newFragment.textContent.trim() == 'version 3'

          next => up.render fragment: "<div class='keeper' up-keep>version 2</div>"
          next => expect($('.keeper')).toHaveText('version 1')
          next => up.render fragment: "<div class='keeper' up-keep>version 3</div>"
          next => expect($('.keeper')).toHaveText('version 3')

        it 'emits an up:fragment:kept event on a kept element and up:fragment:inserted on the targeted parent parent', asyncSpec (next) ->
          insertedListener = jasmine.createSpy()
          up.on('up:fragment:inserted', insertedListener)
          keptListener = jasmine.createSpy()
          up.on('up:fragment:kept', keptListener)

          $container = $fixture('.container')
          $container.html """
            <div class="keeper" up-keep></div>
            """

          up.render fragment: """
            <div class='container'>
              <div class="keeper" up-keep></div>
            </div>
            """

          next =>
            expect(insertedListener).toHaveBeenCalledWith(jasmine.anything(), $('.container')[0], jasmine.anything())
            expect(keptListener).toHaveBeenCalledWith(jasmine.anything(), $('.container .keeper')[0], jasmine.anything())

        it 'emits an up:fragment:kept event on a kept element with a newData property corresponding to the up-data attribute value of the discarded element', asyncSpec (next) ->
          keptListener = jasmine.createSpy()
          up.on 'up:fragment:kept', (event) -> keptListener(event.target, event.newData)
          $container = $fixture('.container')
          $keeper = $container.affix('.keeper[up-keep]').text('old-inside')

          up.render fragment: """
            <div class='container'>
              <div class='keeper' up-keep up-data='{ "foo": "bar" }'>new-inside</div>
            </div>
          """

          next =>
            expect($('.keeper')).toHaveText('old-inside')
            expect(keptListener).toHaveBeenCalledWith($keeper[0], jasmine.objectContaining({ 'foo': 'bar' }))

        it 'emits an up:fragment:kept with { newData: {} } if the discarded element had no up-data value', asyncSpec (next) ->
          keptListener = jasmine.createSpy()
          up.on('up:fragment:kept', keptListener)
          $container = $fixture('.container')
          $keeper = $container.affix('.keeper[up-keep]').text('old-inside')
          up.render '.keeper', document: """
            <div class='container'>
              <div class='keeper' up-keep>new-inside</div>
            </div>
          """

          next =>
            expect($('.keeper')).toHaveText('old-inside')
            expect(keptListener).toEqual(jasmine.anything(), $('.keeper'), {})

        it 'reuses the same element and emits up:fragment:kept during multiple extractions', asyncSpec (next) ->
          keptListener = jasmine.createSpy()
          up.on 'up:fragment:kept', (event) -> keptListener(event.target, event.newData)
          $container = $fixture('.container')
          $keeper = $container.affix('.keeper[up-keep]').text('old-inside')

          next =>
            up.render '.keeper', document: """
              <div class='container'>
                <div class='keeper' up-keep up-data='{ \"key\": \"value1\" }'>new-inside</div>
              </div>
            """

          next =>
            up.render '.keeper', document: """
              <div class='container'>
                <div class='keeper' up-keep up-data='{ \"key\": \"value2\" }'>new-inside</div>
            """

          next =>
            $keeper = $('.keeper')
            expect($keeper).toHaveText('old-inside')
            expect(keptListener).toHaveBeenCalledWith($keeper[0], jasmine.objectContaining({ key: 'value1' }))
            expect(keptListener).toHaveBeenCalledWith($keeper[0], jasmine.objectContaining({ key: 'value2' }))

        it "doesn't let the discarded element appear in a transition", (done) ->
          up.motion.config.enabled = true

          oldTextDuringTransition = undefined
          newTextDuringTransition = undefined
          transition = (oldElement, newElement) ->
            oldTextDuringTransition = squish(oldElement.innerText)
            newTextDuringTransition = squish(newElement.innerText)
            Promise.resolve()

          $container = $fixture('.container')
          $container.html """
            <div class='foo'>old-foo</div>
            <div class='bar' up-keep>old-bar</div>
            """

          newHTML = """
            <div class='container'>
              <div class='foo'>new-foo</div>
              <div class='bar' up-keep>new-bar</div>
            </div>
            """

          assertElements = ->
            expect(oldTextDuringTransition).toEqual('old-foo old-bar')
            expect(newTextDuringTransition).toEqual('new-foo old-bar')
            done()

          up.render('.container',
            fragment: newHTML,
            transition: transition,
            onFinished: assertElements
          )

      if window.customElements

        describe 'custom elements', ->

          beforeAll ->
            TestComponent = ->
              instance = Reflect.construct(HTMLElement, [], TestComponent)
              instance.innerHTML = 'component activated'
              up.emit('test-component:new')
              instance
            Object.setPrototypeOf(TestComponent.prototype, HTMLElement.prototype)
            Object.setPrototypeOf(TestComponent, HTMLElement)

            window.customElements.define('test-component-activation', TestComponent)

          it 'activates custom elements in inserted fragments', asyncSpec (next) ->
            fixture('.target')

            up.render '.target', content: """
              <test-component-activation></test-component-activation>
              """

            next =>
              expect('.target test-component-activation').toHaveText('component activated')

          it 'does not activate custom elements outside of inserted fragments (for performance reasons)', asyncSpec (next) ->
            fixture('.target')
            constructorSpy = jasmine.createSpy('constructor called')
            up.on('test-component:new', constructorSpy)

            up.render '.target', document: """
              <div class="target">
                <test-component-activation></test-component-activation>
              </div>
              <div class="other">
                <test-component-activation></test-component-activation>
              </div>
              """

            next =>
              expect(constructorSpy.calls.count()).toBe(1)

    if up.migrate.loaded
      describe 'up.replace()', ->

        it 'delegates to up.navigate({ target, url }) (deprecated)', ->
          navigateSpy = up.fragment.navigate.mock()
          deprecatedSpy = spyOn(up.migrate, 'deprecated')
          up.replace('target', 'url')
          expect(navigateSpy).toHaveBeenCalledWith({ target: 'target', url: 'url' })
          expect(deprecatedSpy).toHaveBeenCalled()

    if up.migrate.loaded
      describe 'up.extract()', ->

        it 'delegates to up.navigate({ target, document }) (deprecated)', ->
          navigateSpy = up.fragment.navigate.mock()
          deprecatedSpy = spyOn(up.migrate, 'deprecated')
          up.extract('target', 'document')
          expect(navigateSpy).toHaveBeenCalledWith({ target: 'target', document: 'document' })
          expect(deprecatedSpy).toHaveBeenCalled()

    describe 'up.navigate()', ->

      it 'delegates to up.render({ ...options, navigate: true })', ->
        renderSpy = up.fragment.render.mock()
        up.navigate({ url: 'url' })
        expect(renderSpy).toHaveBeenCalledWith({ url: 'url', navigate: true })

      it "updates the layer's main target by default (since navigation sets { fallback: true })", asyncSpec (next) ->
        up.fragment.config.mainTargets.unshift('.main-target')
        fixture('.main-target')

        up.navigate({ url: '/path2' })

        next =>
          expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.main-target')

    describe 'up.destroy()', ->

      it 'removes the element with the given selector', asyncSpec (next) ->
        $fixture('.element')
        up.destroy('.element')

        next ->
          expect($('.element')).not.toBeAttached()

      it 'has a sync effect', ->
        fixture('.element')
        up.destroy('.element')
        expect('.element').not.toBeAttached()

      it 'runs an animation before removal with { animate } option', asyncSpec (next) ->
        $element = $fixture('.element')
        up.destroy($element, animation: 'fade-out', duration: 200, easing: 'linear')

        next ->
          expect($element).toHaveOpacity(1.0, 0.15)

        next.after 100, ->
          expect($element).toHaveOpacity(0.5, 0.3)

        next.after (100 + 75), ->
          expect($element).toBeDetached()

      it 'calls destructors for custom elements', ->
        destructor = jasmine.createSpy('destructor')
        up.$compiler('.element', ($element) -> destructor)
        up.hello(fixture('.element'))
        up.destroy('.element')
        expect(destructor).toHaveBeenCalled()

      it 'does not call destructors twice if up.destroy() is called twice on the same fragment', asyncSpec (next) ->
        destructor = jasmine.createSpy('destructor')
        up.compiler('.element', (element) -> destructor)

        element = fixture('.element')
        up.hello(element)

        up.destroy(element, animation: 'fade-out', duration: 10)
        up.destroy(element, animation: 'fade-out', duration: 10)

        next.after 150, ->
          expect(destructor.calls.count()).toBe(1)

      it 'marks the old element as [aria-hidden=true] before destructors', (done) ->
        testElement = (element) ->
          expect(element).toHaveText('old text')
          expect(element).toMatchSelector('[aria-hidden=true]')
          done()

        up.compiler '.container', (element) ->
          return -> testElement(element)

        up.hello fixture('.container', text: 'old text')

        up.destroy('.container')

      it 'immediately marks the old element as .up-destroying', ->
        container = fixture('.container')

        up.destroy('.container', animation: 'fade-out', duration: 100)

        expect(container).toMatchSelector('.up-destroying')

      it 'waits until an { animation } is done before calling destructors', asyncSpec (next) ->
        destructor = jasmine.createSpy('destructor')
        up.$compiler '.container', ($element) ->
          -> destructor($element.text())
        $container = $fixture('.container').text('old text')
        up.hello($container)

        up.destroy('.container', animation: 'fade-out', duration: 100)

        next.after 50, ->
          expect(destructor).not.toHaveBeenCalled()

        next.after 200, ->
          expect(destructor).toHaveBeenCalledWith('old text')

      it 'marks the element as .up-destroying while it is animating', asyncSpec (next) ->
        $element = $fixture('.element')
        up.destroy($element, animation: 'fade-out', duration: 80, easing: 'linear')

        next ->
          expect($element).toHaveClass('up-destroying')

      # up.destroy
      it 'runs an { onFinished } callback after the element has been removed from the DOM', asyncSpec (next) ->
        $parent = $fixture('.parent')
        $element = $parent.affix('.element')
        expect($element).toBeAttached()

        onFinished = jasmine.createSpy('onFinished callback')

        up.destroy($element, { animation: 'fade-out', duration: 30, onFinished })

        next ->
          expect($element).toBeAttached()
          expect(onFinished).not.toHaveBeenCalled()

        next.after 200, ->
          expect($element).toBeDetached()
          expect(onFinished).toHaveBeenCalled()

      # up.destroy
      it 'emits an up:fragment:destroyed event on the former parent element after the element was marked as .up-destroying and started its close animation', asyncSpec (next) ->
        $parent = $fixture('.parent')
        $element = $parent.affix('.element')
        expect($element).toBeAttached()

        listener = jasmine.createSpy('event listener')

        $parent[0].addEventListener('up:fragment:destroyed', listener)

        up.destroy($element, animation: 'fade-out', duration: 30)

        next ->
          expect(listener).toHaveBeenCalled()
          expect($element).toMatchSelector('.up-destroying')
          expect($element).toBeAttached()

      it 'removes element-related data from the global jQuery cache (bugfix)', asyncSpec (next) ->
        $element = $fixture('.element')
        $element.data('foo', { foo: '1' })
        expect($element.data('foo')).toEqual({ foo: '1'})
        up.destroy($element)

        next ->
          expect($element.data('foo')).toBeMissing()

      it 'calls #sync() on all layers in the stack', asyncSpec (next) ->
        makeLayers(2)

        next ->
          spyOn(up.layer.stack[0], 'sync')
          spyOn(up.layer.stack[1], 'sync')

          element = up.layer.stack[1].affix('.element')

          up.destroy(element)

        next ->
          expect(up.layer.stack[0].sync).toHaveBeenCalled()
          expect(up.layer.stack[1].sync).toHaveBeenCalled()

      it 'does not crash and runs destructors when destroying a detached element (bugfix)', ->
        destructor = jasmine.createSpy('destructor')
        up.compiler('.element', (element) -> destructor)
        detachedElement = up.element.createFromSelector('.element')
        up.hello(detachedElement)
        up.destroy(detachedElement)
        expect(destructor).toHaveBeenCalled()

      describe 'pending requests zzz', ->

        it 'aborts pending requests targeting the given element', (done) ->
          target = fixture('.target')
          promise = up.render(target, { url: '/path' })

          expect(up.network.isBusy()).toBe(true)

          up.destroy(target)

          u.task ->
            promiseState(promise).then (result) ->
              expect(result.state).toBe('rejected')
              expect(result.value).toBeAbortError()
              done()

        it 'aborts pending requests targeting a descendant of the given element', (done) ->
          parent = fixture('.parent')
          child = e.affix(parent, '.child')
          promise = up.render(child, { url: '/path' })

          expect(up.network.isBusy()).toBe(true)

          up.destroy(parent)

          u.task ->
            promiseState(promise).then (result) ->
              expect(result.state).toBe('rejected')
              expect(result.value).toBeAbortError()
              done()

        it 'does not abort pending requests targeting an ascendant of the given element', (done) ->
          parent = fixture('.parent')
          child = e.affix(parent, '.child')
          promise = up.render(parent, { url: '/path' })

          expect(up.network.isBusy()).toBe(true)

          up.destroy(child)

          u.task ->
            promiseState(promise).then (result) ->
              expect(result.state).toBe('pending')
              done()

    describe 'up.reload()', ->

      it 'reloads the given selector from the closest known source URL', asyncSpec (next) ->
        container = fixture('.container[up-source="/source"]')
        element = e.affix(container, '.element', text: 'old text')

        next =>
          up.reload('.element')

        next =>
          expect(@lastRequest().url).toMatch(/\/source$/)
          @respondWith """
            <div class="container">
              <div class="element">new text</div>
            </div>
            """

        next =>
          expect('.element').toHaveText('new text')

      it 'does not use a cached response', ->
        renderSpy = up.fragment.render.mock()
        element = fixture('.element[up-source="/source"]')

        up.reload(element)
        expect(renderSpy).not.toHaveBeenCalledWith(jasmine.objectContaining(cache: true))

      it 'does not reveal by default', asyncSpec (next) ->
        element = fixture('.element[up-source="/source"]', text: 'old text')

        spyOn(up, 'reveal').and.returnValue(Promise.resolve())

        next ->
          up.reload('.element')

        next =>
          @respondWithSelector('.element', text: 'new text')

        next ->
          expect('.element').toHaveText('new text')
          expect(up.reveal).not.toHaveBeenCalled()

      describe 'last modification time', ->

        it "sends an If-Modified-Since header with the fragment's timestamp so the server can render nothing if no fresher content exists", asyncSpec (next) ->
          element = fixture('.element[up-source="/source"][up-time="1445412480"]')

          up.reload(element)

          next =>
            expect(@lastRequest().url).toMatchURL('/source')
            expect(@lastRequest().requestHeaders['If-Modified-Since']).toEqual('Wed, 21 Oct 2015 07:28:00 GMT')

        it "sends no If-Modified-Since header if no timestamp is known for the fragment", asyncSpec (next) ->
          element = fixture('.element[up-source="/source"]')

          up.reload(element)

          next =>
            expect(@lastRequest().url).toMatchURL('/source')
            expect(@lastRequest().requestHeaders['If-Modified-Since']).toBeUndefined()

        - if up.migrate.loaded
          it "sends an X-Up-Reload-From-Time header with the fragment's timestamp so the server can render nothing if no fresher content exists", asyncSpec (next) ->
            element = fixture('.element[up-source="/source"][up-time="1608712106"]')

            up.reload(element)

            next =>
              expect(@lastRequest().url).toMatchURL('/source')
              expect(@lastRequest().requestHeaders['X-Up-Reload-From-Time']).toEqual('1608712106')

          it "sends an X-Up-Reload-From-Time: 0 header if no timestamp is known for the fragment", asyncSpec (next) ->
            element = fixture('.element[up-source="/source"]')

            up.reload(element)

            next =>
              expect(@lastRequest().url).toMatchURL('/source')
              expect(@lastRequest().requestHeaders['X-Up-Reload-From-Time']).toEqual('0')


      describe 'ETags', ->

        it "sends an If-None-Match header with the fragment's timestamp so the server can render nothing if no fresher content exists", asyncSpec (next) ->
          element = fixture(".element[up-source='/source'][up-etag='\"abc\"']")

          up.reload(element)

          next =>
            expect(@lastRequest().url).toMatchURL('/source')
            expect(@lastRequest().requestHeaders['If-None-Match']).toEqual('"abc"') # double quotes are part of the ETag

        it "sends no If-None-Match header if no timestamp is known for the fragment", asyncSpec (next) ->
          element = fixture('.element[up-source="/source"]')

          up.reload(element)

          next =>
            expect(@lastRequest().url).toMatchURL('/source')
            expect(@lastRequest().requestHeaders['If-None-Match']).toBeUndefined()

      it "reloads the layer's main element if no selector is given", asyncSpec (next) ->
        up.fragment.config.mainTargets = ['.element']

        fixture('.element[up-source="/source"]', text: 'old text')

        next =>
          up.reload()

        next =>
          expect(@lastRequest().url).toMatch(/\/source$/)
          expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.element')
          @respondWithSelector('.element', content: 'new text')

        next =>
          expect('.element').toHaveText('new text')

    describe 'up.fragment.source()', ->

      it 'returns the source the fragment was retrieved from', asyncSpec (next) ->
        fixture('.target')
        up.render('.target', url: '/path')
        next =>
          @respondWithSelector('.target')
        next =>
          expect(up.fragment.source(e.get '.target')).toMatchURL('/path')

      it 'returns the source of a parent fragment if the given fragment has no reloadable source', asyncSpec (next) ->
        fixture('.target')
        up.render('.target', url: '/outer')
        next =>
          @respondWith """
            <div class="target">
              <div class="inner">
                inner
              </div>
            </div>
            """
        next =>
          up.render('.inner', url: '/inner', method: 'post')

        next =>
          @respondWithSelector('.inner')

        next =>
          expect(up.fragment.source(e.get '.inner')).toMatchURL('/outer')

      it 'allows users to provide an alternate reloading URL with an [up-source] attribute', asyncSpec (next) ->
        fixture('.outer')
        up.render('.outer', url: '/outer')

        next =>
          @respondWithSelector('.outer .between[up-source="/between"] .inner')

        next =>
          expect(up.fragment.source(e.get '.outer')).toMatchURL('/outer')
          expect(up.fragment.source(e.get '.between')).toMatchURL('/between')
          expect(up.fragment.source(e.get '.inner')).toMatchURL('/between')

      it 'also accepts a CSS selector instead of an element (used e.g. by unpoly-site)', ->
        fixture('.target[up-source="/my-source"]')
        expect(up.fragment.source('.target')).toMatchURL('/my-source')

    describe 'up.fragment.failKey', ->

      it 'returns a failVariant for the given object key', ->
        result = up.fragment.failKey('foo')
        expect(result).toEqual('failFoo')

      it 'returns undefined if the given key is already prefixed with "fail"', ->
        result = up.fragment.failKey('failFoo')
        expect(result).toBeUndefined()

    describe 'up.fragment.successKey', ->

      it 'returns the unprefixed key for the given failVariant', ->
        result = up.fragment.successKey('failFoo')
        expect(result).toEqual('foo')

      it 'returns undefined if the given key is not prefixed with "fail"', ->
        result = up.fragment.successKey('foo')
        expect(result).toBeUndefined()

      it 'returns undefined for the key "fail"', ->
        result = up.fragment.successKey('fail')
        expect(result).toBeUndefined()

    describe 'up.hello()', ->

      it 'calls compilers with the given element', ->
        compiler = jasmine.createSpy('compiler')
        up.compiler('.element', compiler)
        element = fixture('.element')

        up.hello(element)
        expect(compiler).toHaveBeenCalledWith(element, jasmine.anything())

      it 'emits an up:fragment:inserted event', ->
        compiler = jasmine.createSpy('compiler')
        target = fixture('.element')
        origin = fixture('.origin')
        listener = jasmine.createSpy('up:fragment:inserted listener')
        target.addEventListener('up:fragment:inserted', listener)

        up.hello(target, { origin })

        expectedEvent = jasmine.objectContaining({ origin, target })
        expect(listener).toHaveBeenCalledWith(expectedEvent)

      it "sets up.layer.current to the given element's layer while compilers are running", asyncSpec (next) ->
        layerSpy = jasmine.createSpy('layer spy')
        up.compiler('.foo', -> layerSpy(up.layer.current))
        makeLayers(2)

        next ->
          rootElement = fixture('.foo.in-root')
          overlayElement = up.layer.get(1).affix('.foo.in-overlay')

          up.hello(rootElement)
          up.hello(overlayElement)

          expect(layerSpy.calls.count()).toBe(2)

          expect(layerSpy.calls.argsFor(0)[0]).toBe up.layer.get(0)
          expect(layerSpy.calls.argsFor(1)[0]).toBe up.layer.get(1)

      it 'keeps up.layer.current and does not crash when compiling a detached element (bugfix)', asyncSpec (next) ->
        layerSpy = jasmine.createSpy('layer spy')
        up.compiler('.foo', -> layerSpy(up.layer.current))
        makeLayers(2)

        next ->
          expect(up.layer.current.isOverlay()).toBe(true)

          element = up.element.createFromSelector('.foo')
          compileFn = -> up.hello(element)

          expect(compileFn).not.toThrowError()
          expect(layerSpy.calls.argsFor(0)[0]).toBe up.layer.current

    describe 'up.fragment.toTarget', ->

      it "prefers using the element's 'up-id' attribute to using the element's ID", ->
        element = fixture('div[up-id=up-id-value]#id-value')
        expect(up.fragment.toTarget(element)).toBe('[up-id="up-id-value"]')

      it "prefers using the element's ID to using the element's name", ->
        element = fixture('div#id-value[name=name-value]')
        expect(up.fragment.toTarget(element)).toBe("#id-value")

      it "selects the ID with an attribute selector if the ID contains a slash", ->
        element = fixture('div')
        element.setAttribute('id', 'foo/bar')
        expect(up.fragment.toTarget(element)).toBe('[id="foo/bar"]')

      it "selects the ID with an attribute selector if the ID contains a space", ->
        element = fixture('div')
        element.setAttribute('id', 'foo bar')
        expect(up.fragment.toTarget(element)).toBe('[id="foo bar"]')

      it "selects the ID with an attribute selector if the ID contains a dot", ->
        element = fixture('div')
        element.setAttribute('id', 'foo.bar')
        expect(up.fragment.toTarget(element)).toBe('[id="foo.bar"]')

      it "selects the ID with an attribute selector if the ID contains a quote", ->
        element = fixture('div')
        element.setAttribute('id', 'foo"bar')
        expect(up.fragment.toTarget(element)).toBe('[id="foo\\"bar"]')

      it "prefers using the element's class to using the element's tag name", ->
        element = fixture('div.class')
        expect(up.fragment.toTarget(element)).toBe(".class")

      it 'does not use Unpoly classes to compose a class selector', ->
        element = fixture('div.up-current.class')
        expect(up.fragment.toTarget(element)).toBe(".class")

      it 'does not use classes matching a string in up.fragment.config.badTargetClasses', ->
        up.fragment.config.badTargetClasses.push('foo')
        element = fixture('div.foo.bar')
        expect(up.fragment.toTarget(element)).toBe(".bar")

      it 'does not use classes matching a RegExp in up.fragment.config.badTargetClasses', ->
        up.fragment.config.badTargetClasses.push(/^fo+$/)
        element = fixture('div.fooooo.bar')
        expect(up.fragment.toTarget(element)).toBe(".bar")

      it 'uses all classes of an element (to match a BEM block that is identified by a modifier)', ->
        element = fixture('div.class1.class2')
        expect(up.fragment.toTarget(element)).toBe(".class1.class2")

      it 'escapes colons in class names', ->
        element = fixture('div')
        element.classList.add('block')
        element.classList.add('sm:hidden')
        expect(up.fragment.toTarget(element)).toBe(".block.sm\\:hidden")

      it "prefers using the element's [name] attribute to only using the element's tag name", ->
        element = fixture('input[name=name-value]')
        expect(up.fragment.toTarget(element)).toBe('input[name="name-value"]')

      it "refers to meta tags by both tag name and [name] attribute", ->
        element = fixture('meta[name="csrf-token"]')
        expect(up.fragment.toTarget(element)).toBe('meta[name="csrf-token"]')

      it "uses the tag name of a unique element", ->
        expect(up.fragment.toTarget(document.body)).toBe("body")

      it "uses the tag name of a unique element even if it has a class", ->
        document.body.classList.add('some-custom-class')
        expect(up.fragment.toTarget(document.body)).toBe("body")
        document.body.classList.remove('some-custom-class')

      it 'does not use the tag name of a non-unique element', ->
        div = fixture('div')
        deriveTarget = -> up.fragment.toTarget(div)
        expect(deriveTarget).toThrowError(/cannot derive/i)

      it 'uses "link[rel=canonical]" for such a link', ->
        link = fixture('link.some-class[rel="canonical"][href="/foo"]')
        expect(up.fragment.toTarget(link)).toBe('link[rel="canonical"]')

      it 'uses "up-modal-viewport" for such an element, so that viewport can get a key to save scrollTops', ->
        link = fixture('up-modal-viewport')
        expect(up.fragment.toTarget(link)).toBe('up-modal-viewport')

      it 'throws an error if no good selector is available', ->
        element = fixture('p')
        deriveTarget = -> up.fragment.toTarget(element)
        expect(deriveTarget).toThrowError(/cannot derive good target selector from a <p> element without identifying attributes/i)

      it 'escapes quotes in attribute selector values', ->
        element = fixture('input')
        element.setAttribute('name', 'foo"bar')
        expect(up.fragment.toTarget(element)).toBe('input[name="foo\\"bar"]')

      it 'lets users configure custom deriver patterns in up.fragment.config.targetDerivers', ->
        element = fixture('div.foo[custom-attr=value]')
        expect(up.fragment.toTarget(element)).toBe('.foo')

        up.fragment.config.targetDerivers.unshift('*[custom-attr]')

        expect(up.fragment.toTarget(element)).toBe('div[custom-attr="value"]')

      it 'lets users configure custom deriver functions in up.fragment.config.targetDerivers', ->
        element = fixture('div.foo[custom-attr=value]')
        expect(up.fragment.toTarget(element)).toBe('.foo')

        up.fragment.config.targetDerivers.unshift (element) -> e.attrSelector('custom-attr', element.getAttribute('custom-attr'))

        expect(up.fragment.toTarget(element)).toBe('[custom-attr="value"]')

      it "does not use a derived target that would match a different element", ->
        element1 = fixture('div#foo.foo')
        element2 = fixture('div#foo.bar')

        expect(up.fragment.toTarget(element2)).toBe('.bar')

      it "uses a derived target that would match a different element with up.fragment.config.verifyDerivedTarget = false", ->
        element1 = fixture('div#foo.foo')
        element2 = fixture('div#foo.bar')

        expect(up.fragment.config.verifyDerivedTarget).toBe(true)
        expect(up.fragment.toTarget(element2)).toBe('.bar')

        up.fragment.config.verifyDerivedTarget = false
        expect(up.fragment.toTarget(element2)).toBe('#foo')

      it "uses a derived target that would match a different element if the given element is detached", ->
        element1 = fixture('div#foo.foo')
        element2 = up.element.createFromSelector('div#foo.bar')

        expect(up.fragment.config.verifyDerivedTarget).toBe(true)
        expect(up.fragment.toTarget(element2)).toBe('#foo')

    describe 'up.fragment.expandTargets', ->

      beforeEach ->
        up.layer.config.any.mainTargets = []
        up.layer.config.overlay.mainTargets = []

      it 'returns a list of simple selectors without changes', ->
        targets = ['.foo', '.bar']
        expanded = up.fragment.expandTargets(targets, layer: up.layer.root)
        expect(expanded).toEqual ['.foo', '.bar']

      it "expands ':main' to the given layer mode's main targets", ->
        targets = ['.before', ':main', '.after']
        up.layer.config.root.mainTargets = ['.main1', '.main2']
        expanded = up.fragment.expandTargets(targets, layer: up.layer.root)
        expect(expanded).toEqual ['.before', '.main1', '.main2', '.after']

      it "expands true to the given layer mode's main targets (useful because { fallback } is often passed as a target)", ->
        targets = ['.before', true, '.after']
        up.layer.config.root.mainTargets = ['.main1', '.main2']
        expanded = up.fragment.expandTargets(targets, layer: up.layer.root)
        expect(expanded).toEqual ['.before', '.main1', '.main2', '.after']

      it "expands ':layer' to a selector for the given layer's first swappable element", ->
        targets = ['.before', ':layer', '.after']
        expanded = up.fragment.expandTargets(targets, layer: up.layer.root)
        expect(expanded).toEqual ['.before', 'body', '.after']

      it "expands ':main' to the given layer mode's main targets if a main target is itself ':layer'", ->
        targets = ['.before', ':main', '.after']
        up.layer.config.root.mainTargets = [':layer']
        expanded = up.fragment.expandTargets(targets, layer: up.layer.root)
        expect(expanded).toEqual ['.before', 'body', '.after']

      it 'expands an element to a matching selector', ->
        element = fixture('#foo')
        targets = ['.before', element, '.after']
        expanded = up.fragment.expandTargets(targets, layer: up.layer.root)
        expect(expanded).toEqual ['.before', '#foo', '.after']

      it "it expands ':origin' to a selector for { origin }", ->
        targets = ['.before', ':origin .child', '.after']
        origin = fixture('#foo')
        up.layer.config.root.mainTargets = [':layer']
        expanded = up.fragment.expandTargets(targets, layer: up.layer.root, origin: origin)
        expect(expanded).toEqual ['.before', '#foo .child', '.after']

      it "it expands '&' to a selector for { origin }", ->
        targets = ['.before', '& .child', '.after']
        origin = fixture('#foo')
        up.layer.config.root.mainTargets = [':layer']
        expanded = up.fragment.expandTargets(targets, layer: up.layer.root, origin: origin)
        expect(expanded).toEqual ['.before', '#foo .child', '.after']

      it 'removes duplicate selectors', ->
        targets = ['.foo', ':main']
        up.layer.config.root.mainTargets = ['.foo']
        expanded = up.fragment.expandTargets(targets, layer: up.layer.root)
        expect(expanded).toEqual ['.foo']

    describe 'up.fragment.config.mainTargets', ->

      it 'gets up.layer.config.any.mainTargets', ->
        up.layer.config.any.mainTargets = ['.my-special-main-target']
        expect(up.fragment.config.mainTargets).toEqual ['.my-special-main-target']

      it 'sets up.layer.config.any.mainTargets', ->
        up.fragment.config.mainTargets = ['.new-target']
        expect(up.layer.config.any.mainTargets).toEqual ['.new-target']

    describe 'up.context', ->

      it 'gets up.layer.current.context', ->
        up.layer.current.context = { key: 'value' }
        expect(up.context).toEqual { key: 'value' }

      it 'sets up.layer.current.context', ->
        up.context = { key: 'newValue' }
        expect(up.layer.current.context).toEqual { key: 'newValue' }

    describe 'up.fragment.time', ->

      it 'returns an [up-time] timestamp of the given element', ->
        element = fixture('.element[up-time="1445412480"]')
        expect(up.fragment.time(element)).toEqual(new Date('Wed, 21 Oct 2015 07:28:00 GMT'))

      it 'returns an [up-time] timestamp of an ancestor', ->
        parent = fixture('.parent[up-time="1445412480"]')
        element = e.affix(parent, '.element')
        expect(up.fragment.time(element)).toEqual(new Date('Wed, 21 Oct 2015 07:28:00 GMT'))

      it "returns undefined and ignores ancestor's [up-time] if the element itself has [up-time=false], indicating that the response had no Last-Modified header", ->
        parent = fixture('.parent[up-time="1445412480"]')
        element = e.affix(parent, '.element[up-time=false]')
        expect(up.fragment.time(element)).toBeUndefined()

      it "returns undefined if there is no [up-time] value in the element's ancestry", ->
        parent = fixture('.parent')
        element = e.affix(parent, '.element')
        expect(up.fragment.time(element)).toBeUndefined()

      it 'returns an [up-time] value seriaized in RFC 1123 format', ->
        element = fixture('.element[up-source="/source"][up-time="Wed, 21 Oct 2015 07:28:00 GMT"]')
        expect(up.fragment.time(element)).toEqual(new Date('Wed, 21 Oct 2015 07:28:00 GMT'))

    describe 'up.fragment.etag', ->

      it 'returns the [up-etag] value of the given element', ->
        element = fixture(".element[up-etag='\"abc\"']")
        expect(up.fragment.etag(element)).toEqual('"abc"')

      it 'returns the [up-etag] value of an ancestor', ->
        parent = fixture(".parent[up-etag='\"abc\"']")
        element = e.affix(parent, '.element')
        expect(up.fragment.etag(element)).toEqual('"abc"')

      it "returns undefined if there is no [up-etag] value in the element's ancestry", ->
        parent = fixture(".parent")
        element = e.affix(parent, '.element')
        expect(up.fragment.etag(element)).toBeUndefined()

      it "returns undefined and ignores ancestor's [up-etag] if the element itself has [up-time=etag], indicating that the response had no ETag header", ->
        parent = fixture(".parent[up-etag='\"abc\"']")
        element = e.affix(parent, '.element[up-etag=false]')
        expect(up.fragment.etag(element)).toBeUndefined()

    describe 'up.fragment.abort()', ->

      beforeEach (done) ->
        layerHTML = """
          <div class='parent' id='parent0'>
            <div class='child' id='parent0-child'></div>
          </div>
          <div class='parent' id='parent1'>
            <div class='child' id='parent1-child'></div>
          </div>
          """

        @layers = makeLayers [
          { content: layerHTML },
          { content: layerHTML },
        ]

        @layer0Parent0ChildRequest = up.request('/path/a', layer: @layers[0], target: '#parent0-child')
        @layer0Parent1ChildRequest = up.request('/path/b', layer: @layers[0], target: '#parent1-child')
        @layer1Parent0ChildRequest = up.request('/path/c', layer: @layers[1], target: '#parent0-child')
        @layer1Parent1ChildRequest = up.request('/path/d', layer: @layers[1], target: '#parent1-child')

        u.task(done)

      describe 'without an argument', ->

        it 'aborts requests for the current layer', ->
          up.fragment.abort()

          expect(@layer0Parent0ChildRequest.state).toBe('loading')
          expect(@layer0Parent1ChildRequest.state).toBe('loading')
          expect(@layer1Parent0ChildRequest.state).toBe('aborted')
          expect(@layer1Parent1ChildRequest.state).toBe('aborted')

        it "also aborts requests outside the layer's main element", asyncSpec (next) ->
          e.affix(up.layer.element, '#outside-main')
          outsideRequest = up.request('/path/e', layer: up.layer.element, target: '#outside-main')

          next ->
            up.fragment.abort()

            expect(outsideRequest.state).toBe('aborted')

        describe 'with { layer } option', ->

          it 'aborts requests on the given layer', ->
            up.fragment.abort(layer: 'root')

            expect(@layer0Parent0ChildRequest.state).toBe('aborted')
            expect(@layer0Parent1ChildRequest.state).toBe('aborted')
            expect(@layer1Parent0ChildRequest.state).toBe('loading')
            expect(@layer1Parent1ChildRequest.state).toBe('loading')

        describe 'with { layer: "any" }', ->

          it 'aborts requests on all layers', ->
            up.fragment.abort(layer: 'any')

            expect(@layer0Parent0ChildRequest.state).toBe('aborted')
            expect(@layer0Parent1ChildRequest.state).toBe('aborted')
            expect(@layer1Parent0ChildRequest.state).toBe('aborted')
            expect(@layer1Parent1ChildRequest.state).toBe('aborted')

      describe 'with an element', ->

        it "aborts requests targeting given element's subtree", ->
          layer0Parent0 = up.fragment.get('#parent0', layer: 0)

          up.fragment.abort(layer0Parent0)

          expect(@layer0Parent0ChildRequest.state).toBe('aborted')
          expect(@layer0Parent1ChildRequest.state).toBe('loading')
          expect(@layer1Parent0ChildRequest.state).toBe('loading')
          expect(@layer1Parent1ChildRequest.state).toBe('loading')

      describe 'with a list of elements', ->

        it "aborts requests targeting any of the given elements' subtrees", ->
          layer0Parent0 = up.fragment.get('#parent0', layer: 0)
          layer0Parent1 = up.fragment.get('#parent1', layer: 0)

          up.fragment.abort([layer0Parent0, layer0Parent1])

          expect(@layer0Parent0ChildRequest.state).toBe('aborted')
          expect(@layer0Parent1ChildRequest.state).toBe('aborted')
          expect(@layer1Parent0ChildRequest.state).toBe('loading')
          expect(@layer1Parent1ChildRequest.state).toBe('loading')

      describe 'with a selector', ->

        it "matches the selector in the current layer and aborts requests within that subtree", ->
          up.fragment.abort('.parent')

          expect(@layer0Parent0ChildRequest.state).toBe('loading')
          expect(@layer0Parent1ChildRequest.state).toBe('loading')
          expect(@layer1Parent0ChildRequest.state).toBe('aborted')
          expect(@layer1Parent1ChildRequest.state).toBe('aborted')

        describe 'with { layer } option', ->

          it 'resolves the selector on another layer', ->
            up.fragment.abort('.parent', layer: 'root')

            expect(@layer0Parent0ChildRequest.state).toBe('aborted')
            expect(@layer0Parent1ChildRequest.state).toBe('aborted')
            expect(@layer1Parent0ChildRequest.state).toBe('loading')
            expect(@layer1Parent1ChildRequest.state).toBe('loading')

      describe 'with { reason } option', ->

        it 'aborts the request with the given reason', (done) ->
          up.fragment.abort('#parent0', reason: 'Given reason')

          promiseState(@layer1Parent0ChildRequest).then ({ state, value }) ->
            expect(state).toBe('rejected')
            expect(value).toBeAbortError(/Given reason/)
            done()

    describe 'up.fragment.onAborted()', ->

      it "runs the callback when the fragment is aborted", ->
        fragment = fixture('.fragment')
        callback = jasmine.createSpy('aborted callback')
        up.fragment.onAborted(fragment, callback)
        expect(callback).not.toHaveBeenCalled()

        up.fragment.abort(fragment)

        expect(callback).toHaveBeenCalled()

      it "runs the callback when the fragment's ancestor is aborted", ->
        ancestor = fixture('.ancestor')
        fragment = e.affix(ancestor, '.fragment')
        callback = jasmine.createSpy('aborted callback')
        up.fragment.onAborted(fragment, callback)
        expect(callback).not.toHaveBeenCalled()

        up.fragment.abort(ancestor)

        expect(callback).toHaveBeenCalled()

      it "runs the callback when the fragment's descendant is aborted", ->
        fragment = fixture('.fragment')
        descendant = e.affix(fragment, '.descendant')
        callback = jasmine.createSpy('aborted callback')
        up.fragment.onAborted(fragment, callback)
        expect(callback).not.toHaveBeenCalled()

        up.fragment.abort(descendant)

        expect(callback).not.toHaveBeenCalled()

      it 'returns a callback that stops the event listener', ->
        fragment = fixture('.fragment')
        callback = jasmine.createSpy('aborted callback')
        unsubscribe = up.fragment.onAborted(fragment, callback)

        unsubscribe()
        up.fragment.abort(fragment)

        expect(callback).not.toHaveBeenCalled()

  describe 'up.fragment.parseTargetSteps()', ->

    it 'parses a single target', ->
      steps = up.fragment.parseTargetSteps('.one')
      expect(steps).toEqual [
        jasmine.objectContaining(selector: '.one')
      ]

    it 'parses multiple targets', ->
      steps = up.fragment.parseTargetSteps('.one, .two')
      expect(steps).toEqual [
        jasmine.objectContaining(selector: '.one'),
        jasmine.objectContaining(selector: '.two'),
      ]

    it 'does not parse any steps from a :none target', ->
      steps = up.fragment.parseTargetSteps(':none')
      expect(steps).toEqual []

    it 'ignores a :none target in a union of other targets', ->
      steps = up.fragment.parseTargetSteps('.one, :none, .two')
      expect(steps).toEqual [
        jasmine.objectContaining(selector: '.one'),
        jasmine.objectContaining(selector: '.two'),
      ]

    it 'sets a default placement of "swap"', ->
      steps = up.fragment.parseTargetSteps('.one')
      expect(steps).toEqual [
        jasmine.objectContaining(selector: '.one', placement: 'swap')
      ]

    it 'parses a prepending placement from :before (single colon)', ->
      steps = up.fragment.parseTargetSteps('.one:before, .two')
      expect(steps).toEqual [
        jasmine.objectContaining(selector: '.one', placement: 'before'),
        jasmine.objectContaining(selector: '.two', placement: 'swap'),
      ]

    it 'parses a prepending placement from ::before (double colon)', ->
      steps = up.fragment.parseTargetSteps('.one::before, .two')
      expect(steps).toEqual [
        jasmine.objectContaining(selector: '.one', placement: 'before'),
        jasmine.objectContaining(selector: '.two', placement: 'swap'),
      ]

    it 'parses an append placement from :after (single colon)', ->
      steps = up.fragment.parseTargetSteps('.one, .two:after')
      expect(steps).toEqual [
        jasmine.objectContaining(selector: '.one', placement: 'swap'),
        jasmine.objectContaining(selector: '.two', placement: 'after'),
      ]

    it 'parses an append placement from ::after (double colon)', ->
      steps = up.fragment.parseTargetSteps('.one, .two::after')
      expect(steps).toEqual [
        jasmine.objectContaining(selector: '.one', placement: 'swap'),
        jasmine.objectContaining(selector: '.two', placement: 'after'),
      ]

    it 'parses an optional target from :maybe', ->
      steps = up.fragment.parseTargetSteps('.one, .two:maybe')
      expect(steps).toEqual [
        jasmine.objectContaining(selector: '.one', maybe: false),
        jasmine.objectContaining(selector: '.two', maybe: true),
      ]

    it 'parses multiple pseudo elements in the same target', ->
      steps = up.fragment.parseTargetSteps('.one:maybe:before')
      expect(steps).toEqual [
        jasmine.objectContaining(selector: '.one', maybe: true, placement: 'before'),
      ]

