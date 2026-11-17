up.macro('[up-tooltip]', function(opener) {
  up.migrate.warn('Attribute [up-tooltip] has been deprecated. Use a [title] attribute instead (found in %o).', opener)
  up.internal.setMissingAttr(opener, 'title', opener.getAttribute('up-tooltip'))
})
