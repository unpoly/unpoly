u = up.util
e = up.element
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toHaveOpacity: (util, customEqualityTesters) ->
      compare: (element, expectedOpacity, tolerance = 0.0) ->
        element = e.get(element)
        result = {}

        if element.isConnected
          actualOpacity = e.styleNumber(element, 'opacity')
          result.pass =  Math.abs(expectedOpacity - actualOpacity) <= tolerance
          unless result.pass
            result.message = u.sprintf("Expected %o to have opacity %o, but it was %o (tolerance ±%o)", element, expectedOpacity, actualOpacity, tolerance)
        else
          result.pass = false
          result.message = u.sprintf("Expected %o to have opacity %o, element was detached", element, expectedOpacity)

        return result
