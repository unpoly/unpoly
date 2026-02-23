const u = up.util

function match(actual, eventType, eventProps = {}) {
  return actual &&
    actual.preventDefault &&
    (actual.type === eventType) &&
    up.util.objectContains(actual, eventProps)
}

// As a regular matcher
beforeEach(function() {
  jasmine.addMatchers({
    toBeEvent(util, customEqualityTesters) {
      return {
        compare(actual, eventType, eventProps = {}) {
          return {
            pass: match(actual, eventType, eventProps)
          }
        }
      }
    }
  })
})

// As an asymmetric equality matcher
jasmine.anyEvent = (eventType, eventProps = {}) => ({
  asymmetricMatch(actual) {
    return match(actual, eventType, eventProps)
  },

  jasmineToString() {
    if (u.isPresent(eventProps)) {
      return u.sprintf("An event %s with properties %o", eventType, eventProps)
    } else {
      return u.sprintf("An event %s", eventType)
    }
  }
})
