const e = up.element
const u = up.util

fdescribe('up.Preview', function() {

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

    it('returns the options for the render pass being previewed', async function() {
      let spy = jasmine.createSpy('spy')
      let previewFn = (preview) => spy(preview.renderOptions)

      up.render({ preview: previewFn, url: '/url', target: 'body', scroll: '#scroll', focus: '#focus' })
      await wait()

      expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({ scroll: '#scroll', focus: '#focus' }))
    })

    it('allows a preview function to change preview.renderOptions', async function() {
      fixture('#foo', { text: 'old foo' })
      fixture('#bar', { text: 'old bar' })

      let previewFn = jasmine.createSpy('preview fn').and.callFake(({ renderOptions }) => renderOptions.target = '#bar')

      up.render({ preview: previewFn, target: '#foo', url: '/path' })
      await wait()

      expect(jasmine.Ajax.requests.count()).toEqual(1)
      expect(jasmine.Ajax.requests.mostRecent().requestHeaders['X-Up-Target']).toBe('#foo')
      expect(previewFn).toHaveBeenCalled()

      jasmine.respondWith(`
            <main>
              <div id="foo">new foo</div>
              <div id="bar">new bar</div>
            </main>
          `)

      await wait()

      expect('#foo').toHaveText('old foo')
      expect('#bar').toHaveText('new bar')
    })

  })

  describe('#request', function() {

    it('returns the up.Request object that is being previewed', async function() {
      let spy = jasmine.createSpy('spy')
      let previewFn = (preview) => spy(preview.request)

      up.render({ preview: previewFn, url: '/url', method: 'DELETE', target: 'body' })
      await wait()

      expect(spy).toHaveBeenCalledWith(jasmine.any(up.Request))
      expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({ url: '/url', method: 'DELETE' }))
    })

  })

  describe('#setAttrs()', function() {

    it('temporarily sets attributes on an element', async function() {
      fixture('#target')
      let element = fixture('#element[foo="old-foo"]')
      let previewFn = (preview) => preview.setAttrs(element, { foo: 'new-foo', bar: 'new-bar' })

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(element).toHaveAttribute('foo', 'new-foo')
      expect(element).toHaveAttribute('bar', 'new-bar')

      jasmine.respondWithSelector('#target')
      await wait()

      expect(element).toHaveAttribute('foo', 'old-foo')
      expect(element).not.toHaveAttribute('bar')
    })

  })

  describe('#addClass()', function() {

    it('temporarily adds a class to an element', async function() {
      fixture('#target')
      let element = fixture('#element.foo')
      let previewFn = (preview) => preview.addClass(element, 'bar')

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(element).toHaveClass('foo')
      expect(element).toHaveClass('bar')

      jasmine.respondWithSelector('#target')
      await wait()

      expect(element).toHaveClass('foo')
      expect(element).not.toHaveClass('bar')
    })

  })

  describe('#setStyle()', function() {

    it('temporarily sets inline styles on an element', async function() {
      fixture('#target')
      let element = fixture('#element', { style: { 'font-size': '10px' }})
      let previewFn = (preview) => preview.setStyle(element, { 'font-size': '15px', 'margin-top': '20px' })

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(element).toHaveInlineStyle({ 'font-size': '15px', 'margin-top': '20px' })

      jasmine.respondWithSelector('#target')
      await wait()

      expect(element).toHaveInlineStyle({ 'font-size': '10px' })
      expect(element).not.toHaveInlineStyle('margin-top')
    })

  })

  describe('#disable()', function() {

    it('temporarily disables an input field', async function() {
      fixture('#target')
      let input = fixture('input[type=text][name=foo]')
      let previewFn = (preview) => preview.disable(input)

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(input).toBeDisabled()

      jasmine.respondWithSelector('#target')
      await wait()

      expect(input).not.toBeDisabled()
    })

    it('temporarily disables a container of input fields', async function() {
      fixture('#target')

      const [container, input1, input2] = htmlFixtureList(`
        <div id="container">
          <input type="text" name="foo"> 
          <input type="text" name="bar">
        </div> 
      `)

      let previewFn = (preview) => preview.disable(container)

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(input1).toBeDisabled()
      expect(input2).toBeDisabled()

      jasmine.respondWithSelector('#target')
      await wait()

      expect(input1).not.toBeDisabled()
      expect(input2).not.toBeDisabled()
    })

    it('does not re-enable fields that were already disabled before the preview', async function() {
      fixture('#target')

      const [container, input1, input2] = htmlFixtureList(`
        <div id="container">
          <input type="text" name="foo" disabled> 
          <input type="text" name="bar">
        </div> 
      `)

      let previewFn = (preview) => preview.disable(container)

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(input1).toBeDisabled()
      expect(input2).toBeDisabled()

      jasmine.respondWithSelector('#target')
      await wait()

      expect(input1).toBeDisabled()
      expect(input2).not.toBeDisabled()
    })

  })

  describe('#insert()', function() {

    it('temporarily appends the given element to the children of the given reference', async function() {
      fixture('#target')
      let reference = fixture('#reference')
      let newChild = e.createFromSelector('#new-child')
      let previewFn = (preview) => preview.insert(reference, newChild)

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(newChild).toBeAttached()
      expect(newChild.parentElement).toBe(reference)

      jasmine.respondWithSelector('#target')
      await wait()

      expect(newChild).toBeDetached()
    })

    it('accepts a position relative to the given reference', async function() {
      fixture('#target')
      let reference = fixture('#reference')
      let newChild = e.createFromSelector('#new-child')
      let previewFn = (preview) => preview.insert(reference, 'beforebegin', newChild)

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(newChild).toBeAttached()
      expect(newChild.nextElementSibling).toBe(reference)

      jasmine.respondWithSelector('#target')
      await wait()

      expect(newChild).toBeDetached()
    })

    it('parses a new element from a string of HTML', async function() {
      fixture('#target')
      let reference = fixture('#reference')
      let previewFn = (preview) => preview.insert(reference, '<div id="new-child"></div>')

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(document).toHaveSelector('#new-child')
      let newChild = document.querySelector('#new-child')
      expect(newChild).toBeAttached()
      expect(newChild.parentElement).toBe(reference)

      jasmine.respondWithSelector('#target')
      await wait()

      expect(newChild).toBeDetached()
    })

    it('compiles and cleans the temporary element as it enters and exits the DOM', async function() {
      let compileSpy = jasmine.createSpy('compile spy')
      let cleanSpy = jasmine.createSpy('clean spy')
      up.compiler('#new-child', function(element) {
        compileSpy(element)
        return () => cleanSpy(element)
      })

      fixture('#target')
      let reference = fixture('#reference')
      let newChild = e.createFromSelector('#new-child')
      let previewFn = (preview) => preview.insert(reference, newChild)

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(newChild).toBeAttached()
      expect(compileSpy).toHaveBeenCalledWith(newChild)
      expect(cleanSpy).not.toHaveBeenCalled()

      jasmine.respondWithSelector('#target')
      await wait()

      expect(newChild).toBeDetached()
      expect(cleanSpy).toHaveBeenCalledWith(newChild)
    })

  })

  // describe('#swap()', function() {
  //
  //   it('temporarily swaps an element with another', async function() {
  //     fixture('#target')
  //     let container = fixture('#container')
  //     let reference = e.affix(container, '#reference')
  //     let replacement = e.createFromSelector('#new-child')
  //     let previewFn = (preview) => preview.swap(reference, replacement)
  //
  //     up.render({ preview: previewFn, url: '/url', target: '#target' })
  //     await wait()
  //
  //     expect(reference).toBeDetached()
  //     expect(replacement).toBeAttached()
  //     expect(replacement.parentElement).toBe(container)
  //
  //     jasmine.respondWithSelector('#target')
  //     await wait()
  //
  //     expect(replacement).toBeDetached()
  //     expect(reference).toBeAttached()
  //     expect(reference.parentElement).toBe(container)
  //   })
  //
  //   it('compiles and cleans the temporary element as it enters and exits the DOM', async function() {
  //     let compileSpy = jasmine.createSpy('compile spy')
  //     let cleanSpy = jasmine.createSpy('clean spy')
  //     up.compiler('#new-child', function(element) {
  //       compileSpy(element)
  //       return () => cleanSpy(element)
  //     })
  //
  //     fixture('#target')
  //     let container = fixture('#container')
  //     let reference = e.affix(container, '#reference')
  //     let replacement = e.createFromSelector('#new-child')
  //     let previewFn = (preview) => preview.swap(reference, replacement)
  //
  //     up.render({ preview: previewFn, url: '/url', target: '#target' })
  //     await wait()
  //
  //     expect(replacement).toBeAttached()
  //     expect(compileSpy).toHaveBeenCalledWith(replacement)
  //     expect(cleanSpy).not.toHaveBeenCalled()
  //
  //     jasmine.respondWithSelector('#target')
  //     await wait()
  //
  //     expect(replacement).toBeDetached()
  //     expect(cleanSpy).toHaveBeenCalledWith(replacement)
  //   })
  //
  //   it('does not clean or re-compile the original element while it is detached', async function() {
  //     let compileSpy = jasmine.createSpy('compile spy')
  //     let cleanSpy = jasmine.createSpy('clean spy')
  //     up.compiler('#reference', function(element) {
  //       compileSpy(element)
  //       return () => cleanSpy(element)
  //     })
  //
  //     fixture('#target')
  //     let container = fixture('#container')
  //     let reference = e.affix(container, '#reference')
  //     let replacement = e.createFromSelector('#new-child')
  //     let previewFn = (preview) => preview.swap(reference, replacement)
  //
  //     up.render({ preview: previewFn, url: '/url', target: '#target' })
  //     await wait()
  //
  //     expect(replacement).toBeAttached()
  //     expect(compileSpy).not.toHaveBeenCalled()
  //     expect(cleanSpy).not.toHaveBeenCalled()
  //
  //     jasmine.respondWithSelector('#target')
  //     await wait()
  //
  //     expect(replacement).toBeDetached()
  //     expect(compileSpy).not.toHaveBeenCalled()
  //     expect(cleanSpy).not.toHaveBeenCalled()
  //   })
  //
  //   // it('transfers an .up-loading class to the new element')
  //
  // })

  describe('#show()', function() {

    it('temporarily shows a hidden element', async function() {
      fixture('#target')
      let element = fixture('#element[hidden]')
      let previewFn = (preview) => preview.show(element)

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(element).toBeVisible()

      jasmine.respondWithSelector('#target')
      await wait()

      expect(element).toBeHidden()
    })

    it('does not re-hide element that was visible before the preview', async function() {
      fixture('#target')
      let element = fixture('#element')
      let previewFn = (preview) => preview.show(element)

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(element).toBeVisible()

      jasmine.respondWithSelector('#target')
      await wait()

      expect(element).toBeVisible()
    })

  })

  describe('#hide()', function() {

    it('temporarily hides a visible element', async function() {
      fixture('#target')
      let element = fixture('#element')
      let previewFn = (preview) => preview.hide(element)

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(element).toBeHidden()

      jasmine.respondWithSelector('#target')
      await wait()

      expect(element).toBeVisible()
    })

    it('does not re-show element that was hidden before the preview', async function() {
      fixture('#target')
      let element = fixture('#element[hidden]')
      let previewFn = (preview) => preview.hide(element)

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(element).toBeHidden()

      jasmine.respondWithSelector('#target')
      await wait()

      expect(element).toBeHidden()
    })

    it('allows to concurrently render a fragment that is hidden while previewing', async function() {
      fixture('#target', { text: 'old text' })
      let previewFn = (preview) => preview.hide(preview.fragment)
      let render1Promise = up.render({ target: '#target', url: '/path1', preview: previewFn })

      await wait()

      expect('#target').toBeHidden()

      up.render({ target: '#target', url: '/path2' })

      await expectAsync(render1Promise).toBeRejectedWith(jasmine.any(up.Aborted))

      jasmine.respondWithSelector('#target', { text: 'text from render2' })

      await wait()

      expect('#target').toHaveText('text from render2')
      expect('#target').toBeVisible()
    })

  })

  describe('#run(String)', function() {

    it('runs another named preview', async function() {
      let preview2Fn = jasmine.createSpy('preview2Fn')
      let preview1Fn = jasmine.createSpy('preview1Fn').and.callFake(function(preview) {
        preview.run('preview2')
      })

      up.preview('preview1', preview1Fn)
      up.preview('preview2', preview2Fn)

      up.render({ preview: preview1Fn, url: '/url', target: 'body' })
      await wait()

      expect(preview1Fn).toHaveBeenCalledWith(jasmine.any(up.Preview))
      expect(preview2Fn).toHaveBeenCalledWith(preview1Fn.calls.mostRecent().args[0])
    })

    it('also reverts the effects of the other preview', async function() {
      fixture('#target')

      let preview2Undo = jasmine.createSpy('preview2 undo')
      let preview2Apply = jasmine.createSpy('preview2 apply').and.returnValue(preview2Undo)

      let preview1Undo = jasmine.createSpy('preview1 undo')
      let preview1Apply = jasmine.createSpy('preview1 apply').and.callFake(function(preview) {
        preview.run('preview2')
        return preview1Undo
      })

      up.preview('preview1', preview1Apply)
      up.preview('preview2', preview2Apply)

      up.render({ preview: preview1Apply, url: '/url', target: '#target' })
      await wait()

      expect(preview1Apply).toHaveBeenCalled()
      expect(preview1Undo).not.toHaveBeenCalled()
      expect(preview2Apply).toHaveBeenCalled()
      expect(preview2Undo).not.toHaveBeenCalled()

      jasmine.respondWithSelector('#target')
      await wait()

      expect(preview1Undo).toHaveBeenCalled()
      expect(preview2Undo).toHaveBeenCalled()
    })

  })

  describe('#run(Function)', function() {

    it('runs another preview function', async function() {
      let preview2Fn = jasmine.createSpy('preview2Fn')
      let preview1Fn = jasmine.createSpy('preview1Fn').and.callFake(function(preview) {
        preview.run(preview2Fn)
      })

      up.render({ preview: preview1Fn, url: '/url', target: 'body' })
      await wait()

      expect(preview1Fn).toHaveBeenCalledWith(jasmine.any(up.Preview))
      expect(preview2Fn).toHaveBeenCalledWith(preview1Fn.calls.mostRecent().args[0])
    })

    it('does not crash the render pass when the other preview function crashes', async function() {
      // let preview2Error = new Error('preview2 error')
      let preview2Fn = jasmine.createSpy('preview2Fn').and.callFake(function(preview) {
        throw new Error('preview2 error')
      })
      let preview1Fn = jasmine.createSpy('preview1Fn').and.callFake(function(preview) {
        preview.run(preview2Fn)
      })


      await jasmine.expectGlobalError('preview2 error', async function() {
        let renderPromise = up.render({ preview: preview1Fn, url: '/url', target: 'body' })
        await wait()
        expect(preview1Fn).toHaveBeenCalled()
        expect(preview2Fn).toHaveBeenCalled()
        await expectAsync(renderPromise).toBePending()
      })
    })

    it('also reverts the effects of the other preview', async function() {
      fixture('#target')

      let preview2Undo = jasmine.createSpy('preview2 undo')
      let preview2Apply = jasmine.createSpy('preview2 apply').and.returnValue(preview2Undo)

      let preview1Undo = jasmine.createSpy('preview1 undo')
      let preview1Apply = jasmine.createSpy('preview1 apply').and.callFake(function(preview) {
        preview.run(preview2Apply)
        return preview1Undo
      })

      up.render({ preview: preview1Apply, url: '/url', target: '#target' })
      await wait()

      expect(preview1Apply).toHaveBeenCalled()
      expect(preview1Undo).not.toHaveBeenCalled()
      expect(preview2Apply).toHaveBeenCalled()
      expect(preview2Undo).not.toHaveBeenCalled()

      jasmine.respondWithSelector('#target')
      await wait()

      expect(preview1Undo).toHaveBeenCalled()
      expect(preview2Undo).toHaveBeenCalled()
    })

  })

  describe('#showSkeleton()', function() {

    describe('reference argument', function() {

      it('inserts the given skeleton element as a child of the given reference element, hiding its other children', async function() {
        fixture('#target')
        let parent = htmlFixture(`
          <div id="parent">
            <div id="child1"></div>
            <div id="child2"></div>
          </div>
        `)

        let skeleton = e.createFromSelector('#skeleton')
        let previewFn = (preview) => preview.showSkeleton(parent, skeleton)

        up.render({ preview: previewFn, url: '/url', target: '#target' })
        await wait()

        expect('#parent').toBeVisible()
        expect(skeleton.parentElement).toBe(parent)
        expect('#child1').toBeHidden()
        expect('#child2').toBeHidden()

        jasmine.respondWithSelector('#target')
        await wait()

        expect('#parent').toBeVisible()
        expect('#child1').toBeVisible()
        expect('#child2').toBeVisible()
      })

      it('shows the skeleton within the targeted fragment if no reference is given', async function() {
        let target = htmlFixture(`
          <div id="target">
            <div id="old-child">old child</div>
          </div>
        `)

        let skeleton = e.createFromSelector('#skeleton')
        let previewFn = (preview) => preview.showSkeleton(skeleton)

        up.render({ preview: previewFn, url: '/url', target: '#target', feedback: true })
        await wait()

        expect('#target').toBeVisible()
        expect('#target').toBeAttached()
        expect('#target').toHaveClass('up-loading')
        expect(skeleton.parentElement).toBe(target)
        expect('#old-child').toBeHidden()

        jasmine.respondWith(`
          <div id="target">
            <div id="new-child">new child</div>
          </div>
        `)
        await wait()

        expect('#target').toBeVisible()
        expect('#target').not.toHaveClass('up-loading')
        expect('#target').toHaveSelector('#new-child')
        expect('#target').not.toHaveSelector('#old-child')
      })

      // it('accepts a selector for the reference element')
      //
      // it('resolves the selector in the { bindLayer }')
    })

    describe('skeleton argument', function() {

      it('compiles the given skeleton element', async function() {
        let skeletonCompiler = jasmine.createSpy('skeleton compiler')
        up.compiler('#skeleton', skeletonCompiler)

        fixture('#target')
        let parent = htmlFixture(`
          <div id="parent">
            <div id="child"></div>
          </div>
        `)

        let skeleton = htmlFixture(`<div id="skeleton">skeleton</div>`)
        let previewFn = (preview) => preview.showSkeleton(parent, skeleton)

        up.render({ preview: previewFn, url: '/url', target: '#target' })
        await wait()

        expect('#parent').toHaveSelector('#skeleton')
        expect('#parent').not.toHaveSelector('#skeleton-template')
        expect('#child').toBeHidden()
        expect(skeletonCompiler).toHaveBeenCalledWith(skeleton, jasmine.anything(), jasmine.anything())

        jasmine.respondWithSelector('#target')
        await wait()

        expect('#parent').not.toHaveSelector('#skeleton')
        expect('#child').toBeVisible()
      })

      it('clones a template element passed as a skeleton', async function() {
        let skeletonCompiler = jasmine.createSpy('skeleton compiler')
        up.compiler('#skeleton', skeletonCompiler)

        fixture('#target')
        let parent = htmlFixture(`
          <div id="parent">
            <div id="child"></div>
          </div>
        `)

        let skeletonTemplate = htmlFixture(`
          <template id="skeleton-template">
            <div id="skeleton">skeleton</div>
          </template>
        `)
        let previewFn = (preview) => preview.showSkeleton(parent, skeletonTemplate)

        up.render({ preview: previewFn, url: '/url', target: '#target' })
        await wait()

        expect('#parent').toHaveSelector('#skeleton')
        expect('#parent').not.toHaveSelector('#skeleton-template')
        expect('#child').toBeHidden()
        expect(skeletonCompiler).toHaveBeenCalledWith(jasmine.elementMatchingSelector('#skeleton'), jasmine.anything(), jasmine.anything())

        jasmine.respondWithSelector('#target')
        await wait()

        expect('#parent').not.toHaveSelector('#skeleton')
        expect('#child').toBeVisible()
      })

      it('accepts the skeleton as a string of HTML (needs to start with "<")', async function() {
        fixture('#target')
        let parent = htmlFixture(`
          <div id="parent">
            <div id="child"></div>
          </div>
        `)

        let previewFn = (preview) => preview.showSkeleton(parent, `<div id="skeleton">skeleton</div>`)

        up.render({ preview: previewFn, url: '/url', target: '#target' })
        await wait()

        expect('#parent').toHaveSelector('#skeleton')
        expect('#child').toBeHidden()

        jasmine.respondWithSelector('#target')
        await wait()

        expect('#parent').not.toHaveSelector('#skeleton')
        expect('#child').toBeVisible()
      })

      // it('accepts a selector for the skeleton element')

    })

    describe('when previewing a new overlay', function() {

      it("shows the skeleton in a new overlay with the same visual layer options as the current render pass", async function() {
        let skeleton = e.createFromHTML('<div id="skeleton">skeleton content</div>')

        up.render({ skeleton, url: '/url', target: '#target', layer: 'new', mode: 'drawer', size: 'large', position: 'right' })
        await wait()

        expect(up.layer.count).toBe(2)
        expect(up.layer.current.mode).toBe('drawer')
        expect(up.layer.current.size).toBe('large')
        expect(up.layer.current.position).toBe('right')
        expect(up.layer.current.getFirstSwappableElement()).toMatchSelector('#target')
        expect(up.layer.current.getFirstSwappableElement().children[0]).toBe(skeleton)

        jasmine.respondWithSelector('#target', { text: 'server content' })
        await wait()

        expect(up.layer.count).toBe(2)
        expect(up.layer.current.mode).toBe('drawer')
        expect(up.layer.current.size).toBe('large')
        expect(up.layer.current.position).toBe('right')
        expect(up.layer.current.getFirstSwappableElement()).toMatchSelector('#target')
        expect(up.layer.current.getFirstSwappableElement()).toHaveText('server content')
      })

      it('does not animate when the preview overlay is replaced by the actual overlay', async function() {
        up.motion.config.enabled = true
        up.layer.config.modal.openAnimation = 'fade-in'
        up.layer.config.modal.openDuration = 50
        up.layer.config.modal.closeAnimation = 'fade-out'
        up.layer.config.modal.closeDuration = 50

        let animateCount = 0

        function fakeAnimate(element, animation, options) {
          if (up.motion.willAnimate(element, animation, options)) {
            animateCount++
          }
          return Promise.resolve()
        }

        let animateSpy = spyOn(up, 'animate').and.callFake(fakeAnimate)

        let previewFn = (preview) => preview.showSkeleton('<div>preview content</div>')

        up.render({ preview: previewFn, url: '/url', target: '#target', layer: 'new' })
        await wait(100)

        expect(up.layer.count).toBe(2)
        expect(up.layer.current.getFirstSwappableElement()).toMatchSelector('#target')
        expect(up.layer.current.getFirstSwappableElement()).toHaveText('preview content')
        expect(animateCount).toBe(2)

        jasmine.respondWithSelector('#target', { text: 'server content' })
        await wait()

        expect(up.layer.count).toBe(2)
        expect(up.layer.current.getFirstSwappableElement()).toMatchSelector('#target')
        expect(up.layer.current.getFirstSwappableElement()).toHaveText('server content')
        expect(animateCount).toBe(2)
      })

      // See more specs for #openLayer() below

    })

  })

  describe('#hideContent()', function() {

    it('hides all child elements of the given parent element, but keeps the parent visible', async function() {
      fixture('#target')
      let parent = htmlFixture(`
        <div id="parent">
          <div id="child1"></div>
          <div id="child2"></div>
        </div>
      `)

      let previewFn = (preview) => preview.hideContent(parent)

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect('#parent').toBeVisible()
      expect('#child1').toBeHidden()
      expect('#child2').toBeHidden()

      jasmine.respondWithSelector('#target')
      await wait()

      expect('#parent').toBeVisible()
      expect('#child1').toBeVisible()
      expect('#child2').toBeVisible()
    })

  })

  describe('#openLayer()', function() {

    it('opens a layer with the given content', async function() {
      let previewFn = (preview) => preview.openLayer('overlay content')

      up.render({ preview: previewFn, url: '/url', target: '#target', layer: 'new' })
      await wait()

      expect(up.layer.count).toBe(2)
      expect(up.layer.current.getFirstSwappableElement()).toMatchSelector('#target')
      expect(up.layer.current.getFirstSwappableElement()).toHaveText('overlay content')
    })

    it('opens a layer with the same visual layer options as the previewing render pass', async function() {
      let previewFn = (preview) => preview.openLayer('overlay content')

      up.render({ preview: previewFn, url: '/url', target: '#target', layer: 'new', mode: 'drawer', size: 'large', position: 'right' })
      await wait()

      expect(up.layer.count).toBe(2)
      expect(up.layer.current.mode).toBe('drawer')
      expect(up.layer.current.size).toBe('large')
      expect(up.layer.current.position).toBe('right')
    })

    it('accepts options that override layer options from the previewing render pass', async function() {
      let previewFn = (preview) => preview.openLayer('overlay content', { mode: 'drawer', size: 'large', position: 'right' })

      up.render({ preview: previewFn, url: '/url', target: '#target', layer: 'new', mode: 'modal', size: 'small' })
      await wait()

      expect(up.layer.count).toBe(2)
      expect(up.layer.current.mode).toBe('drawer')
      expect(up.layer.current.size).toBe('large')
      expect(up.layer.current.position).toBe('right')
    })

    it('opens a layer for a render pass that updates an existing layer', async function() {
      fixture('#target')
      let previewFn = (preview) => preview.openLayer('overlay content')

      up.render({ preview: previewFn, url: '/url', target: '#target', layer: 'current' })
      await wait()

      expect(up.layer.count).toBe(2)
      expect(up.layer.current.getFirstSwappableElement()).toMatchSelector('#target')
      expect(up.layer.current.getFirstSwappableElement()).toHaveText('overlay content')
    })

    it('dismisses the layer when the response is received, even when the render pass does not peel (bugfix)', async function() {
      fixture('#target', { text: 'old target' })
      let previewFn = (preview) => preview.openLayer('overlay content')

      up.render({ preview: previewFn, url: '/url', target: '#target', layer: 'current', peel: false })
      await wait()

      expect(up.layer.count).toBe(2)
      expect(up.layer.current.getFirstSwappableElement()).toMatchSelector('#target')
      expect(up.layer.current.getFirstSwappableElement()).toHaveText('overlay content')

      jasmine.respondWithSelector('#target', { text: 'new target' })

      await wait()

      expect(up.layer.count).toBe(1)
      expect('#target').toHaveText('new target')
    })

    it('aborts the previewing request when the user dismisses the overlay', async function() {
      let previewFn = (preview) => preview.openLayer('overlay content')

      let renderPromise = up.render({ preview: previewFn, url: '/url', target: '#target', layer: 'new modal' })
      await wait()

      expect(up.layer.count).toBe(2)
      await expectAsync(renderPromise).toBePending()

      Trigger.clickSequence('up-modal-dismiss')

      await expectAsync(renderPromise).toBeRejectedWith(
        jasmine.anyError('AbortError', /Preview overlay dismissed/)
      )
    })

    it('does not run { onDismiss, onDismissed } handlers when the temporary overlay is dismissed', async function() {
      let onDismiss = jasmine.createSpy('onDismiss spy')
      let onDismissed = jasmine.createSpy('onDismissed spy')

      let previewFn = (preview) => preview.openLayer('overlay content')

      up.render({ preview: previewFn, url: '/url', target: '#target', layer: 'new', onDismiss, onDismissed })
      await wait()

      expect(up.layer.count).toBe(2)
      expect(up.layer.current).toHaveText('overlay content')
      expect(onDismiss).not.toHaveBeenCalled()
      expect(onDismissed).not.toHaveBeenCalled()

      jasmine.respondWithSelector('#target', { text: 'server content' })
      await wait()

      expect(up.layer.count).toBe(2)

      up.layer.dismiss()
      await wait()

      // When the real overlay is dismissed, callbacks do get called
      expect(up.layer.count).toBe(1)
      expect(onDismiss).toHaveBeenCalled()
      expect(onDismissed).toHaveBeenCalled()
    })

    it('dismisses the overlay when the request fails due to a network issue', async function() {
      let previewFn = (preview) => preview.openLayer('overlay content')

      up.render({ preview: previewFn, url: '/url', target: '#target', layer: 'new' })
      await wait()

      expect(up.layer.count).toBe(2)
      expect(up.layer.current.getFirstSwappableElement()).toMatchSelector('#target')
      expect(up.layer.current.getFirstSwappableElement()).toHaveText('overlay content')

      jasmine.lastRequest().responseError()

      expect(up.layer.count).toBe(1)
    })

    it('does not allow up:layer:dismiss listeners to prevent closing the overlay')

  })



  describe('#undo()', function() {

    it('tracks a function to run when the preview is reverted', async function() {
      fixture('#target')
      let undoFn = jasmine.createSpy('undo fn')
      let previewFn = jasmine.createSpy('preview apply').and.callFake(function(preview) {
        preview.undo(undoFn)
      })

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(previewFn).toHaveBeenCalled()
      expect(undoFn).not.toHaveBeenCalled()

      jasmine.respondWithSelector('#target')
      await wait()

      expect(undoFn).toHaveBeenCalled()
    })

  })

})
