u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeBlank: (util, customEqualityTesters) ->
      compare: (actual) ->
        pass: up.util.isBlank(actual)
