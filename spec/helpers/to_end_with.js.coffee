u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toEndWith: (util, customEqualityTesters) ->
      compare: (string, substring) ->
        pass: string.endsWith(substring)
