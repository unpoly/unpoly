###**
Logging
=======

Unpoly can print debugging information to the developer console, e.g.:

- Which [events](/up.event) are called
- When we're [making requests to the network](/up.proxy)
- Which [compilers](/up.syntax) are applied to which elements

You can activate logging by calling [`up.log.enable()`](/up.log.enable).
The output can be configured using the [`up.log.config`](/up.log.config) property.

@module up.log
###
up.log = do ->

  u = up.util

  sessionStore = new up.store.Session('up.log')

  ###**
  Configures the logging output on the developer console.

  @property up.log.config
  @param {boolean} [options.enabled=false]
    Whether Unpoly will print debugging information to the developer console.

    Debugging information includes which elements are being [compiled](/up.syntax)
    and which [events](/up.event) are being emitted.
    Note that errors will always be printed, regardless of this setting.
  @param {string} [options.prefix='[UP] ']
    A string to prepend to Unpoly's logging messages so you can distinguish it from your own messages.
  @stable
  ###
  config = new up.Config ->
    prefix: '[UP] '
    enabled: sessionStore.get('enabled')
    toast: true

  reset = ->
    config.reset()

  prefix = (message) ->
    "#{config.prefix}#{message}"

#  ###**
#  Prints a debugging message to the browser console.
#
#  @function up.log.debug
#  @param {string} message
#  @param {Array} ...args
#  @internal
#  ###
#  printToDebug = (message, args...) ->
#    if config.enabled && message
#      console.debug(prefix(message), args...)

  ###**
  Prints a logging message to the browser console.

  @function up.puts
  @param {string} message
  @param {Array} ...args
  @internal
  ###
  printToStandard = (message, args...) ->
    if config.enabled && message
      console.log(prefix(message), args...)

  ###**
  @function up.warn
  @internal
  ###
  printToWarn = (message, args...) ->
    if message
      console.warn(prefix(message), args...)

  ###**
  @function up.log.error
  @internal
  ###
  printToError = (message, args...) ->
    if message
      console.error(prefix(message), args...)

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
    console.log(banner)

  up.on 'up:framework:booted', printBanner
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

  ###**
  Throws a [JavaScript error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
  with the given message.

  The message will also be printed to the [error log](/up.log.error). Also a notification will be shown at the bottom of the screen.

  The message may contain [substitution marks](https://developer.mozilla.org/en-US/docs/Web/API/console#Using_string_substitutions).

  \#\#\# Examples

      up.fail('Division by zero')
      up.fail('Unexpected result %o', result)

  @function up.fail
  @param {string} message
    A message with details about the error.

    The message can contain [substitution marks](https://developer.mozilla.org/en-US/docs/Web/API/console#Using_string_substitutions)
    like `%s` or `%o`.
  @param {Array<string>} vars...
    A list of variables to replace any substitution marks in the error message.
  @experimental
  ###
  fail = (args...) ->
    if u.isArray(args[0])
      messageArgs = args[0]
      toastOptions = args[1] || {}
    else
      messageArgs = args
      toastOptions = {}

    printToError(messageArgs...)

    if config.toast
      up.event.onReady(-> up.toast.open(messageArgs, toastOptions))

    throw up.error.failed(messageArgs)

  puts: printToStandard
  # debug: printToDebug
  error: printToError
  warn: printToWarn
  config: config
  enable: enable
  disable: disable
  fail: fail
  isEnabled: -> config.enabled

up.puts = up.log.puts
up.warn = up.log.warn
up.fail = up.log.fail
