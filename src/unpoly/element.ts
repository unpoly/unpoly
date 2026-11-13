import './element.sass'
import * as u from './util.js'
import { CannotParse, fail } from './error.js'
import { mockable } from './mockable.js'
import type * as t from './element/types.js'
export type * from './element/types.js'

function first(...args: any[]): HTMLElement | null {
  let [root = document, selector] = u.parseArgs(args, 'val', 'val')
  return root.querySelector(selector)
}

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

export function elementLikeMatches(elementLike: any, selector: string): boolean {
  return u.isElement(elementLike) && elementLike.matches(selector)
}

export function containsElement(root: Node, selectorOrElement: t.ElementOrSelector): boolean {
  const element = getOne(selectorOrElement)
  // We cannot use `root.contains(element)` as <form> elements with an input named "contains"
  // would define `root.contains` to return that input (GH#507).
  return Node.prototype.contains.call(root, element)
}

export function ancestor(element: Element, selector: string): HTMLElement | null | undefined {
  return element.parentElement?.closest<HTMLElement>(selector)
}

export function around(element: Element, selector: string): HTMLElement[] {
  // Only the closest match around the element, not all ancestors. This is intentional for viewports:
  // outer viewports show other content (a page around a scrolling sidebar, the page behind an overlay),
  // and scrolling them when a fragment updates would be an unexpected side effect.
  return getList(element.closest(selector), subtree(element, selector))
}

