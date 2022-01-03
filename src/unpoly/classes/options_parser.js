const u = up.util
const e = up.element

up.OptionsParser = class OptionsParser {

  constructor(options, element, parserOptions) {
    this.options = options
    this.elements = u.uniq(u.compact(u.wrapList(element)))
    this.fail = parserOptions?.fail
    this.closest = parserOptions?.closest
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
    const attrNames = u.wrapList(keyOptions.attr ?? this.attrNameForKey(key))

    // Below we will only set @options[key] = value if value is defined.
    let value = this.options[key]

    for (let element of this.elements) {
      for (let attrName of attrNames) {
        value ??= this.parseFromAttr(attrValueFn, element, attrName)
      }
    }

    value ??= keyOptions.default

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
