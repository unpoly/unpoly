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
    @reset()

  reset: ->
    @unshiftNow()
    @shiftCount = 0

  shift: ->
    @shiftCount++

    if @shiftCount > 1
      return

    # Remember whether the root viewport has a visible scrollbar at rest.
    # It will disappear when we set overflow-y: hidden below.
    scrollbarTookSpace = up.viewport.rootHasReducedWidthFromScrollbar()

    # Even if root viewport has no scroll bar, we still want to give overflow-y: hidden
    # to the <body> element. Otherwise the user could scroll the underlying page by
    # scrolling over the dimmed backdrop (observable with touch emulation in Chrome DevTools).
    # Note that some devices don't show a vertical scrollbar at rest for a viewport, even
    # when it can be scrolled.
    overflowElement = up.viewport.rootOverflowElement()
    @changeStyle(overflowElement, overflowY: 'hidden')

    # If the scrollbar never took space away from the main viewport's client width,
    # we do not need to run the code below that would pad it on the right.
    if !scrollbarTookSpace
      return

    body = document.body

    scrollbarWidth = up.viewport.scrollbarWidth()

    bodyRightPadding = e.styleNumber(body, 'paddingRight')
    bodyRightShift = scrollbarWidth + bodyRightPadding

    @changeStyle(body, paddingRight: bodyRightShift)

    for anchor in up.viewport.anchoredRight()
      elementRight = e.styleNumber(anchor, 'right')
      elementRightShift = scrollbarWidth + elementRight
      @changeStyle(anchor, right: elementRightShift)

  changeStyle: (element, styles) ->
    @unshiftFns.push(e.setTemporaryStyle(element, styles))

  unshift: ->
    @shiftCount--
    if @shiftCount > 0
      return

    @unshiftNow()

  unshiftNow: ->
    while unshiftFn = @unshiftFns.pop()
      unshiftFn()
