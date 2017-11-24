beforeEach ->
  jasmine.addMatchers
    toBeError: (util, customEqualityTesters) ->
      compare: (actual, message) ->
        pass: (actual instanceof Error) && (!message || (message instanceof RegExp && actual.message =~ message) || actual.message == message)
