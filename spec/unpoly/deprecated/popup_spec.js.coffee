u = up.util
e = up.element

if up.migrate.loaded
  describe 'up.popup (deprecated)', ->

    describe 'unobtrusive behavior', ->

      describe '[up-popup]', ->

        it 'is converted to [up-layer="new popup"][up-follow] without target', ->
          link = fixture('a[href="/path"][up-popup]')
          up.hello(link)
          expect(link).not.toHaveAttribute('up-popup')
          expect(link).toHaveAttribute('up-layer', 'new popup')
          expect(link).toHaveAttribute('up-follow', '')

        it 'is converted to [up-layer="new popup"][up-target=...] with target', ->
          link = fixture('a[href="/path"][up-popup=".target"]')
          up.hello(link)
          expect(link).not.toHaveAttribute('up-popup')
          expect(link).toHaveAttribute('up-layer', 'new popup')
          expect(link).toHaveAttribute('up-target', '.target')

