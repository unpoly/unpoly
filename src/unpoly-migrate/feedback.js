/*-
@module up.feedback
*/

up.migrate.renamedPackage('navigation', 'feedback')

up.feedback.config.patch(function(config) {
  up.migrate.renamedProperty(config, 'navs', 'navSelectors')
})
