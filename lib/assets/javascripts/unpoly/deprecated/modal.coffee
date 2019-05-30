up.legacy.renamedEvent('up:modal:open', 'up:layer:open')
up.legacy.renamedEvent('up:modal:opened', 'up:layer:opened')
up.legacy.renamedEvent('up:modal:close', 'up:layer:dismiss')
up.legacy.renamedEvent('up:modal:closed', 'up:layer:dismissed')

up.modal = u.literal
  visit: (url, options = {}) ->
    up.legacy.deprecated('up.modal.visit(url)', 'up.change({ url: url, flavor: "modal" })')
    up.change(u.merge(options, { url, flavor: 'modal' }))

  follow: (link, options = {}) ->
    up.legacy.deprecated('up.modal.follow(link)', 'up.follow(link, { flavor: "modal" })')
    up.follow(link, u.merge(options, { flavor: 'modal' }))

  extract: (target, html, options = {}) ->
    up.legacy.deprecated('up.modal.extract(target, html)', 'up.change(target, { document: html, flavor: "modal" })')
    up.change(u.merge(options, { target, document: html, flavor: 'modal' }))

  close: (options = {}) ->
    up.legacy.deprecated('up.modal.close()', 'up.layer.close()')
    up.layer.close(options)

  url: ->
    up.legacy.deprecated('up.modal.url()', 'up.layer.location')
    up.layer.location

  coveredURL: ->
    up.legacy.deprecated('up.modal.coveredURL()', 'up.layer.parent.location')
    up.layer.parent.location

  get_config: ->
    up.legacy.deprecated('up.modal.config', 'up.layer.config.modal')
    up.layer.config.modal

  contains: (element) ->
    up.legacy.deprecated('up.modal.contains()', 'up.layer.contains()')
    up.layer.contains(element)

  isOpen: ->
    up.legacy.deprecated('up.modal.isOpen()', 'up.layer.isOpen()')
    up.layer.isOpen()

  get_flavors: ->
    throw 'up.modal.flavors has been removed without replacement'

  flavor: ->
    throw 'up.modal.flavor() has been removed without replacement'
