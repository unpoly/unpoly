u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeMissing: (util, customEqualityTesters) ->
      compare: (actual) ->
        pass: up.util.isMissing(actual)
