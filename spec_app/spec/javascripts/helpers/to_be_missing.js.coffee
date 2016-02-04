beforeEach ->
  jasmine.addMatchers
    toBeMissing: (util, customEqualityTesters) ->
      compare: (actual) ->
        pass: up.util.isMissing(actual)
