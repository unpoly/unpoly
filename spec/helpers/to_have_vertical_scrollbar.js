beforeEach(function() {
  jasmine.addMatchers({
    toHaveVerticalScrollbar: function(_util) {
      return {
        compare: function(viewport) {
          viewport = up.element.get(viewport)

          let overflowElement = viewport === up.viewport.root ? up.specUtil.rootOverflowElement() : viewport
          let overflow = getComputedStyle(overflowElement).overflowY

          return {
            pass: (overflow === 'scroll' || overflow === 'auto') && (viewport.scrollHeight > viewport.clientHeight)
          }
        }
      }
    }
  })
})
