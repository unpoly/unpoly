function isTransparentColor(value) {
  return value === 'transparent' || value === 'rgba(0, 0, 0, 0)' || value === 'rgba(0,0,0,0)'
}

beforeEach(function() {
  jasmine.addMatchers({
    toHaveOutline: function(util, customEqualityTesters) {
      return {
        compare: function(element) {
          element = up.element.get(element)
          const widthNumber = up.element.styleNumber(element, 'outline-width')
          const colorString = up.element.style(element, 'outline-color')

          return {
            pass: widthNumber > 0 && !isTransparentColor(colorString)
          }
        }
      }
    }
  })
})
