u = up.util

beforeEach ->
  jasmine.addMatchers
    toMatchList: (util, customEqualityTesters) ->
      compare: (actualList, expectedList) ->
        actualList = u.toArray(actualList) if actualList
        expectedList = u.toArray(expectedList) if expectedList

        pass:
          actualList &&
            expectedList &&
            actualList.length == expectedList.length &&
            u.every(expectedList, (elem) -> u.contains(actualList, elem))
