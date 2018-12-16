u = up.util
e = up.element
$ = jQuery

describe 'up.viewport', ->

  describe 'JavaScript functions', ->

    describe 'up.reveal', ->

      beforeEach ->
        up.viewport.config.revealSnap = 0

      describe 'when the viewport is the document', ->

        beforeEach ->
          $body = $('body')

          @$elements = []
          @$container = $('<div class="container">').prependTo($body)
          @$container.css(opacity: 0.2) # reduce flashing during test runs

          @clientHeight = up.viewport.rootHeight()

          elementPlans = [
            { height: @clientHeight, backgroundColor: 'yellow' }, # [0]
            { height: '50px',        backgroundColor: 'cyan'   }, # [1]
            { height: '5000px',      backgroundColor: 'orange' }  # [2]
          ]

          for elementPlan in elementPlans
            $element = $('<div>').css(elementPlan)
            $element.appendTo(@$container)
            @$elements.push($element)

        afterEach ->
          @$container.remove()

        $documentViewport = ->
          $(up.viewport.root())

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

        it 'snaps to the top if the space above the future-visible area is smaller than the value of config.revealSnap', asyncSpec (next) ->
          up.viewport.config.revealSnap = 30

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
          up.viewport.config.revealSnap = 100

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

          up.reveal(@$elements[0])

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

        it 'scrolls far enough so the element is not obstructed by an element fixed to the top with margin, padding, border and non-zero top properties', asyncSpec (next) ->
          $topNav = affix('[up-fixed=top]').css(
            position: 'fixed',
            top: '29px',
            margin: '16px',
            border: '7px solid rgba(0, 0, 0, 0.1)',
            padding: '5px'
            left: '0',
            right: '0'
            height: '100px'
          )

          up.reveal(@$elements[2], viewport: @viewport)

          next =>
            # [0] 00000 ...... ch-1  [F] 0 ...... 99+props
            # [1] ch+0 ...... ch+49
            # ---------------------  ---------------------
            # [2] ch+50 ... ch+5049
            # ---------------------

            expect($(document).scrollTop()).toBe(
              @clientHeight +  # scroll past @$elements[0]
              50            -  # scroll past @$elements[1]
              100           -  # obstruction height
              29            -  # obstruction's top property
              (1 * 16)      -  # top margin (bottom margin is not a visual obstruction)
              (2 * 7)       -  # obstruction top and bottom borders
              (2 * 5)          # obstruction top and bottom paddings
            )

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

        it 'scrolls far enough so the element is not obstructed by an element fixed to the bottom with margin, padding, border and non-zero bottom properties', asyncSpec (next) ->
          $bottomNav = affix('[up-fixed=bottom]').css(
            position: 'fixed',
            bottom: '29px',
            margin: '16px',
            border: '7px solid rgba(0, 0, 0, 0.2)',
            padding: '5px',
            left: '0',
            right: '0'
            height: '100px'
          )

          up.reveal(@$elements[1])

          next =>
            # ---------------------
            # [0] 0 .......... ch-1
            # [1] ch+0 ...... ch+49
            # ---------------------
            # [2] ch+50 ... ch+5049
            # [F] 0 ...... 99+props
            expect($(document).scrollTop()).toBe(
              50        +  # height of elements[1]
              100       +  # obstruction height
              29        +  # obstruction's bottom property
              (1 * 16)  +  # bottom margin (top margin is not a visual obstruction)
              (2 * 7)   +  # obstruction top and bottom borders
              (2 * 5)      # obstruction top and bottom paddings
            )

        it 'does not crash when called with a CSS selector (bugfix)', (done) ->
          promise = up.reveal('.container', { behavior: 'instant' })
          promise.then ->
            expect(true).toBe(true)
            done()

        it 'scrolls the viewport to the first row if the element if the element is higher than the viewport', asyncSpec (next) ->
          @$elements[0].css(height: '1000px')
          @$elements[1].css(height: '3000px')

          up.reveal(@$elements[1])

          next =>
            # [0] 0 ............ 999
            # [1] 1000 ........ 4999
            expect($(document).scrollTop()).toBe(1000)


        describe 'with { top: true } option', ->

          it 'scrolls the viewport to the first row of the element, even if that element is already fully revealed', asyncSpec (next) ->
            @$elements[0].css(height: '20px')

            up.reveal(@$elements[1], { top: true, snap: false })

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
          up.reveal($elements[3], viewport: $viewport[0])

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
            up.reveal($elements[2], viewport: $viewport[0])

          next =>
            expect($viewport.scrollTop()).toBe(100)

            # See that the view scrolls as far down as it cans
            # to show the bottom element
            up.reveal($elements[5], viewport: $viewport[0])

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

            up.reveal($elements[1], viewport: $viewport[0])

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

    describe 'up.viewport.revealHash', ->

      it 'reveals an element with an ID matching the given #hash', asyncSpec (next) ->
        revealSpy = up.viewport.knife.mock('reveal')
        $match = affix('div#hash')
        up.viewport.revealHash('#hash')
        next => expect(revealSpy).toHaveBeenCalledWith($match[0], top: true)

      it 'reveals a named anchor matching the given #hash', asyncSpec (next) ->
        revealSpy = up.viewport.knife.mock('reveal')
        $match = affix('a[name="hash"]')
        up.viewport.revealHash('#hash')
        next => expect(revealSpy).toHaveBeenCalledWith($match[0], top: true)

      it 'reveals an element with an [up-id] attribute matching the given #hash', asyncSpec (next) ->
        revealSpy = up.viewport.knife.mock('reveal')
        $match = affix('div[up-id="hash"]')
        up.viewport.revealHash('#hash')
        next => expect(revealSpy).toHaveBeenCalledWith($match[0], top: true)

      it 'does nothing and returns a fulfilled promise if no element or anchor matches the given #hash', (done) ->
        revealSpy = up.viewport.knife.mock('reveal')
        promise = up.viewport.revealHash('#hash')
        expect(revealSpy).not.toHaveBeenCalled()
        promiseState(promise).then (result) ->
          expect(result.state).toEqual('fulfilled')
          done()

      it 'does nothing and returns a fulfilled promise if no #hash is given', (done) ->
        revealSpy = up.viewport.knife.mock('reveal')
        promise = up.viewport.revealHash('')
        expect(revealSpy).not.toHaveBeenCalled()
        promiseState(promise).then (result) ->
          expect(result.state).toEqual('fulfilled')
          done()

    describe 'up.viewport.all', ->

      it 'returns a list of all viewports on the screen', ->
        viewportElement = affix('[up-viewport]')[0]
        results = up.viewport.all()
        expect(results).toMatchList([viewportElement, up.viewport.root()])

    describe 'up.viewport.subtree', ->

      it 'returns descendant viewports of the given element', ->
        $motherViewport = affix('.mother[up-viewport]')
        $element = $motherViewport.affix('.element')
        $childViewport = $element.affix('.child[up-viewport]')
        $grandChildViewport = $childViewport.affix('.grand-child[up-viewport]')
        actual = up.viewport.subtree($element[0])
        expected = $childViewport.add($grandChildViewport)

        expect(actual).toMatchList(expected)

      it 'returns the given element if it is a viewport', ->
        viewportElement = affix('[up-viewport]')[0]
        results = up.viewport.subtree(viewportElement)
        expect(results).toMatchList([viewportElement])

    describe 'up.viewport.around', ->

      it 'returns viewports that  are either ancestors, descendants, or the given element itself', ->
        $motherViewport = affix('.mother[up-viewport]')
        $element = $motherViewport.affix('.element')
        $childViewport = $element.affix('.child[up-viewport]')
        $grandChildViewport = $childViewport.affix('.grand-child[up-viewport]')
        actual = up.viewport.around($element[0])
        expected = $motherViewport.add($childViewport).add($grandChildViewport)

        expect(actual).toMatchList(expected)

    describe 'up.viewport.closest', ->

      it 'seeks upwards from the given element', ->
        up.viewport.config.viewports = ['.viewport1', '.viewport2']
        $viewport1 = affix('.viewport1')
        $viewport2 = affix('.viewport2')
        $element = affix('div').appendTo($viewport2)
        expect(up.viewport.closest($element)).toEqual($viewport2[0])

      it 'returns the given element if it is a configured viewport itself', ->
        up.viewport.config.viewports = ['.viewport']
        $viewport = affix('.viewport')
        expect(up.viewport.closest($viewport)).toEqual($viewport[0])

      describe 'when no configured viewport matches', ->

        afterEach ->
          @resetBodyCss?()
          @resetHtmlCss?()

        it 'falls back to the scrolling element', ->
          $element = affix('.element').css(height: '3000px')
          $result = up.viewport.closest($element)
          expect($result).toMatchSelector(up.viewport.rootSelector())

        it 'falls back to the scrolling element if <body> is configured to scroll (fix for Edge)', ->
          $element = affix('.element').css(height: '3000px')
          @resetHtmlCss = e.writeTemporaryStyle('html', 'overflow-y': 'hidden')
          @resetBodyCss = e.writeTemporaryStyle('body', 'overflow-y': 'scroll')
          $result = up.viewport.closest($element)
          expect($result).toMatchSelector(up.viewport.rootSelector())

        it 'falls back to the scrolling element if <html> is configured to scroll (fix for Edge)', ->
          $element = affix('.element').css(height: '3000px')
          @resetHtmlCss = e.writeTemporaryStyle('html', 'overflow-y': 'scroll')
          @resetBodyCss = e.writeTemporaryStyle('body', 'overflow-y': 'hidden')
          $result = up.viewport.closest($element)
          expect($result).toMatchSelector(up.viewport.rootSelector())

    describe 'up.viewport.restoreScroll', ->

      it "restores a viewport's previously saved scroll position", (done) ->
        $viewport = affix('#viewport[up-viewport]').css(height: '100px', overflowY: 'scroll')
        $content = $viewport.affix('.content').css(height: '1000px')
        up.hello($viewport)
        $viewport.scrollTop(50)
        up.viewport.saveScroll()
        $viewport.scrollTop(70)

        up.viewport.restoreScroll().then ->
          expect($viewport.scrollTop()).toEqual(50)
          done()

      it "scrolls a viewport to the top (and does not crash) if no previous scroll position is known", (done) ->
        $viewport = affix('#viewport[up-viewport]').css(height: '100px', overflowY: 'scroll')
        $content = $viewport.affix('.content').css(height: '1000px')
        $viewport.scrollTop(70)

        up.viewport.restoreScroll().then ->
          expect($viewport.scrollTop()).toEqual(0)
          done()

    describe 'up.scroll', ->

      it 'should have tests'

    describe 'up.viewport.absolutize', ->

      afterEach ->
        $('.up-bounds, .fixture').remove()

      it 'absolutely positions the element, preserving visual position and size', ->
        $element = affix('.element').text('element text').css(paddingTop: '20px', paddingLeft: '20px')

        expect($element.css('position')).toEqual('static')
        previousDims = $element[0].getBoundingClientRect()

        up.viewport.absolutize($element)

        expect($element.closest('.up-bounds').css('position')).toEqual('absolute')

        newDims = $element[0].getBoundingClientRect()
        expect(newDims).toEqual(previousDims)

      it 'accurately positions the ghost over an element with margins', ->
        $element = affix('.element').css(margin: '40px')
        previousDims = $element[0].getBoundingClientRect()

        up.viewport.absolutize($element)

        newDims = $element[0].getBoundingClientRect()
        expect(newDims).toEqual(previousDims)

      it "doesn't change the position of a child whose margins no longer collapse", ->
        $element = affix('.element')
        $child = $('<div class="child">child text</div>').css(margin: '40px').appendTo($element)
        previousChildDims = $child[0].getBoundingClientRect()

        up.viewport.absolutize($element)

        newChildDims = $child[0].getBoundingClientRect()
        expect(newChildDims).toEqual(previousChildDims)

      it 'correctly positions an element within a scrolled body', ->
        $body = $('body')
        $element1 = $('<div class="fixture"></div>').css(height: '75px').prependTo($body)
        $element2 = $('<div class="fixture"></div>').css(height: '100px').insertAfter($element1)
        $body.scrollTop(33)

        previousDims = $element2[0].getBoundingClientRect()

        up.viewport.absolutize($element2)

        newDims = $element2[0].getBoundingClientRect()
        expect(newDims).toEqual(previousDims)

      it 'correctly positions an element within a scrolled parent element (that has overflow-y: scroll)', ->
        $viewport = affix('div').css
          overflowY: 'scroll'
          height: '50px'

        $element1 = $('<div class="fixture"></div>').css(height: '75px').prependTo($viewport)
        $element2 = $('<div class="fixture"></div>').css(height: '100px').insertAfter($element1)
        $viewport.scrollTop(33)

        previousDims = $element2[0].getBoundingClientRect()

        up.viewport.absolutize($element2)

        newDims = $element2[0].getBoundingClientRect()
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
        up.viewport.absolutize($element)

        expect($fixedChild.css(['position', 'left', 'top'])).toEqual
          position: 'absolute',
          left: '27px',
          top: '27px'

      it "does not convert fixed elements outside the element's subtree (bugfix)", ->
        $element = affix('.element').css(position: 'absolute')
        $fixedChild = $('<div class="fixed-child" up-fixed></div>').css(position: 'fixed')
        $fixedChild.appendTo($element)
        $fixedSibling = affix('[up-fixed]').css(position: 'fixed')

        up.viewport.absolutize($element)

        expect($fixedChild.css('position')).toEqual('absolute')
        expect($fixedSibling.css('position')).toEqual('fixed')
