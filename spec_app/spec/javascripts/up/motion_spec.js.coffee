describe 'up.motion', ->
  
  describe 'Javascript functions', ->
  
    describe 'up.animate', ->

      if up.browser.canCssAnimation()

        it 'animates the given element', (done) ->
          $element = affix('.element').text('content')
          opacity = -> Number($element.css('opacity'))
          up.animate($element, 'fade-in', duration: 100, easing: 'linear')

          setTimer 0, ->
            expect(opacity()).toBeAround(0.0, 0.25)
          setTimer 50, ->
            expect(opacity()).toBeAround(0.5, 0.25)
          setTimer 100, ->
            expect(opacity()).toBeAround(1.0, 0.25)
            done()

        it 'cancels an existing animation on the element by instantly jumping to the last frame', ->
          $element = affix('.element').text('content')
          up.animate($element, { 'font-size': '40px' }, duration: 10000, easing: 'linear')
          up.animate($element, { 'fade-in' }, duration: 100, easing: 'linear')
          expect($element.css('font-size')).toEqual('40px')

      else

        it "doesn't animate and directly sets the last frame instead", ->
          $element = affix('.element').text('content')
          up.animate($element, { 'font-size': '40px' }, duration: 10000, easing: 'linear')
          expect($element.css('font-size')).toEqual('40px')


    describe 'up.morph', ->

      if up.browser.canCssAnimation()

        it 'transitions between two element using ghosts', (done) ->

          $old = affix('.old').text('old content').css(
            position: 'absolute'
            top:      '10px'
            left:     '11px',
            width:    '12px',
            height:   '13px'
          )
          $new = affix('.new').text('new content').css(
            position: 'absolute'
            top:      '20px'
            left:     '21px',
            width:    '22px',
            height:   '23px'
          )
          up.morph($old, $new, 'cross-fade', duration: 100, easing: 'linear')

          # The actual animation will be performed on Ghosts since
          # two element usually cannot exist in the DOM at the same time
          # without undesired visual effects
          $oldGhost = $('.old.up-ghost')
          $newGhost = $('.new.up-ghost')
          expect($oldGhost).toExist()
          expect($newGhost).toExist()

          # Ghosts should be inserted before (not after) the element
          # or the browser scroll position will be too low after the
          # transition ends.
          expect($oldGhost.next()).toEqual($old)
          expect($newGhost.next()).toEqual($new)

          # The actual elements are hidden, but $old will take up its original
          # space until the animation completes.
          expect($old.css(['display', 'visibility'])).toEqual(
            display: 'block',
            visibility: 'hidden'
          )
          expect($new.css(['display', 'visibility'])).toEqual(
            display: 'none',
            visibility: 'visible'
          )

          # Ghosts will hover over $old and $new using absolute positioning,
          # matching the coordinates of the original elements.
          expect($oldGhost.css(['position', 'top', 'left', 'width', 'height'])).toEqual(
            position: 'absolute'
            top:      '10px'
            left:     '11px',
            width:    '12px',
            height:   '13px'
          )
          expect($newGhost.css(['position', 'top', 'left', 'width', 'height'])).toEqual(
            position: 'absolute'
            top:      '20px'
            left:     '21px',
            width:    '22px',
            height:   '23px'
          )

          opacity = ($element) -> Number($element.css('opacity'))

          setTimer 0, ->
            expect(opacity($newGhost)).toBeAround(0.0, 0.25)
            expect(opacity($oldGhost)).toBeAround(1.0, 0.25)

          setTimer 40, ->
            expect(opacity($newGhost)).toBeAround(0.4, 0.25)
            expect(opacity($oldGhost)).toBeAround(0.6, 0.25)

          setTimer 70, ->
            expect(opacity($newGhost)).toBeAround(0.7, 0.25)
            expect(opacity($oldGhost)).toBeAround(0.3, 0.25)

          setTimer 125, ->
            # Once our two ghosts have rendered their visual effect,
            # we remove them from the DOM.
            expect($newGhost).not.toBeInDOM()
            expect($oldGhost).not.toBeInDOM()

            # The old element is still in the DOM, but hidden.
            # Morphing does *not* remove the target element.
            expect($old.css(['display', 'visibility'])).toEqual(
              display: 'none',
              visibility: 'hidden'
            )
            expect($new.css(['display', 'visibility'])).toEqual(
              display: 'block',
              visibility: 'visible'
            )

            done()

        it 'cancels an existing transition on the element by instantly jumping to the last frame', ->
          $old = affix('.old').text('old content')
          $new = affix('.new').text('new content')

          up.morph($old, $new, 'cross-fade', duration: 200)
          $ghost1 = $('.old.up-ghost')
          expect($ghost1).toHaveLength(1)

          up.morph($old, $new, 'cross-fade', duration: 200)
          $ghost2 = $('.old.up-ghost')
          # Check that we didn't create additional ghosts
          expect($ghost2).toHaveLength(1)
          # Check that it's a different ghosts
          expect($ghost2).not.toEqual($ghost1)

      else

        it "doesn't animate and hides the first element instead", ->
          $old = affix('.old').text('old content')
          $new = affix('.new').text('new content')
          up.morph($old, $new, 'cross-fade', duration: 1000)
          expect($old).toBeHidden()
          expect($new).toBeVisible()

    describe 'up.transition', ->

      it 'should have tests'
      
    describe 'up.animation', ->

      it 'should have tests'
      
    describe 'up.motion.none', ->

      it 'should have tests'

    