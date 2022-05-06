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

/*-
Removes the given element from the DOM tree.

If you don't need IE11 support you may also use the built-in
[`Element#remove()`](https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/remove) to the same effect.

Note that `up.element.remove()` does *not* run [destructor functions](/up.destructor)
on the given elements. For this use `up.destroy()`.

@function up.element.remove
@param {Element} element
  The element to remove.
@deprecated
  Use [`Element#remove()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/remove) instead.
*/
up.element.remove = function(element) {
  up.migrate.deprecated('up.element.remove()', 'Element.prototype.remove()')

  // IE does not support Element#remove()
  let parent = element.parentNode
  if (parent) {
    parent.removeChild(element)
  }
}
