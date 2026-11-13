const u = up.util
const e = up.element

describe('OverlayWithViewport', function() {
  describe('preservation of overlays during fragment changes', function() {

    it('keeps the overlay in the DOM', async function() {
      await up.layer.open({ content: 'foo', animation: false })

      expect(up.layer.count).toBe(2)

      // Need to pass { peel: false } since peeling would close the layer
      up.render('body', { document: '<body>new body</body>', layer: 'root', peel: false })

      await wait()

      expect(up.layer.count).toBe(2)
      expect(up.layer.stack[1].element).toBeAttached()
      expect(up.layer.stack[1].element.parentElement).toBe(document.body)
    })

    it('does not call destructors', async function() {
      const destructor = jasmine.createSpy('destructor for <overlay-child>')
      up.compiler('overlay-child', (element) => destructor)

      await up.layer.open({ content: '<overlay-child></overlay-child>', animation: false })

      await wait()

      expect(up.layer.count).toBe(2)

      // Need to pass { peel: false } since peeling would close the layer
      up.render('body', { document: '<body>new body</body>', layer: 'root', peel: false })

      await wait()

      expect(up.layer.count).toBe(2)
      expect(destructor).not.toHaveBeenCalled()

      // Test that destructors *are* called when we close the overlay.
      up.layer.dismiss(null, { animation: false })

      await wait()

      expect(up.layer.count).toBe(1)
      expect(destructor).toHaveBeenCalled()
    })
  })
})

