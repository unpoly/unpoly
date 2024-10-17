require('./element.sass')

/*-
DOM helpers
===========

The `up.element` module offers functions for DOM manipulation and traversal.

It complements [native `Element` methods](https://www.w3schools.com/jsref/dom_obj_all.asp) and works across all [supported browsers](/up.framework.isSupported).


### Differences to `up.fragment`

`up.element` is a low-level API to work with DOM elements directly. Unpoly also a higher-level API in `up.fragment`:

- By default `up.fragment` functions will only see elements from the [current layer](/up.layer.current).
  `up.element` is not aware of layers and always sees the entire DOM.
- `up.fragment` functions will ignore elements that are [being destroyed](/up-destroying),
  but are still finishing an exit [animation](/up.motion) (e.g. fading out).
- Functions in `up.fragment` support non-standard CSS extensions like `:main` or `:layer`.
  Functions in `up.element` only understands the CSS selectors supported by the current browser.

@module up.element
*/
up.element = (function() {

  const u = up.util

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

    Returns `null` or `undefined` if no element macthes.
  @internal
  */
  function first(...args) {
    let [root = document, selector] = u.args(args, 'val', 'val')
    return root.querySelector(selector)
  }

  /*-
  Returns a list of the given parent's descendants matching the given selector.
  The list will also include the parent element if it matches the selector itself.

  @function up.element.subtree
  @param {Element} parent
    The parent element for the search.
  @param {string} selector
    The CSS selector to match.
  @return {NodeList<Element>|Array<Element>}
    A list of all matching elements.
  @stable
  */
  function subtree(root, selector) {
    const results = []

    if (elementLikeMatches(root, selector)) {
      results.push(root)
    }

    results.push(...root.querySelectorAll(selector))

    return results
  }

  function subtreeFirst(root, selector) {
    return elementLikeMatches(root, selector) ? root : root.querySelector(selector)
  }

  function elementLikeMatches(elementLike, selector) {
    return u.isElement(elementLike) && elementLike.matches(selector)
  }

  /*-
  Returns whether the given element is either the given root element
  or its descendants.

  @function contains
  @internal
  */
  function contains(root, selectorOrElement) {
    const element = getOne(selectorOrElement)
    // We cannot use `root.contains(element)` as <form> elements with an input named "contains"
    // would define `root.contains` to return that input (GH#507).
    return Node.prototype.contains.call(root, element)
  }

  /*-
  @function up.element.ancestor
  @internal
  */
  function ancestor(element, selector) {
    return element.parentNode?.closest(selector)
  }

  function around(element, selector) {
    return getList(element.closest(selector), subtree(element, selector))
  }

  /*-
  Returns the native [Element](https://developer.mozilla.org/en-US/docs/Web/API/Element) for the given value.

  This function is not aware of [layers](/up.layer) or [transitions](/up-destroying)
  and does not support non-standard selectors like `:main`. For this use `up.fragment.get()`.

  ### Casting rules

  - If given an element, returns that element.
  - If given a CSS selector string, returns the first element matching that selector.
  - If given a jQuery collection , returns the first element in the collection.
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
  function getOne(...args) {
    const value = args.pop()

    if (u.isElement(value)) { // Return an element before we run any other expensive checks
      return value
    } else if (u.isString(value)) {
      return first(...args, value)
    } else if (u.isList(value)) {
      if (value.length > 1) {
        up.fail('up.element.get(): Cannot cast multiple elements (%o) to a single element', value)
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

  - If given a string, returns the all elements matching that string.
  - If given any other argument, returns the argument [wrapped as a list](/up.util.wrapList).

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
  function getList(...args) {
    return u.flatMap(args, valueToList)
  }

  function valueToList(value) {
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
  function hide(element) {
    setVisible(element, false)
  }

  /*-
  Elements with this attribute are hidden from the page.

  While `[hidden]` is a [standard HTML attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden)
  its default implementation is [not very useful](https://meowni.ca/hidden.is.a.lie.html).
  In particular it cannot hide elements with any `display` rule.
  Unpoly improves the default CSS styles of `[hidden]` so it can hide arbitrary elements.

  ## Customizing the CSS

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
  > Also all rules should be defined with [`!important`](https://www.w3schools.com/css/css_important.asp) to override other
  > styles defined on that element.

  @selector [hidden]
  @experimental
  */

  /*-
  Shows the given element.

  Also see `up.element.hide()` and `up.element.toggle()`.

  ### Limitations

  The element is shown by removing the `[hidden]` attribute set by `up.element.hide()`.
  In case the element is hidden by an inline style (`[style="display: none"]`),
  that inline style is also removed.

  You may have CSS rules causing the element to remain hidden after calling `up.element.show(element)`.
  Unpoly will *not* handle such cases in order to keep this function performant. As a workaround, you may
  manually set `element.style.display = 'block'`.

  @function up.element.show
  @param {Element} element
  @stable
  */
  function show(element) {
    setVisible(element, true)
  }

  function showTemp(element) {
    return setVisibleTemp(element, true)
  }

  function hideTemp(element) {
    return setVisibleTemp(element, false)
  }

  function setVisibleTemp(element, newVisible) {
    if (newVisible === isVisible(element)) return u.noop
    setVisible(element, newVisible)
    return () => setVisible(element, !newVisible)
  }

  function setVisible(element, newVisible) {
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
  Changes whether the given element is [shown](/up.element.show) or [hidden](/up.element.hide).

  @function up.element.toggle
  @param {Element} element
  @param {boolean} [newVisible]
    Pass `true` to show the element or `false` to hide it.

    If omitted, the element will be hidden if shown and shown if hidden.
  @stable
  */
  function toggle(element, newVisible = !isVisible(element)) {
    setVisible(element, newVisible)
  }

  // /*-
  // [Toggles](/up.element.toggle) the visibility of the given element.
  //
  // Returns a function that undoes the change in visibility.
  //
  // @function up.element.toggleTemp
  // @param {Element} element
  // @param {boolean} [newVisible]
  //   Pass `true` to show the element or `false` to hide it.
  //
  //   If omitted, the element will be hidden if shown and shown if hidden.
  // @return {Function}
  //   Returns a function that undoes the change in visibility.
  // @experimental
  // */
  // function toggleTemp(element, newVisible = !isVisible(element)) {
  //   return setVisibleTemp(element, newVisible)
  // }

  function setAttrPresence(element, attr, value, newPresent) {
    if (newPresent) {
      return element.setAttribute(attr, value)
    } else {
      return element.removeAttribute(attr)
    }
  }

  /*-
  Sets properties from the given object as attributes on the given element.

  ### Example

  ```js
  up.element.setAttrs(element, { title: 'Tooltip', tabindex: 1 })

  element.getAttribute('title') // => "Tooltip"
  element.getAttribute('tabindex') // => "1"
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
  function setAttrs(element, attrs) {
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
  element.getAttribute('title') // => "Original"
  ```

  @function up.element.setAttrsTemp
  @param {Element} element
    The element on which to set attributes.
  @param {Object} attributes
    An object of attribute names and values to set.

    To set an empty attribute, pass an empty string value.

    To remove an attribute, use a value of `null` or `undefined`.
  @return {Function}
    A function that restores the attributes to their value before the change.
  @internal
  */
  function setAttrsTemp(element, attrs) {
    let keys = Object.keys(attrs)
    let oldAttrs = pickAttrs(element, keys)
    setAttrs(element, attrs)
    return () => setAttrs(element, oldAttrs)
  }

  /*-
  @function up.element.metaContent
  @internal
  */
  function metaContent(name) {
    const selector = "meta" + attrSelector('name', name)
    return first(selector)?.getAttribute('content')
  }

  /*-
  @function up.element.insertBefore
  @internal
  */
  function insertBefore(existingNode, newNode) {
    // We're not using insertAdjacentElement() because that does not work with Text nodes
    existingNode.parentNode.insertBefore(newNode, existingNode)
  }

  /*-
  Creates an element matching the given CSS selector.

  The created element will not yet be attached to the DOM tree.
  Attach it with [`Element#appendChild()`](https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild)
  or use `up.element.affix()` to create an already-attached element.

  Use `up.hello()` to activate [JavaScript behavior](/up.script) within the created element.

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

  You may also pass an object of attribute names/values as a second argument:

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
  // element is <div>inner text</div>
  ```

  ### Setting inline styles

  You may set inline styles by passing an object of CSS properties as a `{ style }` option:

  ```js
  element = up.element.createFromSelector('div', { style: { color: 'red' }})
  // element is <div style="color: red"></div>
  ```

  @function up.element.createFromSelector
  @param {string} selector
    The CSS selector from which to create an element.
  @param {Object} [attrs]
    An object of attributes to set on the created element.
  @param {Object} [attrs.text]
    The [text content](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) of the created element.
  @param {Object} [attrs.content]
    The [inner HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) of the created element.
  @param {Object|string} [attrs.style]
    An object of CSS properties that will be set as the inline style
    of the created element. The given object must use kebab-case keys.

    You may also pass a string with semicolon-separated styles.

  @return {Element}
    The created element.
  @stable
  */
  function createFromSelector(selector, attrs = {}) {
    let { includePath } = parseSelector(selector)

    let rootElement
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

  function makeVariation(element, { id, classNames, attributes }) {
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
       include: [
         { classNames: ['.content'],
           attributes: {}
         },
         { tagName: 'form',
           classNames: [],
           attributes: { action: "/" }
         }
       ],
       exclude: {
         raw: ".bar"
       }
     }
  ```

  @function up.element.parseSelector
  @internal
  */
  function parseSelector(rawSelector) {
    let excludeRaw

    const { selector: selectorWithoutAttrValues, restore: restoreAttrValues, parse: parsePlaceholderAttrs } = simplifyAttrSelectors(rawSelector)

    const includeWithoutAttrValues = selectorWithoutAttrValues.replace(/:not\((\([^)]+\)|[^()])+\)/, function(match) {
      excludeRaw = restoreAttrValues(match)
      return ''
    })

    let includeRaw = restoreAttrValues(includeWithoutAttrValues)

    const includeSegments = includeWithoutAttrValues.split(/[ >]+/)

    let includePath = includeSegments.map(function(depthSelector) {
      let parsed = {
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

      // If we have stripped out attrValues at the beginning of the function,
      // they have been replaced with the attribute name only (as "[name]").
      depthSelector = parsePlaceholderAttrs(depthSelector, function({ name, value }) {
        parsed.attributes[name] = value
        return ''
      })

      if (depthSelector) {
        up.fail('Cannot parse selector: ' + rawSelector)
      }

      return parsed
    })

    return {
      includePath,
      includeRaw,
      excludeRaw,
    }
  }

  // function splitSelector(rawSelector, separator) {
  //   let { selector, restore } = simplifyAttrSelectors(rawSelector)
  //   return selector.split(separator).map(restore)
  // }

  const ATTR_SELECTOR_PATTERN = /\[([\w-]+)(?:([~|^$*]?=)(["'])?([^\3\]]*?)\3)?]/g

  function replaceAttrSelectors(string, replacement) {
    return string.replace(ATTR_SELECTOR_PATTERN, function(raw, name, _operator, _quote, value) {
      if (value) {
        value = value.replace(/\\([\\"'])/, '$1')
      } else {
        value = ''
      }
      return replacement({ raw, name, value })
    })
  }

  function simplifyAttrSelectors(rawSelector) {
    let parseResults = {}
    let i = 0

    // Replace attribute expressions with placeholders, to make the resulting string safe for grepping:
    //
    //     simplifyAttrSelectors('.klass[key]>#id').selector         // => '.klass[$0]>#id'
    //     simplifyAttrSelectors('.klass[key=value]>#id').selector   // => '.klass[$1]>#id'
    //     simplifyAttrSelectors('.klass[key="value"]>#id').selector // => '.klass[$2]>#id'
    let selector = replaceAttrSelectors(rawSelector, function(parseResult) {
      let placeholder = `v${i++}`
      parseResults[placeholder] = parseResult
      return `[${placeholder}]`
    })

    // Accepts a string that may contain placeholders and calls the given function
    // with the selector properties parsed during simplifiction. The placeholders will
    // be replaced with the callback result.
    //
    //     let { parse } = simplifyAttrSelectors('.klass[data-foo="value"]') // => '.klass[$0]'
    //     parse('before [$0] after', ({ name, operator, value }) => name) // => 'data-foo'
    let parse = (str, callback) => replaceAttrSelectors(str, ({ name }) => callback(parseResults[name]))

    // Accepts a string that may contain placeholders and replaces each placeholder
    // with its original attribute expression:
    //
    //     let { parse } = simplifyAttrSelectors('.klass[data-foo="value"]') // => '.klass[$0]'
    //     restore('before [$0] after') // => 'before [data-foo="value"] after'
    let restore = (str) => parse(str, ({ raw }) => raw)

    return { selector, parse, restore }
  }

  /*-
  Creates an element matching the given CSS selector and attaches it to the given parent element.

  To create a detached element from a selector, see `up.element.createFromSelector()`.

  Use `up.hello()` to activate [JavaScript behavior](/up.script) within the created element.

  ### Example

  ```js
  element = up.element.affix(document.body, '.klass')
  element.parentElement // returns document.body
  element.className // returns 'klass'
  ```

  See `up.element.createFromSelector()` for many more examples.

  @function up.element.affix
  @param {Element} parent
    The parent to which to attach the created element.
  @param {string} [position='beforeend']
    The position of the new element in relation to `parent`.

    @include adjacent-positions
  @param {string} selector
    The CSS selector from which to create an element.
  @param {Object} [attrs]
    An object of attributes to set on the created element.
  @param {Object} [attrs.text]
    The [text content](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) of the created element.
  @param {Object} [attrs.content]
    The [inner HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) of the created element.
  @param {Object|string} [attrs.style]
    An object of CSS properties that will be set as the inline style
    of the created element.

    The given object must use kebab-case keys.
  @return {Element}
    The created element.
  @stable
  */
  function affix(...args) {
    let [parent, position = 'beforeend', selector, attributes] = u.args(args, 'val', u.isAdjacentPosition, 'val', 'options')
    const element = createFromSelector(selector, attributes)
    parent.insertAdjacentElement(position, element)
    return element
  }

  const SINGLETON_TAG_NAMES = ['HTML', 'BODY', 'HEAD', 'TITLE']

  /*-
  @function up.element.isSingleton
  @internal
  */
  const isSingleton = up.mockable(element => element.matches(SINGLETON_TAG_NAMES.join()))

  function elementTagName(element) {
    return element.tagName.toLowerCase()
  }

  /*-
  @function up.element.attrSelector
  @internal
  */
  function attrSelector(attribute, value) {
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

  function idSelector(id) {
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
  function classSelector(klass) {
    klass = klass.replace(/[^\w-]/g, '\\$&')
    return `.${klass}`
  }

  /*-
  Parses a new `Document` instance from the given HTML.

  This function always creates a full document with a <html> root,
  even if the given `html` string only contains a fragment.

  Due to quirks in the `DOMParser` spec, `<script>` and `<noscript>`
  elements in the returned document will be inert. To make them active,
  use `up.element.fixParserDamage()`.

  @function up.element.createBrokenDocumentFromHTML
  @param {string} html
  @return {Document}
  @internal
  */
  function createBrokenDocumentFromHTML(html) {
    return new DOMParser().parseFromString(html, 'text/html')
  }

  /*-
  Fixes `<script>` and `<noscript>` elements in documents parsed by `up.element.createBrokenDocumentFromHTML()`.

  This addresses two [quirks in the `DOMParser` spec](http://w3c.github.io/DOM-Parsing/#dom-domparser-parsefromstring):

  1. Children of a <nonscript> tag are expected to be a verbatim text node in a scripting-capable browser.
     However, `DOMParser` parses children into actual DOM nodes.
     This confuses libraries that work with <noscript> tags, such as lazysizes.
  2. <script> elements are inert and will not run code when inserted into the main `document`.

  @function up.element.fixParserDamage
  @param {Element} scriptish
    A `<script>` or `<noscript>` element.
  @internal
  */
  function fixParserDamage(scriptish) {
    // We cannot use `scriptish.cloneNode(true)` as this does not fix broken <noscript> elements
    let clone = createFromHTML(scriptish.outerHTML)
    scriptish.replaceWith(clone)
  }

  /*-
  Creates an element from the given HTML fragment string.

  Use `up.hello()` to activate [JavaScript behavior](/up.script) within the created element.

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
  @stable
  */
  function createFromHTML(html) {
    return extractSingular(parseNodesFromHTML(html))
  }

  /*-
  Checks if the given list contains a single `Element` and returns that element.

  Throws an error if the given list contains more than one node.
  Throws an error if the given list only contains a `Text` node.

  @function up.element.extractSingular
  @param {List<Node>}
  @return {Element}
  @internal
  */
  function extractSingular(nodes) {
    if (nodes.length === 1 && u.isElement(nodes[0])) {
      return nodes[0]
    } else {
      up.fail('HTML must have a single root element')
    }
  }

  function parseNodesFromHTML(html) {
    // Prevent all-whitespace text nodes at the beginning or end
    html = html.trim()

    // (1) We cannot use createBrokenDocumentFromHTML() here, since up.ResponseDoc
    //     needs to create <noscript> elements, and DOMParser cannot create those.
    //     Also it always parses a full document, and we would need to rediscover our element
    //     root within that.
    // (2) We cannot use innerHTML on an anonymous element here, since up.ResponseDoc
    //     needs to create executable <script> elements and setting innerHTML will
    //     create intert <script> elements.
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
  function getRoot() {
    return document.documentElement
  }

  /*-
  Forces the browser to paint the given element now.

  @function up.element.paint
  @internal
  */
  function paint(element) {
    element.offsetHeight
  }

  /*-
  @function up.element.concludeCSSTransition
  @internal
  */
  function concludeCSSTransition(element) {
    const undo = setStyleTemp(element, { transition: 'none' })
    // Browsers need to paint at least one frame without a transition to stop the
    // animation. In theory we could just wait until the next paint, but in case
    // someone will set another transition after us, let's force a repaint here.
    paint(element)
    return undo
  }

  /*-
  Returns whether the given element has a CSS transition set.

  @function up.element.hasCSSTransition
  @param {Object} styleHash
  @return {boolean}
  @internal
  */
  function hasCSSTransition(styleHash) {
    const prop = styleHash['transition-property']
    const duration = styleHash['transition-duration']
    // The default transition for elements is actually "all 0s ease 0s"
    // instead of "none", although that has the same effect as "none".
    const noTransition = ((prop === 'none') || ((prop === 'all') && (duration === 0)))
    return !noTransition
  }

  /*-
  @function up.element.fixedToAbsolute
  @internal
  */
  function fixedToAbsolute(element) {
    const elementRectAsFixed = element.getBoundingClientRect()

    // Set the position to 'absolute' so it gains an offsetParent
    element.style.position = 'absolute'

    const offsetParentRect = element.offsetParent.getBoundingClientRect()

    setInlineStyle(element, {
      left: (elementRectAsFixed.left - computedStyleNumber(element, 'margin-left') - offsetParentRect.left) + 'px',
      top: (elementRectAsFixed.top - computedStyleNumber(element, 'margin-top') - offsetParentRect.top) + 'px',
      right: '',
      bottom: ''
    })
  }

  /*-
  On the given element, set attributes that are still missing.

  @function up.element.setMissingAttrs
  @internal
  */
  function setMissingAttrs(element, attrs) {
    for (let key in attrs) {
      setMissingAttr(element, key, attrs[key])
    }
  }

  function setMissingAttr(element, key, value) {
    if (u.isMissing(element.getAttribute(key))) {
      element.setAttribute(key, value)
    }
  }

  /*-
  @function up.element.unwrap
  @internal
  */
  function unwrap(wrapper) {
    preservingFocus(function() {
      // Make a copy as it is a live list and we to iterate over it while also mutating it.
      let childNodes = [...wrapper.childNodes]
      for (let child of childNodes) insertBefore(wrapper, child)
      wrapper.remove()
    })
  }

  function wrapNodes(nodeOrNodes) {
    const wrapper = document.createElement('up-wrapper')
    wrapper.append(...u.wrapList(nodeOrNodes))
    return wrapper
  }

  function wrapIfRequired(nodes) {
    if (nodes.length === 1 && u.isElement(nodes[0])) {
      return nodes[0]
    } else {
      // There are multiple cases when we want to create a wrapper:
      // (1) We have multiple nodes, possibly a mix of Element and Text nodes
      // (2) We have a single Text node
      // (39 We have an empty list
      return wrapNodes(nodes)
    }
  }

  // function wrapSelf(element) {
  //   let wrapper = createWrapper()
  //   insertBefore(element, wrapper)
  //   wrapper.append(element)
  //   return wrapper
  // }

  function wrapChildren(element) {
    const wrapper = wrapNodes(element.childNodes)
    element.append(wrapper)
    return wrapper
  }

  function preservingFocus(fn) {
    const oldFocusElement = document.activeElement
    try {
      return fn()
    } finally {
      if (oldFocusElement && oldFocusElement !== document.activeElement) {
        oldFocusElement.focus({ preventScroll: true })
      }
    }
  }

  function parseAttr(element, attribute, ...parsers) {
    // The document does not respond to #hasAttribute()
    if (!element.hasAttribute?.(attribute)) return undefined
    let rawValue = element.getAttribute(attribute)

    for (let parser of parsers) {
      let parserResult = parser(rawValue, attribute, element)
      if (u.isDefined(parserResult)) return parserResult
    }
  }

  /*-
  Returns the given `attribute` value for the given `element`.

  If the element does not have the given attribute, it returns `undefined`.
  This is a difference to the native `Element#getAttribute()`, which [mostly returns `null` in that case](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute#Non-existing_attributes).

  If the element has the attribute but without value (e.g. `<input readonly>`), it returns an empty string.

  @function up.element.attr
  @stable
  */
  function stringAttr(element, attribute) {
    return parseAttr(element, attribute, tryParseString)
  }

  let tryParseString = u.identity

  /*-
  Returns the value of the given attribute on the given element, cast as a boolean value.

  If the attribute value cannot be cast to `true` or `false`, `undefined` is returned.

  ### Casting rules

  This function deviates from the
  [HTML Standard for boolean attributes](https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes)
  in order to allow `undefined` values. When an attribute is missing, Unpoly considers the value to be `undefined`
  (where the standard would assume `false`).

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
  @param {boolean} [pass=false]
    Whether to return a non-boolean value unparsed.

    @internal
  @return {boolean|undefined}
    The cast attribute value.
  @stable
  */
  function booleanAttr(element, attribute) {
    return parseAttr(element, attribute, tryParseBoolean)
  }

  function tryParseBoolean(value, attribute) {
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
  @param {any} [trueValue=true]
    The value to return if the attribute value is `''`, `'true'` or equal to the attribute name.
  @internal
  */
  function booleanOrStringAttr(element, attribute) {
    return parseAttr(element, attribute, tryParseBoolean, tryParseString)
  }

  /*-
  Returns the given attribute value cast as boolean.

  If the attribute value cannot be cast to a boolean, tries to cast the the attribute value to a number.

  If the attribute value cannot be cast to either boolean or number, returns `undefined`.

  @function up.element.booleanOrNumberAttr
  @param {Element} element
    The element from which to retrieve the attribute value.
  @param {string} attribute
    The attribute name.
  @internal
  */
  function booleanOrNumberAttr(element, attribute) {
    return parseAttr(element, attribute, tryParseBoolean, tryParseNumber)
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
  function numberAttr(element, attribute) {
    return parseAttr(element, attribute, tryParseNumber)
  }

  function tryParseNumber(value) {
    value = value.replaceAll('_', '')
    if (value.match(/^-?[\d.]+$/)) {
      return parseFloat(value)
    }
  }

  /*-
  Reads the given attribute from the element, parsed as [JSON](https://www.json.org/).

  Returns `undefined` if the attribute value is [blank](/up.util.isBlank) or only consists of whitespace.

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
  function jsonAttr(element, attribute) {
    return parseAttr(element, attribute, tryParseJSON)
  }

  function tryParseJSON(value) {
    if (value?.trim()) {
      return u.parseRelaxedJSON(value)
    }
 }

  function callbackAttr(link, attr, callbackOptions) {
    return parseAttr(link, attr, (value) => tryParseCallback(value, link, callbackOptions))
  }

  function tryParseCallback(code, link, { exposedKeys = [], mainKey = 'event' } = {}) {
    // Users can prefix a CSP nonce like this: <a href="/path" up-on-loaded="nonce-kO52Iphm8B alert()">
    // In up.ResponseDoc#finalizeElement() we have rewritten the attribute nonce to the current page's nonce
    // IFF the attribute nonce matches the fragment response's nonce.
    const callback = up.NonceableCallback.fromString(code).toFunction(mainKey, ...exposedKeys)

    return function(event) {
      // Allow callbacks to refer to an exposed property directly instead of through `event.value`.
      const exposedValues = Object.values(u.pick(event, exposedKeys))

      // Emulate the behavior of the `onclick` attribute,
      // where `this` refers to the clicked element.
      return callback.call(link, event, ...exposedValues)
    }
  }

  function closestAttr(element, attr, readAttrFn = stringAttr) {
    let match = element.closest('[' + attr + ']')
    if (match) {
      return readAttrFn(match, attr)
    }
  }

  function addClasses(element, classes) {
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

  let undo = up.element.addClassTemp('bar')
  element.className // => 'foo bar'

  undo()
  element.className // => 'foo'
  ```

  @function up.element.addClassTemp
  @return {Function}
    A function that restores the original class list when called.
  @internal
  */
  function addClassTemp(element, klass) {
    return setClassStateTemp(element, klass, true)
  }

  function removeClassTemp(element, klass) {
    return setClassStateTemp(element, klass, false)
  }

  function setClassStateTemp(element, klass, targetState) {
    if (element.classList.contains(klass) === targetState) return u.noop
    element.classList.toggle(klass, targetState)
    return () => element.classList.toggle(klass, !targetState)
  }

  /*-
  Receives [computed CSS styles](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle)
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
  @stable
  */
  function computedStyle(element, props) {
    const style = window.getComputedStyle(element)
    return extractFromStyleObject(style, props)
  }

  /*-
  Receives a [computed CSS property value](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle)
  for the given element, casted as a number.

  The value is casted by removing the property's [unit](https://www.w3schools.com/cssref/css_units.asp) (which is usually `px` for computed properties).
  The result is then parsed as a floating point number.

  Returns `undefined` if the property value is missing. Returns `NaN` if the value cannot parsed as a number.

  ### Examples

  ```js
  let value = up.element.style(element, 'font-size')
  // value is '16px'

  let value = up.element.styleNumber(element, 'font-size')
  // value is 16
  ```

  @function up.element.styleNumber
  @param {Element} element
  @param {string} prop
    A single property name in kebab-case.
  @return {number|undefined|NaN}
  @stable
  */
  function computedStyleNumber(element, prop) {
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
  function inlineStyle(element, props) {
    const { style } = element
    return extractFromStyleObject(style, props)
  }

  function extractFromStyleObject(style, keyOrKeys) {
    if (up.migrate.loaded) keyOrKeys = up.migrate.fixStyleProps(keyOrKeys)

    if (u.isString(keyOrKeys)) {
      return style.getPropertyValue(keyOrKeys)
    } else { // array
      return u.mapObject(keyOrKeys, (key) => [key, style.getPropertyValue(key)])
    }
  }

  /*-
  Sets the given CSS properties as inline styles on the given element.

  @function up.element.setStyle
  @param {Element} element
  @param {Object} props
    One or more CSS properties with kebab-case keys.
  @stable
  */
  function setInlineStyle(element, props, unit = '') {
    if (up.migrate.loaded) props = up.migrate.fixStyleProps(props, unit)

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
  getComputedStyle(element).fontSize // => '12px'
  ```

  @function up.element.setStyleTemp
  @param {Element} element
    The element to style.
  @param {Object} styles
    One or more CSS properties with kebab-case keys.
  @return {Function()}
    A function that restores the original inline styles when called.
  @internal
  */
  function setStyleTemp(element, newStyles) {
    const oldStyles = inlineStyle(element, Object.keys(newStyles))
    setInlineStyle(element, newStyles)
    return () => setInlineStyle(element, oldStyles)
  }

  /*-
  Returns whether the given element is currently visible.

  An element is considered visible if it consumes space in the document.
  Elements with `{ visibility: hidden }` or `{ opacity: 0 }` are considered visible, since they still consume space in the layout.

  Elements not attached to the DOM are considered hidden.

  @function up.element.isVisible
  @param {Element} element
    The element to check.
  @return {boolean}
  @stable
  */
  function isVisible(element) {
    // From https://github.com/jquery/jquery/blame/9cb162f6b62b6d4403060a0f0d2065d3ae96bbcc/src/css/hiddenVisibleSelectors.js#L12
    return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
  }

  function isUpPrefixed(string) {
    return /^up-/.test(string)
  }

  function pickAttrs(element, attrNames) {
    return u.mapObject(attrNames, (name) => [name, element.getAttribute(name)])
  }

  function upAttrs(element) {
    let attrNames = element.getAttributeNames().filter(isUpPrefixed)
    return pickAttrs(element, attrNames)
  }

  function upClasses(element) {
    return u.filter(element.classList.values(), isUpPrefixed)
  }

  /*-
  Cleans up internal jQuery caches for the given element.

  As a side effect the element is removed from the DOM.

  @function up.element.safeRemove
  @param {Element} element
  @internal
  */
  function cleanJQuery(element) {
    if (up.browser.canJQuery()) {
      // jQuery elements store internal attributes in a global cache.
      // We need to remove the element via jQuery or we will leak memory.
      // See https://makandracards.com/makandra/31325-how-to-create-memory-leaks-in-jquery
      jQuery(element).remove()
    }
  }

  /*-
  Returns whether the given element has no content.

  An element is considered to have content if it has either child elements or non-whitespace text.

  ### Examples

  These `<div>` elments are all considered empty:

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
  function isEmpty(element) {
    return !element.children.length > 0 && !element.innerText.trim()
  }

  function crossOriginSelector(attr) {
    return `[${attr}*="//"]:not([${attr}*="//${location.host}/"])`
  }

  function isIntersectingWindow(element, { margin = 0 } = {}) {
    const rect = up.Rect.fromElement(element)
    rect.grow(margin)

    return (rect.bottom > 0) && (rect.top  < window.innerHeight) &&
      (rect.right  > 0) && (rect.left < window.innerWidth)
  }

  function unionSelector(includes, excludes) {
    let selector = `:is(${includes.join()})`
    if (u.isPresent(excludes)) selector += `:not(${excludes.join()})`
    return selector
  }

  function matchSelectorMap(selectorMap, element) {
    let matches = []

    if (selectorMap) {
      for (let [selector, value] of Object.entries(selectorMap)) {
        if (u.isDefined(value) && element.matches(selector)) {
          matches.push(value)
        }
      }
    }

    return matches
  }

  function documentPosition(element) {
    let nextSibling = element.nextElementSibling
    if (nextSibling) {
      return [nextSibling, 'beforebegin']
    } else {
      // We're the only or last child of our parent.
      return [element.parentElement, 'beforeend']
    }
  }

  return {
    subtree,
    subtreeFirst,
    contains,
    closestAttr,
    ancestor,
    around,
    get: getOne,
    list: getList,
    toggle,
    // toggleTemp,
    hide,
    hideTemp,
    show,
    showTemp,
    metaContent,
    insertBefore,
    createFromSelector,
    setAttrs,
    setAttrsTemp,
    affix,
    idSelector,
    classSelector,
    isSingleton,
    attrSelector,
    tagName: elementTagName,
    createBrokenDocumentFromHTML,
    fixParserDamage,
    parseNodesFromHTML,
    createFromHTML,
    extractSingular,
    get root() { return getRoot() },
    paint,
    concludeCSSTransition,
    hasCSSTransition,
    fixedToAbsolute,
    setMissingAttrs,
    setMissingAttr,
    unwrap,
    wrapChildren,
    wrapIfRequired,
    attr: stringAttr,
    booleanAttr,
    numberAttr,
    jsonAttr,
    callbackAttr,
    booleanOrStringAttr,
    booleanOrNumberAttr,
    setStyleTemp,
    style: computedStyle,
    styleNumber: computedStyleNumber,
    inlineStyle,
    setStyle: setInlineStyle,
    isVisible,
    upAttrs,
    upClasses,
    setAttrPresence,
    addClasses,
    addClassTemp,
    removeClassTemp,
    cleanJQuery,
    parseSelector,
    // splitSelector,
    makeVariation,
    isEmpty,
    crossOriginSelector,
    isIntersectingWindow,
    unionSelector,
    matchSelectorMap,
    elementLikeMatches,
    documentPosition,
  }
})()
