u = up.util
e = up.element
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toHaveOpacity: (util, customEqualityTesters) ->
      compare: (elementOrTarget, expectedOpacity, tolerance = 0.0) ->
        element = e.get(elementOrTarget)

        if !element
          return {
            pass: false,
            message: u.sprintf("Expected %o to have opacity %o, but the element could not be found", elementOrTarget, expectedOpacity)
          }

        if !element.isConnected
          return {
            pass: false
            message: u.sprintf("Expected %o to have opacity %o, but element was detached", elementOrTarget, expectedOpacity)
          }

        actualOpacity = e.styleNumber(element, 'opacity')
        withinTolerance = Math.abs(expectedOpacity - actualOpacity) <= tolerance

        if withinTolerance
          return {
            pass: true,
            message: u.sprintf("Expected %o to not have opacity %o, but it was %o (tolerance ±%o)", elementOrTarget, expectedOpacity, actualOpacity, tolerance)
          }
        else
          return {
            pass: false,
            message: u.sprintf("Expected %o to have opacity %o, but it was %o (tolerance ±%o)", elementOrTarget, expectedOpacity, actualOpacity, tolerance)
          }
