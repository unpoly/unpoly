/*-
Logging
=======

Unpoly can print debugging information to the [browser console](https://developer.chrome.com/docs/devtools/console/).

The information in the log includes:

- Which [events](/up.event) are called
- When we're [making requests to the network](/up.request)
- Which [compilers](/up.syntax) are applied to which elements

By default only errors are logged. You can enable debug logging through `up.log.enable()`:

![Screenshot of Unpoly logging to the browser console](images/log-interaction-event.png){:width='800'}

@see up.log.enable
@see up.log.disable

@module up.log
*/
up.log = (function() {

  /*-
  Configures the logging output on the developer console.

  @property up.log.config
  @param {boolean} [config.enabled=false]
    Whether Unpoly will print debugging information to the developer console.

    Debugging information includes which elements are being [compiled](/up.syntax)
    and which [events](/up.event) are being emitted.
    Note that errors will always be printed, regardless of this setting.
  @param {boolean} [config.banner=true]
    Print the Unpoly banner to the developer console.
  @param {boolean} [config.format=true]
    Format output using CSS.
  @stable
  */
  const config = new up.LogConfig()

  function reset() {
    config.reset()
  }

  /*-
  Prints a logging message to the browser console.

  @function up.puts
  @param {string} message
  @param {Array} ...args
  @internal
  */
  function printToStandard(...args) {
    if (config.enabled) {
      printToStream('log', ...args)
    }
  }

  /*-
  @function up.warn
  @internal
  */
  const printToWarn = (...args) => printToStream('warn', ...args)

  /*-
  @function up.log.error
  @internal
  */
  const printToError = (...args) => printToStream('error', ...args)

  function printToStream(stream, trace, message, ...args) {
    printToStreamStyled(stream, trace, '', message, ...args)
  }

  function printToStreamStyled(stream, trace, customStyles, message, ...args) {
    if (message) {
      if (config.format) {
        args.unshift(
          'color: #666666; padding: 1px 3px; border: 1px solid #bbbbbb; border-radius: 2px; font-size: 90%; display: inline-block;' + customStyles,
          '' // reset for message after trace
        )
        message = `%c${trace}%c ${message}`
      } else {
        message = `[${trace}] ${message}`
      }

      console[stream](message, ...args)
    }
  }

  function printUserEvent(event) {
    if (config.enabled) {
      event = event.originalEvent || event
      let color = '#5566cc'
      printToStreamStyled('log', event.type, `color: white; border-color: ${color}; background-color: ${color}`, 'Interaction on %o', event.target)
    }
  }

  function printBanner() {
    if (!config.banner) { return; }

    // The ASCII art looks broken in code since we need to escape backslashes
    const logo =
      " __ _____  ___  ___  / /_ __\n" +
      `/ // / _ \\/ _ \\/ _ \\/ / // /  ${up.version}\n` +
      "\\___/_//_/ .__/\\___/_/\\_. / \n" +
      "        / /            / /\n\n"

    let text = ""

    if (!up.migrate.loaded) {
      text += "Load unpoly-migrate.js to enable deprecated APIs.\n\n"
    }

    if (config.enabled) {
      text += "Call `up.log.disable()` to disable logging for this session."
    } else {
      text += "Call `up.log.enable()` to enable logging for this session."
    }

    const color = 'color: #777777'

    if (config.format) {
      console.log('%c' + logo + '%c' + text, 'font-family: monospace;' + color, color)
    } else {
      console.log(logo + text)
    }
  }

  up.on('up:framework:boot', printBanner)

  up.on('up:framework:reset', reset)


  /*-
  Starts printing debugging information to the developer console.

  Debugging information includes which elements are being [compiled](/up.syntax)
  and which [events](/up.event) are being emitted.

  Errors will always be printed, regardless of this setting.

  @function up.log.enable
  @stable
  */
  function enable() {
    config.enabled = true
  }

  /*-
  Stops printing debugging information to the developer console.

  Errors will still be printed, even with logging disabled.

  @function up.log.disable
  @stable
  */
  function disable() {
    config.enabled = false
  }

  return {
    puts: printToStandard,
    putsEvent: printUserEvent,
    error: printToError,
    warn: printToWarn,
    config,
    enable,
    disable,
  }
})()

up.puts = up.log.puts
up.warn = up.log.warn
