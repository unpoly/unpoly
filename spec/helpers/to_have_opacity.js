const u = up.util
const e = up.element
const $ = jQuery

function getOwnOpacity(element) {
  return e.styleNumber(element, 'opacity')
}

function getEffectiveOpacity(element) {
  let opacity = getOwnOpacity(element)

  while ((element = element.parentElement)) {
    opacity *= getOwnOpacity(element)
  }

  return opacity
}

function doCompare({ elementOrTarget, expectedOpacity, tolerance = 0.0, propertyLabel, getOpacityFn }) {
  const element = e.get(elementOrTarget)

  if (!element) {
    return {
      pass: false,
      message: u.sprintf("Expected %o to have %s %o, but the element could not be found", elementOrTarget, propertyLabel, expectedOpacity)
    }
  }

  if (!element.isConnected) {
    return {
      pass: false,
      message: u.sprintf("Expected %o to have %s %o, but element was detached", elementOrTarget, propertyLabel, expectedOpacity)
    }
  }

  const actualOpacity = getOpacityFn(element)
  const withinTolerance = Math.abs(expectedOpacity - actualOpacity) <= tolerance

  if (withinTolerance) {
    return {
      pass: true,
      message: u.sprintf("Expected %o to not have %s %o, but it was %o (tolerance ±%o)", elementOrTarget, propertyLabel, expectedOpacity, actualOpacity, tolerance)
    }
  } else {
    return {
      pass: false,
      message: u.sprintf("Expected %o to have %s %o, but it was %o (tolerance ±%o)", elementOrTarget, propertyLabel, expectedOpacity, actualOpacity, tolerance)
    }
  }
}


beforeEach(function() {
  jasmine.addMatchers({
    toHaveOpacity(util, customEqualityTesters) {
      return {
        compare(elementOrTarget, expectedOpacity, tolerance = 0.0) {
          return doCompare({
            elementOrTarget,
            expectedOpacity,
            tolerance,
            getOpacityFn: getOwnOpacity,
            propertyLabel: 'opacity',
          })
        }
      }
    },

    toHaveEffectiveOpacity(util, customEqualityTesters) {
      return {
        compare(elementOrTarget, expectedOpacity, tolerance = 0.0) {
          return doCompare({
            elementOrTarget,
            expectedOpacity,
            tolerance,
            getOpacityFn: getEffectiveOpacity,
            propertyLabel: 'effective opacity',
          })

        }
      }

    }
  })
})
