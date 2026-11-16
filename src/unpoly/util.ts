import { canJQuery } from './browser.js'
import { guardFn } from './error.js'
import type * as t from './util/types.js'
export type * from './util/types.js'
export { FIFOCache } from './util/fifo_cache.js'
export { Rect } from './util/rect.js'
export { UpURLPattern } from './util/url_pattern.js'

export function noop(): void {
}

export function asyncNoop(): Promise<void> {
  return Promise.resolve()
}

export function memoize<F extends t.AnyFunction>(func: F, cacheProp?: string): F {
  let cache: { value?: [ReturnType<F>], error?: unknown } = {}

  return function(this: t.PlainObject, ...args) {
    if (cacheProp) cache = (this[cacheProp] ||= {})
    if (cache.value) return cache.value[0]
    if (cache.error) throw cache.error
    try {
      return (cache.value = [func.apply(this, args)])[0]
    } catch (error) {
      throw (cache.error = error)
    }
  } as F
}

export function normalizeURL(url: string | t.ParsedURL, options?: t.NormalizeURLOptions): string {
  options = newOptions(options, { host: 'cross-domain' })

  const parts = parseURL(url)
  let normalized = ''

  if (options.host === 'cross-domain') {
    options.host = isCrossOrigin(parts)
  }

  if (options.host) {
    normalized += parts.protocol + "//" + parts.host
  }

  let { pathname } = parts

  if (options.trailingSlash === false && pathname !== '/') {
    pathname = pathname.replace(/\/$/, '')
  }
  normalized += pathname

  if (options.search !== false) {
    normalized += parts.search
  }

  if (options.hash !== false) {
    normalized += parts.hash
  }

  return normalized
}

export function matchURLs(leftURL: string, rightURL: string, options?: t.NormalizeURLOptions): boolean {
  return matchableURL(leftURL, options) === matchableURL(rightURL, options)
}

// Normalize the URL so it is better suited for path comparison.
// In particular it strips the hash and trailing slash.
export function matchableURL(url?: string | t.ParsedURL, options?: t.NormalizeURLOptions): string | undefined {
  if (!url) return
  return normalizeURL(url, { hash: false, trailingSlash: false, ...options })
}

export function matchableURLPatternAtom(patternAtom: string): string | string[] {
  // Convert "https://our-host/foo" to "/foo", like matchableURL() normalizes same-origin URLs
  if (patternAtom.startsWith(APP_ORIGIN + '/')) patternAtom = patternAtom.slice(APP_ORIGIN.length)

  // Convert "/foo/" to ["/foo/", "/foo"]
  if (patternAtom.endsWith('/')) return [patternAtom, patternAtom.slice(0, -1)]

  // Convert "/foo/?" to ["/foo/?", "/foo?"]
  if (patternAtom.includes('/?')) return [patternAtom, patternAtom.replace('/?', '?')]

  // Convert "/foo/*" to ["/foo/*", "/foo", "/foo?*"]
  if (patternAtom.endsWith('/*')) return [patternAtom, patternAtom.slice(0, -2), patternAtom.slice(0, -2) + '?*']

  return patternAtom
}

// We're calling isCrossOrigin() a lot.
// Accessing location.protocol and location.hostname every time
// is much slower than comparing cached strings.
// https://jsben.ch/kBATt
const APP_PROTOCOL = location.protocol
const APP_HOSTNAME = location.hostname
const APP_ORIGIN = location.origin

export function isCrossOrigin(urlOrAnchor: string | t.ParsedURL): boolean {
  // If the given URL does not contain a hostname we know it cannot be cross-origin.
  // In that case we don't need to parse the URL.
  if (isString(urlOrAnchor) && (urlOrAnchor.indexOf('//') === -1)) {
    return false
  }

  const parts = parseURL(urlOrAnchor)
  return (APP_HOSTNAME !== parts.hostname) || (APP_PROTOCOL !== parts.protocol)
}

export function parseURL(url: string | t.ParsedURL): t.ParsedURL {
  if ((url as t.ParsedURL).pathname) {
    return url as t.ParsedURL
  }

  // We would prefer to use `new URL(url, location.href)` here, but that is 30% slower
  // than creating a link (see benchmark at https://jsbench.me/l7l2x9cruf/1).
  // We're parsing a *lot* of URLs for .up-active, so this matters.
  let link = document.createElement('a')
  link.href = url as string
  return link
}

export function normalizeMethod(method?: string | null): string {
  return method ? method.toUpperCase() : 'GET'
}

export function methodAllowsPayload(method: string): boolean {
  return (method !== 'GET') && (method !== 'HEAD')
}

function iteratee(block: t.AnyFunction | string): t.AnyFunction {
  if (isString(block)) {
    return (item: t.PlainObject) => item[block]
  } else {
    return block
  }
}

