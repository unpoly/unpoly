###*
Browser history
===============
  
In an Unpoly app, every page has an URL.

[Fragment updates](/up.link) automatically update the URL.


Going back behavior .... configure.

@class up.history
###
up.history = (($) ->
  
  u = up.util

  ###*
  Configures behavior when the user goes back or forward in browser history.

  @property up.history.config
  @param {Array} [config.popTargets=['body']]
    An array of CSS selectors to replace when the user goes
    back in history.
  @param {Boolean} [config.restoreScroll=true]
    Whether to restore the known scroll positions
    when the user goes back or forward in history.
  @stable
  ###
  config = u.config
    popTargets: ['body']
    restoreScroll: true

  ###*
  Returns the previous URL in the browser history.

  Note that this will only work reliably for history changes that
  were applied by [`up.history.push()`](/up.history.replace) or
  [`up.history.replace()`](/up.history.replace).

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

  ###*
  Remembers the given URL so we can offer `up.history.previousUrl()`.

  @function observeNewUrl
  @internal
  ###
  observeNewUrl = (url) ->
    if nextPreviousUrl
      previousUrl = nextPreviousUrl
      nextPreviousUrl = undefined
    nextPreviousUrl = url

  ###*
  Replaces the current history entry and updates the
  browser's location bar with the given URL.

  When the user navigates to the replaced history entry at a later time,
  Unpoly will [`replace`](/up.replace) the document body with
  the body from that URL.

  Note that functions like [`up.replace()`](/up.replace) or
  [`up.submit()`](/up.submit) will automatically update the
  browser's location bar for you.

  @function up.history.replace
  @param {String} url
  @experimental
  ###
  replace = (url) ->
    manipulate('replaceState', url)

  ###*
  Adds a new history entry and updates the browser's
  address bar with the given URL.

  When the user navigates to the added  history entry at a later time,
  Unpoly will [`replace`](/up.replace) the document body with
  the body from that URL.

  Note that functions like [`up.replace()`](/up.replace) or
  [`up.submit()`](/up.submit) will automatically update the
  browser's location bar for you.

  Emits events [`up:history:push`](/up:history:push) and [`up:history:pushed`](/up:history:pushed).

  @function up.history.push
  @param {String} url
    The URL for the history entry to be added.
  @experimental
  ###
  push = (url, options) ->
    options = u.options(options, force: false)
    url = normalizeUrl(url)
    if (options.force || !isCurrentUrl(url)) && up.bus.nobodyPrevents('up:history:push', url: url, message: "Adding history entry for #{url}")
      manipulate('pushState', url)
      up.emit('up:history:pushed', url: url, message: "Advanced to location #{url}")

  ###*
  This event is [emitted](/up.emit) before a new history entry is added.

  @event up:history:push
  @param {String} event.url
    The URL for the history entry that is going to be added.
  @param event.preventDefault()
    Event listeners may call this method to prevent the history entry from being added.
  @experimental
  ###

  ###*
  This event is [emitted](/up.emit) after a new history entry has been added.

  @event up:history:pushed
  @param {String} event.url
    The URL for the history entry that has been added.
  @experimental
  ###

  manipulate = (method, url) ->
    if up.browser.canPushState()
      state = buildState()
      window.history[method](state, '', url)
      observeNewUrl(currentUrl())
    else
      up.fail "This browser doesn't support history.#{method}"

  buildState = ->
    fromUp: true

  restoreStateOnPop = (state) ->
    if state?.fromUp
      url = currentUrl()
      up.log.group "Restoring URL %s", url, ->
        popSelector = config.popTargets.join(', ')
        replaced = up.replace popSelector, url,
          history: false,     # don't push a new state
          title: true,        # do extract the title from the response
          reveal: false,
          transition: 'none',
          saveScroll: false   # since the URL was already changed by the browser, don't save scroll state
          restoreScroll: config.restoreScroll
        replaced.then ->
          url = currentUrl()
          up.emit('up:history:restored', url: url, message: "Restored location #{url}")
    else
      up.puts 'Ignoring a state not pushed by Unpoly (%o)', state

  pop = (event) ->
    observeNewUrl(currentUrl())
    up.layout.saveScroll(url: previousUrl)
    state = event.originalEvent.state
    restoreStateOnPop(state)

  ###*
  This event is [emitted](/up.emit) after a history entry has been restored.

  History entries are restored when the user uses the *Back* or *Forward* button.

  @event up:history:restored
  @param {String} event.url
    The URL for the history entry that has been restored.
  @experimental
  ###

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

  \#\#\# Example

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
  push: push
  replace: replace
  url: currentUrl
  previousUrl: -> previousUrl
  normalizeUrl: normalizeUrl

)(jQuery)
