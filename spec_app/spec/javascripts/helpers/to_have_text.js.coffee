u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toHaveText: (util, customEqualityTesters) ->
      compare: (element, expectedText) ->
        element = up.element.get(element)
        pass: element && (element.textContent?.trim() == expectedText.trim())
