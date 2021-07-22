/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/***
Tooltips
========

Unpoly used to come with a basic tooltip implementation.
This feature is now deprecated.

@module up.tooltip
*/
up.tooltip = ((() => up.macro('[up-tooltip]', function(opener) {
  up.migrate.warn('[up-tooltip] has been deprecated. A [title] was set instead.');
  return up.element.setMissingAttr(opener, 'title', opener.getAttribute('up-tooltip'));
})))();
