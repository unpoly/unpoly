# http://jasmine.github.io/2.0/custom_equality.html

u = up.util

beforeEach ->
  jasmine.addCustomEqualityTester (first, second) ->
    if first && second && u.isFunction(first.isEqual) && u.isFunction(second.isEqual)
      first.isEqual(second)
