u = up.util

beforeEach ->
  jasmine.addMatchers
    toMatchParams: (util, customEqualityTesters) ->
      compare: (actual, expected) ->
        actual = up.Params.wrap(actual)
        expected = up.Params.wrap(expected)

        pass: u.isEqual(actual, expected)
