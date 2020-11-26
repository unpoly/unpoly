u = up.util
e = up.element

# Not an instance method because we eventually will migrate to ES6.
# In ES6 we may not access `this` before `super()`.
rewriteDeprecatedOptions = (options) ->
  if u.isUndefined(options.scroll)
    # Rewrite deprecated { reveal } option (it had multiple variants)
    if u.isString(options.reveal)
      up.legacy.deprecated("Option { reveal: '#{options.reveal}' }", "{ scroll: '#{options.reveal}' }")
      options.scroll = options.reveal
    else if options.reveal == true
      up.legacy.deprecated('Option { reveal: true }', "{ scroll: 'target' }")
      options.scroll = 'target'
    else if options.reveal == false
      up.legacy.deprecated('Option { reveal: false }', "{ scroll: false }")
      options.scroll = false

    # Rewrite deprecated { resetScroll } option
    if u.isDefined(options.resetScroll)
      up.legacy.deprecated('Option { resetScroll: true }', "{ scroll: 'top' }")
      options.scroll = 'top'

    # Rewrite deprecated { restoreScroll } option
    if u.isDefined(options.restoreScroll)
      up.legacy.deprecated('Option { restoreScroll: true }', "{ scroll: 'restore' }")
      options.scroll = 'restore'

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
    rewriteDeprecatedOptions(options)
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
#      when 'top-if-main'
#        if @isTargetMain()
#          return @reset()
      when 'layer'
        return @revealLayer()
      when 'layer-if-main'
        if @isTargetMain()
          return @revealLayer()
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

  isTargetMain: ->
    return e.matches(@fragment, up.viewport.autoResetSelector({ @layer, @mode }))

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
    
#  shouldProcess: ->
#    # Only emit an up:fragment:scroll event if a truthy scrollOpt would
#    # otherwise trigger a built-in scroll strategy.
#    return @scroll && up.event.nobodyPrevents(@fragment, @scrollEvent())

#  scrollEvent: ->
#    return up.event.build('up:fragment:scroll', @attributes())
