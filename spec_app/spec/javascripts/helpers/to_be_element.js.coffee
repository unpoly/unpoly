beforeEach ->
  jasmine.addMatchers
    toBeElement: (util, customEqualityTesters) ->
      compare: (actual) ->
        pass: up.util.isElement(actual)
