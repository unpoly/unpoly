import './fragment.sass'
import * as u from './util.js'
import * as e from './element.js'
import { newConfig } from './util/config.js'
import { CannotParse, CannotTarget, fail } from './error.js'
import { emit, on, onClosest, type UnbindFn } from './event.js'
import { canPushState, isHistoryEnabled } from './history.js'
import { Layer, layerConfig, layerStack, mainTargets, type LayerMode } from './layer.js'
import { printToStandard, printToWarn } from './log.js'
import { mockable } from './mockable.js'
import { abortRequests, type UpRequest, type UpResponse } from './network.js'
import {
  callbackAttr, hello, isScript, readData, registerDestructor, registerMacro, scriptConfig,
} from './script.js'
import type * as t from './fragment/types.js'
export type * from './fragment/types.js'
import { FragmentFinder } from './fragment/fragment_finder.js'
import { destroyFragment } from './fragment/render/change/destroy_fragment.js'
import { RenderJob } from './fragment/render/render_job.js'
export { RenderJob }
export {
  chainCallbacks, deriveFailOptions, NO_INPUT_INTERFERENCE, NO_PREVIEWS, parseRenderCallback,
  preprocessRenderOptions, renderCallbackAttr,
} from './fragment/render/render_options.js'
import { type RenderResult } from './fragment/render/render_result.js'
export { type RenderResult }
export { ResponseDoc } from './fragment/render/response_doc.js'
import { Selector } from './fragment/selector.js'
import { SelectorTracker } from './fragment/selector_tracker.js'
export { SelectorTracker }

// Properties Unpoly sets on fragments.
interface FragmentElement extends Element {
  // An opaque value that u.isEqual() compares, see buildKeepIdentity().
  upKeepIdentity?: unknown
  upInserted?: boolean
}

function upTagName(element: Element): string | undefined {
  let tagName = element.localName
  if (tagName.startsWith('up-')) {
    return tagName
  }
}

const STRONG_TARGET_DERIVERS = [
  '[up-id]',
  '[id]',
  'html',
  'head',
  'body',
]

export const fragmentConfig = newConfig('up.fragment.config', (): t.FragmentConfig => ({
  // Users who are not using layers will prefer settings default targets
  // as up.fragment.config.mainTargets instead of up.layer.config.any.mainTargets.
  // A reset copies this accessor (see Config#reset()), so it leaves up.layer.config.any.mainTargets alone.
  get mainTargets() { return layerConfig.any.mainTargets },
  set mainTargets(value) { layerConfig.any.mainTargets = value },

  badTargetClasses: [/^up-/],

  strongTargetDerivers: STRONG_TARGET_DERIVERS,

  targetDerivers: [
    ...STRONG_TARGET_DERIVERS,
    'main',
    '[up-main]',
    upTagName,
    'link[rel][type]',
    'link[rel=preload][href]',
    'link[rel=preconnect][href]',
    'link[rel=prefetch][href]',
    'link[rel]',
    'meta[property]',
    '*[name]',
    'form[action]',
    'a[href]',
    '[class]',
    '[up-flashes]',
    'form',
  ],

  verifyDerivedTarget: true,

  renderOptions: {
    hungry: true,
    keep: true,
    saveScroll: true,
    saveFocus: true,
    focusVisible: 'auto',
    abort: 'target',
    failOptions: true,
    feedback: true,
  },

  // These defaults will be set to both success and fail options
  // if { navigate: true } is given.
  navigateOptions: {
    cache: 'auto',
    revalidate: 'auto',
    fallback: true,
    focus: 'auto',
    scroll: 'auto',
    history: 'auto',
    peel: 'dismiss',
  },

  reloadOptions: {
    target: ':main',
    scroll: 'keep',
    focus: 'keep',
  },

  match: 'region',
  autoHistoryTargets: [':main'],
  autoFocus: ['hash', 'autofocus', 'main-if-main', 'keep', 'target-if-lost'],
  autoScroll: ['hash', 'layer-if-main'],
  autoRevalidate: (response) => response.expired,
  skipResponse: defaultSkipResponse,
  renderableResponse: (response) => response.isHTML(),
  normalizeKeepHTML: defaultNormalizeKeepHTML
}))


function defaultSkipResponse({ response, expiredResponse }: u.PlainObject): boolean {
  return !response.text || response.text === expiredResponse?.text
}

export function sourceOf(element: e.ElementOrSelector, options: t.LookupOptions = {}): string | undefined {
  element = getSmart(element, options)!
  return e.closestAttr(element, 'up-source')
}

export function normalizeSource(source: string): string {
  // Don't use u.matchableURL() here. We need to keep the trailing slash here,
  // to support backends that care about trailing slashes.
  return u.normalizeURL(source, { hash: false })
}

