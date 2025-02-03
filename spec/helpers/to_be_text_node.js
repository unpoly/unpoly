beforeEach(function() {
  jasmine.addMatchers({
    toBeTextNode(util, customEqualityTesters) {
      return {
        compare(actual, expectedText, { trim = false } = {}) {
          const normalize = function(text) {
            if (trim) {
              return text.trim()
            } else {
              return text
            }
          }
          return { pass: (actual instanceof Text) && (up.util.isMissing(expectedText) || (normalize(actual.wholeText) === normalize(expectedText))) }
        }
      }
    }
  })
})

