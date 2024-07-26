/*-
Passive updates
===============

This package contains functionality to passively receive updates from the server.

@see flashes

@see [up-hungry]
@see [up-poll]

@module up.radio
*/
up.radio = (function() {

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
    specific element. E.g. when you configure `up.radio.config.hungrySelectors.push('input')`,
    a given input will be targeted with its derived selector (like `input[name=email]`).

    For this to work hungry elements [must have a derivable target selector](/up-hungry#derivable-target-required).

  @param {Array<string>} [config.noHungrySelectors=['[up-hungry=false]']]
    Exceptions to `up.radio.config.hungrySelectors`.

  @param {number} [config.pollInterval=30000]
    The default [polling](/up-poll) interval in milliseconds.

  @stable
  */
  const config = new up.Config(() => ({
    hungrySelectors: ['[up-hungry]'],
    noHungrySelectors: ['[up-hungry=false]'],
    pollInterval: 30000,
  }))

  function hungrySteps(renderOptions) {
    let { useHungry, origin, layer: renderLayer } = renderOptions
    let steps = { current: [], other: [] }

    if (!useHungry) return steps

    let hungrySelector = config.selector('hungrySelectors')

    // When multiple steps target the same new selector, we're updating the layer
    // that's closer to the layer of the render pass.
    //
    // In this case two steps will match the same { newElement }. Hence this case is
    // not covered by step compression (which looks at { oldElement }).
    const layerPreference = [renderLayer, ...renderLayer.ancestors, ...renderLayer.descendants]

    for (let elementLayer of layerPreference) {
      let hungries = up.fragment.all(elementLayer.element, hungrySelector, { layer: elementLayer })

      for (let element of hungries) {
        let selector = up.fragment.tryToTarget(element, { origin })
        if (!selector) {
          up.warn('[up-hungry]', 'Ignoring untargetable fragment %o', element)
          continue
        }

        let ifLayer = e.attr(element, 'up-if-layer')
        let applicableLayers = ifLayer ? up.layer.getAll(ifLayer, { baseLayer: elementLayer }) : [elementLayer]

        let motionOptions = up.motion.motionOptions(element)

        // We cannot emit up:fragment:hungry here as we don't know { newElement } yet.
        let selectEvent = up.event.build('up:fragment:hungry', { log: false })
        let selectCallback = e.callbackAttr(element, 'up-on-hungry', { exposedKeys: ['newFragment', 'renderOptions'] })

        let step = {
          selector,            // The selector for a single step is { selector }
          oldElement: element, // The match on the current page
          layer: elementLayer, // May be different from { layer } when we found an [up-hungry][up-if-layer=any]
          origin,              // The { origin } passed into the fn. will be used to match { newElement } later.
          ...motionOptions,    // The hungry element defines its own transition, duration, easing.
          placement: 'swap',   // Hungry elements are always swapped, never appended
          useKeep: true,       // Always honor [up-keep] in hungry elements. Set here because we don't inherit default render options.
          maybe: true,         // Don't fail if we cannot match { newElement } later.
          selectEvent,         // Used by up.ResponseDoc#selectStep()
          selectCallback,      // Used by up.ResponseDoc#selectStep()
          // The step also gets a reference to the original render options.
          // Although these render options are not used to render the hungry step, it will be
          // passed to up:fragment:hungry listener to e.g. only update hungry elements if the
          // original render pass would update history.
          originalRenderOptions: renderOptions,
        }

        if (applicableLayers.includes(renderLayer)) {
          let list = renderLayer === elementLayer ? steps.current : steps.other
          list.push(step)
        }
      }

    }

    // Remove nested steps on other layers.
    // Note that `steps.current` is already compressed by up.Change.UpdateLayer once it's been mixed with
    // the explicit target steps. So we're not doing it again here.
    steps.other = up.fragment.compressNestedSteps(steps.other)

    return steps
  }

  /*-
  Before an `[up-hungry]` is added to a render pass, a event `up:fragment:hungry` is emitted on the element.

  ### Preventing hungry elements from being updated

  You may prevent the `up:fragment:hungry` event to exclude an hungry element from the render pass.
  Use this to define arbitrary conditions for when an hungry element should be updated.

  For example, the following would update an hungry element only for render passes that [update history](/updating-history):

  ```js
  element.addEventListener('up:fragment:hungry', function(event) {
    if (!event.renderOptions.history) event.preventDefault()
  })
  ```

  You may also define conditions based on the *new* element that a hungry element would be swapped with.
  The following would skip an update if the new element has a class `.is-empty`:

  ```js
  element.addEventListener('up:fragment:hungry', function(event) {
    if (event.newFragment.classList.contains('is-empty')) {
      event.preventDefault()
    }
  })
  ```

  @event up:fragment:hungry
  @param {Element} event.target
    The hungry element that is about to be swapped.
  @param {Element} event.newFragment
    The fragment in the new content that this hungry element would be swapped with.
  @param {Object} event.renderOptions
    The [render options](/up.render#parameters) for the current render pass.
  @param event.preventDefault()
    Prevents the hungry element from being targeted in the current render pass.
  @experimental
  */

  /*-
  Elements with an `[up-hungry]` attribute are updated whenever the server
  sends a matching element, even if the element isn't [targeted](/targeting-fragments).

  Hungry elements are optional in the same way as `:maybe` targets.
  When an `[up-hungry]` element does not match in the server response, the element will not be updated,
  but no error is thrown.

  ### Use cases

  Common use cases for `[up-hungry]` are elements that live in the application layout,
  outside of the fragment that is typically being targeted. Examples include:

  - Unread message counters
  - Page-specific subnavigation
  - Account-wide notifications (e.g. about an expired credit card)

  Instead of explicitly including such elements in every [target selector](/targeting-fragments)
  (e.g. `.content, .unread-messages:maybe`) we can mark the element as `[up-hungry]`:

  ```html
  <div class="unread-messages" up-hungry>
    You have no unread messages
  </div>
  ```

  An selector for the hungry element (`.unread-messages`) will be added to target selectors automatically.

  ### Derivable target required {#derivable-target-required}

  When an `[up-hungry]` fragment piggy-backs on another fragment update, Unpoly
  will [derive a target selector](/target-derivation) for the hungry element.

  For this to work the hungry element must have an [identifying attribute](/target-derivation#derivation-patterns),
  like an `[id]` or a unique `[class]` attribute.
  When no good target can be derived, the hungry element is excluded from the update.

  ### Behavior with multiple layers

  By default only hungry elements on the targeted [layer](/up.layer) are updated.

  To match a hungry element when updating other layers, set an [`[up-if-layer]`](#up-if-layer) attribute.
  For example, a hungry element with `[up-if-layer="subtree"]` will piggy-back on render passes for both
  its own layer and any overlay covering it.

  ### Conflict resolution

  When Unpoly renders new content, each element in that content can only be inserted once.
  When multiple hungry elements conflict with each other or with the the [primary render target](/targeting-fragments),
  that conflict is resolved using the following rules:

  1. When both a [target selector](/targeting-fragments) and a hungry elements target the same fragment in the response, only the direct render target will be updated.
  2. When hungry elements are nested within each other, the outmost fragment will be updated. Note that we recommend to not over-use the hungry mechanism, and prefer to explicit render targets instead.
  3. When hungry elements on different layers target the same fragment in the response,
     the layer closest to the rendering layer will be chosen.

  ### Disabling

  By default hungry fragments are processed for all updates of the current layer.
  You can disable the processing of hungry fragments using one of the following methods:

  - Rendering with an [`{ useHungry: false }`](/up.render#options.useHungry) option will not process any hungry fragments.
  - Setting an [`[up-use-hungry="false"]`](/up-follow#up-use-hungry) attribute on a link or form will not update hungry fragments when the element is activated.
  - Preventing an `up:fragment:hungry` event will prevent the hungry fragment
    from being updated.
  - Calling `event.preventDefault()` in an `[up-on-hungry]` attribute handler will prevent the hungry fragment
    from being updated.

  @selector [up-hungry]
  @param [up-if-layer='current']
    Only piggy-back on updates on [layers](/up.layer) that match the given [layer reference](/layer-option).

    Relative references like `'parent'` or `'child'` will be resolved in relation to the hungry element's layer.

    To match a hungry element when updating one of multiple layers, separate the references using and `or` delimiter.
    For example, `'current or child'` will match for updates on either the hungry element's layer, or
    its direct child.

    To match a hungry element when updating *any* layer, set this attribute to `'any'`.
  @param [up-on-hungry]
    Code to run before this element is included in a fragment update.

    Calling `event.preventDefault()` will prevent the hungry fragment
    from being updated.

    For instance, you want to auto-update an hungry navigation bar,
    but only if we're changing history entries:

    ```html
    <nav id="side-nav" up-hungry up-on-hungry="if (!renderOptions.history) event.preventDefault()">
     ...
    </nav>
    ```

    The code may use the variables `event` (of type `up:fragment:hungry`),
    `this` (the hungry element), `newFragment` and `renderOptions`.

  @param [up-transition]
    The [animated transition](/a-up-transition) to apply when this element is updated.
  @param [up-duration]
    The duration of the transition or animation (in millisconds).

  @param [up-easing]
    The timing function that accelerates the transition or animation.

    See [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
    for a list of available timing functions.
  @stable
  */

  /*-
  Starts [polling](/up-poll) the given element.

  The given element does not need an `[up-poll]` attribute.

  @function up.radio.startPolling
  @param {Element} fragment
    The fragment to reload periodically.
  @param {Object} [options]
    Options for reloading the fragment.

    By default Unpoly will parse options from the fragment's attributes like ([`[up-interval]`](/up-poll#up-interval)).
    You may pass this additional options object to [supplement or override](/attributes-and-options#options) options parsed from the fragment's attributes.
  @param {number} [options.interval]
    The reload interval in milliseconds.

    Defaults to `up.radio.config.pollInterval`.
  @param {string} [options.url]
    The URL from which to reload the fragment.

    Defaults to the URL this fragment was [originally loaded from](/up-source).
  @param {string} [options.method='get']
    The HTTP method used to reload the fragment.

    @experimental
  @param {string} [options.headers={}]
    A JSON object with additional request headers.
  @param {string} [options.params={}]
    A JSON object with additional [parameters](/up.Params) that should be sent as the request's
    [query string](https://en.wikipedia.org/wiki/Query_string) or payload.

    When making a `GET` request to a URL with a query string, the given `{ params }` will be added
    to the query parameters.
  @param [options.keepData=false]
    Whether to [preserve](/data#preserving-data-through-reloads) the polling fragment's
    [data object](/data) through reloads.

    @experimental
  @param {string} [options.ifLayer='front']
    Controls polling while the fragment's [layer](/up.layer) is covered by an overlay.

    When set to `'front'`, polling will pause while the fragment's layer is covered by an overlay.
    When the fragment's layer is uncovered, polling will resume.

    When set to `'any'`, polling will continue on background layers.

    @experimental
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

  function pollOptions(fragment, options = {}) {
    const defaults = { background: true }
    const parser = new up.OptionsParser(fragment, options, { defaults })
    parser.number('interval', { default: config.pollInterval })
    parser.string('ifLayer', { default: 'front' })
    parser.include(up.link.requestOptions)
    return options
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

  ### Polling is paused in the background

  By default polling will pause while the fragment's [layer](/up.layer) is covered by an overlay.
  When the layer is uncovered, polling will resume.
  To keep polling on background layers, set [`[up-if-layer=any]`](#up-if-layer).

  Polling will also pause automatically while the browser tab is hidden.
  When the browser tab is re-activated, polling will resume.

  When at least one poll interval was spent paused in the background and the user
  then returns to the layer or tab, Unpoly will immediately reload the fragment.
  You can use this to load recent data when the user returns to your app after working on something else for a while. For example, the following
  would reload your [main](/main) element after an absence of 5 minutes or more:

  ```html
  <main up-poll up-interval="300_000">
    ...
  </main>
   ```

  ### Skipping updates on the client

  Client-side code may skip an update by preventing an `up:fragment:poll` event
  on the polling fragment.


  ### Skipping updates on the server

  When polling a fragment periodically we want to avoid rendering unchanged content.
  This saves <b>CPU time</b> and reduces the <b>bandwidth cost</b> for a
  request/response exchange to about 1 KB (1 packet).

  See [Skipping rendering](/skipping-rendering) for more details and examples.

  When an update is skipped, Unpoly will try to poll again after the configured interval.

  ### Stopping polling

  There are multiple ways to stop the polling interval:

  - The fragment from the server response no longer has an `[up-poll]` attribute.
  - The fragment from the server response has an `[up-poll="false"]` attribute.
  - Client-side code has called `up.radio.stopPolling()` with the polling element.

  @selector [up-poll]
  @param [up-interval]
    The reload interval in milliseconds.

    Defaults to `up.radio.config.pollInterval`, which defaults to 30 seconds.
  @param [up-href]
    The URL from which to reload the fragment.

    Defaults to the URL this fragment was [originally loaded from](/up-source).
  @param [up-method='get']
    The HTTP method used to reload the fragment.

    @experimental
  @param [up-headers]
    A JSON object with additional request headers.
  @param [up-params]
    A JSON object with additional [parameters](/up.Params) that should be sent as the request's
    [query string](https://en.wikipedia.org/wiki/Query_string) or payload.

    When making a `GET` request to a URL with a query string, the given `{ params }` will be added
    to the query parameters.
  @param [up-keep-data]
    Whether to [preserve](/data#preserving-data-through-reloads) the polling fragment's
    [data object](/data) through reloads.

    @experimental
  @param [up-if-layer='front']
    Controls polling while the fragment's [layer](/up.layer) is covered by an overlay.

    When set to `'front'`, polling will pause while the fragment's layer is covered by an overlay.
    When the fragment's layer is uncovered, polling will resume.

    When set to `'any'`, polling will continue on background layers.

    @experimental
  @stable
  */
  up.attribute('up-poll', function(fragment) {
    up.FragmentPolling.forFragment(fragment).onPollAttributeObserved()
  })

  /*-
  This event is emitted before a [polling](/up-poll) fragment is reloaded from the server.

  Listener may prevent the `up:fragment:poll` event to prevent the fragment from being reloaded.
  Preventing the event will only skip a single update. It will *not* stop future polling.

  @event up:fragment:poll
  @param {Element} event.target
    The polling fragment.
  @param {Object} event.renderOptions
    An object with [render options](/up.render#parameters) for the render pass that reloads the polling fragment.

    Listeners may inspect and modify these options.
  @param event.preventDefault()
    Prevents the fragment from being reloaded.
  @experimental
  */

  /*-
  Use an `[up-flashes]` element to show confirmations, alerts or warnings.

  ![A confirmation flash, an error flash and a warning flash](images/flashes.png){:width='480'}

  You application layout should have an empty `[up-flashes]` element to indicate where flash messages
should be inserted:

  ```html
  <nav>
    Navigation items ...
  </nav>
  <div up-flashes></div> <!-- mark-line -->
  <main>
    Main page content ...
  </main>
  ```

  To render a flash message, include an `[up-flashes]` element in your response.
  The element's content should be the messages you want to render:

  ```html
  <div up-flashes>
    <strong>User was updated!</strong>
  </div>

  <main>
    Main response content ...
  </main>
  ```

  See [notification flashes](/flashes) for more details and examples.

  @selector [up-flashes]
  @param [up-transition]
    The name of a [transition](/up.motion) to morph between the old and new notification flashes.
  @param [up-duration]
    The duration of the transition (in millisconds).

  @param [up-easing]
    The timing function that accelerates the transition.

    See [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
    for a list of available timing functions.
  @experimental
  */
  up.macro('[up-flashes]', function(fragment) {
    e.setMissingAttrs(fragment, {
      'up-hungry': '',
      'up-if-layer': 'subtree',
      'up-keep': '',
      'role': 'alert',
    })

    fragment.addEventListener('up:fragment:keep', function(event) {
      if (!e.isEmpty(event.newFragment)) event.preventDefault()
    })
  })

  return {
    config,
    hungrySteps,
    startPolling,
    stopPolling,
    pollOptions,
  }
})()
