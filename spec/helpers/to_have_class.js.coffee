u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toHaveClass: (util, customEqualityTesters) ->
      compare: (element, expectedClass) ->
        element = up.element.get(element)
        pass: element && element.classList.contains(expectedClass)

