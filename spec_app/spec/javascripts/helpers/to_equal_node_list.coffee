u = up.util
$ = jQuery

beforeEach ->
  jasmine.addCustomEqualityTester (a, b) ->
    if a instanceof NodeList
      return (a.length == b.length) && u.all(a, (elem, index) -> a[index] == b[index])
