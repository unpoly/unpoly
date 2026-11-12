import './element.sass'
import * as u from './util.js'
import { Rect } from './util/rect.js'
import { fail } from './error.js'
import { mockable } from './mockable.js'

/**
A CSS selector, an element, or a list of elements. See `up.element.get()`.
*/
export type ElementOrSelector = string | Element | u.List<Element>

/**
A function that undoes a temporary change, like the one returned by `up.element.setAttrsTemp()`.
*/
export type UndoFunction = () => void

/**
Inline styles as an object, with property names in kebab-case (`'font-size'`).
Values are strings, or numbers that get the unit passed to `up.element.setStyle()`.
Any object with such properties works, e.g. an `up.Rect`.
*/
export type StyleProps = Record<string, any>

/**
Parses the value of an attribute. Returns `undefined` if it cannot parse the value,
so `up.element.parseAttr()` tries the next parser.
@internal
*/
export type AttrParser = (value: string, attribute: string, element: Element) => any

/**
One element in a parsed selector's descendant path (`div.foo#bar[baz]` in `main > div.foo#bar[baz]`).
@internal
*/
export interface SelectorSegment {
  tagName: string | null
  classNames: string[]
  id: string | null
  attributes: Record<string, string>
}

/**
What `up.element.parseSelector()` returns.
@internal
*/
export interface ParsedSelector {
  includePath: SelectorSegment[]
  includeRaw: string
  excludeRaw: string | undefined
}

/**
The `up:element:defined` event.
*/
export type ElementDefinedEvent = Event & {
  localName: string
}

/*-
Low-level functions to access and change the DOM.

`up.element.get()` and `up.element.subtree()` look up elements. `up.element.createFromHTML()` and `up.element.createFromSelector()` build elements, and `up.element.affix()` builds one and attaches it to a parent. Functions like `up.element.attr()`, `up.element.numberAttr()` and `up.element.jsonAttr()` parse attribute values into typed values, and `up.element.toggle()` or `up.element.hide()` change visibility through the `[hidden]` attribute.

These functions know nothing about layers or animation. For a fragment-aware API, prefer `up.fragment`.

@namespace up.element
*/

/*-
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
*/
function first(...args: any[]): HTMLElement {
  let [root = document, selector] = u.parseArgs(args, 'val', 'val')
  return root.querySelector(selector)
}

/*-
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
*/
export function subtree(root: ParentNode, selector: string): u.List<HTMLElement> {
  const descendantMatches = root.querySelectorAll<HTMLElement>(selector)

  if (elementLikeMatches(root, selector)) {
    return [root as HTMLElement, ...descendantMatches]
  } else {
    return descendantMatches
  }
}

export function subtreeFirst(root: ParentNode, selector: string): HTMLElement | null {
  return elementLikeMatches(root, selector) ? root as HTMLElement : root.querySelector<HTMLElement>(selector)
}

/*-
Like `Element#matches()`, but returns `false` for a `Document` or `Window` argument.

@function elementLikeMatches
@internal
*/
export function elementLikeMatches(elementLike: any, selector: string): boolean {
  return u.isElement(elementLike) && elementLike.matches(selector)
}

/*-
Returns whether the given element is either the given root element
or its descendants.

@function contains
@internal
*/
export function containsElement(root: Node, selectorOrElement: ElementOrSelector): boolean {
  const element = getOne(selectorOrElement)
  // We cannot use `root.contains(element)` as <form> elements with an input named "contains"
  // would define `root.contains` to return that input (GH#507).
  return Node.prototype.contains.call(root, element)
}

/*-
@function up.element.ancestor
@internal
*/
export function ancestor(element: Element, selector: string): HTMLElement | null {
  return (element.parentNode as Element)?.closest<HTMLElement>(selector)
}

export function around(element: Element, selector: string): HTMLElement[] {
  // Only the closest match around the element, not all ancestors. This is intentional for viewports:
  // outer viewports show other content (a page around a scrolling sidebar, the page behind an overlay),
  // and scrolling them when a fragment updates would be an unexpected side effect.
  return getList(element.closest(selector), subtree(element, selector))
}

