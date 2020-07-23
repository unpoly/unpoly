#= require ./base
#= require ./overlay

e = up.element

class up.Layer.OverlayWithViewport extends up.Layer.Overlay

  # Since there is only one <body>, we share a single BodyShifter
  # between all overlay instances.
  @bodyShifter: new up.BodyShifter()

  # For stubbing in tests
  @getParentElement: ->
    # Always make a fresh lookup of the <body>, since the <body>
    # might be swapped out with a new element.
    document.body

    ###**
  @function up.Layer.OverlayWithViewport#openNow
  @param {Element} options.content
  @param {Function} options.onContentAttached
  ###
  createElements: (content) ->
    @shiftBody()
    @createElement(@constructor.getParentElement())
    @createBackdropElement(@element) if @backdrop
    @createViewportElement(@element)
    @createBoxElement(@viewportElement)
    @createContentElement(@boxElement, content)

  onElementsRemoved: ->
    @unshiftBody()

  shiftBody: ->
    @constructor.bodyShifter.shift()

  unshiftBody: ->
    @constructor.bodyShifter.unshift()

  sync: ->
    # A swapping of <body> might have removed this overlay from the DOM, so we
    # attach it again.
    #
    # We also check #isOpen() in case some async code calls #sync() on a layer
    # that was already closed. In that case don't run the code below that might
    # re-attach the overlay.
    if @isDetached() && @isOpen()
      @constructor.getParentElement().appendChild(@element)
