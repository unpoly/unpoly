# up.element

Low-level functions to access and change the DOM.

`up.element.get()` and `up.element.subtree()` look up elements. `up.element.createFromHTML()` and `up.element.createFromSelector()` build elements, and `up.element.affix()` builds one and attaches it to a parent. Functions like `up.element.attr()`, `up.element.numberAttr()` and `up.element.jsonAttr()` parse attribute values into typed values, and `up.element.toggle()` or `up.element.hide()` change visibility through the `[hidden]` attribute.

These functions know nothing about layers or animation. For a fragment-aware API, prefer `up.fragment`.

@namespace up.element

-----

# first()

Returns the first descendant element matching the given selector.

@function first
@param {Element} [parent=document]
  The parent element whose descendants to search.

  If omitted, all elements in the `document` will be searched.
@param {string} selector
  The CSS selector to match.
@return {Element|undefined|null}
  The first element matching the selector.

  Returns `null` or `undefined` if no element matches.
@internal

-----

# up.element.subtree()

Returns a list of a `root` element's descendants matching the given selector.

If the `root` element itself matches the selector, it is also included in the returned list.

@function up.element.subtree
@param {Element} root
  The root element for the search.
@param {string} selector
  The CSS selector to match.
@return {NodeList<Element>|Array<Element>}
  A list of all matching elements.
@stable

-----

# elementLikeMatches()

Like `Element#matches()`, but returns `false` for a `Document` or `Window` argument.

@function elementLikeMatches
@internal

-----

# contains()

Returns whether the given element is either the given root element
or its descendants.

@function contains
@internal

-----

# up.element.ancestor()

@function up.element.ancestor
@internal

-----

# up.element.get()

