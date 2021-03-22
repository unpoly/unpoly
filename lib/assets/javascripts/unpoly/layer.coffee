u = up.util
e = up.element

###**
Layers
======

TODO

@module up.layer
###
up.layer = do ->

  OVERLAY_CLASSES = [
    up.Layer.Modal
    up.Layer.Popup
    up.Layer.Drawer
    up.Layer.Cover
  ]
  OVERLAY_MODES = u.map(OVERLAY_CLASSES, 'mode')
  LAYER_CLASSES = [up.Layer.Root].concat(OVERLAY_CLASSES)

  # TODO: Document up.layer.config
  config = new up.Config ->
    newConfig =
      mode: 'modal'
      any:
        mainTargets: [
          "[up-main='']",
          'main',
          ':layer' # this is <body> for the root layer
        ],
      root:
        mainTargets: ['[up-main~=root]']
        history: true
      overlay:
        mainTargets: ['[up-main~=overlay]']
        openAnimation: 'fade-in'
        closeAnimation: 'fade-out'
        dismissLabel: '×'
        dismissAriaLabel: 'Dismiss dialog'
        dismissable: true
        history: 'auto'
      cover:
        mainTargets: ['[up-main~=cover]']
      drawer:
        mainTargets: ['[up-main~=drawer]']
        backdrop: true
        position: 'left'
        size: 'medium'
        openAnimation: (layer) ->
          switch layer.position
            when 'left' then 'move-from-left'
            when 'right' then 'move-from-right'
        closeAnimation: (layer) ->
          switch layer.position
            when 'left' then 'move-to-left'
            when 'right' then 'move-to-right'
      modal:
        mainTargets: ['[up-main~=modal]']
        backdrop: true
        size: 'medium'
      popup:
        mainTargets: ['[up-main~=popup]']
        position: 'bottom'
        size: 'medium'
        align: 'left'
        dismissable: 'outside key'

    for Class in LAYER_CLASSES
      newConfig[Class.mode].Class = Class

    return newConfig

  stack = null

  handlers = []

  isOverlayMode = (mode) ->
    return u.contains(OVERLAY_MODES, mode)

  mainTargets = (mode) ->
    return u.flatMap(modeConfigs(mode), 'mainTargets')

  ###**
  Returns an array of config objects that apply to the given mode name.

  The config objects are in descending order of specificity.
  ###
  modeConfigs = (mode) ->
    if mode == 'root'
      return [config.root, config.any]
    else
      return [config[mode], config.overlay, config.any]
      
  normalizeOptions = (options) ->
    up.migrate.handleLayerOptions?(options)

    if u.isGiven(options.layer) # might be the number 0, which is falsy
      if options.layer == 'swap'
        if up.layer.isRoot()
          options.layer = 'root'
        else
          options.layer = 'new'
          options.currentLayer = 'parent'

      if options.layer == 'new'
        # If the user wants to open a new layer, but does not pass a { mode },
        # we assume the default mode from up.layer.config.mode.
        options.mode ||= config.mode
      else if isOverlayMode(options.layer)
        # We allow passing an overlay mode in { layer }, which will
        # open a new layer with that mode.
        options.mode = options.layer
        options.layer = 'new'
    else
      # If no options.layer is given we still want to avoid updating "any" layer.
      # Other options might have a hint for a more appropriate layer.

      if options.mode
        # If user passes a { mode } option without a { layer } option
        # we assume they want to open a new layer.
        options.layer = 'new'
      else if u.isElementish(options.target)
        # If we are targeting an actual Element or jQuery collection (and not
        # a selector string) we operate in that element's layer.
        options.layer = stack.get(options.target, normalizeLayerOptions: false)
      else if options.origin
        # Links update their own layer by default.
        options.layer = 'origin'
      else
        # If nothing is given, we assume the current layer
        options.layer = 'current'

    options.context ||= {}

    # Remember the layer that was current when the request was made,
    # so changes with `{ layer: 'new' }` will know what to stack on.
    # Note if options.currentLayer is given, up.layer.get('current', options) will
    # return the resolved version of that.
    # TODO: Test this
    options.currentLayer = stack.get('current', u.merge(options, normalizeLayerOptions: false))

  build = (options) ->
    mode = options.mode
    Class = config[mode].Class

    # modeConfigs() returns the most specific options first,
    # but in merge() below later args override keys from earlier args.
    configs = u.reverse(modeConfigs(mode))
    options = u.mergeDefined(configs..., { mode, stack }, options)

    return new Class(options)

