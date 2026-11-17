# up.log

Features to log Unpoly's activity to the browser console.

By default only errors are logged. Call `up.log.enable()` to turn on debug logging and `up.log.disable()` to turn it off again. `up.log.config` adjusts the output, like the banner and CSS formatting.

<figure>
  <img src="images/log-interaction-event.png" alt="Screenshot of Unpoly's log in the browser console" width="800">
  <figcaption>

The log of a user hovering over a link and then clicking it. The link opens a modal overlay.
Each line starts with a badge that names the event or function that logged it, followed by a message.
Hovering (`mouseenter`) preloads the link: `up:link:preload`, `up:request:load`, `up:request:loaded`.
Clicking (`mousedown`) follows the link and re-uses the preloaded request.
The next lines show the fragment being loaded, a new overlay opening, the location changing,
compilers running on the new fragment and, last, `up:layer:opened`.

  </figcaption>
</figure>

@namespace up.log

-----

# up.log.config

Configures the logging output to the developer console.

@property up.log.config
@param {boolean} [config.enabled=false]
  Whether Unpoly will print debugging information to the developer console.

  Debugging information includes which elements are being [compiled](/api/up.script)
  and which [events](/api/up.event) are being emitted.
  Note that errors will always be printed, regardless of this setting.
@param {boolean} [config.banner=true]
  Print the Unpoly banner to the developer console.
@param {boolean} [config.format]
  Format output using CSS.

  Defaults to `true` in normal browsers.
  Defaults to `false` in browsers controlled by automation software like Selenium, Playwright or Puppeteer
  (when [`navigator.webdriver`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/webdriver) is `true`).
  This keeps the log readable for test runners and coding agents that read the console as plain text.
@stable

-----

# up.puts()

Prints a logging message to the browser console.

@function up.puts
@param {string} context
@param {string} message
@param {Array} ...args
@internal

-----

# up.warn()

@function up.warn
@internal

-----

# up.log.error()

@function up.log.error
@internal

-----

# up.log.enable()

Starts printing debugging information to the developer console.

Debugging information includes which elements are being [compiled](/api/up.script)
and which [events](/api/up.event) are being emitted.

Errors will always be printed, regardless of this setting.

@function up.log.enable
@stable
@signature

-----

# up.log.disable()

Stops printing debugging information to the developer console.

Errors will still be printed, even with logging disabled.

@function up.log.disable
@stable
@signature
