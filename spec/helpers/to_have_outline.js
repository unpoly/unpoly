beforeEach(function() {
  jasmine.addMatchers({
    toHaveOutline: function(util, customEqualityTesters) {
      return {
        compare: function(element) {
          element = up.element.get(element)
          return {
            pass: up.element.styleNumber(element, 'outline-width') > 0
          }
        }
      }
    }
  })
})
