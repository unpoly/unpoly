u = up.util
e = up.element
$ = jQuery

@Trigger = (->
  

  mouseover = (element, options) ->
    $element = $(element)
    event = createMouseEvent('mouseover', options)
    dispatch($element, event)

  mouseenter = (element, options) ->
    $element = $(element)
    event = createMouseEvent('mouseenter', options)
    dispatch($element, event)

  mousedown = (element, options) ->
    $element = $(element)
    event = createMouseEvent('mousedown', options)
    dispatch($element, event)

  mouseout = (element, options) ->
    $element = $(element)
    event = createMouseEvent('mouseout', options)
    dispatch($element, event)

  mouseleave = (element, options) ->
    $element = $(element)
    event = createMouseEvent('mouseleave', options)
    dispatch($element, event)

  mouseup = (element, options) ->
    $element = $(element)
    event = createMouseEvent('mouseup', options)
    dispatch($element, event)

  click = (element, options) ->
    $element = $(element)
    event = createMouseEvent('click', options)
    dispatch($element, event)

  focus = (element, options) ->
    $element = $(element)
    $element.focus()

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
    options = u.options(options,
      key: 'Escape'
    )
    for type in ['keydown', 'keypress', 'keyup']
      event = createKeyboardEvent(type, options)
      element.dispatchEvent(event)

  clickSequence = (element, options) ->
    $element = $(element)
    mouseover($element, options)
    mousedown($element, options)
    focus($element, options)
    mouseup($element, options)
    click($element, options)

  hoverSequence = (element, options) ->
    $element = $(element)
    mouseover($element, options)
    mouseenter($element, options)

  unhoverSequence = (element, options) ->
    $element = $(element)
    mouseout($element, options)
    mouseleave($element, options)

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
  createMouseEvent = (type, options) ->
    options = u.options(options,
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
    )
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
  submit: submit
  change: change
  input: input
  createEvent: createEvent
  createMouseEvent: createMouseEvent
  createKeyboardEvent: createKeyboardEvent

)()
