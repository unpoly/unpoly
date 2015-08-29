beforeEach ->
  jasmine.addMatchers
    toEndWidth: (util, customEqualityTesters) ->
      compare: (actual, expected) ->
        pass: up.util.endsWith(actual, expected)