export function timeOf(element: Element): Date | undefined {
  let value = e.closestAttr(element, 'up-time')
  if (value && value !== 'false') {
    // We support both Unix timestamps (e.g. "1445412480")
    // and RFC 1123 times (e.g. "Wed, 21 Oct 2015 07:28:00 GMT").
    if (/^\d+$/.test(value)) {
     value = Number(value) * 1000
    }
    return new Date(value)
  }
}

export function etagOf(element: Element): string | undefined {
  let value = e.closestAttr(element, 'up-etag')
  if (value && value !== 'false') {
    return value
  }
}

// The values that setReloadAttrs() sets as [up-source], [up-time] and [up-etag].
interface ReloadAttrsOptions {
  oldElement?: Element
  newElement: Element
  source?: string | false
  time?: Date | false
  etag?: string | false | null
}

// Remembers where a new fragment came from, so up.reload() can fetch it again.
export function setReloadAttrs(options: ReloadAttrsOptions): void {
  setSource(options)
  setTime(options)
  setETag(options)
}

function setSource({ oldElement, newElement, source }: ReloadAttrsOptions): void {
  // (1) When the server responds with an error, or when the request method is not
  //     reloadable (not GET), we keep the same source as before.
  // (2) Don't set a source if someone tries to 'keep' when opening a new layer
  if (source === 'keep') {
    source = (oldElement && sourceOf(oldElement))
  }

  // (1) Don't set a source if { false } is passed.
  // (2) Don't set a source if the element HTML already has an [up-source] attribute.
  // (3) Don't use u.matchableURL() here. We need to keep a trailing slash
  //     to support backends that care about trailing slashes.
  if (source) {
    e.setMissingAttr(newElement, 'up-source', normalizeSource(source))
  }
}

function setTime({ newElement, time }: ReloadAttrsOptions): void {
  // If the server didn't send a Last-Modified header, tag the element
  // with [up-time=false] to indicate that we cannot use an ancestor's [up-time].
  e.setMissingAttr(newElement, 'up-time', time ? time.toUTCString() : false)
}

function setETag({ newElement, etag }: ReloadAttrsOptions): void {
  // If the server didn't send an Etag header, tag the element
  // with [up-etag=false] to indicate that we cannot use an ancestor's [up-etag].
  e.setMissingAttr(newElement, 'up-etag', etag || false)
}

export const render = mockable((...args: t.RenderArgs): RenderJob => {
  let options = parseTargetAndOptions(args)
  return new RenderJob(options).execute()
})

export const navigate = mockable((...args: t.RenderArgs): RenderJob => {
  const options = parseTargetAndOptions(args)
  return render({ ...options, navigate: true })
})

export function emitFragmentKeep({ oldElement, newElement: newFragment, newData, renderOptions }: t.KeepPlan): t.FragmentKeepEvent {
  const log = ['Keeping fragment %o', oldElement]
  const callback = callbackAttr(oldElement, 'up-on-keep', { expandObject: ['newFragment', 'newData'] })
  return emit(oldElement, 'up:fragment:keep', { log, callback, newFragment, newData, renderOptions })
}

export function emitFragmentKept({ oldElement, newElement: newFragment, newData }: t.KeepPlan): t.FragmentKeptEvent {
  return emit(oldElement, 'up:fragment:kept', { log: false, newFragment, newData })
}

export function findKeepPlan(options: u.PlainObject): t.KeepPlan | undefined {
  if (options.keep === false) return

  const { oldElement, newElement } = options

  let oldElementMode = keepMode(oldElement)
  // Early return if no [up-keep] attr or if [up-keep=false]
  if (!oldElementMode) { return }

  let partner
  let partnerSelector = tryToTarget(oldElement)
  if (!partnerSelector) {
    printToWarn('[up-keep]', 'Cannot keep untargetable %o', oldElement)
    return
  }

  const lookupOpts = { layer: options.layer }

  if (options.descendantsOnly) {
    // Since newElement is from a freshly parsed HTML document, we could use
    // up.element functions to match the selector. However, since we also want
    // to use custom selectors like ":main" or "&" we use up.fragment.get().
    partner = getSmart(newElement, partnerSelector, lookupOpts)
  } else {
    partner = e.subtreeFirst(newElement, partnerSelector)
  }

  // (1) The partner must be matched
  // (2) The partner does not need to be [up-keep]
  if (!partner) return

  let partnerMode = keepMode(partner)

  // (1) The partner must not be [up-keep=false], regardless of oldElement's state.
  // (2) We already tested old element for [up-keep=false] at the beginning of findKeepPlan().
  if (partnerMode === false) return

  let oldIdentity = keepIdentity(oldElement, oldElementMode)
  let partnerIdentity = keepIdentity(partner, oldElementMode)

  if (!u.isEqual(oldIdentity, partnerIdentity)) return

  const plan = {
    oldElement, // the element that should be kept
    newElement: partner, // the element that would have replaced it but now does not
    newData: readData(partner), // the parsed up-data attribute of the element we will discard
    renderOptions: options,
  }

  // Preventing up:fragment:keep will force a replacement
  if (emitFragmentKeep(plan).defaultPrevented) return

  // If we came this far, we can keep oldElement.
  return plan
}

