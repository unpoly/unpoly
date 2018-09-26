describe 'up.layout', ->

  u = up.util

  describe 'JavaScript functions', ->

    describe 'up.reveal', ->

      beforeEach ->
        up.layout.config.snap = 0
        up.layout.config.substance = 99999

      describe 'when the viewport is the document', ->

        beforeEach ->
          $body = $('body')

          @$elements = []
          @$container = $('<div class="container">').prependTo($body)

          @clientHeight = u.clientSize().height

          for height in [@clientHeight, '50px', '5000px']
            $element = $('<div>').css(height: height)
            $element.appendTo(@$container)
            @$elements.push($element)

        afterEach ->
          @$container.remove()

        $documentViewport = ->
          $(up.browser.documentViewportSelector())

        it 'reveals the given element', asyncSpec (next) ->
          up.reveal(@$elements[0])

          next =>
            # ---------------------
            # [0] 0 .......... ch-1
            # ---------------------
            # [1] ch+0 ...... ch+49
            # [2] ch+50 ... ch+5049
            expect($documentViewport().scrollTop()).toBe(0)

            up.reveal(@$elements[1])

          next =>
            # ---------------------
            # [0] 0 .......... ch-1
            # [1] ch+0 ...... ch+49
            # ---------------------
            # [2] ch+50 ... ch+5049
            expect($documentViewport().scrollTop()).toBe(50)

            up.reveal(@$elements[2])

          next =>
            # [0] 0 .......... ch-1
            # [1] ch+0 ...... ch+49
            # ---------------------
            # [2] ch+50 ... ch+5049
            # ---------------------
            expect($documentViewport().scrollTop()).toBe(@clientHeight + 50)

        it "includes the element's top margin in the revealed area", asyncSpec (next) ->
          @$elements[1].css('margin-top': '20px')
          up.reveal(@$elements[1])
          next => expect($(document).scrollTop()).toBe(50 + 20)

        it "includes the element's bottom margin in the revealed area", asyncSpec (next) ->
          @$elements[1].css('margin-bottom': '20px')
          up.reveal(@$elements[2])
          next => expect($(document).scrollTop()).toBe(@clientHeight + 50 + 20)

        it 'snaps to the top if the space above the future-visible area is smaller than the value of config.snap', asyncSpec (next) ->
          up.layout.config.snap = 30

          @$elements[0].css(height: '20px')

          up.reveal(@$elements[2])

          next =>
            # [0] 0 ............ 19
            # [1] 20 ........... 69
            # ---------------------
            # [2] 70 ......... 5069
            # ---------------------
            expect($(document).scrollTop()).toBe(70)

            # Even though we're revealing the second element, the viewport
            # snaps to the top edge.
            up.reveal(@$elements[1])

          next =>
            # ---------------------
            # [0] 0 ............ 19
            # [1] 20 ........... 69
            # ---------------------
            # [2] 70 ......... 5069
            expect($(document).scrollTop()).toBe(0)

        it 'does not snap to the top if it would un-reveal an element at the bottom edge of the screen (bugfix)', asyncSpec (next) ->
          up.layout.config.snap = 100

          up.reveal(@$elements[1])

          next =>
            # ---------------------
            # [0] 0 .......... ch-1
            # [1] ch+0 ...... ch+49
            # ---------------------
            # [2] ch+50 ... ch+5049
            expect($(document).scrollTop()).toBe(50)


        it 'scrolls far enough so the element is not obstructed by an element fixed to the top', asyncSpec (next) ->
          $topNav = affix('[up-fixed=top]').css(
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0'
            height: '100px'
          )

          up.reveal(@$elements[0], viewport: @viewport)

          next =>
            # ---------------------
            # [F] 0 ............ 99
            # [0] 0 .......... ch-1
            # ---------------------
            # [1] ch+0 ...... ch+49
            # [2] ch+50 ... ch+5049
            expect($(document).scrollTop()).toBe(0) # would need to be -100

            up.reveal(@$elements[1])

          next =>
            # ---------------------
            # [F] 0 ............ 99
            # [0] 00000 ...... ch-1
            # [1] ch+0 ...... ch+49
            # ---------------------
            # [2] ch+50 ... ch+5049
            expect($(document).scrollTop()).toBe(50)

            up.reveal(@$elements[2])

          next =>
            # [0] 00000 ...... ch-1
            # [1] ch+0 ...... ch+49
            # ---------------------
            # [F] 0 ............ 99
            # [2] ch+50 ... ch+5049
            # ----------------
            expect($(document).scrollTop()).toBe(@clientHeight + 50 - 100)

            up.reveal(@$elements[1])

          next =>
            # [0] 00000 ...... ch-1
            # ---------------------
            # [F] 0 ............ 99
            # [1] ch+0 ...... ch+49
            # [2] ch+50 ... ch+5049
            # ----------------
            expect($(document).scrollTop()).toBe(@clientHeight + 50 - 100 - 50)

        it 'scrolls far enough so the element is not obstructed by an element fixed to the top with margin, padding and non-zero top properties', ->
          throw "needs tests"

        it 'scrolls far enough so the element is not obstructed by an element fixed to the bottom', asyncSpec (next) ->
          $bottomNav = affix('[up-fixed=bottom]').css(
            position: 'fixed',
            bottom: '0',
            left: '0',
            right: '0'
            height: '100px'
          )

          up.reveal(@$elements[0])

          next =>
            # ---------------------
            # [0] 0 .......... ch-1
            # [F] 0 ............ 99
            # ---------------------
            # [1] ch+0 ...... ch+49
            # [2] ch+50 ... ch+5049
            expect($(document).scrollTop()).toBe(0)

            up.reveal(@$elements[1])

          next =>
            # ---------------------
            # [0] 0 .......... ch-1
            # [1] ch+0 ...... ch+49
            # [F] 0 ............ 99
            # ---------------------
            # [2] ch+50 ... ch+5049
            expect($(document).scrollTop()).toBe(150)

            up.reveal(@$elements[2])

          next =>
            # ---------------------
            # [0] 0 .......... ch-1
            # [1] ch+0 ...... ch+49
            # ---------------------
            # [2] ch+50 ... ch+5049
            # [F] 0 ............ 99
            expect($(document).scrollTop()).toBe(@clientHeight + 50)

        it 'scrolls far enough so the element is not obstructed by an element fixed to the bottom with margin, padding and non-zero bottom properties', ->
          throw "needs tests"

        it 'does not crash when called with a CSS selector (bugfix)', (done) ->
          promise = up.reveal('.container')
          promiseState(promise).then (result) ->
            expect(result.state).toEqual('fulfilled')
            done()

        describe 'with { top: true } option', ->

          it 'scrolls the viewport to the first row of the element, even if that element is already fully revealed', asyncSpec (next) ->
            @$elements[0].css(height: '20px')

            up.reveal(@$elements[1], { top: true })

            next =>
              # [0] 0 ............ 19
              # [1] 20 ........... 69
              # ---------------------
              # [2] 70 ......... 5069
              # ---------------------
              expect($(document).scrollTop()).toBe(20)


      describe 'when the viewport is a container with overflow-y: scroll', ->

        it 'reveals the given element', asyncSpec (next) ->
          $viewport = affix('div').css
            'position': 'absolute'
            'top': '50px'
            'left': '50px'
            'width': '100px'
            'height': '100px'
            'overflow-y': 'scroll'
          $elements = []
          u.each [0..5], ->
            $element = $('<div>').css(height: '50px')
            $element.appendTo($viewport)
            $elements.push($element)

          # ------------
          # [0] 000..049
          # [1] 050..099
          # ------------
          # [2] 100..149
          # [3] 150..199
          # [4] 200..249
          # [5] 250..399
          expect($viewport.scrollTop()).toBe(0)

          # See that the view only scrolls down as little as possible
          # in order to reveal the element
          up.reveal($elements[3], viewport: $viewport)

          next =>
            # [0] 000..049
            # [1] 050..099
            # ------------
            # [2] 100..149
            # [3] 150..199
            # ------------
            # [4] 200..249
            # [5] 250..299
            expect($viewport.scrollTop()).toBe(100)

            # See that the view doesn't move if the element
            # is already revealed
            up.reveal($elements[2], viewport: $viewport)

          next =>
            expect($viewport.scrollTop()).toBe(100)

            # See that the view scrolls as far down as it cans
            # to show the bottom element
            up.reveal($elements[5], viewport: $viewport)

          next =>
            # [0] 000..049
            # [1] 050..099
            # [2] 100..149
            # [3] 150..199
            # ------------
            # [4] 200..249
            # [5] 250..299
            # ------------
            expect($viewport.scrollTop()).toBe(200)

            up.reveal($elements[1], viewport: $viewport)

          next =>
            # See that the view only scrolls up as little as possible
            # in order to reveal the element
            # [0] 000..049
            # ------------
            # [1] 050..099
            # [2] 100..149
            # ------------
            # [3] 150..199
            # [4] 200..249
            # [5] 250..299
            expect($viewport.scrollTop()).toBe(50)

      it 'only reveals the top number of pixels defined in config.substance', asyncSpec (next) ->

        up.layout.config.substance = 20

        $viewport = affix('div').css
          'position': 'absolute'
          'top': '50px'
          'left': '50px'
          'width': '100px'
          'height': '100px'
          'overflow-y': 'scroll'
        $elements = []
        u.each [0..5], ->
          $element = $('<div>').css(height: '50px')
          $element.appendTo($viewport)
          $elements.push($element)

        # [0] 000..049
        # [1] 050..099
        # [2] 100..149
        # [3] 150..199
        # [4] 200..249
        # [5] 250..299

        # Viewing 0 .. 99
        expect($viewport.scrollTop()).toBe(0)

        # See that the view only scrolls down as little as possible
        # in order to reveal the first 20 rows of the element
        up.reveal($elements[3], viewport: $viewport)

        next =>
          # Viewing 70 to 169
          expect($viewport.scrollTop()).toBe(50 + 20)

          # See that the view doesn't move if the element
          # is already revealed
          up.reveal($elements[2], viewport: $viewport)

        next =>
          expect($viewport.scrollTop()).toBe(50 + 20)

          # See that the view scrolls as far down as it cans
          # to show the first 20 rows of the bottom element
          up.reveal($elements[5], viewport: $viewport)

        next =>
          # Viewing 170 to 269
          expect($viewport.scrollTop()).toBe(150 + 20)

          # See that the view only scrolls up as little as possible
          # in order to reveal the first 20 rows element
          up.reveal($elements[2], viewport: $viewport)

        next =>
          # Viewing 100 to 199
          expect($viewport.scrollTop()).toBe(100)

    describe 'up.layout.revealHash', ->

      it 'reveals an element with an ID matching the given #hash', asyncSpec (next) ->
        revealSpy = up.layout.knife.mock('reveal')
        $match = affix('div#hash')
        up.layout.revealHash('#hash')
        next => expect(revealSpy).toHaveBeenCalledWith($match, top: true)

      it 'reveals a named anchor matching the given #hash', asyncSpec (next) ->
        revealSpy = up.layout.knife.mock('reveal')
        $match = affix('a[name="hash"]')
        up.layout.revealHash('#hash')
        next => expect(revealSpy).toHaveBeenCalledWith($match, top: true)

      it 'does nothing and returns a fulfilled promise if no element or anchor matches the given #hash', (done) ->
        revealSpy = up.layout.knife.mock('reveal')
        promise = up.layout.revealHash('#hash')
        expect(revealSpy).not.toHaveBeenCalled()
        promiseState(promise).then (result) ->
          expect(result.state).toEqual('fulfilled')
          done()

      it 'does nothing and returns a fulfilled promise if no #hash is given', (done) ->
        revealSpy = up.layout.knife.mock('reveal')
        promise = up.layout.revealHash('')
        expect(revealSpy).not.toHaveBeenCalled()
        promiseState(promise).then (result) ->
          expect(result.state).toEqual('fulfilled')
          done()

    describe 'up.layout.viewportsWithin', ->

      it 'should have tests'

    describe 'up.layout.viewportOf', ->

      it 'seeks upwards from the given element', ->
        up.layout.config.viewports = ['.viewport1', '.viewport2']
        $viewport1 = affix('.viewport1')
        $viewport2 = affix('.viewport2')
        $element = affix('div').appendTo($viewport2)
        expect(up.layout.viewportOf($element)).toEqual($viewport2)

      it 'returns the given element if it is a configured viewport itself', ->
        up.layout.config.viewports = ['.viewport']
        $viewport = affix('.viewport')
        expect(up.layout.viewportOf($viewport)).toEqual($viewport)

      describe 'when no configured viewport matches', ->

        afterEach ->
          @resetBodyCss?()
          @resetHtmlCss?()

        it 'falls back to the scrolling element', ->
          $element = affix('.element').css(height: '3000px')
          $result = up.layout.viewportOf($element)
          expect($result).toMatchSelector(up.browser.documentViewportSelector())

        it 'falls back to the scrolling element if <body> is configured to scroll (fix for Edge)', ->
          $element = affix('.element').css(height: '3000px')
          @resetHtmlCss = u.writeTemporaryStyle('html', 'overflow-y': 'hidden')
          @resetBodyCss = u.writeTemporaryStyle('body', 'overflow-y': 'scroll')
          $result = up.layout.viewportOf($element)
          expect($result).toMatchSelector(up.browser.documentViewportSelector())

        it 'falls back to the scrolling element if <html> is configured to scroll (fix for Edge)', ->
          $element = affix('.element').css(height: '3000px')
          @resetHtmlCss = u.writeTemporaryStyle('html', 'overflow-y': 'scroll')
          @resetBodyCss = u.writeTemporaryStyle('body', 'overflow-y': 'hidden')
          $result = up.layout.viewportOf($element)
          expect($result).toMatchSelector(up.browser.documentViewportSelector())

    describe 'up.layout.restoreScroll', ->

      it "restores a viewport's previously saved scroll position", (done) ->
        $viewport = affix('#viewport[up-viewport]').css(height: '100px', overflowY: 'scroll')
        $content = $viewport.affix('.content').css(height: '1000px')
        up.hello($viewport)
        $viewport.scrollTop(50)
        up.layout.saveScroll()
        $viewport.scrollTop(70)

        up.layout.restoreScroll().then ->
          expect($viewport.scrollTop()).toEqual(50)
          done()

      it "scrolls a viewport to the top (and does not crash) if no previous scroll position is known", (done) ->
        $viewport = affix('#viewport[up-viewport]').css(height: '100px', overflowY: 'scroll')
        $content = $viewport.affix('.content').css(height: '1000px')
        $viewport.scrollTop(70)

        up.layout.restoreScroll().then ->
          expect($viewport.scrollTop()).toEqual(0)
          done()

    describe 'up.scroll', ->

      it 'should have tests'

    describe 'up.layout.absolutize', ->

      afterEach ->
        $('.up-bounds, .fixture').remove()

      it 'absolutely positions the element, preserving visual position and size', ->
        $element = affix('.element').text('element text').css(paddingTop: '20px', paddingLeft: '20px')

        expect($element.css('position')).toEqual('static')
        previousDims = u.measure($element)

        up.layout.absolutize($element)

        expect($element.closest('.up-bounds').css('position')).toEqual('absolute')

        newDims = u.measure($element)
        expect(newDims).toEqual(previousDims)

      it 'accurately positions the ghost over an element with margins', ->
        $element = affix('.element').css(margin: '40px')
        previousDims = u.measure($element)

        up.layout.absolutize($element)

        newDims = u.measure($element)
        expect(newDims).toEqual(previousDims)

      it "doesn't change the position of a child whose margins no longer collapse", ->
        $element = affix('.element')
        $child = $('<div class="child">child text</div>').css(margin: '40px').appendTo($element)
        previousChildDims = u.measure($child)

        up.layout.absolutize($element)

        newChildDims = u.measure($child)
        expect(newChildDims).toEqual(previousChildDims)

      it 'correctly positions an element within a scrolled body', ->
        $body = $('body')
        $element1 = $('<div class="fixture"></div>').css(height: '75px').prependTo($body)
        $element2 = $('<div class="fixture"></div>').css(height: '100px').insertAfter($element1)
        $body.scrollTop(33)

        previousDims = u.measure($element2)

        up.layout.absolutize($element2)

        newDims = u.measure($element2)
        expect(newDims).toEqual(previousDims)

      it 'correctly positions an element within a scrolled parent element (that has overflow-y: scroll)', ->
        $viewport = affix('div').css
          overflowY: 'scroll'
          height: '50px'

        $element1 = $('<div class="fixture"></div>').css(height: '75px').prependTo($viewport)
        $element2 = $('<div class="fixture"></div>').css(height: '100px').insertAfter($element1)
        $viewport.scrollTop(33)

        previousDims = u.measure($element2)

        up.layout.absolutize($element2)

        newDims = u.measure($element2)
        expect(newDims).toEqual(previousDims)

      it 'converts fixed elements within the copies to absolutely positioning (relative to the closest offset parent)', ->
        $element = affix('.element').css
          position: 'absolute'
          top: '50px'
          left: '50px'
        $fixedChild = $('<div class="fixed-child" up-fixed></div>').css
          position: 'fixed'
          left: '77px'
          top: '77px'
        $fixedChild.appendTo($element)
        up.layout.absolutize($element)

        expect($fixedChild.css(['position', 'left', 'top'])).toEqual
          position: 'absolute',
          left: '27px',
          top: '27px'

      it "does not convert fixed elements outside the element's subtree (bugfix)", ->
        $element = affix('.element').css(position: 'absolute')
        $fixedChild = $('<div class="fixed-child" up-fixed></div>').css(position: 'fixed')
        $fixedChild.appendTo($element)
        $fixedSibling = affix('[up-fixed]').css(position: 'fixed')

        up.layout.absolutize($element)

        expect($fixedChild.css('position')).toEqual('absolute')
        expect($fixedSibling.css('position')).toEqual('fixed')
