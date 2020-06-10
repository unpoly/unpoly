u = up.util
e = up.element

PREVENT_SCROLL_OPTIONS = { preventScroll: true }

class up.FragmentFocus

  constructor: (options) ->
    @target = options.target or up.fail('Must pass an { target } options')
    @autoMeans = options.autoMeans or up.fail('Must pass an { autoMeans } option')
    @layer = options.layer or up.fail('Must pass a { layer } option')
    @focusCapsule = options.focusCapsule

  process: (focusOpt) ->
    if focusOpt == 'keep'
      @restoreFocus(@focusCapsule)
    else if focusOpt == 'target'
      @focusElement(@target)
    else if focusOpt == 'layer'
      @focusElement(@layer.element)
    else if focusOpt == 'autofocus'
      @autofocus(@target)
    else if focusOpt == 'auto'
      u.detect @autoMeans, (autoOpt) => @process(autoOpt)
    else if u.isString(focusOpt)
      @focusSelector(focusOpt)

  focusSelector: (selector) ->
    lookupOpts = { @layer }
    if (match = up.fragment.get(@target, selector, lookupOpts) || up.fragment.get(selector, lookupOpts))
      return @focusElement(match)
    else
      up.warn('up.change()', 'Tried to focus selector "%s", but no matching element found', selector)
      return

  restoreFocus: (capsule) ->
    return capsule?.restore(@target, PREVENT_SCROLL_OPTIONS)

  autofocus: (scope) ->
    if autofocusElement = e.subtree(scope, '[autofocus]')[0]
      up.focus(autofocusElement, PREVENT_SCROLL_OPTIONS)
      return true

  focusElement: (element) ->
    up.viewport.makeFocusable(element)
    up.focus(element, PREVENT_SCROLL_OPTIONS)
    return true
