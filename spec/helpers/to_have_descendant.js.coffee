u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toHaveDescendant: (util, customEqualityTesters) ->
      compare: (element, expectedDescendant) ->
        pass: $(element).find(expectedDescendant).length


