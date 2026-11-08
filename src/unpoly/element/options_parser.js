import { camelToKebabCase, compact, isDefined, map, wrapList } from '../util.js'
import {
  booleanAttr, booleanOrNumberAttr, booleanOrNumberOrStringAttr, booleanOrStringAttr, closestAttr,
  jsonAttr, numberAttr, stringAttr,
} from '../element.js'
import { failKey as fragmentFailKey } from '../fragment.js'
import { RenderOptions } from '../fragment/render/render_options.js'

export class OptionsParser {

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
  constructor(element, options, parserOptions = {}) {
    this._options = options
    this._element = element
    this._fail = parserOptions.fail
    this._closest = parserOptions.closest
    this._attrPrefix = parserOptions.attrPrefix || 'up-'
    this._defaults = parserOptions.defaults ?? {}
  }

  string(key, keyOptions) {
    this.parse(stringAttr, key, keyOptions)
  }

  boolean(key, keyOptions) {
    this.parse(booleanAttr, key, keyOptions)
  }

  number(key, keyOptions) {
    this.parse(numberAttr, key, keyOptions)
  }

  booleanOrString(key, keyOptions) {
    this.parse(booleanOrStringAttr, key, keyOptions)
  }

  booleanOrNumber(key, keyOptions) {
    this.parse(booleanOrNumberAttr, key, keyOptions)
  }

  booleanOrNumberOrString(key, keyOptions) {
    this.parse(booleanOrNumberOrStringAttr, key, keyOptions)
  }

  json(key, keyOptions) {
    this.parse(jsonAttr, key, keyOptions)
  }

  // // Currently not needed anywhere
  // callback(key, keyOptions = {}) {
  //   let attrReader = (link, attr) => e.callbackAttr(link, attr, keyOptions)
  //   this.parse(attrReader, key, keyOptions)
  // }

  renderCallback(key, keyOptions = {}) {
    let attrReader = (link, attr) => RenderOptions.callbackAttr(link, attr, key)
    this.parse(attrReader, key, keyOptions)
  }

  parse(attrReader, key, keyOptions = {}) {
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
    if (this._fail && (failKey = fragmentFailKey(key))) {
      const failAttrNames = compact(map(attrNames, (attrName) => this._deriveFailAttrName(attrName)))
      this.parse(attrReader, failKey, { ... keyOptions, attr: failAttrNames })
    }
  }

  include(optionsFn, parserOptions) {
    // let fnResult = optionsFn(this._element, this._options, this._parserOptions)
    let fnResult = optionsFn(this._element, this._options, { defaults: this._defaults, ...parserOptions })
    Object.assign(this._options, fnResult)
  }

  _parseFromAttr(attrValueFn, element, attrName) {
    if (this._closest) {
      return closestAttr(element, attrName, attrValueFn)
    } else {
      return attrValueFn(element, attrName)
    }
  }

  _deriveFailAttrName(attr) {
    return this._deriveFailAttrNameForPrefix(attr, this._attrPrefix + 'on-') ||
      this._deriveFailAttrNameForPrefix(attr, this._attrPrefix)
  }

  _deriveFailAttrNameForPrefix(attr, prefix) {
    if (attr.startsWith(prefix)) {
      return `${prefix}fail-${attr.substring(prefix.length)}`
    }
  }

  _attrNameForKey(option) {
    return `${this._attrPrefix}${camelToKebabCase(option)}`
  }
}

export const api = {
  /** @internal On window.up for the specs. */
  OptionsParser,
}
