u = up.util

beforeEach(function() {
  jasmine.addMatchers({
    toHaveVerticalScrollbar: function(util, customEqualityTesters) {
      return {
        compare: function(element) {
          let overflow = getComputedStyle(element).overflowY

          return {
            pass: (overflow === 'scroll' || overflow === 'auto') && (element.scrollHeight > element.clientHeight)
          }
        }
      }
    }
  })
})
