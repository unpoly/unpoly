e = up.element

# Gives `<body>` a right padding in the width of a scrollbar.
# Also gives elements anchored to the right side of the screen
# an increased `right`.
#
# This is to prevent the body and elements from jumping when we add the
# modal overlay, which has its own scroll bar.
# This is screwed up, but Bootstrap does the same.
class up.BodyShifter

  constructor: ->
    @unshiftFns = []

  shift: ->
    # Remember whether the root viewport has a visible scrollbar at rest.
    # It will disappear when we set overflow-y: hidden below.
    rootHadVerticalScrollbar = up.viewport.rootHasVerticalScrollbar()

    # Even if root viewport has no scroll bar, we still want to give overflow-y: hidden
    # to the <body> element. Otherwise the user could scroll the underlying page by
    # scrolling over the dimmed backdrop (observable with touch emulation in Chrome DevTools).
    # Note that some devices don't show a vertical scrollbar at rest for a viewport, even
    # when it can be scrolled.
    overflowElement = up.viewport.rootOverflowElement()
    @unshiftFns.push e.setTemporaryStyle(overflowElement, overflowY: 'hidden')

    if rootHadVerticalScrollbar
      body = document.body

      scrollbarWidth = up.viewport.scrollbarWidth()

      bodyRightPadding = e.styleNumber(body, 'paddingRight')
      bodyRightShift = scrollbarWidth + bodyRightPadding

      @unshiftFns.push e.setTemporaryStyle(body, paddingRight: bodyRightShift)

      for anchor in up.viewport.anchoredRight()
        elementRight = e.styleNumber(anchor, 'right')
        elementRightShift = scrollbarWidth + elementRight
        @unshiftFns.push e.setTemporaryStyle(anchor, right: elementRightShift)

  unshift: ->
    while unshiftFn = @unshiftFns.pop()
      unshiftFn()
