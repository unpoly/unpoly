u = up.util
e = up.element
$ = jQuery

describe 'up.viewport', ->

  describe 'JavaScript functions', ->

    describe 'up.focus()', ->

      describe 'focus ring', ->

        useMouse = ->
          Trigger.clickSequence(document.body)
          expect(up.event.inputDevice).toBe('pointer')

        useKeyboard = ->
          Trigger.keySequence(document.body, 'Enter')
          expect(up.event.inputDevice).toBe('key')

        describe 'with { focusVisible: true }', ->

          describe 'when using the mouse', ->
            beforeEach(useMouse)
            beforeEach(up.specUtil.assertTabFocused)

            it 'shows a focus ring for a non-field element', ->
              div = fixture('div', text: 'text')
              up.focus(div, { focusVisible: true, force: true })

              expect(div).toBeFocused()
              expect(div).toHaveOutline()

            it 'shows a focus ring when a non-field element is focused multiple times', ->
              div = fixture('div', text: 'text')
              up.focus(div, { focusVisible: true, force: true })

              await wait()

              up.focus(div, { focusVisible: true, force: true })

              expect(div).toBeFocused()
              expect(div).toHaveOutline()

            it 'removes a focus ring when another element is focused afterwards', ->
              div = fixture('div', text: 'text')
              input = fixture('input[type=text][name=foo]')
              up.focus(div, { focusVisible: true, force: true })

              await wait()

              up.focus(input, { focusVisible: true, force: true })

              await wait()

              expect(input).toBeFocused()
              expect(div).not.toHaveOutline()

        describe 'with { focusVisible: false }', ->

          describe 'when using the keyboard', ->
            beforeEach(useKeyboard)

            it 'hides a focus ring for a field element', ->
              input = fixture('input[type=text]', value: 'text')
              up.focus(input, { focusVisible: false })

              expect(input).toBeFocused()
              expect(input).not.toHaveOutline()

        describe 'with { focusVisible: "auto" }', ->

          describe 'when using the mouse', ->
            beforeEach(useMouse)

            it 'hides a focus ring for a non-field element', ->
              div = fixture('div', text: 'text')
              up.focus(div, { focusVisible: 'auto', force: true })

              expect(div).toBeFocused()
              expect(div).not.toHaveOutline()

            it 'keeps hiding the focus ring when the user focuses another window and then returns to the app window', ->
              div = fixture('div', text: 'text')
              up.focus(div, { focusVisible: 'auto', force: true })

              expect(div).toBeFocused()
              expect(div).not.toHaveOutline()

              # Simulate browser behavior when the user switches to another window and then returns to the app window.
              div.blur()
              await wait()
              div.focus({ focusVisible: true })

              expect(div).toBeFocused()
              expect(div).not.toHaveOutline()

            it 'shows a focus ring for a field element', ->
              input = fixture('input[type=text]', value: 'text')
              up.focus(input, { focusVisible: 'auto' })

              expect(input).toBeFocused()
              expect(input).toHaveOutline()

          describe 'when using the keyboard', ->
            beforeEach(useKeyboard)

            it 'shows a focus ring for a non-field element', ->
              div = fixture('div', text: 'text')
              up.focus(div, { focusVisible: 'auto', force: true })

              expect(div).toBeFocused()
              expect(div).toHaveOutline()

    describe 'up.viewport.focusedElementWithin()', ->

      it 'returns the focused element if it is contained by the given root', ->
        root = fixture('.root')
        button = e.affix(root, 'button')
        button.focus()

        expect(up.viewport.focusedElementWithin(root)).toBe(button)

      it 'returns undefined if the focused element is not contained by the given root', ->
        root = fixture('.root')
        button = fixture('button')
        button.focus()

        expect(up.viewport.focusedElementWithin(root)).toBeMissing()

      it 'returns undefined if no element is focused', ->
        root = fixture('.root')
        expect(up.viewport.focusedElementWithin(root)).toBeMissing()

      it 'returns undefined if the given root is the <body>, but the focused element is an overlay', ->
        overlay = await up.layer.open()
        button = overlay.affix('button')
        button.focus()

        expect(up.viewport.focusedElementWithin(document.body)).toBeMissing()

    describe 'up.reveal()', ->

      beforeEach ->
        up.viewport.config.revealSnap = 0
        up.viewport.config.revealMax = false

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
          $(up.viewport.root)

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
          $topNav = $fixture('[up-fixed=top]').css(
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
          $topNav = $fixture('[up-fixed=top]').css(
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
          $bottomNav = $fixture('[up-fixed=bottom]').css(
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
          $bottomNav = $fixture('[up-fixed=bottom]').css(
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

        it 'ignores a bottom-fixed obstruction that is not visible (bugfix)', asyncSpec (next) ->
          bottomNav = fixture('[up-fixed=bottom]', style: {
            position: 'fixed'
            bottom: '0px'
            left: '0px'
            right: '0px'
            height: '100px'
            display: 'none'
          })

          up.reveal(@$elements[1])

          expect(document.scrollingElement.scrollTop).toBe(50)

        it 'does not crash when called with a CSS selector (bugfix)', ->
          up.reveal('.container', { behavior: 'instant' })
          expect(true).toBe(true)

        it 'scrolls the viewport to the first row if the element if the element is higher than the viewport', asyncSpec (next) ->
          @$elements[0].css(height: '1000px')
          @$elements[1].css(height: '3000px')

          up.reveal(@$elements[1])

          next =>
            # [0] 0 ............ 999
            # [1] 1000 ........ 4999
            expect($(document).scrollTop()).toBe(1000)

        it 'only reveals the top number of pixels defined in config.revealMax', asyncSpec (next) ->
          up.viewport.config.revealMax = 20

          $viewport = $fixture('div').css
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
          $viewport = $fixture('div').css
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

      describe 'with { behavior: "smooth" }', ->

        it 'animates the scroll motion', ->
          fixture('.between', text: 'between', style: { height: '20000px' })
          destination = fixture('.destination', text: 'destination')

          expect(document.scrollingElement.scrollTop).toBe(0)

          up.reveal(destination, behavior: 'smooth')

          await wait(80)

          expect(document.scrollingElement.scrollTop).toBeGreaterThan(10)
          expect(document.scrollingElement.scrollTop).toBeLessThan(19000)

      describe 'without a { behavior } option', ->

        it 'defaults to { behavior: "instant" } to ignore a scroll-behavior set in CSS', ->
          viewport = fixture('#viewport[up-viewport]', style: { 'height': '100px', 'overflow-y': 'scroll' })
          before = e.affix(viewport, '#before', style: { 'height': '20000px' })
          target = e.affix(viewport, '#target', style: { 'height': '10px' })

          spyOn(viewport, 'scrollTo')

          up.reveal(target)

          expect(viewport.scrollTo).toHaveBeenCalledWith(jasmine.objectContaining(behavior: 'instant'))

    if up.migrate.loaded
      describe 'up.scroll()', ->

        it 'scrolls the given viewport to the given Y position', ->
          viewport = fixture('.viewport[up-viewport]', style: { height: '100px', 'overflow-y': 'scroll' })
          content = e.affix(viewport, '.content', style: { height: '1000px' })

          expect(viewport.scrollTop).toBe(0)

          up.scroll(viewport, 78)

          expect(viewport.scrollTop).toBe(78)

        it 'returns a promise', ->
          viewport = fixture('.viewport[up-viewport]')
          value = up.scroll(viewport, 78)
          expect(value).toHaveKey('then')

    describe 'up.viewport.revealHash()', ->

      it 'reveals an element with an ID matching the given #hash', asyncSpec (next) ->
        revealSpy = up.reveal.mock().and.returnValue(Promise.resolve())
        $match = $fixture('div#hash')
        up.viewport.revealHash('#hash')
        next => expect(revealSpy).toHaveBeenCalledWith($match[0], jasmine.anything())

      it 'reveals a named anchor matching the given #hash', asyncSpec (next) ->
        revealSpy = up.reveal.mock().and.returnValue(Promise.resolve())
        $match = $fixture('a[name="hash"]')
        up.viewport.revealHash('#hash')
        next => expect(revealSpy).toHaveBeenCalledWith($match[0], jasmine.anything())

      it 'returns a truthy value so up.FragmentScrolling knows that scrolling succeeded', ->
        fixture('#hash')
        result = up.viewport.revealHash('#hash')
        expect(result).toBeTruthy()

      describe 'if no element or anchor matches the given #hash', ->

        it 'does not change the scroll position', asyncSpec (next) ->
          fixture('.high', style: { height: '10000px' }) # Ensure we have a vertical scroll bar
          revealSpy = up.reveal.mock()
          up.viewport.root.scrollTop = 50
          up.viewport.revealHash('#hash')
          next ->
            expect(revealSpy).not.toHaveBeenCalled()
            # Assert that we did not change the scroll position
            expect(up.viewport.root.scrollTop).toBe(50)

        it 'returns a falsy value so up.FragmentScrolling knows it needs to try the next option', ->
          fixture('.high', style: { height: '10000px' }) # Ensure we have a vertical scroll bar
          result = up.viewport.revealHash('#hash')
          expect(result).toBeFalsy()

    describe 'up.viewport.subtree()', ->

      it 'returns descendant viewports of the given element', ->
        $motherViewport = $fixture('.mother[up-viewport]')
        $element = $motherViewport.affix('.element')
        $childViewport = $element.affix('.child[up-viewport]')
        $grandChildViewport = $childViewport.affix('.grand-child[up-viewport]')
        actual = up.viewport.subtree($element[0])
        expected = $childViewport.add($grandChildViewport)

        expect(actual).toMatchList(expected)

      it 'returns the given element if it is a viewport', ->
        viewportElement = $fixture('.viewport[up-viewport]')[0]
        results = up.viewport.subtree(viewportElement)
        expect(results).toMatchList([viewportElement])

    describe 'up.viewport.around()', ->

      it 'returns viewports that  are either ancestors, descendants, or the given element itself', ->
        $motherViewport = $fixture('.mother[up-viewport]')
        $element = $motherViewport.affix('.element')
        $childViewport = $element.affix('.child[up-viewport]')
        $grandChildViewport = $childViewport.affix('.grand-child[up-viewport]')
        actual = up.viewport.around($element[0])
        expected = $motherViewport.add($childViewport).add($grandChildViewport)

        expect(actual).toMatchList(expected)

    describe 'up.viewport.get()', ->

      it 'seeks upwards from the given element', ->
        up.viewport.config.viewportSelectors = ['.viewport1', '.viewport2']
        $viewport1 = $fixture('.viewport1')
        $viewport2 = $fixture('.viewport2')
        $element = $fixture('div').appendTo($viewport2)
        expect(up.viewport.get($element)).toEqual($viewport2[0])

      it 'returns the given element if it is a configured viewport itself', ->
        up.viewport.config.viewportSelectors = ['.viewport']
        $viewport = $fixture('.viewport')
        expect(up.viewport.get($viewport)).toEqual($viewport[0])

      describe 'when no configured viewport matches', ->

        afterEach ->
          @resetBodyCSS?()
          @resetHTMLCSS?()

        it 'falls back to the scrolling element', ->
          element = fixture('.element', style: { height: '3000px' })
          result = up.viewport.get(element)
          expect(result).toBe(document.scrollingElement)

        it 'falls back to the scrolling element if <body> is configured to scroll (fix for Edge)', ->
          element = fixture('.element', style: { height: '3000px' })
          @resetHTMLCSS = e.setStyleTemp(document.documentElement, 'overflow-y': 'hidden')
          @resetBodyCSS = e.setStyleTemp(document.body, 'overflow-y': 'scroll')
          result = up.viewport.get(element)
          expect(result).toBe(document.scrollingElement)

        it 'falls back to the scrolling element if <html> is configured to scroll (fix for Edge)', ->
          element = fixture('.element', style: { height: '3000px' })
          @resetHTMLCSS = e.setStyleTemp(document.documentElement, 'overflow-y': 'scroll')
          @resetBodyCSS = e.setStyleTemp(document.body, 'overflow-y': 'hidden')
          result = up.viewport.get(element)
          expect(result).toBe(document.scrollingElement)

    describe 'up.viewport.restoreScroll()', ->

      it "restores a viewport's previously saved scroll position", ->
        $viewport = $fixture('#viewport[up-viewport]').css(height: '100px', overflowY: 'scroll')
        $content = $viewport.affix('.content').css(height: '1000px')
        up.hello($viewport)
        $viewport.scrollTop(50)
        up.viewport.saveScroll()
        $viewport.scrollTop(70)

        up.viewport.restoreScroll()

        expect($viewport.scrollTop()).toEqual(50)

      it 'does not restore scroll positions that were saved for another layer', asyncSpec (next) ->
        viewportHTML = """
          <div class="viewport" up-viewport style="height: 100px; overflow-y: scroll">
            <div style="height: 1000px">
            </div>
          </div>
        """

        makeLayers [
          { content: viewportHTML },
          { content: viewportHTML }
        ]

        next =>
          @rootViewport = up.fragment.get('.viewport', layer: 'root')
          @overlayViewport = up.fragment.get('.viewport', layer: 'overlay')

          @rootViewport.scrollTop = 10
          @overlayViewport.scrollTop = 20

          up.viewport.saveScroll(layer: 'root')

          @rootViewport.scrollTop = 0
          @overlayViewport.scrollTop = 0

          up.viewport.restoreScroll(layer: 'root')

        next =>
          expect(@rootViewport.scrollTop).toBe(10)
          expect(@overlayViewport.scrollTop).toBe(0)

      it "returns true if a previous scroll position is known and could be restored", ->
        $viewport = $fixture('#viewport[up-viewport]').css(height: '100px', overflowY: 'scroll')
        $content = $viewport.affix('.content').css(height: '1000px')
        up.hello($viewport)
        up.viewport.saveScroll()
        expect(up.viewport.restoreScroll()).toBe(true)

      it "does not scroll and returns a falsey value if no previous scroll position is known", ->
        $viewport = $fixture('#viewport[up-viewport]').css(height: '100px', overflowY: 'scroll')
        $content = $viewport.affix('.content').css(height: '1000px')
        $viewport.scrollTop(70)

        expect(up.viewport.restoreScroll()).toBeFalsy()
        expect($viewport.scrollTop()).toEqual(70)

    describe 'up.viewport.absolutize()', ->

      afterEach ->
        $('up-bounds, .fixture').remove()

      it 'absolutely positions the element, preserving visual position and size', ->
        $element = $fixture('.element').text('element text').css(paddingTop: '20px', paddingLeft: '20px')

        expect($element.css('position')).toEqual('static')
        previousDims = $element[0].getBoundingClientRect()

        up.viewport.absolutize($element[0])

        expect($element.closest('up-bounds').css('position')).toEqual('absolute')

        newDims = $element[0].getBoundingClientRect()
        expect(newDims).toEqual(previousDims)

      it 'accurately positions the ghost over an element with margins', ->
        $element = $fixture('.element').css(margin: '40px')
        previousDims = $element[0].getBoundingClientRect()

        up.viewport.absolutize($element[0])

        newDims = $element[0].getBoundingClientRect()
        expect(newDims).toEqual(previousDims)

      it "doesn't change the position of a child whose margins no longer collapse", ->
        $element = $fixture('.element')
        $child = $('<div class="child">child text</div>').css(margin: '40px').appendTo($element)
        previousChildDims = $child[0].getBoundingClientRect()

        up.viewport.absolutize($element[0])

        newChildDims = $child[0].getBoundingClientRect()
        expect(newChildDims).toEqual(previousChildDims)

      it 'correctly positions an element within a scrolled body', ->
        $body = $('body')
        $element1 = $('<div class="fixture"></div>').css(height: '75px').prependTo($body)
        $element2 = $('<div class="fixture"></div>').css(height: '100px').insertAfter($element1)
        $body.scrollTop(33)

        previousDims = $element2[0].getBoundingClientRect()

        up.viewport.absolutize($element2[0])

        newDims = $element2[0].getBoundingClientRect()
        expect(newDims).toEqual(previousDims)

      it 'correctly positions an element within a scrolled parent element (that has overflow-y: scroll)', ->
        $viewport = $fixture('div').css
          overflowY: 'scroll'
          height: '50px'

        $element1 = $('<div class="fixture"></div>').css(height: '75px').prependTo($viewport)
        $element2 = $('<div class="fixture"></div>').css(height: '100px').insertAfter($element1)
        $viewport.scrollTop(33)

        previousDims = $element2[0].getBoundingClientRect()

        up.viewport.absolutize($element2[0])

        newDims = $element2[0].getBoundingClientRect()
        expect(newDims).toEqual(previousDims)

      it 'converts fixed elements within the copies to absolutely positioning (relative to the closest offset parent)', ->
        $element = $fixture('.element').css
          position: 'absolute'
          top: '50px'
          left: '50px'
        $fixedChild = $('<div class="fixed-child" up-fixed></div>').css
          position: 'fixed'
          left: '77px'
          top: '77px'
        $fixedChild.appendTo($element)
        up.viewport.absolutize($element[0])

        expect($fixedChild.css(['position', 'left', 'top'])).toEqual
          position: 'absolute',
          left: '27px',
          top: '27px'

      it "does not convert fixed elements outside the element's subtree (bugfix)", ->
        $element = $fixture('.element').css(position: 'absolute')
        $fixedChild = $('<div class="fixed-child" up-fixed></div>').css(position: 'fixed')
        $fixedChild.appendTo($element)
        $fixedSibling = $fixture('[up-fixed]').css(position: 'fixed')

        up.viewport.absolutize($element[0])

        expect($fixedChild.css('position')).toEqual('absolute')
        expect($fixedSibling.css('position')).toEqual('fixed')

  describe 'unobtrusive behavior', ->

    it 'does not add focus-related classes to the <html> or <body> element (bugfix)', ->
      expect(document.body).not.toHaveClass('up-focus-hidden')
      expect(document.body).not.toHaveClass('up-focus-visible')
      expect(document.documentElement).not.toHaveClass('up-focus-hidden')
      expect(document.documentElement).not.toHaveClass('up-focus-visible')

    describe 'honoring obstructions when the location #hash changes', ->

      describe 'when the #hash is changed manually', ->

        it 'reveals a matching fragment', ->
          # The browser will only fire a hashchange event if the hash actually did change.
          # In case someone re-runs this spec, reset the hash before we setup our test below.
          location.hash = ''
          await wait()

          highElement = fixture('.high', style: { height: '10000px' }) # ensure we can scroll
          element = fixture('#element', text: 'content', style: { position: 'absolute', top: '5000px' })
          obstruction = fixture('.obstruction[up-fixed=top]', text: 'obstructions', style: { 'position': 'fixed', 'top': '0px', 'height': '30px', 'background-color': 'blue' })

          location.hash = "#element"
          await wait()

          expect(up.viewport.root.scrollTop).toBe(5000 - 30)

        it 'does not reveal when the new #hash is empty', ->
          # The browser will only fire a hashchange event if the hash actually did change.
          # In case someone re-runs this spec, reset the hash before we setup our test below.
          location.hash = '#elsewhere'
          await wait()

          revealSpy = up.reveal.mock()

          location.hash = ""
          await wait()

          expect(revealSpy).not.toHaveBeenCalled()

      describe 'when an a[href^="#"] is clicked', ->

        it "reveals a fragment matching the link's hash", ->
          location.hash = ''
          await wait()

          highElement = fixture('.high', style: { height: '10000px' }) # ensure we can scroll
          element = fixture('#element', text: 'content', style: { position: 'absolute', top: '5000px' })
          obstruction = fixture('.obstruction[up-fixed=top]', text: 'obstructions', style: { 'position': 'fixed', 'top': '0px', 'height': '30px', 'background-color': 'blue' })
          link = fixture('a', href: '#element')

          Trigger.clickSequence(link)
          await wait()

          expect(up.viewport.root.scrollTop).toBe(5000 - 30)
          expect(location.hash).toBe('#element')

        it "reveals a fragment when the location is already on the link's #hash", ->
          location.hash = '#element'
          await wait()

          highElement = fixture('.high', style: { height: '10000px' }) # ensure we can scroll
          element = fixture('#element', text: 'content', style: { position: 'absolute', top: '5000px' })
          obstruction = fixture('.obstruction[up-fixed=top]', text: 'obstructions', style: { 'position': 'fixed', 'top': '0px', 'height': '30px', 'background-color': 'blue' })
          link = fixture('a', href: '#element')

          Trigger.clickSequence(link)
          await wait()

          expect(up.viewport.root.scrollTop).toBe(5000 - 30)
          expect(location.hash).toBe('#element')

        it "does not reveal when no fragment matches the link's #hash", ->
          location.hash = ''
          await wait()

          link = fixture('a', href: '#element')
          revealSpy = up.reveal.mock()

          Trigger.clickSequence(link)
          await wait()

          expect(revealSpy).not.toHaveBeenCalled()
          expect(location.hash).toBe('#element')

        it "scrolls to the top if the link's hash is just the '#' symbol", ->
          location.hash = ''
          await wait()

          highElement = fixture('.high', style: { height: '10000px' }) # ensure we can scroll
          up.viewport.root.scrollTop = 3000
          expect(up.viewport.root.scrollTop).toBe(3000)

          link = fixture('a', href: '#')

          Trigger.clickSequence(link)
          await wait()

          expect(up.viewport.root.scrollTop).toBe(0)
          expect(location.hash).toBe('')
