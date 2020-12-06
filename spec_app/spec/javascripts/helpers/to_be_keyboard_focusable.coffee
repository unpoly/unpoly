u = up.util

beforeEach ->
  jasmine.addMatchers
    toBeKeyboardFocusable: (util, customEqualityTesters) ->
      compare: (link) ->
        tabIndex = link.getAttribute('tabindex')

        pass: u.isPresent(tabIndex) && parseInt(tabIndex) >= 0


