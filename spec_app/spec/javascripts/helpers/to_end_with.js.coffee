endsWith = (string, substring) ->
  string.indexOf(substring) == string.length - substring.length

beforeEach ->
  jasmine.addMatchers
    toEndWith: (util, customEqualityTesters) ->
      compare: (actual, expected) ->
        pass: endsWith(actual, expected)
