describe('up.Selector', function() {

  describe('choosing the layers to match in', function() {

    describe('with { layer: "new" }', function() {

      it('does not filter by layer, and expands :main for the mode of the new layer', function() {
        makeLayers(2)
        const [rootElement] = htmlFixtureList('<div up-main="popup">root element</div>')

        expect(up.fragment.matches(rootElement, ':main', { layer: 'new', mode: 'popup' })).toBe(true)
        expect(up.fragment.matches(rootElement, ':main', { layer: 'new', mode: 'drawer' })).toBe(false)
      })

    })

    describe('when there is no layer to tell matches apart', function() {

      it('matches in every layer with { layer: "any" }', function() {
        makeLayers([{ target: '.element' }, { target: '.element' }])

        const results = up.fragment.all('.element', { layer: 'any' })

        expect(results.length).toBe(2)
        expect(up.layer.get(results[0])).toBe(up.layer.root)
        expect(up.layer.get(results[1])).toBe(up.layer.front)
      })

      it('matches in a detached tree while an overlay is open', function() {
        makeLayers(2)
        const detachedTree = up.element.createFromHTML('<div><span class="child"></span></div>')

        const results = up.fragment.subtree(detachedTree, '.child')

        expect(results).toEqual([detachedTree.querySelector('.child')])
      })

    })

    describe('when layers are found', function() {

      it('only matches in the given layers', function() {
        makeLayers([{ target: '.element' }, { target: '.element' }])

        const results = up.fragment.all('.element', { layer: 'root' })

        expect(results.length).toBe(1)
        expect(up.layer.get(results[0])).toBe(up.layer.root)
      })

      it("only matches in the layer of an { origin } in a live overlay", function() {
        makeLayers([{ target: '.element' }, { target: '.element' }, { target: '.element' }])
        const origin = up.fragment.get('.element', { layer: 1 })

        const results = up.fragment.all('.element', { origin })

        expect(results).toEqual([origin])
      })

    })

    describe('when the layer of a given element has closed, but its elements are still playing their exit animation', function() {

      let form

      beforeEach(async function() {
        htmlFixtureList(`
          <div class="region" id="root-region">
            <input name="root-input">
          </div>
        `)

        await up.layer.open({ fragment: `
          <div class="region" id="overlay-region">
            <input name="overlay-input">
          </div>
        ` })

        const closingOverlay = await openOverlayWithCloseAnimation({ fragment: `
          <form class="region" id="closing-region">
            <input name="closing-input">
          </form>
        ` })
        form = closingOverlay.element.querySelector('form')

        closingOverlay.dismiss()

        expect(closingOverlay.element).toHaveClass('up-destroying')
        // We want to test a lookup from a closing overlay while other layers are left.
        // With a single layer we wouldn't look at layers at all.
        expect(up.layer.count).toBe(2)
      })

      // The specs below pass { destroying: true }, so they would find the closing overlay's elements
      // if it were not for the closed layer. Without it they would also pass when we ignored layers.

      it('matches nothing in the subtree of a root element in that layer', function() {
        expect(up.fragment.subtree(form, 'input', { destroying: true })).toEqual([])
      })

      it('matches nothing for a { layer } element in that layer', function() {
        expect(up.fragment.all('input', { layer: form, destroying: true })).toEqual([])
      })

      it('matches nothing in the region of an { origin } in that layer, and does not match in another layer instead', function() {
        expect(up.fragment.get('.region', { origin: form, destroying: true })).toBeMissing()
      })

      it('does not match an element in that layer', function() {
        expect(up.fragment.matches(form, 'form', { destroying: true })).toBe(false)
      })

    })

    describe('when a named layer does not exist', function() {

      beforeEach(function() {
        makeLayers([{ target: '.element' }, { target: '.element' }])
      })

      it('throws an error for { layer: "child" } without a child layer', function() {
        const doLookup = () => up.fragment.all('.element', { layer: 'child' })
        expect(doLookup).toThrowError(up.CannotMatch, /unknown layer/i)
      })

      it('throws an error for { layer: "origin" } without an { origin }', function() {
        const doLookup = () => up.fragment.all('.element', { layer: 'origin' })
        expect(doLookup).toThrowError(up.CannotMatch, /unknown layer/i)
      })

    })

  })

})
