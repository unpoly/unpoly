const u = up.util
const e = up.element

beforeEach(function() {
  jasmine.addMatchers({
    toHaveInlineStyle: function(util, customEqualityTesters) {
      return {
        compare: function(element, expectedStyles) {
          element = up.element.get(element)

          if (!element) {
            return { pass: false }
          }

          if (u.isString(expectedStyles)) {
            return {
              pass: u.isPresent(e.inlineStyle(element, expectedStyles))
            }
          } else {
            return {
              pass: util.equals(expectedStyles, e.inlineStyle(element, Object.keys(expectedStyles)))
            }
          }
        }
      }
    }
  })
})
