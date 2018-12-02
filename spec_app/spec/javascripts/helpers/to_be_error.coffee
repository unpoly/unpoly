u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeError: (util, customEqualityTesters) ->
      compare: (actual, message) ->
        pass: (actual instanceof Error) && (!message || (message instanceof RegExp && message.test(actual.message)) || actual.message == message)
