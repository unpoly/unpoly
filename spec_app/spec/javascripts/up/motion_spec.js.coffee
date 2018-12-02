u = up.util
$ = jQuery

describe 'up.motion', ->

  u = up.util
  
  describe 'JavaScript functions', ->
  
    describe 'up.animate', ->

      it 'animates the given element', (done) ->
        $element = affix('.element').text('content')
        up.animate($element, 'fade-in', duration: 200, easing: 'linear')

        u.setTimer 1, ->
          expect($element).toHaveOpacity(0.0, 0.15)
        u.setTimer 100, ->
          expect($element).toHaveOpacity(0.5, 0.3)
        u.setTimer 260, ->
          expect($element).toHaveOpacity(1.0, 0.15)
          done()

      it 'returns a promise that is fulfilled when the animation has completed', (done) ->
        $element = affix('.element').text('content')
        resolveSpy = jasmine.createSpy('resolve')

        promise = up.animate($element, 'fade-in', duration: 100, easing: 'linear')
        promise.then(resolveSpy)

        u.setTimer 50, ->
          expect(resolveSpy).not.toHaveBeenCalled()
          u.setTimer 50 + (timingTolerance = 120), ->
            expect(resolveSpy).toHaveBeenCalled()
            done()

      it 'cancels an existing animation on the element by instantly jumping to the last frame', asyncSpec (next) ->
        $element = affix('.element').text('content')
        up.animate($element, { 'font-size': '40px' }, duration: 10000, easing: 'linear')

        next =>
          up.animate($element, { 'fade-in' }, duration: 100, easing: 'linear')

        next =>
          expect($element.css('font-size')).toEqual('40px')

      it 'pauses an existing CSS transitions and restores it once the Unpoly animation is done', asyncSpec (next) ->
        $element = affix('.element').text('content').css
          backgroundColor: 'yellow'
          fontSize: '10px'
          height: '20px'

        expect(parseFloat($element.css('fontSize'))).toBeAround(10, 0.1)
        expect(parseFloat($element.css('height'))).toBeAround(20, 0.1)

        next.after 10, =>
          $element.css
            transition: 'font-size 500ms linear, height 500ms linear'
            fontSize: '100px'
            height: '200px'

        next.after 250, =>
          # Original CSS transition should now be ~50% done
          @fontSizeBeforeAnimate = parseFloat($element.css('fontSize'))
          @heightBeforeAnimate = parseFloat($element.css('height'))

          expect(@fontSizeBeforeAnimate).toBeAround(0.5 * (100 - 10), 20)
          expect(@heightBeforeAnimate).toBeAround(0.5 * (200 - 20), 40)

          up.animate($element, 'fade-in', duration: 500, easing: 'linear')

        next.after 250, =>
          # Original CSS transition should remain paused at ~50%
          # Unpoly animation should now be ~50% done
          expect(parseFloat($element.css('fontSize'))).toBeAround(@fontSizeBeforeAnimate, 10)
          expect(parseFloat($element.css('height'))).toBeAround(@heightBeforeAnimate, 10)
          expect(parseFloat($element.css('opacity'))).toBeAround(0.5, 0.3)

        next.after 250, =>
          # Unpoly animation should now be done
          # The original transition resumes. For technical reasons it will take
          # its full duration for the remaining frames of the transition.
          expect(parseFloat($element.css('opacity'))).toBeAround(1.0, 0.3)

        next.after (500 + (tolerance = 125)), =>
          expect(parseFloat($element.css('fontSize'))).toBeAround(100, 20)
          expect(parseFloat($element.css('height'))).toBeAround(200, 40)


      describe 'when up.animate() is called from inside an animation function', ->

        it 'animates', (done) ->
          $element = affix('.element').text('content')

          animation = ($element, options) ->
            u.writeInlineStyle($element, opacity: 0)
            up.animate($element, { opacity: 1 }, options)

          up.animate($element, animation, duration: 300, easing: 'linear')

          u.setTimer 5, ->
            expect($element).toHaveOpacity(0.0, 0.25)
          u.setTimer 150, ->
            expect($element).toHaveOpacity(0.5, 0.25)
          u.setTimer 300, ->
            expect($element).toHaveOpacity(1.0, 0.25)
            done()

        it "finishes animations only once", (done) ->
          $element = affix('.element').text('content')

          animation = ($element, options) ->
            u.writeInlineStyle($element, opacity: 0)
            up.animate($element, { opacity: 1 }, options)

          up.animate($element, animation, duration: 200, easing: 'linear')

          u.nextFrame =>
            expect(up.motion.finishCount()).toEqual(1)
            done()


      describe 'with animations disabled globally', ->

        beforeEach ->
          up.motion.config.enabled = false

        it "doesn't animate and directly sets the last frame instead", (done) ->
          $element = affix('.element').text('content')
          callback = jasmine.createSpy('animation done callback')
          animateDone = up.animate($element, { 'font-size': '40px' }, duration: 10000, easing: 'linear')
          animateDone.then(callback)

          u.setTimer 5, =>
            expect($element.css('font-size')).toEqual('40px')
            expect(callback).toHaveBeenCalled()
            done()

      [false, null, undefined, 'none', '', {}].forEach (noneAnimation) ->

        describe "when called with a `#{noneAnimation}` animation", ->

          it "doesn't animate and resolves instantly", asyncSpec (next) ->
            $element = affix('.element').text('content')
            callback = jasmine.createSpy('animation done callback')
            animateDone = up.animate($element, noneAnimation, duration: 10000, easing: 'linear')
            animateDone.then(callback)
            next => expect(callback).toHaveBeenCalled()


    describe 'up.motion.finish', ->

      describe 'when called with an element or selector', ->

        it 'cancels an existing animation on the given element by instantly jumping to the last frame', asyncSpec (next) ->
          $element = affix('.element').text('content')
          up.animate($element, { 'font-size': '40px', 'opacity': '0.5' }, duration: 30000)

          next =>
            up.motion.finish($element)

          next =>
            expect($element.css('font-size')).toEqual('40px')
            expect(u.opacity($element, 'opacity')).toBeAround(0.5, 0.01) # Safari sometimes has rounding errors

        it 'cancels animations on children of the given element', asyncSpec (next) ->
          $parent = affix('.element')
          $child = $parent.affix('.child')
          up.animate($child, { 'font-size': '40px' }, duration: 10000)

          next =>
            up.motion.finish($parent)

          next =>
            expect($child.css('font-size')).toEqual('40px')

        it 'does not cancel animations on other elements', asyncSpec (next) ->
          $element1 = affix('.element1').text('content1')
          $element2 = affix('.element2').text('content2')
          up.animate($element1, 'fade-in', duration: 10000)
          up.animate($element2, 'fade-in', duration: 10000)

          next =>
            up.motion.finish($element1)

          next =>
            expect(Number($element1.css('opacity'))).toEqual(1)
            expect(Number($element2.css('opacity'))).toBeAround(0, 0.1)

        it 'restores CSS transitions from before the Unpoly animation', asyncSpec (next) ->
          $element = affix('.element').text('content')
          $element.css('transition': 'font-size 3s ease')
          oldTransitionProperty = $element.css('transition-property')
          expect(oldTransitionProperty).toBeDefined()
          expect(oldTransitionProperty).toContain('font-size') # be paranoid
          up.animate($element, 'fade-in', duration: 10000)

          next =>
            up.motion.finish($element)

          next =>
            expect(u.opacity($element)).toEqual(1)
            currentTransitionProperty = $element.css('transition-property')
            expect(currentTransitionProperty).toEqual(oldTransitionProperty)
            expect(currentTransitionProperty).toContain('font-size')
            expect(currentTransitionProperty).not.toContain('opacity')

        it 'cancels an existing transition on the old element by instantly jumping to the last frame', asyncSpec (next) ->
          $v1 = affix('.element').text('v1')
          $v2 = affix('.element').text('v2')

          up.morph($v1, $v2, 'cross-fade', duration: 200)

          next =>
            expect($v1).toHaveOpacity(1.0, 0.2)
            expect($v2).toHaveOpacity(0.0, 0.2)

            up.motion.finish($v1)

          next =>
            expect($v1).toBeDetached()
            expect($v2).toHaveOpacity(1.0, 0.2)

        it 'cancels an existing transition on the new element by instantly jumping to the last frame', asyncSpec (next) ->
          $v1 = affix('.element').text('v1')
          $v2 = affix('.element').text('v2')

          up.morph($v1, $v2, 'cross-fade', duration: 200)

          next =>
            expect($v1).toHaveOpacity(1.0, 0.2)
            expect($v2).toHaveOpacity(0.0, 0.2)

            up.motion.finish($v2)

          next =>
            expect($v1).toBeDetached()
            expect($v2).toHaveOpacity(1.0, 0.2)


        it 'cancels transitions on children of the given element', asyncSpec (next) ->
          $parent = affix('.parent')
          $old = $parent.affix('.old').text('old content')
          $new = $parent.affix('.new').text('new content')

          up.morph($old, $new, 'cross-fade', duration: 2000)

          next =>
            expect($old).toHaveOpacity(1.0, 0.1)
            expect($new).toHaveOpacity(0.0, 0.1)

            up.motion.finish($parent)

          next =>
            expect($old).toBeDetached()
            expect($new).toHaveOpacity(1.0)


        it 'does not leave .up-bounds elements in the DOM', asyncSpec (next) ->
          $old = affix('.old').text('old content')
          $new = affix('.new').text('new content')

          up.morph($old, $new, 'cross-fade', duration: 2000)

          next =>
            up.motion.finish($old)

          next =>
            expect($old).toBeDetached()
            expect($('.up-bounds').length).toBe(0)


        it 'emits an up:motion:finish event on the given animating element, so custom animation functions can react to the finish request', asyncSpec (next) ->
          $element = affix('.element').text('element text')
          listener = jasmine.createSpy('finish event listener')
          $element.on('up:motion:finish', listener)

          up.animate($element, 'fade-in')

          next =>
            expect(listener).not.toHaveBeenCalled()
            up.motion.finish()

          next =>
            expect(listener).toHaveBeenCalled()


        it 'does not emit an up:motion:finish event if no element is animating', asyncSpec (next) ->
          listener = jasmine.createSpy('finish event listener')
          up.on('up:motion:finish', listener)
          up.motion.finish()

          next =>
            expect(listener).not.toHaveBeenCalled()


      describe 'when called without arguments', ->

        it 'cancels all animations on the screen', asyncSpec (next) ->
          $element1 = affix('.element1').text('content1')
          $element2 = affix('.element2').text('content2')

          up.animate($element1, 'fade-in', duration: 3000)
          up.animate($element2, 'fade-in', duration: 3000)

          next =>
            expect(u.opacity($element1)).toBeAround(0.0, 0.1)
            expect(u.opacity($element2)).toBeAround(0.0, 0.1)

            up.motion.finish()

          next =>
            $element1 = $('.element1')
            $element2 = $('.element2')
            expect(u.opacity($element1)).toBe(1.0)
            expect(u.opacity($element2)).toBe(1.0)

    describe 'up.morph', ->

      it 'transitions between two element by absolutely positioning one element above the other', asyncSpec (next) ->
        $old = affix('.old').text('old content').css(width: '200px', width: '200px')
        $new = affix('.new').text('new content').css(width: '200px', width: '200px').detach()

        oldDims = $old[0].getBoundingClientRect()

        up.morph($old, $new, 'cross-fade', duration: 200, easing: 'linear')

        next =>
          expect($old[0].getBoundingClientRect()).toEqual(oldDims)
          expect($new[0].getBoundingClientRect()).toEqual(oldDims)

          expect(u.opacity($old)).toBeAround(1.0, 0.25)
          expect(u.opacity($new)).toBeAround(0.0, 0.25)

        next.after 100, =>
          expect(u.opacity($old)).toBeAround(0.5, 0.25)
          expect(u.opacity($new)).toBeAround(0.5, 0.25)

        next.after (100 + (tolerance = 110)), =>
          expect(u.opacity($new)).toBeAround(1.0, 0.25)
          expect($old).toBeDetached()

      it 'does not change the position of sibling elements (as long as the old and new elements are of equal size)', asyncSpec (next) ->
        $container = affix('.container')

        $before = $container.affix('.before').css(margin: '20px')
        $old = $container.affix('.old').text('old content').css(width: '200px', width: '200px', margin: '20px')
        $new = $container.affix('.new').text('new content').css(width: '200px', width: '200px', margin: '20px').detach()
        $after = $container.affix('.before').css(margin: '20px')

        beforeDims = $before[0].getBoundingClientRect()
        afterDims = $after[0].getBoundingClientRect()

        up.morph($old, $new, 'cross-fade', duration: 30, easing: 'linear')

        next =>
          expect($before[0].getBoundingClientRect()).toEqual(beforeDims)
          expect($after[0].getBoundingClientRect()).toEqual(afterDims)

        next.after 50, =>
          expect($before[0].getBoundingClientRect()).toEqual(beforeDims)
          expect($after[0].getBoundingClientRect()).toEqual(afterDims)

      it 'transitions between two elements that are already positioned absolutely', asyncSpec (next) ->
        elementStyles =
          position: 'absolute'
          left: '30px'
          top: '30px'
          width: '200px'
          width: '200px'
        $old = affix('.old').text('old content').css(elementStyles)
        $new = affix('.new').text('new content').css(elementStyles).detach()

        oldDims = $old[0].getBoundingClientRect()

        up.morph($old, $new, 'cross-fade', duration: 100, easing: 'linear')

        next =>
          expect($old[0].getBoundingClientRect()).toEqual(oldDims)
          expect($new[0].getBoundingClientRect()).toEqual(oldDims)

        next.after (100 + (timingTolerance = 120)), =>
          expect($old).toBeDetached()
          expect($new[0].getBoundingClientRect()).toEqual(oldDims)

      it 'cancels an existing transition on the new element by instantly jumping to the last frame', asyncSpec (next) ->
        $v1 = affix('.element').text('v1')
        $v2 = affix('.element').text('v2')
        $v3 = affix('.element').text('v3')

        up.morph($v1, $v2, 'cross-fade', duration: 200)

        next =>
          expect($v1).toHaveOpacity(1.0, 0.2)
          expect($v2).toHaveOpacity(0.0, 0.2)

          up.morph($v2, $v3, 'cross-fade', duration: 200)

        next =>
          expect($v1).toBeDetached()
          expect($v2).toHaveOpacity(1.0, 0.2)
          expect($v3).toHaveOpacity(0.0, 0.2)

      it 'detaches the old element in the DOM', (done) ->
        $v1 = affix('.element').text('v1')
        $v2 = affix('.element').text('v2')

        morphDone = up.morph($v1, $v2, 'cross-fade', duration: 5)

        morphDone.then ->
          expect($v1).toBeDetached()
          expect($v2).toBeAttached()
          done()

      it 'does not leave .up-bounds elements in the DOM', (done) ->
        $v1 = affix('.element').text('v1')
        $v2 = affix('.element').text('v2')

        morphDone = up.morph($v1, $v2, 'cross-fade', duration: 5)

        morphDone.then ->
          expect('.up-bounds').not.toExist()
          done()


      describe 'when up.animate() is called from inside a transition function', ->

        it 'animates', asyncSpec (next) ->
          $old = affix('.old').text('old content')
          $new = affix('.new').text('new content').detach()

          oldDims = $old[0].getBoundingClientRect()

          transition = (oldElement, newElement, options) ->
            up.animate(oldElement, 'fade-out', options)
            up.animate(newElement, 'fade-in', options)

          up.morph($old, $new, transition, duration: 200, easing: 'linear')

          next =>
            expect($old[0].getBoundingClientRect()).toEqual(oldDims)
            expect($new[0].getBoundingClientRect()).toEqual(oldDims)

            expect(u.opacity($old)).toBeAround(1.0, 0.25)
            expect(u.opacity($new)).toBeAround(0.0, 0.25)

          next.after 100, =>
            expect(u.opacity($old)).toBeAround(0.5, 0.25)
            expect(u.opacity($new)).toBeAround(0.5, 0.25)

          next.after (100 + (tolerance = 110)), =>
            expect(u.opacity($new)).toBeAround(1.0, 0.1)
            expect($old).toBeDetached()
            expect($new).toBeAttached()

        it 'finishes animations only once', asyncSpec (next) ->
          $old = affix('.old').text('old content')
          $new = affix('.new').text('new content').detach()

          transition = (oldElement, newElement, options) ->
            up.animate(oldElement, 'fade-out', options)
            up.animate(newElement, 'fade-in', options)

          up.morph($old, $new, transition, duration: 200, easing: 'linear')

          next ->
            expect(up.motion.finishCount()).toEqual(1)

      describe 'when up.morph() is called from inside a transition function', ->

        it 'morphs', asyncSpec (next) ->
          $old = affix('.old').text('old content')
          $new = affix('.new').text('new content').detach()

          oldDims = $old[0].getBoundingClientRect()

          transition = (oldElement, newElement, options) ->
            up.morph(oldElement, newElement, 'cross-fade', options)

          up.morph($old, $new, transition, duration: 400, easing: 'linear')

          next =>
            expect($old[0].getBoundingClientRect()).toEqual(oldDims)
            expect($new[0].getBoundingClientRect()).toEqual(oldDims)

            expect(u.opacity($old)).toBeAround(1.0, 0.25)
            expect(u.opacity($new)).toBeAround(0.0, 0.25)

          next.after 200, =>
            expect(u.opacity($old)).toBeAround(0.5, 0.25)
            expect(u.opacity($new)).toBeAround(0.5, 0.25)

          next.after (200 + (tolerance = 110)), =>
            expect(u.opacity($new)).toBeAround(1.0, 0.25)
            expect($old).toBeDetached()
            expect($new).toBeAttached()

        it "finishes animations only once", asyncSpec (next) ->
          $old = affix('.old').text('old content')
          $new = affix('.new').text('new content').detach()

          transition = (oldElement, newElement, options) ->
            up.morph(oldElement, newElement, 'cross-fade', options)

          up.morph($old, $new, transition, duration: 50, easing: 'linear')

          next ->
            expect(up.motion.finishCount()).toEqual(1)


      describe 'with { reveal: true } option', ->

        it 'reveals the new element while making the old element within the same viewport appear as if it would keep its scroll position', asyncSpec (next) ->
          $container = affix('.container[up-viewport]').css
            'width': '200px'
            'height': '200px'
            'overflow-y': 'scroll'
            'position': 'fixed'
            'left': 0,
            'top': 0
          $old = affix('.old').appendTo($container).css(height: '600px')
          $container.scrollTop(300)

          expect($container.scrollTop()).toEqual(300)

          $new = affix('.new').css(height: '600px').detach()

          up.morph($old, $new, 'cross-fade', duration: 50, reveal: true)

          next =>
            # Container is scrolled up due to { reveal: true } option.
            # Since $old and $new are sitting in the same viewport with a
            # single shared scrollbar, this will make the ghost for $old jump.
            expect($container.scrollTop()).toEqual(0)

            # See that the ghost for $new is aligned with the top edge
            # of the viewport.
            expect($new.offset().top).toEqual(0)

            # The absolitized $old is shifted upwards to make it looks like it
            # was at the scroll position before we revealed $new.
            expect($old.offset().top).toEqual(-300)

      describe 'with animations disabled globally', ->

        beforeEach ->
          up.motion.config.enabled = false

        it "doesn't animate and detaches the old element instead", asyncSpec (next) ->
          $old = affix('.old').text('old content')
          $new = affix('.new').text('new content')
          up.morph($old, $new, 'cross-fade', duration: 1000)

          next =>
            expect($old).toBeDetached()
            expect($new).toBeAttached()
            expect($new).toHaveOpacity(1.0)


      [false, null, undefined, 'none', 'none/none', '', [], [undefined, null], ['none', 'none'], ['none', {}]].forEach (noneTransition) ->

        describe "when called with a `#{JSON.stringify(noneTransition)}` transition", ->

          it "doesn't animate and detaches the old element instead", asyncSpec (next) ->
            $old = affix('.old').text('old content')
            $new = affix('.new').text('new content')
            up.morph($old, $new, noneTransition, duration: 1000)

            next =>
              expect($old).toBeDetached()
              expect($new).toBeAttached()
              expect($new).toHaveOpacity(1.0)


    describe 'up.transition', ->

      it 'should have tests'
      
    describe 'up.animation', ->

      it 'should have tests'
