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

  @set: (value, options = {}) ->
    if value instanceof this
      # TODO: Test me
      value.restore(layer)
    if u.isElement(value)
      @focusElement(value, options)
    else if u.isString(value)
      # TODO: Document [up-focus] attribute
      if element = up.fragment.first(value, options)
        @focusElement(element, options)

  @focusElement: (element, options = {}) ->
    if options.preventScroll # polyfill for IE11
      viewport = up.viewport.closest(element)
      oldScrollTop = viewport.scrollTop
      element.focus()
      viewport.scrollTop = oldScrollTop
    else
      element.focus()
