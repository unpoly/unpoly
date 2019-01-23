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
  A cross-browser way to interact with `console.log`, `console.error`, etc.

  This function falls back to `console.log` if the output stream is not implemented.
  It also prints substitution strings (e.g. `console.log("From %o to %o", "a", "b")`)
  as a single string if the browser console does not support substitution strings.

  \#\#\# Example

      up.browser.puts('log', 'Hi world')
      up.browser.puts('error', 'There was an error in %o', obj)

  @function up.browser.puts
  @internal
  ###
  callConsole = (stream, args...) ->
    console[stream](args...)

  CONSOLE_PLACEHOLDERS = /\%[odisf]/g

  stringifyArg = (arg) ->
    maxLength = 200
    closer = ''

    if u.isString(arg)
      string = arg.replace(/[\n\r\t ]+/g, ' ')
      string = string.replace(/^[\n\r\t ]+/, '')
      string = string.replace(/[\n\r\t ]$/, '')
      string = "\"#{string}\""
      closer = '"'
    else if u.isUndefined(arg)
      # JSON.stringify(undefined) is actually undefined
      string = 'undefined'
    else if u.isNumber(arg) || u.isFunction(arg)
      string = arg.toString()
    else if u.isArray(arg)
      string = "[#{u.map(arg, stringifyArg).join(', ')}]"
      closer = ']'
    else if u.isJQuery(arg)
      string = "$(#{u.map(arg, stringifyArg).join(', ')})"
      closer = ')'
    else if u.isElement(arg)
      string = "<#{arg.tagName.toLowerCase()}"
      for attr in ['id', 'name', 'class']
        if value = arg.getAttribute(attr)
          string += " #{attr}=\"#{value}\""
      string += ">"
      closer = '>'
    else # object
      string = JSON.stringify(arg)
    if string.length > maxLength
      string = "#{string.substr(0, maxLength)} …"
      string += closer
    string

  ###**
  See https://developer.mozilla.org/en-US/docs/Web/API/Console#Using_string_substitutions

  @function up.browser.sprintf
  @internal
  ###
  sprintf = (message, args...) ->
    sprintfWithFormattedArgs(u.identity, message, args...)

  ###**
  @function up.browser.sprintfWithFormattedArgs
  @internal
  ###
  sprintfWithFormattedArgs = (formatter, message, args...) ->
    return '' if u.isBlank(message)

    i = 0
    message.replace CONSOLE_PLACEHOLDERS, ->
      arg = args[i]
      arg = formatter(stringifyArg(arg))
      i += 1
      arg

  ###**
  Prints a debugging message to the browser console.

  @function up.log.debug
  @param {string} message
  @param {Array} ...args
  @internal
  ###
  debug = (message, args...) ->
    if config.enabled && message
      console.debug(prefix(message), args...)

  ###**
  Prints a logging message to the browser console.

  @function up.puts
  @param {string} message
  @param {Array} ...args
  @internal
  ###
  puts = (message, args...) ->
    if config.enabled && message
      console.log(prefix(message), args...)

  ###**
  @function up.warn
  @internal
  ###
  warn = (message, args...) ->
    if message
      console.warn(prefix(message), args...)

  ###**
  - Makes sure the group always closes
  - Does not make a group if the message is nil

  @function up.log.group
  @internal
  ###
  group = (message, args...) ->
    block = args.pop() # Coffeescript copies the arguments array
    if config.enabled && message
      fn = if config.collapse then 'groupCollapsed' else 'group'
      console[fn](prefix(message), args...)
      try
        block()
      finally
        console.groupEnd() if message
    else
      block()

  ###**
  @function up.log.error
  @internal
  ###
  error = (message, args...) ->
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
  sprintf: sprintf
  sprintfWithFormattedArgs: sprintfWithFormattedArgs
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

