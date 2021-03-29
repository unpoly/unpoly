describe 'up.Layer.OverlayWithViewport', ->

  describe 'preservation of overlays during fragment changes', ->

    beforeEach ->
      fixture('.container', content: 'old container text')
      # Since we don't want to destroy the <body> in tests, reconfigure layers so they
      # will attach to another element.
      spyOn(up.Layer.Modal, 'getParentElement').and.callFake -> document.querySelector('.container')

    it 'keeps the overlay in the DOM', asyncSpec (next) ->
      next.await up.layer.open(content: 'foo', animation: false)

      next ->
        expect(up.layer.count).toBe(2)

        # Need to pass { peel: false } since peeling would close the layer
        up.render('.container', content: 'new container text', peel: false)

      next ->
        expect(up.layer.count).toBe(2)
        expect(up.layer.stack[1].element).toBeAttached()
        expect(up.layer.stack[1].element.parentElement).toMatchSelector('.container')

    it 'does not call destructors', asyncSpec (next) ->
      destructor = jasmine.createSpy('destructor for <overlay-child>')
      up.compiler('overlay-child', (element) -> return destructor)

      next.await up.layer.open(content: '<overlay-child></overlay-child>', animation: false)

      next ->
        expect(up.layer.count).toBe(2)

        # Need to pass { peel: false } since peeling would close the layer
        up.render('.container', content: 'new container text', peel: false, layer: 'root')

      next ->
        expect(up.layer.count).toBe(2)
        expect(destructor).not.toHaveBeenCalled()

        up.layer.dismiss(animation: false)

      next ->
        expect(up.layer.count).toBe(1)
        expect(destructor).toHaveBeenCalled()
