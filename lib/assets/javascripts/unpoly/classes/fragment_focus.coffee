u = up.util
e = up.element

PREVENT_SCROLL_OPTIONS = { preventScroll: true }

class up.FragmentFocus extends up.Record

  keys: -> [
    'fragment'
    'autoMeans'
    'layer'
    'origin'
    'hash'
    'focusCapsule'
    'focus'
  ]

  process: ->
    @tryProcess(@focus)

  tryProcess: (focusOpt) ->
    switch focusOpt
      when 'keep'
        return @restoreFocus()
      when 'target', true
        return @focusElement(@fragment)
      when 'main-target', true
        return @focusMainTarget()
      when 'lost-target'
        return @preventFocusReset()
      when 'layer'
        return @focusElement(@layer.getFocusElement())
      when 'hash'
        return @focusHash()
      when 'autofocus'
        return @autofocus()
      when 'auto'
        return @tryProcess(@autoMeans)
      else
        if u.isArray(focusOpt)
          return u.find(focusOpt, (opt) => @tryProcess(opt))
        if u.isString(focusOpt)
          return @focusSelector(focusOpt)
        if u.isFunction(focusOpt)
          return @tryProcess(focusOpt(@fragment, @attributes()))
        if u.isElement(focusOpt)
          return @focusElement(focusOpt)

  focusSelector: (selector) ->
    lookupOpts = { @layer, @origin }
    # Prefer selecting a descendant of @fragment, but if not possible search through @fragment's entire layer
    if (match = up.fragment.get(@fragment, selector, lookupOpts) || up.fragment.get(selector, lookupOpts))
      return @focusElement(match)
    else
      up.warn('up.render()', 'Tried to focus selector "%s", but no matching element found', selector)
      # Return undefined so { focus: 'auto' } will try the next option from { autoMeans }
      return

  restoreFocus: ->
    return @focusCapsule?.restore(@fragment, PREVENT_SCROLL_OPTIONS)

  autofocus: ->
    if autofocusElement = e.subtree(@fragment, '[autofocus]')[0]
      up.focus(autofocusElement, PREVENT_SCROLL_OPTIONS)
      return true

  focusElement: (element) ->
    up.viewport.makeFocusable(element)
    up.focus(element, PREVENT_SCROLL_OPTIONS)
    return true

  focusHash: ->
    if hashTarget = up.viewport.firstHashTarget(@hash, { @layer })
      return @focusElement(hashTarget)

  preventFocusReset: ->
    if @focusCapsule?.wasLost()
      return @focusElement(@fragment)

  focusMainTarget: ->
    if up.fragment.isMain(@fragment)
      return @focusElement(@fragment)

#  shouldProcess: ->
#    # Only emit an up:fragment:focus event if a truthy focusOpt would
#    # otherwise trigger a built-in focus strategy.
#    return @focusOpt && up.event.nobodyPrevents(@fragment, @focusEvent())
#
#  focusEvent: ->
#    return up.event.build('up:fragment:focus', @attributes())
