/*-
Unpoly used to come with a basic tooltip implementation.
This feature is now deprecated.

@module up.tooltip
@internal
*/
up.macro('[up-tooltip]', function(opener) {
  up.migrate.warn('Attribute [up-tooltip] has been deprecated. Use a [title] attribute instead (found in %o).', opener)
  up.element.setMissingAttr(opener, 'title', opener.getAttribute('up-tooltip'))
})