// Also takes an iterator, like the one returned by String#matchAll(). It has no length.
export function map<T, K extends keyof T>(list: Iterable<T> & { length?: number }, key: K): T[K][]
export function map<T, R>(list: Iterable<T> & { length?: number }, block: t.Iteratee<T, R>): R[]
export function map<T, R>(list: Iterable<T> & { length?: number }, block: t.Iteratee<T, R>): R[] {
  if (list.length === 0) { return [] }
  block = iteratee(block)
  let mapped = []
  let i = 0
  for (let item of list) {
    mapped.push(block(item, i++))
  }
  return mapped
}

export function mapObject<T>(array: T[], pairer: (item: T, index: number) => [PropertyKey, unknown]): t.PlainObject {
  return Object.fromEntries(array.map(pairer))
}

export function each<T>(array: Iterable<T>, block: (item: T, index: number) => void): void {
  // note that the native Array.forEach is very slow (https://jsperf.com/fast-array-foreach)
  let i = 0
  for (let item of array) {
    block(item, i++)
  }
}

export function isNull(value: unknown): value is null {
  return value === null
}

function isTruthy(value: unknown): boolean {
  return !!value
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined
}


export const isDefined = negate(isUndefined) as <T>(value: T) => value is Exclude<T, undefined>

export function isMissing(value: unknown): value is null | undefined {
  return isUndefined(value) || isNull(value)
}

export const isGiven = negate(isMissing) as <T>(value: T) => value is NonNullable<T>

export function isBlank(value: unknown): boolean {
  if (isMissing(value)) {
    return true
  }
  if (isObject(value) && value[isBlank.key]) {
    return value[isBlank.key]()
  }
  if (isString(value) || isList(value)) {
    return value.length === 0
  }
  if (isOptions(value)) {
    return Object.keys(value).length === 0
  }
  return false
}

isBlank.key = 'up.util.isBlank' as const

export function presence<T, S extends T>(value: T, tester: (value: T) => value is S): S | undefined
export function presence<T>(value: T, tester?: (value: T) => boolean): NonNullable<T> | undefined
export function presence<T>(value: T, tester: (value: T) => boolean = isPresent): NonNullable<T> | undefined {
  if (tester(value)) {
    // We assume that the tester rejects null and undefined, like every tester we pass.
    return value as NonNullable<T>
  }
}

export const isPresent = negate(isBlank)

export function isFunction(value: unknown): value is t.AnyFunction {
  return typeof(value) === 'function'
}

// Also true for `String` objects, which behave like strings in all places we care about.
export function isString(value: unknown): value is string {
  return (typeof(value) === 'string') || value instanceof String
}

export function isBoolean(value: unknown): value is boolean {
  return (typeof(value) === 'boolean') || value instanceof Boolean
}

export function isNumber(value: unknown): value is number {
  return (typeof(value) === 'number') || value instanceof Number
}

export function isOptions(value: unknown): value is t.PlainObject {
  return (typeof(value) === 'object') && !isNull(value) && (isUndefined(value.constructor) || (value.constructor === Object))
}

export function isObject<T>(value: T): value is T & t.PlainObject {
  const typeOfResult = typeof(value)
  return ((typeOfResult === 'object') && !isNull(value)) || (typeOfResult === 'function')
}

export function isElement(value: unknown): value is Element {
  return value instanceof Element
}

export function isTextNode(value: unknown): value is Text {
  return value instanceof Text
}

export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp
}

function isError(value: unknown): value is Error {
  return value instanceof Error
}

export function isJQuery(value: unknown): boolean {
  return canJQuery() && value instanceof jQuery
}

// Not a type predicate: a jQuery collection passes, but an empty one, a NodeList or an array of
// elements doesn't. No predicate type is right for both branches.
export function isElementLike(value: unknown): boolean {
  return isObject(value) && !!(value.addEventListener || (isJQuery(value) && value[0]?.addEventListener))
}

