require('./element.sass')

/*-
DOM helpers
===========

The `up.element` module offers functions for DOM manipulation and traversal.

It complements [native `Element` methods](https://www.w3schools.com/jsref/dom_obj_all.asp) and works across all [supported browsers](/up.framework.isSupported).



### Differences to `up.fragment`

`up.element` is a low-level API to work with DOM elements directly we recommend using `up.fragment`:


- By default `up.fragment` functions will only see elements from the [current layer](/up.layer.current).
  `up.element` is not aware of layers and always sees the entire DOM.
- `up.fragment` functions will ignore elements that are being destroyed, but are still finishing an exit [animation](/up.motion) (e.g. fading out).

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
    const selector = args.pop()
    const root = args[0] || document
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

    if (root.matches(selector)) {
      results.push(root)
    }

    results.push(...root.querySelectorAll(selector))

    return results
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
    let parentElement = element.parentElement
    if (parentElement) {
      if (parentElement.matches(selector)) {
        return parentElement
      } else {
        return ancestor(parentElement, selector)
      }
    }
  }

  function around(element, selector) {
    return getList(element.closest(selector), subtree(element, selector))
  }

  /*-
  Returns the native [Element](https://developer.mozilla.org/en-US/docs/Web/API/Element) for the given value.

  ### Casting rules

  - If given an element, returns that element.
  - If given a CSS selector string, returns the first element matching that selector.
  - If given a jQuery collection , returns the first element in the collection.
    Throws an error if the collection contains more than one element.
  - If given any other argument (`undefined`, `null`, `document`, `window`…), returns the argument unchanged.

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
  @param {Array<jQuery|Element|Array<Element>|String|undefined|null>} ...args
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
    // Set an attribute that the user can style with custom "hidden" styles.
    // E.g. certain JavaScript components cannot initialize properly within a
    // { display: none }, as such an element has no width or height.
    element.setAttribute('hidden', '')
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
    // Remove the attribute set by `up.element.hide()`.
    element.removeAttribute('hidden')

    // In case the element was manually hidden through an inline style
    // of `display: none`, we also remove that.
    if (element.style.display === 'none') {
      element.style.display = ''
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
  function toggle(element, newVisible) {
    if (newVisible == null) { newVisible = !isVisible(element) }
    (newVisible ? show : hide)(element)
  }


  function toggleAttr(element, attr, value, newPresent) {
    if (newPresent == null) { newPresent = !element.hasAttribute(attr) }
    if (newPresent) {
      return element.setAttribute(attr, value)
    } else {
      return element.removeAttribute(attr)
    }
  }

  /*-
  Sets all key/values from the given object as attributes on the given element.

  ### Example

      up.element.setAttrs(element, { title: 'Tooltip', tabindex: 1 })

  @function up.element.setAttrs
  @param {Element} element
    The element on which to set attributes.
  @param {Object} attributes
    An object of attributes to set.
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

  function setTemporaryAttrs(element, attrs) {
    const oldAttrs = {}
    for (let key of Object.keys(attrs)) {
      oldAttrs[key] = element.getAttribute(key)
    }
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
  function insertBefore(existingElement, newElement) {
    existingElement.insertAdjacentElement('beforebegin', newElement)
  }

  /*-
  Creates an element matching the given CSS selector.

  The created element will not yet be attached to the DOM tree.
  Attach it with [`Element#appendChild()`](https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild)
  or use `up.element.affix()` to create an attached element.

  Use `up.hello()` to activate JavaScript behavior within the created element.

  ### Examples

  To create an element with a given tag name:

      element = up.element.createFromSelector('span')
      // element is <span></span>

  To create an element with a given class:

      element = up.element.createFromSelector('.klass')
      // element is <div class="klass"></div>

  To create an element with a given ID:

      element = up.element.createFromSelector('#foo')
      // element is <div id="foo"></div>

  To create an element with a given boolean attribute:

      element = up.element.createFromSelector('[attr]')
      // element is <div attr></div>

  To create an element with a given attribute value:

      element = up.element.createFromSelector('[attr="value"]')
      // element is <div attr="value"></div>

  You may also pass an object of attribute names/values as a second argument:

      element = up.element.createFromSelector('div', { attr: 'value' })
      // element is <div attr="value"></div>

  You may set the element's inner text by passing a `{ text }` option (HTML control characters will
  be escaped):

      element = up.element.createFromSelector('div', { text: 'inner text' })
      // element is <div>inner text</div>

  You may set the element's inner HTML by passing a `{ content }` option:

      element = up.element.createFromSelector('div', { content: '<span>inner text</span>' })
      // element is <div>inner text</div>

  You may set inline styles by passing an object of CSS properties as a second argument:

      element = up.element.createFromSelector('div', { style: { color: 'red' }})
      // element is <div style="color: red"></div>

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
    of the created element. The given object may use kebab-case or camelCase keys.

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
      let { tagName, id, classNames, attributes } = includeSegment

      if (!tagName || tagName === '*') {
        tagName = 'div'
      }

      depthElement = document.createElement(tagName)

      if (!rootElement) {
        rootElement = depthElement
      }

      if (id) {
        depthElement.id = id
      }

      for (let className of classNames) {
        depthElement.classList.add(className)
      }

      for (let attributeName in attributes) {
        let attributeValue = attributes[attributeName]
        depthElement.setAttribute(attributeName, attributeValue || '')
      }

      previousElement?.appendChild(depthElement)
      previousElement = depthElement
    }

    for (let key in attrs) {
      let value = attrs[key]
      if (key === 'class') {
        for (let klass of u.wrapList(value)) {
          rootElement.classList.add(klass)
        }
      } else if (key === 'style') {
        setInlineStyle(rootElement, value)
      } else if (key === 'text') {
        rootElement.textContent = value
      } else if (key === 'content') {
        rootElement.innerHTML = value
      } else {
        rootElement.setAttribute(key, value)
      }
    }

    return rootElement
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
  function parseSelector(selector) {
    let excludeRaw

    const includeRaw = selector.replace(/:not\([^)]+\)/, function(match) {
      excludeRaw = match
      return ''
    })

    // Extract attribute values before we match the string.
    // Attribute values might contain spaces, and then we would incorrectly
    // split depths at that space.
    const [includeSelectorWithoutAttrValues, attrValues] = removeAttrSelectorValues(includeRaw)

    const includeSegments = includeSelectorWithoutAttrValues.split(/[ >]+/)

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
      if (attrValues.length) {
        depthSelector = replaceAttrSelectors(depthSelector, function({ name }) {
          parsed.attributes[name] = attrValues.shift()
          return ''
        })
      }

      if (depthSelector) {
        up.fail('Cannot parse selector: ' + selector)
      }

      return parsed
    })

    return {
      includePath,
      includeRaw,
      excludeRaw,
    }
  }

  const ATTR_SELECTOR_PATTERN = /\[([\w-]+)(?:([~|^$*]?=)(["'])?([^\3\]]*?)\3)?]/g

  function replaceAttrSelectors(string, replacement) {
    return string.replace(ATTR_SELECTOR_PATTERN, function(_match, name, operator, quote, value) {
      if (value) {
        value = value.replace(/\\([\\"'])/, '$1')
      }
      return replacement({ name, operator, quote, value })
    })
  }

  function removeAttrSelectorValues(selector) {
    let values = []
    selector = replaceAttrSelectors(selector, function({ name, value }) {
      values.push(value)
      return `[${name}]`
    })
    return [selector, values]
  }

  /*-
  Creates an element matching the given CSS selector and attaches it to the given parent element.

  To create a detached element from a selector, see `up.element.createFromSelector()`.

  Use `up.hello()` to activate JavaScript behavior within the created element.

  ### Example

  ```js
  element = up.element.affix(document.body, '.klass')
  element.parentElement // returns document.body
  element.className // returns 'klass'
  ```

  @function up.element.affix
  @param {Element} parent
    The parent to which to attach the created element.
  @param {string} [position='beforeend']
    The position of the new element in relation to `parent`.
    Can be one of the following values:

    - `'beforebegin'`: Before `parent`, as a new sibling.
    - `'afterbegin'`: Just inside `parent`, before its first child.
    - `'beforeend'`: Just inside `parent`, after its last child.
    - `'afterend'`: After `parent`, as a new sibling.
  @param {string} selector
    The CSS selector from which to create an element.
  @param {Object} attrs
    An object of attributes to set on the created element.
  @param {Object} attrs.text
    The [text content](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) of the created element.
  @param {Object|string} attrs.style
    An object of CSS properties that will be set as the inline style
    of the created element.

    The given object may use kebab-case or camelCase keys.
  @return {Element}
    The created element.
  @stable
  */
  function affix(parent, ...args) {
    let position, selector
    const attributes = u.extractOptions(args)

    if (args.length === 2) {
      [position, selector] = args
    } else {
      position = 'beforeend'
      selector = args[0]
    }

    const element = createFromSelector(selector, attributes)
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentElement

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
    if (id.match(/^[a-z0-9\-_]+$/i)) {
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
  use `up.element.fixScriptish()`.

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

  @function up.element.fixScriptish
  @param {Element} scriptish
    A `<script>` or `<noscript>` element.
  @internal
  */
  function fixScriptish(scriptish) {
    let clone = document.createElement(scriptish.tagName)
    for (let { name, value } of scriptish.attributes) {
      clone.setAttribute(name, value)
    }

    clone.textContent = scriptish.innerHTML
    scriptish.replaceWith(clone)
  }

  /*-
  Creates an element from the given HTML fragment string.

  Use `up.hello()` to activate JavaScript behavior within the created element.

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
    const fragment = range.createContextualFragment(html.trim())
    let elements = fragment.childNodes
    if (elements.length !== 1) {
      throw new Error('HTML must have a single root element')
    }
    return elements[0]
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
    const undo = setTemporaryStyle(element, {transition: 'none'})
    // Browsers need to paint at least one frame without a transition to stop the
    // animation. In theory we could just wait until the next paint, but in case
    // someone will set another transition after us, let's force a repaint here.
    paint(element)
    return undo
  }

  /*-
  Returns whether the given element has a CSS transition set.

  @function up.element.hasCSSTransition
  @return {boolean}
  @internal
  */
  function hasCSSTransition(elementOrStyleHash) {
    let styleHash
    if (u.isOptions(elementOrStyleHash)) {
      styleHash = elementOrStyleHash
    } else {
      styleHash = computedStyle(elementOrStyleHash)
    }

    const prop = styleHash.transitionProperty
    const duration = styleHash.transitionDuration
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
      left: elementRectAsFixed.left - computedStyleNumber(element, 'margin-left') - offsetParentRect.left,
      top: elementRectAsFixed.top - computedStyleNumber(element, 'margin-top') - offsetParentRect.top,
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
      const parent = wrapper.parentNode
      const wrappedNodes = u.toArray(wrapper.childNodes)
      u.each(wrappedNodes, wrappedNode => parent.insertBefore(wrappedNode, wrapper))
      parent.removeChild(wrapper)
    })
  }

  function wrapChildren(element) {
    let childNode
    const wrapper = document.createElement('up-wrapper')
    while ((childNode = element.firstChild)) {
      wrapper.appendChild(childNode)
    }
    element.appendChild(wrapper)
    return wrapper
  }

  function isWrapper(element) {
    return element.matches('up-wrapper')
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

  /*-
  Returns the given `attribute` value for the given `element`.

  If the element does not have the given attribute, it returns `undefined`.
  This is a difference to the native `Element#getAttribute()`, which [mostly returns `null` in that case](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute#Non-existing_attributes).

  If the element has the attribute but without value (e.g. `<input readonly>`), it returns an empty string.

  @function up.element.attr
  @stable
  */
  function stringAttr(element, attribute) {
    return u.nullToUndefined(element.getAttribute(attribute))
  }

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
  @return {boolean|undefined}
    The cast attribute value.
  @stable
  */
  function booleanAttr(element, attribute, pass) {
    if (!element.hasAttribute(attribute)) return

    const value = stringAttr(element, attribute)
    switch (value) {
      case 'false': {
        return false
      }
      case 'true':
      case '':
      case attribute: {
        return true
      }
      default: {
        if (pass) {
          return value
        } else {
          return true
        }
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
  @internal
  */
  function booleanOrStringAttr(element, attribute) {
    return booleanAttr(element, attribute, true)
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
    let value = element.getAttribute(attribute)
    if (value) {
      value = value.replace(/_/g, '')
      if (value.match(/^[\d.]+$/)) {
        return parseFloat(value)
      }
    }
  }

  /*-
  Reads the given attribute from the element, parsed as [JSON](https://www.json.org/).

  Returns `undefined` if the attribute value is [blank](/up.util.isBlank).

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
    // The document does not respond to #getAttribute()
    let json = element.getAttribute?.(attribute)?.trim()
    if (json) {
      return JSON.parse(json)
    }
  }

  function callbackAttr(link, attr, { exposedKeys = [], mainKey = 'event' } = {}) {
    let code = link.getAttribute(attr)
    if (code) {
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
  }

  function closestAttr(element, attr, parseFn = stringAttr) {
    let match = element.closest('[' + attr + ']')
    if (match) {
      return parseFn(match, attr)
    }
  }

  /*-
  Temporarily sets the inline CSS styles on the given element.

  Returns a function that restores the original inline styles when called.

  ### Example

      element = document.querySelector('div')
      unhide = up.element.setTemporaryStyle(element, { 'visibility': 'hidden' })
      // do things while element is invisible
      unhide()
      // element is visible again

  @function up.element.setTemporaryStyle
  @param {Element} element
    The element to style.
  @param {Object} styles
    An object of CSS property names and values.
  @return {Function()}
    A function that restores the original inline styles when called.
  @internal
  */
  function setTemporaryStyle(element, newStyles) {
    const oldStyles = inlineStyle(element, Object.keys(newStyles))
    setInlineStyle(element, newStyles)
    return () => setInlineStyle(element, oldStyles)
  }

  function addTemporaryClass(element, klass) {
    element.classList.add(klass)
    return () => element.classList.remove(klass)
  }

  function setTemporaryAttr(element, attr, value) {
    element.setAttribute(attr, value)
    return () => element.removeAttribute(element, attr)
  }

  /*-
  Receives [computed CSS styles](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle)
  for the given element.

  ### Examples

  When requesting a single CSS property, its value will be returned as a string:

      value = up.element.style(element, 'font-size')
      // value is '16px'

  When requesting multiple CSS properties, the function returns an object of property names and values:

      value = up.element.style(element, ['font-size', 'margin-top'])
      // value is { 'font-size': '16px', 'margin-top': '10px' }

  @function up.element.style
  @param {Element} element
  @param {String|Array} propOrProps
    One or more CSS property names in kebab-case or camelCase.
  @return {string|object}
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

  Returns `undefined` if the property value is missing, or if it cannot
  be parsed as a number.

  ### Examples

  When requesting a single CSS property, its value will be returned as a string:

      value = up.element.style(element, 'font-size')
      // value is '16px'

      value = up.element.styleNumber(element, 'font-size')
      // value is 16

  @function up.element.styleNumber
  @param {Element} element
  @param {string} prop
    A single property name in kebab-case or camelCase.
  @return {number|undefined}
  @stable
  */
  function computedStyleNumber(element, prop) {
    const rawValue = computedStyle(element, prop)
    if (u.isGiven(rawValue)) {
      return parseFloat(rawValue)
    }
  }

  /*-
  Gets the given inline style(s) from the given element's `[style]` attribute.

  @function up.element.inlineStyle
  @param {Element} element
  @param {String|Array} propOrProps
    One or more CSS property names in kebab-case or camelCase.
  @return {string|object}
  @internal
  */
  function inlineStyle(element, props) {
    const { style } = element
    return extractFromStyleObject(style, props)
  }

  function extractFromStyleObject(style, keyOrKeys) {
    if (u.isString(keyOrKeys)) {
      return style[keyOrKeys]
    } else { // array
      return u.pick(style, keyOrKeys)
    }
  }

  /*-
  Sets the given CSS properties as inline styles on the given element.

  @function up.element.setStyle
  @param {Element} element
  @param {Object} props
    One or more CSS properties with kebab-case keys or camelCase keys.
  @return {string|object}
  @stable
  */
  function setInlineStyle(element, props) {
    if (u.isString(props)) {
      element.setAttribute('style', props)
    } else {
      const { style } = element
      for (let key in props) {
        let value = props[key]
        value = normalizeStyleValueForWrite(key, value)
        style[key] = value
      }
    }
  }

  function normalizeStyleValueForWrite(key, value) {
    if (u.isMissing(value)) {
      value = ''
    } else if (CSS_LENGTH_PROPS.has(key.toLowerCase().replace(/-/, ''))) {
      value = cssLength(value)
    }
    return value
  }

  const CSS_LENGTH_PROPS = new Set([
    'top', 'right', 'bottom', 'left',
    'padding', 'paddingtop', 'paddingright', 'paddingbottom', 'paddingleft',
    'margin', 'margintop', 'marginright', 'marginbottom', 'marginleft',
    'borderwidth', 'bordertopwidth', 'borderrightwidth', 'borderbottomwidth', 'borderleftwidth',
    'width', 'height',
    'maxwidth', 'maxheight',
    'minwidth', 'minheight',
  ])

  /*-
  Converts the given value to a CSS length value, adding a `px` unit if required.

  @function cssLength
  @internal
  */
  function cssLength(obj) {
    if (u.isNumber(obj) || (u.isString(obj) && /^\d+$/.test(obj))) {
      return obj.toString() + "px"
    } else {
      return obj
    }
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

  function upAttrs(element) {
    const upAttributePattern = /^up-/
    const attrs = {}
    for (let attribute of element.attributes) {
      const { name } = attribute
      if (name.match(upAttributePattern)) {
        attrs[name] = attribute.value
      }
    }
    return attrs
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

  function filteredQuery(parent, includeSelectors, excludeSelectors) {
    let fullIncludeSelector = includeSelectors.join()
    let fullExcludeSelector = excludeSelectors.join()
    let elements = parent.querySelectorAll(fullIncludeSelector)
    let isExcluded = (element) => element.matches(fullExcludeSelector)
    return u.reject(elements, isExcluded)
  }

  return {
    subtree, // practical
    contains,
    closestAttr,
    ancestor, // not practical. we use it in up.feedback
    around,
    get: getOne, // practical for code that also works with jQuery
    list: getList, // practical for composing multiple collections, or wrapping.
    toggle, // practical
    hide, // practical
    show, // practical
    metaContent, // internal
    insertBefore, // internal shortcut, people can use insertAdjacentElement and i don't want to support insertAfter when I don't need it.
    createFromSelector, // practical for element creation.
    setAttrs, // practical
    setTemporaryAttrs,
    affix, // practical for element creation
    idSelector,
    classSelector,
    isSingleton, // internal
    attrSelector, // internal
    tagName: elementTagName,
    createBrokenDocumentFromHTML, // internal
    fixScriptish,
    createFromHTML, // practical for element creation
    get root() { return getRoot() }, // internal
    paint, // internal
    concludeCSSTransition, // internal
    hasCSSTransition, // internal
    fixedToAbsolute, // internal
    setMissingAttrs, // internal
    setMissingAttr, // internal
    unwrap, // practical for jQuery migration
    wrapChildren,
    isWrapper,
    // presentAttr: presentAttr # experimental
    attr: stringAttr,
    booleanAttr, // it's practical, but i cannot find a good name. people might expect it to cast to number, too. but i don't need that for my own code. maybe booleanAttr?
    numberAttr, // practical
    jsonAttr, // practical
    callbackAttr,
    booleanOrStringAttr,
    setTemporaryStyle, // practical
    style: computedStyle, // practical.
    styleNumber: computedStyleNumber, // practical.
    inlineStyle, // internal
    setStyle: setInlineStyle, // practical.
    isVisible, // practical
    upAttrs,
    toggleAttr,
    addTemporaryClass,
    setTemporaryAttr,
    cleanJQuery,
    parseSelector,
    filteredQuery,
  }
})()
