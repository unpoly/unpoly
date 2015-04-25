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
      
  canPushState = ->
    u.isDefined(history.pushState)
    
  canCssTransitions = ->
    'transition' of document.documentElement.style
    
  url: url
  ensureConsoleExists: ensureConsoleExists
  loadPage: loadPage
  canPushState: canPushState
  canCssTransitions: canCssTransitions
      
)()
