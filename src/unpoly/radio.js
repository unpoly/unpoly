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

    By default this contains the `[up-hungry]` attribute.

    The configured selectors will be used to find hungry elements in the current page.
    For each matching element a target will be [derived](/target-derivation) from that
    specific element. E.g. when you configure `up.fragment.config.hungrySelectors.push('input')`,
    a given input will be targeted with its derived selector (like `input[name=email]`).

    For this to work hungry elements [must have a derivable target selector](/up-hungry#derivable-target-required).

  @param {number} [config.pollInterval=30000]
    The default [polling](/up-poll) interval in milliseconds.

  @param {Function(number): number} [config.stretchPollInterval]
    Adjusts the given [polling](/up-poll) interval before it is used.

    On a good network connection this returns the given interval unchanged.
    On a [poor connection](/network-issues#low-bandwidth) it returns
    the doubled interval, causing Unpoly to poll at half as frequently.

  @param {boolean|string|Function(Element)} [config.pollEnabled=true]
    Whether Unpoly will follow instructions to poll fragments, like the `[up-poll]` attribute.

    When set to `'auto'` Unpoly will skip polling updates while one of the following applies:

    - The browser tab is in the foreground
    - The fragment's layer is the [frontmost layer](/up.layer.front).

    When set to `true`, Unpoly will always allow polling.

    When set to `false`, Unpoly will never allow polling.

    To enable polling on a case-by-case basis, you may also pass a function that accepts the polling
    fragment and returns `true`, `false` or `'auto'`. As an alternative you may also skip a
    polling update by preventing the `up:fragment:poll` event.

    When an update is skipped due to polling being disabled,
    Unpoly will try to poll again after the configured interval.

  @stable
  */
  const config = new up.Config(() => ({
    hungrySelectors: ['[up-hungry]'],
    pollInterval: 30000,
    stretchPollInterval: (interval) => interval * (up.network.shouldReduceRequests() ? 2 : 1),
    pollEnabled: 'auto',
  }))

  function reset() {
    config.reset()
  }

  function hungrySolutions({ layer, history, origin }) {
    let hungrySelector = config.hungrySelectors.join(', ')
    let hungries = up.fragment.all(hungrySelector, { layer: 'any' })

    return u.filterMap(hungries, (element) => {
      let target = up.fragment.tryToTarget(element, { origin })

      if (!target) {
        up.warn('[up-hungry]', 'Ignoring untargetable fragment %o', element)
        return
      }

      let ifHistory = e.booleanAttr(element, 'up-if-history')
      if (ifHistory && !history) {
        return
      }

      let ifLayer = e.attr(element, 'up-if-layer')
      if (ifLayer !== 'any' && layer !== up.layer.get(element)) {
        return
      }

      return { target, element }
    })
  }

  /*-
  Elements with an `[up-hungry]` attribute are updated whenever the server
  sends a matching element, even if the element isn't [targeted](/targeting-fragments).

  Hungry elements are optional in the same way as `:maybe` targets.
  When an `[up-hungry]` element does not match in the server response, the element will not be updated,
  but no error is thrown.

  ### Use cases

  Common use cases for `[up-hungry]` are elements live in the application layout,
  outside of the fragment that is typically being targeted. Some examples:

  - Unread message counters
  - Notification flashes
  - Page-specific subnavigation
  - [Canonical link elements](https://en.wikipedia.org/wiki/Canonical_link_element) in the `<head>`.

  Instead of explicitly including such elements in every [target selector](/targeting-fragments)
  (e.g. `.content, .flashes:maybe`) we can mark as `[up-hungry]`.
  They will then be added to target selectors automatically.

  ### Derivable target required {#derivable-target-required}

  When an `[up-hungry]` fragment piggy-backs on another fragment update, Unpoly
  will [derive a target selector](/target-derivation) for the hungry element.

  For this to work the hungry element must have an [identifying attribute](/target-derivation#derivation-patterns),
  like an `[id]` or a unique `[class]` attribute.
  When no good target can be derived, the hungry element is excluded from the update.

  ### Behavior with multiple layers

  By default only hungry elements on the targeted layer are updated.
  To match a hungry element when updating *any* layer, set an [`[up-layer=any]`](#up-if-layer) attribute.

  Hungry fragments are not updated for requests that [open a new overlay](#opening-overlays).
  Subsequent requests within that new overlay *do* update hungry fragments.

  ### Disabling

  By default hungry fragments are processed for all updates of the current layer.
  You can control or disable the processing of hungry fragments using one of the following methods:

  - Using an `[up-if-layer]` attribute on the hungry fragment
  - Using an `[up-if-target]` attribute on the hungry fragment
  - Rendering with [`{ useHungry }`](/up.render#options.useHungry) option
  - Setting an [`[up-use-hungry]`](/a-up-follow#up-use-hungry) attribute on the link or form

  @selector [up-hungry]
  @param [up-if-layer='current']
    Only piggy-back on updates for the given [layer](/up.layer).

    By default only hungry elements on the targeted layer are updated.
    To match a hungry element when updating *any* layer, set this attribute to `[up-layer=any]`.

    Even with `[up-layer=any]` hungry elements are only rendered when updating an existing layer.
    Hungry elements are never rendered for responses that [open a new overlay](/opening-overlays).
  @param [up-if-target='*']
    Only piggy-back on updates that swap an element matching the given [target selector](/targeting-fragments).

    For instance, you want to auto-update a [canonical link element](https://en.wikipedia.org/wiki/Canonical_link_element),
    but only if the [main element](/main) was updated:

    ```html
    <link rel="canonical" href="..." up-hungry up-if-target=":main">
    ```

    The hungry element will also be updated when swapping an *ancestor* of an element matching the given target selector.

  @param [up-transition]
    The [animated transition](/a-up-transition) to apply when this element is updated.
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

  ### Controlling the target selector

  A target selector will be [derived](/target-derivation) from the polling element.

  ### Skipping updates on the client

  Client-side code may skip an update by preventing an `up:fragment:poll` event
  on the polling fragment.

  Unpoly will also choose to skip updates under certain conditions,
  e.g. when the browser tab is in the background. See `up.radio.config.pollEnabled` for details.

  When an update is skipped, Unpoly will try to poll again after the configured interval.

  ### Skipping updates on the server

  When polling a fragment periodically we want to avoid rendering unchanged content.
  This saves <b>CPU time</b> and reduces the <b>bandwidth cost</b> for a
  request/response exchange to about 1 KB (1 packet).

  See [Skipping rendering](/skipping-rendering) for more details and examples.

  When an update is skipped, Unpoly will try to poll again after the configured interval.

  ### Stopping polling

  - The fragment from the server response no longer has an `[up-poll]` attribute.
  - Client-side code has called `up.radio.stopPolling()` with the polling element.
  - Polling was [disabled globally](/up.radio.config#config.pollEnabled).

  ### Polling under low bandwidth

  When Unpoly detects a [poor network connection](/network-issues#low-bandwidth),
  the polling frequency is halfed.

  This can be configured in `up.radio.config.stretchPollInterval`.

  @selector [up-poll]
  @param [up-interval]
    The reload interval in milliseconds.

    Defaults to `up.radio.config.pollInterval`.

    Under [low bandiwdth](/network-issues#low-bandwidth) the given interval
    will be scaled through `up.radio.config.stretchPollInterval`.
  @param [up-keep-data]
    [Preserve](/data#preserving-data-through-reloads) the polling fragment's
    [data object](/data) through reloads.
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
