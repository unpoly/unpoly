u = up.util
e = up.element

describe 'up.Layer.Popup', ->

  describe 'positioning', ->

    setPopupMargin = (margins) ->
      styleElement = fixture('style')
      sheet = styleElement.sheet
      for key, value of margins
        sheet.insertRule("up-popup { margin-#{key}: #{value}px }", 0)

    openPopup = (popupOptions = {}) ->
      origin = fixture('.origin', style: {
        position: 'absolute',
        left: 30,
        width: 50,
        top: 70,
        height: 20,
        backgroundColor: 'red'
      })

      popupOptions = u.options(popupOptions, mode: 'popup', origin: origin, content: 'popup content')
      up.layer.open(popupOptions)

      popup = up.layer.current
      expect(popup.isOverlay()).toBe(true)

      popupRect = popup.element.getBoundingClientRect()
      originRect = origin.getBoundingClientRect()
      
      return { origin, popup, popupRect, originRect }

    it 'repositions when the window is resized', asyncSpec (next) ->
      { origin, popup } = openPopup()

      origin.style.left = '85px'
      expect(popup.element.style.left).not.toBe(origin.style.left)

      up.emit(window, 'resize')

      next ->
        expect(popup.element.style.left).toBe(origin.style.left)

    describe 'with { position: "bottom", align: "left" }', ->

      it 'is positioned below the origin and grows from the left origin edge to the right', ->
        { popupRect, originRect } = openPopup(position: 'bottom', align: 'left')

        expect(popupRect.left).toBe(originRect.left)
        expect(popupRect.top).toBe(originRect.bottom)

      it "is shifted by the popup's top and left margins", ->
        setPopupMargin(top: 10, left: 20)
        { popupRect, originRect } = openPopup(position: 'bottom', align: 'left')

        expect(popupRect.left).toBe(originRect.left + 20)
        expect(popupRect.top).toBe(originRect.bottom + 10)

    describe 'with { position: "bottom", align: "right" }', ->

      it 'is positioned below the origin and grows from the right origin edge to the left', ->
        { popupRect, originRect } = openPopup(position: 'bottom', align: 'right')

        expect(popupRect.left).toBe(originRect.left + originRect.width - popupRect.width)
        expect(popupRect.top).toBe(originRect.bottom)

      it "is shifted by the popup's top and right margins", ->
        setPopupMargin(top: 10, right: 20)
        { popupRect, originRect } = openPopup(position: 'bottom', align: 'right')

        expect(popupRect.left).toBe(originRect.left + originRect.width - popupRect.width - 20)
        expect(popupRect.top).toBe(originRect.bottom + 10)

    describe 'with { position: "bottom", align: "center"}', ->

      it 'is positioned below the origin and grows equally to the left and right', ->
        { popupRect, originRect } = openPopup(position: 'bottom', align: 'center')

        expect(popupRect.left).toBe(originRect.left + 0.5 * (originRect.width - popupRect.width))
        expect(popupRect.top).toBe(originRect.bottom)

    describe 'with { position: "top", align: "left" }', ->

      it 'is positioned above the origin and grows from the left origin edge to the right', ->
        { popupRect, originRect } = openPopup(position: 'top', align: 'left')

        expect(popupRect.left).toBe(originRect.left)
        expect(popupRect.bottom).toBe(originRect.top)

      it "is shifted by the popup's bottom and left margins", ->
        setPopupMargin(bottom: 10, left: 20)
        { popupRect, originRect } = openPopup(position: 'top', align: 'left')

        expect(popupRect.left).toBe(originRect.left + 20)
        expect(popupRect.bottom).toBe(originRect.top - 10)

    describe 'with { position: "top", align: "right" }', ->

      it 'is positioned above the origin and grows from the right origin edge to the left', ->
        { popupRect, originRect } = openPopup(position: 'top', align: 'right')

        expect(popupRect.left).toBe(originRect.left + originRect.width - popupRect.width)
        expect(popupRect.bottom).toBe(originRect.top)

      it "is shifted by the popup's bottom and right margins", ->
        setPopupMargin(bottom: 10, right: 20)
        { popupRect, originRect } = openPopup(position: 'top', align: 'right')

        expect(popupRect.left).toBe(originRect.left + originRect.width - popupRect.width - 20)
        expect(popupRect.bottom).toBe(originRect.top - 10)

    describe 'with { position: "bottom", align: "center"}', ->

      it 'is positioned below the origin and grows equally to the left and right', ->
        { popupRect, originRect } = openPopup(position: 'top', align: 'center')

        expect(popupRect.left).toBe(originRect.left + 0.5 * (originRect.width - popupRect.width))
        expect(popupRect.bottom).toBe(originRect.top)



    describe 'with { position: "right", align: "top" }', ->

      it 'is positioned to the right of the origin and grows from the top origin edge to the bottom', ->
        { popupRect, originRect } = openPopup(position: 'right', align: 'top')

        expect(popupRect.left).toBe(originRect.right)
        expect(popupRect.top).toBe(originRect.top)

      it "is shifted by the popup's top and left margins", ->
        setPopupMargin(top: 10, left: 20)
        { popupRect, originRect } = openPopup(position: 'right', align: 'top')

        expect(popupRect.left).toBe(originRect.right + 20)
        expect(popupRect.top).toBe(originRect.top + 10)

    describe 'with { position: "right", align: "bottom" }', ->

      it 'is positioned to the right of the origin and grows from the bottom origin edge to the top', ->
        { popupRect, originRect } = openPopup(position: 'right', align: 'bottom')

        expect(popupRect.left).toBe(originRect.right)
        expect(popupRect.bottom).toBe(originRect.bottom)

      it "is shifted by the popup's bottom and left margins", ->
        setPopupMargin(bottom: 10, left: 20)
        { popupRect, originRect } = openPopup(position: 'right', align: 'bottom')

        expect(popupRect.left).toBe(originRect.right + 20)
        expect(popupRect.bottom).toBe(originRect.bottom - 10)

    describe 'with { position: "right", align: "center"}', ->

      it 'is positioned to the right of the origin and grows equally to the top and bottom', ->
        { popupRect, originRect } = openPopup(position: 'right', align: 'center')

        expect(popupRect.left).toBe(originRect.right)
        expect(popupRect.top).toBe(originRect.top + 0.5 * (originRect.height - popupRect.height))



    describe 'with { position: "left", align: "top" }', ->

      it 'is positioned to the left of the origin and grows from the top origin edge to the bottom', ->
        { popupRect, originRect } = openPopup(position: 'left', align: 'top')

        expect(popupRect.right).toBe(originRect.left)
        expect(popupRect.top).toBe(originRect.top)

      it "is shifted by the popup's top and right margins", ->
        setPopupMargin(top: 10, right: 20)
        { popupRect, originRect } = openPopup(position: 'left', align: 'top')

        expect(popupRect.right).toBe(originRect.left - 20)
        expect(popupRect.top).toBe(originRect.top + 10)

    describe 'with { position: "left", align: "bottom" }', ->

      it 'is positioned to the left of the origin and grows from the bottom origin edge to the top', ->
        { popupRect, originRect } = openPopup(position: 'left', align: 'bottom')

        expect(popupRect.right).toBe(originRect.left)
        expect(popupRect.bottom).toBe(originRect.bottom)

      it "is shifted by the popup's bottom and right margins", ->
        setPopupMargin(bottom: 10, right: 20)
        { popupRect, originRect } = openPopup(position: 'left', align: 'bottom')

        expect(popupRect.right).toBe(originRect.left - 20)
        expect(popupRect.bottom).toBe(originRect.bottom - 10)

    describe 'with { position: "left", align: "center"}', ->

      it 'is positioned to the left of the origin and grows equally to the top and bottom', ->
        { popupRect, originRect } = openPopup(position: 'left', align: 'center')

        expect(popupRect.right).toBe(originRect.left)
        expect(popupRect.top).toBe(originRect.top + 0.5 * (originRect.height - popupRect.height))