Returns the native [Element](https://developer.mozilla.org/en-US/docs/Web/API/Element) for the given value.

This function is not aware of [layers](/api/up.layer) or [elements being destroyed](/api/up-destroying)
and does not support non-standard selectors like `:main`. For this, use `up.fragment.get()`.

### Casting rules

- If given an element, returns that element.
- If given a CSS selector string, returns the first element matching that selector.
- If given a jQuery collection, returns the first element in the collection.
  Throws an error if the collection contains more than one element.
- If given any other argument (`undefined`, `null`, `document`, `window`…), returns the argument unchanged.

### Example

Passing a CSS selector will return the first matching element:

```js
up.element.get('.foo') // returns the first matching element
```

@function up.element.get
@param {Element} [parent=document]
  The parent element whose descendants to search if `value` is a CSS selector string.

  If omitted, all elements in the `document` will be searched.
@param {Element|jQuery|string} value
  The value to look up.
@return {Element|null|undefined}
  The obtained `Element`.

  Returns `null` or `undefined` if no element matches.
@stable

-----

# up.element.list()

Composes a list of elements from the given arguments.

### Casting rules

- If given a string, returns all elements matching that string.
- If given any other argument, returns the argument [wrapped as a list](/api/up.util.wrapList).

### Example

```javascript
$jquery = $('.jquery')                          // returns jQuery (2) [div.jquery, div.jquery]
nodeList = document.querySelectorAll('.node')   // returns NodeList (2) [div.node, div.node]
element = document.querySelector('.element')    // returns Element div.element
selector = '.selector'                          // returns String '.selector'

elements = up.element.list($jquery, nodeList, undefined, element, selector)
// returns [div.jquery, div.jquery, div.node, div.node, div.element, div.selector]
```

@function up.element.list
@param {Array<jQuery|Element|Array<Element>|string|undefined|null>} ...args
@return {Array<Element>}
@internal

-----

# up.element.hide()

Hides the given element.

Also see `up.element.show()` and `up.element.toggle()`.

### Implementation

The element is hidden by setting an `[hidden]` attribute.
This effectively gives the element a `display: none` rule.

To customize the CSS rule for hiding, see `[hidden]`.

@function up.element.hide
@param {Element} element
@stable

-----

# [hidden]

Elements with this attribute are hidden from the page.

@learn-ref switching-form-state

When Unpoly hides an element for any reason, it will set an `[hidden]` attribute
instead of using an inline style like `display: none`.
This allows users to customize the hiding implementation using CSS.

## Customizing the CSS

While `[hidden]` is a [standard HTML attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden),
its default implementation is [not very useful](https://meowni.ca/hidden.is.a.lie.html).
In particular, it cannot hide elements with any `display` rule.
Unpoly improves the default CSS styles of `[hidden]` so it can hide arbitrary elements.

Unpoly's default styles for `[hidden]` look like this:

```css
[hidden][hidden] {
  display: none !important;
}
```

You can override the CSS to hide an element in a different way, e.g. by giving it a zero height:

```css
.my-element[hidden] {
  display: block !important;
  height: 0 !important;
}
```

> [IMPORTANT]
> Any overriding selector must have a [specificity of `(0, 2, 0)`](https://polypane.app/css-specificity-calculator/#selector=.element%5Bhidden%5D).
> Also, all rules should be defined with [`!important`](https://www.w3schools.com/css/css_important.asp) to override other
> styles defined on that element.

@selector [hidden]
@experimental

-----

# up.element.show()

Shows the given element.

Also see `up.element.hide()` and `up.element.toggle()`.

### Limitations

The element is shown by removing the `[hidden]` attribute set by `up.element.hide()`.
If the element is hidden by an inline style (`[style="display: none"]`),
that inline style is also removed.

You may have CSS rules causing the element to remain hidden after calling `up.element.show(element)`.
Unpoly will *not* handle such cases to keep this function performant. As a workaround, you may
manually set `element.style.display = 'block'`.

@function up.element.show
@param {Element} element
  The element to show.
@stable

-----

# up.element.toggle()

Changes whether the given element is [shown](/api/up.element.show) or [hidden](/api/up.element.hide).

@function up.element.toggle
@param {Element} element
  The element to toggle.
@param {boolean} [newVisible]
  Pass `true` to show the element or `false` to hide it.

  If omitted, the element will be hidden if shown and shown if hidden.
@stable
@signature

-----

# up.element.setAttrs()

Sets properties from the given object as attributes on the given element.

Attributes that the element already has are overridden.
To only set attributes that the element doesn't have yet, use `up.element.setMissingAttrs()`.

### Example

```js
up.element.setAttrs(element, { title: 'Tooltip', tabindex: 1 })

element.getAttribute('title') // result: "Tooltip"
element.getAttribute('tabindex') // result: "1"
```

@function up.element.setAttrs
@param {Element} element
  The element on which to set attributes.
@param {Object} attributes
  An object of attribute names and values to set.

  To set an empty attribute, pass an empty string value.

  To remove an attribute, use a value of `null` or `undefined`.
@stable

-----

# up.element.setAttrsTemp()

Temporarily sets attributes on the given element.

Returns a function that restores the attributes to their value before the change.

### Example

```js
let element = up.element.createFromSelector("div[title='Original']")
element.getAttribute('title') // => "Original"

let undo = up.element.setAttrsTemp(element, { title: 'Changed' })
element.getAttribute('title') // => "Changed"

undo()
element.getAttribute('title') // result: "Original"
```

@function up.element.setAttrsTemp
@param element
  @like up.element.setAttrs
@param attributes
  @like up.element.setAttrs
@return {Function}
  A function that restores the attributes to their value before the change.
@internal

-----

# up.element.metaContent()

@function up.element.metaContent
@internal

-----

# up.element.insertBefore()

@function up.element.insertBefore
@internal

-----

# up.element.createFromSelector()

Creates an element matching the given CSS selector.

The created element will not yet be attached to the DOM tree.
Attach it with [`Element#appendChild()`](https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild),
or use `up.element.affix()` to create an already-attached element.

Use `up.hello()` to activate [JavaScript behavior](/api/up.script) within the created element.

### Examples

To create an element with a given tag name:

```js
element = up.element.createFromSelector('span')
// element is <span></span>
```

To create an element with a given class:

```js
element = up.element.createFromSelector('.klass')
// element is <div class="klass"></div>
```

To create an element with a given ID:

```js
element = up.element.createFromSelector('#foo')
// element is <div id="foo"></div>
```

### Setting attributes

To create an element with a given boolean attribute:

```js
element = up.element.createFromSelector('[attr]')
// element is <div attr></div>
```

To create an element with a given attribute value:

```js
element = up.element.createFromSelector('[attr="value"]')
// element is <div attr="value"></div>
```

You may also pass an object of attribute names and values as a second argument:

```js
element = up.element.createFromSelector('div', { attr: 'value' })
// element is <div attr="value"></div>
```

### Passing child nodes

You may set the element's inner text by passing a `{ text }` option (HTML control characters will
be escaped):

```js
element = up.element.createFromSelector('div', { text: 'inner text' })
// element is <div>inner text</div>
```

You may set the element's inner HTML by passing a `{ content }` option:

```js
element = up.element.createFromSelector('div', { content: '<span>inner text</span>' })
// element is <div><span>inner text</span></div>
```

### Setting inline styles

You may set inline styles by passing an object of CSS properties as a `{ style }` option:

```js
element = up.element.createFromSelector('div', { style: { color: 'red' }})
// element is <div style="color: red"></div>
```

@function up.element.createFromSelector
@include up.element.createFromSelector/all
@stable

-----

# up.element.parseSelector()

Parses a not-too-complex CSS selector.

### Example

```js
up.element.parseSelector('.content > form[action="/"]:not(.bar)')
=> {
     includePath: [
       { tagName: null,
         classNames: ['content'],
         id: null,
         attributes: {}
       },
       { tagName: 'form',
         classNames: [],
         id: null,
         attributes: { action: "/" }
       }
     ],
     includeRaw: '.content > form[action="/"]',
     excludeRaw: ':not(.bar)'
   }
```

@function up.element.parseSelector
@internal

-----

# up.element.affix()

Creates an element matching the given CSS selector and attaches it to the given parent element.

To create a detached element from a selector, see `up.element.createFromSelector()`.

Use `up.hello()` to activate [JavaScript behavior](/api/up.script) within the created element.

### Example

```js
element = up.element.affix(document.body, '.klass')
element.parentElement // returns document.body
element.className // returns 'klass'
```

See `up.element.createFromSelector()` for many more examples.

@function up.element.affix
@section Position
  @param {Element} parent
    The parent to which to attach the created element.
  @param {string} [position='beforeend']
    The position of the new element in relation to `parent`.

    @include adjacent-positions
@include up.element.createFromSelector/all
@stable
@signature

-----

# up.element.isSingleton()

@function up.element.isSingleton
@internal

-----

# up.element.attrSelector()

@function up.element.attrSelector
@internal

-----

# up.element.classSelector()

@function up.element.classSelector
@internal

-----

# up.element.createBrokenDocumentFromHTML()

Parses a new `Document` instance from the given HTML.

This function always creates a full document with a <html> root,
even if the given `html` string only contains a fragment.

Due to quirks in the `DOMParser` spec, `<script>` and `<noscript>`
elements in the returned document will be inert. Also, media elements may
not work fully on Safari. To make them active, clone them after insertion
into the destination document using `up.element.revivedClone()`.

@function up.element.createBrokenDocumentFromHTML
@param {string} html
@return {Document}
@internal

-----

# up.element.createFromHTML()

Parses an element from the given HTML fragment string.

Use `up.hello()` to activate [JavaScript behavior](/api/up.script) within the created element.

### Example

```js
element = up.element.createFromHTML('<div class="foo"><span>text</span></div>')
element.className // returns 'foo'
element.children[0] // returns <span> element
element.children[0].textContent // returns 'text'
```

@function up.element.createFromHTML
@param {string} html
  A string of HTML from which to create the element.

  The given HTML must have a single tag at its root or an error is thrown.
@return {Element}
  The root element of the parsed DOM tree.
@stable
@signature

-----

# up.element.extractSingular()

Checks if the given list contains a single `Element` and returns that element.

Throws an error if the given list contains more than one node,
or if the given list only contains a `Text` node.

@function up.element.extractSingular
@param {List<Node>} nodes
@return {Element}
@internal

-----

# up.element.createNodesFromHTML()

Parses a [list](/api/List) of [nodes](https://developer.mozilla.org/en-US/docs/Web/API/Node) from a string of HTML.

The returned list can be a mixed list of `Element`, `Text`, or `Comment` nodes.

## Example

```js
let list = up.element.createNodesFromHTML('foo <p>bar</p> baz') // result: NodeList(3)
list.length // result: 3
list[0] // result: Text "foo "
list[1] // result: Element "<p>bar</p>"
list[2] // result: Text " baz"
```

## Whitespace trimming {#whitespace}

Before parsing, whitespace will be trimmed from the beginning and end of the string.
This prevents the creation of all-whitespace `Text` nodes at the edges of the list:

```js
let list = up.element.createNodesFromHTML('  <p>bar</p>  ') // result: NodeList(1)
list.length // result: 1
```

No changes will be made to whitespace in the middle of the given string.

@function up.element.createNodesFromHTML
@param {string} html
  A string of HTML to parse.
@return {List<Node>}
  A list of `Element`, `Text`, or `Comment` nodes.

@experimental

-----

# up.element.root()

@function up.element.root
@internal

-----

# up.element.paint()

Forces the browser to paint the given element now.

@function up.element.paint
@internal

-----

# up.element.fixedToAbsolute()

@function up.element.fixedToAbsolute
@internal

-----

# up.element.setMissingAttrs()

Sets attributes from the given object that the given element doesn't have yet.

Attributes that the element already has are kept, even when their value is an empty string.

### Example

```js
let element = up.element.createFromSelector('div[title="Original"]')
up.element.setMissingAttrs(element, { title: 'Changed', tabindex: 1 })

element.getAttribute('title') // result: "Original"
element.getAttribute('tabindex') // result: "1"
```

### Differences from `up.element.setAttrs()`

`up.element.setAttrs()` sets every given attribute, overriding a value the element already has.
For a `null` or `undefined` value it removes the attribute.

`up.element.setMissingAttrs()` keeps the attributes the element already has.
It skips a `null` or `undefined` value, so the attribute stays missing.

Both functions set a value of `false` as the string `"false"`.

@function up.element.setMissingAttrs
@param {Element} element
  The element on which to set attributes.
@param {Object} attributes
  An object of attribute names and values to set.

  An attribute is only set when the element doesn't have it.
  An attribute with an empty value counts as present, and is kept.

  A value of `null` or `undefined` is skipped.
@experimental

-----

# up.element.unwrap()

@function up.element.unwrap
@internal

-----

# up.element.attr()

Returns the given `attribute` value for the given `element`.

If the element does not have the given attribute, it returns `undefined`.
This is a difference from the native `Element#getAttribute()`, which [mostly returns `null` in that case](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute#Non-existing_attributes).

If the element has the attribute but without a value (e.g. `<input readonly>`), it returns an empty string.

@function up.element.attr
@param {Element} element
  The element from which to read an attribute.
@param {string} attribute
  The name of the attribute to read.
@return {string|undefined}
  The attribute value.

  Returns `undefined` if the attribute is not set on the given element.
@stable

-----

# up.element.booleanAttr()

Returns the value of the given attribute on the given element, cast as a boolean value.

If the attribute value cannot be cast to `true` or `false`, `undefined` is returned.

## Casting rules

This function deviates from the
[HTML Standard for boolean attributes](https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes)
to allow `undefined` values. When an attribute is missing, Unpoly considers the value to be `undefined`
(whereas the standard would assume `false`).

Unpoly also allows `"true"` and `"false"` as attribute values.

The table below shows return values for `up.element.booleanAttr(element, 'foo')` given different elements:

| Element             | Return value |
|---------------------|--------------|
| `<div foo>`         | `true`       |
| `<div foo="foo">`   | `true`       |
| `<div foo="true">`  | `true`       |
| `<div foo="">`      | `true`       |
| `<div foo="false">` | `false`      |
| `<div>`             | `undefined`  |
| `<div foo="bar">`   | `true`       |

@function up.element.booleanAttr
@param {Element} element
  The element from which to retrieve the attribute value.
@param {string} attribute
  The attribute name.
@return {boolean|undefined}
  The cast attribute value.
@stable

-----

# up.element.booleanOrStringAttr()

Returns the given attribute value cast as boolean.

If the attribute value cannot be cast, returns the attribute value unchanged.

@function up.element.booleanOrStringAttr
@param {Element} element
  The element from which to retrieve the attribute value.
@param {string} attribute
  The attribute name.
@return {boolean|string|undefined}
  The cast attribute value.
@internal

-----

# up.element.booleanOrNumberAttr()

Returns the given attribute value cast as boolean.

If the attribute value cannot be cast to a boolean, tries to cast the attribute value to a number.

If the attribute value cannot be cast to either boolean or number, returns `undefined`.

@function up.element.booleanOrNumberAttr
@param {Element} element
  The element from which to retrieve the attribute value.
@param {string} attribute
  The attribute name.
@return {boolean|number|undefined}
  The cast attribute value.
@internal

-----

# up.element.booleanOrNumberOrStringAttr()

Returns the given attribute value cast as boolean or number.

If the attribute value cannot be cast, returns the attribute value unchanged.

@function up.element.booleanOrNumberOrStringAttr
@param {Element} element
  The element from which to retrieve the attribute value.
@param {string} attribute
  The attribute name.
@return {boolean|string|undefined}
  The cast attribute value.
@internal

-----

# up.element.numberAttr()

Returns the value of the given attribute on the given element, cast to a number.

If the attribute value cannot be cast to a number, `undefined` is returned.

@function up.element.numberAttr
@param {Element} element
  The element from which to retrieve the attribute value.
@param {string} attribute
  The attribute name.
@return {number|undefined}
  The cast attribute value.
@stable

-----

# up.element.jsonAttr()

Reads the given attribute from the element, parsed as [relaxed JSON](/api/relaxed-json).

Returns `undefined` if the attribute value is [blank](/api/up.util.isBlank) or only consists of whitespace.

Throws a `SyntaxError` if the attribute value is an invalid JSON string.

@function up.element.jsonAttr
@param {Element} element
  The element from which to retrieve the attribute value.
@param {string} attribute
  The attribute name.
@return {Object|undefined}
  The cast attribute value.
@stable

-----

# up.element.addClassTemp()

Temporarily adds a CSS class to the given element.

Returns a function that restores the original class list when called.

### Example

```js
let element = up.element.createFromSelector('.foo')
element.className // => 'foo'

let undo = up.element.addClassTemp(element, 'bar')
element.className // => 'foo bar'

undo()
element.className // result: 'foo'
```

@function up.element.addClassTemp
@param {Element} element
@param {string} klass
@return {Function}
  A function that restores the original class list when called.
@internal

-----

# up.element.style()

Returns [computed CSS styles](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle)
for the given element.

If a property is not set, it will be returned as an empty string.

### Examples

When requesting a single CSS property, its value will be returned as a string:

```js
let value = up.element.style(element, 'font-size')
// value is '16px'
```

When requesting multiple CSS properties, the function returns an object of property names and values:

```js
let value = up.element.style(element, ['font-size', 'margin-top'])
// value is { 'font-size': '16px', 'margin-top': '10px' }
```

@function up.element.style
@param {Element} element
@param {string|Array} propOrProps
  One or more CSS property names in kebab-case.
@return {string|Object}
  The requested style value or values.
@stable

-----

# up.element.styleNumber()

Returns a [computed CSS property value](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle)
for the given element, cast as a number.

The value is cast by removing the property's [unit](https://www.w3schools.com/cssref/css_units.asp) (which is usually `px` for computed properties).
The result is then parsed as a floating point number.

Returns `undefined` if the property value is missing. Returns `NaN` if the value cannot be parsed as a number.

### Examples

```js
let value = up.element.style(element, 'font-size')
// value is '16px'

value = up.element.styleNumber(element, 'font-size')
// value is 16
```

@function up.element.styleNumber
@param {Element} element
@param {string} prop
  A single property name in kebab-case.
@return {number|undefined|NaN}
  The cast property value.
@stable

-----

# up.element.inlineStyle()

Gets the given inline style(s) from the given element's `[style]` attribute.

If a property is not set, it will be returned as an empty string.

@function up.element.inlineStyle
@param {Element} element
@param {string|Array} propOrProps
  One or more CSS property names in kebab-case.
@return {string|Object}
@internal

-----

# up.element.setStyle()

Sets the given CSS properties as inline styles on the given element.

## Example

```js
up.element.setStyle(element, { color: 'red', 'font-size': '2em' })
```

@function up.element.setStyle
@param {Element} element
  The element on which to change inline styles.
@param {Object} styles
  One or more CSS properties with kebab-case keys.
@stable

-----

# up.element.setStyleTemp()

Temporarily sets inline CSS styles on the given element.

Returns a function that restores the original inline styles when called.

### Example

```js
let element = document.querySelector('div')
getComputedStyle(element).fontSize // => '12px'

let undo = up.element.setStyleTemp(element, { 'font-size': '50px' })
getComputedStyle(element).fontSize // => '50px'

undo()
getComputedStyle(element).fontSize // result: '12px'
```

@function up.element.setStyleTemp
@param element
  @like up.element.setStyle
@param styles
  @like up.element.setStyle
@return {Function()}
  A function that restores the original inline styles when called.
@internal

-----

# up.element.isVisible()

Returns whether the given element is currently visible.

An element is considered visible if it consumes space in the document.
Elements with `{ visibility: hidden }` or `{ opacity: 0 }` are considered visible since they still consume space in the layout.

Elements not attached to the DOM are considered hidden.

@function up.element.isVisible
@param {Element} element
  The element to check.
@return {boolean}
  Whether the given element is visible.
@stable

-----

# up.element.isEmpty()

Returns whether the given element has no content.

An element is considered to have content if it has either child elements or non-whitespace text.

### Examples

These `<div>` elements are all considered empty:

```html
<div></div>

<div>   </div>

<div attr="text"></div>
```

These `<div>` elements are *not* considered empty:

```html
<div>
  Text
</div>

<div>
  <span>Text</span>
</div>

<div>
  <span></span>
</div>
```

@function up.element.isEmpty
@param {Element} element
@return {boolean}
  Whether the given element is empty.
@experimental

-----

# up.element.unionSelector()

```
up.element.unionSelector(['input', 'textarea']) // result: ':is(input,textarea)'
up.element.unionSelector(['input', 'textarea'], undefined) // result: ':is(input,textarea)'
up.element.unionSelector(['input', 'textarea'], ['.disabled', '[disabled]']) // result: ':is(input,textarea):not(.disabled,[disabled])'
up.element.unionSelector(['input', 'textarea'], ['.disabled', '[disabled]'], '.active') // result: ':is(input,textarea):not(.disabled,[disabled]):is(.active)'
```

@function up.element.unionSelector
@param {Array<string>} includes
@param {Array<string>} [excludes]
@param {string} [condition]
@internal

-----

# up.element.trackDefinitions()

Emits `up:element:defined` when a custom element in the given root gets defined.

Looks for elements in the given root and its descendants that are not yet [defined](https://developer.mozilla.org/en-US/docs/Web/CSS/:defined),
and waits for their definitions. Each tag name is only awaited once.

Some selectors only match a custom element once it is defined. E.g. a [form-associated custom element](/learn/custom-form-fields#form-associated)
only matches `:enabled` after `customElements.define()`.

@function up.element.trackDefinitions
@param {Element} root
@internal

-----

# up:element:defined

This event is emitted when a custom element on the page gets defined.

Only tag names that were in a fragment Unpoly compiled before their definition are observed.
See `up.element.trackDefinitions()`.

@event up:element:defined
@param {string} event.localName
  The tag name of the custom element that was defined.
@internal
