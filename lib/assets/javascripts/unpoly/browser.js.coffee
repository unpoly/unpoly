###*
Browser interface
=================

Some browser-interfacing methods and switches that
we can't currently get rid off.

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
      location.href = url
    else
      $form = $("<form method='post' action='#{url}'></form>")
      addField = (field) ->
        $field = $('<input type="hidden">')
        $field.attr(field.name, field.value)
        $field.appendTo($form)
      addField(name: up.proxy.config.wrapMethodParam, value: method)
      if csrfField = up.rails.csrfField()
        addField(csrfField)
      u.each u.requestDataAsArray(options.data), addField
      $form.hide().appendTo('body')
      $form.submit()

  ###*
  A cross-browser way to interact with `console.log`, `console.error`, etc.

  This function falls back to `console.log` if the output stream is not implemented.
  It also prints substitution strings (e.g. `console.log("From %o to %o", "a", "b")`)
  as a single string if the browser console does not support substitution strings.

  \#\#\#\# Example

      up.browser.puts('log', 'Hi world');
      up.browser.puts('error', 'There was an error in %o', obj);

  @function up.browser.puts
  @internal
  ###
  puts = (stream, args...) ->
    u.isDefined(console[stream]) or stream = 'log'
    if canLogSubstitution()
      console[stream](args...)
    else
      # IE <= 9 cannot pass varargs to console.log using Function#apply because IE
      message = sprintf(args...)
      console[stream](message)

  CONSOLE_PLACEHOLDERS = /\%[odisf]/g

  ###*
  See https://developer.mozilla.org/en-US/docs/Web/API/Console#Using_string_substitutions

  @function up.browser.sprintf
  @internal
  ###
  sprintf = (message, args...) ->
    i = 0
    maxLength = 80
    message.replace CONSOLE_PLACEHOLDERS, ->
      arg = args[i]
      argType = (typeof arg)
      if argType == 'string'
        arg = arg.replace(/\s+/g, ' ')
        arg = "#{arg.substr(0, maxLength)}…" if arg.length > maxLength
        arg = "\"#{arg}\""
      else if argType == 'undefined'
        # JSON.stringify(undefined) is actually undefined
        arg = 'undefined'
      else if argType == 'number' || argType == 'function'
        arg = arg.toString()
      else
        arg = JSON.stringify(arg)
      if arg.length > maxLength
        arg = "#{arg.substr(0, maxLength)} …"
        # For truncated objects or functions, add a trailing brace so
        # long log lines are easier to parse visually
        if argType == 'object' || argType == 'function'
          arg += " }"
      i += 1
      arg

  url = ->
    location.href

  isIE8OrWorse = u.memoize ->
    # This is the most concise way to exclude IE8 and lower
    # while keeping all relevant desktop and mobile browsers.
    u.isUndefined(document.addEventListener)

  isIE9OrWorse = u.memoize ->
    isIE8OrWorse() || navigator.appVersion.indexOf('MSIE 9.') != -1

  ###*
  Returns whether this browser supports manipulation of the current URL
  via [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState).

  When Unpoly is asked to change history on a browser that doesn't support
  `pushState` (e.g. through [`up.follow`](/up.follow)), it will gracefully
  fall back to a full page load.

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
    #    Modern Firefoxes, Chromes and IE10+ don't seem to be affected by this,
    #    but we saw this behavior with Safari 8 and IE9 (IE9 can't do pushState anyway).
    #
    # The way that we work around this is that we don't support pushState if the
    # initial request method was anything other than GET (but allow the rest of the
    # Unpoly framework to work). This way Unpoly will fall back to full page loads until
    # the framework was booted from a GET request.
    u.isDefined(history.pushState) && initialRequestMethod() == 'get'

  ###*
  Returns whether this browser supports animation using
  [CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions).

  When Unpoly is asked to animate history on a browser that doesn't support
  CSS transitions (e.g. through [`up.animate`](/up.animate)), it will skip the
  animation by instantly jumping to the last frame.

  @function up.browser.canCssTransition
  @return {Boolean}
  @experimental
  ###
  canCssTransition = u.memoize ->
    'transition' of document.documentElement.style

  ###*
  Returns whether this browser supports the DOM event [`input`](https://developer.mozilla.org/de/docs/Web/Events/input).

  @function up.browser.canInputEvent
  @return {Boolean}
  @experimental
  ###
  canInputEvent = u.memoize ->
    'oninput' of document.createElement('input')

  ###*
  Returns whether this browser supports
  [string substitution](https://developer.mozilla.org/en-US/docs/Web/API/console#Using_string_substitutions)
  in `console` functions.

  \#\#\#\# Example for string substition

      console.log("Hello %o!", "Judy");

  @function up.browser.canLogSubstitution
  @return {Boolean}
  @internal
  ###
  canLogSubstitution = u.memoize ->
    !isIE9OrWorse()

  isRecentJQuery = u.memoize ->
    version = $.fn.jquery
    parts = version.split('.')
    major = parseInt(parts[0])
    minor = parseInt(parts[1])
    major >= 2 || (major == 1 && minor >= 9)

  # Returns and deletes a cookie with the given name
  # Inspired by Turbolinks: https://github.com/rails/turbolinks/blob/83d4b3d2c52a681f07900c28adb28bc8da604733/lib/assets/javascripts/turbolinks.coffee#L292
  popCookie = (name) ->
    value = document.cookie.match(new RegExp(name+"=(\\w+)"))?[1]
    if u.isPresent(value)
      document.cookie = name + '=; expires=Thu, 01-Jan-70 00:00:01 GMT; path=/'
    value

  ###*
  @function up,browser.confirm
  @return {Promise}
  @internal
  ###
  confirm = (message) ->
    if u.isBlank(message) || confirm(message)
      u.resolvedPromise()
    else
      u.unresolvablePromise()

  # Server-side companion libraries like unpoly-rails set this cookie so we
  # have a way to detect the request method of the initial page load.
  # There is no Javascript API for this.
  initialRequestMethod = u.memoize ->
    (popCookie('_up_request_method') || 'get').toLowerCase()

  ###*
  Returns whether Unpoly supports the current browser.

  This also returns `true` if Unpoly only support some features, but falls back
  gracefully for other features. E.g. IE9 is almost fully supported, but due to
  its lack of [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)
  Unpoly falls back to a full page load when asked to manipulate history.

  Currently Unpoly supports IE9 with jQuery 1.9+.
  On older browsers Unpoly will prevent itself from [booting](/up.boot)
  and ignores all registered [event handlers](/up.on) and [compilers](/up.compiler).
  This leaves you with a classic server-side application.

  @function up.browser.isSupported
  @experimental
  ###
  isSupported = ->
    (!isIE8OrWorse()) && isRecentJQuery()

  ###*
  @internal
  ###
  installPolyfills = ->
    console.group ||= (args...) -> puts('group', args...)
    console.groupCollapsed ||= (args...) -> puts('groupCollapsed', args...)
    console.groupEnd ||= (args...) -> puts('groupEnd', args...)

  url: url
  loadPage: loadPage
  confirm: confirm
  canPushState: canPushState
  canCssTransition: canCssTransition
  canInputEvent: canInputEvent
  canLogSubstitution: canLogSubstitution
  isSupported: isSupported
  installPolyfills: installPolyfills
  puts: puts
  sprintf: sprintf

)(jQuery)
