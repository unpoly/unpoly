# up.Layer

@class up.Layer

-----

# up.Layer#origin

The button or link that opened this overlay.

@property up.Layer#origin
@param {Element} origin
  The element that opened this overlay.
@stable

-----

# up.Layer#size

The [size](/learn/customizing-overlays#overlay-sizes) of this overlay.

Returns a string like `'medium'` or `'large'`.

@property up.Layer#size
@param {string} size
  This layer's size setting.
@stable

-----

# up.Layer#position

The [position](/learn/customizing-overlays#popup-position) of this popup or drawer overlay.

Returns a string like `'top'`, '`right`', `'bottom'` or `'left'`.

@property up.Layer#position
@param {string} [position]
  This layer's position setting.
@stable

-----

# up.Layer#align

The [alignment](/learn/customizing-overlays#popup-position) of this popup overlay.

Returns a string like `'left'` or `'right'`.

Returns `undefined` for an overlay that isn't a popup.

@property up.Layer#align
@param {string} align
  This layer's alignment setting.
@stable

-----

# up.Layer.prototype.destroyElements()

Destroys the elements that make up this overlay.

@function up.Layer.prototype.destroyElements
@param {string|Function(Element, Object)} [options.animation=this.closeAnimation]
@param {number} [options.duration=this.closeDuration]
@param {string} [options.easing=this.closeEasing]
@param {Function} [options.onFinished]
  A callback that will run when the elements have been removed from the DOM.
  If the destruction is animated, the callback will run after the animation has finished.
@return {Promise}
  A resolved promise.
@internal
