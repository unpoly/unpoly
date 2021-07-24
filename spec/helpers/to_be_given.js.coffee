u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeGiven: (util, customEqualityTesters) ->
      compare: (actual) ->
        pass: up.util.isGiven(actual)
