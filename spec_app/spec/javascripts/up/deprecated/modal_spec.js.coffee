u = up.util
e = up.element

if up.migrate.loaded
  describe 'up.modal (deprecated)', ->

    describe 'unobtrusive behavior', ->

      describe 'a[up-modal]', ->

        it 'is converted to [up-layer=modal][up-follow] without target', ->
          link = fixture('a[href="/path"][up-modal]')
          up.hello(link)
          expect(link).not.toHaveAttribute('up-modal')
          expect(link).toHaveAttribute('up-layer', 'modal')
          expect(link).toHaveAttribute('up-follow', '')

        it 'is converted to [up-layer=modal][up-target=...] with target', ->
          link = fixture('a[href="/path"][up-modal=".target"]')
          up.hello(link)
          expect(link).not.toHaveAttribute('up-modal')
          expect(link).toHaveAttribute('up-layer', 'modal')
          expect(link).toHaveAttribute('up-target', '.target')
