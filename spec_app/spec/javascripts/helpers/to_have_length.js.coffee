u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toHaveLength: (util, customEqualityTesters) ->
      compare: (actualObject, expectedLength) ->
        pass: actualObject && actualObject.length == expectedLength
