const u = up.util
const e = up.element

describe('up.Layer.Popup', function() {

  describe('positioning', function() {

    const setPopupMargin = function(margins) {
      const styleElement = fixture('style')
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

      popupOptions = u.options(popupOptions, { mode: 'popup', origin, content: 'popup content' })
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
      await wait()

      expect(popup.element.style.left).toBe(origin.style.left)
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

      expect(popup).toBeClosed()
      expect(modal).toBeClosed()
    })

    it('also dismisses the popup when it is positioned below the fold (bugfix)', async function() {
      const modal = await up.layer.open({ mode: 'modal' })
      let opener = modal.affix('div', { style: { height: '20000px' } })
      opener = modal.affix('span', { text: 'opener' })
      const popup = await up.layer.open({ mode: 'popup', origin: opener })
      modal.viewportElement.scrollTop = 0

      await humanClick(modal.dismissElement)

      expect(popup).toBeClosed()
      expect(modal).toBeClosed()
    })
  })
})
