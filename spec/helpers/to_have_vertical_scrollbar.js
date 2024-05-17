beforeEach(function() {
  jasmine.addMatchers({
    toHaveVerticalScrollbar: function(_util) {
      return {
        compare: function(viewport) {
          viewport = up.element.get(viewport)

          // let originalScrollTop = element.scrollTop
          // element.scrollTop = originalScrollTop === 1 ? 0 : 1
          // let movedScrollTop = element.scrollTop
          // element.scrollTop = originalScrollTop
          //
          // console.debug("toHaveVerticalScrollbar: element %o, original top %o, moved top %o", element, originalScrollTop, movedScrollTop)
          //
          // return {
          //   pass: movedScrollTop !== originalScrollTop
          // }

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
