u = up.util
e = up.element

class up.FragmentScrolling extends up.Record

  keys: -> [
    'fragment'
    'autoMeans'
    'hash'
    'origin'
    'layer'
    'mode'
    'revealTop'
    'revealMax'
    'revealSnap'
    'scrollBehavior'
    'scrollSpeed'
    'scroll'
  ]

  constructor: (options) ->
    up.migrate.handleScrollOptions?(options)
    super(options)

  process: ->
    # @tryProcess() returns undefined if an option cannot be applied.
    # @process() returns a resolved promise if no option cannot be applied,
    # satisfying our external signature as async method.
    @tryProcess(@scroll) || Promise.resolve()

  tryProcess: (scrollOpt) ->
    switch scrollOpt
      when 'top'
        # If the user has passed { scroll: 'top' } we scroll to the top all
        # viewports that are either containing or are contained by element.
        return @reset()
      when 'layer'
        return @revealLayer()
      when 'restore'
        return @restore()
      when 'hash'
        return @hash && up.viewport.revealHash(@hash, @attributes())
      when 'target', 'reveal'
        return @revealElement(@fragment)
      when 'auto', true
        return @tryProcess(@autoMeans)
      else
        if u.isArray(scrollOpt)
          return u.find(scrollOpt, (opt) => @tryProcess(opt))
        if u.isString(scrollOpt)
          return @revealSelector(scrollOpt)
        if u.isFunction(scrollOpt)
          return @tryProcess(scrollOpt(@fragment))
        if u.isElement(scrollOpt)
          return @revealElement(scrollOpt)

  revealSelector: (selector) ->
    getFragmentOpts = { @layer, @origin }
    # Prefer selecting a descendant of @fragment, but if not possible search through @fragment's entire layer
    if (match = up.fragment.get(@fragment, selector, getFragmentOpts) || up.fragment.get(selector, getFragmentOpts))
      return @revealElement(match)
    else
      up.warn('up.render()', 'Tried to reveal selector "%s", but no matching element found', selector)
      return

  reset: ->
    return up.viewport.resetScroll(u.merge(@attributes(), around: @fragment))

  restore: ->
    return up.viewport.restoreScroll(u.merge(@attributes(), around: @fragment))

  revealLayer: ->
    # Reveal the layer's box instead of the layer's element.
    # If the layer has its own viewport, like a modal, revealing the box will
    # scroll the layer viewport. Revealing the layer element would scroll
    # the main document viewport.
    @revealElement(@layer.getBoxElement())

  revealElement: (element) ->
    return up.reveal(element, @attributes())
