/*-
Passive updates
===============

This package contains functionality to passively receive updates from the server.

@see [up-hungry]
@see [up-poll]

@module up.radio
*/
up.radio = (function() {

  const u = up.util
  const e = up.element

  /*-
  Configures defaults for passive updates.

  @property up.radio.config

  @param {Array<string>} [config.hungrySelectors]
    An array of CSS selectors that is replaced whenever a matching element is found in a response.
    These elements are replaced even when they were not targeted directly.

    By default this contains the [`[up-hungry]`](/up-hungry) attribute.

  @param {number} [config.pollInterval=30000]
    The default [polling](/up-poll] interval in milliseconds.

  @param {boolean|string|Function(Element)} [config.pollEnabled=true]
    Whether Unpoly will follow instructions to poll fragments, like the `[up-poll]` attribute.

    When set to `'auto'` Unpoly will poll if one of the following applies:

    - The browser tab is in the foreground
    - The fragment's layer is the [frontmost layer](/up.layer.front).
    - We should not [avoid optional requests](/up.network.shouldReduceRequests)

    When set to `true`, Unpoly will always allow polling.

    When set to `false`, Unpoly will never allow polling.

    You may also pass a function that accepts the polling fragment and returns `true`, `false` or `'auto'`.

  @stable
  */
  const config = new up.Config(() => ({
    hungrySelectors: ['[up-hungry]'],
    pollInterval: 30000,
    pollEnabled: 'auto'
  }))

  function reset() {
    config.reset()
  }

  function hungrySelector(suffix = '') {
    let withSuffix = config.hungrySelectors.map((selector) => selector + suffix)
    return withSuffix.join(',')
  }

  function hungryElements(layer) {
    let anyLayerSelector = '[up-layer=any]'
    let hungriesOnTargetedLayer = up.fragment.all(hungrySelector(`:not(${anyLayerSelector})`), { layer })
    let hungriesOnAnyLayer = up.fragment.all(hungrySelector(anyLayerSelector), { layer: 'any' })
    return [...hungriesOnTargetedLayer, ...hungriesOnAnyLayer]
  }

  /*-
  Elements with an `[up-hungry]` attribute are updated whenever the server
  sends a matching element, even if the element isn't targeted.

  Use cases for this are unread message counters or notification flashes.
  Such elements often live in the layout, outside of the content area that is
  being replaced.

  @selector [up-hungry]
  @param [up-layer='current']
    For updates on which layer this hungry element should be matched.

    By default only hungry elements on the targeted layer are updated.
    To match a hungry element when updating *any* layer, set this attribute to `[up-layer=any]`.
  @param [up-transition]
    The transition to use when this element is updated.
  @stable
  */

  /*-
  Starts [polling](/up-poll) the given element.

  @function up.radio.startPolling
  @param {Element|jQuery|string} fragment
    The fragment to reload periodically.
  @param {number} options.interval
    The reload interval in milliseconds.

    Defaults to `up.radio.config.pollInterval`.
  @stable
  */
  function startPolling(fragment, options = {}) {
    const interval = (options.interval ?? e.numberAttr(fragment, 'up-interval')) ?? config.pollInterval

    let stopped = false

    let lastRequest = null
    options.onQueued = request => lastRequest = request

    function doReload() {
      // The setTimeout(doReload) callback might already be scheduled
      // before the polling stopped.
      if (stopped) { return; }

      if (shouldPoll(fragment)) {
        u.always(up.reload(fragment, options), doSchedule)
      } else {
        up.puts('[up-poll]', 'Polling is disabled')
        // Reconsider after 10 seconds at most
        doSchedule(Math.min(10 * 1000, interval))
      }
    }

    function doSchedule(delay = interval) {
      // The up.reload().then(doSchedule) callback might already be
      // registered before the polling stopped.
      if (stopped) { return; }

      setTimeout(doReload, delay)
    }

    function destructor() {
      stopped = true;       // Don't execute already-scheduled callbacks
      lastRequest?.abort(); // Abort any pending request
    }

    // up.radio.stopPolling() will emit up:poll:stop to signal cancelation.
    up.on(fragment, 'up:poll:stop', destructor)

    doSchedule()

    return destructor
  }

  /*-
  Stops [polling](/up-poll) the given element.

  @function up.radio.stopPolling
  @param {Element|jQuery|string} fragment
    The fragment to stop reloading.
  @stable
  */
  function stopPolling(element) {
    up.emit(element, 'up:poll:stop')
  }

  function shouldAutoPoll(fragment) {
    return !document.hidden && !up.network.shouldReduceRequests() && up.layer.get(fragment)?.isFront?.()
  }

  function shouldPoll(fragment) {
    return u.evalAutoOption(config.pollEnabled, shouldAutoPoll, fragment)
  }

  /*-
  Elements with an `[up-poll]` attribute are [reloaded](/up.reload) from the server periodically.

  ### Example

  Assume an application layout with an unread message counter.
  You can use `[up-poll]` to refresh the counter every 30 seconds:

  ```html
  <div class="unread-count" up-poll>
    2 new messages
  </div>
  ```

  ### Controlling the reload interval

  You may set an optional `[up-interval]` attribute to set the reload interval in milliseconds:

  ```html
  <div class="unread-count" up-poll up-interval="10000">
    2 new messages
  </div>
  ```

  If the value is omitted, a global default is used. You may configure the default like this:

  ```js
  up.radio.config.pollInterval = 10000
  ```

  ### Controlling the source URL

  The element will be reloaded from the URL from which it was originally loaded.

  To reload from another URL, set an `[up-source]` attribute on the polling element:

  ```html
  <div class="unread-count" up-poll up-source="/unread-count">
    2 new messages
  </div>
  ```

  ### Skipping updates when nothing changed

  When polling a fragment periodically we want to avoid rendering unchanged content.
  This saves <b>CPU time</b> and reduces the <b>bandwidth cost</b> for a
  request/response exchange to **~1 KB**.

  To achieve this, assign `[up-time]` or `[up-etag]` attributes to the fragment you're
  reloading. Unpoly will automatically send these values as `If-Modified-Since` or
  `If-None-Match` headers when reloading.

  @selector [up-poll]
  @param [up-interval]
    The reload interval in milliseconds.

    Defaults to `up.radio.config.pollInterval`.
  @stable
  */
  up.compiler('[up-poll]', startPolling)

  up.on('up:framework:reset', reset)

  return {
    config,
    hungryElements,
    startPolling,
    stopPolling,
  }
})()
