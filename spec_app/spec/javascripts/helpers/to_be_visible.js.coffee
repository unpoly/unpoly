u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeVisible: (util, customEqualityTesters) ->
      compare: (object) ->
        pass: object && up.specUtil.isVisible(object)