export function isPromise(value: unknown): value is Promise<unknown> {
  return isObject(value) && isFunction(value.then)
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
export const { isArray } = Array

export function isFormData(value: unknown): value is FormData {
  return value instanceof FormData
}

export function toArray<T>(value: t.List<T>): T[] {
  return isArray(value) ? value : copyArrayLike(value)
}

export function isList(value: unknown): value is t.List<unknown> {
  return isArray(value) ||
    isNodeList(value) ||
    isArguments(value) ||
    isJQuery(value) ||
    isHTMLCollection(value)
}

function isNodeList(value: unknown): value is NodeList {
  return value instanceof NodeList
}

function isHTMLCollection(value: unknown): value is HTMLCollection {
  return value instanceof HTMLCollection
}

function isArguments(value: unknown): boolean {
  return Object.prototype.toString.call(value) === '[object Arguments]'
}

export function isAdjacentPosition(value: string): boolean {
  return /^(before|after)/.test(value)
}

export function wrapList<V>(value: V): t.WrappedList<V>
export function wrapList(value: unknown): t.List<unknown> {
  if (isList(value)) {
    return value
  } else if (isMissing(value)) {
    return []
  } else {
    return [value]
  }
}

// A list (like a NodeList or an array) is copied into a new array.
// A string is a list of characters, too, but `& object` keeps it out of this overload.
export function copy<T>(value: t.List<T> & object): T[]
export function copy<T>(value: T): T
export function copy(value: unknown): unknown {
  if (isObject(value) && value[copy.key]) {
    value = value[copy.key]()
  } else if (isList(value)) {
    value = copyArrayLike(value)
  } else if (isOptions(value)) {
    value = Object.assign({}, value)
  }
  return value
}

function copyArrayLike<T>(arrayLike: ArrayLike<T>): T[] {
  return Array.prototype.slice.call(arrayLike)
}

copy.key = 'up.util.copy' as const

export function merge(...sources: (t.PlainObject | null | undefined)[]): t.PlainObject {
  return Object.assign({}, ...sources)
}

export function mergeDefined(...sources: t.PlainObject[]): t.PlainObject {
  const result: t.PlainObject = {}
  for (let source of sources) {
    if (source) {
      for (let key in source) {
        const value = source[key]
        if (isDefined(value)) {
          result[key] = value
        }
      }
    }
  }
  return result
}

export function newOptions(object?: t.PlainObject, defaults?: t.PlainObject): t.PlainObject {
  if (defaults) {
    return merge(defaults, object)
  } else if (object) {
    return copy(object)
  } else {
    return {}
  }
}

export function parseArgIntoOptions(args: unknown[], argKey: string): t.PlainObject {
  let [positionalArg, options] = parseArgs(args, 'val', 'options')
  if (isDefined(positionalArg)) {
    options[argKey] = positionalArg
  }
  return options
}

export function findInList<T>(list: Iterable<T>, tester: ((item: T) => unknown) | string): T | undefined {
  tester = iteratee(tester)
  let match
  for (let element of list) {
    if (tester(element)) {
      match = element
      break
    }
  }
  return match
}

export function some<T>(list: Iterable<T>, tester: t.Iteratee<T, unknown>): boolean {
  return !!findResult(list, tester)
}

export function findResult<T, R = unknown>(list: Iterable<T>, tester: t.Iteratee<T, R>): R | undefined {
  tester = iteratee(tester)
  let i = 0
  for (let item of list) {
    const result = tester(item, i++)
    if (result) {
      return result
    }
  }
}

export function every<T>(list: Iterable<T>, tester: t.Iteratee<T, unknown>): boolean {
  tester = iteratee(tester)
  let match = true
  let i = 0
  for (let item of list) {
    if (!tester(item, i++)) {
      match = false
      break
    }
  }
  return match
}

export function compact<T>(array: t.List<T>): NonNullable<T>[] {
  return filterList(array, isGiven)
}

export function compactObject<T extends object>(object: T): Partial<T> {
  return pickBy(object, isGiven)
}

export function uniq<T>(array: T[]): T[] {
  if (array.length < 2) { return array }
  return Array.from(new Set(array))
}

export function uniqBy<T>(array: T[], mapper: t.Iteratee<T, unknown>): T[] {
  if (array.length < 2) { return array }
  mapper = iteratee(mapper)
  const seenElements = new Set()
  return filterList(array, function(elem, index) {
    const mapped = mapper(elem, index)
    if (seenElements.has(mapped)) {
      return false
    } else {
      seenElements.add(mapped)
      return true
    }
  })
}

export function filterList<T, S extends T>(list: Iterable<T>, tester: (item: T, index: number) => item is S): S[]
export function filterList<T>(list: Iterable<T>, tester: t.Iteratee<T, unknown>): T[]
export function filterList<T>(list: Iterable<T>, tester: t.Iteratee<T, unknown>): T[] {
  tester = iteratee(tester)
  const matches: T[] = []
  each(list, function(element, index) {
    if (tester(element, index)) {
      return matches.push(element)
    }
  })
  return matches
}

export function reject<T>(list: Iterable<T>, tester: t.Iteratee<T, unknown>): T[] {
  tester = negate(iteratee(tester))
  return filterList(list, tester)
}

export function intersect<T>(array1: t.List<T>, array2: t.List<T>): T[] {
  return filterList(array1, (element) => contains(array2, element))
}

export function scheduleTimer(millis: number, callback: () => void): number {
  return setTimeout(callback, millis)
}

export function queueTask(task: () => void): void {
  setTimeout(task)
}

export function queueFastTask(task: () => void): void {
  const channel = new MessageChannel()
  channel.port1.onmessage = () => task()
  channel.port2.postMessage(0)
}

export function last<T>(value: ArrayLike<T>): T {
  return value[value.length - 1]
}

export function contains(value: t.List<unknown> | string, subValue: unknown): boolean {
  // A NodeList or jQuery collection has no indexOf().
  let indexOf = (value as unknown[]).indexOf || Array.prototype.indexOf
  return indexOf.call(value, subValue) >= 0
}

export function containsAll(values: t.List<unknown> | string, subValues: t.List<unknown>): boolean {
  return every(subValues, (subValue) => contains(values, subValue))
}


export function objectContains(object: t.PlainObject, subObject: t.PlainObject): boolean {
  const reducedValue = pick(object, Object.keys(subObject))
  return isEqual(subObject, reducedValue)
}

export function pick<T extends object, K extends keyof T>(object: T, keys: readonly K[]): Pick<T, K> {
  const filtered = {} as Pick<T, K>
  for (let key of keys) {
    if (key in object) {
      filtered[key] = object[key]
    }
  }
  return filtered
}

export function pickBy<T extends object>(object: T, tester: ((value: T[keyof T], key: string) => unknown) | string): Partial<T> {
  tester = iteratee(tester)
  const filtered: Partial<T> = {}
  for (let key in object) {
    const value = object[key]
    if (tester(value, key)) {
      filtered[key] = object[key]
    }
  }
  return filtered
}

export function omit<T extends object, K extends keyof T>(object: T, keys: readonly K[]): Omit<T, K> {
  return pickBy(object, (_value, key) => !contains(keys, key)) as Omit<T, K>
}

export function unresolvablePromise(): Promise<never> {
  return new Promise(noop)
}

export function remove<T>(array: T[], element: T): T | undefined {
  const index = array.indexOf(element)
  if (index >= 0) {
    array.splice(index, 1)
    return element
  }
}

export function evalOption<T>(value: t.ValueOrFunction<T>, ...args: unknown[]): T {
  return isFunction(value) ? value(...args) : value
}

// The value and its 'auto' meaning may each be a function that is called with the args.
export function evalAutoOption<T, A>(
  value: t.ValueOrFunction<T | 'auto'>,
  autoMeans: t.ValueOrFunction<A>,
  ...args: unknown[]
): Exclude<T, 'auto'> | A
export function evalAutoOption(value: unknown, autoMeans: unknown, ...args: unknown[]): unknown {
  value = evalOption(value, ...args)
  // Allow functions to return 'auto'
  if (value === 'auto') {
    value = evalOption(autoMeans, ...args)
  }
  return value
}

const ESCAPE_HTML_ENTITY_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': '&quot;',
  "'": '&#x27;'
}

