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

  /*-
  Configures defaults for passive updates.

  @property up.radio.config

  @param {Array<string>} [config.hungrySelectors]
    An array of CSS selectors that is replaced whenever a matching element is found in a response.
    These elements are replaced even when they were not targeted directly.

    By default this contains the [`[up-hungry]`](/up-hungry) attribute.

  @param {number} [config.pollInterval=30000]
    The default [polling](/up-poll] interval in milliseconds.

  @param {Function(number): number} [config.pollIntervalScale]
    TODO: Docs

  @param {boolean|string|Function(Element)} [config.pollEnabled=true]
    Whether Unpoly will follow instructions to poll fragments, like the `[up-poll]` attribute.

    When set to `'auto'` Unpoly will skip polling updates while one of the following applies:

    - The browser tab is in the foreground
    - The fragment's layer is the [frontmost layer](/up.layer.front).
    - We should not [avoid optional requests](/up.network.shouldReduceRequests)

    When set to `true`, Unpoly will always allow polling.

    When set to `false`, Unpoly will never allow polling.

    You may also pass a function that accepts the polling fragment and returns `true`, `false` or `'auto'`.

    When an update is skipped due to polling being disabled,
    Unpoly will try to poll again after the configured interval.

  @stable
  */
  const config = new up.Config(() => ({
    hungrySelectors: ['[up-hungry]'],
    pollInterval: 30000,
    pollIntervalScale: (interval) => interval * (up.network.shouldReduceRequests() ? 2 : 1),
    pollEnabled: 'auto',
  }))

  function reset() {
    config.reset()
  }

  function hungrySelector(suffix = '') {
    let withSuffix = config.hungrySelectors.map((selector) => selector + suffix)
    return withSuffix.join(',')
  }

  function hungrySolutions(layer) {
    let anyLayerSelector = '[up-layer=any]'
    let hungriesOnTargetedLayer = up.fragment.all(hungrySelector(`:not(${anyLayerSelector})`), { layer })
    let hungriesOnAnyLayer = up.fragment.all(hungrySelector(anyLayerSelector), { layer: 'any' })
    let hungries = hungriesOnTargetedLayer.concat(hungriesOnAnyLayer)
    return u.filterMap(hungries, (element) => {
      let target = up.fragment.tryToTarget(element)
      if (target) {
        return { target, element }
      } else {
        up.warn('[up-hungry]', 'Ignoring untargetable fragment %o', element)
      }
    })
  }

  /*-
  Elements with an `[up-hungry]` attribute are updated whenever the server
  sends a matching element, even if the element isn't targeted.

  Use cases for this are unread message counters or notification flashes.
  Such elements often live in the layout, outside of the content area that is
  being replaced.

  When an `[up-hungry]` element does not match in the server response,
  the element will not be updated.

  @selector [up-hungry]
  @param [up-layer='current']
    For updates on which layer this hungry element should be matched.

    By default only hungry elements on the targeted layer are updated.
    To match a hungry element when updating *any* layer, set this attribute to `[up-layer=any]`.

    Even with `[up-layer=any]` hungry elements are only rendered when an
    existing [layer](/up.layer) is updated. Hungry elements are never rendered
    for responses that [open a new overlay](/opening-overlays).
  @param [up-transition]
    The transition to use when this element is updated.
  @stable
  */

  /*-
  Starts [polling](/up-poll) the given element.

  The given element does not need an `[up-poll]` attribute.

  @function up.radio.startPolling
  @param {Element} fragment
    The fragment to reload periodically.
  @param {number} options.interval
    The reload interval in milliseconds.

    Defaults to `up.radio.config.pollInterval`.
  @param {string} options.url
    Defaults to the element's closest `[up-source]` attribute.
  @stable
  */
  function startPolling(fragment, options = {}) {
    up.FragmentPolling.forFragment(fragment).forceStart(options)
  }

  /*-
  Stops [polling](/up-poll) the given element.

  @function up.radio.stopPolling
  @param {Element} fragment
    The fragment to stop reloading.
  @stable
  */
  function stopPolling(element) {
    up.FragmentPolling.forFragment(element).forceStop()
  }

  function pollIssue(fragment) {
    let enabled = config.pollEnabled

    if (enabled === false) {
      return 'User has disabled polling'
    }

    if (enabled === 'auto') {
      if (document.hidden) {
        return 'Tab is hidden'
      }

      if (!up.layer.get(fragment)?.isFront?.()) {
        return 'Fragment is on a background layer'
      }
    }

    if (up.emit(fragment, 'up:fragment:poll', { log: ['Polling fragment', fragment] }).defaultPrevented) {
      return 'User prevented up:fragment:poll event'
    }
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

  ### Skipping updates on the client

  Client-side code may skip an update by preventing an `up:fragment:poll` event
  on the polling fragment.

  Unpoly will also choose to skip updates under certain conditions,
  e.g. when the browser tab is in the background. See `up.radio.config.pollEnabled` for details.

  When an update is skipped, Unpoly will try to poll again after the configured interval.

  ### Skipping updates on the server

  When polling a fragment periodically we want to avoid rendering unchanged content.
  This saves <b>CPU time</b> and reduces the <b>bandwidth cost</b> for a
  request/response exchange to **~1 KB**.

  To achieve this, assign `[up-time]` or `[up-etag]` attributes to the fragment you're
  reloading. Unpoly will automatically send these values as `If-Modified-Since` or
  `If-None-Match` headers when reloading.

  If the server has no more recent changes, it may skip the update by responding
  with an HTTP status `304 Not Modified`.

  When an update is skipped, Unpoly will try to poll again after the configured interval.

  ### Stopping polling

  - The fragment from the server response no longer has an `[up-poll]` attribute.
  - Client-side code has called `up.radio.stopPolling()` with the polling element.
  - Polling was [disabled globally](/up.radio.config#config.pollEnabled).

  @selector [up-poll]
  @param [up-interval]
    The reload interval in milliseconds.

    Defaults to `up.radio.config.pollInterval`.
  @param [up-source]
    The URL from which to reload the fragment.

    Defaults to the closest `[up-source]` attribute of an ancestor element.
  @stable
  */
  up.compiler('[up-poll]', function(fragment) {
    if (!up.fragment.isTargetable(fragment)) {
      up.warn('[up-poll]', 'Ignoring untargetable fragment %o', fragment)
      return
    }

    up.FragmentPolling.forFragment(fragment).onPollAttributeObserved()
  })

  /*-
  This event is emitted before a [polling](/up-poll) fragment is reloaded from the server.

  Listener may prevent the `up:fragment:poll` event to prevent the fragment from being reloaded.
  Preventing the event will only skip a single update. It will *not* stop future polling.

  @event up:fragment:poll
  @param {Element} event.target
    The polling fragment.
  @param event.preventDefault()
    Event listeners may call this method to prevent the fragment from being reloaded.
  @experimental
  */

  up.on('up:framework:reset', reset)

  return {
    config,
    hungrySolutions,
    startPolling,
    stopPolling,
    pollIssue,
  }
})()
