beforeEach ->
  jasmine.addMatchers
    toHaveOpacity: (util, customEqualityTesters) ->
      compare: (element, expectedOpacity, tolerance = 0.0) ->
        element = up.util.element(element)
        actualOpacity = up.util.opacity(element)
        result = {}
        result.pass =  Math.abs(expectedOpacity - actualOpacity) <= tolerance
        unless result.pass
          result.message = up.browser.sprintf("Expected %o to have opacity %o, but it was %o", element, expectedOpacity, actualOpacity)
        return result