/*-
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
@return {Element}
  The obtained `Element`.
@stable
*/
export function getOne(selectorOrElement: ElementOrSelector): HTMLElement
export function getOne(root: ParentNode, selector: string): HTMLElement
// Other values (undefined, null, false, Window, Document, DocumentFragment, ...) are returned unchanged.
// Distributes over a union, so `ElementOrSelector | false` becomes `HTMLElement | false`.
export function getOne<T>(value: T): T extends ElementOrSelector ? HTMLElement : T
export function getOne(...args: unknown[]) {
  const value = args.pop()

  if (u.isElement(value)) { // Return an element before we run any other expensive checks
    return value
  } else if (u.isString(value)) {
    return first(...args, value)
  } else if (u.isList(value)) {
    if (value.length > 1) {
      fail('up.element.get(): Cannot cast multiple elements (%o) to a single element', value)
    }
    return value[0]
  } else {
    // undefined, null, Window, Document, DocumentFragment, ...
    return value
  }
}

/*-
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
*/
export function getList(...args: any[]): HTMLElement[] {
  return u.flatMap(args, valueToList)
}

function valueToList(value: any): u.List<HTMLElement> {
  if (u.isString(value)) {
    return document.querySelectorAll(value)
  } else {
    return u.wrapList(value)
  }
}

/*-
Hides the given element.

Also see `up.element.show()` and `up.element.toggle()`.

### Implementation

The element is hidden by setting an `[hidden]` attribute.
This effectively gives the element a `display: none` rule.

To customize the CSS rule for hiding, see `[hidden]`.

@function up.element.hide
@param {Element} element
@stable
*/
export function hide(element: HTMLElement): void {
  setVisible(element, false)
}

/*-
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
*/

/*-
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
*/
export function show(element: HTMLElement): void {
  setVisible(element, true)
}

export function showTemp(element: HTMLElement): UndoFunction {
  return setVisibleTemp(element, true)
}

export function hideTemp(element: HTMLElement): UndoFunction {
  return setVisibleTemp(element, false)
}

function setVisibleTemp(element: HTMLElement, newVisible: boolean): UndoFunction {
  if (newVisible === isVisible(element)) return u.noop
  setVisible(element, newVisible)
  return () => setVisible(element, !newVisible)
}

function setVisible(element: HTMLElement, newVisible: boolean): void {
  if (newVisible) {
    // Remove the attribute set by `up.element.hide()`.
    element.removeAttribute('hidden')

    // In case the element was manually hidden through an inline style
    // of `display: none`, we also remove that.
    if (element.style.display === 'none') {
      element.style.display = ''
    }
  } else {
    // Set an attribute that the user can style with custom "hidden" styles.
    // E.g. certain JavaScript components cannot initialize properly within a
    // { display: none }, as such an element has no width or height.
    element.setAttribute('hidden', '')
  }
}

/*-
Changes whether the given element is [shown](/api/up.element.show) or [hidden](/api/up.element.hide).

@function up.element.toggle
@param {Element} element
  The element to toggle.
@param {boolean} [newVisible]
  Pass `true` to show the element or `false` to hide it.

  If omitted, the element will be hidden if shown and shown if hidden.
@stable
@signature
*/
export function toggle(element: HTMLElement, newVisible: boolean = !isVisible(element)): void {
  setVisible(element, newVisible)
}

export function setAttrPresence(element: Element, attr: string, value: string, newPresent: boolean): void {
  if (newPresent) {
    return element.setAttribute(attr, value)
  } else {
    return element.removeAttribute(attr)
  }
}

/*-
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
*/
export function setAttrs(element: Element, attrs: u.PlainObject): void {
  for (let key in attrs) {
    const value = attrs[key]
    if (u.isGiven(value)) {
      element.setAttribute(key, value)
    } else {
      element.removeAttribute(key)
    }
  }
}

/*-
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
*/
export function setAttrsTemp(element: Element, attrs: u.PlainObject): UndoFunction {
  let keys = Object.keys(attrs)
  let oldAttrs = pickAttrs(element, keys)
  setAttrs(element, attrs)
  return () => setAttrs(element, oldAttrs)
}

