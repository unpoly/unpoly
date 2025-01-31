const u = up.util
const e = up.element

if (up.migrate.loaded) {
  describe('up.tooltip', function() {
    describe('unobtrusive behavior', function() {
      describe('[up-tooltip] (deprecated)', function() {
        it('sets a [title] attribute', function() {
          const div = fixture('[up-tooltip=Help]')
          up.hello(div)
          expect(div.getAttribute('title')).toEqual('Help')
        })
      })
    })
  })
}
