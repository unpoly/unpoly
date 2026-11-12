/**
A list that Unpoly's list functions accept: an array, a `NodeList`, an `HTMLCollection`,
an `arguments` object or a jQuery collection.
*/
export type List<T> = ArrayLike<T> & Iterable<T>

/**
A function called for each item of a list, or the name of a property to read from each item.
*/
export type Iteratee<T, R> = ((item: T, index: number) => R) | string

/**
A plain object with string keys, like an options object or parsed JSON.
*/
export type PlainObject = Record<string, any>

/**
A value, or a function that returns the value. See `up.util.evalOption()`.
*/
export type ValueOrFunction<T> = T | ((...args: any[]) => T)

/**
The parts of a URL, as returned by `up.util.parseURL()`.
A `URL`, a `Location` or an `<a>` element all have these properties.
*/
export type ParsedURL = Pick<URL, 'href' | 'protocol' | 'host' | 'hostname' | 'port' | 'pathname' | 'search' | 'hash'>

/**
Options for `up.util.normalizeURL()`.
*/
export interface NormalizeURLOptions {
  host?: boolean | 'cross-domain'
  hash?: boolean
  search?: boolean
  trailingSlash?: boolean
}

/** @internal */
export type AnyFunction = (...args: any[]) => any

/**
A promise that can be resolved or rejected from the outside. See `up.util.newDeferred()`.
@internal
*/
export type Deferred<T> = Promise<T> & {
  resolve(value?: T | PromiseLike<T>): void
  reject(reason?: any): void
}

/**
Collects clean-up functions and runs them later. See `up.util.cleaner()`.
@internal
*/
export interface Cleaner {
  /** Adds functions to run on clean-up. Values that are not functions are ignored. */
  (...values: any[]): void
  /** Like calling the cleaner, but a function that throws doesn't stop the others. */
  guard(...values: any[]): void
  /** Runs all functions and forgets them. */
  clean(...args: any[]): void
}

/**
A string with some substrings replaced by placeholders, and a function to put them back.
See `up.util.maskPattern()`.
@internal
*/
export interface MaskedString {
  masked: string
  restore(string: string, transform?: (masked: string) => string): string
}

/**
What `up.util.args()` should extract from the end of an argument list:
`'options'` (a plain object), `'callback'` (a function), `'val'` (any value),
or a function that tests whether the last argument matches.
@internal
*/
export type ArgSpec = 'options' | 'callback' | 'val' | ((value: any) => boolean)

/**
Returns a selector for a config property. See `up.util.Config#selectorFn()`.
@internal
*/
export type SelectorFn = (condition?: string) => string

/**
Returns whether an element matches the selector of a config property. See `up.util.Config#matchesFn()`.
@internal
*/
export type MatchesFn = (element: Element, condition?: string) => boolean

/**
The keys of settings `S` that hold a list of CSS selectors, like `'followSelectors'`.
@internal
*/
export type SelectorKey<S> = { [K in keyof S]-?: S[K] extends string[] ? K : never }[keyof S] & string

/**
Options for `up.FIFOCache`.
@internal
*/
export interface FIFOCacheOptions<K> {
  capacity?: number
  normalizeKey?: (key: K) => any
}

/**
An object with a rectangle's position and size, like a `DOMRect` or an `up.Rect`.
@internal
*/
export interface RectLike {
  left: number
  top: number
  width: number
  height: number
}
