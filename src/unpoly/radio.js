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

  @param {number} [config.pollInterval=30000]
    The default [polling](/up-poll) interval in milliseconds.

  @stable
  */
  const config = new up.Config(() => ({
    hungrySelectors: ['[up-hungry]'],
    pollInterval: 30000,
  }))

  function reset() {
    config.reset()
  }

  // function fullHungrySelector() {
  //   return config.hungrySelectors.join()
  // }

  // function hungryStepsOnOtherLayers({ layer, history, origin }) {
  //   let hungries = up.fragment.all(fullHungrySelector(), { layer: 'any' })
  //   hungries = u.filter(hungries, (element) => {
  //     let ifLayer = e.attr(element, 'up-if-layer')
  //     let elementLayer = up.layer.get(element)
  //     return ifLayer === 'any' && layer !== elementLayer
  //   })
  //   return buildHungrySteps(hungries, { history, origin })
  // }
  //
  // function hungryStepsOnThisLayer({ layer, history, origin }) {
  //   let hungries = up.fragment.all(fullHungrySelector(), { layer })
  //   return buildHungrySteps(hungries, { history, origin })
  // }

  function hungrySteps(renderOptions) {
    let { useHungry, origin, layer } = renderOptions
    let steps = { current: [], other: [] }

    if (!useHungry) return steps

    let hungrySelector = config.hungrySelectors.join()
    // Start by finding hungries on all layers. We will filter them below.
    let hungries = up.fragment.all(hungrySelector, { layer: 'any' })

    for (let element of hungries) {
      let selector = up.fragment.tryToTarget(element, { origin })
      if (!selector) {
        up.warn('[up-hungry]', 'Ignoring untargetable fragment %o', element)
        continue
      }

      let elementLayer = up.layer.get(element)
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

      if (applicableLayers.includes(layer)) {
        let list = layer === elementLayer ? steps.current : steps.other
        list.push(step)
      }

    }

    // Remove nested steps on other layers.
    // Note that `steps.current` is already compressed by up.Change.UpdateLayer once it's been mixed with
    // the explicit target steps. So we're not doing it again here.
    steps.other = up.fragment.compressNestedSteps(steps.other)

    // When multiple steps target the same new selector, we're updating the layer
    // that's closer to the layer of the render pass.
    //
    // In this case two steps will match the same { newElement }. Hence this case is
    // not covered by step compression (which looks at { oldElement }).
    steps.other.sort((leftStep, rightStep) => (layer.index - leftStep.layer.index) - (layer.index - rightStep.layer.index))

    return steps
  }

  // function hungryOptions(element, options, parserOptions) {
  //   let parser = new up.OptionsParser(element, options, parserOptions)
  //   parser.string('ifLayer')
  //   parser.boolean('ifHistory')
  //   parser.include(up.motion.motionOptions)
  //   return options
  // }

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

  To match a hungry element when updating other layers, set an [`[up-if-layer]`](#up-if-layer) attribute.

  An element can only be rendered once per render pass.
  If an element has already been rendered into a layer, it will cannot be matched again
  by an `[up-hungry]` element on another layer.

  ### Disabling

  By default hungry fragments are processed for all updates of the current layer.
  You can disable the processing of hungry fragments using one of the following methods:

  - Rendering with an [`{ useHungry: false }`](/up.render#options.useHungry) option will not process any hungry fragments.
  - Setting an [`[up-use-hungry="false"]`](/a-up-follow#up-use-hungry) attribute on a link or form will not update hungry fragments when the element is activated.
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
  @param {number} [options.interval]
    The reload interval in milliseconds.

    Defaults to `up.radio.config.pollInterval`.
  @param {string} [options.url]
    The URL from which to reload the fragment.

    Defaults to the closest `[up-source]` attribute of an ancestor element.
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
    const parser = new up.OptionsParser(fragment, options)
    parser.number('interval', { default: config.pollInterval })
    parser.string('ifLayer', { default: 'front' })
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

  ### Skipping updates on the client

  Client-side code may skip an update by preventing an `up:fragment:poll` event
  on the polling fragment.

  Polling will pause while the browser tab is hidden.
  When the browser tab is re-activated, polling will resume.

  By default polling will pause while the fragment's [layer](/up.layer) is covered by an overlay.
  When the layer is uncovered, polling will resume.
  To keep polling on background layers, set [`[up-if-layer=any]`](#up-if-layer).

  ### Skipping updates on the server

  When polling a fragment periodically we want to avoid rendering unchanged content.
  This saves <b>CPU time</b> and reduces the <b>bandwidth cost</b> for a
  request/response exchange to about 1 KB (1 packet).

  See [Skipping rendering](/skipping-rendering) for more details and examples.

  When an update is skipped, Unpoly will try to poll again after the configured interval.

  ### Stopping polling

  There are two reasons for polling to stop:

  - The fragment from the server response no longer has an `[up-poll]` attribute.
  - Client-side code has called `up.radio.stopPolling()` with the polling element.

  @selector [up-poll]
  @param [up-interval]
    The reload interval in milliseconds.

    Defaults to `up.radio.config.pollInterval`.
  @param [up-if-layer='front']
    Controls polling while the fragment's [layer](/up.layer) is covered by an overlay.

    When set to `'front'`, polling will pause while the fragment's layer is covered by an overlay.
    When the fragment's layer is uncovered, polling will resume.

    When set to `'any'`, polling will continue on background layers.

    @experimental
  @param [up-keep-data]
    [Preserve](/data#preserving-data-through-reloads) the polling fragment's
    [data object](/data) through reloads.

    @experimental
  @param [up-source]
    The URL from which to reload the fragment.

    Defaults to the closest `[up-source]` attribute of an ancestor element.
  @stable
  */
  up.compiler('[up-poll]', function(fragment) {
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
    Prevents the fragment from being reloaded.
  @experimental
  */

  /*-
  TODO

  @selector [up-flashes]
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

  /*-
  TODO: Docs

  @selector [up-flashes]
  @param [up-transition]
  @param [up-duration]
  @param [up-easing]
  */

  up.on('up:framework:reset', reset)

  return {
    config,
    hungrySteps,
    startPolling,
    stopPolling,
    pollOptions,
  }
})()
