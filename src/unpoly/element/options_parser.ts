import { camelToKebabCase, compact, isDefined, map, wrapList } from '../util.js'
import {
  booleanAttr, booleanOrNumberAttr, booleanOrNumberOrStringAttr, booleanOrStringAttr, closestAttr,
  jsonAttr, numberAttr, stringAttr,
} from '../element.js'
import { toFailKey } from '../fragment.js'
import { RenderOptions } from '../fragment/render/render_options.js'
import type { PlainObject } from '../util.js'

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
  defaults?: PlainObject | false
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

export class OptionsParser {
  declare _options: PlainObject
  declare _element: Element
  declare _fail: boolean | undefined
  declare _closest: boolean | undefined
  declare _attrPrefix: string
  declare _defaults: PlainObject | false

  /*-
  @constructor up.OptionsParser
  @param {Object} options
    Explicit options passed by a programmatic caller. These usually override everything.

    All parsed options are assigned to this given `options` argument.
  @param {Element} element
    An element from which to parse `[up-attr]` attributes.
  @param {boolean} parserOptions.fail
    Whether to automatically parse `[up-fail-attr]` into `{ failAttr }` option.
  @param {boolean} parserOptions.closest
    Whether to also look for `[up-attr]` matches in the descendants of `element`.
  @param {Object} parserOptions.defaults
    An object of default key/values if an option can neither be found in `options`
    nor can be parsed from `element`.
  @internal
  */
  constructor(element: Element, options: PlainObject, parserOptions: OptionsParserOptions = {}) {
    this._options = options
    this._element = element
    this._fail = parserOptions.fail
    this._closest = parserOptions.closest
    this._attrPrefix = parserOptions.attrPrefix || 'up-'
    this._defaults = parserOptions.defaults ?? {}
  }

  string(key: string, keyOptions?: ParseKeyOptions): void {
    this.parse(stringAttr, key, keyOptions)
  }

  boolean(key: string, keyOptions?: ParseKeyOptions): void {
    this.parse(booleanAttr, key, keyOptions)
  }

  number(key: string, keyOptions?: ParseKeyOptions): void {
    this.parse(numberAttr, key, keyOptions)
  }

  booleanOrString(key: string, keyOptions?: ParseKeyOptions): void {
    this.parse(booleanOrStringAttr, key, keyOptions)
  }

  booleanOrNumber(key: string, keyOptions?: ParseKeyOptions): void {
    this.parse(booleanOrNumberAttr, key, keyOptions)
  }

  booleanOrNumberOrString(key: string, keyOptions?: ParseKeyOptions): void {
    this.parse(booleanOrNumberOrStringAttr, key, keyOptions)
  }

  json(key: string, keyOptions?: ParseKeyOptions): void {
    this.parse(jsonAttr, key, keyOptions)
  }

  // // Currently not needed anywhere
  // callback(key, keyOptions = {}) {
  //   let attrReader = (link, attr) => e.callbackAttr(link, attr, keyOptions)
  //   this.parse(attrReader, key, keyOptions)
  // }

  renderCallback(key: string, keyOptions: ParseKeyOptions = {}): void {
    let attrReader: AttrReader = (link, attr) => RenderOptions.callbackAttr(link, attr, key)
    this.parse(attrReader, key, keyOptions)
  }

  parse(attrReader: AttrReader, key: string, keyOptions: ParseKeyOptions = {}): void {
    const attrNames = wrapList(keyOptions.attr ?? this._attrNameForKey(key))

    // Below we will only set @options[key] = value if value is defined.
    let value = this._options[key]

    for (let attrName of attrNames) {
      value ??= this._parseFromAttr(attrReader, this._element, attrName)
    }

    if (this._defaults !== false) {
      value ??= keyOptions.default ?? this._defaults[key]
    }

    if (isDefined(value)) {
      let normalizeFn = keyOptions.normalize
      if (normalizeFn) {
        value = normalizeFn(value)
      }

      this._options[key] = value
    }

    let failKey
    if (this._fail && (failKey = toFailKey(key))) {
      const failAttrNames = compact(map(attrNames, (attrName) => this._deriveFailAttrName(attrName)))
      this.parse(attrReader, failKey, { ... keyOptions, attr: failAttrNames })
    }
  }

  include(optionsFn: (element: Element, options: PlainObject, parserOptions: OptionsParserOptions) => PlainObject, parserOptions?: OptionsParserOptions): void {
    // let fnResult = optionsFn(this._element, this._options, this._parserOptions)
    let fnResult = optionsFn(this._element, this._options, { defaults: this._defaults, ...parserOptions })
    Object.assign(this._options, fnResult)
  }

  _parseFromAttr(attrValueFn: AttrReader, element: Element, attrName: string): any {
    if (this._closest) {
      return closestAttr(element, attrName, attrValueFn)
    } else {
      return attrValueFn(element, attrName)
    }
  }

  _deriveFailAttrName(attr: string): string | undefined {
    return this._deriveFailAttrNameForPrefix(attr, this._attrPrefix + 'on-') ||
      this._deriveFailAttrNameForPrefix(attr, this._attrPrefix)
  }

  _deriveFailAttrNameForPrefix(attr: string, prefix: string): string | undefined {
    if (attr.startsWith(prefix)) {
      return `${prefix}fail-${attr.substring(prefix.length)}`
    }
  }

  _attrNameForKey(option: string): string {
    return `${this._attrPrefix}${camelToKebabCase(option)}`
  }
}
