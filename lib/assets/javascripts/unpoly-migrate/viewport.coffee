###**
@module up.viewport
###

up.migrate.renamedPackage 'layout', 'viewport'

up.migrate.renamedProperty(up.viewport.config, 'viewports', 'viewportSelectors')
up.migrate.renamedProperty(up.viewport.config, 'snap', 'revealSnap')

up.viewport.closest = (args...) ->
  up.migrate.deprecated('up.viewport.closest()', 'up.viewport.get()')
  return up.viewport.get(args...)
