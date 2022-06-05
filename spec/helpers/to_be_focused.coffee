u = up.util
e = up.element
$ = jQuery

describeElement = (element) ->
  up.fragment.tryToTarget(element) || e.tagName(element)

beforeEach ->
  jasmine.addMatchers
    toBeFocused: (util, customEqualityTesters) ->
      compare: (element) ->
        if element instanceof up.Layer
          element = element.getFocusElement()
        else
          element = up.element.get(element)

        focusedElement = document.activeElement

        if !element
          pass = false
          message = 'cannot check focus on a null element'
        else if focusedElement == element
          pass = true
          message = 'Expected ' + describeElement(element) + ' not to be focused'
        else
          pass = false
          message = 'Expected ' + describeElement(element) + ' to be focused'
          if focusedElement
            message += ', but ' + describeElement(focusedElement) + ' was focused'
          else
            message += ', but nothing was focused'

        return { pass, message }
