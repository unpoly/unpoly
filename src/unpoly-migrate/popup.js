/*-
@module up.layer
*/

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
    Use `up.layer.open({ origin, layer: 'popup' })` instead.
  */
  attach(origin, options = {}) {
    origin = up.fragment.get(origin)
    up.migrate.deprecated('up.popup.attach(origin)', "up.layer.open({ origin, layer: 'popup' })")
    return up.layer.open({ ...options, origin, layer: 'popup' })
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
  @return {string}
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
  @return {string}
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
  @param {string} elementOrSelector
    The element to test
  @return {boolean}
  @deprecated
    Use `up.layer.contains()` instead.
  */
  contains(element) {
    up.migrate.deprecated('up.popup.contains()', 'up.layer.contains()')
    return up.layer.contains(element)
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
    up.migrate.deprecated('up.popup.sync()', 'up.layer.sync()')
    return up.layer.sync()
  }
}

up.migrate.renamedEvent('up:popup:open', 'up:layer:open')
up.migrate.renamedEvent('up:popup:opened', 'up:layer:opened')
up.migrate.renamedEvent('up:popup:close', 'up:layer:dismiss')
up.migrate.renamedEvent('up:popup:closed', 'up:layer:dismissed')

up.migrate.targetMacro('up-popup', { 'up-layer': 'new popup' }, () => up.migrate.deprecated('[up-popup]', '[up-layer="new popup"]'))
