###*
Logging
=======

Elaborate wrappers around `window.console`.
Should only used internally since they prefix `ᴜᴘ` to each
printed message.
###
up.log = (($) ->

  u = up.util

  ###*
  Configures the logging output on the developer console.

  @property up.log.config
  @param {Boolean} [options.enabled=false]
    Whether Unpoly will print debugging information to the developer console.

    Debugging information includes which elements are being [compiled](/up.syntax)
    and which [events](/up.bus) are being emitted.
    Note that errors will always be printed, regardless of this setting.
  @param {Boolean} [options.collapse=false]
    Whether debugging information is printed as a collapsed tree.

    Set this to `true` if you are overwhelmed by the debugging information Unpoly
    prints to the developer console.
  @param {String} [options.prefix='[UP] ']
    A string to prepend to Unpoly's logging messages so you can distinguish it from your own messages.
  @stable
  ###
  config = u.config
    prefix: '[UP] '
    enabled: false
    collapse: false

  reset = ->
    config.reset()

  prefix = (message) ->
    "#{config.prefix}#{message}"

  ###*
  Prints a debugging message to the browser console.

  @function up.debug
  @param {String} message
  @param {Array} args...
  @internal
  ###
  debug = (message, args...) ->
    if config.enabled && message
      up.browser.puts('debug', prefix(message), args...)

  ###*
  Prints a logging message to the browser console.

  @function up.puts
  @param {String} message
  @param {Array} args...
  @internal
  ###
  puts = (message, args...) ->
    if config.enabled && message
      up.browser.puts('log', prefix(message), args...)

  ###*
  @function up.log.warn
  @internal
  ###
  warn = (message, args...) ->
    if config.enabled && message
      up.browser.puts('warn', prefix(message), args...)

  ###*
  - Makes sure the group always closes
  - Does not make a group if the message is nil

  @function up.log.group
  @internal
  ###
  group = (message, args...) ->
    block = args.pop() # Coffeescript copies the arguments array
    if config.enabled && message
      stream = if config.collapse then 'groupCollapsed' else 'group'
      up.browser.puts(stream, prefix(message), args...)
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

  printBanner = ->
    # The ASCII art looks broken in code since we need to escape backslashes
    banner = " __ _____  ___  ___  / /_ __\n" +
             "/ // / _ \\/ _ \\/ _ \\/ / // /  #{up.version}\n" +
             "\\___/_//_/ .__/\\___/_/\\_. / \n" +
             "        / /            / /\n" +
             "\n"
    if config.enabled
      banner += "Call `up.log.disable()` to disable debugging output."
    else
      banner += "Call `up.log.enable()` to enable debugging output."
    up.browser.puts('log', banner)

  up.on 'up:framework:boot', printBanner
  up.on 'up:framework:reset', reset

  ###*
  Makes future Unpoly events print vast amounts of debugging information to the developer console.

  Debugging information includes which elements are being [compiled](/up.syntax)
  and which [events](/up.bus) are being emitted.

  @function up.log.enable
  @stable
  ###
  enable = ->
    config.enabled = true

  ###*
  Prevents future Unpoly events from printing vast amounts of debugging information to the developer console.

  Errors will still be printed.

  @function up.log.enable
  @stable
  ###
  disable = ->
    config.enabled = false

  puts: puts
  debug: debug
  error: error
  warn: warn
  group: group
  config: config
  enable: enable
  disable: disable

)(jQuery)

up.puts = up.log.puts