#  modeClass = (options = {}) ->
#    mode = options.mode ? config.mode
#    config[mode].Class or up.fail("Unknown layer mode: #{mode}")

  openCallbackAttr = (link, attr) ->
    return e.callbackAttr(link, attr, ['layer'])

  closeCallbackAttr = (link, attr) ->
    return e.callbackAttr(link, attr, ['layer', 'value'])

  reset = ->
    config.reset()
    stack.reset()
    handlers = u.filter(handlers, 'isDefault')

  ###**
  Opening a layer is considered [navigation](/navigation) by default.

  TODO: await up.Layer object

  @function up.layer.open

  @param {Object} [options]
    All [render options](/up.render) may be used.

  @param {string} [options.mode]
    The kind of overlay to open.

    The following mode values are supported:

    | Mode      | Description                           |
    | --------- | ------------------------------------- |
    | `modal`   | A modal dialog box                    |
    | `drawer`  | A drawer sliding in from the side     |
    | `popup`   | A popup menu anchored to a link       |
    | `cover`   | An overlay covering the entire screen |

    The default mode is `modal`. You can change this in `up.layer.config.mode`.

  @param {string} [options.position]
    The position of the overlay relative to the `{ origin }` element that opened
    the overlay.

    This option is only supported by the `popup` mode.

    Supported values are `'top'`,  `'right'`,  `'bottom'` and  `'left'`.

  @param {string} [options.align]
    The alignment of the overlay within its `{ position }`.

    This option is only supported by the `popup` mode.

    For popups with a `{ position }` of `'left'` or `'right'`, supported `{ align }` values
    are `'top'`, `'center'` and `'bottom'`.

    For popups with a `{ position }` of `'top'` or `'bottom'`, supported `{ align }` values
    are `'left'`, `'center'` and `'right'`.

  @param {string} [options.size]
    The size of the overlay.

    Supported values are `'small'`, `'medium'`, `'large'` and `'grow'`:

    | Mode   | small | medium | large  | grow |
    | ------:| -----:| ------:| ------:|-----------------|
    | `modal`  | `350px` | `650px` | `1000px` | grow with content |
    | `popup`  | `180px` | `300px` | `550px`  | grow with content |
    | `drawer` | `150px` | `340px` | `600px`  | grow with content |
    | `cover`  | `100%`  | `100%`  | `100%`   | `100%` |

    You can customize sizes with CSS:

    ```css
    up-modal[size=medium] up-modal-box {
      width: 500px;
    }
    ```

    Regardless of size, overlays never grow wider than the screen width.

  @param {string} [options.class]
    An optional HTML class for the overlay.

    The class will be assigned to the overlay's container element:

    ```html
    <up-modal class="warning">
      ...
    </up-modal>
    ```

  @param {boolean|string|Array<string>} [options.dismissable=true]
    How the overlay may be [dismissed](/closing-overlays) by the user.

    The following values are supported:

    | Option      | Effect                                           | Dismiss value |
    | ----------- | ------------------------------------------------ | ------------- |
    | `'key'`     | Enables dimissing with Escape key                | `:key`        |
    | `'outside'` | Enables dismissing by clicking on the background | `:outside`    |
    | `'button'`  | Adds an "X" button to the layer                  | `:button`     |

    You may pass multiple dismiss methods as an array (`['key', 'outside']`) or
    as a space-separated string (`'key outside'`).

    Passing `true` will enable all dismiss methods.

    Passing `false` will disable all dismiss methods.

    Regardless of what is configured here, an overlay may always be dismissed
    using the `up.layer.dismiss()` method or `a[up-dismiss]` attribute.

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

    Multiple event types may be passed as either an array of strings or as a
    space-separated string.

  @param {string|Array<string>} [options.dismissEvent]
    One or more event types that will cause this overlay to automatically be
    [dismissed](/closing-overlays) when a matching event occurs within the overlay.

    The [overlay result value](/closing-overlays#overlay-result-values)
    is the event object that caused the overlay to close.

    Multiple event types may be passed as either an array of strings or as a
    space-separated string.

  @param {string|Array<string>} [options.acceptLocation]
    One or more [URL patterns](/url-patterns) that will cause this overlay to automatically be
    [accepted](/closing-overlays) when the overlay reaches a matching [location](/up.layer.location).

    The [overlay result value](/closing-overlays#overlay-result-values)
    is an object of [named segments matches](/url-patterns#capturing-named-segments) captured
    by the URL pattern.

    Multiple URL patterns may be passed as either an array of strings or as a
    space-separated string.

  @param {string|Array<string>} [options.dismissLocation]
    One or more [URL patterns](/url-patterns) that will cause this overlay to automatically be
    [dismissed](/closing-overlays) when the overlay reaches a matching [location](/up.layer.location).

    The [overlay result value](/closing-overlays#overlay-result-values)
    is an object of [named segments matches](/url-patterns#capturing-named-segments) captured
    by the URL pattern.

    Multiple URL patterns may be passed as either an array of strings or as a
    space-separated string.

  @param {Object} [options.context={}]
    The initial context object for the new overlay.

  @return {Promise<up.Layer>}
    A promise for the `up.Layer` object that models the new overlay.

    The promise will be resolved once the overlay was placed into the DOM.

  @stable
  ###
  open = (options) ->
    options = u.options(options,
      layer: 'new',
      defaultToEmptyContent: true,
      navigate: true
    )

    # Even if we are given { content } we need to pipe this through up.render()
    # since a lot of options processing is happening there.
    return up.render(options)

  ###**
  @event up:layer:opened
  @stable
  ###

  ###**
  This event is emitted after a layer's [location property](/up.Layer#location)
  has changed value.

  This event is also emitted when a layer [without history](/up.Layer#history)
  has reached a new location.

  @param {string} event.location
    The new location URL.
  @event up:layer:location:changed
  @experimental
  ###

  # TODO: Docs for up.layer.ask()
  #
  #  It's useful to think of overlays as [promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
  #  which may either be **fulfilled (accepted)** or **rejected (dismissed)**.
  #
  #  Instead of using `up.layer.open()` and passing callbacks, you may use `up.layer.ask()`.
  #  `up.layer.ask()` returns a promise for the acceptance value, which you can `await`:
  #
  #  ```js
  #  let user = await up.layer.ask({ url: '/users/new' })
  #  console.log("New user is " + user)
  #  ```
  ask = (options) ->
    return new Promise (resolve, reject) ->
      options = u.merge options,
        onAccepted: (event) -> resolve(event.value)
        onDismissed: (event) -> reject(event.value)
      open(options)

  anySelector = ->
    u.map(LAYER_CLASSES, (Class) -> Class.selector()).join(',')

  ###**
  [Follows](/a-up-follow) this link and opens the result in a new layer.

  TODO: Defaults to up.layer.config

  \#\#\# Example

  ```html
  <a href="/menu" up-layer="new">Open menu</a>
  ```

  @selector a[up-layer=new]
  @params-note
    All attributes for `a[up-follow]` may also be used.
  @param {string} [up-fail-layer]
    @see server-errors
  @param {string} [up-mode]
  @param {string} [up-position]
  @param {string} [up-align]
  @param {string} [up-size]
  @param {string} [up-class]
  @param {string} [up-dismissable]
  @param {string} [up-on-opened]
  @param {string} [up-on-accepted]
  @param {string} [up-on-dismissed]
  @param {string} [up-accept-event]
  @param {string} [up-dismiss-event]
  @param {string} [up-accept-location]
  @param {string} [up-dismiss-location]
  @param {string} [up-context]
  @stable
  ###

  ###**
  @selector a[up-dismiss]
  @param [up-dismiss]
  @stable
  ###

  ###**
  @selector a[up-accept]
  @param [up-accept]
  @stable
  ###

  up.on 'up:fragment:destroyed', (event) ->
    stack.sync()

  up.on 'up:framework:boot', ->
    stack = new up.LayerStack()

  up.on 'up:framework:reset', reset

  api = u.literal({
    config
    mainTargets
    open
    build
    ask
    normalizeOptions
    openCallbackAttr
    closeCallbackAttr
    anySelector
    get_stack: -> stack
  })

  ###**
  Returns the current layer in the [layer stack](/up.layer.stack).

  The *current* layer is usually the [frontmost layer](/up.layer.front).
  There are however some cases where the current layer is a layer in the background:

  - While an element in a background layer is [compiled](/up.compiler).
  - While an Unpoly event like `up:request:loaded` is being triggered from a background layer.
  - While a running event listener was bound to a background layer using `up.Layer#on()`.

  To temporarily change the current layer from your own code, use `up.Layer#asCurrent()`.

  @property up.layer.current
  @param {up.Layer} layer
  @stable
  ###
  u.delegate(api, [
    'get'
    'getAll'
    'root'
    'overlays'
    'current'
    'front'
    'sync'
  ], -> stack)

  u.delegate(api, [
    'accept'
    'dismiss'
    'isRoot'
    'isOverlay'
    'on'
    'off'
    'emit'
    'parent'
    'child'
    'ancestor'
    'descendants'
    'history'
    'location'
    'title'
    'mode'
    'context'
    'element'
    'contains'
    'size'
    'origin'
    'affix'
    'dismissable'
  ], -> stack.current)

  return api

u.getter up, 'context', -> up.layer.context
