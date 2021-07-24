u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeAttached: (util, customEqualityTesters) ->
      compare: (element) ->
        element = up.element.get(element)
        pass: element && up.specUtil.isAttached(element)
