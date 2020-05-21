u = up.util
e = up.element
$ = jQuery

@Trigger = (->

  mouseover = (element, options) ->
    element = e.get(element)
    event = createMouseEvent('mouseover', u.merge({ element }, options))
    dispatch(element, event)

  mouseenter = (element, options) ->
    element = e.get(element)
    event = createMouseEvent('mouseenter', u.merge({ element }, options))
    dispatch(element, event)

  mousedown = (element, options) ->
    element = e.get(element)
    event = createMouseEvent('mousedown', u.merge({ element }, options))
    dispatch(element, event)

  mouseout = (element, options) ->
    element = e.get(element)
    event = createMouseEvent('mouseout', u.merge({ element }, options))
    dispatch(element, event)

  mouseleave = (element, options) ->
    element = e.get(element)
    event = createMouseEvent('mouseleave', u.merge({ element }, options))
    dispatch(element, event)

  mouseup = (element, options) ->
    element = e.get(element)
    event = createMouseEvent('mouseup', u.merge({ element }, options))
    dispatch(element, event)

  click = (element, options) ->
    element = e.get(element)
    event = createMouseEvent('click', u.merge({ element }, options))
    dispatch(element, event)

  focus = (element, options) ->
    element = e.get(element)
    element.focus()

  submit = (form, options) ->
    form = e.get(form)
    options = u.options(options,
      cancelable: true,
      bubbles: true
    )
    event = createEvent('submit', options)
    form.dispatchEvent(event)

  change = (field, options) ->
    field = e.get(field)
    options = u.options(options,
      cancelable: false,
      bubbles: true
    )
    event = createEvent('change', options)
    field.dispatchEvent(event)

  input = (field, options) ->
    field = e.get(field)
    options = u.options(options,
      cancelable: false,
      bubbles: true
    )
    event = createEvent('input', options)
    field.dispatchEvent(event)

  escapeSequence = (element, options) ->
    keySequence(element, 'Escape', options)

  keySequence = (element, key, options) ->
    options = u.options(options, { key })
    for type in ['keydown', 'keypress', 'keyup']
      event = createKeyboardEvent(type, options)
      element.dispatchEvent(event)

  clickSequence = (element, options) ->
    element = e.get(element)
    mouseover(element, options)
    mousedown(element, options)
    focus(element, options)
    mouseup(element, options)
    click(element, options)

  hoverSequence = (element, options) ->
    element = e.get(element)
    mouseover(element, options)
    mouseenter(element, options)

  unhoverSequence = (element, options) ->
    element = e.get(element)
    mouseout(element, options)
    mouseleave(element, options)

  # Can't use the new Event constructor in IE11 because computer.
  # http://www.codeproject.com/Tips/893254/JavaScript-Triggering-Event-Manually-in-Internet-E
  createEvent = (type, options) ->
    options = u.options(options,
      cancelable: true,
      bubbles: true
    )
    event = document.createEvent('Event')
    event.initEvent(type, options.bubbles, options.cancelable)
    event

  # Can't use the new MouseEvent constructor in IE11 because computer.
  # http://www.codeproject.com/Tips/893254/JavaScript-Triggering-Event-Manually-in-Internet-E
  createMouseEvent = (type, options = {}) ->
    defaults =
      view: window,
      cancelable: true,
      bubbles: true,
      detail: 0,
      screenX: 0,
      screenY: 0,
      clientX: 0,
      clientY: 0,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      button: 0,
      relatedTarget: null

    # If we get an { element } options we can derive the { clientX } and { screenY } properties
    # from the element's center coordinates.
    if element = options.element
      console.debug("--- getting coordinates from", element)
      elementRect = element.getBoundingClientRect()
      defaults.clientX = elementRect.left + (0.5 * elementRect.width)
      defaults.clientY = elementRect.top + (0.5 * elementRect.height)

    options = u.options(options, defaults)

    # If { screenX, screenY } are not given we can derive it from { clientX, clientY }.
    options.screenX ?= options.clientX + window.screenX
    options.screenY ?= options.clientY + window.screenY

    event = document.createEvent('MouseEvent')
    event.initMouseEvent(type,
      options.bubbles,
      options.cancelable,
      options.view,
      options.detail,
      options.screenX,
      options.screenY,
      options.clientX,
      options.clientY,
      options.ctrlKey,
      options.altKey,
      options.shiftKey,
      options.metaKey,
      options.button,
      options.relatedTarget
    )
    event

  createKeyboardEvent = (type, options) ->
    options = u.options(options,
      cancelable: true,
      bubbles: true,
      view: window,
      key: null,
    )

    if canEventConstructors()
      event = new KeyboardEvent(type, options)
    else
      event = document.createEvent('KeyboardEvent')
      # The argument of initKeyboardEvent differs wildly between browsers.
      # In IE 11 it is initKeyboardEvent(type, canBubble, cancelable, view, key, location, modifierList, repeat, locale).
      event.initKeyboardEvent(type,
        options.bubbles,
        options.cancelable,
        options.view,
        options.key,
        null,
        null,
        null,
        null,
      )

    event

  canEventConstructors = ->
    typeof window.Event == "function"

  dispatch = (element, event) ->
    element = e.get(element)
    element.dispatchEvent(event)

  mouseover: mouseover
  mouseenter: mouseenter
  mousedown: mousedown
  mouseup: mouseup
  mouseout: mouseout
  mouseleave: mouseleave
  click: click
  clickSequence: clickSequence
  hoverSequence: hoverSequence
  unhoverSequence: unhoverSequence
  escapeSequence: escapeSequence
  keySequence: keySequence
  submit: submit
  change: change
  input: input
  createEvent: createEvent
  createMouseEvent: createMouseEvent
  createKeyboardEvent: createKeyboardEvent

)()
