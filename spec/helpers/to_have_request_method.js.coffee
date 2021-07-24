u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toHaveRequestMethod: (util, customEqualityTesters) ->
      compare: (request, expectedMethod) ->
        realMethodMatches = (request.method == expectedMethod)
        formData = request.data()
        if u.isFormData(formData)
          wrappedMethod = formData.get('_method')
          wrappedMethodMatches = (wrappedMethod == expectedMethod)
        else
          wrappedMethod = formData['_method']
          wrappedMethodMatches = util.equals(wrappedMethod, [expectedMethod], customEqualityTesters)
        pass: realMethodMatches || wrappedMethodMatches
