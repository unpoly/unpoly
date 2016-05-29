beforeEach ->
  jasmine.addMatchers
    toHaveRequestMethod: (util, customEqualityTesters) ->
      compare: (request, expectedMethod) ->
        realMethodMatches = (request.method == expectedMethod)
        wrappedMethodMatches = util.equals(request.data()['_method'], [expectedMethod], customEqualityTesters)
        pass: realMethodMatches || wrappedMethodMatches
