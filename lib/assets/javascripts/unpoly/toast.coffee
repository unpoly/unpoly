###**
Toast alerts
============

@module up.toast
###
up.toast = do ->
  u = up.util
  e = up.element

  VARIABLE_FORMATTER = (arg) -> "<up-toast-variable>#{u.escapeHTML(arg)}</up-toast-variable>"

  state = new up.Config ->
    element: null

  reset = ->
    close()
    state.reset()

  messageToHTML = (message) ->
    if u.isArray(message)
      message[0] = u.escapeHTML(message[0])
      message = u.sprintfWithFormattedArgs(VARIABLE_FORMATTER, message...)
    else
      message = u.escapeHTML(message)
    message

  isOpen = ->
    !!state.element
    
  addAction = (actions, label, callback) ->
    action = e.affix(actions, 'up-toast-action', text: label)
    action.addEventListener('click', callback)

  open = (message, options = {}) ->
    close()

    message = messageToHTML(message)

    state.element = e.createFromSelector('up-toast')
    e.affix(state.element, 'up-toast-message', text: message)
    actions = e.affix(state.element, 'up-toast-actions')

    if action = options.action
      addAction(actions, action.label, action.callback)

    addAction(actions, 'Close', close)

    document.body.appendChild(state.element)

  close = ->
    if isOpen()
      e.remove(state.element)
      state.element = null

  # The framework is reset between tests
  up.on 'up:framework:reset', reset

  open: open
  close: close
  reset: reset
  isOpen: isOpen
