const u = up.util
const e = up.element

if (up.migrate.loaded) {
  describe('up.popup (deprecated)', function() {
    describe('up.popup.attach()', function() {
      it('opens a new popup overlay', async function() {
        const origin = fixture('a#origin', { text: 'origin' })
        await up.popup.attach(origin, { content: 'popup content' })

        expect(up.layer.count).toBe(2)
        expect(up.layer.mode).toBe('popup')
        expect(up.layer.current).toHaveText('popup content')
      })
    })

    describe('up.popup.close()', function() {
      it('dismisses the current overlay', async function() {
        const origin = fixture('a#origin', { text: 'origin' })
        up.layer.open({ mode: 'popup', origin, content: 'popup content' })
        const warnSpy = up.migrate.warn.mock()

        up.popup.close()

        expect(up.layer.count).toBe(1)
        expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('up.popup.close() has been deprecated'))
      })
    })

    describe('other functions', function() {
      it('delegate to up.layer', async function() {
        const origin = fixture('a#origin', { text: 'origin' })
        up.layer.open({ mode: 'popup', origin, content: 'popup content', location: '/popup-path' })
        const warnSpy = up.migrate.warn.mock()

        expect(up.popup.url()).toMatchURL('/popup-path')
        expect(up.popup.coveredUrl()).toBe(up.layer.root.location)
        expect(up.popup.config).toBe(up.layer.config.popup)
        expect(up.popup.contains(up.layer.current.getContentElement())).toBe(true)
        expect(up.popup.isOpen()).toBe(true)
        up.popup.sync()
        for (let name of ['up.popup.url()', 'up.popup.coveredUrl()', 'up.popup.config', 'up.popup.contains()', 'up.popup.isOpen()', 'up.popup.sync()']) {
          expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining(`${name} has been deprecated`))
        }
      })

      it('up.popup.contains() accepts a selector', async function() {
        fixture('.in-root')
        await up.layer.open({ mode: 'popup', origin: fixture('a#origin', { text: 'origin' }), fragment: '<div class="in-overlay"></div>' })
        up.migrate.warn.mock()

        expect(up.popup.contains('.in-overlay')).toBe(true)
        expect(up.popup.contains('.in-root')).toBe(false)
        expect(up.popup.contains('.missing')).toBe(false)
      })

      it('up.popup.url() returns undefined when the overlay has no location', async function() {
        await up.layer.open({ mode: 'popup', origin: fixture('a#origin', { text: 'origin' }), fragment: '<div class="in-overlay"></div>' })
        up.migrate.warn.mock()

        expect(up.layer.current.location).toBeUndefined()
        expect(up.popup.url()).toBeUndefined()
      })
    })

    describe('up.popup.sync()', function() {
      it('syncs every layer', async function() {
        const origin = fixture('a#origin', { text: 'origin' })
        await up.layer.open({ mode: 'popup', origin, content: 'popup content' })
        up.migrate.warn.mock()
        const syncSpies = up.layer.stack.map((layer) => spyOn(layer, 'sync'))
        expect(syncSpies.length).toBe(2)

        up.popup.sync()

        for (let syncSpy of syncSpies) {
          expect(syncSpy).toHaveBeenCalled()
        }
      })
    })

    describe('position with alignment, like { position: "bottom-right" }', function() {
      it('is split into { position } and { align } for the layer and its element', async function() {
        const warnSpy = up.migrate.warn.mock()
        const origin = fixture('a#origin', { text: 'origin' })
        await up.layer.open({ mode: 'popup', origin, content: 'popup content', position: 'bottom-right' })

        expect(up.layer.current.position).toBe('bottom')
        expect(up.layer.current.align).toBe('right')
        expect(up.layer.element).toHaveAttribute('position', 'bottom')
        expect(up.layer.element).toHaveAttribute('align', 'right')
        expect(warnSpy).toHaveBeenCalledOnceWith(jasmine.stringContaining('The position value %o is deprecated'), 'bottom-right', { position: 'bottom', align: 'right' })
      })

      it('places the popup below the origin, aligned to its right edge', async function() {
        up.migrate.warn.mock()
        const origin = fixture('a#origin', { text: 'origin', style: 'position: absolute; left: 300px; top: 50px; width: 100px; height: 20px' })
        await up.layer.open({ mode: 'popup', origin, content: '<div style="width: 50px">popup content</div>', position: 'bottom-right' })

        const originRect = origin.getBoundingClientRect()
        const popupRect = up.layer.element.getBoundingClientRect()
        expect(popupRect.top).toBeAround(originRect.bottom, 1)
        expect(popupRect.right).toBeAround(originRect.right, 1)
      })

      it('is split when given as an [up-position] attribute', async function() {
        up.migrate.warn.mock()
        const [link] = htmlFixtureList('<a up-follow up-layer="new popup" up-position="bottom-right" up-content="popup content">label</a>')

        Trigger.clickSequence(link)
        await wait()

        expect(up.layer.current.mode).toBe('popup')
        expect(up.layer.element).toHaveAttribute('position', 'bottom')
        expect(up.layer.element).toHaveAttribute('align', 'right')
      })

      it('is split when set in up.layer.config.popup', async function() {
        up.migrate.warn.mock()
        up.layer.config.popup.position = 'bottom-right'
        const origin = fixture('a#origin', { text: 'origin' })
        await up.layer.open({ mode: 'popup', origin, content: 'popup content' })

        expect(up.layer.config.popup.position).toBe('bottom')
        expect(up.layer.config.popup.align).toBe('right')
        expect(up.layer.element).toHaveAttribute('position', 'bottom')
        expect(up.layer.element).toHaveAttribute('align', 'right')
      })
    })

    describe('HTML', function() {
      describe('[up-popup]', function() {

        it('is converted to [up-layer="new popup"][up-follow] without target', function() {
          const link = fixture('a[href="/path"][up-popup]')
          up.hello(link)
          expect(link).not.toHaveAttribute('up-popup')
          expect(link).toHaveAttribute('up-layer', 'new popup')
          expect(link).toHaveAttribute('up-follow', '')
        })

        it('is converted to [up-layer="new popup"][up-target=...] with target', function() {
          const link = fixture('a[href="/path"][up-popup=".target"]')
          up.hello(link)
          expect(link).not.toHaveAttribute('up-popup')
          expect(link).toHaveAttribute('up-layer', 'new popup')
          expect(link).toHaveAttribute('up-target', '.target')
        })
      })
    })
  })
}
