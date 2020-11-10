###**
Logging
=======

Unpoly can print debugging information to the developer console, e.g.:

- Which [events](/up.event) are called
- When we're [making requests to the network](/up.request)
- Which [compilers](/up.syntax) are applied to which elements

You can activate logging by calling [`up.log.enable()`](/up.log.enable).

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
  @internal
  ###
  config = new up.Config ->
    enabled: sessionStore.get('enabled')

  reset = ->
    config.reset()

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
  printToStandard = (args...) ->
    if config.enabled
      printToStream('log', args...)

  ###**
  @function up.warn
  @internal
  ###
  printToWarn = (args...) ->
    printToStream('warn', args...)

  ###**
  @function up.log.error
  @internal
  ###
  printToError = (args...) ->
    printToStream('error', args...)

  printToStream = (stream, trace, message, args...) ->
    if message
      if up.browser.canFormatLog()
        args.unshift('') # Reset
        args.unshift('color: #666666; padding: 1px 3px; border: 1px solid #bbbbbb; border-radius: 2px; font-size: 90%; display: inline-block')
        message = "%c#{trace}%c #{message}"
      else
        message = "[#{trace}] #{message}"

      console[stream](message, args...)

  printBanner = ->
    # The ASCII art looks broken in code since we need to escape backslashes
    logo = " __ _____  ___  ___  / /_ __\n" +
           "/ // / _ \\/ _ \\/ _ \\/ / // /  #{up.version}\n" +
           "\\___/_//_/ .__/\\___/_/\\_. / \n" +
           "        / /            / /\n\n"

    if config.enabled
      logInfo = "Call `up.log.disable()` to disable logging for this session."
    else
      logInfo = "Call `up.log.enable()` to enable logging for this session."

    if up.browser.canFormatLog()
      console.log('%c' + logo + '%c' + logInfo, 'font-family: monospace', '')
    else
      console.log(logo + logInfo)


  up.on 'up:framework:booted', printBanner
  up.on 'up:framework:reset', reset

  setEnabled = (value) ->
    sessionStore.set('enabled', value)
    config.enabled = value

  ###**
  Makes future Unpoly events print vast amounts of debugging information to the developer console.

  Debugging information includes which elements are being [compiled](/up.syntax)
  and which [events](/up.event) are being emitted.

  Errors will always be printed, regardless of this setting.

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
    printToError('error', args...)
    throw up.error.failed(args)

  ###**
  # Registers an empty rejection handler with the given promise.
  # This prevents browsers from printing "Uncaught (in promise)" to the error
  # console when the promise is rejected.
  #
  # This is helpful for event handlers where it is clear that no rejection
  # handler will be registered:
  #
  #     up.on('submit', 'form[up-target]', (event, $form) => {
  #       promise = up.submit($form)
  #       up.util.muteRejection(promise)
  #     })
  #
  # Does nothing if passed a missing value.
  #
  # Does nothing if the log is [enabled](/up.log.enable).
  #
  # @function up.log.muteRejection
  # @param {Promise|undefined|null} promise
  # @return {Promise}
  # @internal
  ###
  muteRejection = (promise) ->
    if config.enabled
      return promise
    else
      return u.muteRejection(promise)

  puts: printToStandard
  # debug: printToDebug
  error: printToError
  warn: printToWarn
  config: config
  enable: enable
  disable: disable
  fail: fail
  muteRejection: muteRejection
  isEnabled: -> config.enabled

up.puts = up.log.puts
up.warn = up.log.warn
up.fail = up.log.fail
