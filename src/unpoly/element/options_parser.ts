import * as u from '../util.js'
import * as e from '../element.js'
import { RenderOptions, toFailKey } from '../fragment.js'
import type * as t from './types.js'

export class OptionsParser {
  declare _options: u.PlainObject
  declare _element: Element
  declare _fail?: boolean
  declare _closest?: boolean
  declare _attrPrefix: string
  declare _defaults: u.PlainObject | false

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
  constructor(element: Element, options: u.PlainObject, parserOptions: t.OptionsParserOptions = {}) {
    this._options = options
    this._element = element
    this._fail = parserOptions.fail
    this._closest = parserOptions.closest
    this._attrPrefix = parserOptions.attrPrefix || 'up-'
    this._defaults = parserOptions.defaults ?? {}
  }

  string(key: string, keyOptions?: t.ParseKeyOptions): void {
    this.parse(e.stringAttr, key, keyOptions)
  }

  boolean(key: string, keyOptions?: t.ParseKeyOptions): void {
    this.parse(e.booleanAttr, key, keyOptions)
  }

  number(key: string, keyOptions?: t.ParseKeyOptions): void {
    this.parse(e.numberAttr, key, keyOptions)
  }

  booleanOrString(key: string, keyOptions?: t.ParseKeyOptions): void {
    this.parse(e.booleanOrStringAttr, key, keyOptions)
  }

  booleanOrNumber(key: string, keyOptions?: t.ParseKeyOptions): void {
    this.parse(e.booleanOrNumberAttr, key, keyOptions)
  }

  booleanOrNumberOrString(key: string, keyOptions?: t.ParseKeyOptions): void {
    this.parse(e.booleanOrNumberOrStringAttr, key, keyOptions)
  }

  json(key: string, keyOptions?: t.ParseKeyOptions): void {
    this.parse(e.jsonAttr, key, keyOptions)
  }

  // // Currently not needed anywhere
  // callback(key, keyOptions = {}) {
  //   let attrReader = (link, attr) => e.callbackAttr(link, attr, keyOptions)
  //   this.parse(attrReader, key, keyOptions)
  // }

  renderCallback(key: string, keyOptions: t.ParseKeyOptions = {}): void {
    let attrReader: t.AttrReader = (link, attr) => RenderOptions.renderCallbackAttr(link, attr, key)
    this.parse(attrReader, key, keyOptions)
  }

  parse(attrReader: t.AttrReader, key: string, keyOptions: t.ParseKeyOptions = {}): void {
    const attrNames = u.wrapList(keyOptions.attr ?? this._attrNameForKey(key))

    // Below we will only set @options[key] = value if value is defined.
    let value = this._options[key]

    for (let attrName of attrNames) {
      value ??= this._parseFromAttr(attrReader, this._element, attrName)
    }

    if (this._defaults !== false) {
      value ??= keyOptions.default ?? this._defaults[key]
    }

    if (u.isDefined(value)) {
      let normalizeFn = keyOptions.normalize
      if (normalizeFn) {
        value = normalizeFn(value)
      }

      this._options[key] = value
    }

    let failKey
    if (this._fail && (failKey = toFailKey(key))) {
      const failAttrNames = u.compact(u.map(attrNames, (attrName) => this._deriveFailAttrName(attrName)))
      this.parse(attrReader, failKey, { ... keyOptions, attr: failAttrNames })
    }
  }

  include(optionsFn: (element: Element, options: u.PlainObject, parserOptions: t.OptionsParserOptions) => u.PlainObject, parserOptions?: t.OptionsParserOptions): void {
    // let fnResult = optionsFn(this._element, this._options, this._parserOptions)
    let fnResult = optionsFn(this._element, this._options, { defaults: this._defaults, ...parserOptions })
    Object.assign(this._options, fnResult)
  }

  _parseFromAttr(attrValueFn: t.AttrReader, element: Element, attrName: string): any {
    if (this._closest) {
      return e.closestAttr(element, attrName, attrValueFn)
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
    return `${this._attrPrefix}${u.camelToKebabCase(option)}`
  }
}
