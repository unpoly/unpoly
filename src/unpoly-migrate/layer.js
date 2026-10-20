/*-
@module up.layer
*/

// Renamed keys that may be passed as layer options or set in a layer config object.
function fixRenamedLayerKeys(object) {
  up.migrate.fixKey(object, 'closable', 'dismissible')
  up.migrate.fixKey(object, 'dismissable', 'dismissible')
  up.migrate.fixKey(object, 'closeLabel', 'dismissLabel')
  up.migrate.fixKey(object, 'dismissAriaLabel', 'dismissARIALabel')
  up.migrate.fixKey(object, 'historyVisible', 'history')
}

up.migrate.handleLayerOptions = function(options) {
  // Only options can have a { flavor }, since a config object belongs to a mode.
  up.migrate.fixKey(options, 'flavor', 'mode')
  fixRenamedLayerKeys(options)

  for (let dimensionKey of ['width', 'maxWidth', 'height']) {
    if (options[dimensionKey]) {
      up.migrate.warn(`Layer option { ${dimensionKey} } has been removed. Use { size } or { class } instead.`)
    }
  }

  if (options.sticky) {
    up.migrate.warn('Layer option { sticky } has been removed. Give links an [up-peel=false] attribute to prevent layer dismissal on click.')
  }

  if (options.template) {
    up.migrate.warn('Layer option { template } has been removed. Use { class } or modify the layer HTML on up:layer:open.')
  }

  if (options.layer === 'page') {
    up.migrate.warn("Option { layer: 'page' } has been renamed to { layer: 'root' }.")
    options.layer = 'root'
  }

  if ((options.layer === 'modal') || (options.layer === 'popup')) {
    up.migrate.warn(`Option { layer: '${options.layer}' } has been removed. Did you mean { layer: 'overlay' }?`)
    options.layer = 'overlay'
  }

  if (up.util.isMissing(options.layer) && up.util.isGiven(options.mode)) {
    up.migrate.warn('Opening a layer with only a { mode } option is deprecated. Pass { layer: "new", mode } instead.')
    options.layer = 'new'
  }

}

// Until 3.14, listeners could not prevent peeling. Since 3.15 they can, unless the app sets
// up.layer.config.forcePeel = true. We keep the core default (false), but track whether the app
// has chosen a value. Until it has, we keep the 3.14 behavior and warn when a listener tries
// to prevent peeling.
//
// up.Config#reset() assigns the default after every up:framework:reset, which would go through our
// setter and count as chosen. Because patch() runs again after each reset, we set the value here.
up.layer.config.patch(function() {
  this.forcePeelValue = false
  this.forcePeelSet = false

  Object.defineProperty(this, 'forcePeel', {
    configurable: true,
    get() {
      return this.forcePeelValue
    },
    set(value) {
      this.forcePeelValue = value
      this.forcePeelSet = true
    }
  })
})

// A capture listener on the document runs before any listener of the app.
function warnOfPreventedPeel(event) {
  // (1) Only peeling changed in 3.15. A listener could always prevent other kinds of closing.
  // (2) Forced peels, like restoring history with the back button or [up-peel="force"], ignore
  //     prevented events in 3.15 too. The overlay closes either way, so there is nothing to warn about.
  // (3) Once the app has chosen a value for up.layer.config.forcePeel, it gets the 3.15 behavior.
  if (event.value !== ':peel' || event.force || up.layer.config.forcePeelSet) return

  // We ignore the listener's preventDefault() call, so the overlay closes like it did in 3.14.
  // Otherwise apps that upgrade with unpoly-migrate.js would see overlays stay open that used to close.
  event.preventDefault = function() {
    up.migrate.warn('A listener tried to keep an overlay open while peeling. Choose with up.layer.config.forcePeel: false keeps it open (new default), true closes it (old behavior).')
  }
}

for (let type of ['up:layer:dismiss', 'up:layer:accept']) {
  document.addEventListener(type, warnOfPreventedPeel, { capture: true })
}

up.migrate.handleTetherOptions = function(options) {
  const [position, align] = options.position.split('-')

  if (align) {
    up.migrate.warn('The position value %o is deprecated. Use %o instead.', options.position, { position, align })
    options.position = position
    options.align = align
  }
}

/*-
When this element is clicked, closes a currently open overlay.

Does nothing if no overlay is currently open.

To make a link that closes the current overlay, but follows to
a fallback destination on the root layer:

    <a href="/fallback" up-close>Okay</a>

@selector [up-close]
@deprecated
  Use `[up-dismiss]` instead.
*/
up.migrate.registerLayerCloser = (layer) => // <a up-close>Close</a> (legacy close attribute)
layer.registerAttrCloser('up-close', (value, closeOptions) => {
  up.migrate.deprecated('[up-close]', '[up-dismiss]')
  layer.dismiss(value, closeOptions)
})

up.migrate.handleLayerConfig = fixRenamedLayerKeys

Object.defineProperty(up.Layer.prototype, 'historyVisible', { get: function() {
  up.migrate.deprecated('up.Layer#historyVisible', 'up.Layer#history')
  return this.history
} })

