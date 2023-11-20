beforeEach(function() {
  jasmine.addMatchers({
    toBeOverlay: function(util, customEqualityTesters) {
      return {
        compare: function(layer) {
          layer = up.layer.get(layer)

          return {
            pass: layer && layer.isOverlay()
          }
        }
      }
    }
  })
})
