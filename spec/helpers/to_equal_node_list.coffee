u = up.util
$ = jQuery

beforeEach ->
  jasmine.addCustomEqualityTester (a, b) ->
    if a instanceof NodeList
      return (a.length == b.length) && u.every(a, (elem, index) -> a[index] == b[index])