function keepIdentity(element: FragmentElement, mode = keepMode(element)): unknown {
  return element.upKeepIdentity ??= u.copy(buildKeepIdentity(element, mode))
}

export function defaultNormalizeKeepHTML(html: string): string {
  // Remove attributes that might fluctuate beteen responses, but don't normally contribute to element identity.
  html = e.removeAttrsFromHTML(html, ['up-etag', 'up-source', 'up-time', 'nonce', ...scriptConfig.nonceableAttributes])
  // Remove leading spaces.
  html = html.replace(/^[ \t]+/mg, '')
  return html
}

function buildKeepIdentity(element: Element, mode?: string | boolean): unknown {
  if (mode === 'same-html') {
    return fragmentConfig.normalizeKeepHTML(element.outerHTML)
  } else if (mode === 'same-data') {
    return readData(element)
  } else {
    return true
  }
}


function keepMode(element: Element): string | boolean | undefined {
  return e.booleanOrStringAttr(element, 'up-keep')
}


export function emitFragmentInserted(element: FragmentElement, meta: u.PlainObject): t.FragmentInsertedEvent | undefined {
  if (element.upInserted) return
  element.upInserted = true

  const log = ['Inserted fragment %o', element]

  // TODO: Is it important to wrap the entire compilation in mutate()? In case a programmatic cal to up.hello calls a compiler runs up.hello()?

  return mutate(() => emit(element, 'up:fragment:inserted', { ...meta, log }))
}


export function emitFragmentDestroyed(fragment: Element, options: u.PlainObject): t.FragmentDestroyedEvent {
  const log = options.log ?? ['Destroyed fragment %o', fragment]
  const parent = options.parent || document
  return mutate(() => emit(parent, 'up:fragment:destroyed', { fragment, parent, log }))
}

export function isNotDestroying(element: Element): boolean {
  return !element.closest('.up-destroying')
}

export function isAlive(fragment: Element): boolean {
  return fragment.isConnected && isNotDestroying(fragment)
}

// Takes a selector or element, optionally preceded by a root element, and followed by options.
export function getSmart(selector: e.ElementOrSelector, options?: t.LookupOptions): HTMLElement | undefined
export function getSmart(root: ParentNode, selector: e.ElementOrSelector, options?: t.LookupOptions): HTMLElement | undefined
export function getSmart(...args: any[]): any {
  let [root, selector, options] = parseGetArgs(args)

  if (u.isElementLike(selector)) {
    // (1) up.fragment.get(root: Element, element: Element, [options]) should just return element.
    //     The given root and options are ignored. We also don't check if it's destroying.
    // (2) We do use e.get() to unwrap a jQuery collection.
    return e.getOne(selector)
  }

  if (root) {
    // We don't match around { origin } if we're given a root for the search.
    return getFirstDescendant(root, selector, options)
  }

  // (1) If we don't have a root element we will use a context-sensitive lookup strategy
  //     that tries to match elements in the region of { origin } before going through
  //     the entire layer.
  // (2) We must not pass a { document } option to up.FragmentFinder.
  return new FragmentFinder({
    selector,
    ...u.pick(options, ['layer', 'match', 'origin', 'destroying']),
  }).find()
}

export function getFirstDescendant(selector: string, options?: t.LookupOptions): HTMLElement | undefined
export function getFirstDescendant(root: ParentNode, selector: string, options?: t.LookupOptions): HTMLElement | undefined
export function getFirstDescendant(...args: any[]): any {
  let [root, selectorString, options] = parseGetArgs(args)

  let selector = new Selector(selectorString, root, options)
  return selector.firstDescendant(root)
}

function parseGetArgs(args: any[]): any[] {
  return u.parseArgs(args, 'val', 'val', 'options')
}

// Takes a selector, optionally preceded by a root element, and followed by options.
// A selector string gives an array. An element or list is returned as a list.
export function getAllFragments(selector: string, options?: t.LookupOptions): HTMLElement[]
export function getAllFragments(root: ParentNode, selector: string, options?: t.LookupOptions): HTMLElement[]
export function getAllFragments(selector: e.ElementOrSelector, options?: t.LookupOptions): u.List<HTMLElement>
export function getAllFragments(root: ParentNode, selector: e.ElementOrSelector, options?: t.LookupOptions): u.List<HTMLElement>
export function getAllFragments(...args: any[]): any {
  let [root, selectorString, options] = parseGetArgs(args)

  // (0) up.fragment.all(element) or up.fragment.all(element, element) should return an array of that element.
  if (u.isElement(selectorString)) {
    return [selectorString]
  }

  // (1) up.fragment.all(list) or up.fragment.all(element, list) should return the list unchanged
  if (u.isList(selectorString)) {
    return selectorString
  }

  // (2) up.fragment.all(rootElement, selector) should find selector within
  //     the descendants of rootElement.
  // (3) up.fragment.all(selector) should find selector within the current layer.
  // (4) up.fragment.all(selector, { layer }) should find selector within the given layer(s).
  let selector = new Selector(selectorString, root, options)
  return selector.descendants(root)
}

