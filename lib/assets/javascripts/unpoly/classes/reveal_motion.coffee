e = up.element

class up.RevealMotion

  constructor: (@element, options) ->
    layoutConfig = up.layout.config
    @viewport = options.viewport ? up.layout.viewportOf(@element)
    @speed = options.speed ? options.scrollSpeed ? layoutConfig.scrollSpeed
    snapDefault = layoutConfig.revealSnap
    @snap = options.snap ? options.revealSnap ? snapDefault
    if @snap == false
      @snap = 0
    else if @snap == true
      @snap = snapDefault
    @padding = options.padding ? options.revealPadding ? layoutConfig.revealPadding
    @behavior = options.behavior ? options.scrollBehavior
    @top = options.top
    @fixedTop = options.fixedTop ? layoutConfig.fixedTop
    @fixedBottom = options.fixedBottom ? layoutConfig.fixedBottom

  start: ->
    elementRect = up.Rect.fromElement(@element)
    viewportRect = @getViewportRect(@viewport)

    @addPadding(elementRect)
    @substractObstructions(viewportRect)

    if viewportRect.height <= 0
      return Promise.reject(new Error('Viewport has no visible area'))

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

    if newScrollTop < @snap && @snap < viewportRect.height
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

  addPadding: (elementRect) ->
    elementRect.top -= @padding
    elementRect.height += 2 * @padding

  getViewportRect: ->
    if up.browser.isDocumentViewport(@viewport)
      html = document.documentElement
      new up.Rect(left: 0, top: 0, width: html.clientWidth, height: html.clientHeight)
    else
      up.Rect.fromElement(@viewport)

  substractObstructions: (viewportRect) ->
    for obstruction in e.list(@fixedTop...)
      obstructionRect = up.Rect.fromElement(obstruction)
      diff = obstructionRect.bottom - viewportRect.top
      if diff > 0
        viewportRect.top += diff
        viewportRect.height -= diff

    for obstruction in e.list(@fixedBottom...)
      obstructionRect = up.Rect.fromElement(obstruction)
      diff = viewportRect.bottom - obstructionRect.top
      if diff > 0
        viewportRect.height -= diff

#  substractObstruction: (viewportRect, obstructionRect) ->
#    console.debug("Removing obstruction %o", obstructionRect)
#    if obstructionRect.bottom < viewportRect.top || viewportRect.bottom <= obstructionRect.top
#      console.debug("=> No overlap")
#      # There is no overlap. Do nothing.
#    else if obstructionRect.top <= viewportRect.top && viewportRect.bottom <= obstructionRect.bottom
#      console.debug("=> Viewport inclosed")
#      # The viewport is completely enclosed by the obstruction.
#      # We cannot reveal anything.
#      viewportRect.height = 0
#    # else if viewportRect.top <= obstructionRect.top && obstructionRect.bottom <= viewportRect.bottom
#    #   console.debug("=> Element encloses viewport")
#    #   # The viewport completely encloses the obstruction. This is a weird case, but we will
#    #   # assume that there are still some visible pixels. Do nothing.
#    else
#      console.debug("=> Some overlap")
#      # The obstruction overlaps the viewport at the top of bottom edge.
#      # We shrink the viewport so the remainder is free of the obstructionRect.
#      viewportRect.top = Math.max(viewportRect.top, obstructionRect.top)
#      viewportRect.height = Math.min(viewportRect.bottom, obstructionRect.bottom) - viewportRect.top
#    console.debug("Viewport after removal: %o", viewportRect)

  finish: ->
    @scrollMotion?.finish()
