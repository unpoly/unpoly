###**
Logging
=======

Unpoly can print debugging information to the developer console, e.g.:

- Which [events](/up.event) are called
- When we're [making requests to the network](/up.proxy)
- Which [compilers](/up.syntax) are applied to which elements

You can activate logging by calling [`up.log.enable()`](/up.log.enable).
The output can be configured using the [`up.log.config`](/up.log.config) property.

@class up.log
###
up.log = do ->

  u = up.util
  b = up.browser

  sessionStore = new up.store.Session('up.log')

  ###**
  Configures the logging output on the developer console.

  @property up.log.config
  @param {boolean} [options.enabled=false]
    Whether Unpoly will print debugging information to the developer console.

    Debugging information includes which elements are being [compiled](/up.syntax)
    and which [events](/up.event) are being emitted.
    Note that errors will always be printed, regardless of this setting.
  @param {boolean} [options.collapse=false]
    Whether debugging information is printed as a collapsed tree.

    Set this to `true` if you are overwhelmed by the debugging information Unpoly
    prints to the developer console.
  @param {string} [options.prefix='[UP] ']
    A string to prepend to Unpoly's logging messages so you can distinguish it from your own messages.
  @stable
  ###
  config = new up.Config
    prefix: '[UP] '
    enabled: sessionStore.get('enabled')
    collapse: false

  reset = ->
    config.reset()

  prefix = (message) ->
    "#{config.prefix}#{message}"

  ###**
  Prints a debugging message to the browser console.

  @function up.log.debug
  @param {string} message
  @param {Array} args...
  @internal
  ###
  debug = (message, args...) ->
    if config.enabled && message
      b.puts('debug', prefix(message), args...)

  ###**
  Prints a logging message to the browser console.

  @function up.puts
  @param {string} message
  @param {Array} args...
  @internal
  ###
  puts = (message, args...) ->
    if config.enabled && message
      b.puts('log', prefix(message), args...)

  ###**
  @function up.warn
  @internal
  ###
  warn = (message, args...) ->
    if message
      b.puts('warn', prefix(message), args...)

  ###**
  - Makes sure the group always closes
  - Does not make a group if the message is nil

  @function up.log.group
  @internal
  ###
  group = (message, args...) ->
    block = args.pop() # Coffeescript copies the arguments array
    if config.enabled && message
      stream = if config.collapse then 'groupCollapsed' else 'group'
      b.puts(stream, prefix(message), args...)
      try
        block()
      finally
        b.puts('groupEnd') if message
    else
      block()

  ###**
  @function up.log.error
  @internal
  ###
  error = (message, args...) ->
    if message
      b.puts('error', prefix(message), args...)

  printBanner = ->
    # The ASCII art looks broken in code since we need to escape backslashes
    banner = " __ _____  ___  ___  / /_ __\n" +
             "/ // / _ \\/ _ \\/ _ \\/ / // /  #{up.version}\n" +
             "\\___/_//_/ .__/\\___/_/\\_. / \n" +
             "        / /            / /\n" +
             "\n"
    if config.enabled
      banner += "Call `up.log.disable()` to disable logging for this session."
    else
      banner += "Call `up.log.enable()` to enable logging for this session."
    b.puts('log', banner)

  up.on 'up:framework:boot', printBanner
  up.on 'up:framework:reset', reset

  setEnabled = (value) ->
    sessionStore.set('enabled', value)
    config.enabled = value

  ###**
  Makes future Unpoly events print vast amounts of debugging information to the developer console.

  Debugging information includes which elements are being [compiled](/up.syntax)
  and which [events](/up.event) are being emitted.

  @function up.log.enable
  @stable
  ###
  enable = ->
    setEnabled(true)

  ###**
  Prevents future Unpoly events from printing vast amounts of debugging information to the developer console.

  Errors will still be printed, even with logging disabled.

  @function up.log.disable
  @stable
  ###
  disable = ->
    setEnabled(false)

  puts: puts
  debug: debug
  error: error
  warn: warn
  group: group
  config: config
  enable: enable
  disable: disable
  isEnabled: -> config.enabled

up.puts = up.log.puts
up.warn = up.log.warn