export function getSubtree(element: Element, selector: string, options: t.LookupOptions = {}): HTMLElement[] {
  return new Selector(selector, element, options).subtree(element)
}

// Takes a selector or an element. viewport's focusedElementWithin() also passes null, which matches nothing.
export function contains(root: Element, selectorOrElement: any): boolean {
  if (u.isElement(selectorOrElement)) {
    // The root may be in no layer, e.g. while a closed overlay plays its closing animation.
    // Returns undefined when the root is in no layer.
    return (e.containsElement(root, selectorOrElement) && layerStack.get(root)?.contains(selectorOrElement)) as boolean
  } else {
    return getSubtree(root, selectorOrElement).length > 0
  }
}

export function closest(element: Element, selector: string, options?: t.LookupOptions): HTMLElement | undefined {
  return new Selector(selector, element, options).closest(element)
}

export function destroy(...args: any[]): Promise<void> | undefined {
  const options = parseTargetAndOptions(args)
  const element = getSmart(options.target, options)

  if (element) {
    destroyFragment(element, options)
  }

  return up.migrate.formerlyAsync?.('up.destroy()')
}

function parseTargetAndOptions(args: any[]): u.PlainObject {
  const options = u.parseArgIntoOptions(args, 'target')
  if (u.isElement(options.target)) {
    options.origin ||= options.target
  }
  return options
}

export function markFragmentAsDestroying(element: Element): void {
  element.classList.add('up-destroying')
  element.setAttribute('inert', '')
}

export const reload = mockable(function reload(...args: t.RenderArgs | []): RenderJob {
  const options = { ...fragmentConfig.reloadOptions, ...parseTargetAndOptions(args) }
  options.target ||= ':main'
  // up.reload() takes one element or selector, not a list of target selectors.
  // A target that matches nothing throws a TypeError below.
  const element = getSmart(options.target as e.ElementOrSelector, options)!
  options.url ||= sourceOf(element)
  options.headers = u.merge(options.headers, conditionalHeaders(element))
  if (options.keepData || e.booleanAttr(element, 'up-keep-data')) {
    options.data = readData(element)
  }
  up.migrate.postprocessReloadOptions?.(options)
  return render(options)
})

function conditionalHeaders(element: Element): Record<string, string> {
  let headers: Record<string, string> = {}
  let time = timeOf(element)
  if (time) {
    headers['If-Modified-Since'] = time.toUTCString()
  }
  let etag = etagOf(element)
  if (etag) {
    headers['If-None-Match'] = etag
  }
  return headers
}

export function visit(url: string, options?: t.RenderOptions): RenderJob {
  return navigate({ ...options, url })
}

const KEY_PATTERN = /^(onFail|on|fail)?(.+)$/

export function toSuccessKey(key: string): string | undefined {
  let match = KEY_PATTERN.exec(key)
  if (match) {
    let [_, prefix, suffix] = match

    switch (prefix) {
      case 'onFail':
        return 'on' + u.upperCaseFirst(suffix)
      case 'fail':
        return u.lowerCaseFirst(suffix)
    }
  }
}

export function toFailKey(key: string): string | undefined {
  let match = KEY_PATTERN.exec(key)
  if (match) {
    let [_, prefix, suffix] = match

    switch (prefix) {
      case 'on':
        return 'onFail' + u.upperCaseFirst(suffix)
      case undefined:
        return 'fail' + u.upperCaseFirst(suffix)
    }
  }
}

export function toTarget(element: Element | string, options?: t.LookupOptions): string {
  if (u.isString(element)) {
    return element || cannotTarget('Cannot target an empty selector')
  }

  return tryToTarget(element, options) || cannotTarget(untargetableMessage(element))
}

export function isTargetable(element: Element, options?: t.LookupOptions): boolean {
  return !!tryToTarget(element, options)
}

function untargetableMessage(element: Element): string {
  return `Cannot derive good target selector from a <${element.localName}> element without identifying attributes. Try setting an [id] or configure up.fragment.config.targetDerivers.`
}

function cannotTarget(message: string): never {
  throw new CannotTarget(message)
}

export function tryToTarget(element: Element, options: t.LookupOptions = {}): string | undefined {
  let derivers = options.strong ? fragmentConfig.strongTargetDerivers : fragmentConfig.targetDerivers

  return u.findResult(derivers, function(deriver) {
    let target = deriveTarget(element, deriver)

    if (target && isGoodTarget(target, element, options)) {
      return target
    }
  })
}

