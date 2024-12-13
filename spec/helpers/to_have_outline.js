function isTransparentColor(value) {
  return value === 'transparent' || value === 'rgba(0, 0, 0, 0)' || value === 'rgba(0,0,0,0)'
}

beforeEach(function() {
  jasmine.addMatchers({
    toHaveOutline: function(util, customEqualityTesters) {
      return {
        compare: function(element) {
          element = up.element.get(element)
          const style = up.element.style(element, 'outline-style')
          const widthNumber = up.element.styleNumber(element, 'outline-width')
          const colorString = up.element.style(element, 'outline-color')

          // An auto style can not always be modified with color or width.
          // E.g. on MacOS Safari the auto style is a rounded, semi-translucent
          // rectangle that cannot be configured.
          return {
            pass: style === 'auto' || (style !== 'none' && widthNumber > 0 && !isTransparentColor(colorString))
          }
        }
      }
    }
  })
})
