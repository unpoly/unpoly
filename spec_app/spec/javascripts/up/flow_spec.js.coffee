describe 'up.flow', ->

  u = up.util
  
  describe 'Javascript functions', ->

    describe 'up.replace', ->

      if up.browser.canPushState()

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

          @respond = -> @respondWith(@responseText)

        it 'replaces the given selector with the same selector from a freshly fetched page', (done) ->
          promise = up.replace('.middle', '/path')
          @respond()
          promise.then ->
            expect($('.before')).toHaveText('old-before')
            expect($('.middle')).toHaveText('new-middle')
            expect($('.after')).toHaveText('old-after')
            done()
          
        it 'should set the browser location to the given URL', (done) ->
          promise = up.replace('.middle', '/path')
          @respond()
          promise.then ->
            expect(window.location.pathname).toBe('/path')
            done()

        it "detects a redirect's new URL when the server sets an X-Up-Location header", (done) ->
          promise = up.replace('.middle', '/path')
          @respondWith(@responseText, responseHeaders: { 'X-Up-Location': '/other-path' })
          promise.then ->
            expect(window.location.pathname).toBe('/other-path')
            done()

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

        it 'marks the element with the URL from which it was retrieved', (done) ->
          promise = up.replace('.middle', '/path')
          @respond()
          promise.then ->
            expect($('.middle').attr('up-source')).toMatch(/\/path$/)
            done()
            
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

      else
        
        it 'makes a full page load', ->
          spyOn(up.browser, 'loadPage')
          up.replace('.selector', '/path')
          expect(up.browser.loadPage).toHaveBeenCalledWith('/path', jasmine.anything())
          
    describe 'up.flow.implant', ->
      
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

        up.flow.implant('.middle', html)

        expect($('.before')).toHaveText('old-before')
        expect($('.middle')).toHaveText('new-middle')
        expect($('.after')).toHaveText('old-after')

      it "throws an error if the selector can't be found on the current page", ->
        html = '<div class="foo-bar">text</div>'
        implant = -> up.flow.implant('.foo-bar', html)
        expect(implant).toThrowError(/Could not find selector ".foo-bar" in current body/i)

      it "throws an error if the selector can't be found in the given HTML string", ->
        affix('.foo-bar')
        implant = -> up.flow.implant('.foo-bar', '')
        expect(implant).toThrowError(/Could not find selector ".foo-bar" in response/i)

      it "ignores an element that matches the selector but also matches .up-destroying", ->
        html = '<div class="foo-bar">text</div>'
        affix('.foo-bar.up-destroying')
        implant = -> up.flow.implant('.foo-bar', html)
        expect(implant).toThrowError(/Could not find selector/i)

      it "ignores an element that matches the selector but also matches .up-ghost", ->
        html = '<div class="foo-bar">text</div>'
        affix('.foo-bar.up-ghost')
        implant = -> up.flow.implant('.foo-bar', html)
        expect(implant).toThrowError(/Could not find selector/i)

      it "ignores an element that matches the selector but also has a parent matching .up-destroying", ->
        html = '<div class="foo-bar">text</div>'
        $parent = affix('.up-destroying')
        $child = affix('.foo-bar').appendTo($parent)
        implant = -> up.flow.implant('.foo-bar', html)
        expect(implant).toThrowError(/Could not find selector/i)

      it "ignores an element that matches the selector but also has a parent matching .up-ghost", ->
        html = '<div class="foo-bar">text</div>'
        $parent = affix('.up-ghost')
        $child = affix('.foo-bar').appendTo($parent)
        implant = -> up.flow.implant('.foo-bar', html)
        expect(implant).toThrowError(/Could not find selector/i)

      it 'only replaces the first element matching the selector', ->
        html = '<div class="foo-bar">text</div>'
        affix('.foo-bar')
        affix('.foo-bar')
        up.flow.implant('.foo-bar', html)
        elements = $('.foo-bar')
        expect($(elements.get(0)).text()).toEqual('text')
        expect($(elements.get(1)).text()).toEqual('')

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
      
      if up.browser.canPushState()
      
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
            
      else
        
        it 'makes a page load from the closest known source URL', ->
          affix('.container[up-source="/source"] .element').find('.element').text('old text')
          spyOn(up.browser, 'loadPage')
          up.reload('.element')
          expect(up.browser.loadPage).toHaveBeenCalledWith('/source', jasmine.anything())
          
  
    describe 'up.reset', ->
  
      it 'should have tests'
