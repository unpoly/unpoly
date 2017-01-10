describe 'up.motion', ->

  u = up.util
  
  describe 'JavaScript functions', ->
  
    describe 'up.animate', ->

      describeCapability 'canCssTransition', ->

        it 'animates the given element', (done) ->
          $element = affix('.element').text('content')
          up.animate($element, 'fade-in', duration: 200, easing: 'linear')

          u.setTimer 0, ->
            expect(u.opacity($element)).toBeAround(0.0, 0.25)
          u.setTimer 100, ->
            expect(u.opacity($element)).toBeAround(0.5, 0.25)
          u.setTimer 200, ->
            expect(u.opacity($element)).toBeAround(1.0, 0.25)
            done()

        it 'returns a promise that is resolved when the animation completed', (done) ->
          $element = affix('.element').text('content')
          resolveSpy = jasmine.createSpy('resolve')

          promise = up.animate($element, 'fade-in', duration: 100, easing: 'linear')
          promise.then(resolveSpy)

          u.setTimer 50, ->
            expect(resolveSpy).not.toHaveBeenCalled()
            u.setTimer 100, ->
              expect(resolveSpy).toHaveBeenCalled()
              done()

        it 'cancels an existing animation on the element by instantly jumping to the last frame', ->
          $element = affix('.element').text('content')
          up.animate($element, { 'font-size': '40px' }, duration: 10000, easing: 'linear')
          up.animate($element, { 'fade-in' }, duration: 100, easing: 'linear')
          expect($element.css('font-size')).toEqual('40px')

        describe 'with animations disabled globally', ->

          beforeEach ->
            up.motion.config.enabled = false

          it "doesn't animate and directly sets the last frame instead", (done) ->
            $element = affix('.element').text('content')
            callback = jasmine.createSpy('animation done callback')
            animateDone = up.animate($element, { 'font-size': '40px' }, duration: 10000, easing: 'linear')
            animateDone.then(callback)
            expect($element.css('font-size')).toEqual('40px')
            u.nextFrame ->
              expect(callback).toHaveBeenCalled()
              done()

        [false, null, undefined, 'none', up.motion.none()].forEach (noneAnimation) ->

          describe "when called with a `#{noneAnimation}` animation", ->

            it "doesn't animate and resolves instantly", (done) ->
              $element = affix('.element').text('content')
              callback = jasmine.createSpy('animation done callback')
              animateDone = up.animate($element, noneAnimation, duration: 10000, easing: 'linear')
              animateDone.then(callback)
              u.nextFrame ->
                expect(callback).toHaveBeenCalled()
                done()

      describeFallback 'canCssTransition', ->

        it "doesn't animate and directly sets the last frame instead", ->
          $element = affix('.element').text('content')
          up.animate($element, { 'font-size': '40px' }, duration: 10000, easing: 'linear')
          expect($element.css('font-size')).toEqual('40px')

    describe 'up.motion.finish', ->

      describe 'when called with an element or selector', ->

        describeCapability 'canCssTransition', ->

          it 'cancels an existing animation on the given element by instantly jumping to the last frame', ->
            $element = affix('.element').text('content')
            up.animate($element, { 'font-size': '40px', 'opacity': '0.33' }, duration: 10000)
            up.motion.finish($element)
            expect($element.css('font-size')).toEqual('40px')
            expect($element.css('opacity')).toEqual('0.33')

          it 'cancels animations on children of the given element', ->
            $parent = affix('.element')
            $child = $parent.affix('.child')
            up.animate($child, { 'font-size': '40px' }, duration: 10000)
            up.motion.finish($parent)
            expect($child.css('font-size')).toEqual('40px')

          it 'does not cancel animations on other elements', ->
            $element1 = affix('.element1').text('content1')
            $element2 = affix('.element2').text('content2')
            up.animate($element1, 'fade-in', duration: 10000)
            up.animate($element2, 'fade-in', duration: 10000)
            up.motion.finish($element1)
            expect(Number($element1.css('opacity'))).toEqual(1)
            expect(Number($element2.css('opacity'))).toEqual(0, 0.1)

          it 'restores existing transitions on the element', ->
            $element = affix('.element').text('content')
            $element.css('transition': 'font-size 3s ease')
            oldTransitionProperty = $element.css('transition-property')
            expect(oldTransitionProperty).toBeDefined()
            expect(oldTransitionProperty).toContain('font-size') # be paranoid
            up.animate($element, 'fade-in', duration: 10000)
            up.motion.finish($element)
            expect(u.opacity($element)).toEqual(1)
            currentTransitionProperty = $element.css('transition-property')
            expect(currentTransitionProperty).toEqual(oldTransitionProperty)
            expect(currentTransitionProperty).toContain('font-size')
            expect(currentTransitionProperty).not.toContain('opacity')

          it 'cancels an existing transition on the element by instantly jumping to the last frame', ->
            $old = affix('.old').text('old content')
            $new = affix('.new').text('new content')

            up.morph($old, $new, 'cross-fade', duration: 2000)
            expect($('.up-ghost').length).toBe(2)

            up.motion.finish($old)

            expect($('.up-ghost').length).toBe(0)
            expect($old.css('display')).toEqual('none')
            expect($new.css('display')).toEqual('block')

          it 'can be called on either element involved in a transition', ->
            $old = affix('.old').text('old content')
            $new = affix('.new').text('new content')

            up.morph($old, $new, 'cross-fade', duration: 2000)
            expect($('.up-ghost').length).toBe(2)

            up.motion.finish($new)

            expect($('.up-ghost').length).toBe(0)
            expect($old.css('display')).toEqual('none')
            expect($new.css('display')).toEqual('block')


          it 'cancels transitions on children of the given element', ->
            $parent = affix('.parent')
            $old = $parent.affix('.old').text('old content')
            $new = $parent.affix('.new').text('new content')

            up.morph($old, $new, 'cross-fade', duration: 2000)
            expect($('.up-ghost').length).toBe(2)

            up.motion.finish($parent)

            expect($('.up-ghost').length).toBe(0)
            expect($old.css('display')).toEqual('none')
            expect($new.css('display')).toEqual('block')

        describeFallback 'canCssTransition', ->

          it 'does nothing'

      describe 'when called without arguments', ->

        describeCapability 'canCssTransition', ->

          it 'cancels all animations on the screen', ->
            $element1 = affix('.element1').text('content1')
            $element2 = affix('.element2').text('content2')

            up.animate($element1, 'fade-in', duration: 3000)
            up.animate($element2, 'fade-in', duration: 3000)

            expect(u.opacity($element1)).toBeAround(0.0, 0.1)
            expect(u.opacity($element2)).toBeAround(0.0, 0.1)

            up.motion.finish()

            $element1 = $('.element1')
            $element2 = $('.element2')
            expect(u.opacity($element1)).toBe(1.0)
            expect(u.opacity($element2)).toBe(1.0)

        describeFallback 'canCssTransition', ->

          it 'does nothing'


    describe 'up.morph', ->

      describeCapability 'canCssTransition', ->

        it 'transitions between two element by animating two copies while keeping the originals in the background', (done) ->

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
          up.morph($old, $new, 'cross-fade', duration: 200, easing: 'linear')

          # The actual animation will be performed on Ghosts since
          # two element usually cannot exist in the DOM at the same time
          # without undesired visual effects
          $oldGhost = $('.old.up-ghost')
          $newGhost = $('.new.up-ghost')
          expect($oldGhost).toExist()
          expect($newGhost).toExist()

          $oldBounds = $oldGhost.parent('.up-bounds')
          $newBounds = $newGhost.parent('.up-bounds')
          expect($oldBounds).toExist()
          expect($newBounds).toExist()

          # Ghosts should be inserted before (not after) the element
          # or the browser scroll position will be too low after the
          # transition ends.
          expect($oldGhost.parent().next()).toEqual($old)
          expect($newGhost.parent().next()).toEqual($new)

          # The old element is removed from the layout flow.
          # It will be removed from the DOM after the animation has ended.
          expect($old.css('display')).toEqual('none')

          # The new element is invisible due to an opacity of zero,
          # but takes up the space in the layout flow.
          expect($new.css(['display', 'opacity'])).toEqual(
            display: 'block',
            opacity: '0'
          )

          # We **must not** use `visibility: hidden` to hide the new
          # element. This would delay browser painting until the element is
          # shown again, causing a flicker while the browser is painting.
          expect($new.css('visibility')).not.toEqual('hidden')

          # Ghosts will hover over $old and $new using absolute positioning,
          # matching the coordinates of the original elements.
          expect($oldBounds.css(['position', 'top', 'left', 'width', 'height'])).toEqual(
            position: 'absolute'
            top:      '10px'
            left:     '11px',
            width:    '12px',
            height:   '13px'
          )
          expect($newBounds.css(['position', 'top', 'left', 'width', 'height'])).toEqual(
            position: 'absolute'
            top:      '20px'
            left:     '21px',
            width:    '22px',
            height:   '23px'
          )

          u.setTimer 0, ->
            expect(u.opacity($newGhost)).toBeAround(0.0, 0.25)
            expect(u.opacity($oldGhost)).toBeAround(1.0, 0.25)

          u.setTimer 80, ->
            expect(u.opacity($newGhost)).toBeAround(0.4, 0.25)
            expect(u.opacity($oldGhost)).toBeAround(0.6, 0.25)

          u.setTimer 140, ->
            expect(u.opacity($newGhost)).toBeAround(0.7, 0.25)
            expect(u.opacity($oldGhost)).toBeAround(0.3, 0.25)

          u.setTimer 250, ->
            # Once our two ghosts have rendered their visual effect,
            # we remove them from the DOM.
            expect($newGhost).not.toBeInDOM()
            expect($oldGhost).not.toBeInDOM()

            # The old element is still in the DOM, but hidden.
            # Morphing does *not* remove the target element.
            expect($old.css('display')).toEqual('none')
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

        describe 'with { reveal: true } option', ->

          it 'reveals the new element while making the old element within the same viewport appear as if it would keep its scroll position', ->
            $container = affix('.container[up-viewport]').css
              'width': '200px'
              'height': '200px'
              'overflow-y': 'scroll'
              'position': 'fixed'
              'left': 0,
              'top': 0
            $old = affix('.old').appendTo($container).css(height: '600px')
            $container.scrollTop(300)

            $new = affix('.new').insertBefore($old).css(height: '600px')

            up.morph($old, $new, 'cross-fade', duration: 50, reveal: true)

            $oldGhost = $('.old.up-ghost')
            $newGhost = $('.new.up-ghost')

            # Container is scrolled up due to { reveal: true } option.
            # Since $old and $new are sitting in the same viewport with a
            # single shares scrollbar This will make the ghost for $old jump.
            expect($container.scrollTop()).toEqual(0)

            # See that the ghost for $new is aligned with the top edge
            # of the viewport.
            expect($newGhost.offset().top).toEqual(0)

            # The ghost for $old is shifted upwards to make it looks like it
            # was at the scroll position before we revealed $new.
            expect($oldGhost.offset().top).toEqual(-300)


        describe 'with animations disabled globally', ->

          beforeEach ->
            up.motion.config.enabled = false

          it "doesn't animate and hides the old element instead", ->
            $old = affix('.old').text('old content')
            $new = affix('.new').text('new content')
            up.morph($old, $new, 'cross-fade', duration: 1000)
            expect($old).toBeHidden()
            expect($new).toBeVisible()
            expect($new.css('opacity')).toEqual('1')

      describeFallback 'canCssTransition', ->

        it "doesn't animate and hides the old element instead", ->
          $old = affix('.old').text('old content')
          $new = affix('.new').text('new content')
          up.morph($old, $new, 'cross-fade', duration: 1000)
          expect($old).toBeHidden()
          expect($new).toBeVisible()
          expect($new.css('opacity')).toEqual('1')

        [false, null, undefined, 'none', up.motion.none()].forEach (noneTransition) ->

          describe "when called with a `#{noneTransition}` transition", ->

            it "doesn't animate and hides the old element instead", ->
              $old = affix('.old').text('old content')
              $new = affix('.new').text('new content')
              up.morph($old, $new, noneTransition, duration: 1000)
              expect($old).toBeHidden()
              expect($new).toBeVisible()
              expect($new.css('opacity')).toEqual('1')

    describe 'up.transition', ->

      it 'should have tests'
      
    describe 'up.animation', ->

      it 'should have tests'
      
    describe 'up.motion.none', ->

      it 'should have tests'

    describe 'up.motion.prependCopy', ->

      afterEach ->
        $('.up-bounds, .up-ghost, .fixture').remove()

      it 'clones the given element into a .up-ghost-bounds container and inserts it as a sibling before the element', ->
        $element = affix('.element').text('element text')
        up.motion.prependCopy($element)
        $bounds = $element.prev()
        expect($bounds).toExist()
        expect($bounds).toHaveClass('up-bounds')
        $ghost = $bounds.children(':first')# $ghost.find('.element')
        expect($ghost).toExist()
        expect($ghost).toHaveClass('element')
        expect($ghost).toHaveText('element text')

      it 'removes <script> tags from the cloned element', ->
        $element = affix('.element')
        $('<script></script>').appendTo($element)
        up.motion.prependCopy($element)
        $ghost = $('.up-ghost')
        expect($ghost.find('script')).not.toExist()

      it 'absolutely positions the ghost over the given element', ->
        $element = affix('.element')
        up.motion.prependCopy($element)
        $ghost = $('.up-ghost')
        expect($ghost.offset()).toEqual($element.offset())
        expect($ghost.width()).toEqual($element.width())
        expect($ghost.height()).toEqual($element.height())

      it 'accurately positions the ghost over an element with margins', ->
        $element = affix('.element').css(margin: '40px')
        up.motion.prependCopy($element)
        $ghost = $('.up-ghost')
        expect($ghost.offset()).toEqual($element.offset())

      it "doesn't change the position of a child whose margins no longer collapse", ->
        $element = affix('.element')
        $child = $('<div class="child"></div>').css(margin: '40px').appendTo($element)
        up.motion.prependCopy($element)
        $clonedChild = $('.up-ghost .child')
        expect($clonedChild.offset()).toEqual($child.offset())

      it 'correctly positions the ghost over an element within a scrolled body', ->
        $body = $('body')
        $element1 = $('<div class="fixture"></div>').css(height: '75px').prependTo($body)
        $element2 = $('<div class="fixture"></div>').css(height: '100px').insertAfter($element1)
        $body.scrollTop(17)
        { $bounds, $ghost } = up.motion.prependCopy($element2)
        expect($bounds.css('position')).toBe('absolute')
        expect($bounds.css('top')).toEqual('75px')
        expect($ghost.css('position')).toBe('static')

      it 'correctly positions the ghost over an element within a viewport with overflow-y: scroll'

      it 'converts fixed elements within the copies to absolutely positioning', ->
        $element = affix('.element').css
          position: 'absolute'
          top: '50px'
          left: '50px'
        $fixedChild = $('<div class="fixed-child" up-fixed></div>').css
          position: 'fixed'
          left: '77px'
          top: '77px'
        $fixedChild.appendTo($element)
        up.motion.prependCopy($element, $('body'))
        $fixedChildGhost = $('.up-ghost .fixed-child')
        expect($fixedChildGhost.css(['position', 'left', 'top'])).toEqual
          position: 'absolute',
          left: '27px',
          top: '27px'

