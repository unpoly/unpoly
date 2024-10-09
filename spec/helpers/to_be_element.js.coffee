u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeElement: (util, customEqualityTesters) ->
      compare: (actual) ->
        pass: actual instanceof Element
