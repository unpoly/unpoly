#= require ./classes/selector

up.element = do ->

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

  @function up.element.get
  @param {jQuery|Element|String} object
  @return {Element}
  @internal
  ###
  getOne = (object) ->
    if u.isJQuery(object)
      if object.length > 1
        up.fail('up.element.get(): Cannot cast a multi-element jQuery collection to a single elenent')
      object[0]
    else if u.isString(object)
      first(object)
    else
      object

  ###**
  If given a string, returns the all elements matching that string.
  If given any other argument, returns the argument [wrapped as a collection](/up.util.wrapCollection).

  @function up.element.elements
  @param {jQuery|Element|String} object
  @return {Element}
  @internal
  ###
  getList = (args...) ->
    u.flatMap args, valueToList

  valueToList = (value) ->
    if u.isString(value)
      all(value)
    else
      u.wrapCollection(value)

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

  hide = (element) ->
    element.style.display = 'none'

  show = (element) ->
    element.style.display = ''

  toggle = (element, newVisible) ->
    if newVisible
      show(element)
    else
      hide(element)

#  trace = (fn) ->
#    (args...) ->
#      console.debug("Calling %o with %o", fn, args)
#      fn(args...)

  toggleClass = (element, klass, newPresent) ->
    fn = if newPresent then 'add' else 'remove'
    element.classList[fn](klass)

  setAttrs = (element, attrMap) ->
    for key, value of attrMap
      console.debug("Setting attr on %o: %o => %o", element, key, value)
      element.setAttribute(key, value)

  metaContent = (name) ->
    selector = "meta" + u.attributeSelector('name', name)
    first(selector)?.getAttribute('content')

  insertBefore = (existingElement, newElement) ->
    existingElement.insertAdjacentElement('beforebegin', newElement)

  insertAfter = (existingElement, newElement) ->
    existingElement.insertAdjacentElement('afterend', newElement)

  replace = (oldElement, newElement) ->
    oldElement.parentElement.replaceChild(newElement, oldElement)

#  offsetFromDocument = (element) ->
#    viewport = up.browser.documentViewport()
#    scrolledRect = element.getBoundingClientRect()
#
#    top: scrolledRect.top + viewport.scrollTop,
#    left: scrolledRect.left + viewport.scrollLeft

  setAttrs = (element, attrs) ->
    for name, value of attrs
      element.setAttribute(name, value)

  createFromSelector = (givenSelector) ->
    # Extract attribute values before we do anything else.
    # Attribute values might contain spaces, and then we would incorrectly
    # split depths at that space.
    attrValues = []
    selectorWithoutAttrValues = givenSelector.replace /\[([\w-]+)(?:=(["'])?([^"'\]]*?)\2)?\]/g, (_match, attrName, _quote, attrValue) ->
      attrValues.push(attrValue || '')
      "[#{attrName}]"

    depths = selectorWithoutAttrValues.split(/[ >]+/)
    rootElement = undefined
    depthElement = undefined
    previousElement = undefined

    for depthSelector in depths
      tagName = undefined

      depthSelector = depthSelector.replace /^[\w-]+/, (match) ->
        tagName = match
        ''

      depthElement = document.createElement(tagName || 'div')
      rootElement ||= depthElement

      depthSelector = depthSelector.replace /\#([\w-]+)/, (_match, id) ->
        depthElement.id = id
        ''

      depthSelector = depthSelector.replace /\.([\w-]+)/g, (_match, className) ->
        depthElement.classList.add(className)
        ''

      # If we have stripped out attrValues at the beginning of the function,
      # they have been replaced with the attribute name only (as "[name]").
      if attrValues.length
        depthSelector = depthSelector.replace /\[([\w-]+)\]/g, (_match, attrName) ->
          depthElement.setAttribute(attrName, attrValues.shift())
          ''

      unless depthSelector == ''
        throw new Error('Cannot parse selector: ' + givenSelector)

      previousElement?.appendChild(depthElement)
      previousElement = depthElement

    rootElement

  # createDivWithClass = (className) ->
  #   element = document.createElement('div')
  #   element.className = className
  #   element

  subscribeEvents = (fn, elements, eventNames, callback) ->
    for element in u.wrapCollection(elements)
      for eventName in u.wrapCollection(eventNames)
        element[fn](eventName, callback)

  bind = u.partial(subscribeEvents, 'addEventListener')

  unbind = u.partial(subscribeEvents, 'removeEventListener')

  affix = (container, selector, attrs) ->
    element = createFromSelector(selector)
    if attrs
      if classValue = u.pluckKey(attrs, 'class')
        for klass in u.wrapCollection(classValue)
          element.classList.add(klass)
      if styleValue = u.pluckKey(attrs, 'style')
        u.writeInlineStyle(element, styleValue)
      setAttrs(element, attrs)
    container.appendChild(element)

  descendant: descendant
  descendants: descendants
  first: first
  all: all
  subtree: subtree
  closest: closest
  matches: matches
  ancestor: ancestor
  get: getOne
  list: getList
  triggerCustom: triggerCustom
  remove: remove
  toggle: toggle
  toggleClass: toggleClass
  hide: hide
  show: show
  setAttrs: setAttrs
  metaContent: metaContent
  replace: replace
  insertBefore: insertBefore
  insertAfter: insertAfter
  # offsetFromDocument: offsetFromDocument
  createFromSelector: createFromSelector
  setAttrs: setAttrs
  affix: affix
  on: bind
  off: unbind
  # createDivWithClass: createDivWithClass
