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

Note that `up.element.remove()` does *not* run [destructor functions](/up.destructor)
on the given elements. For this use `up.destroy()`.

@function up.element.remove
@param {Element} element
  The element to remove.
@deprecated
  Use [`Element#remove()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/remove) instead.
*/
up.element.remove = function(element) {
  up.migrate.deprecated('up.element.remove()', 'Element#remove()')
  return element.remove()
}

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
  Use [`Element#matches()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/matches) instead.
*/
up.util.matches = function(element, selector) {
  up.migrate.deprecated('up.element.matches()', 'Element#matches()')
  return element.matches(selector)
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
  Use [`Element#closest()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest) instead.
*/
up.element.closest = function(element, selector) {
  up.migrate.deprecated('up.element.closest()', 'Element#closest()')
  return element.closest(selector)
}

/*-
Replaces the given old element with the given new element.

The old element will be removed from the DOM tree.

@function up.element.replace
@param {Element} oldElement
@param {Element} newElement
@deprecated
  Use [`Element#replaceWith()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/replaceWith) instead.
*/
up.element.replace = function(oldElement, newElement) {
  up.migrate.deprecated('up.element.replace()', 'Element#replaceWith()')
  return oldElement.replaceWith(newElement)
}

/*-
Returns all descendant elements matching the given selector.

@function up.element.all
@param {Element} [parent=document]
  The parent element whose descendants to search.

  If omitted, all elements in the `document` will be searched.
@param {string} selector
  The CSS selector to match.
@return {NodeList<Element>|Array<Element>}
  A list of all elements matching the selector.

  Returns an empty list if there are no matches.
@deprecated
  Use [`Document#querySelectorAll()`](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll) or
  [`Element#querySelectorAll()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll) instead
*/
up.element.all = function(...args) {
  up.migrate.deprecated('up.element.all()', 'Document#querySelectorAll() or Element#querySelectorAll()')
  const selector = args.pop()
  const root = args[0] || document
  return root.querySelectorAll(selector)
}

/*-
Adds or removes the given class from the given element.

@function up.element.toggleClass
@param {Element} element
  The element for which to add or remove the class.
@param {string} className
  The class which should be added or removed.
@param {Boolean} [newPresent]
  Pass `true` to add the class to the element or `false` to remove it.

  If omitted, the class will be added if missing and removed if present.
@deprecated
  Use [`Element#classList.toggle(className)`](https://developer.mozilla.org/en-US/docs/Web/API/Element/classList) instead.
*/
up.element.toggleClass = function(element, klass, newPresent) {
  const list = element.classList
  if (newPresent == null) { newPresent = !list.contains(klass) }
  if (newPresent) {
    return list.add(klass)
  } else {
    return list.remove(klass)
  }
}

/*-
Returns a CSS selector that matches the given element as good as possible.

Alias for `up.fragment.toTarget()`.

@function up.element.toSelector
@param {string|Element|jQuery}
  The element for which to create a selector.
@deprecated
  Use `up.fragment.toTarget()` instead.
*/
up.element.toSelector = function(...args) {
  up.migrate.deprecated('up.element.toSelector()', 'up.fragment.toTarget()')
  return up.fragment.toTarget(...args)
}
