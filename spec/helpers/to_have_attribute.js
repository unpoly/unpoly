const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toHaveAttribute(util, customEqualityTesters) {
      return {
        compare(element, expectedAttrName, expectedAttrValue) {
          element = up.element.get(element)

          if (u.isMissing(expectedAttrValue)) {
            return { pass: element.hasAttribute(expectedAttrName) }
          } else {
            let message
            const actualAttrValue = element.getAttribute(expectedAttrName)
            const pass = (actualAttrValue === expectedAttrValue)
            if (pass) {
              message = `Expected element to not have attribute [${expectedAttrName}] with value ${JSON.stringify(expectedAttrValue)}`
            } else {
              message = `Expected element to have attribute [${expectedAttrName}] with value ${JSON.stringify(expectedAttrValue)}, but the value was ${JSON.stringify(actualAttrValue)}`
            }
            return { pass, message }
          }
        }
      }
    }
  })
})
