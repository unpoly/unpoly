u = up.util

beforeEach ->
  jasmine.addMatchers
    toMatchList: (util, customEqualityTesters) ->
      compare: (actualList, expectedList) ->
        actualList = u.toArray(actualList) if actualList
        expectedList = u.toArray(expectedList) if expectedList

        console.debug("toMatchList(%o, %o)", actualList, expectedList)

        pass:
          actualList &&
            expectedList &&
            actualList.length == expectedList.length &&
            u.all(expectedList, (elem) -> u.contains(actualList, elem))
