beforeEach ->
  jasmine.addMatchers
    toBeAttached: (util, customEqualityTesters) ->
      compare: (actual) ->
        pass: !up.util.isDetached(actual)
