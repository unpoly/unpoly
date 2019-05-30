u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toMatchURL: (util, customEqualityTesters) ->
      compare: (actual, expected, normalizeOptions = {}) ->
        pass = true
        pass &&= u.isString(actual)
        pass &&= u.isString(expected)
        pass &&= u.normalizeURL(actual, normalizeOptions) == u.normalizeURL(expected, normalizeOptions)
        { pass }


