e = up.element
u = up.util

class up.RevealMotion

  constructor: (@element, options = {}) ->
    layoutConfig = up.viewport.config
    @viewport = options.viewport || up.viewport.closest(@element)
    @layer = options.layer || up.layer.get(@viewport)
    up.legacy.fixKey(layoutConfig, 'snap', 'revealSnap')
    snapDefault = layoutConfig.revealSnap
    @snap = options.snap ? options.revealSnap ? snapDefault
    if @snap == false
      @snap = 0
    else if @snap == true
      @snap = snapDefault
    @padding = options.padding ? options.revealPadding ? layoutConfig.revealPadding
    @top = options.top
    @fixedTop = options.fixedTop ? layoutConfig.fixedTop
    @fixedBottom = options.fixedBottom ? layoutConfig.fixedBottom

    # Options for up.ScrollMotion
    @speed = options.speed ? options.scrollSpeed ? layoutConfig.scrollSpeed
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
    u.flatMap selectors, (selector) => up.layer.allElements(selector, { @layer })

  substractObstructions: (viewportRect) ->
    for obstruction in @selectObstructions(@fixedTop)
      obstructionRect = up.Rect.fromElement(obstruction)
      diff = obstructionRect.bottom - viewportRect.top
      if diff > 0
        viewportRect.top += diff
        viewportRect.height -= diff

    for obstruction in @selectObstructions(@fixedBottom)
      obstructionRect = up.Rect.fromElement(obstruction)
      diff = viewportRect.bottom - obstructionRect.top
      if diff > 0
        viewportRect.height -= diff

  finish: ->
    @scrollMotion?.finish()
