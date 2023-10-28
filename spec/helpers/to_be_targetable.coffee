beforeEach ->
  jasmine.addMatchers
    toBeTargetable: (util, customEqualityTesters) ->
      compare: (actual) ->
        pass: up.fragment.isTargetable(actual)