export function getOne(element: Element): HTMLElement
// A selector that matches nothing returns null. An empty list returns undefined.
export function getOne(selectorOrElement: t.ElementOrSelector): HTMLElement | null | undefined
export function getOne(root: ParentNode, selector: string): HTMLElement | null
// Other values (undefined, null, false, Window, Document, DocumentFragment, ...) are returned unchanged.
// Distributes over a union, so `Element | false` becomes `HTMLElement | false`.
export function getOne<T>(value: T): T extends Element ? HTMLElement : T extends t.ElementOrSelector ? HTMLElement | null | undefined : T
export function getOne(...args: unknown[]): unknown {
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

export function hide(element: HTMLElement): void {
  setVisible(element, false)
}

export function show(element: HTMLElement): void {
  setVisible(element, true)
}

export function showTemp(element: HTMLElement): t.UndoFunction {
  return setVisibleTemp(element, true)
}

export function hideTemp(element: HTMLElement): t.UndoFunction {
  return setVisibleTemp(element, false)
}

function setVisibleTemp(element: HTMLElement, newVisible: boolean): t.UndoFunction {
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

export function setAttrsTemp(element: Element, attrs: u.PlainObject): t.UndoFunction {
  let keys = Object.keys(attrs)
  let oldAttrs = pickAttrs(element, keys)
  setAttrs(element, attrs)
  return () => setAttrs(element, oldAttrs)
}

export function metaContent(name: string): string | undefined {
  const selector = "meta" + attrSelector('name', name)
  return document.head.querySelector<HTMLMetaElement>(selector)?.content
}

export function insertBefore(existingNode: Node, newNode: Node): void {
  // We're not using insertAdjacentElement() because that does not work with Text nodes
  existingNode.parentNode!.insertBefore(newNode, existingNode)
}

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

function makeVariation(element: Element, { id, classNames, attributes }: t.SelectorSegment): void {
  if (id) {
    element.id = id
  }

  for (let [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value)
  }

  addClasses(element, classNames)
}

export function parseSelector(rawSelector: string): t.ParsedSelector {
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
    let parsed: t.SelectorSegment = {
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
      // We don't support all attribute selector syntax, like whitespace around the operator
      // ([foo = "bar"]) or a case-sensitivity flag ([foo="bar" i]). Such a selector either
      // doesn't match our regexp, or yields a value that we cannot parse as a string.
      try {
        // When the regexp doesn't match, destructuring null throws, and we catch it below.
        let [_raw, name, _operator, quote, value] = attr.match(/\[([\w-]+)(?:([~|^$*]?=)(["'])?(.*?)\3)?]/s)!
        quote ||= '"'
        parsed.attributes[name] = value ? u.parseString(quote + value + quote) : ''
      } catch {
        throw new CannotParse('Unsupported attribute selector: ' + attr)
      }
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

export function affix(parent: Element, selector: string, attrs?: u.PlainObject): HTMLElement
export function affix(parent: Element, position: InsertPosition, selector: string, attrs?: u.PlainObject): HTMLElement
export function affix(...args: any[]): HTMLElement {
  let [parent, position = 'beforeend', selector, attributes] = u.parseArgs(args, 'val', u.isAdjacentPosition, 'val', 'options')
  const element = createFromSelector(selector, attributes)
  parent.insertAdjacentElement(position, element)
  return element
}

// Not covered by specs: rendering into <html> or <body> would replace the Jasmine runner.
const SINGLETON_TAG_NAMES = ['HTML', 'BODY', 'HEAD', 'TITLE']

export const isSingleton = mockable((element: Element): boolean => element.matches(SINGLETON_TAG_NAMES.join()))

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

export function classSelector(klass: string): string {
  klass = klass.replace(/[^\w-]/g, '\\$&')
  return `.${klass}`
}

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

export function revivedClone(element: Element): HTMLElement {
  // We cannot use `scriptish.cloneNode(true)` as this does not fix broken <noscript> elements
  let clone = createFromHTML(element.outerHTML)
  // When a CSP is set, the browser masks the nonce from .getAttribute() and .outerHTML
  if ('nonce' in element) clone.nonce = (element as HTMLElement).nonce
  return clone
}

export function createFromHTML(html: string): HTMLElement {
  return extractSingular(createNodesFromHTML(html))
}

export function extractSingular(nodes: u.List<Node>): HTMLElement {
  return tryExtractSingular(nodes) || fail('Expected a single element, but got %d nodes', nodes.length)
}

function tryExtractSingular(nodes: u.List<Node>): HTMLElement | undefined {
  if (nodes.length === 1 && u.isElementLike(nodes[0])) {
    return nodes[0] as HTMLElement
  }
}

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

export function getRoot(): HTMLElement {
  return document.documentElement
}

export function paint(element: HTMLElement): void {
  element.offsetHeight
}

export function fixedToAbsolute(element: HTMLElement): void {
  // A hidden element (e.g. with `display: none`) has no position to preserve.
  // It would also not gain an offsetParent below.
  if (!isVisible(element)) return

  const elementRectAsFixed = element.getBoundingClientRect()

  // Set the position to 'absolute' so it gains an offsetParent
  element.style.position = 'absolute'

  // A visible element with `position: absolute` has an offsetParent.
  const offsetParentRect = element.offsetParent!.getBoundingClientRect()

  // A computed margin is never blank.
  setInlineStyle(element, {
    left: (elementRectAsFixed.left - computedStyleNumber(element, 'margin-left')! - offsetParentRect.left) + 'px',
    top: (elementRectAsFixed.top - computedStyleNumber(element, 'margin-top')! - offsetParentRect.top) + 'px',
    right: '',
    bottom: ''
  })
}

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
    return nodes[0]
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

export function parseAttr(element: Element, attribute: string, ...parsers: t.AttrParser[]): any {
  // The document does not respond to #hasAttribute()
  if (!element.hasAttribute?.(attribute)) return undefined
  let rawValue = element.getAttribute(attribute)!

  for (let parser of parsers) {
    let parserResult = parser(rawValue, attribute, element)
    if (u.isDefined(parserResult)) return parserResult
  }
}

export function stringAttr(element: Element, attribute: string): string | undefined {
  return parseAttr(element, attribute, tryParseString)
}

let tryParseString: t.AttrParser = u.identity

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

export function booleanOrStringAttr(element: Element, attribute: string): boolean | string | undefined {
  return parseAttr(element, attribute, tryParseBoolean, tryParseString)
}

export function booleanOrNumberAttr(element: Element, attribute: string): boolean | number | undefined {
  return parseAttr(element, attribute, tryParseBoolean, tryParseNumber)
}

export function booleanOrNumberOrStringAttr(element: Element, attribute: string): boolean | number | string | undefined {
  return parseAttr(element, attribute, tryParseBoolean, tryParseNumber, tryParseString)
}

export function numberAttr(element: Element, attribute: string): number | undefined {
  return parseAttr(element, attribute, tryParseNumber)
}

function tryParseNumber(value: string): number | undefined {
  // Call without second argument
  return u.parseNumber(value)
}

export function jsonAttr(element: Element, attribute: string): any {
  return parseAttr(element, attribute, tryParseJSON)
}

function tryParseJSON(value: string): any {
  if (value?.trim()) {
    return u.parseRelaxedJSON(value)
  }
}

export function closestAttr(element: Element, attr: string, readAttrFn: t.AttrReader = stringAttr): any {
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

export function addClassTemp(element: Element, klass: string): t.UndoFunction {
  return setClassStateTemp(element, klass, true)
}

export function removeClassTemp(element: Element, klass: string): t.UndoFunction {
  return setClassStateTemp(element, klass, false)
}

function setClassStateTemp(element: Element, klass: string, targetState: boolean): t.UndoFunction {
  if (element.classList.contains(klass) === targetState) return u.noop
  element.classList.toggle(klass, targetState)
  return () => element.classList.toggle(klass, !targetState)
}

export function computedStyle(element: Element, prop: string): string
export function computedStyle(element: Element, props: string[]): Record<string, string>
export function computedStyle(element: Element, props: string | string[]): string | Record<string, string> {
  const style = window.getComputedStyle(element)
  return extractFromStyleObject(style, props)
}

export function computedStyleNumber(element: Element, prop: string): number | undefined {
  const rawValue = computedStyle(element, prop)
  if (u.isPresent(rawValue)) {
    return parseFloat(rawValue)
  }
}

export function inlineStyle(element: HTMLElement, prop: string): string
export function inlineStyle(element: HTMLElement, props: string[]): Record<string, string>
export function inlineStyle(element: HTMLElement, props: string | string[]): string | Record<string, string> {
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

export function setInlineStyle(element: HTMLElement, props: string | t.StyleProps, unit = ''): void {
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

export function setStyleTemp(element: HTMLElement, newStyles: t.StyleProps): t.UndoFunction {
  const oldStyles = inlineStyle(element, Object.keys(newStyles))
  setInlineStyle(element, newStyles)
  return () => setInlineStyle(element, oldStyles)
}

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

export function isEmpty(element: HTMLElement): boolean {
  return !element.children.length && !element.innerText.trim()
}

export function crossOriginSelector(attr: string): string {
  return `[${attr}*="//"]:not([${attr}*="//${location.host}/"])`
}

export function isIntersectingWindow(element: Element, { margin = 0 }: { margin?: number } = {}): boolean {
  const rect = u.Rect.fromElement(element)
  rect.grow(margin)

  return (rect.bottom > 0) && (rect.top  < window.innerHeight) &&
    (rect.right  > 0) && (rect.left < window.innerWidth)
}

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
const awaitedTagNames = new Set<string>()

export function trackDefinitions(root: ParentNode): void {
  for (let { localName } of subtree(root, ':not(:defined)')) {
    if (!awaitedTagNames.has(localName)) {
      awaitedTagNames.add(localName)
      customElements.whenDefined(localName).then(() => up.emit('up:element:defined', { localName, log: false }))
    }
  }
}

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
