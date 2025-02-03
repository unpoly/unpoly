const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBeFollowable(util, customEqualityTesters) {
      return {
        compare(element) {
          element = up.element.get(element)
          return { pass: up.link.isFollowable(element) }
        }
      }
    }
  })
})
