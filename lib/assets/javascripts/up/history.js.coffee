###*
Manipulating the browser history
=======
  
\#\#\# Incomplete documentation!
  
We need to work on this page:

- Explain how the other modules manipulate history
- Decide whether we want to expose these methods as public API
- Document methods and parameters

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
  replace = (url, options) ->
    options = u.options(options, force: false)
    if options.force || !isCurrentUrl(url)
      manipulate("replace", url)

  ###*
  @method up.history.push  
  @param {String} url
  @protected
  ###
  push = (url) ->
    manipulate("push", url) unless isCurrentUrl(url)

  manipulate = (method, url) ->
    if up.browser.canPushState()
      method += "State" # resulting in either pushState or replaceState
      window.history[method]({ fromUp: true }, '', url)
    else
      u.error "This browser doesn't support history.pushState"

  pop = (event) ->
    state = event.originalEvent.state
    if state?.fromUp
      u.debug "Restoring state %o (now on #{up.browser.url()})", state
      up.visit up.browser.url(), historyMethod: 'replace'
    else
      u.debug 'Discarding unknown state %o', state

  # Defeat an unnecessary popstate that some browsers trigger on pageload (Chrome?).
  # We should check in 2016 if we can remove this.
  if up.browser.canPushState()
    setTimeout (->
      $(window).on "popstate", pop
      replace(up.browser.url(), force: true)
    ), 200

  push: push
  replace: replace

)()
