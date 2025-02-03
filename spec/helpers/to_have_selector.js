const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toHaveSelector(util, customEqualityTesters) {
      return {
        compare(root, selector) {
          root = up.element.get(root)
          const match = root.querySelector(selector)
          return { pass: !!match }
        }
      }
    }
  })
})

