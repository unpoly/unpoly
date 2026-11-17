# up.element

@namespace up.element

-----

# up.element.first()

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

-----

# up.element.remove()

Removes the given element from the DOM tree.

> [IMPORTANT]
> This function does *not* run [destructor functions](/learn/enhancing-elements#destructor)
> on the removed elements. For this use `up.destroy()`.

@function up.element.remove
@param {Element} element
  The element to remove.
@deprecated
  Use [`Element#remove()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/remove) instead.

-----

# up.element.matches()

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

-----

# up.element.closest()

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

-----

# up.element.replace()

Replaces the given old element with the given new element.

The old element will be removed from the DOM tree.

@function up.element.replace
@param {Element} oldElement
@param {Element} newElement
@deprecated
  Use [`Element#replaceWith()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/replaceWith) instead.

-----

# up.element.all()

Returns all descendant elements matching the given selector.

@function up.element.all
@param {Element} [parent=document]
  The parent element whose descendants to search.

  If omitted, all elements in the `document` will be searched.
@param {string} selector
  The CSS selector to match.
@return {List<Element>}
  A list of all elements matching the selector.

  Returns an empty list if there are no matches.
@deprecated
  Use [`Document#querySelectorAll()`](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll) or
  [`Element#querySelectorAll()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll) instead

-----

# up.element.toggleClass()

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

-----

# up.element.toSelector()

Returns a CSS selector that matches the given element as good as possible.

Alias for `up.fragment.toTarget()`.

@function up.element.toSelector
@param {string|Element|jQuery} element
  The element for which to create a selector.
@deprecated
  Use `up.fragment.toTarget()` instead.

-----

# up.element.isAttached()

Returns whether the given element is attached to the DOM tree.

See also `up.element.isDetached()`.

@function up.element.isAttached
@param {Element} element
@return {boolean}
@deprecated
  Use `element.isConnected` instead.

-----

# up.element.isDetached()

Returns whether the given element has been removed from the DOM tree.

@function up.element.isDetached
@param {Element} element
@return {boolean}
@deprecated
  Use `!element.isConnected` instead.
