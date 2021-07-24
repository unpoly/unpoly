beforeEach ->
  jasmine.addMatchers
    toBeArray: (util, customEqualityTesters) ->
      compare: (actual) ->
        pass: up.util.isArray(actual)
