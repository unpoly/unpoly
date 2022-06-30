u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeError: (util, customEqualityTesters) ->
      compare: (actual, args...) ->
        if args.length == 2
          [name, message] = args
        else
          message = args[0]

        pass: (actual instanceof Error) &&
          (!name || (actual.name == name)) &&
          (!message || (message instanceof RegExp && message.test(actual.message)) || actual.message == message)
