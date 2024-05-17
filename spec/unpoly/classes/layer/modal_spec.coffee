describe 'up.Layer.Modal', ->

  e = up.element
  u = up.util

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

    if up.specUtil.rootHasReducedWidthFromScrollbar()
      describe 'scrollbars while an overlay is open', ->

        beforeEach ->
          spyOn(up.viewport, 'scrollbarWidth').and.returnValue(25)

        it "replaces the document scrollbar with a new scrollbar on its viewport element", ->
          fixture('div', style: { height: '10000px' })

          expect(up.viewport.root).toHaveVerticalScrollbar()

          up.layer.open(mode: 'modal', content: '<div style="height: 10000px"></div>')
          expect(up.layer.isOverlay()).toBe(true)

          expect(document.querySelector('up-modal-viewport').offsetLeft).toBe(0)
          expect(document.querySelector('up-modal-viewport').offsetTop).toBe(0)
          expect(document.querySelector('up-modal-viewport').offsetWidth).toBe(window.innerWidth)
          expect(document.querySelector('up-modal-viewport').offsetHeight).toBe(window.innerHeight)

          expect(up.viewport.root).not.toHaveVerticalScrollbar()
          expect('up-modal-viewport').toHaveVerticalScrollbar()
          expect('up-modal-box').not.toHaveVerticalScrollbar()
          expect('up-modal-content').not.toHaveVerticalScrollbar()

        it "gives the body additional padding on the right so the hidden scrollbar won't enlarge the client area, causing a layout shift", ->
          unsetBodyStyle = e.setTemporaryStyle(document.body, { paddingRight: '40px' })

          up.layer.open(mode: 'modal', content: 'modal content')
          expect(up.viewport.root).not.toHaveVerticalScrollbar()
          expect(document.body).toHaveComputedStyle({ paddingRight: '65px' })

          up.layer.dismiss()

          await wait()

          unsetBodyStyle()

        it 'does not change elements if viewport root never had a scrollbar', ->
          unsetBodyStyle = e.setTemporaryStyle(document.body, { overflowY: 'hidden', paddingRight: '30px' })
          expect(up.viewport.root).not.toHaveVerticalScrollbar()

          up.layer.open(modal: 'modal', content: '<div style="height: 10000px"></div>')

          await wait()

          expect(up.layer.isOverlay()).toBe(true)
          expect(document.body).toHaveComputedStyle(paddingRight: '30px')
          expect(up.viewport.root).not.toHaveVerticalScrollbar()
          expect('up-modal-viewport').toHaveVerticalScrollbar()

          unsetBodyStyle()

          expect(document.querySelector('up-modal-viewport')).toHaveVerticalScrollbar()

        it 'shifts right-anchored elements to the left', ->
          anchored = fixture('div[up-anchored=right]', style: { position: 'fixed', top: '0px', right: '70px' })
          up.hello(anchored)

          up.layer.open(mode: 'modal', content: 'modal content')
          expect(anchored).toHaveComputedStyle({ right: '95px' })

          up.layer.dismiss()

          await wait()

          expect(anchored).toHaveComputedStyle({ right: '70px' })

        it 'considers [up-fixed=top] elements as right-anchored', ->
          anchored = fixture('div[up-fixed=top]', style: { position: 'fixed', top: '0px', right: '70px' })
          up.hello(anchored)

          up.layer.open(mode: 'modal', content: 'modal content')
          expect(anchored).toHaveComputedStyle({ right: '95px' })

          up.layer.dismiss()

          await wait()

          expect(anchored).toHaveComputedStyle({ right: '70px' })

        it 'consistently shifts and unshifts if multiple overlays are opened and closed concurrently', ->
          up.motion.config.enabled = true

          fixture('div', style: { height: '10000px' })
          expect(up.viewport.root).toHaveVerticalScrollbar()

          openModal = (duration) -> up.layer.open(mode: 'modal', content: '<div style="height: 10000px"></div>', animation: 'fade-in', duration: duration)
          dismissModal = (duration) -> up.layer.dismiss(null, animation: 'fade-out', duration: duration)

          openModal(300)
          expect(up.layer.count).toBe(2)
          expect(up.viewport.root).not.toHaveVerticalScrollbar()

          openModal(0)
          expect(up.layer.count).toBe(3)
          expect(up.viewport.root).not.toHaveVerticalScrollbar()

          openModal(100)
          expect(up.layer.count).toBe(4)
          expect(up.viewport.root).not.toHaveVerticalScrollbar()

          await wait(10)

          expect(up.layer.count).toBe(4)
          expect(up.viewport.root).not.toHaveVerticalScrollbar()

          await wait(150)
          expect(up.layer.count).toBe(4)
          expect(up.viewport.root).not.toHaveVerticalScrollbar()

          dismissModal(300)
          await wait()

          expect(up.layer.count).toBe(3)
          expect(up.viewport.root).not.toHaveVerticalScrollbar()

          await wait(10)

          dismissModal(0)
          expect(up.layer.count).toBe(2)
          expect(up.viewport.root).not.toHaveVerticalScrollbar()

          dismissModal(100)

          expect(up.layer.count).toBe(1)
          expect(up.viewport.root).not.toHaveVerticalScrollbar()

          await wait(300)

          expect(up.layer.count).toBe(1)
          expect(up.viewport.root).toHaveVerticalScrollbar()

        it "shifts right-anchored elements only once if multiple nested overlays are opened", ->
          anchored = fixture('div[up-fixed=top]', style: { position: 'fixed', top: '0px', right: '70px' })
          up.hello(anchored)

          up.layer.open(mode: 'modal', content: 'modal content')
          expect(up.layer.count).toBe(2)
          expect(anchored).toHaveComputedStyle({ right: '95px' })

          up.layer.open(mode: 'modal', content: 'modal content')
          expect(up.layer.count).toBe(3)
          expect(anchored).toHaveComputedStyle({ right: '95px' })

          up.layer.dismiss()

          await wait()

          expect(up.layer.count).toBe(2)
          expect(anchored).toHaveComputedStyle({ right: '95px' })

          up.layer.dismiss()

          await wait()

          expect(up.layer.count).toBe(1)
          expect(anchored).toHaveComputedStyle({ right: '70px' })

        it 'shifts dynamically inserted right-anchored elements to the left', ->
          up.layer.open(mode: 'modal', content: 'modal content')

          anchored = fixture('div[up-anchored=right]', style: { position: 'fixed', top: '0px', right: '70px' })
          up.hello(anchored)
          expect(anchored).toHaveComputedStyle({ right: '95px' })

          up.layer.dismiss()

          await wait()

          expect(anchored).toHaveComputedStyle({ right: '70px' })
