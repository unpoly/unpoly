###*
Browser interface
=================

Some browser-interfacing methods and switches that
we can't currently get rid off.

@protected
@class up.browser
###
up.browser = (($) ->

  u = up.util

  loadPage = (url, options = {}) ->
    method = u.option(options.method, 'get').toLowerCase()
    if method == 'get'
      location.href = url
    else if $.rails
      target = options.target
      csrfToken = $.rails.csrfToken()
      csrfParam = $.rails.csrfParam()
      $form = $("<form method='post' action='#{url}'></form>")
      metadataInput = "<input name='_method' value='#{method}' type='hidden' />"
      if u.isDefined(csrfParam) && u.isDefined(csrfToken)
        metadataInput += "<input name='#{csrfParam}' value='#{csrfToken}' type='hidden' />"
      if target
        $form.attr('target', target)
      $form.hide().append(metadataInput).appendTo('body')
      $form.submit()
    else
      error("Can't fake a #{method.toUpperCase()} request without Rails UJS")

  ###*
  Makes native `console.log`, `console.error`, etc. functions safer in multiple ways:

  - Falls back to `console.log` if the output stream is not implemented
  - Prints substitution strings (e.g. `console.log("From %o to %o", "a", "b")`) as a single
    string if the browser console does not support substitution strings.

  @method up.browser.puts
  @protected
  ###
  puts = (stream, args...) ->
    u.isDefined(console[stream]) or stream = 'log'
    if canLogSubstitution()
      console[stream](args...)
    else
      # IE <= 9 cannot pass varargs to console.log using Function#apply because IE
      message = u.evalConsoleTemplate(args...)
      console[stream](message)

  url = ->
    location.href

  canPushState = u.memoize ->
    # We cannot use pushState if the initial request method is a POST for two reasons:
    #
    # 1. Up.js replaces the initial state so it can handle the pop event when the
    #    user goes back to the initial URL later. If the initial request was a POST,
    #    Up.js will wrongly assumed that it can restore the state by reloading with GET.
    #
    # 2. Some browsers have a bug where the initial request method is used for all
    #    subsequently pushed states. That means if the user reloads the page on a later
    #    GET state, the browser will wrongly attempt a POST request.
    #    Modern Firefoxes, Chromes and IE10+ don't seem to be affected by this,
    #    but we saw this behavior with Safari 8 and IE9 (IE9 can't do pushState anyway).
    #
    # The way that we work around this is that we don't support pushState if the
    # initial request method was anything other than GET (but allow the rest of the
    # Up.js framework to work). This way Up.js will fall back to full page loads until
    # the framework was booted from a GET request.
    u.isDefined(history.pushState) && initialRequestMethod() == 'get'

  isIE8OrWorse = u.memoize ->
    # This is the most concise way to exclude IE8 and lower
    # while keeping all relevant desktop and mobile browsers.
    u.isUndefined(document.addEventListener)

  isIE9OrWorse = u.memoize ->
    isIE8OrWorse() || navigator.appVersion.indexOf('MSIE 9.') != -1

  canCssAnimation = u.memoize ->
    'transition' of document.documentElement.style

  canInputEvent = u.memoize ->
    'oninput' of document.createElement('input')

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

  # Server-side companion libraries like upjs-rails set this cookie so we
  # have a way to detect the request method of the initial page load.
  # There is no Javascript API for this.
  initialRequestMethod = u.memoize ->
    (popCookie('_up_request_method') || 'get').toLowerCase()

  ###*
  Returns whether Up.js supports the current browser.

  Currently Up.js supports IE9 with jQuery 1.9+.
  On older browsers Up.js will prevent itself from booting, leaving you with
  a classic server-side application.

  @method up.browser.isSupported
  ###
  isSupported = ->
    (!isIE8OrWorse()) && isRecentJQuery()

  url: url
  loadPage: loadPage
  canPushState: canPushState
  canCssAnimation: canCssAnimation
  canInputEvent: canInputEvent
  canLogSubstitution: canLogSubstitution
  isSupported: isSupported
  puts: puts

)(jQuery)
