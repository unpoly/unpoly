beforeEach ->
  jasmine.addMatchers
    toMatchSelector: (util, customEqualityTesters) ->
      compare: (actualElement, expectedSelector) ->
        pass: $(actualElement).is(expectedSelector)