/*-
@function up.element.metaContent
@internal
*/
export function metaContent(name: string): string | undefined {
  const selector = "meta" + attrSelector('name', name)
  return document.head.querySelector<HTMLMetaElement>(selector)?.content
}

/*-
@function up.element.insertBefore
@internal
*/
export function insertBefore(existingNode: Node, newNode: Node): void {
  // We're not using insertAdjacentElement() because that does not work with Text nodes
  existingNode.parentNode!.insertBefore(newNode, existingNode)
}

/*-
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
*/
export function createFromSelector(selector: string, attrs: u.PlainObject = {}): HTMLElement {
  let { includePath } = parseSelector(selector)

  // A selector has at least one segment, so the loop below assigns this.
  let rootElement!: HTMLElement
  let depthElement
  let previousElement

  for (let includeSegment of includePath) {
    let { tagName } = includeSegment

    if (!tagName || tagName === '*') {
      tagName = 'div'
    }

    depthElement = document.createElement(tagName)

    if (!rootElement) {
      rootElement = depthElement
    }

    makeVariation(depthElement, includeSegment)

    previousElement?.appendChild(depthElement)
    previousElement = depthElement
  }

  for (let key in attrs) {
    let value = attrs[key]
    if (key === 'class') {
      addClasses(rootElement, u.wrapList(value))
    } else if (key === 'style') {
      setInlineStyle(rootElement, value)
    } else if (key === 'text') {
      rootElement.textContent = value
    } else if (key === 'content') {
      if (u.isString(value)) {
        rootElement.innerHTML = value
      } else {
        rootElement.append(...u.wrapList(value))
      }
    } else {
      rootElement.setAttribute(key, value)
    }
  }

  return rootElement
}

function makeVariation(element: Element, { id, classNames, attributes }: SelectorSegment): void {
  if (id) {
    element.id = id
  }

  for (let [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value)
  }

  addClasses(element, classNames)
}

