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
      when 'layer-if-main'
        if @shouldAutoScroll()
          return @revealLayer()
        else
          up.puts('up.render()', "Will not auto-scroll because fragment doesn't match up.fragment.config.autoScrollTargets")
          # Try the next value from { autoMeans }.
          return undefined
      when 'restore'
        return @restore()
      when 'hash'
        return @hash && up.viewport.revealHash(@hash, @attributes())
      when 'target', 'reveal'
        return @revealElement(@fragment)
      when 'auto', true
        return u.find @autoMeans, (autoOpt) => @tryProcess(autoOpt)
      else
        if u.isString(scrollOpt)
          return @revealSelector(scrollOpt)
        if u.isFunction(scrollOpt)
          return scrollOpt(@attributes())

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

  shouldAutoScroll: ->
    return up.fragment.shouldAutoScroll(@fragment, { @layer, @mode })

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
