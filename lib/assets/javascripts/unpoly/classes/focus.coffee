u = up.util
e = up.element

PRESERVE_KEYS = ['selectionStart', 'selectionEnd', 'scrollLeft', 'scrollTop']

transferProps = (from, to) ->
  u.assign(to, u.pick(from, PRESERVE_KEYS))

class up.Focus extends up.Record

  keys:
    ['selector'].concat(PRESERVE_KEYS)

  restore: (layer) ->
    if rediscoveredElement = layer.firstElement(@selector)
      rediscoveredElement.focus()
      transferProps(this, rediscoveredElement)

  @fromElement: (element) ->
    plan = { selector: e.toSelector(element) }
    transferProps(element, plan)
    return new @(plan)

  @preserveWithin: (oldElement) ->
    focusedElement = document.activeElement
    if focusedElement && e.isInSubtree(oldElement, focusedElement)
      return @fromElement(focusedElement)

  @set: (layer, value) ->
    if value instanceof this
      value.restore(layer)
    if u.isElement(value)
      value.focus()
    else if value == 'layer'
      layer.element.focus()
    else if u.isString(value)
      if element = layer.firstElement(value)
        element.focus()
