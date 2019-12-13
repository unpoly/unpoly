u = up.util

up.modal = u.literal
  visit: (url, options = {}) ->
    up.legacy.deprecated('up.modal.visit(url)', 'up.change({ url, layer: "modal" })')
    up.change(u.merge(options, { url, layer: 'modal' }))

  follow: (link, options = {}) ->
    up.legacy.deprecated('up.modal.follow(link)', 'up.follow(link, { layer: "modal" })')
    up.follow(link, u.merge(options, { layer: 'modal' }))

  extract: (target, html, options = {}) ->
    up.legacy.deprecated('up.modal.extract(target, html)', 'up.change(target, { html, layer: "modal" })')
    up.change(u.merge(options, { target, html, layer: 'modal' }))

  close: (options = {}) ->
    up.legacy.deprecated('up.modal.close()', 'up.layer.dismiss()')
    up.layer.dismiss(options)

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
    throw 'up.modal.flavors has been removed without replacement'

  flavor: ->
    throw 'up.modal.flavor() has been removed without replacement'

up.legacy.renamedEvent('up:modal:open', 'up:layer:open')
up.legacy.renamedEvent('up:modal:opened', 'up:layer:opened')
up.legacy.renamedEvent('up:modal:close', 'up:layer:dismiss')
up.legacy.renamedEvent('up:modal:closed', 'up:layer:dismissed')
