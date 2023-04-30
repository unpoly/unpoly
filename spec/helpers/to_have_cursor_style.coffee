u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toHaveCursorStyle: (util, customEqualityTesters) ->
      compare: (element, expectedStyle) ->
        element = up.element.get(element)
        pass: element && getComputedStyle(element).cursor == expectedStyle
