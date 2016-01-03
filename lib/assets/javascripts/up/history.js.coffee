###*
Browser history
===============
  
\#\#\# Incomplete documentation!
  
We need to work on this page:

- Explain how the other modules manipulate history
- Decide whether we want to expose these methods as public API
- Document methods and parameters

@class up.history
###
up.history = (($) ->
  
  u = up.util

  ###*
  @property up.history.config
  @param {Array} [config.popTargets=['body']]
    An array of CSS selectors to replace when the user goes
    back in history.
  @param {Boolean} [config.restoreScroll=true]
    Whether to restore the known scroll positions
    when the user goes back or forward in history.
  ###
  config = u.config
    popTargets: ['body']
    restoreScroll: true

  ###*
  Returns the previous URL in the browser history.

  Note that this will only work reliably for history changes that
  were applied by [`up.history.push`](/up.history.replace) or
  [`up.history.replace`](/up.history.replace).

  @function up.history.previousUrl
  @internal
  ###
  previousUrl = undefined
  nextPreviousUrl = undefined

  reset = ->
    config.reset()
    previousUrl = undefined
    nextPreviousUrl = undefined

  normalizeUrl = (url) ->
    u.normalizeUrl(url, hash: true)

  ###*
  Returns a normalized URL for the current history entry.

  @function up.history.url
  @experimental
  ###
  currentUrl = ->
    normalizeUrl(up.browser.url())
  
  isCurrentUrl = (url) ->
    normalizeUrl(url) == currentUrl()

  observeNewUrl = (url) ->
    if nextPreviousUrl
      previousUrl = nextPreviousUrl
      nextPreviousUrl = undefined
    nextPreviousUrl = url

  ###*
  Replaces the current history entry and updates the
  browser's location bar with the given URL.

  When the user navigates to the replaced history entry at a later time,
  Up.js will [`replace`](/up.replace) the document body with
  the body from that URL.

  Note that functions like [`up.replace`](/up.replace) or
  [`up.submit`](/up.submit) will automatically update the
  browser's location bar for you.

  @function up.history.replace
  @param {String} url
  @param {Boolean} [options.force=false]
  @experimental
  ###
  replace = (url, options) ->
    manipulate('replace', url, options)

  ###*
  Adds a new history entry and updates the browser's
  address bar with the given URL.

  When the user navigates to the added  history entry at a later time,
  Up.js will [`replace`](/up.replace) the document body with
  the body from that URL.

  Note that functions like [`up.replace`](/up.replace) or
  [`up.submit`](/up.submit) will automatically update the
  browser's location bar for you.

  @function up.history.push
  @param {String} url
  @experimental
  ###
  push = (url, options) ->
    manipulate('push', url, options)

  manipulate = (method, url, options) ->
    options = u.options(options, force: false)
    if options.force || !isCurrentUrl(url)
      if up.browser.canPushState()
        fullMethod = "#{method}State" # resulting in either pushState or replaceState
        state = buildState()
        # console.log("[#{method}] URL %o with state %o", url, state)
        u.debug("Changing history to URL %o (%o)", url, method)
        # previousUrl = url
        window.history[fullMethod](state, '', url)
        observeNewUrl(currentUrl())
      else
        u.error "This browser doesn't support history.pushState"

  buildState = ->
    fromUp: true

  restoreStateOnPop = (state) ->
    url = currentUrl()
    u.debug "Restoring state %o (now on #{url})", state
    popSelector = config.popTargets.join(', ')
    up.replace popSelector, url,
      history: false,
      reveal: false,
      transition: 'none',
      saveScroll: false # since the URL was already changed by the browser, don't save scroll state
      restoreScroll: config.restoreScroll

  pop = (event) ->
    u.debug("History state popped to URL %o", currentUrl())
    observeNewUrl(currentUrl())
    up.layout.saveScroll(url: previousUrl)
    state = event.originalEvent.state
    if state?.fromUp
      restoreStateOnPop(state)
    else
      u.debug 'Discarding unknown state %o', state

  # up.on 'framework:ready', ->
  if up.browser.canPushState()
    register = ->
      $(window).on "popstate", pop
      replace(currentUrl(), force: true)

    if jasmine?
      # Can't delay this in tests.
      register()
    else
      # Defeat an unnecessary popstate that some browsers trigger
      # on pageload (Safari, Chrome < 34).
      # We should check in 2023 if we can remove this.
      setTimeout register, 100


  ###*
  Changes the link's destination so it points to the previous URL.

  Note that this will *not* call `location.back()`, but will set
  the link's `up-href` attribute to the actual, previous URL.

  \#\#\#\# Under the hood

  This link ...

      <a href="/default" up-back>
        Go back
      </a>

  ... will be transformed to:

      <a href="/default" up-href="/previous-page" up-restore-scroll up-follow>
        Goback
      </a>

  @selector [up-back]
  @stable
  ###
  up.compiler '[up-back]', ($link) ->
    if u.isPresent(previousUrl)
      u.setMissingAttrs $link,
        'up-href': previousUrl,
        'up-restore-scroll': ''
      $link.removeAttr 'up-back'
      up.link.makeFollowable($link)

  up.on 'up:framework:reset', reset

  config: config
  defaults: -> u.error('up.history.defaults(...) no longer exists. Set values on he up.history.config property instead.')
  push: push
  replace: replace
  url: currentUrl
  previousUrl: -> previousUrl
  normalizeUrl: normalizeUrl

)(jQuery)
