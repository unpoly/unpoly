const u = up.util
const e = up.element

if (up.migrate.loaded) {
  describe('up.tooltip', function() {
    describe('HTML', function() {
      describe('[up-tooltip] (deprecated)', function() {
        it('sets a [title] attribute', function() {
          const div = fixture('[up-tooltip=Help]')
          up.hello(div)
          expect(div.getAttribute('title')).toEqual('Help')
        })

        it('prints a deprecation warning that names the element', function() {
          const warnSpy = up.migrate.warn.mock()
          const div = fixture('[up-tooltip=Help]')
          up.hello(div)
          expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('[up-tooltip] has been deprecated'), div)
        })
      })
    })
  })
}
