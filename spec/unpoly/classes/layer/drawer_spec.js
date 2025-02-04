describe('up.Layer.Drawer', function() {
  describe('styles', function() {

    it('is as high as the root viewport, regardless of content', function() {
      up.layer.open({ mode: 'drawer', content: '<div style="height: 1px"></div>' })
      expect(up.layer.isOverlay()).toBe(true)

      expect(document.querySelector('up-drawer-box').offsetHeight).toBe(window.innerHeight)
    })

    if (up.specUtil.rootHasReducedWidthFromScrollbar()) {
      it('adds scrollbars to its viewport', function() {
        fixture('div', { style: { height: '10000px' } })

        up.layer.open({ mode: 'drawer', content: '<div style="height: 10000px"></div>' })
        expect(up.layer.isOverlay()).toBe(true)

        expect(document.querySelector('html')).not.toHaveVerticalScrollbar()
        expect(document.querySelector('body')).not.toHaveVerticalScrollbar()
        expect(document.querySelector('up-drawer-viewport')).toHaveVerticalScrollbar()
        expect(document.querySelector('up-drawer-box')).not.toHaveVerticalScrollbar()
        expect(document.querySelector('up-drawer-content')).not.toHaveVerticalScrollbar()
      })
    }

    describe('positioning', function() {

      beforeEach(function() {
        return up.motion.config.enabled = false
      })

      it('hugs the left edge of the screen with { position: "left" }', function() {
        up.layer.open({ mode: 'drawer', content: 'drawer content', position: 'left' })
        expect(up.layer.isOverlay()).toBe(true)

        const boxRect = document.querySelector('up-drawer-box').getBoundingClientRect()
        expect(boxRect.left).toBe(0)
        expect(boxRect.top).toBe(0)
      })

      it('hugs the right edge of the screen with { position: "right" }', function() {
        up.layer.open({ mode: 'drawer', content: 'drawer content', position: 'right' })
        expect(up.layer.isOverlay()).toBe(true)

        const viewport = document.querySelector('up-drawer-viewport')
        const boxRect = document.querySelector('up-drawer-box').getBoundingClientRect()
        expect(boxRect.right).toBeAround(viewport.clientWidth, 1.0)
        expect(boxRect.top).toBe(0)
      })
    })
  })
})