export function escapeHTML(string: string): string {
  return string.replace(/[&<>"']/g, (char) => ESCAPE_HTML_ENTITY_MAP[char])
}

export function escapeRegExp(string: string): string {
  // From https://github.com/benjamingr/RegExp.escape
  return string.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&')
}

export function pluckKey<T extends object, K extends keyof T>(object: T, key: K): T[K] {
  const value = object[key]
  delete object[key]
  return value
}

export function renameKey(object: t.PlainObject, oldKey: string, newKey: string): void {
  if (oldKey in object) {
    object[newKey] = pluckKey(object, oldKey)
  }
}

function extractLastArg<T>(args: unknown[], tester: (value: unknown) => value is T): T | undefined {
  if (tester(last(args))) {
    return args.pop() as T
  }
}

export function extractCallback(args: unknown[]): t.AnyFunction | undefined {
  return extractLastArg(args, isFunction)
}

export function extractOptions(args: unknown[]): t.PlainObject {
  return extractLastArg(args, isOptions) || {}
}

export function identity<T>(arg: T): T {
  return arg
}

// Takes functions, lists of functions, or other values, which are ignored.
export function sequence(...fns: unknown[]): (...args: unknown[]) => unknown[] {
  return (...callArgs) => callAll(fns, ...callArgs)
}

function callAll(fns: unknown, ...args: unknown[]): unknown[] {
  return map(scanFunctions(fns), (fn) => fn(...args))
}

export function flatten<T>(array: t.List<T | t.List<T>>): T[] {
  const flattened = []
  for (let object of array) {
    if (isList(object)) {
      flattened.push(...object)
    } else {
      flattened.push(object)
    }
  }
  return flattened
}

// The items of a list, or a value that is no list. A string is a list of characters, but `& object` keeps it out.
type Flattened<U> = U extends t.List<infer R> & object ? R : U

export function flatMap<T, K extends keyof T>(array: t.List<T>, key: K): Flattened<T[K]>[]
export function flatMap<T, U>(array: t.List<T>, block: t.Iteratee<T, U>): Flattened<U>[]
export function flatMap<T, U>(array: t.List<T>, block: t.Iteratee<T, U>): unknown[] {
  return flatten(map(array, block))
}

export function always(promise: Promise<unknown>): Promise<unknown>
export function always<R>(promise: Promise<unknown>, callback: (valueOrError: unknown) => R): Promise<R>
export function always(promise: Promise<unknown>, callback: (valueOrError: unknown) => unknown = identity): Promise<unknown> {
  return promise.then(callback, callback)
}

export function newDeferred<T = unknown>(): t.Deferred<T> {
  let { promise, resolve, reject } = Promise.withResolvers<T>()
  return Object.assign(promise, { resolve, reject })
}

export function isBasicObjectProperty(k: PropertyKey): boolean {
  return Object.hasOwn(Object.prototype, k)
}

// oxlint-disable-next-line typescript/no-explicit-any -- probes values of any type
export function isEqual(a: any, b: any): boolean {
  // When two values have trivial equality, return immediately instead of going
  // through the extensive normalization and comparison below.
  if (a === b) {
    return true
  }

  if (a?.valueOf) { a = a.valueOf() } // Date, String objects, Number objects
  if (b?.valueOf) { b = b.valueOf() } // Date, String objects, Number objects

  if (a === b) {
    return true
  }

  if (typeof(a) !== typeof(b)) {
    return false
  }

  if (isList(a) && isList(b)) {
    return isEqualList(a, b)
  }

  if (isObject(a) && a[isEqual.key]) {
    return a[isEqual.key](b)
  }

  if (isOptions(a) && isOptions(b)) {
    return isEqualOptions(a, b)
  }

  return false
}

function isEqualOptions(a: t.PlainObject, b: t.PlainObject): boolean {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  return isEqualList(aKeys, bKeys) && every(aKeys, (key) => isEqual(a[key], b[key]))
}

isEqual.key = 'up.util.isEqual' as const

// Options for getSimpleTokens().
interface SimpleTokenOptions {
  json?: boolean
  separator?: string | RegExp
}

function isEqualList(a: t.List<unknown>, b: t.List<unknown>): boolean {
  return (a.length === b.length) && every(a, (elem, index) => isEqual(elem, b[index]))
}

// A string is split into tokens, with { json } also a JSON array. A list is returned unchanged,
// and any other value wrapped into an array. The overloads promise an array, since the only lists
// we get are arrays, or a jQuery { layer } that LayerLookup only iterates.
export function getSimpleTokens(value: string | string[] | null | undefined, options?: SimpleTokenOptions): string[]
export function getSimpleTokens<T>(value: string | T | t.List<T> | null | undefined, options?: SimpleTokenOptions): (string | T)[]
export function getSimpleTokens(value: unknown, { json = false, separator = /[,\s]/ }: SimpleTokenOptions = {}): t.List<unknown> {
  if (!isString(value)) {
    return wrapList(value)
  } else if (json && /^\[.*]$/.test(value)) {
    return parseRelaxedJSON(value)
  } else {
    return splitSimpleTokenString(value, separator)
  }
}

function splitSimpleTokenString(value: string, separator: string | RegExp): string[] {
  let parts = up.migrate.splitAtOr?.(value) || value.split(separator)
  return parts.map((s) => s.trim()).filter(identity)
}

export function getComplexTokens(value: string | string[] | null | undefined): string[]
export function getComplexTokens<T>(value: string | T | t.List<T> | null | undefined): (string | T)[]
export function getComplexTokens(value: unknown): t.List<unknown> {
  if (!isString(value)) {
    return wrapList(value)
  } else {
    let { maskedTokens, restore } = complexTokenOutlines(value)
    return maskedTokens.map((token) => restore(token))
  }
}

// A string with some substrings replaced by placeholders, and a function to put them back.
// See `up.util.maskPattern()`.
interface MaskedString {
  masked: string
  restore(string: string, transform?: (masked: string) => string): string
}

// What complexTokenOutlines() returns.
interface MaskedTokens {
  maskedTokens: string[]
  restore: MaskedString['restore']
}

function complexTokenOutlines(string: string): MaskedTokens {
  let { masked, restore } = expressionOutline(string)
  let maskedTokens = splitSimpleTokenString(masked, ',')
  return { maskedTokens, restore }
}

// Returns an instance as it is, or constructs one from the arguments.
export function wrapValue<A extends unknown[], T>(constructor: new (...args: A) => T, ...args: NoInfer<A | [T]>): T {
  return (args[0] instanceof constructor) ? args[0] : new constructor(...args as A)
}

let nextUid = 0

export function uid(): number {
  return nextUid++
}

export function withRenamedKeys(object: t.PlainObject, renameKeyFn: (key: string) => string | null | undefined): t.PlainObject {
  const renamed: t.PlainObject = {}
  for (let key in object) {
    let transformed = renameKeyFn(key)
    if (isGiven(transformed)) {
      renamed[transformed] = object[key]
    }
  }
  return renamed
}

export function camelToKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (char) => '-' + char.toLowerCase())
}

