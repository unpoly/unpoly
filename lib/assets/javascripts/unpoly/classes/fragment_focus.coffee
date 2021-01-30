#= require ./fragment_processor

u = up.util
e = up.element

PREVENT_SCROLL_OPTIONS = { preventScroll: true }

class up.FragmentFocus extends up.FragmentProcessor

  keys: -> super().concat [
    'hash'
    'focusCapsule'
  ]

  processPrimitive: (opt) ->
    switch opt
      when 'keep'
        return @restoreFocus()
      when 'target', true
        return @focusElement(@fragment)
      when 'layer'
        return @focusElement(@layer.getFocusElement())
      when 'main'
        return @focusSelector(':main')
      when 'hash'
        return @focusHash()
      when 'autofocus'
        return @autofocus()
      else
        if u.isString(opt)
          return @focusSelector(opt)

  processElement: (element) ->
    return @focusElement(element)

  resolveCondition: (condition) ->
    if condition == 'lost'
      return @wasFocusLost()
    else
      return super(condition)

  focusSelector: (selector) ->
    if match = @findSelector(selector)
      return @focusElement(match)

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

  wasFocusLost: ->
    return @focusCapsule?.wasLost()
