u = up.util
e = up.element

if up.migrate.loaded
  describe 'up.popup (deprecated)', ->

    describe 'unobtrusive behavior', ->

      describe 'a[up-popup]', ->

        it 'is converted to [up-layer=popup][up-follow] without target', ->
          link = fixture('a[href="/path"][up-popup]')
          up.hello(link)
          expect(link).not.toHaveAttribute('up-popup')
          expect(link).toHaveAttribute('up-layer', 'popup')
          expect(link).toHaveAttribute('up-follow', '')

        it 'is converted to [up-layer=popup][up-target=...] with target', ->
          link = fixture('a[href="/path"][up-popup=".target"]')
          up.hello(link)
          expect(link).not.toHaveAttribute('up-popup')
          expect(link).toHaveAttribute('up-layer', 'popup')
          expect(link).toHaveAttribute('up-target', '.target')

