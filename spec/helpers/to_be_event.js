beforeEach(function() {
  jasmine.addMatchers({
    toBeEvent(util, customEqualityTesters) {
      return {
        compare(actual, eventName, eventProps = {}) {
          return {
            pass: actual &&
              actual.preventDefault &&
              (actual.type === eventName) &&
              up.util.objectContains(actual, eventProps)
          }
        }
      }
    }
  })
})
