require('./layer.sass')

const u = up.util
const e = up.element

/*-
Layers
======

Unpoly allows you to [open page fragments in an overlay](/opening-overlays). Overlays may be stacked infinitely.

A variety of [overlay modes](/layer-terminology) are supported,
such as modal dialogs, popup overlays or drawers. You may [customize their appearance and behavior](/customizing-overlays).

Layers are isolated, meaning a screen in one layer will not accidentally see elements
or events from another layer. For instance, [fragment links](/up.link) will only update elements from the [current layer](/up.layer.current)
unless you [explicitly target another layer](/layer-option).

Overlays allow you to break up a complex screen into [subinteractions](/subinteractions).
Subinteractions take place in overlays and may span one or many pages while the original screen remains open in the background.
Once the subinteraction is *done*, the overlay is closed and a result value is communicated back to the parent layer.

@see layer-terminology
@see layer-option
@see opening-overlays
@see closing-overlays
@see subinteractions
@see customizing-overlays
@see context

@see [up-layer=new]
@see up.layer.current
@see up.layer.on
@see up.layer.ask

@module up.layer
*/
up.layer = (function() {

  const LAYER_CLASSES = [
    up.Layer.Root,
    up.Layer.Modal,
    up.Layer.Popup,
    up.Layer.Drawer,
    up.Layer.Cover
  ]

  /*-
  Configures default attributes for new overlays.

  All options for `up.layer.open()` may be configured.
  The configuration will also be used for `[up-layer=new]` links.

  Defaults are configured separately for each [layer mode](/layer-terminology):

  | Object                    | Effect                       |
  |---------------------------|------------------------------|
  | `up.layer.config.root`    | Defaults for the root layer  |
  | `up.layer.config.modal`   | Defaults for modal overlays  |
  | `up.layer.config.drawer`  | Defaults for drawer overlays |
  | `up.layer.config.popup`   | Defaults for popup overlays  |
  | `up.layer.config.cover`   | Defaults for cover overlays  |

  For convenience you may configure options that affect all layer modes
  or all overlay modes:

  | Object                    | Effect                       |
  |---------------------------|------------------------------|
  | `up.layer.config.any`     | Defaults for all layers      |
  | `up.layer.config.overlay` | Defaults for all overlays    |

  Options configured in such a way are inherited.
  E.g. when you open a new drawer overlay, defaults from `up.layer.config.drawer`,
  `up.layer.config.overlay` and `up.layer.config.any` will be used (in decreasing priority).

  ### Example

  To make all modal overlays move in from beyond the top edge of the screen:

  ```js
  up.layer.config.modal.openAnimation = 'move-from-top'
  ```

  To configure an additional [main target](/up-main)
  for overlay of any mode:

  ```js
  up.layer.config.overlay.mainTargets.unshift('.content')
  ```

  ### Configuration inheritance

  @property up.layer.config

  @param {string} [config.mode='modal']
    The default [mode](/layer-terminology) used when opening a new overlay.

  @param {Object} config.any
    Defaults for all layer modes.

  @param {Array<string>} config.any.mainTargets
    An array of CSS selectors matching default [render targets](/targeting-fragments).

    This is an alias for `up.fragment.config.mainTargets`.

  @param {Object} config.root
    Defaults for the [root layer](/layer-terminology).

    Inherits from `up.layer.config.any`.

  @param {Object} config.root.mainTargets
    An array of CSS selectors matching default [render targets](/targeting-fragments)
    for the [root layer](/layer-terminology), but not for overlays.

  @param {Object} config.overlay
    Defaults for all [overlays](/layer-terminology).

    In addition to the options documented here,
    all options for `up.layer.open()` may also be configured.

    Inherits from `up.layer.config.any`.

  @param {string|Function} config.overlay.openAnimation
    The opening animation.

  @param {number} config.overlay.openDuration
    The duration of the opening animation.

  @param {string} config.overlay.openEasing
    The easing function for the opening animation.

  @param {string|Function} config.overlay.closeAnimation
    The closing animation.

  @param {number} config.overlay.closeDuration
    The duration of the closing animation.

  @param {string} config.overlay.closeEasing
    The easing function for the opening animation.

  @param {string} config.overlay.dismissLabel
    The symbol for the dismiss icon in the top-right corner.

  @param {string} config.overlay.dismissAriaLabel
    The accessibility label for the dismiss icon in the top-right corner.

  @param {string|boolean} [config.overlay.history='auto']
    Whether the layer's location or title will be visible in the browser's
    address bar and window title.

    If set to `'auto'`, the overlay will render history if its initial fragment
    is an [auto history target](/up.fragment.config#config.autoHistoryTargets).

    If set to `true`, the overlay will always render history.
    If set to `false`, the overlay will never render history.

  @param {string} [config.overlay.class]
    An HTML class for the overlay's container element.

    See [overlay classes](/customizing-overlays#overlay-classes).

  @param {Object} config.modal
    Defaults for [modal overlays](/layer-terminology).

    Inherits from `up.layer.config.overlay` and `up.layer.config.any`.

  @param {Object} config.cover
    Defaults for [cover overlays](/layer-terminology).

    Inherits from `up.layer.config.overlay` and `up.layer.config.any`.

  @param {Object} config.drawer
    Defaults for [drawer overlays](/layer-terminology).

    Inherits from `up.layer.config.overlay` and `up.layer.config.any`.

  @param {Object} config.popup
    Defaults for [popup overlays](/layer-terminology).

    Inherits from `up.layer.config.overlay` and `up.layer.config.any`.

  @param {Array<string>} config.foreignOverlaySelectors
    An array of CSS selectors matching overlays not constructed by Unpoly.

    Other JavaScript libraries often attach their overlay elements
    to the end of the `<body>`, which makes Unpoly consider these overlays
    to be part of the root layer. This can cause Unpoly to steal focus from foreign
    overlays, or cause Unpoly overlays to incorrectly close when the foreign overlay is clicked.
    Adding a selector to this array will cause Unpoly to
    be less opinionated about user interactions within matching elements.

    By default this contains a selector matching the
    [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) element.

  @stable
  */
  const config = new up.Config(function() {
    const newConfig = {
      mode: 'modal',
      any: {
        mainTargets: [
          "[up-main='']",
          'main',
          ':layer' // this is <body> for the root layer
        ]
      },
      root: {
        mainTargets: ['[up-main~=root]'],
        history: true
      },
      overlay: {
        mainTargets: ['[up-main~=overlay]'],
        openAnimation: 'fade-in',
        closeAnimation: 'fade-out',
        dismissLabel: '×',
        dismissAriaLabel: 'Dismiss dialog',
        dismissable: true,
        history: 'auto'
      },
      cover: {
        mainTargets: ['[up-main~=cover]']
      },
      drawer: {
        mainTargets: ['[up-main~=drawer]'],
        backdrop: true,
        position: 'left',
        size: 'medium',
        openAnimation(layer) {
          switch (layer.position) {
            case 'left': return 'move-from-left'
            case 'right': return 'move-from-right'
          }
        },
        closeAnimation(layer) {
          switch (layer.position) {
            case 'left': return 'move-to-left'
            case 'right': return 'move-to-right'
          }
        }
      },
      modal: {
        mainTargets: ['[up-main~=modal]'],
        backdrop: true,
        size: 'medium'
      },
      popup: {
        mainTargets: ['[up-main~=popup]'],
        position: 'bottom',
        size: 'medium',
        align: 'left',
        dismissable: 'outside key'
      },
      foreignOverlaySelectors: ['dialog']
    }

    for (let Class of LAYER_CLASSES) {
      newConfig[Class.mode].Class = Class
    }

    return newConfig
  })

  /*-
  A list of layers that are currently open.

  The first element in the list is the [root layer](/up.layer.root).
  The last element is the [frontmost layer](/up.layer.front).

  @property up.layer.stack
  @param {List<up.Layer>} stack
  @stable
  */
  let stack = null

  let handlers = []

  function mainTargets(mode) {
    return u.flatMap(modeConfigs(mode), 'mainTargets')
  }

  /*
  Returns an array of config objects that apply to the given mode name.

  The config objects are in descending order of specificity.
  */
  function modeConfigs(mode) {
    if (mode === 'root') {
      return [config.root, config.any]
    } else {
      return [config[mode], config.overlay, config.any]
    }
  }

  function normalizeLayerOption(options) {
    if (options.layer instanceof up.Layer) return

    up.migrate.handleLayerOptions?.(options)

    if (u.isGiven(options.layer)) { // might be the number 0, which is falsy
      let match = String(options.layer).match(/^(new|shatter|swap)( (\w+))?/)
      if (match) {
        options.layer = 'new'

        const openMethod = match[1]
        const shorthandMode = match[3]

        // The mode may come from one of these sources:
        // (1) As { mode } option
        // (2) As a { layer } short hand like { layer: 'new popup' }
        // (3) As the default in config.mode
        options.mode ||= shorthandMode || config.mode

        if (openMethod === 'swap') {
          // If an overlay is already open, we replace that with a new overlay.
          // If we're on the root layer, we open an overlay.
          if (up.layer.isOverlay()) {
            options.baseLayer = 'parent'
          }
        } else if (openMethod === 'shatter') {
          // Dismiss all overlays and open a new overlay.
          options.baseLayer = 'root'
        }
      }
    // If no options.layer is given we still want to avoid updating "any" layer.
    // Other options might have a hint for a more appropriate layer.
    } else if (options.mode) {
      // If user passes a { mode } option without a { layer } option
      // we assume they want to open a new layer.
      options.layer = 'new'
    } else if (u.isElementLike(options.target)) {
      // If we are targeting an actual Element or jQuery collection (and not
      // a selector string) we operate in that element's layer.
      options.layer = stack.get(options.target, { normalizeLayerOptions: false })
    } else if (options.origin) {
      // Links update their own layer by default.
      options.layer = 'origin'
    } else {
      // If nothing is given, we assume the current layer
      options.layer = 'current'
    }
  }

  function setBaseLayerOption(options) {
    if (options.baseLayer instanceof up.Layer) return

    // Remember the layer that was current when the request was made,
    // so changes with `{ layer: 'new' }` will know what to stack on.
    // Note if options.baseLayer is given, up.layer.get('current', options) will
    // return the resolved version of that.
    options.baseLayer = stack.get('current', { ...options, normalizeLayerOptions: false })
  }

  function normalizeOptions(options) {
    normalizeLayerOption(options)
    options.context ??= {}
    setBaseLayerOption(options)
  }

  function build(options, beforeNew) {
    const { mode } = options
    const { Class } = config[mode]

    // modeConfigs() returns the most specific options first,
    // but in merge() below later args override keys from earlier args.
    const configs = u.reverse(modeConfigs(mode))

    let handleDeprecatedConfig = up.migrate.handleLayerConfig
    if (handleDeprecatedConfig) {
      configs.forEach(handleDeprecatedConfig)
    }

    // We allow to pass the open animation as up.layer.open({ animation })
    // or a[up-animation] options.
    options.openAnimation ??= u.pluckKey(options, 'animation')

    options = u.mergeDefined(...configs, { mode, stack }, options)

    if (beforeNew) {
      options = beforeNew(options)
    }

    return new Class(options)
  }

  function openCallbackAttr(link, attr) {
    return e.callbackAttr(link, attr, { exposedKeys: ['layer'] })
  }

  function closeCallbackAttr(link, attr) {
    return e.callbackAttr(link, attr, { exposedKeys: ['layer', 'value', 'response'] })
  }

  function reset() {
    stack.reset()
    handlers = u.filter(handlers, 'isDefault')
  }

  /*-
  [Opens a new overlay](/opening-overlays).

  Opening a layer is considered [navigation](/navigation) by default.

  ### Example

  ```js
  let layer = await up.layer.open({ url: '/contacts' })
  console.log(layer.mode) // logs "modal"
  ```

  @function up.layer.open

  @param {Object} [options]
    All [render options](/up.render#parameters) may be used.

    You may configure default layer attributes in `up.layer.config`.

  @param {string} [options.layer="new"]
    Whether to stack the new overlay or replace existing overlays.

    See [replacing existing overlays](/opening-overlays#replacing-existing-overlays).

  @param {string} [options.mode]
    The kind of overlay to open.

    See [available layer modes](/layer-terminology#available-modes).

  @param {string} [options.size]
    The size of the overlay.

    Supported values are `'small'`, `'medium'`, `'large'` and `'grow'`:
    See [overlay sizes](/customizing-overlays#overlay-sizes) for details.

  @param {string} [options.class]
    An optional HTML class for the overlay's container element.

    See [overlay classes](/customizing-overlays#overlay-classes).

  @param {boolean|string|Array<string>} [options.dismissable=true]
    How the overlay may be [dismissed](/closing-overlays) by the user.

    Supported values are `'key'`, `'outside'` and `'button'`.
    See [customizing dismiss controls](/closing-overlays#customizing-dismiss-controls)
    for details.

    You may enable multiple dismiss controls by passing an array or
    a space-separated string.

    Passing `true` or `false` will enable or disable all dismiss controls.

  @param {boolean|string} [options.history]
    Whether the overlay has [visible history](/history-in-overlays).

    If set to `true` the overlay location, title and meta tags will be shown
    while the overlay is open. When the overlay is closed, the parent layer's history is restored.

    If set to `'auto'` history will be visible if the initial overlay
    content matches a [main target](/up-main).

    If set to `false`, fragments changes within the overlay will *never* update the address bar.
    You can still access the overlay's current location using `up.layer.location`.

    See [History in overlays](/history-in-overlays).

  @param {string|Function} [options.animation]
    The opening animation.

  @param {Element} [options.origin]
    The link element that caused this overlay to open.

    The origin [will be re-focused](/focus#focus-in-overlays) when the overlay closes.

  @param {Function(Event)} [options.onOpened]
    A function that is called when the overlay was inserted into the DOM.

    The function argument is an `up:layer:opened` event.

    The overlay may still play an opening animation when this function is called.
    To be called when the opening animation is done, pass an
    [`{ onFinished }`](/up.render#options.onFinished) option.

  @param {Function(Event)} [options.onAccepted]
    A function that is called when the overlay was [accepted](/closing-overlays).

    The function argument is an `up:layer:accepted` event.

  @param {Function(Event)} [options.onDismissed]
    A function that is called when the overlay was [dismissed](/closing-overlays).

    The function argument is an `up:layer:dismissed` event.

  @param {string|Array<string>} [options.acceptEvent]
    One or more event types that will cause this overlay to automatically be
    [accepted](/closing-overlays) when a matching event occurs within the overlay.

    The [overlay result value](/closing-overlays#overlay-result-values)
    is the event object that caused the overlay to close.

    See [Closing when an event is emitted](/closing-overlays#event-condition).

  @param {string|Array<string>} [options.dismissEvent]
    One or more event types that will cause this overlay to automatically be
    [dismissed](/closing-overlays) when a matching event occurs within the overlay.

    The [overlay result value](/closing-overlays#overlay-result-values)
    is the event object that caused the overlay to close.

    See [Closing when an event is emitted](/closing-overlays#event-condition).

  @param {string|Array<string>} [options.acceptLocation]
    One or more [URL patterns](/url-patterns) that will cause this overlay to automatically be
    [accepted](/closing-overlays) when the overlay reaches a matching [location](/up.layer.location).

    The [overlay result value](/closing-overlays#overlay-result-values)
    is an object of [named segments matches](/url-patterns#capturing-named-segments) captured
    by the URL pattern.

    See [Closing when a location is reached](/closing-overlays#event-condition).

  @param {string|Array<string>} [options.dismissLocation]
    One or more [URL patterns](/url-patterns) that will cause this overlay to automatically be
    [dismissed](/closing-overlays) when the overlay reaches a matching [location](/up.layer.location).

    The [overlay result value](/closing-overlays#overlay-result-values)
    is an object of [named segments matches](/url-patterns#capturing-named-segments) captured
    by the URL pattern.

    See [Closing when a location is reached](/closing-overlays#location-condition).

  @param {Object} [options.context={}]
    The initial [context](/up.layer.context) object for the new overlay.

    @experimental

  @param {string} [options.position]
    The position of the popup relative to the `{ origin }` element that opened
    the overlay.

    Supported values are `'top'`,  `'right'`,  `'bottom'` and  `'left'`.

    See [popup position](/customizing-overlays#popup-position).

  @param {string} [options.align]
    The alignment of the popup within its `{ position }`.

    Supported values are `'top'`,  `'right'`, `'center'`, `'bottom'` and  `'left'`.

    See [popup position](/customizing-overlays#popup-position).

  @return {Promise<up.Layer>}
    A promise for the `up.Layer` object that models the new overlay.

    The promise will be resolved once the overlay was placed into the DOM.

  @stable
  */
  async function open(options) {
    options = u.options(options, {
      layer: 'new',
      defaultToEmptyContent: true,
      navigate: true
    })

    // Even if we are given { content } we need to pipe this through up.render()
    // since a lot of options processing is happening there.
    let result = await up.render(options)
    return result.layer
  }

  /*-
  This event is emitted before an overlay is opened.

  The overlay is not yet part of the [layer stack](/up.layer.stack) and has not yet been placed
  in the DOM. Listeners may prevent this event to prevent the overlay from opening.

  The event is emitted on the `document`.

  ### Changing layer options

  Listeners may inspect and manipulate options for the overlay that is about to open.

  For example, to give overlays the CSS class `.warning` if the initial URL contains
  the word `"confirm"`:

  ```js
  up.on('up:layer:open', function(event) {
    if (event.layerOptions.url.includes('confirm')) {
      event.layerOptions.class = 'warning'
    }
  })
  ```

  @event up:layer:open
  @param {Object} event.layerOptions
    Options for the overlay that is about to open.

    Listeners may inspect and change the options.
    All options for `up.layer.open()` may be used.
  @param {Element} event.origin
    The link element that is opening the overlay.
  @param event.preventDefault()
    Prevents this overlay from opening.

    Programmatic callers will reject with an `up.AbortError`.
  @stable
  */

  /*-
  This event is emitted after a new overlay was placed into the DOM.

  The event is emitted right before the opening animation starts. Because the overlay
  has not been rendered by the browser, this makes it a good occasion to
  [customize overlay elements](/customizing-overlays#customizing-overlay-elements):

  ```js
  up.on('up:layer:opened', function(event) {
    if (isChristmas()) {
      up.element.affix(event.layer.element, '.santa-hat', text: 'Merry Christmas!')
    }
  })
  ```

  @event up:layer:opened
  @param {Element} event.origin
    The link element that is opening the overlay.
  @param {up.Layer} event.layer
    The [layer object](/up.Layer) that is opening.
  @stable
  */

  /*-
  This event is emitted after a layer's [location property](/up.Layer.prototype.location)
  has changed value.

  This event is *also* emitted when a layer [without visible history](/up.Layer.prototype.history)
  has reached a new location. If you are only interested in changes the are visible in
  the browser's address bar, observe `up:location:changed` instead.

  The event is also event for location changes on the [root layer](/layer-terminology).

  This event is *not* emitted when an overlay is opened. For this observe `up:layer:opened` instead.

  @param {string} event.location
    The new location URL.
  @param {up.Layer} event.layer
    The [layer object](/up.Layer) that had its location changed.
  @event up:layer:location:changed
  @experimental
  */

  /*-
  Opens an overlay and returns a promise for its [acceptance](/closing-overlays).

  It's useful to think of overlays as [promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
  which may either be **fulfilled (accepted)** or **rejected (dismissed)**.

  ### Example

  Instead of using `up.layer.open()` and passing callbacks, you may use `up.layer.ask()`.
  `up.layer.ask()` returns a promise for the acceptance value, which you can `await`:

  ```js
  let user = await up.layer.ask({ url: '/users/new' })
  console.log("New user is " + user)
  ```

  @see closing-overlays

  @function up.layer.ask

  @param {Object} options
    See options for `up.layer.open()`.

  @return {Promise}
    A promise that will settle when the overlay closes.

    When the overlay was accepted, the promise will fulfill with the overlay's acceptance value.

    When the overlay was dismissed, the promise will reject with the overlay's dismissal value.

  @stable
  */
  function ask(options) {
    return new Promise(function (resolve, reject) {
      options = {
        ...options,
        onAccepted: (event) => resolve(event.value),
        onDismissed: (event) => reject(event.value)
      }
      open(options)
    })
  }

  function anySelector() {
    return u.map(LAYER_CLASSES, Class => Class.selector()).join()
  }

  function optionToString(option) {
    if (u.isString(option)) {
      return `layer "${option}"`
    } else {
      return option.toString()
    }
  }

  function isWithinForeignOverlay(element) {
    let selector = config.selector('foreignOverlaySelectors')
    return !!(selector && element.closest(selector))
  }

  /*-
  [Follows](/up-follow) this link and [opens the result in a new overlay](/opening-overlays).

  ### Example

  ```html
  <a href="/menu" up-layer="new">Open menu</a>
  ```

  @selector [up-layer=new]

  @params-note
    All attributes for `[up-follow]` may also be used.

    You may configure default layer attributes in `up.layer.config`.

  @param [up-layer="new"]
    Whether to stack the new overlay onto the current layer or replace existing overlays.

    See [replacing existing overlays](/opening-overlays#replacing-existing-overlays).

  @param [up-mode]
    The kind of overlay to open.

    See [available layer modes](/layer-terminology#available-modes).

  @param [up-size]
    The size of the overlay.

    See [overlay sizes](/customizing-overlays#overlay-sizes) for details.

  @param [up-class]
    An optional HTML class for the overlay's container element.

    See [overlay classes](/customizing-overlays#overlay-classes).

  @param [up-history]
    Whether the overlay has [visible history](/history-in-overlays).

    If set to `'true'` the overlay location, title and meta tags will be shown
    while the overlay is open. When the overlay is closed, the parent layer's history is restored.

    If set to `'auto'` history will be visible if the initial overlay
    content matches a [main target](/up-main).

    If set to `'false'`, fragments changes within the overlay will *never* update the address bar.
    You can still access the overlay's current location using `up.layer.location`.

    See [History in overlays](/history-in-overlays).

  @param [up-dismissable]
    How the overlay may be [dismissed](/closing-overlays) by the user.

    See [customizing dismiss controls](/closing-overlays#customizing-dismiss-controls)
    for details.

    You may enable multiple dismiss controls by passing a space-separated string.

    Passing `true` or `false` will enable or disable all dismiss controls.

  @param [up-animation]
    The [name](/predefined-animations) of the opening animation.

  @param [up-on-opened]
    A JavaScript snippet that is called when the overlay was inserted into the DOM.

    The snippet runs in the following scope:

    | Expression | Value                                    |
    |------------|------------------------------------------|
    | `this`     | The link that opened the overlay         |
    | `layer`    | An `up.Layer` object for the new overlay |
    | `event`    | An `up:layer:opened` event               |

  @param [up-on-accepted]
    A JavaScript snippet that is called when the overlay was [accepted](/closing-overlays).

    The snippet runs in the following scope:

    | Expression | Value                                         |
    |------------|-----------------------------------------------|
    | `this`     | The link that originally opened the overlay   |
    | `layer`    | An `up.Layer` object for the accepted overlay |
    | `value`    | The overlay's [acceptance value](/closing-overlays#overlay-result-values) |
    | `response` | The server response that caused the overlay to close |
    | `event`    | An `up:layer:accepted` event                  |

  @param [up-on-dismissed]
    A JavaScript snippet that is called when the overlay was [dismissed](/closing-overlays).

    The snippet runs in the following scope:

    | Expression | Value                                          |
    |------------|------------------------------------------------|
    | `this`     | The link that originally opened the overlay    |
    | `layer`    | An `up.Layer` object for the dismissed overlay |
    | `value`    | The overlay's [dismissal value](/closing-overlays#overlay-result-values) |
    | `response` | The server response that caused the overlay to close |
    | `event`    | An `up:layer:dismissed` event                  |

  @param [up-accept-event]
    One or more space-separated event types that will cause this overlay to automatically be
    [accepted](/closing-overlays) when a matching event occurs within the overlay.

    The [overlay result value](/closing-overlays#overlay-result-values)
    is the event object that caused the overlay to close.

    See [Closing when an event is emitted](/closing-overlays#event-condition).

  @param [up-dismiss-event]
    One or more space-separated event types that will cause this overlay to automatically be
    [dismissed](/closing-overlays) when a matching event occurs within the overlay.

    The [overlay result value](/closing-overlays#overlay-result-values)
    is the event object that caused the overlay to close.

    See [Closing when an event is emitted](/closing-overlays#event-condition).

  @param [up-accept-location]
    One or more space-separated [URL patterns](/url-patterns) that will cause this overlay to automatically be
    [accepted](/closing-overlays) when the overlay reaches a matching [location](/up.layer.location).

    The [overlay result value](/closing-overlays#overlay-result-values)
    is an object of [named segments matches](/url-patterns#capturing-named-segments) captured
    by the URL pattern.

    See [Closing when a location is reached](/closing-overlays#location-condition).

  @param [up-dismiss-location]
    One or more space-separated [URL patterns](/url-patterns) that will cause this overlay to automatically be
    [dismissed](/closing-overlays) when the overlay reaches a matching [location](/up.layer.location).

    The [overlay result value](/closing-overlays#overlay-result-values)
    is an object of [named segments matches](/url-patterns#capturing-named-segments) captured
    by the URL pattern.

    See [Closing when a location is reached](/closing-overlays#location-condition).

  @param [up-context]
    The new overlay's [context](/up.layer.context) object, encoded as JSON.

    @experimental

  @param [up-position]
    The position of the popup relative to the `{ origin }` element that opened
    the overlay.

    Supported values are `top`,  `right`,  `bottom` and  `left`.

    See [popup position](/customizing-overlays#popup-position).

  @param [up-align]
    The alignment of the popup within its `{ position }`.

    Supported values are `top`,  `right`, `center`, `bottom` and  `left`.

    See [popup position](/customizing-overlays#popup-position).

  @stable
  */

  /*-
  [Dismisses](/closing-overlays) the [current layer](/up.layer.current) when the link is clicked.

  The JSON value of the `[up-accept]` attribute becomes the overlay's
  [dismissal value](/closing-overlays#overlay-result-values).

  ### Example

  ```html
  <a href='/dashboard' up-dismiss>Close</a>
  ```

  ### Fallback for the root layer

  The link's `[href]` will only be followed when this link is clicked in the [root layer](/up.layer).
  In an overlay the `click` event's default action is prevented.

  You can also omit the `[href]` attribute to make a link that only works in overlays.

  @selector [up-dismiss]
  @param [up-dismiss]
    The overlay's [dismissal value](/closing-overlays#overlay-result-values) as a JSON string.
  @param [up-confirm]
    A message the user needs to confirm before the layer is closed.
  @param [up-animation]
    The [name](/predefined-animations) of the overlay's close animation.

    Defaults to overlay's [preconfigured close animation](/up.layer.config).
  @param [up-duration]
    The close animation's duration in milliseconds.
  @param [up-easing]
    The close animation's easing function.
  @stable
  */

  /*-
  [Accepts](/closing-overlays) the [current layer](/up.layer.current) when the link is clicked.

  The JSON value of the `[up-accept]` attribute becomes the overlay's
  [acceptance value](/closing-overlays#overlay-result-values).

  ### Example

  ```html
  <a href='/users/5' up-accept='{ "id": 5 }'>Choose user #5</a>
  ```

  ### Fallback for the root layer

  The link's `[href]` will only be followed when this link is clicked in the [root layer](/up.layer).
  In an overlay the `click` event's default action is prevented.

  You can also omit the `[href]` attribute to make a link that only works in overlays.

  @selector [up-accept]
  @param [up-accept]
    The overlay's [acceptance value](/closing-overlays#overlay-result-values) as a JSON string.
  @param [up-confirm]
    A message the user needs to confirm before the layer is closed.
  @param [up-duration]
    The close animation's duration in milliseconds.
  @param [up-easing]
    The close animation's easing function.
  @stable
  */

  up.on('up:fragment:destroyed', function() {
    stack.sync()
  })

  up.on('up:framework:evaled', function() {
    // Due to circular dependencies we must delay initialization of the stack until all of
    // Unpoly's submodules have been evaled. We cannot delay initialization until up:framework:boot,
    // since by then user scripts have run and event listeners will no longer register as "default".
    stack = new up.LayerStack()
  })

  up.on('up:framework:reset', reset)

  const api = {
    config,
    mainTargets,
    open,
    build,
    ask,
    normalizeOptions,
    openCallbackAttr,
    closeCallbackAttr,
    anySelector,
    optionToString,
    get stack() { return stack.layers },
    isWithinForeignOverlay
  }

  /*-
  Returns the current layer in the [layer stack](/up.layer.stack).

  The *current* layer is usually the [frontmost layer](/up.layer.front).
  There are however some cases where the current layer is a layer in the background:

  - While an element in a background layer is being [compiled](/up.compiler).
  - While an Unpoly event like `up:request:loaded` is being triggered from a background layer.
  - While an event listener bound to a background layer using `up.Layer#on()` is being called.

  To temporarily change the current layer from your own code, use `up.Layer#asCurrent()`.

  ### Remembering the current layer

  Most functions in the `up.layer` package affect the current layer. E.g. `up.layer.dismiss()`
  is shorthand for `up.layer.current.dismiss()`.

  As described above `up.layer.current` is set to the right layer in compilers and most events,
  even if that layer is not the frontmost layer.

  If you have async code, the current layer may change when your callback is called.
  To address this you may retrieve the current layer for later reference:

  ```js
  function dismissCurrentLayerIn(seconds) {
    let savedLayer = up.layer.current // returns an up.Layer object
    let dismiss = () => savedLayer.dismiss()
    setTimeout(dismiss, seconds * 1000)
  }

  dismissCurrentLayerIn(10) //
  ```

  @property up.layer.current
  @param {up.Layer} current
  @stable
  */

  /*-
  Returns the number of layers in the [layer stack](/up.layer.stack).

  The count includes the [root layer](/up.layer.root).
  Hence a page with a single overlay would return a count of 2.

  @property up.layer.count
  @param {number} count
    The number of layers in the stack.
  @stable
  */

  /*-
  Returns an `up.Layer` object for the given element or [layer option](/layer-option).


  ### Looking up the layer of an element

  Passing an element will return the layer containing that element:

  ```js
  let element = document.querySelector(...)
  up.layer.get(element) // returns the element's layer
  ```

  If the given element is detached, or part of a closing overlay, `undefined` is returned.

  ### Getting the nth layer

  Pass a number to return the `up.Layer` object at that index:

  ```js
  up.layer.get(0) // returns the root layer
  up.layer.get(1) // returns the first overlay
  ```

  ### Resolving a layer option

  Pass any [layer option](/layer-option) to return the `up.Layer` object
  of the first layer matching that option:

  ```js
  up.layer.get('front') // returns the front layer
  ```

  To look up one of multiple layer options, separate the values using `or`:

  ```js
  // returns the parent layer, or the root if we're already on root:
  up.layer.get('parent or root')
  ```

  ### Existing `up.Layer` objects are returned

  Passing an existing `up.Layer` object will return it unchanged:

  ```js
  let layer = up.layer.root
  up.layer.get(layer) // returns the given layer
  ```

  ### Missing values return the current layer

  Passing `null` or `undefined` will return the [current layer](/up.layer.current):

  ```js
  up.layer.get(undefined) // returns the current layer
  ```

  @function up.layer.get
  @param {string|up.Layer|number} [value='current']
    The [layer option](/layer-option) to look up.
  @return {up.Layer|undefined}
    The layer matching the given option.

    If no layer matches, `undefined` is returned.
  @stable
  */

  /*-
  Returns an array of `up.Layer` objects matching the given [layer option](/layer-option).

  @function up.layer.getAll
  @param {string|up.Layer|number} [layer='current']
    The [layer option](/layer-option) to look up.
  @return {Array<up.Layer>}
  @experimental
  */

  /*-
  Returns the [root layer](/layer-terminology).

  The root layer represents the initial page before any overlay was [opened](/opening-overlays).
  The root layer always exists and cannot be closed.

  @property up.layer.root
  @param {up.Layer} root
  @stable
  */

  /*-
  Returns an array of all [overlays](/layer-terminology).

  If no overlay is open, an empty array is returned.

  To get an array of *all* layers including the [root layer](/up.layer.root),
  use `up.layer.stack`.

  @property up.layer.overlays
  @param {Array<up.Layer>} overlays
  @stable
  */

  /*-
  Returns the frontmost layer in the [layer stack](/up.layer.stack).

  The frontmost layer is the layer directly facing the user. If an overlay is
  stacked on top of the frontmost layer, that overlay becomes the new frontmost layer.

  In most cases you don't want to refer to the frontmost layer,
  but to the [current layer](/up.layer.current) instead.

  @property up.layer.front
  @param {up.Layer} front
  @stable
  */

  /*-
  [Dismisses](/up.layer.dismiss) all overlays.

  Afterwards the only remaining layer will be the [root layer](/up.layer.root).

  @function up.layer.dismissOverlays
  @param {any} [value]
    The dismissal value.
  @param {Object} [options]
    See options for `up.layer.dismiss()`.
  @stable
  */
  u.delegate(api, [
    'get',
    'getAll',
    'root',
    'overlays',
    'current',
    'front',
    'sync',
    'count',
    'dismissOverlays'
  ], () => stack)

  /*-
  [Accepts](/closing-overlays) the [current layer](/up.layer.current).

  This is a shortcut for `up.layer.current.accept()`.
  See `up.Layer#accept()` for more documentation.

  @function up.layer.accept
  @param {any} [value]
  @param {Object} [options]
  @stable
  */

  /*-
  This event is emitted *before* a layer is [accepted](/closing-overlays).

  The event is emitted on the [element of the layer](/up.layer.element) that is about to close.

  @event up:layer:accept
  @param {up.Layer} event.layer
    The layer that is about to close.
  @param {any} [event.value]
    The overlay's [acceptance value](/closing-overlays#overlay-result-values).

    Listeners may replace or mutate this value.
  @param {Element} [event.origin]
    The element that is causing the layer to close.

    Will be `undefined` if the overlay is not closing by a user interacting with an element.
  @param {up.Response} [event.response]
    The server response that is causing this overlay to close.

    Will be `undefined` if the overlay is not closing in reaction to a server response.

    @experimental
  @param event.preventDefault()
    Prevents the overlay from closing.
  @stable
  */

  /*-
  This event is emitted *after* a layer was [accepted](/closing-overlays).

  The event is emitted on the [layer's](/up.layer.element) when the close animation
  is starting. If the layer has no close animaton and was already removed from the DOM,
  the event is emitted a second time on the `document`.

  > [tip]
  > To prevent a layer from being closed, listen to `up:layer:accept` instead.

  @event up:layer:accepted
  @param {up.Layer} event.layer
    The layer that was closed.
  @param {any} [event.value]
    The overlay's final [acceptance value](/closing-overlays#overlay-result-values).
  @param {Element} [event.origin]
    The element that caused the layer to close.

    Will be `undefined` if the overlay was not closed by a user interacting with an element.
  @param {up.Response} [event.response]
    The server response that caused this overlay to close.

    Will be `undefined` if the overlay was not closed in reaction to a server response.

    @experimental
  @stable
  */

  /*-
  [Dismisses](/closing-overlays) the [current layer](/up.layer.current).

  This is a shortcut for `up.layer.current.dismiss()`.
  See `up.Layer#dismiss()` for more documentation.

  @function up.layer.dismiss
  @param {any} [value]
  @param {Object} [options]
  @stable
  */

  /*-
  This event is emitted *before* a layer is [dismissed](/closing-overlays).

  The event is emitted on the [element of the layer](/up.layer.element) that is about to close.

  @event up:layer:dismiss
  @param {up.Layer} event.layer
    The layer that is about to close.
  @param {any} [event.value]
    The overlay's [dismissal value](/closing-overlays#overlay-result-values).

    Listeners may replace or mutate this value.
  @param {Element} [event.origin]
    The element that is causing the layer to close.

    Will be `undefined` if the overlay is not closing by a user interacting with an element.
  @param {up.Response} [event.response]
    The server response that is causing this overlay to close.

    Will be `undefined` if the overlay is not closing in reaction to a server response.

    @experimental
  @param event.preventDefault()
    Event listeners may call this method to prevent the overlay from closing.
  @stable
  */

  /*-
  This event is emitted *after* a layer was [dismissed](/closing-overlays).

  The event is emitted on the [layer's](/up.layer.element) when the close animation
  is starting. If the layer has no close animaton and was already removed from the DOM,
  the event is emitted a second time on the `document`.

  > [tip]
  > To prevent a layer from being closed, listen to `up:layer:dismiss` instead.

  @event up:layer:dismissed
  @param {up.Layer} event.layer
    The layer that was closed.
  @param {any} [event.value]
    The overlay's final [dismissal value](/closing-overlays#overlay-result-values).
  @param {Element} [event.origin]
    The element that caused the layer to close.

    Will be `undefined` if the overlay was not closed by a user interacting with an element.
  @param {up.Response} [event.response]
    The server response that caused this overlay to close.

    Will be `undefined` if the overlay was not closed in reaction to a server response.

    @experimental
  @stable
  */

  /*-
  Returns whether the [current layer](/up.layer.current) is the [root layer](/up.layer.root).

  This is a shortcut for `up.layer.current.isRoot()`.
  See `up.Layer#isRoot()` for more documentation..

  @function up.layer.isRoot
  @return {boolean}
  @stable
  */

  /*-
  Returns whether the [current layer](/up.layer.current) is *not* the [root layer](/up.layer.root).

  This is a shortcut for `up.layer.current.isOverlay()`.
  See `up.Layer#isOverlay()` for more documentation.

  @function up.layer.isOverlay
  @return {boolean}
  @stable
  */

  /*-
  Returns whether the [current layer](/up.layer.current) is the [frontmost layer](/up.layer.front).

  This is a shortcut for `up.layer.current.isFront()`.
  See `up.Layer#isFront()` for more documentation.

  @function up.layer.isFront
  @return {boolean}
  @stable
  */

  /*-
  Listens to a [DOM event](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Events)
  that originated on an element [contained](/up.Layer.prototype.contains) by the [current layer](/up.layer.current).

  This is a shortcut for `up.layer.current.on()`.
  See `up.Layer#on()` for more documentation.

  @function up.layer.on
  @param {string} types
    A space-separated list of event types to bind to.
  @param {string|Function(): string} [selector]
    The selector of an element on which the event must be triggered.
  @param {Object} [options]
  @param {Function(event, [element], [data])} listener
    The listener function that should be called.
  @return {Function()}
    A function that unbinds the event listeners when called.
  @stable
  */

  /*-
  Unbinds an event listener previously bound to the [current layer](/up.layer.current).

  This is a shortcut for `up.layer.current.off()`.
  See `up.Layer#off()` for more documentation.

  @function up.layer.off
  @param {string} events
  @param {string|Function(): string} [selector]
  @param {Function(event, [element], [data])} listener
    The listener function to unbind.
  @stable
  */

  /*-
  [Emits](/up.emit) an event on the [current layer](/up.layer.current)'s [element](/up.layer.element).

  This is a shortcut for `up.layer.current.emit()`.
  See `up.Layer#emit()` for more documentation.

  @function up.layer.emit
  @param {string} eventType
  @param {Object} [props={}]
  @stable
  */

  /*-
  Returns the parent layer of the [current layer](/up.layer.current).

  This is a shortcut for `up.layer.current.parent`.
  See `up.Layer#parent` for more documentation.

  @property up.layer.parent
  @param {up.Layer} parent
  @stable
  */

  /*-
  Whether fragment updates within the [current layer](/up.layer.current)
  can affect browser history and window title.

  This is a shortcut for `up.layer.current.history`.
  See `up.Layer#history` for more documentation.

  @property up.layer.history
  @param {boolean} history
  @stable
  */

  /*-
  The location URL of the [current layer](/up.layer.current).

  This is a shortcut for `up.layer.current.location`.
  See `up.Layer#location` for more documentation.

  @property up.layer.location
  @param {string} location
  @stable
  */

  /*-
  The [current layer](/up.layer.current)'s [mode](/up.layer.mode)
  which governs its appearance and behavior.

  @property up.layer.mode
  @param {string} mode
  @stable
  */

  /*-
  The [context](/context) of the [current layer](/up.layer.current).

  This is aliased as `up.context`.

  @property up.layer.context
  @param {string} context
    The context object.

    If no context has been set an empty object is returned.
  @experimental
  */

  /*-
  The outmost element of the [current layer](/up.layer.current).

  This is a shortcut for `up.layer.current.element`.
  See `up.Layer#element` for more documentation.

  @property up.layer.element
  @param {Element} element
  @stable
  */

  /*-
  The outmost element of the [current layer](/up.layer.current).

  This is a shortcut for `up.layer.current.element`.
  See `up.Layer#element` for more documentation.

  @property up.layer.element
  @param {Element} element
  @stable
  */

  /*-
  Returns whether the given `element` is contained by the [current layer](/up.layer.current).

  This is a shortcut for `up.layer.current.contains(element)`.
  See `up.Layer#contains` for more documentation.

  @function up.layer.contains
  @param {Element} element
  @stable
  */


  /*-
  The [size](/customizing-overlays#overlay-sizes) of the [current layer](/up.layer.current).

  This is a shortcut for `up.layer.current.size`.
  See `up.Layer#size` for more documentation.

  @property up.layer.size
  @param {string} size
  @stable
  */

  /*-
  Creates an element with the given `selector` and appends it to the [current layer's](/up.layer.current)
  [outmost element](/up.Layer.prototype.element).

  This is a shortcut for `up.layer.current.affix(selector)`.
  See `up.Layer#affix` for more documentation.

  @function up.layer.affix
  @param {Element} element
  @param {string} selector
  @param {Object} attrs
  @experimental
  */

  u.delegate(api, [
    'accept',
    'dismiss',
    'isRoot',
    'isOverlay',
    'isFront',
    'on',
    'off',
    'emit',
    'parent',
    'history',
    'location',
    'mode',
    'context',
    'element',
    'contains',
    'size',
    'affix'
  ], () => stack.current)

  return api
})()
