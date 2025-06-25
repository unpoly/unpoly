const u = up.util
const $ = jQuery

beforeEach(function() {
  return jasmine.addMatchers({
    toHaveRequestMethod(util, customEqualityTesters) {
      return {
        compare(request, expectedMethod) {
          expectedMethod = up.util.normalizeMethod(expectedMethod)

          let wrappedMethod, wrappedMethodMatches
          const realMethodMatches = (request.method === expectedMethod)
          const formData = request.data()
          if (u.isFormData(formData)) {
            wrappedMethod = formData.get('_method')
            wrappedMethodMatches = (wrappedMethod === expectedMethod)
          } else {
            wrappedMethod = formData['_method']
            wrappedMethodMatches = util.equals(wrappedMethod, [expectedMethod], customEqualityTesters)
          }
          return { pass: realMethodMatches || wrappedMethodMatches }
        }
      }
    }
  })
})
