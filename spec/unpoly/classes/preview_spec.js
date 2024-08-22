describe('up.Preview', function() {

  describe('#target', function() {

    it('returns the target selector', async function() {
      fixture('#target')
      let spy = jasmine.createSpy('spy')
      let previewFn = (preview) => spy(preview.target)

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(spy).toHaveBeenCalledWith('#target')
    })

    it('returns the full target for a multi-fragment update', async function() {
      fixture('#one')
      fixture('#two')
      let spy = jasmine.createSpy('spy')
      let previewFn = (preview) => spy(preview.target)

      up.render({ preview: previewFn, url: '/url', target: '#one, #two' })
      await wait()

      expect(spy).toHaveBeenCalledWith('#one, #two')
    })

  })

  describe('#fragment', function() {

    it('returns the element that is being replaced', async function() {
      let target = fixture('#target')
      let spy = jasmine.createSpy('spy')
      let previewFn = (preview) => spy(preview.fragment)

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(spy).toHaveBeenCalledWith(target)
    })

    it('returns the first element for a multi-target update', async function() {
      let one = fixture('#one')
      let two = fixture('#two')
      let spy = jasmine.createSpy('spy')
      let previewFn = (preview) => spy(preview.fragment)

      up.render({ preview: previewFn, url: '/url', target: '#one, #two' })
      await wait()

      expect(spy).toHaveBeenCalledWith(one)
    })

    it('returns a missing value when opening a new layer', async function() {
      let spy = jasmine.createSpy('spy')
      let previewFn = (preview) => spy(preview.fragment)

      up.render({ preview: previewFn, url: '/url', target: '#target', layer: 'new modal' })
      await wait()

      expect(spy).toHaveBeenCalled()
      expect(spy.calls.mostRecent().args[0]).toBeMissing()
    })

  })

  describe('#fragments', function() {

    it('returns an array of all targeted elements', async function() {
      let one = fixture('#one')
      let two = fixture('#two')
      let spy = jasmine.createSpy('spy')
      let previewFn = (preview) => spy(preview.fragments)

      up.render({ preview: previewFn, url: '/url', target: '#one, #two' })
      await wait()

      expect(spy).toHaveBeenCalledWith([one, two])
    })

    it('returns an empty array when opening a new layer', async function() {
      let spy = jasmine.createSpy('spy')
      let previewFn = (preview) => spy(preview.fragments)

      up.render({ preview: previewFn, url: '/url', target: '#target', layer: 'new modal' })
      await wait()

      expect(spy).toHaveBeenCalled()
      expect(spy.calls.mostRecent().args[0]).toEqual([])
    })

  })

  describe('#orgin', function() {

    it('returns the { origin } element (e.g. the link being followed)', async function() {
      let link = fixture('a[href="/url"][up-target=":main"]')
      let spy = jasmine.createSpy('spy')
      let previewFn = (preview) => spy(preview.origin)

      up.follow(link, { preview: previewFn })
      await wait()

      expect(spy).toHaveBeenCalledWith(link)
    })

  })

  describe('#layer', function() {

    it('returns the resolved up.Layer object that is being targeted', async function() {
      makeLayers(2)
      expect(up.layer.current).toBeOverlay()

      up.layer.current.affix('#target')
      let spy = jasmine.createSpy('spy')
      let previewFn = (preview) => spy(preview.layer)

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(spy).toHaveBeenCalledWith(jasmine.any(up.Layer))
      expect(spy).toHaveBeenCalledWith(up.layer.current)
    })

    it('returns a targeted background layer', async function() {
      fixture('#target')
      makeLayers(2)
      expect(up.layer.current).toBeOverlay()

      let spy = jasmine.createSpy('spy')
      let previewFn = (preview) => spy(preview.layer)

      up.render({ preview: previewFn, url: '/url', target: '#target', layer: 'root' })
      await wait()

      expect(spy).toHaveBeenCalledWith(jasmine.any(up.Layer))
      expect(spy).toHaveBeenCalledWith(up.layer.root)
    })

    it('returns the first layer in an update that might match multiple layers', async function() {
      makeLayers([
        { target: '.target' },
        { target: '.target' },
      ])
      expect(up.layer.current).toBeOverlay()

      let spy = jasmine.createSpy('spy')
      let previewFn = (preview) => spy(preview.layer)

      up.render({ preview: previewFn, url: '/url', target: '.target', layer: 'any' })
      await wait()

      expect(spy).toHaveBeenCalledWith(jasmine.any(up.Layer))
      // Looking up "any" layers will return the current layer first.
      expect(spy).toHaveBeenCalledWith(up.layer.current)
    })

    it('returns the string "new" when opening a new layer', async function() {
      let spy = jasmine.createSpy('spy')
      let previewFn = (preview) => spy(preview.layer)

      up.render({ preview: previewFn, url: '/url', target: '#target', layer: 'new modal' })
      await wait()

      expect(spy).toHaveBeenCalledWith('new')
    })

  })

  describe('#renderOptions', function() {

    it('returns the options for the render pass being previewed')

  })

  describe('#request', function() {

    it('returns the up.Request object that is being previewed')

  })

  describe('#setAttrs()', function() {

    it('temporarily sets attributes on an element')

  })

  describe('#addClass()', function() {

    it('temporarily adds a class to an element')

  })

  describe('#setStyle()', function() {

    it('temporarily sets inline styles on an element')

  })

  describe('#setStyle()', function() {

    it('temporarily disables an input field')

    it('temporarily disables a container of input fields')

    it('does not re-enable fields that were already disabled before the preview')

  })

  describe('#insert()', function() {

    it('temporarily appends the given element to the children of the given reference')

    it('accepts a position relative to the given reference')

    it('parses a new element from a string of HTML')

    it('compiles and cleans the temporary element as it enters and exits the DOM')

  })

  describe('#swap()', function() {

    it('temporarily swaps an element with another')

    it('compiles and cleans the temporary element as it enters and exits the DOM')

    it('does not clean or re-compile the original element while it is detached')

    // it('transfers an .up-loading class to the new element')

  })

  describe('#show()', function() {

    it('temporarily shows a hidden element')

    it('does not re-hide element that was visible before the preview')

  })

  describe('#hide()', function() {

    it('temporarily hides a visible element')

    it('does not re-show element that was hidden before the preview')

  })

  describe('#run(String)', function() {

    it('runs another named preview')

    it('also reverts the effects of the other preview')

  })

  describe('#run(Function)', function() {

    it('runs another preview function')

    it('also reverts the effects of the other preview')

  })

  describe('#undo()', function() {

    it('tracks a function to run when the preview is reverted')

  })

})
