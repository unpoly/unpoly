u = up.util

beforeEach ->
  jasmine.addMatchers
    toMatchJSON: (util, customEqualityTesters) ->
      compare: (actualJSON, expected) ->
        expected = JSON.stringify(expected) unless u.isString(expected)
        expectedParsed = JSON.parse(expected)
        actualParsed = JSON.parse(actualJSON)

        pass:
          util.equals(expectedParsed, actualParsed, customEqualityTesters)
