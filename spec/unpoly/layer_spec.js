const u = up.util
const e = up.element

describe('up.layer', function() {

  describe('JavaScript functions', function() {

    beforeEach(function() { // Provoke concurrency issues by enabling animations, but don't slow down tests too much
      up.motion.config.duration = 5
    })

    require('./layer_open_spec')

    describe('up.layer.build()', function() {

      it('merges all applicable layer configs')

      it('prioritizes the config for a particular mode over the config for all overlays or any modes')

      if (up.migrate.loaded) {
        it('prints a deprecation warning if the user configured { historyVisible } (which is now { history })', function() {
          up.layer.config.overlay.historyVisible = false
          const warnSpy = up.migrate.warn.mock()
          up.layer.build({ mode: 'drawer' })
          expect(warnSpy).toHaveBeenCalled()
        })
      }
    })

    describe('up.layer.accept()', function() {
      it('closes the current layer', function() {
        const acceptSpy = spyOn(up.layer.current, 'accept')
        up.layer.accept({ option: 'value' })
        expect(acceptSpy).toHaveBeenCalledWith({ option: 'value' })
      })
    })

    // There are more specs for up.Layer.Overlay#accept()

    describe('up.layer.dismiss()', function() {
      it('closes the current layer', function() {
        const dismissSpy = spyOn(up.layer.current, 'dismiss')
        up.layer.dismiss({ option: 'value' })
        expect(dismissSpy).toHaveBeenCalledWith({ option: 'value' })
      })
    })

    // There are more specs for up.Layer.Overlay#dismiss()

    describe('up.layer.dismissOverlays()', function() {

      it('dismisses all overlays', function() {
        makeLayers(3)

        expect(up.layer.count).toBe(3)

        up.layer.dismissOverlays()

        expect(up.layer.count).toBe(1)
        expect(up.layer.isRoot()).toBe(true)
      })

      it('manipulates the layer stack synchronously', function() {
        makeLayers(2)

        expect(up.layer.count).toBe(2)

        up.layer.dismissOverlays()

        expect(up.layer.count).toBe(1)
      })

      it('does nothing when no overlay is open', function() {
        const dismissOverlays = () => up.layer.dismissOverlays()
        expect(dismissOverlays).not.toThrowError()
      })

      it('stops dismissing overlays when any overlay prevents its dismissal', function() {
        makeLayers(5)
        // The third layer will prevent its dismissal
        up.layer.get(2).on('up:layer:dismiss', (event) => event.preventDefault())

        const dismissOverlays = () => up.layer.dismissOverlays()
        expect(dismissOverlays).toAbort()

        expect(up.layer.count).toBe(3)
      })
    })

    describe('up.layer.get()', function() {

      describe('for an element', function() {

        it("returns the element's layer", function() {
          makeLayers(3)
          expect(up.layer.get(up.layer.get(1).element)).toBe(up.layer.get(1))
        })

        it('returns a missing value if the element is detached', function() {
          const element = e.createFromSelector('.element')
          expect(element).toBeDetached()

          expect(up.layer.get(element)).toBeMissing()
        })

        it('returns a missing value for an element attached to a closed layer', async function() {
          const overlay = await up.layer.open({ fragment: '<div id="foo"></div' })
          expect(up.layer.isOverlay()).toBe(true)
          const elementInClosingOverlay = overlay.getFirstSwappableElement()
          expect(elementInClosingOverlay.id).toBe('foo')

          up.layer.accept(null, { animation: false })

          await wait(50)

          expect(document).not.toHaveSelector('up-modal')
          expect(up.layer.get(elementInClosingOverlay)).toBeMissing()
        })

        it('returns a missing value for an element attached to a closing layer that is still in its close animation', async function() {
          const overlay = await up.layer.open({ fragment: '<div id="foo"></div' })
          expect(up.layer.isOverlay()).toBe(true)
          const elementInClosingOverlay = overlay.getFirstSwappableElement()
          expect(elementInClosingOverlay.id).toBe('foo')

          up.layer.accept(null, { animation: 'fade-out', duration: 200 })

          await wait(50)

          expect(document).toHaveSelector('up-modal.up-destroying')
          expect(up.layer.get(elementInClosingOverlay)).toBeMissing()
        })
      })

      describe('for an up.Layer', function() {
        it('returns the given layer', function() {
          makeLayers(3)
          const layer = up.layer.get(1)
          expect(layer).toEqual(jasmine.any(up.Layer))
          expect(up.layer.get(layer)).toBe(layer)
        })
      })

      describe('for a layer name like "parent"', function() {
        it('returns the layer matching that name', function() {
          makeLayers(2)
          expect(up.layer.get('parent')).toBe(up.layer.root)
        })
      })

      describe('for a number', function() {

        it('returns the layer with the given index', function() {
          makeLayers(2)

          const [root, overlay] = up.layer.stack

          expect(up.layer.get(0)).toBe(root)
          expect(up.layer.get(1)).toBe(overlay)
        })

        it('returns a missing value if no layer with the given index exists', function() {
          makeLayers(2)

          expect(up.layer.get(2)).toBeMissing()
        })
      })

      describe('for undefined', function() {
        it('returns the current layer', function() {
          makeLayers(2)

          expect(up.layer.get(undefined)).toBe(up.layer.front)
        })
      })
    })

    describe('up.layer.stack', function() {
      it('returns an array-like object of all layers, starting with the root layer, for easy access to the entire stack', function() {
        makeLayers(2)
        expect(up.layer.count).toBe(2)
        expect(up.layer.stack[0]).toBe(up.layer.root)
        expect(up.layer.stack[1]).toBe(up.layer.front)
      })
    })

    describe('up.layer.count', function() {

      it('returns 1 if no overlay is open', function() {
        expect(up.layer.count).toBe(1)
      })

      it('returns 2 if one overlay is open', function() {
        makeLayers(2)

        expect(up.layer.count).toBe(2)
      })
    })

    describe('up.layer.getAll()', function() {

      describe('for "any"', function() {

        it('returns a reversed list of all layers', function() {
          makeLayers(3)
          expect(up.layer.getAll('any')).toEqual([up.layer.get(2), up.layer.get(1), up.layer.get(0)])
        })

        it('returns the current layer first so that is preferred for element lookups', function() {
          makeLayers(3)
          up.layer.get(1).asCurrent(() => expect(up.layer.getAll('any')).toEqual([up.layer.get(1), up.layer.get(2), up.layer.get(0)]))
        })
      })

      describe('for an element', function() {
        it("returns an array of the given element's layer", function() {
          makeLayers(3)
          expect(up.layer.getAll(up.layer.get(1).element)).toEqual([up.layer.get(1)])
        })
      })

      describe('for an up.Layer', function() {
        it('returns an array of the given up.Layer', function() {
          makeLayers(3)
          const layer = up.layer.get(1)
          expect(layer).toEqual(jasmine.any(up.Layer))
          expect(up.layer.getAll(layer)).toEqual([layer])
        })
      })

      describe('for an array of up.Layer objects', function() {
        it('returns an array with the same objects', function() {
          makeLayers(3)
          const array = [up.layer.get(1), up.layer.get(2)]
          expect(up.layer.getAll(array)).toEqual([up.layer.get(1), up.layer.get(2)])
        })
      })

      describe('for "new"', function() {
        it('returns ["new"], which is useful for passing through the { layer } option when opening a new layer', function() {
          expect(up.layer.getAll('new')).toEqual(['new'])
        })
      })

      describe('for "closest"', function() {

        it('returns the current layer and its ancestors', function() {
          makeLayers(3)
          expect(up.layer.getAll('closest')).toEqual([up.layer.get(2), up.layer.get(1), up.layer.get(0)])
        })

        it('honors a temporary current layer', function() {
          makeLayers(3)
          up.layer.get(1).asCurrent(() => expect(up.layer.getAll('closest')).toEqual([up.layer.get(1), up.layer.get(0)]))
        })
      })

      describe('for "parent"', function() {

        it("returns an array of the current layer's parent layer", function() {
          makeLayers(3)
          expect(up.layer.getAll('parent')).toEqual([up.layer.get(1)])
        })

        it('returns an empty array if the current layer is the root layer', function() {
          expect(up.layer.getAll('parent')).toEqual([])
        })

        it('honors a temporary current layer', function() {
          makeLayers(3)
          up.layer.get(1).asCurrent(() => expect(up.layer.getAll('parent')).toEqual([up.layer.get(0)]))
        })
      })

      describe('for "child"', function() {

        it("returns an array of the current layer's child layer", function() {
          makeLayers(3)
          up.layer.root.asCurrent(() => expect(up.layer.getAll('child')).toEqual([up.layer.get(1)]))
        })

        it('returns an empty array if the current layer is the front layer', function() {
          expect(up.layer.getAll('child')).toEqual([])
        })
      })

      describe('for "descendant"', function() {
        it("returns the current layer's descendant layers", function() {
          makeLayers(4)
          up.layer.get(1).asCurrent(() => expect(up.layer.getAll('descendant')).toEqual([up.layer.get(2), up.layer.get(3)]))
        })
      })

      describe('for "subtree"', function() {
        it("returns the current layer and its descendant layers", function() {
          makeLayers(3)
          up.layer.get(1).asCurrent(() => expect(up.layer.getAll('subtree')).toEqual([up.layer.get(1), up.layer.get(2)]))
        })
      })

      describe('for "ancestor"', function() {

        it("returns the current layer's ancestor layers", function() {
          makeLayers(3)
          expect(up.layer.getAll('ancestor')).toEqual([up.layer.get(1), up.layer.get(0)])
        })

        it('honors a temporary current layer', function() {
          makeLayers(3)
          up.layer.get(1).asCurrent(() => expect(up.layer.getAll('ancestor')).toEqual([up.layer.get(0)]))
        })
      })

      describe('for "root"', function() {
        it("returns an array of the root layer", function() {
          makeLayers(2)
          expect(up.layer.getAll('root')).toEqual([up.layer.root])
        })
      })

      if (up.migrate.loaded) {
        describe('for "page"', function() {
          it("returns an array of the root layer, which used to be called 'page' in older Unpoly versions", function() {
            makeLayers(2)
            expect(up.layer.getAll('page')).toEqual([up.layer.root])
          })
        })
      }

      describe('for "front"', function() {

        it("returns an array of the front layer", function() {
          makeLayers(2)
          expect(up.layer.getAll('front')).toEqual([up.layer.get(1)])
        })

        it("is not affected by a temporary current layer", function() {
          makeLayers(2)
          up.layer.root.asCurrent(() => expect(up.layer.getAll('front')).toEqual([up.layer.get(1)]))
        })
      })

      describe('for "origin"', function() {

        it("returns an array of the layer of the { origin } element", function() {
          makeLayers(3)
          expect(up.layer.getAll('origin', { origin: up.layer.get(1).element })).toEqual([up.layer.get(1)])
        })

        it("returns an empty list if if no { origin } was passed", function() {
          expect(up.layer.getAll('origin')).toEqual([])
        })
      })

      describe('for "current"', function() {

        it("returns an array of the front layer", function() {
          makeLayers(2)
          expect(up.layer.getAll('current')).toEqual([up.layer.get(1)])
        })

        it("returns an array of a { baseLayer } option", function() {
          makeLayers(2)
          expect(up.layer.getAll('current', { baseLayer: up.layer.root })).toEqual([up.layer.root])
        })

        it('honors a temporary current layer', function() {
          makeLayers(2)
          up.layer.root.asCurrent(() => expect(up.layer.getAll('current')).toEqual([up.layer.root]))
        })
      })

      describe('for an options object with { layer } property', function() {
        it('allows to pass the layer value as a { layer } option instead of a first argument', function() {
          makeLayers(3)
          expect(up.layer.getAll({ layer: up.layer.get(1) })).toEqual([up.layer.get(1)])
        })
      })

      describe('for multiple space-separated layer names', function() {

        it("returns an array of the matching layers", function() {
          makeLayers(3)
          expect(up.layer.getAll('parent root')).toEqual([up.layer.get(1), up.layer.root])
        })

        it('omits layers that do not exist', function() {
          expect(up.layer.getAll('parent root')).toEqual([up.layer.root])
        })
      })

      describe('for multiple comma-separated layer names', function() {

        it("returns an array of the matching layers", function() {
          makeLayers(3)
          expect(up.layer.getAll('parent, root')).toEqual([up.layer.get(1), up.layer.root])
        })

        it('omits layers that do not exist', function() {
          expect(up.layer.getAll('parent, root')).toEqual([up.layer.root])
        })
      })

      if (up.migrate.loaded) {
        describe('for multiple or-separated layer names', function() {

          it("returns an array of the matching layers", function() {
            makeLayers(3)
            expect(up.layer.getAll('parent or root')).toEqual([up.layer.get(1), up.layer.root])
          })

          it('omits layers that do not exist', function() {
            expect(up.layer.getAll('parent or root')).toEqual([up.layer.root])
          })
        })
      }

      describe('for an options object without { layer } property', function() {

        it('behaves like "any" and returns a reversed list of all layers', function() {
          makeLayers(3)
          expect(up.layer.getAll('any')).toEqual([up.layer.get(2), up.layer.get(1), up.layer.get(0)])
        })

        it('behaves like "any" and returns the current layer first so that is preferred for element lookups', function() {
          makeLayers(3)
          up.layer.get(1).asCurrent(() => expect(up.layer.getAll('any')).toEqual([up.layer.get(1), up.layer.get(2), up.layer.get(0)]))
        })
      })

      describe('{ baseLayer } option', function() {

        it('allows to change the current layer for the purpose of the lookup', function() {
          makeLayers(3)
          expect(up.layer.getAll('parent', { baseLayer: up.layer.get(1) })).toEqual([up.layer.get(0)])
        })

        it('looks up the { baseLayer } option if it is a string, using the actual current layer as the base for that second lookup', function() {
          makeLayers(3)
          expect(up.layer.getAll('parent', { baseLayer: 'front' })).toEqual([up.layer.get(1)])
        })
      })
    })

    describe('up.layer.ask()', function() {

      it('opens a new overlay and returns a promise that fulfills when that overlay is accepted', async function() {
        up.motion.config.enabled = false

        const promise = up.layer.ask({ content: 'Would you like to accept?' })

        await wait()

        expect(up.layer.isOverlay()).toBe(true)
        expect(up.layer.current).toHaveText(`
          Would you like to accept?
        `)

        await expectAsync(promise).toBePending()

        up.layer.accept('acceptance value')

        await expectAsync(promise).toBeResolvedTo('acceptance value')
      })

      it('opens a new overlay and returns a promise that rejects when that overlay is dismissed', async function() {
        up.motion.config.enabled = false

        const promise = up.layer.ask({ content: 'Would you like to accept?' })

        await wait()

        expect(up.layer.isOverlay()).toBe(true)
        expect(up.layer.current).toHaveText(`
          Would you like to accept?
        `)

        await expectAsync(promise).toBePending()

        up.layer.dismiss('dismissal value')

        await expectAsync(promise).toBeRejectedWith('dismissal value')
      })
    })

    describe('up.layer.current', function() {

      it('returns the front layer', async function() {
        expect(up.layer.current).toBe(up.layer.root)

        await up.layer.open()
        expect(up.layer.count).toBe(2)
        expect(up.layer.current).toBe(up.layer.get(1))
      })

      it('may be temporarily changed for the duration of a callback using up.Layer.asCurrent(fn)', function() {
        makeLayers(2)
        expect(up.layer.current).toBe(up.layer.get(1))

        up.layer.root.asCurrent(() => expect(up.layer.current).toBe(up.layer.get(0)))

        expect(up.layer.current).toBe(up.layer.get(1))
      })
    })

    describe('up.layer.normalizeOptions()', function() {

      describe('snapshotting the current layer', function() {

        it('saves the current layer instance to { baseLayer }', function() {
          const options = {}
          up.layer.normalizeOptions(options)
          expect(options).toEqual(jasmine.objectContaining({ baseLayer: up.layer.current }))
        })

        it('does not override an existing { baseLayer } option', function() {
          makeLayers(3)

          const options = { baseLayer: up.layer.get(1) }
          up.layer.normalizeOptions(options)
          expect(options).toEqual(jasmine.objectContaining({ baseLayer: up.layer.get(1) }))
        })

        it('resolves a given { baseLayer } string to an up.Layer object', function() {
          const options = { baseLayer: 'root' }
          up.layer.normalizeOptions(options)
          expect(options).toEqual(jasmine.objectContaining({ baseLayer: up.layer.root }))
        })

        it("saves the origin's layer to { baseLayer } when clicking on a link with [up-layer] attribute in a background layer (bugfix)", function() {
          const origin = fixture('a[up-layer=new][href="/foo"]', { text: 'link in background' })
          up.layer.open({ content: 'overlay content' })
          expect(up.layer.isOverlay()).toBe(true)

          const options = { origin }

          up.layer.normalizeOptions(options)
          expect(options).toEqual(jasmine.objectContaining({ baseLayer: up.layer.root }))
        })
      })


      describe('for a { layer } string', function() {
        it('does not resolve the { layer } string, since that might resolve to multiple laters layer', function() {
          const options = { layer: 'any' }
          up.layer.normalizeOptions(options)
          expect(options).toEqual(jasmine.objectContaining({ layer: 'any' }))
        })
      })

      describe('for an mode passed as the { layer: "new $MODE" } shorthand option', function() {

        it('transfers the mode to the { mode } option and sets { layer: "new" }', function() {
          const options = { layer: 'new cover' }
          up.layer.normalizeOptions(options)
          expect(options).toEqual(jasmine.objectContaining({ layer: 'new', mode: 'cover' }))
        })

        it('does not change { layer: "root" }', function() {
          const options = { layer: 'root' }
          up.layer.normalizeOptions(options)
          expect(options).toEqual(jasmine.objectContaining({ layer: 'root' }))
        })
      })

      if (up.migrate.loaded) {
        describe('for an mode passed as the legacy { flavor } option', function() {
          it('transfers the mode to the { mode } option', function() {
            const options = { flavor: 'cover' }
            up.layer.normalizeOptions(options)
            expect(options).toEqual(jasmine.objectContaining({ layer: 'new', mode: 'cover' }))
          })
        })

        describe('for the legacy { layer: "page" } option', function() {
          it('sets { layer: "root" }', function() {
            const options = { layer: 'page' }
            up.layer.normalizeOptions(options)
            expect(options).toEqual(jasmine.objectContaining({ layer: 'root' }))
          })
        })

        describe('when only { mode } is passed, but no { layer }', function() {
          it('sets { layer: "new" }', function() {
            const options = { mode: 'drawer' }
            up.layer.normalizeOptions(options)
            expect(options).toEqual(jasmine.objectContaining({ layer: 'new', mode: 'drawer' }))
          })
        })
      }

      describe('for { layer: "new" }', function() {

        it('sets a default mode from up.layer.config.mode', function() {
          up.layer.config.mode = 'popup'
          const options = { layer: 'new' }
          up.layer.normalizeOptions(options)
          expect(options).toEqual(jasmine.objectContaining({ layer: 'new', mode: 'popup' }))
        })

        it('does not change an existing { mode } option', function() {
          up.layer.config.mode = 'popup'
          const options = { layer: 'new', mode: 'cover' }
          up.layer.normalizeOptions(options)
          expect(options).toEqual(jasmine.objectContaining({ layer: 'new', mode: 'cover' }))
        })
      })

      describe('for { layer: "swap" }', function() {
        it('sets { baseLayer } to the current parent layer and set { layer: "new" }', function() {
          makeLayers(3)

          const options = { layer: 'swap' }
          up.layer.normalizeOptions(options)
          expect(options).toEqual(jasmine.objectContaining({ baseLayer: up.layer.get(1), layer: 'new' }))
        })
      })

      describe('for an element passed as { target }', function() {
        it("sets { layer } to that element's layer object", function() {
          makeLayers(3)

          const options = { target: up.layer.get(1).element }
          up.layer.normalizeOptions(options)
          expect(options).toEqual(jasmine.objectContaining({ layer: up.layer.get(1) }))
        })
      })

      describe('for an element passed as { origin }', function() {

        it("sets { layer: 'origin' }", function() {
          makeLayers(3)

          const options = { origin: up.layer.get(1).element }
          up.layer.normalizeOptions(options)
          expect(options).toEqual(jasmine.objectContaining({ origin: up.layer.get(1).element, layer: 'origin' }))
        })

        it('does not change an existing { layer } option', function() {
          makeLayers(2)

          const options = { layer: 'root', origin: up.layer.get(1).element }
          up.layer.normalizeOptions(options)
          expect(options).toEqual(jasmine.objectContaining({ origin: up.layer.get(1).element, layer: 'root' }))
        })
      })

      describe('if no layer-related option is given', function() {
        it('sets { layer: "current" }', function() {
          const options = {}
          up.layer.normalizeOptions(options)
          expect(options).toEqual(jasmine.objectContaining({ layer: 'current' }))
        })
      })
    })
  })

  describe('unobtrusive behavior', function() {

    describe('up:layer:location:changed event', function() {

      beforeEach(function() {
        up.history.config.enabled = true
      })

      afterEach(async function() {
        // This suite makes heavy use of pushState API, which sometimes causes the browser to stop
        // accepting new history entries.
        //
        // Wait a little after each spec, in addition to the throttling in protect_jasmine_runner.js.
        await wait(50)
      })

      describe('when rendering', function() {

        // See specs for 'up.render() with { history option }'
        it('is tested elsewhere')

      })

      describe('when scripts call window.history.pushState()', function() {

        it('emits the event on the root layer', async function() {
          history.replaceState({}, '', '/path1')
          await wait()
          expect(location.href).toMatchURL('/path1')
          expect(up.layer.current.location).toMatchURL('/path1')

          const listener = jasmine.createSpy('event listener')
          up.on('up:layer:location:changed', listener)

          history.pushState({}, '', '/path2')
          await wait()

          expect(location.href).toMatchURL('/path2')
          expect(up.layer.current.location).toMatchURL('/path2')

          expect(listener.calls.count()).toBe(1)
          expect(listener.calls.argsFor(0)[0]).toBeEvent('up:layer:location:changed', {
            previousLocation: '/path1',
            location: '/path2',
            layer: up.layer.root,
          })
        })

        it('emits the event on an overlay with history', async function() {
          await up.layer.open({ content: 'overlay text', history: true, location: '/path1' })
          expect(up.layer.current).toBeOverlay()
          expect(up.layer.current.history).toBe(true)
          expect(location.href).toMatchURL('/path1')
          expect(up.layer.current.location).toMatchURL('/path1')

          const listener = jasmine.createSpy('event listener')
          up.on('up:layer:location:changed', listener)

          history.pushState({}, '', '/path2')
          await wait()

          expect(location.href).toMatchURL('/path2')
          expect(up.layer.current.location).toMatchURL('/path2')
          expect(listener.calls.count()).toBe(1)
          expect(listener.calls.argsFor(0)[0]).toBeEvent('up:layer:location:changed', {
            previousLocation: '/path1',
            location: '/path2',
            layer: up.layer.get(1),
          })
        })

        it('does not emit the event if the URL did not change', async function() {
          await up.layer.open({ content: 'overlay text', history: true, location: '/path1' })
          expect(up.layer.current).toBeOverlay()
          expect(up.layer.current.history).toBe(true)
          expect(location.href).toMatchURL('/path1')
          expect(up.layer.current.location).toMatchURL('/path1')

          const listener = jasmine.createSpy('event listener')
          up.on('up:layer:location:changed', listener)

          history.pushState({}, '', '/path1')
          await wait()

          expect(listener).not.toHaveBeenCalled()
          expect(up.layer.current.location).toMatchURL('/path1')
        })

        it('does not emit the event on an overlay without history', async function() {
          history.replaceState({}, '', '/root-path')
          await wait()
          expect(location.href).toMatchURL('/root-path')

          await up.layer.open({ content: 'overlay text', history: false, location: '/hidden-overlay-location' })
          expect(up.layer.current).toBeOverlay()
          expect(up.layer.current.history).toBe(false)
          expect(location.href).toMatchURL('/root-path')
          expect(up.layer.current.location).toMatchURL('/hidden-overlay-location')

          const listener = jasmine.createSpy('event listener')
          up.on('up:layer:location:changed', listener)

          history.pushState({}, '', '/path1')
          await wait()

          expect(listener).not.toHaveBeenCalled()
          expect(location.href).toMatchURL('/path1')
          expect(up.layer.current.location).toMatchURL('/hidden-overlay-location')
        })

      })

      describe('when scripts call window.history.replaceState()', function() {

        it('emits the event on the root layer', async function() {
          history.replaceState({}, '', '/path1')
          await wait()
          expect(location.href).toMatchURL('/path1')
          expect(up.layer.current.location).toMatchURL('/path1')

          const listener = jasmine.createSpy('event listener')
          up.on('up:layer:location:changed', listener)

          history.replaceState({}, '', '/path2')
          await wait()

          expect(location.href).toMatchURL('/path2')
          expect(up.layer.current.location).toMatchURL('/path2')

          expect(listener.calls.count()).toBe(1)
          expect(listener.calls.argsFor(0)[0]).toBeEvent('up:layer:location:changed', {
            previousLocation: '/path1',
            location: '/path2',
            layer: up.layer.root,
          })
        })

        it('emits the event on an overlay with history', async function() {
          await up.layer.open({ content: 'overlay text', history: true, location: '/path1' })
          expect(up.layer.current).toBeOverlay()
          expect(up.layer.current.history).toBe(true)
          expect(location.href).toMatchURL('/path1')
          expect(up.layer.current.location).toMatchURL('/path1')

          const listener = jasmine.createSpy('event listener')
          up.on('up:layer:location:changed', listener)

          history.replaceState({}, '', '/path2')
          await wait()

          expect(location.href).toMatchURL('/path2')
          expect(up.layer.current.location).toMatchURL('/path2')
          expect(listener.calls.count()).toBe(1)
          expect(listener.calls.argsFor(0)[0]).toBeEvent('up:layer:location:changed', {
            previousLocation: '/path1',
            location: '/path2',
            layer: up.layer.get(1),
          })
        })

        it('does not emit the event if the URL did not change', async function() {
          await up.layer.open({ content: 'overlay text', history: true, location: '/path1' })
          expect(up.layer.current).toBeOverlay()
          expect(up.layer.current.history).toBe(true)
          expect(location.href).toMatchURL('/path1')
          expect(up.layer.current.location).toMatchURL('/path1')

          const listener = jasmine.createSpy('event listener')
          up.on('up:layer:location:changed', listener)

          history.replaceState({}, '', '/path1')
          await wait()

          expect(listener).not.toHaveBeenCalled()
          expect(up.layer.current.location).toMatchURL('/path1')
        })

        it('does not emit the event on an overlay without history', async function() {
          history.replaceState({}, '', '/root-path')
          await wait()
          expect(location.href).toMatchURL('/root-path')

          await up.layer.open({ content: 'overlay text', history: false, location: '/hidden-overlay-location' })
          expect(up.layer.current).toBeOverlay()
          expect(up.layer.current.history).toBe(false)
          expect(location.href).toMatchURL('/root-path')
          expect(up.layer.current.location).toMatchURL('/hidden-overlay-location')

          const listener = jasmine.createSpy('event listener')
          up.on('up:layer:location:changed', listener)

          history.replaceState({}, '', '/path1')
          await wait()

          expect(listener).not.toHaveBeenCalled()
          expect(location.href).toMatchURL('/path1')
          expect(up.layer.current.location).toMatchURL('/hidden-overlay-location')
        })

      })

      describe('when scripts set location.hash', function() {

        it('emits the event on the root layer', async function() {
          history.replaceState({}, '', '/path#hash1')
          await wait()
          expect(location.href).toMatchURL('/path#hash1')
          expect(up.layer.current.location).toMatchURL('/path#hash1')

          const listener = jasmine.createSpy('event listener')
          up.on('up:layer:location:changed', listener)

          location.hash = '#hash2'
          await wait()

          expect(location.href).toMatchURL('/path#hash2')
          expect(up.layer.current.location).toMatchURL('/path#hash2')

          expect(listener.calls.count()).toBe(1)
          expect(listener.calls.argsFor(0)[0]).toBeEvent('up:layer:location:changed', {
            previousLocation: '/path#hash1',
            location: '/path#hash2',
            layer: up.layer.root,
          })
        })

        it('emits the event on an overlay with history', async function() {
          await up.layer.open({ content: 'overlay text', history: true, location: '/path#hash1' })
          expect(up.layer.current).toBeOverlay()
          expect(up.layer.current.history).toBe(true)
          expect(location.href).toMatchURL('/path#hash1')
          expect(up.layer.current.location).toMatchURL('/path#hash1')

          const listener = jasmine.createSpy('event listener')
          up.on('up:layer:location:changed', listener)

          location.hash = '#hash2'
          await wait()

          expect(location.href).toMatchURL('/path#hash2')
          expect(up.layer.current.location).toMatchURL('/path#hash2')
          expect(listener.calls.count()).toBe(1)
          expect(listener.calls.argsFor(0)[0]).toBeEvent('up:layer:location:changed', {
            previousLocation: '/path#hash1',
            location: '/path#hash2',
            layer: up.layer.get(1),
          })
        })

        it('does not emit the event if the URL did not change', async function() {
          await up.layer.open({ content: 'overlay text', history: true, location: '/path#hash1' })
          expect(up.layer.current).toBeOverlay()
          expect(up.layer.current.history).toBe(true)
          expect(location.href).toMatchURL('/path#hash1')
          expect(up.layer.current.location).toMatchURL('/path#hash1')

          const listener = jasmine.createSpy('event listener')
          up.on('up:layer:location:changed', listener)

          location.hash = '#hash1'
          await wait()

          expect(listener).not.toHaveBeenCalled()
          expect(up.layer.current.location).toMatchURL('/path#hash1')
        })

        it('does not emit the event on an overlay without history', async function() {
          history.replaceState({}, '', '/path#hash1')
          await wait()
          expect(location.href).toMatchURL('/path#hash1')

          await up.layer.open({ content: 'overlay text', history: false, location: '/hidden-overlay-location' })
          expect(up.layer.current).toBeOverlay()
          expect(up.layer.current.history).toBe(false)
          expect(location.href).toMatchURL('/path#hash1')
          expect(up.layer.current.location).toMatchURL('/hidden-overlay-location')

          const listener = jasmine.createSpy('event listener')
          up.on('up:layer:location:changed', listener)

          location.hash = '#hash2'
          await wait()

          expect(listener).not.toHaveBeenCalled()
          expect(location.href).toMatchURL('/path#hash2')
          expect(up.layer.current.location).toMatchURL('/hidden-overlay-location')
        })

      })

      describe('when the user goes back in history', function() {

        it('emits the event on the root layer', async function() {
          history.replaceState({}, '', '/path1')
          await wait()

          history.pushState({}, '', '/path2')
          await wait()

          expect(location.href).toMatchURL('/path2')
          expect(up.layer.current.location).toMatchURL('/path2')

          const listener = jasmine.createSpy('event listener')
          up.on('up:layer:location:changed', listener)

          history.back()
          await wait(100)

          expect(location.href).toMatchURL('/path1')
          expect(up.layer.current.location).toMatchURL('/path1')

          expect(listener.calls.count()).toBe(1)
          expect(listener.calls.argsFor(0)[0]).toBeEvent('up:layer:location:changed', {
            previousLocation: '/path2',
            location: '/path1',
            layer: up.layer.root,
          })
        })

      })

    })


    describe('link with [up-layer=new]', function() {

      it('opens a new overlay loaded from the given [href]', async function() {
        const link = fixture('a[href="/overlay-path"][up-target=".target"][up-layer="new"]')

        Trigger.clickSequence(link)

        await wait()

        expect(jasmine.Ajax.requests.count()).toEqual(1)
        jasmine.respondWithSelector('.target', { text: 'overlay text' })

        await wait()

        expect(up.layer.count).toBe(2)
        expect(up.layer.isOverlay()).toBe(true)
        expect(up.layer.current).toHaveText('overlay text')
      })

      it('opens a new overlay with content from the given [up-content]', async function() {
        const link = fixture('a[up-target=".target"][up-layer="new"][up-content="overlay text"]')

        Trigger.clickSequence(link)

        await wait()

        expect(up.layer.count).toBe(2)
        expect(up.layer.isOverlay()).toBe(true)
        expect(up.layer.current).toHaveText('overlay text')
      })

      it("does not fail when, with a popup overlay open, user clicks on a preloaded, popup-opening link in the background layer (bugfix)", async function() {
        up.link.config.preloadDelay = 10
        const oneLink = helloFixture('a[up-target=".target"][up-layer="new popup"][href="/one"][up-preload]', { text: 'open one' })
        const twoLink = helloFixture('a[up-target=".target"][up-layer="new popup"][href="/two"][up-preload]', { text: 'open two' })

        Trigger.hoverSequence(oneLink)

        await wait(30)

        Trigger.click(oneLink)

        await wait(30)

        expect(jasmine.Ajax.requests.count()).toBe(1)

        jasmine.respondWithSelector('.target', { text: 'content one' })

        await wait()

        expect(up.layer.isOverlay()).toBe(true)
        expect(up.layer.current).toHaveText('content one')

        Trigger.hoverSequence(twoLink)

        await wait(30)

        expect(jasmine.Ajax.requests.count()).toBe(2)
        Trigger.click(twoLink)

        jasmine.respondWithSelector('.target', { text: 'content two' })

        await wait()

        expect(up.layer.isOverlay()).toBe(true)
        expect(up.layer.current).toHaveText('content two')
      })

      describe('history', function() {

        beforeEach(function() {
          up.history.config.enabled = true
        })

        it('opens a layer with visible history when the mode config has { history: true }', async function() {
          fixture('.target')
          up.layer.config.drawer.history = true
          const link = fixture('a[up-target=".target"][up-layer="new drawer"][href="/path5"]')

          Trigger.clickSequence(link)

          await wait()

          jasmine.respondWithSelector('.target')

          await wait()

          expect(up.layer.count).toBe(2)
          expect(up.layer.history).toBe(true)
          expect(up.history.location).toMatchURL('/path5')
        })

        it('opens a layer without visible history when the mode config has { history: false }', async function() {
          fixture('.target')
          up.layer.config.drawer.history = false
          const link = fixture('a[up-target=".target"][up-layer="new drawer"][href="/path6"]')

          Trigger.clickSequence(link)

          await wait()

          jasmine.respondWithSelector('.target')

          await wait()

          expect(up.layer.count).toBe(2)
          expect(up.layer.history).toBe(false)
          expect(up.history.location).toMatchURL(jasmine.locationBeforeExample)
        })

        it('lets the link override the mode config with an [up-history] attribute', async function() {
          fixture('.target')
          up.layer.config.drawer.history = true
          const link = fixture('a[up-target=".target"][up-layer="new drawer"][href="/path7"][up-history="false"]')

          Trigger.clickSequence(link)

          await wait()

          jasmine.respondWithSelector('.target')

          await wait()

          expect(up.layer.count).toBe(2)
          expect(up.layer.history).toBe(false)
          expect(up.history.location).toMatchURL(jasmine.locationBeforeExample)
        })
      })
    })

    describe('[up-accept]', function() {

      beforeEach(function() {
        up.motion.config.enabled = false
      })

      describe('on a link', function() {

        it('accepts an overlay when the link is clicked', function() {
          const acceptListener = jasmine.createSpy('accept listener')
          up.on('up:layer:accept', acceptListener)

          makeLayers(2)

          expect(up.layer.isOverlay()).toBe(true)
          const link = up.layer.affix('a[href="#"]')
          link.setAttribute('up-accept', '')
          Trigger.clickSequence(link)

          expect(up.layer.isRoot()).toBe(true)
          expect(acceptListener).toHaveBeenCalled()
        })

        it('accepts an overlay with the attribute value as JSON', function() {
          const acceptListener = jasmine.createSpy('accept listener')
          up.on('up:layer:accept', acceptListener)

          makeLayers(2)

          expect(up.layer.isOverlay()).toBe(true)
          const link = up.layer.affix('a[href="#"]')
          link.setAttribute('up-accept', JSON.stringify({ foo: 'bar' }))
          Trigger.clickSequence(link)

          expect(up.layer.isRoot()).toBe(true)
          expect(acceptListener.calls.mostRecent().args[0]).toBeEvent('up:layer:accept', { value: { foo: 'bar' } })
        })

        it('allows unquoted property names and single-quotes in the acceptance value JSON', function() {
          const acceptListener = jasmine.createSpy('accept listener')
          up.on('up:layer:accept', acceptListener)

          makeLayers(2)

          expect(up.layer.isOverlay()).toBe(true)
          const link = up.layer.affix('a[href="#"]')
          link.setAttribute('up-accept', "{ foo: 'bar' }")
          Trigger.clickSequence(link)

          expect(up.layer.isRoot()).toBe(true)
          expect(acceptListener.calls.mostRecent().args[0]).toBeEvent('up:layer:accept', { value: { foo: 'bar' } })
        })

        it('parses the acceptance value if the user clicks on a descendant of the [up-accept] element (bugfix)', function() {
          const acceptListener = jasmine.createSpy('accept listener')
          up.on('up:layer:accept', acceptListener)

          makeLayers(2)

          expect(up.layer.isOverlay()).toBe(true)
          const link = up.layer.affix('a[href="#"]')
          link.setAttribute('up-accept', JSON.stringify({ foo: 'bar' }))
          const child = e.affix(link, 'span.child', { text: 'label' })
          Trigger.clickSequence(child)

          expect(up.layer.isRoot()).toBe(true)
          expect(acceptListener.calls.mostRecent().args[0]).toBeEvent('up:layer:accept', { value: { foo: 'bar' } })
        })

        it('prevents a link from being followed on an overlay', function() {
          const followListener = jasmine.createSpy('follow listener')
          up.on('up:link:follow', followListener)

          makeLayers(2)

          expect(up.layer.isOverlay()).toBe(true)
          const link = up.layer.affix('a[href="/foo"][up-follow]')
          link.setAttribute('up-accept', '')
          Trigger.clickSequence(link)

          expect(followListener).not.toHaveBeenCalled()
          expect(link).not.toHaveBeenDefaultFollowed()
        })

        it('follows a link on the root layer', function() {
          const followListener = jasmine.createSpy('follow listener')
          up.on('up:link:follow', followListener)

          const link = up.layer.affix('a[href="/foo"][up-follow]')
          link.setAttribute('up-accept', '')
          Trigger.clickSequence(link)

          expect(followListener).toHaveBeenCalled()
        })

        it('may be used on elements that are no links', function() {
          const acceptListener = jasmine.createSpy('accept listener')
          up.on('up:layer:accept', acceptListener)

          makeLayers(2)

          expect(up.layer.isOverlay()).toBe(true)
          const link = up.layer.affix('span')
          link.setAttribute('up-accept', JSON.stringify({ foo: 'bar' }))
          Trigger.clickSequence(link)

          expect(up.layer.isRoot()).toBe(true)
          expect(acceptListener.calls.mostRecent().args[0]).toBeEvent('up:layer:accept', { value: { foo: 'bar' } })
        })

        it('allows to set attributes that control the closing animation', function() {
          const [root, overlay] = makeLayers(2)

          spyOn(overlay, 'accept')
          const link = up.layer.affix('a[href="#"]')
          link.setAttribute('up-accept', '')
          link.setAttribute('up-animation', 'move-to-right')
          link.setAttribute('up-duration', '654')
          Trigger.clickSequence(link)

          expect(overlay.accept).toHaveBeenCalledWith(undefined, jasmine.objectContaining({
            animation: 'move-to-right',
            duration: 654
          }))
        })

        it('does not emit a global error when clicked and up:layer:accept is prevented', async function() {
          up.on('up:layer:accept', (event) => event.preventDefault())

          makeLayers(2)

          expect(up.layer.isOverlay()).toBe(true)
          const link = up.layer.affix('a[href="#"][up-accept]')
          Trigger.clickSequence(link)

          await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
            await wait()
            expect(up.layer.isOverlay()).toBe(true)
            expect(globalErrorSpy).not.toHaveBeenCalled()
          })
        })

        describe('with [up-confirm]', function() {

          allowGlobalErrors()

          it('shows a confirm message before accepting the overlay', function() {
            const [root, overlay] = makeLayers(2)
            const link = overlay.affix('a[up-accept][up-confirm="Are you sure?"]')
            const confirmSpy = spyOn(up.browser, 'assertConfirmed')

            Trigger.clickSequence(link)

            expect(confirmSpy).toHaveBeenCalledWith(jasmine.objectContaining({ confirm: 'Are you sure?' }))
            expect(overlay).not.toBeAlive()
          })

          it('does not accept the overlay or follow the link if the message is not confirmed', function() {
            const [root, overlay] = makeLayers(2)
            const confirmSpy = spyOn(up.browser, 'assertConfirmed').and.callFake(function(options) {
              if (options.confirm) {
                throw new up.Aborted('User aborted')
              }
            })

            const followListener = jasmine.createSpy('follow listener')
            up.on('up:link:follow', followListener)

            const link = overlay.affix('a[up-accept][up-follow][up-confirm="Are you sure?"]')

            Trigger.clickSequence(link)

            expect(confirmSpy).toHaveBeenCalled()
            expect(overlay).toBeAlive()
            expect(followListener).not.toHaveBeenCalled()
            expect(link).not.toHaveBeenDefaultFollowed()
          })
        })
      })

      describe('on a form', function() {

        it('accepts the layer when the form is submitted', function() {
          const acceptListener = jasmine.createSpy('accept listener')
          up.on('up:layer:accept', acceptListener)

          const [root, overlay] = makeLayers(2)

          expect(up.layer.isOverlay()).toBe(true)
          const form = overlay.affix('form[up-accept]')
          const submitButton = e.affix(form, 'input[type=submit]')
          Trigger.clickSequence(submitButton)

          expect(up.layer.isRoot()).toBe(true)
          expect(acceptListener).toHaveBeenCalled()
        })

        it('does not accept the layer when the form element is clicked', function() {
          const acceptListener = jasmine.createSpy('accept listener')
          up.on('up:layer:accept', acceptListener)

          const [root, overlay] = makeLayers(2)

          expect(up.layer.isOverlay()).toBe(true)
          const form = overlay.affix('form[up-accept]', { text: 'form content' })
          Trigger.clickSequence(form)

          expect(up.layer.isOverlay()).toBe(true)
          expect(acceptListener).not.toHaveBeenCalled()
        })

        it('does not accept the layer when a form child is clicked', function() {
          const acceptListener = jasmine.createSpy('accept listener')
          up.on('up:layer:accept', acceptListener)

          const [root, overlay] = makeLayers(2)

          expect(up.layer.isOverlay()).toBe(true)
          const form = overlay.affix('form[up-accept]')
          const formChild = e.affix(form, 'div', { text: 'form content' })
          Trigger.clickSequence(formChild)

          expect(up.layer.isOverlay()).toBe(true)
          expect(acceptListener).not.toHaveBeenCalled()
        })

        it('uses the form params as the acceptance value', function() {
          const acceptListener = jasmine.createSpy('accept listener')
          up.on('up:layer:accept', acceptListener)

          const [root, overlay] = makeLayers(2)

          expect(up.layer.isOverlay()).toBe(true)
          const form = overlay.affix('form[up-accept]')
          const fooInput = e.affix(form, 'input[name=foo][value="foo-value"]')
          const barInput = e.affix(form, 'input[name=bar][value="bar-value"]')
          const submitButton = e.affix(form, 'input[type=submit]')
          Trigger.clickSequence(submitButton)

          expect(up.layer.isRoot()).toBe(true)
          expect(acceptListener).toHaveBeenCalled()
        })

        it('prevents the form from being submitted', function() {
          const submitListener = jasmine.createSpy('submit listener')
          up.on('up:form:submit', submitListener)

          const [root, overlay] = makeLayers(2)

          expect(up.layer.isOverlay()).toBe(true)
          const form = overlay.affix('form[up-accept]')
          const submitButton = e.affix(form, 'input[type=submit]')
          Trigger.clickSequence(submitButton)

          expect(submitListener).not.toHaveBeenCalled()
          expect(form).not.toHaveBeenDefaultSubmitted()
        })

        it('submits a form on the root layer', function() {
          const submitListener = jasmine.createSpy('submit listener')
          up.on('up:form:submit', submitListener)

          const form = fixture('form[up-submit][up-accept]')
          const submitButton = e.affix(form, 'input[type=submit]')
          Trigger.clickSequence(submitButton)


          expect(submitListener).toHaveBeenCalled()
        })

        it('allows to set attributes that control the closing animation', function() {
          const [root, overlay] = makeLayers(2)

          spyOn(overlay, 'accept')

          const form = overlay.affix('form[up-accept]')
          form.setAttribute('up-accept', '')
          form.setAttribute('up-animation', 'move-to-right')
          form.setAttribute('up-duration', '654')
          const submitButton = e.affix(form, 'input[type=submit]')
          Trigger.clickSequence(submitButton)

          expect(overlay.accept).toHaveBeenCalledWith(
            jasmine.any(up.Params),
            jasmine.objectContaining({
              animation: 'move-to-right',
              duration: 654
            })
          )
        })

        it('does not emit a global error when submitted and up:layer:accept is prevented', async function() {
          up.on('up:layer:accept', (event) => event.preventDefault())

          makeLayers(2)

          expect(up.layer.isOverlay()).toBe(true)
          const form = up.layer.affix('form[up-accept]')
          const submitButton = e.affix(form, 'input[type=submit]')
          Trigger.clickSequence(submitButton)

          await jasmine.spyOnGlobalErrorsAsync(async function(globalErrorSpy) {
            await wait()
            expect(up.layer.isOverlay()).toBe(true)
            expect(globalErrorSpy).not.toHaveBeenCalled()
          })
        })

        describe('with [up-confirm]', function() {

          allowGlobalErrors()

          it('shows a confirm message before accepting the overlay', function() {
            const [root, overlay] = makeLayers(2)
            const form = overlay.affix('form[up-accept][up-confirm="Are you sure?"]')
            const submitButton = e.affix(form, 'input[type=submit]')
            const confirmSpy = spyOn(up.browser, 'assertConfirmed')

            Trigger.clickSequence(submitButton)

            expect(confirmSpy).toHaveBeenCalledWith(jasmine.objectContaining({ confirm: 'Are you sure?' }))
            expect(overlay).not.toBeAlive()
          })

          it('does not accept the overlay or submit the form if the message is not confirmed', function() {
            const [root, overlay] = makeLayers(2)
            const confirmSpy = spyOn(up.browser, 'assertConfirmed').and.callFake(function(options) {
              if (options.confirm) {
                throw new up.Aborted('User aborted')
              }
            })

            const submitListener = jasmine.createSpy('submit listener')
            up.on('up:form:submit', submitListener)

            const form = overlay.affix('form[up-accept][up-confirm="Are you sure?"]')
            const submitButton = e.affix(form, 'input[type=submit]')

            Trigger.clickSequence(submitButton)

            expect(confirmSpy).toHaveBeenCalled()
            expect(overlay).toBeAlive()
            expect(submitListener).not.toHaveBeenCalled()
          })
        })

      })

    })

    describe('[up-dismiss]', function() {

      beforeEach(function() {
        up.motion.config.enabled = false
      })

      describe('on a link', function() {

        it('dismisses an overlay with the attribute value as JSON', function() {
          const dismissListener = jasmine.createSpy('dismiss listener')
          up.on('up:layer:dismiss', dismissListener)

          makeLayers(2)

          expect(up.layer.isOverlay()).toBe(true)
          const link = up.layer.affix('a[href="#"]')
          link.setAttribute('up-dismiss', JSON.stringify({ foo: 'bar' }))
          Trigger.clickSequence(link)

          expect(up.layer.isRoot()).toBe(true)
          expect(dismissListener.calls.mostRecent().args[0]).toBeEvent('up:layer:dismiss', { value: { foo: 'bar' } })
        })

      })

      describe('on a form', function() {

        it('dismisses the overlay, using the form params as the dismissal reason')

      })
    })
  })

})
