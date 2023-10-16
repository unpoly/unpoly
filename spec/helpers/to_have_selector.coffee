u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toHaveSelector: (util, customEqualityTesters) ->
      compare: (root, selector) ->
        root = up.element.get(root)
        match = root.querySelector(selector)
        pass: !!match

