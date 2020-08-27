u = up.util

FLAVORS_ERROR = 'up.modal.flavors has been removed without direct replacement. You may give new layers a { class } or modify layer elements on up:layer:open.'

up.modal = u.literal
  visit: (url, options = {}) ->
    up.legacy.deprecated('up.modal.visit(url)', 'up.layer.open({ url, mode: "modal" })')
    up.layer.open(u.merge(options, { url, mode: 'modal' }))

  follow: (link, options = {}) ->
    up.legacy.deprecated('up.modal.follow(link)', 'up.follow(link, { layer: "modal" })')
    up.follow(link, u.merge(options, { layer: 'modal' }))

  extract: (target, html, options = {}) ->
    up.legacy.deprecated('up.modal.extract(target, document)', 'up.layer.open({ document, mode: "modal" })')
    up.layer.open(u.merge(options, { target, html, layer: 'modal' }))

  close: (options = {}) ->
    up.legacy.deprecated('up.modal.close()', 'up.layer.dismiss()')
    up.layer.dismiss(null, options)

  url: ->
    up.legacy.deprecated('up.modal.url()', 'up.layer.location')
    up.layer.location

  coveredUrl: ->
    up.legacy.deprecated('up.modal.coveredUrl()', 'up.layer.parent.location')
    up.layer.parent?.location

  get_config: ->
    up.legacy.deprecated('up.modal.config', 'up.layer.config.modal')
    up.layer.config.modal

  contains: (element) ->
    up.legacy.deprecated('up.modal.contains()', 'up.layer.contains()')
    up.layer.contains(element)

  isOpen: ->
    up.legacy.deprecated('up.modal.isOpen()', 'up.layer.isOverlay()')
    up.layer.isOverlay()

  get_flavors: ->
    throw FLAVORS_ERROR

  flavor: ->
    throw FLAVORS_ERROR

up.legacy.renamedEvent('up:modal:open', 'up:layer:open')
up.legacy.renamedEvent('up:modal:opened', 'up:layer:opened')
up.legacy.renamedEvent('up:modal:close', 'up:layer:dismiss')
up.legacy.renamedEvent('up:modal:closed', 'up:layer:dismissed')

up.link.targetMacro('up-modal', { 'up-layer': 'modal' }, -> up.legacy.deprecated('[up-modal]', '[up-layer=modal]'))
up.link.targetMacro('up-drawer', { 'up-layer': 'drawer' }, -> up.legacy.deprecated('[up-drawer]', '[up-layer=drawer]'))
