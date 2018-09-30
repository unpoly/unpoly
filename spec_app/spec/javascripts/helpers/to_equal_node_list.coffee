# http://jasmine.github.io/2.0/custom_equality.html

u = up.util

beforeEach ->
  jasmine.addCustomEqualityTester (a, b) ->
    if a instanceof NodeList
      return (a.length == b.length) && u.all(a, (elem, index) -> a[index] == b[index])
