const u = up.util
const e = up.element
const $ = jQuery

describe('up.motion', function() {

  describe('JavaScript functions', function() {

    describe('up.animate()', function() {

      it('animates the given element with a predefined animation', async function() {
        const element = fixture('.element', {text: 'content'})
        up.animate(element, 'fade-in', {duration: 200, easing: 'linear'})

        await wait(1)

        expect(element).toHaveOpacity(0.0, 0.15)

        await wait(100)

        expect(element).toHaveOpacity(0.5, 0.3)

        await wait(260)

        expect(element).toHaveOpacity(1.0, 0.15)
      })

      it('animates the given element to a frame of kebab-case CSS properties', async function() {
        const element = fixture('.element', {text: 'content', style: { opacity: 0 }})
        up.animate(element, { opacity: 1 }, {duration: 200, easing: 'linear'})

        await wait(1)

        expect(element).toHaveOpacity(0.0, 0.15)

        await wait(100)

        expect(element).toHaveOpacity(0.5, 0.3)

        await wait(260)

        expect(element).toHaveOpacity(1.0, 0.15)
      })

      if (up.migrate.loaded) {
        it('animates the given element to a frame of camelCase CSS properties', async function() {
          const warnSpy = up.migrate.warn.mock()
          const element = fixture('.element', {text: 'content', style: { 'font-size': '0px' }})
          up.animate(element, { fontSize: '100px' }, {duration: 200, easing: 'linear'})

          await wait(1)

          expect(up.element.styleNumber(element, 'font-size')).toBeAround(0, 15)
          expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('CSS property names must be in kebab-case'))

          await wait(100)

          expect(up.element.styleNumber(element, 'font-size')).toBeAround(50, 30)

          await wait(260)

          expect(up.element.styleNumber(element, 'font-size')).toBeAround(100, 15)
        })
      }

      it('returns a promise that is fulfilled when the animation has completed', function(done) {
        const $element = $fixture('.element').text('content')
        const resolveSpy = jasmine.createSpy('resolve')

        const promise = up.animate($element, 'fade-in', {duration: 100, easing: 'linear'})
        promise.then(resolveSpy)

        u.timer(50, function() {
          let timingTolerance
          expect(resolveSpy).not.toHaveBeenCalled()
          u.timer(50 + (timingTolerance = 120), function() {
            expect(resolveSpy).toHaveBeenCalled()
            done()
          })
        })
      })

      it('cancels an existing animation on the element by instantly jumping to the last frame (async)', async function() {
        const $element = $fixture('.element').text('content')
        up.animate($element, { 'font-size': '40px' }, {duration: 10000, easing: 'linear'})

        await wait()

        up.animate($element, 'fade-in', {duration: 200, easing: 'linear'})

        await wait()

        expect($element.css('font-size')).toEqual('40px')
        expect($element).toHaveOpacity(0.0, 0.15)

        await wait(250)

        expect($element).toHaveOpacity(1.0, 0.15)
      })

      it('cancels an existing animation on the element by instantly jumping to the last frame (sync)', async function() {
        const $element = $fixture('.element').text('content')

        up.animate($element, { 'font-size': '40px' }, {duration: 10000, easing: 'linear'})
        up.animate($element, 'fade-in', {duration: 200, easing: 'linear'})

        expect($element.css('font-size')).toEqual('40px')
        expect($element).toHaveOpacity(0.0, 0.15)

        await wait(250)

        expect($element).toHaveOpacity(1.0, 0.15)
      })

      it('pauses an existing CSS transitions and restores it once the Unpoly animation is done', asyncSpec(function(next) {
        let tolerance
        const $element = $fixture('.element').text('content').css({
          backgroundColor: 'yellow',
          fontSize: '10px',
          height: '20px'
        })

        expect(parseFloat($element.css('fontSize'))).toBeAround(10, 0.1)
        expect(parseFloat($element.css('height'))).toBeAround(20, 0.1)

        next.after(10, () => {
          $element.css({
            transition: 'font-size 1000ms linear, height 1000ms linear',
            fontSize: '100px',
            height: '200px'
          })
        })

        next.after(500, () => {
          // Original CSS transition should now be ~50% done
          this.fontSizeBeforeAnimate = parseFloat($element.css('fontSize'))
          this.heightBeforeAnimate = parseFloat($element.css('height'))

          expect(this.fontSizeBeforeAnimate).toBeAround(0.5 * (100 - 10), 20)
          expect(this.heightBeforeAnimate).toBeAround(0.5 * (200 - 20), 40)

          up.animate($element, 'fade-in', {duration: 1000, easing: 'linear'})
        })

        next.after(500, () => {
          // Original CSS transition should remain paused at ~50%
          // Unpoly animation should now be ~50% done
          expect(parseFloat($element.css('fontSize'))).toBeAround(this.fontSizeBeforeAnimate, 10)
          expect(parseFloat($element.css('height'))).toBeAround(this.heightBeforeAnimate, 10)
          expect(parseFloat($element.css('opacity'))).toBeAround(0.5, 0.3)
        })

        next.after(500, () => {
          // Unpoly animation should now be done
          // The original transition resumes. For technical reasons it will take
          // its full duration for the remaining frames of the transition.
          expect(parseFloat($element.css('opacity'))).toBeAround(1.0, 0.3)
        })

        next.after((1000 + (tolerance = 250)), () => {
          expect(parseFloat($element.css('fontSize'))).toBeAround(100, 20)
          expect(parseFloat($element.css('height'))).toBeAround(200, 40)
        })
      })
      )

      describe('{ duration } option', function() {

        it('uses the given duration', async function() {
          // Use a vastly different default so we see that the given { duration } is used instead
          up.motion.config.duration = 5000

          const element = fixture('.element', {text: 'content'})
          up.animate(element, 'fade-in', {duration: 200, easing: 'linear'})

          await wait(100)

          expect(element).toHaveOpacity(0.5, 0.3)
        })

        it('defaults to up.motion.config.duration if no { duration } is given', async function() {
          up.motion.config.duration = 200

          const element = fixture('.element', {text: 'content'})
          up.animate(element, 'fade-in', {easing: 'linear'})

          await wait(100)

          expect(element).toHaveOpacity(0.5, 0.3)
        })

        it('animates instantly with { duration: 0 }', async function() {
          up.motion.config.duration = 200

          const element = fixture('.element', {text: 'content'})
          up.animate(element, 'fade-in', {easing: 'linear', duration: 0})

          await wait()

          expect(element).toHaveOpacity(1.0)
        })
      })

      describe('with an animation that flies in the element from the screen edge', () => {
        it('does not leave a `transform` CSS property once the animation finishes, as to not affect the positioning of child elements', async function () {
          // https://github.com/unpoly/unpoly/issues/439
          const element = fixture('.element')

          await up.animate(element, 'move-from-left', { duration: 50 })

          expect(element.style.transform).toBeBlank()
        })
      })

      describe('when up.animate() is called from inside an animation function', function() {

        it('animates', async function() {
          const $element = $fixture('.element').text('content')

          const animation = function($element, options) {
            e.setStyle($element, {opacity: 0})
            return up.animate($element, { opacity: 1 }, options)
          }

          up.animate($element, animation, {duration: 2000, easing: 'linear'})

          await wait(5)

          expect($element).toHaveOpacity(0.0, 0.25)

          await wait(1000)

          expect($element).toHaveOpacity(0.5, 0.25)

          await wait(1000)

          expect($element).toHaveOpacity(1.0, 0.25)
        })

        it("finishes animations only once", function(done) {
          const $element = $fixture('.element').text('content')

          const animation = function($element, options) {
            e.setStyle($element, {opacity: 0})
            return up.animate($element, { opacity: 1 }, options)
          }

          up.animate($element, animation, {duration: 200, easing: 'linear'})

          u.task(() => {
            expect(up.motion.finishCount()).toEqual(1)
            done()
          })
        })
      })


      describe('with animations disabled globally', function() {

        beforeEach(() => {
          up.motion.config.enabled = false
        })

        it("doesn't animate and directly sets the last frame instead", function(done) {
          const $element = $fixture('.element').text('content')
          const callback = jasmine.createSpy('animation done callback')
          const animateDone = up.animate($element, { 'font-size': '40px' }, {duration: 10000, easing: 'linear'})
          animateDone.then(callback)

          u.timer(5, () => {
            expect($element.css('font-size')).toEqual('40px')
            expect(callback).toHaveBeenCalled()
            done()
          })
        })
      })

      for (let noneAnimation of [false, null, undefined, 'none', '', {}]) {
        describe(`when called with a \`${noneAnimation}\` animation`, () => {

          it("doesn't animate and resolves instantly", async function() {
            const $element = $fixture('.element').text('content')
            const callback = jasmine.createSpy('animation done callback')
            const animateDone = up.animate($element, noneAnimation, {duration: 10000, easing: 'linear'})
            animateDone.then(callback)
            await wait()
            expect(callback).toHaveBeenCalled()
          })

        })
      }
    })


    describe('up.motion.finish()', function() {

      describe('when called with an element or selector', function() {

        it('cancels an existing animation on the given element by instantly jumping to the last frame', asyncSpec(function(next) {
          const $element = $fixture('.element').text('content')
          up.animate($element, { 'font-size': '40px', 'opacity': '0.5' }, {duration: 30000})

          next(() => {
            up.motion.finish($element)
          })

          next(() => {
            expect($element.css('font-size')).toEqual('40px')
            expect($element).toHaveOpacity(0.5, 0.01)
          })
        })
        ) // Safari sometimes has rounding errors

        it('cancels animations on children of the given element', asyncSpec(function(next) {
          const $parent = $fixture('.element')
          const $child = $parent.affix('.child')
          up.animate($child, { 'font-size': '40px' }, {duration: 10000})

          next(() => {
            up.motion.finish($parent)
          })

          next(() => {
            expect($child.css('font-size')).toEqual('40px')
          })
        })
        )

        it('does not cancel animations on other elements', asyncSpec(function(next) {
          const $element1 = $fixture('.element1').text('content1')
          const $element2 = $fixture('.element2').text('content2')
          up.animate($element1, 'fade-in', {duration: 10000})
          up.animate($element2, 'fade-in', {duration: 10000})

          next(() => {
            up.motion.finish($element1)
          })

          next(() => {
            expect(Number($element1.css('opacity'))).toEqual(1)
            expect(Number($element2.css('opacity'))).toBeAround(0, 0.1)
          })
        })
        )

        it('restores CSS transitions from before the Unpoly animation', asyncSpec(function(next) {
          const $element = $fixture('.element').text('content')
          $element.css({'transition': 'font-size 3s ease'})
          const oldTransitionProperty = $element.css('transition-property')
          expect(oldTransitionProperty).toBeDefined()
          expect(oldTransitionProperty).toContain('font-size') // be paranoid
          up.animate($element, 'fade-in', {duration: 10000})

          next(() => {
            up.motion.finish($element)
          })

          next(() => {
            expect($element).toHaveOpacity(1)
            const currentTransitionProperty = $element.css('transition-property')
            expect(currentTransitionProperty).toEqual(oldTransitionProperty)
            expect(currentTransitionProperty).toContain('font-size')
            expect(currentTransitionProperty).not.toContain('opacity')
          })
        })
        )

        it('cancels an existing transition on the old element by instantly jumping to the last frame', asyncSpec(function(next) {
          const $v1 = $fixture('.element').text('v1')
          const $v2 = $fixture('.element').text('v2')

          up.morph($v1, $v2, 'cross-fade', {duration: 200})

          next(() => {
            expect($v1).toHaveOpacity(1.0, 0.2)
            expect($v2).toHaveOpacity(0.0, 0.2)

            up.motion.finish($v1)
          })

          next(() => {
            expect($v1).toBeDetached()
            expect($v2).toHaveOpacity(1.0, 0.2)
          })
        })
        )

        it('cancels an existing transition on the new element by instantly jumping to the last frame', asyncSpec(function(next) {
          const $v1 = $fixture('.element').text('v1')
          const $v2 = $fixture('.element').text('v2')

          up.morph($v1, $v2, 'cross-fade', {duration: 200})

          next(() => {
            expect($v1).toHaveOpacity(1.0, 0.2)
            expect($v2).toHaveOpacity(0.0, 0.2)

            up.motion.finish($v2)
          })

          next(() => {
            expect($v1).toBeDetached()
            expect($v2).toHaveOpacity(1.0, 0.2)
          })
        })
        )


        it('cancels transitions on children of the given element', asyncSpec(function(next) {
          const $parent = $fixture('.parent')
          const $old = $parent.affix('.old').text('old content')
          const $new = $parent.affix('.new').text('new content')

          up.morph($old, $new, 'cross-fade', {duration: 2000})

          next(() => {
            expect($old).toHaveOpacity(1.0, 0.1)
            expect($new).toHaveOpacity(0.0, 0.1)

            up.motion.finish($parent)
          })

          next(() => {
            expect($old).toBeDetached()
            expect($new).toHaveOpacity(1.0)
          })
        })
        )


        it('does not leave <up-bounds> elements in the DOM', asyncSpec(function(next) {
          const $old = $fixture('.old').text('old content')
          const $new = $fixture('.new').text('new content')

          up.morph($old, $new, 'cross-fade', {duration: 2000})

          next(() => {
            up.motion.finish($old)
          })

          next(() => {
            expect($old).toBeDetached()
            expect($('up-bounds').length).toBe(0)
          })
        })
        )


        it('emits an up:motion:finish event on the given animating element, so custom animation functions can react to the finish request', asyncSpec(function(next) {
          const $element = $fixture('.element').text('element text')
          const listener = jasmine.createSpy('finish event listener')
          $element.on('up:motion:finish', listener)

          up.animate($element, 'fade-in')

          next(() => {
            expect(listener).not.toHaveBeenCalled()
            up.motion.finish()
          })

          next(() => {
            expect(listener).toHaveBeenCalled()
          })
        })
        )


        it('does not emit an up:motion:finish event if no element is animating', asyncSpec(function(next) {
          const listener = jasmine.createSpy('finish event listener')
          up.on('up:motion:finish', listener)
          up.motion.finish()

          next(() => {
            expect(listener).not.toHaveBeenCalled()
          })
        })
        )
      })


      describe('when called without arguments', () => it('cancels all animations on the screen', asyncSpec(function(next) {
        let $element1 = $fixture('.element1').text('content1')
        let $element2 = $fixture('.element2').text('content2')

        up.animate($element1, 'fade-in', {duration: 3000})
        up.animate($element2, 'fade-in', {duration: 3000})

        next(() => {
          expect($element1).toHaveOpacity(0.0, 0.1)
          expect($element2).toHaveOpacity(0.0, 0.1)

          up.motion.finish()
        })

        next(() => {
          $element1 = $('.element1')
          $element2 = $('.element2')
          expect($element1).toHaveOpacity(1.0)
          expect($element2).toHaveOpacity(1.0)
        })
      })
      ))
    })

    describe('up.morph', function() {

      it('transitions between two element by absolutely positioning one element above the other', asyncSpec(function(next) {
        let tolerance
        const $old = $fixture('.old').text('old content').css({width: '200px', height: '200px'})
        const $new = $fixture('.new').text('new content').css({width: '200px', height: '200px'}).detach()

        const oldDims = $old[0].getBoundingClientRect()

        up.morph($old, $new, 'cross-fade', {duration: 200, easing: 'linear'})

        next(() => {
          expect($old[0].getBoundingClientRect()).toEqual(oldDims)
          expect($new[0].getBoundingClientRect()).toEqual(oldDims)

          expect($old).toHaveOpacity(1.0, 0.25)
          expect($new).toHaveOpacity(0.0, 0.25)
        })

        next.after(100, () => {
          expect($old).toHaveOpacity(0.5, 0.25)
          expect($new).toHaveOpacity(0.5, 0.25)
        })

        next.after((100 + (tolerance = 110)), () => {
          expect($new).toHaveOpacity(1.0, 0.25)
          expect($old).toBeDetached()
        })
      })
      )

      it('does not change the position of sibling elements (as long as the old and new elements are of equal size)', asyncSpec(function(next) {
        const $container = $fixture('.container')

        const $before = $container.affix('.before').css({margin: '20px'})
        const $old = $container.affix('.old').text('old content').css({width: '200px', height: '200px', margin: '20px'})
        const $new = $container.affix('.new').text('new content').css({width: '200px', height: '200px', margin: '20px'}).detach()
        const $after = $container.affix('.before').css({margin: '20px'})

        const beforeDims = $before[0].getBoundingClientRect()
        const afterDims = $after[0].getBoundingClientRect()

        up.morph($old, $new, 'cross-fade', {duration: 30, easing: 'linear'})

        next(() => {
          expect($before[0].getBoundingClientRect()).toEqual(beforeDims)
          expect($after[0].getBoundingClientRect()).toEqual(afterDims)
        })

        next.after(50, () => {
          expect($before[0].getBoundingClientRect()).toEqual(beforeDims)
          expect($after[0].getBoundingClientRect()).toEqual(afterDims)
        })
      })
      )

      it('transitions between two elements that are already positioned absolutely', asyncSpec(function(next) {
        let timingTolerance
        const elementStyles = {
          position: 'absolute',
          left: '30px',
          top: '30px',
          width: '200px',
          height: '200px'
        }
        const $old = $fixture('.old').text('old content').css(elementStyles)
        const $new = $fixture('.new').text('new content').css(elementStyles).detach()

        const oldDims = $old[0].getBoundingClientRect()

        up.morph($old, $new, 'cross-fade', {duration: 100, easing: 'linear'})

        next(() => {
          expect($old[0].getBoundingClientRect()).toEqual(oldDims)
          expect($new[0].getBoundingClientRect()).toEqual(oldDims)
        })

        next.after((100 + (timingTolerance = 120)), () => {
          expect($old).toBeDetached()
          expect($new[0].getBoundingClientRect()).toEqual(oldDims)
        })
      })
      )

      it('cancels an existing transition on the new element by instantly jumping to the last frame', asyncSpec(function(next) {
        const $v1 = $fixture('.element').text('v1')
        const $v2 = $fixture('.element').text('v2')
        const $v3 = $fixture('.element').text('v3')

        up.morph($v1, $v2, 'cross-fade', {duration: 200})

        next(() => {
          expect($v1).toHaveOpacity(1.0, 0.2)
          expect($v2).toHaveOpacity(0.0, 0.2)

          up.morph($v2, $v3, 'cross-fade', {duration: 200})
        })

        next(() => {
          expect($v1).toBeDetached()
          expect($v2).toHaveOpacity(1.0, 0.2)
          expect($v3).toHaveOpacity(0.0, 0.2)
        })
      })
      )

      it('detaches the old element in the DOM', async function() {
        const $v1 = $fixture('.element').text('v1')
        const $v2 = $fixture('.element').text('v2')

        await up.morph($v1, $v2, 'cross-fade', {duration: 5})

        expect($v1).toBeDetached()
        expect($v2).toBeAttached()
      })

      it('does not leave <up-bounds> elements in the DOM', async function() {
        const $v1 = $fixture('.element').text('v1')
        const $v2 = $fixture('.element').text('v2')

        await up.morph($v1, $v2, 'cross-fade', {duration: 5})

        expect($('up-bounds').length).toBe(0)
      })

      // https://github.com/unpoly/unpoly/issues/439
      it('does not leave a `transition` CSS property once the transition finishes, as to not affect the positioning of child elements', async function() {
        const v1 = fixture('.element', {text: 'v1'})
        const v2 = fixture('.element', {text: 'v2'})

        await up.morph(v1, v2, 'move-left', { duration: 10 })

        expect(v2.style.transition).toBeBlank()
      })

      describe('when up.animate() is called from inside a transition function', function() {

        it('animates', asyncSpec(function(next) {
          let tolerance
          const $old = $fixture('.old').text('old content')
          const $new = $fixture('.new').text('new content').detach()

          const oldDims = $old[0].getBoundingClientRect()

          const transition = function(oldElement, newElement, options) {
            return Promise.all([
              up.animate(oldElement, 'fade-out', options),
              up.animate(newElement, 'fade-in', options)
            ])
          }

          up.morph($old, $new, transition, {duration: 200, easing: 'linear'})

          next(() => {
            expect($old[0].getBoundingClientRect()).toEqual(oldDims)
            expect($new[0].getBoundingClientRect()).toEqual(oldDims)

            expect($old).toHaveOpacity(1.0, 0.25)
            expect($new).toHaveOpacity(0.0, 0.25)
          })

          next.after(100, () => {
            expect($old).toHaveOpacity(0.5, 0.25)
            expect($new).toHaveOpacity(0.5, 0.25)
          })

          next.after((100 + (tolerance = 110)), () => {
            expect($new).toHaveOpacity(1.0, 0.1)
            expect($old).toBeDetached()
            expect($new).toBeAttached()
          })
        })
        )

        it('finishes animations only once', asyncSpec(function(next) {
          const $old = $fixture('.old').text('old content')
          const $new = $fixture('.new').text('new content').detach()

          const transition = function(oldElement, newElement, options) {
            up.animate(oldElement, 'fade-out', options)
            up.animate(newElement, 'fade-in', options)
          }

          up.morph($old, $new, transition, {duration: 200, easing: 'linear'})

          next(() => expect(up.motion.finishCount()).toEqual(1))
        })
        )
      })

      describe('when up.morph() is called from inside a transition function', function() {

        it('morphs', asyncSpec(function(next) {
          let tolerance
          const $old = $fixture('.old').text('old content')
          const $new = $fixture('.new').text('new content').detach()

          const oldDims = $old[0].getBoundingClientRect()

          const transition = (oldElement, newElement, options) => up.morph(oldElement, newElement, 'cross-fade', options)

          up.morph($old, $new, transition, {duration: 400, easing: 'linear'})

          next(() => {
            expect($old[0].getBoundingClientRect()).toEqual(oldDims)
            expect($new[0].getBoundingClientRect()).toEqual(oldDims)

            expect($old).toHaveOpacity(1.0, 0.25)
            expect($new).toHaveOpacity(0.0, 0.25)
          })

          next.after(200, () => {
            expect($old).toHaveOpacity(0.5, 0.25)
            expect($new).toHaveOpacity(0.5, 0.25)
          })

          next.after((200 + (tolerance = 110)), () => {
            expect($new).toHaveOpacity(1.0, 0.25)
            expect($old).toBeDetached()
            expect($new).toBeAttached()
          })
        })
        )

        it("finishes animations only once", asyncSpec(function(next) {
          const $old = $fixture('.old').text('old content')
          const $new = $fixture('.new').text('new content').detach()

          const transition = (oldElement, newElement, options) => up.morph(oldElement, newElement, 'cross-fade', options)

          up.morph($old, $new, transition, {duration: 50, easing: 'linear'})

          next(() => expect(up.motion.finishCount()).toEqual(1))
        })
        )
      })


      describe('with animations disabled globally', function() {

        beforeEach(() => {
          up.motion.config.enabled = false
        })

        it("doesn't animate and detaches the old element instead", asyncSpec(function(next) {
          const $old = $fixture('.old').text('old content')
          const $new = $fixture('.new').text('new content')
          up.morph($old, $new, 'cross-fade', {duration: 1000})

          next(() => {
            expect($old).toBeDetached()
            expect($new).toBeAttached()
            expect($new).toHaveOpacity(1.0)
          })
        })
        )
      })

      for (let noneTransition of  [false, null, undefined, 'none', 'none/none', '', [], [undefined, null], ['none', 'none'], ['none', {}]]) {
        describe(`when called with a \`${JSON.stringify(noneTransition)}\` transition`, function() {

          it("doesn't animate and detaches the old element instead", async function() {
            const $old = $fixture('.old').text('old content')
            const $new = $fixture('.new').text('new content')
            up.morph($old, $new, noneTransition, {duration: 1000})

            await wait()

            expect($old).toBeDetached()
            expect($new).toBeAttached()
            expect($new).toHaveOpacity(1.0)
          })

          it('returns a fulfilled promise', async function() {
            const $old = $fixture('.old').text('old content')
            const $new = $fixture('.new').text('new content')
            const promise = up.morph($old, $new, noneTransition, {duration: 1000})

            return await expectAsync(promise).toBeResolved()
          })
        })
      }
    })

    describe('up.transition()', () => {
      it('should have tests')
    })

    describe('up.animation()', () => {
      it('should have tests')
    })
  })
})
