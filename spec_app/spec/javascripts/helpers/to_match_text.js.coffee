beforeEach ->
  jasmine.addMatchers
    toMatchText: (util, customEqualityTesters) ->
      compare: (actualString, expectedString) ->
        normalize = (str) ->
          str = str.trim()
          str = str.replace(/[\n\r\t ]+/g, ' ')
          str

        pass: normalize(actualString) == normalize(expectedString)
