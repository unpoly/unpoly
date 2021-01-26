u = up.util
e = up.element

PREVENT_SCROLL_OPTIONS = { preventScroll: true }

class up.FragmentFocus extends up.Record

  keys: -> [
    'fragment'
    'autoMeans'
    'layer'
    'origin'
    'focusCapsule'
    'focus'
  ]

  process: ->
    @tryProcess(@focus)

  tryProcess: (focusOpt) ->
    switch focusOpt
      when 'keep'
        return @restoreFocus(@focusCapsule)
      when 'target'
        return @focusElement(@fragment)
      when 'layer'
        return @focusElement(@layer.getFocusElement())
      when 'autofocus'
        return @autofocus()
      when 'auto', true
        return @tryProcess(@autoMeans)
      else
        if u.isArray(focusOpt)
          return u.find(focusOpt, (opt) => @tryProcess(opt))
        if u.isString(focusOpt)
          return @focusSelector(focusOpt)
        if u.isFunction(focusOpt)
          return @tryProcess(focusOpt(@fragment))
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

  restoreFocus: (capsule) ->
    return capsule?.restore(@fragment, PREVENT_SCROLL_OPTIONS)

  autofocus: ->
    if autofocusElement = e.subtree(@fragment, '[autofocus]')[0]
      up.focus(autofocusElement, PREVENT_SCROLL_OPTIONS)
      return true

  focusElement: (element) ->
    up.viewport.makeFocusable(element)
    up.focus(element, PREVENT_SCROLL_OPTIONS)
    return true

#  shouldProcess: ->
#    # Only emit an up:fragment:focus event if a truthy focusOpt would
#    # otherwise trigger a built-in focus strategy.
#    return @focusOpt && up.event.nobodyPrevents(@fragment, @focusEvent())
#
#  focusEvent: ->
#    return up.event.build('up:fragment:focus', @attributes())
