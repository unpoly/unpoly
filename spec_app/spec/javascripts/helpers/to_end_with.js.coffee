beforeEach ->
  jasmine.addMatchers
    toEndWith: (util, customEqualityTesters) ->
      compare: (actual, expected) ->
        pass: up.util.endsWith(actual, expected)
