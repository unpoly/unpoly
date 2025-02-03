const u = up.util

beforeEach(function() {
  jasmine.addMatchers({
    toBeKeyboardFocusable(util, customEqualityTesters) {
      return {
        compare(link) {
          const tabIndex = link.getAttribute('tabindex')

          return { pass: u.isPresent(tabIndex) && (parseInt(tabIndex) >= 0) }
        }
      }
    }
  })
})


