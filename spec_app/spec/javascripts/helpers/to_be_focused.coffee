u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeFocused: (util, customEqualityTesters) ->
      compare: (elementOrSelector) ->
        element = up.element.get(elementOrSelector)
        pass: element && document.activeElement == element


