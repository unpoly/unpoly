u = up.util
e = up.element

PREVENT_SCROLL_OPTIONS = { preventScroll: true }

class up.FragmentFocus

  constructor: (@options) ->
    @fragment = @options.fragment or up.fail('Must pass an { fragment } option')
    @autoMeans = @options.autoMeans or up.fail('Must pass an { autoMeans } option')
    @layer = @options.layer or up.fail('Must pass a { layer } option')
    @origin = @options.origin
    @focusCapsule = @options.focusCapsule
    @focusOpt = @options.focus

  process: ->
    if @shouldProcess()
      @tryProcess(@focusOpt)

  tryProcess: (focusOpt) ->
    switch focusOpt
      when 'keep'
        return @restoreFocus(@focusCapsule)
      when 'target'
        return @focusElement(@fragment)
      when 'layer'
        # One could argue that this should focus @fragment == @layer.getFirstSwappableElement() instead.
        # However, @layer.element is already given a focusable [tabindex] (attr set by up.OverlayFocus#moveToFront()),
        # while @fragment has no [tabindex] yet.
        return @focusElement(@layer.element)
      when 'autofocus'
        return @autofocus()
      when 'autofocus-if-enabled'
        return up.viewport.config.autofocus && @autofocus()
      when 'auto', true
        return u.find @autoMeans, (autoOpt) => @tryProcess(autoOpt)
      else
        if u.isString(focusOpt)
          return @focusSelector(focusOpt)
        if u.isFunction(focusOpt)
          return focusOpt(@options)

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

  shouldProcess: ->
    # Only emit an up:fragment:focus event if a truthy focusOpt would
    # otherwise trigger a built-in focus strategy.
    return @focusOpt && up.event.nobodyPrevents(@fragment, 'up:fragment:focus', @options)
