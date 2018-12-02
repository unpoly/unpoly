u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeJQuery: (util, customEqualityTesters) ->
      compare: (actual) ->
        pass: up.util.isJQuery(actual)
