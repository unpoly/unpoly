#= require ./base
#= require ./overlay

class up.Layer.OverlayWithViewport extends up.Layer.Overlay

  # It makes only sense to have a single body shifter
  @bodyShifter: new up.BodyShifter()

  openNow: (options) ->
    @createElement()
    @element.classList.add('.up-overlay-with-viewport')
    @backdropElement = affix(@element, '.up-overlay-backdrop')
    @viewportElement = affix(@element, '.up-overlay-viewport')
    @frameInnerContent(@viewportElement, options)

    @shiftBody()
    return @startOpenAnimation(options)

  closeNow: (options) ->
    return @startCloseAnimation(options).then =>
      @destroyElement()
      @unshiftBody()

  shiftBody: ->
    @constructor.bodyShifter.shift()

  unshiftBody: ->
    @constructor.bodyShifter.unshift()

  startOpenAnimation: (options = {}) ->
    animateOptions = @openAnimateOptions(options)
    viewportAnimation = options.animation ? @evalOption(@openAnimation)
    backdropAnimation = options.backdropAnimation ? @evalOption(@backdropOpenAnimation)

    return @withAnimatingClass =>
      return Promise.all([
        up.animate(@viewportElement, viewportAnimation, animateOptions),
        up.animate(@backdropElement, backdropAnimation, animateOptions),
      ])

  startCloseAnimation: (options = {}) ->
    animateOptions = @closeAnimateOptions(options)
    viewportAnimation = options.animation ? @evalOption(@closeAnimation)
    backdropAnimation = options.backdropAnimation ? @evalOption(@backdropCloseAnimation)

    return @withAnimatingClass =>
      return Promise.all([
        up.animate(@viewportElement, viewportAnimation, animateOptions),
        up.animate(@backdropElement, backdropAnimation, animateOptions),
      ])
