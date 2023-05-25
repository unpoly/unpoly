const u = up.util

function matchesCondition(value, condition) {
  return value === condition || (u.isFunction(condition) && condition(value))
}

function findNonGetterValues(object) {
  let descriptors = Object.values(Object.getOwnPropertyDescriptors(object))
  return u.map(descriptors, 'value')
}

function findRecursiveValues(initialValue, condition) {
  let matches = []
  let queue = [initialValue]

  let seenValues = new Set()

  while (queue.length) {
    let currentValue = queue.shift()

    // Prevent infinite recursion in circular object references
    let alreadySeen = seenValues.has(currentValue)
    seenValues.add(currentValue)
    if (alreadySeen) continue

    if (matchesCondition(currentValue, condition)) {
      matches.push(currentValue)
    }

    if (u.isArray(currentValue)) {
      // An array is also an object, but we don't want to parse non-element
      // properties like #length.
      queue.push(...currentValue)
    } else if (u.isObject(currentValue)) {
      queue.push(...findNonGetterValues(currentValue))
    }
  }

  return matches
}

beforeEach(function() {
  jasmine.addMatchers({
    toHaveRecursiveValue: function(util, customEqualityTesters) {
      return {
        compare: function(object, condition) {
          let matches = findRecursiveValues(object, condition)

          let result = {
            pass: (matches.length > 0)
          }

          if (result.pass) {
            result.message = u.sprintf("Expected object %o to not have the given value recursively, but found matches %o", object, matches)
          } else {
            result.message = u.sprintf("Expected object %o to have the given value recursively, but found no matches", object)
          }

          return result
        }
      }
    }
  })
})
