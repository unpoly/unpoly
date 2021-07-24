u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toHaveAttribute: (util, customEqualityTesters) ->
      compare: (element, expectedAttrName, expectedAttrValue) ->
        element = up.element.get(element)

        if u.isMissing(expectedAttrValue)
          return { pass: element.hasAttribute(expectedAttrName) }
        else
          return { pass: element.getAttribute(expectedAttrName) == expectedAttrValue }

