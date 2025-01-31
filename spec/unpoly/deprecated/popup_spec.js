const u = up.util
const e = up.element

if (up.migrate.loaded) {
  describe('up.popup (deprecated)', function() {
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
