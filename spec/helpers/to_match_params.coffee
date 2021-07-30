u = up.util

beforeEach ->
  jasmine.addMatchers
    toMatchParams: (util, customEqualityTesters) ->
      compare: (actual, expected) ->
        actual = u.wrapValue(up.Params, actual)
        expected = u.wrapValue(up.Params, expected)

        pass: u.isEqual(actual, expected)
