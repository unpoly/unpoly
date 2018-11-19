beforeEach ->
  jasmine.addMatchers
    toBeAttached: (util, customEqualityTesters) ->
      compare: (actual) ->
        pass: !up.testUtil.isDetached(actual)
