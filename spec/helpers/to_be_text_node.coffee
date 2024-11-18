beforeEach ->
  jasmine.addMatchers
    toBeTextNode: (util, customEqualityTesters) ->
      compare: (actual, expectedText, { trim = false } = {}) ->
        normalize = (text) -> if trim then text.trim() else text
        pass: (actual instanceof Text) && (up.util.isMissing(expectedText) || normalize(actual.wholeText) == normalize(expectedText))

