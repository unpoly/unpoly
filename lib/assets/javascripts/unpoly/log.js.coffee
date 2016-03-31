###*
Logging
=======

Elaborate wrappers around `window.console`.
Should only used internally since they prefix `ᴜᴘ` to each
printed message.
###
up.log = (($) ->

  prefix = (message) ->
    "ᴜᴘ #{message}"

  ###*
  Prints a debugging message to the browser console.

  @function up.debug
  @param {String} message
  @param {Array} args...
  @internal
  ###
  debug = (message, args...) ->
    if message
      up.browser.puts('debug', prefix(message), args...)

  ###*
  Prints a logging message to the browser console.

  @function up.puts
  @param {String} message
  @param {Array} args...
  @internal
  ###
  puts = (message, args...) ->
    if message
      up.browser.puts('log', prefix(message), args...)

  ###*
  @function up.log.warn
  @internal
  ###
  warn = (message, args...) ->
    if message
      up.browser.puts('warn', prefix(message), args...)

  ###*
  - Makes sure the group always closes
  - Does not make a group if the message is nil

  @function up.log.group
  @internal
  ###
  group = (message, args...) ->
    block = args.pop() # Coffeescript copies the arguments array
    if message
      up.browser.puts('groupCollapsed', prefix(message), args...)
#      up.browser.puts('group', prefix(message), args...)
      try
        block()
      finally
        console.groupEnd() if message
    else
      block()

  ###*
  @function up.log.error
  @internal
  ###
  error = (message, args...) ->
    if message
      up.browser.puts('error', prefix(message), args...)

  puts: puts
  debug: debug
  error: error
  warn: warn
  group: group

)(jQuery)

up.puts = up.log.puts
