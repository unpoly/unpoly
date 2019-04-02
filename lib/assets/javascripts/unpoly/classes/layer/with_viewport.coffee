#= require ./base

class up.Layer.WithViewport extends up.Layer

  # It makes only sense to have a single body shifter
  @bodyShifter: new up.BodyShifter()

  create: (parentElement, initialInnerContent, options) ->
    @createElement(parentElement)
    @element.classList.add('.up-layer-with-viewport')
    @backdropElement = affix(@element, '.up-layer-backdrop')
    @viewportElement = affix(@element, '.up-layer-viewport')
    @frameInnerContent(@viewportElement, initialInnerContent, options)

    @shiftBody()
    return @startOpenAnimation(options)

  destroy: (options) ->
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