function deriveTarget(element: Element, deriver: t.TargetDeriver): string | undefined {
  if (u.isFunction(deriver)) {
    return deriver(element)
  } else if (element.matches(deriver)) {
    try {
      // Now that we know that a deriver is applicable to our element, we're using
      // the element's tag name and attribute to form a more specific target.
      // E.g. a deriver '[up-id]' should result in a target '[up-id="messages"]'.
      return deriveTargetFromPattern(element, deriver)
    } catch (error) {
      if (error instanceof CannotParse) {
        // This error can be thrown for two reasons:
        // (1) up.element.parseSelector() cannot parse the given string
        // (2) up.element.parseSelector() parses a selector with a depth > 1.
        return deriver
      } else {
        throw error
      }
    }
  }
}

function deriveTargetFromPattern(element: Element, deriver: string): string | undefined {
  // Now that we know that a deriver is applicable to our element, we're using
  // the element's tag name and attribute to form a more specific target.
  // E.g. a deriver '[up-id]' should result in a target '[up-id="messages"]'.

  let { includePath, excludeRaw } = e.parseSelector(deriver)

  if (includePath.length !== 1) {
    // It's not straightforward to improve a descendant selector like '.foo .bar' or '.foo > .bar'.
    // It's also not common to see such selectors configured in config.targetDerivers.
    // Hence we just return the matching deriver.
    throw new CannotParse(deriver)
  }

  let { tagName, id, classNames, attributes } = includePath[0]
  let result = ''

  if (tagName === '*') {
    // In a deriver '*' means to include the actual tag name in the target-
    // Use the local name, which keeps the case of camelCase SVG elements like <clipPath>.
    // Type selectors match those case-sensitively, so tagName.toLowerCase() would not match.
    result += element.localName
  } else if (tagName) {
    // If a deriver contains an actual tag name like 'main' it becomes
    // part of the target selector.
    result += tagName
  }

  for (let className of classNames) {
    result += e.classSelector(className)
  }

  if (id) {
    result += e.idSelector(id)
  }

  for (let attributeName in attributes) {
    // If a deriver contains an attribute value (e.g. '[rel=canonical]') we use that for the target.
    // If the deriver has a value-less attribute (e.g. '[rel]') we use the actual attribute value from the element.
    // The element matches the deriver, so it has the attribute.
    let attributeValue = attributes[attributeName] || element.getAttribute(attributeName)!

    if (attributeName === 'id') {
      // We allow a deriver '[id]' to apply to all elements with an ID.
      // However, we want to use an ID selector ('#foo') instead of an attribute selector ('[id=foo]').
      result += e.idSelector(attributeValue)
    } else if (attributeName === 'class') {
      // We allow a deriver '[class]' to apply to all elements with a class.
      // However, we want to (1) filter class against config.badTargetClasses and
      // (2) use an class selector ('.foo') instead of an attribute selector ('[class=foo]').
      for (let goodClass of goodClassesForTarget(element)) {
        result += e.classSelector(goodClass)
      }
    } else {
      result += e.attrSelector(attributeName, attributeValue)
    }
  }

  if (excludeRaw) {
    result += excludeRaw
  }

  return result
}

function isGoodTarget(target: string, element: Element, options: t.LookupOptions = {}): boolean {
  let verify = options.verify ?? fragmentConfig.verifyDerivedTarget
  return !isAlive(element) || !verify || getSmart(target, { layer: element, ...options }) === element
}

function matchesPattern(pattern: string | RegExp, str: string): boolean {
  if (u.isRegExp(pattern)) {
    return pattern.test(str)
  } else {
    return pattern === str
  }
}

function goodClassesForTarget(element: Element): string[] {
  let isGood = (klass: string) => !u.some(fragmentConfig.badTargetClasses, (badTargetClass) => matchesPattern(badTargetClass, klass))
  return u.filterList(element.classList, isGood)
}

const MAIN_PSEUDO = /:main\b/
const LAYER_PSEUDO = /:layer\b/
const ORIGIN_PSEUDO = /:origin\b/

export function containsMainPseudo(target: string): boolean {
  return MAIN_PSEUDO.test(target)
}

