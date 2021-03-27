u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeAbortError: (util, customEqualityTesters) ->
      compare: (actual) ->
        pass: (actual instanceof Error) && actual.name == 'AbortError'
