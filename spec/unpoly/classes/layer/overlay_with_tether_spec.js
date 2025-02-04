const u = up.util
const e = up.element

describe('up.Layer.OverlayWithTether', function() {
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
  })
})
