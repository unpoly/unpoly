###*
Toast alerts
============

@class up.toast
###
up.toast = (($) ->

  u = up.util
  b = up.browser

  VARIABLE_FORMATTER = (arg) -> "<span class='up-toast-variable'>#{u.escapeHtml(arg)}</span>"

  state = u.config
    $toast: null

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
    !!state.$toast
    
  addAction = ($actions, label, callback) ->
    $action = $('<span class="up-toast-action"></span>').text(label)
    $action.on 'click', callback
    $action.appendTo($actions)
  
  open = (message, options = {}) ->
    close()
    $toast = $('<div class="up-toast"></div>').prependTo('body')
    $message = $('<div class="up-toast-message"></div>').appendTo($toast)
    $actions = $('<div class="up-toast-actions"></div>').appendTo($toast)

    message = messageToHtml(message)
    $message.html(message)

    if action = (options.action || options.inspect)
      addAction($actions, action.label, action.callback)

    addAction($actions, 'Close', close)

    state.$toast = $toast

  close = ->
    if isOpen()
      state.$toast.remove()
      state.$toast = null

  # The framework is reset between tests
  up.on 'up:framework:reset', reset

  open: open
  close: close
  reset: reset
  isOpen: isOpen

)(jQuery)
