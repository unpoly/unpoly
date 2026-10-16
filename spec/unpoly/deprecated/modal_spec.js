const u = up.util
const e = up.element

if (up.migrate.loaded) {
  describe('up.modal (deprecated)', function() {
    describe('up.modal.follow()', function() {
      it("opens the link's destination in a new modal overlay", async function() {
        const link = fixture('a[href="/path"]', { text: 'link' })
        up.modal.follow(link, { target: '.target' })
        await wait()

        jasmine.respondWithSelector('.target', { text: 'modal content' })
        await wait()

        expect(up.layer.count).toBe(2)
        expect(up.layer.mode).toBe('modal')
        expect(up.layer.current).toHaveText('modal content')
      })
    })

    describe('up.modal.extract()', function() {
      it('opens the given HTML in a new modal overlay', async function() {
        await up.modal.extract('.target', '<div class="target">modal content</div>')

        expect(up.layer.count).toBe(2)
        expect(up.layer.mode).toBe('modal')
        expect(up.layer.current).toHaveText('modal content')
      })
    })

    describe('unobtrusive behavior', function() {
      describe('[up-modal]', function() {

        it('is converted to [up-layer="new modal"][up-follow] without target', function() {
          const link = fixture('a[href="/path"][up-modal]')
          up.hello(link)
          expect(link).not.toHaveAttribute('up-modal')
          expect(link).toHaveAttribute('up-layer', 'new modal')
          expect(link).toHaveAttribute('up-follow', '')
        })

        it('is converted to [up-layer="new modal"][up-target=...] with target', function() {
          const link = fixture('a[href="/path"][up-modal=".target"]')
          up.hello(link)
          expect(link).not.toHaveAttribute('up-modal')
          expect(link).toHaveAttribute('up-layer', 'new modal')
          expect(link).toHaveAttribute('up-target', '.target')
        })
      })
    })
  })
}
