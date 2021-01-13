###**
Passive updates
===============

This work-in-progress package will contain functionality to
passively receive updates from the server.

@module up.radio
###
up.radio = do ->

  u = up.util
  e = up.element

  ###**
  Configures defaults for passive updates.

  @property up.radio.config
  @param {Array<string>} [config.hungrySelectors]
    An array of CSS selectors that is replaced whenever a matching element is found in a response.
    These elements are replaced even when they were not targeted directly.

    By default this contains the [`[up-hungry]`](/up-hungry) attribute.
  @param {number} [config.pollInterval=30000]
    The default [polling](/up-poll] interval in milliseconds.
  @param {boolean|string} [config.pollEnabled='auto']
    Whether Unpoly will follow instructions to poll fragments, like the `[up-poll]` attribute.

    When set to `'auto'` Unpoly will poll if one of the following applies:

    - The browser tab is in the foreground
    - The fragment's layer is the [frontmost layer](/up.layer.front).
    - We should not [avoid optional requests](/up.network.shouldReduceRequests)

    When set to `true`, Unpoly will always allow polling.

    When set to `false`, Unpoly will never allow polling.
  @stable
  ###
  config = new up.Config ->
    hungrySelectors: ['[up-hungry]']
    pollInterval: 30000
    pollEnabled: 'auto'

  reset = ->
    config.reset()

  ###**
  @function up.radio.hungrySelector
  @internal
  ###
  hungrySelector = ->
    config.hungrySelectors.join(',')

  ###**
  Elements with an `[up-hungry]` attribute are [updated](/up.replace) whenever there is a
  matching element found in a successful response. The element is replaced even
  when it isn't [targeted](/a-up-target) directly.

  Use cases for this are unread message counters or notification flashes.
  Such elements often live in the layout, outside of the content area that is
  being replaced.

  @selector [up-hungry]
  @param [up-transition]
    The transition to use when this element is updated.
  @stable
  ###

  ###**
  Starts [polling](/up-poll) the given element.

  @function up.radio.startPolling
  @param {Element|jQuery|string} fragment
    The fragment to reload periodically.
  @param {number} options.interval
    The reload interval in milliseconds.

    Defaults to `up.radio.config.pollInterval`.
  @stable
  ###
  startPolling = (fragment, options = {}) ->
    interval = options.interval ? e.numberAttr(fragment, 'up-interval') ? config.pollInterval

    stopped = false

    lastRequest = null
    options.onQueued = ({ request }) -> lastRequest = request

    doReload = ->
      # The setTimeout(doReload) callback might already be scheduled
      # before the polling stopped.
      return if stopped

      if shouldPoll(fragment)
        console.log("SHOULD POLL!")
        u.always(up.reload(fragment, options), doSchedule)
      else
        # Reconsider after 10 seconds at most
        doSchedule(Math.min(10 * 1000, interval))

    doSchedule = (delay = interval) ->
      # The up.reload().then(doSchedule) callback might already be
      # registered before the polling stopped.
      return if stopped

      setTimeout(doReload, delay)

    destructor = ->
      stopped = true       # Don't execute already-scheduled callbacks
      lastRequest?.abort() # Abort any pending request

    # up.radio.stopPolling() will emit up:poll:stop to signal cancelation.
    up.on(fragment, 'up:poll:stop', destructor)

    doSchedule()

    return destructor

  ###**
  Stops [polling](/up-poll) the given element.

  @function up.radio.stopPolling
  @param {Element|jQuery|string} fragment
    The fragment to stop reloading.
  @stable
  ###
  stopPolling = (element) ->
    up.emit(element, 'up:poll:stop')

  shouldPoll = (fragment) ->
    setting = u.evalOption(config.pollEnabled, fragment)
    if setting == 'auto'
      return !document.hidden && !up.network.shouldReduceRequests() && up.layer.get(fragment)?.isFront?()
    return setting

  ###**
  Elements with an `[up-poll]` attribute are [reloaded](/up.reload) from the server periodically.

  \#\#\# Example

  Assume an application layout with an unread message counter.
  You can use `[up-poll]` to refresh the counter every 30 seconds:

      <div class="unread-count" up-poll>
        2 new messages
      </div>

  \#\#\# Controlling the reload interval

  You may set an optional `[up-interval]` attribute to set the reload interval in milliseconds:

      <div class="unread-count" up-poll up-interval="10000">
        2 new messages
      </div>

  If the value is omitted, a global default is used. You may configure the default like this:

      up.radio.config.pollInterval = 10000

  \#\#\# Controlling the source URL

  The element will be reloaded from the URL from which it was originally loaded.

  To reload from another URL, set an `[up-source]` attribute on the polling element:

      <div class="unread-count" up-poll up-source="/unread-count">
        2 new messages
      </div>

  @selector [up-poll]
  @param [up-interval]
    The reload interval in milliseconds.

    Defaults to `up.radio.config.pollInterval`.
  @stable
  ###
  up.compiler '[up-poll]', startPolling

  up.on 'up:framework:reset', reset

  config: config
  hungrySelector: hungrySelector
  startPolling: startPolling
  stopPolling: stopPolling
