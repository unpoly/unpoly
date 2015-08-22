describe 'up.layout', ->

  u = up.util

  describe 'Javascript functions', ->

    describe 'up.reveal', ->

      describe 'when the container is body', ->

        beforeEach ->
          @restoreMargin = u.temporaryCss($('body'), 'margin-top': 0)

        afterEach ->
          @$container.remove()
          @restoreMargin()

        it 'reveals the given element', ->
          $view = $('body')
          $view.scrollTop(0)
          $elements = []
          @$container = $('<div class="container">').prependTo($view)

          for i in [0..2]
            $element = $('<div>').css(height: '5000px').text("Child #{i}")
            $element.appendTo(@$container)
            $elements.push($element)

          # --------------
          #  [0] 00000..04999
          # --------------
          #  [1] 05000..09999
          #  [3] 10000..14999
          expect($view.scrollTop()).toBe(0)

          up.reveal($elements[1], view: $view)
          #  [0] 00000..04999
          # --------------
          #  [1] 05000..09999
          # --------------
          #  [3] 10000..14999
          expect($view.scrollTop()).toBe(5000)

          up.reveal($elements[2], view: $view)
          #  [0] 00000..04999
          #  [1] 05000..09999
          # --------------
          #  [3] 10000..14999
          # --------------
          expect($view.scrollTop()).toBe(10000)

      describe 'when the view is a container with overflow-y: scroll', ->

        it 'reveals the given element', ->
          $view = affix('div').css
            'position': 'absolute'
            'width': '100px'
            'height': '100px'
            'overflow-y': 'scroll'
          $elements = []
          u.each [0..5], ->
            $element = $('<div>').css(height: '50px')
            $element.appendTo($view)
            $elements.push($element)

          # --------------
          #  [0] 000..049
          #  [1] 050..099
          # --------------
          #  [2] 100..149
          #  [3] 150..199
          #  [4] 200..249
          #  [5] 250..399
          expect($view.scrollTop()).toBe(0)

          # See that the view only scrolls down as little as possible
          # in order to reveal the element
          up.reveal($elements[3], view: $view)
          #  [0] 000..049
          #  [1] 050..099
          # --------------
          #  [2] 100..149
          #  [3] 150..199
          # --------------
          #  [4] 200..249
          #  [5] 250..399
          expect($view.scrollTop()).toBe(100)

          # See that the view doesn't move if the element
          # is already revealed
          up.reveal($elements[2], view: $view)
          expect($view.scrollTop()).toBe(100)

          # See that the view scrolls as far down as it cans
          # to show the bottom element
          up.reveal($elements[5], view: $view)
          #  [0] 000..049
          #  [1] 050..099
          #  [2] 100..149
          #  [3] 150..199
          # --------------
          #  [4] 200..249
          #  [5] 250..399
          # --------------
          expect($view.scrollTop()).toBe(200)

          # See that the view only scrolls up as little as possible
          # in order to reveal the element
          up.reveal($elements[1], view: $view)
          #  [0] 000..049
          # --------------
          #  [1] 050..099
          #  [2] 100..149
          # --------------
          #  [3] 150..199
          #  [4] 200..249
          #  [5] 250..399
          expect($view.scrollTop()).toBe(50)

    describe 'up.scroll', ->

      it 'should have tests'
