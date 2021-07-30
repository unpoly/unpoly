/*-
@module up.viewport
*/

up.migrate.renamedPackage('layout', 'viewport')

up.migrate.renamedProperty(up.viewport.config, 'viewports', 'viewportSelectors')
up.migrate.renamedProperty(up.viewport.config, 'snap', 'revealSnap')

/*-
Returns the scrolling container for the given element.

Returns the [document's scrolling element](/up.viewport.root)
if no closer viewport exists.

@function up.viewport.closest
@param {string|Element|jQuery} target
@return {Element}
@deprecated
  Use `up.viewport.get()` instead.
*/
up.viewport.closest = function(...args) {
  up.migrate.deprecated('up.viewport.closest()', 'up.viewport.get()')
  return up.viewport.get(...args)
}
