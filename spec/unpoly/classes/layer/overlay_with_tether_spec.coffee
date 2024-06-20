u = up.util
e = up.element

describe 'up.Layer.OverlayWithTether', ->

  describe 'preservation of overlays during fragment changes', ->

    it 'dismisses the overlay when its viewport has been removed', asyncSpec (next) ->
      viewport = fixture('.viewport', style: {
        'width': '300px',
        'height': '200px',
        'overflow-y': 'scroll'
      })
      opener = e.affix(viewport, '.opener')
      up.layer.open(origin: opener, mode: 'popup', animation: false)

      onDismissed = jasmine.createSpy('onDismissed spy')
      up.on('up:layer:dismissed', onDismissed)

      next ->
        expect(up.layer.count).toBe(2)

      next ->
        up.destroy(viewport)

      next ->
        expect(up.layer.count).toBe(1)
        expect(onDismissed).toHaveBeenCalled()

    it 'dismisses the overlay when its anchor has been removed', asyncSpec (next) ->
      opener = fixture('.opener')
      up.layer.open(origin: opener, mode: 'popup', animation: false)

      onDismissed = jasmine.createSpy('onDismissed spy')
      up.on('up:layer:dismissed', onDismissed)

      next ->
        expect(up.layer.count).toBe(2)

      next ->
        up.destroy(opener)

      next ->
        expect(up.layer.count).toBe(1)
        expect(onDismissed).toHaveBeenCalled()

#    it 're-attaches the overlay when it has been manually removed from the DOM', asyncSpec (next) ->
#      opener = fixture('.opener')
#      up.layer.open(origin: opener, mode: 'popup', animation: false)
#
#      next ->
#        expect(up.layer.count).toBe(2)
#
#      next ->
#        e.remove(up.layer.stack[1].element)
#
#        # sync() is automatically called after an element was removed from the DOM.
#        up.layer.stack[1].sync()
#
#      next ->
#        expect(up.layer.count).toBe(1)
#        expect(up.layer.stack[1].isDetached()).toBe(false)
