u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toMatchUrl: (util, customEqualityTesters) ->
      compare: (actual, expected, normalizeOptions = {}) ->
        pass = true
        pass &&= u.isString(actual)
        pass &&= u.isString(expected)
        pass &&= u.normalizeUrl(actual, normalizeOptions) == u.normalizeUrl(expected, normalizeOptions)
        { pass }


