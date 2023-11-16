u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toMatchSelector: (util, customEqualityTesters) ->
      compare: (actualElement, expectedSelector) ->
        actualElement = up.element.get(actualElement) # unwrap jQuery
        pass: actualElement.matches(expectedSelector)
