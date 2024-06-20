u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeNaN: (util, customEqualityTesters) ->
      compare: (actual) ->
        pass: Number.isNaN(actual)
