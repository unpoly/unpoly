beforeEach ->
  jasmine.addMatchers
    toContain: (util, customEqualityTesters) ->
      compare: (object, expectedElement) ->
        pass: up.util.isGiven(object) && up.util.contains(object, expectedElement)
