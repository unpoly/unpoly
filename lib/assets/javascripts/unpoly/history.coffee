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
  @param {Array} [config.restoreTargets=[]]
    A list of possible CSS selectors to [replace](/up.render) when the user goes back in history.

    If this array is empty, the [root layer's default targets](/up.layer.config.root) will be replaced.
  @param {boolean} [config.enabled=true]
    Defines whether [fragment updates](/up.render) will update the browser's current URL.

    If set to `false` Unpoly will never change the browser URL.
  @param {boolean} [config.restoreScroll=true]
    Whether to restore the known scroll positions
    when the user goes back or forward in history.
  @stable
  ###
  config = new up.Config ->
    enabled: true
    restoreTargets: ['body']

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
    normalizeURL(location.href, normalizeOptions)

  isCurrentLocation = (url) ->
    # Some web frameworks care about a trailing slash, some consider it optional.
    # Only for the equality test (is this the current URL) we consider it optional.
    normalizeOptions = { stripTrailingSlash: true }
    normalizeURL(url, normalizeOptions) == currentLocation(normalizeOptions)

  ###**
  Remembers the given URL so we can use previousURL on pop.

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
  replace = (url, options = {}) ->
    doLog = options.log ? true

    if manipulate('replaceState', url)
      emit('up:history:replaced', url: url, log: doLog && "Replaced state for #{u.urlWithoutHost url}")
    else
      emit('up:history:muted', url: url, log: doLog && "Did not replace state with #{u.urlWithoutHost url} (history is disabled)")


  ###**
  This event is [emitted](/up.emit) after a new history entry has been replaced.

  Also see `up:history:pushed` and `up:history:restored`.

  @event up:history:replaced
  @param {string} event.url
    The URL for the history entry that has been added.
  @stable
  ###

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
        up.emit('up:history:pushed', url: url, log: "Advanced to location #{u.urlWithoutHost url}")
      else
        up.emit('up:history:muted', url: url, log: "Did not advance to #{u.urlWithoutHost url} (history is disabled)")

  ###**
  This event is [emitted](/up.emit) after a new history entry has been added.

  Also see `up:history:replaced` and `up:history:restored`.

  @event up:history:pushed
  @param {string} event.url
    The URL for the history entry that has been added.
  @stable
  ###

  manipulate = (method, url) ->
    if up.browser.canPushState() && config.enabled
      state = buildState()
      window.history[method](state, '', url)
      observeNewURL(currentLocation())
      return state
    else
      false

  buildState = ->
    up: {}

  restoreStateOnPop = (state) ->
    if state?.up
      url = currentLocation()

      replaced = up.render
        url: url
        history: true
        location: false,    # don't push a new state. the browser will automatically set the URL from the popped state.
        layer: 'root'        # Don't replace elements in a modal that might still be open
        target: config.restoreTargets,
        fallback: true
        cache: true
        peel: true           # Close all overlays
        keep: false
        scroll: 'restore'
        saveScroll: false   # since the URL was already changed by the browser, don't save scroll state
      replaced.then ->
        url = currentLocation()
        emit('up:history:restored', url: url, log: "Restored location #{url}")
    else
      up.puts('pop', 'Ignoring a state not pushed by Unpoly (%o)', state)

  pop = (event) ->
    observeNewURL(currentLocation())
    up.viewport.saveScroll(location: previousURL)
    state = event.state
    restoreStateOnPop(state)

  emit = (args...) ->
    historyLayer = u.find(up.layer.stack.reversed(), 'history')
    historyLayer.emit(args...)

  ###**
  This event is [emitted](/up.emit) after a history entry has been restored.

  History entries are restored when the user uses the *Back* or *Forward* button.

  Also see `up:history:pushed` and `up:history:replaced`.

  @event up:history:restored
  @param {string} event.url
    The URL for the history entry that has been restored.
  @stable
  ###

  up.on 'up:app:boot', ->
    if up.browser.canPushState()
      register = ->
        window.history.scrollRestoration = 'manual' if up.browser.canControlScrollRestoration()
        window.addEventListener('popstate', pop)
        # Replace the vanilla state of the initial page load with an Unpoly-enabled state
        replace(currentLocation(), log: false)

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
    normalizeURL: normalizeURL

