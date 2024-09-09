u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toHaveCursorStyle: (util, customEqualityTesters) ->
      compare: (element, expectedStyle) ->
        element = up.element.get(element)
        actualStyle = element && getComputedStyle(element).cursor
        pass = (actualStyle == expectedStyle)

        if pass
          message = "Expected element to not have cursor style \"#{expectedStyle}\""
        else
          message = "Expected element to have cursor style \"#{expectedStyle}\", but its cursor style was \"#{actualStyle}\""

        return { pass, message }
