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

const MATCH_FN_NAME = up.browser.isIE11() ? 'msMatchesSelector' : 'matches'

/*-
Returns whether the given element matches the given CSS selector.

To match against a non-standard selector like `:main`,
use `up.fragment.matches()` instead.

@function up.element.matches
@param {Element} element
  The element to check.
@param {string} selector
  The CSS selector to match.
@return {boolean}
  Whether `element` matches `selector`.
@deprecated
  Use [`Element.prototype.matches()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/matches) instead.
*/
up.util.matches = function(element, selector) {
  up.migrate.deprecated('up.element.matches()', 'Element.prototype.matches()')

  return element[MATCH_FN_NAME]?.(selector)
}

/*-
Returns the first element that matches the selector by testing the element itself
and traversing up through its ancestors in the DOM tree.

@function up.element.closest
@param {Element} element
  The element on which to start the search.
@param {string} selector
  The CSS selector to match.
@return {Element|null|undefined} element
  The matching element.

  Returns `null` or `undefined` if no element matches.
@deprecated
  Use [`Element.prototype.closest()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest) instead.
*/
up.element.closest = function(element, selector) {
  if (element.closest) {
    return element.closest(selector)
    // If the browser doesn't support Element#closest, we mimic the behavior.
  } else if (element.matches(selector)) {
    return element
  } else {
    return up.element.ancestor(element, selector)
  }
}
