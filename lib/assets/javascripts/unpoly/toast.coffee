###**
Toast alerts
============

@module up.toast
###
up.toast = do ->
  u = up.util
  e = up.element

  VARIABLE_FORMATTER = (arg) -> "<span class='up-toast-variable'>#{u.escapeHTML(arg)}</span>"

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
    
  addAction = (label, callback) ->
    actions = state.element.querySelector('.up-toast-actions')
    action = e.affix(actions, '.up-toast-action')
    action.innerText = label
    action.addEventListener('click', callback)

  open = (message, options = {}) ->
    close()

    message = messageToHTML(message)

    state.element = e.createFromHTML """
      <div class="up-toast">
        <div class="up-toast-message">#{message}</div>
        <div class="up-toast-actions"></div>
      </div>
    """

    if action = options.action
      addAction(action.label, action.callback)

    addAction('Close', close)

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
