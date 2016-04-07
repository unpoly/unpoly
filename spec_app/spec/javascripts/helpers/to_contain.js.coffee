beforeEach ->
  jasmine.addMatchers
    toContain: (util, customEqualityTesters) ->
      compare: (object, expectedElement) ->
        pass: up.util.contains(object, expectedElement)
