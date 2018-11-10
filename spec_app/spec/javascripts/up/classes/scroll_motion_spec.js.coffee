describe 'up.ScrollMotion', ->

  beforeEach ->
    @$viewport = affix('.viewport').css
      height: '100px'
      overflowY: 'scroll'

    @$content = @$viewport.affix('.content').css
      height: '10000px'

  describe 'constructor', ->

    it 'does not start scrolling', ->
      motion = new up.ScrollMotion(@$viewport[0], 530)
      expect(@$viewport.scrollTop()).toEqual(0)

  describe '#start()', ->

    describe '(without { behavior } option)', ->

      it 'abruptly scrolls the given element to the given y-position', ->
        motion = new up.ScrollMotion(@$viewport[0], 530)

        motion.start()

        expect(@$viewport.scrollTop()).toEqual(530)

    describe '(with { behavior: "scroll" } option)', ->

      describeCapability 'canSmoothScroll', ->

        it 'animates the scrolling to the given y-position', asyncSpec (next) ->

        motion = new up.ScrollMotion(@$viewport[0], 2050, { behavior: 'smooth' })

        scrollDone = motion.start()

        next.after 100, =>
          expect(@$viewport.scrollTop()).toBeAround(1, 500)

          next.await(scrollDone)

        next =>
          expect(@$viewport.scrollTop())




      describeFallback 'canSmoothScroll', ->

        describeCapability 'canAnimationFrame', ->

          it 'animates the scrolling to the given y-position'

        describeFallback 'canAnimationFrame', ->

          it 'abruptly scrolls the given element to the given y-position'

  describe '#finish()', ->

    describeCapability 'canSmoothScroll', ->

      it 'abruptly finishes the scrolling animation by setting the target y-position'

