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

  touchstart = (element, options) ->
    element = e.get(element)
    event = createEvent('touchstart', u.merge({ element }, options))
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
    keydown(element, key, options)
    keypress(element, key, options)
    keyup(element, key, options)

  FOCUSABLE_SELECTOR = 'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]'

  isFocusable = (element) ->
    return e.matches(element, FOCUSABLE_SELECTOR)

  focusableElements = ->
    nodeList = document.querySelectorAll(FOCUSABLE_SELECTOR)
    return u.toArray(nodeList)

  nextFocusableElement = (offset = 1) ->
    currentFocus = document.activeElement

    focusables = focusableElements()

    if isFocusable(currentFocus)
      currentIndex = focusables.indexOf(currentFocus)
      nextIndex = (currentIndex + offset) % focusables.length
    else
      nextIndex = 0

    return focusables[nextIndex]

  tabSequence = (options = {}) ->
    element = document.activeElement || document.body
    keydown(element, 'Tab', options)
    keypress(element, 'Tab', options)
    focusOffset = if options.shiftKey then -1 else 1
    focus(nextFocusableElement(focusOffset))
    keyup(element, 'Tab', options)

  keydown = (element, key, options) ->
    options = u.options(options, { key })
    event = createKeyboardEvent('keydown', options)
    element.dispatchEvent(event)

  keypress = (element, key, options) ->
    options = u.options(options, { key })
    event = createKeyboardEvent('keypress', options)
    element.dispatchEvent(event)

  keyup = (element, key, options) ->
    options = u.options(options, { key })
    event = createKeyboardEvent('keyup', options)
    element.dispatchEvent(event)

  clickSequence = (element, options) ->
    isButton = e.matches(element, 'button, input[type=button], input[type=submit], input[type=image]')
    element = e.get(element)
    mouseover(element, options)
    mousedown(element, options)
    # MacOS by default does not focus buttons on click
    unless isButton && AgentDetector.isSafari()
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

      # modifierList = null

      modifiers = []
      modifiers.push('Control') if options.ctrlKey
      modifiers.push('Shift') if options.shiftKey
      modifiers.push('Alt') if options.altKey
      modifiers.push('Meta') if options.metaKey

      event.initKeyboardEvent(type,
        options.bubbles,
        options.cancelable,
        options.view,
        options.key,
        null, # location
        modifiers.join(' '),
        null, # repeat
        null, # locale
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
  touchstart: touchstart
  hoverSequence: hoverSequence
  unhoverSequence: unhoverSequence
  escapeSequence: escapeSequence
  keydown: keydown
  keypress: keypress
  keyup: keyup
  keySequence: keySequence
  tabSequence: tabSequence
  submit: submit
  change: change
  input: input
  createEvent: createEvent
  createMouseEvent: createMouseEvent
  createKeyboardEvent: createKeyboardEvent

)()
