u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeDetached: (util, customEqualityTesters) ->
      compare: (element) ->
        element = up.element.get(element)
        pass: element && up.specUtil.isDetached(element)
