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
    return unless up.viewport.rootHasVerticalScrollbar()

    body = document.body
    overflowElement = up.viewport.rootOverflowElement()

    scrollbarWidth = up.viewport.scrollbarWidth()

    bodyRightPadding = e.readComputedStyleNumber(body, 'paddingRight')
    bodyRightShift = scrollbarWidth + bodyRightPadding

    @unshiftFns.push e.writeTemporaryStyle(body, paddingRight: bodyRightShift)
    @unshiftFns.push e.writeTemporaryStyle(overflowElement, overflowY: 'hidden')

    for anchor in up.viewport.anchoredRight()
      elementRight = e.readComputedStyleNumber(anchor, 'right')
      elementRightShift = scrollbarWidth + elementRight
      @unshiftFns.push e.writeTemporaryStyle(anchor, right: elementRightShift)

  unshift: ->
    while unshiftFn = @unshiftFns.pop()
      unshiftFn()
