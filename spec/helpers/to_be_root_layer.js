beforeEach(function() {
  jasmine.addMatchers({
    toBeRootLayer: function(util, customEqualityTesters) {
      return {
        compare: function(layer) {
          layer = up.layer.get(layer)

          return {
            pass: layer && layer.isRoot()
          }
        }
      }
    }
  })
})
