###**
@module up.layer
###

up.migrate.handleLayerOptions = (options) ->
  up.migrate.fixKey(options, 'flavor', 'mode')
  up.migrate.fixKey(options, 'closable', 'dismissable')
  up.migrate.fixKey(options, 'closeLabel', 'dismissLabel')

  if options.width || options.maxWidth
    up.migrate.warn('Layer options { width } and { maxWidth } have been removed. Use { size } or { class } instead.')

  if options.sticky
    up.migrate.warn('Layer option { sticky } has been removed. Give links an [up-peel=false] attribute to prevent layer dismissal on click.')

  if options.template
    up.migrate.warn('Layer option { template } has been removed. Use { class } or modify the layer HTML on up:layer:open.')

  if options.layer == 'page'
    up.migrate.warn('Layer "page" has been renamed to "root"')
    options.layer = 'root'

up.migrate.handleTetherOptions = (options) ->
  [position, align] = options.position.split('-')

  if align
    up.migrate.warn('The position value %o is deprecated. Use %o instead.', options.position, { position, align })
    options.position = position
    options.align = align

up.migrate.registerLayerCloser = (layer) ->
  # <a up-close>Close</a> (legacy close attribute)
  layer.registerClickCloser 'up-close', (value, closeOptions) =>
    up.migrate.deprecated('[up-close]', '[up-dismiss]')
    layer.dismiss(value, closeOptions)
