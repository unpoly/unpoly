###*
Browser support
===============

Unpoly supports all modern browsers. It degrades gracefully with old versions of Internet Explorer:

IE11, Edge
: Full support

IE 10 or lower
: Unpoly prevents itself from booting itself, leaving you with a classic server-side application.


@class up.browser
###
up.browser = (($) ->

  u = up.util

  ###*
  @method up.browser.loadPage
  @param {String} url
  @param {String} [options.method='get']
  @param {Object|Array} [options.data]
  @internal
  ###
  loadPage = (url, options = {}) ->
    method = u.option(options.method, 'get').toLowerCase()
    if method == 'get'
      query = u.requestDataAsQuery(options.data)
      url = "#{url}?#{query}" if query
      setLocationHref(url)
    else
      $form = $("<form method='post' action='#{url}' class='up-page-loader'></form>")
      addField = (field) ->
        $field = $('<input type="hidden">')
        $field.attr(field)
        $field.appendTo($form)
      addField(name: up.protocol.config.methodParam, value: method)
      if csrfField = up.rails.csrfField()
        addField(csrfField)
      u.each u.requestDataAsArray(options.data), addField
      $form.hide().appendTo('body')
      submitForm($form)

  ###*
  For mocking in specs.

  @method submitForm
  ###
  submitForm = ($form) ->
    $form.submit()

  ###*
  For mocking in specs.

  @method setLocationHref
  ###
  setLocationHref = (url) ->
    location.href = url

  ###*
  A cross-browser way to interact with `console.log`, `console.error`, etc.

  This function falls back to `console.log` if the output stream is not implemented.
  It also prints substitution strings (e.g. `console.log("From %o to %o", "a", "b")`)
  as a single string if the browser console does not support substitution strings.

  \#\#\# Example

      up.browser.puts('log', 'Hi world');
      up.browser.puts('error', 'There was an error in %o', obj);

  @function up.browser.puts
  @internal
  ###
  puts = (stream, args...) ->
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
      $arg = $(arg)
      string = "<#{arg.tagName.toLowerCase()}"
      for attr in ['id', 'name', 'class']
        if value = $arg.attr(attr)
          string += " #{attr}=\"#{value}\""
      string += ">"
      closer = '>'
    else # object
      string = JSON.stringify(arg)
    if string.length > maxLength
      string = "#{string.substr(0, maxLength)} …"
      string += closer
    string

  ###*
  See https://developer.mozilla.org/en-US/docs/Web/API/Console#Using_string_substitutions

  @function up.browser.sprintf
  @internal
  ###
  sprintf = (message, args...) ->
    sprintfWithFormattedArgs(u.identity, message, args...)

  ###*
  @function up.browser.sprintfWithBounds
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

  url = ->
    location.href

  isIE10OrWorse = u.memoize ->
    !window.atob

  ###*
  Returns whether this browser supports manipulation of the current URL
  via [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState).

  When `pushState`  (e.g. through [`up.follow()`](/up.follow)), it will gracefully
  fall back to a full page load.

  Note that Unpoly will not use `pushState` if the initial page was loaded with
  a request method other than GET.

  @function up.browser.canPushState
  @return {Boolean}
  @experimental
  ###
  canPushState = u.memoize ->
    # We cannot use pushState if the initial request method is a POST for two reasons:
    #
    # 1. Unpoly replaces the initial state so it can handle the pop event when the
    #    user goes back to the initial URL later. If the initial request was a POST,
    #    Unpoly will wrongly assumed that it can restore the state by reloading with GET.
    #
    # 2. Some browsers have a bug where the initial request method is used for all
    #    subsequently pushed states. That means if the user reloads the page on a later
    #    GET state, the browser will wrongly attempt a POST request.
    #    Modern Firefoxes, Chromes and IE10+ don't seem to be affected by this.
    #
    # The way that we work around this is that we don't support pushState if the
    # initial request method was anything other than GET (but allow the rest of the
    # Unpoly framework to work). This way Unpoly will fall back to full page loads until
    # the framework was booted from a GET request.
    u.isDefined(history.pushState) && up.protocol.initialRequestMethod() == 'get'

  ###*
  Returns whether this browser supports animation using
  [CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions).

  When Unpoly is asked to animate history on a browser that doesn't support
  CSS transitions (e.g. through [`up.animate()`](/up.animate)), it will skip the
  animation by instantly jumping to the last frame.

  @function up.browser.canCssTransition
  @return {Boolean}
  @internal
  ###
  canCssTransition = u.memoize ->
    'transition' of document.documentElement.style

  ###*
  Returns whether this browser supports the DOM event [`input`](https://developer.mozilla.org/de/docs/Web/Events/input).

  @function up.browser.canInputEvent
  @return {Boolean}
  @internal
  ###
  canInputEvent = u.memoize ->
    'oninput' of document.createElement('input')

  ###*
  Returns whether this browser supports the [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
  interface.

  @function up.browser.canFormData
  @return {Boolean}
  @experimental
  ###
  canFormData = u.memoize ->
    !!window.FormData

  ###*
  Returns whether this browser supports the [`DOMParser`](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser)
  interface.

  @function up.browser.canDomParser
  @return {Boolean}
  @internal
  ###
  canDomParser = u.memoize ->
    !!window.DOMParser

  ###*
  Returns whether this browser supports the [`debugging console`](https://developer.mozilla.org/en-US/docs/Web/API/Console).

  @function up.browser.canConsole
  @return {Boolean}
  @internal
  ###
  canConsole = u.memoize ->
    window.console &&
      console.debug &&
      console.info &&
      console.warn &&
      console.error &&
      console.group &&
      console.groupCollapsed &&
      console.groupEnd

  isRecentJQuery = u.memoize ->
    version = $.fn.jquery
    parts = version.split('.')
    major = parseInt(parts[0])
    minor = parseInt(parts[1])
    major >= 2 || (major == 1 && minor >= 9)

  ###*
  Returns and deletes a cookie with the given name
  Inspired by Turbolinks: https://github.com/rails/turbolinks/blob/83d4b3d2c52a681f07900c28adb28bc8da604733/lib/assets/javascripts/turbolinks.coffee#L292

  @function up.browser.popCookie
  @internal
  ###
  popCookie = (name) ->
    value = document.cookie.match(new RegExp(name+"=(\\w+)"))?[1]
    if u.isPresent(value)
      document.cookie = name + '=; expires=Thu, 01-Jan-70 00:00:01 GMT; path=/'
    value

  ###*
  @function up,browser.whenConfirmed
  @return {Promise}
  @param {String} options.confirm
  @param {Boolean} options.preload
  @internal
  ###
  whenConfirmed = (options) ->
    if options.preload || u.isBlank(options.confirm) || window.confirm(options.confirm)
      u.resolvedPromise()
    else
      u.unresolvablePromise()

  ###*
  Returns whether Unpoly supports the current browser.

  If this returns `false` Unpoly will prevent itself from [booting](/up.boot)
  and ignores all registered [event handlers](/up.on) and [compilers](/up.compiler).
  This leaves you with a classic server-side application.
  This is usually a better fallback than loading incompatible Javascript and causing
  many errors on load.

  \#\#\# Graceful degradation

  This function also returns `true` if Unpoly only support some features, but can degrade
  gracefully for other features. E.g. Internet Explorer 9 is almost fully supported, but due to
  its lack of [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)
  Unpoly falls back to a full page load when asked to manipulate history.

  @function up.browser.isSupported
  @stable
  ###
  isSupported = ->
    !isIE10OrWorse() &&
      isRecentJQuery() &&
      canConsole() &&
      canPushState() &&
      canDomParser() &&
      canFormData() &&
      canCssTransition() &&
      canInputEvent()

  ###*
  @internal
  ###
  sessionStorage = u.memoize ->
    window.sessionStorage || { getItem: u.noop, setItem: u.noop, removeItem: u.noop }

  ###*
  Returns `'foo'` if the hash is `'#foo'`.

  Returns undefined if the hash is `'#'`, `''` or `undefined`.

  @function up.browser.hash
  @internal
  ###
  hash = (value) ->
    value ||= location.hash
    value ||= ''
    value = value.substr(1) if value[0] == '#'
    u.presence(value)


  knife: eval(Knife?.point)
  url: url
  loadPage: loadPage
  canPushState: canPushState
  whenConfirmed: whenConfirmed
  isSupported: isSupported
  puts: puts
  sprintf: sprintf
  sprintfWithFormattedArgs: sprintfWithFormattedArgs
  sessionStorage: sessionStorage
  popCookie: popCookie
  hash: hash

)(jQuery)
