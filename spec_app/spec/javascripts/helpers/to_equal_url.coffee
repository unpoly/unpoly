u = up.util

beforeEach ->
  jasmine.addMatchers
    toEqualUrl: (util, customEqualityTesters) ->
      compare: (actual, expected, normalizeOptions = {}) ->
        normalizedActual = u.normalizeUrl(actual, normalizeOptions)
        normalizedExpected = u.normalizeUrl(expected, normalizeOptions)
        pass: normalizedActual == normalizedExpected


