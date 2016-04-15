describe 'up.flow', ->

  u = up.util
  
  describe 'Javascript functions', ->

    describe 'up.replace', ->

      describeCapability 'canPushState', ->

        beforeEach ->

          @oldBefore = affix('.before').text('old-before')
          @oldMiddle = affix('.middle').text('old-middle')
          @oldAfter = affix('.after').text('old-after')

          @responseText =
            """
            <div class="before">new-before</div>
            <div class="middle">new-middle</div>
            <div class="after">new-after</div>
            """

          @respond = (options = {}) -> @respondWith(@responseText, options)

        it 'replaces the given selector with the same selector from a freshly fetched page', (done) ->
          promise = up.replace('.middle', '/path')
          @respond()
          promise.then ->
            expect($('.before')).toHaveText('old-before')
            expect($('.middle')).toHaveText('new-middle')
            expect($('.after')).toHaveText('old-after')
            done()

        it 'sends an X-Up-Target HTTP header along with the request', ->
          up.replace('.middle', '/path')
          request = @lastRequest()
          expect(request.requestHeaders['X-Up-Target']).toEqual('.middle')

        it 'returns a promise that will be resolved once the server response was received and the fragments were swapped', ->
          resolution = jasmine.createSpy()
          promise = up.replace('.middle', '/path')
          promise.then(resolution)
          expect(resolution).not.toHaveBeenCalled()
          expect($('.middle')).toHaveText('old-middle')
          @respond()
          expect(resolution).toHaveBeenCalled()
          expect($('.middle')).toHaveText('new-middle')

        it 'returns a promise that will be resolved once the server response was received and the swap animations have completed', (done) ->
          resolution = jasmine.createSpy()
          promise = up.replace('.middle', '/path', transition: 'cross-fade', duration: 50)
          promise.then(resolution)
          expect(resolution).not.toHaveBeenCalled()
          expect($('.middle')).toHaveText('old-middle')
          @respond()
          expect(resolution).not.toHaveBeenCalled()
          u.setTimer 20, ->
            expect(resolution).not.toHaveBeenCalled()
            u.setTimer 50, ->
              expect(resolution).toHaveBeenCalled()
              done()

        describe 'with { data } option', ->

          it "uses the given params as a non-GET request's payload", ->
            givenParams = { 'foo-key': 'foo-value', 'bar-key': 'bar-value' }
            up.replace('.middle', '/path', method: 'put', data: givenParams)
            expect(@lastRequest().data()['foo-key']).toEqual(['foo-value'])
            expect(@lastRequest().data()['bar-key']).toEqual(['bar-value'])

          it "encodes the given params into the URL of a GET request", ->
            givenParams = { 'foo-key': 'foo-value', 'bar-key': 'bar-value' }
            up.replace('.middle', '/path', method: 'get', data: givenParams)
            expect(@lastRequest().url).toEndWith('/path?foo-key=foo-value&bar-key=bar-value')

        it 'uses a HTTP method given as { method } option', ->
          up.replace('.middle', '/path', method: 'put')
          expect(@lastRequest()).toHaveRequestMethod('PUT')

        describe 'if the server responds with a non-200 status code', ->

          it 'replaces the <body> instead of the given selector', ->
            implantSpy = up.flow.knife.mock('extract') # can't have the example replace the Jasmine test runner UI
            up.replace('.middle', '/path')
            @respond(status: 500)
            expect(implantSpy).toHaveBeenCalledWith('body', jasmine.any(String), jasmine.any(Object))

          it 'uses a target selector given as { failTarget } option', ->
            up.replace('.middle', '/path', failTarget: '.after')
            @respond(status: 500)
            expect($('.middle')).toHaveText('old-middle')
            expect($('.after')).toHaveText('new-after')

        describe 'history', ->

          it 'should set the browser location to the given URL', (done) ->
            promise = up.replace('.middle', '/path')
            @respond()
            promise.then ->
              expect(location.href).toEndWith('/path')
              done()

          it 'does not add a history entry after non-GET requests', ->
            promise = up.replace('.middle', '/path', method: 'post')
            @respond()
            expect(location.href).toEndWith(@hrefBeforeExample)

          it 'adds a history entry after non-GET requests if the response includes a { X-Up-Method: "get" } header (will happen after a redirect)', ->
            promise = up.replace('.middle', '/path', method: 'post')
            @respond(responseHeaders: { 'X-Up-Method': 'get' })
            expect(location.href).toEndWith('/path')

          it 'does not a history entry after a failed GET-request', ->
            promise = up.replace('.middle', '/path', method: 'post', failTarget: '.middle')
            @respond(status: 500)
            expect(location.href).toEndWith(@hrefBeforeExample)

          it 'does not add a history entry with { history: false } option', ->
            promise = up.replace('.middle', '/path', history: false)
            @respond()
            expect(location.href).toEndWith(@hrefBeforeExample)

          it "detects a redirect's new URL when the server sets an X-Up-Location header", ->
            promise = up.replace('.middle', '/path')
            @respond(responseHeaders: { 'X-Up-Location': '/other-path' })
            expect(location.href).toEndWith('/other-path')

          it 'adds params from a { data } option to the URL of a GET request', ->
            promise = up.replace('.middle', '/path', data: { 'foo-key': 'foo value', 'bar-key': 'bar value' })
            @respond()
            console.log("EXPECTATION COMING UP AGAINST %o", location.pathname)
            expect(location.href).toEndWith('/path?foo-key=foo%20value&bar-key=bar%20value')

          describe 'if a URL is given as { history } option', ->

            it 'uses that URL as the new location after a GET request', ->
              promise = up.replace('.middle', '/path', history: '/given-path')
              @respond(failTarget: '.middle')
              expect(location.href).toEndWith('/given-path')

            it 'adds a history entry after a non-GET request', ->
              promise = up.replace('.middle', '/path', method: 'post', history: '/given-path')
              @respond(failTarget: '.middle')
              expect(location.href).toEndWith('/given-path')

            it 'does not add a history entry after a failed non-GET request', ->
              promise = up.replace('.middle', '/path', method: 'post', history: '/given-path', failTarget: '.middle')
              @respond(failTarget: '.middle', status: 500)
              expect(location.href).toEndWith(@hrefBeforeExample)

        describe 'source', ->

          it 'remembers the source the fragment was retrieved from', (done) ->
            promise = up.replace('.middle', '/path')
            @respond()
            promise.then ->
              expect($('.middle').attr('up-source')).toMatch(/\/path$/)
              done()

          it 'reuses the previous source for a non-GET request (since that is reloadable)', ->
            @oldMiddle.attr('up-source', '/previous-source')
            up.replace('.middle', '/path', method: 'post')
            @respond()
            expect($('.middle')).toHaveText('new-middle')
            expect(up.flow.source('.middle')).toEndWith('/previous-source')

          describe 'if a URL is given as { source } option', ->

            it 'uses that URL as the source for a GET request', ->
              promise = up.replace('.middle', '/path', source: '/given-path')
              @respond()
              expect(up.flow.source('.middle')).toEndWith('/given-path')

            it 'uses that URL as the source after a non-GET request', ->
              promise = up.replace('.middle', '/path', method: 'post', source: '/given-path')
              @respond()
              expect(up.flow.source('.middle')).toEndWith('/given-path')

            it 'still reuses the previous URL after a failed non-GET request', ->
              promise = up.replace('.middle', '/path', method: 'post', source: '/given-path', failTarget: '.middle')
              @respond(status: 500)
              expect(up.flow.source('.middle')).toEndWith(@hrefBeforeExample)

        it 'understands non-standard CSS selector extensions such as :has(...)', (done) ->
          $first = affix('.boxx#first')
          $firstChild = $('<span class="first-child">old first</span>').appendTo($first)
          $second = affix('.boxx#second')
          $secondChild = $('<span class="second-child">old second</span>').appendTo($second)

          promise = up.replace('.boxx:has(.first-child)', '/path')
          @respondWith """
            <div class="boxx" id="first">
              <span class="first-child">new first</span>
            </div>
            """

          promise.then ->
            expect($('#first span')).toHaveText('new first')
            expect($('#second span')).toHaveText('old second')
            done()

        describe 'document title', ->

          it "sets the document title to a 'title' tag in the response", ->
            affix('.container').text('old container text')
            up.replace('.container', '/path')
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
            expect($('.container')).toHaveText('new container text')
            expect(document.title).toBe('Title from HTML')

          it "sets the document title to an 'X-Up-Title' header in the response", ->
            affix('.container').text('old container text')
            up.replace('.container', '/path')
            @respondWith
              responseHeaders:
                'X-Up-Title': 'Title from header'
              responseText: """
                <div class='container'>
                  new container text
                </div>
                """
            expect($('.container')).toHaveText('new container text')
            expect(document.title).toBe('Title from header')

        describe 'selector processing', ->

          it 'replaces multiple selectors separated with a comma', (done) ->
            promise = up.replace('.middle, .after', '/path')
            @respond()
            promise.then ->
              expect($('.before')).toHaveText('old-before')
              expect($('.middle')).toHaveText('new-middle')
              expect($('.after')).toHaveText('new-after')
              done()

          it 'replaces the body if asked to replace the "html" selector'

          it 'prepends instead of replacing when the target has a :before pseudo-selector', (done) ->
            promise = up.replace('.middle:before', '/path')
            @respond()
            promise.then ->
              expect($('.before')).toHaveText('old-before')
              expect($('.middle')).toHaveText('new-middleold-middle')
              expect($('.after')).toHaveText('old-after')
              done()

          it 'appends instead of replacing when the target has a :after pseudo-selector', (done) ->
            promise = up.replace('.middle:after', '/path')
            @respond()
            promise.then ->
              expect($('.before')).toHaveText('old-before')
              expect($('.middle')).toHaveText('old-middlenew-middle')
              expect($('.after')).toHaveText('old-after')
              done()

          it "lets the developer choose between replacing/prepending/appending for each selector", (done) ->
            promise = up.replace('.before:before, .middle, .after:after', '/path')
            @respond()
            promise.then ->
              expect($('.before')).toHaveText('new-beforeold-before')
              expect($('.middle')).toHaveText('new-middle')
              expect($('.after')).toHaveText('old-afternew-after')
              done()

        it 'executes only those script-tags in the response that get inserted into the DOM', (done) ->
          window.scriptTagExecuted = jasmine.createSpy('scriptTagExecuted')

          @responseText =
            """
            <div class="before">
              new-before
              <script type="text/javascript">
                window.scriptTagExecuted('before')
              </script>
            </div>
            <div class="middle">
              new-middle
              <script type="text/javascript">
                window.scriptTagExecuted('middle')
              </script>
            </div>
            """

          promise = up.replace('.middle', '/path')
          @respond()

          promise.then ->
            expect(window.scriptTagExecuted).not.toHaveBeenCalledWith('before')
            expect(window.scriptTagExecuted).toHaveBeenCalledWith('middle')
            done()

        describe 'with { restoreScroll: true } option', ->

          it 'restores the scroll positions of all viewports around the target', ->

            $viewport = affix('div[up-viewport] .element').css
              'height': '100px'
              'width': '100px'
              'overflow-y': 'scroll'

            respond = =>
              @lastRequest().respondWith
                status: 200
                contentType: 'text/html'
                responseText: '<div class="element" style="height: 300px"></div>'

            up.replace('.element', '/foo')
            respond()

            $viewport.scrollTop(65)

            up.replace('.element', '/bar')
            respond()

            $viewport.scrollTop(0)

            up.replace('.element', '/foo', restoreScroll: true)
            # No need to respond because /foo has been cached before

            expect($viewport.scrollTop()).toEqual(65)


        describe 'with { reveal: true } option', ->

          beforeEach ->
            @revealedHTML = ''

            @revealMock = up.layout.knife.mock('reveal').and.callFake ($revealedElement) =>
              @revealedHTML = $revealedElement.get(0).outerHTML
              u.resolvedDeferred()

          it 'reveals a new element before it is being replaced', (done) ->
            promise = up.replace('.middle', '/path', reveal: true)
            @respond()
            promise.then =>
              expect(@revealMock).not.toHaveBeenCalledWith(@oldMiddle)
              expect(@revealedHTML).toContain('new-middle')
              done()

          describe 'when there is an anchor #hash in the URL', ->

            it 'reveals a child with the ID of that #hash', (done) ->
              promise = up.replace('.middle', '/path#three', reveal: true)
              @responseText =
                """
                <div class="middle">
                  <div id="one">one</div>
                  <div id="two">two</div>
                  <div id="three">three</div>
                </div>
                """
              @respond()
              promise.then =>
                expect(@revealedHTML).toEqual('<div id="three">three</div>')
                done()

            it "reveals the entire element if it has no child with the ID of that #hash", (done) ->
              promise = up.replace('.middle', '/path#four', reveal: true)
              @responseText =
                """
                <div class="middle">
                  new-middle
                </div>
                """
              @respond()
              promise.then =>
                expect(@revealedHTML).toContain('new-middle')
                done()

          it 'reveals a new element that is being appended', (done) ->
            promise = up.replace('.middle:after', '/path', reveal: true)
            @respond()
            promise.then =>
              expect(@revealMock).not.toHaveBeenCalledWith(@oldMiddle)
              # Text nodes are wrapped in a .up-insertion container so we can
              # animate them and measure their position/size for scrolling.
              # This is not possible for container-less text nodes.
              expect(@revealedHTML).toEqual('<span class="up-insertion">new-middle</span>')
              # Show that the wrapper is done after the insertion.
              expect($('.up-insertion')).not.toExist()
              done()

          it 'reveals a new element that is being prepended', (done) ->
            promise = up.replace('.middle:before', '/path', reveal: true)
            @respond()
            promise.then =>
              expect(@revealMock).not.toHaveBeenCalledWith(@oldMiddle)
              # Text nodes are wrapped in a .up-insertion container so we can
              # animate them and measure their position/size for scrolling.
              # This is not possible for container-less text nodes.
              expect(@revealedHTML).toEqual('<span class="up-insertion">new-middle</span>')
              # Show that the wrapper is done after the insertion.
              expect($('.up-insertion')).not.toExist()
              done()

        it 'uses a { failTransition } option if the request failed'

      describeFallback 'canPushState', ->
        
        it 'makes a full page load', ->
          spyOn(up.browser, 'loadPage')
          up.replace('.selector', '/path')
          expect(up.browser.loadPage).toHaveBeenCalledWith('/path', jasmine.anything())
          
    describe 'up.extract', ->
      
      it 'Updates a selector on the current page with the same selector from the given HTML string', ->

        affix('.before').text('old-before')
        affix('.middle').text('old-middle')
        affix('.after').text('old-after')

        html =
          """
          <div class="before">new-before</div>
          <div class="middle">new-middle</div>
          <div class="after">new-after</div>
          """

        up.extract('.middle', html)

        expect($('.before')).toHaveText('old-before')
        expect($('.middle')).toHaveText('new-middle')
        expect($('.after')).toHaveText('old-after')

      it "throws an error if the selector can't be found on the current page", ->
        html = '<div class="foo-bar">text</div>'
        extract = -> up.extract('.foo-bar', html)
        expect(extract).toThrowError(/Could not find selector ".foo-bar" in current body/i)

      it "throws an error if the selector can't be found in the given HTML string", ->
        affix('.foo-bar')
        extract = -> up.extract('.foo-bar', '')
        expect(extract).toThrowError(/Could not find selector ".foo-bar" in response/i)

      it "ignores an element that matches the selector but also matches .up-destroying", ->
        html = '<div class="foo-bar">text</div>'
        affix('.foo-bar.up-destroying')
        extract = -> up.extract('.foo-bar', html)
        expect(extract).toThrowError(/Could not find selector/i)

      it "ignores an element that matches the selector but also matches .up-ghost", ->
        html = '<div class="foo-bar">text</div>'
        affix('.foo-bar.up-ghost')
        extract = -> up.extract('.foo-bar', html)
        expect(extract).toThrowError(/Could not find selector/i)

      it "ignores an element that matches the selector but also has a parent matching .up-destroying", ->
        html = '<div class="foo-bar">text</div>'
        $parent = affix('.up-destroying')
        $child = affix('.foo-bar').appendTo($parent)
        extract = -> up.extract('.foo-bar', html)
        expect(extract).toThrowError(/Could not find selector/i)

      it "ignores an element that matches the selector but also has a parent matching .up-ghost", ->
        html = '<div class="foo-bar">text</div>'
        $parent = affix('.up-ghost')
        $child = affix('.foo-bar').appendTo($parent)
        extract = -> up.extract('.foo-bar', html)
        expect(extract).toThrowError(/Could not find selector/i)

      it 'only replaces the first element matching the selector', ->
        html = '<div class="foo-bar">text</div>'
        affix('.foo-bar')
        affix('.foo-bar')
        up.extract('.foo-bar', html)
        elements = $('.foo-bar')
        expect($(elements.get(0)).text()).toEqual('text')
        expect($(elements.get(1)).text()).toEqual('')

      describe 'with { transition } option', ->

        it 'morphs between the old and new element', (done) ->
          affix('.element').text('version 1')
          up.extract('.element', '<div class="element">version 2</div>', transition: 'cross-fade', duration: 100)

          $ghost1 = $('.element.up-ghost:contains("version 1")')
          expect($ghost1).toHaveLength(1)
          expect(u.opacity($ghost1)).toBeAround(1.0, 0.1)

          $ghost2 = $('.element.up-ghost:contains("version 2")')
          expect($ghost2).toHaveLength(1)
          expect(u.opacity($ghost2)).toBeAround(0.0, 0.1)

          u.setTimer 100, ->
            expect(u.opacity($ghost1)).toBeAround(0.0, 0.2)
            expect(u.opacity($ghost2)).toBeAround(1.0, 0.2)
            done()

        it 'marks the old fragment and its ghost as .up-destroying during the transition', ->
          affix('.element').text('version 1')
          up.extract('.element', '<div class="element">version 2</div>', transition: 'cross-fade', duration: 200)

          $version1 = $('.element:not(.up-ghost):contains("version 1")')
          $version1Ghost = $('.element.up-ghost:contains("version 1")')
          expect($version1).toHaveLength(1)
          expect($version1Ghost).toHaveLength(1)
          expect($version1).toHaveClass('up-destroying')
          expect($version1Ghost).toHaveClass('up-destroying')

          $version2 = $('.element:not(.up-ghost):contains("version 2")')
          $version2Ghost = $('.element.up-ghost:contains("version 2")')
          expect($version2).toHaveLength(1)
          expect($version2Ghost).toHaveLength(1)
          expect($version2).not.toHaveClass('up-destroying')
          expect($version2Ghost).not.toHaveClass('up-destroying')

        it 'cancels an existing transition by instantly jumping to the last frame', ->
          affix('.element').text('version 1')
          up.extract('.element', '<div class="element">version 2</div>', transition: 'cross-fade', duration: 200)

          $ghost1 = $('.element.up-ghost:contains("version 1")')
          expect($ghost1).toHaveLength(1)
          expect($ghost1.css('opacity')).toBeAround(1.0, 0.1)

          $ghost2 = $('.element.up-ghost:contains("version 2")')
          expect($ghost2).toHaveLength(1)
          expect($ghost2.css('opacity')).toBeAround(0.0, 0.1)

          up.extract('.element', '<div class="element">version 3</div>', transition: 'cross-fade', duration: 200)

          $ghost1 = $('.element.up-ghost:contains("version 1")')
          expect($ghost1).toHaveLength(0)

          $ghost2 = $('.element.up-ghost:contains("version 2")')
          expect($ghost2).toHaveLength(1)
          expect($ghost2.css('opacity')).toBeAround(1.0, 0.1)

          $ghost3 = $('.element.up-ghost:contains("version 3")')
          expect($ghost3).toHaveLength(1)
          expect($ghost3.css('opacity')).toBeAround(0.0, 0.1)

        it 'delays the resolution of the returned promise until the transition is over', (done) ->
          affix('.element').text('version 1')
          resolution = jasmine.createSpy()
          promise = up.extract('.element', '<div class="element">version 2</div>', transition: 'cross-fade', duration: 30)
          promise.then(resolution)
          expect(resolution).not.toHaveBeenCalled()
          u.setTimer 50, ->
            expect(resolution).toHaveBeenCalled()
            done()

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

        it 'keeps an [up-keep] element, but does replace other elements around it', ->
          $container = affix('.container')
          $container.affix('.before').text('old-before')
          $container.affix('.middle[up-keep]').text('old-middle')
          $container.affix('.after').text('old-after')
          up.extract '.container', """
            <div class='container'>
              <div class='before'>new-before</div>
              <div class='middle' up-keep>new-middle</div>
              <div class='after'>new-after</div>
            </div>
            """
          expect($('.before')).toHaveText('new-before')
          expect($('.middle')).toHaveText('old-middle')
          expect($('.after')).toHaveText('new-after')

        it 'keeps an [up-keep] element, but does replace text nodes around it', ->
          $container = affix('.container')
          $container.html """
            old-before
            <div class='element' up-keep>old-inside</div>
            old-after
            """
          up.extract '.container', """
            <div class='container'>
              new-before
              <div class='element' up-keep>new-inside</div>
              new-after
            </div>
            """
          expect(squish($('.container').text())).toEqual('new-before old-inside new-after')

        describe 'if an [up-keep] element is itself a direct replacement target', ->

          it "keeps that element", ->
            affix('.keeper[up-keep]').text('old-inside')
            up.extract '.keeper', "<div class='keeper' up-keep>new-inside</div>"
            expect($('.keeper')).toHaveText('old-inside')

          it "only emits an event up:fragment:kept, but not an event up:fragment:inserted", ->
            insertedListener = jasmine.createSpy('subscriber to up:fragment:inserted')
            up.on('up:fragment:inserted', insertedListener)
            keptListener = jasmine.createSpy('subscriber to up:fragment:kept')
            up.on('up:fragment:kept', keptListener)
            up.on 'up:fragment:inserted', insertedListener
            $keeper = affix('.keeper[up-keep]').text('old-inside')
            up.extract '.keeper', "<div class='keeper' up-keep>new-inside</div>"
            expect(insertedListener).not.toHaveBeenCalled()
            expect(keptListener).toHaveBeenCalledWith(jasmine.anything(), $('.keeper'), jasmine.anything())

        it "removes an [up-keep] element if no matching element is found in the response", ->
          $container = affix('.container')
          $container.html """
            <div class='foo'>old-foo</div>
            <div class='bar' up-keep>old-bar</div>
            """
          up.extract '.container', """
            <div class='container'>
              <div class='foo'>new-foo</div>
            </div>
            """
          expect($('.container .foo')).toExist()
          expect($('.container .bar')).not.toExist()

        it "updates an element if a matching element is found in the response, but that other element is no longer [up-keep]", ->
          $container = affix('.container')
          $container.html """
            <div class='foo'>old-foo</div>
            <div class='bar' up-keep>old-bar</div>
            """
          up.extract '.container', """
            <div class='container'>
              <div class='foo'>new-foo</div>
              <div class='bar'>new-bar</div>
            </div>
            """
          expect($('.container .foo')).toHaveText('new-foo')
          expect($('.container .bar')).toHaveText('new-bar')

        it 'moves a kept element to the ancestry position of the matching element in the response', ->
          $container = affix('.container')
          $container.html """
            <div class="parent1">
              <div class="keeper" up-keep>old-inside</div>
            </div>
            <div class="parent2">
            </div>
            """
          up.extract '.container', """
            <div class='container'>
              <div class="parent1">
              </div>
              <div class="parent2">
                <div class="keeper" up-keep>old-inside</div>
              </div>
            </div>
            """
          expect($('.keeper')).toHaveText('old-inside')
          expect($('.keeper').parent()).toEqual($('.parent2'))

        it 'lets developers choose a selector to match against as the value of the up-keep attribute', ->
          $container = affix('.container')
          $container.html """
            <div class="keeper" up-keep=".stayer"></div>
            """
          up.extract '.container', """
            <div class='container'>
              <div up-keep class="stayer"></div>
            </div>
            """
          expect('.keeper').toExist()

        it 'does not compile a kept element a second time', ->
          compiler = jasmine.createSpy('compiler')
          up.compiler('.keeper', compiler)
          $container = affix('.container')
          $container.html """
            <div class="keeper" up-keep>old-text</div>
            """

          console.log '*** before hello ***'
          up.hello($container)
          console.log '*** after hello ***'
          expect(compiler.calls.count()).toEqual(1)

          up.extract '.container', """
            <div class='container'>
              <div class="keeper" up-keep>new-text</div>
            </div>
            """
          expect(compiler.calls.count()).toEqual(1)
          expect('.keeper').toExist()

        it 'lets listeners cancel the keeping by preventing default on an up:fragment:keep event', ->
          $keeper = affix('.keeper[up-keep]').text('old-inside')
          $keeper.on 'up:fragment:keep', (event) -> event.preventDefault()
          up.extract '.keeper', "<div class='keeper' up-keep>new-inside</div>"
          expect($('.keeper')).toHaveText('new-inside')

        it 'lets listeners prevent up:fragment:keep event if the element was kept before (bugfix)', ->
          $keeper = affix('.keeper[up-keep]').text('version 1')
          $keeper.on 'up:fragment:keep', (event) ->
            event.preventDefault() if event.$newElement.text() == 'version 3'
          up.extract '.keeper', "<div class='keeper' up-keep>version 2</div>"
          expect($('.keeper')).toHaveText('version 1')
          up.extract '.keeper', "<div class='keeper' up-keep>version 3</div>"
          expect($('.keeper')).toHaveText('version 3')

        it 'emits an up:fragment:kept event on a kept element and up:fragment:inserted on an updated parent', ->
          insertedListener = jasmine.createSpy()
          up.on('up:fragment:inserted', insertedListener)
          keptListener = jasmine.createSpy()
          up.on('up:fragment:kept', keptListener)

          $container = affix('.container')
          $container.html """
            <div class="keeper" up-keep></div>
            """
          up.extract '.container', """
            <div class='container'>
              <div class="keeper" up-keep></div>
            </div>
            """
          expect(insertedListener).toHaveBeenCalledWith(jasmine.anything(), $('.container'), jasmine.anything())
          expect(keptListener).toHaveBeenCalledWith(jasmine.anything(), $('.container .keeper'), jasmine.anything())

        it 'emits an up:fragment:kept event on a kept element with a newData property corresponding to the up-data attribute value of the discarded element', ->
          keptListener = jasmine.createSpy()
          up.on 'up:fragment:kept', (event) -> keptListener(event.$element, event.newData)
          $container = affix('.container')
          $keeper = $container.affix('.keeper[up-keep]').text('old-inside')
          up.extract '.container', """
            <div class='container'>
              <div class='keeper' up-keep up-data='{ "foo": "bar" }'>new-inside</div>
            </div>
          """
          expect($('.keeper')).toHaveText('old-inside')
          expect(keptListener).toHaveBeenCalledWith($keeper, { 'foo': 'bar' })

        it 'emits an up:fragment:kept with { newData: {} } if the discarded element had no up-data value', ->
          keptListener = jasmine.createSpy()
          up.on('up:fragment:kept', keptListener)
          $container = affix('.container')
          $keeper = $container.affix('.keeper[up-keep]').text('old-inside')
          up.extract '.keeper', """
            <div class='container'>
              <div class='keeper' up-keep>new-inside</div>
            </div>
          """
          expect($('.keeper')).toHaveText('old-inside')
          expect(keptListener).toEqual(jasmine.anything(), $('.keeper'), {})

        it 'reuses the same element and emits up:fragment:kept during multiple extractions', ->
          keptListener = jasmine.createSpy()
          up.on 'up:fragment:kept', (event) -> keptListener(event.$element, event.newData)
          $container = affix('.container')
          $keeper = $container.affix('.keeper[up-keep]').text('old-inside')
          up.extract '.keeper', """
            <div class='container'>
              <div class='keeper' up-keep up-data='{ \"key\": \"value1\" }'>new-inside</div>
            </div>
          """
          up.extract '.keeper', """
            <div class='container'>
              <div class='keeper' up-keep up-data='{ \"key\": \"value2\" }'>new-inside</div>
          """
          $keeper = $('.keeper')
          expect($keeper).toHaveText('old-inside')
          expect(keptListener).toHaveBeenCalledWith($keeper, { key: 'value1' })
          expect(keptListener).toHaveBeenCalledWith($keeper, { key: 'value2' })

        it "doesn't let the discarded element appear in a transition", (done) ->
          oldTextDuringTransition = undefined
          newTextDuringTransition = undefined
          transition = ($old, $new) ->
            oldTextDuringTransition = squish($old.text())
            newTextDuringTransition = squish($new.text())
            u.resolvedDeferred()
          $container = affix('.container')
          $container.html """
            <div class='foo'>old-foo</div>
            <div class='bar' up-keep>old-bar</div>
            """
          newHtml = """
            <div class='container'>
              <div class='foo'>new-foo</div>
              <div class='bar' up-keep>new-bar</div>
            </div>
            """
          promise = up.extract('.container', newHtml, transition: transition)
          promise.then ->
            expect(oldTextDuringTransition).toEqual('old-foo old-bar')
            expect(newTextDuringTransition).toEqual('new-foo old-bar')
            done()

    describe 'up.destroy', ->
      
      it 'removes the element with the given selector', ->
        affix('.element')
        up.destroy('.element')
        expect($('.element')).not.toExist()
        
      it 'calls destructors for custom elements', ->
        up.compiler('.element', ($element) -> destructor)
        destructor = jasmine.createSpy('destructor')
        up.hello(affix('.element'))
        up.destroy('.element')
        expect(destructor).toHaveBeenCalled()
        
    describe 'up.reload', ->

      describeCapability 'canPushState', ->
      
        it 'reloads the given selector from the closest known source URL', (done) ->
          affix('.container[up-source="/source"] .element').find('.element').text('old text')
    
          up.reload('.element').then ->
            expect($('.element')).toHaveText('new text')
            done()
            
          expect(@lastRequest().url).toMatch(/\/source$/)
    
          @respondWith """
            <div class="container">
              <div class="element">new text</div>
            </div>
            """

      describeFallback 'canPushState', ->
        
        it 'makes a page load from the closest known source URL', ->
          affix('.container[up-source="/source"] .element').find('.element').text('old text')
          spyOn(up.browser, 'loadPage')
          up.reload('.element')
          expect(up.browser.loadPage).toHaveBeenCalledWith('/source', jasmine.anything())
          
  
    describe 'up.reset', ->
  
      it 'should have tests'

