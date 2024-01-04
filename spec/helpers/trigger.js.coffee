u = up.util
e = up.element
$ = jQuery

window.Trigger = (->

  mouseover = (element, options) ->
    element = e.get(element)
    event = createMouseEvent('mouseover', u.merge({ element }, options))
    dispatch(element, event)

  pointerover = (element, options) ->
    element = e.get(element)
    event = createMouseEvent('pointerover', u.merge({ element }, options))
    dispatch(element, event)

  mouseenter = (element, options) ->
    element = e.get(element)
    event = createMouseEvent('mouseenter', u.merge({ element }, options))
    dispatch(element, event)

  pointerenter = (element, options) ->
    element = e.get(element)
    event = createMouseEvent('pointerenter', u.merge({ element }, options))
    dispatch(element, event)

  mousedown = (element, options) ->
    element = e.get(element)
    event = createMouseEvent('mousedown', u.merge({ element }, options))
    dispatch(element, event)

  pointerdown = (element, options) ->
    element = e.get(element)
    event = createMouseEvent('pointerdown', u.merge({ element }, options))
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

  pointerup = (element, options) ->
    element = e.get(element)
    event = createMouseEvent('pointerup', u.merge({ element }, options))
    dispatch(element, event)

  touchstart = (element, options) ->
    element = e.get(element)
    event = createSimpleEvent('touchstart', u.merge({ element }, options))
    dispatch(element, event)

  click = (element, options) ->
    element = e.get(element)
    event = createMouseEvent('click', u.merge({ element }, options))
    dispatch(element, event)

  clickLinkWithKeyboard = (link, options) ->
    link = e.get(link)
    link.focus({ preventScroll: true })
    # When a `click` event is emitted by pressing Return on a focused link,
    # the event is a PointerEvent with an unknown { pointerType }.
    # See https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pointerType
    #
    # However we cannot emit a PointerEvent programmatically, as this causes the link
    # to follow immediately, without emitting a `click` event that can be processed by JavaScript.
    key = "Return"
    keydown(link, key, options)
    keypress(link, key, options)
    click(link, u.merge(options, { pointerType: '' }))
    keyup(link, key, options)

  focus = (element, options) ->
    element = e.get(element)
    element.focus()

  submit = (form, options) ->
    form = e.get(form)
    options = u.options(options,
      cancelable: true,
      bubbles: true
    )
    event = createSimpleEvent('submit', options)
    form.dispatchEvent(event)

  change = (field, options) ->
    field = e.get(field)
    options = u.options(options,
      cancelable: false,
      bubbles: true
    )
    event = createSimpleEvent('change', options)
    field.dispatchEvent(event)

  input = (field, options) ->
    field = e.get(field)
    options = u.options(options,
      cancelable: false,
      bubbles: true
    )
    event = createSimpleEvent('input', options)
    field.dispatchEvent(event)

  escapeSequence = (element, options) ->
    keySequence(element, 'Escape', options)

  keySequence = (element, key, options) ->
    keydown(element, key, options)
    keypress(element, key, options)
    keyup(element, key, options)

  FOCUSABLE_SELECTOR = 'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

  isFocusable = (element) ->
    return element.matches(FOCUSABLE_SELECTOR)

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

  clickSequence = (element, options = {}) ->
    element = e.get(element)
    isButton = element.matches('button, input[type=button], input[type=submit], input[type=image]')
    pointerover(element, options)
    mouseover(element, options)
    pointerdown(element, options)
    mousedown(element, options)
    # MacOS by default does not focus buttons on click
    unless (isButton && AgentDetector.isSafari()) || (options.focus == false)
      focus(element, options)
    pointerup(element, options)
    mouseup(element, options)
    click(element, options)

  pointerdownSequence = (element, options = {}) ->
    element = e.get(element)
    pointerover(element, options)
    mouseover(element, options)
    pointerdown(element, options)
    mousedown(element, options)

  hoverSequence = (element, options) ->
    element = e.get(element)
    mouseover(element, options)
    mouseenter(element, options)

  unhoverSequence = (element, options) ->
    element = e.get(element)
    mouseout(element, options)
    mouseleave(element, options)

  buildEvent = (klass) ->
    return document.createEvent(klass)

  # Can't use the new Event constructor in IE11 because computer.
  # http://www.codeproject.com/Tips/893254/JavaScript-Triggering-Event-Manually-in-Internet-E
  createSimpleEvent = (type, options) ->
    options = u.options(options,
      cancelable: true,
      bubbles: true
    )
    event = buildEvent('Event')
    event.initEvent(type, options.bubbles, options.cancelable)
    event

  # Can't use the new MouseEvent constructor in IE11 because computer.
  # http://www.codeproject.com/Tips/893254/JavaScript-Triggering-Event-Manually-in-Internet-E
  createMouseEvent = (type, options = {}) ->
    rect = options.element?.getBoundingClientRect()

    defaults =
      view: window,
      cancelable: true,
      bubbles: true,
      detail: 0,
      screenX: 0, # from browser viewport origin, even within an iframe
      screenY: 0, # from browser viewport origin, even within an iframe
      clientX: rect?.x,
      clientY: rect?.y,
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

    event = buildEvent('MouseEvent')
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
      event = buildEvent('KeyboardEvent')
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
  pointerdownSequence: pointerdownSequence
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
  createSimpleEvent: createSimpleEvent
  createMouseEvent: createMouseEvent
  createKeyboardEvent: createKeyboardEvent
  clickLinkWithKeyboard: clickLinkWithKeyboard

)()
