const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toContain(util, customEqualityTesters) {
      return {
        compare(container, expectedElement) {
          if (u.isMissing(container)) {
            return { pass: false }
          }

          if ((container instanceof Element) || (container instanceof Document)) {
            return { pass: (expectedElement instanceof Node) && container.contains(expectedElement) }
          }

          // Array, String
          return { pass: u.contains(container, expectedElement) }
        }
      }
    }
  })
})

