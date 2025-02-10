beforeEach(function() {
  jasmine.addMatchers({
    toHaveVerticalScrollbar: function(_util) {
      return {
        compare: function(viewport) {
          viewport = up.element.get(viewport)

          let overflowElement = viewport === document ? up.specUtil.documentOverflowElement() : viewport
          let overflow = getComputedStyle(overflowElement).overflowY

          let isMainViewport = [document, document.documentElement, document.body].includes(viewport)
          let heightElement = isMainViewport ? document.scrollingElement : viewport
          let canShowScrollbars = (overflow === 'scroll' || overflow === 'auto' || (isMainViewport && overflow === 'visible'))
          let hasOverflow = (heightElement.scrollHeight > heightElement.clientHeight)

          return {
            pass: canShowScrollbars && hasOverflow
          }
        }
      }
    },
  })
})
