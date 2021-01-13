u = up.util
e = up.element

up.popup = u.literal
  attach: (origin, options = {}) ->
    origin = up.fragment.get(origin)
    up.migrate.deprecated('up.popup.attach(origin, options)', "up.layer.open({ origin, layer: 'popup', ...options })")
    up.layer.open(u.merge(options, { origin, layer: 'popup' }))

  close: (options = {}) ->
    up.migrate.deprecated('up.popup.close()', 'up.layer.dismiss()')
    up.layer.dismiss(null, options)

  url: ->
    up.migrate.deprecated('up.popup.url()', 'up.layer.location')
    up.layer.location

  coveredUrl: ->
    up.migrate.deprecated('up.popup.coveredUrl()', 'up.layer.parent.location')
    up.layer.parent?.location

  get_config: ->
    up.migrate.deprecated('up.popup.config', 'up.layer.config.popup')
    up.layer.config.popup

  contains: (element) ->
    up.migrate.deprecated('up.popup.contains()', 'up.layer.contains()')
    up.layer.contains(element)

  isOpen: ->
    up.migrate.deprecated('up.popup.isOpen()', 'up.layer.isOverlay()')
    up.layer.isOverlay()

  sync: ->
    up.migrate.deprecated('up.popup.sync()', 'up.layer.sync()')
    up.layer.sync()

up.migrate.renamedEvent('up:popup:open', 'up:layer:open')
up.migrate.renamedEvent('up:popup:opened', 'up:layer:opened')
up.migrate.renamedEvent('up:popup:close', 'up:layer:dismiss')
up.migrate.renamedEvent('up:popup:closed', 'up:layer:dismissed')

up.link.targetMacro('up-popup', { 'up-layer': 'popup' }, -> up.migrate.deprecated('[up-popup]', '[up-layer=popup]'))
