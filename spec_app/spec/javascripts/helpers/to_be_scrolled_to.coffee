u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeScrolledTo: (util, customEqualityTesters) ->
      compare: (object, expectedTop) ->
        tolerance = 1.5
        actualTop = $(object).scrollTop()
        pass:
          Math.abs(expectedTop - actualTop) <= tolerance
