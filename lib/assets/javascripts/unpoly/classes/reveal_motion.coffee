e = up.element
u = up.util

class up.RevealMotion

  constructor: (@element, @options = {}) ->
    viewportConfig = up.viewport.config
    @viewport = e.get(@options.viewport) || up.viewport.get(@element)
    @obstructionsLayer = up.layer.get(@viewport)

    @snap = @options.snap ? @options.revealSnap ? viewportConfig.revealSnap
    @padding = @options.padding ? @options.revealPadding ? viewportConfig.revealPadding
    @top = @options.top ? @options.revealTop ? viewportConfig.revealTop
    @max = u.evalOption(@options.max ? @options.revealMax ? viewportConfig.revealMax)

    @topObstructions = viewportConfig.fixedTop
    @bottomObstructions = viewportConfig.fixedBottom

  start: ->
    viewportRect = @getViewportRect(@viewport)
    elementRect = up.Rect.fromElement(@element)
    if @max
      elementRect.height = Math.min(elementRect.height, @max)

    @addPadding(elementRect)
    @substractObstructions(viewportRect)

    if viewportRect.height <= 0
      return up.error.failed.async('Viewport has no visible area')

    originalScrollTop = @viewport.scrollTop
    newScrollTop = originalScrollTop

    if @top || elementRect.height > viewportRect.height
      # Element is either larger than the viewport,
      # or the user has explicitely requested for the element to align at top
      # => Scroll the viewport so the first element row is the first viewport row
      diff = elementRect.top - viewportRect.top
      newScrollTop += diff
    else if elementRect.top < viewportRect.top
      # Element fits within viewport, but sits too high
      # => Scroll up (reduce scrollY), so the element comes down
      newScrollTop -= (viewportRect.top - elementRect.top)
    else if elementRect.bottom > viewportRect.bottom
      # Element fits within viewport, but sits too low
      # => Scroll down (increase scrollY), so the element comes up
      newScrollTop += (elementRect.bottom - viewportRect.bottom)
    else
      # Element is fully visible within viewport
      # => Do nothing

    if u.isNumber(@snap) && newScrollTop < @snap && elementRect.top < (0.5 * viewportRect.height)
      newScrollTop = 0

    if newScrollTop != originalScrollTop
      @scrollTo(newScrollTop)
    else
      Promise.resolve()

  scrollTo: (newScrollTop) ->
    @scrollMotion = new up.ScrollMotion(@viewport, newScrollTop, @options)
    @scrollMotion.start()

  getViewportRect: ->
    if up.viewport.isRoot(@viewport)
      # Other than an element with overflow-y, the document viewport
      # stretches to the full height of its contents. So we create a viewport
      # sized to the usuable screen area.
      new up.Rect
        left: 0
        top: 0
        width: up.viewport.rootWidth()
        height: up.viewport.rootHeight()
    else
      up.Rect.fromElement(@viewport)

  addPadding: (elementRect) ->
    elementRect.top -= @padding
    elementRect.height += 2 * @padding

  selectObstructions: (selectors) ->
    up.fragment.all(selectors.join(','), layer: @obstructionsLayer)

  substractObstructions: (viewportRect) ->
    for obstruction in @selectObstructions(@topObstructions)
      obstructionRect = up.Rect.fromElement(obstruction)
      diff = obstructionRect.bottom - viewportRect.top
      if diff > 0
        viewportRect.top += diff
        viewportRect.height -= diff

    for obstruction in @selectObstructions(@bottomObstructions)
      obstructionRect = up.Rect.fromElement(obstruction)
      diff = viewportRect.bottom - obstructionRect.top
      if diff > 0
        viewportRect.height -= diff

  finish: ->
    @scrollMotion?.finish()
