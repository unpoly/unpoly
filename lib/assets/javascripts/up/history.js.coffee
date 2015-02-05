###*
Manipulating the browser history
=======
  
TODO: Write some documentation
  
@class up.history
###
up.history = (->
  
  u = up.util
  
  isCurrentUrl = (url) ->
    u.normalizeUrl(url, hash: true) == u.normalizeUrl(up.browser.url(), hash: true)
    
  ###*
  @method up.history.replace
  @param {String} url
  @protected
  ###
  replace = (url) ->
    manipulate("replace", url) unless isCurrentUrl(url)

  ###*
  @method up.history.push  
  @param {String} url
  @protected
  ###
  push = (url) ->
    manipulate("push", url) unless isCurrentUrl(url)

  manipulate = (method, url) ->
    method += "State" # resulting in either pushState or replaceState
    window.history[method]({ fromUp: true }, '', url)

  pop = (event) ->
    state = event.originalEvent.state
    console.log "popping state", state
    console.log "current href", up.browser.url()
    if state?.fromUp
      up.visit up.browser.url(), historyMethod: 'replace'
    else
      console.log "null state"

  # Defeat an unnecessary popstate that some browsers trigger on pageload (Chrome?).
  # We should check in 2016 if we can remove this.
  setTimeout (->
    $(window).on "popstate", pop
    replace(up.browser.url())
  ), 200

  push: push
  replace: replace

)()
