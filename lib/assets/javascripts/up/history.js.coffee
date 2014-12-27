up.history = (->

  replace = (url) ->
    manipulate "replace", url

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

  setTimeout (->
    $(window).on "popstate", pop
    replace(currentUrl())
  ), 200

  push: push
  replace: replace

)()
