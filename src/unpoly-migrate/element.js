/*-
@module up.element
*/

/*-
Returns the first descendant element matching the given selector.

@function up.element.first
@param {Element} [parent=document]
  The parent element whose descendants to search.

  If omitted, all elements in the `document` will be searched.
@param {string} selector
  The CSS selector to match.
@return {Element|undefined|null}
  The first element matching the selector.

  Returns `null` or `undefined` if no element macthes.
@deprecated
  Use `up.element.get()` instead.
*/
up.element.first = function(...args) {
  up.migrate.deprecated('up.element.first()', 'up.element.get()')
  return up.element.get(...args)
}

up.element.createFromHtml = function(...args) {
  up.migrate.deprecated('up.element.createFromHtml()', 'up.element.createFromHTML()')
  return up.element.createFromHTML(...args)
}
