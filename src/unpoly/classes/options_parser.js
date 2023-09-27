const u = up.util
const e = up.element

up.OptionsParser = class OptionsParser {

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
  */
  constructor(element, options, parserOptions = {}) {
    this._options = options
    this._element = element
    this._parserOptions = parserOptions // for pass-through in include()
    this._fail = parserOptions.fail
    this._closest = parserOptions.closest
    this._attrPrefix = parserOptions.attrPrefix || 'up-'
    this._defaults = parserOptions.defaults || {}
  }

  string(key, keyOptions) {
    this.parse(e.attr, key, keyOptions)
  }

  boolean(key, keyOptions) {
    this.parse(e.booleanAttr, key, keyOptions)
  }

  number(key, keyOptions) {
    this.parse(e.numberAttr, key, keyOptions)
  }

  booleanOrString(key, keyOptions) {
    this.parse(e.booleanOrStringAttr, key, keyOptions)
  }

  json(key, keyOptions) {
    this.parse(e.jsonAttr, key, keyOptions)
  }

  callback(key, keyOptions = {}) {
    let parser = (link, attr) => e.callbackAttr(link, attr, keyOptions)
    this.parse(parser, key, keyOptions)
  }

  parse(attrValueFn, key, keyOptions = {}) {
    const attrNames = u.wrapList(keyOptions.attr ?? this._attrNameForKey(key))

    // Below we will only set @options[key] = value if value is defined.
    let value = this._options[key]

    for (let attrName of attrNames) {
      value ??= this._parseFromAttr(attrValueFn, this._element, attrName)
    }

    value ??= keyOptions.default ?? this._defaults[key]

    let normalizeFn = keyOptions.normalize
    if (normalizeFn) {
      value = normalizeFn(value)
    }

    if (u.isDefined(value)) {
      this._options[key] = value
    }

    let failKey
    if (this._fail && (failKey = up.fragment.failKey(key))) {
      const failAttrNames = u.compact(u.map(attrNames, (attrName) => this._deriveFailAttrName(attrName)))
      this.parse(attrValueFn, failKey, { ... keyOptions, attr: failAttrNames })
    }
  }

  include(optionsFn) {
    let fnResult = optionsFn(this._element, this._options, this._parserOptions)
    Object.assign(this._options, fnResult)
  }

  _parseFromAttr(attrValueFn, element, attrName) {
    if (this._closest) {
      return e.closestAttr(element, attrName, attrValueFn)
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
    return `${this._attrPrefix}${u.camelToKebabCase(option)}`
  }
}