export function expandTargets(targets: any, options: t.LookupOptions = {}): string[] {
  const { layer } = options
  if (layer !== 'new' && !(layer instanceof Layer)) {
    fail('Must pass an up.Layer as { layer } option, but got %o', layer)
  }

  // Copy the list since targets might be a jQuery collection, and this does not support shift or push.
  targets = u.copy(u.wrapList(targets))

  const expanded: string[] = []

  while (targets.length) {
    let target = targets.shift()
    if (target === true) target = ':main'

    if (containsMainPseudo(target)) {
      let mode = resolveMode(options)
      let replaced = mainTargets(mode).map((mainTarget) => target.replace(MAIN_PSEUDO, mainTarget))
      targets.unshift(...replaced)
    } else if (LAYER_PSEUDO.test(target)) {
      // Discard this target for new layers, which don't have a first-swappable-element.
      // Also don't && the layer check into the `else if` condition above, or it will
      // be returned as a verbatim string below.
      if (layer === 'new' || layer.state === 'opening') continue
      let firstSwappableTarget = toTarget(layer.getFirstSwappableElement(), options)
      targets.unshift(target.replace(LAYER_PSEUDO, firstSwappableTarget))
    } else if (u.isElementLike(target)) {
      expanded.push(toTarget(target, options))
    } else if (u.isString(target)) {
      expanded.push(resolveOrigin(target, options))
    }
  }

  return u.uniq(expanded)
}

function resolveMode({ layer, mode }: u.PlainObject): LayerMode {
  if (layer === 'new') {
    return mode || fail('Must pass a { mode } option together with { layer: "new" }')
  } else {
    return layer.mode
  }
}

function modernResolveOrigin(target: string, { origin }: t.LookupOptions = {}): string {
  return target.replace(ORIGIN_PSEUDO, function(match) {
    if (origin) {
      return toTarget(origin)
    } else {
      fail('Missing { origin } element to resolve "%s" reference (found in %s)', match, target)
    }
  })
}

export function resolveOrigin(target: any, options?: t.LookupOptions): any {
  // up.FormValidator sometimes calls resolveOrigin(undefined)
  if (!u.isString(target)) return target
  return (up.migrate.resolveOrigin || modernResolveOrigin)(target, options)
}

export function splitTarget(target?: string): string[] {
  return u.getComplexTokens(target)
}

export function parseTargetSteps(target?: string, options: u.PlainObject = {}): t.RenderStep[] {
  let defaultPlacement = options.defaultPlacement || 'swap'
  let defaultMaybe = options.defaultMaybe ?? false

  let steps: t.RenderStep[] = []
  let simpleSelectors = splitTarget(target)

  for (let selector of simpleSelectors) {
    if (selector === ':none') continue

    let placement = defaultPlacement
    let maybe = defaultMaybe

    selector = selector.replace(/::?(before|after|content)\b/, (_match, customPlacement) => {
      placement = customPlacement
      return ''
    })

    selector = selector.replace(/:maybe\b/, () => {
      maybe = true
      return ''
    })

    // Each step inherits all options of this change.
    const step = {
      ...options,
      selector,
      placement,
      maybe,
      originalRenderOptions: options,
    }

    steps.push(step)
  }

  return steps
}

export function hasAutoHistory(newFragments: Element[], layer: Layer): boolean {
  // We cannot use up.fragment.contains(fragment, config.autoHistoryTargets)
  // because fragment is not yet attached when we are called from OpenLayerPlan.

  let vanillaSelector = expandTargets(fragmentConfig.autoHistoryTargets, { layer }).join()

  for (let newFragment of newFragments) {
    if (e.subtree(newFragment, vanillaSelector).length) {
      return true
    }
  }

  printToStandard('up.render()', "Will not auto-update history because fragment doesn't contain a selector from up.fragment.config.autoHistoryTargets")
  return false
}

export function matches(element: e.ElementOrSelector, selector: string | Element, options: t.LookupOptions = {}): boolean {
  // The fragment is documented as an Element. A selector must match.
  element = e.getOne(element)!
  if (u.isElement(selector)) {
    let target = tryToTarget(selector)
    // Returns undefined for an element without a target.
    return (target && element.matches(target)) as boolean
  } else {
    return new Selector(selector, element, options).matches(element)
  }
}

export function matchSelectorMap(element: Element, selectorMap?: u.PlainObject, { layer = element }: t.LookupOptions = {}): any[] {
  let hits: any[] = []

  if (selectorMap && element) {
    for (let [selector, value] of Object.entries(selectorMap)) {
      if (u.isDefined(value) && matches(element, selector, { layer })) {
        hits.push(value)
      }
    }
  }

  return hits
}

export function shouldRevalidate(request: UpRequest, response: UpResponse, options: t.RenderOptions = {}): boolean | undefined {
  return request.fromCache && u.evalAutoOption(options.revalidate, fragmentConfig.autoRevalidate, response)
}

function isContainedByRivalStep(steps: t.RenderStep[], candidateStep: t.RenderStep): boolean {
  return u.some(steps, function(rivalStep) {
    return (rivalStep !== candidateStep) &&
      ((rivalStep.placement === 'swap') || (rivalStep.placement === 'content')) &&
      // Steps have an old element once their target is matched.
      rivalStep.oldElement!.contains(candidateStep.oldElement!)
  })
}

