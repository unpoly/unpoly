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

          result = up.fragment.get('.element')

          expect(result).toEqual(elementWithinContainer)

        it 'returns a second Element argument unchanged, even if its not a descendant of the given root', ->
          root = fixture('.root')
          element = fixture('.element')

          result = up.fragment.get(root, element)

          expect(result).toBe(element)

      describe 'layers', ->

        it 'matches elements in the given { layer }', asyncSpec (next) ->
          makeLayers [{ target: '.element' }, { target: '.element' }]

          next ->
            expect(up.layer.stack.length).toBe(2)
            result = up.fragment.get('.element', layer: 'root')

            expect(up.layer.get(result)).toBe(up.layer.get(0))

        it 'matches elements in the current layer if no { layer } option is given', asyncSpec (next) ->
          makeLayers [{ target: '.element' }, { target: '.element' }]

          next ->
            expect(up.layer.stack.length).toBe(2)
            result = up.fragment.get('.element')

            expect(up.layer.get(result)).toBe(up.layer.get(1))

      describe 'matching around the { origin }', ->

        it 'prefers to match an element closest to origin', asyncSpec (next) ->
          root = fixture('.element#root')
          one = e.affix(root, '.element', text: 'old one')
          two = e.affix(root, '.element', text: 'old two')
          childOfTwo = e.affix(two, '.origin')
          three = e.affix(root, '.element', text: 'old three')

          result = up.fragment.get('.element', origin: childOfTwo)

          expect(result).toBe(two)

        it 'prefers to match a descendant selector in the vicinity of the origin', asyncSpec (next) ->
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


        it "only matches descendants in that root's layer", asyncSpec (next) ->
          makeLayers [
            { '.element', content: 'element in root layer' }
            { '.element', content: 'element in modal layer' }
          ]

          next ->
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
        $grandMother = $fixture('.match')
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

      it 'returns missing if an ancestor matches, but is in another layer', asyncSpec (next) ->
        makeLayers(2)

        next ->
          start = up.layer.element
          result = up.fragment.closest(start, 'body')
          expect(result).toBeMissing()

    describe 'up.render()', ->

      beforeEach ->
        up.motion.config.enabled = false

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

        describeFallback 'canPushState', ->

          it 'makes a full page load', asyncSpec (next) ->
            spyOn(up.browser, 'loadPage')
            up.render('.selector', url: '/path')

            next =>
              expect(up.browser.loadPage).toHaveBeenCalledWith(jasmine.objectContaining(url: '/path'))

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

          it "doesn't crash and rejects the returned promise", (done) ->
            fixture('.target')
            promise = up.render('.target', url: '/path')

            u.task =>
              promiseState(promise).then (result) =>
                expect(result.state).toEqual('pending')
                @lastRequest().responseError()
                u.task =>
                  promiseState(promise).then (result) =>
                    expect(result.state).toEqual('rejected')
                    done()

        describe 'interrupting the change', ->

          it 'emits an up:fragment:loaded event that contains information about the request, response and render options', asyncSpec (next) ->
            fixture('.target')
            event = undefined
            up.on 'up:fragment:loaded', (e) -> event = e

            up.render(target: '.target', url: '/url', location: '/location-from-option', peel: false)

            next =>
              @respondWith('text from server')

            next ->
              expect(event).toBeGiven()
              expect(event.request.url).toMatchURL('/url')
              expect(event.response.text).toContain('text from server')
              expect(event.renderOptions.peel).toBe(false)
              expect(event.renderOptions.location).toMatchURL('/location-from-option')

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

            up.on('up:fragment:loaded', (e) -> e.renderOptions.target = '.three')

            changePromise = up.render(target: '.one', failTarget: '.two', url: '/url')

            next =>
              @respondWith
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
              expect(result.value).toMatch(/Could not match targets/i)
              done()

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
              expect(result.value).toMatch(/Could not match targets/i)
              done()

      describe 'choice of target', ->

        it 'uses a selector given as { target } option'

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
              expect(result.value).toMatch(/Could not match targets/i)
              done()

        it "ignores an element that matches the selector but also has a parent matching .up-destroying", (done) ->
          document = '<div class="foo-bar">text</div>'
          $parent = $fixture('.up-destroying')
          $child = $fixture('.foo-bar').appendTo($parent)
          promise = up.render('.foo-bar', { document })

          u.task ->
            promiseState(promise).then (result) =>
              expect(result.state).toEqual('rejected')
              expect(result.value).toMatch(/Could not match targets/i)
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

        it 'prepends instead of replacing when the target has a :before pseudo-selector', asyncSpec (next) ->
          target = fixture('.target')
          e.affix(target, '.child', text: 'old')
          up.render('.target:before', document: """
            <div class='target'>
              <div class='child'>new</div>
            </div>"
            """
          )

          next =>
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

          next =>
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
          next =>
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

          next =>
            expect($('.before')).toHaveText('old-before')
            expect($('.middle')).toHaveText('new-middle')
            expect($('.after')).toHaveText('new-after')

        describe 'matching old fragments around the origin', ->

          it 'prefers to match an element closest to origin', asyncSpec (next) ->
            root = fixture('.element#root')
            one = e.affix(root, '.element', text: 'old one')
            two = e.affix(root, '.element', text: 'old two')
            childOfTwo = e.affix(two, '.origin')
            three = e.affix(root, '.element', text: 'old three')

            up.render('.element', origin: childOfTwo, content: 'new text')

            next =>
              elements = e.all('.element')
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
              children = e.all('.child')

              expect(children.length).toBe(4)

              expect(children[0]).toHaveText('old element1Child1')
              expect(children[1]).toHaveText('old element1Child2')

              expect(children[2]).toHaveText('old element2Child1')
              expect(children[3]).toHaveText('new text')

          it 'considers an Element argument to be the origin if no { origin } is given', asyncSpec (next) ->
            root = fixture('.element#root')
            one = e.affix(root, '.element', text: 'old one')
            two = e.affix(root, '.element', text: 'old two')
            three = e.affix(root, '.element', text: 'old three')

            up.render(two, content: 'new text')

            next =>
              elements = e.all('.element')
              expect(elements.length).toBe(4)

              # While #root is an ancestor, two was closer
              expect(elements[0]).toMatchSelector('#root')

              # One is a sibling of two
              expect(elements[1]).toHaveText('old one')

              # Two is the closest match around the origin (childOfTwo)
              expect(elements[2]).toHaveText('new text')

              # Three is a sibling of three
              expect(elements[3]).toHaveText('old three')


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
                  expect(result.value).toBeError(/Could not match targets/i)
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
                expect(e).toBeError(/Could not match targets/i)
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
                expect(e).toBeError(/Could not match targets/i)
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
              expect(e).toBeError(/Could not match targets/i)
              done()

      describe 'choice of layer', ->

        it 'updates the layer given as { layer } option', asyncSpec (next) ->
          makeLayers [
            { target: '.element', content: 'old text in root' }
            { target: '.element', content: 'old text in modal' }
          ]

          next ->
            up.render('.element', content: 'new text', layer: 'root', peel: false)

          next ->
            expect(up.layer.get(0)).toHaveText(/new text/)
            expect(up.layer.get(1)).toHaveText(/old text in modal/)

        it 'updates the layer of the given target, if the target is given as an element (and not a selector)'

        it 'opens a new layer when given { layer: "new" }'

        it 'allows to pass the mode for the new layer as { layer } (as a shortcut)'

        it 'opens a new layer if given a { mode } but no { layer }'

        describe 'if nothing else is specified', ->

          it 'updates the current layer', asyncSpec (next) ->
            makeLayers [
              { target: '.element', content: 'old text in root' }
              { target: '.element', content: 'old text in modal' }
            ]

            next ->
              up.render('.element', content: 'new text', peel: false)

            next ->
              expect(up.layer.get(0)).toHaveText(/old text in root/)
              expect(up.layer.get(1)).toHaveText(/new text/)

          it 'rejects if the current layer does not match', (done) ->
            makeLayers [
              { target: '.element', content: 'old text in root' }
              { target: '.other', content: 'old text in modal1' }
            ]

            u.task ->
              promise = up.render('.element', content: 'new text')

              u.task ->
                promiseState(promise).then (result) ->
                  expect(result.state).toBe('rejected')
                  done()

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

            it 'does not add an history entry when updating a non-main targets', asyncSpec (next) ->
              up.fragment.config.mainTargets = ['.other']
              fixture('.target')
              promise = up.render('.target', url: '/path4', history: 'auto')

              next =>
                @respondWithSelector('.target')
                next.await(promise)
              next =>
                expect(location.href).toMatchURL(@locationBeforeExample)

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

            it 'is emited when the location changed', asyncSpec (next) ->
              history.replaceState?({}, 'original title', '/original-url')
              fixture('.target')

              listener = jasmine.createSpy('event listener')
              up.on('up:layer:location:changed', listener)

              next ->
                up.render(target: '.target', location: '/new-url', content: 'new content', history: true)

              next ->
                expect(listener.calls.argsFor(0)[0]).toBeEvent('up:layer:location:changed', { location: '/new-url' })

            it 'is not emitted when the location did not change', asyncSpec (next) ->
              up.layer.open(target: '.target', location: '/original-layer-url', content: 'old overlay text')
              listener = jasmine.createSpy('event listener')
              up.on('up:layer:location:changed', listener)

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

          next ->
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

          next ->
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
          spyOn(up.element, 'isSingleton').and.callFake (element) -> e.matches(element, 'fake-body')

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

          next.after 100, ->
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

          next.after 100, ->
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

          next.after 50, ->
            expect(onFinishedSpy.calls.count()).toBe(1)

        it 'attaches the new element to the DOM before compilers are called, so they can see their parents and trigger bubbling events', asyncSpec (next)->
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
            swapDirectlySpy = up.motion.knife.mock('swapElementsDirectly')
            $fixture('.element').text('version 1')
            up.render(
              fragment: '<div class="element">version 2</div>',
              transition: false
            )

            next =>
              expect(swapDirectlySpy).toHaveBeenCalled()

      describe 'scrolling', ->

        mockReveal = ->
          beforeEach ->
            @revealedHTML = []
            @revealedText = []
            @revealOptions = {}

            @revealMock = spyOn(up, 'reveal').and.callFake (element, options) =>
              @revealedHTML.push element.outerHTML
              @revealedText.push element.textContent.trim()
              @revealOptions = options
              Promise.resolve()

        describe 'with { scroll: false }', ->

          mockReveal()

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

          mockReveal()

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

          mockReveal()

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
            up.render('.target', url: '/path#two', scroll: 'hash')

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

              up.render('.target', url: '/path#three', scroll: 'hash')

            next =>
              @respondWith(html)

            next =>
              expect(@revealedText).toEqual ['two', 'three']

          it "does not scroll if there is no element with the ID of that #hash", asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path#hash', scroll: 'hash')

            next =>
              @respondWithSelector('.target')

            next =>
              expect(@revealMock).not.toHaveBeenCalled()


        describe 'when the server responds with an error code', ->

          mockReveal()

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

          mockReveal()

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

        describe 'with { scroll: "reset" } option', ->

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
            fixture('.target')
            up.render('.target', url: '/path')

            next =>
              @respondWith """
                <div class="target">
                  <script type="text/javascript">
                    alert("foo")
                    window.scriptTagExecuted()
                  </script>
                </div>
              """

            next.after 100, =>
              expect(window.scriptTagExecuted).not.toHaveBeenCalled()
              expect(document).toHaveSelector('.target')
              expect(document).not.toHaveSelector('.target script')

          it 'does not crash when the new fragment contains inline script tag that is followed by another sibling (bugfix)', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path')

            next =>
              @respondWith """
                <div class="target">
                  <div>before</div>
                  <script type="text/javascript">
                    window.scriptTagExecuted()
                  </script>
                  <div>after</div>
                </div>
                """

            next =>
              expect(window.scriptTagExecuted).not.toHaveBeenCalled()
              expect(document).toHaveSelector('.target')
              expect(document).not.toHaveSelector('.target script')

        describe 'linked scripts', ->

          beforeEach ->
            # Add a cache-buster to each path so the browser cache is guaranteed to be irrelevant
            @linkedScriptPath = "/assets/fixtures/linked_script.js?cache-buster=#{Math.random().toString()}"

          it 'does not execute linked scripts to prevent re-inclusion of javascript inserted before the closing body tag', asyncSpec (next) ->
            fixture('.target')
            up.render('.target', url: '/path')

            next =>
              @respondWith """
                <div class="target">
                  <script type="text/javascript" src="#{@linkedScriptPath}"></script>
                </div>
                """

            next =>
              expect(window.scriptTagExecuted).not.toHaveBeenCalled()
              expect(document).toHaveSelector('.target')
              expect(document).not.toHaveSelector('.target script')

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
          up.element.knife.mock('isSingleton').and.callFake (element) -> e.matches(element, '.container')
          destructor = jasmine.createSpy('destructor')
          up.$compiler '.container', -> destructor
          $container = $fixture('.container')
          up.hello($container)

          # Need to pass a { target } and not use { fragment }, since e.toSelector() ignores
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
            fixture('.foo-bar')
            up.render focus: 'autofocus', fragment: """
              <form class='foo-bar'>
                <input class="autofocused-input" autofocus>
              </form>
            """

            next =>
              expect('.autofocused-input').toBeFocused()

        describe 'with { focus: "target" }', ->

          it 'focuses the new fragment', asyncSpec (next) ->
            fixture('.foo-bar')
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

        describe 'with a CSS selector as { focus } option', ->

          it 'focuses a matching element within the new fragment', asyncSpec (next) ->
            fixture('.foo-bar')
            up.render focus: '.input', fragment: """
              <form class='foo-bar'>
                <input class='input'>
              </form>
            """

            next =>
              expect('.input').toBeFocused()

          it 'focuses a matching element in the same layer', asyncSpec (next) ->
            fixture('.foo-bar')

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
              expect('.focused').toBeFocused()

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
            oldFocused = e.affix(container, 'textarea[wrap=off][rows=3][cols=6]', text: longText)

            oldFocused.selectionStart = 10
            oldFocused.selectionEnd = 11
            oldFocused.scrollTop = 12
            oldFocused.scrollLeft = 13
            oldFocused.focus()

            expect(oldFocused).toBeFocused()
            expect(oldFocused.selectionStart).toBe(10)
            expect(oldFocused.selectionEnd).toBe(11)
            expect(oldFocused.scrollTop).toBe(12)
            expect(oldFocused.scrollLeft).toBe(13)

            up.render('.container', focus: 'keep', content: "<textarea wrap='off' rows='2' cols='2'>#{longText}</textarea>")

            next ->
              textarea = document.querySelector('.container textarea')
              expect(textarea.selectionStart).toBe(10)
              expect(textarea.selectionEnd).toBe(11)
              expect(textarea.scrollTop).toBe(12)
              expect(textarea.scrollLeft).toBe(13)
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

      describe 'with { solo } option', ->

        it 'aborts the request of an existing change', asyncSpec (next) ->
          fixture('.element')

          change1Error  = undefined
          change1Promise = undefined
          change2Promise = undefined

          change1Promise = up.render('.element', url: '/path1', solo: true).catch (e) -> change1Error = e

          next =>
            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.render('.element', url: '/path2', solo: true)

          next =>
            expect(change1Error).toBeError(/aborted/)
            expect(up.network.queue.allRequests.length).toEqual(1)

        it 'aborts the request of an existing change if the new change is made from local content', asyncSpec (next) ->
          fixture('.element')

          change1Error  = undefined
          change1Promise = undefined
          change2Promise = undefined

          change1Promise = up.render('.element', url: '/path1', solo: true).catch (e) -> change1Error = e

          next =>
            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.render('.element', content: 'local content', solo: true)

          next =>
            expect(change1Error).toBeError(/aborted/)
            expect(up.network.queue.allRequests.length).toEqual(0)

        it "does not abort an existing change's request when preloading", asyncSpec (next) ->
          fixture('.element')

          change1Error  = undefined
          change1Promise = undefined
          change2Promise = undefined

          change1Promise = up.render('.element', url: '/path1', solo: true).catch (e) -> change1Error = e

          next =>
            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.render('.element', url: '/path2', preload: true, solo: true)

          next =>
            expect(change1Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(2)

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

            change2Promise = up.render('.element', url: '/path', solo: true, cache: true)
            change2Promise.catch (e) -> change2Error = e

          next =>
            expect(change1Error).toBeUndefined()
            expect(change2Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(1)

        it "aborts an existing change's request that was queued with { solo: false }", asyncSpec (next) ->
          fixture('.element')

          change1Error  = undefined
          change1Promise = undefined
          change2Promise = undefined

          change1Promise = up.render('.element', url: '/path1', solo: false).catch (e) -> change1Error = e

          next =>
            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.render('.element', url: '/path2', solo: true)

          next =>
            expect(change1Error).toBeError(/aborted/)
            expect(up.network.queue.allRequests.length).toEqual(1)

        it "does not abort an existing change's request when called with { solo: false }", asyncSpec (next) ->
          fixture('.element')

          change1Error = undefined
          change1Promise = undefined

          change2Promise = undefined

          change1Promise = up.render('.element', url: '/path1').catch (e) -> change1Error = e

          next =>
            expect(up.network.queue.allRequests.length).toEqual(1)
            expect(change1Error).toBeUndefined()

            change2Promise = up.render('.element', url: '/path2', solo: false)

          next =>
            expect(change1Error).toBeUndefined()
            expect(up.network.queue.allRequests.length).toEqual(2)

        it 'may be passed as a function that decides which existing requests are aborted', asyncSpec (next) ->
          fixture('.element')

          change1Promise = undefined
          change1Error = undefined

          change2Promise = undefined
          change2Error = undefined

          change3Promise = undefined
          change3Error = undefined

          change1Promise = up.render('.element', url: '/path1').catch (e) -> change1Error = e
          change2Promise = up.render('.element', url: '/path2').catch (e) -> change2Error = e

          next =>
            expect(up.network.queue.allRequests.length).toEqual(2)
            expect(change1Error).toBeUndefined()
            expect(change2Error).toBeUndefined()

            soloFn = (request) ->
              console.log("### Looking at request %o", request)
              u.matchURLs(request.url, '/path1')

            change3Promise = up.render('.element', url: '/path3', solo: soloFn).catch (e) -> change3Error = e

          next =>
            expect(change1Error).toBeError(/aborted/)
            expect(change2Error).toBeUndefined()
            expect(change3Error).toBeUndefined()

            expect(up.network.queue.allRequests.length).toEqual(2)

        it 'may be passed as a function that decides which existing requests are aborted when updating from local content', asyncSpec (next) ->
          fixture('.element')

          change1Promise = undefined
          change1Error = undefined

          change2Promise = undefined
          change2Error = undefined

          change3Promise = undefined
          change3Error = undefined

          change1Promise = up.render('.element', url: '/path1').catch (e) -> change1Error = e
          change2Promise = up.render('.element', url: '/path2').catch (e) -> change2Error = e

          next =>
            expect(up.network.queue.allRequests.length).toEqual(2)
            expect(change1Error).toBeUndefined()
            expect(change2Error).toBeUndefined()

            soloFn = (request) ->
              console.log("### Looking at request %o", request)
              u.matchURLs(request.url, '/path1')

            change3Promise = up.render('.element', content: 'new content', solo: soloFn).catch (e) -> change3Error = e

          next =>
            expect(change1Error).toBeError(/aborted/)
            expect(change2Error).toBeUndefined()
            expect(change3Error).toBeUndefined()

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

        it 'updates an [up-keep] element with { keep: false } option', asyncSpec (next) ->
          $container = $fixture('.container')
          $container.html """
            old-before
            <div class='element' up-keep>old-inside</div>
            old-after
            """

          up.render '.container',
            keep: false
            document: """
              <div class='container'>
                new-before
                <div class='element' up-keep>new-inside</div>
                new-after
              </div>
              """

          next =>
            expect(squish($('.container').text())).toEqual('new-before new-inside new-after')

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
                newData: { key: 'new-value' },
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
              { key: 'new-value' }
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
            expect(keptListener).toHaveBeenCalledWith($keeper[0], { 'foo': 'bar' })

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
            expect(keptListener).toHaveBeenCalledWith($keeper[0], { key: 'value1' })
            expect(keptListener).toHaveBeenCalledWith($keeper[0], { key: 'value2' })

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

      describeCapability 'canCustomElements', ->

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
          navigateSpy = up.fragment.knife.mock('navigate')
          deprecatedSpy = spyOn(up.migrate, 'deprecated')
          up.replace('target', 'url')
          expect(navigateSpy).toHaveBeenCalledWith({ target: 'target', url: 'url' })
          expect(deprecatedSpy).toHaveBeenCalled()

    if up.migrate.loaded
      describe 'up.extract()', ->

        it 'delegates to up.navigate({ target, document }) (deprecated)', ->
          navigateSpy = up.fragment.knife.mock('navigate')
          deprecatedSpy = spyOn(up.migrate, 'deprecated')
          up.extract('target', 'document')
          expect(navigateSpy).toHaveBeenCalledWith({ target: 'target', document: 'document' })
          expect(deprecatedSpy).toHaveBeenCalled()

    describe 'up.navigate()', ->

      it 'delegates to up.render({ ...options, navigate: true })', ->
        renderSpy = up.fragment.knife.mock('render')
        up.navigate({ url: 'url' })
        expect(renderSpy).toHaveBeenCalledWith({ url: 'url', navigate: true })

      it "updates the layer's main target by default (since navigation sets { fallback: true })", asyncSpec (next) ->
        up.fragment.config.mainTargets.unshift('.main-target')
        fixture('.main-target')

        up.navigate({ url: '/path2' })

        next =>
          expect(@lastRequest().requestHeaders['X-Up-Target']).toEqual('.main-target')

    describe 'up.destroy()', ->

      it 'removes the element with the given selector', (done) ->
        $fixture('.element')
        up.destroy('.element').then ->
          expect($('.element')).not.toBeAttached()
          done()

      it 'runs an animation before removal with { animate } option', asyncSpec (next) ->
        $element = $fixture('.element')
        up.destroy($element, animation: 'fade-out', duration: 200, easing: 'linear')

        next ->
          expect($element).toHaveOpacity(1.0, 0.15)

        next.after 100, ->
          expect($element).toHaveOpacity(0.5, 0.3)

        next.after (100 + 75), ->
          expect($element).toBeDetached()

      it 'calls destructors for custom elements', (done) ->
        destructor = jasmine.createSpy('destructor')
        up.$compiler('.element', ($element) -> destructor)
        up.hello(fixture('.element'))
        up.destroy('.element').then ->
          expect(destructor).toHaveBeenCalled()
          done()

      it 'does not call destructors twice if up.destroy() is called twice on the same fragment', asyncSpec (next) ->
        destructor = jasmine.createSpy('destructor')
        up.compiler('.element', (element) -> destructor)

        element = fixture('.element')
        up.hello(element)

        up.destroy(element, animation: 'fade-out', duration: 10)
        up.destroy(element, animation: 'fade-out', duration: 10)

        next.after 60, ->
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

        next.after 100, ->
          expect(destructor).toHaveBeenCalledWith('old text')

      if up.migrate.loaded
        it 'allows to pass a new history entry as { history } option (deprecated)', (done) ->
          up.history.config.enabled = true
          warnSpy = spyOn(up.migrate, 'warn')
          $fixture('.element')
          up.destroy('.element', history: '/new-path').then ->
            u.timer 100, ->
              expect(location.href).toMatchURL('/new-path')
              expect(warnSpy).toHaveBeenCalled()
              done()

      it 'allows to pass a new history entry as { location } option', (done) ->
        up.history.config.enabled = true
        $fixture('.element')
        up.destroy('.element', location: '/new-path').then ->
          u.timer 100, ->
            expect(location.href).toMatchURL('/new-path')
            done()

      it 'allows to pass a new document title as { title } option', (done) ->
        up.history.config.enabled = true
        $fixture('.element')
        up.destroy('.element', title: 'Title from options').then ->
          expect(document.title).toEqual('Title from options')
          done()

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

        next.after 60, ->
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

      it 'does not crash and runs destructors when destroying a detached element (bugfix)', (done) ->
        destructor = jasmine.createSpy('destructor')
        up.compiler('.element', (element) -> destructor)
        detachedElement = up.element.createFromSelector('.element')
        up.hello(detachedElement)
        up.destroy(detachedElement).then ->
          expect(destructor).toHaveBeenCalled()
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
        renderSpy = up.fragment.knife.mock('render')
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

      describeFallback 'canPushState', ->

        it 'makes a page load from the closest known source URL', asyncSpec (next) ->
          container = fixture('.container[up-source="/source"]')
          element = e.affix(container, '.element', text: 'old text')
          spyOn(up.browser, 'loadPage')
          up.reload('.element')

          next =>
            expect(up.browser.loadPage).toHaveBeenCalledWith(jasmine.objectContaining(url: '/source'))

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
          rootElement = up.layer.get(0).affix('.foo.in-root')
          overlayElement = up.layer.get(1).affix('.foo.in-overlay')

          up.hello(rootElement)
          up.hello(overlayElement)

          expect(layerSpy.calls.count()).toBe(2)
          expect(layerSpy.calls.argsFor(0)).toEqual [up.layer.get(0)]
          expect(layerSpy.calls.argsFor(1)).toEqual [up.layer.get(1)]

      it 'keeps up.layer.current and does not crash when compiling a detached element (bugfix)', asyncSpec (next) ->
        layerSpy = jasmine.createSpy('layer spy')
        up.compiler('.foo', -> layerSpy(up.layer.current))
        makeLayers(2)

        next ->
          expect(up.layer.current.isOverlay()).toBe(true)

          element = up.element.createFromSelector('.foo')
          compileFn = -> up.hello(element)

          expect(compileFn).not.toThrowError()
          expect(layerSpy.calls.argsFor(0)).toEqual [up.layer.current]

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

      it 'uses the first of multiple classes', ->
        element = fixture('div.class1.class2')
        expect(up.fragment.toTarget(element)).toBe(".class1")

      it "prefers using the element's [name] attribute to only using the element's tag name", ->
        element = fixture('input[name=name-value]')
        expect(up.fragment.toTarget(element)).toBe('input[name="name-value"]')

      it "refers to meta tags by both tag name and [name] attribute", ->
        element = fixture('meta[name="csrf-token"]')
        expect(up.fragment.toTarget(element)).toBe('meta[name="csrf-token"]')

      it "uses the element's tag name if no better description is available", ->
        element = fixture('div')
        expect(up.fragment.toTarget(element)).toBe("div")
  
      it 'escapes quotes in attribute selector values', ->
        element = fixture('input')
        element.setAttribute('name', 'foo"bar')
        expect(up.fragment.toTarget(element)).toBe('input[name="foo\\"bar"]')

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

      it "it expands '&' to a selector for { origin }", ->
        targets = ['.before', '& .child', '.after']
        origin = fixture('#foo')
        up.layer.config.root.mainTargets = [':layer']
        expanded = up.fragment.expandTargets(targets, layer: up.layer.root, origin: origin)
        expect(expanded).toEqual ['.before', '#foo .child', '.after']

    describe 'up.fragment.config.mainTargets', ->

      it 'returns up.layer.config.any.mainTargets', ->
        up.layer.config.any.mainTargets = ['.my-special-main-target']
        expect(up.fragment.config.mainTargets).toEqual ['.my-special-main-target']
