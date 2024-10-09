u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeNodeList: (util, customEqualityTesters) ->
      compare: (actual) ->
        pass: actual instanceof NodeList
