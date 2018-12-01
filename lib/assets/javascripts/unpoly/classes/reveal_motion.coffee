e = up.element

class up.RevealMotion

  constructor: (@element, options) ->
    layoutConfig = up.layout.config
    @viewport = options.viewport ? up.layout.viewportOf(@element)
    @speed = options.speed ? layoutConfig.scrollSpeed
    @snap = options.snap ? layoutConfig.revealSnap
    @top = options.top

  start: ->
    elementRect = up.Rect.fromElement(@element)
    viewportRect = @getViewportRect(@viewport)

    console.debug("elementRect from %o is %o", @element, elementRect)

    @addPadding(elementRect)
    @substractObstructions(viewportRect)

    console.debug("resulting elementRect is %o, viewportRect is %o", elementRect, viewportRect)

    if viewportRect.height < 0
      return Promise.reject(new Error('Viewport has no visible area'))

    originalScrollPos = @viewport.scrollTop
    newScrollPos = originalScrollPos

    if @top || elementRect.height > viewportRect.height
      # Element is either larger than the viewport,
      # or the user has explicitely requested for the element to align at top
      # => Scroll the viewport so the first element row is the first viewport row
      newScrollPos = elementRect.top
    else if elementRect.top < viewportRect.top
      # Element fits within viewport, but sits too high
      # => Scroll up (reduce scrollY), so the element comes down
      newScrollPos -= (viewportRect.top - elementRect.top)
    else if elementRect.bottom > viewportRect.bottom
      # Element fits within viewport, but sits too low
      # => Scroll down (increase scrollY), so the element comes up
      newScrollPos += (elementRect.bottom - viewportRect.bottom)
    else
      # Element is fully visible within viewport
      # => Do nothing

    if @snap < viewportRect.height && newScrollPos < @snap
      newScrollPos = 0

    console.debug("originalScrollPos was %o, newScrollPos is %o", originalScrollPos, newScrollPos)

    if newScrollPos != originalScrollPos
      @scrollMotion = new up.ScrollMotion(@viewport, newScrollPos, { speed: @speed })
      @scrollMotion.start()
    else
      Promise.resolve()

  addPadding: (elementRect) ->
    padding = up.layout.config.revealPadding
    elementRect.top -= padding
    elementRect.height += 2 * padding

  getViewportRect: ->
    if up.browser.isDocumentViewport(@viewport)
      html = document.documentElement
      new up.Rect(left: 0, top: 0, width: html.clientWidth, height: html.clientHeight)
    else
      up.Rect.fromElement(@viewport)

  substractObstructions: (viewportRect) ->
    obstructions = up.layout.fixedElements()
    for obstruction in obstructions
      obstructionRect = up.Rect.fromElement(obstruction)
      @substractObstruction(viewportRect, obstructionRect)

  substractObstruction: (viewportRect, obstructionRect) ->
    if obstructionRect.bottom < viewportRect.top || viewportRect.bottom <= obstructionRect.top
      # There is no overlap. Do nothing.
    else if obstructionRect.top <= viewportRect.top && viewportRect.bottom <= obstructionRect.bottom
      # The viewport is completely enclosed by the obstruction.
      # We cannot reveal anything.
      viewportRect.height = 0
    else if viewportRect.top <= obstructionRect.top && obstructionRect.bottom <= viewportRect.bottom
      # The viewport completely encloses the obstruction. This is a weird case, but we will
      # assume that there are still some visible pixels. Do nothing.
    else
      # The obstruction overlaps the viewport at the top of bottom edge.
      # We shrink the viewport so the remainder is free of the obstructionRect.
      viewportRect.top = Math.max(viewportRect.top, obstructionRect.top)
      viewportRect.height = Math.min(viewportRect.bottom, obstructionRect.bottom) - viewportRect.top

  finish: ->
    @scrollMotion?.finish()
