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
    
  ensureConsoleExists = ->
    window.console ||= {}
    noop = () ->
    window.console.log ||= noop
    window.console.info ||= noop
    window.console.error ||= noop
    window.console.debug ||= noop
    window.console.warn ||= noop
    window.console.group ||= noop
    window.console.groupCollapsed ||= noop
    window.console.groupEnd ||= noop

  canPushState = u.memoize ->
    u.isDefined(history.pushState)
    
  canCssAnimation = u.memoize ->
    'transition' of document.documentElement.style

  canInputEvent = u.memoize ->
    'oninput' of document.createElement('input')
    
  ensureRecentJquery = ->
    version = $.fn.jquery
    parts = version.split('.')
    major = parseInt(parts[0])
    minor = parseInt(parts[1])
    compatible = major >= 2 || (major == 1 && minor >= 9)
    compatible or u.error("jQuery %o found, but Up.js requires 1.9+", version)
    
  isSupported = u.memoize ->
    # This is the most concise way to exclude IE8 and lower
    # while keeping all relevant desktop and mobile browsers.
    u.isDefined(document.addEventListener)

  url: url
  ensureConsoleExists: ensureConsoleExists
  loadPage: loadPage
  canPushState: canPushState
  canCssAnimation: canCssAnimation
  canInputEvent: canInputEvent
  isSupported: isSupported
  ensureRecentJquery: ensureRecentJquery
      
)()

