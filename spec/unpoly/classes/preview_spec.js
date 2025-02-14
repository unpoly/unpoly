const e = up.element
const u = up.util

describe('up.Preview', function() {

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

  describe('#params', function() {

    it('returns the params of a form submission', async function() {
      let spy = jasmine.createSpy('spy')
      let previewFn = (preview) => spy(preview.params)

      let form = htmlFixture(`
        <form method="post" up-submit action="/action">
          <input type="text" name="email" value="foo@bar.com">
        </form>
      `)

      up.submit(form, { preview: previewFn })
      await wait()

      expect(spy.calls.mostRecent().args[0]).toEqual(jasmine.any(up.Params))
      expect(spy.calls.mostRecent().args[0].get('email')).toBe('foo@bar.com')
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

    describe('when updating an existing layer', function() {

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

    })

    describe('when opening a new layer', function() {

      it('returns the string "new"', async function() {
        let spy = jasmine.createSpy('spy')
        let previewFn = (preview) => spy(preview.layer)

        up.render({ preview: previewFn, url: '/url', target: '#target', layer: 'new' })
        await wait()

        expect(spy).toHaveBeenCalledWith('new')
      })

      it('return the string "new" when opening with a shortcut like { layer: "new drawer" }', async function() {
        let spy = jasmine.createSpy('spy')
        let previewFn = (preview) => spy(preview.layer, preview.renderOptions.mode)

        up.render({ preview: previewFn, url: '/url', target: '#target', layer: 'new drawer' })
        await wait()

        expect(spy).toHaveBeenCalledWith('new', 'drawer')
      })

    })


  })

  describe('#renderOptions', function() {

    it('returns the options for the render pass being previewed', async function() {
      let spy = jasmine.createSpy('spy')
      let previewFn = (preview) => spy(preview.renderOptions)

      up.render({ preview: previewFn, url: '/url', target: 'body', scroll: '#scroll', focus: '#focus' })
      await wait()

      expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({ target: 'body', scroll: '#scroll', focus: '#focus' }))
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

  describe('#revalidating', function() {

    it('returns false when previewing an initial render pass', async function() {
      let spy = jasmine.createSpy('spy')
      let previewFn = (preview) => spy(preview.revalidating)

      up.render({ preview: previewFn, url: '/url', target: 'body' })
      await wait()

      expect(spy).toHaveBeenCalledWith(false)
    })

    it('returns true when previewing a revalidation pass', async function() {
      fixture('#target', { text: 'old target' })
      await jasmine.populateCache('/path', '<div id="target">cached target</div>')
      expect(jasmine.Ajax.requests.count()).toEqual(1)
      expect(up.network.isBusy()).toBe(false)

      up.cache.expire()

      expect({ url: '/path' }).toBeCached()
      expect({ url: '/path' }).toBeExpired()

      let spy = jasmine.createSpy('spy')
      let revalidatePreviewFn = (preview) => spy(preview.revalidating, preview.expiredResponse)

      up.render({ revalidatePreview: revalidatePreviewFn, url: '/path', target: '#target', cache: true, revalidate: true })
      await wait()

      expect(jasmine.Ajax.requests.count()).toEqual(2)
      expect(up.network.isBusy()).toBe(true)
      expect('#target').toHaveText('cached target')

      expect(spy).toHaveBeenCalledWith(true, jasmine.any(up.Response))

      jasmine.respondWithSelector('#target', { text: 'revalidated target' })
      await wait()

      expect('#target').toHaveText('revalidated target')
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

    it('accepts an selector for the element', async function() {
      fixture('#target')
      let element = fixture('#element[foo="old-foo"]')
      let previewFn = (preview) => preview.setAttrs('#element', { foo: 'new-foo', bar: 'new-bar' })

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(element).toHaveAttribute('foo', 'new-foo')
      expect(element).toHaveAttribute('bar', 'new-bar')
    })

    it('assumes the targeted fragment if no element is given', async function() {
      let target = fixture('#target[foo=old-foo]')
      let previewFn = (preview) => preview.setAttrs({ foo: 'new-foo', bar: 'new-bar' })

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(target).toHaveAttribute('foo', 'new-foo')
      expect(target).toHaveAttribute('bar', 'new-bar')
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

    it('accepts an selector for the element', async function() {
      fixture('#target')
      let element = fixture('#element.foo')
      let previewFn = (preview) => preview.addClass('#element', 'bar')

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(element).toHaveClass('foo')
      expect(element).toHaveClass('bar')
    })

    it('assumes the targeted fragment if no element is given', async function() {
      let target = fixture('#target.foo')
      let previewFn = (preview) => preview.addClass('bar')

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(target).toHaveClass('foo')
      expect(target).toHaveClass('bar')
    })

  })

  describe('#removeClass()', function() {

    it('temporarily removes a class from an element', async function() {
      fixture('#target')
      let element = fixture('#element.foo.bar')
      let previewFn = (preview) => preview.removeClass(element, 'bar')

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(element).toHaveClass('foo')
      expect(element).not.toHaveClass('bar')

      jasmine.respondWithSelector('#target')
      await wait()

      expect(element).toHaveClass('foo')
      expect(element).toHaveClass('bar')
    })

    it('accepts an selector for the element', async function() {
      fixture('#target')
      let element = fixture('#element.foo.bar')
      let previewFn = (preview) => preview.removeClass('#element', 'bar')

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(element).toHaveClass('foo')
      expect(element).not.toHaveClass('bar')
    })

    it('assumes the targeted fragment if no element is given', async function() {
      let target = fixture('#target.foo.bar')
      let previewFn = (preview) => preview.removeClass('bar')

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(target).toHaveClass('foo')
      expect(target).not.toHaveClass('bar')
    })

  })

  describe('#setStyle()', function() {

    it('temporarily sets inline styles on an element', async function() {
      fixture('#target')
      let element = fixture('#element', { style: { 'font-size': '10px' } })
      let previewFn = (preview) => preview.setStyle(element, { 'font-size': '15px', 'margin-top': '20px' })

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(element).toHaveInlineStyle({ 'font-size': '15px', 'margin-top': '20px' })

      jasmine.respondWithSelector('#target')
      await wait()

      expect(element).toHaveInlineStyle({ 'font-size': '10px' })
      expect(element).not.toHaveInlineStyle('margin-top')
    })

    it('accepts an selector for the element', async function() {
      fixture('#target')
      let element = fixture('#element', { style: { 'font-size': '10px' } })
      let previewFn = (preview) => preview.setStyle('#element', { 'font-size': '15px', 'margin-top': '20px' })

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(element).toHaveInlineStyle({ 'font-size': '15px', 'margin-top': '20px' })
    })

    it('assumes the targeted fragment if no element is given', async function() {
      let target = fixture('#target', { style: { 'font-size': '10px' } })
      let previewFn = (preview) => preview.setStyle({ 'font-size': '15px', 'margin-top': '20px' })

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(target).toHaveInlineStyle({ 'font-size': '15px', 'margin-top': '20px' })
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

    it('accepts an selector for the element', async function() {
      fixture('#target')
      let input = fixture('input#input[type=text][name=foo]')
      let previewFn = (preview) => preview.disable('#input')

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(input).toBeDisabled()
    })

    it('assumes the targeted fragment if no element is given', async function() {
      let input = fixture('input#input[type=text][name=foo]')
      let previewFn = (preview) => preview.disable()

      up.render({ preview: previewFn, url: '/url', target: '#input' })
      await wait()

      expect(input).toBeDisabled()
    })

    it('restores an element that lost focus, and its scroll positions and selection range when reverting', async function() {
      let target = fixture('#target')
      let parent = fixture(`form#parent`)
      let longText =
        "foooooooooooo\n" +
        "baaaaaaaaaaar\n" +
        "baaaaaaaaaaaz\n" +
        "baaaaaaaaaaam\n" +
        "quuuuuuuuuuux\n" +
        "foooooooooooo\n" +
        "baaaaaaaaaaar\n" +
        "baaaaaaaaaaaz\n" +
        "baaaaaaaaaaam\n" +
        "quuuuuuuuuuux\n"

      let field = e.affix(parent, 'textarea[name=prose][wrap=off][rows=3][cols=6]', { text: longText })
      field.focus()

      field.selectionStart = 10
      field.selectionEnd = 11
      field.scrollTop = 12
      field.scrollLeft = 13
      expect(field).toBeFocused()

      let previewFn = (preview) => preview.disable('#parent')

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(parent).toBeVisible()
      expect(field).toBeVisible()
      expect(field).toBeDisabled()

      jasmine.respondWithSelector('#target')

      expect(parent).toBeVisible()
      expect(field).toBeVisible()
      expect(field).not.toBeDisabled()
      expect(field).toBeFocused()
      expect(field.selectionStart).toBeAround(10, 2)
      expect(field.selectionEnd).toBeAround(11, 2)
      expect(field.scrollTop).toBeAround(12, 2)
      expect(field.scrollLeft).toBeAround(13, 2)
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

    it('accepts an selector for the element', async function() {
      fixture('#target')
      let reference = fixture('#reference')
      let newChild = e.createFromSelector('#new-child')
      let previewFn = (preview) => preview.insert('#reference', newChild)

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(newChild).toBeAttached()
      expect(newChild.parentElement).toBe(reference)
    })

    it('assumes the targeted fragment if no element is given', async function() {
      let reference = fixture('#reference')
      let newChild = e.createFromSelector('#new-child')
      let previewFn = (preview) => preview.insert(newChild)

      up.render({ preview: previewFn, url: '/url', target: '#reference' })
      await wait()

      expect(newChild).toBeAttached()
      expect(newChild.parentElement).toBe(reference)
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

    it('accepts an selector for the element', async function() {
      fixture('#target')
      let element = fixture('#element[hidden]')
      let previewFn = (preview) => preview.show('#element')

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(element).toBeVisible()
    })

    it('assumes the targeted fragment if no element is given', async function() {
      let target = fixture('#target[hidden]')
      let previewFn = (preview) => preview.show()

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(target).toBeVisible()
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

    it('accepts an selector for the element', async function() {
      fixture('#target')
      let element = fixture('#element')
      let previewFn = (preview) => preview.hide('#element')

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(element).toBeHidden()
    })

    it('assumes the targeted fragment if no element is given', async function() {
      let target = fixture('#target')
      let previewFn = (preview) => preview.hide()

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(target).toBeHidden()
    })

  })

  describe('#run(String)', function() {

    it('runs another named preview with an empty data object', async function() {
      let preview2Fn = jasmine.createSpy('preview2Fn')
      let preview1Fn = jasmine.createSpy('preview1Fn').and.callFake(function(preview) {
        preview.run('preview2')
      })

      up.preview('preview1', preview1Fn)
      up.preview('preview2', preview2Fn)

      up.render({ preview: preview1Fn, url: '/url', target: 'body' })
      await wait()

      expect(preview1Fn).toHaveBeenCalledWith(jasmine.any(up.Preview), {})
      expect(preview2Fn).toHaveBeenCalledWith(preview1Fn.calls.mostRecent().args[0], {})
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

    it('runs with the correct up.layer.current when rendering in a background layer', async function() {
      makeLayers(2)
      expect(up.layer.current).toBe(up.layer.get(1))

      let layerSpy = jasmine.createSpy('layer spy')

      let previewFn = jasmine.createSpy('previewFn').and.callFake(function(_preview) {
        layerSpy(up.layer.current)
      })

      up.preview('preview', previewFn)

      up.render({ preview: previewFn, url: '/url', target: 'body', layer: 'root' })
      await wait()

      expect(layerSpy).toHaveBeenCalledWith(up.layer.root)
    })

    it('reports an error (but does not crash) when called with an unknown preview name', async function() {
      let previewFn = jasmine.createSpy('previewFn').and.callFake(function(preview) {
        preview.run('typo')
      })

      up.preview('preview', previewFn)

      await jasmine.expectGlobalError('Unknown preview "typo"', async function() {
        up.render({ preview: previewFn, url: '/url', target: 'body' })
        await wait()
      })
    })

    it('accepts an additional argument that is on to the preview function', async function() {
      let preview2Fn = jasmine.createSpy('preview2Fn')
      let preview1Fn = jasmine.createSpy('preview1Fn').and.callFake(function(preview) {
        preview.run('preview2', { key: 'value' })
      })

      up.preview('preview1', preview1Fn)
      up.preview('preview2', preview2Fn)

      up.render({ preview: preview1Fn, url: '/url', target: 'body' })
      await wait()

      expect(preview2Fn).toHaveBeenCalledWith(jasmine.any(up.Preview), { key: 'value' })
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

      expect(preview1Fn).toHaveBeenCalledWith(jasmine.any(up.Preview), {})
      expect(preview2Fn).toHaveBeenCalledWith(preview1Fn.calls.mostRecent().args[0], {})
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

    it('does not run revert effects twice when a preview function is run from an auto-returning arrow expression', async function() {
      fixture('#target')

      let preview1Undo = jasmine.createSpy('preview1 undo')
      let preview1Apply = jasmine.createSpy('preview1 apply').and.callFake(function(preview) {
        return preview1Undo
      })
      let autoReturningExpression = (preview) => preview.run(preview1Apply)

      up.render({ preview: autoReturningExpression, url: '/url', target: '#target' })
      await wait()

      expect(preview1Apply.calls.count()).toBe(1)
      expect(preview1Undo.calls.count()).toBe(0)

      jasmine.respondWithSelector('#target')
      await wait()

      expect(preview1Apply.calls.count()).toBe(1)
      expect(preview1Undo.calls.count()).toBe(1)
    })

    it('accepts additional arguments that are passed on to the preview function', async function() {
      let preview2Fn = jasmine.createSpy('preview2Fn')
      let preview1Fn = jasmine.createSpy('preview1Fn').and.callFake(function(preview) {
        preview.run(preview2Fn, { foo: 'bar' })
      })

      up.render({ preview: preview1Fn, url: '/url', target: 'body' })
      await wait()

      expect(preview2Fn).toHaveBeenCalledWith(jasmine.any(up.Preview), { foo: 'bar' })
    })


  })

  describe('#showPlaceholder()', function() {

    describe('reference argument', function() {

      it('inserts the given placeholder element as a child of the given reference element, hiding its other children', async function() {
        fixture('#target')
        let parent = htmlFixture(`
          <div id="parent">
            <div id="child1"></div>
            <div id="child2"></div>
          </div>
        `)

        let placeholder = e.createFromSelector('#placeholder')
        let previewFn = (preview) => preview.showPlaceholder(parent, placeholder)

        up.render({ preview: previewFn, url: '/url', target: '#target' })
        await wait()

        expect('#parent').toBeVisible()
        expect(placeholder.parentElement).toBe(parent)
        expect('#child1').toBeHidden()
        expect('#child2').toBeHidden()

        jasmine.respondWithSelector('#target')
        await wait()

        expect('#parent').toBeVisible()
        expect('#child1').toBeVisible()
        expect('#child2').toBeVisible()
      })

      it('can show a placeholder when the reference contains text node children', async function() {
        fixture('#target')
        let parent = htmlFixture(`
          <div id="parent">
            text
            <div id="child">element</div>
          </div>
        `)

        expect('#parent').toHaveVisibleText('text element')

        let placeholder = e.createFromSelector('#placeholder', { text: 'placeholder' })
        let previewFn = (preview) => preview.showPlaceholder(parent, placeholder)

        up.render({ preview: previewFn, url: '/url', target: '#target' })
        await wait()

        expect('#parent').toHaveVisibleText('placeholder')

        jasmine.respondWithSelector('#target')
        await wait()

        expect('#parent').toHaveVisibleText('text element')
      })

      it('accepts a CSS selector to look up the reference', async function() {
        fixture('#target')
        let parent = htmlFixture(`
          <div id="parent">
            <div id="child1"></div>
            <div id="child2"></div>
          </div>
        `)

        let placeholder = e.createFromSelector('#placeholder')
        let previewFn = (preview) => preview.showPlaceholder('#parent', placeholder)

        up.render({ preview: previewFn, url: '/url', target: '#target' })
        await wait()

        expect('#parent').toBeVisible()
        expect(placeholder.parentElement).toBe(parent)
        expect('#child1').toBeHidden()
        expect('#child2').toBeHidden()

        jasmine.respondWithSelector('#target')
        await wait()

        expect('#parent').toBeVisible()
        expect('#child1').toBeVisible()
        expect('#child2').toBeVisible()
      })

      it('shows the placeholder within the targeted fragment if no reference is given', async function() {
        let target = htmlFixture(`
          <div id="target">
            <div id="old-child">old child</div>
          </div>
        `)

        let placeholder = e.createFromSelector('#placeholder')
        let previewFn = (preview) => preview.showPlaceholder(placeholder)

        up.render({ preview: previewFn, url: '/url', target: '#target', feedback: true })
        await wait()

        expect('#target').toBeVisible()
        expect('#target').toBeAttached()
        expect('#target').toHaveClass('up-loading')
        expect(placeholder.parentElement).toBe(target)
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

    describe('placeholder argument', function() {

      it('compiles the given placeholder element', async function() {
        let placeholderCompiler = jasmine.createSpy('placeholder compiler')
        up.compiler('#placeholder', placeholderCompiler)

        fixture('#target')
        let parent = htmlFixture(`
          <div id="parent">
            <div id="child"></div>
          </div>
        `)

        let placeholder = up.element.createFromHTML(`<div id="placeholder">placeholder</div>`)
        let previewFn = (preview) => preview.showPlaceholder(parent, placeholder)

        up.render({ preview: previewFn, url: '/url', target: '#target' })
        await wait()

        expect('#parent').toHaveSelector('#placeholder')
        expect('#parent').not.toHaveSelector('#placeholder-template')
        expect('#child').toBeHidden()
        expect(placeholderCompiler).toHaveBeenCalledWith(placeholder, jasmine.anything(), jasmine.anything())

        jasmine.respondWithSelector('#target')
        await wait()

        expect('#parent').not.toHaveSelector('#placeholder')
        expect('#child').toBeVisible()
      })

      it('clones a template element passed as a placeholder', async function() {
        let placeholderCompiler = jasmine.createSpy('placeholder compiler')
        up.compiler('#placeholder', placeholderCompiler)

        fixture('#target')
        let parent = htmlFixture(`
          <div id="parent">
            <div id="child"></div>
          </div>
        `)

        let placeholderTemplate = htmlFixture(`
          <template id="placeholder-template">
            <div id="placeholder">placeholder</div>
          </template>
        `)
        let previewFn = (preview) => preview.showPlaceholder(parent, placeholderTemplate)

        up.render({ preview: previewFn, url: '/url', target: '#target' })
        await wait()

        expect('#parent').toHaveSelector('#placeholder')
        expect('#parent').not.toHaveSelector('#placeholder-template')
        expect('#child').toBeHidden()
        expect(placeholderCompiler).toHaveBeenCalledWith(jasmine.elementMatchingSelector('#placeholder'), jasmine.anything(), jasmine.anything())

        jasmine.respondWithSelector('#target')
        await wait()

        expect('#parent').not.toHaveSelector('#placeholder')
        expect('#child').toBeVisible()
      })

      it('accepts the placeholder as a string of HTML (needs to start with "<")', async function() {
        fixture('#target')
        let parent = htmlFixture(`
          <div id="parent">
            <div id="child"></div>
          </div>
        `)

        let previewFn = (preview) => preview.showPlaceholder(parent, `<div id="placeholder">placeholder</div>`)

        up.render({ preview: previewFn, url: '/url', target: '#target' })
        await wait()

        expect('#parent').toHaveSelector('#placeholder')
        expect('#child').toBeHidden()

        jasmine.respondWithSelector('#target')
        await wait()

        expect('#parent').not.toHaveSelector('#placeholder')
        expect('#child').toBeVisible()
      })

      it('accepts a selector for a placeholder <template>', async function() {
        let placeholderCompiler = jasmine.createSpy('placeholder compiler')
        up.compiler('#placeholder', placeholderCompiler)

        fixture('#target')
        let parent = htmlFixture(`
          <div id="parent">
            <div id="child"></div>
          </div>
        `)

        htmlFixture(`
          <template id="placeholder-template">
            <div id="placeholder">placeholder</div>
          </template>
        `)
        let previewFn = (preview) => preview.showPlaceholder(parent, '#placeholder-template')

        up.render({ preview: previewFn, url: '/url', target: '#target' })
        await wait()

        expect('#parent').toHaveSelector('#placeholder')
        expect('#parent').not.toHaveSelector('#placeholder-template')
        expect('#child').toBeHidden()
        expect(placeholderCompiler).toHaveBeenCalledWith(jasmine.elementMatchingSelector('#placeholder'), jasmine.anything(), jasmine.anything())

        jasmine.respondWithSelector('#target')
        await wait()

        expect('#parent').not.toHaveSelector('#placeholder')
        expect('#child').toBeVisible()
      })

      it('accepts a template selector and a JSON object that will become the compile data of the cloned element', async function() {
        let placeholderCompiler = jasmine.createSpy('placeholder compiler')
        up.compiler('#placeholder', placeholderCompiler)

        fixture('#target')
        let parent = htmlFixture(`
          <div id="parent">
            <div id="child"></div>
          </div>
        `)

        htmlFixture(`
          <template id="placeholder-template">
            <div id="placeholder" data-key-from-template="foo">placeholder</div>
          </template>
        `)
        let previewFn = (preview) => preview.showPlaceholder(parent, '#placeholder-template { keyFromMethod: "bar" }')

        up.render({ preview: previewFn, url: '/url', target: '#target' })
        await wait()

        expect('#parent').toHaveSelector('#placeholder')
        expect('#parent').not.toHaveSelector('#placeholder-template')
        expect('#child').toBeHidden()
        const expectedData = { keyFromTemplate: 'foo', keyFromMethod: 'bar' }
        expect(placeholderCompiler).toHaveBeenCalledWith(jasmine.elementMatchingSelector('#placeholder'), expectedData, jasmine.anything())

        jasmine.respondWithSelector('#target')
        await wait()

        expect('#parent').not.toHaveSelector('#placeholder')
        expect('#child').toBeVisible()
      })

      it('prefers a placeholder selector match in the origin layer', async function() {
        makeLayers(2)
        let rootPlaceholder = e.createFromSelector('template.placeholder-template', { content: '<span>root placeholder</span>' })
        document.body.prepend(rootPlaceholder)
        registerFixture(rootPlaceholder)

        let originPlaceholder = up.layer.get(1).affix('template.placeholder-template', { content: '<span>origin placeholder</span>' })

        expect(rootPlaceholder.compareDocumentPosition(originPlaceholder)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)

        up.layer.get(1).affix('#target', { text: 'old target' })

        let previewFn = (preview) => preview.showPlaceholder('#target', '.placeholder-template')

        up.render({ preview: previewFn, url: '/url', target: '#target', origin: up.layer.current.element })
        await wait()

        expect('#target').toHaveVisibleText('origin placeholder')

        jasmine.respondWithSelector('#target', { text: 'new target' })
        await wait()

        expect('#target').toHaveVisibleText('new target')
      })

      it("matches a placeholder selector in the root layer if it doesn't match in the origin layer", async function() {
        makeLayers(2)
        up.layer.get(0).affix('template.placeholder-template', { content: '<span>root placeholder</span>' })
        up.layer.get(1).affix('#target', { text: 'old target' })

        let previewFn = (preview) => preview.showPlaceholder('#target', '.placeholder-template')

        up.render({ preview: previewFn, url: '/url', target: '#target', origin: up.layer.current.element })
        await wait()

        expect('#target').toHaveVisibleText('root placeholder')

        jasmine.respondWithSelector('#target', { text: 'new target' })
        await wait()

        expect('#target').toHaveVisibleText('new target')
      })

    })

    describe('when previewing a new overlay', function() {

      it("shows the placeholder in a new overlay with the same visual layer options as the current render pass", async function() {
        let placeholder = e.createFromHTML('<div id="placeholder">placeholder content</div>')

        up.render({ placeholder, url: '/url', target: '#target', layer: 'new', mode: 'drawer', size: 'large', position: 'right' })
        await wait()

        expect(up.layer.count).toBe(2)
        expect(up.layer.current.mode).toBe('drawer')
        expect(up.layer.current.size).toBe('large')
        expect(up.layer.current.position).toBe('right')
        expect(up.layer.current.getFirstSwappableElement()).toMatchSelector('#target')
        expect(up.layer.current.getFirstSwappableElement().children[0]).toBe(placeholder)

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

        let previewFn = (preview) => preview.showPlaceholder('<div>preview content</div>')

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

    it('can hide text nodes', async function() {
      fixture('#target')
      let parent = htmlFixture(`
        <div id="parent">
          text1
          <span>element1</span>
          text2
          <span>element2</span>
        </div>
      `)

      expect('#parent').toHaveVisibleText('text1 element1 text2 element2')

      let previewFn = (preview) => preview.hideContent(parent)

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect('#parent').toHaveVisibleText('')

      jasmine.respondWithSelector('#target')
      await wait()

      expect('#parent').toHaveVisibleText('text1 element1 text2 element2')
    })

    it('accepts an selector for the element', async function() {
      fixture('#target')
      let parent = htmlFixture(`
        <div id="parent">
          <div id="child1"></div>
          <div id="child2"></div>
        </div>
      `)

      let previewFn = (preview) => preview.hideContent('#parent')

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect('#parent').toBeVisible()
      expect('#child1').toBeHidden()
      expect('#child2').toBeHidden()
    })

    it('assumes the targeted fragment if no element is given', async function() {
      let parent = htmlFixture(`
        <div id="parent">
          <div id="child1"></div>
          <div id="child2"></div>
        </div>
      `)

      let previewFn = (preview) => preview.hideContent()

      up.render({ preview: previewFn, url: '/url', target: '#parent' })
      await wait()

      expect('#parent').toBeVisible()
      expect('#child1').toBeHidden()
      expect('#child2').toBeHidden()
    })

    it('restores an element that lost focus, and its scroll positions and selection range when reverting', async function() {
      let target = fixture('#target')
      let parent = fixture(`form#parent`)
      let longText =
        "foooooooooooo\n" +
        "baaaaaaaaaaar\n" +
        "baaaaaaaaaaaz\n" +
        "baaaaaaaaaaam\n" +
        "quuuuuuuuuuux\n" +
        "foooooooooooo\n" +
        "baaaaaaaaaaar\n" +
        "baaaaaaaaaaaz\n" +
        "baaaaaaaaaaam\n" +
        "quuuuuuuuuuux\n"

      let field = e.affix(parent, 'textarea[name=prose][wrap=off][rows=3][cols=6]', { text: longText })
      field.focus()

      field.selectionStart = 10
      field.selectionEnd = 11
      field.scrollTop = 12
      field.scrollLeft = 13
      expect(field).toBeFocused()

      let previewFn = (preview) => preview.hideContent('#parent')

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(parent).toBeVisible()
      expect(field).toBeHidden()

      jasmine.respondWithSelector('#target')

      expect(parent).toBeVisible()
      expect(field).toBeVisible()
      expect(field).toBeFocused()
      expect(field.selectionStart).toBeAround(10, 2)
      expect(field.selectionEnd).toBeAround(11, 2)
      expect(field.scrollTop).toBeAround(12, 2)
      expect(field.scrollLeft).toBeAround(13, 2)
    })

  })


  describe('#swapContent()', function() {

    it('temporarily swaps the child elements of the given parent element', async function() {
      fixture('#target')
      let parent = htmlFixture(`
        <div id="parent">
          <p>original text</p>
        </div>
      `)

      expect('#parent').toHaveVisibleText('original text')

      let previewFn = (preview) => preview.swapContent(parent, '<p>swapped text</p>')
      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect('#parent').toBeVisible()
      expect('#parent').toHaveVisibleText('swapped text')

      jasmine.respondWithSelector('#target')
      await wait()

      expect('#parent').toHaveVisibleText('original text')
    })

    it('swaps children of the targeted fragment if no explicit parent is given', async function() {
      let parent = htmlFixture(`
        <div id="parent">
          original text
        </div>
      `)

      expect('#parent').toHaveVisibleText('original text')

      let previewFn = (preview) => preview.swapContent('swapped text')
      up.render({ preview: previewFn, url: '/url', target: '#parent' })
      await wait()

      expect('#parent').toHaveVisibleText('swapped text')

      jasmine.respondWithSelector('#parent', { text: 'server text' })
      await wait()

      expect('#parent').toHaveVisibleText('server text')
    })

    it('restores an element that lost focus, and its scroll positions and selection range when reverting', async function() {
      let target = fixture('#target')
      let parent = fixture(`form#parent`)
      let longText =
        "foooooooooooo\n" +
        "baaaaaaaaaaar\n" +
        "baaaaaaaaaaaz\n" +
        "baaaaaaaaaaam\n" +
        "quuuuuuuuuuux\n" +
        "foooooooooooo\n" +
        "baaaaaaaaaaar\n" +
        "baaaaaaaaaaaz\n" +
        "baaaaaaaaaaam\n" +
        "quuuuuuuuuuux\n"

      let field = e.affix(parent, 'textarea[name=prose][wrap=off][rows=3][cols=6]', { text: longText })
      field.focus()

      field.selectionStart = 10
      field.selectionEnd = 11
      field.scrollTop = 12
      field.scrollLeft = 13
      expect(field).toBeFocused()

      let previewFn = (preview) => preview.swapContent('#parent', 'temporary content')

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(parent).toBeVisible()
      expect(field).toBeHidden()

      jasmine.respondWithSelector('#target')

      expect(parent).toBeVisible()
      expect(field).toBeVisible()
      expect(field).toBeFocused()
      expect(field.selectionStart).toBeAround(10, 2)
      expect(field.selectionEnd).toBeAround(11, 2)
      expect(field.scrollTop).toBeAround(12, 2)
      expect(field.scrollLeft).toBeAround(13, 2)
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

      let renderJob = up.render({ preview: previewFn, url: '/url', target: '#target', layer: 'new' })
      await wait()

      expect(up.layer.count).toBe(2)
      expect(up.layer.current.getFirstSwappableElement()).toMatchSelector('#target')
      expect(up.layer.current.getFirstSwappableElement()).toHaveText('overlay content')

      jasmine.lastRequest().responseError()

      await expectAsync(renderJob).toBeRejectedWith(jasmine.any(up.Offline))

      expect(up.layer.count).toBe(1)
    })

    it('does not allow up:layer:dismiss listeners to prevent closing the overlay', async function() {
      fixture('#target', { text: 'old target' })
      let previewFn = (preview) => preview.openLayer('overlay content')
      up.on('up:layer:dismiss', (event) => event.preventDefault())

      up.render({ preview: previewFn, url: '/url', target: '#target', layer: 'current' })
      await wait()

      expect(up.layer.count).toBe(2)

      jasmine.respondWithSelector('#target', { text: 'new target' })

      await wait()

      expect(up.layer.count).toBe(1)
      expect('#target').toHaveText('new target')
    })

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

    it('does not let undo functions schedule more undo functions', async function() {
      fixture('#target')
      let recursiveFn = jasmine.createSpy('recursive undo fn')
      let undoFn = jasmine.createSpy('undo fn')
      let previewFn = jasmine.createSpy('preview apply').and.callFake(function(preview) {
        preview.undo(undoFn)
        preview.undo(function() {
          preview.undo(recursiveFn)
        })
      })

      up.render({ preview: previewFn, url: '/url', target: '#target' })
      await wait()

      expect(previewFn).toHaveBeenCalled()

      await jasmine.expectGlobalError('Preview used after end of request', async function() {
        jasmine.respondWithSelector('#target')
        await wait()

        expect(undoFn).toHaveBeenCalled()
        expect(recursiveFn).not.toHaveBeenCalled()
      })
    })

  })

})
