const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toHaveSelector(util, customEqualityTesters) {
      return {
        compare(root, selector) {
          if (root instanceof up.Layer) {
            root = root.getContentElement()
          } else {
            root = up.element.get(root)
          }
          const match = root.querySelector(selector)
          return { pass: !!match }
        }
      }
    }
  })
})

