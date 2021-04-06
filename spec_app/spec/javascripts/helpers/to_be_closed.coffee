u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeClosed: (util, customEqualityTesters) ->
      compare: (layer) ->
        pass: layer.isClosed()
