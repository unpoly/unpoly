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
    })

    describe('position with alignment, like { position: "bottom-right" }', function() {
      it('is split into { position } and { align }', async function() {
        const warnSpy = up.migrate.warn.mock()
        const origin = fixture('a#origin', { text: 'origin' })
        const alignSpy = spyOn(up.Tether.prototype, 'start').and.callThrough()
        await up.layer.open({ mode: 'popup', origin, content: 'popup content', position: 'bottom-right' })

        expect(alignSpy).toHaveBeenCalled()
        const tether = alignSpy.calls.mostRecent().object
        expect(tether._position).toBe('bottom')
        expect(tether._align).toBe('right')
        expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('The position value %o is deprecated'), 'bottom-right', { position: 'bottom', align: 'right' })
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
