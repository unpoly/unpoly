const u = up.util
const e = up.element
const $ = jQuery

window.Trigger = (function() {

  function mouseover(element, options) {
    element = e.get(element)
    const event = createMouseEvent('mouseover', u.merge({ element }, options))
    return dispatch(element, event)
  }

  function pointerover(element, options) {
    element = e.get(element)
    const event = createMouseEvent('pointerover', u.merge({ element }, options))
    return dispatch(element, event)
  }

  function mouseenter(element, options) {
    element = e.get(element)
    const event = createMouseEvent('mouseenter', u.merge({ element }, options))
    return dispatch(element, event)
  }

  function pointerenter(element, options) {
    element = e.get(element)
    const event = createMouseEvent('pointerenter', u.merge({ element }, options))
    return dispatch(element, event)
  }

  function mousedown(element, options) {
    element = e.get(element)
    const event = createMouseEvent('mousedown', u.merge({ element }, options))
    return dispatch(element, event)
  }

  function pointerdown(element, options) {
    element = e.get(element)
    const event = createMouseEvent('pointerdown', u.merge({ element }, options))
    return dispatch(element, event)
  }

  function mouseout(element, options) {
    element = e.get(element)
    const event = createMouseEvent('mouseout', u.merge({ element }, options))
    return dispatch(element, event)
  }

  function mouseleave(element, options) {
    element = e.get(element)
    const event = createMouseEvent('mouseleave', u.merge({ element }, options))
    return dispatch(element, event)
  }

  function mouseup(element, options) {
    element = e.get(element)
    const event = createMouseEvent('mouseup', u.merge({ element }, options))
    return dispatch(element, event)
  }

  function pointerup(element, options) {
    element = e.get(element)
    const event = createMouseEvent('pointerup', u.merge({ element }, options))
    return dispatch(element, event)
  }

  function touchstart(element, options) {
    element = e.get(element)
    const event = createSimpleEvent('touchstart', u.merge({ element }, options))
    return dispatch(element, event)
  }

  function click(element, options = {}) {
    let event
    element = e.get(element)
    options = u.merge({ element }, options)

    // The `click` event is a PointerEvent in Chrome, but a MouseEvent in Firefox and Safari.
    // `mousedown` and `mouseup` events are a MouseEvent in every browser.
    if (AgentDetector.isSafari() || AgentDetector.isFirefox()) {
      event = createMouseEvent('click', options)
    } else {
      event = createPointerEvent('click', options)
    }

    return dispatch(element, event)
  }

  function clickLinkWithKeyboard(link, options) {
    link = e.get(link)
    link.focus({ preventScroll: true })
    // When a `click` event is emitted by pressing Return on a focused link,
    // the event is either a PointerEvent with a { pointerType: "" } (on Chrome)
    // or a MouseEvent (on Firefox, Safari).
    //
    // In both cases it has { clientX: 0, clientY: 0 } properties.
    //
    // To emulate e keyboard click, we cannot emit a PointerEvent programmatically, as this causes the link
    // to follow immediately, without emitting a `click` event that can be processed by JavaScript.
    const key = "Return"
    keydown(link, key, options)
    keypress(link, key, options)
    click(link, u.merge(options, { pointerType: '', clientX: 0, clientY: 0 }))
    keyup(link, key, options)
  }

  function submit(form, options) {
    form = e.get(form)
    options = u.options(options, {
        cancelable: true,
        bubbles: true
      }
    )
    const event = createSimpleEvent('submit', options)
    return form.dispatchEvent(event)
  }

  function change(field, options) {
    field = e.get(field)
    options = u.options(options, {
        cancelable: false,
        bubbles: true
      }
    )
    const event = createSimpleEvent('change', options)
    return field.dispatchEvent(event)
  }

  function input(field, options) {
    field = e.get(field)
    options = u.options(options, {
        cancelable: false,
        bubbles: true
      }
    )
    const event = createSimpleEvent('input', options)
    return field.dispatchEvent(event)
  }

  function escapeSequence(element, options) {
    keySequence(element, 'Escape', options)
  }

  function keySequence(element, key, options) {
    keydown(element, key, options)
    keypress(element, key, options)
    keyup(element, key, options)
  }

  const FOCUSABLE_SELECTOR = 'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

  function isFocusable(element) {
    return element.matches(FOCUSABLE_SELECTOR)
  }

  function focusableElements() {
    const nodeList = document.querySelectorAll(FOCUSABLE_SELECTOR)
    return u.toArray(nodeList)
  }

  function nextFocusableElement(offset = 1) {
    let nextIndex
    const currentFocus = document.activeElement

    const focusables = focusableElements()

    if (isFocusable(currentFocus)) {
      const currentIndex = focusables.indexOf(currentFocus)
      nextIndex = (currentIndex + offset) % focusables.length
    } else {
      nextIndex = 0
    }

    return focusables[nextIndex]
  }

  function focus(element, focusOptions = {}) {
    element = e.get(element)
    return element.focus(focusOptions)
  }

  function focusWithMouseSequence(element) {
    element = e.get(element)
    mousedown(element)
    focus(element, { preventScroll: true })
    mouseup(element)
    click(element)
  }

  function tabSequence(options = {}) {
    const element = document.activeElement || document.body
    keydown(element, 'Tab', options)
    keypress(element, 'Tab', options)
    const focusOffset = options.shiftKey ? -1 : 1
    focus(nextFocusableElement(focusOffset))
    keyup(element, 'Tab', options)
  }

  function keydown(element, key, options) {
    options = u.options(options, { key })
    const event = createKeyboardEvent('keydown', options)
    return element.dispatchEvent(event)
  }

  function keypress(element, key, options) {
    options = u.options(options, { key })
    const event = createKeyboardEvent('keypress', options)
    element.dispatchEvent(event)
  }

  function keyup(element, key, options) {
    options = u.options(options, { key })
    const event = createKeyboardEvent('keyup', options)
    return element.dispatchEvent(event)
  }

  function clickSequence(element, options = {}) {
    element = e.get(element)
    const isButton = element.matches('button, input[type=button], input[type=submit], input[type=image]')
    pointerover(element, options)
    mouseover(element, options)
    pointerdown(element, options)
    mousedown(element, options)
    // MacOS by default does not focus buttons on click
    if ((!isButton || !AgentDetector.isSafari()) && (options.focus !== false)) {
      focus(element, options)
    }
    pointerup(element, options)
    mouseup(element, options)
    click(element, options)
  }

  function toggleCheckSequence(element, options = {}) {
    element = e.get(element)
    mousedown(element, options)
    focus(element, options)
    mouseup(element, options)
    click(element, options) // this toggles the { checked } property
    input(element, options)
    change(element, options)
  }

  function pointerdownSequence(element, options = {}) {
    element = e.get(element)
    pointerover(element, options)
    mouseover(element, options)
    pointerdown(element, options)
    mousedown(element, options)
  }

  function hoverSequence(element, options) {
    element = e.get(element)
    mouseover(element, options)
    mouseenter(element, options)
  }

  function unhoverSequence(element, options) {
    element = e.get(element)
    mouseout(element, options)
    mouseleave(element, options)
  }

  function submitButtons(form) {
    return form.querySelectorAll('input[type=submit], input[type=image], button[type=submit], button:not([type])')
  }

  function submitFormWithEnter(input) {
    focus(input)
    keySequence(input, 'Enter')
    const form = input.closest('form')
    const defaultButton = submitButtons(form)[0]
    // From the HTML Spec:
    // If the user agent supports letting the user submit a form implicitly (for example, on some platforms hitting the "enter" key while a text control is focused implicitly submits the form), then doing so for a form, whose default button has activation behavior and is not disabled, must cause the user agent to fire a click event at that default button.
    // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
    defaultButton.click()
  }

  function buildEvent(klass) {
    return document.createEvent(klass)
  }

  // Can't use the new Event constructor in IE11 because computer.
  // http://www.codeproject.com/Tips/893254/JavaScript-Triggering-Event-Manually-in-Internet-E
  function createSimpleEvent(type, options) {
    options = u.options(options, {
        cancelable: true,
        bubbles: true
      }
    )
    const event = buildEvent('Event')
    event.initEvent(type, options.bubbles, options.cancelable)
    return event
  }

  function buildMouseEventOptions(type, options = {}) {
    const defaults = {
      cancelable: true, // https://developer.mozilla.org/en-US/docs/Web/API/Event/Event
      bubbles: true,    // https://developer.mozilla.org/en-US/docs/Web/API/Event/Event
      view: window, // https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/UIEvent
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      button: 0, // main button pressed or un-initialized
      relatedTarget: null
    }

    // Defaults for { detail }.
    if ((type === 'click') || (type === 'mousedown') || (type === 'mouseup')) {
      defaults.detail = 1
    } else if ((type === 'dblclick')) {
      defaults.detail = 2
    } else {
      defaults.detail = 0
    }

    let element = (options.element || options.target)
    // Defaults for { clientX, clientY }.
    if (element) {
      const elementRect = element.getBoundingClientRect()
      // If we get an { element } options we can derive the { clientX } and { clientY } properties
      // from the element's center coordinates.
      defaults.clientX = elementRect.left + (0.5 * elementRect.width)
      defaults.clientY = elementRect.top + (0.5 * elementRect.height)
    } else {
      defaults.clientX = 0
      defaults.clientY = 0
    }

    // Merge defaults and given options .
    options = { ...defaults, ...options }

    // Derive { buttons } from { button }.
    const buttonToButtons = { 0: 1, 1: 4, 2: 2 }
    options.buttons ??= buttonToButtons[options.button]

    // If { screenX, screenY } are not given we can derive it from { clientX, clientY }.
    options.screenX ??= options.clientX + document.documentElement.scrollLeft
    options.screenY ??= options.clientY + document.documentElement.scrollTop

    return options
  }

  function createMouseEvent(type, options = {}) {
    options = buildMouseEventOptions(type, options)
    return new MouseEvent(type, options)
  }

  function createPointerEvent(type, options = {}) {
    const pointerEventDefault = { pointerType: "mouse", isPrimary: true }
    options = buildMouseEventOptions(type, { ...pointerEventDefault, ...options })
    return new PointerEvent(type, options)
  }

  function createKeyboardEvent(type, options) {
    let event
    options = u.options(options, {
        cancelable: true,
        bubbles: true,
        view: window,
        key: null,
      }
    )

    if (canEventConstructors()) {
      event = new KeyboardEvent(type, options)
    } else {
      event = buildEvent('KeyboardEvent')
      // The argument of initKeyboardEvent differs wildly between browsers.
      // In IE 11 it is initKeyboardEvent(type, canBubble, cancelable, view, key, location, modifierList, repeat, locale).

      // modifierList = null

      const modifiers = []
      if (options.ctrlKey) {
        modifiers.push('Control')
      }
      if (options.shiftKey) {
        modifiers.push('Shift')
      }
      if (options.altKey) {
        modifiers.push('Alt')
      }
      if (options.metaKey) {
        modifiers.push('Meta')
      }

      event.initKeyboardEvent(type,
        options.bubbles,
        options.cancelable,
        options.view,
        options.key,
        null, // location
        modifiers.join(' '),
        null, // repeat
        null // locale
      )
    }

    return event
  }

  function canEventConstructors() {
    return typeof window.Event === "function"
  }

  function dispatch(element, event) {
    element = e.get(element)
    return element.dispatchEvent(event)
  }

  return {
    mouseover,
    mouseenter,
    mousedown,
    mouseup,
    mouseout,
    mouseleave,
    click,
    clickSequence,
    toggleCheckSequence,
    pointerdown,
    pointerup,
    pointerdownSequence,
    touchstart,
    hoverSequence,
    unhoverSequence,
    escapeSequence,
    keydown,
    keypress,
    keyup,
    keySequence,
    tabSequence,
    submit,
    change,
    input,
    createSimpleEvent,
    createMouseEvent,
    createKeyboardEvent,
    clickLinkWithKeyboard,
    submitFormWithEnter,
    focus,
    focusWithMouseSequence,
  }

})()
