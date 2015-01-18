###*
@class up.history
###
up.history = (->

  ###*
  @method up.history.replace
  @param {String} url
  @protected
  ###
  replace = (url) ->
    manipulate "replace", url

  ###*
  @method up.history.push  
  @param {String} url
  @protected
  ###
  push = (url) ->
    manipulate "push", url

  manipulate = (method, url) ->
    method += "State" # resulting in either pushState or replaceState
    window.history[method]({ fromUp: true }, '', url)

  pop = (event) ->
    state = event.originalEvent.state
    console.log "popping state", state
    console.log "current href", currentUrl()
    if state?.fromUp
      up.visit currentUrl(), history: { method: 'replace' }
    else
      console.log "null state"

  currentUrl = ->
    location.href

  # Defeat an unnecessary popstate that some browsers trigger on pageload (Chrome?).
  # We should check in 2016 if we can remove this.
  setTimeout (->
    $(window).on "popstate", pop
    replace(currentUrl())
  ), 200

  push: push
  replace: replace

)()
