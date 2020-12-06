u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeFocused: (util, customEqualityTesters) ->
      compare: (element) ->
        if element instanceof up.Layer
          element = element.getFocusElement()
        else
          element = up.element.get(element)
        pass: element && document.activeElement == element
