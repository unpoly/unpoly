u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeAbortError: (util, customEqualityTesters) ->
      compare: (actual, message) ->
        pass: (actual instanceof Error) && actual.name == 'AbortError' && (!message || (message instanceof RegExp && message.test(actual.message)) || actual.message == message)
