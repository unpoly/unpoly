u = up.util
e = up.element

PRESERVE_KEYS = ['selectionStart', 'selectionEnd', 'scrollLeft', 'scrollTop']

transferProps = (from, to) ->
  u.assign(to, u.pick(from, PRESERVE_KEYS))

class up.FocusCapsule extends up.Record

  keys: ->
    ['selector'].concat(PRESERVE_KEYS)

  restore: (scope, options) ->
    if rediscoveredElement = e.get(scope, @selector)
      up.focus(rediscoveredElement, options)
      transferProps(this, rediscoveredElement)
      # Signals callers that we could restore
      return true

  @preserveWithin: (oldElement) ->
    focusedElement = document.activeElement
    if focusedElement && e.isInSubtree(oldElement, focusedElement)
      plan = { selector: e.toSelector(focusedElement) }
      transferProps(focusedElement, plan)
      return new @(plan)