export function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_match, char) => char.toUpperCase())
}

export function lowerCaseFirst(str: string): string {
  return str[0].toLowerCase() + str.slice(1)
}

export function upperCaseFirst(str: string): string {
  return str[0].toUpperCase() + str.slice(1)
}

export function defineDelegates<O extends object>(object: O, props: string[], targetProvider: (this: O) => object): void {
  for (let prop of props) {
    Object.defineProperty(object, prop, {
      get() {
        const target = targetProvider.call(this)
        let value = target[prop]
        if (isFunction(value)) {
          value = value.bind(target)
        }
        return value
      },
      set(newValue) {
        const target = targetProvider.call(this)
        target[prop] = newValue
      }
    })
  }
}

export function delegatePromise<O extends object>(object: O, targetProvider: (this: O) => Promise<unknown>): void {
  return defineDelegates(
    object,
    ['then', 'catch', 'finally'],
    targetProvider
  )
}

// oxlint-disable-next-line typescript/no-explicit-any -- probes values of any type
function stringifyArg(arg: any, placeholder = '%o', ancestors = new Set()): string {
  let string
  const maxLength = 200

  // Discard color styles: https://developer.mozilla.org/en-US/docs/Web/API/Console#styling_console_output
  if (placeholder === '%c') {
    return ''
  }

  // In the browser console %s always stringifies the output.
  // Objects become "[object Object]".
  if (placeholder === '%s' && isGiven(arg)) {
    arg = arg.toString()
  }

  // Values nested in an array or object print like a value passed directly with %o.
  let stringifyNested = (value: unknown) => stringifyArg(value, '%o', ancestors)

  if (isString(arg)) {
    string = arg.trim().replace(/[\n\r\t ]+/g, ' ')

    // In the browser console %o displays a string with quotes
    if (placeholder === '%o') {
      // This adds quotes and will log line breaks as verbatim `\n`.
      string = JSON.stringify(string)
    }
  } else if (isFunction(arg)) {
    string = arg.toString()
  } else if (isJQuery(arg)) {
    string = `$(${map(arg, stringifyNested).join(', ')})`
  } else if (isElement(arg)) {
    string = tagOuterHTML(arg)
  } else if (isError(arg)) {
    string = `${arg.name}(${arg.message})`
  } else if (isObject(arg)) {
    // Arrays and objects. Functions, elements and errors are objects, too, but are handled above.
    // Our public classes have a [Symbol.toStringTag] (see unpoly.ts), because minifiers rename them.
    let label = arg[Symbol.toStringTag] || arg.constructor?.name

    if (ancestors.has(arg)) {
      string = '(circular)'
    } else if (isArray(arg) || isOptions(arg)) {
      // Track the arrays and objects we're currently printing, so a cycle doesn't recurse infinitely.
      // An object that appears twice without a cycle is printed in full both times.
      ancestors.add(arg)
      if (isArray(arg)) {
        string = `[${map(arg, stringifyNested).join(', ')}]`
      } else {
        let pairs = Object.entries(arg).map(([key, value]) => `${key}: ${stringifyNested(value)}`)
        string = pairs.length ? `{ ${pairs.join(', ')} }` : '{}'
      }
      ancestors.delete(arg)
    } else if (arg.toString !== Object.prototype.toString) {
      // A class instance with its own readable name, like an up.Request or a Date.
      string = `${label}(${arg.toString()})`
    } else {
      string = `${label} {…}`
    }
  } else {
    // undefined, null, booleans, numbers
    string = String(arg)
  }

  if (string.length > maxLength) {
    string = `${string.substr(0, maxLength)}…${last(string)}`
  }
  return string
}

