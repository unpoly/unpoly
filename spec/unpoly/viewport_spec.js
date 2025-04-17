const u = up.util
const e = up.element
const $ = jQuery

describe('up.viewport', function() {

  describe('JavaScript functions', function() {

    describe('up.focus()', function() {
      describe('focus ring visibility', function() {

        const useMouse = function() {
          Trigger.clickSequence(document.body)
          expect(up.event.inputDevice).toBe('pointer')
        }

        const useKeyboard = function() {
          Trigger.keySequence(document.body, 'Enter')
          expect(up.event.inputDevice).toBe('key')
        }

        describe('with { focusVisible: true }', function() {
          describe('when using the mouse', function() {
            beforeEach(useMouse)
            beforeEach(up.specUtil.assertTabFocused)

            it('shows a focus ring for a non-field element', function() {
              const div = fixture('div', { text: 'text' })
              up.focus(div, { focusVisible: true, force: true })

              expect(div).toBeFocused()
              expect(div).toHaveOutline()
            })

            it('shows a focus ring when a non-field element is focused multiple times', async function() {
              const div = fixture('div', { text: 'text' })
              up.focus(div, { focusVisible: true, force: true })

              await wait()

              up.focus(div, { focusVisible: true, force: true })

              expect(div).toBeFocused()
              expect(div).toHaveOutline()
            })

            it('removes a focus ring when another element is focused afterwards', async function() {
              const div = fixture('div', { text: 'text' })
              const input = fixture('input[type=text][name=foo]')
              up.focus(div, { focusVisible: true, force: true })

              await wait()

              up.focus(input, { focusVisible: true, force: true })

              await wait()

              expect(input).toBeFocused()
              expect(div).not.toHaveOutline()
            })
          })
        })

        describe('with { focusVisible: false }', function() {
          describe('when using the keyboard', function() {
            beforeEach(useKeyboard)

            it('hides a focus ring for a field element', function() {
              const input = fixture('input[type=text]', { value: 'text' })
              up.focus(input, { focusVisible: false })

              expect(input).toBeFocused()
              expect(input).not.toHaveOutline()
            })
          })
        })

        describe('with { focusVisible: "auto" }', function() {

          describe('when using the mouse', function() {
            beforeEach(useMouse)

            it('hides a focus ring for a non-field element', function() {
              const div = fixture('div', { text: 'text' })
              up.focus(div, { focusVisible: 'auto', force: true })

              expect(div).toBeFocused()
              expect(div).not.toHaveOutline()
            })

            it('keeps hiding the focus ring when the user focuses another window and then returns to the app window', async function() {
              const div = fixture('div', { text: 'text' })
              up.focus(div, { focusVisible: 'auto', force: true })

              expect(div).toBeFocused()
              expect(div).not.toHaveOutline()

              // Simulate browser behavior when the user switches to another window and then returns to the app window.
              div.blur()
              await wait()
              div.focus({ focusVisible: true })

              expect(div).toBeFocused()
              expect(div).not.toHaveOutline()
            })

            it('shows a focus ring for a field element', function() {
              const input = fixture('input[type=text]', { value: 'text' })
              up.focus(input, { focusVisible: 'auto' })

              expect(input).toBeFocused()
              expect(input).toHaveOutline()
            })
          })

          describe('when using the keyboard', function() {
            beforeEach(useKeyboard)

            it('shows a focus ring for a non-field element', function() {
              const div = fixture('div', { text: 'text' })
              up.focus(div, { focusVisible: 'auto', force: true })

              expect(div).toBeFocused()
              expect(div).toHaveOutline()
            })
          })
        })
      })
    })

    describe('up.viewport.focusedElementWithin()', function() {

      it('returns the focused element if it is contained by the given root', function() {
        const root = fixture('.root')
        const button = e.affix(root, 'button')
        button.focus()

        expect(up.viewport.focusedElementWithin(root)).toBe(button)
      })

      it('returns undefined if the focused element is not contained by the given root', function() {
        const root = fixture('.root')
        const button = fixture('button')
        button.focus()

        expect(up.viewport.focusedElementWithin(root)).toBeMissing()
      })

      it('returns undefined if no element is focused', function() {
        const root = fixture('.root')
        expect(up.viewport.focusedElementWithin(root)).toBeMissing()
      })

      it('returns undefined if the given root is the <body>, but the focused element is an overlay', async function() {
        const overlay = await up.layer.open()
        const button = overlay.affix('button')
        button.focus()

        expect(up.viewport.focusedElementWithin(document.body)).toBeMissing()
      })
    })

    describe('up.reveal()', function() {

      beforeEach(function() {
        up.viewport.config.revealSnap = 0
        up.viewport.config.revealMax = false
      })

      describe('when the viewport is the document', function() {

        beforeEach(function() {
          const $body = $('body')

          this.$elements = []
          this.$container = $('<div class="container">').prependTo($body)
          this.$container.css({ opacity: 0.2 }) // reduce flashing during test runs

          this.clientHeight = up.viewport.rootHeight()

          const elementPlans = [
            { height: this.clientHeight, backgroundColor: 'yellow' }, // [0]
            { height: '50px',        backgroundColor: 'cyan'   }, // [1]
            { height: '5000px',      backgroundColor: 'orange' }  // [2]
          ]

          for (var elementPlan of elementPlans) {
            var $element = $('<div>').css(elementPlan)
            $element.appendTo(this.$container)
            this.$elements.push($element)
          }
        })

        afterEach(function() {
          this.$container.remove()
        })

        const $documentViewport = () => $(up.viewport.root)

        it('reveals the given element', async function() {
          up.reveal(this.$elements[0])
          await wait()

          // ---------------------
          // [0] 0 .......... ch-1
          // ---------------------
          // [1] ch+0 ...... ch+49
          // [2] ch+50 ... ch+5049
          expect($documentViewport().scrollTop()).toBe(0)

          up.reveal(this.$elements[1])
          await wait()

          // ---------------------
          // [0] 0 .......... ch-1
          // [1] ch+0 ...... ch+49
          // ---------------------
          // [2] ch+50 ... ch+5049
          expect($documentViewport().scrollTop()).toBe(50)

          up.reveal(this.$elements[2])
          await wait()

          // [0] 0 .......... ch-1
          // [1] ch+0 ...... ch+49
          // ---------------------
          // [2] ch+50 ... ch+5049
          // ---------------------
          expect($documentViewport().scrollTop()).toBe(this.clientHeight + 50)
        })

        it("includes the element's top margin in the revealed area", async function() {
          this.$elements[1].css({ 'margin-top': '20px' })
          up.reveal(this.$elements[1])
          await wait()

          expect($(document).scrollTop()).toBe(50 + 20)
        })

        it("includes the element's bottom margin in the revealed area", async function() {
          this.$elements[1].css({ 'margin-bottom': '20px' })
          up.reveal(this.$elements[2])
          await wait()

          expect($(document).scrollTop()).toBe(this.clientHeight + 50 + 20)
        })

        it('snaps to the top if the space above the future-visible area is smaller than the value of config.revealSnap', async function() {
          up.viewport.config.revealSnap = 30
          this.$elements[0].css({ height: '20px' })

          up.reveal(this.$elements[2])
          await wait()

          // [0] 0 ............ 19
          // [1] 20 ........... 69
          // ---------------------
          // [2] 70 ......... 5069
          // ---------------------
          expect($(document).scrollTop()).toBe(70)

          up.reveal(this.$elements[1])
          await wait()

          // ---------------------
          // [0] 0 ............ 19
          // [1] 20 ........... 69
          // ---------------------
          // [2] 70 ......... 5069
          expect($(document).scrollTop()).toBe(0)
        })

        it('does not snap to the top if it would un-reveal an element at the bottom edge of the screen (bugfix)', async function() {
          up.viewport.config.revealSnap = 100
          up.reveal(this.$elements[1])
          await wait()

          // ---------------------
          // [0] 0 .......... ch-1
          // [1] ch+0 ...... ch+49
          // ---------------------
          // [2] ch+50 ... ch+5049
          expect($(document).scrollTop()).toBe(50)
        })

        it('scrolls far enough so the element is not obstructed by an element fixed to the top', async function() {
          const $topNav = $fixture('[up-fixed=top]').css({
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            height: '100px'
          })

          up.reveal(this.$elements[0])
          await wait()

          // ---------------------
          // [F] 0 ............ 99
          // [0] 0 .......... ch-1
          // ---------------------
          // [1] ch+0 ...... ch+49
          // [2] ch+50 ... ch+5049
          expect($(document).scrollTop()).toBe(0) // would need to be -100

          up.reveal(this.$elements[1])
          await wait()

          // ---------------------
          // [F] 0 ............ 99
          // [0] 00000 ...... ch-1
          // [1] ch+0 ...... ch+49
          // ---------------------
          // [2] ch+50 ... ch+5049
          expect($(document).scrollTop()).toBe(50)

          up.reveal(this.$elements[2])
          await wait()

          // [0] 00000 ...... ch-1
          // [1] ch+0 ...... ch+49
          // ---------------------
          // [F] 0 ............ 99
          // [2] ch+50 ... ch+5049
          // ----------------
          expect($(document).scrollTop()).toBe((this.clientHeight + 50) - 100)

          up.reveal(this.$elements[1])
          await wait()

          // [0] 00000 ...... ch-1
          // ---------------------
          // [F] 0 ............ 99
          // [1] ch+0 ...... ch+49
          // [2] ch+50 ... ch+5049
          // ----------------
          expect($(document).scrollTop()).toBe((this.clientHeight + 50) - 100 - 50)
        })

        it('scrolls far enough so the element is not obstructed by an element fixed to the top with margin, padding, border and non-zero top properties', async function() {
          const $topNav = $fixture('[up-fixed=top]').css({
            position: 'fixed',
            top: '29px',
            margin: '16px',
            border: '7px solid rgba(0, 0, 0, 0.1)',
            padding: '5px',
            left: '0',
            right: '0',
            height: '100px'
          })

          up.reveal(this.$elements[2], { viewport: this.viewport })
          await wait()

          expect($(document).scrollTop()).toBe(
            (this.clientHeight + // scroll past @$elements[0]
              50) - // scroll past @$elements[1]
            100 - // obstruction height
            29 - // obstruction's top property
            (1 * 16) - // top margin (bottom margin is not a visual obstruction)
            (2 * 7) - // obstruction top and bottom borders
            (2 * 5) // obstruction top and bottom paddings
          )
        })

        it('scrolls far enough so the element is not obstructed by an element fixed to the bottom', async function() {
          const $bottomNav = $fixture('[up-fixed=bottom]').css({
            position: 'fixed',
            bottom: '0',
            left: '0',
            right: '0',
            height: '100px'
          })

          up.reveal(this.$elements[0])
          await wait()

          expect($(document).scrollTop()).toBe(0)

          up.reveal(this.$elements[1])
          await wait()

          expect($(document).scrollTop()).toBe(150)

          up.reveal(this.$elements[2])
          await wait()

          expect($(document).scrollTop()).toBe(this.clientHeight + 50)
        })

        it('scrolls far enough so the element is not obstructed by an element fixed to the bottom with margin, padding, border and non-zero bottom properties', async function() {
          const $bottomNav = $fixture('[up-fixed=bottom]').css({
            position: 'fixed',
            bottom: '29px',
            margin: '16px',
            border: '7px solid rgba(0, 0, 0, 0.2)',
            padding: '5px',
            left: '0',
            right: '0',
            height: '100px'
          })

          up.reveal(this.$elements[1])
          await wait()

          expect($(document).scrollTop()).toBe(
            50 + // height of elements[1]
            100 + // obstruction height
            29 + // obstruction's bottom property
            (1 * 16) + // bottom margin (top margin is not a visual obstruction)
            (2 * 7) + // obstruction top and bottom borders
            (2 * 5) // obstruction top and bottom paddings
          )
        })

        it('ignores a bottom-fixed obstruction that is not visible (bugfix)', async function() {
          const bottomNav = fixture('[up-fixed=bottom]', { style: {
              position: 'fixed',
              bottom: '0px',
              left: '0px',
              right: '0px',
              height: '100px',
              display: 'none'
            } })

          up.reveal(this.$elements[1])
          await wait()

          expect(document.scrollingElement.scrollTop).toBe(50)
        })

        it('does not crash when called with a CSS selector (bugfix)', function() {
          up.reveal('.container', { behavior: 'instant' })
          expect(true).toBe(true)
        })

        it('scrolls the viewport to the first row if the element is higher than the viewport', async function() {
          this.$elements[0].css({ height: '1000px' })
          this.$elements[1].css({ height: '3000px' })

          up.reveal(this.$elements[1])
          await wait()

          // [0] 0 ............ 999
          // [1] 1000 ........ 4999
          expect($(document).scrollTop()).toBe(1000)
        })

        it('only reveals the top number of pixels defined in config.revealMax', async function() {
          up.viewport.config.revealMax = 20

          const $viewport = $fixture('div').css({
            'position': 'absolute',
            'top': '50px',
            'left': '50px',
            'width': '100px',
            'height': '100px',
            'overflow-y': 'scroll'
          })
          const $elements = []
          u.each([0, 1, 2, 3, 4, 5], function() {
            const $element = $('<div>').css({ height: '50px' })
            $element.appendTo($viewport)
            $elements.push($element)
          })

          expect($viewport.scrollTop()).toBe(0)

          up.reveal($elements[3], { viewport: $viewport })
          await wait()

          expect($viewport.scrollTop()).toBe(50 + 20)

          up.reveal($elements[2], { viewport: $viewport })
          await wait()

          expect($viewport.scrollTop()).toBe(50 + 20)

          up.reveal($elements[5], { viewport: $viewport })
          await wait()

          expect($viewport.scrollTop()).toBe(150 + 20)

          up.reveal($elements[2], { viewport: $viewport })
          await wait()

          expect($viewport.scrollTop()).toBe(100)
        })

        describe('with { top: true } option', function() {
          it('scrolls the viewport to the first row of the element, even if that element is already fully revealed', async function() {
            this.$elements[0].css({ height: '20px' })

            up.reveal(this.$elements[1], { top: true, snap: false })

            await wait()
            // [0] 0 ............ 19
            // [1] 20 ........... 69
            // ---------------------
            // [2] 70 ......... 5069
            // ---------------------
            expect($(document).scrollTop()).toBe(20)
          })
        })
      })


      describe('when the viewport is a container with overflow-y: scroll', function() {

        it('reveals the given element', async function() {
          const $viewport = $fixture('div').css({
            'position': 'absolute',
            'top': '50px',
            'left': '50px',
            'width': '100px',
            'height': '100px',
            'overflow-y': 'scroll'
          })
          const $elements = []
          u.each([0, 1, 2, 3, 4, 5], function() {
            const $element = $('<div>').css({ height: '50px' })
            $element.appendTo($viewport)
            $elements.push($element)
          })

          // ------------
          // [0] 000..049
          // [1] 050..099
          // ------------
          // [2] 100..149
          // [3] 150..199
          // [4] 200..249
          // [5] 250..399
          expect($viewport.scrollTop()).toBe(0)

          // See that the view only scrolls down as little as possible
          // in order to reveal the element
          up.reveal($elements[3], { viewport: $viewport[0] })

          await wait()

          // [0] 000..049
          // [1] 050..099
          // ------------
          // [2] 100..149
          // [3] 150..199
          // ------------
          // [4] 200..249
          // [5] 250..299
          expect($viewport.scrollTop()).toBe(100)

          // See that the view doesn't move if the element
          // is already revealed
          up.reveal($elements[2], { viewport: $viewport[0] })

          await wait()

          expect($viewport.scrollTop()).toBe(100)

          // See that the view scrolls as far down as it cans
          // to show the bottom element
          up.reveal($elements[5], { viewport: $viewport[0] })

          await wait()

          // [0] 000..049
          // [1] 050..099
          // [2] 100..149
          // [3] 150..199
          // ------------
          // [4] 200..249
          // [5] 250..299
          // ------------
          expect($viewport.scrollTop()).toBe(200)

          up.reveal($elements[1], { viewport: $viewport[0] })

          await wait()

          // See that the view only scrolls up as little as possible
          // in order to reveal the element
          // [0] 000..049
          // ------------
          // [1] 050..099
          // [2] 100..149
          // ------------
          // [3] 150..199
          // [4] 200..249
          // [5] 250..299
          expect($viewport.scrollTop()).toBe(50)
        })
      })

      describe('with { behavior: "smooth" }', function() {
        it('animates the scroll motion', async function() {
          fixture('.between', { text: 'between', style: { height: '20000px' } })
          const destination = fixture('.destination', { text: 'destination' })

          expect(document.scrollingElement.scrollTop).toBe(0)

          up.reveal(destination, { behavior: 'smooth' })

          await wait(80)

          expect(document.scrollingElement.scrollTop).toBeGreaterThan(10)
          expect(document.scrollingElement.scrollTop).toBeLessThan(19000)
        })
      })

      describe('without a { behavior } option', function() {
        it('defaults to { behavior: "instant" } to ignore a scroll-behavior set in CSS', function() {
          const viewport = fixture('#viewport[up-viewport]', { style: { 'height': '100px', 'overflow-y': 'scroll' } })
          const before = e.affix(viewport, '#before', { style: { 'height': '20000px' } })
          const target = e.affix(viewport, '#target', { style: { 'height': '10px' } })

          spyOn(viewport, 'scrollTo')

          up.reveal(target)

          expect(viewport.scrollTo).toHaveBeenCalledWith(jasmine.objectContaining({ behavior: 'instant' }))
        })
      })
    })

    if (up.migrate.loaded) {
      describe('up.scroll()', function() {

        it('scrolls the given viewport to the given Y position', function() {
          const viewport = fixture('.viewport[up-viewport]', { style: { height: '100px', 'overflow-y': 'scroll' } })
          const content = e.affix(viewport, '.content', { style: { height: '1000px' } })

          expect(viewport.scrollTop).toBe(0)

          up.scroll(viewport, 78)

          expect(viewport.scrollTop).toBe(78)
        })

        it('returns a promise', function() {
          const viewport = fixture('.viewport[up-viewport]')
          const value = up.scroll(viewport, 78)
          expect(value).toHaveKey('then')
        })
      })
    }

    describe('up.viewport.revealHash()', function() {

      it('reveals an element with an ID matching the given #hash', async function() {
        const revealSpy = up.reveal.mock().and.returnValue(Promise.resolve())
        const $match = $fixture('div#hash')

        up.viewport.revealHash('#hash')
        await wait()

        expect(revealSpy).toHaveBeenCalledWith($match[0], jasmine.anything())
      })

      it('reveals a named anchor matching the given #hash', async function() {
        const revealSpy = up.reveal.mock().and.returnValue(Promise.resolve())
        const $match = $fixture('a[name="hash"]')

        up.viewport.revealHash('#hash')
        await wait()

        expect(revealSpy).toHaveBeenCalledWith($match[0], jasmine.anything())
      })

      it('returns a truthy value so up.FragmentScrolling knows that scrolling succeeded', function() {
        fixture('#hash')
        const result = up.viewport.revealHash('#hash')
        expect(result).toBeTruthy()
      })

      describe('if no element or anchor matches the given #hash', function() {

        it('does not change the scroll position', async function() {
          fixture('.high', { style: { height: '10000px' } }) // Ensure we have a vertical scroll bar
          const revealSpy = up.reveal.mock()

          up.viewport.root.scrollTop = 50
          up.viewport.revealHash('#hash')
          await wait()

          expect(revealSpy).not.toHaveBeenCalled()
          // Assert that we did not change the scroll position
          expect(up.viewport.root.scrollTop).toBe(50)
        })

        it('returns a falsy value so up.FragmentScrolling knows it needs to try the next option', function() {
          fixture('.high', { style: { height: '10000px' } }) // Ensure we have a vertical scroll bar
          const result = up.viewport.revealHash('#hash')
          expect(result).toBeFalsy()
        })
      })
    })

    describe('up.viewport.subtree()', function() {

      it('returns descendant viewports of the given element', function() {
        const $motherViewport = $fixture('.mother[up-viewport]')
        const $element = $motherViewport.affix('.element')
        const $childViewport = $element.affix('.child[up-viewport]')
        const $grandChildViewport = $childViewport.affix('.grand-child[up-viewport]')
        const actual = up.viewport.subtree($element[0])
        const expected = $childViewport.add($grandChildViewport)

        expect(actual).toMatchList(expected)
      })

      it('returns the given element if it is a viewport', function() {
        const viewportElement = $fixture('.viewport[up-viewport]')[0]
        const results = up.viewport.subtree(viewportElement)
        expect(results).toMatchList([viewportElement])
      })
    })

    describe('up.viewport.around()', function() {
      it('returns viewports that  are either ancestors, descendants, or the given element itself', function() {
        const $motherViewport = $fixture('.mother[up-viewport]')
        const $element = $motherViewport.affix('.element')
        const $childViewport = $element.affix('.child[up-viewport]')
        const $grandChildViewport = $childViewport.affix('.grand-child[up-viewport]')
        const actual = up.viewport.around($element[0])
        const expected = $motherViewport.add($childViewport).add($grandChildViewport)

        expect(actual).toMatchList(expected)
      })
    })

    describe('up.viewport.get()', function() {

      it('seeks upwards from the given element', function() {
        up.viewport.config.viewportSelectors = ['.viewport1', '.viewport2']
        const $viewport1 = $fixture('.viewport1')
        const $viewport2 = $fixture('.viewport2')
        const $element = $fixture('div').appendTo($viewport2)
        expect(up.viewport.get($element)).toEqual($viewport2[0])
      })

      it('returns the given element if it is a configured viewport itself', function() {
        up.viewport.config.viewportSelectors = ['.viewport']
        const $viewport = $fixture('.viewport')
        expect(up.viewport.get($viewport)).toEqual($viewport[0])
      })

      describe('when no configured viewport matches', function() {

        afterEach(function() {
          this.resetBodyCSS?.()
          this.resetHTMLCSS?.()
        })

        it('falls back to the scrolling element', function() {
          const element = fixture('.element', { style: { height: '3000px' } })
          const result = up.viewport.get(element)
          expect(result).toBe(document.scrollingElement)
        })

        it('falls back to the scrolling element if <body> is configured to scroll (fix for Edge)', function() {
          const element = fixture('.element', { style: { height: '3000px' } })
          this.resetHTMLCSS = e.setStyleTemp(document.documentElement, { 'overflow-y': 'hidden' })
          this.resetBodyCSS = e.setStyleTemp(document.body, { 'overflow-y': 'scroll' })
          const result = up.viewport.get(element)
          expect(result).toBe(document.scrollingElement)
        })

        it('falls back to the scrolling element if <html> is configured to scroll (fix for Edge)', function() {
          const element = fixture('.element', { style: { height: '3000px' } })
          this.resetHTMLCSS = e.setStyleTemp(document.documentElement, { 'overflow-y': 'scroll' })
          this.resetBodyCSS = e.setStyleTemp(document.body, { 'overflow-y': 'hidden' })
          const result = up.viewport.get(element)
          expect(result).toBe(document.scrollingElement)
        })
      })
    })

    describe('up.viewport.restoreScroll()', function() {

      it("restores a viewport's previously saved scroll position", function() {
        const $viewport = $fixture('#viewport[up-viewport]').css({ height: '100px', overflowY: 'scroll' })
        const $content = $viewport.affix('.content').css({ height: '1000px' })
        up.hello($viewport)
        $viewport.scrollTop(50)
        up.viewport.saveScroll()
        $viewport.scrollTop(70)

        up.viewport.restoreScroll()

        expect($viewport.scrollTop()).toEqual(50)
      })

      it('does not restore scroll positions that were saved for another layer', async function() {
        const viewportHTML = `
          <div class="viewport" up-viewport style="height: 100px; overflow-y: scroll">
            <div style="height: 1000px">
            </div>
          </div>
        `

        makeLayers([
          { content: viewportHTML },
          { content: viewportHTML }
        ])

        await wait()

        this.rootViewport = up.fragment.get('.viewport', { layer: 'root' })
        this.overlayViewport = up.fragment.get('.viewport', { layer: 'overlay' })

        this.rootViewport.scrollTop = 10
        this.overlayViewport.scrollTop = 20

        up.viewport.saveScroll({ layer: 'root' })

        this.rootViewport.scrollTop = 0
        this.overlayViewport.scrollTop = 0

        up.viewport.restoreScroll({ layer: 'root' })

        await wait()

        expect(this.rootViewport.scrollTop).toBe(10)
        expect(this.overlayViewport.scrollTop).toBe(0)
      })

      it("returns true if a previous scroll position is known and could be restored", function() {
        const $viewport = $fixture('#viewport[up-viewport]').css({ height: '100px', overflowY: 'scroll' })
        const $content = $viewport.affix('.content').css({ height: '1000px' })
        up.hello($viewport)
        up.viewport.saveScroll()
        expect(up.viewport.restoreScroll()).toBe(true)
      })

      it("does not scroll and returns a falsey value if no previous scroll position is known", function() {
        const $viewport = $fixture('#viewport[up-viewport]').css({ height: '100px', overflowY: 'scroll' })
        const $content = $viewport.affix('.content').css({ height: '1000px' })
        $viewport.scrollTop(70)

        expect(up.viewport.restoreScroll()).toBeFalsy()
        expect($viewport.scrollTop()).toEqual(70)
      })
    })

    describe('up.viewport.absolutize()', function() {

      afterEach(function() {
        $('up-bounds, .fixture').remove()
      })

      it('absolutely positions the element, preserving visual position and size', function() {
        const $element = $fixture('.element').text('element text').css({ paddingTop: '20px', paddingLeft: '20px' })

        expect($element.css('position')).toEqual('static')
        const previousDims = $element[0].getBoundingClientRect()

        up.viewport.absolutize($element[0])

        expect($element.closest('up-bounds').css('position')).toEqual('absolute')

        const newDims = $element[0].getBoundingClientRect()
        expect(newDims).toEqual(previousDims)
      })

      it('accurately positions the ghost over an element with margins', function() {
        const $element = $fixture('.element').css({ margin: '40px' })
        const previousDims = $element[0].getBoundingClientRect()

        up.viewport.absolutize($element[0])

        const newDims = $element[0].getBoundingClientRect()
        expect(newDims).toEqual(previousDims)
      })

      it("doesn't change the position of a child whose margins no longer collapse", function() {
        const $element = $fixture('.element')
        const $child = $('<div class="child">child text</div>').css({ margin: '40px' }).appendTo($element)
        const previousChildDims = $child[0].getBoundingClientRect()

        up.viewport.absolutize($element[0])

        const newChildDims = $child[0].getBoundingClientRect()
        expect(newChildDims).toEqual(previousChildDims)
      })

      it('correctly positions an element within a scrolled body', function() {
        const $body = $('body')
        const $element1 = $('<div class="fixture"></div>').css({ height: '75px' }).prependTo($body)
        const $element2 = $('<div class="fixture"></div>').css({ height: '100px' }).insertAfter($element1)
        $body.scrollTop(33)

        const previousDims = $element2[0].getBoundingClientRect()

        up.viewport.absolutize($element2[0])

        const newDims = $element2[0].getBoundingClientRect()
        expect(newDims).toEqual(previousDims)
      })

      it('correctly positions an element within a scrolled parent element (that has overflow-y: scroll)', function() {
        const $viewport = $fixture('div').css({
          overflowY: 'scroll',
          height: '50px'
        })

        const $element1 = $('<div class="fixture"></div>').css({ height: '75px' }).prependTo($viewport)
        const $element2 = $('<div class="fixture"></div>').css({ height: '100px' }).insertAfter($element1)
        $viewport.scrollTop(33)

        const previousDims = $element2[0].getBoundingClientRect()

        up.viewport.absolutize($element2[0])

        const newDims = $element2[0].getBoundingClientRect()
        expect(newDims).toEqual(previousDims)
      })

      it('converts fixed elements within the copies to absolutely positioning (relative to the closest offset parent)', function() {
        const $element = $fixture('.element').css({
          position: 'absolute',
          top: '50px',
          left: '50px'
        })
        const $fixedChild = $('<div class="fixed-child" up-fixed></div>').css({
          position: 'fixed',
          left: '77px',
          top: '77px'
        })
        $fixedChild.appendTo($element)
        up.viewport.absolutize($element[0])

        expect($fixedChild.css(['position', 'left', 'top'])).toEqual({
          position: 'absolute',
          left: '27px',
          top: '27px'
        })
      })

      it("does not convert fixed elements outside the element's subtree (bugfix)", function() {
        const $element = $fixture('.element').css({ position: 'absolute' })
        const $fixedChild = $('<div class="fixed-child" up-fixed></div>').css({ position: 'fixed' })
        $fixedChild.appendTo($element)
        const $fixedSibling = $fixture('[up-fixed]').css({ position: 'fixed' })

        up.viewport.absolutize($element[0])

        expect($fixedChild.css('position')).toEqual('absolute')
        expect($fixedSibling.css('position')).toEqual('fixed')
      })
    })
  })

  describe('unobtrusive behavior', function() {

    it('does not add focus-related classes to the <html> or <body> element (bugfix)', function() {
      expect(document.body).not.toHaveClass('up-focus-hidden')
      expect(document.body).not.toHaveClass('up-focus-visible')
      expect(document.documentElement).not.toHaveClass('up-focus-hidden')
      expect(document.documentElement).not.toHaveClass('up-focus-visible')
    })

  })
})
