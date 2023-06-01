describe 'up.Layer.OverlayWithViewport', ->

  describe 'preservation of overlays during fragment changes', ->

    it 'keeps the overlay in the DOM', ->
      await up.layer.open(content: 'foo', animation: false)

      expect(up.layer.count).toBe(2)

      # Need to pass { peel: false } since peeling would close the layer
      up.render('body', document: '<body>new body</body>', layer: 'root', peel: false)

      await wait()

      expect(up.layer.count).toBe(2)
      expect(up.layer.stack[1].element).toBeAttached()
      expect(up.layer.stack[1].element.parentElement).toBe(document.body)

    it 'does not call destructors', ->
      destructor = jasmine.createSpy('destructor for <overlay-child>')
      up.compiler('overlay-child', (element) -> return destructor)

      await up.layer.open(content: '<overlay-child></overlay-child>', animation: false)

      await wait()

      expect(up.layer.count).toBe(2)

      # Need to pass { peel: false } since peeling would close the layer
      up.render('body', document: '<body>new body</body>', layer: 'root', peel: false)

      await wait()

      expect(up.layer.count).toBe(2)
      expect(destructor).not.toHaveBeenCalled()

      # Test that destructors *are* called when we close the overlay.
      up.layer.dismiss(null, animation: false)

      await wait()

      expect(up.layer.count).toBe(1)
      expect(destructor).toHaveBeenCalled()
