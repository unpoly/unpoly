#= require ./base
#= require ./overlay

e = up.element

class up.Layer.OverlayWithViewport extends up.Layer.Overlay

  # It makes only sense to have a single body shifter
  @bodyShifter: new up.BodyShifter()

  openNow: (options) ->
    @createElement()
    @backdropElement = e.affix(@element, '.up-overlay-backdrop')
    @viewportElement = e.affix(@element, '.up-overlay-viewport')
    @frameInnerContent(@viewportElement, options)

    @shiftBody()
    return @startOpenAnimation(options)

  closeNow: (options) ->
    animation = => @startCloseAnimation(options)
    @destroyElement({ animation }).then =>
      @unshiftBody()

  shiftBody: ->
    @constructor.bodyShifter.shift()

  unshiftBody: ->
    @constructor.bodyShifter.unshift()

  startOpenAnimation: (options = {}) ->
    animateOptions = @openAnimateOptions(options)
    frameAnimation = options.animation ? @evalOption(@openAnimation)
    backdropAnimation = options.backdropAnimation ? @evalOption(@backdropOpenAnimation)

    return Promise.all([
      up.animate(@frameElement, frameAnimation, animateOptions),
      up.animate(@backdropElement, backdropAnimation, animateOptions),
    ])

  startCloseAnimation: (options = {}) ->
    animateOptions = @closeAnimateOptions(options)
    frameAnimation = options.animation ? @evalOption(@closeAnimation)
    backdropAnimation = options.backdropAnimation ? @evalOption(@backdropCloseAnimation)

    return Promise.all([
      up.animate(@frameElement, frameAnimation, animateOptions),
      up.animate(@backdropElement, backdropAnimation, animateOptions),
    ])
