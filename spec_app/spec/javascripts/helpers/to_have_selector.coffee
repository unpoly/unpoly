u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toHaveSelector: (util, customEqualityTesters) ->
      compare: (root, selector) ->
        match = root.querySelector(selector)
        pass: !!match

