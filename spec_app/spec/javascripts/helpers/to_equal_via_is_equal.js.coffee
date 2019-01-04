u = up.util
$ = jQuery

beforeEach ->
  jasmine.addCustomEqualityTester (first, second) ->
    if u.isObject(first) && u.isObject(second) && first[up.util.isEqual.key]
      first[u.isEqual.key](second)
