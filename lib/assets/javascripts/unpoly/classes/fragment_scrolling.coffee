u = up.util
e = up.element

# UpdateLayer: autoMeans: ['hash', 'top-if-main']
# OpenLayer: autoMeans: ['hash']

class up.FragmentScrolling

  constructor: (options) ->
    if u.isUndefined(options.scroll)
      if u.isString(options.reveal)
        up.legacy.deprecated("Option { reveal: '#{options.reveal}' }", "{ scroll: '#{options.reveal}' }")
        options.scroll = options.reveal
      else if options.reveal == true
        up.legacy.deprecated('Option { reveal: true }', "{ scroll: 'reveal' }")
        options.scroll = 'reveal'
      else if options.reveal == false
        up.legacy.deprecated('Option { reveal: false }', "{ scroll: false }")
        options.scroll = false

      if u.isDefined(options.resetScroll)
        up.legacy.deprecated('Option { resetScroll: true }', "{ scroll: 'reset' }")
        options.scroll = 'reset'

      if u.isDefined(options.restoreScroll)
        up.legacy.deprecated('Option { resetScroll: true }', "{ scroll: 'restore' }")
        options.scroll = 'restore'

    @fragment = options.fragment or up.fail('Must pass a { fragment } option')
    @autoMeans = options.autoMeans or up.fail('Must pass an { autoMeans } option')
    @hash = options.hash
    @layer = options.layer or up.fail('Must pass a { layer } option')
    @scrollOptions = u.pick(options, ['revealTop', 'revealMax', 'revealSnap', 'scrollBehavior'])

  process: (scrollOpt) ->
    # @tryProcess() returns undefined if an option cannot be applied.
    # @process() returns a resolved promise if no option cannot be applied,
    # satisfying our external signature as async method.
    @tryProcess(scrollOpt) || Promise.resolve()

  tryProcess: (scrollOpt) ->
    switch scrollOpt
      when 'reset'
        # If the user has passed { scroll: 'top' } we scroll to the top all
        # viewports that are either containing or are contained by element.
        return @reset()
      when 'reset-if-main'
        return @resetIfTargetIsMain()
      when 'restore'
        # If the user has passed { scroll: 'restore' } we restore the last known scroll
        # positions for the new URL, for all viewports that are either containing or
        # are contained by element.
        return @restore()
      when 'hash'
        return @hash && up.viewport.revealHash(@hash, @scrollOptions)
      when 'reveal'
        return @revealElement(@fragment)
      when 'auto'
        return u.detect @autoMeans, (autoOpt) => @tryProcess(autoOpt)
      else
        return u.isString(scrollOpt) && @revealSelector(scrollOpt)

  revealSelector: (selector) ->
    lookupOpts = { @layer }
    # Prefer selecting a descendant of @fragment, but if not possible search through @fragment's entire layer
    if (match = up.fragment.get(@fragment, selector, lookupOpts) || up.fragment.get(selector, lookupOpts))
      return @revealElement(match)
    else
      up.warn('up.render()', 'Tried to reveal selector "%s", but no matching element found', selector)
      return

  reset: ->
    return up.viewport.resetScroll(@fragment, @scrollOptions)

  restore: ->
    return up.viewport.restoreScroll(@fragment, @scrollOptions)

  resetIfTargetIsMain: ->
    if e.matches(@fragment, up.viewport.autoResetSelector())
      return @reset()

  revealElement: (element) ->
    return up.reveal(element, @scrollOptions)
