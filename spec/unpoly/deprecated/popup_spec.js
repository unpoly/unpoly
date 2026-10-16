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

    describe('unobtrusive behavior', function() {
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
