###**
@module up.history
###

up.migrate.renamedProperty(up.history.config, 'popTargets', 'restoreTargets')

###**
Returns a normalized URL for the current history entry.

@function up.history.url
@return {string}
@deprecated Use the `up.history.location` property instead.
###
up.history.url = ->
  up.migrate.deprecated('up.history.url()', 'up.history.location')
  return up.history.location

up.migrate.renamedEvent('up:history:push', 'up:location:changed')
up.migrate.renamedEvent('up:history:pushed', 'up:location:changed')
up.migrate.renamedEvent('up:history:restore', 'up:location:changed')
up.migrate.renamedEvent('up:history:restored', 'up:location:changed')
# There was never an up:history:replace (present tense) event
up.migrate.renamedEvent('up:history:replaced', 'up:location:changed')
