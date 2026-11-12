# up.layer

@namespace up.layer

-----

# up.modal.visit()

Opens a modal overlay for the given URL.

@function up.modal.visit
@param {string} url
  The URL to load.
@param {Object} options
  See options for `up.render()`.
@deprecated
  Use `up.layer.open({ url, mode: "modal" })` instead.

-----

# up.modal.follow()

Opens the given link's destination in a modal overlay.

@function up.modal.follow
@param {Element|jQuery|string} linkOrSelector
  The link to follow.
@param {string} [options]
  See options for `up.render()`.
@return {Promise}
  A promise that will be fulfilled when the modal has been opened.
@deprecated
  Use `up.follow(link, { layer: "new modal" })` instead.

-----

# up.modal.extract()

[Extracts](/api/up.extract) the given CSS selector from the given HTML string and
opens the results in a modal overlay.

@function up.modal.extract
@param {string} selector
  The CSS selector to extract from the HTML.
@param {string} document
  The HTML containing the modal content.
@param {Object} options
  See options for [`up.modal.follow()`](/api/up.modal.follow).
@return {Promise}
  A promise that will be fulfilled when the modal has been opened.
@deprecated
  Use `up.layer.open({ document, mode: "modal" })` instead.

-----

# up.modal.close()

Closes a currently open overlay.

@function up.modal.close
@param {Object} options
@return {Promise}
@deprecated
  Use `up.layer.dismiss()` instead.

-----

# up.modal.url()

Returns the location URL of the fragment displayed in the current overlay.

@function up.modal.url
@return {string|undefined}
  The overlay's location URL.

  Returns `undefined` if the overlay has no location, e.g. when it was opened from a string of HTML.
@deprecated
  Use `up.layer.location` instead.

-----

# up.modal.coveredUrl()

Returns the location URL of the layer behind the current overlay.

@function up.modal.coveredUrl
@return {string|undefined}
  The location URL of the layer behind the current overlay.

  Returns `undefined` if no overlay is open.
@deprecated
  Use `up.layer.parent.location` instead.

-----

# up.modal.config

Sets default options for future modal overlays.

@property up.modal.config
@deprecated
  Use `up.layer.config.modal` instead.

-----

# up.modal.contains()

Returns whether the given element or selector is contained
within the current layer.

@function up.modal.contains
@param {Element|jQuery|string} elementOrSelector
  The element to test, or a CSS selector for it.
@return {boolean}
@deprecated
  Use `up.layer.contains()` instead.

-----

# up.modal.isOpen()

Returns whether an overlay is currently open.

@function up.modal.isOpen
@return {boolean}
@deprecated
  Use `up.layer.isOverlay()` instead.

-----

# [up-modal]

Clicking this link will load the destination and open
the given selector in a modal overlay.

@selector [up-modal]
@params-note
  All modifying attributes for `[up-layer=new]` may also be used.
@param {string} up-modal
  The CSS selector that will be extracted from the response and displayed in a modal overlay.
@deprecated
  Use `[up-layer="new modal"]` instead.

-----

# [up-drawer]

Clicking this link will load the destination and open
the given selector in a drawer overlay that slides in from the edge of the screen.

@selector [up-drawer]
@params-note
  All modifying attributes for `[up-layer=new]` may also be used.
@param {string} up-drawer
  The CSS selector that will be extracted from the response and displayed in a drawer overlay.
@deprecated
  Use `[up-layer="new drawer"]` instead.
