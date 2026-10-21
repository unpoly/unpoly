/*-
@module up.layer
*/

// Renamed keys and values that may be passed as layer options or set in a layer config object.
function fixRenamedLayerKeys(object, label) {
  up.migrate.fixKey(object, 'closable', 'dismissible', { label })
  up.migrate.fixKey(object, 'dismissable', 'dismissible', { label })
  up.migrate.fixKey(object, 'closeLabel', 'dismissLabel', { label })
  up.migrate.fixKey(object, 'dismissAriaLabel', 'dismissARIALabel', { label })
  up.migrate.fixKey(object, 'historyVisible', 'history', { label })
  splitPosition(object)
}

// Popups used to combine their position and alignment in a single value like 'bottom-right'.
// We split it before the layer is built, so the layer and its element see the modern { position, align }.
function splitPosition(object) {
  if (!up.util.isString(object.position)) return

  const [position, align] = object.position.split('-')

  if (align) {
    up.migrate.warn('The position value %o is deprecated. Use %o instead.', object.position, { position, align })
    object.position = position
    object.align = align
  }
}

up.migrate.handleLayerOptions = function(options) {
  // Only options can have a { flavor }, since a config object belongs to a mode.
  up.migrate.fixKey(options, 'flavor', 'mode', { label: 'layer options' })
  fixRenamedLayerKeys(options, 'layer options')

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

// Apps usually configure layers before Unpoly boots, so we check all mode configs once at boot.
up.migrate.fixLayerConfigs = function() {
  for (let [mode, modeConfig] of Object.entries(up.layer.config)) {
    if (up.util.isOptions(modeConfig)) {
      fixRenamedLayerKeys(modeConfig, `up.layer.config.${mode}`)
    }
  }
}

up.on('up:framework:boot', up.migrate.fixLayerConfigs)

// The app may still set a renamed key after booting, so we also check the mode configs for every new layer.
// Since the warning names the config object, it is only printed once per key and config object.
up.migrate.handleLayerConfig = function(modeConfig) {
  let [mode] = Object.entries(up.layer.config).find(([_mode, value]) => value === modeConfig)
  fixRenamedLayerKeys(modeConfig, `up.layer.config.${mode}`)
}

Object.defineProperty(up.Layer.prototype, 'historyVisible', { get: function() {
  up.migrate.deprecated('up.Layer#historyVisible', 'up.Layer#history')
  return this.history
} })

