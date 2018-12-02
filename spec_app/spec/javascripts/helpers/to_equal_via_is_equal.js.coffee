u = up.util
$ = jQuery

beforeEach ->
  jasmine.addCustomEqualityTester (first, second) ->
    if first && second && u.isFunction(first.isEqual) && u.isFunction(second.isEqual)
      first.isEqual(second)
