describe 'up.layout', ->

  u = up.util

  describe 'Javascript functions', ->

    describe 'up.reveal', ->

      beforeEach ->
        up.layout.defaults(snap: 0)

      describe 'when the container is body', ->

        beforeEach ->
          @$viewport = $('body')
          @restoreMargin = u.temporaryCss(@$viewport, 'margin-top': 0)
          @$viewport.scrollTop(0)

          @$elements = []
          @$container = $('<div class="container">').prependTo(@$viewport)

          @clientHeight = u.clientSize().height

          for height in [@clientHeight, '50px', '5000px']
            $element = $('<div>').css(height: height)
            $element.appendTo(@$container)
            @$elements.push($element)

        afterEach ->
          @$container.remove()
          @restoreMargin()

        it 'reveals the given element', ->
          up.reveal(@$elements[0], viewport: @$viewport)
          # ---------------------
          # [0] 0 .......... ch-1
          # ---------------------
          # [1] ch+0 ...... ch+49
          # [2] ch+50 ... ch+5049
          expect(@$viewport.scrollTop()).toBe(0)

          up.reveal(@$elements[1], viewport: @$viewport)
          # ---------------------
          # [0] 0 .......... ch-1
          # [1] ch+0 ...... ch+49
          # ---------------------
          # [2] ch+50 ... ch+5049
          expect(@$viewport.scrollTop()).toBe(50)

          up.reveal(@$elements[2], viewport: @$viewport)
          # [0] 0 .......... ch-1
          # [1] ch+0 ...... ch+49
          # ---------------------
          # [2] ch+50 ... ch+5049
          # ---------------------
          expect(@$viewport.scrollTop()).toBe(@clientHeight + 50)

        it 'snaps to the top if the space above the future-visible area is smaller than the value of config.snap', ->

          up.layout.defaults(snap: 30)

          @$elements[0].css(height: '20px')

          up.reveal(@$elements[2], viewport: @$viewport)
          # [0] 0 ............ 19
          # [1] 20 ........... 69
          # ---------------------
          # [2] 70 ......... 5069
          # ---------------------
          expect(@$viewport.scrollTop()).toBe(70)

          # Even though we're revealing the second element, the viewport
          # snaps to the top edge.
          up.reveal(@$elements[1], viewport: @$viewport)
          # ---------------------
          # [0] 0 ............ 19
          # [1] 20 ........... 69
          # ---------------------
          # [2] 70 ......... 5069
          expect(@$viewport.scrollTop()).toBe(0)

        it 'scrolls far enough so the element is not obstructed by an element fixed to the top', ->
          $topNav = affix('[up-fixed=top]').css(
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0'
            height: '100px'
          )

          up.reveal(@$elements[0], viewport: @viewport)
          # ---------------------
          # [F] 0 ............ 99
          # [0] 0 .......... ch-1
          # ---------------------
          # [1] ch+0 ...... ch+49
          # [2] ch+50 ... ch+5049
          expect(@$viewport.scrollTop()).toBe(0) # would need to be -100

          up.reveal(@$elements[1], viewport: @$viewport)
          # ---------------------
          # [F] 0 ............ 99
          # [0] 00000 ...... ch-1
          # [1] ch+0 ...... ch+49
          # ---------------------
          # [2] ch+50 ... ch+5049

          expect(@$viewport.scrollTop()).toBe(50)

          up.reveal(@$elements[2], viewport: @$viewport)
          # [0] 00000 ...... ch-1
          # [1] ch+0 ...... ch+49
          # ---------------------
          # [F] 0 ............ 99
          # [2] ch+50 ... ch+5049
          # ----------------
          expect(@$viewport.scrollTop()).toBe(@clientHeight + 50 - 100)

          up.reveal(@$elements[1], viewport: @$viewport)
          # [0] 00000 ...... ch-1
          # ---------------------
          # [F] 0 ............ 99
          # [1] ch+0 ...... ch+49
          # [2] ch+50 ... ch+5049
          # ----------------
          expect(@$viewport.scrollTop()).toBe(@clientHeight + 50 - 100 - 50)


        it 'scrolls far enough so the element is not obstructed by an element fixed to the bottom', ->
          $bottomNav = affix('[up-fixed=bottom]').css(
            position: 'fixed',
            bottom: '0',
            left: '0',
            right: '0'
            height: '100px'
          )

          up.reveal(@$elements[0], viewport: @$viewport)
          # ---------------------
          # [0] 0 .......... ch-1
          # [F] 0 ............ 99
          # ---------------------
          # [1] ch+0 ...... ch+49
          # [2] ch+50 ... ch+5049
          expect(@$viewport.scrollTop()).toBe(0)

          up.reveal(@$elements[1], viewport: @$viewport)
          # ---------------------
          # [0] 0 .......... ch-1
          # [1] ch+0 ...... ch+49
          # [F] 0 ............ 99
          # ---------------------
          # [2] ch+50 ... ch+5049
          expect(@$viewport.scrollTop()).toBe(150)

          up.reveal(@$elements[2], viewport: @$viewport)
          # ---------------------
          # [0] 0 .......... ch-1
          # [1] ch+0 ...... ch+49
          # ---------------------
          # [2] ch+50 ... ch+5049
          # [F] 0 ............ 99
          expect(@$viewport.scrollTop()).toBe(@clientHeight + 50)




      describe 'when the viewport is a container with overflow-y: scroll', ->

        it 'reveals the given element', ->
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
          # [0] 000..049
          # [1] 050..099
          # ------------
          # [2] 100..149
          # [3] 150..199
          # ------------
          # [4] 200..249
          # [5] 250..399
          expect($viewport.scrollTop()).toBe(100)

          # See that the view doesn't move if the element
          # is already revealed
          up.reveal($elements[2], viewport: $viewport)
          expect($viewport.scrollTop()).toBe(100)

          # See that the view scrolls as far down as it cans
          # to show the bottom element
          up.reveal($elements[5], viewport: $viewport)
          # [0] 000..049
          # [1] 050..099
          # [2] 100..149
          # [3] 150..199
          # ------------
          # [4] 200..249
          # [5] 250..399
          # ------------
          expect($viewport.scrollTop()).toBe(200)

          # See that the view only scrolls up as little as possible
          # in order to reveal the element
          up.reveal($elements[1], viewport: $viewport)
          # [0] 000..049
          # ------------
          # [1] 050..099
          # [2] 100..149
          # ------------
          # [3] 150..199
          # [4] 200..249
          # [5] 250..399
          expect($viewport.scrollTop()).toBe(50)

    describe 'up.scroll', ->

      it 'should have tests'