/*-
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
*/
export function parseSelector(rawSelector: string): ParsedSelector {
  let excludeRaw

  const {
    masked: selectorOutline,
    restore: restoreSelectorLiterals,
  } = u.expressionOutline(rawSelector)

  const includeWithoutAttrs = selectorOutline.replace(/:not\([^)]*\)/, function(match) {
    excludeRaw = restoreSelectorLiterals(match)
    return ''
  })

  let includeRaw = restoreSelectorLiterals(includeWithoutAttrs)

  const includeSegments = includeWithoutAttrs.split(/[ >]+/)

  let includePath = includeSegments.map(function(depthSelector) {
    let parsed: SelectorSegment = {
      tagName: null,
      classNames: [],
      id: null,
      attributes: {}
    }

    depthSelector = depthSelector.replace(/^[\w-*]+/, function(match) {
      parsed.tagName = match
      return ''
    })

    depthSelector = depthSelector.replace(/#([\w-]+)/, function(_match, id) {
      parsed.id = id
      return ''
    })

    depthSelector = depthSelector.replace(/\.([\w-]+)/g, function(_match, className) {
      parsed.classNames.push(className)
      return ''
    })

    depthSelector = depthSelector.replace(/\[[^\]]*]/g, function(attr) {
      attr = restoreSelectorLiterals(attr)
      // We allow whitespace around the name, operator and value, and ignore a case-sensitivity flag ([foo="bar" i]).
      // TODO: A namespaced attribute ([ns|foo]) or an invalid attribute selector doesn't match, and we throw a TypeError
      //       instead of failing with "Cannot parse selector".
      let [_raw, name, _operator, quote, value] = attr.match(/\[\s*([\w-]+)\s*(?:([~|^$*]?=)\s*(["'])?(.*?)\3)?(?:\s+[is])?\s*]/is)!
      quote ||= '"'
      parsed.attributes[name] = value ? u.parseString(quote + value + quote) : ''
      return ''
    })

    if (depthSelector) {
      fail('Cannot parse selector: ' + rawSelector)
    }

    return parsed
  })

  return {
    includePath,
    includeRaw,
    excludeRaw,
  }
}

/*-
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
*/
export function affix(...args: any[]): HTMLElement {
  let [parent, position = 'beforeend', selector, attributes] = u.parseArgs(args, 'val', u.isAdjacentPosition, 'val', 'options')
  const element = createFromSelector(selector, attributes)
  parent.insertAdjacentElement(position, element)
  return element
}

// Not covered by specs: rendering into <html> or <body> would replace the Jasmine runner.
const SINGLETON_TAG_NAMES = ['HTML', 'BODY', 'HEAD', 'TITLE']

/*-
@function up.element.isSingleton
@internal
*/
export const isSingleton = mockable((element: Element): boolean => element.matches(SINGLETON_TAG_NAMES.join()))

/*-
@function up.element.attrSelector
@internal
*/
export function attrSelector(attribute: string, value?: string): string {
  if (u.isGiven(value)) {
    value = value.replace(/"/g, '\\"')
    // We could get away with omitting the quotes for simple alphanumeric strings,
    // but e.g. not for a string with quotes or spaces or a string that is all numbers.
    // Better add the quotes in all cases.
    return `[${attribute}="${value}"]`
  } else {
    return `[${attribute}]`
  }
}

export function idSelector(id: string): string {
  if (id.match(/^[a-z][a-z0-9\-_]*$/i)) {
    return `#${id}`
  } else {
    return attrSelector('id', id)
  }
}

/*-
@function up.element.classSelector
@internal
*/
export function classSelector(klass: string): string {
  klass = klass.replace(/[^\w-]/g, '\\$&')
  return `.${klass}`
}

/*-
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
*/
export function createBrokenDocumentFromHTML(html: string): Document {
  // DOMParser is usually smart enough to parse an incomplete HTML fragment into a full <html> document.
  // However, any table components without an enclosing <table> will be parsed into a simple text node.
  const firstTag = firstTagNameInHTML(html)
  // includes() takes an undefined tag name and returns false.
  if (['TR', 'TD', 'TH', 'THEAD', 'TBODY'].includes(firstTag!)) {
    html = `<table>${html}</table>`
  }
  return new DOMParser().parseFromString(html, 'text/html')
}

// /*-
// Fixes `<script>` and `<noscript>` elements in documents parsed by `up.element.createBrokenDocumentFromHTML()`.
//
// This addresses some quirks [in the `DOMParser` spec](http://w3c.github.io/DOM-Parsing/#dom-domparser-parsefromstring)
// and in some browsers:
//
// 1. Children of a <nonscript> tag are expected to be a verbatim text node in a scripting-capable browser.
//    However, `DOMParser` parses children into actual DOM nodes.
//    This confuses libraries that work with <noscript> tags, such as lazysizes.
// 2. <script> elements are inert and will not run code when inserted into the main `document`.
// 3. Safari cannot parse auto-playing media elements.
//
// @function up.element.fixParserDamage
// @param {Element} scriptish
//   A `<script>` or `<noscript>` element.
// @internal
// */
// function fixParserDamage(element) {
//   let clone = revivedClone(element)
//   element.replaceWith(clone)
// }

export function revivedClone(element: Element): HTMLElement {
  // We cannot use `scriptish.cloneNode(true)` as this does not fix broken <noscript> elements
  let clone = createFromHTML(element.outerHTML)
  // When a CSP is set, the browser masks the nonce from .getAttribute() and .outerHTML
  if ('nonce' in element) clone.nonce = (element as HTMLElement).nonce
  return clone
}

/*-
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
*/
export function createFromHTML(html: string): HTMLElement {
  return extractSingular(createNodesFromHTML(html))
}

/*-
Checks if the given list contains a single `Element` and returns that element.

Throws an error if the given list contains more than one node,
or if the given list only contains a `Text` node.

@function up.element.extractSingular
@param {List<Node>} nodes
@return {Element}
@internal
*/
export function extractSingular(nodes: u.List<Node>): HTMLElement {
  return tryExtractSingular(nodes) || fail('Expected a single element, but got %d nodes', nodes.length)
}

function tryExtractSingular(nodes: u.List<Node>): HTMLElement | undefined {
  if (nodes.length === 1 && u.isElementLike(nodes[0])) {
    return nodes[0] as HTMLElement
  }
}

/*-
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
*/
export function createNodesFromHTML(html: string): NodeListOf<ChildNode> {
  // Prevent all-whitespace text nodes at the beginning or end
  html = html.trim()

  // (1) We cannot use createBrokenDocumentFromHTML() here, since up.ResponseDoc
  //     needs to create <noscript> elements, and DOMParser cannot create those.
  //     Also it always parses a full document, and we would need to rediscover our element
  //     root within that.
  // (2) We cannot use innerHTML on an anonymous element here, since up.ResponseDoc
  //     needs to create executable <script> elements and setting innerHTML will
  //     create inert <script> elements.
  // (3) Using Range#createContextualFragment() is significantly faster than setting
  //     innerHTML on Chrome. See https://jsben.ch/QQngJ
  const range = document.createRange()
  range.setStart(document.body, 0)
  const fragment = range.createContextualFragment(html)
  return fragment.childNodes
}

/*-
@function up.element.root
@internal
*/
export function getRoot(): HTMLElement {
  return document.documentElement
}

/*-
Forces the browser to paint the given element now.

@function up.element.paint
@internal
*/
export function paint(element: HTMLElement): void {
  element.offsetHeight
}

/*-
@function up.element.fixedToAbsolute
@internal
*/
export function fixedToAbsolute(element: HTMLElement): void {
  const elementRectAsFixed = element.getBoundingClientRect()

  // Set the position to 'absolute' so it gains an offsetParent
  element.style.position = 'absolute'

  // A hidden element (e.g. with `display: none`) has no offsetParent.
  // It is invisible, so it has no position to preserve.
  const { offsetParent } = element
  if (!offsetParent) return

  const offsetParentRect = offsetParent.getBoundingClientRect()

  // A computed margin is never blank.
  setInlineStyle(element, {
    left: (elementRectAsFixed.left - computedStyleNumber(element, 'margin-left')! - offsetParentRect.left) + 'px',
    top: (elementRectAsFixed.top - computedStyleNumber(element, 'margin-top')! - offsetParentRect.top) + 'px',
    right: '',
    bottom: ''
  })
}

/*-
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
*/
export function setMissingAttrs(element: Element, attrs: u.PlainObject): void {
  for (let key in attrs) {
    setMissingAttr(element, key, attrs[key])
  }
}

export function setMissingAttr(element: Element, key: string, value: any): void {
  // (1) We skip a null or undefined value, e.g. from the attribute of another element that doesn't have it.
  // (2) We set false as "false". Some callers set [up-etag=false] on purpose.
  if (u.isGiven(value) && u.isMissing(element.getAttribute(key))) {
    element.setAttribute(key, value)
  }
}

/*-
@function up.element.unwrap
@internal
*/
export function unwrap(wrapper: Element): void {
  preservingFocus(function() {
    // Make a copy as it is a live list and we to iterate over it while also mutating it.
    let childNodes = [...wrapper.childNodes]
    for (let child of childNodes) insertBefore(wrapper, child)
    wrapper.remove()
  })
}

function wrapNodes(nodeOrNodes: u.List<Node>): HTMLElement {
  const wrapper = document.createElement('up-wrapper')
  wrapper.append(...u.wrapList(nodeOrNodes))
  return wrapper
}

export function wrapIfRequired(nodes: u.List<Node>): Element {
  if (nodes.length === 1 && u.isElement(nodes[0])) {
    return nodes[0] as Element
  } else {
    // There are multiple cases when we want to create a wrapper:
    // (1) We have multiple nodes, possibly a mix of Element and Text nodes
    // (2) We have a single Text node
    // (3) We have an empty list
    return wrapNodes(nodes)
  }
}

export function wrapChildren(element: Element): HTMLElement {
  const wrapper = wrapNodes(element.childNodes)
  element.append(wrapper)
  // <element>
  //   <up-wrapper>
  //     <child>
  //     <child>
  //   </up-wrapper>
  // </element>
  return wrapper
}

const CURSOR_PROPS = ['selectionStart', 'selectionEnd', 'scrollLeft', 'scrollTop']

// Copies the selection and scroll position of a field. Without a target, copies them into an object.
export function copyCursorProps(from: any, to: any = {}): any {
  for (let key of CURSOR_PROPS) {
    try {
      to[key] = from[key]
    } catch (_error) {
      // Safari throws a TypeError when accessing { selectionStart }
      // from a focused <input type="submit">. We ignore it.
    }
  }
  return to
}

function preservingFocus<T>(fn: () => T): T {
  const oldFocusElement = document.activeElement as HTMLElement
  // Moving an element resets its scroll position and selection range.
  const cursorProps = copyCursorProps(oldFocusElement)
  try {
    return fn()
  } finally {
    if (oldFocusElement && oldFocusElement !== document.activeElement) {
      // Firefox needs focus-related props to be set *before* we focus the element
      copyCursorProps(cursorProps, oldFocusElement)
      oldFocusElement.focus({ preventScroll: true })
    }
  }
}

export function parseAttr(element: Element, attribute: string, ...parsers: AttrParser[]): any {
  // The document does not respond to #hasAttribute()
  if (!element.hasAttribute?.(attribute)) return undefined
  let rawValue = element.getAttribute(attribute)!

  for (let parser of parsers) {
    let parserResult = parser(rawValue, attribute, element)
    if (u.isDefined(parserResult)) return parserResult
  }
}

/*-
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
*/
export function stringAttr(element: Element, attribute: string): string | undefined {
  return parseAttr(element, attribute, tryParseString)
}

let tryParseString: AttrParser = u.identity

/*-
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
*/
export function booleanAttr(element: Element, attribute: string): boolean | undefined {
  return parseAttr(element, attribute, tryParseBoolean)
}

function tryParseBoolean(value: string, attribute: string): boolean | undefined {
  switch (value) {
    case 'false': {
      return false
    }
    case 'true':
    case '':        // Empty attribute value, as in <button disabled> or <button disabled=""> (equivalent)
    case attribute: // The attribute name itself, e.g. <input checked="checked">
    {
      return true
    }
  }
}

/*-
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
*/
export function booleanOrStringAttr(element: Element, attribute: string): boolean | string | undefined {
  return parseAttr(element, attribute, tryParseBoolean, tryParseString)
}

/*-
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
*/
export function booleanOrNumberAttr(element: Element, attribute: string): boolean | number | undefined {
  return parseAttr(element, attribute, tryParseBoolean, tryParseNumber)
}

/*-
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
*/
export function booleanOrNumberOrStringAttr(element: Element, attribute: string): boolean | number | string | undefined {
  return parseAttr(element, attribute, tryParseBoolean, tryParseNumber, tryParseString)
}

/*-
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
*/
export function numberAttr(element: Element, attribute: string): number | undefined {
  return parseAttr(element, attribute, tryParseNumber)
}

function tryParseNumber(value: string): number | undefined {
  // Call without second argument
  return u.parseNumber(value)
}

/*-
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
*/
export function jsonAttr(element: Element, attribute: string): any {
  return parseAttr(element, attribute, tryParseJSON)
}

function tryParseJSON(value: string): any {
  if (value?.trim()) {
    return u.parseRelaxedJSON(value)
  }
}

export function closestAttr(element: Element, attr: string, readAttrFn: (element: Element, attribute: string) => any = stringAttr): any {
  let match = element.closest('[' + attr + ']')
  if (match) {
    return readAttrFn(match, attr)
  }
}

export function addClasses(element: Element, classes: Iterable<string>): void {
  // Don't use element.classList.add(...classes) because that sets an empty [class]
  // attribute if classes is an empty array.
  for (let klass of classes) element.classList.add(klass)
}

/*-
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
*/
export function addClassTemp(element: Element, klass: string): UndoFunction {
  return setClassStateTemp(element, klass, true)
}

export function removeClassTemp(element: Element, klass: string): UndoFunction {
  return setClassStateTemp(element, klass, false)
}

function setClassStateTemp(element: Element, klass: string, targetState: boolean): UndoFunction {
  if (element.classList.contains(klass) === targetState) return u.noop
  element.classList.toggle(klass, targetState)
  return () => element.classList.toggle(klass, !targetState)
}

/*-
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
*/
export function computedStyle(element: Element, prop: string): string
export function computedStyle(element: Element, props: string[]): Record<string, string>
export function computedStyle(element: Element, props: string | string[]) {
  const style = window.getComputedStyle(element)
  return extractFromStyleObject(style, props)
}

/*-
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
*/
export function computedStyleNumber(element: Element, prop: string): number | undefined {
  const rawValue = computedStyle(element, prop)
  if (u.isPresent(rawValue)) {
    return parseFloat(rawValue)
  }
}

/*-
Gets the given inline style(s) from the given element's `[style]` attribute.

If a property is not set, it will be returned as an empty string.

@function up.element.inlineStyle
@param {Element} element
@param {string|Array} propOrProps
  One or more CSS property names in kebab-case.
@return {string|Object}
@internal
*/
export function inlineStyle(element: HTMLElement, prop: string): string
export function inlineStyle(element: HTMLElement, props: string[]): Record<string, string>
export function inlineStyle(element: HTMLElement, props: string | string[]) {
  const { style } = element
  return extractFromStyleObject(style, props)
}

function extractFromStyleObject(style: CSSStyleDeclaration, keyOrKeys: string | string[]): string | Record<string, string> {
  // unpoly-migrate defines all hooks.
  if (up.migrate.loaded) keyOrKeys = up.migrate.fixGetStyleProps!(keyOrKeys)

  if (u.isString(keyOrKeys)) {
    return style.getPropertyValue(keyOrKeys)
  } else { // array
    return u.mapObject(keyOrKeys, (key) => [key, style.getPropertyValue(key)])
  }
}

/*-
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
*/
export function setInlineStyle(element: HTMLElement, props: string | StyleProps, unit = ''): void {
  if (up.migrate.loaded) props = up.migrate.fixSetStyleProps!(props, unit)

  if (u.isString(props)) {
    element.setAttribute('style', props)
  } else {
    const { style } = element
    for (let key in props) {
      let value = props[key]
      // value = normalizeStyleValueForWrite(key, value)
      style.setProperty(key, value + unit)
    }
  }
}

/*-
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
*/
export function setStyleTemp(element: HTMLElement, newStyles: StyleProps): UndoFunction {
  const oldStyles = inlineStyle(element, Object.keys(newStyles))
  setInlineStyle(element, newStyles)
  return () => setInlineStyle(element, oldStyles)
}

/*-
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
*/
export function isVisible(element: HTMLElement): boolean {
  // From https://github.com/jquery/jquery/blame/9cb162f6b62b6d4403060a0f0d2065d3ae96bbcc/src/css/hiddenVisibleSelectors.js#L12
  return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
}

function isUpPrefixed(string: string): boolean {
  return /^up-/.test(string)
}

function pickAttrs(element: Element, attrNames: string[]): Record<string, string> {
  return u.mapObject(attrNames, (name) => [name, element.getAttribute(name)])
}

export function upAttrs(element: Element): Record<string, string> {
  let attrNames = element.getAttributeNames().filter(isUpPrefixed)
  return pickAttrs(element, attrNames)
}

export function upClasses(element: Element): string[] {
  return u.filterList(element.classList.values(), isUpPrefixed)
}

/*-
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
*/
export function isEmpty(element: HTMLElement): boolean {
  return !element.children.length && !element.innerText.trim()
}

export function crossOriginSelector(attr: string): string {
  return `[${attr}*="//"]:not([${attr}*="//${location.host}/"])`
}

export function isIntersectingWindow(element: Element, { margin = 0 }: { margin?: number } = {}): boolean {
  const rect = Rect.fromElement(element)
  rect.grow(margin)

  return (rect.bottom > 0) && (rect.top  < window.innerHeight) &&
    (rect.right  > 0) && (rect.left < window.innerWidth)
}

/*-
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
*/
export function unionSelector(includes: string[], excludes?: string[], condition?: string): string {
  let selector = `:is(${includes.join()})`
  if (u.isPresent(excludes)) selector += `:not(${excludes!.join()})`
  if (condition) selector += `:is(${condition})`
  return selector
}

export function documentPosition(element: Element): [Element, InsertPosition] {
  let nextSibling = element.nextElementSibling
  if (nextSibling) {
    return [nextSibling, 'beforebegin']
  } else {
    // We're the only or last child of our parent.
    // The caller passes an attached element below <html>.
    return [element.parentElement!, 'beforeend']
  }
}

// HTML allows comments before a <!DOCTYPE> or <html> tag (issue #726)
const FIRST_TAG_NAME_PATTERN = /^\s*(<!--[^-]*.*?-->\s*)*<([a-z-!]+)\b/i

function firstTagNameInHTML(html: string): string | undefined {
  return FIRST_TAG_NAME_PATTERN.exec(html)?.[2].toUpperCase()
}

export function isFullDocumentHTML(html: string): boolean {
  let firstTag = firstTagNameInHTML(html)
  return firstTag === 'HTML' || firstTag === '!DOCTYPE'
}

export function leadingElement(nodes: Iterable<Node>): Element | undefined {
  for (let node of nodes) {
    if (u.isElement(node)) {
      return node
    } else if (u.isTextNode(node) && node.textContent.trim()) {
      return
    } else {
      // Empty text node or comment node. Try the next node.
    }
  }
}

export function removeAttrsFromHTML(html: string, attrs: string[]): string {
  let tagPattern = /<[^<]+>/g
  let attrPattern = new RegExp(`\\s+(${attrs.join('|')})="[^"]*"`, 'g')
  let cleanTag = (match: string) => match.replace(attrPattern, '')
  html = html.replace(tagPattern, cleanTag)
  return html
}

// Tag names for which trackDefinitions() is already waiting.
//
// Unlike all other namespace state, this is never reset on up:framework:reset.
// A custom element definition cannot be undone, so forgetting a tag name would only
// start a second promise for the same definition. A tag name that is never defined
// (e.g. a custom element that only exists for CSS) leaves one pending promise that
// references nothing else.
const awaitedTagNames = new Set()

/*-
Emits `up:element:defined` when a custom element in the given root gets defined.

Looks for elements in the given root and its descendants that are not yet [defined](https://developer.mozilla.org/en-US/docs/Web/CSS/:defined),
and waits for their definitions. Each tag name is only awaited once.

Some selectors only match a custom element once it is defined. E.g. a [form-associated custom element](/learn/custom-form-fields#form-associated)
only matches `:enabled` after `customElements.define()`.

@function up.element.trackDefinitions
@param {Element} root
@internal
*/
export function trackDefinitions(root: ParentNode): void {
  for (let { localName } of subtree(root, ':not(:defined)')) {
    if (!awaitedTagNames.has(localName)) {
      awaitedTagNames.add(localName)
      customElements.whenDefined(localName).then(() => up.emit('up:element:defined', { localName, log: false }))
    }
  }
}

/*-
This event is emitted when a custom element on the page gets defined.

Only tag names that were in a fragment Unpoly compiled before their definition are observed.
See `up.element.trackDefinitions()`.

@event up:element:defined
@param {string} event.localName
  The tag name of the custom element that was defined.
@internal
*/

export const api = {
  element: {
    subtree,
    get: getOne,
    toggle,
    hide,
    show,
    createFromSelector,
    setAttrs,
    setMissingAttrs,
    affix,
    createNodesFromHTML,
    createFromHTML,
    attr: stringAttr,
    booleanAttr,
    numberAttr,
    jsonAttr,
    style: computedStyle,
    styleNumber: computedStyleNumber,
    setStyle: setInlineStyle,
    isVisible,
    isEmpty,
  },
}
