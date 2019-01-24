###**
History
========

In an Unpoly app, every page has an URL.

[Fragment updates](/up.link) automatically update the URL.

@module up.history
###
up.history = do ->
  
  u = up.util
  e = up.element

  ###**
  Configures behavior when the user goes back or forward in browser history.

  @property up.history.config
  @param {Array} [config.popTargets=['body']]
    An array of CSS selectors to replace when the user goes
    back in history.
  @param {boolean} [config.restoreScroll=true]
    Whether to restore the known scroll positions
    when the user goes back or forward in history.
  @stable
  ###
  config = new up.Config
    enabled: true
    popTargets: ['body']
    restoreScroll: true

  ###**
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

  normalizeUrl = (url, normalizeOptions) ->
    normalizeOptions ||= {}
    normalizeOptions.hash = true
    u.normalizeUrl(url, normalizeOptions)

  ###**
  Returns a normalized URL for the current history entry.

  @function up.history.url
  @experimental
  ###
  currentUrl = (normalizeOptions) ->
    normalizeUrl(up.browser.url(), normalizeOptions)

  isCurrentUrl = (url) ->
    normalizeOptions = { stripTrailingSlash: true }
    normalizeUrl(url, normalizeOptions) == currentUrl(normalizeOptions)

  ###**
  Remembers the given URL so we can offer `up.history.previousUrl()`.

  @function observeNewUrl
  @internal
  ###
  observeNewUrl = (url) ->
    if nextPreviousUrl
      previousUrl = nextPreviousUrl
      nextPreviousUrl = undefined
    nextPreviousUrl = url

  ###**
  Replaces the current history entry and updates the
  browser's location bar with the given URL.

  When the user navigates to the replaced history entry at a later time,
  Unpoly will [`replace`](/up.replace) the document body with
  the body from that URL.

  Note that functions like [`up.replace()`](/up.replace) or
  [`up.submit()`](/up.submit) will automatically update the
  browser's location bar for you.

  @function up.history.replace
  @param {string} url
  @internal
  ###
  replace = (url) ->
    if manipulate('replaceState', url)
      up.emit('up:history:replaced', url: url)

  ###**
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
  @param {string} url
    The URL for the history entry to be added.
  @experimental
  ###
  push = (url, options) ->
    options = u.options(options, force: false)
    url = normalizeUrl(url)
    if (options.force || !isCurrentUrl(url)) && up.event.nobodyPrevents('up:history:push', url: url, log: "Adding history entry for #{url}")
      if manipulate('pushState', url)
        up.emit('up:history:pushed', url: url, log: "Advanced to location #{url}")
      else
        up.emit('up:history:muted', url: url, log: "Did not advance to #{url} (history is unavailable)")

  ###**
  This event is [emitted](/up.emit) before a new history entry is added.

  @event up:history:push
  @param {string} event.url
    The URL for the history entry that is going to be added.
  @param event.preventDefault()
    Event listeners may call this method to prevent the history entry from being added.
  @experimental
  ###

  ###**
  This event is [emitted](/up.emit) after a new history entry has been added.

  @event up:history:pushed
  @param {string} event.url
    The URL for the history entry that has been added.
  @experimental
  ###

  manipulate = (method, url) ->
    if up.browser.canPushState() && config.enabled
      state = buildState()
      window.history[method](state, '', url)
      observeNewUrl(currentUrl())
      true
    else
      false

  buildState = ->
    fromUp: true

  restoreStateOnPop = (state) ->
    if state?.fromUp
      url = currentUrl()

      # We can't let people prevent this event, since `popstate` is also unpreventable.
      up.emit('up:history:restore', url: url, log: "Restoring location #{url}")

      popSelector = config.popTargets.join(', ')
      replaced = up.replace popSelector, url,
        history: false,     # don't push a new state
        title: true,        # do extract the title from the response
        reveal: false,
        saveScroll: false   # since the URL was already changed by the browser, don't save scroll state
        restoreScroll: config.restoreScroll
        layer: 'page'       # Don't replace elements in a modal that might still be open
      replaced.then ->
        url = currentUrl()
        up.emit('up:history:restored', url: url, log: "Restored location #{url}")
    else
      up.puts 'Ignoring a state not pushed by Unpoly (%o)', state

  pop = (event) ->
    observeNewUrl(currentUrl())
    up.viewport.saveScroll(url: previousUrl)
    state = event.state
    restoreStateOnPop(state)

  ###**
  This event is [emitted](/up.emit) before a history entry will be restored.

  History entries are restored when the user uses the *Back* or *Forward* button.

  @event up:history:restore
  @param {string} event.url
    The URL for the history entry that has been restored.
  @internal
  ###

  ###**
  This event is [emitted](/up.emit) after a history entry has been restored.

  History entries are restored when the user uses the *Back* or *Forward* button.

  @event up:history:restored
  @param {string} event.url
    The URL for the history entry that has been restored.
  @experimental
  ###

  up.on 'up:app:boot', ->
    if up.browser.canPushState()
      register = ->
        window.history.scrollRestoration = 'manual' if up.browser.canControlScrollRestoration()
        window.addEventListener('popstate', pop)
        replace(currentUrl(), force: true)

      if jasmine?
        # Can't delay this in tests.
        register()
      else
        # Defeat an unnecessary popstate that some browsers trigger
        # on pageload (Safari, Chrome < 34).
        # We should check in 2023 if we can remove this.
        setTimeout(register, 100)

  ###**
  Changes the link's destination so it points to the previous URL.

  Note that this will *not* call `location.back()`, but will set
  the link's `up-href` attribute to the actual, previous URL.

  If no previous URL is known, the link will not be changed.

  \#\#\# Example

  This link ...

      <a href="/default" up-back>
        Go back
      </a>

  ... will be transformed to:

      <a href="/default" up-href="/previous-page" up-restore-scroll up-follow>
        Go back
      </a>

  @selector a[up-back]
  @stable
  ###
  up.macro 'a[up-back], [up-href][up-back]', (link) ->
    if u.isPresent(previousUrl)
      e.setMissingAttrs link,
        'up-href': previousUrl,
        'up-restore-scroll': ''
      link.removeAttribute('up-back')
      up.link.makeFollowable(link)

  up.on 'up:framework:reset', reset

  config: config
  push: push
  replace: replace
  url: currentUrl
  isUrl: isCurrentUrl
  previousUrl: -> previousUrl
  normalizeUrl: normalizeUrl

