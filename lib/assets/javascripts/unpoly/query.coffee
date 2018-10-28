#= require ./classes/selector

up.query = do ->

  u = up.util

  s = (selector) ->
    up.Selector.parse(selector)

  descendant = (root, selector) ->
    s(selector).descendant(root)

  descendants = (root, selector) ->
    s(selector).descendants(root)

  first = (selector) ->
    s(selector).first()

  all = (selector) ->
    s(selector).all()

  subtree = (root, selector) ->
    s(selector).subtree(root)

  closest = (element, selector) ->
    assertIsElement(element)
    s(selector).closest(element)

  matches = (element, selector) ->
    s(selector).matches(element)

  ancestor = (element, selector) ->
    s(selector).ancestor(element)

  ###**
  If given a jQuery collection, returns the first native DOM element in the collection.
  If given a string, returns the first element matching that string.
  If given any other argument, returns the argument unchanged.

  @function up.query.element
  @param {jQuery|Element|String} object
  @return {Element}
  @internal
  ###
  element = (object) ->
    if u.isJQuery(object)
      if object.length > 1
        up.fail('up.query.element(): Cannot cast a multi-element jQuery collection to a single elenent')
      object[0]
    else if u.isString(object)
      first(object)
    else
      object

  ###**
  If given a string, returns the all elements matching that string.
  If given any other argument, returns the argument [wrapped as a collection](/up.util.wrapCollection).

  @function up.query.elements
  @param {jQuery|Element|String} object
  @return {Element}
  @internal
  ###
  elements = (object) ->
    if u.isString(object)
      all(object)
    else
      u.wrapCollection(object)

  triggerCustom = (element, name, props = {}) ->
    event = document.createEvent('Event')
    event.initEvent(name, true, true)
    u.assign(event, props)
    element.dispatchEvent(event)
    return event

  assertIsElement = (element) ->
    unless u.isElement(element)
      up.fail('Not an element: %o', element)

  remove = (element) ->
    if element.remove
      element.remove()
    # IE does not support Element#remove()
    else if parent = element.parentNode
      parent.removeChild(element)

  toggle = (element, newVisible) ->
    if newVisible
      element.style.display = ''
    else
      element.style.display = 'none'

  descendant: descendant
  descendants: descendants
  first: first
  all: all
  subtree: subtree
  closest: closest
  matches: matches
  ancestor: ancestor
  element: element
  elements: elements
  triggerCustom: triggerCustom
  remove: remove
  toggle: toggle
