import type * as u from '../util.js'
import type { UpEvent } from '../event.js'

/**
A CSS selector, an element, or a list of elements. See `up.element.get()`.
*/
export type ElementOrSelector = string | Element | u.List<Element>

/**
Inline styles as an object, with property names in kebab-case (`'font-size'`).
Values are strings, or numbers that get the unit passed to `up.element.setStyle()`.
Any object with such properties works, e.g. an `up.Rect`.
*/
// oxlint-disable-next-line typescript/no-explicit-any -- any object with style properties, like an up.Rect
export type StyleProps = Record<string, any>

/**
The `up:element:defined` event.
*/
export interface ElementDefinedEvent extends UpEvent { localName: string }

/**
Reads an attribute value from an element, like `up.element.booleanAttr()`.
@internal
*/
export type AttrReader<R = unknown> = (element: Element, attribute: string) => R

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

declare module '../event.js' {
  interface UpEventMap {
    'up:element:defined': ElementDefinedEvent
  }
}
