u = up.util

up.popup = u.literal
  attach: (element, options = {}) ->
    up.legacy.deprecated('up.popup.attach(element, options)', 'up.layer.open({ origin: origin, ...options })')
    up.follow(link, u.merge(options, { flavor: 'popup' }))

  close: (options = {}) ->
    up.legacy.deprecated('up.popup.close()', 'up.layer.close()')
    up.layer.close(options)

  url: ->
    up.legacy.deprecated('up.popup.url()', 'up.layer.location')
    up.layer.location

  coveredURL: ->
    up.legacy.deprecated('up.popup.coveredURL()', 'up.layer.parent.location')
    up.layer.parent.location

  get_config: ->
    up.legacy.deprecated('up.popup.config', 'up.layer.config.popup')
    up.layer.config.popup

  contains: (element) ->
    up.legacy.deprecated('up.popup.contains()', 'up.layer.contains()')
    up.layer.contains(element)

  isOpen: ->
    up.legacy.deprecated('up.popup.isOpen()', 'up.layer.isOpen()')
    up.layer.isOpen()

  sync: ->
    up.legacy.deprecated('up.popup.sync()', 'up.layer.sync()')
    up.layer.sync()

up.legacy.renamedEvent('up:popup:open', 'up:layer:open')
up.legacy.renamedEvent('up:popup:opened', 'up:layer:opened')
up.legacy.renamedEvent('up:popup:close', 'up:layer:dismiss')
up.legacy.renamedEvent('up:popup:closed', 'up:layer:dismissed')
