/**
A list that Unpoly's list functions accept: an array, a `NodeList`, an `HTMLCollection`,
an `arguments` object or a jQuery collection.
*/
export interface List<T> extends ArrayLike<T>, Iterable<T> {}

/**
What `up.util.wrapList()` returns for a value of type `V`:

- a single value gives an array,
- a list gives that list,
- `null` or `undefined` give an empty array,
- a value that may be a single value or a list gives a `List` of items.
*/
export type WrappedList<V> =
  unknown extends V ? List<V>
  : [ListMember<V>] extends [never] ? NonNullable<V>[]
  : [NonNullable<V>] extends [ListMember<V>] ? (V extends null | undefined ? never[] : V)
  : List<ListItem<V>>

// A string is array-like, but wrapList() wraps it like any other single value.
type ListMember<V> = Exclude<Extract<V, List<unknown>>, string>
type ListItem<V> = V extends null | undefined ? never : V extends string ? V : V extends List<infer T> ? T : V

/**
A function called for each item of a list, or the name of a property to read from each item.
*/
export type Iteratee<T, R> = ((item: NoInfer<T>, index: number) => R) | string

/**
A plain object with string keys, like an options object or parsed JSON.
*/
// oxlint-disable-next-line typescript/no-explicit-any -- any user value
export type PlainObject = Record<string, any>

/**
A value, or a function that returns the value. See `up.util.evalOption()`.
*/
// oxlint-disable-next-line typescript/no-explicit-any -- a function with any parameters
export type ValueOrFunction<T> = T | ((...args: any[]) => T)

/**
The parts of a URL, as returned by `up.util.parseURL()`.
A `URL`, a `Location` or an `<a>` element all have these properties.
*/
export interface ParsedURL {
  href: string
  protocol: string
  host: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
}

/**
Options for `up.util.normalizeURL()`.
*/
export interface NormalizeURLOptions {
  host?: boolean | 'cross-domain'
  hash?: boolean
  search?: boolean
  trailingSlash?: boolean
}

/**
A function that undoes a temporary change, like the one returned by `e.setAttrsTemp()`.
*/
export type UndoFunction = () => void

/** @internal */
// oxlint-disable-next-line typescript/no-explicit-any -- a function with any parameters
export type AnyFunction = (...args: any[]) => any

/**
A promise that can be resolved or rejected from the outside. See `newDeferred()`.
@internal
*/
export interface Deferred<T> extends Promise<T> {
  resolve(value?: T | PromiseLike<T>): void
  reject(reason?: unknown): void
}

/**
Collects clean-up functions and runs them later. See `cleaner()`.
@internal
*/
export interface Cleaner {
  /** Adds functions to run on clean-up. Values that are not functions are ignored. */
  (...values: unknown[]): void
  /** Like calling the cleaner, but a function that throws doesn't stop the others. */
  guard(...values: unknown[]): void
  /** Runs all functions and forgets them. */
  clean(...args: unknown[]): void
}

/**
What `parseArgs()` should extract from the end of an argument list:
`'options'` (a plain object), `'callback'` (a function), `'val'` (any value),
or a function that tests whether the last argument matches.
@internal
*/
export type ArgSpec = 'options' | 'callback' | 'val' | ((value: unknown) => boolean)

/**
Returns a selector for a config property. See `Config#selectorFn()`.
@internal
*/
export type SelectorFunction = (condition?: string) => string