export function compressNestedSteps(steps: t.RenderStep[]): t.RenderStep[] {
  if (steps.length < 2) return steps
  let compressed = u.uniqBy(steps, 'oldElement')
  compressed = u.reject(compressed, (step) => isContainedByRivalStep(compressed, step))
  return compressed
}

export const abortFragment = mockable(function abortFragment(...args: any[]): void {
  let options = parseTargetAndOptions(args)

  // The function that checks whether a given function will be aborted.
  let testFn: (request: UpRequest) => boolean

  // The reason will be logged with the up:request:abort event when we actually abort an event.
  // It should be a string, not an array that goes through sprintf().
  let { reason, newLayer, jid } = options

  // At the end we're going to emit up:fragment:aborted on these elements.
  // Other async code observing these elements can then chose to abort itself.
  let elements: Element[]

  // An element can be passed as first argument (public API) or as { target } option.
  // There's also an internal API that { target } can be an array of elements.
  // This is used by up.RenderJob.
  if (options.target) {
    // If we're given an element or selector, we abort all requests
    // targeting that subtree.
    elements = getAllFragments(options.target, options)
    testFn = (request) => request.isBoundToSubtrees(elements)
    reason ||= 'Aborting requests within fragment'
  } else {
    // If we're not given an element or selector, we abort all layers
    // matching the { layer } option. If no { layer } option is given,
    // all requests in the current layer are aborted.
    //
    // This behavior is slightly inconsistent with that of other up.fragment
    // functions, which operate on the main element if no other target is given.
    // However, when we navigate on a layer, we want to abort *all* requests on
    // that layer, even requests with a target outside of main, e.g. a nav bar.
    let layers = layerStack.getAll(options)
    elements = u.map(layers, 'element')
    testFn = (request) => request.isBoundToLayers(layers)
    reason ||= 'Aborting requests within ' + layers.join(', ')
  }

  let testFnWithAbortable = (request: UpRequest) => request.abortable && testFn(request)
  abortRequests(testFnWithAbortable, { ...options, reason })

  // We *always* emit an `up:fragment:aborted` event, even when there is no
  // request being aborted. This event serves for *any* async code that may want
  // to abort itself, e.g. timers waiting for a delay.
  for (let element of elements) {
    // Some effort has invested to log about aborting only when necessary:
    //
    // (1) We don't log on up:fragment:aborted. This event is emitted with *every*
    //     fragment update, whether or not we're actually aborting requests. Logging
    //     with every update would make the log noisy and confusing.
    // (2) When we *do* abort a request, up:request:aborted is emitted and logged.
    //     This is done in up.Request#setAbortedState().
    // (3) When up.fragment.abort() is called via up.render({ abort }) we also log
    //     a message "Change with { abort } option will abort other requests' before
    //     we abort the first request. This is done via an { logOnce } option that
    //     this function passes on to up.network.abort().
    emit(element, 'up:fragment:aborted', { reason, newLayer, jid, log: reason })
  }
})

export function onAborted(fragment: Element, callback: (event: t.FragmentAbortedEvent) => void): UnbindFn {
  // Aborting the root layer should not abort a poller in an overlay, like it doesn't abort the overlay's requests.
  return onClosest(fragment, 'up:fragment:aborted', { layer: 'origin' }, callback)
}

export function onKept(fragment: Element, callback: (event: t.FragmentKeptEvent) => void): UnbindFn {
  return onClosest(fragment, 'up:fragment:kept', { layer: 'origin' }, callback)
}

// This function lives in up.fragment (not up.element)
// because we stop the observe via up.fragment.onAborted().
export function onFirstIntersect(element: Element, callback: () => void, { margin = 0 }: { margin?: number } = {}): void {
  // IntersectionObserver has some ms lag until it reports intersection entries.
  // This lag also exists for the initial intersection check.
  //
  // This is too slow for us when rendering an [up-defer="reveal"]
  // that both (1) already cached and (2) scrolled into viewport when inserted.
  // In that case we want to immediately render the cached content and not show
  // a flash of unloaded partial. The same is true when revalidating such a partial.
  if (e.isIntersectingWindow(element, { margin })) {
    callback()
    return
  }

  // This function will be called (1) for the initial intersection check
  // and (2) whenever the intersection state changes.
  function processIntersectEntries(entries: IntersectionObserverEntry[]) {
    for (let entry of entries) {
      if (entry.isIntersecting) {
        disconnect()
        callback()
        return // just in case we have multiple entries queued
      }
    }
  }

  let observer = new IntersectionObserver(processIntersectEntries, { rootMargin: `${margin}px` })
  let disconnect = () => observer.disconnect()
  observer.observe(element)
  registerDestructor(element, disconnect)
}