const SPRINTF_PLACEHOLDERS = /%[oOdisfc]/g

export function sprintf(message: string, ...args: unknown[]): string {
  return message.replace(SPRINTF_PLACEHOLDERS, (placeholder) => stringifyArg(args.shift(), placeholder))
}

const SERIALIZED_TAG_PATTERN = /<("[^"]*"|[^">])*>/

// This could go in up.element, but we want up.util to not have any dependencies
// so every other namespace can depend on up.util.
function tagOuterHTML(element: Element): string {
  return (element.cloneNode() as Element).outerHTML.match(SERIALIZED_TAG_PATTERN)![0]
}

function negate<A extends unknown[]>(fn: (...args: A) => unknown): (...args: A) => boolean {
  return function(...args: A) {
    return !fn(...args)
  }
}

export function memoizeMethod(object: t.PlainObject, propLiteral: t.PlainObject): void {
  // We're accepting the property names as the keys of an object. We don't care about the values.
  // We do this so that object's keys go through the same property mangling as the rest of the code.
  for (let prop in propLiteral) {
    // TODO: Why can't we just get the old prop using object[prop] ?
    // Callers pass a class prototype that defines the methods.
    let originalDescriptor = Object.getOwnPropertyDescriptor(object, prop)!
    let oldImpl = originalDescriptor.value
    let memoizedImpl = memoize(oldImpl, `__${prop}MemoizeCache`)
    object[prop] = memoizedImpl
  }
}

