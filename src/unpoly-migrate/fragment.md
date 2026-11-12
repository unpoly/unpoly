# up.fragment

@namespace up.fragment

-----

# up.replace()

Replaces elements on the current page with corresponding elements
from a new page fetched from the server.

@function up.replace
@param {string|Element|jQuery} target
  The CSS selector to update. You can also pass a DOM element or jQuery element
  here, in which case a selector will be inferred from the element's class and ID.
@param {string} url
  The URL to fetch from the server.
@param {Object} [options]
  See `options` for `up.render()`.
@return {Promise}
  A promise that fulfills when the page has been updated.
@deprecated
  Use `up.render()` or `up.navigate()` instead.

-----

# up.extract()

Updates a selector on the current page with the
same selector from the given HTML string.

### Example

Let's say your current HTML looks like this:

    <div class="one">old one</div>
    <div class="two">old two</div>

We now replace the second `<div>`, using an HTML string
as the source:

    html = '<div class="one">new one</div>' +
           '<div class="two">new two</div>'

    up.extract('.two', html)

Unpoly looks for the selector `.two` in the strings and updates its
contents in the current page. The current page now looks like this:

    <div class="one">old one</div>
    <div class="two">new two</div>

Note how only `.two` has changed. The update for `.one` was
discarded, since it didn't match the selector.

@function up.extract
@param {string|Element|jQuery} target
@param {string} html
@param {Object} [options]
  See options for [`up.render()`](/api/up.render).
@return {Promise}
  A promise that will be fulfilled when the selector was updated.
@deprecated
  Use `up.render()` or `up.navigate()` instead.

-----

# up.fragment.first()

Returns the first element matching the given selector, but
ignores elements that are being [destroyed](/api/up.destroy) or that are being
removed by a [transition](/api/up.morph).

Returns `undefined` if no element matches these conditions.

@function up.fragment.first
@param {Element|jQuery} [root=document]
  The root element for the search. Only the root's descendants will be matched.

  May be omitted to search through all elements in the current `document`.
@param {string} selector
  The selector to match
@param {string} [options.layer='current']
  The layer in which to find the element.

  See [[targeting-other-layers]].
@param {string|Element|jQuery} [options.origin]
  A second element or selector that can be referenced as `:origin` in the first selector.
@return {Element|undefined}
  The first element that is not being destroyed,
  or `undefined` if no such element was found.
@deprecated
  Use `up.fragment.get()` instead.
