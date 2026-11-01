/*-
@namespace up.status
*/

up.migrate.renamedNamespace('navigation', 'status')
up.migrate.renamedNamespace('feedback', 'status')

up.status.config.patch(function(config) {
  up.migrate.renamedProperty(config, 'navs', 'navSelectors', { label: 'up.status.config' })
})