export function safeStringifyJSON(value: unknown): string {
  let json = JSON.stringify(value)
  return escapeHighASCII(json)
}

function escapeHighASCII(string: string): string {
  let unicodeEscape = (char: string) => "\\u" + char.charCodeAt(0).toString(16).padStart(4, '0')
  return string.replace(/[^\x00-\x7F]/g, unicodeEscape)
}

export function variant<T extends object>(source: T, changes: t.PlainObject = {}): T {
  let variant = Object.create(source)
  Object.assign(variant, changes)
  return variant
}

// The results have the types of the arguments, which the caller's overloads describe.
// oxlint-disable-next-line typescript/no-explicit-any -- parsed arguments of any type
export function parseArgs(args: unknown[], ...specs: t.ArgSpec[]): any[] {
  let results = []

  while (specs.length) {
    let lastSpec = specs.pop()

    if (lastSpec === 'options') {
      results.unshift(extractOptions(args))
    } else if (lastSpec === 'callback') {
      results.unshift(extractCallback(args))
    } else if (lastSpec === 'val') {
      results.unshift(args.pop())
    } else if (isFunction(lastSpec)) {
      let value = lastSpec(last(args)) ? args.pop() : undefined
      // Write undefined if the tester failed. This makes the result order deterministic.
      // The caller can set a default liike this:
      //
      //     let [foo = 'default'] = u.parseArgs(args, tester)
      results.unshift(value)
    }
  }

  return results
}

export function scanFunctions(...values: unknown[]): t.AnyFunction[] {
  return values.flat(2).filter(isFunction)
}

export function cleaner(order: 'lifo' | 'fifo' = 'lifo'): t.Cleaner {
  let fns: t.AnyFunction[] = []

  let track = function(values: unknown[], transform: (fn: t.AnyFunction) => unknown) {
    values = scanFunctions(values).map(transform)
    fns.push(...scanFunctions(values))
  }

  let api = function(...values) {
    track(values, identity)
  } as t.Cleaner

  api.guard = function(...values) {
    track(values, guardFn)
  }

  api.clean = function(...args) {
    // By default, we run clean-up actions in the reverse order that they were scheduled in
    if (order === 'lifo') fns.reverse()

    // We don't allow clean-up actions to schedule more clean-up actions, to
    // prevent infinite loops. E.g. a user misunderstanding Preview#show() calls
    // Preview#hide() in an undo action.
    //
    // We can leverage the behavior of forEach(), which sets its range before the first iteration
    // and does not iterate over additional elements.
    // https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.foreach
    // AFAIK for ... of loops would behave differently.
    fns.forEach((fn) => fn(...args))

    // Allow the cleaner to be re-used.
    fns = []
  }

  return api
}

export function maskPattern(
  str: string,
  patterns: RegExp[],
  { keepDelimiters = false }: { keepDelimiters?: boolean } = {},
): MaskedString {
  let maskCount = 0
  let maskPattern = /§\d+/g
  let maskings: Record<string, string> = {}
  let replaceLayers: { allowRestoreTransform: boolean }[] = []

  let replace = (replacePattern: RegExp, allowRestoreTransform: boolean) => {
    let didReplace = false

    str = str.replaceAll(replacePattern, function(match) {
      didReplace = true
      let mask = '§' + (maskCount++)
      let remain
      let masked

      if (keepDelimiters) {
        let startDelimiter = match[0]
        let endDelimiter = match.slice(-1)
        masked = match.slice(1, -1)
        remain = startDelimiter + mask + endDelimiter
      } else {
        masked = match
        remain = mask
      }

      maskings[mask] = masked
      return remain
    })

    if (didReplace) replaceLayers.unshift({ allowRestoreTransform })
  }

  // If the input already contains a mask pattern (like §5), we mask it, but don't allow transforms on restore.
  replace(maskPattern, false)

  // When we mask the given patterns, we allow an optional transform on restore.
  for (let pattern of patterns) replace(pattern, true)

  let restore = (s: string, transform: (masked: string) => string = identity) => {
    for (let { allowRestoreTransform } of replaceLayers) {
      let iterationTransform = allowRestoreTransform ? transform : identity
      s = s.replace(maskPattern, (match) => iterationTransform(assert(maskings[match], isString)))
    }
    return s
  }

  return { masked: str, restore }
}

