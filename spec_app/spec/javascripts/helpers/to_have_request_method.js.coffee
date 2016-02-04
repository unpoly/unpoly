beforeEach ->
  jasmine.addMatchers
    toHaveRequestMethod: (util, customEqualityTesters) ->
      compare: (request, expectedMethod) ->
        console.log("real is %o, wrapped is %o", request.method, request.data()['_method'])
        realMethodMatches = (request.method == expectedMethod)
        wrappedMethodMatches = util.equals(request.data()['_method'], [expectedMethod], customEqualityTesters)
        pass: realMethodMatches || wrappedMethodMatches
