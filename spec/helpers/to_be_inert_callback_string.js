const u = up.util

function isLineComment(string) {
  return /^\/\/[^\n]*?$/.test(string)
}

function isBlockComment(string) {
  // Naive regexp. Only use for testing data.
  return /^\/*[\s\S]*\/$/.test(string)
}

function isInertCallbackString(string) {
  return u.isBlank(string) || isLineComment(string) || isBlockComment(string)
}

beforeEach(function() {
  jasmine.addMatchers({
    toBeInertCallbackString(util, customEqualityTesters) {
      return {
        compare(string) {
          return { pass: isInertCallbackString(string) }
        }
      }
    },

    toBeActiveCallbackString(util, customEqualityTesters) {
      return {
        compare(string) {
          return { pass: !isInertCallbackString(string) }
        }
      }
    },
  })
})
