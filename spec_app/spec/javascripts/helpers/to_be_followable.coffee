u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeFollowable: (util, customEqualityTesters) ->
      compare: (element) ->
        element = up.element.get(element)
        pass: up.link.isFollowable(element)
