beforeEach(function() {
  jasmine.addMatchers({
    toHaveVerticalScrollbar: function(_util) {
      return {
        compare: function(viewport) {
          viewport = up.element.get(viewport)

          let overflowElement = viewport === document ? up.specUtil.documentOverflowElement() : viewport
          let overflow = getComputedStyle(overflowElement).overflowY

          let heightElement = [document, document.documentElement, document.body].includes(viewport) ? document.scrollingElement : viewport

          // debugger

          return {
            pass: (overflow === 'scroll' || overflow === 'auto') && (heightElement.scrollHeight > heightElement.clientHeight)
          }
        }
      }
    },
  })
})
