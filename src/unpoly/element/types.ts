import type * as u from '../util.js'
import { type UpEvent } from '../event.js'

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
  excludeRaw?: string
}

/**
The `up:element:defined` event.
*/
export interface ElementDefinedEvent extends UpEvent { localName: string }

/**
Reads an attribute value from an element, like `up.element.booleanAttr()`.
@internal
*/
export type AttrReader = (element: Element, attribute: string) => any

/**
Options for an `up.OptionsParser`.
@internal
*/
export interface OptionsParserOptions {
  // Also parse an [up-fail-…] attribute for each option that has a fail variant.
  fail?: boolean
  // Look for attributes on the element's ancestors, too.
  closest?: boolean
  attrPrefix?: string
  // Defaults for options without an attribute, or `false` to set no defaults.
  defaults?: u.PlainObject | false
}

/**
Options for parsing a single option with an `up.OptionsParser`.
@internal
*/
export interface ParseKeyOptions {
  // The attribute(s) to read. Defaults to the kebab-cased key with the parser's prefix.
  attr?: string | string[]
  default?: any
  normalize?: (value: any) => any
}
