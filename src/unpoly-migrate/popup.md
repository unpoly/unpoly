# up.layer

@namespace up.layer

-----

# up.popup.attach()

Attaches a popup overlay to the given element or selector.

@function up.popup.attach
@param {Element|jQuery|string} anchor
  The element to which the popup will be attached.
@param {Object} [options]
  See options for `up.render()`.
@return {Promise}
@deprecated
  Use `up.layer.open({ origin, mode: 'popup' })` instead.

-----

# up.popup.close()

Closes a currently open overlay.

@function up.popup.close
@param {Object} options
@return {Promise}
@deprecated
  Use `up.layer.dismiss()` instead.

-----

# up.popup.url()

Returns the location URL of the fragment displayed in the current overlay.

@function up.popup.url
@return {string|undefined}
  The overlay's location URL.

  Returns `undefined` if the overlay has no location, e.g. when it was opened from a string of HTML.
@deprecated
  Use `up.layer.location` instead.

-----

# up.popup.coveredUrl()

Returns the location URL of the layer behind the current overlay.

@function up.popup.coveredUrl
@return {string|undefined}
  The location URL of the layer behind the current overlay.

  Returns `undefined` if no overlay is open.
@deprecated
  Use `up.layer.parent.location` instead.

-----

# up.popup.config

Sets default options for future popup overlays.

@property up.popup.config
@deprecated
  Use `up.layer.config.popup` instead.

-----

# up.popup.contains()

Returns whether the given element or selector is contained
within the current layer.

@function up.popup.contains
@param {Element|jQuery|string} elementOrSelector
  The element to test, or a CSS selector for it.
@return {boolean}
@deprecated
  Use `up.layer.contains()` instead.

-----

# up.popup.isOpen()

Returns whether an overlay is currently open.

@function up.popup.isOpen
@return {boolean}
@deprecated
  Use `up.layer.isOverlay()` instead.

-----

# [up-popup]

Clicking this link will load the destination and open
the given selector in a popup overlay.

@selector [up-popup]
@params-note
  All modifying attributes for `[up-layer=new]` may also be used.
@param {string} up-popup
  The CSS selector that will be extracted from the response and displayed in a popup overlay.
@deprecated
  Use `[up-layer="new popup"]` instead.
