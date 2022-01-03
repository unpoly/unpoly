const u = up.util
const e = up.element

up.OptionsParser = class OptionsParser {

  /*-
  @constructor up.OptionsParser
  @param {Object} options
    Explicit options passed by a programmatic caller. These usuually override everything.
  @param {Element} element
    An element from which to parse `[up-attr]` attributes.
  @param {boolean} parserOptions.fail
    Whether to automatically parse `[up-fail-attr]` into `{ failAttr }` option.
  @param {boolean} parserOptions.closest
    Whether to also look for `[up-attr]` matches in the descendants of `element`.
  @param {Object} parserOptions.defaults
    An object of default key/values if an option can neither be found in `options`
    nor can be parsed from `element`.
  @param {Array<string>} parserOptions.only
    An allowlist of option properties that should be parsed.

    This is a performance optimization for fewer DOM accesses.
    There is no guarantee that only these properties will be returned by functions
    like `up.form.submitOptions()`.
  */
  constructor(options, element, parserOptions = {}) {
    this.options = options
    this.element = element
    this.fail = parserOptions.fail
    this.closest = parserOptions.closest
    this.defaults = parserOptions.defaults || {}
    if (parserOptions.only) {
      this.only = u.arrayToSet(parserOptions.only)
    }
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

  parse(attrValueFn, key, keyOptions = {}) {
    if (!this.isKeyAllowed(key)) {
      return
    }

    const attrNames = u.wrapList(keyOptions.attr ?? this.attrNameForKey(key))

    // Below we will only set @options[key] = value if value is defined.
    let value = this.options[key]

    for (let attrName of attrNames) {
      value ??= this.parseFromAttr(attrValueFn, this.element, attrName)
    }

    value ??= keyOptions.default ?? this.defaults[key]

    let normalizeFn = keyOptions.normalize
    if (normalizeFn) {
      value = normalizeFn(value)
    }

    if (u.isDefined(value)) {
      this.options[key] = value
    }

    let failKey
    if (this.fail && (failKey = up.fragment.failKey(key))) {
      const failAttrNames = u.compact(u.map(attrNames, this.deriveFailAttrName))
      this.parse(attrValueFn, failKey, { ... keyOptions, attr: failAttrNames })
    }
  }

  isKeyAllowed(key) {
    return !this.only || this.only.has(key)
  }

  process(key, fn) {
    if (this.isKeyAllowed(key)) {
      fn()
    }
  }

  parseFromAttr(attrValueFn, element, attrName) {
    if (this.closest) {
      return e.closestAttr(element, attrName, attrValueFn)
    } else {
      return attrValueFn(element, attrName)
    }
  }

  deriveFailAttrName(attr) {
    if (attr.indexOf('up-') === 0) {
      return `up-fail-${attr.slice(3)}`
    }
  }

  attrNameForKey(option) {
    return `up-${u.camelToKebabCase(option)}`
  }
}
