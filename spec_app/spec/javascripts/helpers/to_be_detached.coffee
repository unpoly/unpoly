u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeDetached: (util, customEqualityTesters) ->
      compare: (actual) ->
        pass: up.testUtil.isDetached(actual)
