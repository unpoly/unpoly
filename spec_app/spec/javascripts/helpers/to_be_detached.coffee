beforeEach ->
  jasmine.addMatchers
    toBeDetached: (util, customEqualityTesters) ->
      compare: (actual) ->
        pass: up.util.isDetached(actual)
