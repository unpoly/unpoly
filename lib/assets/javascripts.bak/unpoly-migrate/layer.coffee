###**
@module up.layer
###

up.migrate.handleLayerOptions = (options) ->
  up.migrate.fixKey(options, 'flavor', 'mode')
  up.migrate.fixKey(options, 'closable', 'dismissable')
  up.migrate.fixKey(options, 'closeLabel', 'dismissLabel')

  for dimensionKey in ['width', 'maxWidth', 'height']
    if options[dimensionKey]
      up.migrate.warn("Layer option { #{dimensionKey} } has been removed. Use { size } or { class } instead.")

  if options.sticky
    up.migrate.warn('Layer option { sticky } has been removed. Give links an [up-peel=false] attribute to prevent layer dismissal on click.')

  if options.template
    up.migrate.warn('Layer option { template } has been removed. Use { class } or modify the layer HTML on up:layer:open.')

  if options.layer == 'page'
    up.migrate.warn("Option { layer: 'page' } has been renamed to { layer: 'root' }.")
    options.layer = 'root'

  if options.layer == 'modal' || options.layer == 'popup'
    up.migrate.warn("Option { layer: '#{options.layer}' } has been removed. Did you mean { layer: 'overlay' }?")
    options.layer = 'overlay'

up.migrate.handleTetherOptions = (options) ->
  [position, align] = options.position.split('-')

  if align
    up.migrate.warn('The position value %o is deprecated. Use %o instead.', options.position, { position, align })
    options.position = position
    options.align = align

###**
When this element is clicked, closes a currently open overlay.

Does nothing if no overlay is currently open.

To make a link that closes the current overlay, but follows to
a fallback destination on the root layer:

    <a href="/fallback" up-close>Okay</a>

@selector a[up-close]
@deprecated
  Use `a[up-dismiss]` instead.
###
up.migrate.registerLayerCloser = (layer) ->
  # <a up-close>Close</a> (legacy close attribute)
  layer.registerClickCloser 'up-close', (value, closeOptions) =>
    up.migrate.deprecated('[up-close]', '[up-dismiss]')
    layer.dismiss(value, closeOptions)

up.migrate.handleLayerConfig = (config) ->
  up.migrate.fixKey(config, 'historyVisible', 'history')

up.util.getter up.Layer.prototype, 'historyVisible', ->
  up.migrate.deprecated('up.Layer#historyVisible', 'up.Layer#history')
  return @history
