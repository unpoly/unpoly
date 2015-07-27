beforeEach ->
  jasmine.addMatchers
    toBeAround: (util, customEqualityTesters) ->
      compare: (actual, expected, tolerance) ->
        pass: Math.abs(expected - actual) <= tolerance
