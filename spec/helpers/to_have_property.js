const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toHaveProperty(util, customEqualityTesters) {
      return {
        compare(object, expectedPropertyName, ...restArgs) {
          // We accept
          // (1) A DOM element
          // (2) A selector string
          // (3) Any JavaScript object
          if (u.isString(object)) {
            object = up.element.get(object)
          }

          if (restArgs.length === 0) {
            return { pass: expectedPropertyName in object }
          } else {
            let expectedPropertyValue = restArgs[0]
            let message
            const actualAttrValue = object[expectedPropertyName]
            const pass = (expectedPropertyName in object) && (actualAttrValue === expectedPropertyValue)
            if (pass) {
              message = `Expected object to not have property {${expectedPropertyName}} with value ${JSON.stringify(expectedPropertyValue)}`
            } else {
              message = `Expected object to have property { ${expectedPropertyName} } with value ${JSON.stringify(expectedPropertyValue)}, but the value was ${JSON.stringify(actualAttrValue)}`
            }
            return { pass, message }
          }
        }
      }
    }
  })
})
