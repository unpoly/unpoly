#= require ./base

class up.Layer.WithViewport extends up.Layer

  # It makes only sense to have a single body shifter
  @bodyShifter: new up.BodyShifter()

  open: (parentElement, initialInnerContent) ->
    @createElement(parentElement)
    @backdropElement = affix(@element, '.up-layer-backdrop')
    @viewportElement = affix(@element, '.up-layer-viewport')
    @frameInnerContent(@viewportElement, initialInnerContent)

    @shiftBody()
    return @startOpenAnimation()

  close: ->
    return @startCloseAnimation().then =>
      @destroyElement()
      @unshiftBody()

  startOpenAnimation: ->
    animateOptions = @openAnimateOptions()

    return Promise.all([
      up.animate(@viewportElement, @evalOption(@openAnimation), animateOptions),
      up.animate(@backdropElement, @evalOption(@backdropOpenAnimation), animateOptions),
    ])

  shiftBody: ->
    @constructor.bodyShifter.shift()

  unshiftBody: ->
    @constructor.bodyShifter.unshift()

  startCloseAnimation: ->
    animateOptions = @closeAnimateOptions()
    return Promise.all([
      up.animate(@viewportElement, @evalOption(@closeAnimation), animateOptions),
      up.animate(@backdropElement, @evalOption(@backdropCloseAnimation), animateOptions),
    ])
