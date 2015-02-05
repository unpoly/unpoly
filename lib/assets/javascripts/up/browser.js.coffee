###*
Browser interface
=================
  
@class up.browser
###
up.browser = (->
  
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
  
  url = ->
    location.href
    
  url: url
      
)()
