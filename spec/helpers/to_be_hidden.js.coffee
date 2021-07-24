u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeHidden: (util, customEqualityTesters) ->
      compare: (object) ->
        pass: object && up.specUtil.isHidden(object)
