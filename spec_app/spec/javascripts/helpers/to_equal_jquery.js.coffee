# http://jasmine.github.io/2.0/custom_equality.html

u = up.util

beforeEach ->
  jasmine.addCustomEqualityTester (first, second) ->
    if u.isJQuery(first) && u.isJQuery(second)
      first.is(second)
      