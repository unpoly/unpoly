###**
Toast alerts
============

@module up.toast
###
up.toast = do ->

  u = up.util
  b = up.browser
  e = up.element

  VARIABLE_FORMATTER = (arg) -> "<span class='up-toast-variable'>#{u.escapeHtml(arg)}</span>"

  state = new up.Config
    element: null

  reset = ->
    close()
    state.reset()

  messageToHtml = (message) ->
    if u.isArray(message)
      message[0] = u.escapeHtml(message[0])
      message = b.sprintfWithFormattedArgs(VARIABLE_FORMATTER, message...)
    else
      message = u.escapeHtml(message)
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

    message = messageToHtml(message)

    state.element = e.createFromHtml """
      <div class="up-toast">
        <div class="up-toast-message">#{message}</div>
        <div class="up-toast-actions"></div>
      </div>
    """

    if action = (options.action || options.inspect)
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
