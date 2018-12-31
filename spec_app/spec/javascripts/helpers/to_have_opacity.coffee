u = up.util
e = up.element
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toHaveOpacity: (util, customEqualityTesters) ->
      compare: (element, expectedOpacity, tolerance = 0.0) ->
        element = e.get(element)
        actualOpacity = e.computedStyleNumber(element, 'opacity')
        result = {}
        result.pass =  Math.abs(expectedOpacity - actualOpacity) <= tolerance
        unless result.pass
          result.message = up.browser.sprintf("Expected %o to have opacity %o, but it was %o", element, expectedOpacity, actualOpacity)
        return result
