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

  ###*
  @method up.history.defaults
  @param [options.popTarget]
  ###
  config = u.config
    popTarget: 'body'

  reset = ->
    config.reset()
  
  isCurrentUrl = (url) ->
    u.normalizeUrl(url, hash: true) == u.normalizeUrl(up.browser.url(), hash: true)
    
  ###*
  @method up.history.replace
  @param {String} url
  @param {Boolean} [options.force=false]
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
      up.replace config.popTarget, up.browser.url(), historyMethod: 'replace'
    else
      u.debug 'Discarding unknown state %o', state

  if up.browser.canPushState()
    register = ->
      $(window).on "popstate", pop
      replace(up.browser.url(), force: true)

    if jasmine?
      # Can't delay this in tests.
      register()
    else
      # Defeat an unnecessary popstate that some browsers trigger
      # on pageload (Safari, Chrome < 34).
      # We should check in 2023 if we can remove this.
      setTimeout register, 100

  up.bus.on 'framework:reset', reset

  defaults: config.update
  push: push
  replace: replace

)()
