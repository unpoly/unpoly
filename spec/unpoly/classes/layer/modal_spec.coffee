describe 'up.Layer.Modal', ->

  describe 'styles', ->

    it 'is as high as its content, plus padding', ->
      up.layer.open(mode: 'modal', content: '<div style="height: 300px"></div>')
      expect(up.layer.isOverlay()).toBe(true)

      expect(document.querySelector('up-modal-content').offsetHeight).toBe(300)
      expect(document.querySelector('up-modal-box').offsetHeight).toBeAround(300, 60) # plus padding

    it 'is centered within its viewport', ->
      up.layer.open(mode: 'modal', content: 'modal content')
      expect(up.layer.isOverlay()).toBe(true)

      box = document.querySelector('up-modal-box')
      boxRect = box.getBoundingClientRect()
      viewport = document.querySelector('up-modal-viewport')
      viewportRect = viewport.getBoundingClientRect()

      expect(box.offsetWidth).toBeLessThan(viewport.clientWidth - 100)
      expect(boxRect.left).toBeAround((viewport.clientWidth - box.offsetWidth) * 0.5, 1)

    it 'adds scrollbars to its viewport', ->
      fixture('div', style: { height: '10000px' })

      up.layer.open(mode: 'modal', content: '<div style="height: 10000px"></div>')
      expect(up.layer.isOverlay()).toBe(true)

      expect(document.querySelector('up-modal-viewport').offsetLeft).toBe(0)
      expect(document.querySelector('up-modal-viewport').offsetTop).toBe(0)
      expect(document.querySelector('up-modal-viewport').offsetWidth).toBe(window.innerWidth)
      expect(document.querySelector('up-modal-viewport').offsetHeight).toBe(window.innerHeight)

      expect(document.querySelector('html')).not.toHaveVerticalScrollbar()
      expect(document.querySelector('body')).not.toHaveVerticalScrollbar()
      expect(document.querySelector('up-modal-viewport')).toHaveVerticalScrollbar()
      expect(document.querySelector('up-modal-box')).not.toHaveVerticalScrollbar()
      expect(document.querySelector('up-modal-content')).not.toHaveVerticalScrollbar()
