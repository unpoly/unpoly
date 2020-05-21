u = up.util
e = up.element

up.popup = u.literal
  attach: (origin, options = {}) ->
    origin = up.fragment.get(origin)
    up.legacy.deprecated('up.popup.attach(origin, options)', "up.layer.open({ origin, layer: 'popup', ...options })")
    up.layer.open(u.merge(options, { origin, layer: 'popup' }))

  close: (options = {}) ->
    up.legacy.deprecated('up.popup.close()', 'up.layer.dismiss()')
    up.layer.dismiss(null, options)

  url: ->
    up.legacy.deprecated('up.popup.url()', 'up.layer.location')
    up.layer.location

  coveredUrl: ->
    up.legacy.deprecated('up.popup.coveredUrl()', 'up.layer.parent.location')
    up.layer.parent?.location

  get_config: ->
    up.legacy.deprecated('up.popup.config', 'up.layer.config.popup')
    up.layer.config.popup

  contains: (element) ->
    up.legacy.deprecated('up.popup.contains()', 'up.layer.contains()')
    up.layer.contains(element)

  isOpen: ->
    up.legacy.deprecated('up.popup.isOpen()', 'up.layer.isOverlay()')
    up.layer.isOverlay()

  sync: ->
    up.legacy.deprecated('up.popup.sync()', 'up.layer.sync()')
    up.layer.sync()

up.legacy.renamedEvent('up:popup:open', 'up:layer:open')
up.legacy.renamedEvent('up:popup:opened', 'up:layer:opened')
up.legacy.renamedEvent('up:popup:close', 'up:layer:dismiss')
up.legacy.renamedEvent('up:popup:closed', 'up:layer:dismissed')

up.link.targetMacro('up-popup', { 'up-layer': 'popup' }, -> up.legacy.deprecated('[up-popup]', '[up-layer=popup]'))
