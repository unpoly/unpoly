###*
Browser interface
=================
  
@class up.browser
###
up.browser = (->
  
  u = up.util
  
#  safari = false
#  
#  detect = ->
#    agent = navigator.userAgent
#    agentHas = (substring) -> agent.indexOf(substring) >= 1
#    safari = agentHas('Safari') && !agentHas('Chrome')
#    
#  transitionEndEvent = ->
#    if safari
#      'webkitTransitionEnd'
#    else
#      'transitionend'
#
#  detect()
#  
#  transitionEndEvent: transitionEndEvent
  
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
    window.console.log ||= () ->
      
  memoize = (func) ->
    cache = undefined
    cached = false
    (args...) ->
      if cached
        cache
      else
        cached = true
        cache = func(args...)
      
  canPushState = memoize ->
    u.isDefined(history.pushState)
    
  canCssAnimation = memoize ->
    'transition' of document.documentElement.style

  canInputEvent = memoize ->
    'oninput' of document.createElement('input')
    
  isSupported = memoize ->
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
      
)()

