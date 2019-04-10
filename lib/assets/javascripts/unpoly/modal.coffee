up.legacy.renamedEvent('up:modal:open', 'up:layer:open')
up.legacy.renamedEvent('up:modal:opened', 'up:layer:opened')
up.legacy.renamedEvent('up:modal:close', 'up:layer:dismiss')
up.legacy.renamedEvent('up:modal:closed', 'up:layer:dismissed')

up.modal = u.literal
  visit: (args...) ->
    up.legacy.warn('up.modal.visit() has been deprecated. Use up.visit() instead.')
    throw "need to close first"
    up.visit(args...)

  follow: (args...) ->

  extract: (args...) ->

  close: (args...) ->

  url: ->

  get_config: ->

  get_flavors: ->

  contains: (args...) ->



throw "wenn wir den getter style machen, kann man nicht mit { layer: 'parent' } auf einen anderen layer gehen"
