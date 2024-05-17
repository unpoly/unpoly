describe 'up.Layer.Drawer', ->

  describe 'styles', ->

    it 'is as high as the root viewport, regardless of content', ->
      up.layer.open(mode: 'drawer', content: '<div style="height: 1px"></div>')
      expect(up.layer.isOverlay()).toBe(true)

      expect(document.querySelector('up-drawer-box').offsetHeight).toBe(window.innerHeight)

    if up.specUtil.rootHasReducedWidthFromScrollbar()
      it 'adds scrollbars to its viewport', ->
        fixture('div', style: { height: '10000px' })

        up.layer.open(mode: 'drawer', content: '<div style="height: 10000px"></div>')
        expect(up.layer.isOverlay()).toBe(true)

        expect(document.querySelector('html')).not.toHaveVerticalScrollbar()
        expect(document.querySelector('body')).not.toHaveVerticalScrollbar()
        expect(document.querySelector('up-drawer-viewport')).toHaveVerticalScrollbar()
        expect(document.querySelector('up-drawer-box')).not.toHaveVerticalScrollbar()
        expect(document.querySelector('up-drawer-content')).not.toHaveVerticalScrollbar()

    describe 'positioning', ->

      beforeEach ->
        up.motion.config.enabled = false

      it 'hugs the left edge of the screen with { position: "left" }', ->
        up.layer.open(mode: 'drawer', content: 'drawer content', position: 'left')
        expect(up.layer.isOverlay()).toBe(true)

        boxRect = document.querySelector('up-drawer-box').getBoundingClientRect()
        expect(boxRect.left).toBe(0)
        expect(boxRect.top).toBe(0)

      it 'hugs the right edge of the screen with { position: "right" }', ->
        up.layer.open(mode: 'drawer', content: 'drawer content', position: 'right')
        expect(up.layer.isOverlay()).toBe(true)

        viewport = document.querySelector('up-drawer-viewport')
        boxRect = document.querySelector('up-drawer-box').getBoundingClientRect()
        expect(boxRect.right).toBe(viewport.clientWidth)
        expect(boxRect.top).toBe(0)
