###*
Browser interface
=================

Some browser-interfacing methods and switches that
we can't currently get rid off.

@protected
@class up.browser
###
up.browser = (->

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
  
  url = ->
    location.href
    
  installConsolePolyfill = ->
    window.console ||= {}
    noop = () ->
    simpleLog = (args...) ->
      # Old IEs cannot pass varargs to console.log using Function#apply because IE
      message = u.evalConsoleTemplate(args...)
      console.log(message)
    window.console.log ||= noop
    window.console.info ||= simpleLog
    window.console.error ||= simpleLog
    window.console.debug ||= simpleLog
    window.console.warn ||= simpleLog
    window.console.group ||= noop
    window.console.groupCollapsed ||= noop
    window.console.groupEnd ||= noop

  installPolyfills = ->
    installConsolePolyfill()

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
    
  canCssAnimation = u.memoize ->
    'transition' of document.documentElement.style

  canInputEvent = u.memoize ->
    'oninput' of document.createElement('input')

  isRecentBrowser = u.memoize ->
    # This is the most concise way to exclude IE8 and lower
    # while keeping all relevant desktop and mobile browsers.
    u.isDefined(document.addEventListener)

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

  isSupported = ->
    isRecentBrowser() && isRecentJQuery()

  # We need to install polyfills as soon as possible, since Up.js
  # won't even require completely on old IEs without the `console`
  # polyfills.
  installPolyfills() if isSupported()

  url: url
  loadPage: loadPage
  canPushState: canPushState
  canCssAnimation: canCssAnimation
  canInputEvent: canInputEvent
  isSupported: isSupported

)()
