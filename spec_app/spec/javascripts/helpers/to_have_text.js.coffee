u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toHaveText: (util, customEqualityTesters) ->
      compare: (element, expectedText) ->
        element = up.element.get(element)
        actualText = element?.textContent?.trim()
        expectedText = expectedText.trim()

        result = {}
        result.pass = (element && actualText == expectedText)

        if result.pass
          result.message = u.sprintf('Expected element %o to not have text %s', element, actualText)
        else
          result.message = u.sprintf('Expected element %o to have text %s, but its text was %s', element, expectedText, actualText)

        return result

