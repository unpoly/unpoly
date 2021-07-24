u = up.util
$ = jQuery

beforeEach ->
  jasmine.addCustomEqualityTester (first, second) ->
    if u.isJQuery(first) && u.isJQuery(second)
      first.is(second)
      