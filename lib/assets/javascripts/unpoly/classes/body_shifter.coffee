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

    bodyRightPadding = e.styleNumber(body, 'paddingRight')
    bodyRightShift = scrollbarWidth + bodyRightPadding

    @changeStyle(body, paddingRight: bodyRightShift)
    @changeStyle(overflowElement, overflowY: 'hidden')

    for anchor in up.viewport.anchoredRight()
      elementRight = e.styleNumber(anchor, 'right')
      elementRightShift = scrollbarWidth + elementRight
      @changeStyle(anchor, right: elementRightShift)

  changeStyle: (element, styles) ->
    @unshiftFns.push(e.setTemporaryStyle(element, styles))

  unshift: ->
    while unshiftFn = @unshiftFns.pop()
      unshiftFn()
