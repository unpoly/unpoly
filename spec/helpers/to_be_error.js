const u = up.util
const $ = jQuery

function compareStrings(actual, expected) {
  return (actual === expected) || (expected instanceof RegExp && expected.test(actual))
}

function match(actual, ...args) {
  if (args.length === 2) {
    // If two args are passed, the first must match the error name AND the second must match the error message.
    const [expectedName, expectedMessage] = args
    return (actual instanceof Error) && compareStrings(actual.name, expectedName) && compareStrings(actual.message, expectedMessage)
  } else {
    // If only a single arg is passed, it must match EITHER the error name or its message.
    const expectedErrorOrNameOrMessage = args[0]
    return ((actual instanceof Error) && (actual === expectedErrorOrNameOrMessage)) || (compareStrings(actual.name, expectedErrorOrNameOrMessage) || compareStrings(actual.message, expectedErrorOrNameOrMessage))
  }
}

// As a regular matcher
beforeEach(function() {
  jasmine.addMatchers({
    toBeError(util, customEqualityTesters) {
      return {
        compare(actual, ...args) {
          return { pass: match(actual, ...args) }
        }
      }
    }
  })
})

// As an asymmetric equality matcher
jasmine.anyError = (...args) => ({
  asymmetricMatch(actual) {
    return match(actual, ...args)
  },

  jasmineToString() {
    return u.sprintf("An error matching %o", args)
  }
})
