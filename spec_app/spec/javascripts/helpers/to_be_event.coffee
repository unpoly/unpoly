beforeEach ->
  jasmine.addMatchers
    toBeEvent: (util, customEqualityTesters) ->
      compare: (actual, eventName, eventProps = {}) ->
        pass: actual &&
          actual.preventDefault &&
          actual.type == eventName &&
          up.util.objectContains(actual, eventProps)