const QUOTED_STRING_PATTERN = /'(?:\\\\|\\'|[^'])*'|"(?:\\\\|\\"|[^"])*"/g
const NESTED_GROUP_PATTERN = /{(?:[^{}]|{[^{}]*})*}|\((?:[^\(\)]|\([^\(\)]*\))*\)|\[(?:[^\[\]]|\[[^\[\]]*\])*\]/g // oxlint-disable-line no-useless-escape

export function expressionOutline(str: string): MaskedString {
  return maskPattern(str, [QUOTED_STRING_PATTERN, NESTED_GROUP_PATTERN], { keepDelimiters: true })
}

// ("foo") => ("foo")
// ('foo') => ("foo")
// ('foo"bar\'baz"') => ("foo\"bar'baz")
function ensureDoubleQuotes(str: string): string {
  // If we already have double-quoted string, there's nothing to do.
  if (str[0] === '"') return str
  assert(str[0] === "'")
  str = str.slice(1, -1)

  let transformed = str.replace(/(\\\\)|(\\')|(\\")|(")/g, function(_match, escapedBackslash, escapedSingleQuote, _doubleQuote) {
    return escapedBackslash           // keep (\\)
      || (escapedSingleQuote && "'")  // convert (\') to just (')
      || '\\"'                        // convert (") to (\")
  })
  return '"' + transformed + '"'
}

// Parses a quoted string literal.
export function parseString(value: string): string {
  return JSON.parse(ensureDoubleQuotes(value))
}

// oxlint-disable-next-line typescript/no-explicit-any -- parsed JSON, like JSON.parse()
export function parseRelaxedJSON(str: string): any {
  let { masked, restore } = maskPattern(str, [QUOTED_STRING_PATTERN])
  masked = masked.replace(/([a-z_$][\w$]*:)/gi, (unquotedProperty) => ('"' + unquotedProperty.slice(0, -1) + '":'))
  masked = masked.replace(/,\s*([}\]])/g, '$1')
  masked = restore(masked, ensureDoubleQuotes)
  return JSON.parse(masked)
}

export function parseScalarJSONPairs(str: string): [string, t.PlainObject | undefined][] {
  let { maskedTokens, restore } = complexTokenOutlines(str)

  return maskedTokens.map((maskedToken) => {
    // The tokenizer drops empty tokens, so the pattern always matches.
    let [_match, string, json] = maskedToken.match(/([^{]+)({[^}]*})?/)!
    return [
      restore(string.trim()),
      json && parseRelaxedJSON(restore(json))
    ]
  })
}

export function spanObject(keys: string[], value: unknown): t.PlainObject {
  return mapObject(keys, (key) => [key, value])
}

export function parseNumber(str: unknown): number | undefined {
  if (isNumber(str)) {
    return str
  } else if (isString(str) && /^-?\.?\d[\d._]*$/.test(str)) {
    return parseFloat(str.replaceAll('_', ''))
  }
}

export function assert<T, S extends T>(value: T, testFn: (value: T) => value is S): S
export function assert<T>(value: T, testFn?: (value: T) => boolean): T
export function assert<T>(value: T, testFn: (value: T) => boolean = isTruthy): T {
  if (testFn(value)) {
    return value
  } else {
    throw "assert failed"
  }
}

export function install(): void {
  // Implement up.util.copy protocol for Date
  (Date.prototype as t.PlainObject)[copy.key] = function() { return new Date(+this) }
}

export const api = {
  util: {
    parseURL,
    normalizeURL,
    copy,
    merge,
    each,
    map,
    flatMap,
    mapObject,
    findResult,
    some,
    every,
    find: findInList,
    filter: filterList,
    reject,
    compact,
    uniq,
    uniqBy,
    last,
    isNull,
    isDefined,
    isUndefined,
    isGiven,
    isMissing,
    isPresent,
    isBlank,
    presence,
    isObject,
    isFunction,
    isString,
    isBoolean,
    isNumber,
    isElement,
    isJQuery,
    isPromise,
    isArray,
    isList,
    timer: scheduleTimer,
    contains,
    toArray,
    pick,
    pickBy,
    omit,
    remove,
    pluckKey,
    noop,
    escapeHTML,
    evalOption,
    flatten,
    task: queueTask,
    isEqual,
    wrapList,
    parseRelaxedJSON,
    parseNumber,
  },
}
