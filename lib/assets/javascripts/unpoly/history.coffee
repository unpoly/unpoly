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
  @param {Array} [config.popTargets=[]]
    A list of possible CSS selectors to [replace](/up.change) when the user goes back in history.

    If this array is empty, the [root layer's default targets](/up.layer.config.root) will be replaced.
  @param {boolean} [config.restoreScroll=true]
    Whether to restore the known scroll positions
    when the user goes back or forward in history.
  @stable
  ###
  config = new up.Config ->
    enabled: true
    popTargets: [] # will be prepended to the root layer's default target
    restoreScroll: true

  ###**
  Returns the previous URL in the browser history.

  Note that this will only work reliably for history changes that
  were applied by [`up.history.push()`](/up.history.replace) or
  [`up.history.replace()`](/up.history.replace).

  @function up.history.previousURL
  @internal
  ###
  previousURL = undefined
  nextPreviousURL = undefined

  reset = ->
    config.reset()
    previousURL = undefined
    nextPreviousURL = undefined

  normalizeURL = (url, normalizeOptions = {}) ->
    normalizeOptions.hash = true
    u.normalizeURL(url, normalizeOptions)

  ###**
  Returns a normalized URL for the current history entry.

  @property up.history.location
  @experimental
  ###
  currentLocation = (normalizeOptions) ->
    normalizeURL(up.browser.location, normalizeOptions)

  isCurrentLocation = (url) ->
    # Some web frameworks care about a trailing slash, some consider it optional.
    # Only for the equality test (is this the current URL) we consider it optional.
    normalizeOptions = { stripTrailingSlash: true }
    normalizeURL(url, normalizeOptions) == currentLocation(normalizeOptions)

  ###**
  Remembers the given URL so we can offer `up.history.previousURL()`.

  @function observeNewURL
  @internal
  ###
  observeNewURL = (url) ->
    if nextPreviousURL
      previousURL = nextPreviousURL
      nextPreviousURL = undefined
    nextPreviousURL = url

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
    else
      up.emit('up:history:muted', url: url, log: "Did not replace state with #{url} (history is unavailable)")

  ###**
  Adds a new history entry and updates the browser's
  address bar with the given URL.

  When the user navigates to the added history entry at a later time,
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
  push = (url, options = {}) ->
    url = normalizeURL(url)
    if (options.force || !isCurrentLocation(url))
      if manipulate('pushState', url)
        up.emit('up:history:pushed', url: url, log: "Advanced to location #{url}")
      else
        up.emit('up:history:muted', url: url, log: "Did not advance to #{url} (history is unavailable)")

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
      observeNewURL(currentLocation())
      true
    else
      false

  buildState = ->
    fromUp: true

  restoreStateOnPop = (state) ->
    if state?.fromUp
      url = currentLocation()

      # We can't let people prevent this event, since `popstate` is also unpreventable.
      up.emit('up:history:restore', url: url, log: "Restoring location #{url}")

      replaced = up.change
        layer: 'root'        # Don't replace elements in a modal that might still be open
        peel: true           # Close all overlays
        target: config.popTargets,
        url: url
        location: false,    # don't push a new state
        restoreScroll: config.restoreScroll
        saveScroll: false   # since the URL was already changed by the browser, don't save scroll state
        keep: false
      replaced.then ->
        url = currentLocation()
        up.emit('up:history:restored', url: url, log: "Restored location #{url}")
    else
      up.puts 'Ignoring a state not pushed by Unpoly (%o)', state

  pop = (event) ->
    observeNewURL(currentLocation())
    up.viewport.saveScroll(url: previousURL)
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
        # Replace the vanilla state of the initial page load with an Unpoly-enabled state
        replace(currentLocation(), force: true)

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
    if previousURL
      e.setMissingAttrs link,
        'up-href': previousURL,
        'up-restore-scroll': ''
      link.removeAttribute('up-back')
      up.link.makeFollowable(link)

  up.on 'up:framework:reset', reset

  u.literal
    config: config
    push: push
    replace: replace
    get_location: currentLocation
    isLocation: isCurrentLocation
    previousURL: -> previousURL
    normalizeURL: normalizeURL

