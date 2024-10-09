beforeEach ->
  jasmine.addMatchers
    toBeTextNode: (util, customEqualityTesters) ->
      compare: (actual, expectedText) ->
        pass: (actual instanceof Text) && (up.util.isMissing(expectedText) || actual.wholeText.trim() == expectedText)
