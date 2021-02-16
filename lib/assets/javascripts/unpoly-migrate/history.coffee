###**
@module up.history
###

up.migrate.renamedProperty(up.history.config, 'popTargets', 'restoreTargets')

up.history.url = ->
  up.migrate.deprecated('up.history.url()', 'up.history.location')
  return up.history.location