const STARTS_WITH_SELECTOR = /^([\w-]+|\*)?(#|\.|[:[][a-z-]{3,})/

export function provideNodes(value: any, { origin, originLayer, data, htmlParser = e.createNodesFromHTML }: t.ProvideNodesOptions = {}): u.List<Node> {
  if (u.isString(value) && STARTS_WITH_SELECTOR.test(value)) {
    let [parsedValue, parsedData] = u.parseScalarJSONPairs(value)[0]
    data = { ...data, ...parsedData }
    value = getSmart(parsedValue, { layer: 'closest', origin, originLayer }) || fail(`Cannot find template "%s"`, value)
  }

  if (u.isString(value)) {
    value = htmlParser(value)
  }

  if (isTemplate(value)) {
    value = cloneTemplate(value, data, { htmlParser })
  }

  return u.wrapList(value)
}

function isTemplate(value: any): boolean {
  return u.isElement(value) && value.matches('template, script[type]') && !isScript(value)
}

// A node cloned from a template. It remembers the template's data for readData().
interface TemplateNode extends Node { upTemplateData?: u.PlainObject }

export function cloneTemplate(templateOrSelector: e.ElementOrSelector, data: any = {}, { origin, htmlParser }: t.ProvideNodesOptions = {}): u.List<Node> {
  // Like provideNodes(), look in the origin's layer first, then in ancestor layers.
  let template = getSmart(templateOrSelector, { origin, layer: 'closest' }) || fail('Template not found: %o', templateOrSelector)
  let event = emit(template, 'up:template:clone', { data, nodes: null, log: ["Using template %o", templateOrSelector] })
  // Each node remembers the template variables for readData(), even a text node.
  let nodes: u.List<TemplateNode> = event.nodes ?? defaultTemplateNodes(template, htmlParser)
  for (let node of nodes) {
    node.upTemplateData = data
  }
  return nodes
}

function defaultTemplateNodes(template: Element, htmlParser: t.HTMLParser = e.createNodesFromHTML): u.List<Node> {
  let templateText = template.innerHTML
  return htmlParser(templateText)
}

export function insertTemp(...args: any[]): () => void {
  let [reference, position = 'beforeend', tempValue] = u.parseArgs(args, 'val', u.isAdjacentPosition, 'val')

  let tempNodes = provideNodes(tempValue, { origin: reference })
  // We may be given a NodeList, or an HTML string without a single root Element.
  // In these cases we wrap it in an <up-wrapper> so we have a single root Element we
  // can pass into Element#insertAdjacentElement(), up.hello() or up.destroy().
  // This simplifies our code significantly.
  let tempElement = e.wrapIfRequired(tempNodes)

  // In case the element was already attached to this document, we need to remember
  // its position so we can return it when reverting.
  let oldPosition = document.contains(tempElement) && e.documentPosition(tempElement)

  reference.insertAdjacentElement(position, tempElement)

  if (oldPosition) {
    // Don't compile or destroy an element if it was connected to the document before the move.
    return () => {
      oldPosition[0].insertAdjacentElement(oldPosition[1], tempElement)
    }
  } else {
    hello(tempElement)
    return () => destroy(tempElement)
  }
}

export function trackSelector<E extends Element>(selectFn: () => u.List<E>, callback: (element: E) => any): UnbindFn {
  let tracker = new SelectorTracker(selectFn, callback)
  return tracker.start()
}

let mutateLevel = 0
let afterMutateCleaner = u.cleaner('fifo')

export function mutate<T>(callback: () => T): T {
  try {
    mutateLevel++
    return callback()
  } finally {
    if (--mutateLevel === 0) {
      afterMutateCleaner.clean()
    }
  }
}

export function afterMutate(callback: () => void): void {
  if (mutateLevel === 0) {
    callback()
  } else {
    afterMutateCleaner(callback)
  }
}


export function install(): void {
  // Snapshot the keep identity before macros make changes.
  // TODO: Doesn't this need to happen before other macros?
  registerMacro('[up-keep]', (element) => keepIdentity(element))

  on('up:framework:boot', function() {
    const { documentElement } = document

    hello(documentElement)

    documentElement.setAttribute('up-source', normalizeSource(location.href))

    if (!canPushState() && isHistoryEnabled('location')) {
      return printToWarn('Cannot push history changes. Next render pass with history will load a full page.')
    }
  })
}

export const api = {
  fragment: {
    config: fragmentConfig,
    reload,
    destroy,
    render,
    navigate,
    get: getSmart,
    all: getAllFragments,
    subtree: getSubtree,
    contains,
    closest,
    source: sourceOf,
    visit,
    toTarget,
    isTargetable,
    matches,
    time: timeOf,
    etag: etagOf,
    abort: abortFragment,
    onAborted,
    onKept,
    isAlive,
    cloneTemplate,
    // export for testing
    // swapTemp,
    // timer: scheduleTimer
  },
  reload,
  destroy,
  render,
  navigate,
  visit,
  template: { clone: cloneTemplate },
  get context() { return layerStack.current.context },
  set context(context) { layerStack.current.context = context },
}