describe('ModalLayer', function() {

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
        const rootScrollbarWidthSpy = up.internal.rootScrollbarWidth.mock().and.returnValue(25)
        const unsetBodyStyle = up.internal.setStyleTemp(document.body, { 'padding-right': '40px' })

        up.layer.open({ mode: 'modal', content: 'modal content' })
        expect(document).not.toHaveVerticalScrollbar()
        expect(document.body).toHaveComputedStyle({ 'padding-right': '65px' })

        up.layer.dismiss()

        await wait()

        return unsetBodyStyle()
      })

      it('does not change the body if the viewport root never had a scrollbar', async function() {
        const unsetScrollingElementStyle = up.internal.setStyleTemp(document.scrollingElement, { 'overflow-y': 'hidden' })
        const unsetBodyStyle = up.internal.setStyleTemp(document.body, { 'padding-right': '30px' })
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
        const rootScrollbarWidthSpy = up.internal.rootScrollbarWidth.mock().and.returnValue(25)
        const anchored = fixture('div[up-anchored=right]', { style: { position: 'fixed', top: '0px', right: '70px' } })
        up.hello(anchored)

        up.layer.open({ mode: 'modal', content: 'modal content' })
        expect(anchored).toHaveComputedStyle({ right: '95px' })

        up.layer.dismiss()

        await wait()

        expect(anchored).toHaveComputedStyle({ right: '70px' })
      })

      it('adjusts the { right } property of multiple right-anchored elements with varying { right } values', async function() {
        const rootScrollbarWidthSpy = up.internal.rootScrollbarWidth.mock().and.returnValue(20)
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
        const rootScrollbarWidthSpy = up.internal.rootScrollbarWidth.mock().and.returnValue(25)
        const anchored = fixture('div[up-fixed=top]', { style: { position: 'fixed', top: '0px', right: '70px' } })
        up.hello(anchored)

        up.layer.open({ mode: 'modal', content: 'modal content' })
        expect(anchored).toHaveComputedStyle({ right: '95px' })

        up.layer.dismiss()

        await wait()

        expect(anchored).toHaveComputedStyle({ right: '70px' })
      })

      it('consistently shifts and unshifts if multiple overlays are opened and closed concurrently', async function() {
        const rootScrollbarWidthSpy = up.internal.rootScrollbarWidth.mock().and.returnValue(25)
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

        // Layer count reduces immediately
        expect(up.layer.count).toBe(1)

        // Only when the viewport element has been removed (after close animation), the original scrollbar is restored.
        await wait(150)

        expect(document).toHaveVerticalScrollbar()

        await wait(300)

        expect(up.layer.count).toBe(1)
        expect(document).toHaveVerticalScrollbar()
      })

      it("shifts right-anchored elements only once if multiple nested overlays are opened", async function() {
        const rootScrollbarWidthSpy = up.internal.rootScrollbarWidth.mock().and.returnValue(25)
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
        const rootScrollbarWidthSpy = up.internal.rootScrollbarWidth.mock().and.returnValue(25)
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
        const rootScrollbarWidthSpy = up.internal.rootScrollbarWidth.mock().and.returnValue(25)
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

describe('DrawerLayer', function() {
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

describe('OverlayWithTether', function() {
  describe('preservation of overlays during fragment changes', function() {

    it('dismisses the overlay when its viewport has been removed', async function() {
      const viewport = fixture('.viewport', {
        style: {
          'width': '300px',
          'height': '200px',
          'overflow-y': 'scroll'
        }
      })
      const opener = e.affix(viewport, '.opener')
      up.layer.open({ origin: opener, mode: 'popup', animation: false })

      const onDismissed = jasmine.createSpy('onDismissed spy')
      up.on('up:layer:dismissed', onDismissed)
      await wait()

      expect(up.layer.count).toBe(2)

      up.destroy(viewport)
      await wait()

      expect(up.layer.count).toBe(1)
      expect(onDismissed).toHaveBeenCalled()
    })

    it('dismisses the overlay when its anchor has been removed', async function() {
      const opener = fixture('.opener')
      up.layer.open({ origin: opener, mode: 'popup', animation: false })

      const onDismissed = jasmine.createSpy('onDismissed spy')
      up.on('up:layer:dismissed', onDismissed)

      expect(up.layer.count).toBe(2)

      up.destroy(opener)
      await wait()

      expect(up.layer.count).toBe(1)
      expect(onDismissed).toHaveBeenCalled()
    })

    it('dismisses the overlay when its anchor has been removed, even if an up:layer:dismiss listener prevents it', async function() {
      const opener = fixture('.opener')
      up.layer.open({ origin: opener, mode: 'popup', animation: false })
      up.on('up:layer:dismiss', (event) => event.preventDefault())

      expect(up.layer.count).toBe(2)

      up.destroy(opener)
      await wait()

      expect(up.layer.count).toBe(1)
    })
  })
})

describe('PopupLayer', function() {

  it('has no dismiss button by default', async function() {
    const [opener] = htmlFixtureList('<a href="#">opener</a>')
    await up.layer.open({ mode: 'popup', origin: opener, content: 'popup content' })

    expect(up.layer.mode).toBe('popup')
    expect(up.layer.current.element).not.toHaveSelector('up-popup-dismiss')
  })

  it('can be dismissed by pressing Escape by default', async function() {
    const [opener] = htmlFixtureList('<a href="#">opener</a>')
    await up.layer.open({ mode: 'popup', origin: opener, content: 'popup content' })
    expect(up.layer.mode).toBe('popup')

    Trigger.escapeSequence(document.body)
    await wait()

    expect(up.layer.isRoot()).toBe(true)
  })

  it('can be dismissed by clicking outside by default', async function() {
    const [opener, outside] = htmlFixtureList(`
      <a href="#">opener</a>
      <div class="outside">outside</div>
    `)
    await up.layer.open({ mode: 'popup', origin: opener, content: 'popup content' })
    expect(up.layer.mode).toBe('popup')

    Trigger.clickSequence(outside)
    await wait()

    expect(up.layer.isRoot()).toBe(true)
  })

  it('does not trap focus by default', async function() {
    up.specUtil.assertTabFocused()
    const [opener, rootInput] = htmlFixtureList(`
      <a href="#">opener</a>
      <input type="text" name="email">
    `)
    await up.layer.open({ mode: 'popup', origin: opener, content: 'popup content' })
    expect(up.layer.current).toBeFocused()

    rootInput.focus()
    await wait()

    expect(up.layer.mode).toBe('popup')
    expect(rootInput).toBeFocused()
  })

  describe('positioning', function() {

    const setPopupMargin = function(margins) {
      const styleElement = fixture('style[nonce="specs-nonce"]')
      const { sheet } = styleElement
      for (let key in margins) {
        let value = margins[key]
        sheet.insertRule(`up-popup { margin-${key}: ${value}px }`, 0)
      }
    }

    const openPopup = function(popupOptions = {}) {
      const origin = fixture('.origin', {
        style: {
          'position': 'absolute',
          'left': '30px',
          'width': '50px',
          'top': '70px',
          'height': '20px',
          'background-color': 'red'
        }
      })

      popupOptions = up.internal.newOptions(popupOptions, { mode: 'popup', origin, content: 'popup content' })
      up.layer.open(popupOptions)

      const popup = up.layer.current
      expect(popup.isOverlay()).toBe(true)

      const popupRect = popup.element.getBoundingClientRect()
      const originRect = origin.getBoundingClientRect()

      return { origin, popup, popupRect, originRect }
    }

    it('repositions when the window is resized', async function() {
      const { origin, popup } = openPopup()

      origin.style.left = '85px'
      expect(popup.element.style.left).not.toBe(origin.style.left)

      up.emit(window, 'resize')
      await wait(50)

      expect(popup.element.style.left).toBe(origin.style.left)
    })

    it('repositions only once when the window is resized multiple times within a task', async function() {
      openPopup()
      const syncSpy = spyOn(up.internal.Tether.prototype, 'sync').and.callThrough()

      up.emit(window, 'resize')
      up.emit(window, 'resize')
      up.emit(window, 'resize')
      await wait()

      expect(syncSpy.calls.count()).toBe(1)
    })

    describe('with { position: "bottom", align: "left" }', function() {

      it('is positioned below the origin and grows from the left origin edge to the right', function() {
        const { popupRect, originRect } = openPopup({ position: 'bottom', align: 'left' })

        expect(popupRect.left).toBe(originRect.left)
        expect(popupRect.top).toBe(originRect.bottom)
      })

      it("is shifted by the popup's top and left margins", function() {
        setPopupMargin({ top: 10, left: 20 })
        const { popupRect, originRect } = openPopup({ position: 'bottom', align: 'left' })

        expect(popupRect.left).toBe(originRect.left + 20)
        expect(popupRect.top).toBe(originRect.bottom + 10)
      })
    })

    describe('with { position: "bottom", align: "right" }', function() {

      it('is positioned below the origin and grows from the right origin edge to the left', function() {
        const { popupRect, originRect } = openPopup({ position: 'bottom', align: 'right' })

        expect(popupRect.left).toBe((originRect.left + originRect.width) - popupRect.width)
        expect(popupRect.top).toBe(originRect.bottom)
      })

      it("is shifted by the popup's top and right margins", function() {
        setPopupMargin({ top: 10, right: 20 })
        const { popupRect, originRect } = openPopup({ position: 'bottom', align: 'right' })

        expect(popupRect.left).toBe((originRect.left + originRect.width) - popupRect.width - 20)
        expect(popupRect.top).toBe(originRect.bottom + 10)
      })

      it('left-aligns text inside the popup (bugfix)', function() {
        const { popup } = openPopup({ position: 'bottom', align: 'right' })

        expect(getComputedStyle(popup.element).textAlign).toBe('left')
      })
    })

    describe('with { position: "bottom", align: "center"}', function() {
      it('is positioned below the origin and grows equally to the left and right', function() {
        const { popupRect, originRect } = openPopup({ position: 'bottom', align: 'center' })

        expect(popupRect.left).toBe(originRect.left + (0.5 * (originRect.width - popupRect.width)))
        expect(popupRect.top).toBe(originRect.bottom)
      })
    })

    describe('with { position: "top", align: "left" }', function() {

      it('is positioned above the origin and grows from the left origin edge to the right', function() {
        const { popupRect, originRect } = openPopup({ position: 'top', align: 'left' })

        expect(popupRect.left).toBe(originRect.left)
        expect(popupRect.bottom).toBe(originRect.top)
      })

      it("is shifted by the popup's bottom and left margins", function() {
        setPopupMargin({ bottom: 10, left: 20 })
        const { popupRect, originRect } = openPopup({ position: 'top', align: 'left' })

        expect(popupRect.left).toBe(originRect.left + 20)
        expect(popupRect.bottom).toBe(originRect.top - 10)
      })
    })

    describe('with { position: "top", align: "right" }', function() {

      it('is positioned above the origin and grows from the right origin edge to the left', function() {
        const { popupRect, originRect } = openPopup({ position: 'top', align: 'right' })

        expect(popupRect.left).toBe((originRect.left + originRect.width) - popupRect.width)
        expect(popupRect.bottom).toBe(originRect.top)
      })

      it("is shifted by the popup's bottom and right margins", function() {
        setPopupMargin({ bottom: 10, right: 20 })
        const { popupRect, originRect } = openPopup({ position: 'top', align: 'right' })

        expect(popupRect.left).toBe((originRect.left + originRect.width) - popupRect.width - 20)
        expect(popupRect.bottom).toBe(originRect.top - 10)
      })
    })

    describe('with { position: "bottom", align: "center"}', function() {
      it('is positioned below the origin and grows equally to the left and right', function() {
        const { popupRect, originRect } = openPopup({ position: 'top', align: 'center' })

        expect(popupRect.left).toBe(originRect.left + (0.5 * (originRect.width - popupRect.width)))
        expect(popupRect.bottom).toBe(originRect.top)
      })
    })


    describe('with { position: "right", align: "top" }', function() {

      it('is positioned to the right of the origin and grows from the top origin edge to the bottom', function() {
        const { popupRect, originRect } = openPopup({ position: 'right', align: 'top' })

        expect(popupRect.left).toBe(originRect.right)
        expect(popupRect.top).toBe(originRect.top)
      })

      it("is shifted by the popup's top and left margins", function() {
        setPopupMargin({ top: 10, left: 20 })
        const { popupRect, originRect } = openPopup({ position: 'right', align: 'top' })

        expect(popupRect.left).toBe(originRect.right + 20)
        expect(popupRect.top).toBe(originRect.top + 10)
      })
    })

    describe('with { position: "right", align: "bottom" }', function() {

      it('is positioned to the right of the origin and grows from the bottom origin edge to the top', function() {
        const { popupRect, originRect } = openPopup({ position: 'right', align: 'bottom' })

        expect(popupRect.left).toBe(originRect.right)
        expect(popupRect.bottom).toBe(originRect.bottom)
      })

      it("is shifted by the popup's bottom and left margins", function() {
        setPopupMargin({ bottom: 10, left: 20 })
        const { popupRect, originRect } = openPopup({ position: 'right', align: 'bottom' })

        expect(popupRect.left).toBe(originRect.right + 20)
        expect(popupRect.bottom).toBe(originRect.bottom - 10)
      })
    })

    describe('with { position: "right", align: "center"}', function() {
      it('is positioned to the right of the origin and grows equally to the top and bottom', function() {
        const { popupRect, originRect } = openPopup({ position: 'right', align: 'center' })

        expect(popupRect.left).toBe(originRect.right)
        expect(popupRect.top).toBe(originRect.top + (0.5 * (originRect.height - popupRect.height)))
      })
    })


    describe('with { position: "left", align: "top" }', function() {

      it('is positioned to the left of the origin and grows from the top origin edge to the bottom', function() {
        const { popupRect, originRect } = openPopup({ position: 'left', align: 'top' })

        expect(popupRect.right).toBe(originRect.left)
        expect(popupRect.top).toBe(originRect.top)
      })

      it("is shifted by the popup's top and right margins", function() {
        setPopupMargin({ top: 10, right: 20 })
        const { popupRect, originRect } = openPopup({ position: 'left', align: 'top' })

        expect(popupRect.right).toBe(originRect.left - 20)
        expect(popupRect.top).toBe(originRect.top + 10)
      })
    })

    describe('with { position: "left", align: "bottom" }', function() {

      it('is positioned to the left of the origin and grows from the bottom origin edge to the top', function() {
        const { popupRect, originRect } = openPopup({ position: 'left', align: 'bottom' })

        expect(popupRect.right).toBe(originRect.left)
        expect(popupRect.bottom).toBe(originRect.bottom)
      })

      it("is shifted by the popup's bottom and right margins", function() {
        setPopupMargin({ bottom: 10, right: 20 })
        const { popupRect, originRect } = openPopup({ position: 'left', align: 'bottom' })

        expect(popupRect.right).toBe(originRect.left - 20)
        expect(popupRect.bottom).toBe(originRect.bottom - 10)
      })
    })

    describe('with { position: "left", align: "center"}', function() {
      it('is positioned to the left of the origin and grows equally to the top and bottom', function() {
        const { popupRect, originRect } = openPopup({ position: 'left', align: 'center' })

        expect(popupRect.right).toBe(originRect.left)
        expect(popupRect.top).toBe(originRect.top + (0.5 * (originRect.height - popupRect.height)))
      })
    })
  })

  describe('when a parent layer is dismissed', function() {

    const humanClick = async function(element) {
      const box = element.getBoundingClientRect()
      const elementFromCoordinates = function() {
        element = document.elementFromPoint(box.x, box.y)
        element = element.closest('[up-dismiss]') || element
        return element
      }

      Trigger.focus(elementFromCoordinates())
      await wait()
      // A focus trap would have focused the popup, which would scroll the viewport.
      // This causes the click event to land on the wrong element.
      Trigger.click(elementFromCoordinates())
      return await wait()
    }

    it('also dismisses the popup', async function() {
      const modal = await up.layer.open({ mode: 'modal' })
      const opener = modal.affix('span')
      const popup = await up.layer.open({ mode: 'popup', origin: opener })

      await humanClick(modal.dismissElement)

      expect(popup).not.toBeAlive()
      expect(modal).not.toBeAlive()
    })

    it('also dismisses the popup when it is positioned below the fold (bugfix)', async function() {
      const modal = await up.layer.open({ mode: 'modal' })
      let opener = modal.affix('div', { style: { height: '20000px' } })
      opener = modal.affix('span', { text: 'opener' })
      const popup = await up.layer.open({ mode: 'popup', origin: opener })
      modal.viewportElement.scrollTop = 0

      await humanClick(modal.dismissElement)

      expect(popup).not.toBeAlive()
      expect(modal).not.toBeAlive()
    })
  })
})
