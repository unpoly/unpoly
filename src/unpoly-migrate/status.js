/*-
@module up.status
*/

up.migrate.renamedPackage('navigation', 'status')
up.migrate.renamedPackage('feedback', 'status')

up.status.config.patch(function(config) {
  up.migrate.renamedProperty(config, 'navs', 'navSelectors')
})
