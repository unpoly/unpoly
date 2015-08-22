describe 'up.layout', ->

  u = up.util

  describe 'Javascript functions', ->

    describe 'up.reveal', ->

      describe 'when the container is body', ->

        beforeEach ->
          @$viewport = $('body')
          @restoreMargin = u.temporaryCss(@$viewport, 'margin-top': 0)
          @$viewport.scrollTop(0)

          @$elements = []
          @$container = $('<div class="container">').prependTo(@$viewport)
          for i in [0..2]
            $element = $('<div>').css(height: '5000px').text("Child #{i}")
            $element.appendTo(@$container)
            @$elements.push($element)

        afterEach ->
          @$container.remove()
          @restoreMargin()

        it 'reveals the given element', ->
          # --------------
          #  [0] 00000..04999
          # --------------
          #  [1] 05000..09999
          #  [3] 10000..14999
          expect(@$viewport.scrollTop()).toBe(0)

          up.reveal(@$elements[1], viewport: @$viewport)
          #  [0] 00000..04999
          # --------------
          #  [1] 05000..09999
          # --------------
          #  [3] 10000..14999
          expect(@$viewport.scrollTop()).toBe(5000)

          up.reveal(@$elements[2], viewport: @$viewport)
          #  [0] 00000..04999
          #  [1] 05000..09999
          # --------------
          #  [3] 10000..14999
          # --------------
          expect(@$viewport.scrollTop()).toBe(10000)

        it 'scrolls far enough so the element is not obstructed by an element fixed to the top', ->
          $topNav = affix('[up-fixed=top]').css(
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0'
            height: '100px'
          )
          # --------------
          #  [0] 00000..04999
          # --------------
          #  [1] 05000..09999
          #  [3] 10000..14999
          expect(@$viewport.scrollTop()).toBe(0) # would need to be -100

          up.reveal(@$elements[1], viewport: @$viewport)
          #  [0] 00000..04999
          # --------------
          #  [1] 05000..09999
          # --------------
          #  [3] 10000..14999
          expect(@$viewport.scrollTop()).toBe(4900)

          up.reveal(@$elements[2], viewport: @$viewport)
          #  [0] 00000..04999
          #  [1] 05000..09999
          # --------------
          #  [3] 10000..14999
          # --------------
          expect(@$viewport.scrollTop()).toBe(9900)

          
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

          # --------------
          #  [0] 000..049
          #  [1] 050..099
          # --------------
          #  [2] 100..149
          #  [3] 150..199
          #  [4] 200..249
          #  [5] 250..399
          expect($viewport.scrollTop()).toBe(0)

          # See that the view only scrolls down as little as possible
          # in order to reveal the element
          up.reveal($elements[3], viewport: $viewport)
          #  [0] 000..049
          #  [1] 050..099
          # --------------
          #  [2] 100..149
          #  [3] 150..199
          # --------------
          #  [4] 200..249
          #  [5] 250..399
          expect($viewport.scrollTop()).toBe(100)

          # See that the view doesn't move if the element
          # is already revealed
          up.reveal($elements[2], viewport: $viewport)
          expect($viewport.scrollTop()).toBe(100)

          # See that the view scrolls as far down as it cans
          # to show the bottom element
          up.reveal($elements[5], viewport: $viewport)
          #  [0] 000..049
          #  [1] 050..099
          #  [2] 100..149
          #  [3] 150..199
          # --------------
          #  [4] 200..249
          #  [5] 250..399
          # --------------
          expect($viewport.scrollTop()).toBe(200)

          # See that the view only scrolls up as little as possible
          # in order to reveal the element
          up.reveal($elements[1], viewport: $viewport)
          #  [0] 000..049
          # --------------
          #  [1] 050..099
          #  [2] 100..149
          # --------------
          #  [3] 150..199
          #  [4] 200..249
          #  [5] 250..399
          expect($viewport.scrollTop()).toBe(50)

    describe 'up.scroll', ->

      it 'should have tests'
