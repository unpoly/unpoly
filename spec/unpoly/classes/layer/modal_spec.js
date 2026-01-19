describe('up.Layer.Modal', function() {

  const e = up.element
  const u = up.util

  describe('styles', function() {

    it('is as high as its content, plus padding', function() {
      up.layer.open({ mode: 'modal', content: '<div style="height: 300px"></div>' })
      expect(up.layer.isOverlay()).toBe(true)

      expect(document.querySelector('up-modal-content').offsetHeight).toBe(300)
      expect(document.querySelector('up-modal-box').offsetHeight).toBeAround(300, 60)
    }) // plus padding

    it('is centered within its viewport', function() {
      up.layer.open({ mode: 'modal', content: 'modal content' })
      expect(up.layer.isOverlay()).toBe(true)

      const box = document.querySelector('up-modal-box')
      const boxRect = box.getBoundingClientRect()
      const viewport = document.querySelector('up-modal-viewport')
      const viewportRect = viewport.getBoundingClientRect()

      expect(box.offsetWidth).toBeLessThan(viewport.clientWidth - 100)
      expect(boxRect.left).toBeAround((viewport.clientWidth - box.offsetWidth) * 0.5, 1)
    })

    describe('scrollbars while an overlay is open', function() {

      beforeEach(function() {
        up.motion.config.enabled = false

        if (!up.specUtil.rootHasReducedWidthFromScrollbar()) {
          // Delay skipping until beforeEach() so the stylesheet that controls the scroll bar is loaded
          pending("Skipping test on browser without visible scroll bars")
        }

        // Unset any overlay styles from the test runner.
        fixtureStyle(`
          body, html {
            overflow: unset;
          }
        `)
      })

      it("replaces a scrollbar on <body> with a new scrollbar on its viewport element", async function() {
        fixtureStyle(`
          body {
            overflow-y: scroll;
          }
        `)

        fixture('div', { style: { height: '10000px', 'background-color': 'yellow' } })

        expect(document.body).toHaveVerticalScrollbar()

        up.layer.open({ mode: 'modal', content: '<div style="height: 10000px"></div>' })
        expect(up.layer.isOverlay()).toBe(true)

        expect(document.querySelector('up-modal-viewport').offsetLeft).toBe(0)
        expect(document.querySelector('up-modal-viewport').offsetTop).toBe(0)
        expect(document.querySelector('up-modal-viewport').offsetWidth).toBe(window.innerWidth)
        expect(document.querySelector('up-modal-viewport').offsetHeight).toBe(window.innerHeight)

        expect(document.body).not.toHaveVerticalScrollbar()

        expect('up-modal-viewport').toHaveVerticalScrollbar()
        expect('up-modal-box').not.toHaveVerticalScrollbar()
        expect('up-modal-content').not.toHaveVerticalScrollbar()

        await up.layer.dismiss()

        expect(document.body).toHaveVerticalScrollbar()
      })

      it("replaces a scrollbar on <html> with a new scrollbar on its viewport element", async function() {
        fixtureStyle(`
          html {
            overflow-y: scroll;
          }
        `)

        fixture('div', { style: { height: '10000px' } })

        expect(document.documentElement).toHaveVerticalScrollbar()

        up.layer.open({ mode: 'modal', content: '<div style="height: 10000px"></div>' })
        expect(up.layer.isOverlay()).toBe(true)

        expect(document.querySelector('up-modal-viewport').offsetLeft).toBe(0)
        expect(document.querySelector('up-modal-viewport').offsetTop).toBe(0)

        expect(document.querySelector('up-modal-viewport').offsetWidth).toBe(window.innerWidth)
        expect(document.querySelector('up-modal-viewport').offsetHeight).toBe(window.innerHeight)

        expect(document.documentElement).not.toHaveVerticalScrollbar()
        expect('up-modal-viewport').toHaveVerticalScrollbar()
        expect('up-modal-box').not.toHaveVerticalScrollbar()
        expect('up-modal-content').not.toHaveVerticalScrollbar()

        await up.layer.dismiss()

        expect(document.documentElement).toHaveVerticalScrollbar()
      })

      // it("still hides the document scrollbar after <body> was swapped and the overlay was re-attached", async function() {
      //   fixtureStyle(`
      //     html {
      //       overflow-y: scroll;
      //     }
      //   `)
      //
      //   fixture('div', { style: { height: '10000px' } })
      //
      //   expect(document).toHaveVerticalScrollbar()
      //
      //   up.layer.open({ mode: 'modal', content: '<div style="height: 10000px"></div>' })
      //   expect(document).not.toHaveVerticalScrollbar()
      //   expect('up-modal-viewport').toHaveVerticalScrollbar()
      //
      //   await up.render({ target: 'body', document: '<body><div style="height: 10000px">new body</div></body>', peel: false, layer: 'root' })
      //
      //   expect(document.body.textContent).toEqual(jasmine.stringContaining('new body'))
      //   expect(document).not.toHaveVerticalScrollbar()
      //
      //   expect('up-modal').toBeAttached()
      //   expect('up-modal-viewport').toHaveVerticalScrollbar()
      //
      //   await up.layer.dismiss()
      //
      //   expect(up.layer.mode).toBe('root')
      //   expect('up-modal').not.toBeAttached()
      //   expect(document).not.toHaveVerticalScrollbar()
      // })

      it('allows sticky elements on the root layer to keep their "stuck" positions', async function() {
        let [_before, sticky, _after] = htmlFixtureList(`
          <div id="before" style="height: 10000px"></div>
          <div id="sticky" style="position: sticky; top: 100px; background-color: orange">sticky</div>
          <div id="after" style="height: 10000px"></div>
        `)

        // Check that the sticky element is stuck to its positioning parent
        document.scrollingElement.scrollTop = 16000
        expect(sticky.getBoundingClientRect().top).toBe(100)

        document.scrollingElement.scrollTop = 16050
        expect(sticky.getBoundingClientRect().top).toBe(100)

        expect(document).toHaveVerticalScrollbar()

        up.layer.open({ mode: 'modal', content: '<div style="height: 10000px"></div>' })
        expect(up.layer.isOverlay()).toBe(true)

        await wait(100)

        expect(document).not.toHaveVerticalScrollbar()
        expect('up-modal-viewport').toHaveVerticalScrollbar()

        // Sticky element is still stuck
        expect(sticky.getBoundingClientRect().top).toBe(100)
      })

      it("replaces a scrollbar on <html> with default overflow (bugfix for Firefox)", async function() {
        fixture('div', { style: { height: '10000px' } })

        expect(document.documentElement).toHaveVerticalScrollbar()

        up.layer.open({ mode: 'modal', content: '<div style="height: 10000px"></div>' })
        expect(up.layer.isOverlay()).toBe(true)

        await wait(100)

        expect(document.querySelector('up-modal-viewport').offsetLeft).toBe(0)
        expect(document.querySelector('up-modal-viewport').offsetTop).toBe(0)

        expect(document.querySelector('up-modal-viewport').offsetWidth).toBe(window.innerWidth)
        expect(document.querySelector('up-modal-viewport').offsetHeight).toBe(window.innerHeight)

        expect(document.documentElement).not.toHaveVerticalScrollbar()
        expect('up-modal-viewport').toHaveVerticalScrollbar()
        expect('up-modal-box').not.toHaveVerticalScrollbar()
        expect('up-modal-content').not.toHaveVerticalScrollbar()

        await up.layer.dismiss()

        expect(document.documentElement).toHaveVerticalScrollbar()
      })

      it("gives the body additional padding on the right so the hidden scrollbar won't enlarge the client area, causing a layout shift", async function() {
        spyOn(up.viewport, 'rootScrollbarWidth').and.returnValue(25)
        const unsetBodyStyle = e.setStyleTemp(document.body, { 'padding-right': '40px' })

        up.layer.open({ mode: 'modal', content: 'modal content' })
        expect(document).not.toHaveVerticalScrollbar()
        expect(document.body).toHaveComputedStyle({ 'padding-right': '65px' })

        up.layer.dismiss()

        await wait()

        return unsetBodyStyle()
      })

      it('does not change the body if the viewport root never had a scrollbar', async function() {
        const unsetScrollingElementStyle = e.setStyleTemp(document.scrollingElement, { 'overflow-y': 'hidden' })
        const unsetBodyStyle = e.setStyleTemp(document.body, { 'padding-right': '30px' })
        expect(document).not.toHaveVerticalScrollbar()

        up.layer.open({ modal: 'modal', content: '<div style="height: 10000px"></div>' })

        await wait()

        expect(up.layer.isOverlay()).toBe(true)
        expect(document.body).toHaveComputedStyle({ 'padding-right': '30px' })
        expect(document).not.toHaveVerticalScrollbar()
        expect('up-modal-viewport').toHaveVerticalScrollbar()

        unsetBodyStyle()
        unsetScrollingElementStyle()

        expect(document.querySelector('up-modal-viewport')).toHaveVerticalScrollbar()
      })

      it('shifts right-anchored elements to the left', async function() {
        spyOn(up.viewport, 'rootScrollbarWidth').and.returnValue(25)
        const anchored = fixture('div[up-anchored=right]', { style: { position: 'fixed', top: '0px', right: '70px' } })
        up.hello(anchored)

        up.layer.open({ mode: 'modal', content: 'modal content' })
        expect(anchored).toHaveComputedStyle({ right: '95px' })

        up.layer.dismiss()

        await wait()

        expect(anchored).toHaveComputedStyle({ right: '70px' })
      })

      it('adjusts the { right } property of multiple right-anchored elements with varying { right } values', async function() {
        spyOn(up.viewport, 'rootScrollbarWidth').and.returnValue(20)
        const anchored1 = fixture('#one[up-anchored=right]', {
          style: {
            position: 'fixed',
            top: '0px',
            right: '33px'
          }
        })
        up.hello(anchored1)
        const anchored2 = fixture('#two[up-anchored=right]', {
          style: {
            position: 'fixed',
            top: '0px',
            right: '44px'
          }
        })
        up.hello(anchored2)

        up.layer.open({ mode: 'modal', content: 'modal content' })
        expect(anchored1).toHaveComputedStyle({ right: '53px' })
        expect(anchored2).toHaveComputedStyle({ right: '64px' })

        up.layer.dismiss()

        await wait()

        expect(anchored1).toHaveComputedStyle({ right: '33px' })
        expect(anchored2).toHaveComputedStyle({ right: '44px' })
      })

      it('considers [up-fixed=top] elements as right-anchored', async function() {
        spyOn(up.viewport, 'rootScrollbarWidth').and.returnValue(25)
        const anchored = fixture('div[up-fixed=top]', { style: { position: 'fixed', top: '0px', right: '70px' } })
        up.hello(anchored)

        up.layer.open({ mode: 'modal', content: 'modal content' })
        expect(anchored).toHaveComputedStyle({ right: '95px' })

        up.layer.dismiss()

        await wait()

        expect(anchored).toHaveComputedStyle({ right: '70px' })
      })

      it('consistently shifts and unshifts if multiple overlays are opened and closed concurrently', async function() {
        spyOn(up.viewport, 'rootScrollbarWidth').and.returnValue(25)
        up.motion.config.enabled = true

        fixture('div', { style: { height: '10000px' } })
        expect(document).toHaveVerticalScrollbar()

        const openModal = (duration) => up.layer.open({
          mode: 'modal',
          content: '<div style="height: 10000px"></div>',
          animation: 'fade-in',
          duration
        })
        const dismissModal = (duration) => up.layer.dismiss(null, { animation: 'fade-out', duration })

        openModal(300)
        expect(up.layer.count).toBe(2)
        expect(document).not.toHaveVerticalScrollbar()

        openModal(0)
        expect(up.layer.count).toBe(3)
        expect(document).not.toHaveVerticalScrollbar()

        openModal(100)
        expect(up.layer.count).toBe(4)
        expect(document).not.toHaveVerticalScrollbar()

        await wait(10)

        expect(up.layer.count).toBe(4)
        expect(document).not.toHaveVerticalScrollbar()

        await wait(150)
        expect(up.layer.count).toBe(4)
        expect(document).not.toHaveVerticalScrollbar()

        dismissModal(300)
        await wait()

        expect(up.layer.count).toBe(3)
        expect(document).not.toHaveVerticalScrollbar()

        await wait(10)

        dismissModal(0)
        expect(up.layer.count).toBe(2)
        expect(document).not.toHaveVerticalScrollbar()

        dismissModal(100)

        expect(up.layer.count).toBe(1)
        expect(document).toHaveVerticalScrollbar()

        await wait(300)

        expect(up.layer.count).toBe(1)
        expect(document).toHaveVerticalScrollbar()
      })

      it("shifts right-anchored elements only once if multiple nested overlays are opened", async function() {
        spyOn(up.viewport, 'rootScrollbarWidth').and.returnValue(25)
        const anchored = fixture('div[up-fixed=top]', { style: { position: 'fixed', top: '0px', right: '70px' } })
        up.hello(anchored)

        up.layer.open({ mode: 'modal', content: 'modal content' })
        expect(up.layer.count).toBe(2)
        expect(anchored).toHaveComputedStyle({ right: '95px' })

        up.layer.open({ mode: 'modal', content: 'modal content' })
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
      })

      it('shifts dynamically inserted right-anchored elements to the left', async function() {
        spyOn(up.viewport, 'rootScrollbarWidth').and.returnValue(25)
        up.layer.open({ mode: 'modal', content: 'modal content' })

        const anchored = fixture('div[up-anchored=right]', { style: { position: 'fixed', top: '0px', right: '70px' } })
        up.hello(anchored)
        expect(anchored).toHaveComputedStyle({ right: '95px' })

        up.layer.dismiss()

        await wait()

        expect(anchored).toHaveComputedStyle({ right: '70px' })
      })

      it('keeps the scroll position of the background layer', async function() {
        fixture('#high-element', { style: { 'background-color': 'yellow', 'height': '30000px' } })
        up.viewport.root.scrollTop = 4567

        expect(up.viewport.root).toHaveVerticalScrollbar()
        expect(up.viewport.root.scrollTop).toBe(4567)

        up.layer.open({ mode: 'modal', content: 'overlay content' })
        await wait()

        expect(up.viewport.root).not.toHaveVerticalScrollbar()
        expect(up.viewport.root.scrollTop).toBe(4567)
      })

      it('allows sticky elements in the background to keep their "stuck" positions', async function() {
        fixture('#high-element', {
          style: {
            'background-color': 'yellow',
            'height': '30000px'
          }
        })
        const sticky = up.element.createFromSelector('#sticky-element', {
          style: {
            'background-color': 'green',
            'height': '100px',
            'width': '200px',
            'position': 'sticky',
            'top': '0',
            'left': '0'
          }
        })
        document.body.prepend(sticky)
        registerFixture(sticky)

        up.viewport.root.scrollTop = 4567

        expect(up.viewport.root).toHaveVerticalScrollbar()
        expect(up.viewport.root.scrollTop).toBe(4567)
        expect(sticky.getBoundingClientRect()).toEqual(jasmine.objectContaining({
          left: 0,
          top: 0,
          width: 200,
          height: 100,
        }))

        up.layer.open({ mode: 'modal', content: 'overlay content' })
        await wait()

        expect(up.viewport.root).not.toHaveVerticalScrollbar()
        expect(up.viewport.root.scrollTop).toBe(4567)
        expect(sticky.getBoundingClientRect()).toEqual(jasmine.objectContaining({
          left: 0,
          top: 0,
          width: 200,
          height: 100,
        }))
      })

      it('does not leave inline custom properties after the overlay was closed', async function() {
        spyOn(up.viewport, 'rootScrollbarWidth').and.returnValue(25)
        const anchored = fixture('div[up-anchored=right]', { style: { position: 'fixed', top: '0px', right: '70px' } })
        up.hello(anchored)

        up.layer.open({ mode: 'modal', content: 'modal content' })

        await wait()

        up.layer.dismiss()

        await wait()

        expect(document.documentElement.getAttribute('style')).not.toContain('--up')
        expect(document.body.getAttribute('style')).not.toContain('--up-')
        expect(anchored.getAttribute('style')).not.toContain('--up-')
      })
    })
  })
})
