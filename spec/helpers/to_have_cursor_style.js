const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toHaveCursorStyle(util, customEqualityTesters) {
      return {
        compare(element, expectedStyle) {
          let message
          element = up.element.get(element)
          const actualStyle = element && getComputedStyle(element).cursor
          const pass = (actualStyle === expectedStyle)

          if (pass) {
            message = `Expected element to not have cursor style "${expectedStyle}"`
          } else {
            message = `Expected element to have cursor style "${expectedStyle}", but its cursor style was "${actualStyle}"`
          }

          return { pass, message }
        }
      }
    }
  })
})
