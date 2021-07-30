/*-
Tooltips
========

Unpoly used to come with a basic tooltip implementation.
This feature is now deprecated.

@module up.tooltip
*/
up.macro('[up-tooltip]', function(opener) {
  up.migrate.warn('[up-tooltip] has been deprecated. A [title] was set instead.')
  up.element.setMissingAttr(opener, 'title', opener.getAttribute('up-tooltip'))
})
