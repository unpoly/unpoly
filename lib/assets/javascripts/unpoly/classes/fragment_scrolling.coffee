#= require ./fragment_processor

u = up.util
e = up.element

class up.FragmentScrolling extends up.FragmentProcessor

  keys: -> super.concat [
    'hash'
    'mode'
    'revealTop'
    'revealMax'
    'revealSnap'
    'scrollBehavior'
    'scrollSpeed'
  ]

  constructor: (options) ->
    up.migrate.handleScrollOptions?(options)
    super(options)

  process: (opt) ->
    # If no option can be applied, return a fulfilled promise to
    # satisfy our signature as an async function.
    super(opt) || Promise.resolve()

  processPrimitive: (opt) ->
    switch opt
      when 'top', 'reset'
        # If the user has passed { scroll: 'top' } we scroll to the top all
        # viewports that are either containing or are contained by element.
        return @reset()
      when 'layer'
        return @revealLayer()
      when 'main'
        return @revealSelector(':main')
      when 'restore'
        return @restore()
      when 'hash'
        return @hash && up.viewport.revealHash(@hash, @attributes())
      when 'target', 'reveal', true
        return @revealElement(@fragment)
      else
        if u.isString(opt)
          return @revealSelector(opt)

  processElement: (element) ->
    return @revealElement(element)

  revealElement: (element) ->
    return up.reveal(element, @attributes())

  revealSelector: (selector) ->
    if match = @findSelector(selector)
      return @revealElement(match)

  revealLayer: ->
    # Reveal the layer's box instead of the layer's element.
    # If the layer has its own viewport, like a modal, revealing the box will
    # scroll the layer viewport. Revealing the layer element would scroll
    # the main document viewport.
    @revealElement(@layer.getBoxElement())

  reset: ->
    return up.viewport.resetScroll(u.merge(@attributes(), around: @fragment))

  restore: ->
    return up.viewport.restoreScroll(u.merge(@attributes(), around: @fragment))
