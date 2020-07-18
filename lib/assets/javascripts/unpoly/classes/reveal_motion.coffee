e = up.element
u = up.util

class up.RevealMotion

  constructor: (@element, options = {}) ->
    viewportConfig = up.viewport.config
    @viewport = options.viewport || up.viewport.get(@element)
    @obstructionsLayer = up.layer.get(@viewport)

    up.legacy.fixKey(viewportConfig, 'snap', 'revealSnap')
    if options.snap == true # default set by up.viewport.reveal()
      @snap = viewportConfig.revealSnap
    else if options.snap == false
      @snap = 0
    else
      # snap is now a given pixel value

    @padding = options.padding ? options.revealPadding ? viewportConfig.revealPadding
    @top = options.revealTop ? options.top
    @topObstructions = viewportConfig.fixedTop
    @bottomObstructions = viewportConfig.fixedBottom

    # Options for up.ScrollMotion
    @speed = options.speed ? options.scrollSpeed ? viewportConfig.scrollSpeed
    @behavior = options.behavior ? options.scrollBehavior

  start: ->
    elementRect = up.Rect.fromElement(@element)
    viewportRect = @getViewportRect(@viewport)

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

    if newScrollTop < @snap && elementRect.top < (0.5 * viewportRect.height)
      newScrollTop = 0

    # if elementRect.height < 0.5 * viewportRect.height && viewportRect.height -

    # if (viewportRect.height - newScrollTop < @snap) && (elementRect.height + @snap < viewportRect.height)
    #   if @viewport
    #

    if newScrollTop != originalScrollTop
      @scrollTo(newScrollTop)
    else
      Promise.resolve()

  scrollTo: (newScrollTop) ->
    scrollOptions =
      speed: @speed
      behavior: @behavior
    @scrollMotion = new up.ScrollMotion(@viewport, newScrollTop, scrollOptions)
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
