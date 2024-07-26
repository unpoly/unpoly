/*-
@module up.layer
*/

const FLAVORS_ERROR = new Error('up.modal.flavors has been removed without direct replacement. You may give new layers a { class } or modify layer elements on up:layer:open.')

up.modal = {

  /*-
  Opens a modal overlay for the given URL.

  @function up.modal.visit
  @param {string} url
    The URL to load.
  @param {Object} options
    See options for `up.render()`.
  @deprecated
    Use `up.layer.open({ url, mode: "modal" })` instead.
  */
  visit(url, options = {}) {
    up.migrate.deprecated('up.modal.visit(url)', 'up.layer.open({ url, mode: "modal" })')
    return up.layer.open({ ...options, url, mode: 'modal' })
  },

  /*-
  Opens the given link's destination in a modal overlay.

  @function up.modal.follow
  @param {Element|jQuery|string} linkOrSelector
    The link to follow.
  @param {string} [options]
    See options for `up.render()`.
  @return {Promise}
    A promise that will be fulfilled when the modal has been opened.
  @deprecated
    Use `up.follow(link, { layer: "modal" })` instead.
  */
  follow(link, options = {}) {
    up.migrate.deprecated('up.modal.follow(link)', 'up.follow(link, { layer: "modal" })')
    return up.follow(link, { ...options, layer: 'modal' })
  },

  /*-
  [Extracts](/up.extract) the given CSS selector from the given HTML string and
  opens the results in a modal overlay.

  @function up.modal.extract
  @param {string} selector
    The CSS selector to extract from the HTML.
  @param {string} document
    The HTML containing the modal content.
  @param {Object} options
    See options for [`up.modal.follow()`](/up.modal.follow).
  @return {Promise}
    A promise that will be fulfilled when the modal has been opened.
  @deprecated
    Use `up.layer.open({ document, mode: "modal" })` instead.
  */
  extract(target, html, options = {}) {
    up.migrate.deprecated('up.modal.extract(target, document)', 'up.layer.open({ document, mode: "modal" })')
    return up.layer.open({ ...options, target, html, layer: 'modal' })
  },

  /*-
  Closes a currently open overlay.

  @function up.modal.close
  @param {Object} options
  @return {Promise}
  @deprecated
    Use `up.layer.dismiss()` instead.
  */
  close(options = {}) {
    up.migrate.deprecated('up.modal.close()', 'up.layer.dismiss()')
    up.layer.dismiss(null, options)
    return up.migrate.formerlyAsync('up.layer.dismiss()')
  },

  /*-
  Returns the location URL of the fragment displayed in the current overlay.

  @function up.modal.url
  @return {string}
  @deprecated
    Use `up.layer.location` instead.
  */
  url() {
    up.migrate.deprecated('up.modal.url()', 'up.layer.location')
    return up.layer.location
  },

  /*-
  Returns the location URL of the layer behind the current overlay.

  @function up.modal.coveredUrl
  @return {string}
  @deprecated
    Use `up.layer.parent.location` instead.
  */
  coveredUrl() {
    up.migrate.deprecated('up.modal.coveredUrl()', 'up.layer.parent.location')
    return up.layer.parent?.location
  },

  /*-
  Sets default options for future modal overlays.

  @property up.modal.config
  @deprecated
    Use `up.layer.config.modal` instead.
  */
  get config() {
    up.migrate.deprecated('up.modal.config', 'up.layer.config.modal')
    return up.layer.config.modal
  },

  /*-
  Returns whether the given element or selector is contained
  within the current layer.

  @function up.modal.contains
  @param {string} elementOrSelector
    The element to test
  @return {boolean}
  @deprecated
    Use `up.layer.contains()` instead.
  */
  contains(element) {
    up.migrate.deprecated('up.modal.contains()', 'up.layer.contains()')
    return up.layer.contains(element)
  },

  /*-
  Returns whether an overlay is currently open.

  @function up.modal.isOpen
  @return {boolean}
  @deprecated
    Use `up.layer.isOverlay()` instead.
  */
  isOpen() {
    up.migrate.deprecated('up.modal.isOpen()', 'up.layer.isOverlay()')
    return up.layer.isOverlay()
  },

  get flavors() {
    throw FLAVORS_ERROR
  },

  flavor() {
    throw FLAVORS_ERROR
  }
}

up.migrate.renamedEvent('up:modal:open', 'up:layer:open')
up.migrate.renamedEvent('up:modal:opened', 'up:layer:opened')
up.migrate.renamedEvent('up:modal:close', 'up:layer:dismiss')
up.migrate.renamedEvent('up:modal:closed', 'up:layer:dismissed')

/*-
Clicking this link will load the destination via AJAX and open
the given selector in a modal overlay.

@selector [up-modal]
@params-note
  All attributes for `[up-layer=new]` may also be used.
@param {string} up-modal
  The CSS selector that will be extracted from the response and displayed in a modal dialog.
@deprecated
  Use `[up-layer="new modal"]` instead.
*/
up.migrate.targetMacro('up-modal', { 'up-layer': 'new modal' }, () => up.migrate.deprecated('[up-modal]', '[up-layer="new modal"]'))

/*-
Clicking this link will load the destination via AJAX and open
the given selector in a modal drawer that slides in from the edge of the screen.

@selector a[up-drawer]
@params-note
  All attributes for `a[up-layer=new]` may also be used.
@param {string} up-drawer
  The CSS selector that will be extracted from the response and displayed in a modal dialog.
@deprecated
  Use `[up-layer="new drawer"]` instead.
*/
up.migrate.targetMacro('up-drawer', { 'up-layer': 'new drawer' }, () => up.migrate.deprecated('[up-drawer]', '[up-layer="new drawer"]'))
