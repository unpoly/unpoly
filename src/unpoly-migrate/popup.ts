type ElementOrSelector = import('../unpoly/element.js').ElementOrSelector
type RenderOptions = import('../unpoly/fragment.js').RenderOptions
type Layer = import('../unpoly/layer.js').Layer
type LayerCloseOptions = import('../unpoly/layer.js').LayerCloseOptions
type OverlayDefaults = import('../unpoly/layer.js').OverlayDefaults

/*-
@namespace up.layer
*/

/**
The type of `up.popup`, whose functions moved to up.layer.
@internal
*/
interface PopupApi {
  attach(origin: ElementOrSelector, options?: RenderOptions): Promise<Layer>
  close(options?: LayerCloseOptions): Promise<void>
  url(): string | undefined
  coveredUrl(): string | undefined
  readonly config: OverlayDefaults
  contains(elementOrSelector: ElementOrSelector): boolean
  isOpen(): boolean
  sync(): void
}

declare module '../unpoly.js' {
  interface Up {
    popup: PopupApi
  }
}

up.popup = {
  /*-
  Attaches a popup overlay to the given element or selector.

  @function up.popup.attach
  @param {Element|jQuery|string} anchor
    The element to which the popup will be attached.
  @param {Object} [options]
    See options for `up.render()`.
  @return {Promise}
  @deprecated
    Use `up.layer.open({ origin, mode: 'popup' })` instead.
  */
  attach(origin, options = {}) {
    origin = up.fragment.get(origin)
    up.migrate.deprecated('up.popup.attach(origin)', "up.layer.open({ origin, mode: 'popup' })")
    return up.layer.open({ ...options, origin, layer: 'new', mode: 'popup' })
  },

  /*-
  Closes a currently open overlay.

  @function up.popup.close
  @param {Object} options
  @return {Promise}
  @deprecated
    Use `up.layer.dismiss()` instead.
  */
  close(options = {}) {
    up.migrate.deprecated('up.popup.close()', 'up.layer.dismiss()')
    up.layer.dismiss(null, options)
    return up.migrate.formerlyAsync('up.layer.dismiss()')
  },

  /*-
  Returns the location URL of the fragment displayed in the current overlay.

  @function up.popup.url
  @return {string|undefined}
    The overlay's location URL.

    Returns `undefined` if the overlay has no location, e.g. when it was opened from a string of HTML.
  @deprecated
    Use `up.layer.location` instead.
  */
  url() {
    up.migrate.deprecated('up.popup.url()', 'up.layer.location')
    return up.layer.location
  },

  /*-
  Returns the location URL of the layer behind the current overlay.

  @function up.popup.coveredUrl
  @return {string|undefined}
    The location URL of the layer behind the current overlay.

    Returns `undefined` if no overlay is open.
  @deprecated
    Use `up.layer.parent.location` instead.
  */
  coveredUrl() {
    up.migrate.deprecated('up.popup.coveredUrl()', 'up.layer.parent.location')
    return up.layer.parent?.location
  },

  /*-
  Sets default options for future popup overlays.

  @property up.popup.config
  @deprecated
    Use `up.layer.config.popup` instead.
  */
  get config() {
    up.migrate.deprecated('up.popup.config', 'up.layer.config.popup')
    return up.layer.config.popup
  },

  /*-
  Returns whether the given element or selector is contained
  within the current layer.

  @function up.popup.contains
  @param {Element|jQuery|string} elementOrSelector
    The element to test, or a CSS selector for it.
  @return {boolean}
  @deprecated
    Use `up.layer.contains()` instead.
  */
  contains(elementOrSelector) {
    up.migrate.deprecated('up.popup.contains()', 'up.layer.contains()')
    let element = up.fragment.get(elementOrSelector)
    return !!element && up.layer.contains(element)
  },

  /*-
  Returns whether an overlay is currently open.

  @function up.popup.isOpen
  @return {boolean}
  @deprecated
    Use `up.layer.isOverlay()` instead.
  */
  isOpen() {
    up.migrate.deprecated('up.popup.isOpen()', 'up.layer.isOverlay()')
    return up.layer.isOverlay()
  },

  sync() {
    up.migrate.deprecated('up.popup.sync()', 'up.Layer#sync()')
    for (let layer of up.layer.stack) {
      layer.sync()
    }
  }
}

// Don't warn when a script enumerates up.popup. Getters in an object literal are enumerable.
Object.defineProperty(up.popup, 'config', { enumerable: false })

up.migrate.renamedEvent('up:popup:open', 'up:layer:open')
up.migrate.renamedEvent('up:popup:opened', 'up:layer:opened')
up.migrate.renamedEvent('up:popup:close', 'up:layer:dismiss')
up.migrate.renamedEvent('up:popup:closed', 'up:layer:dismissed')

/*-
Clicking this link will load the destination and open
the given selector in a popup overlay.

@selector [up-popup]
@params-note
  All modifying attributes for `[up-layer=new]` may also be used.
@param {string} up-popup
  The CSS selector that will be extracted from the response and displayed in a popup overlay.
@deprecated
  Use `[up-layer="new popup"]` instead.
*/
up.migrate.targetMacro('up-popup', { 'up-layer': 'new popup' }, '[up-layer="new popup"]')
