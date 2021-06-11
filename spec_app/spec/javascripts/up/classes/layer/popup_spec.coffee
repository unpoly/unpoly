u = up.util
e = up.element

describe 'up.Layer.Popup', ->

  describe 'positioning', ->

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

    it 'is positioned below the { origin } element', ->
      { popupRect, originRect } = openPopup()

      expect(popupRect.left).toBe(originRect.left)
      expect(popupRect.top).toBe(originRect.bottom)

    it 'repositions when the window is resized', asyncSpec (next) ->
      { origin, popup } = openPopup()

      origin.style.left = '85px'
      expect(popup.element.style.left).not.toBe(origin.style.left)

      up.emit(window, 'resize')

      next ->
        expect(popup.element.style.left).toBe(origin.style.left)
