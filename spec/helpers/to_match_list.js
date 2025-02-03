const u = up.util

beforeEach(function() {
  jasmine.addMatchers({
    toMatchList(util, customEqualityTesters) {
      return {
        compare(actualList, expectedList) {
          if (actualList) {
            actualList = u.toArray(actualList)
          }
          if (expectedList) {
            expectedList = u.toArray(expectedList)
          }

          return {
            pass:
              actualList &&
              expectedList &&
              (actualList.length === expectedList.length) &&
              u.every(expectedList, (elem) => u.contains(actualList, elem))
          }
        }
      }
    }
  })
})
